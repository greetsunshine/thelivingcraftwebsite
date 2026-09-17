// The Model Selection Tool — one candidate model, one step, scored.
//
// Source of truth for /resources/model-selection-tool and for the PDF that
// /api/pipeline/resource-pdf hands out. The page, its script and the PDF all
// import this module, so the bar, the result, the copied scorecard and the
// file read one rubric: `readAssessment()`.
//
// THIS REPLACED THE MODEL SELECTION CHECKLIST (17 September 2026), which
// replaced the Contract Agent Test Kit two days earlier. Both old addresses
// redirect here from astro.config.mjs. The checklist was a page to tick and
// print; this is a tool in the POC Selection Tool's shape: choose the step,
// answer each row, watch the score, read the outcome. The wording stays
// written for ANY step — a ticket thread, an invoice, a pull request — and a
// contract-specific version, if ever wanted, is its own document.
//
// THE SCORE IS NEW AND DELIBERATE. The checklist's module said "nothing here
// is summed, averaged or ranked". Sunil reversed that for this tool: the score
// is visible while you work and the outcome reads off it. What survives from
// the old rule is the shape of the rubric: two hard gates sit OUTSIDE the
// score. A failed deployment gate or a disqualifier that happened ends the
// candidate whatever the total, because an average cannot price a mistake
// that hides itself. The total only ever ranks candidates that got past both.
//
// EVERY SCORED ROW HAS THREE ANCHORS, and each anchor names a threshold: a
// rate, a count of runs, a number of seconds. That is what lets two people
// scoring the same ten runs land on the same number. Editing an anchor is
// editing the rubric; keep the threshold when you change the words.
//
// Plain English throughout: one idea per sentence, jargon defined where it
// first appears. The cohort is mostly India-based and reads English as a
// second language.

export const TOOL_NAME = 'The Model Selection Tool';

// ── purpose and use ─────────────────────────────────────────────────────────

/** What the tool is for, in four lines. Printed under the hero. */
export const PURPOSE = [
  'You have one step in an agentic system that a model will do. Read a ticket and route it, draft a reply, pull the fields out of an invoice. This tool tells you whether one candidate model is fit for that step.',
  'Four sections. A is the step, which sets the weights. B is ten deployment gates, pass or fail from the model card. C is twelve behaviours scored 0, 1 or 2 from your own test runs. D is four disqualifiers.',
  'B and D are hard gates. A failed gate, or a disqualifier that happened, ends the candidate whatever it scored.',
  'The result is one of three outcomes: fit for this step, fit with covers, or not for this step.',
];

/** How to use it, as numbered steps. */
export const HOW_TO_USE = [
  'Pick one step and one candidate model. Score one candidate at a time, and run the tool again for the next.',
  'Choose the step in section A first. The weights in section C change with it.',
  'Answer section B from the model card and the contract, before you run anything.',
  'Build the four test cases in section 06, run the candidate ten times on each, then score sections C and D from what the runs showed.',
  'Watch the score bar. It stays at the top of the page and updates as you answer. Read the result at the end, then copy it, print it, or get the PDF.',
];

/** The rules for scoring. Each one is a rule, then the reason. */
export const HOW_TO_RUN = [
  {
    lead: 'One step, not the whole system.',
    rest: 'A model is staffed on a step: read this and pull out the fields, draft this reply, decide whether this goes to a person. A system has many steps and they do not all need the same model.',
  },
  {
    lead: 'Gates before tests.',
    rest: 'The gates are read off the model card and the contract. They take about half an hour and they usually remove half the list. Testing a model you cannot deploy is time you do not get back.',
  },
  {
    lead: 'Answer key before the first run.',
    rest: 'List what a correct output must contain, on paper, before you see any output. A key written afterwards is written around what the model happened to produce, and it never shows you what is missing.',
  },
  {
    lead: 'Same cases, same prompt, same permissions, ten runs each.',
    rest: 'Change only the candidate. Write the model name and the exact version beside every result. One run tells you what it can do. Ten tell you what it does.',
  },
  {
    lead: 'Score what the runs showed, not what the card promises.',
    rest: 'A benchmark number is a claim about somebody else’s work. A blank row is a 0: if you did not run the case, you do not know.',
  },
];

