// The twelve approved wordings, and the rule that a wording is never edited.
//
// ---------------------------------------------------------------------------
// NOTHING IN THIS FILE SENDS ANYTHING, AND NOTHING HERE IS APPROVED.
// ---------------------------------------------------------------------------
//
// This is the transcription of the handoff package's
// `Ein_Implementation_References/communication-templates.json`, character for
// character. The package ships it marked
// `disabled_pending_exact_version_approval_and_route_tests`, and that string is
// re-exported below rather than paraphrased, because it is the reason the
// twelve rows this module loads into `message_templates` arrive with no
// approval recorded.
//
// APPROVAL IS A PERSON'S ACT. It is somebody holding `approve.template`
// pressing a button, and it is recorded with their name and the time. Neither
// this file nor the loader can perform it, and a default of "approved" here
// would be this build asserting a decision the package explicitly reserves for
// Sunil and Alchemy.
//
// ---------------------------------------------------------------------------
// WHY THE BODIES ARE COPIED RATHER THAN IMPORTED FROM docs/
// ---------------------------------------------------------------------------
//
// Two reasons, and the second is the one that matters.
//
//   * The package lives under `docs/Website Rebuild 10-09-2026/`, outside the
//     source tree, behind a path with spaces in it. Importing it would bundle a
//     handoff document into a deployed function.
//   * A template row in the database points at a VERSION. `content_hash` is
//     computed over `version|key|route|day|purpose|subject|body|actions` and
//     re-checked whenever a row is read, so a row that no longer matches this
//     file is refused rather than sent. That check needs a fixed local
//     reference to compare against; a build-time import of a document somebody
//     may edit is not one.
//
// So: EDITING A BODY IN THIS FILE WITHOUT CHANGING `PACKAGE_VERSION` IS THE BUG
// THIS MODULE EXISTS TO PREVENT. It silently invalidates every already-approved
// row -- and correctly so, since the hash will stop matching -- but it also
// loses the record of what the approved words actually were. A new form of
// words is a NEW VERSION, a new row, and a new approval. Same rule as
// `src/lib/pipeline/consent.ts`, for the same reason: somebody has to be able
// to ask "what exactly went out" a year later and get an answer.
//
// ---------------------------------------------------------------------------
// WHAT A "RENDER" IS HERE, AND WHAT IT IS NOT
// ---------------------------------------------------------------------------
//
// These bodies contain no merge fields. Not one of the twelve addresses anybody
// by name, and that is a copy decision, not an omission -- so `renderMessage()`
// does not interpolate anything. All it does is append an ACTION PLACEHOLDER
// for each action key the template declares.
//
// The placeholder stays a placeholder all the way into `comms_messages.body`.
// The implementation reference: "The unsubscribe action key must be rendered as
// a signed one-action link by the chosen email integration; no literal token
// belongs in a sent email." A token written into the outbox is a token in a
// table that console access can read, and one that cannot be rotated without
// rewriting queued rows. The signed link is materialised by the provider
// adapter at the moment of dispatch and nowhere earlier.
//
// These are PLAIN TEXT. Never render one with `marked`, and never put one
// through `renderMarkdown()` either -- the second is safe and still wrong, as a
// line break in a plain-text message is a line break, not a paragraph the
// renderer may reflow.

export type TemplateRoute = 'application' | 'enquiry' | 'enterprise';
export type TemplatePurpose = 'transactional' | 'marketing';

export interface PackageTemplate {
  /** The package's own id, stored as `template_key`. */
  key: string;
  route: TemplateRoute;
  /** Calendar days after a saved, eligible submission. 0 is the receipt. */
  dayOffset: number;
  purpose: TemplatePurpose;
  subject: string;
  body: string;
  /** Action KEYS, never links. See the head of this file. */
  actions: string[];
  version: string;
}

/**
 * The package version these words came from.
 *
 * It travels onto every row and onto every queued message, so "which wording
 * did this person receive" is answerable from one row without resolving
 * anything. Never reuse a version for different words.
 */
export const PACKAGE_VERSION = "LC-LAUNCH-2026-09-10";

