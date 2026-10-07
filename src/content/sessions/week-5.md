---
week: 5
title: "The second loop"
module: M3
summary: "One loop is no longer enough: how two agents hand work over, what each one remembers, and how to keep that memory small."
status: draft
topics: []
# THE FIVE OUTCOMES, one per topic, from bridge 7 of docs/teaching/threads.md
# (decided 7 October 2026). No `movesMost` yet: that flag is Sunil's
# before-the-fact prediction, and nobody has made one for this week.
outcomes:
  - id: split
    text: decide whether a task needs a second agent, and state what the second loop costs before it saves anything
  - id: handoff
    text: build a schema-checked handoff between two agents, and grade each step of it on its own
  - id: retrieval
    text: name the retrieval change that moves my score most, and what it costs per 1,000 queries
  - id: memory
    text: set the scope, the expiry and the correction rule for one thing my agent remembers
  - id: compact
    text: shrink a 50-turn history to a token budget, and show which safety rule survived and which did not
# Week 5's row of the matrix in docs/teaching/threads.md. The only week that
# builds three threads, which is why two of its builds are homework (bridge 7 §3).
threads:
  - { id: multi-agent, weight: builds }
  - { id: state, weight: builds }
  - { id: retrieval, weight: builds }
  - { id: boundaries, weight: second }
  - { id: evidence, weight: second }
  - { id: trace-and-bill, weight: second }
# The assignment is decided (see "After" below) and held back on purpose. A real
# string here is shown to learners on /craft/adr and by the discussion lookup
# while the week is still a draft. Set it when status becomes ready.
assignment: "TBD"
---

<!--
WRITER'S NOTE. The topics below were approved by Sunil on 7 October 2026
(docs/teaching/reviews/course-review-2026-10-07.md, and bridge 7 of
docs/teaching/threads.md). Build the pages against generation-prompt.md as weeks
2 and 3 were, then shrink this body to the short guide week 3 now has.

Things that must survive the writing:
- One argument, not five topics: what each loop knows, and where that knowledge
  comes from (another agent, a document, or its own memory).
- Homework replaces live minutes (bridge 7 §3). Nothing in the room may depend on
  the homework being done. Every homework build gets a -check target.
- Topic 2 builds step-level evaluation. Week 6's question 4 depends on it.
- CAP is inside topic 2. Capacity under load is week 6's, inside tokenomics.
- The Agent Memory Audit Kit opens on an expense agent. Move its case onto the
  dispute agent: one anchor system.
- Name A2A's spec version date on every page that names it. Run
  `npm run gather` on A2A the week before.
- If the dry run runs long, cut the A2A build first and keep the contract on
  paper.
- Bridge 4 checkpoint bullet: name the decision you would not delegate, and say
  why that one.
- Teaching figures here (four agents, 30% escalation, the ₹10,000 rule, 80%)
  are invented for the case and may change. Product prices are unchecked.
-->

**Today is about the second loop: when one agent is no longer enough, and what
each agent knows.** Splitting the work and remembering things are one question
asked twice. Once there are two loops, what each one knows about the other is no
longer a theory question.

## Before the session

- Answer one question in writing, from week 3's homework: what does your agent
  get shown each turn that nobody chose?
- Pull the reference agent, and run `make w5-a2a` once so that the first lab is
  not also your first install.

## The five topics

**1 · Multi-agent orchestration: when to split.** What does a second loop cost
before it saves anything?
- The dispute agent split into four agents, and the cost per dispute tripled.
- Three shapes: a supervisor that routes work, a chain of handoffs, and agents
  that run in parallel whose results are combined.
- Decide, no build: which shape for the dispute agent, or none.
- At enterprise scale: LangGraph, Temporal, AWS Step Functions, OpenAI Agents
  SDK, each with what it costs.

**2 · A2A: the handoff contract.** The approver received valid JSON with the
wrong account. Which check should have caught it?
- An agent card says what an agent can do. A task carries the work. A typed
  handoff carries the state.
- Grade each step on its own: the right tool, and valid arguments. This is
  step-level evaluation.
- Two agents read the ledger at different moments. Which one is right? This is
  where the CAP trade-off shows up.
- Lab in pairs, `make w5-a2a`: an investigator and an approver, with a
  schema-checked handoff between them.
- At enterprise scale: A2A, MCP used between agents, and plain HTTP with JSON
  Schema, with costs.

**3 · RAG part 2: retrieval quality.** Which change moves your retrieval score
most, and what does it cost per query?
- Week 3's guard escalates 30% of disputes, because retrieval is thin.
- Four levers: how documents are split into chunks, keyword search combined with
  vector search (hybrid search), re-ranking with a second model, and keeping
  the store up to date.
- Predict which lever helps most, then see the results table.
- Retrieval alone gives the same result every run, so it needs no repeat runs.
- At enterprise scale: OpenSearch hybrid search, pgvector, Pinecone, Cohere
  Rerank, with costs.
- The build is homework.

**4 · Agent memory: scope, expiry, correction.** What did the agent learn from
the last refund?
- The agent remembers a goodwill credit given once, and applies it to the next
  dispute.
- Working memory, episodic memory (past events) and semantic memory (lasting
  facts).
- A correction is a memory too.
- Decide the rules for the dispute agent: what it keeps, for how long, and who
  may correct it.
- At enterprise scale: Mem0, Zep, Letta, with costs.
- The tests are homework.

**5 · Memory optimisation.** Compaction saved 80% of the tokens. Which safety
rule did it drop?
- A 50-turn conversation, and the ₹10,000 approval rule it loses.
- What stays in full, what becomes a summary, and what is looked up only when it
  is needed.
- Prompt caching for the part that never changes: the provider reuses a repeated
  opening at a lower price.
- Lab, `make w5-compact`: shrink 50 turns to under 1,000 tokens, scored by week
  3's harness.
- At enterprise scale: provider prompt caching, framework checkpointers,
  summarisation services.

Each topic ends the same way: three quiz questions, one of them from an earlier
week, and one line you write in your own words.

## How the day closes

- **Recall, notes closed.** Every control the agent gained today, and what each
  one prevents.
- **Architectural teardown.** The agent as two loops, at the close.
- **The quiz.** Eight questions, mixed across today and earlier weeks.
- **Your takeaway, said out loud,** then the same five statements rated again.

## After

Two hours, in three parts.

- **50 minutes · Retrieval levers,** `make w5-rag`. The starter code wires
  hybrid search and re-ranking. Turn on one lever at a time, and record the
  retrieval score and the cost per 1,000 queries. `make w5-rag-check` says
  whether your table is complete. Week 6 uses these numbers.
- **30 minutes · Memory tests,** `make w5-memory`. Make three of the seven tests
  pass: the three that match the rules you set in the room.
  `make w5-memory-check` says pass or fail.
- **40 minutes · The decision record.** One memory decision in your own system:
  what it keeps, for how long, and who may correct it. The tests are its
  evidence.

**What is deliberately not here.** What the whole system costs, and what happens
when latency doubles at peak, are week 6.
