"""The retry policy, read from `policies/retry_budgets.yaml`.

The YAML is the source. This module reads it into a small typed object the
orchestrator can use, so the numbers a reader tunes in the policy file are the
numbers the simulation runs on. A second copy of any of them in code would be
the drift this kit spends most of its pages warning about.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml

POLICY_PATH = Path(__file__).resolve().parents[1] / "policies" / "retry_budgets.yaml"


@dataclass(frozen=True)
class Policy:
    # per_task
    max_attempts: int
    deadline_seconds: float
    max_cost_units: int
    cost_read: int
    cost_write: int
    cost_model: int
    # backoff
    backoff_base: float
    backoff_max: float
    honour_retry_after: bool
    # per tool type. 0 means "never automatically".
    read_max_attempts: int
    keyed_write_max_attempts: int
    model_max_attempts: int
    # escalation
    queue: str
    owner: str
    respond_by_hours: dict[str, float]

    @classmethod
    def load(cls, path: Path | None = None) -> "Policy":
        raw = yaml.safe_load((path or POLICY_PATH).read_text())
        task = raw["per_task"]
        back = raw["backoff"]
        by_type = {t["type"]: t for t in raw["tool_types"]}
        esc = raw["escalation"]
        return cls(
            max_attempts=int(task["max_attempts"]),
            deadline_seconds=float(task["deadline_seconds"]),
            max_cost_units=int(task["max_cost_units"]),
            cost_read=int(task["cost_per_call"]["read"]),
            cost_write=int(task["cost_per_call"]["write"]),
            cost_model=int(task["cost_per_call"]["model_generation"]),
            backoff_base=float(back["base_seconds"]),
            backoff_max=float(back["max_seconds"]),
            honour_retry_after=bool(back["honour_retry_after"]),
            read_max_attempts=int(by_type["read_idempotent"]["max_attempts"]),
            keyed_write_max_attempts=int(by_type["write_with_idempotency_key"]["max_attempts"]),
            model_max_attempts=int(by_type["model_generation"]["max_attempts"]),
            queue=str(esc["queue"]),
            owner=str(esc["owner"]),
            respond_by_hours={k: float(v) for k, v in esc["respond_by_hours"].items()},
        )


_DEFAULT: Policy | None = None


def default_policy() -> Policy:
    """The policy file, loaded once."""
    global _DEFAULT
    if _DEFAULT is None:
        _DEFAULT = Policy.load()
    return _DEFAULT
