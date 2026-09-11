/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The three open resources from the V4 campaign addendum — LC-R01, LC-R02,
 * LC-R03 — and the one place their companion CSVs are serialised.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHAT THESE ARE
 *
 * `docs/Website Rebuild 10-09-2026/website_addendum_11-09-2026/2026-09-11_V4_Campaign/`
 * (LC-STRATEGY-V4.0.0, 11 September 2026) puts three resources on the critical
 * path and leaves the other thirteen in a backlog it describes, in its own
 * words, as "not a launch dependency":
 *
 *   LC-R01  Cost-ceiling worksheet        live and tested before post D10
 *   LC-R02  Evaluation-gates worksheet    before D16
 *   LC-R03  Deployment checklist          before D20
 *
 * Each one is `Resource_*.md` plus `Resource_*.csv` in that folder. The prose
 * below is that document's; the `csv` block below is that file's header row.
 * Nothing here was written from scratch and nothing here is a claim about the
 * world — see the three rules at the foot of this note.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY A DATA MODULE AND NOT A CONTENT COLLECTION
 * ───────────────────────────────────────────────────────────────────────────
 *
 * `guides` and `templates` are content collections, and the obvious move was a
 * third. Three things argued the other way, and the second is the one that
 * decided it.
 *
 * 1. THE LOAD-BEARING PART IS NOT PROSE. What this file has to get exactly
 *    right is a list of column names. A collection would put that list in
 *    YAML — unchecked strings — and leave the body holding five short
 *    paragraphs. Here the columns are a typed array `astro check` verifies
 *    against every page that reads them.
 *
 * 2. THE CSV FORMAT NEEDS ONE OWNER, AND IT CANNOT BE A PAGE. The addendum
 *    ships the companion CSV as the artefact: "reproduce those headers
 *    exactly". The on-page fillable table, the download filename and the file
 *    itself must therefore come from ONE list. With a collection, the
 *    serialiser would have to live in each of the three route files — which is
 *    precisely the failure CLAUDE.md names under "Two places that own a
 *    format", and precisely how `pairing.ts` came to read `## Decision` out of
 *    records written under seven other headings and return the empty string in
 *    silence. Here `csvFor()` is beside the columns it serialises and the three
 *    pages are thin.
 *
 * 3. NOTHING NEEDS MARKDOWN. These documents are structured — paragraphs, two
 *    two-column tables, a column list. Modelling them as data rather than as a
 *    body means the pages render plain JSX: no `marked`, no `set:html`, no
 *    sanitiser question at all on a public route.
 *
 * Consequence worth stating: `src/content.config.ts` is untouched by this work.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE ESCAPING IS `src/lib/admin/csv.ts`'s, NOT A COPY OF IT
 * ───────────────────────────────────────────────────────────────────────────
 *
 * That module's own header says what it is — "The CSV format, and nothing
 * else" — and argues at length that the format "has no business knowing about
 * Supabase". It imports nothing, which is what makes it safe to pull into a
 * public page's build. Re-implementing `csvCell()` here to avoid an import
 * from a folder called `admin/` would put a second copy of the quoting rule in
 * the repo a fortnight after somebody consolidated three of them into one.
 *
 * Two visible effects, both intended. Every cell is quoted, where the source
 * `.csv` files quote none — identical to any parser, and the header VALUES are
 * reproduced character for character, which is what "exactly" is about. And
 * the file carries a BOM and CRLF endings, so Excel opens it as UTF-8.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THREE RULES FOR THIS FILE
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 1. NEVER ADD A SCORE, A GRADE OR A CERTIFICATE. The roadmap rules all three
 *    out in one sentence — "No certificate or automated production-readiness
 *    score" — and each resource repeats it in its own words: the evaluation
 *    worksheet "is not a production-readiness certificate", the cost worksheet
 *    "does not choose a safe budget for your system". Nothing in this module
 *    sums, averages, weights or ranks a column, and `NO_SCORE` below is on
 *    every page so a reader does not have to infer it. Same rule, and the same
 *    reason, as `src/data/agent-design-check.ts`.
 *
 * 2. NEVER LET AN ILLUSTRATION BECOME A CLAIM. Every worked example carries a
 *    `label`, it is required by the type, and the pages render it above the
 *    example rather than beside it. LC-R01's "USD 0.10 per attempt" is the one
 *    number in these documents that could be mistaken for a price; the
 *    addendum calls it "illustrative arithmetic only" and so does the label.
 *    Do not remove a label to tighten a layout.
 *
 * 3. NEVER GATE ANY OF IT. The addendum: "HTML stays open; optional download
 *    email requires a separate communication preference." The HTML is the
 *    resource — complete, readable and fillable without downloading anything
 *    and without leaving an address. There is no form on these routes and
 *    there must not be one. The optional email delivery is a different path
 *    with its own permission, and it is not built here.
 */

