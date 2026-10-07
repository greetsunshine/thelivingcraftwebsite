# Whole-course review against the "Master Execution Specification" — 7 October 2026

*For Sunil. Not learner-facing.*

You asked for three things. Evaluate the specification against the course's goals. Finalise
the six weeks. List what has to change in the three weeks already written. This file answers
all three. The decisions it needs from you are at the end.

**Nothing was built or edited.** The specification ends with an instruction to scaffold a new
repository and write Python harnesses for seven weeks. That is a large change to how the
course is made, so it is a recommendation here and not an action.

---

## The verdict

- **The topics in the specification are right.** For weeks 0 to 3 they are almost exactly
  what is already built, down to the ₹5,000, ₹2,50,000 and ₹0 cases and the 40,000 disputes
  a month. That is good evidence the course is aimed correctly.
- **The delivery model in the specification is wrong for this course.** It would create a
  second copy of the course, change the stack mid-cohort, and drop most of the teaching
  standard.
- **Three of its proposals would teach something false or weaker** than what is on the pages
  now: the Redis idempotency layer, the five-run evaluation, and a cost formula with no line
  for a wrong answer that passed.
- **Weeks 4 to 6 gain real shape from it.** Today those three files are placeholders. The
  specification's builds for week 4, its compactor and handoff check for week 5, and its five
  review questions for week 6 are the best parts of it, with the changes below.
- **Week 3 has one defect that must be fixed before it is released**, and it is not in the
  specification. Its session file body is a stale second copy of the day.

---

## The test this review applies

The course's goals, taken from `CLAUDE.md` and `docs/teaching/threads.md`, not from the
specification:

| Goal | Where it is written |
|---|---|
| Engineering judgement over tools. "AI builds, the human judges and directs" | Positioning spine |
| Two named outcomes: evaluation and reliability, and security for agentic systems | Positioning spine |
| Seven threads, each built by one week and owed by others | `threads.md` |
| One anchor system: the dispute agent, its tokens, its failures | Teaching standard |
| Prediction before reveal, failures posed as puzzles, a checkpoint per block | Teaching standard |
| Six parts per topic, ending in named products at enterprise scale and a mixed quiz | Teaching standard |
| About 5 hours a week, including the live session | Public offer |
| Protocols and frameworks get no live minutes, because they turn over | `threads.md`, bridge 6 §7 |
| Regulatory depth stays on `/caio` and `/assessment` | `threads.md`, bridge 6 §6 |
| Plain English for a room where English is a second language | Communication style |

---

## Where the specification and the course already agree

| Specification item | Already in the course |
|---|---|
| W0: "the question the course does not ask again" | `week-0.md` §2, same title |
| W0: thirteen capabilities intake | `src/lib/craft/intake.ts`, re-asked in week 6 |
| W1: four engine parts | Week 1 "The four parts": loop, tools, context, trace |
| W1: Puzzles A, B, C | Week 1 block 2: ₹5,000 ghost account, ₹2,50,000 attacker rule, ₹0 refusal |
| W1: drills 1 to 5 | Drills 1 to 4 plus "Comparing two models" |
| W2: six guardrail types on three planes | Week 2, 00:37 "The map, six kinds" |
| W2: policy as data, not prompt text | `policy.yml`, topic 1 |
| W2: approval timeout | Topic 2, the timer fires during the break |
| W2: two workers pay twice | Topic 3, the fix fails from a second terminal |
| W2: latency budget at 40,000 a month, in-band against out-of-band | 03:18, the tiered gateway |
| W3: four case classes | Topic 1, a different four (see below) |
| W3: rates over repeated runs | `make w3-wobble`, twenty runs |
| W3: Cohen's kappa | `make w3-agree`, raw 70%, kappa 0.35 |
| W3: retrieval failure against reasoning failure | `grade_retrieval` against `grade_outcome` |
| W3: the context cliff | `make w3-trim`, topic 5 |
| W6: cost per acceptable outcome | Run-Cost Model, already assigned to week 6 |

---

## Seven places the specification would make the course worse

### 1 · It builds a second copy of the course

The specification asks for a new repository with `lecture-notes.md`, `drill-specs.md` and
`teardown-rubric.md` in each week's folder. The course already has one home for each of
those:

