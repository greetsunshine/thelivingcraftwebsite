/**
 * The Cost-Ceiling Workbook — the words, the field list and the register.
 *
 * Same split as every other resource in this repo: the CALCULATION lives in
 * src/lib/costCeiling.ts and the CONTENT lives here. The page imports both and
 * writes neither.
 *
 * The field descriptors below are why this file exists rather than the copy
 * being typed into the template. The calculator renders the Attempt and Period
 * sections TWICE — once for the normal day and once for the storm night — and a
 * label typed twice is a label that disagrees with itself the first time
 * somebody edits one column. So the page loops over these.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * NOTHING HERE IS A MEASUREMENT.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Every number in the scenario, the register and the worked example is an
 * invented teaching value. The prices are the one exception and they carry
 * their own health warning: they were compiled from public pricing pages and
 * trackers on one day, the trackers disagreed, and the page says so.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Links that are not settled yet
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The LinkedIn post this page is the companion to.
 *
 * 'TODO' until the post is live. The page HIDES the link entirely while the
 * value is 'TODO' rather than rendering a dead one — a companion link that goes
 * nowhere is worse than no link, because the reader arrived from the post and
 * will assume the site is broken rather than unfinished.
 */
export const LINKEDIN_EPISODE_5_URL: string = 'TODO';

export const hasLinkedInPost = (): boolean =>
  LINKEDIN_EPISODE_5_URL !== 'TODO' && LINKEDIN_EPISODE_5_URL.startsWith('https://');

/** The cohort application. The anchor on the cohort page, as every other resource uses. */
export const APPLY_URL = '/#apply';

// ═══════════════════════════════════════════════════════════════════════════
// Section 1 — the header
// ═══════════════════════════════════════════════════════════════════════════

export const HEADING = 'The Cost-Ceiling Workbook';

export const SUBHEADING =
  'Price an AI agent the way your CFO will see it: per attempt, per accepted result, per period, and what it costs when the ceiling stops the work.';

export const SUPPORTING_LINE =
  'Free resource. Companion to Agentic system design, Episode 5. Model prices checked 16 September 2026.';

export const PRIMARY_CTA = 'Download the workbook (.xlsx)';
export const SECONDARY_CTA = 'Try the calculator';

export const META_TITLE = 'Cost-Ceiling Workbook for Agentic AI | The Living Craft';
export const META_DESCRIPTION =
  'A free working model for engineering leaders: token-level cost per attempt, concurrency overshoot, and the cost of stopping when an AI agent hits its budget.';

/** Where the file sits. One constant, read by the button and by the build check. */
export const DOWNLOAD_PATH = '/downloads/cost-ceiling-workbook.xlsx';

// ═══════════════════════════════════════════════════════════════════════════
// Section 2 — the 01:52 problem
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A composite scenario. Not a client, not a case study, not an incident report.
 *
 * The label that says so sits ABOVE these paragraphs on the page, not below
 * them in small type, because a reader who takes the first paragraph for a real
 * incident has already taken it for one by the time they reach a footnote.
 */
export const SCENARIO_LABEL =
  'A composite scenario with illustrative numbers. It is not an account of a real airline, a real incident or a real bill.';

export const SCENARIO: string[] = [
  'A storm night, and an airline rebooking agent. Six hours, 38,000 passengers to move, against 2,000 on a normal day. The agent had run for months without anybody thinking hard about what it cost.',
  'Retries rose from 1.3 to 3.1 attempts per passenger. Every single attempt stayed under its $0.40 cap, so no per-attempt control ever fired. 600 attempts were in flight at once against a $26,600 shared ceiling. The price per token did not change that night. Cost per passenger rose 3.5x anyway.',
  'At 01:52 the ceiling tripped. 2,926 rebookings froze in a state no operator queue showed. The control saved $2,219 in tokens. The airline paid $351,120 in hotel vouchers.',
];

export const SCENARIO_CLOSER = 'A cost ceiling is a business decision wearing an engineering costume.';

