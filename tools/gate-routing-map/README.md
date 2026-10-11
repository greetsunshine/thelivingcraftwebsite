# Gate Routing Map — build and verification

Builds `downloads/gate-routing-map.xlsx`, the workbook behind the page at
`/resources/gate-routing-map`. It answers one question for an agent released
through automated gates: which gate results should block, go to a human, or
wait on a downstream system?

**Status: released, 11 October 2026. Not featured.** Listed in
`src/data/resources.ts` as Agentic system design 10, which is what `/resources`,
the sitemap and `/llms.txt` read, and what lets the download gate hand the file
over. There is no row in `src/data/resource-choices.ts`, the featured
question → action list at the top of `/resources`. Adding one is the whole of
featuring it: "Which of my agent's gate results should block, go to a human, or
wait on a downstream system?" → "Use the Gate Routing Map".

---

## Where each piece lives

| Piece | File |
|---|---|
| Every route rule, count and the decision | `src/lib/gateRouting.ts` |
| Unit tests, with expected values from the brief | `src/lib/gateRouting.test.ts` |
| Every sentence, and the worked example | `src/data/gate-routing-map.ts` |
| The page | `src/pages/resources/gate-routing-map.astro` |
| Workbook build | `tools/gate-routing-map/build_xlsx.py` |
| Workbook verification | `tools/gate-routing-map/verify_xlsx.py` |
| A PNG per printed page, for looking at | `tools/gate-routing-map/render_previews.py` |

The page and the workbook read the same words from the data module.
`dump_content.ts` prints them as JSON for the Python builder. The workbook
restates each rule as a formula, and `verify_xlsx.py` checks the
spreadsheet's own results against the brief and against `gateRouting.ts`.

---

## Rebuild and verify

```bash
python3 -m venv .venv && ./.venv/bin/pip install openpyxl pymupdf pillow

npm test                                                      # includes 15 tests for this tool
./.venv/bin/python tools/gate-routing-map/build_xlsx.py       # -> downloads/gate-routing-map.xlsx and refs.json
./.venv/bin/python tools/gate-routing-map/verify_xlsx.py      # recalculate in LibreOffice and assert (87 checks)
./.venv/bin/python tools/gate-routing-map/render_previews.py  # a PNG per printed page, into a temp folder
```

`verify_xlsx.py` needs LibreOffice (`brew install --cask libreoffice`). It
checks:

- the Worked Example gives every expected output in the brief (section 3, Tab 4);
- the variants: minimum trials 1 makes row 8 Ready; checks 3 and 5 Yes give
  16 and Fix first; then check 8 Yes gives 17 and Ready; every check Yes gives
  20, Ready and "No open items.";
- the brief's three edge cases, typed into the blank tabs;
- the blank tabs show blanks or 0, and no cell holds an error value.

**Rebuild when applications close.** The cover carries the cohort invitation
from `src/data/resource-cohort-copy.ts`, which names the October 2026 cohort.

---

## Decisions worth knowing before you change something

- **The download is gated, although the brief said "no email gate".** CLAUDE.md
  ("The download gate", 19 September 2026) puts every file a resource page
  hands out behind `ResourceGate`. Sunil confirmed the gate for the Rework Cost
  Check and the Citation Fit Check when their briefs said the same.
- **The brand is reused.** The builder reads `tools/rework-cost-check/brand.json`,
  read out of `src/styles/ds/theme.css`. Status colours are the success,
  warning and danger tokens. The four route colours are the theme's quiet fills
  with their inks: Block danger, Human decides accent (gold), Check downstream
  info (blue), Track surface-hover with quiet text. Every colour sits beside
  its word.
- **"Human decides" shares its gold fill with input cells.** The theme has no
  fifth quiet fill. Input cells also carry a thin border, and the route cells
  never do.
- **Tab 2 cannot lock a cell by formula.** Sheet protection is fixed per cell.
  A text column that does not apply to the row's route is greyed out and its
  validation refuses input. A dropdown column (halt criteria, contract,
  verifies, switch on together) can hold only one validation, its list, so it
  is greyed only. The two trial columns are greyed and accept whole numbers
  only. `Route ready?` reads only the columns of the row's own route, so a
  stray value elsewhere changes nothing.
- **`Route ready?` is "Ready" exactly when `Why not ready` is blank.** One
  formula decides both, so they cannot disagree.
- **A cleared minimum-trials cell reads as 3.** Delete clears a cell without
  passing its validation, and a blank compared with a number would fail every
  non-deterministic Block row.
- **A cell holding only a space counts as filled**, in the workbook and in
  `gateRouting.ts` alike. The workbook tests `=""`, and the module matches it
  rather than trimming.
- **Determinism left blank counts as No.** A Block case nobody has shown to be
  deterministic needs the minimum trials.
- **A critical Partial blocks Ready**, as the brief says. Ready needs 16 or more
  and every critical check answered Yes.
- **"Your next step" is blank on an unfinished sheet.** "No open items." appears
  only once all ten checks are answered and none is No or Partial.
- **The Worked Example is one locked sheet with all three sections.** Its
  formulas point at its own rows. Protection has no password, so a reader can
  unprotect it to experiment.
- **`IFS` is not used**: openpyxl writes it without the `_xlfn.` prefix and
  LibreOffice returns `#NAME?`. Two-column counts with a blank test use
  `SUMPRODUCT`, because Excel and LibreOffice disagree about `COUNTIF(range,"")`.

---

## Draft Tool Registry entry

```
Gate Routing Map

Reader question: Which of my agent's gate results should block, go to a human, or wait on a downstream system?
Action verb: Use
Status: Released 2026-10-11
Featured in directory: No
Tool page link: https://learning.thelivingcraft.ai/resources/gate-routing-map
What to bring: One agent you release through automated gates; the list of gate cases or eval suites it runs; for each one, what it checks and how bad it would be if it shipped broken; and the names of any systems that act on the agent's output, with the teams that own their pipelines.
What to do: List your gate cases, give each one a route (Block, Human decides, Check downstream or Track), fill in what each route needs, and score the ten checks.
What the reader leaves with: A routing map for every gate case, a list of the cases whose route isn't ready, and a decision: Ready, Fix first or Hold.
Fulfilment: Download gate (name, role, email)
Comment keyword: GATES
```

## Still open

- **The delivery email is held.** `resource-gate-routing-map` in
  `src/lib/comms/templates.ts` is unapproved, like every wording there. Until
  it is approved, a request saves and its delivery is recorded `blocked`; the
  file itself downloads in the page either way.
- **Not in the resource follow-up catalogue** (`src/data/resource-routing.ts`).
- **No per-page cohort line** in `src/data/resource-cohort-copy.ts`.
- **The default minimum of 3 trials** is the brief's number. Sunil to confirm.
