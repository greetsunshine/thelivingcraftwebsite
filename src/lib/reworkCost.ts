/**
 * The Rework Cost Check — the whole calculation, in one pure module.
 *
 * Read by /resources/rework-cost-check (server render and browser script),
 * by src/lib/reworkCost.test.ts, and mirrored formula for formula by the
 * workbook in tools/rework-cost-check/. One implementation, three readers.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE IDEA: EVERY PATH THAT SENDS WORK BACK COSTS THE SAME SHAPE OF THING
 * ───────────────────────────────────────────────────────────────────────────
 *
 *     round cost = work repeated + review call + context growth
 *
 * A rate limit refusing a call and a judge rejecting a draft look like
 * different problems and are the same problem: work goes round again, and
 * something has to pay for it. What differs is WHEN each one bites and WHETHER
 * the redo was billed:
 *
 *   * a transport refusal bites at peak, and the refused call is usually not
 *     billed — only the repeated steps are;
 *   * a judge, validator, tool error or human rejection bites on EVERY run,
 *     the attempt was billed in full, and the redo carries more context than
 *     the attempt it replaces.
 *
 * That second family is the one teams do not count, and it is the one that
 * sets unit economics. Hence two totals rather than one: what a task costs on
 * a normal day, and what it costs when every loop runs to its cap at peak.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * A BLANK IS UNKNOWN, NOT ZERO
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Every input is `number | null`. Null means the reader has not answered, and
 * a total that depends on it stays null rather than quietly treating it as 0.
 * "This workflow never sends work back" is a claim the tool must not make on
 * somebody's behalf. Zero, typed deliberately, is a real answer and is kept
 * apart from blank throughout.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * UNBOUNDED IS NOT A BIG NUMBER
 * ───────────────────────────────────────────────────────────────────────────
 *
 * A present path with no cap has no worst case. The honest output is the word
 * Unbounded, not an arbitrary ceiling, and every figure derived from the worst
 * case is Unbounded too. Inventing a number here would hide exactly the
 * finding the check exists to surface.
 */

// ---------------------------------------------------------------------------
// The paths
// ---------------------------------------------------------------------------

export const PATH_KINDS = [
  'transport',
  'judge',
  'validation',
  'tool',
  'human',
  'custom1',
  'custom2',
] as const;

export type PathKind = (typeof PATH_KINDS)[number];

export interface PathMeta {
  kind: PathKind;
  /** Default name. A custom row is named by the reader. */
  label: string;
  examples: string;
  /** Plain answer to "when does this bite?" */
  bites: string;
  /** Plain answer to "does the redo carry more context?" */
  growth: string;
  /** Was the attempt billed? Copy, not a calculation. */
  billed: string;
  /** What this path actually is, in plain words. */
  what: string;
  /**
   * What each of the three parts of a round means FOR THIS PATH.
   *
   * "Work repeated" means something different for a rate limit than it does
   * for a judge, and a single column heading cannot say both. A transport
   * refusal repeats nothing at all if the code retries only the failed call,
   * and repeats the whole task if it starts over; a judge usually repeats one
   * drafting step. The reader needs the path's own answer, not the generic one.
   */
  repeatedMeans: string;
  reviewMeans: string;
  growthMeans: string;
  /** Whether `billed` defaults to Yes on the form. */
  billedByDefault: boolean;
  /**
   * True where a redo normally carries the previous attempt, a critique or an
   * error message forward. Check 2 raises Attention when one of these has
   * context growth of zero, because that is usually an oversight rather than a
   * measurement. A transport refusal is excluded: it really does re-send the
   * same request.
   */
  expectsGrowth: boolean;
  custom: boolean;
}

