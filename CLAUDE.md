# The Living Craft / Sunil Mathew — practice site

## Purpose
A **live, deployed site** (Astro → Vercel) for Sunil Mathew's teaching + consulting
practice. It started as marketing assets for a cohort landing page destined for Kajabi;
it has since become the production site itself. Three cross-linked surfaces, one design
system. The Kajabi hand-off is **no longer the plan** — build directly in this repo.

## ⚠ Checkpoint — read this before doing anything else
**[docs/cohort-pipeline/RESUME.md](docs/cohort-pipeline/RESUME.md) is the checkpoint, and
it is the FIRST thing to read in any session that continues this work** — including a
session that was simply told "continue" with no other context, and including a subagent
picking up one piece of it.

It says where the work actually stands, which routes render today, what is in flight, what
is blocked and on whom, and the handful of things that will otherwise cost an hour to
rediscover. It is deliberately short; the detail is in `build-status.md` and in the code.

**Update it in the same commit as the code**, the same rule the two status docs already
carry. A checkpoint that was true yesterday and is wrong today is worse than none, because
the next session will trust it. If you finish a stage, land a route, unblock a decision, or
lose an hour to something surprising, that is a line in RESUME.md before you commit.

## Communication style — read this before writing any text
This section governs **everything Claude writes here**: chat replies, commit messages,
session content in [src/content/sessions/](src/content/sessions/), page copy, code comments,
and agent prompts. Where it conflicts with a voice note elsewhere in this file, this
section wins on *sentences*; the other note still wins on *register*.

### The default
- **Act as a patient coding mentor.** Assume the reader is a capable engineer who is
  new to this particular thing. Never assume they already hold the context.
- **Use plain, beginner-friendly English.** Prefer the ordinary word. If a plain word
  exists, use it: "make an object" over "instantiate", "run it again" over "re-invoke",
  "spread out" over "fan out".
- **Define jargon the first time it appears, in the same sentence.** Keep the real
  term — the cohort needs the vocabulary — but attach a plain-words gloss:
  "idempotent (running it twice does the same thing as running it once)".
- **Explain WHAT and WHY before a command or an edit.** One or two lines: what this
  does, and why it is needed here. Then run it. Never paste a command with no gloss.
- **Structure with bullets.** Short bullets, one idea each. Use a short paragraph only
  when the ideas genuinely connect; use a table when comparing more than two things.

### Sentence rules (this is where the writing actually goes wrong here)
- **One idea per sentence.** Aim for under 25 words. If a sentence needs a comma to
  hold a second thought, it is usually two sentences.
- **At most one em dash per paragraph, and none inside a bullet.** Stacked em-dash
  asides are the main reason the existing content is hard to read. Split them into
  separate sentences instead.
- **No idioms, no figures of speech, no wordplay.** Say the literal thing. Not "goes
  green", "blast radius", "load-bearing", "the point is the movement" — say what
  happens.
- **Front-load the sentence.** Put the subject and the verb first. Save the condition
  for the end: "Run the schema first, because the code expects the new tables."
- **Concrete over abstract.** Name the real file, the real number, the real ticket.
  "₹1,200 charged three times" beats "a duplicate side effect".
- **Active voice, present tense.** "The middleware checks the cookie", not "the cookie
  is checked by the middleware".

### What this does NOT mean
- **Simple words, not simple engineering.** Never drop a constraint, a trade-off or a
  failure mode to make a paragraph shorter. If it is hard, say it is hard and then
  explain it in ordinary words. Shortening by deleting the difficulty is the failure
  this rule is trying to prevent.
- **The public pages keep their register.** `/`, `/caio` and `/assessment` still read
  as a senior practitioner, not as a bootcamp. Plain English makes those sentences
  shorter and clearer; it does not make them chatty, hyped or padded with exclamation
  marks. Restraint and plainness are the same goal, not opposite ones.
- **No filler.** Do not open a reply with praise ("Great question"). Do not restate
  the request before answering it. Do not add a summary that repeats what is already
  on screen.

### Why this exists
Most of the cohort is India-based. The learners are working engineers, many of them
senior, but English is a second or third language for most. The sessions are live and
five hours long. A sentence a reader has to read twice is a sentence lost in the room.
Dense compression costs comprehension and buys nothing.

## Teaching standard — read this before writing any session, note, drill or slide
This section governs **structure**: what a teaching artifact has to contain and in
what order. **Communication style** above still governs the sentences. Scope is
[src/content/sessions/](src/content/sessions/), everything under [docs/teaching/](docs/teaching/), the quiz banks, and
the published teaching Artifacts built from them. It does not touch `/`, `/caio`
or `/assessment`.

### Who the room is
Eight senior engineers — Staff+, engineering managers, architects, directors. They
have shipped systems and they are past tutorials. They are peers, not students.
Write for someone who will notice a step you skipped.

### What counts as finished
A participant can do something afterwards that they could not do before, and it is
visible when they do it. An artifact that only conveys information has not met the
bar yet. That is the test to apply before calling any of this done.

### Rules for anything you produce
- **Capability language.** Outcomes are things people do: predict, defend,
  diagnose, prescribe, ship, measure. Never "understand", "learn about", "be
  introduced to", "gain familiarity with". If you cannot test an outcome by
  watching someone, rewrite it.
- **Never answer first.** Introduce a concept as a question the learner commits to
  before seeing the answer. Prediction, then reveal, then discussion. On a slide or
  in an Artifact the prediction and the reveal sit on separate surfaces, never both
  on screen at once. In prose, pose the problem before the resolution.
- **Retrieval over restatement.** A recap is a set of questions, not a summary.
  Review sections interleave topics instead of walking them in order. Mixing is
  what makes them stick.
- **Diagnosis before explanation.** Every failure case is a puzzle first. Show the
  setup and withhold the cause and the fix. Two questions each time: what went
  wrong, and which single control would have prevented it.
- **One anchor artifact.** Abstract ideas land on the shared reference system, not
  on a fresh example each time. The room's own agent, its tokens, its failure, its
  model swap. Do not introduce a second system to illustrate a second idea.
- **Concrete numbers.** ₹4L refunded, 40,000 tickets a day, 200,000 invoices, a
  31-second call against a 30-second limit. Never "a large volume" or "significant
  cost". This is the *Concrete over abstract* sentence rule applied to magnitudes,
  and it matters more here: senior engineers reason from the number.
  - Invented numbers **inside a teaching case are fine and are the point**. The
    ban under *Hard rules* is about our own practice: client names, student
    counts, our metrics, salary figures we cannot source. A case study's ₹4L
    refund is fiction the room knows is fiction. A claim about the agentic job
    market is not. Keep the two apart.
- **Visible timing and named roles.** An activity states its own duration and says
  who does it: "Pairs, 5 minutes". Assign specific people or specific pairs. An
  unassigned prompt to a room of eight produces silence.
- **Cut, do not compress.** If material will not fit, remove a topic. Never shrink
  the type, delete the practice, or speed up delivery to make room. Half a skill
  taught properly beats a whole one rushed.
- **Facilitation notes are a contract.** Every activity and every failure artifact
  carries six things: the run time, the facilitation sequence, the full answer key,
  the expected wrong answer and what is right about it, one extension probe, and
  the single line the block exists to land. Notes are never duplicated across
  artifacts. If two carry the same text, one of them is wrong.
- **Anti-hype voice.** Workbench, not showroom. No glowing brains, no humanoid
  robots, no career-outcome promises, no framework tours. State the trade-off, name
  the failure mode, give the number. If a sentence would survive in a vendor deck,
  cut it. This is the same restraint the public pages hold, applied inside the gate.

### How Sunil wants this worked
- Produce the full draft, not a list of clarifying questions. He reacts to
  artifacts, not to scoping.
- When there is a real tension, name it and recommend a position with the trade-off
  stated. Do not hand over balanced options with no lean.
- Say out loud when you drop a mechanic, and say why. A prediction cycle, an answer
  key or a checkpoint that quietly goes missing is the failure mode he cares about
  most.

### Report before you finish
Check each of these and state which ones you could not satisfy. Do not drop one
quietly.
- Outcomes are verb-led and observable.
- A prediction precedes every reveal, on a separate surface.
- Every failure case is posed as a puzzle.
- A "✅ You can now…" checkpoint closes each teaching block.
- Activities show their own timing and name their participants.
- The notes contract is satisfied, and no two artifacts share notes.
- Numbers are concrete, not qualitative.
- No placeholders, brackets, TODOs or leftover generation prompts anywhere,
  including image alt text.

### Reference
The per-session build contract is [docs/teaching/threads.md](docs/teaching/threads.md) — read the week's
row before writing any block of that week. [docs/teaching/README.md](docs/teaching/README.md) says which
kind of note belongs in which file. Read them when building or revising a session.
Do not inline either one here.

