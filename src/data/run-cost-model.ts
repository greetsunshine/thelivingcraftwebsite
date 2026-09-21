// The Run-Cost Model Tool — the rows, the arithmetic and the rubric.
//
// Source of truth for /resources/run-cost-model and for the PDF that route
// hands out. Until 17 September 2026 this model was an Excel workbook in
// downloads. The formulas here are the workbook's formulas, row for
// row, so a number on the page and a number in the spreadsheet agree. The
// workbook is still offered from the page for people who need the model in a
// budget meeting; if a formula changes here, change it there in the same
// commit.
//
// Four "arms" are compared. An arm is one way of doing the same job. Same
// cases, same period, one definition of an acceptable outcome. The point of
// the model is the number at the bottom, cost per acceptable outcome, and the
// operating lines most business cases leave out: retries, review minutes,
// escalations, upkeep, and the cases a system declines that a person then
// finishes by hand.
//
// A blank input is UNKNOWN, not zero. Every computed line that depends on a
// blank stays blank, and the outcome is read only when every input is set.
// That is the opposite of the POC Selection Tool, where a blank counts as 0,
// and it is deliberate: a 0 in a cost model is a claim ("this system never
// retries"), and the tool must not make that claim on somebody's behalf.

export const TOOL_NAME = 'The Run-Cost Model Tool';

/** What the tool is for, in four lines. Printed on the Start step. */
export const PURPOSE = [
  'You are asked to put a number on an AI agent proposal. This tool gives you that number, and it includes the costs most business cases leave out.',
  'Four options are compared side by side over one period: a rules workflow as first written, the same workflow rebuilt on the decision rules the agent build forced the team to write down, a model that drafts while a person approves, and a full agent with tools.',
  'Build cost is kept apart from run cost. Quality sits beside cost, so the number you argue about is cost per acceptable outcome, not cost per case.',
  'The result names the option with the lowest cost per acceptable outcome, says whether each option ever pays back its build, and lists the assumptions to check before you trust it.',
];

/** How to use it, as numbered steps. */
export const HOW_TO_USE = [
  'The reference example is already loaded: an ordering agent across 40 sites, every line filled. Change any figure to make the model yours, or start from a blank model.',
  'Work through the seven sections with Next and Back. Sections 1 and 2 take one value each. Sections 3 to 7 take one value per option.',
  'Leave a line blank if you do not know it. A blank keeps the result off the screen; a 0 is a claim. After you fill a blank line, the page moves to the next blank line for you.',
  'Watch the bar and the progress bar at the top. The bar shows cost per acceptable outcome for each option as soon as enough lines are filled.',
  'Read the result at the end. It names the leading option, the break-even month for each, and the assumptions that decide the answer. Get the PDF of your model there.',
  'Prefer a spreadsheet? Download Excel version, on the Start step, has the same rows and the same formulas, with an instruction beside every line.',
];

/** The notice above the loaded example, on the Start step and in the bar. */
export const EXAMPLE_NOTICE = {
  lead: 'The reference example is loaded.',
  rest: 'An ordering agent across 40 sites in India: 2,000 purchase orders a month, every figure in rupees at Indian rates. Every one of the 83 lines is filled, so you can see what a finished model looks like before you type anything. Change any figure and the model becomes yours.',
};

/** The rules for using it in a budget conversation. Each one is a rule, then the reason. */
export const HOW_TO_RUN = [
  {
    lead: 'Fill it from a trial, not from a guess.',
    rest: 'Escalation share, review minutes and the retry multiplier come from logs of real cases. A demo produces none of them. Nothing here is a benchmark: there is no industry number for your escalation rate.',
  },
  {
    lead: 'Argue about cost per acceptable outcome, not cost per case.',
    rest: 'Cost per case rewards a system that quietly declines the hard cases. Cost per acceptable outcome charges it for them.',
  },
  {
    lead: 'One definition of an acceptable outcome, one reviewer, all four options.',
    rest: 'The acceptable-outcome rate must come from one written definition, applied to every option by the same person. Otherwise the comparison is theatre.',
  },
  {
    lead: 'Blank means unknown. Zero means measured.',
    rest: 'A blank keeps the result off the screen until you know the number. Type a 0 only when you have measured a 0. "This system never retries" is a claim.',
  },
  {
    lead: 'Change the rows, keep the shape.',
    rest: 'Add a cost line your workload has and this model does not: data labelling, a vendor licence, a second reviewer for high-value decisions. The shape is the point: build kept apart from run, quality beside cost, and the operating lines visible.',
  },
];

/** What the model deliberately does not price. Printed at the close and in the PDF. */
export const LIMITS = [
  'It assumes steady volume, one workload and stable rates for the whole period.',
  'It does not price revenue upside. A system that wins new business is not captured by a cost line.',
  'It does not price the risk of a wrong action that cannot be undone. That belongs in the Agent Authority Review, not in a cell here.',
  'It does not price the option value of the capability you build. If that is the argument, write it in the decision record in words, not as a number in this sheet.',
];

// ---------------------------------------------------------------------------
// The four arms
// ---------------------------------------------------------------------------

export type ArmKey = 'rules' | 'rules2' | 'assisted' | 'agent';

export interface Arm {
  key: ArmKey;
  /** Column header. */
  name: string;
  /** Pill and PDF label. */
  short: string;
  /** What the option is, in one or two sentences. */
  what: string;
  /** The same thing in a few words, printed under the column header of every table. */
  legend: string;
}

export const ARMS: Arm[] = [
  {
    key: 'rules',
    name: 'Rules workflow, as first written',
    short: 'Rules',
    what: 'Plain code that follows fixed rules, written from what the team already knew. No model anywhere in the path. It handles the common cases and declines or escalates the rest, because the rules for the hard cases were never written down.',
    legend: 'Plain code, from the rules the team already knew.',
  },
  {
    key: 'rules2',
    name: 'Rules v2, rebuilt on the written spec',
    short: 'Rules v2',
    what: 'The same kind of plain code, rebuilt after the agent was built. Building the agent forced the team to write every decision rule down. Code rebuilt on that written spec covers more cases and declines fewer, so it costs more to build and less to run. Still no model in the path.',
    legend: 'Plain code again, rebuilt on every rule the agent build forced you to write down.',
  },
  {
    key: 'assisted',
    name: 'Model-assisted draft',
    short: 'Assisted',
    what: 'A model drafts a recommendation. A person approves every one before it takes effect.',
    legend: 'Model drafts. A person approves each one.',
  },
  {
    key: 'agent',
    name: 'Full agent with tools',
    short: 'Agent',
    what: 'A model plans, calls tools and acts. People review a sample of cases and the exceptions.',
    legend: 'Model plans, calls tools, acts.',
  },
];

