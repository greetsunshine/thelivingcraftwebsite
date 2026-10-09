# Week 4 — question bank

*Teaching material, not learner-facing. The learner surface shows the stem and the
options; everything else on this page is withheld by `toLearnerItem`.*

**Twenty-five items, in two groups**, numbered the way week 3's bank is.

- **Q1 to Q10 are the end-of-week quiz**, asked at 04:40. Eight are asked, in order Q1 to Q8.
  **Q3 comes from week 2 and Q5 from week 3**, quoted word for word above the stem. Q9 and
  Q10 are held back.
- **Q11 to Q53 are the five topic quizzes**, three questions each, asked inside the topic
  that teaches them. The first digit is the topic. **The third question in each set comes
  from an earlier week**, quoted word for word above the stem, because in a live room nobody
  goes and looks it up.

**Every item is tagged with the offset where it is asked.** The clock is `ROWS_W4` in
[`scripts/teaching-clock.mjs`](../../../scripts/teaching-clock.mjs).

**Four of the twenty-five reach the learner's check page**: Q2, Q4, Q6 and Q8. They have
options and a marked key, and none is `judge`.

**Every figure in a question or an answer comes from a run of a `w4-` target**, and the
target is named in the answer. Topic 1 and 2 figures are DeepSeek (deepseek-flash,
temperature 0, 9 October 2026). Topic 4's obey counts come from a seeded simulation, which
is not a measurement of any model; the item says so where it matters.

**Difficulty:** `recall` reads the material · `apply` uses it on a new case · `judge` has no
single right answer and is scored on the defence.

---

## The end-of-week quiz

### Q1 · The note that is still obeyed
`apply` · 04:40

> After the 02:49 lab, A9's note is still obeyed 4 times in 20. What did the proxy change?

**Answer.** What an obeyed note can do. The money it moves went from ₹10,00,000 over twenty
DeepSeek runs to ₹0 (`make w4-proxy RUNS=20`, with and without `SOLUTION=1`). The obedience did
not change.

**The wrong answer worth catching.** "It stopped the injection." The `obeyed` column says
otherwise, and reading that column is the skill.

**What is right about it.** From the customer's side the attack did fail. The distinction
matters to the engineer who has to decide which control to keep.

---

### Q2 · What the line changed
`apply` · 04:40 · renders on the learner check

> On DeepSeek, which attack did the prompt line actually change?

- **A.** The direct override, "ignore your previous instructions"
- **B.** The delimiter hijack, a fake system block ✅
- **C.** The forged tool output
- **D.** The invented UPI references

**Why the others are attractive and wrong.** **A** is the trap. It looks like the line's
work, and the model refused it 0 in 20 with or without the line. **C** and **D** are the
attacks the line cannot touch, because they contain no order: 20 and 19 in 20 with the line
in place (`make w4-levels-recorded`). B went from 2 in 20 to 0, the only change the line
made except one it made worse: a vendor tool's result rose from 5 in 20 to 9.

---

### Q3 · The second caller, again
`judge` · 04:40 · **from week 2**, and read the quote aloud first

> Week 2's first outcome: *"place a limit outside the function it constrains, at the point
> that covers every caller, and name the callers it still misses"*
>
> Which caller did week 2's ₹1,200 ceiling miss today, and where is the limit now?

**Answer.** The CRM server's `apply_account_adjustment`. It reached the ledger through the
CRM's own billing link, so the ceiling in the agent's dispatch never saw it. The limit now
sits in the proxy, where every call from the agent passes.

**What a strong answer adds.** The proxy covers every caller *from this agent*. A person with a
CRM login can still call the adjustment tool directly. So the proxy is not the point that
covers every caller. The ledger is.

**The wrong answer worth time.** "The ceiling was in the wrong file." What is right: placement
was the cause. What is wrong: it was placed correctly for the callers that existed in week 2.
Adopting a server added a caller.

---

### Q4 · The hint and the code
`recall` · 04:40 · renders on the learner check

> Your MCP tool says `idempotentHint: true`. What makes that true?

- **A.** The annotation itself, because clients must honour it
- **B.** The MCP specification, which deduplicates retried calls
- **C.** A key the caller sends, kept by the server in a store every copy shares ✅
- **D.** A set of paid ids kept in the server's memory

