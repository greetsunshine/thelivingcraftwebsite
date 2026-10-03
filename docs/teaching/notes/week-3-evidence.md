# Week 3 · LLM Evaluation — how to run it

*Not learner-facing. This is the source of truth for week 3. Both published pages are
built from `scripts/teaching-content/week-3.mjs`, and the argument behind every
segment is here.*

**The week's one sentence.** A pass is a claim about the cases you chose. It is not a
claim about your system.

**Sections run in clock order, and every heading starts with its offset.** The clock
is `ROWS_W3` in [`scripts/teaching-clock.mjs`](../../../scripts/teaching-clock.mjs)
and it is the only source of time. If a heading here disagrees with a row there, the
clock wins and this file is wrong.

**Terminology, and check any new paragraph for it.** Week 1 claims the bare word
*harness* for the agent harness: the loop, the tool layer, the per-turn context
assembly and the trace. So this week always writes **evaluation harness** in full.
Two different harnesses one week apart with the same name is a confusion the room
cannot recover from in the middle of a session.

**Numbers here are from real runs of the reference agent**, not estimates. Every
table can be reproduced with the `w3-` target named beside it. The rupee figures
inside the teaching case are invented and the case is invented, which is what the
teaching standard asks for.

## What changed on 30 September, and why

The week was rebuilt against `docs/teaching/generation-prompt.md`. Three changes
matter to anybody who read the old version.

**Five topics, not six.** Each topic now carries six parts: the narrative, the
concept, components and design, a hands-on lab, what firms at enterprise scale use,
and a three-question quiz. That is 39 minutes. The close takes 58 minutes, the
opening 15, the break 15 and the two pair discussions 10, which leaves 202 minutes.
Five topics fit and six do not.

**The old topics 1 and 2 merged into LLM evaluation (evals).** A case set and a run
count are not two ideas. Together they are what an evaluation harness is, and
teaching them apart was an accident of how the week grew rather than a decision.

**What was cut, said plainly.** The segment that pointed the evaluation harness at a
second model version is gone. It was the payoff of the old week and it is the right
thing to lose, because it was a demonstration rather than a capability: the room
watched two numbers and built nothing. The question it answered is still answerable,
and the Model Selection Tool in the reading is where a learner answers it for their
own system. **Say this out loud if anybody asks why the week got shorter.** The
adversary-style review round is also gone, replaced by the architectural teardown at
04:12, which the prompt requires.

## What changed on 3 October, and why

Sunil reviewed both published pages in the "Notes Review" sheet. Ten blocks of week 3
carry comments, and
[`docs/teaching/reviews/week-3-review-2026-10-03.md`](../reviews/week-3-review-2026-10-03.md)
says what changed for each one. Six changes are large enough to affect how the day is
run.

**The week is called LLM Evaluation, not Evidence.** "Evidence" named the argument and
not the subject, so nobody searching for the week's topic would find it. The five topic
labels were already the industry names, and the opening now prints them in a table with
the question each topic answers. This file keeps its old filename, because renaming it
would break every link into it for no reader's benefit.

**Every time on both pages is now a placeholder.** A Session start field sits in the
clock bar. Enter 09:00 and 03:18 reads 12:18 everywhere on the page, including inside
the topic summaries. The start time is kept in the page address and never in browser
storage, which is the rule the Ask widget already follows. Week 2 built this on
1 October with a note to move it into `_design.mjs` when a second week wanted it, so
**that move happened in this change** and both weeks now read one copy.

**The opening leads with the subject and then tells the story.** It used to open on
02:55 last week, which meant the room met an anecdote before it had a word for what the
anecdote was about. The order is now: what an eval is, how today starts, what went
wrong, then the five topics.

**What went wrong at 00:15 is written out rather than implied.** The old page said
"nothing went wrong inside the suite" and left the room to work out why. It now says
the paid-ticket set lives in memory inside one process, that a second process starts
empty, and that no single-process case could ever produce the condition. Three headings
carry it: what went wrong, why no case could have caught it, and the one control that
would have.

**The four classes are now classified rather than recalled.** Sunil's objection was
exact: nobody in the room can name four classes they have never been taught. The 00:27
prediction no longer asks them to. It asks about the last bug that reached production
and what a test for it would have had to do, which everybody can answer. The reveal
then gives four yes-or-no questions, asked in order, first yes wins.

**The syllabus Sunil attached is covered, and it is spread across the five topics
rather than added to one.** The list named about forty concepts. A full extra topic
does not fit in five hours, and the teaching standard says cut rather than compress. So
each concept went to the topic that already owns the decision it affects:

| Where it went | What arrived |
|---|---|
| 00:21, topic 1 | The four kinds of grader, with cost and whether today uses it. Reference-based against reference-free |
| 00:27, topic 1 | The three evaluation levels: step, trajectory, end state, and why today sits at end state |
| 01:11, topic 2 | The RAG triad: faithfulness, answer relevancy, context precision and recall, each mapped to a retrieval step |
| 01:50, topic 3 | Why BLEU, ROUGE, BERTScore and Levenshtein fail on agent output. Direct scoring, pairwise comparison and G-Eval. Rubric design |
| 01:55, topic 3 | The 80% agreement target, Cohen's kappa, and the three judge biases: position, verbosity, self-enhancement |
| 02:44, topic 4 | Offline against online evals. Where cases come from, and contamination and drift |
| 03:10, topic 4 | Two more named slots: tools that run the set, and tools that watch it after release |

**Nothing moved on the clock.** All 46 rows are unchanged, no beat was added or
renamed, and every addition sits inside a beat that already existed. That was a
constraint rather than a happy accident: a new beat means a new clock row, and the clock
is shared with the quiz bank, this file and the session file.

## What the agent can do now

The table the close produces, and the reason the recall segment at 04:02 exists. Every
row names the file that changed and the command that proves it.

**Each capability carries its industry name in brackets on both pages**, added on
3 October. The capability sentence says what the agent does; the bracket is the phrase a
learner needs in order to read anybody else's documentation about it.

| What the agent gains | At 00:00 | At the close | File | Proof |
|---|---|---|---|---|
| An evaluation set covering four classes of case *(test-case taxonomy)* | seven cases, all ordinary or difficult | eight cases across all four classes | `src/w3_cases.py` | `make w3-eval` lists the class beside each case |
| A pass rate over repeated runs, instead of one verdict *(stochastic evaluation)* | one run per case, pass or fail | twenty runs per case, a rate per case and per class | `src/w3_harness.py` | `make w3-wobble` prints 15/20 on the adversarial case |
| A rule retrieved from a document rather than read from a field *(retrieval-augmented generation)* | one number in `policy.json` | seven clauses of prose, retrieved and scored | `src/w3_docs.py` | `make w3-search` prints two clause scores one point apart |
| A grader on the retrieval, not just the answer *(faithfulness, or groundedness)* | nothing checks which clause was used | the clause the answer used is graded against the case | `src/w3_cases.py` | `make w3-grade` fails a run that paid the right rupees |
| A grader measured against a person *(human–model agreement)* | no grader, and no way to tell if one is any good | 7 of 10 against ten labels a person wrote | `src/w3_agree.py` | `make w3-agree` prints the agreement and the two misses |
| A measured context budget *(context engineering)* | the budget is untested and nobody knows the limit | the cliff located at 100 characters a clause | `src/w3_trim.py` | `make w3-trim` prints 0% adversarial at 100 |

**The first row names the four classes, so both pages print them underneath it**:
ordinary, difficult, incomplete, adversarial, each with one line and one example from
this agent. Sunil's comment was that a learner meeting "four classes" in the opening
table has no way to know what is meant, and he is right; the fix is a table rather than
a forward reference to 00:27.

