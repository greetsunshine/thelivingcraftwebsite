// The durable outbox, the calendar clock, and the one seam that is switched off.
//
// ───────────────────────────────────────────────────────────────────────────
// NOTHING IN THIS FILE SENDS ANYTHING. `deliver()` IS THE WHOLE SEAM.
// ───────────────────────────────────────────────────────────────────────────
//
// Decision D2 is open: no sending provider, no verified sending domain, no
// monitored reply mailbox. So this module builds a message, schedules it,
// re-checks it, claims it — and then calls one function that returns
// `{ kind: 'disabled' }`. Everything an outbox has to get right is here and
// exercisable. The only missing piece is a provider adapter.
//
// Turning it on is:
//   1. the preconditions in eligibility.ts, all of them, and
//   2. an implementation of `deliver()` for the chosen provider.
//
// Nothing else in this file changes, and nothing outside it needs to know which
// provider was chosen.
//
// ───────────────────────────────────────────────────────────────────────────
// THE ORDER OF THE TWO STEPS IN THE SWEEP IS LOAD-BEARING
// ───────────────────────────────────────────────────────────────────────────
//
// CHECK, THEN CLAIM. Never claim first.
//
// The message state machine is one-way by trigger: 'queued' (10) may become
// 'sending' (20), and 'sending' may never become 'queued' again — the single
// door in the other direction is 'unknown' → 'queued' as part of a
// reconciliation. So a sweep that claimed a message first and then discovered
// it was not eligible would have left it stuck in 'sending' with no legal move
// back, for a message that never went anywhere.
//
// That ordering is also exactly what the brief asks for — the second check runs
// "immediately before dispatch" — so the correct code and the safe code are the
// same code. With dispatch off, the check runs, its verdict is acted on, and
// the claim never happens: `runDispatchSweep()` today is a rehearsal that still
// enforces the second check, still cancels messages to people who withdrew, and
// still stops sequences that should have stopped.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT "CALENDAR DAYS" MEANS, AND WHY IT IS NOT 24-HOUR MULTIPLES
// ───────────────────────────────────────────────────────────────────────────
//
// "Day offsets are calendar days after a saved, eligible submission. Queue
// nurture at 10:00 Asia/Kolkata on the corresponding day."
//
// A submission at 23:00 and one at 01:00 are two hours apart and a day apart in
// the reader's calendar. Adding `2 * 86400000` to each produces 23:00 and 01:00
// two days later — one arriving at bedtime, one in the middle of the night, and
// the "day 2" they are both labelled with means two different things. See
// `nurtureSlot()`.

import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../admin/supabase';
import { can, type Capability } from '../pipeline/roles';
import type { Identity } from '../admin/staff';
// Imported as a TYPE, so there is no runtime coupling to the console's query
// module — and so that `Answer` has exactly one definition in this codebase.
// A second declaration of it here is how two screens start disagreeing about
// what 'unavailable' means.
import type { Answer } from '../admin/pipeline-queries';
import {
  checkEligibility,
  dispatchSwitch,
  replyDetectionAvailable,
  type Effect,
  type Eligibility,
  type Subject,
} from './eligibility';
import {
  PACKAGE_VERSION,
  nurtureFor,
  receiptFor,
  renderMessage,
  templateFor,
  templateRow,
  TEMPLATES,
  verifyStored,
  type PackageTemplate,
  type StoredTemplate,
  type TemplateRoute,
} from './templates';
import { available as unsubscribeAvailable } from './unsubscribe';

// ---------------------------------------------------------------------------
// Constants that are decisions
// ---------------------------------------------------------------------------

/** Bounded retries. The count lives on the row; the ceiling lives here. */
export const MAX_ATTEMPTS = 5;

/** How many due messages one sweep will consider. Bounded so a backlog cannot become a burst. */
export const SWEEP_LIMIT = 50;

/** Asia/Kolkata is a fixed +05:30 and has no daylight saving. See `nurtureSlot()`. */
const IST_OFFSET_MIN = 330;

/** The hour nurture is queued for, in Asia/Kolkata. From the brief. */
const QUEUE_HOUR_IST = 10;

/**
 * Gates whose block means "do not create this message at all", as opposed to
 * "create it and hold it".
 *
 * QUEUE TIME IS PERMISSIVE ON PURPOSE, and this is the exception list.
 *
 * The general rule: a queue-time block that might stop applying — a template
 * not yet approved, a source that did not answer — still produces a row, and
 * the dispatch check decides. The outbox is durable so that a saved lead and
 * its email tasks cannot diverge silently, and refusing to write a row because
 * a table was slow is exactly that divergence.
 *
 * The exceptions are blocks that will not stop applying by waiting, plus
 * `service`: "if reply detection or unsubscribe processing is unavailable,
 * disable nurture" — DISABLE, not queue-and-hope. Queueing a sequence nobody
 * can opt out of, in the hope the mailbox appears, is the degraded mode that
 * sentence exists to forbid.
 */
const NEVER_QUEUE_GATES = new Set(['service']);

// ---------------------------------------------------------------------------
// The calendar clock
// ---------------------------------------------------------------------------

/**
 * 10:00 Asia/Kolkata, `dayOffset` calendar days after the anchor's own
 * Asia/Kolkata date.
 *
 * Implemented as a fixed offset rather than through `Intl`: Asia/Kolkata has
 * been +05:30 with no daylight saving since 1945, so the arithmetic is exact
 * and has no tz-database dependency at runtime. THIS IS NOT A GENERAL
 * IMPLEMENTATION — if a second time zone is ever added, this must become an
 * `Intl.DateTimeFormat` round-trip, because the fixed-offset shortcut is wrong
 * the moment daylight saving exists.
 */
export function nurtureSlot(anchorISO: string, dayOffset: number): string {
  const anchor = Date.parse(anchorISO);
  if (!Number.isFinite(anchor)) throw new RangeError('nurtureSlot: anchor is not a date');

  // Shift the instant into IST so the UTC getters read IST wall-clock parts.
  const ist = new Date(anchor + IST_OFFSET_MIN * 60_000);

  // Date.UTC handles month and year overflow, so day 30 + 2 is the 1st.
  const slotUtc =
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + dayOffset, QUEUE_HOUR_IST) -
    IST_OFFSET_MIN * 60_000;

  return new Date(slotUtc).toISOString();
}

/**
 * The idempotency key, and therefore the whole duplicate story.
 *
 * Same mechanism as `form_submissions.request_key`: the key is derived from
 * what the message IS, not from when it was created, so a scheduler that runs
 * twice, a retried queue call and a double-clicked button all collapse onto one
 * unique index. Nothing else prevents a duplicate send and nothing else needs
 * to.
 */
export const idempotencyKey = (parts: {
  scope: 'receipt' | 'seq' | 'manual';
  anchorId: string;
  templateKey: string;
  version: string;
  step?: number | null;
}): string =>
  [parts.scope, parts.anchorId, parts.templateKey, parts.version, parts.step ?? 'x'].join(':');

