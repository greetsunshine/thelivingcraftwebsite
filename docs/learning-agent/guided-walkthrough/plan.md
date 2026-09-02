# The guided walkthrough — plan

**Status:** design, not built. Nothing here is implemented.
**Written:** 2 September 2026 · revised the same day with Sunil's four decisions.
**Sits under:** [../build-status.md](../build-status.md) · a new item, not one the
learning-agent spec asked for.

---

## 1 · The four decisions, and what they changed

| | Decision | Effect |
|---|---|---|
| 1 | Auto-start on first sign-in. Nudge up to three more times during the first weeks if unfinished. A permanent ⓘ afterwards. | Needs three columns on `learners` (§5) and a nudge ladder (§6). |
| 2 | **Spine first, then tours on demand** — not one long walkthrough. | Big architectural simplification: **no tour ever crosses a page** (§4). |
| 3 | Familiarity comes out of the sidebar; it appears as a dashboard card when due. | §10. Correcting an earlier mistake of mine, not a new feature. |
| 4 | The right-hand Guide panel becomes real later, as a doubts widget. | Specced in §12 so it is not re-litigated; not in this build. |

**Decision 2 is the one that matters technically.** The original design had a 19-step
sequence walking *into* six pages, which meant tour state had to survive a navigation —
the hardest part of the whole feature, and the source of most of its failure modes. A
spine that stays on the dashboard, plus per-page tours that stay on their page, means
**every tour runs within a single route**. Step state can live in a closure for the
duration and die with the tour. No `?tour=` step index, no resume-after-swap, no
`ClientRouter` re-entry bug, no redirect loop guard.

That removes about half the risk in §11 of the first draft, and most of the code.

---

## 2 · What gets built

**The spine — 6 steps, ~90 seconds, on `/craft` only.** Lights up each sidebar icon in
turn and says what that surface is *for*. It is a map, not a walk. This is what
auto-starts on first sign-in, and completing or skipping it is what "done" means.

**Six page tours — 2–3 steps each, on demand.** Each surface has its own short tour,
launched from the ⓘ when the learner is actually on that page. Teaching arrives when it is
relevant rather than four minutes up front — which matters for an audience of eight
director-level engineers who will close a long tour on day one.

**A permanent ⓘ.** Bottom-left, always there. Nobody is ever locked out of the
explanation by having skipped it once.

---

## 3 · Constraints it has to live inside

Repo rules, not preferences.

| Rule | Consequence |
|---|---|
| **No `localStorage` / `sessionStorage`, anywhere** | Nudge counts and completion live in Postgres. Nothing about the tour is remembered client-side. |
| **`/craft` is never prerendered** | No build-time step, no static asset that dodges the gate. |
| **All `/craft` pages go through `CraftLayout.astro`** | Mount the overlay once there, not per page. |
| **`CraftLayout` uses `<ClientRouter />`** | Bind on `astro:page-load`, not `DOMContentLoaded`. Still true even though tours no longer cross routes — the ⓘ has to survive every swap. |
| **`craft.css` is additive; namespace anything generic** | Everything is `tour-` prefixed. |
| **A panel gets a shadow *or* a border, never both** | Applies to the popover and the nudge card. |
| **If it is yellow it is clickable; `--sun` is a fill and cannot carry text** | The spotlight ring may be sun. Step copy may not sit on sun. |
| **Offer facts come only from `facts.ts`** | Any copy mentioning weeks, seats or commitment reads them. |

---

## 4 · Architecture

Tours are **data in one module**, `src/lib/craft/tour.ts` — same reasoning as `facts.ts`
and `radar-categories.ts`: the whole script reviews as one diff and reads end to end
without opening seven files.

