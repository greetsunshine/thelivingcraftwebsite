// Does the storage actually answer?
//
// This exists because of a specific way the console could lie. Every query in
// queries.ts degrades to an empty result when it errors — deliberately, so one
// slow rollup cannot 500 the whole page. The cost of that choice is that a
// MISSING TABLE and NO ROWS YET render identically: /admin/radar says "never
// run" whether the agent found nothing or the table was never created.
//
// That is the worst kind of bug, because it looks like the correct answer. It
// already cost a diagnosis: after the schema grew new tables, nothing in the
// console could tell you whether the newer half of schema.sql had been applied.
//
// So the console probes what it depends on and says so out loud. Errors here
// are surfaced, never swallowed — this is the one place in the admin surface
// where failing loudly is the whole point.

import { db } from './supabase';
import { capabilities } from './env';

/** Every table the console reads or writes. Keep in step with supabase/schema.sql. */
const TABLES = [
  'events',
  'leads',
  'questions',
  'learners',
  'intake_responses',
  'familiarity_responses',
  'radar_findings',
  'radar_runs',
  'submissions',
  'quiz_responses',
  'session_prompts',
  'outcome_ratings',
  'checkpoint_ratings',
  'pair_drafts',
  'pair_reviews',
  // Threads behind /craft/discussion. Still called `doubts` in Postgres — see
  // the note above the table in supabase/schema.sql.
  'doubts',
  'discussion_replies',
  'feedback',
  'feedback_responses',
  // The cohort pipeline — the public forms and everything downstream of them.
  // These are the ones where a silent failure is worst: the console degrades to
  // empty on error, so a missing table here looks exactly like a quiet week for
  // applications, which is the one thing nobody would think to question.
  'organisations',
  'people',
  'cohorts',
  'form_submissions',
  'opportunities',
  'attributions',
  'consents',
  'activities',
  'tasks',
  'audit_log',
  'staff',
  // Stage 3's evidence. `payments` and `admissions` are the two halves of the
  // enrolment gate, so a missing one here does not merely hide a table — it
  // makes every enrolment unprovable, which is worth a loud banner.
  'meetings',
  'offers',
  'payments',
  'admissions',
  'attendance',
  'nominations',
  'stage_history',
  // Stage 4's store. Dispatch is off (decision D2), but the tables are probed
  // anyway: a missing `comms_suppressions` is the one that matters, because
  // suppression failing open is how somebody who unsubscribed gets mail.
  'message_templates',
  'comms_sequences',
  'comms_messages',
  'comms_suppressions',
  'comms_events',
] as const;

/** Every rollup. A renamed argument breaks these while the tables stay fine. */
const FUNCTIONS = [
  'admin_traffic_daily',
  'admin_traffic_paths',
  'admin_funnel',
] as const;

/**
 * `pipeline_submit` is deliberately NOT probed.
 *
 * Every other entry here is a read. This one writes — a person, a submission,
 * an opportunity and a task — so probing it every sixty seconds would fill the
 * pipeline with synthetic applications, and probing it with arguments designed
 * to fail would tell you nothing about whether the real call works.
 *
 * Its ten tables are all probed above, which is the useful half: if the function
 * is broken because something it writes to is missing, that shows up there. A
 * function that exists and is subtly wrong is what the acceptance cases are for.
 */

export interface Probe {
  name: string;
  kind: 'table' | 'function';
  ok: boolean;
  /** Postgres' own message, trimmed. Usually names the fix precisely. */
  error?: string;
  /** Row count, for tables that answered. Distinguishes "empty" from "broken". */
  rows?: number;
}

export interface Health {
  /** False when the env vars are absent — a different problem with a different fix. */
  configured: boolean;
  probes: Probe[];
  broken: Probe[];
  ok: boolean;
  checkedAt: number;
}

// One probe per minute per instance, not one per page load.
//
// Every admin page renders this, and eleven head-queries on each navigation
// would be a real cost for a diagnostic that changes only when someone runs
// migrations. Sixty seconds is short enough that "I just ran schema.sql" shows
// up while you are still looking at the tab.
const TTL_MS = 60_000;
let cached: Health | null = null;

