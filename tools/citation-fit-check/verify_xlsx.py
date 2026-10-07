#!/usr/bin/env python3
"""Recalculate the workbook in LibreOffice and assert the brief's acceptance tests.

openpyxl writes formulas and no cached values, so every value read back here
was computed by a real spreadsheet engine rather than copied from a script.

What is checked:
  1. The Worked Example reproduces every expected output in the brief,
     section 3, Tab 5. The figures are typed below from the brief, and they
     are also compared with what src/lib/citationFit.ts computes (refs.json,
     written by build_xlsx.py from dump_content.ts), so the page and the
     workbook cannot disagree.
  2. Checks 4, 7 and 11 changed to Yes: 16, Fix first. Every check Yes: 24, Ready.
  3. The blank tabs show blanks or 0, never an error.
  4. No cell on any tab, in any of the three recalculated copies, holds
     #REF!, #DIV/0!, #VALUE!, #NAME? or any other error.

Run:  python3 tools/citation-fit-check/verify_xlsx.py
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import openpyxl

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
XLSX = REPO / "downloads" / "citation-fit-check.xlsx"
REFS = json.loads((HERE / "refs.json").read_text(encoding="utf-8"))

SOFFICE_CANDIDATES = [
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/opt/homebrew/bin/soffice",
    "/usr/local/bin/soffice",
    "/usr/bin/soffice",
]
ERRORS = ("#REF!", "#DIV/0!", "#VALUE!", "#NAME?", "#N/A", "#NULL!", "#NUM!", "Err:")

# The brief, section 3, Tab 5: "Expected outputs. These are the acceptance tests."
BRIEF = {
    "rulesMapped": 3,
    "storedAway": 2,
    "cannotCheck": 1,
    "conditionRecall": 0.4,
    "citedButWrong": 3,
    "accuracy": 0.7,
    "total": 10,
    "criticalNo": [4, 7, 11],
    "decision": "Hold",
    "nextStep": 4,          # check 4's text
    "testCasesWritten": 1,
}

failures: list[str] = []
passes: list[str] = []


def check(label: str, got, want, *, tol: float = 1e-9):
    ok = (abs(got - want) <= tol) if isinstance(want, float) and isinstance(got, (int, float)) else got == want
    (passes if ok else failures).append(f"{'PASS' if ok else 'FAIL'}  {label}: got {got!r}, want {want!r}")


def soffice() -> str:
    for path in SOFFICE_CANDIDATES:
        if Path(path).exists():
            return path
    found = shutil.which("soffice") or shutil.which("libreoffice")
    if not found:
        raise SystemExit("LibreOffice is required: brew install --cask libreoffice")
    return found


def recalc(src: Path) -> openpyxl.Workbook:
    out = Path(tempfile.mkdtemp(prefix="cfc-lo-"))
    subprocess.run([soffice(), "--headless", "--norestore", "--convert-to", "xlsx", "--outdir", str(out), str(src)],
                   check=True, capture_output=True, timeout=300)
    got = out / (src.stem + ".xlsx")
    if not got.exists():
        raise SystemExit(f"LibreOffice produced nothing for {src}")
    return openpyxl.load_workbook(got, data_only=True)


def variant(name: str, answers: dict[int, str]) -> Path:
    """A copy of the workbook with some of the Worked Example's answers changed."""
    wb = openpyxl.load_workbook(XLSX)
    ws = wb[REFS["example"]["sheet"]]
    for n, a in answers.items():
        ws[REFS["example"]["checklist"]["answers"][str(n)]] = a
    path = Path(tempfile.mkdtemp(prefix="cfc-var-")) / f"{name}.xlsx"
    wb.save(path)
    return path


def no_errors(label: str, wb: openpyxl.Workbook):
    bad = [f"{ws.title}!{c.coordinate}={c.value}" for ws in wb.worksheets for row in ws.iter_rows() for c in row
           if isinstance(c.value, str) and c.value.startswith(ERRORS)]
    check(f"{label}: no error values in any cell", bad, [])


