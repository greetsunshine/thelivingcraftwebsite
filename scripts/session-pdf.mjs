#!/usr/bin/env node
/**
 * Build a PDF of one session's learner copy, from the session file itself.
 *
 *   node scripts/session-pdf.mjs 1            → ~/Downloads/living-craft-week-1.pdf
 *   node scripts/session-pdf.mjs 1 --out /tmp → writes there instead
 *
 * The point of a script rather than a checked-in PDF: src/content/sessions/week-N.md
 * is the source of truth, and a PDF committed beside it becomes a second surface
 * saying the same thing. Regenerate instead of editing.
 *
 * Learner copy only. The instructor notes, the drill solutions and the teardown
 * answers live in docs/teaching/ and deliberately do not go through here — a PDF
 * is a file that gets forwarded, and those are the things that must not be.
 *
 * Needs: pandoc, and Google Chrome (headless, for the print engine).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const week = args.find((a) => /^\d+$/.test(a));
if (!week) {
  console.error('usage: node scripts/session-pdf.mjs <week-number> [--out <dir>]');
  process.exit(1);
}
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(homedir(), 'Downloads');
const src = resolve(`src/content/sessions/week-${week}.md`);

// --- front matter, so the cover page states what this is -------------------
const raw = readFileSync(src, 'utf8');
const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
if (!fm) throw new Error(`no front matter in ${src}`);
const meta = Object.fromEntries(
  fm[1].split('\n').filter(Boolean).map((l) => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  })
);
const body = raw.slice(fm[0].length);

const tmp = mkdtempSync(join(tmpdir(), 'session-pdf-'));
const mdPath = join(tmp, 'body.md');
writeFileSync(mdPath, body, 'utf8');

const fragment = execFileSync(
  'pandoc',
  [mdPath, '--from=gfm', '--to=html5', '--syntax-highlighting=none'],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const today = new Date().toISOString().slice(0, 10);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>The Living Craft — Week ${esc(week)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  :root{
    --noir:#000;--ember:#fd8549;--sun:#ffc123;--mist:#f1f3f5;
    --ink-1:#16212e;--ink-2:#6d7885;--ink-3:#a3acb8;
    --line:#e7eaef;--danger:#cf0f45;
    --body:"Figtree","Avenir Next","Helvetica Neue",sans-serif;
    --mono:"JetBrains Mono",ui-monospace,Menlo,monospace;
  }
  @page{ size:A4; margin:20mm 18mm 18mm; }
  @page:first{ margin:0; }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{font-family:var(--body);font-size:10.5pt;line-height:1.55;color:var(--ink-1);
       font-variant-numeric:tabular-nums;-webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* cover */
  .cover{height:297mm;padding:34mm 24mm;background:var(--noir);color:#fff;
         display:flex;flex-direction:column;justify-content:space-between;
         page-break-after:always;break-after:page}
  .cover .k{font-family:var(--mono);font-size:9pt;color:var(--ink-3);letter-spacing:.02em}
  .cover h1{font-size:30pt;line-height:1.08;letter-spacing:normal;font-weight:800;margin:8mm 0 0;max-width:20ch;word-spacing:.02em}
  .cover .sum{font-size:13pt;line-height:1.45;color:#d4dae1;margin-top:6mm;max-width:44ch}
  .cover .rule{height:2px;background:var(--sun);width:56mm;margin:9mm 0 0}
  .cover dl{display:grid;grid-template-columns:auto 1fr;gap:2.5mm 7mm;margin:0;
            font-family:var(--mono);font-size:9pt}
  .cover dt{color:var(--ink-3)} .cover dd{margin:0;color:#fff}
  .cover .foot{font-family:var(--mono);font-size:8pt;color:var(--ink-3);line-height:1.6}

  /* body */
  h1,h2,h3,h4{letter-spacing:-.02em;line-height:1.15;font-weight:800;
              break-after:avoid;page-break-after:avoid}
  h2{font-size:19pt;margin:11mm 0 3mm;padding-top:3mm;border-top:2px solid var(--noir)}
  h2:first-of-type{margin-top:0}
  h3{font-size:13pt;margin:7mm 0 2mm}
  h4{font-size:11pt;margin:5mm 0 1.5mm}
  p,ul,ol{margin:0 0 3.2mm}
  ul,ol{padding-left:5.5mm} li{margin-bottom:1.6mm}
  strong{font-weight:700}
  em{font-style:italic;color:var(--ink-1)}
  a{color:var(--ink-1);text-decoration:none;border-bottom:1px solid var(--sun)}
  code{font-family:var(--mono);font-size:9pt;background:var(--mist);
       padding:.5mm 1.2mm;border-radius:2px}
  pre{font-family:var(--mono);font-size:8.5pt;line-height:1.5;background:var(--noir);
      color:#e7eaef;padding:4mm 5mm;border-radius:3mm;overflow-x:hidden;
      white-space:pre-wrap;word-break:break-word;margin:0 0 4mm;
      break-inside:avoid;page-break-inside:avoid}
  pre code{background:none;padding:0;color:inherit;font-size:inherit}
  blockquote{margin:0 0 4mm;padding:3mm 0 3mm 5mm;border-left:2px solid var(--sun);
             color:var(--ink-1)}
  blockquote p:last-child{margin-bottom:0}
  table{border-collapse:collapse;width:100%;font-size:9.5pt;margin:0 0 4mm;
        break-inside:avoid;page-break-inside:avoid}
  th,td{text-align:left;vertical-align:top;padding:2mm 3mm;border-bottom:1px solid var(--line)}
  th{font-family:var(--mono);font-size:8pt;font-weight:500;color:var(--ink-2);
     border-bottom:1.5px solid var(--ink-1)}
  hr{border:0;border-top:1px solid var(--line);margin:7mm 0}
  input[type=checkbox]{margin-right:2mm}
  li > input[type=checkbox]{margin-left:-5mm}
</style></head>
<body>
<section class="cover">
  <div>
    <div class="k">The Living Craft · week ${esc(week)}${meta.module ? ' · ' + esc(meta.module) : ''}</div>
    <h1>${esc(meta.title || '')}</h1>
    <div class="rule"></div>
    <p class="sum">${esc(meta.summary || '')}</p>
  </div>
  <dl>
    <dt>Session</dt><dd>Five hours, live online</dd>
    <dt>Status</dt><dd>${esc(meta.status || '')}</dd>
    <dt>Generated</dt><dd>${today}</dd>
    <dt>Source</dt><dd>src/content/sessions/week-${esc(week)}.md</dd>
  </dl>
  <div class="foot">
    Learner copy. The instructor notes, the drill solutions and the teardown answers<br>
    are not in this file and are not to be circulated to participants.<br>
    Regenerate with <span style="color:#fff">node scripts/session-pdf.mjs ${esc(week)}</span> — do not edit this PDF.
  </div>
</section>
${fragment}
</body></html>`;

const htmlPath = join(tmp, 'page.html');
writeFileSync(htmlPath, html, 'utf8');

const pdfTmp = join(tmp, 'out.pdf');
execFileSync(CHROME, [
  '--headless', '--disable-gpu', '--no-sandbox',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfTmp}`,
  '--virtual-time-budget=12000',
  `file://${htmlPath}`,
], { stdio: 'ignore' });

const out = resolve(outDir, `living-craft-week-${week}.pdf`);
copyFileSync(pdfTmp, out);
rmSync(tmp, { recursive: true, force: true });
console.log(out);
