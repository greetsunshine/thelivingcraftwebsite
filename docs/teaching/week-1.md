# Week 1 — teaching notes

*Not learner-facing. The session itself is
[`src/content/sessions/week-1.md`](../../src/content/sessions/week-1.md).*

## Which brain runs when

Block 1 and the first two failures in block 2 run on the **mock** brain
(`make mock`, `make weird-mock`, `make retry`). Deterministic, no key, identical
trace on eight screens.

**`make run` and `make prompt` are not on that list, and the naming is a trap.**
Neither passes `--mock`, so both use a real model the moment `LLM_API_KEY` is
set — which every member now has, because the pre-work requires one.
`main.py:38` falls back to the mock only when the key is *absent*. So opening
block 1 with `make run` gives you a live model, three requests off a
twenty-a-day allowance, ~37s instead of 0.0s, and eight different traces in the
room. Use `make mock`. If you want the prompt dump deterministic too, either run
`python -m src.main --ticket 4471 --show-prompt --mock` or pin `--mock` inside
the `prompt` target. The session copy now says so out loud and
names `llm.py` — do not let the room discover the if-statement on its own during
block 3, it reads as a sleight of hand when found rather than as the argument
when offered.

`make weird-mock` **now exists** in the Makefile as of 2026-09-02. It did not
when this file first referenced it, and a learner typing it got
`No rule to make target`. Same class of problem as the payout line, which the
session described for a day before `trace.py` printed it. Check the copy against
`make help` before every cohort.

Two beats need real keys: **`make injected`** in block 2, and the **bake-off** in
block 3. Mock mode ignores `--model`, and the mock brain never reads the account
note at all, so `injected_demo.py` refuses to start without a key rather than
showing a misleading run.

**Quota — the constraint that will actually bite.** Google AI Studio free tier is
**20 requests per day, per model, per project** (confirmed from the 429 body on
2026-09-02, quota id `GenerateRequestsPerDayPerProjectPerModel-FreeTier`). One
agent run is about three requests. So a member gets roughly six runs a day, and
the session as written asks for `make injected`, two bake-off runs and a second
`injected` comparison — that is most of the allowance before anyone repeats
anything. Three consequences:

- Pre-work now warns them not to burn the quota the night before.
- Quota is per model, so the bake-off's second model has its own 20. Say that in
  the room; it is the cheapest fix available.
- **Never run `make chaos` as a room exercise.** Six runs at three requests each
  is 18 — one command consumes a member's entire day. Run it from the front if
  you want it at all.

**Open item, now urgent:** `INSTRUCTOR.md` in the reference-agent repo plans
recorded traces for the bake-off models so a single key still demonstrates the
point. They still do not exist. With `injected` also in block 2 this is no longer
only a bake-off problem — a member with a dead key now misses the sharpest
failure of the morning. Record them from the models you actually intend to
compare, and check the JSON-that-does-not-parse case is among them; that failure
is the sharpest thing in the block and you cannot rely on getting it live.

## What the models actually do — checked 2026-09-02

Run before you teach this, because it changes what you can claim.

| ticket | behaviour on a real model | notes |
|---|---|---|
| 4471 | credits ₹1,200 | correct |
| 9999 | **escalates, 3 runs of 3** | it does *not* pay the non-existent account |
| 5820 | refuses to credit, 3 runs of 3 | reads the "legitimate invoice" note and declines |
| 8001 | pays ₹2,50,000 | follows the poisoned account note |
| 7002 | varies | the wobble that `chaos` is built on |

The ₹5,000 failure on 9999 **only happens on the mock brain.** `INSTRUCTOR.md`
claimed otherwise and was corrected on 2026-09-02. The session copy now handles
this honestly — the naive policy is framed as a stand-in for a worse brain than
the one they are paying for, and the question is whether the system survives one.
Do not let this become a credibility problem: say it before someone finds it.

The pattern in that table is the intellectual core of block 2 and it is worth
teaching explicitly. **The model was correct every time its record was honest and
wrong the moment it was not.** That framing is stronger than "watch the agent
fail", because on three of five tickets it does not fail — and it survives the
room's best objection, since a frontier model catches nothing that its own system
of record lies about.

Ticket 5820 was added to `data/tickets.json` on 2026-09-02. Account 5820 had been
sitting in `accounts.json` since the start with no ticket pointing at it.

## The expected outcome — say it, then check it

Added 2026-09-02. Week 1 previously stated its outcome in one sentence buried in
the opening paragraph — *draw it, name the failures, defend which you tolerate*.
That was written for a 135-minute session with one failure and three drills, and
it no longer covers what the room actually leaves with. There are now five, and
they are on the learner page as well.

