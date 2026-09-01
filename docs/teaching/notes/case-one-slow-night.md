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

## Wiring it to the repo

Every boundary in the table is absent from the reference agent, and the room can
check each one:

- no timeout anywhere in `agent.py`
- `tools.py` — `issue_credit` takes any amount, no ceiling, no key
- `agent.py:15` — the loop has no memory of previous runs
- step-budget exhaustion prints `done` and exits zero
- `trace.py` reports cost once, at the end

`make retry` is this case study, executable, in ten seconds.

## Running it

Twelve minutes: three to read the night, five on the questions, four on the
comparison table built live on the whiteboard from the room's own answers rather
than shown.

Do **not** show the second table first. The room should produce it. The exercise
is worthless if they are reading your answer instead of defending theirs.
