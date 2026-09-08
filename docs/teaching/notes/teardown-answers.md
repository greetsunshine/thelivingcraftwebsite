# The teardown's five questions, and what a good answer contains

*Teaching notes for week 1 §4. Not learner-facing — the learner page carries the
questions and nothing else, deliberately. These are for you, at 03:40, when each
pair brings its sharpest answer back to the room.*

**Do not display these.** The pairs produce the answers; your job is to know what
a good one contains so you can tell the difference between a room that has got
there and a room that has stopped early. Every question also has a line back to
something they watched earlier in the day — make that connection out loud,
because almost nobody makes it on their own.

The system, restated: ~40,000 disputes a month, a payments service that writes to
the ledger of record, an approval queue for large credits, several business units
sharing one deployment, a four-hour SLA, and an audit obligation.

---

## Q1 · The retry that pays twice

> `issue_credit` times out mid-call. The agent retries. Did the customer receive
> ₹1,200 or ₹2,400 — and how would you know? Design the fix, and say which
> component owns it.

**The half rooms answer well.** Idempotency. Full treatment is in the *One slow
night* note — the key must be derived from something stable across runs (the
request id on the queue message), not minted inside the run with `uuid4()`; and
the check belongs at the point of write, not in the model's head.

**The half rooms skip: *how would you know?*** Press on this, because it is the
more useful question. A timeout tells you **nothing**. You do not know whether
the write landed. So there are only two honest positions:

1. **Ask.** Query the provider with the same key and find out what happened.
   This requires that the key existed before the first attempt, which is the same
   requirement as the fix — so the answer to "how would you know" and the answer
   to "how do you prevent it" turn out to be one mechanism.
2. **Make the question not matter.** If the write is idempotent, you can retry
   without knowing, which is why idempotency is a reliability property and not
   just a correctness one.

**Who owns it.** The queue supplies a stable id. The tool carries it to the
provider. The provider — or a unique constraint on your own ledger — enforces it.
**The model owns none of it**, and a room that puts the check in the prompt has
answered a different question.

**Connect back:** this is `make retry`, running across forty processes instead of
one. The version that works on one process — a ledger file the agent reads before
paying — is exactly the trap on the learner page.

---

## Q2 · The blast radius of a good deploy

> Someone improves the policy text. It ships on a Tuesday. By Thursday, 40,000
> disputes have been processed under it. Nothing errored. What would have had to
> exist on Monday for this to be survivable?

**The reframe that has to happen:** the policy text is **code**. It changes
behaviour across every run, it shipped without review that could catch a
behaviour change, and nothing recorded which version decided what. This is the
deploy-scoped bucket from *context is state*, and it is the bucket people forget
because it does not look like state.

**A good answer contains at least three of these four:**

- **A version stamped on every decision.** Each credit row carries the policy
  version and a hash of the prompt that produced it. Without this, *"which
  disputes were affected?"* has no answer, and the remediation is all 40,000
  rather than the 900 that actually changed behaviour. This is the cheapest item
  on the list and the one nobody has.
- **An evaluation set that runs before the deploy.** You cannot review a prompt
  change by reading it — reading tells you nothing about its behaviour across
  40,000 tickets. This is week 3, and it is the honest answer to "nothing
  errored": nothing errored because **there is nothing that could error.** No
  expected outcome is written down anywhere.
- **A staged rollout.** One per cent of disputes for a day. Not because anyone
  will spot the difference at one per cent, but because it **bounds the number
  you have to remediate** to something a team can actually contact.
- **A way to answer "what changed?"** A diff of the policy text in the same
  review surface as the code diff, with an owner. Prompts kept in a Google Doc
  and pasted into a deploy are the normal case and they have no history.

**Common wrong answers:**

- *"More careful review of the prompt."* Reading a prompt does not tell you its
  behaviour distribution. This is the same category error as "use a better
  model" — it changes the odds, not what is possible.
- *"Monitoring."* Ask what metric moves. Credit volume is seasonal, error rate is
  zero by construction, and the failure is that **the right amount was paid to
  the wrong decision**. Nothing in an ordinary dashboard has a shape for that.
- *"A rollback."* Necessary, insufficient. You can roll the policy back; you
  cannot roll back 40,000 credits, and without a version stamp you cannot even
  list them.

**Connect back:** this is the grep from 02:00, at scale. *The only thing in this
system that states an expectation is the attacker.* A deploy that changes
behaviour and cannot be checked against an expectation is the same hole, wearing
a change-management costume.

---

## Q3 · The question eight months later

> A regulator asks why one specific account was credited. What does the audit
> trail have to contain to answer that — and is a stored prompt and completion
> enough?

**The answer is no, and there are three reasons. Nobody gets the first one.**

1. **The reasoning is not stored.** `agent.py` prints the `thought` and throws it
   away — it never enters `history` and never reaches the next prompt. If anyone
   was planning to show a regulator the model's stated reasoning, **it does not
   exist.** Make this connection for them; it is the sharpest moment available in
   this question and it lands because they watched it in block 1.
2. **The prompt is not reconstructible.** It was assembled at run time from an
   account record that has since changed. A stored completion without the exact
   inputs shows you what the system *said*, not what it *saw* — and the whole
   defence turns on what it saw.
3. **A prompt and a completion are not a decision.** The decision is: which tool
   was called, with what arguments, against which policy version, under whose
   authority, and what the tool actually did downstream.

**What the trail has to contain, captured at the time:**

the ticket as received · every tool call with its arguments and its result · the
account record **as read**, with an `as_of` timestamp · the policy and prompt
version · the model identifier *and* its version string · who approved it, if it
went through the queue · the ledger reference the payment produced.

