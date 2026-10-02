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
  // Two headings that carried words docs/teaching/generation-prompt.md bans
  // ("beat") or that it renames. Defaults are the old strings, so a week that
  // does not opt in builds exactly as before.
  refHeading: 'The reasoning behind each beat',
  canNowHeading: 'After this topic, you can now',
  ...(C.week.wording ?? {}),
};

// ── the six-part shape, opt-in ─────────────────────────────────────────────
//
// generation-prompt.md §4 and §5 ask every topic for a hands-on lab, a place at
// enterprise scale, a three-question quiz with one question from earlier, a
// "you can now" and a written takeaway, and ask the session to close on recall,
// a teardown, a mixed quiz and a spoken takeaway. The template had no slot for
// most of those. They are OPTIONAL fields, so weeks that have not been rebuilt
// against the prompt build byte-identical. A week that sets
// `week.shape = 'six-part'` gets the checks below as build failures, because a
// missing lab or a quiz with nothing from earlier is the kind of gap a review
// finds late and a build finds at once.
const PARTS = {
  narrative: 'The narrative',
  concept: 'The concept',
  design: 'Components and design',
  lab: 'Hands-on lab',
};
const sixPart = C.week.shape === 'six-part';
const shapeErrors = [];
if (sixPart) {
  for (const t of C.topics) {
    if (!t.beats.some((b) => b.part === 'lab')) shapeErrors.push(`topic ${t.n} has no hands-on lab`);
    if (!t.topicQuiz) shapeErrors.push(`topic ${t.n} has no topic quiz`);
    else {
      if (t.topicQuiz.items.length !== 3) shapeErrors.push(`topic ${t.n}'s quiz has ${t.topicQuiz.items.length} questions, not 3`);
      if (!t.topicQuiz.items.some((q) => q.from === 'earlier')) shapeErrors.push(`topic ${t.n}'s quiz has no question from earlier material`);
      for (const q of t.topicQuiz.items) {
        if (q.from === 'earlier' && !q.source) shapeErrors.push(`topic ${t.n}: an earlier-material question does not quote its source`);
      }
    }
    if (!t.atScale) shapeErrors.push(`topic ${t.n} has no "at enterprise scale" part`);
    else for (const s of t.atScale.slots) {
      if (s.options.length < 3) shapeErrors.push(`topic ${t.n}: slot "${s.slot}" names ${s.options.length} products, not 3 or more`);
    }
    if (!t.takeaway) shapeErrors.push(`topic ${t.n} has no written takeaway`);
  }
  for (const r of C.agentNow?.rows ?? []) {
    if (!r.proof) shapeErrors.push(`"What the agent can do now": row "${r.gained}" has no proof command`);
  }
  if (!C.agentNow) shapeErrors.push('no "What the agent can do now" table');
  if (!C.closing) shapeErrors.push('no closing section (recall, teardown, spoken takeaway)');
  if (C.quiz.filter((q) => q.week && q.week < week).length < 2) {
    shapeErrors.push('the end-of-week quiz has fewer than 2 questions from earlier weeks');
  }
}

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

/** "Hands-on lab · " before a beat's time, when the beat says which part it is. */
const partOf = (b) => (b.part ? `${PARTS[b.part]} &#183; ` : '');

/** The subtitle question, on the purpose card of both pages. */
const questionOf = (t) => (t.question ? `\n  <p class="lede"><strong>${esc(t.question)}</strong></p>` : '');

/** The "at enterprise scale" table: one row per product, grouped by slot. */
const scaleTable = (s) => `<div class="tw">
    <table>
      <thead><tr><th>The job</th><th>What firms use</th><th>What it costs</th></tr></thead>
      <tbody>
${s.slots.flatMap((slot) => slot.options.map((o, i) => `        <tr><td>${i === 0 ? esc(slot.slot) : ''}</td><td>${esc(o.product)}</td><td>${esc(o.cost)}</td></tr>`)).join('\n')}
      </tbody>
    </table>
  </div>`;

