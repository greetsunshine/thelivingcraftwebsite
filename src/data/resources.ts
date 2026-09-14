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
// The POC Screen began life as a published Artifact and moved: an Artifact is
// private until it is shared from its own share menu, so a link to one is broken
// for every visitor until somebody remembers that step. Self-hosting removes the
// failure mode, and it makes the content crawlable, which is most of the reason
// to publish a tool at all.
//
// If a future row must point at an external URL, share it first and open it in a
// logged-out window before committing. A resources page listing things a visitor
// cannot open is worse than no resources page.

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
    number: '01',
    series: 'Agent business case',
    title: 'The Run-Cost Model',
    kind: 'Spreadsheet · 3 tabs',
    summary:
      'A twelve-month cost comparison of four ways to do the same job, with the operating lines most business cases leave out.',
    description:
      'Almost every agent business case models the model bill and stops there. This one puts four arms side by side over twelve months — a rules workflow, the same workflow rebuilt on the decision rules an agent build forces you to write down, a model-assisted draft with human approval, and a full agent with tools — and separates what you pay once from what you pay every month. The lines it makes you fill in are the ones that get forgotten: retries and failed tool calls, review minutes per reviewed case, engineer minutes per escalation, evaluation maintenance, re-qualifying against a new model version, prompt and regression testing, incident and on-call load, and the cases the system declines that a person finishes by hand. Quality sits next to cost throughout, because cost per case is the wrong number to argue about on its own. The number to argue about is cost per acceptable outcome. The worked example is an ordering agent across forty sites, priced at Indian rates in rupees, and it is deliberately a case where the full agent never breaks even — and where building it was still worth doing, because it produced the written specification that made the cheap option good.',
    useFor: [
      'Price an agent proposal across build and run, not just the model bill',
      'Compare a full agent against a rules workflow and a model-assisted draft on the same cases and one definition of an acceptable outcome',
      'Put a break-even month in front of a budget holder, including when the answer is never',
      'Show a team which of their operating assumptions — escalation rate, review minutes, upkeep — are doing the real work in the number',
    ],
    format:
      'Excel workbook. Read Me, the model, and a filled worked example. Fill in the blue cells; the yellow ones set everything else.',
    url: '/downloads/agent-run-cost-model.xlsx',
    fileSize: '17 KB',
    publishedAt: '2026-09-14',
  },
  {
    id: 'agent-authority-review',
    number: '02',
    series: 'Agentic system design',
    title: 'The Agent Authority Review',
    kind: 'Worksheet · 3 worked examples',
    summary:
      'A way to decide which steps in a workflow should get an agent, and which should not — yet.',
    description:
      'Most agent design reviews ask one question: can the model do this step? That is the wrong question, and the demo hides it by doing the thinking and the acting in one go. There are two separate limits. How good the model is decides how much thinking you hand over; how hard an action is to undo decides how much authority you hand over. This sets out a four-level undo-cost scale from "undo in seconds, nobody notices" to "cannot be undone", five questions to ask of every step rather than of the workflow, a blank worksheet, and the rules for reading it once it is full. Then three worked examples with every row already decided — incident triage, refunds and goodwill credit, and automatic pull request merge — each one closing on the rows the author would not hand to an agent yet, and why. There is a forty-minute protocol at the end for running it against a workflow you already own.',
    useFor: [
      'Assign an undo cost to every action in a workflow before anyone argues about who owns the step',
      'Separate the steps that need a rule in code from the ones that genuinely need judgment',
      'Decide where an agent acts, where it only suggests, and where a human approves',
      'Find the action in your own system that cannot be undone and has never had a named owner',
    ],
    format:
      'Page, with a blank worksheet and three filled examples. Prints cleanly if you want the table on paper.',
    url: '/resources/agent-authority-review',
    publishedAt: '2026-09-14',
  },
  {
    id: 'poc-screen',
    number: '01',
    series: 'Agentic system design',
    title: 'The POC Screen',
    kind: 'Scored checklist',
    summary:
      'Twelve questions that decide whether an agentic proof of concept can reach production — asked before you build it.',
    description:
      'Most agentic proofs of concept are judged after the demo goes well, which is the one moment nobody is able to judge them. This screen moves the decision earlier. Twelve questions across four sections, and each question defines what earns a 0, a 1 and a 2, so two people scoring the same proof of concept land in the same place instead of trading opinions. The maximum is 24. One section is a hard gate: any zero on blast radius stops the exercise whatever the total says, because a high score elsewhere does not buy back an action you cannot undo. Three cut-lines read the result — pilot candidate, narrow it and score again, or a demo rather than a pilot. It closes with four ways to answer most of the questions before the agent exists, in ascending order of cost, each one cheaper than a pilot that fails in front of a customer.',
    useFor: [
      'Score a proposed agent against twelve criteria, and defend the number to someone who disagrees',
      'Find the rows where two people scored two points apart, which is where the team does not share a picture of the system',
      'Decide whether to narrow the scope of a proof of concept or stop it',
      'Answer most of the screen without building anything, using an evaluation set, a human behind the curtain, deliberate tool failures, or a shadow run',
    ],
    format:
      'Interactive. Scores in the page and nothing is stored or sent — a worked example to load, a copyable scorecard, and a print view.',
    url: '/resources/poc-screen',
    publishedAt: '2026-09-13',
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
