# The Living Craft — Agentic AI Course Plan

## Programme positioning

A premium, hands-on cohort programme for senior engineers, architects, and technical leaders with 20+ years of experience. The course is designed for experienced professionals who are skeptical of hype and want practical mastery of agentic systems.

Brand voice: warm, confident, timeless, technically grounded. Teach through real enterprise constraints, architecture trade-offs, direct practice, feedback, teach-back, and spaced review.

## Course development workflow

Develop one topic at a time. The sequence is:
1. agree the topic learning content;
2. approve the content;
3. develop diagrams, lab, and quiz;
4. review the complete practical pack;
5. obtain approval before moving to the next topic.

Do not progress to a subsequent topic while the current practical pack is awaiting approval.

## Week 1 — Control the Agent

**Week promise:** Run an agent with explicit action limits, approval gates, and a trace explaining each tool call.

Original allocation: three topics, 55 minutes each.

### Topic 1.1 — Draw the Action Boundary
Expanded title: **Draw the Action Boundary: Identity, Authorization, and Controlled Autonomy**

Core concepts:
- identity, authentication, authorization, and business approval;
- role-based access control (RBAC), OAuth 2.0, OpenID Connect (OIDC), scopes;
- user-delegated access versus workload identity;
- policy decision point (PDP) and policy enforcement point (PEP);
- least privilege and defence in depth;
- approval gates, confused deputy, time-of-check/time-of-use (TOCTOU), idempotency, and auditability;
- placement of enforcement and architecture trade-offs.

Learning outcome: explain and design an explicit boundary between an agent's proposed action and a protected side effect.

Practical exercise: protect one `issue_refund()` tool with role/scope checks, order-level authorization, refund business rules, and trusted approval. Demonstrate that denied actions do not execute.

### Topic 1.2 — Build a Small, Testable Agent
Status: not started. Do not begin until Topic 1.1 practical pack is approved.

### Topic 1.3 — Make One Run Explainable
Status: not started. Do not begin until Topic 1.2 practical pack is approved.

## Week 1 timing

The three core topics total 165 minutes (2 hours 45 minutes). The current working session outline totals 5 hours, including opening, breaks, quiz/retrieval, partner teach-back, architecture review, and closing. Preserve a 45-minute buffer for transitions, discussion, and lab variation unless the facilitator explicitly revises the schedule.

## Design principles for all topics

- Enterprise relevance over tool demos.
- Explain control flow and failure modes, not just the happy path.
- Make each lab runnable with clear setup and expected output.
- Tests should prove that denied operations did not execute.
- Clearly label assumptions and production gaps.
- Prefer simple, editable diagrams with labeled nodes, directional arrows, and a clear start/end.
- Every assessment should include an answer key and reasoning.
