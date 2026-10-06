// The marketing wordings for the resource follow-ups, one per module.
//
// ───────────────────────────────────────────────────────────────────────────
// WHERE THE WORDS COME FROM, AND WHICH ONES ARE OURS
// ───────────────────────────────────────────────────────────────────────────
//
// The outreach readiness package (28 September 2026, revised 29 September)
// supplies, per module, a subject line, a primary call to action and one line
// of cohort copy (email-cta-placements), and full bodies for two modules only,
// LC-T10 and LC-T11 (additional-resource-emails). "The placement matrix covers
// all twenty existing resource modules" -- but the twenty bodies themselves are
// not in the package. So for the twenty, the body below is ASSEMBLED HERE from
// the resource's own published description (src/data/resources.ts and the
// pages), the package's subject and CTA, and the package's placement rule:
// "Keep the resource as the email's primary practical action. Put the cohort
// invitation in one clear section after that value, before visible
// unsubscribe/preferences links."
//
// NONE OF THEM IS APPROVED. They are stored like the twelve and the delivery
// wordings, with approved_at null, and every eligibility check reads that as
// "hold". Approval is a named act in the console. Until then a follow-up is
// planned, queued and held, and the console shows exactly that.
//
// ───────────────────────────────────────────────────────────────────────────
// THESE INTERPOLATE, AND THAT IS A DELIBERATE DEPARTURE
// ───────────────────────────────────────────────────────────────────────────
//
// The twelve and the delivery wordings interpolate nothing: the body on the
// row is the body that was approved. A follow-up cannot work that way, because
// the brief asks every one to acknowledge what THIS person asked for and to
// carry THEIR name. So a follow-up body carries four placeholders, and the
// approved text is the text WITH the placeholders in it:
//
//   {{first_name}}          the person's first name, or nothing
//   {{relevance}}           at most one relevance sentence (relevanceSentence()
//                           below), or the paragraph is removed
//   {{cohort_invitation}}   the date-aware cohort block (resource-cohort-copy.ts):
//                           the October invitation while applications are open,
//                           the evergreen sentence after they close
//   {{action:unsubscribe}}  the signed one-click link, minted at dispatch
//
// The resource brief (05-email-and-resource-routing): "The complete email
// modules work with 'Hi,' and no extra relevance sentence." So every body
// below reads correctly with the {{relevance}} paragraph removed.
//
// The substitution happens at queue time in drip.ts, from data this codebase
// owns (the person row, the catalogue, facts.ts). Nothing typed by anybody
// reaches a body except the first name, and that is escaped by the HTML
// renderer. The content hash is computed over the placeholder form, so a
// reworded placeholder is still a new version.
//
// The footer -- who we are, a postal address, the preferences link -- is NOT
// in the body. The package: "Ein must append the existing verified footer at
// send time and suppress dispatch if links are missing." The provider adapter
// appends it (html.ts) and refuses to send without an unsubscribe link.

import type { PackageTemplate } from './templates';
// With the extension, so `node --test` can load this module directly.
import { DRIP_MODULES } from '../../data/resource-routing.ts';

/**
 * The package these words answer to. A new form of words is a new version.
 *
 * '.2' since 6 October 2026: the acknowledgement line became the brief's
 * relevance sentence, and the confirmation request was added. The first
 * version's rows stay in the store under 'LC-OUTREACH-2026-09-29' and are
 * never selected again.
 */
export const DRIP_PACKAGE_VERSION = 'LC-OUTREACH-2026-09-29.2';

export const SIGN_OFF = 'Sunil Mathew · The Living Craft';

/** The bridge, the paragraph and the cohort line per module. */
interface Wording {
  subject: string;
  /** Why this follows what they asked for. One sentence. */
  bridge: string;
  /** What the resource is. From the register. */
  about: string;
  /** The package's one line of cohort copy for this module. */
  cohortLine: string;
}

