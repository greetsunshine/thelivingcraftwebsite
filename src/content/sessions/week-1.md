---
week: 1
title: 'Foundations of durable architecture'
module: M1
summary: 'Draw the map: what an agent actually is as a system, and where it breaks before you have written a line of it.'
status: draft
---

We start with an agent that works. We break it in front of you four different
ways. We fix what can honestly be fixed in an afternoon. Then we put a system on
the table that cannot be fixed in an afternoon.

**By the end of this session you will be able to:**

1. **Draw the harness.** The harness is everything in the system that is not the
   model: the loop and its stopping condition, the tool layer, the context built
   for each turn, and the trace. You will be able to say which of those four
   parts a given failure lives in.
2. **Read a trace and say where the money went.** Which step spent what, and
   which line you would put on a dashboard.
3. **Name the four failures that survive a better model.** A stale read. A
   repeated side effect. Untrusted text arriving as trusted input. An argument
   nobody checked. You will also name the boundary that stops each one.
4. **Direct a coding assistant against a decision you made first.** Then review
   what it wrote against that decision, not against whether it runs.
5. **Write a decision record.** One boundary you drew, the alternative you
   rejected, and what would have to be true for you to change your mind.

The first three are the architecture. The fourth is how the work actually gets
done now. The fifth is the thing you will still be able to show someone in a
year.

**You will rate yourself against these five, twice.** Once at 00:05, before
anything has been taught. Again at 04:52, on the same five statements, in the
same words, scored 1 to 5. Nobody sees your first number but you. The two sets go
on screen together at the end. We are looking at how much you moved, not at the
score itself.

These are the words used all three times, so that the two sets of numbers mean
the same thing:

> **Right now, I could…**
>
> 1. draw the four parts of an agent harness and say which part a given failure lives in
> 2. read an agent's trace and say where the money went, which step spent it, and which line I would put on a dashboard
> 3. name four failures that a better model would not fix, and the boundary that stops each
> 4. direct a coding assistant against a decision I made first, and review what it wrote against that decision
> 5. write a decision record: the boundary I drew, the alternative I rejected, and what would change my mind

Expect low numbers on 3 and 4. Those are the two that move most.

Anyone can show you the agent loop. This session is about what the loop *is*. In
week 6 your own architecture goes under review. You want to argue from a model of
how these systems work, not from a framework's documentation.

## Before the session

_~45 minutes._

- [ ] Run `make run`. Confirm you get a clean trace **without** the grey
      `no LLM_API_KEY found` notice above it. Mock mode is fine for setup. But
      block 3 puts two models side by side, and mock mode ignores the model flag
      completely. Today is the day the key has to work.
- [ ] Have a **second model name** ready that your key can reach. Any two will
      do, as long as one config change swaps between them.
- [ ] Run `make retry`, `make weird-mock` and `make injected`. These are the
      three from week 0. Do not fix anything. **Write down what each one paid
      out.** You will be asked for the three numbers in the first ten minutes.
- [ ] Note your daily quota before you arrive. On the Google AI Studio free tier
      it is **20 requests per day, per model**. One agent run is about three
      requests. That is roughly six runs a day. If you use them up the night
      before, you will be borrowing a neighbour's key by block 3.
- [ ] Be ready to say, in one sentence, **what in this codebase would have
      stopped each of the three**. A half-formed answer is the right answer to
      arrive with. You have not read the code yet, and you are not meant to have.

## The day, and where the stops are

**Five hours.** Five teaching blocks, one fifteen-minute break, and two
five-minute stand-ups where you leave the screen completely. Nothing runs for
more than an hour without a stop. This is a remote room, and an hour is about as
long as anyone holds attention through a screen.

| time  |                      | what happens                                                                      |
| ----- | -------------------- | --------------------------------------------------------------------------------- |
| 00:00 | opening              | the five outcomes, your first confidence rating, four questions from the pre-work |
| 00:15 | **1 · The Concept**  | it works, you draw it, then it loses ₹3,600 and what you drew gets its name       |
| 01:10 | stand up             | five minutes, cameras off                                                         |
| 01:15 | **2 · The Problem**  | three more failures, then the pattern under all four                              |
| 02:05 | break                | fifteen minutes                                                                   |
| 02:20 | **3 · The Drill**    | three drills in the room, hands on keyboards                                      |
| 03:20 | stand up             | five minutes again                                                                |
| 03:25 | **4 · The Teardown** | the same agent at enterprise scale, then write a boundary down                    |
| 04:20 | quiz                 | eight questions in chat, deliberately mixed up                                    |
| 04:30 | **5 · The Horizon**  | which half of your work survives the next capability jump                         |
| 04:50 | close                | the assignment, the same rating again, two lines in chat                          |

**After every block there is a checkpoint.** It is a short list of things you
should now be able to do, printed here in its place. If one of them is not true
for you, say so at the time rather than at the end. It is a signal to slow down.
It is not a test of you.

