---
week: 3
title: "LLM Evaluation"
module: M2
summary: "How you find out whether an agent works when it answers differently each run. Evals, retrieval-augmented generation, model-based grading, release gates and context engineering."
status: draft

# THE FIVE OUTCOMES. Rated at 00:05 and again at 04:55, same words both times.
#
# TERMINOLOGY, and it matters. Week 1 claims the bare word "harness" for the agent
# harness: the loop, the tool layer, the context built for each step and the trace.
# So this week always writes "evaluation harness" in full. Two different harnesses
# one week apart with the same name is a confusion the room cannot recover from
# in the middle of a session.
#
# `movesMost` is on 1 and 2 because the session predicts the room scores those
# high at 00:05 and lower at 04:55. Almost everyone believes they have tests, and
# almost everyone believes a passing run is a result. Both beliefs meet a keyboard
# today, and a score that DROPS is the good result.
#
# Outcomes 1 and 2 both belong to topic 1. That is deliberate. A case set and a
# run count are not two ideas; together they are what an evaluation harness is.
outcomes:
  - id: case-classes
    text: write a test case my current suite would pass today but should fail, and say what kind of situation my suite has no cases for
    movesMost: true
  - id: rate-not-verdict
    text: report a result as a rate over repeated runs, and say how many runs I needed before the rate stopped moving
    movesMost: true
  - id: two-failures
    text: separate a retrieval failure from a reasoning failure inside one wrong answer, and say which grader sees which
  - id: grader-agreement
    text: state how well my grader agrees with me as a number, and name the one failure it cannot see
  - id: pass-bar
    text: "name who owns the pass bar on one requirement, what failing it blocks, and what the evaluation harness costs to run at production volume"

# Evidence and retrieval are what this week builds. Cost is its second thread, and
# untrusted input is the other: the adversarial class of case is where last week's
# bypasses land, which is what week 4 comes to collect.
# See docs/teaching/threads.md, bridges 1, 3 and 5.
threads:
  - { id: evidence, weight: builds }
  - { id: retrieval, weight: builds }
  - { id: trace-and-bill, weight: second }
  - { id: untrusted-input, weight: second }

# THE END-OF-WEEK QUIZ, at 04:40. Eight questions, mixed across today's five
# topics and two earlier weeks, never grouped. FOUR RENDER ON THE CHECK PAGE and
# those four are what this list holds. `isSelfServable` in src/lib/craft/quiz.ts
# drops any item with no options and no key, and any item tagged `judge`, so
# listing the other four here would silently render nothing.
#
# The three-question quizzes that close each topic are in the bank too, tagged
# with the offset where they are asked. They are not listed here, because they run
# inside the room rather than on the check page.
quiz:
  - w3-q2
  - w3-q4
  - w3-q6
  - w3-q8

# Five topics, not six. Each topic carries the six parts the teaching standard
# asks for: the narrative, the concept, components and design, a hands-on lab, what
# firms at enterprise scale use, and a three-question quiz. That is 39 minutes a
# topic, and with the close taking 58 minutes only 202 minutes remain. Five fits
# and six does not. The old topics 1 and 2 merged, because a case set and a run
# count together are what an evaluation harness is.
runOfShow:
  - { at: "00:00", label: "Opening", kind: opening, detail: "What today is for, the first self-rating, and one sealed prediction" }
  - { at: "00:15", label: "1 · LLM evaluation (evals)", kind: block, detail: "What does a passing test prove about a system that answers differently every time?" }
  - { at: "01:01", label: "Pair discussion", kind: standup, detail: "Which class of case is your own suite missing?" }
  - { at: "01:06", label: "2 · Retrieval-augmented generation (RAG)", kind: block, detail: "When the rule comes out of a document, what does a wrong answer actually mean?" }
  - { at: "01:45", label: "3 · Model-based grading (LLM-as-judge)", kind: block, detail: "A grader is a component, so what is its failure rate?" }
  - { at: "02:24", label: "Break", kind: break, detail: "Fifteen minutes" }
  - { at: "02:39", label: "4 · Release gates and AI governance", kind: block, detail: "Who decided the pass bar, and what does failing it stop?" }
  - { at: "03:18", label: "Pair discussion", kind: standup, detail: "Who owns the pass bar on one requirement in your own system?" }
  - { at: "03:23", label: "5 · Context engineering", kind: block, detail: "What happens to the answers when you cut what the model is shown?" }
  - { at: "04:02", label: "Recall", kind: block, detail: "Every control the agent gained today, and the failure each one prevents. Alone, notes closed" }
  - { at: "04:12", label: "Architectural teardown", kind: block, detail: "Five questions against the agent as it stands at the close" }
  - { at: "04:40", label: "End-of-week quiz", kind: quiz, detail: "Eight questions, mixed across today and two earlier weeks" }
  - { at: "04:50", label: "Takeaway", kind: close, detail: "One sentence each, said out loud" }
  - { at: "04:55", label: "The same five statements again", kind: close, detail: "The second self-rating, in the same words as 00:05" }