// ---------------------------------------------------------------------------
// THE SEAM
// ---------------------------------------------------------------------------

export type DeliveryOutcome =
  | { kind: 'sent'; provider: string; providerMessageId: string }
  | { kind: 'failed'; reason: string; permanent: boolean }
  | { kind: 'unknown'; provider: string; providerMessageId: string | null; reason: string }
  | { kind: 'disabled'; reason: string };

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE ONE FUNCTION THAT WOULD TALK TO A PROVIDER. IT IS SWITCHED OFF.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * When a provider is chosen, this is where its adapter goes, and it is the only
 * place in the codebase that may hold provider credentials or know a provider's
 * request shape. Three things the adapter MUST do, in the order they matter:
 *
 *   1. MATERIALISE THE ACTION LINKS HERE AND NOWHERE EARLIER. The stored body
 *      carries `{{action:unsubscribe}}`. The adapter calls `signToken()` and
 *      substitutes the signed URL as it hands the text to the provider. A token
 *      written into `comms_messages.body` would be a working unsubscribe link
 *      for somebody else, sitting in a table the console can read, and it could
 *      not be rotated without rewriting queued rows.
 *
 *   2. RETURN 'unknown', NOT 'failed', ON A TIMEOUT. A request that timed out
 *      may have landed. 'failed' invites a retry; 'unknown' forces a
 *      reconciliation against the provider reference first, which is the
 *      brief's rule and the reason the state exists.
 *
 *   3. NEVER THROW FOR A REFUSAL. A thrown error from here is treated as an
 *      unknown outcome, deliberately — see the catch in `runDispatchSweep()`.
 *      Returning a typed refusal is how a permanent failure stops retrying.
 *
 * Until then: a hard `disabled`, before anything is read, built or signed.
 */
