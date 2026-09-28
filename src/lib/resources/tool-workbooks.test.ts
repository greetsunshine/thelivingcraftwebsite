// The downloadable workbooks score the way their web pages do.
//
// Sunil, 25 September 2026: the download on a tool is "the tool itself that
// they can use". Three tools now hand out a blank workbook built by
// scripts/tool-workbooks.py (npm run tool-downloads). A workbook that scored
// differently from its page would be a second, silently different tool with
// our name on it, so this test reads the COMMITTED files, evaluates the
// formulas that are actually in them (xlsx-eval.ts, which follows Excel's own
// rules for comparison, counting and ROUND), and compares every result with
// the page's own scoring function on the same answers:
//
//   poc-selection-tool.xlsx      against readScores()     (poc-screen.ts)
//   model-selection-tool.xlsx    against readAssessment() (model-selection-tool.ts)
//   agent-authority-review.xlsx  against readSheet()      (authority-review.ts)
//
// Each tool gets its band edges, its hard gates, blanks, the page's worked
// examples, the workbook's own Example sheets, and a few hundred seeded random
// answer sets. If this fails after a change to a data module, run
// `npm run tool-downloads` and commit the rebuilt files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluator, parse, readWorkbook, type Sheet, type Value } from './xlsx-eval.ts';
import * as poc from '../../data/poc-screen.ts';
import * as msel from '../../data/model-selection-tool.ts';
import * as auth from '../../data/authority-review.ts';

const book = (file: string) => readWorkbook(readFileSync(join(process.cwd(), 'downloads', file)));

