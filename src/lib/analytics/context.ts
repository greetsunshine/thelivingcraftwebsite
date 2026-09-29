// Two facts the server adds to every recorded event, because the handoff of
// 29 September 2026 asks for them: "record environment and consent state".
//
//   env      which deployment wrote the row. A test on a preview must never be
//            counted as a real application, and until now nothing in the row
//            said where it came from.
//   consent  what the visitor had answered on the cookie banner when the event
//            happened: 'unset', or the two answers. It is read from the
//            `lc_consent` cookie the browser sent with the request, so it is
//            the same answer the tags obeyed.
//
// Neither is personal. The consent value is two booleans and a version, never
// the date inside the cookie.

import { env } from '../admin/env';
import { CONSENT_COOKIE, parseConsent } from '../consent/consent';

/** 'production', 'preview' or 'development'. Vercel sets VERCEL_ENV; a local server has none. */
export const environment = (): string => env('VERCEL_ENV') || 'development';

export type ConsentState = 'unset' | { analytics: boolean; advertising: boolean };

/** The visitor's answer on the cookie banner, from a raw Cookie header. */
export function consentFromHeader(cookieHeader: string | null): ConsentState {
  if (!cookieHeader) return 'unset';
  const hit = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!hit) return 'unset';
  let raw = hit.slice(CONSENT_COOKIE.length + 1);
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return 'unset';
  }
  const parsed = parseConsent(raw);
  return parsed ? { analytics: parsed.analytics, advertising: parsed.advertising } : 'unset';
}

/** Whether the visitor allowed analytics, which is what attribution cookies need. */
export const analyticsAllowed = (state: ConsentState): boolean =>
  state !== 'unset' && state.analytics;

/** The two fields, ready to spread into an event's `meta`. */
export const eventContext = (request: Request) => ({
  env: environment(),
  consent: consentFromHeader(request.headers.get('cookie')),
});
