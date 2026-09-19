// The PDF of a filled Run-Cost Model.
//
// Built on the server with pdf-lib, the same way as poc-screen-pdf.ts, which
// is the reference for every tool's PDF. Every row, every formula and the
// outcome come from `src/data/run-cost-model.ts`, the same module the page
// renders from, through `readModel()`, the same function the page's script
// uses. The PDF cannot say a number the page does not.
//
// ───────────────────────────────────────────────────────────────────────────
// THREE STAGES: BUILD THE MODEL, CHECK IT, THEN DRAW IT
// ───────────────────────────────────────────────────────────────────────────
//
// `buildModel()` turns the 83 lines into a plain object of every string and
// number the file will carry. `checkModel()` runs a list of named checks over
// that object, and each check recomputes its fact from the raw inputs with
// its own arithmetic rather than by calling `readModel()` again: the six run
// blocks add up to run cost, cost per acceptable outcome is total cost over
// acceptable outcomes, the leading option is the rubric's, the flags are the
// numbers', every line label matches the tool, the cohort copy carries no
// unpublished figure, no placeholder survived, every glyph can be drawn. Only
// a model that passes every check is drawn, and the drawn bytes are opened
// again to confirm the file parses. The route runs the checks BEFORE the
// request is saved, so a file that would fail leaves nothing behind it.
//
// The reason for the middle stage is the reason `facts.ts` exists: a wrong
// number in a PDF somebody takes to a budget meeting is worse than a wrong
// number on a page, because nobody redeploys a PDF.
//
// ───────────────────────────────────────────────────────────────────────────
// THE BRAND, ON PAPER
// ───────────────────────────────────────────────────────────────────────────
//
// The design system of record is .claude/skills/the-living-craft-design. Its
// print rule is that soft elevation does not print, so every panel here is a
// flat fill with a small radius and no shadow. Noir is the cover band and
// nothing else; sun marks the leading option; ember carries the promotional
// panel with ink text on it. This tool has no hard gate, so berry is not used
// here; an option that never pays back is set in the danger ink, which is the
// text bar for that colour. Helvetica stands in for Figtree, as it does in
// every renderer.
//
// Standard fonts encode WinAnsi only. `clean()` maps the few characters we
// use that fall outside it and drops the rest. Our own copy must lose
// nothing to that; a typed name or a typed currency label may.
//
// The inputs are used for the file and are not stored. `parseInputs()`
// refuses anything that is not the exact shape the page posts.

import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  ARMS,
  ARM_ROWS,
  BLOCK_KEYS,
  EXAMPLE_STORY,
  FORGOTTEN_ROWS,
  INPUT_COUNT,
  LIMITS,
  OUTCOMES,
  SECTIONS,
  SHARED_ROWS,
  TOOL_NAME,
  TOTALS,
  blankInputs,
  fmtComputed,
  fmtInput,
  fmtMoney,
  readModel,
  unitOf,
  type ArmComputedKey,
  type ArmKey,
  type ArmRowKey,
  type Cell,
  type ModelInputs,
  type OutcomeKey,
  type SharedKey,
} from '../../data/run-cost-model';
import { TOOL_CREDIT, publishedResources } from '../../data/resources';
import { SITE_ORIGIN, cohort } from '../../data/facts';
import { COHORT_SIZE, COMMITMENT } from '../../data/offer-display';
import type { PdfCheck } from './poc-screen-pdf';

// ---------------------------------------------------------------------------
// Geometry and colour
// ---------------------------------------------------------------------------

const PAGE = { w: 595.28, h: 841.89 }; // A4, points
const MARGIN = { top: 64, right: 52, bottom: 60, left: 52 };
const MEASURE = PAGE.w - MARGIN.left - MARGIN.right;
const BAND_H = 128;

const NOIR = rgb(0, 0, 0);
const SUN = rgb(1, 0.757, 0.137); // #ffc123
const EMBER = rgb(0.992, 0.522, 0.286); // #fd8549
const MIST = rgb(0.945, 0.953, 0.961); // #f1f3f5
const INK = rgb(0.086, 0.129, 0.18); // #16212e
const QUIET = rgb(0.38, 0.42, 0.47);
const ON_NOIR_QUIET = rgb(0.64, 0.675, 0.72);
const RULE = rgb(0.86, 0.88, 0.9);
const DANGER = rgb(0.81, 0.06, 0.27); // #cf0f45, the text bar
const WHITE = rgb(1, 1, 1);

const clean = (s: string): string =>
  s
    .replace(/→/g, '->')
    .replace(/₹/g, 'INR ')
    .replace(/[^\x20-\x7e\xa0-\xff–—‘’“”…•]/g, '');

/** True when `clean()` would change nothing. Our own copy must satisfy this. */
const drawsWhole = (s: string): boolean => clean(s) === s;

export interface RunCostPdfInput {
  inputs: ModelInputs;
  /** True when the page had the reference example loaded unchanged, so the file can say so. */
  isExample: boolean;
  /** The name typed into the request form. Printed on the cover line. */
  name: string;
  /** ISO date the copy was built, printed on the cover line. */
  builtOn: string;
}

const MAX_VALUE = 1_000_000_000;

const cell = (v: unknown): Cell | undefined => {
  if (v === null) return null;
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_VALUE) return v;
  return undefined;
};

