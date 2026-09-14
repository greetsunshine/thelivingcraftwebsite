// What the console reads about the pipeline.
//
// ───────────────────────────────────────────────────────────────────────────
// EVERY QUERY HERE RETURNS A RESULT THAT CAN SAY "I DO NOT KNOW".
// ───────────────────────────────────────────────────────────────────────────
//
// The rest of the console's queries degrade to empty on error, and that is a
// deliberate, sensible rule: one slow rollup must not 500 a page. It also makes
// a missing table and a quiet week render identically, which already cost a
// real diagnosis once — hence the health probe and its banner.
//
// This module cannot afford even that. "No applications this week" and "the
// applications table is unreachable" are the two most consequential facts the
// console reports, and the brief is unambiguous about which way to fail:
//
//   "an unavailable integration must not display zero as if verified"
//   "Dashboard queries show last refresh and errors"
//   "no unknown-as-zero" (acceptance case E14)
//
// So nothing here returns a bare number. Every function returns
// `Answer<T>` — either a value we observed, or a failure with a reason — and
// the screens are written so that an unavailable answer renders as a dash and
// an explanation rather than as a nought.
//
// ───────────────────────────────────────────────────────────────────────────
// AND EVERY READ IS AUTHORISED BEFORE IT RUNS
// ───────────────────────────────────────────────────────────────────────────
//
// The brief: "Authorisation is enforced server-side on reads, exports and
// writes." Reads included, which is easy to skip — a maintainer signed in to
// check an integration has no business reading eight applicants' contact
// details, and hiding the page is not the same as refusing the query.
//
// `listLeads` and `leadDetail` take an Identity and check `read.people`. They
// refuse rather than filtering: a partial result that looks complete is worse
// than a refusal that says what it is.

import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from './supabase';
import { can, type Capability } from '../pipeline/roles';
// `Blocker` is imported rather than restated. The enrolment gate has one shape
// and one authority — the SQL function — and a second declaration of it here
// is how the console and the write path start disagreeing about what a blocker
// is. Same argument as the four copies of `'TBD'` in the teaching surfaces.
import type { Blocker } from '../pipeline/stages';
import type { Identity } from './staff';

/**
 * A value, or the reason there isn't one.
 *
 * `state: 'denied'` is separate from `'unavailable'` on purpose. One is a
 * permission the signed-in person does not hold and will never hold by waiting;
 * the other is a source that may answer in a minute. Rendering them the same
 * way sends somebody to check the database when the answer is "ask Sunil".
 */
export type Answer<T> =
  | { state: 'ok'; value: T; at: string }
  | { state: 'unavailable'; reason: string }
  | { state: 'denied'; reason: string };

const ok = <T>(value: T): Answer<T> => ({ state: 'ok', value, at: new Date().toISOString() });

const unavailable = <T>(reason: string): Answer<T> => ({ state: 'unavailable', reason });

const denied = <T>(reason: string): Answer<T> => ({ state: 'denied', reason });

/**
 * A source failure, said safely. NEVER `error.message`.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * AN ERROR NAMES THE SOURCE AND THE CATEGORY, NEVER THE VALUE
 * ───────────────────────────────────────────────────────────────────────────
 *
 * These reasons are rendered on a console page, and the same string gets copied
 * into a ticket or a chat window, where it travels much further than the record
 * it came from. Two ways a raw error carries personal data out with it:
 *
 *   * PostgREST puts its filter values in the URL, so anything that reports the
 *     failing request — a thrown `fetch` error most of all — is carrying
 *     `people?normalised_email=in.(alice@…,bob@…)` in its text.
 *   * A Postgres message quotes the offending literal: "invalid input syntax
 *     for type uuid: …" is the value, verbatim, in the message.
 *
 * So the reader is told WHICH source did not answer, and the server log gets
 * the Postgres code — which names the category (`42P01` missing table, `28000`
 * bad key) without carrying a value. The same rule import.ts states for its own
 * report: name the line and the field, never what somebody wrote.
 */
const codeOf = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const c = (error as { code?: unknown }).code;
    if (typeof c === 'string' && c) return c;
    const n = (error as { name?: unknown }).name;
    if (typeof n === 'string' && n) return n;
  }
  return 'unknown';
};

