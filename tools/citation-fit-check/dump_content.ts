/**
 * Print the tool's words, the worked example and its expected figures as JSON.
 *
 * build_xlsx.py reads this instead of carrying its own copy of the words, so
 * the workbook cannot drift from the page. The figures under `expected` are
 * what src/lib/citationFit.ts computes for the worked example; verify_xlsx.py
 * asserts the workbook's own formulas reproduce them.
 *
 * Run:  npx tsx tools/citation-fit-check/dump_content.ts
 */
import * as C from '../../src/data/citation-fit-check.ts';
import {
  ANSWERS,
  CHECKS,
  CHECK_GROUPS,
  CONDITION_LIVES,
  CONDITION_TYPES,
  DECISION_MEANING,
  EXPECTED_BEHAVIOURS,
  FACT_SOURCES,
  MAX_TOTAL,
  READY_AT,
  ROWS,
  YES_NO,
  checklistResult,
  conditionMapSummary,
  spotCheckSummary,
  testCasesWritten,
} from '../../src/lib/citationFit.ts';
import { APPLY_URL, cohortInvitationFor } from '../../src/data/resource-cohort-copy.ts';
import { TOOL_CREDIT } from '../../src/data/resources.ts';

const result = checklistResult(C.EXAMPLE_ANSWERS);

console.log(
  JSON.stringify(
    {
      title: C.TITLE,
      tagline: C.TAGLINE,
      bring: C.BRING,
      do: C.DO,
      leave: C.LEAVE,
      howToUse: C.HOW_TO_USE,
      legend: C.LEGEND,
      licence: C.LICENCE_LINE,
      credit: TOOL_CREDIT,
      cohort: cohortInvitationFor(`/resources/${C.RESOURCE_ID}`),
      applyUrl: APPLY_URL,
      tabs: C.TABS,
      testCasesNote: C.TEST_CASES_NOTE,
      guidanceCases: C.GUIDANCE_CASES,
      exampleLabel: C.EXAMPLE_LABEL,
      example: {
        conditions: C.EXAMPLE_CONDITIONS,
        spot: C.EXAMPLE_SPOT,
        answers: C.EXAMPLE_ANSWERS,
        tests: C.EXAMPLE_TESTS,
      },
      options: {
        conditionTypes: CONDITION_TYPES,
        conditionLives: CONDITION_LIVES,
        factSources: FACT_SOURCES,
        yesNo: YES_NO,
        answers: ANSWERS,
        expectedBehaviours: EXPECTED_BEHAVIOURS,
      },
      rows: ROWS,
      checks: CHECKS,
      checkGroups: CHECK_GROUPS,
      decisionMeaning: DECISION_MEANING,
      maxTotal: MAX_TOTAL,
      readyAt: READY_AT,
      expected: {
        ...conditionMapSummary(C.EXAMPLE_CONDITIONS),
        ...spotCheckSummary(C.EXAMPLE_SPOT),
        total: result.total,
        criticalNo: result.criticalNo,
        decision: result.decision,
        nextStep: result.nextStep?.text ?? null,
        testCasesWritten: testCasesWritten(C.EXAMPLE_TESTS),
      },
    },
    null,
    2,
  ),
);
