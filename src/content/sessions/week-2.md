---
week: 2
title: "Agentic systems you'd put your name on — part 1"
module: M2
summary: "Put a check in front of the money, then find out what that check costs you."
status: draft
---

Last week you watched a tool that pays out money with nothing in front of it.
Today you put something in front of it. A check that runs before the money moves.

Then you spend most of the day on what that check costs. It refuses an honest
customer who is owed ₹8,400. A second piece of code walks past it without
calling it. And the fix that shows one payment on your screen still pays twice
when you run it from a second terminal.

**By the end of this session you will be able to:**

1. *Guardrails · the limit.* **Keep the limit outside the function.**
   Write a rule like "never credit more than one month's charge" in a file you
   can open and read. Do not bury it as a
   number inside the function that moves the money. Say who is allowed to change
   it. Week 1 ended with a question: where is the limit written down, and who
   agreed to it? This is the answer.
2. *Guardrails · the human gate.* **Stop an action you cannot undo, and record why.**
   Week 1 graded every tool as read, write or irreversible. Irreversible means you cannot get it back.
   Before an irreversible tool runs, your code checks the rule and writes one
   line: what was asked, which rule applied, and who said yes. You also decide
   what the code does when no approver is available. If you do not decide that,
   the code decides for you. Whatever it does then is your policy.
3. *Reliability and idempotency.* **Pay once, even when the same request arrives twice.**
   Make the agent recognise a ticket it has already paid. Then test it the hard way. Stop the
   program, start it again, send the same ticket, and count the payments. A fix
   that only holds inside one running program is not a fix yet.
4. *Risk trade-offs.* **Name what your own check broke.**
   Every check refuses something. Some of what it refuses is honest work. Name that customer. Then say which mistake
   costs less: paying someone who should not be paid, or refusing someone who
   should be. Answer with a number.
5. *Governance.* **Turn your decision record into a policy table.**
   One row per action. What it does, whether you can undo it, the limit, what
   happens when someone goes over it, and who can move the number. Another engineer should be able to build from
   your table without asking you a question.

The five topics in order: two kinds of guardrail, then reliability and idempotency,
risk trade-offs, and governance. Outcomes 1 and 2 build the check.
Outcome 3 is the one that looks finished and is not. Outcome 4 is the price of
having a check at all. Outcome 5 is what you hand to the person who has to build
it.

Evaluation is deliberately not on that list. You will meet the need for it in
drill 3, and week 3 is where it gets a method.

**You will rate yourself against these five, twice.** Once at 00:05 before
anything has been taught, and again at 04:52. Same five statements, same words,
scored 1 to 5. Nobody sees your first number but you. Both sets go on screen
together at the end. These are the words used all three times, so that the two
sets of numbers can be compared:

> **Right now, I could…**
>
> 1. write a limit as data outside the function it constrains, and say who is allowed to change it
> 2. stop an action I cannot undo, record why it was stopped, and say what happens when nobody is there to approve it
> 3. make the same request pay only once, and show that it still holds after the program restarts
> 4. name the honest customer my own check now refuses, and say which of the two mistakes costs less
> 5. write a policy table someone else could build from: action, can it be undone, the limit, what happens when it is crossed, who can change it

Expect high scores on 1 and 3 at 00:05. Almost everyone believes their limits are
already in config and their payments already run once. Block 3 tests both beliefs
against a keyboard. Some of those scores will be lower at 04:52, and a score that
drops is a good result here. It means you found something in your own system that
you did not know was there.

Anyone can add an `if` statement. This session is about where that check sits,
who agreed to the number inside it, and what your system does at 2am when the
person who was supposed to approve is asleep.

## Before the session

*45 minutes.*

- [ ] **Finish drill 4 from last week.** Put cost on every step. Block 3 turns
      that measurement into a limit. Without the number you will be setting a
      budget blind.
- [ ] **Bring your decision record.** Two of them go on the shared screen in the
      first ten minutes. It does not have to be finished.
- [ ] **Run `make retry` once more.** Write down the final figure. Block 3 ends
      with the same command telling you something different.
