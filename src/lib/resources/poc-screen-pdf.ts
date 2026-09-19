// The PDF of a scored POC Selection Tool.
//
// Built on the server with pdf-lib, which is pure JavaScript: no headless
// browser, no font files on disk, no native module, so it runs unchanged
// inside a Vercel function. The text comes from `src/data/poc-screen.ts`, the
// same module the page renders from, and the band comes from `readScores()`,
// the same function the page's script uses. The PDF cannot say something the
// page does not.
//
// ───────────────────────────────────────────────────────────────────────────
// THREE STAGES: BUILD THE MODEL, CHECK IT, THEN DRAW IT
// ───────────────────────────────────────────────────────────────────────────
//
// `buildModel()` turns the twelve answers into a plain object of every string
// and number the file will carry. `checkModel()` runs a list of named checks
// over that object: the total is the sum of the answers, the outcome is what
// the rubric says, every chosen anchor is the anchor for that score, the
// cohort copy carries no unpublished figure, no placeholder text survived, and
// every character can be drawn. Only a model that passes every check is drawn,
// and the drawn bytes are opened again to confirm the file parses. The route
// hands the list back to the browser, so the dialog can say what was checked.
//
// The reason for the middle stage is the reason `facts.ts` exists: a wrong
// number in a PDF somebody keeps is worse than a wrong number on a page, because
// nobody redeploys a PDF.
//
// ───────────────────────────────────────────────────────────────────────────
// THE BRAND, ON PAPER
// ───────────────────────────────────────────────────────────────────────────
//
// The design system of record is .claude/skills/the-living-craft-design. Its
// print rule is that soft elevation does not print, so every panel here is a
// flat fill with a small radius and no shadow. The four brand values each keep
// their one job: noir is the cover band and nothing else, sun marks the chosen
// answer, ember carries the promotional panel with ink text on it, berry is the
// hard-gate mark. The wordmark is the words "The Living Craft" in the display
// weight beside a sun dot, because no logo has been drawn.
//
// The display face is Figtree, standing in for Sofia Pro, and neither ships as
// a file in this repo. The token stack names "Helvetica Neue" as its fallback,
// so Helvetica is what this file uses: a stand-in for a stand-in, and the one
// thing about the branding here that is not what the screen shows.
//
// Standard fonts encode WinAnsi only. Curly quotes, en and em dashes, the
// multiplication sign and the ellipsis are fine; an arrow, a rupee sign or an
// emoji is not, and pdf-lib throws on one. `clean()` maps the few we use and
// drops the rest. Our own copy must lose nothing to that; a typed name may.

import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  CUT_LINES,
  FLAT,
  GATE_INDEXES,
  MAX_SCORE,
  MOVES,
  QUESTION_COUNT,
  SECTIONS,
  TOOL_NAME,
  moveFor,
  readScores,
  type BandKey,
} from '../../data/poc-screen';
import { TOOL_CREDIT, publishedResources } from '../../data/resources';
import { SITE_ORIGIN, cohort } from '../../data/facts';
import { COHORT_SIZE, COMMITMENT } from '../../data/offer-display';

// ---------------------------------------------------------------------------
// Geometry and colour
// ---------------------------------------------------------------------------

const PAGE = { w: 595.28, h: 841.89 }; // A4, points
const MARGIN = { top: 64, right: 52, bottom: 60, left: 52 };
const MEASURE = PAGE.w - MARGIN.left - MARGIN.right;
const BAND_H = 128; // the cover band on page 1

// Brand values, from tokens/theme.css. Each has one job; see the note above.
const NOIR = rgb(0, 0, 0);
const SUN = rgb(1, 0.757, 0.137); // #ffc123
const EMBER = rgb(0.992, 0.522, 0.286); // #fd8549
const MIST = rgb(0.945, 0.953, 0.961); // #f1f3f5
const BERRY = rgb(0.922, 0.078, 0.314); // #eb1450, the mark bar
const INK = rgb(0.086, 0.129, 0.18); // #16212e
const QUIET = rgb(0.38, 0.42, 0.47);
const ON_NOIR_QUIET = rgb(0.64, 0.675, 0.72); // faint text on the black band
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