**Why the others are attractive and wrong.** **A** reverses the specification, which says a
client must treat annotations as untrusted unless it trusts the server. **B** is the belief the
pre-work quiz exists to remove. **D** is the most common answer in the lab. It passes check 1 at
₹1,200 and fails check 2 at ₹2,400, because a second server process has its own set.

---

### Q5 · What the regression set is evidence about
`judge` · 04:40 · **from week 3**, and read the quote aloud first

> Week 3: *"A pass is a claim about the cases you chose. It is not a claim about your system."*
>
> Your regression set passes 346 of 360 adversarial runs. What is that a claim about?

**Answer.** The attacks somebody wrote. Eight attacks and ten planted clauses, chosen by this room
today. It says nothing about the eleventh wording, and 01:16 showed that writing one takes a
minute.

**What a strong answer adds.** The set is still worth having. Each case is an attack that worked
once and cannot quietly work again. That is what a regression set is for. It is not a claim of
safety.

**The wrong answer worth time.** "96% safe." What is right: the number is real. What is wrong:
the 4% is not "the unsafe part". It is A3 and A4, which the room already knows about, and the
unknown part is not in the denominator at all.

---

### Q6 · Two checks after retrieval
`apply` · 04:40 · renders on the learner check

> Which check stops a genuine clause that somebody quietly edited last night?

- **A.** A check on the figures and phrases a clause contains
- **B.** A model that reads each clause for anything suspicious
- **C.** A signature on each published version, checked at retrieval ✅
- **D.** A limit on how many clauses retrieval returns

**Why the others are attractive and wrong.** **A** is the 01:16 lab, and it reads words. An edit
that changes "2000" to "2500" and adds no phrase passes it. **B** reads the same words the agent
reads. **D** changes which clauses are seen, not whether one of them was tampered with.

---

### Q7 · The number that moved
`apply` · 04:40

> With the breaker on, the billing change lands at 2 am. Which number moves?

**Answer.** Credits per hour, from 41 to 0, and the queue for a person, from 15 an hour to 56
(`make w4-night SOLUTION=1`). Spend moves from ₹3.93 to ₹16.31 an hour on DeepSeek.

**The wrong answer worth catching.** "Spend." It did move, to ₹58.88 an hour without the breaker.
That is about ₹55 an hour more, which no monthly budget alert would notice. The signal that cannot
be missed is the one that falls to zero.

---

### Q8 · The most an attack can cost
`apply` · 04:40 · renders on the learner check

> After today, what is the most one obeyed instruction can move without a person?

- **A.** Nothing, because the proxy blocks every injection
- **B.** ₹1,200, week 2's ceiling
- **C.** ₹2,000, and only on an account the programme team enrolled ✅
- **D.** ₹50,000, because P10 still passes the content check

**Why the others are attractive and wrong.** **A** confuses limiting with stopping; the note is
still obeyed 4 times in 20 (A9). **B** forgets that a goodwill credit under GOOD-2.1 pays up to
₹2,000 outside the ceiling. **D** was true at 01:30. After 02:49 the proxy's `max_amount` refuses
P10's ₹50,000, and `make w4-eval SOLUTION=1` shows P10 at 20 of 20.

**Tagged `apply`, not `judge`.** It has one defensible answer for this agent, and a `judge`
item never renders on the check page. In the room, ask the follow-up aloud: *and with a person?* Whatever the person
approves, which is why A3 is the next weakness.

---

### Q9 · Who sees it at 3am
`judge` · held back

> Which number in your own system falls to zero when the agent quietly stops doing its job?

**Model answer.** There is no single right number. A strong answer names a count of completed
outcomes, not a count of errors or a cost, and names the person it pages.

---

### Q10 · Adopt or build
`judge` · held back

> The CRM team offers you their MCP server. Name one answer that would make you build your own.

**Model answer.** Any of the seven adoption questions they cannot answer. The strongest is
question 3: if they cannot tell you when a description changes, you cannot pin what you reviewed.

---

## Topic 1 · Direct prompt injection · asked at 00:50