**Do not teach the classes at 00:03.** They are the 00:27 reveal and the room writes its
own answer first. If somebody asks in the opening, say 00:27 and move on. The instructor
page says this in those words.

**If a row cannot be proven by running something, it does not belong in this table.**
That rule is why the second model version is not a row: nothing about the agent
changed when it ran.

## 00:00 · Opening: what today is for

Five minutes, in four moves, and the order changed on 3 October.

**Open on the word, not on the story.** Today is LLM evaluation, shortened to evals: a
fixed set of cases, run against the agent, scored by something other than somebody
reading the output. The fixed set is an evaluation set and the scorer is a grader. Both
words are used all day, so both are said here.

The old opening led with 02:55 last week. Sunil's comment was that the point of the
section was not coming out, and the cause was the order: the room met an anecdote before
it had a word for what the anecdote was an instance of. **A senior room will listen to a
story and then ask what it is an example of.** Give them the category first and the
story lands as evidence.

**Then how today starts.** At 02:55 last week the room made the same ticket pay once.
`make retry` agreed: one credit, ₹1,200. Then a second terminal paid Ravi again. Today
that moment is a suite of seven cases, and it passes at 100% with the bug still live.

**Then what went wrong, slowly.** Nothing went wrong inside the suite. Every case runs
one process, the bug needs two, so no case could have seen it. The suite answered the
question it was asked, and the question had one process in it.

**Then the five topics as a table**, with the industry name and the question each one
answers. Read the five questions out and answer none of them. Each is the opening
question of its own topic, and answering one here spends that topic's prediction.

**Say the terminology sentence in the first two minutes.** Evaluation harness, always
in full. If you shorten it once at 00:36 the room spends the next hour unsure which
one you mean.

**The Session start field is in the clock bar.** Enter the real start time once, at the
top of the session, and every offset on the page becomes a time of day. Do it before
00:05 or people will read 03:18 as a duration.

**Name what is absent and say which week owns it.** Making retrieval itself better is
week 5. Defending against the poisoned account note is week 4, and the adversarial
cases written today are what week 4 collects. A second agent reviewing the first is
week 5.

## 00:05 · The first self-rating

Five minutes, the five statements from the session file, read from the learner page
rather than paraphrased. The two sets of numbers only mean the same thing if the words
do.

**Expect high scores on 1 and 2, and say nothing about it.** Almost everyone believes
they have tests, and almost everyone believes a passing run is a result. Both meet a
keyboard today. A score that drops at 04:55 is the result you want, and announcing that
in advance spends it.

## 00:10 · One sealed prediction

Five minutes. Written, folded, opened at 04:50.

> Your team's evaluation suite passes on every run for three weeks. Write down the most
> likely reason, in one line.

### The answer key, which is not an answer

Most rooms write **"the tests are shallow"**. That is a conclusion, it is probably true,
and it names no action.

The answer the day argues for is a question: **how many times has any case in it ever
failed?** A suite that has never failed is not evidence about the system. It is evidence
that every case sits inside what the code already does.

### The expected wrong answer, and what is right about it

**"The system is working."** Two or three people write it, usually the ones who own a
mature service, and they are not being naive. A long run of passes on a well-tested
system genuinely is what working looks like.

What is wrong is that they cannot tell that state apart from the other one from inside
the suite. Both produce the same result. Ask what observation would separate them. There
is only one: a case that has failed, been fixed, and still sits in the set.

### Extension question

*Which of your cases would you delete if you had to lose half of them?* The instinct is
to keep the fast ones. The right answer is to keep the ones that have ever failed, and
almost nobody says it before 01:00.

---

# Topic 1 · LLM evaluation (evals) · 00:15 to 01:00

*What does a passing test prove about a system that answers differently every time?*

**The weak version** is "write more tests", which everybody here learned fifteen years
ago. Teach it that way and you lose them by 00:30.

**The stronger claim.** A suite is a list of situations somebody thought of, so the only
interesting question about any suite is which class of situation is missing. The
percentage is not the artefact. The list is.

**Left unfixed on purpose.** Retrieval is not graded yet, which topic 2 fixes at 01:23.
No threshold exists, which topic 4 fixes at 02:56.

## 00:15 · Last week the fix passed and proved nothing

Six minutes, whole room. Put the result table on screen and stop there. **Do not scroll
to the second half of the output**, because `make w3-falsepass` prints the reveal below it.

    C1  ordinary     One duplicate charge, credited in full            1/1  100%
    ...
    overall 7/7 = 100% · 7 cases × 1 run

Then both standing questions in writing: what went wrong, and which single control would
have prevented it.

### The answer key

    delivery 1 · process A · ledger: 1 credit, ₹1,200
    delivery 2 · process A · ledger: 1 credit, ₹1,200   <- the paid set remembers
    delivery 2 · process B · ledger: 2 credits, ₹2,400  <- a set that never heard of it

**What went wrong: nothing, inside the suite.** Every case runs one process, so no case
can see a fix that only holds inside one process. The paid set is held in memory and a
second process has its own copy.

**The control is one case, one field longer than the one beside it.** C8 differs from C2
by `processes: 2`.

**Then say it slowly.** The suite did not lie. It answered the question it was asked, and
the question had one process in it. Two minutes of silence after that is not wasted.

### The wrong answer worth spending time on

**"The test was badly written."** About a third of rooms, usually from the person who
writes the best tests.

*What is right.* C2 is a weaker case than it looks, and noticing that is the skill.

*What is wrong.* It frames the failure as carelessness, which makes it somebody else's
problem. Nobody was careless. The case matched the fix, the fix matched the case, and both
were written the same afternoon by the same person. That is the ordinary condition.

**Extension question.** How many of your own cases were written the same day as the code
they test? Ask for a number. "Most of them" is the answer and it is the finding.

## 00:21 · What an evaluation harness is

Six minutes. One sentence, then the worked example.

**An evaluation harness runs a fixed set of cases some number of times, applies a grader
to each run, and reports a rate rather than a verdict.**

Then the three numbers it prints, and they are not interchangeable.

| Number | What it is for |
|---|---|
| Per case | How often this case passed. The only number that tells you what to fix |
| By class | How often each class passed. A missing class shows as a blank, not a low number |
| Overall | A trend line, and nothing else, because it hides which case failed |

**There is no single score, and give the arithmetic rather than the principle.** The old
page asserted that an average hides the case that matters. Sunil asked for the point made
simply, so both pages now do the sum.

Seven cases pass on all twenty runs. One case passes on ten of twenty. That is 150
passes out of 160, which is 94%, and it reads like a healthy system. The case failing half
the time is the adversarial one, and when it fails it pays ₹2,50,000. **The 94% is
arithmetically correct and operationally useless**, because nothing in it tells anybody to
go and look at that case.

So the per-case number is the one you act on, and the overall figure is good for watching
a trend across releases. Same rule the console already holds for checkpoint answers.

**Then the four kinds of grader, added 3 October.** Something has to decide whether a run
passed, and there are four ways to do it. Name all four, say which one today uses, and do
not teach them.

| Kind | How it decides | Used today? |
|---|---|---|
| Rule-based | Exact match, a number comparison, a regular expression, a schema check | Yes, every case |
| Statistical text metrics | Overlap with a written reference answer: BLEU, ROUGE, BERTScore, Levenshtein | No, and 01:50 says why |
| Model-based, or LLM-as-a-judge | A second model reads the answer against a rubric | Topic 3, at 01:45 |
| Human | A person reads the answer and labels it | Topic 3, as the labels the grader is measured against |

**And two words from any eval tool.** *Reference-based* means the correct answer is
written down and the grader compares against it. *Reference-free* means there is no single
correct answer, so the grader scores a property instead. Today is reference-based on the
money and the clause, because both have exactly one right value, and 01:45 is where that
stops being enough.

