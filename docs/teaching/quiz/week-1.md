---
week: 1
---

<!-- TEACHING-ONLY. This file is never rendered and never deployed. It carries the
     answer key and the distractor rationale; src/lib/craft/quiz.ts strips both
     before anything reaches a learner. See ../README.md for the format. -->

## item-01
capability: A1
difficulty: recall
answer: b
rationale: An agentic loop requires observing the environment after a tool call, which makes a while loop the standard primitive until a final decision is reached.

An agent's reasoning loop is typically implemented as:

A) A recursive function that calls itself until a stop token is generated.
B) A `while` loop that calls the LLM, parses the tool calls, executes them, and continues until the LLM returns a final response instead of a tool call.
C) A directed acyclic graph (DAG) where each node represents a specific LLM prompt.
D) A single prompt that asks the LLM to output all tool calls and the final answer in one go.
