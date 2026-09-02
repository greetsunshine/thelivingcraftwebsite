// The intake questionnaire — questions, validation, and its two DB calls.
//
// One module owns the question set for the same reason facts.ts owns the offer
// facts: four things read it — the form, the validator, the console and the CSV
// header — and a question that exists in three of them is a column of answers
// nobody can interpret. Reword freely here; the ids are what the answers key
// off, so wording changes do not orphan data.
//
// The text comes from docs/welcome-email.md in the cohort bundle ("The intake
// form"). Keep the two in step, or send the welcome email from this file.

import { db } from '../admin/supabase';

/** Section 1 — a three-way gut check, not a score. */
export const QUICK_OPTIONS = ['solid', 'rusty', 'new'] as const;
export type QuickOption = (typeof QUICK_OPTIONS)[number];

export const QUICK_LABELS: Record<QuickOption, string> = {
  solid: 'Solid',
  rusty: 'Rusty',
  new: 'New to me',
};

export interface Question {
  id: string;
  text: string;
}

export const QUICK_CHECK: Question[] = [
  { id: 'q1', text: 'Read/write Python — functions, dicts, basic async.' },
  { id: 'q2', text: 'Reason about APIs & distributed systems (retries, timeouts, idempotency).' },
  { id: 'q3', text: 'Basics of calling an LLM (prompts, tokens, context).' },
  { id: 'q4', text: 'Seen at least one LLM/agent prototype up close.' },
  { id: 'q5', text: 'Read a code diff and reason about what it does.' },
];

/** Section 2 — 1 = couldn't do it · 3 = with help · 5 = could lead & defend it. */
export const SCALE = [1, 2, 3, 4, 5] as const;

export const SCALE_LEGEND: Record<number, string> = {
  1: "Couldn't do it",
  2: 'With a lot of help',
  3: 'With help',
  4: 'On my own',
  5: 'Could lead & defend it',
};

export const TECHNICAL: Question[] = [
  { id: 'A1', text: 'I can accurately diagram the anatomy and components of an agentic system.' },
  { id: 'A2', text: 'I can read a system trace and confidently analyze success, cost, and latency.' },
  { id: 'A3', text: 'I can implement robust guardrails on irreversible actions.' },
  { id: 'A4', text: 'I know when to choose prompting vs RAG vs fine-tuning for a specific problem.' },
  { id: 'A5', text: 'I can design an evaluation harness that reliably catches edge cases and missed failures.' },
  { id: 'A6', text: 'I can reason about the trade-offs between latency, cost, and quality with concrete numbers.' },
  { id: 'A7', text: 'I can harden an agentic application against prompt injection and data leakage.' },
];

export const LEADERSHIP: Question[] = [
  { id: 'B1', text: 'I can effectively explain the value and risks of an agentic system to an executive.' },
  { id: 'B2', text: 'I can make and defend the choice between agent vs workflow or build vs buy.' },
  { id: 'B3', text: 'I can confidently define when an agent is "good enough to ship".' },
  { id: 'B4', text: 'I can explain the unit economics of an LLM feature to finance.' },
  { id: 'B5', text: 'I can make a go/no-go call for production and defend it to a board.' },
  { id: 'B6', text: 'I can successfully lead a team through the process of adopting agents.' },
];

/** Section 3 — prose. Short answers are fine; specifics beat polish. */
export const REALITY: Question[] = [
  { id: 'r1', text: 'Your context — what you build, where you sit, the system you own.' },
  {
    id: 'r2',
    text: 'Your agentic reality — are you building with agents today? How far have you got? Or what is pushing you toward it?',
  },
  { id: 'r3', text: "Where you're stuck — reliability, evaluation, cost, governance, leadership?" },
  { id: 'r4', text: "A real use case of your own you'd love to get right." },
  { id: 'r5', text: 'What "shipped" means for you.' },
  { id: 'r6', text: 'One outcome you want to walk away able to do.' },
];

/** Longest answer we will store. Past this is a paste, not an answer. */
const MAX_PROSE = 4000;

export interface IntakeAnswers {
  quick_check: Record<string, QuickOption>;
  technical: Record<string, number>;
  leadership: Record<string, number>;
  reality: Record<string, string>;
}

