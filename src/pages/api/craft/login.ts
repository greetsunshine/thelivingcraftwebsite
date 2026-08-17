// Exchange an email + access code for a learner session cookie.
//
// Allowlisted in the middleware, because it is how a session is obtained.
// Everything else under /api/craft/ is closed.

import type { APIRoute } from 'astro';
import { COOKIE_NAME, clearThrottle, issueSession, throttleLogin } from '../../../lib/craft/auth';
import { signIn } from '../../../lib/craft/learners';

export const prerender = false;

/** Never send anyone anywhere but back into the course area. */
const safeNext = (raw: unknown): string => {
  const value = typeof raw === 'string' ? raw : '';
  return value.startsWith('/craft') && !value.startsWith('//') ? value : '/craft';
};

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
  const form = await request.formData();
  const next = safeNext(form.get('next'));
  const key = clientAddress ?? 'unknown';

  const gate = throttleLogin(key);
  if (!gate.ok) {
    return redirect(`/craft/login?e=throttled&m=${gate.retryInMin}&next=${encodeURIComponent(next)}`, 303);
  }

  const learner = await signIn(String(form.get('email') ?? ''), String(form.get('code') ?? ''));

  // One message for a wrong email, a wrong code, a revoked seat, and an
  // unreachable database. Distinguishing them would tell a stranger which
  // addresses hold a seat, and the learner's next step is the same either way:
  // check both, then email Sunil.
  if (!learner) {
    return redirect(`/craft/login?e=1&next=${encodeURIComponent(next)}`, 303);
  }

  clearThrottle(key);

  const session = await issueSession(learner.id);
  cookies.set(COOKIE_NAME, session.value, {
    httpOnly: true,
    // Off on localhost, where a Secure cookie is silently dropped and presents
    // as "the code works but I stay signed out".
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: session.maxAge,
  });

  // 303 so the browser follows with GET rather than reposting the credential.
  return redirect(next, 303);
};
