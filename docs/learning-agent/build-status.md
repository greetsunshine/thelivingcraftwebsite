# Learning agent — build status

**Audited against:** [`docs/learning-agent-specs-02-09-2026.md`](../learning-agent-specs-02-09-2026.md)
**Branch:** `feat/learner-dashboard-poc`
**Last updated:** 4 September 2026

> **This is a living document.** Every change to the learning agent updates it in the
> same commit as the code. A status line that is right on the day it was written and
> wrong a week later is worse than no status line — the whole point is that someone
> can read this instead of re-auditing the branch.
>
> Keep the counts in the summary in step with the checkboxes below them.

> ### ⚠ Run `supabase/schema.sql` before the next deploy
> Not yet applied: the `doubts.answer_source` and `submissions.status` columns, the
> `feedback_responses` table, and — new on 4 September — the **`discussion_replies`
> table** plus five additive columns on `doubts` (`visibility`, `title`, `pinned`,
> `resolved_reply_id`, `endorsed_reply_id`), the **`session_prompts` table** (with its `phase` column), and the **`capability_pulses` table**. All
> additive, and the file is idempotent — re-run the whole thing in the Supabase SQL
> editor. A push to `main` deploys production and nothing checks that the database has
> what the code expects.
>
> Until it is run, `/craft/discussion` posts nothing and the console shows the "table is
> not answering" banner. That is the designed failure and not a crash, but it is also
> indistinguishable from a quiet week if you are not expecting it.

---

## Summary

| | Count | |
|---|---|---|
| Done, and done right | **71** | was 14 |
| Built, but contradicts the spec | **0** | was 7 — all fixed |
| Specified, not yet built | **1** | was 10 |
| Content gaps (writing, not engineering) | **2** | was 5 |

**Every engineering item in the spec is now built except one** — reading opens. Since the
audit the surfaces are also responsive, the agent is docked to the bottom of every `/craft`
page, the dashboard carries a to-do panel, and **Doubts has become the cohort discussion
forum**; none of those were spec items, and the last is a change to what §5.1 *is* rather
than to how well it is implemented — see *Added 4 September* below. What is left is
authoring: the quiz bank, and the session bodies weeks 2–6 come from.

---

## The six surfaces at a glance

The spec's own test (§2): *"a feature that only serves one of them is usually the wrong
feature."*

| Surface | What the learner gets | What Sunil gets |
|---|---|---|
| **Discussion** (§5.1) | 🟢 A cohort forum. Logistics still answered from the syllabus by code; everything else goes to the room *and* to Sunil, and peers can answer each other | 🟢 Peer answers he has not checked, first; then unanswered threads; then the theme clusters. Endorse, correct, or pin |
| **Reading** (§5.2) | 🟢 Suggestions matched to their weakest ratings | ⚪ No way to see which items nobody opened |
| **Feedback** (§5.3) | 🟢 Prompted once when the session ends, then a standing to-do until it is in; *"what changed"* is listed on the page they submit from | 🟢 Weekly synthesis, plus a box to publish the change back to the room |
| **Quiz** (§5.4) | 🟢 One check per week, opening when that session ends and prompted once at that moment; one question at a time with a confidence rating; `judge` items excluded | 🟢 Per-question spread across the room, confidently-wrong first |
| **ADR** (§5.5) | 🟢 One per assignment actually given, with the brief and the week's check on the page; draft freely, submit once — then it is frozen | 🟢 Room summary, who has not submitted *against given weeks only*, and the computed quiz/ADR match |
| **Familiarity** (§5.6) | 🟢 A short pulse either side of every session on just what it covers, plus the week-6 before/after on all thirteen | 🟢 What each session actually moved, smallest movement first; room view per capability; the says-but-has-not-asked flag |

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

- [x] **Questions are captured and routed, never answered with an opinion.** The generic AI
      tutor prompt is gone. Content threads are tagged, clustered and go to Sunil.
      — `src/lib/craft/discussion.ts`
- [x] **Logistics questions are answered from `facts.ts` and session frontmatter**, by code,
      reusing the visitor agent's own lexical scorer rather than a second copy of it. Below
      the score threshold it escalates instead of guessing.
- [x] **Escalation means a human.** `doubts-escalate` (which re-ran the question through a
      larger model) is gone. The learner asks Sunil to weigh in and sees that as a result,
      not a failure. — the `ask-sunil` action on `/api/craft/discussion`
