---
week: 4
title: "Attack your own system"
module: M2
summary: "Before somebody else does. What an attacker writes into a field you read, and what a tool boundary you did not write does with your credentials."
status: draft
topics: []
assignment: "TBD"
---

[PLACEHOLDER: session outline for Sunil to write. Everything below is
scaffolding, so that the page renders and the shape is agreed. None of it is
teaching material yet. While `status: draft`, learners see a short "still being
written" note instead of this body, so drafting in the open is safe.]

[ONE BEAT ON PRODUCTION MONITORING, AT THE CLOSE — added 29 September 2026,
bridge 6 in docs/teaching/threads.md.

**The gap it closes.** Week 3 builds the evidence you gather before a release.
Nothing in the six weeks covers what you watch afterwards, how drift shows up, or
what a regression in the wild looks like. The practice's own deployment checklist
at /resources/deployment-checklist opens on the question the course could not
answer: **who would notice if this silently stopped working?**

**Why this week and not week 3.** This week ends on attacks the room found in its
own system. "How would you know this had happened in production" is the next
sentence rather than a new subject, and it is sharper after an attack than after a
test suite.

**Ten minutes, at the close, and it is not a monitoring tutorial.** Three
questions against their own system: which signal would have moved, who reads it,
and what they do at 3am when it moves. The honest answer for most of the room is
that no signal would have moved, and that answer is the beat.

It gives week 4 a `◐` on trace and bill in the matrix, which was blank.]

[THE REGRESSION CASES ARE COLLECTED HERE — this is bridge 1's obligation and it is
unchanged. Every injection the room finds becomes a case in the evaluation harness
they built in week 3, before this week ends. A security fix with no case behind it
survives exactly one deploy, and that sentence is only available because week 3
comes first.]

[MCP IS A TOPIC IN THIS WEEK — decided 29 September 2026, bridge 7 of the sixth
bridge in docs/teaching/threads.md. About forty minutes.

**The framing is the whole decision, so get it right before writing a line.** The
topic is **the boundary you did not write**. It is NOT "MCP security". A room that
leaves believing MCP is dangerous has been sold a vendor deck in reverse, and the
anti-hype rule bites as hard on fear as on hype.

**Why it is in this week.** An MCP server is the cleanest real instance of the
shape this week teaches: code you did not write, running with your credentials,
putting text into your context. That is indirect injection with a supply chain
attached. This week already owns untrusted input, so the topic is an extension of
the frame rather than a second subject.

**What it costs.** Prompt injection gets roughly four blocks instead of five. That
trade was made deliberately and week 4 is still the lightest of weeks 4 to 6.

**One beat inside it is about adoption, not risk**, and it is the beat that keeps
the topic honest: when is inheriting somebody else's tool surface the right call,
and what do you need from them before it is. Without that beat the answer the room
takes home is "write everything yourself", which is wrong and expensive.

**The sentence the field notes hand you**, and it is a governance sentence rather
than a protocol one: *statelessness moves MCP authorization to the application
layer*. It moved to somebody in this room. Ask who.

**Three things the room already half-knows, from the pre-work quiz below.** MCP
adds hops. Silence at the client says nothing about them. `idempotentHint`
declares and does not enforce, and it defaults to false. Do not re-teach these.
Open on them as things they have already met.

**Protocol mechanics are NOT taught here.** Transports, resources, prompts and the
spec's shape are week 0 pre-work and week 1's reading. docs/teaching/threads.md
excludes protocols from the seven threads because they turn over every few months,
and the July 2026 spec change is the proof. Zero live minutes on mechanics.

**Refresh the evidence before writing this.** The three MCP field notes date from
the 2026-07-28 spec and latest.json was last refreshed on 15 August 2026. A
protocol that changed once in July can change again. Run `npm run gather` on the
MCP topic before committing a single claim about the current spec.]

## Before the session

[PLACEHOLDER: pre-work. What to read, what to bring, what to have running. Keep
it to something a working engineer can do in under an hour. The commitment is
~5 hrs/week including the live session.]

[ONE PRE-WORK ITEM IS DECIDED — 29 September 2026. **The Agent Failure Triage Quiz
at /resources/agent-failure-triage-quiz.** Released, twelve questions on one
incident, and it already carries three of the MCP topic's takeaways: MCP adds
hops, silence at the client says nothing about them, and `idempotentHint` declares
rather than enforces and defaults to false.

It is a published resource doing part of a topic for free, and pointing a session
at it is the same fix the 28 September curriculum review applied elsewhere. It
also opens on a timeout with an uncertain outcome, which is the right frame of
mind to arrive in for a week about things you cannot be sure happened.

**The other item that is already decided** is bridge 1's: bring the regression
cases. Every injection found this week becomes a case in the evaluation harness
built in week 3, before the week ends.]

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