```ts
interface TourStep {
  id: string;
  target?: string;   // '[data-tour="quiz-confidence"]'; omitted = centred card
  title: string;
  body: string;      // one or two sentences, no markup
  placement?: 'top' | 'right' | 'bottom' | 'left';   // a hint, not a promise (§8)
}

interface Tour {
  id: 'spine' | 'modules' | 'doubts' | 'quiz' | 'adr' | 'feedback';
  label: string;     // 'What's on this page?'
  route: string;     // every step in a tour lives on this one route
  steps: TourStep[];
}
```

**`route` is on the tour, not the step.** That is the invariant decision 2 buys, and it
should be enforced rather than assumed: a tour whose steps need two routes is not
expressible in this model.

Deliberately absent:

- **No `action` / "click this for me".** A tour that drives the UI can submit a real ADR or
  a real quiz answer. It points; it never presses.
- **No branching.** Linear sequences. Conditional tours are how tours rot.
- **No per-step URL state.** `?tour=spine` remains as an *entry point* — so the nudge card
  and a link can launch a tour on load — but never as a step cursor.

---

## 5 · Storage

Three columns on `learners`, all additive and nullable-or-defaulted:

```sql
alter table public.learners add column if not exists tour_completed_at timestamptz;
alter table public.learners add column if not exists tour_offers int not null default 0;
alter table public.learners add column if not exists tour_offered_at timestamptz;
```

| Column | Meaning |
|---|---|
| `tour_completed_at` | Set when the spine is **finished or explicitly skipped**. Null = still eligible to be offered. |
| `tour_offers` | How many times it has been put in front of them. `1` is the auto-start; `2`–`4` are the nudges. |
| `tour_offered_at` | When last offered, so a nudge cannot fire twice in a day. |

