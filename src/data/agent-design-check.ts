/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The Agent Design Check rubric — nineteen questions, and the rules that turn
 * a set of answers into a set of next steps.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHAT THIS IS
 *
 * The roadmap (docs/Website Rebuild 10-09-2026/Website_Growth_Roadmap.html,
 * "Agent Design Check functional scope") asks for an ungated browser checklist
 * over seven areas — purpose, evidence, tool permissions, external actions,
 * evaluation, uncertainty and recovery, ownership — with structured
 * yes / no / not-yet-defined answers, and a result that names what is still
 * open, why it matters, and what to do next.
 *
 * Everything the tool can say is written down in this file, next to the
 * question it belongs to. `onGap`, `onUnwritten` and `onYes` are the three
 * things the checker will ever tell somebody about one question, and they are
 * literal strings so that Sunil can review them by reading them. That is the
 * roadmap's requirement in its own words: "transparent rules reviewed by
 * Sunil, not a model-generated readiness score."
 *
 * ───────────────────────────────────────────────────────────────────────────
 * FIVE THINGS THAT MUST NEVER BE DONE TO THIS FILE
 * ───────────────────────────────────────────────────────────────────────────
 *
 * 1. NEVER ADD A SCORE. No percentage, no count out of nineteen, no traffic
 *    light, no band, no "readiness level", no weighting. The roadmap rules a
 *    score out explicitly, and the reason is that a number invites the reader
 *    to improve the number. `tally()` returns counts because a count is a list
 *    you can look at; the moment those counts are combined into one figure,
 *    this has become the thing the roadmap said not to build.
 *
 * 2. NEVER CERTIFY. There is no output of this module that says a system is
 *    ready for production, and no set of answers produces one. Nineteen yeses
 *    produce a request for the evidence behind them — see `verdict()`.
 *
 * 3. NEVER PUT A MODEL BEHIND IT. Every string a visitor reads is authored
 *    here. Nothing is generated, ranked or summarised at run time. A model
 *    that improvised a next step would be inventing advice about a system it
 *    has never seen, on a page whose whole argument is that the rules are
 *    readable in advance.
 *
 * 4. NEVER SEND THE ANSWERS ANYWHERE. This module is pure: it takes an object
 *    of answers and returns strings. No fetch, no beacon, no import that
 *    reaches the network. The page that uses it holds the answers in a closure
 *    and drops them when the tab closes — that, and not a promise in a privacy
 *    notice, is what "retain no architecture answers on the server" means
 *    here. There is also no localStorage or sessionStorage: CLAUDE.md forbids
 *    both site-wide, and in this one case the prohibition and the requirement
 *    happen to be the same sentence.
 *
 * 5. NEVER COLLAPSE `no` AND `not-yet-defined`. They are two different facts
 *    about a team and they must stay two. "No, we have not designed that" is a
 *    gap the team can already name — somebody looked, and the answer was no.
 *    "Not yet defined" means nobody has decided, so what the system does today
 *    is unknown to the people who own it. The first needs a design change; the
 *    second needs a decision before anyone can say what to change. That is why
 *    each question carries two different next steps rather than one.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHERE THE MATERIAL COMES FROM
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The questions follow the six decisions in the pillar guide
 * (src/content/guides/agentic-system-design.md) plus the two areas the roadmap
 * names that the six do not cover on their own — external actions and
 * ownership. The worked example is the house one: a returns assistant that
 * reads a policy, recommends a refund, and is then given a tool that can issue
 * it. It is the example in the VSL script and on the cohort page, and reusing
 * it is deliberate — nineteen invented scenarios would be nineteen things to
 * learn before answering the first question.
 *
 * Nothing here is a research finding. There are no statistics, no benchmark
 * numbers and no claims about what proportion of teams do anything, because
 * there is no source for any of that and CLAUDE.md is absolute about inventing
 * them. The rubric is questions and reasons.
 */

/** The three answers the roadmap specifies. Values are the radio values too. */
export type Answer = 'yes' | 'no' | 'not-yet-defined';

/**
 * What the result can say about one question. `unanswered` is NOT a fourth
 * answer — it is the absence of one, and the distinction matters: the checker
 * must never report a skipped question as a gap, which would be the tool
 * inventing a finding about a design it was told nothing about.
 */
export type Standing = Answer | 'unanswered';

/** Absent key means unanswered. */
export type Answers = Partial<Record<string, Answer>>;

export type AreaId =
  | 'purpose'
  | 'evidence'
  | 'tools'
  | 'actions'
  | 'evaluation'
  | 'uncertainty'
  | 'ownership';

/**
 * Whether the question is about something the system does that other people
 * and other systems can see — and that cannot be taken back — or about how it
 * reasons and what it records. This is one of the two ordering keys, and it is
 * the only judgement the code makes about relative urgency.
 */
export type Reach = 'outward' | 'internal';

export interface Guide {
  href: string;
  title: string;
}

