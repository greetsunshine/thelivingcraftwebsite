# The prompt that builds a week's teaching material

*Not learner-facing. Written 30 September 2026, at Sunil's request.*

**How to use it.** Start a Claude Code session in this repo. Paste everything below the line.
Replace every `<WEEK>` with the week number, for example `4`. Run one week per session.

**Why it is kept here.** Every week should be built from the same instructions. A prompt that
lives only in a chat changes a little each time someone retypes it, and the weeks drift apart.
When a rule in `CLAUDE.md` or `threads.md` changes, update this file in the same commit.

---

# Weekly teaching material: The Living Craft cohort, week <WEEK>

You are building the teaching material for week <WEEK> of a six-week, live, five-hour-per-week
cohort on building agentic AI systems. Produce the full draft. Do not send me clarifying
questions; I react to finished material. Where two rules pull against each other, pick one,
say which, and say why.

## 0 · Read these first, in this order, before writing anything
1. `docs/cohort-pipeline/RESUME.md`: where the work stands.
2. `CLAUDE.md`: "Communication style", "Teaching standard", "Design tokens", "Shared
   infrastructure" and "Hard rules". All of them are binding.
3. `docs/teaching/threads.md`: week <WEEK>'s column in the matrix, every bridge that names
   week <WEEK>, and the "Topic labels" list.
4. `docs/teaching/README.md`: which note goes in which file, and how pages are built.
5. `src/content/sessions/week-<WEEK>.md`: the session as it stands today.
6. The previous week's session file and notes: what the agent can already do.
7. `scripts/teaching-content/_design.mjs` and `scripts/teaching-content/week-3.mjs`: the
   shared page design and the shape of a content module. Also read
   `scripts/build-teaching-pages.mjs`, `scripts/teaching-clock.mjs`,
   `scripts/check-teaching-pages.mjs` and `scripts/check-stored-pages.mjs`.
8. `src/lib/craft/schedule.ts` (`dayPlan()`), `src/lib/craft/teaching-pages.ts` and
   `src/lib/craft/release.ts`: how the site orders the day, how it serves the pages, and who
   decides when learners see them.
9. `docs/teaching/notes/teardown-five-questions.md`: the teardown format.
10. `docs/teaching/quiz/README.md`: the question bank format.

Run `ls docs/teaching docs/teaching/notes docs/teaching/quiz docs/teaching/pages
scripts/teaching-content` first. If a file for week <WEEK> already exists, revise it. Do not
write a second one beside it.

## 1 · Who is in the room
- Eight senior engineers: Staff+, engineering managers, architects, directors. They have
  shipped production systems. They are peers, not students. They will notice a skipped step.
- Most work in India. English is a second or third language for most of them.
- The session is live, five hours, in IST. A sentence that someone must read twice is lost.
- They want to leave able to **do** something, and to defend it in their own architecture review.
- Before you finish each section, re-read it as one of them. Is it too basic for a Staff
  engineer? Is it too dense for someone reading in their second language? Fix both problems.

## 2 · The one system everything is built on
The reference agent from week 1 handles payment disputes. It uses the same tools, the same
numbers and the same people from earlier weeks. Every idea this week lands on that agent. Do
not introduce a second example system.

**The course's promise:** by the end of week 6 this agent is an enterprise-grade AI product.
It is not a demo. This week must add real, running capability to it. Use the ladder below.
Where `threads.md` differs from it, `threads.md` wins:

| Week | What the agent gains, in running code |
|---|---|
| 1 | The harness: loop, tools, context assembly, a trace with cost on every step |
| 2 | Guardrails: limits outside the model, a human-approval gate, idempotent payouts (a retry pays once) |
| 3 | An evaluation harness with a pass bar and a release gate; retrieval (`search_policy`) with graded answers; context size measured |
| 4 | Prompt-injection defences, the MCP / third-party tool boundary, one regression case per attack found |
| 5 | Multi-agent orchestration with a clear owner, agent memory with scope and expiry, consistency under concurrent runs, cost of evaluation at 40,000 disputes a month |
| 6 | Governance and audit trail, risk-tiered review of AI-written code, the business case, a full architecture review |

