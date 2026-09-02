import type { APIRoute } from 'astro';
import { submitFeedback } from '../../../lib/craft/feedback';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  try {
    const { week, landed, pacing } = await request.json();

    if (typeof week !== 'number' || week < 1 || week > 6) {
      return new Response(JSON.stringify({ error: 'Invalid week' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!landed || typeof landed !== 'string' || landed.trim() === '' ||
        !pacing || typeof pacing !== 'string' || pacing.trim() === '') {
      return new Response(JSON.stringify({ error: 'Feedback fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { ok } = await submitFeedback(learner.id, week, landed, pacing);

    if (!ok) {
      return new Response(JSON.stringify({ error: 'Failed to save feedback' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
