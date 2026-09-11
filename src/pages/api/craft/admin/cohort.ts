// Opening and closing applications — acceptance case E18.
//
// ───────────────────────────────────────────────────────────────────────────
// CLOSING APPLICATIONS CLOSES ONE ROUTE, NOT THE PAGE.
// ───────────────────────────────────────────────────────────────────────────
//
// E18 in the register: "Application disabled truthfully; enquiries available;
// queued promotional invitations stopped." Three things, and the middle one is
// the one that gets forgotten. Somebody arriving the week after applications
// close still has a question worth answering, and a page that refuses every
// route teaches them to go away permanently rather than ask about the next
// cohort.
//
// This endpoint therefore flips exactly one boolean, `cohorts.application_open`,
// and every consequence of that flip already lives in
// src/lib/pipeline/cohorts.ts — `routeIsOpen()` refuses the application route
// with wording that says what is true, and returns `{ open: true }` for enquiry
// and enterprise without so much as reading the cohort. Nothing about the
// refusal is written here, so the console and the public form cannot drift into
// telling people different things.
//
// The third clause is enforced even while dispatch is off: closing applications
// stops every active or paused sequence linked to this cohort and cancels its
// queued marketing messages. That prevents a queue built before launch from
// becoming a burst when D2 is eventually enabled.
//
// ───────────────────────────────────────────────────────────────────────────
// THE COHORT IS RESOLVED, NEVER ACCEPTED FROM THE REQUEST
// ───────────────────────────────────────────────────────────────────────────
//
// Same rule as the public form, for a different reason. There the danger is a
// hidden input filing applications against a cohort nobody is watching. Here it
// is subtler: if the console could name a cohort id, it could close one row
// while `resolveCohort()` — which is what actually gates the form — returns a
// different one, and the screen would report applications closed while the page
// kept accepting them. So this acts on whatever `resolveCohort()` returns, full
// stop. One resolver, one answer, no way for the two to disagree.
//
// ───────────────────────────────────────────────────────────────────────────
// WHO MAY DO IT
// ───────────────────────────────────────────────────────────────────────────
//
// `write.cohort` — Sunil and the programme owner, per the brief's role table
// ("Programme owner … cohort availability"). Checked here, on the roles in the
// signed cookie, before anything is written. The screen uses the same matrix to
// decide what to draw and that is a courtesy: hiding a button is not
// authorisation.
//
// The shared-password bootstrap is NOT specially refused here, unlike the staff
// endpoint. It holds `operator` by default and so cannot reach this at all; and
// if somebody has widened ADMIN_BOOTSTRAP_ROLES, closing applications is a
// reversible operational act that lands in the audit log attributed to
// `bootstrap (shared password)` — which is itself a finding, and is the correct
// record of what happened. Creating an account is not reversible in the same
// way, which is why that one is refused outright.

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/admin/supabase';
import { can, refusal } from '../../../../lib/pipeline/roles';
import { resolveCohort, routeIsOpen } from '../../../../lib/pipeline/cohorts';
import type { Identity } from '../../../../lib/admin/staff';
import { stopSequence } from '../../../../lib/comms/outbox';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const actorOf = (who: Identity): string =>
  who.kind === 'staff' ? `${who.name} <${who.id}>` : 'bootstrap (shared password)';

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  return t ? t.slice(0, max) : null;
};

