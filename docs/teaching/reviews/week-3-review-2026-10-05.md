# Week 3 review, round 2, 5 October 2026: what changed for each comment

*Instructor material. Not learner-facing.*

Source: the "Notes Review" sheet, modified 5 October. It gained a **Topic** column and
**seventeen new Week 3 rows** — eight on RAG, eight on model-based grading, one on release
gates. Round 1's ten rows are answered separately in
[`week-3-review-2026-10-03.md`](week-3-review-2026-10-03.md).

**L** is the learner page, **I** the instructor page, **N** the
[notes file](../notes/week-3-evidence.md), **S** the session file, **B** the
[question bank](../quiz/week-3.md), and **RA** the reference agent at
`~/learningthelivingcraft/reference-agent`. Times are session offsets.

**The clock did not move.** All 46 rows of `ROWS_W3` unchanged, no beat added or renamed. Every
addition sits inside a beat that already existed.

**Five rows had no comment to act on**: `Release gates / What this topic is for?` carries a
heading with an empty comment cell, and four further `Release gates` rows are blank.

## Topic 2 · RAG

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| R1 | Say explicitly that this topic is about using RAG to make LLM evaluation better, with a one-line example | Done | A new opening section in the purpose card: **retrieval gives you a second thing to check, and it is sharper than the first.** Before today a case could only ask whether the amount was right; now it can ask which clause was acted on. The example is ticket 8002 as a block: ₹2,000 paid and right, acted on GOOD-2.1, a second clause one point behind that names no figure and would have paid ₹2,50,000. L and I |
| R2 | The 01:06 narrative is not clear about what it is | Done | Two new headings. **What this part is about**: the rule used to be a number in a field so finding it could not go wrong; it is now seven clauses of prose, so searching is a new step nothing is watching. **What you are looking at**: the three new trace lines annotated one by one. L and I |
| R3.1 | An architecture diagram of RAG as it applies to LLM evals | Done | A monospace box diagram at 01:11: the three steps down the left, what can be measured beside each, and the evaluation set at the bottom asserting two things instead of one. Not an image — it is in the page's existing terminal-block style, so it needs no asset and it prints |
| R3.2 | A better explanation of why the search is lexical rather than embeddings | Done | Both words defined first, then three reasons in order: seven clauses is not a retrieval problem; an embedding gives 0.83 against 0.81 with no account of itself; **and the same lexical query scores identically on eight laptops with no model call and no key.** Only the third is about teaching, and the page says so |
| R3.3 | Is there no evaluation for the first step, turning the request into a query? | Done | There is, and it is now named: **query rewriting**, or decontextualization across turns, measured by whether the rewritten query retrieves the right passage. The page says why today skips it, and the reason is honest rather than tidy: this agent's query is the ticket plus the account note glued together and nobody chose that, so there is no design to measure. Topic 5 makes it a decision; week 4 owns the half a customer wrote |
| R3.4 | "Today you build a third one" needs explaining and rewriting | Done | Rewritten. **"Of those three, you build context precision, and you build it at 01:23"**, then what that means concretely: the grader compares the clause acted on with the clause the case says governs, and on a corpus of seven that *is* context precision. Plus why the other two are not built today — both are judgements about prose, so both need a model, which is topic 3 |
| R4 | Explain the 01:16 section better, give it more context | Done | Reframed as **diagnosis**, with an on-call page as the opening: the alert says the agent paid the wrong amount, and that now has two answers in two parts of the system with two different owners. The reveal shows both failures as traces against ticket 8002 with the owner of each fix named, and lands the fact that makes the argument: **₹2,50,000 is paid in both, from two different faults** |
| R5 | Evaluate whether to add the retrieval-metrics content | **Done differently** | Added, and placed in the 01:37 enterprise slot rather than taught, because R7 asks for exactly that slot. Five IR metrics with typical targets, three referenceless metrics with the tools that implement them, and the diagnostic table. The reasoning is below |
| R6 | Build the lab out: the details needed, a clear metric, and something that adds to the agent's core functionality | Done | Three changes, and the third is the substantial one. The reasoning is below |
| R7 | How grading happens at enterprises, which metrics, and typical values | Done | See R5. Each metric carries a typical target and what a bad score sends you to fix |
| R8 | Review the topic quiz | **Done differently** | Evaluated and **kept all three**, with reasons below. One sentence added to the first item |