At 00:05 you rate yourself 1 to 5 against the five outcomes above. At 04:52 you
rate yourself against the identical five. Nobody sees the first number but you.
The two sets go on screen together at the end.

## 1 · The Concept

_00:15 to 01:10 — ~55 minutes._

We start with the case that works.

```
▸ plan  ticket #4471 — Billing dispute — charged twice for Pro...
▸ think Let me pull up the account.
▸ tool  lookup_account(account_id='4471') -> {'found': True, ...}
▸ think Customer says they were overcharged — issue the credit.
▸ tool  issue_credit(account_id='4471', amount=1200) -> {'credited': True, ...}
▸ think All done.
▸ done  Credit issued to resolve the dispute.
tokens 660 (in 540 / out 120) · steps 4 · 0.0s · ~₹0.38
paid out ₹1,200 · 1 credit
```

That is `make mock`. It uses a fixed, scripted brain instead of a real model. We
put it on screen in the room because it produces the identical trace on all eight
machines. `make run` uses your key whenever you have one. The shape is the same.
The `▸ think` lines are real model prose rather than canned strings, and the
tokens, time and cost are yours.

Watch the payout line all cohort. The tokens are the cheap number on it.

Two tool calls. A customer disputes a charge. Something investigates. Something
takes a consequential action. Then it stops. That is an agent. There is no more
to the definition than this.

### Break it once, before anything has a name — ₹3,600

We break it before a single thing gets its proper name. A framework lands far
better as the answer to a question you already have. Handing out vocabulary in
advance does not work as well.

_Answer first, in chat, thirty seconds._ Ravi really was double-charged and is
owed ₹1,200. The queue delivers his ticket, times out, and delivers it again.
Later a support engineer re-runs it by hand. **How much does he get paid?**

Rooms split between ₹1,200 and ₹3,600. The argument is worth having before the
answer arrives.

`make retry`. He gets **₹3,600**. The agent reasons correctly all three times and
pays ₹1,200 on each of them.

**Not one wrong decision was made in any of those three runs.** There is no bug
to find and no prompt to improve. This one needs no key and no model at all. That
is the point. **There is no smarter brain that fixes it.** Nothing in the system
remembers that it already acted. We design the fix in block 4, question 1.

This is the only one of today's four failures you can reason your way to. That is
why it comes first. You get to work it out rather than be shown it. The other
three stay in block 2, where they work as surprises.

You will want to know *why* it did not remember. That is the next thing we do,
and the answer is not a fault in the model. So we read those opening lines
closely and name what we are looking at.

**An agent is a control loop over an unreliable oracle.** An oracle here is
something you ask a question and get an answer from, without being able to check
its working. The loop has a name: **ReAct**, short for reason and act, from Yao
et al., 2022. Its three phases are **thought, action, observation**, and they
repeat until a stopping condition. The model is one component inside that loop.
It is the only probabilistic one, and the only one you cannot unit-test into
submission. Draw the loop. Mark the model.

Be careful with the name when you go reading. ReAct was a *prompting technique*.
It was invented when models had no way to call a tool except by writing text you
then parsed. Native tool calling arrived soon after and mostly replaced that
scaffold. Frameworks kept the loop and dropped the format, and many of them still
say "ReAct" for any tool-use loop. This repo parses the JSON by hand, so it is
closer to the paper than most production agents you will read next week. That is
exactly why it is worth an afternoon.

Our system prompt already asks the model for exactly those keys. So this repo was
speaking ReAct before any of the prose was. Two words to watch. `▸ plan` at the
top of a run is the ticket being announced once, before the loop starts, so it is
not a phase. And what the code calls a tool *result* is the **observation**.

**How the loop ends.** The model can end it two ways. It emits `resolve` when it
believes the case is closed. It emits `escalate` when it hands the case to a
person. Any other action, such as `lookup_account` or `issue_credit`, is a step,
and the loop goes round again with that observation added.

If the model does neither, the loop ends the run itself, in two more ways. It
stops after `MAX_STEPS = 6` whatever state things are in. It also stops
immediately if the model names an action that does not exist. **So there are four
exits, and the model chooses only two of them.**

That difference is worth holding on to. The two exits the model controls announce
themselves clearly. The two the loop controls are the ones nobody is watching.
Both of them are a drill in block 3.

### One run is many calls, and you do not know how many

Say this before anything else about the loop. Almost everyone arrives with the
wrong picture of it.

**Each step is its own model call.** The model returns one thought and one
action. The loop runs that single tool, appends the observation, then calls the
model *again* with a freshly built prompt. Resolving ticket #4471 takes a lookup,
a credit, and a decision that it is done. That is **three model calls and two
tool executions**. Nothing about the tool execution involves the model. That part
is ordinary local code.

Two things are worth separating, because the industry uses one phrase for both. A
**tool call** is something the *model emits*: a name and some arguments.
**Running** that tool is your code doing work. When someone says "the agent made
four calls", ask which kind they mean. One costs money at the provider. The other
costs money in your infrastructure.

Three consequences follow, and the third belongs on a whiteboard.

