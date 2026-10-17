/**
 * Tests for the Change Authority Review.
 *
 * Run with `npm test`. Node's own test runner, no framework.
 *
 * EVERY EXPECTED VALUE BELOW IS FROM THE BRIEF, section 3, Tab 4 ("Expected
 * outputs. These are the acceptance tests"), not from running the code and
 * writing down what it said. A test written from the output only proves the
 * code has not changed, which is not the same as proving it is right.
 *
 * tools/change-authority-review/verify_xlsx.py asserts the same figures
 * against the workbook, recalculated by LibreOffice.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKS,
  EMPTY_REQUIREMENTS,
  NO_OPEN_ITEMS,
  WHY,
  authorityReadiness,
  checklistResult,
  finalAuthority,
  inventorySummary,
  requirementsSummary,
  suggestedAuthority,
  type Action,
  type Answer,
} from './changeAuthority.ts';
import { EXAMPLE_ACTIONS, EXAMPLE_ANSWERS, EXAMPLE_REQUIREMENTS } from '../data/change-authority-review.ts';

const blank: Action = { name: '', changes: '', undo: '', seenBy: '', tested: '', chosen: '', reason: '' };
const P = 'Preview and consent';

test('worked example: the suggested authority, row by row', () => {
  assert.deepEqual(EXAMPLE_ACTIONS.map(suggestedAuthority), [
    'Agent acts',
    'Agent acts',
    P,
    P,
    P,
    P,
    'Agent acts',
    P,
    P,
  ]);
});

test('worked example: tab 1 summary', () => {
  const s = inventorySummary(EXAMPLE_ACTIONS);
  assert.equal(s.listed, 9);
  assert.deepEqual(s.suggested, { 'Agent acts': 3, [P]: 6, 'Not allowed': 0 });
  assert.deepEqual(s.byAuthority, { 'Agent acts': 3, [P]: 5, 'Not allowed': 1 });
  assert.deepEqual(
    EXAMPLE_ACTIONS.map(finalAuthority),
    ['Agent acts', 'Agent acts', P, P, P, P, P, 'Agent acts', 'Not allowed'],
  );
  assert.equal(s.noAuthority, 0);
  assert.equal(s.undoNotTested, 5);
  assert.equal(s.overrides, 3);
  assert.equal(s.overridesNoReason, 1);
  assert.equal(s.consentRemoved, 1);
});

test('worked example: authority ready, row by row, with the reasons the brief names', () => {
  const got = EXAMPLE_ACTIONS.map((a, i) => authorityReadiness(finalAuthority(a), a.tested, EXAMPLE_REQUIREMENTS[i]));
  assert.deepEqual(
    got.map((r) => r.ready),
    [true, true, false, true, false, false, true, true, false],
  );
  assert.equal(got[2].why, WHY.previewHidesIrreversible);
  assert.equal(got[4].why, WHY.previewPartial);
  assert.equal(got[5].why, WHY.noConsenter);
  assert.equal(got[8].why, WHY.accessPresent);
});

test('worked example: tab 2 summary', () => {
  const s = requirementsSummary(EXAMPLE_ACTIONS, EXAMPLE_REQUIREMENTS);
  assert.deepEqual(s.actions, { 'Agent acts': 3, [P]: 5, 'Not allowed': 1 });
  assert.deepEqual(s.ready, { 'Agent acts': 3, [P]: 2, 'Not allowed': 0 });
  assert.equal(s.notReady, 4);
  assert.equal(s.previewHides, 2);
  assert.equal(s.consentWeak, 2);
  assert.equal(s.notActingAs, 1);
  assert.equal(s.unsafeRefusal, 1);
  assert.equal(s.accessPresent, 1);
});

test('worked example: the checklist holds on 3 and 4', () => {
  const r = checklistResult(EXAMPLE_ANSWERS);
  assert.equal(r.total, 9);
  assert.deepEqual(r.criticalNo, [3, 4]);
  assert.equal(r.decision, 'Hold');
  assert.equal(r.nextStep, CHECKS[2].text);
});

test('variant, tab 1: clearing row 8’s choice gives it Preview and consent', () => {
  const rows = EXAMPLE_ACTIONS.map((a, i) => (i === 7 ? { ...a, chosen: '' as const } : a));
  assert.equal(finalAuthority(rows[7]), P);
  const s = inventorySummary(rows);
  assert.deepEqual(s.byAuthority, { 'Agent acts': 2, [P]: 6, 'Not allowed': 1 });
  assert.equal(s.overrides, 2);
  assert.equal(s.overridesNoReason, 0);
  assert.equal(s.consentRemoved, 0);
});

test('variant, tab 2: row 3 saying what can’t be undone makes it ready', () => {
  const reqs = EXAMPLE_REQUIREMENTS.map((r, i) => (i === 2 ? { ...r, saysIrreversible: 'Yes' as const } : r));
  assert.equal(authorityReadiness(P, 'Yes', reqs[2]).ready, true);
  const s = requirementsSummary(EXAMPLE_ACTIONS, reqs);
  assert.equal(s.ready[P], 3);
  assert.equal(s.notReady, 3);
  assert.equal(s.previewHides, 1);
});

test('variants, tab 3: 3 and 4 Yes is Fix first; then 5 and 8 Yes is Ready; then all Yes', () => {
  const a = [...EXAMPLE_ANSWERS];
  a[2] = 'Yes';
  a[3] = 'Yes';
  let r = checklistResult(a);
  assert.equal(r.total, 13);
  assert.equal(r.decision, 'Fix first', 'check 5 is critical and Partial');
  assert.equal(r.nextStep, CHECKS[7].text);

  a[4] = 'Yes';
  a[7] = 'Yes';
  r = checklistResult(a);
  assert.equal(r.total, 16);
  assert.equal(r.decision, 'Ready');
  assert.equal(r.nextStep, CHECKS[1].text);

  r = checklistResult(CHECKS.map(() => 'Yes' as Answer));
  assert.equal(r.total, 20);
  assert.equal(r.decision, 'Ready');
  assert.equal(r.nextStep, NO_OPEN_ITEMS);
});

test('next step priority: critical No, then No, then critical Partial, then Partial', () => {
  const a: (Answer | '')[] = CHECKS.map(() => 'Yes');
  a[1] = 'Partial'; // 2, not critical
  a[4] = 'Partial'; // 5, critical
  assert.equal(checklistResult(a).nextCheck?.n, 5);
  a[9] = 'No'; // 10, not critical
  assert.equal(checklistResult(a).nextCheck?.n, 10);
  a[3] = 'No'; // 4, critical
  assert.equal(checklistResult(a).nextCheck?.n, 4);
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

test('edge: a row with only the name filled has no suggestion and no authority', () => {
  const a = { ...blank, name: 'Some action' };
  assert.equal(suggestedAuthority(a), '');
  assert.equal(inventorySummary([a]).noAuthority, 1);
});

test('edge: name filled, undo and audience blank, chosen Not allowed', () => {
  const a: Action = { ...blank, name: 'Some action', chosen: 'Not allowed' };
  assert.equal(finalAuthority(a), 'Not allowed');
  const s = inventorySummary([a]);
  assert.equal(s.overrides, 1);
  assert.equal(s.noAuthority, 0);
});

test('edge: Agent acts with an undo path and undo tested blank is not ready', () => {
  const r = authorityReadiness('Agent acts', '', { ...EMPTY_REQUIREMENTS, undoPath: 'Undo in the editor' });
  assert.deepEqual(r, { ready: false, why: WHY.undoNotTested });
});

test('edge: Preview and consent, every field Yes, but it proceeds anyway', () => {
  const r = authorityReadiness(P, 'Yes', {
    ...EMPTY_REQUIREMENTS,
    fullChange: 'Yes',
    saysIrreversible: 'Yes',
    consenter: 'Document owner',
    perChange: 'Yes',
    actsAs: 'Yes',
    onRefusal: 'Proceeds anyway',
  });
  assert.deepEqual(r, { ready: false, why: WHY.unsafeRefusal });
});

test('"Not allowed" is never suggested', () => {
  for (const undo of ['Yes', 'Partly', 'No'] as const)
    for (const seenBy of ['Nobody', 'The user only', 'Other people', 'Another system'] as const)
      assert.notEqual(suggestedAuthority({ ...blank, name: 'x', undo, seenBy }), 'Not allowed');
});

test('the four critical checks are 1, 3, 4 and 5', () => {
  assert.equal(CHECKS.length, 10);
  assert.deepEqual(
    CHECKS.filter((c) => c.critical).map((c) => c.n),
    [1, 3, 4, 5],
  );
});

test('the /resources listing states the same worked-example figures the page computes', async () => {
  // resources.ts types these into its description; /resources, /llms.txt and
  // the sitemap read it. This test is what stops that text going stale.
  // Read as text: resources.ts uses extensionless imports that node's test
  // runner cannot resolve.
  const { readFile } = await import('node:fs/promises');
  const src = await readFile(new URL('../data/resources.ts', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf("id: 'change-authority-review'"));
  const description = block.slice(0, block.indexOf('useFor:'));
  assert.ok(src.includes("id: 'change-authority-review'"), 'change-authority-review has a row in resources.ts');
  const inv = inventorySummary(EXAMPLE_ACTIONS);
  const req = requirementsSummary(EXAMPLE_ACTIONS, EXAMPLE_REQUIREMENTS);
  const r = checklistResult(EXAMPLE_ANSWERS);
  assert.match(description, new RegExp(`${inv.listed} actions, ${req.notReady} not ready`));
  assert.match(description, new RegExp(`the decision was ${r.decision}`));
});
