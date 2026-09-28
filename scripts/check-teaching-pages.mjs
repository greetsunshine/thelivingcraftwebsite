// npm run check:teaching — the drift checks between a learner page and its
// instructor page.
//
// WHY THIS EXISTS. Building week 2's two pages took four rounds of the same
// defect: an index going stale behind the content. The clock listed nine of
// eleven blocks, the run of show was missing six beats that had notes cards, the
// headings in the instructor's two columns said different things from each other
// and from the handout, and the sections ran out of clock order. Every one was
// found by Sunil reading the page, and every one is mechanical.
//
// So the rules are checked rather than remembered. Nine of them:
//
//   1  the two pages' clock tables are byte-identical
//   2  the learner page's sections run in clock order
//   3  the instructor's notes column runs in clock order
//   4  the instructor's run of show is monotonic by time
//   5  every learner card appears in the clock
//   6  every run-of-show row appears in the clock
//   7  the run of show and the notes column agree heading for heading
//   8  every learner heading exists on the instructor page
//   9  both pages are well-formed HTML
//
// USAGE. The pages are published Artifacts, not files in this repo, so they are
// fetched to disk first and this runs over the copies:
//
//   node scripts/check-teaching-pages.mjs <learner.html> <instructor.html>
//
// It exits non-zero on the first failing rule, so it can gate a republish.
//
// WHAT IT DOES NOT DO. It does not judge teaching quality, wording, or whether a
// question is clear — those are the four checks in CLAUDE.md and they need a
// reader. This only catches the class of fault where two views of one thing stop
// agreeing.

import { readFileSync } from 'node:fs';

const [learnerPath, instructorPath] = process.argv.slice(2);
if (!learnerPath || !instructorPath) {
  console.error('usage: node scripts/check-teaching-pages.mjs <learner.html> <instructor.html>');
  process.exit(2);
}

const learner = readFileSync(learnerPath, 'utf8');
const instructor = readFileSync(instructorPath, 'utf8');

/** Strip tags and collapse whitespace, so two spellings of one heading match. */
const txt = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#183;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^›\s*/, '')
    .replace(/\.$/, '');

/** The clock table, from its heading to the end of its body. */
const clockOf = (html) => {
  const at = html.indexOf('Five hours, five blocks');
  if (at < 0) return null;
  const head = html.indexOf('<thead>', at);
  const end = html.indexOf('</tbody>', head);
  return head < 0 || end < 0 ? null : html.slice(head, end + 8);
};

/** Headings named inside the clock's last column. */
const clockHeadings = (clock) => {
  const out = new Set();
  for (const cell of clock.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)) {
    for (const part of cell[1].split('<br>')) {
      const t = txt(part);
      if (t) out.add(t);
    }
  }
  return out;
};

/** The learner page's content cards, in document order, with their stated time. */
const learnerCards = (html) => {
  const out = [];
  const blocks =
    html.matchAll(
      /<section class="(?:card|ember|cp)"[^>]*>([\s\S]*?)<\/section>|<div class="fail">([\s\S]*?)<\/div>\s*<\/div>|<div class="q-item">([\s\S]*?)<\/div>\s*<\/div>/g,
    ) ?? [];
  for (const m of blocks) {
    const body = m[1] ?? m[2] ?? m[3] ?? '';
    const h = body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    if (!h) continue;
    const near = body.slice(0, h.index + h[0].length + 560);
    const t = near.match(/(\d\d:\d\d)/);
    out.push({ title: txt(h[1]), at: t?.[1] ?? null });
  }
  return out;
};

/** The instructor's run-of-show rows: time plus heading, in document order. */
const runOfShow = (html) =>
  [...html.matchAll(/<div class="t">(\d\d:\d\d)<\/div>\s*<div class="b">\s*<h4>([\s\S]*?)<\/h4>/g)].map(
    (m) => ({ at: m[1], title: txt(m[2]) }),
  );

/** The instructor's notes cards: id, stated time, heading, in document order. */
const notesCards = (html) => {
  const from = html.indexOf('id="refpane"');
  const to = html.indexOf('<div class="head" id="quiz"');
  const slice = html.slice(from < 0 ? 0 : from, to < 0 ? html.length : to);
  return [...slice.matchAll(/<article class="card" id="([a-z0-9-]+)">([\s\S]*?)<h3>([\s\S]*?)<\/h3>/g)].map(
    (m) => {
      const pairs = m[2].match(/<span class="pairs">([^<]*)<\/span>/);
      return {
        id: m[1],
        at: pairs ? (pairs[1].match(/(\d\d:\d\d)/)?.[1] ?? null) : null,
        title: txt(m[3]),
      };
    },
  );
};

