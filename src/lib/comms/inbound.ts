// Replies: how a reply in the mailbox reaches the follow-ups.
//
// ───────────────────────────────────────────────────────────────────────────
// WHY THIS DOES NOT WAIT FOR THE EMAIL PROVIDER
// ───────────────────────────────────────────────────────────────────────────
//
// The brief: a reply pauses the sequence, and "Reply detection unavailable or
// stale: fail closed: pause marketing dispatch ... until sync is healthy". A
// sending provider sends; most do not read the mailbox people reply to. So
// the reply feed is its own small seam, independent of D2:
//
//   the reply mailbox  ──(a forwarder)──▶  POST /api/comms/inbound  ──▶  here
//
// The forwarder can be anything that can sign a JSON body. The one shipped is
// a Google Apps Script for a Gmail mailbox (scripts/inbound/gmail-replies.gs).
// It runs every five minutes, posts each new message's sender and Message-ID,
// and posts a heartbeat on every run whether or not anything arrived.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT A REPLY DOES
// ───────────────────────────────────────────────────────────────────────────
//
//   * A reply is recorded once, keyed by the message's own Message-ID, so a
//     forwarder that posts the same message twice changes nothing.
//   * It is recorded against the PERSON whose address sent it, and against the
//     last message we sent them if there is one.
//   * A live resource follow-up is PAUSED (cancel what is queued; a person
//     resumes it). A live cohort sequence is STOPPED and a review task is
//     raised, which is the cohort rule: "On a reply ... stop the sequence and
//     create a human follow-up task."
//   * An address we do not know is acknowledged and not recorded. It is not a
//     person in this system, and storing it would make one.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT "STALE" MEANS
// ───────────────────────────────────────────────────────────────────────────
//
// Every post, heartbeat or reply, updates comms_inbound_status. The dispatch
// check (eligibility.ts) holds every marketing message while the newest
// heartbeat is older than COMMS_INBOUND_STALE_MINUTES (30 by default). A
// forwarder that stopped running is therefore a pause, not a silence.
//
// Nothing here stores the message body or the subject. The sender's address
// is matched and dropped; the Message-ID is the record.

import type { SupabaseClient } from '@supabase/supabase-js';
// With the extension, so `node --test` can load this module directly.
import { env } from '../admin/env.ts';

const enc = new TextEncoder();

/** The signing secret. At least 16 characters, or the endpoint is closed. */
export const inboundSecret = (): string => {
  const s = env('COMMS_INBOUND_SECRET').trim();
  return s.length >= 16 ? s : '';
};

/** How old the newest heartbeat may be before dispatch is held. */
export const staleAfterMinutes = (): number => {
  const n = Number.parseInt(env('COMMS_INBOUND_STALE_MINUTES'), 10);
  return Number.isFinite(n) && n >= 5 && n <= 24 * 60 ? n : 30;
};

const b64 = (bytes: ArrayBuffer): string => Buffer.from(bytes).toString('base64');

async function hmacBase64(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/** Sign a body the way the forwarder does. For tests and for the console's test path. */
export async function signInbound(secret: string, timestamp: string, rawBody: string): Promise<string> {
  return `v1=${await hmacBase64(secret, `${timestamp}.${rawBody}`)}`;
}

/**
 * Verify one post. The headers are `X-LC-Timestamp` (unix seconds) and
 * `X-LC-Signature` (`v1=<base64 HMAC-SHA256 of "<timestamp>.<body>">`).
 * Every failure is false, with no reason.
 */
export async function verifyInbound(args: {
  secret: string;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  now?: Date;
  toleranceSeconds?: number;
}): Promise<boolean> {
  if (!args.secret || !args.timestamp || !args.signature) return false;
  const ts = Number(args.timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor((args.now ?? new Date()).getTime() / 1000);
  if (Math.abs(nowSec - ts) > (args.toleranceSeconds ?? 300)) return false;
  return safeEqual(args.signature.trim(), await signInbound(args.secret, args.timestamp, args.rawBody));
}

export type InboundPost =
  | { kind: 'heartbeat'; source: string }
  | { kind: 'reply'; source: string; messageId: string; from: string; receivedAt: string | null };

const SOURCE_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** The address inside `Name <a@b.c>`, lower-cased, or null. */
export function addressOf(from: string): string | null {
  const m = /<([^<>\s]+@[^<>\s]+)>/.exec(from) ?? /([^\s<>"]+@[^\s<>"]+)/.exec(from);
  const a = (m?.[1] ?? '').trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a) ? a : null;
}

/** One post, or null for anything this endpoint does not act on. */
export function parseInbound(json: unknown): InboundPost | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  const source = typeof o.source === 'string' ? o.source.trim().toLowerCase() : '';
  if (!SOURCE_RE.test(source)) return null;
  if (o.kind === 'heartbeat') return { kind: 'heartbeat', source };
  if (o.kind !== 'reply') return null;
  const messageId = typeof o.messageId === 'string' ? o.messageId.trim() : '';
  const from = typeof o.from === 'string' ? o.from.trim() : '';
  if (!messageId || messageId.length > 300 || !from || from.length > 320) return null;
  const at = typeof o.receivedAt === 'string' && Number.isFinite(Date.parse(o.receivedAt)) ? new Date(o.receivedAt).toISOString() : null;
  return { kind: 'reply', source, messageId, from, receivedAt: at };
}

