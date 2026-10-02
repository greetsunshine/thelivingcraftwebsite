// Resend, as the reference adapter.
//
// ───────────────────────────────────────────────────────────────────────────
// WHY RESEND, AND WHAT THAT DECIDES
// ───────────────────────────────────────────────────────────────────────────
//
// Decision D2 (which provider) is still the owner's. This adapter exists so
// that the answer "Resend" is one environment variable away rather than a
// build away, and so that the outcome mapping, the idempotency key and the
// webhook signature are written down and tested against a real API shape. A
// second provider is another file in this folder and one line in index.ts.
//
// No SDK. The API is one JSON POST, and a dependency that pins a request
// shape we can write in twelve lines is a dependency with no job.
//
// ───────────────────────────────────────────────────────────────────────────
// THE THREE OUTCOME RULES FROM deliver() IN outbox.ts, APPLIED
// ───────────────────────────────────────────────────────────────────────────
//
//   * A TIMEOUT OR A NETWORK ERROR IS 'unknown'. The request may have reached
//     the provider. Reconcile against the provider reference before any
//     retry; never retry blind.
//   * A 429 OR A 5xx IS A TRANSIENT FAILURE. The message returns to the queue
//     with a back-off (outbox.ts). Bounded.
//   * ANY OTHER 4xx IS PERMANENT. A refused key, a bad from-address, a
//     validation error: retrying sends the same request to the same answer.
//
// The provider's error text is never returned or logged in full: it can quote
// the recipient. The status and the provider's error NAME are enough.
//
// IDEMPOTENCY. Resend honours an `Idempotency-Key` header for 24 hours. We
// pass our own message id, so a retry after an 'unknown' that in fact landed
// returns the original send rather than a second copy.

import type { DeliveryOutcome, OutgoingEmail, ProviderAdapter } from './index.ts';
// With the extension, so `node --test` can load this module directly.
import { env } from '../../admin/env.ts';

const ENDPOINT = 'https://api.resend.com/emails';
const TIMEOUT_MS = 15_000;

export const resend: ProviderAdapter = {
  name: 'resend',

  async send(email: OutgoingEmail): Promise<DeliveryOutcome> {
    const apiKey = env('RESEND_API_KEY');
    if (!apiKey) {
      return { kind: 'failed', permanent: true, reason: 'RESEND_API_KEY is not set in this deployment.' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': email.messageId,
        },
        body: JSON.stringify({
          from: email.from,
          to: [email.to],
          reply_to: email.replyTo ?? undefined,
          subject: email.subject,
          text: email.text,
          html: email.html,
          headers: email.headers,
          tags: Object.entries(email.tags).map(([name, value]) => ({ name, value })),
        }),
      });
    } catch (err) {
      clearTimeout(timer);
      const aborted = err instanceof Error && err.name === 'AbortError';
      return {
        kind: 'unknown',
        provider: 'resend',
        providerMessageId: null,
        reason: aborted
          ? `No answer from Resend within ${TIMEOUT_MS / 1000}s. The request may have landed.`
          : 'The request to Resend did not complete. It may have landed.',
      };
    }
    clearTimeout(timer);

    let json: Record<string, unknown> = {};
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      json = {};
    }

    if (res.ok) {
      const id = typeof json.id === 'string' ? json.id : '';
      if (!id) {
        return {
          kind: 'unknown',
          provider: 'resend',
          providerMessageId: null,
          reason: 'Resend answered 2xx without a message id. Reconcile before any retry.',
        };
      }
      return { kind: 'sent', provider: 'resend', providerMessageId: id };
    }

    const name = typeof json.name === 'string' ? json.name : 'error';
    const transient = res.status === 429 || res.status >= 500;
    return {
      kind: 'failed',
      permanent: !transient,
      reason: `Resend refused: HTTP ${res.status} (${name}).`,
    };
  },
};

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------
//
// Resend signs webhooks the Svix way: three headers (svix-id, svix-timestamp,
// svix-signature), a secret that starts `whsec_` followed by base64, and a MAC
// over `${id}.${timestamp}.${rawBody}`. The signature header may carry several
// space-separated `v1,<base64>` entries during a secret rotation; any one
// matching is a pass. The timestamp is checked against our clock so a captured
// request cannot be replayed a day later.

