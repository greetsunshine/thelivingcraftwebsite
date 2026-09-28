# Rework Cost Check — build and verification

Builds `public/downloads/rework-cost-check.xlsx`, the spreadsheet twin of
the browser tool at `/resources/rework-cost-check`.

**Status: released, 28 September 2026.** Listed in `src/data/resources.ts` as
Agentic system design 08, which is also what the sitemap and `/llms.txt` read.
It does not yet have a row in `src/data/resource-choices.ts`, the choices list
at the top of `/resources` — that is a separate call.

---

## The idea

Every path that sends work back costs the same shape of thing:

```
round cost = work repeated + review call + context growth
```

A rate limit refusing a call and a judge rejecting a draft look like different
problems and are the same problem. What differs is **when each bites** and
**whether the attempt was billed**: a refusal bites at peak and the refused
call is usually not billed, while a judge, validator, tool error or human
rejection bites on *every run*, was billed in full, and carries the critique
into the redo.

That second family is what sets unit economics, and it is the one teams do not
count. Hence two totals rather than one:

```
Typical cost per task = clean run + always-on checks + Σ (average rounds × round cost)
Worst case per task   = clean run + always-on checks + Σ (max rounds     × round cost)
```

---

## Where each piece lives

| Piece | File |
|---|---|
| Every formula and every check rule | `src/lib/reworkCost.ts` |
| Unit tests, written from the brief | `src/lib/reworkCost.test.ts` |
| Copy and the worked example | `src/data/rework-cost-check.ts` |
| The page | `src/pages/resources/rework-cost-check.astro` |
| Workbook build | `tools/rework-cost-check/build_xlsx.py` |
| Workbook verification | `tools/rework-cost-check/verify_xlsx.py` |

**One implementation, three readers.** The page renders from the module, the
browser script *imports* it, and the tests assert it. The workbook implements
the same formulas in Excel and `verify_xlsx.py` asserts that it agrees with the
module's own output — the expected values in `refs.json` are written by
`build_xlsx.py` from `dump_content.ts`, which runs the TypeScript.

---

## Rebuild and verify

```bash
python3 -m venv .venv && ./.venv/bin/pip install openpyxl formulas pymupdf pillow

npm test                                                        # 20 unit tests
./.venv/bin/python tools/rework-cost-check/extract_brand.py  # tokens -> brand.json
./.venv/bin/python tools/rework-cost-check/build_xlsx.py     # -> the .xlsx
./.venv/bin/python tools/rework-cost-check/verify_xlsx.py    # recalculate and assert
./.venv/bin/python tools/rework-cost-check/render_previews.py  # a PNG per tab
```

`verify_xlsx.py` uses LibreOffice for its second engine
(`brew install --cask libreoffice`). Without it the suite still runs on one
engine and says so.

---

## Decisions worth knowing before you change something

- **A blank is unknown, not zero.** Every input is `number | null`. A total
  that depends on a missing figure stays null rather than quietly reading low.
  Excel has no null, so each total carries a hidden "blocked" count beside it
  and shows `""` when anything is missing.
- **Unbounded is not a big number.** A present path with no cap has no worst
  case, so the tool prints the word and every derived figure goes with it.
  Inventing a ceiling would hide the finding the check exists to surface.
- **Zero is a real answer, and it is load-bearing.** The example's transport
  path has 0 average rounds: that is a measurement, not a blank, and it is what
  makes the worst case diverge from the typical cost.
- **Check 2's Attention only fires on judge, validation, tool and human paths.**
  A transport refusal really does re-send the same request, so 0 growth there
  is correct rather than an oversight.
- **`IFS` is not used, although the brief allows it.** openpyxl writes it bare
  while the file format needs an `_xlfn.` prefix for anything newer than 2007.
  Without the prefix LibreOffice returns `#NAME?` before `IFERROR` can catch
  it, because the failure happens when the formula is parsed. Nested `IF` needs
  no prefix and no converter can mangle it.
- **The enforcement dropdown uses a cell range, not an inline list.** "Per
  task, across all rounds" contains a comma, which is the inline list's own
  separator, so the option would silently split in two.
- **Numbers are formatted `[$-409]#,##0`.** A bare `#,##0` follows the reader's
  locale, and an India locale renders 10,000,000 as 1,00,00,000.
- **The five check rows are rendered server-side and filled by the script.**
  Astro scopes CSS with an attribute it stamps on template elements; an element
  built with `createElement` never gets it, and the cards rendered unstyled.
- **The headline block is sticky only above 860px.** Below that the two cards
  stack to roughly 760px, which on a phone leaves almost none of the form
  visible.
- **Nothing leaves the browser.** No `<form>`, no fetch, no localStorage, and
  no email gate. The page is the resource.
- **The paths are cards, not a table.** They started as an eleven-column table
  that needed 1340px inside a 724px column, so a reader could never see a whole
  row, and it put three unrelated questions on one line: does this path exist,
  what does a round of it cost, and when does it stop. Each card now asks those
  in order, shows the three parts adding up to the round cost, and a path the
  workflow does not have takes one button instead of nine empty cells.
- **`billed` feeds no calculation and is not an input on the fixed paths.**
  What a refusal costs is already carried by *work repeated*. It is shown as a
  stated fact on each card, and remains an input only on a custom path, where
  the reader is the one who knows.

---

## Draft Tool Registry entry

Not published by this work. Paste it when you release the tool.

```
Rework Cost Check

Reader question: What does one task really cost when something sends the work back?
Action verb: Run
Status: Released 2026-09-28
Featured in directory: [Yes / No]
Tool page link: https://learning.thelivingcraft.ai/resources/rework-cost-check
What to bring: One agent workflow; token counts from a handful of traces (or estimates); how often each check or limit sends work back; your peak tasks per minute and your tokens-per-minute quota.
What to do: List the paths that send work back, cost one round of each, set a cap and a final outcome for each, and add your per-task budget.
What the reader leaves with: Two numbers — typical cost per task and worst case at peak — plus a Pass / Attention / Fail result on five checks and the next fix to make.
Fulfilment: Direct link
Comment keyword: REWORK
```

## Still open

- Whether it gets a row in `src/data/resource-choices.ts`, the choices list at
  the top of `/resources`. The registry row alone puts it in the series list,
  the sitemap and `/llms.txt`.
