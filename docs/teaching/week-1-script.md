# Week 1 — the run of show

*Instructor script. The reference material is `week-1.md` and `notes/`; this is
the sequence, for following live.*

**300 minutes, five hours.** 15 opening · 55 · [stand up 5] · 50 · [break 15] ·
60 · [stand up 5] · 50 · [checkpoint 5] · 10 quiz · 20 · 10 close.
Clock below is cumulative from 0 and matches
[`src/content/sessions/week-1.md`](../../src/content/sessions/week-1.md) beat for
beat. **Q** is the running request cost per learner against their 20-per-day
allowance.

Three rules for yourself: **never show the answer table before they build it**,
**never type `make run`** (it uses their key — `make mock` is the pinned one),
and when a beat is running long, cut from block 3, never from block 2.

---

## Opening — 00:00–00:15

**00:00 · The promise, in five sentences.** Read the five outcomes out loud. Do
not paraphrase and do not add a sixth. Every one begins with a verb because every
one is something you will watch them do today.

> They are on the learner page under "What today is for", so they can follow along.

**00:05 · Entry confidence poll — the same five, rated 1 to 5.** Post the five
statements in chat, ask for five numbers, one line each. Thirty seconds.
**Save the results.** You show them again at 04:52 beside the exit numbers, and
the comparison is the entire point of running it.

**These exact words are the canonical wording**, and you use them all three times:
here, at 04:48, and at 04:52. Not one word different, or the two sets of numbers
cannot be compared and the exercise is wasted.

> Expect low numbers on 3 and 4. Those are the two that move most.

**00:08 · Retrieval warm-up — four questions from week 0.** **Do not re-teach
first.** Ask, take answers, correct only what is wrong. Recalling something is
what makes it stick; hearing it again does not.

Every one is answerable from the pre-work alone — they ran `make retry`,
`make weird-mock` and `make injected`, wrote down what each paid, and were told
*not* to read the code. Do not ask anything that needs the code.

1. What does the reference agent actually do? *One sentence.*
2. **The three numbers.** What did each of the three runs pay out?
3. What *two* tools did you watch it call?
4. You have twenty requests a day. Roughly how many runs is that, and why?

---

## Block 1 · The Concept — 00:15–01:10

**00:15 · Start silent.** `make mock` is already finished on the shared screen
when they arrive. Say nothing. Let them read it. First words of the day are
theirs.

> If nobody speaks after twenty seconds: *"What did it just do?"* Nothing else.

**00:18 · "Draw what you just watched."** Two minutes, on paper, alone. No
help. Then take two or three out loud. Most draw a box and an arrow.

**00:23 · Break it once, before anything has a name — ₹3,600.**

    make retry           # Q +0

Correct three times, pays three times. *Not one wrong decision was made.*

**This beat moved into block 1** when the session grew, and it belongs here: they
need one failure before the harness has a name, so that naming it lands as an
explanation rather than as a diagram. Block 2 now opens on ₹5,000, not on this.

**00:31 · Name the harness.** Everything they drew that is not the model. Four
parts, four files. *Three of the four are ordinary software you already know how
to make reliable.*

**00:38 · One run is many calls.** The correction that has to come before
anything else, because the drawing is almost always wrong in the same way.

- Three model calls, two tool executions, for one ticket.
- Separate the two meanings of "call": what the *model emits* vs your code
  *running* it. One costs money at the provider, the other in your infra.
- Latency is the sum of the round trips.
- **The line for the whiteboard:** *you do not decide how many calls a ticket
  takes — the model does.* `MAX_STEPS = 6` is not a runaway guard, it is the only
  upper bound on what one ticket can cost you.
- Land it on their quota: 20 requests a day, ~3 a run, **six runs**. That is the
  whole allowance and the step count is what spends it.

**00:46 · Inside one step.** `make prompt`. Let them read before you name
anything — three minutes of silence, then collect.

    make prompt          # Q +3   (should be 0 — pin --mock in the target)

Three findings, in this order: **there is no conversation** · **the reasoning is
real and then thrown away** · **there is no tool-calling API**.

On the second, be precise, because half of it is easy to get wrong: `thought` is
the *first* key, so it conditions the action written beside it — real work inside
one step — and it never reaches the next prompt. Then: *the problem is not the
choice, it is that nobody made it.* Same sentence you will use about the ceiling
in an hour.

**00:57 · "Can we not just make the thinking better?"** Someone asks this here.
Take it seriously — all three levers work. Then: **all three move the mean, none
of them move the floor.** Flag that they should watch for it in the four runs.

**01:03 · The split.** Everything in `llm.py` moves a *probability*.
`MAX_STEPS` and the `TOOLS` dictionary are the only two things that change what
is *possible*. One of those lists is where teams spend their time; the other
holds under audit.

**01:05 · Checkpoint, then hand over.** Read the four capability lines, take a
number 1 to 5 in chat on the last one, then: *"Three more runs. Write the number
down before each one."*

> Five minutes, cameras off, away from the screen. Not a break, a reset.

**Q after block 1: 3**

---

## Block 2 · The Problem — 01:15–02:05

