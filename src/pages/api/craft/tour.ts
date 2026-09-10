// Two facts about the guided walkthrough, written back.
//
// Behind the /craft gate: middleware puts the learner on `locals` before this
// runs, so there is no id in the body and no way to write somebody else's row.
//
// Both writes are fire-and-forget on the client and best-effort here. The worst
// case for a lost `offered` is one extra nudge; for a lost `done`, one more
// offer tomorrow. Neither is worth a failed request the browser then has to
// think about, so this always answers 200 with what it did.

import type { APIRoute } from 'astro';
import { recordTourDone, recordTourOffer } from '../../../lib/craft/learners';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let action: unknown;
  try {
    action = ((await request.json()) as { action?: unknown }).action;
  } catch {
    action = null;
  }

  if (action === 'offered') {
    await recordTourOffer(learner.id);
  } else if (action === 'done') {
    await recordTourDone(learner.id);
  } else {
    return new Response(JSON.stringify({ error: 'Unknown action.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