**The asymmetry that makes this architecture rather than operations:** none of it
can be added retrospectively. Eight months later the account record has changed
and the model version has been deprecated by the provider. Either it was captured
at the time or the question is unanswerable — and "we cannot tell you" is a
different conversation with a regulator than "here is why."

**Common wrong answers:**

- *"We log everything."* Ask them to produce the account balance as it was at
  21:42 on the fourteenth. Logging the request and response is not logging the
  inputs.
- *"The model can explain it."* Asking the model afterwards produces a **new,
  plausible story**, not the reason. It has no memory of the run. This one is
  worth naming explicitly, because it is a genuinely popular idea.
- *"The trace has it."* Nearly — the trace is the right shape and it is printed
  to a terminal and discarded. Turning the trace into a durable, queryable,
  machine-readable record is week 3.

---

## Q4 · Where the human goes

> Approving every credit does not scale. Approving none is what we watched.
> Draw the line, and defend it in terms of money rather than confidence.

**The move that has to happen:** stop drawing the line on **confidence** and draw
it on **expected loss**. Confidence is a property of the model and it moves with
every release. Money is a property of your business and it does not.

**A defensible shape:** auto-approve below X, always route above Y, sample a
percentage in between. What makes it defensible is that X is *derived*:

> A human review costs roughly ₹200 of someone's time. A ₹1,200 credit with a
> 2% error rate has an expected loss of ₹24. Reviewing it is eight times more
> expensive than being wrong. **So auto-approve, and be able to say why.**

**The cost nobody computes: the queue itself.** At 40,000 disputes a month, every
percentage point you route to a human is a standing commitment to staff that
queue at four-hour SLA — including weekends and public holidays. A threshold that
sends 5% to review is a hiring decision. This is why Q4 and the drained-queue
problem are the same problem seen from two ends.

**The better second axis, and the one to push a strong room toward:
reversibility, not amount.** A ₹2,50,000 credit that can be clawed back within
24 hours is cheaper to get wrong than a ₹1,200 one that cannot. That is drill 2
arriving at enterprise scale — the grade describes what the action reaches, and
the approval rule should key off the grade rather than off the number.

**Common wrong answers:**

- *"Approve above ₹50,000."* Ask where the number came from. If the answer is
  "it felt right", that is exactly the boundary nobody agreed to, which is the
  week 2 opening.
- *"Approve when the model is unsure."* The model's stated confidence is not
  calibrated, and it is produced by the same process that produced the answer.
  You are asking the thing that might be wrong whether it is wrong.
- *"A human checks a sample afterwards."* Useful, and it is detection, not
  control. Ask what happens to the money in the meantime.

**Connect back, and this is the part that makes the question bite:** an
amount-based rule would have caught the ₹2,50,000 — it was one enormous decision.
It would **not** have caught the ₹3,600, which was three perfectly ordinary
₹1,200 credits. Any threshold they propose should be tested against both.

---

## Q5 · When the model is down

> The provider has an outage. Queue, fail closed, or fall back to rules — and
> what do you tell the customer waiting inside a four-hour SLA?

**The first thing to say: these are not three options to choose between. They are
three different failure modes, and a real answer uses more than one.**

- **Queue it.** The SLA breaks silently at hour four, and it breaks for
  *everyone at once* rather than for a few disputes.
- **Fail closed.** Every dispute escalates. The approval queue you sized for 5%
  now receives 100% of the volume, so the outage has moved rather than been
  handled.
- **Fall back to rules.** You have quietly shipped a **second decision system**
  that nobody evaluates and that will be wrong in different ways than the first.
  This is the trap: teams build the fallback quickly, with direct database
  access, "because it is simple."

**The thing that must not change, whichever they pick:** the money boundary. **A
fallback path may never have more authority than the primary path.** A rules
engine that can pay without approval, written in an afternoon during an outage,
is how the boundary you spent all day drawing gets walked around.

**The ₹0 connection, and make it explicitly:** failing closed is not free. A
customer owed ₹1,200 gets nothing, the trace is clean, no alert fires. **A
boundary that refuses everything is not a boundary, it is an outage with better
manners.** So "fail closed" is only an answer if something *counts* the refusals
and alerts on the count — which is drill 1, at scale.

**What you tell the customer.** The honest framing: the SLA is a promise about
the **system**, not about the model, so the design question is what the system
can still promise when the model is gone. Usually: acknowledge immediately, give
a real revised time rather than a hopeful one, and route to a person. What you
must not do is hold silently — that is the same failure as the ₹0, with a
customer attached.

**Common wrong answers:**

- *"Retry with exponential backoff."* Correct and insufficient. It does not
  answer hour four.
- *"Switch to a backup model."* Good instinct, and now say what it costs: two
  models with different failure modes, one eval set, and a fallback that is
  exercised only during incidents and therefore never tested. That is the
  bake-off from block 3, at enterprise scale — they watched two models disagree
  about whether to give away money on identical inputs.

---

## If you only make three connections

Time will be short. These are the three that are worth protecting, in order:

1. **Q3 — the reasoning is not stored.** Nobody spots it, it is specific to what
   they watched, and it is the one a board actually asks.
2. **Q5 — failing closed is the ₹0.** It stops the whole room over-correcting
   into "refuse everything", which is the natural reaction to four hours of
   watching money leave.
3. **Q4 — an amount rule catches the ₹2,50,000 and misses the ₹3,600.** It is the
   cleanest demonstration all day that a boundary has to be designed against the
   failures you have actually seen.
