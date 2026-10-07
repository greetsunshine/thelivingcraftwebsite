/**
 * Tests for the Citation Fit Check.
 *
 * Run with `npm test`. Node's own test runner, no framework.
 *
 * EVERY EXPECTED VALUE BELOW IS FROM THE BRIEF, section 3, Tab 5 ("Expected
 * outputs. These are the acceptance tests"), not from running the code and
 * writing down what it said. A test written from the output only proves the
 * code has not changed, which is not the same as proving it is right.
 *
 * tools/citation-fit-check/verify_xlsx.py asserts the same figures against
 * the workbook, recalculated by LibreOffice.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKS,
  checklistResult,
  conditionMapSummary,
  spotCheckSummary,
  testCasesWritten,
  type Answer,
} from './citationFit.ts';
import {
  EXAMPLE_ANSWERS,
  EXAMPLE_CONDITIONS,
  EXAMPLE_SPOT,
  EXAMPLE_TESTS,
  GUIDANCE_CASES,
} from '../data/citation-fit-check.ts';

test('worked example: the condition map', () => {
  const s = conditionMapSummary(EXAMPLE_CONDITIONS);
  assert.equal(s.rulesMapped, 3);
  assert.equal(s.storedAway, 2);
  assert.equal(s.cannotCheck, 1);
});

test('worked example: the spot check', () => {
  assert.equal(EXAMPLE_SPOT.length, 10);
  const s = spotCheckSummary(EXAMPLE_SPOT);
  assert.equal(s.conditionRecall, 0.4);
  assert.equal(s.citedButWrong, 3);
  assert.equal(s.accuracy, 0.7);
});

test('worked example: the spot check rows match the brief, row by row', () => {
  const rowsWith = (pick: (i: number) => boolean) => EXAMPLE_SPOT.map((_, i) => i + 1).filter((n) => pick(n - 1));
  assert.deepEqual(rowsWith((i) => EXAMPLE_SPOT[i].ruleRetrieved === 'Yes'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(rowsWith((i) => EXAMPLE_SPOT[i].conditionRetrieved === 'Yes'), [1, 4, 7, 9]);
  assert.deepEqual(rowsWith((i) => EXAMPLE_SPOT[i].cited === 'Yes'), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(rowsWith((i) => EXAMPLE_SPOT[i].correctForAsker === 'No'), [2, 5, 8]);
});

test('worked example: the checklist holds on 4, 7 and 11', () => {
  const r = checklistResult(EXAMPLE_ANSWERS);
  assert.equal(r.total, 10);
  assert.deepEqual(r.criticalNo, [4, 7, 11]);
  assert.equal(r.decision, 'Hold');
  assert.equal(r.nextStep?.n, 4);
  assert.equal(r.nextStep?.text, CHECKS[3].text);
});

test('worked example: one test case written, guidance rows not counted', () => {
  assert.equal(testCasesWritten(EXAMPLE_TESTS), 1);
  assert.equal(GUIDANCE_CASES.length, 2);
});

test('checks 4, 7 and 11 set to Yes: 16, Fix first', () => {
  const a = [...EXAMPLE_ANSWERS];
  for (const n of [4, 7, 11]) a[n - 1] = 'Yes';
  const r = checklistResult(a);
  assert.equal(r.total, 16);
  assert.equal(r.decision, 'Fix first');
});

test('every check Yes: 24, Ready, nothing to do next', () => {
  const r = checklistResult(Array<Answer>(12).fill('Yes'));
  assert.equal(r.total, 24);
  assert.equal(r.decision, 'Ready');
  assert.equal(r.nextStep, null);
});

test('twelve checks, four of them critical: 2, 4, 7, 11', () => {
  assert.equal(CHECKS.length, 12);
  assert.deepEqual(CHECKS.filter((c) => c.critical).map((c) => c.n), [2, 4, 7, 11]);
});

test('a blank sheet decides nothing and suggests nothing', () => {
  const r = checklistResult(Array<Answer | ''>(12).fill(''));
  assert.equal(r.total, 0);
  assert.equal(r.decision, null);
  assert.equal(r.nextStep, null);
  const s = spotCheckSummary([]);
  assert.equal(s.conditionRecall, null);
  assert.equal(s.accuracy, null);
});

test('a critical No settles Hold before the sheet is finished', () => {
  const a = Array<Answer | ''>(12).fill('');
  a[6] = 'No';
  assert.equal(checklistResult(a).decision, 'Hold');
});

test('next step falls back to the first No, then the first Partial', () => {
  const a = Array<Answer>(12).fill('Yes');
  a[9] = 'Partial';
  a[4] = 'No';
  assert.equal(checklistResult(a).nextStep?.n, 5);
  a[4] = 'Yes';
  assert.equal(checklistResult(a).nextStep?.n, 10);
});
