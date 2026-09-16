/**
 * The Cost-Ceiling Workbook — the calculation, and nothing else.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THIS FILE IMPORTS NOTHING AND RENDERS NOTHING.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * It is plain TypeScript with no framework, no DOM and no Astro. Two consumers
 * read it and they must never disagree: the page's browser script, and the
 * tests in costCeiling.test.ts. A second copy of any formula — in a template,
 * in an inline script, in a spreadsheet the page describes — is how three
 * surfaces end up giving three answers to "what does one attempt cost".
 *
 * That failure has already happened in this repo. `pairing.ts` read a heading
 * with a regex of its own and returned the empty string for every record
 * written under the current template, silently. A number is worse: a wrong cost
 * per attempt reads as a right one.
 *
 * Conventions, applied everywhere below:
 *
 *   * Prices are USD per MILLION tokens (MTok). Divide by 1e6 once, at the end
 *     of a cost line, never in the middle.
 *   * Percentages are fractions between 0 and 1, never 0–100.
 *   * Every division is guarded. A zero denominator returns null or a stated
 *     sentinel; it never returns Infinity or NaN into a page.
 *   * Inputs are clamped on the way in: percentages to [0, 1], turns to at
 *     least 1, counts to at least 0. The UI cannot be trusted to do it, because
 *     a number input accepts a pasted "-5".
 *
 * The numbers this produces are teaching values. See the caveats on the page.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Clamps and guards
// ═══════════════════════════════════════════════════════════════════════════

/** Anything not a finite number becomes the fallback. Covers NaN, Infinity, "". */
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/** A fraction, forced into [0, 1]. */
export const clampShare = (v: unknown): number => Math.min(1, Math.max(0, num(v, 0)));

/** A count. Never negative. */
export const clampCount = (v: unknown): number => Math.max(0, num(v, 0));

/** Turns. At least one, and whole — half a turn is not a thing that happens. */
export const clampTurns = (v: unknown): number => Math.max(1, Math.floor(num(v, 1)));

/**
 * Division that refuses to produce Infinity or NaN.
 *
 * Returns null rather than 0 on a zero denominator, because 0 is a legitimate
 * answer to some of these questions and "we cannot say" is not the same claim.
 */
export const safeDiv = (a: number, b: number): number | null =>
  b === 0 || !Number.isFinite(b) || !Number.isFinite(a) ? null : a / b;

// ═══════════════════════════════════════════════════════════════════════════
// The price card
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Prices as published, with the blanks left blank.
 *
 * A blank is not a zero. It means the provider's page did not state the term,
 * or a tracker carried it and the provider's page did not. `resolvePrices()`
 * below turns blanks into the documented fallback in ONE place, so the fallback
 * rule cannot drift between the page, the workbook and the tests.
 */
export interface ModelPrice {
  id: string;
  label: string;
  /** USD per MTok. */
  input: number;
  /** USD per MTok. */
  output: number;
  /** USD per MTok. Blank (null) means: charge it at the input price. */
  cacheRead: number | null;
  /** USD per MTok, 5-minute write. Blank (null) means: charge it at the input price. */
  cacheWrite: number | null;
  /** Fraction off eligible cost. Blank (null) means: no discount. */
  batchDiscount: number | null;
  /** Where the figure came from. Shown beside the model select. */
  source: string;
  /** What a reader has to check for themselves. Empty string where there is nothing. */
  note: string;
  /** True for the one row whose numbers the reader types in. */
  custom?: boolean;
}

/** Every row on the card was checked on this date. One date, stated once. */
export const PRICES_CHECKED_ON = '2026-09-16';