### R5 and R7: why the metrics went to the enterprise slot

The list names eleven measures plus a diagnostic matrix. Topic 2 is 37 minutes and already has
a narrative, a concept, a design beat, a 14-minute lab and a quiz.

Teaching eleven metrics would mean cutting the lab, which the teaching standard forbids. But the
list is genuinely valuable for this room, and R7 asks for precisely it. So the 01:37 slot — three
minutes, already a reference table the instructor points at rather than walks — now carries:

- **Five offline metrics** with typical targets: recall@k (0.90+ at k=10), precision@k (0.7–0.8),
  MRR (0.8+), NDCG@k (0.85+), hit rate (0.95+ as a floor). Each with what a bad score sends you to.
- **Three referenceless metrics** for live traffic: context relevancy, synthetic context recall,
  chunk utilisation (below 30% means k is too high). Named with Ragas, DeepEval and Arize Phoenix.
- **The diagnostic table**, four rows mapping what you see to the usual cause to the thing you
  change.

**Two guards on the numbers.** The page says to treat the targets as the shape of the number and
not as your number, because a senior room will otherwise take 0.90 recall home as a target it has
not earned. And the referenceless metrics carry a sentence tying them to topic 3: they have the
judge's own error rate, so one with no agreement figure beside it is an opinion with a decimal
point.

**What was deliberately not added.** Every lever in the diagnostic table's right-hand column —
hybrid search, re-rankers, rank fusion, chunk headers, fine-tuned embeddings — is week 5's
subject. The page says so in that column's closing line, so the table names the lever without
teaching the method.

### R6: what changed in the lab, and the one design decision

**R6.1, the details needed.** A new card prints all three shapes the learner works with: a case
with its `expect` block, a clause record from `data/policy-docs.json`, and a result from
`_record`. Its last line is the one that matters: **the margin is inside the `why` string and not
a field**, which is what the next build step fixes.

**R6.2, a clear metric.** Two graders produce two rates, and the page shows them side by side:
`outcome 20/20 100%` against `retrieval 19/20 95%`. It then names the second one — **that is
context precision**, the same metric as 01:37, computed on a set of seven. Rooms do not make that
connection on their own.

**R6.3, something deployable.** This was an instruction about design, not wording, and it needed a
real answer. The grader built in this lab **cannot run in production**, because it needs the
governing clause and nothing at request time knows it.

**The retrieval margin can.** It needs no answer key. So the lab now also:

- returns the gap as a number from `_pick`, threads it through `_record`, and adds it to the result;
- escalates instead of paying when the margin is under two, wired where week 2 put the approval gate.

That is week 2's control on a new signal, and it is the piece that survives the session. The page
is explicit that the agent is not deciding it was wrong — it is declining to act alone on a
decision it nearly got the other way.

**The honest cost, stated on both pages.** Nine minutes covers the grader comfortably and the
guard only just. The instructor page says to decide at 01:30 which is being done, and **not to let
anybody half-build it**, because a half-wired guard makes `make w3-wobble` print numbers nobody can
interpret. The guard is also now item 3 of the week's after-work in **S**, so the promise that the
session file carries it is true.

The third check question is new and is the point: **how many honest customers did the guard just
escalate?** `MIN_MARGIN = 2` catches the ₹2,50,000 case and also escalates a correct ₹1,200 credit.
There is no setting that does neither, which is the sentence for 03:16.

### R8: the three quiz items were kept, and why

Each tests a distinct judgement, so none was replaced:

1. **What the one-point gap decides.** Still correct, still the sharpest item in the topic.
2. **Where the grader reads the clause id from.** Tests provenance — a clause id from the model's
   prose is a claim, from the retrieval step it is a fact — and the wrong answer worth taking up
   (the grader that asserts the top-scoring clause) is the case-that-cannot-fail defect one level up.
3. **Which two of week 1's four harness parts a retrieved clause touches.** The required cross-week
   item, and its quote is verbatim.

**One sentence was added to item 1's reveal**, because the lab's new centre was untested: the gap is
also the only part of this usable in production, which is why it became the guard, and the rate it
moves is called context precision.