/** The one thing readers ask: why two rules workflows. Printed under the four cards. */
export const ARMS_NOTE =
  'Rules and Rules v2 are both plain code with no model in the path. The difference is where the rules came from. Rules runs on the rules the team already knew. Rules v2 runs on every rule that got written down while the agent was being built, which is why it handles more cases and costs more to build. If you have not done that spec work, set the Rules v2 column equal to Rules, or leave it blank.';

export const armByKey = (key: ArmKey): Arm => ARMS.find((a) => a.key === key)!;

// ---------------------------------------------------------------------------
// The rows
// ---------------------------------------------------------------------------

export type SharedKey =
  | 'casesPerMonth'
  | 'months'
  | 'manualMinutes'
  | 'manualRate'
  | 'engDayRate'
  | 'engHourRate'
  | 'reviewerRate';

export type ArmRowKey =
  | 'buildDays'
  | 'evalDays'
  | 'modelCalls'
  | 'retryMult'
  | 'modelCallCost'
  | 'toolCalls'
  | 'toolCallCost'
  | 'reviewShare'
  | 'reviewMinutes'
  | 'escalationShare'
  | 'escalationMinutes'
  | 'declinedShare'
  | 'declinedMinutes'
  | 'toolingCost'
  | 'evalUpkeepDays'
  | 'requalDays'
  | 'regressionDays'
  | 'incidentDays'
  | 'acceptRate';

/** What kind of number a row holds. Decides the unit label and the placeholder. */
export type RowKind = 'count' | 'months' | 'minutes' | 'days' | 'money' | 'moneyPerHour' | 'moneyPerDay' | 'calls' | 'multiplier' | 'percent' | 'daysPerMonth' | 'daysPerYear' | 'moneyPerMonth';

export interface InputRow {
  key: SharedKey | ArmRowKey;
  /** The line, as printed. */
  label: string;
  kind: RowKind;
  /** One or two plain sentences: what to type, and where the number comes from. */
  why: string;
  /** True for the nine lines teams leave out. Marked on the page and in the PDF. */
  forgotten?: boolean;
}

/** A line the model works out. Printed under the inputs that feed it. */
export interface ComputedRow {
  key: ComputedKey;
  label: string;
  kind: 'money' | 'count' | 'moneyEach' | 'months';
  why: string;
}

export type SharedComputedKey = 'totalCases' | 'manualBaseline' | 'manualPerMonth';
export type ArmComputedKey =
  | 'buildCost'
  | 'modelCost'
  | 'toolCost'
  | 'reviewCost'
  | 'escalationCost'
  | 'declinedCost'
  | 'upkeepCost'
  | 'runPerMonth'
  | 'runPeriod'
  | 'total'
  | 'perCase'
  | 'outcomes'
  | 'perOutcome'
  | 'net'
  | 'breakEven';
export type ComputedKey = SharedComputedKey | ArmComputedKey;

export interface ModelSection {
  /** 1-based, printed in the circle. */
  num: number;
  /** The header. Named for the engineering concern. */
  name: string;
  /** One or two words for the progress pip. */
  short: string;
  /** The question the section answers. Printed under the header. */
  question: string;
  blurb: string;
  /** 'shared' rows take one value; 'arm' rows take one per option. */
  scope: 'shared' | 'arm';
  inputs: InputRow[];
  computed: ComputedRow[];
}

