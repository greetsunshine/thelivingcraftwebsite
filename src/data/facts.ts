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
// Public cohort logistics follow the V4 copy: no fee, start date or week count
// is published. Consulting pricing is PLACEHOLDER — see CLAUDE.md.

import { EXPLORES } from './cohort-copy';
import { COMMITMENT, FEES_NOTE } from './offer-display';
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
  companies: ['Google', 'Amazon', 'Walmart'],
  email: CONTACT_EMAIL,
  linkedin: 'https://linkedin.com/in/sunil-mathew-466615a',
  sameAs: ['https://linkedin.com/in/sunil-mathew-466615a'],
};

/** Public cohort facts that are safe to render or syndicate. */
export const publicCohort = {
  name: 'The Living Craft',
  commitment: COMMITMENT,
  size: 'Targets eight members',
  admission: 'By application, after a fit conversation',
  scheduleAndFees: FEES_NOTE,
  learningAreas: EXPLORES,
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
      'A live programme for experienced engineers and leaders who want to build an agentic system, examine its behaviour and guide the decisions behind it.',
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
    a: `The Living Craft is a live programme for experienced engineers, architects and engineering leaders. Members build a working agentic system with Sunil Mathew, explain its design, examine its behaviour and revise it through feedback. ${COMMITMENT}`,
    tags: ['course', 'program', 'cohort', 'training', 'bootcamp'],
  },
  {
    id: 'cohort-dates',
    surface: '/',
    q: 'When does the first cohort start?',
    a: 'The final session schedule is confirmed before joining. Apply or send an enquiry to discuss current availability; do not infer a start date from older material.',
    tags: ['start date', 'when', 'schedule', 'september', '2026', 'deadline'],
  },
  {
    id: 'cohort-size',
    surface: '/',
    q: 'How many people are in a cohort?',
    a: 'The open cohort targets eight members. Current availability is discussed during the fit conversation; this is a target, not a published capacity or scarcity claim.',
    tags: ['seats', 'size', 'class size', 'how many', 'capacity'],
  },
  {
    id: 'cohort-length',
    surface: '/',
    q: 'How long is the program and what is the time commitment?',
    a: `${COMMITMENT} The session schedule and the amount and interval of independent work are confirmed before joining.`,
    tags: ['duration', 'weeks', 'hours', 'commitment', 'time', 'part-time'],
  },
  {
    id: 'cohort-price',
    surface: '/',
    q: 'How much does the cohort cost?',
    a: FEES_NOTE,
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
    a: EXPLORES.map((item) => `${item.title}: ${item.body}`).join('\n'),
    tags: ['curriculum', 'syllabus', 'modules', 'weeks', 'topics', 'what will I learn'],
  },
  {
    id: 'cohort-outcomes',
    surface: '/',
    q: 'What will I be able to do afterwards?',
    a: 'Build a working agentic system and connect its behaviour to the architecture behind it. Practise explaining why a boundary exists, what evidence supports a decision, what you would change next, and how to review and guide a team\'s proposal.',
    tags: ['outcomes', 'learn', 'skills', 'takeaway', 'benefit'],
  },
  {
    id: 'cohort-who',
    surface: '/',
    q: 'Who is the cohort for?',
    a: 'Experienced engineers, architects and engineering leaders with prior system-design exposure, a learning goal, and the willingness to build, explain decisions and revise their work through feedback.',
    tags: ['who', 'audience', 'fit', 'prerequisites', 'eligibility', 'staff engineer'],
  },
  {
    id: 'cohort-apply',
    surface: '/',
    q: 'How do I apply?',
    a: `Submit the application form on the cohort page, or email ${practitioner.email}. Applying begins a fit conversation; it is not admission, payment or a confirmed place.`,
    tags: ['apply', 'application', 'enroll', 'sign up', 'register', 'join'],
  },
  {
    id: 'cohort-vs-course',
    surface: '/',
    q: 'Why this over a recorded course?',
    a: 'The programme uses a working system as the concrete object of discussion. Members build an approach, examine what happens, receive feedback and revise; the focus is practical design judgment rather than video consumption.',
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
    a: `Sunil Mathew brings engineering and leadership experience from ${practitioner.companies.join(', ')} and startups. His focus is the reasoning behind a system's design and the evidence that helps a team make its next decision. Based in ${practitioner.location}.`,
    tags: ['who', 'about', 'background', 'experience', 'bio', 'instructor', 'teacher', 'sunil'],
  },
  {
    // Retrieval must have a real answer here, not just silence. Without this
    // fact the query returns noise and the agent is one step from obliging
    // with something plausible — exactly the failure the hard rules forbid.
    id: 'about-social-proof',
    surface: 'practice',
    q: 'Do you have testimonials, client names, or student outcomes?',
    a: 'No testimonials, client names or student outcome counts are published. Sunil’s employment context involving Google, Amazon, Walmart and startups is published without implying employer endorsement. Ask Sunil directly if you need references.',
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
