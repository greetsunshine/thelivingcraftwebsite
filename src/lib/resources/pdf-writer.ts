// The one PDF layout engine and the one brand the resource PDFs share.
//
// Four renderers use it: poc-screen-pdf.ts, model-selection-pdf.ts,
// authority-review-pdf.ts and run-cost-model-pdf.ts. Until 28 September 2026
// only the authority review imported it; the other three each carried a
// private copy of `Writer`, `clean()`, the colours and a wordmark, so the brand
// lived in four places. It lives here now, once.
//
// Built on pdf-lib, which is pure JavaScript, so it runs unchanged inside a
// Vercel function. It reads its fonts and images from pdf-assets/ at the repo
// root, which astro.config.mjs bundles into the function with `includeFiles`,
// the same way it bundles downloads/. Nothing here needs sharp at runtime:
// scripts/build-pdf-assets.mjs makes the PNGs once and they are committed.
//
// ───────────────────────────────────────────────────────────────────────────
// THE BRAND, ON PAPER (design system v1 and the V5 page, September 2026)
// ───────────────────────────────────────────────────────────────────────────
//
// Sunil, 25 September: the PDFs should carry "the texture plus the branding"
// of the site, "that ivory texture we're using for some of the elements", and
// "not the green textile one".
//
//   * The cover page (page 1) is the ivory weave from edge to edge, the texture
//     behind the opening of every page on the site. The lockup, the series,
//     the title and the subtitle sit on it, as a hero does. Everything below
//     them sits on a paper sheet laid over the weave, because the site never
//     puts running text on the texture either.
//   * Every later page is plain paper with a thin band of weave across the top
//     carrying a small lockup. A full-page texture on every page costs ink when
//     printed and makes dense tables harder to read. `WEAVE_EVERY_PAGE` below
//     turns the full weave on for every page, if that is wanted.
//   * The logo is the site's lockup: the LC mark and "The Living Craft"
//     lettering, the same two crops BrandLockup.astro draws, embedded as PNGs.
//     Never traced, redrawn or recoloured, and never with the artwork's tagline.
//   * The title is Source Serif 4, as the site's h1 is. Everything else is
//     Figtree, the site's reading face. Both are embedded and subset, so a
//     file carries only the glyphs it uses.
//   * Colours are the tokens in src/styles/ds/theme.css, named below. Gold is a
//     rule and a fill, never text; accent text is deep gold.
//
// Two limits worth knowing before editing the copy a renderer prints:
//
//   * A character the embedded fonts have no glyph for cannot be drawn.
//     `clean()` drops it, and falls back to ASCII for the three characters the
//     copy uses (→ ₹ −) only if a font ever lacks them. Figtree has all three.
//     Every renderer checks that its own copy loses nothing to `clean()`; a
//     typed name may.
//   * Layout is a cursor moving down the page with word wrapping done here.
//     There is no flow engine: a block that must not split across pages asks
//     `ensure()` for its height first.