/** One question of a topic quiz. An earlier-material question quotes its source first. */
const quizItem = (q, n, reveal) => `    <div class="q-item">
      <span class="n">${n + 1}</span>
      <div>
${q.source ? `        <blockquote>${q.source}</blockquote>\n` : ''}        <p>${esc(q.stem)}</p>
${q.options ? `        <ul>\n${q.options.map((o) => `          <li>${esc(o)}</li>`).join('\n')}\n        </ul>` : ''}
${reveal}
      </div>
    </div>`;

const learnerScale = (t) => (t.atScale ? `<section class="card">
  <span class="step-label">${t.atScale.at ? `${claim(t.atScale.at)} &#183; ` : ''}At enterprise scale &#183; ${t.atScale.at ? esc(t.atScale.mode ?? 'whole room') : 'read after the session'}</span>
  <h2>At enterprise scale</h2>
  <p class="lede">${esc(t.atScale.question)}</p>
  <p>${t.atScale.lede}</p>
  ${scaleTable(t.atScale)}
  ${t.atScale.learner ?? ''}
</section>` : '');

const learnerQuiz = (t) => (t.topicQuiz ? `<section class="card"${segId(t.topicQuiz.at)}>
  <span class="step-label">${claim(t.topicQuiz.at)} &#183; ${esc(t.topicQuiz.mode ?? 'alone, in writing')}</span>
  <h2>${esc(t.topicQuiz.title)}</h2>
  <p>${t.topicQuiz.lede ?? ''}</p>
  <div class="qs">
${t.topicQuiz.items.map((q, n) => quizItem(q, n, `        <details>
          <summary>Show the answer</summary>
          <div class="reveal">${q.reveal}</div>
        </details>`)).join('\n')}
  </div>
</section>` : '');

const learnerTakeaway = (t) => (t.takeaway ? `<section class="card">
  <span class="step-label">Before you move on &#183; one line, in writing</span>
  <h2>Your takeaway</h2>
  <p>${t.takeaway.prompt}</p>
</section>` : '');

/** A beat as a learner card. Topics and the close both use it. */
const TOC = C.week.toc === true;
const segId = (at) => (TOC && at ? ` id="s-${at.replace(':', '')}"` : '');

const learnerBeat = (b) => `<section class="card"${segId(b.at)}>
  <span class="step-label">${partOf(b)}${claim(b.at) ? `${b.at} &#183; ` : ''}${esc(b.mode)}</span>
  <h2>${esc(b.title)}</h2>
  ${b.learner}
</section>`;

/**
 * The contents card: the day's blocks, the topics inside them, and every
 * segment with its time. Opt-in with `week.toc = true`. Each line links to the
 * segment's id; the page script opens the collapsible that holds it.
 */
const tocHtml = () => {
  if (!TOC) return '';
  const seg = (at, title) => `<li><a href="#s-${at.replace(':', '')}"><span class="mono">${at}</span> ${esc(title)}</a></li>`;
  const topicSegs = (t) => [
    ...t.beats.map((b) => seg(b.at, b.title)),
    ...(t.topicQuiz ? [seg(t.topicQuiz.at, t.topicQuiz.title)] : []),
  ].join('\n        ');
  const blocks = [
    `    <li><strong>Opening</strong> &#183; ${esc(C.toc?.opening ?? '00:00 to 00:15')}</li>`,
    ...C.topics.map((t) => `    <li><a href="#${t.id}"><strong>Topic ${t.n} &#183; ${esc(t.label)}</strong></a> &#183; ${esc(t.when)}
      <ol class="tocsegs">
        ${topicSegs(t)}
      </ol></li>`),
    ...(C.closing ? [`    <li><strong>${esc(C.closing.label)}</strong> &#183; ${esc(C.closing.when)}
      <ol class="tocsegs">
        ${C.closing.beats.map((b) => seg(b.at, b.title)).join('\n        ')}
      </ol></li>`] : []),
  ];
  return `<ol class="toc">
${blocks.join('\n')}
  </ol>`;
};

// ── the learner page ───────────────────────────────────────────────────────

