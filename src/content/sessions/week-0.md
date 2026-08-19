---
week: 0
title: "Before we begin"
summary: "Get the reference agent running, then tell Sunil where you are starting from."
status: ready
---

Welcome aboard. About 45 minutes of prep on your own, then we meet for a short
live kickoff. Do the two things below beforehand and you will spend the first
real minute of Class 1 running an agent rather than fighting a setup screen.

## You belong here

This is a small room of senior engineers past the tutorials and now on the hook
for shipping agentic systems that hold up. Over the next few weeks we build one
real production-grade agent together, break it on purpose, harden it, and
pressure-test it live.

You do not need to have shipped an agent or memorised a framework. You need to
read Python, reason about systems, and be willing to think out loud with peers at
your level. The rest is what we are here for.

Anyone can show you the agent pattern. This cohort shows you the three times it
failed in production — and how to build so it does not.

### How the weeks work

Every live session runs the same arc: a **Production Teardown** (a real failure,
dissected) → **The Mental Model** → **The Build** (hands-on) → **Peer Design
Review** → **The Leader's Lens** (the trade-off and the exec framing). Between
sessions, roughly two to three hours extending your build plus a short written
decision record.

Three house rules: failure-first, argue your reasoning, and — in a room this
small — real participation.

---

## 1 · Set up your environment

*~30 minutes. Do this first; it is the only step that can go slowly.*

You are done with this step when you are watching a small AI agent resolve a
billing dispute on your screen. That is our shared reference agent — an
**Autonomous Resolution Agent** that investigates an account and then takes a
consequential action — and we grow and harden it all cohort.

Everything starts at the repo:
**[github.com/greetsunshine/reference-agent](https://github.com/greetsunshine/reference-agent)**.
It is private, so you will have an invitation to it in your email. If that link
gives you a 404, tell Sunil before you do anything else — none of the steps
below will work until you can open it.

### Pick one of three paths

**Dev Containers — recommended.** Nothing to install but the container tooling
itself, and your environment ends up identical to everyone else's in the room.

- [ ] Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and start it — the only slow step
- [ ] Add the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) to VS Code
- [ ] Clone the repo, open the folder in VS Code, and choose **Reopen in Container**
- [ ] Let it build itself — no manual installs, no `pip`

**Codespaces — no install at all.** On the repo, *Code → Codespaces → Create*.
Everything is pre-built in the browser. Slower to start, nothing to clean up
afterwards, and a good fallback if Docker fights you.

**Plain Python — if you would rather.** `make setup` installs the requirements
into whatever environment you are already in.

### Then, whichever path you took

- [ ] Copy `.env.example` to `.env`
- [ ] Paste your model API key into it — one line
- [ ] Run it: `make run`

The simplest key to get hold of is a free one from
[Google AI Studio](https://aistudio.google.com/apikey); the repo is configured
for it out of the box. Any OpenAI-compatible endpoint works if you would rather
use something else — `.env.example` carries ready-made settings for OpenAI,
Groq, Together and local Ollama. If you move to a paid key, set a small spend
limit on it. An agent that loops can spend real money, and that is not
hypothetical: it is Week 2.

You are done when `make run` gives you something like this:

```
▸ plan  ticket #4471 — Billing dispute — charged twice for Pro...
▸ tool  lookup_account(account_id='4471') -> {'found': True, ...}
▸ tool  issue_credit(account_id='4471', amount=1200) -> {'credited': True, ...}
▸ done  All done.
tokens 660 · steps 4 · 0.4s · ~₹0.38
```

**No key yet, or your key is misbehaving?** Run `make mock`. It forces a
deterministic brain, needs no key at all, and still prints the full trace — so a
key problem never stops you seeing the agent work. `make run` falls back to it
on its own, too.

**Optional, two minutes.** Run `make weird` — ticket #9999, an angry customer
whose account does not exist — and just *notice* what it does. Do not fix
anything. We dig into what you saw in Class 1.

**Stuck?** Do not burn more than twenty minutes fighting it. Email Sunil with
your OS and the error and we will get you sorted. Arriving with a working
environment is the single most important thing you can do before we meet.

---

## 2 · Your intake

*~20 minutes. The highest-leverage thing you will do this week.*

**[Complete your intake →](/craft/intake)**

Three short sections: a gut-check on where you are starting from, a baseline
self-assessment across the technical and leadership outcomes, and a candid read
on your own production reality.

Worth knowing before you start: we run the identical self-assessment again after
the final week, and most people are surprised how far the numbers move. Candid
beats polished.

Please submit a couple of days before Class 1 so there is time to read the room
before we meet.

### If you want to brush up first

Optional, and none of it is long. Skim whichever one matches an answer you rated
*rusty* or *new to me* — there is nothing here you need to have memorised.

- **Python, async** — [asyncio](https://docs.python.org/3/library/asyncio.html)
- **Retries, timeouts, backoff** — [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/), AWS Builders' Library
- **Idempotency** — [Idempotent requests](https://stripe.com/docs/api/idempotent_requests), Stripe API docs
- **Prompts, tokens, context** — [Prompt engineering overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

If the self-check leaves you rating yourself *new to me* on Python, systems, or
reading diffs, message Sunil rather than worrying about it. We would far rather
help you arrive ready than have you catch up in a room of eight.

---

## The live kickoff

*~60–75 minutes.*

Short and human. We are not teaching content yet — we are making sure every
environment runs, and turning eight strangers into a room.

| | |
|---|---|
| ~20 min | Welcome and the three house rules — the promise, and how we work together |
| ~10 min | Meet the room — eight peers start becoming colleagues |
| ~30 min | Everyone runs the agent together; stragglers get help live while others poke the weird ticket |
| ~10 min | Bridge to Class 1 — a taste of the map we draw next session |

**Come with** a working environment, your intake submitted, and your curiosity.
Nothing else.

Dates and the weekly time (IST) are confirmed by email once the room is
finalised. See you at the kickoff — come ready to run an agent in the first five
minutes.