## Surfaces (Astro routes)
- **`/`** — *The Living Craft* cohort, **rebuilt against the 10 September copy**.
  Single page, still SSR (`prerender = false`). Files:
  [src/pages/index.astro](src/pages/index.astro),
  [src/components/cohort/CohortPage.astro](src/components/cohort/CohortPage.astro),
  [src/components/cohort/RouteForm.astro](src/components/cohort/RouteForm.astro),
  [src/data/cohort-copy.ts](src/data/cohort-copy.ts),
  [src/data/offer-display.ts](src/data/offer-display.ts).
  - **The site DOES publish the fee, the start date and the week count** — decision D1
    was reversed on 14 September 2026. The page, structured data, `/llms.txt`,
    `/api/facts`, the latest feed and the Ask widget all read the same figures from
    `facts.ts` through `offer-display.ts`, so a visitor and a crawler cannot be shown
    different numbers. The indirection stayed when the policy flipped, and it is the
    useful part: never state an offer fact directly in a page.
    - **The fee is the one figure that is still per region and still gated.**
      `Region.publicPrice` in `regions.ts` decides whether a rate appears at all. It is
      on for India and off for Dubai and Australia, whose rates are uncalibrated; those
      two fall back to "shared on application" on every surface at once.
    - **Scarcity is what stays off.** Eight capped seats is a fact and is published.
      "Only two left", a countdown, and "this rate will not return" are sales devices and
      are not. A founding-rate scarcity line reached "Live experience" that way once and
      was cut on 16 September 2026.
    - `/india|/dubai|/australia` remain compatibility redirects only.
  - **Three routes, one definition** ([src/lib/pipeline/forms.ts](src/lib/pipeline/forms.ts)):
    application, cohort enquiry, enterprise enquiry. The page renders from it and the API
    validates against it, so a field cannot be required in the browser and optional on the
    server. An enterprise enquiry is never counted as an application.
  - **A fourth, optional route: scheduling an appointment.** [src/components/cohort/GoogleCalendarBooking.astro](src/components/cohort/GoogleCalendarBooking.astro)
    renders a *Schedule an appointment* control beside Apply, gated entirely on
    `PUBLIC_GOOGLE_CALENDAR_APPOINTMENT_URL` ([src/lib/booking.ts](src/lib/booking.ts)) validating
    as a real Google Calendar appointment-schedule URL. Blank or invalid, the control simply
    does not render — no dead link, no scheduling claim. The visible control is always the
    site-native link to that URL; Google's popup script is loaded as an enhancement that
    replaces the click target when it loads, and the direct link is what a blocked or slow
    script falls back to. **Apply remains the primary CTA everywhere this appears** — this is
    additive, not a replacement, and it is not "Buy now": scheduling is explicitly separate
    from applying, in the copy beside it. Opening the control is tracked as `cta_click` intent
    only, never as a confirmed booking. Still owed: the real schedule URL, and a staging pass
    on desktop and mobile popup, close, fallback and a completed test booking.
- **`/caio`** — *Fractional Chief AI Officer*. Board-facing consulting retainer. Static.
  Files: [src/pages/caio.astro](src/pages/caio.astro), [src/layouts/CaioLayout.astro](src/layouts/CaioLayout.astro).
- **`/assessment`** — *AI Readiness Assessment*. Fixed-scope diagnostic; the front door.
  Static. Files: [src/pages/assessment.astro](src/pages/assessment.astro), [src/layouts/AssessmentLayout.astro](src/layouts/AssessmentLayout.astro).
- **`/craft/admin/*`** — the operator console. **Not a public surface**: password-gated,
  `noindex`, its own layout and stylesheet, and no SEO/JSON-LD of any kind. It sits
  *inside* the course area's URL space but shares none of its auth: a seat code does
  not open it. That nesting is the one thing to be careful about here — see *Auth*
  under *The admin console* below.
