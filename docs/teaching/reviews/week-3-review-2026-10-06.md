# Week 3 review, round 3, 6 October 2026: the Open rows

*Instructor material. Not learner-facing.*

Source: the "Notes Review" sheet, modified 6 October. It gained a **Status** column, and this
pass worked **only the rows marked `Open`** — eleven with a comment, plus one blank
`Context Engineering` row with nothing to act on. Everything marked `Fixed` was left alone;
those are answered in [round 1](week-3-review-2026-10-03.md) and
[round 2](week-3-review-2026-10-05.md).

**L** learner page, **I** instructor page, **N** [notes](../notes/week-3-evidence.md),
**B** [question bank](../quiz/week-3.md), **D** `scripts/teaching-content/_design.mjs`.

**The clock did not move.** 46 rows, no beat added or renamed, third round running.

**What the eleven rows actually were.** Nine were the same complaint in different places —
topic 4 and the 02:56 lab were not explained well enough to act on. One was a real bug. One was
the context-engineering syllabus.

## The bug

| # | Comment | Status | What changed |
|---|---|---|---|
| 3 | Ensure all the time blocks are updated when I change the start time | **Fixed, and it was a real defect** | Every time *on the page* already followed the start time. The **clock widget's own hint did not** — it read "next at 02:16" while the table beside it read 11:16. Fixed in **D**, so it is fixed for weeks 1 and 2 as well. The elapsed counter still shows an offset, which is correct because it is a duration, and it now carries a title saying so |

**How it was found.** Rendered the page headless with a start time of 09:00 and listed every
remaining `0X:XX` in the visible text. Two came back, both inside the widget. After the fix the
only one left is the elapsed counter. **This is the check to repeat** whenever the clock changes.

## Topic 4 · Release gates and AI governance

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | What is the rate mentioned here? Give more details | Done | "You have a rate" was abstract. The purpose card now tables the three the room actually holds by 02:39: **75%** on the adversarial case from 00:55, **95%** context precision from 01:23, **70% raw and kappa 0.35** from 02:02. Then the question that cannot be answered: *the adversarial case passes 15 times in 20 — is 75% good enough to ship?* **I** says to let the silence sit, because the gap is organisational rather than technical |
| 2 | The release gate needs explaining better; the table does not make things clear | Done | The old table did two jobs at once — listed the four parts *and* scored how often organisations have each — which is why it did not read as an explanation. Now three things in order: the plainest sentence (**a release gate is a written rule that can stop a release**), the four parts **filled in against the adversarial case**, and separately which two are usually missing. The cell that teaches is the threshold's reason: *20 of 20, because one escape pays ₹2,50,000 and there is no partial credit on a payment* |
| 4 | What does "Ask where 95 came from" mean? | Done | It was a bare instruction about a number never introduced. **L** now shows the row it refers to — `threshold 95%`, `owner (blank)` — then the question, then **four answers you might get**: two meaning nobody chose it, two that are real reasons. The two real ones are the two kinds of threshold, which sets up the next part, so they are deliberately not resolved there |
| 5 | The difference between a relative and an absolute gate needs explaining better | Done | Round two listed properties in a table and it did not land. It is now **shown**: the same requirement gated both ways across three releases. The reasoning is below |

### Why the three-release table is the fix for #5

A property list tells you what the two kinds *are*. It does not show you them disagreeing, which
is the only thing that makes the distinction stick.

    release   measured   absolute (>= 95%)   relative (>= last - 1)
    v1          96%      passes              nothing to compare to
    v2          93%      FAILS               FAILS  (96 -> 93, 3 points)
    v3          92%      FAILS               passes (93 -> 92, 1 point)

**Release 3 is the row that teaches.** The same measurement, 92%, fails one gate and passes the
other. Neither gate is broken — they ask different questions and both answers are correct
answers to the question that was asked.

The sentence to keep: **a system can be not-good-enough and also not-worse.**

