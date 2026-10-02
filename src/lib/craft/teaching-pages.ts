// The week's topic pages, served from this site instead of from claude.ai.
//
// ---------------------------------------------------------------------------
// WHY ONE STORED FILE PER WEEK AND NOT ONE PER TOPIC
// ---------------------------------------------------------------------------
// Week 2 is seven topics, and each one was a published Artifact. Storing seven
// learner pages and seven instructor pages would be fourteen copies of a thing
// that already exists once: the COLLATED page, which carries every topic inside
// a `<details class="topic" id="tN">`.
//
// So the collated pair is the stored source and a topic page is a slice of it.
// Two consequences worth having. Regenerating a week replaces two files and
// every topic page follows. And a topic page cannot drift from the collated
// page, because it is cut from it at request time.
//
// ---------------------------------------------------------------------------
// WHY THE PAGES ARE SERVED WHOLE, AND NOT POURED INTO CraftLayout
// ---------------------------------------------------------------------------
// These pages carry their own stylesheet, and it names `.card`, `.hero`,
// `.panel` and `.term`. So do `global.css` and `craft.css`. Rendering the
// fragment inside the course shell would have the two stylesheets fighting over
// four class names, and the page Sunil approved is not the page that would come
// out. They are handouts: self-contained by design, and served that way.
//
// The gate is therefore the route's job rather than the layout's. Every caller
// in src/pages/craft/** has a verified learner from the middleware, and the
// learner route checks the release gate on top of that — see release.ts.
//
// ---------------------------------------------------------------------------
// WHY fs AT REQUEST TIME
// ---------------------------------------------------------------------------
// Same mechanism /craft/admin/teaching already uses for docs/teaching/notes,
// and the same directory tree, so the files ride into the Vercel function the
// same way. Importing a 128KB HTML string into the bundle instead would put the
// whole of week 2 into every route's chunk.

import { promises as fs } from 'fs';
import * as path from 'path';

const PAGES_DIR = path.join(process.cwd(), 'docs', 'teaching', 'pages');

export type Audience = 'learner' | 'instructor';

export interface TopicRef {
  /** `t0` … `t6`, the id the collated page gives the topic. */
  id: string;
  /** 0 … 6. Topic 0 is the frame, and the numbering starts there on purpose. */
  n: number;
  /** "The frame · What a guardrail is" */
  title: string;
  /** "00:15, 00:31 and 00:37 · 19 minutes" */
  when: string;
}

/** Tags out, entities in, whitespace collapsed. */
const text = (s: string): string =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#183;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&#8250;/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function source(week: number, audience: Audience): Promise<string | null> {
  try {
    return await fs.readFile(path.join(PAGES_DIR, `week-${week}-${audience}.html`), 'utf8');
  } catch {
    // A week with no stored pages is the normal state for five of the six, not
    // an error. The caller renders nothing rather than failing.
    return null;
  }
}

/** Does this week have pages at all? Cheap enough to call from a session page. */
export async function hasPages(week: number, audience: Audience = 'learner'): Promise<boolean> {
  return (await source(week, audience)) !== null;
}

/** Every topic in the week, in page order. Empty when the week has no pages. */
export async function topics(week: number, audience: Audience = 'learner'): Promise<TopicRef[]> {
  const html = await source(week, audience);
  if (!html) return [];
  const out: TopicRef[] = [];
  const re = /<details class="topic" id="(t(\d+))">\s*<summary>([\s\S]*?)<\/summary>/g;
  for (const m of html.matchAll(re)) {
    const summary = m[3];
    const when = summary.match(/<span class="when">([\s\S]*?)<\/span>/)?.[1] ?? '';
    // The summary is <span class="num">N</span><span>Title</span><span class="when">…
    // so the title is the middle span and is read by position, not by a class
    // it does not have.
    const spans = [...summary.matchAll(/<span(?![^>]*class="(?:num|when|caret)")[^>]*>([\s\S]*?)<\/span>/g)];
    out.push({
      id: m[1],
      n: Number(m[2]),
      title: text(spans[0]?.[1] ?? m[1]),
      when: text(when),
    });
  }
  return out;
}

/**
 * A bar saying this is a preview, injected straight after the page wrapper.
 *
 * WHY IT EXISTS AT ALL. The admin preview shows a learner page for a week the
 * room cannot open yet. Without a mark on it, the reviewer's own memory is the
 * only thing distinguishing "what eight people can see" from "what they cannot",
 * and that is the state that ends with somebody saying a week is live when it is
 * shut. It is also a plain link back to the console.
 *
 * Styles are inline. This is injected into a document that owns its stylesheet
 * and knows nothing about ours, so a class name here would be a guess.
 */
