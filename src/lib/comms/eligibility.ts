// Whether a message may go — asked twice, and answered the same way both times.
//
// ───────────────────────────────────────────────────────────────────────────
// THE SAME FUNCTION RUNS AT QUEUE TIME AND AGAIN IMMEDIATELY BEFORE DISPATCH.
// ───────────────────────────────────────────────────────────────────────────
//
// The brief: "Check consent, template approval, cohort availability, stage and
// suppression both when queuing and immediately before dispatch."
//
// Two checks, ONE implementation. That is the whole design of this file, and it
// is not tidiness — a second, separately written pre-flight check is how a
// system ends up with a queue-time rule that the dispatcher does not know
// about. `checkEligibility(subject, phase)` is called from
// `queueForSubmission()` with phase 'queue' and from `runDispatchSweep()` with
// phase 'dispatch'. The gates below declare which phases they run in; nobody
// writes the list out twice.
//
// WHY A SECOND CHECK IS NOT PARANOIA. A day-9 message is queued nine days
// before it is due. In those nine days somebody withdraws consent, replies,
// books a meeting, is made an offer, goes on hold, is closed as unsuitable, or
// hard-bounces. Every one of those is on the brief's stop or pause list, and
// every one of them happens AFTER the queue-time check said yes. The second
// check is the one that stops mail to somebody who withdrew yesterday; the
// first only stops mail to somebody who had already withdrawn.
//
// ───────────────────────────────────────────────────────────────────────────
// UNKNOWN IS NEVER A PASS
// ───────────────────────────────────────────────────────────────────────────
//
// Every gate is pass / blocked / unknown, and `sendable` is true only when
// every gate that ran came back 'pass'. A table that did not answer produces
// 'unknown', and 'unknown' holds the message.
//
// This is the send-side of the console's "unknown is never zero". There, a
// failed read must not render as 0; here, a failed read must not render as
// permission. The asymmetry is deliberate and it is the right way round: the
// cost of holding a message that could have gone is a delay, and the cost of
// sending one that should not have gone is a person receiving marketing they
// withdrew consent for.
//
// ───────────────────────────────────────────────────────────────────────────
// A RECEIPT IS NOT MARKETING
// ───────────────────────────────────────────────────────────────────────────
//
// Half the gates here only run for `purpose: 'marketing'`. Consent, cohort
// availability, stage, the commitment signals and staleness are all questions
// about whether it is still appropriate to MARKET to somebody. None of them is
// a reason to withhold the acknowledgement that we received the thing they
// sent us. The two that bind a receipt as well are suppression at scope 'all'
// (a dead address, or somebody who reported us as spam) and template approval
// (an unapproved wording is not sent to anyone, ever).

import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../admin/env';
import { verifyStored, type StoredTemplate, type TemplatePurpose, type TemplateRoute } from './templates';
import { available as unsubscribeAvailable } from './unsubscribe';

// ---------------------------------------------------------------------------
// The send switch, and what must be true before it moves
// ---------------------------------------------------------------------------
//
// The ADAPTER is in outbox.ts — one named function, currently returning
// 'disabled'. The SWITCH is here, because "may anything be sent at all" is an
// eligibility question and because putting it here is what keeps outbox.ts and
// eligibility.ts from importing each other.

/** Reply detection: a monitored mailbox whose replies link into lead history. */
export const replyDetectionAvailable = (): boolean => Boolean(env('COMMS_REPLY_MAILBOX'));

export interface Precondition {
  id: string;
  /** What has to be true. */
  what: string;
  /** Why nothing may be sent until it is. */
  why: string;
  /** Whether this build can verify it, or whether a person has to assert it. */
  checked: 'machine' | 'person';
  /** true / false where checkable; null where only a person can say. */
  ready: boolean | null;
  detail: string;
}

/**
 * Everything that must be true before `COMMS_DISPATCH=on` may be set.
 *
 * Written down here, in code, rather than in a document somebody has to find:
 * the console renders this list, so the answer to "what is still missing" is on
 * the screen where the switch is, and it is the same list the switch itself
 * consults.
 *
 * Six are machine-checked and will not let the switch move while they are
 * false. Two can only be asserted by a person — and setting the environment
 * variable IS that assertion. That is why the switch is a deliberate, named
 * variable rather than something derived from "a provider looks configured".
 */
