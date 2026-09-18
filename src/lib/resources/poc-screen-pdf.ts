// The PDF of a scored POC Selection Tool.
//
// Built on the server with pdf-lib, which is pure JavaScript: no headless
// browser, no font files on disk, no native module, so it runs unchanged
// inside a Vercel function. The text comes from `src/data/poc-screen.ts`, the
// same module the page renders from, and the band comes from `readScores()`,
// the same function the page's script uses. The PDF cannot say something the
// page does not.
//
// Two limits worth knowing before editing the copy it prints:
//
//   * Standard fonts encode WinAnsi only. Curly quotes, en and em dashes, the
//     multiplication sign and the ellipsis are all fine; an arrow, a rupee sign
//     or an emoji is not, and pdf-lib throws on one. `clean()` maps the few we
//     use and drops the rest rather than crashing a download over a glyph.
//   * Layout is a cursor moving down the page with word wrapping done here.
//     There is no flow engine: a block that must not split across pages asks
//     `ensure()` for its height first.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  CUT_LINES,
  FLAT,
  MAX_SCORE,
  MOVES,
  SECTIONS,
  TOOL_NAME,
  moveFor,
  readScores,
} from '../../data/poc-screen';

const PAGE = { w: 595.28, h: 841.89 }; // A4, points
const MARGIN = { top: 56, right: 52, bottom: 60, left: 52 };
const MEASURE = PAGE.w - MARGIN.left - MARGIN.right;

const INK = rgb(0.086, 0.129, 0.18); // #16212e
const QUIET = rgb(0.38, 0.42, 0.47);
const RULE = rgb(0.86, 0.88, 0.9);
const DANGER = rgb(0.81, 0.06, 0.27); // #cf0f45
const SUN = rgb(1, 0.757, 0.137); // #ffc123

const clean = (s: string): string =>
  s
    .replace(/→/g, '->')
    .replace(/₹/g, 'INR ')
    .replace(/[^\x20-\x7e\xa0-\xff–—‘’“”…•]/g, '');

export interface PocPdfInput {
  /** Twelve entries, each 0, 1, 2 or null for unanswered. */
  scores: (number | null)[];
  /** The name typed into the request form. Printed on the cover line. */
  name: string;
  /** ISO date the copy was built, printed on the cover line. */
  builtOn: string;
}

/** Validate a posted scores array. Anything else is refused, not coerced. */
export function parseScores(value: unknown): (number | null)[] | null {
  if (!Array.isArray(value) || value.length !== FLAT.length) return null;
  const out: (number | null)[] = [];
  for (const v of value) {
    if (v === null) out.push(null);
    else if (v === 0 || v === 1 || v === 2) out.push(v);
    else return null;
  }
  return out;
}

class Writer {
  private doc: PDFDocument;
  private page!: PDFPage;
  private y = 0;
  private pageNo = 0;
  readonly body: PDFFont;
  readonly bold: PDFFont;

  constructor(doc: PDFDocument, body: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.body = body;
    this.bold = bold;
    this.newPage();
  }

  private newPage() {
    this.page = this.doc.addPage([PAGE.w, PAGE.h]);
    this.pageNo += 1;
    this.y = PAGE.h - MARGIN.top;
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

  /** Word-wrap `text` to `width` at `size` in `font`. */
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

  /** Draw a paragraph and move the cursor below it. */
  text(
    text: string,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; width?: number; lh?: number } = {},
  ) {
    const font = opts.font ?? this.body;
    const size = opts.size ?? 10;
    const lh = opts.lh ?? 1.4;
    const indent = opts.indent ?? 0;
    const width = opts.width ?? MEASURE - indent;
    const lines = this.wrap(text, font, size, width);
    for (const line of lines) {
      this.ensure(size * lh);
      this.page.drawText(line, {
        x: MARGIN.left + indent,
        y: this.y - size,
        size,
        font,
        color: opts.color ?? INK,
      });
      this.y -= size * lh;
    }
  }

  /** A label in the left gutter and a paragraph beside it, on one baseline. */
  labelled(label: string, text: string, opts: { size?: number; labelColor?: ReturnType<typeof rgb>; gutter?: number; font?: PDFFont } = {}) {
    const size = opts.size ?? 10;
    const gutter = opts.gutter ?? 30;
    this.ensure(size * 1.4);
    this.page.drawText(clean(label), {
      x: MARGIN.left,
      y: this.y - size,
      size,
      font: this.bold,
      color: opts.labelColor ?? QUIET,
    });
    this.text(text, { size, indent: gutter, font: opts.font });
  }