## Topic 3 · Model-based grading

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| M1.1 | A better explanation of what model-based grading is, and what "the data is not in a state" means | Done | The judge and the rubric are named as terms. Then a new section works "not in a state" on a real requirement: does the refusal tell the customer what happens next? The ledger has no row for a refusal, the clause id is true and useless, and the property exists only in the sentence. **That is what "not in a state" means.** Then the only three options: a keyword rule, a person, or a model against a rubric |
| M1.2 | Explain the difference between LLM-as-a-judge and a second agent with its own loop reviewing the first | Done | A five-row table on when each runs, what it is given, what it can do, what it costs, and what happens when it is wrong. **A judge measures, a reviewing agent decides.** And the consequence: the moment a judge can change what the customer gets, it is a control and needs everything week 2 demanded of one |
| M2 | Explain 01:45 better — for example, how did this act on the second bill? | Done | Both clause texts now printed side by side, then the walk-through. Under BILL-3.1 the credit is ₹1,200 because that is what was double-billed; under BILL-3.2 it is ₹1,200 because one month of Pro *is* ₹1,200. **Two different rules, the same figure, by coincidence.** Then where the coincidence breaks, as a worked block: after a Pro-to-Team upgrade the duplicate is ₹1,200 and the ceiling is ₹4,000 |
| M3 | Strengthen the strong section with a diagram showing how model-based grading works | Done | A monospace diagram at 01:50: the recorded run and the rubric going in, the judge in the middle, a score and a reason coming out — and **the validation loop as a dotted path at the bottom**, ending in "agreement: 7 of 10". The page's instruction is to read it once and then look only at the dotted line, because everything above it is what every team builds |
| M4.1 | The grader needs clear instructions to set up and run | Done | See M5.1. The instructions are in the lab, where the running happens |
| M4.2 | The pattern and the point need better explanation | Done | Two new headings. The pattern: A3 and A4 are **one mistake twice**, not two mistakes — the wrong clause, stated well. The point: the retrieval grader from 01:23 catches both with no model call, so **the expensive grader missed what the cheap one already caught** |
| M4.3 | What does 70% agreement mean? | Done | The literal reading first: on 7 of 10 answers the grader said what you said. Not a mark, not accuracy, because nobody established that you were right either. Then the two-by-two the rate hides — 5 both-pass, 2 both-fail, 1 you-pass-it-fails, 2 you-fail-it-passes — and the note that the two off-diagonal cells are different costs |
| M4.4 | Explain Cohen's kappa | Done | Derived on the page in three steps, with this label set's real numbers: p_o = 0.70, chance agreement p_e = 0.54, **kappa = 0.16/0.46 = 0.35**. Plus how to read it (of the agreement available above chance, the grader got 35%), a five-row scale with 0.60 marked as the production bar, and Krippendorff's alpha named as the relative |
| M4.5 | The hands-on implementation needs to implement Cohen's kappa in the code | Done | **`cohens_kappa()` added to `src/w3_agree.py`** in RA, and `make w3-agree` now prints the chance-agreement line and the figure, flagged against the 0.60 bar. Verified by running it: raw 70%, chance 54%, kappa 0.35. All eight `w3-` targets still run. **See the caveat below** |
| M4.6 | Explain why the grader cannot see the failure | Done | A new section, and it is precise because the distinction is **information, not wording**: the grader is handed the answer and the rubric, and the governing clause is a fact about the *case*, which was never passed in. So no rubric fixes it. The instructor page gives the question to ask anybody who proposes a better prompt — *where in your prompt is the clause that governs this case?* |
| M4.7 | How do we ensure the model-based grader is not making mistakes? | Done | "You cannot know it. You can only bound it", then five ways in priority order: measure against people, anchor the rubric, make it reason before it scores, use a cross-family judge with position swapping, re-measure on a schedule. **Only the first is evidence; the other four are precautions.** Closing line: a judge with every precaution and no agreement figure is a well-dressed opinion |
| M5.1 | Clear instructions to set up and run the grader | Done | A new card: the two commands, the exact four summary lines to expect, and the three pieces in the file — `ANSWERS`, `grader()`, `cohens_kappa()`. Plus a check line: if there is no kappa line you are on an older checkout, so pull |
| M5.2 | A summary of when to use a model grader and when not to | Done | A five-row table, worked top to bottom, stopping at the first match: a stored value → an assertion; two stored values → a comparison; a required phrase → a rule, and expect it to be brittle; **a judgement about prose with nothing stored → a model grader with an agreement figure, and that is the only honest case**; whether the answer was *allowed* → never a model alone, which is week 2's rule |
| M5.3 | Use Cohen's kappa to assess the grading results | Done | Five lines of code in the lab, then the experiment that makes the point: replace the grader with one that passes everything. **Raw 60%, kappa 0.00**, against the real grader's 70% and 0.35. Ten points of raw rate against the whole of kappa. Both figures verified by running it |
| M6 | Evaluate whether the LLM-as-a-judge list is covered | **Done differently** | Audited item by item. Most was already covered; three real gaps were added. The audit is below |
| M7 | Update the quiz for the changes above | Done | Topic 3's second item replaced. It asked what 70% *is*; it now asks what 70% and 0.35 say together, keyed to "it agrees often, and most of the agreement is what chance would have given you anyway". **The distractor to spend time on is "0.35 means wrong 65% of the time"**, which is the common misreading. B records the replacement and why |
| M8 | Review the topic's closing line — which number is being referred to? | Done | The line now names both numbers explicitly and says where they came from: raw 70% and kappa 0.35, from `make w3-agree` over ten hand-labelled answers, against a production bar of 0.60. Then what each sentence means, and why neither is a mark. **A grader with no labels has no number, and a grader with no number is an opinion that returns a verdict** |