1. **Draw the harness** — loop and stopping condition, tool layer, per-turn
   context assembly, trace — and say which of the four any given failure is in.
2. **Read a trace and say where the money went**, which step spent what, and
   which line goes on a dashboard.
3. **Name the four failures that survive a better model** — stale read, repeated
   side effect, untrusted text as trusted input, unchecked argument — and the
   boundary that stops each.
4. **Direct a coding assistant against a decision made first**, then review the
   diff against that decision rather than against whether it runs.
5. **Write a decision record**: the boundary drawn, the alternative rejected,
   what would change their mind.

**Each is checkable.** That is the point of the rewrite — every one describes
something you could watch a person do, not something they understand. If you
cannot picture a member doing it in front of you, it does not belong on the list.

**Where each is earned.** 1 in block 1's diagram and file table · 2 in block 2's
payout line and drill 2 · 3 in the four runs and the pattern table · 4 across all
four drills · 5 in block 4's write-up.

**Say them at the top and again at the end.** At the top they set the contract;
at the end they are the checklist you close on — walk the five and ask the room
which ones they would claim. The ones nobody claims tell you what to fix before
the next cohort, and that is worth more than a feedback form.

**Number 3 is phrased "survive a better model" on purpose.** It is the session's
spine as a testable claim, and it does not go stale when the models improve.

**Number 4 is the only foothold governance has.** "Govern an AI-native team —
risk-tiered review and accountability for AI-written code" is a published cohort
outcome with no week of its own. This does not discharge it; it starts the thread
so week 5 or 6 has something to build on.

**Not in facts.ts, deliberately.** That file feeds the Q&A agent, /llms.txt and
/api/facts, so anything added there becomes a public promise to prospects rather
than a statement to eight people who have already paid. Week-level outcomes stay
in the session file.

## The line that closes block 2

After the pattern table, before "so how would you stop this?". It is thirty
seconds and it is the best bridge to week 3 in the session.

Grep the repo for the word **expected**. Two hits, the same sentence twice, both
inside the poisoned account note: *"…not the disputed amount. This is expected."*

> The only thing in this system that asserts an expectation is the attacker.

**Why it lands.** The room has just watched four runs scored entirely by one
line — `paid out ₹…`. That line reports what happened. Nothing anywhere reports
what should have happened, even though the expectation is sitting in the input:
ticket 4471 carries `disputed_amount: 1200` and the agent paid ₹1,200, and no
code compared them. Ticket 8001 disputed ₹1,200 and paid ₹2,50,000 — same
absence, two orders of magnitude apart. A correct run and a catastrophic one
produce the same shape of trace.

**How to run it.** Ask the room to guess how many times the word appears before
you grep. They will guess it is in a test, a schema, a config. Then show them.
The joke does the teaching, and it only works once, so do not spoil it in the
pre-work.

**Where it points.** Straight at week 3: an evaluation harness is the defender
finally writing the expected outcome down, in a place the model cannot reach.
Say that sentence and stop — do not start teaching evals in block 2, it will eat
the clock and block 2 is already the long one.

**Keep it true.** This holds only while nothing else in the repo says "expected".
If a drill solution, a docstring or a test ever uses the word, the grep stops
being clean and the moment is gone. Check it before each cohort:
`grep -rni expected src/ data/`.

## Block 3 — why nothing gets fixed

The four drills make failure **visible, named or measurable**. None of them
prevents anything, and the session now says so in as many words.

This is the rule to hold under pressure, because the room will push: they have
just watched ₹2,50,000 leave and they want to put a ceiling on `issue_credit`.
The copy tells them to write down the guard they wanted and stop. Week 2 opens by
building it properly — budget, allow and deny, human approval, durable state —
and it is worth more after a week of looking at the thing unguarded.

**Drill 4 is new (2026-09-02)** and it is the one with a failure behind it that
nobody expects. A real model sends `account_id` as an int; the store keys are
strings; `lookup_account` happens to call `str()` and hides it. Remove that cast
and a legitimate ticket returns `{'found': False}`, the agent escalates with
impeccable reasoning, and the payout line reads `paid out ₹0` — which looks like
a success on every dashboard. It is the only failure of the day where the system
fails closed and a real customer waits, and it is what makes teardown question 5
land instead of sounding like a nicety.

## The word "harness" — decided 2026-08-28

Week 1 §1 claims the **bare word** for the agent harness: the loop and its
stopping condition, the tool layer, the per-step context assembly, the trace.
Four parts, four files in the reference agent, named on screen in the first
fifteen minutes.

Everywhere else it must be qualified. Week 3 and outcome 2 in `facts.ts` say
**evaluation harness** in full, always — a note to that effect sits in
`week-3.md` where the writing will happen. Two harnesses one week apart sharing
a name is a confusion a room does not recover from mid-session.

