# The seven threads

*Not learner-facing. This is the contract between the six sessions.*

Seven areas an architect or a leader has to be sound on for agentic systems. No
single week teaches all seven. Each week builds one or two and touches the rest,
so the arc only works if every week honours what it owes the others. That is
what this file is for: when a session is being written, read the row for that
week before starting.

    1  Boundaries        what the system may do without a person
    2  Evidence          how you know it works, and who set the pass bar
    3  Trace and bill    observability, cost per run, the audit answer later
    4  Untrusted input   it reads text an attacker can write
    5  State             the same request arrives twice; what the system
                          remembers between sessions, and who may correct it
    6  Retrieval         what gets fetched into the context, and on whose say-so
    7  Multi-agent       what happens when one loop is no longer enough

**Six and seven arrived later, and the file said five for a while after they
did.** Bridge 5 added them on 8 September, because the public module copy sells
both and no week owned either. They were in the matrix below from that day; the
title, this list and the count in three other places were not updated with them,
which is the kind of drift this file exists to stop happening to the sessions.

**Not on the list, deliberately:** frameworks, model choice, prompt technique.
Those turn over every few months. The first five are twenty-year-old distributed
systems problems that agents made urgent for a wider group of people.

## Who builds what

`●` the week builds it · `◐` the week's second thread · `○` shown or named only

| | W1 | W2 | W3 | W4 | W5 | W6 |
|---|---|---|---|---|---|---|
| 1 Boundaries | ○ | ● | | ◐ | ◐ | ◐ |
| 2 Evidence | ○ | ○ | ● | ◐ | ◐ | ◐ |
| 3 Trace and bill | ● | ◐ | ◐ | ◐ | ◐ | ● |
| 4 Untrusted input | ○ | | ◐ | ● | | ◐ |
| 5 State | ○ | ● | | | ● | ◐ |
| 6 Retrieval | | | ● | ○ | ● | ◐ |
| 7 Multi-agent | ○ | | | | ● | ◐ |

Every `◐` and `○` in that table is an obligation on a week that has not been
written yet. The seven bridges below are what each week owes to close a gap. The
first five were found by reading this file against itself. Bridge 6 was found by
reading the six weeks against the field and ignoring the plan. Bridge 7 is Sunil's
decision of 7 October 2026 to give five subjects a topic each, and it is the one
that set the topics for weeks 4 to 6.

Row order here is the order the matrix prints on screen, which is
`THREADS` in [src/lib/craft/threads.ts](../../src/lib/craft/threads.ts). The two
had drifted apart — retrieval and multi-agent sat third and fourth here and
sixth and seventh there — so the same seven rows came out in two different
orders depending on whether you were reading this file or the site.

---

## Bridge 1 · Evidence was taught once and never practised

Evaluation is the hardest thread for senior engineers, because it is the
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
architect it is a top-five area; the only reason it is not in the seven above is
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

## Bridge 6 · The arc read against the industry — decided 2026-09-29

The first five bridges each closed a gap found by reading this file against
itself. This one comes from reading the six weeks against what an architect or an
engineering leader is expected to be sound on across the field, with the plan
deliberately set aside first. Ten domains came out of that: system shape, tool and
interface design, context, memory and state, retrieval, evaluation, security,
cost and capacity, human control, and governance.

**The arc covers eight of the ten well.** Two were genuinely absent and three
were present only as fragments. Seven decisions follow. The first two move
material between weeks, and §7 was added later the same day when Sunil asked
where MCP should actually live.

### 1 · The business case moves from week 5 to week 6

The 28 September note put it in week 5 as one beat, on the argument that M3
already owns cost under load. That was right about the subject and wrong about
the room's attention: week 5 was already carrying multi-agent orchestration, the
CAP trade-off, capacity under load and the irreversible decisions, and a business
case beat was the fifth thing in a five-hour session.

**Week 6 is a review with no new material, and "would you fund this, and what is
the cost per acceptable outcome" is the right frame for reviewing somebody's
architecture.** It costs week 6 about twenty minutes and it frees week 5.

The line to land is unchanged and is the Run-Cost Model's own: cost per case is
the wrong number to argue about, and cost per acceptable outcome is the right one.

### 2 · Week 5 becomes multi-agent and memory

**Agent memory had no owner anywhere in the six weeks.** Thread 5 has always said
"memory outlives a process" and every week read that as idempotency. What a system
remembers about a person between sessions, how that memory is scoped, when it
expires and what happens when somebody corrects it, was taught nowhere. The
practice publishes an Agent Memory Audit Kit at /resources/agent-memory-audit-kit,
which is twelve audit questions and seven runnable failure tests on exactly that,
and no session referenced it. That is the same defect the 28 September review
found for model selection.

