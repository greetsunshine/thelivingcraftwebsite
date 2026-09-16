"""The rejection record schema, checked against real records.

Two layers:

  * The three examples in `schemas/examples/` validate. They are the ones a
    reader copies, so they have to be right.
  * EVERY record the corrected orchestrator writes across all twelve injection
    tests validates. This is the one that matters: a schema that only the
    hand-picked examples satisfy is a schema the code does not actually follow.

And a handful of records that must NOT validate, so the conditional rules are
known to bite rather than merely to exist.
"""

from __future__ import annotations

import copy
import json
from datetime import datetime
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from sim.fakes import DocStoreFaults, FakeChecker, FakeEmailer, ProviderFaults

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((ROOT / "schemas" / "rejection_record.schema.json").read_text())
EXAMPLES = sorted((ROOT / "schemas" / "examples").glob("*.json"))

# jsonschema only checks "date-time" when an optional extra package is
# installed, and silently passes everything otherwise. The kit's dependencies
# are deliberately short, so the checker is registered here. Python's own
# parser accepts RFC 3339 with an offset from 3.11 on, which is the floor this
# kit declares.
FORMATS = FormatChecker()


@FORMATS.checks("date-time", raises=ValueError)
def _is_rfc3339(value: object) -> bool:
    if not isinstance(value, str):
        return True
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp has no offset")
    return True


VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FORMATS)


def errors(record: dict) -> list[str]:
    return [f"{'/'.join(str(p) for p in e.path) or '<root>'}: {e.message}" for e in VALIDATOR.iter_errors(record)]


# --------------------------------------------------------------------------
# The schema itself
# --------------------------------------------------------------------------


def test_schema_is_well_formed():
    Draft202012Validator.check_schema(SCHEMA)


def test_the_five_classes_and_five_steps_match_the_code():
    """The enums in the schema are the enums in triage.py. One source, checked."""
    from sim.triage import FailureClass, NextStep

    assert SCHEMA["properties"]["failure_class"]["enum"] == [c.value for c in FailureClass]
    assert SCHEMA["properties"]["next_step"]["enum"] == [s.value for s in NextStep]


# --------------------------------------------------------------------------
# The examples
# --------------------------------------------------------------------------


@pytest.mark.parametrize("path", EXAMPLES, ids=[p.name for p in EXAMPLES])
def test_example_validates(path: Path):
    record = json.loads(path.read_text())
    assert not errors(record), "\n".join(errors(record))


def test_there_is_one_example_per_story_class():
    names = {p.name for p in EXAMPLES}
    assert names == {
        "story_missing_evidence.json",
        "story_temporary_failure.json",
        "story_uncertain_action.json",
    }


# --------------------------------------------------------------------------
# Every record from every injection test
# --------------------------------------------------------------------------

SCENARIOS = {
    "T01": dict(store_faults=DocStoreFaults.slow_timeout(calls=1)),
    "T02": dict(store_faults=DocStoreFaults.genuinely_missing(), receipts={}, ask=False),
    "T03": dict(checker=FakeChecker(always_reject_code="missing_evidence.bank_statement"), ask=True),
    "T04": dict(provider_faults=ProviderFaults.timeout_after_commit(calls=1), pre=True),
    "T05": dict(provider_faults=ProviderFaults.timeout_before_commit(calls=1), pre=True),
    "T06a": dict(provider_faults=ProviderFaults.rate_limited(retry_after=30.0), pre=True),
    "T06b": dict(provider_faults=ProviderFaults.rate_limited(retry_after=300.0), pre=True),
    "T07": dict(store_faults=DocStoreFaults.down_for(99), max_attempts=3, ask=False),
    "T08": dict(provider_faults=ProviderFaults.down(99), max_attempts=4, pre=True),
    "T09": dict(checker=FakeChecker(always_approve=True), seed_refund=True, pre=True),
    "T10": dict(
        provider_faults=ProviderFaults(mode="timeout_after_commit", for_calls=1, status_unavailable=True),
        pre=True,
    ),
    "T11": dict(store_faults=DocStoreFaults.genuinely_missing(), receipts={}, ask=True),
    "T12": dict(emailer=FakeEmailer(down_for_calls=1), pre=True),
}


@pytest.mark.parametrize("tid", list(SCENARIOS), ids=list(SCENARIOS))
def test_every_record_the_corrected_design_writes_validates(world, uploads_receipt, silent_requester, tid):
    spec = dict(SCENARIOS[tid])
    pre = spec.pop("pre", False)
    seed = spec.pop("seed_refund", False)
    ask = spec.pop("ask", None)
    if ask is True:
        spec["on_ask"] = uploads_receipt
    elif ask is False:
        spec["on_ask"] = silent_requester

    w = world(**spec)
    if seed:
        w.provider.refund(w.case.case_id, w.case.amount_minor, w.key())
    w.run(pre_approved=pre)

    assert w.outcome.records, f"{tid} wrote no records, so there is nothing to validate"
    for record in w.outcome.records:
        assert not errors(record), f"{tid} {record['record_id']}:\n" + "\n".join(errors(record))


# --------------------------------------------------------------------------
# Records that must be refused
# --------------------------------------------------------------------------


def _base() -> dict:
    return json.loads((ROOT / "schemas" / "examples" / "story_uncertain_action.json").read_text())


def test_uncertain_action_must_prohibit_reissue():
    record = _base()
    record["prohibited_actions"] = ["report failure to the customer"]
    assert any("prohibited_actions" in e for e in errors(record))


def test_uncertain_action_must_name_the_side_effect():
    record = _base()
    record["side_effects"] = []
    assert any("side_effects" in e for e in errors(record))


def test_a_planned_retry_must_say_what_changes():
    record = _base()
    record["next_step"] = "retry_tool"
    record["retry"].pop("what_changes_next_attempt", None)
    assert any("what_changes_next_attempt" in e for e in errors(record))


def test_an_escalation_must_carry_a_queue_and_a_response_time():
    record = _base()
    record["next_step"] = "escalate"
    record.pop("escalation", None)
    assert any("escalation" in e for e in errors(record))


def test_missing_evidence_must_name_something():
    record = json.loads((ROOT / "schemas" / "examples" / "story_missing_evidence.json").read_text())
    record["missing_evidence"] = []
    assert any("missing_evidence" in e for e in errors(record))


def test_state_is_never_a_free_string():
    record = _base()
    bad = copy.deepcopy(record)
    bad["side_effects"][0]["state"] = "probably failed"
    assert any("state" in e for e in errors(bad))


def test_an_unknown_field_is_refused():
    record = _base()
    record["notes"] = "nothing to see here"
    assert any("notes" in e for e in errors(record))


def test_a_timestamp_without_an_offset_is_refused():
    """The cohort sits in three time zones. A bare local time is a wrong time
    for somebody, and the schema has to say so rather than let it through."""
    record = _base()
    record["timestamp"] = "2026-09-16T09:00:00"
    assert any("timestamp" in e for e in errors(record))

    record = _base()
    record["timestamp"] = "yesterday, roughly"
    assert any("timestamp" in e for e in errors(record))
