// Two resource models live here, and they answer different questions.
//
//   * `Resource` + `resources` describe a LINK: title, series, date, where it
//     points. /latest, /resources, /llms.txt and the sitemap read these.
//   * `LongformResource` + `RESOURCES` describe a DOCUMENT this site hosts in
//     full — its sections, tables and worksheets. /toolkit and the three
//     worksheet pages read these.
//
// They were written on two branches under the same filename. Keeping both in
// one module is deliberate: a second file called something like
// `longform-resources.ts` is how the sitemap ends up listing one set and
// /resources rendering the other.

// Published resources — the single source of truth for /resources.
//
// Three consumers read this and nothing else: the /resources page, the sitemap,
// and /llms.txt. Same reasoning as facts.ts: a resource described one way on the
// page and another way in the answer an AI assistant gives about us is the
// failure worth designing out, and it is the failure you never notice.
//
// These are NOT offers, which is why `surfaces` in facts.ts does not list them.
// They are evidence that the practice publishes working material — the same
// distinction the sitemap already draws for /latest.
//
// `url` should be a path on this site wherever the resource can be hosted here.
// The POC Selection Tool began life as a published Artifact and moved: an Artifact is
// private until it is shared from its own share menu, so a link to one is broken
// for every visitor until somebody remembers that step. Self-hosting removes the
// failure mode, and it makes the content crawlable, which is most of the reason
// to publish a tool at all.
//
// If a future row must point at an external URL, share it first and open it in a
// logged-out window before committing. A resources page listing things a visitor
// cannot open is worse than no resources page.

import { csvDocument, type CsvColumn } from '../lib/admin/csv';

export interface Resource {
  /** Slug. The anchor on /resources and the id in structured data. */
  id: string;
  /** Position in its series. Shown as the eyebrow number, so keep it two digits. */
  number: string;
  /** The series this belongs to. Grouping is by series on the page. */
  series: string;
  title: string;
  /** What kind of thing it is, in the reader's words rather than ours. */
  kind: string;
  /**
   * The decision this piece is about, in two or three words. It leads the row
   * on /resources, because a title alone does not say what the thing is FOR —
   * "The POC Selection Tool" and "The Run-Cost Model" are names, and a reader
   * scanning the list is looking for their problem, not for a name.
   * Required, so a new resource cannot join the list unlabelled.
   */
  topic: string;
  /** One line under the title on the card. Under 130 characters. */
  summary: string;
  /** The full description. Also the source for the page's meta description. */
  description: string;
  /** What a reader can do after using it. Verb-led and observable. */
  useFor: string[];
  /** How it behaves when opened, so nobody expects a PDF and gets an app. */
  format: string;
  /** Path on this site, or an absolute URL if it genuinely cannot be hosted here. */
  url: string;
  /** Bytes, for a file download. Omitted for a page — nobody needs the weight of HTML. */
  fileSize?: string;
  /** ISO date. Shown on the card and used as dateModified in structured data. */
  publishedAt: string;
}