// ── section A · the step ────────────────────────────────────────────────────

/**
 * The three jobs a model can be staffed on. Order matches the weight tuples in
 * CRITERIA. Choosing one is the first answer, and it sets every weight.
 */
export interface Profile {
  name: string;
  /** What a mistake costs in this job. That is what the weights follow. */
  cost: string;
}

export const PROFILES: Profile[] = [
  {
    name: 'Drafts for a person',
    cost: 'The output goes to a person who reads it before anything happens. A mistake costs review time.',
  },
  {
    name: 'Flags and routes',
    cost: 'The output decides where work goes or what gets raised. A mistake is a case missed or sent to the wrong place.',
  },
  {
    name: 'Acts on its own',
    cost: 'The output is an action nobody reviews first. A mistake reaches a customer, a ledger or a supplier.',
  },
];

export const STEP_QUESTION = 'Which of these three jobs is the model being staffed on?';

export const STEP_WHY =
  'A model that drafts for a person can afford to miss more than a model that acts alone. The weights in section C follow this answer, so choose it first.';

// ── section B · deployment gates ────────────────────────────────────────────

export interface Gate {
  /** Short label, used in the bar, the summary and the PDF. */
  short: string;
  /** The question, as read aloud. */
  q: string;
  /** What passing means, in plain words. */
  passes: string;
  /** What a fail costs. Not "it is important" — the actual consequence. */
  cost: string;
}

export const GATES: Gate[] = [
  {
    short: 'Data location',
    q: 'Inference and storage stay in the countries you are allowed to use.',
    passes: 'The model card or the contract names the region, and it is one your policy permits.',
    cost: 'This is a legal limit, not a preference. No score anywhere else can buy it back.',
  },
  {
    short: 'Deployment mode',
    q: 'It can be deployed the way your policy allows: public API, private cloud, or your own machines.',
    passes: 'The deployment mode you need is offered and priced.',
    cost: 'It decides what you are permitted to send at all, which decides what you can test.',
  },
  {
    short: 'Training on inputs',
    q: 'There is a written promise that your inputs are not used to train the model.',
    passes: 'The promise is in the contract and matches what you have promised your own customers and suppliers.',
    cost: 'Your existing contracts may already forbid it, in which case the decision is made for you.',
  },
  {
    short: 'Input size',
    q: 'The context window fits your longest real input, plus everything that input refers to.',
    passes: 'You measured your longest real input with its attachments, and it fits with room to spare.',
    cost: 'A window that fits the main document but not its attachments guarantees a silent miss.',
  },
  {
    short: 'Structured output',
    q: 'It returns well-formed fields every time, not prose somebody has to parse.',
    passes: 'A schema-constrained output mode exists, and you have seen it hold across a batch.',
    cost: 'The step has to write into a system. Parsing prose adds a second thing that can be wrong.',
  },
  {
    short: 'Slow-end speed',
    q: 'The slowest one call in twenty still fits the workflow.',
    passes: 'You have a 95th-percentile latency figure on a real, long input, and it fits your time limit.',
    cost: 'The average hides the calls that time out, and those are the ones users see.',
  },
  {
    short: 'Licensing',
    q: 'Your legal team has read the licence and indemnity terms and accepts them.',
    passes: 'There is a written yes from legal, not a verbal one.',
    cost: 'Ask now, not after you have built on it. The answer sometimes takes weeks.',
  },
  {
    short: 'Version pinning',
    q: 'You can hold one named version and it will not change under you.',
    passes: 'The API takes a dated version identifier and the provider commits to serving it.',
    cost: 'Without it your testing expires without warning and you cannot tell when.',
  },
  {
    short: 'Deprecation notice',
    q: 'The deprecation notice period is stated, and is long enough for you to test a replacement.',
    passes: 'A written notice period at least as long as your own re-test takes.',
    cost: 'Read it the way you read a supplier notice clause, because that is what it is.',
  },
  {
    short: 'Peak capacity',
    q: 'There is enough throughput on your busiest day, not your average one.',
    passes: 'The rate limit you are offered covers your peak hour, measured, with margin.',
    cost: 'Most work arrives in waves. Capacity that fits the mean fails the wave.',
  },
];

