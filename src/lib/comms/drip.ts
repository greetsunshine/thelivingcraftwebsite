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
// at once (the transactional delivery, resources.ts). From calendar day 2 a
// sequence recommends one other resource per step, chosen at the moment of
// sending from the routing catalogue, never the one they asked for and never
// one already sent, until the catalogue is used up or the person stops it.
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
import { dripTemplateFor, fillDripBody } from './drip-templates.ts';
import { renderMessage } from './templates.ts';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface DripConfig {
  /** Calendar days after the request for the first follow-up. The brief: 2. */
  firstOffsetDays: number;
  /**
   * Calendar days between follow-ups. NOT IN ANY BRIEF OR PACKAGE. The default
   * is a placeholder until the owner sets COMMS_DRIP_INTERVAL_DAYS.
   */
  intervalDays: number;
  /** Local hour of the send, 0-23. The outbox's convention is 10:00. */
  hour: number;
  /** IANA zone the hour is read in. */
  zone: string;
  /** How long a planner's claim lasts before another may take the row. */
  leaseMinutes: number;
}

export const DEFAULT_DRIP_CONFIG: Readonly<DripConfig> = {
  firstOffsetDays: 2,
  intervalDays: 3,
  hour: 10,
  zone: 'Asia/Kolkata',
  leaseMinutes: 10,
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

/** The config from an environment reader. Out-of-range values fall back, never throw. */
export function dripConfig(read: (key: string) => string): DripConfig {
  const zone = read('COMMS_DRIP_TIMEZONE').trim();
  return {
    firstOffsetDays: int(read('COMMS_DRIP_FIRST_OFFSET_DAYS'), DEFAULT_DRIP_CONFIG.firstOffsetDays, 1, 30),
    intervalDays: int(read('COMMS_DRIP_INTERVAL_DAYS'), DEFAULT_DRIP_CONFIG.intervalDays, 1, 60),
    hour: int(read('COMMS_DRIP_SEND_HOUR'), DEFAULT_DRIP_CONFIG.hour, 0, 23),
    zone: zone && isValidZone(zone) ? zone : DEFAULT_DRIP_CONFIG.zone,
    leaseMinutes: DEFAULT_DRIP_CONFIG.leaseMinutes,
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
 *   1. never the initial resource, never one in `excluded`, never inactive;
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
  const eligible = (m: DripModule | undefined): m is DripModule => Boolean(m && m.active && !out.has(m.id.toLowerCase()));

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

export interface DripSequence {
  sequenceId: string;
  personId: string;
  /** The catalogue id, or the raw request id when no module claims it. */
  resourceId: string;
  requestId: string | null;
  state: 'active' | 'paused' | 'stopped' | 'completed';
  nextSendAt: string | null;
  stepsSent: number;
  anchorAt: string;
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
  purpose: 'marketing';
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
  nextSendAt: string;
}

export interface DripStore {
  /** Active resource sequences whose next_send_at has arrived, oldest first. */
  due(nowISO: string, limit: number): Promise<DripSequence[]>;
  /** Move next_send_at to `untilISO` only if it still equals `seenISO`. True when this caller won. */
  lease(sequenceId: string, seenISO: string, untilISO: string): Promise<boolean>;
  person(personId: string): Promise<DripPerson | null>;
  /** The request ids (resource_requests.resource_id) this person has ever asked for. */
  requestedIds(personId: string): Promise<string[]>;
  /** Catalogue ids already sent in this sequence. */
  sentIds(sequenceId: string): Promise<string[]>;
  /** Insert on the outbox. `duplicate` when the idempotency key already exists. */
  queueMessage(m: DripMessage): Promise<{ messageId: string | null; duplicate: boolean }>;
  recordSend(sequenceId: string, moduleId: string, step: number, messageId: string | null): Promise<void>;
  schedule(sequenceId: string, nextSendAtISO: string, stepsSent: number): Promise<void>;
  complete(sequenceId: string, atISO: string): Promise<void>;
  stop(sequenceId: string, reason: string, atISO: string): Promise<void>;
  /** The one live sequence for a person, whatever its route. */
  liveSequenceFor(personId: string): Promise<{ sequenceId: string; route: string; state: string } | null>;
  /** The most recent marketing consent record for a person. */
  consentState(personId: string): Promise<'granted' | 'withdrawn' | 'none' | 'unknown'>;
  /** Append a granted marketing consent row. False when it could not be written. */
  grantConsent(personId: string, source: string, atISO: string): Promise<boolean>;
  /** Open a resource sequence. `duplicate` when the one-live-sequence index refused. */
  open(row: OpenRow): Promise<{ sequenceId: string | null; duplicate: boolean }>;
}

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
  | { opened: true; sequenceId: string; resourceId: string; nextSendAt: string }
  | { opened: false; why: string };

/**
 * Open a follow-up sequence for a saved request, if the person allowed it and
 * has no live sequence already.
 *
 * THE CONSENT IS RECORDED BEFORE THE LIVE-SEQUENCE CHECK. A person already in
 * the application sequence who ticks the box has still given permission, and
 * that row is evidence worth keeping even though no second sequence opens.
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
    return {
      opened: false,
      why: `This person already has a ${live.state} ${live.route} sequence. One live sequence per person; the permission was recorded and no second sequence was opened.`,
    };
  }

  const module = moduleForRequestId(req.requestResourceId);
  const resourceId = module?.id ?? req.requestResourceId;
  const nextSendAt = sendSlot(at, cfg.firstOffsetDays, cfg.zone, cfg.hour);

  const opened = await store.open({ personId: req.personId, requestId: req.requestId, resourceId, anchorAt: at, nextSendAt });
  if (opened.duplicate) {
    return { opened: false, why: 'Another sequence for this person was opened at the same moment. One live sequence per person; this one was not created.' };
  }
  if (!opened.sequenceId) {
    return { opened: false, why: 'The sequence record could not be written. The request and the permission are saved; open it from the console.' };
  }
  return { opened: true, sequenceId: opened.sequenceId, resourceId, nextSendAt };
}

// ---------------------------------------------------------------------------
// The planner
// ---------------------------------------------------------------------------

export type PlannerOutcome = 'planned' | 'completed' | 'already-queued' | 'lost-lease' | 'stopped' | 'held';

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
  skipped: number;
  lines: PlannerLine[];
}

export interface PlannerEvent {
  type: 'planned' | 'completed' | 'stopped';
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

const firstNameOf = (name: string | null): string | null => {
  const t = (name ?? '').trim().split(/\s+/)[0] ?? '';
  return t ? t : null;
};

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

  const due = await store.due(nowISO, Math.min(opts.limit ?? PLANNER_LIMIT, PLANNER_LIMIT));
  const lines: PlannerLine[] = [];
  let planned = 0;
  let completed = 0;
  let skipped = 0;

  for (const seq of due) {
    const line = (outcome: PlannerOutcome, detail: string, extra: Partial<PlannerLine> = {}) =>
      lines.push({ sequenceId: seq.sequenceId, outcome, step: null, moduleId: null, messageId: null, detail, ...extra });

    if (!seq.nextSendAt) {
      skipped += 1;
      line('held', 'No next send time on an active sequence. Left alone.');
      continue;
    }

    // ── 1. The lease ───────────────────────────────────────────────────────
    const until = new Date(now.getTime() + cfg.leaseMinutes * 60_000).toISOString();
    const won = await store.lease(seq.sequenceId, seq.nextSendAt, until);
    if (!won) {
      skipped += 1;
      line('lost-lease', 'Claimed by another planner. One sequence, one claim.');
      continue;
    }

    // ── 2. Who, and what they have already ─────────────────────────────────
    const person = await store.person(seq.personId);
    if (!person) {
      await store.stop(seq.sequenceId, 'person record missing', nowISO);
      await emit({ type: 'stopped', sequenceId: seq.sequenceId, moduleId: null, step: null });
      skipped += 1;
      line('stopped', 'The person record is gone. Stopped; nothing can be addressed.');
      continue;
    }

    // ── 2b. Permission, re-read every step ────────────────────────────────
    // The sweep re-checks it too, immediately before dispatch; this check is
    // earlier and cheaper, and it stops the sequence rather than cancelling
    // one message at a time.
    const consent = await store.consentState(seq.personId);
    if (consent === 'withdrawn' || consent === 'none') {
      const reason = consent === 'withdrawn' ? 'consent withdrawn' : 'no marketing consent on record';
      await store.stop(seq.sequenceId, reason, nowISO);
      await emit({ type: 'stopped', sequenceId: seq.sequenceId, moduleId: null, step: null });
      skipped += 1;
      line('stopped', `${reason[0].toUpperCase()}${reason.slice(1)}. Stopped; nothing is sent without a recorded permission.`);
      continue;
    }
    if (consent === 'unknown') {
      await store.schedule(seq.sequenceId, seq.nextSendAt, seq.stepsSent);
      skipped += 1;
      line('held', 'The consent record did not answer. Nothing is sent on an unestablished check; the step is still due.');
      continue;
    }

    const [requested, sent] = await Promise.all([store.requestedIds(seq.personId), store.sentIds(seq.sequenceId)]);
    const excluded = new Set<string>(sent);
    for (const id of requested) {
      const m = moduleForRequestId(id);
      excluded.add(m ? m.id : id);
    }

    const step = seq.stepsSent + 1;
    const roleCode = (person.roleCode as RoleCode | null) ?? roleCodeFor(person.role);
    const pick = recommend({ initial: seq.resourceId, excluded, roleCode, catalogue });

    // ── 3. Nothing left: done ──────────────────────────────────────────────
    if (!pick) {
      await store.complete(seq.sequenceId, nowISO);
      await emit({ type: 'completed', sequenceId: seq.sequenceId, moduleId: null, step: null });
      completed += 1;
      line('completed', `Content exhausted after ${seq.stepsSent} step${seq.stepsSent === 1 ? '' : 's'}. Completed.`);
      continue;
    }

    // ── 4. The wording ─────────────────────────────────────────────────────
    const template = dripTemplateFor(pick.templateKey);
    if (!template) {
      // A catalogue entry with no wording is a configuration fault, not a
      // reason to skip the person. Give the lease back and say so.
      await store.schedule(seq.sequenceId, seq.nextSendAt, seq.stepsSent);
      skipped += 1;
      line('held', `No wording exists for ${pick.id} (${pick.templateKey}). Add it to drip-templates.ts. The step is still due.`, { moduleId: pick.id, step });
      continue;
    }

    const initialModule = catalogue.find((m) => m.id.toLowerCase() === seq.resourceId.toLowerCase());
    const rendered = renderMessage(template);
    const body = fillDripBody(rendered.body, {
      firstName: person.firstName,
      requestedTitle: initialModule?.title ?? 'a Living Craft resource',
      cohortInvitation: opts.cohortInvitation,
    });

    // ── 5. One message, one key ────────────────────────────────────────────
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
      // The key did its job: another planner wrote this step. It also owns
      // the scheduling; leave the row as it is.
      skipped += 1;
      line('already-queued', 'Already queued under the same idempotency key. One row, not two.', { moduleId: pick.id, step });
      continue;
    }

    await store.recordSend(seq.sequenceId, pick.id, step, queued.messageId);
    const next = sendSlot(nowISO, cfg.intervalDays, cfg.zone, cfg.hour);
    await store.schedule(seq.sequenceId, next, step);
    await emit({ type: 'planned', sequenceId: seq.sequenceId, moduleId: pick.id, step });
    planned += 1;
    line('planned', `Step ${step}: ${pick.id} (${pick.title}). Queued for the sweep; next step ${next}.`, {
      moduleId: pick.id,
      step,
      messageId: queued.messageId,
    });
  }

  return { ranAt: nowISO, considered: due.length, planned, completed, skipped, lines };
}

/**
 * The brief's vocabulary for a sequence, derived from the stored state and
 * the stop reason. The store keeps four states; screens may show seven.
 */
export type DripView = 'active' | 'paused' | 'completed' | 'unsubscribed' | 'suppressed' | 'failed' | 'stopped';

export function dripView(state: string, stoppedReason: string | null | undefined): DripView {
  if (state === 'active' || state === 'paused' || state === 'completed') return state;
  const r = (stoppedReason ?? '').toLowerCase();
  if (r.includes('unsubscribe') || r.includes('withdrawn') || r.includes('consent')) return 'unsubscribed';
  if (r.includes('bounce') || r.includes('complain') || r.includes('suppress')) return 'suppressed';
  if (r.includes('fail')) return 'failed';
  return 'stopped';
}
