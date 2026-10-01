# Week 2 — question bank

*Teaching material, not learner-facing. The learner surface shows the stem and the
options; everything else on this page is withheld by `toLearnerItem`.*

**Twenty-two items, rebuilt 30 September against `docs/teaching/generation-prompt.md`.**
Q1 to Q10 are the original bank. Q11 to Q22 are the four topic quizzes, three
items each, asked at the end of each topic.

**Every item names the offset where it is asked**, on its first line after the
difficulty tag. The clock is `ROWS_W2` in `scripts/teaching-clock.mjs`.

| Offset | What is asked | Items |
|---|---|---|
| 00:48 | Out loud, not as a quiz item | Q1 |
| 01:35 | Topic 1 quiz | Q11, Q12, Q13 |
| 02:30 | Topic 2 quiz | Q14, Q15, Q16 |
| 03:09 | Topic 3 quiz | Q17, Q18, Q19 |
| 04:01 | Topic 4 quiz | Q20, Q21, Q22 |
| 04:15 | The teardown, as questions to pairs | Q8, Q10 |
| 04:40 | The end-of-week quiz, in this order | week 1 Q11, Q4, Q6, Q2, week 1 Q13, Q9, Q3, Q7 |
| not asked | Covered by Q18 at 03:09 | Q5 |

**The end-of-week quiz carries two questions from week 1's bank**, Q11 and Q13 in
`week-1.md`. They are asked from there and are not copied here, so each item has
one home.

**Four of the eight at 04:40 render on the learner's check page**: Q4, Q6, Q2 and
Q9, in that order. That split is what `isSelfServable` in
[`src/lib/craft/quiz.ts`](../../../src/lib/craft/quiz.ts) enforces: an item
reaches `/craft/quiz` only when it has options, a marked key, and a difficulty
other than `judge`. `quiz:` in the session file lists those four, in the order
they are asked.

**Every question from earlier material quotes it word for word**, inside the stem,
above the question. Q13, Q16, Q19 and Q22 are those items. In a live room nobody
goes and looks up last week's record.

**Keep every option on one line**, however long. The parser reads an option as
one line, and a ✅ that wraps onto the next line is dropped without an error.

**Difficulty:** `recall` reads the material · `apply` uses it on a new case ·
`judge` has no single right answer and is scored on the defence.

---

## Mixed

### Q1 · The four facts a check needs
`recall` · asked out loud at 00:48, not as a quiz item · it kills the wrong instinct before it forms

> Name the four facts a check needs before it can refuse an action.

**Answer.** Which action this is · can it be undone · what is the limit · what has
already happened.

**The wrong answer worth catching.** Anybody who writes "how confident the model
was" has the misconception this whole session is built against. Not one of the
four comes from the model. Take it seriously for thirty seconds, then close it:
a confidence number is not comparable across models, not comparable across two
prompts on one model, and nobody in the organisation owns it.

**Follow-up worth asking:** which of the four is expensive, and why? The fourth,
because it needs a store that survives a restart. That is topic 3, and it is the
reason topic 3 is a topic of its own.

---

### Q2 · What a check inside the tool does not protect
`apply` · asked at 04:40, fourth

> Your ceiling is inside `issue_credit` and it works. Which of these still pays an
> account that does not exist?

- **A.** A retry of the same ticket
- **B.** A new tool written by another team ✅
- **C.** A model that returns a string instead of a number
- **D.** A ticket with an attacker's note in the account record

**Why the others are attractive and wrong.** All four are real failures, and that
is the point of mixing them. **A** is topic 3, this week. **C** was week 1's third
lab, and the room has already fixed it. **D** is week 4 and they have been carrying
it for two weeks. Only **B** is the failure a check *inside a tool* cannot see,
and it is the one the room watched cost ₹5,000 at 01:12.

**If somebody argues for A:** a retry pays twice, which is a different failure
with a different control. Ask which control each one needs and the distinction
lands better than a correction does.

---

### Q3 · The gate at 2:14am
`judge` · asked at 04:40, seventh · scored on whether there is a number in the answer

> Your gate asks a person for anything over ₹1,200 that cannot be undone. It is
> 2:14am, four items are waiting, and there is no human. What is your policy?

**Answer.** Any of wait, refuse or allow — **with a number attached**. "Waits 30
seconds, then escalates to the on-call queue and refuses" is a pass. "It waits" is
not, and neither is "it alerts somebody".

**Mark on the number, not on the choice.** All three behaviours are defensible and
the failure this question tests is a policy nobody chose. A learner who names a
timeout has understood topic 2; a learner who names a behaviour has not.

**The best answers go further** and make queue depth an input: the fifth item
arriving at a queue nobody is reading should not wait the same 30 seconds the
first one did.

---