export const PATHS: PathMeta[] = [
  {
    kind: 'transport',
    label: 'Transport refusal',
    examples: '429 rate limit, 503 unavailable, or a timeout',
    bites: 'At peak only',
    growth: 'No',
    billed: 'Usually not for the refused call itself. The repeated steps are billed.',
    billedByDefault: false,
    expectsGrowth: false,
    what:
      'The model or tool API did not answer. This is a failure to reach the service, not a problem with the output.',
    repeatedMeans:
      "Depends on what your code does next, and this is the number people get wrong. If it retries only the failed call, nothing is repeated and this is 0. If it restarts the task, it is every step that already succeeded and now runs again.",
    reviewMeans:
      "Usually 0. Nothing re-reads a call that never returned.",
    growthMeans:
      'Usually 0. The same request is sent again, unchanged.',
    custom: false,
  },
  {
    kind: 'judge',
    label: 'Judge / critic rejection',
    examples: 'an LLM-as-judge fails the draft',
    bites: 'Every run',
    growth: 'Yes',
    billed: 'Yes',
    billedByDefault: true,
    expectsGrowth: true,
    what:
      'A model or a rubric reads the finished output, decides it is not good enough, and sends it back with feedback.',
    repeatedMeans:
      "The steps that produce the output again. Often just the drafting step rather than the whole task.",
    reviewMeans:
      "The judge's own call, on the new attempt. It reads the whole output plus its rubric, so its input is usually large. This is the line teams forget.",
    growthMeans:
      'The critique carried into the redo, so the next attempt has more input than the one it replaced.',
    custom: false,
  },
  {
    kind: 'validation',
    label: 'Validation failure',
    examples: 'bad JSON, schema mismatch, guardrail trip',
    bites: 'Every run',
    growth: 'Usually',
    billed: 'Yes',
    billedByDefault: true,
    expectsGrowth: true,
    what:
      'The output did not parse, did not match the schema, or tripped a guardrail, so the model has to produce it again.',
    repeatedMeans:
      "The step that produced the invalid output.",
    reviewMeans:
      "The validator's own cost. It is 0 when the check is code, such as a JSON schema check, rather than a model.",
    growthMeans:
      'The error message handed back so the model knows what to fix.',
    custom: false,
  },
  {
    kind: 'tool',
    label: 'Tool error',
    examples: 'not found, permission denied, bad arguments',
    bites: 'Every run',
    growth: 'Yes',
    billed: 'Yes',
    billedByDefault: true,
    expectsGrowth: true,
    what:
      'A tool the agent called returned an error: not found, permission denied, bad arguments. The agent has to re-plan or try again.',
    repeatedMeans:
      "The reasoning steps that run again to work out what to do instead.",
    reviewMeans:
      "Usually 0, unless something checks the new plan before it runs.",
    growthMeans:
      'The error text and the failed attempt, carried into the next plan.',
    custom: false,
  },
  {
    kind: 'human',
    label: 'Human rejection',
    examples: 'a maker-checker sends it back',
    bites: 'Every run',
    growth: 'Yes',
    billed: 'Yes',
    billedByDefault: true,
    expectsGrowth: true,
    what:
      'A person reviewing the work sends it back. Their reading costs no tokens; the redo does.',
    repeatedMeans:
      "The steps that run again to produce a new version.",
    reviewMeans:
      "0. A person reading the output consumes no tokens.",
    growthMeans:
      "The reviewer's comments, carried into the redo.",
    custom: false,
  },
  {
    kind: 'custom1',
    label: 'Custom path 1',
    examples: 'name it yourself',
    bites: 'You decide',
    growth: 'You decide',
    billed: 'You decide',
    billedByDefault: true,
    expectsGrowth: false,
    what:
      'Anything else in your system that makes model work happen a second time.',
    repeatedMeans:
      "The steps that run again.",
    reviewMeans:
      "Whatever re-checks the new attempt, if anything does.",
    growthMeans:
      'Whatever extra input the redo carries.',
    custom: true,
  },
  {
    kind: 'custom2',
    label: 'Custom path 2',
    examples: 'name it yourself',
    bites: 'You decide',
    growth: 'You decide',
    billed: 'You decide',
    billedByDefault: true,
    expectsGrowth: false,
    what:
      'Anything else in your system that makes model work happen a second time.',
    repeatedMeans:
      "The steps that run again.",
    reviewMeans:
      "Whatever re-checks the new attempt, if anything does.",
    growthMeans:
      'Whatever extra input the redo carries.',
    custom: true,
  },
];

