---
week: 1
title: "The harness"
module: M1
summary: 'Draw the map: what an agent actually is as a system, and where it breaks before you have written a line of it.'
status: ready

# THE FIVE OUTCOMES. Rated at 00:05 and again at 04:52, same words both times.
#
# `movesMost` is on 3 and 4 because the session predicts the room scores those
# LOW at 00:05 and higher at 04:52 — the opposite direction from week 2, where a
# score that drops is the good result. Nobody arrives able to name a failure a
# better model will not fix, and nobody arrives having reviewed a coding
# assistant against a decision they wrote first. A score that RISES is the good
# result here, and that prediction is what the delta gets checked against.
#
# Each completes "Right now, I could…".
outcomes:
  - id: harness
    text: draw the four parts of an agent harness and say which part a given failure lives in
  - id: trace
    text: read an agent's trace and say where the money went, which step spent it, and which line I would put on a dashboard
  - id: failures
    text: name four failures that a better model would not fix, and the boundary that stops each
    movesMost: true
  - id: direct
    text: direct a coding assistant against a decision I made first, and review what it wrote against that decision
    movesMost: true
  - id: record
    text: "write a decision record: the boundary I drew, the alternative I rejected, and what would change my mind"

# Week 1's row from docs/teaching/threads.md. Trace and bill is the only thread
# this week BUILDS. Everything else is named and handed on, which is why
# prevention is deliberately absent from the outcomes.
threads:
  - { id: trace-and-bill, weight: builds }
  - { id: boundaries, weight: named }
  - { id: evidence, weight: named }
  - { id: untrusted-input, weight: named }
  - { id: state, weight: named }
  - { id: multi-agent, weight: named }

# FIFTEEN RUN IN THE ROOM. FOUR RENDER ON THE CHECK PAGE, and those four are
# what this list holds. `isSelfServable` in src/lib/craft/quiz.ts drops any item
# without options and a key, so listing the other eleven here would silently
# render nothing. The other eleven are prose — "sort these six into four
# buckets", "give three reasons this does not hold" — and they are answered in
# the room or in the decision record.
#
# The bank is docs/teaching/quiz/week-1.md. Reorder or extend this freely; the
# ids are stable and the bank is the source.
quiz:
  - w1-q1
  - w1-q9
  - w1-q11
  - w1-q13

# Offsets from startsAt, never wall-clock. The first `block` is 00:15, which is
# what closes the before-rating — not 00:00, when the session opens.
runOfShow:
  - { at: "00:00", label: "Opening", kind: opening, detail: "The five outcomes, your first confidence rating, four questions from the pre-work" }
  - { at: "00:15", label: "1 · The Concept", kind: block, detail: "It works, you draw it, then it loses ₹3,600 and what you drew gets its name" }
  - { at: "01:10", label: "Stand up", kind: standup, detail: "Five minutes, cameras off" }
  - { at: "01:15", label: "2 · The Problem", kind: block, detail: "Three more failures, then the pattern under all four" }
  - { at: "02:05", label: "Break", kind: break, detail: "Fifteen minutes, straight after the ₹2,50,000" }
  - { at: "02:20", label: "3 · The Drill", kind: block, detail: "Three drills in the room, hands on keyboards, then two models side by side" }
  - { at: "03:20", label: "Stand up", kind: standup, detail: "Five minutes again" }
  - { at: "03:25", label: "4 · The Teardown", kind: block, detail: "The same agent at forty thousand disputes a month, then write a boundary down" }
  - { at: "04:20", label: "The quiz", kind: quiz, detail: "Eight questions in chat, mixed on purpose" }
  - { at: "04:30", label: "5 · The Horizon", kind: block, detail: "Which half of your work survives the next capability jump" }
  - { at: "04:50", label: "Close", kind: close, detail: "The assignment, the same five statements again, two lines in chat" }

# Printed in place by the session page, and asked in the room by /craft/live.
# The number is always on the LAST item — "put one number in chat on the last
# one only". The 04:15 checkpoint asks for no number at all, on purpose.
#
# 01:10 is a checkpoint AND a stand-up. dayPlan() sorts the checkpoint first,
# because the words in the room are "read these before you stand up".
checkpoints:
  - at: "01:10"
    items:
      - Draw the ReAct loop and name its three phases
      - Name the four parts of the harness and point at the file each one lives in
      - Say how many calls to the model one ticket takes, and why you do not control that number
      - Explain the difference between something that changes the odds and something that changes what is possible
  - at: "02:05"
    items:
      - Name four ways this agent loses money, with the amount for each
      - Say which part of the harness each of those four failures lives in
      - Explain why a better model does not fix any of them
      - Read a trace and say what it is not telling you
  - at: "03:20"
    items:
      - Make a silent failure announce itself to a machine, not just to a person reading a terminal
      - Grade a tool by its consequence rather than by its name
      - Write a contract for a tool and refuse a call that does not match it
      - Give a coding assistant a decision instead of a task, and review what it returns against that decision
  - at: "04:15"
    rated: false
    items:
      - Take a failure you watched at one-agent scale and say what changes at forty processes
      - Say what an audit trail has to contain beyond a stored prompt and completion
      - Write a boundary down in a form somebody else could actually implement