export async function dbHealth(force = false): Promise<Health> {
  if (!force && cached && Date.now() - cached.checkedAt < TTL_MS) return cached;

  if (!capabilities().data) {
    cached = { configured: false, probes: [], broken: [], ok: false, checkedAt: Date.now() };
    return cached;
  }

  const client = db();
  if (!client) {
    cached = { configured: false, probes: [], broken: [], ok: false, checkedAt: Date.now() };
    return cached;
  }

  const probes = await Promise.all([
    // ── DO NOT PUT `head: true` BACK. IT MADE EVERY MISSING TABLE PROBE GREEN.
    //
    // This is the defect this whole module exists to prevent, committed inside
    // the module itself, and it was invisible for the same reason it is worth
    // a long comment: the output looked exactly like a healthy database.
    //
    // `head: true` makes postgrest-js send a bare HTTP HEAD. PostgREST answers
    // a missing relation with 404 and the 42P01 error in the BODY — but a HEAD
    // response has no body, so the client sees a 404 with an empty string, and
    // postgrest-js has an explicit branch for that shape:
    //
    //     if (res.status === 404 && body === "") {
    //       status = 204; statusText = "No Content";
    //     } else error = { message: body };
    //
    // A 204 with `error: null`. So a table that does not exist returned
    // `ok: true, rows: 0` — reported as "responding, and empty". Against a
    // database where nothing had been created, the console said
    // "37 of 41 responding" and drew no banner. Only the four rollups were
    // caught, because an RPC POSTs a body and its error therefore survives.
    //
    // A GET keeps the body, so the error arrives. `limit(0)` means no rows are
    // transferred — the cost is one round trip and an exact count from the
    // Content-Range header, the same as before, and this asks the actual
    // question: does this relation exist and may I read it.
    ...TABLES.map(async (name): Promise<Probe> => {
      try {
        const { count, error } = await client.from(name).select('*', { count: 'exact' }).limit(0);
        return error
          ? { name, kind: 'table', ok: false, error: error.message.slice(0, 300) }
          : { name, kind: 'table', ok: true, rows: count ?? 0 };
      } catch (err) {
        return { name, kind: 'table', ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'threw' };
      }
    }),

    // Called with the smallest window that still exercises the argument names.
    // A function that exists with a different signature fails here, which is
    // the failure mode a plain "does it exist" check would miss.
    ...FUNCTIONS.map(async (name): Promise<Probe> => {
      try {
        const { error } = await client.rpc(name, { days: 1 });
        return error
          ? { name, kind: 'function', ok: false, error: error.message.slice(0, 300) }
          : { name, kind: 'function', ok: true };
      } catch (err) {
        return { name, kind: 'function', ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'threw' };
      }
    }),

    // Two read-only functions with signatures of their own. Both were invisible
    // until they broke, which is the condition this module exists to remove.
    //
    // The two WRITE functions — `admin_purge` and `pipeline_submit` — are
    // deliberately still absent. Probing them every sixty seconds would delete
    // rows and create applications respectively, and probing them with
    // arguments chosen to fail would prove nothing about the real call.
    (async (): Promise<Probe> => {
      const name = 'admin_purge_preview';
      try {
        const { error } = await client.rpc(name, {});
        return error
          ? { name, kind: 'function', ok: false, error: error.message.slice(0, 300) }
          : { name, kind: 'function', ok: true };
      } catch (err) {
        return { name, kind: 'function', ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'threw' };
      }
    })(),

    (async (): Promise<Probe> => {
      const name = 'enrolment_blockers';
      try {
        // The nil uuid matches no opportunity, so this returns every blocker
        // and touches nothing. A read with a guaranteed-empty subject is the
        // safest way to ask whether a function exists with the right signature.
        const { error } = await client.rpc(name, {
          p_opportunity_id: '00000000-0000-0000-0000-000000000000',
        });
        return error
          ? { name, kind: 'function', ok: false, error: error.message.slice(0, 300) }
          : { name, kind: 'function', ok: true };
      } catch (err) {
        return { name, kind: 'function', ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'threw' };
      }
    })(),

    // Two arguments rather than one, so it needs its own probe.
    (async (): Promise<Probe> => {
      const name = 'admin_traffic_breakdown';
      try {
        const { error } = await client.rpc(name, { days: 1, dim: 'device' });
        return error
          ? { name, kind: 'function', ok: false, error: error.message.slice(0, 300) }
          : { name, kind: 'function', ok: true };
      } catch (err) {
        return { name, kind: 'function', ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'threw' };
      }
    })(),
  ]);

  const broken = probes.filter((p) => !p.ok);
  cached = { configured: true, probes, broken, ok: broken.length === 0, checkedAt: Date.now() };

  if (broken.length > 0) {
    console.error(
      `admin storage health: ${broken.length} broken —`,
      broken.map((b) => `${b.name}: ${b.error}`).join(' | '),
    );
  }

  return cached;
}

/**
 * Postgres says "relation ... does not exist" for a table that was never
 * created. That one has a single, specific fix, and saying it beats making
 * someone read a raw error.
 */
export const looksUnmigrated = (health: Health): boolean =>
  health.broken.some((b) => /does not exist|schema cache/i.test(b.error ?? ''));