const W: Record<string, Wording> = {
  'LC-T01': {
    subject: 'Before the pilot, screen the idea',
    bridge: 'The next question is usually whether the idea deserves a pilot at all.',
    about:
      'The POC Selection Tool scores an agent proof of concept before anyone builds it. Twelve questions in four sections, each answered 0, 1 or 2, and one hard gate: can you survive the agent being wrong? The page shows the score as you go and reads it against a rubric you can read in full.',
    cohortLine: 'Test the idea before you widen the pilot.',
  },
  'LC-T02': {
    subject: 'Where should the agent stop?',
    bridge: 'The next decision is usually where the agent may act on its own and where a person keeps the final word.',
    about:
      'The Agent Authority Review takes the steps of one workflow and asks three questions of each: is there one right answer, what does it cost to undo, and what does a second run do. It names the owner of each step beside it: code, an agent with an eval set, or an agent that suggests while a person approves.',
    cohortLine: 'Decide where the agent may act and where people retain authority.',
  },
  'LC-T03': {
    subject: 'Choose a model for a job, not a reputation',
    bridge: 'Once the step is defined, the question becomes which model to staff it with, and on what evidence.',
    about:
      'The Model Selection Tool scores one candidate model for one step of your system. Ten deployment gates from the model card, twelve behaviours scored from ten runs on four test cases you build yourself, and four disqualifiers. The weighted score is read against a rubric you can read in full.',
    cohortLine: 'Choose against evidence from the work, not a fluent demonstration.',
  },
  'LC-T04': {
    subject: 'Before retrying, check what actually happened',
    bridge: 'Every system that acts will eventually get a no from a checker. What happens next is a design decision, not an accident.',
    about:
      'The Agent Failure Triage Kit says what an agent should do after a checker says no: four triage questions in order, a response playbook, retry budgets by tool type, a reconciliation checklist and twelve failure injections to run against your own system.',
    cohortLine: 'Give each failure a recovery path your team can explain.',
  },
  'LC-T05': {
    subject: 'Memory needs a scope and a correction path',
    bridge: 'Once an agent remembers anything, the question is what it may remember, for how long, and who can correct it.',
    about:
      'The Agent Memory Audit Kit is a memory record schema, twelve audit questions, seven runnable failure tests and a one-page decision table, for agent memory that stays correct after the demo.',
    cohortLine: 'Make memory scope and correction part of the system design.',
  },
  'LC-T06': {
    subject: 'Where is that rule actually enforced?',
    bridge: 'A rule written in a prompt is a request. The audit shows which of your rules are requests and which are enforced.',
    about:
      'The Rule Placement Audit lists the rules your agent must never break and finds where each one is actually enforced: in code, in a prompt, by a critic model, or nowhere. Your rows stay in your browser.',
    cohortLine: 'Put hard rules where the system can enforce them.',
  },
  'LC-T07': {
    subject: 'What does an acceptable outcome cost?',
    bridge: 'The budget conversation usually comes next, and the model bill is the smallest part of it.',
    about:
      'The Run-Cost Model costs four ways of doing the same job over one period: a rules workflow, the same rules rebuilt on a written spec, a model that drafts while a person approves, and a full agent with tools. Build cost is kept apart from run cost, and the number it lands on is cost per acceptable outcome.',
    cohortLine: 'Connect the cost of accepted work to the architecture you choose.',
  },
  'LC-T08': {
    subject: 'A spending ceiling needs more than a per-call limit',
    bridge: 'Once the cost per outcome is known, the next question is the ceiling: what one workflow may spend before it stops, and who owns that number.',
    about:
      'The Cost-Ceiling Workbook is a working model of what one agent workflow is allowed to spend: token-level cost per attempt, concurrency overshoot and the cost of stopping at the budget. The calculator on the page is live and stores nothing.',
    cohortLine: 'Give every operating limit an owner and a recovery path.',
  },
  'LC-T09': {
    subject: 'Give your next design review a starting point',
    bridge: 'Before the next review meeting, it helps to know which questions about the design nobody on the team can answer yet.',
    about:
      'The Agent Design Check is nineteen questions about a design you already have, checked against rules you can read in full, with the next step beside each one. It gives no score, and your answers never leave your browser.',
    cohortLine: 'Take your unanswered design questions into practical work and review.',
  },
  'LC-R01': {
    subject: 'Put the cost boundary on one worksheet',
    bridge: 'The number is only useful once it is written down where a reviewer can challenge it.',
    about:
      'The Cost-Ceiling Worksheet defines what one workflow is allowed to spend or repeat, what happens at the boundary and who reviews the result. The page is the resource: read it, fill it in or print it, and take the CSV if a spreadsheet is easier.',
    cohortLine: 'Make your cost assumptions explicit before the next release.',
  },
  'LC-R02': {
    subject: 'What evidence would let this design move forward?',
    bridge: 'After the design comes the harder question: what evidence would let it move forward, and what would stop it.',
    about:
      'The Evaluation Gates Worksheet connects a requirement to the evidence for it and to a release decision. Begin with one behaviour the system must demonstrate, and name the unacceptable outcomes before the review meeting rather than during it.',
    cohortLine: 'Connect evaluation evidence to a release decision.',
  },
  'LC-R03': {
    subject: 'Review deployment before the release meeting',
    bridge: 'When the design holds up, the release meeting is where it meets operations.',
    about:
      'The Deployment Checklist makes a release operable by naming the action, the owner, the evidence and the recovery path for each item. Adapt it to your own risks; a long checklist is not a substitute for effective controls.',
    cohortLine: 'Give the release an owner, evidence and a recovery path for each item.',
  },
  'LC-TPL01': {
    subject: 'Put the design on one canvas',
    bridge: 'The design is easier to review once it fits on one page that everyone in the room is reading.',
    about:
      'The agent design canvas puts one agentic design on one page: purpose and boundary, evidence, tool permissions, external actions, evaluation, recovery and ownership. It comes as a blank you can fill in and as a completed illustrative example.',
    cohortLine: 'Take the canvas into practical building and review.',
  },
  'LC-TPL02': {
    subject: 'A design review needs a decision at the end',
    bridge: 'A review without an agenda ends in a conversation. This one ends in a decision.',
    about:
      'The design review agenda runs a review that ends in a decision: what is being decided, what evidence is on the table, what is out of scope, and who owns the follow-up. Blank and completed versions download as Markdown.',
    cohortLine: 'Practise the review with a working system in front of you.',
  },
  'LC-TPL03': {
    subject: 'Keep the reason behind the decision',
    bridge: 'Six months on, the decision is remembered and the reason is not. The record is what keeps the reason.',
    about:
      'The decision record keeps the reason behind a decision where the next person can find it: context, the options considered, what was chosen, what it costs and when to revisit it. Blank and completed versions download as Markdown.',
    cohortLine: 'Make the reasoning behind each decision something your team can defend.',
  },
  'LC-TPL04': {
    subject: 'Make an employer-funding conversation clearer',
    bridge: 'If the next step is asking your team to fund the work, the ask goes better on one page.',
    about:
      'The employer funding summary sets out a learning request the way a manager needs to read it: what the work is, what it costs, what the team gets back and when. It comes as a blank and as a completed illustrative example.',
    cohortLine: 'Bring the cohort to your team as a funded, reviewable plan.',
  },
  'LC-G01': {
    subject: 'Does this workflow need an agent?',
    bridge: 'The first decision is whether this needs an agent at all.',
    about:
      'Workflow or Agent? is the guide to the first decision: whether the job needs an agent at all, or a workflow with a model in one step. It gives the test to apply and the cases where each answer is right.',
    cohortLine: 'Make the workflow-or-agent call against a system you build yourself.',
  },
  'LC-G02': {
    subject: 'Give tools the authority the workflow needs',
    bridge: 'The next design decision is what each tool is allowed to do, and where that limit lives.',
    about:
      'The Tool Permissions guide works through what each tool may do, where that limit is actually enforced, and when a named person has to approve before a tool runs.',
    cohortLine: 'Set tool permissions on a working system, then defend them in review.',
  },
  'LC-G03': {
    subject: 'What should happen when the evidence is uncertain?',
    bridge: 'Every evaluation eventually returns a result nobody can read. The guide is about what happens then.',
    about:
      'The Uncertain Evidence guide is about the case every system meets: the agent cannot establish what it needs. It shows how to design the path from an uncertain result to a known outcome, with an owner when the evidence stays incomplete.',
    cohortLine: 'Design the uncertain path with a system in front of you.',
  },
  'LC-G04': {
    subject: 'See the decisions around the model',
    bridge: 'The check lists the questions. The guide explains the decisions behind them, in the order they are worth making.',
    about:
      'Designing agentic systems is the pillar guide: the decisions around the model, in the order they are worth making, from purpose and boundary through evidence, permissions, external actions, evaluation, recovery and ownership.',
    cohortLine: 'Work through those decisions on a system you build and review.',
  },
  // LC-T10 and LC-T11: the package's own bodies (additional-resource-emails),
  // with the relevance paragraph in front, like every other module.
  'LC-T10': {
    subject: 'Can your agent tell silence from failure?',
    bridge: 'A tool call times out. That means the answer did not arrive; it does not establish whether the action happened.',
    about:
      'The Agent Failure Triage Quiz follows an illustrative purchase-order incident. Answer each question before reading the explanation. Then examine one tool in your system: can it recognise a repeated request, and can you check its actual outcome? A system that holds up in production needs a path from uncertainty to a known outcome, with an owner when the evidence is incomplete.',
    cohortLine: 'Build agentic systems that hold up in production.',
  },
  'LC-T11': {
    subject: 'What does a task cost when it comes back?',
    bridge: 'A clean run is only one path through an agent workflow. A rejected draft, a validation error or a human correction can send work back with more context to read.',
    about:
      'Bring one workflow to the Rework Cost Check. Use observed traces where you have them and labelled estimates where you do not. List each return path, the work repeated, its cap and the owner after the last attempt. Compare demand under the same assumptions: a token limit, a spend ceiling and cost per accepted outcome answer different questions.',
    cohortLine: 'Build agentic systems that hold up in production.',
  },
};