export type InboundOutcome = 'heartbeat' | 'recorded' | 'duplicate' | 'unknown sender' | 'own mailbox' | 'no store' | 'failed';

const failed = (what: string, error: unknown): void =>
  console.error(`comms inbound ${what} failed:`, (error as { code?: string })?.code ?? 'unknown');

/**
 * Apply one verified post. `actions` does the sequence changes so this file
 * does not import outbox.ts (which imports eligibility.ts, which reads the
 * status table this file writes).
 */
export async function applyInbound(
  client: SupabaseClient | null,
  post: InboundPost,
  actions: {
    pause: (sequenceId: string, reason: string) => Promise<unknown>;
    stop: (sequenceId: string, reason: string) => Promise<unknown>;
  },
  now: Date = new Date(),
): Promise<InboundOutcome> {
  if (!client) return 'no store';
  const nowISO = now.toISOString();

  // The heartbeat half of every post. A failed write here is logged and does
  // not refuse the reply: recording a reply matters more than the clock.
  const { error: hbErr } = await client
    .from('comms_inbound_status')
    .upsert({ source: post.source, last_seen_at: nowISO, ...(post.kind === 'reply' ? { last_reply_at: nowISO } : {}) }, { onConflict: 'source' });
  if (hbErr) failed('heartbeat', hbErr);
  if (post.kind === 'heartbeat') return 'heartbeat';

  const address = addressOf(post.from);
  if (!address) return 'unknown sender';
  const own = env('COMMS_REPLY_MAILBOX').trim().toLowerCase();
  if (own && addressOf(own) === address) return 'own mailbox';

  const { data: person, error: personErr } = await client
    .from('people')
    .select('person_id')
    .eq('normalised_email', address)
    .maybeSingle();
  if (personErr) {
    failed('person', personErr);
    return 'failed';
  }
  if (!person) return 'unknown sender';
  const personId = String(person.person_id);

  const { data: last } = await client
    .from('comms_messages')
    .select('message_id')
    .eq('person_id', personId)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: evErr } = await client.from('comms_events').insert({
    provider: `inbound:${post.source}`,
    provider_event_id: post.messageId,
    provider_message_id: null,
    message_id: last?.message_id ?? null,
    person_id: personId,
    type: 'reply',
    occurred_at: post.receivedAt,
    received_at: nowISO,
    applied: true,
    outcome: 'reply recorded from the reply mailbox',
  });
  if (evErr) {
    if ((evErr as { code?: string }).code === '23505') return 'duplicate';
    failed('event', evErr);
    return 'failed';
  }

  const { data: live } = await client
    .from('comms_sequences')
    .select('sequence_id, route, state')
    .eq('person_id', personId)
    .in('state', ['awaiting_confirmation', 'active', 'paused'])
    .maybeSingle();
  if (live) {
    const id = String(live.sequence_id);
    if (live.route === 'resource') {
      if (live.state === 'active') await actions.pause(id, 'the person replied');
    } else {
      await actions.stop(id, 'the person replied');
    }
  }
  return 'recorded';
}
