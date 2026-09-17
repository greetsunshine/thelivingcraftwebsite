// Content for /resources/agent-failure-triage-kit.
//
// Same split as model-selection-tool.ts: the page is markup, this is the
// words and the tables. Two reasons it is worth the extra file. The tables are
// long and a reader of the .astro file should be able to see the structure;
// and a number that appears in two places should come from one constant.
//
// Everything here that claims to be a run result IS a run result. The twelve
// test rows, the ledger counts and the rejection record were produced by
// `kits/agent-failure-triage-kit` and copied out, not written by hand. If a
// test changes, `make matrix` in that directory prints the new table.

/**
 * The public repository. Blank until the repo is created and made public.
 *
 * The page renders the repo reference as plain text while this is blank, and
 * as a link once it is set. Same rule as the resources list itself: a page
 * that links somewhere a visitor cannot open is worse than a page that does
 * not link there yet.
 */
export const REPO_URL = '';

/** The illustrative case. One number, used everywhere it appears. */
export const CHARGE = '₹1,200';
export const TRIPLE = '₹3,600';

// ── 01 · the story ─────────────────────────────────────────────────────────

export const STORY_FRAME =
  'An illustrative case, not a real incident. A customer uploads a receipt and asks for a refund of ' +
  CHARGE +
  '.';

export interface Beat {
  body: string;
  /** The half of the sentence that is the failure, pulled out for emphasis. */
  mark?: string;
}

export const STORY: Beat[] = [
  {
    body: 'The receipt lookup times out and returns an empty result. The system records',
    mark: '“no receipt”.',
  },
  { body: 'The agent recommends a refund. The checker rejects it: missing evidence.' },
  {
    body: 'The orchestrator retries the model three times. Each attempt is more confident. All three are rejected and the task escalates.',
    mark: 'The lookup itself is never retried.',
  },
  { body: 'On Monday a human opens the case, finds the receipt was there all along, and approves.' },
  {
    body: 'The payment call times out. The same retry policy fires three times.',
    mark: 'Every call reached the provider.',
  },
  {
    body: 'The customer is refunded ' + TRIPLE + '. The orchestrator reports that the refund failed.',
  },
];

export const STORY_CLOSER = 'There was no bug.';

export const STORY_CLOSER_BODY =
  'No component misbehaved. The model never hallucinated. The system failed because it used one word, “error”, for three situations that need different responses.';

// ── 02 · the three classes ─────────────────────────────────────────────────

export interface FailureClass {
  name: string;
  means: string;
  response: string;
  /** True for the one the rest of the kit is built around. */
  costly?: boolean;
}

export const CLASSES: FailureClass[] = [
  {
    name: 'missing_evidence',
    means:
      'Something required to decide is genuinely absent. The read completed, and the answer is that there is nothing there.',
    response: 'Ask for it. Do not regenerate the answer.',
  },
  {
    name: 'temporary_failure',
    means:
      'A dependency could not be reached, and no side effect occurred. Nothing was learned about the world.',
    response: 'Bounded retry of the tool, not of the model.',
  },
  {
    name: 'uncertain_action',
    means:
      'An action with side effects may or may not have executed. A timeout on a write is always this.',
    response: 'Do not retry. Reconcile state first, then decide.',
    costly: true,
  },
];

export const TERMINALS: { name: string; means: string }[] = [
  { name: 'escalate', means: 'a named human or other owner must decide' },
  { name: 'stop', means: 'no justified path remains' },
];

export const ROOT_CAUSE =
  'The root cause is a tool contract. The receipt lookup returned an empty value for both “there is no receipt” and “I could not look”. One return value, two different facts about the world, opposite correct responses. Every other failure in the story follows from that single collapse.';

// ── 03 · the tree ──────────────────────────────────────────────────────────

export interface Question {
  n: string;
  ask: string;
  yes: string;
  then: string;
}

