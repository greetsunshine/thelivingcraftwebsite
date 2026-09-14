// The POC Screen — the twelve questions and their scoring anchors.
//
// Source of truth for /resources/poc-screen. Lifted verbatim from the published
// artifact rather than retyped, because the value of this screen is that the
// 0/1/2 anchors are worded precisely enough that two people scoring the same
// proof of concept land on the same number. Paraphrasing an anchor breaks the
// only property that makes it better than a conversation.
//
// Section B is the gate: a zero on any of its rows is a hard stop regardless of
// the total. That is expressed as `gate: true` on the section and read by the
// page, not hard-coded against a letter.

export interface ScreenItem {
  /** Short label, used in the copied scorecard and as the aria name. */
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
  name: string;
  /** True only for the blast-radius section: any zero here is a hard stop. */
  gate: boolean;
  blurb: string;
  items: ScreenItem[];
}

export const SECTIONS: ScreenSection[] = [
  { letter:"A", name:"The work", gate:false,
    blurb:"Whether the task is shaped for an agent at all. These three fail quietly — nobody notices until the evaluation has nothing to measure against.",
    items:[
      { short:"Repetition",
        q:"This task happens in substantially the same shape hundreds of times a month.",
        why:"Repetition is what amortises the build. High-variance, low-volume work never earns back the evaluation and review cost.",
        a:["Fewer than about fifty a month, or every case is materially different.",
           "Hundreds a month, but the shape varies enough that a third need bespoke handling.",
           "Hundreds or thousands a month in a recognisably repeating shape."] },
      { short:"Bounded actions",
        q:"You can write the complete list of actions the agent may take, and it is short.",
        why:"If the list is open-ended, so is the blast radius, and no reviewer can approve it. Count the actions before you count the features.",
        a:["Open-ended, or nobody has written it down.",
           "Written down, but more than about eight actions — or one of them is “and anything else the tool allows”.",
           "Written down, under about eight, each one named and justified."] },
      { short:"Ground truth",
        q:"There is a record of the correct outcome somewhere you can test against.",
        why:"Closed tickets, ledger entries, prior decisions. No recorded ground truth means no evaluation, and no evaluation means the demo stays the only evidence you will ever have.",
        a:["No record of what the correct outcome was.",
           "Outcomes exist but are scattered, unlabelled, or need manual reconstruction case by case.",
           "A queryable record of correct outcomes for past cases."] }
    ]},
  { letter:"B", name:"The blast radius", gate:true,
    blurb:"Whether you survive being wrong. A zero on any row here is a hard stop regardless of the total — this is the section that ends careers, not roadmaps.",
    items:[
      { short:"Reversibility",
        q:"The worst single action it can take is reversible, or gated behind a human.",
        why:"Refunds, sends, deletes, commitments. The classic failure is a tool call that times out rather than fails, leaving the system unsure whether the action happened — and a sensible retry that does it twice.",
        a:["Irreversible, and it fires without a human in the path.",
           "Reversible, but the reversal is manual, slow, or visible to the customer.",
           "Reversible cheaply and quietly, or gated behind a named approver."] },
      { short:"Visible failure",
        q:"A wrong answer is caught by someone before it reaches a customer, a regulator or a ledger.",
        why:"Silent wrongness is the expensive kind. If nothing downstream catches it, the evaluation is your only defence and it will not be enough in week one.",
        a:["A wrong answer reaches the customer, the ledger or a regulator unseen.",
           "Caught downstream, but only sometimes — and often after the customer has noticed.",
           "Every wrong answer meets a review step, a reconciliation or a person before it lands."] },
      { short:"Stop and explain",
        q:"A named person can stop it within minutes, and you can reconstruct afterwards why it acted.",
        why:"A kill switch nobody owns is not a kill switch. A trace you cannot replay is not an audit trail.",
        a:["No stop control, or no named owner for it; traces are not retained.",
           "Stoppable by shipping a change; traces exist but reconstructing one decision takes hours.",
           "A named person stops it from a control they already have, in minutes, and any decision replays."] }
    ]},
  { letter:"C", name:"The evidence", gate:false,
    blurb:"Whether you will be able to prove it worked. Decided before the build or not at all — you cannot retrofit a baseline.",
    items:[
      { short:"Measured baseline",
        q:"You know what this task costs today in time, money and error rate.",
        why:"Without a measured baseline, “better” is an opinion, and the pilot review becomes an argument about anecdotes.",
        a:["Nobody knows what the task costs today.",
           "Time or cost is estimated; the error rate is not measured.",
           "Time, cost and error rate all measured — from records, not opinions."] },
      { short:"Hard cases in hand",
        q:"You can produce the hard cases today: missing information, conflicting history, two near-identical requests at once.",
        why:"These are the cases a demo never contains and production contains hourly. If you cannot assemble them now, you will not assemble them under launch pressure.",
        a:["Cannot produce them; the only examples are the happy path.",
           "Some available, but mostly invented rather than drawn from real history.",
           "Real examples of each, pulled from records."] },
      { short:"Uncertainty behaviour",
        q:"You can test what it does when a tool returns neither success nor failure.",
        why:"Timeouts, partial writes, ambiguous responses. Most agent incidents live here, and almost no POC tests it.",
        a:["No way to simulate a timeout, a partial write, or a confidently wrong response.",
           "Can simulate outright failures, but not the ambiguous ones — success for something that never happened.",
           "Staging injects timeouts, partial writes and false successes, and you have run them."] }
    ]},
  { letter:"D", name:"The ownership and the economics", gate:false,
    blurb:"Whether it survives contact with the organisation. Pilot purgatory is an ownership problem far more often than a tooling one.",
    items:[
      { short:"Named owner",
        q:"One named business owner — not a committee — has a number that improves if this works.",
        why:"If no one's metric moves, no one defends the budget at the next planning round, and the pilot quietly ages out.",
        a:["No owner, or the owner is a committee — or the AI team itself.",
           "A named owner, but the outcome appears in none of their own goals.",
           "One named business owner with a number in their own plan that this moves."] },
      { short:"Data reachable",
        q:"The data it needs is in systems you can call today.",
        why:"If a data programme has to land first, that programme is the real project and it is six months long. Say so out loud now.",
        a:["Needs data from a system with no interface, or a migration that hasn't started.",
           "Reachable, but through an integration that has to be built first.",
           "Every input available today from a system you already call."] },
      { short:"Cost at 100×",
        q:"Your cost estimate includes tool calls, retries and human review minutes — not just the model bill.",
        why:"At a hundred times the volume the model is usually the smallest line. Review labour is usually the largest, and it is the one that scales linearly.",
        a:["The estimate is a token cost — or there is no estimate.",
           "Includes tool calls and retries; human review time is assumed to be zero.",
           "Includes tool calls, retries and reviewer minutes, expressed as cost per correct decision."] }
    ]}
];;

