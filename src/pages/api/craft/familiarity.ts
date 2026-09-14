import type { APIRoute } from 'astro';
import { parseFamiliarityAnswers, saveFamiliarity } from '../../../lib/craft/familiarity';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  try {
    const body = await request.json();
    const answers = parseFamiliarityAnswers(body.answers);
    const submit = Boolean(body.submit);

    const { ok, reason } = await saveFamiliarity({
      learnerId: learner.id,
      answers,
      submit
    });

    if (reason === 'locked') {
      return new Response(
        JSON.stringify({
          error: 'This one is already submitted. Ask Sunil if you need it reopened.',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!ok) {
      return new Response(JSON.stringify({ error: 'Failed to save' }), {
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