/** All headings on a page, including the instructor's reveal labels. */
const headings = (html, withSummaries) => {
  const tags = withSummaries ? 'h2|h3|h4|summary' : 'h2|h3|h4';
  const out = new Set();
  for (const m of html.matchAll(new RegExp(`<(${tags})[^>]*>([\\s\\S]*?)</\\1>`, 'g'))) {
    out.add(txt(m[2]));
  }
  return out;
};

/** Tag balance, ignoring scripts and the void elements an SVG is full of. */
const wellFormed = (html) => {
  const VOID = new Set([
    'br', 'img', 'link', 'meta', 'hr', 'input', 'source', 'col', 'area', 'base', 'wbr',
    'embed', 'track', 'param', 'path', 'line', 'polyline', 'rect', 'circle', 'polygon',
    'use', 'stop', 'marker',
  ]);
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const stack = [];
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = m;
    const tag = name.toLowerCase();
    if (VOID.has(tag) || selfClosing === '/') continue;
    if (!closing) stack.push(tag);
    else if (stack.at(-1) === tag) stack.pop();
    else if (stack.includes(tag)) return `mismatched </${tag}>`;
    else return `stray </${tag}>`;
  }
  return stack.length ? `unclosed <${stack.at(-1)}>` : null;
};

// ── the checks ─────────────────────────────────────────────────────────────
const lClock = clockOf(learner);
const iClock = clockOf(instructor);
const lCards = learnerCards(learner);
const rows = runOfShow(instructor);
const notes = notesCards(instructor);

// Two cards can share a heading — every checkpoint is "Checkpoint · you can
// now…" — so ordering is checked on times, never on a heading lookup.
const timed = (list) => list.filter((x) => x.at).map((x) => x.at);
const sorted = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);

// Logistics cards sit outside the five hours on purpose: the pre-work is before
// the day and the reading is after it.
const LOGISTICS = new Set([
  'Six things to bring',
  'Five hours, five blocks, nothing longer than an hour',
  'Five things before next session',
  'Four things worth your time',
]);
// Drill scaffolding repeats inside every drill card and is deliberately not
// mirrored on the instructor page, which carries it inside each sequence.
const SCAFFOLD = /^(Decide|Build|Check|Then the part)/;

const inClock = lClock ? clockHeadings(lClock) : new Set();
const noteById = new Map(notes.map((n) => [n.id, n.title]));
const beatRefs = [
  ...instructor.matchAll(/data-ref="#([a-z0-9-]+)"[\s\S]{0,400}?<h4>([\s\S]*?)<\/h4>/g),
].map((m) => ({ id: m[1], title: txt(m[2]) }));

const checks = [
  ['both pages have a clock', !!lClock && !!iClock],
  ['clocks are byte-identical', lClock === iClock],
  [
    'learner page runs in clock order',
    sorted(timed(lCards.filter((c) => !LOGISTICS.has(c.title)))),
  ],
  ['instructor notes column runs in clock order', sorted(timed(notes))],
  [`instructor run of show is monotonic (${rows.length} rows)`, sorted(rows.map((r) => r.at))],
  [
    'every learner card is in the clock',
    lCards.filter((c) => !LOGISTICS.has(c.title) && !inClock.has(c.title)).length === 0,
    () => lCards.filter((c) => !LOGISTICS.has(c.title) && !inClock.has(c.title)).map((c) => c.title),
  ],
  [
    'every run-of-show row is in the clock',
    rows.filter((r) => !inClock.has(r.title)).length === 0,
    () => rows.filter((r) => !inClock.has(r.title)).map((r) => r.title),
  ],
  [
    'run of show and notes column agree heading for heading',
    beatRefs.every((b) => !noteById.has(b.id) || noteById.get(b.id) === b.title),
    () =>
      beatRefs
        .filter((b) => noteById.has(b.id) && noteById.get(b.id) !== b.title)
        .map((b) => `${b.id}: "${b.title}" vs "${noteById.get(b.id)}"`),
  ],
  [
    'every learner heading exists on the instructor page',
    [...headings(learner, false)].filter(
      (h) => !SCAFFOLD.test(h) && !headings(instructor, true).has(h),
    ).length === 0,
    () =>
      [...headings(learner, false)].filter(
        (h) => !SCAFFOLD.test(h) && !headings(instructor, true).has(h),
      ),
  ],
  ['learner page is well-formed', wellFormed(learner) === null, () => [wellFormed(learner)]],
  [
    'instructor page is well-formed',
    wellFormed(instructor) === null,
    () => [wellFormed(instructor)],
  ],
];

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}   ${name}`);
  if (!ok) {
    failed += 1;
    for (const line of (detail?.() ?? []).slice(0, 12)) console.log(`         ${line}`);
  }
}

console.log(
  failed === 0
    ? `\ncheck:teaching — all ${checks.length} checks pass.`
    : `\ncheck:teaching — ${failed} of ${checks.length} failed.`,
);
process.exit(failed === 0 ? 0 : 1);
