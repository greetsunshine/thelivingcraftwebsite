/**
 * Tests for the Agent Failure Triage Quiz question bank.
 *
 * Run with `npm test`. Node's own test runner, no framework.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE IS WORTH HAVING
 * ───────────────────────────────────────────────────────────────────────────
 *
 * A quiz fails quietly. Two correct answers on one question, a takeaway nobody
 * tests, a feedback line left as a bracketed note: none of those stop the build
 * and all of them reach the reader looking finished. The page already throws on
 * a broken bank at render, and that check runs when somebody visits or builds.
 * This runs it in `npm test`, where a reviewer sees it before either.
 *
 * The expectations come from the brief the quiz was written to, not from running
 * the code and writing down what it said.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BANDS,
  CONCEPT_ITEMS,
  ITEMS,
  KIT_ITEMS,
  MCP_SPEC,
  TAKEAWAYS,
  bandFor,
  correctOf,
  missedTakeaways,
  quizProblems,
} from '../../data/agent-failure-triage-quiz.ts';

test('the bank breaks none of the brief’s rules', () => {
  assert.deepEqual(quizProblems(), []);
});

test('eight to ten concept questions, and the kit questions are separate', () => {
  assert.ok(CONCEPT_ITEMS.length >= 8 && CONCEPT_ITEMS.length <= 10);
  assert.equal(KIT_ITEMS.length, ITEMS.length - CONCEPT_ITEMS.length);
  // A kit question is never counted against a takeaway: it tests whether
  // somebody read the kit, which is a different claim.
  for (const item of KIT_ITEMS) assert.equal(item.takeaway, 0);
});

test('every takeaway is tested, and every concept question maps to exactly one', () => {
  const tested = CONCEPT_ITEMS.map((i) => i.takeaway);
  for (const t of TAKEAWAYS) assert.ok(tested.includes(t.n), `takeaway ${t.n} is not tested`);
  for (const n of tested) assert.ok(TAKEAWAYS.some((t) => t.n === n));
});

test('one correct answer per question, four options, feedback on all of them', () => {
  for (const item of ITEMS) {
    assert.equal(item.options.length, 4, item.id);
    assert.equal(item.options.filter((o) => o.correct).length, 1, item.id);
    assert.ok(correctOf(item).why.startsWith('Correct'), `${item.id}: the key does not say so`);
    for (const o of item.options) assert.ok(o.why.length > 40, `${item.id}${o.key}`);
  }
});

test('the reversal is late, and it tests the key rather than the retry count', () => {
  const reversal = ITEMS.find((i) => i.id === 'Q08')!;
  assert.equal(reversal.takeaway, 5);
  assert.ok(ITEMS.indexOf(reversal) >= ITEMS.length - 5, 'the reversal has drifted too early');
});

test('at least four question shapes are used', () => {
  assert.ok(new Set(CONCEPT_ITEMS.map((i) => i.shape)).size >= 4);
});

test('the bands cover every score and name no credential', () => {
  for (let score = 0; score <= CONCEPT_ITEMS.length; score++) {
    const band = bandFor(score);
    assert.ok(band, `no band for ${score}`);
    assert.doesNotMatch(
      `${band.label} ${band.guidance}`,
      /certificat|credential|qualifi|badge/i,
      `band "${band.label}" makes a credential claim`,
    );
  }
  // Descending, so `find` returns the highest band the score reaches.
  for (let i = 1; i < BANDS.length; i++) assert.ok(BANDS[i].min < BANDS[i - 1].min);
});

test('a missed question reports its takeaway, and a kit question reports none', () => {
  assert.deepEqual(missedTakeaways(['Q04', 'Q02']), [2, 4]);
  assert.deepEqual(missedTakeaways(['K01', 'K02']), []);
  assert.deepEqual(missedTakeaways([]), []);
});

test('the MCP claim carries a version, a date and a source per quote', () => {
  assert.match(MCP_SPEC.version, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(MCP_SPEC.checked, /\d{4}$/);
  assert.ok(MCP_SPEC.url.startsWith('https://modelcontextprotocol.io/'));
  assert.ok(MCP_SPEC.quotes.some((q) => /Default: false/.test(q.text)));
  // The two quotes are in two different documents, so each one says which.
  for (const q of MCP_SPEC.quotes) {
    assert.ok(q.where.length > 10, q.text.slice(0, 40));
    assert.ok(q.url.startsWith('https://'), q.where);
  }
});

test('the top band opens at a perfect score', () => {
  // Drop a concept question without moving this and a perfect score reports
  // the band below it. quizProblems() refuses that; this says why.
  assert.equal(BANDS[0].min, CONCEPT_ITEMS.length);
  assert.equal(BANDS[BANDS.length - 1].min, 0);
});