- [x] **Sunil can answer in his own words**, and only those answers are eligible to
      be relayed verbatim — with a citation and a date — to the next person who asks the
      same thing. Relay never extends. — `/craft/admin/discussion`
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
- [x] **Thread clustering.** Grouped by theme, ordered by how many *different* people are in
      each — "five people are circling the same confusion about evals."
- [x] **Per-question spread across the room**, with the **confident-and-wrong flag** first.
      No percentage per learner anywhere. — `/craft/admin/quiz`
- [x] **The quiz/ADR match, computed by code.** Five verdicts including *knew it, did not
      reach for it* — and an honest `unclear` when the record does not lean far enough to
      say. — `src/lib/craft/pairing.ts`
- [x] **The familiarity room view**, weakest capability first, plus the says-but-has-not-asked
      flag. — `/craft/admin/familiarity`
- [x] **Who has not submitted**, computed against the active roster. Nothing chases anyone
      automatically (§10). — `/craft/admin/adrs`
- [x] **The two orphan pages are linked** — `/craft/familiarity` and `/craft/feedback` in the
      course sidebar, `/craft/admin/quiz-adr-comparison` and `/craft/admin/familiarity` in the console nav.
- [x] **The feedback loop is closed, visibly.** Sunil writes *"you said the drill was
      rushed — week 4 gives it twenty more minutes"* on `/craft/admin/feedback`, saves it as a
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

### Added 4 September — Doubts became Discussion

A product change, not a refactor: the private learner→Sunil inbox is now the cohort's
forum. Learners answer each other; Sunil arrives to endorse or correct.

- [x] **`/craft/discussion` and `/craft/discussion/[id]`.** A thread list with four filters
      (all · needs an answer · Sunil answered · mine) and a thread page. Both replace
      `/craft/doubts`, which is gone. The console counterpart is `/craft/admin/discussion`.
- [x] **Three author roles, and they cannot be mistaken for one another.** `learner`,
      `instructor`, `system` — carried in a column, not inferred. A peer gets their face
      and name; Sunil gets a rule down the side and a lifted card; the syllabus gets
      machine-orange and the words *not a person*. This is the whole safety argument of
      opening the surface up, and it is carried by the layout rather than by a rule
      somebody has to remember. — `src/lib/craft/discussion.ts`
- [x] **§5.1 survives the change, structurally.** It said content questions are never
      answered with a fresh opinion — written about a *model*. Peers are not models, but a
      confident wrong answer from the next desk is the same failure with a friendlier face.
      So relay now filters on `author_role = 'instructor'`: no number of "solved it" marks
      can promote a peer's reply into something the machine repeats as fact.
- [x] **Two marks, deliberately not merged.** `resolved_reply_id` is the *asker's* report
      that something unblocked them; `endorsed_reply_id` is *Sunil's* claim that it is
      right. Every forum collapses these into one "accepted answer"; that is exactly how a
      grateful asker promotes a wrong answer into the cohort's working belief.
- [x] **The console leads with the queue that costs something.** *Answered by the room,
      unchecked by you* sits above the unanswered threads and above the clusters, because
      an uncorrected peer answer becomes what the cohort believes. — `needsReview()`
- [x] **Private threads survived.** "I'm behind and don't want to say so in front of the
      room" only ever gets asked in private. The visibility filter is applied in the
      **query**, not the template, and restated in `getThread()` because a direct URL is a
      second door.
- [x] **Peer text is never parsed as markdown.** Learner writing is now read by *other
      learners*, and `marked()` passes raw HTML through untouched. Only trusted authors
      (Sunil, behind the console password) and the code-written syllabus relay are parsed.
- [x] **`discussion_replies` added to the health probe list.** — `src/lib/admin/health.ts`

Not done, and deliberately: no notifications, no @-mentions, no reply threading. Eight
people in one room for six weeks do not need a notification system, and §10 says nothing
chases anyone automatically.

### Added 4 September — the check opens when the session ends

Sunil's ask: *"the knowledge check should pop up as soon as the session is over"*, while
staying available under the Quiz tab.

- [x] **A check now belongs to a week.** `/craft/quiz` was one flat sequence across the
      whole bank, which made "this week's check" a phrase with nothing behind it. The tab
      is now a list of weekly checks and `?week=N` runs one. — `src/lib/craft/checks.ts`
- [x] **`endsAt` on the session frontmatter** — a full ISO timestamp *with an offset*,
      because "is the session over" is a question about an instant and the cohort sits in
      three time zones. **Every session file is unset**; Sunil fills in the real timetable.
- [x] **Absent `endsAt` opens nothing and pops nothing.** No fallback to `taughtOn`, to
      end-of-day, or to a guessed duration. Guessing when a session ended is inventing a
      fact, and the failure mode is a modal interrupting eight senior engineers at the
      wrong hour. Today the quiz tab says so plainly rather than rendering blank.
