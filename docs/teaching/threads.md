# The five threads

*Not learner-facing. This is the contract between the six sessions.*

Five areas an architect or a leader has to be sound on for agentic systems. No
single week teaches all five. Each week builds one or two and touches the rest,
so the arc only works if every week honours what it owes the others. That is
what this file is for: when a session is being written, read the row for that
week before starting.

    1  Boundaries        what the system may do without a person
    2  Evidence          how you know it works, and who set the pass bar
    3  Trace and bill    observability, cost per run, the audit answer later
    4  Untrusted input   it reads text an attacker can write
    5  State             the same request arrives twice; memory outlives a process

**Not on the list, deliberately:** frameworks, model choice, prompt technique.
Those turn over every few months. The five above are twenty-year-old distributed
systems problems that agents made urgent for a wider group of people.

## Who builds what

`●` the week builds it · `◐` the week's second thread · `○` shown or named only

| | W1 | W2 | W3 | W4 | W5 | W6 |
|---|---|---|---|---|---|---|
| 1 Boundaries | ○ | ● | | | ◐ | ◐ |
| 2 Evidence | ○ | ○ | ● | ◐ | ◐ | ◐ |
| Retrieval | | | ● | | | ◐ |
| Multi-agent | ○ | | | | ● | ◐ |
| 3 Trace and bill | ● | ◐ | ◐ | | ◐ | ◐ |
| 4 Untrusted input | ○ | | ◐ | ● | | ◐ |
| 5 State | ○ | ● | | | ● | ◐ |

Every `◐` and `○` in that table is an obligation on a week that has not been
written yet. The four sections below are the ones that were missing entirely
when the arc was first drawn, and what each week now owes to close them.

---

## Bridge 1 · Evidence was taught once and never practised

Evaluation is the hardest of the five for senior engineers, because it is the
one where their existing habits actively mislead them. It had a single week,
almost nothing before it and nothing after. Cost, by comparison, appears in four
weeks. Fixed by seeding it a week early as an experience, then making three
later weeks use it.

- **Week 2 owes an experience, not a lecture.** Drill 3 is built as a **false
  pass**: you stop the double payment inside one running program, `make retry`
  shows one credit, and then the same ticket run from a second terminal pays
  twice again. The room feels *green and wrong* a week before it has the words
  for it. Do not use the word "evaluation" as a topic in week 2. Name the
  feeling, and say week 3 is where it gets a method.
- **Week 3 opens on it by name.** The first minutes of week 3 are that terminal,
  not a new example. "Last week your fix passed. Here is why the pass meant
  nothing, and here is what a test has to do instead."
- **Week 4 owes a regression case per attack.** Every injection the room finds
  becomes a case in the evaluation harness before the week ends. A security fix
  with no case behind it survives exactly one deploy — that is the sentence, and
  it is also why week 4 comes after week 3 rather than before it.
- **Week 5 owes the cost of evidence.** What an evaluation run costs when there
  are 40,000 disputes a month, and what you sample when running everything is
  not affordable. Sampling is a decision with a false-confidence failure mode.
- **Week 6 keeps evaluation strategy as one of the standing review headings.**

## Bridge 2 · Three weeks between seeing the attack and being allowed to answer it

Week 1 shows an attacker's note taking ₹2,50,000. Week 2 explicitly tells them
not to fix it. Week 4 is where they learn to. That gap is deliberate — a guard
on a tool is not a defence against injection, and the defence has a different
shape that needs the threat model first — but three weeks is long enough that
the most motivated people in the room will go and fix it anyway.

Do not try to stop them. Use it.

- **Week 2 owes one honest sentence** in the drill block, learner-facing: what
  the itch is, why patching the prompt is the wrong shape of answer, and that
  week 4 is where it gets the right one. Naming the date is what stops it
  festering.
- **Week 4 opens by asking who tried anyway.** The ones who did will almost all
  have added a line to the system prompt telling the model to ignore
  instructions in ticket text. That is the single most common wrong answer in
  the field, it is sitting in the room already, and it is a better opening than
  anything that could be constructed. Ask them to demonstrate it holding, and
  then break it live.

## Bridge 3 · Context engineering had no home

Week 1 names it — *context is state, and state has a lifetime* — and carries the
compression-cliff finding in its reading. Then nothing, for five weeks. For an
architect it is a top-five area; the only reason it is not in the five above is
that it does not belong to a leader in the same way.

It belongs to **week 3**, and the reason is exact: what the model is shown each
turn is an input you control, and you can only tune an input once you can
measure the effect of changing it. Week 3 is where the measurement gets built,
so week 3 is the first week where context work is engineering rather than
superstition.

