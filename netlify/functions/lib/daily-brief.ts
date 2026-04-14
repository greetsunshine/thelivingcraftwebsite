/**
 * Daily Brief — deterministic summary of pipeline state + today's agenda.
 *
 * Runs as a cron job. Reads DB, builds an HTML digest, emails the owner, and
 * emits pipeline_review tasks for anything rotting in the pipeline.
 *
 * Uses Orchestrator.notifyOwner for delivery. No Claude calls — just SQL and
 * string building, so it runs within budget even if the monthly ceiling is hit.
 */

import { neon } from '@neondatabase/serverless';
import { notifyOwner, orchCreateTask } from './orchestrator.js';
import { getMonthlySpendUsd, MONTHLY_BUDGET_USD } from './cost-tracker.js';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL must be set');
  return neon(url);
}

export async function runDailyBrief(): Promise<{ tasksEmitted: number; ok: boolean }> {
  const sql = getSql();
  let tasksEmitted = 0;

  // ── Data gathering ────────────────────────────────────────────────────────
  const [
    newLeads24h,
    stuckContacted,
    callsToday,
    openTasksByPriority,
    monthSpend,
  ] = await Promise.all([
    sql`
      SELECT id, name, email, company, service_intent, seniority_score, urgency
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY seniority_score DESC, created_at DESC
    `,
    sql`
      SELECT id, name, email, company, service_intent,
             EXTRACT(EPOCH FROM (NOW() - updated_at))/86400 AS days_stuck
      FROM leads
      WHERE pipeline_stage = 'contacted'
        AND updated_at < NOW() - INTERVAL '7 days'
      ORDER BY updated_at ASC
    `,
    sql`
      SELECT b.id, b.attendee_name, b.attendee_email, b.scheduled_for, b.meeting_url,
             l.service_intent, l.seniority_score
      FROM bookings b
      LEFT JOIN leads l ON l.id = b.lead_id
      WHERE b.status = 'confirmed'
        AND b.scheduled_for >= NOW()
        AND b.scheduled_for < NOW() + INTERVAL '24 hours'
      ORDER BY b.scheduled_for ASC
    `,
    sql`
      SELECT priority, COUNT(*)::int AS count
      FROM tasks
      WHERE status = 'open'
      GROUP BY priority
      ORDER BY priority ASC
    `,
    getMonthlySpendUsd(),
  ]);

  // ── Emit pipeline_review tasks for rotting leads ──────────────────────────
  for (const lead of stuckContacted) {
    const days = Math.round(lead.days_stuck as number);
    const task = await orchCreateTask({
      title: `Stuck in contacted: ${lead.name} (${lead.company ?? 'no company'}) — ${days}d`,
      description: `${lead.service_intent} lead, no movement for ${days} days. Decide: qualify, nudge, or mark lost.`,
      category: 'pipeline_review',
      priority: days >= 14 ? 2 : 3,
      created_by: 'archivist',
      related_lead_id: lead.id as string,
      related_url: '/admin/leads/?stage=contacted',
      dedup_key: `archivist:stuck:${lead.id}:${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}`,
    });
    if (task) tasksEmitted++;
  }

  // ── Emit pipeline_review tasks for calls in next 24h ──────────────────────
  for (const call of callsToday) {
    const task = await orchCreateTask({
      title: `Prep: discovery call with ${call.attendee_name ?? call.attendee_email}`,
      description: `${new Date(call.scheduled_for as string).toLocaleString()} — ${call.service_intent ?? 'unknown intent'}. Meeting: ${call.meeting_url ?? 'no link'}`,
      category: 'pipeline_review',
      priority: 2,
      created_by: 'archivist',
      related_url: call.meeting_url as string | undefined,
      dedup_key: `archivist:call:${call.id}`,
    });
    if (task) tasksEmitted++;
  }

  // ── Build the HTML digest ─────────────────────────────────────────────────
  const priorityCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of openTasksByPriority) {
    priorityCounts[row.priority as number] = row.count as number;
  }
  const totalOpen = Object.values(priorityCounts).reduce((a, b) => a + b, 0);

  const html = buildBriefHtml({
    date: new Date(),
    newLeads24h: newLeads24h as BriefLead[],
    stuckContacted: stuckContacted as BriefStuckLead[],
    callsToday: callsToday as BriefCall[],
    priorityCounts,
    totalOpen,
    monthSpend,
    budget: MONTHLY_BUDGET_USD,
  });

  const text = [
    `Daily Brief — ${new Date().toDateString()}`,
    ``,
    `New leads (24h): ${newLeads24h.length}`,
    `Calls today: ${callsToday.length}`,
    `Stuck in contacted: ${stuckContacted.length}`,
    `Open tasks: ${totalOpen} (P1:${priorityCounts[1]} P2:${priorityCounts[2]} P3:${priorityCounts[3]})`,
    `Anthropic spend: $${monthSpend.toFixed(2)} / $${MONTHLY_BUDGET_USD}`,
  ].join('\n');

  await notifyOwner({
    channel: 'email',
    priority: 3,
    title: `Daily Brief — ${new Date().toDateString()}`,
    body: text,
    htmlBody: html,
  });

  // P1/P2 pings go to Slack so they're not buried in the email
  const urgentCount = priorityCounts[1] + priorityCounts[2];
  if (urgentCount > 0) {
    await notifyOwner({
      channel: 'slack',
      priority: 2,
      title: 'Daily Brief',
      body: `${urgentCount} urgent task(s) open — ${callsToday.length} call(s) today, ${newLeads24h.length} new lead(s) overnight.`,
    });
  }

  return { tasksEmitted, ok: true };
}

