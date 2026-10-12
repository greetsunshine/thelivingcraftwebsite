// How the traffic detail pages name a referring host and a country, in one
// place. /craft/admin/traffic/page and /craft/admin/traffic/step both read
// these, so the two views cannot label the same referrer two ways.

import { SITE_ORIGIN } from '../../data/facts';

export const selfHost = new URL(SITE_ORIGIN).hostname;

/**
 * Our own preview deployments are named after the Vercel project
 * (`thelivingcraft-<hash>-<team>.vercel.app`). Any other *.vercel.app host is
 * somebody else's site and counts as another website.
 */
export const isPreview = (host: string): boolean =>
  host.endsWith('.vercel.app') && (host === 'thelivingcraft.vercel.app' || host.startsWith('thelivingcraft-'));

/** This site or one of its previews: a visitor moving between our own pages. */
export const isSelf = (host: string): boolean => host === selfHost || isPreview(host);

export const sourceLabel = (host: string): string =>
  host === selfHost ? 'This site (another page)' : isPreview(host) ? 'A preview deployment of this site' : host;

// Country codes as names, from the runtime's own table rather than a list typed
// out here. Falls back to the bare code if the runtime has no table.
let names: Intl.DisplayNames | null = null;
try {
  names = new Intl.DisplayNames(['en'], { type: 'region' });
} catch {
  names = null;
}

export const countryName = (code: string): string =>
  names && /^[A-Z]{2}$/.test(code) ? `${names.of(code) ?? code} (${code})` : code;
