// The cohort discussion forum — threads, replies, and who is allowed to sound
// authoritative.
//
// NAMING. The product noun is "discussion". The Postgres table is still
// `doubts`, because this surface grew out of a private learner→Sunil inbox and
// renaming a live table buys nothing a reader can see. This file is the only
// place that has to hold both names in its head; everything above it says
// thread and reply.
//
// ---------------------------------------------------------------------------
// THE RULE THIS FILE EXISTS TO ENFORCE
// ---------------------------------------------------------------------------
//
// Spec §5.1 said content questions are "never answered with a fresh opinion".
// That was written about a MODEL, and an earlier version of this file broke it
// by running a generic "helpful AI tutor" prompt and showing the result to the
// learner as an "Automated Answer" — an improvised answer arriving with the
// authority of the course, while Sunil never learned the question was asked.
//
// Opening this up to peers does not repeal that rule. It changes who can break
// it. A confident, wrong answer from the person sitting next to you is the same
// failure with a friendlier face, and in a course whose entire positioning is
// engineering JUDGEMENT it is the expensive one. So the rule survives as a
// structural distinction rather than a prohibition:
//
//   'system'     — code, quoting facts.ts or session frontmatter verbatim.
//                  Logistics only. Never a model, never prose it composed.
//   'learner'    — a peer. Shown with their name, and never relayed to anyone.
//   'instructor' — Sunil. The only voice that carries the course's authority,
//                  and the ONLY text eligible for relay (see relayApprovedAnswer).
//
// And two marks that must never be merged into one "accepted answer":
//
//   resolved  — the ASKER says it unblocked them. A report, not a verdict.
//   endorsed  — SUNIL says it is right. The verdict, and only he can give it.
//
// A peer answer marked "this solved it" by a grateful asker is exactly the
// artefact that must not be able to graduate into something the machine repeats
// to the next person as fact. It cannot, because relay filters on author_role.
//
// ESCALATION IS STILL A SUCCESS. A thread nobody grounded and nobody answered
// goes to Sunil and says so. If nothing ever reaches him, this file is
// overstepping.

import { db } from '../admin/supabase';
import { TECHNICAL, LEADERSHIP } from './intake';
import { searchKnowledge, tokenize, stem, score } from '../agent/knowledge';
import { hasAssignment } from './assignments';
import Anthropic from '@anthropic-ai/sdk';

/** Tagging and clustering only. Never used to write an answer. */
const CLASSIFIER_MODEL = 'claude-haiku-4-5-20251001';

export type ThreadKind = 'course' | 'content';
export type ThreadStatus = 'new' | 'routed' | 'answered';
export type ThreadVisibility = 'cohort' | 'private';
export type AuthorRole = 'learner' | 'instructor' | 'system';

/**
 * Where a grounded answer came from. A learner should never have to guess
 * whether they are reading the syllabus or Sunil.
 */
export type AnswerSource = 'facts' | 'session' | 'relay' | 'sunil';

export interface Thread {
  id: string;
  learner_id: string;
  title: string | null;
  body: string;
  kind: ThreadKind;
  visibility: ThreadVisibility;
  capability_id: string | null;
  cluster_id: string | null;
  answer: string | null;
  answer_source: AnswerSource | null;
  status: ThreadStatus;
  pinned: boolean;
  resolved_reply_id: string | null;
  endorsed_reply_id: string | null;
  created_at: string;
}

export interface Reply {
  id: string;
  doubt_id: string;
  learner_id: string | null;
  author_role: AuthorRole;
  body: string;
  created_at: string;
  /** Joined for display. Null for instructor and system rows. */
  author_name?: string | null;
}

export interface ThreadWithLearner extends Thread {
  learner_name: string | null;
  learner_email: string;
}

/** A thread plus everything needed to render a forum row without a second query. */
export interface ThreadSummary extends ThreadWithLearner {
  reply_count: number;
  /** True when Sunil has replied on it. Drives the "answered by Sunil" filter. */
  instructor_replied: boolean;
  last_activity: string;
}