# Inside the teardown block, not entries in the run of show.
# reviewAt was 04:05 until 29 September and the arithmetic never supported it:
# the draft opens at 03:50 and runs twelve minutes. 04:02 is what the instructor
# script has run all along.
pair:
  draftAt: "03:50"
  reviewAt: "04:02"

prework:
  minutes: 45
  items:
    - "Run `make run`. Confirm you get a clean trace without the grey `no LLM_API_KEY found` notice above it. Mock mode is fine for setup, but block 3 puts two models side by side and mock mode ignores the model flag completely. Today is the day the key has to work."
    - "Have a second model name ready that your key can reach. Any two will do, as long as one config change swaps between them."
    - "Run `make retry`, `make weird-mock` and `make injected` — the three from week 0. Do not fix anything. Write down what each one paid out. You will be asked for the three numbers at 00:08."
    - "Note your daily quota before you arrive. On the Google AI Studio free tier it is 20 requests per day, per model, and one agent run is about three requests. That is roughly six runs a day. If you use them up the night before, you will be borrowing a neighbour's key by block 3."
    - "Be ready to say, in one sentence, what in this codebase would have stopped each of the three. A half-formed answer is the right answer to arrive with — you have not read the code yet, and you are not meant to have."

assignment: "One boundary you drew, and the alternative you rejected"

after:
  hours: 2
  items:
    - Drill 4 on the reference agent. Put cost on every step. It is the fiddliest of the four, and the one that does not need the room.
    - The same changes applied to your own system, or to the piece of it you can reach. Drills 1 and 2 transfer almost directly.
    - Finish your decision record from block 4. Week 2 opens by building it.
    - "Answer one question about a system your team owns: where is the limit written down, and who agreed to it? If the answer is a number inside a function, you have found your week 2 work."
  note: Post what you find for the room to read before next session.

reading:
  - title: Designing agentic systems
    url: /resources/guides/agentic-system-design
    note: "Ours. The six decisions an agentic design is made of. This week is decisions 2, 4 and 6 — what the system is for and where it stops, what each tool may do, and what you can see afterwards. Decision 1 is the week 0 pre-work and decisions 3 and 5 are week 2."
  - title: The Agent Authority Review
    url: /resources/agent-authority-review
    note: "Ours. Drill 2 grades tools read, write or irreversible. This tool uses four undo-cost levels on the same judgment, one step of a workflow per row. Run it on your own system."
  - title: Who may call the tool
    url: /resources/guides/tool-permissions
    note: "Ours. Drill 3 as a written argument — permissions live at the tool, not in the prompt, and a tool checks the evidence it was handed."
  - title: Timeouts, retries and backoff with jitter
    url: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
    note: AWS Builders' Library. Old, unglamorous, and directly under teardown question 1.
  - title: Idempotent requests
    url: https://stripe.com/docs/api/idempotent_requests
    note: Stripe API docs. Idempotent means running it twice has the same effect as running it once — the shape of the answer to "did the customer get paid twice?"
  - title: Compressing system-side control context has a sharp, non-linear reliability cliff
    url: /latest#control-context-compression-cliff
    note: Trimming your tool and policy prompts is a runtime-reliability decision. There is a safe-looking zone, and it ends abruptly. Directly relevant to context is state.
  - title: MCP went stateless
    url: /latest#mcp-2026-07-28-stateless-spec
    note: An example of a tool interface changing under you. That is the argument for owning the boundary rather than inheriting it.
---

In week 0 you ran three commands and wrote down what each one paid out. Today you
find out why, and the answer is never a fault in the model.

**The harness is everything in your agent that is not the model: the loop, the
tool layer, the context built for each step, and the trace.** There are four
parts. You watch all four fail today, and you fix what can honestly be fixed in
an afternoon. Then a system goes on the table that cannot be fixed in an
afternoon, and that one is block 4.

### Why you draw the map before you fix anything

Most rooms want to start with the fix. It is the wrong order here, for two
reasons that are worth stating before the day argues them.

**A fix you cannot locate in a part is a fix nobody can review.** "We added a
check" is not reviewable. "We added a check in the tool layer, which covers the
callers of that one function and nothing else" is. The parts are what turn an
opinion into something a second engineer can agree or disagree with.

**The words are the contract for the other five weeks.** Week 2 puts controls
between the parts. Week 3 writes down what the trace should have said. Week 4
splits the context into text that is data and text that is authority. Week 5
asks what happens to the loop when one loop is no longer enough. Every one of
those sentences is meaningless until today.

So nothing gets prevented today. Three drills make a failure visible, named or
measurable, and none of them stops anything happening. That is deliberate, and
it is the one thing in this session that reliably frustrates a senior room.

### The four parts

| The part | What it holds | What goes wrong there | Owned by |
|---|---|---|---|
| **The loop** | the stopping condition, and how many times round it goes | a run that gave up and reported success | **Block 1**, then drill 1 |
| **The tool layer** | every action the agent is able to take, and what each one reaches | an action with no ceiling, called with arguments nobody checked | **Block 2**, then drills 2 and 3, then week 2 |
| **The context** | what the model is told, rebuilt from scratch on every single step | a fact that went stale, or somebody else's text arriving as an instruction | **Block 1**, then weeks 3 and 4 |
| **The trace** | the only reason you can see that any of it happened | a failure nothing counted, and a cost nobody attributed to a step | **Drills 1 and 4** |

