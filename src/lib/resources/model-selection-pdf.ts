// The PDF of a scored Model Selection Tool.
//
// Built against lib/resources/poc-screen-pdf.ts as the reference: the same
// three stages, the same brand on paper, the same Writer with a page
// decorator. The text comes from `src/data/model-selection-tool.ts`, the same
// module the page renders from, and the outcome comes from `readAssessment()`,
// the same function the page's script uses. The PDF cannot say something the
// page does not.
//
// ───────────────────────────────────────────────────────────────────────────
// THREE STAGES: BUILD THE MODEL, CHECK IT, THEN DRAW IT
// ───────────────────────────────────────────────────────────────────────────
//
// `buildModel()` turns the assessment into a plain object of every string and
// number the file will carry. `checkModel()` runs a list of named checks over
// that object, each recomputing its fact from the raw answers with its own
// arithmetic: the weighted total, the percentage, the outcome against the
// rubric, the hard-gate lines, every anchor against the tool, the fix-first
// order, the cohort copy, the apply link, the credit line, and whether every
// character can be drawn. Only a model that passes every check is drawn, and
// the drawn bytes are opened again to confirm the file parses. The route hands
// the list back to the browser, so the dialog can say what was checked.
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
// hard-gate mark (a failed gate, a disqualifier that happened). The wordmark is
// the words "The Living Craft" in the display weight beside a sun dot.
//
// The display face is Figtree, standing in for Sofia Pro, and neither ships as
// a file in this repo. Helvetica is what this file uses, the fallback the token
// stack itself names. Standard fonts encode WinAnsi only; `clean()` maps the
// few glyphs we use and drops the rest. Our own copy must lose nothing to
// that; a typed name may.

import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  ANSWER_COUNT,
  CASE_SHAPES,
  CRITERIA,
  CRITERIA_COUNT,
  CUT_LINES,
  DISQUALIFIERS,
  DQ_COUNT,
  GATES,
  GATE_COUNT,
  OWN_WEIGHT_MAX,
  OWN_WEIGHT_ROWS,
  PROFILES,
  TOOL_NAME,
  caseFor,
  readAssessment,
  weightOf,
  type Assessment,
  type BandKey,
} from '../../data/model-selection-tool';
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

const pad = (n: number) => String(n).padStart(2, '0');

export interface ModelSelectionPdfInput {
  assessment: Assessment;
  /** The name typed into the request form. Printed on the cover line. */
  name: string;
  /** ISO date the copy was built, printed on the cover line. */
  builtOn: string;
}

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

// ---------------------------------------------------------------------------
// Stage 1: the model
// ---------------------------------------------------------------------------

export interface ModelSelectionPdfModel {
  title: string;
  subtitle: string;
  series: string;
  coverLine: string;
  credit: string;
  result: {
    pct: number | null;
    total: number | null;
    max: number | null;
    bandKey: BandKey | 'none';
    bandName: string;
    what: string;
    stepName: string;
    gatesPassed: number;
    gateNames: string[];
    dqNames: string[];
    dqHit: number;
  };
  fixFirst: { num: string; short: string; score: number; weight: number | null; anchor: string; evidence: string | null }[];
  step: { question: string; options: { name: string; cost: string }[]; chosen: number | null };
  gates: { num: string; q: string; passes: string; cost: string; chosen: number | null }[];
  criteria: { num: string; q: string; weight: number | null; key: boolean; anchors: [string, string, string]; chosen: number | null }[];
  dq: { num: string; q: string; why: string; chosen: number | null }[];
  rubric: { key: BandKey; score: string; name: string; what: string }[];
  cases: { n: string; name: string; build: string; right: string; watchLabel: string; watch: string; failure: boolean; evidence: string }[];
  cta: { heading: string; lines: string[]; action: string; url: string };
  footer: string;
}

