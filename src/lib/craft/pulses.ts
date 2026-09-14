// Session pulses — the same short rating taken twice around one session.
//
// ---------------------------------------------------------------------------
// NAMING
// ---------------------------------------------------------------------------
// "Pulse" is the internal word for the instrument: a handful of statements,
// rated 1–5, once before the teaching and once after. The room calls it "rate
// yourself against these five". The Postgres table is `outcome_ratings`, which
// is what it holds. This file is the only place that has to hold both.
//
// ---------------------------------------------------------------------------
// IT RATES THE SESSION'S OWN FIVE OUTCOMES, NOT CAPABILITY IDS
// ---------------------------------------------------------------------------
// This was three of the thirteen intake capabilities, chosen by a `topics` array
// on the session. Once week 1 was written it became clear that is not what
// happens. The room rates FIVE STATEMENTS WRITTEN FOR THAT SESSION, in that
// session's words — "the same five statements, in the same words, so that the
// two sets of numbers mean the same thing" — and nothing in the teaching
// material ever maps a week to A1–A3. That mapping existed only because the
// schema asked for one.
//
// The thirteen keep the job they are good at: the week-0 intake and the week-6
// re-ask over all thirteen (§5.6), which is the cohort-level evidence behind the
// programme's outcome claims. Two instruments, two jobs. Do not merge them
// again — a per-session delta on a cohort-wide vocabulary is not attributable to
// the session, and a cohort-wide claim built from five different per-week
// vocabularies is not a claim about anything.
//
// The reason for keeping it short is unchanged and still the binding one: twice
// a week for six weeks is twelve asks, and at thirteen statements each that is
// 156 ratings per learner. A room of director-level engineers stops answering
// somewhere in week two, at which point the data is not sparse but biased toward
// the compliant. Five is what the session already asks for.
//
// ---------------------------------------------------------------------------
// THE WINDOWS
// ---------------------------------------------------------------------------
//   before — opens when the PREVIOUS session ends (or immediately, for week 1),
//            closes WHEN TEACHING STARTS. Not when the session starts: week 1
//            opens at 00:00, rates at 00:05, and teaches from 00:15, so closing
//            at `startsAt` refused the exact rating the rule protects. The rule
//            itself — a baseline taken after the teaching is not a baseline —
//            is unchanged. See schedule.ts for where the boundary comes from.
//   after  — opens at the CLOSE block, and stays open. Not at `endsAt`: week 1
//            takes the second rating at 04:52, inside a close running 04:50 to
//            05:00, so opening at the end of the session missed it by eight
//            minutes. Once open it never closes — like feedback, it sits on the
//            to-do until it is done rather than expiring.
//
// Both need real timestamps. Absent `startsAt`/`endsAt` means the window never
// opens, never a guess — the same rule as everything else keyed to the
// timetable. See sessionEnded() in checks.ts.
//
// ---------------------------------------------------------------------------
// WEEK 6 HAS NO AFTER-PULSE
// ---------------------------------------------------------------------------
// The full §5.6 re-ask happens that same day and covers the ground better.
// Asking both would be asking twice.

import { db } from '../admin/supabase';
import { sessionEnded } from './checks';
import { teachingStartsAt, momentOfKind, type RunOfShowEntry } from './schedule';

const fail = (where: string, err: unknown) => {
  console.error(`pulses ${where} failed:`, err instanceof Error ? err.message : err);
};

export type PulsePhase = 'before' | 'after';

/** Week 6's after-pulse is deliberately absent — the §5.6 re-ask covers it. */
export const NO_AFTER_PULSE_WEEK = 6;

/** One of the five, as the session file carries it. */
export interface SessionOutcome {
  id: string;
  text: string;
  /** Sunil's prediction that this one moves most. Not used in any average. */
  movesMost?: boolean;
}

export interface PulseSession {
  week: number;
  title: string;
  outcomes: SessionOutcome[];
  runOfShow?: RunOfShowEntry[];
  startsAt?: string;
  endsAt?: string;
}

export interface Pulse {
  learner_id: string;
  week: number;
  phase: PulsePhase;
  /** Keyed by outcome id, values 1–5. */
  ratings: Record<string, number>;
  created_at: string;
}

export interface PulseWindow {
  week: number;
  title: string;
  phase: PulsePhase;
  /** The five statements, in the session's own words and its own order. */
  outcomes: SessionOutcome[];
  isOpen: boolean;
  answered: boolean;
}

/**
 * True once the teaching has begun, so a baseline is no longer a baseline.
 *
 * Exported because session mode asks the same question from a different angle,
 * and a second copy of this test is how the boundary drifts. No timetable counts
 * as shut: without `startsAt` the window never opens at all.
 */
export function teachingWindowShut(
  s: { startsAt?: string; runOfShow?: RunOfShowEntry[] },
  now: Date = new Date(),
): boolean {
  const closes = teachingStartsAt(s.startsAt, s.runOfShow);
  return closes === null || now.getTime() >= closes.getTime();
}

/**
 * Every pulse window for this learner, open or not.
 *
 * A session with no `outcomes` produces nothing: there is no such thing as a
 * pulse on zero statements, and rendering an empty form would be worse than
 * rendering none.
 */
