// Copy and the worked example for /resources/send-back-cost-check.
//
// The MATHS is in src/lib/sendBackCost.ts. This file holds only words and the
// example's figures, so changing a sentence is not a change to a formula.
//
// The example is also a test fixture: src/lib/sendBackCost.test.ts builds the
// same model independently from the brief and asserts the same outputs, and
// tools/send-back-cost-check/verify_xlsx.py asserts the workbook agrees.

import { blankModel, blankPath, type SendBackModel, type SendBackPath, type PathKind } from '../lib/sendBackCost.ts';   // explicit .ts: node's type-stripping resolver will not guess it

export const EXAMPLE_LABEL =
  'Illustrative example: a scheduling agent. Not a real system or real figures.';

/** Section 6 of the brief, as a model. */
export function buildExample(): SendBackModel {
  const m = blankModel();
  m.cleanRun = 43_300;
  m.alwaysOnChecks = 11_500;
  m.peakTasksPerMinute = 200;
  m.quotaPerMinute = 10_000_000;
  m.budget = 120_000;
  m.enforcement = 'Per task, across all rounds';
  m.pricePerMillion = null;

  const put = (kind: PathKind, patch: Partial<SendBackPath>) => {
    const i = m.paths.findIndex((p) => p.kind === kind);
    m.paths[i] = { ...blankPath(kind), ...patch, kind };
  };

  // The rate limit is capped and quiet at normal load: 0 average rounds is a
  // measurement, not a blank. It is what makes the worst case diverge from the
  // typical cost.
  put('transport', {
    present: true,
    billed: false,
    averageRounds: 0,
    repeated: 16_700,
    review: 0,
    growth: 0,
    maxRounds: 3,
    afterLast: 'Fails and tells the user',
    owner: 'Platform team',
  });
  // The judge reads every draft and sends about two per task back. Its review
  // call is large because it reads the whole output, and the redo carries the
  // critique forward.
  put('judge', {
    present: true,
    billed: true,
    averageRounds: 2,
    repeated: 8_900,
    review: 11_500,
    growth: 1_500,
    maxRounds: 3,
    afterLast: 'Hands to a human',
    owner: 'Platform team',
  });
  return m;
}

export const EXAMPLE: SendBackModel = buildExample();

export const WORKFLOW_INPUTS = [
  {
    id: 'i-clean',
    label: 'Tokens for one clean run',
    hint: 'Input and output, for a task nothing sent back.',
  },
  {
    id: 'i-always',
    label: 'Always-on checks',
    hint: 'Checks that run on every task even when they pass. 0 if none.',
  },
  {
    id: 'i-peak',
    label: 'Peak tasks per minute',
    hint: 'The busiest minute you expect.',
  },
  {
    id: 'i-quota',
    label: 'Tokens-per-minute quota',
    hint: 'The shared limit this workflow draws from.',
  },
] as const;

export interface HowToFind {
  title: string;
  /** Each point may carry inline markup, so the page renders them as HTML. */
  points: string[];
}

export const HOW_TO_FIND: HowToFind[] = [
  {
    title: 'Tokens for one clean run',
    points: [
      'Open your tracing tool, for example Langfuse, LangSmith or Arize Phoenix, and filter to tasks that finished with nothing sent back.',
      'Take 20 to 50 of them and use the <b>median</b> of total input plus output tokens.',
      'No tracing? Every model API response carries a usage field with input and output token counts. Log it with a task id for a day, then add up the calls per task.',
    ],
  },
  {
    title: 'Always-on checks',
    points: [
      'In the same traces, find the judge, validator or guardrail calls that ran on the first attempt, and take their median tokens.',
      'If the check is code rather than a model, a JSON schema check for instance, its token cost is 0.',
    ],
  },
  {
    title: 'Average rounds per task, per path',
    points: [
      'Take a normal week and count send-backs divided by tasks.',
      '<b>Judge:</b> failed verdicts in your judge or eval logs.',
      '<b>Validation:</b> parse errors, schema failures and guardrail blocks that triggered a redo.',
      '<b>Tool error:</b> tool calls that returned an error and made the agent re-plan or retry.',
      '<b>Human:</b> items sent back divided by items reviewed, from your review queue.',
      '<b>Transport refusal:</b> 429, 503 and timeout counts from your client or gateway logs. Use a normal hour, which is usually close to 0. The peak matters for the worst case, not for the typical cost.',
    ],
  },
  {
    title: 'Work repeated',
    points: [
      'Find out what your code does after a send-back: does it restart the task, redo the step, or retry the call only? The answer is in your orchestrator or retry code.',
      'Then add up, from traces, the tokens of the steps that run again.',
      '<b>Hidden repeat — model SDK retries.</b> Many SDKs retry some errors automatically, often twice by default. Those stack on top of any retries your own code makes.',
      '<b>Hidden repeat — graph re-entry.</b> A graph framework looping back to an earlier node repeats every node in between.',
    ],
  },
  {
    title: 'Review call',
    points: [
      "The judge's or checker's token count on a redo, from the same trace.",
      'A judge usually reads the whole output plus a rubric, so its input is large.',
    ],
  },
  {
    title: 'Context growth',
    points: [
      'In one trace with a send-back, compare the input tokens of the first attempt with those of the redo. The difference is the growth: the note, the error or the rejected draft carried forward.',
      'If each round keeps all earlier notes, growth rises every round. Enter the average growth, or the last round’s growth for a cautious number.',
    ],
  },
  {
    title: 'Max rounds per task',
    points: [
      'Your retry settings, the loop limit in your orchestrator (graph frameworks usually have a recursion or step limit), and your SDK’s retry setting.',
      'If a path has no explicit limit in your code, leave the cap blank. The tool will show the worst case as unbounded, and that is the finding.',
    ],
  },
  {
    title: 'Peak tasks per minute',
    points: [
      'The busiest minute in the last 30 days from your app metrics. Use the 99th-percentile minute, not the average.',
      'Pre-launch: use your launch estimate and mark it as an estimate.',
    ],
  },
  {
    title: 'Tokens-per-minute quota',
    points: [
      'The limits page in your model provider’s console, for your account tier and model.',
      'Most providers also return rate-limit headers on each response showing the limit and what remains.',
      'Note who else draws on the same key or organisation. The quota is usually shared.',
    ],
  },
  {
    title: 'Per-task budget',
    points: [
      'Your own code or gateway config.',
      'If nothing stops a task at a token total, the answer is "Not enforced".',
    ],
  },
  {
    title: 'Price per million tokens',
    points: [
      'Your provider’s pricing page. Input and output are priced differently.',
      'Blend them by your own ratio of input to output tokens, taken from traces.',
    ],
  },
  {
    title: 'No data yet?',
    points: [
      'Use estimates and label them as estimates.',
      'The check still shows which paths and which caps are missing. That is often the more useful finding.',
    ],
  },
];
