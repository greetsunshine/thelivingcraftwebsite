// Per-IP rate limiting for /api/ask.
//
// In-memory and therefore per-instance: a serverless fleet gives each cold
// instance its own counter, so this bounds abuse rather than preventing it.
// That is the right trade here — the alternative is a KV store and another
// dependency, and the real ceiling on cost is the Anthropic spend limit on the
// key. What this does stop is the cheap case: one browser tab hammering the
// endpoint in a loop.
//
// Revisit if the site ever gets enough traffic that the fleet stays warm.

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const MAX_KEYS = 5_000;

const buckets = new Map<string, Bucket>();

export function checkRate(key: string): { ok: true } | { ok: false; message: string } {
  const now = Date.now();

  // Cheap sweep so a long-lived instance can't accumulate keys without bound.
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (bucket.count >= MAX_PER_WINDOW) {
    return {
      ok: false,
      message: 'That is a lot of questions at once. Give it a minute, or email apply@thelivingcraft.ai.',
    };
  }

  bucket.count += 1;
  return { ok: true };
}
