---
title: "What Engineering Managers Need to Know About Agentic AI (That Nobody Tells You)"
description: "The technical concepts matter less than you think. The org dynamics matter more. A field guide from inside real implementations."
date: 2026-03-20
tag: "Leadership"
tagColor: "pink"
readTime: "8 min"
featured: false
---

Every EM I talk to is trying to figure out how much they need to understand about agentic AI technically before they can lead a team building it.

The honest answer: less than you think, and different than you're probably studying.

Here's what actually matters.

## The org dynamics are harder than the technology

Agentic AI projects have a surface-level technical challenge and a deeper organisational one. Most EMs focus on the technical challenge. The organisational one is what determines whether the project ships.

The three dynamics I see derail projects most often:

**1. The demo-to-production gap is wider than stakeholders expect**

An agent that works in a demo environment often fails in production for reasons that have nothing to do with model quality: latency, rate limits, edge cases in real data, failure modes that were abstracted away in the demo. 

Stakeholders who saw the demo will underestimate the gap. Your job as EM is to set expectations *before* this happens, not explain it after. That means you need to understand the gap well enough to articulate it in non-technical terms.

**2. The "AI person" problem**

Every team I've encountered has designated one person as the AI expert. That person becomes the bottleneck for every AI decision, the scapegoat for every AI failure, and the first person to burn out.

The fix is structural: agentic AI capability needs to be distributed across the team, with clear ownership of different components (orchestration, evaluation, tool development, prompt engineering). A team with four people who each understand 60% of the system is more resilient than a team with one person who understands 100%.

**3. You can't manage what you can't evaluate**

If your team can't tell you whether the agent is performing better or worse than last week, you don't have a development process — you have an experiment. Evaluation infrastructure is not optional and it's not a "later" problem. It's a precondition for managed delivery.

## The concepts you actually need to understand

You don't need to be able to build an orchestration loop. You do need to understand these well enough to make decisions about them:

**Tool use** — agents take actions by calling tools (APIs, databases, external services). The quality and constraints of the tools define what the agent can and can't do. When your team says "the agent keeps making the wrong API call," this is a tool design problem, not a model problem.

**Context windows** — agents have a limited working memory (the context window). Long-running tasks require explicit memory management. When your team says "the agent forgot what we told it earlier," this is a context management problem.

**Evaluation loops** — an evaluation loop is the mechanism that tells you whether the agent's output is correct. Without it, you're flying blind. Your team needs one before they need a lot of other things.

**Human-in-the-loop gates** — some agent decisions should require human approval before execution. Where those gates go, and who approves them, is a product decision as much as a technical one. It directly affects your team's on-call burden.

## What good EM behaviour looks like

The EMs who handle agentic AI projects well do a few things consistently:

**They ask "what can go wrong?" before "what can it do?"** The failure modes of agentic systems are less obvious than traditional software. Budget for exploration of failure cases early.

**They insist on evaluation infrastructure before feature work** — not as a formality, but because without it they can't tell if feature work is improving things.

**They treat the system prompt as part of the codebase** — versioned, reviewed, tested, not edited casually by whoever has access.

**They maintain a human-readable runbook for the most common failure states** — so on-call isn't a black-box debugging exercise at 2am.

---

## The fastest way to get up to speed

I designed the [Agentic AI Project Strategy](/training/) cohort specifically for EMs in this situation — experienced leaders who need to develop a working model of how these systems behave, what goes wrong, and how to structure a team to deliver reliably.

Every session is anchored to a real project decision you're likely to face that week. No tutorials. No theory without an immediate application.

If you're two months into an agentic AI project and things feel shaky, [let's talk](/contact/?source=mentoring).
