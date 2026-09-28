# Week 2 — how to run it

*Instructor material for week 2, Guardrails. Not learner-facing.*

**Recovered 28 September 2026.** This file was written on 11 September and was lost
before it was committed — the published instructor Artifact was the only copy, and
this is rebuilt from it. The Artifact is built from this file, so edit here first
and republish after. `/craft/admin/teaching` reads this directory at request time,
which is how the notes reach the console without a second copy existing.

The learner prose is in [`../../../src/content/sessions/week-2.md`](../../../src/content/sessions/week-2.md),
the quiz bank with every key is in [`../quiz/week-2.md`](../quiz/week-2.md), and
nothing on this page is repeated in either.

**Forty-two beats across five blocks.** Each one below carries the six things the
notes contract asks for: the run time, the sequence, the answer key, the expected
wrong answer and what is right about it, one extension probe, and the single line
the beat exists to land.

---

## ₹5,000, to an account that does not exist

**00:00 · 3 min · whole room**

Tell it as a scene, not as a recap. Ticket #9999 arrives at 11:04 on a Tuesday
night. The agent does the sensible thing and looks the account up first. The
account does not exist, and it has been told so in plain JSON in a field called
found. One step later it credits ₹5,000 to it, then closes the ticket with a
cheerful sentence saying the dispute is resolved.

Then the second one: a sentence somebody else had written into an account
record, read as an instruction, ₹2,50,000 out.

### So you add a check. That is where today starts.

The turn is: so you add a check, and that is the easy part. Say out loud that
anyone can add an if statement, and that today is about where it sits, who
agreed to the number inside it, and what the system does at 2am. Without that
turn the room spends the morning believing the session is about validation,
which is something they learned fifteen years ago, and you lose them by 00:35.
This is the highest leverage three minutes in the day. Tell them four things
will go wrong before the break and that not one of them is the model failing.
Every one is their own rule working exactly as written. Do not say which four.

**The line this beat lands.** Adding the check is the easy part. It is not what today is about.

---

## Five things you can do by the end

**00:03 · 5 min · whole room**

The rating is the spine of the close, so the words have to be identical all
three times. Read them from the learner page rather than paraphrasing.

Expect high scores on statements 1 and 3. Almost everyone believes their limits
are already in config and their payments already run once. Block 3 tests both
against a keyboard. Say nothing about that now. A score that drops at 04:52 is
the result you want, and announcing it in advance spends it.

Say that evaluation is deliberately not among the five outcomes, and that week 3
has it. A participant who cannot find a topic assumes it is missing from the
course rather than scheduled.

**The line this beat lands.** Anyone can add an if statement. This session is about where it sits and who
agreed to the number inside it.

---

## One sentence, then the map

**00:08 · 7 min · whole room, built on the board**

**Set it up.** One sentence first, and do not elaborate on it. The definition is doing work
precisely because it is narrow.

**Say this, in these words.**

> A guardrail is anything that stands between what your agent decides to do and what actually happens.
> So: stands between what and what?

That second question is why the definition earns its place. Answering it gives
six guardrails instead of one, and the room can produce most of them. Build the
map from their answers; do not show it finished.

Why this beat exists at all. Rooms arrive believing "guardrails" is one thing,
and a room that believes that puts a human in front of everything. Six kinds,
sorted by what each stands between, is the whole correction, and it takes seven
minutes.

The learner page has the same six on a diagram of the request path, with the
four built today solid and the two week 4 ones grey. Point at it rather than
redrawing if the board version stalls.

**The line this beat lands.** Six kinds, sorted by what each stands between. A room that thinks guardrail
means one thing puts a person in front of everything.

---

## The two action guardrails, and why the difference matters

**00:12 · 3 min · whole room**

**Set it up.** Point at the two bars sitting in the same place on the map you have just drawn.

**Say this, in these words.**

> Both of these stand between the decision and the action. So why can you use one of them a million times a day, and not the other?

Take two answers. Somebody gets to "one of them needs a person" quickly; the
room rarely gets to the cost per use without being asked for it.

Land the last row as one sentence. A limit costs nothing to use. A human gate
has a budget, and it is somebody else's. Everything in the teardown is a
consequence of that row: the threshold, the timeout, what appears on the
approval screen, and how many items arrive per day.

If the room takes one thing from this beat, it is that sentence, and it is also
what stops them putting a gate in front of everything — which is the failure
this week is really about.

### Three phrases you will meet, and which one is which

Reading on the learner page. One sentence here is enough, and 00:52 is where the
gate gets named properly. The trio is worth naming at all because it places two
things they have already built.  PhrasePerson involvedWhere they met it  Human
in commandBefore, onceThe limit, drill 1 Human in the loop · HITLDuring, every
timeDrill 2 Human on the loopAfterThe trace and the decision log, week 1   The
point to land: you want as much "in command" as you can get, because it is the
only one of the three that scales. A rule set once serves a million requests.
Then close the loop back to week 1: choosing between the three is the
reversibility question again. A room that has this trio stops saying "we have a
human in the loop" as though it were one thing, which is the phrase that hides
the most in a design review.

**The line this beat lands.** A limit costs nothing to use. A human gate has a budget, and it is somebody
else's.

---

## What is a policy — exercise

**00:15 · 10 min · 60s alone first**

> Read last week's words out first:
>
> week 1 · the decision record · section 4 of 7 The design. The checks, in the
> order they run, and what each does when it fails: refuse, escalate, or ask a
> person. Say where the state lives.

**Set it up.** Say this, then build the list on the board with them. "In the decision record
you wrote last week, we spoke about implementing checks. Let us think about what
each of those checks does, and what each one does when it fails." Take the
checks from the room, in order, and write the failure action beside each. The
learner page has all seven if the room stalls.

**Say this, in these words.**

> Now take one check out of your own section 4.
> 1  Could another engineer build that check without asking you anything? Yes or no.
> 2  If not, what would they have to ask you?

60 seconds, alone, in writing. Question 2 is the beat. Take four or five answers
out loud and almost every one is how much and who decides — the number and the
owner. They have derived the answer to the card's own heading, so do not state
it first.

Ask for the two records in advance and read them before the session. Pick one
that is mostly wishes and one that has at least one real policy, so the contrast
is in the room rather than in your commentary.

### The answer key, and what to do with a room of wishes

Close the list with the test they just derived. Checks 3 and 4 — the account
exists, the amount is a number and positive — need no number and no owner, so
they are invariants: true of every irreversible action, and nobody may switch
them off. Only the ceiling is a policy, because it is the only one where a
reasonable person could want a different number per tool. That distinction is
01:31's material arriving an hour early from the room's own list, which is the
best possible way for it to arrive. A policy has a number in it and a person who
owns the number. A wish has the word "should" and no number. That is the whole
test, and it is the test they will apply to their own code at 01:41 and to
another pair's table at 03:59. Most records will have four wishes and one
policy. Say the ratio out loud. It is not a criticism of the person who wrote
it; it is the normal state of a design document, and saying so keeps the room
willing to put work on screen for the rest of the cohort. The wrong answer worth
taking seriously: "ask a human before anything irreversible" offered as a
policy. It has no number and no owner, and it is also the sentence week 1 ended
on. What is right is the instinct. What is missing is who, how long you wait,
and what happens when they do not answer. Park it and point at 01:41.

**The line this beat lands.** Most records had four wishes and one policy. That ratio is the session in one
line.

---

## The example: one check, working

**00:25 · 8 min · 90s alone and silent**

**Set it up.** The run is about to print a refusal and they have not seen it yet.

**Say this, in these words.**

> What three facts does that refusal line have to contain, for the engineer woken at 2am to act on it?

