// The Token Limit Framework — the model behind /resources/token-limit-framework.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE PAGE IS THE RESOURCE. THE WORKBOOK IS THE EXTRA.
// ═══════════════════════════════════════════════════════════════════════════
//
// Same shape as the POC Selection Tool, the Agent Authority Review and the
// Run-Cost Model: the reader types their workflow into the page and gets the
// assessment there, free, with nothing asked of them. The .xlsx is the optional
// artefact behind a name and an email, exactly as those three gate a PDF. That
// keeps the V4 addendum's line intact — "anonymous resource views/downloads are
// events, not people" — and it keeps every sentence in lib/pipeline/resources.ts
// true, including the one that promises the page was never behind the email.
//
// ═══════════════════════════════════════════════════════════════════════════
// THIS MODULE AND THE WORKBOOK COMPUTE THE SAME THING
// ═══════════════════════════════════════════════════════════════════════════
//
// Every function below mirrors a formula in tools/token-limit-framework/.
// The reference example is the workbook's tab 6, and the assertions at the
// foot check this module against the figures a real recalculation of the
// .xlsx produces (tools/token-limit-framework/verify_sheet.py). If a formula
// changes there, these numbers move and the first render fails.
//
// A BLANK IS UNKNOWN, NOT ZERO. Same rule as the Run-Cost Model, and the same
// reason: "this workflow never repeats work" is a claim the tool must not make
// on a reader's behalf. A total stays null until every line feeding it is set.

// ---------------------------------------------------------------------------
// Vocabulary. The dropdowns, and the only accepted values.
// ---------------------------------------------------------------------------

export const YESNO = ['Yes', 'No'] as const;
export const SIDE_EFFECTS = ['None', 'Reversible', 'Irreversible'] as const;
export const SCOPES = [
  'Per call',
  'Per task',
  'Per user',
  'Per tenant',
  'Shared across workflows',
] as const;
export const UNITS = ['tokens', 'requests', 'currency'] as const;
export const WINDOWS = ['per minute', 'per hour', 'per day', 'per month', 'per request'] as const;
export const HANDLING = [
  'Retry immediately',
  'Retry with backoff',
  'Fail task',
  'Queue',
  'Degrade',
  'Unknown',
] as const;
export const RETRY_SCOPES = [
  'Restart task',
  'Resume from last checkpoint',
  'Retry the call only',
] as const;
export const AUTO_MANUAL = ['Automatic', 'Manual'] as const;
export const STOP_COST = ['Low', 'Medium', 'High'] as const;
export const ANSWERS = ['Yes', 'Partial', 'No'] as const;

export type YesNo = (typeof YESNO)[number] | '';
export type SideEffect = (typeof SIDE_EFFECTS)[number] | '';
export type RetryScope = (typeof RETRY_SCOPES)[number] | '';
export type Answer = (typeof ANSWERS)[number] | '';

export const STEP_ROWS = 12;
export const LIMIT_ROWS = 10;

// ---------------------------------------------------------------------------
// The model the reader fills in
// ---------------------------------------------------------------------------

export interface Step {
  name: string;
  model: YesNo;
  api: YesNo;
  sideEffect: SideEffect;
  input: number | null;
  output: number | null;
  idempotent: YesNo;
  checkpoint: YesNo;
}

export interface Limit {
  name: string;
  scope: string;
  value: number | null;
  unit: string;
  window: string;
  sharedWith: string;
  signal: string;
  handling: string;
  owner: string;
}

export interface Retry {
  cleanRunOverride: number | null;
  refusedStep: number | null;
  scope: RetryScope;
  maxRetries: number | null;
  billed: YesNo;
  peakTasks: number | null;
  tpmOverride: number | null;
}

export interface StopState {
  left: string;
  userSees: string;
  cleanup: string;
  auto: string;
  owner: string;
  resume: YesNo;
  cost: string;
}

