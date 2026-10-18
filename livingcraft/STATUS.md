# Workspace Status and Decisions

Last updated: 2026-10-18

## Current focus

Week 1, Topic 1.1 — **Draw the Action Boundary: Identity, Authorization, and Controlled Autonomy**.

### Topic 1.1 status

- Core learning content: approved.
- Architecture diagram direction: approved; editable Mermaid sources are maintained in `week-1/topic-1-1/diagrams.md`.
- Lab direction: agreed.
- Lab implementation: a Python scaffold simulating one protected `issue_refund()` tool.
- Learner clarity: requires exact file-by-file, copy/paste instructions; see the lab README.
- Quiz: enterprise scenarios and architecture trade-offs.
- Complete practical pack: **awaiting user review and approval**.

### Week 1 remaining topics

- 1.2 — Build a Small, Testable Agent (not started).
- 1.3 — Make One Run Explainable (not started).

Do not begin Topic 1.2 until the complete Topic 1.1 practical pack is approved.

## Approved lab scope

- Prevalidated identity context; no OAuth/OIDC provider implementation.
- Role/scope authorization and order-level access.
- Business rules: read-only identities cannot refund; operator can auto-refund eligible amounts up to ₹500; amounts above ₹500 require trusted approval; refund cannot exceed amount paid.
- Denied requests must not execute.
- Four primary scenarios: valid ₹300 refund on a ₹1,000 order; read-only caller; ₹1,200 refund on a ₹1,000 order; ₹700 refund without approval.
- Out of scope: real payment gateway, production token validation, central policy engine, durable multiworker idempotency, production deployment, multi-agent orchestration.

## Learner-experience decision

The learner must not be asked to guess what to change. Every coding task should specify:
1. exact file to open;
2. exact function/test to find;
3. exact insertion point;
4. complete code to paste or exact lines to replace;
5. expected output;
6. command to verify;
7. common failure and fix.

## Change control

- Workspace is being developed on branch `workspace/livingcraft-course`.
- Keep changes isolated from the production homepage and existing `/craft` admin routes.
- Do not claim deployment or live availability unless independently verified.
