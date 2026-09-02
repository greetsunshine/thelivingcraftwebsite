import type { APIRoute } from 'astro';
import { saveFeedbackResponse } from '../../../lib/craft/feedback';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * What changed because of what the room said (spec §5.3). Saved as a draft, or
 * published — published rows are the only ones learners ever read.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { week, body, publish } = await request.json();

    if (!Number.isInteger(week) || week < 1 || week > 6) {
      return json({ error: 'Invalid week' }, 400);
    }
    if (!body || typeof body !== 'string' || body.trim() === '') {
      return json({ error: 'Write the note before saving.' }, 400);
    }

    const { ok } = await saveFeedbackResponse(week, body, Boolean(publish));
    if (!ok) return json({ error: 'Could not save that.' }, 500);

    return json({ success: true, published: Boolean(publish) }, 200);
  } catch (err) {
    console.error('feedback response save failed:', err);
    return json({ error: 'Invalid request' }, 400);
  }
};
