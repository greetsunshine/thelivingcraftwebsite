/**
 * Print the tool's content and the worked example's reading as JSON.
 *
 * build_xlsx.py reads this instead of carrying its own copy of the words and
 * the figures. Same pattern as `npm run workbook`, which pipes TypeScript into
 * a Python builder. The point is that the workbook cannot drift from the page:
 * both end up rendering the same strings, and verify_xlsx.py asserts that the
 * spreadsheet's own formulas reproduce `reading` below.
 *
 * Run:  node --experimental-strip-types tools/send-back-cost-check/dump_content.ts
 */
import { HOW_TO_FIND, EXAMPLE, WORKFLOW_INPUTS, EXAMPLE_LABEL } from '../../src/data/send-back-cost-check.ts';
import { PATHS, AFTER_LAST, BUDGET_ENFORCEMENT, CHECK_WHY, blankModel, read, roundCost } from '../../src/lib/sendBackCost.ts';

const reading = read(EXAMPLE);

console.log(
  JSON.stringify(
    {
      exampleLabel: EXAMPLE_LABEL,
      workflowInputs: WORKFLOW_INPUTS,
      howToFind: HOW_TO_FIND,
      paths: PATHS,
      checkWhy: CHECK_WHY,
      // The titles come from the module too. build_xlsx.py used to carry its
      // own copy of all five, which is exactly the duplication that drifts the
      // first time one of them is reworded.
      checkTitles: Object.fromEntries(read(blankModel()).checks.map((c) => [c.n, c.title])),
      afterLast: AFTER_LAST,
      budgetEnforcement: BUDGET_ENFORCEMENT,
      example: EXAMPLE,
      exampleRoundCosts: Object.fromEntries(EXAMPLE.paths.map((p) => [p.kind, roundCost(p)])),
      reading: {
        typical: reading.typical,
        typicalMultiple: reading.typicalMultiple,
        typicalPeak: reading.typicalPeak,
        typicalShare: reading.typicalShare,
        unbounded: reading.unbounded,
        worst: reading.worst,
        worstMultiple: reading.worstMultiple,
        worstPeak: reading.worstPeak,
        worstShare: reading.worstShare,
        checks: reading.checks,
        nextStep: reading.nextStep,
      },
    },
    null,
    2,
  ),
);