- [x] **A check is refused before it opens**, on the URL and not just on the link.
      `?week=4` in week 2 redirects to the list. This is not an answer-key leak
      (`getLearnerItems()` already strips the key) — it is that spending the questions
      before the teaching turns calibration back into a quiz.
- [x] **The prompt is shown once, and dismissal is permanent.** `session_prompts`, one row
      per learner per week. Escape, the scrim and *Later* are all the same permanent
      dismissal, and following any of its links dismisses it too.

### Added 4 September — session feedback joins the same prompt

Sunil's ask: *"prompt once after the weekly session ends, and if they don't fill it, add it
to the to-do tab as a reminder."*

- [x] **ONE prompt per session, not one per task.** Feedback and the knowledge check open
      at the same instant — the session ending — so a second modal would have raced the
      first onto the same dashboard. Two stacked dialogs are not twice the prompt; they are
      a thing people click past. One card names whatever is actually outstanding.
      — `src/lib/craft/prompts.ts`
- [x] **Feedback leads when both are open.** Sixty seconds against several minutes, and it
      is the one that decays: *"was the pacing right"* is worth asking on the day and
      nearly worthless a week later.
- [x] **The to-do panel is the reminder that outlives a dismissal.** This is the half that
      keeps the whole thing honest under §10 — what survives is a passive list the learner
      opens themselves, not a second prompt, an email, or an escalation.
- [x] **The check falls through to the to-do too**, for the same reason, and now counts
      only OPEN checks. It previously counted the whole bank, which would have put week 4's
      questions on the list in week 2 for a check that could not be taken.
- [x] **`/craft/feedback` honours `?week=N`**, like the quiz and the ADR page, so being
      asked about one session does not land you on a stack of three.
- [x] **A fifth definition of "the session happened" is gone.** `/craft/feedback` filtered
      on `taughtOn` — which would have made the prompt link to an empty page the moment
      `endsAt` was set and `taughtOn` was not. Everything now reads `sessionEnded()`.
- [x] **`quiz_prompts` became `session_prompts`** when the feedback form joined it. The old
      name never reached production, so this is a rename in an unapplied file rather than a
      migration.

### Added 4 September — the familiarity check runs twice a week

Sunil's ask: *"2 times in a week, 1 before and 1 after the session."*

- [x] **A pulse is THREE questions, not thirteen.** It covers only the capabilities that
      session's `topics` names. Twice a week for six weeks at thirteen each is 156 ratings
      per learner, and a room of director-level engineers stops answering in week two — at
      which point the data is not sparse, it is biased toward the compliant.
- [x] **And that scoping is what makes the number mean anything.** Movement on A5 either
      side of the session that taught A5 is attributable to that session. The same movement
      measured six weeks apart says only that time passed.
- [x] **`startsAt` joins `endsAt`** on the session schema. `before` opens when the previous
      session ends and **closes when this one starts** — a baseline taken after the teaching
      is not a baseline, and the API re-checks that window on save rather than trusting a
      form that may have sat in a tab for an hour.
- [x] **Still one prompt.** Two moments now exist in a week and after week 1 they overlap
      (week 1's after-window and week 2's before-window are both live). The **after** moment
      wins, because it is about the session someone just sat through; the before-pulse keeps
      its place on the to-do and gets its own prompt once that one is closed.
      `session_prompts` gained a `phase` column so closing one does not silence the other.
- [x] **Ordered by decay inside the prompt.** Pulse, then feedback, then the check. A rating
      of what you can do *now* is worthless tomorrow; feedback fades over days; calibration
      keeps.
- [x] **Sunil gets the payoff: did the session move what it taught?**
      `/craft/admin/familiarity` shows the before/after per capability per session,
      **smallest movement first** — the capability a session failed to shift is the one
      worth his attention, and a biggest-gain ordering buries it.
- [x] **Paired ratings only.** Someone who rated before and not after counts in neither
      mean. An unpaired delta measures who replied rather than what they learned, which is
      the classic way a survey difference lies. — `sessionMoves()`

**This does not replace §5.6.** The week-0 intake and the week-6 re-ask stay exactly as
they are — all thirteen capabilities, the cohort-level before/after, the evidence behind
the outcome claims. Pulses are a finer instrument alongside them. **Week 6 deliberately has
no after-pulse**: the full re-ask happens that day and covers the ground better, so asking
both would be asking twice.

