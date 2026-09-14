import { type PublicNote } from '../notes';
import { getLatest } from '../agent/latest';

export interface ReadingSuggestion {
  item: PublicNote;
  capability: string;
  reason: string;
}

// Maps latest.json tags to capability IDs (A1-A7, B1-B6)
const TAG_CAPABILITY_MAP: Record<string, string[]> = {
  'architecture': ['A1', 'A5'],
  'context-management': ['A2'],
  'tool-design': ['A4'],
  'security': ['A3', 'A7'],
  'containment': ['A3'],
  'prompt-injection': ['A7'],
  'authorization': ['A3'],
  'reliability': ['A6'],
  'evaluation': ['A5'],
  'mcp': ['A4'],
  'tooling-release': ['B2'],
  'threat-modelling': ['A3', 'A7'],
  'migration': ['B3'],
};

/** 'https://arxiv.org/abs/2608.06503' → 'arxiv.org'. Falls back to the raw string. */
function hostOf(source: string): string {
  try {
    return new URL(source).hostname.replace(/^www\./, '');
  } catch {
    return source;
  }
}

export function suggestionsFor(ratings: Record<string, number>): ReadingSuggestion[] {
  const { items } = getLatest();
  
  const candidates = items
    .filter(i => i.source !== 'operator')
    .map(i => ({
      id: i.id,
      title: i.title,
      body: i.body,
      source: i.source,
      sourceHost: hostOf(i.source),
      gatheredAt: i.gatheredAt,
      tags: i.tags ?? [],
    } as PublicNote));

  const suggestions: ReadingSuggestion[] = [];

  for (const item of candidates) {
    let matchedCapability: string | null = null;
    let minRating = 6;
    
    for (const tag of item.tags) {
      const caps = TAG_CAPABILITY_MAP[tag] ?? [];
      for (const cap of caps) {
        const rating = ratings[cap];
        if (rating !== undefined && rating < minRating) {
          minRating = rating;
          matchedCapability = cap;
        }
      }
    }
    
    if (matchedCapability !== null) {
      let reason = 'Because this matches your interests';
      if (minRating <= 2) reason = 'Core reading for your weakest areas';
      else if (minRating === 3) reason = 'Good foundation building';
      else if (minRating >= 4) reason = 'Advanced reading for your strengths';
      
      suggestions.push({
        item,
        capability: matchedCapability,
        reason,
      });
    }
  }

  // Sort by lowest rating first, then by date (newest first)
  suggestions.sort((a, b) => {
    const rA = ratings[a.capability] ?? 0;
    const rB = ratings[b.capability] ?? 0;
    if (rA !== rB) return rA - rB;
    return b.item.gatheredAt.localeCompare(a.item.gatheredAt);
  });
  
  // Return top 3 unique items
  const unique = new Map<string, ReadingSuggestion>();
  for (const s of suggestions) {
    if (!unique.has(s.item.id)) {
      unique.set(s.item.id, s);
      if (unique.size >= 3) break;
    }
  }

  return Array.from(unique.values());
}