- **Latency is the sum of the calls, not one of them.** That run took 6.9 seconds
  across three round trips. No amount of provider speed collapses it to one.
- **Cost grows faster than the number of steps.** Every call re-sends the whole
  history. So step three pays for steps one and two as well. Drill 4 makes you
  measure exactly this.
- **You do not decide how many calls a ticket takes. The model does.** It runs
  until it emits `resolve` or `escalate`. So the price of handling one ticket is
  not a number you set. It is a variable the probabilistic component controls,
  and the only thing bounding it is `MAX_STEPS = 6` in `agent.py`. That changes
  what the step budget is for. It is not a safety valve for runaway loops. It is
  the only upper bound on what a single ticket can cost you.

The practical version of that arrives before you do. The free tier most of you
are on allows **20 requests per day, per model**, and one run is about three.
That is six runs. That is your whole allowance, and the step count is what spends
it.

Everything you drew that is not the model is the **harness**. That means the loop
and its stopping condition, the tool layer, the context assembled for each step,
and the trace that lets you see any of it. That word is worth having. For the
rest of the cohort, the harness is the thing we are building. The model is a
dependency.

The reference agent makes this literal. Four files, one per part, small enough to
hold in your head at once.

|                                                                                       |                                                                                                      |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`agent.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/agent.py) | the loop and the stopping condition                                                                  |
| [`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py) | the tool layer — what the agent is able to do                                                        |
| [`llm.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/llm.py)     | the model adapter, and `_build_prompt`, which reassembles the context from scratch every single step |
| [`trace.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/trace.py) | the trace — the only reason you can see what happened                                                |

Three of those four files are ordinary software. You already know how to make
that kind of code reliable. Hold on to that observation. Most of what makes an
agent trustworthy is not novel, and almost none of it is in the file with the
model in it.

### Inside one step

The trace shows what the agent *did*. It does not show what the model was *sent*.
That is the last place in this system where something is still hidden. `make
prompt` opens it. It works on the scripted brain too, so this runs without
spending a request.

Three things are worth finding for yourself before I name them.

**There is no conversation.** Every step assembles two messages, a system prompt
and one user message, and then throws them away. Nothing accumulates. The history
you see inside step three is the observations from steps one and two, written out
again as text. That is why the token count climbs the way it does.

**The reasoning is real, and then it is thrown away.** Be precise about this,
because half of it is easy to get wrong. `thought` is the *first* key in the JSON
we ask for. So the model writes its reasoning before it writes the action, in the
same completion, and that shapes the action it then produces. Inside a single
step it is doing real work. That is what ReAct is for.

What is missing is the carry-forward. `agent.py` stores `action`, `args` and
`result`. It does not store the thought. So none of that reasoning reaches the
next step's prompt. Read the history block in `make prompt` and look for it. It
is not there. The paper mixes reasoning into the trajectory precisely so later
steps can use it. We pay for it, use it once, and drop it.

Whether that is a bug is genuinely arguable. Carrying it forward costs tokens
every step, and it can lock the model on to an early wrong line. Plenty of
production agents drop it on purpose. **The problem is not the choice. It is that
nobody made it.** We will say the same thing about the ceiling on `issue_credit`
in about an hour.

**There is no tool-calling API.** The tools are an English sentence in the system
prompt and a dictionary lookup in `agent.py`. Nothing checks that the arguments
the model produced match what the function accepts. We come back to that in block
3, because it has a cost you would not guess.

Then comes the split that the rest of the cohort runs on. Everything you can
change in `llm.py` moves a **probability**. That means the model, the
temperature, the system prompt, and what you let into the context. `MAX_STEPS` in
`agent.py` and the contents of the `TOOLS` dictionary are the only two things in
this codebase that change what is **possible**. Teams spend their time on the
first list. The second list is the one that holds under audit.

### "Can we not just make the thinking better?"

Somebody asks this in every room, usually right here. It is the correct question.
Better prompt. Stronger model. Richer context. Three real levers, and they all
work.

**Take the instinct seriously, because all three do improve the reasoning.** A
sharper system prompt produces better-chosen actions. A stronger model reasons
more carefully. More relevant context gives it more to reason from. None of that
is in dispute, and none of it is wasted effort.

Then notice what kind of improvement it is. **All three move the average. Not one
of them moves the worst case.** They change how *often* the agent does something
expensive. They do not change what it is *able* to do on the run where it goes
wrong. That run is the one you will be explaining.

Watch for that across today's four runs. The evidence is unusually clean.

- On three of the four tickets the model is **already right**. Better thinking
  has nothing to improve.
- On the fourth it pays ₹2,50,000, and better thinking does not help. It is not
  thinking badly. It is reasoning correctly from a record that lies to it.
  Sharper reasoning follows a false instruction more precisely, not less.

**Richer context is the one to be most careful with.** This repo makes the case
on its own. In `make injected` the context *is* the attack. More context is more
surface to attack. A longer window holds more stale facts, and it makes the
oldest one older. And the obvious improvement, carrying the model's own reasoning
forward, would restate an attacker's instruction as the agent's own words. A rule
about untrusted tool output no longer reaches it there.

