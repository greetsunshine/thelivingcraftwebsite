---
title: What to do with uncertain evidence
summary: Three outcomes rather than two — act, refuse, and hand over with the gap named. Uncertainty is a state to route, not a number to threshold.
kind: supporting
pillar: agentic-system-design
question: What should an agent do when its evidence is uncertain?
author: Sunil Mathew
revisedOn: '2026-09-10'
status: ready
related:
  - tool-permissions
---

When an agent's evidence is uncertain it should stop short of the action and say precisely what it could not establish. That means designing three outcomes rather than the usual two: act, refuse, and hand over with the specific gap named. Uncertainty is a state to be represented and routed, not a number to be compared against a threshold — and the kinds of uncertainty are different enough from each other that collapsing them into one "low confidence" branch throws away the information that would have told somebody what to do.

## Who this is for, and when it applies

This matters wherever the agent's output leads to an action, and it matters most where the action is hard to reverse. It applies at design time, not as an error-handling pass afterwards: which cases count as uncertain is a statement about the task, and it belongs next to the purpose and the evidence list rather than in a catch block.

It applies less if the system only produces text for a person to read, because the person is already the third outcome. The moment you remove that reader, you have to build the behaviour they were providing.

## Four kinds, and they route differently

*The examples below are illustrative. They are not an account of a real customer system.*

Take the returns assistant again — it reads a customer's message, finds the policy, and can issue a refund.

**Evidence that is missing.** The customer describes a situation the published policy simply does not address. Nothing is wrong; the fact needed to authorise the action does not exist. The right outcome is a handover that carries the question: here is the request, here is the order, here is the closest clause, and here is what it does not say. Somebody then makes a decision, and — this is the part usually left out — the decision is worth capturing, because the same gap will arrive again.

**Evidence that conflicts.** Two policy versions disagree, or the order record and the shipping record tell different stories about what arrived. This is a different situation from the first: the system has too much, not too little. It should not silently pick the more recent, the more specific or the more convenient. It should name both sources and stop, because the choice between them is a policy decision and not a retrieval one.

**Evidence that is present but not authoritative.** The assistant has a statement about the policy, but it came from a summary, a cached copy, or the customer's own message asserting what the policy says. That last one is worth dwelling on. Text written by the person who benefits from the action is input, not evidence, and a design that does not distinguish them has a hole in it that no amount of careful prompting closes. The routing rule here is simple: if the fact did not come from the system of record, it has not been established.

**Outcome that is unknown.** The refund tool was called and timed out. This one is different in kind from the other three, because the uncertainty is about the world after the fact rather than before it. The wrong reflex is to retry; the right first move is to find out, which means the action has to be checkable — a reference you can query, or an idempotency key that makes the repeat harmless. Whether that is available is a reliability decision made much earlier, and if it was not made, no amount of care at this moment recovers it.

## The design moves that follow

**Make "not yet determined" a value.** If eligibility is a boolean, every ambiguous case is forced into a yes or a no by whichever way the code happens to fall. A third value costs one line in a type and changes what the rest of the system is able to express.

**Let the tool refuse for missing evidence.** If the refund tool requires a policy clause reference and looks it up itself, "I could not establish which clause applies" stops being a judgement the agent makes about itself and becomes a refusal at the boundary. This is the same argument as in [Who may call the tool](/resources/guides/tool-permissions), arriving from the other direction.

**Hand over the question, not the failure.** "Unable to process this request" wastes the work already done. The useful handover contains what was established, what was not, and what would settle it. That last field is the one that turns an exception queue into something a person can clear quickly.

**Do not treat a model's confidence as evidence about the world.** A number a model attaches to its own answer is a statement about its output. It is not a measurement of whether the order was actually delivered. Thresholding on it feels rigorous and quietly substitutes one question for another. Route on the presence or absence of the specific evidence you named at design time — that is a fact you can check.

**Give the third outcome somewhere to go, with a person and a time bound.** An escalation path that nobody owns is a refusal with extra latency.

**Keep the uncertain cases together.** They are the best list you will get of what your policy does not cover and what your retrieval cannot find, and they arrive for free. Reading them is often more useful than reading the successes.

## What this rests on

The core argument is that a two-outcome design does not remove uncertainty; it resolves it silently in a direction nobody chose. If the only options are *act* and *error*, then every genuinely ambiguous case takes whichever branch the implementation happens to prefer, and the decision about how to treat ambiguity — a real decision, with consequences — has been made by an accident of control flow. Adding a third outcome does not make the system cleverer. It makes an existing decision visible.

The second argument is about asymmetry. Refunding wrongly and refusing wrongly are not equal and opposite errors, and which one you would rather make differs by action, by amount and by customer. A design that states that preference explicitly for each action will behave sensibly under pressure. One that does not will inherit whatever preference the defaults encode.

I am not going to offer a threshold, because I do not have one that would survive contact with your consequences. What I would ask of a design is that the question was asked per action and the answer written down.

## Limitations

Handover has a real cost, and the failure mode of this advice is an agent that escalates everything. That is not a cautious system; it is a queue with additional steps, and it will be quietly switched off. Widening the definition of "uncertain" always looks like the safe direction and is not free.

This design also cannot catch the case that matters most: a system that is confidently wrong. If the assistant retrieves the wrong policy and has no reason to doubt it, nothing here fires, because from the inside the evidence looks established. Uncertainty handling and evaluation are different instruments, and only the second one finds that class of failure.

And the unknown-outcome case is only half a design problem. If the action was not built to be checkable or repeatable without duplicating its effect, then at the moment of the timeout there is no good option left — only a choice between two bad ones. That decision had to be made when the tool was designed.

## Where to go next

A quick pass that tends to be productive: for each action your agent can take, write the three outcomes explicitly, then find the code path that currently implements the third one. If there isn't one, you have found the gap.

- [Who may call the tool](/resources/guides/tool-permissions) — putting the evidence requirement where it is enforced.
- [Designing agentic systems](/resources/guides/agentic-system-design) — the six decisions, of which this is the fifth.
- [Agent Design Check](/tools/agent-design-check) — the uncertainty and recovery questions, as a checklist.
