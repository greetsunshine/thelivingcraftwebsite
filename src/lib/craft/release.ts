// Which weeks a learner may open, and who decides.
//
// ---------------------------------------------------------------------------
// WHY THIS IS NOT `status: draft` IN THE SESSION FILE
// ---------------------------------------------------------------------------
// `status` answers a different question: is this material written? It is an
// authoring fact, it belongs in the file beside the prose, and changing it is a
// commit and a deploy — which is right, because writing a session IS a code
// change here.
//
// Releasing a week is not an authoring fact. It happens on a Tuesday evening
// when the session ends, it is Sunil's call, and asking him to open a pull
// request to let eight people read the page they just sat through is the wrong
// shape. So release is data: one row per week in `session_releases`, written
// from the console.
//
// ---------------------------------------------------------------------------
// BOTH GATES HAVE TO PASS, AND THEY FAIL IN DIFFERENT DIRECTIONS
// ---------------------------------------------------------------------------
// A week is open to a learner when it is WRITTEN (`status: ready`) **and**
// RELEASED (a row here). Either alone is wrong:
//
//   * released but not written → somebody who paid opens a page of
//     `[PLACEHOLDER]`, which is the failure the draft gate exists to prevent.
//   * written but not released → the material is finished and Sunil has not
//     taught it yet. Handing week 4 to the room in week 2 spoils four sessions
//     of prediction-before-reveal, which is the whole method.
//
// Week 0 is the exception and it is always open. It is the pre-work: it has to
// be readable before anything is taught, and it is what tells somebody how to
// get their environment running.
//
// ---------------------------------------------------------------------------
// WHEN THE TABLE IS NOT ANSWERING
// ---------------------------------------------------------------------------
// Every other query in this codebase degrades to empty on error. Here that
// would silently lock the whole course, so the fallback is explicit and it is
// the safer of the two: an unreachable table means NOTHING is released except
// week 0. A learner sees "not yet released" — which may be wrong and is
// recoverable — rather than material Sunil had not opened yet, which is not.
// `/craft/admin` shows the red banner, because `session_releases` is in the
// health probe's table list.

import { db } from '../admin/supabase';

export interface Release {
  week: number;
  releasedAt: string;
  /** Free text Sunil may leave, shown to nobody but him. */
  note?: string;
}

/** Week 0 is the pre-work and is never gated. */
const ALWAYS_OPEN = 0;

/**
 * The weeks that have been released, newest first.
 *
 * Returns null — not an empty array — when the table cannot be read, so a
 * caller can tell "nothing released yet" from "we do not know". Callers that
 * gate on it treat null as nothing released.
 */
export async function releases(): Promise<Release[] | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from('session_releases')
    .select('week, released_at, note')
    .order('week', { ascending: true });
  if (error) {
    console.error('session_releases: not answering —', error.message);
    return null;
  }
  return (data ?? []).map((r) => ({
    week: r.week as number,
    releasedAt: r.released_at as string,
    note: (r.note as string | null) ?? undefined,
  }));
}

/** The set of released week numbers. Empty when the table cannot be read. */
export async function releasedWeeks(): Promise<Set<number>> {
  const rows = await releases();
  return new Set((rows ?? []).map((r) => r.week));
}

/**
 * Is this week open to a learner? Written AND released, or week 0.
 *
 * `status` comes from the session file and `released` from the set above, so a
 * page reads both once and asks this per week rather than re-deriving the rule.
 */
export function isOpen(week: number, status: string, released: Set<number>): boolean {
  if (week === ALWAYS_OPEN) return true;
  return status === 'ready' && released.has(week);
}

/**
 * Why a week is shut, in the learner's words. Null when it is open.
 *
 * Two reasons and they read differently on purpose. "Not yet" is a promise
 * about the timetable; "still being written" is honest about the material and
 * is the one week 2 shows today.
 */
export function shutBecause(
  week: number,
  status: string,
  released: Set<number>,
): 'unreleased' | 'unwritten' | null {
  if (isOpen(week, status, released)) return null;
  if (status !== 'ready') return 'unwritten';
  return 'unreleased';
}

/** Open a week to the room. Idempotent: releasing twice keeps the first time. */
export async function release(week: number, note?: string): Promise<boolean> {
  const client = db();
  if (!client) return false;
  const { error } = await client
    .from('session_releases')
    .upsert({ week, note: note ?? null }, { onConflict: 'week', ignoreDuplicates: true });
  if (error) {
    console.error('session_releases: release failed —', error.message);
    return false;
  }
  return true;
}

/**
 * Shut a week again.
 *
 * Kept because a mis-click at 9pm on a Tuesday should not need a deploy to
 * undo, and because releasing week 4 instead of week 3 is exactly the mistake
 * somebody makes with eight buttons on one page. It is a real delete: there is
 * nothing worth keeping about a release that was wrong.
 */
export async function unrelease(week: number): Promise<boolean> {
  const client = db();
  if (!client) return false;
  const { error } = await client.from('session_releases').delete().eq('week', week);
  if (error) {
    console.error('session_releases: unrelease failed —', error.message);
    return false;
  }
  return true;
}