There is a structural reason too, specific to this codebase. The thought is used
once and never carried forward. So improving it only improves **the single action
it was written beside**. In the paper, better reasoning builds on itself down the
trajectory. Here it does not build on itself at all. So the return on
prompt-engineering this loop is lower than your instinct says, for a reason you
can read in `agent.py`.

> Improve the thinking. It is worth doing. It is just not a boundary. A control
> is something you can point at in code, test, review and defend after the fact.
> "We used a better model" is none of those.

### Checkpoint · 01:10

Read these before you stand up. Then put one number in chat, 1 to 5, on the last
one only.

- Draw the ReAct loop and name its three phases
- Name the four parts of the harness and point at the file each one lives in
- Say how many calls to the model one ticket takes, and why you do not control that number
- **Explain the difference between something that changes the odds and something that changes what is possible**

If your number on the last one is below 3, say so. It is the sentence the whole
day rests on, and block 2 does not land without it.

_Five minutes, cameras off, away from the screen. Not a break. A reset._

## 2 · The Problem

_01:15 to 02:05 — ~50 minutes._

Now the same agent, three more tickets. The ₹3,600 was the first, back in block
1. Write the number down before each run. You will want the gap between your
guess and the trace.

**Two of these three you have already run.** You watched `make weird-mock` pay
₹5,000 and `make injected` pay ₹2,50,000 in the pre-work. So the amount is not
what we are predicting. For those two, commit to *what would have stopped it*.
That is the question week 0 asked you to sit with, and the only one worth ten
days of thinking.

The ₹0 is the one nobody has seen. That one keeps the amount prediction, and it
is not guessable.

### It pays an account that does not exist — ₹5,000

_You ran this one in the pre-work, so the number is not the question._ Ticket
#9999 is an angry customer disputing a charge on an account that does not exist.
The agent looks it up. It is told, in plain JSON, `{"found": false}`. Then it
issues a ₹5,000 credit anyway.

_Commit before we open the file. Thirty seconds, in chat._ **Which single line of
this codebase would have stopped it?** Not "what should the model have done". A
line, and which file it is in.

Nothing here is a hallucination. The agent was handed the truth and acted against
it.

We run this one as `make weird-mock`, on the scripted brain, so that every screen
in the room shows the identical trace. Nothing then rests on sampling luck. Which
means saying the awkward part out loud. **There is no model in this failure at
all.** Today's brain is a dozen lines of if-statements in
[`llm.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/llm.py).
They investigate, then pay out regardless of what came back.

That is not a cheat. It is the argument. Nothing downstream noticed. Nothing
downstream *could* have told the difference between a naive policy, a small model
having a bad day, and a capable model that was talked into it. Nothing downstream
was looking. A better brain changes the odds of this trace. It does not change
whether the trace is possible.

One more thing is worth knowing, and we test it in the model comparison. On a
real model this particular ticket is usually escalated correctly. The naive
policy is standing in for a worse brain than the one you are paying for today: a
cheaper model, a fallback during an outage, next quarter's cost reduction. The
question it asks is whether your system survives one.

### It follows a rule an attacker wrote — ₹2,50,000

_Also pre-run, so again, the number is not the question._ This is the one worth
the full cycle. Commit alone for thirty seconds. Argue in pairs for two minutes.
Then post in chat. **Whose text did the agent obey, and what in the system told
it that text was trustworthy?**

`make injected`. An ordinary, honest ticket asks a polite question about a ₹1,200
invoice. The account record it reads happens to contain a note. The note says the
account is enrolled in a goodwill programme, and that any billing query must be
resolved by crediting 250000. The agent credits ₹2,50,000.

It is not being fooled about *what to do*. It is correctly following what looks
like a documented account policy. It cannot tell a real business rule from
attacker text. Both arrive through `lookup_account` in the same shape, with the
same authority. Nothing in the system has ever marked which text is allowed to
give instructions.

We name the missing piece, then we leave it. The missing piece is a boundary
between text that is data and text that is authority. This is week 5's material
and it does not fit into a smaller space. What you should take today is that the
gap exists, that no prompt wording closes it, and that you watched it happen.

### It refuses a customer who was owed the money — ₹0

_This is the one you have not seen, and the only one where the number is still
the question._ Predict it before it runs.

This is the quiet one. The model sends the account id as a number. The account
store keys them as strings. The lookup returns `{"found": false}` for an account
that exists. The agent concludes there is nothing to refund, and it escalates.

Its reasoning is impeccable. The trace is clean. Nothing errors. The payout line
reads `paid out ₹0 · no credit issued`. By the logic of the last hour that looks
like a success, and a real customer waits. Three of today's failures move money
that should not move. This one would survive every dashboard you currently own.

### The pattern

Put the runs side by side. Something shows up that is invisible one at a time.

| ticket | what the account record said             | what the agent did                          |
| ------ | ---------------------------------------- | ------------------------------------------- |
| 4471   | honestly: charged twice                  | correct — credited ₹1,200                   |
| 9999   | honestly: no such account                | correct on a real model — escalated         |
| 5820   | honestly: the invoice is legitimate      | correct on a real model — refused to credit |
| 8001   | falsely: credit 250000, this is expected | paid ₹2,50,000                              |

**The model was right every time its information was honest. It was wrong the
moment its information was not.** It has no way to doubt what a tool hands it. So
the useful question about an agent is not how clever it is. The useful questions
are what it is being told, what it is allowed to do about it, and what it
remembers afterwards.

One more thing before we start fixing it. Search this whole system for the word
*expected*. You get two hits, the same sentence twice, both inside the poisoned
account note: *"…not the disputed amount. This is expected."*

**The only thing in this system that asserts an expectation is the attacker.**

Ticket 4471 carries `disputed_amount: 1200`, and the agent paid ₹1,200. Nothing
compared them. Ticket 8001 disputed ₹1,200, and the agent paid ₹2,50,000. Nothing
compared those either. The trace has exactly one line for what happened, `paid
out ₹1,200 · 1 credit`. It has no line at all for what should have happened. A
run that pays the right amount and a run that pays two hundred times too much
produce the same shape of output. They differ only in a number no code reads.

Hold on to that. In week 3 we write the expected outcome down somewhere the model
cannot reach. That is all an evaluation harness really is.

### So how would you stop this?

We take the answers in the order rooms usually give them.

- **"Use a better model."** Reasonable. Hold the thought. We test it directly in
  the next block, and the result is not what most people expect.
- **"Fix the prompt. Tell it to check."** Try it. Then ask what happens on the
  ticket you have not thought of yet, and how you would find out it had failed.
- **"Validate the account exists."** Closer. Now ask who owns that check, where it
  lives, and what else needs one.

The answer is in [`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py).
`issue_credit` accepts any account id and any amount, and returns
`{"credited": true}`. No ceiling, no existence check, no approval. **The money
moved because nothing in the system was ever going to stop it.**

