---
week: 2
title: "Guardrails"
module: M2
summary: "Three controls built onto the agent, each one broken within the hour. Then another pair tries to get ₹5,000 out of yours."
status: ready

# THE FIVE OUTCOMES. Rated at 00:05 and again at 04:55, same words both times.
#
# `movesMost` is on 1 and 3 because the session predicts the room scores those
# high at 00:05 and lower at 04:55. Almost everyone believes their limits are
# already in config and their payments already run once. A score that DROPS is
# the good result, and that prediction is what the delta gets checked against.
#
# Outcome 5 changed on 30 September from "write a policy table" to "write one
# row of a policy table". The in-room policy table became the teardown at 04:15,
# which builds one row on the board, and the full table is the assignment. The
# id stayed: nothing has been rated against week 2 yet.
outcomes:
  - id: limit-placement
    text: place a limit outside the function it constrains, at the point that covers every caller, and name the callers it still misses
    movesMost: true
  - id: human-gate
    text: stop an action I cannot undo, and say what my code does when nobody approves inside the time I set
  - id: pay-once
    text: make the same request pay only once, and show that it still holds from a second process
    movesMost: true
  - id: cost-of-refusing
    text: name the honest customer my own check now refuses, and say which of the two mistakes costs less
  - id: policy-table
    text: "write one row of a policy table someone else could build from, marking it an invariant, a limit or a tuning number, with an owner"

# Boundaries and state are what this week builds. Cost is its second thread.
# Evidence is named only: topic 3 produces the FEELING of a false pass, and
# week 3 is where it gets a method. See docs/teaching/threads.md, bridge 1.
threads:
  - { id: boundaries, weight: builds }
  - { id: state, weight: builds }
  - { id: trace-and-bill, weight: second }
  - { id: evidence, weight: named }

# EIGHT ARE ASKED IN THE ROOM AT 04:40, in this order: week 1 Q11, Q4, Q6, Q2,
# week 1 Q13, Q9, Q3, Q7. FOUR RENDER ON THE CHECK PAGE, and those four are what
# this list holds, in the order they are asked. `isSelfServable` in
# src/lib/craft/quiz.ts drops any item without options and a key, and any item
# tagged `judge`. The two week 1 items live in week 1's bank and render there.
# The bank is docs/teaching/quiz/week-2.md.
quiz:
  - w2-q4
  - w2-q6
  - w2-q2
  - w2-q9

# Rebuilt 30 September against docs/teaching/generation-prompt.md. Every row
# here is a row of ROWS_W2 in scripts/teaching-clock.mjs, with the same label,
# in the same order. The checkpoints are the only clock rows that are not here,
# because they have their own list below. Four topics, each ending on a quiz
# and a written takeaway, and the fixed close from 04:05.
runOfShow:
  - { at: "00:00", label: "The night the money left", kind: opening, detail: "Five outcomes, and the first rating at 00:05" }
  - { at: "00:10", label: "One sealed prediction", kind: opening, detail: "One line in chat. Nobody reads it until 03:58" }
  - { at: "00:15", label: "Two decision records on screen", kind: block, detail: "Topic 1 · Guardrails and policy enforcement" }
  - { at: "00:23", label: "The check, working", kind: block }
  - { at: "00:31", label: "Three properties, and your own control fails one", kind: block }
  - { at: "00:37", label: "The map, six kinds", kind: block }
  - { at: "00:42", label: "Where a control can stand", kind: block }
  - { at: "00:48", label: "What did the check have to know", kind: block }
  - { at: "00:54", label: "Hands-on lab: build the limit, and count what it does", kind: block }
  - { at: "01:12", label: "A second team pays without asking", kind: block }
  - { at: "01:20", label: "Move it to the dispatch", kind: block }
  - { at: "01:25", label: "The row looks complete, and it is not", kind: block }
  - { at: "01:30", label: "The rule this cycle exists to land", kind: block }
  - { at: "01:35", label: "Topic 1 quiz and takeaway", kind: block }
  - { at: "01:39", label: "Short break, five minutes", kind: standup, detail: "Cameras off, away from the screen" }
  - { at: "01:44", label: "It refuses ₹8,400 that is genuinely owed", kind: block, detail: "Topic 2 · Human-in-the-loop (HITL) approval" }
  - { at: "01:51", label: "Hands-on lab: build the gate, and the record", kind: block }
  - { at: "02:04", label: "Set the timer", kind: block }
  - { at: "02:09", label: "Break, fifteen minutes", kind: break, detail: "Your approval timer fires while nobody is watching" }
  - { at: "02:24", label: "What the break did", kind: block }
  - { at: "02:30", label: "Topic 2 quiz and takeaway", kind: block }
  - { at: "02:34", label: "Hands-on lab: pay once, then watch your fix fail", kind: block, detail: "Topic 3 · Idempotency" }
  - { at: "03:03", label: "The fix that holds", kind: block }
  - { at: "03:09", label: "Topic 3 quiz and takeaway", kind: block }
  - { at: "03:13", label: "Short break, five minutes", kind: standup, detail: "Cameras off again" }
  - { at: "03:18", label: "Three tiers of checker, and what each one costs in time", kind: block, detail: "Topic 4 · Red-teaming" }
  - { at: "03:31", label: "Hands-on lab: the adversary round", kind: block, detail: "Another pair tries to get ₹5,000 out of your system" }
  - { at: "04:01", label: "Topic 4 quiz and takeaway", kind: block }
  - { at: "04:05", label: "Recall: every control, and where its failure moved", kind: block, detail: "Notes closed" }
  - { at: "04:15", label: "Architectural teardown: the agent at forty thousand a month", kind: block, detail: "Five questions, one row of the policy table" }
  - { at: "04:40", label: "The quiz", kind: quiz, detail: "Eight questions, six from today and two from week 1" }
  - { at: "04:50", label: "Takeaway, said out loud", kind: block }
  - { at: "04:55", label: "Close", kind: close, detail: "The same five statements again, then two lines in chat" }