def main() -> int:
    ex = REFS["example"]
    sheet = ex["sheet"]
    cm, sc, ck, tc = ex["conditionMap"], ex["spotCheck"], ex["checklist"], ex["testCases"]
    texts = {c["n"]: c["text"] for c in REFS["checks"]}
    critical = [c["n"] for c in REFS["checks"] if c["critical"]]

    # ---- 1 · the worked example -------------------------------------------
    wb = recalc(XLSX)
    no_errors("as built", wb)
    w = wb[sheet]
    got = {
        "rulesMapped": w[cm["rulesMapped"]].value,
        "storedAway": w[cm["storedAway"]].value,
        "cannotCheck": w[cm["cannotCheck"]].value,
        "conditionRecall": w[sc["conditionRecall"]].value,
        "citedButWrong": w[sc["citedButWrong"]].value,
        "accuracy": w[sc["accuracy"]].value,
        "total": w[ck["total"]].value,
        "criticalNo": [n for n in critical if w[ck["answers"][str(n)]].value == "No"],
        "decision": w[ck["decision"]].value,
        "nextStep": w[ck["nextStep"]].value,
        "testCasesWritten": w[tc["testCasesWritten"]].value,
    }
    for key, want in BRIEF.items():
        if key == "nextStep":
            check("Worked Example: your next step is check 4's text", got[key], texts[want])
        else:
            check(f"Worked Example: {key}", got[key], want)
    # The page prints these from src/lib/citationFit.ts; the workbook must agree.
    for key, want in REFS["expected"].items():
        if key == "nextStep":
            check("workbook agrees with citationFit.ts: nextStep", got[key], want)
        else:
            check(f"workbook agrees with citationFit.ts: {key}", got[key], want)
    check("Worked Example: 4 of 10 answers had the condition retrieved",
          sum(1 for r in range(sc["hdr"] + 1, sc["end"] + 1) if w[f"E{r}"].value == "Yes"), 4)
    statuses = {n: w[ref].value for n, ref in ck["status"].items()}
    check("Worked Example: status words", [statuses[str(n)] for n in range(1, 13)],
          ["Pass", "Pass", "Fail", "Fail", "Pass", "Partial", "Fail", "Fail", "Fail", "Partial", "Fail", "Pass"])

    # ---- 2 · the two edits the brief asks for --------------------------------
    w2 = recalc(variant("fix-first", {4: "Yes", 7: "Yes", 11: "Yes"}))
    no_errors("checks 4, 7, 11 = Yes", w2)
    check("4, 7, 11 = Yes: total", w2[sheet][ck["total"]].value, 16)
    check("4, 7, 11 = Yes: decision", w2[sheet][ck["decision"]].value, "Fix first")
    check("4, 7, 11 = Yes: next step is the first No (check 3)", w2[sheet][ck["nextStep"]].value, texts[3])

    w3 = recalc(variant("ready", {n: "Yes" for n in range(1, 13)}))
    no_errors("every check = Yes", w3)
    check("all Yes: total", w3[sheet][ck["total"]].value, 24)
    check("all Yes: decision", w3[sheet][ck["decision"]].value, "Ready")
    check("all Yes: no next step", w3[sheet][ck["nextStep"]].value in (None, ""), True)

    # A critical Partial does not block Ready; only a critical No does.
    w4 = recalc(variant("critical-partial", {**{n: "Yes" for n in range(1, 13)}, **{n: "Partial" for n in critical}}))
    no_errors("critical checks = Partial", w4)
    check("critical Partial, rest Yes: total", w4[sheet][ck["total"]].value, 20)
    check("critical Partial, rest Yes: decision", w4[sheet][ck["decision"]].value, "Ready")
    meaning = next(w4[sheet][f"D{r}"].value for r in [int(ck["decision"][1:])])
    check("Ready meaning says only that no critical check is No", meaning,
          "No critical check is answered No, and the total is 20 or more.")

    # ---- 3 · the blank tabs ------------------------------------------------
    blank = REFS["blank"]
    zero_or_blank = lambda v: v in (None, "", 0)
    for tab, cells in blank.items():
        for key, ref in cells.items():
            if key in ("hdr", "end", "answers", "status"):
                continue
            v = wb[tab][ref].value
            check(f"blank '{tab}' {key} shows blank or 0", zero_or_blank(v), True)
    bck = next(v for k, v in blank.items() if k.startswith("3"))
    tab3 = next(k for k in blank if k.startswith("3"))
    hints = [wb[tab3][f"H{r}"].value for r in range(bck["hdr"] + 1, bck["end"] + 1) if wb[tab3][f"H{r}"].value]
    check("blank checklist: four evidence hints, none an error", len(hints), 4)
    passes.append("INFO  blank hints: " + " | ".join(hints))

    for line in passes + failures:
        print(line)
    print(f"\n{len(passes)} passed, {len(failures)} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
