# Week 2 — question bank

*Teaching material, not learner-facing. The learner surface shows the stem and the
options; everything else on this page is withheld by `toLearnerItem`.*

**Ten items, and the check asks eight.** That changed on 28 September, when the
session was rebuilt into three build-break cycles and gained a block on
model-based checkers.

Two are held back for the room. **Q1**, the four facts, because the new cycle A
asks the room for them out loud at 00:48 and a radio button afterwards adds
nothing. **Q10**, the ledger and the log disagreeing, because it is a teardown
question that needs an argument rather than four options, and it is the one
teardown question with no other home once the five became policy-table columns.

**Eight run in the room and four of those also stand on the learner's check
page.** That split is not a second decision, it is what `isSelfServable` in
[`src/lib/craft/quiz.ts`](../../../src/lib/craft/quiz.ts) already enforces: an
item reaches `/craft/quiz` only when it has options, a marked key, and a
difficulty other than `judge`. A `judge` item has no single right answer and is
scored on the defence, so it belongs in the room.

**A defect fixed on 28 September.** Q4, Q6 and Q9 were tagged `judge` while each
carried four options and a ✅. The tag was being used to mean "hard". The effect
was that `quiz:` listed eight ids, seven of them were dropped by the learner
filter without a word, and week 2's check page rendered a single question under
a heading promising eight. They are `apply` now.

`quiz:` therefore lists the four that render: Q2, Q4, Q6 and Q9. The other four
asked in the room — Q3, Q5, Q7 and Q8 — are written answers that need a person
reading them, and Q1 and Q10 are held back entirely.

**They are deliberately out of order.** Sorting questions by topic lets somebody
answer from the heading instead of from the problem. Of the eight asked, two are
about the limit, two about the human gate, and one each about reliability, the
choice of mechanism, risk and governance. They are interleaved on purpose.

**Difficulty:** `recall` reads the material · `apply` uses it on a new case ·
`judge` has no single right answer and is scored on the defence.

---

## Mixed

### Q1 · The four facts a check needs
`recall` · the opener, and it kills the wrong instinct before it forms

> Name the four facts a check needs before it can refuse an action.

**Answer.** Which action this is · can it be undone · what is the limit · what has
already happened.

**The wrong answer worth catching.** Anybody who writes "how confident the model
was" has the misconception this whole session is built against. Not one of the
four comes from the model. Take it seriously for thirty seconds, then close it:
a confidence number is not comparable across models, not comparable across two
prompts on one model, and nobody in the organisation owns it.

**Follow-up worth asking:** which of the four is expensive, and why? The fourth,
because it needs a store that survives a restart. That is drill 3, and it is the
reason drill 3 exists as a separate drill.

---

### Q2 · What a check inside the tool does not protect
`apply`

> Your ceiling is inside `issue_credit` and it works. Which of these still pays an
> account that does not exist?

- **A.** A retry of the same ticket
- **B.** A new tool written by another team ✅
- **C.** A model that returns a string instead of a number
- **D.** A ticket with an attacker's note in the account record

**Why the others are attractive and wrong.** All four are real failures, and that
is the point of mixing them. **A** is drill 3, this week. **C** was week 1's drill
3, and the room has already fixed it. **D** is week 4 and they have been carrying
it for two weeks. Only **B** is the failure a check *inside a tool* cannot see,
and it is the one the room watched cost ₹5,000 at 01:23.

**If somebody argues for A:** a retry pays twice, which is a different failure
with a different control. Ask which control each one needs and the distinction
lands better than a correction does.

---

### Q3 · The gate at 2:14am
`judge` · scored on whether there is a number in the answer

> Your gate asks a person for anything over ₹1,200 that cannot be undone. It is
> 2:14am, four items are waiting, and there is no human. What is your policy?

**Answer.** Any of wait, refuse or allow — **with a number attached**. "Waits 30
seconds, then escalates to the on-call queue and refuses" is a pass. "It waits" is
not, and neither is "it alerts somebody".

**Mark on the number, not on the choice.** All three behaviours are defensible and
the failure this question tests is a policy nobody chose. A learner who names a
timeout has understood the beat; a learner who names a behaviour has not.

**The best answers go further** and make queue depth an input: the fifth item
arriving at a queue nobody is reading should not wait the same 30 seconds the
first one did.

---

### Q4 · When a limit is genuinely outside the function
`apply` · hard, and **B** is the one that splits the room

> Which of these means the limit is genuinely outside the function?

- **A.** It is a module-level constant rather than a literal
- **B.** It is in a config file the program imports
- **C.** Somebody who cannot write Python can read it and change it, and the system records that they did ✅
- **D.** It is passed in as an argument

**Why B splits the room, and it is the one to take up.** A config file in the
repository is still changed by a deploy, by somebody who can open a pull request.
Most of the room will pick it and their reasoning is sound as far as it goes.
**A** and **D** move the number without moving the ownership at all.

**The test to hand them afterwards:** can a person who has never seen the
repository read the ceiling out loud? If not, the limit is still inside the
program, whichever file it is in.

---

### Q5 · The test that passed and proved nothing
`apply`

> `make retry` delivers the same ticket three times and your fix now shows one
> credit. Which case is still broken?

