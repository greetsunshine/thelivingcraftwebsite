/**
 * The names of the /programmes/ pathways and offers, and the enquiry form's
 * "Programme or package" options built from them.
 *
 * WHY THIS IS ITS OWN FILE. forms.ts reads these options, and RouteForm's
 * browser script imports forms.ts. Anything forms.ts imports ships to the
 * browser on every page with a form, `/` included. programme-offers.ts pulls in
 * facts.ts and through it the cohort copy and the regions. So the names live
 * here, with no imports, and programme-offers.ts reads them from here. Each
 * name is still written once.
 *
 * The stored value is the slug. The console turns it back into the name
 * through forms.ts, like every other choice field.
 */

export const PATHWAY_NAMES = {
  'agentic-systems': 'Build Agentic Systems',
  'career-preparation': 'Career Transition & Interview Preparation',
} as const;

export const OFFER_NAMES = {
  'focused-agent-build': 'Focused Agent Build',
  'design-and-build-a-poc': 'Design and Build a POC',
  'design-to-deployment': 'Design to Deployment',
  'focused-mock-interview': 'Focused Mock Interview',
  'interview-preparation-and-practice': 'Interview Preparation and Practice',
  'agentic-ai-career-transition-roadmap': 'Agentic AI Career Transition Roadmap',
} as const;

export type PathwayKey = keyof typeof PATHWAY_NAMES;
export type OfferSlug = keyof typeof OFFER_NAMES;

export const CAREER_READINESS_REVIEW = { value: 'career-readiness-review', label: 'Career Readiness Review' };
export const HELP_ME_CHOOSE = { value: 'help-me-choose', label: 'Help me choose' };

export const INTEREST_OPTIONS: { value: string; label: string }[] = [
  ...Object.entries(PATHWAY_NAMES).map(([value, label]) => ({ value, label })),
  ...Object.entries(OFFER_NAMES).map(([value, label]) => ({ value, label })),
  CAREER_READINESS_REVIEW,
  HELP_ME_CHOOSE,
];
