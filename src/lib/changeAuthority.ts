/**
 * The Change Authority Review: every rule and every count, in one place.
 *
 * Read by /resources/change-authority-review (it prints the worked example's
 * figures from here rather than from a literal), by
 * src/lib/changeAuthority.test.ts, and by tools/change-authority-review/
 * (dump_content.ts hands these figures to the workbook verifier, which asserts
 * the spreadsheet's own formulas agree). One implementation, three readers.
 *
 * The workbook cannot import this, so its formulas restate each rule. Every
 * function below says which cell formula it mirrors. If you change a rule here,
 * change the formula in tools/change-authority-review/build_xlsx.py too, then
 * run verify_xlsx.py: it fails until the two agree.
 *
 * A blank is unknown, not a default. A row with no authority is "no
 * authority", not Agent acts; an undo nobody recorded as tested is untested.
 *
 * Named "Change Authority Review" and not "Authority Review", as the brief had
 * it, because /resources/agent-authority-review already exists and answers a
 * different question (which workflow steps an agent may own at all). Sunil
 * chose the name on 17 October 2026.
 */

// ── the dropdown options ─────────────────────────────────────────────────────

export const UNDO = ['Yes', 'Partly', 'No'] as const;
export const SEEN_BY = ['Nobody', 'The user only', 'Other people', 'Another system'] as const;
export const YES_NO = ['Yes', 'No'] as const;
export const ANSWERS = ['Yes', 'Partial', 'No'] as const;
export const ON_REFUSAL = ['Changes nothing', 'Revises and asks again', 'Proceeds anyway', 'Not decided'] as const;
export const AUTHORITIES = ['Agent acts', 'Preview and consent', 'Not allowed'] as const;

export type Undo = (typeof UNDO)[number];
export type SeenBy = (typeof SEEN_BY)[number];
export type YesNo = (typeof YES_NO)[number];
export type Answer = (typeof ANSWERS)[number];
export type OnRefusal = (typeof ON_REFUSAL)[number];
export type Authority = (typeof AUTHORITIES)[number];

/** The two answers to "if consent is refused" that leave the user safe. */
export const SAFE_ON_REFUSAL: readonly OnRefusal[] = ['Changes nothing', 'Revises and asks again'];

/** Input rows on each working tab. Tab 2 mirrors Tab 1 row for row. */
export const ROWS = 20;

// ── tab 1 · action inventory ─────────────────────────────────────────────────

export interface Action {
  name: string;
  changes: string;
  undo: Undo | '';
  seenBy: SeenBy | '';
  tested: YesNo | '';
  /** The reader's override. Blank means "use the suggestion". */
  chosen: Authority | '';
  reason: string;
}

/**
 * The suggested authority, column G. Blank when the action has no name or
 * either reversibility answer is blank. "Not allowed" is never suggested: only
 * the reader knows whether the agent needs the action.
 */
export function suggestedAuthority(a: Action): Authority | '' {
  if (a.name === '' || a.undo === '' || a.seenBy === '') return '';
  if (a.undo === 'Yes' && (a.seenBy === 'Nobody' || a.seenBy === 'The user only')) return 'Agent acts';
  return 'Preview and consent';
}

/** Column I: the override if there is one, else the suggestion. Mirrors =IF(H<>"",H,G). */
export const finalAuthority = (a: Action): Authority | '' => (a.chosen !== '' ? a.chosen : suggestedAuthority(a));

/** Column J: an override that differs from the suggestion, including one on a row with no suggestion. */
export const differs = (a: Action): boolean => a.chosen !== '' && a.chosen !== suggestedAuthority(a);

// No trim: the workbook tests a cell with ="", and a cell holding a space is not "".
const named = (a: Action) => a.name !== '';

export interface InventorySummary {
  listed: number;
  byAuthority: Record<Authority, number>;
  suggested: Record<Authority, number>;
  /** Named and with no final authority. */
  noAuthority: number;
  /** Named and with "Undo tested?" anything but Yes, blank included. */
  undoNotTested: number;
  overrides: number;
  overridesNoReason: number;
  /** Suggested Preview and consent, final Agent acts: consent an override took away. */
  consentRemoved: number;
}

export function inventorySummary(rows: Action[]): InventorySummary {
  const count = (pick: (a: Action) => Authority | '') =>
    Object.fromEntries(AUTHORITIES.map((x) => [x, rows.filter((a) => pick(a) === x).length])) as Record<
      Authority,
      number
    >;
  return {
    listed: rows.filter(named).length,
    byAuthority: count(finalAuthority),
    suggested: count(suggestedAuthority),
    noAuthority: rows.filter((a) => named(a) && finalAuthority(a) === '').length,
    undoNotTested: rows.filter((a) => named(a) && a.tested !== 'Yes').length,
    overrides: rows.filter(differs).length,
    overridesNoReason: rows.filter((a) => differs(a) && a.reason === '').length,
    consentRemoved: rows.filter(
      (a) => suggestedAuthority(a) === 'Preview and consent' && finalAuthority(a) === 'Agent acts',
    ).length,
  };
}

