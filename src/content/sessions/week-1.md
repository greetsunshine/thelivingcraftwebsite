---
week: 1
title: "Foundations of durable architecture"
module: M1
summary: "Draw the map: what an agent actually is as a system, and where it breaks before you have written a line of it."
status: draft
---

WebPage: https://claude.ai/code/artifact/435ed083-117f-45d1-8827-ee939e7d1889?via=auto_preview


We start with an agent that works, break it in front of you, fix what we can in
forty-five minutes, and then put a system on the table that cannot be fixed in
forty-five minutes. By the end you will be able to draw your own architecture on
a whiteboard, name every place it can fail, and defend which of those failures
you are choosing to tolerate.

Anyone can show you the agent loop. This session is about what the loop *is* —
so that in week 6, when your own architecture is under review, you are arguing
from a model rather than from a framework's documentation.

## Before the session

*~45 minutes.*

- [ ] Run `make run` and confirm you get a clean trace **without** the grey
      `no LLM_API_KEY found` notice above it. Mock mode is fine for setup, but
      block 3 puts two models side by side and mock mode ignores the model
      flag entirely — so today is the day the key has to work.
- [ ] Have a **second model name** ready that your key can reach. Any two will
      do; two from the same provider is fine. If your key will not cooperate,
      tell Sunil rather than fighting it — you will pair with someone in the
      room for that block, which costs you nothing.
- [ ] Bring one real system you are accountable for at work. Not a diagram —
      just be ready to describe what it does and what breaks at 3am.
- [ ] Run `make retry` and `make injected` — five minutes, and the one piece of
      pre-work that is not optional. Week 0 has the detail; the short version is
      that in both of them the agent does not make a mistake and the system
      loses the money anyway. Do not fix anything and do not read the code yet.
      `make retry` needs no key; `make injected` does.

## 1 · The Concept

*~15 minutes.*

We start with the case that works.

```
▸ plan  ticket #4471 — Billing dispute — charged twice for Pro...
▸ tool  lookup_account(account_id='4471') -> {'found': True, ...}
▸ tool  issue_credit(account_id='4471', amount=1200) -> {'credited': True, ...}
▸ done  All done.
tokens 660 (in 540 / out 120) · steps 4 · 0.0s · ~₹0.38
paid out ₹1,200 · 1 credit
```

That is `make run` on the deterministic brain, which is what is on the screen in
the room — with your own key the four lines look the same and the tokens, time
and cost are yours. The payout line is the one to keep watching all cohort; the
tokens are the cheap number on it.

Four lines. A customer disputes a charge, something investigates, something
takes a consequential action, it stops. That is an agent — there is no more to
the definition than this.

So we read those four lines closely and name what we are looking at:

**An agent is a control loop over an unreliable oracle.** Plan, act, observe,
repeat, until a stopping condition. The model is one component inside it — the
only one that is probabilistic, and the only one you cannot unit-test into
submission. Draw the loop. Mark the model.

Everything you drew that is not the model is the **harness**: the loop and its
stopping condition, the tool layer, the context assembled for each turn, and the
trace that lets you see any of it. That word is worth having, because for the
rest of the cohort the harness is the thing we are building. The model is a
dependency.

The reference agent makes this literal — four files, one per part, small enough
to hold in your head at once.

| | |
|---|---|
| [`agent.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/agent.py) | the loop and the stopping condition |
| [`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py) | the tool layer — what the agent is able to do |
| [`llm.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/llm.py) | the model adapter, and `_build_prompt`, which reassembles the context from scratch every single turn |
| [`trace.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/trace.py) | the trace — the only reason you can see what happened |

Three of those four files are ordinary software you already know how to make
reliable. That is the observation to hold on to: most of what makes an agent
trustworthy is not novel, and almost none of it is in the file with the model in
it.

## 2 · The Problem

*~30 minutes.*

Now the same agent, a different ticket.

Ticket #9999 is an angry customer disputing a charge on an account that does not
exist. The agent looks it up. It is told, in plain JSON, `{"found": false}`. And
then it issues a ₹5,000 credit anyway.

Nothing here is a hallucination — it was handed the truth and acted against it.

