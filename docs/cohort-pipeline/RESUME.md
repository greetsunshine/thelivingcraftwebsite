# Resume here

**If you have been asked to "continue the work", read this file first, then
[`build-status.md`](build-status.md).** This is the operational checkpoint: where the work
actually stands, what to pick up next, and what is waiting on somebody else.

Keep it current. Update it whenever you finish something or discover something that would
cost the next session an hour to rediscover. It is short on purpose — the detail lives in
`build-status.md` and in the code comments.

**Last updated:** 19 September 2026
**Branch:** `feat/landing-refinement`, off `cta-book-now-rework` (PR #18). PR #14 is merged.
PR #27 (the thread brain) is superseded by this work. The pipeline work is
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

## Every download is gated, and the requests are one table — 19 September

Sunil's instruction: every download option on every tool asks for a name and an email
address, the pair is kept in one table the marketing team can read, and the mechanism is
one standard. CLAUDE.md now has a section, *The download gate*, that is the standard;
this is the checkpoint on it.

- **What changed on the public pages.** Fourteen pages. The four scored-PDF tools swapped
  their own dialogs for `<ResourceGate>`; the memory kit's ZIP, PDF and JSON, the run-cost
  workbook, the three worksheet CSVs, the toolkit's CSV buttons, the four templates'
  Markdown files, the rule audit's CSV, the design check's text file, and every print
  button now go through it. Copy that promised "nothing asks for an email address" was
  rewritten on each page and in the register. `/api/pipeline/resource-pdf` is gone;
  `/api/pipeline/download` replaced it.
- **The files moved out of `public/`.** `downloads/` at the repo root is private and is
  bundled into the function by `includeFiles` (a list read from the folder at config
  time, because the option takes paths, not globs). Vite's dev server would still serve
  the folder by URL, so `vite.server.fs.deny` closes it in dev too. The build was checked:
  the gated files are in `_render.func/downloads/` and not in `static/`.
- **Two tools post nothing the reader typed.** The Agent Design Check and the Rule
  Placement Audit both carried a promise that their answers never reach a server. The
  gate keeps it: their route entries are `local()`, the request records the name and the
  address only, and the page builds the file from its own state. Verified in the browser
  by reading the request body.
- **The cost-ceiling workbook has never existed.** `/downloads/cost-ceiling-workbook.xlsx`
  was a 404 behind the page's primary button since it shipped. The page now checks the
  file at render time and prints a pending line instead of a button; the route refuses
  the kind before the save while the file is absent. Producing the workbook is somebody's
  job and is not done here.
- **Schema.** `resource_requests.kind` (additive), `resource_request_submit(..., p_kind)`,
  and the view `resource_requests_marketing` (people ⋈ resource_requests, test rows out,
  `consented` read from the latest consent row). **Not applied on production**, like the
  rest of the file; until it is, every request saves nothing, the file is still handed
  over, and the dialog says so. The view is in the health probe list.
- **Marketing's two screens.** `/craft/admin/requests` (tally by resource and kind, latest
  200) and the *Resource requests* record set on `/craft/admin/records`. Both read the
  view. Nine held delivery wordings were added for the newly gated resources, unapproved
  like the six before them.
- **What this does not do, and why.** No consent checkbox. The addendum still says "never
  infer marketing permission from downloading", no wording has been approved, and a
  permission recorded against words nobody signed off is a liability. `consented` is on
  the marketing screens precisely so the absence is visible. Adding the box is one
  approved wording in `CONSENT_HISTORY` away.
- **Verified**: 27 route cases (14 kinds handed over, 13 refusals incl. honeypot, bad
  email, missing key, wrong kind, unknown template, absent static file); headless Chrome
  on eight pages (18 checks: gate opens, bad email refused, each file downloads, print
  opens after the gate, the two local tools post no answers, the toolkit button names its
  own resource, the workbook page shows the pending line); `astro check` 0 errors;
  `npm run build` passes.

---

## The Model Selection Tool is in the POC tool's shape — 19 September

`/resources/model-selection-tool` replaces `/resources/model-selection-checklist` (a page
to tick and print, itself the replacement for the Contract Agent Test Kit). Both old
addresses redirect to it directly from `astro.config.mjs`. It was rebuilt against
`/resources/poc-screen` as the reference, on top of PRs #29 and #30. Where the two
differed, the POC tool won. What to know before touching it:

- **Six steps, one shell.** Start, A *The step*, B *Deployment gates*, C *Behaviour under
  test*, D *Disqualifiers*, Result. Back and Next above and below each step, pips that
  jump, every step visible without JavaScript and in print, auto-advance 350ms after a
  first answer. The tabbed *Reference example* is gone: the two reference candidates load
  from two buttons on the Start step, and the result card says which one is loaded and
  what it teaches (`exampleFor()`), the way the run-cost tool labels its example.
- **The score is Sunil's call, and it sits inside two hard gates.** The checklist's module
  said nothing was summed or ranked. `src/data/model-selection-tool.ts` now scores: A sets
  the weight on each C row, each C row is 0/1/2 against a written threshold, and the
  percentage is weighted score over weighted maximum. Any fail in B or any hit in D ends
  the candidate whatever the percentage. The bands are 80%+ *Fit for this step*, 60–79%
  *Fit with covers*, under 60% *Not for this step*, two numbers in `CUT_LINES`. Four C
  rows carry no kit weight and start at 2, set by the reader in a select; changing one
  never moves the step.
- **The PDF has three stages and thirteen checks** in `lib/resources/model-selection-pdf.ts`,
  plus the reopen. Each check recomputes its fact from the raw answers with its own
  arithmetic, not through `readAssessment()`. The route's `verify` runs them before the
  save; a failure is a 500 and nothing is written. Branding is the reference's: black cover
  band, wordmark, credit line, mist result panel, berry only on a failed gate or a
  disqualifier that happened, ember *Join the cohort* panel with a clickable apply link.
  One thing found and fixed on the way: the result panel's height was estimated at a
  narrower width than the text is drawn at, so the panel came out taller than its contents
  and *Fix first* landed inside it. The estimate now uses the drawn width.
- **Verified**: every reachable weighted total for all three steps reads by the rubric
  (`3^12` score vectors each), thirteen tampered models each caught by the check named
  for it, the route with four valid and nine malformed payloads plus the honeypot and a
  bad email, headless Chrome at 1280px and 390px (steps, pips, progress, auto-advance,
  sticky header, keyboard, dialog with the check list, no-JS, print), every page of five
  generated PDFs rasterised. `astro check` 0 errors, `npm run build` passes.
