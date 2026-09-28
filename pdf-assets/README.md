# PDF assets

The fonts and images the resource PDFs are built from. Read at request time by
`src/lib/resources/pdf-writer.ts`, which draws the four server-built PDFs (POC
Selection Tool, Model Selection Tool, Agent Authority Review, Run-Cost Model),
and at build time by `scripts/build-memory-kit.mjs`, which prints the Agent
Memory Audit Kit.

Nothing here is served by URL. The folder is NOT under `public/`; it is bundled
into the server function by `includeFiles` in `astro.config.mjs`, the same way
`downloads/` is. A new file here rides along without a config edit.

| File | What it is | Where it comes from |
|---|---|---|
| `fonts/Figtree-Regular.ttf`, `fonts/Figtree-Bold.ttf` | The site's reading face, for everything but the title | Design system package of 18 September 2026 |
| `fonts/SourceSerif4-Regular.ttf` | The site's display face, for the title | Same package |
| `fonts/SourceSerif4-It.ttf` | The italic, kept with the family; not embedded in any PDF yet | Same package |
| `fonts/OFL-Figtree.txt` | Figtree's licence, SIL Open Font License 1.1 | github.com/erikdkennedy/figtree |
| `fonts/OFL-SourceSerif4.md` | Source Serif 4's licence, SIL Open Font License 1.1, Reserved Font Name "Source" | github.com/adobe-fonts/source-serif |
| `brand/lc-mark.png`, `brand/lc-name.png` | The LC mark and the "The Living Craft" lettering | `npm run build:pdf-assets`, from `public/brand/*.webp` |
| `brand/lc-mark-header.png`, `brand/lc-name-header.png` | The same pair resized for the memory kit's repeating header | `npm run build:pdf-assets` |
| `brand/ivory-weave.png` | One ivory weave tile at 4x, with the site's opacity laid over ivory | `npm run build:pdf-assets`, from `public/textures/ivory-weave.svg` |

## Rules

- **The fonts are licensed under the OFL, and each licence stays beside its
  font.** Embedding a subset in a PDF is permitted use. Do not rename a font
  file, and do not ship a modified "Source" font under that name.
- **The logo is converted, never redrawn.** The PNGs are the same crops
  `BrandLockup.astro` draws: same pixels, same transparency, and for the header
  pair a resize and nothing else. Never trace, redraw or recolour the mark, and
  never add the artwork's tagline (CLAUDE.md, "The LC mark").
- **Rebuild the PNGs after changing their sources:** `npm run build:pdf-assets`.
  It reads `--lc-ivory` and `--weave-ivory-opacity` from `theme.css`, so the
  weave in a PDF cannot drift from the weave on the site. `sharp` is a
  devDependency: the server only ever reads the PNGs.