const learnerTopic = (t) => `
<details class="topic" id="${t.id}">
  <summary><span class="num">${t.n}</span><span>${esc(t.label)}</span><span class="when">${esc(t.when)}</span><span class="caret">&#8250;</span></summary>
  <div class="topicbody">
<section class="card">
  <span class="step-label">Topic ${t.n} of ${C.topics.length} &#183; ${esc(t.tag)}</span>
  <h2>What this topic is for</h2>${questionOf(t)}
  <p class="lede">${esc(t.purpose.lede)}</p>
  ${t.purpose.learner}
</section>
${t.beats.map(learnerBeat).join('\n')}
${[learnerScale(t), learnerQuiz(t)].filter(Boolean).join('\n')}${t.atScale || t.topicQuiz ? '\n' : ''}<section class="ember">
  <h2>The line this topic exists to land</h2>
  <p style="font-size:var(--size-4)"><strong>${esc(t.line.text)}</strong></p>
  ${t.line.learner}
</section>
<section class="card">
  <span class="step-label">Checkpoint</span>
  <h2>${W.canNowHeading}</h2>
  <ul>
${t.checkpoint.items.map((i, n) => `    <li>${n === t.checkpoint.items.length - 1 ? `<strong>${esc(i)}</strong>` : esc(i)}</li>`).join('\n')}
  </ul>
  <p>${t.checkpoint.note}</p>
</section>${t.takeaway ? `\n${learnerTakeaway(t)}` : ''}
  </div>
</details>`;

// The close, split either side of the quiz so the page stays in clock order:
// recall and teardown come before it, the spoken takeaway after it.
const closingBefore = (C.closing?.beats ?? []).filter((b) => b.at < W.quizAt);
const closingAfter = (C.closing?.beats ?? []).filter((b) => b.at >= W.quizAt);

const learnerAgentNow = C.agentNow ? `
<section class="card">
  <span class="step-label">Opening &#183; what this week adds to the agent</span>
  <h2>What the agent can do now</h2>
  <p class="lede">${esc(C.agentNow.lede)}</p>
  <div class="tw">
    <table>
      <thead><tr><th>Capability</th><th>At 00:00 today</th><th>At the close</th><th>File</th><th>How you prove it</th></tr></thead>
      <tbody>
${C.agentNow.rows.map((r) => `        <tr><td>${esc(r.gained)}</td><td>${esc(r.atOpen)}</td><td>${esc(r.atClose)}</td><td class="named">${esc(r.file)}</td><td><code>${esc(r.proof)}</code></td></tr>`).join('\n')}
      </tbody>
    </table>
  </div>
  ${C.agentNow.learner ?? ''}
</section>
` : '';

const learnerClosingHead = C.closing ? `<section class="card">
  <span class="step-label">The close &#183; ${esc(C.closing.when)}</span>
  <h2>${esc(C.closing.label)}</h2>
  ${C.closing.learner}
</section>
` : '';

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
${learnerAgentNow}
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

${TOC ? `<section class="card" id="contents">
  <span class="step-label">Contents</span>
  <h2>${esc(C.toc?.heading ?? 'Contents')}</h2>
  <p>${C.toc?.lede ?? ''}</p>
  ${tocHtml()}
</section>

` : ''}${C.topics.map(learnerTopic).join('\n\n')}

${C.closing ? `${learnerClosingHead}${closingBefore.map(learnerBeat).join('\n')}\n\n` : ''}<section class="card">
  <span class="step-label">Quiz &#183; ${W.quizAt}</span>
  <h2>${W.quizHeading}</h2>
  <p class="lede">${esc(C.quizNote.lede)}</p>
  ${C.quizNote.learner}
  <div class="qs">
${C.quiz.map((q, n) => `    <div class="q-item">
      <span class="n">${n + 1}</span>
      <div>
        <h3>${esc(q.title)}</h3>
${q.source ? `        <blockquote>${q.source}</blockquote>\n` : ''}        <p>${esc(q.stem)}</p>
${q.options ? `        <ul>\n${q.options.map((o) => `          <li>${esc(o)}</li>`).join('\n')}\n        </ul>` : ''}
        <details>
          <summary>Show the answer</summary>
          <div class="reveal">${q.reveal}</div>
        </details>
      </div>
    </div>`).join('\n')}
  </div>
</section>

