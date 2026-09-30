---
week: 5
title: "The second loop"
module: M3
summary: "One loop is no longer enough, and what the system remembers between sessions."
status: draft
topics: []
assignment: "TBD"
---

[PLACEHOLDER: session outline for Sunil to write. Everything below is
scaffolding, so that the page renders and the shape is agreed. None of it is
teaching material yet. While `status: draft`, learners see a short "still being
written" note instead of this body, so drafting in the open is safe.]

[THE BUSINESS CASE HAS MOVED TO WEEK 6 — 29 September 2026. It was assigned here
on 28 September, on the argument that M3 already owns cost under load. That was
right about the subject and wrong about the room's attention. This week was
already carrying multi-agent orchestration, the CAP trade-off, capacity under load
and the irreversible decisions, and the business case was the fifth thing in five
hours.

Week 6 is a review with no new material of its own, and "would you fund this"
is the right frame for reviewing somebody's architecture. See bridge 6 in
docs/teaching/threads.md. Do not bring it back here without moving something out.]

[THIS WEEK IS MULTI-AGENT AND MEMORY — decided 29 September 2026, bridge 6.

**Agent memory had no owner anywhere in the six weeks.** Thread 5 has always said
"memory outlives a process" and every week read that as idempotency. What the
system remembers about a person between sessions, how that memory is scoped, when
it expires, and what happens when somebody corrects it, was taught nowhere. The
practice publishes an Agent Memory Audit Kit at /resources/agent-memory-audit-kit:
a record schema, twelve audit questions, seven runnable failure tests with a naive
store that fails all seven, and a four-outcome decision table. It is this material
already written down, and no session referenced it.

**The two halves are one argument, not two topics.** Decomposition and memory are
the same question asked twice: the moment there are two loops, what each one knows
about the other stops being rhetorical. Write it that way or week 5 repeats week
3's four-things problem with less room.

The kit's own opening case is the one to use: an expense agent remembers a project
code somebody typed once, for one trip, and reuses it on the next trip. The team
ships "learn from user corrections", and three weeks later the agent puts her own
team's dinner on a client's bill, because a correction is a memory too.

**What this costs, and say it out loud rather than hiding it.** CAP and capacity
under load compress to a beat each. M3's public copy names both, so neither may be
dropped, and neither is a block any more.]

[RETRIEVAL QUALITY LANDS HERE AS A BEAT — 29 September 2026, bridge 6. Week 3 uses
retrieval as the device that makes evaluation necessary and then leaves chunking,
re-ranking, hybrid search and freshness explicitly unfixed. Until today it named
no week, which is the exact thing the teaching standard says makes a participant
assume a topic is missing rather than scheduled.

It sits beside memory because the join is real: what gets retrieved and what gets
remembered are both answers to "what is the system shown, and on whose say-so".

**A beat, not a block.** This week cannot teach retrieval properly either. Name
the three levers, say which one to reach for first, and point at the resource. An
honest handoff beats a silent deferral.]

[THREAD. This is where the harness lands. Week 1 introduces it as four files:
the loop, the tool layer, the per-turn context assembly, and the trace. Drill 1
there ends with an explicit promise. It says week 5 asks what happens to the
harness when one loop is no longer enough. That promise is now made in a file
learners read, so this week has to keep it.

Here is the argument for placing it this week rather than another. Harness shape
is the least reversible decision in the course. A cache, a model or a retry
policy takes an afternoon to change. A decomposition your team has built on for
six months does not. Caching, routing and idempotency then read as consequences
of the shape you chose, rather than as a list of five scale topics.

One of the two open questions is answered. **What leaves this week to make room**
is the business case, which went to week 6 on 29 September, and CAP and capacity,
which are beats rather than blocks now. What is still open is whether the
reference agent has a shape that can be split up by then. It will not, unless the
week 4 roadmap heads that way on purpose, and week 3 did not move it that way:
`src/w3_brain.py` is still one loop.]

## Before the session

[PLACEHOLDER: pre-work. What to read, what to bring, what to have running. Keep
it to something a working engineer can do in under an hour. The commitment is
~5 hrs/week including the live session.]

## 1 · The Concept

*~15 minutes.*

[PLACEHOLDER: the idea of the week, shown working on the smallest example that
is still real. Success comes first. The room sees it behave, and names what it is
looking at, before anything breaks.]

## 2 · The Problem

*~30 minutes.*

[PLACEHOLDER: the same system, broken. Work the room for fixes, and take the
answers in the order rooms actually give them. That way the real constraint is
worked out rather than lectured. The positioning spine is "AI builds, the human
judges and directs", and this is where the judgment gets practised.]

## 3 · The Drill

*~45 minutes, hands-on.*

[PLACEHOLDER: two or three exercises against the reference agent. Each should be
a real defect, not a synthetic task. Say explicitly what NOT to fix, so the next
week keeps its opening.]

## 4 · The Teardown

*~35 minutes. In pairs, then the room.*

[PLACEHOLDER: the same problem at enterprise scale, where block 3's fix is no
longer enough. Constructed teaching case, labelled as constructed. No real
client, product, or metric. Four or five questions, taken in pairs. Closes on the
leader's framing: the week's trade-off, stated the way it survives a board
meeting.]

## 5 · The Horizon

*~10 minutes.*

[PLACEHOLDER: the closing beat, present in every session. Write the durable
framing here, which is the career and skills question this week's material
raises. Do NOT write the specifics here. Those are pulled from
`/craft/admin/radar` (Trends · Hiring — India · Durable skills) in the week you
teach it, so nothing dated is committed to this file. See week 1 for the
pattern.]

## After

[PLACEHOLDER: what to apply to your own system before next week, and what you
will be asked to show.]

## Reading

[PLACEHOLDER: sources. Field Notes at /latest already tracks what is changing in
the field. Link the relevant findings here rather than restating them.]
