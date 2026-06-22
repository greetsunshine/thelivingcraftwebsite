#!/usr/bin/env bash
# Renders region one-pagers (PDF) + social cards (PNG) into public/downloads/.
set -euo pipefail
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node marketing/generate.mjs

for key in india dubai australia; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="/tmp/lcm-$key-pdf" \
    --virtual-time-budget=5000 \
    --print-to-pdf="public/downloads/the-living-craft-$key.pdf" \
    "file://$ROOT/marketing/build/onepager-$key.html" 2>/dev/null

  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="/tmp/lcm-$key-png" \
    --force-device-scale-factor=2 --window-size=1200,630 --virtual-time-budget=5000 \
    --screenshot="public/downloads/social-$key.png" \
    "file://$ROOT/marketing/build/social-$key.html" 2>/dev/null
done

echo "Rendered:"
ls -la public/downloads/
