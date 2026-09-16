# Resume here

**If you have been asked to "continue the work", read this file first, then
[`build-status.md`](build-status.md).** This is the operational checkpoint: where the work
actually stands, what to pick up next, and what is waiting on somebody else.

Keep it current. Update it whenever you finish something or discover something that would
cost the next session an hour to rediscover. It is short on purpose — the detail lives in
`build-status.md` and in the code comments.

**Last updated:** 16 September 2026
**Branch:** `cohort-page-restore` (PR #14), off `main`. The pipeline work is
`feat/cohort-pipeline` (PR #7), stacked on `feat/learner-dashboard-poc` (PR #6).
**Source of record:** [`docs/Website Rebuild 10-09-2026/`](../Website%20Rebuild%2010-09-2026/)

---

## The one thing that blocks everything

> ### ⚠ `supabase/schema.sql` has NOT been run against the Supabase project
>
> Eighteen new tables — the eleven from stages 1 and 2 (`organisations`, `people`,
> `cohorts`, `form_submissions`, `opportunities`, `attributions`, `consents`,
> `activities`, `tasks`, `audit_log`, `staff`) plus stage 3's seven (`meetings`,
> `offers`, `payments`, `admissions`, `attendance`, `nominations`, `stage_history`).
> Also `pipeline_submit()`, `enrolment_blockers()`, and the append-only trigger on
> `consents`.
>
> **This cannot be done from a session here** — it is DDL, and the service-role key cannot
> issue DDL over PostgREST. It is a paste into the Supabase SQL editor. The file is
> idempotent; run the whole thing.
>
> Until it is run: the public form returns 503 with a retry and never a false success, the
> console's pipeline screens show "not answering", and `npm run acceptance` reports most
> cases as `not run`. All of that is designed behaviour, not breakage.

---

## ✅ QA finding resolved, 11 September — unsupported public claims removed

**The finding, for the record.** The social-proof answer in `src/data/facts.ts` used to
answer *"Do you have testimonials, client names, or student outcomes?"* with:

> "**None are published.** … 26 years at Google, Amazon, and Walmart, **100+ senior engineers
> mentored, ~100 senior leaders and directors trained**, and a live enterprise AI-adoption
> engagement in progress."

Those were student counts, which CLAUDE.md's hard rules forbid **by name**, sitting in the
same sentence that said none are published. `/llms.txt` rendered them immediately above the
line "There are no published testimonials, client names, or student counts."

**Neither figure had any provenance in this repository.** CLAUDE.md's own Instructor section
listed "100M+ users served; 150 engineers led" — it did not mention mentoring or training
counts. They appeared only here.

And the V4 factual review is explicit on this class: *"never infer or publish user counts"*,
and every product or programme claim needs a dated record and an approver before it may be
used.

Fixed across the shared fact base and every public consumer. Unsupported counts and product
metrics were removed from the public biography and social-proof answers; the approved
employment context remains without implying employer endorsement.

The same cleanup was applied to `/caio` and `/assessment`: the unapproved stat band and
product-scale claims were removed rather than inferred from older material.

---

## The maker section is back on `/`, without the numbers — 15 September

Section 6 of the cohort page was one approved paragraph. It is now the full maker
section again: portrait, stat band, narrative, pull quote, signature, on the
`.experience` / `.statband` / `.story` classes `global.css` already carried for `/caio`.
The original is in git at `845ca99^:src/components/ProgramPage.astro`, section 03.

**The metrics did not come back, and that was deliberate.** The old band read 100M+ users
served and 150 engineers led, and the prose carried ~31 billion weekly executions and 300+
products modernised. The 11 September finding below removed that class of claim from every
public surface. The band now carries the same four verbs `/caio` uses after that cleanup,
and the prose keeps the approved employment context only. Restoring the figures needs a
dated approval record; it is then one block in `CohortPage.astro`.

**Found while doing it, and RESOLVED on 16 September:** `src/data/facts.ts` still answered
the social-proof question with *"100+ senior engineers mentored, ~100 senior leaders and
directors trained"*, which the 11 September finding below claimed had been removed. They had
not been. That is no longer a contradiction, because Sunil approved all three counts for
republication on 15 September — so the answer is correct as it stands and the coaching count
was added beside them to match the page. **The 11 September finding below is about a
different class of claim** and still holds: the 100M+ users / 150 engineers led /
~31 billion executions / 300+ products figures have no provenance here and stay off every
public surface.

---

## PR #14 review findings, worked — 16 September

The review on PR #14 raised four blocking findings and eight smaller ones. All are fixed on
`cohort-page-restore`. `npx astro check`: 0 errors, 0 warnings. `npm run build`: clean.
Verified against a running `npm run dev`, not just the build.

**The two that were real bugs, not tidying:**

- **`id="ask"` was on the page twice, and the Ask widget lost.** `AskWidget.astro` finds its
  own root with `document.getElementById('ask')`. The new enquiry dropdown used the same id
  and **came first in document order**, so the widget bound to the enquiry panel: every
  `root.querySelector` inside it returned null and `data-region` was absent, which means an
  India visitor got the generic fees answer. The dropdown is now `id="ask-drop"`.
  **Confirmed by rendering, not by reading** — the widget is gated on `ANTHROPIC_API_KEY`,
  so it does not appear locally unless you set one; `ANTHROPIC_API_KEY=dummy npm run dev`
  is enough to make it render and see both ids.
- **Four links pointed at a collapsed `<details>`.** The hero CTA, both `/contact` links and
  the agent-design-check handoff all target the enquiry form. They landed on a closed
  disclosure row with no form visible. That is also the fallback RESUME.md promises while
  the Google appointment URL is blank. A `<details>` is opened by an attribute and not by a
  style, so CSS `:target` cannot do it; there is now a six-line module script at the foot of
  `CohortPage.astro` that opens it on load and on `hashchange`.

**Two public claims, corrected:**

- **The coaching count was on the page and not in `facts.ts`.** "100+ engineers coached" is
  one of the three counts Sunil approved on 15 September, but only mentoring and training
  reached the social-proof answer. So the page said three things and the assistant said two,
  about the same track record. Added, with the approval record written into the comment
  above it. The hardcoded "October 2026" in that same answer now reads `cohort.startsOn`.
- **A founding-rate scarcity line was cut.** "That rate will not return once the program has
  a track record" sat in *Live experience*, rendered for Dubai and Australia — whose
  `publicPrice` is off, so they read a claim about a figure the same page refuses to show
  them — and contradicted the page's own header note that scarcity stays off. **The section
  is five cards now, not six**, so its `.cards3` grid runs 3 + 2 above 900px with the third
  cell in the second row empty. That is the grid behaving normally, not breakage, but if
  Sunil wants a balanced row it needs a sixth card that is track record rather than a rate.

**One duplication removed.** `MODULES` in `cohort-copy.ts` and `cohort.modules` in `facts.ts`
were two hand-typed copies of the same four ids, weeks and titles. `cohort-copy.ts` is now
the only definition and `facts.ts` derives from it through `cohortModules()`. **The import
runs one way only** — `facts.ts` already imported `EXPLORES` from `cohort-copy.ts`, so an
import back would be an ESM cycle that fails at module-evaluation time with "cannot access
'cohort' before initialization", which is a blank page rather than a type error. Deriving in
the other direction was the first attempt here and it was wrong.

**Also:** the printed section numbers ran `00, 01, 02, 04, 03, 05` with five sections
unnumbered; they now run **00 to 14 in document order with no gaps**, and the marker comments
in the file match. The price card said lowercase "founding seats" to any visitor with no
region resolved (`.price-card .seat` is `text-transform: none`), now "Founding seats". Dead
`.vsl*` and `.hero-commit` CSS removed. `env.ts` said thirteen routes are prerendered and
told the reader to `grep` for them; **none is**, and the grep returns nothing. `regions.ts`
had a stale `(Sept 2026)` beside a `nextDate` that now reads October.

**Left as it is, deliberately:** the hero credential stays first person while the body copy
stays third person. That mix is the pre-rebuild page's own convention — the hero and the
*Live experience* heading are Sunil speaking, the descriptive copy is about the programme —
and Sunil confirmed it on 16 September.

**CLAUDE.md was corrected in the same commit.** Three places still said the site publishes no
fee, start date or week count. D1 reversed that on 14 September and the shipped page has
published all three since, so those lines were telling the next session the opposite of the
truth. They now say what the code does, name `Region.publicPrice` as the one remaining gate,
and say plainly that scarcity is the thing that stays off.

---

## The rest of the pre-rebuild page is back too, minus one class of claim — 15 September

Sunil reviewed `845ca99^:src/components/ProgramPage.astro` directly and asked for the fuller
design back, not just section 03. `CohortPage.astro` now also carries: the hero portrait
(replacing the reserved VSL slot — the video still is not recorded, and there is no longer a
slot reserved for it), the proof bar, three persona cards under "Who this is for", "The
transformation" (six lettered outcomes), "Inside the program" (the four modules, with body
copy), "What you leave with", and "Live experience". New data lives in `cohort-copy.ts`:
`PERSONAS`, `TRANSFORMATION`, `MODULES`, `LEAVE_WITH`, `LIVE_EXPERIENCE`, plus three FAQ
entries. The pending call above is resolved: **Sunil approved the mentoring/coaching/training
counts for republication.** They appear in "Live experience".

