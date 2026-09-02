import type { APIRoute } from 'astro';
import { getQuizItems, submitQuizResponse, isCorrect } from '../../../lib/craft/quiz';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  try {
    const { item_id, answer, confidence } = await request.json();

    if (!item_id || !answer || !Number.isInteger(confidence) || confidence < 1 || confidence > 5) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const items = await getQuizItems();
    const item = items.find(i => i.id === item_id);

    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Grading is code, and lives in one place — see src/lib/craft/quiz.ts.
    // `judge` items are never auto-scored, so this is null for them.
    const correct = isCorrect(item, answer);

    // Store response — the answer is committed before we reveal anything.
    const { ok } = await submitQuizResponse(learner.id, item_id, answer, confidence);

    if (!ok) {
      return new Response(JSON.stringify({ error: 'Failed to record response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reveal the correct answer AFTER the response is stored. This is the only
    // path through which a learner sees the key — the bank files in docs/ are
    // outside the Astro build and never served directly.
    return new Response(JSON.stringify({
      success: true,
      correct,
      correctAnswer: item.answer,
      rationale: item.rationale,
      difficulty: item.difficulty,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