### Q4 · When a limit is genuinely outside the function
`apply` · asked at 04:40, second · hard, and **B** is the one that splits the room

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
`apply` · not asked this cohort · Q18 asks the same thing at 03:09

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
`apply` · asked at 04:40, third · hard, and **A** is the vendor default

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
`judge` · asked at 04:40, eighth

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
`judge` · asked at 04:15, inside the teardown · not scored, and it is the same question the homework asks

> One row of the policy table for your own system. Action, undo cost, which
> control point enforces it, whether it is an invariant or a limit or a tuning
> number, the limit, what happens when it is crossed, who owns the number.
> **Which cell could you not fill?**

**How to read the answers.** Not scored. Columns three and seven are where the
gaps are, and **"I could not fill the last one" is the correct answer for most of
the room**. Column three is new and it is the more interesting gap: a row that
says "the dispatch" for every action is topic 1 remembered at half strength. That is the finding rather than a failure, and it is what the homework
sends them to go and check.

**What to watch for.** A row where every cell is filled confidently and the last
one says something like "it escalates" is usually a guess. Ask where in the code
that is written.

---

### Q9 · The judge that read the ticket
`apply` · asked at 04:40, sixth · the one to watch

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
`judge` · asked at 04:15, as the teardown's fifth question · not asked on the check

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

**Why it is not on the check page.** It needs an argument rather than four
options. It is the teardown's fifth question at 04:15, and it is the one
question there that fills no column of the policy table row. Say so in the room.

**The wrong answer worth spending time on.** "Put both writes in one
transaction." Atomicity is exactly the property they want, and the two stores
are different systems, often different companies, with no shared transaction to
join. The near miss worth praising is "retry the log write", which is correct
and incomplete. Ask what retries it after the process dies.

---

## Topic 1 quiz · guardrails and policy enforcement

### Q11 · The caller that never meets the agent
`apply` · asked at 01:35 · topic 1 quiz, question 1

> Another team runs a nightly batch job that writes credits straight to the ledger. Which control point still refuses its bad credit?

- **A.** The check at the dispatch
- **B.** The check inside issue_credit
- **C.** A constraint at the ledger, the resource of record ✅
- **D.** A check at ingress, when the ticket arrives

**The likely wrong answer, and what is right about it.** **A**, the dispatch, which
is what most of the room built at 01:20. It does cover every tool the agent calls,
including tools nobody has written yet, and it is the strongest placement inside
this repository. It stops at the agent's edge, and the batch job never crosses it.

---

### Q12 · A rule in a field
`apply` · asked at 01:35 · topic 1 quiz, question 2

> Which of these belongs as a field in the policy row, rather than inside the checker?

- **A.** The account must exist
- **B.** The amount must be a positive number
- **C.** The ceiling for issue_credit ✅
- **D.** The target of a credit must be a real account

**The likely wrong answer, and what is right about it.** **A**, because the row at
01:25 was missing exactly that rule. They have found the rule that let ₹5,000
through. The fix is right and the place is wrong: a rule in a field is a rule
somebody can set to false.

**The test to hand them.** Could a reasonable person want this switched off for
one tool? Only the ceiling passes it.

---

### Q13 · A check from your own record
`judge` · asked at 01:35 · topic 1 quiz, question 3 · from week 1

> **Week 1 · the decision record · section 4 of 7.** "The design. The checks, in the order they run, and what each does when it fails: refuse, escalate, or ask a person. Say where the state lives."
>
> Pick one check from your own section 4. Is it a policy or a wish, and what one thing would make it a policy?

**Answer.** Most checks in a week 1 record are wishes: they say what should
happen and give no number. A policy has a number and a role that owns it. The
missing thing is usually the number, then the owner.

**The likely wrong answer, and what is right about it.** "It is a policy, because
it is written down in the record." Writing it down is the first of the three
properties, locatable, and most systems never get that far. But nothing can
enforce a sentence with no number in it.

---

## Topic 2 quiz · human-in-the-loop approval

### Q14 · Four items at 2:14am
`apply` · asked at 02:30 · topic 2 quiz, question 1

> It is 2:14am. Four approval requests are waiting and nobody is on the queue. Which answer is a policy?

- **A.** It waits until a person approves
- **B.** It alerts the on-call engineer
- **C.** It waits 30 seconds, then refuses and writes decided_by=timeout ✅
- **D.** It pays, because the customer is waiting

**The likely wrong answer, and what is right about it.** **A**, "it waits", which is
what most gates did at 02:24. Waiting is often the correct behaviour. What is
missing is the upper bound: waiting with no limit is not a rule, it is the absence
of one.

---

### Q15 · Before the ceiling goes down
`apply` · asked at 02:30 · topic 2 quiz, question 2

> You want to lower the ceiling from ₹1,200 to ₹800. What do you run before it blocks anybody?

- **A.** A unit test with a ₹900 credit
- **B.** The new rule in shadow mode on last week's disputes, counting the honest refunds it would refuse ✅
- **C.** A review of the change by a second engineer
- **D.** Nothing, because a lower ceiling is always safer

