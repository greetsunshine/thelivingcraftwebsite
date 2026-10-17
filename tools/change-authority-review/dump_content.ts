/**
 * Print the tool's words, the worked example and its expected figures as JSON.
 *
 * build_xlsx.py reads this instead of carrying its own copy of the words, so
 * the workbook cannot drift from the page. The figures under `expected` are
 * what src/lib/changeAuthority.ts computes for the worked example;
 * verify_xlsx.py asserts the workbook's own formulas reproduce them.
 *
 * Run:  npx tsx tools/change-authority-review/dump_content.ts
 */
import * as C from '../../src/data/change-authority-review.ts';
import {
  ANSWERS,
  AUTHORITIES,
  CHECKS,
  DECISION_MEANING,
  MAX_TOTAL,
  NO_OPEN_ITEMS,
  ON_REFUSAL,
  READY_AT,
  ROWS,
  SEEN_BY,
  UNDO,
  WHY,
  YES_NO,
  authorityReadiness,
  checklistResult,
  finalAuthority,
  inventorySummary,
  requirementsSummary,
  suggestedAuthority,
} from '../../src/lib/changeAuthority.ts';
import { APPLY_URL, cohortInvitationFor } from '../../src/data/resource-cohort-copy.ts';
import { TOOL_CREDIT } from '../../src/data/resources.ts';

const result = checklistResult(C.EXAMPLE_ANSWERS);
const readiness = C.EXAMPLE_ACTIONS.map((a, i) =>
  authorityReadiness(finalAuthority(a), a.tested, C.EXAMPLE_REQUIREMENTS[i]),
);

console.log(
  JSON.stringify(
    {
      title: C.TITLE,
      tagline: C.TAGLINE,
      question: C.QUESTION,
      bring: C.BRING,
      do: C.DO,
      leave: C.LEAVE,
      howToUse: C.HOW_TO_USE,
      legend: C.LEGEND,
      licence: C.LICENCE_LINE,
      inventoryNote: C.INVENTORY_NOTE,
      credit: TOOL_CREDIT,
      cohort: cohortInvitationFor(`/resources/${C.RESOURCE_ID}`),
      applyUrl: APPLY_URL,
      authorityTable: C.AUTHORITY_TABLE,
      undoTable: C.UNDO_TABLE,
      tabs: C.TABS,
      exampleLabel: C.EXAMPLE_LABEL,
      example: {
        actions: C.EXAMPLE_ACTIONS,
        requirements: C.EXAMPLE_REQUIREMENTS,
        answers: C.EXAMPLE_ANSWERS,
      },
      options: {
        undo: UNDO,
        seenBy: SEEN_BY,
        yesNo: YES_NO,
        answers: ANSWERS,
        onRefusal: ON_REFUSAL,
        authorities: AUTHORITIES,
      },
      rows: ROWS,
      why: WHY,
      checks: CHECKS,
      decisionMeaning: DECISION_MEANING,
      maxTotal: MAX_TOTAL,
      readyAt: READY_AT,
      noOpenItems: NO_OPEN_ITEMS,
      expected: {
        inventory: inventorySummary(C.EXAMPLE_ACTIONS),
        suggested: C.EXAMPLE_ACTIONS.map(suggestedAuthority),
        final: C.EXAMPLE_ACTIONS.map(finalAuthority),
        ready: readiness.map((r) => r.ready),
        whyNot: readiness.map((r) => r.why),
        requirements: requirementsSummary(C.EXAMPLE_ACTIONS, C.EXAMPLE_REQUIREMENTS),
        total: result.total,
        criticalNo: result.criticalNo,
        decision: result.decision,
        nextStep: result.nextStep,
      },
    },
    null,
    2,
  ),
);
