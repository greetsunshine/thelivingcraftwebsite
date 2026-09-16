"""Rejection records, and the outcome of a run.

A rejection that says "error" tells the next reader nothing. A rejection record
says what was being attempted, which of the five classes it was, what is
missing, what may already have happened outside the system, what is allowed
next, what is forbidden, what would have to change for another attempt to be
worth making, and who is accountable if the machine stops here.

The shape built here is the shape of `schemas/rejection_record.schema.json`.
The three worked examples in `schemas/examples/` are generated from real runs
of the corrected orchestrator rather than typed by hand, so the schema, the
code and the kit cannot drift apart.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from .triage import FailureClass, NextStep, Triage

#: Records carry a real-looking timestamp derived from the virtual clock, so
#: two runs of the same scenario produce byte-identical records.
EPOCH = datetime(2026, 9, 16, 9, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))


def timestamp_at(seconds: float) -> str:
    return (EPOCH + timedelta(seconds=seconds)).isoformat(timespec="seconds")


@dataclass
class Outcome:
    """What a run ended up doing. Both orchestrators return one of these.

    The tests read this alongside the fakes' own state. The fakes are the
    reality check: an orchestrator can believe it refunded nobody while the
    provider's ledger holds three rows, and that gap is the story.
    """

    task_id: str
    resolved: bool = False
    asked_user: bool = False
    escalated: bool = False
    stopped: bool = False
    #: The refund this run believes it completed, if any.
    refund_ref: str | None = None
    records: list[dict] = field(default_factory=list)
    escalation_queue: list[dict] = field(default_factory=list)
    log: list[str] = field(default_factory=list)

    def classes(self) -> list[str]:
        return [r["failure_class"] for r in self.records]

    def next_steps(self) -> list[str]:
        return [r["next_step"] for r in self.records]

    def has_class(self, failure_class: FailureClass | str) -> bool:
        return str(failure_class) in self.classes()

    def last_record(self) -> dict | None:
        return self.records[-1] if self.records else None

    def print_log(self) -> None:
        for line in self.log:
            print(line)


@dataclass(frozen=True)
class SideEffect:
    """One thing this task may have changed outside itself."""

    action: str
    target: str
    idempotency_key: str
    #: "executed", "not_executed" or "unknown". Never a guess.
    state: str

    def as_dict(self) -> dict:
        return {
            "action": self.action,
            "target": self.target,
            "idempotency_key": self.idempotency_key,
            "state": self.state,
        }


@dataclass(frozen=True)
class MissingItem:
    name: str
    required_by: str
    how_to_obtain: str

    def as_dict(self) -> dict:
        return {
            "name": self.name,
            "required_by": self.required_by,
            "how_to_obtain": self.how_to_obtain,
        }


def build_record(
    *,
    task_id: str,
    attempt: int,
    at_seconds: float,
    stage: str,
    triage: Triage,
    detected_by_type: str,
    detected_by_name: str,
    budget: dict,
    owner: str | None,
    what_changes_next_attempt: str | None = None,
    missing: list[MissingItem] | None = None,
    side_effects: list[SideEffect] | None = None,
    escalation: dict | None = None,
) -> dict:
    """Assemble one rejection record.

    `what_changes_next_attempt` is required whenever `next_step` plans another
    attempt. A retry with nothing written in that field is a retry nobody can
    justify, and the schema refuses it.
    """
    record: dict = {
        "record_id": f"{task_id}-R{attempt:02d}",
        "task_id": task_id,
        "attempt": attempt,
        "timestamp": timestamp_at(at_seconds),
        "stage": stage,
        "failure_class": str(triage.failure_class),
        "detected_by": {"type": detected_by_type, "name": detected_by_name},
        "reason": triage.reason,
        "missing_evidence": [m.as_dict() for m in (missing or [])],
        "side_effects": [s.as_dict() for s in (side_effects or [])],
        "permitted_next_actions": list(triage.permitted_next_actions),
        "prohibited_actions": list(triage.prohibited_actions),
        "retry": {
            "attempts_used": budget["attempts_used"],
            "max_attempts": budget["max_attempts"],
            # An absolute instant, not a countdown. A record read an hour later
            # by a person should say when the task was due, not how long was
            # left at the moment it was written.
            "deadline": timestamp_at(budget["deadline_at"]),
        },
        "next_step": str(triage.next_step),
        "owner": owner or "unassigned",
    }

    plans_another_attempt = triage.next_step in (NextStep.RETRY_TOOL, NextStep.RECONCILE)
    if plans_another_attempt:
        if not what_changes_next_attempt:
            raise ValueError(
                f"{record['record_id']}: next_step is {triage.next_step} but nothing "
                "was recorded as changing before the next attempt"
            )
        record["retry"]["what_changes_next_attempt"] = what_changes_next_attempt
    elif what_changes_next_attempt:
        record["retry"]["what_changes_next_attempt"] = what_changes_next_attempt

    if escalation:
        record["escalation"] = escalation

    return record