**The likely wrong answer, and what is right about it.** **D**. A lower ceiling is safer
in one direction, fewer wrong payments, and every signal you receive pushes that way.
The wrong refusals it adds are the mistake your monitoring never shows you. Shadow mode
prices them before a customer pays.

---

### Q16 · Which fact calls the person
`apply` · asked at 02:30 · topic 2 quiz, question 3 · from topic 1, 00:48

> **Topic 1 · 00:48 · the second of the four facts.** "Can it be undone · The grade you gave each tool in week 1" And below it: "If it cannot be undone there is no afterwards, and the only place a control can exist is before the call."
>
> Using the four facts from 00:48, which one decides whether an action may need a person before it runs?

- **A.** Which action this is
- **B.** Whether it can be undone ✅
- **C.** What the limit is
- **D.** What has already happened

**The likely wrong answer, and what is right about it.** **C**, the limit, because the
gate fires when a request is over the limit. The limit does decide when the gate
fires. But an over-limit action you can reverse needs no person, so the limit only
matters once the undo question has been answered.

---

## Topic 3 quiz · idempotency

### Q17 · What makes two requests the same
`apply` · asked at 03:09 · topic 3 quiz, question 1

> What makes two payment requests the same request?

- **A.** A uuid4 minted at the start of each run
- **B.** A hash of the account and the amount
- **C.** The dispute identity, chosen by the caller and carried on the request ✅
- **D.** The time the request arrived, to the second

**The likely wrong answer, and what is right about it.** **B**, a hash of the account
and the amount. It is stable across runs, which is the property most people are
reaching for. It is too stable: a customer genuinely owed two identical ₹1,200
refunds receives one.

---

### Q18 · What make retry never tested
`apply` · asked at 03:09 · topic 3 quiz, question 2

> make retry passed with one credit, and a second terminal then paid again. In one sentence, what did make retry never test?

**Answer.** A second process. All three deliveries ran inside one program, and the
keys lived in a Python list that dies with it.

**The likely wrong answer, and what is right about it.** "Concurrency: two requests
at exactly the same moment." Two processes at the same instant is a real case, and
the 03:03 constraint handles it. But the second terminal pays even a minute later,
with no overlap at all. A second process is enough.

---

### Q19 · The week 1 retry, answered
`apply` · asked at 03:09 · topic 3 quiz, question 3 · from week 1

> **Week 1 · the teardown · question 1.** "`issue_credit` times out mid-call. The agent does what every well-behaved distributed system does, and retries. Did the customer receive ₹1,200 or ₹2,400, and how would you know?"
>
> With the paid table from 03:03 in place, how would you know now?

**Answer.** Look the dispute's key up in the paid table. A row means the first
attempt was recorded, and the retry is refused with "already paid".

**The likely wrong answer, and what is right about it.** "Check the ledger for two
credits." The ledger is the system of record, so it is the right place to confirm
the outcome. It only tells you after the second payment has happened. The paid
table stops it happening.

---

## Topic 4 quiz · red-teaming

### Q20 · Four credits under the ceiling
`apply` · asked at 04:01 · topic 4 quiz, question 1

> In the adversary round, a pair sends ₹1,200 four times to one account. Which control you built today stops it?

- **A.** The ceiling of ₹1,200
- **B.** The human approval gate
- **C.** The idempotency key
- **D.** None of them ✅

**The likely wrong answer, and what is right about it.** **C**, the idempotency key,
because the requests repeat. The instinct that repeated requests are the problem is
right. But the key makes the same request pay once, and four different disputes are
four different requests.

---

### Q21 · In-band or out-of-band
`apply` · asked at 04:01 · topic 4 quiz, question 2

> A model judge takes about 400 ms. Where may it run in-band, and where out-of-band?

- **A.** In-band everywhere, because safety comes first
- **B.** Out-of-band everywhere, because nobody should wait
- **C.** In-band before a payment, out-of-band on a chat reply that can be stopped ✅
- **D.** Nowhere, because it is too slow to be useful

**The likely wrong answer, and what is right about it.** **B**. For text a person reads it
is often right: nobody waits and a stream can be cut. It fails exactly where the action
has no afterwards, because out-of-band needs a way to take the result back.

---

### Q22 · What the placement rule does not close
`judge` · asked at 04:01 · topic 4 quiz, question 3 · from topic 1, 01:30

> **Topic 1 · 01:30 · the rule the first lab exists to land.** "Move the control toward the thing being protected, not toward the thing being controlled."
>
> Which adversary route does this rule close, and which does it still leave open?

**Answer.** It closes route 2, a caller outside the agent. It leaves route 3 open
unless the constraint counts a total per account per day. Route 6, the ticket text,
is week 4.

**The likely wrong answer, and what is right about it.** "It closes all six.
Everything goes through the ledger." Covering every caller is exactly what the rule
buys. Covering every caller is not covering every pattern: four calls under the
ceiling pass a per-call constraint wherever it sits.
