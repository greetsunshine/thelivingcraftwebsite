# The Living Craft — Design System

**Status: one direction, applied.** An earlier round carried three competing foundations
(Field Manual, Marginalia, Instrument). A reference was then supplied — a rounded,
illustration-led course product in black, ember and sun — and the system was retargeted to
it. Those three directions and their applied fragments have been deleted. `tokens/theme.css`
now holds every value on `:root`.

The retarget touched one file. No component was edited, because components read semantic
token aliases only — which was the point of the contract.

---

## 1. Company context

The Living Craft is an application-only, 6-week programme in **agentic systems
architecture**.

| | |
|---|---|
| Cohort size | 8 seats |
| Fee | ₹1,20,000 |
| Length | 6 weeks |
| Taught by | one person |
| Members | staff+ engineers, architects, directors of engineering, 10+ years shipping systems |
| Geography | India, Dubai, Australia (IST / GST / AEST) |
| What it sells | senior judgment, not tutorials — *"anyone can show you the agent pattern; I can show you the three times it failed in production"* |

### Surfaces the system has to cover

1. **Public marketing site** — programme page, application flow.
2. **Research / field-notes publication** — long-form reading, cited, often unfinished.
3. **Gated cohort area** — working surfaces for eight people.
4. **Agent surfaces** — a reviewer agent that reads members' pull requests and reports
   findings; a guide agent; a scout agent that gathers research.
5. **Admin console** — one operator, high information density.
6. **Printable takeaway artifacts** — must survive being printed in one ink.

### Constraints that shaped the work

- **Eight people.** The system must feel small and deliberate, never scaled.
- **Agent output is everywhere** and needs a visual language for provenance, uncertainty,
  citation and refusal. This is the system's real subject matter, so it is modelled first
  (`components/agent/`), not bolted on.
- **Content arrives late and incomplete by design.** Empty and unwritten states are
  first-class surfaces (`components/state/`), with their own tokens.
- **One person makes everything.** Small token contract, small component set, no CSS
  framework, no build step.

### The tension this direction creates

The audience is senior and skeptical, and the reference direction is warm and friendly.
That is a real trade, and it is resolved by division of labour rather than compromise:
**the geometry is warm, the copy stays severe.** Rounded cards and a yellow pill do the
welcoming; the words never do. Nothing in §2 was softened to match the new palette. If a
sentence starts sounding like marketing because the surface got friendlier, the sentence is
wrong, not the surface.

### Sources given

Prose brief plus four reference images. No codebase, no Figma file, no logo, no font
binaries. Nothing here is a recreation of an existing product — the reference supplied the
palette, the type character, the radii and the elevation language; the layout, content and
component set are this system's own.

- Codebase: *not supplied*
- Figma: *not supplied*
- Logo / brand assets: *not supplied* (see §7)
- Fonts: *specified but not supplied* — Sofia Pro is licensed; a stand-in is loaded (§6)
- Illustration set: *not supplied* — the direction depends on it (see §3, §9)

---

## 2. Content fundamentals

**Person.** First person singular, always. The programme is one person, so the copy says
*I*, never *we*: "I read every application myself." The reader is *you*. Never "our
members", never "students", never "learners" — **members**.

**Tense.** Past tense for evidence, present for mechanics. Claims about what works are told
as things that already happened: "In two incidents six weeks apart, the same wrapper looked
idempotent and wasn't."

**Specificity instead of adjectives.** No adjective of praise appears anywhere in the UI
(*transformative, cutting-edge, world-class, powerful, seamless*). A number replaces every
adjective it can: 8 seats, ₹1,20,000, 6 weeks, 4 findings, run 118, three times it failed.

**Sentence length.** Short declaratives, then one longer sentence that carries the
reasoning. Never three short punchy fragments in a row — that is the register of the thing
we are avoiding.

