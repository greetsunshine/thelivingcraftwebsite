// The run of show, as arithmetic.
//
// Sessions carry their day as OFFSETS from 00:00 — '00:15', '02:20' — and the
// wall clock only ever comes from `startsAt`. That split is deliberate. The
// timetable moves (a cohort slips a week, a session is rescheduled) and the
// shape of the day does not, so restating clock times inside the run of show
// would be a second source for a fact that already has one.
//
// ---------------------------------------------------------------------------
// WHAT THIS EXISTS FOR
// ---------------------------------------------------------------------------
// One question, and it was answered wrongly for a fortnight: when does the
// before-rating stop being a baseline?
//
// The rule is sound — "a rating taken after the teaching is not a baseline" —
// and the old code enforced it at `startsAt`. But week 1 opens at 00:00 with the
// five outcomes and the pre-work questions, takes its first rating at 00:05, and
// does not teach anything until block 1 at 00:15. Closing at `startsAt` refused
// the exact rating the rule was written to protect.
//
// So the close is the first BLOCK in the run of show, not the start of the
// session. Derived, never configured separately: two fields that must agree
// eventually disagree, and the one that would drift here silently discards a
// learner's answer.

/** An offset like '02:20', in minutes. Null if it is not one. */
export function offsetMinutes(at: string | undefined): number | null {
  if (!at) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(at.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const mins = Number(m[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(mins) || mins > 59) return null;
  return hours * 60 + mins;
}

export type BlockKind = 'opening' | 'block' | 'break' | 'standup' | 'quiz' | 'close';

export interface RunOfShowEntry {
  at: string;
  label: string;
  detail?: string;
  kind?: BlockKind;
}

/** Entries in the order the day runs them, ignoring anything unparseable. */
export function ordered(runOfShow: RunOfShowEntry[] | undefined): RunOfShowEntry[] {
  return (runOfShow ?? [])
    .filter((e) => offsetMinutes(e.at) !== null)
    .sort((a, b) => offsetMinutes(a.at)! - offsetMinutes(b.at)!);
}

/** The first entry of a kind, or null. The day has one quiz and one close. */
export function firstOfKind(
  runOfShow: RunOfShowEntry[] | undefined,
  kind: BlockKind,
): RunOfShowEntry | null {
  return ordered(runOfShow).find((e) => (e.kind ?? 'block') === kind) ?? null;
}

/**
 * Minutes from the session start until teaching begins — the first `block`.
 *
 * Returns 0 for a session with no run of show, which restores exactly the old
 * behaviour: the window closes at `startsAt`. That is the right default. A
 * session nobody has written a day for has told us nothing about when its
 * teaching starts, and inventing a fifteen-minute grace period for it would be
 * the same class of guess as inventing an end time.
 */
export function teachingOffset(runOfShow: RunOfShowEntry[] | undefined): number {
  const first = firstOfKind(runOfShow, 'block');
  return first ? (offsetMinutes(first.at) ?? 0) : 0;
}

/**
 * The instant this session stops accepting a baseline.
 *
 * Null when `startsAt` is unset — the same rule as everywhere else keyed to the
 * timetable. No timestamp means the window never opens, rather than opening
 * forever or being guessed at.
 */
export function teachingStartsAt(
  startsAt: string | undefined,
  runOfShow: RunOfShowEntry[] | undefined,
): Date | null {
  if (!startsAt) return null;
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + teachingOffset(runOfShow) * 60_000);
}

/** An offset resolved against a real session start. Null if either is missing. */
export function momentAt(
  startsAt: string | undefined,
  at: string | undefined,
): Date | null {
  if (!startsAt) return null;
  const start = new Date(startsAt);
  const mins = offsetMinutes(at);
  if (Number.isNaN(start.getTime()) || mins === null) return null;
  return new Date(start.getTime() + mins * 60_000);
}

/**
 * When a named part of the day begins, in wall-clock time.
 *
 * `fallback` is what to use when the run of show does not name that part —
 * usually `endsAt`, so a session written before this existed behaves as it did.
 * Null when there is no timetable at all, which is the standing rule: no
 * timestamp means the thing never opens, rather than opening forever.
 */
export function momentOfKind(
  startsAt: string | undefined,
  runOfShow: RunOfShowEntry[] | undefined,
  kind: BlockKind,
  fallback?: string,
): Date | null {
  const entry = firstOfKind(runOfShow, kind);
  if (entry) return momentAt(startsAt, entry.at);
  if (!fallback) return null;
  const d = new Date(fallback);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The entry the room is inside at `now`, and when it gives way to the next one.
 *
 * A block runs until the following entry starts — the run of show lists starts,
 * not durations, so the end of one is the beginning of the next and the last
 * entry runs to `endsAt`.
 */
export function blockAt(
  startsAt: string | undefined,
  endsAt: string | undefined,
  runOfShow: RunOfShowEntry[] | undefined,
  now: Date = new Date(),
): { entry: RunOfShowEntry; until: Date | null } | null {
  const entries = ordered(runOfShow);
  if (entries.length === 0 || !startsAt) return null;

  let current: RunOfShowEntry | null = null;
  let until: Date | null = null;

  for (const [i, e] of entries.entries()) {
    const begins = momentAt(startsAt, e.at);
    if (!begins || begins.getTime() > now.getTime()) break;
    current = e;
    const next = entries[i + 1];
    until = next ? momentAt(startsAt, next.at) : endsAt ? new Date(endsAt) : null;
  }

  return current ? { entry: current, until } : null;
}
