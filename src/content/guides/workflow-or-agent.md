---
title: When a workflow is enough
summary: An agent is a decision about control flow, not about capability. The test is whether you can write the steps down before the request arrives.
kind: supporting
pillar: agentic-system-design
question: When should an engineering team use an agent instead of a fixed workflow?
author: Sunil Mathew
revisedOn: '2026-09-10'
status: ready
related:
  - tool-permissions
---

Use a fixed workflow when you can write the steps down before the request arrives, and use an agent when the next step genuinely depends on what the system finds. The test is not how hard the task is or how impressive the model is. It is whether the control flow is knowable in advance. If you can draw the flowchart, build the flowchart — and if you get four branches in and the fifth one is "it depends what the message actually says", that is where an agent belongs, and usually only there.

The choice is about control flow, not capability. You can call a model from inside a fixed workflow to classify, extract or draft, and the system is still a workflow, because the order of steps was decided by you rather than at run time.

## Who this is for, and when it applies

This is the question an engineering team usually reaches when a working automation starts accumulating special cases, or when someone has built a convincing prototype and the team has to decide whether it becomes the design.

It applies most sharply when the system takes actions with real effects, because that is where the difference between the two shapes shows up as consequence rather than as taste. It applies less to internal tooling where a wrong turn costs somebody five minutes.

It is worth saying that this is often not a permanent decision. A part of a system can start as an agent while you are still learning the shape of the problem, and be replaced by a fixed path once the branches stop surprising you. That is a good outcome, not a retreat.

## A worked example: the returns assistant, before and after

*This is an illustrative example. It is not an account of a real customer system.*

Imagine returns start as a form. The customer picks a reason from a list, the order is already identified because they clicked through from it, a policy table maps reason and order age to an outcome, and a refund function does the rest.

That is a workflow, it works, and there is no model in it. Nobody would propose changing it.

Then the requests stop arriving as forms. People write in. A message says the box arrived with two of three items and asks about "the rest of it". Another asks about two orders at once. A product category picks up its own exception. A customer explains a situation that is clearly within the spirit of the policy and clearly outside its wording.

Each of those is a new branch. Individually, each is cheap. Collectively they are the design, and the tell is that the branches are becoming both numerous and rare — you are writing more code for cases you will see less often, and every one of them is a place the next change can break.

That is the moment an agent earns its place. Not because the task got harder, but because the decision about what to do next moved into the message.

There is an honest alternative worth ruling out first: when the complaint is "the input is unstructured", the cheapest fix is often to structure the input. A better form beats an agent that exists to read a worse one. Reach for the agent when the shape of the request is genuinely open, not when the intake is merely bad.

## What you are actually trading

An agent moves the decision about what happens next from review time to run time.

At review time, a decision is made once, by people, and holds for every request that follows. You can read it, test it, and count the paths through it. At run time, the same decision is made fresh for every request, by a process that is not repeatable in the way a branch is, and that leaves no trace unless you deliberately record one.

What you buy is coverage of situations nobody enumerated. That is a real thing to buy, and for an open-ended intake it can be the only affordable option.

What you pay is threefold. You lose the ability to enumerate the paths, which is the basis of most of the testing you would otherwise do. You lose predictability across identical requests. And you take on an obligation you did not have before: the system must now record what it did and why, because that record is the only remaining way to answer questions about a specific decision.

That third cost is the one teams under-price. In a workflow, the code *is* the explanation. In an agent, the explanation has to be built.

## Signals in each direction

Lean towards a fixed workflow when the number of steps is stable; when the branch conditions can be expressed as data rather than as judgement; when the same input must produce the same output every time; when volume is high and the margin per transaction is thin; or when somebody will eventually have to explain to an auditor why this particular request went this particular way.

Lean towards an agent when the branch count keeps growing and each branch is individually rare; when the relevant next action depends on the content of unstructured input; when the work needs lookups that depend on the results of earlier lookups, in an order you cannot fix in advance; or when you are still learning what the problem is.

Two signals that look decisive and are not. A model in the design is not a signal — plenty of good workflows call models. And a strong demo is not a signal either, because a demo shows the open path succeeding, which is exactly the evidence the decision does not turn on.

## The answer is usually "both, with a boundary"

Most real systems are a mixture, and the useful skill is putting the seam in the right place.

Draw it so the open part is the part that *decides* and the closed part is the part that *acts*. In the returns example: an agent reads the message, works out which order and which policy clause are in play, and assembles the evidence. A fixed, tested function issues the refund, with its own limits, its own idempotency and its own checks on the evidence it was handed.

That split is not only tidier. It is what makes the tool boundary enforceable at all — the acting half can refuse a call that the deciding half should not have made. [Who may call the tool](/resources/guides/tool-permissions) is about designing that half.

## Limitations

There is no threshold here, and I am not going to invent one. "How many branches is too many" depends on how often each fires, what a wrong turn costs, and how much appetite the team has for maintaining rare paths. Two teams can reach opposite answers about the same system and both be right.

This guide also says nothing about which agent architecture to use once you have decided you need one — single loop, planner, multiple specialised agents. That is a further decision, and it is downstream of this one.

And the decision is reversible in one direction more easily than the other. Replacing an agent with a fixed path once the branches have settled is ordinary work. Retrofitting a record of decisions onto an agent that was built without one is not, which is a reason to build that record from the start.

## Where to go next

If you are weighing this now, the exercise that settles it fastest is to try writing the flowchart. Not to build it — to write it. The point at which you cannot continue is the point where the agent goes, and the parts you finished are the parts that should stay fixed.

- [Designing agentic systems](/resources/guides/agentic-system-design) — the six decisions this is the first of.
- [Who may call the tool](/resources/guides/tool-permissions) — the acting half, once you have drawn the seam.
- [Agent Design Check](/tools/agent-design-check) — a structured pass over the same questions, in the browser.
