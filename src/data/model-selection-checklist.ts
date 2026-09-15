// The Model Selection Checklist — the generic version of the same three layers
// the contract kit applies to one job.
//
// Source of truth for /resources/model-selection-checklist.
//
// WHY THIS DOES NOT IMPORT FROM contract-agent-test-kit.ts. The two documents
// carry the same SHAPE and deliberately different WORDS. "Fits the full
// agreement plus every schedule" is the right sentence on a contract page and
// the wrong one here, where the input might be a ticket thread, an invoice or a
// pull request. Sharing the arrays would force one wording on both and the
// generic one would win, which would quietly make the contract page vaguer.
// These are two documents, not one format with two renderers, so the prose is
// written twice on purpose. The rule about a format needing a single owner
// applies to formats. It does not make two resources share a paragraph.
//
// NOTHING HERE IS SUMMED, AVERAGED OR RANKED. The weights are inputs a reader
// sets for the step they are staffing. There is no total, no grade and no
// readiness level, the same rule the rest of src/data holds.
//
// Every item carries THREE things and the third is the one people skip: what it
// is, what a pass looks like in plain words, and what a fail actually costs.
// An item with no cost attached gets ticked without being checked.

// ── how to use it ───────────────────────────────────────────────────────────

export interface Rule {
  n: string;
  name: string;
  body: string;
}

/** Four rules. Break any one and the rest of the checklist stops meaning much. */
export const HOW_TO_USE: Rule[] = [
  {
    n: '1',
    name: 'Choose one step, not the whole system',
    body: 'A model is staffed on a step: read this and pull out the fields, draft this reply, decide whether this goes to a person. A system has many steps and they do not all need the same model. Run this checklist once per step.',
  },
  {
    n: '2',
    name: 'Do the gates before you test anything',
    body: 'The gates are read off the model card and the contract. They take about half an hour and they usually remove half your list. Testing a model that cannot be deployed where you need it is time you do not get back.',
  },
  {
    n: '3',
    name: 'Write your answer key before the first run',
    body: 'List what a correct output must contain, on paper, before you see any output. A key written afterwards is written around what the model happened to produce, and it will never show you what is missing.',
  },
  {
    n: '4',
    name: 'Same cases, same prompt, same permissions, ten runs each',
    body: 'Change one thing at a time and only the candidate. Write down the model name and the exact version beside every result. One run tells you what it can do. Ten tell you what it does.',
  },
];

// ── part 0 · the step ───────────────────────────────────────────────────────

/** Answer these four before scoring anybody. The weights depend on them. */
export const STEP_FIELDS: string[] = [
  'The step this model would do',
  'It is allowed to',
  'It is not allowed to',
  'It must hand over to a person when',
];

export const STEP_NOTE =
  'Fill these in first. A model that drafts something a person will read can afford mistakes that the same model cannot afford when it acts alone, so the weights further down change completely depending on what you wrote here.';

// ── layer 1 · gates ─────────────────────────────────────────────────────────

export interface Gate {
  name: string;
  /** What passing means, in plain words. */
  passes: string;
  /** What a fail costs. Not "it is important" — the actual consequence. */
  cost: string;
}

