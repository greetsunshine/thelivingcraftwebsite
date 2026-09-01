# Case study — one slow night

*Teaching notes for week 1 §2, fourth idea: durability is a set of boundaries you
chose on purpose. Not learner-facing.*

**This is a constructed teaching case.** No client, product, number or incident
here describes a real organisation. The shape is drawn from how systems of this
kind are ordinarily built. Say that out loud before you use it — the same
sentence the teardown carries.

Deliberately small. The teardown is the enterprise case at 40,000 disputes a
month; this one is a single agent on a single night, and it fits on one screen.
Its whole job is to make one sentence concrete:

> **A durable system is not one that does not fail. It is one whose failures are
> bounded, visible, and cheap.**

---

## The system

A refund agent runs unattended overnight. It reads a queue of refund requests,
checks the order, and calls a payments provider to issue the refund. About 200 a
night, typical refund ₹1,200. It has run clean for six weeks.

It is, structurally, our reference agent: a loop, a tool that moves money, and a
trace.

## The night

**21:40** — the payments provider does not fail. It gets slow. Calls that took
300ms start taking 30 seconds. Nothing returns an error.

**21:41** — the agent waits. There is no timeout on the tool call, so a run that
took four seconds now takes two minutes.

**21:42** — the queue gives up waiting for the run to acknowledge and redelivers
the request. A second run starts on the same refund. The provider is slow, not
broken, so **both refunds eventually succeed.**

**22:15** — some runs exhaust the step budget while waiting. The agent prints
`done` and exits zero. The dashboard counts them as successful runs.

**02:00** — the backlog has been redelivered repeatedly. Roughly 900 refunds have
been issued against about 200 requests. Nothing has errored. No alert has fired.

**Tuesday** — finance reconciliation finds the gap. That is the detection
mechanism: a human, two days later, comparing two spreadsheets.

## The same night, with boundaries

Now run the identical fault against a system where five decisions were made on
purpose. **Nothing here prevents the provider from being slow.**

| Boundary | What it changes on this night |
|---|---|
| **Timeout** — 5s on the tool call | The call fails fast at 21:40 instead of hanging. The failure becomes a thing that exists. |
| **Idempotency key** on the refund | The redelivery at 21:42 returns the original result. The second refund never happens. |
| **Named outcome + non-zero exit** on step-budget exhaustion | 22:15 is a page, not a green tick. |
| **Nightly spend cap** — ₹300,000 | Even if everything above failed, the run halts at roughly 250 refunds instead of 900. |
| **Per-step cost and latency in the trace** | The 100x latency jump is visible at 21:45, in the run itself, not in Tuesday's bill. |

**Outcome:** about 40 minutes of delayed refunds, one page at 21:47, zero double
payments, and the on-call engineer knows what happened before they open a laptop.

## What the case is actually teaching

The room's instinct is that the second system is *better engineered*. Push on
that. The second system did not detect the fault sooner because it was cleverer —
it detected it because someone had decided, in advance, what "too slow" meant.

Three things worth naming explicitly:

1. **Every boundary is a decision someone made while nothing was wrong.** None of
   them could be added at 22:00. Durability is bought in advance or not at all.
2. **The expensive failure was not the slow provider. It was the missing
   idempotency key** — a fault in a dependency became a permanent money loss
   because one property was absent in our code.
3. **The dangerous failure was the silent one.** Six hours passed with no error.
   The system was not failing loudly and being ignored; it was failing quietly
   and reporting success. That is `▸ done reached step budget` in our own repo.

## Where the key comes from, and who dedupes

The room will get to "we need idempotency" quickly. These are the two things it
will then get wrong, and both are worth the time.

### The key cannot be minted inside the run

Idempotency is not a property of the payment. It is a property of the **request**,
carried by a key the **caller** generates, and someone has to decide what makes
two requests the same request.

So if the agent mints a key at step 1 — a `uuid4()`, a hash of the run — the
redelivered run mints a *different* one, the provider sees two distinct requests,
and it pays twice regardless. **A key scoped to the run cannot defend against a
redelivered run.** It has to derive from something stable across runs: the refund
request id on the queue message, or an order id plus a period.

Watch for the near-miss too. A hash of `(account_id, amount)` is stable across
runs, and it is *too* stable — a customer legitimately owed two identical ₹1,200
refunds receives one. Deduplication needs an identity for the request, not a
fingerprint of its contents.

### The model is told, the tool decides

The other proposal is: put every previous action in the context and have the model
check before it pays. Take it seriously — it sounds like good engineering, and the
context *should* carry it. But the ordering is backwards, and three things in our
own repo show why.

1. **History is per-run; the money is not.** `run()` builds
   `state = {"ticket": ticket, "history": []}` fresh on every call, while
   `LEDGER` in `tools.py` is module-level and accumulates. `make retry` calls
   `run()` three times, so history is **empty** at the start of each. The model
   cannot check a history that was just reset. That asymmetry is the bug.
2. **Concurrency.** Two consumers take the same message at once. Both start with
   empty history, both check, both see nothing, both pay. Only a check at the
   point of write has a single serialisation point.
3. **It is §2's second wrong answer in better clothes.** *"Fix the prompt — tell
   it to check"* is already listed as an answer rooms give, and the reply is
   unchanged: what happens on the ticket you have not thought of yet, and how
   would you find out it had failed? You could never tell correct reasoning from
   luck.

The version that works is the one **already argued in `tools.py`'s commented
block**: the tool refuses via the key, and the refusal *returns* rather than
raises, so it lands in history, reaches the next prompt, and lets the agent
escalate on its own.

> **Context carries the fact. Code enforces the rule.** Reverse them and a
> correctness guarantee has been moved inside the probabilistic component.

And the corollary, which is where the instinct was right all along: once the tool
refuses, swallowing that refusal is the worst available option. A silent refusal
is a step-budget stop by another name — the agent loops or reports success and
nobody learns anything.

## Wiring it to the repo

Every boundary in the table is absent from the reference agent, and the room can
check each one:

- no timeout anywhere in `agent.py`
- `tools.py` — `issue_credit` takes any amount and moves it. A ceiling and an
  existence check exist in the file **as a commented-out block**, so the boundary
  is written but not enforced; the idempotency key is genuinely absent
- `agent.py:15` — the loop has no memory of previous runs
- step-budget exhaustion prints `done` and exits zero
- `trace.py` reports cost once, at the end

That commented block is worth reading aloud rather than skipping. Its docstring
explains why the checks **return a refusal instead of raising**: `agent.py:34`
calls the tool as a bare `fn(**args)` with no `try/except`, so an exception kills
the run, while a returned refusal lands in history, reaches the next prompt, and
lets the agent escalate on its own. That is a durability decision — bounded,
visible, cheap — argued in four lines, and it is the best worked example of the
week's sentence anywhere in the repo.

`make retry` is this case study, executable, in ten seconds.

## Running it

Twelve minutes: three to read the night, five on the questions, four on the
comparison table built live on the whiteboard from the room's own answers rather
than shown.

Do **not** show the second table first. The room should produce it. The exercise
is worthless if they are reading your answer instead of defending theirs.
