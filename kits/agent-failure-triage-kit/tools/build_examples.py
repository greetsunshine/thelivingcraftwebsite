"""Write the three example rejection records, one per class, from real runs.

The examples in `schemas/examples/` are not typed. Each is the record the
corrected orchestrator wrote when the story's fault was injected, so the
schema, the code and the examples cannot drift apart. `make schemas` rebuilds
them; `tests/test_schema.py` validates them.

Three situations, all from the story:

  temporary_failure   Friday. The receipt lookup timed out. The receipt was
                      there. The corrected design's first record.
  uncertain_action    Monday. The refund call timed out after the money moved.
                      The record written before reconciliation ran.
  missing_evidence    The situation the story's checker THOUGHT it was in.
                      Here the receipt really is absent, and the requester is
                      asked for it.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sim.budgets import TaskBudget  # noqa: E402
from sim.clock import Clock  # noqa: E402
from sim.fakes import (  # noqa: E402
    Case,
    DocStoreFaults,
    FakeChecker,
    FakeDocumentStore,
    FakeEmailer,
    FakeModel,
    FakePaymentProvider,
    ProviderFaults,
)
from sim.orchestrator import Orchestrator  # noqa: E402

OUT = ROOT / "schemas" / "examples"


def budget() -> TaskBudget:
    return TaskBudget(max_attempts=8, deadline_seconds=120.0, max_cost_units=30)


def temporary_failure() -> dict:
    case = Case()
    store = FakeDocumentStore(
        receipts={case.receipt_id: "receipt-image-bytes"},
        faults=DocStoreFaults.slow_timeout(calls=1),
    )
    orch = Orchestrator(
        store, FakePaymentProvider(), FakeChecker(), FakeModel(), FakeEmailer(),
        clock=Clock(), budget=budget(),
    )
    outcome = orch.run(case)
    record = outcome.records[0]
    assert record["failure_class"] == "temporary_failure", record["failure_class"]
    return record


def uncertain_action() -> dict:
    case = Case()
    store = FakeDocumentStore(receipts={case.receipt_id: "receipt-image-bytes"})
    provider = FakePaymentProvider(ProviderFaults.timeout_after_commit(calls=1))
    orch = Orchestrator(
        store, provider, FakeChecker(), FakeModel(), FakeEmailer(),
        clock=Clock(), budget=budget(),
    )
    outcome = orch.run(case, pre_approved=True)
    record = outcome.records[-1]
    assert record["failure_class"] == "uncertain_action", record["failure_class"]
    return record


def missing_evidence() -> dict:
    case = Case()
    store = FakeDocumentStore(receipts={}, faults=DocStoreFaults.genuinely_missing())
    orch = Orchestrator(
        store, FakePaymentProvider(), FakeChecker(), FakeModel(), FakeEmailer(),
        clock=Clock(), budget=budget(), on_ask=lambda case, store: False,
    )
    outcome = orch.run(case)
    record = outcome.records[0]
    assert record["failure_class"] == "missing_evidence", record["failure_class"]
    return record


EXAMPLES = {
    "story_temporary_failure.json": temporary_failure,
    "story_uncertain_action.json": uncertain_action,
    "story_missing_evidence.json": missing_evidence,
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, build in EXAMPLES.items():
        record = build()
        (OUT / name).write_text(json.dumps(record, indent=2) + "\n")
        print(f"  {name:<32} {record['failure_class']:<18} -> {record['next_step']}")


if __name__ == "__main__":
    main()