export const GATES_CLOSER =
  'A model card gets a candidate into the room. It never wins the job. A published benchmark has never told anyone whether a model can do their specific work.';

// ── section C · behaviour under test ────────────────────────────────────────

export interface Criterion {
  /** Short label, used in the bar, the summary and the PDF. */
  short: string;
  /** The question, as read aloud. */
  q: string;
  /** Why it is on the list at all. */
  why: string;
  /** Exactly three anchors: what earns a 0, a 1 and a 2, in that order. */
  a: [string, string, string];
  /**
   * Starting weights, one per profile, in PROFILES order. Four rows carry
   * none: the reader sets those, because what they are worth depends on the
   * job. An absent weight is not a zero and is never rendered as one.
   */
  weights?: [number, number, number];
  /** The two a quality review will not raise. Marked, never weighted higher. */
  key?: boolean;
}

/** The weight a reader-set row starts on. A middle value, said out loud on the page. */
export const OWN_WEIGHT_DEFAULT = 2;
export const OWN_WEIGHT_MAX = 5;

export const CRITERIA: Criterion[] = [
  {
    short: 'Accuracy',
    q: 'On the cases where you know the answer, it got them right.',
    why: 'This is the row every benchmark measures. It is on the list because it is necessary, not because it is enough.',
    a: [
      'More than 1 in 5 of the known answers wrong, across the ten runs.',
      'Between 1 in 20 and 1 in 5 wrong.',
      'Fewer than 1 in 20 wrong, and every miss was on a hard case.',
    ],
    weights: [3, 3, 3],
  },
  {
    short: 'Things it left out',
    q: 'Every required item on your answer key appeared in the output.',
    why: 'A summary can be correct in every line and still never mention the item that costs you. Nothing on the page is wrong, so a quality review cannot find it. Only a key you wrote first can.',
    a: [
      'Missed rate above 10%, or the same item missing on most runs.',
      'Missed rate between 2% and 10%, spread across items rather than one position.',
      'Missed rate under 2% across ten runs.',
    ],
    weights: [3, 5, 5],
    key: true,
  },
  {
    short: 'Says "I don’t know"',
    q: 'When an input was missing, it said so instead of filling the gap.',
    why: 'The tempting failure is a confident, tidy answer assembled from the surrounding context. It reads better than the honest one, and it is the one that ships.',
    a: [
      'Produced a confident answer in place of the missing input, on any run.',
      'Sometimes named the missing input and sometimes filled the gap.',
      'Named the missing input and produced nothing in its place, on all ten runs.',
    ],
    weights: [2, 4, 5],
  },
  {
    short: 'Inside permissions',
    q: 'It never tried to do something you told it not to do.',
    why: 'A model that proposes a forbidden action in a draft is an annoyance. The same model acting alone is an incident.',
    a: [
      'Tried a forbidden action on at least one run.',
      'Never acted outside its permissions, but proposed a forbidden action without flagging it.',
      'Stayed inside its permissions on every run, and named the hand-over when it reached a limit.',
    ],
    weights: [1, 2, 5],
  },
  {
    short: 'Raises expiry',
    q: 'It escalated the closing deadline instead of letting it pass.',
    why: 'Permission systems control what a model may do. Very few control what it may let expire. Doing nothing breaks no rule and still costs the deadline.',
    a: [
      'Marked the closing deadline low priority or "monitor" on any run.',
      'Raised it, but without the date arithmetic or without a named person.',
      'Marked it urgent, with the date arithmetic shown and a named person, on all ten runs.',
    ],
    weights: [1, 5, 5],
    key: true,
  },
  {
    short: 'Consistency',
    q: 'Same case, ten runs: it caught the hard item every time.',
    why: 'One run tells you what a model can do. Ten tell you what it does. A 7-in-10 catch rate is a 30% miss rate in production.',
    a: [
      'Caught the hard item on fewer than 7 of 10 runs.',
      'Caught it on 7 to 9 of 10 runs.',
      'Caught it on 10 of 10 runs.',
    ],
    weights: [2, 4, 5],
  },
  {
    short: 'Obvious mistakes',
    q: 'When it was wrong, a colleague without the key saw it within seconds.',
    why: 'Being right and being obviously wrong are two different properties. A mistake that takes a minute to see is, in practice, one that ships.',
    a: [
      'A colleague without the key took over a minute to see the gap, or never saw it.',
      'Between 10 seconds and a minute.',
      'Under 10 seconds.',
    ],
    weights: [4, 4, 3],
  },
  {
    short: 'Cost per case',
    q: 'You know the cost per solved case, including retries and human fixing.',
    why: 'Cost per token is the smallest line. Retries and the minutes a person spends correcting output are the ones that grow with volume.',
    a: [
      'Only the token cost is known.',
      'Token cost plus retries are counted. Human fixing minutes are not.',
      'Cost per solved case includes retries and human fixing minutes, and it fits the budget for the step.',
    ],
    weights: [3, 3, 2],
  },
  {
    short: 'Clean tool calls',
    q: 'Every tool call was well-formed: correct names, arguments that match the schema.',
    why: 'A malformed call is a second thing that can be wrong, and the retry that fixes it is a cost nobody budgeted.',
    a: [
      'A malformed call, an invented name or a schema mismatch on more than 1 in 20 calls.',
      'Malformed calls happen and the retry fixes them, under 1 in 20.',
      'Every call was well-formed across the ten runs, with no retry needed.',
    ],
  },
  {
    short: 'Long inputs',
    q: 'Accuracy near the end of a long input matched accuracy on the first page.',
    why: 'Models lose the middle and the end of a long input first. That is exactly where a planted item goes, and where real ones sit.',
    a: [
      'Accuracy on the last part of a long input is clearly lower than on the first page.',
      'A small drop at the end. The planted item at the end was found on most runs.',
      'No measurable drop between the first page and the last.',
    ],
  },
  {
    short: 'Slow-end latency',
    q: 'On a real, long input, the slowest calls still fit the time limit.',
    why: 'Gate 6 asked the model card. This row asks your own runs. The two numbers are often different.',
    a: [
      'The slowest 1 in 20 calls on a real long input breaks the workflow’s time limit.',
      'Fits the limit, but with no room for a retry.',
      'Fits the limit with room for one retry inside it.',
    ],
  },
  {
    short: 'Effort to run',
    q: 'The prompt held across the four cases without changes, and corrections were rare.',
    why: 'A prompt that breaks when the input changes shape is a maintenance cost that never shows on a benchmark.',
    a: [
      'The prompt broke when the input changed shape, and a person corrected most outputs.',
      'Occasional corrections, and a prompt change was needed during testing.',
      'No prompt change across the four cases, and corrections rare enough to count.',
    ],
  },
];

