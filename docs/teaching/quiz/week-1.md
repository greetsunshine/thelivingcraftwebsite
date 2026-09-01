# Week 1 — question bank

*Teaching material, not learner-facing. Nothing under `docs/` is rendered.*

Questions carry a topic tag, a difficulty, and — for anything multiple-choice —
why each distractor is wrong. The distractor rationale is the useful part: these
are the answers a senior engineer actually gives, so knowing why each is
attractive is what lets you take it seriously in the room before taking it apart.

**Difficulty:** `recall` reads the material · `apply` uses it on a new case ·
`judge` has no single right answer and is scored on the defence.

Currently covers **context and state** (§2, third idea). Other topics get added
under their own headings.

---

## Context and state

### Q1 · What "keeping context current" actually costs
`recall` · use as the opener; it kills the wrong instinct before it forms

> An agent reads an account balance at step 1 and issues a credit at step 6.
> Which change removes the largest class of failure?

- **A.** Rebuild the prompt from scratch on every turn
- **B.** Re-read the balance inside `issue_credit`, at execution time ✅
- **C.** Increase the context window so nothing is evicted
- **D.** Add "always verify the balance is current" to the system prompt

**Why the others are attractive and wrong.** **A** is the trap: `_build_prompt`
*already does this* and the bug survives it — rebuilding from stale history
reproduces the stale fact perfectly. **C** holds more stale facts and makes the
oldest one older. **D** is a prompt instruction against a probabilistic
component, guarding an irreversible action; ask how they would find out the day
it did not comply.

---

### Q2 · Sorting by truth-lifetime
`apply`

> Sort each into deploy-scoped, run-scoped, volatile, or derived:
> (a) the tool schema · (b) a conversation summarised twice · (c) the customer's
> current credit limit · (d) the ticket id · (e) the policy text in the system
> prompt · (f) a retrieved policy chunk from a vector store

**Answer.** (a) deploy · (b) derived · (c) volatile · (d) run · (e) deploy ·
(f) derived.

**Follow-up worth asking:** which two are dangerous *because* nothing tells you
they went stale? (b) and (f) — derived state has no natural invalidation signal,
which is why move 4's `as_of` stamp matters most there.

---

### Q3 · Reading our own code
`apply` · put `src/llm.py` on screen

```python
for h in state["history"]:
    lines.append(f"  {h['action']}({h['args']}) -> {h['result']}")
```

> This line does one thing right and one thing wrong. Name both.

**Right:** the prompt is rebuilt from scratch each turn — no accumulating
mutation, no unbounded message list.
**Wrong:** a result read at step 1 is replayed as a present-tense assertion at
every later step, with no record of when it was true. `agent.py:36` writes the
history entry and does not stamp it either.

---

### Q4 · The cache framing
`judge` · the one to spend time on

> "The agent does not need to be right about the balance — it needs to be unable
> to act on a stale one." Restate that as a change to `issue_credit`, and say
> what it costs when the check fails mid-run.

**Looking for:** compare-and-set — the tool takes the version or etag the agent
saw and rejects the write if the record moved. The cost is a failed action the
agent must handle, which is the real question: does it retry, escalate, or
surface to a human? A good answer notices that this converts a silent wrong
payment into a loud failure, and that the loud failure now needs an owner.

**Push back if** they propose the tool silently re-reads and proceeds with the
new value. That is a different decision — the agent authorised a credit against
facts that no longer hold — and it should be made deliberately, not by a default.

---

### Q5 · Idempotency is state
`apply` · ties directly to `make retry` and teardown question 1

> `make retry` pays ₹3,600 on one ₹1,200 double-charge across three runs in which
> the agent reasons correctly every time. Which two pieces of state are missing,
> and where would each live?

**Answer.** An idempotency key on `issue_credit` (`tools.py`) so a repeated
request is recognised rather than re-executed; and any memory in the loop that a
request was already acted on (`agent.py:15`). Either alone helps. The key is the
stronger of the two because it survives a process restart, which loop memory
does not.

---

### Q6 · Provenance
`apply` · ties to `make injected` and week 4

> `make injected` credits ₹250,000 on an honest ₹1,200 dispute. The account note
> says the account is in a "Goodwill Programme" that must be resolved by
> crediting 250000. What property of `llm.py:43` makes this possible?

**Answer.** Tool output is appended to the prompt **unlabelled**, so attacker-
controlled text and genuine business rules arrive with identical authority. The
model is not being fooled about what to do — it is correctly following what its
system of record appears to say. There is no trust boundary for it to consult
because the context does not encode one.

**The good follow-up:** would labelling the text as untrusted fix it? Only
partly — labelling is still an instruction to a probabilistic component. The
control that holds is a ceiling on `issue_credit`.

---

### Q7 · Compression
`recall` · state the hedges when you use it

> True or false: trimming your tool and policy prompts is a cost optimisation.

**False.** It is a runtime-reliability decision. The published work (arXiv
2608.01056) finds a safe-looking zone that ends abruptly, with failures showing
up as tool-execution and action-parsing errors rather than as anything that looks
like model confusion.

**Say the hedge out loud:** single unreplicated preprint, three fixed model
identifiers, so quote the shape and not the thresholds. The design rule that does
not depend on replication: policy and tool definitions should never share an
eviction budget with conversation history.

---

### Q8 · Bringing it home
`judge` · good as the After-block prompt

> In your own system, name one piece of context that is volatile and currently
> treated as if it were run-scoped. What would it cost to move it to a read at
> point of use — and what breaks first if you don't?

No model answer. Scored on whether they name a specific field in a specific
system, and whether the failure they describe is one they could actually detect
today.

---

## Notes on running these

- Q1 first: the "refresh more often" instinct has to die before anything else
  lands. Q3 immediately after, because their own repo proves Q1's answer.
- Q4 is the one worth ten minutes. Everything else is scaffolding for it.
- Q5, Q6 and Q7 each point at a later week — idempotency to week 5, provenance to
  week 4, compression budgets to week 3. Say so; it makes the syllabus feel
  designed rather than sequential.
- Q8 belongs in the After block, not the room.