- **`/craft/*`** — the cohort's course area, for people who hold a seat. **Not a public
  surface**: gated per learner by an issued code (not a password), `noindex`, and never
  prerendered — a static file under `dist/` would be served without the middleware, which
  is the gate gone. Session material is Markdown in [src/content/sessions/](src/content/sessions/) (week 0 is the
  pre-work and has no module); the pre-cohort questionnaire is
  [src/pages/craft/intake.astro](src/pages/craft/intake.astro), with its questions, validation and queries in
  [src/lib/craft/intake.ts](src/lib/craft/intake.ts). Read the answers at `/craft/admin/baseline`.
  Six learner surfaces beyond the sessions themselves — **discussion, reading, quiz, ADR,
  feedback, familiarity** — each with a console counterpart. What they are and why they
  are shaped the way they are is the learning agent, below.

  **Discussion (`/craft/discussion`) is the cohort's forum**, and was a private
  learner→Sunil inbox until 4 September. Learners answer each other. The rule that makes
  that safe is not moderation, it is that a reply carries an `author_role` and the three
  roles can never be mistaken for one another: `learner` (their face and name),
  `instructor` (a rule down the side — the course's position), `system` (the machine's warm
  gold family, labelled *not a person*, and only ever code quoting `facts.ts` or session frontmatter).
  **Only `instructor` replies are eligible for relay** to a later asker, so no amount of
  peer approval can turn a guess into something the machine repeats as fact. And the two
  marks stay separate on purpose: *solved it* is the asker's report, *endorsed* is Sunil's
  verdict. Collapsing them into one "accepted answer" is how a grateful asker promotes a
  wrong answer into the cohort's working belief.

  **The agent dock is wired to that forum and runs no model.** It posts
  `action: 'lookup'` to [src/pages/api/craft/discussion.ts](src/pages/api/craft/discussion.ts) — a READ against the same two
  grounded sources a posted thread is answered from (session frontmatter and `facts.ts`,
  then a verbatim answer Sunil has already given), in the same order, through the same
  functions. Until 7 September it answered from keyword matches, which made it a fourth
  voice inventing things in a product built so the other three can never be confused.
  Two properties keep it inside §5.1 and both are worth defending: **a lookup writes
  nothing**, so idle curiosity does not open threads; and **a null answer is the honest
  outcome** — it says the syllabus does not cover this and carries the question to the
  composer via `?ask=`, rather than guessing or silently posting on the learner's behalf.
  Never give this path a model. The moment it can improvise, the three-voice distinction
  the forum is built on has a hole in it that no amount of moderation closes.

  **`/craft` is a surface people use DURING a session, not only after one.**
  [src/pages/craft/live.astro](src/pages/craft/live.astro) is session mode, resolved by
  [src/lib/craft/live.ts](src/lib/craft/live.ts). Week 1 asks a learner for something nine times
  inside its five hours, and every page here was built for one person alone afterwards with time
  to read. Four rules hold it together:
  - **Exactly one thing is "now."** The rest is a catch-up list, smaller and underneath. Same
    argument as the single prompt: four equal asks on one screen is a screen people scroll past,
    and in a live room there is no second read. "Now" is the **most recently fired** outstanding
    ask, never the earliest — the room has moved on from the checkpoint somebody missed.
  - **The chrome comes off.** `CraftLayout` takes `bare`, dropping the nav rail and the agent
    dock. **A prop, not a second layout** — §9 says every `/craft` page goes through that one
    shell, and a fork drifts.
  - **Nothing redirects anybody into it.** A banner on the dashboard while a session runs, and
    that is all. Somebody who opened the dashboard mid-call may have meant to.
  - **Asks come from the modules that own them** — the ratings from `pulses.ts`, checkpoints from
    `checkpoints.ts`, the quiz from `checks.ts`, the pair work from `pairs.ts`. None of them knows
    session mode exists; this one only places them on a clock.

  **Checkpoints are the only instrument that arrives in time**
  ([src/lib/craft/checkpoints.ts](src/lib/craft/checkpoints.ts)). Four a session, one number each,
  on the checkpoint's **last** item — the session's own convention, "put one number in chat on the
  last one only". Keyed by the offset (`'01:10'`), never an index, so inserting a checkpoint
  earlier does not silently remap stored answers. Open from their moment until the session ends: a
  late answer beats none, and a slow-down signal after the fact is not one. **Sunil's read is
  counts, never a mean** — a 3.4 hides the two people at 2, and "does the next block land on
  anybody" is a count. A 2 means *go slower*; nothing aggregates it into a level.

  **The pair draft is a different object from a submission**
  ([src/lib/craft/pairs.ts](src/lib/craft/pairs.ts), `/craft/pair`). Two names, fifteen minutes,
  reviewed by another pair ten minutes later, never read again. A submission is one name, finished
  alone, and is "the artefact of this cohort" a year later. **Never fold them together** — a pair
  writing into one learner's submission makes two people's records start identical, which ruins
  Sunil's read of eight. Same seven sections either way (§5.5). The review carries a 0/1/2 beside
  each comment and **nothing sums, averages or ranks them**; if a function here ever returns a
  total, that is §10's cut feature returning under a new name. Pairs are set by Sunil in the room
  and merely recorded here — no computed rotation, which cannot see who is stuck and breaks when
  somebody is absent.

  **The knowledge check opens at the QUIZ BLOCK, not when the session ends.** Week 1 runs it at
  04:20 and then spends ten minutes taking up the ones that split the room; opening at `endsAt`
  would open it after the block that exists to discuss it. `checkOpensAt()` reads the run of show
  and falls back to `endsAt`. **Sunil picks the eight**, in the session file, in his order —
  `itemsForCheck()` returns exactly that, one order for the whole room so "question three" means
  the same thing to eight people. An empty `quiz` array opens nothing, the same rule as an unset
  `endsAt`: picking the questions on his behalf would be inventing the lesson.

  **The old rule, still true of the timetable itself.** The
  trigger is `endsAt` in the session's frontmatter — a full ISO timestamp *with an offset*,
  because the cohort sits in three time zones and a bare date opens the check on the wrong
  day for somebody. **Absent `endsAt` opens nothing and prompts nobody**; there is no
  fallback to `taughtOn` or to end-of-day, because guessing when a session ended is
  inventing a fact. Every session file is unset until Sunil enters the timetable.
  **There is exactly ONE prompt at a time** ([src/lib/craft/prompts.ts](src/lib/craft/prompts.ts)),
  naming everything that moment opened — after a session that is the feedback form, the
  week's check and the after-pulse, all at the same instant. Never add a second modal for
  a fourth thing: two stacked dialogs are not twice the prompt, they are a thing people
  click past. Tasks are ordered by how fast each **decays** (pulse, feedback, check). A
  week has two moments, before and after; when both windows are live the **after** one
  wins, and the before-pulse waits on the to-do. Shown **once** per moment; dismissal is permanent
  (`session_prompts`, keyed by week AND phase) and is never counted or reported.
  What survives a dismissal is the **to-do panel** on the dashboard — a passive list the
  learner opens themselves. That pairing is what keeps this inside spec §10, which cuts
  *"automated nudges to learners about missing submissions"*: a prompt at the moment
  something becomes relevant, plus a list you choose to look at, is not a chase.
  **Adding "remind them again on Friday" is that cut feature returning under a new name.**

  **The familiarity check runs twice a session — a "pulse" either side of it**
  ([src/lib/craft/pulses.ts](src/lib/craft/pulses.ts)). It rates **the session's own five
  outcomes**, in that session's words, from the `outcomes` array in its frontmatter — the
  same five both times, "so that the two sets of numbers mean the same thing".
  - **It is NOT a subset of the thirteen intake capabilities, and `topics` is gone.** That
    was the design until week 1 was written in full; the room rates five bespoke statements
    and nothing in the teaching material ever maps a week to A1–A3. Three vocabularies
    exist and each has a job: the **thirteen** for the week-0 intake and week-6 re-ask, the
    session's **five outcomes** per session, and the **five threads** in
    [docs/teaching/threads.md](docs/teaching/threads.md) as the contract between weeks.
    Don't merge them again — see the amendment at §0 of the spec.
  - Never widen the pulse to all thirteen: twice a week for six weeks at thirteen each is
    156 ratings per learner, the room stops answering by week two, and the data then skews
    toward the compliant. Five is what the session already asks for.
  - **The before-pulse closes at FIRST TEACHING, not at `startsAt`.** The rule — a baseline
    taken after the teaching is not a baseline — is right; the boundary was fifteen minutes
    out. Week 1 opens at 00:00, rates at **00:05**, and teaches from **00:15**, so closing
    at `startsAt` refused the very rating the rule protects. The close is derived from the
    first `block` in `runOfShow` ([src/lib/craft/schedule.ts](src/lib/craft/schedule.ts)),
    never configured twice, and the API re-checks it on save. No run of show falls back to
    `startsAt`, which is the old behaviour and the right default.
  - **This does not replace §5.6** — the week-0 intake and week-6 re-ask over all thirteen
    stay as they are, and week 6 has no after-pulse because the re-ask covers it that day.
  - Sunil's read is *what each session moved*, **paired ratings only**: an unpaired mean
    measures who replied, not what they learned. Outcomes flagged `movesMost` carry Sunil's
    before-the-fact prediction ("expect low numbers on 3 and 4"), reported beside the delta
    and never weighted into it.
  - The table is `outcome_ratings`, renamed from `capability_pulses` — it had not been
    applied to production, so this is a rename rather than a migration.
  - **The after-pulse opens at the CLOSE block, not at `endsAt`.** Week 1 takes the second
    rating at 04:52 inside a close running 04:50–05:00, so opening at the end of the session
    missed it by eight minutes — the same class of error as the before-window, the other way.
    Once open it never closes; like feedback it sits on the to-do until it is done.

  **Field notes (`/craft/notes`) is the same store the public `/latest` reads**, through
  [src/lib/notes.ts](src/lib/notes.ts) — one module owns what may be published, so `reviewNote`
  and `source: 'operator'` items cannot leak to a second reader. Week 1's reading list links
  `/latest` and promises it is *"refreshed weekly"*, which the retriever already does.
  **Until 9 September this page was a fabricated mock**: four invented notes with invented dates
  and week numbers, and an invented quote attributed to Sunil, on the nav rail of every `/craft`
  page. It read as course material because it was styled like it. The five threads are printed
  *beside* the notes and never used to file them — the themes predate the threads, nothing has
  landed under trace-and-bill, and inventing that join would put a mapping nobody decided into
  the course's own vocabulary.

  **An ADR is tied to the week's assignment, and unlocks on that same clock.**
  [src/lib/craft/assignments.ts](src/lib/craft/assignments.ts) owns both halves of the tie:
  the assignment must be real (weeks 2–6 carry the placeholder `"TBD"`, which is a truthy
  string and once reached the learner as five submit forms headed *"Week 2: TBD"*), and it
  must have been *given* — its session has ended. **Never hand-write `!== 'TBD'` again**;
  that literal in four separate files is why three surfaces disagreed about how many
  assignments existed. The ADR sections are fixed and must not vary by week (§5.5 wants
  week 6 readable against week 1); what varies is the brief above them.
  - **Seven sections, not five, and they live in one module**
    ([src/lib/craft/adr.ts](src/lib/craft/adr.ts)): Context · Goals · Non-goals · The
    design · What can go wrong · Alternatives · Open questions. That is what week 1
    actually asks for, written "in the shape you would put in front of an architecture
    review". **Alternatives is still load-bearing.** Goals must be *testable* — "'Safer'
    is not a goal, 'no dispute is credited twice' is" — and What can go wrong is one row
    per case; both are checked by the in-room peer review at 04:05.
  - The list used to be written out three times inside `adr.astro` (parse, render,
    reassemble). Same mistake as the four copies of `'TBD'`, worse failure mode: a section
    the parser did not know was dropped on the next save, taking the learner's text with
    it. A record written under the old five headings still parses, and anything under an
    unrecognised heading is shown back rather than discarded.

  **The guided walkthrough is what a first-time learner meets**
  ([src/lib/craft/tour.ts](src/lib/craft/tour.ts) is the script,
  [src/components/craft/TourOverlay.astro](src/components/craft/TourOverlay.astro) plays it).
  A ninety-second spine auto-starts on the first sign-in and names what each surface is
  *for*; six shorter tours are pulled from the permanent ⓘ at the foot of the rail. Four
  rules, and the first is the one the whole design turns on:
  - **No tour ever crosses a page.** `route` is on the TOUR, not the step. That is what
    removes tour state from the navigation entirely — step state lives in a closure and
    dies with the tour. No `?tour=` step cursor (it is an *entry point* only), no
    resume-after-swap, no `ClientRouter` re-entry bug. A tour needing two routes is not
    expressible, deliberately.
  - **It points, it never presses.** There is no `action` field and there must not be: a
    tour that drives the UI can submit a real ADR or answer a real quiz item for somebody.
  - **Every target is a `data-tour` contract**, never a class — a class is a styling
    decision somebody renames in a redesign, breaking the tour silently. A missing target
    at runtime skips its step and carries on; **`npm run check:tour` fails the build-time
    version of that**, which is what turns a silent break into a review-time one.
  - **Every step must read correctly on an empty page.** The person this exists for has no
    threads, no submissions and no answers.
  Offered at most **four** times — once as the auto-start, then up to three dismissible
  cards — at most one a day, and never after fourteen days from `learners.created_at`
  (there is no machine-readable cohort start date, and seats are issued rolling). The third
  card says it is the last. State is three columns on `learners`, so erasing a learner
  erases it. **Not rendered in session mode**: a walkthrough is the wrong thing to hand
  somebody who has ninety seconds inside a live call.

  **Familiarity is no longer in the nav rail.** A rail is for things you return to, and the
  thirteen-question form is answered twice ever — week 0 and week 6. For weeks 1–5 that icon
  led to a page asking somebody to re-rate themselves against nothing. It now matches the
  intake exactly: a dashboard card plus a to-do line, both appearing only once week 6 has
  ended. The page is unchanged and still reachable by URL. That gate is `sessionEnded()`,
  not `taughtOn` — `taughtOn` here was a fifth definition of "the session happened".

  **`/craft/modules` used to draw an invented progress bar** — `65%`, `20%`, `Not started`,
  keyed to the card's index in the array and shown to a paying learner as their own
  progress. Same defect as the field-notes mock, and it is gone: each card now lists the
  weeks that module covers and whether each is written and taught, from the session files.

  **A session file describes its own session.** Frontmatter carries `outcomes`, `threads`,
  `runOfShow`, `checkpoints`, `prework`, `after` and `reading` alongside the prose. Before
  9 September all of that was body text, so no surface could read any of it, and the
  instruments were built against a spec written before any session existed in full. Offsets
  in `runOfShow` and `checkpoints` are relative (`'02:20'`), never wall-clock — `startsAt`
  is the only clock, and a run of show that restated it would be a second source for a fact
  that already has one.
  **And the session page renders all of it** — `/craft/week-N` shows the five outcomes, the
  pre-work, the whole day with each checkpoint printed in its place, the after-work, the
  reading and the week's threads. Until 10 September the page rendered the Markdown body
  and nothing else, so every field a session carried was readable by an instrument and by
  no human. `dayPlan()` in [src/lib/craft/schedule.ts](src/lib/craft/schedule.ts) merges the
  run of show, the checkpoints and the two pair offsets into one ordered list, so the
  learner page, the console and `/craft/live` cannot disagree about what happens when.
  A checkpoint sorts BEFORE anything else at the same offset — week 1's 01:10 is a
  checkpoint and a stand-up, and the words are "read these before you stand up".

## The cohort rebuild — read the status doc before building
**[docs/cohort-pipeline/build-status.md](docs/cohort-pipeline/build-status.md) is required
reading before any work on the public cohort page, the three application/enquiry forms, or
the pipeline screens in the console.** The plan it is built against is
[docs/cohort-pipeline/build-plan.md](docs/cohort-pipeline/build-plan.md); the source of
record is the Cohort Handoff Package in
[docs/Website Rebuild 10-09-2026/](docs/Website%20Rebuild%2010-09-2026/) (Team Alchemy,
10 September 2026, handoff `LC-LAUNCH-2026-09-10`).

Same two rules as the learning agent's status doc: **read it first**, and **update it in
the same commit as the code**. Move the checkbox, adjust the counts, add a changelog row.

Three things about that package are worth knowing before you open it:
- **It specifies behaviour, not a stack.** Endpoint names, providers and hosting are ours
  to choose; the eighteen acceptance cases are what it actually holds us to.
- **The cohort page stays at `/`.** Every campaign post links to
  `learning.thelivingcraft.ai/` with `utm_content=lc-oct-dNN`. The roadmap's
  `/programmes/agentic-systems/` is a design target, and the current address keeps working
  until redirects are approved and tested.
- **One external decision remains** — how email is actually delivered. Receipt queueing,
  templates, suppression and callbacks are built; provider selection, verified domain,
  monitored reply mailbox and approval remain external. The public offer policy is settled
  in code and it is the opposite of what this line said until 16 September 2026: the fee,
  the start date and the week count ARE published, the fee per region and gated by
  `Region.publicPrice`. See the `/` entry under *Surfaces* above.

`/caio`, `/assessment`, `/latest` and everything under `/craft` are out of scope: the brief
says no LMS, checkout, payment collection or new chatbot is required in this release.

