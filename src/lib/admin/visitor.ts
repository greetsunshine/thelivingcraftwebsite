// Deriving the little we keep about a visitor, from the request rather than
// from the client's claims.
//
// The design constraint is that "how many people came" should be answerable
// without holding anything that identifies a person tomorrow. So:
//
//   * The raw IP is never written anywhere. It is hashed with a server-side
//     salt AND today's date, so the identifier changes at midnight UTC and the
//     same visitor next week is a different row. Cross-day tracking is not
//     merely unimplemented, it is not reconstructible from what we store.
//   * Country comes from Vercel's edge header, not from a geo-IP lookup we run.
//   * The user agent is reduced to 'mobile' | 'desktop' | 'bot' and discarded.
//
// This is deliberately weaker than a real analytics product. It answers the
// questions on the console and nothing else, which is the point.

import { env } from './env';

const enc = new TextEncoder();

export async function visitorHash(request: Request, clientAddress: string): Promise<string> {
  const salt = env('ANALYTICS_SALT') || env('ADMIN_SESSION_SECRET') || 'unsalted';
  const day = new Date().toISOString().slice(0, 10);
  const ua = request.headers.get('user-agent') ?? '';

  const digest = await crypto.subtle.digest(
    'SHA-256',
    enc.encode(`${salt}|${day}|${clientAddress}|${ua}`),
  );
  // 16 hex chars is ample to separate visitors within one day and far too
  // short to be useful as a durable identifier.
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const BOT = /bot|crawl|spider|slurp|headless|preview|monitor|lighthouse|curl|wget|python-requests/i;

export function deviceOf(request: Request): 'mobile' | 'desktop' | 'bot' {
  const ua = request.headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return 'bot';
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
}

export const countryOf = (request: Request): string | null =>
  request.headers.get('x-vercel-ip-country')?.toUpperCase() || null;

/**
 * Referrers are stored as a bare host, never the full URL.
 *
 * A full referrer can carry a query string with someone's search terms or a
 * session token from the linking site. The host answers "where did they come
 * from"; the rest is somebody else's data that we have no use for.
 */
export function referrerHost(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '');
    return host.slice(0, 120) || null;
  } catch {
    return null;
  }
}

/** Trim, collapse, cap — the same shape as the lead-capture field guard. */
export const clean = (v: unknown, max = 300): string | null => {
  if (typeof v !== 'string') return null;
  const out = v.replace(/\s+/g, ' ').trim().slice(0, max);
  return out || null;
};