**Write the agent's progress down.** Produce a section called "What the agent can do now". It
has two columns: *at 00:00 today* and *at the close*. Each row names the file changed and the
command that proves it works. For example, `make eval` shows 8 of 8 passing, or a second
terminal shows one credit. If a row cannot be proven by running something, it does not belong
in the table.

## 3 · Topics: name them the way the industry does
- **Each topic title is the standard industry term**, taken from the "Topic labels" list in
  `threads.md`. Examples: Guardrails, Human-in-the-loop (HITL), Idempotency, LLM evaluation
  (evals), Retrieval-augmented generation (RAG), Context engineering, Prompt injection,
  Model Context Protocol (MCP), Observability and tracing, Agent memory, Multi-agent
  orchestration, AI governance.
- Put a question in the subtitle. It must be one that a senior engineer cannot answer from
  the title alone.
- On first use, give each term a plain-words definition in the same sentence.
- State which week owns any topic that is deliberately absent this week.

## 4 · The shape of every topic (six parts, clock order, each opens on a question)
1. **The narrative.** Open on something that happened to the agent, with a number in it.
   For example: ₹2,50,000 credited twice, or a 31-second call against a 30-second limit.
2. **The concept.** One sentence, then a diagram or a worked example. Never the definition alone.
3. **Components and design.** Cover the parts and what each design choice costs. Pose every
   failure as a puzzle: show the setup, hold back the cause, then ask two questions. What went
   wrong? Which single control would have prevented it?
4. **Hands-on lab.** Three steps: decide in writing first, then build on the agent, then check
   by running it. Say how long it takes and who does it, for example "Pairs, 15 minutes". Use
   the real names from the seat list, never invented ones. Give a starting state and a check
   command. Put a worked solution behind a click on the learner page, and in full on the
   instructor page. Every topic has a hands-on lab. A topic without one gets cut.
5. **At enterprise scale.** Name what firms running this already use: three or more real
   products per slot, each with its cost and no recommendation. Use Indian enterprise
   context where it is real, such as RBI and NPCI rules for payments, the DPDP Act for
   personal data, and Finacle or FLEXCUBE maker-checker screens.
6. **Topic quiz.** Three questions. Two check this topic. One comes from an earlier topic
   or an earlier week. Each question has an answer key, the likely wrong answer, and what is
   right about that wrong answer.

Close each topic with **"✅ You can now…"**. Write one to three things the learner can do,
each starting with a verb (predict, diagnose, build, defend, measure). Then each learner
writes a one-line **takeaway** in their own words before moving on.

## 5 · How the session ends (the last ~60 minutes, in this order)
1. **Recall, 10 minutes, alone and in writing, notes closed.** Learners list every control
   the agent gained today and the failure each one prevents. Then they compare with their
   pair.
2. **Architectural teardown, 25–30 minutes.** Use the five-question format from
   `teardown-five-questions.md`, applied to the agent as it stands at the close. Show the
   whole architecture diagram as it is today and ask the room to find the next weakness.
   Assign each question to a named person. Put the full answer key on the instructor page.
3. **End-of-week quiz, 10 minutes.** Eight questions, mixed across today's topics and at
   least two earlier weeks, never grouped by topic. Discuss the ones that split the room.
4. **Takeaway, 5 minutes.** Each learner writes and then says aloud one sentence: "I can now
   ___, and I will use it on ___ at work." The instructor page holds the one sentence each
   topic was meant to teach, so the instructor can compare what was said with what was intended.
5. **After-rating** against the week's five outcomes, in the same words as the 00:05 rating.

## 6 · Teaching practice (apply all of it)
- **Prediction before reveal.** Every concept starts as a question the learner commits to in
  writing. The prediction and the answer never appear on screen at the same time.