We run this one as `make weird-mock`, on the deterministic brain, so that every
screen in the room shows the identical trace and nothing rests on sampling luck.
Which means saying the awkward part out loud: **there is no model in this
failure at all.** Today's brain is a dozen lines of if-statements in
[`llm.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/llm.py)
that investigate, then pay out regardless of what came back.

That is not a cheat. It is the argument. Nothing downstream noticed, and nothing
downstream *could* have told the difference between a naive policy, a small
model having a bad day, and a capable model that was talked into it — because
nothing downstream was looking. A better brain changes the odds of this trace.
It does not change whether it is possible. So: **how would you stop this?**

We take the answers in the order rooms usually give them.

- **"Use a better model."** Reasonable. Hold the thought — we test it directly
  in the next block, and the result is not what most people expect.
- **"Fix the prompt — tell it to check."** Try it. Then ask what happens on the
  ticket you have not thought of yet, and how you would find out it had failed.
- **"Validate the account exists."** Closer. Now: who owns that check, where
  does it live, and what else needs one?

The answer is in [`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py).
`issue_credit` accepts any account id and any amount and returns
`{"credited": true}`. No ceiling, no existence check, no approval. **The money
moved because nothing in the system was ever going to stop it.**

Which gives us the other three ideas the rest of the cohort hangs off. They are
not a list — they are a tour of the harness you just drew, one part at a time.

**Tools are your real API surface.** Every tool you expose is a capability you
have handed to something you cannot fully predict. `issue_credit(₹1,200)` is not
a function call; it is a spend authorisation.

**Context is state, and state has a lifetime.** What the agent knows is
assembled fresh each turn from things with different truth-lifetimes: a system
prompt written months ago, a policy fetched a second ago, a conversation
summarised twice. Most "the model got confused" incidents are a state-management
bug wearing a costume.

**Durability is a set of boundaries you chose on purpose.** Timeouts, spend
caps, tool scopes, human confirmation on irreversible actions, and what happens
when a step fails halfway. A durable system is not one that does not fail — it
is one whose failures are bounded, visible, and cheap.

Tools, context, boundaries: the tool layer, the per-turn assembly, and what you
put between the parts. Everything from week 2 onwards is added to one of them.

> The line we keep coming back to: **AI builds, the human judges and directs.**
> Every decision in this session is one a person has to own, and "the model
> decided" is not an answer you can give a board.

## 3 · The Drill

*~45 minutes, hands-on.*

Three exercises. Each is a real defect in the agent you have been running, and
each one is the floor — not clever, just absent from most production agents.

Do **1 and 3 in the room**; they are small. Drill 2 is the fiddly one, and if
the clock beats us it finishes cleanly in the After block.

**Drill 1 · Make the failure say its name.**
[`agent.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/agent.py)
runs `MAX_STEPS = 6` and, when it runs out, prints `▸ done  reached step
budget`. An agent that gave up is reporting success. Give it its own outcome,
its own colour, and a non-zero exit code — then ask how many dashboards in your
own org are currently counting that as green.

Notice what that costs. The outcome exists only inside `run()`, which returns a
`state` dict that `main()` drops on the floor, and nothing in the repo ever
calls `sys.exit`. Three files — `agent.py`, `trace.py`, `main.py` — to let one
failure reach the outside world. That ratio is the drill: **an outcome nobody
plumbed out is not an outcome**, and this is the cheap version of the same
argument you will have about your own service next week.

It is also the first thing the harness tells you about itself. Three files had
to agree for one fact to escape, and that is with four files and one loop. Hold
that number — in week 5 we come back to the harness and ask what happens to it
when one loop is no longer enough, which is the least reversible decision in
this whole course.

**Drill 2 · Put cost on every step.**
[`trace.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/trace.py)
prints tokens, latency and rupees *once, at the end*. That tells you a run cost
₹0.38 and nothing about which step spent it. Capture the token delta around each
model call and attribute it to the step.

While you are in there: the summary says `steps 4` on a run that went round the
loop three times. It is counting trace lines. Decide what that number should
mean, and make it mean that.

