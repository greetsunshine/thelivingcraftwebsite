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

## Drill 2 · Grade the tools by consequence

### The problem

Here are two lines from a run that worked:

```
▸ tool  lookup_account(account_id='4471') -> {'found': True, ...}
▸ tool  issue_credit(account_id='4471', amount=1200) -> {'credited': True, ...}
```

One of them read a row out of a file. The other one moved ₹1,200 that you cannot
get back. **They are the same colour, the same shape and the same one line.**
There is nothing for your eye to catch on.

That is survivable with two calls on a screen in front of you. It stops being
survivable at a hundred runs a night in a log file, when the question somebody
asks you on Tuesday morning is *"did anything irreversible happen while we were
asleep?"* — and answering it means reading every line and knowing, from memory,
which function names spend money.

So the problem is not that the agent did something wrong. It is that **the
system cannot tell you what kind of thing it did.**

### What "consequence" means here

Three levels, and the test for each is one question:

| grade | the test | in this repo |
|---|---|---|
| **read** | run it twice — is anything different? No. | `lookup_account` |
| **write** | something changed, and you could change it back | `escalate` |
| **irreversible** | something changed and you cannot change it back | `issue_credit` |

This is about **whether you can walk it back**, not how far the damage spreads.
Spread is blast radius, and that is a week 4 question. If you can undo it, it is
a bad afternoon. If you cannot, it is a different conversation.

### The solution

Write down what each tool does to the world, in one place, in `tools.py`:

```python
GRADES = {
    "lookup_account": "read",
    "issue_credit": "irreversible",
    "escalate": "write",
}
```

Then put the grade into the trace line, so it is visible without anyone having
to recognise the function name:

```
▸ tool  read          lookup_account(account_id='4471') -> {'found': True, ...}
▸ tool  IRREVERSIBLE  issue_credit(account_id='4471', amount=1200) -> {'credited': True, ...}
```

The exact shape is theirs to choose — a column, a prefix, a colour. What matters
is that **the irreversible line is the one the eye lands on first.**

### Say plainly what this does not do

Nothing here prevents anything. `issue_credit` still pays whatever it is told,
and all three of the money failures still happen exactly as before. All they
have built is a label.

Say that out loud, and then say why the label matters: **"ask a human before
irreversible actions" is a rule you cannot write until something in the code
knows which actions are irreversible.** Week 2 is that rule. This drill is the
sentence it needs.

### The argument worth having

Grade `escalate` and the room will split. Let it.

- **Write** — it creates work for a person. Something in the world changed.
- **Read** — open the function. It returns `{"escalated": True, "reason": ...}`
  and touches nothing. No queue, no ticket, no person. Nothing changed at all.
- **Irreversible** — you cannot un-escalate.

Most rooms land on write. The move that makes the idea land is to ask: **what
would have to change for it to become irreversible?** If escalating also sent
the customer an email saying we are looking into it, it would be — you cannot
recall the email. Same function, same name, different grade.

That is the whole point. **The grade is not a property of the function. It is a
property of what the function reaches.** Which is why it has to be written down
deliberately, by a person, rather than guessed from the verb in its name.

### If a pair finishes early

Print a running count at the end of each run — *"this run made 1 irreversible
call"* — and then say what number they would alert on. Most people say "more
than one", which is wrong for a ticket that legitimately needs two credits.
Arriving at that is the exercise.

---

## Drill 3 · Check the arguments before you dispatch

*Added 2026-09-02. In the room; it is small.*

### The problem

**The loop does the model's homework without checking it.**

At every step the model returns two things: the name of a tool, and the
arguments to call it with. `agent.py` takes the name, looks it up, and calls the
function with whatever arguments came back:

```python
fn = TOOLS.get(act)      # agent.py:38
res = fn(**args)         # agent.py:43
```

`fn(**args)` means *take the dictionary the model produced and use its keys as
the parameter names of this function*. So the model is filling in a function
call by hand, and **nothing between the model and the function looks at what it
wrote.** No declaration of what the tool accepts exists anywhere, so there is
nothing to check against even if you wanted to.

Two things go wrong. One is loud, one is silent, and the silent one is why this
drill exists.

**Loud — the run dies.** The model writes `account` where the function expects
`account_id`. Python raises `TypeError: unexpected keyword argument`, the
exception comes out of `run()`, and the whole run stops. It gets worse: because
the run never reaches its end, `trace.summary()` never prints — so you lose the
tokens, the time and the cost line on precisely the run you most wanted them for.

**Silent — the ₹0.** The account id is a **string** when the mock brain produces
it (`'4471'`) and a **number** when a real model produces it (`4471`). Same
ticket, same code, different type. Nothing reports this today, because
`lookup_account` happens to call `str()` on the way in and quietly repairs it.

