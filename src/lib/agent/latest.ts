// The "latest details" store — the handoff between the retriever agent and the
// visitor Q&A agent.
//
// Two agents, one artefact:
//   scripts/gather-latest.ts  (retriever) WRITES  src/data/latest.json
//   /api/ask                  (Q&A)       READS   it via get_latest_updates
//
// It is a committed JSON file rather than a database because this repo has no
// backend and a serverless function cannot write to its own deployment. The
// retriever runs on a schedule (GitHub Action / local `npm run gather`),
// commits the refreshed file, and the next deploy carries it. That makes every
// change to what the agent knows a reviewable diff — which, for a surface that
// speaks to prospects unsupervised, is a feature rather than a limitation.

import raw from '../../data/latest.json';

export interface LatestItem {
  id: string;
  title: string;
  body: string;
  /** Where the retriever got this — a URL, or 'operator' for hand-written notes. */
  source: string;
  /** ISO date the retriever wrote it. Surfaced so stale facts are visible. */
  gatheredAt: string;
  tags?: string[];
}

export interface LatestStore {
  /** ISO timestamp of the last retriever run. */
  refreshedAt: string;
  items: LatestItem[];
}

const store = raw as LatestStore;

/** Items older than this are withheld — a stale "latest" is worse than none. */
const MAX_AGE_DAYS = 90;

export function getLatest(): LatestStore {
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
  return {
    refreshedAt: store.refreshedAt,
    items: store.items.filter((i) => {
      const t = Date.parse(i.gatheredAt);
      return Number.isNaN(t) ? false : t >= cutoff;
    }),
  };
}
