# Learning agent — build status

**Audited against:** [`docs/learning-agent-specs-02-09-2026.md`](../learning-agent-specs-02-09-2026.md)
**Branch:** `feat/learner-dashboard-poc`
**Last updated:** 2 September 2026

> **This is a living document.** Every change to the learning agent updates it in the
> same commit as the code. A status line that is right on the day it was written and
> wrong a week later is worse than no status line — the whole point is that someone
> can read this instead of re-auditing the branch.
>
> Keep the counts in the summary in step with the checkboxes below them.

> ### ⚠ Run `supabase/schema.sql` before the next deploy
> Not yet applied: the `doubts.answer_source` and `submissions.status` columns, and the
> `feedback_responses` table. All additive, and the file is idempotent — re-run the whole
> thing in the Supabase SQL editor. A push to `main` deploys production and nothing
> checks that the database has what the code expects.

---

## Summary

| | Count | |
|---|---|---|
| Done, and done right | **37** | was 14 |
| Built, but contradicts the spec | **0** | was 7 — all fixed |
| Specified, not yet built | **1** | was 10 |
| Content gaps (writing, not engineering) | **2** | was 5 |

**Every engineering item in the spec is now built except one** — reading opens. What is
left is authoring: the quiz bank, and the session bodies weeks 2–6 come from.

---

## The six surfaces at a glance

The spec's own test (§2): *"a feature that only serves one of them is usually the wrong
feature."*

| Surface | What the learner gets | What Sunil gets |
|---|---|---|
| **Doubts** (§5.1) | 🟢 Logistics answered from the syllabus by code; anything about the material goes to Sunil and says so | 🟢 Grouped by theme, ordered by how many people are in each; he can answer in his own words |
| **Reading** (§5.2) | 🟢 Suggestions matched to their weakest ratings | ⚪ No way to see which items nobody opened |
| **Feedback** (§5.3) | 🟢 Captured, and *"what changed"* is listed on the page they submit from | 🟢 Weekly synthesis, plus a box to publish the change back to the room |
| **Quiz** (§5.4) | 🟢 One question at a time, with a confidence rating; `judge` items excluded | 🟢 Per-question spread across the room, confidently-wrong first |
| **ADR** (§5.5) | 🟢 Draft freely, submit once — then it is frozen | 🟢 Room summary, who has not submitted, and the computed quiz/ADR match |
| **Familiarity** (§5.6) | 🟢 Own before/after on thirteen capabilities | 🟢 Room view per capability, plus the says-but-has-not-asked flag |

🟢 done · 🟡 partial · 🔴 contradicts the spec · ⚪ not started

---

## 1 · Done, and done right

- [x] **The four new database tables are correct.** Cascade on learner erasure, RLS on,
      zero policies, revoked from `anon`/`authenticated`. — `supabase/schema.sql`
- [x] **Sessions carry capability tags and an assignment title.** — `src/content.config.ts`
- [x] **Personalised reading suggestions.** Never touches the radar store, never shows
      `reviewNote`. — `src/lib/craft/reading.ts`
- [x] **ADR submission with the fixed five-section template.** — `src/pages/craft/adr.astro`
- [x] **The confidence rating on every quiz answer.** — `quiz_responses.confidence`
- [x] **The answer key never reaches a learner early.**
- [x] **Judgement items are never auto-scored** — and, since this pass, never reach the
      quiz surface at all. §5.4 routes them to the room or the ADR prompt.
- [x] **The week-6 re-ask, with a before/after table.** — `src/pages/craft/familiarity.astro`
- [x] **"What nobody mentioned" is in the ADR summary.**
- [x] **Weekly feedback capture and synthesis.**
- [x] **The model never writes a number.** Verified again after this pass: the quiz
      distribution, the cluster counts, the room view and the quiz/ADR verdict are all code.
- [x] **No browser storage anywhere.**
- [x] **Every `/craft` page still runs through the gate.**
- [x] **Every console page is in the nav**, and `active` is now derived from that list, so
      a new page cannot be added to one and forgotten in the other.

### Fixed in this pass

- [x] **Doubts are captured and routed, never answered with an opinion.** The generic AI
      tutor prompt is gone. Content doubts are tagged, clustered and go to Sunil.
      — `src/lib/craft/doubts.ts`
- [x] **Logistics questions are answered from `facts.ts` and session frontmatter**, by code,
      reusing the visitor agent's own lexical scorer rather than a second copy of it. Below
      the score threshold it escalates instead of guessing.
- [x] **Escalation means a human.** `doubts-escalate` (which re-ran the question through a
      larger model) is replaced by `doubts-send-to-sunil`. The learner sees "sent to Sunil"
      as a result, not a failure.
