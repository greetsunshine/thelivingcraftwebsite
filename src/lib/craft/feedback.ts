import { db } from '../admin/supabase';

// FOUR QUESTIONS, TWO JOBS.
//
// `landed` and `pacing` are about the SESSION — spec §5.3, and the pair that
// makes "what to change before Thursday" possible at all. `changing` and
// `unsure` are the two lines week 1 actually closes on, and they are about the
// LEARNER: a commitment and a doubt.
//
// `unsure` is the interesting one, and it mostly does not live here. Week 1 says
// "the second line is the one that matters — it sets what week 2 opens with",
// and the spec already knew what it was: "'Unsure about' is the cheapest input
// to the doubts inbox, it surfaces what a senior engineer will not ask out
// loud". So it opens a forum thread, where another learner can answer it before
// Sunil gets there. The column is a fallback for a failed forum write, not the
// destination.
export interface Feedback {
  id: string;
  learner_id: string;
  week: number;
  landed: string;
  pacing: string;
  /** "The one thing I will change in my own build this week is ___" */
  changing?: string | null;
  /** Only set when the forum write failed. See submitFeedback(). */
  unsure?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackWithLearner extends Feedback {
  learner_name: string | null;
  learner_email: string;
}

const fail = (where: string, err: unknown) => {
  console.error(`feedback ${where} failed:`, err instanceof Error ? err.message : err);
};

export interface FeedbackInput {
  landed: string;
  pacing: string;
  changing?: string;
  /** Routed to the forum, not stored — see the note on Feedback. */
  unsure?: string;
}

export interface FeedbackResult {
  ok: boolean;
  /** The thread the doubt opened, when it opened one. */
  threadId?: string;
  /** True when the doubt was kept here because the forum write failed. */
  keptLocally?: boolean;
}

/**
 * Save the close.
 *
 * The doubt is handed to `openDoubt` — injected rather than imported, so this
 * module does not depend on the forum and the forum does not depend on this.
 * If that write fails the text is kept in the `unsure` column instead of being
 * dropped: a learner who typed a real doubt at 04:56 should not lose it to a
 * database hiccup, and a row with `unsure` set is a visible delivery failure
 * rather than a silent one.
 */
export async function submitFeedback(
  learnerId: string,
  week: number,
  input: FeedbackInput,
  openDoubt?: (body: string) => Promise<string | null>,
): Promise<FeedbackResult> {
  const client = db();
  if (!client) return { ok: false };

  const doubt = (input.unsure ?? '').trim();
  let threadId: string | null = null;

  if (doubt && openDoubt) {
    try {
      threadId = await openDoubt(doubt);
    } catch (err) {
      fail('submitFeedback/openDoubt', err);
    }
  }

  try {
    const { error } = await client.from('feedback').upsert(
      {
        learner_id: learnerId,
        week,
        landed: input.landed.trim(),
        pacing: input.pacing.trim(),
        changing: (input.changing ?? '').trim() || null,
        // Null once it is safely a thread. Set only when it is not.
        unsure: doubt && !threadId ? doubt : null,
      },
      { onConflict: 'learner_id, week' }
    );
    if (error) throw error;
    return {
      ok: true,
      threadId: threadId ?? undefined,
      keptLocally: Boolean(doubt) && !threadId,
    };
  } catch (err) {
    fail('submitFeedback', err);
    return { ok: false };
  }
}

export async function listLearnerFeedback(learnerId: string): Promise<Feedback[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('feedback')
      .select('*')
      .eq('learner_id', learnerId)
      .order('week', { ascending: true });
      
    if (error) throw error;
    return (data as Feedback[]) ?? [];
  } catch (err) {
    fail('listLearnerFeedback', err);
    return [];
  }
}

export async function listAllFeedbackWithLearner(): Promise<FeedbackWithLearner[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('feedback')
      .select('*, learners(name, email)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      ...row,
      learner_name: row.learners?.name ?? null,
      learner_email: row.learners?.email ?? '',
    })) as FeedbackWithLearner[];
  } catch (err) {
    fail('listAllFeedbackWithLearner', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Closing the loop (spec §5.3)
// ---------------------------------------------------------------------------
//
// "You said the drill was rushed — week 4 gives it twenty more minutes."
//
// The spec is blunt that this line IS the feature: without a visible change,
// response rates collapse by week 3 and the form becomes theatre. Sunil's
// synthesis tells him what to change; this is the half that tells the room he
// changed it.
//
// One row per week, written by Sunil, read by everyone. Drafts stay invisible —
// a half-written promise is worse than silence.

export interface FeedbackResponse {
  id: string;
  week: number;
  body: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Published only. This is what a learner sees. */
export async function listPublishedResponses(): Promise<FeedbackResponse[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('feedback_responses')
      .select('*')
      .not('published_at', 'is', null)
      .order('week', { ascending: false });
    if (error) throw error;
    return (data as FeedbackResponse[]) ?? [];
  } catch (err) {
    fail('listPublishedResponses', err);
    return [];
  }
}

/** Drafts included. Console only. */
export async function listAllResponses(): Promise<FeedbackResponse[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('feedback_responses')
      .select('*')
      .order('week', { ascending: false });
    if (error) throw error;
    return (data as FeedbackResponse[]) ?? [];
  } catch (err) {
    fail('listAllResponses', err);
    return [];
  }
}

export async function saveFeedbackResponse(
  week: number,
  body: string,
  publish: boolean,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  const text = body.trim();
  if (!text) return { ok: false };

  try {
    // Publishing is a one-way door in the sense that matters: the timestamp is
    // set once and kept, so editing a published note does not silently re-date
    // it and make an old promise look new.
    const existing = await client
      .from('feedback_responses')
      .select('published_at')
      .eq('week', week)
      .maybeSingle();

    const publishedAt = publish
      ? (existing.data?.published_at ?? new Date().toISOString())
      : (existing.data?.published_at ?? null);

    const { error } = await client.from('feedback_responses').upsert(
      { week, body: text, published_at: publishedAt },
      { onConflict: 'week' },
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('saveFeedbackResponse', err);
    return { ok: false };
  }
}
