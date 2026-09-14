# Teaching notes

Notes to Sunil about how to *run* a session — never what a learner reads.

They live here rather than in `src/content/sessions/*.md` for one reason: that
directory is a content collection, every file in it is rendered to a signed-in
learner the moment its `status` flips to `ready`, and a note-to-self is the
worst possible thing to show someone who paid for the course. Same reasoning as
`reviewNote` on `/latest`.

Nothing in this directory is imported, rendered, or deployed.

    threads.md         the contract between the six sessions: the five areas
                       every week owes something to, and what each week owes.
                       Read the week's row before writing any block of it
    week-N.md          how to run session N — staging, open items, the clock
    week-N-script.md   the run of show: a cumulative clock, what to say, what to
                       type, and the running request cost. For following live in
                       the room, not for reading beforehand
    notes/<topic>.md   the material behind a paragraph the session states in four
                       sentences: the full argument, the code it points at, the
                       common wrong answers and what to do with them
    quiz/week-N.md     question bank, tagged by topic and difficulty, with the
                       rationale for every distractor

The files here are the source. The teaching surface built from them is a
published Artifact, where each problem carries its solution behind a click, so a
solution is never on screen while a room is meant to be producing it. Edit here,
then republish.

Week 1's four artifacts. **This is the only place they are recorded.** They spent
a while pasted at the top of `src/content/sessions/week-1.md`, which is a
learner page — the instructor notes, the design review and the design spec would
all have gone on screen for a paying participant the moment that file flipped to
`ready`. Links to working material belong on this side of the line, always.

    instructor notes  https://claude.ai/code/artifact/435ed083-117f-45d1-8827-ee939e7d1889
    learner notes     https://claude.ai/code/artifact/80c83cbc-7c49-472b-ab3c-e28cc48e014a
    design review     https://claude.ai/code/artifact/87abaa6e-d690-45ba-969b-d814cef7bf2a
    design spec       https://claude.ai/code/artifact/62d1288c-2560-4dc9-9098-0436259e48b4

Week 2 is built and published **one topic at a time**, so each topic is a pair of pages
rather than a whole session. The topic list and the shared label vocabulary are in
`threads.md`. Topic 1 of 5, guardrails:

    topic 1 · guardrails · "Where the limit lives"
    learner    https://claude.ai/code/artifact/b6cc3049-8e36-4865-ac75-13c8c30d6331
    instructor https://claude.ai/code/artifact/94a3dee1-5c2f-4fa4-83e3-72beab968ebc

    topic 2 · human in the loop · "Who answers at 2am"   (outline stage)
    learner    https://claude.ai/code/artifact/e09aa8a7-17b3-40f9-9f71-3c0a476086e9
    instructor https://claude.ai/code/artifact/2d642bdf-1797-4fd9-b929-d5297a57e6a0

The same caution applies as for week 1: these are a second surface saying what
`src/content/sessions/week-2.md` says. The session file is what the site serves and is
therefore the source of truth. The pages are built from it.

**The reference agent now has per-week make targets**, and the Makefile states the rule
at the top: every week gets its own prefixed targets and its own module under `src/`, a
later week never changes an earlier week's target, and a demo never edits the shared
agent. Week 1's targets keep their unprefixed names because the pre-work and the session
page print them; `w1-` aliases point at the same recipes.

    w2-guarded   ticket 9999 with data/policy.json loaded. Refused, and the trace
                 names the rule and the file. Block 1 opens on it
    w2-goodwill  the ceiling holds, and another team's tool walks past it into the
                 same ledger. Block 2's first failure

`agent.py` is deliberately left unguarded. Moving the check into the dispatch is drill 1,
and a demo that has already done it takes the drill away.

The learner-notes artifact is the one to watch: it is a *second* surface saying
what `src/content/sessions/week-1.md` says, and two of those drift. The session
file is the one the site serves and therefore the source of truth; the artifact
is a handout built from it.

## The quiz decision, reversed

This file used to say the quiz banks were teaching material only, and that there
was no quiz surface in `/craft` and none planned. That is no longer true, and the
reversal is deliberate.

There is now a learner-facing quiz at `/craft/quiz`, and a room view at
`/craft/admin/work`. What changed the decision was not a wish to grade people. It
was one addition to the bank: a confidence rating on every answer.

Confident-and-wrong is the only dangerous state, and it is the characteristic
failure of experienced people meeting a new domain. Unsure-and-wrong is someone
learning normally. One extra radio button turns the exercise from examination
into calibration, which is how it has to read to eight director-level engineers.
It also produces the single best signal in the system.

What stayed cut is the part that made it an assessment product:

- **No score, level or rank reaches anybody.** Not the learner, not Sunil, not
  internally. Sunil sees the spread across the room per question — "five picked
  the queue, three picked direct calls" — because that opens a session. A
  percentage per learner does nothing. Against this room it invites an argument
  about the measure instead of the material.
- **The quiz proves theory; the ADR proves practice.** They are two halves of one
  capability, not two phases, which is why the pairing in
  [src/lib/craft/pairing.ts](../../src/lib/craft/pairing.ts) compares them rather
  than ranking either. The interesting case is someone who picks the right
  trade-off on Tuesday and does the opposite on Friday.
- **`judge` items are never auto-scored, and never reach the quiz surface at
  all.** They have no model answer and are scored on the defence, so they belong
  in the room or as an ADR prompt.

See §5.4 and §10 of
[docs/learning-agent-specs-02-09-2026.md](../learning-agent-specs-02-09-2026.md)
for the full reasoning, and [quiz/README.md](quiz/README.md) for the file format.

## Why the teaching stays in files

Session material is written once, read by eight people, and revised between
cohorts. In Postgres it would need an editor to build and would have no history.
As files it reviews as a diff and versions with the code that serves it.
**Supabase holds the people, not the teaching.**

The instinct will be to move questions into a table and build an editor for them.
That is the wrong side of a line this repo already drew in
[src/content.config.ts](../../src/content.config.ts), and it costs the diff review
and the version history.

The one exception is `feedback_responses` — Sunil's "here is what changed because
of what you said" note. It is per-cohort operational writing that is thrown away
between cohorts, not material that is revised, so it lives in Postgres.

Everything in `docs/` is unrendered and undeployed. Anything that has to reach a
learner goes through a module that strips the teaching-only fields. For the quiz
that is `src/lib/craft/quiz.ts`, and there must never be a second one.