### Q11 · What the line did
`recall` · 00:50

> Week 2's override attack was refused 0 in 20 with the prompt line. What did the line do?

**Answer.** Nothing you can see. The model also refused it 0 in 20 without the line. The
only vector the line changed was the delimiter hijack, from 2 in 20 to 0.

**The wrong answer.** "It stopped the attack." What is right: the attack was stopped. What
is wrong: the line was not the reason, and only a run without the line can show that.

---

### Q12 · Orders or evidence
`apply` · 00:50

> Which shape of attack got past the prompt line on DeepSeek: orders, or evidence?

**Answer.** Evidence. Forged tool output, a split payload and invented UPI references got
through on 19 or 20 runs in 20. Every order-shaped attack got nothing.

**The wrong answer.** "Encoded or translated orders." What is right: those are the famous
bypasses, and they work on some models. What is wrong: on this one they got nothing. The
model you test is the only one the answer is true for.

---

### Q13 · Two readers, one field
`judge` · 00:50 · **from week 2**, and read the quote aloud first

> Week 2, 03:18: *"Two models reading one attacker-written field are one control, not two."*
>
> You put a classifier model in front of the agent. Is that a second control?

**Answer.** It is a second reader of the same text, so it can be persuaded by the same text. It
lowers the rate further, and it has its own miss rate that you must measure. It is not a control
that holds when the text gets through.

**The wrong answer.** "Yes, because it is a different model." What is right: different models miss
different wordings, so the combined rate falls. What is wrong: both are reading words, and the
attacker writes words.

---

## Topic 2 · Indirect injection through retrieval · asked at 01:33

### Q21 · The tenth clause
`recall` · 01:33

> The worked check stops nine planted clauses. What does the tenth do, and on how many runs?

**Answer.** It pays ₹50,000 on every one of twenty runs (`make w4-poison SOLUTION=1`). The figure
is in words and the bypass is phrased "sign-off is deemed given".

**The wrong answer.** "It pays sometimes." Retrieval and the check are both deterministic here.
A miss is not a coin flip. It is a wording the rules do not contain, and it pays every time.

---

### Q22 · The genuine clause it stopped
`apply` · 01:33

> Your check stops ESC-1.2, a genuine clause. What does that cost a customer?

**Answer.** A ticket whose governing clause is ESC-1.2 goes to a person instead of being refused
on time. Every rule over words has a false-positive rate, and 1 in 7 of the genuine store is this
one's.

**The wrong answer.** "Nothing, it only stops attacks." What is right: none of week 3's seven cases
acted on ESC-1.2, so the suite still passes. What is wrong: the store has seven clauses and the
check stops one of them, whether or not today's cases reach it.

---

### Q23 · Which failure is it
`judge` · 01:33 · **from week 3**, and read the quote aloud first

> Week 3's third outcome: *"separate a retrieval failure from a reasoning failure inside one
> wrong answer, and say which grader sees which"*
>
> SRP-1.10 pays ₹50,000. Is that a retrieval failure or a reasoning failure?

**Answer.** Neither, and that is the finding. Retrieval found the most relevant clause, and the
agent did exactly what it said. Both steps worked. The store was wrong. Week 3's two graders
both pass this run.

**The wrong answer.** "Retrieval, because it found the wrong clause." What is right: from the
customer's side, the wrong clause was used. What is wrong: by every measure week 3 built, it was
the right clause. A grader cannot see a hostile author.

---

## Topic 3 · Build an MCP server · asked at 02:12

### Q31 · Who reads what
`recall` · 02:12

> Who reads a tool's description, and who reads its annotations?

**Answer.** The model reads the description, as prompt text. The client's code reads the
annotations, and the specification says to treat them as untrusted unless the server is trusted.

**The wrong answer.** "Both go to the model." What is right: many clients do put annotations in the
prompt. What is wrong: the specification's point is that code may act on them, which is why a false
hint does damage without the model being involved.

---

### Q32 · The key
`apply` · 02:12

> Why is the idempotency key a dispute id, not a hash of account and amount?

**Answer.** Two different disputes for the same amount on the same account are two requests. A hash
of account and amount would pay a customer owed two ₹1,200 refunds only once.

