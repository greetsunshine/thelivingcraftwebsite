/**
 * HTTP Basic Auth gate for /admin/* and /api/admin/* routes.
 *
 * Env vars (set in Netlify → Site configuration → Environment variables):
 *   ADMIN_USERNAME   — the login username (e.g. "sunil")
 *   ADMIN_PASSWORD   — the login password (long random string)
 *
 * Credentials are compared in constant time to prevent timing attacks.
 * If either env var is missing, the gate is DISABLED and requests pass through —
 * this is intentional so dev environments don't break, but set both in prod.
 */

import type { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context): Promise<Response | void> => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api/admin')) {
    return;
  }

  const expectedUser = Deno.env.get('ADMIN_USERNAME');
  const expectedPass = Deno.env.get('ADMIN_PASSWORD');

  if (!expectedUser || !expectedPass) {
    // Gate disabled — pass through. Log once per request so it's visible.
    console.warn('[admin-auth] ADMIN_USERNAME or ADMIN_PASSWORD not set — gate disabled');
    return;
  }

  const header = request.headers.get('authorization') ?? '';
  const match = /^Basic\s+(.+)$/i.exec(header);
  if (!match) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = atob(match[1]);
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(':');
  if (sep === -1) return unauthorized();
  const providedUser = decoded.slice(0, sep);
  const providedPass = decoded.slice(sep + 1);

  if (!constantTimeEqual(providedUser, expectedUser) ||
      !constantTimeEqual(providedPass, expectedPass)) {
    return unauthorized();
  }

  return; // authorized — continue to the admin route
};

function unauthorized(): Response {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="The Living Craft Admin", charset="UTF-8"',
      'Content-Type': 'text/plain',
    },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const config = {
  path: ['/admin', '/admin/*', '/api/admin/*'],
};
