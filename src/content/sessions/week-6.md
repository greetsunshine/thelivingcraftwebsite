---
week: 6
title: "The review"
module: M4
summary: "Your own system, priced, and read by the room against five questions the course has been building evidence for since week 1."
status: draft
topics: []
# THE FIVE OUTCOMES, from bridge 7 of docs/teaching/threads.md (decided 7
# October 2026). No `movesMost` yet: that flag is Sunil's before-the-fact
# prediction, and nobody has made one for this week. Week 6 has no after-pulse;
# the thirteen-capability re-ask covers it that day.
outcomes:
  - id: tokens
    text: price one run of my agent end to end, and state its cost per acceptable outcome including the loss from wrong answers
  - id: levers
    text: choose between caching, routing, batching and a cost ceiling for my own system, and defend the choice with a number
  - id: tiers
    text: place each action my agent takes in a risk tier, and set how closely the code behind it is reviewed
  - id: review
    text: answer the five review questions about my own system in front of the room
  - id: verdict
    text: give another learner's system a fund, fund-with-one-change or do-not-fund verdict, with the number behind it
# Week 6's row of the matrix in docs/teaching/threads.md.
threads:
  - { id: trace-and-bill, weight: builds }
  - { id: boundaries, weight: second }
  - { id: evidence, weight: second }
  - { id: untrusted-input, weight: second }
  - { id: state, weight: second }
  - { id: retrieval, weight: second }
  - { id: multi-agent, weight: second }
assignment: "TBD"
---

<!--
WRITER'S NOTE. The topics below were approved by Sunil on 7 October 2026
(docs/teaching/reviews/course-review-2026-10-07.md, and bridge 7 of
docs/teaching/threads.md). Build the pages against generation-prompt.md as weeks
2 and 3 were, then shrink this body to the short guide week 3 now has.

Things that must survive the writing:
- The five questions are fixed (bridge 7 §4). Do not reword them per learner.
- Cost per acceptable outcome carries the loss term (bridge 7 §5). The
  denominator is outcomes that met the pass bar.
- Include a case where the answer is "never build it". The Run-Cost Model's own
  reference example is one.
- Do not write a new cost calculator. The Run-Cost Model is the tool.
- Governance stays at who owns each decision (bridge 6 §6). No regulatory
  framework tour.
- The assignment is still "TBD". Nobody has decided what week 6 hands in.
- Teaching figures are invented for the case. Product prices are unchecked.
-->

**Today is the review: read your own system against five fixed questions, and
decide whether you would fund it.** Nothing new is built after the first hour.

## Before the session

- Bring your own system: one diagram, and your decision records from weeks 1
  to 5.
- Bring your retrieval numbers from week 5's homework, if you have them.

## The topics

**1 · Tokenomics.** Where did the money go in the October bill?
- The bill for 40,000 disputes, and the line nobody expected.
- Cost per token, then per step, then per run, then per acceptable outcome. The
  last one includes the loss from wrong answers that passed, which week 3's
  agreement rate lets you estimate.
- Four levers: caching, sending easy steps to a smaller model, batch pricing for
  work that can wait, and a cost ceiling on each run.
- Capacity: provider rate limits, and what the loop does when latency doubles at
  peak.
- Lab, `make w6-tokens`: price one dispute from start to finish, with your
  retrieval numbers from week 5 or the reference ones.
- A case where the honest answer is "never build it".
- At enterprise scale: the Run-Cost Model, LiteLLM, Portkey, Helicone, and
  provider batch pricing, with costs.

**2 · Governance.** Who owns each decision, and how closely is the code behind
it reviewed?
- Three risk tiers: read-only and internal, an outside action that moves no
  money, and an action that moves money or changes state.
- The tier of an action sets the depth of review for the AI-written code that
  performs it.

**3 to 6 · The review.** Four slots, two of you in each.
- Six minutes to show your system.
- The room asks the same five questions of every system:
  1. Where is state kept between tool calls, and who can change it?
  2. What is the most one bad input can cost, in money and in time?
  3. Which tool call can destroy value, and what stands before it?
  4. How would you know a model upgrade broke tool accuracy?
  5. Which text can an outsider write, and what can it make the agent do?
- A verdict: fund it, fund it with one change, or do not fund it. Each verdict
  carries a cost per acceptable outcome.

## How the course closes

- **Recall across all six weeks,** mixed, notes closed.
- **The final quiz.**
- **The thirteen capabilities from week 0,** asked again in the same words.
- **One takeaway each,** said out loud.