export interface Area {
  id: AreaId;
  /** Sentence case, like every other label in this design system. */
  title: string;
  blurb: string;
}

export interface Question {
  /** Stable for the life of the rubric. Reordering must not remap anything. */
  id: string;
  area: AreaId;
  /** Four to eight words, for lists and the exported summary. */
  label: string;
  /** The claim being checked, phrased so yes / no / not-yet-defined all read. */
  ask: string;
  /** Why it matters. Shown beside the question AND in the result. */
  why: string;
  /** The returns assistant, concretely. One scenario across all nineteen. */
  example: string;
  reach: Reach;
  guide: Guide;
  /** Answer `no` — a reported gap. A design change. */
  onGap: string;
  /** Answer `not-yet-defined` — nobody has decided. A decision. */
  onUnwritten: string;
  /** Answer `yes` — the evidence that would show it. Never a tick. */
  onYes: string;
}

/**
 * The four guides in the first content release. Routes are the ones the pillar
 * guide already links to in its own body, so the two agree.
 */
export const GUIDES = {
  pillar: {
    href: '/resources/guides/agentic-system-design',
    title: 'Designing agentic systems',
  },
  workflow: {
    href: '/resources/guides/workflow-or-agent',
    title: 'When a workflow is enough',
  },
  permissions: {
    href: '/resources/guides/tool-permissions',
    title: 'Who may call the tool',
  },
  uncertain: {
    href: '/resources/guides/uncertain-evidence',
    title: 'What to do with uncertain evidence',
  },
} as const satisfies Record<string, Guide>;

/**
 * The built-in illustrative example. It is stated once, at the top of the
 * page, and every question's `example` field continues it.
 *
 * The disclaimer is not boilerplate. The pillar guide carries the same line
 * for the same reason: a plausible scenario written in the present tense reads
 * as an incident report unless you say plainly that it is not one.
 */
export const EXAMPLE = {
  title: 'A returns assistant that can pay',
  disclaimer:
    'An illustrative example. It is not an account of a real customer system, and no incident is being described.',
  paragraphs: [
    'Imagine a returns assistant. A customer writes in about a return. The assistant finds the relevant policy, looks up the order, and recommends a refund. The conversation reads well. You can follow the reasoning, and you can see how it would save somebody a lot of repetitive work.',
    'Then someone asks a perfectly reasonable question: can it issue the refund as well?',
    'On a diagram that is one more connection. In the world, the system can now move money — and that changes which questions are worth asking about it.',
    'Every question below continues this one example, so you can answer for your own system without having to describe it to anybody, and without a new scenario to learn each time.',
  ],
} as const;

export const AREAS: Area[] = [
  {
    id: 'purpose',
    title: 'Purpose and boundary',
    blurb: 'What the system is for, where it stops, and whether it needed to be an agent at all.',
  },
  {
    id: 'evidence',
    title: 'Evidence',
    blurb: 'What must be established before it acts, and whether that can be checked afterwards.',
  },
  {
    id: 'tools',
    title: 'Tool permissions',
    blurb: 'What each tool may do, and where that limit is actually enforced.',
  },
  {
    id: 'actions',
    title: 'External actions',
    blurb: 'What happens when the system does something the world can see and you cannot take back.',
  },
  {
    id: 'evaluation',
    title: 'Evaluation',
    blurb: 'What you can see after a run, and what the system is checked against.',
  },
  {
    id: 'uncertainty',
    title: 'Uncertainty and recovery',
    blurb: 'What it does when it cannot establish what it needs, and how a person takes over.',
  },
  {
    id: 'ownership',
    title: 'Ownership',
    blurb: 'Who is answerable for the behaviour, and what happens when it changes.',
  },
];

/**
 * The nineteen questions, in the order the decisions are worth making. That
 * order is the pillar guide's own, and it is the second ordering key in
 * `nextSteps()` — so moving a question here changes the priority of its step.
 * Do that on purpose or not at all.
 */