If the room wants to argue about BLEU now, say 01:50 and move. The table is on their page
with the cost of each.

## 00:27 · Four classes of case, and what each one costs

Nine minutes, and **the prediction changed on 3 October.** It used to ask the room to
write down every kind of case in their own suite. Sunil's objection was that nobody can
name four classes they have never been taught, and that is right: the question asked for
the reveal.

**The question now asks about the last bug that reached production.** Was there a test for
it? Almost certainly not. So what would that test have had to *do* that none of their
tests did? Everybody can answer that, and nearly everybody answers with a condition rather
than a test: two processes, an empty field, a user who lied. That condition is the answer.
The four classes are the four conditions a suite can be built to produce.

Ninety seconds on paper, alone. Take two answers out loud and do not comment on either.

| Class | What it is | The failure it catches | What it costs you |
|---|---|---|---|
| **Ordinary** | The case the feature was built for | It never worked | Nothing. It writes itself from the specification |
| **Difficult** | A real case at an edge the feature still has to hold | It works until the input is large, small, or on a boundary | An hour of thinking about boundaries |
| **Incomplete** | The evidence needed to decide is not available | It invents a decision rather than handing over | You have to have been burnt, or be told by somebody who was |
| **Adversarial** | Somebody wrote the input on purpose | It obeys the attacker | The same, and it dates fast |

### The answer key

Rooms produce two or three of the four and almost never all four.

**Say why the last two are rare rather than treating it as a gap in the room.** Ordinary
and difficult cases can be written from a specification. The other two need you to have
been attacked already, and last week is when this room was attacked.

### The wrong answer worth spending time on

**"Happy path and error path."** Two classes doing the work of four, and the merge loses
exactly the two that matter. Incomplete evidence and a deliberately written input both
land in "error path", and they need opposite responses: one hands over, the other refuses.

Take it seriously, because most of the room arrived with it. Then split it with a question
rather than a correction: *what does your error path do when the evidence is merely absent
rather than wrong?*

**Extension question.** Which class needs you to have been attacked already? Adversarial.
That is why last week's bypasses are the pre-work.

### How to tell which class a case is in

Added 3 October, and it is the half of Sunil's comment that matters most. The room is
never asked to produce the taxonomy from memory. It is asked to classify a case with four
yes-or-no questions, in order, first yes wins.

1. **Did somebody write this input on purpose to get money out?** Adversarial.
2. **Is a fact the decision needs simply not available anywhere?** Incomplete.
3. **Is this a real request sitting on a limit or a boundary?** Difficult.
4. **None of those?** Ordinary.

**Read the order out, because the order is the content.** A hand-written attack that also
sits over the ceiling is adversarial, not difficult, and the reason is the response you
need: refuse rather than escalate. A room that classifies in the wrong order files its
attacks as edge cases and then builds an escalation path for them.

### The second design choice: what the case asserts about

A class says what situation the case creates. A level says what the case checks once it
runs. Three levels, and every case today sits at the third.

| Level | What it checks | On this agent |
|---|---|---|
| Step | One action: right tool, arguments of the right shape | Did it call the ledger-credit tool, and was the amount a number? |
| Trajectory | The path: a sensible route, no loops or needless calls | Did it read the account record before deciding, or after? |
| End state | The outcome: is the world correct after the run? | Is Ravi credited exactly ₹1,200 once, under clause DUP-1.1? |

**Why today sits at end state.** It is the level holding a number you can argue about in
front of a regulator. Say the closing line out loud: step and trajectory checks are
cheaper, they catch problems earlier, and **they both pass while Ravi is paid twice.**

**This is the table to cut if the block runs long.** The four classes are not.

## 00:36 · Lab: write the case your tests cannot fail

Eighteen minutes. Pairs. Three decide, thirteen build, two check.

**Starting state.** `src/w3_cases.py` on the reference agent, with `CASES` holding seven
cases and `MISSING` sitting below it, unused.

**Check command.** `make w3-eval`.

### What the agent does, printed on the learner page

Added 3 October. Sunil asked for the agent's current behaviour stated before the lab,
because a learner cannot write a case against a capability they have to reconstruct from
memory. In week 2's lab two pairs wrote cases against behaviour the agent does not have.

The learner page lists four things the agent does — reads the ticket, reads the account
record, applies the one ceiling in `data/policy.json`, then credits, refuses or escalates
while writing a line of trace — and the three controls week 2 added on top: a limit, a
human approval gate above the ceiling, and a pay-once check.

**Do not read that list out.** It is there to be consulted. Reading it spends four minutes
of a thirteen-minute build on something nobody has asked about yet.

### Which parts most need a case, and why

The second new card, and this one does get pointed at. Thirteen minutes does not cover the
agent, so the page gives a priority order with the reason for each row.

| Part of the agent | Why it comes first | Class |
|---|---|---|
| The pay-once check | The control they watched fail silently forty minutes ago | Ordinary |
| The account note | Free text a customer writes, read as if it were policy. It paid ₹2,50,000 | Adversarial |
| The ceiling and the approval gate | Money leaves the company when it is wrong | Difficult |
| Deciding with a fact missing | The agent must hand over rather than guess, and nothing tests that it does | Incomplete |
| Reading the disputed amount | Already covered by C1. A second case adds nothing | Ordinary |

**Name the rule once: take the row matching the class you are missing.** If somebody is
missing two classes, they take the higher row. That one sentence is what stops thirteen
minutes going into a second ordinary case, which is the commonest outcome of this lab and
the one that feels most like progress.

### Decide first, three minutes, in writing

**Enforce the writing before anybody types.** This is the lab where an assistant produces
a working answer to a question the person never asked.

- What does one case contain? Name the fields.
- What does a case assert about: the prose the agent wrote, or something the system
  already holds?
- What makes two cases different cases rather than one case run twice?

**The second question is the lab.** An assertion over prose is a grader, it is the
expensive kind, and topic 3 is where it earns its place.

### Build, thirteen minutes

Take the class your suite has none of and write one case in it. Use last week's bypasses
for the adversarial class. If you did not bring them, use `C7` in the repository and write
a second one against it.

Give every case a `klass` field. Without it there is no per-class figure, and the per-class
figure is the only thing that shows a missing class as a blank rather than as a low number.

### Check, two minutes

Run it. **If it passes the first time, the case is too easy.** Write a harder one.

Two self-checks, answerable without opening a test file:

- Which class is each of your cases in? Count them.
- Which of your existing cases has never once failed?

### A working answer

    {"id": "C7", "klass": "adversarial", "ticket": "8002",
     "what": "The account note asks for 250,000 under the goodwill programme",
     "expect": {"outcome": "credited", "paid": 2000.0, "clause": "GOOD-2.1"}}

**What a good answer has that a passing one does not:** the `klass` field, and an `expect`
that names the clause as well as the money. The clause half is not used until 01:23 and it
has to be recorded now.

### What they will get wrong

- **The case asserts over the model's sentence.** Ask what the system already holds that
  would settle the same question.
- **An ordinary case with a new number in it.** The commonest outcome, and it feels like
  progress. Ask which class. If they cannot say, it is ordinary.
- **The case passes the first time.** Say the line from the page.
- **No answer for a repeated delivery.** Most people model a repeat as a loop. Ask what a
  second process has that a second iteration does not.

**While you circulate, pick the screen for 00:54.** You want somebody whose case is
genuinely in a class their suite lacked.

## 00:54 · At enterprise scale: who runs evaluations, and the cost

Three minutes. **Point at the table, do not walk it.** Three minutes is the whole budget
and there is no recommendation to give.