${closingAfter.length ? `${closingAfter.map(learnerBeat).join('\n')}\n\n` : ''}<section class="card">
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

/** A beat as a run-of-show row on the instructor page. */
const instructorRow = (b) => `
  <div class="beat"${segId(b.at)}${b.ref ? ` data-ref="${b.ref.id}"` : ''}><span class="t">${b.at}</span><div class="b">
    <h4>${esc(b.title)}</h4>
    <span class="pairs">${partOf(b)}${esc(b.mode)}</span>
    ${b.script}
  </div></div>`;

/** A beat's reference card, the other half of the side-by-side view. */
const instructorRef = (b) => `
<article class="card" id="${b.ref.id}">
  <span class="pairs">&#8596; ${b.at} &#183; ${esc(b.ref.pairs)}</span>
  <h3>${esc(b.title)}</h3>
  ${b.ref.html}
</article>`;

/**
 * The topic quiz and the "at enterprise scale" part, turned into beats so they
 * sit in the run of show and the reference column like everything else. The
 * quiz is always timed. The scale part is timed only when the week puts it on
 * the clock; untimed, it is a reference card with no row.
 */
const extraBeats = (t) => {
  const out = [];
  if (t.atScale?.at) {
    out.push({
      at: t.atScale.at,
      // The clock row's text. Distinct per topic, or the day plan shows five
      // identical rows. The card heading stays "At enterprise scale".
      title: t.atScale.title ?? 'At enterprise scale',
      mode: t.atScale.mode ?? 'whole room',
      script: t.atScale.script ?? '',
      ref: { id: `${t.id}-r-atscale`, pairs: 'three or more named options a slot, no recommendation', html: `${t.atScale.title ? '<h4>At enterprise scale</h4>\n  ' : ''}<p class="lede">${esc(t.atScale.question)}</p>\n  <p>${t.atScale.lede}</p>\n  ${scaleTable(t.atScale)}` },
    });
  }
  if (t.topicQuiz) {
    const q = t.topicQuiz;
    out.push({
      at: q.at,
      title: q.title,
      mode: q.mode ?? 'alone, in writing',
      script: q.script ?? '',
      ref: {
        id: `${t.id}-r-quiz`,
        pairs: 'three questions, one from earlier material',
        html: q.items.map((it, n) => `<h4>Question ${n + 1} &#183; ${it.from === 'earlier' ? 'from earlier' : 'this topic'}</h4>
  ${it.source ? `<blockquote>${it.source}</blockquote>\n  ` : ''}<p>${esc(it.stem)}</p>
${it.options ? `  <ul class="opt">\n${it.options.map((o, i) => `    <li>${esc(o)}${it.key === i ? ' <span class="ok">&#8212; correct</span>' : ''}</li>`).join('\n')}\n  </ul>\n` : ''}  <p><strong>The answer.</strong> ${it.reveal}</p>
  <p><strong>The likely wrong answer.</strong> ${it.wrong}</p>
  <p><strong>What is right about it.</strong> ${it.right}</p>`).join('\n  '),
      },
    });
  }
  return out;
};