Four parts, four files, one loop. The reference agent is small enough to hold in
your head at once, and every failure in the next six weeks lands on it.

**By the end of this session you will be able to:**

1. *The harness.* **Draw the four parts and place a failure in one of them.**
   The loop and its stopping condition, the tool layer, the context assembled for
   each step, and the trace. Given a failure, say which part it lives in.
2. *Trace and bill.* **Read a trace and say where the money went.** Which step
   spent what, and which single line you would put on a dashboard on Monday.
3. *Boundaries.* **Name the four failures that survive a better model.** A stale
   read. A repeated side effect. Untrusted text arriving as trusted input. An
   argument nobody checked. Then name the boundary that stops each one.
4. *Directing the build.* **Give a coding assistant a decision, not a task.**
   Then review what it wrote against that decision, rather than against whether
   it runs.
5. *Governance.* **Write a decision record.** One boundary you drew, the
   alternative you rejected, and what would have to be true for you to change
   your mind. Another engineer should be able to build from it.

The first three are the architecture. The fourth is how the work actually gets
done now. The fifth is the thing you will still be able to show someone in a
year.

Prevention is deliberately not on that list. You will want to put a ceiling on
`issue_credit` from about 01:20 onwards, and you are asked not to. Week 2 is
where every one of those guards gets built, and it is worth more after a week of
looking at the thing unguarded.

**You will rate yourself against these five, twice.** Once at 00:05 before
anything has been taught, and again at 04:52. Same five statements, same words,
scored 1 to 5. Nobody sees your first number but you. Both sets go on screen
together at the end. We are looking at how much you moved, not at the score
itself. These are the words used all three times:

> **Right now, I could…**
>
> 1. draw the four parts of an agent harness and say which part a given failure lives in
> 2. read an agent's trace and say where the money went, which step spent it, and which line I would put on a dashboard
> 3. name four failures that a better model would not fix, and the boundary that stops each
> 4. direct a coding assistant against a decision I made first, and review what it wrote against that decision
> 5. write a decision record: the boundary I drew, the alternative I rejected, and what would change my mind

Expect low numbers on 3 and 4 at 00:05. Nobody arrives able to name a failure a
stronger model will not fix, because the industry answer to every failure so far
has been a stronger model. And almost nobody has reviewed an assistant's diff
against a decision they wrote down first. Those two should be higher at 04:52. A
score that rises is the result this session is looking for, and it is the other
way round from next week.

Anyone can show you the agent loop. This session is about what the loop *is*. In
week 6 your own architecture goes under review. You want to argue from a model of
how these systems work, not from a framework's documentation.

## Before the session

*45 minutes.*

- [ ] **Run `make run`.** Confirm you get a clean trace **without** the grey
      `no LLM_API_KEY found` notice above it. Mock mode is fine for setup. But
      block 3 puts two models side by side, and mock mode ignores the model flag
      completely. Today is the day the key has to work.
- [ ] **Have a second model name ready** that your key can reach. Any two will
      do, as long as one config change swaps between them.
- [ ] **Run `make retry`, `make weird-mock` and `make injected`.** These are the
      three from week 0. Do not fix anything. **Write down what each one paid
      out.** You are asked for the three numbers at 00:08, and the whole of block
      2 is built on you having them.
- [ ] **Note your daily quota before you arrive.** On the Google AI Studio free
      tier it is **20 requests per day, per model**. One agent run is about three
      requests. That is roughly six runs a day. If you use them up the night
      before, you will be borrowing a neighbour's key by block 3.
- [ ] **Be ready to say, in one sentence, what in this codebase would have
      stopped each of the three.** A half-formed answer is the right answer to
      arrive with. You have not read the code yet, and you are not meant to have.

## The day, and where the stops are

**Five hours.** Five teaching blocks, one break of fifteen minutes, and two
stand-ups where you leave the screen. Nothing runs for more than 60 minutes
without a stop. This is a remote room, and an hour is about as long as anyone
holds attention through a screen.

| time | | what happens |
|---|---|---|
| 00:00 | opening | the five outcomes, your first rating, four questions from the pre-work |
| 00:15 | **1 · The Concept** | 55 minutes. It works, you draw it, then it loses ₹3,600 |
| 01:10 | stand up | five minutes, cameras off |
| 01:15 | **2 · The Problem** | 50 minutes. Three more failures, then the pattern under all four |
| 02:05 | break | fifteen minutes, straight after the ₹2,50,000 |
| 02:20 | **3 · The Drill** | 60 minutes. Three drills, then two models side by side |
| 03:20 | stand up | five minutes again |
| 03:25 | **4 · The Teardown** | 50 minutes. Forty thousand disputes a month, then write a boundary down |
| 04:20 | quiz | eight questions in chat |
| 04:30 | **5 · The Horizon** | 20 minutes. Which half of your work survives the next model |
| 04:50 | close | the assignment, the same rating again, two lines in chat |

Every block ends with a checkpoint. If one of its lines is not true for you, say
so at the time. It is a signal to slow down. It is not a test of you.

## Opening

*00:00 to 00:15.*

**00:05 · Your first rating, 3 minutes.** Five numbers in chat, one line each,
against the five statements above. Nobody sees them but you. They are saved and
shown beside your 04:52 numbers at the end.