// ── tab 2 · authority requirements ───────────────────────────────────────────

export interface Requirements {
  // Agent acts
  undoPath: string;
  // Preview and consent
  fullChange: Answer | '';
  saysIrreversible: YesNo | '';
  consenter: string;
  perChange: YesNo | '';
  actsAs: YesNo | '';
  onRefusal: OnRefusal | '';
  // Not allowed
  accessRemoved: YesNo | '';
}

export const EMPTY_REQUIREMENTS: Requirements = {
  undoPath: '',
  fullChange: '',
  saysIrreversible: '',
  consenter: '',
  perChange: '',
  actsAs: '',
  onRefusal: '',
  accessRemoved: '',
};

/** Which Tab 2 fields belong to which authority. The workbook greys out the rest of the row. */
export const AUTHORITY_FIELDS: Record<Authority, (keyof Requirements)[]> = {
  'Agent acts': ['undoPath'],
  'Preview and consent': ['fullChange', 'saysIrreversible', 'consenter', 'perChange', 'actsAs', 'onRefusal'],
  'Not allowed': ['accessRemoved'],
};

/**
 * The reasons an authority is not ready, in the order the workbook checks them.
 * "Why not ready" names the first one that applies. Words from the brief.
 */
export const WHY = {
  noUndoPath: 'No undo path',
  undoNotTested: 'Undo not tested',
  previewPartial: 'Preview doesn’t show the full change',
  previewHidesIrreversible: 'Preview doesn’t say what can’t be undone',
  noConsenter: 'No named person gives consent',
  standingConsent: 'Consent is a standing default, not per change',
  notActingAs: 'Agent doesn’t act as the consenting person',
  unsafeRefusal: 'No safe outcome when consent is refused',
  accessPresent: 'Access not removed',
} as const;

export interface Readiness {
  /** Null when the row has no final authority. */
  ready: boolean | null;
  /** The first missing item, or '' when ready or when there is no authority. */
  why: string;
}

const filled = (s: string) => s !== '';

/** Columns M and N of Tab 2. `tested` is the row's "Undo tested?" from Tab 1. */
export function authorityReadiness(authority: Authority | '', tested: YesNo | '', r: Requirements): Readiness {
  const fail = (why: string): Readiness => ({ ready: false, why });
  switch (authority) {
    case '':
      return { ready: null, why: '' };
    case 'Agent acts':
      if (!filled(r.undoPath)) return fail(WHY.noUndoPath);
      if (tested !== 'Yes') return fail(WHY.undoNotTested);
      return { ready: true, why: '' };
    case 'Preview and consent':
      if (r.fullChange !== 'Yes') return fail(WHY.previewPartial);
      if (r.saysIrreversible !== 'Yes') return fail(WHY.previewHidesIrreversible);
      if (!filled(r.consenter)) return fail(WHY.noConsenter);
      if (r.perChange !== 'Yes') return fail(WHY.standingConsent);
      if (r.actsAs !== 'Yes') return fail(WHY.notActingAs);
      if (r.onRefusal === '' || !SAFE_ON_REFUSAL.includes(r.onRefusal)) return fail(WHY.unsafeRefusal);
      return { ready: true, why: '' };
    case 'Not allowed':
      if (r.accessRemoved !== 'Yes') return fail(WHY.accessPresent);
      return { ready: true, why: '' };
  }
}

export interface RequirementsSummary {
  actions: Record<Authority, number>;
  ready: Record<Authority, number>;
  notReady: number;
  /** Preview and consent rows where the full change or the irreversible part is not shown. */
  previewHides: number;
  /** Preview and consent rows where consent is not per change, or nobody is named. */
  consentWeak: number;
  /** Preview and consent rows where the agent does not act as the consenting person. */
  notActingAs: number;
  /** Preview and consent rows where a refusal does not leave the user safe, blank included. */
  unsafeRefusal: number;
  /** Not allowed rows where the access is still there. */
  accessPresent: number;
}