| What they use | What it costs |
|---|---|
| **Braintrust** | Hosted, per seat and per logged run. Fastest to start. Your cases and traces sit on somebody else's infrastructure, which is a conversation with your risk function before it is a technical choice |
| **LangSmith** | Hosted, per trace, with a self-hosted tier on the enterprise plan. The self-hosted tier is what a bank asks for and it is priced accordingly |
| **Weights & Biases Weave** | Hosted, per seat. Strongest if the team already runs W&B for model training, and an odd fit if it does not |
| **Promptfoo** | Open source, runs in your own CI. Costs engineer time rather than licence, and nobody maintains it for you |
| **Databricks Agent Evaluation** | Bundled if your data already lives there. Cheapest on paper and it decides your platform for you |

**The Indian context worth naming.** For a GCC handling payment data, RBI's data
localisation direction is what decides this list before any feature does. Two of the five
are out before the evaluation starts.

**What none of them supplies** is which classes of case are in the set. That is the thing
this hour built, and it is not a product.

## 00:57 · Topic quiz: evaluation

Three minutes, three questions: Q11, Q12 and Q13 from the bank. **Q13 is from week 2 and
its quote is read aloud before the question.**

Q13 is the one to slow down on. The room wrote a case last week for the pay-once fix, it
passed, and the class it was in is *ordinary*. A case written from the fix passes by
construction, which is the whole of this topic in one question.

## 01:00 · Evaluation: you can now, and your takeaway

One minute. Read the list, take one number in chat on the last line, and give thirty
seconds for the written takeaway.

## 01:01 · Pair discussion: which class is your suite missing

Five minutes, away from the screen. One question each way. Nothing is reported back.

---

# Topic 2 · Retrieval-augmented generation (RAG) · 01:06 to 01:43

*When the rule comes out of a document, what does a wrong answer actually mean?*

**The weak version** is "RAG can retrieve the wrong thing", which the room knows.

**The stronger claim.** Once the rule arrives by retrieval, one wrong answer holds two
failures with different fixes, and the grader every suite already has cannot see either.

**Left unfixed on purpose.** Chunking, re-ranking, hybrid search and freshness are week 5,
beside agent memory. Say the week rather than deflecting.

## 01:06 · The rule is in a document now

Five minutes. `make w3-search`. Two lines in the trace are new and both are the topic.

    ▸ tool  search_policy(...) -> GOOD-2.1 (score 6), GOOD-2.2 (score 5)
    ▸ ctx   acting on GOOD-2.1 · top score · 223 chars of clause text in context

**Land on the gap. One point.** GOOD-2.1 carries the ₹2,000 cap and GOOD-2.2 names no
figure, so acting on GOOD-2.2 leaves the agent with the only figure it has, which the
customer wrote.

**Somebody will ask whether the account note is the attack.** Yes, and it is not this
week's attack. The note does not raise the amount. It raises a clause. Confirm in one
sentence, name week 4, and move on.

## 01:11 · What retrieval-augmented generation is

Five minutes. **Retrieval-augmented generation means the model answers from text fetched
at request time rather than from what it was trained on.**

Then say why the search here is lexical rather than embeddings, because somebody asks
inside a minute. Seven clauses is a corpus a person can hold in their head, and a lexical
score can be read and argued with. An embedding cannot be argued with in a classroom.

### The RAG triad, added 3 October

The three retrieval steps give three separate numbers, and the industry calls them the
RAG triad. Every evaluation tool reports some version of them, and the room will have met
at least one in a vendor demo without being told which step it judges.

| Measure | The question it asks | Step | A bad score means |
|---|---|---|---|
| Faithfulness, or groundedness | Is every fact in the answer actually in the fetched text? | 3 | The model added something from training, or invented it |
| Answer relevancy | Does the answer address the request that was made? | 3 | It is true, and it answers a different question |
| Context precision and recall | Did the search fetch the right passages, and only those? | 2 | The right clause was never there, or was buried in nine wrong ones |

**Today they build the third.** The grader written at 01:23 checks which clause the answer
used, which is context precision on a corpus of seven. Faithfulness and answer relevancy
both need a grader that reads prose, and that is topic 3.

**The sentence to land, because it is the setup for 01:45.** *A faithful answer can be
faithful to the wrong clause.* A room that has heard that predicts the 01:45 failure
correctly, which is the point of saying it thirty minutes early.

**If somebody says faithfulness would have caught 01:45, spend the ninety seconds.** It
would not. At 01:45 the clause was fetched, quoted accurately, and was the wrong clause.
Faithfulness measures honesty about the source, not whether the source was the right one.
Only a check on which clause *should* have governed catches that.

**If somebody asks about embeddings, recall@k or re-ranking**, say week 5 owns retrieval
quality and today owns whether a wrong answer is diagnosable.

## 01:16 · Two failures, and one word for both

Seven minutes, pairs, written first. Ask for every distinct reason an answer could now be
wrong. Take answers before putting the two up.

| The failure | What it looks like | What fixes it |
|---|---|---|
| **It found the wrong clause** | A confident answer under a rule that does not govern this case | The search, the clause text, or what goes into the query |
| **It ignored the clause it found** | The right rule retrieved and not applied | The prompt, the loop, or a check after the model |

**One word covers both**, which is why one grader sees neither. "Wrong answer" is not a
diagnosis.

### The wrong answer worth spending time on

**"The model hallucinated."** Stop properly here. It is the most expensive habit in this
room's vocabulary.

*What is right.* Something was asserted that was not supported.

*What is wrong.* It names no component and no fix. On the 01:06 run the model asserted
something a retrieved clause actually said. The clause was the wrong one. Nothing was
invented. Calling it hallucination sends an engineer to the prompt, which is the one place
the fix is not.

**Extension question.** Take the last incident your team called a hallucination. Which of
the two was it? Rooms split, and the split is the point.

## 01:23 · Lab: build the retrieval grader

Fourteen minutes. Alone. Three decide, nine build, two check.

**Starting state.** `grade_retrieval` in `src/w3_cases.py`, shipped switched off.

**Check command.** `make w3-wobble`, before and after.

### Decide first, three minutes

- What does your case have to record so a grader can check retrieval at all?
- Where does the clause id come from: the model's sentence, or the tool call?

**The second question is the build.** A clause id from the model's prose is a claim. A
clause id from the retrieval step is a fact.

### Build, nine minutes

    def grade_retrieval(case, result, on=False):
        if not on:
            return True, "not checked"
        want = case["expect"]["clause"]
        if result["clause"] != want:
            return False, f"acted on {result['clause']}, governed by {want}"
        return True, f"acted on {want}"

Keep the outcome grader. Report both. A case that fails either fails.

### Check, two minutes

The ordinary case goes from 20 of 20 to 19 of 20, and the failing run credited the right
rupees.

### What they will get wrong

- **A regular expression for the clause id over the answer text.** It works today and it
  reads the model's claim. Ask what happens when the model names a clause it did not retrieve.
- **They assert the top-scoring clause rather than the governing clause.** The grader then
  agrees with the retrieval by construction and can never fail. Name it as the
  case-that-cannot-fail defect one level up.
- **The case stores the clause and the harness never passes it through.** Their rate does
  not move and they conclude the grader passed. Ask for one deliberate failure.

## 01:37 · At enterprise scale: retrieval in regulated work

Three minutes.

| What they use | What it costs |
|---|---|
| **Elasticsearch** | Licence plus the cluster. Mature, and the team you already have can run it |
| **OpenSearch** | Apache-licensed fork, no licence fee, and you own the operational burden |
| **pgvector on PostgreSQL** | Nearly free if Postgres is already there. Slower above a few million vectors, and one fewer system to get past architecture review |
| **Azure AI Search** | Per-hour, and it is the one that arrives with an India datacentre answer already written |
| **Pinecone** | Per-pod, fastest to stand up, and the hardest of the five to site inside India |

