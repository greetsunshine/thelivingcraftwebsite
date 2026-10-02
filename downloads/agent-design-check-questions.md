# The Agent Design Check

Built by Sunil Mathew, co-authored with Claude. The same check, with the next steps put in order for you: https://learning.thelivingcraft.ai/tools/agent-design-check

19 questions over 7 areas. For each one, tick one answer. Each answer says what it leads to.

## How the answers are read

- Every next step below is written in the rubric, next to the question it belongs to. Nothing is generated, ranked or summarised by a model, and you can read the whole rubric before answering anything.
- Steps are ordered by two things only. First, whether the question is about an action that leaves the system — one you cannot take back. Then the order the questions appear in, which is the order these decisions are worth making.
- A reported gap and a not-yet-defined answer are not ranked against each other. They are different kinds of work: a gap already has a decision behind it and needs a design change, while an undefined answer means nobody has decided and the first step is to find out.
- Answering yes closes nothing. It asks for the artefact that would show it.
- There is no score, no percentage and no grade, and no set of answers produces a readiness verdict. Nineteen yeses produce nineteen requests for evidence.

- **Yes — this is designed.** You are saying the design has an answer here. That is a claim, and the result asks what would show it.
- **No — we have not designed this.** You know the answer and the answer is no. Somebody looked; there is a hole you can already name, so the next step is a design change.
- **Not yet defined.** Nobody has decided. What the system does here today is unknown to the people who own it, so the next step is finding out, not building.

## Purpose and boundary

What the system is for, where it stops, and whether it needed to be an agent at all.

### 1. The open part and the closed part

You can say which part of this work genuinely needs a decision made at run time, and which part is a fixed sequence.

- [ ] Yes — this is designed. Next: Bring the line itself — where the open part ends and the closed part begins — and be ready to say which decisions sit on each side.
- [ ] No — we have not designed this. Next: Draw the line between the open part and the closed part, and write the closed part as a function the agent calls rather than a sequence it improvises each time.
- [ ] Not yet defined. Next: Put the question to the team before the others: which decision here actually depends on what the system finds? The answer changes what the rest of this checklist is about.

*Why it matters:* An agent is a decision about control flow, not about capability. If the steps are knowable before the request arrives, a workflow does the same job and can be reviewed before it runs. Reaching for an agent because there is a model in the design moves decisions from review time to run time and gets nothing back for it.

*Example:* Reading an unstructured message and working out which policy applies is open — the next step depends on what the assistant finds. Issuing a refund against an identified order, a policy version and an amount is closed: a fixed sequence, and calling it from a model does not make it anything else.

### 2. A purpose somebody can check

The purpose is written as a task and a boundary, in one sentence somebody outside the team could check.

- [ ] Yes — this is designed. Next: Bring the sentence, and one recent run that landed near its edge.
- [ ] No — we have not designed this. Next: Write the sentence. Task first, then the boundary — the point at which the system stops rather than continues.
- [ ] Not yet defined. Next: Ask two people who work on it to write the sentence separately, then compare them. Where they differ is the part of the purpose that was never decided.

*Why it matters:* "Handle returns" cannot be checked by anyone. A purpose written as a task with a boundary can be held against the behaviour, and it is what a reviewer measures scope creep against a year later. A goal is only worth writing if it is testable: "safer" is not a goal, "no order is refunded twice" is, because you can go and look.

*Example:* "Reads a customer’s return request, identifies the order, applies the published returns policy, and recommends or issues a refund within the window that policy defines."

### 3. Non-goals, written down

The non-goals are written down, and each one is something somebody could plausibly have asked for.

- [ ] Yes — this is designed. Next: Bring the list, and say which non-goal has been questioned most often since it was written.
- [ ] No — we have not designed this. Next: Write the four or five things it must not do, with a reason for each. Keep the ones that are hard to justify — those are the questions for the next review.
- [ ] Not yet defined. Next: Ask what somebody has already requested and been told no. Those answers are non-goals that exist but have never been recorded as design.

*Why it matters:* Goals tell a reviewer what you were trying to build, which they can usually infer. Non-goals tell them what you decided against, which they cannot — and a non-goal nobody can quite justify is very often the seam where the design is unresolved.

*Example:* It does not amend an order. It does not cancel a subscription. It does not contact a bank. It does not act on an order it could not identify.

## Evidence

What must be established before it acts, and whether that can be checked afterwards.

### 4. An evidence list per action

For each action the system can take, the facts that must be established first are named, with where each one comes from.

