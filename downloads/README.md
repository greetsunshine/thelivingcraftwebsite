# Private downloads

Files handed out by the download gate at `/api/pipeline/download`, after a name
and an email address. Nothing here is fetchable by URL: this folder is NOT under
`public/`, and it is bundled into the server function by `includeFiles` in
`astro.config.mjs`.

Do not move a file back to `public/downloads`. Anything under `public/` is a
plain URL, and a gate on the button alone is theatre.

| File | Resource | Built by |
|---|---|---|
| `agent-run-cost-model.xlsx` | run-cost-model | `npm run workbook` |
| `agent-memory-audit-kit.pdf` | agent-memory-audit-kit | `npm run build:kit` |
| `agent-memory-audit-kit.zip` | agent-memory-audit-kit | `npm run build:kit` |
| `memory-record.schema.json` | agent-memory-audit-kit | `npm run build:kit` |
| `cost-ceiling-workbook.xlsx` | cost-ceiling-workbook | not yet produced; the page says so |
| `poc-selection-tool.xlsx` | poc-screen | `npm run tool-downloads` |
| `model-selection-tool.xlsx` | model-selection-tool | `npm run tool-downloads` |
| `agent-authority-review.xlsx` | agent-authority-review | `npm run tool-downloads` |
| `rule-placement-audit-worksheet.md` | rule-placement-audit | `npm run tool-downloads` |
| `agent-design-check-questions.md` | agent-design-check | `npm run tool-downloads` |
| `rework-cost-check.xlsx` | rework-cost-check | `python tools/rework-cost-check/build_xlsx.py` |

## The tool downloads are the tools, blank

Since 28 September 2026 the main download on each tool page is the tool
itself, blank and reusable, not the reader's filled-in report. Sunil asked for
this on 25 September. The scored PDF stays on the three scored tools as the
second option.

The brand for all four tool workbooks (these three and `agent-run-cost-model.xlsx`) is one
module, `scripts/workbook_brand.py`: design system colours read from `theme.css`, the
lockup PNGs, Figtree and Source Serif 4, and the print setup.

`npm run tool-downloads` builds the five files above it. It needs Python with
`openpyxl` and `Pillow`, and it finds one that runs (`PYTHON`, then `python3`,
`python`, `py`). Every question, anchor, weight and threshold comes from the
tool's data module in `src/data/`, and the workbook's formulas compute the
total and the verdict. Rebuild and commit the output whenever one of those
modules changes.

`src/lib/resources/tool-workbooks.test.ts` is what keeps the two honest. It
reads each committed workbook, evaluates its formulas for hundreds of answer
sets, including every band edge and every hard gate, and compares the result
with the page's own function (`readScores`, `readAssessment`, `readSheet`). A
data module changed without a rebuild fails `npm test`.

The rule placement audit and the design check hand over a blank Markdown sheet.
Their own `local()` exports stay: the CSV and the text summary are still built
in the browser from what the reader typed, and nothing typed is ever posted.

## The memory kit's PDF carries the site's brand

Since 28 September 2026 the kit is printed on the same brand as the four PDFs
the server builds (`src/lib/resources/pdf-writer.ts`): an ivory weave cover
with the lockup and a Source Serif title, then paper pages with a band of the
weave and the lockup across the top. The cover and page styles are the print
rules in `src/pages/resources/agent-memory-audit-kit.astro`; the band is the
header template in `scripts/build-memory-kit.mjs`, drawn from the PNGs in
`pdf-assets/brand/` (see `pdf-assets/README.md`). Run `npm run build:pdf-assets`
first if those are missing.

Rebuild after changing the page or the kit:

```sh
npm run build:kit                                  # macOS: uses Google Chrome in /Applications
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  npm run build:kit -- --url http://localhost:4321 # Windows, against a running `npm run dev`
```

On Windows the ZIP is written by the system's own `tar.exe`, and Chrome's
temporary profile can be left in the temp folder; the script says so and
carries on. Check the pages, not the font names inside the PDF: Chrome labels
embedded web fonts with system names such as ArialMT.
