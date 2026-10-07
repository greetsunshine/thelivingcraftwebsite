#!/usr/bin/env python3
"""Render each tab to a PNG so the sheet can be looked at, not just asserted.

LibreOffice prints the workbook to PDF, one or more pages per tab, and each
page is rasterised. Output goes to the scratch directory, not into the repo:
these are for review, not for publishing.

Run:  python3 tools/citation-fit-check/render_previews.py [outdir]
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

import fitz  # pymupdf

HERE = Path(__file__).resolve().parent
XLSX = HERE.parents[1] / "downloads" / "citation-fit-check.xlsx"
SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"


def main() -> int:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(tempfile.mkdtemp(prefix="cfc-png-"))
    out.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="cfc-pdf-"))
    subprocess.run([SOFFICE, "--headless", "--norestore", "--convert-to", "pdf",
                    "--outdir", str(work), str(XLSX)], check=True, capture_output=True, timeout=300)
    pdf = work / (XLSX.stem + ".pdf")
    doc = fitz.open(pdf)
    for i, page in enumerate(doc, 1):
        png = out / f"tab-{i:02d}.png"
        page.get_pixmap(dpi=120).save(png)
        print(f"{png}  {page.rect.width:.0f}x{page.rect.height:.0f}pt")
    print(f"\n{len(doc)} page(s) -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
