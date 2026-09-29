// npm run build:teaching <week> — emit a week's learner page and instructor page
// from one content module.
//
// WHY THIS EXISTS. `check:teaching` catches drift between the two pages AFTER it
// has happened, and building week 2 took four rounds of exactly that: the clock
// listed nine of eleven blocks, the run of show was missing six beats, the two
// instructor columns said different things from each other and from the handout.
// Every one of those is a consequence of maintaining two copies of one thing by
// hand.
//
// So the pair is generated from one source and `check:teaching` becomes the
// regression test rather than the review process. One beat in the content module
// produces three places on two pages, and they cannot disagree:
//
//   learner page      <h2> the beat title </h2>, the learner's own material
//   instructor left   <h4> the same title </h4> inside .beat[data-ref]
//   instructor right  <h3> the same title </h3> inside article.card#<its ref id>
//
// The clock comes from scripts/teaching-clock.mjs, so neither page holds a time
// this repo has not agreed to.
//
//   node scripts/build-teaching-pages.mjs 3
//
// writes dist-teaching/week-3-learner.html and dist-teaching/week-3-instructor.html.
// Those are build products. Publish them as Artifacts and record the links in
// docs/teaching/README.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import { clock, WEEKS } from './teaching-clock.mjs';

const week = Number(process.argv[2] ?? 3);
const rows = WEEKS[week];
if (!rows) {
  console.error(`no clock for week ${week}. Weeks: ${Object.keys(WEEKS).join(', ')}`);
  process.exit(2);
}
const C = await import(`./teaching-content/week-${week}.mjs`);

// ── week-specific wording ──────────────────────────────────────────────────
//
// These strings were week 3's, written straight into the template. Week 1 has
// five blocks, not eight, a quiz at 04:20 rather than 04:10, and a bank of
// fifteen rather than ten, so every one of them was wrong for it. They are now
// read off the content module, and every default is exactly the week 3 text, so
// week 3's two pages build byte-identical to before this change.
const W = {
  blocksHeading: 'Five hours, eight blocks',
  topicsHeading: 'Six topics, in their own order',
  clockLabelAt: '00:08',
  quizAt: '04:10',
  quizHeading: 'Eight questions, twelve minutes',
  quizBankLine: 'eight asked, ten in the bank',
  closeAt: '04:50',
  closeRange: '04:46 to 05:00',
  toolsHeading: 'The six, in the order they are placed',
  footerTopics: 'all six topics',
  // Clock rows that are the opening rather than a teaching beat, so no topic is
  // expected to cover them. Week 1's opening runs 00:00 and 00:08.
  openingTimes: ['00:00', '00:10'],
  ...(C.week.wording ?? {}),
};

// ── helpers ────────────────────────────────────────────────────────────────

/** Every time this week's content claims, checked against the generated clock. */
const clockTimes = new Set(rows.map(([at]) => at));
const claimed = new Set();
const claim = (at) => {
  if (at) claimed.add(at);
  return at;
};

