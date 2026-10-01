# Resume here

**If you have been asked to "continue the work", read this file first, then
[`build-status.md`](build-status.md).** This is the operational checkpoint: where the work
actually stands, what to pick up next, and what is waiting on somebody else.

Keep it current. Update it whenever you finish something or discover something that would
cost the next session an hour to rediscover. It is short on purpose — the detail lives in
`build-status.md` and in the code comments.

**Last updated:** 1 October 2026
**Branch:** `feat/plain-green-v5-pages-branded-pdfs` (PR #37), off `origin/main`, with main
merged in on 1 October (the week 2 and week 3 teaching rebuild, PRs #39 to #45). It carries
the four tasks from Sunil's call of 25 September and the later ones below. PR #31
(`feat/landing-refinement`) and PR #36 (`resource/failure-triage-quiz`) are merged. The
pipeline work is `feat/cohort-pipeline` (PR #7), stacked on `feat/learner-dashboard-poc`
(PR #6).
**Source of record:** [`docs/Website Rebuild 10-09-2026/`](../Website%20Rebuild%2010-09-2026/)

---

## PR #37 merged 1 October, 15:38 UTC — what is still open

PR #37 merged without a review approval, and production deployed it. Its `eval` check was
red because every probe got "The assistant is briefly unavailable", so it measured nothing.
The live Ask widget returned the same message after the deploy. Find the cause in the Vercel
logs (`ASK DOWN`) or the Anthropic console before anything else here.

- The download dialog said "does not start any other email" directly under the marketing
  box that starts the follow-up sequence. The fix makes the sentence conditional on the tick.
- Four findings in the drip planner and the webhook handler stay open. They matter only once
  `COMMS_DISPATCH=on`, so fix them before turning dispatch on:
  - `drip.ts` treats a duplicate outbox key as "skip" without calling `schedule()`, so a crash
    between queueing and scheduling leaves the sequence stuck for good.
  - `drip.ts` calls `recordSend` after an outbox insert that failed for a reason other than a
    duplicate key, so a resource nobody received is marked as sent.
  - `drip-store.ts` returns `['*']` when the sent list cannot be read, and `recommend()` does
    not treat `'*'` as "everything", so a resource can be sent twice.
  - `webhooks.ts` records the event before the outbox has the Resend id, answers 200, and
    rejects the retry as a duplicate, so a bounce in that window never suppresses the address.

## Before PR #37 reached `main` — 1 October

A push to `main` deploys production, so these happen in this order:

1. [x] **Done 1 October.** Production ran `supabase/schema.sql` in full from this branch.
   A check query confirmed `people.role_code`, `attributions.first_landing_path`,
   `comms_drip_sends`, `events_event_id_uidx` and the `p_role_code` argument all exist.
2. [x] **Done 1 October.** The Vercel team is on Pro, which allows the ten-minute cron in
   `vercel.json`. It stays.
3. Set `COMMS_WORKER_SECRET` in Vercel production. Without it the cron gets a 401 every ten
   minutes, which is harmless. Nothing sends until `COMMS_DISPATCH=on`.
4. A review approval on PR #37, then merge. **Merged without an approval, 1 October.**

## Four tasks from Sunil's call, 25 September — `feat/plain-green-v5-pages-branded-pdfs`

One branch, one draft PR, at least one commit per task. The brief was meant to be
`docs/site-tasks-2026-09-25.md`, but that file was never written, and the decision on
26 September was to go on without it. The task names come from the PR title.

- [x] **1. Plain green on every page except `/`.** One rule in `src/styles/ds/theme.css`,
  `body:not(.landing)`, points `--texture-forest`, `--texture-forest-hover`,
  `--texture-footer` and `--footer-bg` at flat forest. `/` keeps the linen. A before/after
  diff of every element's computed background on `/` matched at 1440px and 390px. `/craft`
  and `/craft/admin` are included; narrowing the selector puts them back. Two things that
  will cost an hour if forgotten:
  - `--footer-bg` has to be restated in the override. A custom property is resolved where
    it is declared, so `body` inherits the linen that `:root` already resolved.
  - The signed-in `/craft` pages return 503 in local dev without Supabase, even with
    `CRAFT_DEV_BYPASS=1`. They were checked by resolving the tokens under `CraftLayout` on
    `/craft/login`, not by rendering the dashboard.
  - **Open with Sunil:** the triage quiz's case file (resource 07) was given the linen on
    26 September because he asked for the cohort page's surfaces there. This rule turns it
    flat like every other inner page. The ivory weave behind its hero is untouched: it is
    not green, and he named the green one. If he wants the case file woven again, that is
    a one-page exception he has to ask for.
- [x] **2. V5 look on the inner pages** (three commits, 26 September). Sunil: "all the tool
  pages and internal sites have to be redesigned to match the actual site". The shared part of
  V5 moved out of landing.css and landing-v5.css into `src/styles/ds/site-v5.css`; `/` imports
  it through landing.css and still resolves every rule the same way. Inner pages opt in with
  two body classes (`lc-v5` for the chrome, `lc-v5-read` for reading type) and draw
  `SiteHeader.astro`. CLAUDE.md, *V5 on the inner pages*, has the rules.
  - [x] Step 1, the nine tools on ResourcesLayout. Tools take `lc-v5` only: V5's header,
    ground, width and footer, and they keep tool.css's working heading and workspace.
  - [x] Step 2, PracticeLayout: the hubs, worksheets, guides, templates, about, advisory,
    contact, programmes, toolkit and email preferences (`lc-v5 lc-v5-read`), and
    `/tools/agent-design-check` (`lc-v5` only). SiteNav.astro is gone; SiteFooter now draws
    `/`'s footer. The practice header is sticky now, as `/`'s is. `/about` had a page-scoped
    rule painting its hero's `<strong>` in ivory for the old forest hero; it is ink now.
  - [x] Step 3, `/caio`, `/assessment`, `/latest`, `/privacy`, `/terms`. Their anchor links
    moved to the "On this page" row and their cross-links ("AI Readiness", "Fractional CAIO")
    to the left of it. Policy pages have no action button, as before, and still no analytics.
    Long actions ("Request a scope call") wrap to two lines on phones instead of running under
    the lockup, which `/`'s short "Apply" never had to handle.
  - Out of scope, said in the PR: `/craft`, `/craft/admin` and `/book/[id]`.
  - Checked on all 31 pages at 1440 and 390px: status 200, no sideways scroll, and Google Tag
    Manager on exactly the pages that had it before. A contrast sweep found two page-scoped
    rules written for the old forest hero (`/about`, `/latest`), both fixed. It also found
    `--text-faint` (#C6D4C8, 1.45:1) used as text on paper in three tool pages this work did
    not touch: agent-memory-audit-kit, agent-failure-triage-kit, agent-design-check. Not fixed
    here; it predates this branch.
  - Things that cost time and will again:
    - **`/` is checked element by element**, not by eye: a before/after dump of every element's
      box and 27 computed properties at 1440, 1024 and 390px. It must show zero differences.
      One exception is expected: after the split, 79,000 pixels at 1440px changed by 1/255 in
      colour under the hero's wash. No computed style changed, and restoring the weave literal
      did not remove it, so it is rasterisation, not layout.
    - **A JSX comment between `</head>` and `<body>` switches V5 off.** Astro opens an implicit
      `<body>` and the class on the real one is lost. Comments go in the frontmatter.
    - **BaseLayout is not on SiteHeader.** It had uncommitted edits to the same header on
      26 September; the styles are shared, the markup is not yet.
- [x] **3. Branded PDFs** (28 September). Sunil: the PDFs should carry "the texture plus the
  branding", "that ivory texture", "not the green textile one".
  - **The brand lives once, in `src/lib/resources/pdf-writer.ts`.** Until now only the
    authority review used that file; the other three renderers each carried a private copy of
    `Writer`, `clean()`, the colours and a sun-dot wordmark. All four import it now.
  - Cover: the ivory weave edge to edge, the lockup, a Source Serif 4 title, then a paper sheet
    for the text. Later pages: paper with a 40pt weave band, a gold rule and a small lockup.
    `WEAVE_EVERY_PAGE` in pdf-writer.ts puts the full weave on every page if Sunil wants it.
  - Figtree and Source Serif 4 are embedded and subset (`@pdf-lib/fontkit`); `clean()` and
    each renderer's "every character can be printed" check test against the embedded fonts.
    ₹, → and the true minus now print as themselves.
  - `pdf-assets/` holds the fonts, their OFL licences and the PNGs from
    `npm run build:pdf-assets` (sharp, devDependency). Bundled by `includeFiles`, like
    `downloads/`. See `pdf-assets/README.md`.
  - The memory kit PDF is printed from its page with the same brand, and `build:kit` now runs
    on Windows (see `downloads/README.md`).
  - Sizes: poc-screen 12.8 → 116.6 KB, model-selection 16.7 → 122.7 KB, authority review
    10.5 → 114.2 KB, run-cost 21.8 → 128.8 KB (most of it the two fonts and the lockup),
    memory kit 517 → 663 KB.
  - Known limit, not fixed: a name typed in an Indian script (or any script Figtree lacks)
    cannot print and is dropped from the cover line; "सुनील 🙂 Zoë" prints "Zoë". A fix is a
    fallback font such as Noto Sans Devanagari.
  - The browser's own print buttons (`data-gate="print"`) are out of scope.
- [x] **4. Tool downloads** (28 September). Sunil: "What needs to be downloaded is not the
  filled-up report, but rather the tool itself that they can use."
  - The primary download on poc-screen, model-selection-tool and agent-authority-review is a
    blank Excel workbook, in the hero and in the result. The scored PDF stays as the second
    button, labelled as the reader's own copy. Removing it is Sunil's call, not ours.
  - `npm run tool-downloads` builds three workbooks and two Markdown sheets into
    `downloads/`: a tsx script dumps the data modules as JSON, a Python writer
    (`openpyxl`, `Pillow`) draws the sheets. Commit the output.
  - `src/lib/resources/tool-workbooks.test.ts` reads each committed workbook with a small
    formula evaluator (`xlsx-eval.ts`) and compares it with `readScores`, `readAssessment`
    and `readSheet`: band edges, hard gates, blanks, the example sheets and 1,300 random sets.
    Excel itself gave the same answers through COM on 28 September.
  - The rule placement audit hands over a blank worksheet and the design check the question
    list, both as Markdown. Their CSV and text exports are still `local()` and post nothing
    typed.
  - The Rework Cost Check (resource 08, merged from `main` into this branch) served its
    workbook from `public/downloads/`, outside the gate. It is in `downloads/` now, behind
    the gate, with its own held email.
  - Six delivery emails changed or were added, at `RESOURCE_TOOLS_REVISION` (the addendum's
    version plus `+tools-2026-09-28`). None is approved.
  - Things that cost time: `python3` on Windows is the Store stub, so the build script
    probes for a Python that imports openpyxl; the probe must run with no shell, because
    cmd.exe mangles `-c`. Excel COM from PowerShell refuses an Int32 passed through a
    function; cast to `[double]`.
  - **Five open points, decided the same day** (the user asked for the best decision on each):
    - *Scored PDF:* kept as the second button. It costs nothing and a reader may want it.
    - *The six emails:* left unapproved. Approval is a named act by a person in the console,
      and there is no sending provider yet (D2). Nothing about this work changes that.
    - *"Scored against rules" in the design check email:* now "checked against rules ... It
      gives no score". Same revision string: no row at that revision was ever stored.
    - *Run-cost workbook on the old brand:* rebuilt on the site's brand. The brand for all four
      tool workbooks now lives once, in `scripts/workbook_brand.py`. Every figure in its
      reference example is unchanged (checked cell by cell in Excel). It also now prints one
      page wide (27 pages became 11), and the blank sheet's break-even row no longer shows
      `#DIV/0!`.
    - *Fonts:* kept as Figtree and Source Serif 4, after weighing Georgia and Arial. Google
      Sheets renders both; Excel draws a substitute, and the layout was already checked in
      Excel on a machine without them. The Rework Cost Check made the same choice.
  - **A bug found on the way, fixed:** the Python writers read their JSON with Windows'
    default encoding, so ₹, → and curly quotes in the POC and model selection workbooks
    (pushed in 9d4b9b9) were mojibake. Both now decode UTF-8, and a test fails on mojibake
    in any of the four tool workbooks.
  - **The gate's wording, fixed in task 7:** it said "Your copy" and "What you typed into the
    tool goes into the file" for every file, including the blank workbooks. See task 7.
- [x] **5. Closing cohort CTA on every tool and resource page** (29 September). Sunil, call
  of 28 September: "At the bottom of each of the tools or any of the resources that we give,
  there should be a CTA that takes them to, you know, join or explore."
  - **One component, `src/components/site/ClosingCta.astro`.** "Explore the cohort" to `/`
    (primary), "Apply" to `/#apply`, a `download` slot for the page's own gated button, a
    `links` slot for quiet links, then "All resources". One optional line about the cohort,
    whose one figure (the week count) comes from `facts.ts`. Hidden in print. The row had
    been written by hand on each page, in three different wordings.
  - On 22 pages: the eleven tools and kits under `/resources`, `/tools/agent-design-check`,
    the three worksheets, the four templates and the four guides (the last two through their
    one dynamic route each). Out of scope: `/`, `/caio`, `/assessment`, `/latest`, `/craft`,
    and the index pages `/resources` and `/tools`.
  - The worksheets and templates carried "two links onward, no pitch". Sunil's request
    reverses that; each comment says so with the date. Their onward text is unchanged.
  - **Measured.** Both links carry `data-cta` (`cohort` or `form`) and
    `data-cta-placement="resource-close"`. `Track.astro` sends `cta_click` for any
    `[data-cta]` before its older rules. Until now a link to `/` sent nothing. The Apply
    link keeps `data-apply`, which the memory kit and the cost-ceiling workbook already
    listen for.
  - **`/api/track` now accepts `/tools/` as well as `/resources/`.** Without it, every event
    from the design check, its page views included, was dropped with a 204. That page
    already told readers their page view was counted. `/craft` still cannot match.
  - The cost-ceiling workbook still has no file, and its closing row says so instead of
    showing a button, as its hero does. `COHORT_CTA` and `APPLY_URL` in its data module
    were dead once the row moved and are gone.
  - Checked on `npm run dev` at 1440 and 390px on all 22 pages: the row renders once, no
    sideways scroll, every download in it opens the gate, "Explore the cohort" lands on `/`
    and Apply on `/#apply` with the form in view, and each click sends one `cta_click` with
    the page's path, `to` and `placement`. Hidden in print. Google Tag Manager loads on the
    same 12 of the 22 pages as on production. Playwright cannot read a `sendBeacon` body, so
    the test wraps `Blob` to read it; an async read lost events to the navigation and looked
    like a bug for one run.
- [x] **6. Outreach readiness: the website items in Alchemy's Ein handoff** (29 September).
  Source: `docs/2026-09-28_Outreach_Readiness-20260929T045849Z-1-001/` in the main checkout,
  `04-website-Ein-handoff.html` and `website-cta-audit.csv`. **Not committed**: it is 67 MB,
  mostly video, and it is Alchemy's package, not ours.
  - *Item 1, the chat label.* "Ask about the cohort" on `/` and the resource pages; `/caio`,
    `/assessment` and `/latest` keep "Ask about the practice". The launcher's accessible name
    and the panel's first line now say it is an automated assistant, not Sunil.
    The human enquiry form on `/` had the same label; it is "Write to Sunil about the
    cohort" since task 7.
  - *Item 2, contextual CTAs.* `CohortIntroLink.astro`, one text line under each of the 22
    pages' introductions, counted as `resource-intro`. The closing row's line is now the
    handoff's own per-page wording plus one sentence built from facts.ts
    (`src/data/resource-cohort-copy.ts`). Print shows that line with the full application
    address in place of the buttons.
  - *Item 3, the nine broken `#how` links.* ResourcesLayout linked every page's footer to
    `#how`, which only the cost-ceiling workbook had. It takes `howTo` now; each page names
    its real section; the memory kit has none and gets no link. The three stepped tools show
    their Start step before following the link.
  - *Generated files* ("contextual cohort copy plus a working application URL"): the
    authority review PDF gained the cohort panel the other three already had; the template
    Markdown (both variants), the two blank sheets, the three tool workbooks, the rework
    workbook and the design check's text summary end with the invitation and the address.
    The memory kit PDF and ZIP were rebuilt from the page, so they carry the print line.
    Worksheet CSVs do not: a CSV row is not a place for a sentence.
  - `cohort.liveHours = 30` joined facts.ts; `/` read "30" as typed text in three places and
    now reads the field. Since task 7 the FAQ answer in `cohort-copy.ts` reads it too.
  - `tools/rework-cost-check/build_xlsx.py` now runs its dump with `tsx`, because the dump
    reads the invitation module. Every value in the workbook was diffed in Excel before and
    after: only the three new cover cells changed.
  - **Not done, and not ours to do:** items 4 and 5 (the D03 and D07 caption promises, and the
    offer facts with Sunil and finance), the email nurture modules (no approved consent
    wording, and no provider), every provider, persistence and delivery test in the handoff's
    test table, and the video and D08 to D12 work.
  - The date switch and the chat pill's overlap were settled in task 7.
- [x] **7. The remaining open items** (29 September). The user asked for them fixed.
  - **The gate says whose file it is.** A button that hands over the reader's own answers
    carries `data-own` (the four scored PDFs, the audit's CSV and print, the authority
    review's print, the design check's summary and print). Its dialog says "Your copy" and
    "What you typed into the tool goes into the file and is not stored". Every other file
    says "Download" and "This file is the same for everyone. Nothing you typed goes into
    it." The sentence about sending the resource once is unchanged on both.
  - **One label, one job, on `/`.** The chat keeps "Ask about the cohort"; the human form is
    "Write to Sunil about the cohort".
  - **The chat pill moves out of the way.** It keeps Sunil's corner. While a link, button,
    field or label sits under that corner it slides down out of view, and it comes back when
    the reader scrolls on or tabs to it. Checked while scrolling seven pages at 390 and
    1440px: while it shows, it covers no control.
  - **The closing date.** `cohort.applicationsCloseOn` is in facts.ts and is `null`, because
    nobody has decided it. Set it to an ISO date and, from the end of that day in India,
    every page served uses the handoff's evergreen line instead of the October one. Files
    built ahead of time (workbooks, blank sheets, the kit PDF) must be rebuilt then.
  - **30 live hours** is one number, in `src/data/cohort-hours.ts`, read by facts.ts and by
    `cohort-copy.ts` (which cannot import facts.ts). The literal email bodies in
    `lib/comms/templates.ts` still say 30: they are frozen by design and hashed on approval.
  - **Older leftovers:** the `--text-faint` text on paper on the memory kit, the triage kit and
    the design check is now `--text-quiet`; the design check's breadcrumb sits inside the
    page width; the closing section on tool pages is left-aligned (`tool.css`), so the
    heading no longer centres above a left-aligned button row; the run-cost model prints a
    currency symbol against the number ("₹52.78") and keeps the space after a code ("INR
    52.78").
  - **A name that cannot print whole is left off a PDF.** "सुनील 🙂 Zoë" used to print as
    "Scored by Zoë". `byLine()` in pdf-writer.ts now drops the line instead. A real fix for
    Indian scripts is not possible with pdf-lib: it does no text shaping, so even an embedded
    Devanagari font would draw conjuncts and vowel signs in the wrong places.
- [x] **8. The privacy page** (29 September). The user asked for `/privacy` to cover this
  branch's changes and five tags: Google Analytics, Microsoft Clarity, Meta CAPI, the
  LinkedIn pixel and the Apollo pixel. The same day the owner replaced Meta CAPI with the
  Meta Pixel; the page describes the pixel only.
  - The old page said "no third-party trackers", "no analytics cookies" and "no conversion
    pixels". The live site already loaded Google Analytics and Clarity through GTM, so it
    was false before this work started.
  - What production loads was recorded on 29 September with Playwright on seven pages:
    Google Analytics 4 (`G-S2XJ61GXDD`) and Microsoft Clarity (`yin1xnh55d`) on every page
    with the container, with the cookies `_ga`, `_ga_S2XJ61GXDD`, `_clck`, `_clsk` and
    Microsoft's own. **No Meta, LinkedIn or Apollo request was seen.** The page describes
    them because the owner asked; whoever adds them in GTM must make them match it.
  - **No Meta Conversions API.** The owner chose the Meta Pixel instead on 29 September.
    The page now promises that nothing goes to Meta from this site's servers and that no
    name or email reaches Meta. Adding the Conversions API later means changing that page
    first, and it would sit outside the consent banner's reach.
  - The page now also covers the download gate, the attribution kept with a submission,
    the first-party record on `/resources/` and `/tools/`, the automated assistant, the
    cohort call, the audit's local storage, the team that reads the console, transfers
    outside India, and the right to complain to the Data Protection Board.
  - **The Agent Design Check no longer loads the container** (`tagManager={false}` on
    `PracticeLayout`). It promises that nothing typed is sent anywhere, and Clarity records
    clicks.
  - The consent banner the page asked for was built in task 9.
- [x] **9. The cookie consent banner** (29 September). The user asked for it after task 8.
  - **Google Tag Manager now loads only after a yes to analytics.** The banner
    (`src/lib/consent/`, `src/components/ConsentBanner.astro`) is the container's only
    loader; `GoogleTagManager.astro` renders it, so no layout changed. The `<noscript>`
    iframe is gone: a browser without JavaScript cannot be asked.
  - Accept all, Reject all and Choose, with Accept and Reject the same size and colour.
    Choose shows two boxes: analytics (Google Analytics, Clarity) and advertising (Meta,
    LinkedIn, Apollo.io). Advertising rides inside the same container, so on its own it
    loads nothing; the banner says so.
  - The answer is one cookie, `lc_consent` (`v1.a1.m0.2026-09-29`), 180 days. A stale
    version counts as no answer. "Cookie choices" is added beside the footer's Privacy link
    on every page with the container, and /privacy has a button. Turning a category off
    deletes the tags' cookies on this domain and reloads the page.
  - A corner card, not a bar, so it does not cover the cohort page's Apply buttons on a
    laptop. On a phone it covers the hero buttons until a choice is made; the header's
    Apply stays visible.
  - Checked on `npm run dev` with every third-party request aborted: first visit, reject,
    accept, analytics only, advertising only, withdraw from the footer (tag cookies deleted,
    an unrelated cookie kept), Escape, tag-free pages, /privacy, JavaScript off and a stale
    version. 35 checks, 0 failures.
  - **For whoever works in the GTM console:** every advertising tag must require
    `ad_storage`, and Clarity should require `analytics_storage`. Until that is done,
    somebody who allows analytics but not advertising would still get an advertising tag,
    if one is added. There are none in the container today.
  - Not built: a server-side record of each consent. The Act puts the burden of proving
    consent on the fiduciary; today the only record is the visitor's own cookie.
- [x] **10. Plain green on `/` as well** (29 September). Commit `604f012` put an ivory-cloth
  photograph Sunil supplied where `/` drew the green linen (the price panel, the footer and
  the chat's small marks). The user then asked for those surfaces to be plain green. The
  cloth is reverted and the plain-green rule in `theme.css` now covers `/` too, so no page
  draws the linen. The "Cookie choices" footer fix from that commit stays.
- [x] **11. The revised outreach handoff** (29 September). Source:
  `docs/2026-09-28_Outreach_Readiness-20260929T094812Z-1-001/` in the main checkout,
  `04-website-Ein-handoff.html`, `public-copy/website/*.md`, `website-cta-audit.csv` and
  `05-email-and-resource-routing.html`. **Not committed**, like the first package.
  - *Page copy.* The package's heading, lead and button on `/`, `/programmes`,
    `/programmes/enterprise`, `/resources`, `/tools`, `/resources/guides`,
    `/resources/templates`, `/about`, `/advisory`, the application section on `/` and the
    application's saved panel. Figures come from facts.ts (`practitioner.yearsExperience = 26`
    is new). Where the package's label would be wrong it was kept as it was, and the page
    says why in a comment: `/programmes` compares three routes, so it is not labelled "The
    Living Craft cohort", and the apply section holds the team route too.
  - **One tension, flagged not resolved.** The home button is now "Explore the October
    cohort" (the package's words), where CLAUDE.md says the cohort CTA is Apply. The header,
    the price card and the form still say Apply. Sunil's call.
  - *After the useful result.* `ResultCohortNote.astro` under the result of the nine tools
    and the design check, shown only once the result is complete. It is the package's
    sentence with a topic for memory, cost, authority and triage (`usefulResultFor()`). On
    the kits, guides, templates and worksheets the page IS the result, so the closing row's
    line is that sentence with the facts (`<ClosingCta result>`), not a second line.
  - *The question.* "How did you first hear about The Living Craft?" is a choice with the
    package's seven answers plus an optional line, on all three routes. Stored as
    `attributions.self_reported` (a code) and `self_reported_detail`, apart from the tags.
  - *Attribution through the form.* With an analytics yes, the browser writes `lc_first`
    and `lc_last` on the page where a visitor arrives, and the server reads them with the
    form. Without it, nothing changes. Unit tests in `src/lib/pipeline/attribution.test.ts`.
    **The banner now asks on the tool pages too** (`<ConsentBanner ask />`), and a yes still
    loads no tag there: an arrival on a tool could not be remembered otherwise.
  - *Events.* The seven names, a unique `event_id`, and `env` and the banner answer added
    by the server. The console funnel reads them. Two leftovers found and fixed on the way:
    `form_error` and `owner_notified` were sent by the form and dropped by `/api/track`
    since 10 September, and the funnel's "Submitted it" read `apply_submit`, which the
    cohort form never sends.
  - *Footer.* The package's programme summary and two routes, in the three core footers.
  - *Found and made true:* the tools hub, the templates hub and the Rework Cost Check still
    said nothing asked for an address. Every download has asked since 19 September.
  - **Schema:** three columns on `attributions`, two on `resource_requests`, one unique
    index on `events`. Additive. The code works before it is run: the old save function
    ignores the new keys, and the console reads attribution with `select('*')`.
  - Checked on `npm run dev`, every third-party request aborted: 64 browser checks, 0
    failures (copy at 1440 and 390px, the footers, the banner and both cookies on a tool,
    the posted form with a fake server, a 503 with no thank-you, the POC tool's events and
    line, the quiz, the gate's delivery event, the design check). The earlier consent run
    now fails its two "no banner on a tool page" checks, which is this change. `astro
    check` 0 errors, `npm test` 105/105, `npm run build` passes.
  - **Not done, and why.** The nurture workflow, the preference and unsubscribe pages, the
    marketing tick on the download gate and the new email copy: the package defers them
    (SYNC-12) and the wording is a draft for Sunil. The application receipt email keeps its
    approved 10 September words, which already promise no offer. `/caio`, `/assessment`,
    `/latest` and `/contact` rows: outside the core journeys. The package's page layout
    (the three-step diagram beside every hero, 18–20px body) was not adopted: V5 is Sunil's
    source of truth for the look, and the package's own design rules (ivory hero, solid
    green footer, no fabric behind copy) already hold. Cohort links on the reading pages
    that `/api/track` does not cover (`/about`, `/programmes`, the hubs) reach Google
    Analytics with consent, and the first-party log only on `/`, `/resources/*` and
    `/tools/*`, as the privacy page says.

- [x] **12. UI/UX pass over every public page** (29 September). The user asked for a
  thorough desktop, tablet and phone review with fixes. 41 pages were captured at 1440,
  1024, 768 and 390px (1,248 slices, 30 interactive states) and measured at six widths
  (overflow, targets, contrast, text size, line length, headings, focus). A parallel
  review workflow failed on a session limit, so the review was done directly.
  - Fixed: a branded 404 page (`src/pages/404.astro`; production showed Astro's dark
    default); the design check's questions sat half outside their cards (a fieldset
    draws its first legend on its edge); contents lists and bullets on /privacy and
    /terms; 44px touch targets on the tools for touch screens only (`tool.css`,
    `pointer: coarse`); full-width rule and step names on phones in the rule audit and
    the authority review; less nested padding in the POC and model selection tools on
    phones; 11px labels raised to 12px; the longest lines shortened (/latest, the
    authority review, the rework check, the templates); the hub's question rows stacked
    below 900px; no orphaned separator dots in the worksheet and template link lists; a
    "swipe sideways" note over the memory kit's wide tables; the chat pill moves away
    from a form's error line.
  - Checked by an element-by-element dump of all 41 pages at four widths, before and
    after: `/` did not change.
  - Left alone on purpose: `/`'s hero buttons and footer on a phone (the V5 package's
    choice); `--measure-prose` (65ch gives about 90 characters a line in Figtree, which
    is long but site-wide).

- [x] **13. Internal wording removed from the public pages** (29 September). The owner:
  "internal wordings. These should not be anywhere on the website". A text scan of every
  page (all 39 in the sitemap, plus the 404 page) found and removed:
  - "Written 11 September 2026. Pending Sunil's factual approval" and its variants on
    /about, /programmes, /programmes/enterprise, /advisory, /contact,
    /communication-preferences and /tools.
  - The "Facts this page is waiting on" asides, with owner notes such as "Sunil to
    approve", "The owner to decide" and "Sunil and Alchemy", on the same pages.
  - "Reviewed by: Not yet reviewed" on the four guides, four templates, three worksheets
    and /toolkit. A reviewer appears again once `reviewedBy` is set.
  - Planning notes ("further clusters are planned", "nothing is listed here before it is
    written", "briefs at this stage") on /resources, the guides and templates indexes and
    /toolkit, and /tools' whole "Not published" section about an unbuilt second tool.
  - "None has been agreed", "under discussion" and "pending a verified sending domain"
    sentences on /advisory, /contact, /programmes/enterprise and /privacy.
  - **Rule from now on:** approval status, owner to-dos and plans go in code comments or
    in this file, never in rendered copy.

- [x] **14. One shared footer on every public page** (29 September). The footer review
  of 29 September: "one shared footer on every page. Same labels, order and
  destinations." Seven layouts drew seven footers; now every public layout renders
  `SiteFooter.astro`. Three columns, from the review's table: Learning (cohort overview,
  Apply, Learning for teams), Explore (Resources, Try the tools, Field notes), About &
  contact (About Sunil, Advisory, the address, LinkedIn). One sentence under the mark:
  "Practical learning in agentic systems and architecture." One bottom strip:
  © · Privacy · Terms · Email preferences, plus the consent script's "Cookie choices".
  - **The white tile is gone, and the name is text.** The lockup's lettering is dark ink
    and cannot sit on forest; recolouring the artwork is forbidden. The footer shows the
    mark on its own small paper (Logo.astro) beside "The Living Craft" in ivory serif.
    Every header still draws the full lockup.
  - **The band was already solid green** (25 September); nothing changed there.
  - **Task 12's footer summary (FooterSummary.astro) is superseded and deleted.** The
    Apply link keeps `data-cta-placement="footer"`, so the handoff's footer CTA event
    still fires.
  - Tablet: the brand block across the top and the three columns under it. Phone: one
    column, links padded to 38px targets, the strip as a list. The footer keeps 100px
    clear at the bottom on a page with the floating chat pill.
  - Not touched: `/craft`, the console and `/book/[id]`, which are gated or private.
- [x] **17. Resource follow-ups: the drip, built on stage 4** (30 September). The brief:
  capture name, email, role, resource, consent and source; send the resource at once; from
  day 2 recommend other resources, never the one asked for or one already sent; stop on
  exhaustion, unsubscribe, withdrawn consent, bounce or complaint. What landed:
  - **The gate** has an unticked marketing box (the `mkt-2026-09-10` wording, reused; Sunil
    to confirm it on this surface). Ticked, it writes a `consents` row (source
    `resource-gate`) and opens a `comms_sequences` row with route `resource`. Unticked, only
    the resource goes. `people.role_code` holds the stable role code beside the label.
  - **The planner** (`src/lib/comms/drip.ts`, pure) runs one step ahead of the existing
    sweep: it leases a due sequence, picks the next resource from the catalogue
    (`src/data/resource-routing.ts`, the package's matrix as data), queues one message under
    `drip:<sequence>:<step>`, records it in `comms_drip_sends`, and sets the next slot.
    The sweep then sends it through every existing gate. Two workers at once cannot
    double-send: the lease and the idempotency key are both in the database.
  - **The worker** is `GET|POST /api/comms/worker` with a bearer secret. `vercel.json`
    cron (production only, every ten minutes); `.github/workflows/comms-worker.yml` for the
    staging preview (needs `COMMS_WORKER_URL` and `COMMS_WORKER_SECRET` as repo secrets).
  - **The provider seam is filled**: `src/lib/comms/providers/resend.ts` behind
    `COMMS_PROVIDER=resend`, with `Idempotency-Key` and RFC 8058 headers. The webhook is
    `/api/comms/webhook/resend`, signature-verified, de-duplicated, one-way tolerant; a hard
    bounce or complaint suppresses for everything and stops the sequence.
  - **Retries now happen.** Until today a failed message got `next_attempt_at` and could
    never return to the queue. The schema's one-way rule has a second door
    (`sending → queued` with a back-off and a reason), bounded at five attempts.
  - **The email as sent** is the approved text plus the footer appended at dispatch
    (`html.ts`): identity, contact, postal address, preferences link, signed unsubscribe.
    No link, no send. The HTML part is a rendering of the same words.
  - **Console**: a *Resource follow-ups* section on `/craft/admin/comms`: every sequence
    with the person, role, resource, sends, next send, state in the brief's words, failures;
    the 23 wordings with approve/revoke; "Run the follow-ups".
  - **Tests**: 34 new, `npm test` 146 pass. Selection, DST, planner with the memory store,
    concurrency, retry plan, provider outcomes, webhook signature, tokens, rendering.
  - **Not decided by us, all placeholders** (`.env.example`, `src/lib/comms/README.md`):
    the provider (D2), from-address, sending domain, reply mailbox, postal address, the
    interval after day 2 (`COMMS_DRIP_INTERVAL_DAYS`, default 3), the role affinities per
    module (proposed in data), the 18 module bodies assembled from the register (unapproved),
    double opt-in (not built), open tracking (off), the unsubscribe confirmation email (off).
  - **Schema, run before deploying:** `people.role_code`, a new `resource_request_submit()`
    signature (the eleven-argument one is dropped), four columns on `comms_sequences`,
    `comms_drip_sends`, three `comms_events` types, the retry door.
- [x] **16. A role question on every form that asks for a name and an email** (29
  September). Sunil: "Wherever currently name and email are being asked for, ask for role
  there also", with ten options and a way to type one. One list
  (`src/data/audience-roles.ts`), one component (`src/components/RoleField.astro`): a
  select, and a text box that opens on "Other". The typed words are copied into the select
  as a hidden option, so every form posts one `role` value however it reads its fields.
  Where it is asked: the application, enquiry and enterprise routes (the `role` field is
  now a `choice` with `freeText`), the download gate (a third field, required; this
  reverses the "two fields and no more" note in `resources.ts`), the CAIO and assessment
  enquiry forms, and the booking widget. Not the chat handoff: the agent asks in
  conversation, not with a form.
  - **Schema, run before deploying:** `resource_request_submit()` gained `p_role`. A new
    parameter is a new signature, so `schema.sql` drops the ten-argument function first.
    The `resource_requests_marketing` view gained `role` as its last column, and the
    requests page and the CSV export read it.
  - Also fixed on the way: `/tools` had no space between its last section and the
    footer. Its sections had no vertical padding at all; the "Written …" line removed in
    task 13 had been the only thing holding the footer off.
  - **How it landed (30 September).** The change was found in the worktree, uncommitted,
    written the evening before and not by the session that committed it. It was read line by
    line, driven in a browser (the gate on a worksheet at 1440 and 390, the application
    form, the CAIO form, the booking widget's who step) and committed with two additions:
    the booking widget's who step now checks the role beside the name and the email (the
    form is `novalidate`, so the select's `required` alone let an empty role post), and
    every public sentence that said a download asks for "a name and an email address" now
    says "a name, a role and an email address": `/privacy`, `/resources`, `/toolkit`,
    `/tools`, the design check, the templates index, five resource pages and the format
    lines in `src/data/resources.ts`.
- [x] **15. The "Pause motion" control is gone** (29 September). Sunil: "let the motion
  always be there. Remove pause motion option." The button, its script branch and its
  styles are removed. The OS reduced-motion setting still stops the brain and the
  drawings, because that is a system accessibility setting, not a site control. Known
  cost: WCAG 2.2.2 asks for an on-page pause for a loop longer than five seconds, and
  the page no longer has one.

---

## Week 2 rebuilt against the generation prompt — 30 September

Sunil asked for week 2 to be revisited against
[`docs/teaching/generation-prompt.md`](../teaching/generation-prompt.md). **Four topics now,
in the prompt's six-part shape, and the prompt's fixed close.** This replaces the morning's
eight-topic resequence. Week 2 has not been taught yet (no `startsAt`), so no stored rating
or checkpoint answer is keyed to a moved offset.

| Topic | Clock | Made from |
|---|---|---|
| 1 · Guardrails and policy enforcement | 00:15–01:39 | the old topics 0 and 1 |
| 2 · Human-in-the-loop (HITL) approval | 01:44–02:34 | the old topic 2, plus the two-mistakes reading |
| 3 · Idempotency | 02:34–03:13 | the old topic 3 |
| 4 · Red-teaming | 03:18–04:05 | the judge, then the adversary round |
| The close | 04:05–05:00 | recall, teardown, quiz, spoken takeaway, second rating |

**What was cut from the room, and why:** governance as a topic (its five questions are now the
teardown at 04:15, which builds one policy-table row on the board), "who is allowed to say
what a system may do" (11 minutes, week 6 owns it), the in-room policy-table draft and its
peer review (20 minutes, the table is the assignment), and "the two mistakes" as a segment
(7 minutes, it is reading at 02:24). Each topic gained a four-minute quiz and a written
takeaway. The full table is at the top of `notes/week-2-guardrails.md`.

**Four things worth knowing.**

- **Week 2 is generated now.** `scripts/teaching-content/week-2.mjs` is new, ported from the
  stored pages. The HTML in `docs/teaching/pages/` is build output, and `check:pages` now
  compares it for week 2 as well.
- **The generator gained opt-in six-part slots**, agreed with the week 3 session so both weeks
  fill the same fields. Weeks without `week.shape = 'six-part'` build byte-identical; week 1
  was checked.
- **`pair:` is gone from week 2's session file**, so `/craft/pair` opens nothing for week 2.
  The session body shrank from about 1,000 lines to a short guide, because it was a second,
  stale copy of the pages. The page still renders outcomes, pre-work, the day, after-work and
  reading from the frontmatter.
- **Topic URLs changed.** `/craft/week-2/topic-1` to `topic-4` exist. `topic-0` and `topic-5`
  to `topic-7` now 404.

**Verified.** Build passes the six-part checks. `check:teaching --by-topic --topics=4` passes
9 of 9. `check:pages` passes for weeks 1 to 3. A one-off script comparing the clock, the
session file, the notes headings, the quiz bank and the module found zero differences. The
real quiz parser reads all 22 items, and the four on the check page are servable. `astro
check` has 0 errors and `npm test` passes 85 of 85. Not checked: the pages behind the login on
a dev server, because that needs a seat code or the console password.

**Revised again the same afternoon against the topics learners expect from a guardrails
class** (Sunil's list: three execution planes, in-band against out-of-band, a tiered gateway,
latency budgets, false-positive tuning, audit logs without personal data, named tools). Net
zero on the clock: the 01:09 read-out folded into the lab's check step, the lab gained a
timer, 03:18 became "Layered defence: the tiered gateway, and its latency tax", and teardown
question 4 became a latency budget. Prompt injection, PII leakage and groundedness are named
in a threat table at 00:37 and point to weeks 3 and 4, which `threads.md` gives them.
`threads.md` now records guardrail latency as week 2's. **Vendor latency figures are
deliberately not printed as fact**; the pages give orders of magnitude and have each learner
measure their own.

**Remapped to the learners' guardrail list, same evening.** The pages now use its terms: input, output and operational/system guardrails with the checks it names; in-band (synchronous blocking) with its latency tax; out-of-band; the tiered gateway pattern; latency budgeting; false-positive rates and refusal fatigue; anonymised audit logging; and every tool it names, including TypeChat and Guardrails AI's RAIL spec. Its latency ranges are printed, labelled "ranges the field quotes", beside each learner's own measured number. No change to the clock's times.

**Still open, and it blocks the day.** `make w2-paid-once` and the three queue fixtures do not
exist in the reference agent (preparation items 1 and 2). That repo has uncommitted work from
another session, so they were not added here. Pairs are named by number because the only seat
list is the production learners table.

## schema.sql was not idempotent, and the failure looked like nothing — 29 September

Running the whole file in the SQL Editor failed on its last statement:

    ERROR: 42725: function name "public.resource_request_submit" is not unique

**Nothing applied.** A multi-statement script in the SQL Editor is one implicit
transaction, so a failure at line 3,235 rolls back all 3,235 lines. That is the
confusing part: the error names one function and the cost is the whole file.

**The cause is `create or replace function` with a changed argument list.** It only
replaces a function whose parameters match exactly. `p_kind` was added to
`resource_request_submit` in `574df78`, the download gate, so the ten-parameter
version was created *beside* the nine-parameter one already in production rather
than replacing it. Two overloads then make the bare-name
`revoke all on function public.resource_request_submit` ambiguous.

**Fixed in the file rather than by a manual step.** Both writing functions now drop
every overload of their own name immediately before the `create`, by
`oid::regprocedure`, so any argument list is covered — including one written by a
version of the file nobody has a copy of any more. Re-running is genuinely
idempotent again.

Two things worth carrying forward:

- **A `create or replace function` whose signature has changed is a silent overload,
  not a replacement.** Wherever this file grows a parameter, the guard has to grow
  with it. `pipeline_submit` carries the same guard for that reason, even though its
  signature has never changed.
- **The nine-argument function existing at all proves production has run an earlier
  version of this file.** The database is partly up to date, which matches the list
  of pending tables in `CLAUDE.md` rather than contradicting it.

---

## Week 3 rebuilt against the generation prompt — 30 September

`docs/teaching/generation-prompt.md` landed this morning and week 3 was rebuilt against it.
**The week 3 section of [`docs/teaching/README.md`](../teaching/README.md) is the fuller
record.** Week 2 was rebuilt in parallel by another session; we split the files and neither
of us committed.

**Five topics, not six.** §4 asks every topic for six parts, including a hands-on lab, an
at-enterprise-scale table with three or more named products, and a three-question quiz with
one question from an earlier week. That is 39 minutes a topic. §5's close takes 58 minutes,
so only 202 remain. The old topics 1 and 2 merged into LLM evaluation, because a case set
and a run count together are what an evaluation harness is.

**Topic titles are industry terms now**, and every one carries a question in its subtitle.

**What was cut:** the segment pointing the evaluation harness at a second model version. It
was a demonstration rather than a capability. The Model Selection Tool carries the question
instead.

**Everything in §11 and §12 passes except one item.** `build-teaching-pages.mjs` 5 topics
and 20 beats with every clock row claimed · `check:teaching --topics=5` all nine ·
`check-stored-pages` week 3 both pages · `astro check` 0 errors · the §9 cross-file clock
script **zero differences** across five sources · no banned word anywhere · no gold text ·
no instructor material on the learner page · no horizontal overflow at 375px.

**The one item not met: "Activities name real people."** §4 says to use real names from the
seat list and never invented ones. There is no seat list in the repo, and the only source is
the `learners` table in production. Weeks 1 and 2 already say "assigned by name" without
naming anybody, so week 3 keeps that convention. **Both sessions report it the same way**
rather than one of us pulling eight people's names into committed HTML.

### Four cross-week quotes were wrong within the hour, and that is a standing risk

Week 2 was rebuilt in parallel the same morning, and week 3 quotes week 1 and week 2 word
for word because CLAUDE.md requires it: *"If it refers to an earlier week, quote that week
verbatim, right above it."* When week 2 changed, four of week 3's seven quotes became false
attributions, and nothing in the repo would have caught it.

What broke, and it was found by checking rather than by noticing:

- **"Every guardrail you add moves a failure. It does not delete one."** No longer appears
  anywhere in week 2. The question that quoted it is rewritten against week 2's current
  opening, and the new version is better: it asks what this week's equivalent of "your own
  rule, working exactly as written" is, and the answer is a thin case set.
- **Week 2's fifth outcome** gained "one row of" and lost "each row". Quote corrected.
- **Week 1's four parts** are "the loop, the tool layer, **the context built for each
  step**, and the trace". Week 3 had written "the per-turn context assembly", which is the
  code's name for it and not the room's. Corrected in four files, including six places
  where week 3 used the phrase in its own prose.

Two quotes were already correct: week 2's pay-once outcome, and the fourth line of its rule
for choosing a mechanism.

**Six false quotes across the two weeks, in one morning.** Four in week 3 and two in week 2,
found only because each session went looking after the other rebuilt. Week 2's were a
reworded table cell and a paraphrase where a quote was required.

**A naive grep gives a false all-clear, and that is the trap.** Two of week 3's stale quotes
survived a first fix because the phrase was split across a wrapped line: `the per-turn` at
the end of one line and `context assembly` at the start of the next, each prefixed with
`> `. Grepping for the phrase returns zero and reads as clean. **Any checker for this has to
flatten `\n>\s*` before matching**, or it will pass exactly the cases that are broken.

**The standing risk.** Nothing checks that a verbatim quote of an earlier week still matches
that week. `check:teaching` compares two pages with each other, and the §9 script compares
one week's five files with its own clock. A quote is the one cross-week dependency the
tooling cannot see, and every week from 4 onwards will have more of them.

**A checker is about twenty lines and would have caught all six.** It extracts each quoted
passage from the module and the bank, flattens the wrapping, and greps it against the named
week's session file and stored pages. **Neither session added it, deliberately** — it is
tooling nobody asked for, and it belongs to whoever owns `check-teaching-pages.mjs`. It is
Sunil's call whether it lands before week 4.

### Two things for Sunil

- **Both pages are published**, on 30 September, and the links are in the README.
  Learner `https://claude.ai/artifact/RXQs2UDaSP9sXfFHi7BAWi` ·
  instructor `https://claude.ai/artifact/JN2LBiHmDc2sqgwNYocBLb`. Both are **private** until
  shared from each page's Share menu. Republishing the same two files keeps the same URLs.
  **Publishing is not releasing**: the week is still `status: draft` and no learner sees it
  at `/craft/week-3` until Sunil writes a `session_releases` row from the console.
- **The seat list.** If the labs and the teardown should name people, the names have to come
  from somewhere a page may quote. Say where, and both weeks can use it.

### Shared tooling, and who changed what

The other session owns `build-teaching-pages.mjs` and `check-teaching-pages.mjs` and made
every change to them; I own `ROWS_W3` and asked for four generator additions, all of which
landed. Nothing in either script is week-3-specific: every new field is optional and week 1
still builds byte-identical. **`check-stored-pages` currently reports week 2's two pages as
out of date, and that is the other session's work in flight rather than a fault.**

---

## MCP has a home, and it is week 4 — 29 September

Sunil asked where MCP should actually be covered. **Recorded as §7 of bridge 6 in
[`docs/teaching/threads.md`](../teaching/threads.md)**, which is the master plan. The
short version is below; read the bridge before writing week 4.

**MCP had not landed anywhere because it is not one topic.** It has four faces:
the protocol, tool boundary design, the boundary you did not write, and a server holding
your credentials. The first turns over every few months and `threads.md` already excludes
protocols from the seven threads. The other three do not turn over, and they are what this
audience is asked about.

**Week 4 gets a topic of about forty minutes, framed as "the boundary you did not
write".** Not "MCP security" — a room that leaves believing MCP is dangerous has been sold
a vendor deck in reverse. One beat inside it is about adoption rather than risk: when is
inheriting somebody's tool surface the right call, and what do you need from them first.

The deciding reason was load. Prompt injection is one coherent topic for five hours, so
week 4 was the lightest of the three unwritten weeks. It now has two and is still lighter
than week 5. **The cost is that injection gets roughly four blocks instead of five.**

**Three things already existed and nothing pointed at them.**

- **The Agent Failure Triage Quiz is now week 4's pre-work.** Released, twelve questions
  on one incident, and it already teaches three of the topic's takeaways: MCP adds hops,
  silence at the client says nothing about them, and `idempotentHint` declares rather than
  enforces and defaults to false. A published resource doing part of a topic for free.
- **Three of the eight field notes are MCP**, all from the 2026-07-28 spec. The one that
  matters is a governance sentence rather than a protocol one: statelessness moves MCP
  authorization to the application layer.
- **Week 1 already links one of them** in its reading, framed as a tool interface changing
  under you.

**Bridge 6 §5 was rewritten rather than left to contradict §7.** It said MCP did not need
a block, which was right about week 2 and wrong about the course. What stays in week 2 is
one question against the nine control points — which of these do you own, and which does a
vendor change under you — and it must not become about MCP. The named protocol is week 4's.

Week 4 gains `◐` on boundaries in the matrix, which was blank.

**Before week 4 is written, run `npm run gather` on the MCP topic.** Those notes date from
the July spec and `latest.json` was last refreshed on 15 August 2026. A protocol that
changed once in July can change again, and week 4 must not print a claim about a superseded
spec.

---

## The six weeks read against the industry, and five things moved — 29 September

Sunil asked for the arc to be compared with what technical architects and engineering
leaders are expected to be sound on across the field, with the current plan deliberately
set aside first. **The record of that is bridge 6 in
[`docs/teaching/threads.md`](../teaching/threads.md)**, which is the master plan for
content and topics. Read that, not this entry, before writing weeks 4 to 6.

**Ten domains came out of the comparison**: system shape, tool and interface design,
context, memory and state, retrieval, evaluation, security, cost and capacity, human
control, and governance. The arc covers eight of them well. Two were absent and three were
fragments.

**Five changes, and the first two move material between weeks.**

| Change | Where it landed |
|---|---|
| The business case moves out of week 5 | Week 6, about twenty minutes, inside the review |
| Week 5 becomes multi-agent **and memory** | `week-5.md`. CAP and capacity compress to a beat each |
| Retrieval quality gets a named home | Week 5, beside memory. It named no week before today |
| Production monitoring gets one beat | Week 4, at the close, ten minutes |
| The MCP question stays in week 2 | **Not made.** See below |

**Agent memory was the real find.** Thread 5 has always said "memory outlives a process"
and every week read that as idempotency. What a system remembers about a person between
sessions, its scope, its expiry and who may correct it, was taught nowhere — while the
practice publishes an Agent Memory Audit Kit that is twelve audit questions and seven
runnable failure tests on exactly that. Same defect the 28 September review found for
model selection. Thread 5's wording in `threads.md` changed so the next reader sees memory
named rather than implied.

**Two decisions recorded rather than changes made.**

- **Regulatory depth stays out of the cohort.** DPDP, RBI, IRDAI, SEBI, NIST AI RMF,
  ISO 42001 and the EU AI Act belong to `/caio` and `/assessment`. The cohort sells
  engineering judgement and a compliance segment would dilute both. Week 6's governance
  block stays at the level of who owns a decision.
- **Latency and the user experience of a running loop are still absent, and that is not
  decided.** Streaming, partial results, and what a person sees while a forty-second loop
  runs are real architect questions with no home in the six weeks.

### Two things that need Sunil

- **The MCP question was not added to week 2.** The change is one extra question against
  the nine control points already on screen in topic 1: *which of these do you own, and
  which does a vendor change under you?* Week 2 was released to the room the same day and
  its topic 1 pair is published, so editing the live session file would put the site and
  the Artifacts out of step mid-cohort. It is recorded as an obligation in bridge 6 §5 and
  is a two-line edit plus a rebuild of the topic 1 pair whenever he wants it.
- **`cohort-copy.ts` was not touched, and that was checked rather than assumed.** M3 still
  names multi-agent, CAP, capacity and the irreversible decisions, and all four survive as
  blocks or beats. M4 still names design, failure modes, evaluation strategy and
  governance. Memory and the business case are additive rather than a promise broken.
  **Naming memory in M3 is worth considering**, because it is a selling point currently
  given away for free.

### One thing that happened to this session's work

**The `--topics=N` flag added to `scripts/check-teaching-pages.mjs` today was swept into
another session's commit and is now on `origin/main`** as part of PR #39. Nothing was lost
and nothing broke. It is worth recording because it is the `git add -A` hazard CLAUDE.md
warns about, arriving from the other direction: an uncommitted edit belonging to work in
progress went out inside somebody else's commit message. Local `main` was fast-forwarded
to `c655186` before any of today's later edits, and that commit touched none of the files
this session holds.

---

## Week 3 is written, and the pages are generated rather than hand-built — 29 September

**`src/content/sessions/week-3.md` was a page of `[PLACEHOLDER]` and is now complete**:
five outcomes, four threads, ten-item quiz bank, eight blocks, four checkpoints, the pair
offsets, pre-work, after-work and seven reading items. `status` stays `draft` until Sunil
reads it. **Both pages are built and neither is published.**

**The week is one argument, not four topics, and that was the risk.** `threads.md` bridge 5
warned that week 3 carries four things — the false pass from week 2, evaluation, context
engineering and retrieval — and said to cut retrieval rather than compress all four. They
chain instead: retrieval makes the answer fuzzy, a fuzzy answer needs scoring, and scoring
is what lets you change what the model is shown and know whether you made it worse.

**The week's sentence:** a pass is a claim about the cases you chose, not a claim about
your system. It lands five times, and once it costs ₹2,50,000.

**All four obligations to week 3 are discharged.** Bridge 1 opens the session on last
week's terminal by name. Bridge 3 gets a drill rather than a slide, at 04:22. Bridge 5's
retrieval lands at 01:40. The 28 September resources note wanted re-qualifying against a
new model version, and it is one beat at 04:40 that does not become a model-comparison
segment.

### The pages are generated now, and that is the process change

One content module emits both pages, so the three views of a beat cannot disagree:

    scripts/build-teaching-pages.mjs     npm run build:teaching 3
    scripts/teaching-content/week-3.mjs  one entry per beat, three views each
    docs/teaching/notes/week-3-evidence.md   the argument behind it

**The build has a check `check:teaching` structurally cannot do.** It fails if a beat
claims a time the clock does not hold, and if the clock holds a teaching row no beat
covers. That is the "the clock listed nine of eleven blocks" defect, caught before a page
exists. `check:teaching` still ran and still found seven real defects on the first build,
all of them learner headings with no counterpart on the instructor page.

**Two small changes to shared tooling, both additive and both defaulting to week 2's
behaviour.** `teaching-clock.mjs` gained `ROWS_W3`, a `WEEKS` map and a `--week` flag that
defaults to 2, and `ROWS` still exports week 2's rows. `check-teaching-pages.mjs` gained
`--topics=N`, defaulting to 7. **The topic count was hard-wired to week 2's seven**, which
would have failed a correct week 3 pair and then been "fixed" by editing the number,
breaking week 2 the same day.

### The reference agent gained eight targets and its own data, and weeks 1 and 2 are byte-identical

`~/learningthelivingcraft/reference-agent`. New: `data/policy-docs.json` (seven clauses of
policy prose), `data/w3-tickets.json`, `data/w3-accounts.json`, and `src/w3_*.py`. The
Makefile rule held: a later week never changes an earlier week's target, and `make
weird-mock`, `make retry`, `make w2-guarded` and `make w2-goodwill` all still print exactly
what the published week 1 and week 2 pages show. **Nothing in that repo is committed** —
the tree already carried another session's uncommitted week 1 and 2 refinements, which were
left alone.

**Every `w3-` target is deterministic and needs no key.** The run-to-run variation is a
seeded stand-in for a model, and both pages say so in those words. It is not arbitrary
noise: the agent picks between the top two retrieved clauses and takes the second more
often the closer they scored, so the variance is interpretable and identical on eight
screens. The one live model call anywhere in the session is `make chaos` from week 1, which
the instructor page offers with its cost rather than scheduling.

**Three numbers the session turns on, and all three are from real runs.** The adversarial
case is 100% at ten runs and 75% at twenty, first failure on run eleven, ₹2,50,000 each
time. Trimming the clause text to 100 characters takes that case to 0% and ₹37,86,400. A
second profile scores 78% overall against 76% and 65% adversarial against 75%.

### Open, and needing Sunil

- **Publish both pages as Artifacts** and record the links in `docs/teaching/README.md`,
  where two lines currently say "not published yet".
- **`startsAt` is unset**, so the new live session clock on both pages is off and says so.
  It switches on with `?start=2026-10-11T09:00+05:30` in the URL. Guessing a start time
  would be inventing a fact, so nothing is defaulted.
- **Two terminals at 00:40.** `w3-falsepass` models two processes inside one program, which
  is honest and is not the same as two windows. Running it live is stronger and needs
  arranging.
- **The reference agent README lists week 1's targets only**, as it did after week 2. The
  Makefile documents `w2-` and `w3-` instead. Worth a decision rather than drift.

---

## Week 1 has a generated learner and instructor pair — 29 September

Week 1's two published pages were hand-built in August and the only thing done to them
since was the palette swap. **They are generated now**, from a content module, the same way
week 3 is.

    learner    https://claude.ai/artifact/5jKNab8RVmu9mqJUM9K1yp
    instructor https://claude.ai/artifact/1RHzfCGnNyD1oo8B8VKsiS

**Seven topics, and five of them are a rated outcome.** Topic 1 is outcome 1, topic 3 is
outcome 2, topic 2 is outcome 3, topic 4 is outcome 4, topic 5 is outcome 5. Topic 0 is the
frame — the slot week 2 added on 29 September — and topic 6 is the horizon. 29 beats, all
nine `check:teaching` rules passing.

**The block names did not change**, and that was deliberate. The session file still reads
"1 · The Concept", `threads.md` still refers to it that way, and renaming them is a content
decision rather than a format one. A topic is how the page is organised; a block is what the
day is called.

**The four drawings were lost and are back.** The August learner page carried four SVGs — the
ReAct loop, the whole system, the one-step interaction diagram, and what week 2 builds. The
first generated pair had none, because the content module was written from the session file
and a session file has never held an SVG. They are in
`scripts/teaching-content/week-1-figures.mjs` now, original artwork unchanged, each a complete
`<figure>` with its caption, and each rendered **twice** — learner page and reference card — so
the instructor is looking at the same picture the room is. `_design.mjs` gained the figure
rules; week 3 has no `<figure>`, so they are inert there.

**If a week's page loses something, look for it on the hand-built predecessor first.** The
generated pages are only as complete as the module, and the module is written from the session
file, which holds prose and frontmatter and nothing else.

### Three changes to shared machinery, and each one is proved safe

- **`scripts/teaching-content/_design.mjs` is new.** The two stylesheets and two scripts were
  literals inside `week-3.mjs`; week 1 needs the identical four. `week-3.mjs` re-exports from
  it now. **Both week 3 pages build byte-identical to before the extraction**, which is the
  regression test if anybody touches it.
- **`build-teaching-pages.mjs` had week 3's wording in the template.** "Five hours, eight
  blocks", a quiz at 04:10, "ten in the bank", "all six topics" — all wrong for week 1, which
  has five blocks, a quiz at 04:20 and a bank of fifteen. They read off `week.wording` now,
  and every default is the week 3 string, so week 3 is unchanged.
- **`ROWS_W1` is in `scripts/teaching-clock.mjs`**, 40 rows. **Two times carry two rows each**:
  01:10 is a checkpoint and a stand-up, 02:05 is a checkpoint and the break. `dayPlan()` sorts
  the checkpoint first, and the generator's opening-row exclusion is configurable now because
  week 1's opening is 00:00 and 00:08 rather than week 3's 00:00 and 00:10.

### What is still true, and what is not

**The old hand-built week 1 pair is superseded and recorded as such** in
`docs/teaching/README.md`. Do not edit it. Its learner page's share is pinned to a
pre-design-system version that only Sunil can move, so viewers were never seeing the
28 September conversion anyway. The design review and the design spec are not superseded.

**Week 2 still has no generated pair.** Its seven topic pairs and its collated pair are all
hand-built, and its session file was restructured on 28 September into eight blocks and three
cycles, so **all five of its published Artifacts are against the old clock.** A `week-2.mjs`
would close that and is not done.

**Nothing is committed.** The tree carries another session's week 3 work — `week-3.mjs`,
`build-teaching-pages.mjs`, the quiz bank, the notes file, `package.json` and `.gitignore` —
and week 1's changes are mixed in with it. Stage by path.

## Week 1's session file is on week 2's format — 29 September

`src/content/sessions/week-1.md` was written before week 2 existed and carried an older
shape. It now follows the same contract week 2 follows. **Nothing about what week 1 teaches
changed.** The clock, the four checkpoints, the five outcomes, the quiz ids and the four
runs are all the ones that were there before.

**Six format changes, and the first two are the ones that mattered.**

- **Every beat now carries its own time, its participants and its duration** —
  `*00:23 · Whole room, 8 minutes. Answer in chat first, 30 seconds.*`, 37 of them. Week 1
  had nine such lines and all nine were block-level. The teaching standard asks an activity
  to state its own duration and say who does it, and a room of eight given an unassigned
  prompt goes quiet.
- **The `## Opening` section did not exist.** `runOfShow` has declared an opening at 00:00
  since the file was written and the page rendered nothing for it, so the first rating and
  the four retrieval questions were on the instructor script only. Both are now on the
  learner page.
- **Four checkpoints now open with `**You can now…**`**, the week 2 wording, instead of four
  different instruction sentences.
- **Two sections were added above the outcomes**, matching week 2's *Why an agent needs
  these* and *The six kinds*: **Why you draw the map before you fix anything** and **The
  four parts**. The four-parts table maps part → what it holds → what goes wrong → which
  week owns it. Week 2 states its concept at the top of the page and still builds the
  taxonomy from the room at 00:37; week 1 now does the same, and block 1 still says "build
  it from the room rather than reading it".
- **The five outcomes carry their thread label**, as week 2's do. And prevention is now
  named as deliberately absent, the way week 2 names evaluation as deliberately absent.
- **The drills are `###` beats with the decide → build → review shape printed above them.**
  That shape was in the instructor script at 02:20 and on no learner surface. Drill 4 is
  marked *Homework, not run in the room* where it used to sit unmarked between drills 3 and
  the bake-off.

**Three real defects fell out of the pass, and all three are fixed.**

- **`pair.reviewAt` was `04:05` and the arithmetic never supported it.** The draft opens at
  03:50 and runs twelve minutes, so the swap is at 04:02, which is what
  `week-1-script.md` has run all along. Three surfaces read that offset.
- **The body's Reading list held four of the seven entries in the frontmatter.** The three
  resources added on 28 September — the design guide, the Agent Authority Review, the tool
  permissions guide — were in the frontmatter and invisible to anybody reading the page.
- **Two beats were in the wrong order against the clock.** The `expected` grep ran at 02:02
  in the script and sat inside *The pattern* at 01:44 on the page, and *the split* ran at
  01:03 and sat inside *Inside one step* at 00:46. Both moved to their clock positions,
  which is the rule the 28 September reordering established.

**Two things I deliberately did not change, and both are judgement calls to overrule if you
disagree:**

- **The block names.** They are still The Concept, The Problem, The Drill, The Teardown, The
  Horizon. Week 2's are descriptive — *Cycle A · The limit* — and these are not. But they
  are the six-part shape from `CLAUDE.md`, they are in `threads.md` and in the four published
  week 1 artifacts, and renaming them is a content decision rather than a format one. Each
  block instead gained the framing paragraph week 2's blocks carry, which poses the questions
  that block answers.
- **The four checkpoint offsets.** `01:10 / 02:05 / 03:20 / 04:15` are unchanged. The
  instructor script reads them at `01:05 / 02:05 / 03:15 / 04:15`, two to five minutes
  earlier, which is week 2's convention. `CLAUDE.md` names 01:10 as the worked example of a
  checkpoint sorting before a stand-up at the same offset, so moving them makes a documented
  example wrong for two minutes of consistency.

**The four published week 1 artifacts are now behind the session file** — the same situation
week 2's five pages were in on 28 September. The learner page has no Opening section, no beat
timings and four of seven reading entries, and the instructor page still has the swap at
04:05. They were not rebuilt in this pass. `npm run check:teaching` cannot see any of it,
because it compares a pair against each other and not against the session file.

`npx astro check` is 0 errors and `npm run build` is clean.

## Week 2 has a topic 0, and the preparation list is actionable — 29 September

Sunil reviewed week 2 and raised two things. Both were real and both are fixed.

**1 · "What to Prepare" was not understandable.** It is the `#prep` card on the collated
instructor page. It held four noun phrases — "the `w2-` sqlite path", "three prepared queue
states", "ticket #8812 does not exist", "a blank seven-column policy table". Those name gaps,
not tasks. None said where the file goes, how big it is, how you know it is done, or what
breaks without it.

It is now **eleven items in four groups**: what blocks the session, what needs a decision
either way, what is small and buys back minutes, and what you do in the hour before. Each
carries the action, the file, the size, the done-test and the cost of skipping it. Three
items are new and were on no list anywhere: **pick the two decision records for 00:15,
assign the adversary pairs for 03:25 by name, and pick the 01:09 screen while circulating.**
Those three have no file, so nothing was tracking them, and each one kills a beat outright.
The source is `docs/teaching/notes/week-2-guardrails.md`, section *What to prepare, and by
when*.

**2 · The limit topic opened abruptly, and the cause was mechanical.** Block 1's three
framing beats — 00:15 the policy-versus-wish exercise, 00:31 the three properties, 00:37 the
six kinds — are labelled **"shared"** in `scripts/teaching-clock.mjs`. "Shared" means they
belong to no topic, so when the six topic pages were built in September they landed on none
of the six. **The six-kinds table and the three-properties rubric were on no published
learner page at all.** Topic 1's page opened with "put a limit outside the function it
constrains" and no definition of a guardrail above it.

Fixed by adding **topic 0, the frame**, numbered 0 so no published link or `whose` label
changes.

    topic 0 · learner    https://claude.ai/artifact/EmG3hc16xvDeQEyEdoSxHh
    topic 0 · instructor https://claude.ai/artifact/1v7vwMJxPL376pNBE1ev2Z

Four things about it worth knowing before touching week 2 again:

- **Nothing on the clock moved.** The same three beats run at the same three times, for the
  same nineteen minutes. `ROWS` in `teaching-clock.mjs` is unchanged, so the other twelve
  published pages did not drift. Topic 0's page marks its three rows with the standard
  `mine` set. Relabelling them "topic 0" would cost a twelve-page regenerate for a word
  nobody reads.
- **Why an agent needs a guardrail was genuinely missing** from every week 2 surface. It is
  now three rows — no call site, no path until it runs, no repeatability — and it is
  **reading on the learner page plus one spoken sentence at 00:37**, not a new beat. Block 1
  has no spare minutes and the house rule is cut rather than compress. If it should be live,
  something has to come out.
- **The order was not changed, on purpose.** Topic 1's working demo at 00:23 still sits
  between beat one and beat two of topic 0. The room judges a refusal with no rubric, then
  gets the rubric at 00:31. Putting the taxonomy first makes it a lecture and breaks
  prediction-before-reveal.
- **Week 2's first two diagrams and its only named-products card are on topic 0.** Six kinds
  on one request path, and ordinary code beside an agent writing to the same ledger. The
  enterprise card names four options per slot with costs and no recommendation: OPA, Verified
  Permissions, LaunchDarkly, a JSON file; Temporal, Step Functions, the maker-checker screen
  in Finacle or FLEXCUBE, a pending table; NeMo Guardrails, Guardrails AI, Bedrock Guardrails,
  Azure AI Content Safety.

**`check:teaching` changed in two places and both are load-bearing.** The by-topic check
counts **seven** collapsible topics, not six. And `LOGISTICS_PATTERNS` gained three exact
titles for topic 0's out-of-clock reading cards. Exact titles rather than a loose pattern, so
a real beat that loses its clock row still fails.

**Still open on week 2, and unchanged by this:** the `w2-` sqlite path for 02:55 blocks the
day, and the three queue-state fixtures for 02:00 block the 02:20 debrief for anybody whose
gate broke.

---

## Every published teaching page is on design system v1, and week 1 has its own title — 28 September

Five Artifacts were still on the black, ember and sun palette after the two week 2 sheets
were done. All five are converted now, so no learner-facing page is on the retired system.

| Page | What changed |
| --- | --- |
| Week 2 topic 1, instructor | Tokens only |
| Week 2 topic 1, learner | Tokens only |
| Week 2 topic 2, learner | Tokens only |
| Week 2 topic 2, instructor | Tokens only |
| Week 1, learner | Tokens, plus the title |

**The conversion is a script, not a hand edit** —
`swap.py` in the session scratchpad holds the whole mapping and prints what it did not
recognise. Three things it does that a find-and-replace would get wrong, and any future
page needs the same three:

- **`--ink-3` is the on-dark muted colour and some pages use it on paper.** Mapped to
  `#C6D4C8`, it is about 1.4:1 on `--paper-1` and the hidden amount marker on every failure
  card disappears. Those uses go to `#758279`, the control line.
- **The heading rule split in two.** `h1, h2, h3, h4` at weight 800 became `h1, h2` in
  Source Serif 4 at 400 plus `h3, h4` in Figtree at 700. Dropping h3 and h4 from the rule
  without writing a second one also drops `margin: 0`, which returns the browser's default
  margins and breaks every card.
- **`--sun` is forest green now, so ink text on it is about 1.2:1.** Every `summary`, jump
  link and pressed button on those pages carries `color: #F5F0E6` instead.

**Week 1's learner page was titled "The money leaves anyway" and its session is titled
"The harness".** It is now `Week 1 · The harness` in the tab and `The harness` as the h1;
the old line's promise was already the first sentence of the sub-heading, so nothing was
lost. Sunil asked for titles a learner can match to a week.

**That page is shared as "anyone with the link" and the share is pinned to the old
version.** Viewers keep seeing the pre-conversion page until the pin is moved from the
page's Share menu. Nobody but Sunil can move it.

**Weeks 1 and 2 are `status: ready`.** That is the written half of the release gate; neither
is released, because `session_releases` does not exist in production yet.

**`npm run check:teaching` is new** (`scripts/check-teaching-pages.mjs`). Eleven mechanical
checks between a learner page and its instructor page: the two clock tables byte-identical,
both pages in clock order, the run of show monotonic, every card and row present in the
clock, both instructor columns agreeing heading for heading, every learner heading present
on the instructor page, and both pages well-formed. It takes two saved HTML files. Building
week 2's pair cost four rounds of one defect — an index going stale behind the content —
and every one of those four was mechanical.

### Two things are blocked, and both are Sunil's

- **`supabase/schema.sql` has not been run and I cannot run it.** `.env.local` holds
  `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and nothing else. The service-role key
  reaches the REST API, which cannot execute DDL, and there is no Postgres connection
  string anywhere in the repo or the environment; the Supabase CLI is installed and not
  linked. Run the whole file, it is idempotent. Until then `/craft/material` shows every
  week shut and the console shows the red table banner.
- **The timetable cannot be set without real dates.** `learnerCohort.startsOn` is
  `'October 2026'`, a month. `startsAt` and `endsAt` are unset on every session file, and
  they must be full ISO 8601 with an offset because the cohort sits in three time zones.
  Nothing derives from `taughtOn`. Until weeks 1 and 2 have a date, a time and an offset,
  there is no before-pulse, no checkpoint window, no knowledge check and no ADR clock.
  Inventing them is inventing a fact.

**`src/content/sessions/week-2.md` is being rewritten in parallel and is uncommitted.** The
day is now eight blocks and three cycles (A the limit, B maker-checker, C pay once) where it
was five topics, and the clock moved: the four checkpoints are `00:46 / 02:02 / 03:18 /
04:19`, not `01:02 / 01:59 / 03:20 / 04:15`. **The five published week 2 Artifacts are all
built against the old clock and now disagree with the session file.** They were not touched
beyond the palette, because the restructure is a content decision and not mine to finish.

## Curriculum aligned to the resources, and week 2 wired up — 28 September

Sunil asked for a review of the published curriculum against the topics on `/resources`,
then for the changes. Ten tools in two series, three toolkit worksheets, four guides and
four templates on one side; four modules and six weeks on the other. **No session
referenced any of the 22 resources.** Week 2's reading list pointed at Open Policy Agent
and the Google SRE book and not at the Rule Placement Audit, which is week 2 topic 1's
exact subject.

**What changed in the curriculum**

- **Week 2's frontmatter was nearly empty and is now complete** — outcomes, threads, quiz,
  runOfShow, checkpoints, pair, prework, assignment, after, reading. It was fully written in
  prose and invisible to every instrument: no pulse, no checkpoints, no check, nothing in
  session mode, and `assignment: "TBD"` meant no ADR unlocked. That was the single biggest
  gap on the learner side and it is closed.
- **`docs/teaching/quiz/week-2.md`** — eight items in the bank's authored format, three with
  keyed options. All eight are asked, unlike week 1 where the bank holds fifteen and the
  check asks four, because all eight of these stand on a page with a Submit button.
- **M2's public copy said "multi-agent orchestration" for weeks 2–4** and the 8 September
  decision had moved it to week 5, which is M3. Moved in `cohort-copy.ts`, so the page, the
  JSON-LD Course node, `/api/facts` and `/llms.txt` all corrected at once.
- **Week 0 gained the question the course never asked** — does this need an agent at all?
  It is decision 1 of our own six-decisions guide and the course started at decision 2.
  Pre-work, using the POC Selection Tool and the workflow-or-agent guide, so it costs no
  live minutes.
- **Week 1 drill 2 now maps its three tool grades onto the Agent Authority Review's four
  undo-cost levels.** Two published surfaces were running two scales for one judgment.
- **Weeks 3 and 5 carry a note each** for whoever writes them: week 3 owes re-qualifying
  against a new model version, which is where the Model Selection Tool belongs without
  breaking `threads.md`'s deliberate exclusion of model choice; week 5 owes the business
  case, one beat, because M3 already owns cost under load.
- Week 1 and week 2 reading lists now name six of our own resources.

**Still not in the curriculum, and that is the recommendation:** rework cost and model
selection stay tools only. Publishing a tool is not a promise to teach it, as long as no
module copy implies otherwise.

## Release a week to the room from the console — 28 September

**`session_releases`, and it needs `supabase/schema.sql` run before the next deploy.**
One row per released week, `week` as the primary key so releasing twice is a no-op.

The gate is two conditions and only one of them is data: a week opens to a learner when it
is **written** (`status: ready`, a commit) **and released** (a row, a button). Either alone
is wrong — released but unwritten shows somebody who paid a page of `[PLACEHOLDER]`;
written but unreleased hands week 4 to the room during week 2 and spends four sessions of
prediction-before-reveal in advance. The rule is `src/lib/craft/release.ts` so the learner
page, the week page and the console cannot disagree.

**When the table is not answering the whole course reads as shut**, which is the opposite of
every other query here and is deliberate: an unreachable table must not open material Sunil
has not taught. It is in the health probe list, so the console shows the red banner.

New surfaces:

- **`/craft/material`** — the learner tab. Every week, open or shut, with the outcomes, the
  block count, the checkpoints, the check and the assignment visible before you click. A
  shut week shows its title and why it is shut, never its outcomes or its body. In the nav
  rail as **Material**, and named in the tour spine.
- **`/craft/admin/sessions`** grew a release control per week, and it refuses to enable for a
  week that is not written.
- **`/craft/admin/teaching`** — the instructor page. All seven weeks in full, the quiz bank
  WITH every key and distractor rationale, and the facilitation notes read from
  `docs/teaching/notes` at request time, the same mechanism the quiz bank already uses. It
  is under `/craft/admin`, so the console cookie gates it and a seat code cannot open it.

**And the two published week 2 Artifacts were rebuilt on design system v1.** They were still
on the black, ember and sun palette: forest now, ivory ground, Source Serif 4 for h1 and h2,
6px and 12px radii, a 1px line instead of a shadow. Every colour pair contrast-checked.

## How a guardrail decides — a new topic note — 28 September

**New: [`docs/teaching/notes/guardrail-patterns.md`](../teaching/notes/guardrail-patterns.md).**
Week 2 builds four controls and every one is a predicate in code. That is the right
default and the session never says so, because nothing contrasts with it. The note is the
contrast: five pattern families, the nine control points, and a five-line rule for
choosing between them. It answers the question the room asks at 02:40 while writing an
`if` — why not just ask a model whether this credit looks reasonable?

The real gap it closes is **model-based checkers**, which week 2 does not cover at all.
LLM-as-judge, classifier guards, critic loops and the grounded verifier. Four points on
judges: it is a detective control and may not authorise a payment; it is not independent
of its input, so two models reading one hostile field are one control; an uncalibrated
judge needs an agreement rate and nobody has one; and it drifts when the provider ships an
update while every test still passes.

It duplicates nothing. Maker-checker, the six pieces of a gate and the unique-constraint
argument are already in `week-2-guardrails.md` and the note points at them. Checked
mechanically, zero shared sentences. `/craft/admin/teaching` matches notes to weeks by a
`week N` reference in the first 900 characters, so it attaches to week 2 and to no other.

**The learner and instructor pages were updated to match, and the clock did not move.**
The third of the "three things not to fix today" at 03:15 used to read *"a second agent to
approve the first one. Week 5."* — six words and a week number for the thing this room is
most likely to go and build between sessions. It now carries the judge argument in full on
the learner page, with ticket #8812 asking ₹90,000 because its text claims finance
pre-approved it. **The block stays at five minutes**, using component 5's device: one
sentence out loud, then point at the page. The argument is reading, not a beat.

The instructor card gained the sentence to say and one distinction the old line collapsed.
A model judging one value against a rubric is a scorer, and whether a scorer is any good is
a measurement, so that is week 3. A second agent with its own loop approving the first is
orchestration, so that is week 5. The old bullet sent both to week 5.

**The note maps onto the resource shelf, and closed one gap in week 2's reading.** Six of
the thirteen resources and four guides are this material in public form, and the note says
which family each serves. *Who may call the tool*
([`src/content/guides/tool-permissions.md`](../../src/content/guides/tool-permissions.md))
is drill 1 argued in prose and was not on week 2's reading list, so it is now, making seven
items against a heading in the notes that still said four. *What to do with uncertain
evidence* was already there and its note named only the 01:15 confidence card; the same
guide answers the 03:15 judge bullet, so the note now names both. The evaluation-gates
worksheet is judge calibration and stays with week 3. The Rework Cost Check, Model
Selection Tool, Run-Cost Model, Cost-Ceiling Workbook and POC Selection Tool are named as
deliberately not taught here, because publishing a tool is not a promise to teach it.

**A correction worth recording, because it would cost the next session the same hour.** An
earlier draft of the patterns note proposed a fifteen-minute beat at 03:05, traded against
drill 5. That trade does not exist: drill 5 is after-work and frees no live minutes. The
drill block from 02:20 to 03:20 is full, and anything added there comes out of drill 2,
drill 3 or the checkpoint. The note now says so.

## Week 2 rebuilt into build-break cycles — 28 September

**The redesign the entry above said was not applied has now been applied.** Sunil asked
for it after the collision list was put in front of him. The old five-block version is
intact at `cb26654` if you want to compare, and `git show cb26654:src/content/sessions/week-2.md`
is the fastest way to read it.

**A note on where this landed.** It was started on a branch `teaching/week-2-redesign` off
`cb26654`. While it was being written, the working tree was moved to
`feat/curriculum-and-material-gate` from another session, which added the quiz bank, the
teaching console and `check:teaching` on top of `cb26654`. This work depends on all three,
so it was committed there rather than on the now-stale redesign branch. That branch can be
deleted.

**The shape.** Eight blocks and three build-break cycles instead of five blocks and one
sixty-minute drill block. Keyboards are live at **00:57 instead of 02:20**. Each cycle
builds a control and breaks it in the same hour, on the learner's own code.

**The new material.** A sealed prediction at 00:10 opened at 03:52. A three-property
rubric (locatable, readable, observable) that carries the whole day and forces a counter
onto every build. Nine control points replacing a three-way show of hands. A 15-minute
block on model-based checkers. And **the adversary round at 03:25**, where assigned pairs
try to get ₹5,000 out of each other's guard, which is the only beat in six weeks where a
participant's work is tested by a peer in real time.

**What was cut, and it is stated in both files rather than left quiet.** The five teardown
questions became columns three, six and seven of a seven-column policy table plus three
lines of the 04:19 checkpoint; their answer keys are kept as reference cards because a
senior room reaches them anyway. The ₹44,000 Friday night shrank from eight minutes to
four and moved to 03:55, where it frames the teardown. "Nobody is there to approve" stopped
being a discussion: the room sets an 18-minute approval timer at 02:00, goes to the break,
and reads its own queue at 02:20. Three outcomes appear in every room and nobody chose a
wrong one. Drill 5 is dropped, because homework was already over the five hours the public
page promises.

**Outcome 1 changed and its id changed with it**, `limit-as-data` to `limit-placement`.
Writing the number in a file is the easy half. The half that costs money is which callers
the control covers. Nothing had been rated against the old id, so this is a rename rather
than a migration.

### Two defects found while doing it, both pre-existing

- **Week 2's learner check rendered ONE question under a heading promising eight.** Q4, Q6
  and Q9 were tagged `judge` while each carried four options and a marked key; the tag was
  being used to mean "hard". `isSelfServable` drops every `judge` item from `/craft/quiz`,
  so seven of the eight ids in `quiz:` were dropped silently. The three are `apply` now,
  `quiz:` lists the four that actually render, and the bank explains the split. **This was
  not caused by the redesign** and would have reached the room.
- **Cycle C had no buildable fix.** The learner page said "put a unique constraint in the
  store" and this repository's ledger is a Python list, so there is no store. It is now a
  sqlite file with the key as primary key and `INSERT OR IGNORE`, which is standard library
  and about fifteen lines. **That is a staging dependency and it blocks running the
  session**: the reference agent needs a `w2-` sqlite path, same rule as `w2-guarded` and
  `w2-goodwill`.

### Verified

`astro build` completes, `astro check` is 0 errors against the baseline of 0, and 85 tests
pass. The frontmatter parses, the run of show totals exactly 300 minutes, the before-pulse
closes at the first block and the after-pulse opens at the close, and all four ids in
`quiz:` render for a learner.

### Still owed

- **Topic 1's pair is rebuilt and republished, and it passes all eleven checks.** Learner
  version 23, instructor version 29, same two URLs. Six topics now, not five: the choice of
  mechanism earned one of its own. The unit stayed the topic rather than the block, because
  after the rebuild four of the five old topics became single unbroken runs, so the two
  nearly coincide and the topic is the unit of the argument. `docs/teaching/README.md` has
  the list and the per-topic state.

  The pages were built from one generated clock string dropped into both, which is the
  cheapest way to keep "clocks are byte-identical" true. Topic 1 now covers 00:23, then
  00:42 to 01:35 unbroken, then the adversary round at 03:25. It gained the nine control
  points, the two counters, the move-toward-the-protected-thing rule and the six attack
  routes; it lost the ₹44,000 Friday night to topic 5 and drill 5 entirely.

- **Topic 2's pair is rebuilt and republished too, and also passes all eleven.** Learner
  version 8, instructor version 7. It is cycle B: 01:40 to 02:05, and then it keeps going
  through the break and lands at 02:20. **The break is bold on its clock on purpose**,
  because for fifteen minutes it is the only part of the session still doing anything.

  The big change is that the 2:14am question stopped being a discussion. The room sets a
  real 18-minute timer at 02:00, leaves, and reads its own queue at 02:20. The old beat
  carried a defect fixed on 11 September, where it asked about code the room had not
  written yet; that cannot come back, because the code now exists forty minutes before the
  question. The decision log moved from 00:52 to 01:47, where it is actually built, closing
  a 115-minute gap between teaching it and building it.

  **"Outline stage" in the README was wrong.** Both pages were complete, including a
  hand-drawn SVG of the four exits from an ask, which is carried over unchanged. Only the
  clock was stale.

- **One new preparation item, and it is the only thing the rebuild added to the running
  cost.** Three prepared queue states for 02:00, one per outcome, for anybody whose gate is
  not working when the timer is set. Without them a broken build costs that person the
  02:20 beat entirely, which is the best six minutes in the session.

- **Topics 3 to 6 are written and published, so all six pairs now exist and all six pass
  all eleven checks.** Eight new artifacts; the URLs are in `docs/teaching/README.md`.
  - **Topic 3, reliability**, is cycle C. The whole topic turns on letting a green result
    stand for four minutes before breaking it, and it now ends on a built fix rather than
    handing one forward.
  - **Topic 4, risk trade-offs, is a thread rather than a block, and it is the only one of
    the six that is.** Seven minutes of its own. Planted at 00:54 as two counters, paid at
    01:40 when Meera's refusal increments one and nothing else mentions her, argued at
    04:32. Its instructor page carries one instruction in bold: do not teach it three
    times. Explaining it at 00:54 buys agreement and spends the feeling.
  - **Topic 5, governance**, is the policy table and the horizon. It records where each of
    the five old teardown questions went.
  - **Topic 6, choosing a mechanism**, is the 15-minute judge block.

- **Week 2 now has a collated pair as well, the shape week 1 uses — 29 September.** All
  six topics on one learner page and one instructor page, each topic in a collapsible.
  Learner `Q1r2bp8wuXJtm8U6v31tLU`, instructor `UvW3uzMHXznXU95oWHkA98`. The six topic
  pairs stay: they are what you open to teach one topic, and the collated pair is what you
  open to see the week.

  **The collated pages are generated from the six pairs**, so the pairs are the source and
  the collated pair is the view. They are in topic order rather than clock order, because a
  topic is an argument and an argument reads better in one piece; the clock at the top
  gives the other reading.

  `check:teaching` gained **`--by-topic`** for them. Six of the eleven checks describe a
  page that claims to be a run of show, and a topic-ordered page does not, so they are
  swapped for three that do apply: no duplicate ids on either page, six collapsible topics
  present, and both pages carrying the same topics in the same order. Duplicate ids are the
  real hazard, because six topic pages merged onto one is six chances for `id="r-scope"` to
  collide.

- **Two defects in the instructor pages, found by Sunil noticing the collated page had no
  columns — 29 September.** Both are fixed and all seven instructor pages are republished.
  - **The collated instructor page had lost the side-by-side layout.** The consolidator
    stripped the `.pane` wrappers and stacked the script and reference columns. It now
    emits one `.teach` grid per topic inside the collapsible, with the stock rule
    `body.split .shell > :not(.teach)` undone for `details.topic`, because `.teach` sits
    two levels down there rather than directly under `.shell`.
  - **The worse one: clicking a beat did nothing, on all six topic pages.** The script
    called `querySelector` on a bare id, which reads `r-payonce` as an element name,
    matches nothing and returns null. It came from pairing topic 2's original script, which
    used `data-ref="#b1"`, with rebuilt markup that uses `data-ref="r-payonce"`. **Nothing
    in `check:teaching` can see this**, because a dead link and a working one are the same
    HTML. The script is now [`scripts/teaching-pane.js`](../../scripts/teaching-pane.js),
    it strips a leading `#`, and a rebuild is checked by confirming every `data-ref` has a
    matching `id`. All 23 beat links resolve.

- **The clock now lives in [`scripts/teaching-clock.mjs`](../../scripts/teaching-clock.mjs)
  and nowhere else, and that is not a tidy-up.** Twelve published pages carry the same
  table. Topics 1 and 2 were built before topics 3 to 6 existed, and by the time all six
  were written **their clocks disagreed about who owned 02:05 and 03:01**. The checker
  cannot see that, because it only compares the two pages of one pair. Both were
  regenerated from the one table and republished. Generate a topic's block with
  `node scripts/teaching-clock.mjs 01:40 01:47 …` rather than editing a page's table.

- **`check-teaching-pages.mjs` never actually checked anything, and now it does.** This is
  the one to read before rebuilding any page.

  Run against the two published week 2 pages, unmodified, it reported 7 of 11 failing, and
  **three of the four passes were vacuous**. Four causes, all of them the checker matching a
  page shape that does not exist:
  - `clockOf` searched for the literal "Five hours, five blocks". A topic page says *"Where
    this topic sits"*, so it found no clock on either page, returned null for both, and
    "clocks are byte-identical" then passed because `null === null`. With no clock, "every
    learner card is in the clock" failed for every card.
  - `runOfShow` expected `<div class="t">`. The pages use `<span class="t">`. Zero rows
    found, so "run of show is monotonic" passed on an empty list.
  - `beatRefs` expected `data-ref="#id"`. The pages write `data-ref="id"`. Zero refs, so
    "run of show and notes column agree heading for heading" passed on an empty list.
  - It also had no entry for a topic page's four framing cards, which sit outside the clock
    by design.

  **All four are fixed, and the gate now reports real drift.** Still 7 of 11, but they are
  findings rather than artefacts: the two clock tables genuinely differ, the notes column is
  out of clock order, ten run-of-show headings do not match the clock's wording for the same
  beat, and **both published pages end with a duplicated `</body></html>`**. That is the
  exact fault the checker's own header says it exists to catch, so it was right to build and
  it had simply never run.
- **The `w2-` sqlite target in the reference agent**, described above.
- **`docs/teaching/notes/teardown-five-questions.md` needs nothing.** An earlier note here
  said it was stale. That was wrong: it is **week 1's** teardown, for week 1 §4, and the
  week 2 restructure does not touch it. Checked 28 September.

## Resource 07, the Agent Failure Triage Quiz — 26 September, on a branch

Branch `resource/failure-triage-quiz`, off `main`. Page at
`/resources/agent-failure-triage-quiz`, content in `src/data/agent-failure-triage-quiz.ts`,
integrity test in `src/lib/resources/agent-failure-triage-quiz.test.ts`. It is the quiz that
goes with resource 04, the Agent Failure Triage Kit: ten concept questions over the kit's
seven takeaways, plus two questions on the kit itself, all on one illustrative procurement
incident.

**Still owed, and it is one line of code.** `LINKEDIN_EPISODE_4_URL` in the data module is
`'TODO'`. Until somebody sets it, the pre-read block names *Agentic system design, Episode 4*
in plain text and links the kit instead, the same rule the Cost-Ceiling Workbook follows for
Episode 5. Set the constant and the link appears; nothing else changes.

Four things a later session would otherwise rediscover:
- **The question bank is checked, not trusted.** `quizProblems()` enforces the brief: one
  correct answer per question, four options, every takeaway tested, at least four question
  shapes, no bracketed leftovers. The page calls `assertQuiz()` at render, so a broken bank
  fails the build; `npm test` runs the same check.
- **It is the one resource page with a forest band.** `templates/tool.css` deliberately
  keeps the dark linen off a tool's hero, so the band went on the case file instead, with
  the ivory weave behind the hero. One dark surface per view still holds. Sunil asked for
  the cohort page's two surfaces here.
  Since the plain-green task (above), the band is flat forest, like every page but `/`.
- **The missed-takeaway list is rendered server-side and hidden**, not built in JavaScript.
  Astro's scoped styles do not reach elements a script creates, so a script-built list
  silently loses its own CSS. That was the first version.
- **`min-width: 0` on the question card is load-bearing.** The evidence blocks are
  `white-space: pre`; without it one long log line widened the page and gave the whole site
  a horizontal scrollbar on a phone.

No download, no gate, no storage and no network call: answers live in a closure and die with
the tab. A correct answer plays two short notes from an AudioContext, with a toggle in the
bar; there is no audio file.

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
- **Kept against the package, on Sunil's earlier instructions**: no sticky bar on phones.
- [x] **One menu on phones** (Sunil, 19 September). At 760px and below the "On this page"
  row is hidden and its six links are the first group of the ☰ menu, in two columns, above
  the site's links. The package's separate `<details>` page menu is gone. The panel scrolls
  on a short phone.
- [x] **The last three sections are left-aligned again** (Sunil, 20 September). "Before you
  apply", "Talk first" and "Apply" share the page's left edge, like every section above
  them, which is also what V4 draws. The centring rules of 19 September are deleted.
- [x] **The booking widget on `/` points UP** (Sunil, 20 September): its empty, failure and
  no-JavaScript copy says "use the form above", because the application sits above #book
  since the V5 order. `BookingWidget` takes `formAt`; /caio and /assessment still say
  "below", where their enquiry form really is below it.
- [x] **The Living Craft lockup is on every page** (Sunil, 20 September). One component,
  `src/components/site/BrandLockup.astro`, in every header and footer: the practice pages
  (SiteNav and SiteFooter), resources, policies, field notes, booking, `/caio`,
  `/assessment`, the course area's phone bar and the console. It replaces the "Sunil Mathew"
  dot on the two consulting pages, which is a branding change to raise with Sunil if it was
  not intended that far. Phone headers on /about, /resources and /assessment already wrapped
  to two rows before this; they are now about 15px taller.
- QA: side-by-side with the package at 1440 and 390; functional script 77/79 (the 2 are the stubbed
  500s, expected); 0 contrast failures at 1280 and 390; no overflow 320 to 1920; `astro check` 0
  errors; `npm test` 37/37; build clean. Chat does not render locally without `ANTHROPIC_API_KEY`.

---

## Booking times on staging — 20 September

**`.env.local` points at the STAGING Supabase, not a scratch project.** Its `events` rows
carry `referrer_host: thelivingcraft-git-feat-lan-…vercel.app`. Production runs on a
different project whose credentials are team-level in Vercel and are not in this project's
`vercel env ls`. So a write from a session here reaches staging and cannot reach
production. That is the hour this cost to work out.

**Staging had no `booking_rules` at all**, which is why `/`'s "Talk with Sunil" showed
"There is nothing open at the moment" — and why `/caio` there was just as empty. The open
times Sunil was comparing against were production's. Fifteen rows were inserted on
20 September, on his instruction ("no need for it in production, just needed in staging.
The timings can be the same"): `discovery`, `cohort-call` and `scope`, Monday to Friday,
`start_min` 960 to `end_min` 1080 — 16:00 to 18:00 Asia/Kolkata, the band production
already offers for `discovery`. All three types now return the same 76 slots.

**`cohort-call` reads the `discovery` hours, since 21 September.** Sunil asked for the
cohort page to reuse the calendar `/caio` already has, rather than a second set of rows he
would have to keep in step. `MeetingType.rulesFrom` in `meetings.ts` does it, `availableSlots()`
in `store.ts` reads it, and the console's "Add a band" no longer lists `cohort-call`. So the
fifteen staging rows above are now twelve that matter (the three `cohort-call` bands are
never read) and **production needs no new rows at all** for "Talk with Sunil" to show times.
A cohort booking is filed in `leads` as `interest: 'cohort'`, surface `/`.

**A booking on one call type already blocks that time on every other one**, and this is not
new behaviour: `busyBetween()` in `lib/booking/store.ts` selects every row in `bookings`
with no `meeting_type` filter, because it is one person and one diary. Availability is
per type; bookings are not. `src/lib/booking/slots.test.ts` now holds that rule — including
a guard that reads `store.ts` and fails if a `meeting_type` filter appears in
`busyBetween()`, which no pure test could catch. `npm test` runs `src/lib/**/*.test.ts`
now, quoted so Node expands it rather than the shell.

**One thing a booking costs two slots.** Fifteen quiet minutes either side of a thirty
minute call reach into the next half hour, so booking 16:00 also takes 16:30 off both
lists. Existing behaviour on `/caio`, stated here because it surprises people.

**A booking cannot be completed from a local dev server.** `bookSlot()` signs the manage
token with `ADMIN_SESSION_SECRET`, which Vercel Preview has and `.env.local` does not;
without it the request dies with `DataError: Zero-length key is not supported` before any
row is written. Test bookings happen on staging, in a browser, past the Vercel SSO gate.

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
