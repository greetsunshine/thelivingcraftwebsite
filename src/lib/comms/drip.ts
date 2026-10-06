// The resource follow-up sequence: what to send next, when, and the planner
// that decides it. PURE. Nothing in this file touches the database, the
// environment or the clock; every one of those comes in as an argument, so
// every rule here runs under `node --test` with a controllable clock and an
// in-memory store (drip-memory.ts). The Supabase store is drip-store.ts and
// the wiring is drip-runtime.ts.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT A FOLLOW-UP SEQUENCE IS
// ───────────────────────────────────────────────────────────────────────────
//
// Somebody asks for a resource and ticks the marketing box. The resource goes
// at once (the transactional delivery, resources.ts). The sequence opens
// AWAITING CONFIRMATION and one email asks the person to confirm. Once they
// click it, a step falls due on calendar days 2, 5, 9 and 14 after the click,
// then seven days after each actual send. Each step recommends one other
// resource, chosen at the moment of sending from the routing catalogue, never
// the one they asked for and never one already sent, until the catalogue is
// used up or the person stops it.
//
// THE SOURCE is the outreach package's resource brief,
// 05-email-and-resource-routing (revised 29 September 2026). This file was
// brought in line with it on 6 October 2026: the confirmation step, the
// schedule, the pause rules, the release guard and the relevance sentences
// all come from that document.
//
// ───────────────────────────────────────────────────────────────────────────
// THE SCHEDULE, AND THE THREE RULES THAT BOUND IT
// ───────────────────────────────────────────────────────────────────────────
//
//   * Days 2, 5, 9 and 14 count from the CONFIRMATION, in calendar days in
//     Asia/Kolkata, at 10:00. After step 4, seven days after the last ACTUAL
//     send. A weekend slot moves to Monday 10:00.
//   * At least 48 hours between actual sends, which also means at most one a
//     day. A slot that would break that moves to the first weekday 10:00
//     after the 48 hours.
//   * NO CATCH-UP BURST. The next step is not planned while the last one is
//     still in the outbox, and its time is computed from when the last one
//     really went. A week of dispatch being off leaves one queued message,
//     not seven.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT PAUSES IT, AND WHAT STOPS IT
// ───────────────────────────────────────────────────────────────────────────
//
// Pause (a person reviews it, nothing resumes on its own): a reply, a booked
// call, an open application or enquiry, a payment, or an operator pausing it
// by hand ("manual owner"). Stop (for good): an unsubscribe, a hard bounce, a
// complaint, withdrawn consent. Exhausted: nothing eligible is left.
//
// The planner reads the pause signals just before it queues each step. The
// dispatch sweep then re-checks suppression, consent, replies and the
// sequence state again just before sending (eligibility.ts).
//
// It is a `comms_sequences` row with route 'resource', and its messages are
// `comms_messages` rows like every other, so the second eligibility check, the
// unsubscribe path, the suppression list and the console all apply to it
// without a line of new code in any of them.
//
// ───────────────────────────────────────────────────────────────────────────
// THE PLANNER RUNS AHEAD OF THE SWEEP, AND ONLY EVER ONE STEP AHEAD
// ───────────────────────────────────────────────────────────────────────────
//
// The twelve cohort messages are queued all at once when the sequence opens,
// because their wording is fixed. A follow-up cannot be: "recalculate eligible
// resources before each send; newly added resources must still be reviewed and
// must not cause a sequence restart" (05-email-and-resource-routing). So the
// planner queues exactly one message when a step becomes due, and the
// existing dispatch sweep sends it. Between steps nothing is queued, which is
// what lets a resource added to the catalogue tomorrow be recommended the day
// after without touching a row.
//
// ───────────────────────────────────────────────────────────────────────────
// TWO PLANNERS AT ONCE, AND WHY NEITHER CAN SEND TWICE
// ───────────────────────────────────────────────────────────────────────────
//
//   1. THE LEASE. A planner claims a due sequence with one conditional update:
//      "set next_send_at to <a few minutes from now> where next_send_at is
//      still <the value I read>". Two planners read the same row; one update
//      matches; the other matches nothing and moves on. If the winner dies
//      before finishing, the lease expires and the next run picks it up.
//   2. THE KEY. The message it queues is 'drip:<sequence>:<step>', unique on
//      the outbox. A planner that somehow got past the lease still cannot
//      write a second row for the same step, and comms_drip_sends is unique on
//      (sequence, step) and on (sequence, resource) besides.
//
// Both are in the database, not in this file. This file just reads the
// answers and reports them.