| Specification file | What already holds it |
|---|---|
| `lecture-notes.md` | `src/content/sessions/week-N.md` plus the generated learner page |
| `drill-specs.md` | The lab sections of the learner page, and the `make` targets |
| `teardown-rubric.md` | The instructor page's answer keys (the notes contract) |
| `src/*.py` | `reference-agent/src/wN_*.py`, one module per week |

Two copies of the same material is the duplication the teaching standard forbids. Week 3
has already shown the cost: four review rounds each found stale figures that had drifted
between copies. **Recommendation: keep the existing structure.** Map each specification
deliverable onto it, as in the plan below.

### 2 · The Redis idempotency layer is the answer week 2 teaches against

The specification asks learners to "build a Redis-backed key/token idempotency layer".
Week 2's 03:03 lab makes the key the primary key of a SQLite table. It then says the rule
plainly: *"The constraint has to be in the store the payment is written to, or the claim and
the credit can still split."*

A Redis key store sits beside the ledger, not inside it. A worker can claim the key in
Redis, crash, and leave no credit. Or the credit commits and the key write fails. That is
the split week 2 warns about. A senior engineer in the room will notice that the course
contradicts itself.

Redis also adds a service to eight laptops in the middle of a cohort. **Keep SQLite.**
Week 2 already names Redis as one option for the *pending store* in topic 2, which is
the right place for it.

### 3 · It puts protocol mechanics into live minutes

- Week 4 asks for "MCP architecture: Client-Host-Server specifications, capability
  negotiation".
- Week 5 asks for "A2A Interaction Protocol: Agent Cards, handoff schemas".

Bridge 6 §7 decided on 29 September that protocol mechanics get zero live minutes. The MCP
specification changed in July 2026. A slide about it can be wrong by the time it is taught.
**What does not turn over is the boundary:** code you did not write, running with your
credentials, putting text into your context. The specification's `mcp_proxy.py` drill
teaches that boundary, and it is worth keeping. The protocol lecture is not.

A2A goes the same way. Name it among the products in week 5's enterprise-scale part. Teach
the handoff contract, which is the durable idea.

### 4 · Week 5 has four builds and four concepts in five hours

The specification gives week 5 an orchestrator, a compactor and a hybrid search engine.
It adds four lectures: orchestration patterns, A2A, a memory taxonomy and hybrid retrieval.
It also leaves out CAP and capacity, which the public M3 copy promises.

The teaching standard says: cut, do not compress. **Cut the hybrid search build.** Retrieval
quality stays a beat in week 5, as bridge 6 §3 decided, and points at a resource. Week 3
learned that four topics in one week fits only when they are one argument. Week 5's argument
is "one loop is no longer enough, and what the system remembers". A search engine is not
part of that argument.

### 5 · The five review questions have no security question

The specification's five questions for week 6:

1. Where is state stored between tool calls, and who can mutate it?
2. What is the maximum token spend allowed for a single bad input?
3. Which tool call can destroy value, and what gate stands before it?
4. How do you know when a model upgrade breaks your agent's tool accuracy?
5. What happens when primary model latency doubles during peak load?

Security is one of the course's two named outcomes, and week 4 owns it. None of the five
asks about it. A review that cannot fail a system for reading attacker text is not the
review this course promises.

**Recommendation: replace question 5.** The new question 5 is *"Which text does your agent
read that somebody outside can write, and what is the worst thing that text can make it
do?"* Latency at peak becomes the push probe under question 2, because both are about what
load costs. Question 2 then reads: *"What is the most one bad input can cost, in money and in
time?"*

### 6 · The cost formula has no line for a wrong answer that passed

The specification's formula:

    CPAO = (token cost + tool infrastructure cost + human review cost)
           ÷ successfully completed tasks

It prices what was spent. It does not price what was lost. An agent that credits ₹2,50,000
to an attacker and closes the ticket counts as a completed task. Week 3 taught the room
that the grader agrees with a person only 70% of the time, with a kappa of 0.35. So some
"successful" tasks are wrong, and the room can now estimate how many.