// ═══════════════════════════════════════════════════════════════════════════
// Section 3 — what the workbook answers
// ═══════════════════════════════════════════════════════════════════════════

/** Numbered, because the order is the workbook's tab order and not a ranking. */
export const ANSWERS: string[] = [
  'What does one attempt really cost once context re-sending, caching, reasoning tokens and tools are counted?',
  'What does a completed case cost, and what does the whole period cost, in a normal and a stressed scenario?',
  'If several workers share one ceiling, how far can spend overshoot it, and what does a reservation cost in headroom?',
  'When the ceiling trips, is stopping actually cheaper than continuing?',
];

// ═══════════════════════════════════════════════════════════════════════════
// Section 4 — the calculator's fields
// ═══════════════════════════════════════════════════════════════════════════

export interface Field {
  /** Must match the key on the inputs object in lib/costCeiling.ts. */
  key: string;
  label: string;
  /** Shown beside the input. Never left blank — an unlabelled number is a guess. */
  unit: string;
  /**
   * The one-line reason this input changes the answer. Optional, because a few
   * fields genuinely need no gloss and a manufactured one is noise.
   */
  why?: string;
  kind: 'number' | 'percent' | 'bool';
  step?: number;
  min?: number;
  max?: number;
}

/**
 * Percent fields are stored as fractions and SHOWN as percentages.
 *
 * The conversion happens in exactly one place in the page script. It is worth
 * the one conversion: "0.92" in a field labelled "accepted share" is read wrong
 * by somebody in a hurry, and this page is read in a hurry.
 */
export const ATTEMPT_FIELDS: Field[] = [
  {
    key: 'turns',
    label: 'Model turns per attempt',
    unit: 'turns',
    why: 'Storm night: a slow seat-availability API adds turns.',
    kind: 'number',
    step: 1,
    min: 1,
  },
  {
    key: 'prefixTokens',
    label: 'Cacheable prefix',
    unit: 'tokens per turn',
    why: 'Stable system prompt and tool schemas, sent every turn.',
    kind: 'number',
    step: 500,
    min: 0,
  },
  {
    key: 'initialContextTokens',
    label: 'Initial context',
    unit: 'tokens',
    why: 'Booking record, disruption notice, policy extract.',
    kind: 'number',
    step: 500,
    min: 0,
  },
  {
    key: 'growthPerTurn',
    label: 'Context growth per turn',
    unit: 'tokens',
    why: 'Tool results and prior output, re-sent on later turns.',
    kind: 'number',
    step: 100,
    min: 0,
  },
  {
    key: 'outputPerTurn',
    label: 'Visible output per turn',
    unit: 'tokens',
    kind: 'number',
    step: 50,
    min: 0,
  },
  {
    key: 'reasoningPerTurn',
    label: 'Reasoning tokens per turn',
    unit: 'tokens',
    why: 'Billed as output. Often the largest hidden line.',
    kind: 'number',
    step: 50,
    min: 0,
  },
  {
    key: 'cacheHitRate',
    label: 'Cache hit rate on the prefix',
    unit: '%',
    why: 'Cache expiry during bursty traffic lowers this.',
    kind: 'percent',
    step: 1,
    min: 0,
    max: 100,
  },
  {
    key: 'useBatch',
    label: 'Batch pricing',
    unit: 'on or off',
    why: 'A live rebooking agent cannot wait.',
    kind: 'bool',
  },
  {
    key: 'toolCostPerAttempt',
    label: 'Tool cost per attempt',
    unit: 'USD',
    why: 'Seat search, fare quote, notification calls.',
    kind: 'number',
    step: 0.001,
    min: 0,
  },
];