import { DRIP_MODULES, moduleForRequestId, type DripModule } from '../../data/resource-routing.ts';
import { roleCodeFor, type RoleCode } from '../../data/audience-roles.ts';
import { CONFIRMATION_TEMPLATE, dripTemplateFor, fillDripBody, relevanceSentence } from './drip-templates.ts';
import { renderMessage } from './templates.ts';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface DripConfig {
  /**
   * Calendar days after the confirmation for steps 1 to 4. The brief: "Days
   * 2, 5, 9 and 14 from the first qualifying opt-in, then weekly".
   */
  offsets: readonly number[];
  /** Calendar days after the last actual send, from step 5 on. The brief: 7. */
  weeklyDays: number;
  /** The least time between two actual sends. The brief: 48 hours. */
  minGapHours: number;
  /** Local hour of the send, 0-23. The brief: 10:00. */
  hour: number;
  /** IANA zone the hour and the weekday are read in. The brief: Asia/Kolkata. */
  zone: string;
  /** How long a planner's claim lasts before another may take the row. */
  leaseMinutes: number;
  /** How soon to look again at a sequence whose last step has not gone yet. */
  recheckMinutes: number;
}

export const DEFAULT_DRIP_CONFIG: Readonly<DripConfig> = {
  offsets: [2, 5, 9, 14],
  weeklyDays: 7,
  minGapHours: 48,
  hour: 10,
  zone: 'Asia/Kolkata',
  leaseMinutes: 10,
  recheckMinutes: 60,
};

