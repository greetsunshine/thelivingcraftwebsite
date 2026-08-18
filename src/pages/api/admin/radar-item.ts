// Hide, restore, or correct one radar finding — straight to the database.
//
// The sibling endpoint /api/admin/propose does the same job for the visitor
// retriever's findings by opening a pull request, because those are read aloud
// to prospects and every change to them should be a reviewable diff. The radar
// is Sunil's private notebook; a merge and a deploy to dismiss a stale hiring
// article was ceremony without a reader.
//
// Behind the admin session — middleware closes everything under /api/admin/
// that is not on its allowlist.

import type { APIRoute } from 'astro';
import { editFinding, setFindingStatus } from '../../../lib/agent/radar';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Expected JSON.' }, 400);
  }

  const id = typeof payload.id === 'string' ? payload.id : '';
  const action = typeof payload.action === 'string' ? payload.action : '';
  if (!id) return json({ ok: false, error: 'Which finding?' }, 400);

  if (action === 'hide' || action === 'restore') {
    // Hidden rather than deleted: dismissing a finding is a judgement, and one
    // worth being able to revisit when the story develops.
    const ok = await setFindingStatus(id, action === 'hide' ? 'hidden' : 'kept');
    return ok
      ? json({ ok: true, message: action === 'hide' ? 'Hidden.' : 'Restored.' })
      : json({ ok: false, error: 'Could not update that finding.' }, 500);
  }

  if (action === 'edit') {
    const ok = await editFinding(id, {
      title: typeof payload.title === 'string' ? payload.title : undefined,
      body: typeof payload.body === 'string' ? payload.body : undefined,
      implication: typeof payload.implication === 'string' ? payload.implication : undefined,
    });
    return ok
      ? json({ ok: true, message: 'Saved.' })
      : json({ ok: false, error: 'Nothing to change, or the write failed.' }, 400);
  }

  return json({ ok: false, error: `Unknown action "${action}".` }, 400);
};
