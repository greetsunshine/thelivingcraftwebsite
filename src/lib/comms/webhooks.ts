// Provider callbacks: authenticated, deduplicated, out-of-order tolerant.
//
// The three words are the schema's (comms_events) and this file is where each
// one happens:
//   * AUTHENTICATED: the provider's signature is verified over the RAW body
//     before anything is parsed. A request that fails gets one constant 401.
//   * DEDUPLICATED: the event is inserted first, keyed (provider, event id).
//     A retried webhook hits the unique index and is acknowledged as seen.
//   * OUT OF ORDER: the message state is one-way in the database. A delivered
//     callback arriving after a bounce is stored, refused by the trigger, and
//     recorded as not applied with the reason.
//
// A hard bounce or a complaint does three things in this order: the address
// is suppressed for everything (the thing that must be true even if the rest
// fails), the message is marked, and the sequence is stopped. An unsubscribe
// reported by the provider goes through `applyUnsubscribe()`, the same path
// as the link.
//
// Nothing from the payload is stored beyond a digest: a bounce payload
// carries the address and often the body.

import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../admin/supabase';
import { env } from '../admin/env';
import { commsEvent } from './analytics';
import { recordSuppression, stopSequence } from './outbox';
import { parseResendEvent, verifyResendSignature, type NormalisedEvent } from './providers/resend';
import { applyUnsubscribe } from './unsubscribe';

const CONSTANT_401 = () => new Response('', { status: 401 });
const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

async function digest(raw: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Buffer.from(h).toString('hex').slice(0, 32);
}

interface MessageRow {
  message_id: string;
  person_id: string | null;
  sequence_id: string | null;
  recipient: string;
  purpose: string;
  template_key: string;
  sequence_step: number | null;
}

async function applyEvent(client: SupabaseClient, provider: string, ev: NormalisedEvent, raw: string): Promise<string> {
  // 1. Record it, or learn that we already have.
  const { data: inserted, error: insErr } = await client
    .from('comms_events')
    .insert({
      provider,
      provider_event_id: ev.providerEventId,
      provider_message_id: ev.providerMessageId,
      type: ev.type,
      occurred_at: ev.occurredAt,
      payload_digest: await digest(raw),
      applied: false,
      outcome: 'received',
    })
    .select('event_id')
    .maybeSingle();

  if (insErr) {
    if ((insErr as { code?: string }).code === '23505') return 'duplicate: already recorded';
    console.error('comms webhook event insert failed:', (insErr as { code?: string }).code ?? 'unknown');
    return 'not recorded';
  }
  const eventId = String(inserted?.event_id ?? '');
  const finish = async (applied: boolean, outcome: string, messageId: string | null) => {
    await client.from('comms_events').update({ applied, outcome: outcome.slice(0, 300), message_id: messageId }).eq('event_id', eventId);
    return outcome;
  };

  // 2. Which message.
  if (!ev.providerMessageId) return finish(false, 'no provider message reference on the event', null);
  const { data: msg, error: msgErr } = await client
    .from('comms_messages')
    .select('message_id, person_id, sequence_id, recipient, purpose, template_key, sequence_step')
    .eq('provider', provider)
    .eq('provider_message_id', ev.providerMessageId)
    .maybeSingle();
  if (msgErr) return finish(false, 'the outbox did not answer', null);
  if (!msg) return finish(false, 'no message with that provider reference', null);
  const m = msg as MessageRow;
  const meta = { message_id: m.message_id, sequence_id: m.sequence_id, resource_id: m.template_key.replace(/^recommend-/, '').toUpperCase(), step: m.sequence_step };
  const isDrip = m.template_key.startsWith('recommend-');
  const at = new Date().toISOString();

  const move = async (state: string, patch: Record<string, unknown>) => {
    const { error } = await client.from('comms_messages').update({ state, ...patch }).eq('message_id', m.message_id);
    // P0001 is the one-way trigger refusing a descent: the callback is late.
    if (error) return `refused: ${(error as { code?: string }).code === 'P0001' ? 'the message is already in a later state' : 'the outbox did not accept the change'}`;
    return null;
  };

  switch (ev.type) {
    case 'sent':
      return finish(true, 'noted: the provider accepted it', m.message_id);
    case 'deferred':
    case 'bounce_soft':
      return finish(true, 'noted: temporary; nothing suppressed', m.message_id);
    case 'delivered': {
      const refused = await move('delivered', { delivered_at: ev.occurredAt ?? at });
      if (refused) return finish(false, refused, m.message_id);
      if (isDrip) await commsEvent('drip_delivered', `delivered:${m.message_id}`, meta);
      return finish(true, 'delivered', m.message_id);
    }
    case 'bounce_hard':
    case 'complaint': {
      const reason = ev.type === 'complaint' ? 'complaint' : 'hard_bounce';
      await recordSuppression({ email: m.recipient, personId: m.person_id, reason, scope: 'all', source: provider, detail: ev.type });
      const refused = await move(ev.type === 'complaint' ? 'complained' : 'bounced', { failed_at: ev.occurredAt ?? at });
      if (m.sequence_id) await stopSequence(m.sequence_id, ev.type === 'complaint' ? 'complaint' : 'hard bounce', client);
      await commsEvent(ev.type === 'complaint' ? 'drip_complained' : 'drip_bounced', `${ev.type}:${m.message_id}`, meta);
      return finish(!refused, refused ? `suppressed and stopped; message ${refused}` : 'suppressed for everything; sequence stopped', m.message_id);
    }
    case 'opened': {
      if (env('COMMS_TRACK_OPENS') === 'on') await commsEvent('drip_email_opened', `opened:${ev.providerEventId}`, meta);
      return finish(true, env('COMMS_TRACK_OPENS') === 'on' ? 'noted' : 'noted; open tracking is off, so not counted', m.message_id);
    }
    case 'clicked': {
      await commsEvent('drip_cta_clicked', `clicked:${ev.providerEventId}`, meta);
      return finish(true, 'noted', m.message_id);
    }
    case 'unsubscribe': {
      if (m.person_id) {
        await applyUnsubscribe(m.person_id, provider);
        await commsEvent('drip_unsubscribed', `unsub:${ev.providerEventId}`, meta);
        return finish(true, 'unsubscribed through the provider; the same path as the link', m.message_id);
      }
      return finish(false, 'no person on the message', m.message_id);
    }
    default:
      return finish(false, 'no rule for this event type', m.message_id);
  }
}

/** The endpoint's whole job. One response shape; a bad signature is a bare 401. */
export async function handleProviderWebhook(provider: string, request: Request): Promise<Response> {
  const raw = await request.text();

  if (provider === 'resend') {
    const secret = env('COMMS_WEBHOOK_SECRET') || env('RESEND_WEBHOOK_SECRET');
    const verified = await verifyResendSignature({
      secret,
      headers: {
        id: request.headers.get('svix-id'),
        timestamp: request.headers.get('svix-timestamp'),
        signature: request.headers.get('svix-signature'),
      },
      rawBody: raw,
    });
    if (!verified) return CONSTANT_401();

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return ok({ ok: true, outcome: 'ignored: not JSON' });
    }
    const ev = parseResendEvent(json, request.headers.get('svix-id'));
    if (!ev) return ok({ ok: true, outcome: 'ignored: not an event this system acts on' });

    const client = db();
    if (!client) return ok({ ok: false, outcome: 'no store' });
    const outcome = await applyEvent(client, 'resend', ev, raw);
    console.log(JSON.stringify({ comms_webhook: { provider, type: ev.type, outcome } }));
    return ok({ ok: true, outcome });
  }

  return new Response('', { status: 404 });
}
