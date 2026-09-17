// The Agent Authority Review — the undo-cost scale, the five questions, the
// rubric that turns three answers into an owner, and three worked examples.
//
// Source of truth for /resources/agent-authority-review and for the PDF that
// /api/pipeline/resource-pdf hands out. The page's script imports this module
// too (Vite bundles it), so the live owner beside each step, the summary, the
// copied sheet and the PDF all read one rubric: `readRow()` and `readSheet()`.
//
// Rewritten as an interactive tool on 17 September 2026. Until then the page
// was a transcription of the field note: a blank table to print and three
// filled ones to read. The reading rules were prose at the foot of the page,
// applied by hand. They are now `readRow()`, and every surface calls it.
//
// The closing call to action does NOT live here. Cohort length and seat count
// come from facts.ts at render time, so this page cannot drift from the rest
// of the site the way a checked-in PDF silently would.

export const TOOL_NAME = 'The Agent Authority Review';

/** The heading on the page. Says what the tool does, not what it is called. */
export const HEADLINE = "Decide the agent's authority";

/** What the tool is for, in four lines. Printed above the sheet. */
export const PURPOSE = [
  'You have a workflow, and someone wants to hand part of it to an AI agent. This tool decides which steps the agent may own, which it may only suggest on, and which stay as plain code.',
  'It works one step at a time. For each step you answer three questions: is there one right answer, how hard is a wrong action to undo, and what happens if the step runs twice.',
  'The rubric turns those three answers into an owner for the step: code, an agent, or an agent that suggests while a human approves. The owner appears beside the step as you answer.',
  'The result is an authority map for the whole workflow: how many steps the agent acts on alone, how many it only suggests on, and which steps cannot go further yet.',
];

/** How to use it, as numbered steps. */
export const HOW_TO_USE = [
  'Pick one workflow you own. A runbook, a support flow, a release path. Not the most interesting one, the one you know best.',
  'Type each step of the workflow into the sheet, one per row. Decide nothing yet. The first guess about owners is usually wrong and it biases everything after it.',
  'For every row, fill Evidence and Undo cost first. Only then answer Judgment and Repeat.',
  'Watch the owner beside each step and the tally in the bar at the top. Both update as you answer.',
  'Read the result at the end. Then copy the sheet, print it, or get the PDF of your assessment.',
];

// ---------------------------------------------------------------------------
// Undo cost
// ---------------------------------------------------------------------------

export type UndoLevel = 'R0' | 'R1' | 'R2' | 'R3';

export const UNDO_LEVELS: UndoLevel[] = ['R0', 'R1', 'R2', 'R3'];

export interface UndoBand {
  level: UndoLevel;
  /** The one-line meaning, as shown in the legend beside every row. */
  short: string;
  /** Two or three words, for the sticky bar on a phone. */
  terse: string;
  /** The full headline, as shown in the scale. */
  headline: string;
  examples: string;
}

/** The four levels. Assigned per action, before anyone argues about owners. */
export const UNDO_SCALE: UndoBand[] = [
  {
    level: 'R0',
    terse: 'seconds',
    short: 'Undo in seconds',
    headline: 'Undo in seconds. Nobody notices.',
    examples:
      'Read a log. Add a few servers. Draft a message. Produce a list of possible causes.',
  },
  {
    level: 'R1',
    terse: 'effort, in team',
    short: 'Undo with effort, inside the team',
    headline: 'Undo with some effort. Stays inside the team.',
    examples:
      'Turn a config flag off. Put a job back in the queue. Restart a pod. Revert a small, clean commit.',
  },
  {
    level: 'R2',
    terse: 'customers see it',
    short: 'Fixable, but customers or auditors see it',
    headline: 'Can be fixed, but customers or auditors will see it.',
    examples:
      'Roll back a deploy that changed data. A support message already sent. An alert that was never raised.',
  },
  {
    level: 'R3',
    terse: 'no undo',
    short: 'Cannot be undone',
    headline: 'Cannot be undone.',
    examples:
      'A payment sent. A database migration run. A record deleted. A public API released. Something a customer has already been told.',
  },
];

/**
 * What undo cost means and why it is the score. Printed above the scale, and
 * in the PDF. Each entry is one short paragraph.
 */
