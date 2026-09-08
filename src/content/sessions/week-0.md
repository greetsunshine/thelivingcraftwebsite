---
week: 0
title: "Before we begin"
summary: "Get the reference agent running, then tell Sunil where you are starting from."
status: ready
---

Welcome aboard. There is about 45 minutes of prep to do on your own, then we meet
for a short live kickoff. Do the two things below beforehand. Then you will spend
the first real minute of Class 1 running an agent, instead of trying to get your
setup to work.

## You belong here

This is a small room of senior engineers. You are past the tutorials, and you are
now responsible for shipping agentic systems that hold up. Over the next few
weeks we build one real production-grade agent together. We break it on purpose,
harden it, and pressure-test it live.

You do not need to have shipped an agent or memorised a framework. You need to
read Python, reason about systems, and be willing to think out loud with peers at
your level. The rest is what we are here for.

Anyone can show you the agent pattern. This cohort shows you the three times it
failed in production, and how to build so that it does not.

### How the weeks work

Every live session runs the same five beats.

1. **The Concept** — the idea, shown working on the smallest example that is
   still real
2. **The Problem** — the same system, broken, and how the room would fix it
3. **The Drill** — two or three hands-on exercises that make the fix yours
4. **The Teardown** — the architecture of a system at enterprise scale, worked in
   pairs, where the fix from block 3 is no longer enough
5. **The Horizon** — where the field is moving and what it means for your career

Between sessions there is about two hours of extending your build, plus a short
written decision record. Add the live session and its pre-work, and that is the
~5 hrs/week you were quoted. It is meant to be honest rather than aspirational.

The Horizon is the one part that changes each time this course runs. It covers
what is actually moving in the field that week, what is being hired for, and
which of your skills are growing in value rather than being absorbed into
tooling. It is short, and it is not a news round-up. The question is always what
you should do differently because of it.

Three house rules. What breaks is the curriculum. Argue your reasoning. And in a
room this small, participate for real.

---

## 1 · Set up your environment

*~30 minutes. Do this first. It is the only step that can go slowly.*

You are done with this step when you are watching a small AI agent resolve a
billing dispute on your screen. That is our shared reference agent. It is an
**Autonomous Resolution Agent** that investigates an account and then takes a
consequential action. We grow it and harden it all cohort.

Everything starts at the repo:
**[github.com/greetsunshine/reference-agent](https://github.com/greetsunshine/reference-agent)**.
It is private, so you will have an invitation to it in your email. If that link
gives you a 404, tell Sunil before you do anything else. None of the steps below
will work until you can open it.

### Pick one of three paths

**Dev Containers, recommended.** You install nothing but the container tooling
itself. Your environment then ends up identical to everyone else's in the room.

- [ ] Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it. This is the only slow step.
- [ ] Add the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) to VS Code
- [ ] Clone the repo, open the folder in VS Code, and choose **Reopen in Container**
- [ ] Let it build itself. There are no manual installs and no `pip`.

**Codespaces, no install at all.** On the repo, choose *Code → Codespaces →
Create*. Everything is pre-built in the browser. It is slower to start, there is
nothing to clean up afterwards, and it is a good fallback if Docker gives you
trouble.

**Plain Python, if you would rather.** `make setup` installs the requirements
into whatever environment you are already in.

### Then, whichever path you took

- [ ] Copy `.env.example` to `.env`
- [ ] Paste your model API key into it, on one line
- [ ] Run it: `make run`