export const QUESTIONS: Question[] = [
  // ── 1 · Purpose and boundary ──────────────────────────────────────────────
  {
    id: 'purpose-fit',
    area: 'purpose',
    label: 'The open part and the closed part',
    ask: 'You can say which part of this work genuinely needs a decision made at run time, and which part is a fixed sequence.',
    why: 'An agent is a decision about control flow, not about capability. If the steps are knowable before the request arrives, a workflow does the same job and can be reviewed before it runs. Reaching for an agent because there is a model in the design moves decisions from review time to run time and gets nothing back for it.',
    example:
      'Reading an unstructured message and working out which policy applies is open — the next step depends on what the assistant finds. Issuing a refund against an identified order, a policy version and an amount is closed: a fixed sequence, and calling it from a model does not make it anything else.',
    reach: 'internal',
    guide: GUIDES.workflow,
    onGap: 'Draw the line between the open part and the closed part, and write the closed part as a function the agent calls rather than a sequence it improvises each time.',
    onUnwritten:
      'Put the question to the team before the others: which decision here actually depends on what the system finds? The answer changes what the rest of this checklist is about.',
    onYes: 'Bring the line itself — where the open part ends and the closed part begins — and be ready to say which decisions sit on each side.',
  },
  {
    id: 'purpose-statement',
    area: 'purpose',
    label: 'A purpose somebody can check',
    ask: 'The purpose is written as a task and a boundary, in one sentence somebody outside the team could check.',
    why: '"Handle returns" cannot be checked by anyone. A purpose written as a task with a boundary can be held against the behaviour, and it is what a reviewer measures scope creep against a year later. A goal is only worth writing if it is testable: "safer" is not a goal, "no order is refunded twice" is, because you can go and look.',
    example:
      '"Reads a customer’s return request, identifies the order, applies the published returns policy, and recommends or issues a refund within the window that policy defines."',
    reach: 'internal',
    guide: GUIDES.pillar,
    onGap: 'Write the sentence. Task first, then the boundary — the point at which the system stops rather than continues.',
    onUnwritten:
      'Ask two people who work on it to write the sentence separately, then compare them. Where they differ is the part of the purpose that was never decided.',
    onYes: 'Bring the sentence, and one recent run that landed near its edge.',
  },
  {
    id: 'purpose-non-goals',
    area: 'purpose',
    label: 'Non-goals, written down',
    ask: 'The non-goals are written down, and each one is something somebody could plausibly have asked for.',
    why: 'Goals tell a reviewer what you were trying to build, which they can usually infer. Non-goals tell them what you decided against, which they cannot — and a non-goal nobody can quite justify is very often the seam where the design is unresolved.',
    example:
      'It does not amend an order. It does not cancel a subscription. It does not contact a bank. It does not act on an order it could not identify.',
    reach: 'internal',
    guide: GUIDES.pillar,
    onGap: 'Write the four or five things it must not do, with a reason for each. Keep the ones that are hard to justify — those are the questions for the next review.',
    onUnwritten:
      'Ask what somebody has already requested and been told no. Those answers are non-goals that exist but have never been recorded as design.',
    onYes: 'Bring the list, and say which non-goal has been questioned most often since it was written.',
  },

  // ── 2 · Evidence ──────────────────────────────────────────────────────────
  {
    id: 'evidence-list',
    area: 'evidence',
    label: 'An evidence list per action',
    ask: 'For each action the system can take, the facts that must be established first are named, with where each one comes from.',
    why: 'An action with no evidence list is an action whose preconditions live in a prompt and in somebody’s memory. Naming them is also what makes it possible for the tool to refuse: a tool cannot check a precondition nobody wrote down.',
    example:
      'Before a refund: an identified order; the state of that order; the policy clause that permits it and which version that clause came from; the amount that clause allows; and the absence of a prior refund against the same order.',
    reach: 'internal',
    guide: GUIDES.pillar,
    onGap: 'Take the action with the largest effect and write its evidence list first. One line per fact, with its source beside it.',
    onUnwritten:
      'Find out what the system is relying on today when it acts. If the answer is "the conversation so far", the list is empty, and that is the finding.',
    onYes: 'Bring the list for the action with the largest effect, and walk it against one real run.',
  },
  {
    id: 'evidence-reference',
    area: 'evidence',
    label: 'Evidence as a reference, not a recollection',
    ask: 'Evidence is held as a reference that can be checked afterwards — an identifier and a version — rather than a paraphrase carried in the context.',
    why: '"The policy says returns are accepted within the window" is a recollection sitting in a context window. It cannot be checked after the fact, and it cannot be checked by the tool at the moment of the call. A clause identifier and a version can be both. This is also what makes the system explainable: an answer built out of references is an answer, and an answer built out of the model’s summary of its own reasoning is a story about an answer.',
    example:
      'The refund carries clause 4.2 of the returns policy at the version in force that day — not a sentence summarising what the policy seemed to say.',
    reach: 'internal',
    guide: GUIDES.pillar,
    onGap: 'Change the evidence the system carries from text to identifiers. Start with the one fact a dispute would turn on.',
    onUnwritten:
      'Take one completed run and try to answer "which version of the policy was this decided under?" How far you get is the answer to this question.',
    onYes: 'Bring one run’s references and resolve them live — the point is whether they still resolve, not whether they were recorded.',
  },
  {
    id: 'evidence-recheck',
    area: 'evidence',
    label: 'The tool re-checks what it was handed',
    ask: 'The tool re-checks the evidence it was handed rather than trusting the arguments it was called with.',
    why: 'Evidence gathered a few steps earlier may have been superseded, and may never have been what the caller says it was. The check that matters is the one at the point where the effect happens, because that is the only check an unusual input cannot route around.',
    example:
      'The refund tool re-reads the cited clause at the cited version and re-reads the order state, and refuses if either has moved — rather than accepting the amount it was passed.',
    reach: 'outward',
    guide: GUIDES.permissions,
    onGap: 'Move the precondition check inside the tool. It can stay in the agent as well; it cannot only be there.',
    onUnwritten:
      'Read the tool’s entry point and list what it validates. That list, whatever it turns out to be, is the design as it stands today.',
    onYes: 'Bring the tool’s own validation, and a case where it refused a call the agent was willing to make.',
  },

  // ── 3 · Tool permissions ──────────────────────────────────────────────────
  {
    id: 'tools-one-job',
    area: 'tools',
    label: 'One job, narrowest scope',
    ask: 'Each tool has one job and the narrowest scope that lets it do that job.',
    why: 'A broad tool is a permission granted to every path that can reach it, including the paths nobody designed. Narrowness is one of the few properties of a tool that holds regardless of what the model was persuaded to ask for.',
    example:
      '"Issue a refund against this order for this amount" rather than "call the payments API".',
    reach: 'outward',
    guide: GUIDES.permissions,
    onGap: 'Split the widest tool into the operations that are actually used, and take away the ones that are not.',
    onUnwritten:
      'List every tool the agent can call and, beside each, the widest thing it could do if called with the most permissive arguments it accepts. That list is the real permission model.',
    onYes: 'Bring the tool list with each tool’s scope, and name the widest one.',
  },
  {
    id: 'tools-enforced',
    area: 'tools',
    label: 'Limits enforced at the tool',
    ask: 'Each tool’s limits are enforced by the tool itself, not stated in the prompt.',
    why: 'An instruction in a system prompt is a message inside the system. The tool is where the effect happens. Whatever is enforced at the tool holds regardless of what the model was asked to do — and the distinction is structural rather than a claim about how obedient a model is.',
    example:
      'The refund tool refuses an amount above what the cited clause permits. The prompt telling the assistant not to exceed the policy is guidance; the refusal is the control.',
    reach: 'outward',
    guide: GUIDES.permissions,
    onGap: 'Take the limits currently written in the prompt and implement each one at the tool. Leave the prompt text where it is; it is now a description of a control rather than the control.',
    onUnwritten:
      'For the tool with the largest effect, ask what happens if it is called with an argument beyond the limit. If nobody knows, call it and find out in a test environment.',
    onYes: 'Bring the enforcing code, not the prompt, and one refusal from it.',
  },
  {
    id: 'tools-identity',
    area: 'tools',
    label: 'Its own identity, and a record of every call',
    ask: 'Each tool acts under an identity of its own rather than a shared administrative one, and every call is recorded with its arguments and its result.',
    why: 'A shared identity gives every tool the union of every tool’s rights and leaves the log unable to answer who did this. The record is also the only thing that can settle a dispute afterwards — "the system decided to" is not evidence.',
    example:
      'The refund tool holds refund rights and nothing else. It cannot amend an order, because that is a different tool acting as somebody else.',
    reach: 'outward',
    guide: GUIDES.permissions,
    onGap: 'Give the tool with the largest effect its own identity first, and record its calls. The others follow from the same work.',
    onUnwritten:
      'Find out which credential the tools actually run as. One shared administrative identity is a common answer and it is worth knowing before anything else here is decided.',
    onYes: 'Bring one call record end to end: who it acted as, what it was passed, what it returned.',
  },

  // ── 4 · External actions ──────────────────────────────────────────────────
  {
    id: 'actions-separated',
    area: 'actions',
    label: 'Recommending and acting are separate',
    ask: 'Recommending an action and taking it are separate steps, with separate permission.',
    why: 'A recommendation is reviewable text. An action moves money, sends a message or changes somebody’s record. Folding them together means one design decision governs both, and the safe version of the first is not the safe version of the second.',
    example:
      'The assistant gathers the policy evidence and prepares a recommendation. Issuing the refund is a separate call, with its own controls over what it will allow.',
    reach: 'outward',
    guide: GUIDES.pillar,
    onGap: 'Split the step. The recommendation keeps the reasoning; the action keeps the authority, and gets its own conditions.',
    onUnwritten:
      'Trace one run from the message to the effect and mark the point where a recommendation became an action. If there is no such point, that is the finding.',
    onYes: 'Bring both halves and say what the second one requires that the first does not.',
  },
  {
    id: 'actions-repeat',
    area: 'actions',
    label: 'A repeat cannot pay twice',
    ask: 'A repeated request cannot produce the effect twice — the action is idempotent against a key that comes from the request.',
    why: 'A retry, a refresh, and a customer writing in twice all look the same to a system that identifies an action only by the fact that it was asked for. The key has to be derived from the request rather than from the attempt, or the second attempt simply carries a second key.',
    example:
      'The same customer sends the same request twice. The refund is keyed to the order and the clause, so the second call returns the first refund rather than paying again.',
    reach: 'outward',
    guide: GUIDES.pillar,
    onGap: 'Choose the key from the request — the order, the clause, the period — and make the tool return the existing result when it sees one it has already handled.',
    onUnwritten:
      'Send the same request twice in a test environment and look at what happened. This is the cheapest question on the list to answer and one of the more expensive ones to leave open.',
    onYes: 'Bring the key and say what it is derived from, then send the request twice and show the second result.',
  },
  {
    id: 'actions-timeout',
    area: 'actions',
    label: 'An unknown outcome can be established',
    ask: 'When a tool times out or returns an ambiguous result, there is a way to establish what actually happened before deciding whether to repeat it.',
    why: 'An unknown outcome is not a failure, and treating it as one is how a single action becomes two. Treating it as a success is how somebody is told nothing happened when it did. The design has to be able to go and look.',
    example:
      'The refund call times out. Before anything else, the system reads the payment back by its key and finds out whether the money moved.',
    reach: 'outward',
    guide: GUIDES.uncertain,
    onGap: 'Give the action a way to be read back — by the same key it was issued under — and make the timeout path use it before it retries or reports.',
    onUnwritten:
      'Ask what the code does today on a timeout from the tool with the largest effect. Retry, fail, or nothing at all are three different designs and one of them is already in production.',
    onYes: 'Bring the read-back path and one run where it was used.',
  },

  // ── 5 · Evaluation ────────────────────────────────────────────────────────
  {
    id: 'eval-record',
    area: 'evaluation',
    label: 'A record of what it used and did',
    ask: 'Each run keeps what the system used and what it did — the evidence with its references, every tool call with its arguments and result, the outcome — and not only the transcript.',
    why: 'The transcript is what the system said. A review holding only the final answer can tell you the answer was wrong, but not whether the cause was missing evidence, an over-broad permission or a tool returning something unexpected — and those are three different changes. This is the decision that makes the other five improvable.',
    example:
      'Why was this refund issued? An answer built from the clause, the version and the tool’s response is an answer. An answer built from the model’s account of its own reasoning is not.',
    reach: 'internal',
    guide: GUIDES.pillar,
    onGap: 'Record the evidence references and the tool calls alongside whatever is captured today. Start with the runs that end in an external action.',
    onUnwritten:
      'Take a run from last week and try to reconstruct which evidence it used. What you cannot recover is what is not being kept.',
    onYes: 'Bring one run’s record and answer a "why did this happen" question from it alone.',
  },
  {
    id: 'eval-cases',
    area: 'evaluation',
    label: 'Cases, and failures that become cases',
    ask: 'There is a set of cases the system is checked against, and a real failure becomes one of them.',
    why: 'Without cases, a change is judged by whether the demo still looks right — which it usually does, because that is the path the demo takes. A failure that does not become a case is a failure you have agreed to have again.',
    example:
      'The partially shipped order that was refunded in full is now a case, carrying the evidence the system should have required before acting.',
    reach: 'internal',
    guide: GUIDES.pillar,
    onGap: 'Write down the last three failures as cases before writing any new ones. They are the only cases you already know matter.',
    onUnwritten:
      'Ask what is run before a prompt or model change ships. If the answer is a look at the output, that is the current evaluation and it can be written down as such.',
    onYes: 'Bring the case set and say which case came from a real failure most recently.',
  },

  // ── 6 · Uncertainty and recovery ──────────────────────────────────────────
  {
    id: 'uncertain-third-outcome',
    area: 'uncertainty',
    label: 'A third outcome besides act and fail',
    ask: 'There is a third outcome besides acting and failing: handing over with the specific gap named.',
    why: 'The honest output when evidence is missing is not a lower-confidence version of the normal output. It is a different output, and it has to be designed as one — otherwise the system’s only way of expressing doubt is to do the usual thing slightly less well.',
    example:
      'The request falls outside any policy the assistant holds. It stops short of the refund and says which fact it could not establish, rather than recommending its best guess.',
    reach: 'internal',
    guide: GUIDES.uncertain,
    onGap: 'Add the third outcome as a real return value, not a lower score on the normal one, and give it somewhere to go.',
    onUnwritten:
      'Give the system a request the policy does not cover and watch what it does. Whatever that is, it is the current design for uncertainty.',
    onYes: 'Bring a run that took the third path and show what the recipient was handed.',
  },
  {
    id: 'uncertain-kinds',
    area: 'uncertainty',
    label: 'Kinds of uncertainty routed differently',
    ask: 'Different kinds of uncertainty are routed differently, rather than collapsed into one confidence number.',
    why: 'A missing policy, an ambiguous order state and two policy versions that disagree are three situations calling for three different next steps. One threshold throws away exactly the information that would have said which — and a number below a threshold tells the person who receives it nothing about what to do.',
    example:
      '"No clause covers this" goes to whoever can decide policy. "Two clauses disagree" goes to whoever owns the policy. "The order state is unclear" is a lookup, not a judgement.',
    reach: 'internal',
    guide: GUIDES.uncertain,
    onGap: 'Name the kinds you actually meet, and give each one a destination. Three named routes beat one number.',
    onUnwritten:
      'Read a week of handovers and sort them into kinds. The sort will be rough and it will still be more useful than a threshold.',
    onYes: 'Bring the kinds and, for each, where it goes and who acts on it.',
  },
  {
    id: 'recovery-handover',
    area: 'uncertainty',
    label: 'A person can take over, and is handed something',
    ask: 'A person can take over a run in progress, and what they are handed is defined.',
    why: '"A human is in the loop" is not a design until you can say who, how they are reached, what they see, and what happens to the run while they decide. An intervention path that exists in principle is a queue nobody is watching.',
    example:
      'The assistant hands over the request, the order, the clauses it found and the reason it stopped — rather than a conversation for somebody to read from the top.',
    reach: 'outward',
    guide: GUIDES.uncertain,
    onGap: 'Define the handover payload first — it is the part that decides whether the person can act — then the route and the owner.',
    onUnwritten:
      'Find out where a stopped run goes today and how long it sits there. If nobody can say, nothing is watching it.',
    onYes: 'Bring one handover and ask the person who received it whether they could act on it without asking a question.',
  },

  // ── 7 · Ownership ─────────────────────────────────────────────────────────
  {
    id: 'own-named',
    area: 'ownership',
    label: 'A named owner, and one per tool',
    ask: 'A named person or team owns the system’s behaviour, and each tool it calls has a named owner too.',
    why: 'Most of the permission work happens on the far side of the tool boundary, which often means a different team, a different repository and a different review. A permission model that lives only in the agent’s codebase is one integration away from being bypassed, and the first sign of that is nobody being able to name who owns the tool.',
    example:
      'The assistant has an owner. So does the refund tool, and it is not the same team.',
    reach: 'internal',
    guide: GUIDES.permissions,
    onGap: 'Write the names down, including the ones that turn out to be the same person. The duplicates are worth seeing.',
    onUnwritten:
      'Ask who would be called if the refund tool started behaving differently. The pause before the answer is the finding.',
    onYes: 'Bring the list and check that each named owner knows they are on it.',
  },
  {
    id: 'own-change',
    area: 'ownership',
    label: 'Prompt, model and scope changes get reviewed',
    ask: 'A change to the prompt, the model or a tool’s scope goes through a review that records what changed and why.',
    why: 'Those three change behaviour without changing anything a test was written against. A prompt edit that widens what the system will attempt is a change to the design, and it should leave the same trace a code change does — otherwise the record of why the system behaves as it does has a hole in it exactly where the behaviour was decided.',
    example:
      'Widening the refund tool from "within the policy window" to "within the window, or where a manager has approved" is a design change with a record, not a configuration tweak.',
    reach: 'internal',
    guide: GUIDES.pillar,
    onGap: 'Put the prompt and the tool definitions where changes to them are reviewed the way code changes are, and record the reason alongside the diff.',
    onUnwritten:
      'Find out how the current prompt got its last three edits, and whether anybody can say why. That is the change process as it exists.',
    onYes: 'Bring the last three changes with their reasons, and check that a model version change is among the things that count.',
  },
];

