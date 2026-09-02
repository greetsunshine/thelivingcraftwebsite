// Doubts — captured, split, and routed. Deliberately never answered with an
// opinion.
//
// THE RULE THIS FILE EXISTS TO ENFORCE (spec §5.1, inherited from the PoC as
// "relay, don't extend"):
//
//   Course doubts  — when is the session, what is due, what is the format.
//                    Answered from facts.ts and session frontmatter. No
//                    judgement, no risk. CODE answers these, not a model.
//   Content doubts — why does idempotency matter here. Captured, tagged to a
//                    capability, clustered, ROUTED TO SUNIL. Never answered
//                    with a fresh opinion.
//
// An earlier version of this file ran a generic "you are a helpful AI tutor"
// prompt on every content doubt and showed the result to the learner as an
// "Automated Answer". That is the exact failure the split exists to prevent: an
// improvised answer arrives carrying the authority of the course, and Sunil
// never learns the question was asked. It also inverted the split — the safe
// half (logistics) fell through silently while the risky half ran free.
//
// What a model is allowed to do here is ONE thing, per spec §4: tag an incoming
// doubt to a capability id and give its cluster a label. It never writes prose
// a learner reads.
//
// ESCALATION IS A SUCCESS, NOT A FAILURE. A doubt with no grounded answer goes
// to Sunil and says so. If nothing is ever escalating, this file is overstepping.

import { db } from '../admin/supabase';
import { TECHNICAL, LEADERSHIP } from './intake';
import { searchKnowledge, tokenize, stem, score } from '../agent/knowledge';
import Anthropic from '@anthropic-ai/sdk';

/** Tagging and clustering only. Never used to write an answer. */
const CLASSIFIER_MODEL = 'claude-haiku-4-5-20251001';

export type DoubtKind = 'course' | 'content';
export type DoubtStatus = 'new' | 'routed' | 'answered';

/**
 * Where an answer came from. A learner should never have to guess whether they
 * are reading the syllabus or Sunil, and Sunil should be able to see at a
 * glance which rows in his inbox a machine already closed.
 */
export type AnswerSource = 'facts' | 'session' | 'relay' | 'sunil';

export interface Doubt {
  id: string;
  learner_id: string;
  body: string;
  kind: DoubtKind;
  capability_id: string | null;
  cluster_id: string | null;
  answer: string | null;
  answer_source: AnswerSource | null;
  status: DoubtStatus;
  created_at: string;
}

export interface DoubtWithLearner extends Doubt {
  learner_name: string | null;
  learner_email: string;
}

/**
 * The session facts a course doubt may be answered from. Passed in by the API
 * route rather than imported, so this module stays clear of `astro:content`
 * and can be reasoned about (and eventually tested) on its own.
 */
export interface SessionFact {
  week: number;
  title: string;
  summary: string;
  assignment?: string;
  taughtOn?: string;
  status: string;
}

const fail = (where: string, err: unknown) => {
  console.error(`doubts ${where} failed:`, err instanceof Error ? err.message : err);
};

const apiKey = (): string | undefined =>
  // @ts-ignore — import.meta.env on Vercel, process.env under scripts
  (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.ANTHROPIC_API_KEY : undefined) ??
  process.env.ANTHROPIC_API_KEY;

// ---------------------------------------------------------------------------
// Grounded answering — code only
// ---------------------------------------------------------------------------

/**
 * A lexical hit has to actually be a hit. One incidental word in common between
 * a question and a fact is noise, and relaying noise as an answer is worse than
 * escalating: it looks like the system understood and it did not.
 */
const MIN_SCORE = 4;

export interface GroundedAnswer {
  answer: string;
  source: AnswerSource;
}

/** Session frontmatter, rendered as the sentence a learner actually asked for. */
function sessionLine(s: SessionFact): string {
  const parts = [`**Week ${s.week} — ${s.title}.** ${s.summary}`];
  if (s.assignment && s.assignment !== 'TBD') parts.push(`Assignment: ${s.assignment}.`);
  if (s.taughtOn) parts.push(`Taught on ${s.taughtOn}.`);
  else if (s.status === 'draft') parts.push('This session is still being written.');
  return parts.join(' ');
}

/**
 * Answer a course doubt from the two grounded sources the spec allows, and
 * nothing else. Returns null when neither answers it — which is the signal to
 * escalate, not a reason to improvise.
 */
