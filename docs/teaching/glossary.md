# Glossary — the industry's words, and the plain words beside them

*For anyone writing or revising a session, a note, a quiz or a teaching page. Started
13 October 2026, after review row 71 said week 4 "doesn't use any of the industry
terminologies", and Sunil asked for the same fix across every week.*

## Why this file exists

The cohort is eight senior engineers who will read vendor documents, OWASP lists and
papers after the course. If the pages only ever say "keep it apart in the prompt", nobody
can search for spotlighting. If the pages only ever say "spotlighting", a reader whose
first language is not English has to stop and guess. So every concept gets both, in a
fixed order, and the same term means the same thing in every week.

## The rules

1. **Lead with the industry term, then the plain words.** "Spotlighting (marking untrusted
   text so the model treats it as data)". In a heading, the term can lead and the plain
   words follow a colon: "Spotlighting: keep untrusted text apart in the prompt".
2. **Gloss a term the first time it appears in each file**, in the same sentence. After
   that, use the term alone.
3. **Use the term where the concept is being taught, not everywhere.** A sentence that
   carries three terms is a sentence nobody reads aloud. One term per sentence is the
   ceiling.
4. **Do not rename a clock title** (the rows in `scripts/teaching-clock.mjs`). The title is
   matched across the clock, the pages, the notes and the session file. Put the term in
   the body instead.
5. **Name the source when a term has one**: a paper, OWASP, a vendor that coined it. Never
   invent a citation; if you cannot name it with confidence, use the term without one.
6. **This file is the list.** A term that is not here is added here first, with its gloss,
   so the next week uses the same words.

## The terms

Grouped by the week that teaches them first. "Our words" is how the pages said it before
13 October; keep those words as the gloss.

### Week 1 · The harness

