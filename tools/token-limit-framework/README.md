# Token Limit Framework — build and delivery

Builds `public/downloads/token-limit-framework.xlsx`: seven tabs, one file, the
blank template and a worked example inside it.

**Status: released, 27 September 2026.** Branched from `origin/main`, not from
the older `feat/rule-placement-audit` line. Listed in `src/data/resources.ts`
(Agentic system design 08 — 05, 06 and 07 are the Memory Audit Kit, the Rule
Placement Audit and the Failure Triage Quiz), in the choices list at the top of `/resources`
(`src/data/resource-choices.ts`), and in the sitemap and `/llms.txt`, both of
which read the registry.

## The page is the resource. The workbook is the extra.

`/resources/token-limit-framework` is an interactive tool. The reader types
their workflow into the page and gets the assessment there, free, with nothing
asked of them — the same shape as the POC Selection Tool, the Agent Authority
Review and the Run-Cost Model.

**The workbook is the only thing behind a name and an email**, exactly as those
three gate a PDF. It goes through the one shared sequence in
`src/lib/pipeline/resource-request.ts`, and **a failed save still hands over the
file**: the resource was never behind the request, so a database that is not
answering must not cost the visitor the download. Only a refusal about what the
visitor typed keeps the dialog open.

That ordering is not cosmetic. `src/lib/pipeline/resources.ts` states the
invariant in its own header — "THE RESOURCE IS NOT BEHIND THIS, AND THAT
CHANGES EVERYTHING" — and three user-facing strings assert it, all of them
shared with the other tools. Putting the assessment behind the form would make
those strings false on four pages at once.

The delivery wording is `resource-token-limit-framework` in
`src/lib/comms/templates.ts`. Without it the request still saves and the
delivery is held with a note saying the wording is missing.

## One model, three places

`src/data/token-limit-framework.ts` holds the model. The page renders from it,
the browser script **imports** it, and it asserts itself against the figures a
real recalculation of the .xlsx produces. So the page, the script and the
workbook cannot disagree without failing the first render.

---

## Rebuild it

```bash
python3 -m venv .venv && ./.venv/bin/pip install openpyxl formulas pymupdf pillow

./.venv/bin/python tools/token-limit-framework/extract_brand.py    # tokens -> brand.json
./.venv/bin/python tools/token-limit-framework/build_sheet.py      # brand.json -> the .xlsx
./.venv/bin/python tools/token-limit-framework/verify_sheet.py     # recalculate and assert
./.venv/bin/python tools/token-limit-framework/render_previews.py  # a PNG per tab, to look at
```

`verify_sheet.py` needs LibreOffice for its second engine:
`brew install --cask libreoffice`. Without it the suite still runs on one
engine and says so.

| File | What it is |
|---|---|
| `extract_brand.py` | Reads `src/styles/ds/theme.css` and writes `brand.json`. Checks the contrast of every status colour and fails if one is under AA. |
| `brand.json` | Generated. Do not hand-edit. |
| `content.py` | Every sentence and every worked-example figure. Apart from the layout code. |
| `build_sheet.py` | Writes the workbook, and `refs.json` beside it. |
| `refs.json` | Generated. Where each figure landed, so the verifier is not hunting cell addresses by hand. |
| `verify_sheet.py` | Recalculates the file and asserts the acceptance figures. |
| `render_previews.py` | A PNG per tab, into a temp directory. Not committed. |

---

## Decisions worth knowing before you change something

- **The five blocks are written once.** `map_block`, `limits_block`,
  `retry_block`, `stop_block` and `decision_block` build tabs 1 to 5 empty, and
  the same five functions build the worked example filled in on one sheet. The
  acceptance figures are therefore a test of the formulas the blank template
  ships. If you fork a block for the worked example, that stops being true.
- **No cached values are written.** openpyxl saves formulas only, so every
  number the verifier reads was computed by a spreadsheet engine, not copied
  out of the build script.
- **`IFS` is not used, although the brief allows it.** openpyxl writes it bare,
  while the file format needs an `_xlfn.` prefix for anything newer than 2007.
  Without the prefix LibreOffice returns `#NAME?`, and the error escapes the
  surrounding `IFERROR` because it happens when the formula is parsed rather
  than when it runs. With the prefix it works in both engines here, but whether
  a converter resolves that prefix is the one thing that cannot be tested from
  this machine, and the file's whole job is to survive being converted. Nested
  `IF` needs no prefix. The `ifs()` helper writes the chain.
- **Numbers are formatted `[$-409]#,##0`.** A bare `#,##0` follows the reader's
  locale, and an India locale renders 10,000,000 as 1,00,00,000. These are
  token counts, not rupees.
