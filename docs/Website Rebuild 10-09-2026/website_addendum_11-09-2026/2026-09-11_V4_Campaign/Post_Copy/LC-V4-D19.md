# LC-V4-D19 — Deployment

## Caption

A small team can spend weeks designing a deployment pipeline and still have no clear answer to “what prevents this change reaching production?”

For an illustrative service, I would start with the failures we need to prevent. Then I would choose controls that address them and record what we are deferring.

A fast check before merge, separate production access and a deliberate promotion decision may address different risks. None substitutes for the others.

The useful plan explains the order, the owner and the next test—not just the tools.

Which deferred deployment control in your team has a clear trigger for reconsideration?

## Panel 1 — Start with the failure

Illustrative case: a change passes review but its scheduled job is missing after deployment.

## Panel 2 — Check before merge

Run relevant fast checks. State what they can detect and which checks require a different environment.

## Panel 3 — Separate production access

Make it difficult for routine development or review work to modify production data. Test the boundary.

## Panel 4 — Make promotion deliberate

Identify who approves the release, what evidence they review and which version moves forward.

## Panel 5 — Verify after deployment

Check health and scheduled work. Define rollback or recovery before the release needs it.

## Panel 6 — Record the deferrals

Name what is not implemented, why, and what change in risk or scale would trigger it.
