// The radar store — market intelligence for Sunil, read only by /admin/radar.
//
// WHY THIS IS NOT latest.json. There are two retriever agents writing two
// stores because they serve two different readers, and merging them would break
// the thing that makes the visitor agent safe:
//
//   latest.json     written by gather-latest.ts, read by /api/ask, spoken
//                   VERBATIM to prospects. Topics map to what the cohort
//                   teaches, because the question behind them is "is this
//                   material current?".
//
//   radar_findings  written by gather-radar.ts, read by Sunil in the admin
//                   console and by nobody else. Topics are commercial: where
//                   big tech is investing, what is failing, who is hiring in
//                   India.
//
// "Google is investing $N billion in agents" is a useful thing for Sunil to
// know and a strange, off-key thing for a chatbot to volunteer to someone asking
// about the cohort. Worse, the categories that make this feed valuable —
// what is failing, hiring and salary data — are exactly the ones where a
// half-sourced claim repeated to a prospect does real damage.
//
// Nothing in src/pages/api/ask.ts may import this module or query these tables.
//
// WHY A TABLE AND NOT A FILE. It was src/data/radar.json, refreshed by an agent
// that opened a pull request. That gate is right for the visitor-facing
// retriever, whose output a chatbot repeats; here it meant a merge and a deploy
// before Sunil could read his own notebook. Review still happens — findings
// arrive as 'new' and hiding one is an UPDATE — it just no longer requires
// shipping a deployment.
//
// Every relative import carries its .ts extension: this module is imported both
// by Astro (Vite resolves anything) and by the retriever script under
// `node --experimental-strip-types` (which resolves nothing implicitly).

import { db } from '../admin/supabase.ts';
import { CATEGORY_KEYS, RADAR_MAX_AGE_DAYS } from '../../data/radar-categories.ts';

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
  /** new = unread · kept = read and kept · hidden = dismissed. */
  status: 'new' | 'kept' | 'hidden';
}

export interface RadarRun {
  startedAt: string;
  finishedAt: string | null;
  trigger: string;
  categories: string[] | null;
  found: number;
  duplicates: number;
  pruned: number;
  error: string | null;
}

export interface RadarStore {
  /** When the last sweep ran, or null if none ever has. */
  refreshedAt: string | null;
  items: RadarItem[];
}

/**
 * Retention. Unlike latest.json — which is replaced wholesale each run because
 * a stale "latest" is worse than none — the radar ACCUMULATES. A quarter of
 * hiring signal is more useful than this week's slice of it, and reading how a
 * story developed is most of the value.
 */
export { RADAR_MAX_AGE_DAYS };

interface Row {
  id: string;
  category: string;
  title: string;
  body: string;
  implication: string | null;
  review_note: string | null;
  source: string;
  source_type: string | null;
  published_at: string | null;
  tags: string[] | null;
  gathered_at: string;
  status: string;
}

const toItem = (r: Row): RadarItem => ({
  id: r.id,
  category: r.category,
  title: r.title,
  body: r.body,
  implication: r.implication ?? undefined,
  reviewNote: r.review_note ?? undefined,
  source: r.source,
  sourceType: (r.source_type as RadarItem['sourceType']) ?? undefined,
  publishedAt: r.published_at ?? undefined,
  tags: r.tags ?? undefined,
  gatheredAt: r.gathered_at,
  status: (r.status as RadarItem['status']) ?? 'new',
});

const SELECT =
  'id, category, title, body, implication, review_note, source, source_type, published_at, tags, gathered_at, status';

const cutoffDate = (): string =>
  new Date(Date.now() - RADAR_MAX_AGE_DAYS * 86_400_000).toISOString().slice(0, 10);

/**
 * Findings inside the retention window.
 *
 * Unconfigured or erroring Supabase returns an empty store rather than
 * throwing — same discipline as lib/admin/queries. A console panel that says
 * "nothing yet" is recoverable; one that 500s takes the whole page with it.
 */
export async function getRadar(opts: { includeHidden?: boolean } = {}): Promise<RadarStore> {
  const client = db();
  if (!client) return { refreshedAt: null, items: [] };

  let q = client
    .from('radar_findings')
    .select(SELECT)
    .gte('gathered_at', cutoffDate())
    .in('category', CATEGORY_KEYS)
    .order('gathered_at', { ascending: false })
    .limit(500);

  if (!opts.includeHidden) q = q.neq('status', 'hidden');

  const [{ data, error }, run] = await Promise.all([q, lastRadarRun()]);

  if (error) {
    console.error('radar getRadar failed:', error.message);
    return { refreshedAt: run?.startedAt ?? null, items: [] };
  }

  return {
    refreshedAt: run?.startedAt ?? null,
    items: ((data ?? []) as Row[]).map(toItem),
  };
}

export async function radarByCategory(): Promise<Map<string, RadarItem[]>> {
  const grouped = new Map<string, RadarItem[]>();
  for (const key of CATEGORY_KEYS) grouped.set(key, []);
  for (const item of (await getRadar()).items) grouped.get(item.category)?.push(item);
  return grouped;
}

