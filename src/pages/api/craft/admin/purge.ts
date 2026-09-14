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
import { db } from '../../../../lib/admin/supabase';
import { can, refusal } from '../../../../lib/pipeline/roles';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  // ── THIS CHECK WAS MISSING, AND IT IS THE ONE BULK DELETE IN THE CONSOLE.
  //
  // Middleware establishes that there IS a session over the whole
  // /api/craft/admin prefix. It cannot know WHICH session, and for most of the
  // console's history that was enough because there was one password and one
  // person. Named accounts changed that and this endpoint did not move with
  // them: any signed-in session could POST `{"apply": true}` and delete every
  // expired row in `events` and `questions` — including the shared-password
  // bootstrap, which holds `operator` and which the administration screen gates
  // out of the retention section entirely.
  //
  // So the screen hid the control from exactly the people who could still call
  // it. That is the "hiding a button is insufficient" failure the brief names,
  // in the place where it costs the most.
  //
  // `admin.retention` is held only by `maintainer`. Checked BEFORE the database
  // is asked for, so a refusal is a 403 rather than a 503 — see the long note
  // in pipeline.ts about why a permission system that stops answering when the
  // database does is an untested one rather than a safe one.
  const who = locals.admin;
  if (!who) return json({ error: 'Not signed in.' }, 401);
  if (!can(who.roles, 'admin.retention')) {
    return json({ error: refusal('admin.retention') }, 403);
  }

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
  // Now says WHO. "How much did we delete and when" is asked after the fact;
  // "and on whose authority" is the next question, and it had no answer.
  console.log(
    JSON.stringify({
      at: 'retention.purged',
      events,
      questions,
      actor: who.kind === 'staff' ? who.id : 'bootstrap',
      at_time: new Date().toISOString(),
    }),
  );

  return json({ ok: true, dryRun: false, events, questions });
};