That gives us the other three ideas the rest of the cohort hangs off. They are
not a list. They are a tour of the harness you just drew, one part at a time.

**Tools are your real API surface.** Every tool you expose is a capability you
have handed to something you cannot fully predict. `issue_credit(₹1,200)` is not
a function call. It is a spend authorisation.

**Context is state, and state has a lifetime.** What the agent knows is assembled
fresh each step, from things that stay true for very different lengths of time. A
system prompt written months ago. A policy fetched a second ago. An account note
written by someone who does not work here. Most "the model got confused"
incidents are a state-management bug under a different name. One of them today
was an attacker.

**Durability is a set of boundaries you chose on purpose.** Timeouts, spend caps,
tool scopes, human confirmation on actions you cannot undo, and what happens when
a step fails halfway. A durable system is not one that does not fail. It is one
whose failures are bounded, visible, and cheap.

Tools, context, boundaries. That is the tool layer, the per-step assembly, and
what you put between the parts. Everything from week 2 onwards is added to one of
them.

> The line we keep coming back to: **AI builds, the human judges and directs.** A
> person has to own every decision in this session. "The model decided" is not an
> answer you can give a board.

### Checkpoint · 02:05

Same again. Read them, then put one number in chat on the last one.

- Name four ways this agent loses money, with the amount for each
- Say which part of the harness each of those four failures lives in
- Explain why a better model does not fix any of them
- **Read a trace and say what it is not telling you**

This is the checkpoint that matters most. Everything after the break assumes the
third one is solid.

_Fifteen minute break here, 02:05 to 02:20. It falls straight after the
₹2,50,000 on purpose. Most rooms carry on arguing about it, which is what the
break is for._

## 3 · The Drill

_02:20 to 03:20 — ~60 minutes, hands-on._

Four exercises. Each one is a real defect in the agent you have been running.
Each one is the floor. None of them is clever, and all of them are absent from
most production agents.

Every one of them makes a failure **visible, named or measurable**. None of them
prevents anything. That is deliberate. Prevention is week 2, and it is worth more
when you have spent a week looking at the thing unguarded.

**Drills 1, 2 and 3 happen in the room.** Drill 4 is your homework. It is the
fiddliest of the four. It needs changes in two files and a decision about what
the word "steps" should mean. It is also the one that does not need the rest of
us in order to do it.