export const UNDO_EXPLAINED = [
  {
    lead: 'Undo cost is the price of a wrong action, not the chance of one.',
    body: 'Ask: if this step runs wrongly at 3 pm on a Tuesday, what does it take to put things back, and who sees it happen? The answer is a level from R0 to R3. It has nothing to do with how good the model is.',
  },
  {
    lead: 'It is a separate limit from model quality, and you have to set both.',
    body: 'How good the model is decides how much thinking you hand over. How hard an action is to undo decides how much authority you hand over. A demo that finds the cause of an outage in ninety seconds proves the first. It says nothing about the second.',
  },
  {
    lead: 'The line is almost always between R1 and R2.',
    body: 'Below the line, a wrong action is fixed inside the team and the customer never knows. Above it, somebody outside the team sees the mistake, or nobody can fix it at all. Above the line the agent only suggests. Below it the agent may act.',
  },
  {
    lead: 'Score the action, not the step name.',
    body: '"Roll back the deploy" sounds like one action. A rollback that also reverses a database migration is a different action with the same name, and a different level. If one step hides two actions with two levels, split it into two rows.',
  },
];

// ---------------------------------------------------------------------------
// The five questions, and the answers the sheet accepts
// ---------------------------------------------------------------------------

export type EvidenceAnswer = 'confirmed' | 'guessed';
export type JudgmentAnswer = 'one' | 'disagree';
export type RepeatAnswer = 'known' | 'unknown';

export interface Choice<T extends string> {
  value: T;
  /** The label on the button. Three or four words. */
  label: string;
  /** What choosing it means, shown as the button's title and in the legend. */
  means: string;
}

export const EVIDENCE_CHOICES: Choice<EvidenceAnswer>[] = [
  {
    value: 'confirmed',
    label: 'Checked',
    means: 'The step reads its input from the system of record, and a check confirms it was read, not assumed.',
  },
  {
    value: 'guessed',
    label: 'Assumed',
    means: 'The input comes from an earlier step, a transcript or a claim, and nothing confirms it before this step runs.',
  },
];

export const JUDGMENT_CHOICES: Choice<JudgmentAnswer>[] = [
  {
    value: 'one',
    label: 'One right answer',
    means: 'Given the same input, two good engineers would decide the same thing. This is a rule.',
  },
  {
    value: 'disagree',
    label: 'Engineers can disagree',
    means: 'Two good engineers could look at the same input and decide differently, and both could be right.',
  },
];

export const REPEAT_CHOICES: Choice<RepeatAnswer>[] = [
  {
    value: 'known',
    label: 'Safe or detected',
    means: 'Running the step twice does the same thing as running it once, or the second run sees the first and stops.',
  },
  {
    value: 'unknown',
    label: 'Cannot say',
    means: 'Nobody can say what a second run does. This is the answer that stops the row.',
  },
];

export interface Question {
  n: string;
  name: string;
  /** The question, as read aloud. */
  ask: string;
  /** Why it is on the sheet. */
  why: string;
  /** The column of the sheet this question fills. */
  column: string;
}

/** Asked for every step. Never for the workflow as a whole. */
export const FIVE_QUESTIONS: Question[] = [
  {
    n: '1',
    name: 'Evidence',
    ask: 'What must be true before this step runs, and can you confirm it was checked rather than guessed?',
    why: 'If the input was invented by an earlier step, every check after it still passes. Those checks are then only for show.',
    column: 'Evidence needed, and whether it is checked',
  },
  {
    n: '2',
    name: 'Judgment',
    ask: 'Is there one right answer, or can two good engineers disagree?',
    why: 'If they can disagree, you need an eval set (a set of real cases with known-correct answers) before a model is safe here. If they cannot, you need a rule in code, not a model.',
    column: 'Judgment',
  },
  {
    n: '3',
    name: 'Hard limit',
    ask: 'What must not bend here, however good the explanation sounds?',
    why: 'Write it as a fixed check in code, placed where no argument can go around it. A limit that lives in a prompt is a suggestion.',
    column: 'Hard limit',
  },
  {
    n: '4',
    name: 'Undo cost',
    ask: 'If this step acts wrongly, is it R0, R1, R2 or R3?',
    why: 'This is the score. It decides how much authority the step can carry, whatever the model can do.',
    column: 'Undo cost',
  },
  {
    n: '5',
    name: 'Repeat',
    ask: 'If this step runs a second time because nobody learnt the result of the first run, what happens?',
    why: 'A tool call that times out instead of failing is the most common agent incident. The system does not know whether the action happened, retries, and does it twice. The second action usually does more damage than the first.',
    column: 'Repeat',
  },
];

