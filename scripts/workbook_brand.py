"""The Living Craft brand for the Excel workbooks, in one place.

Imported by scripts/tool-workbooks.py and scripts/run-cost-workbook.py, so the
four tool workbooks cannot drift apart the way the four PDF renderers once did
(see src/lib/resources/pdf-writer.ts).

COLOURS are design system v1 tokens, read from src/styles/ds/theme.css at build
time. Gold is a rule, never text, as on the site.

FONTS ARE THE SITE'S: Source Serif 4 for titles, Figtree for the rest.
Decided 28 September 2026, after weighing a switch to Georgia and Arial. An
.xlsx cannot embed a font. Google Sheets renders both faces, because both are
Google Fonts. Excel on a machine without them draws a substitute sans. The
layout was checked in Excel on a machine without either font, so the fixed
row heights already allow for the substitute. Georgia and Arial would look
the same everywhere and never look like the brand. The Rework Cost Check's
workbook (tools/rework-cost-check/) made the same choice for the same reason,
and five workbooks with one set of faces beats four with another.
"""

from __future__ import annotations

import io
import re
from pathlib import Path

from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from PIL import Image as PilImage

REPO = Path(__file__).resolve().parents[1]

THEME = (REPO / "src" / "styles" / "ds" / "theme.css").read_text(encoding="utf-8")


def token(name: str) -> str:
    m = re.search(rf"--{name}:\s*(#[0-9A-Fa-f]{{6}})", THEME)
    if not m:
        raise SystemExit(f"theme.css has no --{name}")
    return m.group(1)[1:].upper()


FOREST = token("lc-forest")        # titles, the result's outcome
IVORY = token("lc-ivory")          # the sheet ground
PAPER = token("lc-paper")          # section bands
SOFT = token("lc-soft")            # the result block
INK = token("lc-ink")              # body text
MUTED = token("lc-muted")          # notes, anchors
LINE = token("lc-line")            # rules
DEEP_GOLD = token("lc-deep-gold")  # labels (text)
GOLD = token("lc-gold")            # a rule under the title (never text)
INPUT = token("lc-warning-soft")   # the cells you fill in
ERROR = token("lc-error")          # a hard gate

DISPLAY = "Source Serif 4"  # titles; see the note at the top
BODY = "Figtree"

fill = lambda c: PatternFill("solid", start_color=c, end_color=c)
font = lambda size=11, bold=False, color=INK, name=BODY, italic=False: Font(name=name, size=size, bold=bold, color=color, italic=italic)
WRAP = Alignment(wrap_text=True, vertical="top")
WRAP_C = Alignment(wrap_text=True, vertical="top", horizontal="center")
HAIR = Side(style="thin", color=LINE)
UNDER = Border(bottom=HAIR)
GOLD_RULE = Border(bottom=Side(style="medium", color=GOLD))


def lockup_png(height: int = 40) -> io.BytesIO:
    """The LC mark beside the lettering, as BrandLockup.astro draws it, in one image."""
    mark = PilImage.open(REPO / "pdf-assets" / "brand" / "lc-mark.png").convert("RGBA")
    name = PilImage.open(REPO / "pdf-assets" / "brand" / "lc-name.png").convert("RGBA")
    mark = mark.resize((round(mark.width * height / mark.height), height), PilImage.LANCZOS)
    nh = round(height * 24 / 44)
    name = name.resize((round(name.width * nh / name.height), nh), PilImage.LANCZOS)
    gap = round(height * 8 / 44)
    out = PilImage.new("RGBA", (mark.width + gap + name.width, height), (0, 0, 0, 0))
    out.paste(mark, (0, 0), mark)
    out.paste(name, (mark.width + gap, (height - nh) // 2), name)
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    buf.seek(0)
    return buf


def print_setup(ws):
    """Landscape, one page wide, as many pages tall as it takes."""
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_options.horizontalCentered = True