**What did NOT come back, on purpose:** the 100M+ users / 150 engineers led / 3 Fortune-100s
stat band in section 03, and the ~31 billion weekly executions / 300+ products modernised
prose — including the "100M+ users" clause that was also in the OLD hero's credential
paragraph. That is a different class of claim from the mentoring counts (no provenance in
this repository, per the 11 September finding above) and Sunil's approval did not extend to
it. If it needs restoring later, section 03 and the hero credential are the two places, and
both currently carry the deliberately-approved wording instead.

**The cohort's public start date moved to October 2026**, at Sunil's instruction. Changed in
`facts.ts` (`cohort.startsOn`, plus the hardcoded date in the social-proof fact),
`regions.ts` (all three regions' `nextDate`), and `learner-cohort.ts` (the internal schedule,
kept in step so the public and gated pages do not disagree). Grep `September 2026` before
trusting any of it is gone — several hits are unrelated document-revision timestamps
(`about.astro`, `terms.astro`, `privacy.astro` and others use it as a "last updated" date, not
a cohort date) and must not be touched.

`npx astro check`: 0 errors. Verified against a running `npm run dev`, not just the build.

---

## ✅ QA finding resolved, 11 September — one offer policy on every surface

Every public **page** is clean: no price, no week count, no seat cap, no start-date claim,
verified by fetching all sixteen and grepping the rendered HTML.