- **Retrieval over restatement.** A review is a set of questions, not a summary.
- **Interleaving and spacing.** Every quiz includes at least one question from an earlier week.
- **Worked example, then a partly worked one, then the learner's own.** Remove steps gradually.
- **One new idea at a time.** No block runs longer than 40 minutes without learners doing
  something. Include one 15-minute break.
- **Cut, do not compress.** If it will not fit in five hours, remove a topic and say which
  one and why. Never shrink practice to make room.
- **Named roles and visible timing** on every activity.
- **Concrete numbers** everywhere: ₹, lakh and crore, disputes per day, milliseconds, cost
  per run.

## 7 · Language: simple Indian English
Follow CLAUDE.md "Communication style" exactly. Keep sentences under 25 words, with one idea
in each. No em dash inside a bullet. Use active voice and present tense. Use the ordinary word
every time. Write it the way a senior engineer in Bengaluru or Pune would say it to a
colleague: clear, direct, not American startup slang and not British formality.

**Conventions:**
- British/Indian spelling: organisation, colour, behaviour, programme (for the course).
- Money in ₹ with Indian grouping: ₹2,50,000, ₹4 lakh, ₹12 crore. Never "$" or "250K".
- Dates as 30 September 2026. Times in IST, 24-hour clock or "7 pm IST".
- Examples from Indian systems: UPI, NEFT/IMPS, PAN, PIN code, masked Aadhaar, GST invoice,
  RBI and NPCI circulars, DPDP Act, bank maker-checker.
- Words the room already uses: *doubt* (a question, as in a doubt-clearing slot), *revise*
  (study again), *timetable*, *pre-read*, *hands-on*, *production issue*, *go-live*.

**Never use these words in any text a person reads**, including page copy, notes, quiz text
and alt text:
beat, cold open, goes green / goes red, blast radius, load-bearing, ship it, deep dive,
level up, north star, low-hanging fruit, move the needle, double-click on, table stakes,
circle back, bandwidth (for people), heads-down, ballpark.

| Instead of | Write |
|---|---|
| beat | segment, or activity |
| drill | hands-on lab |
| stand-up | pair discussion |
| recap | recall questions |
| "any questions?" | doubt-clearing, 5 minutes (a named slot, not an open question) |
| green / red | passes / fails |
| US examples (ZIP code, SSN, $, 401k) | Indian ones (PIN code, PAN, ₹, PF) |

The code field `beats:` in the content module keeps its name. Only the prose changes.

## 8 · Keep to the internal design (no exceptions)
- **Page design comes only from `scripts/teaching-content/_design.mjs`.** Import
  `LEARNER_CSS`, `INSTRUCTOR_CSS`, `SESSION_CLOCK_JS` and `PANE_JS` from it. Never write a
  new stylesheet or copy one into the week's module.
- **Design system v1 tokens only:** forest `#183D32`, ivory `#F5F0E6`, paper `#FBF8F2`,
  ink `#172E26`, muted `#526259`, line `#CBD1C8`, deep gold `#765523` for accent text. Gold
  `#B58A46` is never text. Source Serif 4 for h1 and h2, Figtree for everything else. 6px
  radius on controls, 12px on panels. A panel gets a 1px ring, never a shadow.
- **Diagrams:** inline SVG in a complete `<figure>` with a caption. Follow the pattern in
  `week-1-figures.mjs`. Every figure has real alt text.
- **Content module rules** (from the header of `week-3.mjs`): every segment's `at` is a row
  in `scripts/teaching-clock.mjs`. Every heading on the learner page also exists on the
  instructor page.
- **Offer facts never appear in teaching material.** No fee, seat count or start date. If the
  schedule is needed, read it from `src/data/learner-cohort.ts`, never `facts.ts`.
- **Hard rules still apply:** no invented testimonials, client names, salaries, market
  numbers or claims about our own practice. Invented numbers *inside a teaching case* are fine.
- **No localStorage, no third-party scripts, no CDN scripts** on either page.
- **Tools credit:** anything published as a tool says it was built by Sunil Mathew,
  co-authored with Claude.

