---
title: Designing agentic systems
summary: The six decisions that make up an agentic system's design, in the order they are worth making, worked through one example.
kind: pillar
author: Sunil Mathew
revisedOn: '2026-09-10'
status: ready
related:
  - workflow-or-agent
  - tool-permissions
  - uncertain-evidence
---

Design an agentic system by making six decisions, in this order, and writing each one down: whether the work needs an agent at all; what the system is for and where it stops; what evidence it must hold before it acts; what each of its tools is allowed to do; what it does when it is uncertain; and what you can see afterwards. The model is the last decision, not the first. Each of those six has an answer whether or not you choose it — and the answers you did not choose are the ones you read for the first time during an incident.

The rest of this guide works through all six against a single example, and points at three companion guides where a decision deserves more room than a section.

## Who this is for, and when it applies

This is written for engineers, architects and engineering leaders who are about to put a language model behind something that acts, or who have been handed someone else's design and asked whether it is sound.

The six decisions start to matter at one specific moment: when the software stops recommending and starts doing. A system that produces text for a person to read has one control point, and it is the person. A system that can call a tool with an effect outside itself has as many control points as it has tools, and none of them is a person unless you put one there.

So this applies before you build, and it applies when you review. It applies less to a retrieval assistant with no write path, and hardly at all to a demo you will throw away — though a demo that is about to be shown to a sponsor is worth reading against the list, because the question that follows the demo is almost always "can it just do it?".

## A worked example: a returns assistant that can pay

*This is an illustrative example. It is not an account of a real customer system, and no incident is being described.*

Imagine a returns assistant. A customer writes in about a return. The assistant finds the relevant policy, looks up the order, and recommends a refund. The conversation reads well. You can follow the reasoning, and you can see how it would save somebody a lot of repetitive work.

Then someone asks a perfectly reasonable question: can it issue the refund as well?

On a diagram that is one more connection. In the world, the system can now move money.

That single change turns a set of comfortable questions into uncomfortable ones. What gives it permission? Which evidence is enough? If the same customer sends the same request twice, do we pay twice? If the refund tool times out and we cannot tell whether the money moved, what does the assistant do next? And if the policy does not cover the case in front of it, who decides?

None of those is an advanced topic. They are the design. A demo makes the happy path easy to see; the design is the part that decides what happens on every other path.

## The six decisions

### 1. Does this need an agent at all?

An agent is a decision about control flow, not about capability. You are choosing to work out the order of steps at run time instead of writing it down in advance. That is worth doing when the next step genuinely depends on what the system finds, and it is a poor trade when you already know the steps and were only reaching for an agent because there is a model in the design.

For the returns assistant, part of the work is closed: given an identified order, a policy version and an amount, issuing a refund is a fixed sequence. Part of it is open: reading an unstructured message, working out which of several policies applies, noticing that a shipment was partial. The open part is a candidate for an agent. The closed part is a function, and calling it from a model does not make it one.

[When a workflow is enough](/resources/guides/workflow-or-agent) works through the test in detail, including what you give up when you move a decision from review time to run time.

### 2. What is the system for, and where does it stop?

Write the purpose as a task and a boundary, in a sentence somebody else can check. Not "handle returns" — something closer to "reads a customer's return request, identifies the order, applies the published returns policy, and recommends or issues a refund within the window that policy defines."

Then write the non-goals, and treat them as part of the design rather than as a disclaimer. It does not amend an order. It does not cancel a subscription. It does not contact a bank. It does not act on an order it could not identify.

I have found the non-goals more useful in a review than the goals. The goals tell a reviewer what you were trying to build, which they can usually infer. The non-goals tell them what you decided against, which they cannot — and a non-goal that nobody can quite justify is very often the seam where the design is unresolved.

A goal is only worth writing if it is testable. "Safer" is not a goal. "No order is refunded twice" is a goal, because you can go and look.

### 3. What evidence must it hold before it acts?

For each action, name the facts that must be established first, and where each one comes from.

For issuing a refund, that might be: an identified order; the state of that order; the policy clause that permits the refund, and which version of the policy it came from; the amount that clause allows; and the absence of a prior refund against the same order.

The important word is *established*. Evidence is a reference, not a recollection. "The policy says returns are accepted within the window" is a paraphrase sitting in a context window; it cannot be checked afterwards and, more importantly, it cannot be checked by the tool at the moment of the call. A clause identifier and a version can be. The difference sounds pedantic until the policy changes and you need to know which version each decision was made under.

This is also the decision that makes the system explainable. When someone asks why a particular refund happened, an answer built out of references is an answer. An answer built out of the model's summary of its own reasoning is a story about an answer.