export interface SvixHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

const enc = new TextEncoder();

const b64 = (bytes: ArrayBuffer): string => Buffer.from(bytes).toString('base64');

/** The secret's bytes as a fresh ArrayBuffer, which is what WebCrypto's types want. */
const keyBuffer = (raw: string): ArrayBuffer => Uint8Array.from(Buffer.from(raw, 'base64')).buffer;

async function hmacBase64(secret: ArrayBuffer, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * Verify one webhook request. Pure: the secret, the headers, the raw body and
 * the clock come in; a boolean goes out. Every failure is false and says
 * nothing about which check failed.
 */
export async function verifyResendSignature(args: {
  secret: string;
  headers: SvixHeaders;
  rawBody: string;
  now?: Date;
  toleranceSeconds?: number;
}): Promise<boolean> {
  const { secret, headers, rawBody } = args;
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;

  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor((args.now ?? new Date()).getTime() / 1000);
  if (Math.abs(nowSec - ts) > (args.toleranceSeconds ?? 300)) return false;

  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let key: ArrayBuffer;
  try {
    key = keyBuffer(raw);
  } catch {
    return false;
  }
  if (!key.byteLength) return false;

  const expected = await hmacBase64(key, `${headers.id}.${headers.timestamp}.${rawBody}`);
  return headers.signature
    .split(' ')
    .map((s) => s.trim())
    .filter(Boolean)
    .some((entry) => {
      const [version, sig] = entry.split(',');
      return version === 'v1' && typeof sig === 'string' && safeEqual(sig, expected);
    });
}

/** Sign a body the way Resend would. For tests and for the console's send-test path. */
export async function signResendWebhook(secret: string, id: string, timestamp: string, rawBody: string): Promise<string> {
  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  return `v1,${await hmacBase64(keyBuffer(raw), `${id}.${timestamp}.${rawBody}`)}`;
}

export type NormalisedEventType =
  | 'sent'
  | 'delivered'
  | 'deferred'
  | 'bounce_hard'
  | 'bounce_soft'
  | 'complaint'
  | 'opened'
  | 'clicked'
  | 'unsubscribe';

export interface NormalisedEvent {
  type: NormalisedEventType;
  /** The provider's id for this delivery of the webhook. The dedupe key. */
  providerEventId: string;
  providerMessageId: string | null;
  occurredAt: string | null;
}

const TYPE_MAP: Record<string, NormalisedEventType> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'deferred',
  'email.bounced': 'bounce_hard',
  'email.complained': 'complaint',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
};

/**
 * One Resend payload is one event. Returns null for a type this system does
 * not act on (contact events, domain events), which the endpoint acknowledges
 * without recording.
 */
export function parseResendEvent(json: unknown, svixId: string | null): NormalisedEvent | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  const type = typeof o.type === 'string' ? TYPE_MAP[o.type] : undefined;
  if (!type) return null;

  const data = (o.data ?? {}) as Record<string, unknown>;
  const bounce = (data.bounce ?? {}) as Record<string, unknown>;
  const soft = type === 'bounce_hard' && typeof bounce.type === 'string' && bounce.type.toLowerCase() === 'transient';

  const providerMessageId = typeof data.email_id === 'string' ? data.email_id : null;
  const eventId = svixId || (typeof o.id === 'string' ? o.id : '') || (providerMessageId ? `${o.type}:${providerMessageId}:${String(o.created_at ?? '')}` : '');
  if (!eventId) return null;

  return {
    type: soft ? 'bounce_soft' : type,
    providerEventId: eventId,
    providerMessageId,
    occurredAt: typeof o.created_at === 'string' ? o.created_at : null,
  };
}
