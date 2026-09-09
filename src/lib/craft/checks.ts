// Weekly knowledge checks — when one opens, and how far through it someone is.
//
// THE CHECK OPENS AT THE QUIZ BLOCK, NOT AT THE END OF THE SESSION. Week 1
// runs it at 04:20, forty minutes before the close, and then spends ten minutes
// taking up the ones that split the room — a check opening at `endsAt` would
// open after the block that exists to discuss it. See checkOpensAt().
//
// The INVITATION to take one is not here: the feedback form and the after-rating
// open at the close, and all of it is named by a single prompt in
// src/lib/craft/prompts.ts. Two modals racing onto one dashboard is the thing
// that design exists to prevent.
//
// ---------------------------------------------------------------------------
// WHAT "THE SESSION IS OVER" MEANS
// ---------------------------------------------------------------------------
// Exactly one thing: `endsAt` in the session's frontmatter is set, and it is in
// the past. There is no fallback to `taughtOn`, to end-of-day, or to a
// duration guessed from anything. Every session file is unset today, so nothing
// opens and nothing pops up until Sunil enters the real timetable — which is
// the correct behaviour for a repo whose first hard rule is never to invent a
// fact.

import { db } from '../admin/supabase';
import type { QuizItem, QuizResponse } from './quiz';
import { momentOfKind, type RunOfShowEntry } from './schedule';

const fail = (where: string, err: unknown) => {
  console.error(`checks ${where} failed:`, err instanceof Error ? err.message : err);
};

/**
 * The session facts a check needs. Passed in rather than imported so this
 * module stays clear of `astro:content` — same reasoning as the discussion
 * module's SessionFact.
 */
export interface CheckSession {
  week: number;
  title: string;
  /** Item ids from that week's bank, in the order Sunil wants them asked. */
  quiz?: string[];
  runOfShow?: RunOfShowEntry[];
  startsAt?: string;
  endsAt?: string;
}

/**
 * When the week's check opens.
 *
 * NOT when the session ends, which is where this used to be. Week 1 runs its
 * quiz at 04:20, forty minutes before the end, in the room — "eight questions in
 * chat, deliberately mixed up", followed by ten minutes of taking up the ones
 * that split the room. A check that opened at `endsAt` would open after the
 * block that exists to discuss it.
 *
 * Falls back to `endsAt` for a session whose run of show names no quiz block,
 * which is the old behaviour. Null when there is no timetable at all — the
 * standing rule: nothing opens rather than something being guessed.
 */
export function checkOpensAt(session: CheckSession): Date | null {
  return momentOfKind(session.startsAt, session.runOfShow, 'quiz', session.endsAt);
}

/**
 * The items this week's check actually asks, in Sunil's order.
 *
 * The bank holds more than the room gets. Which eight, and in what order, is an
 * editorial judgement about this room on this day — "mixed across every topic of
 * the day rather than grouped by block, the mixing is the point" — so it comes
 * from the session file and never from a rule over the bank.
 *
 * An id that names nothing is dropped rather than throwing: a typo in
 * frontmatter should cost one question, not the whole check.
 */
export function itemsForCheck(session: CheckSession, items: QuizItem[]): QuizItem[] {
  const byId = new Map(items.filter((i) => i.week === session.week).map((i) => [i.id, i]));
  return (session.quiz ?? [])
    .map((id) => byId.get(id))
    .filter((i): i is QuizItem => i !== undefined);
}

/**
 * THE ONE DEFINITION OF "THIS SESSION HAS HAPPENED", used by the knowledge
 * check and by the week's assignment.
 *
 * Both unlock at the same instant because they are the same event — the session
 * ending — and two predicates for one event drift, which shows up as an ADR you
 * can write before the class that sets it. Anything else that needs to know
 * whether a session is over imports this rather than re-testing `endsAt`.
 *
 * An unparseable date counts as absent rather than as "now": a typo in
 * frontmatter must not open anything.
 */
export function sessionEnded(endsAt: string | undefined, now: Date = new Date()): boolean {
  if (!endsAt) return false;
  const ends = new Date(endsAt);
  if (Number.isNaN(ends.getTime())) return false;
  return ends.getTime() <= now.getTime();
}

export interface WeeklyCheck {
  week: number;
  /** The session's title, so the prompt can name what it is checking. */
  title: string;
  /** When it opened — the quiz block, or `endsAt` if none. Null = no timetable. */
  opensAt: string | null;
  /** False whenever there is no timetable, and before the quiz block. */
  isOpen: boolean;
  itemCount: number;
  answered: number;
  isComplete: boolean;
  /** Started but not finished — the state the quiz page should resume into. */
  inProgress: boolean;
}

/**
 * Every week that has both a session and quiz items, with this learner's
 * progress against it.
 *
 * Counting is code, per §4 — the model is nowhere near this file.
 */
export function weeklyChecks(
  sessions: CheckSession[],
  items: QuizItem[],
  responses: QuizResponse[],
  now: Date = new Date(),
): WeeklyCheck[] {
  const answeredIds = new Set(responses.map((r) => r.item_id));
  const out: WeeklyCheck[] = [];

  for (const session of sessions) {
    // Week 0 is pre-work and has no session to end, so it has no check.
    if (session.week < 1) continue;

    // Only what Sunil selected. An unselected week has no check — the same rule
    // as an unset `endsAt`, and for the same reason: picking the questions on
    // his behalf would be inventing the lesson.
    const weekItems = itemsForCheck(session, items);
    if (weekItems.length === 0) continue;

    const answered = weekItems.filter((i) => answeredIds.has(i.id)).length;
    const opens = checkOpensAt(session);

    out.push({
      week: session.week,
      title: session.title,
      opensAt: opens ? opens.toISOString() : null,
      isOpen: opens !== null && now.getTime() >= opens.getTime(),
      itemCount: weekItems.length,
      answered,
      isComplete: answered >= weekItems.length,
      inProgress: answered > 0 && answered < weekItems.length,
    });
  }

  return out.sort((a, b) => a.week - b.week);
}

/** Open checks, most recent first — what the quiz tab lists. */
export function openChecks(checks: WeeklyCheck[]): WeeklyCheck[] {
  return checks.filter((c) => c.isOpen).sort((a, b) => b.week - a.week);
}