- **Week 3 owes it a drill, not a slide.** Cut the tool descriptions and the
  policy text down, run the evaluation harness, and watch the score fall off a
  cliff rather than degrade smoothly. The lesson is the shape of the curve: there
  is a zone where trimming looks free, and it ends abruptly.
- **Week 5 owes the long-run version** — compaction across a run that will not
  fit, and what gets dropped when the decision is made for you.
- Background material is already written: `notes/context-as-state.md`.

## Bridge 4 · Accountability for AI-written code was only in week 6

"Govern an AI-native team — risk-tiered review and accountability for AI-written
code" is one of the five outcomes on the public page. It lived only in week 6.
That is too late for a thread that describes how every hour of the other five
weeks is actually spent.

It does **not** take a numbered outcome slot in weeks 2–5. Five outcomes per
week are already allocated to the week's own material, and a repeated sixth
would be noise by week 3. Instead:

**It is the last bullet of the drill checkpoint, every week, bolded, and it
escalates.**

    W1  direct a coding assistant against a decision you made first, and review
        what it wrote against that decision            [already written]
    W2  review AI-written code for WHERE it put the check, not whether the
        check passes
    W3  the assistant will write tests that go green. Review the cases it chose,
        not the colour of the result
    W4  the assistant will defend against the attack you named, and only that
        one. Review the attacks it did not think of
    W5  name the decision you would not delegate, and say why that one
    W6  the whole thread becomes the week's material: risk-tiered review as a
        policy for a team, not a habit for a person

Week 6 then lands as the formalisation of something they have done five times,
which is the only way that material is ever believed.

## Bridge 5 · RAG and multi-agent orchestration — decided 2026-09-08

The public module copy sells M2 as *"Multi-agent orchestration, RAG, and tool
boundaries"* ([`src/components/ProgramPage.astro`](../../src/components/ProgramPage.astro), M2). The week plan for
2–4 is guardrails, evaluation and security. Week 1 defers the multi-loop
question to week 5. So both are promised to applicants and neither has a
session.

**Recommendation, which needs no change to the public copy:**

- **RAG lands in week 3, as the thing that forces evaluation.** Give the
  reference agent a `search_policy` tool over a small document store. The moment
  the agent answers from retrieved text, "is it right?" stops being a yes/no and
  a harness stops being optional. Retrieval, context engineering and evaluation
  then form one coherent week instead of three topics competing for five hours —
  the retrieved text *is* the context being engineered.
- **Multi-agent orchestration lands in week 5**, which already owns "one loop is
  no longer enough" and is where week 1's drill 1 explicitly points.

**Decided on 2026-09-08: both land where the recommendation puts them, and the
public copy does not change.** Week 3 gains retrieval, week 5 gains the second
loop. Two consequences for whoever writes those weeks:

- **Week 3 now carries four things** — the false pass from week 2, evaluation,
  context engineering and retrieval. That is a lot for five hours, and the way
  it fits is that they are one argument rather than four topics. Retrieval makes
  the answer fuzzy, fuzzy answers need scoring, scoring is what lets you tune
  what the model is shown. If week 3 ends up teaching them as four separate
  things, cut retrieval rather than compressing all four.
- **The reference agent needs a `search_policy` tool** over a small document
  store before week 3 can be taught. Same staging problem as `w2-guarded`, and
  the same rule from the Makefile applies: its own target, its own module, and
  it does not change what any earlier week prints.

---

## Topic labels

Every outcome in every week carries a topic label, so a participant can see which
area of the practice it belongs to and so the six weeks do not invent five names
for the same thing. Draw from this list. Add to it only when a week genuinely
covers something none of these names cover, and add it here at the same time.

    Guardrails                    limits, allow and deny, what may run at all
    Human-in-the-loop approval    gates, queues, what happens when nobody answers
    Governance                    who owns a number, who may change it, decision
                                  records, risk-tiered review of AI-written code
    Evaluation framework          cases, scoring, pass bars, release gates
    Observability                 traces, decision logs, what a dashboard shows
    Cost control                  spend per run and per step, budgets, ceilings
    Auditability                  answering a question about one decision, later
    Reliability and idempotency   retries, paying once, memory that outlives a run
    Consistency at scale          many processes, shared state, ordering
    Security and prompt injection untrusted text, exfiltration, containment
    Context engineering           what the model is shown each turn, and compaction
    Retrieval                     documents in the loop, and grading the answer
    Multi-agent orchestration     more than one loop, and who is in charge
    Risk trade-offs               the cost of being wrong in each direction

Which week uses which is set by the coverage table above. Two rules:

- **The label names the area, not the drill.** "Guardrails", never "the ceiling
  in policy.yml".
- **Say when a topic is deliberately absent.** Week 2's outcomes end by stating
  that evaluation is not among them, and naming the week that has it. A
  participant who cannot find a topic assumes it is missing from the course
  rather than scheduled.
