// The Agent Authority Review — the undo-cost scale, the five questions, the
// reading rules and three worked examples.
//
// Source of truth for /resources/agent-authority-review. Transcribed from the
// field note rather than summarised: the value of the three example tables is
// that somebody already did the work of deciding who owns each step and why,
// and a paraphrase of "Model / Code" or "Human (rule in code)" is not the same
// artifact.
//
// The closing call to action does NOT live here. Cohort length and seat count
// come from facts.ts at render time — the source document said five weeks,
// facts.ts says six, and a resource that restates an offer fact is exactly how
// that drift happens.

export type UndoLevel = 'R0' | 'R1' | 'R2' | 'R3';

export interface UndoBand {
  level: UndoLevel;
  headline: string;
  examples: string;
}

/** The four levels. Assigned per action, before anyone argues about owners. */
export const UNDO_SCALE: UndoBand[] = [
  {
    level: 'R0',
    headline: 'Undo in seconds. Nobody notices.',
    examples:
      'Read a log. Add a few servers. Draft a message. Produce a list of possible causes.',
  },
  {
    level: 'R1',
    headline: 'Undo with some effort. Stays inside the team.',
    examples:
      'Turn a config flag off. Put a job back in the queue. Restart a pod. Revert a small, clean commit.',
  },
  {
    level: 'R2',
    headline: 'Can be fixed, but customers or auditors will see it.',
    examples:
      'Roll back a deploy that changed data. A support message already sent. An alert that was never raised.',
  },
  {
    level: 'R3',
    headline: 'Cannot be undone.',
    examples:
      'A payment sent. A database migration run. A record deleted. A public API released. Something a customer has already been told.',
  },
];

export interface Question {
  n: string;
  name: string;
  body: string;
}

/** Asked for every step. Never for the workflow as a whole. */
export const FIVE_QUESTIONS: Question[] = [
  {
    n: '1',
    name: 'Evidence',
    body: 'What must be true before this step runs? And can I confirm it was actually checked, not guessed? If the input was invented earlier, the policy check later will still pass. That check is then only for show.',
  },
  {
    n: '2',
    name: 'Judgment',
    body: 'Is there one right answer, or can two good engineers disagree? If they can disagree, you need an eval set. If they cannot, you need a rule in code, not a model.',
  },
  {
    n: '3',
    name: 'Hard limit',
    body: 'What must not bend here, however good the explanation sounds? Write it as a fixed check in code, placed where no argument can go around it.',
  },
  {
    n: '4',
    name: 'Undo cost',
    body: 'If this step acts wrongly, is it R0, R1, R2 or R3?',
  },
  {
    n: '5',
    name: 'Repeat',
    body: 'If this step runs a second time because we never learnt the result of the first run, what happens? In production, the second action usually does more damage than the first.',
  },
];

/** The worksheet columns, in fill order. Evidence and Undo cost go first. */
export const WORKSHEET_COLUMNS = [
  'Step',
  'Evidence needed',
  'Who decides (code / model / human)',
  'What it may do',
  'What happens if evidence is missing',
  'Undo cost',
];

export interface ReadingRule {
  when: string;
  then: string;
  body: string;
  /** Marks the rule that stops the exercise rather than routing a row. */
  stop?: boolean;
}

/** Applied only once the table is full, never while filling it. */
export const READING_RULES: ReadingRule[] = [
  {
    when: 'One right answer, any undo cost',
    then: 'use code',
    body: 'A rule is cheaper, faster and easier to audit. Do not spend a model on a check that a simple condition can do. Most rows will land here. That is a good result, not a disappointing one.',
  },
  {
    when: 'Engineers can disagree, undo cost R0 or R1',
    then: 'use an agent, with an eval set',
    body: 'This is where an agent is actually worth it: real judgment needed, and cheap to be wrong. Build the eval set before you build the agent.',
  },
  {
    when: 'Engineers can disagree, undo cost R2 or R3',
    then: 'agent suggests, human approves',
    body: '"Not yet" means until you have a log of real production failures. It does not mean until the demo looks good.',
  },
  {
    when: 'Any row where you cannot answer question 5',
    then: 'stop',
    body: 'Handling repeats is not a phase-two item. It is the difference between one failover and two.',
    stop: true,
  },
];

export interface ExampleRow {
  step: string;
  evidence: string;
  decides: string;
  may: string;
  missing: string;
  undo: string;
}

export interface WorkedExample {
  id: string;
  letter: string;
  title: string;
  rows: ExampleRow[];
  /** The rows the author would not hand over yet, and the reasoning. */
  notYet: { name: string; body: string }[];
}

