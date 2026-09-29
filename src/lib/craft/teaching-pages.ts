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

  const heading = `
<header class="hero">
  <div class="${audience === 'learner' ? 'eyebrow' : 'mono'}">The Living Craft · week ${week} · topic ${n} · ${
    audience === 'learner' ? 'your copy' : "instructor's copy"
  }</div>
  <h1>${title.replace(/^.*?·\s*/, '')}</h1>
</header>`;

  return `${head}${wrapper}
${heading}
${body}
</div>
${script}
</body></html>`;
}

/** The whole week on one page, exactly as stored. */
export async function collatedPage(week: number, audience: Audience = 'learner'): Promise<string | null> {
  return source(week, audience);
}