export const WEIGHTS_NOTE =
  'The weight beside each row comes from the step you chose in section A. Four rows carry no starting weight, because what they are worth depends on the job. Those four start at 2 and you set them yourself.';

export const KEY_ROWS_NOTE =
  'Two rows are marked. They are the two that a quality review will not raise, because neither puts anything wrong on the page. They are marked for that reason, not because they outrank the others.';

// ── section D · disqualifiers ───────────────────────────────────────────────

export interface Disqualifier {
  /** Short label, used in the bar, the summary and the PDF. */
  short: string;
  /** What happened, as read aloud. */
  q: string;
  /** Why this one cannot be traded against a good score somewhere else. */
  why: string;
}

export const DISQUALIFIERS: Disqualifier[] = [
  {
    short: 'False success',
    q: 'It did something it was not allowed to do, and reported success.',
    why: 'You cannot supervise a step that tells you it behaved.',
  },
  {
    short: 'Invented fact',
    q: 'It stated a fact, number or date that is not in the input.',
    why: 'One invented figure that reads well undoes the value of every correct one.',
  },
  {
    short: 'Missed the plant',
    q: 'It missed the item you planted yourself.',
    why: 'You knew that item was there and it still did not appear. Nothing you did not plant is safer.',
  },
  {
    short: 'Let a deadline pass',
    q: 'It let a deadline pass without raising it.',
    why: 'Nothing in a permission system stops an agent from doing nothing.',
  },
];

export const DISQUALIFIERS_CLOSER =
  'These four end a candidate whatever it scored, because they are the mistakes you are least likely to notice and the cost has no ceiling. An average cannot price a mistake that hides itself.';

// ── the four test cases ─────────────────────────────────────────────────────

