---
title: "The Five Architecture Decisions That Break Agentic Systems in Production"
description: "Most agentic AI projects fail for the same five reasons. They're not model quality issues — they're architectural choices that look fine in demos and fail at scale."
date: 2026-04-08
tag: "Agentic AI"
tagColor: "violet"
readTime: "12 min"
featured: true
---

Most agentic AI projects I encounter fail at the same five decision points. None of them are model quality issues. All of them are architectural choices that looked reasonable at demo time and revealed themselves at scale.

Here's the pattern I've seen repeatedly — and what to do about each one.

## 1. Orchestration without a circuit breaker

The most common failure: a loop that has no exit condition beyond success or timeout.

When an agent encounters an ambiguous state, it will retry. Then retry again. Then call a subtask that itself retries. Within minutes, you have cascading tool calls, blown API budgets, and no visibility into why.

The fix is boring but non-negotiable: every orchestration loop needs a **max-iterations ceiling** and an **uncertainty threshold** that routes to a human or a fallback path instead of retrying.

```typescript
const MAX_ITERATIONS = 12;
let iterations = 0;

while (!taskComplete && iterations < MAX_ITERATIONS) {
  const result = await agent.step(state);
  if (result.confidence < CONFIDENCE_THRESHOLD) {
    return { status: 'needs_review', state };
  }
  iterations++;
}
```

This is not an edge case. It's week-two behaviour in production.

## 2. Stateless memory in a stateful world

Agents that treat every invocation as context-free look fine in isolated tests. They break under any multi-turn interaction that matters.

The failure mode: a user corrects an agent mid-task ("no, I meant the Q3 report, not Q2"). On the next tool call, the agent has forgotten the correction and reverts to its original interpretation.

You need to decide, explicitly, what your memory architecture looks like:

- **In-context memory**: works for short interactions, fails at long ones (token budget)
- **External store** (vector DB or key-value): higher latency, but survives context window limits
- **Summary compression**: distill long histories to dense summaries at regular intervals

There is no "correct" choice. There is only your choice, made explicitly, with the trade-offs understood.

## 3. Tool schemas that are too permissive

An agent given a tool called `run_query(sql: string)` will, at some point, run a query you didn't intend.

Tool schemas define the agent's action space. Tight schemas make agents more reliable, more predictable, and dramatically easier to debug. Loose schemas give them rope to hang you with.

The principle: each tool should have **one job**, with typed inputs that make the wrong input impossible, not just discouraged.

```typescript
// Permissive — risky
run_query(sql: string)

// Constrained — safe
get_leads_by_stage(stage: 'qualified' | 'contacted' | 'closed', limit: number)
```

Permissive tools are seductive because they feel flexible. They're actually sources of non-determinism disguised as capability.

## 4. Evaluation loops bolted on after the fact

If you build an agent and then ask "how do we know it's working?", you've made the same mistake I see in most projects.

Evaluation is not QA. It's not a test suite you run before shipping. It's a **live feedback signal** that runs continuously in production and surfaces when behaviour has drifted.

The minimum viable evaluation loop has three components:
1. **Ground truth cases** — 20–50 representative inputs with known correct outputs
2. **Automated scoring** — a lightweight LLM judge or heuristic that runs on every output
3. **Drift alerting** — an alert when the rolling pass rate drops below threshold

Without this, you will ship a broken agent and not know it for weeks.

## 5. Treating the system prompt as a static document

The system prompt is code. It has bugs. It needs versioning, testing, and change management.

The failure mode: you update the system prompt to handle a new case, inadvertently break an existing one, and have no way to know because there's no regression test for prompt behaviour.

The fix is prompt versioning with evaluation gates:
- Every prompt change runs against your ground truth cases
- The change is not deployed if the evaluation pass rate drops
- Prompt versions are stored with timestamps and the evaluation results that approved them

This is not exotic. It's version control for a different kind of code.

---

## What this means for week one

If you're starting an agentic AI project now, the architectural decisions above should be on the whiteboard before you write a single tool call.

Not because they're hard to add later — but because adding them later means you'll have spent two months building on a foundation that needs to be partially rebuilt. The demo looks the same either way. The production trajectory is completely different.

If your team is making these decisions without a framework for evaluating them, that's what I help with in the [Agentic Architectures Deep Dive](/training/) cohort.
