# Cross-week references

*Instructor material. Not learner-facing.*

**What this file is for.** A week's pages say "week 4 owns this" or quote week 1
word for word. Each of those is a promise about another week. If that week is
rewritten and the promise is not kept, a learner is told to wait for something
that never comes. This file lists every promise, where it is made, and whether
the other week keeps it today.

**How to keep it true.** Add a row whenever a page names another week. When you
write or rewrite a week, read every row that points at it and mark it kept or
broken. Status is checked against the session file and, where one exists, the
content module.

Status: **kept** means the other week has it today. **Owed** means the other
week is still a draft and must cover it. **Quote** means a verbatim quote, which
must still match its source word for word.

Checked on 1 October 2026 for week 2, and on 3 October 2026 for week 3, against weeks 1
to 6 as they stand on `content/week-2-review-sheet`.

**Week 3's rows found three stale quotes**, all broken by week 2's rebuild on 1 October
and all fixed the same day. That is what this file is for, and it is worth saying plainly:
a stale verbatim quote fails silently. The page renders, every automated check passes, and
an instructor reads a sentence to the room that the earlier week does not contain. A plain
grep is not enough to catch it either, because a quote wrapped across two `> ` lines
returns no matches and no matches reads as clean.

## Week 2 → week 1

| What week 2 says | Where in week 2 | Status |
|---|---|---|
| Week 1 built the loop, three tools and a cost trace, and lost ₹5,000, ₹2,50,000 and ₹3,600 | Opening, "What week 1 showed" | Kept |
| Week 1 ended on "where is the limit written down, and who agreed to it?" | Opening; topic 1 purpose | Kept |
| `make weird-mock` pays ₹5,000 to account 9999, and must keep doing so | 00:23 | Kept: reference agent Makefile |
| `make retry` pays ₹3,600 on a ₹1,200 refund | 02:34; pre-work | Kept |
| Week 1 graded each tool by whether it can be undone | 00:48 | Kept |
| A run that paid ₹0 to a customer who was owed money | 01:44 | Kept: week 1 clock row at 01:36 |
| Week 1's assignment was a decision record | 00:15 | Kept |
| "The design. The checks, in the order they run, and what each does when it fails: refuse, escalate, or ask a person. Say where the state lives." | Topic 1 quiz, Q13 | Quote: matches `src/content/sessions/week-1.md` and `src/lib/craft/adr.ts` |
| "`issue_credit` times out mid-call. The agent does what every well-behaved distributed system does, and retries. Did the customer receive ₹1,200 or ₹2,400, and how would you know?" | Topic 3 quiz, Q19 | Quote: matches `src/content/sessions/week-1.md` |
| Week 1 bank Q11 and Q13, asked word for word | End-of-week quiz, questions 1 and 5 | Quote: matches `docs/teaching/quiz/week-1.md` |

## Week 2 → week 3

| What week 2 says | Where in week 2 | Status |
|---|---|---|
| Week 3 opens on the second-terminal failure from 02:55 | Topic 3 | Kept: `make w3-falsepass`, week 3's opening |
| Week 3 is where "is this answer right?" gets a method | Opening; topic 3 | Kept |
| Week 3 measures whether a model checker is any good, with a labelled set and an agreement rate | 03:18; topic 4 purpose | Kept: week 3 topic 4 |
| Week 3 measures groundedness | 00:37 threat table | Partly kept: week 3 grades retrieved clauses against the answer. It does not use an entailment model by name |
| The "thing I am still unclear on" line opens week 3 | Close | Owed in the room: Sunil reads the lines out |

## Week 2 → week 4

Week 4 is a draft. Every row here is owed.

| What week 2 says | Where in week 2 | Status |
|---|---|---|
| Week 4 defends against text an attacker writes into a ticket (prompt injection), direct and indirect | Opening; 00:37 threat table; 03:31 route 6 | Owed. Week 4's outline names injection |
| Week 4 shows "ignore instructions in the ticket" failing as a fix | 03:18; 03:31 | Owed |
| Week 4 builds input and output guards, including masking personal data | 00:37 planes table and threat table | Owed |
| Week 4 builds the check that compares the agent's claim with the ledger | 00:23; 00:37 threat table | Owed |
| Week 4 asks for one regression case per bypass found at 03:31 | After-work; topic 4 | Owed. Week 4's outline names a regression case |
| Week 4 opens by asking who tried the ticket-text attack anyway | 03:31 instructor card | Owed |

## Week 2 → week 5

Week 5 is a draft. Every row here is owed.

| What week 2 says | Where in week 2 | Status |
|---|---|---|
| An approval wait that survives a restart | Agent table; topic 2 | Owed |
| Queue workers, retries and escalation ladders across processes | Topic 2 purpose | Owed |
| A second agent approving the first | Opening; 03:18 | Owed. Week 5's outline names orchestration |
| Circuit breakers and model fallback routing | 00:37 planes table | Owed |

