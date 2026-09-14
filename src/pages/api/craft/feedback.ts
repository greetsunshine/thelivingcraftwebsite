// The close — four answers, two destinations.
//
// `landed` and `pacing` are about the session and stay here. `changing` is the
// learner's commitment and stays here. `unsure` does NOT: it opens a thread in
// the forum, tagged to the week, because "the thing I am still unsure about" is
// a doubt rather than feedback, and in the forum another learner can answer it
// before Sunil gets there.
//
// The forum write is passed in as a callback rather than imported into the
// feedback module, so neither module depends on the other. If it fails the text
// is kept in the feedback row instead of being lost — see submitFeedback().

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { submitFeedback } from '../../../lib/craft/feedback';
import { postThread, type SessionFact } from '../../../lib/craft/discussion';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const { week } = payload;
  const landed = text(payload.landed);
  const pacing = text(payload.pacing);
  const changing = text(payload.changing);
  const unsure = text(payload.unsure);

  if (typeof week !== 'number' || !Number.isInteger(week) || week < 1 || week > 6) {
    return json({ error: 'Invalid week' }, 400);
  }

  // The two about the session are required; the two about the learner are not.
  // Somebody who genuinely settled everything should not have to invent a doubt
  // at 04:56 to get past a form.
  if (!landed || !pacing) {
    return json({ error: 'The first two are needed — they are what changes next week.' }, 400);
  }

  const result = await submitFeedback(
    learner.id,
    week,
    { landed, pacing, changing, unsure },
    unsure
      ? async (body) => {
          const sessions = await getCollection('sessions');
          const facts: SessionFact[] = sessions.map((s) => ({
            week: s.data.week,
            title: s.data.title,
            summary: s.data.summary,
            assignment: s.data.assignment,
            taughtOn: s.data.taughtOn,
            status: s.data.status,
          }));
          const title = `Still unsure after week ${week}`;
          // 'content' rather than 'course': this is about the material, so it is
          // tagged, clustered and routed like any other question about substance
          // — and never answered by a fresh opinion.
          const posted = await postThread(learner.id, body, 'content', 'cohort', title, facts);
          return posted.ok && posted.id ? posted.id : null;
        }
      : undefined,
  );

  if (!result.ok) return json({ error: 'Failed to save feedback' }, 500);

  return json(
    {
      success: true,
      threadId: result.threadId ?? null,
      // True when the doubt could not reach the forum and is sitting in the
      // feedback row instead. The page says so rather than pretending.
      keptLocally: result.keptLocally ?? false,
    },
    200,
  );
};