// ---------------------------------------------------------------------------
// The sheet
// ---------------------------------------------------------------------------

/** One step of a workflow, as keyed into the sheet. */
export interface SheetRow {
  step: string;
  evidence: string;
  checked: EvidenceAnswer | null;
  judgment: JudgmentAnswer | null;
  limit: string;
  undo: UndoLevel | null;
  repeat: RepeatAnswer | null;
  /** What the step does when the evidence is missing. Optional. */
  missing: string;
}

export const blankRow = (): SheetRow => ({
  step: '',
  evidence: '',
  checked: null,
  judgment: null,
  limit: '',
  undo: null,
  repeat: null,
  missing: '',
});

/** The sheet opens with this many empty rows. */
export const START_ROWS = 3;

/** A workflow with more steps than this is two workflows. */
export const MAX_ROWS = 12;

/** Longest text the sheet, the PDF and the copied sheet accept per field. */
export const FIELD_MAX = { step: 120, evidence: 240, limit: 240, missing: 240 } as const;

// ---------------------------------------------------------------------------
// The rubric: three answers become one owner
// ---------------------------------------------------------------------------

export type OwnerKey = 'code' | 'agent' | 'suggest' | 'stop' | 'incomplete';

export interface Rule {
  key: OwnerKey;
  /** The condition, as printed in the rubric. */
  when: string;
  /** The owner, as printed beside the step. */
  owner: string;
  /** What the owner may do. Printed in the summary and the PDF. */
  may: string;
  body: string;
}

/**
 * The reading rules, in the order `readRow()` applies them. The stop rule is
 * tested first because it overrides the other three: a step whose repeat
 * behaviour is unknown has no safe owner, whatever the judgment says.
 */
export const RUBRIC: Rule[] = [
  {
    key: 'stop',
    when: 'Repeat is "cannot say", whatever else is true',
    owner: 'Stop',
    may: 'Nothing, until you can say what a second run does.',
    body: 'Handling a repeat is not a phase-two item. It is the difference between one failover and two. Find out what a second run does before you give this row to anyone.',
  },
  {
    key: 'code',
    when: 'One right answer, any undo cost',
    owner: 'Code',
    may: 'Pass or fail. A rule, with no model in the path.',
    body: 'A rule is cheaper, faster and easier to audit than a model. Do not spend a model on a check that a simple condition can do. Most rows land here. That is a good result, not a disappointing one.',
  },
  {
    key: 'agent',
    when: 'Engineers can disagree, undo cost R0 or R1',
    owner: 'Agent, with an eval set',
    may: 'Act on its own, once the eval set exists.',
    body: 'This is where an agent earns its place: real judgment is needed, and a wrong call is cheap to undo. Build the eval set before you build the agent, not after.',
  },
  {
    key: 'suggest',
    when: 'Engineers can disagree, undo cost R2 or R3',
    owner: 'Agent suggests, human approves',
    may: 'Prepare the action and the reasoning. A named person approves.',
    body: '"Not yet" means until you have a log of real production failures for this step. It does not mean until the demo looks good.',
  },
];

export const ruleFor = (key: OwnerKey): Rule | undefined => RUBRIC.find((r) => r.key === key);

export interface RowRead {
  key: OwnerKey;
  /** The owner as printed beside the step. "Not decided" until the three answers are in. */
  owner: string;
  /** Which answers are still missing, in the order the sheet asks them. */
  missing: ('undo' | 'judgment' | 'repeat')[];
  /** Warnings that do not change the owner but must be read with it. */
  flags: string[];
}

/**
 * Read one row against the rubric. One function, used by the page's script,
 * the summary and the PDF, so the three cannot disagree about an owner.
 *
 * The step name and the free-text fields do not change the owner. Three
 * answers do, and a row with any of the three missing is `incomplete`.
 */
export function readRow(row: SheetRow): RowRead {
  const missing: RowRead['missing'] = [];
  if (row.undo === null) missing.push('undo');
  if (row.judgment === null) missing.push('judgment');
  if (row.repeat === null) missing.push('repeat');

  const flags: string[] = [];
  if (row.checked === 'guessed') {
    flags.push(
      'The input is assumed, not checked. Every check after this step is for show until the input is confirmed.',
    );
  }
  if (row.undo === 'R3') {
    flags.push('Cannot be undone. This step needs a named owner. Put the name in the hard limit.');
  }

  if (missing.length) return { key: 'incomplete', owner: 'Not decided', missing, flags };

  let key: OwnerKey;
  if (row.repeat === 'unknown') key = 'stop';
  else if (row.judgment === 'one') key = 'code';
  else if (row.undo === 'R0' || row.undo === 'R1') key = 'agent';
  else key = 'suggest';

  return { key, owner: ruleFor(key)!.owner, missing: [], flags };
}

