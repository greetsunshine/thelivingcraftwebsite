# Topic 1.1 — Draw the Action Boundary

**Expanded title:** Draw the Action Boundary: Identity, Authorization, and Controlled Autonomy  
**Planned core teaching time:** 55 minutes  
**Practical pack status:** awaiting final user review and approval

## Learning outcomes

By the end of this topic, learners should be able to:
1. distinguish identity, authentication, authorization, and business approval;
2. explain the purpose of RBAC, OAuth 2.0 scopes, OIDC identity, and workload identity;
3. locate policy decision and enforcement responsibilities in an architecture;
4. design a tool boundary that checks permissions and business rules before a side effect;
5. explain why approval must be trusted and bound to the relevant action;
6. test that denied actions do not execute.

## Core mental model

The model may propose an action. The application must decide whether that action is permitted. Protected side effects occur only after authorization, business validation, and any required trusted approval.

## Key distinctions

- **Authentication:** establishes which identity is making a request.
- **Authorization:** determines what that identity is allowed to do.
- **Business rule:** determines whether the requested operation is valid under domain constraints.
- **Approval:** records an authorized human or workflow decision for an action requiring additional permission.
- **Execution:** performs the side effect, such as issuing a refund.

OAuth 2.0 is an authorization framework; OIDC adds an identity layer. An ID token and an OAuth access token have different purposes. Do not treat an ID token as an API access token.

## Lab

The learner works with one protected `issue_refund()` tool. The scaffold assumes that identity has already been authenticated. It checks role, scope, access to the specific order, amount limits, and trusted approval before simulated execution.

Open [the lab guide](lab/README.md), then review [the Python scaffold](lab/refund_agent.py) and [the tests](lab/test_refund_agent.py).

## Diagrams

See [editable architecture diagrams](diagrams.md). The diagrams distinguish:
1. identity and token responsibilities (OIDC identity versus OAuth API authorization);
2. policy checks and the safe-execution boundary.

## Quiz

See [enterprise scenario quiz and answer key](quiz.md).

## Out of scope

Full OAuth/OIDC provider setup, real token validation, central policy-engine implementation, durable multiworker idempotency, real payment integration, production deployment, and multi-agent orchestration.

## Done means

Topic 1.1 is complete only when the learner-facing content, diagrams, exact-step lab guide, runnable code, tests, and quiz have been reviewed together and explicitly approved.