- **The same tension as the run-cost tool.** The PDF's cohort panel prints the week count
  and start month from `facts.ts`, because the reference does and its check requires them.
  Sunil's call, on every tool at once.

---

## The POC Selection Tool is stepped, and its PDF is branded and checked — 18 September

Six steps with a progress bar; every step still renders without JavaScript and in print.
The PDF is built in three stages in `lib/resources/poc-screen-pdf.ts`: `buildModel()`,
`checkModel()` (12 named checks, recomputed independently of the model), then drawing.
A failed check is a 500 and nothing is saved, because `verify` runs before the request
handler. The cohort copy on the PDF's *Join the cohort* panel is read from `facts.ts` and
`offer-display.ts`; if D1 changes what is published, that panel changes with it and the
"no unpublished figure" check is where a stray fee would be caught.

Two things to know:
- **Fonts.** The design system names Figtree (standing in for Sofia Pro) and ships no file.
  The PDF uses Helvetica, the fallback the token stack itself names. Adding a licensed
  font file and `@pdf-lib/fontkit` is the change that closes that gap.
- **The other two PDF renderers** (Agent Authority Review, Run-Cost Model) do not yet have
  a `verify` step or a brand band. The `Renderer` interface makes both optional so they
  keep working; giving them the same treatment is the obvious next piece.

---

## The Run-Cost Model Tool is in the POC tool's shape — 18 September

`/resources/run-cost-model` was rebuilt against `/resources/poc-screen` as the reference,
on top of PR #29 (the stepped POC tool). Where the two differed, the POC tool won. What to
know before touching it:

- **The reference example is loaded on arrival.** Eighty-three blank lines is too many to
  face, so the page opens on the ordering agent with every line filled, says so in the bar,
  on the Start step and on the result card, and offers *Start from a blank model*. The
  server renders the example's values and every worked-out line, so the filled model reads
  with no script. `isExample()` compares the state to `EXAMPLE`; the PDF says when it holds
  the example unchanged.
- **A blank is unknown, not zero.** Unchanged from before, and the opposite of the POC
  tool. Do not add a fallback to 0.
- **The PDF has three stages and fourteen checks**, in `lib/resources/run-cost-model-pdf.ts`.
  Each check recomputes its fact from the raw inputs with its own arithmetic
  (`recompute()`), not by calling `readModel()` again. The route's `verify` runs them before
  the save. The `Writer` is a copy of the reference's, with the page decorator; the shared
  `pdf-writer.ts` no longer has a caller among the three tools once #29 lands.
- **The workbook is generated, not hand-edited.** `npm run workbook` rewrites
  `public/downloads/agent-run-cost-model.xlsx` from the data module (TypeScript exports the
  rows and copy as JSON; Python with openpyxl writes the sheet). Change the data module,
  run the script, commit both. Its formulas were evaluated and match the page.
- **One tension, named.** The PDF's *Join the cohort* panel prints the week count and the
  start month, read from `facts.ts` through `offer-display.ts`, because the reference
  prints them and its check requires them. CLAUDE.md's offer policy says not to publish a
  week count or start date. The reference won here; it is Sunil's call whether the panel
  should drop those two figures on every tool.

---

## Three tools now have an email-gated PDF — 17 September

`/resources/poc-screen` and `/resources/agent-authority-review` were both rebuilt on
Sunil's twelve-point list (plain English, a purpose block, a bar that stays on screen, a
result summary, *New assessment*, reference examples, aligned layout). The authority
review went further than a rewrite: it was a table to print and is now a sheet the
visitor types into, with the reading rules as `readRow()` / `readSheet()` in
`src/data/authority-review.ts`. The one piece with a backend on either page is the PDF:
**Get the PDF** opens a name-and-email dialog, posts to `/api/pipeline/resource-pdf`, and
the server builds the copy with `pdf-lib` and returns it in the JSON as base64. Each tool
has its own renderer in that route's map (`lib/resources/poc-screen-pdf.ts`,
`lib/resources/authority-review-pdf.ts`) and its own held delivery wording. Three things
to know before touching it:

- **The page stays open.** Score, copy, print: nothing asks for anything. Only the PDF does.
  That keeps it inside the V4 addendum's "optional email request" and off the "gated
  download" path the addendum forbids.
- **The request is the same request.** `lib/pipeline/resource-request.ts` is the one
  sequence both `/api/pipeline/resource` and `/api/pipeline/resource-pdf` run. Do not add a
  check to one route and not the other; add it to the function.
- **A failed save still hands over the PDF**, with `saved: false` and the reason in the
  response. The schema is not applied on production, so today every PDF request takes that
  path: the visitor gets the file, nothing is recorded, and the dialog says so in one
  sentence. Once the schema is run, the same request records a person, a resource request
  and a queued (held) delivery with the `resource-poc-screen`,
  `resource-agent-authority-review` or `resource-run-cost-model` wording.

The scores, the authority review's steps and the cost model's figures travel to the server
for the file and are not stored anywhere.

**The Run-Cost Model joined them last.** `/resources/run-cost-model` replaces the Excel
download as the resource's address, built in the POC tool's shape with two tabs (*Your
model*, *Reference example*). Three more things to know:

- **`src/data/run-cost-model.ts` is the model.** The formulas are the workbook's, row for
  row, and were checked against the sheet's computed values. If a formula changes there,
  change `public/downloads/agent-run-cost-model.xlsx` in the same commit; the workbook is
  still linked from the foot of the page.
- **A blank is unknown, not zero.** The opposite of the POC tool. A total stays blank until
  every line that feeds it is set, and the outcome reads only at 83/83. Do not add a
  default or a fallback to 0: "this system never retries" is a claim the tool must not make.
