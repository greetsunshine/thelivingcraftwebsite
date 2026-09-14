// Every `data-tour` target in the walkthrough must exist in the markup.
//
// The failure this catches is silent and slow. A tour step points at
// `[data-tour="quiz-confidence"]`; somebody rewrites the quiz page and the
// attribute goes with the div it was on. Nothing errors. The step self-skips at
// runtime — which is the right behaviour and exactly why nobody notices — and
// the walkthrough quietly gets shorter every redesign until it explains nothing.
//
// So the contract is checked at review time instead: `npm run check:tour`.
//
// Deliberately a text scan rather than a build. The alternative is rendering
// seven gated routes with a database and a session, to assert on an attribute
// that is written literally in the source. This reads the source.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TOUR_FILE = path.join(ROOT, 'src/lib/craft/tour.ts');
const SRC = path.join(ROOT, 'src');

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

// --- what the script promises to explain -----------------------------------
const tourSource = fs.readFileSync(TOUR_FILE, 'utf8');
const targets = [...tourSource.matchAll(/^\s*target:\s*'([^']+)',/gm)].map((m) => m[1]);

if (targets.length === 0) {
  console.error(red('check:tour — no targets found in src/lib/craft/tour.ts. Has the shape changed?'));
  process.exit(1);
}

// --- what the markup actually declares -------------------------------------
// Two collections, because the two ways of writing the attribute carry
// different weight.
//
// A literal `data-tour="x"` IS a declaration: it can satisfy a step, and if no
// step points at it, it is dead weight worth mentioning.
//
// An expression `data-tour={cond ? 'x' : undefined}` may satisfy a step, but
// every other string inside those braces is part of the CONDITION, not a
// declaration — `m.kind === 'checkpoint'` is a comparison, not an attribute.
// So expression literals are allowed to satisfy targets and are never reported
// as unused, which is what stops this script inventing a finding out of an if.
const literal = new Map(); // value -> [files]
const expression = new Map(); // value -> [files]

// tour.ts is the source of the targets, and its comments quote example
// attributes. Scanning it would let a step satisfy itself.
const SKIP = new Set([TOUR_FILE]);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(astro|ts|tsx)$/.test(entry.name)) continue;
    if (SKIP.has(full)) continue;

    const text = fs.readFileSync(full, 'utf8');
    for (const m of text.matchAll(/data-tour=["']([a-z0-9-]+)["']/g)) add(literal, m[1], full);
    // The whole expression, then every string literal inside it.
    for (const m of text.matchAll(/data-tour=\{([^}]*)\}/g)) {
      for (const lit of m[1].matchAll(/'([a-z0-9-]+)'/g)) add(expression, lit[1], full);
    }
  }
}

function add(into, value, file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const at = into.get(value) ?? [];
  if (!at.includes(rel)) at.push(rel);
  into.set(value, at);
}

walk(SRC);

// --- compare ---------------------------------------------------------------
const where = (t) => literal.get(t) ?? expression.get(t) ?? null;
const missing = [...new Set(targets)].filter((t) => where(t) === null);

// The other direction is a warning, not a failure: an attribute nobody points at
// is dead weight, but shipping it breaks nothing. `tour-help` is the ⓘ itself —
// the overlay finds it by this attribute and no step ever points at it.
const unused = [...literal.keys()].filter(
  (d) => d !== 'tour-help' && !targets.includes(d),
);

for (const t of [...new Set(targets)].sort()) {
  const at = where(t);
  if (at) console.log(`${green('ok')}   ${t} ${dim(at.join(', '))}`);
}

if (unused.length > 0) {
  console.log('');
  for (const u of unused.sort()) {
    console.log(`${dim('warn')} ${u} — declared in markup, pointed at by no step`);
  }
}

if (missing.length > 0) {
  console.log('');
  for (const m of missing.sort()) {
    console.error(red(`fail ${m} — a tour step points here and no markup declares it`));
  }
  console.error(
    red(`\ncheck:tour — ${missing.length} of ${new Set(targets).size} targets are missing.`),
  );
  console.error(dim('Either restore the data-tour attribute, or remove the step from tour.ts.'));
  process.exit(1);
}

console.log(green(`\ncheck:tour — all ${new Set(targets).size} targets present.`));
