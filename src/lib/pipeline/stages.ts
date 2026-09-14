// Which moves are legal, which need a reason, and who may make them.
//
// ───────────────────────────────────────────────────────────────────────────
// A STAGE IS A CLAIM ABOUT EVIDENCE. THIS MODULE IS WHERE THAT IS ENFORCED.
// ───────────────────────────────────────────────────────────────────────────
//
// Nothing here stops somebody being at the wrong stage — people are messy and
// a pipeline that refuses reality is a pipeline people keep outside the system.
// What it stops is the two moves that would make the record dishonest:
//
//   1. **Enrolment without both pieces of evidence.** The brief: "Enrolment
//      requires Sunil's recorded acceptance/admission decision and
//      finance-confirmed payment under the approved offer." Two facts, two
//      people, neither able to act for the other. `enrolment_blockers()` in
//      the schema is the authority; this module refuses the transition while
//      it returns anything.
//
//   2. **A close or a reversal with no reason.** "Stage movement requires the
//      appropriate role and a reason where closing or reversing." A stage that
//      went backwards and nobody can say why is a record that has quietly lost
//      an argument somebody had.
//
// EVERYTHING ELSE IS PERMITTED, INCLUDING SKIPPING FORWARD. A fit conversation
// that goes well can jump straight to offer, and a machine that insists on
// walking every intermediate stage teaches people to lie to it.
//
// ───────────────────────────────────────────────────────────────────────────
// THE ORDER IS FOR COMPARISON, NOT FOR ENFORCEMENT
// ───────────────────────────────────────────────────────────────────────────
//
// `MEMBER` and `ENTERPRISE` are ordered so "is this backwards?" has an answer.
// They are NOT a state machine's edge list, and adding a `transitions` map that
// only allows n+1 would be the wrong lesson to draw from them.

import { can, type Role } from './roles';

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

/**
 * Not positions on the line, and they never sort onto it.
 *
 * `on_hold` is the one that catches people out: it is a SIDE state but it is
 * still OPEN. A paused conversation is still that person's conversation, and
 * the unique index in the schema treats it as open for exactly that reason —
 * a second submission while somebody is on hold belongs to the conversation
 * they already have, not to a new one.
 */
export const SIDE_STATES = ['on_hold', 'unsuitable', 'withdrawn', 'closed'] as const;

/** The three that actually end it. `on_hold` is deliberately absent. */
export const TERMINAL_STATES = ['unsuitable', 'withdrawn', 'closed'] as const;

export type Route = 'member' | 'enterprise';
export type Stage =
  | (typeof MEMBER_STAGES)[number]
  | (typeof ENTERPRISE_STAGES)[number]
  | (typeof SIDE_STATES)[number];

export const stagesFor = (route: Route): readonly string[] =>
  route === 'member' ? MEMBER_STAGES : ENTERPRISE_STAGES;

export const isSideState = (stage: string): boolean =>
  (SIDE_STATES as readonly string[]).includes(stage);

export const isTerminal = (stage: string): boolean =>
  (TERMINAL_STATES as readonly string[]).includes(stage);

/** Sentence case, for a screen. `technical_review` reads badly as a heading. */
export const stageLabel = (stage: string): string =>
  stage.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/**
 * Is this move backwards along the line?
 *
 * A move INTO a side state is not a reversal — it is a legitimate outcome, and
 * it has its own reason requirement below. A move OUT of a side state back onto
 * the line IS one: somebody was closed and is being reopened, and that is
 * exactly the change a reader will later want explained.
 */
export function isReversal(route: Route, from: string | null, to: string): boolean {
  if (!from) return false;
  if (isSideState(to)) return false;
  if (isSideState(from)) return true;

  const order = stagesFor(route);
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a < 0 || b < 0) return false;
  return b < a;
}

/**
 * Does this move need a reason typed in?
 *
 * Closing and reversing, per the brief. Note what does NOT: an ordinary
 * forward move. Demanding a justification for progress is how a required field
 * becomes "moving on" typed nine times, at which point the field records
 * nothing and the reasons that mattered are buried among the noise.
 */