- [x] **Sunil can answer a doubt in his own words**, and only those answers are eligible to
      be relayed verbatim — with a citation and a date — to the next person who asks the
      same thing. Relay never extends. — `/admin/doubts`
- [x] **All four model names corrected** to `claude-haiku-4-5-20251001`.
- [x] **Both synthesis endpoints moved from `GET` to `POST`**, so a prefetch or a refresh
      cannot bill.
- [x] **`familiarity_responses` added to the health probe list.** — `src/lib/admin/health.ts`
- [x] **A submitted ADR is frozen.** Draft freely; submitting snapshots it. Reopening is a
      conversation with Sunil, not a button. — `submissions.status`
- [x] **The one-page cap is enforced** at 6,000 characters, with the reason stated on the form.
- [x] **The four panels with both a border and a shadow are fixed** (§9).
- [x] **One module owns the answer-key split.** `getLearnerItems()` returns stem and options
      and nothing else; `getQuizItems()` is the teaching-side read. The stripper is an
      explicit field list, so a new teaching-only field is withheld by default rather than
      leaking until someone remembers it. — `src/lib/craft/quiz.ts`
- [x] **Doubt clustering.** Grouped by theme, ordered by how many *different* people are in
      each — "five people are circling the same confusion about evals."
- [x] **Per-question spread across the room**, with the **confident-and-wrong flag** first.
      No percentage per learner anywhere. — `/admin/quiz`
- [x] **The quiz/ADR match, computed by code.** Five verdicts including *knew it, did not
      reach for it* — and an honest `unclear` when the record does not lean far enough to
      say. — `src/lib/craft/pairing.ts`
- [x] **The familiarity room view**, weakest capability first, plus the says-but-has-not-asked
      flag. — `/admin/familiarity`
- [x] **Who has not submitted**, computed against the active roster. Nothing chases anyone
      automatically (§10). — `/admin/adrs`
- [x] **The two orphan pages are linked** — `/craft/familiarity` and `/craft/feedback` in the
      course sidebar, `/admin/quiz-adr-comparison` and `/admin/familiarity` in the console nav.
- [x] **The feedback loop is closed, visibly.** Sunil writes *"you said the drill was
      rushed — week 4 gives it twenty more minutes"* on `/admin/feedback`, saves it as a
      draft or publishes it, and the cohort reads it on the page they submit feedback
      from. §5.3 says that line **is** the feature. — `feedback_responses`
- [x] **The quiz bank is one file per week**, and items carry their own `week`. Nothing
      reverse-maps capability → `session.topics` to guess which week an answer belongs to
      — a derivation that was ambiguous the moment two weeks shared a capability, which
      they will, since the thirteen are revisited across six weeks.
- [x] **Duplicate item ids are caught loudly.** Ids key stored responses, so a repeat
      across two week files would silently merge two questions' answers.
- [x] **`docs/teaching/README.md` records the quiz reversal** §5.4 asked for: what changed
      the decision (the confidence rating) and what stayed cut (any score, level or rank).
- [x] **`CLAUDE.md` is current** — thirteen tables listed and split practice/cohort, the
      six learner surfaces and six console pages named, the Node ≥ 22.12 requirement and
      the `astro check` baseline of 11 pre-existing errors recorded.
- [x] **The `/craft` gate bypass is removed.** `src/middleware.ts` carried a `PoC BYPASS`
      that injected a mock learner and returned before the seat check — anyone could open
      `/craft` with no code. Real gate restored. It also accounted for 3 of the 11
      "pre-existing" `astro check` errors I'd wrongly attributed to the file itself: the
      mock object was missing `note` and `last_seen_at`. **Baseline is now 8, not 11**, all
      in `GuideSidebar.astro`. See [guided-walkthrough/plan.md](guided-walkthrough/plan.md)
      §14 for why that panel is a mock worth fixing next, not a stray error.

---

## 2 · Built, but contradicts the spec

**None outstanding.** All seven items from the first audit are fixed — see *Fixed in this
pass* above.

---

## 3 · Specified, not yet built

- [ ] **Which reading nobody opened.** Sunil's half of the reading feature — the last
      one-sided surface. Needs a small table (learner, item id, opened_at) and a panel.
      Left last on purpose: it is the only item here whose value depends on the cohort
      actually running, since there is nothing to count before then.

---

## 4 · Content gaps — writing, not engineering

The spec flags this (§11) as the binding constraint on the whole design, and it still is.
**Nothing in section 1 does much until this is done** — the room views have one question
to distribute.

- [ ] **The quiz bank contains one item.** `docs/teaching/quiz/week-1.md` holds `item-01`.
      Week 1 needs about fifteen; weeks 2–6 need a file each. The format, the parser, the
      answer-key split and both room views are finished and waiting on content.