- **`lib/resources/pdf-writer.ts` is now the authority review's writer only.** The POC
  tool (#29) and the run-cost tool each carry the reference's `Writer` with the page
  decorator for the cover band. Lifting that decorated writer into the shared file is a
  follow-up, not something to do inside either tool's PR.

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

## Landing page refinement — 19 September, `feat/landing-refinement`

The 19 September package (`docs/2026-09-19_Landing_Page_Refinement-…/`, kept out of the repo
through `.git/info/exclude`) is a restyle of our own `/`. Its source export matches this branch's
rendered HTML class for class. It was ported into the Astro page, not pasted in: its
`styles.css` carries a second token set, drops the linen and loads a 1.8 MB PNG in the header.

Decisions, all Sunil's (19 September, "go with your recommendations"):
1. **The woven brain replaces the thread brain.** It plays once, with Replay and Reduce
   motion buttons. PR #27 is closed.
2. **Sunil's portrait stays near the top on phones:** the intro strip (portrait and proof bar)
   comes straight after the hero buttons, and the brain after it.
3. **Linen stays** on the hero and on the dark price panel.
4. **Phones keep 16px body text and the tighter section spacing.** Desktop takes the package's
   18px and its spacing.
5. **`/` only.** Everything is in `src/styles/landing.css`, imported by `BaseLayout` alone and
   scoped under `body.landing`. `/caio`, `/about` and the rest are unchanged.

Progress, one commit each:
- [x] Assets: `public/brand/woven-brain-{640,1200}.webp` (the package's artwork with its flat
  forest background keyed out, so the linen shows round it), `lc-mark-keyed.webp` and
  `lc-name.webp` (the mark and the "The Living Craft" lettering, cropped from the same
  `logo-reference.png` as `lc-mark.webp`, paper keyed out the way the package's SVG filter does
  it), `public/textures/fabric-crossing.svg` (the chapter divider).
- [x] Tokens and the brain: `--hero-rule`, `--brain-glow` and `--brain-glow-core` in `theme.css`
  (decoration only, never text). `src/components/cohort/WovenBrain.astro` plays the seven lights
  once on first sight, about 3.2 s; Replay, and a Reduce motion button that lasts for the page
  view only. OS reduced motion wins over the button. Nothing is stored.
- [x] Structure, in `CohortPage.astro`: seven `<div class="chapter chapter-â€¦">` wrappers
  (opening, teaching, development, practice, teacher, joining, conversation). The printed
  section numbers are gone. **One section moved:** "What you leave with" (`#takeaways`) now
  closes the development chapter, as in the package. The woven brain takes the portrait's place
  in the hero; the portrait (a new 8 KB `public/sunil-profile-thumb.webp`) and the proof bar sit
  in an intro strip under it. All 16 section ids and every word are unchanged. The module ids
  (M1 to M4) keep their `.num` spans; only the eyebrow numbers went.
- [x] Styles: `src/styles/landing.css`, imported by `BaseLayout` and scoped under
  `body.landing`, ports the package's layout in theme tokens. `CohortPage.astro`'s own `<style>`
  now holds only the page's own pieces (the two-up, the boundary timeline, the commitment grid,
  the route chooser). Cards, lists, modules, the stat band and the FAQ lost their panels; the
  hero is full width on the linen; the price panel is forest on the linen. **Measured at 390:
  17,947 px before, 16,564 px after.** At 1280 the page grew from 12,618 to 13,880 px, which is
  the package's 18px text and 88px sections on a desktop.
- [x] Header and chat: the header shows the LC mark with the "The Living Craft" lettering
  (images of text, so the link's `aria-label` carries the name), and so does the footer, on an
  ivory tile. **Chat opens from the header now**, not from a floating pill: `AskWidget` takes
  `launcher="header"`, renders no pill, and opens from any `[data-ask-open]` button. There is
  one in the header (desktop) and one in the phone menu. The panel drops from under the header;
  closing returns focus to the button used, or to the menu button when the menu has closed.
  `lib/agent/ready.ts` is the one check both read, so neither button exists without the key.
  The sticky Apply bar hides while chat is open (`lc:ask` event). Other pages keep the pill.
- [x] Verified: `astro check` 0 errors, clean build. No horizontal overflow at 320, 390, 768,
  1024, 1280 and 1440. `/` at 390: **17,947 px before, 16,514 px after**; at 1280: 12,618 before,
  13,892 after. `/caio` and `/about` are the same height to the pixel before and after, so the
  change did not leak. At 320 the header needed a smaller lockup and Apply without its arrow to
  keep one row. 21 scripted checks pass: header chat opens, takes focus, closes on Escape and
  returns focus; the phone menu row opens chat and closes the menu; the sticky bar steps aside;
  Replay plays once and stops; Reduce motion disables Replay; phone order is copy, portrait,
  brain; nothing in localStorage. Without `ANTHROPIC_API_KEY` neither chat button renders.

**Still open, and not code:** the six content questions in the package's `HANDOFF.md` (price and
dates reconciliation, "lifetime room" and direct-access promises, the 100+ counts, the "nothing
else" privacy line beside optional emails, repeated outcomes, real-company architecture). No copy
was changed. Real 200% browser zoom and a screen reader pass are still to do on staging.

**Where to look:** draft PR #31, stacked on #18. Staging (follows every push to this branch,
behind Vercel's login): https://thelivingcraft-git-feat-lan-37a779-greetsunshine-1213s-projects.vercel.app

**QA pass, 19 September.** A scripted audit of `/` at 1280 and 390 (every text style, section
padding, contrast of every text node, tap targets, heading order, ids, anchors, overflow) found
and fixed six inconsistencies:
- **Section gaps ran 80 to 112 px** because the package set padding per section. Now one rule:
  88 px at a chapter's ends, 88 px between sections inside a chapter (32 px on a phone).
- **Row titles came in five sizes** (19, 20, 22 px, h3 and h4). Now one: `--landing-title`,
  20 px desktop, 18 px phone.
- **Leads came in three sizes** in the same role. Now two: 22 px under a full-width heading,
  `--landing-lead` 20 px in a column; both 18 px on a phone.
- **Two heading-level skips** (h2 straight to h4 in "What you'll be able to do" and the modules).
  Both are h3 now.
- **The last chapter had three centre lines**: the booking panel, the chooser and the form were
  centred at 640, 940 and 580 px under left-aligned headings. All three share the text's left
  edge at 940 px. The form heading was 26 px at weight 800, the only heavy weight on the page;
  it now matches the booking panel's heading.
- **Radii:** the price panel is 12 px like every other panel; photos are 6 px. The header logo
  link is 44 px tall on a phone.
After: 0 contrast failures, 0 heading skips, 0 overflow, 21 of 21 interaction checks. `/` is
16,317 px at 390 and 13,653 px at 1280. `/caio` and `/about` unchanged to the pixel.

**Visual QA pass, 19 September**, screen by screen at a 1366Ã—768 laptop and a 390Ã—844 phone,
plus the open states (menu, chat, FAQ, team route, form errors, keyboard focus). Six fixes:
- **Chapter dividers** stopped in a hard vertical cut at 1200px; the ends now fade out.
- **Titles** break into even lines (`text-wrap: balance`). "â€¦the irreversible trade-offs" had
  left "offs" alone on a line on both screens; the 30ch cap that caused it is gone.
- **The fifth live-experience item** spanned wider than the four above it, so its rule was a
  third longer. It sits in the left column now.
- **The short paragraph beside a lead** starts level with it (it was bottom-aligned and floated
  60px low on a laptop).
- **The boundary timeline** began 6px above its first knot; it starts at the knot now.
- **On a laptop the split sections keep their heading in view** ("What you'll be able to do",
  "What the work explores"), where the left column was empty for a screen or more.
Heights unchanged: `/` 16,317px at 390. Audit clean, 21/21 interaction checks.

**Full alignment with the 19 September package, 19 September (later).** The brief changed: the
package is now the source of truth, ahead of the earlier QA passes. `landing.css` was rewritten as
a rule-by-rule port of its `styles.css` at its own breakpoints (1450, 1150, 960, 760, 390, 350),
checked with a section-by-section render of the package beside ours. At 1440 every section is
within a few pixels of the package's height except where our content differs (no region price
locally). **This reverses several earlier choices on purpose:**
- **Phones use the package's 18px text and 64px sections.** `/` at 390 is now 20,210px (the
  package is 20,447px; the compact version was 16,317px). Sunil asked for less blank space on
  phones on 16 September; the package supersedes that here, and it is flagged for him.