export const SECTIONS: ModelSection[] = [
  {
    num: 1,
    name: 'Workload and manual baseline',
    short: 'Workload',
    question: 'What does this work cost today, done by hand?',
    blurb:
      'Every option is measured against this. If the manual baseline is wrong, every break-even month below it is wrong by the same amount.',
    scope: 'shared',
    inputs: [
      {
        key: 'casesPerMonth',
        label: 'Cases per month',
        kind: 'count',
        why: 'One case is one unit of work: a purchase order, a ticket, a refund request. Take the count from last quarter, not from the plan.',
      },
      {
        key: 'months',
        label: 'Months in the period',
        kind: 'months',
        why: 'The window the build has to pay for itself. Twelve is the usual budget horizon. Make it longer only if you can defend the longer horizon in the room.',
      },
      {
        key: 'manualMinutes',
        label: 'Minutes per case, by hand',
        kind: 'minutes',
        why: 'How long one person takes to finish one case today. Time it on ten real cases.',
      },
      {
        key: 'manualRate',
        label: 'Cost per hour of the person doing it by hand',
        kind: 'moneyPerHour',
        why: 'Fully loaded: salary, benefits, seat. Use the rate of the people who actually do the work today.',
      },
    ],
    computed: [
      { key: 'totalCases', label: 'Total cases in the period', kind: 'count', why: 'Cases per month multiplied by months.' },
      { key: 'manualBaseline', label: 'Manual baseline cost for the period', kind: 'money', why: 'Total cases, times minutes per case, times the hourly rate. This is the number every option has to beat.' },
    ],
  },
  {
    num: 2,
    name: 'Team rates',
    short: 'Rates',
    question: 'What does an hour of each person cost?',
    blurb:
      'Three rates, shared by all four options. Engineers build and handle escalations; reviewers approve output and finish declined cases.',
    scope: 'shared',
    inputs: [
      {
        key: 'engDayRate',
        label: 'Engineering day rate',
        kind: 'moneyPerDay',
        why: 'What one engineer-day costs you. Used for the build and for upkeep.',
      },
      {
        key: 'engHourRate',
        label: 'Engineer cost per hour',
        kind: 'moneyPerHour',
        why: 'Used for escalations: the cases an engineer has to look at.',
      },
      {
        key: 'reviewerRate',
        label: 'Reviewer cost per hour',
        kind: 'moneyPerHour',
        why: 'Used for reviewing output and for finishing declined cases by hand. Often the same rate as the manual baseline.',
      },
    ],
    computed: [],
  },
  {
    num: 3,
    name: 'Build cost, paid once',
    short: 'Build',
    question: 'What does each option cost before it handles its first case?',
    blurb:
      'Engineering days, converted at the day rate. Evaluation work is a separate line because it is the one most estimates skip, and it is where a model-based option earns the right to be trusted.',
    scope: 'arm',
    inputs: [
      {
        key: 'buildDays',
        label: 'Engineering days to build',
        kind: 'days',
        why: 'From the first line of code to a system that handles real cases. Include integration with the tools it calls.',
      },
      {
        key: 'evalDays',
        label: 'Engineering days for evals and a test set',
        kind: 'days',
        why: 'An eval is a set of real cases with known-correct answers that the system is scored against. Building one is engineering time.',
      },
    ],
    computed: [
      { key: 'buildCost', label: 'Total build cost', kind: 'money', why: 'Build days plus eval days, times the engineering day rate.' },
    ],
  },
  {
    num: 4,
    name: 'Inference and tool calls, per month',
    short: 'Inference',
    question: 'What does the model bill actually include?',
    blurb:
      'Inference is the cost of calling the model. Most business cases price the successful calls and stop there. The retry multiplier is where the rest goes.',
    scope: 'arm',
    inputs: [
      {
        key: 'modelCalls',
        label: 'Model calls per case, successful',
        kind: 'calls',
        why: 'How many times a case calls the model when everything works. An agent that plans, then acts, then checks its work makes several.',
      },
      {
        key: 'retryMult',
        label: 'Retry and failure multiplier',
        kind: 'multiplier',
        forgotten: true,
        why: 'Total model calls divided by successful ones. Count timeouts, tool errors and loops that re-enter, not only refusals. 1.0 means the system never retries, which no real system does.',
      },
      {
        key: 'modelCallCost',
        label: 'Cost per model call',
        kind: 'money',
        why: 'Average cost of one call, including the input tokens. Take it from a month of real invoices, not from the price list.',
      },
      {
        key: 'toolCalls',
        label: 'Tool and API calls per case',
        kind: 'calls',
        why: 'Lookups, searches, writes to other systems. Anything with a price per call or a rate limit.',
      },
      {
        key: 'toolCallCost',
        label: 'Cost per tool call',
        kind: 'money',
        why: 'Average across the tools it calls. Internal calls are not free: price the compute.',
      },
    ],
    computed: [
      { key: 'modelCost', label: 'Model cost per month', kind: 'money', why: 'Cases per month, times calls per case, times the retry multiplier, times the cost per call.' },
      { key: 'toolCost', label: 'Tool cost per month', kind: 'money', why: 'Cases per month, times tool calls per case, times the cost per tool call.' },
    ],
  },
  {
    num: 5,
    name: 'Human in the loop, per month',
    short: 'Human loop',
    question: 'How much human time does each option still need?',
    blurb:
      'Three kinds of human time. Review is routine checking of output. Escalation is a case that needs an engineer. Declined is a case the system would not finish, which a person then does by hand. This section decides most comparisons.',
    scope: 'arm',
    inputs: [
      {
        key: 'reviewShare',
        label: 'Share of cases a person reviews',
        kind: 'percent',
        why: '100 for a model-assisted draft, because a person approves every one. A sample, such as 20, for a full agent.',
      },
      {
        key: 'reviewMinutes',
        label: 'Review minutes per reviewed case',
        kind: 'minutes',
        forgotten: true,
        why: 'Time it on real cases. Approving a good draft is quick; checking an agent that acted on its own is not.',
      },
      {
        key: 'escalationShare',
        label: 'Share of cases escalated to an engineer',
        kind: 'percent',
        why: 'Cases that stop and need somebody who can read the trace. Measure it in a trial. A demo will show you 0.',
      },
      {
        key: 'escalationMinutes',
        label: 'Engineer minutes per escalation',
        kind: 'minutes',
        forgotten: true,
        why: 'Reading the trace, working out what happened, fixing the case. Longer for an agent, because there is more trace to read.',
      },
      {
        key: 'declinedShare',
        label: 'Share of cases declined or abandoned',
        kind: 'percent',
        forgotten: true,
        why: 'Cases the system refuses or gives up on. They do not disappear: a person finishes them, at the manual rate.',
      },
      {
        key: 'declinedMinutes',
        label: 'Manual minutes per declined case',
        kind: 'minutes',
        why: 'Usually close to the manual baseline, because the person starts from nothing.',
      },
    ],
    computed: [
      { key: 'reviewCost', label: 'Review cost per month', kind: 'money', why: 'Cases per month, times the share reviewed, times minutes per review, at the reviewer rate.' },
      { key: 'escalationCost', label: 'Escalation cost per month', kind: 'money', why: 'Cases per month, times the share escalated, times minutes per escalation, at the engineer rate.' },
      { key: 'declinedCost', label: 'Declined-case cost per month', kind: 'money', why: 'Cases per month, times the share declined, times manual minutes, at the reviewer rate.' },
    ],
  },
  {
    num: 6,
    name: 'Upkeep and operations, per month',
    short: 'Upkeep',
    question: 'What does it cost to keep the system trustworthy after launch?',
    blurb:
      'A rules workflow needs almost none of this. A model-based option needs all of it, every month, and none of it appears in a demo.',
    scope: 'arm',
    inputs: [
      {
        key: 'toolingCost',
        label: 'Observability and eval tooling',
        kind: 'moneyPerMonth',
        forgotten: true,
        why: 'Tracing, logging, the eval runner, the dashboards. Licence fees or the compute to run your own.',
      },
      {
        key: 'evalUpkeepDays',
        label: 'Eval maintenance',
        kind: 'daysPerMonth',
        forgotten: true,
        why: 'Engineering days a month spent adding cases to the eval set and fixing the ones that go stale.',
      },
      {
        key: 'requalDays',
        label: 'Model-version re-qualification',
        kind: 'daysPerYear',
        forgotten: true,
        why: 'Engineering days a YEAR spent re-running the eval set after a model or SDK update. Spread across the months by the model. Count every update the provider ships.',
      },
      {
        key: 'regressionDays',
        label: 'Prompt and regression testing',
        kind: 'daysPerMonth',
        forgotten: true,
        why: 'Engineering days a month spent checking that a prompt change did not break something that used to work.',
      },
      {
        key: 'incidentDays',
        label: 'Incident and on-call load',
        kind: 'daysPerMonth',
        forgotten: true,
        why: 'Engineering days a month on incidents caused by the system. Take it from the on-call log.',
      },
    ],
    computed: [
      { key: 'upkeepCost', label: 'Upkeep cost per month', kind: 'money', why: 'Tooling, plus every engineering day above at the day rate, with the yearly line divided by twelve.' },
    ],
  },
  {
    num: 7,
    name: 'Quality',
    short: 'Quality',
    question: 'How often does each option produce an outcome you would accept?',
    blurb:
      'This is what turns cost per case into cost per acceptable outcome. One written definition of "acceptable", applied to every option by the same reviewer.',
    scope: 'arm',
    inputs: [
      {
        key: 'acceptRate',
        label: 'Acceptable-outcome rate',
        kind: 'percent',
        why: 'The share of cases that meet the written definition with no rework. Measure it on the same set of cases for all four options.',
      },
    ],
    computed: [
      { key: 'outcomes', label: 'Acceptable outcomes in the period', kind: 'count', why: 'Total cases, times the acceptable-outcome rate.' },
    ],
  },
];