export function preconditions(): Precondition[] {
  const provider = env('COMMS_PROVIDER');
  const domain = env('COMMS_SENDING_DOMAIN');
  const mailbox = env('COMMS_REPLY_MAILBOX');
  const flag = env('COMMS_DISPATCH');

  return [
    {
      id: 'provider',
      what: 'A sending provider is chosen and configured (COMMS_PROVIDER, plus its credentials).',
      why: 'Decision D2 is open. Web3Forms is client-side only on the free plan and this repo forbids moving it server-side, so it cannot send a receipt, run a sequence, observe a bounce or honour an unsubscribe.',
      checked: 'machine',
      ready: Boolean(provider),
      detail: provider ? `Set to ${provider}.` : 'Not set. No provider adapter is registered.',
    },
    {
      id: 'sending-domain',
      what: 'A verified sending domain, with SPF, DKIM and DMARC passing (COMMS_SENDING_DOMAIN).',
      why: 'Unauthenticated mail from a new domain lands in spam, and spam complaints are one of the two things that suppress an address permanently. Sending before verification damages the thing it is trying to use.',
      checked: 'machine',
      ready: Boolean(domain),
      detail: domain ? `Set to ${domain}.` : 'Not set.',
    },
    {
      id: 'reply-mailbox',
      what: 'A monitored reply mailbox whose replies are linked into lead history (COMMS_REPLY_MAILBOX).',
      why: 'Eight of the twelve messages ask the reader to reply. Reply is also the first item on the stop list, so without detection a person who answers keeps receiving the sequence they answered.',
      checked: 'machine',
      ready: Boolean(mailbox),
      detail: mailbox ? `Set to ${mailbox}.` : 'Not set. Nurture is disabled while this is absent.',
    },
    {
      id: 'unsubscribe',
      what: 'Unsubscribe processing in service: COMMS_LINK_SECRET set, so links can be signed and verified.',
      why: 'Marketing that a person cannot opt out of is worse than none. Without the secret the endpoint cannot verify a link, so the footer would be decorative.',
      checked: 'machine',
      ready: unsubscribeAvailable(),
      detail: unsubscribeAvailable()
        ? 'Configured. Links can be signed and verified.'
        : 'Not set. Nurture is disabled while this is absent.',
    },
    {
      id: 'templates',
      what: 'All twelve wordings approved at the exact package version by somebody holding approve.template.',
      why: 'The package ships them "disabled_pending_exact_version_approval_and_route_tests". Approval is a person\'s act with a name and a time against it.',
      checked: 'machine',
      ready: null,
      detail: 'Checked per message at both eligibility checks, and counted on this screen.',
    },
    {
      id: 'privacy',
      what: 'The privacy facts are published and a notice version is recorded against submissions.',
      why: 'The data controller, purposes, processors, retention and a contact point are outstanding from the owner, /privacy is noindex until they arrive, and form_submissions.privacy_notice_version is null everywhere. The brief forbids publishing a generic invented policy.',
      checked: 'person',
      ready: null,
      detail: 'Asserted by a person. Nothing here can verify it.',
    },
    {
      id: 'route-tests',
      what: 'Route tests passed against a controlled test mailbox using synthetic records, with cleanup recorded.',
      why: 'The package names route tests alongside approval as the second activation condition. A first real send is not a test.',
      checked: 'person',
      ready: null,
      detail: 'Asserted by a person. Use is_test messages and a mailbox nobody outside the practice reads.',
    },
    {
      id: 'switch',
      what: 'COMMS_DISPATCH is set to "on", deliberately, by somebody who has confirmed the two items above.',
      why: 'The last gate is a human one. Deriving "we are live" from "a provider looks configured" is how a staging key in a production environment sends twelve real messages.',
      checked: 'machine',
      ready: flag === 'on',
      detail: flag ? `COMMS_DISPATCH=${flag}` : 'Not set. Dispatch is off.',
    },
  ];
}

export interface DispatchSwitch {
  enabled: boolean;
  /** One sentence, for a screen and for a cancel_reason. */
  reason: string;
  /** The machine-checked preconditions that are not yet true. */
  missing: Precondition[];
}

/**
 * Is the send seam open?
 *
 * Reads nothing but the environment, so it is cheap enough to call per message
 * and cannot fail in a way that turns "off" into "on". Note the direction of
 * the default: an unset variable is OFF. Every branch that could not determine
 * an answer returns disabled.
 */