export const TREE: Question[] = [
  {
    n: '1',
    ask: 'Could an action with side effects already have executed?',
    yes: 'uncertain_action',
    then: 'Reconcile by idempotency key. Re-issue nothing.',
  },
  {
    n: '2',
    ask: 'Is required evidence genuinely absent?',
    yes: 'missing_evidence',
    then: 'Ask the requester once. Do not regenerate.',
  },
  {
    n: '3',
    ask: 'Is a dependency temporarily unavailable?',
    yes: 'temporary_failure',
    then: 'Retry the tool, inside the task budget.',
  },
  {
    n: '4',
    ask: 'Can a named owner resolve it?',
    yes: 'escalate / stop',
    then: 'An owner, or an honest halt. Never a queue nobody reads.',
  },
];

export const WHY_ORDER =
  'Side effects are asked about first, and the asymmetry is the argument. Misclassifying an uncertain action as a temporary failure invites a bounded retry, and retrying something that already ran is how one refund becomes three. The mistake in the other direction costs you a person looking at a case that did not need one. One is expensive and silent. The other is slow and visible.';

export const TREE_NOTE =
  'Question 1 has two halves. A confirmed prior execution is not uncertainty — it is a policy conflict, and confirmed state beats any approval. Only an unconfirmed outcome is uncertain_action.';

// ── 04 · the response playbook ─────────────────────────────────────────────

export interface PlaybookRow {
  cls: string;
  signal: string;
  tempting: string;
  correct: string;
  owner: string;
  stop: string;
}

export const PLAYBOOK: PlaybookRow[] = [
  {
    cls: 'missing_evidence',
    signal: 'A read completed and returned nothing. A checker names an item it could not find.',
    tempting: 'Ask the model again, with a firmer instruction.',
    correct: 'Ask the requester for the named item, once, saying exactly what and how.',
    owner: 'The requester, until they answer. Then the task.',
    stop: 'Asked once and no answer inside the response window.',
  },
  {
    cls: 'temporary_failure',
    signal: 'On a read: a timeout, a refused connection, a 429, a 503. On a write: only a refusal the provider confirms never ran, such as a connection refused or a rate limit returned before processing. A timed-out write is never this.',
    tempting: 'Record the read as empty and carry on with what you have.',
    correct: 'Retry the same call, with backoff and jitter, honouring any Retry-After, inside the task budget.',
    owner: 'The task, while budget remains.',
    stop: 'Budget spent, or the wait exceeds the task deadline.',
  },
  {
    cls: 'uncertain_action',
    signal: 'A call that can change something outside the system ended without a confirmed outcome.',
    tempting: 'Treat it as a failure and try again.',
    correct: 'Query provider state by idempotency key. Decide on the confirmed answer, and only then.',
    owner: 'The task while state is readable. A named human the moment it is not.',
    stop: 'State cannot be read. Escalate carrying the key; never guess in either direction.',
  },
];

export const PLAYBOOK_CLOSER =
  'The tempting column is not a straw man. Each one is the shortest correct-looking line of code at that branch, which is why it is what gets written.';

// ── 05 · the rejection record ──────────────────────────────────────────────

export const RECORD_WHY =
  'A rejection that says “error” tells the next reader nothing, and the next reader is usually a retry loop. A record is what turns a rejection into a decision somebody else can make.';

export interface RecordField {
  field: string;
  holds: string;
}

export const RECORD_FIELDS: RecordField[] = [
  { field: 'stage', holds: 'Where in the workflow it happened, not which function threw.' },
  { field: 'failure_class', holds: 'One of the five. This is what decides the response.' },
  { field: 'detected_by', holds: 'A rule, a model, a tool or a human — and which one.' },
  { field: 'missing_evidence[]', holds: 'Each item, what requires it, and how to obtain it.' },
  {
    field: 'side_effects[]',
    holds: 'Each action, its target, its idempotency key, and its state: executed, not_executed or unknown. Never a guess.',
  },
  { field: 'permitted_next_actions[]', holds: 'What may happen next.' },
  {
    field: 'prohibited_actions[]',
    holds: 'What must not. For an uncertain action this always includes re-issuing it until reconciliation completes.',
  },
  {
    field: 'retry.what_changes_next_attempt',
    holds: 'Required whenever another attempt is planned. A retry with this blank is a retry nobody can justify.',
  },
  { field: 'next_step', holds: 'ask_user, retry_tool, reconcile, escalate or stop.' },
  { field: 'owner', holds: 'Who is accountable for that next step.' },
];