### Added 4 September — ADRs correspond to the assignments actually given

§5.5 says an ADR is *"one page per week, tied to that week's assignment"*. Two things had
to be true for that tie to mean anything, and neither was enforced in one place.

- [x] **The placeholder no longer reaches the learner.** Weeks 2–6 carry
      `assignment: "TBD"` — a real, truthy string. `/craft/adr` filtered on truthiness
      alone, so it offered **five submit forms headed "Week 2: TBD"** for work nobody had
      been set. Sunil's console, the comparison page and the dashboard all excluded it
      already; the learner-facing page was the one that did not.
- [x] **One module owns the test.** `src/lib/craft/assignments.ts`. The `!== 'TBD'`
      literal was written by hand in four places and about to be a fifth — which is
      precisely how three surfaces came to disagree about how many assignments exist.
- [x] **An ADR unlocks when its assignment is *given*,** not when it is written. Same
      instant as the week's knowledge check, via one exported `sessionEnded()` — two
      predicates for one event drift, and the drift shows up as an ADR you can write
      before the class that sets it.
- [x] **The console counts only given weeks as missing.** `submissionGaps()` over a week
      whose session has not run would report all eight learners as behind on work nobody
      has been given: the loudest possible way to say nothing.
- [x] **The brief is on the page.** Each panel opens with the assignment, the session it
      came from, and a link to that week's check — the pairing §5.5 describes, made
      walkable instead of implied.
- [x] **The five sections keep the spec's own wording.** "The constraint that forced a
      decision", "what you rejected, and why it lost" — in place of "What is the problem
      we are solving?". **The template itself does not vary by week**, deliberately: §5.5
      wants week 6 readable against week 1. Alternatives is marked as load-bearing on the
      form because the spec says it is the section judgement is visible in.

**On §10, which cuts "automated nudges to learners about missing submissions."** That rule
stands and this is written to stay inside it. The distinction is that a *chase* is about
something overdue — it repeats, it escalates, it counts how many times you ignored it, and
its subject is your non-compliance. A *prompt* is about something that just became
relevant: the session ended, the check that belongs to it is open, here it is, once. None
of the chasing machinery exists, `session_prompts` is never counted or reported to Sunil, and
there is no second prompt to schedule. **If a later change adds "remind them again on
Friday", that is the cut feature returning under a new name.**

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
| 10 | Turn Doubts into the cohort discussion forum | ✅ done — 4 September |
| 11 | Open the knowledge check when the session ends | ✅ done — 4 September. **Needs the timetable:** set `endsAt` on each session file. |
| 12 | Tie ADRs to the assignments actually given | ✅ done — 4 September. Same `endsAt` dependency, plus real assignment titles for weeks 2–6. |
| 13 | Prompt for session feedback, and remind via the to-do | ✅ done — 4 September. Shares the one post-session prompt. |

**On step 8** — the spec's own mitigation (§11): each session already contains all three
artefacts. §2 *The Problem* is the quiz item, §3 *The Drill* is the assignment, and the
decision the drill forces is the ADR prompt. Extractions from a session being written
anyway, not three new things per week.

---

## Decisions taken while building, that the spec did not settle

Recorded here so they are not silently re-litigated.

- **Logistics questions are answered without a model at all.** §4 lists the four things a model
  may do and answering a learner is not one of them, so the answer is lexical retrieval over
  `facts.ts` plus session frontmatter, relayed verbatim with a citation. Below the score
  threshold it escalates. This also means the feature works with no `ANTHROPIC_API_KEY`.
- **The thread classifier shares the visitor agent's scorer** rather than carrying its own.
  Two lexical implementations drift, and the one that drifts decides whether a learner's
  question was answerable or goes to Sunil.
- **The forum's Postgres table is still called `doubts`.** Renaming a live table is a
  migration with real downside and nothing a reader would ever see. One file
  (`src/lib/craft/discussion.ts`) holds both names and says so at the top; everything
  above it says thread and reply.
- **Erasing a learner takes their threads, and therefore other people's replies on them.**
  `ON DELETE CASCADE` on the thread, not just the reply. Keeping the conversation and
  removing the name from the top of it is exactly the "filing someone differently" §7
  rules out — but it does mean a DPDP deletion is visible to the room as a missing thread.
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
  - **The agent dock becomes a discussion widget**, not a tutor chat. It is still a mock
    with keyword-matched replies; they now point at `/craft/discussion` rather than
    advertising the killed PoC design, but wiring it to `/api/craft/discussion` is not
    done. Making it a tutor as originally written would violate §5.1. The tour cannot
    ship over the top of it.