- **Phone hero order is the package's**: words, brain (up to 490px), then the portrait strip.
- **The menu takes over at 960px**, not 900: `MobileMenu` gained a `breakpoint` prop.
- Reverted to the package: the two-up paragraph aligned to the lead's end, the fifth
  live-experience item spanning, 22px card and module titles, the price panel's 4px radius, no
  sticky headings. Kept: divider ends fade, titles balanced, timeline starts at its first knot.
- Images: the package's `sunil-introduction.webp` (47 KB) and `sunil-teaching.webp` (31 KB)
  replace the 202 KB and 331 KB JPEGs on `/`, with width and height set.
- Forms and booking take the package's presentation: 16px bold labels, 48px fields on
  `--field-bg` (new token), Continue at its natural width on the right, booking inside one panel.
- Focus is 3px with a 4px offset on `/`, ivory on the dark surfaces.

**A real bug, found by this pass, on every page with the booking widget** (`/`, `/caio`,
`/assessment`): the day and time buttons are built by script, and Astro's scoped styles never
reached them, so they rendered as bare browser buttons ("Mon21 Sept"). They are `:global` inside
the widget now. It only shows when real slots exist, which is why nobody had seen it.

Checked: 64 of 66 functional checks pass with the three APIs stubbed at the network layer (the
two "failures" are the browser logging the deliberate 500 from the failure-state stub). No
overflow at 320, 360, 390, 393, 430, 768, 1024, 1280, 1366, 1440, 1920, a 390Ã—600 short phone
and an 844Ã—390 landscape phone. `astro check` 0 errors, 37/37 unit tests, clean build.

## The complete design system, site-wide â€” started 19 September (later)

Sunil asked for the whole 18 September design system across the site, not only `/`. The plan,
one commit per step on this branch: (1) shared components and the shell, (2) page templates per
page group (`tool.html` for the resource tools, `brand.html` for `/about`, `programme.html` for
`/programmes`, `/advisory`, `/contact`, consulting register for `/caio` and `/assessment`), (3) zoom,
screen-reader and Lighthouse checks. `/craft` and the console stay on tokens only, as the package
says to keep branded storytelling out of dense working areas.

- [x] **Step 1a, components.** `src/styles/ds/components.css` (imported by `global.css`) holds the
  package's reusable components as **opt-in `lc-` classes**: fields, helper and error text, check
  rows, tabs, disclosure, resource rows, download list, table, badges, callout, state panel, guided
  tool (workspace, progress, choices, result), toast, plus `.btn-text`, busy and disabled buttons
  and a global `.sr-only`. **Prefixed on purpose**: `.field`, `.tabs`, `.choice`, `.badge`,
  `.callout` and `.table-scroll` are already page-scoped class names on nine resource pages, and a
  global rule under the same name would have restyled all of them. Behaviour is in
  `src/components/ds/`: `Tabs` (arrow keys, Home and End, one tab stop, panels stay in the
  document), `FormField` (label, helper and error wired with `aria-describedby` and
  `aria-invalid`), `StatePanel` (symbol and sentence), `ToolProgress` (`aria-current="step"`) and
  `Toast` (`window.lcToast()`, polite live region, stays until closed, focus returns).
  **`/design-system`** renders every one of them in every state: `noindex`, not in the sitemap, not
  linked. Nothing existing changed visually in this step.
- [x] **Step 1b, the shell on every public layout.** A skip link and `<main id="main">` on
  CaioLayout, AssessmentLayout, NotesLayout, PolicyLayout, ResourcesLayout and BookingLayout (only
  Base and Practice had them). **A phone menu on the five that had none.** Their header links hide
  below 900px (global.css), so on `/caio`, `/assessment`, `/latest`, `/privacy`, `/terms` and every
  resource page a phone could not reach them at all; a pre-existing defect. Policy links carry
  `aria-current="page"`, drawn as a deep-gold underline. Checked on 20 public pages at 390 and 1280:
  every page has the skip link and `#main`, every hidden link is reachable from the menu, no header
  overlap, no overflow, no script errors. The consulting and resource headers still wrap to two rows
  on a phone, as they did; the page-template step tightens them.
- [x] **Main merged in first** (`5950a90`): #29 and #30 (the stepped POC Selection Tool and Run-Cost
  Model) landed on main after this branch was cut. One conflict in `run-cost-model.astro`, resolved
  to keep the linen on a filled field and main's panel background on computed rows. Main's two
  pages also brought back six flat forest fills (`background: var(--sun)` / `--noir` on the progress
  bar and step dots); they are `--texture-forest` now, per the linen rule.