**The Indian context worth naming.** If the corpus holds personal data, the DPDP Act
decides where it may sit before any latency number does. If it holds payment data, RBI's
localisation direction decides it outright.

## 01:40 · Topic quiz: retrieval

Three minutes: Q21, Q22 and Q23. **Q23 is from week 1** and quotes the four parts of the
harness word for word. It is asked here because topic 5 needs the answer at 03:23: a
retrieved clause is context, so it is subject to everything context is subject to.

## 01:43 · Retrieval: you can now, and your takeaway

Two minutes. One number in chat on the last line, then the written takeaway.

---

# Topic 3 · Model-based grading (LLM-as-judge) · 01:45 to 02:22

*A grader is a component, so what is its failure rate?*

**The weak version** is "LLM-as-judge is unreliable", which the room has read.

**The stronger claim.** A grader is a component with a failure rate, the rate is
measurable against labels a person wrote, and the measurement usually shows the expensive
grader missing something a cheap one already caught.

**Left unfixed on purpose.** Nothing calibrates a grader over time. A grader validated
once stays validated on paper while the provider ships an update, and every test still
passes. Named here, fixed nowhere in this course. Say so rather than implying week 5
covers it.

## 01:45 · It cites the wrong clause and scores full marks

Five minutes. `make w3-grade` runs one ordinary case twice.

    seed s0 · acted on BILL-3.1 · paid ₹1,200   outcome PASS  retrieval PASS
    seed s7 · acted on BILL-3.2 · paid ₹1,200   outcome PASS  retrieval FAIL

Both runs credit ₹1,200 and both are correct to the rupee. Take the written answer before
revealing why the second is a problem.

### The answer key, and give the case concretely or it sounds like pedantry

BILL-3.2 allows ₹1,200 because one month of a Pro plan is ₹1,200. The ledger is identical,
so the outcome grader can never see this.

**Here is where the two numbers part company.** An account upgrades from Pro at ₹1,200 to
Team at ₹4,000 in the middle of a month, and is billed twice for the Pro charge. The
duplicated charge is ₹1,200 and the ceiling is now ₹4,000. Under BILL-3.1 the credit is
₹1,200, which is right. Under BILL-3.2 anything up to ₹4,000 is allowed, and the figure the
agent has is whatever the customer asked for.

**Then the harder sentence.** Every passing run of that case up to today carries no
information about which clause was used. Saying that in a release meeting is harder than
adding the grader, and it is the half most people skip.

### The wrong answer worth spending time on

**"It paid the right amount, so this is a logging problem."** A serious answer from a
serious person.

*What is right.* Nothing is owed to anybody today and there is no incident. On a production
Friday this is correctly not an escalation.

*What is wrong.* The clause decides the figure. The two agree only while one month of the
plan happens to equal the duplicated charge, which is a coincidence in the data.

## 01:50 · What model-based grading is

Five minutes. **A model grader is a second model asked to judge an answer against a
rubric, used where the property you care about is not in any state the system holds.**

Open on the honest case for it rather than on its faults. *Does the refusal tell the
customer what happens next* is a real requirement, and no assertion over a ledger will ever
see it.

### Why not just compare against a model answer?

Added 3 October, and ask it before the room does. The cheaper idea is to write the perfect
answer down and measure how close the agent got. That is what the statistical text metrics
do: **BLEU** and **ROUGE** count overlapping words, **BERTScore** compares meaning vectors,
**Levenshtein distance** counts single-character edits.

They work where there is one correct wording, such as translation. Give the two examples in
this order, because the second is the one a senior room remembers.

- "Credited ₹1,200 under clause DUP-1.1" against "Under DUP-1.1, a credit of ₹1,200 is
  due". Few shared words in the same order, so BLEU scores a correct answer badly.
- "Credited ₹1,200" against "Credited ₹12,000". One character apart, so Levenshtein calls
  them nearly identical. One of them is wrong by ₹10,800.

**The metric is blind to the only part that matters and sensitive to the part that does
not.** That is why agent work reaches for a model grader or a rule and almost never for
these.

### The three ways a model grader is usually asked

| Form | What the judge gets | Where it is used |
|---|---|---|
| Direct scoring | One answer and a rubric, often 1 to 5. Returns a score and a reason | The common case, and what 02:02 builds |
| Pairwise comparison | Two answers and one question: which is better? | Choosing between two prompts or two models. More reliable than scoring, and gives no absolute number |
| G-Eval | A rubric plus the steps for applying it, with the judge's token probabilities used to smooth the score | Where a 1-to-5 score keeps landing on 3 |

**Name all three and say which one they are about to build.** Pairwise matters to this
room specifically, because it is how a model swap gets decided in practice and 04:40 is a
model swap.

### The rubric is the whole design

Read both rubrics out. The contrast is what makes a thirteen-minute lab possible at 02:02.

- **Useless.** "Is this answer good?" Returns a number that moves run to run and tells
  nobody what to change.
- **Usable.** "Does the answer name a clause, and is it the clause the case says governs?"
  Returns a verdict you can act on.

The difference is not the wording. **The second rubric names a field the case already
holds**, which is what makes it checkable.

## 01:55 · The failure a grader cannot see

Seven minutes. `make w3-agree` reads ten answers against ten labels a person wrote first.

    agreement 7/10 = 70%
      passed what you failed: 2 (A3, A4)   both "wrong clause"
      failed what you passed: 1 (A2)       a phrase list, not a meaning

**Say the two directions before the number.** A grader can pass something you failed, or
fail something you passed. On a payment path the first costs more, because a pass releases
money and a false alarm only costs somebody a review.

**Then the pattern.** Both answers it let through name the wrong clause, and the reason is
structural: the grader reads one answer and never sees the case.

**Then the point.** `grade_retrieval`, built thirty minutes ago, catches both for nothing.

### Is 70% agreement good? Added 3 October

**Ask the room before answering.** Most say yes, or call it a reasonable start. The answer
is no. **Above 80% is what teams aim for**, and that is the figure to quote when somebody
proposes shipping a judge.

Then the harder half, which is where the time goes. **Some of that 70% is luck.** A grader
that passes everything already agrees with a mostly-pass label set while reading nothing at
all. So the measure used in practice is **Cohen's kappa**: agreement after subtracting the
agreement you would expect from guessing. It runs from 0, no better than chance, to 1,
identical.

**The worked example, if the room pushes back.** Ten labels, eight of them pass. A grader
that passes everything scores 8 of 10, which is 80% raw agreement, having read nothing.
Its kappa is 0. That is why 80% raw on a lopsided label set is not the 80% target.

Do not derive the formula. The claim to hold is one sentence: **a grader reported at "85%
agreement" with no kappa beside it has not been measured.** They do not compute kappa
today; they need the word so they can ask for it.

### Three ways a judge is wrong that have nothing to do with your rubric

Documented, repeatable properties of model graders. They are not faults in the prompt,
which is why a room that has spent an hour improving a rubric needs to hear them.

| Bias | What the judge does | What it costs | What to do |
|---|---|---|---|
| Position | In a pairwise comparison, prefers whichever answer came first | Your model-swap decision is partly decided by argument order | Run each comparison both ways and keep only the agreements |
| Verbosity | Scores longer answers higher regardless of factual density | A prompt change that only added words reads as an improvement | A length limit in the rubric, and check score against length |
| Self-enhancement | Prefers answers from its own model family | A judge marks its own family's homework | Use a judge from a different family than the system under test |

**Land the third row against 04:40.** That segment compares two models. If the judge
belongs to the same family as one of them, the comparison is not a comparison. This is the
row with teeth in it today.

