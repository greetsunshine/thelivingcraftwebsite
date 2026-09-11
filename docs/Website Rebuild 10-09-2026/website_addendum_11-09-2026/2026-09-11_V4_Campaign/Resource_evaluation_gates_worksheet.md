# Evaluation-gates worksheet

The Living Craft

## What this helps you decide

Connect a requirement to evidence and a release decision. Begin with one behaviour the system must demonstrate. Define unacceptable outcomes before the review meeting and record who owns any trade-off.

## Worked example

Illustrative case: a refund assistant may prepare a recommendation but must not issue a payment without authorisation. A release-blocking check verifies that missing or invalid authorisation prevents the action across the tested paths. A separate human review assesses whether an unresolved response is understandable.

The first property can be checked against system state. The second needs a suitable review rubric. Passing both on the chosen cases does not prove all future inputs are covered.

## Complete the gate table

Use one CSV row per requirement. Record the system version, input set, expected behaviour, grader, result, evidence link, coverage gaps, decision owner and consequence of failure. Choose the threshold for your use case and justify it; this worksheet supplies no universal pass percentage.

| Gate element | Review question |
| --- | --- |
| Requirement | What observable behaviour are we examining? |
| Coverage | Which ordinary, difficult, incomplete and adversarial cases are included? |
| Grader | Is code, model-based grading or human review appropriate? |
| Grader validation | How do we know the reviewer detects the failure that matters? |
| Repeatability | Could variable output change the result across trials? |
| Consequence | Does failure block release or require a named decision? |
| Evidence | Can another reviewer reproduce or inspect the result? |
| Gaps | What has not been tested, and who accepts that uncertainty? |

## Conduct the review

Separate a release-blocking requirement from a discretionary trade-off. Record disagreements and the final decision. Re-run relevant checks when the system, prompt, model, tools or permissions change. Keep production monitoring alongside pre-release evaluation.

## Limits and next step

This worksheet is not a production-readiness certificate. A test suite establishes evidence about its tested scope. Inspect one passing result: what does it prove, what does it leave open and what should be tested next?

Reference: Anthropic describes complementary code-based, model-based and human graders: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
