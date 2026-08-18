// Supabase client — service role, server only.
//
// The service-role key bypasses row-level security. Every table in
// supabase/schema.sql has RLS on with no policies, so this key is the only way
// to reach the data; that makes it exactly as sensitive as the data itself.
// It is read through env() (never a PUBLIC_/VITE_ var) and is only ever
// imported by files under src/pages/api/ and src/lib/admin/, so it cannot be
// bundled into a page.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
// Extension required: the radar retriever imports this module under
// `node --experimental-strip-types`, whose ESM resolver will not guess one.
// Vite resolves it either way. Same trap that broke both sweeps on 2026-08-17.
import { env } from './env.ts';

let cached: SupabaseClient | null = null;

/**
 * Returns null when Supabase is not configured. Callers MUST handle null:
 * a console panel shows a setup note, a write path skips silently.
 *
 * Throwing here instead would mean a missing env var takes down the public
 * site's forms — the exact coupling this design is trying not to create.
 */
export function db(): SupabaseClient | null {
  if (cached) return cached;

  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'thelivingcraft-admin' } },
  });
  return cached;
}

/**
 * Fire-and-forget write.
 *
 * Recording is never allowed to affect the visitor. If Supabase is slow, down,
 * or unconfigured, the lead still reaches the inbox and the page still renders
 * — we lose a row and log it. The inbox is the system of record; this is the
 * ledger beside it.
 */
export async function record(
  table: 'events' | 'leads' | 'questions',
  row: Record<string, unknown>,
): Promise<void> {
  const client = db();
  if (!client) return;

  try {
    const { error } = await client.from(table).insert(row);
    if (error) console.error(`record(${table}) failed:`, error.message);
  } catch (err) {
    console.error(`record(${table}) threw:`, err instanceof Error ? err.message : err);
  }
}
