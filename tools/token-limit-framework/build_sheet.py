#!/usr/bin/env python3
"""Build public/downloads/token-limit-framework.xlsx.

One script, one file. Tabs 1-5 are the blank template; tab 6 is the same five
blocks filled in for an illustrative scheduling agent.

The blocks are written by ONE function each (`map_block`, `limits_block`,
`retry_block`, `stop_block`, `decision_block`). Tabs 1-5 call them empty on
their own sheet; tab 6 calls the same functions with data, stacked on one
sheet. That is deliberate: the acceptance figures in the worked example are
therefore a test of the formulas the blank template ships, not of a second
copy of them that could drift.

Formula compatibility: the file is converted to Google Sheets, so only
SUM SUMPRODUCT IF IFS AND OR MIN MAX ROUND COUNTIF COUNTIFS INDEX MATCH
IFERROR TEXT are used. No LET, LAMBDA, XLOOKUP, dynamic arrays, table
references, macros or external links.

Run:  python3 tools/token-limit-framework/build_sheet.py
"""
from __future__ import annotations

import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.drawing.image import Image as XlImage
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.worksheet import Worksheet

import content as C

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
BRAND = json.loads((HERE / "brand.json").read_text(encoding="utf-8"))
OUT = REPO / "public" / "downloads" / "token-limit-framework.xlsx"
BRAND_DIR = REPO / "public" / "brand"
BUILD = HERE / ".build"

K = BRAND["colors"]
DISPLAY = BRAND["fonts"]["display"]["family"]   # Source Serif 4: headings only
# The 18 September system has no mono face: figures are the body family
# with tabular numerals. FIGURES is therefore usually the same as DISPLAY
# here, and the distinction is kept because the roles are still distinct.
FIGURES = BRAND["fonts"]["figures"]["family"]
BODY = BRAND["fonts"]["body"]["family"]


def rgb(name: str) -> str:
    """openpyxl wants AARRGGBB without the hash."""
    return "FF" + K[name].lstrip("#").upper()


FILL_NOIR = PatternFill("solid", fgColor=rgb("noir"))
FILL_INPUT = PatternFill("solid", fgColor=rgb("accent_quiet"))
FILL_MIST = PatternFill("solid", fgColor=rgb("background"))
FILL_OK = PatternFill("solid", fgColor=rgb("success_quiet"))
FILL_WARN = PatternFill("solid", fgColor=rgb("warning_quiet"))
FILL_BAD = PatternFill("solid", fgColor=rgb("danger_quiet"))

EDGE_INPUT = Border(*[Side(style="thin", color=rgb("sun"))] * 4)
EDGE_HAIR_BOTTOM = Border(bottom=Side(style="thin", color=rgb("border_hair")))

# Type. Figtree and JetBrains Mono are both real Google Fonts, so Google Sheets
# can render them after conversion. Excel will substitute if they are not
# installed locally; that is expected and is noted in the README.
# --weight-display is 400: "the serif is set at its regular weight".
F_DISPLAY = Font(name=DISPLAY, size=20, color=rgb("text_loud"))
F_WORDMARK = Font(name=BODY, size=16, bold=True, color=rgb("text_on_invert"))
# On paper, not on forest: text_faint is a forest-only colour here.
F_WORDSUB = Font(name=BODY, size=9, bold=True, color=rgb("accent_ink"))
F_TITLE = Font(name=DISPLAY, size=28, color=rgb("text_loud"))
F_H2 = Font(name=DISPLAY, size=14, color=rgb("text_loud"))
F_LABEL = Font(name=FIGURES, size=9, bold=True, color=rgb("accent_ink_strong"))
F_HEAD = Font(name=BODY, size=10, bold=True, color=rgb("text_on_invert"))
F_BODY = Font(name=BODY, size=11, color=rgb("text_body"))
F_BODY_B = Font(name=BODY, size=11, bold=True, color=rgb("text_body"))
F_QUIET = Font(name=BODY, size=10, color=rgb("text_quiet"))
F_NOTE = Font(name=BODY, size=9, color=rgb("text_quiet"))
# text_faint is #C6D4C8 here, a colour for forest surfaces ONLY. A ghost
# prompt sits on a light input fill, so it takes text_quiet.
F_GHOST = Font(name=BODY, size=11, italic=True, color=rgb("text_quiet"))
F_NUM = Font(name=FIGURES, size=11, color=rgb("text_body"))
F_BIGNUM = Font(name=FIGURES, size=14, bold=True, color=rgb("text_loud"))
F_VERDICT = Font(name=BODY, size=13, bold=True, color=rgb("text_loud"))
F_LEAD = Font(name=BODY, size=12, color=rgb("text_quiet"))

WRAP = Alignment(horizontal="left", vertical="top", wrap_text=True)
WRAP_MID = Alignment(horizontal="left", vertical="center", wrap_text=True)
LEFT = Alignment(horizontal="left", vertical="center")
RIGHT = Alignment(horizontal="right", vertical="center")
CENTER = Alignment(horizontal="center", vertical="center")

# Pinned to thousands grouping. A bare "#,##0" follows the reader's locale,
# and an India locale renders 10,000,000 as 1,00,00,000. These are token
# counts, not money, and the framework's figures are quoted in thousands.
NUMFMT = "[$-409]#,##0"
PCTFMT = "0.0%"
AMPFMT = '0.00"×"'


# ---------------------------------------------------------------- artwork


