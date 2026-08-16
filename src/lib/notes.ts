// What the retriever gathered, prepared for a public page.
//
// The retriever's output (src/data/latest.json) was written for one reader: the
// Q&A agent. This module is the second reader — /latest, which shows prospects
// the same findings. Both the policy of what may be published and the grouping
// live here rather than in the page, so the rules are auditable in one file
// instead of spread through markup.
//
// Two things are deliberately withheld:
//
//   1. `reviewNote` — Sunil's private read on a source ("vendor-sourced, treat
//      accordingly"). Fields are picked one by one rather than spread, so a new
//      operator-only field added to LatestItem later cannot leak by default.
//      Same reasoning as /api/facts.
//
//   2. Operator items (`source: 'operator'`) — hand-written notes that restate
//      our own prices, dates, and seat counts. Those belong to facts.ts and are
//      published from there. A price rendered from latest.json would be a second
//      source for the same fact, and the two could disagree.

import { getLatest, type LatestItem } from './agent/latest';

/** A gathered item, stripped to the fields a visitor and a crawler may see. */
export interface PublicNote {
  id: string;
  title: string;
  body: string;
  source: string;
  /** Hostname of the source, for display — 'arxiv.org' rather than the full URL. */
  sourceHost: string;
  gatheredAt: string;
  tags: string[];
}

export interface NoteTheme {
  id: string;
  title: string;
  blurb: string;
  notes: PublicNote[];
}

/**
 * Themes, in both match order and display order. An item joins the first theme
 * that shares a tag with it, so a note tagged both `mcp` and `security` lands
 * under security — the more specific reading of why it matters.
 *
 * Anything unmatched falls to `OTHER` rather than being dropped: a future
 * retriever run will gather tags nobody anticipated here, and silently hiding
 * those findings is worse than filing them plainly.
 */
const THEMES: { id: string; title: string; blurb: string; tags: string[] }[] = [
  {
    id: 'reliability',
    title: 'Reliability & evaluation',
    blurb:
      'Where agentic systems fail in ways a token count or an eyeballed summary will not show you.',
    tags: ['reliability', 'evaluation', 'context-management'],
  },
  {
    id: 'security',
    title: 'Security & containment',
    blurb:
      'The attack surface a system gains the moment it acts on content it did not author.',
    tags: ['security', 'prompt-injection', 'threat-modelling', 'authorization', 'containment'],
  },
  {
    id: 'protocol',
    title: 'Protocol, tooling & architecture',
    blurb:
      'Releases that change how agentic systems get built — and what they make legacy.',
    tags: ['mcp', 'tooling-release', 'migration', 'architecture', 'tool-design'],
  },
];

const OTHER = {
  id: 'other',
  title: 'Also gathered',
  blurb: 'Findings that do not sit under one of the headings above.',
};

/** 'https://arxiv.org/abs/2608.06503' → 'arxiv.org'. Falls back to the raw string. */
function hostOf(source: string): string {
  try {
    return new URL(source).hostname.replace(/^www\./, '');
  } catch {
    return source;
  }
}

function toPublic(item: LatestItem): PublicNote {
  // Field-by-field on purpose. Do not replace this with a spread + delete.
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    source: item.source,
    sourceHost: hostOf(item.source),
    gatheredAt: item.gatheredAt,
    tags: item.tags ?? [],
  };
}

export interface PublishedNotes {
  /** ISO timestamp of the retriever run that produced these. */
  refreshedAt: string;
  themes: NoteTheme[];
  count: number;
  /** Most recent `gatheredAt` across published notes, or null if there are none. */
  newest: string | null;
}

export function publishedNotes(): PublishedNotes {
  const { refreshedAt, items } = getLatest();

  const publishable = items
    .filter((i) => i.source !== 'operator')
    .map(toPublic)
    // Newest first within every theme; title breaks ties so the order is stable
    // across builds rather than depending on the retriever's write order.
    .sort((a, b) => b.gatheredAt.localeCompare(a.gatheredAt) || a.title.localeCompare(b.title));

  const themeOf = (note: PublicNote) =>
    THEMES.find((t) => note.tags.some((tag) => t.tags.includes(tag)))?.id ?? OTHER.id;

  const themes = [...THEMES, OTHER]
    .map((t) => ({
      id: t.id,
      title: t.title,
      blurb: t.blurb,
      notes: publishable.filter((n) => themeOf(n) === t.id),
    }))
    .filter((t) => t.notes.length > 0);

  return {
    refreshedAt,
    themes,
    count: publishable.length,
    newest: publishable.length ? publishable[0].gatheredAt : null,
  };
}

/** '2026-08-15' or an ISO timestamp → '15 August 2026'. */
export function longDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
