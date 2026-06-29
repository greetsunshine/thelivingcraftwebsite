# Assets — spec & regeneration

All assets use the project design tokens (see `../CLAUDE.md`): warm paper `#F4EEE2`,
terracotta accent `#B0512E`, ink `#221C15`; Fraunces / Inter / JetBrains Mono.
No fabricated metrics, logos, or names appear in any asset.

## Files
| File | Size | Purpose |
|------|------|---------|
| `og-image.png` | 1200×630 | Social-share / Open Graph card. Referenced in `meta.md` + `index.html`. |
| `og-image.src.html` | — | Editable source for the OG image. |
| `ai-judges-loop.png` | 1600×900 | "AI builds / human judges" loop diagram for §3 (and optionally §1). |
| `ai-judges-loop.src.html` | — | Editable source for the loop diagram. |

## OG image — spec
- **Dimensions:** 1200×630 (1.91:1), the standard OG/Twitter large-card ratio.
- **Content:** wordmark, "application-only · Bangalore, hybrid", the spine line
  ("AI builds — the human judges & directs"), the hero headline, offer facts
  (8-class · evaluation/reliability/security · 8–15 seats · ₹1,20,000 · 5 July),
  and an "APPLY FOR THE COHORT" chip.
- **Keep:** text large enough to read in a small feed thumbnail; high whitespace.

## Loop diagram — spec
- **Dimensions:** 1600×900 (16:9); scales down cleanly for web.
- **Content:** four-stage clockwise loop — Direct → Build → Correct → Judge — with
  three human stages (accent border) and one AI stage, reinforcing the spine:
  *AI builds; the human judges and directs.* Center label + legend.

## Regenerate (headless Chrome, no npm deps)
From this `assets/` directory:

```sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# OG image — exactly 1200x630
"$CHROME" --headless=new --hide-scrollbars --disable-gpu --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=4000 \
  --screenshot="$PWD/og-image.png" "file://$PWD/og-image.src.html"

# Loop diagram — 1600x900
"$CHROME" --headless=new --hide-scrollbars --disable-gpu --force-device-scale-factor=1 \
  --window-size=1600,900 --virtual-time-budget=4000 \
  --screenshot="$PWD/ai-judges-loop.png" "file://$PWD/ai-judges-loop.src.html"
```

> `--virtual-time-budget` gives the web fonts time to load before the screenshot.
> For a 2× retina OG, set `--force-device-scale-factor=2` (output becomes 2400×1260).
> The same pipeline works with any Chromium binary (swap the `CHROME` path).

## To edit
Edit the `*.src.html` file, re-run the matching command above. Instructor portrait
is intentionally **not** generated — supply a real photo (4:5 or 1:1); do not use
stock imagery.