export const EXAMPLES: WorkedExample[] = [
  {
    id: 'incident-triage',
    letter: 'A',
    title: 'Incident triage and fixing',
    rows: [
      {
        step: 'Collect signals',
        evidence: 'Deploy log, alerts, health of dependencies, service owner list',
        decides: 'Code',
        may: 'Read only',
        missing: 'Say which signal is missing and lower the confidence. Do not fill the gap.',
        undo: 'R0',
      },
      {
        step: 'Line up the timeline',
        evidence: 'Deploy and alert timestamps that were actually read',
        decides: 'Code',
        may: 'Give a likely time window',
        missing: 'Widen the window. Never narrow it on partial data.',
        undo: 'R0',
      },
      {
        step: 'Rank possible causes',
        evidence: 'The signals above, with evidence attached to each cause',
        decides: 'Model',
        may: 'A ranked list, each item showing its evidence, plus a clear "not enough evidence" option',
        missing: 'Return "not enough evidence" as a proper answer',
        undo: 'R0',
      },
      {
        step: 'Decide whether to page someone',
        evidence: 'Severity rules, owner, customer impact signal',
        decides: 'Human (rule in code)',
        may: 'The agent may ask for a page. It may not stop one.',
        missing: 'Page by default',
        undo: 'R2',
      },
      {
        step: 'Suggest a fix',
        evidence: 'The chosen cause, what it will affect, and the command to reverse it',
        decides: 'Model',
        may: 'Write the plan, including how to undo it',
        missing: 'Refuse to suggest an action that has no known way back',
        undo: 'R0',
      },
      {
        step: 'Act: add capacity or fail over inside a tier',
        evidence: 'Plan approved, run ID created, earlier run checked',
        decides: 'Model / Code',
        may: 'Act',
        missing: 'Do not act when the earlier state is unknown. Check first.',
        undo: 'R1',
      },
      {
        step: 'Act: roll back a deploy with a migration, change a Tier-0 service, or act during a freeze',
        evidence: 'All of the above, plus a human approval',
        decides: 'Human',
        may: 'Agent prepares the command. Human runs it.',
        missing: 'Escalate',
        undo: 'R3',
      },
      {
        step: 'Confirm and close',
        evidence: 'Signals recovered and stayed recovered for a fixed period',
        decides: 'Code + Human',
        may: 'Confirm',
        missing: 'Keep the incident open. Never close it just because alerts stopped.',
        undo: 'R1',
      },
    ],
    notYet: [
      {
        name: 'Stopping a page',
        body: 'This is the only decision here that gives you no feedback. If the agent pages too often, everyone notices. If it wrongly decides not to page, nobody ever finds out. You cannot build an eval set from outcomes you never saw. So until you can measure the misses, the agent only suggests and the rule decides.',
      },
      {
        name: 'Any action above R1',
        body: 'The risk is not an agent that thinks badly. It is an agent that thinks well about the cause, then runs an action whose side effects were never part of what it looked at. "Roll back the deploy" sounds like one action. A rollback that also reverses a database migration is a completely different action with the same name.',
      },
    ],
  },
  {
    id: 'refunds',
    letter: 'B',
    title: 'Refunds and goodwill credit',
    rows: [
      {
        step: 'Check the order, the payment status and past refunds',
        evidence: 'Order system and ledger, read directly',
        decides: 'Code',
        may: 'Read only',
        missing: 'Stop. No refund on an unconfirmed state.',
        undo: 'R0',
      },
      {
        step: 'Understand what the customer is saying',
        evidence: 'Chat or call transcript, order history',
        decides: 'Model',
        may: 'Summarise the complaint, and clearly separate what the customer claims from what we have confirmed',
        missing: 'Mark it as unconfirmed and carry on. A believable story is not proof.',
        undo: 'R0',
      },
      {
        step: 'Check refund policy',
        evidence: 'The policy version that applied on the purchase date',
        decides: 'Code',
        may: 'Pass or fail',
        missing: 'Not eligible means no refund',
        undo: 'R0',
      },
      {
        step: 'Decide the amount, within a set band',
        evidence: 'Eligibility, customer tier, earlier credits given',
        decides: 'Model under a hard cap',
        may: 'Suggest an amount inside the band',
        missing: 'Suggest the lowest amount and flag for review',
        undo: 'R3',
      },
      {
        step: 'Decide an amount above the band, or any exception to policy',
        evidence: 'All of the above',
        decides: 'Human',
        may: 'Agent writes the reasoning. Human decides.',
        missing: 'Escalate',
        undo: 'R3',
      },
      {
        step: 'Send the refund',
        evidence: 'Approved amount, plus a unique key made from order ID and reason code',
        decides: 'Code',
        may: 'Send once',
        missing: "Never send when the earlier attempt's result is unknown. Check first, then act.",
        undo: 'R3',
      },
      {
        step: 'Record what was decided',
        evidence: 'Decision, amount, reason code',
        decides: 'Code + weekly human review',
        may: 'Log it',
        missing: '—',
        undo: 'R1',
      },
    ],
    notYet: [
      {
        name: 'Amounts above the band',
        body: 'An agent that is rewarded for closing tickets quickly will learn to give money away to make complaints go away. You will not see this in the transcript, which reads very well. You will see it in next quarter’s refund numbers. This is not a guardrail problem. It is a problem with what you asked the agent to optimise for, and better prompts will not fix it.',
      },
      {
        name: 'Exceptions to policy',
        body: 'The eligibility check is the one thing here that must not bend. The moment a good enough story can create an exception, the policy has stopped being a control and become a suggestion.',
      },
      {
        name: 'The record step',
        body: 'Most teams skip it. Every goodwill refund teaches customers what to ask for next time. This is the row that adds up over months.',
      },
    ],
  },
  {
    id: 'pr-merge',
    letter: 'C',
    title: 'Automatic pull request merge',
    rows: [
      {
        step: 'Run CI, tests and static analysis',
        evidence: 'Green build on the merge commit, not on the branch head',
        decides: 'Code',
        may: 'Pass or fail',
        missing: 'Fail closed',
        undo: 'R0',
      },
      {
        step: 'Compare what the code does with what the PR says it does',
        evidence: 'The diff, the description, the linked ticket',
        decides: 'Model',
        may: 'Flag it when the two do not match',
        missing: 'Flag as "cannot review"',
        undo: 'R0',
      },
      {
        step: 'Check owners and approvals',
        evidence: 'CODEOWNERS file, approval records',
        decides: 'Code',
        may: 'Pass or fail',
        missing: 'Fail closed',
        undo: 'R0',
      },
      {
        step: 'Merge a low-risk change',
        evidence:
          'No migration, no auth or payment code, no public API change, and the revert is one clean commit',
        decides: 'Model / Code',
        may: 'Merge',
        missing: 'Do not merge. Ask for a review.',
        undo: 'R1',
      },
      {
        step: 'Merge anything touching auth, payments, migrations or a public API',
        evidence: 'All of the above',
        decides: 'Human',
        may: 'Agent prepares and summarises. Human merges.',
        missing: 'Escalate',
        undo: 'R3',
      },
      {
        step: 'Trigger the deploy',
        evidence: 'Merge done, deploy window open',
        decides: 'A separate decision, with its own owner',
        may: '—',
        missing: '—',
        undo: 'R2–R3',
      },
    ],
    notYet: [
      {
        name: 'Anything touching auth, payments, migrations or a public API',
        body: 'Once a migration has run or an API is public, undoing it is not the reverse of doing it. Also, judging whether the code matches the description is exactly the task where models sound most confident and are most often wrong. Both the description and the diff read well on their own. The gap between them is the bug.',
      },
      {
        name: 'The deploy trigger',
        body: 'Keep it as its own row with its own owner. Teams that merge and deploy in one step have given away deploy authority without ever discussing it. This is the most common accidental handover I see, and it never shows up in an architecture diagram, because it lives in a CI config file.',
      },
    ],
  },
];

