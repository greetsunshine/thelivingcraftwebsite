/**
 * The facts behind the two pathways and six offers under /programmes/, from
 * the 15 October 2026 landing-page package (docs/2026-10-15_living-craft-
 * landing-pages/, a static HTML mock-up kept outside the build).
 *
 * THIS IS THE ONE SOURCE FOR THESE OFFERS' FIGURES. Fees, live hours, session
 * hours and independent work are typed here once. The nine pages carry the
 * package's own markup and prose, the way every other page on this site
 * carries its copy, but every number in that prose is an expression that reads
 * from here: the offer line, the comparison tables, "Allow 4–5 hours per
 * week", "the one-hour session", the page titles and the meta descriptions. A
 * fee typed into a page is a fee that drifts from the table two sections
 * below it.
 *
 * It is a separate module rather than part of facts.ts because it imports
 * `practitioner` from there, and facts.ts re-exporting it would be a cycle.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PRICING REVIEW: NOT CALIBRATED. Every fee below is the package's figure and
 * is in rupees. Nothing here is gated by region the way `/`'s fee is
 * (regions.ts → publicPrice). Sunil to confirm all six figures. This branch is
 * staging only and must not merge (15 October 2026).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHAT IS NOT HERE YET, ON PURPOSE
 *   * Nothing in /llms.txt, /api/facts or the Ask agent's knowledge reads this
 *     module. Until it does, the agent knows the 30-hour cohort at `/` and
 *     nothing about these offers. It will say it does not know, which is the
 *     honest failure.
 *   * The Career Readiness Review has no fee. The package says the fee "is
 *     discussed before booking", so none is invented here.
 */
import { practitioner } from './facts';
import {
  CAREER_READINESS_REVIEW,
  HELP_ME_CHOOSE,
  OFFER_NAMES,
  PATHWAY_NAMES,
  type OfferSlug,
  type PathwayKey,
} from './programme-interests';

export type { OfferSlug, PathwayKey } from './programme-interests';

export interface Offer {
  slug: OfferSlug;
  pathway: PathwayKey;
  name: string;
  /** Live hours with Sunil. For a career package, the total one-to-one time. */
  hours: number;
  /** INR, as printed. See PRICING REVIEW at the top of this file. */
  fee: string;
  /** Build programmes only: the independent work, per week. */
  independentWork?: string;
}

const offer = (slug: OfferSlug, pathway: PathwayKey, hours: number, fee: string, independentWork?: string): Offer => ({
  slug,
  pathway,
  name: OFFER_NAMES[slug],
  hours,
  fee,
  independentWork,
});

// ---------------------------------------------------------------------------
// The figures. Everything numeric on the nine pages is built from these.
// ---------------------------------------------------------------------------

export const OFFERS: Record<OfferSlug, Offer> = {
  'focused-agent-build': offer('focused-agent-build', 'agentic-systems', 10, '₹40,000', '4–5 hours per week'),
  'design-and-build-a-poc': offer('design-and-build-a-poc', 'agentic-systems', 20, '₹80,000', '3–4 hours per week'),
  'design-to-deployment': offer('design-to-deployment', 'agentic-systems', 30, '₹1,20,000', '3–4 hours per week'),
  'focused-mock-interview': offer('focused-mock-interview', 'career-preparation', 1, '₹15,000'),
  'interview-preparation-and-practice': offer('interview-preparation-and-practice', 'career-preparation', 3, '₹30,000'),
  'agentic-ai-career-transition-roadmap': offer('agentic-ai-career-transition-roadmap', 'career-preparation', 4, '₹40,000'),
};

/** The Career Readiness Review's length. It has no published fee. */
export const READINESS_REVIEW_HOURS = 1;

export const offersIn = (pathway: PathwayKey): Offer[] => Object.values(OFFERS).filter((o) => o.pathway === pathway);

export { PATHWAY_NAMES, OFFER_NAMES };

// ---------------------------------------------------------------------------
// Words for numbers, as the package writes them
// ---------------------------------------------------------------------------

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
/** 3 → "three". */
export const word = (n: number): string => WORDS[n] ?? String(n);
/** 1 → "one-hour", 4 → "four-hour". */
export const hourWord = (n: number): string => `${word(n)}-hour`;
/** 3 → "three hours", 1 → "one hour". */
export const hoursWord = (n: number): string => `${word(n)} ${n === 1 ? 'hour' : 'hours'}`;
/** 1 → "1 hour", 3 → "3 hours". */
export const hoursFigure = (n: number): string => `${n} ${n === 1 ? 'hour' : 'hours'}`;
/** "4–5 hours per week" → "4–5 hours/week", the comparison table's form. */
export const perWeek = (s?: string): string => s?.replace(' per week', '/week') ?? '';
/** "3–4 hours per week" → "3–4 hours". */
export const withoutWeek = (s?: string): string => s?.replace(' per week', '') ?? '';

// ---------------------------------------------------------------------------
// Lines the package repeats
// ---------------------------------------------------------------------------

/**
 * "26 years of engineering experience, including roles at Google, Amazon and
 * Walmart Labs". The package names Walmart Labs; the user approved that
 * wording for these pages on 15 October. facts.ts, and so the rest of the
 * site, still says Walmart.
 */
export const EXPERIENCE = (() => {
  const c = practitioner.companies.map((name) => (name === 'Walmart' ? 'Walmart Labs' : name));
  return `${practitioner.yearsExperience} years of engineering experience, including roles at ${c.slice(0, -1).join(', ')} and ${c[c.length - 1]}`;
})();

/** The line above an offer page's heading: "Focused Agent Build · 10 live hours · ₹40,000 per participant". */
export const offerLine = (slug: OfferSlug): string => {
  const o = OFFERS[slug];
  if (o.pathway === 'agentic-systems') return `${o.name} · ${o.hours} live hours · ${o.fee} per participant`;
  if (o.hours === 1) return `${o.name} · ${hoursFigure(o.hours)} · ${o.fee}`;
  return `${o.name} · ${o.hours} hours of one-to-one sessions · ${o.fee}`;
};

/** The lowest fee in a pathway, for "Fees from …". Compared as numbers, printed as written. */
export const lowestFee = (pathway: PathwayKey): string => {
  const rupees = (s: string) => Number(s.replace(/[^\d]/g, ''));
  return offersIn(pathway).reduce((a, b) => (rupees(b.fee) < rupees(a.fee) ? b : a)).fee;
};

/** "10, 20 or 30". `and` for "10, 20 and 30-hour programmes". */
export const hoursList = (pathway: PathwayKey, last: 'or' | 'and' = 'or'): string => {
  const h = offersIn(pathway).map((o) => String(o.hours));
  return `${h.slice(0, -1).join(', ')} ${last} ${h[h.length - 1]}`;
};

// ---------------------------------------------------------------------------
// The enquiry form's "Programme or package" options, per page
// ---------------------------------------------------------------------------
// The options themselves are in programme-interests.ts (see why there). This
// narrows them to what each page offers, in the package's order.

export const interestsFor = (page: 'hub' | PathwayKey): string[] =>
  page === 'hub'
    ? [...(Object.keys(PATHWAY_NAMES) as PathwayKey[]), HELP_ME_CHOOSE.value]
    : page === 'agentic-systems'
      ? [...offersIn(page).map((o) => o.slug), HELP_ME_CHOOSE.value]
      : [...offersIn(page).map((o) => o.slug), CAREER_READINESS_REVIEW.value, HELP_ME_CHOOSE.value];
