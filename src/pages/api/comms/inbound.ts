// Replies from the reply mailbox land here: POST /api/comms/inbound.
//
// Public by necessity, and safe because the body is signed with
// COMMS_INBOUND_SECRET and checked before anything is read. A request with a
// bad or missing signature, or one older than five minutes, gets a bare 401.
// Without the secret configured the endpoint is closed (503).
//
// The forwarder (scripts/inbound/gmail-replies.gs) posts two kinds of body:
//   { "kind": "heartbeat", "source": "gmail" }
//   { "kind": "reply", "source": "gmail", "messageId": "<…>", "from": "Name <a@b.c>", "receivedAt": "…" }
// What each does is in lib/comms/inbound.ts.

import type { APIRoute } from 'astro';
import { db } from '../../../lib/admin/supabase';
import { applyInbound, inboundSecret, parseInbound, verifyInbound } from '../../../lib/comms/inbound';
import { stopSequence } from '../../../lib/comms/outbox';
import { supabaseDripStore } from '../../../lib/comms/drip-store';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
  const secret = inboundSecret();
  if (!secret) return json({ ok: false, error: 'Reply intake is not configured for this deployment.' }, 503);

  const rawBody = await request.text();
  if (rawBody.length > 20_000) return json({ ok: false }, 413);

  const verified = await verifyInbound({
    secret,
    timestamp: request.headers.get('x-lc-timestamp'),
    signature: request.headers.get('x-lc-signature'),
    rawBody,
  });
  if (!verified) return json({ ok: false }, 401);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return json({ ok: true, outcome: 'ignored: not JSON' });
  }
  const post = parseInbound(parsed);
  if (!post) return json({ ok: true, outcome: 'ignored: not a post this endpoint acts on' });

  const client = db();
  const drip = supabaseDripStore();
  const outcome = await applyInbound(client, post, {
    pause: async (sequenceId, reason) => drip?.pause(sequenceId, reason, new Date().toISOString()),
    stop: async (sequenceId, reason) => {
      await stopSequence(sequenceId, reason);
      // The cohort rule: a reply stops the sequence AND a person follows up.
      if (!client) return;
      const { data } = await client.from('comms_sequences').select('opportunity_id').eq('sequence_id', sequenceId).maybeSingle();
      if (data?.opportunity_id) {
        await client.from('tasks').insert({
          opportunity_id: data.opportunity_id,
          owner: 'operator',
          description: 'This person replied to an email. Their sequence has been stopped. Read the reply and decide the next step by hand.',
          due_at: new Date(Date.now() + 86_400_000).toISOString(),
        });
      }
    },
  });

  // One line per post. The outcome and the kind; never the address.
  console.log(JSON.stringify({ comms_inbound: { source: post.source, kind: post.kind, outcome } }));
  return json({ ok: outcome !== 'failed', outcome }, outcome === 'failed' ? 503 : 200);
};

export const GET: APIRoute = async () => new Response('', { status: 405 });
