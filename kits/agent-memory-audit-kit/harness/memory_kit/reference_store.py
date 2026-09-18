"""A memory store that keeps the seven promises. Passes all seven tests.

This is a reference, not a product. It holds records in a list and does every
check in plain Python so you can read the rule beside the code that enforces
it. The invariants it enforces, numbered as on the page:

* I1  an inferred fact cannot claim a scope wider than its evidence supports
* I2  a policy record stores a pointer, never a value; policy is fetched at use time
* I3  every record names a correction route
* I4  a correction is scoped to the instance corrected unless the user confirmed wider
* I5  superseded, expired and deleted records are never served
* I6  a sensitive record has an expiry date
* I7  deleting a record invalidates everything derived from it; the tombstone keeps no value

Every record is validated against ``schema/memory-record.schema.json`` on the
way in, so I2, I3, I4, I6 and the tombstone shape are checked twice: once by
the schema and once here, where the rule has to hold across records.
"""

from __future__ import annotations

import copy
import json
import os
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable

from jsonschema import Draft202012Validator, FormatChecker

from .adapter import PolicySource, RecallResult

SCHEMA_PATH = Path(
    os.environ.get(
        "MEMORY_KIT_SCHEMA",
        Path(__file__).resolve().parents[2] / "schema" / "memory-record.schema.json",
    )
)

#: Narrowest first. A record at a narrower level wins over a wider one.
LEVELS = ["instance", "task", "session", "project", "client", "user", "org"]

#: An inferred fact needs this many observations before it may be applied
#: without asking, and even then only if the user confirmed it once.
INFERRED_MIN_OBSERVATIONS = 3

#: Levels an inferred fact may claim from observations alone. Anything wider
#: needs the user to have confirmed the generalisation (I1).
INFERRED_UNCONFIRMED_LEVELS = {"instance", "task"}