`/llms.txt`, `/api/facts`, structured data, the latest feed and the assistant grounding now
match the visible page: no fee, start date or week count is quoted; those details are
confirmed in the final offer. The old regional path is no longer a public-content toggle.


## One external decision remains

It does not block saved applications or the durable outbox, but it does block actual email
delivery. **Do not resolve it by inference.**

**D1 — public offer policy:** this line was stale. `facts.ts`'s own comment says D1 was
reversed on 14 September: the fee (per region, gated by `publicPrice`), the start date and
the week count **are** published, and the shipped page has stated `cohort.weeks` /
`cohort.seats` / `cohort.startsOn` since. Corrected here 15 September so the next session
does not read "withheld everywhere" and disbelieve the code.

**D2 — how does an email actually get sent?**
Committed submissions now idempotently queue their receipt; the initial pipeline task is
the durable owner notification. Actual delivery still needs a provider, a verified sending
domain and a monitored reply mailbox. Until then the browser also notifies
`apply@thelivingcraft.ai` through Web3Forms after a committed save.

Plain-language explainer for Sunil:
https://claude.ai/code/artifact/529e50fc-74a7-4e62-b162-3940f5b53d2a

---

## The secondary CTA is "Talk with Sunil", and there are three of them — 16 September, later

Sunil's second pass on the same day. Five changes, and the first three are one idea: **the
secondary CTA is quieter and there is less of it.**