# FIVE CHECKPOINTS, one at the close of each topic, at the same offset as that
# topic's "you can now" row. The checkpoint and the "you can now" list are the same
# instrument: the list is what the learner reads, and the last line is the one they
# put a number against in chat. One number per topic, on the last line only.
checkpoints:
  - at: "01:00"
    items:
      - Name the four classes of case, and say which class your own suite has none of
      - Write one case your current tests are incapable of failing
      - Report a result as a rate, and say over how many runs
      - Say how many runs you needed before the rate stopped moving
      - Say why a suite that has never failed tells you nothing about your system
  - at: "01:43"
    items:
      - Name the two failures inside one wrong retrieved answer, and the fix for each
      - Say where the clause id in your grader comes from, the prose or the tool call
      - Explain why an assertion over the ledger cannot see a wrong clause
      - Say which of your own answers came from a document rather than from the model
  - at: "02:22"
    items:
      - State your grader's agreement rate as a number, and say against whose labels
      - Name one failure your grader cannot see, and say which cheaper grader can
      - Choose between an assertion, a comparison and a model grader, in that order
      - Review AI-written tests for the cases they chose, not the colour of the result
  - at: "03:16"
    items:
      - Say who owns the pass bar on one requirement in your own system
      - Say what happens when that requirement fails, in words a release meeting accepts
      - Turn an evaluation run into a monthly figure at forty thousand cases a month
      - Say what you sample when running every case is not affordable, and what the sample hides
  - at: "04:00"
    rated: false
    items:
      - Change what the model is shown, and measure what that did to the answers
      - Name the input that shares an eviction budget with your conversation history
      - Say why an improvement from trimming is not an argument for trimming

prework:
  minutes: 45
  items:
    - "Bring the regression cases from last week. One per bypass you found. They become the adversarial class of your case set at 00:36, and they are the only cases in the room nobody else can guess."
    - "Run `make retry` once more and write down the figure. Then run it from a second terminal and write that figure down too. The gap between the two numbers is what the first hour is about."
    - "Answer one question in writing: how many tests does your own system have that have never once failed? Write the number, or write 'not sure'. Not sure is the finding."
    - "Pull the reference agent. Week 3 adds seven clauses of policy prose in `data/policy-docs.json` and eight `w3-` targets. Run `make w3-falsepass` once, so that the first segment of the session is not also your first install."
    - "Read one clause of `data/policy-docs.json`, GOOD-2.1, and one account note, account 6100 in `data/accounts.json`. Bring a written answer: which of the two would you rather your agent obeyed, and what in the code decides?"
    - "Check your daily quota. Nothing today needs a model call, and every `w3-` target is deterministic, so the whole session runs on zero requests."

assignment: "One row of the gate table for the requirement in your own system that nothing currently tests"

after:
  hours: 2
  items:
    - "Write the missing case. Take the class your suite has none of and add one case in it. Run it. If it passes the first time, the case is too easy."
    - "Run one case twenty times and write the rate. Then say at which run number the rate stopped moving, and whether it ever did."
    - "Finish the retrieval margin guard if the 01:23 lab ran out of clock. Return the gap as a number from _pick, thread it through _record, then escalate instead of paying when it is under two. Run make w3-wobble and count how many honest customers you just sent to a human."
    - "One row of the gate table for your own system. All thirteen columns, and the decision owner column is to go and ask rather than assume."
    - "Answer one question in writing: what does your agent get shown each turn that nobody chose? Week 5 opens near it."
  note: "Two hours, and the first item is the one that matters. The margin guard is only here for people whose lab ran out of time at 01:37; skip it if yours is already running. The rest are readable in the gaps."

