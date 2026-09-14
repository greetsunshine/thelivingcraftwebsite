// Dismissing the post-session prompt.
//
// The only write behind the modal, and it is one row saying "shown once, done".
// Scoped to the signed-in learner from `locals.learner` — the week comes from
// the body, the identity never does.

import type { APIRoute } from 'astro';
import { dismissPrompt } from '../../../lib/craft/prompts';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  try {
    const { week, phase } = await request.json();
    if (typeof week !== 'number' || !Number.isInteger(week) || week < 1 || week > 6) {
      return json({ error: 'Invalid week' }, 400);
    }
    if (phase !== 'before' && phase !== 'after') {
      return json({ error: 'Invalid phase' }, 400);
    }

    const result = await dismissPrompt(learner.id, week, phase);
    if (!result.ok) return json({ error: 'Could not save that.' }, 500);
    return json({ success: true }, 200);
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
};