### M6: the audit, item by item

| Syllabus item | Verdict |
|---|---|
| Single-answer / absolute scoring | Already covered, 01:50 |
| Pairwise comparison | Already covered, 01:50 |
| G-Eval and token-probability scoring | Already covered, 01:50 |
| Reference-based vs referenceless | Already covered, 00:21 |
| Position, verbosity, self-preference bias | Already covered, 01:55 |
| **Granularity drift** | **Added**, 01:55, as a fourth bias with its fix: stop asking for 1-to-10, use pass/fail or three points |
| Unambiguous rubric construction | Already covered, 01:50, as the two rubrics |
| Anchor examples / few-shot calibration | **Added**, 01:55, as line 2 of the five ways |
| Reasoning-first prompts | **Added**, 01:55, as line 3 |
| **Structured output enforcement** | **Added**, 02:16, as one line — the score is extracted rather than parsed |
| Human gold-set, 200–500 traces | **Added**, 02:02, as the sample-size caveat |
| Cohen's kappa, Krippendorff's alpha, κ ≥ 0.60 | Covered thoroughly, 01:55 |
| **Reasoning alignment, not just label matching** | **Added**, 02:16, as one line |
| Quarterly drift monitoring | **Added**, 01:55, as line 5 of the five ways |
| **Two-tiered judge topology** | **Added**, 02:16, as a five-row table: calibration judge on the gold set with the strongest model, production judge on 5–20% of traffic with a small or distilled model. **The relationship is the point** — the cheap judge is only worth reading because the expensive one gave it a number |
| **Async pipeline vs in-line gate** | **Added**, 02:16, as a four-row table. Async is the default, and the bottom row is the 01:45 distinction arriving as an operations decision |

## Topic 4 · Release gates and AI governance

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| G1 | Check which of the release-gate topics need including | **Done differently** | Four of the five sections were added, each placed where it changes a decision. The selection is below |

### G1: what was added, and where

**The three-tier gate cascade → 02:44**, as a table with budgets. Under a minute on each push,
three to five minutes before merge, fifteen to thirty nightly, with the build rule for each. The
page's instruction is to **read the budget column and not the content column**: the tiers are
defined by what an engineer will tolerate waiting for and the checks were fitted to the time
afterwards, which is why **tier 1 holds no model calls at all.** It then places the room's own work
— the eight cases from 00:36 are a tier 2 set, twenty runs each from 00:55 is tier 3.

**Progressive deployment → 02:44**, as four steps: mirror the traffic, release to a slice
(1→5→25→100), tie the score to an automatic reversal, then harvest what went wrong back into the
golden set. **The harvest is the one marked as the takeaway**, because it is the only mechanism in
the whole day that improves the next suite without somebody inventing cases — and it answers 00:27,
since nobody invents an adversarial class, they get attacked and write it down.