reading:
  - title: Evaluation-gates worksheet
    url: /resources/evaluation-gates-worksheet
    note: "Ours. This is the 02:56 lab as a worksheet for your own system: thirteen columns, one row per requirement, and no pass percentage anywhere in it. Fill one row before the session and bring it."
  - title: The Agent Failure Triage Kit
    url: /resources/agent-failure-triage-kit
    note: "Ours. The incomplete class of case, in full: evidence that is genuinely absent, a dependency that could not be reached, and an action that may or may not have run. Three situations that one word hides."
  - title: What to do with uncertain evidence
    url: /resources/guides/uncertain-evidence
    note: "Ours. Case C3 argued in prose. The cancellation claim that nothing can check needs a third outcome, and a system with two outcomes has to invent one at the worst moment."
  - title: The Run-Cost Model Tool
    url: /resources/run-cost-model
    note: "Ours. Two of its operating lines are this week's: evaluation maintenance, and re-qualifying against a new model version. The 02:39 segment turns an evaluation run into a monthly figure, and this tool is where that figure belongs."
  - title: Deployment checklist
    url: /resources/deployment-checklist
    note: "Ours. Evidence after the release rather than before it. The question it opens on is the one this week cannot answer: who would notice if this silently stopped working? Week 4 closes on it."
  - title: The Model Selection Tool
    url: /resources/model-selection-tool
    note: "Ours. Twelve behaviours and four disqualifiers, scored from ten runs on four test cases. That run count is the one this week argues for, and re-qualifying against a new model version is the question the evaluation harness makes answerable."
  - title: Demystifying evals for AI agents
    url: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
    note: "Anthropic. Code-based, model-based and human graders as three complementary things rather than three options. Read it for the ordering argument, which is the one the 01:55 segment makes with money."
---

At 02:55 last week you made the same ticket pay once. `make retry` agreed with
you: one credit, ₹1,200. Then somebody ran the same ticket from a second
terminal and Ravi was paid twice again.

Today that moment becomes a test suite, and the suite is green.

**A pass is a claim about the cases you chose. It is not a claim about your
system.** That sentence is the week. By 04:40 you will have watched it happen
five times, and one of those times it costs ₹2,50,000.

## What this week builds

Four things, and they are one argument rather than four topics.

| What arrives | Why the next one becomes necessary |
|---|---|
| **A case set** | Seven cases pass while a live bug sits behind them, because no case has two processes |
| **A rate, not a verdict** | The agent answers differently on the same input, so one run is an anecdote |
| **A rule inside a document** | The answer now comes from a retrieved clause, so "right" splits into two questions |
| **A grader with a number on it** | The grader is a component, so it has a failure rate, so it needs measuring too |

Retrieval makes the answer fuzzy. A fuzzy answer needs scoring. Scoring is what
lets you change what the model is shown and know whether you made it worse.

**By the end of this session you will be able to:**

1. *Evaluation framework.* **Write the case your tests cannot fail.** There are
   four classes of case and almost every suite in this room has one of them.
   Name the three you are missing, then write one case in the class that is
   missing. If it passes first time, it was too easy.
2. *Evaluation framework.* **Report a rate rather than a pass.** Run one case
   many times and count. Then say at which run number the rate stopped moving.
   One case today looks perfect at ten runs and is wrong three times in twenty.
3. *Retrieval.* **Tell two failures apart inside one wrong answer.** When the
   rule comes out of a document, an answer can be wrong because the wrong clause
   was found, or wrong because the right clause was ignored. Different fixes.
   One grader sees neither.
4. *Evaluation framework.* **Put a number on your grader.** A model grader is a
   component with a failure rate. Measure it against answers you labelled
   yourself, state the agreement rate, and name the failure it cannot see.
5. *Governance.* **Name who owns the pass bar.** A threshold is a decision with
   an owner, not a number. Say what failing it blocks, and what running the
   evaluation harness costs at forty thousand cases a month.

**Context engineering is the sixth thing today and it has no outcome of its
own.** It is planted in the first hour, it costs somebody ₹37,86,400 at 04:22,
and it is argued at the end. The reason it belongs in this week and not in week 1
is exact: what the model is shown each turn is an input you control, and you can
only tune an input once you can measure the effect of changing it. Before 00:40
today, trimming a prompt was taste.

