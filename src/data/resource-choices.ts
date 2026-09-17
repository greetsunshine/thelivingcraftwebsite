// The "choices" at the top of /resources: one line per released, featured tool.
//
// Each row is the reader's question, then the action and the tool's name,
// linking to the tool's own page. It is a routing table, not a catalogue —
// `resources.ts` still owns the descriptions, the sitemap and llms.txt. A row
// joins this list only when the tool it points at is live on this site;
// nothing planned, nothing "coming soon". The page renders exactly this array,
// so adding a tool later is one entry here and nothing else.

export interface ResourceChoice {
  /** The reader's question, in their words. Ends with a question mark. */
  question: string;
  /** Verb plus the tool's name, e.g. "Use the Rule Placement Audit". */
  action: string;
  /** Path on this site. */
  url: string;
}

export const RESOURCE_CHOICES: ResourceChoice[] = [
  {
    question: 'Where is each hard rule actually enforced?',
    action: 'Use the Rule Placement Audit',
    url: '/resources/rule-placement-audit',
  },
];