  /** A filled marker square, used for the chosen anchor. */
  marker(x: number, yTop: number, size: number, color: ReturnType<typeof rgb>) {
    this.page.drawRectangle({ x, y: yTop - size, width: size, height: size, color });
  }

  get cursor() {
    return this.y;
  }

  /** Page numbers, drawn last so the total is known. */
  finish(footer: string) {
    const pages = this.doc.getPages();
    pages.forEach((p, i) => {
      const line = clean(`${footer} · page ${i + 1} of ${pages.length}`);
      p.drawText(line, {
        x: MARGIN.left,
        y: MARGIN.bottom - 24,
        size: 8,
        font: this.body,
        color: QUIET,
      });
    });
  }
}

export async function renderPocScreenPdf(input: PocPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${TOOL_NAME} — scored copy`);
  doc.setAuthor('The Living Craft');
  doc.setProducer('learning.thelivingcraft.ai');
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, body, bold);

  const r = readScores(input.scores);
  const built = new Date(input.builtOn);
  const dateLine = Number.isNaN(built.getTime())
    ? ''
    : built.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // ---- cover block --------------------------------------------------------
  w.text(TOOL_NAME, { font: bold, size: 22, lh: 1.15 });
  w.gap(2);
  w.text('Can this agent proof of concept reach production? Twelve questions, scored before you build.', {
    size: 10.5,
    color: QUIET,
  });
  w.gap(6);
  w.text(
    [
      input.name ? `Scored by ${input.name}` : null,
      dateLine || null,
      'learning.thelivingcraft.ai/resources/poc-screen',
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

  const scoreLine = `${r.total} / ${MAX_SCORE}`;
  const bandName = r.band ? r.band.name : 'Incomplete';
  w.text(`${scoreLine}  —  ${bandName}`, {
    font: bold,
    size: 16,
    color: r.band?.key === 'gate' || r.band?.key === 'stop' ? DANGER : INK,
  });
  w.gap(4);

  if (r.band) {
    w.text(r.band.what, { size: 10 });
  } else {
    const left = FLAT.length - r.answered;
    w.text(
      `${left} ${left === 1 ? 'question is' : 'questions are'} unanswered, so there is no outcome yet. A blank counts as 0 in the total. Answer every question to read the result against the rubric.`,
      { size: 10 },
    );
  }
  w.gap(8);

  for (const s of r.sections) {
    w.labelled(s.letter, `${s.name}: ${s.score} / ${s.max}${s.answered < s.max / 2 ? `  (${s.max / 2 - s.answered} unanswered)` : ''}`, { size: 10, gutter: 18 });
  }
  w.gap(6);

  if (r.gateZero.length) {
    const names = r.gateZero.map((i) => `${String(i + 1).padStart(2, '0')} ${FLAT[i].short}`).join(', ');
    w.text(`Hard gate: section B has a 0 on ${names}. This stops the proof of concept whatever the total.`, {
      size: 10,
      color: DANGER,
      font: bold,
    });
    w.gap(6);
  }

  // ---- fix first ----------------------------------------------------------
  const weak = FLAT.map((it, i) => ({ it, i, v: input.scores[i] }))
    .filter((x) => x.v === 0 || x.v === 1)
    .sort((a, b) => (a.v ?? 0) - (b.v ?? 0) || (FLAT[b.i].gate ? 1 : 0) - (FLAT[a.i].gate ? 1 : 0));

  if (weak.length) {
    w.gap(4);
    w.text('Fix first', { font: bold, size: 13 });
    w.gap(4);
    w.text('Lowest scores first, with the move that answers each one before the agent exists.', { size: 9.5, color: QUIET });
    w.gap(6);
    for (const x of weak) {
      const num = String(x.i + 1).padStart(2, '0');
      const move = moveFor(x.i + 1);
      const line = `${x.it.short}, scored ${x.v}${x.it.gate ? ' (hard gate)' : ''}. ${x.it.a[x.v ?? 0]}${move ? ` Move ${move.num}: ${move.name}.` : ''}`;
      w.labelled(num, line, { size: 9.5, gutter: 24, labelColor: x.v === 0 && x.it.gate ? DANGER : QUIET });
      w.gap(3);
    }
  }

  w.gap(10);
  w.rule();

  // ---- the twelve, with the chosen anchor ---------------------------------
  w.ensure(
    70 +
    44 +
    w.heightOf(SECTIONS[0].items[0].q, bold, 10.5, MEASURE - 24) +
    SECTIONS[0].items[0].a.reduce((h, a) => h + w.heightOf(a, body, 9.5, MEASURE - 44) + 4, 0) +
    30,
  );
  w.text('Your answers', { font: bold, size: 13 });
  w.gap(2);
  w.text('Each question, the answer you chose, and what the other two anchors would have needed.', { size: 9.5, color: QUIET });
  w.gap(10);

  // A question and its three anchors stay on one page.
  const questionHeight = (it: (typeof FLAT)[number]) =>
    w.heightOf(it.q, bold, 10.5, MEASURE - 24) +
    it.a.reduce((h, a) => h + w.heightOf(a, body, 9.5, MEASURE - 44) + 4, 0) +
    30;

  let n = 0;
  for (const s of SECTIONS) {
    // A section header never sits alone at the foot of a page: it moves to the
    // next page unless its first question fits under it.
    w.ensure(44 + questionHeight({ ...s.items[0], gate: s.gate }));
    w.text(`${s.letter}  ${s.name}${s.gate ? '  (hard gate)' : ''}`, { font: bold, size: 12 });
    w.text(s.question, { size: 10, color: QUIET });
    w.gap(8);

    for (const it of s.items) {
      const i = n++;
      const v = input.scores[i];
      const num = String(i + 1).padStart(2, '0');
      w.ensure(questionHeight({ ...it, gate: s.gate }));

      w.labelled(num, it.q, { size: 10.5, gutter: 24, font: bold });
      w.gap(3);
      it.a.forEach((a, k) => {
        const chosen = v === k;
        const top = w.cursor;
        if (chosen) w.marker(MARGIN.left + 24, top - 1, 8, s.gate && k === 0 ? DANGER : SUN);
        w.text(`${k}  ${a}`, {
          size: 9.5,
          indent: 38,
          font: chosen ? bold : body,
          color: chosen ? INK : QUIET,
        });
        w.gap(3);
      });
      if (v === null) {
        w.text('Unanswered. Counts as 0.', { size: 9, indent: 38, color: DANGER });
      }
      w.gap(8);
    }
    w.gap(4);
  }

  w.rule();

  // ---- the rubric ---------------------------------------------------------
  // Heading, its intro, and at least the first two rubric rows together.
  w.ensure(60 + CUT_LINES.slice(0, 2).reduce((h, c) => h + w.heightOf(`${c.name}. ${c.what}`, body, 9.5, MEASURE - 70) + 5, 0));
  w.text('The rubric', { font: bold, size: 13 });
  w.gap(2);
  w.text('Agree these before you score, not after. A total one point above a line is a narrow, not a yes.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const c of CUT_LINES) {
    w.ensure(40);
    w.labelled(c.score, `${c.name}. ${c.what}`, { size: 9.5, gutter: 70, labelColor: c.key === 'gate' ? DANGER : QUIET });
    w.gap(5);
  }

  w.gap(8);
  w.rule();

  // ---- the four moves -----------------------------------------------------
  // Heading, its intro and the first move together.
  w.ensure(60 + w.heightOf(MOVES[0].body, body, 9.5, MEASURE - 30) + 40);
  w.text('Four ways to answer most questions before you build the agent', { font: bold, size: 13 });
  w.gap(2);
  w.text('Listed from cheapest to most expensive. Each one costs less than a pilot that fails in front of a customer.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const m of MOVES) {
    const need = w.heightOf(m.body, body, 9.5, MEASURE - 30) + 40;
    w.ensure(need);
    w.labelled(m.num, m.name, { size: 11, gutter: 30, font: bold, labelColor: QUIET });
    w.text(m.body, { size: 9.5, indent: 30 });
    w.gap(2);
    w.text(`Cost: ${m.cost}  ·  Answers ${m.answers.map((q) => String(q).padStart(2, '0')).join(', ')}`, {
      size: 8.5,
      indent: 30,
      color: QUIET,
    });
    w.gap(8);
  }

  w.finish(`${TOOL_NAME} · The Living Craft · free to use and to pass on`);
  return doc.save();
}
