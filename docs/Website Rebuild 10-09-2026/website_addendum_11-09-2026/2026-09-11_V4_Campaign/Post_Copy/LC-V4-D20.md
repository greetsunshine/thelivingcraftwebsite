# LC-V4-D20 — Introduce deployment checklist

## Caption

A deployment checklist is useful when it identifies an owner and produces evidence.

“Check production” is difficult to act on. “Verify the scheduled job ran, link the result and record who reviewed it” gives the team a clear task.

The deployment checklist covers change checks, access boundaries, promotion, post-release verification and recovery. It also asks what has been deferred and when that decision should be revisited.

Use it for one release. Adapt the controls to the system's risks; completing a checklist alone does not establish production readiness.

## Panel 1 — Can someone operate this release?

Use the deployment checklist to make each action, owner and evidence visible.

## Panel 2 — Before the change

Identify the version, the checks required and any data migration or compatibility concern.

## Panel 3 — At the access boundary

Verify that development and review activity cannot accidentally use production permissions.

## Panel 4 — At promotion

Record the approver, evidence and version. Know what must happen before traffic or jobs use it.

## Panel 5 — After release

Check the service and scheduled work. Confirm alerts, recovery and the person who will respond.

## Panel 6 — Keep the unfinished work visible

Record deferred controls with a reason and a revisit trigger. Use the checklist on your next release.
