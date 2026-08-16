// Exchange the password for a session cookie.
//
// Reached without a session — middleware allowlists this path, because it is
// how a session is obtained. Everything else under /api/admin/ is closed.

import type { APIRoute } from 'astro';
import { COOKIE_NAME, checkPassword, clearThrottle, issueSession, throttleLogin } from '../../../lib/admin/auth';

export const prerender = false;

/** Never send anyone anywhere but back into the console. */
const safeNext = (raw: unknown): string => {
  const value = typeof raw === 'string' ? raw : '';
  return value.startsWith('/admin') && !value.startsWith('//') ? value : '/admin';
};

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
  const form = await request.formData();
  const next = safeNext(form.get('next'));
  const key = clientAddress ?? 'unknown';

  const gate = throttleLogin(key);
  if (!gate.ok) {
    return redirect(`/admin/login?e=throttled&m=${gate.retryInMin}&next=${encodeURIComponent(next)}`, 303);
  }

  if (!(await checkPassword(String(form.get('password') ?? '')))) {
    return redirect(`/admin/login?e=1&next=${encodeURIComponent(next)}`, 303);
  }

  clearThrottle(key);

  const session = await issueSession();
  cookies.set(COOKIE_NAME, session.value, {
    httpOnly: true,
    // Off on localhost, where there is no TLS and a Secure cookie is silently
    // dropped — which presents as "the password works but I stay logged out".
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: session.maxAge,
  });

  // 303 so the browser follows with GET. A 302 after a POST may repost the
  // form, which here means re-submitting the password on every back button.
  return redirect(next, 303);
};
