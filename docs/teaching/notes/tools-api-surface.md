# Tools are your real API surface

*Teaching notes for week 1 §2, first of the three ideas. Not learner-facing —
the session copy is four sentences on purpose. This is what stands behind them.*

## The reframe

The instinct in the room is that a tool is **a function you exposed**, and that
the way you control it is by telling the model when to use it. Both halves are
wrong, and the second half is wrong in exactly the way the ₹2,50,000 was wrong.

A tool is not a function you exposed. It is a **capability you granted**, and
the prompt is not where you grant or revoke it.

Everything in `TOOLS` is callable. That dictionary is the permission list, and
it is the only permission list — there is no second gate anywhere. `agent.py:38`
does `fn = TOOLS.get(act)` and `agent.py:43` does `res = fn(**args)`, a bare
call with no try/except and nothing between the model naming a thing and the
thing happening.

## Where the money actually went

Keep the four amounts on the board for this. **Three of the four left through
the same function:**

| run | amount | left through |
|---|---|---|
| `make weird-mock` · 9999 | ₹5,000 | `issue_credit` |
| `make retry` · 4471 ×3 | ₹3,600 | `issue_credit` |
| `make injected` · 8001 | ₹2,50,000 | `issue_credit` |
| the quiet one · 4471 | ₹0 | nothing — it never got there |

Then open `tools.py` and read `issue_credit` out loud. Its docstring is long and
its **executable body is two statements**: append to `LEDGER`, return
`{"credited": True, ...}`. It accepts any `account_id` and any `amount` and
returns success unconditionally. The guardrail exists in the file as a commented
block, which is the honest version of what most teams ship — the checks were
thought of, and they are not running.

Do not toggle the block on in the room. Week 2 builds it, and it is much better
built by people who have spent a week looking at the gap.

## The three tools, and what they can reach

The point of grading is that **blast radius has nothing to do with the name.**

| tool | looks like | actually |
|---|---|---|
| `lookup_account` | a read | a read. Its danger is what it *returns* — see the injection |
| `escalate` | a write, a handoff | **nothing.** It returns `{"escalated": True, "reason": ...}` and no queue, ticket or person is touched anywhere |
| `issue_credit` | a write | irreversible, unbounded, and it moves real money |

`escalate` is worth a minute on its own. It is the only tool that refuses, it is
the one nobody has ever watched fire — every pre-work run ended by paying — and
it does not actually do anything. A room that has just decided "escalate to a
human" is the answer should find out that in this codebase, escalating to a
human means returning a dictionary.

It also has **two entry points**: it is in `TOOLS`, and `agent.py:34` special-
cases it before the generic dispatch. Worth noticing, because a capability with
two ways in has two places a check has to go, and people reliably add it to one.

## The asymmetry that makes this an architecture problem

Adding a tool is one line in a dictionary. Removing the capability after a bad
night is a deploy, a migration, and a conversation with whoever depends on it.

So the review question at design time is not *"will the model use this
correctly?"* — you cannot know, and the answer changes with every model release.
It is **"what is the worst single call this grants?"** That question has an
answer today, it stays true when the model changes, and it is answerable by
someone who has never read the prompt.

## Common wrong answers

- **"We'll tell it in the prompt not to credit more than X."** This is a prompt
  instruction guarding an irreversible action, which is precisely the shape that
  lost ₹2,50,000. You could never separate *it reasoned correctly* from *it got
  lucky*.
- **"We'll validate inside the tool."** Right, and it is drill 3 — but be exact
  about what it buys. Validation says *these arguments are the wrong shape*.
  Authorisation says *you may not do this even correctly formed*. `issue_credit`
  needs both and has neither.
- **"Use a smaller model, so it can do less."** Capability is the dictionary,
  not the model. A smaller model has exactly the same authority and is worse at
  deciding when to use it.
- **"Take `issue_credit` out and have a human do it."** Take it seriously — it
  is the only proposal that actually removes the capability. Then ask what
  happens to the four-hour SLA at 40,000 disputes a month. That trade is
  teardown question 4, and it is a business decision, not an engineering one.

## Where it goes

Drill 2 is this idea made mechanical: sort the three into read, write and
irreversible, and print the grade beside every call. It does not stop anything —
it makes a line that moves money stop looking like a line that read a row.

Week 2 is where the grading becomes enforcement: budgets, allow and deny,
approval on irreversible actions.

## The question to leave them with

**How many tools does your own agent have, and which of them are irreversible?**

Most people can answer the first half immediately and stall on the second, which
is the useful outcome. If somebody says "none of them are irreversible", ask
whether any of them send an email.
