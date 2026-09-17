"""Agent Memory Audit Kit: the harness.

Three modules:

* ``adapter``         the ``MemoryStore`` protocol readers implement for their own system
* ``naive_store``     last-value-wins per key; fails all seven failure tests on purpose
* ``reference_store`` enforces invariants I1 to I7; passes all seven

Built by Sunil Mathew, co-authored with Claude. Content is CC BY 4.0. Code is
MIT. See the two LICENSE files one directory up.
"""

from .adapter import MemoryStore, RecallResult
from .naive_store import NaiveStore
from .reference_store import ReferenceStore

__all__ = ["MemoryStore", "RecallResult", "NaiveStore", "ReferenceStore"]
