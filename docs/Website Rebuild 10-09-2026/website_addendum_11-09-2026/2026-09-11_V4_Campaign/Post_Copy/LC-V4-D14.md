# LC-V4-D14 — Review a failure and its limitations

## Caption

“The bad output was blocked” is the start of a review, not the end.

In this illustrative case, an agent has no valid candidate left after a constraint check. Repeating the same selection cannot resolve that.

I would review prevention, detection and recovery separately. Each answers a different question. The team should also name the judgments its checks cannot make.

Use this example to inspect one blocked workflow. Does the system know how to finish safely, even when it cannot finish successfully?

## Panel 1 — The checker caught it

Illustrative case: a selected item violates a required condition. The checker rejects it.

## Panel 2 — Now inspect the next step

Does another valid option exist? Repeating a failed choice can leave the workflow stuck.

## Panel 3 — Prevent what you can

Validate candidates before selection where the requirements are known and testable.

## Panel 4 — Match checks to failures

Code can enforce explicit constraints. Model and human reviews may help with judgments those checks cannot express.

## Panel 5 — Name what remains uncertain

A constraint check does not establish that the result is appropriate in every context. State its limits.

## Panel 6 — Design the unresolved outcome

Stop, request information or route for review. Make that outcome understandable to the person waiting.