**Week 5 is now one argument rather than five topics: one loop is no longer
enough, and what the system remembers.** Decomposition and memory are the same
question asked twice, because the moment there are two loops the question of what
each one knows about the other stops being rhetorical.

CAP and capacity under load compress to a beat each. That is the cost, and it is
real: M3's public copy names both. Neither is removed and neither is a block.

**Thread 5's wording changed with this**, at the top of this file, so that the
next person to read the row sees memory named rather than implied.

### 3 · Retrieval quality gets a named home, and the home is week 5

Week 3 uses retrieval as the device that makes evaluation necessary, and that
works. It then leaves chunking, re-ranking, hybrid search and freshness
explicitly unfixed **and named no week**, which is the exact thing the teaching
standard says makes a participant assume a topic is missing rather than
scheduled.

It lands beside memory in week 5, and the join is not a convenience: what gets
retrieved and what gets remembered are both answers to "what is the system shown,
and on whose say-so". Week 5 gets `◐` on retrieval in the matrix.

**This is a beat and not a block.** Week 5 cannot teach retrieval properly either,
and saying which resource does is better than a silent deferral.

### 4 · Week 4 owes one beat on production monitoring

Week 3 builds the evidence you gather before a release. Nothing in the six weeks
covers what you watch afterwards, how drift shows up, or what a regression in the
wild looks like. The practice's own deployment checklist opens on the question the
course could not answer: **who would notice if this silently stopped working?**

Week 4 ends on attacks the room found in its own system, and "how would you know
this had happened in production" is the next sentence rather than a new subject.
Ten minutes at the close. Week 4 gains `◐` on trace and bill.

### 5 · The ownership question stays in week 2

**Partly superseded by §7 below, added the same day.** §5 said MCP did not need a
block. That was right about week 2 and wrong about the course: MCP now has a topic
in week 4, and what stays in week 2 is one question rather than the subject.

Week 2's topic 1 already puts nine control points on screen and asks which one
covers the most callers. One further question against the same table: **which of
these nine do you own, and which does a vendor change under you?**

That question belongs here because it is about placement, which is topic 1's
whole argument. It is not about MCP and must not become about MCP. The named
protocol is week 4's.

Week 2 is written, taught and published, so this is an obligation on its next
revision rather than a change made today. The topic 1 pair has to be rebuilt when
it lands.

**Landed 7 October 2026.** The question is at 00:42 in `week-2.mjs`, with its answer
key on the instructor card, and the topic 1 pair is rebuilt. The beat runs five
minutes instead of four, inside the six the clock already gave it.

### 6 · Regulatory depth stays out of the cohort — a decision, not an omission

CLAUDE.md treats regulated-industry depth as a core differentiator, and it names
DPDP, RBI, IRDAI, SEBI, NIST AI RMF, ISO 42001 and the EU AI Act. Those appear on
`/caio` and `/assessment` and almost nowhere in the six weeks.

**That stays true on purpose.** The cohort sells engineering judgement, the
consulting surfaces sell regulatory depth, and a compliance segment would dilute
both. Week 6's governance block is the one place it is touched, at the level of
who owns a decision rather than which framework names it.

If a room asks, the honest answer is that this is the assessment's subject and not
the cohort's. Do not improvise a framework tour.

### 7 · MCP gets a topic, and it is week 4 — added 2026-09-29

Sunil asked where MCP should actually be covered, having read §5. It needs more
than one question, and the reason it had not landed anywhere is that **MCP is not
one topic**. It has four faces and they do not belong in one week.

| Face | What it really is | Turnover |
|---|---|---|
| The protocol: transports, tools, resources, the spec | Mechanics | High. Changed in July 2026 |
| Tool boundary design: granularity, schemas, hints | Architecture | Low |
| The boundary you did not write, changing under you | Risk and ownership | Low |
| A server holding your credentials, returning text into your context | Security | Low |

The list at the top of this file already excludes frameworks and protocols
because they turn over every few months. **Face one is exactly that and stays out
of live minutes.** The other three are not, and they are what this audience is
actually asked about.

**The decision: week 4, one topic, about forty minutes, framed as "the boundary
you did not write".**

Five reasons, and the third is the one that decides it.

1. Week 4 owns untrusted input `●` and is the only week whose frame is already
   somebody else's text arriving inside your system.
2. An MCP server is the cleanest real instance of the shape that week teaches:
   code you did not write, running with your credentials, putting text into your
   context. That is indirect injection with a supply chain attached.
