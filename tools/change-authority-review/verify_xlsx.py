#!/usr/bin/env python3
"""Recalculate the workbook in LibreOffice and assert the brief's acceptance tests.

openpyxl writes formulas and no cached values, so every value read back here
was computed by a real spreadsheet engine rather than copied from a script.

What is checked:
  1. The Worked Example reproduces every expected output in the brief,
     section 3, Tab 4. The figures are typed below from the brief, and they
     are also compared with what src/lib/changeAuthority.ts computes
     (refs.json, written by build_xlsx.py from dump_content.ts), so the page
     and the workbook cannot disagree.
  2. The brief's variants: row 8's choice cleared; row 3's preview saying what
     can't be undone; checks 3 and 4 Yes; then 5 and 8 Yes; then every check
     Yes. Each is a temporary copy. The shipped file is never changed.
  3. The brief's four edge cases, typed into copies of the blank tabs.
  4. The blank tabs show blanks or 0, and no cell on any tab, in any
     recalculated copy, holds #REF!, #DIV/0!, #VALUE!, #NAME? or another error.

Run:  python3 tools/change-authority-review/verify_xlsx.py
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
XLSX = REPO / "downloads" / "change-authority-review.xlsx"
REFS = json.loads((HERE / "refs.json").read_text(encoding="utf-8"))

SOFFICE_CANDIDATES = [
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/opt/homebrew/bin/soffice",
    "/usr/local/bin/soffice",
    "/usr/bin/soffice",
]
ERRORS = ("#REF!", "#DIV/0!", "#VALUE!", "#NAME?", "#N/A", "#NULL!", "#NUM!", "Err:")
AA, PC, NA = "Agent acts", "Preview and consent", "Not allowed"
AUTHORITIES = [AA, PC, NA]

# The brief, section 3, Tab 4: "Expected outputs. These are the acceptance tests."
BRIEF = {
    "listed": 9,
    "suggested": {AA: 3, PC: 6, NA: 0},
    "suggestedRows": [AA, AA, PC, PC, PC, PC, AA, PC, PC],
    "byAuthority": {AA: 3, PC: 5, NA: 1},
    "finalRows": [AA, AA, PC, PC, PC, PC, PC, AA, NA],
    "noAuthority": 0,
    "undoNotTested": 5,
    "overrides": 3,
    "overridesNoReason": 1,
    "consentRemoved": 1,
    "actions": {AA: 3, PC: 5, NA: 1},
    "ready": {AA: 3, PC: 2, NA: 0},
    "readyRows": ["Ready", "Ready", "Not ready", "Ready", "Not ready", "Not ready", "Ready", "Ready", "Not ready"],
    "notReady": 4,
    "previewHides": 2,
    "consentWeak": 2,
    "notActingAs": 1,
    "unsafeRefusal": 1,
    "accessPresent": 1,
    "total": 9,
    "criticalNo": [3, 4],
    "decision": "Hold",
}

failures: list[str] = []
passes: list[str] = []


def check(label: str, got, want):
    ok = got == want
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
    out = Path(tempfile.mkdtemp(prefix="car-lo-"))
    subprocess.run([soffice(), "--headless", "--norestore", "--convert-to", "xlsx", "--outdir", str(out), str(src)],
                   check=True, capture_output=True, timeout=300)
    got = out / (src.stem + ".xlsx")
    if not got.exists():
        raise SystemExit(f"LibreOffice produced nothing for {src}")
    return openpyxl.load_workbook(got, data_only=True)


def variant(name: str, edit) -> Path:
    """A copy of the workbook with `edit(wb)` applied. The shipped file is untouched."""
    wb = openpyxl.load_workbook(XLSX)
    edit(wb)
    path = Path(tempfile.mkdtemp(prefix="car-var-")) / f"{name}.xlsx"
    wb.save(path)
    return path


def no_errors(label: str, wb: openpyxl.Workbook):
    bad = [f"{ws.title}!{c.coordinate}={c.value}" for ws in wb.worksheets for row in ws.iter_rows() for c in row
           if isinstance(c.value, str) and c.value.startswith(ERRORS)]
    check(f"{label}: no error values in any cell", bad, [])


def blankish(v) -> bool:
    return v in (None, "", 0)


def main() -> int:
    ex = REFS["example"]
    sheet = ex["sheet"]
    inv, req, ck = ex["inventory"], ex["requirements"], ex["checklist"]
    texts = {c["n"]: c["text"] for c in REFS["checks"]}
    critical = [c["n"] for c in REFS["checks"] if c["critical"]]
    WHY = REFS["why"]
    E = REFS["expected"]

    # ---- 1 · the worked example -------------------------------------------
    wb = recalc(XLSX)
    no_errors("as built", wb)
    w = wb[sheet]
    v = lambda ref: w[ref].value
    got = {
        "listed": v(inv["listed"]),
        "suggested": {x: v(inv["suggested"][x]) for x in AUTHORITIES},
        "suggestedRows": [v(c) for c in inv["suggestedCells"][:9]],
        "byAuthority": {x: v(inv["byAuthority"][x]) for x in AUTHORITIES},
        "finalRows": [v(c) for c in inv["finalCells"][:9]],
        "noAuthority": v(inv["noAuthority"]),
        "undoNotTested": v(inv["undoNotTested"]),
        "overrides": v(inv["overrides"]),
        "overridesNoReason": v(inv["overridesNoReason"]),
        "consentRemoved": v(inv["consentRemoved"]),
        "actions": {x: v(req["actions"][x]) for x in AUTHORITIES},
        "ready": {x: v(req["ready"][x]) for x in AUTHORITIES},
        "readyRows": [v(c) for c in req["readyCells"][:9]],
        "notReady": v(req["notReady"]),
        "previewHides": v(req["previewHides"]),
        "consentWeak": v(req["consentWeak"]),
        "notActingAs": v(req["notActingAs"]),
        "unsafeRefusal": v(req["unsafeRefusal"]),
        "accessPresent": v(req["accessPresent"]),
        "total": v(ck["total"]),
        "criticalNo": [n for n in critical if v(ck["answers"][str(n)]) == "No"],
        "decision": v(ck["decision"]),
    }
    for key, want in BRIEF.items():
        check(f"Worked Example: {key}", got[key], want)
    check("Worked Example: overrides are rows 7, 8 and 9", [v(c) for c in inv["differsCells"][:9]],
          [None] * 6 + ["Yes"] * 3)
    check("Worked Example: your next step is check 3's text", v(ck["nextStep"]), texts[3])
    whys = [v(c) or "" for c in req["whyCells"][:9]]
    check("Worked Example: row 3 why", whys[2], WHY["previewHidesIrreversible"])
    check("Worked Example: row 5 why", whys[4], WHY["previewPartial"])
    check("Worked Example: row 6 why", whys[5], WHY["noConsenter"])
    check("Worked Example: row 9 why", whys[8], WHY["accessPresent"])
    check("Worked Example: rows 10-20 are empty", [v(c) for c in req["readyCells"][9:]], [None] * 11)
    statuses = [v(ck["status"][str(n)]) for n in range(1, 11)]
    check("Worked Example: status words", statuses,
          ["Pass", "Partial", "Fail", "Fail", "Partial", "Partial", "Partial", "Fail", "Partial", "Pass"])

    # The page prints these from src/lib/changeAuthority.ts; the workbook must agree.
    check("agrees with changeAuthority.ts: suggested", got["suggestedRows"], E["suggested"])
    check("agrees with changeAuthority.ts: final", got["finalRows"], E["final"])
    check("agrees with changeAuthority.ts: ready", [x == "Ready" for x in got["readyRows"]], E["ready"])
    check("agrees with changeAuthority.ts: why not ready", whys, E["whyNot"])
    check("agrees with changeAuthority.ts: tab 2 summary",
          {k: got[k] for k in ("actions", "ready", "notReady", "previewHides", "consentWeak", "notActingAs",
                               "unsafeRefusal", "accessPresent")},
          E["requirements"])
    check("agrees with changeAuthority.ts: total, decision, next step",
          (got["total"], got["decision"], v(ck["nextStep"])), (E["total"], E["decision"], E["nextStep"]))

    # ---- 2 · the brief's variants -----------------------------------------
    def set_example(cells: dict):
        def edit(book):
            for ref, val in cells.items():
                book[sheet][ref] = val
        return edit

    row8_chosen = f"H{inv['first'] + 7}"
    t1b = recalc(variant("row8-cleared", set_example({row8_chosen: None})))
    no_errors("row 8 choice cleared", t1b)
    t1 = t1b[sheet]
    check("tab 1 variant: row 8 final", t1[inv["finalCells"][7]].value, PC)
    check("tab 1 variant: final counts", {x: t1[inv["byAuthority"][x]].value for x in AUTHORITIES},
          {AA: 2, PC: 6, NA: 1})
    check("tab 1 variant: overrides", t1[inv["overrides"]].value, 2)
    check("tab 1 variant: overrides with no reason", t1[inv["overridesNoReason"]].value, 0)
    check("tab 1 variant: consent removed", t1[inv["consentRemoved"]].value, 0)

    t2b = recalc(variant("row3-says", set_example({req["inputs"]["saysIrreversible"][2]: "Yes"})))
    no_errors("row 3 says what can't be undone", t2b)
    t2 = t2b[sheet]
    check("tab 2 variant: row 3 Ready", t2[req["readyCells"][2]].value, "Ready")
    check("tab 2 variant: Preview and consent ready", t2[req["ready"][PC]].value, 3)
    check("tab 2 variant: authority not ready", t2[req["notReady"]].value, 3)
    check("tab 2 variant: previews that hide part of the change", t2[req["previewHides"]].value, 1)

    a = ck["answers"]
    w2b = recalc(variant("3-4-yes", set_example({a["3"]: "Yes", a["4"]: "Yes"})))
    no_errors("checks 3 and 4 = Yes", w2b)
    w2 = w2b[sheet]
    check("3, 4 = Yes: total", w2[ck["total"]].value, 13)
    check("3, 4 = Yes: decision (check 5 is critical and Partial)", w2[ck["decision"]].value, "Fix first")
    check("3, 4 = Yes: next step is check 8's text", w2[ck["nextStep"]].value, texts[8])

    w3 = recalc(variant("3-4-5-8-yes", set_example({a[k]: "Yes" for k in ("3", "4", "5", "8")})))[sheet]
    check("3, 4, 5, 8 = Yes: total", w3[ck["total"]].value, 16)
    check("3, 4, 5, 8 = Yes: decision", w3[ck["decision"]].value, "Ready")
    check("3, 4, 5, 8 = Yes: next step is check 2's text", w3[ck["nextStep"]].value, texts[2])

    w4b = recalc(variant("all-yes", set_example({a[str(n)]: "Yes" for n in range(1, 11)})))
    no_errors("every check = Yes", w4b)
    w4 = w4b[sheet]
    check("all Yes: total", w4[ck["total"]].value, 20)
    check("all Yes: decision", w4[ck["decision"]].value, "Ready")
    check("all Yes: next step", w4[ck["nextStep"]].value, REFS["noOpenItems"])

    # ---- 3 · the edge cases, on the blank tabs ----------------------------
    b = REFS["blank"]
    s1, s2, s3 = b["sheets"]["inventory"], b["sheets"]["requirements"], b["sheets"]["checklist"]
    bi, br = b["inventory"], b["requirements"]
    r1, r2, r3, r4 = (bi["first"] + k for k in range(4))
    ins = br["inputs"]

    def edges(book):
        t1, t2 = book[s1], book[s2]
        t1[f"B{r1}"] = "Only the name is filled"
        t1[f"B{r2}"] = "Name and Not allowed"
        t1[f"H{r2}"] = NA
        t1[f"B{r3}"] = "Agent acts, undo never tested"
        t1[f"H{r3}"] = AA
        t2[ins["undoPath"][2]] = "Undo in the editor"
        t1[f"B{r4}"] = "Consent, but proceeds anyway"
        t1[f"H{r4}"] = PC
        for k in ("fullChange", "saysIrreversible", "perChange", "actsAs"):
            t2[ins[k][3]] = "Yes"
        t2[ins["consenter"][3]] = "Document owner"
        t2[ins["onRefusal"][3]] = "Proceeds anyway"

    wbe = recalc(variant("edges", edges))
    no_errors("edge cases", wbe)
    t1, t2 = wbe[s1], wbe[s2]
    check("edge 1: only B filled has no suggested authority", t1[f"G{r1}"].value in (None, ""), True)
    check("edge 2: final authority Not allowed", t1[f"I{r2}"].value, NA)
    check("edge 2: counts as an override", t1[f"J{r2}"].value, "Yes")
    check("edges 1+2: actions with no authority = 1 (edge 1 only)", t1[bi["noAuthority"]].value, 1)
    check("edges: overrides = 3 (edges 2, 3 and 4)", t1[bi["overrides"]].value, 3)
    check("edge 3: Agent acts, undo tested blank: Not ready", t2[br["readyCells"][2]].value, "Not ready")
    check("edge 3: why", t2[br["whyCells"][2]].value, REFS["why"]["undoNotTested"])
    check("edge 4: proceeds anyway: Not ready", t2[br["readyCells"][3]].value, "Not ready")
    check("edge 4: why", t2[br["whyCells"][3]].value, REFS["why"]["unsafeRefusal"])
    check("edge 1 on Tab 2: no authority, so no readiness", t2[br["readyCells"][0]].value in (None, ""), True)

    # ---- 4 · the blank tabs -----------------------------------------------
    def values(sec: dict) -> dict:
        out = {}
        for k, ref in sec.items():
            if isinstance(ref, str) and ref[0].isalpha() and ref[1:].isdigit():
                out[k] = ref
            elif isinstance(ref, dict) and k in ("byAuthority", "suggested", "actions", "ready"):
                out.update({f"{k}.{x}": c for x, c in ref.items()})
        return out

    for name, sec, tab in [("Action Inventory", bi, s1), ("Authority Requirements", br, s2),
                           ("Checklist", b["checklist"], s3)]:
        for k, ref in values(sec).items():
            check(f"blank {name}: {k} shows blank or 0", blankish(wb[tab][ref].value), True)
    hints = [wb[s3][ref].value for ref in b["checklist"]["evidence"].values() if wb[s3][ref].value]
    check("blank checklist: nine evidence hints", len(hints), 9)
    check("blank checklist: next step is blank, not 'No open items.'",
          blankish(wb[s3][b["checklist"]["nextStep"]].value), True)
    passes.append("INFO  blank hints: " + " | ".join(hints))

    for line in passes + failures:
        print(line)
    print(f"\n{len(passes)} passed, {len(failures)} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
