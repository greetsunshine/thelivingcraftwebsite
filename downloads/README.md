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
