# LC-V4-D29 — Consent and security

## Caption

“Pending” is a state. It should not quietly become permission.

Imagine an assistant that can send a message to another person. The data model distinguishes permission granted, refused and not yet established. The sending code checks only whether it was refused.

The diagram and the behaviour now disagree.

I would test that boundary directly, including withdrawal and queued messages. This illustrative engineering review does not establish compliance with any particular law or platform policy. Those requirements need their own current review.

Pick one permission in your system. What actually happens when it is missing?

## Panel 1 — Read the missing state

Illustrative case: a recipient has not granted permission. The system must know what that means for the requested action.

## Panel 2 — Separate the states

Granted, refused and not established should have deliberate behaviour. Do not let a default decide silently.

## Panel 3 — Check the action boundary

Test the code that sends or acts, including alternate paths. A correct field in the schema is not enough.

## Panel 4 — Keep useful evidence

Record the basis, scope and relevant history of permission without collecting unnecessary personal data.

## Panel 5 — Test a change of mind

Check withdrawal, queued work and retries. A later action must respect the current permission state.

## Panel 6 — Review the actual requirements

Engineering controls support the design. Applicable legal and platform requirements need separate, current review.
