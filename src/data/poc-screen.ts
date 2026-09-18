// The POC Selection Tool — the twelve questions, their scoring anchors, and
// every line of copy the page and the PDF share.
//
// Source of truth for /resources/poc-screen and for the PDF that route hands
// out. The value of this tool is that the 0/1/2 anchors are worded precisely
// enough that two people scoring the same proof of concept land on the same
// number. Every anchor names a threshold (a count, a time, a named person), so
// editing one is editing the rubric. Keep the threshold when you change the words.
//
// Section B is the gate: a 0 on any of its rows is a hard stop regardless of
// the total. That is expressed as `gate: true` on the section and read by the
// page, the summary and the PDF, not hard-coded against a letter.
//
// Rewritten in plain English on 17 September 2026. The earlier wording was
// lifted from a published Artifact and was dense; the cohort is mostly
// India-based and reads English as a second language, so every sentence here
// carries one idea and defines its own terms.

export interface ScreenItem {
  /** Short label, used in the scorecard, the summary and the PDF. */
  short: string;
  /** The question, as read aloud. */
  q: string;
  /** Why it is on the screen at all. */
  why: string;
  /** Exactly three anchors: what earns a 0, a 1 and a 2, in that order. */
  a: [string, string, string];
}

export interface ScreenSection {
  letter: string;
  /** The header. Named for the engineering concern, not for a metaphor. */
  name: string;
  /** The question the section answers. Printed under the header. */
  question: string;
  /** True only for failure containment: any zero here is a hard stop. */
  gate: boolean;
  blurb: string;
  items: ScreenItem[];
}

export const TOOL_NAME = 'The POC Selection Tool';

/** What the tool is for, in four lines. Printed above the score bar. */
export const PURPOSE = [
  'You have an idea for an AI agent. Before anyone builds it, this tool tells you whether it can reach production.',
  'Twelve questions in four sections. Each answer scores 0, 1 or 2. The maximum is 24.',
  'Section B is a hard gate. A 0 on any of its three questions stops the proof of concept, whatever the total.',
  'The result is one of three outcomes: pilot candidate, narrow it and score again, or a demo rather than a pilot.',
];

/** How to use it, as numbered steps. */
export const HOW_TO_USE = [
  'Pick one proof of concept. Score one at a time.',
  'Work through the four sections with Next and Back. Each has three questions.',
  'For each question, choose the answer that is true today, not the one that is planned. The page moves to the next question for you.',
  'Watch the score bar and the progress bar. Both stay at the top and update as you answer.',
  'Read the result at the end. It gives the outcome and what to fix first.',
  'Get the PDF of your scored copy at the end.',
];