export function dispatchSwitch(): DispatchSwitch {
  // Only the ones this code can actually decide. `templates` is marked machine-
  // checked but carries `ready: null` here because approval is a PER-MESSAGE
  // gate — a deployment with eleven of twelve approved is not "off", it is a
  // deployment where one message is held.
  const checkable = preconditions().filter((p) => p.checked === 'machine' && p.ready !== null);
  const missing = checkable.filter((p) => p.ready === false);

  if (missing.length === 0) {
    return { enabled: true, reason: 'Dispatch is enabled.', missing: [] };
  }
  return {
    enabled: false,
    reason:
      missing.length === checkable.length
        ? 'Dispatch is off: nothing about sending is configured in this deployment. No provider, no verified sending domain, no monitored reply mailbox, no link secret, and the switch itself is unset.'
        : `Dispatch is off: ${missing.length} of ${checkable.length} machine-checked preconditions are not met.`,
    missing,
  };
}

// ---------------------------------------------------------------------------
// The gates
// ---------------------------------------------------------------------------

export type GateState = 'pass' | 'blocked' | 'unknown';

/**
 * What a blocked gate asks to happen to the message and its sequence.
 *
 * 'hold' is the important one and the easiest to leave out. A message blocked
 * because a template is not yet approved, or because the send switch is off,
 * must stay queued: the block is about us, not about the recipient, and it
 * stops applying the moment somebody presses approve.
 */
export type Effect = 'hold' | 'cancel' | 'pause' | 'stop';

export interface Gate {
  id: string;
  label: string;
  state: GateState;
  detail: string;
  /** Meaningless unless `state` is 'blocked'. */
  effect: Effect;
}

export interface Subject {
  personId: string | null;
  /** The address on the message. At dispatch it is checked against the person's current one. */
  recipient: string;
  purpose: TemplatePurpose;
  route: TemplateRoute;
  templateKey: string;
  templateVersion: string;
  opportunityId?: string | null;
  cohortId?: string | null;
  sequenceId?: string | null;
  /** When the message was due. Only read at dispatch, for the staleness gate. */
  scheduledFor?: string | null;
}

export type Phase = 'queue' | 'dispatch';

export interface Eligibility {
  sendable: boolean;
  phase: Phase;
  checkedAt: string;
  gates: Gate[];
  /** The strongest effect any blocked gate asked for, or null if nothing blocked. */
  effect: Effect | null;
  /** The blocked or unknown gates, in the order they were evaluated. */
  blocking: Gate[];
  summary: string;
}

/**
 * A nurture message that became due more than this long ago is cancelled rather
 * than sent.
 *
 * The brief forbids sending missed messages in a burst after a manual resume.
 * The same thing can happen without anybody resuming anything — a three-week
 * outage, a provider suspension, a switch that stayed off — and the result is
 * worse, because nobody chose it. A day-2 message arriving on day 20 is not the
 * message that was approved; it reads as a system that lost track of somebody.
 */
const STALE_AFTER_MS = 72 * 60 * 60 * 1000;

/** Stages at which marketing stops. Both routes, plus the shared side states. */
const STOP_STAGES = new Set([
  'offer',
  'enrolled',
  'quote',
  'order_agreed',
  'delivery_coordination',
  'unsuitable',
  'withdrawn',
  'closed',
]);

/** The one stage that pauses rather than stops. A hold is reviewable; a close is not. */
const PAUSE_STAGES = new Set(['on_hold']);

const RANK: Record<Effect, number> = { hold: 0, cancel: 1, pause: 2, stop: 3 };

const pass = (id: string, label: string, detail: string): Gate => ({
  id,
  label,
  state: 'pass',
  detail,
  effect: 'hold',
});

const block = (id: string, label: string, detail: string, effect: Effect): Gate => ({
  id,
  label,
  state: 'blocked',
  detail,
  effect,
});

/**
 * A gate that could not be answered.
 *
 * The detail NEVER carries the error text or the value that failed — same rule
 * as `sourceFailed()` in lib/admin/pipeline-queries.ts, and here the value in
 * question is somebody's email address.
 */
const unknown = (id: string, label: string, what: string, error?: unknown): Gate => {
  if (error !== undefined) {
    console.error(`comms eligibility [${id}]:`, (error as { code?: string })?.code ?? 'unknown');
  }
  return {
    id,
    label,
    state: 'unknown',
    detail: `${what} did not answer, so this could not be established. Nothing is sent on an unestablished check.`,
    effect: 'hold',
  };
};

