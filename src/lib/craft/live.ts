// Session mode — what the room is doing right now, and what you owe it.
//
// ---------------------------------------------------------------------------
// WHY THIS EXISTS
// ---------------------------------------------------------------------------
// Every page under /craft was built for one person, alone, afterwards, with time
// to read. Then week 1 was written in full and it turned out the session asks a
// learner for something NINE times inside its five hours — two ratings, four
// checkpoints, the quiz, and the pair draft with its review. All of it while
// somebody is talking.
//
// That is a different brief, and it is one brief rather than nine: ninety
// seconds, probably on a phone or a second monitor, showing the ONE thing this
// minute is asking for and nothing else. Building it into each surface
// separately would mean building it four times and getting four answers.
//
// ---------------------------------------------------------------------------
// THE RULE THIS FILE KEEPS
// ---------------------------------------------------------------------------
// EXACTLY ONE THING IS "NOW". The others are a catch-up list, deliberately
// smaller and lower down. This is the same argument as the single prompt in
// prompts.ts: a screen with four equal asks on it is a screen people scroll past,
// and in a live session there is no second chance to read it.
//
// It also inherits the standing rule about the timetable. No `startsAt` means no
// session is ever live, so session mode never appears — never a guess, and the
// failure mode of guessing here is a page telling eight people the room is doing
// something it is not.

import { blockAt, momentAt, momentOfKind, ordered, type RunOfShowEntry } from './schedule';
import { checkpointWindows, type CheckpointRating, type SessionCheckpoint } from './checkpoints';
import { NO_AFTER_PULSE_WEEK, teachingWindowShut, type Pulse, type SessionOutcome } from './pulses';

export interface LiveSessionInput {
  week: number;
  title: string;
  outcomes: SessionOutcome[];
  checkpoints?: SessionCheckpoint[];
  runOfShow?: RunOfShowEntry[];
  /** Ids from that week's bank, in the order Sunil wants them asked. */
  quiz?: string[];
  /** When the pair writes, and when it reads another pair's. */
  pair?: { draftAt: string; reviewAt: string };
  startsAt?: string;
  endsAt?: string;
}

/** One thing the room is being asked for, placed in real time. */
export interface Ask {
  kind: 'rating-before' | 'checkpoint' | 'pair-draft' | 'pair-review' | 'quiz' | 'rating-after';
  /** Offset it fires at, for ordering and for showing the time. */
  at: string;
  moment: Date;
  label: string;
  /** One line of what it is. Never instructions — the room has those. */
  detail: string;
  href: string;
  done: boolean;
}

export interface LiveState {
  week: number;
  title: string;
  /** The entry the room is inside, and when it gives way. */
  block: RunOfShowEntry | null;
  blockUntil: Date | null;
  endsAt: Date | null;
  /** The single thing to put in front of them. Null when nothing is owed. */
  now: Ask | null;
  /** Fired earlier, still not done. Shown small, under the one above. */
  behind: Ask[];
  /** Not yet fired. Shown as "coming", never as a thing to do. */
  next: Ask | null;
}

const isDone = (d: boolean) => d;

/**
 * The session running at `now`, or null.
 *
 * Bounded at both ends by real timestamps. A session that has ended is not live,
 * and neither is one that has not begun — the to-do panel and the single prompt
 * already handle both of those and do it better, because they are surfaces you
 * open rather than surfaces that assume you are in a room.
 */
export function liveSession<T extends { startsAt?: string; endsAt?: string }>(
  sessions: T[],
  now: Date = new Date(),
): T | null {
  for (const s of sessions) {
    if (!s.startsAt || !s.endsAt) continue;
    const a = new Date(s.startsAt).getTime();
    const b = new Date(s.endsAt).getTime();
    if (Number.isNaN(a) || Number.isNaN(b)) continue;
    if (now.getTime() >= a && now.getTime() < b) return s;
  }
  return null;
}

/**
 * Everything the session asks for, in the order the day asks for it.
 *
 * The four kinds come from four different modules and are deliberately assembled
 * here rather than each knowing about session mode: the rating windows are
 * pulses.ts, the checkpoints are checkpoints.ts, the quiz is its own surface.
 * This file only places them on a clock and decides which one is "now".
 */
