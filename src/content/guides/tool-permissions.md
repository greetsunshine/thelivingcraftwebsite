---
title: Who may call the tool
summary: Permissions live at the tool, not in the prompt. One job per tool, limits it enforces itself, and its own check on the evidence it was handed.
kind: supporting
pillar: agentic-system-design
question: How should an agent's tool permissions be designed?
author: Sunil Mathew
revisedOn: '2026-09-10'
status: ready
related:
  - uncertain-evidence
---

Design an agent's tool permissions at the tool, not in the prompt. Give each tool one job and the narrowest scope that lets it do that job; have it enforce its own limits rather than being told about them; make it re-check the evidence it was handed instead of trusting the arguments it was called with; give it an identity to act under that is not a shared administrative one; and record every call. A sentence in the system prompt saying the assistant must not exceed a limit is guidance. A tool that refuses to exceed the limit is a control. Only one of those two survives an unusual input.

## Who this is for, and when it applies

This applies from the moment a tool has an effect outside the system: it moves money, sends a message, changes a record, opens a ticket, calls someone else's API. Until then, permission design is mostly a matter of what the agent can read, which matters but rarely urgently.

It applies to whoever owns the tool as much as to whoever builds the agent. That is not a throwaway point. Most of the work described here happens on the far side of the tool boundary, which often means a different team, a different repository and a different review — and a permission model that only exists in the agent's codebase is a permission model one integration away from being bypassed.

## A worked example: the refund tool

*This is an illustrative example. It is not an account of a real customer system.*

Take a returns assistant that reads a customer's message, finds the applicable policy, and recommends a refund. Now give it a tool that can issue the refund. The system can move money, and the interesting question moves with it.

The naive version of that tool takes an amount and pays it. Every control then lives in the prompt: instructions about which policies apply, which orders are eligible, what the ceiling is. That design has one property that should stop you — every one of those controls is a piece of text competing for the model's attention with every other piece of text in the context, including the customer's own message, which was written by the person who benefits from the refund.

The version worth building looks different in six ways.

**One tool, one job.** `issue_refund` is a tool. `call_payments_api` is not a tool, it is the payments API with a model in front of it, and it inherits every permission that API has. If you find yourself building a general-purpose tool because it is fewer to maintain, you have moved the entire permission question into the model's argument construction.

**The tool re-checks the evidence.** An argument is a claim made by the caller, not a fact. So the refund tool should not accept an amount on faith. It takes the order and the policy clause that is said to permit the refund, looks both up itself, and computes what that clause permits for that order. If the requested amount and the permitted amount differ, the tool refuses and says so. This single change moves the most important rule in the system from a place where it can be talked past to a place where it cannot.

**Bind what you can to context rather than to arguments.** The customer whose order is being refunded should come from the authenticated session that opened the conversation, not from a parameter the model fills in. Anything the model can name, the model can name incorrectly; anything derived from context, it cannot reach.

**Limits the tool enforces itself.** A ceiling per call, a budget per conversation, a cap per customer per period. Written as configuration on the tool, checked by the tool, and refused by the tool. The agent may know about these limits — it makes for better behaviour if it does — but knowing is not enforcing.

**Approval is a permission, not a failure.** "This tool requires a named person to approve before it executes" is a legitimate answer, and often the right one for the top of the value range. A design where every action is autonomous or nothing is is a design with one setting too few. What matters is that the approval is a property of the tool rather than an instruction the agent can decide it has satisfied.

**Identity and record.** The tool acts under its own identity, not a shared administrative credential, and every call is recorded with its arguments, its result, and which run made it. Without that last part, a question about a specific refund has no answer that is better than a guess.

## What this rests on

The argument is structural rather than a claim about how well-behaved a model is, and I think that is the important thing about it.

A prompt is a message inside the system. It sits in a context window alongside retrieved documents, tool results and the user's own text, and by the time the model is choosing a tool call, all of that is just input. Some of it may have been written by someone with an interest in the outcome. You do not need to believe the model is careless to conclude that a rule expressed only as text in that context is a weaker rule than one expressed as a check in the code path that executes.

The tool boundary, by contrast, is the place the effect happens. A refusal there holds regardless of what the model was persuaded to ask for, what a retrieved document claimed the policy was, or what a customer wrote in their message.

This is the same reasoning that already applies everywhere else in a system: you check authorisation at the resource, not at the caller, because the caller is the part you do not control. An agent is a caller you control even less than usual, because its behaviour is shaped by input at run time. That is an argument for the ordinary discipline, applied more carefully — not for a new one.

## Limitations

Permissions bound the blast radius. They do not make decisions correct. A perfectly scoped refund tool will happily issue a perfectly permitted refund to a customer who should have been refused for a reason the policy does not encode. Narrow authority buys you a smaller worst case, not a better outcome.

Too narrow has a cost of its own. A tool that refuses anything unusual produces a queue of handoffs, and a queue nobody has staffed is a system that has quietly stopped working. The right width is a judgement about consequence and about who is actually available to handle exceptions, and there is no default I would hand you.

There is also a composition problem I cannot give you a clean answer to. Two tools that are each individually safe can combine into something neither of them is — a read tool that exposes a field and a write tool that accepts it, say. Reviewing tools one at a time will not find that. Reviewing them as a set, and asking what the agent could accomplish with all of them in sequence, sometimes will.

Finally, this guide does not cover what happens when a permitted call does not clearly succeed — a timeout, an ambiguous result, a retry that might duplicate the effect. That is a reliability question rather than a permission question, and it deserves separate treatment.

## Where to go next

The quickest useful exercise: list every tool your agent holds, and for each one write the sentence "this tool refuses to ___". If the sentence is empty, the tool has no permissions; it has instructions.

Then decide what should happen when one of those refusals fires, which is the next guide below. This decision is the fourth of the six in [Designing agentic systems](/resources/guides/agentic-system-design); the [Agent Design Check](/tools/agent-design-check) puts the tool-permission and external-action questions to a design as a checklist you can run in the browser.