export interface ProtocolStep {
  n: string;
  name: string;
  minutes: string;
  body: string;
}

/** Forty minutes, on a workflow you already own. */
export const PROTOCOL: ProtocolStep[] = [
  {
    n: '1',
    name: 'List the steps. Decide nothing.',
    minutes: '10 min',
    body: 'Do not assign owners yet. Your first guess will be wrong and it will bias everything after it.',
  },
  {
    n: '2',
    name: 'Fill only two columns: Evidence and Undo cost.',
    minutes: '10 min',
    body: 'Every row, before anyone says the word "agent".',
  },
  {
    n: '3',
    name: 'Mark the rows where two good engineers could disagree.',
    minutes: '5 min',
    body: 'Judgment is the axis that decides whether a model belongs here at all.',
  },
  {
    n: '4',
    name: 'Apply the reading rules.',
    minutes: '10 min',
    body: 'Only now. Applying them while you fill the table is how the table ends up agreeing with whatever you already thought.',
  },
  {
    n: '5',
    name: 'Circle every row where you cannot answer question 5.',
    minutes: '5 min',
    body: 'Those are the rows that turn one failover into two.',
  },
];

export const PROTOCOL_FINDING =
  'What you will usually find: fewer agent rows than you expected, several rows that should have been plain code all along, and at least one action that cannot be undone and has never had a named owner.';
