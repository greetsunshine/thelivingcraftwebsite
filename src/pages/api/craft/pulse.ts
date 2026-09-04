// Saving a capability pulse.
//
// THE WINDOW IS RE-CHECKED HERE, not trusted from the form. A "before" rating
// posted after the session has started is not a baseline, and the page that
// rendered the form may have been open in a tab for an hour. So the server
// rebuilds the window from the session frontmatter and refuses a closed one.
//
// Ratings are filtered to the capabilities that session actually teaches, so a
// hand-rolled POST cannot write a rating for A7 onto week 1's pulse and quietly
// corrupt the paired delta.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  pulseWindows,
  findWindow,
  listLearnerPulses,
  savePulse,
  type PulsePhase,
} from '../../../lib/craft/pulses';

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

  const { week, phase, ratings } = payload;

  if (typeof week !== 'number' || !Number.isInteger(week) || week < 1 || week > 6) {
    return json({ error: 'Invalid week' }, 400);
  }
  if (phase !== 'before' && phase !== 'after') {
    return json({ error: 'Invalid phase' }, 400);
  }
  if (!ratings || typeof ratings !== 'object') {
    return json({ error: 'Invalid ratings' }, 400);
  }

  const sessions = (await getCollection('sessions')).map((s) => ({
    week: s.data.week,
    title: s.data.title,
    topics: s.data.topics,
    startsAt: s.data.startsAt,
    endsAt: s.data.endsAt,
  }));

  const windows = pulseWindows(sessions, await listLearnerPulses(learner.id));
  const window = findWindow(windows, week, phase as PulsePhase);

  if (!window) return json({ error: 'No such pulse.' }, 404);
  if (!window.isOpen) {
    return json(
      {
        error:
          phase === 'before'
            ? 'That session has already started — a baseline taken afterwards is not a baseline.'
            : 'That session has not finished yet.',
      },
      409,
    );
  }

  // Only the capabilities this session teaches, only 1-5, only integers.
  const clean: Record<string, number> = {};
  for (const cap of window.capabilities) {
    const v = ratings[cap.id];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) {
      return json({ error: `Rate every capability before saving.` }, 400);
    }
    clean[cap.id] = v;
  }

  const result = await savePulse(learner.id, week, phase as PulsePhase, clean);
  if (!result.ok) return json({ error: 'Could not save that. Try again.' }, 500);

  return json({ success: true }, 200);
};
