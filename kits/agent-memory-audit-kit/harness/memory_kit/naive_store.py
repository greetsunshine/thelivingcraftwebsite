"""The store most teams already have. It fails all seven tests on purpose.

One dictionary, keyed by the fact name. The last value written wins. It:

* applies a memory in any context, because it never recorded a scope
* overwrites the fact for everyone on a correction
* caches a policy value and never asks the source of truth again
* ignores events, so nothing ever expires
* deletes a record and leaves everything derived from it alive
* cannot say where a value came from

None of that is a bug in the code. Each line is a design decision that looked
fine until a user was harmed by it. Run ``pytest --store=naive`` to watch the
seven tests name each one.
"""

from __future__ import annotations

from typing import Any

from .adapter import PolicySource, RecallResult


class NaiveStore:
    def __init__(self, policy_source: PolicySource) -> None:
        # Kept only so both stores share a constructor. Never called: a
        # policy value, once seen, is served from memory like any other.
        self._policy_source = policy_source
        self._by_key: dict[str, dict] = {}

    def remember(self, record: dict) -> str:
        self._by_key[record["key"]] = dict(record)
        return record["id"]

    def recall(self, key: str, context: dict) -> RecallResult:
        rec = self._by_key.get(key)
        if rec is None or rec.get("value") is None:
            return RecallResult(value=None, decision="none", record_id=None, source_type=None, evidence_ref=None)
        # The value is returned; the record it came from is not.
        return RecallResult(value=rec["value"], decision="apply", record_id=None, source_type=None, evidence_ref=None)

    def correct(self, key: str, new_value: Any, context: dict, broaden: bool = False) -> str:
        rec = self._by_key.get(key)
        if rec is None:
            rec = {"id": f"mem_{len(self._by_key) + 1}", "key": key}
            self._by_key[key] = rec
        rec["value"] = new_value  # for every context, from now on
        return rec["id"]

    def forget(self, record_id: str) -> None:
        for key, rec in list(self._by_key.items()):
            if rec["id"] == record_id:
                del self._by_key[key]

    def emit(self, event: dict) -> None:
        pass  # nothing listens

    def explain(self, record_id: str) -> dict:
        return {}  # it does not know