interface BriefLead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service_intent: string;
  seniority_score: number;
  urgency: string;
}
interface BriefStuckLead extends BriefLead {
  days_stuck: number;
}
interface BriefCall {
  id: string;
  attendee_name: string | null;
  attendee_email: string;
  scheduled_for: string;
  meeting_url: string | null;
  service_intent: string | null;
  seniority_score: number | null;
}

function buildBriefHtml(data: {
  date: Date;
  newLeads24h: BriefLead[];
  stuckContacted: BriefStuckLead[];
  callsToday: BriefCall[];
  priorityCounts: Record<number, number>;
  totalOpen: number;
  monthSpend: number;
  budget: number;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px;color:#64748b;font-family:monospace;font-size:12px">${label}</td><td style="padding:6px 12px;color:#0f172a;font-weight:600">${value}</td></tr>`;

  const leadRow = (l: BriefLead) =>
    `<li style="margin-bottom:8px"><strong>${escape(l.name)}</strong>${l.company ? ` · ${escape(l.company)}` : ''} — ${l.service_intent} · seniority ${l.seniority_score}/5 · urgency ${l.urgency}<br><span style="color:#64748b;font-size:12px">${escape(l.email)}</span></li>`;

  const stuckRow = (l: BriefStuckLead) =>
    `<li style="margin-bottom:8px"><strong>${escape(l.name)}</strong>${l.company ? ` · ${escape(l.company)}` : ''} — stuck ${Math.round(l.days_stuck)}d in contacted</li>`;

  const callRow = (c: BriefCall) =>
    `<li style="margin-bottom:8px"><strong>${escape(c.attendee_name ?? c.attendee_email)}</strong> at ${new Date(c.scheduled_for).toLocaleTimeString()} — ${c.service_intent ?? 'unknown intent'}${c.meeting_url ? ` · <a href="${c.meeting_url}">Meet link</a>` : ''}</li>`;

  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:24px">
<div style="max-width:640px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="padding:24px;background:#0a0a0f;color:white">
    <p style="margin:0;font-size:11px;font-family:monospace;color:#818cf8;text-transform:uppercase;letter-spacing:0.1em">The Living Craft / Daily Brief</p>
    <h1 style="margin:4px 0 0;font-size:22px">${data.date.toDateString()}</h1>
  </div>

  <div style="padding:24px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#f1f5f9;border-radius:8px">
      ${row('New leads (24h)', String(data.newLeads24h.length))}
      ${row('Discovery calls today', String(data.callsToday.length))}
      ${row('Open tasks', `${data.totalOpen} (P1:${data.priorityCounts[1]} P2:${data.priorityCounts[2]} P3:${data.priorityCounts[3]})`)}
      ${row('Stuck in contacted', String(data.stuckContacted.length))}
      ${row('Anthropic spend', `$${data.monthSpend.toFixed(2)} / $${data.budget}`)}
    </table>

    ${data.callsToday.length > 0 ? `
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin:20px 0 8px">Discovery calls today</h2>
      <ul style="padding-left:20px;margin:0;color:#0f172a">${data.callsToday.map(callRow).join('')}</ul>
    ` : ''}

    ${data.newLeads24h.length > 0 ? `
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin:20px 0 8px">New leads overnight</h2>
      <ul style="padding-left:20px;margin:0;color:#0f172a">${data.newLeads24h.map(leadRow).join('')}</ul>
    ` : ''}

    ${data.stuckContacted.length > 0 ? `
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin:20px 0 8px">Rotting in pipeline</h2>
      <ul style="padding-left:20px;margin:0;color:#0f172a">${data.stuckContacted.map(stuckRow).join('')}</ul>
    ` : ''}

    <p style="margin:24px 0 0;font-size:12px;color:#64748b;text-align:center">
      <a href="https://thelivingcraft.ai/admin/tasks/" style="color:#4f46e5">Open tasks dashboard →</a>
    </p>
  </div>
</div>
</body></html>`;
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
