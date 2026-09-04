// Weekly knowledge checks — when one opens, and how far through it someone is.
//
// The INVITATION to take one is not here: a session ending opens the check and
// the feedback form together, and both are named by a single prompt in
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
  endsAt?: string;
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
  /** When the session ended, and therefore when this opened. Null = unknown. */
  opensAt: string | null;
  /** Has the session finished? False whenever `endsAt` is absent. */
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
  const byWeek = new Map<number, QuizItem[]>();
  for (const item of items) {
    const list = byWeek.get(item.week);
    if (list) list.push(item);
    else byWeek.set(item.week, [item]);
  }

  const out: WeeklyCheck[] = [];

  for (const session of sessions) {
    // Week 0 is pre-work and has no session to end, so it has no check.
    if (session.week < 1) continue;

    const weekItems = byWeek.get(session.week) ?? [];
    if (weekItems.length === 0) continue; // no bank file yet — nothing to open

    const answered = weekItems.filter((i) => answeredIds.has(i.id)).length;
    const ends = session.endsAt ? new Date(session.endsAt) : null;
    const valid = ends && !Number.isNaN(ends.getTime()) ? ends : null;

    out.push({
      week: session.week,
      title: session.title,
      opensAt: valid ? valid.toISOString() : null,
      isOpen: sessionEnded(session.endsAt, now),
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