import {
  PDFDocument,
  PDFName,
  PDFString,
  clip,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export const PAGE = { w: 595.28, h: 841.89 }; // A4, points
export const MARGIN = { top: 64, right: 52, bottom: 60, left: 52 };
export const MEASURE = PAGE.w - MARGIN.left - MARGIN.right;

/** Full ivory weave on every page, not only the cover. Off: see the head. */
export const WEAVE_EVERY_PAGE = false;

/** One weave tile, in points. The site's tile is 48 CSS px; 48px at 96dpi is 36pt. */
const TILE = 36;
/** The band of weave across the top of every page after the cover. */
const BAND = 40;

// ---------------------------------------------------------------------------
// Colour: design system v1 tokens (src/styles/ds/theme.css)
// ---------------------------------------------------------------------------

const hex = (h: string) =>
  rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

export const FOREST = hex('#183D32'); // --lc-forest: titles, chosen marks, the cohort panel
export const IVORY = hex('#F5F0E6'); // --lc-ivory: the cover ground, text on forest
export const PAPER = hex('#FBF8F2'); // --lc-paper: inner pages and the cover's sheet
export const SOFT = hex('#E5EBE1'); // --lc-soft (--surface-hover): the result panel
export const INK = hex('#172E26'); // --lc-ink: body text
export const MUTED = hex('#526259'); // --lc-muted: labels and secondary text
export const LINE = hex('#CBD1C8'); // --lc-line: rules
export const DEEP_GOLD = hex('#765523'); // --lc-deep-gold: accent TEXT (the series label)
export const GOLD = hex('#B58A46'); // --lc-gold: rules and fills ONLY, never text
export const ERROR = hex('#963D34'); // --lc-error: a hard gate, a stop, a failure

export type Color = ReturnType<typeof rgb>;

// ---------------------------------------------------------------------------
// Assets: pdf-assets/ (fonts and their licences, and the PNGs
// scripts/build-pdf-assets.mjs makes)
// ---------------------------------------------------------------------------

const ASSETS = join(process.cwd(), 'pdf-assets');
const read = (...p: string[]) => readFileSync(join(ASSETS, ...p));

const FILES = {
  body: read('fonts', 'Figtree-Regular.ttf'),
  bold: read('fonts', 'Figtree-Bold.ttf'),
  serif: read('fonts', 'SourceSerif4-Regular.ttf'),
  mark: read('brand', 'lc-mark.png'),
  name: read('brand', 'lc-name.png'),
  weave: read('brand', 'ivory-weave.png'),
};

/**
 * Every code point all three embedded fonts can draw. A string drawn in any of
 * them is safe if each of its characters is in here, which is what `clean()`
 * and `drawsWhole()` test against.
 */
const DRAWABLE: Set<number> = (() => {
  const sets = [FILES.body, FILES.bold, FILES.serif].map((b) => new Set<number>(fontkit.create(b).characterSet));
  const [first, ...rest] = sets;
  return new Set([...first].filter((cp) => rest.every((s) => s.has(cp))));
})();

/** ASCII stand-ins, used only if a font lacks the character (Figtree has all three). */
const FALLBACK: [RegExp, string, number][] = [
  [/→/g, '->', 0x2192],
  [/₹/g, 'INR ', 0x20b9],
  [/−/g, '-', 0x2212],
];

/** The string as the embedded fonts can draw it: line breaks become spaces, anything without a glyph is dropped. */
export const clean = (s: string): string => {
  let out = s.replace(/[\t\n\r\f\v]+/g, ' ');
  for (const [re, sub, cp] of FALLBACK) if (!DRAWABLE.has(cp)) out = out.replace(re, sub);
  return Array.from(out)
    .filter((ch) => DRAWABLE.has(ch.codePointAt(0)!))
    .join('');
};

/** True when `clean()` would change nothing: every character has a glyph in the embedded fonts. */
export const drawsWhole = (s: string): boolean => clean(s) === s;

/**
 * "Scored by <name>", or null when the name cannot be printed whole.
 *
 * Figtree covers Latin only, so a name typed in Devanagari, Tamil or any other
 * script loses those characters in clean(): "सुनील 🙂 Zoë" printed as
 * "Scored by Zoë", a name that is not the reader's. A missing line is honest
 * and a wrong name is not, so a name that does not draw whole is left out.
 * Embedding a font for each Indian script would not fix it either: pdf-lib does
 * no text shaping, so conjuncts and vowel signs would draw in the wrong places.
 */
export const byLine = (label: string, name: string | null | undefined): string | null => {
  const n = (name ?? '').trim();
  if (!n) return null;
  const c = clean(n).trim();
  return c && drawsWhole(n.replace(/\s+/g, ' ')) ? `${label} ${c}` : null;
};

// ---------------------------------------------------------------------------
// The document and its brand
// ---------------------------------------------------------------------------

export interface Brand {
  body: PDFFont;
  bold: PDFFont;
  serif: PDFFont;
  mark: PDFImage;
  name: PDFImage;
  weave: PDFImage;
}

/** A new document with the fonts (subset) and the three images embedded once. */
export async function openBrandedDoc(meta: { title: string; subject?: string }): Promise<{ doc: PDFDocument; brand: Brand }> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(meta.title);
  if (meta.subject) doc.setSubject(meta.subject);
  doc.setAuthor('The Living Craft');
  doc.setProducer('learning.thelivingcraft.ai');
  const brand: Brand = {
    body: await doc.embedFont(FILES.body, { subset: true }),
    bold: await doc.embedFont(FILES.bold, { subset: true }),
    serif: await doc.embedFont(FILES.serif, { subset: true }),
    mark: await doc.embedPng(FILES.mark),
    name: await doc.embedPng(FILES.name),
    weave: await doc.embedPng(FILES.weave),
  };
  return { doc, brand };
}