export interface Policy {
  budget: string;
  retries: string;
  backoff: string;
  breaker: string;
  shed: string;
  degrade: string;
}

export interface Model {
  steps: Step[];
  limits: Limit[];
  retry: Retry;
  stops: StopState[];
  answers: Answer[];
  policy: Policy;
}

export const blankStep = (): Step => ({
  name: '',
  model: '',
  api: '',
  sideEffect: '',
  input: null,
  output: null,
  idempotent: '',
  checkpoint: '',
});

export const blankLimit = (): Limit => ({
  name: '',
  scope: '',
  value: null,
  unit: '',
  window: '',
  sharedWith: '',
  signal: '',
  handling: '',
  owner: '',
});

export const blankStop = (): StopState => ({
  left: '',
  userSees: '',
  cleanup: '',
  auto: '',
  owner: '',
  resume: '',
  cost: '',
});

export const blankModel = (): Model => ({
  steps: Array.from({ length: STEP_ROWS }, blankStep),
  limits: Array.from({ length: LIMIT_ROWS }, blankLimit),
  retry: {
    cleanRunOverride: null,
    refusedStep: null,
    scope: '',
    maxRetries: null,
    // The workbook defaults this to No and says why beside it. Most providers
    // do not bill a rejected call. It is still a question, not an assumption.
    billed: 'No',
    peakTasks: null,
    tpmOverride: null,
  },
  stops: Array.from({ length: STEP_ROWS }, blankStop),
  answers: Array.from({ length: 10 }, () => '' as Answer),
  policy: { budget: '', retries: '', backoff: '', breaker: '', shed: '', degrade: '' },
});

// ---------------------------------------------------------------------------
// 1 · the workflow map
// ---------------------------------------------------------------------------

/** A row counts once it has a name. Everything else about it may be unknown. */
export const isNamed = (s: Step): boolean => s.name.trim() !== '';

export const stepTokens = (s: Step): number | null =>
  s.input === null || s.output === null ? null : s.input + s.output;

/** Running total, one entry per step. Null from the first step with a gap. */
export function cumulative(steps: Step[]): (number | null)[] {
  let running = 0;
  let broken = false;
  return steps.map((s) => {
    if (!isNamed(s)) return null;
    const t = stepTokens(s);
    if (t === null) broken = true;
    if (broken) return null;
    running += t as number;
    return running;
  });
}

/** Null until every named step carries both token figures. */
export function cleanRun(steps: Step[]): number | null {
  const named = steps.filter(isNamed);
  if (!named.length) return null;
  if (named.some((s) => stepTokens(s) === null)) return null;
  return named.reduce((total, s) => total + (stepTokens(s) as number), 0);
}

export const hasSideEffect = (s: Step): boolean =>
  s.sideEffect === 'Reversible' || s.sideEffect === 'Irreversible';

export const sideEffectCount = (steps: Step[]): number => steps.filter(hasSideEffect).length;

/** A side effect that a retry can run a second time. */
export const unsafeCount = (steps: Step[]): number =>
  steps.filter((s) => hasSideEffect(s) && s.idempotent === 'No').length;

// ---------------------------------------------------------------------------
// 2 · the limits
// ---------------------------------------------------------------------------

export const isSetLimit = (l: Limit): boolean => l.name.trim() !== '';

export const sharedLimits = (limits: Limit[]): number =>
  limits.filter((l) => isSetLimit(l) && l.scope === 'Shared across workflows').length;

/** Retried at once, or nobody knows. Both amplify a spike. */
export const riskyHandling = (limits: Limit[]): number =>
  limits.filter(
    (l) => isSetLimit(l) && (l.handling === 'Retry immediately' || l.handling === 'Unknown'),
  ).length;

/** The first limit measured in tokens per minute. The shared quota, usually. */
export function tokensPerMinute(limits: Limit[]): number | null {
  const found = limits.find(
    (l) => isSetLimit(l) && l.unit === 'tokens' && l.window === 'per minute' && l.value !== null,
  );
  return found ? (found.value as number) : null;
}

