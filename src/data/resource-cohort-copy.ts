// The cohort invitation on the tool and resource pages, in one place.
//
// Source: the outreach readiness handoff of 28 September 2026 (Alchemy),
// revised on 29 September (the second half of this file),
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

// ───────────────────────────────────────────────────────────────────────────
// The revised handoff of 29 September 2026
// ───────────────────────────────────────────────────────────────────────────
//
// Source: `04-website-Ein-handoff.html` and `public-copy/website/*.md` in the
// revised outreach readiness package. It adds three things to the per-page
// lines above: one positioning line, a programme summary for the footer, and
// one sentence "after the useful result" on tools, guides and templates.

/** The positioning line on every page of the revised package. */
export const POSITIONING = 'Build agentic systems that hold up in production.';

/** The month the cohort starts, from facts.ts ("October 2026" gives "October"). */
const START_MONTH = cohort.startsOn.split(' ')[0];

/**
 * The label of a button that leads to the application.
 *
 * The handoff's home page button is "Explore the October cohort". A month in a
 * button is a dated invitation, and a dated invitation must not outlive
 * enrolment. So it follows the same switch as the invitation line above.
 */
export const cohortCtaLabel = (now: Date = new Date()): string =>
  applicationsOpen(now) ? `Explore the ${START_MONTH} cohort` : 'Explore the cohort';

/**
 * The footer's programme summary. The handoff: "A solid deep-green footer holds
 * the programme summary, distinct application/team routes and legal/preferences
 * links." The hours and the name come from facts.ts.
 */
export const PROGRAMME_SUMMARY = `Practical building and review with ${practitioner.name}. ${cohort.liveHours} live hours plus independent work.`;

/** The second half of the "after the useful result" sentence. It is the same on every page. */
const USEFUL_RESULT_CLOSE = 'Build the wider reasoning through practical work and review in The Living Craft cohort.';

/**
 * What the reader has just examined, by topic. The handoff: "For memory, refer
 * to scope and correction; for cost, to budgets and recovery; for authority, to
 * permission at execution; for triage, to evidence after uncertainty."
 *
 * Nothing here says the reader can apply the whole toolkit to their own
 * system. The handoff forbids that until the offer is confirmed.
 */
const TOPIC_SENTENCE = {
  memory:
    'You have examined one operating decision: what an agent may remember, how far that memory reaches, and how a wrong memory is corrected.',
  cost: 'You have examined one operating decision: what the system may spend, and how it recovers when it reaches that budget.',
  authority:
    'You have examined one operating decision: whether the agent holds permission at the moment it executes an action.',
  triage:
    'You have examined one operating decision: what evidence the system needs before it acts after an uncertain result.',
  general: 'You have examined one operating decision.',
} as const;

type Topic = keyof typeof TOPIC_SENTENCE;

/** Which topic each page belongs to. A page not named here gets the general sentence. */
const TOPICS: Record<string, Topic> = {
  '/resources/agent-memory-audit-kit': 'memory',
  '/resources/run-cost-model': 'cost',
  '/resources/cost-ceiling-workbook': 'cost',
  '/resources/cost-ceiling-worksheet': 'cost',
  '/resources/rework-cost-check': 'cost',
  '/resources/agent-authority-review': 'authority',
  '/resources/rule-placement-audit': 'authority',
  '/resources/guides/tool-permissions': 'authority',
  '/resources/agent-failure-triage-kit': 'triage',
  '/resources/agent-failure-triage-quiz': 'triage',
  '/resources/guides/uncertain-evidence': 'triage',
};

/**
 * The sentence after the useful result, for one page. It names no date and no
 * figure, so it stays true after applications close.
 */
export const usefulResultFor = (path: string): string =>
  `${TOPIC_SENTENCE[TOPICS[path.replace(/\/+$/, '') || '/'] ?? 'general']} ${USEFUL_RESULT_CLOSE}`;

/**
 * The same sentence with the cohort's facts in it, for the closing row of a
 * page whose content is the useful result: a kit, a guide, a template or a
 * worksheet. There the foot of the page IS "after the useful result", so one
 * line does both jobs instead of two lines saying nearly the same thing.
 * After applications close it drops the date and becomes `usefulResultFor()`.
 */
export const closingResultNoteFor = (path: string, now: Date = new Date()): string => {
  const topic = TOPIC_SENTENCE[TOPICS[path.replace(/\/+$/, '') || '/'] ?? 'general'];
  if (!applicationsOpen(now)) return `${topic} ${USEFUL_RESULT_CLOSE}`;
  return `${topic} Build the wider reasoning through practical work and review in The Living Craft’s ${cohort.startsOn} cohort: ${cohort.liveHours} live hours with ${practitioner.name}, plus independent work.`;
};
