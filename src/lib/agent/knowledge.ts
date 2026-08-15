// Retrieval over the grounded fact base.
//
// Ported from ~/agentic-observability-demo (tools.py `search_kb`), with the
// Acme fixture swapped for this practice's real facts. Deliberately BM25-ish
// lexical scoring rather than embeddings: the corpus is ~20 facts, an embedding
// call would add latency and a second failure mode, and lexical matching is
// auditable — you can see exactly why a fact was returned.
//
// The agent may only answer from what this returns. That constraint is what
// stops it inventing pricing, which the repo's hard rules forbid.

import { cohortPriceAnswer, facts, type Fact } from '../../data/facts';
import type { Region } from '../../data/regions';
import { getLatest, type LatestItem } from './latest';

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did',
  'i', 'you', 'we', 'it', 'this', 'that', 'to', 'of', 'in', 'on', 'for', 'and',
  'or', 'with', 'what', 'how', 'when', 'where', 'who', 'why', 'can', 'will',
  'would', 'should', 'me', 'my', 'your', 'about', 'there', 'have', 'has', 'get',
]);

const tokenize = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s₹]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

/** Light stemming so "pricing"/"priced"/"prices" all reach "pric". */
const stem = (t: string): string =>
  t.replace(/(ing|ed|es|s)$/u, '').replace(/(.)\1$/u, '$1');

function score(queryTokens: string[], haystack: string, weight: number): number {
  const hay = new Set(tokenize(haystack).map(stem));
  let hits = 0;
  for (const q of queryTokens) if (hay.has(q)) hits += 1;
  return hits * weight;
}

export interface Retrieved {
  id: string;
  q: string;
  a: string;
  surface: string;
  score: number;
}

/**
 * Region named in the question itself — the fallback when the request didn't
 * carry one (no ?region= param, no geo header). Someone who writes "I'm in
 * Dubai, what's the price?" has told us what we need.
 *
 * Only consulted when the request region is unknown. If the request DID resolve
 * a region, that wins — otherwise "I'm in India, what does Australia pay?"
 * would talk itself into the cross-region answer this is meant to prevent.
 */
function regionFromText(text: string): Region['key'] | null {
  const t = text.toLowerCase();
  if (/\b(india|indian|inr|rupee|bangalore|bengaluru|mumbai|delhi)\b/.test(t)) return 'india';
  if (/\b(dubai|uae|emirates|aed|dirham|abu dhabi)\b/.test(t)) return 'dubai';
  if (/\b(australia|australian|aud|sydney|melbourne|brisbane)\b/.test(t)) return 'australia';
  return null;
}

/**
 * Resolve a fact's answer for this visitor. Regional facts carry a placeholder
 * in the fact base and are rendered here, so the region is applied in exactly
 * one place and can't be forgotten at a call site.
 */
function answerFor(f: Fact, region: Region['key'] | null, query: string): string {
  if (!f.regional) return f.a;
  if (f.id === 'cohort-price') return cohortPriceAnswer(region ?? regionFromText(query));
  return f.a;
}

/**
 * Rank facts against a query. Question text is weighted above answer text —
 * a fact whose *question* matches is far more likely to be the one asked.
 *
 * `region` scopes regional answers to the visitor. Scoring runs against the
 * static text so ranking stays stable regardless of who is asking.
 */
export function searchKnowledge(
  query: string,
  region?: Region['key'] | null,
  limit = 5,
): Retrieved[] {
  const q = tokenize(query).map(stem);
  if (q.length === 0) return [];

  return facts
    .map((f: Fact) => ({
      id: f.id,
      q: f.q,
      a: answerFor(f, region ?? null, query),
      surface: f.surface,
      score:
        score(q, f.q, 3) +
        score(q, (f.tags ?? []).join(' '), 2) +
        score(q, f.a, 1),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Everything the agent may cite, formatted for the tool result. */
export function formatRetrieved(rows: Retrieved[]): string {
  if (rows.length === 0) {
    return 'NO_MATCH — the fact base has nothing on this. Say you do not know and offer to pass the question to Sunil.';
  }
  return rows
    .map((r) => `[${r.id} · page ${r.surface}]\nQ: ${r.q}\nA: ${r.a}`)
    .join('\n\n---\n\n');
}

/** Latest-updates lookup, kept beside retrieval so the agent has one import. */
export function searchLatest(query: string, limit = 4): LatestItem[] {
  const items = getLatest().items;
  const q = tokenize(query).map(stem);
  if (q.length === 0) return items.slice(0, limit);

  const ranked = items
    .map((it) => ({
      it,
      s: score(q, it.title, 3) + score(q, (it.tags ?? []).join(' '), 2) + score(q, it.body, 1),
    }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.it);

  // No lexical hit still means "here's what's current" — better than nothing
  // when the visitor asks an open "what's new?".
  return ranked.length > 0 ? ranked : items.slice(0, limit);
}

export function formatLatest(items: LatestItem[]): string {
  if (items.length === 0) {
    return 'NO_UPDATES — nothing has been gathered yet. Answer from the fact base alone.';
  }
  return items
    .map(
      (i) =>
        `[${i.id} · gathered ${i.gatheredAt} · source: ${i.source}]\n${i.title}\n${i.body}`,
    )
    .join('\n\n---\n\n');
}
