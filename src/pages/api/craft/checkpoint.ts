// Saving one checkpoint number.
//
// The smallest write in the whole course area, and the one with the shortest
// useful life: a checkpoint is a slow-down signal, so it is worth something for
// the rest of the session and nothing afterwards.
//
// THE WINDOW IS RE-CHECKED HERE, not trusted from the page. checkpointWindows()
// is the single definition of when a checkpoint is open, the same way
// pulseWindows() is for a rating — a client that posts a stale `at` gets the
// same answer as one that posts a fabricated one, because both go through the
// same test against the session file.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  checkpointWindows,
  listLearnerCheckpoints,
  saveCheckpoint,
} from '../../../lib/craft/checkpoints';

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

  const { week, at, rating } = payload;

  if (typeof week !== 'number' || !Number.isInteger(week) || week < 1 || week > 6) {
    return json({ error: 'Invalid week' }, 400);
  }
  if (typeof at !== 'string' || !/^\d{2}:\d{2}$/.test(at)) {
    return json({ error: 'Invalid checkpoint' }, 400);
  }
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: 'Pick a number from 1 to 5.' }, 400);
  }

  const sessions = await getCollection('sessions');
  const session = sessions.find((s) => s.data.week === week);
  if (!session) return json({ error: 'No such session.' }, 404);

  const windows = checkpointWindows(
    {
      week: session.data.week,
      checkpoints: session.data.checkpoints,
      startsAt: session.data.startsAt,
      endsAt: session.data.endsAt,
    },
    await listLearnerCheckpoints(learner.id),
  );

  const window = windows.find((w) => w.at === at);
  if (!window) return json({ error: 'No such checkpoint.' }, 404);

  // A checkpoint that carries no number is not closed, it is a different kind of
  // thing — week 1's 04:15 is four items to read and no rating. Saying "the
  // session is over" here would be false as well as unhelpful.
  if (window.question === null) {
    return json({ error: 'That checkpoint does not take a number — it is there to be read.' }, 409);
  }

  if (!window.isOpen) {
    // Deliberately says which of the two it is. "Not yet" and "the session is
    // over" are different problems for the person holding the phone, and a
    // single "closed" would leave them guessing which.
    const notYet = window.moment !== null && Date.now() < window.moment.getTime();
    return json(
      {
        error: notYet
          ? 'That checkpoint has not come round yet.'
          : 'That session is over. A checkpoint only helps while there is still time to act on it.',
      },
      409,
    );
  }

  const result = await saveCheckpoint(learner.id, week, at, rating);
  if (!result.ok) return json({ error: 'Could not send that. Try again.' }, 500);

  return json({ success: true }, 200);
};
