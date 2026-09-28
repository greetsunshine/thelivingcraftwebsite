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