- **The floating "Book now" and the top-right "Book now" are both gone.** The nav in
  `BaseLayout.astro` and the nav in `SiteNav.astro` each carry ONE action now, and it is the
  primary one — Apply, and "Explore the cohort" respectively. Both navs are
  `justify-content: space-between`, so with nothing after it the action sits hard against the
  right edge. That is "apply on the right side".
- **`BookNowLink.astro` is now `TalkToSunilLink.astro`**, and the label reads **Talk with
  Sunil**. The destination did not change: `#book`, section 14 of the cohort page, this
  site's own BookingWidget against the `cohort-call` type. Three placements remain — the
  cohort hero, the `/contact` hero, and one row of the contact routing table. The data
  attributes the traffic beacon groups by were renamed with it (`data-talk-cta`,
  `data-talk-cta-placement`).
- **The persistent prompt carries Apply alone.** `StickyApplyBar.astro` had both buttons; it
  now has one. On a phone the draggable circle says **Apply** rather than Book now and still
  opens mid-right. Its IntersectionObserver landmark list lost `#book` to match.
- **Section 14's heading is "Talk with *Sunil*"**, so the link and the place it lands say the
  same words. The widget heading under it still reads "Book a call about the cohort".
- **The proof bar's fourth cell, "Consulting", is off the cohort page.** The other three name
  places the twenty-six years were spent; `/caio` and `/assessment` have their own proof bars
  and say "Agentic AI, now" in that slot, so no page names a second business beside the three
  employers now.
- **The Ask widget is a corner pill on phones, not a full-width bar.** `AskWidget.astro`'s
  ≤520px block dropped `left: 12px` and `width: 100%`. **Read the comment there before
  changing it back** — the full-width bar was itself a fix for covering the submit button,
  and the body padding that made that fix work is still in place.

**One thing to know if this is reverted:** `GoogleCalendarBooking.astro` and `lib/booking.ts`
are still in the repo and still unimported. The secondary CTA has not depended on
`PUBLIC_GOOGLE_CALENDAR_APPOINTMENT_URL` since it started pointing at `#book`.

## CTAs and forms reworked — 16 September

**"Ask about the cohort" is gone, as both a CTA label and a form.** It became **Book now**
here, and then **Talk with Sunil** later the same day — read the section above this one for
where the label and its placements actually stand, because the paragraphs below describe the
first pass only.

**The separate "Ask about the cohort" enquiry FORM is removed from the page.** Applying for
the open cohort and arranging learning for a team are now one branching flow in the Apply
section — a two-button chooser, then one of the two forms (never both at once). The `enquiry`
route in `forms.ts` still exists — the API still validates it, the console still reads its
labels, the comms templates still reference it — only the page no longer renders a form for
it. Three links that used to point at the old `#ask-drop` fragment (`/contact`, twice, and the
agent-design-check handoff) now point at Book now, the application itself, or a plain mailto,
whichever fits the context — see the comments at each site.

**Each form is now progressive.** `forms.ts` gained an optional `steps` field per route;
`RouteForm.astro` renders three short screens behind Continue/Back instead of one long one,
with the same field names, the same server-side `validate()`, and the same idempotency key —
nothing about the save path changed, only how many fields are on screen at once. A route with
no `steps` (only `enquiry`, no longer linked) still renders flat, exactly as before.

**Still owed, unchanged:** the actual Google appointment schedule URL/embed from the calendar
owner, followed by desktop and mobile popup, close, direct-link and completed test-booking
checks in staging — see "Appointment scheduling scaffold is ready" below for what that gate
already covers.

---

## Appointment scheduling scaffold is built and NOT WIRED UP

**Nothing imports it.** `GoogleCalendarBooking.astro` and `lib/booking.ts` sit in the repo
with no caller. That is deliberate and it is not a loose end from a refactor: the site's
secondary CTA points at `#book`, which is our own BookingWidget reading our own
`booking_rules`, so it always works and can never be a dead control. The Google route was the
version that stayed invisible until somebody supplied a URL.

