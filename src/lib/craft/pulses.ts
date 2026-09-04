// Capability pulses — the same short rating either side of one session.
//
// ---------------------------------------------------------------------------
// WHY THIS IS THREE QUESTIONS AND NOT THIRTEEN
// ---------------------------------------------------------------------------
// Twice a week for six weeks is twelve asks. At thirteen capabilities each that
// is 156 ratings per learner, and a room of director-level engineers stops
// answering somewhere in week two — at which point the data is not merely
// sparse, it is biased toward the compliant.
//
// So a pulse covers only the capabilities THAT session teaches — its `topics`,
// three of them for week 1. Half a minute, and the delta is ATTRIBUTABLE:
// movement on A5 either side of the session that taught A5 says something about
// the session. The same movement measured six weeks apart says only that time
// passed.
//
// ---------------------------------------------------------------------------
// THIS DOES NOT REPLACE §5.6
// ---------------------------------------------------------------------------
// The week-0 intake and the week-6 re-ask stay exactly as they are: all
// thirteen capabilities, the cohort-level before/after, and the evidence behind
// the programme's outcome claims. Pulses are a finer-grained instrument
// alongside them, not a substitute — which is why week 6 has NO after-pulse.
// The full re-ask happens that same day and covers the ground better; asking
// both would be asking twice.
//
// ---------------------------------------------------------------------------
// THE WINDOWS
// ---------------------------------------------------------------------------
//   before — opens when the PREVIOUS session ends (or immediately, for week 1),
//            closes when this session starts. A "baseline" taken after the
//            teaching is not a baseline, so the close is hard.
//   after  — opens when the session ends, and stays open. Like feedback, it
//            sits on the to-do until it is done rather than expiring.
//
// Both need real timestamps. Absent `startsAt`/`endsAt` means the window never
// opens, never a guess — the same rule as everything else keyed to the
// timetable. See sessionEnded() in checks.ts.

import { db } from '../admin/supabase';
import { sessionEnded } from './checks';
import { TECHNICAL, LEADERSHIP, type Question } from './intake';

const fail = (where: string, err: unknown) => {
  console.error(`pulses ${where} failed:`, err instanceof Error ? err.message : err);
};

export type PulsePhase = 'before' | 'after';

/** Week 6's after-pulse is deliberately absent — the §5.6 re-ask covers it. */
export const NO_AFTER_PULSE_WEEK = 6;

export interface PulseSession {
  week: number;
  title: string;
  topics: string[];
  startsAt?: string;
  endsAt?: string;
}

export interface Pulse {
  learner_id: string;
  week: number;
  phase: PulsePhase;
  ratings: Record<string, number>;
  created_at: string;
}

export interface PulseWindow {
  week: number;
  title: string;
  phase: PulsePhase;
  /** The capabilities this session teaches, with their full question text. */
  capabilities: Question[];
  isOpen: boolean;
  answered: boolean;
}

const ALL_CAPABILITIES = [...TECHNICAL, ...LEADERSHIP];

/** Session `topics` are capability ids; this turns them into the real questions. */
export function capabilitiesFor(topics: string[]): Question[] {
  return topics
    .map((id) => ALL_CAPABILITIES.find((c) => c.id === id))
    .filter((c): c is Question => !!c);
}

const parsed = (iso?: string): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Every pulse window for this learner, open or not.
 *
 * A session with no `topics` produces nothing: there is no such thing as a
 * pulse on zero capabilities, and rendering an empty form would be worse than
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
    const capabilities = capabilitiesFor(s.topics ?? []);
    if (capabilities.length === 0) continue;

    const has = (phase: PulsePhase) =>
      pulses.some((p) => p.week === s.week && p.phase === phase);

    // --- before ---------------------------------------------------------
    // Opens when the previous session ends, so the run-up to each session has
    // exactly one baseline window and they cannot overlap.
    const starts = parsed(s.startsAt);
    const previous = taught[i - 1];
    const openedBy = previous ? sessionEnded(previous.endsAt, now) : true;
    const beforeOpen = starts !== null && openedBy && now.getTime() < starts.getTime();

    out.push({
      week: s.week,
      title: s.title,
      phase: 'before',
      capabilities,
      isOpen: beforeOpen,
      answered: has('before'),
    });

    // --- after ----------------------------------------------------------
    if (s.week !== NO_AFTER_PULSE_WEEK) {
      out.push({
        week: s.week,
        title: s.title,
        phase: 'after',
        capabilities,
        isOpen: sessionEnded(s.endsAt, now),
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

export async function listLearnerPulses(learnerId: string): Promise<Pulse[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('capability_pulses')
      .select('*')
      .eq('learner_id', learnerId);
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
    const { data, error } = await client.from('capability_pulses').select('*');
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
      .from('capability_pulses')
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

export interface CapabilityMove {
  capability: string;
  text: string;
  /** Learners who answered BOTH sides. Only they can contribute a delta. */
  n: number;
  before: number;
  after: number;
  change: number;
}

export interface SessionMove {
  week: number;
  title: string;
  capabilities: CapabilityMove[];
  /** Answered both sides, on at least one capability. */
  learners: number;
}

/** One decimal place, and never a fabricated precision beyond it. */
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * How far the room moved on each capability, either side of one session.
 *
 * PAIRED ONLY. A learner who rated before and not after contributes to neither
 * mean — otherwise the "after" average is computed over a different set of
 * people from the "before" one, and the difference measures who replied rather
 * than what they learned. That is the classic way a survey delta lies.
 *
 * Counting is code, per §4. No model is anywhere near this.
 */
export function sessionMoves(sessions: PulseSession[], pulses: Pulse[]): SessionMove[] {
  const out: SessionMove[] = [];

  for (const s of sessions.filter((x) => x.week >= 1)) {
    const capabilities = capabilitiesFor(s.topics ?? []);
    if (capabilities.length === 0) continue;

    const before = new Map(
      pulses.filter((p) => p.week === s.week && p.phase === 'before').map((p) => [p.learner_id, p]),
    );
    const after = new Map(
      pulses.filter((p) => p.week === s.week && p.phase === 'after').map((p) => [p.learner_id, p]),
    );

    const paired = [...before.keys()].filter((id) => after.has(id));
    if (paired.length === 0) continue;

    const moves: CapabilityMove[] = [];
    for (const cap of capabilities) {
      const pairs = paired
        .map((id) => ({
          b: before.get(id)!.ratings?.[cap.id],
          a: after.get(id)!.ratings?.[cap.id],
        }))
        .filter((p) => typeof p.b === 'number' && typeof p.a === 'number');

      if (pairs.length === 0) continue;

      const b = pairs.reduce((n, p) => n + p.b!, 0) / pairs.length;
      const a = pairs.reduce((n, p) => n + p.a!, 0) / pairs.length;

      moves.push({
        capability: cap.id,
        text: cap.text,
        n: pairs.length,
        before: round1(b),
        after: round1(a),
        change: round1(a - b),
      });
    }

    if (moves.length === 0) continue;

    // Smallest movement first: the capability a session FAILED to shift is the
    // one worth Sunil's attention, and it is the one a "biggest gain" ordering
    // would bury at the bottom.
    moves.sort((x, y) => x.change - y.change);

    out.push({ week: s.week, title: s.title, capabilities: moves, learners: paired.length });
  }

  return out.sort((a, b) => b.week - a.week);
}
