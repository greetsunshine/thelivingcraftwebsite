#!/usr/bin/env node
/**
 * Build the two downloads for /resources/agent-memory-audit-kit.
 *
 *   npm run build:kit                  → downloads/agent-memory-audit-kit.pdf
 *                                        downloads/agent-memory-audit-kit.zip
 *                                        downloads/memory-record.schema.json
 *   npm run build:kit -- --url http://localhost:4321   print from a server already running
 *
 * The PDF is printed FROM THE PAGE by headless Chrome, against the print rules
 * in agent-memory-audit-kit.astro. That is the whole reason this is a script
 * and not a checked-in file: the page is the source of truth, and a PDF built
 * any other way is a second document that drifts from it.
 *
 * The ZIP is the kit directory (schema, examples, harness, licences, README)
 * plus the PDF, with caches and virtualenvs left out.
 *
 * Needs: Google Chrome. Nothing else beyond the repo's own dependencies. Chrome
 * is driven over the DevTools protocol with Node's built-in WebSocket, so there
 * is no Playwright or Puppeteer to install.
 */
import { spawn, execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// fileURLToPath, not `.pathname`: on Windows a URL's pathname is "/D:/…", which
// path functions read as a folder named "D:" on the current drive.
const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');
const KIT = join(ROOT, 'kits', 'agent-memory-audit-kit');
const OUT = join(ROOT, 'downloads');
const ROUTE = '/resources/agent-memory-audit-kit';
const PDF = join(OUT, 'agent-memory-audit-kit.pdf');
const ZIP = join(OUT, 'agent-memory-audit-kit.zip');
const SCHEMA_SRC = join(KIT, 'schema', 'memory-record.schema.json');
const SCHEMA_OUT = join(OUT, 'memory-record.schema.json');

// The canonical host, read from facts.ts so this script cannot disagree with the site.
const SITE_ORIGIN = readFileSync(join(ROOT, 'src', 'data', 'facts.ts'), 'utf8').match(/SITE_ORIGIN = '([^']+)'/)?.[1];
if (!SITE_ORIGIN) fail('could not read SITE_ORIGIN from src/data/facts.ts');
// The credit line, from the same constant the page and the footer use.
const TOOL_AUTHOR = readFileSync(join(ROOT, 'src', 'data', 'resources.ts'), 'utf8').match(/TOOL_AUTHOR = '([^']+)'/)?.[1];
if (!TOOL_AUTHOR) fail('could not read TOOL_AUTHOR from src/data/resources.ts');

const args = process.argv.slice(2);
const urlArg = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;

// ── guards: the page and the harness must agree ────────────────────────────
// The page names seven pytest functions. Each has to exist in the test file,
// or a reader runs a command the page told them to and gets "not found".
{
  const data = readFileSync(join(ROOT, 'src', 'data', 'agent-memory-audit-kit.ts'), 'utf8');
  const tests = readFileSync(join(KIT, 'harness', 'tests', 'test_failure_modes.py'), 'utf8');
  const named = [...data.matchAll(/test: '(test_\w+)'/g)].map((m) => m[1]);
  const defined = [...tests.matchAll(/^def (test_\w+)\(/gm)].map((m) => m[1]);
  if (named.length !== 7) fail(`page names ${named.length} tests, expected 7`);
  if (defined.length !== 7) fail(`harness defines ${defined.length} tests, expected 7`);
  for (const t of named) if (!defined.includes(t)) fail(`page names ${t}, which the harness does not define`);
  if (!existsSync(SCHEMA_SRC)) fail(`missing ${SCHEMA_SRC}`);
  JSON.parse(readFileSync(SCHEMA_SRC, 'utf8')); // must be valid JSON
}

// ── a server to print from ─────────────────────────────────────────────────
let server = null;
let base = urlArg;
if (!base) {
  const port = 4300 + Math.floor(Math.random() * 500);
  base = `http://127.0.0.1:${port}`;
  server = spawn('npx', ['astro', 'dev', '--port', String(port), '--host', '127.0.0.1'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.on('data', (d) => process.stderr.write(d));
  await waitFor(`${base}${ROUTE}`, 60_000);
}

// ── Chrome over the DevTools protocol ──────────────────────────────────────
const profile = mkdtempSync(join(tmpdir(), 'memkit-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsBrowser = await new Promise((res, rej) => {
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) res(m[1]);
  });
  chrome.on('exit', () => rej(new Error('Chrome exited before it started listening')));
  setTimeout(() => rej(new Error('Chrome did not start')), 15_000);
});