export function asksFor(
  session: LiveSessionInput,
  pulses: Pulse[],
  checkpoints: CheckpointRating[],
  quizAnswered: boolean,
  pairDraftDone: boolean,
  pairReviewDone: boolean,
  now: Date = new Date(),
): Ask[] {
  const out: Ask[] = [];
  const rated = (phase: 'before' | 'after') =>
    pulses.some((p) => p.week === session.week && p.phase === phase);

  // --- the before-rating: fires when the room opens, dies at first teaching ---
  const opening = ordered(session.runOfShow).find((e) => (e.kind ?? 'block') === 'opening');
  const beforeAt = momentAt(session.startsAt, opening?.at ?? '00:00');
  if (beforeAt && session.outcomes.length > 0 && !teachingWindowShut(session, now)) {
    out.push({
      kind: 'rating-before',
      at: opening?.at ?? '00:00',
      moment: beforeAt,
      label: 'Rate yourself, before anything is taught',
      detail: `${session.outcomes.length} statements. Nobody sees this number but you until the end.`,
      href: `/craft/familiarity?week=${session.week}&phase=before`,
      done: rated('before'),
    });
  }

  // --- checkpoints ---
  for (const w of checkpointWindows(session, checkpoints, now)) {
    if (!w.question || !w.moment) continue;
    out.push({
      kind: 'checkpoint',
      at: w.at,
      moment: w.moment,
      label: 'Checkpoint',
      detail: w.question,
      href: `/craft/live?checkpoint=${encodeURIComponent(w.at)}`,
      done: w.answered !== null,
    });
  }

  // --- the quiz ---
  const quizAt = momentOfKind(session.startsAt, session.runOfShow, 'quiz');
  const quizEntry = ordered(session.runOfShow).find((e) => (e.kind ?? 'block') === 'quiz');
  if (quizAt && quizEntry && (session.quiz?.length ?? 0) > 0) {
    out.push({
      kind: 'quiz',
      at: quizEntry.at,
      moment: quizAt,
      label: 'The check',
      detail: `${session.quiz!.length} questions, mixed across the day on purpose.`,
      href: `/craft/quiz?week=${session.week}`,
      done: quizAnswered,
    });
  }

  // --- the pair draft, then reading another pair's ---
  // Two asks rather than one: they are fifteen minutes apart, they are different
  // work, and collapsing them would leave "now" pointing at writing while the
  // room has moved on to reading.
  if (session.pair) {
    const draftAt = momentAt(session.startsAt, session.pair.draftAt);
    if (draftAt) {
      out.push({
        kind: 'pair-draft',
        at: session.pair.draftAt,
        moment: draftAt,
        label: 'Write it up, with your partner',
        detail: 'One page, fifteen minutes, in the shape you would put in front of a review.',
        href: '/craft/pair',
        done: pairDraftDone,
      });
    }

    const reviewAt = momentAt(session.startsAt, session.pair.reviewAt);
    if (reviewAt) {
      out.push({
        kind: 'pair-review',
        at: session.pair.reviewAt,
        moment: reviewAt,
        label: "Read another pair's",
        detail: 'Four questions, ten minutes. The comment matters more than the number.',
        href: '/craft/pair',
        done: pairReviewDone,
      });
    }
  }

  // --- the after-rating ---
  const closeAt = momentOfKind(session.startsAt, session.runOfShow, 'close');
  const closeEntry = ordered(session.runOfShow).find((e) => (e.kind ?? 'block') === 'close');
  if (
    closeAt &&
    closeEntry &&
    session.outcomes.length > 0 &&
    session.week !== NO_AFTER_PULSE_WEEK
  ) {
    out.push({
      kind: 'rating-after',
      at: closeEntry.at,
      moment: closeAt,
      label: 'The same five, again',
      detail: 'Identical statements, identical order. Both sets go on screen together.',
      href: `/craft/familiarity?week=${session.week}&phase=after`,
      done: rated('after'),
    });
  }

  return out.sort((a, b) => a.moment.getTime() - b.moment.getTime());
}

/**
 * Session mode, resolved.
 *
 * "Now" is the MOST RECENTLY FIRED thing still outstanding, not the earliest.
 * Someone who missed the 01:10 checkpoint and is standing in the 03:20 one
 * should be shown 03:20 — the room has moved on, and putting the stale ask first
 * asks them to answer a question about a block that finished two hours ago.
 * The missed one stays reachable underneath, because a late answer is worth more
 * than none.
 */
export function liveState(
  session: LiveSessionInput,
  pulses: Pulse[],
  checkpoints: CheckpointRating[],
  quizAnswered: boolean,
  pairDraftDone: boolean,
  pairReviewDone: boolean,
  now: Date = new Date(),
): LiveState {
  const all = asksFor(session, pulses, checkpoints, quizAnswered, pairDraftDone, pairReviewDone, now);
  const fired = all.filter((a) => a.moment.getTime() <= now.getTime());
  const outstanding = fired.filter((a) => !isDone(a.done));

  const here = blockAt(session.startsAt, session.endsAt, session.runOfShow, now);

  return {
    week: session.week,
    title: session.title,
    block: here?.entry ?? null,
    blockUntil: here?.until ?? null,
    endsAt: session.endsAt ? new Date(session.endsAt) : null,
    now: outstanding.length > 0 ? outstanding[outstanding.length - 1] : null,
    behind: outstanding.slice(0, -1).reverse(),
    next: all.find((a) => a.moment.getTime() > now.getTime()) ?? null,
  };
}

/** Whole minutes from now until `then`, floored at zero. */
export function minutesUntil(then: Date | null, now: Date = new Date()): number | null {
  if (!then) return null;
  return Math.max(0, Math.round((then.getTime() - now.getTime()) / 60_000));
}
