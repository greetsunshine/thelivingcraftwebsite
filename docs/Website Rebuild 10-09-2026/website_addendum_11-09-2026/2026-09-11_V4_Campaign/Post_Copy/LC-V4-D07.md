# LC-V4-D07 — Architecture

## Caption

The architecture diagram looks complete. Can it explain a failed run?

In this illustrative example, I follow a planner, a checker and the part of the system that decides whether to retry. The boundaries become easier to discuss when we put an actual behaviour beside the boxes.

That connection between a working system and its design is central to The Living Craft.

Explore the open cohort: learning.thelivingcraft.ai

## Spoken script

Imagine reviewing an agent architecture with a planner, some tools and a checker. The arrows form a neat loop.

Now suppose the checker rejects the result. What happens next?

If the answer is “the agent tries again,” I would ask what changes on that next attempt. Is there new information? Another valid option? Or will the system repeat the same failing step?

In this illustrative design, I would give the checker a structured result: which condition failed, what evidence it used and whether the workflow can recover.

Then I would make the retry decision explicit. The orchestrator needs a stopping rule and a path for cases it cannot resolve. A model should not have to invent those responsibilities while it is running.

Finally, I would ask for a trace that lets someone reconstruct the decision without exposing unnecessary personal data.

Now the diagram can explain a behaviour. We can build the loop, test a failure and revise the design when the evidence calls for it.

At The Living Craft, that is the connection I want members to practise: a working agentic system, the reasoning behind it and feedback that helps improve the next decision.

If you already work with system design, explore the open cohort and bring a question you would like to work through.