export const resources: Resource[] = [
  {
    id: 'run-cost-model',
    topic: 'Cost Modelling',
    number: '01',
    series: 'Agent business case',
    title: 'The Run-Cost Model Tool',
    kind: 'Interactive model · 4 options side by side · 1 reference example',
    summary:
      'Cost four ways of doing the same job over one period, with the operating lines most business cases leave out, and find the one with the lowest cost per acceptable outcome.',
    description:
      'Almost every agent business case models the model bill and stops there. This tool puts four options side by side over one period: a rules workflow, the same workflow rebuilt on the decision rules an agent build forces you to write down, a model-assisted draft with human approval, and a full agent with tools. It keeps what you pay once apart from what you pay every month. The lines it makes you fill in are the ones that get forgotten: retries and failed tool calls, review minutes per reviewed case, engineer minutes per escalation, evaluation maintenance, re-qualifying against a new model version, prompt and regression testing, incident and on-call load, and the cases the system declines that a person finishes by hand. Quality sits beside cost throughout, because cost per case is the wrong number to argue about on its own. The number to argue about is cost per acceptable outcome. Every line is worked out as you type. The result names the leading option, gives the break-even month for each one, flags when cost per case and cost per acceptable outcome disagree, and lists the assumptions to check before you trust the answer. The reference example is an ordering agent across forty sites, priced at Indian rates in rupees, and it is deliberately a case where the full agent does not pay back inside the period, and where building it was still worth doing, because it produced the written specification that made the cheap option good.',
    useFor: [
      'Price an agent proposal across build and run, not just the model bill',
      'Compare a full agent against a rules workflow and a model-assisted draft on the same cases and one definition of an acceptable outcome',
      'Put a break-even month in front of a budget holder, including when the answer is never',
      'Show a team which of their operating assumptions, such as escalation rate, review minutes and upkeep, are doing the real work in the number',
    ],
    format:
      'Interactive. Type your figures in the page; every total, the leading option and the break-even months update as you go. The reference example is on its own tab and can be loaded into your model. Copy the model or print it without giving anything. A PDF of your model is built against a name and an email address. The same model is also offered as an Excel workbook.',
    url: '/resources/run-cost-model',
    publishedAt: '2026-09-14',
  },
  {
    id: 'agent-authority-review',
    topic: 'Scope of Authority',
    number: '02',
    series: 'Agentic system design',
    title: 'The Agent Authority Review',
    kind: 'Interactive sheet · live owner per step · 3 reference examples',
    summary:
      'Type the steps of a workflow and find out which ones an agent may own, which it may only suggest on, and which stay as code.',
    description:
      'Most agent design reviews ask one question: can the model do this step? That is the wrong question, and the demo hides it by doing the thinking and the acting in one go. There are two separate limits. How good the model is decides how much thinking you hand over; how hard an action is to undo decides how much authority you hand over. This tool sets a four-level undo-cost scale, from "undo in seconds, nobody notices" to "cannot be undone", and asks five questions of every step rather than of the workflow. You type the steps of your own workflow into the sheet and answer three of those questions per step: is there one right answer, what is the undo cost, and what does a second run do. The rubric names the owner of each step beside it as you answer: code, an agent with an eval set, or an agent that suggests while a human approves. The result is an authority map for the workflow, with the checks to clear before anything is handed over. Three reference examples with every row already decided, incident triage, refunds and goodwill credit, and automatic pull request merge, can be loaded into the sheet. There is a forty-minute protocol at the end for running it in a room.',
    useFor: [
      'Assign an undo cost to every action in a workflow before anyone argues about who owns the step',
      'Separate the steps that need a rule in code from the ones that genuinely need judgment',
      'Decide where an agent acts, where it only suggests, and where a human approves',
      'Find the action in your own system that cannot be undone and has never had a named owner',
    ],
    format:
      'Interactive. Type your steps and answer in the page; the owner of each step and the tally update as you go. Copy the sheet or print it without giving anything. A PDF of your assessment is built against a name and an email address.',
    url: '/resources/agent-authority-review',
    publishedAt: '2026-09-14',
  },
  {
    id: 'poc-screen',
    topic: 'Pilot Readiness',
    number: '01',
    series: 'Agentic system design',
    title: 'The POC Selection Tool',
    kind: 'Scored checklist · live score and result',
    summary:
      'Twelve questions that decide whether an agent proof of concept can reach production, scored before you build it.',
    description:
      'Most agent proofs of concept are judged after the demo goes well, which is the one moment nobody can judge them. This tool moves the decision earlier. Twelve questions in four sections: task fit, failure containment, evaluation evidence, and ownership and unit economics. Each question defines what earns a 0, a 1 and a 2, so two people scoring the same idea land on the same number instead of trading opinions. The maximum is 24. The score stays on screen and updates as you answer. One section is a hard gate: a 0 on failure containment stops the proof of concept whatever the total, because a high score elsewhere does not buy back an action you cannot undo. The result is read against a rubric with three outcomes: pilot candidate, narrow it and score again, or a demo rather than a pilot. A summary lists what to fix first and which of four pre-build moves answers each weak row. It closes with those four moves, cheapest first, each one cheaper than a pilot that fails in front of a customer.',
    useFor: [
      'Score a proposed agent against twelve criteria, and defend the number to someone who disagrees',
      'Find the rows where two people scored two points apart, which is where the team does not share a picture of the system',
      'Decide whether to narrow the scope of a proof of concept or stop it',
      'Answer most of the questions without building anything, using an evaluation set, a person playing the agent, deliberate tool failures, or a shadow run',
    ],
    format:
      'Interactive. Score in the page; the total, the section scores and the outcome update as you go. Copy the scorecard or print it without giving anything. A PDF of your scored copy is built against a name and an email address.',
    url: '/resources/poc-screen',
    publishedAt: '2026-09-13',
  },
  {
    id: 'model-selection-checklist',
    number: '03',
    topic: 'Model Selection',
    series: 'Agentic system design',
    title: 'The Model Selection Checklist',
    kind: 'Checklist · 26 checks',
    summary:
      'What to check before you choose a model for one step of your system, in the order to check it.',
    description:
      'Most model choices are made on a benchmark, a price and a demo. None of those tell you what a model leaves out, and what it leaves out is what costs you, because there is nothing on the page to mark wrong. This checklist is the generic version of the method: it works for support triage, invoice checks, code review, claim intake or anything else where a model reads something and produces a decision. Ten gates read off the model card in half an hour, each saying what a pass looks like and what a fail actually costs. Twelve things to score, each written as the single question you are answering, with starting weights for three kinds of step: drafting for a person, flagging and routing, and acting alone. Four disqualifiers that end a candidate whatever it scored. Four test cases you build out of your own work, including one where you plant the answer yourself so you know what should have been there, and one where the cost of doing nothing is the whole point. Then the method for scoring what is missing, and a one-page decision record to write on the day you choose. The boxes tick in the browser and nothing is stored.',
    useFor: [
      'Remove half a candidate list in half an hour, before running a single test',
      'Weight the twelve criteria for the specific step you are staffing rather than for the system',
      'Build four test cases out of your own work, with an answer key written before the first run',
      'Measure what a model leaves out, which no benchmark and no quality review will show you',
      'Record the decision so the next deprecation notice is a Tuesday rather than a project',
    ],
    format:
      'Page, with tickable checkboxes, blank tables and a decision record. A Download as PDF control opens the print dialogue. Nothing is stored or sent.',
    url: '/resources/model-selection-checklist',
    publishedAt: '2026-09-15',
  },
  {
    id: 'agent-failure-triage-kit',
    topic: 'Failure Handling',
    number: '04',
    series: 'Agentic system design',
    title: 'The Agent Failure Triage Kit',
    kind: 'Kit \u00b7 12 failure-injection tests, 1 runnable simulation',
    summary:
      'What an agent should do after a checker says no, and why retrying the wrong thing refunds one customer three times.',
    description:
      'A refund agent reads a receipt, the lookup times out, and the system records that there is no receipt. The checker rejects for missing evidence. The orchestrator retries the model three times, each attempt more confident than the last, and escalates. The lookup is never retried. Days later a human finds the receipt, approves, and the payment call times out; the same retry policy fires three times, every call reaches the provider, and the customer is refunded three times over. No component had a bug and the model never hallucinated. The system used one word, error, for three situations that need opposite responses. This kit separates them: evidence that is genuinely absent, a dependency that could not be reached, and an action with side effects that may or may not have executed. It gives you the four triage questions in the order to ask them, side effects first, because misclassifying an uncertain action as a temporary failure is the expensive mistake. Then a response playbook with the tempting wrong answer named beside the right one, the fields a rejection record has to carry, retry budgets by tool type with the amplification that happens when two layers each retry three times, a reconciliation checklist for actions whose outcome nobody established, and why a second model approving a plan does not make an external call safe. It closes with twelve failure injections run against two orchestrators, the results of both, and a forty-five minute exercise for a system you already own.',
    useFor: [
      'Tell a read that found nothing from a read that never completed, at the tool boundary',
      'Decide what may be retried automatically and what has to be reconciled first',
      'Write a rejection an on-call engineer can act on without re-deriving the diagnosis',
      'Find the retry in your own stack that multiplies against another one nobody remembers writing',
      'Run three failure injections against a production agent on a Monday morning',
    ],
    format:
      'Page, with the triage tree, every table and a worked rejection record. A Download as PDF control opens the print dialogue; nothing is stored or sent.',
    url: '/resources/agent-failure-triage-kit',
    publishedAt: '2026-09-16',
  },
  {
    id: 'agent-memory-audit-kit',
    topic: 'Agent Memory',
    number: '05',
    series: 'Agentic system design',
    title: 'Agent Memory Audit Kit',
    kind: 'Kit \u00b7 schema, 12 questions, 7 runnable tests, decision table',
    summary:
      'A schema, 12 audit questions, 7 runnable failure tests and a decision table for designing agent memory that stays correct.',
    description:
      'An expense agent remembered a project code Priya typed once, for one trip, and reused it on the next trip. The team shipped a fix: learn from user corrections. Three weeks later the agent put her own team’s dinner on a client’s bill, because a correction is a memory too. This kit gives every fact an agent remembers three answers: where it came from, where it applies, and what happens when someone corrects it. A memory record schema with fields for source, evidence, scope, expiry and correction route, and seven invariants a store has to hold. Twelve audit questions to run against one remembered fact, each with the red flag that means a design task. Seven failure tests as a pytest harness, with a naive store that fails all seven on purpose and a reference store that passes them, and a six-method protocol for running the same seven against your own memory layer. And a one-page decision table with four outcomes: Remember, Revalidate, Ask, Forget. The page is the resource; the ZIP carries the PDF, the schema, four example records, the harness and both licences.',
    useFor: [
      'Name the evidence, the scope and the correction route for one fact your agent remembers today',
      'Separate what a user stated, what a system record says and what the agent inferred, before any of it reaches a prompt',
      'Run seven failure tests against your own memory layer and read each failure as one design task',
      'Decide, for any remembered fact, whether the agent may apply it, must revalidate it, must ask, or must forget it',
      'Find the correction in your system that changed more than the instance it was made on',
    ],
    format:
      'Page, with the schema, the questions, the tests and the decision table. Downloads: the full kit as a ZIP (PDF, schema, examples, harness) and the PDF alone. Nothing is stored or sent.',
    url: '/resources/agent-memory-audit-kit',
    publishedAt: '2026-09-17',
  },
  {
    id: 'rule-placement-audit',
    topic: 'Rule Placement',
    number: '06',
    series: 'Agentic system design',
    title: 'The Rule Placement Audit',
    kind: 'Browser worksheet · live status per rule · 1 worked example',
    summary:
      'List the rules your agent must never break and find out where each one is actually enforced: in code, in a prompt, by a critic model, or nowhere.',
    description:
      'A restaurant-picking agent recommended a restaurant on the user\u2019s no-go list. The model was not at fault: the rule was written in the prompt and enforced nowhere else, so the model weighed it against everything else in the context and, once, chose against it. This worksheet is the audit that finds every rule in that position. One row per hard rule: who set it, how many agents can act on it, and where it is enforced, across five placements. Two of them are code before the model and code after it; one is the tool or data boundary, which holds whichever agent asked; the other two are the prompt and a critic or guardrail model, which are both something a model weighs. The status beside each rule updates as you tick, and the rule map groups the rows with the unenforced, prompt-only and model-only rules first, each with the fix it needs and an owner. A flag names the rule that more than one agent can break and that is enforced inside only one of them. Entries stay in the browser; the map prints on one page and downloads as CSV.',
    useFor: [
      'Find the rule that exists only in a prompt, and name the filter or check it needs in code',
      'Tell a critic model checking a step from a check that enforces the step',
      'Find the rule that two agents can break and that only one of them checks',
      'Hand a one-page rule map to the team with the owner and the fix beside each flagged row',
    ],
    format:
      'Interactive. Type your rules and tick placements in the page; the status of each rule and the map update as you go. Print the map, copy it or download the CSV without giving anything. Autosaved in your browser; nothing is sent.',
    url: '/resources/rule-placement-audit',
    publishedAt: '2026-09-17',
  },
  {
    id: 'cost-ceiling-workbook',
    topic: 'Cost Control',
    number: '02',
    series: 'Agent business case',
    title: 'The Cost-Ceiling Workbook',
    kind: 'Workbook · 7 tabs, with a calculator on the page',
    summary:
      'Estimate agent cost per attempt, per accepted result and per period, then price what happens when a shared ceiling stops the work.',
    description:
      'A cost ceiling is a business decision wearing an engineering costume, and the arithmetic that shows it is not hard \u2014 it is just never done before the ceiling is set. This workbook does it in four steps. What one attempt costs, once you count the context an agent re-sends on every turn, the reasoning tokens billed as output whether or not you display them, the cache reads and writes, and the tool calls. What a completed case costs and what a whole period costs, in a normal scenario and a stressed one side by side, ending on fully loaded cost per accepted result rather than on a rate card. How far a shared ceiling overshoots when several workers claim against it at once, why check-then-act breaches it by one full cap per worker, and what an atomic reservation locks up in headroom instead. And then the question nobody models: when the ceiling trips, is stopping actually cheaper than continuing? Three options are priced against each other \u2014 lift the ceiling and finish, freeze the cases, or route them to people \u2014 with a break-even business cost per frozen case. It closes with an eleven-field boundary register, one row filled in, and seven tests to run before trusting any boundary you write down. The calculator on the page runs the same model as the spreadsheet and stores nothing.',
    useFor: [
      'Price one agent attempt to the token, including the lines that are usually missed',
      'Compare a normal period against a stressed one on cost per accepted result, not on price per token',
      'Show how far a shared ceiling overshoots under concurrency, and what a reservation costs in locked headroom',
      'Put a number on what freezing a case costs the business, and compare it with finishing the case',
      'Write down every boundary with its enforcement point, its stop behaviour and its owner',
    ],
    format:
      'Page with a live calculator, plus an Excel workbook to download. Nothing is stored, nothing is sent, and no email address is asked for.',
    url: '/resources/cost-ceiling-workbook',
    publishedAt: '2026-09-16',
  },
];

