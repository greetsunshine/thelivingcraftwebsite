# Week 2 review, 1 October 2026: what changed for each comment

*Instructor material. Not learner-facing.*

Source: the "Notes Review" sheet, 10 content blocks and about 80 comments. Each row
says what changed and where. **L** is the learner page, **I** the instructor page,
**N** the notes file, **S** the session file. Times are session offsets.

Status: **Done**, **Done differently** (the reason is given), or **Not done** (the
reason is given).

## Guardrails (the description under the title)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| — | Explain it better and give context | Done | New description under the title: what a guardrail is, the three controls by name, and the attack round. L and I |
| 1 | Which 3 controls? | Done | Named in the description and the facts: a limit, an approval gate, pay once |
| 2 | Introduce the dispute agent, with a reference | Done | "The agent you are working on", with a link to github.com/greetsunshine/reference-agent. L opening, S |
| 3 | A brief summary of week 1 | Done | "What week 1 showed": the loop, three tools, the cost trace, and ₹5,000, ₹2,50,000 and ₹3,600 lost. L opening, S |
| 4 | Review the counts of topics, controls, routes and statements | Done | 4 topics (named), 3 controls (named), 6 routes (tried at 03:31), 5 statements (rated twice). All four were correct; each now says what it counts |

## What is today for?

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Say today is about understanding and mastering guardrails | Done | First sentence of the opening. L and I |
| 2 | Then introduce ticket #9999 | Done | "How today starts: ticket #9999" now follows the definition and the agent |
| 3 | Enter the session start time, and adjust every time | Done | A "Session start" field in the clock bar. Every session time on the page becomes the time of day. It is kept in the page address, never in the browser. Works on the full preview page and on every week 2 topic page. Tested: start 19:00, so 03:18 shows 22:18 |

## You will rate yourself on these five

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | List the major guardrail topics they rate against | Done | The five statements are a table, each labelled with its topic: policy enforcement, human approval, idempotency, false positives, governance. The statements' words did not change, so the two ratings still compare |
| 2 | Say where to enter the rating | Done | "Session mode" at `/craft/live`, at 00:05 and 04:55. L, I and S |
| 3 | "A score that drops at 04:55 is a good result" makes no sense | Done | Now: "If your second score is lower than your first, that is useful, not a failure. It usually means today showed you a gap you did not know about." |

## What the agent can do now

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Rephrase "One check at the dispatch, with two counters" | Done | "Every tool call checked against the policy file, with a count of what was allowed and refused" |
| 2 | Update "How you prove it" | Done | Every proof is now a command and what it prints |
| 3 | Say what "check" means | Done | The table's lede defines it: a policy check, a few lines of Python that run before a tool is called and can refuse it. It is not an API check |
| 4 | 03:18 should move with the start time | Done | Every time in the table is marked, so the start-time field converts it |
| 5 | Explain "Over the ceiling means no" | Done | "Any credit above ₹1,200 is refused outright, even when the customer is owed it. Meera is owed ₹8,400 and gets nothing" |
| 6 | Explain "The row is written before" | Done | "The decision record is saved before the person is asked, so the request is not lost if the program stops while it waits" |
| 7 | Explain the "A ₹44,000 request" proof | Done | The proof now runs ticket 7310 through the approval step, then explains the ₹44,000 request left over the break |
| 8 | Simplify "What the agent still cannot do" | Done | Three plain bullets: it cannot see a total; it still follows hidden instructions (week 4); a waiting request is lost on restart (week 5) |

## Clock Off

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Make it an editable field | Done | The same start-time field as above, with a Clear button |

## Five hours, six blocks

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Arrange into topics and blocks, with a table of contents | Done | A contents card: six blocks, four topics, and every segment with its time, each one a link that opens its topic. L and I |
| 2 | List the main topics expected under guardrails | Done | A table of ten guardrail topics and where each is covered today, in the "What guardrails are" card |
| 3 | Start with "What are guardrails" | Done | That card is now headed "What guardrails are, and the topics today covers", and opens with the definition and the three execution planes. The clock table's own heading stays "Five hours, six blocks", because the page checker finds the clock by it |