## The learning agent — read the status doc before building
**[docs/learning-agent/build-status.md](docs/learning-agent/build-status.md) is required
reading before any further work on `/craft` or its admin pages.** It is the audit of what
is built, what contradicts the spec, and what is left, against
[docs/learning-agent/learning-agent-specs-02-09-2026.md](docs/learning-agent/learning-agent-specs-02-09-2026.md) —
which is the design of record and supersedes the 28 August PoC write-up. (Both spec files
moved under `docs/learning-agent/` alongside the status doc; the old paths are gone.)

Two rules, and they are the reason the file is worth having:
- **Read it first.** It exists so nobody re-audits the branch or rebuilds something that
  is already done. Several surfaces look missing and are merely unlinked; several look
  finished and do the opposite of what the spec asks.
- **Update it in the same commit as the code.** A status line that was right the day it
  was written and wrong a week later is worse than none. Move the checkbox, adjust the
  counts in the summary table, and add a changelog row.

**Schema is ahead of production right now.** Not yet applied: the `discussion_replies`
table and five additive columns on `doubts` (`visibility`, `title`, `pinned`,
`resolved_reply_id`, `endorsed_reply_id`); the `session_prompts` table, `outcome_ratings`,
`checkpoint_ratings`, `pair_drafts` and `pair_reviews`; `feedback.changing` and `feedback.unsure`; the three walkthrough columns on `learners`
(`tour_completed_at`, `tour_offers`, `tour_offered_at`); the `doubts.answer_source`
and `submissions.status` columns, and the `feedback_responses` table. **Run
[supabase/schema.sql](supabase/schema.sql) before the next deploy** — the whole file, it is
idempotent. Shipping code ahead of its schema shows up as the console's "table is not
answering" banner rather than a crash, which is survivable and confusing. Clear this
paragraph once it has been run.

  Every page under `/craft` goes through
  [src/layouts/CraftLayout.astro](src/layouts/CraftLayout.astro), **including sign-in and office hours**.
  Two props drop the rail and the agent dock, for two different reasons: `learner` is
  optional and its absence means sign-in, which has no session and so no nav and no
  footer identity; `bare` is session mode for a learner who has ninety seconds inside a
  live call. Sign-in used to hand-roll its own `<head>`, and the fonts, favicon and
  noindex tag then drifted from the layout's. Do not make `learner` required again —
  that is what forced the duplicate `<head>` back the first time.


**Cross-link spine:** assessment ⇄ CAIO ⇄ cohort. Assessment is the front door, the CAIO
retainer is the expansion, the cohort is capability-transfer / lead-gen. The fee-credit
mechanic (assessment fee → first month of the CAIO retainer) must stay consistent on both
the `/assessment` and `/caio` pages.

## Branding
Teaching brand = **The Living Craft** (`/`). Consulting = a brand-neutral **personal
practice** ("Sunil Mathew", mono descriptor "Fractional CAIO" / "AI Readiness"), a distinct
but cross-linked surface. Open decision (flag to Sunil): umbrella vs personal brand vs new
practice name — copy is written brand-neutral so the wordmark can be swapped.

## The facts module — read this before editing any offer
[src/data/facts.ts](src/data/facts.ts), [src/data/cohort-copy.ts](src/data/cohort-copy.ts)
and [src/data/offer-display.ts](src/data/offer-display.ts) are the shared source for public
offer facts and approved cohort copy. JSON-LD, `/llms.txt`, `/api/facts`, the visible page
and visitor Q&A grounding consume those modules. The retired regional prices are not a
public source and must not be reintroduced from old marketing material.

The gated `/craft` learner area is the one exception, and it is a separate file:
[src/data/learner-cohort.ts](src/data/learner-cohort.ts) holds the internal teaching
schedule (six weeks, eight seats, a September start) that the public offer withholds. Only
the learner pages read it, and they alias it as `cohort`. **It must never be imported by a
public surface** — that would republish the withheld figures through a side door.

**A region can be served without its price being published.** `Region.publicPrice`
in [src/data/regions.ts](src/data/regions.ts) gates the figure on every public surface at once — the
pricing block, the JSON-LD `Offer`, `/api/facts`, and the Q&A agent — and all four
fall back to "shared on application". It is off for Dubai and Australia, whose rates
are uncalibrated and carry no struck-through `standardPrice` telling a reader the
price will rise; India is on. Public consumers must read `publicCohortPricing`, not
`cohortPricing` — the console reads the full list on purpose, because a working number
Sunil cannot see in his own console is one he restates from memory somewhere else.
Turning a region on is one boolean; adding a fifth public consumer that reads
`cohortPricing` is how the figure gets out anyway.

Never state an offer fact directly in a page, a schema block, or an agent prompt —
route it through `facts.ts`. The failure this prevents is subtle and bad: a stale
number that is right on the page but wrong in the answer an AI assistant gives
about us.

## The operator console (`/craft/admin`)
Password-gated operator surface. Five jobs: traffic, leads, the questions visitors
asked the Q&A agent, content review, and **teaching the cohort** — `/craft/admin/discussion`,
`/craft/admin/sessions`, `/craft/admin/work`, `/craft/admin/baseline` and `/craft/admin/feedback`,
all described under *The learning agent*.

**Fourteen destinations, in two groups, and three of them are composed pages.** The bar
carried fifteen in one undifferentiated row and several were the same job filed twice; the
merges below took it to ten, and the cohort pipeline has since added four — **pipeline**,
**comms**, **records** and **admin**. What merged, and the argument for each:
- **Work** = the week's check + the decision records + the comparison. The third page was
  *derived entirely from the other two* — a panel that had been filed as a destination. They
  are also one question asked three ways (did the idea land?), and disagreement between the
  check and the record is only visible with both on one screen.
- **Baseline** = the intake + the week-6 re-ask. One instrument: the same thirteen questions
  in the same words, and §5.6 already treats them as one thing. The familiarity page could
  not render without reading the intake responses, because the pair IS the reading. Two URLs
  meant holding the before-numbers in your head while looking at the after-numbers.
- **Agents** = the radar + visitor content + unanswered questions. Three review queues for
  machine output. **This does not merge the two STORES** — `radar_findings` is still read only
  by the radar panel and is still off the visitor agent's tool surface. Where Sunil looks is
  not what the agent can reach.

