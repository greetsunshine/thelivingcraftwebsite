// Every read and write the learner area makes against the `learners` table.
//
// Same discipline as lib/admin/queries: Supabase unconfigured or erroring
// returns a well-formed empty result, never a throw. The difference is what an
// empty result MEANS here — for the console it means "no data yet", for a gate
// it means "not signed in". So the callers below are written so that a failure
// closes the door rather than opening it.

import { db } from '../admin/supabase';
import { codeMatches, hashCode, newCode } from './auth';

export interface Learner {
  id: string;
  email: string;
  name: string | null;
  cohort: string;
  status: string;
  note: string | null;
  created_at: string;
  last_seen_at: string | null;
}

const fail = (where: string, err: unknown) => {
  console.error(`learners ${where} failed:`, err instanceof Error ? err.message : err);
};

const COLUMNS = 'id, email, name, cohort, status, note, created_at, last_seen_at';

/**
 * The learner this session belongs to, but only while the seat is active.
 *
 * Checked on every gated request rather than trusted from the cookie, so
 * revoking a seat in /admin takes effect on the learner's next page load
 * instead of whenever their 30-day cookie happens to expire. That costs one
 * indexed primary-key lookup per page — the right trade for eight people.
 */
export async function activeLearner(id: string): Promise<Learner | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client
    .from('learners')
    .select(COLUMNS)
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    fail('activeLearner', error);
    return null;
  }
  return (data as Learner) ?? null;
}

/**
 * Verify an email + code pair.
 *
 * The code is compared against the stored HMAC in constant time, and a missing
 * row runs the comparison anyway against a dummy hash — otherwise the response
 * time tells an attacker which addresses hold a seat.
 */
export async function signIn(email: string, code: string): Promise<Learner | null> {
  const client = db();
  if (!client) return null;

  // Stored addresses are always lowercase (issueSeat normalises), so an exact
  // match on the lowercased input is both correct and index-backed.
  const { data, error } = await client
    .from('learners')
    .select(`${COLUMNS}, code_hash`)
    .eq('email', email.trim().toLowerCase())
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    fail('signIn', error);
    return null;
  }

  const row = data as (Learner & { code_hash: string }) | null;
  const ok = await codeMatches(code, row?.code_hash ?? (await hashCode('no-such-learner')));
  if (!row || !ok) return null;

  // Fire and forget: a failed timestamp write must not fail a valid sign-in.
  void client
    .from('learners')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', row.id)
    .then(({ error: e }) => e && fail('touch last_seen_at', e));

  const { code_hash: _drop, ...learner } = row;
  return learner;
}

// ---------------------------------------------------------------------------
// Admin side — issuing and revoking seats
// ---------------------------------------------------------------------------

export async function listLearners(): Promise<Learner[]> {
  const client = db();
  if (!client) return [];

  const { data, error } = await client
    .from('learners')
    .select(COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    fail('listLearners', error);
    return [];
  }
  return (data ?? []) as Learner[];
}

export interface IssueResult {
  ok: boolean;
  /** Shown once, then unrecoverable — only its HMAC is stored. */
  code?: string;
  error?: string;
}

/**
 * Create a seat, or re-issue the code for an existing one.
 *
 * Re-issue rather than reject-on-duplicate because the realistic case is "they
 * lost the code", and the alternative — delete the row and add it again — loses
 * the record of when they joined. Re-issuing invalidates the old code, which is
 * also how you rotate a code someone forwarded to a colleague.
 */
export async function issueSeat(input: {
  email: string;
  name?: string;
  cohort?: string;
  note?: string;
}): Promise<IssueResult> {
  const client = db();
  if (!client) return { ok: false, error: 'Supabase is not configured.' };

  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'That is not an email address.' };

  const code = newCode();
  const { error } = await client.from('learners').upsert(
    {
      email,
      name: input.name?.trim() || null,
      cohort: input.cohort?.trim() || 'cohort-1',
      note: input.note?.trim() || null,
      code_hash: await hashCode(code),
      status: 'active',
    },
    // Matches the unique index on lower(email) — the upsert target has to be
    // the same thing the constraint is on, or Postgres rejects it.
    { onConflict: 'email' },
  );

  if (error) {
    fail('issueSeat', error);
    return { ok: false, error: error.message };
  }
  return { ok: true, code };
}

export async function setStatus(id: string, status: 'active' | 'revoked'): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('learners').update({ status }).eq('id', id);
  if (error) {
    fail('setStatus', error);
    return false;
  }
  return true;
}