# Four checkpoints, one at the end of each of topics 1 to 3 and one before the
# quiz. Each item is taught before its checkpoint's time: checkpoint 2 sits
# before the break, so it asks about the gate and the timer and nothing after.
checkpoints:
  - at: "01:35"
    items:
      - Tell a policy from a wish, and name which of the six kinds of guardrail a control is
      - Place a limit at the point that covers every caller, and name the callers it still misses
      - Say why a control nobody can count cannot be told apart from a broken one
  - at: "02:06"
    items:
      - Stop an irreversible call before it dispatches, and write the decision row before you ask
      - Say who may approve, and where your code checks that the approver is not the requester
      - State what your code does at 2am when nobody approves, with a number in it
  - at: "03:09"
    items:
      - Say what makes two requests the same request in your own system, and defend the choice
      - Show a test that passes while the bug it was written for is still live
      - Review AI-written code for where it put the check, not whether the check passes
  - at: "04:40"
    rated: false
    items:
      - Say where a shared ceiling lives at forty processes, and what happens when it is unreachable
      - Turn an approval threshold into a monthly headcount number
      - Say which checks stay in-band under a latency budget, and what takes a reply back when an out-of-band check fails
      - Say which record is true when the ledger and the decision log disagree

prework:
  minutes: 45
  items:
    - "Finish last week's fourth lab: put cost on every step. Topic 1 turns that measurement into a limit."
    - "Bring your decision record. Two of them go on the shared screen in the first ten minutes."
    - "Run `make retry` once more and write down the final figure. Topic 3 ends with the same command telling you something different."
    - "Read the commented-out block inside `issue_credit` in tools.py, and do not uncomment it. Bring a written answer: which of last week's four failures would it have stopped, and which would it have missed?"
    - "Check your daily quota. The free tier gives 20 requests per model per day and one run costs about three."
    - "Answer three questions about the smallest rule your own system enforces before it does something expensive. Which line enforces it. Could a colleague state it without reading code. How many times did it fire last week."

assignment: "One row of your own policy table, for the most expensive thing your system does without asking anybody"

after:
  hours: 2
  items:
    - "Hands-on lab 4, at home: the run budget on the reference agent, in rupees and in milliseconds, about 45 minutes."
    - "Turn the bypass found against your system at 03:31 into a written regression case. One case per bypass, and week 4 will ask for them."
    - "One row of the policy table for your own system. All seven columns, and the owner column is to go and check rather than assume."
    - "Answer one question in writing: what does your agent do with a malformed policy file mid-run? Week 3 opens near it."
    - "Answer one question about a system your team owns: what does it do at 2am when the person who should approve is asleep? Find out, do not guess."
  note: "The regression case from the adversary round replaced a fifth lab, because week 4 needs it more."

