// Admin session — a signed cookie that now says WHO.
//
// It used to carry an expiry and a signature over it, and nothing else: "someone
// knew the password before this timestamp", which was the whole truth while
// there was one admin and one password.
//
// The cohort pipeline made that insufficient. The brief requires that an
// operator cannot approve an offer and that only finance confirms a payment,
// and a session with no identity cannot express either — so the cookie now
// carries an identity and a role list, and the signature covers both.
//
// WHAT THE SIGNATURE BUYS, AND WHAT IT DOES NOT
//
// The payload is signed, not encrypted. Anyone holding the cookie can read
// their own name and roles out of it, which is fine — they already know both.
// What they cannot do is CHANGE either without the secret, and that is the
// property every capability check downstream depends on.
//
// The roles are therefore trusted from the cookie rather than re-read from the
// database on each request. The trade is deliberate: a role revoked mid-session
// stays live until the session expires, at most twelve hours. Deactivating an
// account is the immediate lever, and it takes effect at the next sign-in. If
// that window ever matters more than the per-request read costs, move the
// lookup into middleware — but do not read roles from an unsigned source.
//
// FORMAT CHANGED, AND OLD COOKIES FAIL CLOSED. Everyone signs in again once.
// HttpOnly so script cannot read it, Secure in production, SameSite=Lax so a
// form POST from another origin cannot ride it.
//
// This is also why the no-localStorage rule survives: the session lives in a
// cookie the page cannot see, not in storage the page can.

import { env } from './env';
import { isRole, type Role } from '../pipeline/roles';
import type { Identity } from './staff';

const COOKIE = 'lc_admin';
const TTL_MS = 12 * 60 * 60 * 1000; // 12h — a working day, then log in again.

const enc = new TextEncoder();

const b64url = (bytes: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(env('ADMIN_SESSION_SECRET')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

/**
 * Length-independent, content-constant comparison.
 *
 * `a === b` on a secret leaks its prefix through timing. Over the internet that
 * is mostly theoretical, but the correct version is four lines and needs no
 * argument about whether the attack is practical from Bangalore.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Compact on purpose. This travels on every request to the console, so the
 * field names are one character each and the payload holds only what a
 * capability check needs: who, what they are called, and what they may do.
 * Nothing else about a person belongs in a cookie.
 */
interface Payload {
  /** staff_id, or null for the shared-password bootstrap. */
  s: string | null;
  /** Display name, so the console can say who is signed in without a read. */
  n: string;
  /** Role names. Anything unrecognised is dropped on the way out. */
  r: string[];
}

const encodePayload = (identity: Identity): string =>
  b64urlText(JSON.stringify({ s: identity.id, n: identity.name, r: identity.roles } satisfies Payload));

const b64urlText = (text: string): string =>
  btoa(String.fromCharCode(...enc.encode(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64urlText = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return new TextDecoder().decode(
    Uint8Array.from(atob(padded + '='.repeat((4 - (padded.length % 4)) % 4)), (c) => c.charCodeAt(0)),
  );
};

export async function issueSession(identity: Identity): Promise<{ value: string; maxAge: number }> {
  const expires = String(Date.now() + TTL_MS);
  const payload = encodePayload(identity);
  const body = `${expires}.${payload}`;
  return { value: `${body}.${await sign(body)}`, maxAge: Math.floor(TTL_MS / 1000) };
}

/**
 * Returns the identity, or null.
 *
 * It used to return a boolean. Middleware still only asks whether this is
 * truthy; everything downstream of middleware asks who it is.
 */
export async function verifySession(token: string | undefined): Promise<Identity | null> {
  if (!token || !env('ADMIN_SESSION_SECRET')) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [expires, payload, mac] = parts;

  // Signature first, then expiry, then contents. Reading an unverified token is
  // fine; DECIDING anything on it before the MAC checks out is how you end up
  // trusting attacker-chosen input — and this payload now names a role list.
  if (!safeEqual(mac, await sign(`${expires}.${payload}`))) return null;

  const at = Number(expires);
  if (!Number.isFinite(at) || at <= Date.now()) return null;

  try {
    const parsed = JSON.parse(fromB64urlText(payload)) as Partial<Payload>;
    const roles: Role[] = Array.isArray(parsed.r) ? parsed.r.filter(isRole) : [];
    const name = typeof parsed.n === 'string' && parsed.n ? parsed.n.slice(0, 120) : 'Signed in';

    return typeof parsed.s === 'string' && parsed.s
      ? { kind: 'staff', id: parsed.s, name, roles }
      : { kind: 'bootstrap', id: null, name, roles };
  } catch {
    // Signed but unreadable. Refuse rather than fall back to an empty identity:
    // a session with no roles would silently deny everything and look like a
    // permissions bug rather than a corrupt cookie.
    return null;
  }
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const expected = env('ADMIN_PASSWORD');
  if (!expected) return false;

  // Hash both sides before comparing so the lengths match and a wrong-length
  // guess is indistinguishable from a wrong-content one.
  const digest = async (s: string) => b64url(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return safeEqual(await digest(candidate), await digest(expected));
}

export const COOKIE_NAME = COOKIE;

// ---------------------------------------------------------------------------
// Login throttle
// ---------------------------------------------------------------------------
// In-memory and therefore per-instance, with the same caveat as the Q&A agent's
// limiter: a serverless fleet gives each cold instance its own counter, so this
// bounds guessing rather than preventing it. The real defence is that the
// password is a 24-byte random string, not that this counter is airtight. What
// it does stop is a script pointed at /admin/login for an afternoon.

interface Attempt {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, Attempt>();

export function throttleLogin(key: string): { ok: boolean; retryInMin: number } {
  const now = Date.now();

  if (attempts.size > 2_000) {
    for (const [k, a] of attempts) if (a.resetAt <= now) attempts.delete(k);
    if (attempts.size > 2_000) attempts.clear();
  }

  const seen = attempts.get(key);
  if (!seen || seen.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryInMin: 0 };
  }

  seen.count += 1;
  if (seen.count > MAX_ATTEMPTS) {
    return { ok: false, retryInMin: Math.max(1, Math.ceil((seen.resetAt - now) / 60_000)) };
  }
  return { ok: true, retryInMin: 0 };
}

/** Clear the counter on a correct password so one typo doesn't cost the window. */
export function clearThrottle(key: string): void {
  attempts.delete(key);
}