/**
 * One line per series, used as the section heading on /resources. A count
 * ("two tools") is not a heading — it tells a reader nothing they cannot see.
 */
export const SERIES_BLURBS: Record<string, string> = {
  'Agent business case': 'What it costs to run, before anyone commits to building it.',
  'Agentic system design': 'What to decide before the build, and how to tell a pilot from a demo.',
};

/** True when the url points at a file to download rather than a page to open. */
export const isDownload = (url: string): boolean => /\.[a-z0-9]{2,5}$/i.test(url);

/** Newest first. The page and the structured data both read this, not `resources`. */
export const publishedResources = [...resources].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);

/** Series, in the order their newest item was published. */
export const resourceSeries = (): { name: string; items: Resource[] }[] => {
  const groups = new Map<string, Resource[]>();
  for (const r of publishedResources) {
    const list = groups.get(r.series);
    if (list) list.push(r);
    else groups.set(r.series, [r]);
  }
  // Series appear newest-first; items inside a series read in series order, so
  // 01 sits above 02 rather than the publication order flipping them.
  return [...groups].map(([name, items]) => ({
    name,
    items: [...items].sort((a, b) => a.number.localeCompare(b.number)),
  }));
};

export const newestResourceDate = (): string =>
  publishedResources[0]?.publishedAt ?? new Date().toISOString().slice(0, 10);

