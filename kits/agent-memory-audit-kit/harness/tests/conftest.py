"""Test plumbing.

The seven tests in ``test_failure_modes.py`` run against whichever store the
``--store`` option names. ``reference`` is the default and must pass all seven.
``pytest --store=naive`` runs the same file against the store most teams
already have, and all seven fail. Nothing in a test knows which store it is
talking to; that is what makes the comparison fair.

To run the seven tests against your own memory layer, add a branch to
``make_store`` that returns an object satisfying ``memory_kit.adapter.MemoryStore``.
The harness README walks through it.
"""

from __future__ import annotations

import copy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pytest

from memory_kit import NaiveStore, ReferenceStore

KIT_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = KIT_ROOT / "schema" / "memory-record.schema.json"
EXAMPLES_DIR = KIT_ROOT / "examples"

STORES = ("reference", "naive")


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--store",
        default="reference",
        choices=STORES,
        help="which MemoryStore implementation the seven failure tests run against",
    )


def pytest_report_header(config: pytest.Config) -> str:
    return f"memory store under test: {config.getoption('--store')}"


class Policy:
    """A stand-in for the source of truth. Tests change ``values`` between calls."""

    def __init__(self) -> None:
        self.values: dict[str, Any] = {}
        self.calls = 0

    def __call__(self, key: str, context: dict) -> Any:
        self.calls += 1
        return self.values.get(key)


@pytest.fixture
def policy() -> Policy:
    return Policy()


def make_store(name: str, policy: Policy):
    if name == "reference":
        return ReferenceStore(policy_source=policy)
    if name == "naive":
        return NaiveStore(policy_source=policy)
    # Add your own here, for example:
    #   if name == "mine":
    #       return MyMemoryAdapter(policy_source=policy)
    raise ValueError(name)


@pytest.fixture
def store(request: pytest.FixtureRequest, policy: Policy):
    return make_store(request.config.getoption("--store"), policy)


_NOW = datetime(2026, 3, 25, 19, 40, tzinfo=timezone.utc)

BASE_RECORD: dict = {
    "id": "mem_x",
    "subject": {"type": "user", "id": "priya"},
    "key": "expense.project_code",
    "value": "ATL-2291",
    "authority": "fact",
    "source": {
        "type": "user_stated",
        "evidence": {"kind": "message", "ref": "msg_8812"},
        "observations": 1,
        "captured_at": "2026-03-04T09:12:00Z",
        "captured_by": "expense-agent@1.4.0",
    },
    "scope": {
        "level": "task",
        "bindings": {"trip_id": "T1"},
        "valid_from": "2026-03-04",
        "valid_until": None,
        "revalidate_on": ["trip_closed"],
    },
    "correction": {"route": "inline_override_on_expense_form", "supersedes": [], "superseded_by": None, "broadened": False},
    "lineage": {"derived_from": []},
    "lifecycle": {"status": "active", "sensitivity": "none", "retain_value_after_expiry": False},
    "usage": {"last_used_at": None, "use_count": 0, "last_confirmed_at": "2026-03-04T09:12:00Z"},
}


def record(**overrides: Any) -> dict:
    """A full, schema-valid record with the given fields changed.

    Dotted keys reach inside: ``record(**{"source.type": "agent_inferred"})``.
    """
    rec = copy.deepcopy(BASE_RECORD)
    for path, value in overrides.items():
        target = rec
        parts = path.split(".")
        for part in parts[:-1]:
            target = target.setdefault(part, {})
        target[parts[-1]] = copy.deepcopy(value)
    return rec
