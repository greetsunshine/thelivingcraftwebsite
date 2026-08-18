// Promote this repo to Vercel production.
//
// WHY THIS EXISTS. The global guard at ~/.claude/hooks/guard-prod-ops.sh blocks a
// hand-run `vercel --prod` and steers to `pnpm promote`, because a hand-run
// deploy ships whatever is in the current directory with none of the checks
// below. That guard was written for the homeops-meal worktrees, which already
// had a promote; this repo did not, so the guard blocked the only deploy path
// there was. This is that missing command, with the same four gates the guard
// names.
//
// Every gate is a thing that has actually shipped broken somewhere: an untracked
// WIP tree, a branch that was not main, code whose migration had not been run,
// and a build that only failed in CI.
//
//   pnpm promote              run the gates, then deploy
//   pnpm promote --dry-run    run the gates, report, deploy NOTHING
//   pnpm promote --ack-db     assert the prod DB is migrated when this machine
//                             has no Supabase credentials to check it with

import { execSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const ackDb = args.has('--ack-db');

const sh = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const failures = [];
const notes = [];

const check = (label, fn) => {
  try {
    const detail = fn();
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ''}`);
  } catch (err) {
    console.log(`  ✗ ${label} — ${err.message}`);
    failures.push(label);
  }
};

console.log('\nPromote → production\n');

// 1. A deploy ships the working tree, not the commit. Anything uncommitted goes
//    out silently, which is the 2026-07-08 incident in one line.
check('Working tree is clean', () => {
  const dirty = sh('git status --porcelain');
  if (dirty) throw new Error(`${dirty.split('\n').length} uncommitted path(s)`);
  return 'nothing uncommitted';
});

// 2. Production comes from main. Deploying another branch to the prod domain is
//    almost always a mistake, and an invisible one afterwards.
check('On main', () => {
  const branch = sh('git rev-parse --abbrev-ref HEAD');
  if (branch !== 'main') throw new Error(`on "${branch}"`);
  return 'main';
});

// 3. In step with the remote, so what ships is what a reviewer can read.
check('In step with origin/main', () => {
  sh('git fetch origin main --quiet');
  const ahead = sh('git rev-list --count origin/main..HEAD');
  const behind = sh('git rev-list --count HEAD..origin/main');
  if (ahead !== '0' || behind !== '0') throw new Error(`${ahead} ahead, ${behind} behind`);
  return sh('git rev-parse --short HEAD');
});

// 4. The prod database has what the code expects. Supabase credentials are
//    marked sensitive in Vercel and cannot be read back, so a laptop usually
//    cannot check this — in that case the gate demands an explicit assertion
//    rather than quietly passing.
const REQUIRED_TABLES = ['events', 'leads', 'questions', 'learners', 'intake_responses', 'radar_findings', 'radar_runs'];
check('Prod DB has every table the code needs', () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (ackDb) {
      notes.push('DB not verified — passed on --ack-db. Confirm supabase/schema.sql has been run.');
      return 'asserted via --ack-db (NOT verified)';
    }
    throw new Error('no SUPABASE_URL/SERVICE_ROLE_KEY here; run supabase/schema.sql then re-run with --ack-db');
  }

  const missing = REQUIRED_TABLES.filter((table) => {
    const code = sh(
      `curl -s -o /dev/null -w '%{http_code}' '${url}/rest/v1/${table}?select=*&limit=0' ` +
        `-H 'apikey: ${key}' -H 'Authorization: Bearer ${key}'`,
    );
    return code !== '200';
  });
  if (missing.length) throw new Error(`missing: ${missing.join(', ')}`);
  return `${REQUIRED_TABLES.length} tables present`;
});

// 5. Build here, so a type error surfaces now rather than as a broken prod page.
check('Builds clean', () => {
  execSync('npm run build', { stdio: 'pipe' });
  return 'astro build ok';
});

if (failures.length) {
  console.error(`\n✗ ${failures.length} gate(s) failed. Nothing deployed.\n`);
  process.exit(1);
}

for (const note of notes) console.log(`\n  ! ${note}`);

if (dryRun) {
  console.log('\n✓ All gates passed. --dry-run, so nothing was deployed.\n');
  process.exit(0);
}

console.log('\nDeploying…\n');
// Remote build, matching how every previous production deploy on this project
// was made. The local build above is a GATE, not the shipped artifact — building
// on Vercel keeps the deploy using its own env vars, which is where the real
// SUPABASE/ANTHROPIC credentials live.
execSync('npx vercel --prod --yes', { stdio: 'inherit' });
console.log('\n✓ Promoted.\n');