/** "13 September 2026" — matches the long-date style used on /latest. */
export const longDate = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });


// ---------------------------------------------------------------------------
// Long-form documents hosted on this site
// ---------------------------------------------------------------------------

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

export interface LongformResource {
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

const costCeiling: LongformResource = {
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

const evaluationGates: LongformResource = {
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

const deploymentChecklist: LongformResource = {
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
export const RESOURCES: LongformResource[] = [costCeiling, evaluationGates, deploymentChecklist];

/**
 * What /toolkit and /resources may list. Same predicate as the guides and
 * templates indexes: the writing is finished, so the route exists.
 */
export const releasedResources = (): LongformResource[] =>
  RESOURCES.filter((r) => r.status === 'ready').sort((a, b) => a.order - b.order);

export const resourceById = (id: string): LongformResource | undefined =>
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
export function csvFor(resource: LongformResource): string {
  const columns: CsvColumn[] = resource.csv.columns.map((header) => ({ key: header, header }));
  const rows = resource.csv.rows.map((cells) =>
    Object.fromEntries(resource.csv.columns.map((header, i) => [header, cells[i] ?? ''])),
  );
  return csvDocument(columns, rows);
}

/** `<fileBase>.csv` — what lands in somebody's Downloads folder. */
export const csvFilename = (resource: LongformResource): string => `${resource.fileBase}.csv`;

/**
 * A build-time `data:` URL, so a download needs no script and no round trip.
 *
 * Same call as the templates route makes, and for the same reason: these files
 * are well under a kilobyte, and a Blob would put JavaScript back into the one
 * path on these pages that currently does not need any.
 */
export const csvHref = (resource: LongformResource): string =>
  `data:text/csv;charset=utf-8,${encodeURIComponent(csvFor(resource))}`;