/**
 * How each standing is named and what it means. The two middle entries are the
 * distinction the roadmap calls out by name, so their wording is the wording
 * the whole tool uses — the radio label, the result badge and the exported
 * summary all read from here rather than restating it.
 */
export const STANDINGS: Record<
  Standing,
  { choice: string; short: string; meaning: string }
> = {
  yes: {
    choice: 'Yes — this is designed',
    short: 'Addressed',
    meaning:
      'You are saying the design has an answer here. That is a claim, and the result asks what would show it.',
  },
  no: {
    choice: 'No — we have not designed this',
    short: 'Reported gap',
    meaning:
      'You know the answer and the answer is no. Somebody looked; there is a hole you can already name, so the next step is a design change.',
  },
  'not-yet-defined': {
    choice: 'Not yet defined',
    short: 'Not yet defined',
    meaning:
      'Nobody has decided. What the system does here today is unknown to the people who own it, so the next step is finding out, not building.',
  },
  unanswered: {
    choice: 'Not answered here',
    short: 'Not answered here',
    meaning:
      'You did not answer this one. Nothing has been assumed about it, and it is reported as still open rather than as a gap.',
  },
};

/**
 * The ordering rules, in the words shown to the reader. They are printed
 * before the form and again inside the result, and the exported summary
 * carries them, so that anybody holding the output can see what produced it.
 *
 * These five sentences and the code below must agree. If you change one,
 * change both in the same edit.
 */
