# Cost-ceiling worksheet

The Living Craft

## What this helps you decide

Define what one workflow is allowed to spend or repeat, what happens at the boundary and who reviews the result. Start with a single workflow, including its retries and background work. A budget estimate and an enforced ceiling serve different purposes.

## Worked example

Illustrative arithmetic only: a task uses USD 0.10 of model work per attempt. Two attempts use USD 0.20 before retrieval, other tools or human review. If neither attempt succeeds, cost per successful task cannot be inferred from those attempts alone. Record failure cost alongside completed work rather than excluding it from the average.

Suppose the design allows at most two attempts for this example. On reaching the limit, it saves the unresolved outcome and offers a review route. That is a chosen teaching example, not a recommended universal limit. Concurrent requests and retries must share the intended accounting boundary.

## Complete the ceiling table

For each row in the companion CSV, record the proposed limit and unit, why it is justified, where it is enforced, the owner, the boundary test and the evidence. Include model/tool calls, elapsed time, run cost and aggregate cost per person or period as relevant. Keep currencies separate.

| Review question | Your decision should explain |
| --- | --- |
| What counts as one run? | How retries and repeated submissions are recognised |
| What work is charged? | Model, retrieval, tool, background and review costs |
| Where is the limit enforced? | The component that can stop further work |
| What does the user experience? | Saved state, unresolved outcome and next step |
| What happens concurrently? | How simultaneous requests cannot each spend the same remaining allowance |
| When do we review it? | Changes in task, traffic, pricing or acceptable risk |

## Test the boundary

Exercise a run at the limit, repeated requests, concurrent requests and a delayed tool result. Confirm that already completed actions are not repeated and that unresolved work is visible. Account for provider billing delays; a local counter may not equal final billed cost.

## Limits and next step

This worksheet does not choose a safe budget for your system or guarantee a provider's final bill. Use measured workload and current prices, then review the design with its owner. What is the first experiment needed to justify one of your limits?