export const PERIOD_FIELDS: Field[] = [
  { key: 'hours', label: 'Period length', unit: 'hours', kind: 'number', step: 1, min: 0 },
  { key: 'cases', label: 'Cases in the period', unit: 'cases', kind: 'number', step: 100, min: 0 },
  {
    key: 'attemptsPerCase',
    label: 'Attempts per case',
    unit: 'attempts',
    why: 'Late tool responses and timeouts drive retries under load.',
    kind: 'number',
    step: 0.1,
    min: 0,
  },
  {
    key: 'acceptedShare',
    label: 'Accepted share',
    unit: '%',
    why: 'Use one written acceptance definition for both scenarios.',
    kind: 'percent',
    step: 1,
    min: 0,
    max: 100,
  },
  {
    key: 'escalatedShare',
    label: 'Escalated share',
    unit: '%',
    kind: 'percent',
    step: 1,
    min: 0,
    max: 100,
  },
  { key: 'reviewMinutes', label: 'Review minutes per escalation', unit: 'minutes', kind: 'number', step: 1, min: 0 },
  { key: 'reviewHourlyCost', label: 'Reviewer cost', unit: 'USD per hour', kind: 'number', step: 1, min: 0 },
  { key: 'bgRuns', label: 'Background runs', unit: 'runs', kind: 'number', step: 1, min: 0 },
  { key: 'bgInputTokens', label: 'Background input per run', unit: 'tokens', kind: 'number', step: 10000, min: 0 },
  { key: 'bgOutputTokens', label: 'Background output per run', unit: 'tokens', kind: 'number', step: 1000, min: 0 },
  { key: 'bgUseBatch', label: 'Background batch pricing', unit: 'on or off', kind: 'bool' },
  {
    key: 'fixedCost',
    label: 'Fixed cost for the period',
    unit: 'USD',
    why: 'Allocate shared cost to the period once.',
    kind: 'number',
    step: 5,
    min: 0,
  },
  { key: 'fxRate', label: 'Reporting currency rate', unit: 'multiplier', kind: 'number', step: 0.01, min: 0 },
];

export const CEILING_FIELDS: Field[] = [
  {
    key: 'ceiling',
    label: 'Shared ceiling for the period',
    unit: 'USD',
    why: 'One budget, claimed against by every worker at once.',
    kind: 'number',
    step: 100,
    min: 0,
  },
  {
    key: 'capPerAttempt',
    label: 'Cap per attempt',
    unit: 'USD',
    why: 'The worst case a single attempt may reach before it is stopped.',
    kind: 'number',
    step: 0.01,
    min: 0,
  },
  {
    key: 'concurrentInFlight',
    label: 'Attempts in flight at once',
    unit: 'attempts',
    why: 'Every one of them can read the same balance before any of them writes.',
    kind: 'number',
    step: 10,
    min: 0,
  },
  {
    key: 'billingLagMinutes',
    label: 'Billing lag',
    unit: 'minutes',
    why: 'Money already spent that the provider has not reported yet.',
    kind: 'number',
    step: 5,
    min: 0,
  },
];

export const STOPPING_FIELDS: Field[] = [
  {
    key: 'businessCostPerFrozenCase',
    label: 'Business cost per frozen case',
    unit: 'USD',
    why: 'The voucher, the compensation, the call. Not a token cost.',
    kind: 'number',
    step: 5,
    min: 0,
  },
  {
    key: 'shareIncurringCost',
    label: 'Share of frozen cases that incur it',
    unit: '%',
    why: 'Some frozen cases resolve themselves. Most, on a storm night, do not.',
    kind: 'percent',
    step: 1,
    min: 0,
    max: 100,
  },
  { key: 'humanMinutesPerCase', label: 'Human minutes per case', unit: 'minutes', kind: 'number', step: 1, min: 0 },
  { key: 'humanHourlyCost', label: 'Human cost', unit: 'USD per hour', kind: 'number', step: 1, min: 0 },
  {
    key: 'humanResolvedShare',
    label: 'Share a human actually resolves',
    unit: '%',
    why: 'The rest still incur the business cost, after the human time is spent.',
    kind: 'percent',
    step: 1,
    min: 0,
    max: 100,
  },
];

