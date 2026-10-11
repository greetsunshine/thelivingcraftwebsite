/**
 * The Gate Routing Map: every rule and every count, in one place.
 *
 * Read by /resources/gate-routing-map (it prints the worked example's figures
 * from here rather than from a literal), by src/lib/gateRouting.test.ts, and
 * by tools/gate-routing-map/ (dump_content.ts hands these figures to the
 * workbook verifier, which asserts the spreadsheet's own formulas agree).
 * One implementation, three readers.
 *
 * The workbook cannot import this, so its formulas restate each rule. Every
 * function below says which cell formula it mirrors. If you change a rule here,
 * change the formula in tools/gate-routing-map/build_xlsx.py too, then run
 * verify_xlsx.py: it fails until the two agree.
 *
 * A blank is unknown, not a default. A row with no route is "unrouted", not
 * Track; a Block case whose determinism is not recorded needs the minimum
 * number of trials, the same as a non-deterministic one.
 */

// ── the dropdown options ─────────────────────────────────────────────────────

export const PURPOSES = ['Regression', 'Capability'] as const;
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const ACTORS = [
  'User directly',
  'Another system in our pipeline',
  'Another system with its own pipeline',
] as const;
export const YES_NO = ['Yes', 'No'] as const;
export const ANSWERS = ['Yes', 'Partial', 'No'] as const;
export const ROUTES = ['Block', 'Human decides', 'Check downstream', 'Track'] as const;

