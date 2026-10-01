# Teaching notes

Notes to Sunil about how to *run* a session — never what a learner reads.

They live here rather than in `src/content/sessions/*.md` for one reason: that
directory is a content collection, every file in it is rendered to a signed-in
learner the moment its `status` flips to `ready`, and a note-to-self is the
worst possible thing to show someone who paid for the course. Same reasoning as
`reviewNote` on `/latest`.

Nothing in this directory is imported, rendered, or deployed.

    threads.md         the contract between the six sessions: the seven areas
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
    generation-prompt.md
                       the prompt that builds a week: notes, learner page and
                       instructor page, on one clock. Paste it into a session
                       with the week number filled in. Change it when a rule it
                       quotes changes

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

**Week 1 is generated now, and the two above are superseded — 29 September.** It has a
content module like week 3's, so its pair is built rather than hand-edited. **Seven topics**,
topic 0 being the frame, the same shape week 2 settled on.

    week 1 · all seven topics, collated, GENERATED         NEW 29 Sep
    learner    https://claude.ai/artifact/5jKNab8RVmu9mqJUM9K1yp
    instructor https://claude.ai/artifact/1RHzfCGnNyD1oo8B8VKsiS

    node scripts/build-teaching-pages.mjs 1
    npm run check:teaching --topics=7 dist-teaching/week-1-learner.html \
      dist-teaching/week-1-instructor.html --by-topic     # 9 of 9 pass

**The four drawings are back, and they live in `scripts/teaching-content/week-1-figures.mjs`.**
The ReAct loop, the whole system with its three tools, the one-step interaction diagram and
the shape of what week 2 builds. They were on the August page, and the first generated pair
lost them, because the content module was written from the session file and a session file
has never held an SVG. The artwork is the original, unchanged, not a redraw. Each is a
complete `<figure>` with its caption, and each appears **twice** — on the learner page and in
that beat's reference card — so the instructor is looking at the same picture the room is.

`_design.mjs` gained the figure rules for them. Week 3 has no `<figure>` at all, so those
rules are inert there; its two pages differ from before only by that CSS block.

The two hand-built pages above are kept for reference and **should not be edited**. The
learner one's share is pinned to a pre-design-system version that only Sunil can move, so
it was never showing viewers the 28 September palette conversion anyway. The design review
and the design spec are still live records and are not superseded.

**The block names did not change.** `src/content/sessions/week-1.md` still reads
"1 · The Concept", and `threads.md` still refers to it that way. A topic is how the page is
organised; a block is what the day is called. The seven topics map to the five rated
outcomes: topic 1 is outcome 1, topic 3 is outcome 2, topic 2 is outcome 3, topic 4 is
outcome 4, topic 5 is outcome 5. Topic 0 is the frame and topic 6 is the horizon, and
neither carries an outcome.

## Week 2 · Guardrails — rebuilt 30 September against the generation prompt

**Week 2 is generated now, and it has four topics.** Until 30 September its two stored
pages were the source, hand-built and hand-edited. They were ported into a content module
and rebuilt against [`generation-prompt.md`](generation-prompt.md) in the same change, so
both pages come from one place, like weeks 1 and 3:

    docs/teaching/notes/week-2-guardrails.md   the argument, one section per clock row,
                                                each headed with its offset
    scripts/teaching-content/week-2.mjs         the pages: learner copy, instructor
                                                script, reference card, one entry per segment
    scripts/teaching-clock.mjs                  ROWS_W2, thirty-eight rows
    docs/teaching/quiz/week-2.md                22 items, each tagged with its offset
    src/content/sessions/week-2.md              frontmatter the site reads, and a short
                                                learner summary

    node scripts/build-teaching-pages.mjs 2
    npm run check:teaching -- --by-topic --topics=4 \
      dist-teaching/week-2-learner.html dist-teaching/week-2-instructor.html   # 9 of 9 pass
    cp dist-teaching/week-2-*.html docs/teaching/pages/
    node scripts/check-stored-pages.mjs                                        # week 2 passes

**The four topics, each one run on the clock, each in the prompt's six parts:**

    topic 1 · Guardrails and policy enforcement    00:15 to 01:39   the old topics 0 and 1
    topic 2 · Human-in-the-loop (HITL) approval    01:44 to 02:34   plus the two-mistakes reading
    topic 3 · Idempotency                          02:34 to 03:13
    topic 4 · Red-teaming                          03:18 to 04:05   the judge, then the adversary round
    the close                                      04:05 to 05:00   recall, teardown, quiz, spoken
                                                                    takeaway, second rating

**What was cut, and why**, is the table at the top of the notes file. In short: governance
became the teardown at 04:15, "who is allowed" and the in-room policy-table draft left the
room, and every topic gained a four-minute quiz and a written takeaway.

