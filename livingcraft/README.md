# The Living Craft — Agentic AI Course Workspace

This directory is the source of truth for course planning, learner materials, labs, assessments, and review decisions for The Living Craft Agentic AI programme.

## Working agreements

1. Work on one topic at a time.
2. Obtain approval for the topic content before building its diagrams, lab, and quiz.
3. Obtain approval for the complete practical pack before moving to the next topic.
4. Keep learner instructions explicit: file name, exact location, exact change, expected result, and verification command.
5. Keep teaching simulations clearly separated from production-ready systems.
6. Do not publish or merge course pages into the live site without review.

## Workspace map

- [Course plan](course-plan.md) — course promise, audience, workflow, and current curriculum.
- [Status and decisions](STATUS.md) — current state, approvals, and next actions.
- [Week 1 / Topic 1.1](week-1/topic-1-1/README.md) — approved lesson content and practical-pack status.
- [Topic 1.1 diagrams](week-1/topic-1-1/diagrams.md) — editable Mermaid source for architecture diagrams.
- [Topic 1.1 quiz](week-1/topic-1-1/quiz.md) — enterprise scenarios and answer explanations.
- [Topic 1.1 lab](week-1/topic-1-1/lab/README.md) — learner guide with exact code edits.
- [Lab implementation](week-1/topic-1-1/lab/refund_agent.py)
- [Lab tests](week-1/topic-1-1/lab/test_refund_agent.py)

## Brand and design

Use the existing The Living Craft brand: warm ivory/cream, forest/deep green, antique gold, dark ink, sage, generous whitespace, restrained borders, serif headings with clean sans-serif body text. Keep technical diagrams clear and readable; ornament must never obscure meaning.

Reference site and resources:
- https://learning.thelivingcraft.ai/
- https://learning.thelivingcraft.ai/resources

## Important scope note

The current Topic 1.1 lab simulates refund execution in memory. It is not connected to a payment service and does not implement OAuth/OIDC token validation. Never connect the exercise to real money.