| Term | Plain gloss | Our words |
|---|---|---|
| **Agent loop** (often a ReAct loop: reason, then act) | The cycle where the model picks a tool, the code runs it, and the result goes back to the model | "one run is many calls" |
| **Tool calling** (also function calling) | The model asks for a named function with arguments, and code runs it | "the model asks for a tool" |
| **Context window** | Everything the model can read in one call, measured in tokens | "what the model sees" |
| **Tool schema** | The declaration of a tool's name, its arguments and their types, which the model reads to call it | "the tool's definition" |
| **Harness** | The code around the model: the loop, the tools, the checks, the trace | "the harness" |
| **Trace** (and **span**, one step inside it) | The record of every call, tool and result in one run | "the trace" |
| **Observability** | Being able to answer "what happened and why" from what the system recorded | "can we see it" |
| **Step budget** (also max iterations) | A limit on how many turns of the loop one run may take | "the step budget" |
| **Pre-dispatch validation** (argument validation; in week 4's four layers, **pre-dispatch tool validation**) | Checking a tool call's arguments in code before the tool runs | "check the arguments before you dispatch" |
| **Action tiering** (tool risk classification) | Grading tools by what they can do: read-only, reversible, irreversible | "grade the tools by consequence" |
| **Failure taxonomy** | A fixed list of named failure kinds, so a failure can say which one it is | "make the failure say its name" |
| **Non-determinism** | The same input can give different outputs, even at temperature 0 | "odds, or what is possible" |
| **Temperature** | The setting that controls how much a model's choices vary; 0 is the least | "temperature" |
| **Human-in-the-loop** (HITL) | A person approves or decides at a named step | "a person decides" |

### Week 2 · Guardrails

| Term | Plain gloss | Our words |
|---|---|---|
| **Guardrail** | A control outside the model that limits what the agent can do or say | "a control" |
| **Policy enforcement point** (PEP) | One place where a rule is checked, so every call on that path passes through it. Where you put it decides which callers it covers | "where a control can stand", "move it to the dispatch" |
| **Policy as code** | A rule written as code or config that is versioned and tested, not as a sentence in a prompt | "the rule in code" |
| **Approval gate** (in banking, **maker-checker** or the **four-eyes principle**) | One person or system proposes; a different one approves | "the gate" |
| **Hard limit** (spending limit, ceiling) | A number the code will not exceed, whatever the model asks | "the ceiling" |
| **Fail closed** / **fail open** | When the check itself breaks, refuse (closed) or allow (open) | "what happens when the check is down" |
| **Defence in depth** (layered defence) | Several controls that fail for different reasons, so one failing does not let the harm through | "layered defence" |
| **LLM-as-a-judge** | A model that reads another model's output and scores or approves it | "a model checking a model" |
| **Idempotency** and the **idempotency key** | Doing the same request twice has the same effect as once; the key is how the server recognises the repeat | "pay once" |
| **Race condition** (here, **TOCTOU**: time of check to time of use) | Two runs read the same state, both decide, and both act | "two runs at once" |
| **Compare-and-set** (optimistic concurrency) | Write only if the record is still the version you read; otherwise read again | "write only if nothing changed" |
| **Red teaming** (adversarial testing) | People try on purpose to make the system fail, before an attacker does | "the adversary round" |
| **Architecture decision record** (ADR) | A short written record of one decision: context, options, choice, consequences | "the decision record" |
| **Latency budget** | How much time a control may add to each request | "its latency tax" |

### Week 3 · Evaluation, retrieval, context

| Term | Plain gloss | Our words |
|---|---|---|
| **Evaluation harness** (evals) | Code that runs a set of cases through the agent and scores each one | "the harness that tests the agent" |
| **Golden dataset** (test set) | The fixed cases with known right answers that every version is scored against | "the cases" |
| **Regression test** | A case kept so that a failure fixed once is caught if it returns | "every case that ever failed" |
| **Code-based grader** (deterministic assertion) | A check written in code that gives the same score every time | "a check in code" |
| **Model-based grader** (LLM-as-a-judge) | A model that scores an answer against a rubric | "model-based grading" |
| **Rubric** | The written criteria a grader scores against | "what counts as right" |
| **Inter-rater agreement** (often Cohen's kappa) | How often two graders give the same score, corrected for agreeing by chance | "how far your grader agrees with you" |
| **Retrieval-augmented generation** (RAG) | The model answers from documents it searched for at run time | "the rule is in a document now" |
| **Retriever**, **chunk**, **top-k** | The search step; one piece of a document; the k highest-scoring pieces returned | "the search", "the clause", "the top two" |
| **Retrieval recall** (recall@k) | Of the pieces that should have been found, how many were in the top k | "did it find the right clause" |
| **Context precision** (precision@k; the Ragas metric) | Of the pieces the search returned, how many were relevant | "how much of what it found was useful" |
| **RAG triad** (TruLens) | Three checks on one answer: was the retrieved context relevant, is the answer grounded in it, does it answer the question. Ragas reports the same steps as context precision and recall, faithfulness and answer relevancy | "three questions about one answer" |
| **Faithfulness** (groundedness) | Whether the answer says only what the retrieved text supports | "did it use the clause it found" |
| **Hallucination** | A confident statement the sources do not support | "it made it up" |
| **Release gate** (quality gate) | A rule that blocks a release unless the evaluation passes a set bar | "the release gate" |
| **Acceptance threshold** (pass bar) | The score a version must reach to ship | "the pass bar" |
| **Offline** / **online evaluation** | Scoring on fixed cases before release / scoring on live traffic after it | "before and after it ships" |
| **Stratified sampling** | Choosing which live cases to grade so every important kind is represented | "what you sample" |
| **Context engineering** | Deciding what goes into the context window, in what order, at what size | "context engineering" |
| **Context rot** | Answers get worse as the context grows longer | not week 3's cliff, where the context got smaller |
| **Lost-in-the-middle effect** (Liu and others, 2023) | A fact placed in the middle of a long context is used less than one at the start or end | about position, not size |
| **Needle in a haystack** (Kamradt, 2023) | A test that hides one fact in a long context and asks for it | "find your own cliff" is a different test |

### Week 4 · Securing AI agents

| Term | Plain gloss | Our words |
|---|---|---|
| **Prompt injection** (OWASP LLM01:2025) | Text that makes the model follow an instruction the system's owner did not give | "an attacker's instruction" |
| **Direct prompt injection** | The instruction is typed by the user into the input | "the ticket text" |
| **Indirect prompt injection** (Greshake and others, 2023) | The instruction is hidden in content the model fetches: a document, record, page or tool result | "planted somewhere the agent will fetch" |
| **Jailbreak** | Text that makes a model ignore its own safety training, often by role-play | "role-play" |
| **Attack vector** | The route and the shape an attack takes | "ten ways to shape the request" |
| **System prompt fallacy** | Believing a rule written in the prompt can hold against an attacker | "the line in the prompt" |
| **Spotlighting** (Microsoft, 2024), also context isolation | Marking untrusted text so the model treats it as data: wrapping, marking every word, or encoding | "fenced", "keep it apart in the prompt" |
| **Dual-LLM pattern** (Willison, 2023) and **CaMeL** (Google DeepMind, 2025) | A model with no tools reads untrusted text; the model that acts never sees it raw | "a model with no tools in front" |
| **Input sanitisation** | Removing hidden characters, markup and metadata before text is stored or used | "clean it before it is stored" |
| **RAG poisoning** (OWASP LLM08:2025, Vector and Embedding Weaknesses) | A document written to win the search, so the retriever hands it to the model | "a planted clause" |
| **Data and model poisoning** (OWASP LLM04:2025) | A different attack: it changes the data a model is trained on | not used |
| **Content filter** (guardrail classifier) | A check that reads text and decides whether it looks hostile, by rules or by a model | "the content check" |
| **Provenance** (content signing) | Proof of who published a piece of text and that it has not changed | "where it came from" |
| **Trust boundary** | The line between text your team controls and text anyone else can write | "who can write it" |
| **Excessive agency** (OWASP LLM06:2025) | An agent holds tools that can do more than its task needs | "tools turn it into action" |
| **Least privilege** | Each tool gets the narrowest access that still does its job | "least privilege" |
| **Data exfiltration** | Getting private data out, often through a link or image address in a reply | "data out" |
| **System prompt leakage** (OWASP LLM07:2025) | The agent repeats its own instructions to an attacker | "the agent's own instructions" |
| **Output filtering** / **egress filtering** | Checking what leaves: links, images, personal data | "check what goes out" |
| **The lethal trifecta** (Willison, 2025) | Private data, untrusted content and a way to send data out, in one agent | not used before |
| **Model Context Protocol** (MCP): **server**, **client**, **tools/list**, **tools/call** | A standard way for an agent to discover and call tools on another program | "an MCP server" |
| **Tool annotations** (readOnlyHint, idempotentHint, destructiveHint) | Hints a server attaches to a tool; the spec says they are untrusted | "a hint" |
| **Tool poisoning** (Invariant Labs, 2025) | Hostile instructions inside a tool's description, which the model reads as prompt text | "the description change" |
| **Rug pull** | A tool server changes a tool after you reviewed and approved it | "day 9" |
| **Token passthrough** | A server accepts a token issued for something else; the MCP spec forbids it | "token passthrough" |
| **Confused deputy** | A program with real permissions is tricked into using them for someone who has none. An agent that pays because a planted note told it to is one | "the note was obeyed". Not week 2's "a second team pays without asking": that is a control that does not cover every caller |
| **MCP gateway** (tool proxy) | A program between the agent and tool servers that enforces a policy per tool | "the proxy" |
| **Allow-list** and **pinning** | Only listed tools are reachable; a tool is accepted only if its description hash matches the one reviewed | "a row per tool", "the pin" |
| **Unbounded consumption** (OWASP LLM10:2025), including **denial of wallet** | An agent or an attacker makes the system spend without limit | "the runaway loop", "burn money in a loop" |
| **Circuit breaker** | A limit on what one run may consume; past it, the run stops and goes to a person | "the breaker" |
| **Adversarial regression suite** (in CI, a poisoning or jailbreak suite) | Every attack that ever worked, run again on every change | "the regression set" |
| **Business-level alerting** (alerting on an outcome metric, not an error rate) | Paging when the number that means the job got done falls, such as credits per hour | "the number that means the job got done" |

### Weeks 5 and 6 · The second loop, and the review

Outline only so far. These are the terms the outlines already name; extend this table when
the weeks are written in full.

| Term | Plain gloss | Our words |
|---|---|---|
| **Multi-agent orchestration**: **supervisor** (LangGraph) or **orchestrator-workers** (Anthropic, "Building effective agents", 2024) | One agent splits the work, hands parts to other agents, and combines what comes back | "the second loop", "a supervisor that routes work" |
| **Handoff** | One agent passes a task and its state to another agent | "the handoff contract" |
| **Agent2Agent protocol** (A2A; Google, 2025, now a Linux Foundation project) | A standard for agents built by different teams to send each other tasks | "A2A" |
| **Agent card** (A2A) | A published description of what an agent can do and how to reach it | "says what an agent can do" |
| **Step-level evaluation** (also trajectory evaluation) | Scoring each step of a run, not only the final answer | "grade each step on its own" |
| **CAP theorem** (Brewer, 2000) | When the network splits, a system keeps either consistency or availability, not both | "the CAP trade-off" |
| **Chunking** | How documents are split into the pieces the search returns | "how documents are split" |
| **Hybrid search** (results often merged with **reciprocal rank fusion**, Cormack and others, 2009) | Keyword search and vector search run together, with their results merged | "keyword plus vector" |
| **Re-ranking** (often with a **cross-encoder**) | A second model reorders the top results by relevance | "re-ranking with a second model" |
| **MRR** / **nDCG** (nDCG: Järvelin and Kekäläinen, 2002) | Scores that reward putting the right piece near the top, not just somewhere in the top k | "the retrieval score" |
| **Working memory** (short-term memory) | What the agent holds during one task | "working memory" |
| **Long-term memory**: **episodic** and **semantic** (Tulving, 1972; for agents, CoALA, Sumers and others, 2023) | What lasts across tasks: past events (episodic) and lasting facts (semantic) | "past events", "lasting facts" |
| **Compaction** (also summarisation) | Shrinking a long history so it fits a token budget | "shrink 50 turns" |
| **Token economics** (tokenomics) | What each run costs, from tokens up to each acceptable outcome | "cost per acceptable outcome" |
| **Prompt caching** | The provider charges less for an opening it has seen before | "the part that never changes" |
| **Model routing** / **model cascade** (FrugalGPT, Chen and others, 2023) | Easy steps go to a smaller, cheaper model; hard ones go to a larger one | "sending easy steps to a smaller model" |
| **Batch API** (batch pricing) | Work that can wait is sent in bulk at a lower price. Check the current discount before quoting it | "work that can wait" |
| **Rate limit** | The most requests or tokens per minute a provider will accept | "provider rate limits" |
| **Risk tiering** | Grading actions by consequence, so the review depth matches the risk | "three risk tiers" |
| **RACI** | For each decision: who does it, who answers for it, who is consulted, who is informed | "who owns each decision" |

**Held back on purpose.** The EU AI Act's risk categories, NIST AI RMF and ISO/IEC 42001 are
not listed. Bridge 6 §6 keeps regulatory depth out of the cohort, and week 6's outline says
"no regulatory framework tour". Adding them is Sunil's decision, not a glossary edit.