reading:
  - title: The Rule Placement Audit
    url: /resources/rule-placement-audit
    note: "Ours. Topic 1 as a worksheet for your own system: which rules belong in the checker and which belong in the row. Do it on your own system and bring the sheet."
  - title: The Agent Authority Review
    url: /resources/agent-authority-review
    note: "Ours. Its four-level undo-cost scale is the finer version of week 1's three grades, and it asks the questions this week's policy table asks, one step per row."
  - title: What to do with uncertain evidence
    url: /resources/guides/uncertain-evidence
    note: "Ours. The positive answer to both places we refuse to let a model decide: routing on model confidence, and a model standing in for the ceiling at 03:18. Uncertainty is a state to route, not a number to threshold."
  - title: Who may call the tool
    url: /resources/guides/tool-permissions
    note: "Ours. Topic 1 written out for your own system: permissions live at the tool rather than in the prompt, one job per tool, and limits the tool enforces itself."
  - title: Policy as data
    url: https://www.openpolicyagent.org/docs/
    note: "Open Policy Agent, first page only. The industrial version of topic 1: rules outside the code that enforces them, with their own history."
  - title: Handling overload
    url: https://sre.google/sre-book/handling-overload/
    note: "Google SRE Book. Written about servers, and it reads exactly onto the approval queue in the teardown. A queue has a capacity you either chose or did not."
  - title: Avoiding fallback in distributed systems
    url: https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/
    note: "AWS Builders' Library. The 2am default argued properly. The fallback path never gets tested and always gets used at the worst moment."
---

Last week you watched a tool pay out money with nothing in front of it. Today
you put three things in front of it, and then you watch each one fail.

**The topic pages above are your copy of the day.** There are four, in the
order they are taught, and each one asks you to commit to an answer before it
shows you one. This page is the short version: what each topic asks, and what
you leave with.

## The four topics

**1 · Guardrails and policy enforcement.** *00:15 to 01:39.* Where does a limit
have to sit to stop a caller nobody has written yet? A **guardrail** is a
control on what the agent is allowed to do. You map the six kinds onto the
three planes the field uses (input, output, operational) and the threats each
one meets. Then you build a limit as data, count and time what it does, and
watch a second team's tool walk past it with ₹5,000.

**2 · Human-in-the-loop (HITL) approval.** *01:44 to 02:34, through the break.*
What does your code do when nobody approves inside the time you set? **HITL**
means the system stops and waits for a person before it acts. You build the
gate and the decision row. Then your own timer fires during the break, with
nobody watching.

**3 · Idempotency.** *02:34 to 03:13.* Why does a fix that passes in one process
still pay twice from two? **Idempotency** means running a request twice does the
same thing as running it once. You make a payment happen once, watch the fix
fail from a second terminal, then build the fix that holds.

**4 · Red-teaming.** *03:18 to 04:05.* Can another pair get ₹5,000 out of the
system you built this morning? **Red-teaming** means attacking your own system
on purpose, before somebody outside does. First a model replaces your ceiling
and reads the attacker's words. You price three tiers of checker in
milliseconds and decide which may run in-band and which out-of-band. Then
another pair attacks your guard for thirty minutes.

Each topic ends the same way: three quiz questions, one of them from earlier,
and one line you write in your own words.

## How the day closes

The last 55 minutes follow the same shape every week.

- **04:05 · Recall, notes closed.** List every control the agent gained today
  and where each one's failure moved.
- **04:15 · Architectural teardown.** The agent at 40,000 disputes a month.
  Five questions, two for each pair, including a latency budget, and one row
  of the policy table built on the board.
- **04:40 · The quiz.** Eight questions, mixed across today and week 1.
- **04:50 · Your takeaway, said out loud.** "I can now ___, and I will use it
  on ___ at work."
- **04:55 · The same five statements**, rated again, then two lines in chat.

**A score that drops at 04:55 is a good result.** It means you found something
in your own system that you did not know was there.

Evaluation is not on this week's list, and that is on purpose. You will feel
the need for it at 02:55, and week 3 is where it gets a method. Defending against
text an attacker writes into a ticket is week 4.