def brand_lockup(mark_h: int = 44, name_h: int = 22, gap: int = 12) -> tuple[Path, int, int]:
    """The mark beside the lettering, composited into ONE image.

    BrandLockup.astro puts these two files side by side on every page. Two
    separate cell anchors would work only while the column between them stays
    a particular width, and column B also carries the cover's labels — the
    first attempt at this narrowed B for the artwork and clipped every label.
    One image has no such coupling.

    Composited at twice the displayed size, on transparency, and neither asset
    is enlarged past its native resolution.
    """
    from PIL import Image as PILImage

    def load(name: str, h: int) -> "PILImage.Image":
        src = BRAND_DIR / f"{name}.webp"
        if not src.exists():
            raise SystemExit(f"missing brand asset {src.relative_to(REPO)}")
        im = PILImage.open(src)
        if im.mode != "RGBA":
            im = im.convert("RGBA")
        target = min(h * 2, im.height)
        return im.resize((max(1, round(im.width * target / im.height)), target), PILImage.LANCZOS)

    mark = load("lc-mark-keyed", mark_h)
    name = load("lc-name", name_h)
    pad = gap * 2
    width = mark.width + pad + name.width
    height = max(mark.height, name.height)
    canvas = PILImage.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.paste(mark, (0, (height - mark.height) // 2), mark)
    canvas.paste(name, (mark.width + pad, (height - name.height) // 2), name)
    BUILD.mkdir(parents=True, exist_ok=True)
    out = BUILD / "lc-lockup@2x.png"
    canvas.save(out)
    display_h = max(mark_h, name_h)
    return out, round(width * display_h / height), display_h


def brand_png(name: str, height_px: int) -> tuple[Path, int, int]:
    """A brand asset as a PNG, sized for the sheet.

    Google Sheets does not render WebP in a cell, and the repository's brand
    files are WebP, so they are converted at build time rather than a PNG copy
    being committed and left to drift. Both `-keyed` assets carry an alpha
    channel, which is what lets them sit on any ground.

    The PNG is written at TWICE the height it is displayed at, so it stays
    crisp on a high-density screen and in print. Neither asset is ever
    enlarged past its native size.
    """
    from PIL import Image as PILImage

    src = BRAND_DIR / f"{name}.webp"
    if not src.exists():
        raise SystemExit(f"missing brand asset {src.relative_to(REPO)}")
    im = PILImage.open(src)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    target_h = min(height_px * 2, im.height)
    scale = target_h / im.height
    im = im.resize((max(1, round(im.width * scale)), target_h), PILImage.LANCZOS)
    BUILD.mkdir(parents=True, exist_ok=True)
    out = BUILD / f"{name}@2x.png"
    im.save(out)
    display_w = round(im.width * height_px / im.height)
    return out, display_w, height_px


# ---------------------------------------------------------------- utilities



def ifs(pairs: list[tuple[str, str]], default: str = '""') -> str:
    """A nested IF chain, written where IFS would read better.

    IFS is on the brief's allowed list, but openpyxl writes it bare while
    OOXML requires the _xlfn. prefix for any function newer than 2007.
    Without the prefix LibreOffice returns #NAME?, and the error escapes the
    surrounding IFERROR because it happens when the formula is parsed rather
    than when it runs. With the prefix it works in both engines here — but
    whether a converter resolves that prefix is the one thing that cannot be
    tested from this machine, and the file's whole job is to survive being
    converted. A nested IF needs no prefix and cannot be mangled, so that is
    what ships.
    """
    out = default
    for test, value in reversed(pairs):
        out = f"IF({test},{value},{out})"
    return out


def put(ws: Worksheet, ref: str, value=None, *, font=F_BODY, fill=None, align=LEFT,
        fmt=None, editable=False, border=None):
    c = ws[ref]
    if value is not None:
        c.value = value
    c.font = font
    c.alignment = align
    if fill is not None:
        c.fill = fill
    if fmt:
        c.number_format = fmt
    if border is not None:
        c.border = border
    # Sheet protection is a guide rail, not security: calculated cells stay
    # locked so a reader does not type over a formula by accident.
    c.protection = Protection(locked=not editable)
    return c


def inp(ws: Worksheet, ref: str, value=None, *, fmt=None, align=LEFT, font=F_BODY):
    return put(ws, ref, value, font=font, fill=FILL_INPUT, align=align, fmt=fmt,
               editable=True, border=EDGE_INPUT)


def calc(ws: Worksheet, ref: str, formula: str, *, fmt=None, font=F_NUM, align=RIGHT,
         border=None):
    return put(ws, ref, formula, font=font, align=align, fmt=fmt, editable=False,
               border=border)


def merge_text(ws: Worksheet, row: int, c1: str, c2: str, text: str, *, font=F_BODY,
               height: int | None = None, align=WRAP):
    ws.merge_cells(f"{c1}{row}:{c2}{row}")
    put(ws, f"{c1}{row}", text, font=font, align=align)
    if height:
        ws.row_dimensions[row].height = height


def validate(ws: Worksheet, options: list[str], cells: str, *, prompt: str | None = None):
    """A list dropdown. Inline lists survive the Google Sheets conversion."""
    joined = ",".join(options)
    assert "," not in "".join(options), "an option containing a comma breaks an inline list"
    assert len(joined) <= 250, f"inline list too long: {joined}"
    dv = DataValidation(type="list", formula1=f'"{joined}"', allow_blank=True, showDropDown=False)
    if prompt:
        dv.prompt, dv.promptTitle, dv.showInputMessage = prompt, "", True
    ws.add_data_validation(dv)
    dv.add(cells)
    return dv


def widths(ws: Worksheet, spec: dict[str, float]):
    for col, w in spec.items():
        ws.column_dimensions[col].width = w


def hide(ws: Worksheet, *cols: str):
    for col in cols:
        ws.column_dimensions[col].hidden = True


def sheet_chrome(ws: Worksheet, title: str, question: str, *, freeze: str | None = None):
    ws.sheet_view.showGridLines = False
    put(ws, "A1", title, font=F_DISPLAY)
    put(ws, "A2", question, font=F_LEAD)
    ws.row_dimensions[1].height = 30
    ws.row_dimensions[2].height = 20
    if freeze:
        ws.freeze_panes = freeze


def header_row(ws: Worksheet, row: int, headers: list[tuple[str, float, str | None]],
               first_col: int = 1):
    ws.row_dimensions[row].height = 42
    for i, (label, width, note) in enumerate(headers):
        col = get_column_letter(first_col + i)
        ws.column_dimensions[col].width = width
        cell = put(ws, f"{col}{row}", label, font=F_HEAD, fill=FILL_NOIR,
                   align=Alignment(horizontal="left", vertical="bottom", wrap_text=True))
        if note:
            cell.comment = None  # notes go in a caption row, not a cell comment
    return row


def caption_row(ws: Worksheet, row: int, headers: list[tuple[str, float, str | None]],
                first_col: int = 1):
    """The header notes, printed under the header rather than hidden in a comment."""
    if not any(n for _, _, n in headers):
        return
    ws.row_dimensions[row].height = 38
    for i, (_, _, note) in enumerate(headers):
        col = get_column_letter(first_col + i)
        if note:
            put(ws, f"{col}{row}", note, font=F_NOTE, align=WRAP)


def summary_line(ws: Worksheet, row: int, label: str, value_col: str, formula: str, *,
                 fmt=NUMFMT, label_from: str = "A", label_to: str | None = None,
                 note: str | None = None):
    ws.merge_cells(f"{label_from}{row}:{label_to or chr(ord(value_col) - 1)}{row}")
    put(ws, f"{label_from}{row}", label, font=F_BODY_B, align=LEFT)
    calc(ws, f"{value_col}{row}", formula, fmt=fmt, font=F_BIGNUM)
    if note:
        put(ws, f"{get_column_letter(ws[value_col + str(row)].column + 1)}{row}", note,
            font=F_NOTE, align=LEFT)


def block_head(ws: Worksheet, top: int, title: str, question: str, lead: str | None = None) -> int:
    put(ws, f"A{top}", title, font=F_DISPLAY)
    ws.row_dimensions[top].height = 28
    put(ws, f"A{top + 1}", question, font=F_LEAD)
    ws.row_dimensions[top + 1].height = 18
    if lead:
        merge_text(ws, top + 2, "A", "H", lead, font=F_NOTE, height=16)
    return top + 3


# ------------------------------------------------------------ 1 · workflow map


def map_block(ws: Worksheet, top: int, *, steps=None, helper: str = "L",
              set_widths: bool = True) -> dict:
    n = len(steps) if steps else C.STEP_ROWS
    hdr = block_head(ws, top, C.TAB_MAP, C.QUESTIONS[0][1])
    cap = hdr + 1
    r0, r1 = cap + 1, cap + n

    header_row(ws, hdr, C.MAP_HEADERS)
    caption_row(ws, cap, C.MAP_HEADERS)

    for i in range(n):
        r = r0 + i
        ws.row_dimensions[r].height = 22
        s = steps[i] if steps else None
        put(ws, f"A{r}", i + 1, font=F_NUM, align=CENTER, border=EDGE_HAIR_BOTTOM)
        inp(ws, f"B{r}", s[0] if s else None)
        inp(ws, f"C{r}", s[1] if s else None, align=CENTER)
        inp(ws, f"D{r}", s[2] if s else None, align=CENTER)
        inp(ws, f"E{r}", s[3] if s else None)
        inp(ws, f"F{r}", s[4] if s else None, fmt=NUMFMT, align=RIGHT, font=F_NUM)
        inp(ws, f"G{r}", s[5] if s else None, fmt=NUMFMT, align=RIGHT, font=F_NUM)
        calc(ws, f"H{r}", f'=IF(AND(F{r}="",G{r}=""),"",SUM(F{r}:G{r}))', fmt=NUMFMT,
             border=EDGE_HAIR_BOTTOM)
        calc(ws, f"I{r}", f'=IF(H{r}="","",SUM($H${r0}:H{r}))', fmt=NUMFMT,
             border=EDGE_HAIR_BOTTOM)
        inp(ws, f"J{r}", s[6] if s else None, align=CENTER)
        inp(ws, f"K{r}", s[7] if s else None, align=CENTER)
        # Running index of the last step that saved a checkpoint. Used by the
        # retry block to price "resume from last checkpoint" without an array
        # formula, which Google Sheets would keep but which is harder to read.
        prev = "0" if i == 0 else f"{helper}{r - 1}"
        calc(ws, f"{helper}{r}", f'=IF(K{r}="Yes",A{r},{prev})')

    validate(ws, C.YESNO, f"C{r0}:D{r1}")
    validate(ws, C.SIDE_EFFECTS, f"E{r0}:E{r1}")
    validate(ws, C.YESNO, f"J{r0}:K{r1}")

    s1, s2, s3 = r1 + 2, r1 + 3, r1 + 4
    summary_line(ws, s1, "Tokens per clean run", "H", f"=SUM(H{r0}:H{r1})")
    summary_line(ws, s2, "Steps with side effects", "H",
                 f'=COUNTIF(E{r0}:E{r1},"Reversible")+COUNTIF(E{r0}:E{r1},"Irreversible")')
    summary_line(ws, s3, "Unsafe steps (a side effect, and not idempotent)", "H",
                 f'=COUNTIFS(E{r0}:E{r1},"Reversible",J{r0}:J{r1},"No")'
                 f'+COUNTIFS(E{r0}:E{r1},"Irreversible",J{r0}:J{r1},"No")')
    ws.conditional_formatting.add(
        f"H{s3}", FormulaRule(formula=[f"H{s3}>0"], fill=FILL_BAD,
                              font=Font(name=FIGURES, size=14, bold=True, color=rgb("danger"))))
    put(ws, f"I{s3}", "Every one of these can be run twice by a retry.", font=F_NOTE)
    hide(ws, helper)

    return {
        "clean_run": f"H{s1}", "cum": f"I{r0}:I{r1}", "tin": f"F{r0}:F{r1}",
        "cp": f"{helper}{r0}:{helper}{r1}", "name": f"B{r0}:B{r1}",
        "side": f"E{r0}:E{r1}", "r0": r0, "r1": r1, "n": n, "bottom": s3,
    }


# ----------------------------------------------------------------- 2 · limits


def limits_block(ws: Worksheet, top: int, *, rows=None, helper: str = "K",
                 set_widths: bool = True) -> dict:
    n = C.LIMIT_ROWS
    hdr = block_head(ws, top, C.TAB_LIMITS, C.QUESTIONS[1][1])
    cap = hdr + 1
    r0, r1 = cap + 1, cap + n
    header_row(ws, hdr, C.LIMIT_HEADERS)
    caption_row(ws, cap, C.LIMIT_HEADERS)

    for i in range(n):
        r = r0 + i
        ws.row_dimensions[r].height = 22
        given = rows[i] if rows and i < len(rows) else None
        put(ws, f"A{r}", i + 1, font=F_NUM, align=CENTER, border=EDGE_HAIR_BOTTOM)
        if given:
            inp(ws, f"B{r}", given[0])
        elif rows is None and i < len(C.LIMIT_PROMPTS):
            # A prompt the reader types over, not a value. Ghost type says so.
            # Only on the blank template: a half-filled worked example that
            # trails three grey prompts reads as three limits nobody finished.
            cell = inp(ws, f"B{r}", C.LIMIT_PROMPTS[i])
            cell.font = F_GHOST
        else:
            inp(ws, f"B{r}")
        inp(ws, f"C{r}", given[1] if given else None)
        inp(ws, f"D{r}", given[2] if given else None, fmt=NUMFMT, align=RIGHT, font=F_NUM)
        inp(ws, f"E{r}", given[3] if given else None, align=CENTER)
        inp(ws, f"F{r}", given[4] if given else None, align=CENTER)
        inp(ws, f"G{r}", given[5] if given else None)
        inp(ws, f"H{r}", given[6] if given else None)
        inp(ws, f"I{r}", given[7] if given else None)
        inp(ws, f"J{r}", given[8] if given else None)
        # Marks the first tokens-per-minute row so the retry block can link to
        # it with a plain MATCH. A two-criteria MATCH needs an array formula.
        calc(ws, f"{helper}{r}", f'=IF(AND(E{r}="tokens",F{r}="per minute"),"tpm","")')

    validate(ws, C.SCOPES, f"C{r0}:C{r1}")
    validate(ws, C.UNITS, f"E{r0}:E{r1}")
    validate(ws, C.WINDOWS, f"F{r0}:F{r1}")
    validate(ws, C.HANDLING, f"I{r0}:I{r1}")

    s1, s2 = r1 + 2, r1 + 3
    summary_line(ws, s1, "Limits shared across workflows", "D",
                 f'=COUNTIF(C{r0}:C{r1},"Shared across workflows")', label_to="C")
    put(ws, f"E{s1}", "One busy workflow can starve every other one on these.", font=F_NOTE)
    summary_line(ws, s2, "Limits retried immediately, or not handled at all", "D",
                 f'=COUNTIF(I{r0}:I{r1},"Retry immediately")+COUNTIF(I{r0}:I{r1},"Unknown")',
                 label_to="C")
    ws.conditional_formatting.add(
        f"D{s2}", FormulaRule(formula=[f"D{s2}>0"], fill=FILL_BAD,
                              font=Font(name=FIGURES, size=14, bold=True, color=rgb("danger"))))
    put(ws, f"E{s2}", "An immediate retry is the pattern that amplifies a spike.", font=F_NOTE)
    hide(ws, helper)

    return {"value": f"D{r0}:D{r1}", "tpm_flag": f"{helper}{r0}:{helper}{r1}",
            "r0": r0, "r1": r1, "bottom": s2}


# --------------------------------------------------------- 3 · retry amplifier


def band_formula(cell: str) -> str:
    """Which of the three quota bands a fraction falls in. Blank if unset."""
    return (f'IF({cell}="","",' + ifs([
        (f"{cell}<=0.8", f'"{C.VERDICT_BANDS[0]}"'),
        (f"{cell}<=1", f'"{C.VERDICT_BANDS[1]}"'),
    ], f'"{C.VERDICT_BANDS[2]}"') + ")")


def _row(ws, r, label, note=None, *, bold=False):
    ws.merge_cells(f"A{r}:C{r}")
    put(ws, f"A{r}", label, font=F_BODY_B if bold else F_BODY, align=WRAP_MID)
    ws.row_dimensions[r].height = 24
    if note:
        ws.merge_cells(f"E{r}:H{r}")
        put(ws, f"E{r}", note, font=F_NOTE, align=WRAP_MID)


def retry_block(ws: Worksheet, top: int, *, src_map: dict, src_limits: dict,
                data=None, helper: str = "N", set_widths: bool = True) -> dict:
    t = block_head(ws, top, C.TAB_RETRY, C.QUESTIONS[2][1])
    if set_widths:
        # This block has no header row, and header_row is what sets widths
        # everywhere else. Without this the merged A:C label is 26 characters
        # wide and every label wraps into the row underneath it.
        widths(ws, {"A": 26, "B": 13, "C": 11, "D": 18, "E": 24, "F": 20, "G": 18, "H": 16})

    put(ws, f"A{t}", "Inputs", font=F_H2)
    i0 = t + 1
    r_clean, r_ref, r_scope, r_max, r_bill, r_peak, r_tpm = (i0 + k for k in range(7))

    _row(ws, r_clean, "Tokens per clean run", "Linked from the workflow map. Type over it to model a different run.")
    inp(ws, f"D{r_clean}", f"={src_map['clean_run']}", fmt=NUMFMT, align=RIGHT, font=F_NUM)

    _row(ws, r_ref, "Step most likely to be refused (step #)")
    inp(ws, f"D{r_ref}", data["refused_step"] if data else None, align=RIGHT, font=F_NUM)

    _row(ws, r_scope, "Retry scope", "What a retry re-runs: the whole task, everything since the last checkpoint, or only the refused call.")
    inp(ws, f"D{r_scope}", data["scope"] if data else None)

    _row(ws, r_max, "Max retries per task")
    inp(ws, f"D{r_max}", data["max_retries"] if data else None, align=RIGHT, font=F_NUM)

    _row(ws, r_bill, "Refused calls count against quota?", C.BILLED_NOTE)
    inp(ws, f"D{r_bill}", data["billed"] if data else "No", align=CENTER)

    _row(ws, r_peak, "Peak tasks started per minute")
    inp(ws, f"D{r_peak}", data["peak_tasks"] if data else None, align=RIGHT, font=F_NUM)

    _row(ws, r_tpm, "Token-per-minute limit for the shared quota",
         "Linked from the first limit row with unit tokens and window per minute. Type over it if that is not the one.")
    inp(ws, f"D{r_tpm}",
        f'=IFERROR(INDEX({src_limits["value"]},MATCH("tpm",{src_limits["tpm_flag"]},0)),"")',
        fmt=NUMFMT, align=RIGHT, font=F_NUM)

    validate(ws, C.RETRY_SCOPES, f"D{r_scope}")
    validate(ws, C.YESNO, f"D{r_bill}")

    # Hidden working. Each one is a step the reader should be able to check by
    # hand, which is why they are separate cells rather than one long formula.
    h_ready, h_restart, h_cp, h_resume, h_band = (f"{helper}{r_clean + k}" for k in range(5))
    calc(ws, h_ready, f'=AND(D{r_clean}<>"",D{r_ref}<>"",D{r_scope}<>"",D{r_max}<>"")')
    calc(ws, h_restart,
         f'=IF({h_ready},IF(D{r_ref}<=1,0,INDEX({src_map["cum"]},D{r_ref}-1)),"")')
    calc(ws, h_cp, f'=IF({h_ready},IF(D{r_ref}<=1,0,INDEX({src_map["cp"]},D{r_ref}-1)),"")')
    calc(ws, h_resume,
         f'=IF({h_ready},IF(D{r_ref}<=1,0,IF({h_cp}=0,{h_restart},'
         f'{h_restart}-INDEX({src_map["cum"]},{h_cp}))),"")')

    t2 = r_tpm + 2
    put(ws, f"A{t2}", "What retries cost", font=F_H2)
    c_rep, c_succ, c_give, c_amp = (t2 + k for k in range(1, 5))

    _row(ws, c_rep, "Tokens repeated per failed attempt",
         "Work already paid for that a retry pays for again.")
    # An unrecognised retry scope falls through to "", which the arithmetic
    # below turns into an error, which IFERROR turns into a blank. That is on
    # purpose: a scope the sheet does not understand must not quietly price
    # itself as a restart.
    scope_cost = ifs([
        (f'D{r_scope}="Retry the call only"', "0"),
        (f'D{r_scope}="Restart task"', h_restart),
        (f'D{r_scope}="Resume from last checkpoint"', h_resume),
    ])
    calc(ws, f"D{c_rep}",
         f'=IF({h_ready},IFERROR({scope_cost}'
         f'+IF(D{r_bill}="Yes",INDEX({src_map["tin"]},D{r_ref}),0),""),"")',
         fmt=NUMFMT, font=F_BIGNUM, border=EDGE_HAIR_BOTTOM)

    _row(ws, c_succ, "Worst case, eventually succeeds")
    calc(ws, f"D{c_succ}", f'=IF(D{c_rep}="","",D{r_max}*D{c_rep}+D{r_clean})',
         fmt=NUMFMT, font=F_BIGNUM, border=EDGE_HAIR_BOTTOM)

    _row(ws, c_give, "Worst case, gives up", "Spent with nothing booked.")
    calc(ws, f"D{c_give}", f'=IF(D{c_rep}="","",(D{r_max}+1)*D{c_rep})',
         fmt=NUMFMT, font=F_BIGNUM, border=EDGE_HAIR_BOTTOM)

    _row(ws, c_amp, "Amplification factor", "Worst case that succeeds, over one clean run.")
    calc(ws, f"D{c_amp}", f'=IF(D{c_succ}="","",IFERROR(ROUND(D{c_succ}/D{r_clean},2),""))',
         fmt=AMPFMT, font=F_BIGNUM, border=EDGE_HAIR_BOTTOM)

    t3 = c_amp + 2
    put(ws, f"A{t3}", "At peak", font=F_H2)
    p_norm, p_worst, q_norm, q_worst = (t3 + k for k in range(1, 5))

    _row(ws, p_norm, "Peak demand, normal", "Tokens per minute if nothing is refused.")
    calc(ws, f"D{p_norm}", f'=IF(OR(D{r_peak}="",D{r_clean}=""),"",D{r_peak}*D{r_clean})',
         fmt=NUMFMT, font=F_BIGNUM, border=EDGE_HAIR_BOTTOM)
    _row(ws, p_worst, "Peak demand, worst case", "Tokens per minute if every task is refused at that step.")
    calc(ws, f"D{p_worst}", f'=IF(OR(D{r_peak}="",D{c_succ}=""),"",D{r_peak}*D{c_succ})',
         fmt=NUMFMT, font=F_BIGNUM, border=EDGE_HAIR_BOTTOM)

    _row(ws, q_norm, "Quota used, normal")
    calc(ws, f"D{q_norm}",
         f'=IF(OR(D{p_norm}="",D{r_tpm}="",D{r_tpm}=0),"",IFERROR(D{p_norm}/D{r_tpm},""))',
         fmt=PCTFMT, font=F_BIGNUM, border=EDGE_HAIR_BOTTOM)
    ws.merge_cells(f"E{q_norm}:H{q_norm}")
    calc(ws, f"E{q_norm}", "=" + band_formula(f"D{q_norm}"), font=F_NOTE, align=WRAP_MID)

    _row(ws, q_worst, "Quota used, worst case")
    calc(ws, f"D{q_worst}",
         f'=IF(OR(D{p_worst}="",D{r_tpm}="",D{r_tpm}=0),"",IFERROR(D{p_worst}/D{r_tpm},""))',
         fmt=PCTFMT, font=F_BIGNUM, border=EDGE_HAIR_BOTTOM)

    v = q_worst + 2
    ws.merge_cells(f"A{v}:C{v}")
    put(ws, f"A{v}", "Verdict", font=F_BODY_B, align=LEFT)
    ws.merge_cells(f"D{v}:H{v}")
    ws.row_dimensions[v].height = 30
    # Without a resting fill the verdict is an invisible strip until a band
    # matches it, so the blank template shows no slot at all.
    for col in "ABCDEFGH":
        ws[f"{col}{v}"].fill = FILL_MIST
    calc(ws, f"D{v}", "=" + band_formula(f"D{q_worst}"), font=F_VERDICT,
         align=Alignment(horizontal="left", vertical="center"))
    for band, fill, colour in (
        (C.VERDICT_BANDS[0], FILL_OK, "success"),
        (C.VERDICT_BANDS[1], FILL_WARN, "warning"),
        (C.VERDICT_BANDS[2], FILL_BAD, "danger"),
    ):
        ws.conditional_formatting.add(
            f"A{v}:H{v}",
            FormulaRule(formula=[f'$D${v}="{band}"'], fill=fill,
                        font=Font(name=BODY, size=13, bold=True, color=rgb(colour))))

    note = v + 2
    ws.merge_cells(f"A{note}:H{note + 1}")
    put(ws, f"A{note}", C.PLANNING_NOTE, font=F_NOTE, align=WRAP)
    ws.row_dimensions[note].height = 16
    ws.row_dimensions[note + 1].height = 16
    hide(ws, helper)

    return {"verdict": f"D{v}", "quota_worst": f"D{q_worst}", "quota_norm": f"D{q_norm}",
            "amp": f"D{c_amp}", "repeated": f"D{c_rep}", "succeeds": f"D{c_succ}",
            "gives_up": f"D{c_give}", "peak_norm": f"D{p_norm}", "peak_worst": f"D{p_worst}",
            "clean": f"D{r_clean}", "tpm": f"D{r_tpm}", "scope": f"D{r_scope}",
            "refused": f"D{r_ref}", "band_norm": f"E{q_norm}", "bottom": note + 1}


# ------------------------------------------------------------ 4 · stop states


def stop_block(ws: Worksheet, top: int, *, src_map: dict, src_prefix: str = "",
               data=None, helper: str = "O") -> dict:
    n = src_map["n"]
    hdr = block_head(ws, top, C.TAB_STOP, C.QUESTIONS[3][1])
    cap = hdr + 1
    r0, r1 = cap + 1, cap + n
    header_row(ws, hdr, C.STOP_HEADERS)
    caption_row(ws, cap, C.STOP_HEADERS)

    # Twelve rows that MIRROR the workflow map, rather than only the rows that
    # have a side effect. The brief allows either. Auto-populating just the
    # side-effect rows means a reader who changes a step's side effect on tab 1
    # silently moves somebody else's clean-up plan onto a different step, and
    # nothing on screen says so. Mirroring keeps a row tied to its step.
    for i in range(n):
        r, sr = r0 + i, src_map["r0"] + i
        ws.row_dimensions[r].height = 30
        given = data.get(i + 1) if data else None
        put(ws, f"A{r}", i + 1, font=F_NUM, align=CENTER, border=EDGE_HAIR_BOTTOM)
        calc(ws, f"B{r}", f'=IF({src_prefix}B{sr}="","",{src_prefix}B{sr})',
             font=F_BODY, align=WRAP_MID, border=EDGE_HAIR_BOTTOM)
        calc(ws, f"C{r}", f'=IF({src_prefix}E{sr}="","",{src_prefix}E{sr})',
             font=F_BODY, align=WRAP_MID, border=EDGE_HAIR_BOTTOM)
        for j, col in enumerate("DEFGHIJ"):
            value = given[j] if given else None
            align = CENTER if col in ("G", "I", "J") else WRAP_MID
            inp(ws, f"{col}{r}", value, align=align)
        calc(ws, f"{helper}{r}",
             f'=IF(OR(C{r}="Reversible",C{r}="Irreversible"),IF(OR(F{r}="",H{r}=""),1,0),0)')

    validate(ws, C.AUTO_MANUAL, f"G{r0}:G{r1}")
    validate(ws, C.YESNO, f"I{r0}:I{r1}")
    validate(ws, C.STOP_COST, f"J{r0}:J{r1}")

    # A step with no side effect leaves nothing behind, so its row is dimmed
    # rather than removed: the step numbers still line up with the map.
    ws.conditional_formatting.add(
        f"A{r0}:J{r1}",
        FormulaRule(formula=[f'OR($C{r0}="None",$C{r0}="")'], fill=FILL_MIST,
                    font=Font(name=BODY, size=11, color=rgb("text_quiet"))))

    s1 = r1 + 2
    summary_line(ws, s1, "Stop states with no clean-up plan", "F",
                 f"=SUM({helper}{r0}:{helper}{r1})", label_to="E")
    ws.conditional_formatting.add(
        f"F{s1}", FormulaRule(formula=[f"F{s1}>0"], fill=FILL_BAD,
                              font=Font(name=FIGURES, size=14, bold=True, color=rgb("danger"))))
    put(ws, f"G{s1}", "A step with a side effect, and no clean-up action or no owner.",
        font=F_NOTE)
    hide(ws, helper)
    return {"missing": f"F{s1}", "r0": r0, "r1": r1, "bottom": s1}


# --------------------------------------------------------------- 5 · decision


def decision_block(ws: Worksheet, top: int, *, src_retry: dict, src_stop: dict,
                   stop_prefix: str = "", retry_prefix: str = "",
                   answers=None, policy=None, helper_a: str = "P",
                   helper_b: str = "Q") -> dict:
    hdr = block_head(ws, top, C.TAB_DECISION, C.QUESTIONS[4][1])
    heads = [("#", 8, None), ("Check", 62, "★ marks a critical check. One No on a critical check is a Hold, whatever the score."),
             ("Answer", 14, None), ("Points", 10, "Yes 2 · Partial 1 · No 0"),
             ("From your own sheet", 40, None)]
    header_row(ws, hdr, heads)
    cap = hdr + 1
    caption_row(ws, cap, heads)
    r0, r1 = cap + 1, cap + len(C.CHECKS)

    for i, (text, critical) in enumerate(C.CHECKS):
        r = r0 + i
        ws.row_dimensions[r].height = 30
        put(ws, f"A{r}", ("★ " if critical else "") + f"{i + 1:02d}",
            font=Font(name=FIGURES, size=10, bold=critical,
                      color=rgb("danger" if critical else "text_quiet")),
            align=CENTER, border=EDGE_HAIR_BOTTOM)
        put(ws, f"B{r}", text, font=F_BODY, align=WRAP_MID)
        inp(ws, f"C{r}", answers[i] if answers else None, align=CENTER)
        points = ifs([(f'C{r}="Yes"', "2"), (f'C{r}="Partial"', "1"), (f'C{r}="No"', "0")])
        calc(ws, f"D{r}", f'=IF(C{r}="","",{points})', align=CENTER,
             border=EDGE_HAIR_BOTTOM)
        calc(ws, f"{helper_a}{r}", 1 if critical else 0)
        calc(ws, f"{helper_b}{r}", f'=IF(AND({helper_a}{r}=1,C{r}="No"),1,0)')

    # Checks 8 and 9 are answered from evidence the sheet already holds, so the
    # evidence is printed beside them rather than left to memory.
    calc(ws, f"E{r0 + 7}",
         f'="Stop states with no clean-up plan: "&{stop_prefix}{src_stop["missing"]}',
         font=F_NOTE, align=WRAP_MID)
    calc(ws, f"E{r0 + 8}", f'={retry_prefix}{src_retry["verdict"]}',
         font=F_NOTE, align=WRAP_MID)

    validate(ws, C.ANSWERS, f"C{r0}:C{r1}")

    s_total, s_crit = r1 + 2, r1 + 3
    summary_line(ws, s_total, "Total", "D", f"=SUM(D{r0}:D{r1})", fmt="0", label_to="C")
    put(ws, f"E{s_total}", "Out of 20.", font=F_NOTE)
    summary_line(ws, s_crit, "Critical checks answered No", "D",
                 f"=SUM({helper_b}{r0}:{helper_b}{r1})", fmt="0", label_to="C")
    ws.conditional_formatting.add(
        f"D{s_crit}", FormulaRule(formula=[f"D{s_crit}>0"], fill=FILL_BAD,
                                  font=Font(name=FIGURES, size=14, bold=True, color=rgb("danger"))))

    h_answered = f"{helper_a}{s_total}"
    calc(ws, h_answered,
         f'=COUNTIF(C{r0}:C{r1},"Yes")+COUNTIF(C{r0}:C{r1},"Partial")+COUNTIF(C{r0}:C{r1},"No")')

    d = s_crit + 2
    ws.merge_cells(f"A{d}:B{d}")
    put(ws, f"A{d}", "Decision", font=F_BODY_B, align=LEFT)
    ws.merge_cells(f"C{d}:E{d}")
    ws.row_dimensions[d].height = 34
    # An unanswered sheet is not a "Fix first". Without this guard a blank
    # template scores 0, sees no critical No, and prints a verdict on a
    # workflow nobody has described.
    verdict = ifs([(f"D{s_crit}>0", '"Hold"'), (f"D{s_total}>=16", '"Ready to scale"')],
                  '"Fix first"')
    calc(ws, f"C{d}",
         f'=IF({h_answered}<{len(C.CHECKS)},"Not scored yet",{verdict})',
         font=F_VERDICT, align=Alignment(horizontal="left", vertical="center"))
    lab = d + 1
    ws.merge_cells(f"C{lab}:E{lab}")
    calc(ws, f"C{lab}", "=" + ifs([
        (f'C{d}="Hold"', f'"{C.DECISION_LABELS["hold"]}"'),
        (f'C{d}="Fix first"', f'"{C.DECISION_LABELS["fix"]}"'),
        (f'C{d}="Ready to scale"', f'"{C.DECISION_LABELS["ready"]}"'),
        (f'C{d}="Not scored yet"', f'"{C.DECISION_LABELS["unscored"]}"'),
    ]), font=F_NOTE, align=LEFT)
    for word, fill, colour in (
        ("Ready to scale", FILL_OK, "success"),
        ("Fix first", FILL_WARN, "warning"),
        ("Hold", FILL_BAD, "danger"),
        ("Not scored yet", FILL_MIST, "text_quiet"),
    ):
        ws.conditional_formatting.add(
            f"A{d}:E{d}",
            FormulaRule(formula=[f'$C${d}="{word}"'], fill=fill,
                        font=Font(name=BODY, size=13, bold=True, color=rgb(colour))))

    p = lab + 2
    put(ws, f"A{p}", "Your limit policy", font=F_H2)
    ws.merge_cells(f"A{p + 1}:E{p + 1}")
    put(ws, f"A{p + 1}",
        "The one-page artefact. Fill this in and take it to your team.",
        font=F_NOTE, align=LEFT)
    for i, (label, note) in enumerate(C.POLICY_ROWS):
        r = p + 2 + i
        ws.row_dimensions[r].height = 34
        # Column A is the 8-wide "#" column for the checks above, so a policy
        # label put there is cut off mid-word. It spans A:B instead.
        ws.merge_cells(f"A{r}:B{r}")
        put(ws, f"A{r}", label, font=F_BODY_B, align=WRAP_MID)
        ws.merge_cells(f"C{r}:D{r}")
        inp(ws, f"C{r}", policy[i] if policy else None, align=WRAP_MID)
        put(ws, f"E{r}", note, font=F_NOTE, align=WRAP_MID)
    hide(ws, helper_a, helper_b)
    return {"decision": f"C{d}", "total": f"D{s_total}", "critical": f"D{s_crit}",
            "r0": r0, "r1": r1, "bottom": p + 1 + len(C.POLICY_ROWS)}


# ------------------------------------------------------------- 0 · start here


def cover(ws: Worksheet):
    ws.sheet_view.showGridLines = False
    widths(ws, {"A": 2.4, "B": 20, "C": 62, "D": 26})

    # THE REAL LOCKUP, on the paper ground.
    #
    # The mark beside the lettering, which is what BrandLockup.astro puts on
    # every page. Both files are keyed — RGBA with a real alpha channel — so
    # they need no tile behind them.
    #
    # They are NOT put on a forest band. The artwork is dark forest and gold,
    # drawn for a light ground, and the band this cover used to carry would
    # have hidden it. The previous version set the wordmark in type with a sun
    # dot beside it, because no artwork existed in the repository at the time.
    # It does now.
    lockup, lw, lh = brand_lockup()
    img = XlImage(str(lockup))
    img.width, img.height = lw, lh
    img.anchor = "B2"
    ws.add_image(img)

    ws.row_dimensions[2].height = 40
    ws.row_dimensions[3].height = 14
    put(ws, "B4", "RESOURCES · AGENTIC SYSTEM DESIGN", font=F_WORDSUB, align=LEFT)
    ws.row_dimensions[4].height = 14

    ws.merge_cells("B6:D6")
    put(ws, "B6", C.TITLE, font=F_TITLE)
    ws.row_dimensions[6].height = 40
    ws.merge_cells("B7:D7")
    put(ws, "B7", C.TAGLINE, font=F_LEAD, align=WRAP)
    ws.row_dimensions[7].height = 34
    ws.merge_cells("B8:D8")
    put(ws, "B8", C.AUTHOR, font=Font(name=FIGURES, size=9, color=rgb("text_quiet")))

    r = 10
    for label, text in (
        ("What to bring", C.WHAT_TO_BRING),
        ("What to do", C.WHAT_TO_DO),
        ("What you leave with", C.WHAT_YOU_LEAVE_WITH),
        ("How to use it", C.HOW_TO_USE),
    ):
        put(ws, f"B{r}", label, font=F_LABEL, align=Alignment(horizontal="left", vertical="top"))
        ws.merge_cells(f"C{r}:D{r}")
        put(ws, f"C{r}", text, font=F_BODY, align=WRAP)
        ws.row_dimensions[r].height = 46 if len(text) > 120 else 30
        r += 2

    put(ws, f"B{r}", "The five questions", font=F_LABEL,
        align=Alignment(horizontal="left", vertical="top"))
    for _num, question, tab in C.QUESTIONS:
        put(ws, f"C{r}", question, font=F_BODY, align=WRAP)
        put(ws, f"D{r}", tab, font=Font(name=FIGURES, size=9, color=rgb("accent_ink_strong")),
            align=Alignment(horizontal="left", vertical="center"))
        ws.row_dimensions[r].height = 22
        r += 1
    r += 1

    put(ws, f"B{r}", "Cell legend", font=F_LABEL,
        align=Alignment(horizontal="left", vertical="top"))
    put(ws, f"C{r}", C.LEGEND, font=F_BODY, align=LEFT)
    ws.row_dimensions[r].height = 22
    r += 1
    inp(ws, f"C{r}", "Yours to fill")
    put(ws, f"D{r}", "Shaded, with a thin border.", font=F_NOTE)
    ws.row_dimensions[r].height = 22
    r += 1
    put(ws, f"C{r}", "Calculates for you", font=F_NUM)
    put(ws, f"D{r}", "No fill, and locked.", font=F_NOTE)
    ws.row_dimensions[r].height = 22
    r += 2

    ws.merge_cells(f"B{r}:D{r}")
    put(ws, f"B{r}", C.FOOTER, font=Font(name=FIGURES, size=9, color=rgb("text_quiet")))
    return r


# ---------------------------------------------------------------------- main


def qualify(d: dict, prefix: str) -> dict:
    """Prefix the cell and range values so another sheet can read them."""
    out = dict(d)
    for key in ("clean_run", "cum", "cp", "tin", "name", "side", "value", "tpm_flag",
                "verdict", "missing"):
        if key in out:
            out[key] = f"{prefix}{out[key]}"
    return out


def page_setup(ws: Worksheet, fit_height: int = 1):
    """Landscape, fitted to the page width. Readers print these."""
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = fit_height
    ws.page_margins.left = ws.page_margins.right = 0.4
    ws.page_margins.top = ws.page_margins.bottom = 0.4


def protect(ws: Worksheet):
    """A guide rail, not security: no password, and the reader can turn it off."""
    ws.protection.sheet = True
    ws.protection.formatCells = False
    ws.protection.selectLockedCells = False
    ws.protection.selectUnlockedCells = False


def main() -> int:
    wb = Workbook()
    wb.remove(wb.active)
    ws_cover = wb.create_sheet(C.TAB_COVER)
    ws_map = wb.create_sheet(C.TAB_MAP)
    ws_lim = wb.create_sheet(C.TAB_LIMITS)
    ws_ret = wb.create_sheet(C.TAB_RETRY)
    ws_stop = wb.create_sheet(C.TAB_STOP)
    ws_dec = wb.create_sheet(C.TAB_DECISION)
    ws_ex = wb.create_sheet(C.TAB_EXAMPLE)

    cover(ws_cover)
    ws_cover.sheet_properties.tabColor = rgb("sun")[2:]

    # --- the blank template, one block per tab ---------------------------
    m = map_block(ws_map, 1)
    ws_map.freeze_panes = f"A{m['r0']}"

    l = limits_block(ws_lim, 1)
    ws_lim.freeze_panes = f"A{l['r0']}"

    r = retry_block(ws_ret, 1,
                    src_map=qualify(m, f"'{C.TAB_MAP}'!"),
                    src_limits=qualify(l, f"'{C.TAB_LIMITS}'!"))
    ws_ret.sheet_view.showGridLines = False

    s = stop_block(ws_stop, 1, src_map=m, src_prefix=f"'{C.TAB_MAP}'!")
    ws_stop.freeze_panes = f"A{s['r0']}"

    d = decision_block(ws_dec, 1, src_retry=r, src_stop=s,
                       stop_prefix=f"'{C.TAB_STOP}'!", retry_prefix=f"'{C.TAB_RETRY}'!")
    ws_dec.sheet_view.showGridLines = False
    ws_dec.freeze_panes = f"A{d['r0']}"

    # --- the worked example: the same five blocks, on one sheet ----------
    ws_ex.merge_cells("A1:J1")
    put(ws_ex, "A1", C.EXAMPLE_BANNER, fill=FILL_WARN,
        font=Font(name=BODY, size=12, bold=True, color=rgb("warning")))
    ws_ex.row_dimensions[1].height = 26
    ws_ex.merge_cells("A2:J2")
    put(ws_ex, "A2", C.EXAMPLE_INTRO, font=F_NOTE, align=WRAP)
    ws_ex.row_dimensions[2].height = 26

    xm = map_block(ws_ex, 4, steps=C.EXAMPLE_STEPS, helper="N")
    xl = limits_block(ws_ex, xm["bottom"] + 3, rows=C.EXAMPLE_LIMITS, helper="O")
    xr = retry_block(ws_ex, xl["bottom"] + 3, src_map=xm, src_limits=xl,
                     data=C.EXAMPLE_RETRY, helper="P", set_widths=False)
    xs = stop_block(ws_ex, xr["bottom"] + 3, src_map=xm, src_prefix="",
                    data=C.EXAMPLE_STOP, helper="Q")
    xd = decision_block(ws_ex, xs["bottom"] + 3, src_retry=xr, src_stop=xs,
                        answers=C.EXAMPLE_ANSWERS, policy=C.EXAMPLE_POLICY,
                        helper_a="R", helper_b="S")
    ws_ex.freeze_panes = "A3"
    # Five blocks share one sheet, so the last block written would otherwise
    # set the column widths for all of them. One profile, applied at the end.
    widths(ws_ex, {"A": 9, "B": 44, "C": 17, "D": 20, "E": 26, "F": 30,
                   "G": 20, "H": 20, "I": 19, "J": 14, "K": 14, "L": 14, "M": 14})
    for row in range(xd["r0"], xd["r1"] + 1):
        ws_ex.row_dimensions[row].height = 34

    for ws in wb.worksheets:
        # The worked example is five blocks tall and will not fit one page.
        page_setup(ws, fit_height=0 if ws is ws_ex else 1)
        protect(ws)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    print(f"wrote {OUT.relative_to(REPO)}  ({OUT.stat().st_size:,} bytes)")

    refs = {
        "example": {
            "clean_run": xm["clean_run"], "unsafe": f"H{xm['bottom']}",
            "repeated": xr["repeated"], "succeeds": xr["succeeds"],
            "gives_up": xr["gives_up"], "amp": xr["amp"],
            "peak_norm": xr["peak_norm"], "peak_worst": xr["peak_worst"],
            "quota_norm": xr["quota_norm"], "quota_worst": xr["quota_worst"],
            "verdict": xr["verdict"], "band_norm": xr["band_norm"],
            "scope": xr["scope"], "missing_stop": xs["missing"],
            "total": xd["total"], "critical": xd["critical"], "decision": xd["decision"],
            "cp_col": "K", "cp_row_step3": xm["r0"] + 2,
        },
        "blank": {
            "map_clean_run": m["clean_run"], "retry_repeated": r["repeated"],
            "retry_verdict": r["verdict"], "decision": d["decision"],
            "stop_missing": s["missing"], "total": d["total"],
        },
        "sheets": {
            "cover": C.TAB_COVER, "map": C.TAB_MAP, "limits": C.TAB_LIMITS,
            "retry": C.TAB_RETRY, "stop": C.TAB_STOP, "decision": C.TAB_DECISION,
            "example": C.TAB_EXAMPLE,
        },
    }
    (HERE / "refs.json").write_text(json.dumps(refs, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {(HERE / 'refs.json').relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