/**
 * The body, in the placeholder form that is stored and approved.
 *
 * Paragraphs, in the package's order: greeting, the relevance sentence, the
 * bridge, what the resource is, the call to action with its URL, the cohort
 * block, the sign-off. The unsubscribe action is appended by `renderMessage()`
 * as the last line, the same as for the twelve.
 */
const bodyFor = (id: string, url: string, cta: string): string => {
  const w = W[id];
  return [
    'Hi {{first_name}},',
    '{{relevance}}',
    w.bridge,
    w.about,
    `${cta}: ${url}`,
    `${w.cohortLine} {{cohort_invitation}}`,
    SIGN_OFF,
  ].join('\n\n');
};

export const DRIP_TEMPLATES: readonly PackageTemplate[] = DRIP_MODULES.map((mod) => {
  if (!W[mod.id]) throw new Error(`drip-templates: no wording for ${mod.id}`);
  return {
    key: mod.templateKey,
    route: 'resource',
    dayOffset: 0,
    purpose: 'marketing',
    subject: W[mod.id].subject,
    body: bodyFor(mod.id, mod.url, mod.cta),
    actions: ['unsubscribe'],
    version: DRIP_PACKAGE_VERSION,
  };
});

/**
 * The unsubscribe confirmation. Transactional, sent only when
 * COMMS_UNSUBSCRIBE_CONFIRMATION=on (off by default: a person who asked for no
 * more email is owed one fewer email, not one more). Kept here so that the
 * wording is reviewable and approvable like every other.
 */
