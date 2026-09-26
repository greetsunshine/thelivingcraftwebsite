// Content and rules for /resources/agent-failure-triage-quiz.
//
// Same split as the other tools: the .astro file is markup, this is the words
// and the rules. Three reasons it is worth the extra file here.
//
//  1. THE ANSWER KEY IS DATA, NOT MARKUP. One `correct: true` per question,
//     checked by `quizProblems()` below and by the test beside it. When the key
//     lived in the page, a copied option block could produce two correct
//     answers and nothing would say so.
//  2. THE COVERAGE RULE IS MACHINE-CHECKED. The brief this was written to says
//     every question maps to exactly one takeaway and every takeaway is tested
//     at least once. That is an assertion, so it is written as one.
//  3. THE PAGE AND THE SCRIPT READ THE SAME OBJECT. The cards are rendered
//     from ITEMS and graded from ITEMS, so a question cannot be scored against
//     an option the reader never saw.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE INCIDENT IS ILLUSTRATIVE, AND THE PAGE SAYS SO BEFORE THE FIRST QUESTION
// ═══════════════════════════════════════════════════════════════════════════
//
// No client, employer, supplier or event here is real. The numbers are invented
// on purpose: a senior engineer reasons from a figure, and "a large order" is
// not a figure. That licence covers the case only. It does not extend to a
// claim about this practice, about MCP, or about what any real product does —
// see the spec note at the foot of this file, which is a checked citation.
//
// NO CERTIFICATE, NO CREDENTIAL, NO OUTCOME CLAIM. The close names the
// takeaways a reader missed and the tools to go and audit. Nothing here says
// they are now qualified in anything.

/** The published tool's name. Used in the hero, the title and the schema. */
export const TOOL_NAME = 'The Agent Failure Triage Quiz';

export const HEADLINE = 'Tell a failed action from an unanswered one';

export const SUBTITLE =
  'One illustrative incident, worked one piece of evidence at a time: a purchase order that timed out, and a supplier that received it twice.';

/** Two sentences, as the brief asks. The label comes first deliberately. */
export const INTRO: string[] = [
  'This incident is illustrative, and is not a real client, employer or event.',
  'You are the engineer on call, and each question hands you one new piece of evidence.',
];

export const BRING =
  'The list of tools your agent can call that change something outside it. At least one of them moves money or places an order.';

export const DO =
  'Answer each question before you read the feedback. Every answer explains itself, including the wrong ones, and says what that choice would actually cause.';

export const LEAVE =
  'A recovery step you can name for each of your own write tools, and a list of the takeaways you missed, in your own order.';

export const CTA = 'Start the quiz';

// ═══════════════════════════════════════════════════════════════════════════
// The pre-read
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The LinkedIn post this quiz is built on.
 *
 * 'TODO' until somebody supplies the URL. The page then renders the episode as
 * plain text rather than as a dead link, exactly as the Cost-Ceiling Workbook
 * handles its own companion post. A pre-read link that goes nowhere is worse
 * than no link: the reader was told to read something first and cannot.
 *
 * THE KIT IS THE OTHER HALF OF THE PRE-READ AND IT IS ALWAYS A LINK, because it
 * is on this site. The quiz assumes the failure classes and the triage order
 * written down there.
 */
export const LINKEDIN_EPISODE_4_URL: string = 'TODO';

export const hasEpisodePost = (): boolean =>
  LINKEDIN_EPISODE_4_URL !== 'TODO' && LINKEDIN_EPISODE_4_URL.startsWith('https://');

export const EPISODE_LABEL = 'Agentic system design, Episode 4';

