// The pair draft and its review — two actions, one route.
//
// Both are written from a live room with minutes left, which shapes the error
// handling more than anything else here: nothing throws away typed text. A bad
// score is clamped rather than rejected, an unknown partner becomes null rather
// than a 400, and the only genuine refusals are the ones that would let somebody
// review their own work.

import type { APIRoute } from 'astro';
import { saveDraft, saveReview, draftsToReview, type ReviewAnswers } from '../../../lib/craft/pairs';
import { ADR_REVIEW_QUESTIONS } from '../../../lib/craft/adr';
import { listLearners } from '../../../lib/craft/learners';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const action = payload.action ?? 'draft';
  const week = Number(payload.week);
  if (!Number.isInteger(week) || week < 1 || week > 6) {
    return json({ error: 'Invalid week' }, 400);
  }

  // --- write the draft ---------------------------------------------------
  if (action === 'draft') {
    const body = typeof payload.body === 'string' ? payload.body : '';
    if (!body.trim()) return json({ error: 'Write something first.' }, 400);

    // A partner who is not a real active learner is recorded as absent rather
    // than refused. Somebody working alone because their partner did not turn up
    // still has a draft worth reviewing.
    let partnerId: string | null = null;
    const claimed = typeof payload.partnerId === 'string' ? payload.partnerId : '';
    if (claimed && claimed !== learner.id) {
      const roster = await listLearners();
      partnerId = roster.some((l) => l.id === claimed && l.status === 'active') ? claimed : null;
    }

    const result = await saveDraft(learner.id, week, partnerId, body);
    if (!result.ok) return json({ error: 'Could not save that. Try again.' }, 500);
    return json({ success: true, id: result.id }, 200);
  }

  // --- review another pair's ---------------------------------------------
  if (action === 'review') {
    const draftId = typeof payload.draftId === 'string' ? payload.draftId : '';
    if (!draftId) return json({ error: 'Pick whose record you are reviewing.' }, 400);

    // Re-checked here, not trusted from the page. draftsToReview() already
    // excludes the reviewer's own and their partner's, and this is the same
    // list — so a crafted draft id gets the same answer as a stale one.
    const allowed = await draftsToReview(learner.id, week);
    if (!allowed.some((d) => d.id === draftId)) {
      return json({ error: 'That is not a record you can review.' }, 403);
    }

    const answers: ReviewAnswers = {};
    for (const q of ADR_REVIEW_QUESTIONS) {
      const a = payload.answers?.[q.id] ?? {};
      answers[q.id] = { score: Number(a.score ?? 0), comment: String(a.comment ?? '') };
    }

    const written = Object.values(answers).some((a) => a.comment.trim() !== '');
    if (!written) {
      return json({ error: 'Write at least one comment — that is the half that matters.' }, 400);
    }

    const result = await saveReview(draftId, learner.id, answers);
    if (!result.ok) return json({ error: 'Could not save that. Try again.' }, 500);
    return json({ success: true }, 200);
  }

  return json({ error: 'Unknown action' }, 400);
};
