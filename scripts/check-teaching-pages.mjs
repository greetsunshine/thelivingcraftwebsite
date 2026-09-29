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

// --by-topic switches to the consolidated shape: one learner page and one
// instructor page holding all six topics, each in a collapsible, in TOPIC order
// rather than clock order. The clock-order and run-of-show checks are about a
// page that claims to be a run of show, so they do not apply there; what does
// apply is that the two pages agree, that six topics are on both, and that six
// topics on one page have not collided on an id.
const args = process.argv.slice(2);
const byTopic = args.includes('--by-topic');
// How many collapsible topics the consolidated pages should hold. Week 2 has
// seven; week 3 has six. It was hard-wired to week 2's count, which meant the
// check failed on a correct week 3 pair and would have been "fixed" by editing
// the number, breaking week 2 the same day. Default stays 7 so every command
// written before week 3 existed keeps its meaning.
const topicsArg = args.find((a) => a.startsWith('--topics='));
const wantTopics = topicsArg ? Number(topicsArg.slice('--topics='.length)) : 7;
const [learnerPath, instructorPath] = args.filter(
  (a) => a !== '--by-topic' && !a.startsWith('--topics='),
);
if (!learnerPath || !instructorPath) {
  console.error(
    'usage: node scripts/check-teaching-pages.mjs [--by-topic] [--topics=N] <learner.html> <instructor.html>',
  );
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
  // Two page shapes carry a clock and the heading differs. A whole-session page
  // says "Five hours, N blocks"; a topic page says "Where this topic sits".
  // This was pinned to the first wording alone, so on the topic pages it found
  // no clock, returned null for both, and then "clocks are byte-identical"
  // passed because null === null. Three of the eleven checks were passing
  // vacuously. Match either.
  const at = html.search(/Five hours, [a-z]+ blocks|Where this topic sits/i);
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
  [
    // span on the topic pages, div on a whole-session page. Pinned to div, this
    // found zero rows and the monotonic check passed on an empty list.
    ...html.matchAll(
      /<(?:div|span) class="t">(\d\d:\d\d)<\/(?:div|span)>\s*<div class="b">\s*<h4>([\s\S]*?)<\/h4>/g,
    ),
  ].map((m) => ({ at: m[1], title: txt(m[2]) }));

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
// Matched by pattern, not by exact title, for the same reason the clock heading
// is: three of these four name a count, and a count changes when the session
// does. "Four things worth your time" became seven on 28 September.
const LOGISTICS_PATTERNS = [
  /^Six things to bring$/i,
  /^Five hours, [a-z]+ blocks\b/i,
  /^[A-Z][a-z]+ things before next session$/i,
  /^[A-Z][a-z]+ things worth your time$/i,
  // A topic page frames itself before the clock starts and closes after it.
  /^What this topic is for$/i,
  /^Where this topic sits$/i,
  /^The line this topic exists to land$/i,
  /^After this topic, you can now$/i,
  // The consolidated pages frame the whole session before the clock starts.
  /^What today is for$/i,
  /^Five hours, [a-z]+ blocks$/i,
  /^Six topics, in their own order$/i,
  /^How the day ends$/i,
  /^What to prepare$/i,
  // Topic 0's three reading cards. They sit outside the clock on purpose: the
  // definition and the why are four minutes of argument that block 1 has no
  // room for, and the named-products card is reference a room only reaches if
  // it asks. Exact titles rather than a pattern, so a real beat losing its
  // clock row cannot hide behind them.
  /^So what is a guardrail$/i,
  /^Why an agent needs these and a batch job does not$/i,
  /^What firms already running this use$/i,
];
const LOGISTICS = {
  has: (title) => LOGISTICS_PATTERNS.some((re) => re.test(title)),
};
// Drill scaffolding repeats inside every drill card and is deliberately not
// mirrored on the instructor page, which carries it inside each sequence.
const SCAFFOLD = /^(Decide|Build|Check|Then the part)/;

const inClock = lClock ? clockHeadings(lClock) : new Set();
const noteById = new Map(notes.map((n) => [n.id, n.title]));
const beatRefs = [
  // The attribute holds a bare id. With the "#" required this matched nothing
  // and the heading-agreement check passed on an empty list.
  ...instructor.matchAll(/data-ref="#?([a-z0-9-]+)"[\s\S]{0,400}?<h4>([\s\S]*?)<\/h4>/g),
].map((m) => ({ id: m[1], title: txt(m[2]) }));

/** Ids are page-unique, and six topics on one page is six chances to collide. */
const duplicateIds = (html) => {
  const seen = new Set();
  const dupes = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) {
    if (seen.has(m[1])) dupes.add(m[1]);
    seen.add(m[1]);
  }
  return [...dupes];
};

/** The collapsible topic sections, in document order. */
const topicIds = (html) =>
  [...html.matchAll(/<details class="topic" id="(t\d+)"/g)].map((m) => m[1]);

const pairChecks = [
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
];

const topicChecks = [
  [
    'learner page has no duplicate ids',
    duplicateIds(learner).length === 0,
    () => duplicateIds(learner),
  ],
  [
    'instructor page has no duplicate ids',
    duplicateIds(instructor).length === 0,
    () => duplicateIds(instructor),
  ],
  // Seven since 29 September: topic 0 carries the three block-1 framing beats
  // that were filed as "shared" and so belonged to no topic page at all.
  [
    `${wantTopics} collapsible topics on the learner page`,
    topicIds(learner).length === wantTopics,
    () => [`found ${topicIds(learner).length}`],
  ],
  [
    'both pages carry the same topics, in the same order',
    topicIds(learner).join(',') === topicIds(instructor).join(','),
    () => [topicIds(learner).join(','), topicIds(instructor).join(',')],
  ],
];

const checks = [
  ['both pages have a clock', !!lClock && !!iClock],
  ['clocks are byte-identical', lClock === iClock],
  ...(byTopic ? topicChecks : pairChecks),
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
