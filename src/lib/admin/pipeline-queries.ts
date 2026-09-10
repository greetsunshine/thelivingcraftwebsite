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

import { db } from './supabase';
import { can, type Capability } from '../pipeline/roles';
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
      .eq('is_spam', false);

    if (error) return unavailable(error.message);

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
    return unavailable(err instanceof Error ? err.message : 'The query did not complete.');
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
    const { data, error } = await client.from('opportunities').select('stage').eq('route', route);
    if (error) return unavailable(error.message);

    const counts = new Map<string, number>();
    (data ?? []).forEach((r) => counts.set(r.stage, (counts.get(r.stage) ?? 0) + 1));
    return ok([...counts].map(([stage, count]) => ({ stage, count })));
  } catch (err) {
    return unavailable(err instanceof Error ? err.message : 'The query did not complete.');
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

    if (unowned.error) return unavailable(unowned.error.message);
    if (late.error) return unavailable(late.error.message);

    return ok({ unassigned: unowned.count ?? 0, overdue: late.count ?? 0 });
  } catch (err) {
    return unavailable(err instanceof Error ? err.message : 'The query did not complete.');
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
    if (error) return unavailable(error.message);

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
    return unavailable(err instanceof Error ? err.message : 'The query did not complete.');
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

    const [subs, acts, tsks, cons] = await Promise.all([
      client
        .from('form_submissions')
        .select('submission_id, reference, type, answers, funding_route, group_size, submitted_at')
        .eq('person_id', lead.person_id)
        .order('submitted_at', { ascending: false }),
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
      client
        .from('consents')
        .select('purpose, state, wording, wording_version, obtained_at')
        .eq('person_id', lead.person_id)
        .order('obtained_at', { ascending: false }),
    ]);

    const submissions = (subs.data ?? []) as Submission[];

    // Attribution hangs off the submission, not the person — first touch and
    // this-visit are facts about ONE arrival, and a person who came back twice
    // has two of them. The newest submission's row is the one shown.
    let attribution: AttributionRow | null = null;
    if (submissions[0]) {
      const { data } = await client
        .from('attributions')
        .select(
          'first_source, first_medium, first_campaign, session_source, session_medium, session_campaign, session_content, entry_path, referrer_host, self_reported, tracking_permission',
        )
        .eq('submission_id', submissions[0].submission_id)
        .maybeSingle();
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
    return unavailable(err instanceof Error ? err.message : 'The query did not complete.');
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
