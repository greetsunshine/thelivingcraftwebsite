import { defineMiddleware } from 'astro:middleware';

/**
 * Bearer token auth for /admin/* routes.
 * Token must be passed as:
 *   - Authorization: Bearer <token>   header, or
 *   - ?token=<token>                  query param (for browser access during dev)
 *
 * ADMIN_SECRET_TOKEN is set as a Netlify environment secret.
 */
export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Only protect /admin/* routes
  if (!pathname.startsWith('/admin')) {
    return next();
  }

  const secret = import.meta.env.ADMIN_SECRET_TOKEN ?? process.env.ADMIN_SECRET_TOKEN;
  if (!secret) {
    // Secret not configured — block all admin access
    return new Response('Admin not configured', { status: 503 });
  }

  // Check Authorization header
  const authHeader = context.request.headers.get('Authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Check query param (dev convenience, not recommended in production)
  const queryToken = context.url.searchParams.get('token');

  const providedToken = bearerToken ?? queryToken;

  if (!providedToken || providedToken !== secret) {
    return new Response(
      `<!DOCTYPE html><html><body>
        <h1 style="font-family:monospace">401 — Unauthorized</h1>
        <p style="font-family:monospace">Provide a valid admin token.</p>
      </body></html>`,
      {
        status: 401,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  return next();
});