export const RULES: string[] = [
  'Every next step below is written in the rubric, next to the question it belongs to. Nothing is generated, ranked or summarised by a model, and you can read the whole rubric before answering anything.',
  'Steps are ordered by two things only. First, whether the question is about an action that leaves the system — one you cannot take back. Then the order the questions appear in, which is the order these decisions are worth making.',
  'A reported gap and a not-yet-defined answer are not ranked against each other. They are different kinds of work: a gap already has a decision behind it and needs a design change, while an undefined answer means nobody has decided and the first step is to find out.',
  'Answering yes closes nothing. It asks for the artefact that would show it.',
  'There is no score, no percentage and no grade, and no set of answers produces a readiness verdict. Nineteen yeses produce nineteen requests for evidence.',
];

/**
 * What kind of result this is.
 *
 *   starting  — nothing has been established either way. The roadmap:
 *               "All-unknown input returns a starting checklist, not a failure
 *               grade." So it returns the rubric in priority order, and says
 *               plainly that it is a place to start.
 *   evidence  — every question marked yes. The roadmap: "A claim that every box
 *               is addressed still requests evidence rather than certifying
 *               production readiness."
 *   steps     — the ordinary case.
 */
export type Verdict = 'starting' | 'evidence' | 'steps';

export function standingOf(answers: Answers, id: string): Standing {
  return answers[id] ?? 'unanswered';
}