export function needsReason(route: Route, from: string | null, to: string): boolean {
  return isSideState(to) || isReversal(route, from, to);
}

/**
 * Which capability a move requires.
 *
 * Most moves are `write.stage`, which the operator holds — working the pipeline
 * is their job. Two are not:
 *
 *   * `enrolled` needs `approve.admission`, which only Sunil holds. Even with
 *     every piece of evidence present, the act of declaring somebody enrolled
 *     is his.
 *   * `unsuitable` needs `approve.fit`, also Sunil's. Telling a senior engineer
 *     they are not right for this is a technical judgement, and an operator
 *     working through a queue should not be able to make it alone.
 *
 * `withdrawn` is deliberately NOT restricted: it records something the PERSON
 * decided, and whoever took that call needs to be able to write it down.
 */
export function capabilityFor(to: string): Parameters<typeof can>[1] {
  if (to === 'enrolled') return 'approve.admission';
  if (to === 'unsuitable') return 'approve.fit';
  return 'write.stage';
}

export interface Blocker {
  code: string;
  detail: string;
}

export interface MoveRequest {
  route: Route;
  from: string | null;
  to: string;
  roles: readonly Role[];
  reason?: string | null;
  /** From `enrolment_blockers()`. Only consulted for a move to `enrolled`. */
  blockers?: Blocker[];
}

export type MoveVerdict =
  | { ok: true; isReversal: boolean; capability: Parameters<typeof can>[1] }
  | { ok: false; code: 'unknown_stage' | 'not_permitted' | 'reason_required' | 'blocked'; message: string; blockers?: Blocker[] };

/**
 * The one function that decides. Called by the API before any write, and by
 * the console only to decide what to draw.
 *
 * The order of the checks is deliberate and is a small privacy property: the
 * PERMISSION check runs before the evidence check, so somebody without the
 * capability learns that they lack it rather than learning the state of
 * somebody's payment record on the way to being refused.
 */
export function checkMove(req: MoveRequest): MoveVerdict {
  const known = [...stagesFor(req.route), ...SIDE_STATES] as readonly string[];
  if (!known.includes(req.to)) {
    return { ok: false, code: 'unknown_stage', message: `${req.to} is not a stage on the ${req.route} route.` };
  }

  const capability = capabilityFor(req.to);
  if (!can(req.roles, capability)) {
    return {
      ok: false,
      code: 'not_permitted',
      message:
        req.to === 'enrolled'
          ? 'Only Sunil can record an admission, which is what moving somebody to enrolled is.'
          : req.to === 'unsuitable'
            ? 'Marking somebody unsuitable is a technical-fit judgement, and only Sunil can record one.'
            : 'Your roles do not include moving a lead between stages.',
    };
  }

  const reversal = isReversal(req.route, req.from, req.to);

  if (needsReason(req.route, req.from, req.to) && !req.reason?.trim()) {
    return {
      ok: false,
      code: 'reason_required',
      message: reversal
        ? 'Moving a lead backwards needs a reason. It is the thing somebody will want explained later.'
        : 'Closing a lead needs a reason. "Closed" on its own tells the next person nothing.',
    };
  }

  // Evidence last, and only for the one transition that turns on it.
  if (req.to === 'enrolled' && req.blockers?.length) {
    return {
      ok: false,
      code: 'blocked',
      message: 'Enrolment needs an accepted offer, an admission decision and a finance-confirmed payment.',
      blockers: req.blockers,
    };
  }

  return { ok: true, isReversal: reversal, capability };
}

/**
 * A refund does not undo an enrolment.
 *
 * The brief: "A refund creates evidence and a review task; it does not erase
 * historical enrolment or attendance." So recording one never changes a stage.
 * This is the sentence the console puts on the screen beside the confirmation,
 * because the expectation it corrects is a reasonable one to arrive with.
 */
export const REFUND_NOTE =
  'Recording a refund does not change this lead’s stage or remove any attendance. It adds finance evidence and raises a task for somebody to review what should happen next.';