try {
  const browser = await cdp(wsBrowser);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const page = browser.session(sessionId);

  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 1600, deviceScaleFactor: 1, mobile: false });
  const loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url: `${base}${ROUTE}` });
  await loaded;
  // Fonts arrive after load. A PDF printed before they do falls back to Helvetica.
  // `fonts.ready` alone can resolve too early: the print-only cover and the
  // print sizes ask for their faces only once the page is laid out for print.
  // So lay it out for print first and ask for each face the print uses by name.
  // (Do not judge this by the font names inside the PDF: Chrome labels the web
  // fonts it embeds with system names such as ArialMT. Look at the pages.)
  await page.send('Emulation.setEmulatedMedia', { media: 'print' });
  const faces = await page.send('Runtime.evaluate', {
    expression: `(async () => {
      const want = ['400 16px Figtree', '700 16px Figtree', '400 16px "Source Serif 4"'];
      await Promise.all(want.map((f) => document.fonts.load(f)));
      await document.fonts.ready;
      return want.filter((f) => !document.fonts.check(f));
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (faces.result.value?.length) fail(`fonts did not load: ${faces.result.value.join(', ')}; is the page able to reach Google Fonts?`);
  // The page must be the current one. A dev server that answered before it
  // had rebuilt once printed a cover with last week's byline, so read the
  // cover back and refuse to print anything that disagrees with resources.ts.
  const cover = await page.send('Runtime.evaluate', { expression: 'document.querySelector(".cover")?.textContent ?? ""', returnByValue: true });
  if (!String(cover.result.value).includes(TOOL_AUTHOR)) fail(`the served page's cover does not carry "${TOOL_AUTHOR}"; is the server serving the current source?`);

  // A PDF is a file that travels. Site-relative links inside it would point at
  // whoever opened it, so every one becomes absolute on the canonical host.
  await page.send('Runtime.evaluate', {
    expression: `document.querySelectorAll('a[href^="/"]').forEach((a) => { a.href = new URL(a.getAttribute('href'), ${JSON.stringify(SITE_ORIGIN)}).href; }); true`,
  });

  // The brand on paper, as the four server-built PDFs carry it
  // (src/lib/resources/pdf-writer.ts): every page after the cover has a band of
  // the ivory weave across the top with the lockup on it, and a gold rule
  // under it. Chrome repeats only the page margins, so the band is the header
  // template. The images are the PNGs `npm run build:pdf-assets` makes from the
  // site's own artwork; a template cannot fetch, so they are inlined. The cover
  // page has no margin (`@page :first`), so neither band nor footer shows there.
  const png = (f) => `data:image/png;base64,${readFileSync(join(ROOT, 'pdf-assets', 'brand', f)).toString('base64')}`;
  const header =
    '<div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;width:100%;height:13mm;margin:-4mm 0 0;' +
    `background:#F5F0E6 url(${png('ivory-weave.png')}) 0 0 / 48px 48px repeat;border-bottom:0.6pt solid #B58A46;` +
    'display:flex;align-items:center;gap:1.5mm;padding:0 14mm;box-sizing:border-box;">' +
    `<img src="${png('lc-mark-header.png')}" style="height:6.5mm;width:auto" alt="">` +
    `<img src="${png('lc-name-header.png')}" style="height:3.5mm;width:auto" alt=""></div>`;
  // Figtree is the site's reading face; a template cannot load it, so it is
  // named first and falls back to the system sans. #526259 is --lc-muted.
  const footer =
    '<div style="width:100%;font-family:Figtree,Helvetica,Arial,sans-serif;font-size:7.5px;color:#526259;padding:0 14mm;display:flex;justify-content:space-between;">' +
    `<span>Agent Memory Audit Kit · Built by ${TOOL_AUTHOR} · The Living Craft · CC BY 4.0 / MIT</span>` +
    '<span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>';
  // Printed twice and joined. Chrome draws the header on every page it prints,
  // even one with no margin, so the weave band landed on top of the cover. The
  // cover is printed alone without header or footer; the rest with them.
  const print = async (pageRanges, withChrome) =>
    Buffer.from(
      (
        await page.send('Page.printToPDF', {
          printBackground: true,
          preferCSSPageSize: true,
          displayHeaderFooter: withChrome,
          headerTemplate: withChrome ? header : '<span></span>',
          footerTemplate: withChrome ? footer : '<span></span>',
          marginTop: 0.55,
          marginBottom: 0.7,
          marginLeft: 0.55,
          marginRight: 0.55,
          pageRanges,
          transferMode: 'ReturnAsBase64',
        })
      ).data,
      'base64',
    );
  const coverPdf = await PDFDocument.load(await print('1', false));
  const restPdf = await PDFDocument.load(await print('2-', true));
  const joined = await PDFDocument.create();
  for (const [src, n] of [[coverPdf, 1], [restPdf, restPdf.getPageCount()]]) {
    const pages = await joined.copyPages(src, [...Array(n).keys()]);
    pages.forEach((pg) => joined.addPage(pg));
  }
  joined.setTitle(coverPdf.getTitle() ?? '');
  joined.setAuthor('The Living Craft');
  mkdirSync(OUT, { recursive: true });
  writeFileSync(PDF, await joined.save());
  await browser.send('Target.closeTarget', { targetId });
  browser.close();
} finally {
  // On Windows Chrome still holds its profile for a moment after kill(), and
  // deleting it then fails with EPERM. Wait for the exit, and let rmSync retry.
  const exited = new Promise((res) => chrome.once('exit', res));
  chrome.kill();
  await Promise.race([exited, new Promise((res) => setTimeout(res, 5_000))]);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch (e) {
    // Chrome's child processes can outlive the main one on Windows. A profile
    // left in the temp folder is harmless; a build aborted over it is not.
    console.warn(`build-memory-kit: left ${profile} behind (${e.code})`);
  }
  if (server) server.kill();
}

// pdf-lib writes compressed object streams, so count through it, not a regex.
const pages = (await PDFDocument.load(readFileSync(PDF))).getPageCount();
console.log(`pdf   ${rel(PDF)}  ${kb(PDF)} KB, ${pages} pages`);

// ── the schema, on its own URL ─────────────────────────────────────────────
cpSync(SCHEMA_SRC, SCHEMA_OUT);
console.log(`json  ${rel(SCHEMA_OUT)}  ${kb(SCHEMA_OUT)} KB`);

// ── the ZIP ────────────────────────────────────────────────────────────────
{
  const stage = mkdtempSync(join(tmpdir(), 'memkit-zip-'));
  const dir = join(stage, 'agent-memory-audit-kit');
  const skip = (src) => /(^|\/)(\.venv|__pycache__|\.pytest_cache|[^/]*\.egg-info|dist|\.gitignore)(\/|$)|\.pyc$/.test(src);
  // `skip` matches "/" separators; Windows hands cpSync's filter backslashes.
  cpSync(KIT, dir, { recursive: true, filter: (src) => !skip(src.slice(KIT.length).replaceAll('\\', '/')) });
  cpSync(PDF, join(dir, 'agent-memory-audit-kit.pdf'));
  rmSync(ZIP, { force: true });
  // -X drops macOS extended attributes; -r recurses; -q is quiet. Windows has
  // no `zip`, but its own tar.exe (bsdtar) writes a zip when -a sees ".zip".
  if (process.platform === 'win32') {
    execFileSync(join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-a', '-c', '-f', ZIP, 'agent-memory-audit-kit'], { cwd: stage });
  } else {
    execFileSync('zip', ['-r', '-X', '-q', ZIP, 'agent-memory-audit-kit'], { cwd: stage });
  }
  rmSync(stage, { recursive: true, force: true });
  const listing = execFileSync('unzip', ['-Z1', ZIP], { encoding: 'utf8' }).trim().split('\n');
  const bad = listing.filter((p) => skip(p));
  if (bad.length) fail(`zip contains files it should not: ${bad.join(', ')}`);
  console.log(`zip   ${rel(ZIP)}  ${kb(ZIP)} KB, ${listing.length} entries`);
}

// ── helpers ────────────────────────────────────────────────────────────────
function fail(msg) {
  console.error(`build-memory-kit: ${msg}`);
  process.exit(1);
}
function rel(p) {
  return p.slice(ROOT.length + 1);
}
function kb(p) {
  return Math.round(statSync(p).size / 1024);
}
async function waitFor(url, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  fail(`${url} did not answer within ${ms / 1000}s`);
}

/** The smallest DevTools client that does the job: ids, replies, one-shot events, flat sessions. */
async function cdp(url) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error(`could not connect to ${url}`));
  });
  let id = 0;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(`${msg.error.message} (${msg.error.code})`)) : res(msg.result);
      return;
    }
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i];
      if (w.method === msg.method && (w.sessionId ?? null) === (msg.sessionId ?? null)) {
        waiters.splice(i, 1);
        w.res(msg.params);
      }
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const msgId = ++id;
      pending.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  const once = (method, sessionId) => new Promise((res) => waiters.push({ method, sessionId, res }));
  return {
    send: (m, p) => send(m, p),
    once: (m) => once(m),
    session: (sessionId) => ({ send: (m, p) => send(m, p, sessionId), once: (m) => once(m, sessionId) }),
    close: () => ws.close(),
  };
}
