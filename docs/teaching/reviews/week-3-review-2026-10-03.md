# Week 3 review, 3 October 2026: what changed for each comment

*Instructor material. Not learner-facing.*

Source: the "Notes Review" sheet, the ten rows marked **Week3**. Each row below says what
changed and where. **L** is the learner page, **I** the instructor page, **N** the notes
file at [`../notes/week-3-evidence.md`](../notes/week-3-evidence.md), and **S** the session
file. Times are session offsets.

Status: **Done**, **Done differently** (the reason is given), or **Not done** (the reason
is given).

**Nothing moved on the clock.** All 46 rows of `ROWS_W3` are unchanged, no beat was added
or renamed, and every addition sits inside a beat that already existed. That was a
constraint, not luck: a new beat means a new clock row, and the clock is shared with the
quiz bank, the notes file and the session file.

## Evidence (the title block)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1a | Change the title to the actual title name | Done | The week is **LLM Evaluation**, not Evidence. "Evidence" named the argument rather than the subject, so nobody looking for the week's topic would find it. L, I, S and N. The notes file keeps its `week-3-evidence.md` filename, because renaming it breaks every link into it for no reader's benefit |
| 1b | Blocks and sections: use industry-wide terminology | Done | The five topic labels were already the industry names. The opening now prints them as a table with the industry name and the question each topic answers, and the capability table carries the industry term in brackets on every row. The 46 clock rows were checked one by one and already read "What retrieval-augmented generation is", "What model-based grading is", "What context engineering is" |

## What this topic is for (topic 1)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Rephrase the opening question in simpler terms | Done | Was "What does a passing test prove about a system that answers differently every time?" Now: **"Your tests pass. The agent answers differently each run. What have the tests proved?"** Three short sentences, 14 words, front-loaded |
| 2 | Rewrite this entire section | Done | Rebuilt under four headings: what an eval is, why the ordinary idea of a test breaks here, what this topic is not, what is left unfixed. The new middle section is the one that was missing: a unit test assumes same input, same output, and an agent removes that assumption. Both consequences follow from it |

## Last week the fix passed… (00:15)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | What is this section about? | Done | A "What this part is about" heading opens it: you are about to watch a suite pass while the bug is live, and the point is that a passing suite and a working system are two different claims |
| 2 | Rephrase, and give headings | Done | Five headings now: what this part is about, what you are looking at, what went wrong, why no case in the suite could have caught it, the one control that would have prevented it. L and I |
| 3 | Explain what went wrong | Done | Written out rather than implied. The paid-ticket set lives in memory inside one process; a second process starts empty and pays again. Every case runs one process, the bug needs two, so no case could produce the condition. It also now says what the control is **not**: not a better fix, not a review, not a stricter type |

## Entire section (the clock)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Every clock mention should be a placeholder that updates from a start time | Done | `week.wallClock = true`. A **Session start** field sits in the clock bar; enter 09:00 and 03:18 reads 12:18 everywhere, including inside the topic summaries. The value is kept in the page address and never in browser storage, the rule the Ask widget already follows |

**Tested in a real browser, not reasoned about.** Both pages were rendered headless with a
start time of 09:00 local and the resulting DOM read back:

| Page | Offsets rewritten | Mismatches |
|---|---|---|
| Week 3 learner | 165 | 0 |
| Week 3 instructor | 242 | 0 |
| Week 2 learner | 229 | 0 |
| Week 2 instructor | 370 | 0 |

00:00 renders 09:00, 00:15 renders 09:15, 03:18 renders 12:18 and 04:55 renders 13:55.
`data-off` is preserved on every span, which is what keeps the live "now" marker tracking
the right row after the rewrite. The contents card's 33 links were checked against the
page's ids: none points at nothing.

**Week 1 was checked for the regression this could have caused.** Rendered with the same
query string it has no field, rewrites no offsets, and still shows the `?start=` hint rather
than telling a reader to use a control that is not there.

Week 2 built this on 1 October inside `week-2.mjs`, with a comment saying to move it into
`_design.mjs` when a second week wanted it. **Week 3 wanted it, so that move is part of
this change.** The field, its styles and the contents-card styles now live in
`_design.mjs` and both weeks read one copy. Week 2's two pages are behaviour-identical
across the move; week 1 gains ten inert CSS rules and a script that does nothing on a page
with no wrapped offsets. The off-state hint is chosen by whether the page actually has the
field, so week 1 does not tell a reader to use a control it does not have.

