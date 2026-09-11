# Resume here

**If you have been asked to "continue the work", read this file first, then
[`build-status.md`](build-status.md).** This is the operational checkpoint: where the work
actually stands, what to pick up next, and what is waiting on somebody else.

Keep it current. Update it whenever you finish something or discover something that would
cost the next session an hour to rediscover. It is short on purpose — the detail lives in
`build-status.md` and in the code comments.

**Last updated:** 11 September 2026
**Branch:** `feat/cohort-pipeline`, stacked on `feat/learner-dashboard-poc` (PR #6). PR #7.
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

## ⚠ QA finding, 11 September — facts.ts contradicts itself, and crawlers get both halves

`src/data/facts.ts:352` answers *"Do you have testimonials, client names, or student
outcomes?"* with:

> "**None are published.** … 26 years at Google, Amazon, and Walmart, **100+ senior engineers
> mentored, ~100 senior leaders and directors trained**, and a live enterprise AI-adoption
> engagement in progress."

Those are student counts, which CLAUDE.md's hard rules forbid **by name**, sitting in the
same sentence that says none are published. `/llms.txt` renders them immediately above the
line "There are no published testimonials, client names, or student counts."

**Neither figure has any provenance in this repository.** CLAUDE.md's own Instructor section
lists "100M+ users served; 150 engineers led" — it does not mention mentoring or training
counts. They appear only here.

And the V4 factual review is explicit on this class: *"never infer or publish user counts"*,
and every product or programme claim needs a dated record and an approver before it may be
used.

**Not fixed, deliberately, and it should travel with D1.** Both findings are the same file
and the same blast radius: `facts.ts` feeds JSON-LD, `/llms.txt`, `/api/facts` and the Q&A
agent's grounding, and any edit means re-running `npm run eval`. Doing it once, with Sunil,
is right; doing it twice is how the grounding and the eval baseline drift apart.

The wider biography cluster is the same question — `/caio` and `/assessment` carry a stat
band (26+ years, 3 Fortune-100s, 100M+ users, 150 engineers) plus "31 billion executions a
week", "re-architected Prime's membership core", "modernised 300+ products". All predate
this work, all are richer than the permitted claim, and all belong in that one review.

---

## ⚠ QA finding, 11 September — D1 is leaking further than documented

Every public **page** is clean: no price, no week count, no seat cap, no start-date claim,
verified by fetching all sixteen and grepping the rendered HTML.

**`/llms.txt` and `/api/facts` are not.** Both are public, both are generated from
`facts.ts`, and both currently publish the six-week shape, the eight-seat cap, the September
2026 start and `₹1,50,000`. And `robots.txt` deliberately allows AI crawlers — which is a
sound decision on its own terms and is exactly what makes this sharp. The site is not merely
willing to answer a question about price; it is **syndicating the withheld figures to every
crawler, in a file built to be consumed.**

The live state is therefore not D1 option A and not option B. It is option C arriving by
accident rather than by decision, and broader than option C was ever described.

**Not fixed, deliberately** — changing what the site tells the world about pricing is D1 and
D1 is Sunil's. Whoever resolves it must move `facts.ts`, `/llms.txt`, `/api/facts` and
`PUBLISH_OFFER_FIGURES` together, then re-run `npm run eval`, because the agent's grounding
moves with them. The full note is at the head of `src/data/offer-display.ts`.


## Two decisions belong to Sunil, and both ship behind a flag

Neither blocks any other work. **Do not resolve either by inference.**

**D1 — do we still publish price, dates and the six-week shape?**
Held by `PUBLISH_OFFER_FIGURES` in [`src/data/offer-display.ts`](../../src/data/offer-display.ts),
currently `false`. The page, its JSON-LD and every new page withhold all of it.
**The live edge:** `facts.ts` still holds the figures and still grounds the Ask widget, so
the assistant will quote a rate the page does not show. `facts.ts` also describes a
different syllabus from the delivered copy. Both are documented at the head of
[`src/data/cohort-copy.ts`](../../src/data/cohort-copy.ts).

**D2 — how does an email actually get sent?**
Nothing is wired. Needs a provider, a verified sending domain and a monitored reply
mailbox. Until then the browser notifies `apply@thelivingcraft.ai` through Web3Forms after
a committed save, so an application still reaches a human.

Plain-language explainer for Sunil:
https://claude.ai/code/artifact/529e50fc-74a7-4e62-b162-3940f5b53d2a

---

## Nothing is in flight

All six stages are built. The work that remains needs somebody who is not us — see
*Waiting on somebody who is not us* below — or an applied schema.


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
