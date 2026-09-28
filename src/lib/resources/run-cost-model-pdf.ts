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
// The brand lives in pdf-writer.ts and nowhere else: the ivory weave cover,
// the paper inner pages with a weave band, the lockup (the LC mark and the
// lettering, as BrandLockup.astro draws them), Source Serif 4 for the title
// and Figtree for everything else, and the colours of design system v1. Read
// its head before changing how a page looks. What this file decides is which
// colour marks what:
//
//   * forest marks the leading option, and fills the cohort panel at the end,
//     with ivory text on it;
//   * the result sits on a soft green panel (--lc-soft), as the enterprise
//     facts do on `/`;
//   * the error red (--lc-error) sets an option that never pays back. This
//     tool has no hard gate.
//
// A character the embedded fonts cannot draw is dropped by `clean()`. Our own
// copy must lose nothing to that, and a check says so; a typed name or a
// typed currency label may. The rupee sign is drawn as ₹, not as "INR".
//
// The inputs are used for the file and are not stored. `parseInputs()`
// refuses anything that is not the exact shape the page posts.

import { PDFDocument } from 'pdf-lib';
import {
  ARMS,
  ARM_ROWS,
  BLOCK_KEYS,
  EXAMPLE_STORY,
  FORGOTTEN_ROWS,
  INPUT_COUNT,
  MAX_VALUE,
  working,
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

import {
  ERROR,
  FOREST,
  INK,
  IVORY,
  MARGIN,
  MEASURE,
  MUTED,
  SOFT,
  Writer,
  brandedPages,
  clean,
  drawsWhole,
  openBrandedDoc,
  type Column,
} from './pdf-writer';

export interface RunCostPdfInput {
  inputs: ModelInputs;
  /** True when the page had the reference example loaded unchanged, so the file can say so. */
  isExample: boolean;
  /** The name typed into the request form. Printed on the cover line. */
  name: string;
  /** ISO date the copy was built, printed on the cover line. */
  builtOn: string;
}

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
    rows: { key: ArmComputedKey; label: string; cells: string[]; strong: boolean; working: string[] }[];
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
    rows: { label: string; unit: string; forgotten: boolean; computed: boolean; cells: string[]; working?: string[] }[];
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
        // The formula with the figures in, one per option, so the figure above it can be checked by hand.
        working: r.arms.map((a) => working(row.key, input.inputs, r, a.key, cur) ?? '—'),
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
          working:
            s.scope === 'shared'
              ? [working(row.key, input.inputs, r, null, cur) ?? '—']
              : r.arms.map((a) => working(row.key, input.inputs, r, a.key, cur) ?? '—'),
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

  const { doc, brand } = await openBrandedDoc({ title: `${TOOL_NAME} — your model`, subject: model.subtitle });
  const { body, bold } = brand;
  // Page 1 is the ivory cover; every later page is paper with a weave band.
  const decorate = brandedPages(brand, { series: model.series, title: model.title, subtitle: model.subtitle, credit: model.credit });
  const w = new Writer(doc, brand, decorate);
  const lead = model.result.leadKey;

  // ---- cover line ---------------------------------------------------------
  w.text(model.coverLine, { size: 8.5, color: MUTED });
  if (model.exampleLine) {
    w.gap(3);
    w.text(model.exampleLine, { size: 8.5, color: MUTED });
  }
  w.gap(14);

  // ---- the result, on a soft green panel (--lc-soft) -----------------------
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
  w.panel(resultH, SOFT);
  w.gap(pad);
  w.text('Result', { font: bold, size: 9, color: MUTED, indent: pad, width: inner });
  w.gap(6);
  w.text(model.result.outcomeName, { font: bold, size: 16, indent: pad, width: inner, color: model.result.outcomeKey === 'manual' ? ERROR : INK });
  w.gap(4);
  if (model.result.leadLine) {
    w.text(model.result.leadLine, { size: 10, indent: pad, width: inner });
    w.gap(3);
  }
  w.text(model.result.what, { size: 10, indent: pad, width: inner });
  if (model.result.flags.length) w.gap(4);
  for (const f of model.result.flags) {
    w.text(f.text, { size: 9.5, indent: pad, width: inner, font: bold, color: f.key === 'disagree' ? INK : ERROR });
    w.gap(4);
  }
  w.gap(pad + 8);

  // ---- the comparison table -----------------------------------------------
  const header = (cols: Column[], names: string[]) => {
    w.columns(['', ...names], cols, { size: 8.5, font: bold, color: MUTED });
    w.gap(2);
  };
  // The heading, the legend, the column header and the first three rows travel together.
  w.ensure(60 + w.heightOf(model.comparison.legend, body, 8.5) + 3 * 16);
  w.text('The comparison', { font: bold, size: 13 });
  w.gap(2);
  w.text('Every option on the same cases and one definition of an acceptable outcome. The number to argue about is cost per acceptable outcome.', { size: 9.5, color: MUTED });
  w.gap(4);
  w.text(model.comparison.legend, { size: 8.5, color: MUTED });
  w.gap(6);
  header(COLS, model.comparison.columns);
  for (const row of model.comparison.rows) {
    const bad = (i: number) => {
      const k = ARMS[i].key;
      return (row.key === 'net' && (model.numbers.arms[k].net ?? 0) < 0) || (row.key === 'breakEven' && model.numbers.breakEvenState[k] === 'never');
    };
    // A row and its working stay on one page together.
    w.ensure(9 * 1.4 + row.working.reduce((h, t) => h + w.heightOf(t, body, 7.5, MEASURE - 44), 0) + 8);
    if (row.strong && lead) {
      // The leading option's figure carries the forest mark, as the page marks it.
      const i = ARMS.findIndex((a) => a.key === lead);
      const x = MARGIN.left + COLS[i + 1].x + COLS[i + 1].w - bold.widthOfTextAtSize(clean(row.cells[i]), 9) - 12;
      w.marker(x, w.cursor - 1, 7, FOREST);
    }
    w.columns([row.label, ...row.cells], COLS, {
      size: 9,
      fonts: [row.strong ? bold : body, ...ARMS.map((a) => (row.strong && a.key === lead ? bold : body))],
      colors: [INK, ...ARMS.map((_, i) => (bad(i) ? ERROR : INK))],
    });
    // The working, one line per option, under the figures it explains.
    for (let i = 0; i < ARMS.length; i++) {
      w.labelled(ARMS[i].short, row.working[i], { size: 7.5, gutter: 44, color: MUTED, labelColor: MUTED });
    }
    w.gap(4);
  }
  w.gap(4);
  w.text(model.comparison.baselineLine, { size: 9, color: MUTED });

  // ---- where the money goes -----------------------------------------------
  if (model.breakdown) {
    w.gap(10);
    w.ensure(50 + (model.breakdown.length + 1) * 16);
    w.text('Where the run cost goes, per month', { font: bold, size: 13 });
    w.gap(2);
    w.text('The largest block for each option is the assumption to measure first.', { size: 9.5, color: MUTED });
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
    w.text('The leading option first, then the full agent, then the rest. Each one is a line that decides the answer and is usually guessed.', { size: 9.5, color: MUTED });
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
  w.text('Every line as you typed it, with the model’s own line under the inputs that feed it. Lines marked • are the nine most business cases leave out.', { size: 9.5, color: MUTED });
  w.gap(8);

  for (const s of model.inputs) {
    const cols = s.scope === 'shared' ? IN_SHARED_COLS : IN_COLS;
    // A section heading never sits alone at the foot of a page: it moves with
    // its column header and its first two rows, and a short section moves whole.
    const keep = s.rows.length <= 4 ? s.rows : s.rows.slice(0, 2);
    const keepH = keep.reduce((h, r) => h + w.rowHeight(r.label, cols) + 2, 0);
    w.ensure(12 * 1.4 + 10 * 1.4 + 6 + 8.5 * 1.35 + 2 + keepH + 12);
    w.text(`${s.num}  ${s.name}`, { font: bold, size: 12 });
    w.text(s.question, { size: 10, color: MUTED });
    w.gap(6);
    w.columns(['', 'Unit', ...s.columns], cols, { size: 8.5, font: bold, color: MUTED });
    w.gap(2);
    for (const r of s.rows) {
      if (r.working) w.ensure(9 * 1.4 + r.working.reduce((h, t) => h + w.heightOf(t, body, 7.5, MEASURE - 44), 0) + 6);
      w.columns([`${r.forgotten ? '• ' : ''}${r.label}`, r.unit, ...r.cells], cols, {
        size: 9,
        font: r.computed ? bold : body,
        color: r.computed ? MUTED : INK,
        colors: [r.computed ? MUTED : INK, MUTED],
      });
      if (r.working) {
        for (let i = 0; i < r.working.length; i++) {
          w.labelled(s.scope === 'shared' ? '=' : ARMS[i].short, r.working[i], { size: 7.5, gutter: 44, color: MUTED, labelColor: MUTED });
        }
      }
      w.gap(2);
    }
    w.gap(8);
  }
  w.rule();

  // ---- the rubric ---------------------------------------------------------
  w.ensure(60 + model.rubric.slice(0, 2).reduce((h, o) => h + w.heightOf(`${o.name} ${o.when}. ${o.what}`, body, 9.5, MEASURE - 14) + 5, 0));
  w.text('How the outcome is read', { font: bold, size: 13 });
  w.gap(2);
  w.text('The leading option is the one with the lowest cost per acceptable outcome among the options that save money against the manual baseline over the period.', { size: 9.5, color: MUTED });
  w.gap(8);
  for (const o of model.rubric) {
    // One outcome name already ends in a full stop; do not add a second.
    const name = o.name.endsWith('.') ? o.name : `${o.name}.`;
    w.ensure(40);
    w.labelled(o.active ? '•' : ' ', `${name} ${o.when}. ${o.what}`, { size: 9.5, gutter: 14, font: o.active ? bold : body, color: o.active ? INK : MUTED });
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

  // ---- join the cohort, on a forest panel with ivory text ---------------------
  const ctaH =
    pad * 2 +
    w.heightOf(model.cta.heading, bold, 15, inner) +
    6 +
    model.cta.lines.reduce((h, l) => h + w.heightOf(l, body, 10, inner) + 4, 0) +
    6 +
    w.heightOf(`${model.cta.action} ${model.cta.url}`, bold, 10, inner);
  w.panel(ctaH, FOREST, 10);
  const panelTop = w.cursor;
  w.gap(pad);
  w.text(model.cta.heading, { font: bold, size: 15, indent: pad, width: inner, color: IVORY });
  w.gap(6);
  for (const l of model.cta.lines) {
    w.text(l, { size: 10, indent: pad, width: inner, color: IVORY });
    w.gap(4);
  }
  w.gap(6);
  w.text(`${model.cta.action} ${model.cta.url}`, { font: bold, size: 10, indent: pad, width: inner, color: IVORY });
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