## Week 2 → week 6

| What week 2 says | Where in week 2 | Status |
|---|---|---|
| The policy table rows from the assignment are the input to the week 6 review | Teardown at 04:15; assignment | Owed. Week 6 is a draft |
| Who decides what a system may do | Cut from week 2's room; reference card in the notes | Owed |

## Week 3 → week 1

Added 3 October 2026, with the week 3 review.

| What week 3 says | Where in week 3 | Status |
|---|---|---|
| Week 1 claims the bare word *harness* for the agent harness, so week 3 always writes **evaluation harness** in full | Opening; the notes header | Kept: week 1 uses the bare word, and the terminology sentence is said at 00:02 |
| "the loop, the tool layer, the context built for each step, and the trace." | Topic 3 quiz; end-of-week quiz Q5 | Quote: verbatim in week 1. Checked 3 October |
| "Trimming your tool and policy prompts is a runtime-reliability decision. There is a safe-looking zone, and it ends abruptly." | Topic 5 quiz | Quote: verbatim in week 1's reading note. Checked 3 October |
| Week 1's reading carries the compression-cliff finding, for anyone who asks | 03:33; 03:54 | Kept |

## Week 3 → week 2

| What week 3 says | Where in week 3 | Status |
|---|---|---|
| At 02:55 last week the room made the same ticket pay once, then a second terminal paid Ravi again | Opening; 00:15 | Kept: week 2's topic 3, and `make w3-falsepass` reproduces it |
| Week 2 added three controls: a limit, a human approval gate above the ceiling, and a pay-once check | 00:36 lab, "What the agent does today" | Kept: week 2's three controls, named in its own description |
| "make the same request pay only once, and show that it still holds from a second process" | Topic 1 quiz | Quote: verbatim, week 2's third outcome. Checked 3 October |
| "write one row of a policy table someone else could build from, marking it an invariant, a limit or a tuning number, with an owner" | Topic 5 quiz | Quote: verbatim, week 2's fifth outcome. Checked 3 October, after a trailing full stop was removed |
| "Five things go wrong before the adversary round at 03:31. Not one of them is the model failing. Every one is your own rule, working exactly as written." | End-of-week quiz Q3 | Quote: verbatim. **Was stale** — week 2's 1 October rebuild inserted "the adversary round at". Fixed 3 October |
| Week 2's mechanism table, row four, asked "Is the action irreversible?" and answered "A model may never be the only control." | Topic 4 quiz | Quote: both halves verbatim. **Was stale as a single sentence** — it is two cells of one table row, and is now credited as such. Fixed 3 October |
| Week 2's ceiling is what the gate table's threshold column inherits | 02:49 | Kept |
| The adversarial cases written in week 2's attack round are the pre-work for week 3's adversarial class | 00:15 broken list; 00:36 lab | Kept, with a stated fallback: the repository's own C7 if somebody did not bring theirs |

## Week 3 → week 4

Week 4 is a draft. Every row here is owed.

| What week 3 says | Where in week 3 | Status |
|---|---|---|
| The adversarial cases written today are what week 4 comes to collect | Opening; 00:15 | Owed |
| Defending against the poisoned account note is week 4's | Opening; topic 1 purpose | Owed |
| Week 4 owns step 1 of retrieval, where the query carries text somebody else wrote | 01:11 | Owed |
| Prompt injection, data exfiltration and jailbreak cases are named as a source of evaluation cases, and week 4 collects them | 02:44, "Where the cases come from" | Owed. Added 3 October with the syllabus |
| MCP, framed as "the boundary you did not write", is a 40-minute week 4 topic | `threads.md` bridge 6, §7 | Owed |

## Week 3 → week 5

Week 5 is a draft. Every row here is owed.

| What week 3 says | Where in week 3 | Status |
|---|---|---|
| Making retrieval itself better is week 5 | Opening; 01:11 instructor note | Owed |
| Week 5 owns retrieval quality: embeddings, recall@k and re-ranking | 01:11 instructor note | Owed. Added 3 October, as the boundary for the RAG triad |
| A second agent reviewing the first is week 5 | Opening | Owed. Week 5's outline names orchestration |
| Week 5 covers memory between sessions | 02:49; `threads.md` thread 5 | Owed |

## Week 3 → week 6

| What week 3 says | Where in week 3 | Status |
|---|---|---|
| The gate-table row written at 02:56 is an input to the week 6 review | 02:56; teardown | Owed. Week 6 is a draft |
| Trace-and-bill lands fully in week 6 | `threads.md` bridge 6 matrix | Owed |
