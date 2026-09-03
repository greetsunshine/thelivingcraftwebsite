// Update or erase one lead.
//
// Behind the middleware gate, so there is no auth check here. Cross-site forgery
// is covered by the session cookie being SameSite=Lax — a POST from another
// origin does not carry it — plus the JSON content type, which a simple form
// cannot send without a CORS preflight this endpoint never answers.
//
// DELETE IS A HARD DELETE, and that is the point. Every other status here is
// triage — 'archived' hides a lead you have finished with. Erasure is a
// different request with a different obligation behind it: someone asking to be
// removed under the DPDP Act is not asking to be filed differently. A soft
// delete would leave their name, employer and message in the table while the
// console told you it was gone, which is the worst of both.
//
// The inbox is unaffected. Web3Forms delivered the original email and this
// cannot reach it — a complete erasure means deleting that thread too.

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/admin/supabase';
import { LEAD_STATUSES } from '../../../../lib/admin/queries';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const client = db();
  if (!client) return json({ error: 'Supabase is not configured.' }, 503);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return json({ error: 'Missing lead id.' }, 400);

  if (body.action === 'delete') {
    // Read the row first so the deletion can be logged with enough detail to
    // answer "who did we erase and when" later, without keeping the record
    // itself. The email is logged; the message they wrote is not.
    const { data: doomed } = await client.from('leads').select('email, created_at').eq('id', id).single();

    const { error } = await client.from('leads').delete().eq('id', id);
    if (error) {
      console.error('lead delete failed:', error.message);
      return json({ error: 'Could not delete that.' }, 500);
    }

    console.log(
      JSON.stringify({
        at: 'lead.erased',
        id,
        email: doomed?.email ?? null,
        createdAt: doomed?.created_at ?? null,
        erasedAt: new Date().toISOString(),
      }),
    );

    return json({ ok: true, message: 'Deleted. The inbox copy is separate — delete that too.' });
  }

  // Build the patch from what was actually sent, so saving a note does not
  // silently reset the status and vice versa.
  const patch: Record<string, unknown> = {};

  if ('status' in body) {
    const status = String(body.status);
    if (!(LEAD_STATUSES as readonly string[]).includes(status)) {
      return json({ error: `Unknown status "${status}".` }, 400);
    }
    patch.status = status;
  }

  if ('admin_note' in body) {
    patch.admin_note = String(body.admin_note ?? '').slice(0, 4000) || null;
  }

  if (Object.keys(patch).length === 0) return json({ error: 'Nothing to update.' }, 400);

  const { error } = await client.from('leads').update(patch).eq('id', id);
  if (error) {
    console.error('lead update failed:', error.message);
    return json({ error: 'Could not save that.' }, 500);
  }

  return json({ ok: true });
};