/** The totals, printed in the result and the PDF. Not a section: nothing here is typed. */
export const TOTALS: ComputedRow[] = [
  { key: 'runPerMonth', label: 'Run cost per month', kind: 'money', why: 'Model, tools, review, escalation, declined cases and upkeep, added up.' },
  { key: 'runPeriod', label: 'Run cost for the period', kind: 'money', why: 'Run cost per month, times months.' },
  { key: 'total', label: 'Total cost for the period, build plus run', kind: 'money', why: 'The build, paid once, plus the run cost for the period.' },
  { key: 'perCase', label: 'Cost per case', kind: 'moneyEach', why: 'Total cost divided by total cases. The wrong number to argue about on its own.' },
  { key: 'perOutcome', label: 'Cost per acceptable outcome', kind: 'moneyEach', why: 'Total cost divided by acceptable outcomes. The number to argue about.' },
  { key: 'net', label: 'Net position against the manual baseline', kind: 'money', why: 'Manual baseline minus total cost. Positive means the option saves money over the period.' },
  { key: 'breakEven', label: 'Months to break even on the build', kind: 'months', why: 'Build cost divided by the monthly saving against doing it by hand. "Never" means the option costs more to run each month than the manual process.' },
];

export const SHARED_ROWS: InputRow[] = SECTIONS.filter((s) => s.scope === 'shared').flatMap((s) => s.inputs);
export const ARM_ROWS: InputRow[] = SECTIONS.filter((s) => s.scope === 'arm').flatMap((s) => s.inputs);
export const FORGOTTEN_ROWS: InputRow[] = ARM_ROWS.filter((r) => r.forgotten);
export const INPUT_COUNT = SHARED_ROWS.length + ARM_ROWS.length * ARMS.length;