/** Counts. Never combined into one figure — see rule 1 at the top of the file. */
export function tally(answers: Answers): Record<Standing, number> {
  const counts: Record<Standing, number> = {
    yes: 0,
    no: 0,
    'not-yet-defined': 0,
    unanswered: 0,
  };
  for (const q of QUESTIONS) counts[standingOf(answers, q.id)] += 1;
  return counts;
}

export function verdict(answers: Answers): Verdict {
  const counts = tally(answers);
  if (counts.yes === QUESTIONS.length) return 'evidence';
  // Nothing has been established either way: every answer is "not yet defined"
  // or was left alone. That is the all-unknown case.
  if (counts.yes === 0 && counts.no === 0) return 'starting';
  return 'steps';
}

export interface Step {
  question: Question;
  standing: Standing;
  /** A gap needs a design change; anything else needs a decision first. */
  kind: 'design' | 'decision';
  /** The literal string from the rubric. Never assembled at run time. */
  action: string;
}

const REACH_RANK: Record<Reach, number> = { outward: 0, internal: 1 };

/**
 * The prioritised next steps.
 *
 * Two keys, both of them stated in RULES above: reach first, then the rubric's
 * own order. `no` and `not-yet-defined` are NOT ranked against each other —
 * the standing decides which of the question's two next steps you are given,
 * not where it sits in the list.
 */
