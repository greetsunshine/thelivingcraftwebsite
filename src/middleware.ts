// The only gate on the admin console.
//
// Auth lives here rather than at the top of each page for one reason: a new
// admin page added later is protected by default. Per-page checks are correct
// until the day someone forgets one, and the failure mode is a public leads
// table. Everything under /admin and /api/admin is closed unless it is on the
// short allowlist below.
//
// Note this runs at build time too, for prerendered routes. That is harmless —
// no public path matches the prefixes — but it is why the check is a cheap
// string comparison before anything touches env or crypto.

import { defineMiddleware } from 'astro:middleware';
import { COOKIE_NAME, verifySession } from './lib/admin/auth';
import { capabilities } from './lib/admin/env';

/** Reachable without a session, because they are how you get one. */
const OPEN = new Set(['/admin/login', '/api/admin/login', '/api/admin/logout']);

const isAdminPath = (p: string) => p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin/');

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '') || '/';

  if (!isAdminPath(path)) return next();

  // Never index, never cache, never share. Set before the auth branch so it is
  // on the login page and on every rejection too.
  const seal = (response: Response) => {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('Referrer-Policy', 'same-origin');
    return response;
  };

  if (OPEN.has(path)) return seal(await next());

  // An unconfigured console is closed, not open. Without ADMIN_PASSWORD there
  // is no password that can be wrong, and "no credentials configured" must
  // never resolve to "let everyone in".
  if (!capabilities().auth) {
    return seal(
      new Response(
        'The admin console is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET ' +
          'in the Vercel project (see .env.example), then redeploy.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
      ),
    );
  }

  if (await verifySession(context.cookies.get(COOKIE_NAME)?.value)) {
    return seal(await next());
  }

  // APIs get a status code they can act on; pages get sent to the login form
  // with somewhere to return to.
  if (path.startsWith('/api/')) {
    return seal(
      new Response(JSON.stringify({ error: 'Not signed in.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  const next_ = encodeURIComponent(context.url.pathname + context.url.search);
  return seal(context.redirect(`/admin/login?next=${next_}`, 302));
});
