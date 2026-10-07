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

assignment: "An architecture decision record for one evaluation decision in your own system. The gate-table row you wrote at 02:56 is its design section."

after:
  hours: 2
  items:
    - "Write the week's decision record at /craft/adr. Seven sections, and the gate-table row from 02:56 is the design section. One line each is enough; the five takeaways on the close page are the prompts. The design section is all thirteen columns, and the decision owner column is to go and ask rather than assume."
    - "Write the missing case. Take the class your suite has none of and add one case in it. Run it. If it passes the first time, the case is too easy."
    - "Run one case twenty times and write the rate. Then say at which run number the rate stopped moving, and whether it ever did."
    - "Finish the retrieval margin guard if the 01:23 lab ran out of clock. Return the gap as a number from _pick, thread it through _record, then escalate instead of paying when it is under two. Run make w3-wobble and count how many honest customers you just sent to a human."
    - "Answer one question in writing: what does your agent get shown each turn that nobody chose? Week 5 opens near it."
  note: "Two hours, and the decision record is the one that matters — it is the assignment, and it is the artefact a year from now. The margin guard is only here for people whose lab ran out of time at 01:37; skip it if yours is already running. The rest are readable in the gaps."

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

**Today is about evidence: how you find out whether an agent works when it
answers differently each run.** At 02:55 last week you made the same ticket pay
once. Then somebody ran it from a second terminal, and Ravi was paid twice again.
Today that moment becomes a test suite, and the suite passes with the bug still
live.

**A pass is a claim about the cases you chose. It is not a claim about your
system.** That sentence is the week.

You work on the same **dispute agent** as weeks 1 and 2. Week 3 adds seven
clauses of policy text, three new tickets and the `w3-` targets. None of the
targets calls a model, so the day costs nothing against your daily requests.

**Rate yourself in Session mode** (`/craft/live`) at 00:05 and again at 04:55.
The five statements are the outcomes listed on this page.

**The topic pages above are your copy of the day.** There are five, in the
order they are taught, and each one asks you to commit to an answer before it
shows you one. This page is the short version: what each topic asks, and what
you leave with.

## The five topics

**1 · LLM evaluation (evals).** *00:15 to 01:00, then a pair discussion.* What
does a passing test prove about a system that answers differently every time?
An **evaluation harness** runs a fixed set of cases against the agent and
scores each one. You sort cases into four classes: ordinary, difficult,
incomplete and adversarial. You find the class your own suite has none of, and
write the case your tests cannot fail. Then each case runs twenty times, so the
result is a rate rather than a verdict.

**2 · Retrieval-augmented generation (RAG).** *01:06 to 01:43.* When the rule
comes out of a document, what does a wrong answer actually mean? **RAG** means
the agent looks up text and answers from it. A wrong answer is now one of two
failures: the wrong clause was found, or the right clause was ignored. You build
a second grader that checks which clause the answer used. Then you add a guard
that sends a dispute to a person when retrieval cannot tell two clauses apart.

**3 · Model-based grading (LLM-as-judge).** *01:45 to 02:22.* A grader is a
component, so what is its failure rate? A **model-based grader** is a model
asked to score another model's answer. You measure how often it agrees with
answers you labelled yourself. First as a raw rate, then as Cohen's kappa:
agreement after removing what chance alone would give.

**4 · Release gates and AI governance.** *02:39 to 03:16, then a pair
discussion.* Who decided the pass bar, and what does failing it stop? A
**release gate** is a rule that blocks a release when a score falls below a
bar. You price the harness at 40,000 disputes a month, decide what to sample,
and write one row of the gate table with an owner.

**5 · Context engineering.** *03:23 to 04:00.* What happens to the answers
when you cut what the model is shown? **Context engineering** is deciding what
the model sees on each turn. You trim the policy text step by step. Trimming
first improves the score. Then it falls away fast, and at 100 characters a
clause it is zero.

Each topic ends the same way: three quiz questions, one of them from an earlier
week, and one line you write in your own words.

## How the day closes

- **04:02 · Recall, notes closed.** List every control the agent gained today,
  and the failure each one prevents.
- **04:12 · Architectural teardown.** The agent as it stands at the close. Five
  questions, each assigned to one person.
- **04:40 · The quiz.** Eight questions, mixed across today and two earlier
  weeks.
- **04:50 · Your takeaway, said out loud.** "I can now ___, and I will use it
  on ___ at work."
- **04:55 · The same five statements**, rated again.

**A score that drops at 04:55 is a good result.** It means you found something
in your own suite that you did not know was there.

**What is deliberately not here.** Defending against text an attacker writes
into a ticket or a document is week 4. The adversarial cases you write today
are what week 4 collects. A second agent, step-level checks on each handoff,
better retrieval and compaction of a long run are all week 5.