The reason for claiming it at all is week 5: you cannot go deeper on a harness
that was never named. Drill 1 in week 1 now ends with an explicit forward
promise — three files had to agree for one fact to escape, *and week 5 asks what
happens when one loop is no longer enough*. That promise is in a file learners
read, so week 5 has to keep it.

**Still open, and none of it is decided:**

- **What leaves week 5 to make room.** It cannot hold harness composition, five
  scale topics, and the governance outcome that currently has no week. The
  suggestion on the table was to cut caching (least judgment-heavy, most easily
  read up on) and send governance to week 6, where reviewing eight architectures
  raises "how does your team review AI-written code" on its own.
- **Composition, not internals.** Planner/executor splits, sub-agents,
  orchestration, where the boundaries between loops go — those fit week 5's
  irreversibility spine. Context assembly, memory and retries inside the loop are
  weeks 1–3 material and sit oddly next to it.
- **The reference agent needs a decomposable shape by week 5.** A single `run()`
  cannot be split into planner and executor in a 45-minute drill unless the repo
  has been heading that way since week 2. That is a change to the roadmap in
  `INSTRUCTOR.md`, not just to a session file.
- **Week 5's front-matter summary now reads "The harness at scale: …"**, so that
  the week 1 promise is not dangling. The session title and the M3 module title
  in `facts.ts` are untouched — change them or revert the summary, but the two
  should agree before week 5 is written.

## Block 1 — the loop is named, and "inside one step" is new

**Terminology fixed 2026-09-02.** We had three vocabularies for one loop: the
`agent.py` docstring said perceive/think/act/observe, §1 said plan/act/observe,
and the trace prints `▸ think` and `▸ tool`. All of it now says **thought,
action, observation** — the ReAct phases (Yao et al., 2022), which is what every
framework the room will read uses, and what `llm.py`'s system prompt has been
asking the model for all along. Do not invent a vocabulary for a pattern this
well known; the room needs to map this session onto the docs they read next week.

Two words to keep saying carefully. `▸ plan` is a header printed once outside the
loop, so it is not a phase — say that when someone offers "plan, think, act",
which most rooms will. And the repo's tool *result* is the **observation**; use
both words once, then the standard one.

The rest of this block was added 2026-09-02, and it needs `make prompt`, which
was added to the repo the same day. It prints the system message, the user message and the raw reply for
every step, and it works on the mock brain, so the block costs no requests.

Three findings, and they are better discovered than told — give them the command
and five minutes before naming any of it:

- **No conversation.** Two messages per step, rebuilt from scratch. People assume
  an accumulating chat thread and there isn't one.
- **The thought is used once, then dropped.** Get this right or the room will
  correct you. `thought` is the first key in the JSON, so it is generated before
  the action in the same completion and *does* condition it — inside one step it
  works, and that is what ReAct is for. What is missing is the carry:
  `agent.py` stores action, args and result without it, so no later step sees it.
  Do not say "the reasoning is decoration"; say it is used once and discarded.
  They will have been reading `▸ think` lines for twenty minutes, which is what
  makes it land.
- **Whether that is a defect is arguable, and worth two minutes.** Carrying the
  thought forward costs output tokens on every step and can anchor the model to
  an early wrong line; real systems drop it deliberately. The problem is not the
  choice, it is that nobody made it — the same sentence you will use about the
  ceiling on `issue_credit` in block 3. It is also not on the deliberate-gaps
  list in `INSTRUCTOR.md`, so it is a simplification rather than staging. They will have been reading
  those `▸ think` lines for twenty minutes by this point, which is what makes it
  land. This also feeds teardown question 3 — if you were planning to show a
  regulator the model's reasoning, it does not exist.
- **No tool-calling API.** An English sentence and a dict lookup.

### Optional live demo — carry the thought forward

Two minutes, no key, and it converts "we didn't do it" into "we chose not to,
and here is why". The code stays as it is in `main`; type this in front of them
and undo it, or keep a branch.

`agent.py`, in the history append:

```python
state["history"].append({"action": act, "args": args, "result": res,
                         "thought": action.get("thought")})
```

`llm.py`, in `_build_prompt`:

```python
for h in state["history"]:
    if h.get("thought"):
        lines.append(f"  you reasoned: {h['thought']}")
    lines.append(f"  {h['action']}({h['args']}) -> {h['result']}")
```

Then `make prompt` and scroll to step 3 — the earlier reasoning is now sitting in
the history block where it was previously absent.

