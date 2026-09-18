// The PDF of a filled Agent Authority Review.
//
// Built on the server with pdf-lib through the shared `Writer` in
// pdf-writer.ts (read its head for the two limits on what it can print). The
// text comes from `src/data/authority-review.ts`, the same module the page
// renders from, and every owner comes from `readRow()`, the same function the
// page's script uses. The PDF cannot say something the page does not.

import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  EVIDENCE_CHOICES,
  FIELD_MAX,
  HEADLINE,
  JUDGMENT_CHOICES,
  MAX_ROWS,
  PROTOCOL_FINDING,
  REPEAT_CHOICES,
  RUBRIC,
  TOOL_NAME,
  UNDO_EXPLAINED,
  UNDO_LEVELS,
  UNDO_SCALE,
  readRow,
  readSheet,
  type EvidenceAnswer,
  type JudgmentAnswer,
  type RepeatAnswer,
  type SheetRow,
  type UndoLevel,
} from '../../data/authority-review';

import { DANGER, INK, MARGIN, MEASURE, QUIET, RULE, SUN, Writer } from './pdf-writer';

export interface AuthorityPdfInput {
  rows: SheetRow[];
  /** The name typed into the request form. Printed on the cover line. */
  name: string;
  /** ISO date the copy was built, printed on the cover line. */
  builtOn: string;
}

const oneOf = <T extends string>(allowed: readonly T[], v: unknown): T | null | undefined => {
  if (v === null || v === undefined || v === '') return null;
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
};

const text = (v: unknown, max: number): string | undefined => {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') return undefined;
  return v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
};

/**
 * Validate a posted sheet. Anything malformed is refused, not coerced: a
 * field with the wrong type, an unknown answer, or more rows than the page
 * itself allows. Empty rows are dropped, since the page does not count them.
 */
export function parseSheet(value: unknown): SheetRow[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ROWS) return null;
  const out: SheetRow[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const step = text(r.step, FIELD_MAX.step);
    const evidence = text(r.evidence, FIELD_MAX.evidence);
    const limit = text(r.limit, FIELD_MAX.limit);
    const missing = text(r.missing, FIELD_MAX.missing);
    const checked = oneOf<EvidenceAnswer>(['confirmed', 'guessed'], r.checked);
    const judgment = oneOf<JudgmentAnswer>(['one', 'disagree'], r.judgment);
    const undo = oneOf<UndoLevel>(UNDO_LEVELS, r.undo);
    const repeat = oneOf<RepeatAnswer>(['known', 'unknown'], r.repeat);
    if ([step, evidence, limit, missing, checked, judgment, undo, repeat].some((v) => v === undefined)) return null;
    const row: SheetRow = {
      step: step!,
      evidence: evidence!,
      limit: limit!,
      missing: missing!,
      checked: checked!,
      judgment: judgment!,
      undo: undo!,
      repeat: repeat!,
    };
    const used =
      row.step || row.evidence || row.limit || row.missing || row.checked || row.judgment || row.undo || row.repeat;
    if (used) out.push(row);
  }
  return out.length ? out : null;
}

const labelOf = <T extends string>(choices: { value: T; label: string }[], v: T | null) =>
  v === null ? 'not answered' : (choices.find((c) => c.value === v)?.label ?? v);

