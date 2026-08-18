// The six things the radar agent watches.
//
// Kept in its own module, with no imports, because three very different places
// need the same list and must not drift: the retriever script that sweeps them
// (scripts/gather-radar.ts), the schema enum that constrains what the model may
// return, and the admin console that groups findings under them. A label typed
// twice is a category that silently splits in two.
//
// These are Sunil's questions, not a prospect's. That distinction is the whole
// reason this feed exists separately from latest.json — see src/lib/agent/radar.ts.

export interface RadarCategory {
  key: string;
  /** Shown as the tab/section heading in /admin/radar. */
  label: string;
  /** One line under the heading — what this category is for. */
  brief: string;
  /** The research topic handed to the agent. One call per entry, so make it specific. */
  topic: string;
}

export const RADAR_CATEGORIES: RadarCategory[] = [
  {
    key: 'trends',
    label: 'Trends',
    brief: 'Where the agentic AI field is actually moving — techniques, architectures, consensus shifts.',
    topic:
      'Substantive trends in agentic AI over the last 90 days — architectural shifts, techniques moving from research into production, and changes in how practitioners think about building agent systems. Exclude funding news and product marketing.',
  },
  {
    key: 'investment',
    label: 'Big-tech investment',
    brief: 'Where Google, Microsoft, Amazon, Meta, Anthropic, OpenAI, NVIDIA and the Indian majors are putting money and headcount.',
    topic:
      'Where large technology companies are investing in agentic AI — infrastructure commitments, acquisitions, research bets, product lines, and stated strategy from Google, Microsoft, Amazon, Meta, NVIDIA, Anthropic, OpenAI, and the large Indian IT services firms. Prefer earnings calls, official announcements, and filings over press speculation.',
  },
  {
    key: 'working',
    label: 'What is working',
    brief: 'Agentic ideas with evidence behind them — deployments that stuck, patterns that hold up.',
    topic:
      'Agentic AI approaches that are demonstrably succeeding in production — deployments with published outcomes, patterns that independent teams have confirmed, techniques that survived contact with real workloads. Require evidence beyond a vendor asserting its own success.',
  },
  {
    key: 'failing',
    label: 'What is failing',
    brief: 'Agentic ideas that are not surviving contact with production — retractions, walk-backs, negative results.',
    topic:
      'Agentic AI approaches that are failing or being abandoned — published negative results, retracted or walked-back claims, deployments rolled back, benchmarks that did not replicate, and honest post-mortems from teams that stopped. Exclude competitor sniping and opinion pieces with no evidence.',
  },
  {
    key: 'hiring-india',
    label: 'Hiring — India',
    brief: 'What Indian employers are actually hiring for in agentic AI, and at what level.',
    topic:
      'Hiring trends for agentic AI roles in India — job postings, salary and compensation reporting, headcount announcements from GCCs and Indian IT services firms, and staffing/recruiter data on which agentic AI skills Indian employers are recruiting for. Prefer named surveys, official company announcements, and job-board data over generic trend articles.',
  },
  {
    key: 'skills',
    label: 'Durable skills',
    brief: 'Capabilities likely to still be in demand in two years — the ones worth teaching.',
    topic:
      'Skills and competencies in agentic AI that evidence suggests will remain in demand rather than being automated away or absorbed into tooling — as reported in employer surveys, skills-gap research, curriculum changes, and practitioner accounts of what teams cannot hire for.',
  },
];

export const CATEGORY_KEYS = RADAR_CATEGORIES.map((c) => c.key);

/**
 * How long a finding stays on the radar.
 *
 * Lives here rather than beside the store because both the retriever script and
 * the console filter by it, and this module has no imports of its own — so it
 * can be read from either runtime without dragging anything else in.
 */
export const RADAR_MAX_AGE_DAYS = 120;

export const categoryLabel = (key: string): string =>
  RADAR_CATEGORIES.find((c) => c.key === key)?.label ?? key;
