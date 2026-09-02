# Week 1 drills — problem, solution, and how to run them

*Instructor material. Not learner-facing.*

Every drill here is run **with a coding assistant**, deliberately. Forbidding one
would have week 1 contradict the programme's spine in its first hands-on block,
and these are staff engineers who will not hand-type a three-file change. The
risk is not that they use an assistant — it is that the assistant does the drill
for them and the realisation never lands.

So the shape of every drill is the same three moves:

1. **Decide before you prompt** — five minutes, on paper, no assistant. This is
   the judgement, and it has to precede the code.
2. **Let it build.** Give it the decision, not the task. Keep the prompt — it is
   the artefact that shows whether they specified or delegated, in a way the diff
   never will.
3. **Review the diff against your own spec.** Did it carry the change all the way
   out, or stop where the output looked right? What did it invent that you did
   not ask for? What did it decide silently that you should have decided?

**Scope the assistant explicitly to the files each drill names.** Pointed at the
whole repo it will read `tools.py`, find the commented-out guardrail whose
docstring says *"THE FIX is the commented block below"*, and helpfully enable it —
which is exactly what the drill tells them not to do.

---

## Drill 1 · Make the failure say its name

### The problem

`agent.py` runs `MAX_STEPS = 6`. When it runs out it calls
`trace.step("done", "reached step budget")`. Three separate signals then report
success:

- the **word** — `done`, the same kind a real resolution uses
- the **colour** — `_C["done"]` is green, identical to `plan`
- the **exit code** — `main()` discards what `run()` returns and never calls
  `sys.exit`, so the process exits 0

An agent that gave up is indistinguishable, downstream, from one that succeeded.

There is a second lie in the same function. An unknown action hits `break`, falls
out of the loop, and prints **"reached step budget"** on top of its warning —
telling you the budget ran out when it did not.

### The solution

**`trace.py`** — give the outcome a name and a colour:

```python
_C = {
    ...
    "gaveup": "\033[38;5;174m",   # soft red — a failure, not a resolution
}

def _fmt(kind, text):
    tag = {"plan": "▸ plan", "tool": "▸ tool", "warn": "▸ warn",
           "done": "▸ done", "escalate": "▸ esc ", "gaveup": "▸ stop",
           "meta": ""}.get(kind, "·")
```

**`agent.py`** — record the outcome, and stop reporting it as `done`:

```python
state = {"ticket": ticket, "history": [], "outcome": None}
...
        if act == "resolve":
            trace.step("done", action.get("thought") or "resolved")
            state["outcome"] = "resolved"
            return state

        if act == "escalate":
            res = TOOLS["escalate"](**args)
            trace.step("escalate", str(res))
            state["outcome"] = "escalated"
            return state

        fn = TOOLS.get(act)
        if not fn:
            trace.step("warn", f"unknown action: {act!r}")
            state["outcome"] = "bad_action"
            return state          # was: break

    trace.step("gaveup", "reached step budget without resolving")
    state["outcome"] = "step_budget"
    return state
```

**`main.py`**:

```python
import sys
...
    state = run(ticket, llm, trace)
    trace.summary(llm)
    sys.exit(0 if state["outcome"] in ("resolved", "escalated") else 1)
```

`escalated` exits 0 deliberately. Handing to a human is a correct outcome, not a
failure — and that is a business decision, not an engineering one.

### The gradient — do not say "three files"

The session copy asserts three files as the cost. That is what a *complete* fix
costs, not what the fix costs, and the difference is the lesson:

| Files | Change | Who can see the failure |
|---|---|---|
| 1 | in `agent.py`, use the existing `warn` kind instead of `done` | a human reading the terminal |
| 2 | add a real `gaveup` kind to `trace.py` and use it | a human, with its own name and colour |
| 3 | carry `outcome` out and exit non-zero in `main.py` | a **machine** — cron, CI, a supervisor, a monitor |

One line in one file makes it honest to a person. Three files make it honest to a
process, and the thing that pages you at 2am is a process. **Stopping after step
one is the failure this drill is about** — the terminal now looks right and every
automated consumer is still being lied to.