/**
 * The session facts a course thread may be answered from. Passed in by the API
 * route rather than imported, so this module stays clear of `astro:content`.
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
  console.error(`discussion ${where} failed:`, err instanceof Error ? err.message : err);
};

const apiKey = (): string | undefined =>
  // @ts-ignore — import.meta.env on Vercel, process.env under scripts
  (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.ANTHROPIC_API_KEY : undefined) ??
  process.env.ANTHROPIC_API_KEY;

/** Long enough for a real explanation, short enough to stay a forum post. */
export const REPLY_MAX_CHARS = 4000;
export const BODY_MAX_CHARS = 6000;
export const TITLE_MAX_CHARS = 140;

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
  if (hasAssignment(s)) parts.push(`Assignment: ${s.assignment!.trim()}.`);
  if (s.taughtOn) parts.push(`Taught on ${s.taughtOn}.`);
  else if (s.status === 'draft') parts.push('This session is still being written.');
  return parts.join(' ');
}

/**
 * Answer a course thread from the two grounded sources the spec allows, and
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
 * Relay an answer Sunil has already given to the same question.
 *
 * TWO FILTERS DO THE SAFETY WORK HERE, and both matter:
 *   - author_role = 'instructor' on the reply, so a peer's answer can never be
 *     relayed no matter how many people marked it as having solved their problem;
 *   - verbatim return, so his words are repeated with a citation and never
 *     extended, summarised, or blended with a second answer.
 */
export async function relayApprovedAnswer(body: string): Promise<GroundedAnswer | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('discussion_replies')
      .select('body, created_at, doubts(body)')
      .eq('author_role', 'instructor')
      .order('created_at', { ascending: false })
      .limit(60);
    if (error) throw error;

    const q = tokenize(body).map(stem);
    if (q.length === 0) return null;

    // Matched against the QUESTION that drew the answer, not the answer itself:
    // "how do I make this idempotent" should find the thread that asked that,
    // not every reply that happens to use the word.
    let best: { row: any; n: number } | null = null;
    for (const row of data ?? []) {
      const asked = (row as any).doubts?.body;
      if (!asked) continue;
      const n = score(q, asked, 3);
      if (n >= MIN_SCORE + 2 && (!best || n > best.n)) best = { row, n };
    }
    if (!best) return null;

    const when = new Date(best.row.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
    });
    return {
      answer: `${best.row.body}\n\n*Sunil answered this on ${when}. Post below if your question is different.*`,
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
 * Tag a content thread to a capability and give its theme a short label, so
 * Sunil's console groups instead of listing. Returns nulls on any failure: an
 * untagged thread still reaches him, which is the outcome that matters.
 */
async function classifyThread(
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
    fail('classifyThread', err);
    return { capability_id: null, cluster_id: null };
  }
}

// ---------------------------------------------------------------------------
// Posting a thread
// ---------------------------------------------------------------------------

export interface PostResult {
  ok: boolean;
  id?: string;
  answer?: string;
  answerSource?: AnswerSource;
  /** True when nothing grounded answered it and it is now open to the room. */
  escalated?: boolean;
}