/**
 * The lockup: the LC mark beside the lettering, as BrandLockup.astro draws it.
 * `height` is the mark's height; the lettering is sized in the site header's
 * ratio (a 44px mark beside 24px lettering, 8px apart). Returns its width.
 */
export function drawLockup(page: PDFPage, brand: Brand, x: number, yTop: number, height: number): number {
  const markW = (brand.mark.width / brand.mark.height) * height;
  const nameH = height * (24 / 44);
  const nameW = (brand.name.width / brand.name.height) * nameH;
  const gap = height * (8 / 44);
  page.drawImage(brand.mark, { x, y: yTop - height, width: markW, height });
  page.drawImage(brand.name, { x: x + markW + gap, y: yTop - height / 2 - nameH / 2, width: nameW, height: nameH });
  return markW + gap + nameW;
}

/**
 * The ivory weave over a rectangle: the one embedded tile, placed in a grid
 * anchored at the page's top-left corner and clipped to the rectangle. The
 * file stores the image once however often it is placed.
 */
export function drawWeave(page: PDFPage, brand: Brand, x: number, y: number, w: number, h: number) {
  page.pushOperators(pushGraphicsState(), rectangle(x, y, w, h), clip(), endPath());
  const firstRow = PAGE.h - Math.floor((PAGE.h - (y + h)) / TILE) * TILE;
  for (let ty = firstRow; ty > y; ty -= TILE) {
    for (let tx = Math.floor(x / TILE) * TILE; tx < x + w; tx += TILE) {
      page.drawImage(brand.weave, { x: tx, y: ty - TILE, width: TILE, height: TILE });
    }
  }
  page.pushOperators(popGraphicsState());
}