- [ ] **Weeks 2–6 have no session body.** `status: draft`, placeholder text, and
      `assignment: "TBD"`. The quiz items and ADR prompts are extractions from these, so
      this is the actual first domino.

**Closed since the last pass:**
- ~~Questions aren't organised by week~~ — the bank is now one file per week and items
  carry their own `week`, so nothing reverse-maps capability → session to guess.
- ~~Only week 1 is tagged with capabilities~~ — no longer load-bearing. Items bind to a
  week directly; `topics` on a session is still useful for reading suggestions but no
  longer gates the pairing.
- ~~The project docs are behind the code~~ — `CLAUDE.md` now says thirteen tables and
  describes the six learner surfaces and six console pages;
  `docs/teaching/README.md` records the quiz reversal §5.4 asked for.

*(No session is marked `taughtOn`, so the feedback form still shows nothing. That is
correct before the cohort starts, not a bug.)*

---

## 5 · What to do next, in order

| # | Step | State |
|---|---|---|
| 1 | Stop the doubts agent answering | ✅ done |
| 2 | Fix the four model names | ✅ done |
| 3 | Add the missing table to the health check | ✅ done |
| 4 | Link the two orphan pages, fix the four panels | ✅ done |
| 5 | Lock an ADR when it's submitted | ✅ done |
| 6 | Build Sunil's four missing views | ✅ done |
| 7 | Close the feedback loop | ✅ done |
| 8 | Write the quiz bank | **next, and not engineering** — format and parser are done |
| 9 | Update `CLAUDE.md` and the teaching README | ✅ done |

**On step 8** — the spec's own mitigation (§11): each session already contains all three
artefacts. §2 *The Problem* is the quiz item, §3 *The Drill* is the assignment, and the
decision the drill forces is the ADR prompt. Extractions from a session being written
anyway, not three new things per week.

---

## Decisions taken while building, that the spec did not settle

Recorded here so they are not silently re-litigated.

- **Course doubts are answered without a model at all.** §4 lists the four things a model
  may do and answering a learner is not one of them, so the answer is lexical retrieval over
  `facts.ts` plus session frontmatter, relayed verbatim with a citation. Below the score
  threshold it escalates. This also means the feature works with no `ANTHROPIC_API_KEY`.
- **The doubts classifier shares the visitor agent's scorer** rather than carrying its own.
  Two lexical implementations drift, and the one that drifts decides whether a learner's
  question was answerable or goes to Sunil.
- **ADRs get a draft state.** The spec says "snapshot on submit", which implies a
  before-submit state; a single irreversible Save with no draft would have been harsher than
  the spec asks for.
- **The quiz/ADR verdict can be `unclear`, and that is a correct answer.** Comparing prose to
  option text lexically is weak. Reporting a coin-flip as a finding would be exactly the
  invented confidence §10 cuts, so a thin margin returns no verdict and says so on screen.
- **`judge` items are excluded from the quiz surface entirely**, not shown-and-not-scored.
  §5.4's table routes them to the room or the ADR prompt.

---

## Related

- [guided-walkthrough/plan.md](guided-walkthrough/plan.md) — a product tour of `/craft` for
  first-time learners: a 90-second spine that auto-starts on first sign-in, plus per-page
  tours pulled from a permanent ⓘ. **Design, not built**, and not something the spec asked
  for. It also carries two decisions that land outside it:
  - **Familiarity comes out of the sidebar** and becomes a dashboard card at week 6,
    matching how intake is already handled. (It is in the rail today because of the
    "link the orphan pages" fix — the wrong lever.)
  - **The right-hand Guide panel becomes a doubts widget**, not a tutor chat. It is
    currently a mock whose canned replies advertise the killed PoC design, and making it
    real as written would violate §5.1. The tour cannot ship over the top of it.

---

## Changelog

| Date | Change |
|---|---|
| 2 Sep 2026 | First audit of `feat/learner-dashboard-poc` against the 2 September spec. |
| 2 Sep 2026 | Steps 1–6 done. All seven spec contradictions fixed; eight of ten missing items built. Two schema columns added — run `supabase/schema.sql` before deploying. |
| 2 Sep 2026 | Steps 7–9 done. Feedback loop closed both ways (`feedback_responses`); quiz bank restructured to one file per week with items carrying their own `week`; `CLAUDE.md` and the teaching README brought up to date. Only reading-opens and the authoring remain. |
| 2 Sep 2026 | Guided-walkthrough plan written ([guided-walkthrough/plan.md](guided-walkthrough/plan.md)), design only. Removed the `/craft` `PoC BYPASS` in `src/middleware.ts` before committing — it disabled the seat gate entirely. `astro check` baseline corrected from 11 to 8. |
