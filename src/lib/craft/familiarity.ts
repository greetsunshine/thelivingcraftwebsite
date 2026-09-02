import { db } from '../admin/supabase';
import { TECHNICAL, LEADERSHIP } from './intake';

export interface FamiliarityAnswers {
  technical: Record<string, number>;
  leadership: Record<string, number>;
}

export interface FamiliarityResponse extends FamiliarityAnswers {
  id: string;
  learner_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

const empty = (): FamiliarityAnswers => ({ technical: {}, leadership: {} });

export function parseFamiliarityAnswers(input: unknown): FamiliarityAnswers {
  const out = empty();
  if (!input || typeof input !== 'object') return out;
  const body = input as Record<string, unknown>;

  const section = (key: string): Record<string, unknown> => {
    const value = body[key];
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  };

  for (const [key, questions] of [
    ['technical', TECHNICAL],
    ['leadership', LEADERSHIP],
  ] as const) {
    const raw = section(key);
    for (const { id } of questions) {
      const value = Number(raw[id]);
      if (Number.isInteger(value) && value >= 1 && value <= 5) {
        out[key][id] = value;
      }
    }
  }

  return out;
}

export function missingFamiliarityAnswers(answers: FamiliarityAnswers): string[] {
  const gaps: string[] = [];
  for (const { id } of TECHNICAL) if (!answers.technical[id]) gaps.push(id);
  for (const { id } of LEADERSHIP) if (!answers.leadership[id]) gaps.push(id);
  return gaps;
}

export async function getFamiliarity(learnerId: string): Promise<FamiliarityResponse | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('familiarity_responses')
      .select('*')
      .eq('learner_id', learnerId)
      .maybeSingle();
    if (error) throw error;
    return (data as FamiliarityResponse) ?? null;
  } catch (err) {
    console.error('getFamiliarity failed:', err);
    return null;
  }
}

export async function saveFamiliarity(input: {
  learnerId: string;
  answers: FamiliarityAnswers;
  submit: boolean;
}): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  const existing = await getFamiliarity(input.learnerId);
  const submittedAt = input.submit ? (existing?.submitted_at ?? new Date().toISOString()) : (existing?.submitted_at ?? null);

  try {
    const { error } = await client.from('familiarity_responses').upsert(
      {
        learner_id: input.learnerId,
        ...input.answers,
        submitted_at: submittedAt,
      },
      { onConflict: 'learner_id' },
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error('saveFamiliarity failed:', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// The room — Sunil's half (spec §5.6)
// ---------------------------------------------------------------------------

export interface FamiliarityRow extends FamiliarityAnswers {
  learner_id: string;
  submitted_at: string | null;
}

export async function listFamiliarity(): Promise<FamiliarityRow[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('familiarity_responses')
      .select('learner_id, technical, leadership, submitted_at')
      .not('submitted_at', 'is', null);
    if (error) throw error;
    return (data as FamiliarityRow[]) ?? [];
  } catch (err) {
    console.error('listFamiliarity failed:', err);
    return [];
  }
}

export interface CapabilityRoom {
  id: string;
  text: string;
  section: 'technical' | 'leadership';
  /** Week-0 ratings, one per learner who answered. */
  before: number[];
  /** Week-6 ratings for the same people. */
  after: number[];
  /** How many rated it 2 or below at week 0 — the number that aims a session. */
  lowAtStart: number;
  /** Sum of per-learner movement. A count, not a score: nobody is ranked by it. */
  moved: number;
  /** Learners whose rating did not change. */
  flat: number;
}

/**
 * Where the room is, per capability. "Six of eight rated A5 at 2 or below" aims
 * week 3 before it is taught — which is the whole point of asking at week 0.
 *
 * Every number here is a count over answers people gave about themselves. No
 * model, no inference, and nothing that assigns anyone a level: §2 and §10 rule
 * that out, and a self-rating is not evidence of capability anyway.
 */
export function roomByCapability(
  intake: { learner_id: string; technical: Record<string, number>; leadership: Record<string, number> }[],
  week6: FamiliarityRow[],
): CapabilityRoom[] {
  const later = new Map(week6.map((r) => [r.learner_id, r]));

  const build = (section: 'technical' | 'leadership', questions: { id: string; text: string }[]) =>
    questions.map(({ id, text }) => {
      const before: number[] = [];
      const after: number[] = [];
      let moved = 0;
      let flat = 0;

      for (const row of intake) {
        const w0 = row[section]?.[id];
        if (!w0) continue;
        before.push(w0);

        const w6 = later.get(row.learner_id)?.[section]?.[id];
        if (!w6) continue;
        after.push(w6);
        if (w6 === w0) flat += 1;
        else moved += w6 - w0;
      }

      return {
        id,
        text,
        section,
        before,
        after,
        lowAtStart: before.filter((n) => n <= 2).length,
        moved,
        flat,
      };
    });

  return [...build('technical', TECHNICAL), ...build('leadership', LEADERSHIP)]
    // Weakest room first — that is the order a session gets planned in.
    .sort((a, b) => b.lowAtStart - a.lowAtStart);
}

export interface SayShowFlag {
  learner_id: string;
  capability: string;
  selfRating: number;
  doubts: number;
  reason: string;
}

/**
 * Disagreement between what a learner SAYS and what they SHOW — the one thing
 * in this feature worth a second look (§5.6). Self-rates a capability at 4 or
 * 5, then asks nothing about it all cohort.
 *
 * A flag for Sunil to look at. NOT a score, and deliberately not shown to the
 * learner: "you claimed 4 and we disagree" is an argument, not teaching.
 */
export function sayShowFlags(
  intake: { learner_id: string; technical: Record<string, number>; leadership: Record<string, number> }[],
  doubtsByLearnerCapability: Map<string, number>,
): SayShowFlag[] {
  const flags: SayShowFlag[] = [];

  for (const row of intake) {
    for (const section of ['technical', 'leadership'] as const) {
      for (const [capability, rating] of Object.entries(row[section] ?? {})) {
        if (rating < 4) continue;
        const asked = doubtsByLearnerCapability.get(`${row.learner_id}:${capability}`) ?? 0;
        if (asked > 0) continue;
        flags.push({
          learner_id: row.learner_id,
          capability,
          selfRating: rating,
          doubts: asked,
          reason: `Rated ${rating}/5 at intake and has asked nothing about it.`,
        });
      }
    }
  }

  return flags;
}