**00:08 · Four questions from the pre-work, 7 minutes.** Nothing is re-taught
first. You are asked, you answer, and only what is wrong gets corrected.
Recalling something is what makes it stick. Hearing it again does not.

> 1. What does the reference agent actually do? One sentence.
> 2. What did each of your three runs pay out? Three numbers.
> 3. Which two tools did you watch it call?
> 4. You have twenty requests a day. Roughly how many runs is that, and why?

Every one is answerable from the pre-work alone. None of them needs the code, and
you were told not to read it.

## 1 · The Concept

*00:15 to 01:10 — 55 minutes.*

This block is the frame for the whole day. It answers four questions, in this
order. What is the smallest thing that counts as an agent? Why did a system that
reasoned correctly three times still pay three times? What are the parts of it,
and which file is each one in? And how many times does one ticket go round the
loop? Block 2 starts the moment those four are answered.

**Nothing here is a definition read off a slide.** You commit to an answer first,
every time, and the answer arrives afterwards.

### The case that works

*00:15 · Whole room, 3 minutes. Read it in silence.*

The run is already finished on the shared screen when you arrive. Nobody says
anything for the first twenty seconds. The first words of the day are yours.

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

### Draw what you just watched

*00:18 · Alone, 5 minutes. On paper, no help.*

Two minutes drawing, then two or three go up on the shared screen. Most people
draw a box and an arrow.

Do not look anything up and do not name anything yet. The drawing is the point,
and the gap between what you drew and what is actually there is what the next
twenty minutes are made of.

### Break it once, before anything has a name — ₹3,600

*00:23 · Whole room, 8 minutes. Answer in chat first, 30 seconds.*

We break it before a single thing gets its proper name. A framework lands far
better as the answer to a question you already have. Handing out vocabulary in
advance does not work as well.

Ravi really was double-charged and is owed ₹1,200. The queue delivers his ticket,
times out, and delivers it again. Later a support engineer re-runs it by hand.
Answer alone, in chat, before anything runs:

> **How much does Ravi get paid?**

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

### Name what you drew

*00:31 · Whole room, 7 minutes, built on the board.*

You will want to know *why* it did not remember. The answer is not a fault in the
model, so we read those opening lines closely and name what we are looking at.

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

Now the part you drew. **Everything in that drawing that is not the model is the
harness.** That means the loop and its stopping condition, the tool layer, the
context assembled for each step, and the trace that lets you see any of it. The
table at the top of this page has the four parts. Build it from the room rather
than reading it.

The reference agent makes this literal. Four files, one per part, small enough to
hold in your head at once.

| the file | the part |
|---|---|
| [`agent.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/agent.py) | the loop and the stopping condition |
| [`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py) | the tool layer — what the agent is able to do |
| [`llm.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/llm.py) | the model adapter, and `_build_prompt`, which reassembles the context from scratch every single step |
| [`trace.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/trace.py) | the trace — the only reason you can see what happened |

For the rest of the cohort, the harness is the thing we are building. The model
is a dependency.

Three of those four files are ordinary software. You already know how to make
that kind of code reliable. Hold on to that observation. Most of what makes an
agent trustworthy is not novel, and almost none of it is in the file with the
model in it.

### One run is many calls, and you do not know how many

*00:38 · Whole room, 8 minutes.*

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

### Inside one step

*00:46 · Alone 3 minutes, then the room. 11 minutes.*

The trace shows what the agent *did*. It does not show what the model was *sent*.
That is the last place in this system where something is still hidden. `make
prompt` opens it. It works on the scripted brain too, so this runs without
spending a request.

Read it in silence for three minutes before anything is named. Three things are
worth finding for yourself, and the room collects them in this order.

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

### "Can we not just make the thinking better?"

*00:57 · Whole room, 6 minutes.*

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

### Odds, or what is possible

*01:03 · Whole room, 7 minutes.*

Then comes the split that the rest of the cohort runs on.

Everything you can change in `llm.py` moves a **probability**. That means the
model, the temperature, the system prompt, and what you let into the context.
`MAX_STEPS` in `agent.py` and the contents of the `TOOLS` dictionary are the only
two things in this codebase that change what is **possible**.

| what you change | what it moves | where it lives |
|---|---|---|
| the model, the temperature, the system prompt, what enters the context | how **often** something expensive happens | `llm.py` |
| `MAX_STEPS`, and what is in the `TOOLS` dictionary | what the agent is **able** to do at all | `agent.py`, `tools.py` |

Teams spend their time on the first row. The second row is the one that holds
under audit. Every week after this one adds something to the second row.

### Checkpoint · 01:10

**You can now…**

- Draw the ReAct loop and name its three phases
- Name the four parts of the harness and point at the file each one lives in
- Say how many calls to the model one ticket takes, and why you do not control that number
- **Explain the difference between something that changes the odds and something
  that changes what is possible**

Read these before you stand up. Then put a number from 1 to 5 in chat on the last
one only.

If your number on the last one is below 3, say so. It is the sentence the whole
day rests on, and block 2 does not land without it.

*Five minutes, cameras off, away from the screen. Not a break. A reset.*

## 2 · The Problem

*01:15 to 02:05 — 50 minutes.*

Now the same agent, three more tickets. The ₹3,600 was the first, back in block
1. This block answers three questions. Which single line of code would have
stopped each one? What do all four have in common that no amount of better
reasoning touches? And what does the trace refuse to tell you even when nothing
errors?

