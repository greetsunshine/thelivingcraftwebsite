"""The retry policy file, and the promise that the simulation runs on it.

Three things:

  * The file parses and has the shape sim/policy.py expects.
  * Every bare number in it is labelled as a starting point to tune, or as a
    placeholder. The kit's rule is that no retry count is presented as a
    universal number, and a rule that is only in a comment is a rule that
    decays. This test reads the file line by line.
  * The defaults compiled into the code equal the file. If somebody tunes the
    YAML and forgets budgets.py, or the other way round, this fails.
"""

from __future__ import annotations

import re
from pathlib import Path

import yaml

from sim.budgets import TaskBudget
from sim.orchestrator import DEFAULT_OWNER, DEFAULT_QUEUE, Orchestrator
from sim.policy import POLICY_PATH, Policy
from sim.triage import FailureClass

ROOT = Path(__file__).resolve().parents[1]
TEXT = POLICY_PATH.read_text()
RAW = yaml.safe_load(TEXT)


def test_policy_loads():
    policy = Policy.load()
    assert policy.max_attempts >= 1
    assert policy.deadline_seconds > 0
    assert policy.backoff_base > 0
    assert policy.backoff_max >= policy.backoff_base


def test_every_tool_type_from_the_kit_is_present():
    types = {t["type"] for t in RAW["tool_types"]}
    assert types == {
        "read_idempotent",
        "write_with_idempotency_key",
        "write_without_idempotency_key",
        "irreversible_or_external",
        "model_generation",
    }


def test_writes_without_a_key_and_irreversible_actions_are_never_automatic():
    by_type = {t["type"]: t for t in RAW["tool_types"]}
    for name in ("write_without_idempotency_key", "irreversible_or_external"):
        assert by_type[name]["automatic"] is False, name
        assert by_type[name]["max_attempts"] == 0, name


def test_every_number_is_labelled_as_a_starting_point():
    """A line like `max_attempts: 8` must say `# tune` or `# placeholder`.

    `version:` is a file format marker, and a `0` under a tool type that is
    never retried automatically is not a number to tune; it is the rule.
    """
    unlabelled = []
    for n, line in enumerate(TEXT.splitlines(), 1):
        m = re.match(r"^\s*([a-z_]+):\s*([0-9][0-9.]*)\s*(#.*)?$", line)
        if not m:
            continue
        key, value, comment = m.group(1), m.group(2), m.group(3) or ""
        if key == "version":
            continue
        if key == "max_attempts" and value == "0":
            continue
        if "tune" in comment or "placeholder" in comment:
            continue
        unlabelled.append(f"line {n}: {line.strip()}")
    assert not unlabelled, "numbers presented as if universal:\n" + "\n".join(unlabelled)


def test_code_defaults_match_the_file():
    policy = Policy.load()
    budget = TaskBudget()
    assert budget.max_attempts == policy.max_attempts
    assert budget.deadline_seconds == policy.deadline_seconds
    assert budget.max_cost_units == policy.max_cost_units
    assert DEFAULT_OWNER == policy.owner
    assert DEFAULT_QUEUE == policy.queue


def test_the_orchestrator_is_built_on_the_file(world):
    w = world()
    orch: Orchestrator = w.orchestrator
    assert orch.policy.backoff_base == RAW["backoff"]["base_seconds"]
    assert orch.policy.backoff_max == RAW["backoff"]["max_seconds"]
    assert orch.policy.cost_model == RAW["per_task"]["cost_per_call"]["model_generation"]


def test_every_failure_class_has_a_response_time():
    hours = RAW["escalation"]["respond_by_hours"]
    assert set(hours) == {c.value for c in FailureClass}
    assert hours["uncertain_action"] <= min(hours.values()), (
        "money may have moved; the uncertain class should never wait longest"
    )