## 9 · One clock, one order, in every file
The instructor follows the clock live. A learner reads along live. If two files put the same
activity at different times, or in a different order, one of them loses the room. So the whole
week follows **one clock**, and every file follows it in the same order.

**The single source of time is `ROWS_W<WEEK>` in `scripts/teaching-clock.mjs`.** Write it
first, before any content. Every other file takes its times from it. When a time changes,
change it there first, then update every file in the table below in the same commit.

| File | What must match the clock |
|---|---|
| `scripts/teaching-clock.mjs` (`ROWS_W<WEEK>`) | The source. Every activity, checkpoint, pair discussion, break, quiz, teardown and rating, with its offset (`'01:10'`) |
| `src/content/sessions/week-<WEEK>.md` | `runOfShow` and `checkpoints` hold the same offsets and the same names, in the same order |
| `scripts/teaching-content/week-<WEEK>.mjs` | Every segment's `at` is a clock row. No teaching row is left without a segment |
| Learner page | Topics in clock order. The clock table is byte-identical to the instructor page's |
| Instructor page | Run of show and notes column in clock order, heading for heading |
| `docs/teaching/notes/week-<WEEK>-<theme>.md` | Sections in clock order. Each heading starts with its offset, for example `## 01:10 · Idempotency: the second terminal` |
| `docs/teaching/quiz/week-<WEEK>.md` | Each question is tagged with the offset where it is asked. The session file's `quiz` array lists them in the order they are asked |
| `docs/teaching/week-<WEEK>-script.md` (if one exists) | The same offsets, the same names, the same order |

**Rules:**
- **Offsets are relative** (`'02:20'`), never wall-clock. `startsAt` in the session file is
  the only link to real time.
- **The same activity has the same name everywhere.** Pick one wording and copy it. "Pair
  discussion: where the limit lives" on the clock must not become "Stand-up on limits" in
  the notes.
- **Two items at the same offset:** the checkpoint sorts first. That is the order
  `dayPlan()` uses, and the page must agree with the site.
- **Content follows the order it is taught.** A concept is never used in a segment before
  the segment that teaches it. A quiz never asks about something the room has not reached
  yet at that offset.
- **Durations add up.** Each segment's stated duration equals the gap to the next row. The
  last row ends at 05:00. Report any gap or overlap.
- **Anything shown on screen matches the system at that minute.** A trace, a terminal
  output or a config shown at 02:40 shows the agent as it is at 02:40, not as it is at the
  close.

**Prove it before you finish.** `check:teaching` compares the two pages with each other. No
existing script compares the session file, the notes or the quiz bank with the clock. So
write a one-off script in your scratchpad, not in the repo. It must:
1. Read `ROWS_W<WEEK>`.
2. Read `runOfShow` and `checkpoints` from the session frontmatter.
3. Read the `## HH:MM` headings from the notes file.
4. Read the offset tags from the quiz bank.
5. Report every offset or name that appears in one source and not the others, and every
   place the order differs.

Include the script's output in your report. A clean run is zero differences.

## 10 · What must exist when you finish (three things per week, plus the supporting files)
| Output | Path in the repo | Who sees it on learning.thelivingcraft.ai |
|---|---|---|
| **Notes (Markdown)** | `docs/teaching/notes/week-<WEEK>-<theme>.md` | Instructor only, at `/craft/admin/teaching` |
| **Learner page** | `docs/teaching/pages/week-<WEEK>-learner.html` | Learners, at `/craft/week-<WEEK>/topic-<N>`, after release |
| **Instructor page** | `docs/teaching/pages/week-<WEEK>-instructor.html` | Instructor, at `/craft/admin/teaching/<WEEK>/topic-<N>` and `/craft/admin/preview/<WEEK>` |

Supporting files:
- `scripts/teaching-clock.mjs` holds the week's clock (section 9). Write it first.
- `scripts/teaching-content/week-<WEEK>.mjs` is the source of both pages.
- `docs/teaching/quiz/week-<WEEK>.md` is the question bank, tagged by topic, difficulty and
  offset, with a reason for every wrong option.
