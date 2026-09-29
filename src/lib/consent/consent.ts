// The visitor's choice about analytics and advertising tags, in one place.
//
// WHY THIS EXISTS. Until 29 September 2026 Google Tag Manager loaded as soon as
// a public page opened, and with it Google Analytics and Microsoft Clarity. The
// privacy page said so. The Digital Personal Data Protection Act asks for
// consent that is free, specific and informed before personal data is
// processed for a purpose like this, and the owner asked for a banner.
//
// THE RULE THE CODE ENFORCES, not a rule the tag manager is trusted to follow:
//
//   * NOTHING LOADS BEFORE A CHOICE. The container script is not even
//     requested until the visitor says yes to analytics. A refusal, or no
//     answer at all, means Google, Microsoft, Meta, LinkedIn and Apollo.io
//     receive nothing from this site's pages.
//   * ANALYTICS OPENS THE CONTAINER. Advertising rides inside it. The
//     advertising tags live in the same container, so they can only run when
//     analytics is also on. The advertising answer is handed to the container
//     as Google Consent Mode (`ad_storage`, `ad_user_data`,
//     `ad_personalization`) and as the data-layer variable
//     `lc_consent_advertising`. EVERY ADVERTISING TAG IN THE CONTAINER MUST
//     REQUIRE `ad_storage` (Tag settings, Consent settings, "Require additional
//     consent"). That half is configuration in the GTM console, which this
//     repository cannot see; CLAUDE.md and the privacy page say so.
//   * A CHOICE IS ONE COOKIE. `lc_consent`, readable by the page script because
//     the page script is what acts on it, kept for CONSENT_DAYS and then asked
//     again. It holds the two answers, the version and the date, and nothing
//     that identifies anybody. localStorage stays unused (CLAUDE.md).
//   * WITHDRAWING IS AS EASY AS GIVING. "Cookie choices" sits at the foot of
//     every page that carries the container, and on /privacy. Turning a
//     category off deletes the cookies those tags set on this site's domain
//     and reloads the page, because a tag that has already started cannot be
//     unloaded any other way.
//
// Bump CONSENT_VERSION when the list of tags or their purposes changes: every
// stored answer then counts as no answer, and the banner asks again.

export const CONSENT_COOKIE = 'lc_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_DAYS = 180;

export interface Consent {
  analytics: boolean;
  advertising: boolean;
  /** The day the choice was made, YYYY-MM-DD. */
  on: string;
}

/** `v1.a1.m0.2026-09-29`: version, analytics, marketing (advertising), date. */
export function serializeConsent(c: Consent): string {
  return `v${CONSENT_VERSION}.a${c.analytics ? 1 : 0}.m${c.advertising ? 1 : 0}.${c.on}`;
}

/** The stored choice, or null when there is none, it is malformed, or it is from an older version. */
export function parseConsent(raw: string | null | undefined): Consent | null {
  if (!raw) return null;
  const m = /^v(\d+)\.a([01])\.m([01])\.(\d{4}-\d{2}-\d{2})$/.exec(raw.trim());
  if (!m || Number(m[1]) !== CONSENT_VERSION) return null;
  return { analytics: m[2] === '1', advertising: m[3] === '1', on: m[4] };
}

/**
 * Cookies the tags set on this site's own domain, by name prefix, so they can
 * be deleted when a category is turned off. Cookies a company sets on its own
 * domain (Microsoft's MUID, LinkedIn's bcookie) cannot be reached from here;
 * the privacy page says so.
 */
export const ANALYTICS_COOKIE_PREFIXES = ['_ga', '_gid', '_gat', '_clck', '_clsk'];
export const ADVERTISING_COOKIE_PREFIXES = ['_fbp', '_fbc', '_gcl', 'li_', 'lms_', '_uet', 'ln_or'];