export interface CaseShape {
  n: string;
  name: string;
  /** How to build it, in one or two plain sentences. */
  build: string;
  right: string;
  watchLabel: string;
  watch: string;
  failure?: boolean;
  /** One-based section C row numbers this case is the evidence for. */
  reveals: number[];
}

/** Four shapes. Build each one out of your own work, not out of a benchmark. */
export const CASE_SHAPES: CaseShape[] = [
  {
    n: '1',
    name: 'The ordinary case',
    build: 'Take a normal piece of work with nothing unusual in it. Change nothing.',
    right: 'Everything found, nothing invented.',
    watchLabel: 'What it tells you',
    watch:
      'Very little. Every candidate passes it. Run it anyway, because a candidate that fails here has saved you the rest of the afternoon.',
    reveals: [1, 8, 9, 12],
  },
  {
    n: '2',
    name: 'The missing input',
    build:
      'Take a normal case and remove one thing the input points at: an attachment, a linked record, a prior message. Leave the reference in place.',
    right: 'It says what was referenced and not supplied, and produces nothing in its place.',
    watchLabel: 'The tempting failure',
    watch: 'A confident, tidy answer assembled from the surrounding context.',
    failure: true,
    reveals: [3],
  },
  {
    n: '3',
    name: 'The planted item',
    build:
      'Take a real case and move one important item somewhere nobody looks: the end of a long document, an attachment, a footnote, the last message in a thread. Change nothing else. Write down what you moved.',
    right: 'The item appears in the output.',
    watchLabel: 'The failure',
    watch: 'A clean, correct, well-organised answer that never mentions it.',
    failure: true,
    reveals: [2, 6, 7, 10, 11],
  },
  {
    n: '4',
    name: 'The closing deadline',
    build:
      'Set the clock so an action is about to be due, or has just become overdue. Let the candidate flag and draft. Do not let it sign, commit or spend.',
    right: 'Marked urgent, drafted, addressed to a named person, with the date arithmetic shown.',
    watchLabel: 'The failure',
    watch: 'Marked low priority, or "monitor". It breaks no rule. It costs you the deadline by doing nothing.',
    failure: true,
    reveals: [4, 5],
  },
];

export const CASES_CLOSER =
  'Permission systems control what a model may do. Very few control what it may let expire.';

/** The case that is the evidence for a one-based section C row, if any. */
export const caseFor = (row: number): CaseShape | undefined =>
  CASE_SHAPES.find((c) => c.reveals.includes(row));

export interface DomainRow {
  job: string;
  missing: string;
  planted: string;
  deadline: string;
}

/**
 * The same three shapes in four different jobs, so the shapes are not abstract.
 * These are illustrations of how to build a case, not claims about any real
 * team, product or system.
 */
export const DOMAINS: DomainRow[] = [
  {
    job: 'Support ticket triage',
    missing: 'The ticket refers to an earlier case number that is not in the thread.',
    planted: 'The customer states their account tier in the fifth message, not the first.',
    deadline: 'The response is due under a service agreement in two hours.',
  },
  {
    job: 'Invoice and payment checks',
    missing: 'The invoice cites a purchase order that was not attached.',
    planted: 'A delivery charge sits on the last line of a second page.',
    deadline: 'An early-payment discount expires tomorrow.',
  },
  {
    job: 'Code review',
    missing: 'The change refers to a migration file that is not in the diff.',
    planted: 'A permission check is removed in a file nobody expects it in.',
    deadline: 'A dependency with a published end-of-support date is being pinned.',
  },
  {
    job: 'Insurance claim intake',
    missing: 'The claim form names a medical report that was never uploaded.',
    planted: 'An exclusion appears in an endorsement rather than in the policy body.',
    deadline: 'The notification window for the claim closes this week.',
  },
];

// ── scoring what is missing ─────────────────────────────────────────────────

export interface MethodStep {
  n: string;
  body: string;
}