export async function renderAuthorityReviewPdf(input: AuthorityPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${TOOL_NAME} — ${HEADLINE}`);
  doc.setAuthor('The Living Craft');
  doc.setProducer('learning.thelivingcraft.ai');
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, body, bold);

  const read = readSheet(input.rows);
  const built = new Date(input.builtOn);
  const dateLine = Number.isNaN(built.getTime())
    ? ''
    : built.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // ---- cover block --------------------------------------------------------
  w.text(HEADLINE, { font: bold, size: 22, lh: 1.15 });
  w.gap(2);
  w.text(`${TOOL_NAME}. Which steps of a workflow an agent may own, which it may only suggest on, and which stay as code.`, {
    size: 10.5,
    color: QUIET,
  });
  w.gap(6);
  w.text(
    [
      input.name ? `Assessed by ${input.name}` : null,
      dateLine || null,
      'learning.thelivingcraft.ai/resources/agent-authority-review',
    ]
      .filter(Boolean)
      .join('  ·  '),
    { size: 8.5, color: QUIET },
  );
  w.gap(14);
  w.rule();

  // ---- the result ---------------------------------------------------------
  w.text('Result', { font: bold, size: 13 });
  w.gap(6);
  w.text(`${read.decided} of ${read.total} steps decided  —  ${read.outcome.name}`, {
    font: bold,
    size: 16,
    color: read.outcome.key === 'stop' ? DANGER : INK,
  });
  w.gap(4);
  w.text(read.outcome.what, { size: 10 });
  w.gap(8);

  const tally: [string, number, string][] = [
    ['Code', read.counts.code, 'a rule, no model in the path'],
    ['Agent acts', read.counts.agent, read.agentCeiling ? `highest undo cost ${read.agentCeiling}, once the eval set exists` : 'needs an eval set first'],
    ['Human approves', read.counts.suggest, 'the agent suggests only'],
    ['Stop', read.counts.stop, 'repeat behaviour unknown'],
  ];
  for (const [k, n, note] of tally) {
    w.labelled(String(n), `${k}: ${note}`, { size: 10, gutter: 24, labelColor: k === 'Stop' && n ? DANGER : INK });
  }
  w.gap(6);

  // ---- before you hand anything over -------------------------------------
  const checks: { n: string; stop?: boolean; line: string }[] = [];
  const nameOf = (i: number) => input.rows[i].step || 'Untitled step';
  for (const i of read.stopped) {
    checks.push({ n: String(i + 1).padStart(2, '0'), stop: true, line: `${nameOf(i)}: repeat unknown. ${RUBRIC.find((r) => r.key === 'stop')!.body}` });
  }
  for (const i of read.irreversible) {
    const lim = input.rows[i].limit;
    checks.push({
      n: String(i + 1).padStart(2, '0'),
      line: `${nameOf(i)}: cannot be undone (R3). ${lim ? `Name the person who owns it. The hard limit reads: "${lim}"` : 'Name the person who owns it, and write that name into the hard limit.'}`,
    });
  }
  for (const i of read.assumed) {
    checks.push({
      n: String(i + 1).padStart(2, '0'),
      line: `${nameOf(i)}: the input is assumed. Every check after this step is for show until the input is confirmed from the system of record.`,
    });
  }
  if (read.counts.agent) {
    checks.push({
      n: '·',
      line: `${read.counts.agent} ${read.counts.agent === 1 ? 'step needs an eval set' : 'steps need eval sets'} before the agent is built. Real cases from production with known-correct outcomes, not invented ones.`,
    });
  }
  if (checks.length) {
    w.gap(4);
    w.text('Before you hand anything over', { font: bold, size: 13 });
    w.gap(6);
    for (const c of checks) {
      w.labelled(c.n, c.line, { size: 9.5, gutter: 24, labelColor: c.stop ? DANGER : QUIET });
      w.gap(3);
    }
  }

  w.gap(10);
  w.rule();

  // ---- the sheet, one block per step --------------------------------------
  w.text('Your assessment', { font: bold, size: 13 });
  w.gap(2);
  w.text('Each step, the answers you gave, and the owner the rubric assigns.', { size: 9.5, color: QUIET });
  w.gap(10);

  input.rows.forEach((r, i) => {
    const rr = readRow(r);
    const num = String(i + 1).padStart(2, '0');
    const lines: [string, string][] = [
      ['Evidence', `${r.evidence || 'not written'}  (${labelOf(EVIDENCE_CHOICES, r.checked)})`],
      ['Judgment', labelOf(JUDGMENT_CHOICES, r.judgment)],
      ['Undo cost', r.undo ? `${r.undo}  ${UNDO_SCALE.find((b) => b.level === r.undo)!.short}` : 'not answered'],
      ['Repeat', labelOf(REPEAT_CHOICES, r.repeat)],
    ];
    if (r.limit) lines.push(['Hard limit', r.limit]);
    if (r.missing) lines.push(['If missing', r.missing]);

    const need =
      w.heightOf(r.step || 'Untitled step', bold, 10.5, MEASURE - 24) +
      lines.reduce((h, [, v]) => h + w.heightOf(v, body, 9.5, MEASURE - 90) + 3, 0) +
      rr.flags.reduce((h, f) => h + w.heightOf(f, body, 9, MEASURE - 90) + 3, 0) +
      40;
    w.ensure(need);

    const top = w.cursor;
    w.marker(MARGIN.left - 14, top - 2, 8, rr.key === 'stop' ? DANGER : rr.key === 'incomplete' ? RULE : SUN);
    w.labelled(num, `${r.step || 'Untitled step'}  ->  ${rr.owner}`, { size: 10.5, gutter: 24, font: bold });
    w.gap(3);
    for (const [k, v] of lines) {
      w.field(k, v);
      w.gap(3);
    }
    for (const f of rr.flags) {
      w.text(`! ${f}`, { size: 9, indent: 90, color: DANGER });
      w.gap(3);
    }
    w.gap(8);
  });

  w.rule();

  // ---- the rubric ---------------------------------------------------------
  w.ensure(120);
  w.text('The rubric', { font: bold, size: 13 });
  w.gap(2);
  w.text('How three answers become one owner. Applied only once a row is full, never while filling it.', { size: 9.5, color: QUIET });
  w.gap(8);
  // Same order as the page: the three routing rules, then the stop rule.
  const rubricDisplay = [...RUBRIC.filter((r) => r.key !== 'stop'), ...RUBRIC.filter((r) => r.key === 'stop')];
  for (const rule of rubricDisplay) {
    w.ensure(50);
    w.text(`${rule.when}  ->  ${rule.owner}`, { font: bold, size: 10, color: rule.key === 'stop' ? DANGER : INK });
    w.text(`May: ${rule.may}`, { size: 9.5, indent: 12 });
    w.text(rule.body, { size: 9.5, indent: 12, color: QUIET });
    w.gap(6);
  }

  w.gap(4);
  w.rule();

  // ---- undo cost ----------------------------------------------------------
  w.ensure(120);
  w.text('Undo cost: the score', { font: bold, size: 13 });
  w.gap(6);
  for (const e of UNDO_EXPLAINED) {
    w.ensure(40);
    w.text(e.lead, { font: bold, size: 9.5 });
    w.text(e.body, { size: 9.5, color: QUIET });
    w.gap(5);
  }
  w.gap(4);
  for (const b of UNDO_SCALE) {
    w.ensure(30);
    w.labelled(b.level, `${b.headline} ${b.examples}`, { size: 9.5, gutter: 28, labelColor: b.level === 'R3' ? DANGER : INK });
    w.gap(4);
  }

  w.gap(8);
  w.text(PROTOCOL_FINDING, { size: 9.5, color: QUIET });

  w.finish(`${TOOL_NAME} · The Living Craft · free to use and to pass on`);
  return doc.save();
}