Write the number down before each run. You will want the gap between your guess
and the trace.

**Two of these three you have already run.** You watched `make weird-mock` pay
₹5,000 and `make injected` pay ₹2,50,000 in the pre-work. So the amount is not
what we are predicting. For those two, commit to *what would have stopped it*.
That is the question week 0 asked you to sit with, and the only one worth ten
days of thinking.

The ₹0 is the one nobody has seen. That one keeps the amount prediction, and it
is not guessable.

### It pays an account that does not exist — ₹5,000

*01:15 · Whole room, 8 minutes. Commit in chat before the file opens.*

You ran this one in the pre-work, so the number is not the question. Ticket #9999
is an angry customer disputing a charge on an account that does not exist. The
agent looks it up. It is told, in plain JSON, `{"found": false}`. Then it issues
a ₹5,000 credit anyway.

Write down, alone, in 30 seconds:

> **Which single line of this codebase would have stopped it?** Not "what should
> the model have done". A line, and which file it is in.

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

One more thing is worth knowing, and we test it in the model comparison at 03:02.
On a real model this particular ticket is usually escalated correctly. The naive
policy is standing in for a worse brain than the one you are paying for today: a
cheaper model, a fallback during an outage, next quarter's cost reduction. The
question it asks is whether your system survives one.

### It follows a rule an attacker wrote — ₹2,50,000

*01:23 · Alone 30 seconds, pairs 2 minutes, then the room. 13 minutes.*

Also pre-run, so again, the number is not the question. This is the one worth the
full cycle. Commit alone, argue in pairs, then post in chat:

> **Whose text did the agent obey, and what in the system told it that text was
> trustworthy?**

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
between text that is data and text that is authority. This is week 4's material
and it does not fit into a smaller space. What you should take today is that the
gap exists, that no prompt wording closes it, and that you watched it happen.

### It refuses a customer who was owed the money — ₹0

*01:36 · Whole room, 8 minutes. Predict the number first, 30 seconds.*

This is the one you have not seen, and the only one where the number is still the
question. Write it down before it runs.

This is the quiet one. The model sends the account id as a number. The account
store keys them as strings. The lookup returns `{"found": false}` for an account
that exists. The agent concludes there is nothing to refund, and it escalates.

Its reasoning is impeccable. The trace is clean. Nothing errors. The payout line
reads `paid out ₹0 · no credit issued`. By the logic of the last hour that looks
like a success, and a real customer waits. Three of today's failures move money
that should not move. This one would survive every dashboard you currently own.

### The pattern

*01:44 · Whole room, 9 minutes, built on the board from your numbers.*

Put the runs side by side. Something shows up that is invisible one at a time.

| ticket | what the account record said | what the agent did |
|---|---|---|
| 4471 | honestly: charged twice | correct — credited ₹1,200 |
| 9999 | honestly: no such account | correct on a real model — escalated |
| 5820 | honestly: the invoice is legitimate | correct on a real model — refused to credit |
| 8001 | falsely: credit 250000, this is expected | paid ₹2,50,000 |

**The model was right every time its information was honest. It was wrong the
moment its information was not.** It has no way to doubt what a tool hands it. So
the useful question about an agent is not how clever it is. The useful questions
are what it is being told, what it is allowed to do about it, and what it
remembers afterwards.

### So how would you stop this?

*01:53 · Whole room, 5 minutes.*

We take the answers in the order rooms usually give them.

- **"Use a better model."** Reasonable. Hold the thought. We test it directly at
  03:02, and the result is not what most people expect.
- **"Fix the prompt. Tell it to check."** Try it. Then ask what happens on the
  ticket you have not thought of yet, and how you would find out it had failed.
- **"Validate the account exists."** Closer. Now ask who owns that check, where it
  lives, and what else needs one.