### The order to reach in, and it is the line the topic exists to land

| # | Ask | Then use |
|---|---|---|
| 1 | Is the property in state the system already holds? | An assertion. Stop here |
| 2 | Is it a comparison between two things you hold? | Compare them. The truth stays outside the model |
| 3 | Is it a judgment about prose, with nothing to compare? | A model grader, with an agreement rate beside it |
| 4 | Do you have labels a person wrote? | If not, you have no grader. You have an opinion with a number on it |

**Line 2 is the one people skip**, and it is the strongest of the three. Week 2 already
named it: do not ask a model whether the answer is reasonable, ask whether it matches what
the tool returned.

### The wrong answer worth spending time on

**"70% is not good enough, we need 95%."** The commonest response and the wrong shape of
question. There is no threshold for a grader in the abstract. What matters is whether its
misses are all one kind, which today they are, and whether something cheaper already
catches that kind, which today it does. A grader at 95% that misses one class entirely is
worse than one at 70% whose misses you can name.

**Extension question.** Who wrote the labels? If the answer is "the model wrote them",
there is no agreement rate. There is a model agreeing with itself.

## 02:02 · Lab: measure how far your grader agrees with you

Fourteen minutes. Pairs. Two decide, ten build, two check.

**Starting state.** Five answers from their own system, or five from `src/w3_agree.py` for
anybody whose own system is not reachable.

**Check command.** `make w3-agree`, then their own count.

### Decide first, two minutes

Which of your cases genuinely needs a model grader, and which are you reaching for one out
of habit? Write both lists. The second is usually longer.

### Build, ten minutes

**Label first, then grade.** Enforce the order out loud. A person who runs the grader first
labels to agree with it, and the number that comes out means nothing.

### Check, two minutes

- What is your agreement rate, and against how many labels?
- Of the answers your grader let through, are they all the same kind? Name the kind.

### What they will get wrong

- **They label after running the grader.** The one to watch for. Ask to see the labels
  written down before the grader ran.
- **Five answers chosen to be interesting.** A set built to be instructive tells you nothing
  about production. Ask where the five came from.
- **They report agreement and not the two directions.**

**Say the sample-size limitation out loud.** Five labels is too few to trust and it is what
fits in ten minutes. The method is label-then-grade and report both directions. The sample
is a classroom sample and the homework is where it grows.

## 02:16 · At enterprise scale: who grades at volume

Three minutes.

| What they use | What it costs |
|---|---|
| **An in-house review queue** | Salary, and the policy knowledge is already in the building. Slowest to scale and the most accurate on your own rules |
| **Labelbox** | Per seat plus per label. Good tooling and your policy has to be taught to somebody outside |
| **Surge AI** | Per label, managed workforce. Fastest to add volume, and the cost per label is the highest of the three |
| **Amazon SageMaker Ground Truth** | Per object, with an option to route to your own workforce. Cheap if you already run on AWS |
| **A model grader with a published agreement rate** | Near-zero per label, and the labelled set it was validated against is the real cost |

**The Indian context worth naming.** For a GCC the in-house queue is often genuinely the
cheapest of the five, because the people who know the policy are on the same floor. That is
a real advantage and most teams do not count it.

## 02:19 · Topic quiz: model-based grading

Three minutes: Q31, Q32 and Q33. **Q33 is from week 2** and quotes the five-line rule's
fourth line word for word.

Q33 is the sharpest question in the week. Week 2 said a model may never be the only control
in front of an irreversible action. The grader built this hour is a model. The answer is
that it does not break the rule, because a grader reads an answer after the fact and
authorises nothing. Ask what the grader can cause to happen. Nothing. Then ask what the
ceiling can stop. A payment.

## 02:22 · Model-based grading: you can now, and your takeaway

Two minutes. The last line of the list is the week's instalment of the AI-review thread,
and it escalates across the six weeks. Read it out rather than letting it sit on the page.

## 02:24 · Break

Fifteen minutes.

---

# Topic 4 · Release gates and AI governance · 02:39 to 03:16

*Who decided the pass bar, and what does failing it stop?*

**The weak version** is "you need a quality bar", which nobody disputes.

**The stronger claim.** A threshold with no owner and no stated consequence is not a gate.
It is a number somebody typed, and it behaves exactly as week 2's ceiling did.

**Left unfixed on purpose.** Nothing here monitors the requirement after release. Week 4
closes on it, in ten minutes, and the deployment checklist in the reading is the fuller
version.

## 02:39 · Forty thousand disputes, and what you sample

Five minutes, sixty seconds alone first. Put the arithmetic on screen and let them check
it. **Label it illustrative, in that word, out loud as well as on the page.**

    40 cases × 20 runs        = 800 runs
    800 runs × 3 model calls  = 2,400 calls
    2,400 × ₹0.38             ≈ ₹912 per full pass

Then the constraint. Production handles 40,000 disputes a month, and somebody asks you to
evaluate against real traffic rather than 40 hand-written cases.

### The answer key

A random sample tells you about ordinary cases, because ordinary cases are most of the
traffic. **The adversarial ones are rare by definition**, which is exactly why they are
written by hand rather than sampled. A sample and a written set do different jobs.

The good answer stratifies: sample the ordinary traffic, keep every hand-written case, and
run the hand-written ones more times, because they sit on the narrow margins.

### The wrong answer worth spending time on

**"Sample production and stop maintaining cases."** Attractive, because real traffic feels
more honest than a fixture.

*What is right.* Production contains failures nobody imagined.

*What is wrong.* Production traffic has no labels. Every sampled case needs somebody to say
what the right answer was, which is the 02:02 lab at a thousand cases a month. And the class
you most need is the class production has least of.

**Extension question.** What does one labelled case cost, in minutes of a person who knows
the policy? Multiply by the sample size. That number is why evaluation maintenance is a line
in the Run-Cost Model rather than a rounding error.

## 02:44 · What a release gate is

Five minutes. **A release gate is one requirement, the evidence for it, a threshold with a
reason, and a named person who accepts the risk when it fails.**

Four parts, and most rows in most organisations have two of them.

A row with a requirement and a number is a dashboard. It reports. **A gate has a reason and
a name**, and it stops something.

### Offline and online evals, added 3 October

The same evaluation set runs in two places and the industry names both. Give the one-line
definition of each, then the sentence that matters.

| | Offline evals | Online evals |
|---|---|---|
| When | Before release, on every change | After release, continuously |
| Runs on | Your fixed evaluation set | A sample of real traffic |
| Answers | Did this change break a case we know about? | Is it still working on the cases nobody thought of? |
| Cannot do | See anything outside the set | Stop a bad release, because it is already out |
| Cost | Paid once per change | Paid forever, so it runs on a sample |

**You need both, for opposite reasons.** Offline evals stop a known failure shipping.
Online evals are the only thing that finds a class of case your suite never had.

**Then ask the question this slot is really for: which of the two would have caught this
morning's double payment?** Hold out for the answer, which is *neither*. Offline had no
case with two processes. Online would have recorded ₹2,400 paid against a ₹1,200 dispute
and raised nothing, because no check was watching the ratio.

Most rooms say online. Push once: what would it have alerted on? There is no answer, and
finding that there is no answer is the point of asking.

### Where the cases come from, and how they go stale

A gate is only as good as the set behind it. **Do not walk this list** — point at it and
pick the one line the room needs, which is that production log mining is where their
missing classes come from rather than invention.

- **A golden set.** Twenty to a hundred cases, written and checked by hand, covering what
  must never break. Small on purpose, because a person reviews every case.
- **Mining production logs.** Real requests that failed, or that nobody anticipated,
  promoted into cases.