export const pathMeta = (kind: PathKind): PathMeta =>
  PATHS.find((p) => p.kind === kind)!;

// ---------------------------------------------------------------------------
// What the reader fills in
// ---------------------------------------------------------------------------

export const AFTER_LAST = [
  'Fails and tells the user',
  'Hands to a human',
  'Ships with a warning',
  'Queues for later',
  'Not decided',
] as const;
export type AfterLast = (typeof AFTER_LAST)[number] | '';

export const BUDGET_ENFORCEMENT = [
  'Per task, across all rounds',
  'Per call only',
  'Not enforced',
] as const;
export type BudgetEnforcement = (typeof BUDGET_ENFORCEMENT)[number] | '';

export interface ReworkPath {
  kind: PathKind;
  /** Only meaningful for a custom row; the fixed rows use their label. */
  name: string;
  present: boolean;
  billed: boolean;
  averageRounds: number | null;
  repeated: number | null;
  review: number | null;
  growth: number | null;
  maxRounds: number | null;
  afterLast: AfterLast;
  owner: string;
}

export interface ReworkModel {
  cleanRun: number | null;
  alwaysOnChecks: number | null;
  peakTasksPerMinute: number | null;
  quotaPerMinute: number | null;
  budget: number | null;
  enforcement: BudgetEnforcement;
  /** Blended price per million tokens, in the reader's own currency. */
  pricePerMillion: number | null;
  paths: ReworkPath[];
}

export const blankPath = (kind: PathKind): ReworkPath => ({
  kind,
  name: '',
  present: false,
  billed: pathMeta(kind).billedByDefault,
  averageRounds: null,
  repeated: null,
  review: null,
  growth: null,
  maxRounds: null,
  afterLast: '',
  owner: '',
});

export const blankModel = (): ReworkModel => ({
  cleanRun: null,
  alwaysOnChecks: null,
  peakTasksPerMinute: null,
  quotaPerMinute: null,
  budget: null,
  enforcement: '',
  pricePerMillion: null,
  paths: PATH_KINDS.map(blankPath),
});

export const pathName = (p: ReworkPath): string =>
  p.name.trim() !== '' ? p.name.trim() : pathMeta(p.kind).label;

// ---------------------------------------------------------------------------
// The arithmetic
// ---------------------------------------------------------------------------

/** Null-aware sum: null anywhere means the total is not known yet. */
const addAll = (...values: (number | null)[]): number | null => {
  let total = 0;
  for (const v of values) {
    if (v === null) return null;
    total += v;
  }
  return total;
};

/**
 * One round of this path: the steps that run again, the check that re-reads
 * the new attempt, and the extra input the redo carries.
 */
export const roundCost = (p: ReworkPath): number | null =>
  addAll(p.repeated, p.review, p.growth);

/** The paths the reader says exist in this workflow. */
export const presentPaths = (m: ReworkModel): ReworkPath[] =>
  m.paths.filter((p) => p.present);

/** A present path with no cap. Its worst case has no ceiling. */
export const uncappedPaths = (m: ReworkModel): ReworkPath[] =>
  presentPaths(m).filter((p) => p.maxRounds === null);

/** Worst case is Unbounded when any present path can go round for ever. */
export const isUnbounded = (m: ReworkModel): boolean =>
  presentPaths(m).length > 0 && uncappedPaths(m).length > 0;

const baseCost = (m: ReworkModel): number | null =>
  addAll(m.cleanRun, m.alwaysOnChecks);

/**
 * What a task costs on a normal day.
 *
 * The clean run, plus the checks that run on every task even when they pass,
 * plus each path's round cost multiplied by how often that path actually
 * sends work back. A rate limit sits near zero here on purpose: it bites at
 * peak, not on a normal afternoon.
 */
