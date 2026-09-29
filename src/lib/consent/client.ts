// The browser half of the consent banner: reads and writes the choice, draws
// the banner, and loads Google Tag Manager only after a yes to analytics.
// Read consent.ts first; it holds the rules and the cookie format.
//
// The banner is built here, in script, so its styles live in ConsentBanner.astro
// as `is:global` rules under `.lc-consent`. Scoped styles never reach elements a
// script creates (CLAUDE.md, BookingWidget).

import {
  ADVERTISING_COOKIE_PREFIXES,
  ANALYTICS_COOKIE_PREFIXES,
  CONSENT_COOKIE,
  CONSENT_DAYS,
  parseConsent,
  serializeConsent,
  type Consent,
} from './consent';

type Win = Window & { dataLayer?: unknown[]; lcTagsLoaded?: boolean };
const w = window as Win;

function readConsent(): Consent | null {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(hit ? decodeURIComponent(hit.slice(CONSENT_COOKIE.length + 1)) : null);
}

function writeConsent(c: Consent) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serializeConsent(c))}; Max-Age=${CONSENT_DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
}

const today = () => new Date().toISOString().slice(0, 10);

// ── the tags ──────────────────────────────────────────────────────────────

function gtag(..._args: unknown[]) {
  // Consent Mode reads the `arguments` object, not an array, so this must push
  // `arguments` itself, exactly as Google's own snippet does.
  // eslint-disable-next-line prefer-rest-params
  (w.dataLayer = w.dataLayer || []).push(arguments);
}

const modeFor = (c: Consent) => ({
  analytics_storage: c.analytics ? 'granted' : 'denied',
  ad_storage: c.advertising ? 'granted' : 'denied',
  ad_user_data: c.advertising ? 'granted' : 'denied',
  ad_personalization: c.advertising ? 'granted' : 'denied',
});

function tellContainer(c: Consent) {
  (w.dataLayer = w.dataLayer || []).push({
    event: 'lc_consent',
    lc_consent_analytics: c.analytics,
    lc_consent_advertising: c.advertising,
  });
}

function loadTags(gtmId: string, c: Consent) {
  if (w.lcTagsLoaded || !c.analytics) return;
  w.lcTagsLoaded = true;
  gtag('consent', 'default', { ...modeFor(c), functionality_storage: 'granted', security_storage: 'granted' });
  tellContainer(c);
  (w.dataLayer = w.dataLayer || []).push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.append(s);
}