### The question that makes it an AI-native drill

In move 1, before any prompt: **what exit code does `escalate` get?**

It is genuinely ambiguous. An agent handing to a human is either correct
behaviour (exit 0) or a failure to complete (exit 1), and which one depends on
what the business means by resolved. An assistant will pick one silently and move
on. If the learner did not decide it first, a business rule has just been set by
autocomplete in a file nobody will read again.

That is the same argument as `issue_credit`, one layer up, and it is where
**risk-tiered review** enters — published outcome 5, and currently homeless in the
syllabus. Drill 1 is low blast radius: it changes reporting. The week 2 guardrail
is high. Same assistant, deliberately different review standard, and the learner
says why.

### What the assistant will get wrong

Watch for these in the review move; at least one shows up almost every time.

- **It stops at the terminal.** Renames the kind, adds the colour, never touches
  `main.py`. The most common outcome and the one the drill exists to catch.
- **It over-engineers.** An `Enum`, a custom exception class, a `logging` import.
  The fix is trivial; the plumbing is not. Ask which of those the failure needed.
- **It raises instead of returning.** An exception out of `run()` kills the
  process and skips `trace.summary()`, so you lose the cost line on exactly the
  runs you most want it. Same argument as `tools.py`'s refusal block.
- **It silently decides `escalate`.** See above. This is the one to spend time on.
- **It leaves `break` alone**, so the unknown-action path still reports a step
  budget that was never reached.

---

## Drill 2 · Put cost on every step

### The problem

`trace.py` prints tokens, latency and rupees once, at the end. That tells you a
run cost ₹0.38 and nothing about which step spent it. A six-step run with one
runaway call looks identical to a well-behaved run of the same total.

Second defect on the same line: `steps 4` on a run that went round the loop three
times. `len(self.steps)` counts **trace lines**, so the number moves when someone
adds a print statement.

### Decide before you prompt

Two questions, and the second is the one that matters.

**What is a step?** A loop iteration, a model call, or a trace line — it currently
counts the third. The defensible answer is model calls: the thing that costs
money, and the thing a budget is set against.

**Which cost belongs to which step?** The model call that *decided* an action and
the tool execution that *performed* it are different events with different owners.
Tokens are spent by the decision; money is spent by the execution. Attribute both
to "step 3" and you have merged two things that fail differently and are fixed by
different people. This is drill 2's version of drill 1's `escalate` question, and
an assistant will merge them silently.

### The solution

Record usage per call in `llm.py`, not in the loop — the loop should not know how
the model bills, and keeping it here means mock and real cannot drift apart.

```python
# __init__
self.usage = []   # one row per model call

def next_action(self, state):
    """Wrapper that measures one model call."""
    t0, bi, bo = time.time(), self.tokens_in, self.tokens_out
    action = self._next_action(state)
    self.usage.append({"call": self.calls,
                       "in": self.tokens_in - bi,
                       "out": self.tokens_out - bo,
                       "secs": time.time() - t0})
    return action

def _next_action(self, state):      # the existing body, unchanged
    ...
```

Then in `trace.py`'s `summary`, and note `steps` now means model calls —
`llm.calls` already holds it, so that half is one word:

```python
f"steps {llm.calls} · {dt:.1f}s · ~₹{cost:.2f}"))

for u in getattr(llm, "usage", []):
    c = (u["in"] / 1e6 * pin + u["out"] / 1e6 * pout) * USD_INR
    print(_fmt("meta", f"  call {u['call']}  {u['in']:>5} in / {u['out']:>4} out"
                       f"  {u['secs']:>5.1f}s  ~₹{c:.2f}"))
```

### What it reveals — this is the payload

Measured on `gemini-3.5-flash`, ticket 4471, a three-call run:

```
tokens 983 (in 702 / out 281) · steps 3 · 12.8s · ~₹0.65
  call 1    165 in /   73 out    3.6s  ~₹0.16
  call 2    243 in /   97 out    4.3s  ~₹0.22
  call 3    294 in /  111 out    4.8s  ~₹0.26
```