// ---------------------------------------------------------------------------
// 3 · the retry amplifier
// ---------------------------------------------------------------------------

/** The step index of the last checkpoint at or before `before`. -1 for none. */
export function lastCheckpointBefore(steps: Step[], before: number): number {
  let found = -1;
  for (let i = 0; i < before && i < steps.length; i += 1) {
    if (isNamed(steps[i]) && steps[i].checkpoint === 'Yes') found = i;
  }
  return found;
}

export interface Amplifier {
  cleanRun: number | null;
  repeated: number | null;
  worstSucceeds: number | null;
  worstGivesUp: number | null;
  amplification: number | null;
  peakNormal: number | null;
  peakWorst: number | null;
  quotaNormal: number | null;
  quotaWorst: number | null;
  tpm: number | null;
  verdict: Band | null;
  bandNormal: Band | null;
}

export type Band = 'Fits with headroom' | 'Tight: any spike tips it over' | 'Retries alone can exhaust the quota';

export const BANDS: Band[] = [
  'Fits with headroom',
  'Tight: any spike tips it over',
  'Retries alone can exhaust the quota',
];

/** Over 100% of the quota is the one that matters. 80% is the warning line. */
export function bandFor(fraction: number | null): Band | null {
  if (fraction === null) return null;
  if (fraction <= 0.8) return BANDS[0];
  if (fraction <= 1) return BANDS[1];
  return BANDS[2];
}

export function amplify(model: Model): Amplifier {
  const { steps, limits, retry } = model;
  const run = retry.cleanRunOverride ?? cleanRun(steps);
  const tpm = retry.tpmOverride ?? tokensPerMinute(limits);
  const cum = cumulative(steps);

  const empty: Amplifier = {
    cleanRun: run,
    repeated: null,
    worstSucceeds: null,
    worstGivesUp: null,
    amplification: null,
    peakNormal: run !== null && retry.peakTasks !== null ? retry.peakTasks * run : null,
    peakWorst: null,
    quotaNormal: null,
    quotaWorst: null,
    tpm,
    verdict: null,
    bandNormal: null,
  };
  empty.quotaNormal =
    empty.peakNormal !== null && tpm !== null && tpm > 0 ? empty.peakNormal / tpm : null;
  empty.bandNormal = bandFor(empty.quotaNormal);

  const step = retry.refusedStep;
  if (run === null || step === null || retry.scope === '' || retry.maxRetries === null) {
    return empty;
  }

  // What a failed attempt pays for twice. Three scopes, three answers.
  let repeated: number | null;
  if (retry.scope === 'Retry the call only') {
    repeated = 0;
  } else if (step <= 1) {
    // Refused on the first step: nothing ran before it, so nothing repeats.
    repeated = 0;
  } else {
    const before = cum[step - 2];
    if (before === null || before === undefined) return empty;
    if (retry.scope === 'Restart task') {
      repeated = before;
    } else {
      // Resume from last checkpoint: only the work since that checkpoint. With
      // no checkpoint there is nothing to resume from, so it is a restart.
      const cp = lastCheckpointBefore(steps, step - 1);
      const atCp = cp >= 0 ? cum[cp] : null;
      repeated = atCp === null ? before : before - atCp;
    }
  }

  // A refused call is usually not billed. When it is, its input tokens are
  // spent on every attempt that gets turned away.
  if (retry.billed === 'Yes') {
    const refused = steps[step - 1];
    if (!refused || refused.input === null) return empty;
    repeated += refused.input;
  }

  const worstSucceeds = retry.maxRetries * repeated + run;
  const worstGivesUp = (retry.maxRetries + 1) * repeated;
  const amplification = run > 0 ? Math.round((worstSucceeds / run) * 100) / 100 : null;

  const peakNormal = retry.peakTasks !== null ? retry.peakTasks * run : null;
  const peakWorst = retry.peakTasks !== null ? retry.peakTasks * worstSucceeds : null;
  const quotaNormal = peakNormal !== null && tpm !== null && tpm > 0 ? peakNormal / tpm : null;
  const quotaWorst = peakWorst !== null && tpm !== null && tpm > 0 ? peakWorst / tpm : null;

  return {
    cleanRun: run,
    repeated,
    worstSucceeds,
    worstGivesUp,
    amplification,
    peakNormal,
    peakWorst,
    quotaNormal,
    quotaWorst,
    tpm,
    verdict: bandFor(quotaWorst),
    bandNormal: bandFor(quotaNormal),
  };
}

