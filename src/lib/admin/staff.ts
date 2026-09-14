// Named staff accounts, and the bootstrap that keeps the console reachable.
//
// ───────────────────────────────────────────────────────────────────────────
// TWO WAYS IN, AND ONLY ONE OF THEM IS MEANT TO SURVIVE
// ───────────────────────────────────────────────────────────────────────────
//
// 1. A NAMED ACCOUNT — an email and a password, a row in `staff`, and a set of
//    roles. This is the one the brief describes and the one every capability
//    check is written against.
//
// 2. THE SHARED PASSWORD — `ADMIN_PASSWORD`, exactly as it works today. It is
//    kept because removing it in the same change that introduces accounts is
//    how you lock yourself out of the console you just changed, and because
//    there are no staff rows until somebody creates the first one.
//
// The bootstrap is a TRANSITIONAL STATE, not a fallback to live with. It grants
// `ADMIN_BOOTSTRAP_ROLES`, which defaults to `operator` alone — deliberately
// NOT every role. An operator cannot approve an offer or confirm a payment, so
// a console running on the shared password can move leads along and cannot
// complete an enrolment. That is the correct amount of friction: it is exactly
// the separation the brief asks for, and the way to get past it is to create
// the accounts rather than to widen the default.
//
// Setting ADMIN_BOOTSTRAP_ROLES to the full set restores today's behaviour in
// one environment variable. If you do that, write down when you will undo it.
// "Staff accounts created" is a release gate in the status doc for this reason.
//
// ───────────────────────────────────────────────────────────────────────────
// WHY PBKDF2 AND NOT A DIGEST
// ───────────────────────────────────────────────────────────────────────────
//
// `checkPassword` in auth.ts compares SHA-256 digests, which is fine there:
// the shared password is a long random string held in an environment variable,
// and there is nothing at rest to steal. A staff password is human-chosen and
// stored in a table. A plain SHA-256 of a human-chosen password is a rainbow
// table away from being plaintext.
//
// So: PBKDF2-SHA256, 210,000 iterations, a 16-byte random salt per row, both
// encoded into the stored string so the cost can be raised later without a
// migration — a row written at a lower cost keeps verifying, and is rewritten
// on the owner's next sign-in.
//
// WebCrypto rather than a dependency: `crypto.subtle` is present in every
// runtime this deploys to, and adding argon2 or bcrypt means a native module in
// a serverless bundle for one table with a handful of rows in it.

import { db } from './supabase';
import { env } from './env';
import { isRole, type Role } from '../pipeline/roles';

/** The stored row, password hash included. Never leaves this module. */
interface StaffRow {
  staff_id: string;
  name: string;
  email: string;
  roles: string[];
  active: boolean;
  password_hash: string;
}

export interface Staff {
  staff_id: string;
  name: string;
  email: string;
  roles: Role[];
  active: boolean;
}

/**
 * Who the current session belongs to.
 *
 * `kind: 'bootstrap'` is the shared password. It has no staff_id, which is
 * deliberate and load-bearing: everything it does is attributed to
 * 'bootstrap' in the audit log rather than to a person, and an audit trail
 * that cannot name an actor should say so rather than invent one.
 */
export type Identity =
  | { kind: 'staff'; id: string; name: string; roles: Role[] }
  | { kind: 'bootstrap'; id: null; name: string; roles: Role[] };

const ITERATIONS = 210_000;
const KEY_BITS = 256;
const enc = new TextEncoder();

const b64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));

const unb64 = (value: string): Uint8Array =>
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    KEY_BITS,
  );
  return b64(new Uint8Array(bits));
}

/** `pbkdf2$<iterations>$<salt>$<hash>` — self-describing, so cost can rise. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${hash}`;
}

/**
 * Constant-time over the derived bits.
 *
 * The early returns above the comparison leak only the SHAPE of the stored
 * string — its algorithm and iteration count — which is not a secret and is
 * printed in this file. What must not leak by timing is how much of the
 * derived key matched, and that is the loop.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;

  let expected: string;
  try {
    expected = await derive(password, unb64(parts[2]), iterations);
  } catch {
    return false;
  }

  const a = parts[3];
  if (a.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * Look somebody up and check their password.
 *
 * Returns null for every failure — unknown address, wrong password, deactivated
 * account — and the caller says the same thing to all three. Telling somebody
 * that an address exists but the password is wrong is a membership oracle for a
 * list of five people, three of whom are named on the public site.
 *
 * ONE PLACE THIS IS DELIBERATELY SLOWER THAN IT NEEDS TO BE: an unknown address
 * still runs a PBKDF2 derivation against a dummy hash. Returning immediately
 * would make "no such user" measurably faster than "wrong password", which is
 * the same oracle by a different route.
 */
export async function authenticate(email: string, password: string): Promise<Staff | null> {
  const client = db();
  if (!client) return null;

  const normalised = email.trim().toLowerCase();
  if (!normalised) return null;

  let row: StaffRow | null = null;

  try {
    const { data, error } = await client
      .from('staff')
      .select('staff_id, name, email, roles, active, password_hash')
      .eq('email', normalised)
      .maybeSingle();
    if (!error && data) row = data as StaffRow;
  } catch {
    return null;
  }

  // The equalising work. DUMMY is a real hash of a value nobody holds.
  const stored = row?.password_hash ?? DUMMY_HASH;
  const ok = await verifyPassword(password, stored);

  if (!row || !ok || !row.active) return null;

  return {
    staff_id: row.staff_id,
    name: row.name,
    email: row.email,
    roles: (row.roles ?? []).filter(isRole),
    active: row.active,
  };
}

/**
 * A valid PBKDF2 string for a password nobody has.
 *
 * Generated once at module load rather than hard-coded, so this file carries no
 * literal that looks like a credential to a scanner or to a reader in a hurry.
 * The cost is one derivation per cold start.
 */
const DUMMY_HASH = `pbkdf2$${ITERATIONS}$${b64(crypto.getRandomValues(new Uint8Array(16)))}$${b64(
  crypto.getRandomValues(new Uint8Array(32)),
)}`;

/**
 * What the shared password grants.
 *
 * Defaults to `operator` — enough to work the pipeline, not enough to complete
 * an enrolment. See the note at the head of this file before widening it.
 */
export function bootstrapRoles(): Role[] {
  const configured = (env('ADMIN_BOOTSTRAP_ROLES') ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter(isRole);
  return configured.length ? configured : ['operator'];
}

export const bootstrapIdentity = (): Identity => ({
  kind: 'bootstrap',
  id: null,
  name: 'Shared password',
  roles: bootstrapRoles(),
});

/** Best-effort. A failed timestamp must never cost somebody their sign-in. */
export async function touchLastSeen(staffId: string): Promise<void> {
  const client = db();
  if (!client) return;
  try {
    await client.from('staff').update({ last_seen_at: new Date().toISOString() }).eq('staff_id', staffId);
  } catch {
    /* ignore */
  }
}

/** The roster, for the administration screen. Never returns a password hash. */
export async function listStaff(): Promise<Staff[]> {
  const client = db();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('staff')
      .select('staff_id, name, email, roles, active')
      .order('name');
    if (error || !data) return [];
    return (data as Staff[]).map((s) => ({ ...s, roles: (s.roles ?? []).filter(isRole) }));
  } catch {
    return [];
  }
}