/**
 * The package's own activation marker, re-exported verbatim.
 *
 * The console prints this. It is the supplier's own statement that these are
 * not live, and paraphrasing it into "coming soon" would lose both the two
 * conditions it names -- exact-version approval AND route tests.
 */
export const PACKAGE_ACTIVATION = "disabled_pending_exact_version_approval_and_route_tests";

/**
 * The twelve, in package order: three receipts, then day 2, 5 and 9 for each
 * of the three routes.
 */
export const TEMPLATES: readonly PackageTemplate[] = [
  {
    key: "application-receipt",
    route: "application",
    dayOffset: 0,
    purpose: "transactional",
    subject: "We have received your Living Craft application",
    body:
      "Thank you for applying to The Living Craft.\n\nWe have received your experience and learning goal. The next step is a conversation about programme fit and the commitment involved.\n\nApplying does not confirm admission or a place. Schedule, workload and final terms should be clear before you decide.\n\nIf you have a question or need to correct your application, reply to this email.\n\nThe Living Craft",
    actions: [],
    version: PACKAGE_VERSION,
  },
  {
    key: "enquiry-receipt",
    route: "enquiry",
    dayOffset: 0,
    purpose: "transactional",
    subject: "We have received your cohort enquiry",
    body:
      "Thank you for getting in touch about The Living Craft.\n\nYour enquiry has been received. We will review your question and contact you about the next step.\n\nIf there is anything you would like to add, reply to this email. Please avoid sending confidential company materials.\n\nThe Living Craft",
    actions: [],
    version: PACKAGE_VERSION,
  },
  {
    key: "enterprise-receipt",
    route: "enterprise",
    dayOffset: 0,
    purpose: "transactional",
    subject: "Your Living Craft team enquiry",
    body:
      "Thank you for contacting The Living Craft about your team.\n\nWe have received your enquiry. We will begin with your learning objective, participant experience and industry context, then coordinate a scoping discussion with Sunil.\n\nPlease reply if you would like to add context. Company-specific work requires agreed scope and permission; no confidential documents are needed to begin.\n\nThe Living Craft",
    actions: [],
    version: PACKAGE_VERSION,
  },
  {
    key: "application-day2",
    route: "application",
    dayOffset: 2,
    purpose: "marketing",
    subject: "The design question behind a working agent",
    body:
      "Imagine a returns assistant that recommends a refund. Giving it the ability to issue that refund adds questions about evidence, permissions and repeated requests.\n\nAt The Living Craft, the working system gives these design choices something concrete to connect to. Members build, examine behaviour and revise through feedback.\n\nAs you consider the programme, which decision would you like to become better at explaining? You can reply with a non-confidential example.\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
  {
    key: "enquiry-day2",
    route: "enquiry",
    dayOffset: 2,
    purpose: "marketing",
    subject: "What you would practise at The Living Craft",
    body:
      "The Living Craft connects practical building with architecture reasoning. Members work on an agentic system and examine tools, authority, evaluation, reliability and cost.\n\nAn illustrative returns assistant is a useful starting point: recommending a refund and issuing it involve different responsibilities. The programme explores how to make those choices visible and testable.\n\nIf that matches what you want to develop, explore the programme page or reply with your question.\n\nhttps://learning.thelivingcraft.ai/\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
  {
    key: "enterprise-day2",
    route: "enterprise",
    dayOffset: 2,
    purpose: "marketing",
    subject: "Start with the decision your team needs to make",
    body:
      "A team learning brief becomes more useful when it names an engineering responsibility.\n\nThat might be designing an agentic workflow, evaluating its behaviour or reviewing the architecture proposed by another team. The Living Craft connects those responsibilities to a working system and continuous feedback.\n\nWhich capability matters most for your group? Reply with your learning objective and the participants’ starting point.\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
  {
    key: "application-day5",
    route: "application",
    dayOffset: 5,
    purpose: "marketing",
    subject: "Making room for the practical work",
    body:
      "The Living Craft includes 30 live hours with Sunil, plus independent work. Both belong in the decision to join.\n\nConfirm the detailed schedule and independent-work expectation before committing. If your employer would fund your place, it can help to explain the responsibility you want to develop and the time you will need.\n\nReply if you would like the employer-funding summary or have a question about commitment. Individual sponsorship and an enterprise group purchase are separate routes.\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
  {
    key: "enquiry-day5",
    route: "enquiry",
    dayOffset: 5,
    purpose: "marketing",
    subject: "Is the cohort the right next step for you?",
    body:
      "The cohort is for people with prior system-design exposure who want to build, explain choices and revise their work through feedback.\n\nThe commitment is 30 live hours plus independent work. Final schedule, workload, fees and terms should be clear before you join.\n\nIf you need employer support, reply for the funding summary. If you are still exploring fit, tell us which design responsibility you want to strengthen.\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
  {
    key: "enterprise-day5",
    route: "enterprise",
    dayOffset: 5,
    purpose: "marketing",
    subject: "What helps shape a useful team programme",
    body:
      "A useful scoping conversation covers participant experience, the engineering sponsor, industry context and scheduling constraints.\n\nEnterprise programmes normally involve 8–10 participants. Industry-specific examples and assignments are the default. A company case needs a coherent team, agreed boundaries and permission to use the material.\n\nReply with the context you can share, or let us know who should join the discussion. Final scope and commercial terms are agreed with Sunil.\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
  {
    key: "application-day9",
    route: "application",
    dayOffset: 9,
    purpose: "marketing",
    subject: "A question before your next step",
    body:
      "Is there anything you still need to understand about programme fit, practical work or the commitment?\n\nReply with your question and we can coordinate the next conversation. There is no need to share confidential architecture or decide before the schedule and final terms are clear.\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
  {
    key: "enquiry-day9",
    route: "enquiry",
    dayOffset: 9,
    purpose: "marketing",
    subject: "Your next step with The Living Craft",
    body:
      "If the programme fits the responsibility you want to develop, the application is a useful way to begin. Tell us about your system-design experience and one question you want to work on.\n\nhttps://learning.thelivingcraft.ai/\n\nIf you are still deciding, you can simply reply with your question. An application begins a fit conversation; it is not a payment or a confirmed place.\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
  {
    key: "enterprise-day9",
    route: "enterprise",
    dayOffset: 9,
    purpose: "marketing",
    subject: "Would a team scoping conversation help?",
    body:
      "If agentic-system design is a current learning priority for your team, we can coordinate a conversation with Sunil about the objective, people and scope.\n\nReply with suitable times or the question you would like the discussion to resolve. If the timing is not right, let us know and we will close the follow-up for now.\n\nThe Living Craft",
    actions: ["unsubscribe"],
    version: PACKAGE_VERSION,
  },
];

/** Every distinct day offset the package uses, in order. 0 is a receipt. */
export const DAY_OFFSETS = [0, 2, 5, 9] as const;

/** The three nurture offsets. Calendar days -- see `nurtureSlot()` in outbox.ts. */
export const NURTURE_OFFSETS = [2, 5, 9] as const;

export const templateFor = (key: string): PackageTemplate | undefined =>
  TEMPLATES.find((t) => t.key === key);

/** The templates for one route, receipt first, then the nurture steps in order. */
export const templatesForRoute = (route: TemplateRoute): PackageTemplate[] =>
  TEMPLATES.filter((t) => t.route === route).sort((a, b) => a.dayOffset - b.dayOffset);

export const receiptFor = (route: TemplateRoute): PackageTemplate | undefined =>
  TEMPLATES.find((t) => t.route === route && t.dayOffset === 0);

export const nurtureFor = (route: TemplateRoute): PackageTemplate[] =>
  templatesForRoute(route).filter((t) => t.dayOffset > 0);

/**
 * The digest a stored row is checked against.
 *
 * Over every field that changes what a person reads, plus the version that
 * names the approval. NOT over `template_id`, `approved_at` or `approved_by`:
 * approving and revoking are the two things anybody may do to a row, and they
 * must not invalidate the hash that proves the wording is untouched.
 *
 * The separator is a character that cannot occur in any of the parts, so
 * `a|b` and `ab` cannot collide. A newline would not do -- the bodies are full
 * of them.
 */
export async function contentHash(t: PackageTemplate): Promise<string> {
  const parts = [
    t.version,
    t.key,
    t.route,
    String(t.dayOffset),
    t.purpose,
    t.subject,
    t.body,
    t.actions.join(','),
  ].join('\u001f');

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The placeholder an action key becomes in a stored body.
 *
 * Deliberately not a URL and deliberately not valid-looking. If one of these
 * ever reaches a person, it should be obviously a bug rather than a link that
 * quietly goes nowhere -- and a reader of the outbox should be able to tell at
 * a glance that no token was written into the row.
 */
export const actionPlaceholder = (action: string): string => `{{action:${action}}}`;

/** Every action key the twelve templates use. Today: exactly one. */
export const ACTION_KEYS = [...new Set(TEMPLATES.flatMap((t) => t.actions))].sort();

export interface RenderedMessage {
  subject: string;
  /** The body as stored on the outbox row: verbatim copy plus action placeholders. */
  body: string;
  /** Which placeholders the adapter must replace before this can be sent. */
  actions: string[];
}

/**
 * What goes onto the outbox row.
 *
 * The body is the package's body, unchanged, followed by one placeholder line
 * per declared action. Nothing is interpolated and nothing is trimmed: a
 * trailing newline difference between this and the package is a hash mismatch,
 * which is the point.
 */
export function renderMessage(t: PackageTemplate): RenderedMessage {
  const footer = t.actions.map((a) => actionPlaceholder(a)).join('\n');
  return {
    subject: t.subject,
    body: footer ? `${t.body}\n\n${footer}` : t.body,
    actions: [...t.actions],
  };
}

/**
 * The row shape written to `message_templates` by the loader.
 *
 * `approved_at` and `approved_by` are absent, not null-and-hopeful. The schema
 * has no 'pending' state on purpose: an unapproved template simply has no
 * approval recorded, and `approved_at is null` is what every eligibility check
 * reads.
 */
export async function templateRow(t: PackageTemplate): Promise<Record<string, unknown>> {
  return {
    template_key: t.key,
    version: t.version,
    route: t.route,
    day_offset: t.dayOffset,
    purpose: t.purpose,
    subject: t.subject,
    body: t.body,
    actions: t.actions,
    content_hash: await contentHash(t),
  };
}

/** The row as stored, as far as anything outside this module is concerned. */
export interface StoredTemplate {
  template_id: string;
  template_key: string;
  version: string;
  route: TemplateRoute;
  day_offset: number;
  purpose: TemplatePurpose;
  subject: string;
  body: string;
  actions: string[] | null;
  content_hash: string;
  approved_at: string | null;
  approved_by: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_reason: string | null;
  created_at?: string;
}

export type TemplateVerdict =
  | { sendable: true; matches: true }
  | { sendable: false; matches: boolean; reason: string };

/**
 * Whether a stored row may be used, and why not when it may not.
 *
 * THREE THINGS HAVE TO BE TRUE, and the third is the one a schema alone cannot
 * guarantee. The content columns are frozen by a trigger, so an UPDATE cannot
 * change them -- but a row INSERTED by something other than the loader, or a
 * row surviving from a superseded copy of this file, is neither an edit nor a
 * forgery the trigger can see. Re-hashing on read is what closes that.
 */
export async function verifyStored(row: StoredTemplate): Promise<TemplateVerdict> {
  const local = templateFor(row.template_key);

  if (!local || local.version !== row.version) {
    return {
      sendable: false,
      matches: false,
      reason:
        'This row is not one of the twelve wordings in the current package version. It may be from a superseded version; it is not sendable from this build.',
    };
  }

  const expected = await contentHash(local);
  const matches = expected === row.content_hash && row.body === local.body && row.subject === local.subject;

  if (!matches) {
    return {
      sendable: false,
      matches: false,
      reason:
        'The stored wording does not match the approved package text. Nothing is sent from a row whose words have drifted -- load the package version again and have it approved.',
    };
  }
  if (row.revoked_at) {
    return {
      sendable: false,
      matches: true,
      reason: `Approval was withdrawn${row.revoked_reason ? `: ${row.revoked_reason}` : '.'}`,
    };
  }
  if (!row.approved_at) {
    return {
      sendable: false,
      matches: true,
      reason:
        'Not approved. The package ships these pending exact-version approval, and an unapproved wording is never sent.',
    };
  }
  return { sendable: true, matches: true };
}
