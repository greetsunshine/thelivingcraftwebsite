# Change Authority Review — build and verification

Builds `downloads/change-authority-review.xlsx`, the workbook behind the page at
`/resources/change-authority-review`. It answers one question for an agent with
write access to artifacts and systems: what may the agent do, and who gives it
the authority to do it?

**Status: released, 17 October 2026. Not featured.** Listed in
`src/data/resources.ts` as Agentic system design 11, which is what `/resources`,
the sitemap and `/llms.txt` read, and what lets the download gate hand the file
over. There is no row in `src/data/resource-choices.ts`, the featured
question → action list at the top of `/resources`. Adding one is the whole of
featuring it: "What may the agent do?" → "Use the Change Authority Review".

**The name is not the brief's.** The brief said "Authority Review" at
`/resources/authority-review`. `/resources/agent-authority-review` ("The Agent
Authority Review", 14 September 2026) already existed and answers a different
question: which steps of a workflow an agent may own at all. Two tools called
"Authority Review" would sit side by side in the directory, so Sunil chose
"Change Authority Review" on 17 October 2026. The page links to the older tool
once, in the worked example section.

---

## Where each piece lives

| Piece | File |
|---|---|
| Every rule, count and the decision | `src/lib/changeAuthority.ts` |
| Unit tests, with expected values from the brief | `src/lib/changeAuthority.test.ts` |
| Every sentence, and the worked example | `src/data/change-authority-review.ts` |
| The page | `src/pages/resources/change-authority-review.astro` |
| Workbook build | `tools/change-authority-review/build_xlsx.py` |
| Workbook verification | `tools/change-authority-review/verify_xlsx.py` |
| A PNG per printed page, for looking at | `tools/change-authority-review/render_previews.py` |

The page and the workbook read the same words from the data module.
`dump_content.ts` prints them as JSON for the Python builder. The workbook
restates each rule as a formula, and `verify_xlsx.py` checks the
spreadsheet's own results against the brief and against `changeAuthority.ts`.

---

## Rebuild and verify

```bash
python3 -m venv .venv && ./.venv/bin/pip install openpyxl pymupdf pillow

npm test                                                              # includes 17 tests for this tool
./.venv/bin/python tools/change-authority-review/build_xlsx.py       # -> downloads/change-authority-review.xlsx and refs.json
./.venv/bin/python tools/change-authority-review/verify_xlsx.py      # recalculate in LibreOffice and assert (101 checks)
./.venv/bin/python tools/change-authority-review/render_previews.py  # a PNG per printed page, into a temp folder
```

`verify_xlsx.py` needs LibreOffice (`brew install --cask libreoffice`). It
checks:

- the Worked Example gives every expected output in the brief (section 3, Tab 4);
- the variants: row 8's choice cleared; row 3's preview saying what can't be
  undone; checks 3 and 4 Yes (13, Fix first, next step check 8); then 5 and 8
  Yes (16, Ready, next step check 2); every check Yes (20, Ready, "No open items.");
- the brief's four edge cases, typed into the blank tabs;
- the blank tabs show blanks or 0, and no cell holds an error value.

**Rebuild when applications close.** The cover carries the cohort invitation
from `src/data/resource-cohort-copy.ts`, which names the October 2026 cohort.

---

## Decisions worth knowing before you change something

- **The download is gated, although the brief said "no email gate".** CLAUDE.md
  ("The download gate", 19 September 2026) puts every file a resource page
  hands out behind `ResourceGate`. Sunil confirmed the gate for the Rework Cost
  Check and the Citation Fit Check when their briefs said the same, and the
  Gate Routing Map kept it. The gate is the shared component, not the memory
  kit's "Get the file" form, so the brief's question about reusing that form
  does not arise.
- **The brand is reused.** The builder reads `tools/rework-cost-check/brand.json`,
  read out of `src/styles/ds/theme.css`. None of the four brand files the brief
  names exists except under that tool. Status colours are the success, warning
  and danger tokens, and each sits beside its word.
- **The three authority colours** are the theme's quiet fills with their inks:
  Agent acts is info (blue, `#e7eff1` with `#315d6b`), Preview and consent is
  accent (gold, `#f4e9ce` with `#765523`), Not allowed is surface-hover (grey,
  `#e5ebe1` with `#526259`). None is the success green, so an authority cell
  never reads as "Ready". Preview and consent shares its gold with the input
  cells, as "Human decides" does in the Gate Routing Map; input cells also
  carry a thin border, and authority cells never do.
- **Tab 2 cannot lock a cell by formula.** Sheet protection is fixed per cell.
  The two text columns (Undo path, Who consents) refuse input when the row's
  authority is not theirs. A dropdown column can hold only one validation, its
  list, so it is greyed only. `Authority ready?` reads only the columns of the
  row's own authority, so a stray value elsewhere changes nothing.
- **`Authority ready?` is "Ready" exactly when `Why not ready` is blank.** One
  formula decides both, so they cannot disagree.
- **"What it changes" in the worked example is ours.** The brief's table left
  that column out. Each row carries a short illustrative phrase.
- **A blank is unknown.** Undo tested left blank counts as not tested; "If
  consent is refused" left blank counts as no safe outcome.
- **A cell holding only a space counts as filled**, in the workbook and in
  `changeAuthority.ts` alike.
- **"Your next step" and the decision are blank on an unfinished sheet**, unless
  a critical check is already No, which settles Hold. "No open items." appears
  only once all ten are answered and none is No or Partial.
- **The Worked Example is one locked sheet with all three sections.** Its
  formulas point at its own rows. Protection has no password, so a reader can
  unprotect it to experiment. Stacking the sections makes some columns wider
  than their own section needs (column H takes the checklist's evidence width).
- **`IFS` is not used**: openpyxl writes it without the `_xlfn.` prefix and
  LibreOffice returns `#NAME?`.

---

## Draft Tool Registry entry

```
Change Authority Review

Reader question: What may the agent do?
Action verb: Use
Status: Released 2026-10-17
Featured in directory: No
Tool page link: https://learning.thelivingcraft.ai/resources/change-authority-review
What to bring: One agent and the artifact or system it changes; a list of every action it can take (edit, save a version, restore, delete, publish, send, notify, change permissions, call an external API); and a test environment where you can try undoing each action.
What to do: List every action, try to undo each one and record what remains, give each action an authority level (Agent acts, Preview and consent or Not allowed), fill in what each level needs, and score the ten checks.
What the reader leaves with: An authority map for that agent (each action, whether it can really be undone, who authorises it and what the preview must show), a list of actions whose authority isn't ready, and a decision: Ready, Fix first or Hold.
Fulfilment: Download gate (name, role, email)
Comment keyword: AUTHORITY
```

## Still open

- **The delivery email is held.** `resource-change-authority-review` in
  `src/lib/comms/templates.ts` is unapproved, like every wording there. Until
  it is approved, a request saves and its delivery is recorded `blocked`; the
  file itself downloads in the page either way.
- **Not in the resource follow-up catalogue** (`src/data/resource-routing.ts`).
- **The comment keyword AUTHORITY** may now be ambiguous with the older Agent
  Authority Review if that tool also uses it.