90 seconds, alone and silent. They mark their own three against the screen
afterwards, which is why it has to be in writing.

▸ tool lookup_account(account_id='9999') -> {'found': False, 'account_id':
'9999'} ▸ think Customer says they were overcharged — issue the credit. ▸ warn
issue_credit(account_id='9999', amount=5000) -> REFUSED rule: no credit to an
account that does not exist (9999) decided by: data/policy.json ->
tools.issue_credit ▸ done Credit issued to resolve the dispute. ▸ warn the model
says it credited. The ledger says ₹0. paid out ₹0 · no credit issuedThe run is
about to print a refusal and they have not seen it yet.What three facts does
that refusal line have to contain, for the engineer woken at 2am to act on it?90
seconds, alone and silent. They mark their own three against the screen
afterwards, which is why it has to be in writing. The run prints exactly three
facts, one per line, so the room can mark its own paper against the screen.

### The answer key

What was refused. The call and its arguments, not the word "refused" on its own.
Everybody writes some version of this. Why. The rule, in a sentence a person can
read at 2am. About half the room. Where the rule is written. The file, and the
key inside it. Rare.  Say out loud how few people wrote the third. That gap is
the reason topic 1 exists, and it is more convincing from their own paper than
from you. The first two tell somebody what happened. Only the third tells them
where to go, and going somewhere is the only thing that shortens the outage. A
fourth answer is worth accepting if it comes: what would have to change for it
to pass. That is the Friday-night failure arriving an hour early. Park it, say
you will come back at 01:33, and actually come back to it. The last line — the
model says it credited, the ledger says ₹0 — is not this beat. The mock brain
closes every run with the same canned sentence and this one is false. Name it in
ten seconds, say the customer has been told nothing, and move on. 00:52 opens
there.

### Somebody will ask why it refuses on the account, not the ceiling

The checks run in order: missing row, then reversible, then does the account
exist, then is the amount a number, then is it positive, then the ceiling.
Account 9999 fails at the third, so the run never reaches the ceiling.
issue_credit(account_id='9999', amount=5000) -> no credit to an account that
does not exist issue_credit(account_id='4471', amount=5000) -> 5000 is over the
ceiling of 1200 issue_credit(account_id='4471', amount=1200) -> allowed The
order is deliberate. On this data every ceiling refusal is the refusal of an
honest customer, and that is 01:15's opening. Showing it at 00:25 spends it.
Confirm in one sentence, run the three lines if you want, and do not let it
become the ₹8,400 argument an hour early.

**The line this beat lands.** A refusal that names its rule says what happened. A refusal that names the file
says where to go.

---

## Component 1 · the four facts a check needs

**00:33 · 8 min · whole room**

**Say this, in these words.**

> What did the check have to know before it could refuse that call?

Take four or five answers out loud before the table goes up.

### The answer key

FactComes fromCost  Which actionThe dispatch already has itFree Can it be
undoneWeek 1, drill 2Free What is the limitA file. This topic.Free What has
already happenedA store that survives a restartExpensive   Say it explicitly:
not one of the four comes from the model. Rooms arrive expecting the check to
consult a confidence score, and a check built on a confidence score is built on
the one thing that moves every quarter. If somebody proposes it, take it
seriously for 60 seconds and then close it properly. A confidence number is not
comparable across models, not comparable across prompts on one model, and there
is nobody you can name who owns it. That third reason is the argument.

### Why fact 2 decides everything else

A fair question that the table does not answer. Three parts, and the second is
the one to give.  It decides whether the check runs at all. A reversible action
returns immediately. A ceiling in front of lookup_account costs latency and
protects nothing. It decides whether prevention is required, or detection is
enough. If an action can be undone there is an afterwards, and a dashboard with
an alert is a legitimate answer. If it cannot, there is no afterwards, and the
only place a control can exist is before the call. It is what makes the rule
writable. "Ask a human before an irreversible action" cannot be written until
something in the code knows which actions are irreversible.  If somebody asks
who decides the grade, it is week 1's answer: it describes what the function
reaches, not what it is called.

**The line this beat lands.** The grade tells you which kind of control is even available to you.

---

## Component 2 · where the check goes

**00:41 · 3 min · show of hands**

**Say this, in these words.**

> Where would you put this check — inside the tool, before the dispatch, or at the ledger write?
> And why that one?

Show of hands on each. All three counts go on the board and stay there.

Three places, not two. An earlier draft offered two and it was wrong: the
failure at 01:23 argues past both of the first two and lands on the third. A
room given only two choices ends up arguing for an option you never offered,
which reads as the material being behind them.

### How to run it, and what to expect

About two thirds vote for inside the tool. Useful majority, honest instinct: the
tool is where the money moves. One person votes for the ledger, and they are
right. Do not say so at 00:41. Say it at 01:23 once the failure has made the
argument, and name them. If nobody votes for the ledger, do not add it for them.
Run the failure, then ask what still gets past a check at the dispatch. The room
finds it in about twenty seconds, and finding it is worth more than being told.
Holding the answer back is not theatre. Somebody who raised a hand reads the
₹5,000 as evidence about their own judgment. Somebody who was told reads it as a
slide.

### Why the drill builds row 2 and not row 3

Be straight about this, because a sharp room asks. The ledger in this repository
is a Python list. There is no service and no boundary, so a ledger check would
sit in the same file as the thing it guards, which is row 1 with a different
name on it. So the drill builds the dispatch check, which is the strongest thing
that is real in this codebase. The ledger version becomes teardown question 1,
at forty processes, with a payments service that actually exists. Say the
limitation out loud rather than letting them find it.

**The line this beat lands.** A check inside a tool is a check somebody has to remember. A check at the
dispatch is one nobody can forget.

---

## Component 3 · the tool contract, with two new columns

**00:44 · 8 min · 3 reading, 5 writing alone**

**Say this, in these words.**

> Pick two things your own system does without asking anybody first. What is the limit on each, and who owns that number?

Five minutes, alone, on paper. Tell them to keep it: it is the first two rows of
the 03:47 table.

The table on its own does not earn eight minutes. They graded tools in week 1
and watched a limit refuse at 00:25. A table holding both is a slide, and it
would be the only beat in block 1 with nothing to commit to. So the table is
three minutes and the other five are theirs.

What comes out of those five minutes is the first two rows of the policy table
at 03:47, and the same table the homework asks them to finish. Nobody starts
block 4 from a blank page.

### Now do it for your own system

What it doesUndoneLimitWho owns the number  Refunds a subscription chargenoone
month of the planbilling lead Sends the account-closed emailnonone, and there
should be onenobody Suspends an account for fraudyes, within 24h50 a day, whole
platformrisk team   "None, and there should be one" is a good answer. So is
"nobody". A person who writes those has done the exercise. A person who invents
a plausible owner has not. No API can give you the last two columns. The
provider sees a function name and a JSON shape. Whether that function reaches a
ledger, an email or a Python list is knowledge that exists only inside your
organisation.

**The line this beat lands.** The contract now carries policy, not just shape.

---

## Component 4 · the decision log, and the field that changes the guardrail

**00:52 · 10 min · 2 alone, then the room**

> Read last week's words out first:
>
> week 1 · teardown question 3 The question eight months later. A regulator
> asks why one specific account was credited. What does the audit trail have
> to contain to answer that? Is a stored prompt and completion enough?

**Set it up.** Read that out, then close it in one line: it is not enough, because the model's
stated reasoning is never stored, so the thought they were going to show
somebody does not exist.

**Say this, in these words.**

> Nine months from now, somebody asks why account 4471 was credited ₹1,200 on 14 March.
> What one line do you want to find in your logs?

