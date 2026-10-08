# Citation Fit Check — build and verification

Builds `downloads/citation-fit-check.xlsx`, the checklist behind the page at
`/resources/citation-fit-check`. It answers one question for a RAG assistant:
does this cited answer apply to the person asking?

**Status: released, 7 October 2026. Not featured.** Listed in
`src/data/resources.ts` as Agentic system design 09, which is what `/resources`,
the sitemap and `/llms.txt` read, and what lets the download gate hand the file
over. There is no row in `src/data/resource-choices.ts`, the featured
question → action list at the top of `/resources`. Adding one is the whole of
featuring it: "Does this cited answer apply to the person asking?" →
"Use the Citation Fit Check".

---

## Where each piece lives

| Piece | File |
|---|---|
| Every count and the decision rule | `src/lib/citationFit.ts` |
| Unit tests, with expected values from the brief | `src/lib/citationFit.test.ts` |
| Every sentence, and the worked example | `src/data/citation-fit-check.ts` |
| The page | `src/pages/resources/citation-fit-check.astro` |
| Workbook build | `tools/citation-fit-check/build_xlsx.py` |
| Workbook verification | `tools/citation-fit-check/verify_xlsx.py` |
| A PNG per printed page, for looking at | `tools/citation-fit-check/render_previews.py` |

The page and the workbook read the same words from the data module.
`dump_content.ts` prints them as JSON for the Python builder, so the two cannot
say different things. The workbook restates each rule as a formula, and
`verify_xlsx.py` checks the spreadsheet's own results against the brief.

---

## Rebuild and verify

```bash
python3 -m venv .venv && ./.venv/bin/pip install openpyxl pymupdf pillow

npm test                                                        # includes 11 tests for this tool
./.venv/bin/python tools/citation-fit-check/build_xlsx.py       # -> downloads/citation-fit-check.xlsx and refs.json
./.venv/bin/python tools/citation-fit-check/verify_xlsx.py      # recalculate in LibreOffice and assert
./.venv/bin/python tools/citation-fit-check/render_previews.py  # a PNG per printed page, into a temp folder
```

`verify_xlsx.py` needs LibreOffice (`brew install --cask libreoffice`). It
recalculates the file headlessly, reads the values back, and checks four things:

- the Worked Example gives every expected output in the brief (section 3, Tab 5);
- checks 4, 7 and 11 changed to Yes give 16 and Fix first, and every check Yes gives 24 and Ready;
- the blank tabs show blanks or 0;
- no cell on any tab holds `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?` or another error.

**Rebuild when applications close.** The cover carries the cohort invitation
from `src/data/resource-cohort-copy.ts`, which names the October 2026 cohort
until `cohort.applicationsCloseOn`. A file built before that date keeps the
dated words.

---

## Decisions worth knowing before you change something

- **The download is gated, although the brief said "no email gate".**
  CLAUDE.md ("The download gate", 19 September 2026) puts every file a
  resource page hands out behind `ResourceGate`, and the file lives in
  `downloads/`, which is not a public URL. Sunil confirmed the gate on
  7 October 2026, as for the Rework Cost Check.
- **The brand is reused, not copied.** The builder reads
  `tools/rework-cost-check/brand.json`, which that tool's `extract_brand.py`
  reads out of `src/styles/ds/theme.css`. Status colours are the brand's
  success, warning and danger tokens, and every colour sits beside a word
  (Pass, Partial, Fail; Ready, Fix first, Hold).
- **The Worked Example is one sheet with all four sections.** Its formulas
  point at its own rows, so it computes the acceptance figures by itself and a
  reader can change an answer and watch the decision move.
- **Dropdown options sit in a hidden column, not in an inline list.**
  "Same document, other section" contains a comma, and an inline list would
  split it into two options.
- **`IFS` is not used**, although the brief allows it. openpyxl writes it
  without the `_xlfn.` prefix and LibreOffice then returns `#NAME?`. Nested
  `IF` has no such problem. The rework tool found this first.
- **A ratio with nothing under it is blank, not 0%.** "Condition recall 0%"
  and "nobody measured it" are different findings.
- **A critical No settles Hold before the sheet is finished.** Otherwise the
  decision stays blank until all twelve checks are answered.
- **"Your next step"** uses a hidden priority column (Y): 1 for a critical No,
  2 for any other No, 3 for a Partial, 9 for nothing to do. It shows the text
  of the first row holding the smallest number.
- **The two greyed examples on the blank Test Cases tab are not counted.**
  They sit above the input rows, outside the range `Test cases written` reads.

---

## Draft Tool Registry entry

Not published by this work. Sunil pastes it when he releases the tool.

```
Citation Fit Check

Reader question: Does this cited answer apply to the person asking?
Action verb: Use
Status: Released 2026-10-07
Featured in directory: No
Tool page link: https://learning.thelivingcraft.ai/resources/citation-fit-check
What to bring: One type of question your RAG assistant answers; the source documents it retrieves from; 10 real or sample questions of that type, each with the facts about the asker that decide the answer; and the retrieved passages and answers for those questions, from traces or by running them.
What to do: Map the conditions that gate each rule, spot-check whether retrieval returns those conditions, score the twelve checks, and write test cases where the cited text is true but doesn't apply.
What the reader leaves with: A condition map for that answer type, a Pass / Partial / Fail result on twelve checks with a decision (Ready, Fix first or Hold), and a starter set of applicability test cases for your evals.
Fulfilment: Direct link
Comment keyword: CITATION
```

## Still open

- **The delivery email is held.** `resource-citation-fit-check` in
  `src/lib/comms/templates.ts` is unapproved, like every wording there. Until
  it is approved, a request saves and its delivery is recorded `blocked`; the
  file itself downloads in the page either way.
- **Not in the resource follow-up catalogue** (`src/data/resource-routing.ts`).
  The other recent tools joined it switched off; this one can join the same way.
- **No per-page cohort line** in `src/data/resource-cohort-copy.ts`, so the
  page and the workbook use the generic line.