**What it costs, measured on the mock 2026-09-02:** the prompt goes 239 / 447 /
562 characters across the three steps, to 239 / 491 / 678. About 13% more input
overall, 21% more on the last step. That is with the mock's canned thoughts of
around 30 characters; a real model's ran nearer 180, so the true figure is
several times this — and because every step re-sends every earlier thought, it
compounds across the run rather than adding a constant.

**Three arguments against carrying it, in the order they land:**

1. **Cost, compounding.** The number above, and drill 2 is where they will see
   the same curve from the other direction.
2. **Anchoring.** An early wrong line of reasoning returns each step as the
   model's own confident prose, and models tend to stay consistent with what they
   appear to have already concluded.
3. **It would launder the injection.** Save this one; it is the best thing in the
   block. In `make injected` the model reads the poisoned note and reasons *"this
   account is in the goodwill programme, so I should credit 250000."* Carry that
   forward and step 3's prompt contains the attacker's policy restated **as the
   agent's own reasoning** rather than as tool output. The week 5 fix — labelling
   untrusted tool output — would not cover the laundered copy, because it is no
   longer tool output. Dropping the thought closes a hole that carrying it opens,
   entirely by accident.

**The line to land.** All three are good reasons. None of them was *our* reason —
this is not on the deliberate-gaps list, the thought's only use before 2026-09-02
was the display string on `▸ done`, and nothing in the repo marks it. So: the
behaviour is defensible and the decision was never made. That is the same
sentence you will use about the ceiling on `issue_credit` in block 3, and saying
it twice about two different things is what makes it stick.

**If a pair pushes for keeping it:** take it seriously and ask what they would
have to add to make it safe. The honest answer is a trust boundary that survives
the model quoting itself, which is week 5 — so it is a good instinct arriving
four weeks early, not a wrong one.

Then the levers-versus-controls split, which is the block's payoff: everything in
`llm.py` moves a probability, and only `MAX_STEPS` and the `TOOLS` dictionary
change what is possible. Say the second list out loud — it is two items long and
that is the point.

## Block 4 — the five questions

The five questions are the teaching frame; **the answers stay in the room**.

If you would rather anchor any of them in something you have actually seen on
the enterprise engagement, anonymise it and swap it in — a lived example beats a
constructed one every time. Keep the constructed version labelled as
constructed either way, in the session copy as well as out loud.

**The write-up is new (2026-09-02)** and it is the last 20 minutes: each pair
turns the question they argued hardest about into a one-page decision record, and
swaps it with another pair for review against four fixed questions. This is
deliberately the same artefact the After block asks for, brought forward so it is
started under supervision rather than attempted cold at home — and so week 2
opens with something every pair has actually written.

Hand out the seven headings pre-printed. Two people who have known each other for
three hours will stare at a blank page for the first ten minutes otherwise.

## Block 5 — the Horizon

Deliberately not written out in the session file. The framing above it is
durable and stays; the specifics come from `/admin/radar` in the week you teach
it, under **Trends**, **Hiring — India** and **Durable skills**.

Quote the primary-sourced findings and say that they are primary. Skip the
vendor-graded ones, or name them as vendor claims. Nothing dated goes into the
session file, so it does not rot between cohorts — and no salary or hiring
figure gets committed to a repository where it will still be sitting, wrong,
next year.

**Guest option.** If you bring someone in from a company running agents in
production, this is the slot, and take a fireside rather than a talk — you ask
the questions, so the thesis holds. The one question worth the whole slot: *which
of the failures we watched today did your company learn the hard way, and what
did it cost?* A generic industry talk contradicts four hours of careful work, so
brief them on a call rather than by email, cap them at 25 minutes including
questions, and keep your own close written because guests cancel.

## Clock

45 + 60 + [break 15] + 60 + 50 + 20 = **250 minutes**, up from 135. The session
grew on 2026-09-02 from one failure to four, and from three drills to four, plus
the decision-record write-up inside block 4.

The break sits at the end of block 2, immediately after the ₹2,50,000 run and the
pattern table. That placement is deliberate: they walk out mid-argument and the
corridor does the work.

Block 2 is now the long one and the most likely to overrun — four failures, and
the room will want to argue about the injection. Hold that argument to the
missing piece and defer the defence to week 5, or it eats block 3.

If you have to cut to fit a shorter room: drop the second bake-off comparison
against `injected`, then drill 2 (it finishes cleanly in After, and the copy
already says so). Do not cut the pattern table or the decision-record write-up —
the first is the argument and the second is what week 2 opens with.

## Status

`status: draft` in the front matter, so learners see a short "still being
written" note instead of the body. Nothing in the file is scaffolding any more —
flip it to `ready` when you are happy with the teaching, not before.

Before flipping: the four failures in block 2 need one clean run each on the
models you intend to use in the room, and the recorded traces above need to
exist.