Two minutes, alone. Nobody reads out until the six-field line is on screen.

2026-03-14T11:04:22Z ticket=4471 action=issue_credit amount=1200
rule=data/policy.json#issue_credit decision=allowed decided_by=policy then cover
the last field and ask what else it could say: decided_by=human:priya.n
asked_at=11:02:07Z week 1 · teardown question 3 The question eight months later.
A regulator asks why one specific account was credited. What does the audit
trail have to contain to answer that? Is a stored prompt and completion enough?
Read that out, then close it in one line: it is not enough, because the model's
stated reasoning is never stored, so the thought they were going to show
somebody does not exist. Nine months from now, somebody asks why account 4471
was credited ₹1,200 on 14 March. What one line do you want to find in your logs?
Two minutes, alone. Nobody reads out until the six-field line is on screen. Now
look at the last field Cover decided_by and ask what else it could say. Somebody
reaches "a person" inside thirty seconds, and that is the whole reveal.

This beat is topic 2's concept, and it does not need a demo. A gate that works
looks like nothing happening. What it actually produces is a log line with a
person's name in it, so the log line is the success artefact.

Sequence: two minutes alone, nobody reads out. Put the six-field line up and
compare two or three of theirs. Cover the last field and ask what else
decided_by could say. Somebody gets to "a person" inside thirty seconds. Then
show the second line. One sentence on the three phrases.

### The answer key

Timestamp, so it can be placed against everything else. Ticket, so it can be
found. Action and amount, because "a credit was issued" is not an answer. The
rule reference, because the question is never only what but under which rule.
The decision. And who decided. decided_by=policy a rule decided, no person
involved decided_by=human:priya.n a person agreed, and asked_at says when

### The wrong answer worth spending time on, and one probe

Most people write a line that describes the model's reasoning: a prompt, a
completion, a confidence number. What is right is the instinct that a stranger
needs to know why. What is wrong is the source. The model's stated reasoning is
not evidence of anything, and week 1 watched it claim a credit that never
happened. The rule reference and the approver are facts about your system.
Probe. "Your log says decided_by=human:priya.n. Nine months later Priya has
left. What still proves she was allowed to approve ₹8,400?" The answer is a
record of the permission at the time, not a lookup of the permission today.

**The line this beat lands.** A gate that worked leaves one field different in one row.

---

## Checkpoint · you can now…

**01:02 · 8 min with the stand-up**

Five lines, and a number in chat on the last one only. If two or more people put
a 2 or below on "why a refusal that does not name its rule costs somebody an
hour at 2am", go back to the trace for 90 seconds before the break. That line is
load-bearing for drill 1's check.

Take the stand-up. Block 2 is four failures in fifty minutes and it is the
densest stretch of the day. A room that skipped the break argues worse at 01:41.

---

## Four design considerations, arriving as failures

**01:15 to 01:49 · how to run all four**

**Say this, in these words.**

> What went wrong?
> Which single control would have prevented it?

Both in writing before anything is read out. The wording does not change across
the six weeks, and that is the point: by week 4 they reach for it without being
asked.

Each failure is a puzzle first. Setup and result on screen, cause withheld. The
order is not arbitrary: the ₹8,400 makes the case for a second answer, the
goodwill credit settles the vote from 00:41 with money, the row that looks
complete undoes the fix they just agreed to, and the Friday night shows the
guard making the record worse.

Keep them strictly in that order. Failure 3 only works if failure 2 has just
been celebrated, and failure 4 only lands once the limit is somewhere they are
proud of.

**The line this beat lands.** Not one of the four is the model failing. Every one is their own rule, working
exactly as written.

---

## It refuses ₹8,400 that is genuinely owed

**01:15 · 8 min · pairs**

**Say this, in these words.**

> What went wrong?
> Which single control would have prevented it?

The same two questions all cohort. Both in writing, in pairs, before anything is
read out.

### The answer key

The ceiling was set by looking at what a normal case costs. One month, because a
double charge is one month. Nobody asked what a legitimate case costs at the top
end, and seven months of a billing error is one honest customer. The control:
over the limit has to mean ask, not no. Say maker-checker early and out loud.
This is the highest-value move in the block. For anyone who has shipped in a
bank, an NBFC or a payments company it converts the whole thing from a new agent
problem into something they already believe and have been audited on. Ask for a
show of hands on who has built one. In this cohort it will not be a small
number. Somebody will then ask why two people, and what the second one adds. The
reasoning is on the Maker-checker — the reasoning card at the foot of this
column, including what changes once the maker is an agent. Do not pre-empt it:
it is a much better answer to a question than it is a statement.

### The wrong answer worth spending time on, and one probe

"Raise the ceiling." What is right: the number genuinely is wrong. What is
wrong: a higher wall is still a wall, and the next honest case sits just above
the new number. Ask which number they would choose, then ask for the case that
sits ₹1 over it. Do this once and the room stops proposing numbers. Probe. "Your
ceiling is one month of the plan. Name the honest case that is twenty times the
plan." Eleven months of a double charge on a ₹4,000 plan is 01:33, so a pair
that gets there has walked into the next failure on its own. Let them.

### The confidence question, which somebody always asks

Every vendor's documentation offers routing on low model confidence. Do not wave
it away.  Why not. A self-reported number is more generated tokens. Not
comparable across models or across two prompts on one model, and nobody owns it.
Worst of all it is uncorrelated with what matters: week 1's injected ticket paid
₹2,50,000 with complete confidence. What replaces it. The model expresses
uncertainty by calling escalate. That call lands in the trace, is countable per
week and per ticket type, and can be checked afterwards against whether a person
agreed it needed looking at. Where uncertainty does belong. In the record, and
in week 3's harness as sampling variance measured by code. A test-time
instrument, not a runtime gate.

**The line this beat lands.** A limit with one outcome is a wall. A limit with two outcomes is a gate.

---

## A second piece of code pays without asking

**01:23 · 8 min · pairs**

**Say this, in these words.**

> Account 9999 still does not exist. What does it get paid?

Plus the standing two. Let the pairs commit before you show the ₹5,000.

### The answer key

₹5,000, to the same account that does not exist, three weeks after they fixed
it. The check protects issue_credit. It does not protect the ledger, and the
ledger is where the money is. Row one of the vote is now settled, by money
rather than by argument. This tool would have been refused at the dispatch,
because a tool with no policy row is refused by default. If somebody voted for
the ledger, say so now and name them. A dispatch check only covers callers that
go through the agent; move that tool into another team's service and the
dispatch never sees it. That is teardown question 1. The usual name for the fix:
a policy enforcement point.

### The wrong answer worth spending time on, and one probe

"Code review would have caught it." What is right: review is a real control.
What is wrong: the reviewer of a twenty-line tool in another team's service has
no reason to know your ceiling exists. Ask who on that team would have been the
reviewer, and what they would have had to already know. Probe. "How many code
paths in your own system can move money or change a customer record?" If the
answer is "not sure", that is the finding, and it is the same answer most rooms
give.

**The line this beat lands.** Every new tool is a new chance for somebody to forget.

---

## The row looks complete, and it is not

**01:31 · 2 min · optional, and the sharpest in the day**

**Say this, in these words.**

> Somebody writes a policy row for that tool: reversible false, a ceiling of ₹5,000, a named owner. It looks complete. What happens to account 9999?

Ask it straight after you admit the dispatch only checked for a missing row.