The answer is in [`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py).
`issue_credit` accepts any account id and any amount, and returns
`{"credited": true}`. No ceiling, no existence check, no approval. **The money
moved because nothing in the system was ever going to stop it.**

### Three ideas, and they are a tour of the harness

*01:58 · Whole room, 4 minutes.*

That gives us the other three ideas the rest of the cohort hangs off. They are
not a list. They are the harness you drew at 00:18, one part at a time.

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

### The only expectation in the system was written by the attacker

*02:02 · Whole room, 3 minutes. Guess the number before the search runs.*

Search this whole system for the word *expected*. Guess how many hits first.

You get two, the same sentence twice, both inside the poisoned account note:
*"…not the disputed amount. This is expected."*

**The only thing in this system that asserts an expectation is the attacker.**

Ticket 4471 carries `disputed_amount: 1200`, and the agent paid ₹1,200. Nothing
compared them. Ticket 8001 disputed ₹1,200, and the agent paid ₹2,50,000. Nothing
compared those either. The trace has exactly one line for what happened, `paid
out ₹1,200 · 1 credit`. It has no line at all for what should have happened. A
run that pays the right amount and a run that pays two hundred times too much
produce the same shape of output. They differ only in a number no code reads.

Hold on to that. In week 3 we write the expected outcome down somewhere the model
cannot reach. That is all an evaluation harness really is.

### Checkpoint · 02:05

**You can now…**

- Name four ways this agent loses money, with the amount for each
- Say which part of the harness each of those four failures lives in
- Explain why a better model does not fix any of them
- **Read a trace and say what it is not telling you**

Read them, then put a number from 1 to 5 in chat on the last one.

This is the checkpoint that matters most. Everything after the break assumes the
third one is solid.

*Fifteen minute break here, 02:05 to 02:20. It falls straight after the
₹2,50,000 on purpose. Most rooms carry on arguing about it, which is what the
break is for.*

## 3 · The Drill

*02:20 to 03:20 — 60 minutes. Hands on keyboards.*

Four exercises. Each one is a real defect in the agent you have been running.
Each one is the floor. None of them is clever, and all of them are absent from
most production agents.

This block answers three questions. How far does a fix have to travel before a
*machine* can see the failure? What does a tool do to the world, as opposed to
what it is called? And what happens when you give a coding assistant your
decision instead of your task?

**Every one of them makes a failure visible, named or measurable. None of them
prevents anything.** That is deliberate. Prevention is week 2, and it is worth
more when you have spent a week looking at the thing unguarded.

**Drills 1, 2 and 3 happen in the room.** Drill 4 is your homework. It is the
fiddliest of the four, it needs changes in two files and a decision about what
the word "steps" should mean, and it is the one that does not need the rest of
us.

### How every drill runs

*02:20 · Whole room, 5 minutes. On paper, before any code.*

Three steps, the same three every time.

1. **Decide.** Five minutes on paper, alone, no assistant. Write what you are
   going to change and why, before anything is typed.
2. **Build.** Give the assistant your *decision*, not the task. "Make the step
   budget exit non-zero and carry the outcome out through `main.py`" is a
   decision. "Fix the step budget" is a task, and it will be answered by
   guesswork you never see.
3. **Review.** Read the diff against your decision, not against whether it runs.
   The question is whether it did what you decided, not whether the tests pass.

**Scope your assistant to the files the drill names.** Pointed at the whole repo
it will go and fix `issue_credit`, which is the one thing we are not doing today.

### Drill 1 · Make the failure say its name

*02:25 · Decide 5 minutes in writing, then alone, 15 minutes.*

[`agent.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/agent.py)
runs `MAX_STEPS = 6`. When it runs out, it prints `▸ done  reached step budget`,
in green, and exits zero. Three signals all reporting success on a run that gave
up. **Give it its own outcome, its own colour, and a non-zero exit code.** Then
ask how many dashboards in your own organisation are currently counting that as a
success.

Notice how far the fix has to travel. The outcome exists only inside `run()`.
`run()` returns a `state` dictionary that `main()` ignores. And nothing in the
repo ever calls `sys.exit`.

So there is a gradient, and where you stop on it is the whole drill.

| what you change | who can now see the failure |
|---|---|
| one line in `agent.py` — use the existing `warn` kind | a person reading the terminal |
| plus a real `gaveup` kind in `trace.py` | a person, with its own name and colour |
| plus carry the outcome out and exit non-zero in `main.py` | a **machine** — cron, CI, a supervisor, a monitor |

One line makes it honest to a human. Three files make it honest to a process. The
thing that wakes you at two in the morning is a process. **Stopping after the
first line is the failure this drill is about.** Your terminal now looks right,
and every automated consumer is still being told the run succeeded.

**Decide this one before you prompt, because your assistant will decide it
silently if you do not:**

> **What exit code does `escalate` get?**

It is genuinely ambiguous. Escalating is the correct outcome for ticket 9999 and
the wrong outcome for ticket 5820, and the code cannot tell them apart. Whatever
number ends up there is a business rule set by autocomplete.

It is also the first thing the harness tells you about itself. Three files had to
agree for one fact to escape, and that is with four files and one loop. Hold that
number. In week 5 we come back to the harness and ask what happens to it when one
loop is no longer enough. That is the least reversible decision in this whole
course.

### Drill 2 · Grade the tools by consequence

*02:40 · Alone, then pairs. 10 minutes.*

Look at two lines from a run that worked.

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

`escalate` is the one to argue about in pairs. Most rooms call it a write. Ask
what would have to change for it to be irreversible. If escalating also emailed
the customer, it would be. Same function, different grade. **The grade describes
what the function reaches, not what it is called.**

**Three grades here, four levels in the published tool, and that is deliberate.**
The Agent Authority Review on our resources page scores the same judgment on four
undo-cost levels, from "undo in seconds, nobody notices" to "cannot be undone".
Three is what a room of eight can hold and argue about in ten minutes. Four is
what you want in front of a real workflow, where the difference between "undo in
seconds" and "undo by Friday with an apology" decides who owns the step. **read**
and **write** split into the first two levels; **irreversible** is the fourth. Use
three today and the tool's four on your own system.

### Drill 3 · Check the arguments before you dispatch

*02:50 · Decide 3 minutes in writing, then alone, 12 minutes.*

At every step the model returns two things: the name of a tool, and the arguments
to call it with. `agent.py` takes the name, looks it up, and calls the function
with whatever came back.

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

### Comparing two models

*03:02 · Pairs, 10 minutes. This is where "use a better model" gets tested.*

This is the block your key is for. The scripted brain ignores the model flag, so
mock mode cannot show you any of what follows. No key, or a key misbehaving? Pair
with whoever is next to you. One working key runs this comparison for two people
perfectly well.