The run is not evenly priced. The last step costs **63% more than the first**, and
prompt tokens grow 165 → 294 — **1.78× over three calls**, before anything has
gone wrong.

The reason is `_build_prompt`: it replays the entire history every turn, so
**every step pays for every step before it.** On a six-step run with fat tool
results the curve is far steeper.

That makes drill 2 the moment "context is state" stops being an assertion and
becomes a number. Say it explicitly — the third idea in §2 and this drill are the
same fact seen from two directions, and this is the direction a CFO understands.

### The trap: mock mode teaches the opposite

The mock adds a flat 180 in / 40 out per call, so the profile is perfectly level:

```
  call 1    180 in /   40 out    ~₹0.13
  call 2    180 in /   40 out    ~₹0.13
  call 3    180 in /   40 out    ~₹0.13
```

A learner without a key does the drill correctly and concludes cost is evenly
distributed, which is the opposite of the truth. **Either require a key for this
drill, or fix the mock.**

The fix is one line in `llm.py` and it is tested — estimate from the prompt
actually built rather than a constant:

```python
self.tokens_in += (len(SYSTEM) + len(prompt)) // 4
```

which yields 153 → 205 → 234, tracking the real model's shape closely. **The cost:
it changes the numbers in the sample traces in week 0 and week 1** (`tokens 660`
→ `712`, `₹0.38` → `₹0.40`). Worth it, but it is a decision, not a tidy-up.

### What the assistant will get wrong

- **Puts the measurement in `agent.py`.** Works, and now the loop knows how the
  model bills. Mock and real drift the first time one of them changes.
- **Wraps wall-clock around the whole loop iteration**, so tool latency is
  attributed to the model. Ask which number they would take to a provider.
- **Fixes the visible half only** — prints the per-step breakdown and leaves
  `steps {len(self.steps)}`, so the line still contains a number that lies.
- **Adds a tokenizer dependency** to count tokens the API already returned in
  `r.usage`. Ask what happens to that count when the provider changes.

### Running it

This is the fiddly one. Drills 1 and 3 go in the room; if the clock beats you,
this finishes cleanly in the After block — the session copy already says so.

## Drill 3 · Grade the tools by blast radius

### The problem

`lookup_account`, `issue_credit` and `escalate` are three entries in one dict.
Nothing in the code or the trace distinguishes a call that read a row from one
that moved money.

### The solution

A grade beside the tool, in `tools.py`:

```python
GRADES = {
    "lookup_account": "read",
    "issue_credit": "irreversible",
    "escalate": "write",
}
```

and in the trace line for each call, so a line that moves money never again looks
like a line that read a row.

### The argument worth having

`escalate` is where the room will disagree, and it should. It creates work for a
human and it is not undoable in the ordinary sense — but nothing is lost if it
fires wrongly, only attention. Most rooms land on **write**. The useful move is
to ask what would have to be true for it to be **irreversible**: if escalation
notified the customer, it would be.

That is the grading system doing its job — the grade is a property of
consequence, not of the verb.

---

## Drill 4 · Check the arguments before you dispatch

*Added 2026-09-02. In the room; it is small.*

### The problem

`agent.py` looks the action up in a dict and calls `fn(**args)` with whatever the
model produced. Nothing declares what a tool accepts and nothing checks. Two
costs, one loud and one silent, and the silent one is why this drill exists.

**Loud:** a stray key raises `TypeError` out of the loop and takes the run down —
and, as drill 1 establishes, an exception out of `run()` also skips
`trace.summary()`, so you lose the cost line on exactly the run you most want it.

**Silent:** the account id arrives as a string from the naive brain and as an
**int** from a real model, on the same ticket. Nothing reports it, because
`lookup_account` calls `str()` on the way in. Remove that coercion and a
legitimate ticket returns `{'found': False}`:

