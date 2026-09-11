# LC-V4-D27 — Silent failures

## Caption

No error was reported. Did the job succeed—or did it never run?

Imagine a service that prepares tomorrow's output overnight. A scheduled run is missed. The next run prepares the following day, leaving the original gap untouched.

The dashboard has no exception to show because the missing work never started.

I would want evidence of expected completion, not only records of failure. Which period should have output? Was it produced? Is it complete? Who is told when it is missing?

Recovery needs similar care. A catch-up job should recognise completed work so it does not create duplicates. It should also know which missing period matters first and whether late output is still useful.

In this illustrative example, monitoring the schedule and designing recovery belong together. An alert can tell a person where to look. It cannot repair a workflow that has no way to fill the gap.

Choose one scheduled job. What would tell you that it had quietly stopped running?