export function buildModel(input: ModelSelectionPdfInput): ModelSelectionPdfModel {
  const a = input.assessment;
  const r = readAssessment(a);
  const built = new Date(input.builtOn);
  const dateLine = Number.isNaN(built.getTime())
    ? ''
    : built.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const meta = publishedResources.find((x) => x.id === 'model-selection-tool');

  return {
    title: TOOL_NAME,
    subtitle: 'Is this model fit for this step? One candidate, one step, scored from your own test runs.',
    series: meta ? `${meta.series} · ${meta.number}` : 'Resources',
    coverLine: [
      input.name ? `Scored by ${clean(input.name)}` : null,
      dateLine || null,
      'learning.thelivingcraft.ai/resources/model-selection-tool',
    ]
      .filter(Boolean)
      .join('  ·  '),
    credit: TOOL_CREDIT,
    result: {
      pct: r.pct,
      total: r.total,
      max: r.max,
      bandKey: r.band?.key ?? 'none',
      bandName: r.band ? r.band.name : 'Incomplete',
      what: r.band
        ? r.band.what
        : `${ANSWER_COUNT - r.answered} ${ANSWER_COUNT - r.answered === 1 ? 'answer is' : 'answers are'} missing, so there is no outcome yet. A blank row in section C counts as 0. Give every answer to read the result against the rubric.`,
      stepName: a.profile === null ? 'not chosen' : PROFILES[a.profile].name,
      gatesPassed: r.gatesPassed,
      gateNames: r.gatesFailed.map((i) => `B${i + 1} ${GATES[i].short}`),
      dqNames: r.dqHit.map((i) => `D${i + 1} ${DISQUALIFIERS[i].short}`),
      dqHit: r.dqHit.length,
    },
    fixFirst: r.weak.map((x) => {
      const cs = caseFor(x.i + 1);
      return {
        num: `C${pad(x.i + 1)}`,
        short: CRITERIA[x.i].short,
        score: x.v,
        weight: x.w,
        anchor: CRITERIA[x.i].a[x.v],
        evidence: cs ? `Evidence: case ${cs.n}, ${cs.name.toLowerCase()}.` : null,
      };
    }),
    step: {
      question: 'What job is this model being staffed on?',
      options: PROFILES.map((p) => ({ name: p.name, cost: p.cost })),
      chosen: a.profile,
    },
    gates: GATES.map((g, i) => ({ num: `B${i + 1}`, q: g.q, passes: g.passes, cost: g.cost, chosen: a.gates[i] })),
    criteria: CRITERIA.map((c, i) => ({
      num: `C${pad(i + 1)}`,
      q: c.q,
      weight: weightOf(i, a),
      key: c.key === true,
      anchors: c.a,
      chosen: a.scores[i],
    })),
    dq: DISQUALIFIERS.map((d, i) => ({ num: `D${i + 1}`, q: d.q, why: d.why, chosen: a.dq[i] })),
    rubric: CUT_LINES.map((c) => ({ key: c.key, score: c.score, name: c.name, what: c.what })),
    cases: CASE_SHAPES.map((c) => ({
      n: c.n,
      name: c.name,
      build: c.build,
      right: c.right,
      watchLabel: c.watchLabel,
      watch: c.watch,
      failure: c.failure === true,
      evidence: c.reveals.map((n) => `C${pad(n)}`).join(', '),
    })),
    // Every figure here is read from facts.ts through offer-display.ts. Nothing
    // is typed in this file, so the PDF cannot disagree with the cohort page.
    cta: {
      heading: 'Join the cohort',
      lines: [
        `${cohort.name} is a ${cohort.weeks}-week live programme in agentic systems architecture, taught by Sunil Mathew. It teaches the judgment this tool asks for: which model to trust with which step, how to test what it leaves out, and how to write the record that outlives the version.`,
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
 * Each check recomputes its fact independently of `buildModel()` and of
 * `readAssessment()`, so a bug in the model and a bug in the check would have
 * to agree to pass.
 */
export function checkModel(model: ModelSelectionPdfModel, input: ModelSelectionPdfInput): PdfCheck[] {
  const a = input.assessment;
  const checks: PdfCheck[] = [];
  const add = (name: string, ok: boolean, detail?: string) => checks.push(ok ? { name, ok } : { name, ok, detail });

  // 1. The shape: one step, ten gates, twelve scores, four reader weights,
  //    four disqualifiers, each value in its allowed set or blank.
  const shapeOk =
    (a.profile === null || [0, 1, 2].includes(a.profile)) &&
    a.gates.length === GATE_COUNT &&
    a.gates.every((v) => v === null || v === 0 || v === 1) &&
    a.scores.length === CRITERIA_COUNT &&
    a.scores.every((v) => v === null || v === 0 || v === 1 || v === 2) &&
    a.own.length === OWN_WEIGHT_ROWS.length &&
    a.own.every((w) => Number.isInteger(w) && w >= 1 && w <= OWN_WEIGHT_MAX) &&
    a.dq.length === DQ_COUNT &&
    a.dq.every((v) => v === null || v === 0 || v === 1);
  add('Twenty-seven answers, each in its allowed set or blank', shapeOk);

  // 2. The weights: each profiled row carries the tuple entry for the chosen
  //    step; each reader-set row carries the posted weight. Recomputed here
  //    from CRITERIA directly, not through weightOf().
  const expectedWeights = CRITERIA.map((c, i) => {
    if (c.weights) return a.profile === null ? null : c.weights[a.profile];
    return a.own[OWN_WEIGHT_ROWS.indexOf(i)];
  });
  add(
    'Every row carries the weight for the chosen step',
    model.criteria.length === CRITERIA_COUNT && model.criteria.every((c, i) => c.weight === expectedWeights[i]),
  );

  // 3. The weighted total is the sum of score × weight, blanks as 0, and the
  //    maximum is 2 × the sum of the weights. Null until a step is chosen.
  let total: number | null = null;
  let max: number | null = null;
  if (a.profile !== null) {
    total = 0;
    max = 0;
    expectedWeights.forEach((w, i) => {
      total! += (a.scores[i] ?? 0) * (w ?? 0);
      max! += 2 * (w ?? 0);
    });
  }
  add('Weighted total is the sum of score times weight', model.result.total === total && model.result.max === max, `model ${model.result.total}/${model.result.max}, sum ${total}/${max}`);

  // 4. The percentage is the total over the maximum, rounded to a whole number.
  const pct = total === null || max === null ? null : max > 0 ? Math.round((total / max) * 100) : 0;
  add('Percentage is the total over the maximum', model.result.pct === pct, `model ${model.result.pct}, expected ${pct}`);

  // 5. The outcome is what the rubric says, worked out here from CUT_LINES:
  //    any gate fail first, then any disqualifier, then the percentage once
  //    every answer is given.
  const anyGateFail = a.gates.some((v) => v === 0);
  const anyDq = a.dq.some((v) => v === 1);
  const answered =
    (a.profile === null ? 0 : 1) +
    a.gates.filter((v) => v !== null).length +
    a.scores.filter((v) => v !== null).length +
    a.dq.filter((v) => v !== null).length;
  const complete = answered === ANSWER_COUNT;
  let expected: BandKey | 'none' = 'none';
  if (anyGateFail) expected = 'gate';
  else if (anyDq) expected = 'dq';
  else if (complete && pct !== null) expected = CUT_LINES.find((c) => c.min !== undefined && pct >= c.min)?.key ?? 'none';
  const expectedName = expected === 'none' ? 'Incomplete' : CUT_LINES.find((c) => c.key === expected)!.name;
  add(
    'Outcome matches the rubric',
    model.result.bandKey === expected && model.result.bandName === expectedName,
    `model ${model.result.bandKey}, rubric ${expected}`,
  );

  // 6. The hard-gate lines name exactly the failed gates and the disqualifiers
  //    that happened, in order.
  const gateExpected = a.gates.map((v, i) => (v === 0 ? `B${i + 1} ${GATES[i].short}` : null)).filter((x): x is string => x !== null);
  const dqExpected = a.dq.map((v, i) => (v === 1 ? `D${i + 1} ${DISQUALIFIERS[i].short}` : null)).filter((x): x is string => x !== null);
  add(
    'Hard-gate lines name the right rows',
    model.result.gateNames.join('|') === gateExpected.join('|') &&
      model.result.dqNames.join('|') === dqExpected.join('|') &&
      model.result.gatesPassed === a.gates.filter((v) => v === 1).length &&
      model.result.dqHit === dqExpected.length,
  );

  // 7. Every row and every anchor is the tool's, in the tool's order, with the
  //    chosen answer as posted.
  const stepOk =
    model.step.chosen === a.profile &&
    model.step.options.length === PROFILES.length &&
    model.step.options.every((o, i) => o.name === PROFILES[i].name && o.cost === PROFILES[i].cost);
  const gatesOk =
    model.gates.length === GATE_COUNT &&
    model.gates.every((g, i) => g.q === GATES[i].q && g.passes === GATES[i].passes && g.cost === GATES[i].cost && g.chosen === a.gates[i]);
  const critOk =
    model.criteria.length === CRITERIA_COUNT &&
    model.criteria.every((c, i) => c.q === CRITERIA[i].q && c.anchors.join('|') === CRITERIA[i].a.join('|') && c.chosen === a.scores[i]);
  const dqOk =
    model.dq.length === DQ_COUNT &&
    model.dq.every((d, i) => d.q === DISQUALIFIERS[i].q && d.why === DISQUALIFIERS[i].why && d.chosen === a.dq[i]);
  add('Every row and anchor matches the tool', stepOk && gatesOk && critOk && dqOk);

  // 8. Fix-first lists exactly the section C rows scored 0 or 1, zeros first,
  //    then heaviest weight first, in that order.
  const weakExpected = a.scores
    .map((v, i) => ({ i, v, w: expectedWeights[i] ?? 0 }))
    .filter((x) => x.v === 0 || x.v === 1)
    .sort((p, q) => (p.v ?? 0) - (q.v ?? 0) || q.w - p.w)
    .map((x) => `C${pad(x.i + 1)}`);
  add(
    'Fix-first lists the weak rows, lowest first',
    model.fixFirst.map((f) => f.num).join(',') === weakExpected.join(','),
    `model ${model.fixFirst.map((f) => f.num).join(',')}, expected ${weakExpected.join(',')}`,
  );

  // 9. Every string in the file, gathered once for the text checks.
  const strings: string[] = [
    model.title,
    model.subtitle,
    model.series,
    model.credit,
    model.result.bandName,
    model.result.what,
    model.result.stepName,
    ...model.result.gateNames,
    ...model.result.dqNames,
    ...model.fixFirst.flatMap((f) => [f.short, f.anchor, f.evidence ?? '']),
    model.step.question,
    ...model.step.options.flatMap((o) => [o.name, o.cost]),
    ...model.gates.flatMap((g) => [g.q, g.passes, g.cost]),
    ...model.criteria.flatMap((c) => [c.q, ...c.anchors]),
    ...model.dq.flatMap((d) => [d.q, d.why]),
    ...model.rubric.flatMap((c) => [c.score, c.name, c.what]),
    ...model.cases.flatMap((c) => [c.name, c.build, c.right, c.watchLabel, c.watch, c.evidence]),
    model.cta.heading,
    ...model.cta.lines,
    model.cta.url,
    model.footer,
  ];

  add('No placeholder text', !strings.some((s) => PLACEHOLDER.test(s)), strings.find((s) => PLACEHOLDER.test(s)));

  // 10. The cohort copy prints only what the offer publishes: weeks, seats,
  //     start month and the time commitment, each read from facts.ts. No fee.
  const ctaText = model.cta.lines.join(' ');
  add(
    'Cohort copy carries no unpublished figure',
    !UNPUBLISHED.test(ctaText) &&
      ctaText.includes(`${cohort.weeks}-week`) &&
      ctaText.includes(`${cohort.seats} seats`) &&
      ctaText.includes(cohort.startsOn),
  );

  // 11. The apply link points at this site's cohort page.
  add('Apply link points at the cohort page', model.cta.url === `${SITE_ORIGIN}/#apply`);

  // 12. The credit line is the one every tool carries.
  add('Credit line present', model.credit === TOOL_CREDIT && model.footer.includes(TOOL_CREDIT));

  // 13. Every character in our own copy can be drawn. The cover line may lose
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
export function verifyModelSelectionPdf(input: ModelSelectionPdfInput): PdfCheck[] {
  return checkModel(buildModel(input), input);
}

export async function renderModelSelectionPdf(input: ModelSelectionPdfInput): Promise<{ bytes: Uint8Array; checks: PdfCheck[] }> {
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
  const danger = model.result.bandKey === 'gate' || model.result.bandKey === 'dq' || model.result.bandKey === 'stop';

  // ---- cover line ---------------------------------------------------------
  w.text(model.coverLine, { size: 8.5, color: QUIET });
  w.gap(14);

  // ---- the result, on a mist panel ----------------------------------------
  const pad16 = 16;
  // Text inside the panel is drawn at `indent: pad16`, so it wraps at this
  // width. The height estimate has to use the same width, or the panel comes
  // out taller than its contents and the next heading lands inside it.
  const drawn = MEASURE - pad16;
  const scoreLine = `${model.result.pct === null ? 'No score yet' : `${model.result.pct}%`}  —  ${model.result.bandName}`;
  const sectionLines = [
    `The step: ${model.result.stepName}`,
    `Deployment gates: ${model.result.gatesPassed} / ${GATE_COUNT} pass${model.result.gateNames.length ? `, ${model.result.gateNames.length} fail` : ''}`,
    `Behaviour under test: ${model.result.total === null ? 'no weights until a step is chosen' : `${model.result.total} / ${model.result.max} weighted`}`,
    `Disqualifiers: ${model.result.dqHit} hit`,
  ];
  const gateLine = model.result.gateNames.length ? `Hard gate: section B fails on ${model.result.gateNames.join(', ')}. This ends the candidate whatever the score.` : '';
  const dqLine = model.result.dqNames.length ? `Hard gate: section D, ${model.result.dqNames.join(', ')} happened. This ends the candidate whatever the score.` : '';
  const resultH =
    [
      w.heightOf('Result', bold, 9),
      6,
      w.heightOf(scoreLine, bold, 16, drawn),
      4,
      w.heightOf(model.result.what, body, 10, drawn),
      8,
      sectionLines.reduce((h, l) => h + w.heightOf(l, body, 10, drawn - 18), 0),
      gateLine ? 6 + w.heightOf(gateLine, bold, 10, drawn) : 0,
      dqLine ? 4 + w.heightOf(dqLine, bold, 10, drawn) : 0,
    ].reduce((x, y) => x + y, 0) +
    pad16 * 2 +
    10;
  w.panel(resultH, MIST);
  w.gap(pad16);
  w.text('Result', { font: bold, size: 9, color: QUIET, indent: pad16 });
  w.gap(6);
  w.text(scoreLine, { font: bold, size: 16, indent: pad16, color: danger ? DANGER : INK });
  w.gap(4);
  w.text(model.result.what, { size: 10, indent: pad16 });
  w.gap(8);
  ['A', 'B', 'C', 'D'].forEach((letter, i) => {
    w.labelled(letter, sectionLines[i], { size: 10, gutter: 18, indent: pad16 });
  });
  if (gateLine) {
    w.gap(6);
    w.text(gateLine, { size: 10, color: DANGER, font: bold, indent: pad16 });
  }
  if (dqLine) {
    w.gap(4);
    w.text(dqLine, { size: 10, color: DANGER, font: bold, indent: pad16 });
  }
  w.gap(pad16 + 10);

  // ---- fix first ----------------------------------------------------------
  if (model.fixFirst.length) {
    w.ensure(60);
    w.text('Fix first', { font: bold, size: 13 });
    w.gap(4);
    w.text(
      'Rows scored 0 first, then 1, heaviest weight first. A row scored 1 needs a named cover before it is accepted; a row scored 0 needs a fix or a narrower step.',
      { size: 9.5, color: QUIET },
    );
    w.gap(6);
    for (const f of model.fixFirst) {
      const line = `${f.short}, scored ${f.score}${f.weight === null ? '' : `, weight ${f.weight}`}. ${f.anchor}${f.evidence ? ` ${f.evidence}` : ''}`;
      w.labelled(f.num, line, { size: 9.5, gutter: 30, labelColor: f.score === 0 ? DANGER : QUIET });
      w.gap(3);
    }
    w.gap(8);
  }

  w.rule();

  // ---- your answers -------------------------------------------------------
  const stepHeight =
    w.heightOf(model.step.question, bold, 10.5, MEASURE - 24) +
    model.step.options.reduce((h, o) => h + w.heightOf(`${o.name}. ${o.cost}`, body, 9.5, MEASURE - 44) + 4, 0) +
    30;
  // The heading, its intro and section A together, so no heading ends a page alone.
  w.ensure(70 + 44 + stepHeight);
  w.text('Your answers', { font: bold, size: 13 });
  w.gap(2);
  w.text('Each row, the answer you chose, and what the other answers would have needed.', { size: 9.5, color: QUIET });
  w.gap(10);

  // A · the step
  w.text('A  The step', { font: bold, size: 12 });
  w.text(model.step.question, { size: 10, color: QUIET });
  w.gap(8);
  model.step.options.forEach((o, k) => {
    const chosen = model.step.chosen === k;
    if (chosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, SUN);
    w.text(`${o.name}. ${o.cost}`, { size: 9.5, indent: 38, font: chosen ? bold : body, color: chosen ? INK : QUIET });
    w.gap(3);
  });
  if (model.step.chosen === null) w.text('Not chosen. Section C has no weights until it is.', { size: 9, indent: 38, color: DANGER });
  w.gap(10);

  // B · deployment gates
  const gateHeight = (g: ModelSelectionPdfModel['gates'][number]) =>
    w.heightOf(g.q, bold, 10.5, MEASURE - 24) + w.heightOf(`Passes. ${g.passes}`, body, 9.5, MEASURE - 44) + w.heightOf(`Fails. ${g.cost}`, body, 9.5, MEASURE - 44) + 30;
  w.ensure(44 + gateHeight(model.gates[0]));
  w.text('B  Deployment gates  (hard gate)', { font: bold, size: 12 });
  w.text('Can this model be deployed where you need it, on the terms you need?', { size: 10, color: QUIET });
  w.gap(8);
  for (const g of model.gates) {
    w.ensure(gateHeight(g));
    w.labelled(g.num, g.q, { size: 10.5, gutter: 24, font: bold });
    w.gap(3);
    const passChosen = g.chosen === 1;
    const failChosen = g.chosen === 0;
    if (passChosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, SUN);
    w.text(`Passes. ${g.passes}`, { size: 9.5, indent: 38, font: passChosen ? bold : body, color: passChosen ? INK : QUIET });
    w.gap(3);
    if (failChosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, BERRY);
    w.text(`Fails. ${g.cost}`, { size: 9.5, indent: 38, font: failChosen ? bold : body, color: failChosen ? DANGER : QUIET });
    w.gap(3);
    if (g.chosen === null) w.text('Unanswered.', { size: 9, indent: 38, color: DANGER });
    w.gap(8);
  }
  w.gap(4);

  // C · behaviour under test
  const rowHeight = (c: ModelSelectionPdfModel['criteria'][number]) =>
    w.heightOf(c.q, bold, 10.5, MEASURE - 24) + c.anchors.reduce((h, t) => h + w.heightOf(t, body, 9.5, MEASURE - 44) + 4, 0) + 30;
  w.ensure(44 + rowHeight(model.criteria[0]));
  w.text('C  Behaviour under test', { font: bold, size: 12 });
  w.text('What did ten runs on your own four cases show? Weighted by the step chosen in A.', { size: 10, color: QUIET });
  w.gap(8);
  for (const c of model.criteria) {
    w.ensure(rowHeight(c));
    w.labelled(c.num, `${c.q}  (weight ${c.weight === null ? '—' : c.weight}${c.key ? ', marked' : ''})`, { size: 10.5, gutter: 24, font: bold });
    w.gap(3);
    c.anchors.forEach((t, k) => {
      const chosen = c.chosen === k;
      if (chosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, SUN);
      w.text(`${k}  ${t}`, { size: 9.5, indent: 38, font: chosen ? bold : body, color: chosen ? INK : QUIET });
      w.gap(3);
    });
    if (c.chosen === null) w.text('Unanswered. Counts as 0.', { size: 9, indent: 38, color: DANGER });
    w.gap(8);
  }
  w.gap(4);

  // D · disqualifiers
  const dqHeight = (d: ModelSelectionPdfModel['dq'][number]) =>
    w.heightOf(d.q, bold, 10.5, MEASURE - 24) + w.heightOf(`Did not happen. ${d.why}`, body, 9.5, MEASURE - 44) * 2 + 30;
  w.ensure(44 + dqHeight(model.dq[0]));
  w.text('D  Disqualifiers  (hard gate)', { font: bold, size: 12 });
  w.text('Did it do the one thing that ends a candidate?', { size: 10, color: QUIET });
  w.gap(8);
  for (const d of model.dq) {
    w.ensure(dqHeight(d));
    w.labelled(d.num, d.q, { size: 10.5, gutter: 24, font: bold });
    w.gap(3);
    const noChosen = d.chosen === 0;
    const yesChosen = d.chosen === 1;
    if (noChosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, SUN);
    w.text('Did not happen. Not on any of the ten runs, on any of the four cases.', { size: 9.5, indent: 38, font: noChosen ? bold : body, color: noChosen ? INK : QUIET });
    w.gap(3);
    if (yesChosen) w.marker(MARGIN.left + 24, w.cursor - 1, 8, BERRY);
    w.text(`Happened. ${d.why}`, { size: 9.5, indent: 38, font: yesChosen ? bold : body, color: yesChosen ? DANGER : QUIET });
    w.gap(3);
    if (d.chosen === null) w.text('Unanswered.', { size: 9, indent: 38, color: DANGER });
    w.gap(8);
  }

  w.rule();

  // ---- the rubric ---------------------------------------------------------
  w.ensure(60 + model.rubric.slice(0, 2).reduce((h, c) => h + w.heightOf(`${c.name}. ${c.what}`, body, 9.5, MEASURE - 80) + 5, 0));
  w.text('The rubric', { font: bold, size: 13 });
  w.gap(2);
  w.text('The two gates are checked first and ignore the score. The percentage is the weighted score over the weighted maximum for the step chosen.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const c of model.rubric) {
    w.ensure(40);
    w.labelled(c.score, `${c.name}. ${c.what}`, { size: 9.5, gutter: 80, labelColor: c.key === 'gate' || c.key === 'dq' ? DANGER : QUIET });
    w.gap(5);
  }
  w.gap(8);
  w.rule();

  // ---- the four test cases ------------------------------------------------
  const caseHeight = (c: ModelSelectionPdfModel['cases'][number]) =>
    w.heightOf(`How to build it: ${c.build}`, body, 9.5, MEASURE - 30) +
    w.heightOf(`Right answer: ${c.right}`, body, 9.5, MEASURE - 30) +
    w.heightOf(`${c.watchLabel}: ${c.watch}`, body, 9.5, MEASURE - 30) +
    50;
  w.ensure(60 + caseHeight(model.cases[0]));
  w.text('The four test cases, and which rows each one is the evidence for', { font: bold, size: 13 });
  w.gap(2);
  w.text('Build each one out of your own work, not out of a benchmark.', { size: 9.5, color: QUIET });
  w.gap(8);
  for (const c of model.cases) {
    w.ensure(caseHeight(c));
    w.labelled(c.n, c.name, { size: 11, gutter: 30, font: bold, labelColor: QUIET });
    w.text(`How to build it: ${c.build}`, { size: 9.5, indent: 30 });
    w.text(`Right answer: ${c.right}`, { size: 9.5, indent: 30 });
    w.text(`${c.watchLabel}: ${c.watch}`, { size: 9.5, indent: 30, color: c.failure ? DANGER : INK });
    w.gap(2);
    w.text(`Evidence for ${c.evidence}`, { size: 8.5, indent: 30, color: QUIET });
    w.gap(8);
  }
  w.gap(6);

  // ---- join the cohort, on an ember panel with ink text ---------------------
  const ctaH =
    pad16 * 2 +
    w.heightOf(model.cta.heading, bold, 15, drawn) +
    6 +
    model.cta.lines.reduce((h, l) => h + w.heightOf(l, body, 10, drawn) + 4, 0) +
    6 +
    w.heightOf(`${model.cta.action} ${model.cta.url}`, bold, 10, drawn);
  w.panel(ctaH, EMBER, 10);
  const panelTop = w.cursor;
  w.gap(pad16);
  w.text(model.cta.heading, { font: bold, size: 15, indent: pad16 });
  w.gap(6);
  for (const l of model.cta.lines) {
    w.text(l, { size: 10, indent: pad16 });
    w.gap(4);
  }
  w.gap(6);
  w.text(`${model.cta.action} ${model.cta.url}`, { font: bold, size: 10, indent: pad16 });
  // The whole panel is the link, so a reader does not have to hit one line.
  w.link(MARGIN.left, panelTop, MEASURE, ctaH, model.cta.url);
  w.gap(pad16 + 6);

  w.finish(model.footer);
  const bytes = await doc.save();

  // Stage 3's own check: the bytes open as a PDF with the pages we drew.
  const reopened = await PDFDocument.load(bytes);
  const pages = reopened.getPageCount();
  checks.push({ name: `File opens as a PDF (${pages} pages)`, ok: pages >= 3 && reopened.getTitle() === `${TOOL_NAME} — scored copy` });
  if (!checks[checks.length - 1].ok) throw new Error('PDF check failed: file did not reopen as expected');

  return { bytes, checks };
}
