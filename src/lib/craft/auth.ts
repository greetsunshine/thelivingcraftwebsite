// Learner sessions for /craft — email + issued access code.
//
// Deliberately NOT the admin scheme. The admin cookie says "someone knew the
// password"; this one has to say WHICH learner, because the course area shows a
// name and because revoking one seat must not sign the other seven out.
//
// It is still a signed cookie and not a session table: eight people, a six-week
// programme, and a revocation check that already hits the database on every
// page load (see `activeLearner`). A sessions table would add writes and a
// cleanup job to solve a problem this size does not have.
//
// SECRET REUSE. Both the code HMAC and the cookie MAC key off
// ADMIN_SESSION_SECRET rather than introducing a third env var to lose. They
// are domain-separated by a prefix inside the signed payload, so a value signed
// for one purpose cannot be presented as the other — without the prefixes, an
// admin cookie's `expires.mac` pair would verify here too.

import { env } from '../admin/env';

const COOKIE = 'lc_craft';
/** 30 days — the programme is six weeks; a weekly re-login is friction, not security. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();

const b64url = (bytes: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

async function hmac(payload: string): Promise<string> {
  const secret = env('ADMIN_SESSION_SECRET');
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

/** Length-independent, content-constant comparison. Same reasoning as admin/auth. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Access codes
// ---------------------------------------------------------------------------

/**
 * A new access code: 24 random bytes, base64url, grouped for reading aloud.
 *
 * Grouped because these get pasted into a WhatsApp message and typed back by a
 * person. The dashes are cosmetic and stripped before hashing, so a learner who
 * omits them still gets in.
 */
export function newCode(): string {
  const raw = b64url(crypto.getRandomValues(new Uint8Array(18)).buffer);
  return (raw.match(/.{1,6}/g) ?? [raw]).join('-');
}

/** Codes are compared by HMAC, so the database never holds a usable credential. */
export async function hashCode(code: string): Promise<string> {
  return hmac(`craft-code:${code.replace(/-/g, '').trim()}`);
}

export async function codeMatches(candidate: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  return safeEqual(await hashCode(candidate), storedHash);
}

// ---------------------------------------------------------------------------
// Session cookie
// ---------------------------------------------------------------------------

export interface LearnerSession {
  id: string;
}

export async function issueSession(learnerId: string): Promise<{ value: string; maxAge: number }> {
  const expires = String(Date.now() + TTL_MS);
  const payload = `${learnerId}.${expires}`;
  return {
    value: `${payload}.${await hmac(`craft-session:${payload}`)}`,
    maxAge: Math.floor(TTL_MS / 1000),
  };
}

/**
 * The learner id this cookie was issued for, or null.
 *
 * Returning the id rather than a boolean is the point: the caller then checks
 * the row is still `active`, so a revoked seat stops working immediately
 * instead of at cookie expiry.
 */
export async function readSession(token: string | undefined): Promise<LearnerSession | null> {
  if (!token || !env('ADMIN_SESSION_SECRET')) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [id, expires, mac] = parts;
  const payload = `${id}.${expires}`;

  // Signature before anything else. The id is attacker-supplied until the MAC
  // says otherwise, and a database lookup on unverified input is how a gate
  // becomes a query surface.
  if (!safeEqual(mac, await hmac(`craft-session:${payload}`))) return null;

  const at = Number(expires);
  if (!Number.isFinite(at) || at <= Date.now()) return null;

  return { id };
}

export const COOKIE_NAME = COOKIE;

// ---------------------------------------------------------------------------
// Login throttle
// ---------------------------------------------------------------------------
// Per-instance and therefore leaky on a serverless fleet, exactly like the
// admin one. The real defence is 18 bytes of entropy in the code; this stops a
// script pointed at the form.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

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

export function clearThrottle(key: string): void {
  attempts.delete(key);
}