3. **Week 4 is the least loaded of the three unwritten weeks.** Prompt injection
   is one coherent topic for five hours. Giving week 4 two still leaves it lighter
   than week 5, which took memory and retrieval the same morning.
4. Week 3 hands week 4 the regression-case discipline, so an MCP finding becomes a
   case before the week ends. That link is already bridge 1's obligation.
5. The field note that matters most here is a security sentence:
   *"Statelessness moves MCP authorization to the application layer."* It moved to
   somebody in the room.

**The cost, stated rather than hidden.** Prompt injection gets roughly four blocks
instead of five.

**The risk in this placement, and the fix.** Teaching MCP inside the security week
can leave a room believing MCP is dangerous, which is vendor-deck-grade and the
anti-hype rule bites. **The topic is not "MCP security".** It is the boundary you
did not write, and one beat inside it is about adoption rather than risk: when is
inheriting somebody's tool surface the right call, and what do you need from them
before it is.

**Where the other three faces go.**

- **Protocol mechanics into week 0 pre-work and week 1's reading.** No live
  minutes. Week 1 already links the stateless note, framed as a tool interface
  changing under you.
- **The ownership question stays in week 2**, as §5 now says.
- **The Agent Failure Triage Quiz becomes week 4's pre-work.** It is Released,
  twelve questions on one incident, and it already carries three MCP takeaways:
  MCP adds hops, silence at the client says nothing about them, and
  `idempotentHint` declares rather than enforces and defaults to false. That is a
  published resource doing part of the topic for free, and pointing a session at
  it is the same fix the 28 September review applied elsewhere.
- **Week 5 gets it as a consequence, not a topic.** Two loops share a tool
  surface, and an MCP gateway is the shape that question takes.

**Rejected, and why.** A seventh week or a standalone MCP session, because this
file excludes protocols on turnover grounds and homework already runs to about
7h45 against a published ~5 hrs/week. Week 1, because the room has no threat model
yet and week 1 is taught. Week 5, because it absorbed two topics the same day.

**Before week 4 is written, refresh the MCP evidence.** The three field notes date
from the 2026-07-28 spec and `latest.json` was last refreshed on 15 August 2026.
A protocol that changed once in July can change again. `npm run gather` on the MCP
topic specifically is the check.

Week 4 gains `◐` on boundaries in the matrix, which was blank.

### What this bridge did not change

- **Week 3 stays as it is.** Evaluation read against the ten domains is the
  highest-leverage week of the six, and the angle it takes, rates rather than
  verdicts and a grader that is itself a component, is the half the field
  consistently skips.
- **No public copy changed.** M3 still names multi-agent, CAP, capacity and the
  irreversible decisions, and all four remain. M4 still names design, failure
  modes, evaluation strategy and governance. Memory and the business case are
  additive rather than a promise broken, so `cohort-copy.ts` is untouched.
  **Naming memory in M3 is worth considering and needs Sunil**, because it is a
  selling point currently given away for free.
- **The latency of guardrails has a home now: week 2, 30 September.** Each learner
  times their own check at 00:54, and 03:18 prices three tiers of checker, sets a
  latency budget per endpoint, and decides in-band against out-of-band. The rest
  is still absent and not decided: streaming, partial results, and what a person
  sees while a forty-second loop runs.

---

## Bridge 7 · Five subjects get a topic each — decided 2026-10-07

Sunil reviewed an outside specification for the whole course and then asked for
**A2A, MCP servers, RAG, memory optimisation and tokenomics** to be separate
topics. The review, the plan and his five decisions are in
[`reviews/course-review-2026-10-07.md`](reviews/course-review-2026-10-07.md).
This bridge is the part the weeks are written against.

### 1 · Where each one lands

| Subject | Week | Slot |
|---|---|---|
| RAG, part 1: retrieval as the reason evaluation is needed | 3 | Topic 2, already taught as written |
| MCP server: build one | 4 | Topic 3 |
| MCP server: use one you did not write, and contain it | 4 | Topic 4 |
| A2A: the handoff contract | 5 | Topic 2 |
| RAG, part 2: retrieval quality | 5 | Topic 3 |
| Memory optimisation | 5 | Topic 5 |
| Tokenomics | 6 | Topic 1 |

**What moved to make room.** Containment folds into week 4 topic 4, because the
proxy is where least privilege is enforced. The CAP trade-off folds into A2A,
because two agents reading one ledger at different moments is where it shows up.
Capacity under load moves into week 6's tokenomics topic. The week 6 review loses
about forty minutes and keeps four slots.

**Retrieval is now `●` in week 5**, which makes week 5 the only week that builds
three threads. That is the cost of the five topics, and it is why two of its builds
are homework (§3).