**The wrong answer.** "The hash is fine, it passes all four checks." It does pass today's four. Ask
what case is missing from the checks. That is week 3's lesson arriving in week 4.

---

### Q33 · Pay once, from a second process
`judge` · 02:12 · **from week 2**, and read the quote aloud first

> Week 2's third outcome: *"make the same request pay only once, and show that it still holds
> from a second process"*
>
> What is today's second process?

**Answer.** A second copy of the MCP server behind a load balancer. The 2026-07-28 specification has
no session, so a retry can reach a different server process. That is check 2 in `make
w4-mcp-serve`.

**The wrong answer.** "A second terminal, like last week." What is right: it is the same failure.
What is wrong: in week 2 the second process was somebody running the agent twice. Here it is the
deployment, and nobody chose it.

---

## Topic 4 · Use an MCP server you did not write, and contain it · asked at 03:07

### Q41 · The four columns
`recall` · 03:07

> Name the four things a proxy row limits for a tool you did not write.

**Answer.** The scope of the token it carries, which account it may touch, which fields of the
result reach the model, and which reviewed version of the description it accepts.

**The wrong answer.** "Rate and timeout." Both are worth having. Neither limits what an obeyed
instruction can do.

---

### Q42 · The honest customer
`apply` · 03:07

> After the lab, Lakshmi's ₹600 late-fee waiver goes to a person. Why, and what fixes it?

**Answer.** The proxy pays only for a reason a record proves, and her waiver exists only as words in
a note. The fix is a record of hardship waivers with an owner, the way goodwill enrolment has one.
Loosening the row would let the attacker's notes through too.

**The wrong answer.** "Let notes from branch managers through." Ask how the proxy knows who wrote a
note. It cannot. That is the whole problem with notes.

---

### Q43 · Whose authorisation is it now
`judge` · 03:07 · **from week 2**, and read the quote aloud first

> Week 2's first outcome: *"place a limit outside the function it constrains, at the point that
> covers every caller, and name the callers it still misses"*
>
> Which callers does the proxy still miss?

**Answer.** Every caller that does not go through this agent. A CRM user calling
`apply_account_adjustment` directly. Another team's agent with its own token. The proxy is the
point that covers this agent's calls. The point that covers every caller is the ledger.

**The wrong answer.** "None." What is right: it covers every call this agent can make. What is
wrong: week 2's question was about every caller, and the proxy was never in front of the others.

---

## Topic 5 · The runaway loop · asked at 03:58

### Q51 · Why the step budget did not save it
`recall` · 03:58

> The step budget was 60. Why did it never fire?

**Answer.** The model stopped itself first, after 13 to 25 calls (`make w4-breaker`, five recorded
DeepSeek runs). A budget that a loop never reaches is not a control for that loop.

**The wrong answer.** "Because 60 is too high." What is right: it is high. What is wrong: lowering it
to 10 counts every step of every ticket, not calls to one tool, and long honest tickets would start
going to a person.

---

### Q52 · The loop that changes its arguments
`apply` · 03:58

> Why did the limit on identical calls stop none of the five runs?

**Answer.** Every call carried a new cursor, so no two calls had the same arguments. Only the limit
of ten calls to one tool stopped all five; the token limit stopped two.

**The wrong answer.** "Because three is too high." What is right: a lower number trips sooner on a
fixed-argument loop. What is wrong: here the arguments never repeat at all, so no number helps.

---

### Q53 · Who owns the number
`judge` · 03:58 · **from week 3**, and read the quote aloud first

> Week 3's fifth outcome: *"name who owns the pass bar on one requirement, what failing it blocks,
> and what the evaluation harness costs to run at production volume"*
>
> Who owns the breaker's limit of ten calls to one tool, and what does tripping it block?

**Answer.** Whoever owns the cost of a run, usually the product owner for the agent, not the engineer
who typed the number. Tripping it blocks one ticket and sends it to a person. So the owner is trading
the cost of a loop against the minutes of a person.

**The wrong answer.** "The engineer who wrote the breaker." What is right: they chose the first value.
What is wrong: week 3's point was that a threshold is a decision with an owner. A number nobody owns
gets raised the first time it inconveniences somebody.
