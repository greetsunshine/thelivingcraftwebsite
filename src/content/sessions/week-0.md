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
billing dispute on your screen. That is our shared reference agent, and we grow
and harden it all cohort.

- [ ] Install the container tooling from your welcome email — the only slow step
- [ ] Open the reference repo in the dev container; it builds itself, no manual installs
- [ ] Add your model API key where the README shows — one line in `.env`
- [ ] Run it: `make run`

The simplest key to get hold of is a free one from
[Google AI Studio](https://aistudio.google.com/apikey); the repo is configured
for it out of the box. Any OpenAI-compatible endpoint works if you would rather
use something else — see `.env.example`. If you move to a paid key, set a small
spend limit on it. An agent that loops can spend real money, and that is not
hypothetical: it is Week 2.

You are done when you see something like this:

```
# reference agent · billing dispute #4471
▸ plan   investigate account, decide credit
▸ tool   lookup_account(id=4471) → past_due: ₹0
▸ act    issue_credit(₹1,200) → done
resolved · tokens 1,284 · 2.1s · ₹2.10
```

**Optional, two minutes.** Give it a weird ticket — an angry customer whose
account does not exist — and just *notice* what it does. Do not fix anything. We
dig into what you saw in Class 1.

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

> If the self-check leaves you rating yourself *new to me* on Python, systems, or
> reading diffs, message Sunil rather than worrying about it. We would far rather
> help you arrive ready than have you catch up in a room of eight.
>
> [PLACEHOLDER: Sunil to add the four prerequisite refresher links — Python,
> distributed systems, LLM basics, reading diffs.]

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