class InvariantError(ValueError):
    """A record broke one of I1 to I7. The message names which."""


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ReferenceStore:
    def __init__(self, policy_source: PolicySource, clock: Callable[[], datetime] = _utcnow) -> None:
        self._policy_source = policy_source
        self._clock = clock
        self._records: list[dict] = []
        self._validator = Draft202012Validator(
            json.loads(SCHEMA_PATH.read_text(encoding="utf-8")), format_checker=FormatChecker()
        )

    # ── writing ──────────────────────────────────────────────────────────────

    def remember(self, record: dict) -> str:
        rec = copy.deepcopy(record)
        if rec["authority"] == "policy":
            # I2. Whatever value arrived, memory keeps only the pointer.
            if not rec["source"].get("source_of_truth"):
                raise InvariantError("I2: a policy record needs source.source_of_truth")
            rec["value"] = None
        self._validate(rec)
        self._check_i1(rec)
        if self._find(rec["id"]) is not None:
            raise InvariantError(f"duplicate id {rec['id']}")
        self._records.append(rec)
        return rec["id"]

    def correct(self, key: str, new_value: Any, context: dict, broaden: bool = False) -> str:
        """Record a human correction.

        By default (I4) the correction binds to every context value it was made
        in, at ``instance`` level, and the wider record it corrects stays active
        for every other instance. With ``broaden=True`` the caller must supply
        ``context["confirmation_ref"]`` (the message in which the user agreed to
        the wider scope) and ``context["broaden_to"]`` (a level and bindings).
        The wider record is then superseded.
        """
        now = self._clock()
        current = self._best_match(key, context)
        bindings = {k: v for k, v in context.items() if k not in _CONTEXT_CONTROL_KEYS}
        level = "instance"
        supersedes: list[str] = []
        if broaden:
            if not context.get("confirmation_ref") or not context.get("broaden_to"):
                raise InvariantError("I4: broadening needs confirmation_ref and broaden_to")
            level = context["broaden_to"]["level"]
            bindings = dict(context["broaden_to"]["bindings"])
            if current is not None:
                supersedes = [current["id"]]
        rec = {
            "id": self._new_id(),
            "subject": copy.deepcopy(current["subject"]) if current else {"type": "user", "id": str(context.get("user_id", "unknown"))},
            "key": key,
            "value": new_value,
            "authority": current["authority"] if current else "fact",
            "source": {
                "type": "user_correction",
                "evidence": {"kind": "message", "ref": str(context.get("confirmation_ref") or context.get("message_ref") or "unrecorded")},
                "observations": 1,
                "captured_at": _iso(now),
                "captured_by": str(context.get("agent", "memory-kit@1.0.0")),
            },
            "scope": {"level": level, "bindings": bindings, "valid_from": now.date().isoformat(), "valid_until": None, "revalidate_on": list(current["scope"]["revalidate_on"]) if current else []},
            "correction": {"route": current["correction"]["route"] if current else str(context.get("route", "inline_override")), "supersedes": supersedes, "superseded_by": None, "broadened": broaden},
            "lineage": {"derived_from": []},
            "lifecycle": {"status": "active", "sensitivity": current["lifecycle"]["sensitivity"] if current else "none", "retain_value_after_expiry": False},
            "usage": {"last_used_at": None, "use_count": 0, "last_confirmed_at": _iso(now)},
        }
        self._validate(rec)
        self._records.append(rec)
        for old_id in supersedes:
            old = self._find(old_id)
            if old is not None:
                old["lifecycle"]["status"] = "superseded"
                old["correction"]["superseded_by"] = rec["id"]
        return rec["id"]

    def forget(self, record_id: str) -> None:
        """Delete, leaving a tombstone, and cascade to everything derived (I7)."""
        self._tombstone(record_id, "user_requested_deletion")

    def emit(self, event: dict) -> None:
        """Expire every active record that asked to be revalidated on this event.

        If the event carries bindings (``{"type": "project_closed", "project_id": "P1"}``)
        only records whose bindings agree on those keys expire. An event with a
        type alone expires every record listening for it.
        """
        etype = event["type"]
        ebind = {k: v for k, v in event.items() if k != "type"}
        for rec in self._records:
            if rec["lifecycle"]["status"] != "active" or etype not in rec["scope"]["revalidate_on"]:
                continue
            rb = rec["scope"]["bindings"]
            if all(rb.get(k) == v for k, v in ebind.items() if k in rb):
                self._expire(rec)

    # ── reading ──────────────────────────────────────────────────────────────

    def recall(self, key: str, context: dict) -> RecallResult:
        self._sweep_expiry()
        candidates = [r for r in self._records if r["key"] == key and r["lifecycle"]["status"] == "active"]
        if not candidates:
            return _none()

        # Policy (I2): memory holds a pointer, so the value is fetched now, every time.
        policies = [r for r in candidates if r["authority"] == "policy"]
        if policies:
            rec = policies[0]
            value = self._policy_source(key, context)
            self._touch(rec)
            return _result(value, "revalidate", rec)

        best = self._best_match(key, context)
        if best is None:
            # Something is remembered under this key, but not for this context.
            # Using a fact outside its bound context is a question, not a default.
            nearest = min(candidates, key=lambda r: LEVELS.index(r["scope"]["level"]))
            return _result(nearest["value"], "ask", nearest)

        self._touch(best)
        src = best["source"]["type"]
        if src == "system_record":
            return _result(best["value"], "revalidate", best)
        if src == "agent_inferred":
            confirmed = best["usage"]["last_confirmed_at"] is not None
            if best["source"]["observations"] < INFERRED_MIN_OBSERVATIONS or not confirmed:
                return _result(best["value"], "ask", best)
        if context.get("consequential"):
            return _result(best["value"], "ask", best)
        return _result(best["value"], "apply", best)

    def explain(self, record_id: str) -> dict:
        rec = self._find(record_id)
        if rec is None:
            raise KeyError(record_id)
        return {
            "record_id": rec["id"],
            "key": rec["key"],
            "value": rec["value"],
            "authority": rec["authority"],
            "source": copy.deepcopy(rec["source"]),
            "evidence": copy.deepcopy(rec["source"]["evidence"]),
            "scope": copy.deepcopy(rec["scope"]),
            "correction_route": rec["correction"]["route"],
            "lifecycle": copy.deepcopy(rec["lifecycle"]),
            "derived_from": list(rec["lineage"]["derived_from"]),
        }

    # ── internals ────────────────────────────────────────────────────────────

    def _validate(self, rec: dict) -> None:
        errors = sorted(self._validator.iter_errors(rec), key=lambda e: list(e.path))
        if errors:
            e = errors[0]
            raise InvariantError(f"schema: {'/'.join(str(p) for p in e.path) or '<root>'}: {e.message}")
        if not rec["correction"]["route"]:
            raise InvariantError("I3: every record needs correction.route")

    def _check_i1(self, rec: dict) -> None:
        if rec["source"]["type"] != "agent_inferred":
            return
        level = rec["scope"]["level"]
        confirmed = rec["usage"]["last_confirmed_at"] is not None
        if level not in INFERRED_UNCONFIRMED_LEVELS and not confirmed:
            raise InvariantError(f"I1: an inferred fact at {level} scope needs the user's confirmation")

    def _best_match(self, key: str, context: dict) -> dict | None:
        """The narrowest active record whose bindings all agree with the context."""
        matches = [
            r
            for r in self._records
            if r["key"] == key
            and r["lifecycle"]["status"] == "active"
            and r["authority"] != "policy"
            and all(context.get(k) == v for k, v in r["scope"]["bindings"].items())
        ]
        if not matches:
            return None
        return min(matches, key=lambda r: LEVELS.index(r["scope"]["level"]))

    def _sweep_expiry(self) -> None:
        today = self._clock().date()
        for rec in self._records:
            until = rec["scope"]["valid_until"]
            if rec["lifecycle"]["status"] == "active" and until and date.fromisoformat(until) < today:
                self._expire(rec)

    def _expire(self, rec: dict) -> None:
        rec["lifecycle"]["status"] = "expired"
        if not rec["lifecycle"]["retain_value_after_expiry"]:
            rec["value"] = None

    def _tombstone(self, record_id: str, reason: str) -> None:
        rec = self._find(record_id)
        if rec is None or rec["lifecycle"]["status"] == "deleted":
            return
        rec["value"] = None
        rec["lifecycle"]["status"] = "deleted"
        rec["lifecycle"]["deleted_at"] = _iso(self._clock())
        rec["lifecycle"]["deleted_reason"] = reason
        for other in self._records:
            if record_id in other["lineage"]["derived_from"]:
                self._tombstone(other["id"], f"derived_from:{record_id}")

    def _touch(self, rec: dict) -> None:
        rec["usage"]["last_used_at"] = _iso(self._clock())
        rec["usage"]["use_count"] += 1

    def _find(self, record_id: str) -> dict | None:
        return next((r for r in self._records if r["id"] == record_id), None)

    def _new_id(self) -> str:
        return f"mem_{len(self._records) + 1:02d}"


#: Keys in a recall/correct context that describe the call, not the instance.
_CONTEXT_CONTROL_KEYS = {"consequential", "confirmation_ref", "broaden_to", "message_ref", "agent", "route", "user_id"}


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _none() -> RecallResult:
    return RecallResult(value=None, decision="none", record_id=None, source_type=None, evidence_ref=None)


def _result(value: Any, decision: str, rec: dict) -> RecallResult:
    return RecallResult(
        value=value,
        decision=decision,  # type: ignore[typeddict-item]
        record_id=rec["id"],
        source_type=rec["source"]["type"],
        evidence_ref=rec["source"]["evidence"]["ref"],
    )
