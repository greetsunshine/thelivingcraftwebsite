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
run cost ₹0.38 and nothing about which step spent it. On a six-step run with one
runaway tool call, the summary looks identical to a well-behaved run of the same
total.

Second defect in the same line: the summary says `steps 4` on a run that went
round the loop three times. `len(self.steps)` counts **trace lines**, not
iterations — so the number moves when you add a print statement.

### The solution

`LLM` already counts calls (`self.calls`) and cumulative tokens. Capture the
delta around each model call in `agent.py`:

```python
before = (llm.tokens_in, llm.tokens_out)
action = llm.next_action(state)
cost = (llm.tokens_in - before[0], llm.tokens_out - before[1])
```

Then pass it into the trace line for that step. The cleanest version records it
in `llm.py` instead — append `(tokens_in, tokens_out, seconds)` to a
`self.usage` list per call — so the loop does not have to know how the model
bills.

For `steps`: decide what the number should **mean**, then make it mean that. The
defensible answer is model calls, because that is the thing that costs money and
the thing a budget is set against — and `llm.calls` already holds it:

```python
f"steps {llm.calls} · ..."
```

One word, and the number stops moving when someone adds a print.

### Running it

This is the fiddly one. If the clock beats you it finishes cleanly in the After
block — the session copy already says so.

---

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

## What not to fix

`issue_credit` stays unguarded. Sitting with a visible, money-moving tool for a
week is the point, and week 2 opens by building the guardrail properly rather
than patching it in the last ten minutes.

**Unresolved:** `tools.py` currently ships the guardrail as a commented-out block
whose docstring says *"THE FIX is the commented block below: select it and toggle
comments off."* The repo invites the fix in the same breath the session forbids
it. Decide one way or the other before running this — an AI-assisted drill makes
it far more likely to fire.