/**
 * A real record, produced by the corrected orchestrator under the worst
 * injection in the kit: the refund timed out after the money moved, and the
 * provider's status endpoint is down. Not an illustration of one.
 */
export const RECORD_EXAMPLE = `{
  "record_id": "task-CASE-7731-R02",
  "task_id": "task-CASE-7731",
  "attempt": 2,
  "timestamp": "2026-09-16T09:00:00+05:30",
  "stage": "action.refund",
  "failure_class": "uncertain_action",
  "detected_by": { "type": "rule", "name": "reconciliation" },
  "reason": "the action may have executed and provider state cannot be read",
  "missing_evidence": [],
  "side_effects": [
    {
      "action": "refund",
      "target": "payment-provider",
      "idempotency_key": "task-CASE-7731:refund",
      "state": "unknown"
    }
  ],
  "permitted_next_actions": [
    "escalate with the idempotency key so a human can reconcile"
  ],
  "prohibited_actions": [
    "re-issue the action",
    "report the refund as failed",
    "report the refund as complete"
  ],
  "retry": {
    "attempts_used": 1,
    "max_attempts": 8,
    "deadline": "2026-09-16T09:02:00+05:30"
  },
  "next_step": "escalate",
  "owner": "refunds-duty-officer",
  "escalation": {
    "queue": "refunds-manual-review",
    "reason": "refund outcome unknown and the provider status endpoint is unavailable; reconcile by idempotency key before any re-issue",
    "respond_by": "2026-09-16T10:00:00+05:30"
  }
}`;

export const RECORD_ANNOTATIONS: string[] = [
  'The three prohibitions are the useful part. Two of them forbid reporting an outcome, in either direction, because both would be a guess.',
  'The idempotency key travels with the record. Without it the person who picks this up has nothing to reconcile against.',
  'state is “unknown”, not “failed”. The money did move. The system simply cannot see that yet, and says so.',
];

// ── 06 · retry budgets ─────────────────────────────────────────────────────

export const BUDGETS_CAVEAT =
  'Starting points, to be tuned against your own latency and cost budgets. None of these is a universal number, and a kit that handed you one would be lying about how much it knows about your system.';

export interface BudgetRow {
  tool: string;
  auto: string;
  autoOk: boolean;
  notes: string;
}

export const BUDGETS: BudgetRow[] = [
  {
    tool: 'Read (idempotent)',
    auto: 'Yes — a small bounded number',
    autoOk: true,
    notes:
      'Exponential backoff with jitter. Honour Retry-After when the provider sends one. Respect the overall task deadline, which outranks the retry count.',
  },
  {
    tool: 'Write with an idempotency key',
    auto: 'Only under the same key',
    autoOk: true,
    notes: 'A new key is a new action. This is the single line of code behind the third refund.',
  },
  {
    tool: 'Write without an idempotency key',
    auto: 'No',
    autoOk: false,
    notes: 'Query state first, then decide. There is nothing else you can safely do.',
  },
  {
    tool: 'Irreversible or external (payments, emails, tickets)',
    auto: 'No',
    autoOk: false,
    notes: 'Reconcile first, every time. An email cannot be unsent and a ticket cannot be unfiled.',
  },
  {
    tool: 'Model generation',
    auto: 'Only when the input has changed',
    autoOk: false,
    notes:
      'New evidence, or a new instruction. An identical input returns the same kind of answer at extra cost, and usually at higher confidence.',
  },
];

export const AMPLIFICATION_TITLE = 'Retries multiply across layers, and nobody writes the product down.';

export const AMPLIFICATION =
  'The tool client tries three times. The orchestrator sees one failure and tries three times. Nine calls reach the provider, and no file in the repository contains the number nine. Each layer’s number looks reasonable on its own, which is exactly why it survives review. The fix is not smaller numbers at each layer. It is one budget per task — attempts, wall-clock and cost — that every layer draws from, so an inner retry spends the same allowance as an outer one.';

export const AMPLIFICATION_MEASURED =
  'Test T08 in this kit measures it: against a task budget of four attempts, the two-layer design makes nine calls and the shared-budget design makes four.';

