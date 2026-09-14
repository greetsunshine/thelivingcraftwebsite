# LC-V4-D13 — Incorrect output

## Caption

The checker can be right while the system is stuck.

Consider an illustrative planning agent. A candidate breaks a required constraint, so the checker rejects it. The next attempt selects the same unsuitable candidate. The checker rejects it again.

Nothing unsafe reaches the user. Nothing useful reaches them either.

I would examine the available candidates and the recovery path, as well as the checker. Is there another valid option? Can the workflow ask for missing information? Does it know when to stop?

This is why I am careful with claims that a single extra model will solve incorrect output. A check has a scope. It may detect one class of failure and miss another. It also needs a useful consequence when it finds a problem.

The right mix can include deterministic checks, model-based review and human judgment, depending on what we need to assess.

Take one failure your system catches. Can you explain what happens after it is caught?
