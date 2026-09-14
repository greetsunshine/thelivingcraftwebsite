// The only place markdown becomes HTML this codebase is willing to inject.
//
// ---------------------------------------------------------------------------
// WHY THIS EXISTS
// ---------------------------------------------------------------------------
// `marked` has not sanitised anything since v5 — it passes raw HTML in the
// source straight through, by design, because sanitising is not its job. Four
// surfaces were calling `marked.parse()` on text a LEARNER wrote and injecting
// the result:
//
//   /craft/adr                       their own record, back to them
//   /craft/admin/work (two panels)   every learner's record, in YOUR session
//
// The second one is the one that matters. A decision record containing
// `<img src=x onerror=…>` executes in the console — the session holding the
// admin cookie — so a learner-authored field becomes a path from the course
// area into the operator surface. This is the same class the discussion page
// already guards (`asMarkdown()` lets only instructor and system replies
// through); the ADR path was simply missed.
//
// ---------------------------------------------------------------------------
// WHAT IT DOES, AND WHAT IT DELIBERATELY DOES NOT
// ---------------------------------------------------------------------------
// Two renderer overrides, and nothing else:
//
//   html   dropped. A decision record is markdown, not a web page. There is no
//          legitimate reason for a learner to emit a tag, and the token covers
//          both block HTML and inline tags.
//   link   href limited to http, https, mailto and site-relative. This is the
//          other half people forget: `[click](javascript:…)` needs no tag at
//          all. Images go the same way, because an <img> src is a request.
//
// It does NOT escape the source before parsing. That was the obvious fix and it
// is wrong: escaping `<` up front turns a fenced code block containing markup
// into a block full of `&lt;`, because marked then escapes the ampersand too.
// Dropping the token keeps code blocks reading correctly.

import { Marked } from 'marked';

/** Schemes a rendered link or image may point at. */
const SAFE = /^(https?:|mailto:|\/|#)/i;

const safeHref = (href: string): string | null => {
  const trimmed = (href ?? '').trim();
  // Control characters are how `java\nscript:` gets past a naive check.
  const flattened = trimmed.replace(/[\u0000-\u0020]/g, '');
  return SAFE.test(flattened) ? flattened : null;
};

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderer = new Marked({
  renderer: {
    // Raw HTML in the source is not rendered. Returning '' drops the token.
    html() {
      return '';
    },
    link({ href, title, tokens }) {
      // `this.parser` is marked's own inline parser — the link TEXT is still
      // rendered as markdown, so only the destination is being constrained.
      const text = this.parser.parseInline(tokens);
      const safe = safeHref(href);
      if (!safe) return text;
      const t = title ? ` title="${escape(title)}"` : '';
      return `<a href="${escape(safe)}"${t}>${text}</a>`;
    },
    image({ href, title, text }) {
      const safe = safeHref(href);
      if (!safe) return escape(text ?? '');
      const t = title ? ` title="${escape(title)}"` : '';
      return `<img src="${escape(safe)}" alt="${escape(text ?? '')}"${t} />`;
    },
  },
});

/**
 * Markdown to HTML, with tags and unsafe destinations removed.
 *
 * Use this for ANY markdown that did not come out of this repository — learner
 * submissions, replies, and model output. `marked.parse()` called directly on
 * that content is the bug this module exists to stop.
 */
export function renderMarkdown(md: string | null | undefined): string {
  if (!md) return '';
  return renderer.parse(md, { async: false }) as string;
}