- `src/content/sessions/week-<WEEK>.md` holds the frontmatter (`outcomes`, `threads`,
  `runOfShow`, `checkpoints`, `quiz`, `prework`, `after`, `reading`) and the learner prose.
  **No instructor notes in this file.** It renders to a paying learner.
- The agent's code for the labs: starting states and solutions, in the reference agent's
  location named in week 1.

The learner page follows the six-part topic shape and carries the clock as a table. The
instructor page follows the clock. Print on it every question the instructor asks, and what
the room is looking at when it is asked: the trace, the terminal output, the row on the board.
Each piece of instructor text lives on exactly one of the two pages.

**The HTML pages are build output. Never edit them by hand.** Change the module and rebuild.

## 11 · Build, check and publish
Run these in order. Stop at the first failure and fix the source, not the output.
```
export PATH="/c/Program Files/nodejs:$PATH"            # Astro needs Node ≥ 22.12
node scripts/build-teaching-pages.mjs <WEEK>            # writes dist-teaching/; fails if a segment's `at` is not a clock row
npm run check:teaching --topics=<N> dist-teaching/week-<WEEK>-learner.html \
  dist-teaching/week-<WEEK>-instructor.html --by-topic  # all nine rules must pass
node <scratchpad>/check-week-<WEEK>-clock.mjs           # section 9: zero differences
cp dist-teaching/week-<WEEK>-learner.html    docs/teaching/pages/
cp dist-teaching/week-<WEEK>-instructor.html docs/teaching/pages/
node scripts/check-stored-pages.mjs                     # stored pages match the module
npx astro check                                         # must be 0 errors
npm run dev                                             # open the three URLs in section 10, plus /craft/week-<WEEK> and /craft/live
```
On the dev server, check that `/craft/week-<WEEK>` (the day plan from `dayPlan()`) lists the
same items in the same order as the clock table on both pages.

Then prepare the commit:
- Update `docs/teaching/README.md` (the week's entry and its URLs) and
  `docs/cohort-pipeline/RESUME.md` in the same commit.
- Run `git status` first. Stage only the files you wrote, by explicit path, never
  `git add -A`. Files you did not write may be Sunil's work in progress.
- Run `git fetch && git log HEAD..origin/main` before any push.

**Stop and ask me before pushing to `main`.** A push to `main` deploys production.

**Never release the week to learners.** Release is my action in the console, after the
session. A week is visible only when `status: ready` is set in the session file and the week
is released. Leave `status` as `draft` unless I tell you otherwise.

## 12 · Before you say it is finished
Run the four question tests from CLAUDE.md over every question. Each question must be readable
aloud, answerable without guessing, and give its own context. Any earlier week it refers to
must be quoted word for word. Then report each item below as met or not met. Do not drop any
silently:
- Titles use industry terms, and each has a plain-words definition.
- Outcomes start with a verb and can be observed.
- A prediction comes before every reveal, on a separate surface.
- Every failure case is posed as a puzzle.
- Every topic has a hands-on lab, a quiz with one question from earlier material, a
  "✅ You can now…" line and a written takeaway.
- The session ends with recall, the teardown, the mixed quiz and a spoken takeaway.
- The "What the agent can do now" table has a proof command on every row.
- Activities show their timing and name real people.
- **The clock, the session file, both pages, the notes and the quiz bank agree on every
  offset, every name and every order.** Include the section 9 script's output.
- **Durations add up to 05:00 with no gap or overlap.**
- **No segment uses an idea before the segment that teaches it.**
- Numbers are concrete and in ₹ with Indian grouping. No banned word appears anywhere.
- Only `_design.mjs` styles are used, and no gold text appears.
- The notes follow the six-part contract, and no two files share notes.
- The notes file and both pages exist at the paths in section 10, and each page renders at
  its URL on the dev server.
- No placeholders, brackets, TODOs or leftover prompts, including in alt text.
- `check:teaching`, `check-stored-pages` and `astro check` all pass.