**Absolute floors against relative deltas → 02:49**, and this is the strongest thing in the list. A
five-row table: a floor says this may never happen and its number comes from outside, a delta says
this may not get worse and its number comes from last week's measurement of the same thing. The
sentence that does the work: **"95% faithfulness" is unarguable in the wrong way, and "no worse than
last release" is arguable in the right way.** It also fixes that beat's own 92% puzzle — as a
relative gate it is a one-point regression somebody signs in a minute; as an absolute floor it asks
for an override of a rule nobody can source, which is how it ends up overridden on a call. The
asymmetry is stated last: ten releases each one point worse is ten points worse and every one
passed, so a relative gate needs a floor underneath it.

**Governance and auditability → 03:10.** NIST AI RMF as the vocabulary, ISO/IEC 42001 as the one
with an auditor at the door, the EU AI Act as the one that is law — with what each actually asks
for. Then the two practices that do the work: a bill of materials per release (prompt version,
model id and version, temperature, retriever commit, eval-set checksum), where **the model version
is the one that moves without you**; and keeping every run with the judge's reasons, because
**nobody keeps the reasons and the reasons are what answers "why did it pass in March".** Plus the
operational rule, because governance is defeated by cost rather than by argument: **put a token
budget on each build**, or the quota runs out, somebody switches the gate off, and it was theatre
from that moment. The amber zone closes it, as 02:49's decision owner with a trigger.

**What was not added.** Nothing from the list was dropped silently, but two things were deliberately
compressed to a line each rather than taught: structured output enforcement and reasoning
alignment, both at 02:16. Semantic caching is named only inside the token-budget sentence. They are
reference material for a reader, not segments.

## Found while making these changes, and fixed

**I introduced a factual contradiction and caught it before it shipped.** The first draft of R1's
example said the agent paid ₹2,000 "by citing the goodwill clause, which does not govern this case".
That is wrong: GOOD-2.1 *is* the governing clause for ticket 8002 and it is what caps the credit at
₹2,000. The accurate case was the one the 01:06 trace actually shows — a near miss, where a clause
naming no figure came within one point.

It also mattered for a second reason. The right-money-wrong-clause case is **01:45's reveal**, so
using it at 01:06 would have spent that prediction. The instructor page now carries an explicit
instruction to stop at the near miss, and says why.

**I verified every number rather than asserting it.** The kappa arithmetic, the lazy-grader contrast
and the start-time behaviour were each run and read back rather than reasoned about. The κ = 0.35 and
the raw-60%/κ-0.00 figures on the page are the output of the committed code.

## Reported against the teaching standard

- **Outcomes verb-led and observable.** Unchanged, all five.
- **A prediction precedes every reveal, on a separate surface.** Held, and **one was protected**:
  01:45's reveal is no longer pre-empted by the topic opener.
- **Every failure case posed as a puzzle.** Held. 02:44 keeps the "which of offline and online would
  have caught the double payment" question, where the answer is neither.
- **A "✅ You can now…" checkpoint closes each teaching block.** Unchanged, all five.
- **Activities show their own timing and name their participants.** Timing yes, and the 01:23 lab now
  states which half to drop. **Naming real people is still not met** — unchanged from both earlier
  passes, because the only seat list is the production `learners` table, which a committed page may
  not quote.
- **The notes contract is satisfied, and no two artifacts share notes.** Held. Tables and worked
  examples on the learner page, what to say about them on the instructor page, why in **N**.
- **Numbers are concrete.** κ 0.35 against a 0.60 bar, raw 60% at κ 0.00, p_e = 0.54, ₹1,200 against
  a ₹4,000 ceiling, 5–20% sampling, 50–100 and 200–500 case sets, recall 0.90 at k=10, chunk
  utilisation below 30%.
- **No placeholders, brackets, TODOs or leftover prompts.** Checked across both pages, including alt
  text. Zero.
- **Layout.** All 37 tables are wrapped so they scroll inside themselves, all 41 terminal blocks
  likewise, and a 375px render shows no page-level horizontal overflow.

## The one thing this change does not fix

**The labs still do not run for a learner, and this round made that worse.** `make w3-agree` now
prints Cohen's kappa — but the eight `w3-` targets, their data, and now `cohens_kappa()` are all
still uncommitted in RA. So the lab's new centre is a command that does not exist for the eight
people who need it.

**The commit is still fifteen paths**, not sixteen: `src/w3_agree.py` was already one of the ten
`src/w3_*.py` files in that list, so today's change to it needs no new path. The command is in
RESUME. Staging it has been blocked in three sessions running.
