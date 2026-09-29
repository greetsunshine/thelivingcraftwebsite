// npm run check:pages — is what the site serves still what the generator makes?
//
// WHY THIS EXISTS. docs/teaching/pages/week-N-*.html is what /craft/week-N/topic-M
// and /craft/admin/preview/N actually serve. For a week with a content module
// that file is a BUILD PRODUCT that happens to be committed, and a build product
// in git goes stale the first time somebody edits the source and forgets the
// two copy commands. Nothing about a stale page looks wrong: it renders, it is
// well-formed, check:teaching passes on it, and it quietly serves last week's
// wording to the room.
//
// So the stored file is regenerated here and compared byte for byte.
//
// A WEEK WITH NO MODULE IS NOT A FAILURE. Week 2's pages were hand-built and
// published as Artifacts before the generator existed, so its stored HTML is the
// source rather than a copy of one. There is nothing to compare it against, and
// saying so is more useful than being silent about it.
//
//   node scripts/check-stored-pages.mjs
//
// Exits non-zero when a stored page and its module disagree, so CI can gate it.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const CONTENT = 'scripts/teaching-content';
const STORED = 'docs/teaching/pages';
const AUDIENCES = ['learner', 'instructor'];

/** Weeks with a content module. `_design` and `week-1-figures` are not weeks. */
const modules = existsSync(CONTENT)
  ? readdirSync(CONTENT)
      .map((f) => /^week-(\d+)\.mjs$/.exec(f)?.[1])
      .filter(Boolean)
      .map(Number)
      .sort((a, b) => a - b)
  : [];

/** Weeks with a stored page, whether or not they have a module. */
const stored = existsSync(STORED)
  ? [...new Set(
      readdirSync(STORED)
        .map((f) => /^week-(\d+)-(?:learner|instructor)\.html$/.exec(f)?.[1])
        .filter(Boolean)
        .map(Number),
    )].sort((a, b) => a - b)
  : [];

let failed = 0;

for (const week of modules) {
  // The generator writes into dist-teaching, which .gitignore excludes, so this
  // overwrites a build product and nothing a person is holding on to.
  try {
    execFileSync('node', ['scripts/build-teaching-pages.mjs', String(week)], { stdio: 'pipe' });
  } catch (e) {
    console.log(`  FAIL   week ${week} — the generator threw`);
    console.log(`         ${String(e.stderr ?? e).trim().split('\n').slice(-3).join('\n         ')}`);
    failed += 1;
    continue;
  }

  for (const audience of AUDIENCES) {
    const built = `dist-teaching/week-${week}-${audience}.html`;
    const live = `${STORED}/week-${week}-${audience}.html`;

    if (!existsSync(live)) {
      console.log(`  FAIL   week ${week} ${audience} — a module exists and nothing is stored`);
      console.log(`         cp ${built} ${live}`);
      failed += 1;
      continue;
    }
    if (readFileSync(built, 'utf8') !== readFileSync(live, 'utf8')) {
      console.log(`  FAIL   week ${week} ${audience} — the stored page is not what the module builds`);
      console.log(`         cp ${built} ${live}`);
      failed += 1;
      continue;
    }
    console.log(`  PASS   week ${week} ${audience} — stored page matches the module`);
  }
}

for (const week of stored.filter((w) => !modules.includes(w))) {
  console.log(`  ----   week ${week} — stored pages, no content module. Nothing to compare; the HTML is the source.`);
}

if (!modules.length && !stored.length) {
  console.log('  ----   no content modules and no stored pages. Nothing to check.');
}

console.log(
  failed === 0
    ? '\ncheck:pages — every stored page matches the module that builds it.'
    : `\ncheck:pages — ${failed} stored page(s) out of date. Rebuild and copy, then commit.`,
);
process.exit(failed === 0 ? 0 : 1);