### 4. What may each tool do?

Authority belongs to the tool, not to the prompt.

An instruction in the system prompt saying the assistant must not refund more than the policy allows is guidance. A refund tool that refuses amounts above what the cited clause permits is a control. The distinction is structural rather than a claim about how obedient a model is: the prompt is a message inside the system, and the tool is the place where the money actually moves. Whatever is enforced at the tool holds regardless of what the model was persuaded to ask for.

So each tool gets its own narrow authority: the smallest scope that lets it do its one job, limits it enforces itself, an identity it acts under, and a record of every call.

[Who may call the tool](/resources/guides/tool-permissions) covers how to draw those boundaries, including the case where the right permission is "a named person approves this one."

### 5. What does it do when it is uncertain?

Most designs have two outcomes: act, or fail. Systems that behave well under uncertainty have three: act, refuse, and hand over with the specific gap named.

The returns assistant will meet requests the policy does not cover, orders whose state is ambiguous, and two policy versions that disagree. Those are different situations and they deserve different handling, but they share one property: the honest output is not a lower-confidence version of the normal output. It is a different output.

[What to do with uncertain evidence](/resources/guides/uncertain-evidence) works through the kinds of uncertainty and what each one should route to.

### 6. What can you see afterwards?

Keep a record of each run that holds the task, the evidence used with its references, every tool call with its arguments and its result, the points where the system chose between options, and the outcome.

Not the transcript. The transcript is what the system said. You need what it used and what it did.

Two reasons. The first is that you cannot evaluate what you cannot see: a review that only has the final answer can tell you the answer was wrong, but not whether the cause was a missing policy, an over-broad permission or a tool that returned something unexpected — and those three call for three different changes. The second is that a dispute about a refund is settled by evidence, and "the system decided to" is not evidence.

This is the decision that makes the other five improvable. Once the record shows which evidence was used and which tool did what, a failure points at the specific decision to revisit.

## What this rests on

I want to be plain about the basis for the above, because a confident tone is easy to produce and worth very little on its own.

This is design reasoning, not a measured result. There is no benchmark in this guide and no claimed effect size, because I do not have one I would stand behind. Where an argument would need evidence I do not have, I have left the claim out rather than dressed it up.

What the reasoning does rest on is two structural facts that hold regardless of which model you use.

The first is that a control has to sit where the effect happens. The tool call is the moment the world changes. Anything enforced there is enforced; anything expressed only as an instruction earlier in the system is a request, and it competes with everything else in the context — including text that arrived from outside. That is why decisions three and four are separate items rather than one, and why they both sit above the model in the ordering.

The second is that the decisions get cheaper to change as you go down the list. Swapping a model is a swap. Rewriting a purpose boundary that turned out to be wrong means revisiting everything built on top of it. Making the expensive decisions first, and writing them down where a reviewer can argue with them, is the whole reason for the ordering.

There is a third, softer argument. These six are close to what a good reviewer asks for anyway. If the answers exist before the review, the review can be about the trade-offs. If they do not, the review is spent excavating the design, and everybody leaves having discussed less than they wanted to.

## Limitations

This is a design checklist, not a correctness argument. A system that answers all six well is one whose failures are bounded, visible and attributable. That is not the same as a system that is right, and it would be a bad idea to read a completed checklist as a readiness certificate.

It is also incomplete on purpose. Three areas are only touched here: evaluating behaviour rather than answers; the reliability questions around retries, duplicate actions and unknown outcomes; and the full cost of running the thing, which is rarely the price of a response. Each deserves its own treatment and none of them is covered by the six decisions above.

Two more honest gaps. If the content your agent reads can be written by someone who benefits from the action — a customer's own message, a supplier's document, a web page — then the evidence question is harder than section three makes it sound, because some of the input is adversarial by construction. The design idea holds; the sourcing rules have to get stricter, and a permission that assumed cooperative input has to be re-examined.

And none of it survives without a named owner. A boundary that everybody agrees with and nobody owns is renegotiated, quietly, by whoever is under the most delivery pressure that month.

## Where to go next

If you have a design in front of you, the useful next step is to answer the six questions against it in writing and see which ones you cannot answer yet. That is usually more informative than the ones you can.

The [Agent Design Check](/tools/agent-design-check) walks the same ground as a structured checklist you can run in the browser, and tells you which questions are still unanswered rather than scoring you.

The three decisions that carry the most weight have a guide of their own, and they are linked at the foot of this page.

And if you would rather practise this on a system you are building than read about it, that is what the [open cohort](/) is for: you build a working agentic system and then have to explain the choices behind it to people who will argue with them.
