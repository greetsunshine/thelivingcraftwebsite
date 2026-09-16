"""Build the naive-versus-corrected results table.

It runs `tests/test_failure_injection.py` twice, once against each
orchestrator, and writes what actually happened to
`tests/naive_vs_corrected.json`.

The prose in the table comes out of the test docstrings, so there is exactly
one copy of every "inject" and "expect" line in the repository. The README and
the PDF are built from this file. Nothing in either is typed by hand, which is
how a results table in a giveaway stays true after someone edits a test.
"""

from __future__ import annotations

import ast
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEST_FILE = ROOT / "tests" / "test_failure_injection.py"
OUT = ROOT / "tests" / "naive_vs_corrected.json"
PYTHON = sys.executable


def parse_docstrings() -> dict[str, dict]:
    """Read id, inject, expect and smell out of each test function."""
    tree = ast.parse(TEST_FILE.read_text())
    found: dict[str, dict] = {}

    for node in ast.walk(tree):
        if not isinstance(node, ast.FunctionDef):
            continue
        if not node.name.startswith("test_t"):
            continue
        doc = ast.get_docstring(node) or ""
        head, _, body = doc.partition("\n")
        entry = {
            "id": head.strip().rstrip("."),
            "test": node.name,
            "inject": _field(body, "Inject"),
            "expect": _field(body, "Expect"),
            "smell": _field(body, "Smell"),
        }
        found[node.name] = entry

    return found


def _field(body: str, label: str) -> str:
    """Pull one labelled block out of a docstring and flatten it to a line."""
    match = re.search(
        rf"^\s*{label}\s+(.*?)(?=^\s*(?:Inject|Expect|Smell)\s|\Z)",
        body,
        re.MULTILINE | re.DOTALL,
    )
    if not match:
        return ""
    return " ".join(match.group(1).split())


def run(impl: str) -> dict[str, str]:
    results = ROOT / f"tests/.results-{impl}.json"
    if results.exists():
        results.unlink()

    subprocess.run(
        [PYTHON, "-m", "pytest", str(TEST_FILE), "-q", "--no-header"],
        cwd=ROOT,
        env={
            **_env(),
            "TRIAGE_IMPL": impl,
            "TRIAGE_RESULTS": str(results),
        },
        capture_output=True,
        check=False,
    )

    if not results.exists():
        raise SystemExit(f"the {impl} run produced no results file")
    data = json.loads(results.read_text())
    results.unlink()
    return data


def _env() -> dict:
    import os

    return dict(os.environ)


def main() -> None:
    docs = parse_docstrings()
    corrected = run("corrected")
    naive = run("naive")

    rows = []
    for name, entry in sorted(docs.items(), key=lambda kv: kv[1]["id"]):
        rows.append(
            {
                **entry,
                "naive": naive.get(name, "not run"),
                "corrected": corrected.get(name, "not run"),
            }
        )

    summary = {
        "naive_passed": sum(1 for r in rows if r["naive"] == "pass"),
        "corrected_passed": sum(1 for r in rows if r["corrected"] == "pass"),
        "total": len(rows),
    }

    OUT.write_text(json.dumps({"summary": summary, "tests": rows}, indent=2) + "\n")

    width = max(len(r["id"]) for r in rows)
    print(f"{'ID'.ljust(width)}  naive     corrected")
    print("-" * (width + 22))
    for row in rows:
        print(f"{row['id'].ljust(width)}  {row['naive']:<9} {row['corrected']}")
    print()
    print(
        f"naive passed {summary['naive_passed']}/{summary['total']}, "
        f"corrected passed {summary['corrected_passed']}/{summary['total']}"
    )
    print(f"written to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
