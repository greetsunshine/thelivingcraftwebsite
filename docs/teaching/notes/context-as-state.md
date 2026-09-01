# Context is state, and state has a lifetime

*Teaching notes for week 1 §2, third idea. Not learner-facing — the session copy
is four sentences on purpose. This is what stands behind them.*

## The reframe

The instinct in the room is that the fix is **freshness**: refresh the context
more often, re-inject the latest facts, keep it up to date. That instinct is
wrong and it is worth spending two minutes killing, because everything after it
depends on the correction.

You cannot keep context current. There is always a gap between when a fact was
read and when the agent acts on it, and the gap is not fixed — it is however
many loop iterations the model decides to take. **The job is not to shrink the
gap. It is to make the gap safe.**

The move is to stop treating context as a buffer you refresh and start treating
it as a **query you re-run, with each piece carrying an explicit lifetime and an
explicit source.**

## The four buckets

Ask the room to sort their own system's context into these. It takes three
minutes and it is usually the moment the idea lands.

| Bucket | Changes when | Examples | Failure if you get it wrong |
|---|---|---|---|
| **Deploy-scoped** | a deploy | system prompt, tool schemas, policy version | Silent behaviour change across every run — teardown question 2 |
| **Run-scoped** | never, within one run | the ticket, who the customer is, the request id | Confusing two runs' state; concurrency bugs |
| **Volatile** | at any moment, including mid-run | balance, approval status, inventory, rate limit | Acting on a stale read — the main event |
| **Derived** | when its source moves, invisibly | summaries, retrieved chunks, embeddings | Confidently wrong, and undated |

The mistake is treating all four as one thing called "the context". Almost every
"the model got confused" incident is a volatile or derived item being handled
with deploy-scoped assumptions.

## The bug in our own repo

`_build_prompt` in `src/llm.py` is worth showing on screen, because it does one
thing right and one thing wrong, and the room can see both.

**Right:** it rebuilds the prompt from scratch every single turn. No accumulating
mutation, no message list that grows until someone notices. Say this out loud —
the common alternative in production code is an append-only message array nobody
prunes deliberately, and this repo does not have that problem.

**Wrong:** what it rebuilds *from*.

```python
for h in state["history"]:
    lines.append(f"  {h['action']}({h['args']}) -> {h['result']}")
```

`lookup_account` returns an account at step 1. That result is replayed verbatim
as a present-tense assertion at steps 2, 3, 4, 5 and 6. If the balance moved, the
agent does not know. If the account was frozen after step 1, the agent does not
know. Nothing in the line says *when* it was true, and `agent.py:36` — where the
history entry is written — does not record it either.

So the agent acts at step 6 on a read from step 1, and the context presents that
read as current fact. That is the whole idea, in four lines of their own repo.

## The four moves, in the order they pay

### 1 · Classify by truth-lifetime, then enforce it

The table above. Enforcement means the buckets are visible in code — different
assembly paths, different budgets, different refresh rules — not a comment saying
which is which.

### 2 · Read volatile state at the point of use, not at the top of the loop

The tool re-reads when it executes. The model's earlier read is a hint that
shaped a decision; it is not the input to the action. Costs one extra call and
removes an entire failure class.

The room will object that this is wasteful. It is: one read per consequential
action. Ask them what the stale one costs.

### 3 · Treat the model's view of state as a cache, because that is what it is

Then the write path uses compare-and-set: `issue_credit` takes the version or
etag the agent saw, and fails if the underlying record moved.

This is the important one, and the framing is what makes it land: **the agent
does not need to be right about the balance — it needs to be unable to act on a
stale one.** You are not making the model more careful. You are making
carelessness impossible to execute.

Same shape as the idempotency key `make retry` is missing. "I already did this"
is state too, and this agent holds none of it — `tools.py` has no key, and
`agent.py:15`'s loop has no memory of previous runs.

### 4 · Stamp every fact with when it was true and where it came from

`as_of` gives a model something to arbitrate conflicts with, and gives a human
reading the trace a visible staleness signal. Cheap to add, and it converts an
invisible failure into a readable one.

Provenance is the other half, and it is the `make injected` hole: `llm.py:43`
appends tool output **unlabelled**, so an attacker-written account note and a
real business rule enter the context with identical authority. There is no trust
boundary for the model to consult because the context does not encode one.

## The anti-pattern: summarising what you can re-derive

Summaries are the worst state you can hold — lossy, undated, and confidently
wrong. If a canonical record exists, re-fetch it rather than compressing a
conversation about it.

Two findings in the field notes support this, and both need their hedges stated:

- **arXiv 2608.01056** compressed the *control* context — tools, arguments,
  policies, recovery protocols, not chat history — and found a safe-looking zone
  that ends abruptly, with failures surfacing as tool-execution and
  action-parsing errors. Cite the **shape** of the result, not the thresholds:
  it is a single unreplicated preprint on three fixed model identifiers.
- **arXiv 2608.06503** found recurrent compaction weakens the influence of recent
  interactions, producing blocked actions, repeated exploration and run-to-run
  instability. The authors label it preliminary and it is AppWorld-only. Use the
  failure-mode observation; do **not** present their proposed fix as established.

The durable engineering point from both: **policy and tool definitions should
never share an eviction budget with conversation history.** That is a design
rule, and it does not depend on either paper surviving replication.

## Where each move lands in the syllabus

- Move 2 and move 3 → week 2, bounded failure and guardrails
- Move 3's idempotency half → week 1 teardown question 1, and week 5
- Move 4's provenance half → week 4, injection and trust boundaries
- Move 1 → here, week 1; it is the frame the rest hang on

## Common wrong answers, and what to do with them

- *"Refresh the context every turn."* Already happens — `_build_prompt` rebuilds
  every turn and the bug survives it. Good moment to show the code.
- *"Tell the model to re-check before acting."* A prompt instruction against a
  probabilistic component, protecting an irreversible action. Ask how they would
  know the day it did not.
- *"Use a bigger context window."* Holding more stale facts. Ask what a longer
  window does to the age of the oldest one.
- *"Cache with a TTL."* Closer, and worth crediting — then ask what TTL is
  correct for a balance that a human can change at any moment.