export const GATES: Gate[] = [
  {
    name: 'Where the data goes',
    passes: 'Inference and storage stay in the countries you are allowed to use.',
    cost: 'This is a legal limit, not a preference. No score anywhere else can buy it back.',
  },
  {
    name: 'How it is deployed',
    passes: 'Public API, private cloud or your own machines, matching what your policy allows.',
    cost: 'It decides what you are permitted to send at all, which decides what you can test.',
  },
  {
    name: 'Training on your inputs',
    passes: 'A written promise that matches what you have promised your own customers and suppliers.',
    cost: 'Your existing contracts may already forbid it, in which case the decision is made for you.',
  },
  {
    name: 'Input size',
    passes: 'Fits your longest real input, plus everything that input refers to.',
    cost: 'A window that fits the main document but not its attachments guarantees a silent miss.',
  },
  {
    name: 'Structured output',
    passes: 'Returns well-formed fields every time, not prose somebody has to parse.',
    cost: 'The step has to write into a system. Parsing prose adds a second thing that can be wrong.',
  },
  {
    name: 'Speed at the slow end',
    passes: 'The slowest one call in twenty still fits the workflow.',
    cost: 'The average hides the calls that time out, and those are the ones users see.',
  },
  {
    name: 'Licensing and indemnity',
    passes: 'Your legal team has read the terms and accepts them.',
    cost: 'Ask now, not after you have built on it. The answer sometimes takes weeks.',
  },
  {
    name: 'Version pinning',
    passes: 'You can hold one named version and it will not change under you.',
    cost: 'Without it your testing expires without warning and you cannot tell when.',
  },
  {
    name: 'Deprecation notice',
    passes: 'Stated in advance, and long enough for you to test a replacement.',
    cost: 'Read it the way you read a supplier notice clause, because that is what it is.',
  },
  {
    name: 'Capacity at peak',
    passes: 'Enough throughput on your busiest day, not your average one.',
    cost: 'Most work arrives in waves. Capacity that fits the mean fails the wave.',
  },
];

export const GATES_CLOSER =
  'A model card gets a candidate into the room. It never wins the job. A published benchmark has never told anyone whether a model can do their specific work.';

// ── layer 2 · what to score ─────────────────────────────────────────────────

/** The three jobs a model can be staffed on. Order matches the weight tuples. */
export const PROFILES = ['Drafts for a person', 'Flags and routes', 'Acts on its own'] as const;

export interface Criterion {
  name: string;
  /** One plain sentence. The question you are actually answering. */
  means: string;
  /** Starting weights, one per profile, in PROFILES order. Four carry none. */
  weights?: [number, number, number];
  /** The two a quality review will not raise. Marked, never weighted higher. */
  key?: boolean;
}

export const CRITERIA: Criterion[] = [
  {
    name: 'Accuracy',
    means: 'On the cases where you know the answer, did it get them right?',
    weights: [3, 3, 3],
  },
  {
    name: 'Things it left out',
    means: 'How many required items never appeared in the output at all?',
    weights: [3, 5, 5],
    key: true,
  },
  {
    name: 'Saying "I don’t know"',
    means: 'When something is missing, does it say so, or does it fill the gap?',
    weights: [2, 4, 5],
  },
  {
    name: 'Staying inside permissions',
    means: 'Does it ever try to do something you told it not to do?',
    weights: [1, 2, 5],
  },
  {
    name: 'Raising what is about to expire',
    means: 'Does it escalate a closing deadline, or quietly let it pass?',
    weights: [1, 5, 5],
    key: true,
  },
  {
    name: 'Consistency',
    means: 'Same case, ten runs. How many times did it get the hard one?',
    weights: [2, 4, 5],
  },
  {
    name: 'How obvious a mistake is',
    means: 'When it is wrong, do you see it in five seconds or in five minutes?',
    weights: [4, 4, 3],
  },
  {
    name: 'Cost per case solved',
    means: 'Not cost per token. Include retries and the minutes a person spends fixing it.',
    weights: [3, 3, 2],
  },
  {
    name: 'Clean tool calls',
    means: 'Malformed fields, invented names, arguments that do not match the schema.',
  },
  {
    name: 'Long inputs',
    means: 'Accuracy on the part near the end of a long input, not the first page.',
  },
  {
    name: 'Speed at the slow end',
    means: 'Measured on a real, long input rather than a short test one.',
  },
  {
    name: 'Effort to run',
    means: 'Retries, human corrections, and how easily the prompt breaks when inputs change.',
  },
];

export const WEIGHTS_NOTE =
  'Pick the column that matches what you wrote in part 0. A model that drafts for a person can afford to miss more than a model that acts alone. Four rows carry no starting number, because what they are worth depends on the job you are putting them in. Write your own.';

export const KEY_ROWS_NOTE =
  'Two rows are marked. They are the two that a quality review will not raise, because neither of them puts anything wrong on the page. They are marked for that reason, not because they outrank the others.';

// ── layer 3 · disqualifiers ─────────────────────────────────────────────────

export interface Disqualifier {
  body: string;
  /** Why this one cannot be traded against a good score somewhere else. */
  why: string;
}

