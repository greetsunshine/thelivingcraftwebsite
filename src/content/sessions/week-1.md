---
week: 1
title: "Foundations of durable architecture"
module: M1
summary: "Draw the map: what an agent actually is as a system, and where it breaks before you have written a line of it."
status: ready
assignment: "One boundary you drew, and the alternative you rejected"

# The five, word for word from the body below. Rated at 00:05 and again at
# 04:52 — "the same five statements, in the same words, so that the two sets of
# numbers mean the same thing". Each completes "Right now, I could…".
outcomes:
  - id: harness
    text: draw the four parts of an agent harness and say which part a given failure lives in
  - id: trace
    text: read an agent's trace and say where the money went, which step spent it, and which line I would put on a dashboard
  - id: failures
    text: name four failures that a better model would not fix, and the boundary that stops each
    movesMost: true
  - id: direct
    text: direct a coding assistant against a decision I made first, and review what it wrote against that decision
    movesMost: true
  - id: record
    text: "write a decision record: the boundary I drew, the alternative I rejected, and what would change my mind"

# Week 1's row from docs/teaching/threads.md.
threads:
  - { id: trace-and-bill, weight: builds }
  - { id: boundaries, weight: named }
  - { id: evidence, weight: named }
  - { id: untrusted-input, weight: named }
  - { id: state, weight: named }
  - { id: multi-agent, weight: named }

# Offsets from startsAt, never wall-clock. The first `block` is 00:15, which is
# what closes the before-rating — not 00:00, when the session opens.
runOfShow:
  - { at: "00:00", kind: opening, label: Opening, detail: the five outcomes, your first confidence rating, four questions from the pre-work }
  - { at: "00:15", kind: block, label: 1 · The Concept, detail: it works, you draw it, then it loses ₹3,600 and what you drew gets its name }
  - { at: "01:10", kind: standup, label: Stand up, detail: five minutes, cameras off }
  - { at: "01:15", kind: block, label: 2 · The Problem, detail: three more failures, then the pattern under all four }
  - { at: "02:05", kind: break, label: Break, detail: fifteen minutes }
  - { at: "02:20", kind: block, label: 3 · The Drill, detail: three drills in the room, hands on keyboards }
  - { at: "03:20", kind: standup, label: Stand up, detail: five minutes again }
  - { at: "03:25", kind: block, label: 4 · The Teardown, detail: the same agent at enterprise scale, then write a boundary down }
  - { at: "04:20", kind: quiz, label: Quiz, detail: eight questions in chat, deliberately mixed up }
  - { at: "04:30", kind: block, label: 5 · The Horizon, detail: which half of your work survives the next capability jump }
  - { at: "04:50", kind: close, label: Close, detail: the assignment, the same rating again, two lines in chat }

checkpoints:
  - at: "01:10"
    items:
      - Draw the ReAct loop and name its three phases
      - Name the four parts of the harness and point at the file each one lives in
      - Say how many calls to the model one ticket takes, and why you do not control that number
      - Explain the difference between something that changes the odds and something that changes what is possible
  - at: "02:05"
    items:
      - Name four ways this agent loses money, with the amount for each
      - Say which part of the harness each of those four failures lives in
      - Explain why a better model does not fix any of them
      - Read a trace and say what it is not telling you
  - at: "03:20"
    items:
      - Make a silent failure announce itself to a machine, not just to a person reading a terminal
      - Grade a tool by its consequence rather than by its name
      - Write a contract for a tool and refuse a call that does not match it
      - Give a coding assistant a decision instead of a task, and review what it returns against that decision
  - at: "04:15"
    rated: false
    items:
      - Take a failure you watched at one-agent scale and say what changes at forty processes
      - Say what an audit trail has to contain beyond a stored prompt and completion
      - Write a boundary down in a form somebody else could actually implement

# Inside the teardown block, not entries in the run of show.
pair:
  draftAt: "03:50"
  reviewAt: "04:05"

