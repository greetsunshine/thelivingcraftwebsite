// Every read the console makes.
//
// Collected in one module so the pages stay presentational and so there is one
// place to check what the admin surface can see. Each function returns an empty
// but well-formed result when Supabase is unconfigured or errors — a console
// that renders with zeroes and a setup note is far more useful than one that
// 500s because a rollup was slow.

import { db } from './supabase';

const fail = (where: string, err: unknown) => {
  console.error(`admin query ${where} failed:`, err instanceof Error ? err.message : err);
};

// ---------------------------------------------------------------------------
// Traffic
// ---------------------------------------------------------------------------

export interface DailyPoint {
  day: string;
  views: number;
  visitors: number;
}

export async function trafficDaily(days: number): Promise<DailyPoint[]> {
  const client = db();
  if (!client) return [];

  const { data, error } = await client.rpc('admin_traffic_daily', { days });
  if (error) {
    fail('trafficDaily', error);
    return [];
  }

  const rows = (data ?? []) as DailyPoint[];

  // Fill the gaps. A day with no traffic returns no row, and a line chart drawn
  // from sparse rows silently compresses quiet periods — it looks like steady
  // traffic when it was three visits a fortnight apart.
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: DailyPoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(byDay.get(key) ?? { day: key, views: 0, visitors: 0 });
  }

  return out;
}

export interface PathRow {
  path: string;
  views: number;
  visitors: number;
}

export async function trafficPaths(days: number): Promise<PathRow[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.rpc('admin_traffic_paths', { days });
  if (error) {
    fail('trafficPaths', error);
    return [];
  }
  return (data ?? []) as PathRow[];
}

export interface LabelRow {
  label: string;
  views: number;
}

export async function trafficBreakdown(days: number, dim: string): Promise<LabelRow[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.rpc('admin_traffic_breakdown', { days, dim });
  if (error) {
    fail(`trafficBreakdown(${dim})`, error);
    return [];
  }
  return (data ?? []) as LabelRow[];
}

export interface FunnelRow {
  type: string;
  events: number;
  visitors: number;
}

export async function funnel(days: number): Promise<FunnelRow[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.rpc('admin_funnel', { days });
  if (error) {
    fail('funnel', error);
    return [];
  }
  return (data ?? []) as FunnelRow[];
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export interface Lead {
  id: string;
  created_at: string;
  source: string;
  surface: string;
  interest: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  company: string | null;
  region: string | null;
  message: string | null;
  question: string | null;
  context: string | null;
  status: string;
  admin_note: string | null;
  delivered: boolean;
  country: string | null;
}

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'archived'] as const;

export interface LeadQuery {
  status?: string;
  search?: string;
  limit?: number;
}

export async function leads(q: LeadQuery = {}): Promise<Lead[]> {
  const client = db();
  if (!client) return [];

  let query = client
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(q.limit ?? 200);

  if (q.status && q.status !== 'all') query = query.eq('status', q.status);

  if (q.search) {
    // Escape the PostgREST or() separators before interpolating. A comma or a
    // paren in the search box would otherwise be parsed as filter syntax rather
    // than as text, which is both a broken search and a small injection.
    const safe = q.search.replace(/[,()*]/g, ' ').trim();
    if (safe) {
      query = query.or(
        `email.ilike.%${safe}%,name.ilike.%${safe}%,company.ilike.%${safe}%,message.ilike.%${safe}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    fail('leads', error);
    return [];
  }
  return (data ?? []) as Lead[];
}

export interface LeadCounts {
  total: number;
  new: number;
  undelivered: number;
  last7: number;
}

export async function leadCounts(): Promise<LeadCounts> {
  const client = db();
  const empty = { total: 0, new: 0, undelivered: 0, last7: 0 };
  if (!client) return empty;

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

  try {
    const [total, fresh, undelivered, last7] = await Promise.all([
      client.from('leads').select('*', { count: 'exact', head: true }),
      client.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      client.from('leads').select('*', { count: 'exact', head: true }).eq('delivered', false),
      client.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', since),
    ]);

    return {
      total: total.count ?? 0,
      new: fresh.count ?? 0,
      undelivered: undelivered.count ?? 0,
      last7: last7.count ?? 0,
    };
  } catch (err) {
    fail('leadCounts', err);
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Questions asked of the visitor agent
// ---------------------------------------------------------------------------

export interface Question {
  id: string;
  created_at: string;
  session_id: string | null;
  surface: string | null;
  region: string | null;
  country: string | null;
  question: string;
  answer: string | null;
  answered: boolean;
  captured: boolean;
  tools: string[] | null;
  turns: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

export async function questions(opts: { limit?: number; onlyGaps?: boolean } = {}): Promise<Question[]> {
  const client = db();
  if (!client) return [];

  let query = client
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 150);

  if (opts.onlyGaps) query = query.eq('answered', false);

  const { data, error } = await query;
  if (error) {
    fail('questions', error);
    return [];
  }
  return (data ?? []) as Question[];
}

export interface QuestionStats {
  total: number;
  gaps: number;
  captured: number;
}

export async function questionStats(days: number): Promise<QuestionStats> {
  const client = db();
  const empty = { total: 0, gaps: 0, captured: 0 };
  if (!client) return empty;

  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  try {
    const [total, gaps, captured] = await Promise.all([
      client.from('questions').select('*', { count: 'exact', head: true }).gte('created_at', since),
      client
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since)
        .eq('answered', false),
      client
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', since)
        .eq('captured', true),
    ]);

    return { total: total.count ?? 0, gaps: gaps.count ?? 0, captured: captured.count ?? 0 };
  } catch (err) {
    fail('questionStats', err);
    return empty;
  }
}