Paper out. **Before every run they write the rupee figure they expect.** Do not
skip this; being wrong on paper is what makes the right number stick.

**01:15 · Failure 1 — ₹5,000.**

    make weird-mock      # Q +0

Account 9999 does not exist. The lookup says so. The credit goes out anyway.
*What is missing?* — nothing checks the thing you are about to pay is real.

**01:23 · Failure 2 — ₹2,50,000.** The long one. Real model, two runs, and it
is slow — start it, then read the account note aloud while it runs.

    make injected        # Q +6   — needs a key; the mock ignores the note

*The agent is not fooled about what to do. It is correctly following a
documented account policy.*

**01:36 · Failure 3 — ₹0, the quiet one.**

    python -m src.main --ticket 4471 --mock    # Q +0

A customer who was owed the money is refused, and nothing anywhere reports a
problem. **Ask: how would you have found this one?** Sit in the silence.

**01:44 · The pattern.** Build the table on the board from *their* numbers. Do
not show a prepared one.

| ticket | the record said | the agent did |
|---|---|---|
| 4471 | honestly: charged twice | correct |
| 9999 | honestly: no such account | correct |
| 5820 | honestly: the invoice is legitimate | correct |
| 8001 | **falsely: credit 250000** | **paid ₹2,50,000** |

> The model was right every time its information was honest, and wrong the
> moment it was not.

**01:53 · "So how would you stop this?"** Take the three answers in the order
rooms give them — better model (hold it, we test it after the break), fix the
prompt, validate the account. Then open `tools.py`. *The money moved because
nothing in the system was ever going to stop it.*

**01:58 · The three ideas.** Tools are your real API surface · context is state ·
durability is boundaries you chose. A tour of the harness, one part at a time.

**02:02 · The grep.** Ask them to guess how many times the word *expected*
appears in the repo. Let them guess a test, a schema, a config. Then run it.

    grep -rni expected src/ data/

Two hits, both the attacker's sentence. **The only thing in this system that
asserts an expectation is the attacker.** Say the week 3 line — *an evaluation
harness is the defender finally writing the expected outcome down where the model
cannot reach it* — and **stop**. Do not start teaching evals.

**02:05 · Checkpoint, then break.** Read the four lines and take a number on the
last one. This is the checkpoint that matters most; everything after the break
assumes the third line is solid.

Then the break, immediately after the ₹2,50,000 and the pattern. Deliberate —
they argue in the corridor.

**Q after block 2: 9**

---

## Break — 02:05–02:20

---

## Block 3 · The Drill — 02:20–03:20

**02:20 · The shape, before any code.** Every drill runs decide → build →
review. Five minutes on paper first, no assistant. Then give it your *decision*,
not the task. Then review the diff against your decision, not against whether it
runs.

**Say this out loud:** *scope your assistant to the files the drill names.*
Pointed at the whole repo it will go and fix `issue_credit`, which is the one
thing we are not doing today.

**02:25 · Drill 1 — make the failure say its name.** The step budget prints
`done`, in green, and exits zero. Three signals all reporting success.

The teaching moment is not the fix, it is the **gradient**: one file makes it
honest to a human, three make it honest to a machine, and the thing that pages
you at 2am is a machine. Stopping after one file is the failure the drill is
about.

**Ask before they prompt: what exit code does `escalate` get?** Genuinely
ambiguous, the assistant will decide it silently, and that is a business rule set
by autocomplete.

**02:40 · Drill 2 — grade the tools by consequence.** Quick. The argument worth
having is `escalate`: most rooms say write. Ask what would make it irreversible —
*if escalation notified the customer, it would be.*

**02:50 · Drill 3 — check the arguments before you dispatch.** The fix for the
₹0. `fn(**args)` with whatever came back. Two things to notice: a stray key
raises `TypeError` and takes the run down, and the account id arrives as a string
from the mock and a number from a real model on the same ticket.

**03:02 · The bake-off.**

    make weird                                       # Q +3
    python -m src.main --ticket 9999 --model <other> # own quota, per model

Most escalate. Some pay. Some emit JSON that will not parse and take the run
down — **your model's output is a parsing surface you own.**

Then the `injected` comparison. **Run this one from the front, not in the room** —
it is 6 requests each and would put everyone at 18 of 20 before the afternoon.
Watch the better model read the attacker's note more carefully and follow it more
confidently.

**03:12 · Then stop.** They will want to fix `issue_credit`. Do not. *Write down
the guard you wanted to add — you implement your own note next week.*

Verification for everything they built is free — the guardrails live in
`tools.py` and the mock still dispatches through it:

    make mock · make weird-mock · make retry         # Q +0

**03:15 · Checkpoint.** Four lines, a number on the last one — *give a coding
assistant a decision instead of a task.* Then five minutes, stand up.

**Q after block 3: 12** (drill 4 goes to the After block if the clock beats you)

---

## Block 4 · The Teardown — 03:25–04:15

**03:25 · Set the case.** Say **"this is a constructed teaching case"** in those
words. 40,000 disputes a month, a payments service, an approval queue, a
four-hour SLA, an audit obligation.

