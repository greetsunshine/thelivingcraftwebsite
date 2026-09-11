# LC-V4-D08 — Show a design-review conversation

## Caption

What does feedback on an architecture actually sound like?

Here is an illustrative review. An agent keeps retrying after its checker rejects the output. The diagram contains all the expected components, but the next action is unclear.

I would start by asking what changes between attempts. That question can reveal a missing recovery path more quickly than adding another component to the diagram.

At The Living Craft, the working system gives feedback something concrete to refer to. Members explain their choices, examine the behaviour and revise the design.

Explore the programme: learning.thelivingcraft.ai

## Panel 1 — A review starts with behaviour

Illustrative example: the checker rejects an output and the agent tries again. The same rejection repeats.

## Panel 2 — Ask the next question

What new evidence or valid option does the next attempt have? If nothing changes, why would it succeed?

## Panel 3 — Locate the decision

The checker identifies the failure. The workflow needs an explicit decision about recovery, stopping or human review.

## Panel 4 — Make a change you can test

Bound the attempts. Define the unresolved outcome. Record enough evidence to explain why the workflow stopped.

## Panel 5 — Run the difficult case again

Does it stop correctly? Can a reviewer understand the failure? What uncertainty remains?

## Panel 6 — Practise the reasoning

Build, explain, examine and revise through continuous feedback.

Design agentic systems. Guide your team.
learning.thelivingcraft.ai
