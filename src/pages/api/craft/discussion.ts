// The learner side of the forum. One route, four actions, because they share
// the same auth check and the same shape of failure.
//
// EVERY WRITE IS SCOPED TO THE SIGNED-IN LEARNER, and the scoping happens in
// the lib functions against the database rather than here against the request.
// `locals.learner` is set by the middleware from a verified cookie and is the
// only source of identity — no route below reads a learner id from the body,
// which is what stops one learner acting as another.
//
// Note the role a learner can write is fixed at 'learner' inside
// replyAsLearner. This route cannot mint an instructor reply even if it wanted
// to, and that is what keeps 'instructor' worth trusting for relay.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  postThread,
  replyAsLearner,
  markResolved,
  askSunil,
  type SessionFact,
} from '../../../lib/craft/discussion';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * The session frontmatter a course thread may be answered from. Read here
 * rather than inside the discussion module so that module stays clear of
 * `astro:content` and the grounding sources stay visible at the call site.
 */
async function sessionFacts(): Promise<SessionFact[]> {
  const sessions = await getCollection('sessions');
  return sessions.map((s) => ({
    week: s.data.week,
    title: s.data.title,
    summary: s.data.summary,
    assignment: s.data.assignment,
    taughtOn: s.data.taughtOn,
    status: s.data.status,
  }));
}

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  // Defaults to 'post' so the composer's own fetch stays a plain body.
  const action = payload.action ?? 'post';

  if (action === 'post') {
    const { body, kind, visibility, title } = payload;

    if (!body || typeof body !== 'string' || body.trim() === '') {
      return json({ error: 'Write your question before posting.' }, 400);
    }
    if (kind !== 'course' && kind !== 'content') {
      return json({ error: 'Invalid kind' }, 400);
    }
    if (visibility !== undefined && visibility !== 'cohort' && visibility !== 'private') {
      return json({ error: 'Invalid visibility' }, 400);
    }

    const result = await postThread(
      learner.id,
      body,
      kind,
      visibility ?? 'cohort',
      typeof title === 'string' ? title : null,
      await sessionFacts(),
    );
    if (!result.ok) return json({ error: 'Could not post that. Try again.' }, 500);

    return json(
      {
        success: true,
        id: result.id,
        answer: result.answer ?? null,
        answerSource: result.answerSource ?? null,
        escalated: result.escalated ?? false,
      },
      200,
    );
  }

  if (action === 'reply') {
    const { threadId, body } = payload;
    if (typeof threadId !== 'string' || !threadId) return json({ error: 'Invalid request' }, 400);
    if (!body || typeof body !== 'string' || body.trim() === '') {
      return json({ error: 'Write a reply first.' }, 400);
    }

    const result = await replyAsLearner(threadId, learner.id, body);
    // replyAsLearner also declines a private thread that is not theirs, which
    // arrives here as the same failure — deliberately indistinguishable from a
    // storage error, so a probe cannot use it to discover that a thread exists.
    if (!result.ok) return json({ error: 'Could not post that reply.' }, 500);
    return json({ success: true, id: result.id }, 200);
  }

  if (action === 'resolve') {
    const { threadId, replyId } = payload;
    if (typeof threadId !== 'string' || !threadId) return json({ error: 'Invalid request' }, 400);
    if (replyId !== null && typeof replyId !== 'string') return json({ error: 'Invalid request' }, 400);

    const result = await markResolved(threadId, learner.id, replyId);
    if (!result.ok) return json({ error: 'Could not save that.' }, 500);
    return json({ success: true }, 200);
  }

  if (action === 'ask-sunil') {
    const { threadId } = payload;
    if (typeof threadId !== 'string' || !threadId) return json({ error: 'Invalid request' }, 400);

    const result = await askSunil(threadId, learner.id);
    if (!result.ok) return json({ error: 'Could not send that.' }, 500);
    return json({ success: true }, 200);
  }

  return json({ error: 'Unknown action' }, 400);
};
