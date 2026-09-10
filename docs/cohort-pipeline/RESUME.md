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
> Eleven new tables (`organisations`, `people`, `cohorts`, `form_submissions`,
> `opportunities`, `attributions`, `consents`, `activities`, `tasks`, `audit_log`,
> `staff`) plus `pipeline_submit()` and the append-only trigger on `consents`.
>
> **This cannot be done from a session here** — it is DDL, and the service-role key cannot
> issue DDL over PostgREST. It is a paste into the Supabase SQL editor. The file is
> idempotent; run the whole thing.
>
> Until it is run: the public form returns 503 with a retry and never a false success, the
> console's pipeline screens show "not answering", and `npm run acceptance` reports most
> cases as `not run`. All of that is designed behaviour, not breakage.

---

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

## Where the six stages stand

| Stage | State | Next action |
|---|---|---|
| 1 · Page and three forms that save | **built, verified** | Run the schema, then `npm run acceptance` |
| 2 · Staff screens and named accounts | identity layer **built**; screens **drafted, unaudited** | Verify the screens render and that `unavailable` never shows as `0` |
| 3 · Pipeline and evidence | schema only | Stage writes, meetings, offers, finance, attendance |
| 4 · Communications | not started | Blocked on D2 |
| 5 · Administration | not started | Import/export, retention, staff screen |
| 6 · Wider site | **most pages built**; tools + a few routes in flight | Finish, then sitemap |

---

## What exists right now, by route

Verified with curl against `npm run dev` on `http://localhost:4321`.

**Live and rendering:** `/`, `/about`, `/advisory`, `/contact`, `/programmes/`,
`/programmes/enterprise`, `/resources/guides/`, `/resources/guides/<slug>`, `/privacy`,
plus the untouched `/caio`, `/assessment`, `/latest`, `/craft/*`.

**In flight at the time of writing** (three agents were interrupted by a rate limit; check
before assuming): `/tools/`, `/tools/agent-design-check`, `/terms`,
`/communication-preferences`, `/resources/` (the hub — note `/resources/guides/` already
works).

**Console:** `/craft/admin/pipeline` and `/craft/admin/pipeline/[id]` are drafted and gated
correctly (302 to login without a session). They have **not** been audited for the
unknown-is-never-zero rule, which is the property that matters most on them.

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
`Ein_Acceptance_Register.csv`. Two cases pass today (E03, E17); the rest report `not run`
with a reason. **A harness that counted those as passing would be the defect the register
exists to prevent** — do not "fix" them into passes.

---

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

---

## Suggested order when picking this up

1. Check whether the three in-flight routes landed; finish any that did not.
2. Audit the console pipeline screens for unknown-never-zero. That is acceptance case E14
   and the reason those screens can be trusted.
3. Add the new public routes to `src/pages/sitemap.xml.ts` — **only routes that return 200.**
4. Stage 3: stage transitions with a reason, meetings, offers, finance and attendance.
   Enrolment needs Sunil's admission **and** finance-confirmed payment; they are separate
   people and separate capabilities on purpose.
5. Stage 5's administration screen, so staff accounts can be managed without the CLI.

Stage 4 stays shut until D2 is answered.