export const PLANNING_NOTE =
  'This is a planning bound, not a forecast. It assumes every task hits the limit at the same step. Real traffic is messier; use it to see whether your retry design can take the whole system down.';

// ---------------------------------------------------------------------------
// 4 · the stop states
// ---------------------------------------------------------------------------

/** A step with a side effect, and no clean-up action or no named owner. */
export function missingStopPlans(steps: Step[], stops: StopState[]): number {
  return steps.reduce((count, step, i) => {
    if (!hasSideEffect(step)) return count;
    const stop = stops[i];
    if (!stop) return count + 1;
    return stop.cleanup.trim() === '' || stop.owner.trim() === '' ? count + 1 : count;
  }, 0);
}

// ---------------------------------------------------------------------------
// 5 · the decision
// ---------------------------------------------------------------------------

export interface Check {
  n: number;
  text: string;
  critical: boolean;
  /** Which reading from the sheet answers it, where one does. */
  evidence?: 'stops' | 'quota';
}

export const CHECKS: Check[] = [
  { n: 1, text: 'Every limit that can refuse the agent is listed, with its scope and owner.', critical: false },
  { n: 2, text: 'Retries back off with jitter and honour Retry-After.', critical: false },
  { n: 3, text: 'Retries are capped per call and per task.', critical: true },
  { n: 4, text: 'Retries resume from a checkpoint instead of restarting the task.', critical: false },
  { n: 5, text: 'The token budget belongs to the task, across all its attempts, not just to each call.', critical: true },
  { n: 6, text: "A shared quota is partitioned or prioritised, so one busy workflow can't starve the others.", critical: false },
  { n: 7, text: 'New work stops (circuit breaker) when the refusal rate crosses a set threshold.', critical: false },
  { n: 8, text: 'Every step with a side effect has a defined stop state, a clean-up action and an owner.', critical: true, evidence: 'stops' },
  { n: 9, text: 'Worst-case peak demand, with retries, fits within the quota.', critical: true, evidence: 'quota' },
  { n: 10, text: 'Budget exhaustion raises an alert that a named person owns.', critical: false },
];

export const MAX_SCORE = CHECKS.length * 2;
export const PASS_MARK = 16;

export const pointsFor = (a: Answer): number | null =>
  a === 'Yes' ? 2 : a === 'Partial' ? 1 : a === 'No' ? 0 : null;

export const answeredCount = (answers: Answer[]): number => answers.filter((a) => a !== '').length;

export const scoreOf = (answers: Answer[]): number =>
  answers.reduce((total, a) => total + (pointsFor(a) ?? 0), 0);

export const criticalFails = (answers: Answer[]): number =>
  CHECKS.filter((c, i) => c.critical && answers[i] === 'No').length;

export type Decision = 'Ready to scale' | 'Fix first' | 'Hold' | 'Not scored yet';

export const DECISION_LABEL: Record<Decision, string> = {
  Hold: "Don't scale this workflow yet.",
  'Fix first': 'Fix the checks answered No or Partial, then score it again.',
  'Ready to scale': 'The limit policy holds at peak. Scale it.',
  'Not scored yet': 'Answer all ten checks to get a decision.',
};

/**
 * One No on a critical check is a Hold, whatever the total.
 *
 * The order matters and it is the whole point of the tab: the critical rule is
 * tested BEFORE the score, so a strong total cannot cover a critical gap.
 */