- [ ] Yes — this is designed. Next: Bring the list for the action with the largest effect, and walk it against one real run.
- [ ] No — we have not designed this. Next: Take the action with the largest effect and write its evidence list first. One line per fact, with its source beside it.
- [ ] Not yet defined. Next: Find out what the system is relying on today when it acts. If the answer is "the conversation so far", the list is empty, and that is the finding.

*Why it matters:* An action with no evidence list is an action whose preconditions live in a prompt and in somebody’s memory. Naming them is also what makes it possible for the tool to refuse: a tool cannot check a precondition nobody wrote down.

*Example:* Before a refund: an identified order; the state of that order; the policy clause that permits it and which version that clause came from; the amount that clause allows; and the absence of a prior refund against the same order.

### 5. Evidence as a reference, not a recollection

Evidence is held as a reference that can be checked afterwards — an identifier and a version — rather than a paraphrase carried in the context.

- [ ] Yes — this is designed. Next: Bring one run’s references and resolve them live — the point is whether they still resolve, not whether they were recorded.
- [ ] No — we have not designed this. Next: Change the evidence the system carries from text to identifiers. Start with the one fact a dispute would turn on.
- [ ] Not yet defined. Next: Take one completed run and try to answer "which version of the policy was this decided under?" How far you get is the answer to this question.

*Why it matters:* "The policy says returns are accepted within the window" is a recollection sitting in a context window. It cannot be checked after the fact, and it cannot be checked by the tool at the moment of the call. A clause identifier and a version can be both. This is also what makes the system explainable: an answer built out of references is an answer, and an answer built out of the model’s summary of its own reasoning is a story about an answer.

*Example:* The refund carries clause 4.2 of the returns policy at the version in force that day — not a sentence summarising what the policy seemed to say.

### 6. The tool re-checks what it was handed

The tool re-checks the evidence it was handed rather than trusting the arguments it was called with.

- [ ] Yes — this is designed. Next: Bring the tool’s own validation, and a case where it refused a call the agent was willing to make.
- [ ] No — we have not designed this. Next: Move the precondition check inside the tool. It can stay in the agent as well; it cannot only be there.
- [ ] Not yet defined. Next: Read the tool’s entry point and list what it validates. That list, whatever it turns out to be, is the design as it stands today.

*Why it matters:* Evidence gathered a few steps earlier may have been superseded, and may never have been what the caller says it was. The check that matters is the one at the point where the effect happens, because that is the only check an unusual input cannot route around.

*Example:* The refund tool re-reads the cited clause at the cited version and re-reads the order state, and refuses if either has moved — rather than accepting the amount it was passed.

## Tool permissions

What each tool may do, and where that limit is actually enforced.

### 7. One job, narrowest scope

Each tool has one job and the narrowest scope that lets it do that job.

- [ ] Yes — this is designed. Next: Bring the tool list with each tool’s scope, and name the widest one.
- [ ] No — we have not designed this. Next: Split the widest tool into the operations that are actually used, and take away the ones that are not.
- [ ] Not yet defined. Next: List every tool the agent can call and, beside each, the widest thing it could do if called with the most permissive arguments it accepts. That list is the real permission model.

*Why it matters:* A broad tool is a permission granted to every path that can reach it, including the paths nobody designed. Narrowness is one of the few properties of a tool that holds regardless of what the model was persuaded to ask for.

*Example:* "Issue a refund against this order for this amount" rather than "call the payments API".

### 8. Limits enforced at the tool

Each tool’s limits are enforced by the tool itself, not stated in the prompt.

- [ ] Yes — this is designed. Next: Bring the enforcing code, not the prompt, and one refusal from it.
- [ ] No — we have not designed this. Next: Take the limits currently written in the prompt and implement each one at the tool. Leave the prompt text where it is; it is now a description of a control rather than the control.
- [ ] Not yet defined. Next: For the tool with the largest effect, ask what happens if it is called with an argument beyond the limit. If nobody knows, call it and find out in a test environment.

*Why it matters:* An instruction in a system prompt is a message inside the system. The tool is where the effect happens. Whatever is enforced at the tool holds regardless of what the model was asked to do — and the distinction is structural rather than a claim about how obedient a model is.

*Example:* The refund tool refuses an amount above what the cited clause permits. The prompt telling the assistant not to exceed the policy is guidance; the refusal is the control.

### 9. Its own identity, and a record of every call

Each tool acts under an identity of its own rather than a shared administrative one, and every call is recorded with its arguments and its result.

- [ ] Yes — this is designed. Next: Bring one call record end to end: who it acted as, what it was passed, what it returned.
- [ ] No — we have not designed this. Next: Give the tool with the largest effect its own identity first, and record its calls. The others follow from the same work.
- [ ] Not yet defined. Next: Find out which credential the tools actually run as. One shared administrative identity is a common answer and it is worth knowing before anything else here is decided.

