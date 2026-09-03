# Handoff: rebasing this branch onto main

**Branch:** `feat/learner-dashboard-poc`
**Written:** 3 September 2026
**Read first:** [build-status.md](build-status.md) — what this branch actually contains.

---

## Where things stand

The branch and `main` forked at `780a923`. `main` has moved a long way since: a layout
rebuild, real teaching content, and the console's relocation to `/craft/admin`.

**The console move is already done here** (`d53d8b8`). This branch serves the console at
`/craft/admin`, with `main`'s gate ordering, restyle, `robots.txt` change and `?next=`
exclusion replicated rather than reinvented — so those files should merge cleanly instead
of conflicting.

What remains is the rest of the rebase.

---

## The one thing you must not get wrong

`/craft/admin/leads` matches **both** `isAdminPath` and `isCraftPath`. The console prefix
is tested **first**, and `craftGate` only ever sees what it declined.

**Reversed, a learner's seat code — which all eight participants hold — opens the leads
ledger, the questions log, and every other learner's intake answers.**

This branch and `main` now express that identically, so a merge should not disturb it.
**Verify it anyway after any rebase**, by hand, on a running server:

```
/craft/admin/leads      → 302 to /craft/admin/login   (NOT /craft/login)
/api/craft/admin/purge  → 401
/craft                  → 200
```

If `/craft/admin/leads` returns 200 while a learner session is active, the order has been
inverted. That is a security regression, not a styling bug.

---

## What still conflicts

| File | Guidance |
|---|---|
| `src/layouts/CraftLayout.astro` | **Take main's, then decide.** Main rebuilt it as a three-destination top nav; our version is the icon rail plus the bottom agent dock. Neither is obviously right — main's comment says "no submenus", and our five extra learner pages need a home. **Ask Sunil**; do not settle it in a merge. |
| `docs/teaching/quiz/week-1.md` | **Take main's.** 328 lines of real questions against our one-item placeholder. But main's prose format (`### Q1 · Title`, `✅`, free-text rationale) is **not** what `parseWeekFile()` reads. Do not rewrite his teaching material into our format to make the parser happy — raise it as a decision. |
| `src/pages/craft/{index,intake,notes}.astro`, `src/content/sessions/week-*.md` | Prefer main's. Re-apply our dashboard additions (activity counters, reading suggestions, intake card, to-do panel) onto main's version rather than merging line by line. |
| `CLAUDE.md`, `docs/teaching/README.md` | Combine; the sections are mostly disjoint. |
| `supabase/schema.sql`, `src/lib/admin/health.ts` | Trivial — keep both sides. |

### Still genuinely undecided

**`content.astro` and the `published` pricing flag.** Main's version reads a `published`
field from a `facts.ts` this branch does not have — part of "serve Dubai and Australia
without publishing their rates". That is a change to **public pricing behaviour**, not
styling. Ours is the restyled pre-flag version. This needs a decision, not a merge.

---

## After any rebase

```bash
export PATH="/c/Program Files/nodejs:$PATH"   # nvm default is Node 20; Astro needs >= 22.12
npx astro check    # expect 0 errors
npm run build
```

**The baseline is 0.** It was 8 (all in the deleted `GuideSidebar.astro`) and 11 before
that. If three errors reappear in `middleware.ts` complaining about a `Learner` missing
`note` and `last_seen_at`, **someone has reintroduced an auth bypass** — that is what
those errors mean, not type drift.

Then update [build-status.md](build-status.md) and PR #6's description in the same pass.

---

## Two standing notes

**The schema is ahead of production.** `doubts.answer_source`, `submissions.status` and
the `feedback_responses` table are not applied. `supabase/schema.sql` is idempotent — run
the whole file before any deploy.

**The agent dock's replies are still keyword-matched.** Moving it to the bottom of every
`/craft` page was done; wiring it to `/api/craft/doubts` is specced in
[guided-walkthrough/plan.md](guided-walkthrough/plan.md) §14 and not built.
