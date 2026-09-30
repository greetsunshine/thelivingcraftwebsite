# Week 3 — question bank

*Teaching material, not learner-facing. The learner surface shows the stem and the
options; everything else on this page is withheld by `toLearnerItem`.*

**Twenty-five items, in two groups.**

- **Q1 to Q10 are the end-of-week quiz**, asked at 04:40. Eight of the ten are asked.
  **Q3 comes from week 2 and Q5 from week 1**, because a quiz that only covers today
  tests memory rather than learning. Q9 and Q10 are held back.
- **Q11 to Q53 are the five topic quizzes**, three questions each, asked inside the
  topic that teaches them. The first digit is the topic. **The third question in each
  set comes from earlier material**, and the earlier week is quoted word for word above
  the stem, because in a live room nobody goes and looks it up.

**Every item is tagged with the offset where it is asked.** The clock is
`ROWS_W3` in [`scripts/teaching-clock.mjs`](../../../scripts/teaching-clock.mjs) and
an offset here that is not a row there is a mistake in one of the two.

**Four of the twenty-five reach the learner's check page**: Q2, Q4, Q6 and Q8.
`isSelfServable` in [`src/lib/craft/quiz.ts`](../../../src/lib/craft/quiz.ts) serves an
item only when it has options, a marked key, and a difficulty other than `judge`. The
rest are read aloud in the room, where a person hears the answer.

**Difficulty:** `recall` reads the material · `apply` uses it on a new case ·
`judge` has no single right answer and is scored on the defence.

**Two standing questions, all cohort:** what went wrong, and which single control
would have prevented it.

---

## The end-of-week quiz

### Q1 · The four classes of case
`recall` · 04:40

> Name the four classes of case, and say which one your own suite has none of.

**Answer.** Ordinary · difficult · incomplete · adversarial.

**The wrong answer worth catching.** "Happy path and error path." That is two classes
doing the work of four, and it merges the two that matter. Incomplete evidence and a
deliberately written input need opposite responses: one hands over, the other refuses.

**What is right about it.** Most teams genuinely do ship with those two, and the split
is real as far as it goes.

---

### Q2 · The case that was missing
`apply` · 04:40 · renders on the learner check

> Last week's fix made the same ticket pay once, and seven cases passed. Which one case
> would have failed?

- **A.** The same ticket delivered twice to one process
- **B.** A ticket whose account does not exist
- **C.** The same ticket delivered twice to two processes ✅
- **D.** Two different tickets on the same account, arriving at the same moment

**Why the others are attractive and wrong.** **A** is the case the suite already has,
and it is the one that made the fix look finished. **B** is a different control and the
suite already covers it. **D** is worth a minute: it is a genuine concurrency failure and
a real gap in the reference agent, and it is not the failure last week ended on. The paid
set is held per process, so the fix breaks on a second process with no concurrency at all.

**If somebody argues for D.** Ask what the fix was. A set held in memory. Then ask what a
second process has that a second thread does not, which is its own copy of that set.

---

### Q3 · Where the failure moved
`judge` · 04:40 · **from week 2**, and read the quote aloud first

> Week 2's opening: *"Five things go wrong before 03:31. Not one of them is the model
> failing. Every one is your own rule, working exactly as written."*
>
> You added an evaluation harness today. What is this week's version of your own rule
> working exactly as written and still being wrong?

**Answer.** A thin case set. The suite runs exactly as written, reports a pass, and the bug
is live. Nothing in it is broken.

**What a strong answer adds.** It names who can see it. Nobody, unless somebody reads which
classes of case are present, which is why the per-class figure exists.

**The wrong answer worth spending time on.** "The grader is wrong." What is right: a grader
can be wrong, and topic 3 measures exactly that. What is wrong: a wrong grader is a
component failing, and a thin case set is the suite working.

---

### Q4 · Ten out of ten
`apply` · 04:40 · renders on the learner check · **C** is the one that splits the room

> One case passes 10 times out of 10. You run it twenty times and it passes 15. What do
> you report?

- **A.** 83%, the mean of the two results
- **B.** 75%, and that the rate was still moving at twenty runs ✅
- **C.** 75%, because the larger sample is the better estimate
- **D.** 100%, because the first ten runs were against the release build

**Why C splits the room, and it is the one to take up.** C is correct about the estimate
and it drops the only thing anybody needed. A rate that is still moving has not been
measured yet, and reporting it without that sentence lets a release meeting treat 75% as a
fact about the system.

