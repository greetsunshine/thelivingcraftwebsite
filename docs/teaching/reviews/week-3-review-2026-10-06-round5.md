# Week 3 review, round 5, 6 October 2026: the last five rows

*Instructor material. Not learner-facing.*

Source: the "Notes Review" sheet, rows 52 onwards. **Row 52 — *Why the curve falls off a cliff* —
was answered in [round 4](week-3-review-2026-10-06-round4.md)** and verified as covered before
starting; its eleven items are all on the page. The five rows after it are new, carrying **eleven
items**, all on context engineering and the close.

Rounds [one](week-3-review-2026-10-03.md), [two](week-3-review-2026-10-05.md),
[three](week-3-review-2026-10-06.md) and [four](week-3-review-2026-10-06-round4.md) cover the rest.

**L** learner page, **I** instructor page, **N** [notes](../notes/week-3-evidence.md),
**S** session file, **B** [question bank](../quiz/week-3.md).

**The clock did not move.** 46 rows, fifth round.

## Context engineering · the lab (4 items)

| # | Comment | Status | What changed |
|---|---|---|---|
| 1 | Needs detailed instructions on what needs to be done | Done | A card saying what is produced in one sentence — **two pairs of adjacent numbers** — then the file and the line (`src/w3_trim.py`, line 33), the budget list itself, and how long a run takes |
| 2 | Learners should be able to follow the instructions and do the work | Done | Three numbered build steps with the exact `BUDGETS` list to paste, the command, and a fallback (`--runs 10` for narrowing, 20 to confirm) |
| 3 | Give details on how to assess whether their lab work is accurate | Done | **A four-row check table, two rows of which have definite answers**, plus the answer key behind a *Show* with the instruction not to open it before running |
| 4 | Can we have hands-on writing a few test cases? Evaluate whether the quiz needs rewriting | Done | A second build half: **two cases that fail on context alone.** And the quiz was reviewed — item 1 needed real work, below |

### The answer key, and how it was produced

The lab previously asked learners to narrow the edge and gave them **no way to know whether they
had found it**. It now has two, and both came from running the experiment rather than reasoning
about it:

| | between | what changes across it |
|---|---|---|
| The first edge | **165 and 160** | the gap narrows from 3 to 2, the rate slips 100% to 95%. Gradual |
| The cliff | **115 and 110** | the gap column stops naming GOOD-2.1 at all. 55% to 0%, nothing between |

So **"is the fall gradual or sudden?" has the answer "both"** — which is the whole shape of the
curve in one word, and is now the question to ask whoever finishes first.

### The two new cases, and why the second one is the interesting one

Everything in the suite so far tests at full context. **A case that only fails when the context is
trimmed is a kind nobody writes.**

- **The starvation case** asserts the governing clause and runs below the cliff. Fails there,
  passes at full context. If it fails at both, it is a broken case, and the page says so.
- **The margin case** asserts the *gap* rather than the answer, so **it fails before the money is
  wrong.** It needs the `gap` field from the 01:23 lab, which is the second reason to have added it.

## Context engineering · at enterprise scale (4 items)

| # | Comment | Status | What changed |
|---|---|---|---|
| 1 | Explain when prompt caching is to be used | Done | Three conditions, each with its opposite. And the design consequence, below |
| 2 | Patterns and tools used across enterprises to track context growth and effectiveness | Done | **Four patterns**, and a new slot of four observability products with their costs |
| 3 | Name the tools and tech stack against compression, pruning and handoff | Done | A fourth column on that table, and a new slot naming the same products with what each costs |
| 4 | Review the whole-of-context-evaluation card and update relevant rows | Done | **Five rows became seven** |

### On caching, the part that transfers

The conditions are: the front of the payload byte-identical, the stable part large, the prefix read
many times inside the cache's lifetime — which is minutes, not days.

**The design consequence is the eviction rule arriving again.** Caching rewards stable-at-the-front
and variable-at-the-back, which is also where attention is strongest for rules that must be obeyed.
**For once the cost optimisation and the correctness optimisation point the same way.**

There is a worked instance on the page from this site's own visitor agent: putting the page and the
region inside the cached prefix produced twelve variants, each paying the write premium to be read
about once. It is marked for use only if somebody asks for a real example.

### On tracking, the line that matters

Four patterns: a token budget per request type, alerting on prefix growth rather than total cost,
token attribution per step, and **a context budget written as a gate row.**

**Only the fourth is evaluation.** The first three tell you the context changed. The fourth tells
you whether the change was safe, and it is the only one that can stop a release — which is the
sentence that joins this topic to the rest of the day.

### The tools named, with costs and no recommendation

Three slots now, not one. Watching: Langfuse, Arize Phoenix, LangSmith, OpenTelemetry's GenAI
conventions. Shrinking: LLMLingua, LangChain's `trim_messages` with LangGraph checkpointers,
LlamaIndex summarising buffers, Zep or Mem0, and LangGraph, the OpenAI Agents SDK, CrewAI or
AutoGen for handoff.

**The pattern worth naming across the second and third slots:** almost everything is open source,
and what you pay for is the hosting, the stored history, or somebody else maintaining the metrics.
**Nothing in any list writes your evaluation set for you.**

### The card, five rows to seven

Added: **the margin** (row 3) and **whether shrinking lost anything** (row 5).