*Why it matters:* A shared identity gives every tool the union of every tool’s rights and leaves the log unable to answer who did this. The record is also the only thing that can settle a dispute afterwards — "the system decided to" is not evidence.

*Example:* The refund tool holds refund rights and nothing else. It cannot amend an order, because that is a different tool acting as somebody else.

## External actions

What happens when the system does something the world can see and you cannot take back.

### 10. Recommending and acting are separate

Recommending an action and taking it are separate steps, with separate permission.

- [ ] Yes — this is designed. Next: Bring both halves and say what the second one requires that the first does not.
- [ ] No — we have not designed this. Next: Split the step. The recommendation keeps the reasoning; the action keeps the authority, and gets its own conditions.
- [ ] Not yet defined. Next: Trace one run from the message to the effect and mark the point where a recommendation became an action. If there is no such point, that is the finding.

*Why it matters:* A recommendation is reviewable text. An action moves money, sends a message or changes somebody’s record. Folding them together means one design decision governs both, and the safe version of the first is not the safe version of the second.

*Example:* The assistant gathers the policy evidence and prepares a recommendation. Issuing the refund is a separate call, with its own controls over what it will allow.

### 11. A repeat cannot pay twice

A repeated request cannot produce the effect twice — the action is idempotent against a key that comes from the request.

- [ ] Yes — this is designed. Next: Bring the key and say what it is derived from, then send the request twice and show the second result.
- [ ] No — we have not designed this. Next: Choose the key from the request — the order, the clause, the period — and make the tool return the existing result when it sees one it has already handled.
- [ ] Not yet defined. Next: Send the same request twice in a test environment and look at what happened. This is the cheapest question on the list to answer and one of the more expensive ones to leave open.

*Why it matters:* A retry, a refresh, and a customer writing in twice all look the same to a system that identifies an action only by the fact that it was asked for. The key has to be derived from the request rather than from the attempt, or the second attempt simply carries a second key.

*Example:* The same customer sends the same request twice. The refund is keyed to the order and the clause, so the second call returns the first refund rather than paying again.

### 12. An unknown outcome can be established

When a tool times out or returns an ambiguous result, there is a way to establish what actually happened before deciding whether to repeat it.

- [ ] Yes — this is designed. Next: Bring the read-back path and one run where it was used.
- [ ] No — we have not designed this. Next: Give the action a way to be read back — by the same key it was issued under — and make the timeout path use it before it retries or reports.
- [ ] Not yet defined. Next: Ask what the code does today on a timeout from the tool with the largest effect. Retry, fail, or nothing at all are three different designs and one of them is already in production.

*Why it matters:* An unknown outcome is not a failure, and treating it as one is how a single action becomes two. Treating it as a success is how somebody is told nothing happened when it did. The design has to be able to go and look.

*Example:* The refund call times out. Before anything else, the system reads the payment back by its key and finds out whether the money moved.

## Evaluation

What you can see after a run, and what the system is checked against.

### 13. A record of what it used and did

Each run keeps what the system used and what it did — the evidence with its references, every tool call with its arguments and result, the outcome — and not only the transcript.

- [ ] Yes — this is designed. Next: Bring one run’s record and answer a "why did this happen" question from it alone.
- [ ] No — we have not designed this. Next: Record the evidence references and the tool calls alongside whatever is captured today. Start with the runs that end in an external action.
- [ ] Not yet defined. Next: Take a run from last week and try to reconstruct which evidence it used. What you cannot recover is what is not being kept.

*Why it matters:* The transcript is what the system said. A review holding only the final answer can tell you the answer was wrong, but not whether the cause was missing evidence, an over-broad permission or a tool returning something unexpected — and those are three different changes. This is the decision that makes the other five improvable.

*Example:* Why was this refund issued? An answer built from the clause, the version and the tool’s response is an answer. An answer built from the model’s account of its own reasoning is not.

### 14. Cases, and failures that become cases

There is a set of cases the system is checked against, and a real failure becomes one of them.

- [ ] Yes — this is designed. Next: Bring the case set and say which case came from a real failure most recently.
- [ ] No — we have not designed this. Next: Write down the last three failures as cases before writing any new ones. They are the only cases you already know matter.
- [ ] Not yet defined. Next: Ask what is run before a prompt or model change ships. If the answer is a look at the output, that is the current evaluation and it can be written down as such.

*Why it matters:* Without cases, a change is judged by whether the demo still looks right — which it usually does, because that is the path the demo takes. A failure that does not become a case is a failure you have agreed to have again.