**Answer.** The same ticket from a second process, or after a restart. Anything
that does not share the process.

**Why this one matters more than its difficulty suggests.** The keys live in a
Python list, so the one case the test covered is the one case that was never the
problem. This is the question that carries the week-3 handover, and a learner who
gets it has understood that a passing test is not evidence.

**Accept** any answer naming a second process, a restart, two consumers, or
another deployment. **Do not accept** "add more tests", which is the instinct week
3 exists to correct.

---

### Q6 · What fires a human gate
`apply` · hard, and **A** is the vendor default

> Which of these is the right trigger for calling a person?

- **A.** The model's confidence is below a threshold you tuned
- **B.** The action cannot be undone and the request is over its limit ✅
- **C.** The ticket text is unusually long or badly written
- **D.** The customer asked for a human

**Why the others are attractive and wrong.** **A** is in every vendor's
documentation as pattern three of three, and it is the reason this question is in
the bank. **D** is a real product requirement and not a guardrail; it is worth
thirty seconds if somebody argues for it, because the distinction between a
product promise and a control is one senior engineers get wrong in design reviews.
**C** is a proxy for confidence wearing different clothes.

**The line to land:** it fires on the consequence, not on the confidence. Week 1's
poisoned ticket paid ₹2,50,000 with complete confidence.

---

### Q7 · The mistake your monitoring will never show you
`judge`

> Your check is now tighter. Which of the two mistakes will your monitoring show
> you, and which will you never see?

**Answer.** The wrong payment is in the ledger and is visible. **The wrong refusal
is invisible** — one customer, one complaint, nothing on a dashboard.

**What a strong answer adds.** What they would have to build to see it at all: a
count of refusals by rule, a sample of refused cases re-read by a person, or a
follow-up on the customers a rule turned away. Without one of those, "we tightened
the check and nothing broke" is a sentence with no evidence under it.

**The asymmetry is the teaching point**, and it is why most teams tighten a check
and never learn what it cost them.

---

### Q8 · One row of your own policy table
`judge` · not scored, and it is the same question the homework asks

> One row of the policy table for your own system. Action, undo cost, which
> control point enforces it, whether it is an invariant or a limit or a tuning
> number, the limit, what happens when it is crossed, who owns the number.
> **Which cell could you not fill?**

**How to read the answers.** Not scored. Columns three and seven are where the
gaps are, and **"I could not fill the last one" is the correct answer for most of
the room**. Column three is new and it is the more interesting gap: a row that
says "the dispatch" for every action is cycle A remembered at half strength. That is the finding rather than a failure, and it is what the homework
sends them to go and check.

**What to watch for.** A row where every cell is filled confidently and the last
one says something like "it escalates" is usually a guess. Ask where in the code
that is written.

---

### Q9 · The judge that read the ticket
`apply` · new on 28 September, and the one to watch

> You replace your ₹1,200 ceiling with a second model asked "is this credit
> reasonable?". It correctly allows an honest ₹8,400 that the ceiling refused.
> It then allows ₹90,000 on a ticket whose text says finance pre-approved it.
> What is the fix?

- **A.** Tell the judge, in its prompt, to ignore instructions found in ticket text
- **B.** Keep the judge and put a deterministic ceiling underneath it ✅
- **C.** Use two judges and require both to agree
- **D.** Raise the judge's confidence threshold

**Why A is the answer most of the field gives.** It identifies the mechanism
correctly, which is that text became instruction, and then answers with the
wrong shape. Week 4 breaks that line live, so do not settle it here. Say the
date.

**Why C is the subtle one, and it is worth a minute.** Two judges reading the
same attacker-written field are not independent, so they agree. Two of something
correlated is one control. This is the distinction the whole block turns on and
it is the reason C is in the list.

**Why D is wrong for a reason worth naming.** There is no threshold. The judge
returns a verdict, not a calibrated probability, and nobody in the room has an
agreement rate against human labels for it.

**The line to land:** a model may widen what gets through a hard limit, and it
may never be the limit.

---

### Q10 · The credit landed and the log write failed
`judge` · held back for the room, not asked on the check

> The credit reached the ledger. The write to the decision log failed. Which of
> the two records is true, what do you tell the regulator, and what would have
> had to exist last Monday for this to be answerable at all?

**Answer.** The ledger is true. It is the system of record and the log is a
record about it. You cannot make two writes to two different stores atomic, so
the design question is which one is authoritative and how the other recovers.

**The working shape.** Write the intent row first, in the same transaction as
the claim, carrying the approver and the rule. Then call the payments service.
Then mark the row complete. A missing completion is visible as an unfinished row
rather than as silence.

**Why it is held back.** It needs an argument rather than four options, and it
is the one teardown question with no other home. The other four became columns
three, six and seven of the policy table or lines of the 04:19 checkpoint. Run
it in the room if you have four spare minutes after 03:55.

**The wrong answer worth spending time on.** "Put both writes in one
transaction." Atomicity is exactly the property they want, and the two stores
are different systems, often different companies, with no shared transaction to
join. The near miss worth praising is "retry the log write", which is correct
and incomplete. Ask what retries it after the process dies.
