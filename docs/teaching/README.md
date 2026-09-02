# Teaching material

Curriculum content that is authored as prose and revised between cohorts: the quiz
bank, and whatever joins it. **Everything in `docs/` is unrendered and undeployed.**
Anything that has to reach a learner goes through a module that strips the
teaching-only fields — for the quiz that is `src/lib/craft/quiz.ts`, and there must
never be a second one.

## Why it lives here and not in the database

The repo already settled this in [src/content.config.ts](../../src/content.config.ts):
session material is written once, read by eight people, and revised between cohorts.
In Postgres it would need an editor to build and would have no history; as files it
reviews as a diff and versions with the code that serves it. **Supabase holds the
people, not the teaching.**

The instinct will be to move questions into a table and build an editor for them.
That is the wrong side of a line this repo has already drawn, and it costs the diff
review and the version history.

The one exception is `feedback_responses` — Sunil's "here is what changed because of
what you said" note. It is per-cohort operational writing that is thrown away between
cohorts, not material that is revised, so it lives in Postgres.

## The quiz decision, reversed

**This folder previously recorded that the quiz banks were teaching material only —
"not an assessment product; there is no quiz surface in `/craft` and none is planned."
That is no longer true, and the reversal is deliberate.**

There is now a learner-facing quiz at `/craft/quiz`, and a room view at `/admin/quiz`.
What changed the decision was not a wish to grade people. It was one addition to the
bank: **a confidence rating on every answer.**

Confident-and-wrong is the only dangerous state, and it is the characteristic failure
of experienced people meeting a new domain. Unsure-and-wrong is someone learning
normally. One extra radio button turns the exercise from examination into calibration
— which is how it has to read to eight director-level engineers — and it produces the
single best signal in the system.

What stayed cut is the part that made it an assessment product:

- **No score, level or rank reaches anybody.** Not the learner, not Sunil, not
  internally. Sunil sees the spread across the room per question — *"five picked the
  queue, three picked direct calls"* — because that opens a session. A percentage per
  learner does nothing, and against this room it invites an argument about the
  measure instead of the material.
- **The quiz proves theory; the ADR proves practice.** They are two halves of one
  capability, not two phases, which is why the pairing in
  [src/lib/craft/pairing.ts](../../src/lib/craft/pairing.ts) compares them rather than
  ranking either. The interesting case is someone who picks the right trade-off on
  Tuesday and does the opposite on Friday.
- **`judge` items are never auto-scored, and never reach the quiz surface at all.**
  They have no model answer and are scored on the defence, so they belong in the room
  or as an ADR prompt.

See §5.4 and §10 of
[docs/learning-agent-specs-02-09-2026.md](../learning-agent-specs-02-09-2026.md) for
the full reasoning, and [quiz/README.md](quiz/README.md) for the file format.

## What is here

| | |
|---|---|
| [quiz/](quiz/) | The quiz bank, one file per week. Answers and distractor rationale inline. |

## What is missing

The quiz bank is **one item**, for week 1. Weeks 2–6 do not exist, and neither do the
session bodies they would come from. This is the binding constraint on the whole
learning agent — the room views have one question to distribute — and it is authoring,
not engineering.

The spec's own mitigation (§11): each session already contains all three artefacts.
§2 *The Problem* is the quiz item, §3 *The Drill* is the assignment, and the decision
the drill forces is the ADR prompt. Extractions from a session being written anyway,
not three new things per week.
