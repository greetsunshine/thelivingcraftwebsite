import type { APIRoute } from 'astro';
import { updateDoubtStatus, answerDoubtAsSunil, type DoubtStatus } from '../../../../lib/craft/doubts';

export const prerender = false;

const STATUSES: DoubtStatus[] = ['new', 'routed', 'answered'];

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Sunil's two writes on a doubt: move its status, or answer it in his own
 * words. An answer stored here is the only kind the course area will ever
 * relay to another learner — see src/lib/craft/doubts.ts.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, status, answer } = await request.json();

    if (!id || typeof id !== 'string') {
      return json({ error: 'Missing or invalid doubt id' }, 400);
    }

    if (typeof answer === 'string' && answer.trim() !== '') {
      const { ok } = await answerDoubtAsSunil(id, answer);
      if (!ok) return json({ error: 'Could not save the answer.' }, 500);
      return json({ success: true, status: 'answered' }, 200);
    }

    if (status) {
      if (!STATUSES.includes(status)) return json({ error: 'Invalid status' }, 400);
      const { ok } = await updateDoubtStatus(id, status);
      if (!ok) return json({ error: 'Could not update the status.' }, 500);
      return json({ success: true, status }, 200);
    }

    return json({ error: 'Nothing to change — send a status or an answer.' }, 400);
  } catch (err) {
    console.error('admin doubt patch failed:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
