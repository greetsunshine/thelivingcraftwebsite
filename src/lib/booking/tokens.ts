// The secret in a "reschedule or cancel" link.
//
// A booking is managed from a link in a calendar invite, with no sign-in. So
// the link itself is the credential, and it has to behave like one: enough
// entropy that it cannot be guessed, and stored as an HMAC so the database
// never holds a working key to somebody else's call. Same reasoning as
// `learners.code_hash` — see src/lib/craft/auth.ts.
//
// The small crypto helpers below are deliberately a copy of the ones in
// craft/auth.ts rather than an import. That module is the sign-in gate, and
// widening its exported surface so a booking link can borrow its HMAC is the
// kind of convenience that turns into a way in. Twenty lines is the cheaper
// risk. The domain prefix does the real work: a booking token and a learner
// session are signed over different strings, so neither can be presented as
// the other even though both key off ADMIN_SESSION_SECRET.

import { env } from '../admin/env';

const enc = new TextEncoder();

const b64url = (bytes: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(env('ADMIN_SESSION_SECRET')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** 24 bytes. Never shown grouped or read aloud, so no dashes — it is pasted from a link. */
export const newManageToken = (): string => b64url(crypto.getRandomValues(new Uint8Array(24)).buffer);

export const hashManageToken = (token: string): Promise<string> => hmac(`booking-manage:${token.trim()}`);

export async function manageTokenMatches(candidate: string, storedHash: string): Promise<boolean> {
  if (!candidate || !storedHash || !env('ADMIN_SESSION_SECRET')) return false;
  return safeEqual(await hashManageToken(candidate), storedHash);
}

/** The link that goes in the calendar invite. Absolute, because it is read in an email client. */
export const manageUrl = (origin: string, id: string, token: string): string =>
  `${origin.replace(/\/+$/, '')}/book/${id}?t=${encodeURIComponent(token)}`;