/** `reqs[i]` belongs to `actions[i]`: Tab 2 links to Tab 1 by row number. */
export function requirementsSummary(actions: Action[], reqs: Requirements[]): RequirementsSummary {
  const rows = actions.map((a, i) => {
    const authority = finalAuthority(a);
    const req = reqs[i] ?? EMPTY_REQUIREMENTS;
    return { authority, req, ready: authorityReadiness(authority, a.tested, req).ready };
  });
  const per = (pick: (r: (typeof rows)[number], x: Authority) => boolean) =>
    Object.fromEntries(AUTHORITIES.map((x) => [x, rows.filter((r) => pick(r, x)).length])) as Record<
      Authority,
      number
    >;
  const consent = rows.filter((r) => r.authority === 'Preview and consent');
  return {
    actions: per((r, x) => r.authority === x),
    ready: per((r, x) => r.authority === x && r.ready === true),
    notReady: rows.filter((r) => r.ready === false).length,
    previewHides: consent.filter((r) => r.req.fullChange !== 'Yes' || r.req.saysIrreversible !== 'Yes').length,
    consentWeak: consent.filter((r) => r.req.perChange !== 'Yes' || !filled(r.req.consenter)).length,
    notActingAs: consent.filter((r) => r.req.actsAs !== 'Yes').length,
    unsafeRefusal: consent.filter((r) => r.req.onRefusal === '' || !SAFE_ON_REFUSAL.includes(r.req.onRefusal))
      .length,
    accessPresent: rows.filter((r) => r.authority === 'Not allowed' && r.req.accessRemoved !== 'Yes').length,
  };
}

// ── tab 3 · the ten checks ───────────────────────────────────────────────────

/** Which figure from Tab 1 or Tab 2 sits beside a check, so it is answered from evidence. */
export type Evidence =
  | 'listed'
  | 'noAuthority'
  | 'undoNotTested'
  | 'consentRemoved'
  | 'previewHides'
  | 'consentWeak'
  | 'notActingAs'
  | 'unsafeRefusal'
  | 'overridesNoReason'
  | 'accessPresent';

export interface Check {
  n: number;
  text: string;
  critical: boolean;
  evidence: Evidence[];
}

export const CHECKS: Check[] = [
  {
    n: 1,
    critical: true,
    evidence: ['listed', 'noAuthority'],
    text: 'Every action the agent can take is listed, including saving and restoring versions, sending, publishing and external calls.',
  },
  { n: 2, critical: false, evidence: ['undoNotTested'], text: 'Each action’s undo was tested, not assumed.' },
  {
    n: 3,
    critical: true,
    evidence: ['consentRemoved'],
    text: 'Every action that can’t be fully undone, or whose result others see, requires preview and consent.',
  },
  {
    n: 4,
    critical: true,
    evidence: ['previewHides'],
    text: 'Every preview shows the full change and says what can’t be undone.',
  },
  {
    n: 5,
    critical: true,
    evidence: ['consentWeak'],
    text: 'Consent is given per change by a named person, not by a standing default.',
  },
  {
    n: 6,
    critical: false,
    evidence: ['notActingAs'],
    text: 'The agent acts as the person who consented, and the log records who approved each change.',
  },
  {
    n: 7,
    critical: false,
    evidence: ['unsafeRefusal'],
    text: 'If consent is refused, the agent changes nothing, or revises and asks again.',
  },
  {
    n: 8,
    critical: false,
    evidence: ['overridesNoReason'],
    text: 'Every override of the suggested authority has a written reason.',
  },
  {
    n: 9,
    critical: false,
    evidence: ['accessPresent'],
    text: 'The agent’s access is no wider than the actions it needs; access for Not allowed actions has been removed.',
  },
  {
    n: 10,
    critical: false,
    evidence: [],
    text: 'A named owner re-runs this review whenever the agent gains a new action or tool.',
  },
];

export const POINTS: Record<Answer, number> = { Yes: 2, Partial: 1, No: 0 };
export const STATUS: Record<Answer, 'Pass' | 'Partial' | 'Fail'> = { Yes: 'Pass', Partial: 'Partial', No: 'Fail' };
export const MAX_TOTAL = CHECKS.length * 2;
/** A total at or above this, with no critical check answered No or Partial, is Ready. */
export const READY_AT = 16;
export const NO_OPEN_ITEMS = 'No open items.';

export type Decision = 'Ready' | 'Fix first' | 'Hold';

export const DECISION_MEANING: Record<Decision, string> = {
  Hold: 'Don’t let this agent act for real users yet.',
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

  let found: Check | null = null;
  let best = 9;
  CHECKS.forEach((c, i) => {
    const p = priority(c, answers[i]);
    if (p < best) {
      best = p;
      found = c;
    }
  });
  const nextCheck = found as Check | null;
  const nextStep = nextCheck ? nextCheck.text : answered === CHECKS.length ? NO_OPEN_ITEMS : '';
  return { total, answered, criticalNo, decision, nextStep, nextCheck };
}