Take that one `str()` away and run a completely honest ticket:

```
▸ tool  lookup_account(account_id=4471) -> {'found': False, 'account_id': 4471}
▸ think No account found, so I cannot verify the charge. Handing to a human.
▸ esc   {'escalated': True, 'reason': 'account 4471 not found'}
paid out ₹0 · no credit issued
```

Nothing errored. Nothing was logged. The reasoning is correct given what it was
told. And a customer who was genuinely owed ₹1,200 got nothing.

**That one `str()` was doing real work and nobody knew it was there.** This is
the only failure in the session where the system fails closed and a real
customer waits. Ask what dashboard would have caught it. Nothing in this repo
would, and probably nothing in theirs.

### Decide before you prompt

> **When the arguments are wrong, what should happen?**

Pick one before you let an assistant near this, because it will pick one for you
and never mention it.

- **Coerce** — quietly fix it up. `str(account_id)`. This is what the code does
  today, and it is exactly why the ₹0 was invisible. A repair nobody can see is
  indistinguishable from nothing being wrong.
- **Raise** — throw an exception. Honest, but it kills the run and takes the
  cost line with it. A recoverable bad argument becomes an outage.
- **Refuse and return** — do not call the tool; return a refusal instead. The
  refusal lands in `history`, reaches the next step's prompt, and the model can
  see it was rejected and either correct itself or escalate. This is the same
  argument `tools.py` makes for its own guard returning rather than raising.

A second decision worth forcing: is `4471` as a number a **violation** to refuse,
or a **shape to accept and convert**? Both are defensible. The undefendable
answer is today's, where it is neither, because nobody decided.

### The solution

Write down what each tool accepts, next to the tools, in `tools.py`. No library
— the repo has no dependencies on purpose, and this needs about twenty lines.

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

Then check before you dispatch, in `agent.py`, refusing into history rather than
raising:

```python
bad = check(act, args)
if bad:
    trace.step("warn", f"refused {act}: {bad}")
    state["history"].append({"action": act, "args": args,
                             "result": {"refused": True, "reason": bad}})
    continue
```

Run `make run` with a real key afterwards and the number is **named** in the
trace instead of vanishing into a `str()` call.

### Say plainly what this does not do

It does not stop the agent paying the wrong person, and it would not have
prevented any of the three runs where money left. What it does is make a
wrong-shaped call **say so, out loud, in the trace** — instead of being repaired
behind your back, or killing the run.

That is week 1 in one drill: **you cannot fix what the system will not tell you
about.**

### The word to use

Say **tool schema** at least once. That is what Anthropic and OpenAI both call
this declaration in their function-calling APIs, and it is what they will meet
the moment they leave this repo. *Contract* is the better word for the idea;
*schema* is the word that will be on the page in front of them next week.

### What the assistant will get wrong

- **Reaches for a schema library.** Pydantic, jsonschema, dataclasses. Ask what
  the failure actually needed.
- **Coerces instead of refusing** — `str(args["account_id"])` — reproducing the
  exact bug the drill exists to expose, one layer up. The most common outcome by
  a distance.
- **Raises.** Loses the cost line, and turns a bad argument into an outage.
- **Derives the contract from the function signature** with `inspect`. Clever,
  and it means the contract can never disagree with the code — which sounds like
  a feature until you ask what the contract is *for*. It is where you write down
  what you will accept from an untrusted producer; deriving it from the consumer
  defeats the point.
- **Validates but never plumbs the refusal into history**, so the model never
  learns its call was rejected and repeats it until the step budget runs out.
  Drill 1's lesson, rediscovered the hard way.

### If a pair finishes early

Ask what their checker should do if the model returns `args` as a JSON *string*
rather than an object — `"{\"account_id\": \"4471\"}"` instead of a real
dictionary. A violation to refuse, or a shape to accept and parse? Both are
defensible; letting it through because it happens to work today is not.

---

## Drill 4 · Put cost on every step

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
different people. This is drill 4's version of drill 1's `escalate` question, and
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

That makes drill 4 the moment "context is state" stops being an assertion and
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

This is the fiddly one, and it is homework rather than a room exercise. Drills 1,
2 and 3 are done together; this one goes into the After block, where it gives
that block something concrete to do.

## What not to fix

`issue_credit` stays unguarded. Sitting with a visible, money-moving tool for a
week is the point, and week 2 opens by building the guardrail properly rather
than patching it in the last ten minutes.

**Unresolved:** `tools.py` currently ships the guardrail as a commented-out block
whose docstring says *"THE FIX is the commented block below: select it and toggle
comments off."* The repo invites the fix in the same breath the session forbids
it. Decide one way or the other before running this — an AI-assisted drill makes
it far more likely to fire.