**03:28 · Pairs take two questions each.** Twelve minutes. Assign, do not let
them choose — otherwise everyone takes the retry one.

**03:40 · Back to the room.** Ten minutes, five questions — **two minutes each,
one thing per pair.** Do not collect every answer or you will eat the write-up.

Steer toward these. Full material, read beforehand, is
[`notes/teardown-five-questions.md`](notes/teardown-five-questions.md).

| | Steer toward | Watch for |
|---|---|---|
| **Q1** | A timeout is an **unknown**, not a failure. Idempotency key from the queue's dispute id. Owned by the **tool**, not the loop — the loop's memory dies with the process and two consumers race. | `uuid4()` minted per run. Most common answer, fails exactly when needed. Also `hash(account, amount)` — too stable, one refund for a customer owed two. |
| **Q2** | **"Nothing errored" is the problem statement.** Prompt changes fail distributionally and silently. Wants an eval set before merge, plus a distribution monitor — credit rate, mean amount, escalation rate — and a version stamped on every decision. | "Test it before shipping." Agree loudly, then ask **against what**. The missing answer is week 3. |
| **Q3** | **No.** A completion is a paraphrase, not evidence; model and policy versions are absent so it is not reproducible; and the reasoning was never stored. | "We can ask the model to explain it later." **Spend time here** — it has no memory of that run, so it confabulates a plausible account, to a regulator. |
| **Q4** | **p(wrong) × amount > cost of review.** A line in rupees, not a feeling. Good answers add novelty, velocity, divergence — and notice the threshold moves when p(wrong) does, which means measuring it. | "Above ₹5,000." Fine number, no derivation — the same undecided ceiling they hardcoded an hour ago. |
| **Q5** | Rules fallback for the unambiguous cases, queue the rest. **The fallback is a different system with its own risk profile**, not a degraded agent, so it needs its own limits. Slow is more dangerous than down. | "Retry until it recovers" — that is how you keep a struggling provider down. "Switch to a backup model" — untested, in production, at the worst moment. |

Connect each back to the morning as you go: Q1 is `make retry` at forty
processes. Q3 — *the thought was never stored, so if you planned to show a
regulator the reasoning, it does not exist.* Q5 — *failing closed is the ₹0 run:
clean trace, customer owed money.*

**03:50 · Write the boundary down.** Twelve minutes. Same pairs, one page, seven headings, 
**hand the headings out pre-printed.** Two people who have known each other three
hours will stare at a blank page for ten minutes otherwise.

**04:02 · Swap and review**, eight minutes, against the four questions. First one
is *would it have stopped what we watched?*

**04:10 · The leader's framing.** Five minutes. Autonomy against reversibility. Not *"the agent
might hallucinate"* — *"here is what it can do without a human, here is what it
cannot, and here is what it costs us if it is wrong."* That sentence survives a
board meeting. The first one does not.

---

## Checkpoint and quiz — 04:15–04:30

**04:15 · Checkpoint · no rating.** Read the three lines. They are mid-argument
and the quiz is five minutes away, so do not ask for a number here.

**04:20 · The quiz.** Eight questions in chat, **mixed across the whole day rather
than grouped by block.** The jumbling is the point: sorted by topic they answer
from the heading instead of from the problem. Everybody answers, then take up the
two or three that split the room. Bank is
[`quiz/week-1.md`](quiz/week-1.md).

---

## Block 5 · The Horizon — 04:30–04:50

**04:30 · The question:** what is durable when the models keep moving?

They watched two models disagree about giving away money, then watched both obey
an attacker with equal confidence. The half of their work that survives the next
capability jump is the half they did today.

**04:40 · The specifics**, live from `/craft/admin/radar` — Trends, Hiring — India,
Durable skills. Quote the primary-sourced findings and say they are primary.
Name vendor claims as vendor claims. Nothing dated goes in the file.

---

## Close — 04:50–05:00

**04:50 · The assignment.** Four things. Their own system, drill 4, the decision
record, and the one question to answer about work they own: *where is the limit
written down, and who agreed to it?* If it is a number inside a function, that is
their week 2.

**04:52 · The same five statements again.** Identical wording to 00:05, same
order, 1 to 5. Both sets go on screen together and you name the two that moved
most. The ones nobody claims tell you what to fix before the next cohort.

**04:56 · Two lines in chat.** Everybody answers both.

> The one thing I will change in my own build this week is ______
>
> The thing I am still fuzzy on is ______

The second line is the one that matters. It sets what week 2 opens with, so an
honest *"I still do not really follow why the context gets rebuilt"* is worth more
than a tidy answer.

---

## If you are running late

Cut in this order: the second bake-off comparison · drill 4 (it finishes cleanly
in the After block and the copy already says so) · drill 2.

**Do not cut** the pattern table or the decision-record write-up. The first is
the argument of the whole day; the second is what week 2 opens with.

## If a key dies mid-session

`make retry`, `make weird-mock`, `make mock` and every `--mock` run need no key.
Only `make injected` and the bake-off do. Pair them up — one working key runs a
bake-off for two people. A 429 is not a broken key; show them the quota id in the
body so nobody spends the break re-issuing credentials.