**Why not reuse `last_seen_at`.** It looks like a first-login flag and is not one:
[learners.ts:87](../../../src/lib/craft/learners.ts#L87) stamps it on *every* authenticated
request, so it is non-null before the learner has read step 1. Keying off it would mean
someone who closes the tab on step 3 is never offered the tour again, having seen three
steps of six.

These columns are on `learners`, so they are erased by the existing hard delete on
`/admin/learners` with no new work. Nothing here is personal data beyond "did this person
read the intro", but it goes when they go.

`/admin/learners` gets a quiet column — *toured / offered ×3 / not yet* — which is
genuinely useful in week 1 when someone says they cannot find something.

---

## 6 · The nudge ladder

> *"At least the first week, if they don't complete the whole guided learning workflow,
> nudge them two or three times."*

**Offered at most four times, then never again:**

| | When | What they see |
|---|---|---|
| 1 | First sign-in | The spine auto-starts. |
| 2–4 | A later day, if `tour_completed_at` is null | A dismissible card at the top of the dashboard. Not an auto-start — being grabbed by an overlay you already escaped is worse than being asked. |

**Gates, all of which must pass:**

- `tour_completed_at is null`
- `tour_offers < 4`
- `tour_offered_at` is before today — at most one nudge per calendar day
- within **14 days of `learners.created_at`** (when the seat was issued)

**Why 14 days from seat issue rather than "programme week 1".** There is no
machine-readable cohort start date — `cohort.startsOn` in `facts.ts` is the display string
`'September 2026'`. Seats are also issued on a rolling basis, so "their first week" and
"the cohort's first week" are different things, and the learner's own first week is the one
that matters here. Flagged as a gap in §14 either way.

**The third nudge says it is the last.** *"Last time we'll ask — the ⓘ at the bottom left
opens it whenever you want."* Telling someone you will stop asking is both more honest and
more effective than asking a fourth time.

**Completion means the spine**, not the spine plus six page tours. Nudging someone through
six optional tours would be nagging, and the page tours are meant to be pulled, not pushed.

---

## 7 · The permanent ⓘ

**Bottom-left of the sidebar, in `.sidebar-bottom`, above Sign out.**

The alternative you offered was the top of the page. There is no top chrome to put it in —
`CraftLayout` is a 64px left rail and a scroller, and each page renders its own hero, so a
top-right ⓘ would have to be added to seven pages and would sit at a different height on
each. The rail already has a bottom group, it is on every page at the same place, and it is
*outside* the nav group — which matters, because the nav group means "places you go" and
help is not a place. It is also the conventional home for it.

**Styled like the other rail icons** — ghost, `--ink-faint`, hover to `--ink`. Not sun.
Sun is for the thing the tour is currently pointing at; an escape hatch that shouts
competes with the six surfaces for attention every day, forever, to say the same thing.

**On click**, a small popover with at most two items, contextual to where they are:

| On | Items |
|---|---|
| A surface with its own tour | *What's on this page?* · *Take the 90-second tour* |
| The dashboard | *Take the 90-second tour* |

No unread dot, no "you haven't seen this yet" state — that would need per-page tracking,
which means more columns for very little.

---

## 8 · Anchoring: the `data-tour` contract

Steps target `[data-tour="…"]`, never a class or a DOM path. A class is a styling decision
someone renames in a redesign, silently breaking the tour with no error anywhere.
`data-tour="quiz-confidence"` declares *this element is explained by the tour* — it
survives restyling, and `grep -r data-tour src/` lists every commitment the tour has made.

**Every `data-tour` attribute is a contract.** §9 covers forgetting one.

| File | Values |
|---|---|
| `CraftLayout.astro` | `nav-modules`, `nav-doubts`, `nav-quiz`, `nav-adr`, `nav-feedback`, `tour-help` |
| `craft/index.astro` | `factbar`, `intake-card`, `activity`, `reading` |
| `craft/modules.astro` | `week-list`, `week-card` |
| `craft/doubts.astro` | `doubt-split`, `doubt-history` |
| `craft/quiz.astro` | `quiz-card`, `quiz-confidence` |
| `craft/adr.astro` | `adr-sections`, `adr-actions` |
| `craft/feedback.astro` | `feedback-form`, `feedback-changes` |

---

## 9 · The script

### The spine — `/craft`, 6 steps, ~90 seconds

| # | Target | What it says |
|---|---|---|
| 1 | *(centred)* | What this place is, that it takes ninety seconds, that Escape leaves at any point and the ⓘ brings it back. |
| 2 | `nav-modules` | Session material — one page a week, filling in as the cohort runs. |
| 3 | `nav-doubts` | **The important one.** Two kinds of question: dates and deadlines answered here from the syllabus, anything about the material goes to Sunil — never answered by a model improvising. |
| 4 | `nav-quiz` | Calibration, not examination. Nobody is scored or ranked. |
| 5 | `nav-adr` | One page a week on the decision that week's drill forced. |
| 6 | `nav-feedback` | Two questions after each session — and what changed because of them comes back here. Ends by pointing at the ⓘ. |

Step 1 also names the intake if it is unsubmitted, since that is the one thing actually due
before week 1.

### The page tours — 2–3 steps each, pulled from the ⓘ

| Tour | Steps |
|---|---|
| **Modules** | `week-list` — six weeks plus pre-work. · `week-card` — ready vs. still being written. |
| **Doubts** | `doubt-split` — the two-way split, and that the material half reaches a person. · `doubt-history` — what Sunil sees: the same question from five people, grouped. |
| **Quiz** | `quiz-card` — one question at a time, after the session. · `quiz-confidence` — **the point of the feature**: confident-and-wrong is the only dangerous state; a low rating costs nothing and tells Sunil something true. |
| **ADR** | `adr-sections` — five sections, same every week; Alternatives is the load-bearing one. · `adr-actions` — draft freely, submitting freezes it, and the one-page cap is deliberate. |
| **Feedback** | `feedback-form` — two questions, sixty seconds. · `feedback-changes` — what changed because of them. |

**Every step must read correctly on an empty page.** A first-time learner has no doubts, no
submissions and no answers, so copy describes what a surface is *for* and what will appear
— never "here are your results".

**Familiarity has no tour.** Per decision 3 it is not in the sidebar at all, and in week 1
it is a form about week 6 with nothing to compare against.

---

## 10 · Familiarity moves to a dashboard card

Not part of the tour, but decided alongside it and it changes the sidebar the tour points
at, so it lands in the same build.

**Intake and familiarity are the same object** — the thirteen-question form, once at week 0
and once at week 6. Intake is already a dashboard card that changes state
(`To do` → `In progress` → `Done`) and is deliberately not in the rail. Familiarity should
match it exactly.

A rail is for things you return to. A form answered twice, ever, is not that — and for
weeks 1–5 that icon leads to a page asking someone to re-rate themselves against nothing.

- Remove `/craft/familiarity` from `CraftLayout`'s nav group.
- Add a dashboard card that appears **once week 6's session has `taughtOn` set**. That is
  data that already exists and Sunil controls by editing frontmatter — no new date
  plumbing, and it cannot fire early.
- The page itself stays exactly as it is and remains reachable by URL.

*(I added that icon during the "link the orphan pages" fix. I was solving `unreachable` and
reached for the nearest lever instead of asking where the thing belonged.)*

---

## 11 · Rendering

Mounted once in `CraftLayout.astro`.

**Scrim + spotlight.** One fixed overlay. The hole is cut with
`box-shadow: 0 0 0 9999px rgba(…)` on a positioned `pointer-events: none` rect tracking the
target's bounding box — one element, no SVG mask, no four-div frame, and it animates
cheaply between steps. A `--sun` ring marks the cut-out.

**Popover.** Chapter label, title, body, progress dots, `Back` / `Next` / `Skip`. Border
**or** shadow, not both. Positioned from the target rect with the step's preference, then
flipped if it would leave the viewport and clamped to a margin. Centred when there is no
target.

**Scroll into view** before measuring — `scrollIntoView({ block: 'center' })`, then measure
on the next frame, or steps below the fold get spotlit off-screen. Mostly moot for the
spine (the rail is always visible) and load-bearing for the page tours.

**Keyboard.** `→`/`Enter` next, `←` back, `Escape` exits. Focus moves into the popover and
is trapped there while it is open, returning to the trigger on exit.

**Reduced motion.** `prefers-reduced-motion: reduce` drops the scrim and popover
transitions and the smooth scroll. Not decoration — full-screen dimming animation is a
genuine problem for some people.

**No library.** `driver.js` or `shepherd.js` would supply positioning and the scrim, but
this is a gated page in a repo whose stated posture is minimal client JS, and with no
cross-route state the whole mechanism is ~180 lines. The only fiddly part is edge-flipping,
which is bounded.

---

## 12 · Failure modes

The tour points at markup that changes. It must degrade, never trap.

| What happens | Behaviour |
|---|---|
| Target matches nothing | **Skip the step**, log once, continue. Never a spotlight at `(0,0)`, never a dead Next. |
| Every step in a tour is missing | The ⓘ does not offer that tour. |
| `?tour=` names an unknown id | Ignore it, render the page normally. |
| `?tour=` names a tour for another route | Ignore it. Tours no longer navigate, so this is always a stale link, never a redirect. |
| The Supabase write for `tour_offers` fails | Fire-and-forget, same as every other write on a visitor path. Worst case someone is offered the tour once more than intended. |
| A `data-tour` element is deleted in a redesign | The step self-skips. **A CI check that every `target` in `tour.ts` matches at least one `data-tour` under `src/` catches it at review time** — cheap, and part of the build below. |

---

## 13 · Build order

| # | Step | Schema? |
|---|---|---|
| 0 | `data-tour` attributes on the rail and the dashboard | no |
| 1 | `src/lib/craft/tour.ts` — the spine's six steps | no |
| 2 | `TourOverlay.astro` — scrim, spotlight, popover, keyboard, reduced motion | no |
| 3 | The ⓘ in `.sidebar-bottom`, with its popover | no |
| 4 | Remaining `data-tour` attributes + the five page tours | no |
| 5 | `learners` columns, auto-start on first sign-in, `/api/craft/tour` to record completion | **yes** |
| 6 | The nudge card and its ladder | no (uses 5) |
| 7 | Familiarity out of the rail, into a dashboard card (§10) | no |
| 8 | CI check: every tour target exists under `src/` | no |

Steps 0–4 ship a working, launchable tour with no schema change at all. Only step 5 needs
`supabase/schema.sql` run before deploy.

---

## 14 · The Guide panel — a later build, specced so it is not re-litigated

`src/components/craft/GuideSidebar.astro` is the right-hand panel on every `/craft` page.
It is a chat interface, and it is a mock: `setTimeout` plus four
`if (prompt.includes(...))` branches
([GuideSidebar.astro:81–107](../../../src/components/craft/GuideSidebar.astro#L81-L107)).

**Two things make it worse than an ordinary placeholder.**

*It is a mock of the design that was killed.* Its canned replies mention "the new DLQ
finding on PR #14" and "the D5 finding" — the PR-review pipeline and the D1–D5 dimensions
from the 28 August PoC, both explicitly cut by the 2 September spec (§1, §10). The panel
advertises a product decision that was reversed.

*Made real as written, it would violate §5.1.* Ask it "explain the worker-loop" and it
returns a substantive technical answer. That is a content question answered with a fresh
opinion — exactly what the doubts rewrite removed. Rebuilding it as a working tutor chat
would reintroduce that bug in a more prominent position than it ever had.

### What it should become

**A doubts widget in chat clothing.** Not a tutor. The same two-way split that
`src/lib/craft/doubts.ts` already implements, in an always-present panel instead of on one
page:

- Typed question → `POST /api/craft/doubts`, exactly as `/craft/doubts` does now.
- **Logistics** are answered inline from `facts.ts` and session frontmatter, with the
  citation the code already returns.
- **Anything about the material** is captured, tagged, and the panel says so plainly:
  *"Sent to Sunil — he reads these before the next session."* No improvised answer.
- Where Sunil has already answered that question, his answer is relayed verbatim with its
  date — the relay path that exists.
- The chips become real: *"What's due this week?"*, *"When is the next session?"* — questions
  the grounded half can actually answer — not "I disagree with the D5 finding".
- The one canned reply that maps to something real is *"I've drafted a message to Sunil"*.
  That is the escalation relay, and it is now `POST /api/craft/doubts-send-to-sunil`.

Net effect: the panel becomes a second entry point to a feature that is already built and
already correct, rather than a second implementation of anything.

### Until then

**It cannot be narrated by the tour, and it should not be on screen when the tour runs.**
A walkthrough is the one moment where the product claims to be telling you the truth about
itself; spotlighting a control whose answers are `setTimeout` is the worst possible place
to be caught. Either it is converted before the tour ships, or it is removed from
`CraftLayout` and comes back when it is real. **The tour cannot ship over the top of it.**

---

## 15 · Out of scope, and open gaps

**Out of scope**

- Tours of `/admin`. Sunil built it; one operator does not need onboarding.
- Any step that performs an action — submitting, saving, filling a form (§4).
- Per-learner analytics on tour drop-off. Eight people; ask them.
- Localisation.

**Open gaps this surfaced**

- **There is no machine-readable cohort start date.** `cohort.startsOn` is the display
  string `'September 2026'`. The nudge window works around it by counting from
  `learners.created_at`, and the familiarity card works around it by waiting for week 6's
  `taughtOn`. Anything genuinely calendar-aware will need a real date in `facts.ts` first.
- **The `/craft` gate is still bypassed.** `src/middleware.ts:99` injects a mock learner and
  returns before the seat check. Independent of this feature and it has to come out — but
  the tour must not be written assuming `locals.learner` always exists, and must never
  render on the login page.
