// The radar store — market intelligence for Sunil, read only by /admin/radar.
//
// WHY THIS IS NOT latest.json. There are two retriever agents writing two files
// because they serve two different readers, and merging them would break the
// thing that makes the visitor agent safe:
//
//   latest.json  written by gather-latest.ts, read by /api/ask, spoken VERBATIM
//                to prospects. Topics map to what the cohort teaches, because
//                the question behind them is "is this material current?".
//
//   radar.json   written by gather-radar.ts, read by Sunil in the admin console
//                and by nobody else. Topics are commercial: where big tech is
//                investing, what is failing, who is hiring in India.
//
// "Google is investing $N billion in agents" is a useful thing for Sunil to
// know and a strange, off-key thing for a chatbot to volunteer to someone asking
// about the cohort. Worse, the categories that make this feed valuable —
// what is failing, hiring and salary data — are exactly the ones where a
// half-sourced claim repeated to a prospect does real damage. Keeping the file
// out of the agent's tool surface makes that structurally impossible rather
// than a matter of prompt discipline.
//
// Nothing in src/pages/api/ask.ts may import this module.

import raw from '../../data/radar.json';
import { CATEGORY_KEYS, RADAR_MAX_AGE_DAYS } from '../../data/radar-categories';

export interface RadarItem {
  id: string;
  /** One of CATEGORY_KEYS. */
  category: string;
  title: string;
  /** Two to four sentences of what was found. */
  body: string;
  /** One line: what this means for the cohort curriculum or the consulting positioning. */
  implication?: string;
  /** Source-quality caveats. Operator-only, like latest.json's reviewNote. */
  reviewNote?: string;
  source: string;
  /**
   * How much the source is worth. The agent classifies it and the console shows
   * it, because "what is failing" sourced to a competitor's blog and the same
   * claim sourced to a published post-mortem are not the same finding.
   */
  sourceType?: 'primary' | 'press' | 'vendor' | 'secondhand';
  /** Publication date of the source, where the agent could establish one. */
  publishedAt?: string;
  tags?: string[];
  /** ISO date the retriever wrote it. */
  gatheredAt: string;
}

export interface RadarStore {
  refreshedAt: string;
  items: RadarItem[];
}

const store = raw as RadarStore;

/**
 * Retention. Unlike latest.json — which is replaced wholesale each run because
 * a stale "latest" is worse than none — the radar ACCUMULATES. A quarter of
 * hiring signal is more useful than this week's slice of it, and reading how a
 * story developed is most of the value. The window itself is defined next to
 * the categories so the retriever can prune by the same number.
 */
export { RADAR_MAX_AGE_DAYS };

export function getRadar(): RadarStore {
  const cutoff = Date.now() - RADAR_MAX_AGE_DAYS * 86_400_000;

  const items = store.items
    .filter((i) => {
      const t = Date.parse(i.gatheredAt);
      return !Number.isNaN(t) && t >= cutoff && CATEGORY_KEYS.includes(i.category);
    })
    .sort((a, b) => (a.gatheredAt < b.gatheredAt ? 1 : a.gatheredAt > b.gatheredAt ? -1 : 0));

  return { refreshedAt: store.refreshedAt, items };
}

export function radarByCategory(): Map<string, RadarItem[]> {
  const grouped = new Map<string, RadarItem[]>();
  for (const key of CATEGORY_KEYS) grouped.set(key, []);
  for (const item of getRadar().items) grouped.get(item.category)?.push(item);
  return grouped;
}
