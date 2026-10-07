/**
 * The Citation Fit Check: every rule and every count, in one place.
 *
 * Read by /resources/citation-fit-check (it prints the worked example's
 * figures from here rather than from a literal), by src/lib/citationFit.test.ts,
 * and by tools/citation-fit-check/ (dump_content.ts hands these figures to the
 * workbook verifier, which asserts the spreadsheet's own formulas agree).
 * One implementation, three readers.
 *
 * The workbook cannot import this, so its formulas restate each rule. Every
 * function below says which cell formula it mirrors. If you change a rule here,
 * change the formula in tools/citation-fit-check/build_xlsx.py too, then run
 * verify_xlsx.py: it fails until the two agree.
 *
 * A blank is unknown, not zero. A ratio with nothing under it is null, never
 * 0%: "condition recall 0%" and "nobody measured it" are different findings.
 */

// ── the dropdown options ─────────────────────────────────────────────────────
// The workbook writes these into a hidden column and points each dropdown at
// that range. An inline list cannot hold "Same document, other section": its
// comma is the inline list's own separator, and the option would split in two.

export const CONDITION_TYPES = ['Tenure', 'Location', 'Role or grade', 'Plan or tier', 'Date or version', 'Other'] as const;
export const CONDITION_LIVES = [
  'Same passage',
  'Same document, other section',
  'Other document',
  'System of record only',
] as const;
export const FACT_SOURCES = ['Asks the user', 'User profile or HR system', 'Not available'] as const;
export const YES_NO = ['Yes', 'No'] as const;
export const ANSWERS = ['Yes', 'Partial', 'No'] as const;
export const EXPECTED_BEHAVIOURS = [
  'Answer no',
  'Answer conditionally',
  'Ask for the missing fact',
  'Route to a human',
] as const;

export type ConditionType = (typeof CONDITION_TYPES)[number];
export type ConditionLives = (typeof CONDITION_LIVES)[number];
export type FactSource = (typeof FACT_SOURCES)[number];
export type YesNo = (typeof YES_NO)[number];
export type Answer = (typeof ANSWERS)[number];
export type ExpectedBehaviour = (typeof EXPECTED_BEHAVIOURS)[number];

/** Row counts on each working tab. The workbook leaves exactly this many input rows. */
export const ROWS = { conditionMap: 15, spotCheck: 10, testCases: 15 } as const;

// ── tab 1 · condition map ────────────────────────────────────────────────────

export interface ConditionRow {
  rule: string;
  source: string;
  condition: string;
  conditionType: ConditionType | '';
  lives: ConditionLives | '';
  askerFact: string;
  factSource: FactSource | '';
}

export interface ConditionMapSummary {
  /** Rows with a rule. Mirrors COUNTA over the Rule column. */
  rulesMapped: number;
  /** Rows whose condition is not in the rule's own passage. Mirrors COUNTA(lives) − COUNTIF(lives,"Same passage"). */
  storedAway: number;
  /** Rows where the assistant has no way to learn the fact. Mirrors COUNTIF(source,"Not available"). */
  cannotCheck: number;
}

export function conditionMapSummary(rows: ConditionRow[]): ConditionMapSummary {
  return {
    rulesMapped: rows.filter((r) => r.rule.trim() !== '').length,
    storedAway: rows.filter((r) => r.lives !== '' && r.lives !== 'Same passage').length,
    cannotCheck: rows.filter((r) => r.factSource === 'Not available').length,
  };
}

// ── tab 2 · spot check ───────────────────────────────────────────────────────

export interface SpotRow {
  question: string;
  askerFacts: string;
  ruleRetrieved: YesNo | '';
  conditionRetrieved: YesNo | '';
  correctForAsker: YesNo | '';
  cited: YesNo | '';
}

export interface SpotCheckSummary {
  /** Rule and condition both retrieved, over rule retrieved. Null when no rule was retrieved. */
  conditionRecall: number | null;
  /** Cited a source and wrong for the asker: answers a reader would trust and act on. */
  citedButWrong: number;
  /** Correct for the asker, over rows where correctness was recorded. Null when none was. */
  accuracy: number | null;
}

export function spotCheckSummary(rows: SpotRow[]): SpotCheckSummary {
  const ruleYes = rows.filter((r) => r.ruleRetrieved === 'Yes');
  const both = ruleYes.filter((r) => r.conditionRetrieved === 'Yes');
  const recorded = rows.filter((r) => r.correctForAsker !== '');
  return {
    conditionRecall: ruleYes.length ? both.length / ruleYes.length : null,
    citedButWrong: rows.filter((r) => r.cited === 'Yes' && r.correctForAsker === 'No').length,
    accuracy: recorded.length ? recorded.filter((r) => r.correctForAsker === 'Yes').length / recorded.length : null,
  };
}

// ── tab 3 · the twelve checks ────────────────────────────────────────────────

export type CheckGroup = 'Source' | 'Retrieval' | 'Answer' | 'Evaluation';
export const CHECK_GROUPS: CheckGroup[] = ['Source', 'Retrieval', 'Answer', 'Evaluation'];

/** Which figure from another tab sits beside a critical check, so it is answered from evidence. */
export type Evidence = 'rulesMapped' | 'conditionRecall' | 'cannotCheck' | 'testCasesWritten';