export function typicalCostPerTask(m: ReworkModel): number | null {
  const base = baseCost(m);
  if (base === null) return null;
  let total = base;
  for (const p of presentPaths(m)) {
    const cost = roundCost(p);
    if (cost === null || p.averageRounds === null) return null;
    total += p.averageRounds * cost;
  }
  return total;
}

/**
 * What a task costs when every loop runs to its cap.
 *
 * Null when it cannot be known, which is a different thing from Unbounded:
 * null means an input is missing, Unbounded means a present path has no cap
 * and the question has no numeric answer. Callers must distinguish them.
 */
export function worstCostPerTask(m: ReworkModel): number | null {
  if (isUnbounded(m)) return null;
  const base = baseCost(m);
  if (base === null) return null;
  let total = base;
  for (const p of presentPaths(m)) {
    const cost = roundCost(p);
    if (cost === null || p.maxRounds === null) return null;
    total += p.maxRounds * cost;
  }
  return total;
}

const times = (a: number | null, b: number | null): number | null =>
  a === null || b === null ? null : a * b;

const share = (demand: number | null, quota: number | null): number | null =>
  demand === null || quota === null || quota <= 0 ? null : demand / quota;

const multiple = (cost: number | null, clean: number | null): number | null =>
  cost === null || clean === null || clean <= 0 ? null : cost / clean;

// ---------------------------------------------------------------------------
// The five checks
// ---------------------------------------------------------------------------

export type Status = 'Pass' | 'Attention' | 'Fail' | 'Not answered';

export interface CheckResult {
  n: 1 | 2 | 3 | 4 | 5;
  title: string;
  status: Status;
  /** What is true right now. One line, shown beside the status word. */
  reason: string;
  /**
   * What to do about it. Empty on a Pass.
   *
   * A finding is not an instruction. "Your normal load already exceeds the
   * quota" tells a reader where they stand and leaves them to work out the
   * move; every Attention and every Fail therefore carries the move as well.
   */
  action: string;
}

/** What the three words mean. Printed beside the checks, not left to guess. */
export const STATUS_MEANING: { status: Status; meaning: string }[] = [
  { status: 'Pass', meaning: 'Nothing to do here.' },
  { status: 'Attention', meaning: 'It works today, and something about it will surprise you. Worth fixing.' },
  { status: 'Fail', meaning: 'This is the one that stops you scaling. Fix it first.' },
  { status: 'Not answered', meaning: 'The check needs a figure you have not entered yet.' },
];

const CHECK_TITLES: Record<number, string> = {
  1: 'Every path that sends work back is listed',
  2: 'Each round is costed as repeated, review and growth',
  3: 'Every loop has a limit, a decided outcome, and an owner',
  4: 'Both numbers fit: what you pay daily, and your busiest minute',
  5: 'One token budget for the whole task, not one per call',
};

/**
 * What each check is protecting against.
 *
 * A status and a reason tell a reader where they stand. They do not say why
 * anybody should care, and a check whose purpose is not obvious gets answered
 * carelessly. This is the paragraph that makes the check worth answering.
 */
export const CHECK_WHY: Record<number, string> = {
  1: 'A path you have not listed is spend you cannot see. Most teams count their retries and miss the judge entirely, because a judge rejection looks like normal operation rather than a failure.',
  2: 'A round is three things and teams usually count only the first. The review call and the growing context are what make a judge loop expensive, and neither appears in a retry counter.',
  3: 'A loop with no cap has no worst case. This is the check that turns "it depends" into a number, and an uncapped path is the single most common finding here.',
  4: 'One number is not enough, because the two ways this hurts you are different. The typical cost is what you pay every day, and it decides whether the product makes money. The worst case at peak decides whether one bad minute takes the whole system down. A workflow can be fine on one and fatal on the other.',
  5: 'A task that goes round three times spends three times. A budget checked on each call sees the attempts one at a time and never sees the total, so it cannot stop a task that is running away. To do that, every round has to count against one limit that belongs to the task.',
};