function clearCookies(prefixes: string[]) {
  const names = document.cookie
    .split('; ')
    .map((c) => c.split('=')[0])
    .filter((n) => prefixes.some((p) => n.startsWith(p)));
  // A tag may have set the cookie on this host or on any parent domain.
  const parts = location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; Domain=.${parts.slice(i).join('.')}`);
  for (const n of names) for (const d of domains) document.cookie = `${n}=; Max-Age=0; Path=/${d}`;
}

// ── the banner ────────────────────────────────────────────────────────────

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};

function build(onSave: (c: Consent) => void): { root: HTMLElement; open: (focus: boolean) => void } {
  const root = el('section', 'lc-consent');
  root.setAttribute('aria-labelledby', 'lc-consent-title');
  root.hidden = true;
  const inner = el('div', 'lc-consent-inner');
  const title = el('p', 'lc-consent-title', 'Cookies on this site');
  title.id = 'lc-consent-title';
  title.tabIndex = -1;
  const body = el('p', 'lc-consent-body');
  body.append(
    'I would like to use analytics (Google Analytics, Microsoft Clarity) and advertising tags (Meta, LinkedIn, Apollo.io). None of them loads unless you say yes. The site works the same either way. ',
  );
  const more = el('a', 'lc-consent-link', 'What each one does');
  more.href = '/privacy#tags';
  body.append(more);

  const choices = el('div', 'lc-consent-choices');
  choices.hidden = true;
  const box = (id: string, label: string, detail: string) => {
    const row = el('label', 'lc-consent-choice');
    row.htmlFor = id;
    const input = el('input');
    input.type = 'checkbox';
    input.id = id;
    const text = el('span');
    text.append(el('strong', undefined, label), el('span', 'lc-consent-detail', detail));
    row.append(input, text);
    choices.append(row);
    return input;
  };
  const analytics = box(
    'lc-consent-analytics',
    'Analytics',
    'Google Analytics and Microsoft Clarity. They count visits and record how pages are used.',
  );
  const advertising = box(
    'lc-consent-advertising',
    'Advertising',
    'Meta, LinkedIn and Apollo.io. They measure adverts and outreach, and identify visiting companies. They load with the analytics tags, so they only run when analytics is also on.',
  );

  const actions = el('div', 'lc-consent-actions');
  const accept = el('button', 'lc-consent-btn', 'Accept all');
  const reject = el('button', 'lc-consent-btn', 'Reject all');
  const choose = el('button', 'lc-consent-btn lc-consent-btn-quiet', 'Choose');
  for (const b of [accept, reject, choose]) b.type = 'button';
  actions.append(accept, reject, choose);

  inner.append(title, body, choices, actions);
  root.append(inner);

  const done = (c: Omit<Consent, 'on'>) => {
    root.hidden = true;
    choices.hidden = true;
    choose.textContent = 'Choose';
    onSave({ ...c, on: today() });
  };
  accept.addEventListener('click', () => done({ analytics: true, advertising: true }));
  reject.addEventListener('click', () => done({ analytics: false, advertising: false }));
  choose.addEventListener('click', () => {
    if (choices.hidden) {
      choices.hidden = false;
      choose.textContent = 'Save my choices';
      analytics.focus();
    } else {
      done({ analytics: analytics.checked, advertising: advertising.checked });
    }
  });
  root.addEventListener('keydown', (e) => {
    // Escape closes a banner the visitor reopened; a first-visit banner stays
    // until a choice is made, because no answer is the same as no.
    if (e.key === 'Escape' && root.dataset.reopened === 'true') root.hidden = true;
  });

  const open = (focus: boolean) => {
    const c = readConsent();
    analytics.checked = c?.analytics ?? false;
    advertising.checked = c?.advertising ?? false;
    root.dataset.reopened = String(focus);
    // A reopened banner shows the current answer straight away.
    choices.hidden = !focus;
    choose.textContent = focus ? 'Save my choices' : 'Choose';
    root.hidden = false;
    if (focus) title.focus();
  };
  document.body.append(root);
  return { root, open };
}

/** "Cookie choices" beside the Privacy link at the foot of the page. */
function footerLink() {
  const privacy = document.querySelector<HTMLAnchorElement>('footer a[href="/privacy"]');
  if (!privacy || document.querySelector('[data-consent-open].lc-consent-footer')) return;
  const b = el('button', 'lc-consent-footer', 'Cookie choices');
  b.type = 'button';
  b.dataset.consentOpen = '';
  privacy.after(document.createTextNode(' · '), b);
}

export function mountConsent() {
  const gtmId = document.querySelector<HTMLMetaElement>('meta[name="lc-tags"]')?.content || null;
  const before = readConsent();

  const banner = build((c) => {
    const prior = readConsent();
    writeConsent(c);
    if (!gtmId) return; // /privacy: the choice is saved and nothing loads here
    const withdrawn = (prior?.analytics && !c.analytics) || (prior?.advertising && !c.advertising);
    if (withdrawn) {
      clearCookies([...(c.analytics ? [] : ANALYTICS_COOKIE_PREFIXES), ...(c.advertising ? [] : ADVERTISING_COOKIE_PREFIXES)]);
      if (w.lcTagsLoaded) {
        gtag('consent', 'update', modeFor(c));
        location.reload();
      }
      return;
    }
    if (w.lcTagsLoaded) {
      gtag('consent', 'update', modeFor(c));
      tellContainer(c);
    } else {
      loadTags(gtmId, c);
    }
  });

  document.addEventListener('click', (e) => {
    const t = (e.target as Element | null)?.closest?.('[data-consent-open]');
    if (!t) return;
    e.preventDefault();
    banner.open(true);
  });

  if (gtmId) {
    footerLink();
    if (before) loadTags(gtmId, before);
    else banner.open(false);
  }
}