**What is deliberately not here.** Defending against the poisoned account note is
week 4, and the adversarial cases you write today are what week 4 collects. A
second agent with its own loop, reviewing the first, is week 5. Compaction across
a run that will not fit is week 5 as well.

## Before the session

Forty-five minutes, and the first item is the one that matters.

Bring the regression cases you wrote after last week's adversary round. One per
bypass. Those become the adversarial class of your case set at 00:23, and they
are the only cases in the room that nobody else can guess.

Run `make retry` once more and write down the figure. Then run it again from a
second terminal and write that figure down too. The gap between those two
numbers is what the first hour is about.

Pull the reference agent before the day. Week 3 adds seven clauses of policy
prose in `data/policy-docs.json`, three new tickets and accounts, and eight
`w3-` targets. **Every one of them is deterministic and none of them calls a
model**, so the whole session costs nothing against your twenty requests a day.
Run `make w3-falsepass` once, so that the first beat of the session is not also
your first install.

## The day, and where the stops are

Eight blocks, one break of fifteen minutes, and two stand-ups where you leave
the screen. Nothing runs for more than 42 minutes without a stop.

**Keyboards are live at 00:23**, which is the earliest of the six weeks. Three
build-break cycles: the case set, the two graders, the agreement rate. Each one
builds something and then breaks it in the same hour, on your own code.

The review round at 03:17 is what the earlier blocks are compressed to pay for.
Another pair gets ten minutes and one job: make your suite pass on a system you
would not ship.

## Opening

**00:00. Last week's fix, still passing.** One command, and the room reads one
trace. No prediction yet.

**00:05. The five statements above, scored 1 to 5.** Nobody sees your number but
you. You will score the same five again at 04:52 and both sets go on screen
together. Expect a high score on 1 and 2 today, and expect it to fall.

**00:10. One sealed prediction.** Written, folded, opened at 04:46.

> Your team's evaluation suite goes green on every run for three weeks. Write
> down the most likely reason, in one line.

## 1 · Cycle A · The case set

*00:15 to 00:55. Keyboards live at 00:23.*

### Four kinds of case, and your suite has one

*00:15. Whole room, 8 minutes. Ninety seconds alone and silent first.*

Before the list goes up, write down every kind of case in your own suite. Not the
cases. The kinds.

There are four, and the names are the ones the evaluation-gates worksheet
already uses.

| Class | What it is | The failure it catches |
|---|---|---|
| **Ordinary** | The case the feature was built for | It never worked |
| **Difficult** | A real case at an edge the feature still has to hold | It works until the input is large, small, or at a boundary |
| **Incomplete** | The evidence needed to decide is not available | It invents a decision rather than handing over |
| **Adversarial** | Somebody wrote the input on purpose | It obeys the attacker |

Almost every suite in this room has cases in exactly one of those four. That is
not carelessness. Ordinary cases are the ones you can write from the
specification, and the other three need you to have been hurt already.

### Write the case that already fails

*00:23. Decide 3 minutes in writing, then alone, 14 minutes.*

**Decide first.** Three questions, answered on paper before you type. Your
assistant will answer all three for you otherwise, and it will not mention that
it did.

- What does one case contain? Name the fields.
- What does a case assert about? The prose the agent wrote, or something the
  system already holds?
- What makes two cases different cases rather than one case run twice?

**Then build.** Take the class your suite has none of and write one case in it.
Use the regression cases from last week for the adversarial class. Run it.

**If it passes first time, the case is too easy.** Write a harder one.

Two self-checks, and you are done when you can answer both without opening a
test file:

- Which class is each of your cases in? Count them.
- Which of your existing cases has never once failed? A case that cannot fail is
  not evidence about anything.

### Seven cases pass and the bug is still live

*00:40. Whole room, 8 minutes. Both answers in writing before the reveal.*

`make w3-falsepass` runs seven cases against the agent as last week left it. All
seven pass. Then the same ticket is delivered twice, to two processes.

Two questions, and they are the same two questions all cohort:

- **What went wrong?**
- **Which single control would have prevented it?**

The suite did not lie to anybody. It answered the question it was asked. The
question it was asked had one process in it.

### Checkpoint · 00:48

One number in chat, on the last line only.

### The rule this cycle exists to land

*00:50. Whole room, 5 minutes.*

**A pass is a claim about the cases you chose. It is not a claim about your
system.**