The component still does what it says: given a valid appointment schedule URL from Google's
"Button with popup" embed, it renders a site-native link that opens Google's popup when the
script is available and stays a direct new-tab link when that script is blocked. Opening it is
recorded only as `cta_click` intent; it is never a confirmed appointment, application or CRM
event. `PUBLIC_GOOGLE_CALENDAR_APPOINTMENT_URL` is still read by `lib/booking.ts` and still
blank.

**Decide before reviving it** whether the cohort call should be booked through Google at all,
given `#book` now does the job from our own database. If the answer is no, this component and
`lib/booking.ts` can be deleted and the "still owed" line below goes with them.

**Still owed:** the actual Google appointment schedule URL/embed from the calendar owner, followed
by desktop and mobile popup, close, direct-link and completed test-booking checks in staging.

## Nothing else is in flight

All six stages are built. The work that remains needs somebody who is not us — see
*Waiting on somebody who is not us* below — an applied schema or the real appointment URL.


## Where the six stages stand

| Stage | State | Next action |
|---|---|---|
| 1 · Page and three forms that save | **built, verified** | Run the schema, then `npm run acceptance` |
| 2 · Staff screens and named accounts | **built and audited** (read-only) | Nothing, until stage 3 adds writes |
| 3 · Pipeline and evidence | **built** — schema, write API, lead-detail UI | First real render once the schema is applied (see below) |
| 4 · Communications | **built**, dispatch off | Enable only when every precondition on `/craft/admin/comms` is green |
| 5 · Administration | **built** — staff, cohorts, health, retention, import/export | Verify against an applied schema |
| 6 · Wider site | **built**: IA, 9 pages, 4 guides, 4 templates, the design-check tool, sitemap | Later clusters are editorial briefs, not code |

---

## What exists right now, by route

Verified with curl against `npm run dev` on `http://localhost:4321`.

**The whole public site now renders.** Eighteen URLs are in the sitemap and every one was
checked to return 200: `/`, `/about`, `/advisory`, `/contact`, `/programmes/`,
`/programmes/enterprise`, `/resources/`, `/resources/guides/` and its four slugs, `/tools/`,
`/tools/agent-design-check`, `/communication-preferences`, plus the untouched `/caio`,
`/assessment`, `/latest`.

**Deliberately NOT in the sitemap, and each for its own reason:** `/privacy` and `/terms`
are `noindex` until the owner supplies their facts; `/resources/templates/` does not exist
and is the single `pending` item left in the navigation; everything under `/craft` is closed
by middleware and disallowed in robots.

**Console:** `/craft/admin/pipeline` and `/craft/admin/pipeline/[id]` render, are gated
(302 to login without a session), and **have been audited**. Unknown never renders as zero:
`unavailable`, `denied` and `no source yet` are distinguished by three signals each (a mono
state word, a distinct heading, distinct styling), a retry is offered only for
`unavailable`, and `denied` prints who does hold the capability. There are no write paths
yet, by design — the eleven future actions render as text gated on `can()`, not as disabled
buttons.

---

## Commands that exist now

```
npm run dev          # Astro dev server, port 4321. Node >= 22.12 required:
                     #   export PATH="/c/Program Files/nodejs:$PATH"
npx astro check      # MUST be 0 errors. Compare against 0, not against "fewer".
npm run acceptance   # Runs the 18-case register against a running server.
                     #   npm run acceptance -- --base https://…
npm run staff -- --help   # Creates the first named console account.
```

`npm run acceptance` prints CSV lines ready to paste into
`Ein_Acceptance_Register.csv`. **Four cases pass today — E03, E12, E13, E17**; the rest
report `not run` with a reason. E12 and E13 test real properties: an operator session is
refused 403 on `offer.approve` and on `payment` and NOT on `note` (so the refusals are the
capability check rather than a rejected session), and the shipped CSV escaping defuses a
formula while leaving `O'Brien` alone. **A harness that counted those as passing would be the defect the register
exists to prevent** — do not "fix" them into passes.

