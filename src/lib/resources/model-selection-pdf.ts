// The PDF of a scored Model Selection Tool.
//
// Built on the server with pdf-lib through the shared `Writer` in
// pdf-writer.ts (read its head for the two limits on what it can print). The
// text comes from `src/data/model-selection-tool.ts`, the same module the page
// renders from, and the outcome comes from `readAssessment()`, the same
// function the page's script uses. The PDF cannot say something the page does
// not.

import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  CASE_SHAPES,
  CRITERIA,
  CRITERIA_COUNT,
  CUT_LINES,
  DISQUALIFIERS,
  DQ_COUNT,
  GATES,
  GATE_COUNT,
  ANSWER_COUNT,
  OWN_WEIGHT_MAX,
  OWN_WEIGHT_ROWS,
  PROFILES,
  TOOL_NAME,
  caseFor,
  readAssessment,
  weightOf,
  type Assessment,
} from '../../data/model-selection-tool';

import { DANGER, INK, MARGIN, MEASURE, QUIET, SUN, Writer } from './pdf-writer';

export interface ModelSelectionPdfInput {
  assessment: Assessment;
  /** The name typed into the request form. Printed on the cover line. */
  name: string;
  /** ISO date the copy was built, printed on the cover line. */
  builtOn: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Validate a posted assessment. Anything else is refused, not coerced: a
 * shape this function does not recognise is not one the page produced.
 */
export function parseAssessment(value: unknown): Assessment | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;

  const profile = v.profile;
  if (profile !== null && profile !== 0 && profile !== 1 && profile !== 2) return null;

  const list = (x: unknown, n: number, allowed: number[]): (number | null)[] | null => {
    if (!Array.isArray(x) || x.length !== n) return null;
    const out: (number | null)[] = [];
    for (const item of x) {
      if (item === null) out.push(null);
      else if (typeof item === 'number' && allowed.includes(item)) out.push(item);
      else return null;
    }
    return out;
  };

  const gates = list(v.gates, GATE_COUNT, [0, 1]);
  const scores = list(v.scores, CRITERIA_COUNT, [0, 1, 2]);
  const dq = list(v.dq, DQ_COUNT, [0, 1]);
  if (!gates || !scores || !dq) return null;

  if (!Array.isArray(v.own) || v.own.length !== OWN_WEIGHT_ROWS.length) return null;
  const own: number[] = [];
  for (const w of v.own) {
    if (typeof w !== 'number' || !Number.isInteger(w) || w < 1 || w > OWN_WEIGHT_MAX) return null;
    own.push(w);
  }

  return { profile: profile as number | null, gates, scores, own, dq };
}