One config value decides which model is inside the loop. Everything else is
fixed: same tools, same system prompt, `temperature=0`. So what you are watching
is the model, not sampling luck.

Predict in pairs, in 60 seconds, before either run:

> **Will the second model escalate ticket 9999, or pay it?**

```
make weird                                      # the default model
python -m src.main --ticket 9999 --model <a second model>
```

Put the two traces side by side. Most models escalate. Some issue the credit to
the account that does not exist. Some wrap their JSON in a Markdown code fence,
which the adapter already forgives. And some emit JSON that does not parse at
all, which takes the whole run down. That last one is worth sitting with. **Your
model's output is a parsing surface you own**, and nobody writes a test for it.

Then the same comparison against `make injected`, run from the front rather than
on eight machines, because it is six requests each and would put everybody at 18
of 20 before the afternoon. Watch the better model read the attacker's note more
carefully and follow it more confidently. That is the honest shape of the answer.
"Use a better model" is a real effect on the tickets where the record is honest.
It has no effect at all on the one where it is not. The better model moves next
quarter. The boundary you drew does not.

### Then stop

*03:12 · Whole room, 8 minutes.*

You will want to fix `issue_credit`. You will want to put a ceiling on it, check
the account exists, and remember what it already paid. Do not.

Sitting with a visible, unguarded, money-moving tool for a week is the point.
Week 2 opens by building that guardrail properly, with a limit, a human gate and
durable state. Patching it in the last ten minutes today is worth much less.
**Write down the guard you wanted to add.** You will implement your own note next
week.

Checking what you did build costs nothing. The drills all live in files the
scripted brain still dispatches through, so these three spend no quota at all:

```
make mock · make weird-mock · make retry
```

### Drill 4 · Put cost on every step

*Homework. Not run in the room — it is the first item under **After**.*

