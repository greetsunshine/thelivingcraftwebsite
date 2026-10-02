// Builds the images the PDF renderers embed: `npm run build:pdf-assets`.
//
// WHY THIS EXISTS. pdf-lib embeds PNG and JPEG only. The brand's artwork is
// WebP (the logo) and SVG (the ivory weave), so this script converts them once
// and the PNGs are committed. The server only reads the PNGs; it never needs
// sharp at runtime, which is why sharp is a devDependency.
//
// WHAT IT WRITES, into pdf-assets/brand/ (read by src/lib/resources/pdf-writer.ts):
//   lc-mark.png      the LC mark, from public/brand/lc-mark-keyed.webp
//   lc-name.png      "The Living Craft" lettering, from public/brand/lc-name.webp
//   ivory-weave.png  one weave tile, from public/textures/ivory-weave.svg
//   lc-mark-header.png, lc-name-header.png
//                    the same two images at header size, for the memory kit's
//                    printed PDF: Chrome embeds a header template's images again
//                    on every page, so the full-size pair cost 0.8 MB there
//
// THE LOGO is converted and nothing else: same pixels, same size, same
// transparency. The header pair is the same artwork resized, and only that. CLAUDE.md, "The LC mark": never trace, redraw or recolour it,
// and never show the artwork's tagline. These are the same two crops that
// BrandLockup.astro draws, so the tagline is already cut off.
//
// THE WEAVE is rendered at 4x (the 48px tile becomes 192px), then laid over the
// ivory ground at the weave's own opacity, exactly as `/` layers it: the
// texture on a ::before at --weave-ivory-opacity, over --lc-ivory. Both values
// are read from src/styles/ds/theme.css rather than copied here, so the PDF
// cannot drift from the site. The result is an opaque tile: a PDF viewer draws
// it the same way whatever the page underneath is.
//
// Run it again after changing any of the three source files. It is idempotent.

import sharp from 'sharp';
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join('pdf-assets', 'brand');
mkdirSync(OUT, { recursive: true });

const theme = readFileSync(join('src', 'styles', 'ds', 'theme.css'), 'utf8');
const token = (name) => {
  const m = theme.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`theme.css has no --${name}`);
  return m[1].trim();
};
const ivory = token('lc-ivory');
const opacity = Number(token('weave-ivory-opacity'));
if (!/^#[0-9a-f]{6}$/i.test(ivory) || !(opacity > 0 && opacity <= 1)) {
  throw new Error(`unexpected tokens: --lc-ivory ${ivory}, --weave-ivory-opacity ${opacity}`);
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

// 1. The logo pair: a format change only.
for (const [src, dest] of [
  ['lc-mark-keyed.webp', 'lc-mark.png'],
  ['lc-name.webp', 'lc-name.png'],
]) {
  await sharp(join('public', 'brand', src)).png({ compressionLevel: 9 }).toFile(join(OUT, dest));
}

// 1b. The pair at header size (the kit's 6.5mm mark, at about 220dpi). A
//     resize, nothing else: same artwork, same transparency.
for (const [src, dest, height] of [
  ['lc-mark-keyed.webp', 'lc-mark-header.png', 56],
  ['lc-name.webp', 'lc-name-header.png', 30],
]) {
  await sharp(join('public', 'brand', src)).resize({ height, kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(join(OUT, dest));
}

// 2. The weave tile at 4x, over ivory at the weave's opacity.
const SCALE = 4;
const svg = readFileSync(join('public', 'textures', 'ivory-weave.svg'));
const { data, info } = await sharp(svg, { density: 72 * SCALE })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
if (info.width !== 48 * SCALE || info.height !== 48 * SCALE) {
  throw new Error(`weave rendered at ${info.width}x${info.height}, expected ${48 * SCALE}px square`);
}
const [ir, ig, ib] = hex(ivory);
const rgbOut = Buffer.alloc(info.width * info.height * 3);
for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
  const a = (data[i + 3] / 255) * opacity;
  rgbOut[j] = Math.round(data[i] * a + ir * (1 - a));
  rgbOut[j + 1] = Math.round(data[i + 1] * a + ig * (1 - a));
  rgbOut[j + 2] = Math.round(data[i + 2] * a + ib * (1 - a));
}
await sharp(rgbOut, { raw: { width: info.width, height: info.height, channels: 3 } })
  .png({ compressionLevel: 9 })
  .toFile(join(OUT, 'ivory-weave.png'));

for (const f of ['lc-mark.png', 'lc-name.png', 'lc-mark-header.png', 'lc-name-header.png', 'ivory-weave.png']) {
  const meta = await sharp(join(OUT, f)).metadata();
  console.log(`${f.padEnd(20)} ${meta.width}x${meta.height}  ${(statSync(join(OUT, f)).size / 1024).toFixed(1)} KB`);
}
console.log(`weave over ${ivory} at opacity ${opacity}, from theme.css`);
