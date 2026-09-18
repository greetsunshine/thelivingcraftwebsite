// The Run-Cost Model workbook, half one: everything the sheet needs, as JSON.
//
// The Excel workbook at public/downloads/agent-run-cost-model.xlsx is the same
// model as /resources/run-cost-model, for people who would rather fill it in
// offline. The rows, the instruction beside each row, the four options, the
// reference example, the rubric and the credit line all come from
// src/data/run-cost-model.ts through this script, so the workbook cannot
// drift from the page. The formulas are written by the second half,
// scripts/run-cost-workbook.py, which needs openpyxl.
//
//   npm run workbook
//
// runs both halves and rewrites the file in public/downloads. Commit the
// result with the change to the data module that made it necessary.

import {
  ARMS,
  ARMS_NOTE,
  EXAMPLE,
  EXAMPLE_STORY,
  FORGOTTEN_ROWS,
  HOW_TO_RUN,
  LIMITS,
  OUTCOMES,
  PURPOSE,
  SECTIONS,
  TOOL_NAME,
  TOTALS,
  unitOf,
} from '../src/data/run-cost-model';
import { TOOL_CREDIT } from '../src/data/resources';
import { SITE_ORIGIN, cohort } from '../src/data/facts';
import { COHORT_SIZE, COMMITMENT } from '../src/data/offer-display';

const out = {
  toolName: TOOL_NAME,
  credit: TOOL_CREDIT,
  pageUrl: `${SITE_ORIGIN}/resources/run-cost-model`,
  applyUrl: `${SITE_ORIGIN}/#apply`,
  purpose: PURPOSE,
  rules: HOW_TO_RUN,
  limits: LIMITS,
  arms: ARMS,
  armsNote: ARMS_NOTE,
  sections: SECTIONS.map((s) => ({
    num: s.num,
    name: s.name,
    question: s.question,
    blurb: s.blurb,
    scope: s.scope,
    inputs: s.inputs.map((r) => ({ key: r.key, label: r.label, unit: unitOf(r.kind, 'currency'), why: r.why, forgotten: Boolean(r.forgotten) })),
    computed: s.computed.map((r) => ({ key: r.key, label: r.label, why: r.why })),
  })),
  totals: TOTALS.map((r) => ({ key: r.key, label: r.label, why: r.why })),
  forgotten: FORGOTTEN_ROWS.map((r) => r.label),
  outcomes: OUTCOMES,
  example: EXAMPLE,
  exampleStory: EXAMPLE_STORY,
  cta: {
    heading: 'Join the cohort',
    lines: [
      `${cohort.name} is a ${cohort.weeks}-week live programme in agentic systems architecture, taught by Sunil Mathew.`,
      `${COMMITMENT} ${COHORT_SIZE} Starts ${cohort.startsOn}.`,
      `${cohort.admission}. Applying commits you to nothing.`,
    ],
  },
};

process.stdout.write(JSON.stringify(out, null, 2));