const filled = (v: number | null): boolean => v !== null;

function check1(m: ReworkModel): CheckResult {
  const present = presentPaths(m);
  const base = { n: 1 as const, title: CHECK_TITLES[1] };
  if (present.length === 0) {
    return { ...base, status: 'Not answered', reason: 'No path is marked as present yet.', action: '' };
  }
  const missing = present.filter((p) => !filled(p.averageRounds));
  if (missing.length) {
    return {
      ...base,
      status: 'Fail',
      reason: `${missing.map(pathName).join(', ')} ${missing.length === 1 ? 'has' : 'have'} no average rounds. A path you cannot count is a path you cannot cost.`,
      action:
        'Count send-backs divided by tasks over a normal week, from your judge verdicts, validation errors, tool errors and review queue.',
    };
  }
  return {
    ...base,
    status: 'Pass',
    reason: `${present.length} path${present.length === 1 ? '' : 's'} listed, each with how often it sends work back.`,
    action: '',
  };
}

function check2(m: ReworkModel): CheckResult {
  const present = presentPaths(m);
  const base = { n: 2 as const, title: CHECK_TITLES[2] };
  if (present.length === 0) {
    return { ...base, status: 'Not answered', reason: 'No path is marked as present yet.', action: '' };
  }
  const incomplete = present.filter(
    (p) => !filled(p.repeated) || !filled(p.review) || !filled(p.growth),
  );
  if (incomplete.length) {
    return {
      ...base,
      status: 'Fail',
      reason: `${incomplete.map(pathName).join(', ')} ${incomplete.length === 1 ? 'is' : 'are'} missing repeated, review or growth. Zero is a valid answer; blank is not.`,
      action:
        'Open one trace that was sent back and read the three figures off it: the tokens of the steps that ran again, the checker\u2019s own call, and how much bigger the redo\u2019s input was.',
    };
  }
  // A judge, validator, tool error or human rejection normally carries the
  // previous attempt forward. Zero growth on one of those is usually an
  // oversight, so it is raised without being treated as wrong.
  const noGrowth = present.filter((p) => pathMeta(p.kind).expectsGrowth && p.growth === 0);
  if (noGrowth.length) {
    return {
      ...base,
      status: 'Attention',
      reason: `${noGrowth.map(pathName).join(', ')} ${noGrowth.length === 1 ? 'has' : 'have'} no context growth. Redos usually carry more context. Check this.`,
      action:
        'Compare the input tokens of the first attempt with the redo in one trace. If the critique, the error or the rejected draft is carried forward, growth is not zero.',
    };
  }
  return { ...base, status: 'Pass', reason: 'Every present path has all three parts of a round.', action: '' };
}

function check3(m: ReworkModel): CheckResult {
  const present = presentPaths(m);
  const base = { n: 3 as const, title: CHECK_TITLES[3] };
  if (present.length === 0) {
    return { ...base, status: 'Not answered', reason: 'No path is marked as present yet.', action: '' };
  }
  const uncapped = uncappedPaths(m);
  const undecided = present.filter((p) => p.afterLast === '' || p.afterLast === 'Not decided');
  if (uncapped.length || undecided.length) {
    const parts: string[] = [];
    if (uncapped.length) parts.push(`${uncapped.map(pathName).join(', ')} has no cap`);
    if (undecided.length)
      parts.push(`${undecided.map(pathName).join(', ')} has no decided outcome after the last round`);
    return {
      ...base,
      status: 'Fail',
      reason: `${parts.join('; ')}. Without both, the worst case has no ceiling.`,
      action: uncapped.length
        ? 'Set a maximum rounds per task in your orchestrator, and decide what the agent does after the last one: fail and tell the user, hand to a human, ship with a warning, or queue it.'
        : 'Decide what the agent does after the last round: fail and tell the user, hand to a human, ship with a warning, or queue it.',
    };
  }
  const unowned = present.filter((p) => p.owner.trim() === '');
  if (unowned.length) {
    return {
      ...base,
      status: 'Attention',
      reason: `${unowned.map(pathName).join(', ')} has a cap and an outcome, but nobody owns it.`,
      action: 'Name the person or team who picks it up when that outcome fires.',
    };
  }
  return { ...base, status: 'Pass', reason: 'Every present path is capped, with a decided outcome and a named owner.', action: '' };
}