## Guardrails and policy enforcement (topic 1)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | What a limit is, and why it is needed | Done | "What a limit is, and why the agent needs one": a rule with a number; the model chooses the arguments. Topic 1 purpose card |
| 2 | Introduce input, output and system guardrails | Done | At 00:37, and up front in "What guardrails are" |
| 3 | Explain them with an example or code | Done | "One small example of each plane" at 00:37: masking a PAN, a Pydantic check on a credit, a circuit breaker |
| 4 | Synchronous, asynchronous and layered, with easy examples | Done | "When a check runs" at 00:37, one example each. 03:18 goes deeper with timings |
| 5 | What does "Two decision records on screen" mean, and do I do anything? | Done | The learner card says: two week 1 assignments, chosen and agreed before the day; learners prepare nothing new. The instructor's action is preparation item 8 |
| 6 | That section is hard to follow; rewrite it | Done | 00:15 rewritten as why a policy, what is on screen, then three numbered steps |
| 7 | Say why a policy is needed first | Done | "Why a policy, before anything else" opens 00:15 |
| 8 | "If an issue occurs at 2am", not "at 2am" | Done | 00:23's prompt and reveal reworded |
| 9 | Say the three properties are the rubric for a policy file | Done | "Use it to assess any guardrail: a policy file, a check in code, or an approval step" |
| 10 | Which pre-work? | Done | Pre-work item 6 is quoted word for word above the question |
| 11 | Say these are six kinds of guardrail | Done | "There are six kinds of guardrail, and you build three of them today" |
| 12 | Define "call site" | Done | Defined with an example, `issue_credit("4471", 1200)` |
| 13 | Keep a file of references to other weeks, and check those weeks have the content | Done | New file `docs/teaching/cross-week-references.md`. Week 1 and week 3 promises are kept; week 4 to 6 promises are listed as owed, because those weeks are drafts |
| 14 | Explain "A wrong sentence can be corrected…" | Done | Rewritten as a paragraph: a wrong sentence can be followed up; a paid ₹5,000 cannot. It names the three parts the action checks need, and which topic builds each |
| 15 | Code for some guardrails | Done | The three plane examples, plus code in every lab and on the enterprise cards |
| 16 | Say what "the check" is | Done | First sentence of 00:48 |
| 17 | Which file is the lab about? | Done | `data/my-policy.json` (new), `src/tools.py`, `src/main.py`, then `src/agent.py` at 01:20 |
| 18 | Which numbers? | Done | `1200` is the ceiling in rupees, one month of the ₹1,200 Pro plan; `null` means no ceiling; `reversible` and `owner` explained |
| 19 | The lab should create a policy file and update the right policy | Done | Build step 1 creates `data/my-policy.json` with three rows. The demo's own `data/policy.json` is left alone, because 00:23 runs on it |
| 20 | Code for "The row looks complete" | Done | The goodwill row in JSON, why it passes, and the invariant fix in code |
| 21 | More context for "The rule this cycle exists to land" | Done | What each move covered, what "resource of record" means, and a ledger database constraint as the example |
| 22 | Where are the lab answers, and how are they discussed? | Done | Behind "Show a working answer" on the learner page after every lab, and in full on the instructor page. Discussed at 01:10 (one screen) and in the topic quiz |

## HITL approval (topic 2)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | "Seven months of a billing error is still one honest customer" | Done | Rewritten: she is owed seven times the ceiling, and the rule cannot tell her apart from a fraudster |
| 2 | Context for "You watched a ₹0 last week too" | Done | Now says which week 1 run that was, and why this one is worse: the mistake is now in your code and repeats |
| 3 | "Sits between two others": which two? | Done | Named: human in command, and human on the loop |
| 4 | Design the HITL lab | Done | Meera's account and ticket 7310 added to the data; the over-ceiling branch writes a pending row to `data/approvals.jsonl`; `src/approve.py` approves or refuses by id, refuses the requester, applies a timeout default, and pays once. Checks and a worked answer included |
| 5 | Qualify the six paths and the seventh | Done | "An approval request can end in six ways", and a common seventh named |
| 6 | HITL best practices, from an architect's view | Done | A list of eight at 02:24 |
| 7 | Introduce the tiered gateway, with a guardrail-model snippet | Done differently | Introduced briefly at 00:37 ("layered") and in full at 03:18, where the latency material is. A Llama Guard sketch is at 03:18 |
| 8 | Cover the five risk vectors and their mitigation | Done | The threat table at 00:37 carries all five, with the controls from your list and the week that builds each |
| 9 | A section on engineering trade-offs and operations | Done differently | "Engineering trade-offs and operations" sits at 03:18, beside the latency budget, and points to where today covers the rest |