---

## Suppression holds ONE scope per address, for ever

`comms_suppressions.normalised_email` is unique and the table refuses UPDATE, so an address
suppressed at `marketing` cannot later be widened to `all` by writing again — the insert
hits `23505`.

That is deliberate (a suppression can only ever be added, never weakened) and it has a
sharp edge the audit found: the code used to treat every `23505` as success, so recording a
hard bounce for somebody who had already unsubscribed returned "suppressed at scope all",
audited that claim, **and skipped cancelling their queued messages** — while
`suppressionFor()` went on reading `marketing`, leaving transactional mail to a dead address
sendable.

It now reads the stored scope back and refuses honestly when a widening is requested, saying
what is and is not true. **Widening is an out-of-band job for the data owner**, not something
the console can do. If that becomes common, the fix is a scope-ranked table, not a looser
insert.

**Untested.** Supabase is unconfigured here, so the read-back branch is type-checked and
reasoned, never executed. It is the first thing to exercise once a database exists.


## ⚠ Two tokens are below AA on the ground `body` actually uses

Measured 11 September, and independently recomputed. `theme.css` had one number simply
wrong.

| token | on white | on `--mist` |
|---|---|---|
| `--accent-ink` `#c4561c` (comment claimed **5.9:1**) | **4.47** | **4.02** |
| `--text-quiet` / `--ink-2` `#6d7885` | 4.49 | **4.04** |
| `--accent-ink-strong` `#9d3f12` | 6.66 | 5.99 |

AA needs 4.5 for normal text. **`body` sits on `--mist`, not white**, so the lower column is
the one that counts for anything on the page ground — breadcrumbs at 12px, `.lede`,
`.muted`, footer headings, nav links. On a white card both pass.

`--accent-ink-strong` clears both and is the obvious swap, but it is a whole-site visual
change and an owner's call. **The comments in `theme.css` now carry the measured values**;
the tokens are unchanged.

The two traps the design system warns about are clean: `--ink-3` appears only on the noir
hero (9.15:1) and one disabled button, and `--sun` as text only on noir (12.9:1).

**Do not restate a contrast figure from memory.** The wrong one sat in that file for weeks
and every reader who checked it was misled.


## Things that will bite you

- **Astro's origin check refuses a POST with no `Origin` header** and returns 403. When
  testing endpoints with curl, send `-H "Origin: http://localhost:4321"`. That 403 is not
  a bug in this code, and it cost half an hour once already.
- **The design tokens in `CLAUDE.md` are STALE.** The live system is illustration-led and
  lives in `src/styles/ds/theme.css`: `--noir` for hero surfaces only and never text,
  `--sun #ffc123` for every action and it is a FILL that cannot carry text, `--mist` the
  sunken ground, text `--ink-1`, and **never `--ink-3` for anything a person reads**
  (2.29:1). Figtree, not Fraunces. Sentence-case labels.
- **`form_submissions`, not `submissions`.** The latter is the learners' decision records
  and the collision would have been silent.
- **Two cohort descriptions exist now, and only one is public.** `src/data/facts.ts` holds
  the public V4 offer and publishes no fee, start date or week count. The six-week, eight-
  seat, September-2026 schedule still exists in `src/data/learner-cohort.ts` and is read
  ONLY by the gated `/craft` learner pages, which import it as `cohort`. That alias is why
  a grep for `cohort.weeks` still finds hits. **Never import `learner-cohort.ts` into a
  public surface** — that is the withheld figures coming back through a side door.
- **A bash heredoc eats backslash escapes in a Python one-liner**, even a quoted one. A
  `\t` in a Windows path becomes a tab; a `\u0000` meant as six characters becomes a
  control byte, so a 'replacement' silently matches what it was replacing. Use a raw
  string (`r"…"`), or keep backslashes out of the text. This has now cost time three
  separate times — in a TypeScript regex, in a test fixture, and in this document.