function check4(r: Pick<Reading, 'typicalShare' | 'worstShare' | 'unbounded'>): CheckResult {
  const base = { n: 4 as const, title: CHECK_TITLES[4] };
  if (r.unbounded) {
    return {
      ...base,
      status: 'Fail',
      reason: 'The worst case is unbounded, so there is no availability number to check.',
      action: 'Cap every present path first. Until then there is no worst case to compare against the quota.',
    };
  }
  if (r.typicalShare === null || r.worstShare === null) {
    return { ...base, status: 'Not answered', reason: 'Peak tasks per minute and the quota are needed for this one.', action: '' };
  }
  if (r.typicalShare > 1) {
    return {
      ...base,
      status: 'Fail',
      reason: 'Your normal load already exceeds the quota.',
      action:
        'Cut what a round costs, lower the average rounds, or raise the quota. The path with the largest average rounds times round cost is the lever; on most workflows that is the judge.',
    };
  }
  if (r.typicalShare <= 0.8 && r.worstShare <= 1) {
    return { ...base, status: 'Pass', reason: 'Normal load has headroom, and the worst case still fits.', action: '' };
  }
  if (r.typicalShare <= 0.8) {
    return {
      ...base,
      status: 'Attention',
      reason: 'Normal load has headroom, but the worst case goes over the quota.',
      action: 'Lower the caps, or add a circuit breaker that stops new work once the refusal rate crosses a threshold, so a bad minute cannot reach the worst case.',
    };
  }
  return {
    ...base,
    status: 'Attention',
    reason: 'Normal load is above 80% of the quota. Any spike tips it over.',
    action: 'Get normal load under 80% of the quota: cut the round cost, cut the average rounds, or raise the quota.',
  };
}

function check5(m: ReworkModel, r: Pick<Reading, 'typical' | 'worst' | 'unbounded'>): CheckResult {
  const base = { n: 5 as const, title: CHECK_TITLES[5] };
  if (m.enforcement === '') {
    return { ...base, status: 'Not answered', reason: 'Choose how your budget is enforced.', action: '' };
  }
  if (m.enforcement !== 'Per task, across all rounds') {
    return {
      ...base,
      status: 'Fail',
      reason:
        m.enforcement === 'Per call only'
          ? 'Your budget is checked on each call, so it sees the attempts one at a time and never sees them add up.'
          : 'Nothing stops a task once it passes a token total, so a runaway task runs until something else breaks.',
      action:
        'Count tokens against the task, across every round, and stop the task when it crosses the budget. Then make check 3\u2019s outcome run when it does.',
    };
  }
  if (m.budget === null || r.typical === null) {
    return { ...base, status: 'Not answered', reason: 'Enter a per-task budget and this check compares it against both totals above.', action: '' };
  }
  if (m.budget < r.typical) {
    return {
      ...base,
      status: 'Fail',
      reason: `Your budget of ${tokens(m.budget)} is below what a normal task costs (${tokens(r.typical)}), so it would cut ordinary work short.`,
      action: 'Raise the budget above the typical cost per task, or cut the round cost so a normal task fits inside it.',
    };
  }
  // Unbounded counts as "above the budget": the budget is the only stop there
  // is, which is exactly the case this branch describes.
  const aboveBudget = r.unbounded || (r.worst !== null && r.worst > m.budget);
  if (aboveBudget) {
    return {
      ...base,
      status: 'Pass',
      // Concrete, and it does not send the reader off to another check to
       // find out what it means.
      // The caveat rides in the finding, not in an action: a Pass means
       // nothing is wrong, and a "Do this" on a Pass reads as a contradiction.
      reason: r.unbounded
        ? `Your budget of ${tokens(m.budget)} is the only thing stopping a task here, because a path has no cap. Confirm the outcome you chose actually runs when the budget fires.`
        : `Your budget of ${tokens(m.budget)} sits above a normal task (${tokens(r.typical)}) and below the worst case (${tokens(r.worst)}), so it stops a runaway task without touching ordinary ones. Confirm the outcome you chose for each path actually runs when it fires.`,
      action: '',
    };
  }
  if (r.worst === null) {
    return { ...base, status: 'Not answered', reason: 'The worst case is not worked out yet, so there is nothing to compare the budget against.', action: '' };
  }
  return {
    ...base,
    status: 'Attention',
    reason: `Your budget of ${tokens(m.budget)} is above even the worst case (${tokens(r.worst)}), so it never comes into play. Your caps are the only thing stopping a task.`,
    action: 'Set the budget between the typical cost and the worst case, so it actually stops a runaway task.',
  };
}