## What the agent can do now

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | "A case set in four classes" — what are the four classes? Explain simply | Done | A table sits directly under the capability table: ordinary, difficult, incomplete, adversarial, each with one line and one real example from this agent. The instructor page says **do not teach them at 00:03** — they are the 00:27 reveal, and answering early spends that prediction |
| 2 | Rephrase every capability in industry-recognised terminology | Done | All six rows rewritten with the industry term in brackets: test-case taxonomy, stochastic evaluation, retrieval-augmented generation, faithfulness or groundedness, human–model agreement, context engineering. The "At 00:00" and "At the close" cells were rewritten too, because four of them were too terse to read as a before and after. L, I and N |

## Five hours, five blocks… (the clock table)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Arrange into topics and blocks, with a table of contents | Done | A contents card headed "Contents: five blocks, five topics": the opening, then each topic with its segments and times, then the close. Every line is a link, and jumping into a segment opens the topic that holds it. L and I |
| 2 | Use the industry recognised terminology | Done | Covered by the title row above. The clock table's own heading stays "Five hours, five blocks and a full hour to close", because the page checker finds the clock by matching that phrase |

## LLM evaluation (the attached syllabus)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Cover the attached key concepts under LLM evals | **Done differently** | Covered in full, and **spread across the five topics rather than added as a sixth**. The reasoning is below |
| 2 | Start with the first topic, then the narrative. The point is not coming out. Rewrite | Done | The opening now leads with the subject and then tells the story. Order: what an eval is, how today starts, what went wrong, the five topics. See the note under *Why the order changed* |
| 3 | *(blank)* | — | No comment to act on |

### Why the syllabus was spread rather than added

The attached list names about forty concepts. A sixth topic does not fit: five topics at
39 minutes each, plus a 15-minute opening, a 15-minute break, two 5-minute pair
discussions and a 58-minute close, is already 05:00. The teaching standard says **cut, do
not compress** — never shrink the practice to make room.

So every concept went to the topic that already owns the decision it affects. That also
means each one arrives where a learner can act on it rather than in a vocabulary list.

| Where | What arrived |
|---|---|
| 00:21, topic 1 | The four kinds of grader — rule-based, statistical text metrics, model-based, human — with cost and whether today uses each. Reference-based against reference-free |
| 00:27, topic 1 | The three evaluation levels: step, trajectory, end state, with an example of each on this agent, and why today sits at end state |
| 01:11, topic 2 | The RAG triad: faithfulness or groundedness, answer relevancy, context precision and recall, each mapped to the retrieval step it judges |
| 01:50, topic 3 | Why BLEU, ROUGE, BERTScore and Levenshtein fail on agent output, with two worked examples. Direct scoring, pairwise comparison, G-Eval. Rubric design |
| 01:55, topic 3 | The 80% agreement target, Cohen's kappa with a worked example, and the three judge biases: position, verbosity, self-enhancement |
| 02:44, topic 4 | Offline against online evals, as a five-row comparison. Where cases come from — golden set, production log mining, synthetic, adversarial — and the two ways a set rots, contamination and drift |
| 03:10, topic 4 | Two more named slots: four tools that run the set before release, four that watch it afterwards, each with what it costs |

**Two places where the syllabus landed on something the day already does**, which is why
those are the strongest additions:

- The 02:02 lab already prints **7 of 10 agreement**. The syllabus asks for the agreement
  target, which is above 80%. So the room's own grader is now visibly below the bar, and
  the number means something instead of being a fact about a different system.
- The syllabus asks for self-enhancement bias. **04:40 is a model swap.** So the bias has
  a consequence inside this session: a judge from the same family as one of the two models
  makes the comparison worthless.

**What was deliberately left to the week that owns it.** Retrieval quality — embeddings,
recall@k, re-ranking — stays in week 5, and the instructor page says so in those words.
Prompt-injection and jailbreak evaluation stays with week 2's attack round and week 4's
collection of it. Both are named at 02:44 as sources of cases, without being taught.

**Topic 5 received nothing new.** Its syllabus overlap is context precision and recall,
which is taught at 01:11 where the retrieval steps are. Adding it twice would be the
duplication the notes contract forbids.

### Why the order changed in the opening

The old opening led with 02:55 last week. The room met an anecdote before it had a word
for what the anecdote was an instance of, and a senior room will listen to a story and then
ask what it is an example of. The subject now comes first and the story lands as evidence
for it. N records this under *00:00*.

## What an evaluation harness is (00:21)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | "Nothing here adds up to a score out of ten…" makes no sense. Communicate the point simply | Done | Replaced with the arithmetic. Seven cases pass on all twenty runs, one passes on ten of twenty: 150 of 160, which is **94%**, and it reads healthy. The one failing half the time pays ₹2,50,000 when it fails. **"Arithmetically correct and operationally useless"**, because nothing in it tells anybody which case to look at. Then the rule: act on the per-case number, use the overall figure only for a trend across releases |