import { csvDocument, type CsvColumn } from '../lib/admin/csv';

// ── the spine ────────────────────────────────────────────────────────────────
// The roadmap states it once, for all sixteen: "Each resource provides a short
// explanation, a worked illustrative case, a fillable table, limits and a
// next-step review question." The section kinds below are that sentence, and
// every resource orders its own.

/** Plain paragraphs. `emphasis` is one sentence set apart — a distinction the
 *  document itself makes, never a pull quote for decoration. */
export interface ProseSection {
  kind: 'prose';
  heading: string;
  paragraphs: string[];
  emphasis?: string;
}

/** The worked illustrative case. `label` is not optional — see rule 2. */
export interface WorkedSection {
  kind: 'worked';
  heading: string;
  label: string;
  paragraphs: string[];
}

/** One of the document's own two-column tables. `columns` is its header row. */
export interface TableSection {
  kind: 'table';
  heading: string;
  intro?: string[];
  columns: [string, string];
  rows: [string, string][];
}

/** The fillable table and its download. The columns come from `csv`, below —
 *  this section only says where on the page it goes and what to say about it. */
export interface SheetSection {
  kind: 'sheet';
  heading: string;
  intro: string[];
  note?: string;
}

/** Limits, then the document's own next-step question, verbatim. */
export interface LimitsSection {
  kind: 'limits';
  heading: string;
  paragraphs: string[];
  nextStep: string;
  reference?: { label: string; url: string };
}

export type ResourceSection =
  | ProseSection
  | WorkedSection
  | TableSection
  | SheetSection
  | LimitsSection;

export interface Resource {
  /** Filename, slug and the last path segment. One string, one source. */
  id: string;
  /** The addendum's identifier. Used for attribution (`resource_id`), and
   *  printed on the page so a reader and an operator can name the same thing. */
  code: string;
  /** Route, with no trailing slash — the shape every other href here takes. */
  path: string;
  title: string;
  /** One line: the index card and the meta description. */
  summary: string;
  /** What the artefact IS, as a noun phrase. Mono on the page. */
  artifact: string;
  /** The moment this is the right thing to reach for. */
  useWhen: string;
  /** Sort order on /toolkit. The addendum's release order, not alphabetical. */
  order: number;
  /** Download filename base — the reader gets `<fileBase>.csv`. */
  fileBase: string;
  author: string;
  /**
   * Who checked it. UNSET ON ALL THREE, and that is the honest state.
   *
   * The roadmap: "All three releases require Sunil technical review and a
   * tested public route before their promotional post." The review gates the
   * POST; the page has to exist and be tested first. So `status: 'ready'`
   * (the writing is finished) and `reviewedBy` unset (no human has signed it
   * off) — the same split the guides and templates collections draw, for the
   * same reason. Never fill this in to make a checklist look complete.
   */
  reviewedBy?: string;
  /** YYYY-MM-DD. Never bumped without a content review. */
  revisedOn: string;
  /** 'draft' keeps it off /toolkit. Same predicate as the guides index. */
  status: 'draft' | 'ready';
  sections: ResourceSection[];
  /**
   * THE ARTEFACT. `columns` is the header row of the companion CSV in the
   * addendum folder, reproduced exactly; `rows` is whatever that file seeds.
   * The page's fillable table and the downloaded file are both built from it.
   */
  csv: { columns: string[]; rows: string[][] };
}

