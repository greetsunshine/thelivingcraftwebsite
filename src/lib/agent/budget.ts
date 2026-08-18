// Soft spend ceiling for the agents.
//
// On 2026-08-15 the account ran out of credit mid-session and every visitor
// question started failing — a hard stop with no warning and no graceful
// degradation. The Anthropic Console spend limit is the real ceiling and should
// be set regardless; this is the part that lives in the repo, and its job is
// different: to make the agents stand down *before* the wall, politely, and to
// make the number visible in /admin instead of only in a billing dashboard.
//
// Reads month-to-date spend from the Admin API's cost report:
//   GET /v1/organizations/cost_report   (x-api-key: sk-ant-admin…)
//
// Three constraints shape the design:
//
//   1. The Admin API is UNAVAILABLE FOR INDIVIDUAL ACCOUNTS. If this account
//      isn't an organization, every call 4xxs. That must degrade to "unknown",
//      never to a broken site.
//   2. /api/ask is on the request path, so this cannot make an HTTP call per
//      question. Results are cached, and a stale-but-recent number is fine for
//      a budget check.
//   3. It FAILS OPEN. If the cost API is unreachable, the agents keep working.
//      A monitoring dependency that can take down the assistant is a worse
//      problem than the one it solves — the console limit is the hard stop.

// The .ts extension is REQUIRED, not a style choice. Vite resolves an
// extensionless specifier when Astro builds the site, but this module is also
// imported by the retriever scripts under `node --experimental-strip-types`,
// where ESM will not guess an extension. Without it the guard throws
// ERR_MODULE_NOT_FOUND before either sweep reaches the model — which is exactly
// how the weekly gather and radar runs broke on 2026-08-17.
import { env } from '../admin/env.ts';

const COST_ENDPOINT = 'https://api.anthropic.com/v1/organizations/cost_report';
const CACHE_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;
/** Stop before the wall, so there's room to notice. */
export const WARN_FRACTION = 0.8;

export interface BudgetState {
  /** False when unconfigured or unreadable — callers must not gate on it. */
  known: boolean;
  spentUsd: number;
  limitUsd: number;
  /** Spend as a fraction of the limit. 0 when unknown. */
  used: number;
  overBudget: boolean;
  /** Approaching the limit but not yet over. */
  nearLimit: boolean;
  /** When the figure was read, or why it isn't available. */
  asOf: string;
  note?: string;
}

const unknown = (note: string): BudgetState => ({
  known: false,
  spentUsd: 0,
  limitUsd: 0,
  used: 0,
  overBudget: false,
  nearLimit: false,
  asOf: 'unavailable',
  note,
});

let cache: { at: number; state: BudgetState } | null = null;

/** First instant of the current UTC month, RFC 3339 — the report's window start. */
function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

interface CostBucket {
  results?: { amount?: string; currency?: string }[];
}
interface CostReport {
  data?: CostBucket[];
  has_more?: boolean;
  next_page?: string | null;
}

/**
 * Month-to-date spend in USD.
 *
 * `amount` arrives as a decimal string in the currency's LOWEST UNIT — cents for
 * USD, so "123.45" is $1.2345. Dividing by 100 is not a rounding convenience;
 * reading it as dollars overstates spend 100x and would park the agents
 * permanently.
 */
async function fetchSpendUsd(adminKey: string): Promise<number> {
  let total = 0;
  let page: string | undefined;

  // Bounded: a month of daily buckets fits well inside this, and an unbounded
  // loop on the request path is its own outage.
  for (let i = 0; i < 5; i++) {
    const url = new URL(COST_ENDPOINT);
    url.searchParams.set('starting_at', monthStart());
    url.searchParams.set('bucket_width', '1d');
    url.searchParams.set('limit', '31');
    if (page) url.searchParams.set('page', page);

    const res = await fetch(url, {
      headers: {
        'x-api-key': adminKey,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(
        `cost_report ${res.status}` +
          (res.status === 401 || res.status === 403
            ? ' — admin key rejected, or this is an individual account (the Admin API needs an organization)'
            : ''),
      );
    }

    const body = (await res.json()) as CostReport;

    for (const bucket of body.data ?? []) {
      for (const r of bucket.results ?? []) {
        const cents = Number.parseFloat(r.amount ?? '0');
        if (Number.isFinite(cents)) total += cents;
      }
    }

    if (!body.has_more || !body.next_page) break;
    page = body.next_page;
  }

  return total / 100;
}

/**
 * Current budget state. Cached, and never throws — callers get `known: false`
 * on any failure and are expected to carry on.
 */
export async function getBudget(): Promise<BudgetState> {
  const adminKey = env('ANTHROPIC_ADMIN_KEY');
  const limitUsd = Number.parseFloat(env('AGENT_MONTHLY_BUDGET_USD') || '0');

  if (!adminKey || !Number.isFinite(limitUsd) || limitUsd <= 0) {
    return unknown(
      'Set ANTHROPIC_ADMIN_KEY and AGENT_MONTHLY_BUDGET_USD to track spend here. The Console spend limit is the hard ceiling either way.',
    );
  }

  if (cache && Date.now() - cache.at < CACHE_MS) return cache.state;

  try {
    const spentUsd = await fetchSpendUsd(adminKey);
    const used = spentUsd / limitUsd;
    const state: BudgetState = {
      known: true,
      spentUsd,
      limitUsd,
      used,
      overBudget: used >= 1,
      nearLimit: used >= WARN_FRACTION && used < 1,
      asOf: new Date().toISOString(),
    };
    cache = { at: Date.now(), state };
    return state;
  } catch (err) {
    const note = err instanceof Error ? err.message : String(err);
    console.warn(`budget: could not read spend (${note}) — allowing traffic through`);
    // Cache the failure too, so an unreachable cost API doesn't add a 6s
    // timeout to every question for the next ten minutes.
    const state = unknown(note);
    cache = { at: Date.now(), state };
    return state;
  }
}

/** Force a re-read — used by the admin panel's refresh. */
export function clearBudgetCache(): void {
  cache = null;
}

export const formatUsd = (n: number): string =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