**Topic numbers are URLs.** `/craft/week-2/topic-1` to `topic-4` are served by slicing the
two stored pages. `topic-0` and `topic-5` to `topic-7` now return 404. Nothing on the site
links to them.

**The generator gained the six-part slots, and they are opt-in.** `week.shape = 'six-part'`
turns on a hands-on lab check, a three-question topic quiz with one question from earlier
material, a named-products table with three or more options a slot, a written takeaway, a
"What the agent can do now" table, and a close. Weeks without the flag build byte-identical
to before. Week 3 uses the same slots.

**Everything below this line about week 2 is history**, kept because it is the only record
of the published Artifacts. All sixteen links carry the old numbering and are superseded.

    topic 0 · the frame                  https://claude.ai/artifact/EmG3hc16xvDeQEyEdoSxHh
                                         https://claude.ai/artifact/1v7vwMJxPL376pNBE1ev2Z
    topic 1 · the limit                  https://claude.ai/code/artifact/b6cc3049-8e36-4865-ac75-13c8c30d6331
                                         https://claude.ai/code/artifact/94a3dee1-5c2f-4fa4-83e3-72beab968ebc
    topic 2 · the human gate             https://claude.ai/code/artifact/e09aa8a7-17b3-40f9-9f71-3c0a476086e9
                                         https://claude.ai/code/artifact/2d642bdf-1797-4fd9-b929-d5297a57e6a0
    topic 3 · reliability                https://claude.ai/artifact/5rSfHuRqxMh4pnLqxL7xpV
                                         https://claude.ai/artifact/XP8Go9f39bum9PKKzasYr2
    topic 4 · risk trade-offs            https://claude.ai/artifact/8BMPNTrD8XqMnKXHEqp6wk
                                         https://claude.ai/artifact/G7szciCpfzwgzJZcwgmUzH
    topic 5 · governance                 https://claude.ai/artifact/H6WiABZqtq3kQaCJNnTdfu
                                         https://claude.ai/artifact/EHPs9vRK8Q8kz67qRnQf3z
    topic 6 · choosing a mechanism       https://claude.ai/artifact/2DvAm4iPYCAPqaunNe3xvm
                                         https://claude.ai/artifact/D7tcY7EjSGUXcgrGJpk8f2
    collated, eight topics               https://claude.ai/artifact/Q1r2bp8wuXJtm8U6v31tLU
                                         https://claude.ai/artifact/UvW3uzMHXznXU95oWHkA98

## Notes that apply to every week's pages

**The script the instructor pages embed is [`scripts/teaching-pane.js`](../../scripts/teaching-pane.js).**
It runs the Side-by-side toggle and lights the reference card behind whichever beat you
click. It is in the repo because it was broken in all seven published pages at once and
nothing could see it: the old version passed a bare id to `querySelector`, which read it
as an element name and matched nothing, so clicking a beat did nothing. A dead link and a
working one are the same HTML, so `check:teaching` cannot catch it. Check by hand after a
rebuild, or check that every `data-ref` has a matching `id` on the page. Week 2's 26 all
resolve as of 30 September.

**Run `npm run check:teaching <learner.html> <instructor.html>` before every republish.**
It is eleven mechanical checks between a pair: the clock tables byte-identical, both pages
in clock order, every card and every run-of-show row present in the clock, the two columns
agreeing heading for heading, every learner heading present on the instructor page, and
both pages well formed. **All seven pairs pass all eleven**; topics 1 to 6 as of 28 September, topic 0 as of
29 September. Topic 0 needed three new entries in the checker's `LOGISTICS_PATTERNS`, for
the three cards it carries that sit outside the clock on purpose: *So what is a guardrail*,
*Why an agent needs these and a batch job does not*, and *What firms already running this
use*. They are exact titles rather than a loose pattern, so a real beat that loses its clock
row cannot hide behind them.

**The collated pair runs the same command with `--by-topic`**, which swaps six of the
eleven checks. The clock-order and run-of-show checks describe a page that claims to be a
run of show, and a page organised by topic does not; in their place it checks that neither
page has duplicate ids, that **seven** collapsible topics exist, and that both pages carry
the same topics in the same order. Nine checks, all passing.

**The clock lives in [`scripts/teaching-clock.mjs`](../../scripts/teaching-clock.mjs) and
nowhere else.** Twelve pages carry it, and twelve copies maintained by hand is twelve
chances for a row to drift invisibly. Print the block for a topic and paste it into both
pages of that pair:

    node scripts/teaching-clock.mjs 01:40 01:47 02:00 02:05 02:20

