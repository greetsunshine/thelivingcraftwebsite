// Bounded retry: transient failures come back with a growing wait, permanent
// ones stop at once, and the fifth attempt is the last.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ATTEMPTS, retryPlan } from './retry.ts';

const NOW = new Date('2026-10-03T04:30:00.000Z');
const minutes = (iso: string | null) => (iso ? (Date.parse(iso) - NOW.getTime()) / 60_000 : null);

test('a transient failure is retried with exponential back-off, then gives up', () => {
  assert.deepEqual([1, 2, 3, 4].map((n) => minutes(retryPlan(n, false, NOW).nextAttemptAt)), [2, 4, 8, 16]);
  assert.equal(retryPlan(4, false, NOW).giveUp, false);
  assert.equal(retryPlan(MAX_ATTEMPTS, false, NOW).giveUp, true);
  assert.equal(retryPlan(MAX_ATTEMPTS, false, NOW).nextAttemptAt, null);
});

test('a permanent failure is never retried', () => {
  const plan = retryPlan(1, true, NOW);
  assert.equal(plan.giveUp, true);
  assert.equal(plan.nextAttemptAt, null);
});