/**
 * The effective suppression on an address.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS READS TWO TABLES, AND WHY THAT IS THE ONE-WAY GUARANTEE
 * ───────────────────────────────────────────────────────────────────────────
 *
 * `comms_suppressions` is keyed unique on the address and refuses both UPDATE
 * and DELETE. That makes an entry permanent, which is exactly right, and it
 * also means a row recorded at scope 'marketing' (an unsubscribe) CANNOT LATER
 * BE WIDENED to scope 'all' by an UPDATE when that same address hard-bounces.
 * The trigger refuses it, correctly — the rule is that nothing may weaken a
 * suppression, and the schema enforces it by refusing every change.
 *
 * So widening is done by READING rather than by writing. The effective scope is
 * the stronger of:
 *
 *   * the stored suppression row, and
 *   * 'all', if any message ever addressed to this recipient ended 'bounced'
 *     or 'complained' — and `comms_messages` has its own one-way state trigger,
 *     so a stale 'delivered' callback arriving afterwards cannot move it back.
 *
 * Both inputs are append-only-in-effect, so the result only ever gets stronger.
 * That is the brief's "a delivered callback must not override a later bounce,
 * complaint or unsubscribe suppression", made structural in both directions:
 * the stored row cannot be lowered because the table refuses writes, and the
 * derived widening cannot be lowered because message state cannot descend.
 *
 * `comms_events` is deliberately NOT consulted here. It records callbacks
 * including the ones we refused, so reading it would let a refused event
 * influence a decision — and it holds no address of its own, by design.
 */
export type Suppression =
  | { state: 'none' }
  | { state: 'marketing'; reason: string; since: string | null }
  | { state: 'all'; reason: string; since: string | null }
  | { state: 'unknown' };

export async function suppressionFor(
  client: SupabaseClient,
  recipient: string,
): Promise<Suppression> {
  const email = recipient.trim().toLowerCase();
  if (!email) return { state: 'unknown' };

  const [stored, hard] = await Promise.all([
    client
      .from('comms_suppressions')
      .select('scope, reason, created_at')
      .eq('normalised_email', email)
      .maybeSingle(),
    client
      .from('comms_messages')
      .select('state, failed_at')
      .eq('recipient', email)
      .in('state', ['bounced', 'complained'])
      .limit(1),
  ]);

  if (stored.error) {
    console.error('comms suppression read:', (stored.error as { code?: string }).code ?? 'unknown');
    return { state: 'unknown' };
  }
  if (hard.error) {
    console.error('comms hard-outcome read:', (hard.error as { code?: string }).code ?? 'unknown');
    return { state: 'unknown' };
  }

  const bounced = (hard.data ?? [])[0];
  if (bounced) {
    return {
      state: 'all',
      reason:
        bounced.state === 'complained'
          ? 'a complaint was recorded against a message to this address'
          : 'a message to this address hard-bounced',
      since: (bounced.failed_at as string | null) ?? null,
    };
  }

  const row = stored.data as { scope?: string; reason?: string; created_at?: string } | null;
  if (!row?.scope) return { state: 'none' };

  return row.scope === 'all'
    ? { state: 'all', reason: row.reason ?? 'suppressed', since: row.created_at ?? null }
    : { state: 'marketing', reason: row.reason ?? 'suppressed', since: row.created_at ?? null };
}

/**
 * The one check, run at both moments.
 *
 * Gates are evaluated in a fixed order and ALL of them run — the function does
 * not short-circuit on the first block. That costs a few reads and buys the
 * thing the console needs: a person looking at a held message sees every reason
 * it is held, not the first one the loop happened to hit.
 */