export function decide(answers: Answer[]): Decision {
  if (answeredCount(answers) < CHECKS.length) return 'Not scored yet';
  if (criticalFails(answers) > 0) return 'Hold';
  return scoreOf(answers) >= PASS_MARK ? 'Ready to scale' : 'Fix first';
}

// ---------------------------------------------------------------------------
// The whole reading, in one object
// ---------------------------------------------------------------------------

export interface Assessment {
  namedSteps: number;
  cleanRun: number | null;
  sideEffects: number;
  unsafe: number;
  limitsSet: number;
  shared: number;
  risky: number;
  amp: Amplifier;
  missingStops: number;
  answered: number;
  score: number;
  critical: number;
  decision: Decision;
  /** What is still blank, in the order the page asks for it. */
  outstanding: string[];
  /** What the reader should do about what it found. */
  flags: string[];
}

export function readModel(model: Model): Assessment {
  const { steps, limits, stops, answers } = model;
  const amp = amplify(model);
  const namedSteps = steps.filter(isNamed).length;
  const limitsSet = limits.filter(isSetLimit).length;
  const missingStops = missingStopPlans(steps, stops);
  const unsafe = unsafeCount(steps);
  const shared = sharedLimits(limits);
  const risky = riskyHandling(limits);

  const outstanding: string[] = [];
  if (!namedSteps) outstanding.push('Name at least one step on the workflow map.');
  else if (amp.cleanRun === null) outstanding.push('Give every named step its input and output tokens.');
  if (!limitsSet) outstanding.push('List at least one limit that can refuse the agent.');
  if (amp.tpm === null) outstanding.push('Set a token-per-minute limit, on the limits list or as an override.');
  if (model.retry.refusedStep === null) outstanding.push('Pick the step most likely to be refused.');
  if (model.retry.scope === '') outstanding.push('Pick what a retry re-runs.');
  if (model.retry.maxRetries === null) outstanding.push('Set the maximum retries per task.');
  if (model.retry.peakTasks === null) outstanding.push('Set the peak tasks started per minute.');
  if (missingStops > 0)
    outstanding.push(
      `Give a clean-up action and an owner to ${missingStops} step${missingStops === 1 ? '' : 's'} with a side effect.`,
    );
  const unanswered = CHECKS.length - answeredCount(answers);
  if (unanswered > 0)
    outstanding.push(`Answer ${unanswered} more of the ten checks.`);

  const flags: string[] = [];
  if (unsafe > 0)
    flags.push(
      `${unsafe} step${unsafe === 1 ? '' : 's'} with a side effect ${unsafe === 1 ? 'is' : 'are'} not safe to run twice. A retry can repeat ${unsafe === 1 ? 'it' : 'them'}.`,
    );
  if (risky > 0)
    flags.push(
      `${risky} limit${risky === 1 ? ' is' : 's are'} retried immediately or not handled at all. That is the pattern that amplifies a spike.`,
    );
  if (shared > 0)
    flags.push(
      `${shared} limit${shared === 1 ? ' is' : 's are'} shared across workflows. One busy workflow can starve the others.`,
    );
  if (amp.verdict === BANDS[2])
    flags.push('Worst-case peak demand is over the quota. Retries alone can exhaust it.');
  else if (amp.verdict === BANDS[1])
    flags.push('Worst-case peak demand is over 80% of the quota. Any spike tips it over.');
  if (missingStops > 0)
    flags.push(
      `${missingStops} stop state${missingStops === 1 ? ' has' : 's have'} no clean-up plan. That is the one that reaches a customer.`,
    );

  return {
    namedSteps,
    cleanRun: amp.cleanRun,
    sideEffects: sideEffectCount(steps),
    unsafe,
    limitsSet,
    shared,
    risky,
    amp,
    missingStops,
    answered: answeredCount(answers),
    score: scoreOf(answers),
    critical: criticalFails(answers),
    decision: decide(answers),
    outstanding,
    flags,
  };
}