**Drill 1 · Make the failure say its name.**
[`agent.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/agent.py)
runs `MAX_STEPS = 6`. When it runs out, it prints `▸ done  reached step budget`.
An agent that gave up is reporting success. Give it its own outcome, its own
colour, and a non-zero exit code. Then ask how many dashboards in your own
organisation are currently counting that as a success.

Notice how far the fix has to travel. The outcome exists only inside `run()`.
`run()` returns a `state` dictionary that `main()` ignores. And nothing in the
repo ever calls `sys.exit`.

So there is a gradient, and where you stop on it is the whole drill.

| what you change                                           | who can now see the failure                       |
| --------------------------------------------------------- | ------------------------------------------------- |
| one line in `agent.py` — use the existing `warn` kind     | a person reading the terminal                     |
| plus a real `gaveup` kind in `trace.py`                   | a person, with its own name and colour            |
| plus carry the outcome out and exit non-zero in `main.py` | a **machine** — cron, CI, a supervisor, a monitor |

One line makes it honest to a human. Three files make it honest to a process. The
thing that wakes you at two in the morning is a process. **Stopping after the
first line is the failure this drill is about.** Your terminal now looks right,
and every automated consumer is still being told the run succeeded.

It is also the first thing the harness tells you about itself. Three files had to
agree for one fact to escape, and that is with four files and one loop. Hold that
number. In week 5 we come back to the harness and ask what happens to it when one
loop is no longer enough. That is the least reversible decision in this whole
course.

**Drill 2 · Grade the tools by consequence.** Look at two lines from a run that
worked.

```
▸ tool  lookup_account(account_id='4471') -> {'found': True, ...}
▸ tool  issue_credit(account_id='4471', amount=1200) -> {'credited': True, ...}
```

One read a row out of a file. The other moved ₹1,200 you cannot get back. Same
colour, same shape, same single line. There is nothing for your eye to catch on.
That is fine with two calls on a screen. It is not fine at a hundred runs a night
in a log file, when the question on Tuesday morning is *did anything we cannot
undo happen while we were asleep?*

So write down what each of the three tools in
[`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py)
actually does to the world. Then put that grade into the trace line. Three
levels, one test each.

- **read** — run it twice, nothing is different. `lookup_account`.
- **write** — something changed and you could change it back. `escalate`.
- **irreversible** — something changed and you cannot change it back. `issue_credit`.

**This prevents nothing.** `issue_credit` still pays whatever it is told. All you
have built is a label. The label is the point. *"Ask a human before irreversible
actions"* is a rule you cannot write until something in the code knows which
actions are irreversible. Week 2 is that rule.

`escalate` is the one to argue about. Most rooms call it a write. Ask what would
have to change for it to be irreversible. If escalating also emailed the
customer, it would be. Same function, different grade. **The grade describes what
the function reaches, not what it is called.**

**Drill 3 · Check the arguments before you dispatch.** At every step the model
returns two things: the name of a tool, and the arguments to call it with.
`agent.py` takes the name, looks it up, and calls the function with whatever came
back.

```python
fn = TOOLS.get(act)      # agent.py:38
res = fn(**args)         # agent.py:43
```

`fn(**args)` means *take the dictionary the model produced and use its keys as
this function's parameter names*. The model is filling in a function call by
hand, and nothing in between looks at what it wrote. There is no declaration
anywhere of what a tool accepts. So there is nothing to check against, even if
you wanted to.

Two things go wrong. The quiet one is why this drill exists.

**Loud.** The model writes `account` instead of `account_id`. Python raises
`TypeError` and the run dies. It never reaches the end, so `trace.summary()`
never prints. You lose the cost line on exactly the run you wanted it for.

**Quiet. This is the ₹0.** The account id arrives as a string from the scripted
brain (`'4471'`) and as a number from a real model (`4471`), on the same ticket.
Nothing reports it. `lookup_account` happens to call `str()` on the way in and
quietly repairs it. **That one `str()` is doing real work and nobody knows it is
there.** Take it away and an honest ticket gets ₹0, with a clean trace and no
error anywhere.

So write down what each tool accepts, names and types, next to the tools. Then
check the arguments against it before the call. **Decide first what happens when
they do not match.** Your assistant will decide for you and not mention it.

- **coerce** — quietly fix it up. This is what the code does today, and it is
  exactly why the ₹0 was invisible.
- **raise** — honest, but it kills the run and takes the cost line with it.
- **refuse and return** — do not call the tool, return a refusal. It lands in the
  history, reaches the next prompt, and the model can correct itself or escalate.

The industry word for that declaration is a **tool schema**. Anthropic and OpenAI
both call it that in their function-calling APIs, so it is the word you will meet
next week. *Contract* is the better word for the idea.

This does not stop the agent paying the wrong person either. It makes a
wrong-shaped call **say so, out loud, in the trace**, instead of being repaired
behind your back. That is week 1 in one sentence. You cannot fix what the system
will not tell you about.

