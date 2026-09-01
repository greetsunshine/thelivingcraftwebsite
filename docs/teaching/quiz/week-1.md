# Week 1 — question bank

*Teaching material, not learner-facing. Nothing under `docs/` is rendered.*

Questions carry a topic tag, a difficulty, and — for anything multiple-choice —
why each distractor is wrong. The distractor rationale is the useful part: these
are the answers a senior engineer actually gives, so knowing why each is
attractive is what lets you take it seriously in the room before taking it apart.

**Difficulty:** `recall` reads the material · `apply` uses it on a new case ·
`judge` has no single right answer and is scored on the defence.

Covers **context and state** (§2, third idea) and **durability** (§2, fourth
idea). Other topics get added under their own headings.

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

## Durability

All of these run off the case study in
[`../notes/case-one-slow-night.md`](../notes/case-one-slow-night.md). Give the
room "The system" and "The night" — about 300 words — and nothing else. The
comparison table is the answer key; it must not be on screen.

### Q9 · Which boundary saves the most money
`apply` · the anchor question

> One boundary, added before that night. Which one prevents the most loss?

- **A.** A 5-second timeout on the payments call
- **B.** An idempotency key on the refund ✅
- **C.** A named outcome and non-zero exit on step-budget exhaustion
- **D.** A nightly spend cap of ₹300,000

**Why the others are attractive and wrong.** **A** is the popular answer and it
is the *first* boundary chronologically — but a fast failure still gets
redelivered, and the second run still pays twice. It shortens the night without
capping the loss. **C** is the best *detection* answer and buys the fastest human
response, which is why it is worth crediting, but by 22:15 money has already
moved. **D** caps the loss at roughly ₹300,000 rather than eliminating it. **B**
is the only one under which the second payment never happens at all.

**The point to land:** the expensive failure was not the slow provider. It was one
missing property in code we own.

---

### Q10 · Which failure was the dangerous one
`judge`

> Six hours passed with no error and no alert. Name what was actually broken about
> that, in one sentence, and point at the line in our own repo that has the same
> property.

**Looking for:** the system was not failing loudly and being ignored — it was
failing quietly and **reporting success**. In the repo: step-budget exhaustion
prints `▸ done reached step budget` and exits zero, so a run that gave up is
counted green. This is drill 1.

**Push back if** they answer "there was no monitoring". There was monitoring. It
was reading a signal the system was reporting incorrectly, which is a different
and worse problem.

---

### Q11 · Which of these is not a durability boundary
`recall`

- **A.** A ceiling on the amount a single tool call can move
- **B.** Human confirmation before an irreversible action
- **C.** A more capable model with better instruction-following ✅
- **D.** Defined behaviour when a step fails halfway

**Why C is attractive.** It genuinely reduces the rate of bad decisions, and the
room will have watched it do so in the bake-off. It is not a boundary because it
changes the *odds* of an action, not the *set* of actions that are possible. Every
other option is enforced outside the probabilistic component; C is enforced inside
it. This is the session's spine restated as a test.

---

### Q12 · Who owns each boundary
`apply`

> For each of the five boundaries in the case, say which component owns it: the
> loop, the tool, the queue, or the deployment.

**Answer.** Timeout — the tool (or the client it wraps). Idempotency key — the
tool, with the key generated by the caller. Named outcome and exit code — the
loop, surfaced through the trace and the process. Spend cap — the tool, or a
service in front of it; **not** the loop, because a restarted loop forgets. Cost
and latency per step — the trace.

**The follow-up that does the work:** which of these still holds if the process
is killed and restarted? Only the ones that live outside the loop's memory. That
is the argument for pushing state out of the agent, and it is week 2.

---

### Q13 · Bringing it home
`judge` · After-block prompt

> You can add exactly two of these five boundaries to your own system this
> quarter. Which two, and what would have to be true for you to change the
> answer?

No model answer. Scored on whether the choice is defended in terms of blast
radius rather than effort, and whether the reversal condition is something they
could actually observe. This is the decision record, in miniature.

---

## Notes on running these

- Q1 first: the "refresh more often" instinct has to die before anything else
  lands. Q3 immediately after, because their own repo proves Q1's answer.
- Q4 is the one worth ten minutes. Everything else is scaffolding for it.
- Q5, Q6 and Q7 each point at a later week — idempotency to week 5, provenance to
  week 4, compression budgets to week 3. Say so; it makes the syllabus feel
  designed rather than sequential.
- Q8 belongs in the After block, not the room.
- Q9 to Q12 are the durability block. Run the case cold: the room builds the
  comparison table, you do not show it. Q9 is the anchor; if you only have time
  for one, use that one.
- Q11 is the session's spine as a test question — a better model changes the odds
  of an action, a boundary changes the set of possible ones. Worth using late,
  after the bake-off has made a better model look like the answer.
- Q13, like Q8, belongs in the After block.
