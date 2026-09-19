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
- **The three PDF renderers share `lib/resources/pdf-writer.ts`.** It was two identical
  copies until today. A fourth renderer imports it; it does not copy it.

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