- [x] **Step 2a, the tool template** (`src/styles/templates/tool.css`, the package's `tool.html`)
  on all nine interactive tools: the eight on ResourcesLayout (which now sets `body.tool-page`) and
  `/tools/agent-design-check` (PracticeLayout gained a `bodyClass` prop). The dark linen hero with a
  serif h1 becomes a working heading: ivory, deep-gold eyebrow, Figtree bold h1 at the tool size,
  muted lead, ordinary buttons. Section headings inside a tool lose the gold emphasised word.
  **Chosen answer cards** (the POC tool's 0/1/2 anchors, the design check's answers) are now the
  design system's choice card: a forest line on the soft fill, not a forest fill. The R0 to R3 and
  Checked/Assumed pills stay forest when pressed: they are segmented toggles, which the package
  fills. Each tool's scoring, stepping and PDF logic is untouched; clicked through all nine at 1280
  and 390 with no script errors and no overflow. **Not changed:** the three printable worksheets
  (cost-ceiling, deployment, evaluation gates) already use a plain document heading.

**Three fixes on `/`, Sunil's review of 19 September:**
- **The brain loops continuously**, and the Replay and Reduce motion buttons are gone ("it should
  keep on looping"). A 4.8 s cycle: the seven knots light in turn over about 3.2 s, then it rests.
  It pauses off screen, and the OS reduced-motion setting still shows it still. **WCAG 2.2.2 gap:**
  motion over five seconds should have a pause control; the OS setting is now the only off switch.
- **The chapter break** was the package's full-width fabric band, which looked like a loose image
  over the seam. It is now a hairline on the seam, fading at both ends, with a gap at its centre
  where two strands cross over a gold knot (`public/textures/chapter-knot.svg`, 96Ã—24).
  `fabric-crossing.svg` is deleted.
- **The worked-example timeline** broke at the boundary step and never reached "Acts": its rail was
  a border, and the boundary step's full-width gold rules and margin cut it. Each step now draws the
  rail from its own knot to the next, so it is one line from "Reads" to "Acts". The boundary step
  is an open gold ring with its words on a soft gold panel beside the rail.
- [x] **Step 2b, the brand template on `/about`** (`src/styles/templates/brand.css`, the
  package's `brand.html`, applied by `bodyClass="brand-page"`). Full-width linen hero; split
  sections (heading left, reading right) divided by hairlines on the text column; the four steps
  as open columns (4 across, 2 on a tablet, stacked on a phone); the verified facts as open
  rows; the two routes as open rows. No boxed panels, no gold heading words. The "Not stated on this
  page" block keeps its blue uncertain panel on purpose. No copy changed. 390: 5,828px
  (was 5,872); 1280: 3,930px (was 3,806).
- [x] **Step 2c, the programme template** (`src/styles/templates/programme.css`, the package's
  `programme.html`, `bodyClass="programme-page"`) on `/programmes`, `/programmes/enterprise`,
  `/advisory` and `/contact`: full-width linen hero, stacked sections under a hairline, cards and
  comparison panels as open rows, numbered steps as the work list, the contact routes as a two-column
  list. Pending-facts panels kept. No copy changed. No overflow at 390 or 1280.
- [x] **Chat is back in the bottom-right corner on `/`** (Sunil, 19 September). The header and
  phone-menu chat buttons are removed; `AskWidget`'s `launcher="header"` option still exists and is
  unused. The pill now lifts above the sticky Apply bar while the bar shows (`--sticky-apply-h`,
  set by StickyApplyBar), on every page that has both.
- [x] **Step 2d, the consulting template on `/caio` and `/assessment`**
  (`src/styles/templates/consulting.css`, set by CaioLayout and AssessmentLayout as
  `body.consult-page`): full-width linen hero with the portrait, open proof bar, sections under a
  hairline, the six "what I own" and deliverable cards as rows, open stat band and fit columns, open
  FAQ, no section numbers, no gold heading words. The "Sunil Mathew" wordmark stays; the pricing
  tiers and price card stay as panels (the decision surface). No copy changed.
  **Fixed on Sunil's go-ahead (19 September):** `/caio`'s maker section said "100M+ users", "teams of
  up to 150 people", "~31 billion executions a week", "300+ products", "three Fortune-100 companies"
  and named product work at each employer; `/assessment`'s said "100M+ users". The 11 September
  finding had claimed these were gone from every public surface; they were still live on `main`.
  Both now carry the approved context only: Google, Amazon, Walmart and startups, teams across the
  US, UK, China and India, and current agentic-AI work. A comment in `caio.astro` records the cut.
- [x] **Step 2e, `/craft`** (Sunil: "use the same design for /craft"). Rendered locally for the first
  time with the existing dev-only preview learner (`CRAFT_DEV_BYPASS=1` in `.env.local`, which is
  gitignored and compiled out of every build). Fixed, all pre-existing:
  - **The footer rendered as a third column at the top right of every `/craft` page**: it was a
    sibling of `<main>` in the flex shell. It is inside the scroller now, under the content.
  - **The dashboard hero text was illegible**: the eyebrow was forest on the forest linen and the
    lead was muted ink on it. They use the hero tokens now.
  - **The dashboard footer's text and email link were near-invisible**: global.css colours
    `.foot-grid` for the dark public footers, and this footer is light.
  - **The session list read as one grey block** (a 1px-gap grid on a line-coloured ground behind
    transparent rows). It is rule-separated rows now, as the design system draws lists.
  - The LC mark heads the rail, as it heads every public header.
  Contrast audit on 15 `/craft` pages at 1280 and 390: 0 failures, 0 overflow. The console
  (`/craft/admin`) is not in this step; it needs the admin password to render.
- [x] **The topic break everywhere a topic changes** (Sunil, 19 September). One drawing, defined
  once in `components.css` as `--seam-line` / `--seam-bg`: a hairline fading at both ends with two
  strands crossing over a gold knot at its centre. Now between every two sections on `/` (inside
  chapters too, not only between them), on `/about`, the programme pages, `/caio`, `/assessment` and
  the reading sections of every tool page (not inside a tool's own workspace). **Trap:** `--seam-bg`
  is resolved at `:root`, so to narrow it to a text column you must write the two layers out on the
  element and set `--seam-w` there (brand.css, programme.css and tool.css do). `/` at 390 is
  20,482px (was 20,086) because in-chapter sections now open with 64px instead of 24px.
- [x] **Header overlap on phones 391 to ~560px wide** (Sunil's screenshot, 19 September): the lockup
  kept its 44px tablet size there and ran under Apply. It takes the phone size (35px mark) up to
  560px now. Scanned every 5px from 320 to 1300 on `/` and six other layouts: no overlap and nothing
  past the right edge. (300px still overflows; below the 320 floor this site supports.)
- [x] **"Before you apply", "Talk first" and "Apply" are centred** (Sunil, 19 September): headings,
  the FAQ list, the booking panel, the route chooser, the form and the contact line share one centre
  line (measured 0px off centre at 1280 and 390). Text inside the answers, the booking panel and the
  form stays left-aligned for reading.

## V5 illustrated on `/` — 19 September (later), `feat/landing-refinement`

The V5 package (`docs/2026-09-19_Landing_Page_V5_Illustrated-…/`, kept out of the repo via
`.git/info/exclude`) is now the source of truth for `/`. It is V4 (an ivory, quieter re-layout of
the refinement) plus eleven drawings. Its `base.css` is the refinement's `styles.css` almost
byte for byte, so `landing.css` stays the base and **`src/styles/landing-v5.css`** carries
`v4.css` + `illustrated.css`, loaded after it in the package's order. preview.js is not shipped.

- [x] **Hero**: ivory with `public/textures/ivory-weave.svg`; the line-drawn brain is the package's
  `assets/brain-lines.svg`, byte for byte, in `src/components/cohort/art/brain.svg` (Sunil asked for
  exactly that file). It loops on an 8-second timeline, only while on screen and the tab is visible.
  The woven-brain webp files are deleted. Two equal buttons: Apply for the cohort / Start the team
  conversation. The proof bar is gone; the intro strip carries the one employer/26-years sentence.
- [x] **New sections**: `#routes` (two ways to learn, cohort figures from `facts.ts`) and
  `#enterprise-scope` (no price, no dates). Questions now open the last chapter, then `#apply`,
  then `#book`, with the short enquiry form (`route="enquiry"`) folded under the booking widget.
  That keeps the widget's "use the form below" copy true.
- [x] **Drawings**: `ConceptFigure.astro` inlines the eleven SVGs from `src/components/cohort/art/`.
  Each traces once on first view, then rests.
- [x] **One Pause motion control in the footer**, for the brain and the drawings (WCAG 2.2.2).
  Session only, nothing stored. This closes the 2.2.2 gap noted above.
- [x] **Header**: the site's five sections + **Apply** (to `#apply`), and an "On this page" row (a
  `<details>` on phones). Menu below 1080px. Sticky bar on `/`: "Find the right programme for you." +
  Apply (still hidden on phones). The package's "Enquire" was replaced by Apply on Sunil's answer
  (19 September): the cohort CTA is Apply everywhere.
- [x] **Meta title and description are V4's** (Sunil, 19 September): "The Living Craft — Design
  agentic systems. Guide your team." and `STANDFIRST` = "Live learning with Sunil Mathew for
  experienced engineers and engineering teams. Explore the open cohort or start a team-learning
  conversation." The JSON-LD Course description reads the same constant.
- [x] Copy changes that came with V4, taken as written: the hero, the Sunil lead ("global technology
  companies and startups") and the paragraph after it, "Open cohort" labels.
- [x] **The knot divider is gone everywhere** (Sunil, 19 September: "remove this everywhere").
  `--seam-bg`/`--seam-line` and `public/textures/chapter-knot.svg` are deleted; `/`, `/about`, the
  programme pages, `/caio`, `/assessment` and the tool pages draw no divider between sections now.
  Spacing stays as it was. The V4 plain hairlines were not added in its place.
- **Kept against the package, on Sunil's earlier instructions**: the centred last three sections, no sticky bar on phones.
- QA: side-by-side with the package at 1440 and 390; functional script 77/79 (the 2 are the stubbed
  500s, expected); 0 contrast failures at 1280 and 390; no overflow 320 to 1920; `astro check` 0
  errors; `npm test` 37/37; build clean. Chat does not render locally without `ANTHROPIC_API_KEY`.

---

## The LC mark replaces the junction — 19 September, on PR #18

**No logo SVG exists yet.** Alchemy supplied only `logo-reference.png` (1254×1254, no
transparency). The design package forbids tracing or inventing a vector, so the mark is a
crop of that PNG, scaled down and nothing else. When the approved vector mark and its
small-size version arrive, they replace the files below; `Logo.astro` stays.

- **Files:** `public/brand/lc-mark.webp` (199×128, 4.4 KB), the mark only. The crop is
  x 160–1185, y 130–790 of the artwork. The name and the tagline start at y 812, so
  **neither appears anywhere on the site**.
- **It keeps its own cream paper** (`--logo-paper` #F1EDE4). Keying the paper out turned
  the shadow and the glow round the gold dots into grey smudges on dark green. On the
  ivory header the paper is a faint box with 4px corners. On the dark footers it sits on
  a deliberate paper tile (`<Logo tile />`).
- **Sizes:** 40px tall in a desktop header, the smallest at which the woven stem and the
  dots still read. 28px below 560px. 36px in a footer tile. At 32px on a normal-density
  screen the detail blurs; at 16px it is a smudge.
- **Where:** every Living Craft wordmark: `BaseLayout`, `SiteNav`, `SiteFooter`,
  `PolicyLayout`, `ResourcesLayout`, the `/craft` phone bar and dashboard footer, and
  `/book`. The "Sunil Mathew" consulting wordmark on `/caio`, `/assessment` and `/latest`
  keeps its dot on purpose. `Junction.astro` is deleted.
- **Alt text:** `alt=""` and `aria-hidden="true"`, because "the living craft" beside it
  already names the brand.
- **The phone header had no slack.** Before this change the cohort header needed exactly
  its 358px at 390px wide, and the mark is 26px wider than the junction. Below 560px the
  mark is 28px (not 32) and the gaps between the three items are 12px (not 24). Measured
  after: one row at 390 and at 375, Apply and the menu on the right. The practice-page
  header still wraps to two rows on a phone, as it did before, with the menu on the right.
- **Favicon.** `public/favicon.svg` was **Astro's default logo**, left over from setup, on
  every page. Deleted. Replaced with `favicon-32.png`, `apple-touch-icon.png` (180px,
  15 KB) and a regenerated `favicon.ico` (16, 32 and 48px), all cut from the same artwork.
  There is no SVG favicon, because that would need a vector. The 16px size is weak until
  the approved small mark exists.

---

## Dark green linen on the large dark surfaces — 19 September, on PR #18

Task 1 of "Organised TLC Design System Changes". One commit, separate from the redesign.

- **What has it:** the hero shell (`.hero > .wrap` in `global.css`, so every public page
  with a hero and all nine resource tools), both footer bands (`footer.site` and
  `SiteFooter.astro`, through `--footer-bg`) and the `/craft` dashboard hero
  (`.hero-black` in `craft/index.astro`, the one page that painted its own).
- **Widened the same day to every dark green background.** Sunil: "replace everyplace
  wherever dark green is there with the textured one." 65 rules in 23 files now use
  `--texture-forest`: buttons, selected choices, filter chips, table header rows, code
  blocks, avatar marks, small dots and 3px spines, in the public pages, `/craft` and the
  console. That includes the old ink-coloured panels (`--ink`, `--ink-1`), which were
  dark green too. Hover states use `--texture-forest-hover` (the lighter forest #244F41 at
  0.55 over the linen). **Not surfaces, so still flat:** borders, text, SVG strokes and focus
  rings in forest. A rescan finds no flat dark green background left.
- **Measured on the small elements,** text hidden and the rendered background sampled,
  lightest 5% of pixels, ivory text: header Apply 6.54 (6.44 on a phone), Apply on hover
  5.76, `/craft` sign-in button 6.14, a resource-tool table header 6.56, a code block 6.54.
- **The two Ask widget avatars** draw a chat icon on the dark circle. The icon is the top
  layer and the linen sits under it. The large avatar's `background-size` lists one size per
  layer (`19px 19px, auto, cover`); a single value would shrink the linen to 19px.
- **The file:** `public/textures/linen-forest.webp`, 708x708, 83.5 KB. It is the middle
  third of the package's `woven-materials.png`, with 8px trimmed each side to remove the
  pale gutter between panels. The package folder stays uncommitted.
- **The tokens:** `--texture-forest` and `--texture-footer` in `theme.css`. Each is a
  whole `background` value: an overlay, the linen, and a flat fallback colour.
  **`--footer-bg` is now a background, not a colour**; use it only in `background:`.
- **The overlay is there for contrast.** The raw linen's lightest 5% of pixels give ivory
  3.39:1 and on-dark-muted 2.51:1. Forest at 0.55 and dark forest at 0.45 are the smallest
  opacities, rounded up, that bring both past 4.5:1.
- **Measured in the browser afterwards,** on a text-free strip of each rendered surface,
  lightest 5% of pixels: hero ivory 6.25 to 6.47, on-dark-muted 4.62 to 4.78; footer ivory
  9.20 to 10.35, on-dark-muted 6.79 to 7.64 (`/` at 1280 and 390, `/caio` at 1280).
- **The gold h1 words are now ivory italic.** Gold was 3.82:1 on flat forest but 2.27:1 on
  the lightest linen, below the 3:1 large text needs. Keeping gold would have needed a 0.79
  overlay, which hides the weave. `--hero-em` is ivory and `.hero h1 em` is italic.

---

## Site redesign: design system v1 — 18 September, on PR #18 for review

**What.** The public site is moving to the Living Craft website design system v1 (Alchemy and
Ein, 18 September, a "review edition"). Forest green actions, ivory ground, serif h1 and h2,
6px and 12px corners, and a 1px line instead of shadows. The package is kept OUT of the repo
on purpose (`.git/info/exclude`); its values are in `src/styles/ds/theme.css` and
`contract.css`. On `cta-book-now-rework` (PR #18), in commits separate from the CTA work.

**Step 1, tokens only.** `theme.css` and `contract.css` carry the new values. Existing
token names were re-pointed, not renamed, so `--sun` is now forest green and still means
"the action colour". New component tokens (`--hero-*`, `--footer-*`,
`--eyebrow-*`, `--weight-display`, `--font-heading`, `--size-h1`, `--size-h2`) exist
for `global.css` to read in the next commit.

**Scope widened the same day: `/craft`, `/craft/admin` and `/book/[id]` now use it too.**
Steps 1 and 2 kept those areas on the old system through a `theme-course.css` override
(verified byte-identical). Sunil then asked for all three areas to match, so step 3 deleted
the override and put everything on `theme.css`. There is one token set now; do not
reintroduce a second.

**Step 3, tokens for the gated areas.** Three things the package does not design, decided
deliberately:
- **Forum voices** (`--agent-*`). Learner ink on paper 13.61; instructor forest on soft
  green 9.87 (new `--agent-instructor` tokens); machine deep gold on warm cream 5.62;
  uncertain moved from gold to blue, 6.19, because gold is now the machine's; refused
  error on its soft, 5.84. No two share a hue.
- **Compact density** (the console). 40px rows, 36px controls, 14px body, and no radius
  override. 36px is a stated departure from the package's 44px target and well above
  WCAG's 24px.
- **Status never looks like an action.** Forest fill is the action colour, so no pill,
  badge or tag may use it. Five did (quiz state, two pinned tags, the ADR week badge, the
  forum role badge); step 5 fixes them.

**Step 4, the panel line is a token.** `--shadow-raise` is now a 1px box-shadow ring in the
line colour, and `--shadow-lift` the same ring in the darker control line. 102 rules in 34
files already used those tokens for a panel's edge, so this one change gives every panel on
every surface the package's 1px line. Step 2 had added a separate `--panel-border` to the
`global.css` panels; that was taken back out, or those panels would draw the line twice.
**Never add a border to something that uses a shadow token.**

**Step 5, /craft and the console components.** Fixed by scanning every stylesheet for two
shapes, not by eye: dark text on an action or dark fill, and a status on the action fill.
- Six actions on forest carried ink text (about 1.2:1): the dock toggle, tour Next,
  familiarity go, the dashboard's next-step, to-do tab and live banner. All now
  `--text-on-accent`.
- Five statuses used the action fill: the quiz "open" state (now success green), both
  pinned tags (now ivory with a control-line edge), the ADR week badge and the dashboard
  count (now soft or panel fills). **A status is never forest-filled.**
- Forum voices applied: the instructor's avatar mark is forest with ivory initials (a face,
  not a status); the Instructor badge, the endorsed tag and the thread's "Sunil replied" tag
  are soft green with forest text; "solved" is an ink outline, so it can never be mistaken
  for Sunil's endorsement; the agent dock's avatar is the machine's gold, because it answers
  from the syllabus.
- Code stays monospace (`--font-code`) in nine rules, including the seat-code field.
  Console headings and small titles are Figtree, not the serif: the package keeps the serif
  out of dense working areas. Seven scrims moved to the new ink. The gated layouts load
  Source Serif 4 and no longer load JetBrains Mono.
- **Not fixed, and not a colour problem:** `/craft/login` at desktop width puts the card
  left of centre and the footer at the top right. It did that before the redesign too.

**Step 6, public page styles.** Same two scans, run on the public pages.
- Two resource tools put ink on a selected (forest) choice: now `--text-on-accent`. The
  memory kit's copy button had a forest focus ring on a forest code block: now ivory.
- Eight code rules moved to `--font-code`. Three PDF dialog backdrops moved to the new ink.
- **A real AA failure, fixed:** the design-check's worked-example card was a gold block, and
  its note was ink at 85% on gold, **4.19:1**. The card is now soft green with the 1px line
  (ink 11.89:1, note muted 5.32:1). Its comment said the note passed; it did on the old orange.
- Serif lines that pages had bolded now use the serif's regular weight; short titles and
  labels that used the display face are Figtree bold (`/caio` tiers, `/assessment` fit
  heads, the Ask widget title, and others).
- **Phone header:** the wordmark is one size smaller below 560px, so the cohort header stays
  one row with Apply and the menu on the right. The junction and the 22px face had pushed
  them onto a second row.

**Verified:** `astro check` 0 errors, clean build, no horizontal overflow on any in-scope page
at 1280 or 390. Before and after screenshots of `/`, `/caio`, `/about`, `/craft/login` and
`/craft/admin/login` at 390 and 1280. **Only the two sign-in pages were reachable in
/craft and /craft/admin**: there is no local `.env`, so no seat code or console password.
The gated pages behind them were checked by scanning their stylesheets, not by rendering.

**Contrast, computed for every pair.** Four pairs in the new system fail AA for normal text.
They were recorded, not adjusted: gold on ivory 2.76, gold on paper 2.96, gold on forest
3.82 (large text only), muted on line 4.15 (disabled controls only). So gold is a fill and a
rule colour, and never small text. The two old near-misses (`--accent-ink` 4.02 and
`--text-quiet` 4.04 on mist) are gone on the public site: deep gold is 5.98 and muted is 5.69
on ivory.

**Step 2, the shared stylesheet and shell.** `global.css` now reads the component tokens:
h1 and h2 are the serif at 400, h3, h4, `summary` and the wordmark are Figtree 700, eyebrows
are uppercase, and panels show a 1px line (see step 4). The footer is a dark forest
band, driven by `--footer-*` in both `footer.site` and `SiteFooter.astro`. `SeoHead` loads
Source Serif 4 (400 to 700) and no longer loads JetBrains Mono. The Living Craft wordmarks
show the static junction motif (`Junction.astro`) in place of the dot. **The consulting
wordmark ("Sunil Mathew" on `/caio`, `/assessment`, `/latest`) keeps its dot on
purpose**: CLAUDE.md keeps that practice distinct, and the junction is The Living Craft's
motif. The package animates the junction once per session through `sessionStorage`; this
site stores nothing in the browser, so it is drawn still.

**Two things the package does not design, decided here.** A primary button on the dark
hero is ivory with forest text, because forest on forest would vanish. Layers that float
over the page (menu panel, Ask panel, sticky bar) keep a soft shadow; nothing else does.

**Kept from the density pass, on purpose.** The package sets section padding to
clamp(56px, 7vw, 112px), which is MORE space on desktop than today. The site keeps its
existing section rhythm (now 64px, then 48 and 32 on narrower screens), because Sunil asked
for less blank space on 16 September.

---

## Phones: no floating button, and a hamburger menu — 16 September, last pass

- **Nothing floats on a phone any more except the Ask pill.** `StickyApplyBar.astro` lost its
  phone shape and its drag code. Below 640px it shows nothing; above, it is still the bar
  with Apply on the right. The drag code is in git at `5c20938` if a phone shape returns.
- **Both headers have a hamburger menu below 900px** (`MobileMenu.astro`), in the slot the
  top-right Book now used to hold. Below 900px the text links were hidden with no other route
  to them. The menu shows the same links plus **Talk with Sunil**. It is not a dialog: it
  closes on a link tap, Escape, a tap outside, or widening past 900px.
- **The rule that hides header links is now direct-children only** (`.navlinks > a` in
  `global.css`, `.sitenav-links > a` in `SiteNav.astro`). The descendant form also hid the
  menu's own links. Keep the `>` if you edit either.
- On practice pages the header wraps to two rows on a phone, as it did before.
  `.sitenav-links` now takes the whole second row and packs to the end, so the menu button
  stays on the right edge.
- **Tested in headless Chromium at 390×844**, not only by reading markup: the menu opens with 6
  links on `/` and `/about/`. Escape closes it. Tapping "Questions" closes it and lands the
  heading 160px from the top, clear of the 77px header. At 1280px the button is hidden and
  the bar shows.

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

## Resource 05, the Agent Memory Audit Kit — 17 September, on a branch

Branch `resource/agent-memory-audit-kit`, promised in LinkedIn post "Agentic system design ·
Episode 6". Page at `/resources/agent-memory-audit-kit`; kit files in
`kits/agent-memory-audit-kit/`; downloads committed at `public/downloads/agent-memory-audit-kit.{pdf,zip}`.

Three things a later session would otherwise rediscover:
- **The PDF is printed from the page** by `npm run build:kit` (headless Chrome over the
  DevTools protocol, no Playwright). Edit the page or the data module, run the script, commit
  the three files under `public/downloads/`. Never edit the PDF or the ZIP by hand.
- **The Ask widget owns the class `.ask`.** A print rule hiding `.ask` also hid every
  outcome pill named `ask`. Pills are `oc-*`; the widget is hidden by `#ask`.
- **Four numbers are promises:** 12 questions, 7 tests (one titled "Correction bleed"), 4
  outcomes. The page throws at render if the data module breaks any of them.

The LinkedIn DM link, once merged: `https://learning.thelivingcraft.ai/resources/agent-memory-audit-kit?utm_source=linkedin&utm_medium=dm&utm_campaign=ep6-memory`.

## Every tool now says who built it — 17 September

`TOOL_CREDIT` in `src/data/resources.ts` ("Built by Sunil Mathew, co-authored with
Claude") is rendered by `ResourceCredit.astro` in every tool's hero, in the
`ResourcesLayout` footer, on `/resources`, in the three worksheets' byline, and inside
the memory kit's PDF cover and footer, README and both licences. A new tool page gets
the footer line for free and should add `<ResourceCredit />` under its counts line.
Sunil's standing request; do not ship a tool without it.

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


## ✅ Two tokens were below AA on the ground `body` actually uses — resolved 18 September

**Resolved everywhere on 18 September** by design system v1 (see the redesign section
above): deep gold is 5.98 and muted is 5.69 on ivory. Kept for the record.

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
- **`--sun` is forest green now.** The token names outlived their colours: `--sun` and
  `--noir` both resolve to forest `#183D32`. Ink text on either is about 1.2:1, so text on
  an action fill is always `--text-on-accent` (ivory). `--ink-3` is on-dark-muted and is a
  text colour on forest ONLY. CLAUDE.md's Design tokens section has the full palette.
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
