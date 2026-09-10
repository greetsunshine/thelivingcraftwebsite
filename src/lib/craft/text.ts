// Frontmatter is plain strings, and some of it is written with inline code.
//
// A session file says "Run `make run`" in its prework, its after list and its
// checkpoint items. Astro renders the BODY as Markdown; frontmatter strings are
// handed over untouched, so without this the learner reads a literal backtick.
//
// This is not a Markdown parser and must not become one. It does exactly one
// transform, on content that lives in this repo and is reviewed as a diff:
// escape the string completely, then re-open the one tag we want. Escaping
// first is what makes the `set:html` at the call site safe — nothing in the
// source can introduce markup, including a future session file written by
// somebody in a hurry.

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Every character that could open a tag, neutralised. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c]!);
}

/**
 * `code` spans in a frontmatter string, and nothing else.
 *
 * Safe to pass to `set:html` because the escape runs over the whole string
 * before a single tag is introduced, and the only tag introduced is <code>.
 */
export function inlineCode(s: string): string {
  return escapeHtml(s).replace(/`([^`]+)`/g, '<code>$1</code>');
}