```
▸ tool  lookup_account(account_id=4471) -> {'found': False, 'account_id': 4471}
▸ think No account found, so I cannot verify the charge. Handing to a human.
▸ esc   {'escalated': True, 'reason': 'account 4471 not found'}
paid out ₹0 · no credit issued
```

The reasoning is impeccable, the trace is clean, nothing errors, and the payout
line reads ₹0 — which after an hour of watching money leave wrongly looks like a
success. **This is the only failure in the session where the system fails closed
and a real customer waits.** Ask what dashboard would have caught it. Nothing in
this repo would, and probably nothing in theirs.

### Decide before you prompt

> What does the tool do when the arguments are wrong — refuse, coerce, or raise?

This is drill 4's version of drill 1's `escalate` question, and an assistant will
answer it silently.

- **Coerce** is what the repo does today, and it is precisely why the failure is
  invisible.
- **Raise** loses the summary and turns a recoverable bad argument into a dead run.
- **Refuse and return** puts the refusal into history, so it reaches the next
  step's prompt and the agent can escalate on its own — the same argument
  `tools.py` makes for its guard returning rather than raising.

Second decision worth forcing: is `4471` as an int a **violation** or a
**coercion**? Both are defensible. The undefendable answer is the current one,
where it is neither because nobody decided.

### The solution

Declare the contract next to the tools, in `tools.py`. No dependency — the repo
has one on purpose.

```python
CONTRACTS = {
    "lookup_account": {"account_id": str},
    "issue_credit":   {"account_id": str, "amount": (int, float)},
    "escalate":       {"reason": str},
}


def check(action, args):
    """Return None if the call is well-formed, else a reason it is not."""
    spec = CONTRACTS.get(action)
    if spec is None:
        return f"unknown tool: {action!r}"
    extra = set(args) - set(spec)
    if extra:
        return f"unexpected arguments: {sorted(extra)}"
    missing = set(spec) - set(args)
    if missing:
        return f"missing arguments: {sorted(missing)}"
    for k, t in spec.items():
        if not isinstance(args[k], t):
            return f"{k} should be {getattr(t, '__name__', t)}, got {type(args[k]).__name__}"
    return None
```

Then in `agent.py`, before the call — refusing into history rather than raising:

```python
bad = check(act, args)
if bad:
    trace.step("warn", f"refused {act}: {bad}")
    state["history"].append({"action": act, "args": args,
                             "result": {"refused": True, "reason": bad}})
    continue
```

Run `make run` with a real key afterwards and the int is named instead of
vanishing into a `str()` call.

### The word to use

Say **tool schema** at least once. That is what Anthropic and OpenAI both call
the declaration in their function-calling APIs, and it is what they will meet the
moment they leave this repo. *Contract* is the better word for the idea; *schema*
is the word that will be on the page in front of them next week.

### What the assistant will get wrong

- **Reaches for a schema library.** Pydantic, jsonschema, dataclasses. Ask what
  the failure actually needed.
- **Coerces instead of refusing** — `str(args["account_id"])` — reproducing the
  exact bug the drill exists to expose, one layer up. The most common outcome.
- **Raises.** Loses the cost line, and turns a bad argument into an outage.
- **Derives the contract from the function signature** with `inspect`. Clever,
  and it means the contract can never disagree with the code — which sounds like
  a feature until you ask what the contract is *for*. It is where you write down
  what you will accept from an untrusted producer; deriving it from the consumer
  defeats the point.
- **Validates but never plumbs the refusal into history**, so the model never
  learns its call was rejected and repeats it until the step budget runs out.
  Drill 1's lesson, rediscovered.

---

## What not to fix

`issue_credit` stays unguarded. Sitting with a visible, money-moving tool for a
week is the point, and week 2 opens by building the guardrail properly rather
than patching it in the last ten minutes.

**Unresolved:** `tools.py` currently ships the guardrail as a commented-out block
whose docstring says *"THE FIX is the commented block below: select it and toggle
comments off."* The repo invites the fix in the same breath the session forbids
it. Decide one way or the other before running this — an AI-assisted drill makes
it far more likely to fire.
