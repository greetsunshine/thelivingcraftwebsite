// The PDF of a filled Run-Cost Model.
//
// Built on the server through the shared `Writer` in pdf-writer.ts (read its
// head for the two limits on what it can print). Every row, every formula and
// the outcome come from `src/data/run-cost-model.ts`, the same module the page
// renders from, through `readModel()`, the same function the page's script
// uses. The PDF cannot say a number the page does not.
//
// The inputs are used for the file and are not stored. `parseInputs()` refuses
// anything that is not the exact shape the page posts: a currency label of at
// most twelve characters and, for every row, either null or a finite number
// from 0 to a thousand million. A cost model with a negative escalation rate
// is not a model, and a value the page could not have produced is refused
// rather than coerced.

import {
  ARMS,
  ARM_ROWS,
  BLOCK_KEYS,
  EXAMPLE_STORY,
  FORGOTTEN_ROWS,
  LIMITS,
  OUTCOMES,
  SECTIONS,
  SHARED_ROWS,
  TOOL_NAME,
  TOTALS,
  armByKey,
  blankInputs,
  fmtComputed,
  fmtInput,
  fmtMoney,
  readModel,
  unitOf,
  type ArmKey,
  type ArmRowKey,
  type Cell,
  type ModelInputs,
  type SharedKey,
} from '../../data/run-cost-model';
import { DANGER, INK, MEASURE, QUIET, Writer, type Column } from './pdf-writer';