function previewBar(note: string, back: string): string {
  return `<div style="position:sticky;top:0;z-index:99;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:#963D34;color:#FBF8F2;padding:10px 16px;border-radius:8px;margin-bottom:20px;font:500 13px/1.4 Figtree,system-ui,sans-serif">
  <span>${note}</span>
  <a href="${back}" style="color:#FBF8F2;text-decoration:underline">Back to the console</a>
</div>`;
}

/**
 * One topic, as a complete HTML document.
 *
 * Everything before the page wrapper is kept verbatim — the doctype, the fonts,
 * both stylesheets — so the topic page is the collated page's topic with
 * nothing else removed and nothing added but its own heading.
 *
 * Returns null for a week with no pages, or a topic number the week does not
 * have. The caller turns that into a 404 rather than an empty page.
 */
export async function topicPage(
  week: number,
  n: number,
  audience: Audience = 'learner',
  preview?: string,
  /**
   * Where the topic chips point. Defaults to the live URL for the audience.
   *
   * The admin preview serves LEARNER pages from under /craft/admin, so its
   * chips must not point at /craft/week-N/topic-M: that is the live URL, and it
   * 404s for exactly the unreleased week the preview exists to show. Without
   * this the preview's own navigation dead-ends on the first click.
   */
  linkBase?: string,
): Promise<string | null> {
  const html = await source(week, audience);
  if (!html) return null;

  const wrapper = audience === 'learner' ? '<div class="page">' : '<div class="shell">';
  const headEnd = html.indexOf(wrapper);
  if (headEnd < 0) return null;
  const head = html.slice(0, headEnd);

  const open = html.indexOf(`<details class="topic" id="t${n}">`);
  if (open < 0) return null;
  const bodyStart = html.indexOf('<div class="topicbody">', open);
  if (bodyStart < 0) return null;
  // The topic's own `</details>` is the next one after its body starts. The
  // body contains no nested `<details class="topic">`, only answer-key
  // `<details>` with no class, so a plain search for the closing tag of the
  // collapsible is wrong and this looks for the wrapper's end instead.
  const nextTopic = html.indexOf('<details class="topic" id="t', open + 1);
  const scope = html.slice(bodyStart, nextTopic < 0 ? html.length : nextTopic);
  const lastClose = scope.lastIndexOf('</div>\n</details>');
  if (lastClose < 0) return null;
  const body = scope.slice('<div class="topicbody">'.length, lastClose);

  const all = await topics(week, audience);
  const t = all.find((x) => x.n === n);
  const title = t ? t.title : `Topic ${n}`;

  // The instructor page's side-by-side toggle and beat-to-card linking live in
  // a script at the foot of the document. Carry it, or every beat on an
  // instructor topic page is dead to the click.
  // NON-GREEDY, and it matters. `[\s\S]*` spans from the first <script> to the
  // last, which on this page is the whole of week 2 swallowed into one tag —
  // 200KB of other topics, and a syntax error that kills the toggle it was
  // supposed to carry. `*?` takes one tag at a time and pop() takes the last.
  const script =
    audience === 'instructor' ? (html.match(/<script>[\s\S]*?<\/script>/g)?.pop() ?? '') : '';

  // CLOCK TIMES, FOR A WEEK THAT USES THEM. A page built with `wallClock` marks
  // every session time as <span class="off" data-off="HH:MM">, and its own
  // script turns those into the time of day once the session's start time is
  // entered in the clock bar. The bar sits above the first topic, so a topic
  // slice would lose it, and with it the only place to type the start time.
  // For those pages only, carry the bar and every script; other weeks are
  // served exactly as before.
  const wall = html.includes('class="off" data-off=');
  const sclock = wall ? (html.match(/<div class="sclock" id="sclock">[\s\S]*?<\/div>/)?.[0] ?? '') : '';
  const scripts = wall ? (html.match(/<script>[\s\S]*?<\/script>/g) ?? []).join('\n') : script;

  const heading = `
<header class="hero">
  <div class="${audience === 'learner' ? 'eyebrow' : 'mono'}">The Living Craft · week ${week} · topic ${n} · ${
    audience === 'learner' ? 'your copy' : "instructor's copy"
  }</div>
  <h1>${title.replace(/^.*?·\s*/, '')}</h1>
</header>`;

  // THE RAIL, AND WHY THE BUTTON IN IT IS NOT DECORATION.
  //
  // On the published per-topic instructor pages the rail sat between the hero
  // and the content, and it carried `#splitbtn` — the Side by side toggle. The
  // collated page puts that rail inside `.shell`, above the first topic, so
  // slicing a topic out of it left the toggle behind and the instructor with no
  // way to ask for two columns. The layout itself still works, because `.teach`
  // is a direct child of `.shell` here exactly as it was on the original pages;
  // what went missing was the control.
  //
  // scripts/teaching-pane.js already guards `if (btn)`, which is why nothing
  // threw and why this was invisible rather than loud.
  //
  // The topic chips are new. The published pages had no way to get from one
  // topic to the next without going back to the README, and a rail that exists
  // anyway is the cheap place to fix that.
  //
  // The instructor stylesheet defines .rail, .lab and .railbtn. The LEARNER one
  // does not — it is a handout and never had a rail — so that version is styled
  // inline, the same reasoning as the preview bar above: a class name would be a
  // guess about a stylesheet this code does not own.
  const base =
    linkBase ?? (audience === 'learner' ? `/craft/week-${week}` : `/craft/admin/teaching/${week}`);
  const here = audience === 'instructor';
  const chip = here
    ? ''
    : 'display:inline-block;padding:4px 10px;border-radius:6px;background:#E5EBE1;color:#172E26;text-decoration:none;font:500 13px/1.3 Figtree,system-ui,sans-serif';
  const chips = all
    .map((x) =>
      x.n === n
        ? here
          ? `<span class="lab mono" aria-current="page">${x.n}</span>`
          : `<span aria-current="page" style="${chip};background:#183D32;color:#F5F0E6">${x.n}</span>`
        : here
          ? `<a href="${base}/topic-${x.n}">${x.n}</a>`
          : `<a href="${base}/topic-${x.n}" style="${chip}">${x.n}</a>`,
    )
    .join(here ? '' : '\n  ');

  const rail = here
    ? `
<nav class="rail" aria-label="Topics in week ${week}">
  <span class="lab mono">Week ${week} · topic ${n}</span>
  ${chips}
  <button type="button" id="splitbtn" class="railbtn" aria-pressed="true">Side by side</button>
</nav>`
    : `
<nav aria-label="Topics in week ${week}" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:20px">
  <span style="font:500 12px/1 ui-monospace,monospace;color:#526259;margin-right:4px">Week ${week} · topic ${n}</span>
  ${chips}
</nav>`;

  return `${head}${wrapper}
${preview ? previewBar(preview, '/craft/admin/teaching') : ''}
${heading}
${rail}
${sclock}
${body}
</div>
${scripts}
</body></html>`;
}

