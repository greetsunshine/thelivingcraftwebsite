// The week's assignment — what an ADR is written about.
//
// ---------------------------------------------------------------------------
// WHY THIS MODULE EXISTS
// ---------------------------------------------------------------------------
// Spec §5.5: an ADR is "one page per week, TIED TO THAT WEEK'S ASSIGNMENT".
// Two things have to be true for that tie to mean anything, and neither was
// enforced in one place:
//
//   1. THE ASSIGNMENT HAS TO EXIST. Weeks 2-6 carry `assignment: "TBD"` — a
//      placeholder, and a truthy string. Four surfaces already tested for it by
//      hand (`s.data.assignment !== 'TBD'`) and the learner's own ADR page was
//      the one that did not, so it offered five submit forms headed "Week 2:
//      TBD" while Sunil's console correctly showed one week and the dashboard
//      correctly showed nothing due. Three surfaces disagreeing about how many
//      assignments exist is what a duplicated literal buys you.
//
//   2. THE ASSIGNMENT HAS TO HAVE BEEN GIVEN. An assignment is set at the
//      session; writing week 6's decision record in week 1 is not early, it is
//      a different exercise. So an ADR unlocks on the same instant the week's
//      knowledge check does — `sessionEnded()` in checks.ts, one clock for one
//      event.
//
// Everything that needs to know which assignments are real, or which are live,
// reads this module. A fifth hand-rolled `!== 'TBD'` is the bug coming back.

import { sessionEnded } from './checks';

/**
 * The placeholder a session file carries before Sunil has written the week's
 * drill. It is a real string in the frontmatter, so it passes every truthiness
 * test — which is exactly how it reached the learner-facing page.
 */
export const ASSIGNMENT_PLACEHOLDER = 'TBD';

export interface AssignmentSession {
  week: number;
  title: string;
  assignment?: string;
  endsAt?: string;
}

export interface Assignment {
  week: number;
  /** The session this belongs to, for context above the form. */
  sessionTitle: string;
  /** The brief itself. Never the placeholder — see hasAssignment(). */
  title: string;
  /** Has the session that sets it happened? */
  given: boolean;
  /** When it was set, i.e. when its session ended. Null when unscheduled. */
  givenAt: string | null;
}

/**
 * Is there a real assignment here, as opposed to a placeholder or nothing?
 *
 * Takes the narrowest possible shape so every caller can reach it — including
 * the discussion module's `SessionFact`, which quotes the assignment back to a
 * learner and must not quote "TBD" at them.
 */
export function hasAssignment(s: { assignment?: string }): boolean {
  const a = s.assignment?.trim();
  return !!a && a.toUpperCase() !== ASSIGNMENT_PLACEHOLDER;
}

/**
 * Every real assignment, with whether it has been given yet.
 *
 * Week 0 is excluded: it is pre-work, has no session to end and no ADR.
 */
export function assignments(
  sessions: AssignmentSession[],
  now: Date = new Date(),
): Assignment[] {
  return sessions
    .filter((s) => s.week >= 1 && hasAssignment(s))
    .map((s) => ({
      week: s.week,
      sessionTitle: s.title,
      title: s.assignment!.trim(),
      given: sessionEnded(s.endsAt, now),
      givenAt: s.endsAt ?? null,
    }))
    .sort((a, b) => a.week - b.week);
}

/**
 * Only the ones actually set. This is what a learner may write against and what
 * Sunil may reasonably call missing — counting a week that has not happened as
 * an outstanding submission would report eight people as behind on work nobody
 * has been given.
 */
export function givenAssignments(
  sessions: AssignmentSession[],
  now: Date = new Date(),
): Assignment[] {
  return assignments(sessions, now).filter((a) => a.given);
}

/** Week numbers of the given assignments — what `submissionGaps()` takes. */
export function givenAssignmentWeeks(
  sessions: AssignmentSession[],
  now: Date = new Date(),
): number[] {
  return givenAssignments(sessions, now).map((a) => a.week);
}