const instructorTopic = (t) => {
  const extra = extraBeats(t);
  const untimedScale = t.atScale && !t.atScale.at ? `
<article class="card" id="${t.id}-r-atscale">
  <span class="pairs">&#8596; reading, not a segment &#183; three or more named options a slot, no recommendation</span>
  <h3>At enterprise scale</h3>
  <p class="lede">${esc(t.atScale.question)}</p>
  <p>${t.atScale.lede}</p>
  ${scaleTable(t.atScale)}
  ${t.atScale.script ?? ''}
</article>` : '';
  return `
<details class="topic" id="${t.id}">
  <summary><span class="num">${t.n}</span><span>${esc(t.label)}</span><span class="when">${esc(t.when)}</span><span class="caret">&#8250;</span></summary>
  <div class="topicbody">
<div class="head" id="${t.id}-purpose">
  <span class="k">read this before you teach it</span>
  <h2>What this topic is for</h2>${questionOf(t)}
  ${t.purpose.script}
</div>
<div class="teach">
<div class="pane pane-script">
<div class="head"><span class="k">the script &#183; what to do, in order</span><h3>Run of show</h3></div>
<article class="card">
  <span class="tag">${esc(t.tag)} &#183; ${esc(t.when)}</span>
${[...t.beats, ...extra].map(instructorRow).join('\n')}
</article>
</div>
<div class="pane pane-ref" id="${t.id}-refpane" tabindex="-1">
<div class="head"><span class="k">the reference &#183; the argument, the keys</span><h3>${W.refHeading}</h3></div>

<article class="card" id="${t.id}-r-scope">
  <span class="pairs">&#8596; the whole topic &#183; read before you teach it</span>
  <span class="tag">scope &#183; written ${t.scopeDate ?? '2026-09-29'}</span>
  <h3>What this topic leaves broken on purpose</h3>
  <div class="scroller"><table>
    <thead><tr><th>Left unfixed on purpose</th><th>Where it is fixed</th></tr></thead>
    <tbody>
${t.broken.map((b) => `      <tr><td>${esc(b[0])}</td><td>${b[1]}</td></tr>`).join('\n')}
    </tbody>
  </table></div>
</article>
${[...t.beats, ...extra].filter((b) => b.ref).map(instructorRef).join('\n')}${untimedScale}

<article class="card" id="${t.id}-r-line">
  <span class="pairs">&#8596; the close of the topic &#183; same words as the learner page</span>
  <h3>The line this topic exists to land</h3>
  <blockquote>${esc(t.line.text)}</blockquote>
  ${t.line.script}
</article>

<article class="card" id="${t.id}-r-checkpoint">
  <span class="pairs">&#8596; the end of the topic &#183; the same lines as their page</span>
  <h3>${W.canNowHeading}</h3>
  ${t.checkpoint.script}${t.takeaway ? `
  <h4>Your takeaway</h4>
  <p>${t.takeaway.prompt}</p>
  ${t.takeaway.script ?? ''}` : ''}
</article>
</div>
</div>
${t.state ? `<article class="card" id="${t.id}-open">
  <span class="pairs">&#8596; before you teach this at all</span>
  <span class="tag warn">state &#183; checked ${t.stateDate ?? '2026-09-29'}</span>
  <h3>What is ready, and what is still open</h3>
  ${t.state}
</article>` : ''}
  </div>
</details>`;
};

/** Part of the close, as a run of show beside its reference column. */
const instructorClosing = (beats, part) => (beats.length ? `<div class="teach">
<div class="pane pane-script">
<div class="head"><span class="k">the script &#183; what to do, in order</span><h3>Run of show</h3></div>
<article class="card">
  <span class="tag">the close &#183; ${esc(C.closing.when)}</span>
${beats.map(instructorRow).join('\n')}
</article>
</div>
<div class="pane pane-ref" id="closing-${part}-refpane" tabindex="-1">
<div class="head"><span class="k">the reference &#183; the argument, the keys</span><h3>${W.refHeading}</h3></div>
${beats.filter((b) => b.ref).map(instructorRef).join('\n')}
</div>
</div>
` : '');

const instructorAgentNow = C.agentNow ? `
<div class="head" id="agentnow">
  <span class="k">what this week adds to the agent &#183; every row is proved by running something</span>
  <h2>What the agent can do now</h2>
  <p>${esc(C.agentNow.lede)}</p>
  <div class="scroller"><table>
    <thead><tr><th>Capability</th><th>At 00:00 today</th><th>At the close</th><th>File</th><th>How you prove it</th></tr></thead>
    <tbody>
${C.agentNow.rows.map((r) => `      <tr><td>${esc(r.gained)}</td><td>${esc(r.atOpen)}</td><td>${esc(r.atClose)}</td><td class="mono">${esc(r.file)}</td><td class="mono">${esc(r.proof)}</td></tr>`).join('\n')}
    </tbody>
  </table></div>
  ${C.agentNow.script ?? ''}
</div>
` : '';

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
${instructorAgentNow}
<nav class="rail" aria-label="Jump to a topic">
  <span class="lab mono">Topics</span>