export const UNSUBSCRIBE_CONFIRMATION_TEMPLATE: PackageTemplate = {
  key: 'unsubscribe-confirmation',
  route: 'resource',
  dayOffset: 0,
  purpose: 'transactional',
  subject: 'You are unsubscribed from The Living Craft resources',
  body:
    'This confirms that you will receive no further resource or cohort emails from The Living Craft.\n\nIf you asked us to do something, such as send a resource or answer an enquiry, a person may still reply to that. This does not delete your details; how they are handled is on the privacy page.\n\nIf this was a mistake, write one line to apply@thelivingcraft.ai.\n\n' +
    SIGN_OFF,
  actions: [],
  version: DRIP_PACKAGE_VERSION,
};

/** Where the signed confirmation link goes in the body. Minted at dispatch, like the unsubscribe link. */
export const CONFIRM_ACTION = '{{action:confirm}}';

/**
 * The confirmation request: the one email a person gets after ticking the box
 * on a download, before anything else.
 *
 * Verbatim from the resource brief (05-email-and-resource-routing,
 * § Subscription confirmation email), with the link placeholder where the
 * brief has {{PLACEHOLDER:personal_confirmation_url}}. Transactional: it
 * answers what the person just asked for, carries no cohort promotion, and is
 * not itself marketing. The footer (identity, preferences link) is appended at
 * dispatch like every other message.
 */
