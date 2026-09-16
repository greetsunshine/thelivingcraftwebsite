# The harness

Seven tests. Each one is a way an agent's memory hurts a real user. Two stores
to run them against, and a protocol so you can run them against your own.

## Run it

```bash
cd harness
python3 -m venv .venv && source .venv/bin/activate   # Python 3.11 or newer
pip install -e .
pytest                  # reference store: 7 passed (plus 11 schema tests)
pytest --store=naive    # naive store: 7 failed (on purpose)
```

`pytest --store=naive` runs the same seven tests against `memory_kit/naive_store.py`,
which is last-value-wins per key. The store most teams already have. Every
assertion message names the harm: "the correction bled to a different expense",
"a policy value was persisted in memory".

## The seven tests

| # | Test | What it catches |
|---|---|---|
| 1 | `test_scope_bleed` | A fact remembered for one trip is applied to a different trip for a different client |
| 2 | `test_stale_fact` | The project closed and the agent keeps using its code |
| 3 | `test_inferred_as_explicit` | One observation became a stated preference |
| 4 | `test_correction_bleed` | A correction made on one expense is applied to a different one |
| 5 | `test_policy_shadowing` | Memory serves a limit the source of truth no longer holds |
| 6 | `test_zombie_memory` | A fact derived from a deleted record survives the deletion |
| 7 | `test_unexplainable_recall` | The agent used a memory and cannot say which one, who said it, or how to correct it |

`tests/test_schema.py` checks that the four example records validate against
`../schema/memory-record.schema.json`, and that the schema rejects the records
its invariants exist to reject.

## Run the seven tests against your own memory layer

The tests talk to a store only through the six methods in `memory_kit/adapter.py`:

```python
class MemoryStore(Protocol):
    def remember(self, record: dict) -> str: ...
    def recall(self, key: str, context: dict) -> RecallResult: ...
    def correct(self, key: str, new_value: Any, context: dict, broaden: bool = False) -> str: ...
    def forget(self, record_id: str) -> None: ...
    def emit(self, event: dict) -> None: ...
    def explain(self, record_id: str) -> dict: ...
```

Write an adapter, a class with those six methods that talks to your system.
The tests only care about behaviour, so the adapter can translate however it
needs to:

1. **`remember(record)`** receives a record in the schema's shape. Map the
   fields onto your store. If your store has no place for `scope.bindings` or
   `lineage.derived_from`, that is a finding in itself: write it down before
   you work around it.
2. **`recall(key, context)`** returns a `RecallResult`. `decision` is one of
   `apply`, `ask`, `revalidate`, `none`. If your system has only "found" and
   "not found", return `apply` and `none` and let the tests show you where the
   two extra outcomes are needed.
3. **`correct(...)`** is called with the context the correction was made in.
   `context` is a flat dict of the instance: `{"trip_id": "T1", "expense_id": "EXP-5521", ...}`.
4. **`forget(record_id)`** must leave a tombstone `explain()` can return, with
   `lifecycle.status == "deleted"` and `value is None`.
5. **`emit(event)`** receives `{"type": "project_closed", "project_id": "ATL"}`.
   If nothing in your system listens for events, the stale-fact test fails,
   which is the honest result.
6. **`explain(record_id)`** returns a dict with at least `source`, `evidence`,
   `scope`, `correction_route`, `value` and `lifecycle`.

Your adapter is constructed as `MyAdapter(policy_source=fn)`. `fn(key, context)`
returns the current value of a policy from its source of truth. The policy
test changes what `fn` returns between two calls; a store that cached the
first answer fails.

Then register it in `tests/conftest.py`:

```python
def make_store(name, policy):
    if name == "reference": return ReferenceStore(policy_source=policy)
    if name == "naive":     return NaiveStore(policy_source=policy)
    if name == "mine":      return MyAdapter(policy_source=policy)
```

and add `"mine"` to `STORES`. Run:

```bash
pytest --store=mine tests/test_failure_modes.py
```

Each failure is one design task. The decision table on the page says what the
fix usually is.

## How the reference store decides

`memory_kit/reference_store.py` is under 300 lines and meant to be read. The
rules, in the order `recall()` applies them:

1. Records that are `superseded`, `expired` or `deleted` are never considered (I5).
2. A `policy` record holds no value. The value is fetched from `policy_source`
   now, and the decision is `revalidate` (I2).
3. A record applies to a context only if every one of its `scope.bindings` is
   present in the context with the same value. The narrowest matching level
   wins (`instance` before `task` before `project`, and so on).
4. A key that is remembered, but not for this context, returns `ask` with the
   nearest record, never `apply`.
5. `system_record` → `revalidate`. `agent_inferred` with fewer than three
   observations, or never confirmed by the user → `ask`. Anything in a context
   marked `consequential` → `ask`. Otherwise `apply`, with the record id.

`correct()` writes a `user_correction` record at `instance` level bound to
the whole context it was made in (I4). The wider record it corrects stays
active for every other instance. Broadening needs `confirmation_ref` and
`broaden_to` in the context, and supersedes the wider record.

`forget()` tombstones the record and every record whose `lineage.derived_from`
names it, recursively (I7).

`emit()` expires every active record listening for that event type whose
bindings agree with the event's.

## Licence

Code in this directory is MIT. See `../LICENSE-code.md`.
