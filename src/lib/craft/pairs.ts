// The pair draft, and the pair that reviews it.
//
// ---------------------------------------------------------------------------
// TWO OBJECTS, NOT ONE
// ---------------------------------------------------------------------------
// Week 1 writes a decision record in pairs at 03:50, has ANOTHER pair review it
// at 04:05, and then asks each person to finish THEIR OWN at home. So there are
// two artefacts with two lifespans:
//
//   pair draft   two names, fifteen minutes, reviewed ten minutes later, and
//                never read again after the session.
//   submission   one name, finished alone, read by Sunil as a set of eight, and
//                "the artefact of this cohort" a year later.
//
// Folding them together — having the pair write into one learner's submission —
// would make two people's records start identical. That ruins Sunil's read of
// eight and quietly makes the claim about the artefact false.
//
// Both use the SAME SEVEN SECTIONS (src/lib/craft/adr.ts), because §5.5's rule
// is that the template never varies. What varies is who wrote it and how long
// they had.
//
// ---------------------------------------------------------------------------
// THE NUMBERS ARE NOT A SCORE, AND NOTHING HERE AGGREGATES THEM
// ---------------------------------------------------------------------------
// The review carries a 0/1/2 per question alongside a comment. This is the only
// place in the programme a number lands on somebody's work, and week 1 is
// explicit about what it is for: "the written comment matters more than the
// number, and there is no assessment behind this. It exists to make ten minutes
// of review structured enough to finish."
//
// So: no sum, no mean, no percentage, and no name in a ranked list — anywhere,
// ever. §10 cut learner-facing levels and ranks and that cut still holds. If a
// function in this file ever returns a total, it is the cut feature returning
// under a new name.
//
// ---------------------------------------------------------------------------
// PAIRING IS A THING SUNIL DOES IN THE ROOM
// ---------------------------------------------------------------------------
// He pairs on how the day is going — who is stuck, who is quiet, who argued with
// whom. The app only records what he decided: the learner names their partner
// and picks the draft they were given. There is deliberately no computed
// rotation; it cannot see the room and it breaks when somebody is absent.

import { db } from '../admin/supabase';

const fail = (where: string, err: unknown) => {
  console.error(`pairs ${where} failed:`, err instanceof Error ? err.message : err);
};

export interface PairDraft {
  id: string;
  week: number;
  author_id: string;
  partner_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

/** A draft with the names attached, for a picker or for Sunil's read. */
export interface PairDraftWithNames extends PairDraft {
  author_name: string | null;
  partner_name: string | null;
}

/** One reviewer's answers to the four questions. */
export type ReviewAnswers = Record<string, { score: number; comment: string }>;

export interface PairReview {
  id: string;
  draft_id: string;
  reviewer_id: string;
  answers: ReviewAnswers;
  created_at: string;
  updated_at: string;
}

const DRAFTS = 'pair_drafts';
const REVIEWS = 'pair_reviews';

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

export async function myDraft(learnerId: string, week: number): Promise<PairDraft | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(DRAFTS)
      .select('*')
      .eq('author_id', learnerId)
      .eq('week', week)
      .maybeSingle();
    if (error) throw error;
    return (data as PairDraft) ?? null;
  } catch (err) {
    fail('myDraft', err);
    return null;
  }
}

export async function saveDraft(
  learnerId: string,
  week: number,
  partnerId: string | null,
  body: string,
): Promise<{ ok: boolean; id?: string }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { data, error } = await client
      .from(DRAFTS)
      .upsert(
        {
          author_id: learnerId,
          week,
          partner_id: partnerId,
          body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'author_id,week' },
      )
      .select('id')
      .single();
    if (error) throw error;
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    fail('saveDraft', err);
    return { ok: false };
  }
}

/**
 * Every draft for a week except the learner's own and their partner's.
 *
 * The exclusion is the point: you review ANOTHER pair's, and offering your own
 * back in the picker is how somebody reviews themselves at 04:05 with nine
 * minutes left and no time to notice.
 */
