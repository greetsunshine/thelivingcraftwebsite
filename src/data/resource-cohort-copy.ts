// The cohort invitation on the tool and resource pages, in one place.
//
// Source: the outreach readiness handoff of 28 September 2026 (Alchemy),
// `website-cta-audit.csv`, column `proposed_copy`. Each resource page gets one
// line about what the reader just did, then one sentence about the cohort. The
// line is the handoff's wording; the cohort sentence is built from facts.ts,
// so the start date, the hours and the name cannot drift from the offer.
//
// DATE-AWARE. The handoff asks that no "October" invitation stays live after
// enrolment closes. `cohort.applicationsCloseOn` in facts.ts is that date, and
// it is null until somebody decides it. While it is null, or before it, the
// pages name `cohort.startsOn`; from that day on, every page served switches
// to the evergreen line. Files built ahead of time (the workbooks, the blank
// sheets, the memory kit PDF) keep the words they were built with: rebuild
// them when the date passes.
import { cohort, practitioner, SITE_ORIGIN } from './facts';

/** The absolute application address, for print and for files people keep. */
export const APPLY_URL = `${SITE_ORIGIN}/#apply`;

/** The cohort sentence while applications are open. */
export const COHORT_SENTENCE = `Explore The Living Craft’s ${cohort.startsOn} cohort: ${cohort.liveHours} live hours with ${practitioner.name}, plus independent work.`;

/** The handoff's wording for after enrolment closes. */
export const EVERGREEN_SENTENCE =
  'Build a working agentic system and develop the reasoning behind it. Explore The Living Craft and enquire about a future cohort.';

/** Whether applications for `cohort.startsOn` are still open on `now`. */
export const applicationsOpen = (now: Date = new Date()): boolean => {
  const closes = cohort.applicationsCloseOn;
  if (!closes) return true;
  const end = new Date(`${closes}T23:59:59+05:30`); // the end of that day in India
  return Number.isNaN(end.getTime()) || now <= end;
};

/** The line for a page the table below does not name. */
const GENERIC_LINE = 'Build a working agentic system and develop the reasoning behind it.';

/** One line per page, keyed by path, from the handoff's audit. */
const LINES: Record<string, string> = {
  '/resources/poc-screen': 'Test the idea before you widen the pilot.',
  '/resources/agent-authority-review': 'Decide where the agent may act and where people retain authority.',
  '/resources/model-selection-tool': 'Choose against evidence from the work, not a fluent demonstration.',
  '/resources/run-cost-model': 'Connect the cost of accepted work to the architecture you choose.',
  '/resources/cost-ceiling-workbook': 'Give every operating limit an owner and a recovery path.',
  '/resources/agent-memory-audit-kit': 'Make memory scope and correction part of the system design.',
  '/resources/rework-cost-check': 'Design rework loops and their limits together.',
  '/resources/rule-placement-audit': 'Put hard rules where the system can enforce them.',
  '/resources/agent-failure-triage-kit': 'Give each failure a recovery path your team can explain.',
  '/resources/agent-failure-triage-quiz': 'Turn your quiz takeaways into questions for a design review.',
  '/tools/agent-design-check': 'Take your unanswered design questions into practical work and review.',
  '/resources/cost-ceiling-worksheet': 'Make your cost assumptions explicit before the next release.',
  '/resources/evaluation-gates-worksheet': 'Connect evaluation evidence to a release decision.',
  '/resources/deployment-checklist': 'Give release checks evidence and a named owner.',
  '/resources/templates/agent-design-canvas': 'Explain the system as a set of decisions.',
  '/resources/templates/design-review-agenda': 'Make your review end with a change you can test.',
  '/resources/templates/decision-record': 'Keep the reason for the design alongside the design.',
  '/resources/templates/employer-funding-summary': 'Discuss employer support for your individual application.',
  '/resources/guides/workflow-or-agent': 'Choose the simplest approach that can do the work.',
  '/resources/guides/tool-permissions': 'Make authority an explicit design boundary.',
  '/resources/guides/uncertain-evidence': 'Keep uncertainty visible before the system acts.',
  '/resources/guides/agentic-system-design': 'Connect implementation with design judgment.',
};

/** The page's own line. A trailing slash on the path does not matter. */
export const cohortLineFor = (path: string): string =>
  LINES[path.replace(/\/+$/, '') || '/'] ?? GENERIC_LINE;

/** The whole invitation for one page: its line, then the cohort sentence. */
export const cohortInvitationFor = (path: string, now: Date = new Date()): string =>
  applicationsOpen(now) ? `${cohortLineFor(path)} ${COHORT_SENTENCE}` : EVERGREEN_SENTENCE;

/** The short line under a page's introduction (handoff item 2). */
export const INTRO_LINE = 'From The Living Craft, a live cohort on designing agentic systems.';