The Run-Cost Model already prices retries, failed tool calls, review minutes, evaluation
upkeep and re-qualifying a new model version. **Recommendation:** teach the Run-Cost Model's
version, and add one term the room can derive from week 3's numbers:

    CPAO = (spend + expected loss from wrong outcomes that passed)
           ÷ outcomes that met the pass bar

"Met the pass bar" ties the denominator to week 3's gate table. Without that tie,
"successful" means whatever the person presenting wants it to mean. Also: **do not write
`financial-model-template.py`**. The Run-Cost Model and its workbook already exist and are
gated downloads. A second calculator is a second source for the same number.

### 7 · Two of its week 3 methods are weaker than what is built

- **Five runs.** The specification reports rates "over N=5 runs". Week 3 runs twenty, and
  its second outcome asks *how many runs before the rate stopped moving*. At five runs one
  flip moves the rate by 20 points. The adversarial case reads 15/20 at twenty runs. The
  course is right and the specification is not.
- **Case classes.** The specification uses synthetic, edge, regression and production
  sample. Week 3 uses ordinary, difficult, incomplete and adversarial. The specification's
  list mixes two different questions: *where a case came from* (synthetic, production
  sample) and *what failure it catches* (edge). Week 3's list answers one question only,
  which makes it the better one to teach. The source question is still worth one
  sentence. See the week 3 changes below.

### And what the specification leaves out entirely

- **The teaching standard.** No predictions, no checkpoints, no quizzes, no named roles, no
  assignment per week, no "✅ You can now…". It asks for "high-density" notes, which is the
  opposite of the communication style.
- **Accountability for AI-written code** (bridge 4). It is one of the five public outcomes,
  and it is the escalating last bullet of every week's drill checkpoint.
- **The hours.** `threads.md` already records homework at about 7h45 against a published
  ~5 hours a week. The specification adds builds without removing any.
- **Agent memory as the course defines it.** The specification's taxonomy (working, episodic,
  semantic) is a useful diagram. But the gap bridge 6 found was about scope, expiry and who
  may correct a memory. That is what the Agent Memory Audit Kit tests.

---

## Where the specification makes the course better

Adopt these. Each lands inside the existing structure.

- **Week 4 gets three concrete builds**: a proxy at the tool boundary, a gate on retrieved
  text, and a circuit breaker on a runaway loop. The week 4 file today is placeholders with
  decisions around them. These fill it without breaking any decision.
- **The circuit breaker builds the sixth guardrail kind.** Week 2's map names six kinds
  and builds three: the limit, the human gate and state. A breaker on token burn is the
  *resource* kind. It is also the build behind bridge 6 §4's ten-minute monitoring beat.
- **Week 5's compactor is bridge 3's long-run obligation**, owed since 8 September.
  Compacting a 50-turn trace to under 1,000 tokens *without losing the safety constraints*
  is exactly the question. Week 3's harness measures whether it worked.
- **Week 5's handoff check is where step-level evaluation should land.** Validating the
  state passed between two loops means grading one step on its own. That is the
  tool-selection and argument-validation gap the 7 October audit commit flagged in week 3.
- **A fixed set of five questions repairs a broken promise.** Week 6's summary says "read by
  the room against the same five questions all cohort". Weeks 1, 2 and 3 each ask a
  different five. With the change in §5 above, the specification's five can become that
  fixed set. Each question has a week that built its evidence (table below).
- **Risk tiers for deployment.** The specification's three tiers (read-only internal,
  external non-financial action, financial or state change) map onto week 1's drill 2,
  where tools are graded by consequence. Week 6 can join them to bridge 4's risk-tiered
  review of AI-written code: the tier of the action sets the depth of review for the code
  that performs it.

---

## The final six weeks

Timing follows `generation-prompt.md`: five topics of about 39 minutes, and a 58-minute close
of recall, teardown, quiz and takeaway. Code lands in `reference-agent/src/` as `wN_*.py`
with `make` targets, exactly as weeks 1 to 3 do. Nothing changes the output of an earlier
week's target.

### Week 0 · Before we begin — unchanged