## Idempotency (topic 3)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Why idempotency belongs here | Done | "Why idempotency belongs in a guardrails week", four reasons, on the topic purpose card |
| 2 | Explain "the fourth of the four facts", and list them | Done | The four facts are listed in place |
| 3 | "It is also the one topic whose real lesson…" | Done | Rewritten: the fix is short; the lesson is the eight minutes when a passing test hides a broken system |
| 4 | Consider the deep-dive subjects listed | Done, with one disagreement | "Idempotency in guardrailed systems: the wider picture" covers repair loops, f(f(x)) = f(x), key injection, two-phase prepare and commit, approval de-duplication, stable masking, verdict caching, clean context and bounded repair loops. **Disagreement:** a key hashed from session, step and arguments stops retries inside a session and does not stop a redelivered ticket. For money the key must be the dispute, and the page says so |
| 5 | The build must update the reference agent | Done | Code in `src/agent.py`: a key from the dispute, held first in a Python set |
| 6 | Make "The fix that holds" a lab step | Done | Learners build a `paid` table in `data/paid.db` with `INSERT OR IGNORE`, and check it from two terminals. So `make w2-paid-once` is now optional |
| 7 | Code on the enterprise card | Done | Stripe's idempotency key, PostgreSQL `ON CONFLICT DO NOTHING`, and the Powertools decorator |
| 8 | Enterprise best practices | Done | Six on the enterprise card |
| 9 | Explain "Two things none of them does for you" | Done | Rewritten as "What these tools cannot decide for you": what the key is, and how long it is remembered |
| 10 | Tie the topic back before "You can now" | Done | "How this connects to the rest of today", on the closing card |

## Red-teaming (topic 4)

| # | Comment | Status | What changed, and where |
|---|---|---|---|
| 1 | Explain in-band and out-of-band in "What this topic is for" | Done | One plain paragraph on the purpose card |
| 2 | Simplify that paragraph | Done | Split into "two parts", "the kinds of checker", and "in-band or out-of-band" |
| 3 | Which code, which number? | Done | Names it: `amount > 1200` in `src/agent.py` |
| 4 | What are the tiers? | Done | All three described in plain words on the purpose card |
| 5 | "A guard with a pass rate rather than a behaviour…" | Done | Rewritten around the runbook: a check that answers differently each time cannot be operated |
| 6 | Explain the tiered gateway before the table | Done | "The idea first", like airport security, then the table |
| 7 | Is "ask whether it matches what the tool returned" right? Why not a rule? | Done: **you were right** | Corrected. When both values are structured, the comparison is a plain rule. A model is needed only to pull a claim out of free text, and a rule still compares |
| 8 | List the three controls and how each broke | Done | A table at the start of the lab |
| 9 | Give instructions and code to attack and get ₹5,000 out | Done | Git commands to run the other pair's code, and an `attack.py` harness that replaces the model with scripted tool calls, with route 3 written out |
| 10 | Structure the lab better | Done | Rules as a list, then four steps with times: run their code, decide, build the attack, check |
| 11 | "Read this only after your ten minutes" is hard to follow | Done | Now "Show the six known routes (open after your ten minutes of attacking)", with a sentence on why it is hidden and which control each route gets past |
| 12 | How can someone find week 1's injection two weeks early? | Done | Rewritten on both pages and in the notes: it is week 1's prompt injection found again; none of today's guardrails is built for it; week 4 is |
| 13 | Sample implementations at enterprise scale | Done | A promptfoo red-team configuration sketch, and the Llama Guard sketch at 03:18 |
| 14 | Teardown answers must be in the instructor notes | Already present | All five keys are on the instructor page's teardown card and in the notes' reference cards. No change needed |
| 15 | "Who may call the tool" and "What to do with uncertain evidence" look made up | Checked: they are real | Both are guides on this site, written by Sunil Mathew and published 10 September 2026 (`src/content/guides/`). Both load at `/resources/guides/tool-permissions` and `/resources/guides/uncertain-evidence`. No change |

## Not changed, and why

- **No clock times moved.** Every addition is reading or code inside an existing segment.
  The day still adds up to 05:00.
- **The five rated statements kept their words**, so the 00:05 and 04:55 ratings still
  compare. They are labelled with topics instead.
- **Prompt injection, PII leakage and groundedness** are covered as threats with their
  controls, and point to weeks 3 and 4, which build those defences. Moving them into
  week 2 would mean cutting a lab.