export const isValidZone = (zone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const int = (v: string, fallback: number, min: number, max: number): number => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

/**
 * The config from an environment reader. Out-of-range values fall back, never
 * throw. Only the hour and the zone can be changed: the offsets, the weekly
 * gap and the 48 hours are the brief's, and a setting that quietly overrode
 * them would be a second source for a decided fact.
 */
export function dripConfig(read: (key: string) => string): DripConfig {
  const zone = read('COMMS_DRIP_TIMEZONE').trim();
  return {
    ...DEFAULT_DRIP_CONFIG,
    hour: int(read('COMMS_DRIP_SEND_HOUR'), DEFAULT_DRIP_CONFIG.hour, 0, 23),
    zone: zone && isValidZone(zone) ? zone : DEFAULT_DRIP_CONFIG.zone,
  };
}

// ---------------------------------------------------------------------------
// The calendar clock
// ---------------------------------------------------------------------------

interface WallParts {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

const wallParts = (t: number, zone: string): WallParts => {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(new Date(t))) p[part.type] = part.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
};

/** Milliseconds the zone is ahead of UTC at instant `t`. */
const offsetAt = (t: number, zone: string): number => {
  const p = wallParts(t, zone);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(t / 1000) * 1000;
};

/**
 * `hour`:00 in `zone`, `dayOffset` calendar days after the anchor's own date
 * in that zone.
 *
 * Calendar days, not 24-hour multiples: a request at 23:30 and one at 00:30
 * are an hour apart and a day apart in the reader's calendar, and "day 2"
 * must mean the same thing to both. The zone goes through `Intl`, so a zone
 * with daylight saving is right on both sides of a change; the outbox's
 * `nurtureSlot()` is a fixed-offset shortcut that is only ever right for
 * Asia/Kolkata, and this is the general form it says it would need.
 *
 * On a spring-forward day where `hour`:00 does not exist, the slot lands at
 * the first instant after the gap.
 */
export function sendSlot(anchorISO: string, dayOffset: number, zone: string, hour: number): string {
  const anchor = Date.parse(anchorISO);
  if (!Number.isFinite(anchor)) throw new RangeError('sendSlot: anchor is not a date');
  if (!Number.isInteger(dayOffset)) throw new RangeError('sendSlot: dayOffset must be an integer');

  const a = wallParts(anchor, zone);
  // The wanted wall-clock time, expressed as if it were UTC. Date.UTC carries
  // month and year overflow, so the 30th + 2 is the 1st.
  const wall = Date.UTC(a.y, a.m - 1, a.d + dayOffset, hour, 0, 0);

  // Two passes: the offset at the guess, then the offset at the corrected
  // instant, which differ only across a daylight-saving change.
  let t = wall - offsetAt(wall, zone);
  t = wall - offsetAt(t, zone);
  return new Date(t).toISOString();
}

/** Day of the week in `zone` at instant `t`, 0 = Sunday. */
const weekdayAt = (t: number, zone: string): number => {
  const p = wallParts(t, zone);
  return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
};

/** A slot on a Saturday or Sunday moves to Monday at the same hour. */
export function rollToWeekday(slotISO: string, zone: string, hour: number): string {
  const day = weekdayAt(Date.parse(slotISO), zone);
  if (day === 6) return sendSlot(slotISO, 2, zone, hour);
  if (day === 0) return sendSlot(slotISO, 1, zone, hour);
  return slotISO;
}

/** The first weekday `hour`:00 at or after the instant `atISO`. */
export function firstSlotAtOrAfter(atISO: string, zone: string, hour: number): string {
  const at = Date.parse(atISO);
  let slot = sendSlot(atISO, 0, zone, hour);
  if (Date.parse(slot) < at) slot = sendSlot(atISO, 1, zone, hour);
  return rollToWeekday(slot, zone, hour);
}

/**
 * When step `step` (1-based) is due.
 *
 *   1. Steps 1 to 4: the offset day after the confirmation. Later steps: seven
 *      days after the last actual send.
 *   2. A weekend slot moves to Monday.
 *   3. If that is under 48 hours after the last actual send, the first
 *      weekday slot after the 48 hours instead.
 *
 * Pure. The planner calls it at the moment a step falls due, with the real
 * time of the last send, so a late send moves everything after it.
 */
export function slotForStep(args: { step: number; enrolledAt: string; lastSentAt: string | null; config?: DripConfig }): string {
  const cfg = args.config ?? DEFAULT_DRIP_CONFIG;
  const { zone, hour } = cfg;
  if (!Number.isInteger(args.step) || args.step < 1) throw new RangeError('slotForStep: step starts at 1');

  let slot =
    args.step <= cfg.offsets.length
      ? sendSlot(args.enrolledAt, cfg.offsets[args.step - 1], zone, hour)
      : sendSlot(args.lastSentAt ?? args.enrolledAt, cfg.weeklyDays, zone, hour);
  slot = rollToWeekday(slot, zone, hour);

  if (args.lastSentAt) {
    const floor = Date.parse(args.lastSentAt) + cfg.minGapHours * 3_600_000;
    if (Date.parse(slot) < floor) slot = firstSlotAtOrAfter(new Date(floor).toISOString(), zone, hour);
  }
  return slot;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface RecommendArgs {
  /** The catalogue id of the resource that opened the sequence, if it maps to one. */
  initial: string | null;
  /** Catalogue ids never to return: everything requested and everything sent. */
  excluded: Iterable<string>;
  roleCode: RoleCode | null;
  /** The catalogue. Defaults to the live one; tests pass their own. */
  catalogue?: readonly DripModule[];
}

/**
 * The next resource, or null when nothing eligible is left.
 *
 *   1. never the initial resource, never one in `excluded`, never inactive,
 *      never one Sunil has not released;
 *   2. the initial resource's preferred follow-ups, in the matrix's order;
 *   3. then modules whose proposed roles include the person's, in catalogue order;
 *   4. then the rest, in catalogue order.
 */
export function recommend(args: RecommendArgs): DripModule | null {
  const catalogue = args.catalogue ?? DRIP_MODULES;
  const out = new Set<string>();
  for (const id of args.excluded) out.add(id.toLowerCase());
  if (args.initial) out.add(args.initial.toLowerCase());

  const byId = new Map(catalogue.map((m) => [m.id.toLowerCase(), m]));
  const eligible = (m: DripModule | undefined): m is DripModule =>
    Boolean(m && m.active && m.released && !out.has(m.id.toLowerCase()));

  const initial = args.initial ? byId.get(args.initial.toLowerCase()) : undefined;
  for (const id of initial?.preferredFollowUps ?? []) {
    const m = byId.get(id.toLowerCase());
    if (eligible(m)) return m;
  }

  const rest = catalogue.filter(eligible).sort((a, b) => a.priority - b.priority);
  if (args.roleCode) {
    const role = args.roleCode;
    const hit = rest.find((m) => m.roles.includes(role));
    if (hit) return hit;
  }
  return rest[0] ?? null;
}

// ---------------------------------------------------------------------------
// The store, as this file sees it
// ---------------------------------------------------------------------------

export type DripState = 'awaiting_confirmation' | 'active' | 'paused' | 'stopped' | 'completed';

export interface DripSequence {
  sequenceId: string;
  personId: string;
  /** The catalogue id, or the raw request id when no module claims it. */
  resourceId: string;
  requestId: string | null;
  state: DripState;
  nextSendAt: string | null;
  /** Steps planned so far. A step is planned once and never again. */
  stepsSent: number;
  /** When the request that opened it was saved. */
  anchorAt: string;
  /** When the person clicked the confirmation link. Day 2, 5, 9 and 14 count from here. */
  confirmedAt: string | null;
  /** The last reviewed resume, if any. Pause signals older than this were already reviewed. */
  resumedAt: string | null;
}

export interface DripPerson {
  firstName: string | null;
  recipient: string;
  role: string | null;
  roleCode: string | null;
}

export interface DripMessage {
  idempotencyKey: string;
  sequenceId: string;
  personId: string;
  templateKey: string;
  templateVersion: string;
  /** 'transactional' for the confirmation request only. */
  purpose: 'marketing' | 'transactional';
  /** 0 for the confirmation request, 1 upwards for a follow-up. */
  step: number;
  recipient: string;
  subject: string;
  body: string;
  scheduledFor: string;
}

export interface OpenRow {
  personId: string;
  requestId: string | null;
  resourceId: string;
  anchorAt: string;
}

/**
 * What a person's latest marketing permission is.
 *
 *   'confirmed'  granted, and the confirmation link was clicked
 *   'granted'    a box was ticked, and nobody has clicked the link yet
 *   'withdrawn'  the most recent record is a withdrawal
 *   'none'       no record at all
 *   'unknown'    the read failed; nothing is decided on it
 */
export type ConsentRead = 'confirmed' | 'granted' | 'withdrawn' | 'none' | 'unknown';

export interface StepStatus {
  /** A follow-up for this sequence is still queued, sending or unreconciled. */
  pending: boolean;
  /** When the last follow-up actually went, if one did. The 48-hour rule counts from here. */
  lastSentAt: string | null;
}

export interface DripStore {
  /** Active resource sequences whose next_send_at has arrived, oldest first. */
  due(nowISO: string, limit: number): Promise<DripSequence[]>;
  /** Move next_send_at to `untilISO` only if it still equals `seenISO`. True when this caller won. */
  lease(sequenceId: string, seenISO: string, untilISO: string): Promise<boolean>;
  person(personId: string): Promise<DripPerson | null>;
  /** The request ids (resource_requests.resource_id) this person has ever asked for. */
  requestedIds(personId: string): Promise<string[]>;
  /** Catalogue ids already planned in this sequence. */
  sentIds(sequenceId: string): Promise<string[]>;
  /** Whether the last follow-up has gone yet, and when the last one went. Null when unknown. */
  stepStatus(sequenceId: string): Promise<StepStatus | null>;
  /**
   * The reasons this person should not be sent marketing right now: a reply, a
   * booked call, an application, a payment. Empty when there are none; null
   * when the read failed.
   */
  pauseSignals(args: { personId: string; recipient: string; sinceISO: string; everResumed: boolean }): Promise<string[] | null>;
  /** Insert on the outbox. `duplicate` when the idempotency key already exists. */
  queueMessage(m: DripMessage): Promise<{ messageId: string | null; duplicate: boolean }>;
  recordSend(sequenceId: string, moduleId: string, step: number, messageId: string | null): Promise<void>;
  schedule(sequenceId: string, nextSendAtISO: string, stepsSent: number): Promise<void>;
  complete(sequenceId: string, atISO: string): Promise<void>;
  stop(sequenceId: string, reason: string, atISO: string): Promise<void>;
  /** Pause, and cancel anything queued for it. Only a person resumes it. */
  pause(sequenceId: string, reason: string, atISO: string): Promise<void>;
  /** The one live sequence for a person (awaiting confirmation, active or paused), whatever its route. */
  liveSequenceFor(personId: string): Promise<{ sequenceId: string; route: string; state: string } | null>;
  /** Whether this person has EVER had a resource sequence, in any state. Null when unknown. */
  hadResourceSequence(personId: string): Promise<boolean | null>;
  /** One sequence by id, for the confirmation link. */
  sequence(sequenceId: string): Promise<DripSequence | null>;
  consentState(personId: string): Promise<ConsentRead>;
  /** Append a granted, unconfirmed marketing consent row. False when it could not be written. */
  grantConsent(personId: string, source: string, atISO: string): Promise<boolean>;
  /** Append the confirming row: granted, with confirmed_at. False when it could not be written. */
  confirmConsent(personId: string, atISO: string): Promise<boolean>;
  /** Open a resource sequence awaiting confirmation. `duplicate` when the one-live-sequence index refused. */
  open(row: OpenRow): Promise<{ sequenceId: string | null; duplicate: boolean }>;
  /** Move awaiting_confirmation to active. False when it was not awaiting (already confirmed, stopped). */
  activate(sequenceId: string, confirmedAtISO: string, nextSendAtISO: string): Promise<boolean>;
  /** Sequences awaiting confirmation that have never had a confirmation request queued. */
  awaitingWithoutRequest(limit: number): Promise<{ sequenceId: string; personId: string }[]>;
}

// ---------------------------------------------------------------------------
// The confirmation request
// ---------------------------------------------------------------------------

/**
 * The confirmation email for one sequence, ready for the outbox.
 *
 * `key` makes it idempotent: 'confirm:<sequence>:1' for the first request,
 * 'confirm:<sequence>:<date>' for a later one, so a person who ticks the box
 * three times in an afternoon is sent one confirmation request that day.
 */
const confirmationMessage = (seq: { sequenceId: string; personId: string }, person: DripPerson, key: string, atISO: string): DripMessage => {
  const rendered = renderMessage(CONFIRMATION_TEMPLATE);
  return {
    idempotencyKey: key,
    sequenceId: seq.sequenceId,
    personId: seq.personId,
    templateKey: CONFIRMATION_TEMPLATE.key,
    templateVersion: CONFIRMATION_TEMPLATE.version,
    purpose: 'transactional',
    step: 0,
    recipient: person.recipient,
    subject: rendered.subject,
    body: rendered.body,
    scheduledFor: atISO,
  };
};

/** The calendar date in the sending zone, for a once-a-day key. */
const localDate = (atISO: string, zone: string): string => {
  const p = wallParts(Date.parse(atISO), zone);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Opening
// ---------------------------------------------------------------------------

export interface OpenRequest {
  personId: string;
  requestId: string | null;
  /** The id the request was saved under (resource_requests.resource_id). */
  requestResourceId: string;
  /** Whether the marketing box was ticked on THIS request. */
  consented: boolean;
  now: Date;
  config?: DripConfig;
}

export type OpenOutcome =
  | { opened: true; sequenceId: string; resourceId: string; confirmationQueued: boolean }
  | { opened: false; why: string };

/**
 * Open a follow-up sequence for a saved request, if the person allowed it.
 *
 * The sequence opens AWAITING CONFIRMATION and one email goes out asking the
 * person to confirm. Nothing else is sent until they click it (confirmDrip
 * below). The brief: "If the person opts in, verify the address through the
 * selected provider's confirmation flow before marketing starts."
 *
 * THE CONSENT IS RECORDED BEFORE THE LIVE-SEQUENCE CHECK. A person already in
 * the application sequence who ticks the box has still given permission, and
 * that row is evidence worth keeping even though no second sequence opens.
 *
 * NO RE-ENROLMENT. A person who has had a resource sequence before, in any
 * state, does not get a new one from another tick. The brief: "A duplicate
 * form submission does not create another active sequence, reset the
 * cadence, clear suppression or re-enrol a stopped contact." Re-enrolment is
 * a reviewed decision somebody makes in the console, not a side effect of a
 * download.
 */
export async function openResourceDrip(store: DripStore, req: OpenRequest): Promise<OpenOutcome> {
  if (!req.consented) {
    return { opened: false, why: 'No marketing permission was given with this request. The resource is sent; nothing else is.' };
  }
  const cfg = req.config ?? DEFAULT_DRIP_CONFIG;
  const at = req.now.toISOString();

  const granted = await store.grantConsent(req.personId, 'resource-gate', at);
  if (!granted) {
    return { opened: false, why: 'The consent record could not be written, so no sequence was opened. Nothing is sent without a recorded permission.' };
  }

  const live = await store.liveSequenceFor(req.personId);
  if (live) {
    // Still waiting for the click: send the request again, at most once a day.
    if (live.route === 'resource' && live.state === 'awaiting_confirmation' && live.sequenceId) {
      const person = await store.person(req.personId);
      if (person) {
        const q = await store.queueMessage(
          confirmationMessage({ sequenceId: live.sequenceId, personId: req.personId }, person, `confirm:${live.sequenceId}:${localDate(at, cfg.zone)}`, at),
        );
        return {
          opened: false,
          why: q.duplicate
            ? 'This person is already waiting to confirm, and a confirmation request went today. Nothing more was queued.'
            : 'This person is already waiting to confirm. The confirmation request was queued again.',
        };
      }
    }
    return {
      opened: false,
      why: `This person already has a ${live.state} ${live.route} sequence. One live sequence per person; the permission was recorded and no second sequence was opened.`,
    };
  }

  const before = await store.hadResourceSequence(req.personId);
  if (before !== false) {
    return {
      opened: false,
      why:
        before === null
          ? 'Whether this person had a follow-up sequence before could not be checked, so none was opened. The permission was recorded.'
          : 'This person has had a follow-up sequence before. A new tick does not re-enrol them; that is a reviewed decision. The permission was recorded.',
    };
  }

  const person = await store.person(req.personId);
  if (!person) return { opened: false, why: 'The person record could not be read, so no sequence was opened.' };

  const module = moduleForRequestId(req.requestResourceId);
  const resourceId = module?.id ?? req.requestResourceId;

  const opened = await store.open({ personId: req.personId, requestId: req.requestId, resourceId, anchorAt: at });
  if (opened.duplicate) {
    return { opened: false, why: 'Another sequence for this person was opened at the same moment. One live sequence per person; this one was not created.' };
  }
  if (!opened.sequenceId) {
    return { opened: false, why: 'The sequence record could not be written. The request and the permission are saved.' };
  }

  const q = await store.queueMessage(
    confirmationMessage({ sequenceId: opened.sequenceId, personId: req.personId }, person, `confirm:${opened.sequenceId}:1`, at),
  );
  return { opened: true, sequenceId: opened.sequenceId, resourceId, confirmationQueued: Boolean(q.messageId) };
}

// ---------------------------------------------------------------------------
// Confirming
// ---------------------------------------------------------------------------

export type ConfirmOutcome = 'confirmed' | 'already' | 'gone';

/**
 * The person clicked the confirmation link and pressed the button.
 *
 *   'confirmed'  the sequence was waiting and is now active; day 2 counts from now
 *   'already'    it was confirmed before; nothing changed
 *   'gone'       no such sequence, not this person's, or stopped (an
 *                unsubscribe, a bounce). Never re-opened from a link.
 *
 * A GET never reaches this. The page asks for a button press, because mail
 * scanners follow every link in a message and a scanner is not a person
 * saying yes. The brief: "no consent activation on a scanner GET alone".
 */
export async function confirmDrip(
  store: DripStore,
  args: { sequenceId: string; personId: string; now: Date; config?: DripConfig },
): Promise<ConfirmOutcome> {
  const cfg = args.config ?? DEFAULT_DRIP_CONFIG;
  const seq = await store.sequence(args.sequenceId);
  if (!seq || seq.personId !== args.personId) return 'gone';
  if (seq.state !== 'awaiting_confirmation') {
    return seq.confirmedAt && seq.state !== 'stopped' ? 'already' : 'gone';
  }

  const consent = await store.consentState(args.personId);
  if (consent === 'withdrawn' || consent === 'none' || consent === 'unknown') return 'gone';

  const at = args.now.toISOString();
  if (!(await store.confirmConsent(args.personId, at))) return 'gone';

  const first = slotForStep({ step: 1, enrolledAt: at, lastSentAt: null, config: cfg });
  const moved = await store.activate(args.sequenceId, at, first);
  if (moved) return 'confirmed';
  // Lost a race with a second click, or an unsubscribe landed in between.
  const again = await store.sequence(args.sequenceId);
  return again?.confirmedAt && again.state !== 'stopped' ? 'already' : 'gone';
}

// ---------------------------------------------------------------------------
// The planner
// ---------------------------------------------------------------------------

export type PlannerOutcome = 'planned' | 'completed' | 'already-queued' | 'lost-lease' | 'stopped' | 'paused' | 'held' | 'waiting';

export interface PlannerLine {
  sequenceId: string;
  outcome: PlannerOutcome;
  step: number | null;
  moduleId: string | null;
  messageId: string | null;
  detail: string;
}

export interface PlannerResult {
  ranAt: string;
  considered: number;
  planned: number;
  completed: number;
  paused: number;
  skipped: number;
  /** Confirmation requests queued for sequences that never had one (opened before 6 October). */
  confirmationsQueued: number;
  lines: PlannerLine[];
}

export interface PlannerEvent {
  type: 'planned' | 'completed' | 'stopped' | 'paused';
  sequenceId: string;
  moduleId: string | null;
  step: number | null;
}

export interface PlannerOptions {
  now?: Date;
  config?: DripConfig;
  catalogue?: readonly DripModule[];
  limit?: number;
  /** The date-aware cohort block for {{cohort_invitation}}. Supplied by the runtime. */
  cohortInvitation: string;
  /** Called after each state change. Best effort; an error here never stops the run. */
  onEvent?: (e: PlannerEvent) => Promise<void> | void;
}

export const PLANNER_LIMIT = 50;

const later = (now: Date, minutes: number): string => new Date(now.getTime() + minutes * 60_000).toISOString();

export async function runDripPlanner(store: DripStore, opts: PlannerOptions): Promise<PlannerResult> {
  const now = opts.now ?? new Date();
  const nowISO = now.toISOString();
  const cfg = opts.config ?? DEFAULT_DRIP_CONFIG;
  const catalogue = opts.catalogue ?? DRIP_MODULES;
  const emit = async (e: PlannerEvent) => {
    try {
      await opts.onEvent?.(e);
    } catch {
      /* reporting must never stop the work */
    }
  };
  const limit = Math.min(opts.limit ?? PLANNER_LIMIT, PLANNER_LIMIT);

  // ── 0. Sequences that never had a confirmation request ─────────────────
  // Those opened before 6 October were opened straight into 'active'; the
  // schema moved them back to 'awaiting_confirmation'. They are owed the one
  // email that asks. The key makes this run-twice safe.
  let confirmationsQueued = 0;
  for (const w of await store.awaitingWithoutRequest(limit)) {
    const person = await store.person(w.personId);
    if (!person) continue;
    const q = await store.queueMessage(confirmationMessage(w, person, `confirm:${w.sequenceId}:1`, nowISO));
    if (q.messageId && !q.duplicate) confirmationsQueued += 1;
  }

  const due = await store.due(nowISO, limit);
  const lines: PlannerLine[] = [];
  let planned = 0;
  let completed = 0;
  let paused = 0;
  let skipped = 0;

  // Nothing released means nothing can be chosen for anybody. That is a fact
  // about the catalogue, so it holds every sequence rather than ending each
  // one as if the person had seen everything.
  const anyReleased = catalogue.some((m) => m.active && m.released);

  for (const seq of due) {
    const line = (outcome: PlannerOutcome, detail: string, extra: Partial<PlannerLine> = {}) =>
      lines.push({ sequenceId: seq.sequenceId, outcome, step: null, moduleId: null, messageId: null, detail, ...extra });

    if (!seq.nextSendAt) {
      skipped += 1;
      line('held', 'No next send time on an active sequence. Left alone.');
      continue;
    }

    // ── 1. The lease ───────────────────────────────────────────────────────
    const won = await store.lease(seq.sequenceId, seq.nextSendAt, later(now, cfg.leaseMinutes));
    if (!won) {
      skipped += 1;
      line('lost-lease', 'Claimed by another planner. One sequence, one claim.');
      continue;
    }
    const giveBack = (at: string = seq.nextSendAt!) => store.schedule(seq.sequenceId, at, seq.stepsSent);

    // ── 2. Who ─────────────────────────────────────────────────────────────
    const person = await store.person(seq.personId);
    if (!person) {
      await store.stop(seq.sequenceId, 'person record missing', nowISO);
      await emit({ type: 'stopped', sequenceId: seq.sequenceId, moduleId: null, step: null });
      skipped += 1;
      line('stopped', 'The person record is gone. Stopped; nothing can be addressed.');
      continue;
    }

    // ── 3. Permission, re-read every step ──────────────────────────────────
    const consent = await store.consentState(seq.personId);
    if (consent === 'withdrawn' || consent === 'none') {
      const reason = consent === 'withdrawn' ? 'consent withdrawn' : 'no marketing consent on record';
      await store.stop(seq.sequenceId, reason, nowISO);
      await emit({ type: 'stopped', sequenceId: seq.sequenceId, moduleId: null, step: null });
      skipped += 1;
      line('stopped', `${reason[0].toUpperCase()}${reason.slice(1)}. Stopped; nothing is sent without a recorded permission.`);
      continue;
    }
    if (consent === 'unknown' || consent === 'granted' || !seq.confirmedAt) {
      await giveBack();
      skipped += 1;
      line(
        'held',
        consent === 'unknown'
          ? 'The consent record did not answer. Nothing is sent on an unestablished check; the step is still due.'
          : 'Active, but no confirmed permission is on record. Nothing is sent until the confirmation link is clicked.',
      );
      continue;
    }

    // ── 4. Pause signals: a reply, a call, an application, a payment ──────
    // The brief: these "pause the sequence and cancel pending nurture ... no
    // automatic resume". Only events since the last reviewed resume count, so
    // a person somebody has already looked at is not paused again for the
    // same reply.
    const signals = await store.pauseSignals({
      personId: seq.personId,
      recipient: person.recipient,
      sinceISO: seq.resumedAt ?? seq.anchorAt,
      everResumed: Boolean(seq.resumedAt),
    });
    if (signals === null) {
      await giveBack(later(now, cfg.recheckMinutes));
      skipped += 1;
      line('held', 'Whether this person replied, booked, applied or paid could not be checked. Held, and checked again shortly.');
      continue;
    }
    if (signals.length) {
      const reason = signals.join('; ');
      await store.pause(seq.sequenceId, reason, nowISO);
      await emit({ type: 'paused', sequenceId: seq.sequenceId, moduleId: null, step: null });
      paused += 1;
      line('paused', `Paused: ${reason}. A person reviews it; nothing resumes on its own.`);
      continue;
    }

    // ── 5. The previous step has to have gone ──────────────────────────────
    // "Seven days after each actual send" and "at least 48 hours between
    // actual sends": both count from a real send, so a step that is still in
    // the outbox (dispatch off, a hold, an unknown outcome) blocks the next
    // one. This is what stops a backlog from leaving as a burst.
    const status = await store.stepStatus(seq.sequenceId);
    if (!status) {
      await giveBack(later(now, cfg.recheckMinutes));
      skipped += 1;
      line('held', 'The outbox did not answer, so whether the last follow-up went is unknown. Held.');
      continue;
    }
    if (status.pending) {
      await giveBack(later(now, cfg.recheckMinutes));
      skipped += 1;
      line('waiting', `Step ${seq.stepsSent} has not been sent yet. The next one waits for it.`);
      continue;
    }

    const step = seq.stepsSent + 1;
    const slot = slotForStep({ step, enrolledAt: seq.confirmedAt, lastSentAt: status.lastSentAt, config: cfg });
    if (Date.parse(slot) > now.getTime()) {
      await giveBack(slot);
      skipped += 1;
      line('waiting', `Step ${step} is not due until ${slot}.`);
      continue;
    }

    // ── 6. Choose ──────────────────────────────────────────────────────────
    if (!anyReleased) {
      await giveBack(later(now, 24 * 60));
      skipped += 1;
      line('held', 'No resource in the catalogue is released yet (RELEASES in resource-routing.ts). Held, not ended.');
      continue;
    }

    const [requested, sent] = await Promise.all([store.requestedIds(seq.personId), store.sentIds(seq.sequenceId)]);
    const excluded = new Set<string>(sent);
    for (const id of requested) {
      const m = moduleForRequestId(id);
      excluded.add(m ? m.id : id);
    }

    const roleCode = (person.roleCode as RoleCode | null) ?? roleCodeFor(person.role);
    const pick = recommend({ initial: seq.resourceId, excluded, roleCode, catalogue });

    if (!pick) {
      await store.complete(seq.sequenceId, nowISO);
      await emit({ type: 'completed', sequenceId: seq.sequenceId, moduleId: null, step: null });
      completed += 1;
      line('completed', `Content exhausted after ${seq.stepsSent} step${seq.stepsSent === 1 ? '' : 's'}. Completed; a new tick does not restart it.`);
      continue;
    }

    // ── 7. The wording ─────────────────────────────────────────────────────
    const template = dripTemplateFor(pick.templateKey);
    if (!template) {
      await giveBack();
      skipped += 1;
      line('held', `No wording exists for ${pick.id} (${pick.templateKey}). Add it to drip-templates.ts. The step is still due.`, { moduleId: pick.id, step });
      continue;
    }

    const initialModule = catalogue.find((m) => m.id.toLowerCase() === seq.resourceId.toLowerCase());
    const rendered = renderMessage(template);
    const body = fillDripBody(rendered.body, {
      firstName: person.firstName,
      relevance: relevanceSentence({ requestedTitle: initialModule?.title ?? null, roleCode }),
      cohortInvitation: opts.cohortInvitation,
    });

    // ── 8. One message, one key ────────────────────────────────────────────
    const queued = await store.queueMessage({
      idempotencyKey: `drip:${seq.sequenceId}:${step}`,
      sequenceId: seq.sequenceId,
      personId: seq.personId,
      templateKey: template.key,
      templateVersion: template.version,
      purpose: 'marketing',
      step,
      recipient: person.recipient,
      subject: rendered.subject,
      body,
      scheduledFor: nowISO,
    });

    if (queued.duplicate) {
      skipped += 1;
      line('already-queued', 'Already queued under the same idempotency key. One row, not two.', { moduleId: pick.id, step });
      continue;
    }

    await store.recordSend(seq.sequenceId, pick.id, step, queued.messageId);
    // Look again within the hour, not at the next slot. While this step sits
    // in the outbox, each look re-reads the pause signals, so a reply or a
    // booked call cancels it before it goes. Once it has gone, the look finds
    // nothing pending and sets next_send_at to the real next slot, computed
    // from the real send time.
    const next = slotForStep({ step: step + 1, enrolledAt: seq.confirmedAt, lastSentAt: nowISO, config: cfg });
    await store.schedule(seq.sequenceId, later(now, cfg.recheckMinutes), step);
    await emit({ type: 'planned', sequenceId: seq.sequenceId, moduleId: pick.id, step });
    planned += 1;
    line('planned', `Step ${step}: ${pick.id} (${pick.title}). Queued for the sweep; the next step is no earlier than ${next}.`, {
      moduleId: pick.id,
      step,
      messageId: queued.messageId,
    });
  }

  return { ranAt: nowISO, considered: due.length, planned, completed, paused, skipped, confirmationsQueued, lines };
}

/**
 * The brief's vocabulary for a sequence, derived from the stored state and
 * the stop reason. The brief's states: not subscribed, awaiting confirmation,
 * active, paused for human handling, stopped, exhausted.
 */
export type DripView =
  | 'awaiting confirmation'
  | 'active'
  | 'paused'
  | 'exhausted'
  | 'unsubscribed'
  | 'suppressed'
  | 'failed'
  | 'stopped';

export function dripView(state: string, stoppedReason: string | null | undefined): DripView {
  if (state === 'awaiting_confirmation') return 'awaiting confirmation';
  if (state === 'active' || state === 'paused') return state;
  if (state === 'completed') return 'exhausted';
  const r = (stoppedReason ?? '').toLowerCase();
  if (r.includes('unsubscribe') || r.includes('withdrawn') || r.includes('consent')) return 'unsubscribed';
  if (r.includes('bounce') || r.includes('complain') || r.includes('suppress')) return 'suppressed';
  if (r.includes('fail')) return 'failed';
  return 'stopped';
}
