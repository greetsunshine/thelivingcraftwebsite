# Week 3 review, round 4, 6 October 2026: the re-review rows

*Instructor material. Not learner-facing.*

Source: the "Notes Review" sheet, which gained a **Re-review** column with its own status. This
pass worked the re-review rows: **three on the opening and twenty-three on context
engineering**, the topic that had the least attention in round three.

Rounds [one](week-3-review-2026-10-03.md), [two](week-3-review-2026-10-05.md) and
[three](week-3-review-2026-10-06.md) cover the rest.

**L** learner page, **I** instructor page, **N** [notes](../notes/week-3-evidence.md),
**S** session file, **D** `scripts/teaching-content/_design.mjs`.

**The clock did not move.** 46 rows, fourth round running.

## First: I had a wrong explanation on the page

**This belongs at the top because it is the most important thing in this round.**

Round three added a mechanism for the context cliff. Expanding it, I constructed a score
progression — scores converging, two clauses tying at 100 characters, a coin flip deciding.
Plausible, internally consistent, **and wrong.**

`make w3-trim` prints a **gap column** I had not read. The real data:

| kept | overall | adversarial | gap on the adversarial case |
|---|---|---|---|
| all, 217 | 76% | 75% | gap 1 · GOOD-2.1 over GOOD-2.2 |
| 180 | 82% | 100% | gap 3 · GOOD-2.1 over GOOD-2.2 |
| 150 | 74% | 75% | gap 1 · GOOD-2.1 over GOOD-2.2 |
| 120 | 74% | 55% | gap 0 · GOOD-2.1 over GOOD-2.2 |
| **100** | 62% | **0%** | gap 1 · **GOOD-2.2 over BILL-3.1** |
| 80 | 62% | 0% | gap 1 · **GOOD-2.2 over ESC-1.1** |
| 60 | 69% | 55% | gap 0 · GOOD-2.1 over GOOD-2.2 |
| 40 | 68% | 55% | gap 0 · GOOD-2.1 over GOOD-2.2 |

At 100 characters the gap is **1**, not 0, and the rate is **0%**, not 50%. **A tie cannot
produce 0%**, which is what gave it away.

What actually happens is better teaching material than my invented version. **GOOD-2.1 — the
clause that governs — has dropped out of the front of the list entirely**, and the two clauses
in front are both wrong. The coin is still flipping; both faces are wrong.

So **"gap 1" appears at 217 characters with a 75% rate and at 100 characters with a 0% rate.**
Same gap, opposite outcome, because at 217 it is a gap between right and wrong and at 100 it is
between wrong and wrong. That is now the centre of the beat.

**Two further defects in the same table.** It was missing the 40-character row and the gap
column, so it showed seven rows while the text said eight budgets.

**Every figure has now been diffed against a live run** and all eight rows match. The process
lesson: **run the target before explaining its output.** Reconstructing a mechanism from the
rates alone is exactly how this happened, and it is the third time in four rounds I have
referenced something I had not verified — after the missing Figure 3 and the unpublished grid.

## The opening · three items

| # | Comment | Status | What changed |
|---|---|---|---|
| 1 | Say what the two runs are about — two instances? two users? | Done | It now says what varies and what does not: **not two users, not two machines, not two versions of the code** — the same case, same agent, same input, run twice on one laptop, and the model samples its next word. Then: nothing is broken when that happens, and every consequence today follows from it |
| 2 | Rephrase "A pass is a claim about the cases you chose…" | Done | Leads with the plain version — **"a green suite tells you that the situations you thought of are handled; it tells you nothing about the situations you did not think of"** — then gives the compressed form as the thing to remember, and drops the "that sentence is the week" framing |
| 3 | Outcome 1 names the four classes before anybody has met them | Done | Now: *write a test case my current suite would pass today but should fail, and say what kind of situation my suite has no cases for.* Ratable at 00:05 without the taxonomy, and the taxonomy is what improves the 04:55 score |

**On item 3, the care that mattered.** That wording appears in two places — the session file
(which the pulses read) and the opening block (which the learner reads) — and **the 00:05 and
04:55 ratings only compare if the words are identical.** Both were changed and then diffed to
confirm they match word for word. The id `case-classes` is unchanged, so stored ratings are
unaffected.