// ---------------------------------------------------------------------------
// The reference example — the workbook's tab 6
// ---------------------------------------------------------------------------

export const EXAMPLE_TITLE = 'A scheduling agent';
export const EXAMPLE_BANNER = 'Illustrative example. Not a real system or real figures.';
export const EXAMPLE_INTRO =
  'Six steps, two of them with side effects, run at peak against a token-per-minute quota shared with every other workflow on the same key. The room is held on step four, and step four is the one that gets refused.';

const exampleSteps: Step[] = [
  { name: 'Parse request', model: 'Yes', api: 'No', sideEffect: 'None', input: 1500, output: 300, idempotent: 'Yes', checkpoint: 'No' },
  { name: 'Read calendars', model: 'Yes', api: 'Yes', sideEffect: 'None', input: 6000, output: 800, idempotent: 'Yes', checkpoint: 'No' },
  { name: 'Propose slots', model: 'Yes', api: 'No', sideEffect: 'None', input: 7500, output: 600, idempotent: 'Yes', checkpoint: 'No' },
  { name: 'Hold room', model: 'Yes', api: 'Yes', sideEffect: 'Reversible', input: 8200, output: 200, idempotent: 'No', checkpoint: 'No' },
  { name: 'Send invites', model: 'Yes', api: 'Yes', sideEffect: 'Irreversible', input: 8500, output: 400, idempotent: 'No', checkpoint: 'No' },
  { name: 'Confirm to user', model: 'Yes', api: 'No', sideEffect: 'None', input: 9000, output: 300, idempotent: 'Yes', checkpoint: 'No' },
];

const exampleLimits: Limit[] = [
  { name: 'Model provider tokens per minute', scope: 'Shared across workflows', value: 10_000_000, unit: 'tokens', window: 'per minute', sharedWith: 'all agents on this API key', signal: 'HTTP 429 + Retry-After', handling: 'Retry with backoff', owner: 'Platform team' },
  { name: 'Model provider requests per minute', scope: 'Shared across workflows', value: 4000, unit: 'requests', window: 'per minute', sharedWith: 'all agents on this API key', signal: 'HTTP 429 + Retry-After', handling: 'Retry with backoff', owner: 'Platform team' },
  { name: 'Calendar API writes', scope: 'Per tenant', value: 600, unit: 'requests', window: 'per minute', sharedWith: 'scheduling agent only', signal: 'HTTP 429, no Retry-After', handling: 'Queue', owner: 'Workplace IT' },
  { name: 'Per-task token budget', scope: 'Per task', value: 120_000, unit: 'tokens', window: 'per request', sharedWith: 'not shared', signal: 'budget guard refuses the call', handling: 'Fail task', owner: 'Scheduling team' },
];

const exampleStops: StopState[] = Array.from({ length: STEP_ROWS }, blankStop);
exampleStops[3] = {
  left: 'Room held, no invites sent',
  userSees: 'Still booking…',
  cleanup: 'Release room hold after 15 min',
  auto: 'Automatic',
  owner: 'Platform team',
  resume: 'Yes',
  cost: 'Low',
};
exampleStops[4] = {
  left: 'Invites sent to some attendees',
  userSees: 'Attendees see a partial invite',
  cleanup: 'Send a cancellation to recipients and notify the organiser',
  auto: 'Automatic',
  owner: 'Platform team',
  resume: 'No',
  cost: 'High',
};

// Chosen so the score alone would read "Ready to scale" at 16 of 20, and the
// one critical No still forces Hold. That is the lesson of the example.
// Check 4 is No because the retry scope is "Restart task", and check 9 is No
// because the amplifier says retries alone can exhaust the quota.
const exampleAnswers: Answer[] = ['Yes', 'Yes', 'Yes', 'No', 'Yes', 'Yes', 'Yes', 'Yes', 'No', 'Yes'];