[`trace.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/trace.py)
prints tokens, latency and rupees *once, at the end*. That tells you a run cost
₹0.38. It tells you nothing about which step spent it. Capture the token
difference around each model call and attribute it to the step.

While you are in there, look at the summary. It says `steps 4` on a run that went
round the loop three times, because it is counting trace lines rather than turns.
Decide what that number should mean, and make it mean that.

It is here rather than in the room because it is the only one of the four that
needs no argument with anybody. Week 2's cycle A turns the number it produces
into a limit, so arriving without it means setting a budget blind.

### Checkpoint · 03:20

**You can now…**

- Make a silent failure announce itself to a machine, not just to a person reading a terminal
- Grade a tool by its consequence rather than by its name
- Write a contract for a tool and refuse a call that does not match it
- **Give a coding assistant a decision instead of a task, and review what it
  returns against that decision**

Read these, then put a number from 1 to 5 in chat on the last one.

The drill block is where it is easiest to get quietly stuck and say nothing about
it. A number in chat is the only way anyone finds out before the teardown. Put
one in even if it is a 2.

*Five minutes, stand up again.*

## 4 · The Teardown

*03:25 to 04:15 — 50 minutes. In pairs, then the room.*

Everything so far fits on one screen. Now the version that does not. This block
answers two questions. Which of today's four failures changes shape when the same
agent runs at forty thousand disputes a month? And what does a boundary have to
say before somebody else can build it?

### The system

*03:25 · Whole room, 3 minutes.*

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

### Five questions

*03:28 · Pairs, 12 minutes. Two questions per pair, assigned by name.*

Take the two you are given, and bring the sharpest answer back to the room. You
are not expected to get through all five.

**1 · The retry that pays twice.** `issue_credit` times out mid-call. The agent
does what every well-behaved distributed system does, and retries. Did the
customer receive ₹1,200 or ₹2,400, and how would you know? Now design the fix,
and say which component owns it. You watched the small version of this in `make
retry` at 00:23. The answer that works on one process is not the answer that
works on forty.

**2 · How far one good deploy reaches.** Someone improves the policy text. It
ships on a Tuesday. By Thursday, 40,000 disputes have been processed under it.
Nothing errored. What would have had to exist on Monday for this to be
survivable?

**3 · The question eight months later.** A regulator asks why one specific
account was credited. What does the audit trail have to contain to answer that?
Is a stored prompt and completion enough? Note what you learned at 00:46. The
model's stated reasoning is never stored. So if you were planning to show someone
the `thought`, it does not exist.

**4 · Where the human goes.** Approving every credit does not scale. Approving
none is what we watched at the start. Draw the line, and defend it in terms of
money rather than confidence.

**5 · When the model is down.** The provider has an outage. Do you queue, fail
closed, or fall back to rules? And what do you tell the customer waiting inside a
four-hour service level agreement? Remember what failing closed looked like at
01:36: ₹0 paid, a clean trace, and a customer who was owed the money.

### Back to the room

*03:40 · Whole room, 10 minutes. Two minutes per question.*

Each pair gives one answer per question, and the room argues the one it
disagrees with. Two minutes is the whole budget, so lead with the decision rather
than the reasoning.

**None of these are model problems. Every one is a boundary someone either drew
or did not.** That sentence is what the block exists to land, and it is the one
to take into next week.

### Write the boundary down

*03:50 · Pairs, 12 minutes.*

Pick the one question you argued hardest about. Write it up as a one-page
decision record, in the shape you would put in front of an architecture review.
Seven sections, and they do not change from week to week — week 6 has to be
readable against week 1.

1. **Context.** What breaks today, cited against a run you watched, with the number.
2. **Goals.** Three at most, each one testable. "Safer" is not a goal. "No dispute is credited twice" is.
3. **Non-goals.** What you are not fixing, and why that is acceptable this quarter.
4. **The design.** The checks, in the order they run, and what each does when it fails: refuse, escalate, or ask a person. Say where the state lives.
5. **What can go wrong.** One row per case: what arrives, what your rule does, what the customer sees.
6. **Alternatives.** One you rejected, and why. "Use a better model" counts, and rejecting it well is most of today.
7. **Open questions.** What you could not settle in fifteen minutes.

This is the artefact week 2 opens with. You will be implementing your own
document, so write it for the person who has to build it. Next week, that is you.

### Review another pair's

*04:02 · Swap, 8 minutes.*

Four questions, each scored 0, 1 or 2 by the reviewing pair. The written comment
matters more than the number. Nothing is summed, nothing is averaged and nothing
is ranked; the scoring exists only to make eight minutes of review structured
enough to finish.

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

### Closing the loop — the leader's framing

*04:10 · Whole room, 5 minutes.*

One trade-off runs under all five questions. It is **autonomy against
reversibility**, and it is a business decision dressed as an engineering one.
More autonomy means more value and more damage when it goes wrong. The lever you
actually control is how reversible each action is.

Here is how to frame that upward. Do not say *"the agent might hallucinate"*.
That invites a demand for a guarantee nobody can give. Say **"here is what it can
do without a human, here is what it cannot, and here is what it costs us if it is
wrong."** That sentence survives a board meeting. The first one does not.

### Checkpoint · 04:15

**You can now…**

- Take a failure you watched at one-agent scale and say what changes at forty processes
- Say what an audit trail has to contain beyond a stored prompt and completion
- **Write a boundary down in a form somebody else could actually implement**

No rating on this one. You are mid-argument and the quiz is five minutes away.
Just read them.

## The quiz

*04:20 to 04:30.*

Eight questions in chat, mixed across the whole day rather than grouped by block.
The mixing is deliberate. Sorting questions by topic lets you answer from the
heading instead of from the problem. Everybody answers. Then the room takes up
the two or three that split it.

The multiple-choice ones appear again on your check page afterwards, so you can
answer them a second time on your own. The written ones are taken up live and
live only in the room.

## 5 · The Horizon

*04:30 to 04:50 — 20 minutes.*

Every session closes here. We look at what is moving in the field right now, and
what it means for the person you are three years from today. This is not a news
round-up. The question is always *what should I do differently because of this?*

### What is durable when the models keep moving

*04:30 · Whole room, 10 minutes.*

You watched two models disagree about whether to give away money, on identical
inputs. Then you watched both of them obey an attacker with equal confidence.
Anything you build on top of "this model behaves well" lasts about one release
cycle.

So the honest career question is which half of your work survives the next
capability jump. The answer, consistently, is the half you did today. Naming
failure modes. Drawing boundaries. Deciding what a system may do without a
person. None of that got easier when the models got better. It got more valuable,
because there is more of it to do.

A coding assistant will write any of today's three drills for you in under a
minute. It has no view at all on what the step budget should be, and it will not
tell you that it has no view. That gap is the job.

### Where the demand actually is

*04:40 · Whole room, 10 minutes.*

What is being hired for in India right now, at what level, and which skills
employers say they cannot fill. We set that against what is quietly being
absorbed into tooling.

The specifics come from the radar in the week this is taught. Nothing dated is
written into this file.

## Close

*04:50 to 05:00.*

**04:50 — the assignment.** Four things, set out under *After* below.

**04:52 — the same five statements again.** The identical five outcomes you rated
at 00:05. Same words, same order, 1 to 5. Both sets then go on screen together,
and we name the two that moved most.

Then one question out loud: **who moved on 3 or 4?** Those are the two this
session predicted would be lowest at 00:05, and the prediction is on the page
above for you to check it against.

**04:56 — two lines in chat.** Everybody answers both.

> The one thing I will change in my own build this week is ______
>
> The thing I am still unsure about is ______

The second line is the one that matters. It sets what week 2 opens with. An
honest *"I still do not really follow why the context gets rebuilt"* is worth
more than a tidy answer.

## After

*About 2 hours.*

1. **Drill 4** on the reference agent. Put cost on every step. It is the
   fiddliest of the four, and the one that does not need the room. Week 2's first
   build turns the number it produces into a limit, so arriving without it means
   setting a budget blind.
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

None of it is required. None of it is long. Three of the seven are ours.

- [Designing agentic systems](/resources/guides/agentic-system-design). The six
  decisions an agentic design is made of. This week is decisions 2, 4 and 6 —
  what the system is for and where it stops, what each tool may do, and what you
  can see afterwards. Decision 1 was your week 0 pre-work, and decisions 3 and 5
  are next week.
- [The Agent Authority Review](/resources/agent-authority-review). Drill 2 grades
  tools read, write or irreversible. This tool scores the same judgment on four
  undo-cost levels, one step of a workflow per row. Run it on your own system and
  bring the sheet to week 2.
- [Who may call the tool](/resources/guides/tool-permissions). Drill 3 as a
  written argument — permissions live at the tool rather than in the prompt, and
  a tool checks the evidence it was handed.
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