export function pulseWindows(
  sessions: PulseSession[],
  pulses: Pulse[],
  now: Date = new Date(),
): PulseWindow[] {
  const taught = [...sessions].filter((s) => s.week >= 1).sort((a, b) => a.week - b.week);
  const out: PulseWindow[] = [];

  for (let i = 0; i < taught.length; i++) {
    const s = taught[i];
    const outcomes = s.outcomes ?? [];
    if (outcomes.length === 0) continue;

    const has = (phase: PulsePhase) =>
      pulses.some((p) => p.week === s.week && p.phase === phase);

    // --- before ---------------------------------------------------------
    // Opens when the previous session ends, so the run-up to each session has
    // exactly one baseline window and they cannot overlap. Closes when this
    // session's first teaching block begins.
    const previous = taught[i - 1];
    const openedBy = previous ? sessionEnded(previous.endsAt, now) : true;
    const beforeOpen = openedBy && !teachingWindowShut(s, now);

    out.push({
      week: s.week,
      title: s.title,
      phase: 'before',
      outcomes,
      isOpen: beforeOpen,
      answered: has('before'),
    });

    // --- after ----------------------------------------------------------
    // Opens at the CLOSE block, not at the end of the session. Week 1 takes the
    // second rating at 04:52, inside a close that runs 04:50 to 05:00 — the same
    // mistake as the before-window, eight minutes the other way. A session whose
    // run of show names no close falls back to `endsAt`, which is the old
    // behaviour. Once open it stays open: like feedback, it sits on the to-do
    // until it is done rather than expiring.
    if (s.week !== NO_AFTER_PULSE_WEEK) {
      const opens = momentOfKind(s.startsAt, s.runOfShow, 'close', s.endsAt);
      out.push({
        week: s.week,
        title: s.title,
        phase: 'after',
        outcomes,
        isOpen: opens !== null && now.getTime() >= opens.getTime(),
        answered: has('after'),
      });
    }
  }

  return out;
}

/** Open, unanswered, most recent first — what the to-do and the prompt use. */
export function pulsesDue(windows: PulseWindow[]): PulseWindow[] {
  return windows
    .filter((w) => w.isOpen && !w.answered)
    .sort((a, b) => b.week - a.week || (a.phase === 'after' ? -1 : 1));
}

export function findWindow(
  windows: PulseWindow[],
  week: number,
  phase: PulsePhase,
): PulseWindow | null {
  return windows.find((w) => w.week === week && w.phase === phase) ?? null;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const TABLE = 'outcome_ratings';

export async function listLearnerPulses(learnerId: string): Promise<Pulse[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client.from(TABLE).select('*').eq('learner_id', learnerId);
    if (error) throw error;
    return (data as Pulse[]) ?? [];
  } catch (err) {
    fail('listLearnerPulses', err);
    return [];
  }
}

export async function listAllPulses(): Promise<Pulse[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client.from(TABLE).select('*');
    if (error) throw error;
    return (data as Pulse[]) ?? [];
  } catch (err) {
    fail('listAllPulses', err);
    return [];
  }
}

export async function savePulse(
  learnerId: string,
  week: number,
  phase: PulsePhase,
  ratings: Record<string, number>,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client
      .from(TABLE)
      .upsert(
        { learner_id: learnerId, week, phase, ratings },
        { onConflict: 'learner_id,week,phase' },
      );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('savePulse', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// The delta — what this is all for
// ---------------------------------------------------------------------------

export interface OutcomeMove {
  outcome: string;
  text: string;
  /** Sunil said this one would move most. Reported, never weighted. */
  predicted: boolean;
  /** Learners who answered BOTH sides. Only they can contribute a delta. */
  n: number;
  before: number;
  after: number;
  change: number;
}

export interface SessionMove {
  week: number;
  title: string;
  outcomes: OutcomeMove[];
  /** Answered both sides, on at least one outcome. */
  learners: number;
}

/** One decimal place, and never a fabricated precision beyond it. */
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * How far the room moved on each outcome, either side of one session.
 *
 * PAIRED ONLY. A learner who rated before and not after contributes to neither
 * mean — otherwise the "after" average is computed over a different set of
 * people from the "before" one, and the difference measures who replied rather
 * than what they learned. That is the classic way a survey delta lies.
 *
 * `predicted` carries Sunil's before-the-fact claim about which outcomes move
 * most, so the read is "did the session do what he expected" rather than only
 * "what happened". It never touches an average.
 *
 * Counting is code, per §4. No model is anywhere near this.
 */
export function sessionMoves(sessions: PulseSession[], pulses: Pulse[]): SessionMove[] {
  const out: SessionMove[] = [];

  for (const s of sessions.filter((x) => x.week >= 1)) {
    const outcomes = s.outcomes ?? [];
    if (outcomes.length === 0) continue;

    const before = new Map(
      pulses.filter((p) => p.week === s.week && p.phase === 'before').map((p) => [p.learner_id, p]),
    );
    const after = new Map(
      pulses.filter((p) => p.week === s.week && p.phase === 'after').map((p) => [p.learner_id, p]),
    );

    const paired = [...before.keys()].filter((id) => after.has(id));
    if (paired.length === 0) continue;

    const moves: OutcomeMove[] = [];
    for (const o of outcomes) {
      const pairs = paired
        .map((id) => ({
          b: before.get(id)!.ratings?.[o.id],
          a: after.get(id)!.ratings?.[o.id],
        }))
        .filter((p) => typeof p.b === 'number' && typeof p.a === 'number');

      if (pairs.length === 0) continue;

      const b = pairs.reduce((n, p) => n + p.b!, 0) / pairs.length;
      const a = pairs.reduce((n, p) => n + p.a!, 0) / pairs.length;

      moves.push({
        outcome: o.id,
        text: o.text,
        predicted: o.movesMost === true,
        n: pairs.length,
        before: round1(b),
        after: round1(a),
        change: round1(a - b),
      });
    }

    if (moves.length === 0) continue;

    // Smallest movement first: the outcome a session FAILED to shift is the one
    // worth Sunil's attention, and it is the one a "biggest gain" ordering would
    // bury at the bottom.
    moves.sort((x, y) => x.change - y.change);

    out.push({ week: s.week, title: s.title, outcomes: moves, learners: paired.length });
  }

  return out.sort((a, b) => b.week - a.week);
}
