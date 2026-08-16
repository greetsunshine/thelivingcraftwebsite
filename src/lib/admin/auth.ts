// Admin session — a signed cookie, no user table.
//
// There is one admin. A password plus an HMAC-signed cookie is the honest size
// of that problem; anything more (an auth provider, a users table, OAuth) adds
// an account to rotate and a dependency to keep alive for a single person.
//
// The cookie carries an expiry and a signature over it, and nothing else. It is
// not a bearer of identity or claims — it says "someone knew the password
// before this timestamp", which is all there is to say. HttpOnly so script
// cannot read it, Secure in production, SameSite=Lax so a form POST from
// another origin cannot ride it.
//
// This is also why the no-localStorage rule survives: the session lives in a
// cookie the page cannot see, not in storage the page can.

import { env } from './env';

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

export async function issueSession(): Promise<{ value: string; maxAge: number }> {
  const expires = String(Date.now() + TTL_MS);
  return { value: `${expires}.${await sign(expires)}`, maxAge: Math.floor(TTL_MS / 1000) };
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token || !env('ADMIN_SESSION_SECRET')) return false;

  const dot = token.indexOf('.');
  if (dot < 1) return false;

  const expires = token.slice(0, dot);
  const mac = token.slice(dot + 1);

  // Signature first, then expiry. Reading the timestamp of an unverified token
  // is fine, but deciding anything on it before checking the MAC is how you end
  // up trusting attacker-chosen input.
  if (!safeEqual(mac, await sign(expires))) return false;

  const at = Number(expires);
  return Number.isFinite(at) && at > Date.now();
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