export async function draftsToReview(
  learnerId: string,
  week: number,
): Promise<PairDraftWithNames[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from(DRAFTS)
      .select('*, author:learners!pair_drafts_author_id_fkey(name), partner:learners!pair_drafts_partner_id_fkey(name)')
      .eq('week', week)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return ((data ?? []) as any[])
      .filter((d) => d.author_id !== learnerId && d.partner_id !== learnerId)
      .map((d) => ({
        ...(d as PairDraft),
        author_name: d.author?.name ?? null,
        partner_name: d.partner?.name ?? null,
      }));
  } catch (err) {
    fail('draftsToReview', err);
    return [];
  }
}

/** Every draft for a week, with names. Sunil's read. */
export async function allDrafts(week?: number): Promise<PairDraftWithNames[]> {
  const client = db();
  if (!client) return [];

  try {
    let q = client
      .from(DRAFTS)
      .select('*, author:learners!pair_drafts_author_id_fkey(name), partner:learners!pair_drafts_partner_id_fkey(name)');
    if (typeof week === 'number') q = q.eq('week', week);
    const { data, error } = await q.order('week', { ascending: false });
    if (error) throw error;

    return ((data ?? []) as any[]).map((d) => ({
      ...(d as PairDraft),
      author_name: d.author?.name ?? null,
      partner_name: d.partner?.name ?? null,
    }));
  } catch (err) {
    fail('allDrafts', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/**
 * Every review of a week, for the console's read.
 *
 * The symmetric partner of allDrafts(). reviewsOf() answers "who reviewed this
 * one" and is the right shape inside the pair surface; asking it once per draft
 * from a page listing six weeks is six round trips to count a number.
 *
 * Note what this does NOT return: a total. The scores are 0/1/2 beside a
 * comment and nothing sums them — a function here that returned a total would
 be §10's cut feature (levels, scores, ranks) coming back under a new name.
 */
export async function allReviews(week?: number): Promise<PairReview[]> {
  const client = db();
  if (!client) return [];

  try {
    // The review row carries no week of its own — it belongs to a draft, and the
    // draft is what a week owns. So a week filter is a filter on the draft.
    let q = client.from(REVIEWS).select("*, draft:pair_drafts!inner(week)");
    if (typeof week === 'number') q = q.eq('draft.week', week);
    const { data, error } = await q;
    if (error) throw error;
    return ((data ?? []) as any[]).map(({ draft: _draft, ...r }) => r as PairReview);
  } catch (err) {
    fail('allReviews', err);
    return [];
  }
}

export async function reviewsOf(draftId: string): Promise<PairReview[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client.from(REVIEWS).select('*').eq('draft_id', draftId);
    if (error) throw error;
    return (data as PairReview[]) ?? [];
  } catch (err) {
    fail('reviewsOf', err);
    return [];
  }
}

export async function myReview(
  draftId: string,
  reviewerId: string,
): Promise<PairReview | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(REVIEWS)
      .select('*')
      .eq('draft_id', draftId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();
    if (error) throw error;
    return (data as PairReview) ?? null;
  } catch (err) {
    fail('myReview', err);
    return null;
  }
}

/**
 * Save one reviewer's four answers.
 *
 * A score outside 0–2 is clamped rather than rejected: this is submitted from a
 * live room with nine minutes left, and losing four written comments to a
 * validation error would cost far more than a coerced number. The comment is the
 * part that matters, and it is never touched.
 */
export async function saveReview(
  draftId: string,
  reviewerId: string,
  answers: ReviewAnswers,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  const clean: ReviewAnswers = {};
  for (const [id, a] of Object.entries(answers)) {
    const score = Number(a?.score);
    clean[id] = {
      score: Number.isFinite(score) ? Math.min(2, Math.max(0, Math.round(score))) : 0,
      comment: typeof a?.comment === 'string' ? a.comment.trim().slice(0, 2000) : '',
    };
  }

  try {
    const { error } = await client.from(REVIEWS).upsert(
      {
        draft_id: draftId,
        reviewer_id: reviewerId,
        answers: clean,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'draft_id,reviewer_id' },
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('saveReview', err);
    return { ok: false };
  }
}
