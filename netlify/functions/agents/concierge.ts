import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { getAnthropicClient, MODELS } from '../lib/anthropic-client.js';
import { runAgentLoop } from '../lib/agent-loop.js';
import { ToolRegistry } from '../lib/tool-executor.js';
import { CONCIERGE_SYSTEM_PROMPT } from '../lib/prompts/concierge.js';
import {
  upsertLeadRecord,
  saveFirstReplyDraft,
  markFirstReplySent,
} from '../lib/db-client.js';
import { orchCreateTask } from '../lib/orchestrator.js';
import { emailNotify } from '../lib/notifiers.js';
import type { AgentResult, FormSubmission, ServiceIntent, Lead, TaskPriority } from '../lib/types.js';

// ─── Tool definitions ────────────────────────────────────────────────────────

const CONCIERGE_TOOLS: Tool[] = [
  {
    name: 'save_first_reply',
    description:
      'Save a personalized first-reply email draft for this lead. Call this AFTER write_crm_record, passing the same lead email so the draft can be linked to the CRM record. Your draft becomes auto-sent if classification_confidence >= 0.8 AND seniority_score >= 3, otherwise held for owner review.',
    input_schema: {
      type: 'object' as const,
      properties: {
        lead_email: { type: 'string', description: "Same email as write_crm_record" },
        subject: { type: 'string', description: 'Short, specific subject line — not "Re: Your inquiry"' },
        body: { type: 'string', description: 'Plain-text reply body, under 150 words, signed "Sunil"' },
      },
      required: ['lead_email', 'subject', 'body'],
    },
  },
  {
    name: 'write_crm_record',
    description:
      'Create or update a lead record in the CRM with your classification results. ' +
      'Call this once you have analyzed the form submission and determined seniority, intent, and urgency.',
    input_schema: {
      type: 'object' as const,
      properties: {
        email: { type: 'string', description: "Lead's email address" },
        name: { type: 'string', description: "Lead's full name" },
        role_title: { type: 'string', description: "Lead's job title (if provided)" },
        company: { type: 'string', description: "Lead's company name (if provided)" },
        service_intent: {
          type: 'string',
          enum: ['training', 'mentoring', 'consulting', 'other'],
          description: 'Classified primary service interest',
        },
        message: { type: 'string', description: 'Original message verbatim from the form' },
        seniority_score: {
          type: 'number',
          description: '1–5 integer. 5=CTO/VP, 4=Director/Principal/Staff, 3=Senior EM/Architect, 2=EM/Senior IC, 1=IC/unknown',
        },
        urgency: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Buying urgency assessment',
        },
        pipeline_stage: {
          type: 'string',
          description: 'Always "new_lead" for first contact',
        },
        classification_confidence: {
          type: 'number',
          description: '0.0–1.0 confidence in the service_intent classification',
        },
      },
      required: [
        'email',
        'name',
        'service_intent',
        'message',
        'seniority_score',
        'urgency',
        'pipeline_stage',
        'classification_confidence',
      ],
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

interface SavedLeadHolder {
  lead: Lead | null;
  replyDraft: { subject: string; body: string } | null;
}

function buildRegistry(holder: SavedLeadHolder): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register('save_first_reply', async (input) => {
    const email = (input.lead_email as string).toLowerCase().trim();
    // Defer DB write until after we know the lead id — we stash the draft and
    // let the outer flow persist it once upsertLeadRecord has returned.
    holder.replyDraft = {
      subject: input.subject as string,
      body: input.body as string,
    };
    if (holder.lead && holder.lead.email.toLowerCase() === email) {
      await saveFirstReplyDraft(holder.lead.id, holder.replyDraft.subject, holder.replyDraft.body);
    }
    return { success: true, note: 'Draft stashed. Will persist once CRM record exists.' };
  });

  registry.register('write_crm_record', async (input) => {
    const lead = await upsertLeadRecord({
      email: input.email as string,
      name: input.name as string,
      role_title: input.role_title as string | undefined,
      company: input.company as string | undefined,
      service_intent: input.service_intent as ServiceIntent,
      message: input.message as string,
      seniority_score: input.seniority_score as number,
      urgency: input.urgency as 'high' | 'medium' | 'low',
      pipeline_stage: 'new_lead',
      classification_confidence: input.classification_confidence as number,
    });

    // Capture for downstream use
    holder.lead = lead;

    // If save_first_reply was called before write_crm_record, flush the stashed draft now
    if (holder.replyDraft) {
      await saveFirstReplyDraft(lead.id, holder.replyDraft.subject, holder.replyDraft.body);
    }

    console.log(`[Concierge] Lead saved — id:${lead.id} intent:${lead.service_intent} seniority:${lead.seniority_score} urgency:${lead.urgency} confidence:${lead.classification_confidence}`);

    return {
      success: true,
      lead_id: lead.id,
      pipeline_stage: lead.pipeline_stage,
      confidence: lead.classification_confidence,
      requires_owner_review: lead.classification_confidence < 0.8,
    };
  });

  return registry;
}

// ─── Agent entry point ───────────────────────────────────────────────────────

export interface ConciergeResult extends AgentResult {
  leadId?: string;
  requiresOwnerReview?: boolean;
}

export async function runConcierge(submission: FormSubmission): Promise<ConciergeResult> {
  const holder: SavedLeadHolder = { lead: null, replyDraft: null };
  const client = getAnthropicClient();
  const registry = buildRegistry(holder);

  // Build the user message with all available form data
  const userMessage = buildSubmissionMessage(submission);

  try {
    const result = await runAgentLoop({
      client,
      model: MODELS.opus,          // Opus — output faces prospects, requires judgment
      system: CONCIERGE_SYSTEM_PROMPT,
      tools: CONCIERGE_TOOLS,
      initialMessages: [{ role: 'user', content: userMessage }],
      executeToolCall: registry.execute,
      maxRounds: 5,
      maxTokens: 1024,
    });

    const saved = holder.lead;
    const draft = holder.replyDraft;

    // ── First-reply auto-send or hold for review ────────────────────────────
    if (saved && draft) {
      const shouldAutoSend =
        saved.classification_confidence >= 0.8 && saved.seniority_score >= 3;

      if (shouldAutoSend) {
        try {
          await emailNotify({
            to: saved.email,
            subject: draft.subject,
            html: replyToHtml(draft.body),
            text: draft.body,
          });
          await markFirstReplySent(saved.id);
          console.log(`[Concierge] First reply auto-sent to ${saved.email}`);
        } catch (err) {
          console.error('[Concierge] Auto-send failed:', err);
          // Fall through — draft is still saved as 'drafted' for manual review
        }
      } else {
        console.log(
          `[Concierge] First reply HELD for review — confidence:${saved.classification_confidence} seniority:${saved.seniority_score}`
        );
      }
    }

    // Emit a follow-up task to the shared queue, priority scaled by seniority + urgency.
    if (saved) {
      const priority = computeFollowupPriority(saved);
      if (priority !== null) {
        await orchCreateTask({
          title: `Reply to ${saved.name}${saved.company ? ` (${saved.company})` : ''} — ${saved.service_intent}`,
          description: `${saved.role_title ?? 'Unknown role'} · seniority ${saved.seniority_score}/5 · urgency ${saved.urgency}\n\n"${saved.message.slice(0, 400)}${saved.message.length > 400 ? '…' : ''}"`,
          category: 'lead_followup',
          priority,
          created_by: 'concierge',
          related_lead_id: saved.id,
          related_url: `/admin/leads/`,
          due_by: priority <= 2 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
          context: {
            service_intent: saved.service_intent,
            seniority_score: saved.seniority_score,
            urgency: saved.urgency,
            confidence: saved.classification_confidence,
          },
          dedup_key: `concierge:lead:${saved.id}`,
        });
      }
    }

    return {
      success: true,
      output: result.output,
      leadId: saved?.id,
      requiresOwnerReview: saved ? saved.classification_confidence < 0.8 : true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Concierge] Error:', error);
    return { success: false, output: '', error };
  }
}

/**
 * Priority rubric for Concierge-created follow-up tasks.
 * Returns null if the lead isn't worth interrupting the owner for
 * (low-seniority + low-urgency gets no task at all — the DB record is enough).
 */
function computeFollowupPriority(lead: Lead): TaskPriority | null {
  const { seniority_score: s, urgency: u } = lead;

  if (s >= 4 && u === 'high') return 1;             // CTO/VP/Director + high urgency
  if (s >= 4) return 2;                             // CTO/VP/Director, any urgency
  if (s >= 3 && u === 'high') return 2;             // Senior EM/Architect, high urgency
  if (s >= 3) return 3;                             // Senior EM/Architect
  if (u === 'high') return 3;                       // Anyone with high urgency
  if (s >= 2) return 4;                             // EM/Senior IC
  return null;                                      // Don't emit a task
}

function replyToHtml(body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const paragraphs = escaped
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 12px">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;color:#0f172a;max-width:560px;line-height:1.55;font-size:14px">${paragraphs}<p style="margin-top:24px;color:#64748b;font-size:12px">The Living Craft · <a href="https://thelivingcraft.ai" style="color:#4f46e5">thelivingcraft.ai</a></p></body></html>`;
}

function buildSubmissionMessage(s: FormSubmission): string {
  const lines = [
    '## Inbound Contact Form Submission',
    '',
    `**Name:** ${s.name}`,
    `**Email:** ${s.email}`,
  ];
  if (s.role) lines.push(`**Role/Title:** ${s.role}`);
  if (s.company) lines.push(`**Company:** ${s.company}`);
  if (s.service_interest) lines.push(`**Service interest (self-reported):** ${s.service_interest}`);
  if (s.source) lines.push(`**CTA clicked:** ${s.source} (specific offering they engaged with — strong signal for service_intent classification)`);
  lines.push('', `**Message:**`, s.message);
  return lines.join('\n');
}
