import type { APIRoute } from 'astro';
import { sendToSunil } from '../../../lib/craft/doubts';

export const prerender = false;

// Replaces the old `doubts-escalate` route, which re-ran the learner's question
// through a larger model. Escalation here means a human — spec §5.1, "escalation
// is a success, not a failure."

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing doubt id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { ok } = await sendToSunil(id, learner.id);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Could not send that on. Try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