export function sourceFailed(what: string, error: unknown): string {
  console.error(`console read failed [${what}]:`, codeOf(error));
  return `The ${what} did not answer. Its error code is in the server log — the message itself is withheld here because it can carry a record.`;
}

/** The one gate. Returns null when allowed, an Answer when not. */
function gate<T>(who: Identity | undefined, capability: Capability): Answer<T> | null {
  if (!who) return denied('Not signed in.');
  if (!can(who.roles, capability)) {
    return denied('Your roles do not include reading this.');
  }
  return null;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface Totals {
  applications: number;
  enquiries: number;
  enterprise: number;
  /**
   * DISTINCT PEOPLE with at least one application for the current cohort — not
   * a count of application rows.
   *
   * The operating guide separates these deliberately: "Applications saved" is
   * submissions, "Unique applicants" is person/cohort pairs. A repeat
   * application from the same person updates the review context and keeps the
   * submission history, and still counts ONE applicant. Reporting rows as
   * people is how a pipeline of five looks like a pipeline of eight.
   */
  applicants: number;
}

/**
 * The ceiling on a count taken in TypeScript, and what happens at it.
 *
 * CLAUDE.md: "Rollups are SQL functions, because aggregating in TypeScript
 * means a row cap that silently truncates." These two counts are not yet SQL
 * functions, and PostgREST applies a server-side row cap of its own — so a
 * `.select()` with no limit comes back SHORT, with no error and no signal, and
 * `rows.filter(…).length` then reports a number that is simply too small. A
 * dashboard figure that is quietly wrong is worse than one that is missing:
 * unknown-as-zero is the same lie with the numerals filled in.
 *
 * So the query asks for one row MORE than we are prepared to count. Getting it
 * means the count could not be taken completely, and the honest answer is
 * `unavailable` with the reason — never the short number.
 */
const COUNT_CAP = 5_000;

export async function totals(who: Identity | undefined, days = 30): Promise<Answer<Totals>> {
  const stop = gate<Totals>(who, 'read.dashboard');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  try {
    const { data, error } = await client
      .from('form_submissions')
      .select('type, person_id, cohort_id')
      .gte('submitted_at', since)
      // Test and spam rows are excluded from every total, and the exclusion is
      // visible on the screen rather than silent — the operating guide asks for
      // exactly that: "test/spam exclusions visible".
      .eq('is_test', false)
      .eq('is_spam', false)
      .limit(COUNT_CAP + 1);

    if (error) return unavailable(sourceFailed('submissions table', error));

    if ((data?.length ?? 0) > COUNT_CAP) {
      return unavailable(
        `More than ${COUNT_CAP.toLocaleString('en-GB')} submissions fall in this window, which is more than this ` +
          'count can read in one go. Choose a shorter period. A figure taken from a truncated read would be ' +
          'wrong and would look right.',
      );
    }

    const rows = data ?? [];
    const applicantPairs = new Set(
      rows
        .filter((r) => r.type === 'application' && r.person_id)
        .map((r) => `${r.person_id}:${r.cohort_id ?? 'none'}`),
    );

    return ok({
      applications: rows.filter((r) => r.type === 'application').length,
      enquiries: rows.filter((r) => r.type === 'enquiry').length,
      enterprise: rows.filter((r) => r.type === 'enterprise').length,
      applicants: applicantPairs.size,
    });
  } catch (err) {
    return unavailable(sourceFailed('query', err));
  }
}

export interface StageCount {
  stage: string;
  count: number;
}

/**
 * The pipeline right now.
 *
 * A SNAPSHOT, and the screen must label it as one. The operating guide is
 * explicit that current-stage counts and period activity may not be combined
 * into one funnel: "Do not combine current-stage counts with period activity in
 * one conversion funnel." Six people at 'offer' today is not six offers made
 * this month, and a chart that implies otherwise is a wrong number in a shape
 * that looks authoritative.
 */
export async function pipelineNow(
  who: Identity | undefined,
  route: 'member' | 'enterprise' = 'member',
): Promise<Answer<StageCount[]>> {
  const stop = gate<StageCount[]>(who, 'read.dashboard');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  try {
    const { data, error } = await client
      .from('opportunities')
      .select('stage')
      .eq('route', route)
      // Same cap and the same reason as `totals` — see COUNT_CAP above. A stage
      // snapshot built from a truncated read draws a shorter bar and says
      // nothing about it.
      .limit(COUNT_CAP + 1);
    if (error) return unavailable(sourceFailed('opportunities table', error));

    if ((data?.length ?? 0) > COUNT_CAP) {
      return unavailable(
        `There are more than ${COUNT_CAP.toLocaleString('en-GB')} ${route} records, which is more than this snapshot ` +
          'can count in one read. The counts are withheld rather than shown short.',
      );
    }

    const counts = new Map<string, number>();
    (data ?? []).forEach((r) => counts.set(r.stage, (counts.get(r.stage) ?? 0) + 1));
    return ok([...counts].map(([stage, count]) => ({ stage, count })));
  } catch (err) {
    return unavailable(sourceFailed('query', err));
  }
}

export interface Attention {
  unassigned: number;
  overdue: number;
}

/** The two things that mean somebody is waiting on us. */
export async function needsAttention(who: Identity | undefined): Promise<Answer<Attention>> {
  const stop = gate<Attention>(who, 'read.dashboard');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const now = new Date().toISOString();

  try {
    const [unowned, late] = await Promise.all([
      client.from('opportunities').select('opportunity_id', { count: 'exact', head: true }).is('owner', null),
      client
        .from('tasks')
        .select('task_id', { count: 'exact', head: true })
        .is('completed_at', null)
        .lt('due_at', now),
    ]);

    if (unowned.error) return unavailable(sourceFailed('opportunities table', unowned.error));
    if (late.error) return unavailable(sourceFailed('tasks table', late.error));

    return ok({ unassigned: unowned.count ?? 0, overdue: late.count ?? 0 });
  } catch (err) {
    return unavailable(sourceFailed('query', err));
  }
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export interface LeadRow {
  opportunity_id: string;
  person_id: string | null;
  name: string | null;
  email: string | null;
  organisation: string | null;
  route: string;
  stage: string;
  owner: string | null;
  next_action: string | null;
  due_at: string | null;
  stage_entered_at: string | null;
  updated_at: string | null;
}

export interface LeadFilters {
  route?: string;
  stage?: string;
  owner?: string;
  /** Name, email or organisation. Matched case-insensitively. */
  search?: string;
  limit?: number;
}

export async function listLeads(
  who: Identity | undefined,
  filters: LeadFilters = {},
): Promise<Answer<LeadRow[]>> {
  // read.people, not read.dashboard. This returns contact details, and the
  // maintainer role deliberately does not hold it.
  const stop = gate<LeadRow[]>(who, 'read.people');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  try {
    let query = client
      .from('opportunities')
      .select(
        'opportunity_id, person_id, route, stage, owner, next_action, due_at, stage_entered_at, updated_at, people(name, normalised_email), organisations(name)',
      )
      .order('updated_at', { ascending: false })
      .limit(Math.min(filters.limit ?? 100, 500));

    if (filters.route) query = query.eq('route', filters.route);
    if (filters.stage) query = query.eq('stage', filters.stage);
    if (filters.owner) query = query.eq('owner', filters.owner);

    const { data, error } = await query;
    if (error) return unavailable(sourceFailed('lead list', error));

    type Joined = Omit<LeadRow, 'name' | 'email' | 'organisation'> & {
      people?: { name: string | null; normalised_email: string | null } | null;
      organisations?: { name: string | null } | null;
    };

    let rows: LeadRow[] = ((data ?? []) as unknown as Joined[]).map((r) => ({
      opportunity_id: r.opportunity_id,
      person_id: r.person_id,
      name: r.people?.name ?? null,
      email: r.people?.normalised_email ?? null,
      organisation: r.organisations?.name ?? null,
      route: r.route,
      stage: r.stage,
      owner: r.owner,
      next_action: r.next_action,
      due_at: r.due_at,
      stage_entered_at: r.stage_entered_at,
      updated_at: r.updated_at,
    }));

    // Search is applied here rather than in the query because it spans a join
    // across three tables and PostgREST's `or` across embedded resources is
    // fragile enough that a silently-wrong filter is a real risk. The row cap
    // above bounds it; when this list outgrows that cap, the search belongs in
    // a SQL function, not in a longer chain of client-side filters.
    const term = filters.search?.trim().toLowerCase();
    if (term) {
      rows = rows.filter((r) =>
        [r.name, r.email, r.organisation].some((v) => v?.toLowerCase().includes(term)),
      );
    }

    return ok(rows);
  } catch (err) {
    return unavailable(sourceFailed('query', err));
  }
}

// ---------------------------------------------------------------------------
// Lead detail
// ---------------------------------------------------------------------------

export interface Submission {
  submission_id: string;
  reference: string | null;
  type: string;
  answers: Record<string, string> | null;
  funding_route: string | null;
  group_size: number | null;
  submitted_at: string;
}

export interface ActivityRow {
  activity_id: string;
  type: string;
  actor: string | null;
  occurred_at: string;
  notes: string | null;
}

export interface TaskRow {
  task_id: string;
  owner: string | null;
  description: string | null;
  due_at: string | null;
  completed_at: string | null;
}

export interface AttributionRow {
  first_source: string | null;
  first_medium: string | null;
  first_campaign: string | null;
  session_source: string | null;
  session_medium: string | null;
  session_campaign: string | null;
  session_content: string | null;
  entry_path: string | null;
  referrer_host: string | null;
  self_reported: string | null;
  tracking_permission: boolean;
}

export interface ConsentRow {
  purpose: string;
  state: string;
  wording: string;
  wording_version: string;
  obtained_at: string;
}

export interface LeadDetail {
  lead: LeadRow;
  submissions: Submission[];
  activities: ActivityRow[];
  tasks: TaskRow[];
  attribution: AttributionRow | null;
  consents: ConsentRow[];
}

export async function leadDetail(
  who: Identity | undefined,
  opportunityId: string,
): Promise<Answer<LeadDetail>> {
  const stop = gate<LeadDetail>(who, 'read.people');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  try {
    const list = await listLeads(who, { limit: 500 });
    if (list.state !== 'ok') return list as Answer<LeadDetail>;

    const lead = list.value.find((r) => r.opportunity_id === opportunityId);
    // A guessed id gets "not found", never another person's record. The brief
    // asks for this about references; the same rule holds for internal ids.
    if (!lead) return unavailable('No such lead, or it is outside the current window.');

    // ── THE TWO PERSON-KEYED READS ARE SKIPPED WHEN THERE IS NO PERSON ──────
    //
    // `.eq('person_id', null)` is not "where person_id is null" in PostgREST —
    // supabase-js serialises it as the literal string, so the request becomes
    // `person_id=eq.null` against a uuid column and the database refuses it.
    // The error was then discarded and the page drew "No consent record" and
    // "No submission is joined to this record", which happen to be true for a
    // lead with nobody on it but were being printed for the wrong reason.
    //
    // So: ask only when there is somebody to ask about. An empty list here is
    // then a real absence rather than a refused query rendered as one.
    const hasPerson = Boolean(lead.person_id);

    const [subs, acts, tsks, cons] = await Promise.all([
      hasPerson
        ? client
            .from('form_submissions')
            .select('submission_id, reference, type, answers, funding_route, group_size, submitted_at')
            .eq('person_id', lead.person_id as string)
            .order('submitted_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      client
        .from('activities')
        .select('activity_id, type, actor, occurred_at, notes')
        .eq('opportunity_id', opportunityId)
        .order('occurred_at', { ascending: false }),
      client
        .from('tasks')
        .select('task_id, owner, description, due_at, completed_at')
        .eq('opportunity_id', opportunityId)
        .order('due_at', { ascending: true }),
      hasPerson
        ? client
            .from('consents')
            .select('purpose, state, wording, wording_version, obtained_at')
            .eq('person_id', lead.person_id as string)
            .order('obtained_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    // ── AND AN ERROR ON ANY OF THEM IS NOT AN EMPTY LIST ────────────────────
    //
    // These four were read as `(x.data ?? [])` with the error dropped on the
    // floor, so an unreachable `consents` table rendered as "No consent record.
    // That is not a 'no' …" and an unreachable `activities` table as "Nothing
    // recorded against this lead yet." Both are definite statements about a
    // person, made out of a failed query — which is acceptance case E14 exactly,
    // inside the one screen where the stakes are highest. The whole record now
    // comes back `unavailable`, which the page already renders as such.
    for (const [what, result] of [
      ['submissions table', subs],
      ['activities table', acts],
      ['tasks table', tsks],
      ['consents table', cons],
    ] as const) {
      if (result.error) return unavailable(sourceFailed(what, result.error));
    }

    const submissions = (subs.data ?? []) as Submission[];

    // Attribution hangs off the submission, not the person — first touch and
    // this-visit are facts about ONE arrival, and a person who came back twice
    // has two of them. The newest submission's row is the one shown.
    let attribution: AttributionRow | null = null;
    if (submissions[0]) {
      const { data, error } = await client
        .from('attributions')
        .select(
          'first_source, first_medium, first_campaign, session_source, session_medium, session_campaign, session_content, entry_path, referrer_host, self_reported, tracking_permission',
        )
        .eq('submission_id', submissions[0].submission_id)
        .maybeSingle();
      // Same reason as the four above. A null attribution is drawn as "nothing
      // was recorded, and reading it as direct would invent a source" — a
      // definite claim, which a failed read is not entitled to make.
      if (error) return unavailable(sourceFailed('attributions table', error));
      attribution = (data as AttributionRow) ?? null;
    }

    return ok({
      lead,
      submissions,
      activities: (acts.data ?? []) as ActivityRow[],
      tasks: (tsks.data ?? []) as TaskRow[],
      attribution,
      consents: (cons.data ?? []) as ConsentRow[],
    });
  } catch (err) {
    return unavailable(sourceFailed('query', err));
  }
}

/** The stages, in order, for both routes. Mirrors the brief's two lists. */
export const MEMBER_STAGES = [
  'enquiry',
  'application_received',
  'qualification',
  'technical_review',
  'offer',
  'enrolled',
] as const;

export const ENTERPRISE_STAGES = [
  'enquiry',
  'qualification',
  'technical_scoping',
  'quote',
  'order_agreed',
  'delivery_coordination',
  'closed',
] as const;

/** Side states, which are not positions on the line and never sort onto it. */
export const SIDE_STATES = ['on_hold', 'unsuitable', 'withdrawn', 'closed'] as const;

export const stageLabel = (stage: string): string =>
  stage.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

// ---------------------------------------------------------------------------
// Stage 3 — the evidence behind a stage
// ---------------------------------------------------------------------------
//
// Seven more reads and the gate function. Same `Answer` contract as everything
// above: a value we observed, or the reason there is not one.
//
// TWO GATING DECISIONS, AND NEITHER IS ARBITRARY.
//
//   * `offers` and `payments` need `read.finance`, which the OPERATOR
//     deliberately does not hold. The person who works this pipeline every day
//     sees the lead and not the money. That has to render as `denied` — "not
//     permitted, finance can" — and never as an empty table, because an
//     operator reading an empty payments table concludes nobody has paid. That
//     is unknown-as-zero wearing a different hat, and it is the mistake the
//     brief names: "do not infer payment from an offer or receipt email."
//
//   * `enrolmentBlockers` needs only `read.people`, which the operator DOES
//     hold, and that is deliberate too. It reports the PRESENCE of evidence and
//     never an amount. "No finance-confirmed payment" is exactly what the
//     person chasing a lead has to know before they ask Sunil to enrol
//     somebody; withholding it would mean the gate is discovered by being
//     refused at it, which is the failure the console exists to remove. The
//     figures stay behind `read.finance`, where they belong.
//
// `attendance` hangs off the PERSON, not the opportunity — the schema keys it
// that way because somebody attends a cohort, not a sales record. A lead with
// no person joined to it cannot be asked the question at all, so it answers
// `unavailable` with that reason rather than an empty list, which would read
// as "did not attend".

/**
 * The shape every read below shares.
 *
 * Written once because the interesting part of each of these functions is its
 * table, its columns and its capability — and seven copies of the same
 * try/catch is seven chances for one of them to quietly return `[]` on an
 * error, which is the single thing this module exists to prevent.
 */
async function listRows<T>(
  who: Identity | undefined,
  capability: Capability,
  run: (
    client: SupabaseClient,
  ) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
): Promise<Answer<T[]>> {
  const stop = gate<T[]>(who, capability);
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  try {
    const { data, error } = await run(client);
    if (error) return unavailable(sourceFailed('record', error));
    return ok((data ?? []) as T[]);
  } catch (err) {
    return unavailable(sourceFailed('query', err));
  }
}

// ---- meetings -------------------------------------------------------------

export interface MeetingRow {
  meeting_id: string;
  scheduled_at: string | null;
  status: string;
  /** When it ACTUALLY happened. Never derived from `scheduled_at`. */
  held_at: string | null;
  outcome: string | null;
  next_action: string | null;
  recorded_by: string | null;
}

export const meetings = (who: Identity | undefined, opportunityId: string) =>
  listRows<MeetingRow>(who, 'read.people', (c) =>
    c
      .from('meetings')
      .select('meeting_id, scheduled_at, status, held_at, outcome, next_action, recorded_by')
      .eq('opportunity_id', opportunityId)
      .order('scheduled_at', { ascending: false }),
  );

// ---- offers ---------------------------------------------------------------

export interface OfferRow {
  offer_id: string;
  version: number;
  supersedes: string | null;
  approved_by: string;
  approved_at: string;
  currency: string;
  /** Minor units. Never a float, and never added across currencies. */
  amount_minor: number;
  term_reference: string | null;
  accepted: boolean;
  accepted_at: string | null;
}

export const offers = (who: Identity | undefined, opportunityId: string) =>
  listRows<OfferRow>(who, 'read.finance', (c) =>
    c
      .from('offers')
      .select(
        'offer_id, version, supersedes, approved_by, approved_at, currency, amount_minor, term_reference, accepted, accepted_at',
      )
      .eq('opportunity_id', opportunityId)
      .order('version', { ascending: false }),
  );

// ---- payments -------------------------------------------------------------

export interface PaymentRow {
  payment_id: string;
  offer_id: string | null;
  type: 'receipt' | 'refund';
  currency: string;
  amount_minor: number;
  invoice_reference: string | null;
  evidence_reference: string | null;
  confirmed_by: string;
  /** The transaction date, which is not the day somebody typed it in. */
  received_at: string;
  created_at: string;
}

export const payments = (who: Identity | undefined, opportunityId: string) =>
  listRows<PaymentRow>(who, 'read.finance', (c) =>
    c
      .from('payments')
      .select(
        'payment_id, offer_id, type, currency, amount_minor, invoice_reference, evidence_reference, confirmed_by, received_at, created_at',
      )
      .eq('opportunity_id', opportunityId)
      .order('received_at', { ascending: false }),
  );

export interface CurrencyNet {
  currency: string;
  receiptsMinor: number;
  refundsMinor: number;
  netMinor: number;
}

/**
 * Receipts minus refunds, PER CURRENCY, computed at read time.
 *
 * The operating guide is explicit that cross-currency amounts are never added,
 * so this returns one row per currency and there is deliberately no grand total
 * for a caller to reach for. Adding a rupee figure to a dirham one produces a
 * number that is wrong in a shape that looks authoritative.
 */
export function netByCurrency(rows: readonly PaymentRow[]): CurrencyNet[] {
  const by = new Map<string, CurrencyNet>();
  for (const r of rows) {
    const cur = by.get(r.currency) ?? {
      currency: r.currency,
      receiptsMinor: 0,
      refundsMinor: 0,
      netMinor: 0,
    };
    if (r.type === 'refund') cur.refundsMinor += r.amount_minor;
    else cur.receiptsMinor += r.amount_minor;
    cur.netMinor = cur.receiptsMinor - cur.refundsMinor;
    by.set(r.currency, cur);
  }
  return [...by.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

/**
 * Minor units rendered as money, with the exponent taken from the currency.
 *
 * 120000 is Rs 1,200.00 and 120000 is also 120,000 yen — the exponent is a
 * property of the currency, not a constant 2, and hard-coding two decimal
 * places is how a JPY figure ends up a hundredfold wrong. An unrecognised code
 * falls back to the raw minor units, labelled as such, rather than guessing.
 *
 * The stored record is ALWAYS the minor-unit integer; this is a reading aid and
 * the screens print both, never this alone.
 */
export function formatMinor(currency: string, minor: number): string {
  try {
    const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency });
    const digits = fmt.resolvedOptions().maximumFractionDigits ?? 2;
    return fmt.format(minor / 10 ** digits);
  } catch {
    return `${currency} ${minor} (minor units)`;
  }
}

// ---- admissions -----------------------------------------------------------

export interface AdmissionRow {
  admission_id: string;
  decision: 'admitted' | 'declined';
  decided_by: string;
  decided_at: string;
  note: string | null;
}

export const admissions = (who: Identity | undefined, opportunityId: string) =>
  listRows<AdmissionRow>(who, 'read.people', (c) =>
    c
      .from('admissions')
      .select('admission_id, decision, decided_by, decided_at, note')
      .eq('opportunity_id', opportunityId)
      .order('decided_at', { ascending: false }),
  );

// ---- attendance -----------------------------------------------------------

export interface AttendanceRow {
  attendance_id: string;
  session_id: string | null;
  confirmation_response: string | null;
  confirmed_at: string | null;
  attended: boolean | null;
  recorded_by: string | null;
  occurred_on: string | null;
}

/**
 * Keyed by PERSON, because that is what the schema keys it by and what the fact
 * is about. A lead with nobody joined to it cannot be asked.
 */
export async function attendance(
  who: Identity | undefined,
  personId: string | null,
): Promise<Answer<AttendanceRow[]>> {
  const stop = gate<AttendanceRow[]>(who, 'read.people');
  if (stop) return stop;
  if (!personId) {
    return unavailable(
      'No person is joined to this record, so there is nobody whose attendance could be read. That is not the same as not having attended.',
    );
  }
  return listRows<AttendanceRow>(who, 'read.people', (c) =>
    c
      .from('attendance')
      .select(
        'attendance_id, session_id, confirmation_response, confirmed_at, attended, recorded_by, occurred_on',
      )
      .eq('person_id', personId)
      .order('occurred_on', { ascending: false }),
  );
}

// ---- nominations ----------------------------------------------------------

export interface NominationRow {
  nomination_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  note: string | null;
  created_at: string;
}

export const nominations = (who: Identity | undefined, opportunityId: string) =>
  listRows<NominationRow>(who, 'read.people', (c) =>
    c
      .from('nominations')
      .select('nomination_id, name, email, role, note, created_at')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: true }),
  );

// ---- stage history --------------------------------------------------------

export interface StageHistoryRow {
  entry_id: string;
  from_stage: string | null;
  to_stage: string;
  actor: string;
  reason: string | null;
  is_reversal: boolean;
  occurred_at: string;
}

export const stageHistory = (who: Identity | undefined, opportunityId: string) =>
  listRows<StageHistoryRow>(who, 'read.people', (c) =>
    c
      .from('stage_history')
      .select('entry_id, from_stage, to_stage, actor, reason, is_reversal, occurred_at')
      .eq('opportunity_id', opportunityId)
      .order('occurred_at', { ascending: false }),
  );

// ---- the enrolment gate ---------------------------------------------------

/**
 * What is still missing before this person could be enrolled.
 *
 * The AUTHORITY is the SQL function, not this file and not the console: ask the
 * question at the moment it matters and the answer cannot go stale, cannot be
 * set by hand, and cannot disagree with the tables it is drawn from.
 *
 * An empty list means nothing is missing. It does NOT mean somebody is
 * enrolled — that is still a deliberate act by Sunil, and the two must not be
 * conflated on screen.
 *
 * An error here must never read as "nothing is blocking it". `Answer` carries
 * that distinction and the screen keeps it: a gate that did not answer is a
 * reason not to proceed, not a green light.
 */
export const enrolmentBlockers = (who: Identity | undefined, opportunityId: string) =>
  listRows<Blocker>(who, 'read.people', (c) =>
    c.rpc('enrolment_blockers', { p_opportunity_id: opportunityId }),
  );