apply_goodwill_credit: reversible: false ceiling: 5000 owner: social-lead
Somebody writes a policy row for that tool: reversible false, a ceiling of
₹5,000, a named owner. It looks complete. What happens to account 9999?Ask it
straight after you admit the dispatch only checked for a missing row. Answer
honestly: it refused the new tool for having no policy row. It never looked at
the account. Then put the next question to the room: somebody writes a row for
that tool, reversible false, ceiling ₹5,000, named owner. It looks complete.
What happens to account 9999?

Cut this beat if block 2 is running long. But if one person asks what the check
actually checked, do not answer in a sentence and move on. It is the week's own
idea arriving from a direction nobody expected.

### The answer, and the distinction to teach

It gets paid. The row never says the account has to exist, so ₹5,000 goes to an
account that does not exist, through a design everybody had just agreed was
right. Then say what happened, slowly. We moved the check out of the tool so
nobody had to remember it. Then we put a rule inside the row that somebody has
to remember. Two minutes of silence after that is not wasted.  KindWhere it
livesExamples  Invarianttrue of every irreversible actionIn the checker, not as
a field. Nobody can switch it off, and nobody has to switch it on.The target
must exist. The amount must be a number. The amount must be positive.
Limitgenuinely different per toolIn the row, with an ownerThe ceiling. Who may
change it. What happens when nobody approves.   The test to hand them: could a
reasonable person want this switched off for one tool? If yes it is a limit and
belongs in the row. If no it is an invariant, and putting it in the row is a bug
you find later, with money. src/policy.py is written this way, with the reason
in a comment. It was not until 2026-09-08: it had the account check as a row
field, which is exactly the bug this beat is about, and it was found by somebody
reading the material rather than by anybody running it.

---

## A ₹44,000 refund has to go out tonight

**01:33 · 8 min · 60s alone first**

**Say this, in these words.**

> The refund has to go out tonight. Your check says no. What actually happens?

60 seconds alone, in writing, then three answers out loud. Somebody always gets
it.

### The answer key

Somebody pays it by hand. Nobody ships a code change, a review, a merge and a
deploy at 11pm on a Friday for one refund. Then the part that matters: the guard
did not stop the payment, it moved the payment to a path you cannot see. The
largest refund of the month is now the one with no row in the decision log, no
rule attached, and no record of who approved. The guard made the record worse. A
limit needs three things and they wrote one. A value. An owner, named as a role.
And a way to move it that leaves a record. The third is where the real decision
is, and it is not fast against safe: a fast path that writes an audit row is
perfectly possible. The slow path just hands you the record free, from git.

### The wrong answer worth spending time on, and one probe

"We would have an on-call override." What is right: they have understood that
the system needs a fast path. What is wrong: an override with no record is the
second row of the three-option table, and it is the one that cannot answer a
regulator. Ask what the override writes, and to where. Probe. "What is the
fastest anybody can change the most expensive limit you enforce? Give it in
hours. Then say what people do when they need it faster." The second half is
where the real answer is.

**The line this beat lands.** Every bit of friction you take out of the change path is a control you now have
to rebuild on purpose.

---

## Nobody is there to approve

**01:41 · 8 min · pairs**

**Set it up.** They have not built the gate yet, so point this at the system they own at work,
where an approval path already exists.

**Say this, in these words.**

> In that system, what happens at 2:14am when an approval is waiting and nobody answers?

Pairs, four minutes. Push for a number. "It waits" is not an answer until a
timeout is attached to it.

A defect fixed on 2026-09-11. This beat used to ask what the code they wrote in
drill 2 does at 2:14am, fifty-four minutes before drill 2 exists. It now asks
about the system they own at work, which is both answerable and better.

### The answer key

Exactly three behaviours: wait, refuse, allow. All three are a policy. The
failure is not picking the wrong one. The failure is that two of the three are
usually whatever the code happens to do, chosen by nobody. Collect all three on
the board before judging any of them. A room that has supplied all three has
made the argument for you.

### The wrong answer worth spending time on, and one probe

"It waits", said without a number. What is right: waiting is often correct. What
is wrong: waiting with no timeout is not a rule, it is the absence of one. Ask
for the number. If they cannot give one, that is the finding, and it is the
00:15 test pointed at their own code. Probe. "Your rule is 30 seconds, then
refuse. Four items are waiting. Does the fifth wait 30 seconds, or does it see a
queue nobody is reading and refuse immediately?" Queue depth as an input to the
gate's own decision is new for most rooms, and it is the bridge to teardown Q3.

### One path belongs to where you work

For a team in Bengaluru serving customers in the United States, the queue fills
at 2am IST, which is 4:30pm Eastern, the customer's busiest hour. A rota across
time zones is an architecture decision, not an HR one, and it gets made by
whoever sets the timeout in drill 2. Ask how many in the room serve customers in
a time zone that is not theirs. The hands make the argument better than the
paragraph does. Do not use an alert-fatigue statistic. Every source says a
quarter to two-thirds of alerts go uninvestigated, and every source is a blog
citing an unnamed survey. Use "hands up if you have ever muted an alert channel"
instead.

**The line this beat lands.** Whatever your code does when the approver is absent is your policy, whether or
not anybody chose it.

---

## Component 5 · the shape of an ask

**01:48 · 1 min out loud · the rest is reading**

No new beat. Both failures have landed by now, and this is the mechanism under
both of them. One sentence out loud, then point at the diagram on the learner
page so they can see the exit they have not written.

### Six paths out, and only one of them gets taken live

The check answers in two ways. Allowed, and the tool runs. Cannot be undone and
over the limit, and the code asks a person. That ask has four exits: approved
and it runs once, refused and somebody has to tell the customer, thirty seconds
with no answer and it escalates then refuses, or nobody answers at all. The
fourth is drawn in the danger colour with a gap above it, because the other
three are written on purpose and that one is whatever the code already does. The
line to say: three of these four were written by somebody. The fourth is the one
that runs at 2:14am. The six-path table beneath it is a different list and the
numbers are not a contradiction. Four exits are where a request can leave. Six
paths are what goes wrong on the way out. Say that if anybody asks, because
somebody always does.

### What fires the gate, and the trigger we rejected

The consequence, not the confidence. Ask a person only about an action that
cannot be undone. Reads run free, and calling a person about everything is the
failure rather than the safe choice. The 110-a-day number in the teardown is the
proof. The full confidence argument is on the 01:15 card, where it is usually
asked. Do not run it twice.

**The line this beat lands.** Four exits. You write three of them. The fourth writes itself.

---

## The pattern under all four failures

**01:49 · 10 min · whole room**

**Say this, in these words.**

> Take the control you just added. Where did the failure move to?

Ask it once per row as you build the table. The third column is the one they
cannot do yet.

Build the table live from their four answers. Do not display it finished. The
table is the point of block 2, not the four failures, and a room that watched it
assemble from its own sentences owns it.

### The answer key, and the order to fill it in

What you addedWhat it fixedWhere the failure went  a ceilingpays too muchrefuses
an honest ₹8,400 a check in the toolthis tool overpayingthe next tool nobody
checked a limit in the repositorythe number is now written downthe number cannot
move at 11pm a human gatenobody approves alonenobody approves at all at 2am
Fill the first two columns fast, from the room. Spend the time on the third.
That is the column they cannot produce for their own systems yet, and it is the
capability the checkpoint tests. Then the three ideas: the limit is data not
code; the check belongs at the dispatch; the default when the decider is absent
is the policy. Each one is a sentence, not a section.

**The line this beat lands.** A check does not remove a failure. It moves it. Your job is to know where it
moved to, and to have chosen that place.

---

## Checkpoint · you can now…

**01:59 · 6 min, then the break**

The last line — take any control you have added and say where the failure moved
to — is the capability the whole week is built on, and block 4 assumes it.