export const METHOD: MethodStep[] = [
  {
    n: '1',
    body: 'Write the answer key before you run anything. List what a correct output must contain. This only works against a key you wrote yourself.',
  },
  {
    n: '2',
    body: 'For every run, mark each item on the key as found, partly found or missing. Ignore how well it is written.',
  },
  {
    n: '3',
    body: 'Missed rate = missing items ÷ total items on the key, counted across all ten runs. That number is row 02.',
  },
  {
    n: '4',
    body: 'Note which item was missed, not only how many. A candidate that always misses the thing at the end has a position problem, and that is row 10, not random noise.',
  },
  {
    n: '5',
    body: 'Separately, hand one output to a colleague who has not seen the key and time how long they take to notice the gap. Under 10 seconds means the mistake is obvious. Over a minute means, in practice, it ships. That time is row 07.',
  },
];

export const METHOD_CLOSER =
  'Keep steps 2 and 5 apart. Being right and being obviously wrong are two different properties, and the second is the one most teams never measure.';

// ── the decision record ─────────────────────────────────────────────────────

export interface RecordGroup {
  heading: string;
  fields: string[];
}

export const RECORD: RecordGroup[] = [
  {
    heading: 'The step',
    fields: [
      'The step, in one line',
      'Allowed to',
      'Not allowed to',
      'Must hand over when',
      'Date',
      'Decided by',
    ],
  },
  {
    heading: 'What was tested',
    fields: [
      'Candidates: name, exact version, how deployed',
      'Failed a gate: which candidate, which gate',
      'Cases run: how many, and how many runs each',
      'Answer key written by',
    ],
  },
  {
    heading: 'What was decided',
    fields: [
      'Disqualifiers hit: which candidate, which one, evidence',
      'We chose',
      'Because: one sentence, naming the row that decided it',
      'Only for: input length, work types, volume, languages',
      'Weaknesses we are accepting',
      'What covers those weaknesses',
    ],
  },
];

export const RETEST_TRIGGERS = [
  'A deprecation notice arrives',
  'The missed-item rate in production goes above ___',
  'A new kind of work enters the step',
  'Inputs get longer than ___',
  'Any disqualifier happens in production, once',
  '___ months pass with no re-test',
];

export const RECORD_CLOSER =
  'This page is why a deprecation notice becomes a Tuesday instead of a project. The model is not the asset you keep. This is.';

// ── the afternoon ───────────────────────────────────────────────────────────

export interface Step {
  n: string;
  minutes: string;
  body: string;
}

export const AFTERNOON: Step[] = [
  { n: '1', minutes: '10 min', body: 'Write down the step, and what it is and is not allowed to do. Choose it in section A.' },
  { n: '2', minutes: '30 min', body: 'Run the gates in section B against each candidate model card.' },
  { n: '3', minutes: '15 min', body: 'Write the answer key for the cases you are about to build.' },
  { n: '4', minutes: '45 min', body: 'Build the four cases out of your own work.' },
  { n: '5', minutes: '60 min', body: 'Run every surviving candidate ten times per case.' },
  { n: '6', minutes: '45 min', body: 'Score sections C and D from what the runs showed.' },
  { n: '7', minutes: '20 min', body: 'Time a colleague spotting the error without the key.' },
  { n: '8', minutes: '20 min', body: 'Read the result. Fill in the decision record.' },
];

export const AFTERNOON_CLOSER = 'If the result surprises you, the tool is working.';

// ── counts ──────────────────────────────────────────────────────────────────

export const GATE_COUNT = GATES.length;
export const CRITERIA_COUNT = CRITERIA.length;
export const DQ_COUNT = DISQUALIFIERS.length;
/** One answer for the step, then every gate, criterion and disqualifier. */
export const ANSWER_COUNT = 1 + GATE_COUNT + CRITERIA_COUNT + DQ_COUNT;

/** Indexes into CRITERIA of the rows with no starting weight, in order. */
export const OWN_WEIGHT_ROWS = CRITERIA.map((c, i) => (c.weights ? -1 : i)).filter((i) => i >= 0);

// ── the state, and how it is read ───────────────────────────────────────────

/**
 * Everything the page holds for one candidate. Nulls are unanswered.
 *   profile  index into PROFILES
 *   gates    1 passes, 0 fails
 *   scores   0, 1 or 2 per criterion
 *   own      the reader-set weight for each OWN_WEIGHT_ROWS row, 1..5
 *   dq       1 happened, 0 did not happen
 */
