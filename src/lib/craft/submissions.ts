// ADR submissions.
//
// A SUBMITTED ADR IS A SNAPSHOT (spec §5.5). Sunil reads eight of these in a
// week and compares week 6 against week 1; if the text can change under him
// after he has read it, the comparison is against a moving target and the
// "did the ADR match the quiz answer" check compares a decision to a rewrite.
//
// So there are two states and the transition is one-way for the learner:
//   draft     — saved, editable, invisible on the room views
//   submitted — frozen text, timestamped, what Sunil reads
//
// Unfreezing is deliberately not a learner action. If someone needs a correction
// after submitting, that is a conversation with Sunil, which is the right amount
// of friction for eight people.

import { db } from '../admin/supabase';

export type SubmissionStatus = 'draft' | 'submitted';

export interface Submission {
  id: string;
  learner_id: string;
  week: number;
  adr_markdown: string;
  repo_url: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  updated_at: string;
}

export interface SubmissionWithLearner extends Submission {
  learner_name: string | null;
  learner_email: string;
}

/**
 * One page, capped (spec §5.5). The cap is a feature: it forces a choice about
 * what matters and makes reading eight a week possible. ~6000 characters is a
 * dense printed page — generous for the five sections, far short of an essay.
 */
export const ADR_MAX_CHARS = 6000;

export interface SaveResult {
  ok: boolean;
  /** Set when the save was refused rather than failed, so the UI can explain. */
  reason?: 'locked' | 'too-long' | 'empty';
}

const fail = (where: string, err: unknown) => {
  console.error(`submissions ${where} failed:`, err instanceof Error ? err.message : err);
};

export async function saveAdr(
  learnerId: string,
  week: number,
  markdown: string,
  repoUrl: string | undefined,
  submit: boolean,
): Promise<SaveResult> {
  const client = db();
  if (!client) return { ok: false };

  const text = markdown.trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (text.length > ADR_MAX_CHARS) return { ok: false, reason: 'too-long' };

  // Read before write: a submitted ADR is frozen, and the check belongs here
  // rather than in a page, so no second caller can bypass it.
  const existing = await getSubmission(learnerId, week);
  if (existing?.status === 'submitted') return { ok: false, reason: 'locked' };

  try {
    const { error } = await client.from('submissions').upsert(
      {
        learner_id: learnerId,
        week,
        adr_markdown: text,
        repo_url: repoUrl?.trim() || null,
        status: submit ? 'submitted' : 'draft',
        submitted_at: submit ? new Date().toISOString() : null,
      },
      { onConflict: 'learner_id, week' },
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('saveAdr', err);
    return { ok: false };
  }
}

export async function getSubmission(learnerId: string, week: number): Promise<Submission | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('submissions')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('week', week)
      .maybeSingle();

    if (error) throw error;
    return (data as Submission) ?? null;
  } catch (err) {
    fail('getSubmission', err);
    return null;
  }
}

export async function listLearnerSubmissions(learnerId: string): Promise<Submission[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('submissions')
      .select('*')
      .eq('learner_id', learnerId)
      .order('week', { ascending: true });

    if (error) throw error;
    return (data as Submission[]) ?? [];
  } catch (err) {
    fail('listLearnerSubmissions', err);
    return [];
  }
}

/**
 * Everything Sunil reads. Drafts are excluded on purpose — an unfinished ADR is
 * not a submission, and showing half-written ones in the room summary would put
 * words in someone's mouth.
 */
export async function listAllSubmissionsWithLearner(): Promise<SubmissionWithLearner[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('submissions')
      .select('*, learners(name, email)')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      ...row,
      learner_name: row.learners?.name ?? null,
      learner_email: row.learners?.email ?? '',
    })) as SubmissionWithLearner[];
  } catch (err) {
    fail('listAllSubmissionsWithLearner', err);
    return [];
  }
}

export interface SubmissionGap {
  learner_id: string;
  learner_name: string | null;
  learner_email: string;
  /** Weeks with an assignment that this learner has not submitted. */
  missing: number[];
  submitted: number[];
}

/**
 * Who has NOT submitted. The ADR page lists what came in; the useful half is
 * the gap, and it can only be computed against the roster.
 *
 * Note the spec's other half of this (§10): the dashboard tells Sunil, and
 * Sunil reaches out. Nothing here chases a learner automatically — automated
 * chasing of senior professionals reads as surveillance.
 */
export async function submissionGaps(weeks: number[]): Promise<SubmissionGap[]> {
  const client = db();
  if (!client) return [];

  try {
    const [{ data: learners, error: le }, { data: subs, error: se }] = await Promise.all([
      client.from('learners').select('id, name, email').eq('status', 'active').order('name'),
      client.from('submissions').select('learner_id, week').eq('status', 'submitted'),
    ]);
    if (le) throw le;
    if (se) throw se;

    const byLearner = new Map<string, Set<number>>();
    for (const row of subs ?? []) {
      const set = byLearner.get(row.learner_id) ?? new Set<number>();
      set.add(row.week);
      byLearner.set(row.learner_id, set);
    }

    return (learners ?? []).map((l: any) => {
      const done = byLearner.get(l.id) ?? new Set<number>();
      return {
        learner_id: l.id,
        learner_name: l.name ?? null,
        learner_email: l.email ?? '',
        submitted: weeks.filter((w) => done.has(w)),
        missing: weeks.filter((w) => !done.has(w)),
      };
    });
  } catch (err) {
    fail('submissionGaps', err);
    return [];
  }
}
