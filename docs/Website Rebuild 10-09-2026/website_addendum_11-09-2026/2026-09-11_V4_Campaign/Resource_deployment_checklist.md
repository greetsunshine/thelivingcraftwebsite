# Deployment checklist

The Living Craft

## What this helps you decide

Make a release operable by naming the action, owner, evidence and recovery path. Adapt the checklist to the system's risks. A small team still needs deliberate boundaries; a long checklist is not a substitute for effective controls.

## Worked example

Illustrative case: a service deploys successfully, but the scheduled task that prepares the next period's output is absent. A homepage check passes while the product's main work is not happening.

A useful verification therefore checks both service health and expected job completion. It records when output was due, whether it appeared and who responds if it does not. Recovery must recognise completed work before retrying it.

## Review before release

| Area | Check and evidence |
| --- | --- |
| Change | Identify the version, owner, purpose and dependencies. |
| Fast checks | Run relevant type, static and unit checks; record what they do not cover. |
| Environment | Verify configuration parity deliberately; separate secrets and production access. |
| Data | Review migrations, backup/recovery and compatibility with the previous version. |
| Permissions | Test that routine development and review cannot modify production data. |
| Promotion | Record the approver, evidence and exact version being promoted. |
| Recovery | Explain rollback or forward recovery, including irreversible data changes. |

## Review after release

| Area | Check and evidence |
| --- | --- |
| Service | Verify a meaningful task as well as a health endpoint. |
| Schedule | Verify jobs exist and expected work completes; detect missing success. |
| Observability | Check useful logs and alerts without exposing unnecessary personal data. |
| Response | Name who responds, how they are reached and what recovery they can perform. |
| Repetition | Test that retries and catch-up work do not duplicate completed actions. |
| Deferrals | Record omitted controls, their reason, owner and revisit trigger. |

## Complete the release record

Use the CSV to record status, owner, evidence, unresolved risk and follow-up for each area. A check marked “not applicable” needs a reason. Do not mark a release complete solely because the deployment command succeeded.

## Limits and next step

This checklist does not prescribe your deployment stack or certify a secure system. Review it against your architecture and obligations. Which missing control presents the most consequential failure for your next release?
