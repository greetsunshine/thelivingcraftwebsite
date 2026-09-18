"""The protocol a memory layer implements to run the seven failure tests.

Six methods. Each one is a question the tests ask, so the tests never need to
know how your system stores anything:

* ``remember(record)``                       store one record; return its id
* ``recall(key, context)``                   what the agent may use right now, and how
* ``correct(key, new_value, context, ...)``  a human fixes a fact
* ``forget(record_id)``                      delete, leaving a tombstone
* ``emit(event)``                            tell the store something happened
* ``explain(record_id)``                     source, evidence, scope and correction route

A store is built with ``policy_source``, a function the tests can swap so the
authoritative value of a policy changes between two calls. That is how the
policy-shadowing test catches a cached limit.
"""

from __future__ import annotations

from typing import Any, Callable, Literal, Protocol, TypedDict

#: Fetches the current value of a policy from its source of truth.
#: Called with the record key and the recall context.
PolicySource = Callable[[str, dict], Any]

Decision = Literal["apply", "ask", "revalidate", "none"]


class RecallResult(TypedDict):
    """What ``recall`` hands back to the agent.

    ``decision`` says what the agent may do with ``value``:

    * ``apply``       use it, and show the trace (``record_id``) to the user
    * ``ask``         confirm with the user before using it
    * ``revalidate``  the value came from, or was checked against, the source of truth
    * ``none``        nothing to use; behave as if nothing were remembered
    """

    value: Any | None
    decision: Decision
    record_id: str | None
    source_type: str | None
    evidence_ref: str | None


class MemoryStore(Protocol):
    def remember(self, record: dict) -> str: ...

    def recall(self, key: str, context: dict) -> RecallResult: ...

    def correct(self, key: str, new_value: Any, context: dict, broaden: bool = False) -> str: ...

    def forget(self, record_id: str) -> None: ...

    def emit(self, event: dict) -> None: ...

    def explain(self, record_id: str) -> dict:
        """Return at least ``source``, ``evidence``, ``scope`` and ``correction_route``."""
        ...
