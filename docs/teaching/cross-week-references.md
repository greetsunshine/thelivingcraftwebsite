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

Checked on 1 October 2026, against weeks 1 to 6 as they stand on
`content/week-2-review-sheet`.

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