// ── 07 · reconciliation checklist ──────────────────────────────────────────

export const RECONCILE_INTRO =
  'Run this the moment a side-effecting call ends without a confirmed outcome. In order, and without skipping the first one.';

export const RECONCILE: { step: string; why: string }[] = [
  {
    step: 'Do not re-issue the action.',
    why: 'Nothing you know yet justifies it. This is the step people skip under time pressure, and it is the one that costs money.',
  },
  {
    step: 'Query provider state by idempotency key.',
    why: 'Not by customer, not by amount, not by timestamp. The key is the only handle on the specific thing that might have run. Most providers expire keys after a day or so, so keep your own reference beside it for anything reconciled later than that.',
  },
  {
    step: 'Decide on the confirmed state, not on the timeout.',
    why: 'Confirmed executed: close against the existing reference. Confirmed not executed: re-issue under the same key.',
  },
  {
    step: 'If state cannot be read, stay uncertain and escalate.',
    why: 'An unreadable status does not turn an unknown outcome into a known one. Escalate carrying the key, and report neither success nor failure.',
  },
  {
    step: 'Record the outcome, including the unresolved ones.',
    why: 'The record is what makes the next attempt at this task, by a machine or a person, start from what is already known.',
  },
  {
    step: 'Make the action idempotent before the next incident.',
    why: 'Reconciliation is the workaround. An idempotency key on every write is the fix, and it is a smaller change than it looks.',
  },
];

// ── 08 · a second opinion is not proof ─────────────────────────────────────

export const SECOND_OPINION_TITLE = 'A checker approves the plan. It has not read the world.';

export const SECOND_OPINION = [
  'A model checker is a second opinion about a recommendation. It sees the same evidence the first model saw, reasons over the same text, and returns a verdict about whether the plan is sound. That is genuinely useful, and it is not the same thing as knowing what has already happened.',
  'Two models agreeing that a refund is justified tells you nothing about whether a refund has already been issued. Neither of them queried the ledger. Adding a third would not help, and the agreement between them reads as confidence while adding no information at all.',
];

export const INSPECT_INSTEAD = [
  'Provider state for this idempotency key, immediately before the call.',
  'The task’s own record of side effects, including any marked unknown.',
  'Whether another task holds a claim on the same case.',
  'Whether the action is inside its deadline and its budget.',
];

export const SECOND_OPINION_CLOSER =
  'Test T09 is the one to steal. It approves a refund the ledger already holds, and a design that issues it fails. Confirmed state beats a verdict, every time.';

export const SECOND_OPINION_COST =
  'The cost is honest: checking state before every external call is one extra read on every call. Relying on the idempotency key alone is cheaper, safe within a task, and blind to what another task already did.';

// ── 09 · the twelve tests ──────────────────────────────────────────────────

export const TESTS_INTRO =
  'Twelve injections, each stating what it injects, the behaviour a correct design shows, and the smell a failure points at. Run against both designs. Every verdict below is a real run.';

export interface TestRow {
  id: string;
  inject: string;
  expect: string;
  naive: 'pass' | 'fail';
  corrected: 'pass' | 'fail';
}