prework:
  minutes: 45
  items:
    - Run `make run`. Confirm you get a clean trace without the grey `no LLM_API_KEY found` notice above it. Today is the day the key has to work.
    - Have a second model name ready that your key can reach. Any two will do, as long as one config change swaps between them.
    - Run `make retry`, `make weird-mock` and `make injected`. Do not fix anything. Write down what each one paid out.
    - Note your daily quota before you arrive. One agent run is about three requests, so a free tier is roughly six runs a day.
    - Be ready to say, in one sentence, what in this codebase would have stopped each of the three. A half-formed answer is the right answer to arrive with.

after:
  hours: 2
  items:
    - Drill 4 on the reference agent. Put cost on every step. It is the fiddliest of the four, and the one that does not need the room.
    - The same changes applied to your own system, or to the piece of it you can reach. Drills 1 and 2 transfer almost directly.
    - Finish your decision record from block 4. Week 2 opens by building it.
    - "Answer one question about a system your team owns: where is the limit written down, and who agreed to it? If the answer is a number inside a function, you have found your week 2 work."
  note: Post what you find for the room to read before next session.

reading:
  - title: Timeouts, retries and backoff with jitter
    url: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
    note: AWS Builders' Library. Old, unglamorous, and directly under teardown question 1.
  - title: Idempotent requests
    url: https://stripe.com/docs/api/idempotent_requests
    note: Stripe API docs. Running it twice has the same effect as running it once — the shape of the answer to "did the customer get paid twice?"
  - title: Compressing system-side control context has a sharp, non-linear reliability cliff
    url: /latest#control-context-compression-cliff
    note: Trimming your tool and policy prompts is a runtime-reliability decision. There is a safe-looking zone, and it ends abruptly.
  - title: MCP went stateless
    url: /latest#mcp-2026-07-28-stateless-spec
    note: A tool interface changing under you. The argument for owning the boundary rather than inheriting it.
---

You arrived with a working agent and, if you poked it, a small mystery: an angry
customer whose account does not exist, and an agent that did *something* about
it. We start there. By the end of the session you will be able to draw your own
system on a whiteboard, name every place it can fail, and defend which of those
failures you are choosing to tolerate.

Anyone can show you the agent loop. This session is about what the loop *is* —
so that in week 6, when your own architecture is on the table, you are arguing
from a model rather than from a framework's documentation.

## Before the session

*~45 minutes.*

- [ ] Re-run the weird ticket from week 0 and **save the full trace** — plan,
      tool calls, result. Paste it somewhere you can screen-share.
- [ ] Write three sentences: what you *expected* it to do, what it *did*, and
      what a customer would have experienced. Do not fix anything.
- [ ] Bring one real system you are accountable for at work. Not a diagram —
      just be ready to describe what it does and what breaks at 3am.

If you skipped the optional step in week 0, do it now. The session opens on
those traces, and reading your own is worth more than watching me read mine.

## The Production Teardown

*~20 minutes.*

A dispute-resolution agent that had run cleanly for weeks starts issuing credits
it should not. Nothing was deployed. No prompt changed. The model was not
updated.

We work backwards from the symptom to the cause, and the cause is not where
anyone looks first. The point of opening this way is to establish the habit the
whole cohort runs on: **the interesting failures are never in the model.**

[PLACEHOLDER: Sunil — swap in the teardown you want to open with. The shape that
works here is a failure whose root cause is a boundary, not a bad completion.
If you would rather use one of your own from the enterprise engagement,
anonymise it and we will cut the reference-agent version.]

## The Mental Model

*~30 minutes.*

Four things, and everything in the next five weeks hangs off them.

**1 · An agent is a control loop over an unreliable oracle.** Plan, act,
observe, repeat, until some stopping condition. The model is one component
inside it — the only one that is probabilistic, and the only one you cannot
unit-test into submission. Draw the loop, mark the model, and notice how much of
the diagram is ordinary software you already know how to make reliable.