export const PRICE_CARD: ModelPrice[] = [
  {
    id: 'opus-5',
    label: 'Claude Opus 5',
    input: 5,
    output: 25,
    cacheRead: 0.5,
    cacheWrite: 6.25,
    batchDiscount: 0.5,
    source: 'Anthropic pricing via trackers',
    note: 'Cache read 0.1x input; 5-minute write 1.25x',
  },
  {
    id: 'sonnet-5',
    label: 'Claude Sonnet 5',
    input: 2,
    output: 10,
    cacheRead: 0.2,
    cacheWrite: 2.5,
    batchDiscount: 0.5,
    source: 'Trackers',
    note: 'Most report $2/$10 permanent; one lists $3/$15. Verify.',
  },
  {
    id: 'haiku-4-5',
    label: 'Claude Haiku 4.5',
    input: 1,
    output: 5,
    cacheRead: 0.1,
    cacheWrite: 1.25,
    batchDiscount: 0.5,
    source: 'Trackers',
    note: '',
  },
  {
    id: 'fable-5-1',
    label: 'Claude Fable 5.1',
    input: 10,
    output: 50,
    cacheRead: 0.25,
    cacheWrite: null,
    batchDiscount: 0.5,
    source: 'Trackers',
    note: 'Cache read from one tracker only',
  },
  {
    id: 'gpt-5-6-sol',
    label: 'GPT-5.6 Sol',
    input: 4,
    output: 20,
    cacheRead: null,
    cacheWrite: null,
    batchDiscount: null,
    source: 'Tracker',
    note: 'Enter cache and batch terms from provider',
  },
  {
    id: 'gemini-3-1-pro',
    label: 'Gemini 3.1 Pro',
    input: 2,
    output: 12,
    cacheRead: null,
    cacheWrite: null,
    batchDiscount: null,
    source: 'Tracker',
    note: 'Enter cache and batch terms from provider',
  },
  {
    id: 'low-cost-open',
    label: 'Low-cost open model',
    input: 0.3,
    output: 1.2,
    cacheRead: null,
    cacheWrite: null,
    batchDiscount: null,
    source: 'Tracker (MiniMax M3)',
    note: 'Check data-governance terms',
  },
  {
    id: 'custom',
    label: 'Custom',
    input: 2,
    output: 10,
    cacheRead: null,
    cacheWrite: null,
    batchDiscount: null,
    source: '',
    note: 'User-entered rate',
    custom: true,
  },
];

/** Every price with its blanks resolved. The only place the fallback rule lives. */
export interface ResolvedPrices {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  batchDiscount: number;
}

/**
 * Blank handling, stated once:
 *
 *   * a blank cache read or cache write price equals the INPUT price
 *   * a blank batch discount equals 0
 *
 * The cache fallback is deliberately pessimistic. A provider that has not
 * published a cache rate is a provider you cannot assume gives you one, and a
 * model that quietly assumed 0.1x would under-price every estimate on this page
 * by an order of magnitude on the cached lines.
 */
export const resolvePrices = (p: ModelPrice): ResolvedPrices => {
  const input = Math.max(0, num(p.input, 0));
  return {
    input,
    output: Math.max(0, num(p.output, 0)),
    cacheRead: p.cacheRead === null ? input : Math.max(0, num(p.cacheRead, input)),
    cacheWrite: p.cacheWrite === null ? input : Math.max(0, num(p.cacheWrite, input)),
    batchDiscount: p.batchDiscount === null ? 0 : clampShare(p.batchDiscount),
  };
};

export const priceById = (id: string): ModelPrice =>
  PRICE_CARD.find((m) => m.id === id) ?? PRICE_CARD[1];

/**
 * The resolved prices for one model id, with the custom row's overrides applied.
 *
 * A custom field left empty is a BLANK, not a zero, and takes the same fallback
 * as a blank on the published card: cache prices fall back to the input price,
 * a missing batch discount falls back to none. That is why the overrides are
 * folded in as `number | null` before `resolvePrices` sees them, rather than
 * after.
 */
