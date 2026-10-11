#!/usr/bin/env python3
"""Recalculate the workbook in LibreOffice and assert the brief's acceptance tests.

openpyxl writes formulas and no cached values, so every value read back here
was computed by a real spreadsheet engine rather than copied from a script.

What is checked:
  1. The Worked Example reproduces every expected output in the brief,
     section 3, Tab 4. The figures are typed below from the brief, and they
     are also compared with what src/lib/gateRouting.ts computes (refs.json,
     written by build_xlsx.py from dump_content.ts), so the page and the
     workbook cannot disagree.
  2. The brief's variants: minimum trials 1; checks 3 and 5 Yes; then check 8
     Yes; then every check Yes. Each is a temporary copy. The shipped file is
     never changed.
  3. The brief's three edge cases, typed into copies of the blank tabs.
  4. The blank tabs show blanks or 0, and no cell on any tab, in any
     recalculated copy, holds #REF!, #DIV/0!, #VALUE!, #NAME? or another error.

Run:  python3 tools/gate-routing-map/verify_xlsx.py
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
XLSX = REPO / "downloads" / "gate-routing-map.xlsx"
REFS = json.loads((HERE / "refs.json").read_text(encoding="utf-8"))

SOFFICE_CANDIDATES = [
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/opt/homebrew/bin/soffice",
    "/usr/local/bin/soffice",
    "/usr/bin/soffice",
]
ERRORS = ("#REF!", "#DIV/0!", "#VALUE!", "#NAME?", "#N/A", "#NULL!", "#NUM!", "Err:")
ROUTES = ["Block", "Human decides", "Check downstream", "Track"]

# The brief, section 3, Tab 4: "Expected outputs. These are the acceptance tests."
BRIEF = {
    "listed": 8,
    "byRoute": {"Block": 3, "Human decides": 1, "Check downstream": 2, "Track": 2},
    "suggested": {"Block": 2, "Human decides": 2, "Check downstream": 2, "Track": 2},
    "unrouted": 0,
    "overrides": 1,
    "overridesNoReason": 0,
    "cases": {"Block": 3, "Human decides": 1, "Check downstream": 2, "Track": 2},
    "ready": {"Block": 1, "Human decides": 0, "Check downstream": 1, "Track": 1},
    "readyRows": ["Not ready", "Ready", "Ready", "Not ready", "Ready", "Not ready", "Not ready", "Not ready"],
    "notReady": 5,
    "blockNotReady": 2,
    "humanNotReady": 1,
    "humanNoBackup": 1,
    "downstreamUnverified": 1,
    "total": 12,
    "criticalNo": [3, 5],
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
    out = Path(tempfile.mkdtemp(prefix="grm-lo-"))
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
    path = Path(tempfile.mkdtemp(prefix="grm-var-")) / f"{name}.xlsx"
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
        "byRoute": {r: v(inv["byRoute"][r]) for r in ROUTES},
        "suggested": {r: v(inv["suggested"][r]) for r in ROUTES},
        "unrouted": v(inv["unrouted"]),
        "overrides": v(inv["overrides"]),
        "overridesNoReason": v(inv["overridesNoReason"]),
        "cases": {r: v(req["cases"][r]) for r in ROUTES},
        "ready": {r: v(req["ready"][r]) for r in ROUTES},
        "readyRows": [v(c) for c in req["readyCells"][:8]],
        "notReady": v(req["notReady"]),
        "blockNotReady": v(req["blockNotReady"]),
        "humanNotReady": v(req["humanNotReady"]),
        "humanNoBackup": v(req["humanNoBackup"]),
        "downstreamUnverified": v(req["downstreamUnverified"]),
        "total": v(ck["total"]),
        "criticalNo": [n for n in critical if v(ck["answers"][str(n)]) == "No"],
        "decision": v(ck["decision"]),
    }
    for key, want in BRIEF.items():
        check(f"Worked Example: {key}", got[key], want)
    check("Worked Example: your next step is check 3's text", v(ck["nextStep"]), texts[3])
    whys = [v(c) or "" for c in req["whyCells"][:8]]
    check("Worked Example: row 1 not ready because the contract is not verified", whys[0], WHY["notVerified"])
    check("Worked Example: row 4 not ready because there are no halt criteria", whys[3], WHY["noHalt"])
    check("Worked Example: row 6 not ready because there is no owner", whys[5], WHY["noOwner"])
    check("Worked Example: row 7 not ready because must-pass is lower than trials", whys[6], WHY["mustPassLower"])
    check("Worked Example: row 8 not ready because of the minimum trials", whys[7], WHY["belowMinimum"])
    check("Worked Example: rows 9-20 are empty", [v(c) for c in req["readyCells"][8:]], [None] * 12)

    # The page prints these from src/lib/gateRouting.ts; the workbook must agree.
    check("agrees with gateRouting.ts: suggested routes", [v(c) for c in inv["suggestedCells"][:8]], E["suggested"])
    check("agrees with gateRouting.ts: final routes", [v(c) for c in inv["finalCells"][:8]], E["final"])
    check("agrees with gateRouting.ts: ready", [x == "Ready" for x in got["readyRows"]], E["ready"])
    check("agrees with gateRouting.ts: why not ready", whys, E["whyNot"])
    check("agrees with gateRouting.ts: tab 2 summary",
          {"cases": got["cases"], "ready": got["ready"], "notReady": got["notReady"],
           "blockNotReady": got["blockNotReady"], "humanNotReady": got["humanNotReady"],
           "humanNoBackup": got["humanNoBackup"], "downstreamUnverified": got["downstreamUnverified"]},
          E["requirements"])
    check("agrees with gateRouting.ts: total, decision, next step",
          (got["total"], got["decision"], v(ck["nextStep"])), (E["total"], E["decision"], E["nextStep"]))
    statuses = [v(ck["status"][str(n)]) for n in range(1, 11)]
    check("Worked Example: status words", statuses,
          ["Pass", "Pass", "Fail", "Pass", "Fail", "Fail", "Pass", "Partial", "Pass", "Partial"])

    # ---- 2 · the brief's variants -----------------------------------------
    def set_example(cells: dict):
        def edit(book):
            for ref, val in cells.items():
                book[sheet][ref] = val
        return edit

    a = ck["answers"]
    w1 = recalc(variant("min-1", set_example({req["minTrials"]: 1})))[sheet]
    check("minimum trials 1: row 8 becomes Ready", w1[req["readyCells"][7]].value, "Ready")
    check("minimum trials 1: Block ready", w1[req["ready"]["Block"]].value, 2)

    w2b = recalc(variant("3-5-yes", set_example({a["3"]: "Yes", a["5"]: "Yes"})))
    no_errors("checks 3 and 5 = Yes", w2b)
    w2 = w2b[sheet]
    check("3, 5 = Yes: total", w2[ck["total"]].value, 16)
    check("3, 5 = Yes: decision (check 8 is critical and Partial)", w2[ck["decision"]].value, "Fix first")
    check("3, 5 = Yes: next step is check 6's text", w2[ck["nextStep"]].value, texts[6])

    w3 = recalc(variant("3-5-8-yes", set_example({a["3"]: "Yes", a["5"]: "Yes", a["8"]: "Yes"})))[sheet]
    check("3, 5, 8 = Yes: total", w3[ck["total"]].value, 17)
    check("3, 5, 8 = Yes: decision", w3[ck["decision"]].value, "Ready")

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
    r1, r2, r3 = bi["first"], bi["first"] + 1, bi["first"] + 2

    def edges(book):
        t1, t2 = book[s1], book[s2]
        t1[f"B{r1}"] = "Only the name is filled"
        t1[f"B{r2}"] = "Name and an override"
        t1[f"J{r2}"] = "Block"
        t1[f"B{r3}"] = "Deterministic Block"
        t1[f"H{r3}"] = "Yes"
        t1[f"J{r3}"] = "Block"
        t2[br["inputs"]["trials"][2]] = 1
        t2[br["inputs"]["mustPass"][2]] = 1

    wbe = recalc(variant("edges", edges))
    no_errors("edge cases", wbe)
    t1, t2 = wbe[s1], wbe[s2]
    check("edge 1: only B filled has no suggested route", t1[f"I{r1}"].value in (None, ""), True)
    check("edge 2: D-G blank, J = Block: final route Block", t1[f"K{r2}"].value, "Block")
    check("edge 2: counts as an override", t1[f"L{r2}"].value, "Yes")
    check("edges: unrouted = 1 (edge 1 only, edge 2 is routed)", t1[bi["unrouted"]].value, 1)
    check("edges: overrides = 2 (edges 2 and 3)", t1[bi["overrides"]].value, 2)
    check("edge 3: deterministic Block, 1 trial, 1 must pass: Ready", t2[br["readyCells"][2]].value, "Ready")
    check("edge 1 on Tab 2: no route, so no readiness", t2[br["readyCells"][0]].value in (None, ""), True)

    # ---- 4 · the blank tabs -----------------------------------------------
    def values(sec: dict) -> dict:
        out = {}
        for k, ref in sec.items():
            if isinstance(ref, str) and ref[0].isalpha() and ref[1:].isdigit() and k not in ("minTrials",):
                out[k] = ref
            elif isinstance(ref, dict) and k in ("byRoute", "suggested", "cases", "ready"):
                out.update({f"{k}.{r}": c for r, c in ref.items()})
        return out

    for name, sec, tab in [("Gate Inventory", bi, s1), ("Route Requirements", br, s2),
                           ("Checklist", b["checklist"], s3)]:
        for k, ref in values(sec).items():
            check(f"blank {name}: {k} shows blank or 0", blankish(wb[tab][ref].value), True)
    check("blank Route Requirements: minimum trials defaults to 3", wb[s2][br["minTrials"]].value, 3)
    hints = [wb[s3][ref].value for ref in b["checklist"]["evidence"].values() if wb[s3][ref].value]
    check("blank checklist: six evidence hints", len(hints), 6)
    check("blank checklist: next step is blank, not 'No open items.'",
          blankish(wb[s3][b["checklist"]["nextStep"]].value), True)
    passes.append("INFO  blank hints: " + " | ".join(hints))

    for line in passes + failures:
        print(line)
    print(f"\n{len(passes)} passed, {len(failures)} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