The phrase still appears later, in topic 1's own lede and in the 00:27 checkpoint and quiz.
That is deliberate: by then the room has met the four classes.

## Context engineering · twenty-three items

### What this topic is for (4 items)

| # | Comment | Status | What changed |
|---|---|---|---|
| 1 | Say explicitly this is about evaluating the context fed to the LLM | Done | A new opening section: everything measured today has been the agent's **output**; this topic turns around and measures the **input** |
| 2 | Explain why context engineering is under LLM evaluation | Done | Three reasons, and the third places the topic: **a starved context produces no error — it produces a confident, well-written, wrong answer**, which is the failure the whole day exists to catch |
| 3 | Update "This topic has no outcome of its own and the opening said so" | Done | Removed. It read as an apology for the topic existing. Replaced by the three reasons above, which are a positive case |
| 4 | Evaluate whether drift belongs here | **Answered, not added** | Reasoning below |

**On drift.** It does not belong here, and the page now says why rather than leaving it
unaddressed. Everything in this topic is about a change *you* make and can measure immediately.
**Drift is a change nobody makes, discovered late or never**, and the only defence is re-running
a measurement on a schedule. A lab takes thirteen minutes; drift takes three months.

So it has no lab, and instead has three mentions at the moments it would bite — the grader at
01:55, the evaluation set at 02:44, the model version at 03:10. The page states plainly that
**nothing in this course detects drift**, which 02:22 already said.

### What context engineering is (6 items)

| # | Comment | Status | What changed |
|---|---|---|---|
| 1 | Name the example the table refers to | Done | The table is now explicitly **ticket 8002 against account 6100**, the request they ran at 01:06, with a middle column showing what each row actually is on that ticket. A fifth row was added: the request itself |
| 2 | Make the table titles bold, for all tables on the page | Done | **One CSS rule in D per stylesheet.** Headers were `font-weight:500`, which is why nothing read as a header. 178 header cells on the learner page, and weeks 1 and 2 get it too |
| 3 | Is memory not part of the context? | Done | It is, and the comment asked the right question. Memory reaches the model as tokens like everything else, so every measure here applies to it. A table separates **within the run** (present — it is the history) from **between runs** (absent). **The absence is why today's cliff is as clean as it is** |
| 4 | More detail on context relevancy and precision/recall — how are they assessed, how do the mechanics work? | Done | Each is now computed on ticket 8002 at k=3. The reasoning is below |
| 5 | Anchor example placement needs explaining better | Done | It now says what an anchor example is, and why placement matters: a long rubric has a weak middle, so an anchor buried in it is half-read. Put them immediately before the answer being judged |
| 6 | Cover how the components interact, and the design approaches, with examples | Done | **Figure 4** — how the five pieces assemble into a window — with five levers marked, and a table of how you would tune each |

**On item 4, the part that earns the section.** The metrics are computed rather than named:
precision@3 = 1/3, recall@3 = 1/1, both arithmetic over a list a person labelled once, with no
model and no judgement at run time.

Then: **trim the clauses and run it again. Both numbers are unchanged and the answer is now
wrong.** Precision and recall measure whether the right material was *fetched*, not whether it
was *used*. **That gap is exactly what the 01:23 grader covers**, so the payload measures and
the retrieval grader are not alternatives.

**On item 6, the honest limit.** Figure 4 marks five levers and says plainly that **today
measures only the third.** That is not a gap in the material — the third is the one this agent
exposes, and the lab measures what you can change. Lever 5, giving policy its own budget, has
the sharpest cost and no measurement, which makes it the design rule to take home.

### Cut the policy text and watch the answers fail (2 items)

| # | Comment | Status | What changed |
|---|---|---|---|
| 1 | Better notes and instructions | Done | **What this part is about**: what changes (how much of each clause reaches the model) and what does not (cases, agent, policy on disk). Plus why it is worth the time — trimming is the commonest optimisation in production and almost nobody measures its cost |
| 2 | The curve needs explaining better | Done | **What you are looking at**: all five columns annotated, including the gap column that was missing. Which column to read, and the sourcing caveat said up front rather than when challenged |

**The explanation of *why* is still held for 03:33**, deliberately. 03:23 explains how to read
the table; 03:33 explains the shape. Collapsing them would spend the prediction.