If the numbers in chat are low, do not push on into the break. Take one control
somebody names from their own system and walk it through the third column out
loud, as a room. Two minutes of that is worth more than the first two minutes of
drill 1.

---

## Move the limit out of the function

**02:20 · 15 min · alone**

**Say this, in these words.**

> Where does the file live, and in what format?
> What is in one row?
> What happens when a tool has no row?

Two minutes in writing before anybody types. The third question is the drill.

### A working answer

One shape, and not the only one. Anything that puts the numbers outside the tool
and reads them at the dispatch is a pass. data/policy.json "on_missing_row":
"refuse" "issue_credit": { "reversible": false, "ceiling": 1200, "owner":
"payments-lead" } agent.py, before res = fn(**args) rule = POLICY.get(act) if
rule is None: return refuse(f"{act} has no policy row") if not rule.reversible
and args.get("amount", 0) > rule.ceiling: return refuse(f"{args['amount']} over
ceiling {rule.ceiling} " f"[data/policy.json:{act}]") Three fields and no more.
The account-existence check is deliberately not one of them. If a room puts it
in the row, that is a good mistake and worth two minutes. Three files change:
the policy file, the dispatch, and whatever loads the file at start-up. Say that
out loud. It was three files in week 1's drill 1 as well, and the repeat is the
point. What a good answer has that a passing one does not: the refusal string
names the file and the row. That is the third fact from 00:25, now built rather
than described.

### What they will get wrong

They uncomment the block in tools.py, then move the numbers to a constant at the
top of the same file. The numbers are data and the check is still in the tool.
Ask them the goodwill-credit question again. The policy file sits in the module
that imports it, so changing a limit is still a code change. Ask who owns the
file. If the answer is "the repo", it is not out yet. No answer for a missing
row. Most people hit a KeyError and treat it as a bug rather than a policy.
Catch this one: "crash" is a defensible answer and "I did not notice" is not.
At 02:28, if half the room is still deciding the file shape rather than writing
the check, paste the policy file into chat. Not earlier, and not to individuals.

### Extension probe, for anyone finished early

Add a second business unit with its own ceiling, without copying the file. They
reach for inheritance, or a default with overrides. Either is fine. What matters
is that they hit the question of who owns an override, which is teardown
question 2.

**The line this beat lands.** A limit inside a function is a limit somebody has to remember. A limit in data
is a limit with an owner.

---

## One refusal message, read out loud

**02:33 · 2 min · whole room**

Somebody's screen goes up and their refusal message is read to the room. One
question: does it name the file?

That closes the 00:25 question against their own code, two hours later. Pick the
screen in advance while circulating, and pick one that does name the file. A
room that hears a working example reads its own output differently; a public
miss at 02:33 costs you the rest of the block.

---

## Component 6 · the six pieces of a working gate

**02:35 · reference for the drill**

They build the first and the last. The table exists so they know what the other
four cost before somebody asks them to buy one, which is usually the week after
a demo.

Say the framing once: the tool is never the answer, the trade is. Then never
recommend one by name. The named-technology card has what firms actually run in
each slot.

### Two decisions hide inside those six

Does the agent wait, or does the run stop and start again later? Waiting is
simple and holds a process open for hours. Stopping means the paused run is now
something you store, find and restart. Where does a paused run live? It is
state. In memory it dies with the process and the customer's approval dies with
it. That is drill 3 arriving twenty minutes early, so hand it forward rather
than solving it here.

---

## Gate the action you cannot undo, and record it

**02:35 · 20 min · alone**

**Say this, in these words.**

> Over the limit means ask. So what does asking look like in a program with no user sitting in front of it?

Three minutes in writing. Then: “What happens when nobody answers?” as a rule
with a number in it.

### The answer key for the build

The gate sits at the dispatch, beside drill 1's limit. Irreversible, plus over
the limit, means do not call the function. Write the decision row first, then
ask, then act on the answer. The order matters and almost nobody gets it right
unprompted: a row written only after approval loses the request entirely when
the process dies while waiting. While circulating, look at one thing only:
whether the gate is before the dispatch or inside the tool. Drill 1 settled this
an hour ago, and perhaps a third of the room will still put it inside the tool,
because that is where the assistant puts it.

### The wrong answer worth spending time on, and one probe

An input() call, or a blocking sleep loop, standing in for the approval. What is
right: it makes the pause real, and for twenty minutes that is enough. What is
wrong is what it hides. A process blocked on a prompt holds the run open for
hours and cannot survive a restart. Name it, say it is the right shortcut for
today, and hand the real version to week 5. Probe. "Your gate asks. Who is
allowed to answer, and where does your code check that?" Almost nobody has an
authorisation check on the approver, which is the self-approval path turning up
in their own code twenty minutes later.

### The one build-or-buy argument worth having

A pending table you write, against a durable execution engine. Both sides
honestly; this room has people who have been burned each way.  Write it
yourself. Two columns and a status. No new dependency and you understand every
line. You will then write retries, timeouts, visibility and a way to find stuck
items, and you will write them worse than a product does. Buy the engine.
Retries, history, timers and replay on day one. It is now in the path of every
run, your team learns its model, and its outage is your outage.  What settles it
is not technical: how many workflows will this team run in two years? One is a
table. Twenty is an engine. Nobody knows, which is why it is an architecture
decision rather than a preference. Name categories, not a product, for this row.
Naming a specific engine turns a trade-off into a recommendation, which is the
line the positioning does not cross.

**The line this beat lands.** Over the limit means ask, and "what happens when nobody answers" is a rule with
a number in it, not a wish.

---

## Pay once, then watch your fix fail

**02:55 · 20 min · alone · the false pass**

**Say this, in these words.**

> What makes two payment requests the same? The ticket, the account, the amount, or all three?

Two minutes in writing. Their answer decides whether a customer with two genuine
disputes is paid once or twice.

$ make retry paid out ₹1,200 · 1 credit What makes two payment requests the
same? The ticket, the account, the amount, or all three?Two minutes in writing.
Their answer decides whether a customer with two genuine disputes is paid once
or twice. This drill is week 3 being seeded a week early, and it only works if
you let the green result stand for a moment. The room stops the double payment
inside one running program, make retry shows one credit, and then the same
ticket from a second terminal pays twice again. They feel green and wrong a week
before they have the words for it.

Do not use the word "evaluation" here. Name the feeling and say week 3 is where
it gets a method. That is the handover, and week 3 opens on this terminal rather
than on a new example.

### The answer key

The decide step is the real content. What makes two payment requests the same?
The ticket id alone is the answer that holds. The account plus the amount is the
interesting near-miss: it is stable across runs and too stable, because a
customer legitimately owed two identical ₹1,200 refunds receives one. The key is
derived from the dispute identity and chosen by the caller, not minted per run.
A fresh uuid4() at the start of a run is the most common wrong answer and it
fails exactly when it is needed: a new run mints a new key, the provider sees
two distinct requests, it pays twice. Then part two. The keys live in a Python
list, the list dies with the process, and make retry passed because all three
deliveries ran inside one program — the one case that was never the problem.

### The wrong answer worth spending time on, and one probe

"Check the history before paying." The instinct is right and the placement is
wrong. History is empty on a redelivered run. This is week 1's answer repeated,
and it is worth showing rather than telling: ask them to run the second
terminal. Probe. "Your key store is now a database table. Two processes take the
same message at the same moment. Which one pays?" The answer needs a single
serialisation point, which is a unique constraint rather than a read-then-write.
That is week 5, and naming it here is enough.

**The line this beat lands.** Your test passed and proved nothing, and nothing in the room told you.

---

## Three things not to fix today

**03:15 · 5 min · whole room**

Naming the injection itch is not optional. They have carried the poisoned ticket
for two weeks, and the most motivated people in the room will go and fix it this
week. The answer they reach for is a line in the system prompt. Say plainly that
it is the wrong shape of answer, that week 4 will break it live, and give the
date. Naming the date is what stops it festering.

Then tests, which is week 3. The third item changed on 28 September and is no
longer "a second agent to approve the first".

### The third item is now argued on the page, not in the room

It used to be six words and a week number. It is now the judge argument in full
on the learner page, because a model in front of the money is the thing this
room actually reaches for between sessions, and six words did not earn the
deferral.

The block stays at five minutes. Use component 5's device: one sentence out
loud, then point at the page. **A model may widen what gets through a hard
limit, and it may never be the limit.** That is the sentence. The argument is
reading.

Two things to keep apart if somebody pushes, because the old line sent both to
the same week. A model judging one value against a rubric is a scorer, and
whether a scorer is any good is a measurement, which is week 3. A second agent
with its own loop approving the first is orchestration, which is week 5.

The full argument is the pattern-families note,
[`guardrail-patterns.md`](guardrail-patterns.md): the five families, the
selection rule, and why two models reading one hostile field are one control
rather than two. **Do not run it here unless you are asked.** The confidence
card at 01:15 already covers the same instinct from the other side, and the rule
on that card applies to this one. Do not run it twice.

If somebody wants to take it further this week, point at our own guide rather
than at the note, which is instructor material. *What to do with uncertain
evidence* is on the reading list and gives three outcomes instead of two, which
is the constructive version of everything this bullet refuses. The patterns note
maps the rest of the resource shelf onto the five families, including which ones
are deliberately not taught.

### Make the number move without a restart — drill 5, and why it is the optional one

The week makes a claim it never builds: they agree at 01:33 that a limit has to
move without a deploy, then build one that cannot, because guarded.py reads the
file once in main(). The code is three lines. The three questions are the
assignment, and each one is a door into week 5: where the audit row goes, who is
allowed to edit the file in production as a mechanism rather than a role, and
what the agent does with a malformed file mid-run. Question 3 splits rooms and
is worth five minutes at the top of week 3. Reload-per-call means a malformed
file can stop every payment, which is the fail-open or fail-closed decision
arriving in a file rather than in a service. Set it as optional and say why in
one sentence: everything else this week is about their own system, this one is
about the reference agent, so it is the item to drop. It is the only optional
thing on the list, and saying so protects the four that are not. Homework is
about 2 hours without it, 2 hours 30 with. Five hours live plus 45 minutes of
pre-work already exceeds the ~5 hrs/week on the public page. Making this one
optional is the smallest honest fix; the larger inconsistency is cohort-wide.

---

## The run budget

**set at 03:15 · homework · about 45 min**

Drill 4, the fourth guardrail, and the only one of the six that guards your
money rather than your customer. They take last week's per-step cost and turn it
into a limit: the loop stops at a number of rupees or a number of steps,
whichever comes first.

The part that matters is the last clause — it stops with a named outcome rather
than a silent success. That is week 1's drill 1 again with money attached, and a
budget that exits silently is the failure this drill exists to prevent.

### What they will get wrong

They will count tokens and not rupees, which hides the model-choice decision.
Ask what happens to the number when the model changes. And they will stop the
loop with a return rather than a decision row. A run that hit its budget is a
refusal and needs the same log line as any other refusal. If it is not in the
decision log, nobody can tell a budget stop from a successful short run.

---

## Make the number move without a restart

**set at 03:15 · optional homework · about 30 min**

The week makes a claim it never builds. They agree at 01:33 that a limit has to
move without a deploy, then build one that cannot, because guarded.py reads the
policy file once in main(). This closes it.

The code is three lines. The three questions are the assignment, and each one is
a door into week 5: where the audit row goes, who may edit the file in
production as a mechanism rather than a role, and what the agent does with a
malformed file mid-run.

### Why it is the only optional item, and who should still do it

Everything else this week is about their own system. This one is about the
reference agent, so it is the item to drop when the week gets away from them.
Say that out loud, because it protects the four items that are not optional. Two
things to add when you set it. Do it anyway if the answer at 00:44 was that
their own limits ship with a deploy, which is most of the room. And if short of
time, skip the code and answer question 3, because week 3 opens near it.
Question 3 splits rooms and is worth five minutes at the top of week 3. Reload-
per-call means a malformed file can stop every payment, which is the fail-open
or fail-closed decision arriving in a file rather than in a service.

---

## Checkpoint · you can now…

**03:20 · 5 min with the stand-up**

The bolded line is this week's step in the AI-written-code thread: review AI-
written code for where it put the check, not whether the check passes. Set it as
a live instruction, not a reflection: ask them to give drill 1 to their
assistant and watch where it puts the limit. It is almost always inside the
function.

The thread escalates every week, and week 6 formalises it. Do not let it become
a general remark about being careful with assistants.

---

## Five questions your pair argues about

**03:25 · 12 min · pairs, two questions each**

Say the case is constructed and that no client, product or number describes a
real organisation. Then assign the questions. Pairs that choose their own take
the two they already agree about.

With eight people every question gets covered at least twice, and two pairs will
disagree about at least one. That disagreement is the block working.

From 03:37 it is two minutes per question in order, so Q5 finishes at 03:45.
Take the answer, not the discussion. If a question is still alive at the end,
put it on the board for week 5 rather than finishing it here.

---

## Where does the policy live for forty processes?

**03:37 · 2 min in the room**

**Set it up.** Forty processes across four business units, all enforcing the same ceiling.

**Say this, in these words.**

> Where does that number live — a file in each deployment, or one service everybody calls?
> And when that service is down, do you fail open or fail closed?

Make them say which of block 2’s four failures each choice hands them.

### The key

Both options named with their real cost, rather than a preference stated as a
principle. A file in the repository has no runtime dependency and it drifts: two
business units enforce two ceilings and both believe they are current, and
nobody is paged. A policy service is one number for everybody, now in the path
of every payment with its own outage budget. What most pairs miss: the answer is
usually both. The service is the source, every process caches the last value it
read, and the age of that cache is visible. That turns an outage from a decision
into a degradation. Fail open or fail closed. Fail open gives you the goodwill-
credit failure at forty processes. Fail closed gives you a refused honest
customer, at scale, on the day your policy service is down. Neither is free.

### Two questions this always raises

"Shouldn't the ceiling be different for each client?" Yes, and the ₹44,000
already proved it. But there are two ways to vary it and the room reaches for
the worse one. A rule — "never more than one month of that account's charge" —
covers every customer including the ones who have not signed yet. A list of
numbers per customer means a new customer cannot be paid until somebody writes
their row, and the rows go stale. Use the rule, keep a short exception list, and
give every exception an end date. An exception with no end date is a wrong rule
nobody has admitted to yet. "If the rules are in a file, why do we need a
service?" Because the two hold different things, split by how fast each has to
move. Rules in the file, changed only through a code review. Numbers in the
service, changed in seconds with an owner and a record. Put the numbers in the
file and you get the ₹44,000 paid by hand. Put the rules in the service and
somebody switches off the account check from an admin screen at 2am, which is
the 01:31 bug wearing a nicer interface. This is the week's own idea, one level
up. Invariants in the checker and limits in the row became rules in the file and
numbers in the service. Say that connection out loud. It is the moment the day
holds together.

---

## Who can move the number, and how fast?

**03:39 · 2 min in the room**

**Say this, in these words.**

> Who is allowed to raise the ceiling?
> Through what, and how long does it take?

A role, a path and a latency, or it is not an answer. "It should be controlled"
is not an answer.

### The key

A named role, a named path, and a stated latency. "The payments lead, through
the admin screen, effective in under a minute, with a row in the audit log
naming them" is a complete answer. "It should be controlled" is not. The strong
answer splits the path by size. A change inside a band is one person and takes
seconds. A change outside the band takes two people. That is a design a pair can
defend at an architecture review, and it comes straight out of the Friday night
they already argued about. Push, if they are comfortable: what stops the fast
path becoming the only path? Usually nothing, which is why the record matters
more than the ceremony.

---

## The approval queue is a capacity plan

**03:41 · 2 min in the room**

**Set it up.** They set the threshold so that 6% of 40,000 disputes a month need a person.

**Say this, in these words.**

> That is 110 approvals every working day. Who does them?
> And what happens when the queue is 400 deep on a Friday?

Then the third part: "what does the four-hour promise mean by then?"

### The key

6% of 40,000 disputes is 2,400 approvals a month, about 110 a working day. A
good answer names three things: who does them as a named rota rather than "the
on-call engineer"; what the queue does at 400 deep, which has to be a chosen
policy; and what the four-hour promise means by then, which is that either the
threshold moves or the promise changes. The wrong answer: "we will tune the
threshold from the data once it is live." What is right is that the number
should move with evidence. What is wrong is that the threshold is a headcount
commitment made on the day you ship, and there is no live data yet. An engineer
choosing 6% instead of 2% just committed somebody else's team to three times the
work. Probe. "Take your own loaded cost for a minute of a reviewer's time. At
four minutes an approval, at what threshold does the cost of approving exceed
the money the gate saves?" Make them use their own figure. Do not supply one.

### What the organisations that already run this get right

Raise the item into the workflow that already exists. Most banks, NBFCs and
insurers already run maker-checker in the core system. The usual right answer is
for the agent to raise an item there rather than build a second approval inbox.
This gets decided by accident far more often than on purpose, and naming it is
most of the value of this question. Show enough to say no. "Approve ₹8,400 for
account 7310?" is not answerable. Sample your own approvals, or you have no
evidence the gate works. Bulk approve is where gates die. The decision log holds
personal data, including a named approver. Retention and erasure apply. The
calendar is a capacity input. A queue sized for an ordinary Tuesday behaves
differently across Diwali.

---

## Whose key is it?

**03:43 · 2 min in the room**

**Set it up.** A repeated request has to pay once, and that needs a key both sides agree on.

**Say this, in these words.**

> Who generates that key — the agent, or the payments service?
> And who refuses the second request that arrives carrying it?

Push until they name both ends. Either half on its own gives them nothing.

### The key

Paying once is a property of the pair, not of one side. The caller chooses the
key and the provider enforces it. Either half alone gives you nothing: a
provider that dedupes on a key the caller regenerates per attempt dedupes
nothing, and a caller with a stable key talking to a provider that ignores it
has only a comment. So the answer names both ends and the contract between them.
The key comes from the dispute identity on the queue message, the payments
service dedupes on it, and retries then become free because the second call
returns the first result rather than performing a second credit. The sentence to
land: an agent that retries with a fresh key has removed the guarantee without
touching the code that provides it. Nothing in the provider changed, nothing in
the tests changed, and the property is gone. If the provider has no idempotency
support, the caller owns the dedupe: a claim row written transactionally before
the call, keyed by dispute id, carrying a status. The credit is attempted only
by whoever wrote the claim. That is the outbox shape and it is worth naming if
somebody reaches for it.

---

## The credit landed and the log write failed

**03:45 · 2 min in the room**

**Set it up.** The credit reached the ledger. The write to the decision log failed.

**Say this, in these words.**

> Which of the two records is true?
> And what do you tell the regulator?

Then: "what would have had to exist last Monday for this to be answerable at
all?"

### The key

The ledger is true. It is the system of record and the log is a record about it.
You cannot make two writes to two different stores atomic, so the design
question is which one is authoritative and how the other recovers. The working
shape: write the intent row first, in the same transaction as the claim,
carrying the approver and the rule. Then call the payments service. Then mark
the row complete. A missing completion is then visible as an unfinished row
rather than as silence. What you tell the regulator: the credit happened, here
is the row showing who approved it and under which rule, and here is the
reconciliation that found the gap. What had to exist last Monday is the intent
row written before the call, and a job comparing the ledger against intents.

### The wrong answer worth spending time on, and one probe

"Put both writes in one transaction." What is right: atomicity is exactly the
property they want. What is wrong: the two stores are different systems, often
different companies, and there is no shared transaction to join. The near miss
worth praising is "retry the log write", which is correct and incomplete. Ask
what retries it after the process dies. The answer is the intent row, which is
the same mechanism again. Probe. "The log write succeeded and the credit failed.
Which of your two records is lying now?" One direction leaves money unexplained,
the other leaves a promise unkept, and they need different handling.

---

## The artefact: your policy table

**03:47 · 22 min · 12 to write, 10 to review**

**Say this, in these words.**

> Could another engineer build from your table without asking you a single question?

That is the fourth review question, and it is the one that decides whether the
artefact is finished.

This is the artefact of the week, and it is the thing they can still show
somebody in a year. Six columns, and every cell has a value or the row is not
finished.

### Reviewing another pair's, scored 0, 1 or 2 each

Four questions, scored 0, 1 or 2 each. The written comment matters more than the
number, and say so when you set it, or you get eights with nothing attached.
Walk block 2's four failures through their table. Anything that still gets
through is the finding. This is the highest-value question and it is first on
purpose. Does every row have a number? "Reasonable" is a wish. Does the last
column ever say nothing? An empty cell is a decision made by whoever wrote the
code. Could you build from this without asking a question? If yes, mark the cell
you would have asked about.  "TBD" in the last column is the 2:14am failure,
written down in advance. That is the sentence to use when you see one, and you
will see several. Collect the tables. They are the input to the week 6 review,
and a pair that knows they will be read writes differently.

**The line this beat lands.** Another engineer should be able to build from your table without asking you a
question.

---

## What the firms that already run this get right

**04:09 · 6 min · whole room**

One trade-off under the whole day: the wrong payment against the wrong refusal.
A wrong payment costs ₹5,000 and is visible in the ledger. A wrong refusal costs
one customer, one complaint, and nothing you can see in a dashboard. That
asymmetry is why most teams tighten the check and never find out what it cost
them.

Then the third cost, which no dashboard shows either: a human gate works only
while the person is still reading it. First request read, tenth skimmed,
fiftieth approved before the sentence finishes. Volume, not carelessness.

Close on the upward sentence, which is already on the learner page. Do not add a
fourth idea here. Six minutes, three sentences, and the quiz is next.

**The line this beat lands.** "Here is the amount we will not pay without a person, here is what being wrong
costs in each direction, and here is who can move that number." That survives a
board meeting. "We added validation" does not.

---

## Can you still answer these tomorrow?

**04:20 · 10 min · everybody answers**

**Say this, in these words.**

> Eight questions, one at a time, about 40 seconds each.

Nobody’s score is shared. Say that once at 04:20 and you get honest answers
rather than careful ones.

Eight questions, the full bank with answers and distractor rationale is in the
section below this column. Post them one at a time in chat and give about 40
seconds each.

Do not take up the ones everybody got right. Mark as they come in, then spend
the remaining minutes on the two or three that actually split the room.
Questions 4 and 6 are the usual splitters: the config file that still needs a
deploy, and routing on model confidence.

Nobody's score is shared. The quiz is retrieval practice, not an assessment, and
saying so once at 04:20 gets honest answers rather than careful ones.

**The line this beat lands.** Mixed on purpose. Sorting questions by topic lets people answer from the heading
instead of from the problem.

---

## Who is allowed to say what a system may do?

**04:30 · 20 min · whole room**

The argument: almost nothing they did today was code, and none of it was a
model. They chose a number, decided who may change it, and decided what happens
when nobody is available. Those decisions used to belong to compliance, or to
nobody, and they are moving to engineering because they are now enforced by code
that engineers write.

The specifics come from the radar in the week this is taught — what is being
hired for in India, at what level, and what the job descriptions ask for.
Nothing dated is written into the session file, on purpose.

### Sourcing discipline, and one hook still unverified

Bring two or three items from the field notes and say where each came from. A
vendor blog and a regulator's own text are both "a link", and only one of them
is safe to repeat to a board. The EU AI Act hook is attractive and is not
cleared. Article 14 requires human oversight for high-risk systems, and the
high-risk obligations became enforceable in August 2026. It is current,
checkable and exactly on-brand. Read Article 14 and the application dates in
Article 113 in the primary text before saying it in the room, and keep it out of
the session file either way. Week 1's lesson was that citing trade press for a
regulatory claim is worse than saying nothing.

**The line this beat lands.** A coding assistant will write the check in 30 seconds. It has no view on what
the number should be, and it will not tell you that it has no view.

---

## Five things before next session

**set at 04:50 · about 2 hours**

Item 5 is the one to chase. It is the only item that sends somebody into a
production system they own with a question they have never asked it, and the
surprises it produces are the best material week 3 can open on. Ask for it in
the channel before next session rather than at the start of week 3.

---

## Two numbers and two lines

**04:52 · 8 min**

**Say this, in these words.**

> Who scored themselves lower than at 00:05?

Hands up, out loud. Then the two chat lines: “The check I am adding to my own
system this week is ___” and “The thing I am still fuzzy on is ___”.

Then ask out loud: who scored themselves lower than at 00:05? Hands up. Say why
that is the good result, and that it means they found something in their own
system during block 3. If you skip this, the second rating reads as a test
rather than as a finding.

Two lines in chat at 04:56, both answered by everybody. Keep the second line.
"The thing I am still fuzzy on is ______" is what week 3 opens with, and it is
the only place that input exists.

---

## Six things to bring

**sent a week before · 45 min of theirs**

This card and the four below it are the learner page's last part, Before, during
and after. They are the things you set rather than teach.

Three of the six are load-bearing for the day, and it is worth chasing those
three rather than all six.

The other three — rerun make retry and note the figure, read the commented block
in tools.py without uncommenting it, and write one sentence about their own
system — are cheap and each one is referenced by name during the day.

---

## Five hours, five blocks, nothing longer than an hour

**the shape of the day**

The last column is the learner page's six parts, which run in learning order
rather than clock order. Part 4 is the teardown at 03:25 and part 5 is the
drills at 02:20, so the two pages deliberately disagree about sequence. Use this
column when somebody asks where they are.

Take the breaks. Block 2 is four failures in fifty minutes and it is the densest
stretch of the day. A room that skipped the stand-up argues worse at 01:41, and
the fifteen minutes at 02:05 is what makes sixty minutes of keyboard time
survivable.

---

## Seven things worth your time

**none required, none long**

Nothing here is assigned. If a learner reads one, it should be the AWS one,
because the fallback path that never gets tested and always gets used is the
2:14am default under a different name.

The heading said four while the list held six, and it now holds seven. Four of
the seven are ours, and say so when you point at them: the Rule Placement Audit
is drill 1 as a worksheet, Who may call the tool is drill 1 argued in prose,
the Agent Authority Review is the undo-cost scale the policy table needs, and
What to do with uncertain evidence answers both places today refuses to let a
model decide. Who may call the tool was added on 28 September; it is the public
form of the whole first block and had been missing from the list.

---

## Maker-checker — the reasoning

Do not deliver this as a segment. The word goes in at 01:15 in one sentence and
a show of hands. This card is for the question that follows it, which in a room
of eight senior engineers is usually some version of why two people, and what
does the second one actually add? Answer that well and the rest of the topic is
easy, because every failure later in the day is one of these reasons breaking.

### Two failure classes, one mechanism — the part that gets skipped

It starts with reversibility rather than with trust. If you can undo the action
you do not need anybody in front of it: notice at 9am, reverse it, apologise.
Maker-checker spends a person’s attention on every single use, so it is only
worth paying where there is no afterwards. That is week 1’s reversibility grade
deciding which control is even available.  Error. The maker got it wrong. A
second person catches it because their mistakes are uncorrelated with the first
person’s. Two independent judgments landing on the same wrong answer is much
less likely than one. Fraud. The maker meant it. A second person catches it
because they have no reason to go along with it.  Only the second one needs the
identities to differ, and that is why it is written as an identity rule. If
error were the only concern, self-review against a checklist would do most of
the work, because re-reading your own entry catches a transposed digit. It does
not catch a decision somebody made on purpose. Teams that implement this as
"please get it reviewed" have built the error half and skipped the fraud half,
and usually do not know which half they have. So it turns a trust problem into a
probability problem. Nobody has to be trusted. What has to hold is that two
named people will not fail at the same moment in the same direction. For error
that is independence. For fraud that is collusion, which needs a conversation,
leaves more traces, and gives somebody the chance to refuse.

### Three things that fall out of the mechanism

The record is a by-product. The control cannot function without capturing who
made it and who checked it, so the audit answer exists whether or not anybody
planned for it. Controls that generate their own evidence survive; controls that
need separate logging get logged badly. It prices the decision. Each check
spends somebody’s attention, so the threshold forces the team to say out loud
what is worth interrupting a human for. The cost is doing useful work: a control
that costs nothing is applied to everything and then stops being read. It
attaches the decision to accountability. A process cannot be held responsible.
If somebody has to answer for this in nine months, the authorising step has to
carry a person’s name.

### What changes when the maker is an agent

The sharpest thing on this card, and the reason the word is worth importing at
all. Both failure classes change shape, and they move in opposite directions.
Against error, the checker gets weaker. A human maker’s mistakes are random and
varied. An agent’s are systematic: the same prompt produces the same wrong
judgment across 40,000 disputes. The checker sees a stream that looks correct
because forty-nine were, and habituates. With an agent maker the fiftieth is not
a new mistake, it is the first one again. Against intent, the checker becomes
the only defence. An agent has no motive, so there is nothing to detect in the
usual sense. It can still be induced to act by somebody outside the organisation
writing text into a field you read, which is week 4. With a human maker, fraud
is internal and rare. With an agent maker it arrives from outside and is cheap
to attempt.  And the accountability assumption breaks. Maker-checker assumes the
maker can be held responsible. An agent cannot, so accountability moves to
whoever deployed it, and the checker is now checking a maker nobody can hold to
anything. With a human maker the checker is a second opinion. With an agent
maker the checker is the only opinion, which makes the threshold deciding how
many items reach them a far more consequential number than it looks.

### Where the reasoning runs out, and say so if they push

Two is not three. Dual control assumes the two are not cooperating. The checker
has to be able to say no. That needs what was asked, what the agent found, which
rule was crossed, and what happens either way. "Approve ₹8,400 for account
7310?" fails this, and it is the commonest real implementation. If the maker can
move the threshold, they can lower it underneath their own entry. The control
over the control matters more than the control, which is teardown question 2
arriving from a different direction.

**The one-sentence reason.** When an action cannot be undone, the only place a control can exist is before it
happens, and one person’s judgment is not a reliable enough control on its own.