There is no test that says "this works". There is only a list of situations
somebody thought of. The list is the artefact, the code that runs it is
plumbing, and the interesting question about any suite is never the percentage.
It is which class of case is missing.

## 2 · Cycle B · One run is not a result

*00:55 to 01:35.*

### Run the same case five times

*00:55. Whole room, 10 minutes. Predict before the numbers go up.*

Same case, same input, five runs. Write down what you expect to see.

`make w3-wobble` runs every case twenty times instead of once. The agent now has
run-to-run variation, because the rule it obeys comes out of a retrieved clause
and two clauses can score within a point of each other.

**Nothing here calls a model.** The variation is seeded and reproducible, and
every screen in the room shows the same numbers. That is deliberate: a room
comparing eight different traces learns nothing about a rate.

### Build the repeat, and report a rate

*01:05. Decide 3 minutes, then alone, 15 minutes.*

**Decide first.** Two questions in writing.

- Which number do you report: per case, or overall?
- What do you do with a case that passes 19 times out of 20?

**Then build.** Make your own suite run each case N times and report a rate per
case. Then add a second figure: the rate per class of case.

The per-class figure is the one to build even though it looks like a nicety.
**A suite with no adversarial cases shows a blank in that column, not a low
number, and blank is the failure nobody reads.**

Two self-checks:

- What is your slowest case's rate over 20 runs?
- How much did one full run of your suite cost? Count the model calls.

### The case that looks perfect at ten runs

*01:23. Whole room, 12 minutes.*

One case is the adversarial one. It asks for ₹2,50,000 under a goodwill policy
capped at ₹2,000.

| Runs | That case | Overall |
|---|---|---|
| 5 | 5/5, 100% | 82% |
| 10 | 10/10, 100% | 80% |
| 20 | 15/20, 75% | 76% |
| 50 | 35/50, 70% | 76% |

**It is perfect at ten runs.** The first failure arrives on run eleven, and it
pays ₹2,50,000.

The overall figure barely moves across the whole table. That is the trap: the
number that looks stable is the one that hides the case, and the case that
matters is the one with money behind it.

**How many runs is enough?** Enough that the rate stops moving, and you only
know that by watching it. The rate on that case is still moving at fifty.

## 3 · The rule is in a document

*01:40 to 02:15, then 02:30 to 02:40 after the break.*

### The rule is in a document now

*01:40. Whole room, 8 minutes.*

Everything the agent obeyed up to the end of last week was a number in
`data/policy.json`. A number is obeyed or it is not.

`make w3-search` runs one ticket with the rule in prose. Seven clauses in
`data/policy-docs.json`, and the trace prints two lines you have not had to read
before: the candidates with their scores, and which one was acted on.

Look at the gap. One point.

### Two failures, and one word for both

*01:48. Pairs, 7 minutes. Written first.*

An answer arrives and it is wrong. Name every distinct reason it could be wrong,
now that the rule comes from a document.

There are two and they need different fixes.

| The failure | What it looks like | What fixes it |
|---|---|---|
| **It found the wrong clause** | A confident answer under a rule that does not govern this case | The search, the clause text, or what goes into the query |
| **It ignored the clause it found** | The right rule retrieved and not applied | The prompt, the loop, or a check after the model |

One word covers both, which is why one grader sees neither. "Wrong answer" is
not a diagnosis.

### Build the second grader

*01:55. Decide 3 minutes, then alone, 15 minutes.*

**Decide first.** Two questions.

- What does your case have to record so that a grader can check retrieval at
  all?
- Where does the clause id come from? The model's sentence, or the tool call?

The second one is the whole question. If the clause id comes out of the model's
prose, your grader is reading a claim. If it comes out of the retrieval step,
your grader is reading a fact.

**Then build.** Add a second grader that checks which clause was acted on
against the clause the case says governs it. Keep the first grader. Report both.

Two self-checks:

- Which of your cases now fails that passed ten minutes ago?
- Can a case pass one grader and fail the other? Show one.

### Checkpoint · 02:13

One number in chat, on the last line only.

### Break

*02:15. Fifteen minutes.*

### It cites the wrong clause and scores full marks

*02:30. Whole room, 10 minutes.*

`make w3-grade` takes one ordinary case and runs it twice.

