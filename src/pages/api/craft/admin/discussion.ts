// Sunil's side of the forum.
//
// This route is under /api/craft/admin, so src/middleware.ts has already
// required the console password before anything here runs. That gate is the
// entire reason an 'instructor' reply can be trusted as the one voice eligible
// for relay — see the header of src/lib/craft/discussion.ts.

import type { APIRoute } from 'astro';
import {
  replyAsInstructor,
  markEndorsed,
  setPinned,
  updateThreadStatus,
  type ThreadStatus,
} from '../../../../lib/craft/discussion';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const STATUSES: ThreadStatus[] = ['new', 'routed', 'answered'];

export const POST: APIRoute = async ({ request }) => {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const { action, threadId } = payload;
  if (typeof threadId !== 'string' || !threadId) return json({ error: 'Invalid request' }, 400);

  if (action === 'reply') {
    const { body } = payload;
    if (!body || typeof body !== 'string' || body.trim() === '') {
      return json({ error: 'Write an answer first.' }, 400);
    }
    const result = await replyAsInstructor(threadId, body);
    if (!result.ok) return json({ error: 'Could not post that.' }, 500);
    return json({ success: true, id: result.id }, 200);
  }

  if (action === 'endorse') {
    const { replyId } = payload;
    if (replyId !== null && typeof replyId !== 'string') return json({ error: 'Invalid request' }, 400);
    const result = await markEndorsed(threadId, replyId);
    if (!result.ok) return json({ error: 'Could not save that.' }, 500);
    return json({ success: true }, 200);
  }

  if (action === 'pin') {
    const { pinned } = payload;
    if (typeof pinned !== 'boolean') return json({ error: 'Invalid request' }, 400);
    const result = await setPinned(threadId, pinned);
    if (!result.ok) return json({ error: 'Could not save that.' }, 500);
    return json({ success: true }, 200);
  }

  if (action === 'status') {
    const { status } = payload;
    if (!STATUSES.includes(status)) return json({ error: 'Invalid status' }, 400);
    const result = await updateThreadStatus(threadId, status);
    if (!result.ok) return json({ error: 'Could not save that.' }, 500);
    return json({ success: true }, 200);
  }

  return json({ error: 'Unknown action' }, 400);
};