const esc = (s) => s.replace(/&(?![a-z#0-9]+;)/g, '&amp;');

/** The clock table body for a topic, with that topic's rows bold. */
const clockFor = (mine) => clock(new Set(mine), rows);

// ── the learner page ───────────────────────────────────────────────────────

const learnerTopic = (t) => `
<details class="topic" id="${t.id}">
  <summary><span class="num">${t.n}</span><span>${esc(t.label)}</span><span class="when">${esc(t.when)}</span><span class="caret">&#8250;</span></summary>
  <div class="topicbody">
<section class="card">
  <span class="step-label">Topic ${t.n} of ${C.topics.length} &#183; ${esc(t.tag)}</span>
  <h2>What this topic is for</h2>
  <p class="lede">${esc(t.purpose.lede)}</p>
  ${t.purpose.learner}
</section>
${t.beats.map((b) => `<section class="card">
  <span class="step-label">${claim(b.at) ? `${b.at} &#183; ` : ''}${esc(b.mode)}</span>
  <h2>${esc(b.title)}</h2>
  ${b.learner}
</section>`).join('\n')}
<section class="ember">
  <h2>The line this topic exists to land</h2>
  <p style="font-size:var(--size-4)"><strong>${esc(t.line.text)}</strong></p>
  ${t.line.learner}
</section>
<section class="card">
  <span class="step-label">Checkpoint</span>
  <h2>After this topic, you can now</h2>
  <ul>
${t.checkpoint.items.map((i, n) => `    <li>${n === t.checkpoint.items.length - 1 ? `<strong>${esc(i)}</strong>` : esc(i)}</li>`).join('\n')}
  </ul>
  <p>${t.checkpoint.note}</p>
</section>
  </div>
</details>`;

const learner = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Week ${week} &#183; ${esc(C.week.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;1,400&family=Figtree:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>${C.LEARNER_CSS}</style>
</head>
<body>
<div class="page">

<header class="hero">
  <div class="eyebrow">The Living Craft &#183; week ${week} of 6 &#183; your copy</div>
  <h1>${esc(C.week.title)}</h1>
  <p class="sub">${esc(C.week.sub)}</p>
  <div class="facts">
${C.week.facts.map((f) => `    <div class="fact"><span class="n">${f.n}</span><span class="l">${esc(f.l)}</span></div>`).join('\n')}
  </div>
</header>

<section class="card">
  <span class="step-label">Opening &#183; 00:00</span>
  <h2>What today is for</h2>
  ${C.opening.learner}
</section>

${C.sessionClock.learner}

<section class="card">
  <span class="step-label">Opening &#183; ${W.clockLabelAt}</span>
  <h2>${W.blocksHeading}</h2>
  <p class="lede">${esc(C.clockNote.lede)}</p>
  ${C.clockNote.learner}
  <div class="tw">
    <table id="clocktable">
${clockFor([])}
    </table>
  </div>
  <p>Every block group ends with a checkpoint. If one of its lines is not true for you, say so at the time. It is a signal to slow down, not a test of you.</p>
</section>

<section class="card">
  <span class="step-label">How to read the rest of this page</span>
  <h2>${W.topicsHeading}</h2>
  ${C.howToRead.learner}
</section>

${C.topics.map(learnerTopic).join('\n\n')}

<section class="card">
  <span class="step-label">Quiz &#183; ${W.quizAt}</span>
  <h2>${W.quizHeading}</h2>
  <p class="lede">${esc(C.quizNote.lede)}</p>
  ${C.quizNote.learner}
  <div class="qs">
${C.quiz.map((q, n) => `    <div class="q-item">
      <span class="n">${n + 1}</span>
      <div>
        <h3>${esc(q.title)}</h3>
        <p>${esc(q.stem)}</p>
${q.options ? `        <ul>\n${q.options.map((o) => `          <li>${esc(o)}</li>`).join('\n')}\n        </ul>` : ''}
        <details>
          <summary>Show the answer</summary>
          <div class="reveal">${q.reveal}</div>
        </details>
      </div>
    </div>`).join('\n')}
  </div>
</section>

<section class="card">
  <span class="step-label">After today</span>
  <h2>Tools for your own system</h2>
  <p class="lede">${esc(C.toolsNote.lede)}</p>
  <div class="tw">
    <table>
      <thead><tr><th>The question it answers</th><th>What you do with it</th></tr></thead>
      <tbody>
${C.tools.map((t) => `        <tr><td>${esc(t.q)}</td><td><a href="${t.url}">${esc(t.verb)}</a><br><span class="named">${esc(t.url)}</span></td></tr>`).join('\n')}
      </tbody>
    </table>
  </div>
  <p>${C.toolsNote.after}</p>
</section>

<section class="card">
  <span class="step-label">Close &#183; ${W.closeAt}</span>
  <h2>How the day ends</h2>
  ${C.close.learner}
</section>

<footer>
  <span>The Living Craft &#183; week ${week} of 6</span>
  <span>${esc(C.week.title)}</span>
  <span>Your copy. Write on it.</span>
</footer>

</div>
<script>${C.SESSION_CLOCK_JS}</script>
</body>
</html>`;

// ── the instructor page ────────────────────────────────────────────────────

const instructorTopic = (t) => `
<details class="topic" id="${t.id}">
  <summary><span class="num">${t.n}</span><span>${esc(t.label)}</span><span class="when">${esc(t.when)}</span><span class="caret">&#8250;</span></summary>
  <div class="topicbody">
<div class="head" id="${t.id}-purpose">
  <span class="k">read this before you teach it</span>
  <h2>What this topic is for</h2>
  ${t.purpose.script}
</div>
<div class="teach">
<div class="pane pane-script">
<div class="head"><span class="k">the script &#183; what to do, in order</span><h3>Run of show</h3></div>
<article class="card">
  <span class="tag">${esc(t.tag)} &#183; ${esc(t.when)}</span>
${t.beats.map((b) => `
  <div class="beat"${b.ref ? ` data-ref="${b.ref.id}"` : ''}><span class="t">${b.at}</span><div class="b">
    <h4>${esc(b.title)}</h4>
    <span class="pairs">${esc(b.mode)}</span>
    ${b.script}
  </div></div>`).join('\n')}
</article>
</div>
<div class="pane pane-ref" id="${t.id}-refpane" tabindex="-1">
<div class="head"><span class="k">the reference &#183; the argument, the keys</span><h3>The reasoning behind each beat</h3></div>

<article class="card" id="${t.id}-r-scope">
  <span class="pairs">&#8596; the whole topic &#183; read before you teach it</span>
  <span class="tag">scope &#183; written 2026-09-29</span>
  <h3>What this topic leaves broken on purpose</h3>
  <div class="scroller"><table>
    <thead><tr><th>Left unfixed on purpose</th><th>Where it is fixed</th></tr></thead>
    <tbody>
${t.broken.map((b) => `      <tr><td>${esc(b[0])}</td><td>${b[1]}</td></tr>`).join('\n')}
    </tbody>
  </table></div>
</article>
${t.beats.filter((b) => b.ref).map((b) => `
<article class="card" id="${b.ref.id}">
  <span class="pairs">&#8596; ${b.at} &#183; ${esc(b.ref.pairs)}</span>
  <h3>${esc(b.title)}</h3>
  ${b.ref.html}
</article>`).join('\n')}

<article class="card" id="${t.id}-r-line">
  <span class="pairs">&#8596; the close of the topic &#183; same words as the learner page</span>
  <h3>The line this topic exists to land</h3>
  <blockquote>${esc(t.line.text)}</blockquote>
  ${t.line.script}
</article>

<article class="card" id="${t.id}-r-checkpoint">
  <span class="pairs">&#8596; the end of the topic &#183; the same lines as their page</span>
  <h3>After this topic, you can now</h3>
  ${t.checkpoint.script}
</article>
</div>
</div>
${t.state ? `<article class="card" id="${t.id}-open">
  <span class="pairs">&#8596; before you teach this at all</span>
  <span class="tag warn">state &#183; checked 2026-09-29</span>
  <h3>What is ready, and what is still open</h3>
  ${t.state}
</article>` : ''}
  </div>
</details>`;

const instructor = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Week ${week} &#183; Instructor notes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;1,400&family=Figtree:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${C.INSTRUCTOR_CSS}</style>
</head>
<body>
<script>document.body.classList.add('split');</script>
<div class="shell">

<header class="hero">
  <div class="mono">The Living Craft &#183; week ${week} &#183; ${C.week.module} &#183; instructor's copy</div>
  <h1>${esc(C.week.title)}</h1>
  <p class="lead">${C.week.lead}</p>
  <div class="facts">
${C.week.status.map((s) => `    <div><span class="mono">${esc(s.k)}</span><span class="v">${esc(s.v)}</span></div>`).join('\n')}
  </div>
</header>

<div class="head" id="today">
  <span class="k">the opening &#183; 00:00 to 00:15</span>
  <h2>What today is for</h2>
  ${C.opening.script}
</div>

<nav class="rail" aria-label="Jump to a topic">
  <span class="lab mono">Topics</span>
${C.topics.map((t) => `  <a href="#${t.id}">${t.n} &#183; ${esc(t.short)}</a>`).join('\n')}
  <span class="lab mono" style="margin-left:var(--sp4)">Before the day</span>
  <a href="#prep">what to prepare</a>
  <a href="#quiz">the quiz</a>
  <a href="#tools">tools</a>
  <button type="button" id="splitbtn" class="railbtn" aria-pressed="true">Side by side</button>
</nav>

${C.sessionClock.script}

<section class="beats" id="clock">
  <h2>${W.blocksHeading}</h2>
  ${C.clockNote.script}
  <div class="scroller"><table id="clocktable">
${clockFor([])}
  </table></div>
  <p><strong>This table is generated.</strong> Both pages carry it, so it lives in <span class="mono">scripts/teaching-clock.mjs</span> and nowhere else. Change a time there, rebuild with <span class="mono">node scripts/build-teaching-pages.mjs ${week}</span>, and run <span class="mono">npm run check:teaching</span>.</p>
  ${C.clockNote.cuts}
</section>

<div class="head" id="prep">
  <span class="k">before the day &#183; the short list</span>
  <h2>What to prepare</h2>
  ${C.prep}
</div>

${C.topics.map(instructorTopic).join('\n\n')}

<div class="head" id="quiz">
  <span class="k">${W.quizAt} &#183; ${W.quizBankLine}</span>
  <h2>${W.quizHeading}</h2>
  ${C.quizNote.script}
</div>

${C.quiz.map((q, n) => `<article class="card">
  <h4>${esc(q.title)}</h4>
  <p class="qmeta">${esc(q.meta)}</p>
  <p>${esc(q.stem)}</p>
${q.options ? `  <ul class="opt">\n${q.options.map((o, i) => `    <li>${esc(o)}${q.key === i ? ' <span class="ok">&#8212; correct</span>' : ''}</li>`).join('\n')}\n  </ul>` : ''}
  ${q.script}
</article>`).join('\n')}

<div class="head" id="tools">
  <span class="k">after today &#183; the resource shelf</span>
  <h2>Tools for your own system</h2>
  ${C.toolsScript}
</div>

<article class="card">
  <h4>${W.toolsHeading}</h4>
  <div class="scroller"><table>
    <thead><tr><th>The question it answers</th><th>What you do with it</th><th>Registry</th></tr></thead>
    <tbody>
${C.tools.map((t) => `      <tr><td>${esc(t.q)}</td><td><a href="${t.url}">${esc(t.verb)}</a></td><td class="mono">Released</td></tr>`).join('\n')}
    </tbody>
  </table></div>
</article>

<div class="head" id="close">
  <span class="k">the close &#183; ${W.closeRange}</span>
  <h2>How the day ends</h2>
  ${C.close.script}
</div>

<footer>
  The Living Craft &#183; week ${week} &#183; ${W.footerTopics} &#183; instructor's copy, not for the room
</footer>

</div>
<script>${C.SESSION_CLOCK_JS}</script>
<script>${C.PANE_JS}</script>
</body>
</html>`;

// ── write, then report what the content claimed about the clock ─────────────

mkdirSync('dist-teaching', { recursive: true });
writeFileSync(`dist-teaching/week-${week}-learner.html`, learner);
writeFileSync(`dist-teaching/week-${week}-instructor.html`, instructor);

const unknown = [...claimed].filter((t) => !clockTimes.has(t));
const uncovered = [...clockTimes].filter(
  (t) => !claimed.has(t) && !/^(Checkpoint|Stand up|Break|Close|The quiz)/.test(
    rows.find(([at]) => at === t)[1],
  ) && !W.openingTimes.includes(t),
);

console.log(`week ${week}: ${C.topics.length} topics, ${C.topics.reduce((n, t) => n + t.beats.length, 0)} beats, ${C.quiz.length} questions asked`);
console.log(`  dist-teaching/week-${week}-learner.html`);
console.log(`  dist-teaching/week-${week}-instructor.html`);
if (unknown.length) {
  console.error(`  FAIL a beat claims a time the clock does not have: ${unknown.join(', ')}`);
  process.exit(1);
}
if (uncovered.length) {
  console.error(`  FAIL the clock has a teaching row no beat covers: ${uncovered.join(', ')}`);
  process.exit(1);
}
console.log('  every beat time is in the clock, and every teaching row has a beat.');