Already matches the specification. One item is still owed from bridge 6 §7: protocol
mechanics for MCP as reading, not live time. Week 0 has passed, so that reading moves into
week 4's pre-work instead (below). **Do not replace the thirteen intake capabilities** with
the specification's examples. The week 6 re-ask must use the same words, or the
before-and-after comparison measures nothing.

### Week 1 · The harness — unchanged

Taught. Every specification item is present.

### Week 2 · Guardrails — one owed edit, otherwise unchanged

Taught. See the changes list below.

### Week 3 · LLM evaluation — released after the fixes below

### Week 4 · Attack your own system

**The argument:** the agent reads text an attacker can write. The defence is to limit what
that text can make the agent do. A better filter is not the defence.

| # | Topic | Builds | The question it opens on |
|---|---|---|---|
| 1 | Prompt injection, direct | `make w4-inject` | Who added "ignore instructions in the ticket" to the prompt last week? Show it holding. (Bridge 2: then break it live) |
| 2 | Indirect injection through retrieval | `make w4-poison`: a hostile clause in the policy store, then a gate after retrieval | Your gate catches 9 of 10 hostile clauses. What does the tenth do? |
| 3 | The boundary you did not write (MCP) | `make w4-proxy`: a proxy between the agent and a tool server it did not write | Statelessness moved authorisation to the application layer. Whose code is that now? |
| 4 | Containment | Least privilege on the tools: the ₹2,50,000 case fails even when the injection works | If the injection succeeds, what is the most it can do? |
| 5 | The runaway loop, and who would notice | `make w4-breaker`: halt on token burn and on a repeated tool call | Which signal would have moved, who reads it, and what do they do at 3am? |

- **Topic 2 must not teach that detection works.** The gate is a probabilistic control. Its
  miss rate is measured with week 3's harness, and that is bridge 1's link. Topic 4 is the
  answer: make a successful injection cheap.
- **Every attack becomes a regression case before the close** (bridge 1). This is where the
  specification's "regression" case source gets taught.
- **Topic 3 includes the adoption beat**: when inheriting somebody's tool surface is right,
  and what to ask them first.
- **Pre-work:** the Agent Failure Triage Quiz (decided), and one page of MCP mechanics
  reading. Run `npm run gather` on MCP before writing a claim about the current
  specification.
