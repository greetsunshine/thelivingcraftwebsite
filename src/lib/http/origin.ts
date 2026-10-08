// ---------------------------------------------------------------------------
// The cross-site form check, moved here from Astro (astro.config.mjs).
// Called first thing in src/middleware.ts.
// ---------------------------------------------------------------------------
// The same rule as Astro's built-in check, copied from
// node_modules/astro/dist/core/app/middlewares.js: a POST, PUT, PATCH or
// DELETE that is form-like (or has no content type) and does not come from
// this origin is refused with a 403. One path is exempt, and only one:
//
//   /api/unsubscribe  RFC 8058 one-click unsubscribe. Gmail and Yahoo post
//                     `List-Unsubscribe=One-Click` as a form with no Origin
//                     header. The endpoint verifies a signed token before it
//                     does anything, which is the protection a same-origin
//                     check would otherwise give.
//
// Do not add to this list without the same argument.
const ORIGIN_EXEMPT = new Set(['/api/unsubscribe']);
const FORM_CONTENT_TYPES = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function crossSiteFormRefusal(request: Request, url: URL, path: string): Response | null {
  if (SAFE_METHODS.has(request.method) || ORIGIN_EXEMPT.has(path)) return null;
  const sameOrigin = request.headers.get('origin') === url.origin;
  if (sameOrigin) return null;
  const type = request.headers.get('content-type');
  const formLike = type === null || FORM_CONTENT_TYPES.some((t) => type.toLowerCase().includes(t));
  return formLike ? new Response(`Cross-site ${request.method} form submissions are forbidden`, { status: 403 }) : null;
}
