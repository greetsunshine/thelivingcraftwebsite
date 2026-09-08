---
week: 2
title: "Agentic systems you'd put your name on — part 1"
module: M2
summary: "From a demo that works once to a system with bounded failure and something to observe."
status: draft
---

Last week you watched a tool that pays out money with nothing standing in front
of it. Today we put something in front of it. That something is a check that runs
before the money moves.

Then we spend most of the day on what that check costs you. It will refuse an
honest customer. A second piece of code will never call it at all. And the fix
that works on your screen in the room will still pay twice when you run it from a
second terminal.

**By the end of this session you will be able to:**

1. **Keep the limit outside the function.** A rule like *"never credit more than
   one month's charge"* should sit in a file you can open and read. It should not
   be a number buried inside the function that moves the money. You will also be
   able to say who is allowed to change that number. Week 1 ended with a
   question. *Where is the limit written down, and who agreed to it?* This is the
   answer to it.
2. **Stop an action you cannot undo, and write down why.** Week 1 graded every
   tool as read, write, or irreversible. Irreversible means you cannot get it
   back. Before an irreversible tool runs, your code should check the rule and
   keep a record of what happened. That record holds what was asked for, which
   rule applied, and who or what said yes. You will also decide what the code
   does when the person who should approve is not there. If you do not decide
   that, the code decides it for you. Whatever it does is then your policy.
3. **Pay once, even when the same request arrives twice.** You will make the
   agent recognise a request it has already handled. Then you will test it the
   hard way. Stop the program, start it again, send the same ticket, and check
   that it still pays once. A fix that only works inside one running program is
   not yet a fix.
4. **Say what your own check broke.** Every check refuses something, and some of
   what it refuses is honest work. You will be able to name that customer, and
   then say which of the two mistakes costs less: paying someone who should not
   have been paid, or refusing someone who should have been. Answer it with a
   number, not with a feeling.
5. **Turn your decision record into a table someone else can build from.** One
   row for each action: what it does, whether you can undo it, what the limit
   is, what happens when someone goes over it, and who is allowed to move the
   number.

One and two build the check. Three is the one that looks finished and is not.
Four is the price you pay for having a check at all. Five is what you hand to
the person who has to build it.

**You will rate yourself against these five, twice.** Once at 00:05, before
anything has been taught. Again at 04:52, on the same five statements, in the
same words, scored 1 to 5. Nobody sees your first number but you. The two sets go
on screen together at the end. What matters is how much you moved, not the score.

These are the words used all three times, so that both sets of numbers mean the
same thing:

> **Right now, I could…**
>
> 1. keep a limit in a file instead of inside the function, and say who is allowed to change it
> 2. stop an action I cannot undo, record why it was stopped, and say what happens when nobody is there to approve it
> 3. make the same request pay only once, and show that it still holds after the program restarts
> 4. name the honest customer my own check now refuses, and say which of the two mistakes costs less
> 5. write a table someone else could build from: the action, can it be undone, the limit, what happens when it is crossed, who can change it

Expect **high** scores on 1 and 3 at 00:05. Almost everyone believes their limits
are already in config and their payments already run once. Block 3 is built to
test that belief, and for some of you the belief will not survive. So this is the
one session where a score that goes *down* at 04:52 is a good result. It means
you found something real. You are measuring what changed, not grading yourself.

Anyone can add an `if` statement. This session is about where that check should
sit, who agreed to the number inside it, and what your system does when the
person who was supposed to approve is asleep.

[PLACEHOLDER: everything from here down is scaffolding for Sunil to write. The
shape is agreed and the five outcomes above are written. None of the blocks below
are teaching material yet. While `status: draft`, learners see a short "still
being written" note instead of this body, so drafting in the open is safe.]

## Before the session

[PLACEHOLDER: pre-work. What to read, what to bring, what to have running. Keep
it to something a working engineer can do in under an hour. The commitment is
~5 hrs/week including the live session.]

## 1 · The Concept

*~15 minutes.*

[PLACEHOLDER: the idea of the week, shown working on the smallest example that
is still real. Success comes first. The room sees it behave, and names what it is
looking at, before anything breaks.]

## 2 · The Problem

*~30 minutes.*

[PLACEHOLDER: the same system, broken. Work the room for fixes, and take the
answers in the order rooms actually give them. That way the real constraint is
worked out rather than lectured. The positioning spine is "AI builds, the human
judges and directs", and this is where the judgment gets practised.]

## 3 · The Drill

*~45 minutes, hands-on.*

[PLACEHOLDER: two or three exercises against the reference agent. Each should be
a real defect, not a synthetic task. Say explicitly what NOT to fix, so the next
week keeps its opening.]

## 4 · The Teardown

*~35 minutes. In pairs, then the room.*

[PLACEHOLDER: the same problem at enterprise scale, where block 3's fix is no
longer enough. Constructed teaching case, labelled as constructed. No real
client, product, or metric. Four or five questions, taken in pairs. Closes on the
leader's framing: the week's trade-off, stated the way it survives a board
meeting.]

## 5 · The Horizon

*~10 minutes.*

[PLACEHOLDER: the closing beat, present in every session. Write the durable
framing here, which is the career and skills question this week's material
raises. Do NOT write the specifics here. Those are pulled from
`/craft/admin/radar` (Trends · Hiring — India · Durable skills) in the week you
teach it, so nothing dated is committed to this file. See week 1 for the
pattern.]

## After

[PLACEHOLDER: what to apply to your own system before next week, and what you
will be asked to show.]

## Reading

[PLACEHOLDER: sources. Field Notes at /latest already tracks what is changing in
the field. Link the relevant findings here rather than restating them.]