async function deliver(_message: OutboxRow): Promise<DeliveryOutcome> {
  const sw = dispatchSwitch();
  if (!sw.enabled) return { kind: 'disabled', reason: sw.reason };

  // Reachable only if every precondition in eligibility.ts passed, which
  // includes COMMS_PROVIDER being set — so this is "the flag moved but nobody
  // wrote the adapter". It fails permanently and loudly rather than looping,
  // because a send that silently does nothing is the worst of the three
  // outcomes: the console would show messages leaving and nobody receiving
  // them.
  return {
    kind: 'failed',
    permanent: true,
    reason:
      'Dispatch is enabled but no provider adapter is implemented in deliver(). Nothing was sent. Implement the adapter or set COMMS_DISPATCH off.',
  };
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export interface OutboxRow {
  message_id: string;
  idempotency_key: string;
  sequence_id: string | null;
  person_id: string | null;
  opportunity_id: string | null;
  submission_id: string | null;
  template_key: string;
  template_version: string;
  purpose: 'transactional' | 'marketing';
  sequence_step: number | null;
  recipient: string;
  subject: string;
  body: string;
  state: string;
  scheduled_for: string;
  queued_at: string;
  claimed_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  attempts: number;
  next_attempt_at: string | null;
  last_error: string | null;
  provider: string | null;
  provider_message_id: string | null;
  reconciled_at: string | null;
  reconciled_note: string | null;
  alerted_at: string | null;
  is_test: boolean;
  updated_at: string;
}

export interface SequenceRow {
  sequence_id: string;
  person_id: string;
  opportunity_id: string | null;
  submission_id: string | null;
  route: TemplateRoute;
  cohort_id: string | null;
  state: 'active' | 'paused' | 'stopped' | 'completed';
  anchor_at: string;
  started_at: string;
  paused_at: string | null;
  paused_reason: string | null;
  stopped_at: string | null;
  stopped_reason: string | null;
  resumed_at: string | null;
  resumed_by: string | null;
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// Answer helpers — the console's three ways of having no value
// ---------------------------------------------------------------------------

const ok = <T>(value: T): Answer<T> => ({ state: 'ok', value, at: new Date().toISOString() });
const unavailable = <T>(reason: string): Answer<T> => ({ state: 'unavailable', reason });
const denied = <T>(reason: string): Answer<T> => ({ state: 'denied', reason });

/**
 * A source failure, said safely. Never `error.message`.
 *
 * Same rule as `sourceFailed()` in lib/admin/pipeline-queries.ts, and it bites
 * harder here: PostgREST puts filter values in the URL, and every filter in
 * this module is a person id or an email address.
 */
function failed(what: string, error: unknown): string {
  const code =
    (error as { code?: string })?.code ?? (error as { name?: string })?.name ?? 'unknown';
  console.error(`comms read failed [${what}]:`, code);
  return `The ${what} did not answer. Its error code is in the server log — the message itself is withheld here because it can carry an address.`;
}

function gate<T>(who: Identity | undefined, capability: Capability): Answer<T> | null {
  if (!who) return denied('Not signed in.');
  if (!can(who.roles, capability)) return denied('Your roles do not include reading this.');
  return null;
}

/** How an action is attributed. Identical to the pipeline API's rule. */
export const actorOf = (who: Identity): string =>
  who.kind === 'staff' ? `${who.name} <${who.id}>` : 'bootstrap (shared password)';

// ---------------------------------------------------------------------------
// Queueing
// ---------------------------------------------------------------------------

export interface QueueRequest {
  submissionId: string;
  personId: string;
  route: TemplateRoute;
  /** The address as it stands at queue time. Snapshotted onto the row. */
  recipient: string;
  /** The saved submission's time. Every calendar offset is measured from it. */
  anchorAt: string;
  opportunityId?: string | null;
  cohortId?: string | null;
  isTest?: boolean;
}

export interface QueueDecision {
  templateKey: string;
  step: number;
  purpose: 'transactional' | 'marketing';
  queued: boolean;
  scheduledFor: string | null;
  why: string;
  eligibility?: Eligibility;
}

export interface QueueOutcome {
  ok: boolean;
  /** Null when no sequence was opened — which is the ordinary case today. */
  sequenceId: string | null;
  decisions: QueueDecision[];
  /** Set when an enquiry sequence was stopped because an application arrived. */
  review: string | null;
  note: string;
}

/**
 * Queue everything a saved submission is entitled to: the receipt now, and the
 * three nurture steps if — and only if — marketing is permitted.
 *
 * THIS IS NOT CALLED FROM THE PUBLIC SUBMIT PATH YET, AND THAT IS DELIBERATE.
 * `src/lib/pipeline/submit.ts` is outside this stage's remit and the send seam
 * is off, so wiring it now would queue rows nothing can dispatch. The call site
 * is one line inside `saveSubmission()`, after a committed save, fire-and-
 * forget — an email outage must never roll back a saved application. Until
 * then the console can queue for a submission by hand, which is also how a
 * route test is run against a controlled mailbox.
 */
export async function queueForSubmission(req: QueueRequest): Promise<QueueOutcome> {
  const client = db();
  if (!client) {
    return {
      ok: false,
      sequenceId: null,
      decisions: [],
      review: null,
      note: 'Supabase is not configured for this deployment, so nothing was queued.',
    };
  }

  const decisions: QueueDecision[] = [];
  const recipient = req.recipient.trim().toLowerCase();

  // ── The receipt ────────────────────────────────────────────────────────
  // Transactional, immediate, and never attached to the sequence — so stopping
  // a sequence can never cancel an acknowledgement somebody is owed.
  const receipt = receiptFor(req.route);
  if (receipt) {
    const subject: Subject = {
      personId: req.personId,
      recipient,
      purpose: 'transactional',
      route: req.route,
      templateKey: receipt.key,
      templateVersion: receipt.version,
      opportunityId: req.opportunityId ?? null,
      cohortId: req.cohortId ?? null,
    };
    const verdict = await checkEligibility(client, subject, 'queue');
    const refuse = definiteRefusal(verdict);

    if (refuse) {
      decisions.push({
        templateKey: receipt.key,
        step: 0,
        purpose: 'transactional',
        queued: false,
        scheduledFor: null,
        why: refuse,
        eligibility: verdict,
      });
    } else {
      const at = new Date().toISOString();
      const wrote = await insertMessage(client, {
        key: idempotencyKey({
          scope: 'receipt',
          anchorId: req.submissionId,
          templateKey: receipt.key,
          version: receipt.version,
        }),
        template: receipt,
        req,
        recipient,
        sequenceId: null,
        step: null,
        scheduledFor: at,
      });
      decisions.push({
        templateKey: receipt.key,
        step: 0,
        purpose: 'transactional',
        queued: wrote.wrote,
        scheduledFor: at,
        why: wrote.why,
        eligibility: verdict,
      });
    }
  }

  // ── One active sequence per person ─────────────────────────────────────
  const { data: live, error: liveErr } = await client
    .from('comms_sequences')
    .select('sequence_id, route, state')
    .eq('person_id', req.personId)
    .in('state', ['active', 'paused'])
    .maybeSingle();

  if (liveErr) {
    return {
      ok: false,
      sequenceId: null,
      decisions,
      review: null,
      note: failed('sequence record', liveErr),
    };
  }

  if (live) {
    // "An enquiry-to-application change stops the enquiry sequence and creates a
    // human review task rather than restarting marketing." Note what does NOT
    // happen: no new sequence is opened. Somebody looks at it.
    if (live.route !== req.route && req.route === 'application') {
      await stopSequence(String(live.sequence_id), 'enquiry became an application', client);

      let review = 'The enquiry sequence was stopped. A review task could not be raised.';
      if (req.opportunityId) {
        const { error } = await client.from('tasks').insert({
          opportunity_id: req.opportunityId,
          owner: 'operator',
          description:
            'An enquiry from this person became an application. The enquiry sequence has been stopped. Decide by hand what they should receive next — marketing is not restarted automatically.',
          due_at: new Date(Date.now() + 86_400_000).toISOString(),
        });
        review = error
          ? 'The enquiry sequence was stopped. The review task did not save; raise one by hand.'
          : 'The enquiry sequence was stopped and a review task was raised.';
      }
      return { ok: true, sequenceId: null, decisions, review, note: 'No new sequence was opened.' };
    }

    return {
      ok: true,
      sequenceId: String(live.sequence_id),
      decisions,
      review: null,
      note: `This person already has a ${live.state} sequence. One active sequence per person, so no second one was opened.`,
    };
  }

  // ── Should a sequence open at all? ─────────────────────────────────────
  const firstStep = nurtureFor(req.route)[0];
  if (!firstStep) {
    return { ok: true, sequenceId: null, decisions, review: null, note: 'This route has no nurture steps.' };
  }

  const marketingSubject: Subject = {
    personId: req.personId,
    recipient,
    purpose: 'marketing',
    route: req.route,
    templateKey: firstStep.key,
    templateVersion: firstStep.version,
    opportunityId: req.opportunityId ?? null,
    cohortId: req.cohortId ?? null,
  };
  const verdict = await checkEligibility(client, marketingSubject, 'queue');
  const refuse = definiteRefusal(verdict);

  if (refuse) {
    nurtureFor(req.route).forEach((t) =>
      decisions.push({
        templateKey: t.key,
        step: t.dayOffset,
        purpose: 'marketing',
        queued: false,
        scheduledFor: null,
        why: refuse,
        eligibility: verdict,
      }),
    );
    return { ok: true, sequenceId: null, decisions, review: null, note: 'No sequence was opened.' };
  }

  const { data: seq, error: seqErr } = await client
    .from('comms_sequences')
    .insert({
      person_id: req.personId,
      opportunity_id: req.opportunityId ?? null,
      submission_id: req.submissionId,
      route: req.route,
      cohort_id: req.cohortId ?? null,
      state: 'active',
      anchor_at: req.anchorAt,
    })
    .select('sequence_id')
    .maybeSingle();

  if (seqErr) {
    // 23505 is the partial unique index doing its job: two forms posted seconds
    // apart, and the other one won. That is the case an application-level check
    // loses, and it is not an error.
    const code = (seqErr as { code?: string }).code;
    return {
      ok: code === '23505',
      sequenceId: null,
      decisions,
      review: null,
      note:
        code === '23505'
          ? 'Another sequence for this person was opened at the same moment. One active sequence per person; this one was not created.'
          : failed('sequence record', seqErr),
    };
  }

  const sequenceId = String(seq?.sequence_id ?? '');

  for (const step of nurtureFor(req.route)) {
    const at = nurtureSlot(req.anchorAt, step.dayOffset);
    const wrote = await insertMessage(client, {
      key: idempotencyKey({
        scope: 'seq',
        anchorId: sequenceId,
        templateKey: step.key,
        version: step.version,
        step: step.dayOffset,
      }),
      template: step,
      req,
      recipient,
      sequenceId,
      step: step.dayOffset,
      scheduledFor: at,
    });
    decisions.push({
      templateKey: step.key,
      step: step.dayOffset,
      purpose: 'marketing',
      queued: wrote.wrote,
      scheduledFor: at,
      why: wrote.why,
      eligibility: verdict,
    });
  }

  return {
    ok: true,
    sequenceId,
    decisions,
    review: null,
    note: 'Sequence opened. Every message is re-checked immediately before dispatch.',
  };
}

/**
 * The queue-time verdict, reduced to "create nothing" or "create and hold".
 *
 * Returns the sentence to record when nothing should be created, or null when
 * a row should be written. See NEVER_QUEUE_GATES for the argument.
 */
function definiteRefusal(verdict: Eligibility): string | null {
  const stoppers = verdict.blocking.filter(
    (g) =>
      g.state === 'blocked' && (g.effect === 'stop' || g.effect === 'cancel' || NEVER_QUEUE_GATES.has(g.id)),
  );
  if (!stoppers.length) return null;
  return stoppers.map((g) => `${g.label}: ${g.detail}`).join(' ');
}

async function insertMessage(
  client: SupabaseClient,
  args: {
    key: string;
    template: PackageTemplate;
    req: QueueRequest;
    recipient: string;
    sequenceId: string | null;
    step: number | null;
    scheduledFor: string;
  },
): Promise<{ wrote: boolean; why: string }> {
  const rendered = renderMessage(args.template);

  const { error } = await client.from('comms_messages').insert({
    idempotency_key: args.key,
    sequence_id: args.sequenceId,
    person_id: args.req.personId,
    opportunity_id: args.req.opportunityId ?? null,
    submission_id: args.req.submissionId,
    template_key: args.template.key,
    template_version: args.template.version,
    purpose: args.template.purpose,
    sequence_step: args.step,
    recipient: args.recipient,
    subject: rendered.subject,
    body: rendered.body,
    state: 'queued',
    scheduled_for: args.scheduledFor,
    is_test: args.req.isTest === true,
  });

  if (!error) return { wrote: true, why: 'Queued.' };

  if ((error as { code?: string }).code === '23505') {
    // The idempotency key did its job. A retried call, a double click, a
    // scheduler that ran twice — one row, and this is the branch that proves it.
    return { wrote: false, why: 'Already queued under the same idempotency key. One row, not two.' };
  }
  return { wrote: false, why: failed('outbox', error) };
}

// ---------------------------------------------------------------------------
// The sweep
// ---------------------------------------------------------------------------

export interface SweepLine {
  messageId: string;
  templateKey: string;
  step: number | null;
  purpose: string;
  scheduledFor: string;
  /** What happened to it this sweep. */
  outcome: 'would-send' | 'held' | 'cancelled' | 'sent' | 'failed' | 'unknown';
  detail: string;
  gates: Eligibility['gates'];
}

export interface SweepResult {
  ok: boolean;
  ranAt: string;
  dueConsidered: number;
  wouldSend: number;
  held: number;
  cancelled: number;
  sent: number;
  failed: number;
  lines: SweepLine[];
  dispatchReason: string;
  note: string;
}

/**
 * Take every due message, re-check it, and act on the verdict.
 *
 * With dispatch off this still does real work — which is the point of building
 * it now. It cancels messages to people who withdrew, stops sequences that
 * should have stopped, pauses the ones on hold, and reports what WOULD go. The
 * only thing it does not do is hand anything to a provider.
 */
export async function runDispatchSweep(opts: { limit?: number; now?: Date } = {}): Promise<SweepResult> {
  const now = opts.now ?? new Date();
  const sw = dispatchSwitch();
  const base: SweepResult = {
    ok: false,
    ranAt: now.toISOString(),
    dueConsidered: 0,
    wouldSend: 0,
    held: 0,
    cancelled: 0,
    sent: 0,
    failed: 0,
    lines: [],
    dispatchReason: sw.reason,
    note: '',
  };

  const client = db();
  if (!client) return { ...base, note: 'Supabase is not configured for this deployment.' };

  const { data, error } = await client
    .from('comms_messages')
    .select('*')
    .eq('state', 'queued')
    .lte('scheduled_for', now.toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(Math.min(opts.limit ?? SWEEP_LIMIT, SWEEP_LIMIT));

  if (error) return { ...base, note: failed('outbox', error) };

  const due = (data ?? []) as OutboxRow[];
  const lines: SweepLine[] = [];
  let wouldSend = 0;
  let held = 0;
  let cancelled = 0;
  let sent = 0;
  let failedCount = 0;

  for (const message of due) {
    // ── STEP ONE: THE SECOND ELIGIBILITY CHECK ─────────────────────────
    const verdict = await checkEligibility(
      client,
      {
        personId: message.person_id,
        recipient: message.recipient,
        purpose: message.purpose,
        route: routeOfTemplate(message.template_key),
        templateKey: message.template_key,
        templateVersion: message.template_version,
        opportunityId: message.opportunity_id,
        cohortId: null,
        sequenceId: message.sequence_id,
        scheduledFor: message.scheduled_for,
      },
      'dispatch',
      now,
    );

    if (!verdict.sendable) {
      const acted = await applyVerdict(client, message, verdict);
      if (acted.cancelled) cancelled += 1;
      else held += 1;
      lines.push({
        messageId: message.message_id,
        templateKey: message.template_key,
        step: message.sequence_step,
        purpose: message.purpose,
        scheduledFor: message.scheduled_for,
        outcome: acted.cancelled ? 'cancelled' : 'held',
        detail: acted.detail,
        gates: verdict.gates,
      });
      continue;
    }

    // ── STEP TWO: CLAIM, THEN HAND OVER ────────────────────────────────
    // Only now, and only because every gate passed — including the dispatch
    // switch. See the header: claiming before checking leaves a message stuck
    // in 'sending' with no legal move back.
    const claimed = await client
      .from('comms_messages')
      .update({ state: 'sending', claimed_at: now.toISOString(), attempts: message.attempts + 1 })
      .eq('message_id', message.message_id)
      .eq('state', 'queued')
      .select('message_id')
      .maybeSingle();

    if (claimed.error || !claimed.data) {
      // Another sweep took it. Not an error, and not a second send.
      held += 1;
      lines.push({
        messageId: message.message_id,
        templateKey: message.template_key,
        step: message.sequence_step,
        purpose: message.purpose,
        scheduledFor: message.scheduled_for,
        outcome: 'held',
        detail: 'Claimed by another sweep. One message, one claim.',
        gates: verdict.gates,
      });
      continue;
    }

    let outcome: DeliveryOutcome;
    try {
      outcome = await deliver(message);
    } catch (err) {
      // A throw is an UNKNOWN outcome, never a failure. The request may have
      // reached the provider before whatever threw. Treating it as a failure is
      // how a retry sends a second copy of something that already landed.
      console.error('comms deliver threw:', err instanceof Error ? err.name : 'unknown');
      outcome = {
        kind: 'unknown',
        provider: '',
        providerMessageId: null,
        reason: 'The adapter threw. The outcome is unknown and must be reconciled before any retry.',
      };
    }

    const recorded = await recordOutcome(client, message, outcome, now);
    if (outcome.kind === 'sent') sent += 1;
    else if (outcome.kind === 'failed') failedCount += 1;
    else if (outcome.kind === 'disabled') wouldSend += 1;
    else held += 1;

    lines.push({
      messageId: message.message_id,
      templateKey: message.template_key,
      step: message.sequence_step,
      purpose: message.purpose,
      scheduledFor: message.scheduled_for,
      outcome:
        outcome.kind === 'sent'
          ? 'sent'
          : outcome.kind === 'failed'
            ? 'failed'
            : outcome.kind === 'disabled'
              ? 'would-send'
              : 'unknown',
      detail: recorded,
      gates: verdict.gates,
    });
  }

  return {
    ok: true,
    ranAt: now.toISOString(),
    dueConsidered: due.length,
    wouldSend,
    held,
    cancelled,
    sent,
    failed: failedCount,
    lines,
    dispatchReason: sw.reason,
    note: sw.enabled
      ? 'Dispatch is enabled.'
      : 'Dispatch is off. Every check ran and its verdict was acted on; nothing was handed to a provider.',
  };
}

/** Which route a template belongs to, without a second lookup table. */
const routeOfTemplate = (key: string): TemplateRoute => templateFor(key)?.route ?? 'enquiry';

/**
 * Act on a failed second check.
 *
 * The effect is the strongest one any blocked gate asked for. 'hold' leaves the
 * row queued — the block is about us, not the recipient, and it stops applying
 * when somebody approves a template or configures a mailbox.
 */
async function applyVerdict(
  client: SupabaseClient,
  message: OutboxRow,
  verdict: Eligibility,
): Promise<{ cancelled: boolean; detail: string }> {
  const effect: Effect = verdict.effect ?? 'hold';
  const reason = verdict.blocking.map((g) => g.label).join(', ');

  if (effect === 'hold') {
    return { cancelled: false, detail: `Held. ${verdict.summary}` };
  }

  // A cancellation is only legal from 'queued' — 'cancelled' sits below
  // 'sending' in the rank precisely so a message already handed to a provider
  // cannot be un-sent by this path.
  const { error } = await client
    .from('comms_messages')
    .update({
      state: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: `second eligibility check: ${reason}`.slice(0, 500),
    })
    .eq('message_id', message.message_id)
    .eq('state', 'queued');

  if (error) return { cancelled: false, detail: failed('outbox', error) };

  if (message.sequence_id && (effect === 'stop' || effect === 'pause')) {
    if (effect === 'stop') await stopSequence(message.sequence_id, reason, client);
    else await pauseSequence(message.sequence_id, reason, client);
  }

  return {
    cancelled: true,
    detail: `Cancelled before dispatch. ${verdict.summary}${
      effect === 'stop' ? ' The sequence was stopped.' : effect === 'pause' ? ' The sequence was paused.' : ''
    }`,
  };
}

async function recordOutcome(
  client: SupabaseClient,
  message: OutboxRow,
  outcome: DeliveryOutcome,
  now: Date,
): Promise<string> {
  const at = now.toISOString();

  if (outcome.kind === 'disabled') {
    // The claim has to come back. 'sending' cannot descend to 'queued', so this
    // branch is only reachable when the switch changed between the eligibility
    // check and the call — which is why the eligibility check owns the switch
    // and this is treated as an unknown to be reconciled rather than quietly
    // re-queued.
    await client
      .from('comms_messages')
      .update({ state: 'unknown', last_error: outcome.reason.slice(0, 500) })
      .eq('message_id', message.message_id);
    return 'The dispatch switch changed mid-sweep. Marked unknown for reconciliation; nothing was sent.';
  }

  if (outcome.kind === 'sent') {
    await client
      .from('comms_messages')
      .update({
        state: 'sent',
        sent_at: at,
        provider: outcome.provider,
        provider_message_id: outcome.providerMessageId,
      })
      .eq('message_id', message.message_id);
    return 'Handed to the provider.';
  }

  if (outcome.kind === 'unknown') {
    await client
      .from('comms_messages')
      .update({
        state: 'unknown',
        provider: outcome.provider || null,
        provider_message_id: outcome.providerMessageId,
        last_error: outcome.reason.slice(0, 500),
        alerted_at: message.alerted_at ?? at,
      })
      .eq('message_id', message.message_id);
    return 'Outcome unknown. It must be reconciled against the provider reference before any retry.';
  }

  const attempts = message.attempts + 1;
  const giveUp = outcome.permanent || attempts >= MAX_ATTEMPTS;
  await client
    .from('comms_messages')
    .update({
      state: 'failed',
      failed_at: at,
      last_error: outcome.reason.slice(0, 500),
      next_attempt_at: giveUp ? null : new Date(now.getTime() + backoffMs(attempts)).toISOString(),
      alerted_at: message.alerted_at ?? at,
    })
    .eq('message_id', message.message_id);

  return giveUp
    ? `Failed permanently after ${attempts} attempt${attempts === 1 ? '' : 's'}. It is in the failure queue and needs a person.`
    : `Failed. Attempt ${attempts} of ${MAX_ATTEMPTS}.`;
}

/** 2, 4, 8, 16 minutes. Bounded by MAX_ATTEMPTS, never unbounded. */
const backoffMs = (attempt: number): number => Math.min(2 ** attempt, 16) * 60_000;

// ---------------------------------------------------------------------------
// Sequence control
// ---------------------------------------------------------------------------

/**
 * Stop, and cancel what is queued. TERMINAL.
 *
 * Nothing in this codebase moves a sequence out of 'stopped'. `resumeSequence()`
 * filters on 'paused' and would not match, and that is the enforcement — not a
 * comment asking people to be careful.
 */
export async function stopSequence(
  sequenceId: string,
  reason: string,
  existing?: SupabaseClient,
): Promise<{ ok: boolean; detail: string }> {
  const client = existing ?? db();
  if (!client) return { ok: false, detail: 'Supabase is not configured for this deployment.' };

  const { error } = await client
    .from('comms_sequences')
    .update({ state: 'stopped', stopped_at: new Date().toISOString(), stopped_reason: reason.slice(0, 500) })
    .eq('sequence_id', sequenceId)
    .in('state', ['active', 'paused']);

  if (error) return { ok: false, detail: failed('sequence record', error) };

  const { error: cancelErr } = await client
    .from('comms_messages')
    .update({
      state: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: `sequence stopped: ${reason}`.slice(0, 500),
    })
    .eq('sequence_id', sequenceId)
    .eq('state', 'queued');

  return cancelErr
    ? { ok: false, detail: failed('outbox', cancelErr) }
    : { ok: true, detail: 'Stopped, and everything queued for it was cancelled. This does not restart.' };
}

/** Pause. Reversible by a person, never by a sweep. */
export async function pauseSequence(
  sequenceId: string,
  reason: string,
  existing?: SupabaseClient,
): Promise<{ ok: boolean; detail: string }> {
  const client = existing ?? db();
  if (!client) return { ok: false, detail: 'Supabase is not configured for this deployment.' };

  const { error } = await client
    .from('comms_sequences')
    .update({ state: 'paused', paused_at: new Date().toISOString(), paused_reason: reason.slice(0, 500) })
    .eq('sequence_id', sequenceId)
    .eq('state', 'active');

  return error
    ? { ok: false, detail: failed('sequence record', error) }
    : { ok: true, detail: 'Paused. Only a person can resume it, and only after review.' };
}

/**
 * Resume a paused sequence — and cancel everything it missed.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE MISSED MESSAGES ARE CANCELLED, NOT SENT.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * "Manual resume is available only for a paused, still-eligible sequence after
 * operator review; never bypass a suppression or send missed messages in a
 * burst." A sequence paused on day 1 and resumed on day 12 has three messages
 * whose moment has passed. Sending them now would deliver day 2, day 5 and day
 * 9 within a second of each other, to somebody who had been told nothing for a
 * fortnight.
 *
 * So the resume cancels every queued message whose time has gone, and says how
 * many. THREE PROPERTIES FALL OUT OF THAT, and all three are required:
 *   * no burst,
 *   * no suppression bypass — the dispatch check still runs on what remains,
 *   * and 'still eligible' is verified here rather than assumed, so resuming a
 *     sequence for somebody who unsubscribed while it was paused refuses.
 */
export async function resumeSequence(
  sequenceId: string,
  actor: string,
): Promise<{ ok: boolean; detail: string; cancelled?: number; eligibility?: Eligibility }> {
  const client = db();
  if (!client) return { ok: false, detail: 'Supabase is not configured for this deployment.' };

  const { data, error } = await client
    .from('comms_sequences')
    .select('*')
    .eq('sequence_id', sequenceId)
    .maybeSingle();

  if (error) return { ok: false, detail: failed('sequence record', error) };
  if (!data) return { ok: false, detail: 'No such sequence.' };

  const seq = data as SequenceRow;
  if (seq.state !== 'paused') {
    return {
      ok: false,
      detail:
        seq.state === 'stopped'
          ? 'This sequence is stopped. Stopped sequences do not restart — if this person should hear from us again, that is a message somebody writes.'
          : `This sequence is ${seq.state}, and only a paused one can be resumed.`,
    };
  }

  // Still eligible, checked now rather than assumed from the pause reason.
  const first = nurtureFor(seq.route)[0];
  const { data: person } = await client
    .from('people')
    .select('normalised_email')
    .eq('person_id', seq.person_id)
    .maybeSingle();

  const verdict = await checkEligibility(
    client,
    {
      personId: seq.person_id,
      recipient: String(person?.normalised_email ?? ''),
      purpose: 'marketing',
      route: seq.route,
      templateKey: first?.key ?? '',
      templateVersion: first?.version ?? PACKAGE_VERSION,
      opportunityId: seq.opportunity_id,
      cohortId: seq.cohort_id,
      // Not the sequence's own id: it is 'paused' right now, so including it
      // would make this check refuse every resume on the grounds that the thing
      // being resumed is paused.
      sequenceId: null,
    },
    'queue',
  );

  const stoppers = verdict.blocking.filter((g) => g.state === 'blocked' && (g.effect === 'stop' || g.effect === 'cancel'));
  if (stoppers.length) {
    return {
      ok: false,
      detail: `Not resumed — this person is no longer eligible: ${stoppers.map((g) => g.detail).join(' ')}`,
      eligibility: verdict,
    };
  }

  const now = new Date().toISOString();
  const { data: missed, error: missErr } = await client
    .from('comms_messages')
    .update({
      state: 'cancelled',
      cancelled_at: now,
      cancel_reason: 'missed while the sequence was paused — never sent late in a burst',
    })
    .eq('sequence_id', sequenceId)
    .eq('state', 'queued')
    .lt('scheduled_for', now)
    .select('message_id');

  if (missErr) return { ok: false, detail: failed('outbox', missErr) };

  const { error: resumeErr } = await client
    .from('comms_sequences')
    .update({ state: 'active', resumed_at: now, resumed_by: actor, paused_reason: null })
    .eq('sequence_id', sequenceId)
    .eq('state', 'paused');

  if (resumeErr) return { ok: false, detail: failed('sequence record', resumeErr) };

  const n = missed?.length ?? 0;
  return {
    ok: true,
    cancelled: n,
    eligibility: verdict,
    detail:
      n === 0
        ? 'Resumed. Nothing had been missed.'
        : `Resumed. ${n} message${n === 1 ? '' : 's'} whose moment had passed ${n === 1 ? 'was' : 'were'} cancelled rather than sent late.`,
  };
}

// ---------------------------------------------------------------------------
// Single-message operations
// ---------------------------------------------------------------------------

export async function cancelMessage(messageId: string, reason: string): Promise<{ ok: boolean; detail: string }> {
  const client = db();
  if (!client) return { ok: false, detail: 'Supabase is not configured for this deployment.' };

  const { data, error } = await client
    .from('comms_messages')
    .update({ state: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: reason.slice(0, 500) })
    .eq('message_id', messageId)
    .eq('state', 'queued')
    .select('message_id')
    .maybeSingle();

  if (error) return { ok: false, detail: failed('outbox', error) };
  return data
    ? { ok: true, detail: 'Cancelled.' }
    : {
        ok: false,
        detail:
          'Only a queued message can be cancelled. Anything further on has either been handed to a provider or already has an outcome, and cancelling is not how either is undone.',
      };
}

/**
 * Reconcile a message whose outcome is unknown. NEVER a blind retry.
 *
 * "On a provider timeout with unknown send outcome, reconcile using the
 * provider message reference before retrying."
 *
 * There are exactly two honest endings, and the database enforces which one is
 * reachable:
 *   * NO PROVIDER REFERENCE — nothing left, so it may return to the queue. The
 *     trigger allows 'unknown' → 'queued' only when `reconciled_at` is newly set
 *     and `provider_message_id` is null.
 *   * A PROVIDER REFERENCE EXISTS — it may have landed. It must be resolved to
 *     'sent' or 'failed' on the provider's evidence, and the trigger refuses to
 *     re-queue it. With no provider configured there is nobody to ask, so it
 *     stays unknown and stays in the failure queue where a person can see it.
 */
export async function reconcileMessage(messageId: string, actor: string): Promise<{ ok: boolean; detail: string }> {
  const client = db();
  if (!client) return { ok: false, detail: 'Supabase is not configured for this deployment.' };

  const { data, error } = await client
    .from('comms_messages')
    .select('*')
    .eq('message_id', messageId)
    .maybeSingle();

  if (error) return { ok: false, detail: failed('outbox', error) };
  if (!data) return { ok: false, detail: 'No such message.' };

  const message = data as OutboxRow;
  if (message.state !== 'unknown') {
    return { ok: false, detail: `This message is ${message.state}. Only an unknown outcome is reconciled.` };
  }

  const at = new Date().toISOString();

  if (message.provider_message_id) {
    // Asking the provider is the adapter's job and there is no adapter. Saying
    // "resolved" here would be inventing the answer the whole mechanism exists
    // to avoid inventing.
    await client
      .from('comms_messages')
      .update({
        reconciled_at: at,
        reconciled_note: `${actor} attempted reconciliation: there is no provider configured to ask about ${message.provider_message_id}.`,
      })
      .eq('message_id', messageId);
    return {
      ok: false,
      detail:
        'This message carries a provider reference, so it may have landed. It cannot be re-queued and there is no provider configured to ask. It stays in the failure queue.',
    };
  }

  const { error: requeue } = await client
    .from('comms_messages')
    .update({
      state: 'queued',
      reconciled_at: at,
      reconciled_note: `${actor} reconciled: no provider reference was ever recorded, so nothing left. Returned to the queue.`,
      claimed_at: null,
    })
    .eq('message_id', messageId)
    .eq('state', 'unknown');

  return requeue
    ? { ok: false, detail: failed('outbox', requeue) }
    : { ok: true, detail: 'No provider reference existed, so nothing was sent. Returned to the queue.' };
}

/**
 * Add an address to the suppression list.
 *
 * ONE-WAY, AND THE TABLE ENFORCES IT: `comms_suppressions` refuses UPDATE and
 * DELETE, so this can only ever add. A second call for an address already on
 * the list is a no-op, which is the correct end state — see `suppressionFor()`
 * in eligibility.ts for how a stored 'marketing' entry is WIDENED to 'all' by a
 * later bounce or complaint without any row ever being changed.
 */
export async function recordSuppression(args: {
  email: string;
  personId?: string | null;
  reason: 'unsubscribe' | 'hard_bounce' | 'complaint' | 'manual';
  scope: 'marketing' | 'all';
  source: string;
  detail?: string | null;
}): Promise<{ ok: boolean; detail: string }> {
  const client = db();
  if (!client) return { ok: false, detail: 'Supabase is not configured for this deployment.' };

  const email = args.email.trim().toLowerCase();
  if (!email || !email.includes('@')) return { ok: false, detail: 'That is not an address.' };

  const { error } = await client.from('comms_suppressions').insert({
    normalised_email: email,
    person_id: args.personId ?? null,
    reason: args.reason,
    scope: args.scope,
    source: args.source,
    // Never a provider's raw payload: it routinely carries the address, the
    // subject and a chunk of the original body.
    detail: args.detail?.slice(0, 300) ?? null,
  });

  if (error && (error as { code?: string }).code === '23505') {
    return { ok: true, detail: 'Already suppressed. The list is one-way, so a second entry is not needed.' };
  }
  if (error) return { ok: false, detail: failed('suppression list', error) };

  // Cancel anything queued for that address in the same breath. A suppression
  // that takes effect tomorrow is not a suppression.
  await client
    .from('comms_messages')
    .update({
      state: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: `suppressed: ${args.reason}`,
    })
    .eq('recipient', email)
    .eq('state', 'queued')
    .in('purpose', args.scope === 'all' ? ['marketing', 'transactional'] : ['marketing']);

  return { ok: true, detail: 'Suppressed, and anything queued for that address was cancelled.' };
}

// ---------------------------------------------------------------------------
// Loading and approving the twelve wordings
// ---------------------------------------------------------------------------

/**
 * Write the package's twelve rows, UNAPPROVED.
 *
 * Idempotent by (template_key, version): a second run inserts nothing. It
 * cannot overwrite a stored row either — the content columns are frozen by a
 * trigger from the moment the row exists — so this is safe to run whenever, and
 * it is the only way a template ever enters the database.
 */
export async function loadPackageTemplates(): Promise<{ ok: boolean; inserted: number; detail: string }> {
  const client = db();
  if (!client) return { ok: false, inserted: 0, detail: 'Supabase is not configured for this deployment.' };

  const rows = await Promise.all(TEMPLATES.map((t) => templateRow(t)));
  let inserted = 0;

  for (const row of rows) {
    const { error } = await client.from('message_templates').insert(row);
    if (!error) inserted += 1;
    else if ((error as { code?: string }).code !== '23505') {
      return { ok: false, inserted, detail: failed('template store', error) };
    }
  }

  return {
    ok: true,
    inserted,
    detail:
      inserted === 0
        ? `All ${rows.length} wordings for ${PACKAGE_VERSION} were already stored. Nothing was changed.`
        : `${inserted} wording${inserted === 1 ? '' : 's'} stored for ${PACKAGE_VERSION}, with no approval recorded. Approval is a separate, named act.`,
  };
}

export async function approveTemplate(
  templateKey: string,
  version: string,
  actor: string,
): Promise<{ ok: boolean; detail: string }> {
  const client = db();
  if (!client) return { ok: false, detail: 'Supabase is not configured for this deployment.' };

  const { data, error } = await client
    .from('message_templates')
    .select('*')
    .eq('template_key', templateKey)
    .eq('version', version)
    .maybeSingle();

  if (error) return { ok: false, detail: failed('template store', error) };
  if (!data) return { ok: false, detail: 'No stored wording with that key and version.' };

  const row = data as StoredTemplate;

  // Approving a row whose words have drifted from the package would attach a
  // name to something nobody read. Re-hash before recording the approval.
  const verdict = await verifyStored(row);
  if (!verdict.matches) return { ok: false, detail: verdict.reason };

  // A REVOKED ROW IS NOT RE-APPROVED. Clearing `revoked_at` would erase the
  // fact that this wording was once withdrawn, which is exactly the history
  // revocation exists to preserve — "the words stay, they simply stop being
  // sendable". A wording somebody wants back is a new version and a new
  // approval, and the withdrawal stays readable beside it.
  if (row.revoked_at) {
    return {
      ok: false,
      detail:
        'Approval for this wording was withdrawn, and a withdrawal is not undone. If these words should go out again, load them as a new version and approve that — the withdrawal stays on the record.',
    };
  }

  const { error: upd } = await client
    .from('message_templates')
    .update({ approved_at: new Date().toISOString(), approved_by: actor })
    .eq('template_id', row.template_id);

  return upd
    ? { ok: false, detail: failed('template store', upd) }
    : { ok: true, detail: `Approved as ${actor}. The wording itself is immutable and was not touched.` };
}

/**
 * Withdraw approval. NOT an edit, and not a deletion.
 *
 * A wording found to be wrong has to be stoppable in one action without
 * rewriting history: the words stay exactly as they were, the row simply stops
 * being sendable, and everything already queued under it is held at the next
 * check rather than going out while somebody drafts a replacement.
 */
export async function revokeTemplate(
  templateKey: string,
  version: string,
  actor: string,
  reason: string,
): Promise<{ ok: boolean; detail: string }> {
  const client = db();
  if (!client) return { ok: false, detail: 'Supabase is not configured for this deployment.' };

  const { error } = await client
    .from('message_templates')
    .update({ revoked_at: new Date().toISOString(), revoked_by: actor, revoked_reason: reason.slice(0, 500) })
    .eq('template_key', templateKey)
    .eq('version', version);

  return error
    ? { ok: false, detail: failed('template store', error) }
    : { ok: true, detail: 'Approval withdrawn. The wording is unchanged and nothing is sendable under it.' };
}

// ---------------------------------------------------------------------------
// What the console reads
// ---------------------------------------------------------------------------

export interface TemplateStatus {
  key: string;
  route: TemplateRoute;
  dayOffset: number;
  purpose: 'transactional' | 'marketing';
  subject: string;
  body: string;
  version: string;
  /** Null when the package wording has never been loaded into the store. */
  stored: StoredTemplate | null;
  approved: boolean;
  matches: boolean;
  note: string;
}

/**
 * The twelve, each with what the store says about it.
 *
 * Driven from the PACKAGE, not from the table: a row missing from the database
 * is a template that has not been loaded, and it has to appear on the screen
 * saying so. Listing the table instead would render eleven rows and no sign of
 * the twelfth.
 */
export async function templateStatuses(who: Identity | undefined): Promise<Answer<TemplateStatus[]>> {
  const stop = gate<TemplateStatus[]>(who, 'read.dashboard');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const { data, error } = await client.from('message_templates').select('*').eq('version', PACKAGE_VERSION);
  if (error) return unavailable(failed('template store', error));

  const stored = new Map((data ?? []).map((r) => [String((r as StoredTemplate).template_key), r as StoredTemplate]));

  const out: TemplateStatus[] = [];
  for (const t of TEMPLATES) {
    const row = stored.get(t.key) ?? null;
    const verdict = row ? await verifyStored(row) : null;
    out.push({
      key: t.key,
      route: t.route,
      dayOffset: t.dayOffset,
      purpose: t.purpose,
      subject: t.subject,
      body: renderMessage(t).body,
      version: t.version,
      stored: row,
      approved: Boolean(row?.approved_at && !row?.revoked_at),
      matches: verdict?.matches ?? false,
      note: verdict
        ? verdict.sendable
          ? 'Approved, and the stored words match the package.'
          : verdict.reason
        : 'Not loaded into the template store yet. Nothing can be queued or sent under a wording that is not recorded.',
    });
  }
  return ok(out);
}

export interface OutboxFilters {
  states?: string[];
  limit?: number;
}

/**
 * The outbox. Gated on `read.people`, not `read.dashboard` — every row carries
 * a recipient address, and a maintainer signed in to check an integration has
 * no business reading one.
 */
export async function outboxRows(
  who: Identity | undefined,
  filters: OutboxFilters = {},
): Promise<Answer<OutboxRow[]>> {
  const stop = gate<OutboxRow[]>(who, 'read.people');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  let query = client
    .from('comms_messages')
    .select('*')
    .order('scheduled_for', { ascending: true })
    .limit(Math.min(filters.limit ?? 200, 500));

  if (filters.states?.length) query = query.in('state', filters.states);

  const { data, error } = await query;
  return error ? unavailable(failed('outbox', error)) : ok((data ?? []) as OutboxRow[]);
}

export async function sequenceRows(who: Identity | undefined, limit = 100): Promise<Answer<SequenceRow[]>> {
  const stop = gate<SequenceRow[]>(who, 'read.people');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const { data, error } = await client
    .from('comms_sequences')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(Math.min(limit, 500));

  return error ? unavailable(failed('sequence record', error)) : ok((data ?? []) as SequenceRow[]);
}

export interface StateCount {
  state: string;
  count: number;
}

/**
 * Counts by state.
 *
 * A count taken in TypeScript has a row cap that silently truncates, so this
 * asks for one row more than it is prepared to count and returns `unavailable`
 * if it gets it. Same rule, and the same reason, as `COUNT_CAP` in
 * lib/admin/pipeline-queries.ts: a figure that is quietly too small is
 * unknown-as-zero with the numerals filled in.
 */
const COUNT_CAP = 5_000;

export async function outboxCounts(who: Identity | undefined): Promise<Answer<StateCount[]>> {
  const stop = gate<StateCount[]>(who, 'read.dashboard');
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const { data, error } = await client
    .from('comms_messages')
    .select('state')
    .eq('is_test', false)
    .limit(COUNT_CAP + 1);

  if (error) return unavailable(failed('outbox', error));
  if ((data?.length ?? 0) > COUNT_CAP) {
    return unavailable(
      `More than ${COUNT_CAP.toLocaleString('en-GB')} messages exist, which is more than this count can take completely. The number is withheld rather than reported short.`,
    );
  }

  const tally = new Map<string, number>();
  (data ?? []).forEach((r) => {
    const s = String((r as { state: string }).state);
    tally.set(s, (tally.get(s) ?? 0) + 1);
  });
  return ok([...tally].map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count));
}

export interface InboxState {
  /** Whether a monitored reply mailbox is configured at all. */
  detection: boolean;
  /** Replies recorded against our messages. Null when detection is not in service. */
  replies: number | null;
  note: string;
}

/**
 * The Inbox.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHEN REPLY DETECTION IS NOT IN SERVICE, THIS IS NOT ZERO. IT IS UNKNOWN.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Eight of the twelve messages ask the reader to reply, and a reply is the
 * first item on the stop list. "0 replies" on a screen with no monitored
 * mailbox behind it is the single most misleading number this console could
 * print: it says nobody answered, when the truth is that nobody was listening.
 */
export async function inboxState(who: Identity | undefined): Promise<Answer<InboxState>> {
  const stop = gate<InboxState>(who, 'read.dashboard');
  if (stop) return stop;

  if (!replyDetectionAvailable()) {
    return ok({
      detection: false,
      replies: null,
      note: 'No monitored reply mailbox is configured, so replies are not detected and not linked into lead history. The number of replies is unknown, not zero.',
    });
  }

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const { data, error } = await client.from('comms_events').select('event_id').eq('type', 'reply').limit(COUNT_CAP + 1);
  if (error) return unavailable(failed('provider event log', error));

  return ok({
    detection: true,
    replies: data?.length ?? 0,
    note: 'Replies recorded by the provider callback and linked to a message.',
  });
}

/** What must be true before dispatch, plus how many wordings are approved. */
export interface LaunchState {
  dispatch: DispatchSwitchView;
  approved: number | null;
  ofTotal: number;
}

export interface DispatchSwitchView {
  enabled: boolean;
  reason: string;
  unsubscribe: boolean;
  reply: boolean;
}

export async function launchState(who: Identity | undefined): Promise<Answer<LaunchState>> {
  const stop = gate<LaunchState>(who, 'read.dashboard');
  if (stop) return stop;

  const sw = dispatchSwitch();
  const view: DispatchSwitchView = {
    enabled: sw.enabled,
    reason: sw.reason,
    unsubscribe: unsubscribeAvailable(),
    reply: replyDetectionAvailable(),
  };

  const client = db();
  if (!client) return ok({ dispatch: view, approved: null, ofTotal: TEMPLATES.length });

  const { data, error } = await client
    .from('message_templates')
    .select('template_key')
    .eq('version', PACKAGE_VERSION)
    .not('approved_at', 'is', null)
    .is('revoked_at', null);

  // A failed count is null, never 0. "No wordings are approved" and "the store
  // did not answer" are different facts and the screen renders them differently.
  return ok({ dispatch: view, approved: error ? null : (data?.length ?? 0), ofTotal: TEMPLATES.length });
}