export const TESTS: TestRow[] = [
  {
    id: 'T01',
    inject: 'The receipt read times out. The receipt is in the store the whole time.',
    expect: 'temporary_failure. The read is retried, the model is not re-prompted, the requester is not asked.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T02',
    inject: 'The receipt is genuinely absent. The store answers, and the answer is no.',
    expect: 'missing_evidence. Ask the requester once. Zero model regenerations.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T03',
    inject: 'The checker rejects twice with an identical reason and nothing has changed.',
    expect: 'No third identical attempt. Escalate with a record.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T04',
    inject: 'The payment times out after the provider commits.',
    expect: 'uncertain_action. Status shows it executed. No re-issue. Exactly one refund.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T05',
    inject: 'The payment times out before the provider commits.',
    expect: 'Reconciliation shows not executed. Re-issued under the same key. Exactly one refund.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T06a',
    inject: 'Rate limited with Retry-After 30s, against a 120s task deadline.',
    expect: 'Waits the 30 seconds it was asked for, then re-issues under the same key.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T06b',
    inject: 'The same rate limit asking for 300s, against the same 120s deadline.',
    expect: 'No wait, no re-issue, escalate. The deadline outranks the instruction.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T07',
    inject: 'The document store is down beyond the retry budget.',
    expect: 'Retrying stops. The work lands in an escalation queue with an owner and a full record.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T08',
    inject: 'The tool client and the orchestrator are both configured to retry.',
    expect: 'Total attempts never exceed the task budget. No three-by-three amplification.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T09',
    inject: 'The checker approves a refund the ledger shows already happened.',
    expect: 'The external action is blocked. State wins over the verdict.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T10',
    inject: 'The payment times out and the status query is also unavailable.',
    expect: 'Stays uncertain_action. No re-issue. Escalates. Never assumes failure.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T11',
    inject: 'The requester uploads the receipt after being asked.',
    expect: 'Resumes with the new evidence. The attempt counter reflects that the input changed.',
    naive: 'fail',
    corrected: 'pass',
  },
  {
    id: 'T12',
    inject: 'The refund executes but the confirmation email fails.',
    expect: 'Only the email step is retried. The refund is never re-issued to fix an email.',
    naive: 'fail',
    corrected: 'pass',
  },
];

export const TESTS_RESULT =
  'The naive design passed none of the thirteen. The corrected design passed all thirteen. T06 is split into two halves because the behaviour differs either side of the task deadline.';

export const TESTS_SMELLS =
  'The failures are worth reading as assertions rather than as a column. T08 reported nine calls against a budget of four. T06a slept on its own guessed backoff and ignored the Retry-After the provider sent. T09 left two refunds in the ledger where the checker had approved one. T12 never retried the email, and a shared retry wrapper would have re-issued the refund to fix it.';

export const LEDGER_NOTE =
  'Every assertion reads the payment provider’s own record of what happened, never what the orchestrator believed. The naive design believes it refunded nobody. That gap is the story.';

// ── 10 · the Monday exercise ───────────────────────────────────────────────

export const MONDAY_FRAME =
  'It produces a list, not a refactor, and it needs no planning meeting to start. Bring the page, a whiteboard and whoever knows the tool surface.';

export const MONDAY: { minutes: string; step: string; detail: string }[] = [
  {
    minutes: '5 min',
    step: 'Pick one agent and list its tools.',
    detail: 'The one in production, not the one you are proud of. Write every tool it can call.',
  },
  {
    minutes: '10 min',
    step: 'Classify each tool by type.',
    detail:
      'Read, write with an idempotency key, write without one, or irreversible and external. Most lists have more in the last two categories than the team expects.',
  },
  {
    minutes: '15 min',
    step: 'Check each tool’s contract against three questions.',
    detail:
      'Can the caller tell “not found” from “could not look”? Can it tell “did not run” from “may have run”? Does a failure ever arrive as an empty value or a bare exception?',
  },
  {
    minutes: '10 min',
    step: 'Run T01, T04 and T08 against it.',
    detail:
      'A read that times out while the data is present. A write that times out after it commits. A retry configured at two layers. Three injections, whatever your test harness is.',
  },
  {
    minutes: '5 min',
    step: 'Write down what you found.',
    detail:
      'One line per tool that cannot distinguish an outcome, and one line per retry you cannot account for. That list is the work, and it is usually shorter than the team fears.',
  },
];

export const MONDAY_CLOSER =
  'The most common finding is not a missing retry. It is a tool that has been returning an empty value for two different situations since the day it was written, and a caller that has been treating them the same ever since.';

// ── closing ────────────────────────────────────────────────────────────────

export const FINAL_TITLE = 'This classifies failures. It does not decide what the agent is allowed to do.';

export const FINAL_BODY =
  'Triage tells you what to do after something went wrong. It says nothing about which steps should have been handed to an agent in the first place, or what an action costs to undo. Those are a separate question, and there is a separate worksheet for them.';

export const DISCLAIMER =
  'The refund case on this page is illustrative. It is not a client engagement, not an incident report, and no organisation, system or figure on this page refers to a real one. The code, the tests and the results are real and reproducible.';