**A** is arithmetic somebody will still choose under time pressure: the two results are
not independent samples, because the second contains the first. **D** is a real practice
worth naming rather than dismissing. Freezing evidence at the release build is right, and
reporting 100% from the ten runs before the first failure is not.

**Follow-up if the room splits.** How many runs would make you stop? There is no number.
You stop when the rate stops moving, and on the adversarial case it is still moving at fifty.

---

### Q5 · Which part of the harness
`apply` · 04:40 · **from week 1**, and read the quote aloud first

> Week 1 named the four parts of the agent harness: *"the loop, the tool layer, the context built for each
> step, and the trace."*
>
> `search_policy` arrived today. Which part is it, and which second part does its result
> reach?

**Answer.** It is a tool, so it belongs to the tool layer. Its result reaches the per-turn
context assembly, which is what makes it different from `lookup_account`: the clause text
goes into the window and competes for room there.

**The wrong answer worth catching.** "It is retrieval, so it is its own part." Retrieval
is not a fifth part of the harness. Naming it as one hides the thing that matters, which is
that a retrieved clause is context and is subject to everything context is subject to.

**Follow-up.** Which part did today's cliff belong to? The context built for each step.

---

### Q6 · Two failures, two graders
`apply` · 04:40 · renders on the learner check

> An agent retrieves the ceiling clause on a duplicate-charge case and credits one month of
> the plan, which is the right figure. Which grader catches it?

- **A.** An assertion over the ledger
- **B.** A model grader asked whether the answer is reasonable
- **C.** A person reviewing the wording sent to the customer
- **D.** A grader that checks which clause the retrieval step returned ✅

**Why the others are attractive and wrong.** **A** is what almost every suite has, and the
ledger is identical in both runs, so it can never see this. **B** is the trap: a model
grader reads one answer and never sees the case, so it has nothing to compare the clause
against. **C** catches a badly worded refusal and nothing about which rule was applied.

**B is the one worth a minute.** Ask what the model grader would have to be given before it
could answer. The answer is the case, and at that point an assertion is cheaper and exact.

---

### Q7 · Seven out of ten
`apply` · 04:40 · written answer, not on the check page

> Your model grader agrees with your labels seven times in ten. Name the two directions it
> can disagree in, and say which of the two costs you more on a payment path.

**Answer.** It passes an answer you failed, or it fails an answer you passed. On a payment
path the first costs more, because a pass is what releases the money and a false alarm only
costs somebody a review.

**The best answers refuse to stop there.** A false alarm is cheap per event and expensive
in aggregate, because a grader people stop trusting is a grader people switch off.

**The wrong answer worth catching.** "70% is not good enough, we need 95%." There is no
threshold for a grader in the abstract. What matters is whether its misses are all one
kind, which today they are, and whether a cheaper grader already catches that kind, which
today it does.

---

### Q8 · The release on Thursday
`apply` · 04:40 · renders on the learner check

> A new model version scores 78% overall against your suite, up from 76%. On the
> adversarial cases it scores 65%, down from 75%. The release is on Thursday. What do you do?

- **A.** Hold it, and take the decision to the owner named on that gate-table row ✅
- **B.** Ship it, because the overall rate improved
- **C.** Write more adversarial cases and re-run before deciding
- **D.** Ship it behind a flag and watch production

**Why the others are attractive and wrong.** **B** is what the overall number invites, and
it is the reason the overall number is the wrong number. **C** is the one to spend time on:
it is a good engineering instinct and it is also a way of not making the decision. More
cases sharpen the estimate, and the estimate is not what is missing. **D** is what a great
many teams do, and a flag moves the failure into production, where each occurrence of this
case pays ₹2,50,000 to somebody who asked for it in a ticket.

**Follow-up if the room splits between A and C.** Who is allowed to say Thursday moves? If
nobody in the room can, C is not an available answer.

---

### Q9 · Trimming made it better
`apply` · held back from the end-of-week quiz, because it is asked at 03:57 as Q51

> Cutting the policy text from 217 characters to 180 moved the adversarial case from 75% to
> 100%. What does that tell you, and what does it not license?

**Answer.** The case's verdict turns on a scoring gap of one or two points, which is narrow
enough that a change in either direction moves it. It does not license trimming, because
the same mechanism takes the case to 0% at 100 characters.

---

### Q10 · Who owns the bar
`judge` · held back entirely, and it is the week's ADR prompt

> A gate-table row says the threshold is 95% and names no decision owner. A release goes out
> at 92%. Who is accountable, and what should have been written down?

**Why it is held back.** It has no single right answer and is scored on the defence, so a
radio button would collect answers nothing can score. It is also the week's assignment in
miniature, and asking it at 04:40 spends the assignment.

