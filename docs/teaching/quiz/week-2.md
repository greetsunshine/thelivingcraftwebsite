# Week 2 — question bank

*Teaching material, not learner-facing. The learner surface shows the stem and the
options; everything else on this page is withheld by `toLearnerItem`.*

Eight items, and all eight are asked. Week 1's bank holds fifteen and the check
asks four, because eleven of them are prose that needs a room. This week's eight
are all multiple choice or short written answers that stand on a page with a
Submit button, which is why `quiz:` in the session file lists every one.

**They are deliberately out of order.** Sorting questions by topic lets somebody
answer from the heading instead of from the problem. Two of the eight are about
the limit, two about HITL, and one each about reliability, risk and governance,
and they are interleaved on purpose.

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
`judge` · hard, and **B** is the one that splits the room

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
`judge` · hard, and **A** is the vendor default

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

> One row of the policy table for your own system. Action, can it be undone, the
> limit, what happens over it, who moves the number, what happens when nobody
> answers. **Which cell could you not fill?**

**How to read the answers.** Not scored. The last two columns are where the gaps
are, and **"I could not fill the last one" is the correct answer for most of the
room**. That is the finding rather than a failure, and it is what the homework
sends them to go and check.

**What to watch for.** A row where every cell is filled confidently and the last
one says something like "it escalates" is usually a guess. Ask where in the code
that is written.