- **Tab 4 mirrors all twelve steps rather than listing only the ones with a
  side effect.** The brief allows either. Auto-populating just the side-effect
  rows means a reader who changes a step's side effect on tab 1 silently moves
  somebody else's clean-up plan onto a different step, with nothing on screen
  saying so. Rows with no side effect are dimmed instead.
- **A blank decision reads "Not scored yet".** With no guard an untouched sheet
  scores 0, finds no critical No, and prints "Fix first" about a workflow
  nobody has described.
- **Nothing in `brand.json` is invented.** The design system delivered on
  18 September has named `--success` and `--info` families, so the derived
  success colour an earlier version carried is gone. Every value is read out
  of `theme.css`, and `extract_brand.py` fails if any status pair drops below
  AA. The ratios it computes match the ones recorded in `theme.css`, which is
  a useful cross-check on both.
- **Warning is the warm accent pair, not `--agent-uncertain`.** In this system
  that token is info blue, and colour is language here: blue means "not sure",
  and "Fix first" is not an uncertainty. Warning takes `--accent-ink` on
  `--accent-quiet`, computed at 5.62:1.
- **The cover carries the real lockup.** `public/brand/lc-mark-keyed.webp` and
  `lc-name.webp` are both keyed, so they need no tile. They are composited
  into one PNG at build time at twice the displayed size, because Google
  Sheets does not render WebP in a cell and a committed PNG copy would drift.
  One image rather than two cell anchors: column B also holds the cover's
  labels, and sizing it for two anchors clipped every one of them.
- **There is no mono face any more.** The 18 September system dropped it from
  the public pages; figures are the body family with tabular numerals, and the
  workbook follows.

---

## Google Sheets delivery — optional, and not wired up

The page serves the `.xlsx`. A Google Sheets "Make a copy" link was in the
original brief and is not currently offered anywhere, because the interactive
page replaced the need for one. These steps still work if you decide you want
it as a second option; adding the link to the page is a few lines.

### The steps

1. Upload `public/downloads/token-limit-framework.xlsx` to Google Drive.
2. Open it, then **File → Save as Google Sheets**.
3. Check that these survived the conversion, because they are the parts that
   can quietly break:
   - **Fonts.** Source Serif 4 and Figtree are both Google Fonts, so Sheets can
     render them. They may need picking from **More fonts** once.
   - **The lockup image** on the cover tab.
   - **Dropdowns** on the Side effect, Scope, Unit, Window, Current handling,
     Retry scope, Automatic/manual, Stop cost and Answer columns.
   - **Conditional formatting.** The three status colours on the tab 3 verdict
     and the tab 5 decision, the red counts on tabs 1, 2, 4 and 5, and the
     dimmed rows on tab 4.
   - **Protected ranges.** Calculated cells are locked with no password.
   - **The worked example still reads 43,300 → 93,400, 2.16×, 186.8%, Hold.**
     If any of those changed, a formula did not convert.
4. **Share → General access → Anyone with the link → Viewer.**
5. Copy the URL and replace everything after the file id with `/copy`:
   `https://docs.google.com/spreadsheets/d/<FILE_ID>/copy`. That opens a
   "Make a copy" prompt, so each reader edits their own and never the master.
6. Put that link in `SHEET_COPY_URL` in `src/data/token-limit-framework.ts`.
   While it is `null` the page's primary button serves the `.xlsx` directly, so
   there is never a control that does nothing.

---

## Draft Tool Registry entry

Not published by this work. Paste it when the tool is released.

```
Token Limit Framework

Reader question: What should my agent do when it hits a limit?
Action verb: Use
Status: Released 2026-09-27
Featured in directory: Yes (choices list at the top of /resources)
Tool page link: https://learning.thelivingcraft.ai/resources/token-limit-framework
What to bring: One agent workflow you run or plan to run, the steps it takes, rough token counts per step (from traces or an estimate), and the rate and token limits it runs under.
What to do: Map the steps, list every limit that can refuse the agent, model retry amplification at peak, define a stop state for every step with a side effect, and score the ten checks.
What the reader leaves with: A token-limit policy for that workflow (per-task budget, retry rule, stop states with clean-up owners) and a decision: Ready to scale, Fix first, or Hold.
Fulfilment: Open page. The Excel workbook is an optional download against a name and an email.
Comment keyword: TOKENS
```

## Where each piece lives

| Piece | File |
|---|---|
| The model and every figure | `src/data/token-limit-framework.ts` |
| The page and its browser script | `src/pages/resources/token-limit-framework.astro` |
| The registry row | `src/data/resources.ts` (id `token-limit-framework`) |
| The choices row | `src/data/resource-choices.ts` |
| The delivery wording | `src/lib/comms/templates.ts` |
| The workbook | `public/downloads/token-limit-framework.xlsx` |

The sitemap and `/llms.txt` read the registry, so neither needed an edit.
