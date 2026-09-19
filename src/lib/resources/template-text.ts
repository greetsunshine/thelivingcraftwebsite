// The two plain-text downloads of a template, built from its collection entry.
//
// Until 19 September 2026 this lived in the frontmatter of
// src/pages/resources/templates/[...slug].astro and was served as a build-time
// data: URL. The download gate moved the hand-over to /api/pipeline/download,
// which has to build the same text on the server, so the format's one owner
// is now this module and the page calls it too. Note 1 on that page still
// holds: the blank, the worked example and both files come from ONE array of
// sections, in one order, and cannot drift into three documents.
//
// Prompts become `>` lines so that clearing them out of your own copy is one
// keystroke per block, which is the whole reason they are carried into the
// download at all rather than left behind on the page.

import type { CollectionEntry } from 'astro:content';
import { SITE_ORIGIN } from '../../data/facts';
import { COMMITMENT, FEES_NOTE } from '../../data/offer-display';

export type TemplateEntry = CollectionEntry<'templates'>;

// The two strings this site may not restate. An unknown token is left visible
// rather than blanked: a {{TYPO}} on the page is a bug somebody reports in an
// hour, and a silently empty sentence is one nobody ever notices.
const TOKENS: Record<string, string> = { COMMITMENT, FEES_NOTE };
export const resolveTokens = (s: string): string =>
  s.replace(/\{\{([A-Z_]+)\}\}/g, (whole, key: string) => TOKENS[key] ?? whole);

const quote = (lines: string[]): string[] =>
  lines.flatMap((line, i) => (i === 0 ? [`> ${line}`] : ['>', `> ${line}`]));

export const templateUrl = (entry: TemplateEntry): string => `${SITE_ORIGIN}/resources/templates/${entry.id}`;

/** `<fileBase>.md` and `<fileBase>-example.md`. */
export const templateFilenames = (entry: TemplateEntry) => ({
  blank: `${entry.data.fileBase}.md`,
  worked: `${entry.data.fileBase}-example.md`,
});

/** The blank template as Markdown, prompts quoted, room to write under each. */
export function blankTemplateText(entry: TemplateEntry): string {
  const d = entry.data;
  const url = templateUrl(entry);
  const lines: string[] = [
    `# ${d.title}`,
    '',
    d.artifact,
    '',
    `Blank template · ${url}`,
    '',
    ...(d.header.length > 0 ? [...d.header.map((h) => `${h}:`), ''] : []),
    '---',
    '',
  ];
  for (const s of d.sections) {
    lines.push(`## ${s.heading}`, '');
    lines.push(
      ...quote([
        ...(s.minutes ? [`${s.minutes} minutes`] : []),
        resolveTokens(s.prompt),
        ...(s.note ? [resolveTokens(s.note)] : []),
      ]),
    );
    // Room to write, and a blank line either side of it.
    lines.push('', '', '');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

/** The completed example as Markdown, with its illustrative label kept. */
export function workedTemplateText(entry: TemplateEntry): string {
  const d = entry.data;
  const url = templateUrl(entry);
  const lines: string[] = [
    `# ${d.title} — worked example`,
    '',
    d.worked.title,
    '',
    // The illustrative label travels with the file. A worked example that
    // leaves the site without it is a claim about a customer somebody did not
    // make.
    d.worked.note,
    '',
    resolveTokens(d.worked.lead),
    '',
    ...(d.worked.header.length > 0
      ? [...d.header.map((h, i) => `${h}: ${d.worked.header[i] ?? ''}`.trimEnd()), '']
      : []),
    '---',
    '',
  ];
  for (const s of d.sections) {
    lines.push(`## ${s.heading}`, '', resolveTokens(s.example).trimEnd(), '');
  }
  lines.push('---', '', `Blank version of this template · ${url}`);
  return `${lines.join('\n').trimEnd()}\n`;
}