export const SECTIONS: ScreenSection[] = [
  {
    letter: 'A',
    name: 'Task fit',
    question: 'Is this task shaped for an agent?',
    gate: false,
    blurb:
      'Three questions about the work itself. These fail quietly: nobody notices until the evaluation has nothing to measure against.',
    items: [
      {
        short: 'Repetition',
        q: 'The task happens in much the same shape hundreds of times a month.',
        why: 'Repetition pays for the build. Work that is rare, or different every time, never earns back the cost of evaluation and review.',
        a: [
          'Fewer than about 50 a month, or every case is different.',
          'Hundreds a month, but about a third of them need special handling.',
          'Hundreds or thousands a month, in a shape that clearly repeats.',
        ],
      },
      {
        short: 'Bounded actions',
        q: 'You can write down the full list of actions the agent may take, and the list is short.',
        why: 'An open-ended list means open-ended damage, and no reviewer can approve it. Count the actions before you count the features.',
        a: [
          'Open-ended, or nobody has written it down.',
          'Written down, but more than about eight actions. Or one of them is "anything else the tool allows".',
          'Written down, under about eight, each one named and justified.',
        ],
      },
      {
        short: 'Ground truth',
        q: 'A record of the correct outcome exists somewhere you can test against.',
        why: 'Closed tickets, ledger entries, past decisions. Without a record of the right answer there is no evaluation, and the demo stays the only evidence you have.',
        a: [
          'No record of what the correct outcome was.',
          'Outcomes exist but are scattered, unlabelled, or have to be rebuilt case by case.',
          'A queryable record of correct outcomes for past cases.',
        ],
      },
    ],
  },
  {
    letter: 'B',
    name: 'Failure containment',
    question: 'Can you survive it being wrong?',
    gate: true,
    blurb:
      'Three questions about what happens when the agent makes a mistake. This is the hard gate: a 0 on any question here stops the proof of concept, whatever the total.',
    items: [
      {
        short: 'Reversibility',
        q: 'The worst single action it can take can be undone, or a human must approve it first.',
        why: 'Refunds, emails, deletes, commitments. The common failure is a tool call that times out instead of failing. The system does not know whether the action happened, retries, and does it twice.',
        a: [
          'Cannot be undone, and it runs with no human in the path.',
          'Can be undone, but the undo is manual, slow, or visible to the customer.',
          'Undone cheaply and quietly, or a named approver has to agree first.',
        ],
      },
      {
        short: 'Visible failure',
        q: 'Someone catches a wrong answer before it reaches a customer, a regulator or a ledger.',
        why: 'A wrong answer nobody sees is the expensive kind. If nothing downstream catches it, your evaluation is the only defence, and it will not be enough in week one.',
        a: [
          'A wrong answer reaches the customer, the ledger or a regulator unseen.',
          'Caught downstream sometimes, and often after the customer has noticed.',
          'Every wrong answer meets a review step, a reconciliation or a person before it lands.',
        ],
      },
      {
        short: 'Stop and explain',
        q: 'A named person can stop it within minutes, and you can work out afterwards why it acted.',
        why: 'A kill switch nobody owns is not a kill switch. A trace you cannot replay is not an audit trail.',
        a: [
          'No stop control, or no named owner for it. Traces are not kept.',
          'Stopping it means shipping a change. Traces exist, but explaining one decision takes hours.',
          'A named person stops it in minutes, from a control they already have. Any decision can be replayed.',
        ],
      },
    ],
  },
  {
    letter: 'C',
    name: 'Evaluation evidence',
    question: 'Will you be able to prove it worked?',
    gate: false,
    blurb:
      'Three questions about the proof. Decide these before the build. A baseline cannot be measured after the agent has changed the work.',
    items: [
      {
        short: 'Measured baseline',
        q: 'You know what this task costs today: time, money and error rate.',
        why: 'Without a measured starting point, "better" is an opinion. The pilot review becomes an argument about stories.',
        a: [
          'Nobody knows what the task costs today.',
          'Time or cost is estimated. The error rate is not measured.',
          'Time, cost and error rate are all measured, from records, not from opinions.',
        ],
      },
      {
        short: 'Hard cases in hand',
        q: 'You can produce the hard cases today: missing information, conflicting history, two near-identical requests at once.',
        why: 'A demo never contains these cases. Production contains them every hour. If you cannot collect them now, you will not collect them under launch pressure.',
        a: [
          'Cannot produce them. The only examples are the easy path.',
          'Some are available, but most are invented rather than taken from real history.',
          'Real examples of each kind, pulled from records.',
        ],
      },
      {
        short: 'Uncertain outcomes',
        q: 'You can test what it does when a tool returns neither success nor failure.',
        why: 'Timeouts, partial writes, a confident wrong response. Most agent incidents start here, and almost no proof of concept tests it.',
        a: [
          'No way to simulate a timeout, a partial write, or a confident wrong response.',
          'Can simulate clear failures, but not the ambiguous ones, such as "success" for an action that never ran.',
          'Staging injects timeouts, partial writes and false successes, and you have run them.',
        ],
      },
    ],
  },
  {
    letter: 'D',
    name: 'Ownership and unit economics',
    question: 'Will the organisation keep it alive?',
    gate: false,
    blurb:
      'Three questions about the people and the money. A pilot that never leaves pilot usually has an ownership problem, not a tooling problem.',
    items: [
      {
        short: 'Named owner',
        q: 'One named business owner, not a committee, has a number that improves if this works.',
        why: "If nobody's metric moves, nobody defends the budget at the next planning round. The pilot quietly ages out.",
        a: [
          'No owner, or the owner is a committee, or the AI team itself.',
          'A named owner, but the outcome is not in any of their own goals.',
          'One named business owner with a number in their own plan that this moves.',
        ],
      },
      {
        short: 'Data reachable',
        q: 'The data it needs is in systems you can call today.',
        why: 'If a data programme has to finish first, that programme is the real project, and it is six months long. Say so now.',
        a: [
          'Needs data from a system with no interface, or a migration that has not started.',
          'Reachable, but only through an integration that has to be built first.',
          'Every input is available today from a system you already call.',
        ],
      },
      {
        short: 'Cost at 100×',
        q: 'Your cost estimate includes tool calls, retries and human review minutes, not only the model bill.',
        why: 'At a hundred times the volume, the model is usually the smallest line. Human review is usually the largest, and it grows in step with volume.',
        a: [
          'The estimate is a token cost, or there is no estimate.',
          'Includes tool calls and retries. Human review time is assumed to be zero.',
          'Includes tool calls, retries and reviewer minutes, as a cost per correct decision.',
        ],
      },
    ],
  },
];

