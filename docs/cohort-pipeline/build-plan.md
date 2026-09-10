# Cohort page and follow-up pipeline — build plan

**Source of record:** [`docs/Website Rebuild 10-09-2026/`](../Website%20Rebuild%2010-09-2026/) —
the Cohort Handoff Package, Team Alchemy, 10 September 2026. Handoff `LC-LAUNCH-2026-09-10`,
campaign `LC-STRATEGY-V3.0.0`.
**Branch:** `feat/cohort-pipeline`, stacked on `feat/learner-dashboard-poc` (PR #6).
**Status:** [`build-status.md`](build-status.md) — read that before building anything here.
**Plain-language version for Sunil:** https://claude.ai/code/artifact/529e50fc-74a7-4e62-b162-3940f5b53d2a

---

## What the package actually is

Four documents and five reference files. The brief is a **functional contract, not a design** —
it says so in its own second paragraph: *"This document specifies behaviour, not a prescribed
technology stack."* Ein owns the stack, the providers, the hosting and the cost. Alchemy owns
content and acceptance review. Sunil owns programme facts and technical-fit decisions.

| Document | What it governs |
|---|---|
| `Ein_Build_Brief` | The page, the forms, the data model, permissions, interface contracts, analytics, email behaviour, and the 18 acceptance cases |
| `Operating_Guide` | How the pipeline is *used* — daily and weekly routine, and the 33 dashboard metric definitions |
| `Website_Growth_Roadmap` | The wider site IA, four content clusters, the Agent Design Check tool, and search/answer quality requirements |
| `Sunil_Rewrite_Review` | Fifteen LinkedIn posts, original vs proposed. **Not a build input.** Originals remain active; the register is pending Sunil's selection |
| `Screen_Wireframes.html` | Six staff screens plus the public page, as schematics |

The campaign posts do carry two build-relevant facts: every member post links to
`https://learning.thelivingcraft.ai/` with `utm_content=lc-oct-dNN`, so **the cohort page must
stay at `/`**; and sponsorship/enterprise posts route to `mailto:apply@thelivingcraft.ai`, so
that mailbox is a real dependency, not a placeholder.

---

## Delivery order — fixed by the brief, not by us

> *"Deliver a staging vertical slice first: page to form to saved application to staff lead
> record. Add receipts, permissions, attribution and pipeline changes next; then dashboard and
> manual email; then nurture and operational alerts."*

Six stages. Each one has to be demonstrable on staging before the next starts. A local
demonstration is explicitly not evidence.

### 1 · The page and three forms that save

The cohort page rebuilt against `cohort-page.md`, in the wireframe's order: outcome and VSL,
audience fit, the returns example, outcomes, curriculum areas, learning process, Sunil,
commitment, FAQs, application.

- **Video slot reserved at aspect ratio, player omitted until footage exists.** The brief:
  *"keep the written page complete and omit the player rather than presenting a broken video."*
  Captions and a transcript ship with it when it arrives.
- **Three routes, three records.** Application (role, design experience, learning goal, funding
  route). Cohort enquiry (question). Enterprise enquiry (organisation, role, team learning
  goal). An enterprise enquiry is never counted as an application.
- **The cohort ID comes from server configuration**, never from a hidden input.
- **Marketing permission is separate, unticked, in its own words.** A receipt is not consent.
- **Idempotency by request key.** Same key returns the same reference. One record, one
  acknowledgement, however many times the button is pressed.
- **Success only after commit.** A database failure returns an error and preserves entered
  values in the browser. An email outage must not roll back a saved application.
- **Attribution captured twice and kept apart** — first-touch and submission-session — plus the
  self-reported discovery answer, which is a third evidence field and never an override.
  Missing referrers stay `direct/unknown`.
- Accessibility is a release gate, not a polish pass: 390px, keyboard, 200% zoom, labels and
  error/success feedback reachable by screen reader. Any sticky action must not cover fields.

### 2 · Staff screens and named accounts

Overview, Leads, Lead detail — inside `/craft/admin`, alongside the teaching screens.

- **Named staff accounts with roles replace the single shared password**, because the brief
  requires that an operator cannot approve an offer and only finance can confirm payment. A
  shared password cannot express that. Authorisation is server-side on reads, exports and
  writes; hiding a button is explicitly insufficient.
- Every data screen gets loading, empty, error and permission-denied states.
- **An unavailable integration must not display zero as if verified.** The existing
  `lib/admin/health.ts` probe pattern extends to the new tables — if you add a table or a
  rollup, add it to the probe lists.

### 3 · Pipeline and evidence

- Member stages: enquiry → application received → qualification → technical review → offer →
  enrolled. Side states: on hold, unsuitable, withdrawn, closed.
- Enterprise stages: enquiry → qualification → technical scoping → quote → order agreed →
  delivery coordination → closed. **Participant nominations stored separately — an
  organisation order is not eight individual applications.**
- **Enrolment requires two different people:** Sunil's recorded admission decision *and*
  finance-confirmed payment under the approved offer. Attendance stays independent of both.
- A refund creates evidence and a review task. It does not erase historical enrolment or
  attendance.
- Closing or reversing a stage requires a reason; milestone history stays visible.

### 4 · Communications

- Twelve templates from `communication-templates.json` as versioned records. Receipts are
  transactional and immediate; nurture is calendar days 2, 5 and 9 after a saved eligible
  submission, queued at 10:00 Asia/Kolkata.
- **Consent, template approval, cohort availability, stage and suppression are checked twice** —
  at queue time and again immediately before dispatch.
- Stop on reply, meeting booked, offer, payment, withdrawal, unsuitable/closed, unsubscribe,
  hard bounce or complaint. Pause on hold or manual conversation. **Stopped sequences never
  restart automatically**, and a manual resume never sends missed messages in a burst.
- One active sequence per person for this programme. An enquiry becoming an application stops
  the enquiry sequence and raises a human review task rather than restarting marketing.
- **Unsubscribe is one signed opaque action link, no login, no contact details exposed.** No
  literal token belongs in a sent email. Invalid or expired links get a generic confirmation
  and a contact route.
- Provider callbacks are authenticated, deduplicated and tolerate out-of-order delivery. **A
  delivered callback must not override a later bounce, complaint or unsubscribe.** On a
  timeout with unknown outcome, reconcile against the provider reference before retrying.
- Durable outbox so saved leads and email tasks cannot diverge silently. Failed jobs enter a
  visible queue with bounded retries and a staff alert.
- **If reply detection or unsubscribe processing is unavailable, nurture is disabled.**

### 5 · Administration

Staff roles, cohorts, sender verification, template versions, integration health,
import/export, retention configuration, audit history. Secrets never appear in frontend code
or exports.

- **Closing applications is a truthful state:** apply disabled with honest wording, enquiry
  route still available, queued promotional invitations stopped.
- Import validates, previews match and conflict counts, then commits. Conflicting IDs are
  rejected, never silently replaced. An import batch log is kept.
- Export is scoped, keeps the existing tracker fields so client reporting stays compatible,
  and escapes spreadsheet formula prefixes in free text.
- **Retention and erasure stay separate mechanisms**, as they already are in this repo.
  Deletion and unsubscribe are different actions.

### 6 · The wider site

Roadmap IA. **Proposed paths are targets for design, not confirmed live URLs** — inventory the
existing surfaces first, and keep `learning.thelivingcraft.ai` working until routing and
redirects are approved and tested.

```
/                                  cohort page — campaign links point here
/about/  /programmes/{agentic-systems,enterprise}/  /advisory/
/resources/{guides,field-notes,templates}/
/tools/{agent-design-check,architecture-review-skill}/
/contact/
/apply/  /application-received/  /communication-preferences/  /privacy/  /terms/
```

First content release only: the `agentic-system-design` pillar, its three supporting pieces,
the review workbook and the browser checker. Evaluation, reliability and team-review clusters
follow in that order. **The roadmap does not claim any of the sixteen pieces exist.**

**Agent Design Check** — ungated browser checklist, structured yes/no/not-yet-defined answers
across purpose, evidence, tool permissions, external actions, evaluation, uncertainty and
recovery, ownership. Processed in the browser; **no architecture answers retained on the
server, and no lead record created from anonymous use.** Transparent rules reviewed by Sunil,
not a model-generated readiness score. All-unknown input returns a starting checklist, not a
failure grade. Claiming every box is addressed still requests evidence rather than certifying
production readiness.

---

## Records — fourteen, and the collapses they prevent

Stable IDs. Timestamps stored UTC, displayed Asia/Kolkata. Every mutable business record
carries `created_at`, `updated_at` and actor identity. Evidence dates stay separate from entry
dates. Unknown is `null`, with an explanation where reporting needs one.

`person` · `organisation` · `cohort` · `submission` · `opportunity` · `attribution` ·
`consent` · `activity`/`task` · `meeting` · `offer` · `payment` (finance evidence) ·
`attendance` · `communication` · `audit`

Full field lists in
[`Ein_Implementation_References/data-dictionary.csv`](../Website%20Rebuild%2010-09-2026/Ein_Implementation_References/data-dictionary.csv).
The three that carry the most weight:

- **`person` matching is trimmed and case-normalised email only.** Plus-tags are not stripped
  and different addresses are never merged by name.
- **`submission` carries `request_key`.** This is the whole idempotency story. An enquiry can
  later produce an application without losing either record; a repeat application for the same
  person and cohort updates review context, keeps submission history, and still counts one
  applicant.
- **`attribution` holds first-captured and submission-session separately.** Backend application
  counts can legitimately exceed tracked sessions, because analytics is blocked or declined.
  Show both with their definitions rather than reconciling them.

---

## Roles

| Role | Allowed | Restricted |
|---|---|---|
| Alchemy operator | Contacts, qualification, notes, tasks, meetings, approved templates | Cannot approve technical fit or offers, cannot confirm finance |
| Sunil | Technical fit, scope, offer approval, admission | Finance confirmation reserved for finance |
| Finance | Invoice, receipt, refund evidence | Cannot silently alter offer scope or attendance |
| Programme owner | Cohort availability, attendance confirmation, roster | Cannot infer payment from attendance |
| Maintainer (Ein) | Configuration, integration health, staging with synthetic data | Production personal data only when assigned for support |

---

## Analytics

Event taxonomy in
[`analytics-events.csv`](../Website%20Rebuild%2010-09-2026/Ein_Implementation_References/analytics-events.csv).
Two rules do the work:

- **Client analytics uses an opaque event ID — never name, email, phone or free-text answers.**
  `form_error` carries the error category and field name, never the rejected content.
- **Server-side submission success emits one authoritative saved event with `submission_id`,
  and backend totals remain available without analytics consent.** The dashboard does not
  depend on the visitor accepting tracking.

`vsl_*` events come from actual player callbacks only — no guessed completion, and completion
is *unavailable* rather than zero if the player does not support the callback.

---

## What is deliberately out of scope

From the brief: *"No checkout, LMS, new chatbot or payment collection system is required in
this release. Payment evidence comes from finance."*

So: `/caio`, `/assessment`, `/latest`, `/craft` and the existing teaching console are
untouched. The visitor Q&A agent stays as it is — subject to the offer-facts decision below,
which changes what it is allowed to say.

---

## Open decisions — blocked on Sunil

Both are facts about the offer and the business. Each ships behind a flag so answering later
costs one edit.

### D1 · Do we still publish price, dates and the six-week shape?

The new copy publishes none of it: *"30 live hours plus independent work"*, *"targets eight
members"*, and an FAQ answer of *"Confirm the schedule, fees, payment, refund and access terms
in the final offer before committing."* Today [`src/data/facts.ts`](../../src/data/facts.ts)
says six weeks, eight seats, September 2026, and [`src/data/regions.ts`](../../src/data/regions.ts)
drives three published prices through the `?region=` switch.

**The trap:** those figures also feed `/llms.txt`, `/api/facts` and the Q&A agent's grounding.
Removing the price from the page while leaving it in `facts.ts` means **the assistant quotes a
number the page deliberately withholds** — the exact stale-fact failure `facts.ts` exists to
prevent, running in reverse.

| | Page | `facts.ts` | Agent |
|---|---|---|---|
| **A** Publish as today | price + region switch | unchanged | quotes the price |
| **B** Withhold everywhere | no price, no dates | figures removed | "confirmed in the final offer" |
| **C** Off the page only | no price | unchanged | quotes the price |

Until answered: that region of the page carries a marked placeholder behind a flag, and
`regions.ts` and the `/india|/dubai|/australia` redirects stay exactly as they are.

### D2 · How does an email actually get sent?

Web3Forms is client-side only on the free plan and this repo forbids moving it server-side.
It cannot send a receipt, run a sequence, observe a bounce, or honour an unsubscribe.

Needed from the owner: a sending service, a verified sending domain, and a monitored reply
mailbox (`apply@thelivingcraft.ai`) so replies link into lead history. The brief names sender
verification, reply handling and suppression as launch dependencies.

Until answered: the outbox, versioned templates, consent/suppression checks, the signed
unsubscribe endpoint and the failure queue are built with **dispatch off**. Web3Forms keeps
delivering the inbox copy exactly as it does today, so no lead is lost.

---

## Not ours to supply

- **Data controller identity, purposes, processors, contact and retention** — the privacy page
  cannot be written without them, and the brief forbids publishing a generic invented policy.
  Nothing may be collected from a real visitor until it is published.
- **Verified sending domain and a monitored reply mailbox.**
- **Exact-version approval of all twelve messages.**
- **Sunil's factual approval** of programme, founder and offer wording; finance for terms.
- **The VSL recording**, plus captions and transcript.
- **Agreed response capacity.** One business day to acknowledge and two for technical response
  are proposals. **They do not go on the public page as guarantees.**
- **Reconciliation of the four reported enrolments and two positive responses** person by
  person before any appear in a live total.