/** Validate a posted inputs object. Anything else is refused, not coerced. */
export function parseInputs(value: unknown): ModelInputs | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.currency !== 'string' || v.currency.length > 12) return null;
  if (!v.shared || typeof v.shared !== 'object' || !v.arms || typeof v.arms !== 'object') return null;

  const out = blankInputs();
  out.currency = v.currency.trim();

  const shared = v.shared as Record<string, unknown>;
  for (const row of SHARED_ROWS) {
    const c = cell(shared[row.key]);
    if (c === undefined) return null;
    out.shared[row.key as SharedKey] = c;
  }
  const arms = v.arms as Record<string, unknown>;
  for (const arm of ARMS) {
    const col = arms[arm.key];
    if (!col || typeof col !== 'object') return null;
    for (const row of ARM_ROWS) {
      const c = cell((col as Record<string, unknown>)[row.key]);
      if (c === undefined) return null;
      out.arms[arm.key][row.key as ArmRowKey] = c;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Stage 1: the model
// ---------------------------------------------------------------------------

export interface RunCostPdfModel {
  title: string;
  subtitle: string;
  series: string;
  coverLine: string;
  exampleLine: string | null;
  credit: string;
  /** The currency label as it will print. A typed ₹ becomes "INR". */
  currency: string;
  result: {
    outcomeKey: OutcomeKey | 'none';
    outcomeName: string;
    what: string;
    leadKey: ArmKey | null;
    leadLine: string | null;
    flags: { key: string; text: string }[];
  };
  /** The numbers behind every printed cell, kept so the checks can compare numbers, not strings. */
  numbers: {
    shared: { totalCases: Cell; manualBaseline: Cell; manualPerMonth: Cell };
    arms: Record<ArmKey, Record<ArmComputedKey, Cell>>;
    breakEvenState: Record<ArmKey, 'inside' | 'beyond' | 'never' | null>;
  };
  comparison: {
    columns: string[];
    legend: string;
    rows: { key: ArmComputedKey; label: string; cells: string[]; strong: boolean }[];
    baselineLine: string;
  };
  breakdown: { key: ArmComputedKey; name: string; cells: string[] }[] | null;
  assumptions: { num: string; arm: ArmKey | null; text: string }[];
  inputs: {
    num: number;
    name: string;
    question: string;
    scope: 'shared' | 'arm';
    columns: string[];
    rows: { label: string; unit: string; forgotten: boolean; computed: boolean; cells: string[] }[];
  }[];
  rubric: { key: OutcomeKey; when: string; name: string; what: string; active: boolean }[];
  forgotten: string[];
  limits: string[];
  cta: { heading: string; lines: string[]; action: string; url: string };
  footer: string;
}

export function buildModel(input: RunCostPdfInput): RunCostPdfModel {
  const r = readModel(input.inputs);
  const cur = clean(input.inputs.currency).trim();
  const built = new Date(input.builtOn);
  const dateLine = Number.isNaN(built.getTime())
    ? ''
    : built.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const meta = publishedResources.find((x) => x.id === 'run-cost-model');
  const lead = r.leader ? r.arms.find((a) => a.key === r.leader)! : null;
  const left = r.totalInputs - r.filled;

  const armValues = Object.fromEntries(r.arms.map((a) => [a.key, a.values])) as Record<ArmKey, Record<ArmComputedKey, Cell>>;
  const breakEvenState = Object.fromEntries(r.arms.map((a) => [a.key, a.breakEvenState])) as Record<ArmKey, 'inside' | 'beyond' | 'never' | null>;

  return {
    title: TOOL_NAME,
    subtitle: 'Four ways to do the same job, costed over one period, with the operating lines most business cases leave out.',
    series: meta ? `${meta.series} · ${meta.number}` : 'Resources',
    coverLine: [
      input.name ? `Modelled by ${clean(input.name)}` : null,
      dateLine || null,
      'learning.thelivingcraft.ai/resources/run-cost-model',
    ]
      .filter(Boolean)
      .join('  ·  '),
    exampleLine: input.isExample
      ? `This copy holds the reference example, ${EXAMPLE_STORY.title.toLowerCase()}, unchanged. The figures are illustrative and composite.`
      : null,
    credit: TOOL_CREDIT,
    currency: cur,
    result: {
      outcomeKey: r.outcome?.key ?? 'none',
      outcomeName: r.outcome ? r.outcome.name : 'Incomplete',
      what: r.outcome
        ? r.outcome.what
        : `${left} ${left === 1 ? 'line is' : 'lines are'} blank, so there is no outcome yet. A blank line is unknown, not zero, and every total that depends on it stays blank. Fill every line to read the result against the rubric.`,
      leadKey: r.leader,
      leadLine: lead
        ? `Leading option: ${lead.name}, at ${fmtMoney(lead.values.perOutcome, cur, true)} per acceptable outcome. Net position against doing it by hand: ${fmtMoney(lead.values.net, cur)} over ${fmtInput(input.inputs.shared.months)} months.`
        : null,
      flags: r.flags.map((f) => ({ key: f.key, text: f.text })),
    },
    numbers: { shared: r.shared.values, arms: armValues, breakEvenState },
    comparison: {
      columns: ARMS.map((a) => a.short),
      legend: ARMS.map((a) => `${a.short}: ${a.legend.replace(/\.$/, '')}`).join('  ·  '),
      rows: TOTALS.map((row) => ({
        key: row.key as ArmComputedKey,
        label: row.label,
        cells: r.arms.map((a) => fmtComputed(row, a.values[row.key as ArmComputedKey], cur, a.breakEvenState)),
        strong: row.key === 'perOutcome',
      })),
      baselineLine: `Manual baseline for the period: ${fmtMoney(r.shared.values.manualBaseline, cur)} for ${fmtInput(r.shared.values.totalCases)} cases (${fmtInput(input.inputs.shared.casesPerMonth)} a month, ${fmtInput(input.inputs.shared.manualMinutes)} minutes each at ${fmtMoney(input.inputs.shared.manualRate, cur)} an hour).`,
    },
    breakdown: r.complete
      ? BLOCK_KEYS.map((k) => ({
          key: k,
          name: r.arms[0].blocks.find((b) => b.key === k)!.name,
          cells: r.arms.map((a) => {
            const b = a.blocks.find((x) => x.key === k)!;
            return `${fmtMoney(b.value, cur)}  (${Math.round((b.share ?? 0) * 100)}%)`;
          }),
        }))
      : null,
    assumptions: r.checks.map((c, i) => ({ num: String(i + 1).padStart(2, '0'), arm: c.arm, text: c.text })),
    inputs: SECTIONS.map((s) => ({
      num: s.num,
      name: s.name,
      question: s.question,
      scope: s.scope,
      columns: s.scope === 'shared' ? ['Value'] : ARMS.map((a) => a.short),
      rows: [
        ...(s.num === 1 ? [{ label: 'Currency label', unit: 'free text', forgotten: false, computed: false, cells: [cur || '—'] }] : []),
        ...s.inputs.map((row) => ({
          label: row.label,
          unit: unitOf(row.kind, cur),
          forgotten: Boolean(row.forgotten),
          computed: false,
          cells:
            s.scope === 'shared'
              ? [fmtInput(input.inputs.shared[row.key as SharedKey])]
              : ARMS.map((a) => fmtInput(input.inputs.arms[a.key][row.key as ArmRowKey])),
        })),
        ...s.computed.map((row) => ({
          label: row.label,
          unit: 'worked out',
          forgotten: false,
          computed: true,
          cells:
            s.scope === 'shared'
              ? [fmtComputed(row, r.shared.values[row.key as keyof typeof r.shared.values], cur)]
              : r.arms.map((a) => fmtComputed(row, a.values[row.key as ArmComputedKey], cur, a.breakEvenState)),
        })),
      ],
    })),
    rubric: OUTCOMES.map((o) => ({ key: o.key, when: o.when, name: o.name, what: o.what, active: r.outcome?.key === o.key })),
    forgotten: FORGOTTEN_ROWS.map((f) => f.label),
    limits: LIMITS,
    // Every figure here is read from facts.ts through offer-display.ts. Nothing
    // is typed in this file, so the PDF cannot disagree with the cohort page.
    cta: {
      heading: 'Join the cohort',
      lines: [
        `${cohort.name} is a ${cohort.weeks}-week live programme in agentic systems architecture, taught by Sunil Mathew. It teaches the judgment this tool asks for: which option to build, what it will cost to run, and how to prove the number in a budget conversation.`,
        `${COMMITMENT} ${COHORT_SIZE} Starts ${cohort.startsOn}.`,
        `${cohort.admission}. Applying commits you to nothing.`,
      ],
      action: 'Apply at',
      url: `${SITE_ORIGIN}/#apply`,
    },
    footer: `${TOOL_NAME} · The Living Craft · ${TOOL_CREDIT}`,
  };
}

// ---------------------------------------------------------------------------
// Stage 2: the checks
// ---------------------------------------------------------------------------

const PLACEHOLDER = /\bTBD\b|\[PLACEHOLDER|\bTODO\b|lorem ipsum|\{\{|\}\}|\bXXX\b/i;
/** Figures the public offer does not print in prose: a rupee amount or a fee. */
const UNPUBLISHED = /₹|\bRs\.?\s?\d|\bINR\b|\bAED\b|\bAUD\b|\bfee\b|\bprice\b|\bdiscount\b/i;

/** Two numbers agree to a millionth, or are both blank. */
const same = (a: Cell, b: Cell): boolean => {
  if (a === null || b === null) return a === b;
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= scale * 1e-9;
};

/** The arithmetic written out a second time, without `readModel()`. */
function recompute(inputs: ModelInputs) {
  const s = inputs.shared;
  const known = (...xs: Cell[]) => xs.every((x) => x !== null);
  const totalCases = known(s.casesPerMonth, s.months) ? s.casesPerMonth! * s.months! : null;
  const manualBaseline = known(totalCases, s.manualMinutes, s.manualRate) ? (totalCases! * s.manualMinutes!) / 60 * s.manualRate! : null;
  const manualPerMonth = known(manualBaseline, s.months) ? (s.months! > 0 ? manualBaseline! / s.months! : 0) : null;

  const arms = Object.fromEntries(
    ARMS.map((arm) => {
      const a = inputs.arms[arm.key];
      const c = s.casesPerMonth;
      const build = known(a.buildDays, a.evalDays, s.engDayRate) ? (a.buildDays! + a.evalDays!) * s.engDayRate! : null;
      const model = known(c, a.modelCalls, a.retryMult, a.modelCallCost) ? c! * a.modelCalls! * a.retryMult! * a.modelCallCost! : null;
      const tool = known(c, a.toolCalls, a.toolCallCost) ? c! * a.toolCalls! * a.toolCallCost! : null;
      const review = known(c, a.reviewShare, a.reviewMinutes, s.reviewerRate) ? (c! * (a.reviewShare! / 100) * a.reviewMinutes!) / 60 * s.reviewerRate! : null;
      const escalation = known(c, a.escalationShare, a.escalationMinutes, s.engHourRate) ? (c! * (a.escalationShare! / 100) * a.escalationMinutes!) / 60 * s.engHourRate! : null;
      const declined = known(c, a.declinedShare, a.declinedMinutes, s.reviewerRate) ? (c! * (a.declinedShare! / 100) * a.declinedMinutes!) / 60 * s.reviewerRate! : null;
      const upkeep = known(a.toolingCost, a.evalUpkeepDays, a.requalDays, a.regressionDays, a.incidentDays, s.engDayRate)
        ? a.toolingCost! + (a.evalUpkeepDays! + a.requalDays! / 12 + a.regressionDays! + a.incidentDays!) * s.engDayRate!
        : null;
      const blocks = [model, tool, review, escalation, declined, upkeep];
      const run = blocks.every((b) => b !== null) ? blocks.reduce<number>((n, b) => n + (b as number), 0) : null;
      const runPeriod = known(run, s.months) ? run! * s.months! : null;
      const total = known(build, runPeriod) ? build! + runPeriod! : null;
      const perCase = known(total, totalCases) ? (totalCases! > 0 ? total! / totalCases! : 0) : null;
      const outcomes = known(totalCases, a.acceptRate) ? totalCases! * (a.acceptRate! / 100) : null;
      const perOutcome = outcomes !== null && outcomes > 0 && total !== null ? total / outcomes : null;
      const net = known(manualBaseline, total) ? manualBaseline! - total! : null;
      const saving = known(manualPerMonth, run) ? manualPerMonth! - run! : null;
      let breakEven: Cell = null;
      let state: 'inside' | 'beyond' | 'never' | null = null;
      if (saving !== null && build !== null) {
        if (saving <= 0) state = 'never';
        else {
          breakEven = build / saving;
          state = s.months !== null && breakEven > s.months ? 'beyond' : 'inside';
        }
      }
      return [arm.key, { build, model, tool, review, escalation, declined, upkeep, run, runPeriod, total, perCase, outcomes, perOutcome, net, breakEven, state }];
    }),
  ) as Record<ArmKey, {
    build: Cell; model: Cell; tool: Cell; review: Cell; escalation: Cell; declined: Cell; upkeep: Cell;
    run: Cell; runPeriod: Cell; total: Cell; perCase: Cell; outcomes: Cell; perOutcome: Cell; net: Cell; breakEven: Cell;
    state: 'inside' | 'beyond' | 'never' | null;
  }>;

  return { totalCases, manualBaseline, manualPerMonth, arms };
}

/**
 * Everything the file will say, checked against the modules it was built from.
 * Each check recomputes its fact independently of `buildModel()`, so a bug in
 * the model and a bug in the check would have to agree to pass.
 */
export function checkModel(model: RunCostPdfModel, input: RunCostPdfInput): PdfCheck[] {
  const checks: PdfCheck[] = [];
  const add = (name: string, ok: boolean, detail?: string) => checks.push(ok ? { name, ok } : { name, ok, detail });
  const inputs = input.inputs;

  // 1. Every line is a number or blank, and there are 83 of them.
  const allCells: Cell[] = [
    ...SHARED_ROWS.map((row) => inputs.shared[row.key as SharedKey]),
    ...ARMS.flatMap((a) => ARM_ROWS.map((row) => inputs.arms[a.key][row.key as ArmRowKey])),
  ];
  add(
    `${INPUT_COUNT} lines, each a number or blank`,
    allCells.length === INPUT_COUNT && allCells.every((v) => v === null || (Number.isFinite(v) && v >= 0)),
    `got ${allCells.length} lines`,
  );

  const re = recompute(inputs);
  const filled = allCells.filter((v) => v !== null).length;
  const complete = filled === INPUT_COUNT;

  // 2. The manual baseline: cases, times months, times minutes, at the hourly rate.
  add(
    'Manual baseline equals cases times minutes at the hourly rate',
    same(model.numbers.shared.totalCases, re.totalCases) && same(model.numbers.shared.manualBaseline, re.manualBaseline),
    `model ${model.numbers.shared.manualBaseline}, recomputed ${re.manualBaseline}`,
  );

  // 3. Run cost per month is the sum of its six blocks, and total cost is build plus run.
  const blockKeys: ArmComputedKey[] = ['modelCost', 'toolCost', 'reviewCost', 'escalationCost', 'declinedCost', 'upkeepCost'];
  let sumsOk = true;
  for (const a of ARMS) {
    const m = model.numbers.arms[a.key];
    const x = re.arms[a.key];
    const blocks = [x.model, x.tool, x.review, x.escalation, x.declined, x.upkeep];
    blockKeys.forEach((k, i) => {
      if (!same(m[k], blocks[i])) sumsOk = false;
    });
    if (!same(m.buildCost, x.build) || !same(m.runPerMonth, x.run) || !same(m.runPeriod, x.runPeriod) || !same(m.total, x.total)) sumsOk = false;
  }
  add('Run cost per month is the sum of its six blocks, and total cost is build plus run', sumsOk);

  // 4. Cost per case and cost per acceptable outcome.
  let perOk = true;
  for (const a of ARMS) {
    const m = model.numbers.arms[a.key];
    const x = re.arms[a.key];
    if (!same(m.perCase, x.perCase) || !same(m.outcomes, x.outcomes) || !same(m.perOutcome, x.perOutcome)) perOk = false;
  }
  add('Cost per acceptable outcome equals total cost over acceptable outcomes', perOk);

  // 5. Net position and break-even, with the never and beyond states.
  let netOk = true;
  for (const a of ARMS) {
    const m = model.numbers.arms[a.key];
    const x = re.arms[a.key];
    if (!same(m.net, x.net) || !same(m.breakEven, x.breakEven) || model.numbers.breakEvenState[a.key] !== x.state) netOk = false;
  }
  add('Net position and break-even match the manual baseline', netOk);

  // 6. The outcome is what the rubric says: lowest cost per acceptable outcome
  //    among the options that save money, else "manual", and none until complete.
  let expected: OutcomeKey | 'none' = 'none';
  let expectedLead: ArmKey | null = null;
  if (complete) {
    let best: { key: ArmKey; v: number } | null = null;
    for (const a of ARMS) {
      const x = re.arms[a.key];
      if (x.net !== null && x.net > 0 && x.perOutcome !== null && (best === null || x.perOutcome < best.v)) best = { key: a.key, v: x.perOutcome };
    }
    expectedLead = best?.key ?? null;
    expected = expectedLead ?? 'manual';
  }
  const expectedName = expected === 'none' ? 'Incomplete' : OUTCOMES.find((o) => o.key === expected)!.name;
  add(
    'Outcome matches the rubric',
    model.result.outcomeKey === expected && model.result.outcomeName === expectedName && model.result.leadKey === expectedLead,
    `model ${model.result.outcomeKey}, rubric ${expected}`,
  );

  // 7. The flags are the numbers': disagreement, never, beyond.
  const expectedFlags: string[] = [];
  if (complete) {
    let bestCase: { key: ArmKey; v: number } | null = null;
    for (const a of ARMS) {
      const x = re.arms[a.key];
      if (x.perCase !== null && (bestCase === null || x.perCase < bestCase.v)) bestCase = { key: a.key, v: x.perCase };
    }
    if (expectedLead && bestCase && bestCase.key !== expectedLead) expectedFlags.push('disagree');
    if (ARMS.some((a) => re.arms[a.key].state === 'never')) expectedFlags.push('never');
    for (const a of ARMS) if (re.arms[a.key].state === 'beyond') expectedFlags.push('beyond');
  }
  add(
    'Flags match the numbers',
    model.result.flags.map((f) => f.key).join(',') === expectedFlags.join(','),
    `model ${model.result.flags.map((f) => f.key).join(',')}, expected ${expectedFlags.join(',')}`,
  );

  // 8. Every line label and unit matches the tool, section by section.
  let rowsOk = model.inputs.length === SECTIONS.length;
  model.inputs.forEach((sec, i) => {
    const src = SECTIONS[i];
    if (!src || sec.name !== src.name || sec.question !== src.question || sec.scope !== src.scope) rowsOk = false;
    const expectedLabels = [
      ...(src?.num === 1 ? ['Currency label'] : []),
      ...(src?.inputs.map((r) => r.label) ?? []),
      ...(src?.computed.map((r) => r.label) ?? []),
    ];
    if (sec.rows.map((r) => r.label).join('|') !== expectedLabels.join('|')) rowsOk = false;
    const cols = src?.scope === 'shared' ? 1 : ARMS.length;
    if (!sec.rows.every((r) => r.cells.length === cols)) rowsOk = false;
  });
  add('Every line label matches the tool', rowsOk);

  // 9. The assumption checks lead with the leading option, then the full agent.
  const rank = (arm: ArmKey | null) => (arm === null ? 3 : arm === expectedLead ? 0 : arm === 'agent' ? 1 : 2);
  const ranks = model.assumptions.map((c) => rank(c.arm));
  add(
    'Assumption checks lead with the leading option, then the full agent',
    ranks.every((v, i) => i === 0 || v >= ranks[i - 1]),
  );

  // 10. Every string in the file, gathered once for the text checks.
  const strings: string[] = [
    model.title,
    model.subtitle,
    model.series,
    model.credit,
    model.result.outcomeName,
    model.result.what,
    model.result.leadLine ?? '',
    ...model.result.flags.map((f) => f.text),
    model.comparison.legend,
    ...model.comparison.rows.flatMap((r) => [r.label, ...r.cells]),
    model.comparison.baselineLine,
    ...(model.breakdown ?? []).flatMap((b) => [b.name, ...b.cells]),
    ...model.assumptions.map((c) => c.text),
    ...model.inputs.flatMap((s) => [s.name, s.question, ...s.rows.flatMap((r) => [r.label, r.unit, ...r.cells])]),
    ...model.rubric.flatMap((o) => [o.when, o.name, o.what]),
    ...model.forgotten,
    ...model.limits,
    model.cta.heading,
    ...model.cta.lines,
    model.cta.url,
    model.footer,
  ];

  add('No placeholder text', !strings.some((s) => PLACEHOLDER.test(s)), strings.find((s) => PLACEHOLDER.test(s)));

  // 11. The cohort copy prints only what the offer publishes: weeks, seats,
  //     start month and the time commitment, each read from facts.ts. No fee.
  const ctaText = model.cta.lines.join(' ');
  add(
    'Cohort copy carries no unpublished figure',
    !UNPUBLISHED.test(ctaText) &&
      ctaText.includes(`${cohort.weeks}-week`) &&
      ctaText.includes(`${cohort.seats} seats`) &&
      ctaText.includes(cohort.startsOn),
  );

  // 12. The apply link points at this site's cohort page.
  add('Apply link points at the cohort page', model.cta.url === `${SITE_ORIGIN}/#apply`);

  // 13. The credit line is the one every tool carries.
  add('Credit line present', model.credit === TOOL_CREDIT && model.footer.includes(TOOL_CREDIT));

  // 14. Every character can be drawn. The cover line and the currency label
  //     may lose a glyph from what somebody typed; nothing else may.
  const undrawable = strings.find((s) => !drawsWhole(s));
  add('Every character can be printed', undrawable === undefined, undrawable);

  return checks;
}

// ---------------------------------------------------------------------------
// Stage 3: drawing
// ---------------------------------------------------------------------------

type Colour = ReturnType<typeof rgb>;

interface Column {
  x: number;
  w: number;
  align?: 'left' | 'right';
}

class Writer {
  private doc: PDFDocument;
  private page!: PDFPage;
  private y = 0;
  private pageNo = 0;
  readonly body: PDFFont;
  readonly bold: PDFFont;
  private decorate: (page: PDFPage, pageNo: number) => number;

  constructor(doc: PDFDocument, body: PDFFont, bold: PDFFont, decorate: (page: PDFPage, pageNo: number) => number) {
    this.doc = doc;
    this.body = body;
    this.bold = bold;
    this.decorate = decorate;
    this.newPage();
  }

  private newPage() {
    this.page = this.doc.addPage([PAGE.w, PAGE.h]);
    this.pageNo += 1;
    this.y = this.decorate(this.page, this.pageNo);
  }

  /** Start a new page unless `height` points still fit on this one. */
  ensure(height: number) {
    if (this.y - height < MARGIN.bottom) this.newPage();
  }

  gap(points: number) {
    this.y -= points;
  }

  rule() {
    this.ensure(8);
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y },
      end: { x: PAGE.w - MARGIN.right, y: this.y },
      thickness: 0.6,
      color: RULE,
    });
    this.y -= 10;
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const words = clean(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const probe = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(probe, size) <= width) line = probe;
      else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  heightOf(text: string, font: PDFFont, size: number, width = MEASURE, lh = 1.4): number {
    return this.wrap(text, font, size, width).length * size * lh;
  }

  text(
    text: string,
    opts: { font?: PDFFont; size?: number; color?: Colour; indent?: number; width?: number; lh?: number } = {},
  ) {
    const font = opts.font ?? this.body;
    const size = opts.size ?? 10;
    const lh = opts.lh ?? 1.4;
    const indent = opts.indent ?? 0;
    const width = opts.width ?? MEASURE - indent;
    for (const line of this.wrap(text, font, size, width)) {
      this.ensure(size * lh);
      this.page.drawText(line, { x: MARGIN.left + indent, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= size * lh;
    }
  }

  /** A label in the left gutter and a paragraph beside it, on one baseline. */
  labelled(
    label: string,
    text: string,
    opts: { size?: number; labelColor?: Colour; gutter?: number; font?: PDFFont; indent?: number; color?: Colour } = {},
  ) {
    const size = opts.size ?? 10;
    const gutter = opts.gutter ?? 30;
    const indent = opts.indent ?? 0;
    this.ensure(size * 1.4);
    this.page.drawText(clean(label), {
      x: MARGIN.left + indent,
      y: this.y - size,
      size,
      font: this.bold,
      color: opts.labelColor ?? QUIET,
    });
    this.text(text, { size, indent: indent + gutter, font: opts.font, color: opts.color });
  }

  /** The height one table row will take, so a heading can be kept with its first rows. */
  rowHeight(first: string, cols: Column[], size = 9, lh = 1.35): number {
    return Math.max(1, this.wrap(first, this.body, size, cols[0].w).length) * size * lh;
  }

  /**
   * One table row. The first cell wraps inside its column; the others sit on
   * the first line. Right-aligned cells are for numbers. The row never splits
   * across a page.
   */
  columns(
    cells: string[],
    cols: Column[],
    opts: { size?: number; font?: PDFFont; color?: Colour; colors?: (Colour | undefined)[]; fonts?: (PDFFont | undefined)[]; lh?: number; indent?: number } = {},
  ) {
    const size = opts.size ?? 9;
    const lh = opts.lh ?? 1.35;
    const font = opts.font ?? this.body;
    const indent = opts.indent ?? 0;
    const first = this.wrap(cells[0] ?? '', opts.fonts?.[0] ?? font, size, cols[0].w);
    const height = Math.max(1, first.length) * size * lh;
    this.ensure(height);
    const top = this.y;
    first.forEach((line, i) => {
      this.page.drawText(line, {
        x: MARGIN.left + indent + cols[0].x,
        y: top - size - i * size * lh,
        size,
        font: opts.fonts?.[0] ?? font,
        color: opts.colors?.[0] ?? opts.color ?? INK,
      });
    });
    for (let i = 1; i < cols.length; i++) {
      const raw = clean(cells[i] ?? '');
      const f = opts.fonts?.[i] ?? font;
      // A value that does not fit its column is shortened rather than allowed
      // to run into the next one.
      let s = raw;
      while (s.length > 1 && f.widthOfTextAtSize(s, size) > cols[i].w) s = s.slice(0, -1);
      const width = f.widthOfTextAtSize(s, size);
      const x = cols[i].align === 'right' ? MARGIN.left + indent + cols[i].x + cols[i].w - width : MARGIN.left + indent + cols[i].x;
      this.page.drawText(s, { x, y: top - size, size, font: f, color: opts.colors?.[i] ?? opts.color ?? INK });
    }
    this.y = top - height;
  }

  /** A small filled square beside a value, used for the leading option. */
  marker(x: number, yTop: number, size: number, color: Colour) {
    this.page.drawRectangle({ x, y: yTop - size, width: size, height: size, color });
  }

  /** A flat panel with a small radius. Print rule: a fill, never a shadow. */
  panel(height: number, color: Colour, radius = 8) {
    this.ensure(height);
    roundedRect(this.page, MARGIN.left, this.y - height, MEASURE, height, radius, color);
  }

  /** A clickable area over the rectangle, opening `url`. */
  link(x: number, yTop: number, width: number, height: number, url: string) {
    const annot = this.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [x, yTop - height, x + width, yTop],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    });
    const ref = this.doc.context.register(annot);
    const existing = this.page.node.lookup(PDFName.of('Annots'));
    if (existing && 'push' in existing && typeof (existing as { push: unknown }).push === 'function') {
      (existing as { push: (r: unknown) => void }).push(ref);
    } else {
      this.page.node.set(PDFName.of('Annots'), this.doc.context.obj([ref]));
    }
  }

  get cursor() {
    return this.y;
  }

  /** Page numbers, drawn last so the total is known. */
  finish(footer: string) {
    const pages = this.doc.getPages();
    pages.forEach((p, i) => {
      p.drawText(clean(`${footer} · page ${i + 1} of ${pages.length}`), {
        x: MARGIN.left,
        y: MARGIN.bottom - 24,
        size: 7.5,
        font: this.body,
        color: QUIET,
      });
    });
  }
}

function roundedRect(page: PDFPage, x: number, y: number, w: number, h: number, r: number, color: Colour) {
  const d = `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  page.drawSvgPath(d, { x, y: y + h, color, borderWidth: 0 });
}

/** The wordmark: a sun dot and "The Living Craft" in the display weight. */
function wordmark(page: PDFPage, font: PDFFont, x: number, baseline: number, size: number, color: Colour) {
  const dot = size * 0.42;
  page.drawCircle({ x: x + dot / 2, y: baseline + size * 0.3, size: dot / 2, color: SUN });
  page.drawText('The Living Craft', { x: x + dot + size * 0.45, y: baseline, size, font, color });
}

// Five columns: the row label, then one per option. Widths sum to MEASURE.
const LABEL_W = 175;
const ARM_W = (MEASURE - LABEL_W) / ARMS.length;
const COLS: Column[] = [
  { x: 0, w: LABEL_W - 8 },
  ...ARMS.map((_, i) => ({ x: LABEL_W + i * ARM_W, w: ARM_W - 6, align: 'right' as const })),
];
// The breakdown carries a share beside every amount, so its label column is
// narrower to give each option the room.
const BLOCK_LABEL_W = 105;
const BLOCK_ARM_W = (MEASURE - BLOCK_LABEL_W) / ARMS.length;
const BLOCK_COLS: Column[] = [
  { x: 0, w: BLOCK_LABEL_W - 8 },
  ...ARMS.map((_, i) => ({ x: BLOCK_LABEL_W + i * BLOCK_ARM_W, w: BLOCK_ARM_W - 6, align: 'right' as const })),
];
// The inputs table carries a unit column between the label and the values.
const IN_LABEL_W = 150;
const IN_UNIT_W = 78;
const IN_ARM_W = (MEASURE - IN_LABEL_W - IN_UNIT_W) / ARMS.length;
const IN_COLS: Column[] = [
  { x: 0, w: IN_LABEL_W - 8 },
  { x: IN_LABEL_W, w: IN_UNIT_W - 6 },
  ...ARMS.map((_, i) => ({ x: IN_LABEL_W + IN_UNIT_W + i * IN_ARM_W, w: IN_ARM_W - 6, align: 'right' as const })),
];
const IN_SHARED_COLS: Column[] = [IN_COLS[0], IN_COLS[1], { x: IN_LABEL_W + IN_UNIT_W, w: IN_ARM_W - 6, align: 'right' }];

/**
 * The checks alone, for the route to run BEFORE the request is saved. A file
 * that would fail a check must not leave a person, a request row and a queued
 * email behind it.
 */
export function verifyRunCostModelPdf(input: RunCostPdfInput): PdfCheck[] {
  return checkModel(buildModel(input), input);
}

export async function renderRunCostModelPdf(input: RunCostPdfInput): Promise<{ bytes: Uint8Array; checks: PdfCheck[] }> {
  const model = buildModel(input);
  const checks = checkModel(model, input);
  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    // Never draw a file that failed a check. The route turns this into a 500
    // and the page says so; nothing is handed over.
    throw new Error(`PDF check failed: ${failed.map((c) => c.name).join('; ')}`);
  }

  const doc = await PDFDocument.create();
  doc.setTitle(`${TOOL_NAME} — your model`);
  doc.setAuthor('The Living Craft');
  doc.setSubject(model.subtitle);
  doc.setProducer('learning.thelivingcraft.ai');
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // The page decorator. Page 1 carries the black cover band, the one black
  // area in the document; every later page a slim header with the wordmark.
  const decorate = (page: PDFPage, pageNo: number): number => {
    if (pageNo === 1) {
      page.drawRectangle({ x: 0, y: PAGE.h - BAND_H, width: PAGE.w, height: BAND_H, color: NOIR });
      wordmark(page, bold, MARGIN.left, PAGE.h - 34, 12, WHITE);
      const seriesText = clean(model.series);
      page.drawText(seriesText, {
        x: PAGE.w - MARGIN.right - body.widthOfTextAtSize(seriesText, 8),
        y: PAGE.h - 33,
        size: 8,
        font: body,
        color: ON_NOIR_QUIET,
      });
      page.drawText(clean(model.title), { x: MARGIN.left, y: PAGE.h - 74, size: 24, font: bold, color: WHITE });
      page.drawText(clean(model.subtitle), { x: MARGIN.left, y: PAGE.h - 94, size: 9.5, font: body, color: ON_NOIR_QUIET });
      page.drawText(clean(model.credit), { x: MARGIN.left, y: PAGE.h - 112, size: 8, font: body, color: ON_NOIR_QUIET });
      return PAGE.h - BAND_H - 28;
    }
    wordmark(page, bold, MARGIN.left, PAGE.h - 34, 9, INK);
    page.drawLine({
      start: { x: MARGIN.left, y: PAGE.h - 46 },
      end: { x: PAGE.w - MARGIN.right, y: PAGE.h - 46 },
      thickness: 0.6,
      color: RULE,
    });
    return PAGE.h - MARGIN.top;
  };

  const w = new Writer(doc, body, bold, decorate);
  const lead = model.result.leadKey;

  // ---- cover line ---------------------------------------------------------
  w.text(model.coverLine, { size: 8.5, color: QUIET });
  if (model.exampleLine) {
    w.gap(3);
    w.text(model.exampleLine, { size: 8.5, color: QUIET });
  }
  w.gap(14);

  // ---- the result, on a mist panel ----------------------------------------
  const pad = 16;
  const inner = MEASURE - pad * 2;
  const resultH =
    pad * 2 +
    w.heightOf('Result', bold, 9) +
    6 +
    w.heightOf(model.result.outcomeName, bold, 16, inner) +
    4 +
    (model.result.leadLine ? w.heightOf(model.result.leadLine, body, 10, inner) + 3 : 0) +
    w.heightOf(model.result.what, body, 10, inner) +
    model.result.flags.reduce((h, f) => h + 4 + w.heightOf(f.text, bold, 9.5, inner), 0) +
    (model.result.flags.length ? 4 : 0) +
    6;
  w.panel(resultH, MIST);
  w.gap(pad);
  w.text('Result', { font: bold, size: 9, color: QUIET, indent: pad, width: inner });
  w.gap(6);
  w.text(model.result.outcomeName, { font: bold, size: 16, indent: pad, width: inner, color: model.result.outcomeKey === 'manual' ? DANGER : INK });
  w.gap(4);
  if (model.result.leadLine) {
    w.text(model.result.leadLine, { size: 10, indent: pad, width: inner });
    w.gap(3);
  }
  w.text(model.result.what, { size: 10, indent: pad, width: inner });
  if (model.result.flags.length) w.gap(4);
  for (const f of model.result.flags) {
    w.text(f.text, { size: 9.5, indent: pad, width: inner, font: bold, color: f.key === 'disagree' ? INK : DANGER });
    w.gap(4);
  }
  w.gap(pad + 8);

  // ---- the comparison table -----------------------------------------------
  const header = (cols: Column[], names: string[]) => {
    w.columns(['', ...names], cols, { size: 8.5, font: bold, color: QUIET });
    w.gap(2);
  };
  // The heading, the legend, the column header and the first three rows travel together.
  w.ensure(60 + w.heightOf(model.comparison.legend, body, 8.5) + 3 * 16);
  w.text('The comparison', { font: bold, size: 13 });
  w.gap(2);
  w.text('Every option on the same cases and one definition of an acceptable outcome. The number to argue about is cost per acceptable outcome.', { size: 9.5, color: QUIET });
  w.gap(4);
  w.text(model.comparison.legend, { size: 8.5, color: QUIET });
  w.gap(6);
  header(COLS, model.comparison.columns);
  for (const row of model.comparison.rows) {
    const bad = (i: number) => {
      const k = ARMS[i].key;
      return (row.key === 'net' && (model.numbers.arms[k].net ?? 0) < 0) || (row.key === 'breakEven' && model.numbers.breakEvenState[k] === 'never');
    };
    if (row.strong && lead) {
      // The leading option's figure carries the sun mark, the same mark the page uses.
      const i = ARMS.findIndex((a) => a.key === lead);
      const x = MARGIN.left + COLS[i + 1].x + COLS[i + 1].w - bold.widthOfTextAtSize(clean(row.cells[i]), 9) - 12;
      w.marker(x, w.cursor - 1, 7, SUN);
    }
    w.columns([row.label, ...row.cells], COLS, {
      size: 9,
      fonts: [row.strong ? bold : body, ...ARMS.map((a) => (row.strong && a.key === lead ? bold : body))],
      colors: [INK, ...ARMS.map((_, i) => (bad(i) ? DANGER : INK))],
    });
    w.gap(3);
  }
  w.gap(4);
  w.text(model.comparison.baselineLine, { size: 9, color: QUIET });

  // ---- where the money goes -----------------------------------------------
  if (model.breakdown) {
    w.gap(10);
    w.ensure(50 + (model.breakdown.length + 1) * 16);
    w.text('Where the run cost goes, per month', { font: bold, size: 13 });
    w.gap(2);
    w.text('The largest block for each option is the assumption to measure first.', { size: 9.5, color: QUIET });
    w.gap(6);
    header(BLOCK_COLS, model.comparison.columns);
    for (const b of model.breakdown) {
      w.columns([b.name, ...b.cells], BLOCK_COLS, { size: 9 });
      w.gap(3);
    }
  }

  // ---- assumptions to check -----------------------------------------------
  if (model.assumptions.length) {
    w.gap(10);
    w.ensure(50 + w.heightOf(model.assumptions[0].text, body, 9.5, MEASURE - 24));
    w.text('Check these assumptions first', { font: bold, size: 13 });
    w.gap(2);
    w.text('The leading option first, then the full agent, then the rest. Each one is a line that decides the answer and is usually guessed.', { size: 9.5, color: QUIET });
    w.gap(6);
    for (const c of model.assumptions) {
      w.labelled(c.num, c.text, { size: 9.5, gutter: 24 });
      w.gap(3);
    }
  }

  w.gap(10);
  w.rule();

  // ---- your inputs --------------------------------------------------------
  w.ensure(60 + 40 + 3 * 16);
  w.text('Your inputs', { font: bold, size: 13 });
  w.gap(2);
  w.text('Every line as you typed it, with the model’s own line under the inputs that feed it. Lines marked • are the nine most business cases leave out.', { size: 9.5, color: QUIET });
  w.gap(8);

  for (const s of model.inputs) {
    const cols = s.scope === 'shared' ? IN_SHARED_COLS : IN_COLS;
    // A section heading never sits alone at the foot of a page: it moves with
    // its column header and its first two rows, and a short section moves whole.
    const keep = s.rows.length <= 4 ? s.rows : s.rows.slice(0, 2);
    const keepH = keep.reduce((h, r) => h + w.rowHeight(r.label, cols) + 2, 0);
    w.ensure(12 * 1.4 + 10 * 1.4 + 6 + 8.5 * 1.35 + 2 + keepH + 12);
    w.text(`${s.num}  ${s.name}`, { font: bold, size: 12 });
    w.text(s.question, { size: 10, color: QUIET });
    w.gap(6);
    w.columns(['', 'Unit', ...s.columns], cols, { size: 8.5, font: bold, color: QUIET });
    w.gap(2);
    for (const r of s.rows) {
      w.columns([`${r.forgotten ? '• ' : ''}${r.label}`, r.unit, ...r.cells], cols, {
        size: 9,
        font: r.computed ? bold : body,
        color: r.computed ? QUIET : INK,
        colors: [r.computed ? QUIET : INK, QUIET],
      });
      w.gap(2);
    }
    w.gap(8);
  }
  w.rule();

  // ---- the rubric ---------------------------------------------------------
  w.ensure(60 + model.rubric.slice(0, 2).reduce((h, o) => h + w.heightOf(`${o.name} ${o.when}. ${o.what}`, body, 9.5, MEASURE - 14) + 5, 0));
  w.text('How the outcome is read', { font: bold, size: 13 });
  w.gap(2);
  w.text('The leading option is the one with the lowest cost per acceptable outcome among the options that save money against the manual baseline over the period.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const o of model.rubric) {
    // One outcome name already ends in a full stop; do not add a second.
    const name = o.name.endsWith('.') ? o.name : `${o.name}.`;
    w.ensure(40);
    w.labelled(o.active ? '•' : ' ', `${name} ${o.when}. ${o.what}`, { size: 9.5, gutter: 14, font: o.active ? bold : body, color: o.active ? INK : QUIET });
    w.gap(5);
  }
  w.gap(8);
  w.rule();

  // ---- the nine lines and the limits --------------------------------------
  w.ensure(40 + w.heightOf(model.forgotten.join(' · '), body, 9.5));
  w.text('The nine lines teams leave out', { font: bold, size: 13 });
  w.gap(4);
  w.text(model.forgotten.map((f) => f.toLowerCase()).join(' · '), { size: 9.5 });
  w.gap(10);
  w.ensure(40 + w.heightOf(model.limits[0], body, 9.5, MEASURE - 14));
  w.text('What this model does not price', { font: bold, size: 13 });
  w.gap(4);
  for (const l of model.limits) {
    w.labelled('•', l, { size: 9.5, gutter: 14 });
    w.gap(2);
  }
  w.gap(10);

  // ---- join the cohort, on an ember panel with ink text ---------------------
  const ctaH =
    pad * 2 +
    w.heightOf(model.cta.heading, bold, 15, inner) +
    6 +
    model.cta.lines.reduce((h, l) => h + w.heightOf(l, body, 10, inner) + 4, 0) +
    6 +
    w.heightOf(`${model.cta.action} ${model.cta.url}`, bold, 10, inner);
  w.panel(ctaH, EMBER, 10);
  const panelTop = w.cursor;
  w.gap(pad);
  w.text(model.cta.heading, { font: bold, size: 15, indent: pad, width: inner });
  w.gap(6);
  for (const l of model.cta.lines) {
    w.text(l, { size: 10, indent: pad, width: inner });
    w.gap(4);
  }
  w.gap(6);
  w.text(`${model.cta.action} ${model.cta.url}`, { font: bold, size: 10, indent: pad, width: inner });
  // The whole panel is the link, so a reader does not have to hit one line.
  w.link(MARGIN.left, panelTop, MEASURE, ctaH, model.cta.url);
  w.gap(pad + 6);

  w.finish(model.footer);
  const bytes = await doc.save();

  // Stage 3's own check: the bytes open as a PDF with the pages we drew.
  const reopened = await PDFDocument.load(bytes);
  const pages = reopened.getPageCount();
  checks.push({ name: `File opens as a PDF (${pages} pages)`, ok: pages >= 3 && reopened.getTitle() === `${TOOL_NAME} — your model` });
  if (!checks[checks.length - 1].ok) throw new Error('PDF check failed: file did not reopen as expected');

  return { bytes, checks };
}
