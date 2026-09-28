// The three tool workbooks, half one: everything the sheets need, as JSON.
//
// Sunil, 25 September 2026: the download on a tool should be "the tool itself
// that they can use", not the visitor's filled-in report. So the POC Selection
// Tool, the Model Selection Tool and the Agent Authority Review each hand out a
// blank, reusable workbook, the way the Run-Cost Model already did.
//
// Every question, anchor, weight, label, band threshold and worked example
// comes from the data module the page renders from, through this script. None
// is typed here or in the Python half, so a workbook cannot drift from its
// page. The formulas are written by scripts/tool-workbooks.py, and
// src/lib/resources/tool-workbooks.test.ts reads them back out of the
// committed files and checks them against the pages' own scoring functions.
//
//   npm run tool-downloads
//
// rebuilds all three workbooks and the two blank sheets. Commit the result with
// the change to the data module that made it necessary.

import * as poc from '../src/data/poc-screen';
import * as msel from '../src/data/model-selection-tool';
import * as auth from '../src/data/authority-review';
import { TOOL_CREDIT } from '../src/data/resources';
import { SITE_ORIGIN } from '../src/data/facts';

const url = (path: string) => `${SITE_ORIGIN}${path}`;

const out = {
  'poc-screen': {
    file: 'poc-selection-tool.xlsx',
    toolName: poc.TOOL_NAME,
    credit: TOOL_CREDIT,
    pageUrl: url('/resources/poc-screen'),
    purpose: poc.PURPOSE,
    howToRun: poc.HOW_TO_RUN,
    sections: poc.SECTIONS.map((s) => ({
      letter: s.letter,
      name: s.name,
      question: s.question,
      gate: s.gate,
      items: s.items.map((it) => ({ short: it.short, q: it.q, a: it.a })),
    })),
    maxScore: poc.MAX_SCORE,
    cutLines: poc.CUT_LINES,
    moves: poc.MOVES.map((m) => ({ num: m.num, name: m.name, body: m.body, cost: m.cost })),
    example: poc.EXAMPLE,
  },
  'model-selection-tool': {
    file: 'model-selection-tool.xlsx',
    toolName: msel.TOOL_NAME,
    credit: TOOL_CREDIT,
    pageUrl: url('/resources/model-selection-tool'),
    purpose: msel.PURPOSE,
    howToRun: msel.HOW_TO_RUN,
    stepQuestion: msel.STEP_QUESTION,
    stepWhy: msel.STEP_WHY,
    profiles: msel.PROFILES,
    gates: msel.GATES.map((g) => ({ short: g.short, q: g.q, passes: g.passes })),
    gateAnswers: msel.GATE_ANSWERS,
    criteria: msel.CRITERIA.map((c) => ({ short: c.short, q: c.q, a: c.a, weights: c.weights ?? null, key: Boolean(c.key) })),
    ownWeightDefault: msel.OWN_WEIGHT_DEFAULT,
    ownWeightMax: msel.OWN_WEIGHT_MAX,
    weightsNote: msel.WEIGHTS_NOTE,
    disqualifiers: msel.DISQUALIFIERS.map((d) => ({ short: d.short, q: d.q })),
    dqAnswers: msel.DQ_ANSWERS,
    answerCount: msel.ANSWER_COUNT,
    cutLines: msel.CUT_LINES,
    examples: msel.EXAMPLES.map((e) => ({ id: e.id, title: e.title, assessment: e.assessment })),
  },
  'agent-authority-review': {
    file: 'agent-authority-review.xlsx',
    toolName: auth.TOOL_NAME,
    headline: auth.HEADLINE,
    credit: TOOL_CREDIT,
    pageUrl: url('/resources/agent-authority-review'),
    purpose: auth.PURPOSE,
    questions: auth.FIVE_QUESTIONS.map((q) => ({ n: q.n, name: q.name, ask: q.ask, column: q.column })),
    evidence: auth.EVIDENCE_CHOICES.map((c) => ({ value: c.value, label: c.label })),
    judgment: auth.JUDGMENT_CHOICES.map((c) => ({ value: c.value, label: c.label })),
    repeat: auth.REPEAT_CHOICES.map((c) => ({ value: c.value, label: c.label })),
    undo: auth.UNDO_SCALE.map((u) => ({ level: u.level, short: u.short })),
    rubric: auth.RUBRIC.map((r) => ({ key: r.key, when: r.when, owner: r.owner, may: r.may })),
    notDecided: auth.NOT_DECIDED,
    agentUndoLevels: auth.AGENT_UNDO_LEVELS,
    irreversibleUndo: auth.IRREVERSIBLE_UNDO,
    rowFlags: auth.ROW_FLAGS,
    outcomes: auth.SHEET_OUTCOME_NAMES,
    maxRows: auth.MAX_ROWS,
    example: (() => {
      const ex = auth.EXAMPLES[0];
      return { title: ex.title, rows: auth.exampleRows(ex) };
    })(),
  },
};

process.stdout.write(JSON.stringify(out, null, 2));
