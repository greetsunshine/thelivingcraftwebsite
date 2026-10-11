/**
 * Tests for the Gate Routing Map.
 *
 * Run with `npm test`. Node's own test runner, no framework.
 *
 * EVERY EXPECTED VALUE BELOW IS FROM THE BRIEF, section 3, Tab 4 ("Expected
 * outputs. These are the acceptance tests"), not from running the code and
 * writing down what it said. A test written from the output only proves the
 * code has not changed, which is not the same as proving it is right.
 *
 * tools/gate-routing-map/verify_xlsx.py asserts the same figures against the
 * workbook, recalculated by LibreOffice.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKS,
  DEFAULT_MIN_TRIALS,
  EMPTY_REQUIREMENTS,
  NO_OPEN_ITEMS,
  WHY,
  checklistResult,
  finalRoute,
  inventorySummary,
  requirementsSummary,
  routeReadiness,
  suggestedRoute,
  type Answer,
  type GateCase,
} from './gateRouting.ts';
import {
  EXAMPLE_ANSWERS,
  EXAMPLE_CASES,
  EXAMPLE_MIN_TRIALS,
  EXAMPLE_REQUIREMENTS,
} from '../data/gate-routing-map.ts';

const blankCase: GateCase = {
  name: '',
  checks: '',
  purpose: '',
  severity: '',
  actor: '',
  checkDecides: '',
  deterministic: '',
  chosen: '',
  reason: '',
};

test('worked example: the suggested route, row by row', () => {
  assert.deepEqual(EXAMPLE_CASES.map(suggestedRoute), [
    'Check downstream',
    'Check downstream',
    'Block',
    'Human decides',
    'Track',
    'Track',
    'Block',
    'Human decides',
  ]);
});

test('worked example: tab 1 summary', () => {
  const s = inventorySummary(EXAMPLE_CASES);
  assert.equal(s.listed, 8);
  assert.deepEqual(s.byRoute, { Block: 3, 'Human decides': 1, 'Check downstream': 2, Track: 2 });
  assert.deepEqual(s.suggested, { Block: 2, 'Human decides': 2, 'Check downstream': 2, Track: 2 });
  assert.equal(s.unrouted, 0);
  assert.equal(s.overrides, 1);
  assert.equal(s.overridesNoReason, 0);
});

test('worked example: route ready, row by row, with the reasons the brief names', () => {
  const got = EXAMPLE_CASES.map((c, i) =>
    routeReadiness(finalRoute(c), c.deterministic, EXAMPLE_REQUIREMENTS[i], EXAMPLE_MIN_TRIALS),
  );
  assert.deepEqual(
    got.map((r) => r.ready),
    [false, true, true, false, true, false, false, false],
  );
  assert.equal(got[0].why, WHY.notVerified);
  assert.equal(got[3].why, WHY.noHalt);
  assert.equal(got[5].why, WHY.noOwner);
  assert.equal(got[6].why, WHY.mustPassLower);
  assert.equal(got[7].why, WHY.belowMinimum);
});

test('worked example: tab 2 summary', () => {
  const s = requirementsSummary(EXAMPLE_CASES, EXAMPLE_REQUIREMENTS, EXAMPLE_MIN_TRIALS);
  assert.deepEqual(s.cases, { Block: 3, 'Human decides': 1, 'Check downstream': 2, Track: 2 });
  assert.deepEqual(s.ready, { Block: 1, 'Human decides': 0, 'Check downstream': 1, Track: 1 });
  assert.equal(s.notReady, 5);
  assert.equal(s.blockNotReady, 2);
  assert.equal(s.humanNotReady, 1);
  assert.equal(s.humanNoBackup, 1);
  assert.equal(s.downstreamUnverified, 1);
});

test('worked example: a minimum of 1 trial makes row 8 ready', () => {
  const s = requirementsSummary(EXAMPLE_CASES, EXAMPLE_REQUIREMENTS, 1);
  assert.equal(s.ready.Block, 2);
});

test('worked example: the checklist holds on 3 and 5', () => {
  const r = checklistResult(EXAMPLE_ANSWERS);
  assert.equal(r.total, 12);
  assert.deepEqual(r.criticalNo, [3, 5]);
  assert.equal(r.decision, 'Hold');
  assert.equal(r.nextStep, CHECKS[2].text);
});

test('variants: 3 and 5 Yes is Fix first; then 8 Yes is Ready; then all Yes', () => {
  const a = [...EXAMPLE_ANSWERS];
  a[2] = 'Yes';
  a[4] = 'Yes';
  let r = checklistResult(a);
  assert.equal(r.total, 16);
  assert.equal(r.decision, 'Fix first', 'check 8 is critical and Partial');
  assert.equal(r.nextStep, CHECKS[5].text);

  a[7] = 'Yes';
  r = checklistResult(a);
  assert.equal(r.total, 17);
  assert.equal(r.decision, 'Ready');

  r = checklistResult(CHECKS.map(() => 'Yes' as Answer));
  assert.equal(r.total, 20);
  assert.equal(r.decision, 'Ready');
  assert.equal(r.nextStep, NO_OPEN_ITEMS);
});

test('next step priority: critical No, then No, then critical Partial, then Partial', () => {
  const all = (): (Answer | '')[] => CHECKS.map(() => 'Yes');
  const a = all();
  a[3] = 'Partial'; // 4, not critical
  a[7] = 'Partial'; // 8, critical
  assert.equal(checklistResult(a).nextCheck?.n, 8);
  a[9] = 'No'; // 10, not critical
  assert.equal(checklistResult(a).nextCheck?.n, 10);
  a[4] = 'No'; // 5, critical
  assert.equal(checklistResult(a).nextCheck?.n, 5);
});

test('a half-filled checklist: blank decision unless a critical No settles it', () => {
  const a: (Answer | '')[] = CHECKS.map(() => '');
  let r = checklistResult(a);
  assert.equal(r.decision, null);
  assert.equal(r.nextStep, '', 'a blank sheet does not say "No open items."');
  a[0] = 'No';
  r = checklistResult(a);
  assert.equal(r.decision, 'Hold');
});

test('edge: a row with only the name filled has no suggestion and is unrouted', () => {
  const c = { ...blankCase, name: 'Some case' };
  assert.equal(suggestedRoute(c), '');
  assert.equal(inventorySummary([c]).unrouted, 1);
});

test('edge: name filled, inputs blank, chosen Block — routed, and an override', () => {
  const c: GateCase = { ...blankCase, name: 'Some case', chosen: 'Block' };
  assert.equal(finalRoute(c), 'Block');
  const s = inventorySummary([c]);
  assert.equal(s.overrides, 1);
  assert.equal(s.unrouted, 0);
  assert.equal(s.overridesNoReason, 1);
});

test('edge: a deterministic Block case with 1 trial, 1 must pass, is ready', () => {
  const r = routeReadiness('Block', 'Yes', { ...EMPTY_REQUIREMENTS, trials: 1, mustPass: 1 }, DEFAULT_MIN_TRIALS);
  assert.equal(r.ready, true);
});

test('determinism left blank needs the minimum trials, like a No', () => {
  const r = routeReadiness('Block', '', { ...EMPTY_REQUIREMENTS, trials: 1, mustPass: 1 }, DEFAULT_MIN_TRIALS);
  assert.equal(r.why, WHY.belowMinimum);
});

test('the four critical checks are 1, 3, 5 and 8', () => {
  assert.equal(CHECKS.length, 10);
  assert.deepEqual(
    CHECKS.filter((c) => c.critical).map((c) => c.n),
    [1, 3, 5, 8],
  );
});

test('the /resources listing states the same worked-example figures the page computes', async () => {
  // resources.ts types these into its description; /resources, /llms.txt and
  // the sitemap read it. This test is what stops that text going stale.
  // Read as text: resources.ts uses extensionless imports that node's test
  // runner cannot resolve.
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(new URL('../data/resources.ts', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf("id: 'gate-routing-map'"));
  const row = { description: block.slice(0, block.indexOf('useFor:')) };
  assert.ok(row.description.length > 0, 'gate-routing-map has a row in resources.ts');
  const inv = inventorySummary(EXAMPLE_CASES);
  const req = requirementsSummary(EXAMPLE_CASES, EXAMPLE_REQUIREMENTS, EXAMPLE_MIN_TRIALS);
  const r = checklistResult(EXAMPLE_ANSWERS);
  assert.match(row.description, new RegExp(`${inv.listed} gate cases, ${req.notReady} routes not ready`));
  assert.match(row.description, new RegExp(`the decision was ${r.decision}`));
});
