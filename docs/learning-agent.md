# The learning agent

**Status:** design, not built. Supersedes parts of `learning-agent-28-august-2026.md`
(Ein Thangaraj's PoC write-up) — see *What changed* below.

A set of features inside `/craft` that serve two people at once: the learner,
who needs to know where they are and get an answer to a doubt; and Sunil, who
needs to see eight learners at once and aim the next session at what the room
actually got wrong.

It is deliberately **not** a code-review pipeline. See *What was cut*.

---

## 1 · What changed from the 28 August PoC

The PoC specified seven agents around an automated PR reviewer: a webhook, 60k
of context assembly, a 150–250k-token Opus call per PR, a grounding verifier, a
critic, and a signal-aggregation layer computing levels and scores from decayed,
clamped, confidence-discounted findings.

Four things killed it, in order of weight:

1. **Scale.** Eight learners over six weeks is ~50 PRs and maybe 300 findings,
   ever. Decay curves and corroboration rules are statistical machinery for a
   dataset that fits on one screen.
2. **The scoring math had no data to check itself against.** Its one worked
   example contradicted its own severity mapping, and Level 4 was unreachable
   because the sources feeding it were not on the build path. Every constant in
   it was invented.
3. **The safety argument was redundant.** The math was justified as stopping a
   compromised reviewer moving a learner's standing. Sunil's review gate already
   does that, earlier in the pipeline and more strongly.
4. **The critical path started with a boilerplate repository that does not
   exist**, in the month the cohort starts.

What survives from it, and is kept below: the reviewer's honest-gap reporting,
critic isolation, "relay, don't extend", the empty-state briefing rule, the
escalation relay, and the invariant that the model never writes a number.

**The ADR survives too, without the pipeline** — see §6.

---

## 2 · The two audiences

Every feature below is specified for both, because a feature that only serves
one of them is usually the wrong feature.

| | The learner gets | Sunil gets |
|---|---|---|
| Doubts | A fast answer on logistics; a real answer from Sunil on substance | *"Five people are circling the same confusion about evals"* — before Thursday |
| Reading | Current material aimed at what they rated low | Which items nobody opened |
| Feedback | A visible change next week | What to fix before the next session |
| Quiz | Calibration — where they are confidently wrong | The item distribution across eight |
| ADR | The discipline of defending a decision in writing | What nobody in the room mentioned |
| Familiarity | Their own before/after, in their own words | Where the room is, per capability |

**Nothing in this system assigns a learner a level, a score, or a rank.** Not to
them, not to Sunil, not internally. This is a decision, not an omission — see
§10.

---

## 3 · The vocabulary

Everything keys off the **thirteen capabilities already defined in
`src/lib/craft/intake.ts`** — `A1`–`A7` technical, `B1`–`B6` leadership — on the
intake's existing 1–5 behavioural scale ("Couldn't do it" → "Could lead & defend
it").

This replaces the PoC's invented `D1`–`D5` dimensions. The intake's list is
better on every axis that matters: it is in Sunil's words, it is behavioural
rather than abstract, it distinguishes technical from leadership capability, and
**every learner has already answered it at week 0**. The PoC specified an
"intake agent to establish baseline member state"; that baseline exists and is
readable at `/craft/admin/intake`.

One vocabulary, six surfaces. Sessions carry capability ids, quiz items carry
one, doubts are tagged with one, reading is matched against them, and the
week-6 re-ask reports movement on them. This is what makes the whole thing one
intern-sized project rather than six unrelated ones.

---

## 4 · The invariant

> **The model reads prose, groups it, and summarises it. Code counts, stores,
> and computes every number.**

Inherited from the PoC, which had it right, and consistent with how the rest of
this repo already works.

**The model does exactly four things:**

- tags an incoming doubt or feedback line to a capability id
- clusters doubts and summarises the clusters
- synthesises eight feedback responses into what to change this week
- reads eight ADRs and reports where the room converged, where it split, and
  **what nobody mentioned**

**Code does everything else:** storage, submission tracking, quiz scoring where
an item has a key, item-level distribution, the confident-wrong flag, the
quiz-vs-ADR comparison, the week-0/week-6 delta.

The model never grades an ADR, never scores a `judge` item, and never produces a
number that reaches a screen.

---

## 5 · Features

### 5.1 Doubts

Two kinds, split at capture. The split is the whole safety design:

- **Course doubts** — *when is the session, what is due, what is the format.*
  Answered directly from `src/data/facts.ts` and session frontmatter. No
  judgement, no risk.
- **Content doubts** — *why does idempotency matter here.* **Captured, tagged to
  a capability, clustered, routed to Sunil. Never answered with a fresh
  opinion.**

This is the PoC's "relay, don't extend" rule, reduced from a three-tier router
with a 100%-accuracy requirement to a two-way classification. The reduction is
deliberate: 100% classification accuracy is not an achievable engineering target,
and the failure mode here is harmless — a logistics question misfiled as content
means Sunil sees a question he did not need to see.

Where a doubt has an approved answer already (Sunil answered the same thing last
week), the agent may **relay it with a citation**. It may not extend it.

**Escalation is a success, not a failure.** If nobody is escalating, the agent is
overstepping. Kept from the PoC, where it was one of the better ideas.

### 5.2 Reading

`src/data/latest.json` already exists: a weekly, PR-reviewed feed written by
`scripts/gather-latest.ts`, with `title` / `body` / `source` / `tags`, on topics
that already map to the cohort's modules by design.

The work is a mapping from `tags` to capability ids. Suggestions then personalise
for free — a learner who rated `A5` (design an eval that catches a missed
failure) at 2 gets eval material first.

Mostly a filter, not an agent. A model writes only the one-line *why this, for
you*.

**Never `radar_findings`.** That store is operator-facing, accumulates
half-sourced claims by design, and `/api/ask` is already forbidden from touching
it. The same rule applies here, for the same reason. **`reviewNote` never
renders** to a learner.

### 5.3 Session feedback

Two questions after each session, maximum. *What landed? What was too fast or too
slow?* Eight learners × six sessions is 48 responses total.

The value is entirely in the turnaround being inside the week: eight responses
synthesised into *what to change before Thursday*. A summary that arrives after
the cohort is a cohort-2 artefact, not a teaching tool.

Two constraints that are easy to get wrong:

- **Do not promise anonymity.** With eight people the voice is recognisable.
  Attributed is fine among peers and more useful; aggregate is fine; claiming
  anonymity you cannot deliver is not.
- **Close the loop visibly** or the response rate collapses by week 3. *"You said
  the drill was rushed — week 4 gives it twenty more minutes."* That line is the
  feature.

The richer feedback signal is which topics generate doubts (§5.1). Same store,
read two ways.

### 5.4 Quiz

**This reverses a decision recorded in `docs/teaching/README.md`** ("The quiz
banks are teaching material, not an assessment product — there is no quiz surface
in `/craft` and none is planned"). That README must be updated when this ships;
a stale decision record is worse than none.

The source is the existing bank — `docs/teaching/quiz/week-N.md` — which already
carries what a learner-facing quiz needs: a topic tag, a difficulty, and the
rationale for every distractor.

**The three difficulties already in the bank decide how each item is used:**

| Difficulty | Where it goes | Scored by |
|---|---|---|
| `recall` | Quiz surface | Code, against the key |
| `apply` | Quiz surface | Code, against the key |
| `judge` | **The room, or the ADR prompt** | Nothing. Never auto-scored. |

`judge` items already say "no model answer, scored on the defence". Week 1's Q15
describes itself as *"the decision record, in miniature"* — that is an ADR
prompt, already written. Q8 and Q15 are both marked *After block*, which is the
homework slot.

**Every item carries a confidence rating.** This is the one addition to the
existing bank and the reason a quiz is worth giving to this room:
**confident-and-wrong is the only dangerous state**, and it is the characteristic
failure of experienced people meeting a new domain. Unsure-and-wrong is someone
learning normally. One extra radio button, the best signal in the system, and it
reframes the exercise as calibration rather than examination — which is how it
needs to read to eight senior engineers.

**Sunil sees item-level distribution across the room, not a percentage per
learner.** *"Five picked the queue, three picked direct calls"* opens a session.
A score does nothing.

#### The answer-key problem

**The bank contains answers and distractor rationale inline.** Rendering those
files to a learner would put the key on screen. This is the same class of failure
as `reviewNote` reaching a visitor, and it gets the same treatment:

- The bank in `docs/teaching/` stays the authoring surface and keeps everything.
- **One module owns the split** between learner-visible fields (stem, options)
  and teaching-only fields (answer, rationale, running notes), the way
  `src/lib/notes.ts` owns the `reviewNote` withholding.
- Both surfaces read that one module. **A second reader with its own filtering is
  how an answer key eventually reaches a learner.**
- The answer becomes visible to the learner only after they submit.

### 5.5 ADR

One page per week, tied to that week's assignment, on the decision the quiz
rehearsed.

Fixed template every week, so week 6 is comparable to week 1:

| Section | Purpose |
|---|---|
| **Context** | The constraint that forced a decision |
| **Decision** | What they chose |
| **Alternatives** | What they rejected, and **why it lost** |
| **Consequences** | What it costs later; what they would watch in production |
| **Unsure about** | One line — what they are least confident in |

- **Alternatives is the load-bearing section.** Anyone can state a decision. The
  rejected options are where judgement is visible, and it is the section a model
  writes worst — generated alternatives are plausible and generic, and it reads.
- **One page, capped.** The cap is a feature: it forces them to choose what
  matters, and it makes reading eight a week possible.
- **"Unsure about" is the cheapest input to the doubts inbox** — it surfaces what
  a senior engineer will not ask out loud.

Submission: paste the markdown into `/craft`, plus an optional repo/PR link.
**Snapshot on submit**, so Sunil's read is not against a moving target.

The repo link is not used at first. It exists so the one mechanical check can be
added later: **claims in the ADR that do not appear in the diff** (said it, did
not build it) and **dependencies in the diff the ADR never mentions** (shipped
it, never read it). The second is the fingerprint of unread AI output, and it is
the only instrument here that catches it.

#### The pairing

Quiz and ADR aim at the same decision. The quiz rehearses it in the abstract, the
assignment forces it, the ADR records it. Then one comparison, computed by code,
that neither artefact gives alone:

> **Did the ADR decision match the quiz answer?**

Someone who picks the right trade-off on Tuesday and does the opposite on Friday
has hit the exact gap the programme exists to close — knowing the principle, not
yet reaching for it under pressure.

### 5.6 Familiarity

**Re-ask the intake's thirteen questions in week 6.** Same wording, same scale,
against the learner's own week-0 answers.

No model, no inference, no level anyone can argue with — and it produces exactly
the evidence the programme's outcome claims need. The intake's `r6` already asks
for *"one outcome you want to walk away able to do"*; the delta answers whether
they did.

- **Learner sees:** their own before/after on thirteen named capabilities, and
  which ones they have not touched.
- **Sunil sees:** the room. *"Six of eight rated A5 at 2 or below."* That aims
  week 3 before it is taught.
- **The one thing worth a model:** disagreement between what a learner *says* and
  what they *show* — self-rates `A5` at 4, asks no eval questions all cohort, and
  writes an ADR with no eval in it. A flag for Sunil to look at. Not a score.

A mid-cohort re-ask at week 3 is optional. With eight people it is probably
redundant.

---

## 6 · Where things live

The repo already decided this, in `src/content/config.ts`:

> *"Session material is written once, read by eight people, and revised between
> cohorts. Putting it in Postgres would mean an editor to build and no
> history… Supabase holds the people, not the teaching."*

| Thing | Where | Why |
|---|---|---|
| Session bodies, topics | `src/content/sessions/*.md` | Already there |
| Quiz items, answers, rationale | `docs/teaching/quiz/week-N.md` | Already there; authored prose, revised between cohorts |
| Assignment briefs, ADR prompts | Alongside the session | Same |
| Submissions, quiz responses, confidence | Supabase | People, not teaching |
| Doubts, feedback | Supabase | Same |

The instinct will be to put questions in the database and build an editor for
them. That is the wrong side of a line this repo has already drawn, and it costs
you the diff review and the version history.

---

## 7 · Data model

New tables, all in `supabase/schema.sql`:

    submissions        learner_id, week, adr_markdown, repo_url, submitted_at
    quiz_responses     learner_id, item_id, answer, confidence, answered_at
    doubts             learner_id, body, kind, capability_id, cluster_id, status
    feedback           learner_id, week, landed, pacing, created_at

Three rules, none of them optional:

1. **Every one of these is keyed to `learner_id` and needs `ON DELETE
   CASCADE`.** Erasing a learner from `/craft/admin/learners` is a hard delete
   answering a DPDP request. A table that does not cascade leaves orphaned
   personal data behind and the console cannot see it.
2. **Every new table and rollup goes in the probe lists in
   `src/lib/admin/health.ts`.** Queries degrade to empty on error, so a missing
   table renders identically to "no submissions yet". This already cost a real
   diagnosis once on `/craft/admin/radar`.
3. **Run `supabase/schema.sql` against prod before pushing.** A push to `main`
   deploys production, and nothing checks that the database has the tables the
   code expects.

---

## 8 · Build order

Each item ships standalone. The first three need no model at all, which is
deliberate — the risky parts come after the boring parts work.

| # | Item | Model? | Notes |
|---|---|---|---|
| 0 | `topics: string[]` on the session schema, tagged to capability ids | no | Everything keys off this. Half a day. |
| 1 | Reading suggestions from `latest.json` | no | Safest first ticket |
| 2 | Doubt capture — form, table, `/craft/admin/doubts` | no | Just an inbox at this stage |
| 3 | Assignment + ADR submission, and the who-has-submitted view | no | The tracking substrate |
| 4 | Quiz surface, with the answer-key split | no | Scoring is code; §5.4 |
| 5 | Doubt clustering and capability tagging | **yes** | First model work |
| 6 | Session feedback + synthesis | **yes** | |
| 7 | ADR summary across the room, incl. *what nobody mentioned* | **yes** | |
| 8 | Week-6 re-ask + before/after view | no | Reuses intake code |
| 9 | Quiz-vs-ADR comparison | no | Cheap once 3 and 4 exist |

Items 0–4 are shippable before the cohort starts and are worth having even if
nothing after them is ever built.

---

## 9 · Rules that cannot be inferred from the code

For whoever is building this — these are load-bearing and the code does not
announce them.

- **`/craft` is never prerendered.** A static file under `dist/` is served
  without the middleware, which is the gate gone.
- **All `/craft` pages go through `CraftLayout.astro`**, sign-in included.
- **`craft.css` is additive to `global.css`, never a replacement.** Namespace
  anything generic — a bare `.mod` collides with the public module card and
  renders inside a phantom nested card. A panel gets a shadow **or** a border,
  never both. If it is yellow it is clickable; `--sun` is a fill and cannot carry
  text, so a status pill is never sun.
- **No `localStorage` or `sessionStorage`, anywhere.**
- **Offer facts come only from `src/data/facts.ts`.** Never state a price, date
  or seat count in a page, a schema block, or an agent prompt.
- **Never surface `radar_findings` to a learner. Never render `reviewNote`.**
- **Never move a Web3Forms call server-side** — it is client-side only on the
  free plan and returns 403 from a server.
- Everything in `docs/` is unrendered and undeployed. Anything that must reach a
  learner has to be published through a module that strips the teaching-only
  fields (§5.4).

---

## 10 · What was cut, and why

Recorded so it is not silently re-proposed.

- **The PR review pipeline** (webhook, context assembly, reviewer call, grounding
  verifier, critic). §1. The ADR keeps the valuable half at roughly 2% of the
  cost.
- **Signal aggregation — levels, scores, decay, clamping, corroboration.** §1.
  The invariant "the model never writes a number" survives intact with counts:
  *"D4 — three concerns, two strengths, across four PRs"* is code-computed,
  exactly traceable, and has nothing to calibrate. Revisit after cohort 1, when
  there are real approved findings to calibrate constants against instead of
  invented ones.
- **Any learner-facing level, score or rank.** Against a room of eight
  director-level engineers, "Level 2, trend →" invites an argument about the
  decay curve. "Three concerns on security, here they are" does not.
- **A5 session agent** (transcript processing). Recording, transcription,
  diarisation and per-speaker attribution across eight people is an entire
  product, for six sessions.
- **A4 assessment agent** as specified — replaced by the quiz, which has a
  human-authored bank.
- **Messages, full-text search, module progress percentages, profile stats,
  settings, anonymised cross-learner comparison.** A backend each, for eight
  people who have Sunil's phone number.
- **Golden sets as a pre-build content deliverable.** If an eval harness is ever
  needed, Sunil's edits at the review gate are the labels — run in shadow mode
  for a week and the set writes itself from real learner work.
- **Automated nudges to learners about missing submissions.** The dashboard tells
  Sunil; Sunil reaches out. Automated chasing of senior professionals reads as
  surveillance — the same reasoning that cut read receipts in the PoC.

---

## 11 · Open questions

- **Weeks 2–6 of the quiz bank do not exist.** Week 1 has fifteen questions;
  everything after it is unwritten, as are the session bodies themselves
  (`status: draft`, placeholder text). This is the binding constraint on the
  whole design — it is authoring, not engineering.
  - Mitigation: the session scaffold already contains all three artefacts.
    §2 *The Problem* is the quiz item, §3 *The Drill* is the assignment, and the
    decision the drill forces is the ADR prompt. They are extractions from a
    session you are writing anyway, not three new things per week.
- **Does the quiz go before or after the session?** Specified above as after —
  it bridges the session and the assignment. Before-the-session has a real
  argument too (it tells Sunil what the room already knows, in time to change the
  session), and the two are not exclusive if items are cheap enough.
- **Attributed or aggregate feedback?** §5.3. Needs deciding before the form is
  built, not after.
- **Who owns the teaching Artifact republish** once quiz items have a second
  consumer? Editing the bank currently means republishing the Artifact by hand.
