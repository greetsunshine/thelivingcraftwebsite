# LC-V4-D09 — Cost control

## Caption

A cheap model call is not the same thing as a cheap completed task.

Imagine an agent that keeps asking for another attempt because the available options do not satisfy the request. Each attempt is inexpensive. Together, they produce a bill and no useful result.

I would look at the loop before shopping for a cheaper model.

What work repeats unnecessarily? Could a shared calculation be done ahead of time? What must stay specific to this request? When does the system stop trying?

Moving work off the request path can help, but it creates another question: how fresh does the prepared result need to be?

And a dashboard alone does not limit a run. A runtime ceiling needs an enforcement point, a defined outcome when reached and a way to investigate what happened.

In this illustrative case, I would track cost per successfully completed task, alongside the failures and review effort that the average could hide.

Choose one expensive workflow. Can you explain its worst permitted run, as well as its average one?
