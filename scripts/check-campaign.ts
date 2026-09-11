// The campaign destination checker.
//
//   npm run check:campaign                       # against a local dev server
//   npm run check:campaign -- --base https://…   # against a deployment
//   npm run check:campaign -- --id LC-V4-D10     # one post
//   npm run check:campaign -- --strict           # fail on any blocked post
//
// ───────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
// ───────────────────────────────────────────────────────────────────────────
//
// `Release_Controls.md` asks, before each asset, to "verify the linked
// destination, resource and form where relevant", and then says the sentence
// this whole file is built around:
//
//     "The ready written copy is not evidence that these dependencies are
//      satisfied."
//
// Thirty-two posts are written, hashed and sitting in an approval tracker. A
// post that goes out pointing at a 404 is the failure that sentence names, and
// NOBODY WILL NOTICE IT BY READING THE COPY. The copy is perfect; the link is
// dead; the reader is gone. It is the same class of quiet failure as the Q&A
// agent inventing a price — well-formed output, wrong world — and it wants the
// same answer: something that actually goes and looks.
//
// So this resolves, for every one of the 32 posts, the thing the post points
// at, and reports ready / blocked / not checkable.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT "READY" MEANS HERE, AND WHAT IT DOES NOT
// ───────────────────────────────────────────────────────────────────────────
//
// Ready means: THE DESTINATION RESOLVES. The page answers 200 at the address
// the post will carry, the tracking parameters on that address match the
// contract and survive any redirect, and where the CTA promises a form or a
// download, that form or that download is present in what the server actually
// served.
//
// It is NOT a claim that a submitted application persists, that an email goes
// out, or that a resource's contents have been approved. Those are E01–E18 and
// V4-E01–E05 in `npm run acceptance` and in a human's hands, and this script
// says so on the posts they apply to rather than letting a green word imply
// them. A checker that guesses is worse than no checker, because it is
// believed — the same rule `scripts/acceptance.ts` runs on: a thing that
// cannot be verified is REPORTED as such, never quietly passed.
//
// ───────────────────────────────────────────────────────────────────────────
// WHY A RESOURCE POST NEEDS THE DOWNLOAD CHECKED AND NOT JUST THE PAGE
// ───────────────────────────────────────────────────────────────────────────
//
//     "Resource-led D10/D16/D20 cannot be scheduled until their approved
//      resource is hosted and downloads work."
//
// Two conditions, and the second is the one a page fetch cannot see. The house
// pattern for these downloads is a build-time `data:` URL on an `<a download>`
// (see `src/pages/resources/templates/[...slug].astro`) — chosen so a download
// needs no script and no round trip. The failure mode that comes with it is
// specific: the anchor renders, the button looks right, and the payload behind
// it is empty, truncated or not the type it claims. Nothing 404s. So the data
// URL is decoded here and the bytes are looked at.
//
// ───────────────────────────────────────────────────────────────────────────
// WHY THE EXIT CODE IS GATED ON THE APPROVAL TRACKER
// ───────────────────────────────────────────────────────────────────────────
//
// Every post in `Approval_Tracker.csv` currently reads `asset_approval:
// Pending` and `publication_authority: Not granted`. Nothing may be scheduled,
// so nothing blocked is yet a build failure — and failing the build today
// would train everybody to ignore this script long before the first post is
// approved.
//
// So: a blocked post is REPORTED always, and fails the run only once the
// tracker says that post is approved for scheduling. The moment somebody grants
// authority for D10 while `/resources/cost-ceiling-worksheet/` is still a 404,
// this exits 1. `--strict` fails on any blocked post regardless, which is the
// right setting for a pre-approval sweep.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The one owner of the CSV escaping rule. It imports nothing, which is why it
// is safe under `--experimental-strip-types` — see the note at its head.
import { csvCell } from '../src/lib/admin/csv.ts';

// ---------------------------------------------------------------------------
// Arguments — the house pattern from scripts/add-staff.ts
// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const flag = `--${name}`;
  const i = process.argv.indexOf(flag);
  const next = process.argv[i + 1];
  if (i > -1 && next && !next.startsWith('--')) return next;
  const inline = process.argv.find((a) => a.startsWith(`${flag}=`));
  return inline?.slice(flag.length + 1);
}