export const EXAMPLE: Model = {
  steps: [...exampleSteps, ...Array.from({ length: STEP_ROWS - exampleSteps.length }, blankStep)],
  limits: [...exampleLimits, ...Array.from({ length: LIMIT_ROWS - exampleLimits.length }, blankLimit)],
  retry: {
    cleanRunOverride: null,
    refusedStep: 4,
    scope: 'Restart task',
    maxRetries: 3,
    billed: 'No',
    peakTasks: 200,
    tpmOverride: null,
  },
  stops: exampleStops,
  answers: exampleAnswers,
  policy: {
    budget: '120,000 tokens across all attempts',
    retries: '2 per call, 3 per task',
    backoff: 'Base 1s, max 30s, jitter Yes',
    breaker: 'Stop new work above a 20% refusal rate over 60s',
    shed: 'Bulk re-scheduling, before single user requests',
    degrade: 'Queue for later; no smaller model, the slot maths needs this one',
  },
};

// ---------------------------------------------------------------------------
// The workbook's own figures, asserted
// ---------------------------------------------------------------------------
//
// tools/token-limit-framework/verify_sheet.py recalculates the .xlsx with two
// engines and asserts these same numbers. This is the page's half of the same
// check: it stops the tool and the workbook drifting apart, and it fails the
// first render rather than a deploy.

const EX = readModel(EXAMPLE);
const EXPECTED: [string, unknown, unknown][] = [
  ['tokens per clean run', EX.cleanRun, 43_300],
  ['tokens repeated per failed attempt', EX.amp.repeated, 16_700],
  ['worst case, eventually succeeds', EX.amp.worstSucceeds, 93_400],
  ['worst case, gives up', EX.amp.worstGivesUp, 66_800],
  ['amplification', EX.amp.amplification, 2.16],
  ['peak demand, normal', EX.amp.peakNormal, 8_660_000],
  ['peak demand, worst case', EX.amp.peakWorst, 18_680_000],
  ['unsafe steps', EX.unsafe, 2],
  ['stop states with no clean-up plan', EX.missingStops, 0],
  ['score', EX.score, 16],
  ['critical checks answered No', EX.critical, 1],
  ['decision', EX.decision, 'Hold'],
  ['verdict', EX.amp.verdict, BANDS[2]],
];
for (const [label, got, want] of EXPECTED) {
  if (got !== want) {
    throw new Error(`token limit framework: ${label} is ${String(got)}, the workbook produces ${String(want)}`);
  }
}

export const EXAMPLE_READING = EX;

// ---------------------------------------------------------------------------
// Page copy
// ---------------------------------------------------------------------------

export const RESOURCE_ID = 'token-limit-framework';
export const TITLE = 'Token Limit Framework';
export const TAGLINE =
  "Decide what your agent does when it's told no — before a traffic spike decides for you.";

export const WHAT_TO_BRING =
  'One agent workflow you run or plan to run, the steps it takes, rough token counts per step (from traces or an estimate), and the rate and token limits it runs under.';
export const WHAT_TO_DO =
  'Map the steps, list every limit that can refuse the agent, model retry amplification at peak, define a stop state for every step with a side effect, and score the ten checks.';
export const WHAT_YOU_LEAVE_WITH =
  'A token-limit policy for that workflow (per-task budget, retry rule, stop states with clean-up owners) and a decision: Ready to scale, Fix first, or Hold.';

export const WHY =
  'At Google, Sunil saw an outage pattern that began with every layer doing the sensible thing. External APIs handed calls to internal APIs. A sudden spike in traffic arrived, the internal APIs hit their rate limits, and callers retried. The retries landed on top of the spike and the whole system went down. Agents repeat this pattern with tokens: a retry that restarts the task pays again for steps that already succeeded, from a quota every other workflow shares.';

export const CLOSING = 'Stopping has a cost you can list. Not stopping has no ceiling.';