**Drill 3 · Grade the tools by blast radius.** Three tools in
[`tools.py`](https://github.com/greetsunshine/reference-agent/blob/main/src/tools.py):
`lookup_account`, `issue_credit`, `escalate`. Sort them into **read**,
**write**, and **irreversible**, and print the grade beside every call — so a
line that moves money never again looks like a line that read a row.

**Then stop.** You will want to fix `issue_credit`. Do not. Sitting with a
visible, unguarded, money-moving tool for a week is the point; week 2 opens by
building the guardrail properly — budget, allow/deny, human approval — rather
than patching it in the last ten minutes today.

### The bake-off

*~10 minutes of the block above — this is where we test "use a better model".*

This is the block your key is for — the deterministic brain ignores the model
flag, so mock mode cannot show you any of what follows. No key, or a key
misbehaving? Pair with whoever is next to you; one working key runs a bake-off
for two people perfectly well.

One config value decides which model is inside the loop. Everything else is
fixed: same tools, same system prompt, `temperature=0`, so what you are watching
is the model and not sampling luck.

```
make weird                                      # the default model
python -m src.main --ticket 9999 --model <a second model>
```

Put the two traces side by side. Some escalate. Some issue the credit to the
account that does not exist. Some wrap their JSON in a Markdown code fence,
which the adapter already forgives — and some emit JSON that does not parse at
all, which takes the whole run down. That last one is worth sitting with: **your
model's output is a parsing surface you own**, and nobody writes a test for it.

So "use a better model" is a real effect — and still the wrong answer. The
better model moves next quarter. The boundary you drew does not.

## 4 · The Teardown

*~35 minutes. In pairs, then the room.*

Everything so far fits on one screen. Now the version that does not.

Same business problem — disputed charges, investigate, decide, pay — at the
scale a bank or a telco actually runs it. **This is a constructed teaching case,
not a real company's incident:** the shape is drawn from how systems of this
kind are ordinarily built, and no client, product or number here describes a
real organisation.

> **The system.** ~40,000 disputes a month. The agent no longer holds a Python
> list; it calls a payments service that writes to the ledger of record. Credits
> above a threshold go to a human approval queue. Several business units share
> the deployment. There is an SLA — most disputes resolved within four hours —
> and an audit obligation: the firm must be able to explain any individual
> credit long after it was issued.

Five questions. Take two in pairs, bring the sharpest answer back to the room.

**1 · The retry that pays twice.** `issue_credit` times out mid-call. The agent
does what every well-behaved distributed system does and retries. Did the
customer receive ₹1,200 or ₹2,400 — and how would you know? Now design the fix,
and say which component owns it.

**2 · The blast radius of a good deploy.** Someone improves the policy text. It
ships on a Tuesday. By Thursday, 40,000 disputes have been processed under it.
Nothing errored. What would have had to exist on Monday for this to be
survivable?

**3 · The question eight months later.** A regulator asks why one specific
account was credited. What does the audit trail have to contain to answer that —
and is a stored prompt and completion enough?

**4 · Where the human goes.** Approving every credit does not scale. Approving
none is what we watched at the start. Draw the line, and defend it in terms of
money rather than confidence.

**5 · When the model is down.** The provider has an outage. Queue, fail closed,
or fall back to rules — and what do you tell the customer waiting inside a
four-hour SLA?

None of these are model problems. Every one is a boundary someone either drew or
did not.

### Closing the loop — the leader's framing

*Last ~10 minutes of the block.*

The trade-off running under all five questions is **autonomy against
reversibility**, and it is a business decision dressed as an engineering one.
More autonomy is more value and more blast radius; the lever you actually
control is how reversible each action is.

How to frame that upward: not *"the agent might hallucinate"*, which invites a
demand for a guarantee nobody can give, but **"here is what it can do without a
human, here is what it cannot, and here is what it costs us if it is wrong."**
That sentence survives a board meeting. The first one does not.

## 5 · The Horizon

*~10 minutes.*

Every session closes here: what is moving in the field right now, and what it
means for the person you are three years from today. Not a news round-up — the
question is always *what should I do differently because of this?*

**This week's question: what is durable when the models keep moving?**

You watched two models disagree about whether to give away money, on identical
inputs. Whatever you build on top of "this model behaves well" has the shelf
life of a release cycle. So the honest career question is which half of your
work survives the next capability jump — and the answer, consistently, is the
half you did today. Naming failure modes. Drawing boundaries. Deciding what a
system may do without a person. None of that got easier when the models got
better; it got more valuable, because there is more of it to do.

We look at where the demand actually is — what is being hired for in India right
now, at what level, and which skills employers say they cannot fill — against
what is quietly being absorbed into tooling.

## After

*~2 hours before next week.*

- Apply the named failure and the per-step cost to **your own** system, or to
  the piece of it you can reach
- Write a short **decision record**: one boundary you drew, the alternative you
  rejected, and what would have to be true for you to change your mind
- Post it for the room to read before next session

The decision record is the artefact of this cohort, not the code. It is also the
thing you will still be able to show someone in a year.

## Reading

None of it is required, and none of it is long.

- [Timeouts, retries and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/),
  AWS Builders' Library — old, unglamorous, and directly under teardown question 1.
- [Idempotent requests](https://stripe.com/docs/api/idempotent_requests), Stripe
  API docs — the shape of the answer to "did the customer get paid twice?"
- [Compressing system-side control context has a sharp, non-linear reliability
  cliff](/latest#control-context-compression-cliff) — trimming your tool and
  policy prompts is a runtime-reliability decision, with a safe-looking zone that
  ends abruptly. Directly relevant to *context is state*.
- [MCP went stateless](/latest#mcp-2026-07-28-stateless-spec) — an example of a
  tool interface changing under you, which is the argument for owning the
  boundary rather than inheriting it.

[Field notes](/latest) is refreshed weekly; if something lands there mid-cohort
that changes the picture, we will talk about it in the room rather than pretend
the syllabus is fixed.