const BASE = (arg('base') ?? 'http://localhost:4321').replace(/\/+$/, '');
const STRICT = process.argv.includes('--strict');
const ONLY = arg('id')?.trim().toUpperCase();
const PACKAGE = arg('package');

const usage = () => {
  console.log(`
Check that every V4 campaign post points at something that resolves.

  npm run check:campaign
  npm run check:campaign -- --base https://learning.thelivingcraft.ai
  npm run check:campaign -- --id LC-V4-D10
  npm run check:campaign -- --strict

  --base    where to check. Default http://localhost:4321. Absolute campaign
            destinations on the canonical host are re-based onto it, so a local
            run tests the ROUTE, not DNS.
  --id      one post, by id.
  --strict  exit 1 on any blocked post, not only on an approved one.
  --package a different copy of the campaign package. For the next drop, and
            for exercising the approval gate below against a doctored copy
            rather than by editing Alchemy's files.

Reads, and never writes: campaign.json, Resource_Register.csv,
Approval_Tracker.csv and Ein_Addendum.md. campaign.json is Alchemy's source of
record.
`);
};

// ---------------------------------------------------------------------------
// The package
// ---------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR =
  PACKAGE ??
  join(
    HERE,
    '..',
    'docs',
    'Website Rebuild 10-09-2026',
    'website_addendum_11-09-2026',
    '2026-09-11_V4_Campaign',
  );

/**
 * The UTM contract, from Ein_Addendum.md § "Save and attribute correctly" and
 * restated in Reporting_Controls.md.
 *
 * `utm_content` is the post id IN LOWERCASE, and that detail is the reason
 * this is checked at all. An uppercase or stale id does not break anything a
 * visitor can see — it surfaces weeks later as a row of attribution nobody can
 * join to a post, by which time the campaign is over. The addendum is
 * explicit on the other half too: "Do not reuse LC-OCT IDs for V4
 * attribution."
 */
const UTM_CONTRACT = {
  utm_campaign: 'lc_v4_cohort',
  utm_source: 'linkedin',
  utm_medium: 'organic_social',
} as const;

/**
 * The canonical host, per CLAUDE.md and every absolute destination in
 * campaign.json. It is not assumed: a destination on any other host is
 * reported rather than silently re-based, because re-basing an unexpected host
 * onto our own server would turn somebody else's URL into a green tick.
 */
const CANONICAL_HOST = 'learning.thelivingcraft.ai';

// ---------------------------------------------------------------------------
// Reading the package
// ---------------------------------------------------------------------------

function read(file: string): string {
  const path = join(PACKAGE_DIR, file);
  if (!existsSync(path)) {
    console.error(`\n  ${file} is not in ${PACKAGE_DIR}.\n`);
    process.exit(1);
  }
  return readFileSync(path, 'utf8');
}

/** RFC 4180 enough for this package: quotes, doubled quotes, CRLF, a BOM. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i] ?? '';
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const header = (rows.shift() ?? []).map((h) => h.trim());
  return rows
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

interface Post {
  id: string;
  day: number;
  batch: string;
  format: string;
  cta: string;
  destination: string;
  resourceId: string;
}

function readCampaign(): Post[] {
  const raw: unknown = JSON.parse(read('campaign.json'));
  if (!Array.isArray(raw)) {
    console.error('\n  campaign.json is not an array. Nothing here understands that shape.\n');
    process.exit(1);
  }
  return raw.map((entry, i) => {
    const e = (entry ?? {}) as Record<string, unknown>;
    return {
      id: String(e.id ?? `«entry ${i} has no id»`),
      day: Number(e.day ?? 0),
      batch: String(e.batch ?? ''),
      format: String(e.format ?? ''),
      cta: String(e.cta ?? ''),
      destination: String(e.destination ?? '').trim(),
      resourceId: String(e.resource_id ?? '').trim(),
    };
  });
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

interface Fetched {
  status: number;
  ok: boolean;
  finalUrl: string;
  hops: string[];
  contentType: string;
  body: string;
  error?: string;
}

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

/**
 * Follows redirects by hand, because the redirect CHAIN is evidence.
 *
 * A trailing-slash redirect that drops the query string is a live failure
 * mode: the page still answers 200 and every UTM the post carried is gone, so
 * the campaign reports as direct traffic and no report shows an error. The
 * final URL is checked against the contract further down for exactly this.
 */