*Example:* The partially shipped order that was refunded in full is now a case, carrying the evidence the system should have required before acting.

## Uncertainty and recovery

What it does when it cannot establish what it needs, and how a person takes over.

### 15. A third outcome besides act and fail

There is a third outcome besides acting and failing: handing over with the specific gap named.

- [ ] Yes — this is designed. Next: Bring a run that took the third path and show what the recipient was handed.
- [ ] No — we have not designed this. Next: Add the third outcome as a real return value, not a lower score on the normal one, and give it somewhere to go.
- [ ] Not yet defined. Next: Give the system a request the policy does not cover and watch what it does. Whatever that is, it is the current design for uncertainty.

*Why it matters:* The honest output when evidence is missing is not a lower-confidence version of the normal output. It is a different output, and it has to be designed as one — otherwise the system’s only way of expressing doubt is to do the usual thing slightly less well.

*Example:* The request falls outside any policy the assistant holds. It stops short of the refund and says which fact it could not establish, rather than recommending its best guess.

### 16. Kinds of uncertainty routed differently

Different kinds of uncertainty are routed differently, rather than collapsed into one confidence number.

- [ ] Yes — this is designed. Next: Bring the kinds and, for each, where it goes and who acts on it.
- [ ] No — we have not designed this. Next: Name the kinds you actually meet, and give each one a destination. Three named routes beat one number.
- [ ] Not yet defined. Next: Read a week of handovers and sort them into kinds. The sort will be rough and it will still be more useful than a threshold.

*Why it matters:* A missing policy, an ambiguous order state and two policy versions that disagree are three situations calling for three different next steps. One threshold throws away exactly the information that would have said which — and a number below a threshold tells the person who receives it nothing about what to do.

*Example:* "No clause covers this" goes to whoever can decide policy. "Two clauses disagree" goes to whoever owns the policy. "The order state is unclear" is a lookup, not a judgement.

### 17. A person can take over, and is handed something

A person can take over a run in progress, and what they are handed is defined.

- [ ] Yes — this is designed. Next: Bring one handover and ask the person who received it whether they could act on it without asking a question.
- [ ] No — we have not designed this. Next: Define the handover payload first — it is the part that decides whether the person can act — then the route and the owner.
- [ ] Not yet defined. Next: Find out where a stopped run goes today and how long it sits there. If nobody can say, nothing is watching it.

*Why it matters:* "A human is in the loop" is not a design until you can say who, how they are reached, what they see, and what happens to the run while they decide. An intervention path that exists in principle is a queue nobody is watching.

*Example:* The assistant hands over the request, the order, the clauses it found and the reason it stopped — rather than a conversation for somebody to read from the top.

## Ownership

Who is answerable for the behaviour, and what happens when it changes.

### 18. A named owner, and one per tool

A named person or team owns the system’s behaviour, and each tool it calls has a named owner too.

- [ ] Yes — this is designed. Next: Bring the list and check that each named owner knows they are on it.
- [ ] No — we have not designed this. Next: Write the names down, including the ones that turn out to be the same person. The duplicates are worth seeing.
- [ ] Not yet defined. Next: Ask who would be called if the refund tool started behaving differently. The pause before the answer is the finding.

*Why it matters:* Most of the permission work happens on the far side of the tool boundary, which often means a different team, a different repository and a different review. A permission model that lives only in the agent’s codebase is one integration away from being bypassed, and the first sign of that is nobody being able to name who owns the tool.

*Example:* The assistant has an owner. So does the refund tool, and it is not the same team.

### 19. Prompt, model and scope changes get reviewed

A change to the prompt, the model or a tool’s scope goes through a review that records what changed and why.

- [ ] Yes — this is designed. Next: Bring the last three changes with their reasons, and check that a model version change is among the things that count.
- [ ] No — we have not designed this. Next: Put the prompt and the tool definitions where changes to them are reviewed the way code changes are, and record the reason alongside the diff.
- [ ] Not yet defined. Next: Find out how the current prompt got its last three edits, and whether anybody can say why. That is the change process as it exists.

*Why it matters:* Those three change behaviour without changing anything a test was written against. A prompt edit that widens what the system will attempt is a change to the design, and it should leave the same trace a code change does — otherwise the record of why the system behaves as it does has a hole in it exactly where the behaviour was decided.

*Example:* Widening the refund tool from "within the policy window" to "within the window, or where a manager has approved" is a design change with a record, not a configuration tweak.


---

Take your unanswered design questions into practical work and review. Explore The Living Craft’s October 2026 cohort: 30 live hours with Sunil Mathew, plus independent work. Apply at https://learning.thelivingcraft.ai/#apply