export interface IntakeResponse extends IntakeAnswers {
  id: string;
  learner_id: string;
  email: string;
  name: string | null;
  cohort: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

const empty = (): IntakeAnswers => ({ quick_check: {}, technical: {}, leadership: {}, reality: {} });

/**
 * Coerce whatever the browser posted into the shape above.
 *
 * Deliberately lenient about MISSING answers and strict about invalid ones: a
 * half-finished form must be savable, but a value outside the question set is a
 * bug or a probe, and storing it would put text into the console that no
 * question asked for. Unrecognised ids and out-of-range values are dropped, not
 * rejected — the learner should not lose six paragraphs because one radio was
 * tampered with.
 */
export function parseAnswers(input: unknown): IntakeAnswers {
  const out = empty();
  if (!input || typeof input !== 'object') return out;
  const body = input as Record<string, unknown>;

  const section = (key: string): Record<string, unknown> => {
    const value = body[key];
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  };

  const quick = section('quick_check');
  for (const { id } of QUICK_CHECK) {
    const value = quick[id];
    if (typeof value === 'string' && (QUICK_OPTIONS as readonly string[]).includes(value)) {
      out.quick_check[id] = value as QuickOption;
    }
  }

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

  const reality = section('reality');
  for (const { id } of REALITY) {
    const value = reality[id];
    if (typeof value === 'string') {
      const text = value.trim().slice(0, MAX_PROSE);
      if (text) out.reality[id] = text;
    }
  }

  return out;
}

/**
 * Which questions are still unanswered.
 *
 * Used to decide whether a submit is allowed, and shown back to the learner so
 * "you missed some" names which ones. Browser `required` catches this first;
 * this is the copy that survives a disabled script or a hand-rolled POST.
 */
export function missingAnswers(answers: IntakeAnswers): string[] {
  const gaps: string[] = [];
  for (const { id } of QUICK_CHECK) if (!answers.quick_check[id]) gaps.push(id);
  for (const { id } of TECHNICAL) if (!answers.technical[id]) gaps.push(id);
  for (const { id } of LEADERSHIP) if (!answers.leadership[id]) gaps.push(id);
  for (const { id } of REALITY) if (!answers.reality[id]) gaps.push(id);
  return gaps;
}

/** This learner's response, or null if they have not started. */
export async function getIntake(learnerId: string): Promise<IntakeResponse | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('intake_responses')
      .select('*')
      .eq('learner_id', learnerId)
      .maybeSingle();
    if (error) throw error;
    return (data as IntakeResponse) ?? null;
  } catch (err) {
    console.error('getIntake failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Save (or re-save) a response.
 *
 * NOT fire-and-forget, which is the one place this departs from api/lead.ts.
 * There, a lost row costs a duplicate record because Web3Forms already has the
 * lead. Here the database IS the only copy — silently swallowing a failure
 * would tell a learner their intake is in when it is nowhere. So this reports
 * failure and the page says so.
 */
export async function saveIntake(input: {
  learner: { id: string; email: string; name: string | null; cohort: string };
  answers: IntakeAnswers;
  submit: boolean;
}): Promise<{ ok: boolean; submittedAt: string | null }> {
  const client = db();
  if (!client) return { ok: false, submittedAt: null };

  // Re-submitting keeps the ORIGINAL submitted_at. Sunil reads the timestamp as
  // "when did this land", and a learner fixing a typo the night before the
  // cohort should not look like they answered at the last minute.
  const existing = await getIntake(input.learner.id);
  const submittedAt = input.submit ? (existing?.submitted_at ?? new Date().toISOString()) : (existing?.submitted_at ?? null);

  try {
    const { error } = await client.from('intake_responses').upsert(
      {
        learner_id: input.learner.id,
        email: input.learner.email,
        name: input.learner.name,
        cohort: input.learner.cohort,
        ...input.answers,
        submitted_at: submittedAt,
      },
      { onConflict: 'learner_id' },
    );
    if (error) throw error;
    return { ok: true, submittedAt };
  } catch (err) {
    console.error('saveIntake failed:', err instanceof Error ? err.message : err);
    return { ok: false, submittedAt: null };
  }
}

/** Every response, newest first. Console + CSV. */
export async function listIntake(): Promise<IntakeResponse[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('intake_responses')
      .select('*')
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) throw error;
    return (data as IntakeResponse[]) ?? [];
  } catch (err) {
    console.error('listIntake failed:', err instanceof Error ? err.message : err);
    return [];
  }
}