export const PRE_READ = {
  label: 'Read this first',
  /** Said before the quiz starts, so nobody meets question one cold. */
  body: 'Two things sit behind these questions. Episode 4 is where the procurement incident comes from. The Agent Failure Triage Kit is where the three failure classes and the order of the triage questions are written down.',
  kitUrl: '/resources/agent-failure-triage-kit',
  kitLabel: 'The Agent Failure Triage Kit',
  /** Shown when the episode URL is still unset, so the reader is not sent hunting. */
  episodeFallback:
    'The episode is on LinkedIn and is not linked here yet. The kit covers the same ground in writing.',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// The case file
// ═══════════════════════════════════════════════════════════════════════════

export const CASE_LABEL = 'Illustrative case · not a real client, employer or event';

export const CASE_TITLE = 'One order, two purchase orders, no error anywhere';

export const CASE_SETTING: string[] = [
  'A procurement agent at a mid-size manufacturer raises purchase orders when stock runs low. A buyer approves the order; the agent places it.',
  'It places every order through one tool, create_purchase_order. That tool sits on an MCP server the platform team runs. MCP (Model Context Protocol) is the standard way a client offers tools to a model. The MCP server calls the supplier’s ordering API.',
  'On Tuesday at 09:14 the agent orders 1,200 steel brackets at ₹8,40,000. By 09:20 the supplier’s portal shows that same order twice, PO-44812 and PO-44813, ₹16,80,000 committed.',
  'The agent’s own logs say no order was placed. Nothing raised an error. You are on call.',
];

/** The one number, used everywhere it appears. */
export const ORDER_VALUE = '₹8,40,000';
export const DOUBLE_VALUE = '₹16,80,000';

// ═══════════════════════════════════════════════════════════════════════════
// The seven takeaways
// ═══════════════════════════════════════════════════════════════════════════

export interface Takeaway {
  n: number;
  /** The claim, in one line. Printed beside a question and in the result. */
  short: string;
  /** The same claim with the reason attached. Printed in full at the foot. */
  body: string;
}

export const TAKEAWAYS: Takeaway[] = [
  {
    n: 1,
    short: 'A timeout is missing information, not a failure.',
    body: 'A timeout tells you the response did not arrive. The action may already have taken effect. Everything you do next has to be correct whether it did or it did not.',
  },
  {
    n: 2,
    short: 'Retry policy and recovery design are separate decisions.',
    body: 'Tuning retry counts or backoff answers how often to try. It never answers the question that matters after a timeout: did my first attempt land?',
  },
  {
    n: 3,
    short: 'MCP adds hops, and silence at the client says nothing about them.',
    body: 'Between the model and the system that acts there is a client, an MCP server and a downstream API. A client that stops waiting has learned nothing about what the other two did.',
  },
  {
    n: 4,
    short: 'idempotentHint declares; it does not enforce.',
    body: 'It is metadata on a tool definition that a client may use when deciding what to retry. It changes what the client believes, not what the downstream system does, and it defaults to false.',
  },
  {
    n: 5,
    short: 'An agent-safe idempotency key belongs to the intended action.',
    body: 'It is created before the first attempt, stored outside the model, reused on every retry and forwarded downstream. A key the model mints fresh on each call gives no protection.',
  },
  {
    n: 6,
    short: 'If the downstream system cannot deduplicate, look before acting again.',
    body: 'The server checks whether the action already exists before it repeats it. That check runs where your own reference is known, not in the model.',
  },
  {
    n: 7,
    short: 'Turning retries off moves the problem instead of removing it.',
    body: 'The same unanswered question goes to a person, with less information than the server had and at a worse hour.',
  },
];

export const takeawayOf = (n: number): Takeaway => TAKEAWAYS.find((t) => t.n === n)!;

// ═══════════════════════════════════════════════════════════════════════════
// The questions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The five question shapes from the brief. The shape is printed on the card,
 * because it tells a reader what kind of thinking the question wants.
 */
export type Shape = 'Diagnose' | 'Wrong lever' | 'Predict' | 'Next check' | 'Spot the claim';

export interface Option {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  /** Exactly one option per question carries this. `quizProblems()` checks it. */
  correct?: true;
  /**
   * Two or three sentences, shown whether the reader picked this option or not.
   * A wrong option says what choosing it would actually cause. No option here
   * is absurd: every one is something a competent team has proposed.
   */
  why: string;
}

export interface Item {
  /** 'Q01' … 'Q10' for the concept questions, 'K01' and 'K02' for the kit. */
  id: string;
  kind: 'concept' | 'kit';
  /** 1..7 for a concept question. 0 for a kit question, which tests the kit. */
  takeaway: number;
  /** Where a kit question is drawn from, printed on the card. */
  source?: string;
  shape: Shape;
  /** The new evidence this question reveals. Rendered above the question. */
  evidence?: { label: string; lines: string[]; mono?: boolean };
  ask: string;
  /** Points at the evidence, never at the answer. */
  hint: string;
  options: Option[];
  /** The single line the question exists to land. Shown once it is answered. */
  lands: string;
}

export const ITEMS: Item[] = [
  {
    id: 'Q01',
    kind: 'concept',
    takeaway: 1,
    shape: 'Diagnose',
    evidence: {
      label: 'The agent’s client log',
      mono: true,
      lines: [
        '09:14:02.114  call create_purchase_order  sku=BRK-19 qty=1200 value=840000',
        '09:14:32.115  call create_purchase_order  no response after 30000 ms',
      ],
    },
    ask: 'The call to create_purchase_order timed out after 30 seconds. No error came back. What do you know for certain?',
    hint: 'Read the second log line again. Which side of the call does it describe?',
    lands: 'A timeout on a write is an unknown outcome, not a failed one.',
    options: [
      {
        key: 'A',
        text: 'The order was not placed.',
        why: 'Wrong. A timeout tells you the response did not arrive. It says nothing about what the receiver did with the request.',
      },
      {
        key: 'B',
        text: 'The MCP server rejected the request.',
        why: 'Wrong. A rejection is an answer, and it would have come back as an error. Silence is not a rejection.',
      },
      {
        key: 'C',
        text: 'The agent received no answer. The order may or may not exist.',
        correct: true,
        why: 'Correct. A timeout is missing information, not a failure. Every step after it has to be correct whether the order exists or not.',
      },
      {
        key: 'D',
        text: 'The supplier’s API is down.',
        why: 'Wrong. That is one cause of silence, not something the silence proves. A reply that is merely slow looks identical at 30 seconds.',
      },
    ],
  },
  {
    id: 'Q02',
    kind: 'concept',
    takeaway: 2,
    shape: 'Wrong lever',
    evidence: {
      label: 'The incident channel, 09:41',
      lines: [
        '"Raise max attempts from 3 to 5 and add exponential backoff: 2s, 4s, 8s, 16s. That is why we got two orders."',
      ],
    },
    ask: 'The team proposes five attempts with exponential backoff instead of three. What does that fail to fix?',
    hint: 'Ask what the extra attempts know that the first one did not.',
    lands: 'A retry policy answers how often to try. It never answers whether the first attempt landed.',
    options: [
      {
        key: 'A',
        text: 'It still cannot tell whether the first attempt landed, so it can place more duplicate orders, not fewer.',
        correct: true,
        why: 'Correct. Retry policy and recovery design are two separate decisions. Attempts and delays answer how often to try; nothing in them establishes what the first try did.',
      },
      {
        key: 'B',
        text: 'Nothing. Backoff removes the duplicate by spacing the calls out.',
        why: 'Wrong. Spacing changes when the second call arrives, not whether it is a second order. The supplier accepted both calls as they came.',
      },
      {
        key: 'C',
        text: 'It fails because two seconds is too short for this supplier.',
        why: 'Wrong, and it is the same lever again. A longer gap in front of an unknown outcome still leaves the outcome unknown.',
      },
      {
        key: 'D',
        text: 'It fails only when the supplier is unavailable for longer than sixteen seconds.',
        why: 'Wrong. The expensive case is a supplier that is available and slow. Against a slow success, more attempts means more orders.',
      },
    ],
  },
  {
    id: 'Q03',
    kind: 'concept',
    takeaway: 3,
    shape: 'Diagnose',
    evidence: {
      label: 'The MCP server’s log, from the platform team',
      mono: true,
      lines: [
        '09:14:02.140  tools/call create_purchase_order  forwarded  POST /v2/orders',
        '09:14:34.210  tools/call create_purchase_order  attempt 2  forwarded',
        '09:14:37.902  supplier responded 201 Created  order=PO-44812',
        '09:14:41.377  supplier responded 201 Created  order=PO-44813',
      ],
    },
    ask: 'The agent stopped waiting at 30 seconds. The supplier created PO-44812 at 35 seconds. What did the agent’s silence tell you about the hops behind it?',
    hint: 'Compare two clocks: when the client stopped waiting, and when the supplier answered.',
    lands: 'A client timeout bounds your own patience. It does not stop the work downstream.',
    options: [
      {
        key: 'A',
        text: 'That nothing happened on the first attempt, because it timed out.',
        why: 'Wrong, and the log says so. PO-44812 came from attempt one, five seconds after the agent had given up on it.',
      },
      {
        key: 'B',
        text: 'Nothing. The timeout is a fact about how long the client waited, and both hops carried on afterwards.',
        correct: true,
        why: 'Correct. MCP adds hops. Silence at the client says nothing about what happened at the MCP server or at the supplier.',
      },
      {
        key: 'C',
        text: 'That the MCP server should have returned an error so the agent knew where it stood.',
        why: 'Wrong about the diagnosis. The server had no error to report, because it was still waiting too. An invented error would have made a real order look like a failure.',
      },
      {
        key: 'D',
        text: 'That only the supplier can ever know, so the agent cannot find out.',
        why: 'Wrong, and it gives up one step early. The agent cannot learn it from silence. It can ask, which is question six.',
      },
    ],
  },
  {
    id: 'Q04',
    kind: 'concept',
    takeaway: 4,
    shape: 'Spot the claim',
    evidence: {
      label: 'The tool definition, from the server’s tools/list response',
      mono: true,
      lines: [
        '{ "name": "create_purchase_order",',
        '  "annotations": { "title": "Create purchase order", "idempotentHint": true } }',
        '',
        'The supplier’s API documentation has no idempotency header and no duplicate suppression.',
      ],
    },
    ask: 'The tool is annotated idempotentHint: true. Which part of this setup is declared but not enforced?',
    hint: 'Ask who reads the annotation, and who places the order.',
    lands: 'An annotation is metadata about a tool, not behaviour at the system that acts.',
    options: [
      {
        key: 'A',
        text: 'The annotation. It is a hint a client may use when it decides what to retry, and it changes nothing at the supplier.',
        correct: true,
        why: 'Correct. idempotentHint declares; it does not enforce. The specification also tells clients to treat tool annotations as untrusted unless the server is trusted, and the hint defaults to false when it is absent.',
      },
      {
        key: 'B',
        text: 'Nothing is unenforced. A true idempotentHint means repeat calls are collapsed.',
        why: 'Wrong, and this is the belief that produced PO-44813. The hint travels with the tool definition. The supplier never sees it.',
      },
      {
        key: 'C',
        text: 'The 30-second timeout, because the specification does not require one.',
        why: 'Wrong target. The timeout is a client choice and it was honoured exactly. The unenforced claim here is about what a repeat call does.',
      },
      {
        key: 'D',
        text: 'The supplier’s 201 Created, which is not proof the order was stored.',
        why: 'Wrong. A 201 with an order number is the confirmation you were missing all morning. The unsupported claim is the annotation above it.',
      },
    ],
  },
  {
    id: 'Q05',
    kind: 'concept',
    takeaway: 5,
    shape: 'Next check',
    evidence: {
      label: 'Four proposals on the board, 11:20',
      lines: [
        'The team agrees to add an idempotency key: a value that tells the receiver two requests are the same action, so it applies the action once. Four versions are proposed.',
      ],
    },
    ask: 'Which of these keys protects the agent on a retry?',
    hint: 'For each one, ask when the key is created and who keeps it.',
    lands: 'A key names the action you intended, and it exists before the first attempt.',
    options: [
      {
        key: 'A',
        text: 'A fresh UUID the model puts in the arguments each time it calls the tool.',
        why: 'Wrong. A new value on each call describes the call, so two calls are two actions. This is the reversal waiting to happen, and it is question eight.',
      },
      {
        key: 'B',
        text: 'One key created for the intended order before the first attempt, stored in the task record outside the model, reused on every retry and forwarded to the supplier.',
        correct: true,
        why: 'Correct, and all four properties are doing work. Created before the first attempt, held outside the model, reused rather than regenerated, and passed downstream to the system that actually applies it.',
      },
      {
        key: 'C',
        text: 'A hash of the arguments, computed by the MCP server on every call.',
        why: 'Closer, and it fails two ways. Two orders the team means to place twice collapse into one, and any re-planned argument produces a new identity for the same intended order.',
      },
      {
        key: 'D',
        text: 'The supplier’s order number from the first response, sent with the retry.',
        why: 'Wrong, and it needs the one thing you do not have. The retry exists because no response arrived, so there is no order number to send.',
      },
    ],
  },
  {
    id: 'Q06',
    kind: 'concept',
    takeaway: 6,
    shape: 'Next check',
    evidence: {
      label: 'The supplier’s support team, in writing',
      lines: [
        'Their API accepts duplicate orders and has no idempotency header. Our own reference field, our_ref, is stored on every order they hold and is searchable.',
      ],
    },
    ask: 'The supplier cannot deduplicate. What does the MCP server do before it repeats the call?',
    hint: 'You have a field of your own on every order they hold.',
    lands: 'Where the receiver cannot deduplicate, read state first and act second.',
    options: [
      {
        key: 'A',
        text: 'Search the supplier for an order carrying our reference, and place one only if there is none.',
        correct: true,
        why: 'Correct. If the downstream system cannot deduplicate, look before acting again. The check belongs on the server, where the reference is known and the answer is a fact rather than a guess.',
      },
      {
        key: 'B',
        text: 'Send the key anyway, because the supplier will honour it eventually.',
        why: 'Wrong. A key the receiver ignores is a comment. Nothing about the second call changes.',
      },
      {
        key: 'C',
        text: 'Repeat the call and clean up with a nightly job that cancels the extra order.',
        why: 'Wrong, and it accepts the ₹8,40,000 commitment overnight. A repair after the fact is not a control, and the supplier may have picked and shipped by then.',
      },
      {
        key: 'D',
        text: 'Add an alert so on-call sees the duplicate within five minutes.',
        why: 'Wrong. An alert reports that it happened. The question is what the server does instead of placing the second order.',
      },
    ],
  },
  {
    id: 'Q07',
    kind: 'concept',
    takeaway: 7,
    shape: 'Wrong lever',
    evidence: {
      label: 'The proposal after the incident review',
      lines: [
        '"Turn retries off for every write tool. On a timeout, stop the task and page on-call."',
      ],
    },
    ask: 'What does turning retries off move rather than remove?',
    hint: 'Ask what the paged engineer has to do first.',
    lands: 'A person paged with an unknown outcome is the same problem, with fewer facts.',
    options: [
      {
        key: 'A',
        text: 'The same unanswered question, now handed to a person with less information than the server had.',
        correct: true,
        why: 'Correct. Turning retries off moves the problem instead of removing it. Somebody still has to find out whether PO-44812 exists, by hand, at whatever hour the task stopped.',
      },
      {
        key: 'B',
        text: 'Nothing. No retry means no duplicate, so the problem is gone.',
        why: 'Wrong about which problem. It does stop this duplicate, and it leaves every timed-out order in an unknown state with nothing checking automatically.',
      },
      {
        key: 'C',
        text: 'It moves cost from the supplier to the model bill.',
        why: 'Wrong. Nothing here turns on token cost. What moves is an unresolved question about state.',
      },
      {
        key: 'D',
        text: 'It moves the decision to the model, which will ask the buyer instead.',
        why: 'Wrong. Retry behaviour is orchestration, not a model choice, and asking the buyer does not establish whether the order exists.',
      },
    ],
  },
  {
    id: 'Q08',
    kind: 'concept',
    takeaway: 5,
    shape: 'Diagnose',
    evidence: {
      label: 'Thursday. The key is in place, and it happened again.',
      mono: true,
      lines: [
        '09:02:10  call create_purchase_order  idem_key=po-9f2c4e11  no response after 30000 ms',
        '09:02:44  call create_purchase_order  idem_key=po-41ab7c93  201 Created  order=PO-45190',
        '',
        'The supplier holds PO-45189 and PO-45190 for the same 1,200 brackets.',
      ],
    },
    ask: 'The team added an idempotency key. The supplier still received two orders. What is the most likely cause?',
    hint: 'Read the two key values in the trace, then ask who produced them.',
    lands: 'If the model can mint the key, the key belongs to the call and protects nothing.',
    options: [
      {
        key: 'A',
        text: 'The supplier ignores idempotency keys.',
        why: 'Possible in general, and not what this trace shows. Check your own chain first: two different keys went out, so the supplier was asked for two different actions.',
      },
      {
        key: 'B',
        text: 'The retry count is still too high.',
        why: 'Wrong. One retry produced this. A second call carrying a new key is a second order whatever the limit is.',
      },
      {
        key: 'C',
        text: 'The model re-planned after the timeout and generated a new key, so the second call looked like a new action.',
        correct: true,
        why: 'Correct. A key the model mints on each call gives no protection. The key has to be created once for the intended order and held where re-planning cannot reach it.',
      },
      {
        key: 'D',
        text: 'idempotentHint was set to false.',
        why: 'Wrong. The hint neither creates nor breaks deduplication. It is metadata a client may read when it decides what to retry.',
      },
    ],
  },
  {
    id: 'Q09',
    kind: 'concept',
    takeaway: 1,
    shape: 'Predict',
    evidence: {
      label: 'Friday. The key is created once and stored outside the model.',
      lines: [
        'The key is generated when the task decides to order, written to the task record, and reused on every attempt. The next call times out at 30 seconds.',
      ],
    },
    ask: 'What has changed about what you know after this timeout?',
    hint: 'Separate two questions: what happened, and what is safe to do next.',
    lands: 'A key makes the retry safe. It does not make the timeout informative.',
    options: [
      {
        key: 'A',
        text: 'You now know the order was not placed, because a retry would have found it.',
        why: 'Wrong. Nothing about a timeout became informative. The retry is safe to make; it is not a report on what the first attempt did.',
      },
      {
        key: 'B',
        text: 'Nothing. You still do not know. What changed is that repeating the call is now safe.',
        correct: true,
        why: 'Correct. A timeout is still missing information. The key does not answer the question, it removes the cost of asking it again.',
      },
      {
        key: 'C',
        text: 'You know the supplier stored the key, so the order exists.',
        why: 'Wrong. No response arrived, so nothing was learned about storage. The key was sent, not acknowledged.',
      },
      {
        key: 'D',
        text: 'You know the MCP server has the answer, so the agent can read it from there.',
        why: 'Wrong. The server was waiting on the same call. A hop that is also waiting has nothing extra to tell you.',
      },
    ],
  },
  {
    id: 'Q10',
    kind: 'concept',
    takeaway: 2,
    shape: 'Next check',
    evidence: {
      label: 'Monday. Eleven write tools, one week.',
      lines: [
        'The agent can call eleven tools that change something outside it. You have a week before the next order run.',
      ],
    },
    ask: 'Which question do you ask of each of those tools first?',
    hint: 'The answer names two things a tool has to let you do.',
    lands: 'For every write tool: can I tell whether it landed, and can I repeat it safely.',
    options: [
      {
        key: 'A',
        text: 'What are its retry count and its backoff?',
        why: 'Wrong first question. You would end the week with a tuned policy and the same unknown outcomes. That is the retry lever again.',
      },
      {
        key: 'B',
        text: 'If a call to it times out, can I find out whether it took effect, and can I repeat it safely?',
        correct: true,
        why: 'Correct. Recovery design is the separate decision, and those two answers are what it consists of. Each tool then ends the week with a named step rather than a tuned number.',
      },
      {
        key: 'C',
        text: 'Is it annotated idempotentHint: true?',
        why: 'Wrong. That reads a declaration. It tells you what a client may believe, not what the receiving system does with a second call.',
      },
      {
        key: 'D',
        text: 'Does it raise an alert when it fails?',
        why: 'Wrong, and it arrives after the money moves. An alert reports. The question is what the system does instead.',
      },
    ],
  },
  {
    id: 'K01',
    kind: 'kit',
    takeaway: 0,
    source: 'The Agent Failure Triage Kit · the triage tree',
    shape: 'Next check',
    ask: 'The kit asks four triage questions in a fixed order. Which one comes first?',
    hint: 'One of the three failure classes is the expensive one to get wrong.',
    lands: 'Ask about side effects before anything else.',
    options: [
      {
        key: 'A',
        text: '"Could an action with side effects already have executed?"',
        correct: true,
        why: 'Correct. Side effects come first, because misclassifying an uncertain action as a temporary failure is the expensive mistake.',
      },
      {
        key: 'B',
        text: '"Is required evidence genuinely absent?"',
        why: 'It is in the tree, second. Asked first, a timed-out payment is filed as missing evidence and a retry goes through behind it.',
      },
      {
        key: 'C',
        text: '"Is a dependency temporarily unavailable?"',
        why: 'Third in the tree. Asked first, an uncertain write looks retryable, which is how one customer is refunded three times.',
      },
      {
        key: 'D',
        text: '"Can a named owner resolve it?"',
        why: 'Fourth, and it is the last resort. Asked first, everything becomes an escalation and the tree does no work at all.',
      },
    ],
  },
  {
    id: 'K02',
    kind: 'kit',
    takeaway: 0,
    source: 'The Agent Failure Triage Kit · the three failure classes',
    shape: 'Next check',
    ask: 'The kit gives uncertain_action its own response. What is it?',
    hint: 'Each of the three classes has a different first move. This one is about establishing what happened.',
    lands: 'Reconcile before you re-issue.',
    options: [
      {
        key: 'A',
        text: 'Bounded retry of the tool, inside the task budget.',
        why: 'That is temporary_failure, where the dependency could not be reached and nothing outside the system changed.',
      },
      {
        key: 'B',
        text: 'Do not retry. Reconcile state first, then decide.',
        correct: true,
        why: 'Correct, and the kit says a timeout on a write is always this class. The first move is to establish what actually happened, not to try again.',
      },
      {
        key: 'C',
        text: 'Ask the requester once, and do not regenerate the answer.',
        why: 'That is missing_evidence, where the read completed and the answer is that there is nothing there.',
      },
      {
        key: 'D',
        text: 'Escalate to a named human immediately.',
        why: 'The kit escalates when state cannot be read, and sends the key with it. Escalating first hands over a question the system could have answered.',
      },
    ],
  },
];

export const CONCEPT_ITEMS = ITEMS.filter((i) => i.kind === 'concept');
export const KIT_ITEMS = ITEMS.filter((i) => i.kind === 'kit');

export const correctOf = (item: Item): Option => item.options.find((o) => o.correct)!;

export const optionOf = (item: Item, key: string): Option | undefined =>
  item.options.find((o) => o.key === key);

// ═══════════════════════════════════════════════════════════════════════════
// The close
// ═══════════════════════════════════════════════════════════════════════════

export interface Band {
  /** Lowest concept score in this band. */
  min: number;
  label: string;
  guidance: string;
}

/**
 * Bands over the ten concept questions. The kit questions are reported beside
 * them and never folded in: they test whether somebody read the kit, which is
 * a different claim from whether they can triage a timeout.
 *
 * No certificate language, and no band says the reader is qualified in
 * anything. Each one names the next action instead.
 */
export const BANDS: Band[] = [
  {
    min: 10,
    label: 'All ten',
    guidance:
      'Take the write tools you brought and answer question ten for each one. Start with the tool that moves money.',
  },
  {
    min: 8,
    label: 'Eight or nine',
    guidance:
      'Read the takeaways you missed below, then run question ten over your own write tools this week.',
  },
  {
    min: 6,
    label: 'Six or seven',
    guidance:
      'You have the diagnosis and not yet the design. Read the takeaways you missed, then the triage tree in the kit.',
  },
  {
    min: 3,
    label: 'Three to five',
    guidance:
      'Read the kit’s triage tree and its response playbook before you audit any tool.',
  },
  {
    min: 0,
    label: 'Two or fewer',
    guidance:
      'Start with the kit. Read the three failure classes and the four triage questions, then come back to the incident.',
  },
];

export const bandFor = (score: number): Band => BANDS.find((b) => score >= b.min)!;

/** The takeaways behind the concept questions a reader got wrong, in order. */
export const missedTakeaways = (wrongIds: string[]): number[] => {
  const ns = new Set<number>();
  for (const id of wrongIds) {
    const item = ITEMS.find((i) => i.id === id);
    if (item && item.kind === 'concept') ns.add(item.takeaway);
  }
  return [...ns].sort((a, b) => a - b);
};

export const CLOSE_TITLE = 'The fix was never a retry setting';

export const CLOSE: string[] = [
  'Every wrong answer in this quiz is something a competent team has proposed in a real incident review. Raise the retry count. Add backoff. Mark the tool idempotent. Turn retries off and page somebody. Each one is a reasonable instinct, and none of them answers whether the first attempt landed.',
  'The two questions that do are the ones in question ten, and they are asked of a tool rather than of a system. That is why the audit is a list of tools and not a design review.',
];

// ═══════════════════════════════════════════════════════════════════════════
// The specification citation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Takeaway 4 and question four make a claim about MCP, so the claim carries its
 * source and the date it was checked. Hint defaults and client behaviour can
 * change between specification versions: re-check this when the version moves,
 * and change the date in the same commit.
 */
export const MCP_SPEC = {
  version: '2026-07-28',
  checked: '26 September 2026',
  url: 'https://modelcontextprotocol.io/specification/2026-07-28/server/tools',
  /** Both lines are from that version. The first is the schema, the second the prose. */
  quotes: [
    'idempotentHint: "If true, calling the tool repeatedly with the same arguments will have no additional effect on its environment." Default: false.',
    'Clients MUST consider tool annotations to be untrusted unless they come from trusted servers.',
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// The integrity check
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Every rule the brief states, as an assertion. The page calls this at render
 * and throws, and `agent-failure-triage-quiz.test.ts` calls it too, so a broken
 * question bank fails the build rather than reaching a reader.
 *
 * Returns a list of problems. An empty list means the bank is sound.
 */
export const quizProblems = (): string[] => {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const item of ITEMS) {
    const at = `${item.id}`;
    if (seen.has(item.id)) problems.push(`${at}: duplicate id`);
    seen.add(item.id);

    if (item.options.length !== 4) problems.push(`${at}: ${item.options.length} options, expected 4`);

    const keys = item.options.map((o) => o.key).join('');
    if (keys !== 'ABCD') problems.push(`${at}: option keys are ${keys}, expected ABCD`);

    const right = item.options.filter((o) => o.correct);
    if (right.length !== 1) problems.push(`${at}: ${right.length} correct options, expected 1`);

    for (const o of item.options) {
      if (o.why.trim().length < 40) problems.push(`${at}${o.key}: feedback is too short to teach`);
      if (!o.text.trim()) problems.push(`${at}${o.key}: no option text`);
    }

    if (!item.hint.trim()) problems.push(`${at}: no hint`);
    if (!item.lands.trim()) problems.push(`${at}: no line for it to land`);

    if (item.kind === 'concept') {
      if (!TAKEAWAYS.some((t) => t.n === item.takeaway)) {
        problems.push(`${at}: takeaway ${item.takeaway} is not one of the seven`);
      }
    } else if (!item.source) {
      problems.push(`${at}: a kit question has to name where it came from`);
    }
  }

  const covered = new Set(CONCEPT_ITEMS.map((i) => i.takeaway));
  for (const t of TAKEAWAYS) {
    if (!covered.has(t.n)) problems.push(`takeaway ${t.n} is never tested`);
  }

  if (CONCEPT_ITEMS.length < 8 || CONCEPT_ITEMS.length > 10) {
    problems.push(`${CONCEPT_ITEMS.length} concept questions, expected 8 to 10`);
  }

  const shapes = new Set(CONCEPT_ITEMS.map((i) => i.shape));
  if (shapes.size < 4) problems.push(`${shapes.size} question shapes, expected at least 4`);

  // Nothing unfinished may ship. Brackets are how a generation prompt survives
  // into a published page, so they are refused everywhere in the bank.
  const unfinished = /\bTODO\b|\bTBD\b|\[[A-Za-z ]+\]|PLACEHOLDER/;
  const strings = ITEMS.flatMap((i) => [
    i.ask,
    i.hint,
    i.lands,
    i.source ?? '',
    ...(i.evidence?.lines ?? []),
    ...i.options.flatMap((o) => [o.text, o.why]),
  ]);
  for (const s of strings) {
    if (unfinished.test(s)) problems.push(`unfinished text in the bank: ${s.slice(0, 60)}`);
  }

  return problems;
};

/** Called in the page's frontmatter. A broken bank stops the build. */
export const assertQuiz = (): void => {
  const problems = quizProblems();
  if (problems.length) {
    throw new Error(`agent-failure-triage-quiz: ${problems.join('; ')}`);
  }
};