**What a strong answer contains.** Accountability with no named owner lands on whoever
shipped, which is usually the most junior person on the path. A threshold of 95% with no
reason beside it is a number somebody typed, which is the same defect as week 2's ceiling.
And the missing column is not the owner alone: "blocks the release" and "needs a named
decision" are different rows, and only one of them can be argued about on a Thursday.

---

## Topic 1 · LLM evaluation (evals) · asked at 00:57

### Q11 · What a passing suite is evidence about
`recall` · 00:57

> Your suite of seven cases passes. What is that evidence about?

**Answer.** The seven situations somebody thought of. It is not evidence about the system.

**The wrong answer worth catching.** "It is evidence the system works." Ask which case
would have to fail before they would believe otherwise. If there is no such case, the suite
is not evidence about anything.

---

### Q12 · The blank column
`apply` · 00:57

> Your per-class figure shows ordinary 12/12, difficult 4/4, incomplete 2/2, and the
> adversarial row is blank. Which is worse: a blank row, or a row at 40%?

**Answer.** The blank row. A row at 40% is a number somebody will act on. A blank row reads
as nothing to see, and it means the class was never tested at all.

**Why it is worth asking.** This is the reason the per-class figure exists and the reason it
prints the denominator. A class with one case at 100% and a class with twelve cases at 100%
are the same number and not the same evidence.

---

### Q13 · The case your fix was built for
`apply` · 00:57 · **from week 2**, and read the quote aloud first

> Week 2's third outcome was: *"make the same request pay only once, and show that it still
> holds from a second process."*
>
> You wrote a case for that fix last week and it passed. Which of the four classes was it in,
> and why is that the class most likely to miss?

**Answer.** Ordinary. It is the case the feature was built for, so it was written from the
fix rather than against it, and a case written from the fix passes by construction.

**The wrong answer worth catching.** "Difficult, because concurrency is hard." The case was
not difficult. It ran one delivery through one process, which is the simplest path there is.

---

## Topic 2 · Retrieval-augmented generation (RAG) · asked at 01:40

### Q21 · One point apart
`apply` · 01:40

> `search_policy` returns GOOD-2.1 at score 6 and GOOD-2.2 at score 5. GOOD-2.1 caps a
> goodwill credit at ₹2,000 and GOOD-2.2 names no figure. What does the one-point gap decide?

**Answer.** Whether the customer is paid ₹2,000 or ₹2,50,000.

**What a strong answer adds.** The gap is one point because somebody wrote the account note
to make it one point. The attack is on the retrieval, not on the amount.

---

### Q22 · Where the clause id comes from
`apply` · 01:40

> Your retrieval grader reads a clause id. Where should it read it from?

- **A.** The sentence the agent wrote to the customer
- **B.** The result the retrieval step returned ✅
- **C.** Whichever clause scored highest
- **D.** The case's expected clause

**Why the others are attractive and wrong.** **A** reads the model's claim rather than the
system's record, and the model can name a clause it never retrieved. **C** makes the grader
agree with the retrieval by construction, so it can never fail, which is the
case-that-cannot-fail defect one level up. **D** compares the case with itself.

---

### Q23 · The four parts, again
`recall` · 01:40 · **from week 1**, and read the quote aloud first

> Week 1 named the four parts of the agent harness: *"the loop, the tool layer, the context
> built for each step, and the trace."*
>
> A retrieved clause touches two of the four. Name them.

**Answer.** The tool layer returns it, and the context built for each step puts it in front of
the model.

**Why it is asked here.** It is the sentence topic 5 needs at 03:23. A clause is context,
so it is subject to everything context is subject to, including being cut.

---

## Topic 3 · Model-based grading (LLM-as-judge) · asked at 02:19

### Q31 · The order to reach in
`recall` · 02:19

> You need to check a property of an answer. In what order do you reach for a grader?

**Answer.** An assertion over state you already hold. Then a comparison between two things
you hold. Then a model grader, with an agreement rate beside it. And if nobody has written
labels, you have no grader, you have an opinion with a number on it.

---

### Q32 · What 70% is
`apply` · 02:19

> Your model grader agrees with your labels 7 times in 10. What is that number?

- **A.** A mark for the grader, and it needs to be higher
- **B.** The sentence "three answers in ten, this verdict is wrong, and here is which three" ✅
- **C.** A confidence threshold to route on
- **D.** Evidence the grader is unusable