- **Part 5, named:** prompt-injection classifiers (Lakera Guard, Azure AI Content Safety
  Prompt Shields, Meta Prompt Guard, NVIDIA NeMo Guardrails), and trace tooling for topic 5
  (Langfuse, Arize Phoenix, Datadog LLM Observability, OpenTelemetry's GenAI conventions).
  Price each one at write time, not from memory.
- **Assignment:** an ADR for one containment decision. Design section: the attack, the
  tool's privilege before and after, and the regression case.
- **Checkpoint bullet (bridge 4):** "the assistant will defend against the attack you named,
  and only that one. Review the attacks it did not think of."

### Week 5 · The second loop

**The argument:** one loop is no longer enough, and what each loop knows. Splitting the
work and remembering things are one question asked twice.

| # | Topic | Builds | The question it opens on |
|---|---|---|---|
| 1 | When to split, and when not to | Decide first: supervisor, chain or parallel for the dispute agent | What does the second loop cost before it saves anything? |
| 2 | The handoff contract | `make w5-handoff`: a schema-checked handoff between two loops, graded step by step | The second agent got valid JSON with the wrong account. Which check should have caught it? |
| 3 | Agent memory: scope, expiry, correction | `make w5-memory`, built from the Agent Memory Audit Kit's tests | A correction is a memory too. What did the agent learn from the last refund? |
| 4 | Compaction | `make w5-compact`: 50 turns to under 1,000 tokens, scored by week 3's harness | Which constraint did compaction drop, and which case shows it? |
| 5 | Capacity, three beats | No build | Latency doubles at peak. What does the loop do? Plus CAP and retrieval quality |

- **Move the memory kit's case onto the dispute agent.** The kit opens on an expense agent.
  That is a second system, and the teaching standard says one anchor. The same failure
  works on disputes: the agent remembers a goodwill credit given once and applies it to the
  next dispute.
- **Topic 2 closes the step-level evaluation gap** (tool choice and argument validity per
  step). Week 6's question 4 depends on it.
- **Topic 5 is three beats, not a topic**, and that is the cost. CAP and capacity are named
  in the public M3 copy, so neither may disappear. Retrieval quality points at a resource:
  name chunking, re-ranking and hybrid search, and say which to try first.
- **Part 5, named:** orchestration (LangGraph, Temporal, AWS Step Functions, OpenAI Agents
  SDK), handoff protocols (A2A, MCP, plain JSON Schema), memory stores (Mem0, Zep, Letta).
- **Assignment:** an ADR for one split-or-not decision in their own system.
- **Checkpoint bullet (bridge 4):** "name the decision you would not delegate, and say why
  that one."

### Week 6 · The review

**The argument:** read your own system against five fixed questions, and decide whether you
would fund it. No new material.

The five, with the week that built the evidence for each:

| # | Question | Evidence from |
|---|---|---|
| 1 | Where is state kept between tool calls, and who can change it? | W2 pay once, W5 memory |
| 2 | What is the most one bad input can cost, in money and in time? | W1 cost per step, W4 breaker, W5 latency at peak |
| 3 | Which tool call can destroy value, and what stands before it? | W1 drill 2, W2 human gate |
| 4 | How would you know a model upgrade broke tool accuracy? | W3 rates and gate table, W5 step-level grading |
| 5 | Which text does your agent read that an outsider can write, and what can it make the agent do? | W4 |

- **The business case, about twenty minutes, inside the review.** Cost per acceptable
  outcome with the loss term from §6. Include a case where the answer is "never".
- **Governance is about who owns each decision.** Three action tiers set the depth of review
  for the code behind each one. This is bridge 4's formal version. No regulatory frameworks.
- **The week 6 re-ask of the thirteen capabilities**, as already planned.
- **No new code.** The Run-Cost Model replaces `financial-model-template.py`.
- **Summary line changes** from "the same five questions all cohort" to something true.
  Suggested: "Your own system, read by the room against five questions the course has been
  building evidence for since week 1."

---

## Changes to weeks 1 to 3

### Must fix before week 3 is released

**1 · Week 3's session file body is a stale second copy of the day.**
`src/content/sessions/week-3.md` is still `status: draft`, so learners do not see it yet.
When it flips to `ready`, `/craft/week-3` renders it. Its body describes an older structure
than its own frontmatter and the generated pages:

| | Frontmatter and pages | Body |
|---|---|---|
| Structure | Five topics: evals, RAG, LLM-as-judge, release gates, context | Eight sections: Cycle A, Cycle B, document, Cycle C, review round, pass bar, context cliff, horizon |
| Checkpoints | 01:00, 01:43, 02:22, 03:16, 04:00 | 00:48, 02:13, 03:10, 04:08 |
| Cut material | The second-model-version segment was cut on 30 September | Still present at "The same cases, a second version" |

Week 2 had the same problem and was fixed on 30 September by shrinking its body to a short
guide (RESUME, "Week 2 rebuilt against the generation prompt"). Do the same here.

### Should change

**2 · Week 3: name step-level evaluation, and the week that builds it.** One sentence in
topic 1. Trajectory and end-state evaluation are taught. Grading a single step (was it the
right tool, were the arguments valid) is not, and the audit commit of 7 October flagged it.
Recommendation: do not add a segment to a topic already at 45 minutes. Name it, and say week
5 builds it. The teaching standard says a topic with no named week looks missing rather
than scheduled.

**3 · Week 3: one sentence on where cases come from.** The four classes say what failure a
case catches. Add the second question: synthetic, taken from production, or added after an
incident (a regression case). Week 4 then builds regression cases with a name the room
already has.

**4 · Week 3: the 03:33 instructor note says "two papers support the positional shape" and
names neither.** Flagged in the same audit. Name them, or cut the sentence.

**5 · Week 2: the ownership question owed by bridge 6 §5.** One question against the nine
control points: *which of these do you own, and which does a vendor change under you?* It
is a two-line edit and a rebuild of the topic 1 pair. It has been owed since 29 September.
Week 4 topic 3 opens on it, so it should land before week 4 is written.

### Leave alone, deliberately

- Week 2's SQLite fix. Do not move to Redis (§2).
- Week 3's twenty runs. Do not drop to five (§7).
- Week 3's four case classes. Do not replace them with the specification's (§7).
- Weeks 1 to 3's teardown questions. They are taught and published. Week 6 maps them onto the
  fixed five rather than rewriting three weeks to match.

---

## Decisions that need you

1. **Approve the six-week plan above.** Then it gets written into `threads.md` as bridge 7,
   and the bracketed notes in `week-4.md`, `week-5.md` and `week-6.md` are replaced with it.
2. **Week 6's question 5: security or latency?** My recommendation is security, with
   latency moved into question 2. The cost: the specification's five questions then become
   six concerns compressed into five, and question 2 is the one carrying two.
3. **Step-level evaluation: week 5 build (recommended) or week 3 now?** Week 5 costs
   nothing in week 3. Week 3 now means one segment of about ten minutes cut from somewhere
   in a day that four review rounds have already balanced.
4. **The hours.** The plan puts every build inside the live session and makes the ADR the
   only after-work for weeks 4 and 5. That keeps those weeks inside ~5 hours. It does not fix
   the 7h45 already recorded across the course.
5. **Naming memory in the public M3 copy.** Still open from 29 September. Week 5 now teaches
   it in full.

## Not done

- No repository was scaffolded, and no Python was written.
- No session file, page or `threads.md` row was edited. Each change above is a proposal.
- Named products in week 4 and 5 are candidates. Their prices were not looked up and must be
  checked at write time.

---

## Revised plan, after Sunil's follow-ups — 7 October

**This section replaces "The final six weeks" above wherever the two differ.** Sunil asked
for five subjects to be separate topics, and for some week 5 builds to become homework.

### Five subjects, each a topic of its own

| Subject | Week | Slot |
|---|---|---|
| RAG, part 1: retrieval as the reason evaluation is needed | 3 | Topic 2, already written |
| MCP server: build one, then use one you did not write | 4 | Topics 3 and 4 |
| A2A: the handoff contract | 5 | Topic 2 |
| RAG, part 2: retrieval quality | 5 | Topic 3 |
| Memory optimisation | 5 | Topic 5 |
| Tokenomics | 6 | Topic 1 |

**This reverses bridge 6 §7** (protocols get no live minutes). The guard against turnover:
teach the design choices live, put mechanics in the pre-reading, print the specification's
version date on every page, and run `npm run gather` on MCP and A2A the week before.

**What moved to make room.** Containment folds into week 4 topic 4, because the proxy is
where least privilege is enforced. CAP folds into A2A. Capacity under load moves into week 6
tokenomics. The week 6 review loses about 40 minutes.

### Week 5 homework

Homework cannot add time. The published commitment is ~5 hrs/week and the session alone is
5 hours. Week 5 gets the same 2 hours of after-work as week 3, ADR included.

| Build | Where | Why |
|---|---|---|
| A2A handoff | Room | Pair work, and week 6 question 4 needs everyone to have it |
| RAG part 2 | Home, 50 min | Solo measuring. Index builds and a shared free key fail in a room of eight |
| Memory tests | Split: rules in the room, three tests at home, 30 min | The decisions need the room. The tests do not |
| Compaction | Room | Its reveal needs a prediction, and it builds on topic 4's rules |

- The week 5 ADR becomes **one memory decision** (40 min), not split-or-not.
- Nothing in the room depends on homework being done. Week 6 tokenomics reads the RAG
  cost-per-1,000-queries figures, with the instructor's as the fallback.
- Every homework build has a `-check` target that prints pass or fail.

### Topics and subtopics, weeks 4 to 6

Weeks 0 to 3 are as built; the proposed week 2 and 3 changes are listed earlier in this file.
Every topic below follows the six-part shape and closes on "✅ You can now…".

**Week 4 · Attack your own system**
1. *Direct prompt injection.* The prompt line someone added after week 1, shown holding, then
   broken live. Lab `make w4-inject`: three attacks, each made a regression case. Named:
   Lakera Guard, Azure Prompt Shields, Meta Prompt Guard, NeMo Guardrails.
2. *Indirect injection through retrieval.* A planted clause credits ₹50,000 without review. A
   check after retrieval catches 9 of 10. Lab `make w4-poison`: build it and measure its miss
   rate with week 3's harness.
3. *Build an MCP server.* `issue_credit` marked `idempotentHint: true` pays ₹1,200 twice.
   Tool size, schema, annotations, and authorisation in application code. Lab
   `make w4-mcp-serve`.
4. *Use an MCP server you did not write, and contain it.* A CRM server returns notes with
   instructions, on a token that can write. Adoption questions, then least privilege per
   tool. Lab `make w4-proxy`: the ₹2,50,000 case fails even when the injection works.
5. *The runaway loop, and who would notice.* One run calls `get_account` 60 times and burns
   180,000 tokens. The resource guardrail. Lab `make w4-breaker`. The monitoring beat: which
   signal moves, who reads it, what happens at 3am. Named: Langfuse, Arize Phoenix, Datadog
   LLM Observability, OpenTelemetry GenAI conventions.

Pre-work: the Agent Failure Triage Quiz and one page on MCP mechanics. Assignment: an ADR
for one containment decision.

**Week 5 · The second loop**
1. *Multi-agent orchestration: when to split* (35 min). Four agents tripled the cost per
   dispute. Supervisor, chain, parallel. Decide, no build. Named: LangGraph, Temporal, AWS
   Step Functions, OpenAI Agents SDK.
2. *A2A: the handoff contract* (52 min). Valid JSON, wrong account. Agent cards, tasks, typed
   handoff, step-level grading, the CAP beat. Pairs, `make w5-a2a`.
3. *RAG part 2: retrieval quality* (25 min, build at home). Week 3's guard escalates 30%.
   Chunking, hybrid search, re-ranking, freshness. Predict, then the instructor's table.
4. *Agent memory* (35 min, tests at home). A goodwill credit remembered and reused. Working,
   episodic, semantic; scope, expiry, correction. Named: Mem0, Zep, Letta.
5. *Memory optimisation* (55 min). Compaction saved 80% and dropped the ₹10,000 approval
   rule. Full, summarised, looked up; prompt caching. Lab `make w5-compact`.

Homework, 2 hours: `make w5-rag` 50 min, `make w5-memory` 30 min, the memory ADR 40 min.

**Week 6 · The review**
1. *Tokenomics* (about 42 min). The October bill for 40,000 disputes. Cost per token, step,
   run, acceptable outcome, with the loss term. Caching, routing, batch, ceilings. Rate
   limits and latency doubling at peak. Lab `make w6-tokens`. Include a "never build it"
   case. Named: the Run-Cost Model, LiteLLM, Portkey, Helicone, provider batch APIs.
2. *Governance* (about 20 min). Three risk tiers; the tier sets the depth of review for the
   AI-written code behind each action. Who owns each decision.
3. to 6. *The review*, four slots of about 35 min, two learners each. Six minutes to show,
   the five questions from the room, then fund / fund with one change / do not fund, with a
   cost per acceptable outcome.

Close: mixed recall across six weeks, final quiz, the thirteen-capability re-ask, one
takeaway each.

**Every number in weeks 4 to 6 is an invented teaching figure, and every named product is a
candidate whose price has not been checked.**

---

## Sunil's decisions — 7 October

| # | Question | Decision |
|---|---|---|
| 1 | The revised six-week plan | **Approved as written.** It goes into `threads.md` as bridge 7, and replaces the placeholders in `week-4.md`, `week-5.md` and `week-6.md` |
| 2 | Week 6 question 5 | **Security.** Q5 is "Which text can an outsider write, and what can it make the agent do?" Latency joins Q2: "in money and in time" |
| 3 | Step-level evaluation | **Built in week 5**, in the A2A topic. Week 3 names it in one sentence and points to week 5 |
| 4 | Public M3 copy | **Update it** to name agent memory, A2A, MCP and tokenomics, through `cohort-copy.ts` |
| 5 | Shipping | **Two PRs.** PR A on `content/week-3-review-fixes`: bridge 7, weeks 4 to 6 session files, the week 3 fixes and the owed week 2 question. PR B on its own branch: the public M3 copy, because merging it deploys public text |