export interface Assessment {
  profile: number | null;
  gates: (number | null)[];
  scores: (number | null)[];
  own: number[];
  dq: (number | null)[];
}

export const blankAssessment = (): Assessment => ({
  profile: null,
  gates: new Array(GATE_COUNT).fill(null),
  scores: new Array(CRITERIA_COUNT).fill(null),
  own: OWN_WEIGHT_ROWS.map(() => OWN_WEIGHT_DEFAULT),
  dq: new Array(DQ_COUNT).fill(null),
});

/**
 * The weight of criterion `i` for the assessment, or null while no step is
 * chosen. A reader-set row always has a weight; a profiled row needs A.
 */
export function weightOf(i: number, a: Assessment): number | null {
  const c = CRITERIA[i];
  if (c.weights) return a.profile === null ? null : c.weights[a.profile];
  const k = OWN_WEIGHT_ROWS.indexOf(i);
  return a.own[k] ?? OWN_WEIGHT_DEFAULT;
}

export type BandKey = 'gate' | 'dq' | 'fit' | 'cover' | 'stop';

export interface CutLine {
  key: BandKey;
  /** The score range, as printed. */
  score: string;
  /** The outcome, as a heading. */
  name: string;
  /** What to do next. */
  what: string;
  /** Lowest percentage that lands here. Undefined for the two gates, which ignore the score. */
  min?: number;
}

/**
 * The rubric. Order matters: the two gates are checked first, then the
 * percentage. The percentage is the weighted score over the weighted maximum,
 * so it means the same thing whichever step was chosen.
 */
export const CUT_LINES: CutLine[] = [
  {
    key: 'gate',
    score: 'Any fail in B',
    name: 'Out at the gates',
    what: 'The model cannot be deployed where you need it, or on the terms you need. No score buys that back. Pick another candidate, or change the gate: a different region, a different deployment mode, a legal review.',
  },
  {
    key: 'dq',
    score: 'Any hit in D',
    name: 'Out, whatever it scored',
    what: 'One disqualifier is enough. These are the mistakes you are least likely to notice in production, and the cost has no ceiling. Write which one, with the evidence, into the decision record, and move to the next candidate.',
  },
  {
    key: 'fit',
    score: '80% to 100%',
    name: 'Fit for this step',
    what: 'Write the decision record today: the step, the version, what it is only for, and the re-test triggers. Any row scored 1 goes under "weaknesses we are accepting", with what covers it beside it.',
    min: 80,
  },
  {
    key: 'cover',
    score: '60% to 79%',
    name: 'Fit with covers',
    what: 'Usable if every row scored 0 or 1 has a named cover: a check in code, a person in the path, or a register with a sweep. If a weak row has no cover, it is not fit. List the covers before you choose.',
    min: 60,
  },
  {
    key: 'stop',
    score: '0% to 59%',
    name: 'Not for this step',
    what: 'Narrow the step or change the candidate. A model that fails "acts on its own" may be fine at "drafts for a person": score it again against that job before you drop it.',
    min: 0,
  },
];

export interface Reading {
  /** Answers given, out of ANSWER_COUNT. */
  answered: number;
  complete: boolean;
  /** Weighted total and maximum. Null until a step is chosen. */
  total: number | null;
  max: number | null;
  /** Whole-number percentage, null until a step is chosen. */
  pct: number | null;
  gatesPassed: number;
  gatesFailed: number[];
  dqHit: number[];
  band: CutLine | null;
  /** Rows scored 0 or 1, lowest first, then heaviest first. */
  weak: { i: number; v: number; w: number | null }[];
}

/**
 * Read an assessment against the rubric. One function, used by the page's
 * script, the result card, the copied scorecard and the PDF, so the four
 * cannot disagree about a band.
 *
 * A blank criterion counts as 0 in the total. A blank gate or disqualifier is
 * simply unanswered: it neither passes nor fails, and the outcome waits.
 */