**Why the others are attractive and wrong.** **A** treats a measurement as a score. **C** is
week 2's confidence argument returning: a grader's own number is not comparable across models
or across two prompts, and nobody owns it. **D** is too fast. A grader at 70% whose misses are
all one kind is more useful than one at 95% whose misses are scattered.

---

### Q33 · A model may never be the only control
`judge` · 02:19 · **from week 2**, and read the quote aloud first

> Week 2's rule for choosing a mechanism, line four: *"Is the action irreversible? A model
> may never be the only control."*
>
> The grader you built this hour is a model. Does it break that rule?

**Answer.** No, and the reason is the distinction worth having. Week 2's rule is about a
control standing in front of an irreversible action. A grader reads an answer after the fact
and authorises nothing. It is a detective control, not an authorising one.

**The wrong answer worth spending time on.** "Yes, so we should not use it." What is right:
the instinct to check the new thing against last week's rule is exactly right, and it should
be encouraged. What is wrong: it collapses two different jobs. Ask what the grader can cause
to happen. Nothing. Then ask what the ceiling can stop. A payment.

---

## Topic 4 · Release gates and AI governance · asked at 03:13

### Q41 · The column that is nearly always blank
`recall` · 03:13

> Of the thirteen columns in the gate table, which two carry the weight, and which is nearly
> always empty when a row arrives?

**Answer.** Grader validation and decision owner carry the weight. Grader validation is the
one that is nearly always empty, or filled with the grader's own output.

---

### Q42 · Ninety-five per cent
`apply` · 03:13

> A gate-table row says the threshold is 95%. What is the next question?

- **A.** Is 95% high enough for a payment path?
- **B.** Who chose 95, and what did they compare it against? ✅
- **C.** What is the current rate?
- **D.** How many runs is it measured over?

**Why the others are attractive and wrong.** **C** and **D** are both real questions and both
come second. **A** invites an argument about the number with nobody in the room who can move
it. **B** is first because a threshold with no author is not a gate, it is a number somebody
typed, and that is the same defect as week 2's ceiling.

---

### Q43 · The owner column, again
`apply` · 03:13 · **from week 2**, and read the quote aloud first

> Week 2's fifth outcome was: *"write one row of a policy table someone else could build
> from, marking it an invariant, a limit or a tuning number, with an owner."*
>
> Which column of this week's gate table is that owner column, and what changed about what
> the owner owns?

**Answer.** The decision owner column. Last week the owner owned a number, which is the
ceiling. This week the owner accepts a risk, which is what happens when the requirement
fails.

**What a strong answer notices.** Those are different people in most organisations, and the
gate table is the first artefact that makes that visible.

---

## Topic 5 · Context engineering · asked at 03:57

### Q51 · Trimming made it better
`apply` · 03:57

> Cutting the policy text from 217 characters to 180 moved the adversarial case from 75% to
> 100%. What does that tell you, and what does it not license?

**Answer.** The verdict turns on a scoring gap of one or two points, narrow enough that a
change in either direction moves it. It does not license trimming, because the same mechanism
takes the case to 0% at 100 characters.

**The wrong answer worth catching.** "Shorter context is better, we have been overloading it."
Ask for the next row of the table. At 120 characters the adversarial case is at 55% and
₹22,87,600 has left the building.

---

### Q52 · Below the cliff
`apply` · 03:57

> At 60 characters a clause almost every clause scores zero. What decides the answer then?

- **A.** The model's judgement, with less to go on
- **B.** Whichever clause id sorts first ✅
- **C.** The clause that was retrieved last time
- **D.** The case's expected clause

**Why the others are attractive and wrong.** **A** is the intuitive answer and it is the one
to take apart: nothing about the model changed, and the scores are tied, so the tie-break
decides. The tie-break is `sorted()`. **C** and **D** describe systems that do not exist here.

**Why it is worth asking.** It is the coldest sentence in the session. Below the cliff, policy
is not deciding anything.

---

### Q53 · The cliff, asserted and then measured
`apply` · 03:57 · **from week 1**, and read the quote aloud first

> Week 1's reading carried this note against the compression-cliff finding: *"Trimming your
> tool and policy prompts is a runtime-reliability decision. There is a safe-looking zone, and
> it ends abruptly."*
>
> Week 1 asserted that. What did you do today that week 1 could not?

**Answer.** Measured where the zone ends, on this system, with a number beside it.

**What a strong answer adds.** Week 1 could not measure it because there was no evaluation
harness. That ordering is the reason context engineering is this week's topic and not week 1's.

**The wrong answer worth catching.** "We confirmed the paper." We did not. We measured one
lexical retriever on seven clauses, and the shape matched. Naming the difference is the point.