The margin is the row most teams do not have, because no tool sells it — and it is the thing that
actually moved on the 03:23 curve. The split to leave the room with: **rows 1, 2, 4 and 5 have
tools; rows 3, 6 and 7 are cases you write.** Useful the next time somebody proposes buying a
context-evaluation platform.

## Context engineering · topic quiz (1 item)

| Comment | Status | What changed |
|---|---|---|
| Review the questions and make sure they evaluate relevant topics in a way learners can respond to | **Done, and it found a defect** | Item 1 carried a wrong figure and a wrong answer. Items 2 and 3 were evaluated and kept |

**Item 1 was wrong twice.** The stem said "cutting the policy text from 217 characters to 180" —
**217 is the mean clause length**, not the policy text — and the answer said the gap was "one or two
points", where the real gap at 180 is **3**.

It also did two jobs in one question, which the standard says to split. The stem now asks one
thing — *why did capping at 180 improve it?* — in fifteen words, and **the second half is a spoken
follow-up** recorded on the instructor page. The same item appears twice in **B**, as Q9 and Q51;
both corrected with a note.

**Items 2 and 3 were kept.** Item 2 was corrected in round 4 and is accurate. Item 3 is the
required cross-week item and its quote is verbatim.

## The architectural teardown · the ADR (1 new item)

| Comment | Status | What changed |
|---|---|---|
| Create an architecture decision record recording the key takeaways from the session, which the learners fill in | Done | **The week's assignment is now the decision record**, with the gate-table row as its design section |

**This is the change with the widest reach in this round**, so it is worth stating plainly.

The assignment was *"one row of the gate table for the requirement in your own system that nothing
currently tests"*. It is now *"an architecture decision record for one evaluation decision in your
own system. The gate-table row you wrote at 02:56 is its design section."*

**Why that way round.** The seven ADR sections already exist and are fixed — they must not vary by
week, so week 6 can be read against week 3. What varies is the brief. So the brief names the ADR,
and the teardown carries a **section-by-section guide mapping each of the seven onto today**:
Context is the case that passes while something is broken; Goals must be testable; The design is
the gate row; What can go wrong uses the four classes from 00:27; Alternatives has a real one from
today (*a model grader instead of an assertion*, and the reason it lost is the agreement figure you
would have had to produce first); Open questions accepts *"I could not find out who owns the pass
bar"* as complete.

**The gate row is still what they build in the room.** It became a section of a larger artefact
rather than the whole of it. **The after-work's standalone gate-row item was removed**, because it
had become a duplicate, and the ADR item absorbed its thirteen-column instruction.

**Five takeaways are printed at the close**, each tagged with the minute it came from, and the
instructor page says to read them out as the last thing before the quiz — it is the only moment in
the day when all five sit together.

## The end-of-week quiz (1 item)

| Comment | Status | What changed |
|---|---|---|
| Review and update the questions as per the updated content | Done | Two items strengthened rather than replaced. The reasoning is below |

All eight were read against the current content. Six needed nothing. Two were strengthened, and
neither was replaced, because replacing a sound item to showcase new material is churn:

- **Q8, the Thursday release** — overall up 76% to 78%, adversarial down 75% to 65%. That scenario
  is now exactly the absolute-against-relative distinction added in round 3, and the reveal says
  so: **the release passes one kind of gate and fails the other**, which is 02:49 arriving on a
  Thursday.
- **Q7, seven out of ten** — gained the kappa follow-up, since kappa is now taught properly at
  01:55: *what is the kappa?* 0.35 against a bar of 0.60. **A room that gives the rate without the
  kappa has answered half of it.**

Both changes are mirrored in **B**.

## What was verified rather than asserted

Given that four of the last five rounds shipped a claim I had not run, everything numeric here was
produced by running something:

- **The two lab edges** — 165/160 and 115/110 — came from running the harness at fourteen budgets,
  twenty runs each, through the real `evaluate()`.
- **The gap transitions across those edges** (3 to 2, and GOOD-2.1 leaving the list) came from
  `search_policy` at each budget.
- **The clause lengths** (223 and 235, range 151 to 286) and **the mean of 217** came from
  `policy-docs.json` and `w3_trim.py`'s own `avg` line.
- **Every tool named** in the three slots was checked to be a real product doing the thing claimed.

## Reported against the teaching standard

- **Outcomes verb-led and observable.** Unchanged.
- **A prediction precedes every reveal, on a separate surface.** Held. The 03:40 answer key is
  behind a *Show* with an explicit instruction not to open it before running.
- **Every failure case posed as a puzzle.** Held.
- **A "✅ You can now…" checkpoint closes each teaching block.** Unchanged.
- **Activities show their own timing and name their participants.** Timing yes, and the 03:40 lab
  now states its own fallback. **Naming real people still not met**, fifth round.
- **The notes contract is satisfied, and no two artifacts share notes.** Held.
- **Numbers are concrete and verified.** See above.
- **No placeholders or stray markdown.** Checked.

## Still not fixed

**The labs do not run for a learner**, fifth round. Fifteen paths in
`~/learningthelivingcraft/reference-agent`, one commit, one push.

**And this round deepens the dependency.** The 03:40 lab now instructs learners to edit
`src/w3_trim.py` line 33 and gives an answer key produced by running it. None of that file exists
for them.