/** The three figures the page leads on, named once so the markup cannot drift. */
export const HEADLINE_VIEWS = [
  { key: 'costPerAttempt', label: 'Cost per attempt', note: 'Model tokens plus tools, one attempt.' },
  { key: 'costPerCase', label: 'Agent cost per case', note: 'Agent spend only, divided by cases.' },
  {
    key: 'costPerAccepted',
    label: 'Fully loaded cost per accepted result',
    note: 'Everything, divided by the cases that met the acceptance definition. This is the number to argue about.',
  },
];

export const STOPPING_OPTION_LABELS = [
  {
    id: 'A',
    name: 'Continue',
    body: 'Lift the ceiling and finish the frozen cases with the agent. Costs the token spend the ceiling avoided.',
  },
  {
    id: 'B',
    name: 'Freeze',
    body: 'Leave the cases stopped and pay whatever a frozen case costs the business.',
  },
  {
    id: 'C',
    name: 'Route to people',
    body: 'Send the frozen cases to a human queue. Costs the human time, plus the business cost on the ones people do not resolve.',
  },
];

export const BREAK_EVEN_NOTE =
  'Above this business cost per frozen case, freezing costs more than finishing the case with the agent.';

// ═══════════════════════════════════════════════════════════════════════════
// Section 5 — the boundary register and the seven tests
// ═══════════════════════════════════════════════════════════════════════════

export const REGISTER_FIELDS: string[] = [
  'Boundary',
  'Limit',
  'Unit',
  'Enforcement point',
  'Stop behaviour',
  'State preserved',
  'Owner',
  'Cost of stopping per case',
  'Test case',
  'Evidence',
  'Review trigger',
];

/** One filled row, in the same order as REGISTER_FIELDS. Checked by a test on the page build. */
export const REGISTER_EXAMPLE: string[] = [
  'Aggregate period cost',
  '26,600',
  'USD per disruption night',
  'Budget service: atomic reservation before each attempt',
  'Stop new cases; finish in-flight attempts; route new cases to the disruption desk queue',
  'Case id, passenger contact, last confirmed seat hold, attempts so far',
  'Disruption ops lead',
  '$120',
  '600 concurrent attempts at 99% of ceiling, with the seat API responding late',
  'Load-test report and reconciliation against provider usage',
  'Volume change over 20%, model or price change, voucher policy change',
];

/** The boundaries that need filling in. Deliberately blank — these are yours, not ours. */
export const BLANK_BOUNDARIES: string[] = [
  'Attempts per case',
  'Model turns per attempt',
  'Tool calls per attempt',
  'Elapsed time per case',
  'Cost per attempt',
  'Aggregate period cost',
  'Concurrent in-flight attempts',
  'Background job spend',
];