**Casing.** Sentence case throughout, including field labels and table headers
(`--case-label: none`). *Amended in this direction:* the old rule reserved UPPERCASE for
apparatus. This direction has no room for it — caps read as shouting against soft geometry.
The human/machine split is now carried by **face** alone: prose in the core family,
apparatus and machine speech in the mono face at `--size-1`.

**Numbers.** Indian grouping for money (₹1,20,000). Tabular figures everywhere
(`--font-features`). Confidence is a fraction (4/5), never a percentage — 87% implies a
calibration nobody has. Timestamps carry the zone (04:12 IST).

**Agent voice.** Agents also speak in the first person and admit limits: "I could not open
the consumer, so I have not checked the acknowledgement order." Agents never use exclamation
marks, never apologise twice, never say "Great question". A refusal is a full sentence with
a reason and a next step.

**Emptiness.** Empty states name what will appear, who writes it and when: "Cohort 05 has no
reading list yet. It is written in week 1 from what the eight of you bring." Never "No
results found", never "Nothing here yet!".

**Emoji: never.** Not in UI, not in agent output, not in email. There is no exception.

### Examples

| Write | Not |
|---|---|
| Eight seats. I read every application myself and most get a no. | Join an exclusive cohort of industry leaders! |
| No findings on this pull request. The reviewer agent runs on push; nothing has been pushed since Tuesday. | No data available. |
| I won't summarise this incident — the postmortem is a draft and two of its claims contradict each other. | Sorry! I'm not able to help with that right now. |
| Hedged: I could not read the consumer. | Confidence: 62% |

---

## 3. Visual foundations

**Colour.** Four values carry the identity, and each has exactly one job.

| Token | Value | Job |
|---|---|---|
| `--noir` | `#000000` | Hero surfaces. **One black area per view**, never two. Not used for text. |
| `--ember` | `#fd8549` | Promotional and secondary feature cards; machine provenance. |
| `--sun` | `#ffc123` | Every action. If it is yellow, it is clickable. |
| `--mist` | `#f1f3f5` | The sunken ground that white cards float on. |
| `--berry` | `#eb1450` | Fifth value: focus ring, error, refusal, rating marks. |

**Three colour rules that came out of QA, not out of the reference.**

- **Ember carries ink text, never white.** White on `#fd8549` is 2.43:1 and fails even the
  large-text threshold; slate-black on ember is 6.7:1. The reference does set white on
  orange — this system does not.
- **Sun cannot carry error.** `--danger` is a separate token, because the previous direction
  conflated accent and error and yellow error text tested at 1.6:1. It is split in two,
  because the text bar and the mark bar differ: **`--danger` `#cf0f45`** is the ink (5.5:1
  on white), **`--danger-mark` `#eb1450`** is for fills, dots and the focus ring (3:1 bar).
- **`--text-faint` is not a text colour on white.** `#a3acb8` is 2.29:1. It is legitimate on
  noir (9.15:1) and for non-essential scaffolding — placeholder labels, slot captions — and
  nowhere else. Every real label takes `--text-quiet` (4.49:1). Minimum label size is 11px
  in specimen chrome and `--size-1` (12px) for content.
  **Note:** `--agent-cite` currently resolves to `--ink-3`, which violates this rule. See
  `reference/CORRECTIONS.md` §8.

Text is `#16212e` slate-black, never pure black — black belongs to surfaces, so the hero
card stays the darkest thing on screen. The white-on-mist relationship is the whole layout:
cards are white, the ground is mist, and depth comes from shadow rather than rules.

**Radii are the brand.** `--radius-inner` 16 · `--radius-panel` 24 · `--radius-card` 28 ·
`--radius-shell` 40 · `--radius-pill` 999. Nothing in the system is square except the page.
Every button and every avatar is a full pill.

**Elevation replaces rules.** `--shadow-raise` for resting cards, `--shadow-lift` for hover
and selection, `--shadow-overlay` for dialogs and the app shell. All three are wide,
low-opacity and nearly colourless. **Never a border and a shadow on the same element** — a
raised card has no outline, and a hairline is only used inside an already-raised card.