**2 · Tools are your real API surface.** Every tool you expose is a capability
you have handed to something you cannot fully predict. `issue_credit(₹1,200)` is
not a function call; it is a spend authorisation. We will grade the reference
agent's tools by blast radius, and the exercise sorts them faster than any
argument about prompts.

**3 · Context is state, and state has a lifetime.** What the agent knows is
assembled fresh on every turn from things with different truth-lifetimes: a
system prompt written months ago, a policy fetched a second ago, a conversation
that has been summarised twice. Most "the model got confused" incidents are a
state-management bug wearing a costume.

**4 · Durability is a set of boundaries you chose on purpose.** Timeouts, spend
caps, tool scopes, human confirmation on irreversible actions, and what happens
when a step fails halfway. A durable system is not one that does not fail — it
is one whose failures are bounded, visible, and cheap.

> The line we will keep coming back to: **AI builds, the human judges and
> directs.** Every decision in this session is one a person has to own, and
> "the model decided" is not an answer you can give a board.

## The Build

*~40 minutes, hands-on.*

We instrument the reference agent so it can be reasoned about at all.

- Add a structured trace to every loop iteration: step, tool, arguments,
  outcome, tokens, elapsed
- Put a hard iteration cap on the loop and make hitting it a **visible, named
  failure** rather than a silent stop
- Classify each existing tool as read, write, or irreversible — then make the
  irreversible one require an explicit confirmation
- Re-run your weird ticket and read what the trace now tells you

You leave with an agent that answers "what did it just do?" without a debugger.
Nothing here is clever. It is the floor, and most production agents do not have
it.

[PLACEHOLDER: Sunil — confirm this matches the reference repo's week-1 branch.
If the trace helper already ships in the starter, swap the first bullet for
extending it with cost per step, which sets up week 2.]

## Peer Design Review

*~25 minutes, in pairs.*

Swap systems — the real one you brought, not the reference agent.

Your partner's job is not to admire it. It is to find the boundary you have not
drawn, and to ask the question you have been avoiding:

- Where can this system take an action nobody can undo?
- What does it do when a tool times out mid-plan?
- Who finds out that it failed, and how long does that take?
- What is the worst thing it could do while behaving exactly as designed?

Bring the sharpest of these back to the room.

## The Leader's Lens

*~15 minutes.*

The trade-off this week is **autonomy against reversibility**, and it is a
business decision dressed as an engineering one. More autonomy is more value and
more blast radius; the lever you actually control is how reversible each action
is.

How to frame that upward: not "the agent might hallucinate", which invites a
demand for a guarantee nobody can give, but "here is what it can do without a
human, here is what it cannot, and here is what it costs us if it is wrong."
That sentence survives a board meeting. The first one does not.

## After

*~2–3 hours before next week.*

- Apply the trace and the iteration cap to **your own** system, or to the piece
  of it you can reach
- Write a short **decision record**: one boundary you drew, the alternative you
  rejected, and what would have to be true for you to change your mind
- Post it for the room to read before next session

The decision record is the artefact of this cohort, not the code. It is also the
thing you will still be able to show someone in a year.

## Reading

None of it is required, and none of it is long.

- [Compressing system-side control context has a sharp, non-linear reliability
  cliff](/latest#control-context-compression-cliff) — trimming your tool and
  policy prompts is a runtime-reliability decision, with a safe-looking zone
  that ends abruptly. Directly relevant to mental model #3.
- [MCP went stateless](/latest#mcp-2026-07-28-stateless-spec) — worth skimming
  as an example of a tool interface changing under you, which is the argument
  for owning the boundary rather than inheriting it.
- [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/),
  AWS Builders' Library — old, unglamorous, and most of what makes an agent
  loop survive contact with a flaky tool.

[Field notes](/latest) is refreshed weekly; if something lands there mid-cohort
that changes the picture, we will talk about it in the room rather than pretend
the syllabus is fixed.
