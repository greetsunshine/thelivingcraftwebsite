"""The schema is the contract. Every example must satisfy it, and the
invariants it encodes must actually reject the records they exist to reject."""

from __future__ import annotations

import json

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from conftest import EXAMPLES_DIR, SCHEMA_PATH, record

EXAMPLES = sorted(EXAMPLES_DIR.glob("*.json"))


@pytest.fixture(scope="module")
def validator() -> Draft202012Validator:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema, format_checker=FormatChecker())


def errors(validator: Draft202012Validator, rec: dict) -> list[str]:
    return [e.message for e in validator.iter_errors(rec)]


@pytest.mark.parametrize("path", EXAMPLES, ids=[p.stem for p in EXAMPLES])
def test_example_validates(validator: Draft202012Validator, path) -> None:
    rec = json.loads(path.read_text(encoding="utf-8"))
    assert errors(validator, rec) == []


def test_four_examples_exist() -> None:
    assert len(EXAMPLES) == 4


def test_i2_policy_may_not_hold_a_value(validator) -> None:
    rec = record(authority="policy", value=75, **{"source.source_of_truth": "https://policy.example/meal-limit"})
    assert errors(validator, rec)


def test_i2_policy_needs_a_source_of_truth(validator) -> None:
    rec = record(authority="policy", value=None)
    assert errors(validator, rec)


def test_i3_correction_route_is_required(validator) -> None:
    rec = record(**{"correction.route": ""})
    assert errors(validator, rec)


def test_i4_unbroadened_correction_is_instance_scoped(validator) -> None:
    rec = record(**{"source.type": "user_correction", "scope.level": "user"})
    assert errors(validator, rec)


def test_i6_sensitive_needs_an_expiry(validator) -> None:
    rec = record(**{"lifecycle.sensitivity": "sensitive", "scope.valid_until": None})
    assert errors(validator, rec)


def test_i7_tombstone_keeps_no_value(validator) -> None:
    rec = record(**{"lifecycle.status": "deleted", "lifecycle.deleted_at": "2026-03-30T16:22:00Z", "lifecycle.deleted_reason": "user_requested_deletion"})
    assert errors(validator, rec)  # value is still "ATL-2291"
    rec["value"] = None
    assert errors(validator, rec) == []