*This reverses the previous direction, which banned shadows outright. It is the single
biggest change the reference imposed, and it is a real cost: soft elevation is harder to
keep honest than a 1px rule, and it degrades on print. §9 covers that.*

**Type.** One family — Sofia Pro, stood in for by Figtree — plus JetBrains Mono for figures,
identifiers and machine output. Display is 800 weight at `--tracking-display: -0.025em` and
`--lh-tight: 1.08`; headings are set tight and wrap early on purpose, two or three short
lines rather than one long one. Body is 400 at 15px / 1.55. Nothing in a working surface is
below 12px; nothing in a reading surface below 15px.

**Imagery is load-bearing.** The reference is illustration-led, and the direction does not
survive without it: flat vector illustration, no outlines, built from the palette plus one
pink and one deep maroon, with an organic blob as the ground shape. **None has been drawn** —
every image position is a labelled placeholder with its intended pixel size. Two positions
exist: the hero card (~1200×900, on black) and the promo card (~600×600, on ember). This is
the largest open dependency in the system.

**Density.** Generous by default: 44px pill height, 60px list rows, 24px card padding. That
geometry cannot carry an admin table, so the theme ships one compact override —
`data-density="compact"` on a container tightens rows, padding, radii and body size using
the same token names. Use it for tables and log views; never for the marketing site.

**Motion.** `--motion-fast: 90ms`, `--motion-base: 160ms`, `--motion-slow: 260ms`, easing
`cubic-bezier(.22,.61,.36,1)`. Only opacity, colour, shadow and small position changes are
animated. No spring, no bounce, no staggered reveals, no skeleton shimmer. Loading is a
static line of mono text stating what is running (`run 118 · reading 3 files`).

**Interaction states.** Hover: background steps to `--surface-hover`, or a card's shadow
steps from raise to lift. Press: `translateY(1px)`. Focus: `2px` solid `--berry` outline at
`2px` offset, always visible, never removed. Disabled: `opacity .42` and pointer-events off.

**Fixed elements.** At most one: the icon rail on working surfaces. No floating action
buttons, no sticky CTAs, no toasts. Notifications appear in place, in the surface they
belong to.

**Agent provenance (the domain language).** Five states, each with a fixed mono sigil so it
survives print and plain text: `[M]` machine-read, `[H]` human-approved, `[~]` hedged,
`[×]` refused, `[†]` cited. Unmarked text is human-written — that is the contract that makes
the marks worth reading. This direction can afford colour, so each sigil also has an ink and
a tint: human is ink, machine is ember, hedged is sun, refused is berry, cited is grey.

**Unwritten and empty.** `--state-unwritten-line` is a dashed repeating gradient standing in
for lines that do not exist yet, with a mono label saying who owes the text. Unwritten
content is visible in production; hiding it would misrepresent the programme.

---

## 4. Token contract

`styles.css` is imports only:

- `tokens/fonts.css` — webfont loading (Google CDN stand-in; see §6)
- `tokens/contract.css` — the shared spine: motion, easing, z-layers, breakpoints, focus
- `tokens/theme.css` — every value, on `:root`, plus the `[data-density="compact"]` override
- `tokens/reset.css` — minimal element reset, reads semantic aliases only

Naming: `--<layer>-<role>-<modifier>`. Base layers are brand (`noir`, `ember`, `sun`,
`mist`, `berry`), `paper`, `ink`, `line`, `accent`. Semantic aliases are `text-*`,
`surface-*`, `border-*`, `link`, `focus-ring`. Domain tokens are `agent-*` and
`state-unwritten-*`. Scalars are `font-*`, `size-*`, `lh-*`, `tracking-*`, `weight-*`,
`space-*`, `measure-*`, `radius-*`, `shadow-*`, `border-w-*`, `row-h`, `control-h`, `pad-*`.