export const CONFIRMATION_TEMPLATE: PackageTemplate = {
  key: 'confirm-resource-emails',
  route: 'resource',
  dayOffset: 0,
  purpose: 'transactional',
  subject: 'Confirm your Living Craft resource emails',
  body: [
    'Hi,',
    'Please confirm that you want practical resources and occasional cohort updates from The Living Craft.',
    `Confirm my subscription: ${CONFIRM_ACTION}`,
    "If you didn't ask for these updates, ignore this email. You won't be added to the sequence.",
    'The Living Craft',
  ].join('\n\n'),
  actions: [],
  version: DRIP_PACKAGE_VERSION,
};

/** The preview line the brief gives for the confirmation request. */
export const CONFIRMATION_PREVIEW = 'One step to confirm the resource updates you requested.';

export const dripTemplateFor = (key: string): PackageTemplate | undefined =>
  key === UNSUBSCRIBE_CONFIRMATION_TEMPLATE.key
    ? UNSUBSCRIBE_CONFIRMATION_TEMPLATE
    : key === CONFIRMATION_TEMPLATE.key
      ? CONFIRMATION_TEMPLATE
      : DRIP_TEMPLATES.find((t) => t.key === key);

/** The placeholders a follow-up body may carry. Anything else is left as typed. */
export const DRIP_PLACEHOLDERS = ['first_name', 'relevance', 'cohort_invitation'] as const;

/**
 * The brief's role sentences, keyed by our role codes.
 *
 * The brief has four: engineering manager, architect, engineer, and an
 * employer-funding goal. Our role list (audience-roles.ts) has
 * 'engineering_leader' and 'engineer', so those two are used. It has no
 * architect option, and no form asks about employer funding, so those two
 * sentences cannot be chosen from anything a person told us. They are kept
 * here, unused, so the day a form asks, the words are already the approved
 * ones. "Never invent a name" applies to roles too: no sentence is chosen
 * from a guess.
 */
export const ROLE_SENTENCES: Readonly<Record<string, string>> = {
  engineering_leader:
    'You mentioned leading an engineering team, so this may be useful in a design discussion with the people responsible for the workflow.',
  engineer: 'You mentioned hands-on engineering work, so you can try this with one small, non-sensitive workflow.',
};

/** Kept for when a form asks. Not reachable from any role code today. */
export const UNUSED_ROLE_SENTENCES = {
  architect: 'You mentioned architecture work, so this resource focuses on a boundary you can make explicit in the design.',
  employerFunding: 'You mentioned employer support, so this may help you connect your learning goal to a team conversation.',
} as const;

/**
 * At most one relevance sentence, or null for none.
 *
 * The brief: "Use at most one relevance sentence; default to the known
 * request, then a voluntary goal/role, then neutral copy." And the request
 * sentence's exact form: "You requested the POC Selection Tool. This resource
 * looks at another decision around the same kind of workflow."
 */
export function relevanceSentence(args: { requestedTitle: string | null; roleCode: string | null }): string | null {
  if (args.requestedTitle) {
    const t = args.requestedTitle.trim();
    const named = /^the\s/i.test(t) ? `the ${t.slice(4)}` : t;
    return `You requested ${named}. This resource looks at another decision around the same kind of workflow.`;
  }
  if (args.roleCode && ROLE_SENTENCES[args.roleCode]) return ROLE_SENTENCES[args.roleCode];
  return null;
}

/** Fill the placeholders. Pure; the caller supplies every value. */
export function fillDripBody(
  body: string,
  values: { firstName: string | null; relevance: string | null; cohortInvitation: string },
): string {
  const greeting = values.firstName ? `Hi ${values.firstName},` : 'Hi,';
  const filled = body
    .replace('Hi {{first_name}},', greeting)
    .replaceAll('{{cohort_invitation}}', values.cohortInvitation);
  // No sentence: the paragraph goes, with its blank line, so the module reads
  // as the brief says it must: complete with "Hi," and nothing extra.
  return values.relevance
    ? filled.replace('{{relevance}}', values.relevance)
    : filled.replace(/\n\n\{\{relevance\}\}(?=\n\n)/, '').replace('{{relevance}}', '');
}
