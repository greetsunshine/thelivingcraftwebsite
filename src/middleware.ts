// The only gate on the two closed areas: the admin console and /craft.
//
// Auth lives here rather than at the top of each page for one reason: a new
// page added later is protected by default. Per-page checks are correct until
// the day someone forgets one, and the failure mode is a public leads table —
// or, now, a course area that anyone can read. Everything under /admin,
// /api/admin, /craft and /api/craft is closed unless it is on the short
// allowlists below.
//
// The two areas do NOT share a session. One admin password opens the console;
// a per-learner code opens /craft. An admin cookie is not accepted at /craft
// and a learner cookie is not accepted at /admin — different secrets' domain
// prefixes see to it (src/lib/craft/auth.ts), and neither grants the other.
//
// Note this runs at build time too, for prerendered routes. That is harmless —
// no public path matches the prefixes — but it is why the check is a cheap
// string comparison before anything touches env or crypto.

import type { APIContext, MiddlewareNext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { COOKIE_NAME, verifySession } from './lib/admin/auth';
import { capabilities } from './lib/admin/env';
import { COOKIE_NAME as CRAFT_COOKIE, readSession } from './lib/craft/auth';
import { activeLearner } from './lib/craft/learners';

/** Reachable without a session, because they are how you get one. */
const OPEN = new Set(['/admin/login', '/api/admin/login', '/api/admin/logout']);
const CRAFT_OPEN = new Set(['/craft/login', '/api/craft/login', '/api/craft/logout']);

const isAdminPath = (p: string) => p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin/');
const isCraftPath = (p: string) => p === '/craft' || p.startsWith('/craft/') || p.startsWith('/api/craft/');

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname.replace(/\/+$/, '') || '/';

  if (isCraftPath(path)) return craftGate(context, next, path);
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

/**
 * The gate on the course area.
 *
 * Structurally the same as the console's, with one deliberate difference: a
 * valid cookie is not sufficient. The learner row is re-read on every request
 * and must still be `active`, so revoking a seat ends the session now rather
 * than in up to thirty days. The verified learner is put on `context.locals`
 * so the pages do not each repeat the lookup.
 */
async function craftGate(context: APIContext, next: MiddlewareNext, path: string): Promise<Response> {
  const seal = (response: Response) => {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('Referrer-Policy', 'same-origin');
    return response;
  };

  if (CRAFT_OPEN.has(path)) return seal(await next());

  // LOCAL DEV ONLY, double-gated so it cannot reach production by accident:
  //
  //   import.meta.env.DEV is a build-time constant, false in every `astro
  //   build` output — which is what Vercel runs. There is no request-time
  //   value that can flip it back on once built, so this branch is compiled
  //   OUT of the production bundle entirely, not merely skipped at runtime.
  //
  //   CRAFT_DEV_BYPASS must also be '1' in .env.local (gitignored, never
  //   committed), so it does not silently activate for every contributor who
  //   runs `npm run dev` — it has to be deliberately opted into.
  //
  // This replaces the earlier `PoC BYPASS`, which had neither gate and shipped
  // on the branch with the real check unreachable below it. Never repeat that:
  // if this needs to be more permissive, add a gate, don't remove one.
  if (import.meta.env.DEV && import.meta.env.CRAFT_DEV_BYPASS === '1') {
    context.locals.learner = {
      id: 'dev-preview',
      email: 'preview@example.com',
      name: 'Preview Learner',
      cohort: 'cohort-1',
      status: 'active',
      note: null,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    };
    return seal(await next());
  }

  // Unconfigured is closed, same as the console. Without the session secret
  // nothing can be signed; without Supabase there is no seat list to check
  // against, and "cannot verify" must never mean "let them in".
  const caps = capabilities();
  if (!caps.auth || !caps.data) {
    return seal(
      new Response(
        'The course area is not configured yet. It needs ADMIN_SESSION_SECRET and the ' +
          'Supabase keys in the Vercel project (see .env.example), and the learners table ' +
          'from supabase/schema.sql.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
      ),
    );
  }

  const session = await readSession(context.cookies.get(CRAFT_COOKIE)?.value);
  const learner = session ? await activeLearner(session.id) : null;

  if (learner) {
    context.locals.learner = learner;
    return seal(await next());
  }

  if (path.startsWith('/api/')) {
    return seal(
      new Response(JSON.stringify({ error: 'Not signed in.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  const back = encodeURIComponent(context.url.pathname + context.url.search);
  return seal(context.redirect(`/craft/login?next=${back}`, 302));
}