export type SheetOutcomeKey = 'none' | 'progress' | 'stop' | 'decided';

export interface SheetRead {
  /** Rows that carry a step name or any answer. Empty rows are not counted. */
  total: number;
  decided: number;
  counts: Record<'code' | 'agent' | 'suggest' | 'stop', number>;
  /** The highest undo level on a row the agent may act on alone. Null when none. */
  agentCeiling: UndoLevel | null;
  /** Rows with undo R3, by index. Each needs a named owner. */
  irreversible: number[];
  /** Rows whose evidence is assumed, by index. */
  assumed: number[];
  /** Rows the rubric stopped, by index. */
  stopped: number[];
  outcome: { key: SheetOutcomeKey; name: string; what: string };
  rows: RowRead[];
}

const isUsed = (r: SheetRow): boolean =>
  r.step.trim() !== '' ||
  r.evidence.trim() !== '' ||
  r.limit.trim() !== '' ||
  r.missing.trim() !== '' ||
  r.checked !== null ||
  r.judgment !== null ||
  r.undo !== null ||
  r.repeat !== null;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Read the whole sheet. The outcome is the rubric applied to the workflow:
 * any stopped row stops the handover; otherwise the result is the split of
 * owners, said in numbers.
 */
export function readSheet(rows: SheetRow[]): SheetRead {
  const used = rows.map((r, i) => ({ r, i })).filter((x) => isUsed(x.r));
  const reads = rows.map(readRow);

  const counts = { code: 0, agent: 0, suggest: 0, stop: 0 };
  let agentCeiling: UndoLevel | null = null;
  const irreversible: number[] = [];
  const assumed: number[] = [];
  const stopped: number[] = [];

  for (const { r, i } of used) {
    const read = reads[i];
    if (read.key !== 'incomplete') counts[read.key] += 1;
    if (read.key === 'agent' && r.undo) {
      if (!agentCeiling || UNDO_LEVELS.indexOf(r.undo) > UNDO_LEVELS.indexOf(agentCeiling)) agentCeiling = r.undo;
    }
    if (r.undo === 'R3') irreversible.push(i);
    if (r.checked === 'guessed') assumed.push(i);
    if (read.key === 'stop') stopped.push(i);
  }

  const total = used.length;
  const decided = counts.code + counts.agent + counts.suggest + counts.stop;

  let outcome: SheetRead['outcome'];
  if (total === 0) {
    outcome = {
      key: 'none',
      name: 'Not started',
      what: 'Type the first step of your workflow to begin. Each row needs three answers: undo cost, judgment and repeat.',
    };
  } else if (decided < total) {
    const left = total - decided;
    outcome = {
      key: 'progress',
      name: 'In progress',
      what: `${plural(left, 'step is', 'steps are')} not decided yet. A step is decided once undo cost, judgment and repeat are all answered.`,
    };
  } else if (stopped.length) {
    outcome = {
      key: 'stop',
      name: 'Stop before any handover',
      what: `${plural(stopped.length, 'step has', 'steps have')} an unknown repeat cost. Until you can say what a second run does, nothing on this sheet is safe to hand to an agent. Answer question 5 on ${stopped.length === 1 ? 'that row' : 'those rows'} first.`,
    };
  } else {
    const parts = [
      `Code owns ${plural(counts.code, 'step', 'steps')}.`,
      counts.agent
        ? `The agent acts alone on ${plural(counts.agent, 'step', 'steps')}, ${counts.agent === 1 ? 'at' : 'none above'} ${agentCeiling}, once the eval set exists.`
        : 'The agent acts alone on no step.',
      counts.suggest
        ? `On ${plural(counts.suggest, 'step', 'steps')} the agent suggests and a named person approves.`
        : 'No step needs a human approval path.',
    ];
    outcome = { key: 'decided', name: 'Authority decided', what: parts.join(' ') };
  }

  return { total, decided, counts, agentCeiling, irreversible, assumed, stopped, outcome, rows: reads };
}

