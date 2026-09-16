/**
 * Tests for the Cost-Ceiling Workbook calculation.
 *
 * Run with `npm test`. Node's own test runner, no framework — the repo has no
 * test dependency and this file is not a reason to add one.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE IS WORTH HAVING
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Everything else that breaks on this page breaks loudly: a type error stops
 * the build, a bad import 500s the route. The failure this catches is silent. A
 * cost per attempt that is wrong by a factor of ten renders as a tidy number in
 * the right font, and a reader takes it into a budget meeting.
 *
 * The expected values below come from the specification, not from running the
 * code and writing down what it said. That direction matters: a test written
 * from the output tests that the code does not change, which is not the same as
 * testing that the code is right.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CEILING,
  NORMAL,
  STOPPING,
  STORM,
  computeAttempt,
  computePeriod,
  computeScenario,
  computeWorkbook,
  exampleValues,
  money,
  multiplier,
  outputs,
  percent,
  priceById,
  pricesFor,
  resolvePrices,
  tokens,
} from './costCeiling.ts';

/** The tolerance the specification names. */
const TOL = 0.001;

const near = (actual: number | null | 'undefined', expected: number, what: string) => {
  assert.equal(typeof actual, 'number', `${what}: expected a number, got ${String(actual)}`);
  assert.ok(
    Math.abs((actual as number) - expected) <= TOL,
    `${what}: expected ${expected}, got ${actual}`,
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// View 1 — one attempt
// ═══════════════════════════════════════════════════════════════════════════

test('attempt · normal day · default inputs', () => {
  const r = computeAttempt(NORMAL.attempt);

  near(r.totalInput, 76_500, 'totalInput');
  near(r.cacheRead, 32_400, 'cacheRead');
  near(r.cacheWrite, 3_600, 'cacheWrite');
  near(r.uncachedInput, 40_500, 'uncachedInput');
  near(r.outputTokens, 6_000, 'outputTokens');
  near(r.finalTurnInput, 16_500, 'finalTurnInput');
  near(r.finalVsFirst, 1.8333, 'finalVsFirst');
  near(r.modelCost, 0.15648, 'modelCost');
  near(r.costPerAttempt, 0.16648, 'costPerAttempt');
});

test('attempt · storm night · default inputs', () => {
  const r = computeAttempt(STORM.attempt);

  near(r.totalInput, 114_000, 'totalInput');
  near(r.cacheRead, 43_200, 'cacheRead');
  near(r.cacheWrite, 4_800, 'cacheWrite');
  near(r.uncachedInput, 66_000, 'uncachedInput');
  near(r.outputTokens, 8_000, 'outputTokens');
  near(r.finalTurnInput, 19_500, 'finalTurnInput');
  near(r.finalVsFirst, 2.1667, 'finalVsFirst');
  near(r.modelCost, 0.23264, 'modelCost');
  near(r.costPerAttempt, 0.24464, 'costPerAttempt');
});

test('attempt · input grows with the SQUARE of the turn count', () => {
  // The claim the page makes in words, checked as arithmetic. Doubling turns
  // from 6 to 12 must more than double total input, not exactly double it.
  const six = computeAttempt({ ...NORMAL.attempt, turns: 6 });
  const twelve = computeAttempt({ ...NORMAL.attempt, turns: 12 });

  assert.ok(
    twelve.totalInput > six.totalInput * 2,
    `expected superlinear growth, got ${twelve.totalInput} vs ${six.totalInput * 2}`,
  );
  // 12*(9000) + 1500*12*11/2 = 108000 + 99000 = 207000
  near(twelve.totalInput, 207_000, 'totalInput at 12 turns');
});

test('attempt · reasoning share is reasoning over all output tokens', () => {
  const r = computeAttempt(NORMAL.attempt);
  near(r.reasoningShare, 0.6, 'reasoningShare');
});

test('attempt · output share is measured before the batch discount', () => {
  const plain = computeAttempt(NORMAL.attempt);
  const batched = computeAttempt({ ...NORMAL.attempt, useBatch: true });
  // Batch scales all four lines equally, so the share cannot move.
  near(batched.outputShare, plain.outputShare as number, 'outputShare under batch');
  // 0.06 of 0.15648
  near(plain.outputShare, 0.06 / 0.15648, 'outputShare');
});

// ═══════════════════════════════════════════════════════════════════════════
// View 2 — one period
// ═══════════════════════════════════════════════════════════════════════════

test('period · normal day · default inputs', () => {
  const { period } = computeScenario(NORMAL);

  near(period.attempts, 2_600, 'attempts');
  near(period.agentCost, 432.848, 'agentCost');
  near(period.bgCost, 12, 'bgCost');
  near(period.reviewCost, 480, 'reviewCost');
  near(period.total, 984.848, 'total');
  near(period.accepted, 1_840, 'accepted');
  near(period.costPerCase, 0.216424, 'costPerCase');
  near(period.costPerAccepted, 0.535243, 'costPerAccepted');
});

test('period · storm night · default inputs', () => {
  const { period } = computeScenario(STORM);

  near(period.attempts, 117_800, 'attempts');
  near(period.agentCost, 28_818.592, 'agentCost');
  near(period.bgCost, 27, 'bgCost');
  near(period.reviewCost, 22_800, 'reviewCost');
  near(period.total, 51_685.592, 'total');
  near(period.accepted, 30_400, 'accepted');
  near(period.costPerCase, 0.758384, 'costPerCase');
  near(period.costPerAccepted, 1.700184, 'costPerAccepted');
});

test('period · the storm costs 3.5x per case', () => {
  const w = computeWorkbook(exampleValues());
  near(w.stormVsNormal, 3.5042, 'stormVsNormal');
});

test('period · background jobs are priced on the scenario model, batch honoured', () => {
  // Normal runs 24 batched jobs on Sonnet 5: 24 * (400000*2 + 20000*10)/1e6 * 0.5
  const { period } = computeScenario(NORMAL);
  near(period.bgCost, 12, 'batched bgCost');

  const unbatched = computeScenario({
    ...NORMAL,
    period: { ...NORMAL.period, bgUseBatch: false },
  });
  near(unbatched.period.bgCost, 24, 'unbatched bgCost is double');
});

test('period · fxRate converts the total and nothing else', () => {
  const { period } = computeScenario({
    ...NORMAL,
    period: { ...NORMAL.period, fxRate: 88, fxBasis: 'INR per USD' },
  });
  near(period.total, 984.848, 'total stays in USD');
  near(period.totalReporting, 984.848 * 88, 'totalReporting is converted');
});

// ═══════════════════════════════════════════════════════════════════════════
// View 3 — the shared ceiling
// ═══════════════════════════════════════════════════════════════════════════

test('ceiling · default inputs, against the storm', () => {
  const w = computeWorkbook(exampleValues());

  assert.equal(w.ceiling.completed, 35_074, 'completed');
  assert.equal(w.ceiling.stranded, 2_926, 'stranded');
  near(w.ceiling.checkThenActOver, 240, 'checkThenActOver');
  near(w.ceiling.overShare, 0.009023, 'overShare');
  near(w.ceiling.lockedHeadroom, 93.216, 'lockedHeadroom');
  near(w.ceiling.spendPerMinute, 80.0516, 'spendPerMinute');
  // The specification's table prints this to two decimals as 4,803.10. The
  // exact value is 4803.098666…, which is 0.0013 away and so outside the
  // ±0.001 tolerance. The arithmetic is right and the printed figure is
  // rounded, so the assertion carries the precision the table could not.
  near(w.ceiling.unseenSpend, 4_803.098667, 'unseenSpend');
});

test('ceiling · an atomic reservation overshoots by nothing', () => {
  const w = computeWorkbook(exampleValues());
  assert.equal(w.ceiling.reserveOver, 0, 'reserveOver');
  // And the contrast is the whole point of showing both.
  assert.ok(w.ceiling.checkThenActOver > w.ceiling.reserveOver);
});

test('ceiling · headroom locked by a claim never goes negative', () => {
  // An attempt that costs MORE than the cap cannot lock negative headroom;
  // it is simply stopped. Without the max(0, …) this reads as a refund.
  const w = computeWorkbook({ ...exampleValues(), ceiling: { ...CEILING, capPerAttempt: 0.1 } });
  assert.equal(w.ceiling.lockedHeadroom, 0, 'lockedHeadroom');
});

// ═══════════════════════════════════════════════════════════════════════════
// View 4 — what stopping costs
// ═══════════════════════════════════════════════════════════════════════════

test('stopping · default inputs', () => {
  const w = computeWorkbook(exampleValues());

  // Same rounding note as `unseenSpend` above: the table prints 2,219.03 and
  // 158.23 to two decimals, and both sit just outside ±0.001 of the exact
  // value. 2,926 stranded cases x $0.758384 is 2219.031584 exactly.
  near(w.stopping.tokenCostAvoided, 2_219.031584, 'tokenCostAvoided');
  near(w.stopping.optionA_continue, 2_219.031584, 'optionA_continue');
  near(w.stopping.optionB_freeze, 351_120, 'optionB_freeze');
  near(w.stopping.optionC_route, 122_892, 'optionC_route');
  assert.equal(w.stopping.lowest, 'A', 'lowest');
  near(w.stopping.freezePerDollar, 158.231186, 'freezePerDollar');
  near(w.stopping.breakEven, 0.758384, 'breakEven');
});

test('stopping · a cheap frozen case makes freezing the lowest option', () => {
  const w = computeWorkbook({
    ...exampleValues(),
    stopping: { ...STOPPING, businessCostPerFrozenCase: 0.1 },
  });
  assert.equal(w.stopping.lowest, 'B', 'lowest');
});

test('stopping · routing wins when people are cheap and the freeze is dear', () => {
  const w = computeWorkbook({
    ...exampleValues(),
    stopping: {
      ...STOPPING,
      businessCostPerFrozenCase: 5,
      humanMinutesPerCase: 1,
      humanHourlyCost: 1,
      humanResolvedShare: 1,
    },
  });
  // A: 2219.03 · B: 14630 · C: 2926*1*1/60 = 48.77
  assert.equal(w.stopping.lowest, 'C', 'lowest');
});

test('stopping · a tie resolves A, then B, then C', () => {
  // Make every option cost nothing. A must win.
  const w = computeWorkbook({
    ...exampleValues(),
    stopping: {
      businessCostPerFrozenCase: 0,
      shareIncurringCost: 0,
      humanMinutesPerCase: 0,
      humanHourlyCost: 0,
      humanResolvedShare: 1,
    },
    ceiling: { ...CEILING, ceiling: 1e12 },
  });
  assert.equal(w.stopping.optionA_continue, 0);
  assert.equal(w.stopping.optionB_freeze, 0);
  assert.equal(w.stopping.optionC_route, 0);
  assert.equal(w.stopping.lowest, 'A', 'lowest on a three-way tie');
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge cases — the ones named in the specification
// ═══════════════════════════════════════════════════════════════════════════

test('edge · accepted = 0 returns the string "undefined"', () => {
  const { period } = computeScenario({
    ...NORMAL,
    period: { ...NORMAL.period, acceptedShare: 0 },
  });
  assert.equal(period.accepted, 0);
  assert.equal(period.costPerAccepted, 'undefined');
  // And it must not be zero, which would read as "it cost nothing".
  assert.notEqual(period.costPerAccepted, 0);
});

test('edge · a blank cache price falls back to the input price', () => {
  // GPT-5.6 Sol carries no cache read, no cache write and no batch term.
  const p = resolvePrices(priceById('gpt-5-6-sol'));
  assert.equal(p.cacheRead, 4, 'blank cache read falls back to input');
  assert.equal(p.cacheWrite, 4, 'blank cache write falls back to input');
  assert.equal(p.batchDiscount, 0, 'blank batch discount is none');

  // Fable 5.1 has a cache read but no cache write.
  const f = resolvePrices(priceById('fable-5-1'));
  assert.equal(f.cacheRead, 0.25, 'a stated cache read is kept');
  assert.equal(f.cacheWrite, 10, 'blank cache write falls back to input');
});

test('edge · a blank cache price changes the cost, and the fallback is the dear one', () => {
  const sol = computeAttempt({ ...NORMAL.attempt, model: 'gpt-5-6-sol' });
  // cacheRead 32400*4 + cacheWrite 3600*4 + uncached 40500*4 + output 6000*20
  // = 129600 + 14400 + 162000 + 120000 = 426000 / 1e6
  near(sol.modelCost, 0.426, 'modelCost with both cache prices falling back');
});

test('edge · a custom row with empty cache fields takes the same fallback', () => {
  const p = pricesFor('custom', { input: 3, output: 15 });
  assert.equal(p.input, 3);
  assert.equal(p.output, 15);
  assert.equal(p.cacheRead, 3, 'empty custom cache read falls back to input');
  assert.equal(p.cacheWrite, 3, 'empty custom cache write falls back to input');
  assert.equal(p.batchDiscount, 0, 'empty custom batch discount is none');

  const given = pricesFor('custom', { input: 3, output: 15, cacheRead: 0.3, batchDiscount: 0.5 });
  assert.equal(given.cacheRead, 0.3, 'a stated custom cache read is kept');
  assert.equal(given.batchDiscount, 0.5);
});

test('edge · turns = 1', () => {
  const r = computeAttempt({ ...NORMAL.attempt, turns: 1 });

  // No growth term at all: one turn re-sends nothing.
  near(r.totalInput, 9_000, 'totalInput');
  near(r.finalTurnInput, 9_000, 'finalTurnInput');
  near(r.finalVsFirst, 1, 'finalVsFirst');
  near(r.cacheRead, 5_400, 'cacheRead');
  near(r.cacheWrite, 600, 'cacheWrite');
  near(r.uncachedInput, 3_000, 'uncachedInput');
  near(r.outputTokens, 1_000, 'outputTokens');
  assert.ok(Number.isFinite(r.costPerAttempt));
});

test('edge · turns below 1 is clamped to 1, and does not produce a negative', () => {
  const zero = computeAttempt({ ...NORMAL.attempt, turns: 0 });
  const one = computeAttempt({ ...NORMAL.attempt, turns: 1 });
  assert.deepEqual(zero.totalInput, one.totalInput);

  const negative = computeAttempt({ ...NORMAL.attempt, turns: -5 });
  assert.deepEqual(negative.totalInput, one.totalInput);
});

test('edge · costPerCase = 0 does not throw and strands nobody', () => {
  // Free cases: a zero cost per attempt and no tool cost.
  const free = {
    ...exampleValues(),
    storm: {
      attempt: { ...STORM.attempt, model: 'custom', toolCostPerAttempt: 0 },
      period: STORM.period,
    },
  };
  free.storm.attempt = {
    ...free.storm.attempt,
    customPrices: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, batchDiscount: 0 },
  };

  let w!: ReturnType<typeof computeWorkbook>;
  assert.doesNotThrow(() => {
    w = computeWorkbook(free);
  });

  assert.equal(w.storm.period.costPerCase, 0, 'costPerCase');
  // A ceiling cannot stop work that costs nothing.
  assert.equal(w.ceiling.completed, 38_000, 'completed');
  assert.equal(w.ceiling.stranded, 0, 'stranded');
  assert.ok(Number.isFinite(w.ceiling.completed), 'completed is finite, not Infinity');
  // Nothing was avoided, so the ratio is unanswerable rather than infinite.
  assert.equal(w.stopping.tokenCostAvoided, 0);
  assert.equal(w.stopping.freezePerDollar, null, 'freezePerDollar is null, not Infinity');
  assert.equal(w.stopping.breakEven, 0, 'breakEven');
});

test('edge · shareIncurringCost = 0 leaves breakEven unanswerable rather than infinite', () => {
  const w = computeWorkbook({
    ...exampleValues(),
    stopping: { ...STOPPING, shareIncurringCost: 0 },
  });
  assert.equal(w.stopping.breakEven, null, 'breakEven');
  assert.equal(w.stopping.optionB_freeze, 0, 'nothing incurs the cost');
});

test('edge · useBatch = true halves model cost on Sonnet 5', () => {
  const plain = computeAttempt(NORMAL.attempt);
  const batched = computeAttempt({ ...NORMAL.attempt, useBatch: true });

  near(plain.modelCost, 0.15648, 'modelCost without batch');
  near(batched.modelCost, 0.07824, 'modelCost with batch');
  near(batched.modelCost, plain.modelCost / 2, 'batch halves it exactly');

  // Tool cost is outside the model bill and is NOT discounted.
  near(batched.costPerAttempt, 0.07824 + 0.01, 'costPerAttempt with batch');
});

test('edge · percentages above 1 and below 0 are clamped', () => {
  const over = computeAttempt({ ...NORMAL.attempt, cacheHitRate: 4 });
  const one = computeAttempt({ ...NORMAL.attempt, cacheHitRate: 1 });
  assert.deepEqual(over.cacheRead, one.cacheRead);
  assert.equal(over.cacheWrite, 0);

  const under = computeAttempt({ ...NORMAL.attempt, cacheHitRate: -2 });
  const zero = computeAttempt({ ...NORMAL.attempt, cacheHitRate: 0 });
  assert.deepEqual(under.cacheRead, zero.cacheRead);
  assert.equal(under.cacheRead, 0);
});

test('edge · zero cases produces no division by zero anywhere', () => {
  const w = computeWorkbook({
    ...exampleValues(),
    storm: { ...STORM, period: { ...STORM.period, cases: 0 } },
  });
  assert.equal(w.storm.period.costPerCase, null, 'costPerCase');
  assert.equal(w.storm.period.costPerAccepted, 'undefined', 'costPerAccepted');
  assert.equal(w.ceiling.stranded, 0, 'stranded');
  assert.ok(!Number.isNaN(w.ceiling.checkThenActOver));
});

test('edge · an unknown model id falls back rather than throwing', () => {
  const r = computeAttempt({ ...NORMAL.attempt, model: 'not-a-model' });
  near(r.modelCost, 0.15648, 'falls back to Sonnet 5');
});

// ═══════════════════════════════════════════════════════════════════════════
// Display formatting
// ═══════════════════════════════════════════════════════════════════════════

test('format · currency bands by magnitude', () => {
  assert.equal(money(0.16648), '$0.1665');
  assert.equal(money(0.758384), '$0.7584');
  assert.equal(money(432.848), '$432.85');
  assert.equal(money(984.848), '$984.85');
  assert.equal(money(2219.031584), '$2,219');
  assert.equal(money(351120), '$351,120');
});

test('format · the three non-answers render as such', () => {
  assert.equal(money(null), '—');
  assert.equal(money('undefined'), 'undefined');
  assert.equal(tokens(null), '—');
  assert.equal(multiplier(null), '—');
  assert.equal(percent(null), '—');
});

test('format · tokens, multipliers and percentages', () => {
  assert.equal(tokens(114000), '114,000');
  assert.equal(tokens(76500), '76,500');
  assert.equal(multiplier(3.504146), '3.5x');
  assert.equal(multiplier(1.83333), '1.8x');
  assert.equal(percent(0.009023), '0.9%');
  assert.equal(percent(0.6), '60.0%');
});

// ═══════════════════════════════════════════════════════════════════════════
// Purity
// ═══════════════════════════════════════════════════════════════════════════

test('purity · computing does not mutate its inputs', () => {
  const before = JSON.stringify(exampleValues());
  const values = exampleValues();
  computeWorkbook(values);
  assert.equal(JSON.stringify(values), before, 'inputs were mutated');
});

test('purity · two runs of the same inputs give the same answer', () => {
  const a = computeWorkbook(exampleValues());
  const b = computeWorkbook(exampleValues());
  assert.deepEqual(a, b);
});

test('purity · computePeriod takes its prices as an argument', () => {
  // Regression guard. An earlier draft kept the resolved prices in a module
  // variable set by computeScenario, which meant calling computePeriod on its
  // own silently priced background jobs on the wrong model.
  const sonnet = resolvePrices(priceById('sonnet-5'));
  const haiku = resolvePrices(priceById('haiku-4-5'));

  const onSonnet = computePeriod(NORMAL.period, 0.16648, sonnet);
  const onHaiku = computePeriod(NORMAL.period, 0.16648, haiku);

  near(onSonnet.bgCost, 12, 'bgCost on Sonnet 5');
  // 24 * (400000*1 + 20000*5)/1e6 * 0.5 = 24 * 0.5 * 0.5 = 6
  near(onHaiku.bgCost, 6, 'bgCost on Haiku 4.5');
});

// ═══════════════════════════════════════════════════════════════════════════
// The formatted view the page renders
// ═══════════════════════════════════════════════════════════════════════════

test('outputs · the default page renders the specification’s headline figures', () => {
  const o = outputs(computeWorkbook(exampleValues()));

  // View 1
  assert.equal(o['normal.totalInput'], '76,500');
  assert.equal(o['storm.totalInput'], '114,000');
  assert.equal(o['normal.costPerAttempt'], '$0.1665');
  assert.equal(o['storm.costPerAttempt'], '$0.2446');
  assert.equal(o['normal.finalVsFirst'], '1.8x');
  assert.equal(o['storm.finalVsFirst'], '2.2x');

  // View 2
  assert.equal(o['normal.total'], '$984.85');
  assert.equal(o['storm.total'], '$51,686');
  assert.equal(o['normal.costPerAccepted'], '$0.5352');
  assert.equal(o['storm.costPerAccepted'], '$1.70');
  assert.equal(o['stormVsNormal'], '3.5x');

  // View 3
  assert.equal(o['ceiling.completed'], '35,074');
  assert.equal(o['ceiling.stranded'], '2,926');
  assert.equal(o['ceiling.overShare'], '0.9%');
  assert.equal(o['ceiling.reserveOver'], '$0.0000');

  // View 4
  assert.equal(o['stopping.optionB'], '$351,120');
  assert.equal(o['stopping.optionC'], '$122,892');
  assert.equal(o['stopping.lowest'], 'A (continue)');
});

test('outputs · an unanswerable figure never renders as a number', () => {
  const o = outputs(
    computeWorkbook({
      ...exampleValues(),
      normal: { ...NORMAL, period: { ...NORMAL.period, acceptedShare: 0 } },
    }),
  );
  assert.equal(o['normal.costPerAccepted'], 'undefined');
  assert.notEqual(o['normal.costPerAccepted'], '$0.0000');
});