export async function checkEligibility(
  client: SupabaseClient | null,
  subject: Subject,
  phase: Phase,
  now = new Date(),
): Promise<Eligibility> {
  const gates: Gate[] = [];
  const marketing = subject.purpose === 'marketing';

  if (!client) {
    gates.push(unknown('store', 'Records', 'Supabase is not configured for this deployment'));
    return settle(gates, phase, now);
  }

  // ── 1. Is nurture in service at all? ───────────────────────────────────
  // "If reply detection or unsubscribe processing is unavailable, disable
  // nurture." DISABLE, not degrade: there is no reduced mode where marketing
  // goes out and the opt-out is collected later.
  if (marketing) {
    const missing: string[] = [];
    if (!replyDetectionAvailable()) missing.push('reply detection');
    if (!unsubscribeAvailable()) missing.push('unsubscribe processing');
    gates.push(
      missing.length
        ? block(
            'service',
            'Nurture in service',
            `${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} not available, so nurture is disabled. A person who replies would keep receiving the sequence they replied to, or could not opt out of it.`,
            'hold',
          )
        : pass('service', 'Nurture in service', 'Reply detection and unsubscribe processing are both available.'),
    );
  }

  // ── 2. Suppression ─────────────────────────────────────────────────────
  const suppression = await suppressionFor(client, subject.recipient);
  if (suppression.state === 'unknown') {
    gates.push(unknown('suppression', 'Suppression', 'The suppression list'));
  } else if (suppression.state === 'all') {
    gates.push(
      block(
        'suppression',
        'Suppression',
        `Suppressed for everything — ${suppression.reason}. Transactional messages are withheld too: mail to a dead address is pointless and mail to somebody who reported us is harmful.`,
        'stop',
      ),
    );
  } else if (suppression.state === 'marketing' && marketing) {
    gates.push(
      block(
        'suppression',
        'Suppression',
        `Unsubscribed from marketing — ${suppression.reason}. Receipts are unaffected.`,
        'stop',
      ),
    );
  } else {
    gates.push(
      pass(
        'suppression',
        'Suppression',
        suppression.state === 'marketing'
          ? 'Unsubscribed from marketing, which does not withhold a receipt.'
          : 'Not on the suppression list.',
      ),
    );
  }

  // ── 3. Consent — marketing only, and absence is not permission ─────────
  if (marketing) {
    if (!subject.personId) {
      gates.push(
        block('consent', 'Marketing permission', 'No person on this message, so no permission can be established.', 'cancel'),
      );
    } else {
      const { data, error } = await client
        .from('consents')
        .select('state, wording_version, obtained_at')
        .eq('person_id', subject.personId)
        .eq('purpose', 'marketing')
        .order('obtained_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        gates.push(unknown('consent', 'Marketing permission', 'The consent record', error));
      } else if (!data) {
        // The single most common way a practice sends marketing to somebody who
        // never agreed: treating the receipt they were owed as the permission
        // they did not give.
        gates.push(
          block(
            'consent',
            'Marketing permission',
            'No permission recorded. A receipt is not consent, and an absent record is the absence of permission rather than an unanswered question.',
            'stop',
          ),
        );
      } else if (data.state !== 'granted') {
        gates.push(
          block('consent', 'Marketing permission', 'Permission was withdrawn. The withdrawal is the most recent record.', 'stop'),
        );
      } else {
        gates.push(
          pass('consent', 'Marketing permission', `Granted under wording ${data.wording_version}.`),
        );
      }
    }
  }

  // ── 4. Template approval ───────────────────────────────────────────────
  {
    const { data, error } = await client
      .from('message_templates')
      .select('*')
      .eq('template_key', subject.templateKey)
      .eq('version', subject.templateVersion)
      .maybeSingle();

    if (error) {
      gates.push(unknown('template', 'Approved wording', 'The template store', error));
    } else if (!data) {
      gates.push(
        block(
          'template',
          'Approved wording',
          'No stored row for this template key at this version. Load the package version into the template store; nothing is sent from a wording that is not recorded.',
          'hold',
        ),
      );
    } else {
      const verdict = await verifyStored(data as StoredTemplate);
      if (verdict.sendable) {
        gates.push(
          pass('template', 'Approved wording', `Approved, and the stored words still match the package version.`),
        );
      } else {
        // A wording that is merely unapproved HOLDS — approval may arrive in a
        // minute and the message is still the right one to send. A wording that
        // has drifted from the package, or whose approval was withdrawn, is
        // CANCELLED — it is not the message anybody approved, and re-queueing
        // under a new version is a deliberate act.
        gates.push(
          block('template', 'Approved wording', verdict.reason, verdict.matches && !(data as StoredTemplate).revoked_at ? 'hold' : 'cancel'),
        );
      }
    }
  }

  // ── 5. Cohort availability — marketing only ────────────────────────────
  // E18: closing applications must stop queued promotional invitations. The
  // receipt for an enquiry somebody sent yesterday still goes.
  if (marketing && subject.cohortId) {
    const { data, error } = await client
      .from('cohorts')
      .select('application_open, public_label')
      .eq('cohort_id', subject.cohortId)
      .maybeSingle();

    if (error) {
      gates.push(unknown('cohort', 'Cohort availability', 'The cohort record', error));
    } else if (!data) {
      gates.push(block('cohort', 'Cohort availability', 'No cohort record for this message.', 'cancel'));
    } else if (data.application_open !== true) {
      gates.push(
        block(
          'cohort',
          'Cohort availability',
          'Applications are closed for this cohort, so a message inviting an application is no longer true. Cancelled rather than held: reopening does not make a nine-day-old invitation the right thing to send.',
          'cancel',
        ),
      );
    } else {
      gates.push(pass('cohort', 'Cohort availability', 'Applications are open.'));
    }
  }

  // ── 6. Stage, and 7. the commitment signals ────────────────────────────
  if (marketing && subject.opportunityId) {
    const { data, error } = await client
      .from('opportunities')
      .select('stage, route')
      .eq('opportunity_id', subject.opportunityId)
      .maybeSingle();

    if (error) {
      gates.push(unknown('stage', 'Pipeline stage', 'The opportunity record', error));
    } else if (!data) {
      gates.push(block('stage', 'Pipeline stage', 'No opportunity record for this message.', 'cancel'));
    } else if (STOP_STAGES.has(String(data.stage))) {
      gates.push(
        block('stage', 'Pipeline stage', `At ${String(data.stage).replace(/_/g, ' ')}. Marketing stops here and does not restart.`, 'stop'),
      );
    } else if (PAUSE_STAGES.has(String(data.stage))) {
      gates.push(
        block('stage', 'Pipeline stage', 'On hold. Paused for operator review rather than stopped — a hold is a decision somebody may reverse.', 'pause'),
      );
    } else {
      gates.push(pass('stage', 'Pipeline stage', `At ${String(data.stage).replace(/_/g, ' ')}.`));
    }

    // A meeting, an offer or a payment is a stop signal in its own right and can
    // precede the stage move that records it. The brief lists them separately
    // from stage for exactly that reason: somebody books a call on Tuesday and
    // the stage is moved on Thursday, and the day-5 message is due Wednesday.
    const [meetings, offers, payments] = await Promise.all([
      client
        .from('meetings')
        .select('meeting_id')
        .eq('opportunity_id', subject.opportunityId)
        .in('status', ['scheduled', 'held'])
        .limit(1),
      client.from('offers').select('offer_id').eq('opportunity_id', subject.opportunityId).limit(1),
      client.from('payments').select('payment_id').eq('opportunity_id', subject.opportunityId).limit(1),
    ]);

    if (meetings.error || offers.error || payments.error) {
      gates.push(
        unknown('commitment', 'Meeting, offer or payment', 'The meeting, offer and payment records', meetings.error ?? offers.error ?? payments.error),
      );
    } else {
      const found = [
        meetings.data?.length ? 'a meeting is booked or has been held' : '',
        offers.data?.length ? 'an offer exists' : '',
        payments.data?.length ? 'a payment has been recorded' : '',
      ].filter(Boolean);

      gates.push(
        found.length
          ? block('commitment', 'Meeting, offer or payment', `${found.join(', ')}. A conversation has started; the sequence stops.`, 'stop')
          : pass('commitment', 'Meeting, offer or payment', 'None recorded.'),
      );
    }
  }

  // ── 8. A reply stops everything ────────────────────────────────────────
  // Only asked when reply detection is in service. When it is not, gate 1 has
  // already blocked, and asking a table that cannot know the answer would
  // produce a confident 'pass' on the most important stop signal there is.
  if (marketing && replyDetectionAvailable() && subject.personId) {
    const { data, error } = await client
      .from('comms_events')
      .select('event_id, comms_messages!inner(person_id)')
      .eq('type', 'reply')
      .eq('comms_messages.person_id', subject.personId)
      .limit(1);

    if (error) {
      gates.push(unknown('reply', 'Reply', 'The provider event log', error));
    } else {
      gates.push(
        data?.length
          ? block('reply', 'Reply', 'This person has replied. A reply is the first item on the stop list.', 'stop')
          : pass('reply', 'Reply', 'No reply recorded.'),
      );
    }
  }

  // ── 9. The sequence itself ─────────────────────────────────────────────
  if (subject.sequenceId) {
    const { data, error } = await client
      .from('comms_sequences')
      .select('state, stopped_reason, paused_reason')
      .eq('sequence_id', subject.sequenceId)
      .maybeSingle();

    if (error) {
      gates.push(unknown('sequence', 'Sequence state', 'The sequence record', error));
    } else if (!data) {
      gates.push(block('sequence', 'Sequence state', 'No sequence record.', 'cancel'));
    } else if (data.state === 'active') {
      gates.push(pass('sequence', 'Sequence state', 'Active.'));
    } else if (data.state === 'paused') {
      gates.push(
        block('sequence', 'Sequence state', `Paused${data.paused_reason ? `: ${data.paused_reason}` : '.'} A paused sequence is resumed by hand after review, never by a sweep.`, 'hold'),
      );
    } else {
      gates.push(
        block('sequence', 'Sequence state', `${data.state === 'stopped' ? `Stopped${data.stopped_reason ? `: ${data.stopped_reason}` : '.'}` : 'Completed.'} Stopped sequences do not restart.`, 'cancel'),
      );
    }
  }

  // ── Dispatch-only gates ────────────────────────────────────────────────
  if (phase === 'dispatch') {
    // 10. The address on the message is still the person's address.
    if (subject.personId) {
      const { data, error } = await client
        .from('people')
        .select('normalised_email')
        .eq('person_id', subject.personId)
        .maybeSingle();

      if (error) {
        gates.push(unknown('address', 'Recipient address', 'The person record', error));
      } else if (!data) {
        gates.push(block('address', 'Recipient address', 'No person record. They may have been erased.', 'cancel'));
      } else if (String(data.normalised_email).trim().toLowerCase() !== subject.recipient.trim().toLowerCase()) {
        // A message approved for one address is not approved for another.
        // Re-aiming it silently is how a correction to a typo sends somebody
        // else's application receipt to a stranger.
        gates.push(
          block('address', 'Recipient address', 'The address on this message is no longer this person\'s address. Cancel and queue again rather than re-aiming it.', 'cancel'),
        );
      } else {
        gates.push(pass('address', 'Recipient address', 'Still current.'));
      }
    }

    // 11. Staleness. See STALE_AFTER_MS.
    if (marketing && subject.scheduledFor) {
      const lateBy = now.getTime() - Date.parse(subject.scheduledFor);
      gates.push(
        Number.isFinite(lateBy) && lateBy > STALE_AFTER_MS
          ? block(
              'staleness',
              'Still timely',
              `Due ${Math.floor(lateBy / 86_400_000)} days ago. A message this late is not the message that was approved, and sending a backlog at once is the burst the brief forbids.`,
              'cancel',
            )
          : pass('staleness', 'Still timely', 'Within the window it was scheduled for.'),
      );
    }

    // 12. The seam. Last, so everything above is still evaluated and visible:
    // a screen that stops at "dispatch is off" cannot tell you whether the rest
    // of the system would have said yes.
    const sw = dispatchSwitch();
    gates.push(
      sw.enabled
        ? pass('dispatch', 'Dispatch switch', 'Dispatch is enabled.')
        : block('dispatch', 'Dispatch switch', sw.reason, 'hold'),
    );
  }

  return settle(gates, phase, now);
}

function settle(gates: Gate[], phase: Phase, now: Date): Eligibility {
  const blocking = gates.filter((g) => g.state !== 'pass');
  const sendable = blocking.length === 0;

  const effect =
    blocking
      .filter((g) => g.state === 'blocked')
      .reduce<Effect | null>((worst, g) => (worst === null || RANK[g.effect] > RANK[worst] ? g.effect : worst), null) ??
    (blocking.length ? 'hold' : null);

  const unknowns = blocking.filter((g) => g.state === 'unknown').length;

  const summary = sendable
    ? `Every check passed at ${phase} time.`
    : unknowns > 0 && blocking.length === unknowns
      ? `Held: ${unknowns} check${unknowns === 1 ? '' : 's'} could not be established. Unknown is never a pass.`
      : `Not sendable: ${blocking.map((g) => g.label.toLowerCase()).join(', ')}.`;

  return { sendable, phase, checkedAt: now.toISOString(), gates, effect, blocking, summary };
}
