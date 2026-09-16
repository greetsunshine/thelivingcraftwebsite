"""Test plumbing.

The twelve tests in `test_failure_injection.py` run against whichever
orchestrator `TRIAGE_IMPL` names. The corrected one is the default and must
pass all twelve. `make matrix` runs the same file a second time with
`TRIAGE_IMPL=naive` and writes the comparison table from the results, so the
naive column in the README and the PDF is a real run rather than a claim.

Every test builds its world through `world()`. Nothing else knows which
implementation is under test, which is the point: the two designs are asked
identical questions.
"""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

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
from sim.naive_orchestrator import NaiveOrchestrator  # noqa: E402
from sim.orchestrator import DEFAULT_OWNER, Orchestrator  # noqa: E402

IMPL = os.environ.get("TRIAGE_IMPL", "corrected")


@dataclass
class World:
    """Everything a test needs to set up a run and then check reality."""

    case: Case
    store: FakeDocumentStore
    provider: FakePaymentProvider
    checker: FakeChecker
    model: FakeModel
    emailer: FakeEmailer
    clock: Clock
    budget: TaskBudget
    orchestrator: object
    #: Set by `run()`.
    outcome: object = None
    asks: list[str] = field(default_factory=list)

    def run(self, pre_approved: bool = False):
        self.outcome = self.orchestrator.run(self.case, pre_approved=pre_approved)
        return self.outcome

    # -- reality, not belief ----------------------------------------------

    def refunds(self) -> int:
        return len(self.provider.refunds_for(self.case.case_id))

    def total_refunded(self) -> int:
        return self.provider.total_refunded(self.case.case_id)

    def key(self, action: str = "refund") -> str:
        return self.orchestrator.idempotency_key(self.case, action)

    # -- what the run recorded --------------------------------------------

    def classes(self) -> list[str]:
        return self.outcome.classes()

    def records_for(self, stage: str) -> list[dict]:
        return [r for r in self.outcome.records if r["stage"] == stage]


@pytest.fixture
def world():
    """A factory. Each test calls it with the faults it wants to inject."""

    def _build(
        *,
        store_faults: DocStoreFaults | None = None,
        provider_faults: ProviderFaults | None = None,
        receipts: dict | None = None,
        checker: FakeChecker | None = None,
        emailer: FakeEmailer | None = None,
        max_attempts: int = 8,
        deadline_seconds: float = 120.0,
        max_cost_units: int = 30,
        on_ask=None,
        double_wrapped: bool = False,
    ) -> World:
        case = Case()
        store = FakeDocumentStore(
            receipts=(
                {case.receipt_id: "receipt-image-bytes"} if receipts is None else receipts
            ),
            faults=store_faults or DocStoreFaults.none(),
        )
        provider = FakePaymentProvider(provider_faults or ProviderFaults.none())
        checker = checker or FakeChecker()
        model = FakeModel()
        emailer = emailer or FakeEmailer()
        clock = Clock()
        budget = TaskBudget(
            max_attempts=max_attempts,
            deadline_seconds=deadline_seconds,
            max_cost_units=max_cost_units,
        )

        cls = Orchestrator if IMPL == "corrected" else NaiveOrchestrator
        kwargs = dict(
            clock=clock,
            budget=budget,
            owner=DEFAULT_OWNER,
            on_ask=on_ask,
        )
        if IMPL == "naive":
            kwargs["double_wrapped"] = double_wrapped

        orchestrator = cls(store, provider, checker, model, emailer, **kwargs)
        return World(
            case, store, provider, checker, model, emailer, clock, budget, orchestrator
        )

    return _build


@pytest.fixture
def uploads_receipt():
    """An `on_ask` hook. The requester answers and uploads the receipt."""

    def _hook(case, store):
        store.upload(case.receipt_id, "receipt-image-bytes")
        return True

    return _hook


@pytest.fixture
def silent_requester():
    """An `on_ask` hook. The requester does not answer."""

    def _hook(case, store):
        return False

    return _hook


# --------------------------------------------------------------------------
# Result capture, so `make matrix` can build the comparison table
# --------------------------------------------------------------------------

_RESULTS: dict[str, str] = {}


def pytest_runtest_logreport(report):
    if report.when != "call":
        return
    test_id = report.nodeid.rsplit("::", 1)[-1]
    _RESULTS[test_id] = "pass" if report.passed else "fail"


def pytest_sessionfinish(session, exitstatus):
    target = os.environ.get("TRIAGE_RESULTS")
    if not target:
        return
    Path(target).write_text(json.dumps(_RESULTS, indent=2, sort_keys=True) + "\n")