**The stylesheets and the two scripts live in `scripts/teaching-content/_design.mjs`.**
They were written inside `week-3.mjs`; week 1 needs the identical four, and two copies of a
stylesheet is the drift this directory exists to prevent — the palette swap of 28 September
had to touch five published pages one at a time for exactly that reason. `week-3.mjs`
re-exports from `_design.mjs` now, and both of its pages build byte-identical to before the
extraction, which is the check to run if you touch it.

**`build-teaching-pages.mjs` had week 3's wording written into the template** — "Five hours,
eight blocks", a quiz at 04:10, "all six topics". Every one of those is wrong for week 1,
which has five blocks, a quiz at 04:20 and a bank of fifteen. They come off `week.wording`
in the content module now, and every default is the week 3 string, so week 3 is unchanged.

That this matters is not hypothetical. Topics 1 and 2 were built before topics 3 to 6
existed, and by the time all six were written their clocks disagreed about who owned two
rows. Both were regenerated and republished from the one table.

Topic 2 was recorded here as "outline stage" and that was wrong. Both its pages were
complete, including a hand-drawn SVG of the four exits from an ask. Only the clock was
stale.

## Week 3 · Evidence — rebuilt and published 30 September

**Week 3 was rebuilt against [`generation-prompt.md`](generation-prompt.md)**, which arrived
that morning, and both pages are published. The 29 September version is in git history if
you want to compare.

**The two Artifacts are private.** Nobody but Sunil can open them until they are shared from
each page's own Share menu. Republishing from this repo keeps the same two URLs, so a rebuild
does not scatter links: change the module, run the build, copy into `docs/teaching/pages/`,
and republish the same two files.

    scripts/teaching-clock.mjs                ROWS_W3, 46 rows, ends at exactly 05:00
    scripts/teaching-content/week-3.mjs       the pages: five topics, six parts each
    docs/teaching/notes/week-3-evidence.md    the argument, in clock order, 46 offset headings
    docs/teaching/quiz/week-3.md              25 items, every one tagged with its offset
    src/content/sessions/week-3.md            what the site serves. Still `status: draft`
    docs/teaching/pages/week-3-*.html         the stored pages, not published as Artifacts yet

    node scripts/build-teaching-pages.mjs 3
    npm run check:teaching -- --by-topic --topics=5 \
      dist-teaching/week-3-learner.html dist-teaching/week-3-instructor.html

**Five topics, not six, and the arithmetic is the reason.** §4 asks every topic for six
parts: the narrative, the concept, components and design, a hands-on lab, what firms at
enterprise scale use, and a three-question quiz. That is 39 minutes. §5's close takes 58,
the opening 15, the break 15 and the two pair discussions 10, leaving 202 minutes. Five
topics fit and six do not.

The old topics 1 and 2 merged into **LLM evaluation (evals)**. A case set and a run count
are not two ideas; together they are what an evaluation harness is.

**Topic titles are industry terms now**, from the list in `threads.md`: LLM evaluation
(evals) · Retrieval-augmented generation (RAG) · Model-based grading (LLM-as-judge) ·
Release gates and AI governance · Context engineering. Each carries a question in its
subtitle that a senior engineer cannot answer from the title.

**What was cut, and it is worth knowing.** The segment that pointed the evaluation harness
at a second model version. It was a demonstration rather than a capability: the room
watched two numbers and built nothing. The question survives, and the Model Selection Tool
is the last of the six tools on the learner page so that a learner answers it for their own
system.

**The §7 language rules are not a light pass.** Week 3's four source files carried 59 uses
of "beat", 34 of "green", 9 of "drill" and 5 of "stand up" before the rewrite. The word
"green" was the awkward one: "the suite is green" is ordinary prose and the replacement is
"the suite passes", which changes the rhythm of a sentence rather than one token. Budget
real time for it. The `beats:` field in the content module keeps its name; only prose changed.

**Nothing in the repo compares the session file, the notes and the quiz bank with the
clock.** `check:teaching` only compares the two pages with each other. §9 asks for a one-off
script in the scratchpad rather than in the repo, and week 3's run is **zero differences**
across five sources: 46 clock rows, 14 runOfShow rows, 5 checkpoints, 46 offset headings and
25 tagged quiz items.

    week 3 · all five topics, collated                          PUBLISHED 30 Sep
    learner    https://claude.ai/artifact/RXQs2UDaSP9sXfFHi7BAWi
    instructor https://claude.ai/artifact/JN2LBiHmDc2sqgwNYocBLb

**One §12 item is not met, deliberately.** §4 asks for real names from the seat list on
every activity. There is no seat list in the repo and the only source is the `learners`
table in production. Weeks 1 and 2 both say "assigned by name" without naming anybody, and
week 3 keeps that convention. Pulling eight people's names out of production into committed
HTML is not a decision to make on the way past. **Both weeks report this the same way.**

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