/** The worked example. Deliberately a mixed, realistic score, not a pass. */
export const EXAMPLE: number[] = [2,1,2, 0,1,1, 1,0,0, 2,2,0];

export const MAX_SCORE = SECTIONS.reduce((n, s) => n + s.items.length * 2, 0);
export const QUESTION_COUNT = SECTIONS.reduce((n, s) => n + s.items.length, 0);

/** Flat list, with the gate flag carried down from the section. */
export const FLAT = SECTIONS.flatMap((s) => s.items.map((it) => ({ ...it, gate: s.gate })));

export const GATE_INDEXES = FLAT.map((f, i) => (f.gate ? i : -1)).filter((i) => i >= 0);

export const HOW_TO_RUN = [
  {
    "lead": "Score what is true today, not what is planned.",
    "rest": "\"We'll build that in the pilot\" is a 0. The screen measures readiness, not intent — this is the single rule that decides whether the exercise is useful or theatre."
  },
  {
    "lead": "Everyone scores privately, then reveals.",
    "rest": "Read the question aloud, each person commits to a number, then compare. Discussing first collapses the room onto whatever the loudest person thinks."
  },
  {
    "lead": "A two-point spread is the finding.",
    "rest": "Where scores disagree by two, the team does not share a picture of the system. Resolve that before moving on; it is worth more than the total."
  },
  {
    "lead": "A blank is a 0.",
    "rest": "If nobody in the room can answer, nobody knows, and not knowing is the condition being measured."
  },
  {
    "lead": "Re-score after narrowing, not after arguing.",
    "rest": "The legitimate way to move a score is to change the scope of the POC."
  }
];

export const CUT_LINES = [
  {
    "key": "gate",
    "score": "Any 0 in B",
    "name": "Hard stop, whatever the total",
    "what": "You cannot buy your way out of blast radius with a high score elsewhere. Fix the reversibility, the review step or the stop control first, or pick a different POC."
  },
  {
    "key": "go",
    "score": "20–24",
    "name": "Pilot candidate",
    "what": "Write the boundary down — who can use it, what it may do, which actions need review, who can stop it — and run a limited trial against it."
  },
  {
    "key": "narrow",
    "score": "14–19",
    "name": "Narrow it, then re-score",
    "what": "Usually the action list is too wide. Cut permitted actions until the low-scoring rows move. A smaller agent that ships beats a broad one that stalls."
  },
  {
    "key": "stop",
    "score": "0–13",
    "name": "A demo, not a pilot",
    "what": "Not a bad idea — a bad first idea. Build it to learn if you want, but do not put it on a roadmap or in front of a customer."
  }
];

/** Four ways to answer most of the screen before the agent exists. */
export const MOVES = [
  {
    "num": "01",
    "name": "Write the evaluation set before the spec",
    "body": "Ask for fifty real cases from last quarter with known-correct outcomes. Recorded ones, not invented ones. If the team cannot assemble fifty in a week, that isn't a scheduling problem: the task has no ground truth, and an agent you cannot grade is an agent you cannot ship. The failure to produce the set is the verdict.",
    "cost": "Cost: one week, no code",
    "answers": "Answers 03 · 08"
  },
  {
    "num": "02",
    "name": "Put a human behind the curtain",
    "body": "Before building anything, route real requests to a person sitting behind the interface the agent would use, answering under the same rules and with the same tools. You learn the true distribution of requests, which ones have no clean answer, and whether anyone uses the thing at all. You end the fortnight holding a labelled evaluation set you didn't have to imagine. Check the disclosure question with legal first if the flow is customer-facing.",
    "cost": "Cost: one person, two weeks",
    "answers": "Answers 01 · 02 · 10"
  },
  {
    "num": "03",
    "name": "Break the tools on purpose",
    "body": "In staging, make the tool time out rather than fail. Make it return success for an action that never happened. Make it return the wrong thing, confidently. Chaos engineering has been standard for services for twenty years and is almost unheard of for agents — which is odd, because this is precisely where agent incidents live.",
    "cost": "Cost: a day of harness",
    "answers": "Answers 04 · 09"
  },
  {
    "num": "04",
    "name": "Run it in shadow",
    "body": "Put it on live traffic and forbid it from acting. Log what it would have done, compare against what the human actually did, and review only the disagreements — usually a small fraction of cases, and all of the information. A real accuracy number with a blast radius of zero.",
    "cost": "Cost: a logging path and reviewer time",
    "answers": "Answers 05 · 07"
  }
];