/**
 * Said on every resource page, once, above the table.
 *
 * The roadmap forbids a certificate and an automated production-readiness
 * score. A reader who has met a dozen "maturity assessments" will assume one
 * is coming, so this is stated rather than merely not done.
 */
export const NO_SCORE =
  'Nothing here is scored. There is no grade, no percentage, no readiness level and no certificate — the columns exist so that a decision can be read and challenged by somebody else, not added up.';

/**
 * Said on every resource page, once, beside the downloads.
 *
 * The addendum offers "optional downloadable PDF and CSV" and an "optional
 * email request". What is built is the CSV, as a direct download, and the
 * browser's own print-to-PDF — so the page states exactly that rather than
 * implying a PDF file exists somewhere. Nothing on these routes asks for an
 * address; see rule 3.
 */
export const NO_GATE =
  'The page is the resource. Everything is here to read, fill in or print, and nothing asks for an email address.';

// ═════════════════════════════════════════════════════════════════════════════
// LC-R01 · Cost-ceiling worksheet
// ═════════════════════════════════════════════════════════════════════════════

const costCeiling: Resource = {
  id: 'cost-ceiling-worksheet',
  code: 'LC-R01',
  path: '/resources/cost-ceiling-worksheet',
  title: 'Cost-ceiling worksheet',
  summary:
    'Decide what one workflow is allowed to spend or repeat, what happens when it reaches that boundary, and who reviews the result.',
  artifact: 'Five boundaries, eleven columns, one workflow at a time.',
  useWhen:
    'A workflow is about to be allowed to retry, call tools or run in the background, and nothing yet stops it.',
  order: 1,
  fileBase: 'cost-ceiling-worksheet',
  author: 'The Living Craft',
  revisedOn: '2026-09-11',
  status: 'ready',
  sections: [
    {
      kind: 'prose',
      heading: 'What this helps you decide',
      paragraphs: [
        'Define what one workflow is allowed to spend or repeat, what happens at the boundary and who reviews the result. Start with a single workflow, including its retries and background work.',
      ],
      // The distinction the whole worksheet turns on, and the reason nothing on
      // this page calculates anything from what you type into it.
      emphasis: 'A budget estimate and an enforced ceiling serve different purposes.',
    },
    {
      kind: 'worked',
      heading: 'Worked example',
      label:
        'Illustrative arithmetic only. The figures below are chosen so the arithmetic is visible on the page. They are not a price, not a rate card, and not a measurement of any system.',
      paragraphs: [
        'A task uses USD 0.10 of model work per attempt. Two attempts use USD 0.20 before retrieval, other tools or human review. If neither attempt succeeds, cost per successful task cannot be inferred from those attempts alone. Record failure cost alongside completed work rather than excluding it from the average.',
        'Suppose the design allows at most two attempts for this example. On reaching the limit, it saves the unresolved outcome and offers a review route. That is a chosen teaching example, not a recommended universal limit. Concurrent requests and retries must share the intended accounting boundary.',
      ],
    },
    {
      kind: 'table',
      heading: 'Complete the ceiling table',
      intro: [
        'For each row, record the proposed limit and unit, why it is justified, where it is enforced, the owner, the boundary test and the evidence. Include model and tool calls, elapsed time, run cost and aggregate cost per person or period as relevant. Keep currencies separate.',
      ],
      columns: ['Review question', 'Your decision should explain'],
      rows: [
        ['What counts as one run?', 'How retries and repeated submissions are recognised'],
        ['What work is charged?', 'Model, retrieval, tool, background and review costs'],
        ['Where is the limit enforced?', 'The component that can stop further work'],
        ['What does the user experience?', 'Saved state, unresolved outcome and next step'],
        [
          'What happens concurrently?',
          'How simultaneous requests cannot each spend the same remaining allowance',
        ],
        ['When do we review it?', 'Changes in task, traffic, pricing or acceptable risk'],
      ],
    },
    {
      kind: 'sheet',
      heading: 'The ceiling table',
      intro: [
        'Five boundaries, eleven columns. Fill it in here, on paper, or in the spreadsheet below — the table on this page and the file you download are generated from one list of columns, so they cannot drift apart.',
      ],
      note: 'Add a row for any other boundary your workflow has. Keep currencies in separate rows rather than converting between them.',
    },
    {
      kind: 'prose',
      heading: 'Test the boundary',
      paragraphs: [
        'Exercise a run at the limit, repeated requests, concurrent requests and a delayed tool result. Confirm that already completed actions are not repeated and that unresolved work is visible.',
        'Account for provider billing delays; a local counter may not equal final billed cost.',
      ],
    },
    {
      kind: 'limits',
      heading: 'Limits and next step',
      paragraphs: [
        "This worksheet does not choose a safe budget for your system or guarantee a provider's final bill. Use measured workload and current prices, then review the design with its owner.",
      ],
      nextStep: 'What is the first experiment needed to justify one of your limits?',
    },
  ],
  csv: {
    columns: [
      'boundary',
      'limit',
      'unit',
      'currency',
      'reason',
      'enforcement_point',
      'stop_behaviour',
      'owner',
      'boundary_test',
      'evidence',
      'review_trigger',
    ],
    rows: [
      ['Attempts per run'],
      ['Tool calls per run'],
      ['Elapsed time'],
      ['Cost per run'],
      ['Aggregate person or period cost'],
    ],
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// LC-R02 · Evaluation-gates worksheet
// ═════════════════════════════════════════════════════════════════════════════

const evaluationGates: Resource = {
  id: 'evaluation-gates-worksheet',
  code: 'LC-R02',
  path: '/resources/evaluation-gates-worksheet',
  title: 'Evaluation-gates worksheet',
  summary:
    'Connect one requirement to the evidence for it and to a release decision, with the coverage gaps and the decision owner written down beside it.',
  artifact: 'One row per requirement, thirteen columns, no pass percentage.',
  useWhen:
    'A release meeting is coming and somebody is going to ask whether the evaluation results mean the system is ready.',
  order: 2,
  fileBase: 'evaluation-gates-worksheet',
  author: 'The Living Craft',
  revisedOn: '2026-09-11',
  status: 'ready',
  sections: [
    {
      kind: 'prose',
      heading: 'What this helps you decide',
      paragraphs: [
        'Connect a requirement to evidence and a release decision. Begin with one behaviour the system must demonstrate.',
        'Define unacceptable outcomes before the review meeting and record who owns any trade-off.',
      ],
    },
    {
      kind: 'worked',
      heading: 'Worked example',
      label: 'Illustrative case, not a claimed customer incident.',
      paragraphs: [
        'A refund assistant may prepare a recommendation but must not issue a payment without authorisation. A release-blocking check verifies that missing or invalid authorisation prevents the action across the tested paths. A separate human review assesses whether an unresolved response is understandable.',
        'The first property can be checked against system state. The second needs a suitable review rubric. Passing both on the chosen cases does not prove all future inputs are covered.',
      ],
    },
    {
      kind: 'table',
      heading: 'Complete the gate table',
      intro: [
        'Use one row per requirement. Record the system version, input set, expected behaviour, grader, result, evidence link, coverage gaps, decision owner and consequence of failure.',
        'Choose the threshold for your use case and justify it; this worksheet supplies no universal pass percentage.',
      ],
      columns: ['Gate element', 'Review question'],
      rows: [
        ['Requirement', 'What observable behaviour are we examining?'],
        ['Coverage', 'Which ordinary, difficult, incomplete and adversarial cases are included?'],
        ['Grader', 'Is code, model-based grading or human review appropriate?'],
        ['Grader validation', 'How do we know the reviewer detects the failure that matters?'],
        ['Repeatability', 'Could variable output change the result across trials?'],
        ['Consequence', 'Does failure block release or require a named decision?'],
        ['Evidence', 'Can another reviewer reproduce or inspect the result?'],
        ['Gaps', 'What has not been tested, and who accepts that uncertainty?'],
      ],
    },
    {
      kind: 'sheet',
      heading: 'The gate table',
      intro: [
        'Thirteen columns, one row per requirement. The file below starts with six empty rows because the number of requirements is yours to decide — a gate table with one well-evidenced row is worth more than six written to fill the sheet.',
      ],
      note: 'Every column is a sentence somebody else has to be able to read. There is no column for a total, and none is coming.',
    },
    {
      kind: 'prose',
      heading: 'Conduct the review',
      paragraphs: [
        'Separate a release-blocking requirement from a discretionary trade-off. Record disagreements and the final decision.',
        'Re-run relevant checks when the system, prompt, model, tools or permissions change. Keep production monitoring alongside pre-release evaluation.',
      ],
    },
    {
      kind: 'limits',
      heading: 'Limits and next step',
      paragraphs: [
        'This worksheet is not a production-readiness certificate. A test suite establishes evidence about its tested scope.',
      ],
      nextStep:
        'Inspect one passing result: what does it prove, what does it leave open and what should be tested next?',
      // The addendum supplies this citation itself. Reproduced as given.
      reference: {
        label: 'Anthropic describes complementary code-based, model-based and human graders',
        url: 'https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents',
      },
    },
  ],
  csv: {
    columns: [
      'requirement',
      'system_version',
      'case_set',
      'expected_behaviour',
      'grader',
      'grader_validation',
      'threshold_and_reason',
      'result',
      'coverage_gaps',
      'evidence',
      'decision_owner',
      'failure_consequence',
      'review_date',
    ],
    // Six empty rows, exactly as the companion file ships them.
    rows: [[], [], [], [], [], []],
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// LC-R03 · Deployment checklist
// ═════════════════════════════════════════════════════════════════════════════

const deploymentChecklist: Resource = {
  id: 'deployment-checklist',
  code: 'LC-R03',
  path: '/resources/deployment-checklist',
  title: 'Deployment checklist',
  summary:
    'Make a release operable: for each area, the action, the owner, the evidence and the recovery path — before the release and after it.',
  artifact: 'Thirteen areas, eight columns, one release record.',
  useWhen:
    'A release is going out and the question "who would notice if this silently stopped working" has no answer yet.',
  order: 3,
  fileBase: 'deployment-checklist',
  author: 'The Living Craft',
  revisedOn: '2026-09-11',
  status: 'ready',
  sections: [
    {
      kind: 'prose',
      heading: 'What this helps you decide',
      paragraphs: [
        "Make a release operable by naming the action, owner, evidence and recovery path. Adapt the checklist to the system's risks.",
      ],
      emphasis:
        'A small team still needs deliberate boundaries; a long checklist is not a substitute for effective controls.',
    },
    {
      kind: 'worked',
      heading: 'Worked example',
      label: 'Illustrative case, not a claimed customer incident.',
      paragraphs: [
        "A service deploys successfully, but the scheduled task that prepares the next period's output is absent. A homepage check passes while the product's main work is not happening.",
        'A useful verification therefore checks both service health and expected job completion. It records when output was due, whether it appeared and who responds if it does not. Recovery must recognise completed work before retrying it.',
      ],
    },
    {
      kind: 'table',
      heading: 'Review before release',
      columns: ['Area', 'Check and evidence'],
      rows: [
        ['Change', 'Identify the version, owner, purpose and dependencies.'],
        ['Fast checks', 'Run relevant type, static and unit checks; record what they do not cover.'],
        [
          'Environment',
          'Verify configuration parity deliberately; separate secrets and production access.',
        ],
        ['Data', 'Review migrations, backup and recovery, and compatibility with the previous version.'],
        ['Permissions', 'Test that routine development and review cannot modify production data.'],
        ['Promotion', 'Record the approver, evidence and exact version being promoted.'],
        ['Recovery', 'Explain rollback or forward recovery, including irreversible data changes.'],
      ],
    },
    {
      kind: 'table',
      heading: 'Review after release',
      columns: ['Area', 'Check and evidence'],
      rows: [
        ['Service', 'Verify a meaningful task as well as a health endpoint.'],
        ['Schedule', 'Verify jobs exist and expected work completes; detect missing success.'],
        [
          'Observability',
          'Check useful logs and alerts without exposing unnecessary personal data.',
        ],
        ['Response', 'Name who responds, how they are reached and what recovery they can perform.'],
        ['Repetition', 'Test that retries and catch-up work do not duplicate completed actions.'],
        ['Deferrals', 'Record omitted controls, their reason, owner and revisit trigger.'],
      ],
    },
    {
      kind: 'sheet',
      heading: 'Complete the release record',
      intro: [
        'One row per area — the seven before the release and the six after it, in that order. Record status, owner, evidence, unresolved risk and follow-up for each. A check marked “not applicable” needs a reason.',
        'Every row starts at “Not assessed”, which is the truthful starting state and the one worth leaving visible on the rows nobody got to.',
      ],
      note: 'Do not mark a release complete solely because the deployment command succeeded.',
    },
    {
      kind: 'limits',
      heading: 'Limits and next step',
      paragraphs: [
        'This checklist does not prescribe your deployment stack or certify a secure system. Review it against your architecture and obligations.',
      ],
      nextStep:
        'Which missing control presents the most consequential failure for your next release?',
    },
  ],
  csv: {
    columns: [
      'area',
      'status',
      'owner',
      'evidence',
      'unresolved_risk',
      'next_action',
      'due_date',
      'revisit_trigger',
    ],
    rows: [
      ['Change', 'Not assessed'],
      ['Fast checks', 'Not assessed'],
      ['Environment', 'Not assessed'],
      ['Data', 'Not assessed'],
      ['Permissions', 'Not assessed'],
      ['Promotion', 'Not assessed'],
      ['Recovery', 'Not assessed'],
      ['Service', 'Not assessed'],
      ['Schedule', 'Not assessed'],
      ['Observability', 'Not assessed'],
      ['Response', 'Not assessed'],
      ['Repetition', 'Not assessed'],
      ['Deferrals', 'Not assessed'],
    ],
  },
};

/**
 * All three, in release order.
 *
 * THE OTHER THIRTEEN ARE NOT HERE AND MUST NOT BE ADDED AS PLACEHOLDERS. The
 * roadmap files them as "Backlog; not a launch dependency", and the rule the
 * resources hub already follows applies with more force to a page whose whole
 * job is listing downloads: a greyed row with a real title reads as "coming
 * soon", and a reader remembers the title, not the grey. A resource joins this
 * array when it is written.
 */
export const RESOURCES: Resource[] = [costCeiling, evaluationGates, deploymentChecklist];

/**
 * What /toolkit and /resources may list. Same predicate as the guides and
 * templates indexes: the writing is finished, so the route exists.
 */
export const releasedResources = (): Resource[] =>
  RESOURCES.filter((r) => r.status === 'ready').sort((a, b) => a.order - b.order);

export const resourceById = (id: string): Resource | undefined =>
  RESOURCES.find((r) => r.id === id);

// ── the companion file ───────────────────────────────────────────────────────

/**
 * The CSV, from the columns the page rendered. One list, two artefacts.
 *
 * `csvDocument` wants objects keyed by column; the rows here are positional,
 * because that is how the source file writes them and because a row is a line
 * in a spreadsheet, not a record. Short rows are padded, which is what lets
 * LC-R01 seed only the first cell and LC-R03 only the first two.
 */
export function csvFor(resource: Resource): string {
  const columns: CsvColumn[] = resource.csv.columns.map((header) => ({ key: header, header }));
  const rows = resource.csv.rows.map((cells) =>
    Object.fromEntries(resource.csv.columns.map((header, i) => [header, cells[i] ?? ''])),
  );
  return csvDocument(columns, rows);
}

/** `<fileBase>.csv` — what lands in somebody's Downloads folder. */
export const csvFilename = (resource: Resource): string => `${resource.fileBase}.csv`;

/**
 * A build-time `data:` URL, so a download needs no script and no round trip.
 *
 * Same call as the templates route makes, and for the same reason: these files
 * are well under a kilobyte, and a Blob would put JavaScript back into the one
 * path on these pages that currently does not need any.
 */
export const csvHref = (resource: Resource): string =>
  `data:text/csv;charset=utf-8,${encodeURIComponent(csvFor(resource))}`;