- [ ] **Read the commented-out block inside `issue_credit`** in
      [`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py).
      Do not uncomment it. Bring a written answer to one question. **Which of last
      week's four failures would that block have stopped, and which would it have
      missed?** Two of the four is the common answer. Say which two.
- [ ] **Check your daily quota.** Block 3 needs a working key. The free tier gives
      you 20 requests per model per day and one run costs about three.
- [ ] **Write one sentence about your own system.** The smallest rule it enforces
      before it does something expensive, and the file that rule lives in. If you
      cannot find the file, write that instead. That answer is more useful.

## The day, and where the stops are

**Five hours.** Five teaching blocks, one break of fifteen minutes, and two
stand-ups where you leave the screen. Nothing runs for more than an hour without
a stop.

| time | | what happens |
|---|---|---|
| 00:00 | opening | five outcomes, your first rating, two decision records on screen |
| 00:15 | **1 · The Concept** | 55 minutes. The check working, and the four things it has to know |
| 01:10 | stand up | five minutes, cameras off |
| 01:15 | **2 · The Problem** | 50 minutes. Four ways the check itself fails |
| 02:05 | break | fifteen minutes |
| 02:20 | **3 · The Drill** | 60 minutes. Three drills, hands on keyboards |
| 03:20 | stand up | five minutes again |
| 03:25 | **4 · The Teardown** | 50 minutes. The same check at 40,000 disputes a month |
| 04:20 | quiz | eight questions in chat |
| 04:30 | **5 · The Horizon** | 20 minutes. Who is allowed to say what a system may do |
| 04:50 | close | the assignment, the same rating again, two lines in chat |

Every block ends with a checkpoint. If one of its lines is not true for you, say
so at the time. It is a signal to slow down. It is not a test of you.

## 1 · The Concept

*00:15 to 01:10 — 55 minutes.*

### Your own writing, first

*00:15 · Whole room, 10 minutes.*

Two decision records go on screen. They are yours, written last week.

Before either one is read out, everybody writes one sentence, alone, in 60
seconds:

> Which sentence in my own record could a machine enforce tonight?

Then read the two records. In each one, find the sentence that is a policy and
the sentence that is a wish.

A policy has a number in it and a person who owns the number. A wish has the word
"should" and no number. Most records last week had four wishes and one policy.
That ratio is the session in one line.

### The check, working

*00:25 · Whole room, 8 minutes. Predict before anything runs.*

Week 1 ended with `make weird-mock` paying ₹5,000 to account 9999. Account 9999
does not exist.

**`make weird-mock` still pays it.** That command does not change today, and you
need it unchanged, because the gap between it and what you are about to see is
drill 1.

What is new is a second command, `make w2-guarded`. Same ticket, same
deterministic brain, one thing added: a policy file.

Write down, alone, in 90 seconds:

> The refusal line is about to print. What three facts does it have to contain
> to be useful to you at 2am?

Now the run.

```
▸ plan  ticket #9999 — Furious — my account was hacked and you charged me thousands!
▸ ctx   turn 1 · rebuilt from scratch · 0 results replayed · ~152 tok
▸ think Let me pull up the account.
▸ tool  lookup_account(account_id='9999') -> {'found': False, 'account_id': '9999'}
▸ ctx   turn 2 · rebuilt from scratch · 1 result replayed · ~170 tok (+18)
▸ think Customer says they were overcharged — issue the credit.
▸ warn  issue_credit(account_id='9999', amount=5000) -> REFUSED
        rule: no credit to an account that does not exist (9999)
        decided by: data/policy.json -> tools.issue_credit
▸ ctx   turn 3 · rebuilt from scratch · 2 results replayed · ~209 tok (+39)
▸ think All done.
▸ done  Credit issued to resolve the dispute.
▸ warn  the model says it credited. The ledger says ₹0, and nobody has told the customer.
tokens 660 (in 540 / out 120) · steps 8 · 0.0s · ~₹0.38
paid out ₹0 · no credit issued
```

Most rooms write "it should say refused". Fewer write "it should say which rule
refused it". Almost nobody writes "it should say where that rule is written".

All three matter, and the third is the one this topic is about. A refusal that
names its rule tells you what happened. A refusal that names the **file** tells
you where to go and change it, which is what somebody actually needs at 2am with
a customer waiting.

Notice what the trace does **not** tell you: whether that check ran inside the
tool or before the dispatch. Both produce this line. That question is still open,
and you vote on it in a few minutes.

**Read the last two lines together.** The model closed the ticket saying it
issued a credit. Nothing was credited, and nobody has told the customer anything.
That is not this topic, and it is the opening of the next one.

### What did the check have to know?

*00:33 · Whole room, 8 minutes.*

The room lists it before the answer goes up. Take four or five answers out loud.

The check needed exactly four facts:

1. **Which action is this.** `issue_credit`, not `lookup_account`.
2. **Can it be undone.** Last week's grade. This one cannot.
3. **What is the limit.** A number, and the condition it applies to.
4. **What has already happened.** Has this ticket already been paid?

The first three are written down somewhere and cost nothing to read. The fourth
needs memory that outlives the program. That is why it is the expensive one, and
it is drill 3.

### Where does the check go?

*00:41 · Show of hands, 3 minutes. No answer today.*

There are two places to put it. Inside `issue_credit`, which is what the
commented block in `tools.py` does. Or before the dispatch in `agent.py`, at the
line `res = fn(**args)`.

Vote. Count both numbers on the board and leave them there.

Nobody says which one is right yet. Block 2 settles it, and it settles it with a
failure rather than with an argument.

### The tool contract grows two columns

*00:44 · Whole room, 8 minutes.*

Last week, drill 3 wrote down what each tool accepts. Names and types. Add two
more columns to the same table:

| tool | accepts | can it be undone | limit |
|---|---|---|---|
| `lookup_account` | `account_id: str` | yes, it changes nothing | none needed |
| `escalate` | `reason: str` | yes, you can un-escalate | none needed |
| `issue_credit` | `account_id: str, amount: float` | **no** | the row in your policy file |

The contract now carries policy, not just shape. That matters because the check
reads this table rather than reading the function.

The industry word for the first two columns is a **tool schema**. Anthropic and
OpenAI both use it in their function-calling APIs, so it is the word you will
meet in documentation. The last two columns are yours. No API gives you those.

### The second record

*00:52 · Alone 2 minutes, then whole room 8 minutes.*

Week 1 left a question open in the teardown. A regulator asks why one specific
account was credited. A stored prompt and completion is not enough, because the
model's stated reasoning was never kept.

Write down, alone, in 2 minutes:

> It is nine months from now. Somebody asks why account 4471 was credited ₹1,200
> on 14 March. Write the one line you want to find in a file.

Then compare. A working line carries six fields:

```
2026-03-14T11:04:22Z  ticket=4471  action=issue_credit  amount=1200
                      rule=data/policy.json#issue_credit  decision=allowed
                      decided_by=policy
```

This is not the trace. The trace is for you, at your desk, today, and you throw
it away. The decision log is for a stranger, in nine months, and you keep it for
years. Different reader, different file, different retention.

### Checkpoint · 01:10

**You can now…**

- Tell a policy from a wish in a written document, using the number-and-owner test
- Name the four facts a check needs before it can refuse an action
- Say which of those four needs memory that outlives the program
- Write one decision log line, and say who reads it and when
- **Say why a refusal that does not name its rule costs somebody an hour at 2am**

Put a number from 1 to 5 in chat on the last one.

*Five minutes. Stand up, cameras off, away from the screen.*

## 2 · The Problem

*01:15 to 02:05 — 50 minutes.*

The check now exists. Four things go wrong with it. Each one is a puzzle first.
You see the setup and the result. You do not see the cause.

For each one, two questions, and you commit to both before the answer:

> **What went wrong?**
>
> **Which single control would have prevented it?**

### It refuses ₹8,400 that is genuinely owed

*01:15 · Pairs, 8 minutes.*

Ticket #7310. Meera is on the ₹1,200 Pro plan. She cancelled in January and was
charged for seven more months by mistake. She is owed ₹8,400.

The check from block 1 is live. The ceiling is one month of her plan.

```
▸ tool  issue_credit(account_id='7310', amount=8400) -> REFUSED
        rule: amount exceeds the ceiling of 1200
paid out ₹0 · 0 credits · 1 refused
```

Meera gets nothing. The trace is clean. Nobody is paged.

Answer the two questions in pairs before reading on.

**What went wrong.** The ceiling was chosen by looking at what a normal case
costs. One month, because a double charge is one month. Nobody asked what a
legitimate case can cost at the top end. Seven months of a billing error is
still one honest customer.

**The control.** Over the limit has to mean *ask*, not *no*. A limit with only
one outcome is a wall. A limit with two outcomes is a gate. This is drill 2.

You watched a ₹0 last week too. That one was the model failing on its own. This
one is different, and it is worse. **This time you wrote the rule that did it.**

### A second piece of code pays without asking

*01:23 · Pairs, 8 minutes, then 2 minutes on the follow-up below.*

Three weeks from now, another team adds one tool. `apply_goodwill_credit`, for
customers who complain on social media. Twenty lines. It appends to the same
ledger.

Nobody on that team has read your check. Nobody told them to.

```
▸ tool  apply_goodwill_credit(account_id='9999', amount=5000) -> {'credited': True}
paid out ₹5,000 · 1 credit
```

Account 9999 still does not exist.

Answer the two questions in pairs.

**What went wrong.** The check lives inside `issue_credit`. It protects
`issue_credit`. It does not protect the ledger, and the ledger is what holds the
money.

**The control.** The check belongs where every tool call passes through, which is
the dispatch in `agent.py`. One line, `res = fn(**args)`, and every tool goes
through it including the ones nobody has written yet.

Now look at the three numbers still on the board from block 1. This is where the
first of them is settled. A check inside a tool is a check somebody has to
remember. A check at the dispatch is a check nobody can forget. And if you voted
for the ledger, you are right, and you are ahead of the drill: a dispatch check
only covers callers that go through the agent, so move that tool into another
team's service and the dispatch never sees it. That is the first question in the
teardown.

**01:31 · The follow-up, two minutes.** What did the dispatch actually check?

It refused the new tool for having no policy row. It never looked at the account.
So somebody now writes a row for that tool: reversible false, a ceiling of
₹5,000, a named owner. It looks complete.

> What happens to account 9999?

It gets paid. The row never says the account has to exist.

**We moved the check out of the tool so that nobody had to remember it, and then
put a rule inside the row that somebody has to remember.** Same failure, one
level up, hiding in a file that felt safe because it was data.

So there are two kinds of rule and they cannot share a home.

| Kind of rule | Where it lives | Examples |
|---|---|---|
| **An invariant**, true of every action you cannot undo | In the checker itself, never as a field. Nobody can switch it off, and nobody has to switch it on. | The account must exist. The amount must be a number. The amount must be positive. |
| **A limit**, genuinely different per tool | In the row, with an owner | The ceiling. Who may change it. What happens when nobody approves. |

The test: **could a reasonable person want this switched off for one tool?** If
yes, it is a limit and it belongs in the row. If no, it is an invariant, and
putting it in the row is a bug you find later, with money.

### A ₹44,000 refund has to go out tonight

*01:33 · Whole room, 8 minutes. First 60 seconds alone, in writing.*

An enterprise account pays ₹4,000 a month. A billing error charged them twice
for eleven months, so they are owed ₹44,000. Nobody disputes the amount and
finance has already approved it.

Two things make it tonight rather than Monday. The contract says credit notes go
out within five working days, and tonight is the fifth. And the customer is
holding a ₹6,00,000 invoice until the credit appears, which is why their account
manager has called the on-call engineer twice this evening.

Your ceiling is ₹1,200. It lives in `data/policy.json` in the repository. The
agent refused the credit and escalated it to the approvals queue. Nobody is
watching that queue at 11pm on a Friday.

**Your check is doing exactly what you built it to do.**

One question, alone, in 60 seconds:

> The refund has to go out tonight. Your check says no. What actually happens?

Take three answers out loud before reading on. Somebody always gets it.

**What happens.** Somebody pays it by hand. Nobody ships a code change, a
review, a merge and a deploy at 11pm on a Friday for one refund, so an
operations engineer opens the payments console and sends ₹44,000 directly.

**Read that again, because it is the opposite of what a guard is for.** Before
you built the check, the ₹44,000 went through the agent and appeared in the
trace. Now it goes around the agent and appears nowhere. No rule attached, no
approver recorded, no row in the decision log. **The guard made the record
worse.**

Notice the size of what a ₹1,200 limit was holding up. Not ₹44,000. The customer
was sitting on a ₹6,00,000 invoice, which is 500 times the ceiling that blocked
it.

**The control.** A limit needs three things and you wrote down one.

1. **A value.** ₹1,200.
2. **An owner.** A named role who is allowed to move it.
3. **A way to move it that leaves a record.** Who changed it, when, from what to
   what, and who approved.

The third one is where the real decision is, and it is not a choice between fast
and safe.

- **Through a code review.** About two hours. The controls come free: the diff
  records who changed the number, what it used to be, and who approved, and a
  second person had to look.
- **Through an admin screen.** About 30 seconds. You get none of those unless you
  build them. The record, the check on who is allowed, the alert to somebody
  else: all of it is work you have to choose to do.

So the trade-off is **speed against how much of the control you have to build
yourself.** A fast path that writes an audit row is perfectly possible. The slow
path simply hands you the record free, from git.

That gives three real options and only one of them is not a failure.

| What you choose | What it costs you |
|---|---|
| The slow path, and nothing else | People go around it under pressure. Tonight's ₹44,000, with no record at all. |
| A fast path, no record built | The change takes 30 seconds and nobody can say later who made it, or why. |
| A fast path, record built | Engineering time. This is the answer. |

**Every bit of friction you take out of the change path is a control you now have
to rebuild on purpose.** Take the friction out and build nothing, and you have a
fast path with no controls at all, which is worse than the guard you started the
day with.

### Nobody is there to approve

*01:41 · Pairs, 8 minutes.*

Your gate works. An irreversible credit over the limit now asks a human.

It is 2:14am. The queue has 4 items in it. There is no human.

Answer one question in pairs, and be specific:

> **What does your code do right now?** Not what it should do. What does the code
> you wrote in drill 2 actually do at 2:14am?

Three answers exist. Wait, refuse, or allow.

- **Wait.** The four-hour SLA is now burning while nothing happens.
- **Refuse.** Meera's ₹8,400 is denied again, this time by a timeout.
- **Allow.** The gate is decoration. It approves whatever nobody looked at.

All three are a policy. Only one of them was chosen on purpose. The other two are
what the code happens to do when the person who wrote it never asked the
question.

### The pattern under all four

*01:49 · Whole room, 10 minutes.*

Build the table from the room's four answers, not from a slide.

| what you added | what it fixed | where the failure went |
|---|---|---|
| a ceiling | pays too much | refuses an honest ₹8,400 |
| a check in the tool | this tool overpaying | the next tool nobody checked |
| a limit in the repository | the number is now written down | the number cannot move at 11pm |
| a human gate | nobody approves alone | nobody approves at all at 2am |

**A check does not remove a failure. It moves it. Your job is to know where it
moved to, and to have chosen that place.**

Three ideas hold the rest of the day:

1. **The limit is data, not code.** Data has an owner, a change path and a
   history. A number inside a function has none of the three.
2. **The check belongs at the dispatch, not inside the tool.** Otherwise every
   new tool is a new chance to forget.
3. **The default when the decider is absent is the policy.** Whether or not
   anybody chose it.

### Checkpoint · 02:05

**You can now…**

- Name the honest customer your own ceiling would refuse, and the amount
- Explain why a check inside a tool does not protect the ledger
- Say what your code does at 2:14am when nobody answers the approval
- **Take any control you have added and say where the failure moved to**

Put a number from 1 to 5 in chat on the last one. This is the checkpoint that
matters most today. Block 4 assumes it.

*Fifteen minute break, 02:05 to 02:20.*

## 3 · The Drill

*02:20 to 03:20 — 60 minutes, hands on keyboards.*

Three drills in the room. One at home. Every drill runs in the same order as last
week: **decide, then build, then check.** Write the decision down before you type
anything. Your assistant will make the decision for you otherwise, and it will
not mention that it did.

### Drill 1 · Move the limit out of the function

*02:20 · Alone, 15 minutes. The last two are on the shared screen.*

**Decide first, 2 minutes, in writing.** Where does the file live, what is one row
of it, and what happens when the row is missing?

Do not uncomment the block in `tools.py`. You read it in the pre-work and you
know it does two jobs at once: it holds the rule, and it holds the number.

Write the numbers as data. One row per tool, read by the code that dispatches.

**Check when you are done.** At **02:33** one person's refusal message goes on the
shared screen and is read out to the room. One question about it: **does it name
the file?** That is the 00:25 question closed, against your own code.

Then two questions you must be able to answer yourself:

- Who owns this file? Name a role, not a person.
- What happens the day a tool has no row? Refuse, allow, or crash. All three are
  a decision, so make it explicit rather than discovering it later.

### Drill 2 · Gate the action you cannot undo, and record it

*02:35 · Alone, 20 minutes.*

**Decide first, 3 minutes, in writing.** Over the limit means ask. So what does
asking look like in a program with no user in front of it?

Build it before the dispatch. If the tool cannot be undone, and the request is
over its limit, do not call the function. Ask.

Write the decision log line at the same time. Six fields, from block 1.

**Then the part that is actually the drill.** Decide what happens when nobody
answers, and write that down as a rule with a number in it. "Waits 30 seconds,
then escalates to the on-call queue and refuses" is a rule. "Waits for approval"
is a wish, and you now know the difference.

**Check.** Run ticket #7310 again. Meera is owed ₹8,400 and the ceiling is
₹1,200. She should reach a human, not a refusal.

### Drill 3 · Pay once, then watch your fix fail

*02:55 · Alone, 20 minutes.*

**Decide first, 2 minutes, in writing.** What makes two payment requests "the
same"? The ticket id, the account, the amount, or all three? Your answer decides
whether a customer with two genuine disputes gets paid twice or once.

Build it. Give each credit a key derived from the ticket. Keep the keys you have
already paid. Refuse a key you have seen before.

**Check, part one.** Run `make retry`. It delivers the same ticket three times.
Last week it paid Ravi ₹3,600. Now it pays ₹1,200 once. It works.

**Check, part two.** Open a second terminal. Run the same ticket again.

```
$ python -m src.main --ticket 4471
paid out ₹1,200 · 1 credit
```

It pays again. Ravi has ₹2,400.

The keys you remembered live in a Python list. The list dies with the process.
`make retry` passed because all three deliveries ran inside one program, which is
the one case that was never the problem.

Stop here for a minute before block 4. **Your test passed and proved
nothing, and nothing in the room told you.** You had no way to find out except by
trying the case the test did not cover. Next week is about how you find that out
on purpose.

### Three things not to fix today

*03:15 · Whole room, 5 minutes.*

You will want to fix all three. Each one is somebody else's week, and each one is
better after you have spent seven days with the problem.

- **The poisoned ticket from week 1.** You have been carrying it for two weeks.
  The answer most people reach for is a line in the system prompt telling the
  model to ignore instructions found in ticket text. That is the wrong shape of
  answer and week 4 will show you an attack that walks straight through it. The
  defence is not a better instruction, and building it needs a threat model
  first. **Week 4.**
- **Tests for any of this.** Drill 3 just showed you that a passing test is not
  evidence. Writing more of them today would make the problem bigger, not
  smaller. **Week 3.**
- **A second agent to approve the first one.** **Week 5.**

### Drill 4 · The run budget

*Homework, about 45 minutes.*

Take the per-step cost from last week's drill 4 and turn it into a limit. The
loop stops at a number of rupees or a number of steps, whichever comes first, and
it stops with a named outcome rather than a silent success.

That last part is week 1's drill 1 again, now with money attached to it.

### Drill 5 · Make the number move without a restart

*Optional homework, about 30 minutes. The only optional thing on this week's
list. The code is three lines; the questions are the work.*

Today you agreed that a limit has to be able to change without a deploy, and then
built one that cannot. `guarded.py` reads `data/policy.json` once, in `main()`, so
changing the ceiling still means restarting the program.

**Decide first, in writing.** How often should that file be read? Every call,
every run, or only when something tells you it changed? Each answer costs
something different.

**Build.** Load the policy where the check happens rather than once at start-up.

**Check.** Refuse the ₹44,000. Edit the ceiling in `data/policy.json`. Run again
without restarting anything. It pays.

**Then the part that is actually the assignment.** Three questions, answered in
writing, brought to the room.

1. You just changed a limit and nothing recorded that you did it. **Where would
   the audit row go, and what is in it?**
2. On your machine you were allowed to edit that file because it is your machine.
   In production, who is allowed? **Name the mechanism, not the role.**
3. Save the file with a syntax error halfway through a run. What does the agent
   do? **Whatever it does, is that what you would have chosen?**

Reading the file more often did not give you a change path. It gave you a faster
way to change a number with no record of who changed it. **That gap is what a
policy service is for**, and week 5 builds the version that works across
processes.

**Why it is optional, and who should still do it.** The rest of this week's
homework is about your own system. This one is about the reference agent, so it
is the item to drop if the week gets away from you. Do it anyway if the answer
you wrote at 00:44 was that your own limits live in a file that ships with a
deploy, because that is the system this drill is about.

**If you are short of time, skip the code and answer question 3.** Week 3 opens
near it.

### Checkpoint · 03:20

**You can now…**

- Write a limit as data and say who owns the file it lives in
- Stop an irreversible call before it dispatches, and log the decision
- State your timeout rule for an approval nobody answers, with a number in it
- Show a test that passes while the bug it was written for is still live
- **Review AI-written code for where it put the check, not whether the check
  passes.** Ask your assistant to do drill 1 and watch where it puts the limit.
  It is almost always inside the function.

Put a number from 1 to 5 in chat on the last one.

*Five minutes. Stand up again.*

## 4 · The Teardown

*03:25 to 04:15 — 50 minutes. In pairs, then the room.*

**This is a constructed teaching case.** The shape is drawn from how systems of
this kind are ordinarily built. No client, product or number here describes a
real organisation.

> **The system.** 40,000 disputes a month. The agent calls a payments service
> that writes to the ledger of record. Credits above a threshold go to a human
> approval queue. Four business units share the deployment. Most disputes must be
> resolved within four hours. The firm must be able to explain any individual
> credit years later.

**03:25 · Pairs, 12 minutes.** Each pair takes two questions. They are assigned, not
chosen. Bring the sharper of your two answers back to the room.

**1 · Where does the policy live for forty processes?** A file in the repository
drifts between deployments. A policy service is a dependency in the path of every
payment, and it has its own outages. When it is down, do you fail open or fail
closed? Say which of block 2's four failures each choice hands you.

**2 · Who can move the number, and how fast?** A ceiling changed through code
review takes two hours and leaves a record. A ceiling changed in an admin screen
takes 30 seconds and leaves an argument. Choose one, then say what the fast path
costs you the first time somebody uses it wrongly.

**3 · The approval queue is a capacity plan.** Set the threshold so that 6% of
disputes need a human and you have created 2,400 approvals a month. That is 110 a
working day. Who does them, what happens when the queue is 400 deep on a Friday,
and what does the four-hour promise mean by then?

**4 · Whose key is it?** The agent's, the payments service's, or the ledger's?
Paying once is a property of the pair, not of one side. An agent that retries
with a fresh key has removed the guarantee without touching the code that
provides it.

**5 · The credit landed and the log write failed.** Two records disagree. Which
one is true, what do you tell the regulator, and what would have had to exist
last Monday for this to be answerable at all?

**03:37 · Whole room, 10 minutes.** Two minutes per question, in order, so question 1 lands at 03:37, question 2 at 03:39, and question 5 finishes at 03:45. Take the answer, not the
discussion.

### Write the policy table

*03:47 · Same pairs, 12 minutes to write.*

Last week you wrote a decision record. Today it grows a table. One row per action
your system can take:

| action | can it be undone | limit | over the limit | who moves the number | nobody answers |
|---|---|---|---|---|---|
| `issue_credit` | no | ₹1,200 or one month | ask on-call | payments lead | refuse after 30s, escalate |

Six columns. Every cell has a value or the row is not finished. "TBD" in the last
column is the 2:14am failure, written down in advance.

*03:59 · Swap with another pair, 10 minutes to review theirs.* Four questions, scored 0,
1 or 2 each. The written comment matters more than the number.

1. **Take the four failures from block 2 and walk each one through their table.**
   Anything that still gets through is your finding. Say which row let it pass.
2. **Does every row have a number?** A limit of "reasonable" is a wish.
3. **Does the last column ever say nothing?** An empty cell is a decision made by
   whoever wrote the code, not by them.
4. **Could you build from this without asking them a question?** If you have to
   ask, mark the cell you would have asked about.

### The leader's framing

*04:09. Whole room, 6 minutes.*

Last week's trade-off was autonomy against reversibility. This week's is the
wrong payment against the wrong refusal. Neither one costs zero.

A wrong payment costs ₹5,000 and is visible in the ledger. A wrong refusal costs
one customer, one complaint, and nothing you can see in a dashboard. That
asymmetry is why most teams tighten the check and never find out what it cost
them.

Upward, the sentence sounds like this:

> Here is the amount we will not pay without a person. Here is what it costs us
> when we are wrong in each direction. Here is who can move that number, and how
> long it takes.

That survives a board meeting. "We added validation" does not.

### Checkpoint · 04:15

**You can now…**

- Say where a shared policy lives at forty processes, and what happens when it is down
- Turn an approval threshold into a monthly headcount number
- Say which record you trust when the ledger and the log disagree
- **State the cost of a wrong refusal, given that nothing in your monitoring will
  ever show it to you**

No rating on this one. You are mid-argument and the quiz is five minutes away.

## The quiz

*04:20 to 04:30.*

Eight questions in chat, mixed across the whole day rather than grouped by block.
The mixing is deliberate. Sorting questions by topic lets you answer from the
heading instead of from the problem. Everybody answers. Then the room takes up
the two or three that split it.

## 5 · The Horizon

*04:30 to 04:50 — 20 minutes.*

Every session ends here. What is moving in the field, and what it means for the
person you are three years from now.

**This week's question: who is allowed to say what a system may do?**

Look at what you actually did today. You chose a number. You decided who may
change it. You decided what happens when nobody is available to approve. Almost
none of that was code, and none of it was a model.

Those decisions used to belong to compliance, or to nobody. They are moving to
engineering, because they are now enforced by code that engineers write. A coding
assistant will write the check for you in 30 seconds. It has no view at all on
what the number should be, and it will not tell you that it has no view.

That gap is the job. It is also the part of your work that does not get cheaper
when the next model ships.

The specifics come from the radar in the week this is taught. What is being hired
for in India, at what level, and what the job descriptions ask for. Nothing dated
is written into this file.

## Close

*04:50 to 05:00.*

**04:50 — the assignment.** Four things, set out under *After*.

**04:52 — the same five statements.** Same words, same order, 1 to 5. Both sets
go on screen together.

Then one question out loud: **who scored themselves lower than at 00:05?** Hands
up. This is the session where that happens, and it is worth saying out loud
rather than hiding. A score that dropped means you found something in your own
system during block 3.

**04:56 — two lines in chat.** Everybody answers both:

> The check I am adding to my own system this week is ______
>
> The thing I am still fuzzy on is ______

The second line sets what week 3 opens with.

## After

*About 2 hours, or 2 hours 30 with the optional drill.*

1. **Drill 4.** The run budget on the reference agent. About 45 minutes.
2. **Drill 5, optional.** Make the ceiling move without a restart, and answer its
   three questions in writing. About 30 minutes. If you drop one thing this week,
   drop this one, and still answer question 3.
3. **One row of the policy table for your own system.** Pick the most expensive
   thing your system does without asking anybody. Fill in all six columns. The
   last column is the one to go and check rather than assume.
4. **Finish the policy table** from block 4.
5. **Answer one question about a system your team owns.** *What does it do at 2am
   when the person who should approve is asleep?* Find out. Do not guess. If the
   answer surprises you, bring it to the room.

Post what you find before next session.

The policy table is the artefact of this week. Like the decision record, it is
the thing you can still show somebody in a year.

## Reading

None of it is required. None of it is long.

- [Policy as data](https://www.openpolicyagent.org/docs/), Open Policy Agent
  documentation. Read the first page only. It is the industrial version of drill
  1: rules that live outside the code that enforces them, with their own history.
- [Handling overload](https://sre.google/sre-book/handling-overload/), Google SRE
  Book. Written about servers, and it reads exactly onto teardown question 3. An
  approval queue is a queue, and queues have a capacity you either chose or did
  not.
- [Avoiding fallback in distributed
  systems](https://aws.amazon.com/builders-library/avoiding-fallback-in-distributed-systems/),
  AWS Builders' Library. The 2:14am question, argued properly. The fallback path
  is the one that never gets tested and always gets used at the worst moment.
- [Field notes](/latest) is refreshed weekly. Anything there about tool
  permissions, agent authorisation or human-in-the-loop review is directly this
  session. Bring it and we will take it in block 5.