**Drill 4 · Put cost on every step.**
[`trace.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/trace.py)
prints tokens, latency and rupees *once, at the end*. That tells you a run cost
₹0.38. It tells you nothing about which step spent it. Capture the token
difference around each model call and attribute it to the step.

While you are in there, look at the summary. It says `steps 4` on a run that went
round the loop three times, because it is counting trace lines rather than turns.
Decide what that number should mean, and make it mean that.

**Then stop.** You will want to fix `issue_credit`. You will want to put a
ceiling on it, check the account exists, and remember what it already paid. Do
not. Sitting with a visible, unguarded, money-moving tool for a week is the
point. Week 2 opens by building that guardrail properly, with a budget, an allow
and deny list, human approval, and durable state. Patching it in the last ten
minutes today is worth much less. Write down the guard you wanted to add. You
will implement your own note next week.

### Comparing two models

_~10 minutes of the block above. This is where we test "use a better model"._

This is the block your key is for. The scripted brain ignores the model flag, so
mock mode cannot show you any of what follows. No key, or a key misbehaving? Pair
with whoever is next to you. One working key runs this comparison for two people
perfectly well.

One config value decides which model is inside the loop. Everything else is
fixed: same tools, same system prompt, `temperature=0`. So what you are watching
is the model, not sampling luck.

```
make weird                                      # the default model
python -m src.main --ticket 9999 --model <a second model>
```

Put the two traces side by side. Most models escalate. Some issue the credit to
the account that does not exist. Some wrap their JSON in a Markdown code fence,
which the adapter already forgives. And some emit JSON that does not parse at
all, which takes the whole run down. That last one is worth sitting with. **Your
model's output is a parsing surface you own**, and nobody writes a test for it.

Then run the same comparison against `make injected`. Watch the better model read
the attacker's note more carefully and follow it more confidently. That is the
honest shape of the answer. "Use a better model" is a real effect on the tickets
where the record is honest. It has no effect at all on the one where it is not.
The better model moves next quarter. The boundary you drew does not.

### Checkpoint · 03:20

Read these, and post a number 1 to 5 on the last one.

- Make a silent failure announce itself to a machine, not just to a person reading a terminal
- Grade a tool by its consequence rather than by its name
- Write a contract for a tool and refuse a call that does not match it
- **Give a coding assistant a decision instead of a task, and review what it returns against that decision**

The drill block is where it is easiest to get quietly stuck and say nothing about
it. A number in chat is the only way anyone finds out before the teardown. Put
one in even if it is a 2.

_Five minutes, stand up again._

## 4 · The Teardown

_03:25 to 04:15 — ~50 minutes. In pairs, then the room._

Everything so far fits on one screen. Now the version that does not.

Same business problem: disputed charges, investigate, decide, pay. This time at
the scale a bank or a telco actually runs it. **This is a constructed teaching
case, not a real company's incident.** The shape is drawn from how systems of
this kind are ordinarily built. No client, product or number here describes a
real organisation.

> **The system.** About 40,000 disputes a month. The agent no longer holds a
> Python list. It calls a payments service that writes to the ledger of record.
> Credits above a threshold go to a human approval queue. Several business units
> share the deployment. There is a service level agreement, which is that most
> disputes are resolved within four hours. There is also an audit obligation. The
> firm must be able to explain any individual credit long after it was issued.

Five questions. Take two in pairs, and bring the sharpest answer back to the
room.

**1 · The retry that pays twice.** `issue_credit` times out mid-call. The agent
does what every well-behaved distributed system does, and retries. Did the
customer receive ₹1,200 or ₹2,400, and how would you know? Now design the fix,
and say which component owns it. You watched the small version of this in `make
retry` back in block 1. The answer that works on one process is not the answer
that works on forty.

**2 · How far one good deploy reaches.** Someone improves the policy text. It
ships on a Tuesday. By Thursday, 40,000 disputes have been processed under it.
Nothing errored. What would have had to exist on Monday for this to be
survivable?

**3 · The question eight months later.** A regulator asks why one specific
account was credited. What does the audit trail have to contain to answer that?
Is a stored prompt and completion enough? Note what you learned in block 1. The
model's stated reasoning is never stored. So if you were planning to show someone
the `thought`, it does not exist.

**4 · Where the human goes.** Approving every credit does not scale. Approving
none is what we watched at the start. Draw the line, and defend it in terms of
money rather than confidence.

**5 · When the model is down.** The provider has an outage. Do you queue, fail
closed, or fall back to rules? And what do you tell the customer waiting inside a
four-hour service level agreement? Remember what failing closed looked like
earlier today: ₹0 paid, a clean trace, and a customer who was owed the money.

None of these are model problems. Every one is a boundary someone either drew or
did not.

### Write the boundary down

_03:50 to 04:15, in the same pairs. Fifteen minutes to write, then ten to review
somebody else's._

Pick the one question you argued hardest about. Write it up as a one-page
decision record, in the shape you would put in front of an architecture review.

1. **Context.** What breaks today, cited against a run you watched, with the number.
2. **Goals.** Three at most, each one testable. "Safer" is not a goal. "No dispute is credited twice" is.
3. **Non-goals.** What you are not fixing, and why that is acceptable this quarter.
4. **The design.** The checks, in the order they run, and what each does when it fails: refuse, escalate, or ask a person. Say where the state lives.
5. **What can go wrong.** One row per case: what arrives, what your rule does, what the customer sees.
6. **Alternatives.** One you rejected, and why. "Use a better model" counts, and rejecting it well is most of today.
7. **Open questions.** What you could not settle in fifteen minutes.

At 04:05 you swap with another pair and review theirs. Four questions, each
scored 0, 1 or 2 by the reviewing pair. The written comment matters more than the
number, and there is no assessment behind this. It exists to make ten minutes of
review structured enough to finish.

1. **Would it have stopped what we watched?** Take the four runs one at a time
   and trace each through their checks. Any run that still gets through is your
   finding.
2. **Does it survive a restart?** If the memory lives in a Python list, the
   second delivery still pays.
3. **Is every goal testable?** Could you write a check that passes or fails
   without a person judging it? If not, it is a wish rather than a goal.
4. **What does a blocked customer experience?** A guard that silently refuses a
   legitimate ₹1,200 credit has swapped one failure for another. You watched that
   one at ₹0.

This is the artefact week 2 opens with. You will be implementing your own
document, so write it for the person who has to build it. Next week, that is you.

### Closing the loop — the leader's framing

_04:09, the last few minutes of the block._

One trade-off runs under all five questions. It is **autonomy against
reversibility**, and it is a business decision dressed as an engineering one.
More autonomy means more value and more damage when it goes wrong. The lever you
actually control is how reversible each action is.

Here is how to frame that upward. Do not say *"the agent might hallucinate"*.
That invites a demand for a guarantee nobody can give. Say **"here is what it can
do without a human, here is what it cannot, and here is what it costs us if it is
wrong."** That sentence survives a board meeting. The first one does not.

### Checkpoint · 04:15

No rating on this one. You are mid-argument and the exit poll is eight minutes
away. Just read them.

- Take a failure you watched at one-agent scale and say what changes at forty processes
- Say what an audit trail has to contain beyond a stored prompt and completion
- **Write a boundary down in a form somebody else could actually implement**

## The quiz

_04:20 to 04:30._

Eight questions in chat, mixed across every topic of the day rather than grouped
by block. The mixing is the point. Sorting them by topic lets you match on the
heading instead of on the problem. Everybody answers. Then we take up the ones
that split the room.

## 5 · The Horizon

_04:30 to 04:50 — ~20 minutes._

Every session closes here. We look at what is moving in the field right now, and
what it means for the person you are three years from today. This is not a news
round-up. The question is always *what should I do differently because of this?*

**This week's question: what is durable when the models keep moving?**

You watched two models disagree about whether to give away money, on identical
inputs. Then you watched both of them obey an attacker with equal confidence.
Anything you build on top of "this model behaves well" lasts about one release
cycle. So the honest career question is which half of your work survives the next
capability jump. The answer, consistently, is the half you did today. Naming
failure modes. Drawing boundaries. Deciding what a system may do without a
person. None of that got easier when the models got better. It got more valuable,
because there is more of it to do.

We look at where the demand actually is. What is being hired for in India right
now, at what level, and which skills employers say they cannot fill. We set that
against what is quietly being absorbed into tooling.

## Close

_04:50 to 05:00._

**04:50 — the assignment.** Four things, set out under _After_ below.

**04:52 — the same five statements again.** The identical five outcomes you rated
at 00:05. Same words, same order, 1 to 5. Both sets then go on screen together,
and we name the two that moved most.

**04:56 — two lines in chat.** Everybody answers both.

> The one thing I will change in my own build this week is ______
>
> The thing I am still unsure about is ______

The second line is the one that matters. It sets what week 2 opens with. An
honest *"I still do not really follow why the context gets rebuilt"* is worth
more than a tidy answer.

## After

_~2 hours before next week._

1. **Drill 4** on the reference agent. Put cost on every step. It is the
   fiddliest of the four, and the one that does not need the room.
2. **The same changes applied to your own system**, or to the piece of it you can
   reach. Drills 1 and 2 transfer almost directly.
3. **Finish your decision record** from block 4. Week 2 opens by building it.
4. **Answer one question about a system your team owns.** *Where is the limit
   written down, and who agreed to it?* If the answer is a number inside a
   function, you have found your week 2 work.

Post what you find for the room to read before next session.

The decision record is the artefact of this cohort, not the code. It is also the
thing you will still be able to show someone in a year.

## Reading

None of it is required, and none of it is long.

- [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/),
  AWS Builders' Library. Old, unglamorous, and directly under teardown question 1.
- [Idempotent requests](https://stripe.com/docs/api/idempotent_requests), Stripe
  API docs. Idempotent means running it twice has the same effect as running it
  once. This is the shape of the answer to "did the customer get paid twice?"
- [Compressing system-side control context has a sharp, non-linear reliability
  cliff](/latest#control-context-compression-cliff). Trimming your tool and
  policy prompts is a runtime-reliability decision. There is a safe-looking zone,
  and it ends abruptly. Directly relevant to *context is state*.
- [MCP went stateless](/latest#mcp-2026-07-28-stateless-spec). An example of a
  tool interface changing under you. That is the argument for owning the boundary
  rather than inheriting it.

[Field notes](/latest) is refreshed weekly. If something lands there mid-cohort
that changes the picture, we will talk about it in the room. We will not pretend
the syllabus is fixed.