/**
 * The last sweep, successful or not.
 *
 * Read from radar_runs rather than inferred from the newest finding: a sweep
 * that legitimately found nothing new would otherwise look like a sweep that
 * never happened, which is exactly the case where "when did this last run?"
 * matters.
 */
export async function lastRadarRun(): Promise<RadarRun | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from('radar_runs')
    .select('started_at, finished_at, trigger, categories, found, duplicates, pruned, error')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('radar lastRadarRun failed:', error.message);
    return null;
  }

  const r = data as Record<string, unknown>;
  return {
    startedAt: String(r.started_at),
    finishedAt: (r.finished_at as string) ?? null,
    trigger: String(r.trigger ?? 'schedule'),
    categories: (r.categories as string[]) ?? null,
    found: Number(r.found ?? 0),
    duplicates: Number(r.duplicates ?? 0),
    pruned: Number(r.pruned ?? 0),
    error: (r.error as string) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Writes — the retriever script and the console's hide/edit buttons
// ---------------------------------------------------------------------------

export interface IncomingFinding {
  id: string;
  category: string;
  title: string;
  body: string;
  implication?: string;
  reviewNote?: string;
  source: string;
  sourceType?: string;
  publishedAt?: string;
  tags?: string[];
}

/** Host + path, lowercased, without query, fragment, or trailing slash. */
export function sourceKey(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export interface WriteResult {
  inserted: number;
  duplicates: number;
}

/**
 * Insert what a sweep found, skipping anything already on the radar.
 *
 * Deduping is the database's job now, not the script's: a unique index on
 * source_key plus ignoreDuplicates means two overlapping runs cannot race each
 * other into two rows for one story. The old file-based version compared
 * against a snapshot it had read minutes earlier, which was fine only because
 * nothing else could be writing at the same time.
 */
export async function saveFindings(items: IncomingFinding[]): Promise<WriteResult> {
  const client = db();
  if (!client) throw new Error('Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  if (items.length === 0) return { inserted: 0, duplicates: 0 };

  const today = new Date().toISOString().slice(0, 10);

  // Collapse duplicates WITHIN the batch first. Postgres rejects an upsert
  // whose rows conflict with each other on the target index, so two findings
  // from the same URL in one sweep would fail the whole insert.
  const rowFor = (i: IncomingFinding) => ({
    id: i.id,
    gathered_at: today,
    category: i.category,
    title: i.title,
    body: i.body,
    implication: i.implication ?? null,
    review_note: i.reviewNote ?? null,
    source: i.source,
    source_key: sourceKey(i.source),
    source_type: i.sourceType ?? null,
    published_at: i.publishedAt ?? null,
    tags: i.tags ?? null,
    status: 'new',
  });

  const byKey = new Map<string, ReturnType<typeof rowFor>>();

  for (const item of items) {
    const row = rowFor(item);
    if (!byKey.has(row.source_key)) byKey.set(row.source_key, row);
  }

  const rows = [...byKey.values()];

  const { data, error } = await client
    .from('radar_findings')
    .upsert(rows, { onConflict: 'source_key', ignoreDuplicates: true })
    .select('id');

  if (error) throw new Error(`radar insert failed: ${error.message}`);

  const inserted = (data ?? []).length;
  return { inserted, duplicates: items.length - inserted };
}

/** Drop findings past the retention window. Returns how many went. */
export async function pruneFindings(): Promise<number> {
  const client = db();
  if (!client) return 0;

  const { data, error } = await client
    .from('radar_findings')
    .delete()
    .lt('gathered_at', cutoffDate())
    .select('id');

  if (error) {
    console.error('radar prune failed:', error.message);
    return 0;
  }
  return (data ?? []).length;
}

export async function startRun(trigger: string, categories: string[]): Promise<string | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from('radar_runs')
    .insert({ trigger, categories })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('radar startRun failed:', error.message);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}

export async function finishRun(
  id: string | null,
  patch: { found?: number; duplicates?: number; pruned?: number; error?: string },
): Promise<void> {
  const client = db();
  if (!client || !id) return;

  const { error } = await client
    .from('radar_runs')
    .update({ ...patch, finished_at: new Date().toISOString() })
    .eq('id', id);

  if (error) console.error('radar finishRun failed:', error.message);
}

export async function setFindingStatus(id: string, status: 'new' | 'kept' | 'hidden'): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('radar_findings').update({ status }).eq('id', id);
  if (error) {
    console.error('radar setFindingStatus failed:', error.message);
    return false;
  }
  return true;
}

/**
 * Correct the prose on a finding.
 *
 * Title, body and implication only. The source URL, the date and the source
 * grading are deliberately not editable: fixing wording is editing, changing a
 * citation is fabrication. Rerun the agent instead.
 */
export async function editFinding(
  id: string,
  patch: { title?: string; body?: string; implication?: string },
): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const update: Record<string, string> = {};
  if (patch.title?.trim()) update.title = patch.title.trim();
  if (patch.body?.trim()) update.body = patch.body.trim();
  if (patch.implication !== undefined) update.implication = patch.implication.trim();
  if (Object.keys(update).length === 0) return false;

  const { error } = await client.from('radar_findings').update(update).eq('id', id);
  if (error) {
    console.error('radar editFinding failed:', error.message);
    return false;
  }
  return true;
}
