/**
 * Tests for the Rework Cost Check.
 *
 * Run with `npm test`. Node's own test runner, no framework — the repo has no
 * test dependency and this file is not a reason to add one.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE IS WORTH HAVING
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The failure this catches is silent. A typical cost per task that is wrong by
 * a factor of two renders as a tidy number in the right font, and a reader
 * takes it into a budget meeting. Nothing else on the page would raise.
 *
 * EVERY EXPECTED VALUE BELOW IS FROM THE BRIEF, section 6, not from running
 * the code and writing down what it said. That direction matters: a test
 * written from the output only proves the code has not changed, which is not
 * the same as proving it is right.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  blankModel,
  blankPath,
  read,
  roundCost,
  STATUS_MEANING,
  tokens,
  percent,
  multipleOf,
  money,
  type ReworkModel,
  type ReworkPath,
} from './reworkCost.ts';

// ---------------------------------------------------------------------------
// The scheduling agent from section 6. Illustrative, not a real system.
// ---------------------------------------------------------------------------

function example(): ReworkModel {
  const m = blankModel();
  m.cleanRun = 43_300;
  m.alwaysOnChecks = 11_500;
  m.peakTasksPerMinute = 200;
  m.quotaPerMinute = 10_000_000;
  m.budget = 120_000;
  m.enforcement = 'Per task, across all rounds';
  m.pricePerMillion = null;

  const set = (kind: 'transport' | 'judge', patch: Partial<ReworkPath>) => {
    const i = m.paths.findIndex((p) => p.kind === kind);
    m.paths[i] = { ...blankPath(kind), ...patch, kind };
  };

  set('transport', {
    present: true,
    averageRounds: 0,
    repeated: 16_700,
    review: 0,
    growth: 0,
    maxRounds: 3,
    afterLast: 'Fails and tells the user',
    owner: 'Platform team',
  });
  set('judge', {
    present: true,
    averageRounds: 2,
    repeated: 8_900,
    review: 11_500,
    growth: 1_500,
    maxRounds: 3,
    afterLast: 'Hands to a human',
    owner: 'Platform team',
  });
  return m;
}

const pathOf = (m: ReworkModel, kind: string) => m.paths.find((p) => p.kind === kind)!;
const checkOf = (m: ReworkModel, n: number) => read(m).checks.find((c) => c.n === n)!;

// ---------------------------------------------------------------------------
// Round cost
// ---------------------------------------------------------------------------

test('round cost is repeated + review + growth', () => {
  const m = example();
  assert.equal(roundCost(pathOf(m, 'judge')), 21_900); // 8,900 + 11,500 + 1,500
  assert.equal(roundCost(pathOf(m, 'transport')), 16_700); // 16,700 + 0 + 0
});

// ---------------------------------------------------------------------------
// The two headline numbers
// ---------------------------------------------------------------------------

test('typical cost per task is 98,600, which is 2.28x a clean run', () => {
  const r = read(example());
  // 43,300 + 11,500 + (0 x 16,700) + (2 x 21,900)
  assert.equal(r.typical, 98_600);
  assert.equal(multipleOf(r.typicalMultiple), '2.28×');
});

test('typical demand at peak is 19,720,000, or 197.2% of quota', () => {
  const r = read(example());
  assert.equal(r.typicalPeak, 19_720_000); // 200 x 98,600
  assert.equal(percent(r.typicalShare), '197.2%');
});

test('worst case per task is 170,600, which is 3.94x a clean run', () => {
  const r = read(example());
  // 43,300 + 11,500 + (3 x 21,900) + (3 x 16,700)
  assert.equal(r.worst, 170_600);
  assert.equal(multipleOf(r.worstMultiple), '3.94×');
});

test('worst case at peak is 34,120,000, or 341.2% of quota', () => {
  const r = read(example());
  assert.equal(r.worstPeak, 34_120_000); // 200 x 170,600
  assert.equal(percent(r.worstShare), '341.2%');
});

// ---------------------------------------------------------------------------
// The five checks on the example
// ---------------------------------------------------------------------------

test('a check title says what it checks, not what it is about', () => {
  // Check 3 used to read "Rounds are capped, and something happens after the
  // last one", which does not say what the check tests.
  const titles = read(example()).checks.map((c) => c.title);
  assert.equal(titles[2], 'Every loop has a limit, a decided outcome, and an owner');
  assert.equal(titles[4], 'One token budget for the whole task, not one per call');
  for (const t of titles) assert.ok(!/something happens/.test(t), `vague title: ${t}`);
});

test('the example passes checks 1, 2, 3 and 5 and fails check 4', () => {
  const m = example();
  assert.equal(checkOf(m, 1).status, 'Pass');
  // Transport growth of 0 is expected and must not raise Attention; the judge
  // path carries growth, so nothing is flagged.
  assert.equal(checkOf(m, 2).status, 'Pass');
  assert.equal(checkOf(m, 3).status, 'Pass');
  assert.equal(checkOf(m, 4).status, 'Fail');
  assert.equal(checkOf(m, 4).reason, 'Your normal load already exceeds the quota.');
  // 98,600 <= 120,000 < 170,600
  assert.equal(checkOf(m, 5).status, 'Pass');
});

test('the next step points at check 4', () => {
  const r = read(example());
  assert.equal(r.nextStep?.n, 4);
});

// ---------------------------------------------------------------------------
// The money line
// ---------------------------------------------------------------------------

test('at a price of 3 per million, a task costs 0.30 and a thousand cost 295.80', () => {
  const m = example();
  m.pricePerMillion = 3;
  const r = read(m);
  assert.equal(r.costPerTask, 0.2958); // 98,600 x 3 / 1,000,000
  assert.equal(money(r.costPerTask), '0.30');
  assert.equal(money(r.costPerThousand), '295.80');
});

test('no price means no money line, rather than a zero', () => {
  const r = read(example());
  assert.equal(r.costPerTask, null);
  assert.equal(r.costPerThousand, null);
  assert.equal(money(r.costPerTask), '—');
});

// ---------------------------------------------------------------------------
// Unbounded
// ---------------------------------------------------------------------------

test('clearing the judge cap makes the worst case unbounded, and fails checks 3 and 4', () => {
  const m = example();
  pathOf(m, 'judge').maxRounds = null;
  const r = read(m);
  assert.equal(r.unbounded, true);
  // Unbounded is not a number. Every worst-case figure goes null with it.
  assert.equal(r.worst, null);
  assert.equal(r.worstPeak, null);
  assert.equal(r.worstShare, null);
  assert.equal(checkOf(m, 3).status, 'Fail');
  assert.equal(checkOf(m, 4).status, 'Fail');
  // The typical cost is unaffected: an uncapped loop still has a normal rate.
  assert.equal(r.typical, 98_600);
});

test('an uncapped path that is not present does not make anything unbounded', () => {
  const m = example();
  pathOf(m, 'human').maxRounds = null; // present is false
  assert.equal(read(m).unbounded, false);
});

// ---------------------------------------------------------------------------
// A blank is unknown, not zero
// ---------------------------------------------------------------------------

test('a blank model asserts nothing and raises no error', () => {
  const r = read(blankModel());
  assert.equal(r.typical, null);
  assert.equal(r.worst, null);
  assert.equal(r.typicalPeak, null);
  assert.equal(r.unbounded, false);
  assert.equal(tokens(r.typical), '—');
  assert.equal(percent(r.typicalShare), '—');
  assert.equal(multipleOf(r.typicalMultiple), '—');
  for (const n of [1, 2, 3]) assert.equal(checkOf(blankModel(), n).status, 'Not answered');
});

test('a missing average rounds leaves the typical cost unknown rather than low', () => {
  const m = example();
  pathOf(m, 'judge').averageRounds = null;
  assert.equal(read(m).typical, null);
  assert.equal(checkOf(m, 1).status, 'Fail');
});

test('a missing growth leaves the round uncosted rather than cheap', () => {
  const m = example();
  pathOf(m, 'judge').growth = null;
  assert.equal(roundCost(pathOf(m, 'judge')), null);
  assert.equal(read(m).typical, null);
  assert.equal(checkOf(m, 2).status, 'Fail');
});

// ---------------------------------------------------------------------------
// Check-by-check behaviour the brief specifies
// ---------------------------------------------------------------------------

test('check 2 raises Attention when a judge path has no context growth', () => {
  const m = example();
  pathOf(m, 'judge').growth = 0;
  const c = checkOf(m, 2);
  assert.equal(c.status, 'Attention');
  assert.match(c.reason, /Redos usually carry more context/);
});

test('check 3 raises Attention when a capped path has no owner', () => {
  const m = example();
  pathOf(m, 'judge').owner = '';
  assert.equal(checkOf(m, 3).status, 'Attention');
});

test('check 3 fails when the outcome after the last round is Not decided', () => {
  const m = example();
  pathOf(m, 'judge').afterLast = 'Not decided';
  assert.equal(checkOf(m, 3).status, 'Fail');
});

test('check 4 passes only when normal is within 80% and the worst case fits', () => {
  const m = example();
  m.quotaPerMinute = 200_000_000; // typical 9.9%, worst 17.1%
  assert.equal(checkOf(m, 4).status, 'Pass');
});

test('check 4 raises Attention when normal has headroom but the worst case does not', () => {
  const m = example();
  m.quotaPerMinute = 40_000_000; // typical 49.3%, worst 85.3%... still fits
  assert.equal(checkOf(m, 4).status, 'Pass');
  m.quotaPerMinute = 25_000_000; // typical 78.9%, worst 136.5%
  assert.equal(checkOf(m, 4).status, 'Attention');
});

test('check 5 fails a per-call budget, because the task is what costs money', () => {
  const m = example();
  m.enforcement = 'Per call only';
  assert.equal(checkOf(m, 5).status, 'Fail');
});

test('check 5 fails a budget below the typical cost, and quotes both figures', () => {
  const m = example();
  m.budget = 50_000; // below 98,600
  const c = checkOf(m, 5);
  assert.equal(c.status, 'Fail');
  // The reader should not have to go and find the numbers being compared.
  assert.match(c.reason, /50,000/);
  assert.match(c.reason, /98,600/);
  assert.match(c.reason, /cut ordinary work short/);
});

test('check 5 raises Attention when the budget is above the worst case', () => {
  const m = example();
  m.budget = 500_000; // above 170,600, so it never binds
  const c = checkOf(m, 5);
  assert.equal(c.status, 'Attention');
  assert.match(c.reason, /500,000/);
  assert.match(c.reason, /170,600/);
  assert.match(c.reason, /never comes into play/);
});

// ---------------------------------------------------------------------------
// Every Attention and every Fail says what to do
// ---------------------------------------------------------------------------
//
// The reason says where you stand; the action says what to change. A check
// that reports a problem and no move is the thing this whole section exists
// to avoid.

test('a Pass carries no action, because there is nothing to do', () => {
  const m = example();
  for (const c of read(m).checks) {
    if (c.status === 'Pass') assert.equal(c.action, '', `check ${c.n} should have no action`);
  }
});

test('every Attention and every Fail carries an action', () => {
  // A spread of models, chosen so that between them every branch that can
  // report a problem does report one.
  const models: ReworkModel[] = [];

  const budgetTooLow = example();
  budgetTooLow.budget = 50_000;
  models.push(budgetTooLow);

  const budgetNeverBinds = example();
  budgetNeverBinds.budget = 500_000;
  models.push(budgetNeverBinds);

  const perCall = example();
  perCall.enforcement = 'Per call only';
  models.push(perCall);

  const uncapped = example();
  pathOf(uncapped, 'judge').maxRounds = null;
  models.push(uncapped);

  const undecided = example();
  pathOf(undecided, 'judge').afterLast = 'Not decided';
  models.push(undecided);

  const unowned = example();
  pathOf(unowned, 'judge').owner = '';
  models.push(unowned);

  const noGrowth = example();
  pathOf(noGrowth, 'judge').growth = 0;
  models.push(noGrowth);

  const noAvg = example();
  pathOf(noAvg, 'judge').averageRounds = null;
  models.push(noAvg);

  const noCost = example();
  pathOf(noCost, 'judge').review = null;
  models.push(noCost);

  const tightQuota = example();
  tightQuota.quotaPerMinute = 25_000_000;
  models.push(tightQuota);

  const roomyQuota = example();
  roomyQuota.quotaPerMinute = 200_000_000;
  models.push(roomyQuota);

  const seen = new Set<string>();
  for (const m of models) {
    for (const c of read(m).checks) {
      if (c.status === 'Attention' || c.status === 'Fail') {
        assert.notEqual(c.action, '', `check ${c.n} is ${c.status} with no action`);
        seen.add(`${c.n}:${c.status}`);
      }
    }
  }
  // Every check must have been exercised in at least one failing state, or the
  // assertion above proves less than it looks like it does.
  for (const n of [1, 2, 3, 4, 5]) {
    assert.ok(
      [...seen].some((k) => k.startsWith(`${n}:`)),
      `check ${n} was never seen as Attention or Fail`,
    );
  }
});

test('the next step hands over the action, and it is the first Fail', () => {
  const r = read(example());
  assert.equal(r.nextStep?.n, 4);
  assert.match(r.nextStep!.action, /Cut what a round costs/);
});

test('the status legend covers all four words', () => {
  assert.deepEqual(
    STATUS_MEANING.map((s) => s.status),
    ['Pass', 'Attention', 'Fail', 'Not answered'],
  );
});

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

test('numbers are grouped in thousands, never in lakhs', () => {
  assert.equal(tokens(10_000_000), '10,000,000');
  assert.equal(tokens(34_120_000), '34,120,000');
});

test('percentages carry one decimal place', () => {
  assert.equal(percent(1.972), '197.2%');
  assert.equal(percent(0.8), '80.0%');
});