The costs of each are now a five-row table, and only the last row needs saying out loud: an
absolute gate alone gets argued away because nobody can source the number, and a relative gate
alone lets you decay one point a release with a green build every week. **So pair them**, with
the floor set as a backstop rather than a target.

## The 02:56 lab · three comments, one gap

| # | Comment | Status | What changed |
|---|---|---|---|
| 6 | "Starting state and how you check it" — not clear what needs to be done | Done | A new card before it says what is being produced in one sentence: **one row, thirteen cells of text, no code.** Then three tests for choosing the requirement, and the fallback for anybody stuck |
| 7 | "Build the row, ten minutes" — not clear what needs to be done | Done | **A completely filled row**, all thirteen cells, against this agent, as a model. Plus the triage instruction that makes ten minutes enough: if you only have time for four cells, do 1, 7, 11 and 12 |
| 8 | "Check: review another pair's work" — not clear what is needed | Done | **A definition of the 0/1/2 scale**, which it never had, and the shape of the sentence to say back |

### The gap behind all three

The learner had thirteen column names and no model. Everything else followed from that.

**The reframe that changes the block**, now the first line of the lab: *the real output is the
cells you cannot fill.* A row with four honest blanks teaches more than thirteen confident
guesses. Without that line the lab reads as a form-filling exercise and people invent content to
complete it.

**The 0/1/2 scale, which was previously just "score each column 0, 1 or 2":**

| Score | Means | On the threshold cell |
|---|---|---|
| 0 | Empty, or a placeholder | Blank, or "TBD", or "high" |
| 1 | Filled in, but an outsider could not act on it | "95%" — a number with no reason |
| 2 | Filled in, and another engineer could act on it without asking you | "20 of 20, because one escape pays ₹2,50,000 and there is no partial credit on a payment" |

**And the instruction that prevents the worst outcome**, now said in advance: "I could not find
out who owns this" scores a **2**, not a 0. It is accurate and actionable. Otherwise people
invent a name to avoid a zero, and an invented name is the worst thing this lab can produce.

## Topic 5 · Context engineering

| # | Comment | Status | What changed |
|---|---|---|---|
| 10 | Evaluate the content below and include the relevant topics | **Done differently** | Five sections naming about forty concepts, against a 37-minute topic with five beats. Selected and placed; the table is below |
| 11 | *(blank comment cell)* | — | Nothing to act on |
| 12 | The teardown's artifact, descriptions, and solutions | Done | See the next section |

### What went in, and where

| Where | What arrived |
|---|---|
| **03:28** | **Minimum viable context** as the name for what the 03:40 lab finds — it had none. Context relevancy and context recall connected back to 01:37, so trimming reads as a trade between cost and recall. And **the judge has a context window too**, which closes topic 3's loop: strip bias-inducing metadata, place the anchors, force the output structure |
| **03:33** | **Positional sensitivity** — lost in the middle, with **needle in a haystack** as the test, varying depth and placement, and reading the grid rather than the average. Plus **four failure modes**: starvation (today's), clash, distraction, poisoning (week 4's), each with who owns it |
| **03:54** | Compression, history pruning and agent handoff, each with the measurement it needs, all named as **week 5's**. And a five-row card summarising the whole of context evaluation |

### The one thing to be careful about

**Today's cliff and the positional effect are different mechanisms, and the page says so twice.**
The cliff is a retrieval artefact: cutting clause text pulls lexical scores together until two
clauses are indistinguishable. The positional effect belongs to the model, and **this lab does
not demonstrate it.**

I was explicit about that rather than letting the new material imply the lab had shown it. The
instructor page says to say both sentences, because a room that hears only the second leaves with
one misconception in place of two facts.

### What was named and deferred rather than taught

Compression, pruning and handoff are week 5's, beside what the system remembers between
sessions. Context infiltration is week 4's — it is indirect prompt injection, and the account
note at 01:06 is already that failure caught early. Both boundaries are stated on the page, so
the room knows the concept exists and which week owns it.