export const PUBLISHED_AT = '2026-09-27';
export const LICENCE_LINE = 'Content CC BY 4.0 · © The Living Craft';
export const XLSX_PATH = '/downloads/token-limit-framework.xlsx';
export const XLSX_SIZE = '27 KB';

export interface Part {
  n: string;
  id: string;
  title: string;
  question: string;
  asks: string;
  mistake: string;
}

export const PARTS: Part[] = [
  {
    n: '01',
    id: 'map',
    title: 'Map the steps',
    question: 'What does one run of this workflow cost, step by step?',
    asks: 'One row per step. What it sends, what it returns, whether it touches the outside world, whether it is safe to run twice, and whether anything is saved afterwards.',
    mistake:
      'Costing the task as one number. A single figure for the whole run cannot tell you what a retry from step four pays for again, and it hides the steps that have a side effect and are not safe to repeat.',
  },
  {
    n: '02',
    id: 'limits',
    title: 'List every limit that can refuse you',
    question: 'Which limits can refuse the agent, and who shares them?',
    asks: 'One row per limit, with its scope, its window, the signal it refuses with, what your code does today, and who owns it.',
    mistake:
      'Treating "the rate limit" as one thing. There are usually six or seven, they have different scopes, and the one that stops you is often shared with a workflow you do not own. A limit with no named owner is a limit nobody will raise.',
  },
  {
    n: '03',
    id: 'amplifier',
    title: 'Price the retries at peak',
    question: 'How far can retries amplify spend at peak?',
    asks: 'Which step gets refused, what a retry re-runs, how many times, and how many tasks start each minute. It returns the worst case as a share of the quota.',
    mistake:
      'Sizing the quota against normal demand. Retries arrive on top of the spike that caused them, so the number to check is the worst case, not the average. This step tells you whether your retry design alone can exhaust the pool.',
  },
  {
    n: '04',
    id: 'stops',
    title: 'Define what stopping leaves behind',
    question: "If the agent stops at each step, what's left behind and who cleans it up?",
    asks: 'For every step with a side effect: what state is left, what the user sees, what clears it up, whether that is automatic, and who owns it.',
    mistake:
      'Designing the stop and not the state. Stopping after a room is held and stopping after half the invites are sent are different problems, with different owners and different costs. A stop state with no named owner is the one that reaches a customer.',
  },
  {
    n: '05',
    id: 'decision',
    title: 'Score it, and decide',
    question: 'Is the limit policy good enough to scale?',
    asks: 'Ten checks, scored out of twenty. Four of them are critical. Checks eight and nine read their evidence from what you already filled in.',
    mistake:
      'Averaging. A good total with one critical gap is not a good policy. One No on a critical check is a Hold whatever the score, which is why the reference example scores sixteen out of twenty and still says do not scale.',
  },
];

export const POLICY_ROWS: { key: keyof Policy; label: string; note: string }[] = [
  { key: 'budget', label: 'Per-task token budget', note: 'Across every attempt, not per call.' },
  { key: 'retries', label: 'Max retries', note: 'Per call and per task.' },
  { key: 'backoff', label: 'Backoff', note: 'Base delay, max delay, jitter Yes/No.' },
  { key: 'breaker', label: 'Circuit-breaker threshold', note: 'The refusal rate at which new work stops.' },
  { key: 'shed', label: 'Shed first under pressure', note: 'Which work is refused first.' },
  { key: 'degrade', label: 'Degrade option', note: 'Smaller model, shorter context, or queue for later.' },
];

export const LIMIT_PROMPTS = [
  'model provider tokens per minute',
  'model provider requests per minute',
  'daily or monthly spend cap',
  'max context window',
  'downstream API rate limit (e.g. calendar)',
  'your own per-task budget',
  'per-user or per-tenant budget',
];

/** Thousands separators, fixed. Not the reader's locale, and not lakhs. */
export const num = (n: number): string => n.toLocaleString('en-GB');
export const pct = (n: number): string => `${Math.round(n * 1000) / 10}%`;