**Components read semantic and domain aliases only** — never `--sun` or `--ink-1` directly.
A retheme is one file.

---

## 5. Components

Seventeen components in four groups. The retarget carried eleven of them untouched. Six
needed a one-line change, and the reason is worth recording: **`--radius-control` was doing
two jobs** — button radius and checkbox radius — and only survived the old direction because
its value was `0`, which is correct for both. At `999px` it turned the checkbox into a radio
button. The theme now separates `--radius-control` (pill: buttons, chips, avatars),
`--radius-field` (16px: text inputs and selects) and `--radius-tick` (6px: the checkbox).

- **`components/core/`** — `Button`, `Input`, `Select`, `Checkbox`, `Switch`, `Field`
- **`components/structure/`** — `Panel`, `SectionHead`, `DataTable`, `MetaList`
- **`components/agent/`** — `Provenance` (+ the `PROVENANCE` state map), `AgentBlock`,
  `Confidence`, `Citation`, `Refusal`
- **`components/state/`** — `EmptyState`, `Unwritten`

`Button variant="primary"` is the sun pill with slate-black text; `secondary` is a hairline
pill; `danger` is berry.

**Deliberately absent:** Toast, Modal, Avatar, Tabs, Breadcrumb, Accordion, Skeleton,
Carousel. Add them only when a real surface fails without one.

**Before reusing component source, read `reference/CORRECTIONS.md`** — eight shipped
behaviours contradict the rules above.

---

## 6. Fonts — substitution to confirm

The reference specifies **Sofia Pro** (Mostardesign, licensed). No binaries were supplied,
so `tokens/fonts.css` loads **Figtree** from the Google CDN as the stand-in: the same
geometric skeleton, circular bowls, double-storey *a*, single-storey *g*, and a real 400–900
range. **JetBrains Mono** carries figures and machine output.

Send licensed Sofia Pro files (or confirm the substitute) and these become local
`@font-face` rules. Nothing else changes — every component reads `--font-display` /
`--font-body` / `--font-mono`. Inter, Roboto, Poppins and system-UI stacks are deliberately
not used.

---

## 7. Iconography

**Amended.** The previous direction had no icon set. This one needs one: the reference's
working surface is organised by a left icon rail, which cannot be typographic.

- **Stroke icons at 1.6px, 22px, single colour** — `--ink-3` at rest, `--ink-1` when active,
  never coloured, never filled. **Lucide** is the recommended source if the set grows past a
  dozen; match its 1.5–1.6px stroke and round caps.
- **The five provenance sigils** — `[M]` `[H]` `[~]` `[×]` `[†]` stay typographic, in the
  mono face. They are never redrawn as vector icons, because they must print, paste as plain
  text into a PR comment, and survive a screen reader.
- **The rating mark** — a filled four-point star in `--sun`. The one filled glyph.
- **`†n`** citation marker, **`▾`** select caret, **`§`** section reference: mono, unchanged.

**No logo was supplied**, so no mark has been drawn. Wherever a logo would go, the wordmark
"The Living Craft" is set in the display face at 800.

---

## 8. Known gaps

- **No illustration set.** The direction is illustration-led and none exists. Every image
  position is a labelled placeholder. This is the top open item, and on a rendered marketing
  page the empty positions are the weakest part of the page.
- **No logo, no font files.** Sofia Pro is specified but not supplied; Figtree stands in.
- **Print.** Soft elevation does not print. Takeaway artifacts need a print sheet that
  converts every shadow to a hairline and every large radius to a small one; specified here,
  not built.
- **The dense surfaces are untested.** `data-density="compact"` exists and has a specimen
  card, but no real admin table has been built at that density.
- **The switch is 40×24.** That is below the 44px hit target on touch; it needs a padded
  label wrapper on mobile, which is not built.
- **Eight code/doc contradictions.** See `reference/CORRECTIONS.md`.