export function nextSteps(answers: Answers): Step[] {
  const v = verdict(answers);
  if (v === 'evidence') return [];

  // In the all-unknown case every question is a step, because that is what a
  // starting checklist is. Otherwise only the ones you told us about.
  const pool =
    v === 'starting'
      ? QUESTIONS
      : QUESTIONS.filter((q) => {
          const s = standingOf(answers, q.id);
          return s === 'no' || s === 'not-yet-defined';
        });

  return pool
    .map((question, index) => ({ question, index }))
    .sort(
      (a, b) =>
        REACH_RANK[a.question.reach] - REACH_RANK[b.question.reach] || a.index - b.index,
    )
    .map(({ question }) => {
      const standing = standingOf(answers, question.id);
      const isGap = standing === 'no';
      return {
        question,
        standing,
        kind: isGap ? ('design' as const) : ('decision' as const),
        action: isGap ? question.onGap : question.onUnwritten,
      };
    });
}

/** The `yes` answers, in rubric order. Each carries a request for evidence. */
export function evidenceRequests(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => standingOf(answers, q.id) === 'yes');
}

/**
 * Questions with no answer recorded. Reported as still open — never as a gap,
 * and never counted toward anything.
 */
export function stillOpen(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => standingOf(answers, q.id) === 'unanswered');
}

export function areaOf(id: AreaId): Area {
  // Every question's area is one of AREAS, so this cannot miss; the fallback
  // exists so the return type is not nullable at every call site.
  return AREAS.find((a) => a.id === id) ?? AREAS[0];
}

/** The headline sentence for each verdict. Never a grade, never a certification. */
export const VERDICT_COPY: Record<Verdict, { heading: string; body: string }> = {
  starting: {
    heading: 'A starting checklist',
    body: 'You have not told this page that anything is missing — only that it is not written down yet, or you left it alone. So this is not a finding about your system and it is certainly not a grade. It is the order these decisions are worth making, with a first step for each.',
  },
  evidence: {
    heading: 'Every question is marked addressed',
    body: 'That is a claim about the design. It is not evidence of it, and this page cannot check it — nothing you typed left your browser. Below is the artefact that would show each one. This tool does not certify that a system is ready for production, and no set of answers here would make it do so.',
  },
  steps: {
    heading: 'What to do next, in order',
    body: 'Each step below is the one written beside that question in the rubric. Reported gaps get a design change; not-yet-defined answers get a decision, because until somebody makes it there is nothing to change.',
  },
};

