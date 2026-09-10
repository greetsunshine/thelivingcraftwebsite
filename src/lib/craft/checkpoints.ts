// Checkpoints — one number, four times a session, while there is still time.
//
// ---------------------------------------------------------------------------
// WHY THIS IS THE CHEAPEST THING HERE AND THE ONLY ONE THAT ARRIVES IN TIME
// ---------------------------------------------------------------------------
// Every other instrument in the programme reports afterwards. Feedback lands at
// the close, the after-rating lands at the close, the ADR lands days later. A
// checkpoint is the only one that fires while the session can still change: the
// session's own words are "the drill block is where it is easiest to get quietly
// stuck and say nothing about it. A number in chat is the only way anyone finds
// out before the teardown."
//
// So it is deliberately the smallest possible ask. Four blocks, one number each,
// on ONE named item — not on the whole checklist. The other items in a checkpoint
// are there to be read, not answered. Week 1's 04:15 checkpoint asks for no
// number at all, and that is a property of the checkpoint, not an omission.
//
// ---------------------------------------------------------------------------
// IT IS A SLOW-DOWN SIGNAL, NOT A SCORE
// ---------------------------------------------------------------------------
// A 2 means "go slower", said by someone who would not say it out loud. It is
// not a measure of the learner and nothing here aggregates it into one: §10's
// cut of levels and ranks holds. Sunil's read is the ROOM at one moment — how
// many people are below 3 on the thing the next block assumes — and the moment
// it stops being useful is the moment the session ends.
//
// Keyed by the checkpoint's OFFSET (`'01:10'`), not an index. An offset is
// stable, readable in the console, and survives someone inserting a checkpoint
// earlier in the day; an index does not.

import { db } from '../admin/supabase';
import { momentAt } from './schedule';

const fail = (where: string, err: unknown) => {
  console.error(`checkpoints ${where} failed:`, err instanceof Error ? err.message : err);
};

export interface SessionCheckpoint {
  at: string;
  items: string[];
  /** Whether the last item is rated 1–5. Week 1's final checkpoint is not. */
  rated?: boolean;
}

export interface CheckpointRating {
  learner_id: string;
  week: number;
  at: string;
  rating: number;
  created_at: string;
}

/** A checkpoint placed in real time, with this learner's answer if any. */
export interface CheckpointWindow {
  week: number;
  at: string;
  /** Everything the learner should now be able to do. Read, not answered. */
  items: string[];
  /** The one that carries the number. Null when the checkpoint is unrated. */
  question: string | null;
  /** When it fires. Null without a timetable, in which case it never opens. */
  moment: Date | null;
  isOpen: boolean;
  answered: number | null;
}

/**
 * Every checkpoint for one session, in order, against `now`.
 *
 * A checkpoint opens at its moment and stays open until the session ends. It
 * does NOT close when the next one fires: someone who was mid-drill at 03:20
 * should still be able to say they were stuck, and refusing that answer would
 * lose exactly the signal this exists for. It stops at the end of the session
 * because a slow-down signal after the fact is not one.
 */
export function checkpointWindows(
  session: {
    week: number;
    checkpoints?: SessionCheckpoint[];
    startsAt?: string;
    endsAt?: string;
  },
  ratings: CheckpointRating[],
  now: Date = new Date(),
): CheckpointWindow[] {
  const ends = session.endsAt ? new Date(session.endsAt) : null;
  const over = ends !== null && !Number.isNaN(ends.getTime()) && now.getTime() >= ends.getTime();

  return (session.checkpoints ?? []).map((c) => {
    const moment = momentAt(session.startsAt, c.at);
    const rated = c.rated !== false;
    const answer = ratings.find((r) => r.week === session.week && r.at === c.at);

    return {
      week: session.week,
      at: c.at,
      items: c.items,
      // The number is always on the LAST item — "put one number in chat on the
      // last one only". That is the session's convention, so it lives here
      // rather than being restated as a field on every checkpoint.
      question: rated ? (c.items[c.items.length - 1] ?? null) : null,
      moment,
      isOpen:
        rated && moment !== null && now.getTime() >= moment.getTime() && !over,
      answered: answer ? answer.rating : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const TABLE = 'checkpoint_ratings';

export async function listLearnerCheckpoints(learnerId: string): Promise<CheckpointRating[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client.from(TABLE).select('*').eq('learner_id', learnerId);
    if (error) throw error;
    return (data as CheckpointRating[]) ?? [];
  } catch (err) {
    fail('listLearnerCheckpoints', err);
    return [];
  }
}

export async function listAllCheckpoints(week?: number): Promise<CheckpointRating[]> {
  const client = db();
  if (!client) return [];

  try {
    let q = client.from(TABLE).select('*');
    if (typeof week === 'number') q = q.eq('week', week);
    const { data, error } = await q;
    if (error) throw error;
    return (data as CheckpointRating[]) ?? [];
  } catch (err) {
    fail('listAllCheckpoints', err);
    return [];
  }
}

export async function saveCheckpoint(
  learnerId: string,
  week: number,
  at: string,
  rating: number,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client
      .from(TABLE)
      .upsert({ learner_id: learnerId, week, at, rating }, { onConflict: 'learner_id,week,at' });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('saveCheckpoint', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Sunil's read — the room at one moment
// ---------------------------------------------------------------------------

export interface RoomAtCheckpoint {
  at: string;
  question: string | null;
  /** How many answered at all. */
  n: number;
  /** How many said 3 or more. */
  fine: number;
  /** How many said 2 or less — "if your number is below 3, say so". */
  stuck: number;
  /** Every answer, so the shape is visible rather than only its summary. */
  spread: { rating: number; count: number }[];
}

/**
 * Counts, per checkpoint, for one session. No averages.
 *
 * A mean over eight people hides the only thing worth seeing here — that two of
 * them are at 2 — behind a reassuring 3.4. The question Sunil is actually asking
 * is "does the next block land on anybody", and that is a count.
 *
 * Counting is code, per §4.
 */
export function roomAtCheckpoints(
  windows: CheckpointWindow[],
  ratings: CheckpointRating[],
): RoomAtCheckpoint[] {
  return windows
    .filter((w) => w.question !== null)
    .map((w) => {
      const answers = ratings.filter((r) => r.week === w.week && r.at === w.at);
      return {
        at: w.at,
        question: w.question,
        n: answers.length,
        fine: answers.filter((r) => r.rating >= 3).length,
        stuck: answers.filter((r) => r.rating <= 2).length,
        spread: [1, 2, 3, 4, 5].map((rating) => ({
          rating,
          count: answers.filter((r) => r.rating === rating).length,
        })),
      };
    });
}