// ---------------------------------------------------------------------------
// Stage 1: the model
// ---------------------------------------------------------------------------

export interface PocPdfModel {
  title: string;
  subtitle: string;
  series: string;
  coverLine: string;
  credit: string;
  result: {
    total: number;
    max: number;
    bandKey: BandKey | 'none';
    bandName: string;
    what: string;
    sections: { letter: string; name: string; score: number; max: number; unanswered: number }[];
    gateNames: string[];
  };
  fixFirst: { num: string; short: string; score: number; gate: boolean; anchor: string; move: string | null }[];
  answers: {
    letter: string;
    name: string;
    gate: boolean;
    question: string;
    items: { num: string; q: string; anchors: [string, string, string]; chosen: number | null }[];
  }[];
  rubric: { key: BandKey; score: string; name: string; what: string }[];
  moves: { num: string; name: string; body: string; cost: string; answers: string }[];
  cta: { heading: string; lines: string[]; action: string; url: string };
  footer: string;
}

export function buildModel(input: PocPdfInput): PocPdfModel {
  const r = readScores(input.scores);
  const built = new Date(input.builtOn);
  const dateLine = Number.isNaN(built.getTime())
    ? ''
    : built.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const meta = publishedResources.find((x) => x.id === 'poc-screen');
  const pad = (n: number) => String(n).padStart(2, '0');

  const weak = FLAT.map((it, i) => ({ it, i, v: input.scores[i] }))
    .filter((x) => x.v === 0 || x.v === 1)
    .sort((a, b) => (a.v ?? 0) - (b.v ?? 0) || Number(b.it.gate) - Number(a.it.gate));

  let n = 0;
  return {
    title: TOOL_NAME,
    subtitle: 'Can this agent proof of concept reach production? Twelve questions, scored before you build.',
    series: meta ? `${meta.series} · ${meta.number}` : 'Resources',
    coverLine: [
      input.name ? `Scored by ${clean(input.name)}` : null,
      dateLine || null,
      'learning.thelivingcraft.ai/resources/poc-screen',
    ]
      .filter(Boolean)
      .join('  ·  '),
    credit: TOOL_CREDIT,
    result: {
      total: r.total,
      max: MAX_SCORE,
      bandKey: r.band?.key ?? 'none',
      bandName: r.band ? r.band.name : 'Incomplete',
      what: r.band
        ? r.band.what
        : `${QUESTION_COUNT - r.answered} ${QUESTION_COUNT - r.answered === 1 ? 'question is' : 'questions are'} unanswered, so there is no outcome yet. A blank counts as 0 in the total. Answer every question to read the result against the rubric.`,
      sections: r.sections.map((s) => ({
        letter: s.letter,
        name: s.name,
        score: s.score,
        max: s.max,
        unanswered: s.max / 2 - s.answered,
      })),
      gateNames: r.gateZero.map((i) => `${pad(i + 1)} ${FLAT[i].short}`),
    },
    fixFirst: weak.map((x) => {
      const m = moveFor(x.i + 1);
      return {
        num: pad(x.i + 1),
        short: x.it.short,
        score: x.v ?? 0,
        gate: x.it.gate,
        anchor: x.it.a[x.v ?? 0],
        move: m ? `Move ${m.num}: ${m.name}.` : null,
      };
    }),
    answers: SECTIONS.map((s) => ({
      letter: s.letter,
      name: s.name,
      gate: s.gate,
      question: s.question,
      items: s.items.map((it) => {
        const i = n++;
        return { num: pad(i + 1), q: it.q, anchors: it.a, chosen: input.scores[i] };
      }),
    })),
    rubric: CUT_LINES.map((c) => ({ key: c.key, score: c.score, name: c.name, what: c.what })),
    moves: MOVES.map((m) => ({
      num: m.num,
      name: m.name,
      body: m.body,
      cost: m.cost,
      answers: m.answers.map((q) => pad(q)).join(', '),
    })),
    // Every figure here is read from facts.ts through offer-display.ts. Nothing
    // is typed in this file, so the PDF cannot disagree with the cohort page.
    cta: {
      heading: 'Join the cohort',
      lines: [
        `${cohort.name} is a ${cohort.weeks}-week live programme in agentic systems architecture, taught by Sunil Mathew. It teaches the judgment this tool asks for: which agent to build, how to contain its failures, and how to prove it worked.`,
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

export interface PdfCheck {
  name: string;
  ok: boolean;
  /** Why it failed. Never the person's name or address. */
  detail?: string;
}

const PLACEHOLDER = /\bTBD\b|\[PLACEHOLDER|\bTODO\b|lorem ipsum|\{\{|\}\}|\bXXX\b/i;
/** Figures the public offer does not print in prose: a rupee amount or a fee. */
const UNPUBLISHED = /₹|\bRs\.?\s?\d|\bINR\b|\bAED\b|\bAUD\b|\bfee\b|\bprice\b|\bdiscount\b/i;

/**
 * Everything the file will say, checked against the modules it was built from.
 * Each check recomputes its fact independently of `buildModel()`, so a bug in
 * the model and a bug in the check would have to agree to pass.
 */
export function checkModel(model: PocPdfModel, input: PocPdfInput): PdfCheck[] {
  const checks: PdfCheck[] = [];
  const add = (name: string, ok: boolean, detail?: string) => checks.push(ok ? { name, ok } : { name, ok, detail });

  // 1. Twelve answers, each 0, 1, 2 or blank.
  add(
    'Twelve answers, each 0, 1, 2 or blank',
    input.scores.length === QUESTION_COUNT && input.scores.every((v) => v === null || v === 0 || v === 1 || v === 2),
    `got ${input.scores.length} entries`,
  );

  // 2. The total is the sum of the answers, blanks as 0.
  const sum = input.scores.reduce<number>((n, v) => n + (v ?? 0), 0);
  add('Total equals the sum of the answers', model.result.total === sum && model.result.max === MAX_SCORE, `model ${model.result.total}, sum ${sum}`);

  // 3. The four section scores add up to the total, and each is at most 6.
  const secSum = model.result.sections.reduce((n, s) => n + s.score, 0);
  add(
    'Section scores add up to the total',
    secSum === sum && model.result.sections.every((s) => s.score >= 0 && s.score <= s.max),
    `sections ${secSum}, total ${sum}`,
  );

  // 4. The outcome is what the rubric says, worked out here from CUT_LINES.
  const gateZero = GATE_INDEXES.some((i) => input.scores[i] === 0);
  const complete = input.scores.every((v) => v !== null);
  let expected: BandKey | 'none' = 'none';
  if (gateZero) expected = 'gate';
  else if (complete) expected = CUT_LINES.find((c) => c.min !== undefined && sum >= c.min)?.key ?? 'none';
  const expectedName = expected === 'none' ? 'Incomplete' : CUT_LINES.find((c) => c.key === expected)!.name;
  add(
    'Outcome matches the rubric',
    model.result.bandKey === expected && model.result.bandName === expectedName,
    `model ${model.result.bandKey}, rubric ${expected}`,
  );

  // 5. The gate line names exactly the section-B questions scored 0.
  const gateExpected = GATE_INDEXES.filter((i) => input.scores[i] === 0).map((i) => `${String(i + 1).padStart(2, '0')} ${FLAT[i].short}`);
  add('Hard-gate line names the right questions', model.result.gateNames.join('|') === gateExpected.join('|'));

  // 6. Every chosen anchor is the anchor for that score, in the tool's words.
  let anchorsOk = true;
  let k = 0;
  for (const s of model.answers) {
    for (const it of s.items) {
      const src = FLAT[k];
      if (!src || it.q !== src.q || it.anchors.join('|') !== src.a.join('|') || it.chosen !== input.scores[k]) anchorsOk = false;
      k++;
    }
  }
  add('Every question and anchor matches the tool', anchorsOk && k === QUESTION_COUNT);

  // 7. Fix-first lists exactly the questions scored 0 or 1, zeros first.
  const weakExpected = FLAT.map((it, i) => ({ i, v: input.scores[i], gate: it.gate }))
    .filter((x) => x.v === 0 || x.v === 1)
    .sort((a, b) => (a.v ?? 0) - (b.v ?? 0) || Number(b.gate) - Number(a.gate))
    .map((x) => String(x.i + 1).padStart(2, '0'));
  add(
    'Fix-first lists the weak rows, lowest first',
    model.fixFirst.map((f) => f.num).join(',') === weakExpected.join(','),
    `model ${model.fixFirst.map((f) => f.num).join(',')}, expected ${weakExpected.join(',')}`,
  );

  // 8. Every string in the file, gathered once for the text checks.
  const strings: string[] = [
    model.title,
    model.subtitle,
    model.series,
    model.credit,
    model.result.bandName,
    model.result.what,
    ...model.fixFirst.flatMap((f) => [f.short, f.anchor, f.move ?? '']),
    ...model.answers.flatMap((s) => [s.name, s.question, ...s.items.flatMap((it) => [it.q, ...it.anchors])]),
    ...model.rubric.flatMap((c) => [c.score, c.name, c.what]),
    ...model.moves.flatMap((m) => [m.name, m.body, m.cost]),
    model.cta.heading,
    ...model.cta.lines,
    model.cta.url,
    model.footer,
  ];

  add('No placeholder text', !strings.some((s) => PLACEHOLDER.test(s)), strings.find((s) => PLACEHOLDER.test(s)));

  // 9. The cohort copy prints only what the offer publishes: weeks, seats,
  //    start month and the time commitment, each read from facts.ts. No fee.
  const ctaText = model.cta.lines.join(' ');
  add(
    'Cohort copy carries no unpublished figure',
    !UNPUBLISHED.test(ctaText) &&
      ctaText.includes(`${cohort.weeks}-week`) &&
      ctaText.includes(`${cohort.seats} seats`) &&
      ctaText.includes(cohort.startsOn),
  );

  // 10. The apply link points at this site's cohort page.
  add('Apply link points at the cohort page', model.cta.url === `${SITE_ORIGIN}/#apply`);

  // 11. The credit line is the one every tool carries.
  add('Credit line present', model.credit === TOOL_CREDIT && model.footer.includes(TOOL_CREDIT));

  // 12. Every character in our own copy can be drawn. The cover line may lose
  //     a glyph from a typed name; nothing else may lose anything.
  const undrawable = strings.find((s) => !drawsWhole(s));
  add('Every character can be printed', undrawable === undefined, undrawable);

  return checks;
}

// ---------------------------------------------------------------------------
// Stage 3: drawing
// ---------------------------------------------------------------------------

type Colour = ReturnType<typeof rgb>;

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
    // The decorator draws the band or the slim header and says where text starts.
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

  /** A filled square, used for the chosen anchor. */
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

  get current() {
    return this.page;
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
  // drawSvgPath draws downward from (x, y); hand it the top-left corner.
  page.drawSvgPath(d, { x, y: y + h, color, borderWidth: 0 });
}

/** The wordmark: a sun dot and "The Living Craft" in the display weight. */
function wordmark(page: PDFPage, font: PDFFont, x: number, baseline: number, size: number, color: Colour) {
  const dot = size * 0.42;
  page.drawCircle({ x: x + dot / 2, y: baseline + size * 0.3, size: dot / 2, color: SUN });
  page.drawText('The Living Craft', { x: x + dot + size * 0.45, y: baseline, size, font, color });
}

/**
 * The checks alone, for the route to run BEFORE the request is saved. A file
 * that would fail a check must not leave a person, a request row and a queued
 * email behind it.
 */
export function verifyPocScreenPdf(input: PocPdfInput): PdfCheck[] {
  return checkModel(buildModel(input), input);
}

export async function renderPocScreenPdf(input: PocPdfInput): Promise<{ bytes: Uint8Array; checks: PdfCheck[] }> {
  const model = buildModel(input);
  const checks = checkModel(model, input);
  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    // Never draw a file that failed a check. The route turns this into a 500
    // and the page says so; nothing is handed over.
    throw new Error(`PDF check failed: ${failed.map((c) => c.name).join('; ')}`);
  }

  const doc = await PDFDocument.create();
  doc.setTitle(`${TOOL_NAME} — scored copy`);
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
  const danger = model.result.bandKey === 'gate' || model.result.bandKey === 'stop';

  // ---- cover line ---------------------------------------------------------
  w.text(model.coverLine, { size: 8.5, color: QUIET });
  w.gap(14);

  // ---- the result, on a mist panel ----------------------------------------
  const pad = 16;
  const inner = MEASURE - pad * 2;
  const resultLines = [
    w.heightOf('Result', bold, 9),
    6,
    w.heightOf(`${model.result.total} / ${model.result.max}  —  ${model.result.bandName}`, bold, 16, inner),
    4,
    w.heightOf(model.result.what, body, 10, inner),
    8,
    model.result.sections.length * 10 * 1.4,
    model.result.gateNames.length ? 6 + w.heightOf(`Hard gate: section B has a 0 on ${model.result.gateNames.join(', ')}. This stops the proof of concept whatever the total.`, bold, 10, inner) : 0,
  ];
  const resultH = resultLines.reduce((a, b) => a + b, 0) + pad * 2 + 10;
  w.panel(resultH, MIST);
  w.gap(pad);
  w.text('Result', { font: bold, size: 9, color: QUIET, indent: pad });
  w.gap(6);
  w.text(`${model.result.total} / ${model.result.max}  —  ${model.result.bandName}`, {
    font: bold,
    size: 16,
    indent: pad,
    color: danger ? DANGER : INK,
  });
  w.gap(4);
  w.text(model.result.what, { size: 10, indent: pad });
  w.gap(8);
  for (const s of model.result.sections) {
    w.labelled(s.letter, `${s.name}: ${s.score} / ${s.max}${s.unanswered ? `  (${s.unanswered} unanswered)` : ''}`, { size: 10, gutter: 18, indent: pad });
  }
  if (model.result.gateNames.length) {
    w.gap(6);
    w.text(`Hard gate: section B has a 0 on ${model.result.gateNames.join(', ')}. This stops the proof of concept whatever the total.`, {
      size: 10,
      color: DANGER,
      font: bold,
      indent: pad,
    });
  }
  w.gap(pad + 10);

  // ---- fix first ----------------------------------------------------------
  if (model.fixFirst.length) {
    w.ensure(60);
    w.text('Fix first', { font: bold, size: 13 });
    w.gap(4);
    w.text('Lowest scores first, with the move that answers each one before the agent exists.', { size: 9.5, color: QUIET });
    w.gap(6);
    for (const f of model.fixFirst) {
      const line = `${f.short}, scored ${f.score}${f.gate ? ' (hard gate)' : ''}. ${f.anchor}${f.move ? ` ${f.move}` : ''}`;
      w.labelled(f.num, line, { size: 9.5, gutter: 24, labelColor: f.score === 0 && f.gate ? DANGER : QUIET });
      w.gap(3);
    }
    w.gap(8);
  }

  w.rule();

  // ---- the twelve, with the chosen anchor ---------------------------------
  const questionHeight = (it: PocPdfModel['answers'][number]['items'][number]) =>
    w.heightOf(it.q, bold, 10.5, MEASURE - 24) +
    it.anchors.reduce((h, a) => h + w.heightOf(a, body, 9.5, MEASURE - 44) + 4, 0) +
    30;

  w.ensure(70 + 44 + questionHeight(model.answers[0].items[0]));
  w.text('Your answers', { font: bold, size: 13 });
  w.gap(2);
  w.text('Each question, the answer you chose, and what the other two anchors would have needed.', { size: 9.5, color: QUIET });
  w.gap(10);

  for (const s of model.answers) {
    // A section header never sits alone at the foot of a page.
    w.ensure(44 + questionHeight(s.items[0]));
    w.text(`${s.letter}  ${s.name}${s.gate ? '  (hard gate)' : ''}`, { font: bold, size: 12 });
    w.text(s.question, { size: 10, color: QUIET });
    w.gap(8);

    for (const it of s.items) {
      w.ensure(questionHeight(it));
      w.labelled(it.num, it.q, { size: 10.5, gutter: 24, font: bold });
      w.gap(3);
      it.anchors.forEach((a, k) => {
        const chosen = it.chosen === k;
        if (chosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, s.gate && k === 0 ? BERRY : SUN);
        w.text(`${k}  ${a}`, { size: 9.5, indent: 38, font: chosen ? bold : body, color: chosen ? INK : QUIET });
        w.gap(3);
      });
      if (it.chosen === null) w.text('Unanswered. Counts as 0.', { size: 9, indent: 38, color: DANGER });
      w.gap(8);
    }
    w.gap(4);
  }

  w.rule();

  // ---- the rubric ---------------------------------------------------------
  w.ensure(60 + model.rubric.slice(0, 2).reduce((h, c) => h + w.heightOf(`${c.name}. ${c.what}`, body, 9.5, MEASURE - 70) + 5, 0));
  w.text('The rubric', { font: bold, size: 13 });
  w.gap(2);
  w.text('Agree these before you score, not after. A total one point above a line is a narrow, not a yes.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const c of model.rubric) {
    w.ensure(40);
    w.labelled(c.score, `${c.name}. ${c.what}`, { size: 9.5, gutter: 70, labelColor: c.key === 'gate' ? DANGER : QUIET });
    w.gap(5);
  }
  w.gap(8);
  w.rule();

  // ---- the four moves -----------------------------------------------------
  w.ensure(60 + w.heightOf(model.moves[0].body, body, 9.5, MEASURE - 30) + 40);
  w.text('Four ways to answer most questions before you build the agent', { font: bold, size: 13 });
  w.gap(2);
  w.text('Listed from cheapest to most expensive. Each one costs less than a pilot that fails in front of a customer.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const m of model.moves) {
    w.ensure(w.heightOf(m.body, body, 9.5, MEASURE - 30) + 40);
    w.labelled(m.num, m.name, { size: 11, gutter: 30, font: bold, labelColor: QUIET });
    w.text(m.body, { size: 9.5, indent: 30 });
    w.gap(2);
    w.text(`Cost: ${m.cost}  ·  Answers ${m.answers}`, { size: 8.5, indent: 30, color: QUIET });
    w.gap(8);
  }
  w.gap(6);

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
  w.text(model.cta.heading, { font: bold, size: 15, indent: pad });
  w.gap(6);
  for (const l of model.cta.lines) {
    w.text(l, { size: 10, indent: pad });
    w.gap(4);
  }
  w.gap(6);
  w.text(`${model.cta.action} ${model.cta.url}`, { font: bold, size: 10, indent: pad });
  // The whole panel is the link, so a reader does not have to hit one line.
  w.link(MARGIN.left, panelTop, MEASURE, ctaH, model.cta.url);
  w.gap(pad + 6);

  w.finish(model.footer);
  const bytes = await doc.save();

  // Stage 3's own check: the bytes open as a PDF with the pages we drew.
  const reopened = await PDFDocument.load(bytes);
  const pages = reopened.getPageCount();
  checks.push({ name: `File opens as a PDF (${pages} pages)`, ok: pages >= 3 && reopened.getTitle() === `${TOOL_NAME} — scored copy` });
  if (!checks[checks.length - 1].ok) throw new Error('PDF check failed: file did not reopen as expected');

  return { bytes, checks };
}
