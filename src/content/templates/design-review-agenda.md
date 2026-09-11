---
title: Design review agenda
summary: A sixty-minute agenda for reviewing a system that acts — one decision, one traced action, four questions, and owners against every outcome.
artifact: Ten items with suggested timings, adding up to an hour.
useWhen: You have been asked to run a review of an agentic design, and you would rather spend the hour on the trade-offs than on excavating what was built.
order: 2
fileBase: design-review-agenda
author: Sunil Mathew
revisedOn: '2026-09-11'
status: ready
header:
  - Review
  - Date
  - Chair
  - In the room
  - Circulated beforehand
worked:
  title: Refund authority for the returns assistant
  lead: >-
    The same returns assistant, reviewed at the moment it is about to be given permission to
    issue a refund rather than recommend one. The notes below are what the agenda looks like
    once the hour has been used — an agenda and its minutes are the same document, which is
    most of why it is worth having one.
  note: Illustrative scenario, not a claimed customer incident.
  header:
    - Refund authority for the returns assistant
    - ⟨date⟩
    - ⟨the chair — not the author of the design⟩
    - ⟨design owner, payments on-call, customer operations, one reviewer from outside the team⟩
    - Agent design canvas, plus the draft decision record
sections:
  - heading: The decision in front of us
    minutes: 5
    prompt: >-
      One sentence from whoever called the review, naming the change and what it would let
      the system do that it cannot do today.
    note: >-
      If this cannot be said in a sentence, the review is not ready. Two decisions in one
      hour become one decision badly.
    example: |
      Whether to connect the refund tool, so the assistant issues a refund rather than
      recommending one to an agent who issues it.

      Everything else about the system stays as it is.
  - heading: What we are not reviewing today
    minutes: 2
    prompt: >-
      The neighbouring questions people will reach for, listed and set aside out loud so they
      stop arriving one at a time.
    example: |
      Not the model choice. Not the retrieval quality of the policy lookup. Not the cost of
      running it. All three are real and none of them changes whether this system should be
      able to move money.
  - heading: Walk one action, end to end
    minutes: 15
    prompt: >-
      The design owner walks a single request from arrival to effect, out loud, against the
      design as it is written. Pick the case you are most worried about, not the clean one.
    note: >-
      The room's job here is to listen and note, not to solve. Questions that start "why
      don't you just" are held until the four below.
    example: |
      Walked: a customer who has already been refunded once, writing in again about the same
      order with a slightly different description of it.

      Noted on the way past — the second request is a different conversation, so nothing in
      the model's context knows about the first refund. The only thing standing between that
      and a second payment is the check inside `issue_refund`.
  - heading: Would this design have stopped the case we are worried about?
    minutes: 5
    prompt: >-
      Take the case just walked and trace it through the checks as written, one at a time.
      Any path that still reaches the effect is a finding, and it is the most valuable output
      of the hour.
    example: |
      Yes, and only because the duplicate check lives inside the tool. If it had been a line
      in the prompt, the second request would have paid.

      **Finding.** The check reads the refund ledger. Nobody in the room could say what it
      does when that read fails. ⟨owner and date⟩
  - heading: Where is each control actually enforced?
    minutes: 5
    prompt: >-
      Go through the controls named in the design and mark each one as enforced at the tool,
      enforced elsewhere in the system, or expressed as an instruction to the model.
    note: >-
      An instruction is guidance and competes with everything else in the context, including
      text that arrived from outside. Only what is enforced where the effect happens holds.
    example: |
      - Amount limit — enforced at the tool. It re-reads the cited clause.
      - One refund per order — enforced at the tool, against the ledger.
      - Only refund within the policy window — **instruction only**. Finding: this is the one
        a persuasive message gets past, and the room agreed it moves to the tool.
      - Never refund an unidentified order — enforced, because the tool takes an order id and
        there is no way to call it without one.
  - heading: What happens when the evidence is not there?
    minutes: 5
    prompt: >-
      Name the situations where the system cannot establish what it needs, and what each one
      routes to. Three outcomes are available: act, refuse, hand over with the gap named.
    note: >-
      Include the case where your own guard is wrong. A control that silently refuses a
      legitimate request has swapped one failure for another.
    example: |
      Policy silent on the case → hand over. Order state ambiguous → hand over. Two policy
      versions disagree → refuse and raise.

      **Finding.** A wrongly refused customer currently sees the same message as an
      out-of-policy one. Customer operations cannot tell the two apart, so nobody finds out
      when the guard is wrong. ⟨owner and date⟩
  - heading: What could we see afterwards?
    minutes: 5
    prompt: >-
      Ask what the record of one run would contain, then ask the harder version: could you
      answer "why did this refund happen" three months later, from what is kept?
    example: |
      The run record holds the order, the clause and version, every tool call and its result.
      It does not currently hold the refusals — only the runs that acted.

      **Finding.** The refusals are the population you need to know whether the guard is too
      tight. ⟨owner and date⟩
  - heading: Decisions taken, and who owns each
    minutes: 10
    prompt: >-
      One line per decision, each with a named owner. A decision with no owner is a
      discussion, and it will be renegotiated by whoever is under the most pressure.
    example: |
      1. The policy-window check moves from the prompt to the tool. ⟨owner⟩
      2. Refusals and hand-overs are recorded, with their reason. ⟨owner⟩
      3. Wrongly refused and out-of-policy get different customer messages and different
         routes. ⟨owner, with customer operations⟩
      4. Refund authority is **not** connected until 1 and 2 are done. Chair holds this one.
  - heading: What we did not settle
    minutes: 5
    prompt: >-
      The open questions, written down as questions rather than as actions. This is the
      section that stops a review quietly promoting an unresolved thing into a decision.
    example: |
      What the duplicate check should do when the ledger read fails — refuse, or hand over?
      The room split. It needs the person who owns the ledger, who was not in the room.
  - heading: After the meeting
    minutes: 3
    prompt: >-
      Who writes the decision record, by when, and where it will live. Agree it here, in the
      room, while everybody can hear the answer.
    example: |
      Design owner writes the record against the seven headings within ⟨n⟩ working days;
      it goes in the repository beside the service, not in a document nobody will find.
      Chair re-reads the two blocking items before authority is connected.
related:
  - agentic-system-design
  - tool-permissions
  - uncertain-evidence
---

## How to use it

Circulate the design before the meeting — the [agent design canvas](/resources/templates/agent-design-canvas)
is enough, and a draft [decision record](/resources/templates/decision-record) is better. An
hour spent excavating the design is an hour not spent on the trade-offs, and everybody leaves
having discussed less than they wanted to.

The chair should not be the author of the design. It is not a seniority question; it is that
the author cannot both explain the thing and notice what the explanation skipped.

Two habits make the difference between this agenda and a meeting that had one. The first is
that items three to seven produce **findings**, written down as they arrive, rather than
solutions argued on the spot. The second is that every decision in item eight gets a name
beside it before anybody leaves.

## What this is not

It is not a sign-off, and there is no score at the end of it. A design that survives the
hour is one whose failures are bounded, visible and attributable — which is a different
claim from "ready", and worth making in those words when somebody asks.

It is also not an audit of the team. The questions are about the system, and a review that
drifts into whether the right person built it stops producing findings immediately.
