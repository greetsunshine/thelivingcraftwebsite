# LC-V4-D25 — Changing models

## Caption

A lower price is a reason to test another model. It is not the result of the test.

This illustrative comparison follows the same task across two candidates and asks what evidence would support a switch.

Before your next model change, decide which result would make you keep the current approach.

## Spoken script

Imagine a team considering a cheaper model for an existing workflow. The demonstration looks good, and the price difference is attractive.

I would want a comparison that resembles the work we actually run.

Start with a representative set of inputs, including difficult cases. Reuse the current prompt and decision logic where the comparison allows it. If a candidate needs a different setup, record that difference so we know whether we are comparing models or whole configurations.

Run without writing to production or taking external actions. Check that tools and background effects are disabled too; a flag named dry run is not evidence by itself.

Then compare the outcomes that matter. Did either candidate miss a required condition? How often did it need another attempt or a human review? What happened to latency and the cost of completed work?

Because outputs can vary, one good response does not settle the comparison. Examine repeat runs and the cases where the candidates disagree.

This is an illustrative protocol, not a claim that every model change needs the same experiment.

Before the test, write down what would stop the switch. That makes it easier to keep the decision grounded when the cheaper result looks tempting.