/** The worked example. Deliberately a mixed, realistic score, not a pass. */
export const EXAMPLE: number[] = [2, 1, 2, 0, 1, 1, 1, 0, 0, 2, 2, 0];

export const MAX_SCORE = SECTIONS.reduce((n, s) => n + s.items.length * 2, 0);
export const QUESTION_COUNT = SECTIONS.reduce((n, s) => n + s.items.length, 0);

/** Flat list, with the gate flag carried down from the section. */
export const FLAT = SECTIONS.flatMap((s) => s.items.map((it) => ({ ...it, gate: s.gate })));

export const GATE_INDEXES = FLAT.map((f, i) => (f.gate ? i : -1)).filter((i) => i >= 0);

/** The rules for scoring in a room. Each one is a rule, then the reason. */
export const HOW_TO_RUN = [
  {
    lead: 'Score what is true today.',
    rest: '"We will build that in the pilot" scores 0. The tool measures readiness, not intent. This one rule decides whether the exercise is useful or theatre.',
  },
  {
    lead: 'Score alone, then compare.',
    rest: 'Read the question aloud. Each person picks a number before anyone speaks. Talking first pulls the room toward the loudest voice.',
  },
  {
    lead: 'A two-point gap is the finding.',
    rest: 'If one person scores a question 0 and another scores it 2, the team does not agree on what the system is. Settle that before moving on. It is worth more than the total.',
  },
  {
    lead: 'A blank is a 0.',
    rest: 'If nobody in the room can answer, nobody knows. Not knowing is what the question measures.',
  },
  {
    lead: 'Change the scope, not the argument.',
    rest: 'The right way to raise a score is to narrow what the proof of concept does, then score it again.',
  },
];

export type BandKey = 'gate' | 'go' | 'narrow' | 'stop';

export interface CutLine {
  key: BandKey;
  /** The score range, as printed. */
  score: string;
  /** The outcome, as a heading. */
  name: string;
  /** What to do next. */
  what: string;
  /** Lowest total that lands here. Undefined for the gate, which ignores the total. */
  min?: number;
}