---

## Changelog

| Date | Change |
|---|---|
| 2 Sep 2026 | First audit of `feat/learner-dashboard-poc` against the 2 September spec. |
| 2 Sep 2026 | Steps 1–6 done. All seven spec contradictions fixed; eight of ten missing items built. Two schema columns added — run `supabase/schema.sql` before deploying. |
| 2 Sep 2026 | Steps 7–9 done. Feedback loop closed both ways (`feedback_responses`); quiz bank restructured to one file per week with items carrying their own `week`; `CLAUDE.md` and the teaching README brought up to date. Only reading-opens and the authoring remain. |
| 3 Sep 2026 | Console moved to `/craft/admin` and restyled from `main`; both surfaces made responsive; the learner agent re-docked to the bottom of every page; a to-do panel added to the dashboard. Fixed a silent bug where the quiz bank parsed as EMPTY on any Windows checkout (CRLF vs `$` in the metadata regex) — the quiz surface and the room distribution rendered nothing, with no error. `astro check` baseline is now **0**, not 8. |
| 2 Sep 2026 | Guided-walkthrough plan written ([guided-walkthrough/plan.md](guided-walkthrough/plan.md)), design only. Removed the `/craft` `PoC BYPASS` in `src/middleware.ts` before committing — it disabled the seat gate entirely. `astro check` baseline corrected from 11 to 8. |
| 4 Sep 2026 | **ADRs correspond to the assignments actually given.** `/craft/adr` was listing every session whose `assignment` field was truthy — and weeks 2–6 carry the placeholder `"TBD"`, so it offered five submit forms headed "Week 2: TBD". The console and the dashboard already excluded it; the learner page did not. The `!== 'TBD'` literal is now one module (`src/lib/craft/assignments.ts`) instead of four hand-written copies, an ADR unlocks on the same `sessionEnded()` clock as the week's check, and the console counts only *given* weeks as missing. Each panel now carries the brief and a link to that week's check; the five sections keep the spec's wording and still never vary by week. |
| 4 Sep 2026 | **The familiarity check runs twice a week, either side of the session.** A "pulse" of ~3 ratings covering only that session's `topics` — not all thirteen, because twice a week for six weeks at thirteen each is 156 ratings and the room stops answering by week two. `startsAt` joins `endsAt`; the before-pulse closes when the session starts and the API re-checks that window on save. Still **one** prompt: the after-moment wins when both windows are live, and `session_prompts` gained a `phase` column so closing one does not silence the other. New `capability_pulses` table — **run `supabase/schema.sql`**. Sunil gets *what each session moved*, paired ratings only and smallest movement first. Does **not** replace §5.6; week 6 has no after-pulse because the full re-ask covers it that day. |
| 4 Sep 2026 | **Session feedback joins the post-session prompt, with the to-do as its reminder.** Feedback and the check open at the same instant, so there is **one** prompt naming both rather than two modals racing onto one dashboard — feedback leads, being the one that decays. Whatever is skipped stays on the dashboard to-do, which is a list the learner opens rather than a second prompt (§10 again). `/craft/feedback` now honours `?week=N` and reads `sessionEnded()` instead of `taughtOn` — a fifth definition of "the session happened", and the one that would have made the prompt link to an empty page. `quiz_prompts` → `session_prompts`, a rename in an unapplied file rather than a migration. |
| 4 Sep 2026 | **The knowledge check opens when its session ends.** `endsAt` (ISO + offset) added to the session schema; `/craft/quiz` scoped by week with `?week=N`; a once-only post-session prompt on the dashboard backed by the new `session_prompts` table — **run `supabase/schema.sql`**. Every session file is unset, so nothing opens and nothing pops until the timetable lands; there is deliberately no fallback guess at when a session finished. Argued against §10 in the section above: a prompt at the moment something becomes relevant is not the chase that rule cuts, and none of the chasing machinery exists. |
| 4 Sep 2026 | **Doubts became Discussion.** The private inbox is now the cohort's forum: `/craft/discussion` + `/craft/discussion/[id]`, console at `/craft/admin/discussion`, `src/lib/craft/doubts.ts` → `discussion.ts`. New `discussion_replies` table with an `author_role` column, and five additive columns on `doubts` — **run `supabase/schema.sql`**. §5.1 is preserved structurally rather than repealed: relay filters on `author_role = 'instructor'`, so a peer answer can never be repeated as fact, and "solved it" (the asker's report) is kept separate from "endorsed" (Sunil's verdict). Peer bodies are no longer passed through `marked()`. `astro check` still **0**. |
