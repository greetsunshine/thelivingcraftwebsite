// The one PDF layout engine the resource renderers share.
//
// Built on pdf-lib, which is pure JavaScript: no headless browser, no font
// files on disk, no native module, so it runs unchanged inside a Vercel
// function. Until 17 September 2026 this class lived twice, once in
// poc-screen-pdf.ts and once in authority-review-pdf.ts, with a note in the
// second saying to lift it when a third renderer arrived. The Run-Cost Model
// Tool is the third, so it lives here now and all three import it.
//
// Two limits worth knowing before editing the copy a renderer prints:
//
//   * Standard fonts encode WinAnsi only. Curly quotes, en and em dashes, the
//     multiplication sign and the ellipsis are all fine; an arrow, a rupee sign
//     or an emoji is not, and pdf-lib throws on one. `clean()` maps the few we
//     use and drops the rest rather than crashing a download over a glyph.
//   * Layout is a cursor moving down the page with word wrapping done here.
//     There is no flow engine: a block that must not split across pages asks
//     `ensure()` for its height first.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

export const PAGE = { w: 595.28, h: 841.89 }; // A4, points
export const MARGIN = { top: 56, right: 52, bottom: 60, left: 52 };
export const MEASURE = PAGE.w - MARGIN.left - MARGIN.right;

export const INK = rgb(0.086, 0.129, 0.18); // #16212e
export const QUIET = rgb(0.38, 0.42, 0.47);
export const RULE = rgb(0.86, 0.88, 0.9);
export const DANGER = rgb(0.81, 0.06, 0.27); // #cf0f45
export const SUN = rgb(1, 0.757, 0.137); // #ffc123

export type Color = ReturnType<typeof rgb>;

export const clean = (s: string): string =>
  s
    .replace(/→/g, '->')
    .replace(/₹/g, 'INR ')
    // The working lines subtract with a true minus, which the standard fonts lack.
    .replace(/−/g, '-')
    .replace(/[^\x20-\x7e\xa0-\xff–—‘’“”…•]/g, '');

export interface Column {
  /** Left edge, in points from the left margin. */
  x: number;
  /** Width in points. */
  w: number;
  align?: 'left' | 'right';
}

export class Writer {
  private doc: PDFDocument;
  private page!: PDFPage;
  private y = 0;
  readonly body: PDFFont;
  readonly bold: PDFFont;

  constructor(doc: PDFDocument, body: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.body = body;
    this.bold = bold;
    this.newPage();
  }

  /** A document with the two standard fonts embedded, and a writer on its first page. */
  static async open(meta: { title: string }): Promise<{ doc: PDFDocument; w: Writer }> {
    const doc = await PDFDocument.create();
    doc.setTitle(meta.title);
    doc.setAuthor('The Living Craft');
    doc.setProducer('learning.thelivingcraft.ai');
    const body = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    return { doc, w: new Writer(doc, body, bold) };
  }

  private newPage() {
    this.page = this.doc.addPage([PAGE.w, PAGE.h]);
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
    opts: { font?: PDFFont; size?: number; color?: Color; indent?: number; width?: number; lh?: number } = {},
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
  labelled(
    label: string,
    text: string,
    opts: { size?: number; labelColor?: Color; gutter?: number; font?: PDFFont; color?: Color } = {},
  ) {
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
    this.text(text, { size, indent: gutter, font: opts.font, color: opts.color });
  }

  /** A field of one step: a small label at the step's indent, the value beside it. */
  field(label: string, value: string, opts: { labelIndent?: number; valueIndent?: number; size?: number } = {}) {
    const size = opts.size ?? 9.5;
    const li = opts.labelIndent ?? 24;
    const vi = opts.valueIndent ?? 90;
    this.ensure(size * 1.4);
    this.page.drawText(clean(label), {
      x: MARGIN.left + li,
      y: this.y - size,
      size: size - 1,
      font: this.bold,
      color: QUIET,
    });
    this.text(value, { size, indent: vi });
  }

  /**
   * One table row. The first cell wraps inside its column; the others sit on
   * the first line. Right-aligned cells are for numbers. The row never splits
   * across a page.
   */
  columns(
    cells: string[],
    cols: Column[],
    opts: { size?: number; font?: PDFFont; color?: Color; colors?: (Color | undefined)[]; fonts?: (PDFFont | undefined)[]; lh?: number } = {},
  ) {
    const size = opts.size ?? 9;
    const lh = opts.lh ?? 1.35;
    const font = opts.font ?? this.body;
    const first = this.wrap(cells[0] ?? '', opts.fonts?.[0] ?? font, size, cols[0].w);
    const height = Math.max(1, first.length) * size * lh;
    this.ensure(height);
    const top = this.y;
    first.forEach((line, i) => {
      this.page.drawText(line, {
        x: MARGIN.left + cols[0].x,
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
      const x = cols[i].align === 'right' ? MARGIN.left + cols[i].x + cols[i].w - width : MARGIN.left + cols[i].x;
      this.page.drawText(s, { x, y: top - size, size, font: f, color: opts.colors?.[i] ?? opts.color ?? INK });
    }
    this.y = top - height;
  }

  /** A filled marker square, used for a chosen anchor. */
  marker(x: number, yTop: number, size: number, color: Color) {
    this.page.drawRectangle({ x, y: yTop - size, width: size, height: size, color });
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
        size: 8,
        font: this.body,
        color: QUIET,
      });
    });
  }
}
