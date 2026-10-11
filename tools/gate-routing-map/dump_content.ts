/**
 * Print the tool's words, the worked example and its expected figures as JSON.
 *
 * build_xlsx.py reads this instead of carrying its own copy of the words, so
 * the workbook cannot drift from the page. The figures under `expected` are
 * what src/lib/gateRouting.ts computes for the worked example; verify_xlsx.py
 * asserts the workbook's own formulas reproduce them.
 *
 * Run:  npx tsx tools/gate-routing-map/dump_content.ts
 */
import * as C from '../../src/data/gate-routing-map.ts';
import {
  ACTORS,
  ANSWERS,
  CHECKS,
  DECISION_MEANING,
  DEFAULT_MIN_TRIALS,
  MAX_TOTAL,
  NO_OPEN_ITEMS,
  PURPOSES,
  READY_AT,
  ROUTES,
  ROWS,
  SEVERITIES,
  WHY,
  YES_NO,
  checklistResult,
  finalRoute,
  inventorySummary,
  requirementsSummary,
  routeReadiness,
  suggestedRoute,
} from '../../src/lib/gateRouting.ts';
import { APPLY_URL, cohortInvitationFor } from '../../src/data/resource-cohort-copy.ts';
import { TOOL_CREDIT } from '../../src/data/resources.ts';

const result = checklistResult(C.EXAMPLE_ANSWERS);
const readiness = C.EXAMPLE_CASES.map((c, i) =>
  routeReadiness(finalRoute(c), c.deterministic, C.EXAMPLE_REQUIREMENTS[i], C.EXAMPLE_MIN_TRIALS),
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
      credit: TOOL_CREDIT,
      cohort: cohortInvitationFor(`/resources/${C.RESOURCE_ID}`),
      applyUrl: APPLY_URL,
      routeTable: C.ROUTE_TABLE,
      tabs: C.TABS,
      minTrialsLabel: C.MIN_TRIALS_LABEL,
      minTrialsNote: C.MIN_TRIALS_NOTE,
      exampleLabel: C.EXAMPLE_LABEL,
      example: {
        minTrials: C.EXAMPLE_MIN_TRIALS,
        cases: C.EXAMPLE_CASES,
        requirements: C.EXAMPLE_REQUIREMENTS,
        answers: C.EXAMPLE_ANSWERS,
      },
      options: { purposes: PURPOSES, severities: SEVERITIES, actors: ACTORS, yesNo: YES_NO, answers: ANSWERS, routes: ROUTES },
      rows: ROWS,
      defaultMinTrials: DEFAULT_MIN_TRIALS,
      why: WHY,
      checks: CHECKS,
      decisionMeaning: DECISION_MEANING,
      maxTotal: MAX_TOTAL,
      readyAt: READY_AT,
      noOpenItems: NO_OPEN_ITEMS,
      expected: {
        inventory: inventorySummary(C.EXAMPLE_CASES),
        suggested: C.EXAMPLE_CASES.map(suggestedRoute),
        final: C.EXAMPLE_CASES.map(finalRoute),
        ready: readiness.map((r) => r.ready),
        whyNot: readiness.map((r) => r.why),
        requirements: requirementsSummary(C.EXAMPLE_CASES, C.EXAMPLE_REQUIREMENTS, C.EXAMPLE_MIN_TRIALS),
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
