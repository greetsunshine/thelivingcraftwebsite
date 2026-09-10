// Create or update a console account.
//
//   npm run staff -- --email sunil@… --name "Sunil Mathew" --roles instructor,programme
//
// ───────────────────────────────────────────────────────────────────────────
// WHY A SCRIPT AND NOT A PAGE
// ───────────────────────────────────────────────────────────────────────────
//
// The obvious place to add a staff member is the administration screen. That
// screen needs `admin.staff`, which only a maintainer holds, and a maintainer
// account has to be created by something — so the console cannot bootstrap
// itself. This is the something.
//
// It also keeps the first account off the network. Creating an administrator by
// POSTing a password to a public endpoint means that endpoint exists forever
// afterwards, and it is the single most valuable thing on the site to find.
// Here the only way in is a shell with the service-role key already in it, and
// the blast radius of this script is exactly the blast radius of that key.
//
// ───────────────────────────────────────────────────────────────────────────
// THE PASSWORD IS NEVER AN ARGUMENT
// ───────────────────────────────────────────────────────────────────────────
//
// It is generated here and printed once. Three reasons, and the third is the
// one people forget:
//
//   * A password on the command line is in the shell history, and in `ps` for
//     every other user on the machine while the process runs.
//   * A generated one is long and random, which a chosen one is not.
//   * It is printed ONCE and never stored in plaintext anywhere. If it is lost,
//     the answer is to run this again and rotate it — which is the correct
//     answer, and is why there is no "show me the password" path.
//
// Pass --password only when you are moving an existing credential deliberately,
// and know that you are putting it in your shell history.

import { createClient } from '@supabase/supabase-js';

const ROLES = ['operator', 'instructor', 'finance', 'programme', 'maintainer'] as const;
type Role = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// Password hashing — must stay identical to src/lib/admin/staff.ts
// ---------------------------------------------------------------------------
// Deliberately duplicated rather than imported. This script runs under
// `node --experimental-strip-types`, whose module resolution has already broken
// both retriever sweeps once over a missing file extension, and the site's
// modules import `astro:` internals through their own dependency chains.
//
// The duplication is bounded and self-checking: the format string is
// self-describing, so a mismatch in iterations or salt length produces a hash
// the site simply fails to verify rather than one it verifies wrongly. If you
// change the cost in staff.ts, change it here, and the comment there says so.

const ITERATIONS = 210_000;
const KEY_BITS = 256;

const b64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64');

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_BITS,
  );
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

/**
 * A password meant to be pasted into a manager once and never typed.
 *
 * Base32-ish over an unambiguous alphabet so it survives being read aloud or
 * copied out of a terminal that has wrapped it.
 */
function generatePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const flag = `--${name}`;
  const i = process.argv.indexOf(flag);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1];
  }
  const inline = process.argv.find((a) => a.startsWith(`${flag}=`));
  return inline?.slice(flag.length + 1);
}

const usage = () => {
  console.log(`
Create or update a console account.

  npm run staff -- --email <address> --name "<name>" --roles <list>

  --email      required
  --name       required on create; optional on update
  --roles      comma-separated: ${ROLES.join(', ')}
  --password   optional. Omit it — one is generated and printed once.
  --deactivate revoke access without deleting the row (keeps the audit trail)

Roles, and what each may NOT do (src/lib/pipeline/roles.ts is the matrix):
  operator     works the pipeline. Cannot approve fit or offers, cannot confirm payment.
  instructor   technical fit, scope, offers, admission. Cannot confirm payment.
  finance      receipts, refunds, invoices. Cannot alter offer scope or attendance.
  programme    cohort availability, attendance, roster. Cannot infer payment from it.
  maintainer   configuration and integration health. No access to people or finance.

Somebody can hold more than one. Sunil is usually instructor,programme.
`);
};

async function main() {
  const email = arg('email')?.trim().toLowerCase();
  const name = arg('name')?.trim();
  const deactivate = process.argv.includes('--deactivate');

  if (!email || process.argv.includes('--help')) {
    usage();
    process.exit(email ? 0 : 1);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed. Put them in .env.local, or run against the deployment you mean to change — and check WHICH one that is before you do.',
    );
    process.exit(1);
  }

  const client = createClient(url, key, { auth: { persistSession: false } });

  if (deactivate) {
    const { error } = await client.from('staff').update({ active: false }).eq('email', email);
    if (error) {
      console.error(`Could not deactivate: ${error.message}`);
      process.exit(1);
    }
    // Deactivated, not deleted. Deleting the row would turn every action they
    // ever took into "unknown actor", which is worse evidence than the row
    // costs to keep. Note the session window below.
    console.log(`\n  ${email} is deactivated. The row and its audit trail stay.`);
    console.log(
      '  An already-signed-in session survives until it expires — at most 12 hours.\n',
    );
    return;
  }

  const roles = (arg('roles') ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter((r): r is Role => (ROLES as readonly string[]).includes(r));

  const unknown = (arg('roles') ?? '')
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r && !(ROLES as readonly string[]).includes(r));

  if (unknown.length) {
    // Refuse rather than silently dropping. A typo that grants fewer powers
    // than intended presents later as a permissions bug, and whoever debugs it
    // will not think to check this command's spelling.
    console.error(`Unknown role(s): ${unknown.join(', ')}. Valid: ${ROLES.join(', ')}`);
    process.exit(1);
  }

  if (!roles.length) {
    console.error('At least one --role is needed. An account with no roles can see nothing.');
    process.exit(1);
  }

  const password = arg('password') ?? generatePassword();
  const generated = !arg('password');
  const password_hash = await hashPassword(password);

  const { data: existing } = await client
    .from('staff')
    .select('staff_id, name')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    const { error } = await client
      .from('staff')
      .update({ name: name ?? existing.name, roles, password_hash, active: true })
      .eq('email', email);
    if (error) {
      console.error(`Could not update: ${error.message}`);
      process.exit(1);
    }
    console.log(`\n  Updated ${email} — roles: ${roles.join(', ')}`);
  } else {
    if (!name) {
      console.error('--name is needed to create an account.');
      process.exit(1);
    }
    const { error } = await client.from('staff').insert({ email, name, roles, password_hash });
    if (error) {
      console.error(`Could not create: ${error.message}`);
      process.exit(1);
    }
    console.log(`\n  Created ${name} <${email}> — roles: ${roles.join(', ')}`);
  }

  if (generated) {
    console.log(`\n  Password: ${password}`);
    console.log('\n  Shown once. It is stored only as a PBKDF2 hash, so it cannot be');
    console.log('  read back — if it is lost, run this again to set a new one.');
    console.log('  Send it over something that is not email, and have them sign in');
    console.log('  at /craft/admin/login with their address in the Email field.\n');
  }

  console.log(
    '  Once real accounts exist, unset ADMIN_PASSWORD to close the shared-password\n' +
      '  bootstrap. Until then anyone holding it signs in with the roles in\n' +
      '  ADMIN_BOOTSTRAP_ROLES (default: operator).\n',
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