The simplest key to get hold of is a free one from
[Google AI Studio](https://aistudio.google.com/apikey). The repo is configured
for it out of the box. Any OpenAI-compatible endpoint works if you would rather
use something else. `.env.example` carries ready-made settings for OpenAI, Groq,
Together and local Ollama. If you move to a paid key, set a small spend limit on
it. An agent that loops can spend real money, and that is not hypothetical. It is
Week 2.

`make mock` will get you through setup without a key. Two things do need one.
`make injected` in the pre-work below needs a key. So does the **model
comparison** in Class 1, where we send the same ticket through two different
models, and that one also wants a second model name to try. So get the key
working this week rather than during the session. `make retry` needs no key
either way, so a key problem never costs you both demonstrations. If your key
will not cooperate, say so, and you will pair with someone in the room.

You are done when `make run` gives you something like this:

```
▸ plan  ticket #4471 — Billing dispute — charged twice for Pro...
▸ tool  lookup_account(account_id='4471') -> {'found': True, ...}
▸ tool  issue_credit(account_id='4471', amount=1200) -> {'credited': True, ...}
▸ done  All done.
tokens 660 (in 540 / out 120) · steps 4 · 0.0s · ~₹0.38
paid out ₹1,200 · 1 credit
```

Those exact figures come from the scripted brain. That is a fixed, canned stand-in
for a real model, and it is what you see before your key is in place. With a key,
the four trace lines look the same, and the tokens, the time and the cost are
yours.

Watch the last line all cohort. The tokens are the cheap number.

**No key yet, or your key is misbehaving?** Run `make mock`. It forces the
scripted brain, needs no key at all, and still prints the full trace. So a key
problem never stops you seeing the agent work. `make run` falls back to it on its
own too. It prints a grey `no LLM_API_KEY found` notice above the trace, so you
always know which brain you are watching.

**Then, before Class 1. Ten minutes, and not optional.** Three commands:

```
make retry        # no key needed
make weird-mock   # no key needed
make injected     # needs your key
```

Run them and just *notice*. Do not fix anything, and do not read the code yet.
All three have the same shape, and it is not the shape people expect. **The agent
does not make a mistake, and the system loses the money anyway.**

- `make retry` pays one customer ₹3,600 for a single ₹1,200 double-charge, across
  three runs it got right every time.
- `make weird-mock` pays ₹5,000 on an account that does not exist. Watch the
  lookup come back, and read what it says before the money moves.
- `make injected` credits ₹250,000 on an honest ₹1,200 dispute.

Note what each one paid out. You will be asked for the three numbers in the first
ten minutes of Class 1.

Bring what you saw. We pick all three up in Class 1. **The question there is never
"why was the model wrong?"** Usually it was not wrong. The question is *what in
this codebase would have stopped it?* You are being given ten days to sit with
that question. Arriving with a half-formed answer beats arriving with none.

**One thing you have not seen yet, and should not go looking for.** There is a
fourth way this agent loses money. It is the only one that costs ₹0 and looks
like a success on every dashboard you own. We do that one together.

**Your daily quota.** On the Google AI Studio free tier you get **20 model
requests per day, per model**. One agent run is roughly three requests, one per
step. That is about **six runs a day**. `make retry`, `make mock` and
`make weird-mock` cost you none of it. Only `make injected` and `make run` do. Do
not use up the allowance experimenting the night before Class 1. If you do, you
will be sharing someone else's screen for the drills.

**Stuck?** Do not spend more than twenty minutes on it. Email Sunil with your
operating system and the error, and we will sort it out. Arriving with a working
environment is the single most important thing you can do before we meet.

---

## 2 · Your intake

*~20 minutes. The most valuable thing you will do this week.*

**[Complete your intake →](/craft/intake)**

There are three short sections. A quick check on where you are starting from. A
baseline self-assessment across the technical and leadership outcomes. And a
candid read on your own production reality.

One thing is worth knowing before you start. We run the identical
self-assessment again after the final week, and most people are surprised how far
the numbers move. Candid beats polished.

Please submit a couple of days before Class 1, so there is time to read the room
before we meet.

### If you want to brush up first

This is optional, and none of it is long. Skim whichever one matches an answer
you rated *rusty* or *new to me*. There is nothing here you need to have
memorised.

- **Python, async** — [asyncio](https://docs.python.org/3/library/asyncio.html)
- **Retries, timeouts, backoff** — [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/), AWS Builders' Library
- **Idempotency** — [Idempotent requests](https://stripe.com/docs/api/idempotent_requests), Stripe API docs. Idempotent means doing something twice has the same effect as doing it once.
- **Prompts, tokens, context** — [Prompt engineering overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

If the self-check leaves you rating yourself *new to me* on Python, systems, or
reading diffs, message Sunil rather than worrying about it. We would far rather
help you arrive ready than have you catch up in a room of eight.

---

## The live kickoff

*~60–75 minutes.*

Short and human. We are not teaching content yet. We are making sure every
environment runs, and helping eight people who do not know each other start
working as a room.

| | |
|---|---|
| ~20 min | Welcome and the three house rules — the promise, and how we work together |
| ~10 min | Meet the room — eight peers start becoming colleagues |
| ~30 min | Everyone runs the agent together; anyone still stuck gets help live while others try the weird ticket |
| ~10 min | Bridge to Class 1 — a taste of the map we draw next session |

**Come with** a working environment, your intake submitted, and your curiosity.
Nothing else.

Dates and the weekly time (IST) are confirmed by email once the room is
finalised. See you at the kickoff. Come ready to run an agent in the first five
minutes.