export async function renderModelSelectionPdf(input: ModelSelectionPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${TOOL_NAME} — scored copy`);
  doc.setAuthor('The Living Craft');
  doc.setProducer('learning.thelivingcraft.ai');
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, body, bold);

  const a = input.assessment;
  const r = readAssessment(a);
  const built = new Date(input.builtOn);
  const dateLine = Number.isNaN(built.getTime())
    ? ''
    : built.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // ---- cover block --------------------------------------------------------
  w.text(TOOL_NAME, { font: bold, size: 22, lh: 1.15 });
  w.gap(2);
  w.text('Is this model fit for this step? One candidate, one step, scored from your own test runs.', {
    size: 10.5,
    color: QUIET,
  });
  w.gap(6);
  w.text(
    [
      input.name ? `Scored by ${input.name}` : null,
      dateLine || null,
      'learning.thelivingcraft.ai/resources/model-selection-tool',
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

  const danger = r.band?.key === 'gate' || r.band?.key === 'dq' || r.band?.key === 'stop';
  const scoreLine = r.pct === null ? 'No score yet' : `${r.pct}%`;
  const bandName = r.band ? r.band.name : 'Incomplete';
  w.text(`${scoreLine}  —  ${bandName}`, { font: bold, size: 16, color: danger ? DANGER : INK });
  w.gap(4);

  if (r.band) {
    w.text(r.band.what, { size: 10 });
  } else {
    const left = ANSWER_COUNT - r.answered;
    w.text(
      `${left} ${left === 1 ? 'answer is' : 'answers are'} missing, so there is no outcome yet. A blank row in section C counts as 0. Give every answer to read the result against the rubric.`,
      { size: 10 },
    );
  }
  w.gap(8);

  w.labelled('A', `The step: ${a.profile === null ? 'not chosen' : PROFILES[a.profile].name}`, { size: 10, gutter: 18 });
  w.labelled('B', `Deployment gates: ${r.gatesPassed} / ${GATE_COUNT} pass${r.gatesFailed.length ? `, ${r.gatesFailed.length} fail` : ''}`, { size: 10, gutter: 18 });
  w.labelled('C', `Behaviour under test: ${r.total === null ? '—' : `${r.total} / ${r.max} weighted`}`, { size: 10, gutter: 18 });
  w.labelled('D', `Disqualifiers: ${r.dqHit.length} hit`, { size: 10, gutter: 18 });
  w.gap(6);

  if (r.gatesFailed.length) {
    const names = r.gatesFailed.map((i) => `B${i + 1} ${GATES[i].short}`).join(', ');
    w.text(`Section B fails on ${names}. This ends the candidate whatever the score.`, { size: 10, color: DANGER, font: bold });
    w.gap(4);
  }
  if (r.dqHit.length) {
    const names = r.dqHit.map((i) => `D${i + 1} ${DISQUALIFIERS[i].short}`).join(', ');
    w.text(`Section D: ${names} happened. This ends the candidate whatever the score.`, { size: 10, color: DANGER, font: bold });
    w.gap(4);
  }

  // ---- before you choose --------------------------------------------------
  if (r.weak.length) {
    w.gap(4);
    w.text('Before you choose', { font: bold, size: 13 });
    w.gap(4);
    w.text(
      'Rows scored 0 first, then 1, heaviest weight first. A row scored 1 needs a named cover before it is accepted; a row scored 0 needs a fix or a narrower step.',
      { size: 9.5, color: QUIET },
    );
    w.gap(6);
    for (const x of r.weak) {
      const c = CRITERIA[x.i];
      const cs = caseFor(x.i + 1);
      const line = `${c.short}, scored ${x.v}${x.w === null ? '' : `, weight ${x.w}`}. ${c.a[x.v]}${cs ? ` Evidence: case ${cs.n}, ${cs.name.toLowerCase()}.` : ''}`;
      w.labelled(`C${pad(x.i + 1)}`, line, { size: 9.5, gutter: 30, labelColor: x.v === 0 ? DANGER : QUIET });
      w.gap(3);
    }
  }

  w.gap(10);
  w.rule();

  // ---- A · the step -------------------------------------------------------
  w.ensure(120);
  w.text('Your answers', { font: bold, size: 13 });
  w.gap(2);
  w.text('Each row, the answer you chose, and what the other answers would have needed.', { size: 9.5, color: QUIET });
  w.gap(10);

  w.text('A  The step', { font: bold, size: 12 });
  w.text('What job is this model being staffed on?', { size: 10, color: QUIET });
  w.gap(8);
  PROFILES.forEach((p, k) => {
    const chosen = a.profile === k;
    if (chosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, SUN);
    w.text(`${p.name}. ${p.cost}`, { size: 9.5, indent: 38, font: chosen ? bold : body, color: chosen ? INK : QUIET });
    w.gap(3);
  });
  if (a.profile === null) w.text('Not chosen. Section C has no weights until it is.', { size: 9, indent: 38, color: DANGER });
  w.gap(10);

  // ---- B · gates ----------------------------------------------------------
  const gateHeight = (g: (typeof GATES)[number]) =>
    w.heightOf(g.q, bold, 10.5, MEASURE - 24) + w.heightOf(g.passes, body, 9.5, MEASURE - 44) + 26;
  w.ensure(44 + gateHeight(GATES[0]));
  w.text('B  Deployment gates  (hard gate)', { font: bold, size: 12 });
  w.text('Can this model be deployed where you need it, on the terms you need?', { size: 10, color: QUIET });
  w.gap(8);
  GATES.forEach((g, i) => {
    const v = a.gates[i];
    w.ensure(gateHeight(g));
    w.labelled(`B${i + 1}`, g.q, { size: 10.5, gutter: 24, font: bold });
    w.gap(3);
    const label = v === 1 ? 'Passes' : v === 0 ? 'Fails' : 'Unanswered';
    if (v !== null) w.marker(MARGIN.left + 24, w.cursor - 1, 8, v === 0 ? DANGER : SUN);
    w.text(`${label}. ${v === 0 ? g.cost : g.passes}`, {
      size: 9.5,
      indent: 38,
      font: v === null ? body : bold,
      color: v === 0 ? DANGER : v === null ? QUIET : INK,
    });
    w.gap(8);
  });
  w.gap(4);

  // ---- C · criteria -------------------------------------------------------
  const rowHeight = (c: (typeof CRITERIA)[number]) =>
    w.heightOf(c.q, bold, 10.5, MEASURE - 24) +
    c.a.reduce((h, t) => h + w.heightOf(t, body, 9.5, MEASURE - 44) + 4, 0) +
    30;
  w.ensure(44 + rowHeight(CRITERIA[0]));
  w.text('C  Behaviour under test', { font: bold, size: 12 });
  w.text('What did ten runs on your own four cases show? Weighted by the step chosen in A.', { size: 10, color: QUIET });
  w.gap(8);
  CRITERIA.forEach((c, i) => {
    const v = a.scores[i];
    const wt = weightOf(i, a);
    w.ensure(rowHeight(c));
    w.labelled(`C${pad(i + 1)}`, `${c.q}  (weight ${wt === null ? '—' : wt}${c.key ? ', marked' : ''})`, { size: 10.5, gutter: 24, font: bold });
    w.gap(3);
    c.a.forEach((t, k) => {
      const chosen = v === k;
      if (chosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, SUN);
      w.text(`${k}  ${t}`, { size: 9.5, indent: 38, font: chosen ? bold : body, color: chosen ? INK : QUIET });
      w.gap(3);
    });
    if (v === null) w.text('Unanswered. Counts as 0.', { size: 9, indent: 38, color: DANGER });
    w.gap(8);
  });
  w.gap(4);

  // ---- D · disqualifiers --------------------------------------------------
  const dqHeight = (d: (typeof DISQUALIFIERS)[number]) =>
    w.heightOf(d.q, bold, 10.5, MEASURE - 24) + w.heightOf(d.why, body, 9.5, MEASURE - 44) + 26;
  w.ensure(44 + dqHeight(DISQUALIFIERS[0]));
  w.text('D  Disqualifiers  (hard gate)', { font: bold, size: 12 });
  w.text('Did it do the one thing that ends a candidate?', { size: 10, color: QUIET });
  w.gap(8);
  DISQUALIFIERS.forEach((d, i) => {
    const v = a.dq[i];
    w.ensure(dqHeight(d));
    w.labelled(`D${i + 1}`, d.q, { size: 10.5, gutter: 24, font: bold });
    w.gap(3);
    const label = v === 1 ? 'Happened' : v === 0 ? 'Did not happen' : 'Unanswered';
    if (v !== null) w.marker(MARGIN.left + 24, w.cursor - 1, 8, v === 1 ? DANGER : SUN);
    w.text(`${label}. ${d.why}`, {
      size: 9.5,
      indent: 38,
      font: v === null ? body : bold,
      color: v === 1 ? DANGER : v === null ? QUIET : INK,
    });
    w.gap(8);
  });

  w.rule();

  // ---- the rubric ---------------------------------------------------------
  w.ensure(60 + CUT_LINES.slice(0, 2).reduce((h, c) => h + w.heightOf(`${c.name}. ${c.what}`, body, 9.5, MEASURE - 80) + 5, 0));
  w.text('The rubric', { font: bold, size: 13 });
  w.gap(2);
  w.text(
    'The two gates are checked first and ignore the score. The percentage is the weighted score over the weighted maximum for the step chosen.',
    { size: 9.5, color: QUIET },
  );
  w.gap(8);
  for (const c of CUT_LINES) {
    w.ensure(40);
    w.labelled(c.score, `${c.name}. ${c.what}`, {
      size: 9.5,
      gutter: 80,
      labelColor: c.key === 'gate' || c.key === 'dq' ? DANGER : QUIET,
    });
    w.gap(5);
  }

  w.gap(8);
  w.rule();

  // ---- the four cases -----------------------------------------------------
  w.ensure(60 + w.heightOf(CASE_SHAPES[0].build, body, 9.5, MEASURE - 30) + 40);
  w.text('The four test cases, and which rows each one is the evidence for', { font: bold, size: 13 });
  w.gap(2);
  w.text('Build each one out of your own work, not out of a benchmark.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const c of CASE_SHAPES) {
    const need = w.heightOf(c.build, body, 9.5, MEASURE - 30) + w.heightOf(c.watch, body, 9.5, MEASURE - 30) + 50;
    w.ensure(need);
    w.labelled(c.n, c.name, { size: 11, gutter: 30, font: bold, labelColor: QUIET });
    w.text(`How to build it: ${c.build}`, { size: 9.5, indent: 30 });
    w.text(`Right answer: ${c.right}`, { size: 9.5, indent: 30 });
    w.text(`${c.watchLabel}: ${c.watch}`, { size: 9.5, indent: 30, color: c.failure ? DANGER : INK });
    w.gap(2);
    w.text(`Evidence for ${c.reveals.map((n) => `C${pad(n)}`).join(', ')}`, { size: 8.5, indent: 30, color: QUIET });
    w.gap(8);
  }

  w.finish(`${TOOL_NAME} · The Living Craft · free to use and to pass on`);
  return doc.save();
}