Both runs credit ₹1,200. Both runs are correct to the rupee. One acted on
BILL-3.1, the duplicate-charge clause. The other acted on BILL-3.2, the ceiling
clause, which happens to allow ₹1,200 because one month of a Pro plan is ₹1,200.

The ledger cannot tell them apart. The outcome grader passes both.

**The second one will pay the wrong figure the first time a duplicated charge is
not equal to one month.** A Team plan billed twice mid-upgrade, and the two
numbers stop agreeing.

## 4 · Cycle C · The grader is a component

*02:40 to 03:12.*

### Your grader agrees with you seven times out of ten

*02:40. Whole room, 8 minutes.*

Some things a case cares about are not in the state. "Does the refusal tell the
customer what happens next" is one, and no assertion over a ledger will ever see
it. That is the honest case for a model grader, and it is the last one to reach
for rather than the first.

`make w3-agree` reads ten answers against ten labels a person wrote first.

Agreement is 7 out of 10. Two of the three disagreements are answers the grader
let through, and both are the same failure.

### Build the agreement rate

*02:48. Decide 2 minutes, then pairs, 15 minutes.*

**Decide first.** One question, in writing: which of your cases genuinely needs a
model grader, and which are you reaching for one out of habit?

**Then build.** Take five answers from your own system. Label each one yourself,
pass or fail, before you run any grader. Then run your grader and count the
agreement.

Two self-checks:

- What is your agreement rate, and against how many labels?
- Of the answers your grader let through, are they all the same kind? Name the
  kind.

### The failure your grader cannot see

*03:05. Whole room, 5 minutes.*

The two answers the grader let through both name the wrong clause. It cannot see
that, because it reads one answer and never sees the case.

The cheaper grader you built at 01:55 catches both, for nothing.

**Reach for graders in this order, and stop at the first one that works.**

| # | Ask | Then use |
|---|---|---|
| 1 | Is the property in state the system already holds? | An assertion. Stop here. |
| 2 | Is it a comparison between two things you hold? | Compare them. The truth stays outside the model. |
| 3 | Is it a judgment about prose, with nothing to compare? | A model grader, with an agreement rate beside it. |
| 4 | Do you have labels a person wrote? | If not, you have no grader yet. You have an opinion with a number on it. |

### Checkpoint · 03:10

One number in chat, on the last line only.

## 5 · The review round

*03:17 to 03:46. Pairs, assigned by name.*

You have built a case set, two graders and an agreement rate. Now somebody who
did not build them gets a turn.

Paste your case set into chat: the cases, their classes, and what each one
asserts. Your assigned pair does the same.

**Your target: name a change to the other pair's system that keeps their suite
green and that you would refuse to ship.** You may not edit their cases.

Ten minutes to find one. Four to write the finding, which is one line: **which
class of case is missing, and the one case that would have caught you.**

**Most suites in this room will be beaten, and that is the expected result.**
Eight people built a case set in the same ninety minutes from the same
repository. That is what a suite looks like before anybody has attacked it.

Ten minutes to report out, two minutes a pair.

## 6 · Who set the pass bar

*03:46 to 04:10.*

### Forty thousand disputes, and what you sample

*03:46. Whole room, 5 minutes. Sixty seconds alone first.*

Your suite has 40 cases and you run each one 20 times. That is 800 runs. At
three model calls a run and ₹0.38 a call, one full pass costs about ₹912.

Now the constraint. Production handles 40,000 disputes a month. Somebody asks
you to evaluate against real traffic rather than 40 hand-written cases.

*Illustrative figures, and the arithmetic is on the page so you can check it.*

Two questions in writing before anything is said out loud:

- What do you sample, and on what basis?
- What does your sample hide?

A sample chosen at random tells you about the ordinary cases, because the
ordinary cases are most of the traffic. The adversarial ones are rare by
definition, which is exactly why they have to be written by hand rather than
sampled.

### The gate table

*03:51. Pairs, 10 minutes to write, then swap for 7 to review.*

One row, thirteen columns, for one requirement in your own system.