async function stopCohortSequences(
  client: NonNullable<ReturnType<typeof db>>,
  cohortId: string,
): Promise<{ ok: boolean; stopped: number; detail: string }> {
  const { data, error } = await client
    .from('comms_sequences')
    .select('sequence_id')
    .eq('cohort_id', cohortId)
    .in('state', ['active', 'paused']);

  if (error) {
    console.error('cohort sequence lookup failed:', error.code ?? 'unknown');
    return { ok: false, stopped: 0, detail: 'The communication queue could not be checked.' };
  }

  let stopped = 0;
  for (const row of data ?? []) {
    const outcome = await stopSequence(
      String(row.sequence_id),
      'applications closed for this cohort',
      client,
    );
    if (!outcome.ok) {
      return {
        ok: false,
        stopped,
        detail: 'Applications are closed, but at least one queued sequence still needs review.',
      };
    }
    stopped += 1;
  }

  return {
    ok: true,
    stopped,
    detail: `${stopped} active or paused sequence${stopped === 1 ? '' : 's'} stopped.`,
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  const who = locals.admin;
  if (!who) return json({ ok: false, error: 'Not signed in.' }, 401);

  if (!can(who.roles, 'write.cohort')) {
    return json({ ok: false, error: refusal('write.cohort') }, 403);
  }

  const client = db();
  if (!client) {
    return json({ ok: false, error: 'The database is not configured for this deployment.' }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Could not read that request.' }, 400);
  }

  if (String(body.action ?? '') !== 'applications') {
    return json({ ok: false, error: 'Unknown action.' }, 400);
  }
  if (typeof body.open !== 'boolean') {
    return json({ ok: false, error: 'Open or closed?' }, 400);
  }

  const open = body.open;
  const reason = clean(body.reason, 500);

  // Read through the same resolver the public form uses. Its three states are
  // kept apart here for the same reason they are kept apart there: a database
  // that did not answer is not a configuration with no cohort in it, and the
  // two need different next steps.
  const lookup = await resolveCohort();

  if (lookup.state === 'unavailable') {
    return json(
      {
        ok: false,
        error:
          'The cohorts table did not answer, so nothing was changed. Applications are in whatever ' +
          'state they were already in — check the storage panel on this page.',
      },
      503,
    );
  }

  if (lookup.state === 'none') {
    return json(
      {
        ok: false,
        error:
          'The cohorts table is reachable and holds no member cohort, so there is nothing to open ' +
          'or close. Run supabase/schema.sql — it seeds exactly one, and only into an empty table.',
      },
      409,
    );
  }

  const cohort = lookup.cohort;

  // Already in the asked-for state. Reported as a no-op rather than as a change,
  // and deliberately NOT written: an audit row saying somebody closed
  // applications that were already closed is noise in the one table that has to
  // stay readable.
  if (cohort.application_open === open) {
    const communications = open
      ? null
      : await stopCohortSequences(client, cohort.cohort_id);
    return json(
      {
        ok: communications?.ok ?? true,
        changed: false,
        open,
        label: cohort.public_label,
        communications,
        message: open
          ? 'Applications were already open. Nothing changed.'
          : communications?.ok
            ? 'Applications were already closed. The communication queue is stopped.'
            : 'Applications were already closed, but the communication queue still needs review.',
      },
      communications && !communications.ok ? 503 : 200,
    );
  }

  const { error } = await client
    .from('cohorts')
    .update({ application_open: open })
    .eq('cohort_id', cohort.cohort_id);

  if (error) return json({ ok: false, error: error.message.slice(0, 300) }, 503);

  // Best-effort audit, same rule as everywhere else: a failed audit row is
  // logged and never reverses the change it describes. Nothing personal goes in
  // it — a cohort id and a boolean.
  try {
    await client.from('audit_log').insert({
      record_type: 'cohort',
      record_id: cohort.cohort_id,
      actor: actorOf(who),
      previous_value: { application_open: cohort.application_open },
      new_value: { application_open: open },
      occurred_at: new Date().toISOString(),
      reason: reason ?? (open ? 'Applications reopened.' : 'Applications closed.'),
    });
  } catch (err) {
    console.error('cohort audit write failed:', err instanceof Error ? err.name : 'unknown');
  }

  // What a visitor will now be told, read back out of the module that will tell
  // them. The screen prints this verbatim, so "truthful wording" is checked
  // against the real sentence rather than against a copy of it.
  const after = { state: 'ok' as const, cohort: { ...cohort, application_open: open } };
  const application = routeIsOpen('application', after);
  const enquiry = routeIsOpen('enquiry', after);
  const communications = open
    ? null
    : await stopCohortSequences(client, cohort.cohort_id);

  return json(
    {
      ok: communications?.ok ?? true,
      changed: true,
      open,
      label: cohort.public_label,
      application: application.open ? null : application.reason,
      enquiryOpen: enquiry.open,
      communications,
    },
    communications && !communications.ok ? 503 : 200,
  );
};