export async function postThread(
  learnerId: string,
  body: string,
  kind: ThreadKind,
  visibility: ThreadVisibility = 'cohort',
  title: string | null = null,
  sessions: SessionFact[] = [],
): Promise<PostResult> {
  const client = db();
  if (!client) return { ok: false };

  let capability_id: string | null = null;
  let cluster_id: string | null = null;
  let grounded: GroundedAnswer | null = null;

  if (kind === 'course') {
    // The safe half. Answerable from the syllabus or it goes to the room.
    grounded = answerFromGround(body, sessions);
  } else {
    // The risky half. Tagged and clustered so Sunil's console groups, and
    // relayed ONLY if he has already answered this exact question.
    ({ capability_id, cluster_id } = await classifyThread(body));
    grounded = await relayApprovedAnswer(body);
  }

  try {
    const { data, error } = await client
      .from('doubts')
      .insert({
        learner_id: learnerId,
        title: title?.trim().slice(0, TITLE_MAX_CHARS) || null,
        body: body.trim().slice(0, BODY_MAX_CHARS),
        kind,
        visibility,
        capability_id,
        cluster_id,
        answer: grounded?.answer ?? null,
        answer_source: grounded?.source ?? null,
        status: grounded ? 'answered' : 'new',
      })
      .select('id')
      .single();

    if (error) throw error;

    // The grounded answer is written into the thread as a reply too, so a
    // thread page is the whole conversation rather than a special case with an
    // answer bolted above the replies.
    if (grounded) {
      await client.from('discussion_replies').insert({
        doubt_id: data.id,
        learner_id: null,
        author_role: 'system',
        body: grounded.answer,
      });
    }

    return {
      ok: true,
      id: data.id,
      answer: grounded?.answer,
      answerSource: grounded?.source,
      escalated: !grounded,
    };
  } catch (err) {
    fail('postThread', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Replying
// ---------------------------------------------------------------------------

/**
 * A peer reply. Always author_role 'learner' — a learner-facing route can never
 * mint an instructor reply, which is why the role is set here and not taken
 * from the request.
 */
export async function replyAsLearner(
  threadId: string,
  learnerId: string,
  body: string,
): Promise<{ ok: boolean; id?: string }> {
  const client = db();
  if (!client) return { ok: false };

  const text = body.trim();
  if (!text) return { ok: false };

  try {
    // A private thread is between one learner and Sunil. Nobody else may post
    // into it, and the check is here rather than in the page so a hand-rolled
    // POST cannot get around it.
    const { data: thread, error: readErr } = await client
      .from('doubts')
      .select('visibility, learner_id')
      .eq('id', threadId)
      .single();
    if (readErr) throw readErr;
    if (thread.visibility === 'private' && thread.learner_id !== learnerId) {
      return { ok: false };
    }

    const { data, error } = await client
      .from('discussion_replies')
      .insert({
        doubt_id: threadId,
        learner_id: learnerId,
        author_role: 'learner',
        body: text.slice(0, REPLY_MAX_CHARS),
      })
      .select('id')
      .single();
    if (error) throw error;
    return { ok: true, id: data.id };
  } catch (err) {
    fail('replyAsLearner', err);
    return { ok: false };
  }
}

/**
 * Sunil's reply. Reachable only from the console, which the middleware gates on
 * the admin password — that is what makes 'instructor' trustworthy enough to be
 * the one role eligible for relay.
 */
export async function replyAsInstructor(
  threadId: string,
  body: string,
): Promise<{ ok: boolean; id?: string }> {
  const client = db();
  if (!client) return { ok: false };

  const text = body.trim();
  if (!text) return { ok: false };

  try {
    const { data, error } = await client
      .from('discussion_replies')
      .insert({
        doubt_id: threadId,
        learner_id: null,
        author_role: 'instructor',
        body: text.slice(0, REPLY_MAX_CHARS),
      })
      .select('id')
      .single();
    if (error) throw error;

    // His answer closes the thread's "waiting on Sunil" state. Kept in step
    // here so the console's counts and the learner's badge cannot disagree.
    await client
      .from('doubts')
      .update({ status: 'answered', answer: text, answer_source: 'sunil' })
      .eq('id', threadId);

    return { ok: true, id: data.id };
  } catch (err) {
    fail('replyAsInstructor', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// The two marks
// ---------------------------------------------------------------------------

/**
 * "This solved it." The asker's own report, so it is scoped to the asker — one
 * learner cannot mark a reply on someone else's thread.
 *
 * Passing null clears it, because people change their minds when the answer
 * turns out to be wrong two days later.
 */
export async function markResolved(
  threadId: string,
  learnerId: string,
  replyId: string | null,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client
      .from('doubts')
      .update({ resolved_reply_id: replyId })
      .eq('id', threadId)
      .eq('learner_id', learnerId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('markResolved', err);
    return { ok: false };
  }
}

/** "This is right." Sunil only — the console route is the only caller. */
export async function markEndorsed(
  threadId: string,
  replyId: string | null,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client
      .from('doubts')
      .update({ endorsed_reply_id: replyId })
      .eq('id', threadId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('markEndorsed', err);
    return { ok: false };
  }
}

export async function setPinned(threadId: string, pinned: boolean): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client.from('doubts').update({ pinned }).eq('id', threadId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('setPinned', err);
    return { ok: false };
  }
}

/**
 * "Sunil, could you look at this?" Puts a thread the room could not settle back
 * in front of him.
 *
 * Escalation in this system means a human, always — a second machine opinion is
 * the same failure as the first, with more tokens.
 */
export async function askSunil(threadId: string, learnerId: string): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client
      .from('doubts')
      .update({ status: 'new' })
      .eq('id', threadId)
      // Scoped to the owner so one learner cannot reopen another's thread.
      .eq('learner_id', learnerId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('askSunil', err);
    return { ok: false };
  }
}

export async function updateThreadStatus(
  threadId: string,
  status: ThreadStatus,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client.from('doubts').update({ status }).eq('id', threadId);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('updateThreadStatus', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * The forum index, from one learner's point of view: every cohort thread, plus
 * their own private ones, and nobody else's private ones.
 *
 * The visibility filter is applied in the QUERY rather than after it. Fetching
 * everything and hiding some of it in the template is one forgotten `.filter()`
 * away from showing the room a private message.
 */
export async function listThreads(viewerId: string): Promise<ThreadSummary[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('doubts')
      .select('*, learners(name, email), discussion_replies(id, author_role, created_at)')
      .or(`visibility.eq.cohort,learner_id.eq.${viewerId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map(shapeSummary);
  } catch (err) {
    fail('listThreads', err);
    return [];
  }
}

/** One thread, with the same visibility rule applied. Null when not allowed. */
export async function getThread(
  threadId: string,
  viewerId: string,
): Promise<{ thread: ThreadWithLearner; replies: Reply[] } | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('doubts')
      .select('*, learners(name, email)')
      .eq('id', threadId)
      .single();
    if (error) throw error;
    if (!data) return null;

    const thread = {
      ...data,
      learner_name: (data as any).learners?.name ?? null,
      learner_email: (data as any).learners?.email ?? '',
    } as ThreadWithLearner;

    // Same rule as the list, restated because a direct URL is a second door.
    if (thread.visibility === 'private' && thread.learner_id !== viewerId) return null;

    return { thread, replies: await listReplies(threadId) };
  } catch (err) {
    fail('getThread', err);
    return null;
  }
}

export async function listReplies(threadId: string): Promise<Reply[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('discussion_replies')
      .select('*, learners(name, email)')
      .eq('doubt_id', threadId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      ...row,
      author_name: row.learners?.name ?? row.learners?.email ?? null,
    })) as Reply[];
  } catch (err) {
    fail('listReplies', err);
    return [];
  }
}

/**
 * Every reply in the cohort, grouped by thread. One query for the console,
 * because the page it feeds needs the bodies of forty replies at once and
 * forty round-trips to render one screen is how a console gets abandoned.
 */
export async function repliesByThread(): Promise<Map<string, Reply[]>> {
  const client = db();
  const out = new Map<string, Reply[]>();
  if (!client) return out;

  try {
    const { data, error } = await client
      .from('discussion_replies')
      .select('*, learners(name, email)')
      .order('created_at', { ascending: true });
    if (error) throw error;

    for (const row of (data ?? []) as any[]) {
      const reply: Reply = {
        ...row,
        author_name: row.learners?.name ?? row.learners?.email ?? null,
      };
      const list = out.get(reply.doubt_id);
      if (list) list.push(reply);
      else out.set(reply.doubt_id, [reply]);
    }
    return out;
  } catch (err) {
    fail('repliesByThread', err);
    return out;
  }
}

/**
 * The queue that matters most on this surface: the room answered, and nobody
 * with authority has checked whether the answer is right.
 *
 * A peer answer that goes uncorrected becomes the cohort's working belief. This
 * is the cost of opening questions up to the room, and surfacing it is how the
 * cost is paid rather than ignored.
 */
export function needsReview(t: ThreadSummary, replies: Reply[]): boolean {
  if (t.instructor_replied) return false;
  if (t.endorsed_reply_id) return false;
  return replies.some((r) => r.author_role === 'learner');
}

/** Sunil's view: everything, including private threads. */
export async function listAllThreads(): Promise<ThreadSummary[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('doubts')
      .select('*, learners(name, email), discussion_replies(id, author_role, created_at)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map(shapeSummary);
  } catch (err) {
    fail('listAllThreads', err);
    return [];
  }
}

function shapeSummary(row: any): ThreadSummary {
  const replies = (row.discussion_replies ?? []) as {
    id: string;
    author_role: AuthorRole;
    created_at: string;
  }[];

  // Counting is code, per §4. Peers and Sunil count; the syllabus relay does
  // not — "3 replies" should mean three people spoke.
  const human = replies.filter((r) => r.author_role !== 'system');
  const last = replies.reduce<string>(
    (acc, r) => (r.created_at > acc ? r.created_at : acc),
    row.created_at,
  );

  return {
    ...row,
    learner_name: row.learners?.name ?? null,
    learner_email: row.learners?.email ?? '',
    reply_count: human.length,
    instructor_replied: replies.some((r) => r.author_role === 'instructor'),
    last_activity: last,
  };
}

/**
 * Threads still waiting on somebody. Drives the dashboard count and the "needs
 * an answer" filter: nobody has replied and the syllabus did not settle it.
 */
export function isUnanswered(t: ThreadSummary): boolean {
  return t.reply_count === 0 && t.status !== 'answered';
}

// ---------------------------------------------------------------------------
// Clustering — Sunil's half of the feature
// ---------------------------------------------------------------------------

export interface ThreadCluster {
  /** The model's theme label, or the capability id, or 'Untagged'. */
  label: string;
  capability_id: string | null;
  threads: ThreadSummary[];
  /** Distinct learners, not distinct threads — "five people" is the useful count. */
  learners: number;
  open: number;
  latest: string;
}

/**
 * Group content threads so the console says "five people are circling the same
 * confusion about evals, and it is Wednesday" rather than listing fifteen rows
 * by date.
 *
 * Counting is code, per §4. The model supplied the labels and nothing else.
 */
export function clusterThreads(rows: ThreadSummary[]): ThreadCluster[] {
  const groups = new Map<string, ThreadCluster>();

  for (const t of rows.filter((r) => r.kind === 'content')) {
    const label = t.cluster_id?.trim() || t.capability_id || 'Untagged';
    const key = label.toLowerCase();

    let g = groups.get(key);
    if (!g) {
      g = {
        label,
        capability_id: t.capability_id,
        threads: [],
        learners: 0,
        open: 0,
        latest: t.created_at,
      };
      groups.set(key, g);
    }
    g.threads.push(t);
    if (t.status !== 'answered') g.open += 1;
    if (t.last_activity > g.latest) g.latest = t.last_activity;
  }

  for (const g of groups.values()) {
    g.learners = new Set(g.threads.map((t) => t.learner_id)).size;
  }

  // Most people first, then most recent — the order Sunil needs on a Wednesday.
  return [...groups.values()].sort(
    (a, b) => b.learners - a.learners || b.latest.localeCompare(a.latest),
  );
}

// ---------------------------------------------------------------------------
// Back-compat for the familiarity page
// ---------------------------------------------------------------------------

/**
 * Kept because /craft/admin/familiarity counts questions per learner per
 * capability for its say-vs-show comparison, and wants rows rather than
 * threads with reply counts hanging off them.
 */
export interface ThreadWithLearnerRow extends ThreadWithLearner {}

export async function listAllThreadsWithLearner(): Promise<ThreadWithLearnerRow[]> {
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
    })) as ThreadWithLearnerRow[];
  } catch (err) {
    fail('listAllThreadsWithLearner', err);
    return [];
  }
}
