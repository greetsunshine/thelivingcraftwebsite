---
title: Agent design canvas
summary: One page and six boxes — the six decisions an agentic design is made of, in the order they are worth making, with a worked example beside the blank.
artifact: One page, six boxes, in the order the decisions are worth making.
useWhen: You are about to build something that acts, or somebody has handed you a design and asked whether it is sound.
order: 1
fileBase: agent-design-canvas
author: Sunil Mathew
revisedOn: '2026-09-11'
status: ready
header:
  - System
  - Owner
  - Date
  - Status
worked:
  title: A returns assistant that can issue a refund
  lead: >-
    A returns assistant reads a customer's message, finds the relevant policy, looks up the
    order and recommends a refund. Then someone asks whether it can issue the refund as well.
    On a diagram that is one more connection; in the world, the system can now move money.
    The canvas below is that system, after the refund tool has been connected.
  note: Illustrative scenario, not a claimed customer incident.
  header:
    - Returns assistant
    - ⟨the engineer who owns this design⟩
    - ⟨date⟩
    - In design — not yet reviewed
sections:
  - heading: Does this need an agent at all?
    prompt: >-
      Which part of this work genuinely depends on what the system finds at run time? Write
      that part here, and write the part whose steps you already know underneath it.
    note: >-
      An agent is a decision about control flow, not about capability. The closed part is a
      function, and calling it from a model does not make it one.
    example: |
      **Open.** Reading an unstructured message, working out which of several policies
      applies, noticing that a shipment was partial, deciding whether the request is even
      about a return. The next step depends on what the previous one found.

      **Closed.** Given an identified order, a policy version and an amount, issuing the
      refund is a fixed sequence. That is a function. It is called by the agent; it is not
      part of the agent's reasoning.
  - heading: What it is for, and where it stops
    prompt: >-
      The purpose as a task and a boundary, in one sentence somebody else can check. Then the
      non-goals, as part of the design rather than as a disclaimer.
    note: >-
      A goal is only worth writing if it is testable. "Safer" is not a goal. "No order is
      refunded twice" is a goal, because you can go and look.
    example: |
      **Purpose.** Reads a customer's return request, identifies the order, applies the
      published returns policy, and recommends or issues a refund within the window that
      policy defines.

      **Non-goals.** It does not amend an order. It does not cancel a subscription. It does
      not contact a bank. It does not act on an order it could not identify. It does not
      refund outside the published policy, even where a person plainly deserves it — that
      case goes to a person, by design.
  - heading: What must be true before it acts
    prompt: >-
      For each action, the facts that must be established first and where each one comes
      from. Name the reference, not the recollection.
    note: >-
      "The policy says returns are accepted within the window" is a paraphrase sitting in a
      context window. A clause identifier and a version can be checked afterwards, and can be
      checked by the tool at the moment of the call.
    example: |
      Before `issue_refund` may be called, all five must be established:

      - the order, identified by id, not by description
      - the state of that order, read at the time of the decision
      - the policy clause that permits the refund, **with the version it came from**
      - the amount that clause allows
      - the absence of a prior refund against the same order

      Each is carried as a reference. The clause is `returns-policy@⟨version⟩ §⟨clause⟩`, not
      a summary of it.
  - heading: What each tool may do
    prompt: >-
      One row per tool: its one job, the narrowest scope that does that job, the limit it
      enforces itself, and the identity it acts under.
    note: >-
      Authority belongs to the tool, not to the prompt. An instruction not to exceed a limit
      is guidance; a tool that refuses to exceed it is a control.
    example: |
      | Tool | Job | Enforces itself | Acts as |
      |---|---|---|---|
      | `find_order` | Read one order by id | Read-only; no cross-customer lookup | service identity, read scope |
      | `read_policy` | Return a clause by id and version | Read-only; refuses an unversioned request | service identity, read scope |
      | `issue_refund` | Move money against one order | Re-reads the cited clause and the order state; refuses an amount above what the clause allows; refuses a second refund against the same order | its own identity, write scope, every call recorded |

      The refund tool does not trust the arguments it was called with. It re-checks the
      evidence it was handed, because the caller is a model and the caller's reasoning is not
      a control.
  - heading: What it does when it is uncertain
    prompt: >-
      Three outcomes, not two: act, refuse, and hand over with the specific gap named. Which
      situations route to which, and who receives a hand-over?
    note: >-
      The honest output under uncertainty is not a lower-confidence version of the normal
      output. It is a different output.
    example: |
      - **The policy does not cover this case.** Hand over, naming the case and the clauses
        considered. Never a best guess dressed as a decision.
      - **The order state is ambiguous** — a partial shipment, a return in transit. Hand
        over with the ambiguity stated.
      - **Two policy versions disagree.** Refuse and raise; this is a content problem, not a
        customer problem.
      - **The refund tool times out** and the outcome is unknown. Do not retry. Read the
        state of the action first, then decide. ⟨name the person or queue that receives each
        hand-over — an unrouted hand-over is a refusal with extra steps⟩
  - heading: What you can see afterwards
    prompt: >-
      What the record of one run holds — the task, the evidence with its references, every
      tool call with its arguments and its result, the points where the system chose, and the
      outcome.
    note: >-
      Not the transcript. The transcript is what the system said; you need what it used and
      what it did.
    example: |
      Per run: the customer's request; the order id; every policy clause read, with version;
      every tool call with arguments, result and duration; the point at which it chose to act
      rather than hand over, and on what basis; the outcome, including a refusal or a
      hand-over.

      Kept because a dispute about a refund is settled by evidence, and "the system decided
      to" is not evidence. ⟨set a retention period here, and check it against your own data
      policy⟩
related:
  - agentic-system-design
  - tool-permissions
  - uncertain-evidence
---

## How to use it

Answer the six in order, in writing, and notice which ones you cannot answer yet. That is
usually more informative than the ones you can — an unanswerable box is not a gap in the
canvas, it is a decision nobody has made, and it will be made for you during an incident by
whoever is under the most delivery pressure that month.

The order matters more than it looks. The decisions get cheaper to change as you go down the
list: swapping a model is a swap, while rewriting a purpose boundary means revisiting
everything built on top of it. The model is the last decision, not the first, which is why
there is no box for it here.

Fifteen minutes with the blank is enough for a first pass. Take it into a design review as
the pre-read; it is the document the [design review agenda](/resources/templates/design-review-agenda)
expects to have been circulated beforehand.

## What it will not do

A system that answers all six well is one whose failures are bounded, visible and
attributable. That is not the same as a system that is right, and a completed canvas is not
a readiness certificate. Three areas are deliberately absent: evaluating behaviour rather
than answers, the reliability questions around retries and duplicate actions, and the full
cost of running the thing.

If the content your system reads can be written by somebody who benefits from the action — a
customer's own message, a supplier's document, a web page — then box three is harder than it
sounds here, because some of the input is adversarial by construction. The design holds; the
sourcing rules have to get stricter.