${C.topics.map((t) => `  <a href="#${t.id}">${t.n} &#183; ${esc(t.short)}</a>`).join('\n')}
  <span class="lab mono" style="margin-left:var(--sp4)">Before the day</span>
  <a href="#prep">what to prepare</a>${C.closing ? `\n  <a href="#closing">the close</a>` : ''}
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

${TOC ? `<div class="head" id="contents">
  <span class="k">the whole day, block by block</span>
  <h2>${esc(C.toc?.heading ?? 'Contents')}</h2>
  ${tocHtml()}
</div>

` : ''}${C.topics.map(instructorTopic).join('\n\n')}

${C.closing ? `<div class="head" id="closing">
  <span class="k">the close &#183; ${esc(C.closing.when)}</span>
  <h2>${esc(C.closing.label)}</h2>
  ${C.closing.script}
</div>
${instructorClosing(closingBefore, 'a')}
` : ''}<div class="head" id="quiz">
  <span class="k">${W.quizAt} &#183; ${W.quizBankLine}</span>
  <h2>${W.quizHeading}</h2>
  ${C.quizNote.script}
</div>

${C.quiz.map((q, n) => `<article class="card">
  <h4>${esc(q.title)}</h4>
  <p class="qmeta">${esc(q.meta)}</p>
${q.source ? `  <blockquote>${q.source}</blockquote>\n` : ''}  <p>${esc(q.stem)}</p>
${q.options ? `  <ul class="opt">\n${q.options.map((o, i) => `    <li>${esc(o)}${q.key === i ? ' <span class="ok">&#8212; correct</span>' : ''}</li>`).join('\n')}\n  </ul>` : ''}
  ${q.script}
</article>`).join('\n')}

${closingAfter.length ? `${instructorClosing(closingAfter, 'b')}\n` : ''}<div class="head" id="tools">
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

// ── session times as clock times, opt-in ──────────────────────────────────
//
// With `week.wallClock = true`, every session offset on the page (00:00 to
// 05:00) is wrapped in <span class="off" data-off="HH:MM">. The page script
// rewrites those spans to the time of day once somebody enters the session's
// start time. Text inside <script>, <style>, <svg>, <summary> and <title> is
// left alone: a summary carries the topic's own "when", which the site reads
// back with a regular expression.
const wrapOffsets = (html) => {
  let skip = 0;
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        const m = part.match(/^<(\/?)(script|style|svg|summary|title)\b/i);
        if (m && !part.endsWith('/>')) skip += m[1] ? -1 : 1;
        return part;
      }
      if (skip > 0) return part;
      return part.replace(/\b([0-4]\d|05):([0-5]\d)\b/g, (t, h, mm) =>
        Number(h) * 60 + Number(mm) > 300 ? t : `<span class="off" data-off="${t}">${t}</span>`,
      );
    })
    .join('');
};
const finish = (html) => (C.week.wallClock === true ? wrapOffsets(html) : html);

mkdirSync('dist-teaching', { recursive: true });
writeFileSync(`dist-teaching/week-${week}-learner.html`, finish(learner));
writeFileSync(`dist-teaching/week-${week}-instructor.html`, finish(instructor));

// The quiz section and the close are real rows on the clock, not exceptions to
// it, so they claim their own times. Only when the clock has them: a week whose
// wording names a time its clock lacks is caught by the page check instead.
for (const at of [W.quizAt, W.closeAt]) if (clockTimes.has(at)) claim(at);

const unknown = [...claimed].filter((t) => !clockTimes.has(t));
const uncovered = [...clockTimes].filter(
  // Rests and checkpoints need no segment. "Pair discussion" is §7's name for a
  // stand-up, and a row naming "you can now" is covered by the checkpoint and
  // takeaway cards, which carry no time of their own.
  (t) => !claimed.has(t) && !/^(Checkpoint|Stand up|Pair discussion|Short break|Break|Close|The quiz)|you can now/i.test(
    rows.find(([at]) => at === t)[1],
  ) && !W.openingTimes.includes(t),
);

if (shapeErrors.length) {
  console.error(`  FAIL the six-part shape (generation-prompt.md §4 and §5):`);
  for (const e of shapeErrors) console.error(`       ${e}`);
  process.exit(1);
}

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