## Four classes of case (00:27)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Nobody will be able to write the four classes | **Done differently** | The prediction no longer asks anybody to. It used to ask the room to name every kind of case in their own suite, which is asking for the reveal. It now asks about **the last bug that reached production**: was there a test for it, and what would that test have had to *do* that none of theirs did? Everybody can answer that, and nearly everybody answers with a condition — two processes, an empty field, a user who lied. That condition *is* the answer, and the four classes are the four conditions a suite can be built to produce |
| 2 | Fix this so they can understand what the classes are | Done | Two additions. **How to tell which class a case is in**: four yes-or-no questions, asked in order, first yes wins, so nobody has to recall a taxonomy. And the order is load-bearing — an attack that also sits over the ceiling is adversarial, not difficult, because the response needed is to refuse rather than escalate. The classes also now appear in the opening's capability table with an example each, so their first mention is no longer a forward reference |

The prediction is kept rather than removed because the teaching standard requires one
before every reveal. **What changed is its difficulty, not its existence.**

## Lab: write the case (00:36)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Give the agent's current functionality, and what most needs covering | Done | Two new cards before the starting state. **What the agent does today**: reads the ticket, reads the account record, applies the one ceiling in `data/policy.json`, then credits, refuses or escalates while writing a trace line — plus the three controls week 2 added. The instructor page says not to read it out; it exists to be consulted, because in week 2's lab two pairs wrote cases against behaviour the agent does not have. And **which parts most need a case, and why**: a five-row priority table with the class each would be in, ending in the rule that stops thirteen minutes going into a second ordinary case — take the row matching the class you are missing |

## Found while making these changes, and fixed

**Three of week 3's verbatim cross-week quotes had gone stale.** Week 2 was rebuilt on
1 October, and three sentences week 3 quotes as week 2's own words were no longer in
week 2:

| Quote | What was wrong | Fixed to |
|---|---|---|
| Week 2's opening | Week 2 now says "before **the adversary round at** 03:31" | The full current sentence |
| Week 2's fifth outcome | A trailing full stop inside the quotation marks that the source does not have | The outcome exactly as the session file holds it |
| Week 2's mechanism rule, "line four" | It is two cells of a table row, not a sentence, so quoting it as one sentence was a sentence week 2 never contains | Reworded to say the row asked one thing and answered the other |

This is the second time this has happened, and it fails silently: the page renders, every
check passes, and an instructor reads a sentence to the room that the earlier week does not
contain. **A naive grep gives a false all-clear**, because a quote wrapped across two
`> ` lines returns zero matches and zero reads as clean.

A checker now exists and all eight of week 3's quoted fragments pass it. It flattens
whitespace and blockquote markers, strips tags, and normalises curly quotes before
comparing. **It is in the session scratchpad, not in the repository**, because adding it as
a repo script is recorded in RESUME as Sunil's decision and he has not made it. Run it
before shipping any week that quotes an earlier one.

## Reported against the teaching standard

Everything in `CLAUDE.md`'s *Report before you finish* list, checked against the pages as
they now stand.

- **Outcomes are verb-led and observable.** Unchanged, all five.
- **A prediction precedes every reveal, on a separate surface.** Held. The 00:27 prediction
  was made easier, not removed, and every reveal is still behind a *Show* button.
- **Every failure case is posed as a puzzle.** Held. 00:15 keeps both standing questions in
  writing before anything is revealed, and 02:44 gains one — which of offline and online
  evals would have caught the double payment, where the answer is neither.
- **A "✅ You can now…" checkpoint closes each teaching block.** Unchanged, all five.
- **Activities show their own timing and name their participants.** Timing yes. **Naming
  real people is still not met**, and this is unchanged from 30 September: pairs are
  numbered because the only seat list is the production `learners` table, which a committed
  page may not quote.
- **The notes contract is satisfied, and no two artifacts share notes.** Held. The new
  material is written once; the learner page carries the tables, the instructor page carries
  what to say about them, and the notes file carries why.
- **Numbers are concrete.** 94% from 150 of 160, 7 of 10, the 80% target, kappa 0 on eight
  passes in ten, ₹2,50,000, ₹10,800, 100 characters a clause.
- **No placeholders, brackets, TODOs or leftover prompts.** Checked, including image alt
  text.

**Still true and still outside this change: the labs do not run for a learner.** The eight
`w3-` make targets and their data are uncommitted in
`~/learningthelivingcraft/reference-agent`, so every command these pages name fails for all
eight participants. That needs one commit of fifteen paths and a push, which is recorded in
RESUME.

**The week stays `status: draft`.** Releasing it is Sunil's action in the console.
