// Apply the retention policy.
//
// Deletes analytics events and visitor questions past their window. Leads and
// learners are deliberately out of scope — those are erased per person, by
// decision, from their own pages. See the Retention section of
// supabase/schema.sql for the reasoning on each table.
//
// The windows live in Postgres as function defaults rather than here, so
// shortening them is a SQL change with no deploy. This endpoint only chooses
// whether to preview or to act.

import type { APIRoute } from 'astro';
import { db } from '../../../lib/admin/supabase';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const client = db();
  if (!client) return json({ error: 'Supabase is not configured.' }, 503);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }

  // Preview is the default. An endpoint whose no-argument behaviour is "delete
  // rows" is one mistyped fetch away from doing it — so acting has to be asked
  // for explicitly.
  const dryRun = body.apply !== true;

  const { data, error } = await client.rpc(dryRun ? 'admin_purge_preview' : 'admin_purge', {});

  if (error) {
    console.error(`purge (${dryRun ? 'preview' : 'apply'}) failed:`, error.message);
    // The 30-day floor in the SQL surfaces here. Passing it through verbatim is
    // right: it names the refused values, which is the whole point of raising.
    return json({ error: error.message.slice(0, 300) }, 500);
  }

  const row = (Array.isArray(data) ? data[0] : data) ?? {};

  if (dryRun) {
    return json({
      ok: true,
      dryRun: true,
      events: Number(row.events_stale ?? 0),
      questions: Number(row.questions_stale ?? 0),
    });
  }

  const events = Number(row.events_deleted ?? 0);
  const questions = Number(row.questions_deleted ?? 0);

  // Logged because it is the one irreversible bulk operation in the console,
  // and "how much did we delete and when" is a question that gets asked after
  // the fact rather than before.
  console.log(
    JSON.stringify({ at: 'retention.purged', events, questions, at_time: new Date().toISOString() }),
  );

  return json({ ok: true, dryRun: false, events, questions });
};
