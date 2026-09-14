// Exchange a password for a session cookie.
//
// Reached without a session — middleware allowlists this path, because it is
// how a session is obtained. Everything else under /api/craft/admin/ is closed.
//
// TWO ROUTES IN, AND THE FORM DECIDES BY WHETHER AN EMAIL WAS GIVEN.
//
//   email + password  -> a named staff account, with its own roles
//   password alone    -> the shared-password bootstrap, roles from
//                        ADMIN_BOOTSTRAP_ROLES (default: operator only)
//
// The named route is tried FIRST when an address is present, and a failure
// there does not fall through to the shared password. Falling through would
// mean somebody typing their own address and the shared password gets in as
// the bootstrap — which is not who they said they were, and every audit row
// after that would be attributed to nobody.
//
// Both failures produce the same redirect and the same message. Telling
// somebody that an address exists but the password was wrong is a membership
// oracle for a list of five people, three of whom are named on the public site.

import type { APIRoute } from 'astro';
import { COOKIE_NAME, checkPassword, clearThrottle, issueSession, throttleLogin } from '../../../../lib/admin/auth';
import { authenticate, bootstrapIdentity, touchLastSeen, type Identity } from '../../../../lib/admin/staff';

export const prerender = false;

/** Never send anyone anywhere but back into the console. */
const safeNext = (raw: unknown): string => {
  const value = typeof raw === 'string' ? raw : '';
  return value.startsWith('/craft/admin') && !value.startsWith('//') ? value : '/craft/admin';
};

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
  const form = await request.formData();
  const next = safeNext(form.get('next'));
  const key = clientAddress ?? 'unknown';

  const gate = throttleLogin(key);
  if (!gate.ok) {
    return redirect(`/craft/admin/login?e=throttled&m=${gate.retryInMin}&next=${encodeURIComponent(next)}`, 303);
  }

  const password = String(form.get('password') ?? '');
  const email = String(form.get('email') ?? '').trim();

  let identity: Identity | null = null;

  if (email) {
    const staff = await authenticate(email, password);
    if (staff) {
      identity = { kind: 'staff', id: staff.staff_id, name: staff.name, roles: staff.roles };
      // Best effort, and never awaited into the failure path: a slow UPDATE
      // must not turn a correct password into a failed sign-in.
      void touchLastSeen(staff.staff_id);
    }
  } else if (await checkPassword(password)) {
    identity = bootstrapIdentity();
  }

  if (!identity) {
    return redirect(`/craft/admin/login?e=1&next=${encodeURIComponent(next)}`, 303);
  }

  clearThrottle(key);

  const session = await issueSession(identity);
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