// ---------------------------------------------------------------------------
// Reference examples
// ---------------------------------------------------------------------------

export interface ExampleRow extends SheetRow {
  /** The author's own call for the row, as written in the note. */
  decides: string;
  /** What the author lets the owner do. */
  may: string;
}

export interface WorkedExample {
  id: string;
  letter: string;
  title: string;
  /** One line on the workflow, printed under the title. */
  setting: string;
  rows: ExampleRow[];
  /** The rows the author would not hand over yet, and the reasoning. */
  notYet: { name: string; body: string }[];
  /** Anything the sheet cannot carry exactly as the note wrote it. */
  caveat?: string;
}

export const EXAMPLES: WorkedExample[] = [
  {
    id: 'incident-triage',
    letter: 'A',
    title: 'Incident triage and fixing',
    setting:
      'An agent watches alerts, works out the likely cause of an outage, and proposes or runs a fix.',
    rows: [
      {
        step: 'Collect signals',
        evidence: 'Deploy log, alerts, health of dependencies, service owner list',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'Read only. No write to any system.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Say which signal is missing and lower the confidence. Do not fill the gap.',
        decides: 'Code',
        may: 'Read only',
      },
      {
        step: 'Line up the timeline',
        evidence: 'Deploy and alert timestamps that were actually read',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'Never narrow the time window on partial data.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Widen the window. Never narrow it on partial data.',
        decides: 'Code',
        may: 'Give a likely time window',
      },
      {
        step: 'Rank possible causes',
        evidence: 'The signals above, with evidence attached to each cause',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'Every cause shows its evidence. "Not enough evidence" is always an allowed answer.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Return "not enough evidence" as a proper answer.',
        decides: 'Model',
        may: 'A ranked list, each item showing its evidence, plus a clear "not enough evidence" option',
      },
      {
        step: 'Decide whether to page someone',
        evidence: 'Severity rules, owner, customer impact signal',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'The agent may ask for a page. It may never stop one.',
        undo: 'R2',
        repeat: 'known',
        missing: 'Page by default.',
        decides: 'Human (rule in code)',
        may: 'The agent may ask for a page. It may not stop one.',
      },
      {
        step: 'Suggest a fix',
        evidence: 'The chosen cause, what it will affect, and the command to reverse it',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'No plan without a way back.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Refuse to suggest an action that has no known way back.',
        decides: 'Model',
        may: 'Write the plan, including how to undo it',
      },
      {
        step: 'Act: add capacity or fail over inside a tier',
        evidence: 'Plan approved, run ID created, earlier run checked',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'Never act when the result of the earlier run is unknown.',
        undo: 'R1',
        repeat: 'known',
        missing: 'Do not act when the earlier state is unknown. Check first.',
        decides: 'Model / Code',
        may: 'Act',
      },
      {
        step: 'Act: roll back a deploy with a migration, change a Tier-0 service, or act during a freeze',
        evidence: 'All of the above, plus a human approval',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'A human runs it. Always.',
        undo: 'R3',
        repeat: 'known',
        missing: 'Escalate.',
        decides: 'Human',
        may: 'Agent prepares the command. Human runs it.',
      },
      {
        step: 'Confirm and close',
        evidence: 'Signals recovered and stayed recovered for a fixed period',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'Never close an incident because the alerts stopped.',
        undo: 'R1',
        repeat: 'known',
        missing: 'Keep the incident open.',
        decides: 'Code + Human',
        may: 'Confirm',
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
    setting:
      'A support agent reads a complaint, checks the order, and decides whether money goes back to the customer.',
    rows: [
      {
        step: 'Check the order, the payment status and past refunds',
        evidence: 'Order system and ledger, read directly',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'No refund on an unconfirmed state.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Stop. No refund on an unconfirmed state.',
        decides: 'Code',
        may: 'Read only',
      },
      {
        step: 'Understand what the customer is saying',
        evidence: 'Chat or call transcript, order history',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'A claim is never treated as a confirmed fact.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Mark it as unconfirmed and carry on. A believable story is not proof.',
        decides: 'Model',
        may: 'Summarise the complaint, and clearly separate what the customer claims from what we have confirmed',
      },
      {
        step: 'Check refund policy',
        evidence: 'The policy version that applied on the purchase date',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'Not eligible means no refund. No story changes that.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Not eligible means no refund.',
        decides: 'Code',
        may: 'Pass or fail',
      },
      {
        step: 'Decide the amount, within a set band',
        evidence: 'Eligibility, customer tier, earlier credits given',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'Never above the band. The cap is in code, not in the prompt.',
        undo: 'R3',
        repeat: 'known',
        missing: 'Suggest the lowest amount and flag for review.',
        decides: 'Model under a hard cap',
        may: 'Suggest an amount inside the band',
      },
      {
        step: 'Decide an amount above the band, or any exception to policy',
        evidence: 'All of the above',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'The policy check never bends.',
        undo: 'R3',
        repeat: 'known',
        missing: 'Escalate.',
        decides: 'Human',
        may: 'Agent writes the reasoning. Human decides.',
      },
      {
        step: 'Send the refund',
        evidence: 'Approved amount, plus a unique key made from order ID and reason code',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'Send once. Never send when the result of the earlier attempt is unknown.',
        undo: 'R3',
        repeat: 'known',
        missing: 'Check the earlier attempt first, then act.',
        decides: 'Code',
        may: 'Send once',
      },
      {
        step: 'Record what was decided',
        evidence: 'Decision, amount, reason code',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'Every decision is logged, including the ones a human made.',
        undo: 'R1',
        repeat: 'known',
        missing: 'Log what is known and mark the gap.',
        decides: 'Code + weekly human review',
        may: 'Log it',
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
    setting:
      'An agent reviews a pull request, decides whether it is safe, and merges it or asks for a person.',
    rows: [
      {
        step: 'Run CI, tests and static analysis',
        evidence: 'Green build on the merge commit, not on the branch head',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'Green on the merge commit. A green branch head does not count.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Fail closed.',
        decides: 'Code',
        may: 'Pass or fail',
      },
      {
        step: 'Compare what the code does with what the PR says it does',
        evidence: 'The diff, the description, the linked ticket',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'A mismatch is always a flag, never a fix.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Flag as "cannot review".',
        decides: 'Model',
        may: 'Flag it when the two do not match',
      },
      {
        step: 'Check owners and approvals',
        evidence: 'CODEOWNERS file, approval records',
        checked: 'confirmed',
        judgment: 'one',
        limit: 'No approval, no merge.',
        undo: 'R0',
        repeat: 'known',
        missing: 'Fail closed.',
        decides: 'Code',
        may: 'Pass or fail',
      },
      {
        step: 'Merge a low-risk change',
        evidence:
          'No migration, no auth or payment code, no public API change, and the revert is one clean commit',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'Only when the revert is one clean commit.',
        undo: 'R1',
        repeat: 'known',
        missing: 'Do not merge. Ask for a review.',
        decides: 'Model / Code',
        may: 'Merge',
      },
      {
        step: 'Merge anything touching auth, payments, migrations or a public API',
        evidence: 'All of the above',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'A human merges. Always.',
        undo: 'R3',
        repeat: 'known',
        missing: 'Escalate.',
        decides: 'Human',
        may: 'Agent prepares and summarises. Human merges.',
      },
      {
        step: 'Trigger the deploy',
        evidence: 'Merge done, deploy window open',
        checked: 'confirmed',
        judgment: 'disagree',
        limit: 'The deploy is its own decision with its own owner. Never bundled with the merge.',
        undo: 'R3',
        repeat: 'known',
        missing: 'Do not deploy.',
        decides: 'A separate decision, with its own owner',
        may: 'Nothing here. The row exists so that the deploy has its own owner.',
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
    caveat:
      'The original note scores the deploy trigger R2–R3. The sheet takes one level per step, so it loads as R3, the worse case.',
  },
];

export const exampleById = (id: string): WorkedExample | undefined => EXAMPLES.find((e) => e.id === id);

/** An example's rows as plain sheet rows, for loading into the sheet. */
export const exampleRows = (ex: WorkedExample): SheetRow[] =>
  ex.rows.map(({ step, evidence, checked, judgment, limit, undo, repeat, missing }) => ({
    step,
    evidence,
    checked,
    judgment,
    limit,
    undo,
    repeat,
    missing,
  }));

// ---------------------------------------------------------------------------
// The forty minutes
// ---------------------------------------------------------------------------

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
    name: 'Read the owner the rubric gives each row.',
    minutes: '10 min',
    body: 'Only now. Reading owners while you fill the table is how the table ends up agreeing with whatever you already thought.',
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