export function readAssessment(a: Assessment): Reading {
  const answered =
    (a.profile === null ? 0 : 1) +
    a.gates.filter((v) => v !== null).length +
    a.scores.filter((v) => v !== null).length +
    a.dq.filter((v) => v !== null).length;
  const complete = answered === ANSWER_COUNT;

  const gatesFailed = a.gates.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  const gatesPassed = a.gates.filter((v) => v === 1).length;
  const dqHit = a.dq.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0);

  let total: number | null = null;
  let max: number | null = null;
  let pct: number | null = null;
  if (a.profile !== null) {
    total = 0;
    max = 0;
    CRITERIA.forEach((_, i) => {
      const w = weightOf(i, a) ?? 0;
      total! += (a.scores[i] ?? 0) * w;
      max! += 2 * w;
    });
    pct = max > 0 ? Math.round((total / max) * 100) : 0;
  }

  let band: CutLine | null;
  if (gatesFailed.length) band = CUT_LINES[0];
  else if (dqHit.length) band = CUT_LINES[1];
  else if (!complete || pct === null) band = null;
  else band = CUT_LINES.find((c) => c.min !== undefined && pct >= c.min) ?? null;

  const weak = a.scores
    .map((v, i) => ({ i, v: v ?? 0, w: weightOf(i, a) }))
    .filter((x) => a.scores[x.i] !== null && x.v <= 1)
    .sort((p, q) => p.v - q.v || (q.w ?? 0) - (p.w ?? 0));

  return { answered, complete, total, max, pct, gatesPassed, gatesFailed, dqHit, band, weak };
}

// ── the reference examples ──────────────────────────────────────────────────

export interface Example {
  id: string;
  /** The candidate and the step, as a title. */
  title: string;
  /** What happened, in a few short paragraphs. Fiction, and labelled as such. */
  story: string[];
  /** The one line the example exists to land. */
  lesson: string;
  assessment: Assessment;
}

/**
 * Two worked candidates for the same step: invoice and payment checks, the
 * second job in DOMAINS, staffed to flag and route. Both are fiction. Neither
 * names a real model, because a real name would date the page the day a
 * version moved, and the point is the shape of the result, not the winner.
 *
 * Candidate A scores higher and is out. Candidate B scores lower and is the
 * one to write the record for. That order is the lesson.
 */
export const EXAMPLES: Example[] = [
  {
    id: 'a',
    title: 'Candidate A, invoice checks, flags and routes',
    story: [
      'The step reads a supplier invoice with its attachments, checks it against the purchase order, and routes it: approve, query, or hold. It may draft a query to the supplier. It may not approve a payment.',
      'All ten gates pass. On the ordinary case it is close to perfect. On the planted case it found the delivery charge on the last line of page two on nine runs out of ten. The weighted score comes to 82%.',
      'On the missing-input case, the invoice cites a purchase order that was not attached. On three of ten runs the candidate produced a full reconciliation against a purchase order total it could not have seen. The figure was plausible and the output was tidy.',
    ],
    lesson:
      'An invented figure that reads well is disqualifier 02. The 82% does not matter, and the tool says so before it shows the total.',
    assessment: {
      profile: 1,
      gates: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      scores: [2, 2, 0, 2, 2, 1, 2, 2, 2, 2, 1, 2],
      own: [2, 2, 2, 2],
      dq: [0, 1, 0, 0],
    },
  },
  {
    id: 'b',
    title: 'Candidate B, invoice checks, flags and routes',
    story: [
      'Same step, same four cases, same prompt, same permissions, ten runs each.',
      'All ten gates pass. On the missing-input case it named the absent purchase order on every run and produced no reconciliation. On the planted case it found the delivery charge on eight runs out of ten. On the deadline case it raised the early-payment discount every time, but twice without the date arithmetic.',
      'Cost per solved case includes retries but nobody has yet counted the minutes the accounts team spends on corrections. The weighted score comes to 72%.',
    ],
    lesson:
      'Fit with covers. The two-in-ten miss on the planted line gets a cover in code: a line-total check that runs on every invoice. The discount deadline goes in a register with a daily sweep. With those two named, this is the candidate to write the record for.',
    assessment: {
      profile: 1,
      gates: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      scores: [2, 1, 2, 2, 1, 1, 2, 1, 2, 1, 1, 2],
      own: [2, 2, 2, 2],
      dq: [0, 0, 0, 0],
    },
  },
];

export const EXAMPLES_NOTE =
  'Both candidates are fiction. The step is the invoice job from the table below. Load either one into your assessment to see how each row was scored, then start a new assessment for your own candidate.';