export const pricesFor = (
  id: string,
  overrides?: Partial<ResolvedPrices>,
): ResolvedPrices => {
  const base = priceById(id);
  if (!base.custom || !overrides) return resolvePrices(base);

  /** An override is only an override if it is a real number. Otherwise: blank. */
  const given = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;

  return resolvePrices({
    ...base,
    input: given(overrides.input) ?? base.input,
    output: given(overrides.output) ?? base.output,
    cacheRead: given(overrides.cacheRead),
    cacheWrite: given(overrides.cacheWrite),
    batchDiscount: given(overrides.batchDiscount),
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// View 1 — one attempt
// ═══════════════════════════════════════════════════════════════════════════

export interface AttemptInputs {
  /** Id from the price card, or the custom row. */
  model: string;
  /** Model turns in one attempt. */
  turns: number;
  /** Stable system prompt and tool schemas, sent every turn. */
  prefixTokens: number;
  /** Booking record, disruption notice, policy extract. Sent every turn. */
  initialContextTokens: number;
  /** Tool results and prior output added per turn, re-sent on every later turn. */
  growthPerTurn: number;
  /** Visible output tokens per turn. */
  outputPerTurn: number;
  /** Reasoning tokens per turn. Billed as output. */
  reasoningPerTurn: number;
  /** Share of the prefix served from cache, 0 to 1. */
  cacheHitRate: number;
  /** Batch pricing. A live agent cannot wait, so this is normally false. */
  useBatch: boolean;
  /** USD of non-model tool spend per attempt. */
  toolCostPerAttempt: number;
  /** Only read when `model` is the custom row. */
  customPrices?: Partial<ResolvedPrices>;
}

export interface AttemptResult {
  /** Input tokens sent across the whole attempt, before cache accounting. */
  totalInput: number;
  cacheRead: number;
  cacheWrite: number;
  uncachedInput: number;
  outputTokens: number;
  /** Input tokens on the LAST turn alone. */
  finalTurnInput: number;
  /** How much bigger the last turn's input is than the first turn's. */
  finalVsFirst: number | null;
  /** USD. The four token lines, after any batch discount. */
  modelCost: number;
  /** USD. Model cost plus tools. */
  costPerAttempt: number;
  /** Output's share of model cost, measured BEFORE the batch discount. */
  outputShare: number | null;
  /** Reasoning's share of all output tokens. */
  reasoningShare: number | null;
  /** The four lines, in USD, before the batch discount. Shown as a breakdown. */
  lines: {
    cacheRead: number;
    cacheWrite: number;
    uncachedInput: number;
    output: number;
  };
  prices: ResolvedPrices;
}

/**
 * The growth term is the whole point of this view.
 *
 *   growth * turns * (turns - 1) / 2
 *
 * An agent re-sends everything it has accumulated on every turn, so turn 4
 * carries what turns 1 to 3 produced. That is a triangular number, which means
 * input tokens grow with the SQUARE of the turn count, not with the turn count.
 * Doubling the turns roughly quadruples the input bill. This is the line people
 * are surprised by, and it is why `finalVsFirst` is reported beside it.
 */
export const computeAttempt = (raw: AttemptInputs): AttemptResult => {
  const prices = pricesFor(raw.model, raw.customPrices);

  const turns = clampTurns(raw.turns);
  const prefix = clampCount(raw.prefixTokens);
  const initial = clampCount(raw.initialContextTokens);
  const growth = clampCount(raw.growthPerTurn);
  const output = clampCount(raw.outputPerTurn);
  const reasoning = clampCount(raw.reasoningPerTurn);
  const hitRate = clampShare(raw.cacheHitRate);
  const toolCost = clampCount(raw.toolCostPerAttempt);

  const totalInput = turns * (prefix + initial) + (growth * turns * (turns - 1)) / 2;
  const cacheRead = prefix * turns * hitRate;
  const cacheWrite = prefix * turns * (1 - hitRate);
  const uncachedInput = totalInput - cacheRead - cacheWrite;
  const outputTokens = turns * (output + reasoning);

  const finalTurnInput = prefix + initial + growth * (turns - 1);
  const finalVsFirst = safeDiv(finalTurnInput, prefix + initial);

  const lines = {
    cacheRead: (cacheRead * prices.cacheRead) / 1e6,
    cacheWrite: (cacheWrite * prices.cacheWrite) / 1e6,
    uncachedInput: (uncachedInput * prices.input) / 1e6,
    output: (outputTokens * prices.output) / 1e6,
  };

  const beforeBatch = lines.cacheRead + lines.cacheWrite + lines.uncachedInput + lines.output;
  const modelCost = raw.useBatch ? beforeBatch * (1 - prices.batchDiscount) : beforeBatch;

  return {
    totalInput,
    cacheRead,
    cacheWrite,
    uncachedInput,
    outputTokens,
    finalTurnInput,
    finalVsFirst,
    modelCost,
    costPerAttempt: modelCost + toolCost,
    // Measured before the batch discount on purpose: batch scales all four
    // lines equally, so applying it first would leave the share unchanged while
    // implying the discount had been considered.
    outputShare: safeDiv(lines.output, beforeBatch),
    reasoningShare: safeDiv(reasoning, output + reasoning),
    lines,
    prices,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// View 2 — one period
// ═══════════════════════════════════════════════════════════════════════════

export interface PeriodInputs {
  hours: number;
  cases: number;
  /** Attempts per case. Retries under load are the whole reason this is not 1. */
  attemptsPerCase: number;
  /** Share of cases that met the written acceptance definition. */
  acceptedShare: number;
  /** Share of cases that reached a human. */
  escalatedShare: number;
  reviewMinutes: number;
  /** USD per hour of review time. */
  reviewHourlyCost: number;
  /** Background runs in the period — summaries, reconciliation, sweeps. */
  bgRuns: number;
  bgInputTokens: number;
  bgOutputTokens: number;
  bgUseBatch: boolean;
  /** USD allocated to the period once: infrastructure, logging, monitoring. */
  fixedCost: number;
  /** Multiplier into the reporting currency. 1 means no conversion. */
  fxRate: number;
  /** What that rate is, in words. Printed beside the converted figure. */
  fxBasis: string;
}

export interface PeriodResult {
  attempts: number;
  /** USD spent by the agent itself. */
  agentCost: number;
  /** USD spent on background jobs, priced on the same scenario's model. */
  bgCost: number;
  /** USD of human review time. */
  reviewCost: number;
  fixedCost: number;
  /** USD. Everything. */
  total: number;
  accepted: number;
  /** Agent cost only, divided by cases. This is the figure the ceiling uses. */
  costPerCase: number | null;
  /**
   * Fully loaded cost per accepted result — the number to argue about.
   *
   * Returns the STRING 'undefined' when nothing was accepted, not 0 and not
   * null. Zero accepted results at any cost is not a cost of zero, and a page
   * that printed "$0.00" there would be stating the opposite of what happened.
   */
  costPerAccepted: number | 'undefined';
  /** `total` in the reporting currency. */
  totalReporting: number;
}

export const computePeriod = (
  raw: PeriodInputs,
  costPerAttempt: number,
  prices: ResolvedPrices,
): PeriodResult => {
  const cases = clampCount(raw.cases);
  const attemptsPerCase = clampCount(raw.attemptsPerCase);
  const acceptedShare = clampShare(raw.acceptedShare);
  const escalatedShare = clampShare(raw.escalatedShare);
  const reviewMinutes = clampCount(raw.reviewMinutes);
  const reviewHourlyCost = clampCount(raw.reviewHourlyCost);
  const fixedCost = clampCount(raw.fixedCost);
  const perAttempt = Math.max(0, num(costPerAttempt, 0));

  const attempts = cases * attemptsPerCase;
  const agentCost = attempts * perAttempt;

  const bgCost = computeBackgroundCost(raw, prices);

  const reviewCost = ((cases * escalatedShare * reviewMinutes) / 60) * reviewHourlyCost;
  const total = agentCost + bgCost + reviewCost + fixedCost;
  const accepted = cases * acceptedShare;

  return {
    attempts,
    agentCost,
    bgCost,
    reviewCost,
    fixedCost,
    total,
    accepted,
    costPerCase: safeDiv(agentCost, cases),
    costPerAccepted: accepted === 0 ? 'undefined' : total / accepted,
    totalReporting: total * num(raw.fxRate, 1),
  };
};

/**
 * Background jobs are priced on the SAME scenario's model.
 *
 * They are not a separate model choice on the page, deliberately: a second
 * model select here is a second thing to keep in step, and the sweep that
 * summarises a disruption night runs on whatever the night ran on.
 */
const computeBackgroundCost = (raw: PeriodInputs, prices: ResolvedPrices): number => {
  const runs = clampCount(raw.bgRuns);
  const gross =
    (runs *
      (clampCount(raw.bgInputTokens) * prices.input +
        clampCount(raw.bgOutputTokens) * prices.output)) /
    1e6;
  return raw.bgUseBatch ? gross * (1 - prices.batchDiscount) : gross;
};

// ═══════════════════════════════════════════════════════════════════════════
// One scenario, end to end
// ═══════════════════════════════════════════════════════════════════════════

export interface ScenarioInputs {
  attempt: AttemptInputs;
  period: PeriodInputs;
}

export interface ScenarioResult {
  attempt: AttemptResult;
  period: PeriodResult;
}

/**
 * Compute one column of the calculator — Normal day or Storm night.
 *
 * The two views are joined here rather than in the UI, because view 2 needs
 * view 1's `costPerAttempt` and view 1's resolved prices. A UI that wired those
 * together itself would be re-implementing the join in every consumer.
 */
export const computeScenario = (s: ScenarioInputs): ScenarioResult => {
  const attempt = computeAttempt(s.attempt);
  return {
    attempt,
    period: computePeriod(s.period, attempt.costPerAttempt, attempt.prices),
  };
};

/** Storm cost per case over normal cost per case. Null if normal is zero. */
export const stormVsNormal = (normal: ScenarioResult, storm: ScenarioResult): number | null =>
  safeDiv(storm.period.costPerCase ?? 0, normal.period.costPerCase ?? 0);

// ═══════════════════════════════════════════════════════════════════════════
// View 3 — the shared ceiling
// ═══════════════════════════════════════════════════════════════════════════

export interface CeilingInputs {
  /** USD the whole period may spend. */
  ceiling: number;
  /** USD one attempt is allowed to reach before it is stopped. */
  capPerAttempt: number;
  /** Attempts running at the same moment. */
  concurrentInFlight: number;
  /** Minutes between spending money and seeing it on the provider's bill. */
  billingLagMinutes: number;
}

export interface CeilingResult {
  completed: number;
  stranded: number;
  /**
   * USD the ceiling can be exceeded by when every worker CHECKS the balance and
   * then ACTS on it. Between the check and the write, every other worker sees
   * the same balance, so the ceiling is breached by one full cap per worker.
   */
  checkThenActOver: number;
  /** That overshoot as a share of the ceiling. */
  overShare: number | null;
  /**
   * USD reserve-then-settle can exceed the ceiling by: zero.
   *
   * Only true when the reservation is ATOMIC and every retry reserves again.
   * A non-atomic reservation is check-then-act wearing a different name.
   */
  reserveOver: number;
  /** USD claimed but not spent, sitting idle while attempts run. */
  lockedHeadroom: number;
  /** USD per minute the agent is spending. */
  spendPerMinute: number | null;
  /** USD already spent that the provider has not billed yet. */
  unseenSpend: number | null;
}

export const computeCeiling = (
  raw: CeilingInputs,
  scenario: ScenarioResult,
  hours: number,
  cases: number,
): CeilingResult => {
  const ceiling = clampCount(raw.ceiling);
  const cap = clampCount(raw.capPerAttempt);
  const concurrent = clampCount(raw.concurrentInFlight);
  const lag = clampCount(raw.billingLagMinutes);
  const costPerCase = scenario.period.costPerCase ?? 0;
  const caseCount = clampCount(cases);

  // A cost per case of zero means every case is free, so the ceiling stops
  // nobody. Dividing would give Infinity and floor(Infinity) throws nothing but
  // poisons every figure downstream.
  const affordable = costPerCase > 0 ? Math.floor(ceiling / costPerCase) : caseCount;
  const completed = Math.min(caseCount, affordable);
  const stranded = caseCount - completed;

  const checkThenActOver = concurrent * cap;
  const spendPerMinute = safeDiv(scenario.period.agentCost, clampCount(hours) * 60);

  return {
    completed,
    stranded,
    checkThenActOver,
    overShare: safeDiv(checkThenActOver, ceiling),
    reserveOver: 0,
    // Every claim is for the worst case; most attempts cost less than the cap,
    // and the difference is money the ceiling is holding that nobody is using.
    lockedHeadroom: concurrent * Math.max(0, cap - scenario.attempt.costPerAttempt),
    spendPerMinute,
    unseenSpend: spendPerMinute === null ? null : spendPerMinute * lag,
  };
};

/** The reserve-then-settle protocol, as four steps. Printed, not computed. */
export const RESERVE_THEN_SETTLE: string[] = [
  'Before an attempt starts, atomically claim its worst-case cost from the shared ceiling. If the claim fails, do not start.',
  'When the attempt ends, record the actual cost and release the unused part of the claim.',
  'If a worker dies, expire its claim after a timeout and send the case to review instead of retrying silently.',
  'Reconcile claims against provider usage on a schedule. The provider bill is the final record.',
];

// ═══════════════════════════════════════════════════════════════════════════
// View 4 — what stopping costs
// ═══════════════════════════════════════════════════════════════════════════

export interface StoppingInputs {
  /** USD the business pays for one case the ceiling froze. */
  businessCostPerFrozenCase: number;
  /** Share of frozen cases that actually incur that cost, 0 to 1. */
  shareIncurringCost: number;
  humanMinutesPerCase: number;
  humanHourlyCost: number;
  /** Share of routed cases a human actually resolves, 0 to 1. */
  humanResolvedShare: number;
}

export type StoppingOption = 'A' | 'B' | 'C';

export interface StoppingResult {
  /** USD of agent spend the ceiling prevented. This is what the control "saved". */
  tokenCostAvoided: number;
  /** A — lift the ceiling and finish the cases with the agent. */
  optionA_continue: number;
  /** B — freeze the cases and pay whatever a frozen case costs. */
  optionB_freeze: number;
  /** C — route the cases to people. */
  optionC_route: number;
  lowest: StoppingOption;
  /** USD of business cost per USD of token cost the ceiling avoided. */
  freezePerDollar: number | null;
  /**
   * The business cost per frozen case above which freezing costs more than
   * finishing the case with the agent.
   */
  breakEven: number | null;
}

export const computeStopping = (
  raw: StoppingInputs,
  stranded: number,
  costPerCase: number,
): StoppingResult => {
  const frozen = clampCount(stranded);
  const perCase = Math.max(0, num(costPerCase, 0));
  const businessCost = clampCount(raw.businessCostPerFrozenCase);
  const shareIncurring = clampShare(raw.shareIncurringCost);
  const minutes = clampCount(raw.humanMinutesPerCase);
  const hourly = clampCount(raw.humanHourlyCost);
  const resolved = clampShare(raw.humanResolvedShare);

  const tokenCostAvoided = frozen * perCase;
  const optionA = tokenCostAvoided;
  const optionB = frozen * businessCost * shareIncurring;
  const optionC =
    (frozen * minutes * hourly) / 60 + frozen * (1 - resolved) * businessCost * shareIncurring;

  // Ties resolve A, then B, then C. Stated rather than left to sort order: a
  // tie between "finish it" and "freeze it" should read as finish it.
  let lowest: StoppingOption = 'A';
  if (optionB < optionA) lowest = 'B';
  if (optionC < Math.min(optionA, optionB)) lowest = 'C';

  return {
    tokenCostAvoided,
    optionA_continue: optionA,
    optionB_freeze: optionB,
    optionC_route: optionC,
    lowest,
    freezePerDollar: safeDiv(optionB, tokenCostAvoided),
    breakEven: safeDiv(perCase, shareIncurring),
  };
};

/** The option names, for the one place the page states the answer in words. */
export const STOPPING_OPTIONS: Record<StoppingOption, string> = {
  A: 'A (continue)',
  B: 'B (freeze)',
  C: 'C (route to people)',
};

// ═══════════════════════════════════════════════════════════════════════════
// Display formatting
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Currency, at three precisions.
 *
 *   under $1      four decimals — a cost per attempt of $0.16 hides the 0.0065
 *                 that becomes $650 across a hundred thousand attempts
 *   $1 to $999    two decimals
 *   $1,000 and up no decimals, with thousands separators
 *
 * The band is chosen by MAGNITUDE, not by which field it is, so the same number
 * reads the same way wherever it appears.
 */
export const money = (v: number | null | 'undefined'): string => {
  if (v === 'undefined') return 'undefined';
  if (v === null || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs < 1) return `$${v.toFixed(4)}`;
  if (abs < 1000) return `$${v.toFixed(2)}`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
};

/** Token counts, with thousands separators and no decimals. */
export const tokens = (v: number | null): string =>
  v === null || !Number.isFinite(v) ? '—' : Math.round(v).toLocaleString('en-US');

/** A multiplier: one decimal, then an x. */
export const multiplier = (v: number | null): string =>
  v === null || !Number.isFinite(v) ? '—' : `${v.toFixed(1)}x`;

/** A fraction rendered as a percentage, one decimal. */
export const percent = (v: number | null): string =>
  v === null || !Number.isFinite(v) ? '—' : `${(v * 100).toFixed(1)}%`;

// ═══════════════════════════════════════════════════════════════════════════
// The example values
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The defaults the page loads with, and the values Reset returns to.
 *
 * These are INVENTED TEACHING VALUES. They are not prices anybody paid, not a
 * forecast and not an observed result. They exist so the calculator has a
 * worked example in it on arrival, because an empty calculator asks a reader to
 * supply the very numbers they came here to learn how to estimate.
 */
export const NORMAL: ScenarioInputs = {
  attempt: {
    model: 'sonnet-5',
    turns: 6,
    prefixTokens: 6000,
    initialContextTokens: 3000,
    growthPerTurn: 1500,
    outputPerTurn: 400,
    reasoningPerTurn: 600,
    cacheHitRate: 0.9,
    useBatch: false,
    toolCostPerAttempt: 0.01,
  },
  period: {
    hours: 24,
    cases: 2000,
    attemptsPerCase: 1.3,
    acceptedShare: 0.92,
    escalatedShare: 0.06,
    reviewMinutes: 8,
    reviewHourlyCost: 30,
    bgRuns: 24,
    bgInputTokens: 400000,
    bgOutputTokens: 20000,
    bgUseBatch: true,
    fixedCost: 60,
    fxRate: 1,
    fxBasis: 'USD, no conversion',
  },
};

export const STORM: ScenarioInputs = {
  attempt: {
    model: 'sonnet-5',
    turns: 8,
    prefixTokens: 6000,
    initialContextTokens: 3000,
    growthPerTurn: 1500,
    outputPerTurn: 400,
    reasoningPerTurn: 600,
    cacheHitRate: 0.9,
    useBatch: false,
    toolCostPerAttempt: 0.012,
  },
  period: {
    hours: 6,
    cases: 38000,
    attemptsPerCase: 3.1,
    acceptedShare: 0.8,
    escalatedShare: 0.12,
    reviewMinutes: 10,
    reviewHourlyCost: 30,
    bgRuns: 12,
    bgInputTokens: 900000,
    bgOutputTokens: 45000,
    bgUseBatch: false,
    fixedCost: 40,
    fxRate: 1,
    fxBasis: 'USD, no conversion',
  },
};

export const CEILING: CeilingInputs = {
  ceiling: 26600,
  capPerAttempt: 0.4,
  concurrentInFlight: 600,
  billingLagMinutes: 60,
};

export const STOPPING: StoppingInputs = {
  businessCostPerFrozenCase: 120,
  shareIncurringCost: 1,
  humanMinutesPerCase: 12,
  humanHourlyCost: 30,
  humanResolvedShare: 0.7,
};

/** Deep copy, so a Reset cannot be defeated by an earlier edit to the default. */
export const exampleValues = () => ({
  normal: structuredClone(NORMAL),
  storm: structuredClone(STORM),
  ceiling: structuredClone(CEILING),
  stopping: structuredClone(STOPPING),
});

// ═══════════════════════════════════════════════════════════════════════════
// Everything, in one call
// ═══════════════════════════════════════════════════════════════════════════

export interface WorkbookInputs {
  normal: ScenarioInputs;
  storm: ScenarioInputs;
  ceiling: CeilingInputs;
  stopping: StoppingInputs;
}

export interface WorkbookResult {
  normal: ScenarioResult;
  storm: ScenarioResult;
  stormVsNormal: number | null;
  ceiling: CeilingResult;
  stopping: StoppingResult;
}

/**
 * Views 3 and 4 run against the STORM scenario, always.
 *
 * A ceiling that is never approached on a normal day tells you nothing, and the
 * whole argument of this workbook is that the ceiling is a decision about the
 * worst night rather than about the average one.
 */
export const computeWorkbook = (i: WorkbookInputs): WorkbookResult => {
  const normal = computeScenario(i.normal);
  const storm = computeScenario(i.storm);
  const ceiling = computeCeiling(i.ceiling, storm, i.storm.period.hours, i.storm.period.cases);
  const stopping = computeStopping(i.stopping, ceiling.stranded, storm.period.costPerCase ?? 0);

  return {
    normal,
    storm,
    stormVsNormal: stormVsNormal(normal, storm),
    ceiling,
    stopping,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// One flat, formatted view of everything
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Every figure the page displays, formatted, keyed by a dotted path.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THIS IS WHY THE PAGE DOES NOT SHIFT AND THE TWO RENDERS AGREE.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The page is rendered on the server with the example values already computed,
 * so the numbers are in the HTML before any script runs. The browser script
 * then calls this same function on every keystroke and writes the results into
 * the same spans by the same keys.
 *
 * If the server used one formatter and the script used another, the first
 * keystroke would reformat every number on the page — a whole-page flicker, and
 * a layout shift wherever a value changed width. One function removes the
 * possibility rather than making it unlikely.
 *
 * It returns STRINGS. Callers display them; nothing downstream does arithmetic
 * on a formatted figure.
 */
export const outputs = (w: WorkbookResult): Record<string, string> => {
  const scenario = (name: 'normal' | 'storm', r: ScenarioResult): Record<string, string> => ({
    [`${name}.totalInput`]: tokens(r.attempt.totalInput),
    [`${name}.cacheRead`]: tokens(r.attempt.cacheRead),
    [`${name}.cacheWrite`]: tokens(r.attempt.cacheWrite),
    [`${name}.uncachedInput`]: tokens(r.attempt.uncachedInput),
    [`${name}.outputTokens`]: tokens(r.attempt.outputTokens),
    [`${name}.finalTurnInput`]: tokens(r.attempt.finalTurnInput),
    [`${name}.finalVsFirst`]: multiplier(r.attempt.finalVsFirst),
    [`${name}.modelCost`]: money(r.attempt.modelCost),
    [`${name}.costPerAttempt`]: money(r.attempt.costPerAttempt),
    [`${name}.outputShare`]: percent(r.attempt.outputShare),
    [`${name}.reasoningShare`]: percent(r.attempt.reasoningShare),

    [`${name}.line.cacheRead`]: money(r.attempt.lines.cacheRead),
    [`${name}.line.cacheWrite`]: money(r.attempt.lines.cacheWrite),
    [`${name}.line.uncachedInput`]: money(r.attempt.lines.uncachedInput),
    [`${name}.line.output`]: money(r.attempt.lines.output),

    [`${name}.attempts`]: tokens(r.period.attempts),
    [`${name}.agentCost`]: money(r.period.agentCost),
    [`${name}.bgCost`]: money(r.period.bgCost),
    [`${name}.reviewCost`]: money(r.period.reviewCost),
    [`${name}.fixedCost`]: money(r.period.fixedCost),
    [`${name}.total`]: money(r.period.total),
    [`${name}.accepted`]: tokens(r.period.accepted),
    [`${name}.costPerCase`]: money(r.period.costPerCase),
    [`${name}.costPerAccepted`]: money(r.period.costPerAccepted),
    [`${name}.totalReporting`]: money(r.period.totalReporting),
  });

  return {
    ...scenario('normal', w.normal),
    ...scenario('storm', w.storm),
    'stormVsNormal': multiplier(w.stormVsNormal),

    'ceiling.completed': tokens(w.ceiling.completed),
    'ceiling.stranded': tokens(w.ceiling.stranded),
    'ceiling.checkThenActOver': money(w.ceiling.checkThenActOver),
    'ceiling.overShare': percent(w.ceiling.overShare),
    'ceiling.reserveOver': money(w.ceiling.reserveOver),
    'ceiling.lockedHeadroom': money(w.ceiling.lockedHeadroom),
    'ceiling.spendPerMinute': money(w.ceiling.spendPerMinute),
    'ceiling.unseenSpend': money(w.ceiling.unseenSpend),

    'stopping.tokenCostAvoided': money(w.stopping.tokenCostAvoided),
    'stopping.optionA': money(w.stopping.optionA_continue),
    'stopping.optionB': money(w.stopping.optionB_freeze),
    'stopping.optionC': money(w.stopping.optionC_route),
    'stopping.lowest': STOPPING_OPTIONS[w.stopping.lowest],
    'stopping.freezePerDollar': money(w.stopping.freezePerDollar),
    'stopping.breakEven': money(w.stopping.breakEven),
  };
};