export const SEVEN_TESTS: { name: string; body: string }[] = [
  {
    name: 'At the limit',
    body: 'A case whose next attempt would cross the cap stops cleanly, and its state is visible to an operator.',
  },
  {
    name: 'Repeated submission',
    body: 'An idempotency key prevents a second rebooking or a second charge.',
  },
  {
    name: 'Concurrency',
    body: 'Many workers claim the shared ceiling at once, and total claims never exceed the ceiling.',
  },
  {
    name: 'Late tool response',
    body: 'A seat API answer arriving after a timeout does not create a second seat hold or silently restart the case.',
  },
  {
    name: 'Worker failure',
    body: 'An expired claim is released and the case appears in a review queue.',
  },
  {
    name: 'Billing reconciliation',
    body: 'Local reservations are compared with provider usage after the lag window, and the difference and its investigator are recorded.',
  },
  {
    name: 'Model swap',
    body: 'A cheaper per-token model is compared on cost per accepted result for the same cases, not on rate cards.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Section 6 — how to use the .xlsx
// ═══════════════════════════════════════════════════════════════════════════

export const TABS: { name: string; body: string }[] = [
  { name: 'Start', body: 'Read the legend, set your reporting currency, and pick the model you are pricing.' },
  { name: 'Prices', body: 'The price card, with a Custom row for a rate you have been quoted.' },
  { name: 'Attempt', body: 'What one attempt costs, broken into cached input, uncached input, output and tools.' },
  { name: 'Period', body: 'Two scenarios side by side, from cost per attempt to fully loaded cost per accepted result.' },
  { name: 'Ceiling', body: 'How far a shared ceiling overshoots under concurrency, and what a reservation locks up.' },
  { name: 'Stopping', body: 'The three options when the ceiling trips, priced against each other.' },
  { name: 'Boundaries', body: 'The register: eleven fields per boundary, with one row filled in as an example.' },
];

export const LEGEND: { swatch: 'input' | 'assumption' | 'linked' | 'formula'; body: string }[] = [
  { swatch: 'input', body: 'Blue text is an input. Change it.' },
  { swatch: 'assumption', body: 'Yellow fill is a key assumption. Change it, and write down why.' },
  { swatch: 'linked', body: 'Green text is linked from another tab. Change it at the source.' },
  { swatch: 'formula', body: 'Black is a formula. Leave it alone unless you mean to change the model.' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Section 7 — 2026 tokenomics
// ═══════════════════════════════════════════════════════════════════════════

export const TOKENOMICS: string[] = [
  'Output tokens usually cost several times input (5x on current Claude tiers). Reasoning tokens are billed as output even when you never display them.',
  'An agent re-sends its accumulated context on every turn, so input tokens grow with the square of the turn count.',
  'Across current models, output prices span roughly $0.50 to $50 per million tokens, so model choice is usually the largest single lever.',
  'Cache reads on current Claude models cost about a tenth of input price. Batch processing halves eligible cost but only suits work that can wait.',
  'A cheaper price per token can still cost more per case if the model takes more turns or retries. Compare cost per accepted result, not rate cards.',
  'Prices moved several times between June and September 2026. Record the checked date and re-run the estimate when a rate changes.',
];

/** Verbatim, and it stays verbatim. It is the one claim this page makes about its own sources. */
export const VERIFICATION_NOTE =
  'Prices were compiled from public pricing pages and trackers on 16 September 2026. Trackers disagreed on at least one current rate. Verify on the provider’s own pricing page before relying on any figure.';

// ═══════════════════════════════════════════════════════════════════════════
// Section 8 — caveats
// ═══════════════════════════════════════════════════════════════════════════

export const CAVEATS: string[] = [
  'All example values are invented teaching values, not prices, forecasts or observed results.',
  'This workbook supplies no universally safe budget.',
  'Money is not the only stopping cost. If a stopped case can cause harm, a regulatory breach or an unsafe action, the ceiling may be right even when it costs more.',
];

// ═══════════════════════════════════════════════════════════════════════════
// Section 9 — the cohort
// ═══════════════════════════════════════════════════════════════════════════

export const COHORT_HEADING = 'Build agentic systems that hold up in production';

/**
 * The start month is READ from facts.ts, never typed here.
 *
 * Decision D1 (14 September) made the start date public, and #14 set it to
 * October 2026. This page prints whatever `cohort.startsOn` says, so if the
 * date moves again the page moves with it and cannot become a second source.
 */
export const cohortLine = (startsOn: string): string =>
  `The next Living Craft cohort for senior engineering leaders and architects starts in ${startsOn}.`;

export const COHORT_CTA = 'Apply to the cohort';

// ═══════════════════════════════════════════════════════════════════════════
// The neighbours
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Two sibling resources with confusingly similar names, linked on purpose.
 *
 * /resources/cost-ceiling-worksheet is the one-page register for a single
 * workflow; the Run-Cost Model Tool is the business case over a period. This workbook
 * sits between them, and a reader who lands on the wrong one from a search
 * should be one click from the right one. Agreed with Sunil, 16 September 2026.
 */
export const NEIGHBOURS = [
  {
    url: '/resources/cost-ceiling-worksheet',
    title: 'Cost-ceiling worksheet',
    body: 'One page, one workflow. Decide what it may spend or repeat and who reviews the result, with no arithmetic.',
  },
  {
    url: '/resources/run-cost-model',
    title: 'The Run-Cost Model Tool',
    body: 'One period, four ways to do the same job, worked out as you type. The business case around the per-attempt figure this workbook produces.',
  },
];