export interface Check {
  n: number;
  group: CheckGroup;
  text: string;
  critical: boolean;
  evidence?: Evidence;
}

export const CHECKS: Check[] = [
  { n: 1, group: 'Source', critical: false, text: 'The source documents are the current versions, and the assistant knows each one’s effective date.' },
  { n: 2, group: 'Source', critical: true, evidence: 'rulesMapped', text: 'Every rule this answer type relies on has its gating conditions identified (Tab 1).' },
  { n: 3, group: 'Source', critical: false, text: 'Each condition is stored with its rule or linked to it, for example in passage metadata or by retrieving the parent section.' },
  { n: 4, group: 'Retrieval', critical: true, evidence: 'conditionRecall', text: 'Retrieval returns the condition along with the rule (Tab 2 condition recall).' },
  { n: 5, group: 'Retrieval', critical: false, text: 'Superseded or conflicting versions of a rule are excluded or flagged.' },
  { n: 6, group: 'Retrieval', critical: false, text: 'Exceptions and overrides to a rule are retrieved with it.' },
  { n: 7, group: 'Answer', critical: true, evidence: 'cannotCheck', text: 'The assistant has, or asks for, every asker fact the conditions depend on.' },
  { n: 8, group: 'Answer', critical: false, text: 'The answer states the conditions it relied on, not just the rule.' },
  { n: 9, group: 'Answer', critical: false, text: 'When an asker fact is missing, the answer is conditional (“it depends on your length of service”) or the assistant asks; it doesn’t default to yes.' },
  { n: 10, group: 'Answer', critical: false, text: 'Answers that affect health, money or employment point to a named human contact or the official source for confirmation.' },
  { n: 11, group: 'Evaluation', critical: true, evidence: 'testCasesWritten', text: 'The eval set includes cases where the cited text is true but doesn’t apply, scored separately from groundedness (Tab 4).' },
  { n: 12, group: 'Evaluation', critical: false, text: 'A named owner re-runs this check when a source policy changes.' },
];

export const POINTS: Record<Answer, number> = { Yes: 2, Partial: 1, No: 0 };
export const STATUS: Record<Answer, 'Pass' | 'Partial' | 'Fail'> = { Yes: 'Pass', Partial: 'Partial', No: 'Fail' };
export const MAX_TOTAL = CHECKS.length * 2;
/** A total at or above this, with no critical check answered No, is Ready. */
export const READY_AT = 20;

export type Decision = 'Ready' | 'Fix first' | 'Hold';

export const DECISION_MEANING: Record<Decision, string> = {
  Hold: 'Don’t trust these answers yet.',
  'Fix first': 'No critical check fails, but the total is under 20. Fix the gaps before you rely on these answers.',
  Ready: 'Every critical check passes and the total is 20 or more.',
};

export interface ChecklistResult {
  total: number;
  answered: number;
  /** Numbers of the critical checks answered No, in check order. */
  criticalNo: number[];
  /**
   * Null while the outcome is still open: no critical No yet, and a check left
   * unanswered. A critical No settles it as Hold however many are blank, which
   * is why the workbook shows Hold on a half-filled sheet.
   */
  decision: Decision | null;
  /** The first critical No; else the first No; else the first Partial. Null when none. */
  nextStep: Check | null;
}

/** `answers[i]` is the answer to check i + 1; '' is unanswered. */
export function checklistResult(answers: (Answer | '')[]): ChecklistResult {
  if (answers.length !== CHECKS.length) throw new Error(`expected ${CHECKS.length} answers, got ${answers.length}`);
  const total = answers.reduce((s, a) => s + (a === '' ? 0 : POINTS[a]), 0);
  const answered = answers.filter((a) => a !== '').length;
  const criticalNo = CHECKS.filter((c, i) => c.critical && answers[i] === 'No').map((c) => c.n);

  let decision: Decision | null;
  if (criticalNo.length) decision = 'Hold';
  else if (answered < CHECKS.length) decision = null;
  else decision = total >= READY_AT ? 'Ready' : 'Fix first';

  // The workbook does this with a hidden priority column: 1 critical No,
  // 2 No, 3 Partial, 9 nothing to do; the next step is the first row holding
  // the smallest number.
  const priority = (c: Check, a: Answer | '') => (a === 'No' ? (c.critical ? 1 : 2) : a === 'Partial' ? 3 : 9);
  let best: Check | null = null;
  let bestP = 9;
  CHECKS.forEach((c, i) => {
    const p = priority(c, answers[i]);
    if (p < bestP) {
      bestP = p;
      best = c;
    }
  });
  return { total, answered, criticalNo, decision, nextStep: best };
}

// ── tab 4 · test cases ───────────────────────────────────────────────────────

export interface TestCase {
  question: string;
  askerProfile: string;
  clause: string;
  correctAnswer: string;
  whyMisleads: string;
  expected: ExpectedBehaviour | '';
}

/** Rows with a question. Mirrors COUNTA over the Question column. */
export const testCasesWritten = (rows: TestCase[]): number => rows.filter((r) => r.question.trim() !== '').length;

/** A ratio as the page and the workbook print it: one decimal place. */
export const percent = (x: number | null): string => (x === null ? '—' : `${(x * 100).toFixed(1)}%`);