export function answerFromGround(body: string, sessions: SessionFact[]): GroundedAnswer | null {
  const q = tokenize(body).map(stem);
  if (q.length === 0) return null;

  // Session frontmatter first: "when is week 3" is a session question, and the
  // fact base has nothing week-specific in it to compete with.
  let bestSession: { s: SessionFact; n: number } | null = null;
  for (const s of sessions) {
    const explicitWeek = new RegExp(`\\bweek\\s*${s.week}\\b`, 'i').test(body) ? 6 : 0;
    const n =
      explicitWeek +
      score(q, s.title, 3) +
      score(q, s.summary, 1) +
      score(q, s.assignment ?? '', 2);
    if (n >= MIN_SCORE && (!bestSession || n > bestSession.n)) bestSession = { s, n };
  }

  const facts = searchKnowledge(body, null, 1);
  const bestFact = facts.length > 0 && facts[0].score >= MIN_SCORE ? facts[0] : null;

  if (bestSession && (!bestFact || bestSession.n >= bestFact.score)) {
    return {
      answer: `${sessionLine(bestSession.s)}\n\n*From the week ${bestSession.s.week} session page.*`,
      source: 'session',
    };
  }

  if (bestFact) {
    return {
      answer: `${bestFact.a}\n\n*From the programme facts — "${bestFact.q}"*`,
      source: 'facts',
    };
  }

  return null;
}

/**
 * Relay an answer Sunil has already given to the same question. The agent may
 * repeat his words with a citation; it may not extend them, summarise them, or
 * blend two of them together. So this returns a previous answer VERBATIM or
 * nothing at all.
 */
