// The browser half of attribution: remember where a visit began, with consent.
//
// Read the head of attribution.ts first; it says why this exists and what the
// two cookies hold. In short:
//
//   * Every public page asks "is this page view an arrival?" (`arrivalTouch`).
//     A page reached from another page of ours, with no tags, is not.
//   * If it is an arrival AND the visitor has said yes to analytics on the
//     cookie banner, the arrival is written to `lc_last` (a session cookie,
//     replaced by each new arrival) and, if there is none yet, to `lc_first`
//     (400 days, never replaced).
//   * The banner can be answered after the page has loaded. So the arrival is
//     kept in this module's memory for the life of the page, and written when
//     the banner reports a yes (`lc:consent`, from src/lib/consent/client.ts).
//     Nothing is kept anywhere else before that answer.
//
// Turning analytics off on the banner deletes both cookies, through
// ANALYTICS_COOKIE_PREFIXES in src/lib/consent/consent.ts.
//
// No localStorage and no sessionStorage: the no-storage rule in CLAUDE.md
// holds. These are cookies because the server has to read them with the form.

import {
  arrivalTouch,
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_MAX_AGE,
  SESSION_TOUCH_COOKIE,
  serialiseTouch,
  type Touch,
} from './attribution';
import { CONSENT_COOKIE, parseConsent, type Consent } from '../consent/consent';

const cookie = (name: string): string | null => {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
};

const analyticsYes = (c: Consent | null): boolean => Boolean(c?.analytics);

const readConsent = (): Consent | null => {
  const raw = cookie(CONSENT_COOKIE);
  try {
    return parseConsent(raw ? decodeURIComponent(raw) : null);
  } catch {
    return null;
  }
};

function write(name: string, value: string, maxAge: number | null) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  const age = maxAge === null ? '' : `; Max-Age=${maxAge}`;
  document.cookie = `${name}=${value}${age}; Path=/; SameSite=Lax${secure}`;
}

function remember(touch: Touch) {
  const value = serialiseTouch(touch);
  write(SESSION_TOUCH_COOKIE, value, null);
  if (!cookie(FIRST_TOUCH_COOKIE)) write(FIRST_TOUCH_COOKIE, value, FIRST_TOUCH_MAX_AGE);
}

export function mountTouchCapture(): void {
  let arrival: Touch | null = null;
  try {
    arrival = arrivalTouch({
      search: location.search,
      referrer: document.referrer,
      path: location.pathname,
      selfHost: location.hostname,
      at: new Date().toISOString(),
    });
  } catch {
    return;
  }
  if (!arrival) return;

  const touch = arrival;
  try {
    if (analyticsYes(readConsent())) remember(touch);
  } catch {
    /* attribution never breaks a page */
  }

  document.addEventListener('lc:consent', (e) => {
    try {
      const c = (e as CustomEvent<Consent>).detail;
      if (analyticsYes(c)) remember(touch);
    } catch {
      /* same rule */
    }
  });
}
