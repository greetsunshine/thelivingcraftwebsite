# Rule Placement Audit

**Where is each hard rule actually enforced?**

Built by Sunil Mathew, co-authored with Claude. The same audit, with the status and the rule map worked out as you go: https://learning.thelivingcraft.ai/resources/rule-placement-audit

## What to bring

A list of the rules your agent must never break (for example user no-go lists, allergens, spending limits, regions you can't serve), and a rough sketch of how one request travels through your system, from the user's input to the answer they see.

## What you do

For each rule, mark where it is enforced: in code before the model sees the inputs, in the prompt, in code after the model answers, or nowhere. Flag every rule enforced only in the prompt or nowhere, and note the filter or check it needs.

## What you leave with

A one-page map of your agent's hard rules and where each one is enforced, with the prompt-only and unenforced rules flagged as the first to move into code.

## How to run it with a team

1. **List the rules before anyone opens the code.** Ask each person to write down the rules the agent must never break. The union of the lists is the sheet. The rules only one person knew about are the ones to worry about.
2. **Trace one request, and tick what you can point at.** For each rule, follow one request from input to answer and tick a placement only when someone can name the file, the prompt line or the tool setting that enforces it. A placement nobody can point at is not ticked.
3. **Fill "What happens if it is broken" in one sentence each.** That sentence is what decides the order of the fixes. A rule with a refund in it goes before a rule with a tone in it.
4. **Give every flagged rule an owner and a fix, then print the map.** The map is the artefact. The prompt-only and model-only rows at the top are the first pull requests.

## The columns

- **Who set it:** User (a preference or a limit the user gave you); Business (a policy the company set); Legal or regulatory (a law, a licence or a regulator).
- **Agents that can act on it:** One agent (only one agent can take an action this rule covers); More than one (two or more agents, or an agent and a scheduled job, can take that action); Not sure (nobody has listed which agents can act on it).
- **In code, before the model:** a filter removes what the model must never choose before the model sees the inputs. Tick it only when someone can point at it.
- **In the prompt:** the rule is written in the system prompt or the instructions; the model weighs it. Tick it only when someone can point at it.
- **By another model:** a critic, a judge, a guardrail model or a reviewer agent checks the step; also weighed. Tick it only when someone can point at it.
- **In code, after the model:** a check tests the answer or the action against the rule before the user sees it or it runs. Tick it only when someone can point at it.
- **In code, at the tool or data boundary:** the tool, the API or the database refuses, whichever agent asked. Tick it only when someone can point at it.
- **Fix to add:** Filter before the model; Check after the model; Both; Enforce at the tool or data boundary; None needed.

## Reading a row: the status

| When | Status | What it means |
|---|---|---|
| No placement ticked | Not enforced | The rule exists in a document or in somebody’s head. Nothing in the system reads it. |
| Only "In the prompt" ticked | Prompt only | The model reads the rule and usually follows it. Some of the time it does not, and nothing notices. |
| "By another model" ticked, and no code placement | Model only | A second model reads the step and usually catches the break. It is graded on the same distribution as the first one, and the same inputs fool both. |
| Any of "In code, before", "In code, after" or "at the boundary" ticked | Enforced in code | Code either runs or it does not. If the rule is broken, the check itself has a bug, which is a bug you can find. |

Move these into code first.

## The worksheet

One row per rule. Mark each placement column with an x when it applies.

| # | Rule | Who set it | Agents that can act on it | In code, before the model | In the prompt | By another model | In code, after the model | In code, at the tool or data boundary | Status | What happens if it is broken | Fix to add | Owner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |  |  |  |  |
| 11 |  |  |  |  |  |  |  |  |  |  |  |  |
| 12 |  |  |  |  |  |  |  |  |  |  |  |  |

## Why placement matters

A rule written in the prompt is one input among many. The model weighs it against the user’s message, the retrieved data and everything else in the context. Most of the time it complies. Some of the time it does not, and nothing in the system notices. A critic model checking the step is the same thing twice: a second weighing, with the same blind spots.

Code does not weigh. There are two places to put a rule in code. A filter before the model removes what the model must never choose before it sees the inputs: if the blocked restaurants are not in the candidate list, the model cannot recommend one. A check after the model tests the answer or the action against the rule before it reaches the user or runs. When more than one agent can act, put the check at the tool or data boundary, so it holds whichever agent asked.
