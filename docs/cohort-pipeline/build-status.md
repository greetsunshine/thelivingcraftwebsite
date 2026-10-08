# Cohort pipeline — build status

**Built against:** [`build-plan.md`](build-plan.md), from the Cohort Handoff Package
(`LC-LAUNCH-2026-09-10`) in [`docs/Website Rebuild 10-09-2026/`](../Website%20Rebuild%2010-09-2026/).
**Branch:** `feat/cohort-pipeline`, stacked on `feat/learner-dashboard-poc` (PR #6).
**Last updated:** 14 September 2026

> **Start at [`RESUME.md`](RESUME.md)** if you are continuing this work — it is the
> operational checkpoint. This file is the detail behind it.

> **This is a living document.** Every change to the cohort page or the pipeline updates it in
> the same commit as the code — the same rule as
> [`docs/learning-agent/build-status.md`](../learning-agent/build-status.md), and for the same
> reason: a status line that was right the day it was written and wrong a week later is worse
> than none. Move the checkbox, adjust the counts, add a changelog row.

> ### ⚠ One external answer is outstanding
> **D2 — how does an email actually get sent?** needs a provider, verified domain and monitored
> reply mailbox. The safe D1 implementation default is now complete: public pages, structured
> data, `/llms.txt`, `/api/facts`, latest updates and the visitor assistant all withhold fees,
> dates and week counts consistently.

> ### ⚠ Run `supabase/schema.sql` before the next deploy
> Ten new tables (`organisations`, `people`, `cohorts`, `form_submissions`,
> `opportunities`, `attributions`, `consents`, `activities`, `tasks`, `audit_log`) plus
> `pipeline_submit()` and the append-only trigger on `consents`. All additive, and the file
> is idempotent — re-run the whole thing in the Supabase SQL editor. **The public
> application form does not work until this is run**, and it fails honestly: a 503 with a
> retry, never a false success.

> ### ⚠ Nothing is deployed and no acceptance case has been run
> The register below starts, as delivered, with all eighteen cases `not run`. **A local
> demonstration is not evidence of a working backend** — the brief is explicit. Cases are
> filled in against staging with environment, date and evidence, and Sunil or the client
> authorises publication from that.

---

## Summary

| | Count | |
|---|---|---|
| Stages complete | **6** | of 6 — dispatch off, pending D2 |
| Acceptance cases passed | **4** | of 18 — against dev, not staging |
| Records implemented | **14** | of 14 |
| Decisions outstanding | **1** | D2 |

---

## Stages

### 1 · The page and three forms that save

- [x] Cohort page rebuilt against `cohort-page.md`, in the wireframe's module order
- [x] Video slot reserved at aspect ratio; player omitted until footage exists
- [x] Application form — role, design experience, learning goal, funding route
- [x] Cohort enquiry form — question
- [x] Enterprise enquiry form — organisation, role, team learning goal
- [x] Cohort ID resolved from server configuration, never a hidden input
- [x] Separate unticked marketing permission in the approved wording
- [x] `request_key` idempotency — same key, same reference, one acknowledgement
- [x] Success returned only after commit; DB failure preserves entered values
- [x] First-touch and submission-session attribution captured separately
- [x] 390px / keyboard / 200% zoom / screen-reader labels — markup verified; a real screen-reader pass is still owed (E15)
- [x] Fees, dates and week count withheld consistently across every public and machine-readable surface
- [x] Google Calendar appointment popup scaffolded behind a validated public schedule URL, with a direct-link fallback and separate intent tracking
- [ ] Real appointment URL configured and popup, fallback, mobile and completed test booking verified in staging

### 2 · Staff screens and named accounts

- [x] Named staff accounts with the five roles, enforced server-side
- [x] Overview — filters, totals, pipeline snapshot, needs-attention, last refresh
- [x] Leads — search, filters, explicit empty and failed-load states
- [x] Lead detail — contact, preferences, attribution, activity, tasks, tabs
- [x] Loading / empty / error / permission-denied states on every data screen
- [x] New tables added to the `lib/admin/health.ts` probe lists

### 3 · Pipeline and evidence

- [x] Member stages and side states
- [x] Enterprise stages, with participant nominations stored separately
- [x] Activity, task, meeting, offer, payment, attendance records
- [x] Enrolment gated on Sunil's admission *and* finance-confirmed payment
- [x] Stage change writes history; closing or reversing requires a reason
- [x] Refund creates evidence and a review task without erasing history

### 4 · Communications

- [x] Twelve templates as approved, versioned records
- [x] Durable outbox with bounded retries and a visible failure queue
- [x] Consent / approval / availability / stage / suppression checked at queue *and* dispatch
- [x] Day 2, 5, 9 scheduler at 10:00 Asia/Kolkata
- [x] Stop and pause rules; no automatic restart; no burst of missed messages
- [x] Signed opaque unsubscribe, no login, no contact details exposed
- [x] Authenticated, deduplicated, out-of-order-tolerant provider callbacks
- [x] Communications screen — inbox, outbox, templates, sequence history, failures
- [ ] Dispatch enabled **(blocked: D2, sender verification, reply mailbox)**
- [x] Resource follow-ups (30 September): consent box on the gate, catalogue as data, one-step-ahead planner with a lease and an idempotency key, scheduled worker, Resend adapter and webhook, transient retries, rendered email with the footer at dispatch, console section, 34 tests
- [x] Follow-ups aligned to the resource brief (6 October, PR for `feat/resource-followups-spec`): double opt-in with a confirmation page, days 2/5/9/14 then weekly, weekdays only, 48-hour floor, no catch-up burst, pause on reply, booking, open application or payment, no re-enrolment, release guard, the brief's consent and relevance wording, 43 drip and confirmation-token tests
- [ ] Follow-up wordings approved (24 rows, `LC-OUTREACH-2026-09-29.2`, including the confirmation request) **(blocked: Sunil's review)**
- [ ] Resources released for sending (`RELEASES` in `resource-routing.ts`, empty) **(blocked: Sunil's confirmation per module)**
- [x] Replies read from the reply mailbox (6 October): signed `POST /api/comms/inbound`, a Gmail Apps Script forwarder, reply pauses a follow-up and stops a cohort sequence with a task, marketing held when the feed is 30 minutes stale
- [ ] The reply feed installed on the real reply mailbox. **Mailbox decided 8 October: `newsletter@thelivingcraft.ai`, on Gmail.** Still blocked on its owner running the script's setup after deploy.
- [x] From-address decided 8 October: `newsletter@thelivingcraft.ai`, the same address as the reply mailbox. Messages go out with `Reply-To` set to it, and the reply script already skips the mailbox's own messages.
- [x] One-click unsubscribe (RFC 8058) gets through: Astro's origin check moved into middleware with `/api/unsubscribe` exempt; the footer link's GET now asks before acting
- [x] Architect added to the role list, with the brief's role-first ranking for engineering leaders and architects
- [ ] The brief's 16 acceptance cases run live on staging **(blocked: provider, sending domain; register in `src/lib/comms/README.md`)**
- [ ] The role affinities per module **(blocked: owner decision; proposed in data)**

### 5 · Administration

- [x] Staff and roles, cohorts, sender verification, template versions
- [x] Integration health and audit history
- [x] Application closure as a truthful state
- [x] Import — validate, preview matches and conflicts, commit, batch log
- [x] Scoped CSV export with tracker fields and formula-prefix escaping
- [x] Retention configuration and documented deletion process

### 6 · The wider site

- [x] IA and navigation, with existing surfaces inventoried first
- [x] `/about/`, `/programmes/*`, `/advisory/`, `/contact/`
- [x] Utility routes — apply, confirmation, preferences, privacy, terms
- [x] Privacy page — honest placeholder, `noindex`, names all five outstanding facts and who owes each **(still blocked on the owner for the facts themselves)**
- [x] First content cluster — pillar, three supporting pieces, review workbook
- [x] Agent Design Check — browser-only, no server retention, no lead record
- [x] Analytics event taxonomy wired

---

## Acceptance register

Mirrors
[`Ein_Acceptance_Register.csv`](../Website%20Rebuild%2010-09-2026/Ein_Acceptance_Register.csv).
Record environment, date and evidence there as cases are run; keep this table in step.

| ID | Scenario | Status |
|---|---|---|
| E01 | Valid application with and without marketing permission | not run |
| E02 | Duplicate click, refresh and network retry | not run |
| E03 | Database unavailable | **passed** |
| E04 | Email outage after save | not run |
| E05 | Existing contact, new enquiry and later application | not run |
| E06 | Employer sponsorship and enterprise group | not run |
| E07 | Consent declined and anonymous visit | not run |
| E08 | UTM, direct return, external referrer and cross-host form | not run |
| E09 | Reply, meeting booking or unsubscribe before queued send | not run |
| E10 | Provider timeout, duplicate/out-of-order callbacks | not run |
| E11 | Role access and guessed record/export URL | not run |
| E12 | Stage correction, refund and attendance change | **passed** (authorisation half) |
| E13 | Import conflict and CSV formula-like text | **passed** (escaping half) |
| E14 | Synthetic dashboard dataset | not run |
| E15 | 390px, keyboard, zoom and screen-reader form labels | not run |
| E16 | Backup restore and integration disconnect | not run |
| E17 | Public indexing and private administration | **passed** |
| E18 | Closure of applications | not run |

---

## Release gates

Before anything is published, per the brief's closing paragraph:

- [ ] Sender domain authentication confirmed
- [ ] Monitored reply handling confirmed
- [ ] Unsubscribe verified end to end
- [ ] Approved privacy facts published
- [ ] Staff accounts created
- [ ] Working route confirmed
- [ ] Google Calendar appointment route and direct-link fallback tested in staging
- [ ] Final public copy approved by Sunil
- [ ] Rollback procedure recorded
- [ ] Test records cleaned up before production opens

---

## Changelog

| Date | Change |
|---|---|
| 8 Oct 2026 | **Five fixes from the PR #52 review.** (1) `scripts/inbound/gmail-replies.gs` searched `-label:lc-reply-posted`, and Gmail labels whole threads, so a second reply in a thread was never posted and the sequence kept sending; it now keeps a time cursor (`LC_CURSOR`) with a 15-minute overlap. (2) `/confirm-resource-emails` loaded Google Tag Manager, so GA4 and Clarity received the `?c=` confirmation token; it now passes `tagManager={false}`. (3) The send-time reply gate in `eligibility.ts` counted every reply ever; it now counts from `resumed_at ?? anchor_at`, as the planner does. (4) The first confirmation request used `confirm:<seq>:1` and a repeat `confirm:<seq>:<date>`, so two went on day one; every request now uses the dated key. (5) `awaitingWithoutRequest` read the 500 oldest awaiting sequences and filtered in TypeScript; it now calls the new SQL function `comms_awaiting_without_request` (NOT EXISTS), which is in the health probe. **Schema: one new read-only function; run `supabase/schema.sql` before merging.** `npm test` 191/191, `astro check` 0 errors. |
| 7 Oct 2026 | **Module copy names the topics bridge 7 added.** `MODULES` in `src/data/cohort-copy.ts`: M2 names MCP servers (week 4), M3 names A2A, agent memory and retrieval quality (week 5), M4 names pricing the system: one run, the provider rate limit and peak load, and the cost of each outcome that meets the pass bar, including wrong answers that got through (week 6). "Capacity and cost under load" left M3 because capacity moved to week 6. MCP is framed as build-and-adopt, not as security. **Merge PR #54 first**: it holds bridge 7 and the plans this copy describes. Titles unchanged, so `facts.ts`, the JSON-LD Course node, `/api/facts` and `/llms.txt` are unchanged and the eval path filter is not triggered. Visible page only. `astro check` 0 errors, build passes. |
| 8 Oct 2026 | **The reply mailbox and the from-address decided: `newsletter@thelivingcraft.ai` for both, on Gmail.** Vercel needs `COMMS_REPLY_MAILBOX` and `COMMS_FROM_ADDRESS` set to it; the reply script's `LC_MAILBOX` property takes the same value. Still open for D2: the provider, the sending domain's DNS records and the postal address. Main merged into PR #52 (week 4, the Citation Fit Check); `npm test` 190/190, `astro check` 0 errors. |
| 8 Oct 2026 | **Correction: the schema runs of 29 September, 1 October and 7 October went to the preview Supabase project, not production.** The project Ein's account opens has 124 `events` rows, the newest from 1 October, and production's worker logs `42703` (column does not exist) on every run while that project has every column. The owner of the production project must run the whole `supabase/schema.sql` from `main` there. |
| 7 Oct 2026 | **PR #52's schema applied** (to the preview project, as found on 8 October). The whole `supabase/schema.sql` from this branch ran without error. The six checks all returned 1: `comms_sequences.confirmed_at`, `consents.confirmed_at`, `comms_events.person_id`, the `comms_inbound_status` table, the `awaiting_confirmation` state and the widened one-live index. The code can merge without the console's "table is not answering" notice. |
| 6 Oct 2026 | **The rest of the resource brief.** Replies: a signed inbound endpoint and a Gmail Apps Script forwarder; a reply pauses a follow-up, stops a cohort sequence with a task; a stale feed holds every marketing message. Found and fixed: Astro's built-in cross-site check refused every RFC 8058 one-click unsubscribe with a 403, so the check now runs in middleware with `/api/unsubscribe` exempt. The footer link's GET now asks before acting, as the brief's case 8 requires. Architect joins the role list, with the brief's role-first ranking. The 16 acceptance cases are mapped to tests and live steps in `src/lib/comms/README.md`. Schema: `comms_events.person_id`, the `comms_inbound_status` table. `npm test` 177/177, `astro check` 0 errors. |
| 6 Oct 2026 | **Resource follow-ups brought in line with the resource brief** (`review/05-email-and-resource-routing.md` in the outreach package). A tick now opens the sequence `awaiting_confirmation` and queues one confirmation request; `/confirm-resource-emails` confirms on a button press, never on a GET. Days 2, 5, 9 and 14 from the click, then seven days after each actual send; weekends roll to Monday 10:00 IST; 48 hours minimum; the next step waits for the last to leave, so no burst. Pause on a reply, a booked call, an open application or enquiry, or a payment; a reviewed resume ignores what was reviewed. No re-enrolment. Every module starts unreleased (`RELEASES`); with none released, sequences wait rather than end. The box has the brief's wording (`mkt-resource-2026-09-29`); the relevance sentence and two of the four role sentences are the brief's. Schema: one state, two `confirmed_at` columns, the one-live index widened, earlier unconfirmed sequences moved back to awaiting. `npm test` 165/165, `astro check` 0 errors. |
| 29 Sep 2026 | **The revised outreach readiness handoff.** Page copy from the package on the core journeys; the application's saved panel reads "Thank you for applying." and is built only from a committed save. "How did you first hear about The Living Craft?" is a choice (seven answers) plus an optional line on all three routes, stored as `attributions.self_reported` and `self_reported_detail`. With an analytics yes on the cookie banner, the browser records where a visit began (`lc_first`, `lc_last`) and the server reads it with the form, so a campaign visitor who read a tool first is no longer filed as `direct`; the banner now also asks on the tool pages, which still load no tag. Seven named events with a deduplicating `event_id`, the environment and the banner answer; the funnel reads them. Schema: three columns on `attributions`, two on `resource_requests`, a unique index on `events`, all additive. 64 browser checks, `astro check` 0 errors, `npm test` 105/105, build passes. |
| 19 Sep 2026 | **Every download gated behind name and email, one mechanism, one table.** `src/components/ResourceGate.astro` (the dialog), `src/lib/resources/gate-client.ts` (any `data-gate="<kind>"` control opens it; pages with a payload call `mountGate()`), and `src/pages/api/pipeline/download.ts` (one route, a registry of resource → kind → parse/verify/render; replaces `resource-pdf.ts`). Static files moved from `public/downloads` to a private `downloads/` folder bundled into the function; dev server denies it too. Fourteen public pages converted: the four scored-PDF tools, the memory kit's three files, the run-cost workbook, the three worksheet CSVs, the toolkit, the four templates' Markdown, the rule audit's CSV, the design check's text file, and every print button (`kind: print`). The design check and the rule audit keep their no-answers-leave-the-page promise: the route hands nothing back and the page builds the file. Schema: `resource_requests.kind`, `p_kind` on the submit function, and the `resource_requests_marketing` view (probed by health). Console: `/craft/admin/requests` and a *Resource requests* export scope. Nine held delivery wordings added. Copy that promised no email gate rewritten on every page and in the register. Found and made honest: the cost-ceiling workbook file never existed and its button was a 404; the page now says so. Policy: reverses the V4 addendum's "anonymous downloads are events, not people" on Sunil's instruction; a download still grants no marketing permission. Tested: 27 route cases, 18 browser checks across eight pages, `astro check` 0 errors, `npm run build` passes with the gated files in the function and not in static. |
| 19 Sep 2026 | **Model Selection Tool brought into line with the stepped POC Selection Tool.** `/resources/model-selection-checklist` (tick-boxes and blank tables) is now `/resources/model-selection-tool`, both old addresses redirecting to it. One framed shell with the score bar and progress bar as its sticky header; six steps (Start, A the step, B ten deployment gates, C twelve behaviours, D four disqualifiers, Result) with Back and Next above and below each, pips that jump, every step visible without JavaScript and in print, auto-advance after a first answer, and a result card with the outcome, per-section scores, the hard-gate warning, *Fix first* joined to the test case that is the evidence for each row, and the rubric. Buttons are Get the PDF and New assessment only. Two reference candidates load from the Start step and the result card names the one loaded. `src/data/model-selection-tool.ts` scores at Sunil's request (weighted by the step chosen in A; B and D are hard gates outside the score). `lib/resources/model-selection-pdf.ts` has the reference's three stages with thirteen named checks plus the reopen, the route's `verify` runs before the save, and the branding is the reference's (cover band, wordmark, credit, mist result, berry hard-gate marks, ember cohort panel with the apply link from `facts.ts`). Seventh held wording `resource-model-selection-tool`. Tested at three layers: every reachable total against the rubric for all three steps and thirteen tampered models caught; the route with good, malformed, honeypot and bad-email payloads; headless Chrome at 1280 and 390 (steps, pips, progress, auto-advance, sticky header, keyboard, dialog with the check list, no-JS, print); every page of five PDFs rasterised. `astro check` 0 errors; `npm run build` passes. |
| 18 Sep 2026 | **Run-Cost Model Tool brought into line with the stepped POC Selection Tool.** `/resources/run-cost-model` is now the POC tool's shape: one framed shell with the score bar and progress bar as its sticky header, nine steps (Start, the seven sections, Result) with Back and Next above and below each and pips that jump between them, every step visible without JavaScript and in print, and auto-advance after a blank line is filled (350ms, next blank line in the step, then the next step; a revised line stays). The tabs, the static example tables, Copy and Print are gone. **The reference example is loaded on arrival**, labelled in the bar, on the Start step and on the result card, with *Start from a blank model* beside it; the example's 83 values and every worked-out line render on the server. The PDF is the reference's three stages: `buildModel()`, `checkModel()` with fourteen named checks that recompute every fact from the raw inputs with their own arithmetic (baseline, the six run blocks, cost per acceptable outcome, net and break-even, the rubric, the flags, every line label, the order of the assumption checks, placeholders, unpublished figures, the apply link, the credit line, every glyph), then draw, then reopen; the route's `verify` runs before the save and the check list goes back to the dialog. Branding: black cover band with wordmark and credit, mist result panel, sun mark on the leading option, ember *Join the cohort* panel with a clickable apply link from `facts.ts`. `public/downloads/agent-run-cost-model.xlsx` is regenerated by `npm run workbook` (`scripts/run-cost-workbook-data.ts` reads the data module, `scripts/run-cost-workbook.py` writes the file): a Read me sheet, a blank *Your model* sheet with an instruction beside every line, and the filled *Reference example*, branded, formulas checked against the page. Rules and Rules v2 were indistinguishable from their names, so both now say where their rules came from (the team's own knowledge, or every rule written down during the agent build), on the cards, under every column, in the PDF and in the workbook, with one note on what to do if that spec work has not been done. Verified: rubric boundaries by script, the route with good and bad payloads, the page in headless Chrome at 1280 and 390, every PDF page rasterised, `astro check` 0 errors, `npm run build`. |
| 17 Sep 2026 | **Run-Cost Model rebuilt as an interactive tool, with an email-gated PDF.** The Run-Cost Model was an Excel download (`/downloads/agent-run-cost-model.xlsx`). It is now `/resources/run-cost-model`, in the POC Selection Tool's shape: purpose and how-to block, five rules for a budget conversation, a bar that stays on screen showing cost per acceptable outcome for each of the four options, seven input sections with the model's own line worked out under the inputs that feed it, a *Your result* card, the rubric, the nine lines teams leave out, and the limits. Two tabs: *Your model* and *Reference example* (the ordering agent across 40 sites, rendered on the server with every line filled, loadable into the model). `src/data/run-cost-model.ts` holds the rows, the workbook's formulas row for row (checked to the rupee against the sheet's computed values), and the rubric: the leading option is the lowest cost per acceptable outcome among options that save money against the manual baseline, with three flags beside it (cost per case and cost per acceptable outcome disagree; never breaks even; breaks even after the period) and a *Check these assumptions first* list. A blank input is unknown, not zero: dependent totals stay blank and the outcome reads only when all 83 lines are set. `lib/resources/run-cost-model-pdf.ts` is the third renderer on the shared `pdf-writer.ts`; `parseInputs()` refuses negatives and malformed shapes. Sixth held wording `resource-run-cost-model`. The workbook stays on disk and is linked from the foot of the page. Verified in headless Chrome: example loads to 83/83 with the outcome the workbook describes, blanking one line blanks only the totals that depend on it, tabs, copy, the dialog, the PDF on the unapplied-schema path (`saved: false`, file returned), 400 on a bad payload, mobile at 390px. `astro check` 0 errors. |
| 17 Sep 2026 | **Agent Authority Review rebuilt as an interactive tool, with an email-gated PDF.** `/resources/agent-authority-review` was a transcription of the field note: a blank table to print, three filled tables to read, and the reading rules as prose applied by hand. It is now a sheet. The heading is *Decide the agent's authority*; a purpose and how-to block sits under the hero; the undo-cost scale carries four short paragraphs on what undo cost is and why it is the score; and the visitor types their own workflow steps (3 to start, 12 at most), answers three questions per step (judgment, undo cost R0–R3, repeat) with a legend always in view, and the rubric names the owner beside the step as they answer. `readRow()` and `readSheet()` in `src/data/authority-review.ts` are the reading rules as code, called by the page, the tally bar, the result card, the copied sheet and the PDF. The result is an authority map (owner and undo cost per step, a tally, and a *Before you hand anything over* list: stopped rows, R3 rows needing a named owner, assumed evidence, eval sets owed). The three worked examples stay as *Reference examples*, each with a *Load into the sheet* button, so a reader can see the rubric's owner beside the author's call. New `lib/resources/authority-review-pdf.ts` and a second entry in `/api/pipeline/resource-pdf`'s renderer map; `parseSheet()` refuses a malformed payload and drops empty rows. Fifth held wording `resource-agent-authority-review`. Verified in headless Chrome: owners match the author's call on every row that has one, toggling an answer clears it, add/remove/cap at 12, copy, print, the dialog, the PDF download on the unapplied-schema path (`saved: false`, file still returned), and no horizontal overflow at 390px. `astro check` 0 errors. |
| 18 Sep 2026 | **POC Selection Tool: a fresh answer moves on.** After a question is answered for the first time, the page scrolls the next unanswered question in the step under the header and focuses its first anchor; after the last one, it moves to the next step. A changed or cleared answer stays put. |
| 18 Sep 2026 | **POC Selection Tool: framed shell, navigation above and below, no copy or print.** The tool now sits in one white shell with the app-shell radius and the overlay shadow; the score bar and progress bar are its header, the cards inside are mist and the answer buttons white. Each step carries Back and Next both above and below its content. *Copy the scorecard* and *Print* are gone; the PDF is the one takeaway. |
| 18 Sep 2026 | **POC Selection Tool: stepped layout, progress bar, branded and checked PDF.** The tool is six steps (Start, A to D, Result) with Back and Next, a progress bar that fills per answer, and pips that jump between steps; every step stays visible without JavaScript and in print. The PDF now carries the brand from the design system (black cover band with the wordmark and sun dot, mist result panel, ember *Join the cohort* panel with ink text and a clickable Apply link, the credit line, a footer on every page) with Helvetica standing in for Figtree because no font file is in the repo. Before it is built, `checkModel()` in `lib/resources/poc-screen-pdf.ts` runs 12 named checks (total is the sum of the answers, outcome matches the rubric, every anchor matches the tool, fix-first order, no placeholder text, cohort copy carries no unpublished figure, credit line, every glyph drawable) and the drawn bytes are reopened as a 13th; the checks run once before the save so a failing file leaves no record, and the list goes back to the page, which prints it under the download. `resource-pdf.ts` gained an optional `verify` per renderer; the other two renderers are unchanged. |
| 17 Sep 2026 | **POC Selection Tool rebuilt, with an email-gated PDF.** `/resources/poc-screen` renamed from *The POC Screen*; every question, anchor and section header rewritten in plain English (section B is now *Failure containment*, not *blast radius*); a purpose and how-to block; a score bar that actually stays on screen (the old one was sticky inside a short section and never left the top of the page); per-section subtotals; a *Your result* summary read against the rubric with a *Fix first* list joined to the four pre-build moves. New `/api/pipeline/resource-pdf` runs the same request as `/api/pipeline/resource` — the orchestration moved to `lib/pipeline/resource-request.ts` so the two routes cannot drift — and returns a server-built PDF (`pdf-lib`, new dependency) of the scored copy. `resolveResource()` now knows both registers, so a published tool can be requested by email as well as the three worksheets; a fourth, unapproved delivery wording `resource-poc-screen` is held with the other three. The PDF is refused on a failed validation and handed over on a failed save: the person did what was asked, and the console banner already reports the fault. Verified locally against the unapplied-schema path (503 → `saved: false`, PDF still returned). |
| 14 Sep 2026 | **Google Calendar appointment route scaffolded.** Added configuration-gated scheduling CTAs in the cohort hero and closing next-step area, using Google's official popup script with a direct appointment-page fallback. Blank or invalid configuration renders no scheduling claim. Opening the route records intent only; it does not assert a confirmed booking or application. Local Astro validation and configured/unconfigured renders pass; the real URL and staging test booking remain outstanding. |
| 11 Sep 2026 | **Public-offer consistency and durable acknowledgement queue.** Retired the regional price/start/week publication path from visible copy, structured data, `/api/facts`, `/llms.txt`, the latest feed and assistant grounding; removed unsupported biography metrics from public pages. A committed form submission now idempotently queues its receipt, while the initial task remains the durable owner notification. Dispatch stays safely off pending D2. `astro check` and production build pass; local campaign routing is 17/17 ready; acceptance remains 4/18 because the schema is not applied and external mail/accessibility/restore tests need their real environments. |
| 10 Sep 2026 | Package read end to end; plan and status written. Scope agreed as the whole package. Console extends `/craft/admin` rather than forking a second staff area. D1 and D2 referred to Sunil. Nothing built yet. |
| 11 Sep 2026 | **Checkpoint added.** `RESUME.md` is now the first read for any session continuing this work, and CLAUDE.md points at it from the top. Console session carries a signed identity and role list; verified by attack — a payload edited to grant extra roles and re-presented with the original signature is rejected. Shared password grants `operator` alone. `npm run staff` creates the first account; `npm run acceptance` runs the register (E03 and E17 pass, the rest report *not run* with reasons). `/privacy` published as an honest placeholder. Form accessibility markup verified: ten controls, ten labels, error slot on every field that can fail. |
| 10 Sep 2026 | **Stage 1 save path built.** Cohort page rebuilt against the delivered copy; three routes rendered from one definition in `lib/pipeline/forms.ts`; ten tables and `pipeline_submit()` added to the schema; `/api/pipeline/submit` returns success only after a commit. D1 held behind `PUBLISH_OFFER_FIGURES` — no price, date, week count or seat cap reaches the page or its JSON-LD. `resolveCohort()` returns three states, not two, so a database that cannot answer is a 503 and a retry while a cohort that is genuinely closed is a 409 — those were one refusal and the brief forbids presenting an unavailable source as a known state. `astro check` 0 errors. |

---

## V4 addendum — five more acceptance cases

`LC-STRATEGY-V4.0.0`, 11 September. Mirrors `Live_Acceptance_Register.csv` in the addendum
folder. See the V4 section at the foot of [`build-plan.md`](build-plan.md).

| ID | Scenario | Status |
|---|---|---|
| V4-E01 | Post IDs and UTMs survive resource → cohort navigation without overwriting first source; no contact details enter analytics | not run |
| V4-E02 | Anonymous download creates no person; optional email request deduplicates and creates the correct request type; repeated submit sends no duplicate receipt | not run |
| V4-E03 | Database failure shows no success and sends no unrecorded delivery; email failure retains the saved request and alerts staff | not run |
| V4-E04 | All three released pages and downloads match the approved resource version, work on mobile and keyboard, and link to the tested cohort/enquiry route | not run |
| V4-E05 | Resource request does not become an application or start marketing without its own permission; reply/unsubscribe suppression remains effective | not run |

### V4 stage additions

- [x] Cohort page copy updated — *See what a review can change*, plus the added sentence in Sunil's section
- [x] LC-R01 cost-ceiling worksheet live and tested (**required before post D10**)
- [x] LC-R02 evaluation-gates worksheet live and tested (**before D16**)
- [x] LC-R03 deployment checklist live and tested (**before D20**)
- [x] `/toolkit` index listing released resources only
- [x] Resource-request record, distinct from enquiry and application
- [x] `resource_id` as a permitted non-personal analytics dimension
- [x] V4 UTM contract — `lc_v4_cohort`, lowercase post id in `utm_content`
- [x] Resource-delivery template, separate from cohort nurture
- [x] `npm run check:campaign` — no post scheduled against an unbuilt destination
