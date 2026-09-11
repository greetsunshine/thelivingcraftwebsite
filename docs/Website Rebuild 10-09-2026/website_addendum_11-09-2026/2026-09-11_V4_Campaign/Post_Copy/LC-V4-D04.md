# LC-V4-D04 — Demonstrate a use-case review

## Caption

A useful design review can make an agent smaller.

Consider an illustrative expense assistant. It reads a request, checks policy and prepares a recommendation. A separate service authorises any payment.

I would review each step before deciding where a model belongs. Fixed limits can be enforced in code. Unclear descriptions may need interpretation. Missing evidence needs a defined next step.

The result is a clearer allocation of responsibility, with fewer decisions left to an open-ended prompt.

Try the review questions in this example against one workflow you know.

## Panel 1 — Start with the job

An expense assistant should help resolve a request. “Use an agent” does not explain the job.

## Panel 2 — Separate the fixed rules

A spending limit can be checked in code. A model does not need to reinterpret it on every run.

## Panel 3 — Find the uncertain decision

An unclear description may need interpretation or another question. Name what information would resolve it.

## Panel 4 — Bound the action

Preparing a recommendation and authorising a payment carry different responsibilities. Define each permission.

## Panel 5 — Decide how to check it

Use cases with known outcomes, review ambiguous cases and test what happens when evidence is missing.

## Panel 6 — Review your own workflow

Which steps need interpretation? Which need tools? Which can stay deterministic?

Illustrative teaching example.
