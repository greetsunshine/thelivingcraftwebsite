// Does the storage actually answer?
//
// This exists because of a specific way the console could lie. Every query in
// queries.ts degrades to an empty result when it errors — deliberately, so one
// slow rollup cannot 500 the whole page. The cost of that choice is that a
// MISSING TABLE and NO ROWS YET render identically: /craft/admin/radar says "never
// run" whether the agent found nothing or the table was never created.
//
// That is the worst kind of bug, because it looks like the correct answer. It
// already cost a diagnosis: after the schema grew new tables, nothing in the
// console could tell you whether the newer half of schema.sql had been applied.
//
// So the console probes what it depends on and says so out loud. Errors here
// are surfaced, never swallowed — this is the one place in the admin surface
// where failing loudly is the whole point.

import { db } from './supabase';
import { capabilities } from './env';

/** Every table the console reads or writes. Keep in step with supabase/schema.sql. */
const TABLES = [
  'events',
  'leads',
  'questions',
  'learners',
  'intake_responses',
  'radar_findings',
  'radar_runs',
] as const;

/** Every rollup. A renamed argument breaks these while the tables stay fine. */
const FUNCTIONS = [
  'admin_traffic_daily',
  'admin_traffic_paths',
  'admin_funnel',
] as const;

export interface Probe {
  name: string;
  kind: 'table' | 'function';
  ok: boolean;
  /** Postgres' own message, trimmed. Usually names the fix precisely. */
  error?: string;
  /** Row count, for tables that answered. Distinguishes "empty" from "broken". */
  rows?: number;
}

export interface Health {
  /** False when the env vars are absent — a different problem with a different fix. */
  configured: boolean;
  probes: Probe[];
  broken: Probe[];
  ok: boolean;
  checkedAt: number;
}

// One probe per minute per instance, not one per page load.
//
// Every admin page renders this, and eleven head-queries on each navigation
// would be a real cost for a diagnostic that changes only when someone runs
// migrations. Sixty seconds is short enough that "I just ran schema.sql" shows
// up while you are still looking at the tab.
const TTL_MS = 60_000;
let cached: Health | null = null;

export async function dbHealth(force = false): Promise<Health> {
  if (!force && cached && Date.now() - cached.checkedAt < TTL_MS) return cached;

  if (!capabilities().data) {
    cached = { configured: false, probes: [], broken: [], ok: false, checkedAt: Date.now() };
    return cached;
  }

  const client = db();
  if (!client) {
    cached = { configured: false, probes: [], broken: [], ok: false, checkedAt: Date.now() };
    return cached;
  }

  const probes = await Promise.all([
    // head:true fetches no rows — this asks "does this relation exist and can I
    // read it", which is exactly the question, at close to zero cost.
    ...TABLES.map(async (name): Promise<Probe> => {
      try {
        const { count, error } = await client.from(name).select('*', { count: 'exact', head: true });
        return error
          ? { name, kind: 'table', ok: false, error: error.message.slice(0, 300) }
          : { name, kind: 'table', ok: true, rows: count ?? 0 };
      } catch (err) {
        return { name, kind: 'table', ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'threw' };
      }
    }),

    // Called with the smallest window that still exercises the argument names.
    // A function that exists with a different signature fails here, which is
    // the failure mode a plain "does it exist" check would miss.
    ...FUNCTIONS.map(async (name): Promise<Probe> => {
      try {
        const { error } = await client.rpc(name, { days: 1 });
        return error
          ? { name, kind: 'function', ok: false, error: error.message.slice(0, 300) }
          : { name, kind: 'function', ok: true };
      } catch (err) {
        return { name, kind: 'function', ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'threw' };
      }
    }),

    // Two arguments rather than one, so it needs its own probe.
    (async (): Promise<Probe> => {
      const name = 'admin_traffic_breakdown';
      try {
        const { error } = await client.rpc(name, { days: 1, dim: 'device' });
        return error
          ? { name, kind: 'function', ok: false, error: error.message.slice(0, 300) }
          : { name, kind: 'function', ok: true };
      } catch (err) {
        return { name, kind: 'function', ok: false, error: err instanceof Error ? err.message.slice(0, 300) : 'threw' };
      }
    })(),
  ]);

  const broken = probes.filter((p) => !p.ok);
  cached = { configured: true, probes, broken, ok: broken.length === 0, checkedAt: Date.now() };

  if (broken.length > 0) {
    console.error(
      `admin storage health: ${broken.length} broken —`,
      broken.map((b) => `${b.name}: ${b.error}`).join(' | '),
    );
  }

  return cached;
}

/**
 * Postgres says "relation ... does not exist" for a table that was never
 * created. That one has a single, specific fix, and saying it beats making
 * someone read a raw error.
 */
export const looksUnmigrated = (health: Health): boolean =>
  health.broken.some((b) => /does not exist|schema cache/i.test(b.error ?? ''));
