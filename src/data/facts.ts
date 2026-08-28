// Canonical facts for the practice — the single source of truth.
//
// Four consumers read this file and nothing else:
//   1. JSON-LD structured data          (SEO — src/components/SeoHead.astro)
//   2. /llms.txt                        (AISO — src/pages/llms.txt.ts)
//   3. /api/facts                       (AISO + agent — machine-readable)
//   4. The visitor Q&A agent's grounding (src/lib/agent/knowledge.ts)
//
// The point of routing all four through one module is that a fact can never be
// current on the page and stale in the answer an AI assistant gives about us.
// Edit an offer here and every surface moves together.
//
// Cohort pricing/logistics live in regions.ts (per-region) and are imported
// rather than restated. Consulting pricing is PLACEHOLDER — see CLAUDE.md.

import { regions, type Region } from './regions';
import { CONTACT_EMAIL } from './site';

/** Canonical host. The apex + www are unattached today; learning. is what serves. */
export const SITE_ORIGIN = 'https://learning.thelivingcraft.ai';

export const canonical = (path: string) => new URL(path, SITE_ORIGIN).href;

/** A single retrievable fact. `q` seeds retrieval; `a` is the grounded answer. */
export interface Fact {
  id: string;
  /** Which surface this fact belongs to — lets the agent cite a page. */
  surface: '/' | '/caio' | '/assessment' | 'practice';
  q: string;
  a: string;
  /**
   * Answer varies by the visitor's region; `a` is a placeholder that retrieval
   * replaces. Set this and handle the id in knowledge.ts — a regional fact
   * whose answer is served raw would leak every region's figures at once.
   */
  regional?: boolean;
  /** Extra retrieval terms that don't appear in `q` or `a`. */
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Practitioner
// ---------------------------------------------------------------------------

export const practitioner = {
  name: 'Sunil Mathew',
  role: 'Fractional Chief AI Officer · Agentic & systems architecture instructor',
  location: 'Bengaluru, India',
  years: 26,
  companies: ['Google', 'Amazon', 'Walmart'],
  email: CONTACT_EMAIL,
  linkedin: 'https://linkedin.com/in/sunil-mathew-466615a',
  sameAs: ['https://linkedin.com/in/sunil-mathew-466615a'],
};

// ---------------------------------------------------------------------------
// Cohort — The Living Craft (/)
// ---------------------------------------------------------------------------

export const cohort = {
  name: 'The Living Craft',
  weeks: 6,
  seats: 8,
  startsOn: 'September 2026',
  commitment: '~5 hrs / week',
  format: 'Live online (Bangalore: hybrid — in person or online)',
  admission: 'By application; every application read personally',
  enrollment: 'Rolling until all 8 seats are filled',
  modules: [
    { id: 'M1', weeks: 'Week 1', title: 'Foundations of durable architecture' },
    { id: 'M2', weeks: 'Weeks 2–4', title: "Agentic systems you'd put your name on" },
    { id: 'M3', weeks: 'Week 5', title: 'Scale, consistency & the irreversible trade-offs' },
    { id: 'M4', weeks: 'Week 6', title: 'Your system, reviewed in the room' },
  ],
  outcomes: [
    'Design agentic systems with bounded failure, observability, and defensible cost',
    'Build the evaluation harnesses and quality gates that prove a system works',
    'Engineer reliability for models that are probabilistic by nature',
    'Threat-model and red-team your own system for prompt injection and exfiltration',
    'Govern an AI-native team — risk-tiered review and accountability for AI-written code',
  ],
};

/** Region pricing, read straight off the region config so it can't drift. */
export const cohortPricing = (Object.values(regions) as Region[]).map((r) => ({
  region: r.label,
  founding: r.price,
  standard: r.standardPrice ?? null,
  unit: r.priceUnit,
  /** Whether this figure may be stated publicly — regions.ts → publicPrice. */
  published: r.publicPrice,
}));

/**
 * The rates that may leave the building. Public consumers (/api/facts) read
 * this; the admin console reads `cohortPricing` and sees all three, because a
 * working number Sunil can't see in his own console is a number he'll restate
 * from memory somewhere else.
 */
export const publicCohortPricing = cohortPricing.filter((p) => p.published);

/**
 * Cohort price for ONE region — never the full list.
 *
 * The page has always shown a single region's rate (regions.ts + ?region=), but
 * the agent was quoting all three at once, so an Indian visitor heard about AED
 * and AUD they'll never pay. Pricing is answered through this function so the
 * conversation matches the page the visitor is looking at.
 *
 * With no region resolved, the honest move is to ask rather than list — hence
 * no fallback that dumps every rate.
 */
export const cohortPriceAnswer = (key?: Region['key'] | null): string => {
  if (!key || !regions[key]) {
    return [
      'Cohort pricing is set per region, and each region sees only its own rate.',
      "You do not know which region this visitor is in, so DO NOT quote a figure and DO NOT list the regions' rates.",
      'Ask which region they would be joining from (India, Dubai, or Australia), then call this tool again mentioning that region.',
    ].join(' ');
  }

  const r = regions[key];

  // Served, but the rate is not published (regions.ts → publicPrice). The agent
  // is the easiest surface on this site to state a number on, so it withholds
  // exactly as the page and the schema do — and is told not to reach for
  // another region's figure as a substitute.
  if (!r.publicPrice) {
    return [
      `The cohort runs in ${r.label}, but the ${r.label} rate is not published.`,
      'DO NOT state, estimate, or convert a figure, and DO NOT offer another region rate as a guide — the rates are not comparable.',
      `Say that pricing for ${r.label} is shared on application and that Sunil discusses it directly, then offer to take their details so he can follow up.`,
    ].join(' ');
  }

  const lines = [
    `${r.label}: ${r.price} ${r.priceUnit}.`,
    r.standardPrice
      ? `That is the founding rate for the first cohort; it rises to ${r.standardPrice} for the cohorts that follow.`
      : 'That is the founding rate for the first cohort; it rises for the cohorts that follow.',
    'Payment plans are available. Many participants expense the program through their employer; an ROI letter and itemised outline are provided.',
    `ONLY quote the ${r.label} figure. Do not mention what other regions pay, even if asked to compare — say pricing is set per region and Sunil can discuss another region directly.`,
  ];
  return lines.join(' ');
};

// ---------------------------------------------------------------------------
// Consulting — Fractional CAIO (/caio) and Assessment (/assessment)
// ---------------------------------------------------------------------------

export const caio = {
  name: 'Fractional Chief AI Officer',
  minimum: '90-day minimum',
  tiers: [
    { name: 'Advisory', days: '~2 days / month', from: '₹1,50,000 / month' },
    { name: 'Embedded', days: '~1 day / week', from: '₹3,50,000 / month' },
    { name: 'Transformation', days: '2–3 days / week', from: '₹6,00,000 / month' },
  ],
};

export const assessment = {
  name: 'AI Readiness Assessment',
  duration: '2–3 weeks',
  fee: '₹4,50,000',
  foundingFee: '₹3,50,000',
  foundingTerms: 'for the first three engagements',
  creditWindow: '60 days',
  creditNote:
    'Proceed to a fractional CAIO engagement within 60 days and the full assessment fee is credited toward your first month.',
};

/** Regulated-industry depth — a core differentiator; keep it prominent. */
export const regulatory = [
  'DPDP Act',
  'IRDAI',
  'RBI',
  'SEBI',
  'NIST AI RMF',
  'ISO 42001',
  'EU AI Act',
];

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export const surfaces = [
  {
    path: '/',
    name: 'The Living Craft — cohort',
    summary:
      'Application-only 6-week program in agentic & systems architecture. 8 seats, first cohort September 2026.',
  },
  {
    path: '/caio',
    name: 'Fractional Chief AI Officer',
    summary:
      'Board-facing consulting retainer. An embedded AI executive, part-time, accountable for outcomes.',
  },
  {
    path: '/assessment',
    name: 'AI Readiness Assessment',
    summary:
      'Fixed-fee, fixed-scope diagnostic producing a board-ready roadmap in 2–3 weeks. The front door.',
  },
];

// ---------------------------------------------------------------------------
// The grounded fact base
//
// Every answer the Q&A agent gives must trace to one of these. Written as
// question/answer pairs because that is how visitors ask and how AI search
// engines extract. Keep answers self-contained — retrieval returns them alone.
// ---------------------------------------------------------------------------

export const facts: Fact[] = [
  // --- Cohort ---
  {
    id: 'cohort-what',
    surface: '/',
    q: 'What is The Living Craft?',
    a: `The Living Craft is an application-only, ${cohort.weeks}-week program in agentic and systems architecture, taught live by Sunil Mathew. It teaches engineering judgment — the calls that only come from having shipped hard systems and lived with the consequences — rather than tools. The positioning spine is "AI builds, the human judges and directs."`,
    tags: ['course', 'program', 'cohort', 'training', 'bootcamp'],
  },
  {
    id: 'cohort-dates',
    surface: '/',
    q: 'When does the first cohort start?',
    a: `The first cohort starts ${cohort.startsOn}. Enrollment is rolling until all ${cohort.seats} seats are filled. Admission is by application and every application is read personally.`,
    tags: ['start date', 'when', 'schedule', 'september', '2026', 'deadline'],
  },
  {
    id: 'cohort-size',
    surface: '/',
    q: 'How many people are in a cohort?',
    a: `${cohort.seats} seats, capped. The cohort is kept deliberately small so every participant's architecture gets the room's full attention.`,
    tags: ['seats', 'size', 'class size', 'how many', 'capacity'],
  },
  {
    id: 'cohort-length',
    surface: '/',
    q: 'How long is the program and what is the time commitment?',
    a: `${cohort.weeks} weeks, live. The commitment is ${cohort.commitment}. Format is ${cohort.format}.`,
    tags: ['duration', 'weeks', 'hours', 'commitment', 'time', 'part-time'],
  },
  {
    id: 'cohort-price',
    surface: '/',
    q: 'How much does the cohort cost?',
    // Placeholder only — retrieval swaps this for cohortPriceAnswer(region) so
    // a visitor is never quoted a rate that isn't theirs. See knowledge.ts.
    a: 'Cohort pricing is regional and resolved per visitor.',
    regional: true,
    tags: [
      'price', 'cost', 'fee', 'fees', 'tuition', 'how much', 'payment',
      'discount', 'rupees', 'dirhams', 'dollars', 'afford', 'expensive',
      'pay', 'paying', 'charge', 'rate', 'pricing',
    ],
  },
  {
    id: 'cohort-curriculum',
    surface: '/',
    q: 'What does the curriculum cover?',
    a: cohort.modules.map((m) => `${m.id} (${m.weeks}): ${m.title}`).join('\n'),
    tags: ['curriculum', 'syllabus', 'modules', 'weeks', 'topics', 'what will I learn'],
  },
  {
    id: 'cohort-outcomes',
    surface: '/',
    q: 'What will I be able to do afterwards?',
    a: cohort.outcomes.map((o) => `- ${o}`).join('\n'),
    tags: ['outcomes', 'learn', 'skills', 'takeaway', 'benefit'],
  },
  {
    id: 'cohort-who',
    surface: '/',
    q: 'Who is the cohort for?',
    a: "Tech leads and staff engineers, senior engineering managers and architects, and senior engineering leaders and directors — people who make architectural calls their teams build on. Seniority on paper matters less than whether you've shipped something you had to live with.",
    tags: ['who', 'audience', 'fit', 'prerequisites', 'eligibility', 'staff engineer'],
  },
  {
    id: 'cohort-apply',
    surface: '/',
    q: 'How do I apply?',
    a: `Submit the application form on the cohort page, or email ${practitioner.email}. Sunil reads every application himself and replies by email. Admission is by application because the room only works if everyone in it can keep up and contribute.`,
    tags: ['apply', 'application', 'enroll', 'sign up', 'register', 'join'],
  },
  {
    id: 'cohort-vs-course',
    surface: '/',
    q: 'Why this over a recorded course?',
    a: "Recorded courses teach patterns, which are cheap and everywhere now. This is for the judgment that sits on top of the patterns — live, on your real systems, from someone who has been accountable for the outcome at scale. You're buying attention and 26 years of hard-won judgment, not videos.",
    tags: ['why', 'worth it', 'versus', 'compare', 'alternative', 'udemy', 'coursera'],
  },

  // --- Consulting: CAIO ---
  {
    id: 'caio-what',
    surface: '/caio',
    q: 'What is the fractional CAIO engagement?',
    a: 'An embedded AI executive, part-time and accountable for outcomes — owning the whole AI agenda rather than a corner of it: strategy, governance, and getting the first use cases into production. Aimed at India\'s regulated and mid-market enterprises.',
    tags: ['caio', 'consulting', 'fractional', 'chief ai officer', 'retainer', 'advisory'],
  },
  {
    id: 'caio-tiers',
    surface: '/caio',
    q: 'What are the CAIO engagement tiers and prices?',
    a: [
      ...caio.tiers.map((t) => `- ${t.name}: ${t.days} — from ${t.from}`),
      `${caio.minimum}. Payment plans available. Most engagements begin with an AI Readiness Assessment.`,
    ].join('\n'),
    tags: ['tiers', 'pricing', 'cost', 'retainer', 'monthly', 'how much', 'engagement'],
  },
  {
    id: 'caio-regulated',
    surface: '/caio',
    q: 'Do you work with regulated industries?',
    a: `Yes — regulated-industry depth is a core part of the practice. Working knowledge across ${regulatory.join(', ')}.`,
    tags: [
      'regulated',
      'compliance',
      'governance',
      'banking',
      'insurance',
      'financial services',
      ...regulatory.map((r) => r.toLowerCase()),
    ],
  },
  {
    id: 'caio-start',
    surface: '/caio',
    q: 'How do I start a consulting engagement?',
    a: `Book a discovery call or request a scope call from the CAIO page, or email ${practitioner.email}. Most engagements begin with an AI Readiness Assessment rather than going straight to a retainer.`,
    tags: ['start', 'begin', 'discovery call', 'scope call', 'contact', 'hire'],
  },

  // --- Consulting: Assessment ---
  {
    id: 'assessment-what',
    surface: '/assessment',
    q: 'What is the AI Readiness Assessment?',
    a: `A fixed-fee, fixed-scope diagnostic of your specific systems, data, and ambitions, delivered in ${assessment.duration}. It produces a board-ready roadmap: where you're ready, where you're exposed, and the shortest credible path to AI that ships and holds up. It is the front door to the practice.`,
    tags: ['assessment', 'diagnostic', 'readiness', 'audit', 'roadmap', 'evaluation'],
  },
  {
    id: 'assessment-price',
    surface: '/assessment',
    q: 'How much is the assessment?',
    a: `${assessment.fee} fixed fee, fixed scope. Founding rate: ${assessment.foundingFee} ${assessment.foundingTerms}.`,
    tags: ['price', 'cost', 'fee', 'how much', 'fixed fee'],
  },
  {
    id: 'assessment-credit',
    surface: '/assessment',
    q: 'Does the assessment fee count toward a retainer?',
    a: assessment.creditNote,
    tags: ['credit', 'discount', 'rebate', 'apply toward', 'refund', 'retainer'],
  },

  // --- Practitioner ---
  {
    id: 'about-sunil',
    surface: 'practice',
    q: 'Who is Sunil Mathew?',
    a: `${practitioner.years} years building and leading engineering at ${practitioner.companies.join(', ')}, on systems serving up to 100M+ users. Director/L7-level; led 150 engineers across the US, UK, China, and India. Based in ${practitioner.location}. Shipped a Generative-AI video editor and a Workspace platform running ~31 billion executions a week at Google, re-architected Amazon Prime's membership core, and modernised 300+ products at Walmart. Currently building an agentic-AI product and running a live enterprise AI-adoption engagement.`,
    tags: ['who', 'about', 'background', 'experience', 'bio', 'instructor', 'teacher', 'sunil'],
  },
  {
    // Retrieval must have a real answer here, not just silence. Without this
    // fact the query returns noise and the agent is one step from obliging
    // with something plausible — exactly the failure the hard rules forbid.
    id: 'about-social-proof',
    surface: 'practice',
    q: 'Do you have testimonials, client names, or student outcomes?',
    a: 'None are published. The cohort has not run yet — the first one starts September 2026 — and client engagements are not named publicly. What stands in for social proof is the track record: 26 years at Google, Amazon, and Walmart, 100+ senior engineers mentored, ~100 senior leaders and directors trained, and a live enterprise AI-adoption engagement in progress. Ask Sunil directly if you want references.',
    tags: [
      'testimonials',
      'reviews',
      'references',
      'case studies',
      'clients',
      'students',
      'alumni',
      'results',
      'social proof',
      'success stories',
      'who has taken this',
    ],
  },
  {
    id: 'about-contact',
    surface: 'practice',
    q: 'How do I get in touch?',
    a: `Email ${practitioner.email}, or use the form on any of the three pages. LinkedIn: ${practitioner.linkedin}.`,
    tags: ['contact', 'email', 'reach', 'get in touch', 'linkedin', 'call'],
  },
  {
    id: 'about-surfaces',
    surface: 'practice',
    q: 'What are the different offerings and how do they relate?',
    a: [
      'Three cross-linked surfaces:',
      ...surfaces.map((s) => `- ${s.path} — ${s.name}: ${s.summary}`),
      'The assessment is the front door, the CAIO retainer is the expansion, and the cohort is capability transfer for your team.',
    ].join('\n'),
    tags: ['offerings', 'services', 'options', 'difference', 'which', 'compare'],
  },
];

/** FAQ entries promoted into FAQPage structured data, per surface. */
export const faqFor = (surface: Fact['surface']) =>
  facts.filter((f) => f.surface === surface);