/** Unit label for a row kind, with the currency filled in. */
export function unitOf(kind: RowKind, currency: string): string {
  const c = currency.trim() || 'currency';
  switch (kind) {
    case 'count': return 'count';
    case 'months': return 'months';
    case 'minutes': return 'minutes';
    case 'days': return 'days';
    case 'money': return c;
    case 'moneyPerHour': return `${c} per hour`;
    case 'moneyPerDay': return `${c} per day`;
    case 'moneyPerMonth': return `${c} per month`;
    case 'calls': return 'calls per case';
    case 'multiplier': return 'multiplier, 1.0 = no retries';
    case 'percent': return '%';
    case 'daysPerMonth': return 'engineer days per month';
    case 'daysPerYear': return 'engineer days per year';
  }
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export type Cell = number | null;

/**
 * The largest figure any line accepts, on the page and on the PDF route.
 *
 * One bound in one place. The page used to accept any finite number and the
 * server refused anything above this, so a figure the reader had watched turn
 * sun on screen was refused after the save with a message naming no line.
 */
export const MAX_VALUE = 1_000_000_000;

/**
 * Read one typed figure. Blank is `null`; so is anything the model cannot use:
 * text, a negative, or a figure above MAX_VALUE. Callers that want to show the
 * reader the difference between blank and refused compare the raw text.
 */
export const parseCell = (raw: string): Cell => {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= MAX_VALUE ? n : null;
};

export interface ModelInputs {
  /** A label, such as INR or USD. Free text. Not counted as an input. */
  currency: string;
  shared: Record<SharedKey, Cell>;
  arms: Record<ArmKey, Record<ArmRowKey, Cell>>;
}

export function blankInputs(): ModelInputs {
  const shared = Object.fromEntries(SHARED_ROWS.map((r) => [r.key, null])) as Record<SharedKey, Cell>;
  const arms = Object.fromEntries(
    ARMS.map((a) => [a.key, Object.fromEntries(ARM_ROWS.map((r) => [r.key, null]))]),
  ) as Record<ArmKey, Record<ArmRowKey, Cell>>;
  return { currency: '', shared, arms };
}

/**
 * The reference example: an ordering agent across 40 sites in India, 2,000
 * purchase orders a month, every figure in rupees at Indian rates. The figures
 * are illustrative and composite, shaped to be plausible for that workload,
 * not drawn from one company's books. It is deliberately a case where the
 * full agent does not pay back inside the period, and where building it was
 * still worth doing: the build produced the written specification that made
 * the cheap option good.
 */
export const EXAMPLE: ModelInputs = {
  currency: 'INR',
  shared: {
    casesPerMonth: 2000,
    months: 12,
    manualMinutes: 25,
    manualRate: 600,
    engDayRate: 20000,
    engHourRate: 2500,
    reviewerRate: 600,
  },
  arms: {
    rules: {
      buildDays: 25, evalDays: 0,
      modelCalls: 0, retryMult: 1, modelCallCost: 0, toolCalls: 0.2, toolCallCost: 0.5,
      reviewShare: 12, reviewMinutes: 6, escalationShare: 1, escalationMinutes: 20, declinedShare: 8, declinedMinutes: 12,
      toolingCost: 0, evalUpkeepDays: 0, requalDays: 0, regressionDays: 0, incidentDays: 0,
      acceptRate: 78,
    },
    rules2: {
      buildDays: 35, evalDays: 0,
      modelCalls: 0, retryMult: 1, modelCallCost: 0, toolCalls: 0.2, toolCallCost: 0.5,
      reviewShare: 8, reviewMinutes: 6, escalationShare: 0.8, escalationMinutes: 20, declinedShare: 4, declinedMinutes: 12,
      toolingCost: 0, evalUpkeepDays: 0, requalDays: 0, regressionDays: 0.25, incidentDays: 0,
      acceptRate: 91,
    },
    assisted: {
      buildDays: 45, evalDays: 6,
      modelCalls: 1.2, retryMult: 1.15, modelCallCost: 1.8, toolCalls: 1, toolCallCost: 0.5,
      reviewShare: 100, reviewMinutes: 2, escalationShare: 1.5, escalationMinutes: 25, declinedShare: 3, declinedMinutes: 12,
      toolingCost: 8000, evalUpkeepDays: 1, requalDays: 9, regressionDays: 0.5, incidentDays: 0.25,
      acceptRate: 89,
    },
    agent: {
      buildDays: 95, evalDays: 22,
      modelCalls: 6, retryMult: 1.35, modelCallCost: 2.5, toolCalls: 5, toolCallCost: 0.5,
      reviewShare: 20, reviewMinutes: 4, escalationShare: 4, escalationMinutes: 35, declinedShare: 2, declinedMinutes: 12,
      toolingCost: 35000, evalUpkeepDays: 3, requalDays: 24, regressionDays: 1.5, incidentDays: 1,
      acceptRate: 94,
    },
  },
};

/** The story behind the example, printed on its tab and in the PDF when it is loaded. */
export const EXAMPLE_STORY = {
  title: 'An ordering agent across 40 sites',
  lines: [
    'A retailer in India raises about 2,000 purchase orders a month across 40 sites. Each one takes a buyer 25 minutes by hand.',
    'The team built a full agent that reads the request, checks stock and supplier terms, and places the order. It worked. It also cost more to run each month than the buyers did.',
    'Building it forced the team to write down every decision rule the buyers had been carrying in their heads. A second rules workflow, rebuilt on that written spec, took 35 engineering days and wins on cost per acceptable outcome.',
    'Cost per case picks the original rules workflow. Cost per acceptable outcome picks the rebuilt one. That gap is the whole reason the second number exists.',
    'Every figure is in Indian rupees at Indian rates. If you work elsewhere, change the four rates in sections 1 and 2 first. The shape of the comparison holds; the absolute numbers will not.',
  ],
};

// ---------------------------------------------------------------------------
// The arithmetic
// ---------------------------------------------------------------------------

/** Apply `f` only when every input is known. A blank anywhere makes the answer blank. */
const calc = (deps: Cell[], f: (...n: number[]) => number): Cell =>
  deps.some((d) => d === null || !Number.isFinite(d)) ? null : f(...(deps as number[]));

export interface CostBlock {
  key: ArmComputedKey;
  name: string;
  value: Cell;
  /** Share of run cost per month, 0..1, or null while the total is unknown. */
  share: Cell;
}

/** The six blocks that add up to run cost per month, in the order the model adds them. */
export const BLOCK_KEYS: ArmComputedKey[] = ['modelCost', 'toolCost', 'reviewCost', 'escalationCost', 'declinedCost', 'upkeepCost'];

export type BreakEvenState = 'inside' | 'beyond' | 'never' | null;

export interface ArmResult {
  key: ArmKey;
  name: string;
  short: string;
  values: Record<ArmComputedKey, Cell>;
  /** Where the monthly run cost goes, largest first. */
  blocks: CostBlock[];
  breakEvenState: BreakEvenState;
  filled: number;
}

export interface SharedResult {
  values: Record<SharedComputedKey, Cell>;
  filled: number;
}

export function computeShared(inputs: ModelInputs): SharedResult {
  const s = inputs.shared;
  const totalCases = calc([s.casesPerMonth, s.months], (c, m) => c * m);
  const manualBaseline = calc([totalCases, s.manualMinutes, s.manualRate], (t, min, rate) => (t * min) / 60 * rate);
  const manualPerMonth = calc([manualBaseline, s.months], (b, m) => (m > 0 ? b / m : 0));
  return {
    values: { totalCases, manualBaseline, manualPerMonth },
    filled: SHARED_ROWS.filter((r) => s[r.key as SharedKey] !== null).length,
  };
}

export function computeArm(inputs: ModelInputs, key: ArmKey, shared: SharedResult): ArmResult {
  const s = inputs.shared;
  const a = inputs.arms[key];
  const cases = s.casesPerMonth;

  const buildCost = calc([a.buildDays, a.evalDays, s.engDayRate], (b, e, r) => (b + e) * r);
  const modelCost = calc([cases, a.modelCalls, a.retryMult, a.modelCallCost], (c, n, m, p) => c * n * m * p);
  const toolCost = calc([cases, a.toolCalls, a.toolCallCost], (c, n, p) => c * n * p);
  const reviewCost = calc([cases, a.reviewShare, a.reviewMinutes, s.reviewerRate], (c, sh, min, r) => ((c * sh) / 100 * min) / 60 * r);
  const escalationCost = calc([cases, a.escalationShare, a.escalationMinutes, s.engHourRate], (c, sh, min, r) => ((c * sh) / 100 * min) / 60 * r);
  const declinedCost = calc([cases, a.declinedShare, a.declinedMinutes, s.reviewerRate], (c, sh, min, r) => ((c * sh) / 100 * min) / 60 * r);
  const upkeepCost = calc(
    [a.toolingCost, a.evalUpkeepDays, a.requalDays, a.regressionDays, a.incidentDays, s.engDayRate],
    (t, ev, rq, rg, inc, r) => t + (ev + rq / 12 + rg + inc) * r,
  );
  const runPerMonth = calc([modelCost, toolCost, reviewCost, escalationCost, declinedCost, upkeepCost], (...xs) => xs.reduce((n, x) => n + x, 0));
  const runPeriod = calc([runPerMonth, s.months], (r, m) => r * m);
  const total = calc([buildCost, runPeriod], (b, r) => b + r);
  const totalCases = shared.values.totalCases;
  const perCase = calc([total, totalCases], (t, c) => (c > 0 ? t / c : 0));
  const outcomes = calc([totalCases, a.acceptRate], (c, r) => (c * r) / 100);
  // No acceptable outcomes means the cost of one is undefined, not zero. Stays blank.
  const perOutcome = outcomes !== null && outcomes > 0 ? calc([total, outcomes], (t, o) => t / o) : null;
  const net = calc([shared.values.manualBaseline, total], (b, t) => b - t);

  let breakEven: Cell = null;
  let breakEvenState: BreakEvenState = null;
  const saving = calc([shared.values.manualPerMonth, runPerMonth], (m, r) => m - r);
  if (saving !== null && buildCost !== null) {
    if (saving <= 0) {
      breakEvenState = 'never';
    } else {
      breakEven = buildCost / saving;
      breakEvenState = s.months !== null && breakEven > s.months ? 'beyond' : 'inside';
    }
  }

  const blockList: { key: ArmComputedKey; name: string; value: Cell }[] = [
    { key: 'modelCost', name: 'Model calls', value: modelCost },
    { key: 'toolCost', name: 'Tool calls', value: toolCost },
    { key: 'reviewCost', name: 'Review', value: reviewCost },
    { key: 'escalationCost', name: 'Escalations', value: escalationCost },
    { key: 'declinedCost', name: 'Declined cases', value: declinedCost },
    { key: 'upkeepCost', name: 'Upkeep', value: upkeepCost },
  ];
  const blocks: CostBlock[] = blockList
    .map((b) => ({
      ...b,
      share: calc([b.value, runPerMonth], (v, r) => (r > 0 ? v / r : 0)),
    }))
    .sort((x, y) => (y.value ?? -1) - (x.value ?? -1));

  const arm = armByKey(key);
  return {
    key,
    name: arm.name,
    short: arm.short,
    values: {
      buildCost, modelCost, toolCost, reviewCost, escalationCost, declinedCost, upkeepCost,
      runPerMonth, runPeriod, total, perCase, outcomes, perOutcome, net, breakEven,
    },
    blocks,
    breakEvenState,
    filled: ARM_ROWS.filter((r) => a[r.key as ArmRowKey] !== null).length,
  };
}

// ---------------------------------------------------------------------------
// The rubric
// ---------------------------------------------------------------------------

export type OutcomeKey = 'agent' | 'assisted' | 'rules2' | 'rules' | 'manual';

export interface OutcomeLine {
  key: OutcomeKey;
  /** The condition, as printed in the rubric. */
  when: string;
  /** The outcome, as a heading. */
  name: string;
  /** What to do next. */
  what: string;
}

/**
 * How the outcome is read. The leading option is the one with the lowest cost
 * per acceptable outcome among the options that save money against the manual
 * baseline over the period. If none does, the outcome is "manual".
 */
export const OUTCOMES: OutcomeLine[] = [
  {
    key: 'agent',
    when: 'The full agent has the lowest cost per acceptable outcome and beats the manual baseline',
    name: 'The full agent earns its keep',
    what: 'Before you commit, measure the three lines that drive this number in a trial: escalation share, review minutes and the retry multiplier. If the trial moves any of them, run the model again before the budget conversation.',
  },
  {
    key: 'assisted',
    when: 'The model-assisted draft has the lowest cost per acceptable outcome and beats the manual baseline',
    name: 'Draft with a model, approve with a person',
    what: 'Every case still passes a reviewer, so review minutes per case is the line that decides this. Time it on real cases, not on a demo. If review time doubles, check whether the full agent or the rules workflow now leads.',
  },
  {
    key: 'rules2',
    when: 'The rebuilt rules workflow has the lowest cost per acceptable outcome and beats the manual baseline',
    name: 'The written spec is the asset. Run the code.',
    what: 'The agent build paid for itself by forcing the team to write the decision rules down. Ship the rebuilt rules workflow, and keep the specification under version control like any other code. Revisit the model when volume or the price of a call changes.',
  },
  {
    key: 'rules',
    when: 'The original rules workflow has the lowest cost per acceptable outcome and beats the manual baseline',
    name: 'The rules workflow wins as it stands',
    what: 'No model earns its cost on this workload at these rates. Keep the rules workflow. Check the acceptable-outcome rate first: if the rules workflow declines a lot of cases, its quality line may be the one that is wrong.',
  },
  {
    key: 'manual',
    when: 'No option saves money against the manual baseline over the period',
    name: 'Nothing here beats doing it by hand',
    what: 'Either the volume is too low to earn back a build, or a rate needs checking. Do not build for cost. Build only if there is another reason, and write that reason down in the decision record.',
  },
];

export const outcomeByKey = (key: OutcomeKey): OutcomeLine => OUTCOMES.find((o) => o.key === key)!;

export type FlagKey = 'disagree' | 'never' | 'beyond';

export interface Flag {
  key: FlagKey;
  text: string;
}

export interface Check {
  /** The option the check is about, or null for a shared line. */
  arm: ArmKey | null;
  text: string;
}

export interface ModelRead {
  filled: number;
  totalInputs: number;
  complete: boolean;
  shared: SharedResult;
  arms: ArmResult[];
  /** Lowest cost per acceptable outcome among options with a positive net position. Null until complete. */
  leader: ArmKey | null;
  /** Lowest cost per case, for the disagreement flag. Null until complete. */
  leaderPerCase: ArmKey | null;
  outcome: OutcomeLine | null;
  flags: Flag[];
  checks: Check[];
}

/**
 * Read a full set of inputs. One function, used by the page's script, the
 * sticky bar, the result card, the copied text and the PDF, so none of them
 * can disagree about a number or an outcome.
 */
export function readModel(inputs: ModelInputs): ModelRead {
  const shared = computeShared(inputs);
  const arms = ARMS.map((a) => computeArm(inputs, a.key, shared));
  const filled = shared.filled + arms.reduce((n, a) => n + a.filled, 0);
  const complete = filled === INPUT_COUNT;

  let leader: ArmKey | null = null;
  let leaderPerCase: ArmKey | null = null;
  let outcome: OutcomeLine | null = null;
  const flags: Flag[] = [];
  const checks: Check[] = [];

  if (complete) {
    const known = arms.filter((a) => a.values.perOutcome !== null);
    const saving = known.filter((a) => (a.values.net ?? 0) > 0);
    const lowest = (list: ArmResult[], k: ArmComputedKey) =>
      list.reduce<ArmResult | null>((best, a) => (best === null || (a.values[k] ?? Infinity) < (best.values[k] ?? Infinity) ? a : best), null);

    const lead = lowest(saving, 'perOutcome');
    leader = lead?.key ?? null;
    // Cost per case has a figure even when cost per acceptable outcome does
    // not (an acceptable-outcome rate of 0), so it is read over every option
    // with a total, not over `known`.
    leaderPerCase = lowest(arms.filter((a) => a.values.perCase !== null), 'perCase')?.key ?? null;
    outcome = outcomeByKey(leader ?? 'manual');

    if (leader && leaderPerCase && leader !== leaderPerCase) {
      flags.push({
        key: 'disagree',
        text: `Cost per case picks ${armByKey(leaderPerCase).name}. Cost per acceptable outcome picks ${armByKey(leader).name}. Argue about the second one: cost per case rewards a system that quietly declines the hard cases.`,
      });
    }
    const never = arms.filter((a) => a.breakEvenState === 'never');
    if (never.length) {
      flags.push({
        key: 'never',
        text: `${never.map((a) => a.name).join(' and ')} ${never.length === 1 ? 'never breaks' : 'never break'} even. The monthly run cost is at or above the cost of doing it by hand, so no number of months pays back the build.`,
      });
    }
    const beyond = arms.filter((a) => a.breakEvenState === 'beyond');
    for (const a of beyond) {
      flags.push({
        key: 'beyond',
        text: `${a.name} breaks even in month ${fmtMonths(a.values.breakEven)}, after the ${inputs.shared.months}-month period you modelled. It pays back, but only if you can defend the longer horizon.`,
      });
    }

    // The assumptions that decide the answer, for the leading option first and
    // the full agent second, because those are the two the room will argue about.
    const order = [lead, arms.find((a) => a.key === 'agent'), ...arms].filter((a): a is ArmResult => Boolean(a));
    const seen = new Set<string>();
    for (const a of order) {
      const row = inputs.arms[a.key];
      const add = (id: string, text: string) => {
        const k = `${a.key}:${id}`;
        if (seen.has(k)) return;
        seen.add(k);
        checks.push({ arm: a.key, text });
      };
      const top = a.blocks[0];
      if (top && top.value !== null && top.share !== null && top.share >= 0.3) {
        add('top', `${a.name}: ${top.name.toLowerCase()} ${top.name.endsWith('s') ? 'are' : 'is'} ${Math.round(top.share * 100)}% of run cost. That line decides the comparison. Measure it in a trial before you trust it.`);
      }
      if ((row.modelCalls ?? 0) > 0 && (row.retryMult ?? 0) <= 1) {
        add('retry', `${a.name}: the retry multiplier is 1.0, which says the system never retries. Every real system retries. Set it from a trial log: total model calls divided by successful ones.`);
      }
      if ((row.modelCalls ?? 0) > 0 && ((row.reviewShare ?? 0) === 0 || (row.reviewMinutes ?? 0) === 0)) {
        add('review', `${a.name}: nobody reviews the output. A wrong answer then reaches the customer or the ledger unseen. Set a sample share and time the review.`);
      }
      if ((row.escalationShare ?? 0) === 0) {
        add('escalation', `${a.name}: escalations are 0. Every system has cases it cannot finish. Escalation is the line that decides most of these comparisons, so measure it rather than assume it away.`);
      }
      if ((row.modelCalls ?? 0) > 0 && (a.values.upkeepCost ?? 0) === 0) {
        add('upkeep', `${a.name}: upkeep is 0. Eval maintenance, re-qualifying against each new model version and on-call are the lines teams leave out, and they recur every month.`);
      }
    }
  }

  return { filled, totalInputs: INPUT_COUNT, complete, shared, arms, leader, leaderPerCase, outcome, flags, checks };
}

// ---------------------------------------------------------------------------
// Formatting, shared by the page, the copied text and the PDF
// ---------------------------------------------------------------------------

/** Indian grouping (12,34,567) for rupees, Western grouping otherwise. */
const localeFor = (currency: string) => (/inr|rs\.?|₹|rupee/i.test(currency) ? 'en-IN' : 'en-GB');

/** A money amount with the currency label in front. Blank stays blank. */
export function fmtMoney(v: Cell, currency: string, each = false): string {
  if (v === null) return '—';
  const locale = localeFor(currency);
  const digits = each && Math.abs(v) < 1000 ? 2 : 0;
  const num = v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const c = currency.trim();
  return c ? `${c} ${num}` : num;
}

export function fmtCount(v: Cell): string {
  if (v === null) return '—';
  return Math.round(v).toLocaleString('en-GB');
}

export function fmtMonths(v: Cell): string {
  if (v === null) return '—';
  return v.toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** A computed value in the words of its row kind. */
export function fmtComputed(row: ComputedRow, v: Cell, currency: string, breakEvenState?: BreakEvenState): string {
  if (row.key === 'breakEven' && breakEvenState === 'never') return 'never';
  switch (row.kind) {
    case 'money': return fmtMoney(v, currency);
    case 'moneyEach': return fmtMoney(v, currency, true);
    case 'count': return fmtCount(v);
    case 'months': return v === null ? '—' : `${fmtMonths(v)} months`;
  }
}

/** An input value as typed, for the copied text and the PDF. */
export function fmtInput(v: Cell): string {
  if (v === null) return '—';
  return v.toLocaleString('en-GB', { maximumFractionDigits: 4 });
}

// ---------------------------------------------------------------------------
// The working: every computed line with the reader's own figures in it
// ---------------------------------------------------------------------------
//
// A computed row carries a `why` in words ("cases, times calls per case, times
// the retry multiplier, times the cost per call"). Words alone made a reader
// go back three screens and add six numbers in their head to see where the
// run cost came from. This prints the same formula with the numbers in:
// "2,000 × 6 × 1.35 × ₹ 2.50 = ₹ 40,500". The page shows it under the row
// and updates it as they type; the PDF prints it under the same row. One
// function so the two cannot say different things.

const fmtN = (v: number, currency: string, digits = 0) =>
  v.toLocaleString(localeFor(currency), { minimumFractionDigits: 0, maximumFractionDigits: digits });

/** Format a typed figure inside the working: grouping, and decimals only when it has them. */
const wn = (v: number, currency: string) => fmtN(v, currency, 2);

/**
 * The arithmetic behind one computed row, or null while any figure it needs
 * is blank. `arm` is null for a shared row.
 */
export function working(key: ComputedKey, inputs: ModelInputs, r: ModelRead, arm: ArmKey | null, currency: string): string | null {
  const s = inputs.shared;
  const sv = r.shared.values;
  const m = (v: Cell) => fmtMoney(v, currency);
  const each = (v: Cell) => fmtMoney(v, currency, true);
  const n = (v: Cell) => (v === null ? '—' : wn(v, currency));
  const ok = (...xs: Cell[]) => xs.every((x) => x !== null && Number.isFinite(x));

  if (arm === null) {
    switch (key) {
      case 'totalCases':
        return ok(s.casesPerMonth, s.months) ? `${n(s.casesPerMonth)} × ${n(s.months)} = ${n(sv.totalCases)}` : null;
      case 'manualBaseline':
        return ok(sv.totalCases, s.manualMinutes, s.manualRate)
          ? `${n(sv.totalCases)} × ${n(s.manualMinutes)} min ÷ 60 × ${m(s.manualRate)} = ${m(sv.manualBaseline)}`
          : null;
      case 'manualPerMonth':
        return ok(sv.manualBaseline, s.months) ? `${m(sv.manualBaseline)} ÷ ${n(s.months)} = ${m(sv.manualPerMonth)}` : null;
      default:
        return null;
    }
  }

  const a = inputs.arms[arm];
  const v = r.arms.find((x) => x.key === arm)!.values;
  const c = s.casesPerMonth;
  const share = (sh: Cell, min: Cell, rate: Cell, out: Cell) =>
    ok(c, sh, min, rate) ? `${n(c)} × ${n(sh)}% × ${n(min)} min ÷ 60 × ${m(rate)} = ${m(out)}` : null;

  switch (key) {
    case 'buildCost':
      return ok(a.buildDays, a.evalDays, s.engDayRate) ? `(${n(a.buildDays)} + ${n(a.evalDays)}) days × ${m(s.engDayRate)} = ${m(v.buildCost)}` : null;
    case 'modelCost':
      return ok(c, a.modelCalls, a.retryMult, a.modelCallCost)
        ? `${n(c)} × ${n(a.modelCalls)} × ${n(a.retryMult)} × ${each(a.modelCallCost)} = ${m(v.modelCost)}`
        : null;
    case 'toolCost':
      return ok(c, a.toolCalls, a.toolCallCost) ? `${n(c)} × ${n(a.toolCalls)} × ${each(a.toolCallCost)} = ${m(v.toolCost)}` : null;
    case 'reviewCost':
      return share(a.reviewShare, a.reviewMinutes, s.reviewerRate, v.reviewCost);
    case 'escalationCost':
      return share(a.escalationShare, a.escalationMinutes, s.engHourRate, v.escalationCost);
    case 'declinedCost':
      return share(a.declinedShare, a.declinedMinutes, s.reviewerRate, v.declinedCost);
    case 'upkeepCost':
      return ok(a.toolingCost, a.evalUpkeepDays, a.requalDays, a.regressionDays, a.incidentDays, s.engDayRate)
        ? `${m(a.toolingCost)} + (${n(a.evalUpkeepDays)} + ${n(a.requalDays)} ÷ 12 + ${n(a.regressionDays)} + ${n(a.incidentDays)}) days × ${m(s.engDayRate)} = ${m(v.upkeepCost)}`
        : null;
    case 'runPerMonth':
      return ok(v.modelCost, v.toolCost, v.reviewCost, v.escalationCost, v.declinedCost, v.upkeepCost)
        ? `model ${m(v.modelCost)} + tools ${m(v.toolCost)} + review ${m(v.reviewCost)} + escalation ${m(v.escalationCost)} + declined ${m(v.declinedCost)} + upkeep ${m(v.upkeepCost)} = ${m(v.runPerMonth)}`
        : null;
    case 'runPeriod':
      return ok(v.runPerMonth, s.months) ? `${m(v.runPerMonth)} × ${n(s.months)} = ${m(v.runPeriod)}` : null;
    case 'total':
      return ok(v.buildCost, v.runPeriod) ? `build ${m(v.buildCost)} + run ${m(v.runPeriod)} = ${m(v.total)}` : null;
    case 'perCase':
      return ok(v.total, sv.totalCases) ? `${m(v.total)} ÷ ${n(sv.totalCases)} = ${each(v.perCase)}` : null;
    case 'outcomes':
      return ok(sv.totalCases, a.acceptRate) ? `${n(sv.totalCases)} × ${n(a.acceptRate)}% = ${n(v.outcomes)}` : null;
    case 'perOutcome':
      return ok(v.total, v.outcomes) && (v.outcomes ?? 0) > 0 ? `${m(v.total)} ÷ ${n(v.outcomes)} = ${each(v.perOutcome)}` : null;
    case 'net':
      return ok(sv.manualBaseline, v.total) ? `manual ${m(sv.manualBaseline)} − total ${m(v.total)} = ${m(v.net)}` : null;
    case 'breakEven': {
      if (!ok(sv.manualPerMonth, v.runPerMonth, v.buildCost)) return null;
      const saving = (sv.manualPerMonth as number) - (v.runPerMonth as number);
      if (saving <= 0) return `manual ${m(sv.manualPerMonth)} − run ${m(v.runPerMonth)} per month saves nothing, so never`;
      return `build ${m(v.buildCost)} ÷ (manual ${m(sv.manualPerMonth)} − run ${m(v.runPerMonth)} per month) = ${fmtMonths(v.breakEven)} months`;
    }
    default:
      return null;
  }
}
