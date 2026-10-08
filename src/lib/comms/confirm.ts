// The confirmation link: the second half of double opt-in.
//
// A person ticks the marketing box on a download. One email asks them to
// confirm. The link in it carries this token. Nothing else is sent to them
// until the token comes back and they press the button on the page it opens.
//
// ───────────────────────────────────────────────────────────────────────────
// HOW IT DIFFERS FROM THE UNSUBSCRIBE TOKEN, AND WHY
// ───────────────────────────────────────────────────────────────────────────
//
// Same wire format (`expires.payload.mac`, HMAC-SHA-256), same secret
// (COMMS_LINK_SECRET), and a DIFFERENT DOMAIN STRING, so a confirmation token
// can never be replayed as an unsubscribe token or an admin cookie, and the
// other way round. See the note on domain separation in unsubscribe.ts.
//
//   * SHORT-LIVED. Seven days, against the unsubscribe link's four hundred. An
//     unsubscribe link must keep working in an old message; a confirmation
//     link found a year later is not a person saying yes today. A person who
//     misses the window ticks the box on their next download, and a new
//     request goes out (at most one a day).
//   * IT NAMES THE SEQUENCE, not only the person. Confirming is a decision
//     about one sequence, and the page must not activate a different one.
//   * ONE USE IN EFFECT. The token itself is not consumed; the sequence state
//     is. Once confirmed, a second click finds it already active and changes
//     nothing (confirmDrip in drip.ts).
//
// No token is ever stored. The provider adapter mints it at the moment of
// dispatch (deliver() in outbox.ts) and puts it where the body carries
// {{action:confirm}}.

// With extensions, so `node --test` can load this module directly.
import { env } from '../admin/env.ts';

const enc = new TextEncoder();

/** Seven days. Long enough for a holiday, short enough to mean "now". */
export const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const TOKEN_DOMAIN = 'lc.confirm.v1';

const b64url = (bytes: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64url = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return new TextDecoder().decode(
    Uint8Array.from(atob(padded + '='.repeat((4 - (padded.length % 4)) % 4)), (c) => c.charCodeAt(0)),
  );
};

const secret = (): string => env('COMMS_LINK_SECRET');

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(`${TOKEN_DOMAIN}|${payload}`)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface ConfirmPayload {
  /** The sequence to activate. */
  s: string;
  /** The person it belongs to. Checked against the sequence row. */
  p: string;
  v: 1;
}

/** Mint a token. Null when the secret is not configured: then the email cannot be sent. */
export async function signConfirmToken(sequenceId: string, personId: string, now: number = Date.now()): Promise<string | null> {
  if (!secret()) return null;
  const expires = String(now + CONFIRM_TTL_MS);
  const payload = b64url(enc.encode(JSON.stringify({ s: sequenceId, p: personId, v: 1 } satisfies ConfirmPayload)));
  const body = `${expires}.${payload}`;
  return `${body}.${await sign(body)}`;
}

/** The sequence and person this token names, or null. Every failure is null, with no reason. */
export async function verifyConfirmToken(
  token: string | null | undefined,
  now: number = Date.now(),
): Promise<{ sequenceId: string; personId: string } | null> {
  if (!token || !secret()) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [expires, payload, mac] = parts;

  if (!safeEqual(mac, await sign(`${expires}.${payload}`))) return null;

  const at = Number(expires);
  if (!Number.isFinite(at) || at <= now) return null;

  try {
    const parsed = JSON.parse(fromB64url(payload)) as Partial<ConfirmPayload>;
    const ok = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 60;
    return ok(parsed.s) && ok(parsed.p) ? { sequenceId: parsed.s, personId: parsed.p } : null;
  } catch {
    return null;
  }
}

/** Where a minted token goes. A public page: GET shows a button, POST confirms. */
export const confirmUrl = (origin: string, token: string): string =>
  `${origin.replace(/\/+$/, '')}/confirm-resource-emails?c=${encodeURIComponent(token)}`;
