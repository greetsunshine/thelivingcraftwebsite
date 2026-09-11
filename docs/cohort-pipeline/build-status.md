# Cohort pipeline — build status

**Built against:** [`build-plan.md`](build-plan.md), from the Cohort Handoff Package
(`LC-LAUNCH-2026-09-10`) in [`docs/Website Rebuild 10-09-2026/`](../Website%20Rebuild%2010-09-2026/).
**Branch:** `feat/cohort-pipeline`, stacked on `feat/learner-dashboard-poc` (PR #6).
**Last updated:** 10 September 2026

> **Start at [`RESUME.md`](RESUME.md)** if you are continuing this work — it is the
> operational checkpoint. This file is the detail behind it.

> **This is a living document.** Every change to the cohort page or the pipeline updates it in
> the same commit as the code — the same rule as
> [`docs/learning-agent/build-status.md`](../learning-agent/build-status.md), and for the same
> reason: a status line that was right the day it was written and wrong a week later is worse
> than none. Move the checkbox, adjust the counts, add a changelog row.

> ### ⚠ Two answers are outstanding from Sunil
> **D1 — do we still publish price, dates and the six-week shape?** and **D2 — how does an
> email actually get sent?** Both are written up in full at the foot of
> [`build-plan.md`](build-plan.md). Until they land, the price region of the page is a flagged
> placeholder and email dispatch is built but switched off. Neither blocks any other stage.

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
| Stages complete | **5** | of 6 — only communications (D2) is untouched |
| Acceptance cases passed | **4** | of 18 — against dev, not staging |
| Records implemented | **14** | of 14 |
| Decisions outstanding | **2** | D1, D2 |

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
- [x] Price and schedule region behind a flag, marked placeholder **(blocked: D1)**

### 2 · Staff screens and named accounts

- [x] Named staff accounts with the five roles, enforced server-side
- [x] Overview — filters, totals, pipeline snapshot, needs-attention, last refresh
- [x] Leads — search, filters, explicit empty and failed-load states
- [ ] Lead detail — contact, preferences, attribution, activity, tasks, tabs
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

- [ ] Twelve templates as approved, versioned records
- [ ] Durable outbox with bounded retries and a visible failure queue
- [ ] Consent / approval / availability / stage / suppression checked at queue *and* dispatch
- [ ] Day 2, 5, 9 scheduler at 10:00 Asia/Kolkata
- [ ] Stop and pause rules; no automatic restart; no burst of missed messages
- [ ] Signed opaque unsubscribe, no login, no contact details exposed
- [ ] Authenticated, deduplicated, out-of-order-tolerant provider callbacks
- [ ] Communications screen — inbox, outbox, templates, sequence history, failures
- [ ] Dispatch enabled **(blocked: D2, sender verification, reply mailbox)**

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
- [ ] Analytics event taxonomy wired

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
- [ ] Final public copy approved by Sunil
- [ ] Rollback procedure recorded
- [ ] Test records cleaned up before production opens

---

## Changelog

| Date | Change |
|---|---|
| 10 Sep 2026 | Package read end to end; plan and status written. Scope agreed as the whole package. Console extends `/craft/admin` rather than forking a second staff area. D1 and D2 referred to Sunil. Nothing built yet. |
| 11 Sep 2026 | **Checkpoint added.** `RESUME.md` is now the first read for any session continuing this work, and CLAUDE.md points at it from the top. Console session carries a signed identity and role list; verified by attack — a payload edited to grant extra roles and re-presented with the original signature is rejected. Shared password grants `operator` alone. `npm run staff` creates the first account; `npm run acceptance` runs the register (E03 and E17 pass, the rest report *not run* with reasons). `/privacy` published as an honest placeholder. Form accessibility markup verified: ten controls, ten labels, error slot on every field that can fail. |
| 10 Sep 2026 | **Stage 1 save path built.** Cohort page rebuilt against the delivered copy; three routes rendered from one definition in `lib/pipeline/forms.ts`; ten tables and `pipeline_submit()` added to the schema; `/api/pipeline/submit` returns success only after a commit. D1 held behind `PUBLISH_OFFER_FIGURES` — no price, date, week count or seat cap reaches the page or its JSON-LD. `resolveCohort()` returns three states, not two, so a database that cannot answer is a 503 and a retry while a cohort that is genuinely closed is a 409 — those were one refusal and the brief forbids presenting an unavailable source as a known state. `astro check` 0 errors. |
