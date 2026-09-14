---
title: Architecture decision record
summary: Seven headings for writing down a design decision in the shape you would put in front of an architecture review — with one filled in, on the decision to let a system move money.
artifact: Seven headings, fixed, in this order.
useWhen: A decision has been made and somebody will have to understand it later — during an incident, at a handover, or when the person who made it has moved on.
order: 3
fileBase: architecture-decision-record
author: Sunil Mathew
revisedOn: '2026-09-11'
status: ready
header:
  - Decision
  - Date
  - Author
  - Status
worked:
  title: Refund authority for the returns assistant
  lead: >-
    Written after the review in the previous template, by the engineer who owns the design.
    It is the same decision seen from the other side: the agenda is what the room asked, and
    this is what the author concluded and is prepared to be argued with about.
  note: Illustrative scenario, not a claimed customer incident.
  header:
    - Refund authority for the returns assistant
    - ⟨date⟩
    - ⟨the engineer who owns the design⟩
    - Proposed
sections:
  - heading: Context
    prompt: >-
      What breaks today, cited against something you actually watched, with the number.
    note: >-
      Not background. The specific thing that failed, and what it cost when it did. If you
      are writing this before anything has failed, say so — an anticipated failure is a
      legitimate context and a different kind of claim.
    example: |
      The assistant recommends refunds; a person issues them. In ⟨n⟩ requests sampled over
      ⟨period⟩, ⟨n⟩ recommendations were correct and were typed into the refund system by
      hand, ⟨n⟩ minutes after the assistant produced them. ⟨replace these with your own
      counts — this example asserts no measurement⟩

      Two things follow. The queue is the delay customers feel. And the person typing is not
      re-deciding: they are transcribing, which means the control everybody believes exists
      is not really there.
  - heading: Goals
    prompt: >-
      Three at most, each one testable. Could somebody write a check that passes or fails on
      this without a person judging it?
    note: >-
      "Safer" is not a goal. "No order is refunded twice" is a goal, because you can go and
      look. If it is not checkable, it is a wish, and it will not survive contact with the
      review.
    example: |
      1. No order is refunded twice, including across separate conversations.
      2. No refund is issued above the amount the cited policy clause allows.
      3. Every refund can be traced afterwards to the clause and version it was made under.

      All three are checks somebody can run against the ledger and the run records, without
      a judgement call.
  - heading: Non-goals
    prompt: >-
      What you are not fixing, and why that is acceptable this quarter.
    note: >-
      The thing a reviewer will ask about that you have decided, on purpose, to leave alone.
      A non-goal nobody can quite justify is very often the seam where the design is
      unresolved.
    example: |
      Not fixing the policy itself, which contradicts itself in two places. It is a content
      problem with a content owner, and the design routes those cases to a person instead.

      Not handling partial shipments automatically. They are ⟨n⟩% of volume and the state is
      genuinely ambiguous; they hand over.

      Not reducing the refund window or changing what customers are entitled to. This
      decision is about who executes the policy, not what it says.
  - heading: The design
    prompt: >-
      The checks, in the order they run, and what each does when it fails — refuse, escalate,
      or ask a person. Say where the state lives.
    note: >-
      Order matters, and so does where the state lives. If it lives in memory, a restart
      undoes it.
    example: |
      `issue_refund` is called with an order id, an amount, and a policy clause with its
      version. It does not trust any of them and re-checks all four, in this order:

      1. **Order exists and is in a refundable state.** Read from the order service. Fails →
         refuse, and hand over with the state named.
      2. **Clause permits a refund for this order.** Re-read at the cited version, not the
         current one. Fails → refuse, and raise as a content problem.
      3. **Amount is within what the clause allows.** Fails → refuse. Never clamps silently
         to the maximum; a clamped refund is a different decision wearing the same name.
      4. **No prior refund against this order.** Read from the refund ledger, which is the
         payment system's own table and not a cache. Fails → refuse and hand over.

      The state that matters — the ledger — lives in the payment system. Nothing here is held
      in the conversation or in process memory, so a restart, a second conversation and a
      retry all see the same facts.

      On timeout, the tool does not retry. It records the attempt and hands over, because a
      timeout is an unknown outcome rather than a failed one.
  - heading: What can go wrong
    prompt: >-
      One row per case: what arrives, what your rule does, what the customer sees.
    note: >-
      Include the case where your own guard is wrong. A rule that silently refuses a
      legitimate request has swapped one failure for another, and that one is invisible
      unless you go looking for it.
    example: |
      | What arrives | What the rule does | What the customer sees |
      |---|---|---|
      | Same order, second conversation | Ledger check refuses | The refund already issued, with its date |
      | Amount above the clause | Refuses, does not clamp | Hand-over to a person, with the clause quoted |
      | Message argues persuasively for an exception | Tool re-checks the clause; the argument is not evidence | Hand-over to a person |
      | Refund tool times out | Records, does not retry, hands over | A wait, and a person who can see the attempt |
      | **Guard is wrong** — legitimate request refused | Refusal is recorded with its reason | A refusal that reads differently from an out-of-policy one, and a route to a person |

      The last row is the one this design is weakest on. The refusals are recorded, but
      nobody currently reads them, so a guard that is too tight would look exactly like a
      guard that is working.
  - heading: Alternatives
    prompt: >-
      One you seriously considered, and the specific reason it lost.
    note: >-
      Anyone can state a decision. The rejected options are where the judgement is visible,
      and a reviewer reads this section first. "Use a better model" counts, and rejecting it
      well is most of the work.
    example: |
      **Keep a person in the loop and make the queue faster.** This was the strongest
      alternative and it very nearly won: it changes no authority at all. It lost on the
      evidence in Context — the person is transcribing rather than deciding, so the control
      is nominal, and making the queue faster makes a nominal control faster.

      **Put the limits in the system prompt and connect the tool as it is.** Rejected. The
      prompt is a message inside the system and competes with everything else in the context,
      including the customer's own words. The tool is where the money moves.

      **A stricter model with better instructions.** Rejected, and worth saying why plainly:
      it improves the average case and changes nothing about the worst one. Every failure in
      the table above is a failure the model is being persuaded into or is simply unaware of.
  - heading: Open questions
    prompt: >-
      What you could not settle. One line is enough.
    note: >-
      The part you would want a second opinion on. Leaving it empty because it looks better
      empty is how an unresolved thing becomes a decision nobody remembers making.
    example: |
      What the duplicate check should do when the ledger read itself fails. Refusing every
      refund during a ledger outage is a poor customer outcome; proceeding is how you pay
      twice. Needs the person who owns the ledger.

      Whether refusals should be reviewed on a schedule or only when somebody complains. The
      second is cheaper and is how a too-tight guard survives for a year.
related:
  - agentic-system-design
  - tool-permissions
  - uncertain-evidence
---

## How to use it

Write it after the decision and before the work, while the alternatives are still fresh
enough to be stated fairly. A record written afterwards tends to describe what was built as
though it were inevitable, and the rejected options quietly become straw.

The seven headings are fixed and are worth keeping fixed. Their value is that a record
written this month can be read against one written last year without anybody first working
out how the two documents are organised. What varies is the decision above them, not the
shape.

Two of the seven do most of the work in a review. **Goals** must be testable, and the fastest
way to find an untestable one is to ask what check would fail if the goal were not met.
**What can go wrong** is one row per case, and the row people leave out is the one where
their own guard is wrong.

Keep it beside the code it describes rather than in a document store nobody opens. A decision
record that cannot be found during an incident is a record of a decision, not a working one.

## What it will not do

It is not a design document and it is not a specification. It is the argument, written down
at the length somebody will actually read — one or two pages, not ten.

It also does not decide anything. If the decision is contested, the record makes the contest
legible; it does not settle it. That is the review's job, and there is
[an agenda for that](/resources/templates/design-review-agenda).