/**
 * The page an ADMIN gets for a week with nothing stored.
 *
 * The learner routes answer a missing week with an empty 404 on purpose: a
 * learner who guesses a URL should learn nothing from it. That reasoning does
 * not carry to the console, and shipping it there was a mistake — week 1 had no
 * stored pages, the preview link was rendered for it anyway, and the result was
 * a blank browser window with nothing to act on.
 *
 * So the console gets the reason and the command. Still a 404, because the page
 * genuinely is not there.
 */
export function missingPage(week: number, audience: Audience): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<title>Week ${week} has no stored pages</title>
<meta name="robots" content="noindex, nofollow"></head>
<body style="margin:0;background:#F5F0E6;color:#172E26;font:16px/1.6 Figtree,system-ui,sans-serif">
<div style="max-width:640px;margin:0 auto;padding:64px 20px">
  <p style="font:500 12px/1 ui-monospace,monospace;color:#526259;letter-spacing:.08em;text-transform:uppercase">Admin preview</p>
  <h1 style="font:400 34px/1.15 'Source Serif 4',Georgia,serif;margin:12px 0 16px">Week ${week} has no stored ${audience} pages</h1>
  <p>Nothing is broken. A week only has topic pages once its collated pair has been
  built and stored, and five of the six weeks have not reached that point.</p>
  <p>To give this week its pages, build the pair from the week's content module and
  put it where the routes look:</p>
  <pre style="background:#E5EBE1;border-radius:12px;padding:16px;overflow-x:auto;font:13px/1.6 ui-monospace,monospace">node scripts/build-teaching-pages.mjs ${week}
cp dist-teaching/week-${week}-learner.html    docs/teaching/pages/
cp dist-teaching/week-${week}-instructor.html docs/teaching/pages/</pre>
  <p>Then commit and deploy. No code changes: the routes read whatever is in
  <code>docs/teaching/pages</code>.</p>
  <p style="margin-top:32px"><a href="/craft/admin/teaching" style="color:#183D32">Back to the console</a></p>
</div></body></html>`;
}

/** The whole week on one page, as stored, optionally marked as a preview. */
export async function collatedPage(
  week: number,
  audience: Audience = 'learner',
  preview?: string,
): Promise<string | null> {
  const html = await source(week, audience);
  if (!html || !preview) return html;
  const wrapper = audience === 'learner' ? '<div class="page">' : '<div class="shell">';
  const at = html.indexOf(wrapper);
  if (at < 0) return html;
  const cut = at + wrapper.length;
  return html.slice(0, cut) + '\n' + previewBar(preview, '/craft/admin/teaching') + html.slice(cut);
}