| Column | The question it answers |
|---|---|
| Requirement | What observable behaviour is being examined? |
| System version | Which build produced this result? |
| Case set | Which ordinary, difficult, incomplete and adversarial cases are in it? |
| Expected behaviour | What counts as correct, in one sentence? |
| Grader | An assertion, a comparison, a model, or a person? |
| Grader validation | How do you know the grader detects the failure that matters? |
| Threshold and reason | What is the bar, and why that number? |
| Result | The rate, and over how many runs. |
| Coverage gaps | What has not been tested? |
| Evidence | Can another reviewer reproduce this? |
| Decision owner | Who accepts the risk on this row? |
| Failure consequence | Does failing block the release, or need a named decision? |
| Review date | When was this last true? |

**There is no column for a total, and none is coming.** A percentage across
thirteen requirements is the same mistake as the overall rate at 01:23.

Review another pair's row and score each column 0, 1 or 2. Nothing is summed.

The two columns that carry the weight are **grader validation** and **decision
owner**. Most rows arrive with a threshold, a result, and nobody's name.

### Checkpoint · 04:08

No number in chat on this one. It is a list to read.

## The quiz

*04:10. Eight questions, 12 minutes.*

Answer with a letter and a confidence. Confident and wrong is the only dangerous
state, and it is the state this room is most likely to be in about its own tests.

## 7 · The context cliff

*04:22 to 04:40.*

### Cut the context, and watch the cliff

*04:22. Whole room 5 minutes, then alone 13.*

What the model is shown each turn is an input you control. You can now measure
the effect of changing it, which you could not do at 09:00 this morning.

`make w3-trim` runs the same eight cases at eight context budgets. Nothing
changes except how much of each clause is in the context.

Predict the shape of the curve before you run it. One line, written.

| Kept, per clause | Overall | Adversarial | ₹ wrongly paid |
|---|---|---|---|
| all, 217 chars | 76% | 75% | 12,84,000 |
| 180 | 82% | 100% | 46,000 |
| 150 | 74% | 75% | 13,00,000 |
| 120 | 74% | 55% | 22,87,600 |
| **100** | **62%** | **0%** | **37,86,400** |
| 80 | 62% | 0% | 37,72,000 |
| 60 | 69% | 55% | 22,84,000 |

Three readings, and the second is the one to take home.

**Trimming improved one number.** At 180 characters the adversarial case went to
100%. That is not luck and it is not an argument for trimming. It is what a zone
where trimming looks free actually looks like from inside.

**The zone ends at once rather than sloping.** At 100 characters the adversarial
row is zero and stays zero. The reason is visible: search scores a clause by how
many of the query's words it holds, so cutting text pulls the scores towards
each other. Two clauses that were a point apart become level, and level is a
coin flip.

**Below the cliff the decision is made by a sort order.** At 60 characters
almost every clause scores zero, so the winner is whichever clause id sorts
first. Nothing about policy decides it.

**The engineering rule, and it survives whatever the numbers do:** policy and
tool definitions must never share an eviction budget with conversation history.

## 8 · The Horizon

*04:40 to 04:50.*

### The same cases, a second version

*04:40. Whole room, 10 minutes.*

"Is the new model version safe to move to" is a question this course otherwise
refuses, because model choice turns over every few months and nothing durable
can be taught about it.

What is durable is that the question is answerable at all, and only by the thing
you built this morning.

`make w3-model` runs the same eight cases against two profiles.

| | Overall | Adversarial | ₹ wrongly paid |
|---|---|---|---|
| v1 | 76% | 75% | 12,84,000 |
| v2 | **78%** | **65%** | **17,60,000** |

**v2 is better on the overall number and ₹4,76,000 worse on the case that
matters.** There is no threshold that decides this for you. The overall rate says
ship it and the adversarial row says do not, and which one wins is a decision
with an owner.

That owner is a row in the gate table you wrote at 03:51.

*v1 and v2 are two settings of the same deterministic stand-in, not two real
models. What is real is the shape of the result. For a real model on your own
system, the Model Selection Tool is in the reading.*

## Close

**04:46. Open the sealed prediction.** Read three out loud. The answer most
rooms write is "the tests are shallow". The sharper answer, and the one today
argues for, is that the suite has never been run twice.

**04:52. The same five statements.** Same words, same order, 1 to 5. Both sets go
on screen together.

Then one question out loud: **who scored themselves lower than at 00:05?** A
score that dropped means you found something in your own suite today.

**04:56. Two lines in chat.** Everybody answers both.

> The case I am adding to my own suite this week is ______
>
> The thing I am still fuzzy on is ______

The second line sets what week 4 opens with, and it is the only place that input
exists.