A merged page is composed from `src/components/admin/*Panel.astro`; each panel keeps its own
scoped styles and script. **Two things to check when composing another one**: element ids were
page-unique and are now page-shared (the two "Run now" buttons both wrote to `#runStatus`, so
the content sweep reported its progress into the radar's status line), and only the page may
carry an `<h1>`.
**`/craft/admin/sessions` is the teaching plan from Sunil's side** — the day he wrote, the
room's checkpoint answers against it as **counts, never a mean**, and a per-week list of what
is not set yet and exactly what each omission stops. It is also the only reader of
`roomAtCheckpoints()`, which was written, tested and wired to nothing: four numbers a session,
captured while the session can still change, that no page displayed. **`movesMost` is rendered
here and deliberately not on the learner page** — "expect low numbers on 3 and 4" is a fair
claim to check a delta against, and exactly the wrong thing to show somebody in the ninety
seconds before they rate themselves against those same five statements. Nothing on the public site reads from it,
and if every one of its env vars is missing the public pages behave exactly as they
did before it existed.

- **Auth** — one password (`ADMIN_PASSWORD`) exchanged for an HMAC-signed HttpOnly
  cookie ([src/lib/admin/auth.ts](src/lib/admin/auth.ts)). Enforced in
  [src/middleware.ts](src/middleware.ts) over the whole `/craft/admin` + `/api/craft/admin/*`
  prefix, **not per page** — so a new admin page is protected by default. An
  unconfigured console is closed (503), never open.
  - **The console's prefix is a subset of the course area's, and the order of the
    two checks in `middleware.ts` is therefore load-bearing.** `/craft/admin/leads`
    matches `isAdminPath` *and* `isCraftPath`. The admin check runs first and the
    learner gate only ever sees what it declined; swap them and a seat code — which
    every participant holds — opens the leads ledger, the questions log, and every
    other learner's intake answers. Don't reorder them, and don't let a `/craft`
    allowlist entry (`CRAFT_OPEN`) grow a prefix that swallows a console path.
  - The learner login's `?next=` excludes `/craft/admin` for the same reason: it
    starts with `/craft`, and there is nothing in the console for a learner to
    return to.
- **Storage is Supabase** — forty-six tables, schema in
  [supabase/schema.sql](supabase/schema.sql), reached only with the service-role key,
  RLS on with zero policies so no other key can touch it. Rollups are SQL functions,
  because aggregating in TypeScript means a row cap that silently truncates.
  - *The practice:* `events`, `leads`, `questions`, `radar_findings`, `radar_runs`.
  - *The pipeline* (new, and the cohort rebuild's own store): `organisations`, `people`,
    `cohorts`, `form_submissions`, `opportunities`, `attributions`, `consents`,
    `activities`, `tasks`, `audit_log`, `staff`. **`form_submissions`, not `submissions`** —
    that name was already taken by the learners' decision records and the collision would
    have been silent. The save is one plpgsql function, `pipeline_submit()`, because six
    sequential supabase-js calls have no transaction around them and a function killed
    between two awaits leaves a person with no submission. `consents` has an UPDATE trigger
    that refuses: a withdrawal is a new row, never an edit of the row that granted it.
  - *Communications* (stage 4, dispatch off): `message_templates`, `comms_sequences`,
    `comms_messages`, `comms_suppressions`, `comms_events`. And `resource_requests` — the
    V4 addendum's fourth record type, which **an anonymous download never reaches**: only
    somebody who typed an address is a person, so a count there is people rather than
    downloads.
  - *The evidence behind a stage*: `meetings`, `offers`, `payments`, `admissions`,
    `attendance`, `nominations`, `stage_history`. **There is no `enrolled` column
    anywhere** — enrolment is derived by `enrolment_blockers()`, which returns one row per
    missing piece. `admissions` and `payments` are separate tables with separate authors
    because enrolment needs two facts from two people who cannot act for each other; two
    booleans on `opportunities` could both be set by whoever had the row open. Amounts are
    minor units. A refund is a row plus a review task and changes no stage. A nomination is
    **not** a person and **not** an applicant.
  - *The cohort:* `learners`, `intake_responses`, `familiarity_responses`,
    `submissions`, `quiz_responses`, `session_prompts`, `outcome_ratings`,
    `checkpoint_ratings`, `pair_drafts`, `pair_reviews`, `doubts`,
    `discussion_replies`,
    `feedback`, `feedback_responses`.
    All but the last two are keyed to `learner_id` with `ON DELETE CASCADE`, so erasing
    someone from `/craft/admin/learners` really erases them. `feedback_responses` is the
    exception on purpose: it is Sunil's note to the whole room, holds no personal
    data, and must survive one learner leaving. `discussion_replies` is the half-exception:
    a learner's own replies cascade with them, but Sunil's and the syllabus's are
    `learner_id null` and survive — while erasing a thread's *author* still takes the whole
    thread, replies included, because keeping the conversation and removing the name from
    the top of it is not a deletion.
  - **`doubts` is the discussion forum's THREAD table.** The name predates the forum and
    stayed: renaming a live table is a migration with real downside and nothing a reader
    would ever see. [src/lib/craft/discussion.ts](src/lib/craft/discussion.ts) is the only
    file that has to hold both names, and it says so at the top.
- **Every query degrades to empty on error — so the console probes and says so.**
  That degradation is deliberate (one slow rollup must not 500 the page) but it
  makes a *missing table* and *no rows yet* render identically; `/craft/admin/agents` said
  "never run" in both cases, and that cost a real diagnosis after the schema grew.
  [src/lib/admin/health.ts](src/lib/admin/health.ts) probes every table and rollup, cached 60s, and
  `AdminLayout` shows a red banner when anything is not answering. **If you add a
  table or a rollup, add it to the probe lists** — otherwise it is invisible until
  it breaks. This is the one place in the console where failing loudly is the point.
- **Retention and erasure are separate mechanisms, on purpose.**
  - *Retention* (timer): `events` 180 days, `questions` 365, via `admin_purge()`.
    Windows are SQL function defaults, so shortening them needs no deploy. There is
    a 30-day floor that **raises rather than clamps** — a 0 passed by a bug would
    otherwise empty the table while looking like policy. Run from `/craft/admin`, or
    enable pg_cron (snippet is commented at the foot of the schema). Until then the
    policy is only real if someone presses the button.
  - *Erasure* (per person, deliberate): the **Erase** button on `/craft/admin/leads` and
    `/craft/admin/learners`. Hard delete, never a soft flag — a DPDP deletion request is
    not answered by filing someone differently while their details stay in the
    table. Erasing a learner cascades to `intake_responses`; that `ON DELETE
    CASCADE` is load-bearing, not convenience.
  - `leads` and `learners` are **never** purged on a timer: a real enquiry must not
    be lost to a cron job, and the schema keeps withdrawn seats on purpose.
  - Neither reaches the **Web3Forms inbox copy**. A complete erasure means deleting
    that email thread too, and the console cannot do it for you.
- **Traffic is first-party** ([src/components/Track.astro](src/components/Track.astro) →
  [src/pages/api/track.ts](src/pages/api/track.ts)). `@vercel/analytics` is still
  loaded but its data lives in Vercel's dashboard where the site cannot query it.
  Bots are excluded, raw IPs are never stored, and a visitor is a salted hash of
  IP+UA+**today's date** — so it rotates at midnight and cross-day tracking is not
  reconstructible from what we keep. Referrers are stored as a bare host.
- **Leads are a ledger, not a delivery path.** Web3Forms still delivers every lead
  from the browser, unchanged. `/api/lead` records the same submission *and whether
  the Web3Forms post succeeded* — a row with `delivered: false` is someone who
  believes they applied and never reached the inbox, which was invisible before.
  **The inbox stays the system of record; if the two disagree, the inbox wins.**
- **Content edits go out as pull requests** ([src/lib/admin/github.ts](src/lib/admin/github.ts)).
  A Vercel function cannot write to its own deployment, but the constraint and the
  design agree: what the visitor agent knows should only change through a diff a
  human approved. Console edits land on a long-lived `console/*` branch, so three
  edits are three commits on one PR. **The console deliberately does not change on
  click** — the item goes when the PR merges and the site redeploys.
  Only `title`, `body` and `implication` are editable. **Not `source`, `gatheredAt`
  or `sourceType`** — fixing the prose is editing; changing the citation would be
  fabrication. Rerun the agent instead.
- **"Run now" dispatches the GitHub Action**, never researches inline: a sweep is
  minutes of Opus web-search calls and has to land as a commit.
- Reading the console needs Supabase; the write-back buttons need `GITHUB_TOKEN` +
  `GITHUB_REPO` and disable themselves with an explanation when absent. Every panel
  degrades on its own — a missing var greys out one thing, not the page.

## Booking (`/book`, the widget, `/craft/admin/bookings`)
**This site owns the calendar. Google is a notification channel, not a source of
truth.** Availability is computed from rules in our own database
([supabase/schema.sql](supabase/schema.sql): `booking_rules`, `booking_blocks`), never from a Google
free/busy query. Say the cost out loud, because it will surprise someone:
**an event Sunil puts in his own Google Calendar does not close a slot here.**
Keeping time is a block in the console, and nothing else.

What Google *is* for is the invite. On a booking the site creates the event with
the booker as an attendee and `sendUpdates=all`, so Google emails both people,
puts it in both calendars, attaches a Meet link, and emails both again when the
call moves or is called off. That is a transactional email system we do not have
to build, run, or get past a spam filter — and it is why there is no Resend or
Postmark here.

- **Call types are code, availability is data.** "A discovery call is 30 minutes"
  is an offer fact and lives in [src/data/meetings.ts](src/data/meetings.ts), beside the page copy.
  "I am free on Tuesdays" changes weekly and lives in the database. When adding
  something, that is the question to ask.
- **Three surfaces, one engine.** `discovery` on `/caio` and `scope` on
  `/assessment` are public; `office-hours` is learner-only and sits inside the
  gate at [/craft/office-hours](src/pages/craft/office-hours.astro). [BookingWidget.astro](src/components/BookingWidget.astro) serves both
  through a `mode` prop and **refuses at build time** if a learner type is put on
  a public page, or a public type inside the gate.
- **The learner path is gated by its path alone.** [/api/craft/booking](src/pages/api/craft/booking.ts) is under
  `/api/craft`, so `middleware.ts` closes it and hands it a verified learner. A
  learner never sends their own name or email — those come from the seat row, so
  nobody books as somebody else. Do not add a learner branch to `/api/booking/*`;
  reusing the gate is the whole reason that file is where it is.
- **Double booking is refused by Postgres, not by TypeScript.** A `gist`
  exclusion constraint on `tstzrange(starts_at, ends_at)` rejects the second of
  two simultaneous inserts. A "is this free?" SELECT cannot close that window; a
  constraint can. `'reschedule_requested'` is inside the constraint's predicate
  on purpose — asking someone to move does not release their slot until they do.
- **The posted time is never trusted.** `bookSlot()` re-derives availability
  server-side and rejects anything not on the list. Without it a crafted request
  books 3am on a Sunday, and the constraint would not object, because nothing
  else is booked at 3am on a Sunday.
- **The row is written before Google hears about it.** A Google outage then costs
  an invite, not a booking. The reverse order loses the call and leaves an orphan
  event. A booking that saved but did not sync is flagged red in the console —
  that person is expecting a call and has no invite.
- **Reschedule links are credentials.** The token lives in the URL in the
  calendar invite; the database holds only an HMAC of it
  ([src/lib/booking/tokens.ts](src/lib/booking/tokens.ts)), same reasoning as `learners.code_hash`. A wrong
  token gets the same 404 as an unknown booking, so the page cannot be used to
  confirm that a booking exists. `/book` is disallowed in robots.txt for the
  same reason.
- **"Suggest alternatives" travels through the calendar invite.** The console
  records the proposed times, reads the event description back from Google, adds
  a line above it, and patches it with `sendUpdates=all`. The reschedule link is
  already in that description, which is why the existing text is read rather than
  replaced — we cannot rebuild it, because we do not keep the token.
- **A booking writes a `leads` row but posts nothing to Web3Forms.** The invite
  is the notification, and it lands in the calendar Sunil runs his day from. The
  no-server-side-Web3Forms rule is untouched. A learner booking writes no lead
  row at all — a participant does not belong in the list of people to follow up.
- **Without `GOOGLE_*` set, booking still works and nobody gets an invite.** The
  console says so in a banner. Same degradation rule as every other panel.
- Timezone maths is in [src/lib/booking/slots.ts](src/lib/booking/slots.ts) and is pure, so it can be tested
  without a database. Rules are wall-clock times in `HOST_TIMEZONE`; slots come
  out as instants; the browser formats them in the visitor's own zone. The
  two-pass `zonedToInstant` is correct across daylight-saving changes — India has
  no DST, but the host zone is a constant someone can change.

## Agents
Three agents now — two retrievers and the visitor Q&A agent. The two retrievers
share their machinery ([scripts/lib/research.ts](scripts/lib/research.ts)) and share
none of their audience; that separation is load-bearing, see the radar entry.
- **Visitor Q&A agent** — [src/pages/api/ask.ts](src/pages/api/ask.ts). Claude Opus 5 tool-use loop on a
  Vercel function. Tools: `search_knowledge` (grounded facts),
  `get_latest_updates`, `capture_visitor` (leads → the same Web3Forms inbox).
  Retrieval in [src/lib/agent/knowledge.ts](src/lib/agent/knowledge.ts) is lexical, not embeddings — the
  corpus is 21 facts and lexical scoring is auditable. UI: [src/components/AskWidget.astro](src/components/AskWidget.astro).
  - **The response is a stream** — NDJSON, one event per line, `delta` / `status` /
    `done` / `error`. A question runs a thinking model through up to six tool
    round-trips and the widget used to show nothing until the last token landed.
    Anything refused *before* the stream opens (rate limit, budget, no key) is still a
    plain JSON body with a real status code, which is why the widget branches on
    `res.ok`. **Don't collapse those two paths**: once the stream is open the status is
    already 200 and a failure can only be an `error` event.
  - **The history comes from the browser and is not evidence.** Capping its length stops
    a crafted request growing the context window and nothing else — a POST can carry an
    `assistant` turn quoting a price nobody set, and from inside the model that is
    indistinguishable from a fact established by a real tool call. `GROUNDING_REMINDER`
    is appended after the history as a `system` turn inside `messages` (Opus 5, no beta
    header), re-asserting that only *this* turn's tool results count. Holding the
    conversation server-side would be the stronger fix and is ruled out: it means a
    visitor-facing path reading from Supabase. The `forged-history` eval probe is what
    tells you this still works.
  - **The cache marker sits at the end of the frozen text**, with the page and the
    region in a second system block after it. It used to be one block with both, so the
    cached prefix ended with request-derived text — three surfaces × four region states,
    twelve prefixes, each paying 1.25× to write an entry that mostly expired unread.
    Nothing built from the request may go before that marker, and neither may anything
    in `TOOLS`.
- **Retriever agent** — [scripts/gather-latest.ts](scripts/gather-latest.ts) (`npm run gather`). Tracks
  **trends and skills in the agentic AI space** — architecture patterns, evals
  and reliability, agent security, what teams are hiring for, and releases that
  change how systems get built. Topics map to the cohort's modules, because the
  job they serve is a prospect asking "is this material current?". Writes
  [src/data/latest.json](src/data/latest.json), which the Q&A agent reads. Scheduled weekly by
  [.github/workflows/gather-latest.yml](.github/workflows/gather-latest.yml), which opens a **PR rather than committing** —
  a human should see what the agent gathered before prospects do.
  - It briefly tracked India/EU *regulatory* news instead. That was an
    unrequested inference on my part, and wrong: a practice selling regulatory
    depth citing trade press for an RBI claim is worse than saying nothing.
  - One research call **per topic** — a shared search budget let the first topic
    starve the rest, and the agent reported thin findings rather than admitting
    the coverage gap. Because nothing is shared between topics they now run
    **concurrently** (`RESEARCH_CONCURRENCY`, bounded at 3 — the ceiling is tokens
    per minute, and a 429 mid-sweep costs research already paid for). If topic
    budgets ever stop being per-topic, this stops being safe.
  - **It can open pages, not just read snippets** (`FETCHES_PER_TOPIC`). Both
    retrievers are told to prefer the primary artefact and the radar grades every
    source as primary/press/vendor/secondhand — and until 7 Sep they did both from
    a search result written by whoever wanted the click. A judgement about a source
    has to be a judgement about the source. Fetches are budgeted below searches on
    purpose: searching finds candidates, fetching is spent on the few you report.
  - A topic that throws no longer kills the sweep — the others were already paid
    for. All of them failing still throws, because "found nothing" and "never ran"
    must not look the same.
  - Items carry `reviewNote` for Sunil (source quality, what couldn't be
    confirmed). It is excluded from `formatLatest()` **and** from `/api/facts`,
    so his private doubts never reach a visitor or a crawler. Keep it that way.
    (The admin console *does* show it — that's the one place it belongs.)
- **Radar agent** — [scripts/gather-radar.ts](scripts/gather-radar.ts) (`npm run radar`). The second
  retriever. Writes the **`radar_findings` table**, read **only** by the radar panel on `/craft/admin/agents`.
  Six operator-facing categories in [src/data/radar-categories.ts](src/data/radar-categories.ts):
  trends · big-tech investment · what's working · what's failing · India hiring ·
  durable skills. Weekly via [.github/workflows/gather-radar.yml](.github/workflows/gather-radar.yml), which writes
  **straight to the database — no PR**. That gate is right for the visitor
  retriever, whose output a chatbot repeats verbatim; here it meant a merge and a
  deploy before Sunil could read his own notebook. Review moved rather than
  vanished: findings arrive `status = 'new'`, and hiding or correcting one is an
  UPDATE via `/api/craft/admin/radar-item`. The sweep needs `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` as **GitHub Actions secrets**, not just in Vercel.
  - **`/api/ask` must never import [src/lib/agent/radar.ts](src/lib/agent/radar.ts) or query the radar
    tables.** Two stores exist because there are two readers. "Google is investing $N billion in agents" is
    useful to Sunil and off-key from a chatbot answering a cohort question — and
    the categories that make this feed valuable (what's failing, salary and hiring
    numbers) are exactly the ones where a half-sourced claim repeated to a prospect
    does real damage. Keeping it off the agent's tool surface makes that
    structurally impossible instead of a matter of prompt discipline.
  - Unlike `latest.json`, which is replaced wholesale each run, the radar
    **accumulates** — pruned at 120 days. A quarter of hiring signal beats this
    week's slice of it. Deduping is now a unique index on the normalised source
    URL rather than a comparison in the script, so two overlapping sweeps cannot
    race each other into two rows for one story.
  - Items carry `sourceType` (primary/press/vendor/secondhand), graded by the agent
    and shown as a coloured pill. A vendor blog and a peer-reviewed paper are both
    "a link"; only one is safe to quote to a board.
- **Gap reader** — [scripts/gather-gaps.ts](scripts/gather-gaps.ts) (`npm run gaps`). Not an agent; one
  grouping call a week, and the other direction from the retrievers. They ask the
  world what changed; this asks our own traffic what we are missing. Every row in
  `questions` with `answered = false` is a prospect saying, for free, that
  `facts.ts` does not cover this, and until 7 Sep nothing read those rows back.
  Writes [docs/fact-gaps.md](docs/fact-gaps.md) and opens a PR
  ([.github/workflows/gather-gaps.yml](.github/workflows/gather-gaps.yml)).
  - **It never drafts an answer, and no prompt makes that safe.** `facts.ts` is
    worth trusting only because a human who knew it was true wrote every line; a
    model filling it in is our own pricing invented one merge away from a chatbot
    quoting it. The model does exactly one job — saying which questions are the
    same question — and every entry in the report has a deliberate blank where the
    answer goes. Merging it changes nothing a visitor sees; it lands a work list.
  - §4's invariant applies here too: the model groups **by index**, the code counts
    and reads the question text back out. So a paraphrase cannot quietly replace
    what somebody asked, and no number in the report came from a model.
- **Both** retrievers are forbidden from writing our own prices/dates/seat counts.
  Those come from `facts.ts`; two sources could disagree and the Q&A agent would
  have no way to tell which is true.
- **Grounding rule:** the Q&A agent may state a fact only if a tool returned it,
  and must say "I don't know" and offer the handoff otherwise. This is how the
  hard rules below survive contact with a chatbot — the easiest place on a site
  to invent a price.
- All three need `ANTHROPIC_API_KEY` (see [.env.example](.env.example)). Without it `/api/ask` returns
  503 and the widget points visitors at the form — degrades, doesn't break. Set a
  spend limit on the key; that's the real cost ceiling. **All three share it**, which
  is how draining it on retriever iteration took the live site agent down once.
  Separate keys per agent would make the blast radius match the blame — flagged,
  not done, and it costs one environment variable.

## The eval — the only thing that catches the silent failure
`npm run eval` ([scripts/eval-agent.ts](scripts/eval-agent.ts)), against a running dev server or a
deployment. It replaces the old `npm run smoke`, which is now an alias.

Everything else that breaks here breaks loudly: a bad deploy 500s, a missing key
503s, a type error stops the build. The one failure this whole architecture exists
to prevent — the agent answering from what it knows rather than from what a tool
returned — is a well-written paragraph with a wrong number in it. It raises
nothing. **If it is not measured it is not noticed**, and it will be noticed by a
prospect.

- Fifteen probes, each scored, split into **critical** (it invented, leaked across
  regions, or repeated a forged history — one is a build failure whatever the
  score) and **standard** (it missed something it should have found). Averaging
  those two together is how a pricing leak hides behind twelve passes.
- The score is committed as [scripts/eval-baseline.json](scripts/eval-baseline.json) and CI fails on a drop.
  **There is no baseline yet** — take one with `npm run eval -- --update-baseline`
  once the key is available, and commit it with the change that justified it.
- Path-filtered in CI ([.github/workflows/eval-agent.yml](.github/workflows/eval-agent.yml)): a full pass is
  fifteen live Opus calls, so it runs when `facts.ts`, `latest.json`, the system
  prompt, or `lib/agent/**` change — not on every push. Needs
  `ANTHROPIC_API_KEY` as a repository secret and nothing else.
- **Add a probe whenever the agent gets something wrong in the wild.** That is
  what stops the same failure twice, and the failure log is `docs/fact-gaps.md`
  plus the console's questions panel.

## SEO / AISO
- [src/components/SeoHead.astro](src/components/SeoHead.astro) — shared `<head>` for all three layouts: meta,
  canonical, OG/Twitter, and one JSON-LD `@graph`. Pages pass a `schema` prop
  (Course / ProfessionalService / Service + FAQPage); the Person node is shared
  and `@id`-referenced so a crawler learns the surfaces are one practice.
- `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/api/facts` are all generated from
  `facts.ts`. **robots.txt deliberately allows AI crawlers** — buyers here ask an
  assistant before a search engine, and `/llms.txt` + `/api/facts` exist so the
  answer they get is the one we wrote. Disallowed: `/api/ask` (POST, costs money per
  call), `/api/track` and `/api/lead` (POST-only; indexing the beacon would pollute
  its own data), and `/craft` — which now covers the console at `/craft/admin` with
  the same one line. Politeness only, since robots.txt is a request and the real
  defence is the session checks in `middleware.ts`.
- `SeoHead.astro` is for public surfaces only. **`/craft/admin` must never use it** — a
  JSON-LD `@graph` describing the cohort, emitted from a page listing leads, is
  exactly the wrong artefact. `AdminLayout.astro` has its own minimal head.
- **Only the production deployment may be indexed.** One check,
  [src/lib/env.ts](src/lib/env.ts), reads Vercel's own `VERCEL_ENV` and drives three
  layers: `robots.txt` serves `Disallow: /` off production, `SeoHead` emits
  `noindex, nofollow`, and `middleware.ts` adds the same as an `X-Robots-Tag` header.
  Read that file before changing any of the three. Two things in it are easy to get
  wrong:
  - **A prerendered route decides this at BUILD time — which is why nothing on the
    public site is prerendered any more.** Thirteen routes carried `prerender = true`
    (`/llms.txt`, `/sitemap.xml`, `/toolkit` and everything under `/resources` and
    `/tools`) until 15 September, when Sunil asked for the whole public site back on
    request-time rendering. Eleven lost the flag outright; the two dynamic slug routes
    (`/resources/guides/[...slug]`, `/resources/templates/[...slug]`) lost
    `getStaticPaths()` too and now look their entry up from `Astro.params` at request
    time, 404ing via `Astro.rewrite('/404')` on an unknown or draft slug — the same
    draft gate `getStaticPaths()` used to enforce at build time. If a route here ever
    grows a `prerender = true` back, remember what it costs: the middleware's
    `X-Robots-Tag` header never runs for a prerendered route, only `robots.txt` covers
    it off production, and it costs a fresh Vercel function invocation per request
    instead of a CDN-edge file.
  - **A staged production build is a production build.** `VERCEL_ENV` is
    `production` for a deployment that has no domain assigned yet, so the check calls
    it production and the stage URL is indexable. If staging by that route is
    adopted, this has to gate on the request host instead. Promoting a *preview* to
    production is a different thing and rebuilds, so it is safe as it stands.
- `SeoHead` owns the robots meta tag, and it is the only place that emits one on a
  public page. A page that must stay out of the index whatever the environment passes
  `noindex` (`PracticeLayout` forwards its own prop straight through). Never add a
  second `<meta name="robots">` beside it.
- Canonical host is `learning.thelivingcraft.ai`. The apex and `www` are
  unattached (404) — flagged to Sunil, not fixed here.

## Shared infrastructure
- **Design system:** [src/styles/global.css](src/styles/global.css) — imported by every *public* layout. Reuse its
  classes (`hero`, `proofbar`, `cards3/card`, `sec-head`, `eyebrow`, `experience`/`statband`,
  `price-card`, `detail-row`, `faq`, `apply-form`, footer) before inventing new ones.
  Page-specific components (tiers, comparison rows, phase arc, fit/not-fit) live in scoped
  `<style>` blocks in the page files.
  The console has its own [src/styles/admin.css](src/styles/admin.css) — same tokens and typefaces at a
  working density (tables and hairlines, not 104px sections). It deliberately does
  **not** import `global.css`: it uses four of those 220 lines, and sharing them
  would mean every change to the public design reflows the console.
  The course area has [src/styles/craft.css](src/styles/craft.css), which — unlike `admin.css` — is **additive to
  `global.css`, never a replacement**: a learner who applied on the strength of the public
  pages should not land somewhere that looks like a different product, so the dark
  forest hero, the forest action button, `.wrap`, `.eyebrow`, `.card` and `.tlist` all
  still come from `global.css`. `craft.css` holds only what the marketing pages have no use for —
  `panel`/`stack`/`row`, the state `pill`, `klabel`, `facts`, `page-head`, the intake's
  scale cells, the pager, the sign-in card. It exists because those pieces had been
  written four times in four page-scoped `<style>` blocks and had drifted: sign-in was on
  the illustration-led system while the three pages behind the gate were the old
  warm-craft structure with new tokens poured into it. Two laws it holds and page-scoped
  CSS kept breaking: **a panel gets a shadow or a border, never both** (under design
  system v1 it is the 1px ring `--shadow-raise` draws, and hairlines are still legal *inside* a
  panel, as row dividers), and **if it is forest-filled it is clickable**. `--sun` is
  the action colour's old name and now resolves to forest green, so ink text on it is
  about 1.2:1; text on it is `--text-on-accent` (ivory). A status pill, badge or tag is
  therefore never forest-filled: it is an outline or a soft fill. The forum's instructor
  badge is soft green with forest text for exactly this reason. Code keeps a monospace
  face through `--font-code`: `--font-mono` is Figtree now, so any rule that sets code or
  the seat code must use `--font-code`. One trap: `global.css` already owns short names like `.mod` (the
  public module card), so a bare `.mod` in a session row renders inside a phantom nested
  card. Namespace anything generic.
  `admin.css` imports `ds/contract.css` and `ds/theme.css` — the tokens — and the
  console sets `data-density="compact"` on `<body>`, which is the surface those
  compact values were written for. Since 18 September the console and the course area
  use the same design system v1 values as the public site. Compact density now changes
  only rhythm, not shape: 40px rows, **36px controls** (the one deliberate departure from
  the package's 44px target, and still well above WCAG's 24px), 14px body. It no longer
  overrides radii, because the package's 6px and 12px already suit a dense table.
- **Forms:** Web3Forms via client `fetch` ([src/data/site.ts](src/data/site.ts) holds the access key + contact
  email). Same inbox (greetsunshine@gmail.com), distinct `subject` per page. Honeypot +
  graceful email fallback. No backend, no other client storage.
- **Web3Forms is client-side only on the free plan.** A server-side POST returns
  `403 {"success":false,"message":"This method is not allowed. Use our API in
  client side..."}`. This bit the agent's lead capture: `/api/ask` ran the post
  from a Vercel function and every handoff failed. The server now only validates
  and returns a payload; [src/components/AskWidget.astro](src/components/AskWidget.astro) posts it from the
  browser, same as the forms. **Don't move any Web3Forms call server-side.** The
  admin lead ledger does not change this: the browser posts to Web3Forms exactly as
  before, then reports the outcome to `/api/lead`.
- **Deploy:** `@astrojs/vercel` adapter, `output: 'server'` — every route renders on
  request, none is emitted as static HTML at build time. It was `output: 'static'` with a
  per-route `prerender = false` opt-out on most routes already — `/craft`, `/craft/admin`,
  every `/api/*` route and the home page all needed one. Only seven routes were still
  genuinely static: `/latest`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/resources` and
  its two self-hosted long-form pages. None of the seven has per-request state — they are
  pure functions of `facts.ts` and the resources data modules — so a server default costs
  nothing there and removes the last reason to keep `prerender = false` on every other
  route by hand, which is exactly the kind of flag that rots the first time someone adds a
  route and forgets it. **The real trade: those seven pages were static files served at the
  CDN edge, and are now a Vercel function invocation on every request.** `npm run dev` to
  preview (`astro preview` is unsupported with the Vercel adapter). Old
  `/india|/dubai|/australia` paths redirect to `/?region=`.
  - The Vercel project is **connected to the GitHub repo** (production branch `main`),
    so **a push to `main` deploys production**. Before that connection existed, every
    deploy was a hand-run CLI command, and production silently drifted commits behind
    `main` more than once.
  - `pnpm promote` still exists and is still the right command **after a schema change**.
    Git deploys inherit four of its five gates for free — only committed code ships, only
    `main` targets production, the push *is* origin, and a failed build does not deploy —
    but nothing checks that the prod DB has the tables the code expects. So: run
    `supabase/schema.sql` first, then push. Shipping code ahead of its schema now shows up
    as the console's "table is not answering" notice rather than as a crash, which is
    survivable but confusing.
  - A hand-run `vercel --prod` is blocked by a global guard hook and should stay that way;
    `pnpm promote` is the guarded path ([scripts/promote.mjs](scripts/promote.mjs)).
  - **Check for parallel work before you commit and before you push. Sunil edits this
    repo directly and from other sessions, so the tree and the remote both move under
    you.** Two checks, and both have already failed once:
    - **`git status` before staging, and stage explicit paths — never `git add -A`.**
      Uncommitted files you did not write are normal here, not leftovers. `git add -A`
      once swept a 313-line teaching note Sunil had written into a commit whose message
      claimed authorship of it, and pushed it unread. If a file you did not write is in
      the way, read it and say so; do not commit it silently, and never assume it is
      stale. The same sweep once caught `walkthrough/` — personal notes destined for a
      learner-visible repo.
    - **`git fetch && git log HEAD..origin/main` before pushing**, and re-read anything
      you are about to edit that came back changed. Because a push deploys production,
      a stale picture of `main` is not a merge conflict you notice — it is work built on
      content that has already been replaced.
  - **Before writing a new file under `docs/teaching/`, list the directory.** The answer
    to "does a note for this already exist?" is a `ls`, not a memory of the last time you
    looked. Two notes answering the same question is the duplication the rest of this file
    exists to prevent, and it is how the two drift.
- **Building locally needs Node ≥ 22.12.** The nvm default here is 20.20.1, which Astro
  refuses outright (`Node.js v20.20.1 is not supported`) — that error is the toolchain, not
  the code. The system install at `/c/Program Files/nodejs` is 24.x and works:
  `export PATH="/c/Program Files/nodejs:$PATH"` before `npm run build` or `npx astro check`.
- **`astro check` is clean — 0 errors.** It was 8, all in `GuideSidebar.astro`; that
  component is gone, replaced by `AgentDock.astro` with guarded DOM queries. **Compare
  against 0**: any error is something you introduced.
  - Was 11 before that, with 3 more in `middleware.ts` from a `PoC BYPASS` that injected
    a mock `Learner` missing `note` and `last_seen_at`. **If those 3 ever reappear,
    someone has reintroduced a bypass, not a type error** — treat it as the security
    regression it is.
- Legacy reference files at repo root (`copy.md`, `index.html`, `section-map.md`, `meta.md`,
  `assets/`) predate the Astro build — treat as historical, not the source of truth.

## Rendering markdown that somebody else wrote
**[src/lib/craft/markdown.ts](src/lib/craft/markdown.ts) is the only file that may import
`marked`.** Everything else calls `renderMarkdown()`.

`marked` has not sanitised anything since v5 — raw HTML in the source passes straight
through, by design. Four surfaces were calling `marked.parse()` on learner-authored text and
injecting the result, and the one that mattered was the console: a decision record containing
`<img src=x onerror=…>` executed **in the session holding the admin cookie**, which made a
learner field a path from the course area into the operator surface. The forum already
guarded this (`asMarkdown()` lets only instructor and system replies through); the ADR path
was missed.

`renderMarkdown()` drops the `html` token and constrains link and image destinations to
http/https/mailto/relative — `[click](javascript:…)` needs no tag at all, which is the half
people forget. It does **not** escape the source before parsing: that turns a fenced code
block containing markup into a block of `&lt;`.

**The console also loaded `marked` from an unpinned CDN at runtime** — `cdn.jsdelivr.net/npm/marked`,
no version, executing in the admin session, while `marked` was already a dependency. Both
copies are gone. Do not reintroduce a CDN script here; the console has no CSP in front of it.

## Two places that own a format, and the surfaces that must not re-implement it
- **`buildAdr()` / `parseAdr()`** ([src/lib/craft/adr.ts](src/lib/craft/adr.ts)) own the
  `## Heading` record format. The section LIST was consolidated on 9 September; the FORMAT was
  not, and it survived in three more places — `adr.astro` and `pair.astro` each reassembled it
  client-side, and `pair.astro` imported `buildAdr` without ever calling it because its script
  was `is:inline` and an inline script cannot import. **A module `<script>` can** — Vite bundles
  it — which is the fix, and it also puts that code under `astro check` for the first time.
- **`tourFor()` / `tourById()`** ([src/lib/craft/tour.ts](src/lib/craft/tour.ts)) own which tour
  belongs to which route. The overlay used to ship the tours as JSON in the DOM and re-implement
  the matching beside it — two copies of one rule, the kind that drifts the first time somebody
  adds a route pattern.

**`pairing.ts` is what happens when a format has two owners.** Its quiz/ADR comparison read
`## Decision` with a regex of its own — a heading from the retired five-section template. Every
record written under the current seven returned the empty string for that half, and it failed
*silently*: a thinner input produces more `unclear` verdicts, and `unclear` is a legitimate
answer that module gives on purpose, so a broken read looked exactly like an honest one.

## Hard rules
- **NEVER invent** testimonials, client names, logos, student counts, salary figures,
  metrics, or partner names. Use clearly-labeled `[PLACEHOLDER: …]`.
- **All ₹/AED/AUD pricing is a placeholder/anchor** for Sunil to calibrate (India
  mid-market / regulated-enterprise / PE buyers; US fractional-CAIO band $5K–$30K+/mo is a
  ceiling reference, not the India number). Flag pricing for review before publishing; mark
  it in an HTML comment near the figures.
- CTAs: cohort = **APPLY**; consulting = **Book a discovery call / Request a scope call**.
  Never "Buy now."
- Keep regulated-industry depth prominent on consulting pages (DPDP Act, IRDAI, RBI, SEBI,
  NIST AI RMF, ISO 42001, EU AI Act) — it's a core differentiator.
- **No localStorage/sessionStorage — still true, and it survived the console.** The
  admin session is an HttpOnly cookie the page cannot read; the analytics beacon
  writes no client state at all; the Ask widget's history and session id live in a
  closure and die with the tab. Minimal JS on public pages: the forms, the Ask
  widget, [src/components/Track.astro](src/components/Track.astro) (the only way the console
  can see anything), and Google Tag Manager
  ([src/components/GoogleTagManager.astro](src/components/GoogleTagManager.astro) +
  [src/components/GoogleTagManagerNoscript.astro](src/components/GoogleTagManagerNoscript.astro),
  container id in [src/data/site.ts](src/data/site.ts)) — loaded on the five public layouts
  only, never on `/craft/admin` or `/craft` (both are gated, `noindex`, and deliberately carry
  no third-party analytics). Track captures most events by delegation, so adding a section
  or a link does not mean remembering to instrument it.
  - **One exception, decided 2026-09-17: the Rule Placement Audit autosaves to
    `localStorage`** ([src/pages/resources/rule-placement-audit.astro](src/pages/resources/rule-placement-audit.astro)).
    It is a worksheet a reader fills in over more than one sitting, and losing the
    list on a closed tab is the failure the brief asked to prevent. The exception is
    bounded: one key, only what the reader typed, every read and write in try/catch,
    and the page works with storage blocked. Nothing else reads that key. A page that
    wants the same thing has to make the same case, not point at this one.
  - **A page that promises "nothing is sent to us" must not load Google Tag Manager.**
    The container loads Microsoft Clarity, which records page text, and a tag added
    later in the GTM console can capture anything. The audit page sits on
    `ResourcesLayout`, which carries no tag manager; do not add one there, and do not
    move the page onto a layout that has one. The first-party beacon stays, because it
    sends a path and a referrer and never content.
- **The no-backend rule has been widened once, deliberately.** It was: `/api/*`
  routes for the Q&A agent and the facts endpoint, no database. It is now those
  plus **Supabase for the admin console** — because a lead history that outlives an
  inbox and traffic the site can read back are things a static site genuinely
  cannot do. The exception is bounded, and the boundary is the point:
  - Visitor-facing pages read **nothing** from Supabase. Every write is
    fire-and-forget; a failed write loses a row, never a lead.
  - Nothing in Supabase feeds the Q&A agent's grounding. Facts still come only
    from `facts.ts`.
  - Web3Forms is still the delivery path for every lead.
  Don't widen it again without a reason as good.

## Positioning spine (cohort)
"**AI builds, the human judges and directs.**" Differentiation = engineering **judgment**,
not tools. Outcomes = (1) evaluation & reliability, (2) security / red-teaming for agentic
systems. Position *above* the commoditizing "how to use AI tools" market.

## Offer facts (single source of truth)
### Cohort (`/`)
- Live programme for experienced engineers, architects and engineering leaders.
- **30 live hours plus independent work.** The open cohort **targets eight members**;
  this is not a capacity or scarcity claim.
- Admission starts with an application and fit conversation. Applying is not payment or a
  confirmed place.
- **The fee, the start date and the week count are published** (D1, reversed 14 September
  2026), and every one of them comes from `facts.ts` — never typed into a page. The fee is
  per region and appears only where `Region.publicPrice` is on: India today, not Dubai or
  Australia, whose rates are uncalibrated and read "shared on application" instead.
- Payment, refund and access terms are confirmed in the final offer before commitment.
- **No scarcity, ever.** The seat cap is a fact and may be stated. A countdown, a
  "seats remaining" figure, and a claim that a rate will not return are not.

### Consulting (`/caio`, `/assessment`) — pricing all placeholder
- CAIO tiers: Advisory ~2 d/mo · Embedded ~1 d/wk · Transformation 2–3 d/wk. 90-day min.
- Assessment: fixed-fee, fixed-scope, 2–3 weeks, board-ready roadmap.

### Instructor
Publicly state engineering and leadership experience from Google, Amazon, Walmart and
startups, based in Bengaluru. Do not infer or publish user counts, team counts, product-scale
metrics, testimonials or employer endorsement without a dated approval record.

## Design tokens
**The public site uses the Living Craft website design system v1** (Alchemy and Ein,
18 September 2026, a "review edition"). The package itself is kept out of the repository;
its values live in [src/styles/ds/theme.css](src/styles/ds/theme.css) and
[src/styles/ds/contract.css](src/styles/ds/contract.css). Read the header of `theme.css`
before changing a colour.
- **Palette**: forest `#183D32` for actions and the one dark surface per view · ivory
  `#F5F0E6` page ground · paper `#FBF8F2` panels · ink `#172E26` · muted `#526259` ·
  line `#CBD1C8` · control line `#758279` · deep gold `#765523` as accent TEXT · gold
  `#B58A46` for rules and fills ONLY · dark forest `#102A22` footer.
- **Gold is never small text.** It is 2.76:1 on ivory and 3.82:1 on forest. On the dark
  hero the eyebrow is on-dark-muted `#C6D4C8` (7.79:1); gold appears there only in the
  h1, which is large text.
- **Type**: Source Serif 4 at weight 400 for h1, h2 and the pull quote · Figtree for
  everything else, including h3, h4 and labels · eyebrows are Figtree bold, 12px,
  **uppercase**, +0.12em. JetBrains Mono is gone from the public pages; digits stay
  fixed-width through `font-feature-settings`. Body 16px / 1.6.
- **Shape**: 6px radius on anything you press or type into, 12px on a panel. Panels are
  set off by a 1px line, **not a shadow**. The line is drawn by `--shadow-raise` as a 1px
  box-shadow ring (`--shadow-lift` is the darker hover ring), so the 102 rules that already
  said `box-shadow: var(--shadow-raise)` all became the package's line at once. Never add
  a border to something that uses those tokens: that draws the line twice. Only a layer
  floating over the page (`--shadow-overlay`) keeps a real shadow.
- **Spacing**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Max width 1160px.
- **The junction motif** ([src/components/site/Junction.astro](src/components/site/Junction.astro))
  sits beside "the living craft" wordmark. It is the package's supporting motif, **not the
  logo**, which is still to be commissioned. It is drawn still: the package's one-time
  animation relies on `sessionStorage`, which this site does not use. The consulting
  wordmark ("Sunil Mathew") keeps its plain dot.
- **One token set for the whole site.** The public pages, `/craft`, `/craft/admin` and
  `/book/[id]` all read `theme.css`. A `theme-course.css` override kept the old system on
  the gated areas for part of 18 September and was removed the same day at Sunil's
  request. Do not reintroduce a second token set.
- **Forum voices are a colour language** (`--agent-*` in `theme.css`, mapping and ratios
  in its comment). Learner: neutral ink on paper. Instructor: forest, soft-green badge.
  System (machine): deep gold on warm cream. Uncertain: blue. Refused: error red. No two
  share a hue.
- **Voice**: respected practitioner. Restrained, senior-technical, high whitespace.
  This is the *register*. The *sentences* follow **Communication style** at the top of
  this file — plain words, one idea each. Restrained and plain are the same goal.
  Consulting register a notch more executive (board-facing). Not SaaS-templated, not
  bootcamp-hype.