/** A small seeded generator, so a failure names a case that can be run again. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

function run(sheet: Sheet, set: Record<string, Value>) {
  const inputs = new Map<string, Value>();
  for (const [name, v] of Object.entries(set)) {
    const at = sheet.names.get(name);
    assert.ok(at, `${sheet.name} has no cell named ${name}`);
    inputs.set(at, v);
  }
  const ev = evaluator(sheet, inputs);
  return (name: string) => {
    const at = sheet.names.get(name);
    assert.ok(at, `${sheet.name} has no cell named ${name}`);
    return ev.value(at);
  };
}

test('every formula in the three workbooks uses only what the evaluator understands', () => {
  for (const f of ['poc-selection-tool.xlsx', 'model-selection-tool.xlsx', 'agent-authority-review.xlsx']) {
    for (const sheet of book(f).values()) {
      for (const [at, src] of sheet.formulas) assert.doesNotThrow(() => parse(src), `${f} ${sheet.name}!${at}: ${src}`);
    }
  }
});

// ── the POC Selection Tool ──────────────────────────────────────────────────

const POC = book('poc-selection-tool.xlsx');
const pocKey = (outcome: Value) => {
  if (outcome === 'Incomplete') return 'none';
  const c = poc.CUT_LINES.find((x) => x.name === outcome);
  assert.ok(c, `unknown outcome ${String(outcome)}`);
  return c.key;
};
function checkPoc(scores: (number | null)[], sheet = POC.get('Score')!, why = '') {
  const page = poc.readScores(scores);
  const inputs = Object.fromEntries(scores.map((v, i) => [`q${String(i + 1).padStart(2, '0')}`, v]));
  const out = run(sheet, sheet.name === 'Score' ? inputs : {});
  const label = `${why} [${scores.map((v) => (v === null ? '-' : v)).join(',')}]`;
  assert.equal(out('out_total'), page.total, `total ${label}`);
  assert.equal(out('out_answered'), page.answered, `answered ${label}`);
  assert.equal(pocKey(out('out_outcome')), page.band?.key ?? 'none', `outcome ${label}`);
}

test('POC workbook: the band edges, the hard gate and blanks agree with readScores()', () => {
  const all = (v: number) => new Array<number | null>(poc.QUESTION_COUNT).fill(v);
  const gate = poc.GATE_INDEXES;
  const withTotal = (total: number) => {
    // Twos first, outside the gate section, so the gate never trips.
    const s = all(1);
    let t = poc.QUESTION_COUNT;
    for (let i = 0; i < s.length && t < total; i++) if (!gate.includes(i)) (s[i] = 2), t++;
    for (let i = 0; i < s.length && t < total; i++) if (gate.includes(i)) (s[i] = 2), t++;
    for (let i = 0; i < s.length && t > total; i++) if (!gate.includes(i)) (s[i] = 0), t--;
    assert.equal(s.reduce<number>((n, v) => n + (v ?? 0), 0), total);
    return s;
  };
  for (const c of poc.CUT_LINES.filter((x) => x.min !== undefined && x.min > 0)) {
    checkPoc(withTotal(c.min!), undefined, `at ${c.key} line`);
    checkPoc(withTotal(c.min! - 1), undefined, `just under ${c.key}`);
  }
  checkPoc(all(2), undefined, 'maximum');
  const gated = all(2);
  gated[gate[0]] = 0;
  checkPoc(gated, undefined, 'a 0 in the gate, high total');
  const gatedBlank = all(null as unknown as number);
  gatedBlank[gate[1]] = 0;
  checkPoc(gatedBlank, undefined, 'a 0 in the gate, nothing else answered');
  const oneBlank = all(2);
  oneBlank[0] = null;
  checkPoc(oneBlank, undefined, 'one blank');
  checkPoc(new Array(poc.QUESTION_COUNT).fill(null), undefined, 'empty');
  checkPoc(poc.EXAMPLE, undefined, 'the page example');
});

test('POC workbook: 400 random score sets agree with readScores()', () => {
  const r = rng(20260928);
  for (let n = 0; n < 400; n++) {
    const s = Array.from({ length: poc.QUESTION_COUNT }, () => (r() < 0.08 ? null : pick(r, [0, 1, 2, 2, 2])));
    checkPoc(s, undefined, `random ${n}`);
  }
});

test("POC workbook: the Example sheet is the page's worked example, scored the same", () => {
  const ex = POC.get('Example')!;
  poc.EXAMPLE.forEach((v, i) => assert.equal(ex.values.get(ex.names.get(`q${String(i + 1).padStart(2, '0')}`)!), v));
  checkPoc(poc.EXAMPLE, ex, 'Example sheet');
});

// ── the Model Selection Tool ────────────────────────────────────────────────

const MSEL = book('model-selection-tool.xlsx');
const mselKey = (outcome: Value) => {
  if (outcome === 'Incomplete') return 'none';
  const c = msel.CUT_LINES.find((x) => x.name === outcome);
  assert.ok(c, `unknown outcome ${String(outcome)}`);
  return c.key;
};
const mselInputs = (a: msel.Assessment) => ({
  in_profile: a.profile === null ? null : msel.PROFILES[a.profile].name,
  ...Object.fromEntries(a.gates.map((v, i) => [`gate${String(i + 1).padStart(2, '0')}`, v === null ? null : v === 1 ? msel.GATE_ANSWERS.pass : msel.GATE_ANSWERS.fail])),
  ...Object.fromEntries(a.scores.map((v, i) => [`score${String(i + 1).padStart(2, '0')}`, v])),
  ...Object.fromEntries(a.own.map((v, i) => [`own${i + 1}`, v])),
  ...Object.fromEntries(a.dq.map((v, i) => [`dq${i + 1}`, v === null ? null : v === 1 ? msel.DQ_ANSWERS.yes : msel.DQ_ANSWERS.no])),
});
function checkMsel(a: msel.Assessment, sheet = MSEL.get('Score')!, why = '') {
  const page = msel.readAssessment(a);
  const out = run(sheet, sheet.name === 'Score' ? mselInputs(a) : {});
  const label = `${why} ${JSON.stringify(a)}`;
  assert.equal(out('out_pct'), page.pct === null ? '' : page.pct, `percent ${label}`);
  assert.equal(out('out_answered'), page.answered, `answered ${label}`);
  if (page.total !== null) assert.equal(out('out_total'), page.total, `weighted total ${label}`);
  assert.equal(mselKey(out('out_outcome')), page.band?.key ?? 'none', `outcome ${label}`);
  return page;
}
const complete = (r: () => number, profile = Math.floor(r() * msel.PROFILES.length)): msel.Assessment => ({
  profile,
  gates: new Array(msel.GATE_COUNT).fill(1),
  scores: Array.from({ length: msel.CRITERIA_COUNT }, () => pick(r, [0, 1, 2])),
  own: msel.OWN_WEIGHT_ROWS.map(() => 1 + Math.floor(r() * msel.OWN_WEIGHT_MAX)),
  dq: new Array(msel.DQ_COUNT).fill(0),
});

test('Model Selection workbook: each band edge, the gates, the disqualifiers and blanks agree with readAssessment()', () => {
  const r = rng(7);
  // Search complete, clean assessments for a percentage on each side of every line.
  const want = new Set(msel.CUT_LINES.filter((c) => c.min !== undefined && c.min > 0).flatMap((c) => [c.min!, c.min! - 1]));
  const found = new Map<number, msel.Assessment>();
  for (let n = 0; n < 20000 && found.size < want.size; n++) {
    const a = complete(r);
    const pct = msel.readAssessment(a).pct!;
    if (want.has(pct) && !found.has(pct)) found.set(pct, a);
  }
  assert.equal(found.size, want.size, `found percentages ${[...found.keys()].join(', ')} of ${[...want].join(', ')}`);
  for (const [pct, a] of found) checkMsel(a, undefined, `at ${pct}%`);

  const base = complete(rng(11));
  checkMsel({ ...base, gates: base.gates.map((v, i) => (i === 3 ? 0 : v)) }, undefined, 'a failed gate');
  checkMsel({ ...base, dq: base.dq.map((v, i) => (i === 1 ? 1 : v)) }, undefined, 'a disqualifier');
  checkMsel({ ...base, gates: base.gates.map((v, i) => (i === 0 ? 0 : v)), dq: base.dq.map(() => 1) }, undefined, 'a gate and a disqualifier');
  checkMsel({ ...base, profile: null }, undefined, 'no job chosen');
  checkMsel({ ...base, scores: base.scores.map((v, i) => (i === 5 ? null : v)) }, undefined, 'one behaviour blank');
  checkMsel(msel.blankAssessment(), undefined, 'the blank sheet');
  for (const ex of msel.EXAMPLES) checkMsel(ex.assessment, undefined, `page example ${ex.id}`);
});

test('Model Selection workbook: 500 random assessments agree with readAssessment()', () => {
  const r = rng(20260929);
  const maybe = <T,>(v: T): T | null => (r() < 0.05 ? null : v);
  for (let n = 0; n < 500; n++) {
    const a = complete(r);
    const b: msel.Assessment = {
      profile: r() < 0.05 ? null : a.profile,
      gates: a.gates.map(() => maybe(r() < 0.05 ? 0 : 1)),
      scores: a.scores.map((v) => maybe(v)),
      own: a.own,
      dq: a.dq.map(() => maybe(r() < 0.04 ? 1 : 0)),
    };
    checkMsel(b, undefined, `random ${n}`);
  }
});

test("Model Selection workbook: the Example sheets are the page's reference candidates, scored the same", () => {
  for (const ex of msel.EXAMPLES) {
    const sheet = MSEL.get(`Example ${ex.id.toUpperCase()}`);
    assert.ok(sheet, `no Example ${ex.id.toUpperCase()} sheet`);
    checkMsel(ex.assessment, sheet, `Example ${ex.id} sheet`);
    const stored = run(sheet, {})('in_profile');
    assert.equal(stored, msel.PROFILES[ex.assessment.profile!].name);
  }
});

// ── the Agent Authority Review ──────────────────────────────────────────────

const AUTH = book('agent-authority-review.xlsx');
const labelOf = <T extends string>(choices: { value: T; label: string }[], v: T | null) => (v === null ? null : choices.find((c) => c.value === v)!.label);
const outcomeKey = (name: Value) => {
  const hit = Object.entries(auth.SHEET_OUTCOME_NAMES).find(([, v]) => v === name);
  assert.ok(hit, `unknown outcome ${String(name)}`);
  return hit[0];
};
function checkAuth(rows: auth.SheetRow[], sheet = AUTH.get('Sheet')!, why = '') {
  const page = auth.readSheet(rows);
  const inputs: Record<string, Value> = {};
  if (sheet.name === 'Sheet') {
    rows.forEach((row, i) => {
      const n = String(i + 1).padStart(2, '0');
      inputs[`step${n}`] = row.step || null;
      inputs[`evidence${n}`] = row.evidence || null;
      inputs[`limit${n}`] = row.limit || null;
      inputs[`missing${n}`] = row.missing || null;
      inputs[`checked${n}`] = labelOf(auth.EVIDENCE_CHOICES, row.checked);
      inputs[`judgment${n}`] = labelOf(auth.JUDGMENT_CHOICES, row.judgment);
      inputs[`undo${n}`] = row.undo;
      inputs[`repeat${n}`] = labelOf(auth.REPEAT_CHOICES, row.repeat);
    });
  }
  const out = run(sheet, inputs);
  const label = `${why} ${JSON.stringify(rows.map((r) => [r.step, r.checked, r.judgment, r.undo, r.repeat]))}`;
  assert.equal(out('out_total'), page.total, `steps ${label}`);
  assert.equal(out('out_decided'), page.decided, `decided ${label}`);
  assert.equal(out('out_code'), page.counts.code, `code ${label}`);
  assert.equal(out('out_agent'), page.counts.agent, `agent ${label}`);
  assert.equal(out('out_suggest'), page.counts.suggest, `suggest ${label}`);
  assert.equal(out('out_stop'), page.counts.stop, `stop ${label}`);
  assert.equal(out('out_ceiling'), page.agentCeiling ?? '', `agent ceiling ${label}`);
  assert.equal(outcomeKey(out('out_outcome')), page.outcome.key, `outcome ${label}`);
  // Each row's owner, as the page names it beside the step.
  const isUsed = (r: auth.SheetRow) =>
    [r.step, r.evidence, r.limit, r.missing].some((s) => s.trim() !== '') || [r.checked, r.judgment, r.undo, r.repeat].some((v) => v !== null);
  rows.forEach((row, i) => {
    const owner = out(`owner${String(i + 1).padStart(2, '0')}`);
    assert.equal(owner, isUsed(row) ? page.rows[i].owner : '', `row ${i + 1} owner ${label}`);
  });
}
const row = (over: Partial<auth.SheetRow>): auth.SheetRow => ({ ...auth.blankRow(), ...over });

test('Authority Review workbook: every outcome, the ceiling and the edges agree with readSheet()', () => {
  checkAuth([], undefined, 'empty');
  checkAuth([row({ step: 'Draft a reply' })], undefined, 'a step with no answers');
  checkAuth([row({ step: '   ' })], undefined, 'whitespace only is not a step');
  checkAuth([row({ judgment: 'one', undo: 'R3', repeat: 'known' })], undefined, 'code, any undo cost');
  checkAuth([row({ judgment: 'disagree', undo: 'R0', repeat: 'known' }), row({ judgment: 'disagree', undo: 'R1', repeat: 'known' })], undefined, 'agent ceiling R1');
  checkAuth([row({ judgment: 'disagree', undo: 'R0', repeat: 'known' })], undefined, 'agent ceiling R0');
  checkAuth([row({ judgment: 'disagree', undo: 'R2', repeat: 'known', checked: 'guessed' })], undefined, 'suggest, assumed input');
  checkAuth([row({ judgment: 'one', undo: 'R0', repeat: 'unknown' }), row({ judgment: 'disagree', undo: 'R0', repeat: 'known' })], undefined, 'a stop overrides');
  checkAuth([row({ judgment: 'one', undo: 'R0', repeat: 'known' }), row({ judgment: 'one', undo: null, repeat: 'known' })], undefined, 'in progress');
  for (const ex of auth.EXAMPLES) checkAuth(auth.exampleRows(ex), undefined, `page example ${ex.id}`);
});

test('Authority Review workbook: 400 random sheets agree with readSheet()', () => {
  const r = rng(20260930);
  const maybe = <T,>(v: T, p = 0.15): T | null => (r() < p ? null : v);
  const text = () => pick(r, ['', '', 'Refund the order', '  ', 'Read the ticket', 'x']);
  for (let n = 0; n < 400; n++) {
    const rows = Array.from({ length: 1 + Math.floor(r() * auth.MAX_ROWS) }, () =>
      row({
        step: text(),
        evidence: text(),
        limit: text(),
        missing: text(),
        checked: maybe(pick(r, ['confirmed', 'guessed'] as const), 0.3),
        judgment: maybe(pick(r, ['one', 'disagree'] as const)),
        undo: maybe(pick(r, auth.UNDO_LEVELS)),
        repeat: maybe(pick(r, ['known', 'known', 'unknown'] as const)),
      }),
    );
    checkAuth(rows, undefined, `random ${n}`);
  }
});

test("Authority Review workbook: the Example sheet is the page's first worked example, read the same", () => {
  checkAuth(auth.exampleRows(auth.EXAMPLES[0]), AUTH.get('Example')!, 'Example sheet');
});