export interface RunCostPdfInput {
  inputs: ModelInputs;
  /** True when the page had the reference example loaded unchanged, so the PDF can say so. */
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

// Five columns: the row label, then one per option. Widths sum to MEASURE.
const LABEL_W = 175;
const ARM_W = (MEASURE - LABEL_W) / ARMS.length;
const COLS: Column[] = [
  { x: 0, w: LABEL_W - 8 },
  ...ARMS.map((_, i) => ({ x: LABEL_W + i * ARM_W, w: ARM_W - 6, align: 'right' as const })),
];

// The breakdown carries a share beside every amount, so its label column is
// narrower to give each option the room. Blocks print in the order the model
// adds them up, not sorted, so the rows line up across options.
const BLOCK_LABEL_W = 105;
const BLOCK_ARM_W = (MEASURE - BLOCK_LABEL_W) / ARMS.length;
const BLOCK_COLS: Column[] = [
  { x: 0, w: BLOCK_LABEL_W - 8 },
  ...ARMS.map((_, i) => ({ x: BLOCK_LABEL_W + i * BLOCK_ARM_W, w: BLOCK_ARM_W - 6, align: 'right' as const })),
];
const BLOCK_ORDER = BLOCK_KEYS;

export async function renderRunCostModelPdf(input: RunCostPdfInput): Promise<Uint8Array> {
  const { doc, w } = await Writer.open({ title: `${TOOL_NAME} — your model` });
  const { body, bold } = w;
  const r = readModel(input.inputs);
  const cur = input.inputs.currency;
  const built = new Date(input.builtOn);
  const dateLine = Number.isNaN(built.getTime())
    ? ''
    : built.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // ---- cover block --------------------------------------------------------
  w.text(TOOL_NAME, { font: bold, size: 22, lh: 1.15 });
  w.gap(2);
  w.text('Four ways to do the same job, costed over one period, with the operating lines most business cases leave out.', {
    size: 10.5,
    color: QUIET,
  });
  w.gap(6);
  w.text(
    [
      input.name ? `Modelled by ${input.name}` : null,
      dateLine || null,
      'learning.thelivingcraft.ai/resources/run-cost-model',
    ]
      .filter(Boolean)
      .join('  ·  '),
    { size: 8.5, color: QUIET },
  );
  if (input.isExample) {
    w.gap(4);
    w.text(`This copy holds the reference example, ${EXAMPLE_STORY.title.toLowerCase()}, unchanged. The figures are illustrative and composite.`, { size: 8.5, color: QUIET });
  }
  w.gap(14);
  w.rule();

  // ---- the result ---------------------------------------------------------
  w.text('Result', { font: bold, size: 13 });
  w.gap(6);

  if (r.outcome) {
    const lead = r.leader ? armByKey(r.leader) : null;
    const leadArm = r.arms.find((a) => a.key === r.leader);
    w.text(r.outcome.name, { font: bold, size: 16, color: r.outcome.key === 'manual' ? DANGER : INK });
    w.gap(4);
    if (lead && leadArm) {
      w.text(
        `Leading option: ${lead.name}, at ${fmtMoney(leadArm.values.perOutcome, cur, true)} per acceptable outcome. Net position against doing it by hand: ${fmtMoney(leadArm.values.net, cur)} over ${fmtInput(input.inputs.shared.months)} months.`,
        { size: 10 },
      );
      w.gap(3);
    }
    w.text(r.outcome.what, { size: 10 });
  } else {
    const left = r.totalInputs - r.filled;
    w.text('Incomplete', { font: bold, size: 16, color: QUIET });
    w.gap(4);
    w.text(
      `${left} ${left === 1 ? 'line is' : 'lines are'} blank, so there is no outcome yet. A blank line is unknown, not zero, and every total that depends on it stays blank. Fill every line to read the result against the rubric.`,
      { size: 10 },
    );
  }
  w.gap(8);

  for (const f of r.flags) {
    w.text(f.text, { size: 9.5, color: f.key === 'disagree' ? INK : DANGER, font: f.key === 'disagree' ? bold : body });
    w.gap(4);
  }

  // ---- the comparison table -----------------------------------------------
  w.gap(6);
  const header = () => {
    w.columns(['', ...ARMS.map((a) => a.short)], COLS, { size: 8.5, font: bold, color: QUIET });
    w.gap(2);
  };
  w.ensure(30 + TOTALS.length * 16);
  w.text('The comparison', { font: bold, size: 13 });
  w.gap(2);
  w.text('Every option on the same cases and one definition of an acceptable outcome. The number to argue about is cost per acceptable outcome.', { size: 9.5, color: QUIET });
  w.gap(4);
  w.text(ARMS.map((a) => `${a.short}: ${a.legend.replace(/\.$/, '')}`).join('  \u00b7  '), { size: 8.5, color: QUIET });
  w.gap(6);
  header();
  for (const row of TOTALS) {
    const strong = row.key === 'perOutcome';
    w.columns(
      [row.label, ...r.arms.map((a) => fmtComputed(row, a.values[row.key as keyof typeof a.values], cur, a.breakEvenState))],
      COLS,
      {
        size: 9,
        fonts: [strong ? bold : body, ...r.arms.map((a) => (strong && a.key === r.leader ? bold : body))],
        colors: [INK, ...r.arms.map((a) => (row.key === 'breakEven' && a.breakEvenState === 'never' ? DANGER : row.key === 'net' && (a.values.net ?? 0) < 0 ? DANGER : INK))],
      },
    );
    w.gap(3);
  }
  w.gap(4);
  w.text(
    `Manual baseline for the period: ${fmtMoney(r.shared.values.manualBaseline, cur)} for ${fmtInput(r.shared.values.totalCases)} cases (${fmtInput(input.inputs.shared.casesPerMonth)} a month, ${fmtInput(input.inputs.shared.manualMinutes)} minutes each at ${fmtMoney(input.inputs.shared.manualRate, cur)} an hour).`,
    { size: 9, color: QUIET },
  );

  // ---- where the money goes -----------------------------------------------
  if (r.complete) {
    w.gap(10);
    w.ensure(30 + 7 * 16);
    w.text('Where the run cost goes, per month', { font: bold, size: 13 });
    w.gap(2);
    w.text('The largest block for each option is the assumption to measure first.', { size: 9.5, color: QUIET });
    w.gap(6);
    w.columns(['', ...ARMS.map((a) => a.short)], BLOCK_COLS, { size: 8.5, font: bold, color: QUIET });
    w.gap(2);
    for (const k of BLOCK_ORDER) {
      const name = r.arms[0].blocks.find((b) => b.key === k)!.name;
      w.columns(
        [
          name,
          ...r.arms.map((a) => {
            const b = a.blocks.find((x) => x.key === k)!;
            return `${fmtMoney(b.value, cur)}  (${Math.round((b.share ?? 0) * 100)}%)`;
          }),
        ],
        BLOCK_COLS,
        { size: 9 },
      );
      w.gap(3);
    }
  }

  // ---- assumptions to check -----------------------------------------------
  if (r.checks.length) {
    w.gap(10);
    w.ensure(40 + w.heightOf(r.checks[0].text, body, 9.5, MEASURE - 24));
    w.text('Check these assumptions first', { font: bold, size: 13 });
    w.gap(2);
    w.text('The leading option first, then the full agent, then the rest. Each one is a line that decides the answer and is usually guessed.', { size: 9.5, color: QUIET });
    w.gap(6);
    r.checks.forEach((c, i) => {
      w.labelled(String(i + 1).padStart(2, '0'), c.text, { size: 9.5, gutter: 24 });
      w.gap(3);
    });
  }

  w.gap(10);
  w.rule();

  // ---- your inputs --------------------------------------------------------
  w.ensure(80);
  w.text('Your inputs', { font: bold, size: 13 });
  w.gap(2);
  w.text('Every line as you typed it, with the model’s own line under the inputs that feed it. Lines marked • are the nine most business cases leave out.', { size: 9.5, color: QUIET });
  w.gap(8);

  for (const s of SECTIONS) {
    const rows = s.inputs.length + s.computed.length + 2;
    w.ensure(30 + rows * 15);
    w.text(`${s.num}  ${s.name}`, { font: bold, size: 12 });
    w.text(s.question, { size: 10, color: QUIET });
    w.gap(6);
    if (s.scope === 'shared') {
      for (const row of s.inputs) {
        w.columns([`${row.label}  (${unitOf(row.kind, cur)})`, fmtInput(input.inputs.shared[row.key as SharedKey])], [COLS[0], { x: LABEL_W, w: ARM_W - 6, align: 'right' }], { size: 9 });
        w.gap(2);
      }
      for (const row of s.computed) {
        w.columns([row.label, fmtComputed(row, r.shared.values[row.key as keyof typeof r.shared.values], cur)], [COLS[0], { x: LABEL_W, w: ARM_W - 6, align: 'right' }], { size: 9, font: bold, color: QUIET });
        w.gap(2);
      }
    } else {
      header();
      for (const row of s.inputs) {
        w.columns(
          [`${row.forgotten ? '• ' : ''}${row.label}  (${unitOf(row.kind, cur)})`, ...ARMS.map((a) => fmtInput(input.inputs.arms[a.key][row.key as ArmRowKey]))],
          COLS,
          { size: 9 },
        );
        w.gap(2);
      }
      for (const row of s.computed) {
        w.columns(
          [row.label, ...r.arms.map((a) => fmtComputed(row, a.values[row.key as keyof typeof a.values], cur, a.breakEvenState))],
          COLS,
          { size: 9, font: bold, color: QUIET },
        );
        w.gap(2);
      }
    }
    w.gap(8);
  }

  w.rule();

  // ---- the rubric ---------------------------------------------------------
  w.ensure(60 + OUTCOMES.slice(0, 2).reduce((h, o) => h + w.heightOf(`${o.name}. ${o.what}`, body, 9.5, MEASURE - 24) + 5, 0));
  w.text('How the outcome is read', { font: bold, size: 13 });
  w.gap(2);
  w.text('The leading option is the one with the lowest cost per acceptable outcome among the options that save money against the manual baseline over the period.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const o of OUTCOMES) {
    w.ensure(40);
    const active = r.outcome?.key === o.key;
    // One outcome name already ends in a full stop; do not add a second.
    const name = o.name.endsWith('.') ? o.name : `${o.name}.`;
    w.labelled(active ? '•' : ' ', `${name} ${o.when}. ${o.what}`, { size: 9.5, gutter: 14, font: active ? bold : body, color: active ? INK : QUIET });
    w.gap(5);
  }

  w.gap(8);
  w.rule();

  // ---- the nine lines and the limits --------------------------------------
  w.ensure(60);
  w.text('The nine lines teams leave out', { font: bold, size: 13 });
  w.gap(4);
  w.text(FORGOTTEN_ROWS.map((f) => f.label.toLowerCase()).join(' · '), { size: 9.5 });
  w.gap(10);
  w.text('What this model does not price', { font: bold, size: 13 });
  w.gap(4);
  for (const l of LIMITS) {
    w.labelled('•', l, { size: 9.5, gutter: 14 });
    w.gap(2);
  }

  const leaderName = r.leader ? armByKey(r.leader as ArmKey).short : '';
  w.finish(`${TOOL_NAME}${leaderName ? ` · leading option: ${leaderName}` : ''} · The Living Craft · free to use and to pass on`);
  return doc.save();
}
