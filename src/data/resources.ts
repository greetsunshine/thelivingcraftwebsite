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
  /** ISO date. Shown on the card and used as dateModified in structured data. */
  publishedAt: string;
}

export const resources: Resource[] = [
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
  return [...groups].map(([name, items]) => ({ name, items }));
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