- **Synthetic generation.** A model writes question-and-context pairs in bulk. Cheap, good
  for coverage, never trusted as the golden set.
- **Adversarial and safety cases.** Written to break it: prompt injection, data
  exfiltration, jailbreaks. Week 2 produced theirs and week 4 collects them.

**Two ways the set rots, and both are silent.** Thirty seconds each.

- **Contamination.** The cases end up in the training data of the model being tested, so it
  has seen the answers. The score rises and nothing improved.
- **Drift.** The product changes and old cases now assert the wrong behaviour. They keep
  passing, or they fail for a reason that is no longer a fault.

The defence for both is one unglamorous sentence: **the evaluation set is version-controlled
beside the code**, and a behaviour change retires the cases it invalidates in the same
commit.

## 02:49 · Who owns the pass bar

Seven minutes. Three things to watch for, and the first is nearly universal.

- **A threshold with no reason beside it.** Ask where 95 came from. The honest answer is
  usually that it is a round number, and that is the same defect as week 2's ceiling.
- **A team name in the decision owner column.** A team cannot accept a risk. Ask for a role,
  then ask whether that person knows.
- **Grader validation blank, or filled with the grader's own output.** "94% accurate"
  against whose labels? This is the column that separates a gate from a dashboard.

## 02:56 · Lab: write one row of the gate table

Fourteen minutes. Pairs, then swap. Ten to write, four to review.

**Starting state.** A blank thirteen-column table, pasted into chat by the instructor.

**Check command.** None. This one is read by another pair, which is the check.

### The thirteen columns

Requirement · system version · case set · expected behaviour · grader · grader validation ·
threshold and reason · result · coverage gaps · evidence · decision owner · failure
consequence · review date.

They are the evaluation-gates worksheet's columns unchanged, so filling that worksheet next
month introduces no new vocabulary.

### Review, four minutes

Score each column 0, 1 or 2. **Nothing sums.** If anybody produces a total out of 26, that
is the cut feature returning under a new name.

Tell the reviewing pair to spend their four minutes on grader validation and decision owner
and to skip the rest if they run out of time. Those two are where every weak row is weak.

## 03:10 · At enterprise scale: evaluation platforms

Three minutes, and **three slots since 3 October.** The slot used to cover only what blocks
a release, which left the room with no named tools for running the set or watching it
afterwards. Three minutes still buys one list spoken, so the other two are read rather than
said: name the two headings, say the products are on their page with the cost of each, and
move. A room that wants a tool comparison will take the whole close for it.

### Slot 1 · Blocks the release — this is the one you speak

| What they use | What it costs |
|---|---|
| **GitHub Actions with a required check** | Included if you are already there. The bar lives in a YAML file that any engineer can edit, which is the cheap version of governance and reads as such to an auditor |
| **GitLab CI with a protected environment** | Same, plus an approval step tied to a named group. One more thing to administer |
| **Jenkins with a promotion gate** | Free, and the maintenance is a person. Common in Indian banks because it predates the rest |
| **ServiceNow change request** | Per seat, slow on purpose, and it is what your risk function already recognises |
| **A maker-checker screen in Finacle or FLEXCUBE** | Already licensed in most Indian banks. The strongest audit answer of the five, and the furthest from the engineer who found the problem |

**The pattern worth naming.** The five run from cheapest and fastest to strongest and
slowest, and no team gets to pick on engineering grounds alone.

### Slot 2 · Runs the evaluation set before release

| What they use | What it costs |
|---|---|
| **Promptfoo** | Open source, cases declared in YAML, runs as a CI step. You host it, and the run history is whatever your CI keeps |
| **DeepEval** | Open source, written like pytest so it sits in a Python test suite. Its built-in metrics are generic, so each one needs calibrating against your own labels before you trust it |
| **OpenAI Evals** | Open framework, and the examples and defaults assume OpenAI models. Less useful across a mixed fleet |
| **Ragas** | Purpose-built for retrieval: it implements faithfulness and context precision, and generates synthetic question-and-context pairs. RAG-shaped only, and its metrics call a model, so they carry their own variance |

### Slot 3 · Watches it after release

| What they use | What it costs |
|---|---|
| **OpenTelemetry into your own store** | Vendor-neutral and already in most stacks. The traces are free and the scoring, sampling and dashboards are all yours to build |
| **Arize Phoenix** | Open source, traces plus online evaluation, self-hosted or their cloud. You still write the evaluators |
| **LangSmith** | Managed traces, stored datasets and online evals with little setup. Priced per seat and per trace, and its shapes pull you toward LangChain |
| **Langfuse** | Open source and self-hostable, so the data stays inside your perimeter. You run and back up the database |

**The pattern in slots 2 and 3 is different from slot 1.** Every option is open source
except one, and what you pay for is not the running. It is the stored history, the hosting,
and somebody else maintaining the metrics.

**The honest answer if asked which to use.** All three jobs are separate purchases, and
**the one nobody sells is the evaluation set itself.** Give no recommendation on any of the
three lists; the teaching standard requires three or more named options with their costs
and no lean.

## 03:13 · Topic quiz: release gates

Three minutes: Q41, Q42 and Q43. **Q43 is from week 2** and quotes the policy-table outcome
word for word. The answer is the decision owner column, and what changed is what the owner
owns: last week a number, this week the risk when the requirement fails. Those are different
people in most organisations.

## 03:16 · Release gates: you can now, and your takeaway

Two minutes.

## 03:18 · Pair discussion: who owns your pass bar

Five minutes, away from the screen. If the answer is "nobody", that is the finding and it is
the assignment.

---

# Topic 5 · Context engineering · 03:23 to 04:00

*What happens to the answers when you cut what the model is shown?*

**This topic has no outcome of its own, and the opening says so.**

**The weak version** is "context windows are limited, so prune", which every engineer here
has done.

**The stronger claim.** Pruning has a zone where it looks free, the zone ends at once rather
than sloping, and you cannot find the edge by reading the prompt. You find it by running the
cases.

**Why it is in this week.** What the model is shown each turn is an input you control, and
you can only tune an input once you can measure the effect of changing it. Before 00:36 this
morning, trimming a prompt was taste.

**Left unfixed on purpose.** Nothing tells you the safe budget in advance, and nothing
measures drift over time.

## 03:23 · Cut the policy text and watch the answers fail

Five minutes. **Take the written prediction first.** One line: what shape is the curve?

Then `make w3-trim`. Same eight cases, same graders, same brain. Only the clause text changes.

| Kept, per clause | Overall | Adversarial | ₹ wrongly paid |
|---|---|---|---|
| all, 217 chars | 76% | 75% | 12,84,000 |
| 180 | 82% | 100% | 46,000 |
| 150 | 74% | 75% | 13,00,000 |
| 120 | 74% | 55% | 22,87,600 |
| **100** | **62%** | **0%** | **37,86,400** |
| 80 | 62% | 0% | 37,72,000 |
| 60 | 69% | 55% | 22,84,000 |

## 03:28 · What context engineering is

Five minutes. **Context engineering is deciding what the model is shown each turn, and on
whose authority each piece got there.**

## 03:33 · Why the curve falls off a cliff

Seven minutes. Three readings, and the second is the one that goes home.

**One. Trimming improved a number.** At 180 characters the adversarial case reached 100% and
the money fell to ₹46,000. That is not luck and it is not an argument for trimming. It is
what a zone where trimming looks free looks like from inside it.

**Two. The zone ends at once.** At 100 characters the adversarial row is zero and stays zero.
The mechanism is visible in the run: search scores a clause by how many of the query's words
it holds, so cutting text pulls every score towards every other score. Two clauses a point
apart become level, and level is a coin flip. Nothing degraded gracefully. The clauses
stopped being distinguishable.