async function get(url: string, wantBody: boolean): Promise<Fetched> {
  const hops: string[] = [];
  let current = url;

  for (let hop = 0; hop <= 5; hop++) {
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: 'manual',
        headers: { Accept: 'text/html,application/xhtml+xml,*/*' },
        signal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      return {
        status: 0,
        ok: false,
        finalUrl: current,
        hops,
        contentType: '',
        body: '',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const location = res.headers.get('location');
    if (REDIRECTS.has(res.status) && location) {
      const next = new URL(location, current).toString();
      hops.push(`${res.status} → ${next}`);
      current = next;
      continue;
    }

    const contentType = res.headers.get('content-type') ?? '';
    const body = wantBody ? await res.text() : '';
    if (!wantBody) await res.body?.cancel().catch(() => {});
    return { status: res.status, ok: res.ok, finalUrl: current, hops, contentType, body };
  }

  return {
    status: 0,
    ok: false,
    finalUrl: current,
    hops,
    contentType: '',
    body: '',
    error: 'more than five redirects — a loop, or a chain nobody meant to build',
  };
}

// ---------------------------------------------------------------------------
// The UTM contract
// ---------------------------------------------------------------------------

const carriesUtm = (u: URL): boolean => [...u.searchParams.keys()].some((k) => k.startsWith('utm_'));

/**
 * The address the post will actually carry.
 *
 * If the stored destination already carries tracking, it is used as stored and
 * checked — inventing a correction would hide the very error worth finding. If
 * it carries none, the contract's parameters are added, because that is what
 * goes in the post, and the tracked address is the one worth resolving.
 */
function trackedUrl(destination: URL, post: Post): { url: URL; supplied: boolean } {
  if (carriesUtm(destination)) return { url: destination, supplied: false };
  const url = new URL(destination.toString());
  for (const [k, v] of Object.entries(UTM_CONTRACT)) url.searchParams.set(k, v);
  url.searchParams.set('utm_content', post.id.toLowerCase());
  // "Add resource_id for the resource interaction" — Ein_Addendum.md. The
  // value is taken verbatim from campaign.json; the addendum specifies
  // lowercase for utm_content only, and inventing a case rule for this one
  // would be guessing at somebody else's reporting dimension.
  if (post.resourceId) url.searchParams.set('resource_id', post.resourceId);
  return { url, supplied: true };
}

function utmProblems(u: URL, post: Post): string[] {
  const problems: string[] = [];
  for (const [key, want] of Object.entries(UTM_CONTRACT)) {
    const got = u.searchParams.get(key);
    if (got === null) problems.push(`${key} is missing`);
    else if (got !== want) problems.push(`${key}=${got}, the contract says ${want}`);
  }
  const want = post.id.toLowerCase();
  const got = u.searchParams.get('utm_content');
  if (got === null) problems.push('utm_content is missing');
  else if (got !== want) {
    problems.push(
      got.toLowerCase() === want
        ? `utm_content=${got} is not lowercase — the contract says ${want}`
        : `utm_content=${got}, expected ${want}`,
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Downloads
// ---------------------------------------------------------------------------

interface Anchor {
  href: string;
  filename: string;
}

/**
 * Every `<a download …>` in the served markup.
 *
 * An anchor WITHOUT the attribute is a link, not a download, and is left
 * alone: the addendum keeps the HTML open and makes the file optional, so
 * reading the page is not the thing under test here.
 */
function downloadAnchors(html: string): Anchor[] {
  const out: Anchor[] = [];
  for (const [tag] of html.matchAll(/<a\b[^>]*>/gi)) {
    const attrs = new Map<string, string>();
    for (const m of tag.matchAll(/([a-zA-Z_:][-\w:.]*)\s*=\s*"([^"]*)"|([a-zA-Z_:][-\w:.]*)\s*=\s*'([^']*)'/g)) {
      const name = (m[1] ?? m[3] ?? '').toLowerCase();
      attrs.set(name, m[2] ?? m[4] ?? '');
    }
    const bare = /\sdownload(?=[\s>])/i.test(tag);
    if (!attrs.has('download') && !bare) continue;
    const href = attrs.get('href') ?? '';
    if (!href) continue;
    const named = attrs.get('download') ?? '';
    out.push({ href, filename: named || href.split(/[?#]/)[0]?.split('/').pop() || '(unnamed)' });
  }
  return out;
}

interface DownloadResult {
  ok: boolean;
  label: string;
}

const bytesLabel = (n: number) => `${n.toLocaleString('en-GB')} bytes`;

/**
 * Does the payload look like what its media type claims?
 *
 * Deliberately shallow. A PDF that does not start with `%PDF-` is not a PDF,
 * and a CSV of one line is a header with no worksheet under it — both are the
 * "the button works, the file is rubbish" failure. Anything beyond that is a
 * judgement about content, which belongs to Sunil's technical review and not
 * to a link checker.
 */
function payloadProblem(mediaType: string, bytes: Buffer): string | null {
  if (bytes.length === 0) return 'decodes to zero bytes';
  const type = mediaType.toLowerCase();
  if (type.includes('pdf')) {
    return bytes.subarray(0, 5).toString('latin1') === '%PDF-'
      ? null
      : 'declares itself a PDF and does not begin %PDF-';
  }
  const text = bytes.toString('utf8');
  if (text.trim() === '') return 'decodes to whitespace only';
  if (type.includes('csv')) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length < 2) return `declares itself a CSV and holds ${lines.length} non-empty line(s)`;
  }
  return null;
}

async function checkDownload(a: Anchor, pageUrl: string): Promise<DownloadResult> {
  // -- a data: URL, which is the house pattern for these files --------------
  if (/^data:/i.test(a.href)) {
    const comma = a.href.indexOf(',');
    if (comma < 0) return { ok: false, label: `${a.filename} — malformed data: URL (no comma)` };
    const meta = a.href.slice(5, comma);
    const payload = a.href.slice(comma + 1);
    const isBase64 = /;base64$/i.test(meta);
    const mediaType = meta.split(';')[0] || 'text/plain';

    let bytes: Buffer;
    try {
      bytes = isBase64
        ? Buffer.from(payload, 'base64')
        : Buffer.from(decodeURIComponent(payload), 'utf8');
    } catch (err) {
      return {
        ok: false,
        label: `${a.filename} — data: URL will not decode (${err instanceof Error ? err.message : String(err)})`,
      };
    }

    const problem = payloadProblem(mediaType, bytes);
    const lines = mediaType.includes('pdf')
      ? ''
      : `, ${bytes.toString('utf8').split(/\r?\n/).filter((l) => l.trim() !== '').length} lines`;
    return problem
      ? { ok: false, label: `${a.filename} — ${problem}` }
      : { ok: true, label: `${a.filename} — data:${mediaType}, ${bytesLabel(bytes.length)}${lines} decoded` };
  }

  // -- a file served from a route -------------------------------------------
  let url: URL;
  try {
    url = new URL(a.href, pageUrl);
  } catch {
    return { ok: false, label: `${a.filename} — href is neither a data: URL nor a resolvable address` };
  }
  if (!/^https?:$/.test(url.protocol)) {
    return { ok: false, label: `${a.filename} — ${url.protocol} is not something this can fetch` };
  }
  if (url.origin !== new URL(pageUrl).origin) {
    // Not a failure and not a pass. Somebody else's server is somebody else's
    // uptime, and a green tick here would be a claim about it.
    return { ok: false, label: `${a.filename} — hosted off-site at ${url.host}; not verified here` };
  }

  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return { ok: false, label: `${a.filename} — ${res.status} at ${url.pathname}` };
    const bytes = Buffer.from(await res.arrayBuffer());
    const mediaType = (res.headers.get('content-type') ?? 'application/octet-stream').split(';')[0] ?? '';
    const problem = payloadProblem(mediaType, bytes);
    return problem
      ? { ok: false, label: `${a.filename} — ${problem}` }
      : { ok: true, label: `${a.filename} — 200 ${mediaType}, ${bytesLabel(bytes.length)}` };
  } catch (err) {
    return {
      ok: false,
      label: `${a.filename} — ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// The forms a CTA promises
// ---------------------------------------------------------------------------

/**
 * Which route's form a CTA obliges the destination to render.
 *
 * `src/lib/pipeline/forms.ts` holds one definition for the three routes and
 * `RouteForm.astro` stamps `data-route="…"` on each. That attribute is the
 * contract checked here — the same argument as `data-tour`: a class is a
 * styling decision somebody renames in a redesign, and the check would then
 * pass or fail for reasons unrelated to whether the form is there.
 *
 * The failure this catches is real and quiet. Eight posts say APPLY. If the
 * application form moves behind a flag, or off this page, those eight posts
 * still resolve 200 and still send everybody to a page with nothing to apply
 * with.
 */
function routesPromisedBy(cta: string): string[] {
  const c = cta.toLowerCase();
  const routes: string[] = [];
  if (c.includes('apply')) routes.push('application');
  if (c.includes('enquir') || c.includes('ask about')) routes.push('enquiry');
  return routes;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

type Status = 'ready' | 'blocked' | 'not checkable';

interface Result {
  id: string;
  status: Status;
  target: string;
  lines: string[];
}

const results: Result[] = [];

const MARK: Record<Status, string> = {
  ready: 'READY  ',
  blocked: 'BLOCKED',
  'not checkable': '   —   ',
};

function record(id: string, status: Status, target: string, lines: string[]) {
  results.push({ id, status, target, lines });
  console.log(`  ${MARK[status]}  ${id}  ${target}`);
  for (const line of lines) console.log(`             ${line}`);
}

// ---------------------------------------------------------------------------

async function run() {
  if (process.argv.includes('--help')) {
    usage();
    return;
  }

  const posts = readCampaign();
  const register = parseCsv(read('Resource_Register.csv'));
  const tracker = parseCsv(read('Approval_Tracker.csv'));
  const addendum = read('Ein_Addendum.md');

  console.log(`\nCampaign destination check — ${BASE}`);
  console.log(`Run at ${new Date().toISOString()}`);
  console.log(`${posts.length} posts in campaign.json (read-only; it is Alchemy's source of record)\n`);

  const alive = await get(BASE, false);
  if (!alive.ok) {
    console.error(
      `  Nothing is answering at ${BASE}${alive.error ? ` (${alive.error})` : ` (${alive.status})`}.`,
    );
    console.error('  Start the dev server, or pass --base.\n');
    process.exitCode = 1;
    return;
  }

  // -- the mapping, stated ---------------------------------------------------
  //
  // A reader has to be able to see what was assumed. The path is NOT hardcoded
  // here: it is the `proposed_path` column of Resource_Register.csv, which is
  // the package's own answer, and it is cross-checked against the prose in
  // Ein_Addendum.md so that two sources agreeing is visible and two sources
  // disagreeing is loud.
  interface Resource {
    id: string;
    title: string;
    path: string;
    before: string;
    inAddendum: boolean;
  }
  const resources = new Map<string, Resource>();
  for (const row of register) {
    const id = row.resource_id ?? '';
    const path = row.proposed_path ?? '';
    if (!id || !path) continue;
    resources.set(id, {
      id,
      title: row.title ?? '',
      path,
      before: row.publish_before_post ?? '',
      inAddendum: addendum.includes(path),
    });
  }

  console.log('  Resource mapping — assumed from Resource_Register.csv, column `proposed_path`:');
  for (const r of resources.values()) {
    const pointedAt = posts.find((p) => p.destination.toLowerCase() === `resource:${r.id.toLowerCase()}`);
    const agrees = pointedAt && pointedAt.id === r.before;
    console.log(
      `    ${r.id}  ${r.title.padEnd(28)} → ${r.path.padEnd(38)} before ${r.before || '(unstated)'}`,
    );
    console.log(
      `             path named in Ein_Addendum.md: ${r.inAddendum ? 'yes' : 'NO — the two documents disagree'}` +
        ` · campaign.json points ${pointedAt ? pointedAt.id : 'no post'} at it: ${agrees ? 'agrees' : 'DISAGREES with the register'}`,
    );
  }
  console.log(
    `\n  UTM contract — Ein_Addendum.md: utm_campaign=${UTM_CONTRACT.utm_campaign} · utm_source=${UTM_CONTRACT.utm_source}`,
  );
  console.log(
    `  · utm_medium=${UTM_CONTRACT.utm_medium} · utm_content=<post id, lowercase> · resource_id where there is a resource.`,
  );
  console.log('  No destination in campaign.json stores a query string, so the tracked address is');
  console.log('  assembled here and it is that address which is fetched — not the bare path.\n');

  const trackerRow = new Map(tracker.map((r) => [r.id ?? '', r]));

  // -- post by post ----------------------------------------------------------
  const chosen = ONLY ? posts.filter((p) => p.id.toUpperCase() === ONLY) : posts;
  if (ONLY && !chosen.length) {
    console.error(`  No post with id ${ONLY} in campaign.json.\n`);
    process.exitCode = 1;
    return;
  }

  for (const post of chosen) {
    const dest = post.destination;
    const resourceMatch = /^resource:(.+)$/i.exec(dest);

    // -- no linked destination ----------------------------------------------
    if (!resourceMatch && !/^(https?:|mailto:|\/)/i.test(dest)) {
      record(post.id, 'not checkable', dest || '(destination is empty)', [
        dest
          ? 'No linked destination — the CTA is answered in the post and its comments. Nothing resolves, so nothing can 404.'
          : 'campaign.json carries no destination for this post. Ask Alchemy which it is.',
      ]);
      continue;
    }

    // -- mailto --------------------------------------------------------------
    if (/^mailto:/i.test(dest)) {
      const address = dest.slice(7).split('?')[0] ?? '';
      record(post.id, 'not checkable', dest, [
        `A mail address is a legitimate destination and is not a route. Nothing here can prove ${address} is monitored;`,
        'that is a human confirming receipt. Reported, deliberately, rather than counted as a pass or a failure.',
      ]);
      continue;
    }

    // -- work out the address ------------------------------------------------
    let destination: URL;
    const lines: string[] = [];

    if (resourceMatch) {
      const wanted = (resourceMatch[1] ?? '').trim();
      const resource = resources.get(wanted);
      if (!resource) {
        record(post.id, 'not checkable', dest, [
          `Resource_Register.csv gives no proposed_path for ${wanted}, so there is no address to resolve.`,
          'The mapping is the register\'s to state; inventing one here would be the guess this script exists to refuse.',
        ]);
        continue;
      }
      if (post.resourceId && post.resourceId !== wanted) {
        lines.push(
          `campaign.json disagrees with itself: destination names ${wanted}, resource_id says ${post.resourceId}.`,
        );
      }
      destination = new URL(resource.path, `https://${CANONICAL_HOST}`);
    } else {
      try {
        destination = new URL(dest, `https://${CANONICAL_HOST}`);
      } catch {
        record(post.id, 'blocked', dest, ['Not a resolvable address.']);
        continue;
      }
      if (destination.host !== CANONICAL_HOST) {
        record(post.id, 'not checkable', dest, [
          `Points at ${destination.host}, which is not ${CANONICAL_HOST}. This checker stands in for our own`,
          'server only; re-basing somebody else\'s host onto it would turn their URL into our green tick.',
        ]);
        continue;
      }
    }

    // The canonical host is swapped for --base so a local run tests the ROUTE.
    // The host itself is not under test here and a dev server cannot answer for
    // DNS or a certificate.
    const tracked = trackedUrl(destination, post);
    const target = new URL(tracked.url.pathname + tracked.url.search, BASE);

    const utm = utmProblems(tracked.url, post);
    if (utm.length) {
      lines.push(
        `UTM: ${utm.join('; ')}${tracked.supplied ? ' — in the address assembled here, which means the contract itself is not being met' : ' — as stored in campaign.json'}.`,
      );
    }

    const page = await get(target.toString(), true);
    for (const hop of page.hops) lines.push(`redirect ${hop}`);

    if (!page.ok) {
      // Trailing slash is the commonest reason a proposed path and a built
      // route disagree, and the remedy differs from "the page does not exist",
      // so the two are distinguished rather than both reported as a 404.
      const alt = target.pathname.endsWith('/')
        ? target.pathname.replace(/\/+$/, '')
        : `${target.pathname}/`;
      const altUrl = new URL(alt + target.search, BASE);
      const other = alt === '' ? null : await get(altUrl.toString(), false);
      const detail = page.error ? page.error : `${page.status}`;
      lines.push(`${detail} at ${target.pathname}${target.search}`);
      if (other?.ok) {
        lines.push(
          `${alt} answers 200. The address in the post is the register's, so this is a missing redirect, not a missing page.`,
        );
      } else if (resourceMatch) {
        lines.push('The resource is not hosted. Release_Controls.md holds this post unscheduled until it is.');
      }
      record(post.id, 'blocked', `${dest}${resourceMatch ? ` → ${destination.pathname}` : ''}`, lines);
      continue;
    }

    lines.push(`200 at ${target.pathname}${target.search}`);

    // Did the tracking survive the trip? A redirect that drops the query is
    // the quiet version of this whole problem: the page loads, the campaign
    // reports as direct traffic, and no error is raised anywhere.
    const landed = new URL(page.finalUrl);
    const lost = utmProblems(landed, post);
    if (page.hops.length && lost.length) {
      lines.push(`Attribution did not survive the redirect: ${lost.join('; ')}.`);
    }

    let ok = utm.length === 0 && !(page.hops.length && lost.length);

    // -- the resource's downloads -------------------------------------------
    if (resourceMatch) {
      const anchors = downloadAnchors(page.body);
      if (!anchors.length) {
        lines.push(
          'The page is hosted and offers no <a download> in the served markup. "Hosted and downloads work" is two',
        );
        lines.push(
          'conditions; a download built by script at run time cannot be verified from here and is not claimed.',
        );
        ok = false;
      } else {
        for (const anchor of anchors) {
          const result = await checkDownload(anchor, target.toString());
          lines.push(`${result.ok ? 'download' : 'DOWNLOAD FAILS'}: ${result.label}`);
          if (!result.ok) ok = false;
        }
      }
      lines.push(
        'Whether these files are the APPROVED version is Sunil\'s technical review and is not checked here.',
      );
    }

    // -- the form a CTA promises --------------------------------------------
    const promised = routesPromisedBy(post.cta);
    for (const route of promised) {
      const present = new RegExp(`data-route=["']${route}["']`).test(page.body);
      lines.push(
        present
          ? `form present: data-route="${route}"`
          : `NO FORM: the CTA is "${post.cta}" and the page served no form with data-route="${route}".`,
      );
      if (!present) ok = false;
    }
    if (promised.length) {
      lines.push(
        'Routing only. That a submission persists and is followed up is E01/E02/E04 in `npm run acceptance`, not this.',
      );
    }

    record(post.id, ok ? 'ready' : 'blocked', `${dest}${resourceMatch ? ` → ${destination.pathname}` : ''}`, lines);
  }

  // -- the summary -----------------------------------------------------------
  const ready = results.filter((r) => r.status === 'ready');
  const blocked = results.filter((r) => r.status === 'blocked');
  const unchecked = results.filter((r) => r.status === 'not checkable');

  console.log(
    `\n  ${ready.length} ready · ${blocked.length} blocked · ${unchecked.length} not checkable · of ${results.length}\n`,
  );
  console.log('  READY   the address the post will carry answers 200, its tracking matches the contract,');
  console.log('          and the form or download the CTA promises is in what the server served.');
  console.log('          It is NOT a claim that a submission persists or that a file is approved.');
  console.log('  BLOCKED something the post points at does not resolve, or does not work.');
  console.log('  —       nothing to resolve, or nothing this can stand in for. The reason is on the line.\n');

  if (blocked.length) {
    console.log(`  Blocked: ${blocked.map((r) => r.id).join(', ')}\n`);
  }

  // -- does campaign.json agree with the tracker about what needs testing? ---
  const disagreements: string[] = [];
  for (const post of chosen) {
    const row = trackerRow.get(post.id);
    if (!row) {
      disagreements.push(`${post.id} is in campaign.json and not in Approval_Tracker.csv`);
      continue;
    }
    const needsTest = /^(resource:|https?:|\/)/i.test(post.destination);
    const says = (row.route_test ?? '').toLowerCase();
    if (needsTest && says === 'not applicable') {
      disagreements.push(`${post.id} has a destination and the tracker marks route_test "Not applicable"`);
    }
    if (!needsTest && says !== 'not applicable') {
      disagreements.push(`${post.id} has no destination and the tracker marks route_test "${row.route_test}"`);
    }
  }
  console.log(
    disagreements.length
      ? `  campaign.json and Approval_Tracker.csv disagree about ${disagreements.length} post(s):\n    ${disagreements.join('\n    ')}\n`
      : '  campaign.json and Approval_Tracker.csv agree about which posts have a route to test.\n',
  );

  // -- the exit code, and why it is what it is -------------------------------
  //
  // "Approved for scheduling" is read from the tracker rather than assumed:
  // publication_authority granted AND asset_approval no longer pending. Both,
  // because either alone is somebody halfway through the checklist.
  const approved = chosen.filter((post) => {
    const row = trackerRow.get(post.id);
    if (!row) return false;
    const authority = (row.publication_authority ?? '').toLowerCase();
    const asset = (row.asset_approval ?? '').toLowerCase();
    return (
      authority !== '' &&
      !authority.startsWith('not') &&
      !authority.startsWith('pending') &&
      asset !== '' &&
      !asset.startsWith('pending') &&
      !asset.startsWith('not')
    );
  });
  const approvedAndBlocked = blocked.filter((r) => approved.some((p) => p.id === r.id));

  console.log(
    `  Approved for scheduling, per Approval_Tracker.csv: ${approved.length} of ${chosen.length}` +
      (approved.length ? ` — ${approved.map((p) => p.id).join(', ')}` : ' (asset_approval Pending, publication_authority Not granted).'),
  );
  if (approvedAndBlocked.length) {
    console.log(
      `  ${approvedAndBlocked.length} of them is blocked: ${approvedAndBlocked.map((r) => r.id).join(', ')}. That is a failure.`,
    );
  } else if (blocked.length) {
    console.log(
      '  None of the blocked posts is approved for scheduling yet, so this run does not fail the build.',
    );
    console.log('  It will, on the day one of them is approved while its destination is still missing.');
    console.log('  Use --strict to fail on any blocked post.');
  }
  console.log('');

  // -- paste-ready, beside the approval tracker ------------------------------
  console.log('  Paste beside Approval_Tracker.csv (id,route_test):\n');
  const at = new Date().toISOString();
  for (const r of results.filter((x) => x.status !== 'not checkable')) {
    const note = `${r.status} ${at} ${BASE} — ${r.lines.join(' · ')}`;
    console.log(`  ${r.id},${csvCell(note)}`);
  }
  console.log('');

  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(BASE)) {
    console.log('  This run was against a LOCAL server. The handoff says twice that a local demonstration');
    console.log('  is not evidence of a working public route — re-run with --base against the deployment');
    console.log('  before recording a route_test for publication authority.\n');
  }

  console.log('  Not checked here, and each belongs to somebody: the approved copy hash and the graphic or');
  console.log('  video version (Approval_Tracker.csv), whether a resource matches its approved content');
  console.log('  (Sunil\'s technical review), persistence and follow-up behind a form (`npm run acceptance`),');
  console.log('  mobile and keyboard behaviour (V4-E04), and whether anybody reads apply@thelivingcraft.ai.\n');

  process.exitCode = approvedAndBlocked.length || (STRICT && blocked.length) ? 1 : 0;
}

run().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exitCode = 1;
});