// ── the exported summary ────────────────────────────────────────────────────
//
// One owner for this format. The download button and the copy button both call
// `summaryText`, and the print stylesheet prints the same result panel — so
// there is no second place where a summary is assembled and no way for two of
// them to disagree. This repo has been bitten by a format with two owners
// before (see CLAUDE.md on `pairing.ts`), and the failure was silent.

function wrap(text: string, width: number, indent: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > width) {
      lines.push(indent + line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) lines.push(indent + line);
  return lines.join('\n');
}

export interface SummaryContext {
  /** e.g. `location.origin`, so guide links in a saved file still resolve. */
  origin: string;
  now: Date;
}

/**
 * A plain-text summary of the result. No login, no server, no email — the file
 * is built from the same functions the page renders from and handed straight
 * to the visitor.
 */
export function summaryText(answers: Answers, ctx: SummaryContext): string {
  const counts = tally(answers);
  const v = verdict(answers);
  const steps = nextSteps(answers);
  const evidence = evidenceRequests(answers);
  const open = stillOpen(answers);
  const W = 76;
  const out: string[] = [];

  const rule = '='.repeat(W);
  const thin = '-'.repeat(W);

  out.push('AGENT DESIGN CHECK — SUMMARY');
  out.push(rule);
  out.push('');
  out.push(
    wrap(
      'Worked out in your browser on ' +
        ctx.now.toISOString().slice(0, 10) +
        '. Nothing in this summary was sent anywhere, and no record of it exists outside this file.',
      W,
      '',
    ),
  );
  out.push('');
  out.push(
    wrap(
      'This is a checklist, not an assessment. It carries no score and it does not certify that any system is ready for production.',
      W,
      '',
    ),
  );
  out.push('');
  out.push('WHERE THIS STANDS');
  out.push(thin);
  const row = (label: string, n: number) =>
    '  ' + (label + ' ').padEnd(28, '.') + ' ' + String(n);
  out.push(row(STANDINGS.yes.short, counts.yes));
  out.push(row(STANDINGS.no.short, counts.no));
  out.push(row(STANDINGS['not-yet-defined'].short, counts['not-yet-defined']));
  out.push(row(STANDINGS.unanswered.short, counts.unanswered));
  out.push('  (Counts of ' + QUESTIONS.length + ' questions. Not a grade.)');
  out.push('');
  out.push(VERDICT_COPY[v].heading.toUpperCase());
  out.push(thin);
  out.push(wrap(VERDICT_COPY[v].body, W, ''));
  out.push('');

  if (steps.length) {
    out.push('NEXT STEPS, IN ORDER');
    out.push(thin);
    steps.forEach((step, i) => {
      const q = step.question;
      out.push(
        String(i + 1).padStart(2, ' ') +
          '. [' +
          STANDINGS[step.standing].short +
          '] ' +
          areaOf(q.area).title +
          ' — ' +
          q.label,
      );
      out.push(wrap(q.ask, W - 6, '      '));
      out.push('');
      out.push(wrap('Why it matters: ' + q.why, W - 6, '      '));
      out.push('');
      out.push(wrap('Next step: ' + step.action, W - 6, '      '));
      out.push('      Guide: ' + q.guide.title);
      out.push('             ' + ctx.origin + q.guide.href);
      out.push('');
    });
  }

  if (evidence.length) {
    out.push('MARKED ADDRESSED — WHAT TO BRING');
    out.push(thin);
    evidence.forEach((q) => {
      out.push('  · ' + areaOf(q.area).title + ' — ' + q.label);
      out.push(wrap(q.onYes, W - 6, '      '));
      out.push('');
    });
  }

  // In the starting case every question is already printed above as a step, so
  // a second list of the same questions under a different heading is noise.
  // The page suppresses it for the same reason; both do it from this rule.
  if (open.length && v !== 'starting') {
    out.push('NOT ANSWERED HERE — STILL OPEN');
    out.push(thin);
    out.push(
      wrap(
        'These were left alone. Nothing has been assumed about them; they are listed because they are still worth answering.',
        W,
        '',
      ),
    );
    out.push('');
    open.forEach((q) => {
      out.push('  · ' + areaOf(q.area).title + ' — ' + q.label);
      out.push(wrap(q.ask, W - 6, '      '));
      out.push(wrap('Why it matters: ' + q.why, W - 6, '      '));
      out.push('');
    });
  }

  out.push('THE RULES THIS USED');
  out.push(thin);
  RULES.forEach((r, i) => {
    out.push(String(i + 1) + '. ' + wrap(r, W - 3, '').replace(/\n/g, '\n   '));
    out.push('');
  });

  out.push(thin);
  out.push(wrap('The Living Craft — ' + ctx.origin + '/tools/agent-design-check/', W, ''));

  return out.join('\n') + '\n';
}