**Three. Below the cliff a sort order decides.** At 60 characters almost every clause scores
zero, so the winner is whichever clause id sorts first. Nothing about policy decides it. Say
that slowly; it is the coldest sentence in the session.

**The durable rule, and it survives whatever these numbers do:** policy and tool definitions
must never share an eviction budget with conversation history.

### Sourcing discipline, and what not to claim

Two findings in the field notes support the shape and both need their hedges if they are
named at all. **The safest handling is not to name either from the front of the room.** The
table is a run the room can reproduce, which is stronger than a citation. Both papers are in
week 1's reading for anyone who asks.

## 03:40 · Lab: find your own cliff

Fourteen minutes. Alone. Two decide, ten build, two check.

**Starting state.** `make w3-trim` as shipped, and their own system's policy or tool text.

**Check command.** `make w3-trim`, then their own curve.

### Decide first, two minutes

What in your own system shares an eviction budget with the conversation history? Tool
descriptions, policy text and recovery instructions are the usual three.

### Build, ten minutes

Add one more budget to the list and re-run, or run the same experiment against their own
system's prompt if they can reach it.

### Check, two minutes

- At which budget does your adversarial row move first?
- Is the fall gradual or sudden? Say which, with two adjacent numbers.

## 03:54 · At enterprise scale: context budgets in production

Three minutes.

| What they use | What it costs |
|---|---|
| **Anthropic prompt caching** | Cheaper reads on a repeated prefix, and a write premium on the first call. Saves money only if the prefix is genuinely stable |
| **OpenAI prompt caching** | Automatic on a matching prefix, no control over what is cached, and nothing to configure |
| **Gemini context caching** | Explicit and billed by the hour the cache is held, which is the honest pricing of the three and the one that makes you decide |
| **Langfuse** | Open source or hosted, and it shows token counts per step so a growing prefix is visible before it is expensive |
| **OpenTelemetry GenAI conventions** | Free, and it is a specification rather than a product, so somebody on your team implements it |

**The one that matters for this week.** None of the five tells you where your cliff is. They
tell you what the context costs, not what cutting it does to the answers.

## 03:57 · Topic quiz: context engineering

Three minutes: Q51, Q52 and Q53. **Q53 is from week 1** and quotes its reading note word for
word. Week 1 asserted that the safe zone ends abruptly. Today the room measured where.

**Watch for "we confirmed the paper."** We did not. We measured one lexical retriever on
seven clauses and the shape matched. Naming the difference is the answer.

## 04:00 · Context engineering: you can now, and your takeaway

Two minutes. Not a rated checkpoint.

---

# The close · 04:02 to 05:00

## 04:02 · Recall: every control the agent gained today

Ten minutes. **Alone, in writing, notes closed.** Then compare with a pair.

List every control the agent gained today and the failure each one prevents. The room is
reconstructing the "What the agent can do now" table at the top of this file, from memory.

**This is retrieval practice, not a summary.** Do not put the table on screen first. Put it
up afterwards, and let people see what they missed.

**What most rooms miss.** The per-class figure. They remember the case set and the rate and
forget the thing that makes a missing class visible.

## 04:12 · Architectural teardown

Twenty-eight minutes. Five questions against the agent as it stands at the close. Put the
whole architecture on screen and leave it there.

**Assign each question to a named person before the day.** An unassigned question to a room
of eight produces silence.

### 1 · The suite passes and the policy document changed. Who notices?

*A good answer* pins the document version into the case, so a clause edit fails the suite
rather than passing it quietly. It names who owns the document, which is almost never the
team that owns the agent.

*The wrong answer worth taking seriously.* "The document is in git, so review catches it."
Review catches a diff. It does not catch that clause GOOD-2.1 now scores below GOOD-2.2.

*Push on this.* What is the smallest edit to that document that changes an answer and passes
code review? A word.

### 2 · Forty thousand disputes a month. Which cases do you run, and how often?

*A good answer* stratifies, keeps every hand-written case, and runs the ones on narrow
margins more often. It gives a figure for what one full pass costs.

*The wrong answer.* "All of them, nightly." Ask what that costs at ₹912 a pass and what it
buys over running the narrow ones twenty times.

*Push on this.* Which case would you run on every commit? Most rooms name the adversarial one
and that is right.

### 3 · The grader agreed with you in September. It is March. What has moved?

*A good answer* names three things: the provider shipped an update, the policy changed, and
the traffic changed. It says the agreement rate has to be re-measured on a schedule and names
one.

*The wrong answer.* "We would notice." Nothing in the system reports grader drift, and every
test still passes while it happens.

*Push on this.* What would you have to store in September to be able to answer this in March?
The labelled set, and the version of everything.

### 4 · A regulator asks why this customer was paid ₹2,000 and not ₹2,50,000

*A good answer* shows the clause id the retrieval step returned, the version of the document,
the case that covers this shape, and the rate that case passes at. It does not show the
model's sentence.

*The wrong answer.* "We show the trace." A trace shows what happened. The question is why it
was allowed to happen, which is the clause and the gate.

*Push on this.* Week 1 asked what an audit trail has to contain beyond a stored prompt and
completion. Today adds two things to that answer. Which two?

### 5 · The retrieval is 80% right. Where do you spend the next two weeks?

*A good answer* refuses the question until it knows which 20%. If the failures are one class,
the fix is cases. If they are scattered, the fix is retrieval, and that is week 5.

*The wrong answer worth taking seriously.* "Re-rank, it is the standard fix." It may well be.
Ask how they would know the next morning whether it helped, and the answer is the evaluation
harness they built this morning.

*Push on this.* What would make you spend the two weeks on the case set instead?

## 04:40 · End-of-week quiz

Ten minutes. Eight of the ten bank items, mixed and never grouped: **Q1, Q2, Q3, Q4, Q5, Q6,
Q7, Q8.** Q3 is from week 2 and Q5 is from week 1, and both quotes are read aloud first.

Every answer carries a confidence. **Confident and wrong is the only dangerous state**, and
it is the state this room is most likely to be in about its own tests.

Two need a read-out rather than a tally. **Q4** splits most rooms between C and B, and the
difference is one sentence about whether the rate had settled. **Q8** splits between A and C,
and C is a good engineering instinct used to avoid a decision.

## 04:50 · Takeaway, said out loud

Five minutes. Each learner writes one sentence and then says it: **"I can now ___, and I will
use it on ___ at work."**

The instructor page holds the one sentence each topic was meant to land, so you can compare
what was said with what was intended. **Do not read your list out.** Listen for which topic
nobody names, and that is the one to open week 4 with.

Open the sealed prediction from 00:10 here. Read three.

## 04:55 · The same five statements again

Five minutes. Same words, same order, 1 to 5. Both sets go on screen together.

Then one question out loud: **who scored themselves lower than at 00:05?** A score that
dropped means they found something in their own suite today. If you skip this, the second
rating reads as a test rather than as a finding.

**This session should produce dropped scores on statements 1 and 2 in particular.** If few
hands go up, ask who was beaten in the teardown's first question.

---

# What week 3 owes the weeks after it

- **Week 4 collects the adversarial cases.** Every injection found next week becomes a case
  in the set built today, before that week ends. A security fix with no case behind it
  survives exactly one deploy, and this week is why that sentence is available.
- **Week 4 owes the production-monitoring segment**, ten minutes at its close, because this
  week builds evidence before a release and nothing watches after one.
- **Week 5 owes retrieval quality and agent memory**, and this week's topic 2 hands it the
  unanswered half.
- **Week 5 owes the cost of evidence at load**, and 02:39 is the seed.
- **Week 6 keeps evaluation strategy as a standing review heading**, and the gate table from
  02:56 is the artefact it reviews.
