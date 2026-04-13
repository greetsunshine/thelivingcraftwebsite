---
title: "Compressing Two Years of Agentic AI Learning into 90 Days"
description: "A structured approach to ultra fast learning for senior engineers — not shortcuts, but deliberate sequencing of what to learn in what order."
date: 2026-03-05
tag: "Ultra Fast Learning"
tagColor: "cyan"
readTime: "10 min"
featured: false
---

Most senior engineers I talk to are trying to learn agentic AI the way they learned their last technology: breadth-first, reading everything, building small experiments, gradually assembling a mental model.

That approach works. It takes about two years.

Here's a faster path — and the reasoning behind why it works.

## Why the standard approach is slow

The breadth-first approach has a specific failure mode: you spend significant time learning things that are interesting but not load-bearing. Agentic AI has a lot of those. Entire sub-fields (fine-tuning, embedding models, attention mechanisms) are fascinating and mostly irrelevant to the job of building systems that ship.

What you need instead is a **dependency map** — a directed graph of the concepts where each concept is only learned after the concepts it depends on, and only learned if something downstream actually needs it.

## The 90-day sequence

This is the sequence I've validated through cohort work and 1:1 mentoring. It's not the only sequence. It's the one that produces the fastest time-to-useful for senior engineers.

### Days 1–14: The primitives

Three concepts that everything else builds on:

**Tool use** — how an LLM takes actions in the world. Build one yourself: a simple agent that can call an API and interpret the result. Don't move on until this is intuitive.

**The context window as working memory** — what it means for the model to "remember" something, what happens when it runs out, how to manage it. The core mental model: it's a sliding window, not a persistent memory.

**Evaluation** — how you know if the output is right. Start with exact-match, graduate to LLM-as-judge. This is the skill that compounds most — you'll use it constantly.

**The test of completion:** you should be able to explain, without notes, why an agent that worked perfectly in testing produced a wrong answer in production — and diagnose which primitive was involved.

### Days 15–35: Orchestration

Multi-step, multi-agent systems — where most of the complexity lives.

**Sequential chains** — the simplest case. Agent A produces output, Agent B consumes it. Where does the state live between steps?

**Parallel execution** — multiple agents running simultaneously. How do you handle partial failures?

**Routing and delegation** — an orchestrator that decides which agent handles a given task. The interface design matters more than the routing logic.

**The test of completion:** implement a three-agent system where one agent can fail and the others compensate. If you can't do this cleanly, you don't have orchestration — you have sequential function calls with extra steps.

### Days 36–55: Production concerns

The gap between "works in testing" and "works in production."

**Rate limits and backoff** — every external API will rate-limit you. Your agent needs to handle this gracefully, not crash.

**Latency budgets** — users (and calling systems) have latency expectations. Understand where time is being spent and what can run in parallel.

**Cost modelling** — agentic systems can be expensive at scale. Build intuition for which operations are costly and which aren't before you go to production.

**Human-in-the-loop gates** — which agent decisions need human approval? Where do you put the gate? This is a product question as much as a technical one.

### Days 56–75: Evaluation at scale

Evaluation in testing is a habit. Evaluation in production is infrastructure.

**Ground truth datasets** — how to build and maintain a set of representative test cases. More art than science. The cases that matter most are the edge cases you haven't seen yet.

**Regression testing for prompts** — every prompt change should run against your ground truth. Treat the system prompt like code: versioned, reviewed, tested.

**Drift detection** — performance in production degrades over time as input distribution changes. You need to detect this before users do.

### Days 76–90: Systems thinking

The capstone: stepping back from the components to understand the system.

**Failure mode analysis** — given your specific system, what are the top five ways it fails in production? Not hypothetically — trace through your actual architecture.

**The feedback loop** — how does operational data flow back into system improvement? Agents that don't improve over time are being operated, not developed.

**Documentation for on-call** — can someone who didn't build this debug it at 2am? If not, the system is a single point of failure you haven't addressed yet.

---

## What makes this fast

The reason this sequence compresses the timeline isn't clever tricks. It's two things:

**Dependency ordering** — you only learn what you need when you need it. Every concept introduced is immediately needed for the next one.

**Application before completion** — you implement each concept before you feel ready. This is uncomfortable but necessary. The discomfort is the learning.

The two-year version of this journey includes a lot of time spent learning the wrong things in the wrong order, building things that don't connect to anything, and assembling a coherent picture slowly through accumulated experience.

The 90-day version is the same learning, deliberately sequenced.

---

If you want to do this with a cohort of peers at your seniority level, the [Agentic Architectures Deep Dive](/training/) is designed around this exact progression. Application-first, practitioner-level, ≤20 participants.

[See the program →](/training/)