### Why the curve falls off a cliff (11 items)

| # | Comment | Status | What changed |
|---|---|---|---|
| 6 | Present the example, explain the results, then connect the topic | Done | The beat now opens by stating that order, then gives **the mechanism first** — a clause scores one point per distinct query word, ties break on clause id, and the gap-to-reliability table from 00:55 |
| 1 | Rephrase reading one; explain the ₹46,000 and whether it applies in production | Done | It went up **because the gap widened from 1 to 3** — trimming took more matching words off the wrong clause. Then three reasons it is not a production strategy, and the transferable instruction: **pick a budget with margin above your cliff, not the budget that scored best** |
| 2 | "The zone ends at once" was not understood | Done | Rewritten around the real data, and it is now the strongest part of the beat. See the correction at the top |
| 3 | "Below the cliff" needs explaining better | Done | At 60 and 40 characters GOOD-2.1 is back in front but tied, so the tie-break decides the order — **and the tie-break is the clause id.** The refund decision is settled by alphabetical order and a coin. **A number that improves for a reason you cannot name ends an investigation** |
| 4 | What is an eviction budget? | Done | Defined, with a one-budget-versus-two-budget diagram walked to turn 10, where the oldest thing dropped is the system prompt and the agent answers a billing dispute with no policy in the window |
| 5 | How is memory growth handled as the context grows? | Done | Three consequences, and the third is the one teams meet first: **the window overflows soonest for the customer with the most history, so the failure is correlated with account value** |
| 7 | Steps for lost-in-the-middle and needle-in-a-haystack | Done | Five steps to run one, and a practical defence that costs nothing |
| 8 | **This section refers to a grid that is not published** | **Fixed, and it was a real defect** | The grid is now published, **labelled as illustrative of the shape rather than a measurement**, because this agent's context is far too short to need the test |
| 9 | The four failure modes need explaining better | Done | Each shown as a thing that happens to ticket 8002, so the room can look at one wrong answer and say which of the four produced it |
| 10 | Cover how each can be controlled and mitigated | Done | Detection and control for each. **The pattern to name: three of the four are fixed by structure and none by a better prompt — context failures are an assembly problem, not a wording problem** |
| 11 | How can clash be handled? Best practices? | Done | Five practices, led by writing the precedence order down and enforcing it where the context is assembled rather than in the prompt |

**On item 11, the link worth keeping.** Contradiction cases are **incomplete-class cases** from
00:27 — the evidence needed to decide is genuinely ambiguous, so the right behaviour is to
escalate rather than to choose. That ties the last topic back to the first.

### The architectural teardown row

Listed again with no new comment. Answered in round three: Figure 3 exists, each question has a
"what it is about" column naming the box to look at, and the full answer key for all five is on
the instructor page.

## Reported against the teaching standard

- **Outcomes verb-led and observable.** Held, and outcome 1 is now ratable at 00:05 without
  jargon the room has not met.
- **A prediction precedes every reveal, on a separate surface.** Held. 03:23 explains how to read
  the table and deliberately does not explain the shape, which is 03:33's job.
- **Every failure case posed as a puzzle.** Held.
- **A "✅ You can now…" checkpoint closes each teaching block.** Unchanged, all five.
- **Activities show their own timing and name their participants.** Timing yes. **Naming real
  people is still not met**, unchanged across four rounds.
- **The notes contract is satisfied, and no two artifacts share notes.** Held.
- **Numbers are concrete, and now verified.** All eight rows of the trim table diffed against a
  live `make w3-trim`; precision@3 = 1/3 and recall@3 = 1/1 worked on ticket 8002; the
  gap-to-reliability figures checked against `P_SECOND` in `src/w3_brain.py`.
- **No placeholders or stray markdown.** Checked.
- **Layout.** Every learner-page table wrapped, every terminal block scrolls internally, no
  page-level horizontal overflow.

## Still not fixed

**The labs do not run for a learner.** Fourth round unchanged. Fifteen paths in
`~/learningthelivingcraft/reference-agent`, one commit, one push. The command is in RESUME.

**One thing this round makes worse in that respect.** The 03:23 and 03:33 beats now depend on the
gap column of `make w3-trim`, which is real output from code that is still uncommitted. The page
is accurate about what the command prints; the command still does not exist for the eight people
who need it.