## The architectural teardown

| Comment | Status | What changed |
|---|---|---|
| Not sure what artifact goes on screen; use exact artifact names | **Fixed, and it was referring to something that did not exist** | The page said "the whole architecture goes on screen" and **no such figure existed anywhere in the week.** There are now three named figures, and the teardown uses the third |
| Include a proper description for each teardown | Done | Each of the five questions now has a "what it is about" column naming the box in Figure 3 to look at. **The descriptions contain no answers** |
| List the solutions on the instructor page | Already done, now signposted | The full key — a good answer, the wrong answer worth taking seriously, and one push, for each of the five — was already there. **I** now says so explicitly and tells the instructor to read their five before the session rather than during it |

**The three figures**, so an instructor can call for one by name:

- **Figure 1**, 01:11 — how retrieval is measured.
- **Figure 2**, 01:50 — how model-based grading works.
- **Figure 3**, 04:12 — the dispute agent at the close of week 3.

Figure 3 shows what each of the three weeks added, with a double line across it: above it the
thing that serves customers, below it the thing that tells you whether it works. **THE GATE box
says "not built"**, which is honest — the room wrote one row at 02:56 and nothing enforces it —
and it is the thing to point at before question 4.

## The quiz

| # | Comment | Status | What changed |
|---|---|---|---|
| 9 | Revisit the quiz based on the above changes | Done | One item replaced, and one deliberate decision not to add another |

**Topic 4's first item was replaced.** It asked which two of the thirteen columns carry the
weight — recall of a list the lab already walks. It now asks the release-3 question, keyed to
"the absolute gate fails and the relative gate passes". **The distractor to spend time on is
"the gates contradict each other, so one is misconfigured"**, which is a good engineering
instinct and wrong here. **B** records the replacement and why; the old answer is still taught at
02:49 and still checked by the lab's 0/1/2 review.

**Topic 5's three were evaluated and kept.** Each tests the cliff, which is what the lab actually
produces.

**Positional sensitivity was deliberately not made a quiz item.** The lab does not demonstrate
it, and the page says so. Testing it would test reading rather than doing, which the teaching
standard rules out.

## Reported against the teaching standard

- **Outcomes verb-led and observable.** Unchanged, all five.
- **A prediction precedes every reveal, on a separate surface.** Held. The teardown's new
  descriptions were written to contain no answers, which was the risk in adding them.
- **Every failure case posed as a puzzle.** Held, and one gained a sharper one: 02:39's "is 75%
  good enough to ship?" now has real numbers behind it.
- **A "✅ You can now…" checkpoint closes each teaching block.** Unchanged, all five.
- **Activities show their own timing and name their participants.** Timing yes. The 02:56 lab now
  states its triage order too. **Naming real people is still not met**, unchanged across three
  rounds, because the only seat list is the production `learners` table.
- **The notes contract is satisfied, and no two artifacts share notes.** Held.
- **Numbers are concrete.** 75% at 15 of 20, 95% context precision, kappa 0.35, the three-release
  table at 96/93/92, 20 of 20 against ₹2,50,000, 40% for a needle two-thirds down a 64k context.
- **No placeholders, brackets, TODOs or leftover prompts.** Checked. The only `TBD` on the page is
  inside the 0/1/2 rubric as an example of a score-0 cell, which is deliberate.
- **Layout.** Every table wrapped, every terminal block scrolls internally, no page-level
  horizontal overflow at 375px.

## Still not fixed, and not fixable here

**The labs do not run for a learner.** Unchanged for a third round. The eight `w3-` targets,
their data, and `cohens_kappa()` are uncommitted in `~/learningthelivingcraft/reference-agent`.
Fifteen paths, one commit, one push — the command is in RESUME. Nothing in this round touched
that repo.