/** The rubric. Order matters: the gate is checked first, then the total. */
export const CUT_LINES: CutLine[] = [
  {
    key: 'gate',
    score: 'Any 0 in B',
    name: 'Hard stop, whatever the total',
    what: 'A high score elsewhere does not buy back an action you cannot undo. Fix the reversibility, the review step or the stop control first, or pick a different proof of concept.',
  },
  {
    key: 'go',
    score: '20–24',
    name: 'Pilot candidate',
    what: 'Write the boundary down: who can use it, what it may do, which actions need review, and who can stop it. Then run a limited trial against that boundary.',
    min: 20,
  },
  {
    key: 'narrow',
    score: '14–19',
    name: 'Narrow it, then score again',
    what: 'The action list is usually too wide. Remove permitted actions until the low-scoring rows move. A smaller agent that ships beats a broad one that stalls.',
    min: 14,
  },
  {
    key: 'stop',
    score: '0–13',
    name: 'A demo, not a pilot',
    what: 'Not a bad idea. A bad first idea. Build it to learn if you want, but keep it off the roadmap and away from customers.',
    min: 0,
  },
];

/**
 * Read a set of scores against the rubric. One function, used by the page's
 * script, the summary and the PDF, so the three cannot disagree about a band.
 * `null` is an unanswered question and counts as 0 in the total.
 */
export function readScores(scores: (number | null)[]) {
  const answered = scores.filter((v) => v !== null).length;
  const total = scores.reduce<number>((n, v) => n + (v ?? 0), 0);
  const gateZero = GATE_INDEXES.filter((i) => scores[i] === 0);
  const complete = answered === QUESTION_COUNT;

  let band: CutLine | null;
  if (gateZero.length) band = CUT_LINES[0];
  else if (!complete) band = null;
  else band = CUT_LINES.find((c) => c.min !== undefined && total >= c.min) ?? null;

  const sections = SECTIONS.map((s, si) => {
    const start = SECTIONS.slice(0, si).reduce((n, x) => n + x.items.length, 0);
    const own = scores.slice(start, start + s.items.length);
    return {
      letter: s.letter,
      name: s.name,
      score: own.reduce<number>((n, v) => n + (v ?? 0), 0),
      max: s.items.length * 2,
      answered: own.filter((v) => v !== null).length,
    };
  });

  return { answered, total, complete, gateZero, band, sections };
}

export interface Move {
  num: string;
  name: string;
  body: string;
  cost: string;
  /** One-based question numbers this move answers. Joined to the summary. */
  answers: number[];
}

/** Four ways to answer most questions before the agent is built. */
export const MOVES: Move[] = [
  {
    num: '01',
    name: 'Write the evaluation set before the spec',
    body: 'Ask for 50 real cases from last quarter with known-correct outcomes. Recorded cases, not invented ones. If the team cannot collect 50 in a week, that is not a scheduling problem. The task has no ground truth, and an agent you cannot grade is an agent you cannot ship. Failing to produce the set is the answer.',
    cost: 'One week, no code',
    answers: [3, 8],
  },
  {
    num: '02',
    name: 'Let a person play the agent first',
    body: 'Before building anything, route real requests to a person. They sit behind the same interface the agent would use, follow the same rules, and use the same tools. You learn the real mix of requests, which ones have no clean answer, and whether anyone uses the thing at all. After two weeks you hold a labelled evaluation set you did not have to invent. If the flow is customer-facing, check the disclosure question with legal first.',
    cost: 'One person, two weeks',
    answers: [1, 2, 10],
  },
  {
    num: '03',
    name: 'Break the tools on purpose',
    body: 'In staging, make a tool time out instead of failing. Make it return success for an action that never happened. Make it return the wrong answer, confidently. Chaos engineering has been standard for services for twenty years and is almost unknown for agents. That is odd, because this is exactly where agent incidents start.',
    cost: 'One day to build the harness',
    answers: [4, 9],
  },
  {
    num: '04',
    name: 'Run it in shadow mode',
    body: 'Put it on live traffic and forbid it from acting. Log what it would have done, compare that with what the human did, and review only the disagreements. Those are usually a small share of the cases and hold all of the information. You get a real accuracy number with no risk of harm.',
    cost: 'A logging path and reviewer time',
    answers: [5, 7],
  },
];

/** The move that answers a one-based question number, if any. */
export const moveFor = (questionNumber: number): Move | undefined =>
  MOVES.find((m) => m.answers.includes(questionNumber));