// ---------------------------------------------------------------------------
// The whole reading
// ---------------------------------------------------------------------------

export interface Reading {
  typical: number | null;
  typicalMultiple: number | null;
  typicalPeak: number | null;
  typicalShare: number | null;
  /** True when a present path has no cap. Every worst-case figure is then null. */
  unbounded: boolean;
  worst: number | null;
  worstMultiple: number | null;
  worstPeak: number | null;
  worstShare: number | null;
  costPerTask: number | null;
  costPerThousand: number | null;
  checks: CheckResult[];
  /** The first Fail in check order, else the first Attention, else null. */
  nextStep: CheckResult | null;
}

export function read(m: ReworkModel): Reading {
  const unbounded = isUnbounded(m);
  const typical = typicalCostPerTask(m);
  const worst = worstCostPerTask(m);

  const typicalPeak = times(m.peakTasksPerMinute, typical);
  const worstPeak = times(m.peakTasksPerMinute, worst);

  const partial = {
    typical,
    worst,
    unbounded,
    typicalShare: share(typicalPeak, m.quotaPerMinute),
    worstShare: share(worstPeak, m.quotaPerMinute),
  };

  const checks: CheckResult[] = [
    check1(m),
    check2(m),
    check3(m),
    check4(partial),
    check5(m, partial),
  ];

  // The first Fail in check order, else the first Attention. This is the one
  // line a reader acts on, so it carries the action rather than the finding.
  const nextStep =
    checks.find((c) => c.status === 'Fail') ?? checks.find((c) => c.status === 'Attention') ?? null;

  const price = m.pricePerMillion;
  const costPerTask =
    typical === null || price === null ? null : (typical * price) / 1_000_000;

  return {
    typical,
    typicalMultiple: multiple(typical, m.cleanRun),
    typicalPeak,
    typicalShare: partial.typicalShare,
    unbounded,
    worst,
    worstMultiple: multiple(worst, m.cleanRun),
    worstPeak,
    worstShare: partial.worstShare,
    costPerTask,
    costPerThousand: costPerTask === null ? null : costPerTask * 1000,
    checks,
    nextStep,
  };
}

// ---------------------------------------------------------------------------
// Formatting. Shared so the page and the tests agree on what a reader sees.
// ---------------------------------------------------------------------------

/** Thousands separators, fixed. Not the reader's locale, and not lakhs. */
export const tokens = (n: number | null): string =>
  n === null ? '—' : Math.round(n).toLocaleString('en-GB');

export const percent = (n: number | null): string =>
  n === null ? '—' : `${(Math.round(n * 1000) / 10).toFixed(1)}%`;

export const multipleOf = (n: number | null): string =>
  n === null ? '—' : `${(Math.round(n * 100) / 100).toFixed(2)}×`;

/** Money carries no currency symbol: the reader's price is in their own. */
export const money = (n: number | null): string =>
  n === null ? '—' : (Math.round(n * 100) / 100).toFixed(2);