export type Purpose = (typeof PURPOSES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type Actor = (typeof ACTORS)[number];
export type YesNo = (typeof YES_NO)[number];
export type Answer = (typeof ANSWERS)[number];
export type Route = (typeof ROUTES)[number];

/** Input rows on each working tab. Tab 2 mirrors Tab 1 row for row. */
export const ROWS = 20;
/** The default for "Minimum trials for non-deterministic Block cases" on Tab 2. */
export const DEFAULT_MIN_TRIALS = 3;

// ── tab 1 · gate inventory ───────────────────────────────────────────────────

export interface GateCase {
  name: string;
  checks: string;
  purpose: Purpose | '';
  severity: Severity | '';
  actor: Actor | '';
  checkDecides: YesNo | '';
  deterministic: YesNo | '';
  /** The reader's override. Blank means "use the suggestion". */
  chosen: Route | '';
  reason: string;
}

/**
 * The suggested route, column I. Blank when the case has no name or any of
 * purpose, severity, actor or "can a check decide it" is blank. The order is
 * the brief's, and it matters: a Capability case is Track even when it is
 * Critical, and a case another pipeline acts on is Check downstream even when
 * a check could decide it.
 */
export function suggestedRoute(c: GateCase): Route | '' {
  if (c.name === '' || c.purpose === '' || c.severity === '' || c.actor === '' || c.checkDecides === '') return '';
  if (c.purpose === 'Capability') return 'Track';
  if (c.actor === 'Another system with its own pipeline') return 'Check downstream';
  if (c.severity === 'Low') return 'Track';
  if (c.checkDecides === 'No') return 'Human decides';
  return 'Block';
}

/** Column K: the override if there is one, else the suggestion. Mirrors =IF(J<>"",J,I). */
export const finalRoute = (c: GateCase): Route | '' => (c.chosen !== '' ? c.chosen : suggestedRoute(c));

/** Column L: an override that differs from the suggestion, including one on a row with no suggestion. */
export const differs = (c: GateCase): boolean => c.chosen !== '' && c.chosen !== suggestedRoute(c);

// No trim: the workbook tests a cell with ="", and a cell holding a space is not "".
const named = (c: GateCase) => c.name !== '';

export interface InventorySummary {
  listed: number;
  byRoute: Record<Route, number>;
  suggested: Record<Route, number>;
  /** Named and with no final route. */
  unrouted: number;
  overrides: number;
  overridesNoReason: number;
}

export function inventorySummary(rows: GateCase[]): InventorySummary {
  const count = (pick: (c: GateCase) => Route | '') =>
    Object.fromEntries(ROUTES.map((r) => [r, rows.filter((c) => pick(c) === r).length])) as Record<Route, number>;
  return {
    listed: rows.filter(named).length,
    byRoute: count(finalRoute),
    suggested: count(suggestedRoute),
    unrouted: rows.filter((c) => named(c) && finalRoute(c) === '').length,
    overrides: rows.filter(differs).length,
    overridesNoReason: rows.filter((c) => differs(c) && c.reason === '').length,
  };
}

// ── tab 2 · route requirements ───────────────────────────────────────────────

export interface Requirements {
  // Block
  trials: number | null;
  mustPass: number | null;
  // Human decides
  owner: string;
  backup: string;
  haltCriteria: YesNo | '';
  // Check downstream
  system: string;
  team: string;
  contract: Answer | '';
  verifies: YesNo | '';
  switchTogether: YesNo | '';
  halter: string;
  // Track
  trackOwner: string;
}

export const EMPTY_REQUIREMENTS: Requirements = {
  trials: null,
  mustPass: null,
  owner: '',
  backup: '',
  haltCriteria: '',
  system: '',
  team: '',
  contract: '',
  verifies: '',
  switchTogether: '',
  halter: '',
  trackOwner: '',
};

/** Which Tab 2 fields belong to which route. The workbook greys out the rest of the row. */
export const ROUTE_FIELDS: Record<Route, (keyof Requirements)[]> = {
  Block: ['trials', 'mustPass'],
  'Human decides': ['owner', 'backup', 'haltCriteria'],
  'Check downstream': ['system', 'team', 'contract', 'verifies', 'switchTogether', 'halter'],
  Track: ['trackOwner'],
};

/**
 * The reasons a route is not ready, in the order the workbook checks them.
 * "Why not ready" names the first one that applies.
 */
export const WHY = {
  noTrials: 'No trials set',
  mustPassBlank: 'Trials that must pass not set',
  mustPassLower: 'Trials that must pass is lower than trials',
  mustPassHigher: 'Trials that must pass is more than trials',
  belowMinimum: 'Fewer trials than the minimum for non-deterministic cases',
  noOwner: 'No owner',
  noHalt: 'No halt criteria',
  noSystem: 'No downstream system named',
  noTeam: 'No team named for its pipeline',
  noContract: 'No output contract',
  partialContract: 'Output contract only partial',
  notVerified: 'Contract not verified before deploy',
  noSwitch: 'Cannot switch on together',
  noHalter: 'Nobody named who can halt',
} as const;

export interface Readiness {
  /** Null when the row has no final route. */
  ready: boolean | null;
  /** The first missing item, or '' when ready or unrouted. */
  why: string;
}

const filled = (s: string) => s !== '';

/** Columns Q and R of Tab 2. */
export function routeReadiness(
  route: Route | '',
  deterministic: YesNo | '',
  r: Requirements,
  minTrials: number,
): Readiness {
  const fail = (why: string): Readiness => ({ ready: false, why });
  switch (route) {
    case '':
      return { ready: null, why: '' };
    case 'Block': {
      if (r.trials === null || r.trials < 1) return fail(WHY.noTrials);
      if (r.mustPass === null) return fail(WHY.mustPassBlank);
      if (r.mustPass < r.trials) return fail(WHY.mustPassLower);
      if (r.mustPass > r.trials) return fail(WHY.mustPassHigher);
      // Determinism left blank is treated as No: one green run proves nothing
      // about an agent nobody has shown to be deterministic.
      if (deterministic !== 'Yes' && r.trials < minTrials) return fail(WHY.belowMinimum);
      return { ready: true, why: '' };
    }
    case 'Human decides':
      // The backup owner is scored by check 6, not here (the brief, Tab 2).
      if (!filled(r.owner)) return fail(WHY.noOwner);
      if (r.haltCriteria !== 'Yes') return fail(WHY.noHalt);
      return { ready: true, why: '' };
    case 'Check downstream':
      if (!filled(r.system)) return fail(WHY.noSystem);
      if (!filled(r.team)) return fail(WHY.noTeam);
      if (r.contract === 'Partial') return fail(WHY.partialContract);
      if (r.contract !== 'Yes') return fail(WHY.noContract);
      if (r.verifies !== 'Yes') return fail(WHY.notVerified);
      if (r.switchTogether !== 'Yes') return fail(WHY.noSwitch);
      if (!filled(r.halter)) return fail(WHY.noHalter);
      return { ready: true, why: '' };
    case 'Track':
      if (!filled(r.trackOwner)) return fail(WHY.noOwner);
      return { ready: true, why: '' };
  }
}

export interface RequirementsSummary {
  cases: Record<Route, number>;
  ready: Record<Route, number>;
  notReady: number;
  blockNotReady: number;
  humanNotReady: number;
  humanNoBackup: number;
  /** Check downstream rows where the contract is not Yes or the downstream side does not verify it. */
  downstreamUnverified: number;
}

/** `reqs[i]` belongs to `cases[i]`: Tab 2 links to Tab 1 by row number. */
export function requirementsSummary(cases: GateCase[], reqs: Requirements[], minTrials: number): RequirementsSummary {
  const rows = cases.map((c, i) => {
    const route = finalRoute(c);
    const req = reqs[i] ?? EMPTY_REQUIREMENTS;
    return { route, req, ready: routeReadiness(route, c.deterministic, req, minTrials).ready };
  });
  const per = (pick: (r: (typeof rows)[number], route: Route) => boolean) =>
    Object.fromEntries(ROUTES.map((route) => [route, rows.filter((r) => pick(r, route)).length])) as Record<Route, number>;
  const notReadyOn = (route: Route) => rows.filter((r) => r.route === route && r.ready === false).length;
  return {
    cases: per((r, route) => r.route === route),
    ready: per((r, route) => r.route === route && r.ready === true),
    notReady: rows.filter((r) => r.ready === false).length,
    blockNotReady: notReadyOn('Block'),
    humanNotReady: notReadyOn('Human decides'),
    humanNoBackup: rows.filter((r) => r.route === 'Human decides' && !filled(r.req.backup)).length,
    downstreamUnverified: rows.filter(
      (r) => r.route === 'Check downstream' && (r.req.contract !== 'Yes' || r.req.verifies !== 'Yes'),
    ).length,
  };
}

// ── tab 3 · the ten checks ───────────────────────────────────────────────────

/** Which figure from Tab 1 or Tab 2 sits beside a check, so it is answered from evidence. */
export type Evidence =
  | 'unrouted'
  | 'overridesNoReason'
  | 'blockNotReady'
  | 'humanNotReady'
  | 'humanNoBackup'
  | 'downstreamUnverified';

export interface Check {
  n: number;
  text: string;
  critical: boolean;
  evidence?: Evidence;
}

export const CHECKS: Check[] = [
  { n: 1, critical: true, evidence: 'unrouted', text: 'Every gate case has a route.' },
  { n: 2, critical: false, evidence: 'overridesNoReason', text: 'Every route that differs from the suggestion has a written reason.' },
  { n: 3, critical: true, evidence: 'blockNotReady', text: 'Block cases on non-deterministic behaviour run several trials and require every trial to pass.' },
  { n: 4, critical: false, text: 'Capability cases are tracked, not used to block a release.' },
  { n: 5, critical: true, evidence: 'humanNotReady', text: 'Every Human decides case has a named owner and halt criteria written before the release.' },
  { n: 6, critical: false, evidence: 'humanNoBackup', text: 'Every Human decides case has a backup owner, so a release never waits on one person.' },
  { n: 7, critical: false, text: 'Every Check downstream case names the system that acts on the output and the team that owns its pipeline.' },
  { n: 8, critical: true, evidence: 'downstreamUnverified', text: 'The agent’s output has a contract that the downstream system verifies before either side deploys.' },
  { n: 9, critical: false, text: 'New agent behaviour can be switched on together with the downstream system, and switched off without a redeploy.' },
  { n: 10, critical: false, text: 'Changes to the agent’s output are made in expand-then-contract steps, so the old and new shapes work side by side until the downstream system has moved.' },
];

export const POINTS: Record<Answer, number> = { Yes: 2, Partial: 1, No: 0 };
export const STATUS: Record<Answer, 'Pass' | 'Partial' | 'Fail'> = { Yes: 'Pass', Partial: 'Partial', No: 'Fail' };
export const MAX_TOTAL = CHECKS.length * 2;
/** A total at or above this, with no critical check answered No or Partial, is Ready. */
export const READY_AT = 16;
export const NO_OPEN_ITEMS = 'No open items.';

export type Decision = 'Ready' | 'Fix first' | 'Hold';

export const DECISION_MEANING: Record<Decision, string> = {
  Hold: 'Don’t let this gate decide releases yet.',
  'Fix first': 'No critical check is answered No, but the total is under 16 or a critical check is only Partial.',
  Ready: 'Every critical check is answered Yes, and the total is 16 or more.',
};

export interface ChecklistResult {
  total: number;
  answered: number;
  /** Numbers of the critical checks answered No, in check order. */
  criticalNo: number[];
  /**
   * Null while the outcome is still open: no critical No yet, and a check left
   * unanswered. A critical No settles it as Hold however many are blank.
   */
  decision: Decision | null;
  /**
   * The text under "Your next step": the first critical No, else the first No,
   * else the first critical Partial, else the first Partial. NO_OPEN_ITEMS once
   * all ten are answered and none is open; '' while checks are still blank.
   */
  nextStep: string;
  /** The check `nextStep` names, or null. */
  nextCheck: Check | null;
}

/**
 * The workbook does this with a hidden priority column: 1 critical No, 2 No,
 * 3 critical Partial, 4 Partial, 9 nothing to do. The next step is the first
 * row holding the smallest number.
 */
export const priority = (c: Check, a: Answer | ''): number =>
  a === 'No' ? (c.critical ? 1 : 2) : a === 'Partial' ? (c.critical ? 3 : 4) : 9;

/** `answers[i]` is the answer to check i + 1; '' is unanswered. */
export function checklistResult(answers: (Answer | '')[]): ChecklistResult {
  if (answers.length !== CHECKS.length) throw new Error(`expected ${CHECKS.length} answers, got ${answers.length}`);
  const total = answers.reduce((s, a) => s + (a === '' ? 0 : POINTS[a]), 0);
  const answered = answers.filter((a) => a !== '').length;
  const criticalNo = CHECKS.filter((c, i) => c.critical && answers[i] === 'No').map((c) => c.n);
  const criticalPartial = CHECKS.some((c, i) => c.critical && answers[i] === 'Partial');

  let decision: Decision | null;
  if (criticalNo.length) decision = 'Hold';
  else if (answered < CHECKS.length) decision = null;
  else decision = total >= READY_AT && !criticalPartial ? 'Ready' : 'Fix first';

  let nextCheck: Check | null = null;
  let best = 9;
  CHECKS.forEach((c, i) => {
    const p = priority(c, answers[i]);
    if (p < best) {
      best = p;
      nextCheck = c;
    }
  });
  const found = nextCheck as Check | null;
  const nextStep = found ? found.text : answered === CHECKS.length ? NO_OPEN_ITEMS : '';
  return { total, answered, criticalNo, decision, nextStep, nextCheck: found };
}