/** A flat rounded rectangle. Print rule: a fill, never a shadow. */
export function roundedRect(page: PDFPage, x: number, y: number, w: number, h: number, r: number, color: Color) {
  const d = `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  // drawSvgPath draws downward from (x, y); hand it the top-left corner.
  page.drawSvgPath(d, { x, y: y + h, color, borderWidth: 0 });
}

function wrapWith(text: string, font: PDFFont, size: number, width: number): string[] {
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

export interface Cover {
  /** The series label, top right: "Agentic system design · 01". */
  series?: string;
  /** Source Serif 4, forest. */
  title: string;
  subtitle?: string;
  credit?: string;
}

/**
 * The page decorator every renderer hands to its Writer. Page 1 is the cover:
 * the weave from edge to edge, the lockup, series, title, subtitle and credit
 * on it, and a paper sheet for everything below. Every later page is paper
 * with a weave band and a small lockup. Returns where the text starts.
 */
export function brandedPages(brand: Brand, cover: Cover): (page: PDFPage, pageNo: number) => number {
  const sheet = (page: PDFPage, top: number) => {
    const inset = 18;
    const bottom = MARGIN.bottom - 14;
    roundedRect(page, MARGIN.left - inset, bottom, MEASURE + inset * 2, top - bottom, 8, PAPER);
  };

  return (page, pageNo) => {
    if (pageNo !== 1) {
      if (WEAVE_EVERY_PAGE) {
        drawWeave(page, brand, 0, 0, PAGE.w, PAGE.h);
        sheet(page, PAGE.h - BAND - 12);
      } else {
        page.drawRectangle({ x: 0, y: 0, width: PAGE.w, height: PAGE.h, color: PAPER });
        drawWeave(page, brand, 0, PAGE.h - BAND, PAGE.w, BAND);
        page.drawLine({ start: { x: 0, y: PAGE.h - BAND }, end: { x: PAGE.w, y: PAGE.h - BAND }, thickness: 0.6, color: GOLD });
      }
      drawLockup(page, brand, MARGIN.left, PAGE.h - 11, 18);
      return PAGE.h - MARGIN.top - (WEAVE_EVERY_PAGE ? 8 : 0);
    }

    // The cover: the weave, then the opening on it, then the sheet.
    drawWeave(page, brand, 0, 0, PAGE.w, PAGE.h);
    drawLockup(page, brand, MARGIN.left, PAGE.h - 34, 30);
    if (cover.series) {
      const s = clean(cover.series).toUpperCase();
      const size = 7.5;
      page.drawText(s, {
        x: PAGE.w - MARGIN.right - brand.bold.widthOfTextAtSize(s, size),
        y: PAGE.h - 52,
        size,
        font: brand.bold,
        color: DEEP_GOLD,
      });
    }
    let y = PAGE.h - 34 - 30 - 28;
    const titleSize = 26;
    for (const line of wrapWith(cover.title, brand.serif, titleSize, MEASURE)) {
      page.drawText(line, { x: MARGIN.left, y: y - titleSize * 0.8, size: titleSize, font: brand.serif, color: FOREST });
      y -= titleSize * 1.12;
    }
    if (cover.subtitle) {
      y -= 6;
      for (const line of wrapWith(cover.subtitle, brand.body, 10, MEASURE)) {
        page.drawText(line, { x: MARGIN.left, y: y - 10, size: 10, font: brand.body, color: INK });
        y -= 14;
      }
    }
    if (cover.credit) {
      y -= 4;
      page.drawText(clean(cover.credit), { x: MARGIN.left, y: y - 8.5, size: 8.5, font: brand.body, color: MUTED });
      y -= 12;
    }
    const sheetTop = y - 18;
    sheet(page, sheetTop);
    return sheetTop - 22;
  };
}

// ---------------------------------------------------------------------------
// The writer
// ---------------------------------------------------------------------------

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
  private pageNo = 0;
  readonly body: PDFFont;
  readonly bold: PDFFont;
  readonly serif: PDFFont;
  private decorate: (page: PDFPage, pageNo: number) => number;

  constructor(doc: PDFDocument, brand: Brand, decorate: (page: PDFPage, pageNo: number) => number) {
    this.doc = doc;
    this.body = brand.body;
    this.bold = brand.bold;
    this.serif = brand.serif;
    this.decorate = decorate;
    this.newPage();
  }

  private newPage() {
    this.page = this.doc.addPage([PAGE.w, PAGE.h]);
    this.pageNo += 1;
    // The decorator draws the cover or the band and says where text starts.
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
      color: LINE,
    });
    this.y -= 10;
  }

  /** Word-wrap `text` to `width` at `size` in `font`. */
  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    return wrapWith(text, font, size, width);
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
    opts: { size?: number; labelColor?: Color; gutter?: number; font?: PDFFont; indent?: number; color?: Color } = {},
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
      color: opts.labelColor ?? MUTED,
    });
    this.text(text, { size, indent: indent + gutter, font: opts.font, color: opts.color });
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
      color: MUTED,
    });
    this.text(value, { size, indent: vi });
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
    opts: { size?: number; font?: PDFFont; color?: Color; colors?: (Color | undefined)[]; fonts?: (PDFFont | undefined)[]; lh?: number; indent?: number } = {},
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

  /** A small filled square: the chosen answer, a failed gate, the leading option. */
  marker(x: number, yTop: number, size: number, color: Color) {
    this.page.drawRectangle({ x, y: yTop - size, width: size, height: size, color });
  }

  /** A flat panel across the measure, with a small radius. */
  panel(height: number, color: Color, radius = 8) {
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
        y: MARGIN.bottom - 34,
        size: 7.5,
        font: this.body,
        color: MUTED,
      });
    });
  }
}