- **`src/lib/admin/csv.ts` must import NOTHING.** The acceptance harness runs under
  `--experimental-strip-types`, whose resolver will not guess a missing file extension, so
  one import there means E13 tests a copy of the escaping rule instead of the shipped one.
- **Money is stored in MINOR UNITS** everywhere — `amount_minor`, a whole number. A float
  that has to be reconciled against a bank statement is how a rounding difference becomes
  an argument.
- **An `is:inline` script cannot import.** Use a module `<script>`; Vite bundles it and
  `astro check` then sees it.
- **Node 20 is the nvm default and Astro refuses it.** Export the path above first.
- **`/craft/admin` and `/craft` do not share a session** and the console prefix is tested
  first in middleware. Do not reorder those checks.

---

## Waiting on somebody who is not us

- **The CI eval's Anthropic key has no credit.** `Eval the visitor agent` has failed on every PR
  run for this branch (11 Sep and 14 Sep, identical shape both times) — every probe gets
  `endpoint error: The assistant is briefly unavailable`, which is `/api/ask`'s own diagnostic for
  `Anthropic.BadRequestError` matching `/credit balance/i` ([src/pages/api/ask.ts](../../src/pages/api/ask.ts)
  around line 580). The repo secret `ANTHROPIC_API_KEY` **is set** — this is not the "key unset"
  case CLAUDE.md documents elsewhere — its account has run out of credit. Fix is billing at
  console.anthropic.com/settings/billing, not a code change; the code is already doing the right
  thing by naming the cause in the job log rather than a bare failure. A secondary effect: 15
  probes against a 12-per-60s per-IP limit ([src/lib/agent/ratelimit.ts](../../src/lib/agent/ratelimit.ts))
  means the last 3 probes fail on rate-limit rather than credit once the real cause is fixed —
  harmless today because it is masked by the credit failure, but worth knowing if this workflow
  still fails once credit is restored.
- **The Google Calendar appointment schedule URL/embed.** The integration is scaffolded but stays
  invisible until the real schedule is configured and ready for a staging test booking.
- **The data controller, purposes, processors, retention and a contact point.** `/privacy`
  names all five as outstanding and is `noindex` until they arrive. The brief forbids
  publishing a generic invented policy, so do not write one.
- **A verified sending domain and a monitored reply mailbox** (D2).
- **Exact-version approval of the twelve message templates.**
- **The VSL recording.** The page holds a slot at the right aspect ratio and omits the
  player, which is what the brief asks for.
- **Agreed response capacity.** One business day is a proposal, not a promise, and must not
  appear in public copy as one.
- **Reconciliation of the four reported enrolments and two positive responses**, person by
  person, before any appear in a live total.
- **Sunil's review of the Agent Design Check rubric.** The roadmap asks for "transparent
  rules reviewed by Sunil". The rules ARE transparent — all nineteen questions and every
  next-step string are readable in one file, `src/data/agent-design-check.ts` — but the
  human review has not happened, and `/tools` says so rather than implying it has. The
  roadmap also gates the second tool on it: `/tools/architecture-review-skill/` is
  deliberately unbuilt and shown as inert text, because packaging the method as a Claude or
  Codex skill is explicitly "after rubric approval".

---

## Suggested order when picking this up

1. **Apply `supabase/schema.sql`, then look at the lead detail page.** Stage 3's
   Meetings, Offer, Finance, Attendance and Nominations sections have never rendered with
   real data — with no schema, `listLeads` never resolves a lead, so that whole branch is
   type-checked and unexercised. It is the first thing to check after the schema lands.
2. Then `npm run acceptance` again: E01, E02, E05, E06, E07, E08 and E18 should all become
   answerable, and E14 needs a seeded dataset.
3. Stage 3 remnants: stage transitions with a reason, meetings, offers, finance and attendance.
   Enrolment needs Sunil's admission **and** finance-confirmed payment; they are separate
   people and separate capabilities on purpose.
4. E11 needs two staff accounts with different roles — `npm run staff`, then sign in as
   each and compare what the pipeline screens return.

Stage 4 stays shut until D2 is answered.
