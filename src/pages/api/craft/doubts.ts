import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { submitDoubt, type SessionFact } from '../../../lib/craft/doubts';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * The session frontmatter a course doubt may be answered from. Read here rather
 * than inside the doubts module so that module stays clear of `astro:content`
 * and the grounding sources stay visible at the call site.
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

  try {
    const { body, kind } = await request.json();

    if (!body || typeof body !== 'string' || body.trim() === '') {
      return json({ error: 'Write your question before submitting.' }, 400);
    }
    if (kind !== 'course' && kind !== 'content') {
      return json({ error: 'Invalid kind' }, 400);
    }

    const result = await submitDoubt(learner.id, body, kind, await sessionFacts());
    if (!result.ok) return json({ error: 'Could not save that. Try again.' }, 500);

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
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
};