export async function relayApprovedAnswer(body: string): Promise<GroundedAnswer | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('doubts')
      .select('body, answer, created_at')
      .eq('answer_source', 'sunil')
      .eq('status', 'answered')
      .not('answer', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const q = tokenize(body).map(stem);
    if (q.length === 0) return null;

    let best: { row: any; n: number } | null = null;
    for (const row of data ?? []) {
      const n = score(q, row.body, 3);
      if (n >= MIN_SCORE + 2 && (!best || n > best.n)) best = { row, n };
    }
    if (!best) return null;

    const when = new Date(best.row.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
    });
    return {
      answer: `${best.row.answer}\n\n*Sunil answered this on ${when}. Ask again below if your question is different.*`,
      source: 'relay',
    };
  } catch (err) {
    fail('relayApprovedAnswer', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Classification — the one thing a model does here
// ---------------------------------------------------------------------------

/**
 * Tag a content doubt to a capability and give its theme a short label, so
 * Sunil's inbox groups instead of listing. Returns nulls on any failure: an
 * untagged doubt still reaches him, which is the outcome that matters.
 */
async function classifyDoubt(
  body: string,
): Promise<{ capability_id: string | null; cluster_id: string | null }> {
  const key = apiKey();
  if (!key) return { capability_id: null, cluster_id: null };

  const capList = [...TECHNICAL, ...LEADERSHIP].map((c) => `${c.id}: ${c.text}`).join('\n');

  const prompt = `Classify a learner's question against this cohort's capability list.

${capList}

Reply with JSON only, no prose:
{"capability_id": "A1", "cluster_id": "short thematic label"}

capability_id must be one of the ids above, or null if none fits well.
cluster_id is a 2-3 word theme label ("Idempotency", "Eval design") used to
group questions that are really the same question.

Question: ${JSON.stringify(body)}`;

  try {
    const response = await new Anthropic({ apiKey: key }).messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    if (block?.type !== 'text') return { capability_id: null, cluster_id: null };

    const parsed = JSON.parse(block.text.replace(/```json|```/g, '').trim());
    const valid = new Set([...TECHNICAL, ...LEADERSHIP].map((c) => c.id));
    return {
      capability_id: valid.has(parsed.capability_id) ? parsed.capability_id : null,
      cluster_id: typeof parsed.cluster_id === 'string' ? parsed.cluster_id.slice(0, 40) : null,
    };
  } catch (err) {
    fail('classifyDoubt', err);
    return { capability_id: null, cluster_id: null };
  }
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

export interface SubmitResult {
  ok: boolean;
  id?: string;
  answer?: string;
  answerSource?: AnswerSource;
  /** True when nothing grounded answered it and it is now waiting on Sunil. */
  escalated?: boolean;
}

export async function submitDoubt(
  learnerId: string,
  body: string,
  kind: DoubtKind,
  sessions: SessionFact[] = [],
): Promise<SubmitResult> {
  const client = db();
  if (!client) return { ok: false };

  let capability_id: string | null = null;
  let cluster_id: string | null = null;
  let grounded: GroundedAnswer | null = null;

  if (kind === 'course') {
    // The safe half. Answerable from the syllabus or it goes to Sunil.
    grounded = answerFromGround(body, sessions);
  } else {
    // The risky half. Tagged and clustered so Sunil's inbox groups, and
    // relayed ONLY if he has already answered this exact question.
    ({ capability_id, cluster_id } = await classifyDoubt(body));
    grounded = await relayApprovedAnswer(body);
  }

  try {
    const { data, error } = await client
      .from('doubts')
      .insert({
        learner_id: learnerId,
        body: body.trim(),
        kind,
        capability_id,
        cluster_id,
        answer: grounded?.answer ?? null,
        answer_source: grounded?.source ?? null,
        status: grounded ? 'answered' : 'new',
      })
      .select('id')
      .single();

    if (error) throw error;
    return {
      ok: true,
      id: data.id,
      answer: grounded?.answer,
      answerSource: grounded?.source,
      escalated: !grounded,
    };
  } catch (err) {
    fail('submitDoubt', err);
    return { ok: false };
  }
}

/**
 * "This didn't answer my question." Puts the doubt back in front of Sunil.
 *
 * This replaces an earlier `escalateDoubt` that re-ran the question through a
 * larger model. Escalation in this system means a human, always — a second
 * machine opinion is the same failure as the first, with more tokens.
 */
export async function sendToSunil(id: string, learnerId: string): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client
      .from('doubts')
      .update({ status: 'new' })
      .eq('id', id)
      // Scoped to the owner so one learner cannot reopen another's doubt.
      .eq('learner_id', learnerId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('sendToSunil', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listDoubts(learnerId?: string): Promise<Doubt[]> {
  const client = db();
  if (!client) return [];

  try {
    let query = client.from('doubts').select('*').order('created_at', { ascending: false });
    if (learnerId) query = query.eq('learner_id', learnerId);

    const { data, error } = await query;
    if (error) throw error;
    return (data as Doubt[]) ?? [];
  } catch (err) {
    fail('listDoubts', err);
    return [];
  }
}

export async function listAllDoubtsWithLearner(): Promise<DoubtWithLearner[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('doubts')
      .select('*, learners(name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      ...row,
      learner_name: row.learners?.name ?? null,
      learner_email: row.learners?.email ?? '',
    })) as DoubtWithLearner[];
  } catch (err) {
    fail('listAllDoubtsWithLearner', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Clustering — Sunil's half of the feature
// ---------------------------------------------------------------------------

export interface DoubtCluster {
  /** The model's theme label, or the capability id, or 'Untagged'. */
  label: string;
  capability_id: string | null;
  doubts: DoubtWithLearner[];
  /** Distinct learners, not distinct doubts — "five people" is the useful count. */
  learners: number;
  open: number;
  latest: string;
}

/**
 * Group content doubts so the inbox says "five people are circling the same
 * confusion about evals" rather than listing fifteen rows by date.
 *
 * Counting is code, per §4. The model supplied the labels and nothing else.
 */
export function clusterDoubts(rows: DoubtWithLearner[]): DoubtCluster[] {
  const groups = new Map<string, DoubtCluster>();

  for (const d of rows.filter((r) => r.kind === 'content')) {
    const label = d.cluster_id?.trim() || d.capability_id || 'Untagged';
    const key = label.toLowerCase();

    let g = groups.get(key);
    if (!g) {
      g = {
        label,
        capability_id: d.capability_id,
        doubts: [],
        learners: 0,
        open: 0,
        latest: d.created_at,
      };
      groups.set(key, g);
    }
    g.doubts.push(d);
    if (d.status !== 'answered') g.open += 1;
    if (d.created_at > g.latest) g.latest = d.created_at;
  }

  for (const g of groups.values()) {
    g.learners = new Set(g.doubts.map((d) => d.learner_id)).size;
  }

  // Most people first, then most recent — the order Sunil needs on a Wednesday.
  return [...groups.values()].sort(
    (a, b) => b.learners - a.learners || b.latest.localeCompare(a.latest),
  );
}

// ---------------------------------------------------------------------------
// Writes from the console
// ---------------------------------------------------------------------------

export async function updateDoubtStatus(id: string, status: DoubtStatus): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client.from('doubts').update({ status }).eq('id', id);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('updateDoubtStatus', err);
    return { ok: false };
  }
}

/**
 * Sunil's own answer. Stored with `answer_source: 'sunil'`, which is what makes
 * it eligible for relay to the next person who asks the same thing.
 */
export async function answerDoubtAsSunil(id: string, answer: string): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  const text = answer.trim();
  if (!text) return { ok: false };

  try {
    const { error } = await client
      .from('doubts')
      .update({ answer: text, answer_source: 'sunil', status: 'answered' })
      .eq('id', id);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('answerDoubtAsSunil', err);
    return { ok: false };
  }
}