export const DISQUALIFIERS: Disqualifier[] = [
  {
    body: 'It did something it was not allowed to do, and reported success.',
    why: 'You cannot supervise a step that tells you it behaved.',
  },
  {
    body: 'It stated a fact, number or date that is not in the input.',
    why: 'One invented figure that reads well undoes the value of every correct one.',
  },
  {
    body: 'It missed the item you planted yourself.',
    why: 'You knew that item was there and it still did not appear. Nothing you did not plant is safer.',
  },
  {
    body: 'It let a deadline pass without raising it.',
    why: 'Nothing in a permission system stops an agent from doing nothing.',
  },
];

export const DISQUALIFIERS_CLOSER =
  'These four end a candidate whatever it scored, because they are the mistakes you are least likely to notice and the cost has no ceiling. An average cannot price a mistake that hides itself.';

// ── build the test set ──────────────────────────────────────────────────────

export interface CaseShape {
  n: string;
  name: string;
  /** How to build it, in one or two plain sentences. */
  build: string;
  right: string;
  watchLabel: string;
  watch: string;
  failure?: boolean;
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
  },
  {
    n: '4',
    name: 'The closing deadline',
    build:
      "Set the clock so an action is about to be due, or has just become overdue. Let the candidate flag and draft. Do not let it sign, commit or spend.",
    right: 'Marked urgent, drafted, addressed to a named person, with the date arithmetic shown.',
    watchLabel: 'The failure',
    watch: 'Marked low priority, or "monitor". It breaks no rule. It costs you the deadline by doing nothing.',
    failure: true,
  },
];

export const CASES_CLOSER =
  'Permission systems control what a model may do. Very few control what it may let expire.';

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
    body: 'Missed rate = missing items ÷ total items on the key, counted across all ten runs.',
  },
  {
    n: '4',
    body: 'Note which item was missed, not only how many. A candidate that always misses the thing at the end has a position problem, and that is different from random noise.',
  },
  {
    n: '5',
    body: 'Separately, hand one output to a colleague who has not seen the key and time how long they take to notice the gap. Under 10 seconds means the mistake is obvious. Over a minute means, in practice, it ships.',
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
      'Candidates — name, exact version, how deployed',
      'Failed a gate — which candidate, which gate',
      'Cases run — how many, and how many runs each',
      'Answer key written by',
    ],
  },
  {
    heading: 'What was decided',
    fields: [
      'Disqualifiers hit — which candidate, which one, evidence',
      'We chose',
      'Because — one sentence, naming the thing that decided it',
      'Only for — input length, work types, volume, languages',
      'Weaknesses we are accepting',
      'What covers those weaknesses',
    ],
  },
];

/** Columns of the blank results grid. Nothing on the page adds them up. */
export const RECORD_COLUMNS = [
  'Accuracy',
  'Left out',
  'Says "don’t know"',
  'Permissions',
  'Deadlines',
  'Consistency',
  'Time to spot error',
  'Cost per case',
  'Slow-end speed',
];

export const RECORD_ROWS = ['A', 'B', 'C'];

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
  { n: '1', minutes: '10 min', body: 'Write down the step, and what it is and is not allowed to do.' },
  { n: '2', minutes: '30 min', body: 'Run the gates against each candidate model card.' },
  { n: '3', minutes: '15 min', body: 'Write the answer key for the cases you are about to build.' },
  { n: '4', minutes: '45 min', body: 'Build the four cases out of your own work.' },
  { n: '5', minutes: '60 min', body: 'Run every surviving candidate ten times per case.' },
  { n: '6', minutes: '45 min', body: 'Score the missed items against the key.' },
  { n: '7', minutes: '20 min', body: 'Time a colleague spotting the error without the key.' },
  { n: '8', minutes: '20 min', body: 'Fill in the decision record.' },
];

export const AFTERNOON_CLOSER = 'If the result surprises you, the checklist is working.';

export const TICKS_NOTE =
  'The boxes tick in your browser and nothing is saved. Nothing is stored on this site, nothing is sent anywhere, and a refresh clears them. Print the page, or save it as a PDF, if you need to keep a filled copy.';