### 2 · This reverses part of bridge 6 §7

§7 said protocol mechanics get no live minutes, because they turn over every few
months. **MCP and A2A now have live topics.** The turnover risk has not gone away,
so the guard is in how they are taught, not whether:

- Teach the design choices live: tool size, schemas, annotations, where
  authorisation lives, what a handoff must carry. Those do not turn over.
- Put the mechanics in the pre-reading: transports, message shapes, the spec's
  structure.
- **Print the specification's version date on every page that names a protocol.**
- Run `npm run gather` on MCP and A2A in the week before each one is taught.

The framing rule from §7 still holds. Week 4's MCP topics are not "MCP security".
Topic 3 builds a server and topic 4 adopts one, and the adoption beat (when is
inheriting somebody's tools the right call) stays.

### 3 · Homework replaces live minutes, it never adds to them

The published commitment is about five hours a week, and the live session alone
is five hours. Each week already sets about two hours of after-work. **So a build
can move out of the room only if the after-work stays at two hours, ADR
included.**

A build may move home when nothing later in the session depends on it, it is one
person measuring and repeating, and it does not need the room's prediction and
reveal. Week 5 applies this:

| Build | Where |
|---|---|
| A2A handoff | Room, in pairs |
| RAG part 2, retrieval levers | Home, 50 minutes |
| Memory tests | Rules decided in the room; three tests at home, 30 minutes |
| Compaction | Room |

The week 5 ADR is one memory decision, 40 minutes. **Nothing in the room may
depend on homework being done**, and every homework build has a `-check` target
that prints pass or fail.

### 4 · Week 6 asks five fixed questions

Week 6's summary promised "the same five questions all cohort", and weeks 1 to 3
each asked a different five. The five are now fixed, and week 6 traces each to the
week that built its evidence:

1. Where is state kept between tool calls, and who can change it? *(W2, W5)*
2. What is the most one bad input can cost, in money and in time? *(W1, W4, W5)*
3. Which tool call can destroy value, and what stands before it? *(W1, W2)*
4. How would you know a model upgrade broke tool accuracy? *(W3, W5)*
5. Which text can an outsider write, and what can it make the agent do? *(W4)*

Question 5 is security rather than the outside specification's latency question,
because security is one of the course's two named outcomes. Latency lives in
question 2.

### 5 · Two smaller decisions

- **Step-level evaluation is built in week 5**, inside A2A: grading a handoff is
  grading one step. Week 3 names the level and points there.
- **Cost per acceptable outcome carries a loss term.** Spend alone counts a
  ₹2,50,000 credit to an attacker as a completed task. Week 6 uses the Run-Cost
  Model and adds the expected loss from wrong answers that passed, which week 3's
  agreement rate lets the room estimate. The denominator is outcomes that met the
  pass bar.

### What this bridge did not change

- Weeks 0, 1 and 2 keep their topics. Week 3 keeps its five.
- Regulatory depth stays out (bridge 6 §6).
- The outside specification's separate repository, Redis idempotency layer,
  five-run evaluation and case taxonomy were rejected. The reasons are in the
  review file.

## Topic labels

Every outcome in every week carries a topic label, so a participant can see which
area of the practice it belongs to and so the six weeks do not invent five names
for the same thing. Draw from this list. Add to it only when a week genuinely
covers something none of these names cover, and add it here at the same time.

    Guardrails · the limit        limits, allow and deny, what may run at all
    Guardrails · the human gate   approvals, queues, what happens when nobody answers
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
    Agent memory                  what is remembered between sessions, its scope,
                                  its expiry, and who may correct it
    The business case             cost per acceptable outcome, the break-even
                                  month, and when the answer is never
    Multi-agent orchestration     more than one loop, and who is in charge
    Tool and agent protocols      MCP and A2A: what a protocol fixes, and what it
                                  leaves to the people on either side of it
    Risk trade-offs               the cost of being wrong in each direction

Which week uses which is set by the coverage table above. Two rules:

**Guardrails is an umbrella, not one topic.** Six kinds, sorted by what each stands
between: input, the limit, the human gate, state, resource, output. Week 2 builds
three of them (the limit, the human gate and state), and the map is drawn at
00:37 in week 2's topic 1. When a week
teaches a guardrail, say which of the six it is, because the room's instinct is
to treat "guardrail" as one thing and then put a human in front of everything.

- **The label names the area, not the drill.** "Guardrails", never "the ceiling
  in policy.yml".
- **Say when a topic is deliberately absent.** Week 2's outcomes end by stating
  that evaluation is not among them, and naming the week that has it. A
  participant who cannot find a topic assumes it is missing from the course
  rather than scheduled.
