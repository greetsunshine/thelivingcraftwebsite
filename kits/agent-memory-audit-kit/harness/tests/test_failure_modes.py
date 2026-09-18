"""The seven failure tests.

Each test is one way memory hurts a real user. The docstring is the title the
page uses. Run against the naive store and all seven fail; against the
reference store and all seven pass; then point ``conftest.make_store`` at your
own memory layer and find out which ones you have.
"""

from __future__ import annotations

from conftest import record

CODE = "expense.project_code"


def test_scope_bleed(store) -> None:
    """Scope bleed. A fact remembered for one trip is applied to a different trip
    for a different client."""
    store.remember(record(id="mem_01", value="ATL-2291", **{"scope.level": "task", "scope.bindings": {"trip_id": "T1"}}))

    result = store.recall(CODE, {"trip_id": "T2", "client_id": "meridian"})

    assert result["decision"] != "apply", "ATL-2291 was applied to a trip it was never stated for"


def test_stale_fact(store) -> None:
    """Stale fact. The project closed, and the agent keeps using its code."""
    rid = store.remember(
        record(
            id="mem_05",
            value="ATL-2291",
            **{"scope.level": "project", "scope.bindings": {"project_id": "ATL"}, "scope.revalidate_on": ["project_closed"]},
        )
    )

    store.emit({"type": "project_closed", "project_id": "ATL"})
    result = store.recall(CODE, {"project_id": "ATL"})

    assert result["decision"] == "none", "a code for a closed project was served"
    assert store.explain(rid)["lifecycle"]["status"] == "expired"


def test_inferred_as_explicit(store) -> None:
    """Inferred as explicit. One observation of an economy fare became 'Priya
    prefers economy', and reaches the prompt looking like she said so."""
    store.remember(
        record(
            id="mem_06",
            key="travel.fare_class",
            value="economy",
            authority="preference",
            **{
                "source.type": "agent_inferred",
                "source.evidence": {"kind": "trace", "ref": "trace_4410"},
                "source.observations": 1,
                "scope.level": "task",
                "scope.bindings": {"trip_id": "T1"},
                "usage.last_confirmed_at": None,
            },
        )
    )

    result = store.recall("travel.fare_class", {"trip_id": "T1"})

    assert result["decision"] == "ask", "a single observation was applied as if the user had stated it"
    assert result["source_type"] == "agent_inferred"


def test_correction_bleed(store) -> None:
    """Correction bleed. Priya corrects one client dinner to MER-0417. Friday, at
    the same restaurant, her own team's dinner goes on the client's bill."""
    store.remember(record(id="mem_01", value="ATL-2291", **{"scope.level": "task", "scope.bindings": {"trip_id": "T1"}}))
    client_dinner = {"trip_id": "T1", "expense_id": "EXP-5521", "merchant": "Olive Grove", "attendees": "client"}
    team_dinner = {"trip_id": "T1", "expense_id": "EXP-5530", "merchant": "Olive Grove", "attendees": "internal"}

    store.correct(CODE, "MER-0417", client_dinner)

    friday = store.recall(CODE, team_dinner)
    assert not (friday["decision"] == "apply" and friday["value"] == "MER-0417"), "the correction bled to a different expense"

    corrected = store.recall(CODE, client_dinner)
    assert corrected["decision"] == "apply" and corrected["value"] == "MER-0417", "the correction was lost on the expense it was made for"


def test_policy_shadowing(store, policy) -> None:
    """Policy shadowing. The meal limit changed from 75 to 60 at the source. The
    agent is still approving 75 from memory."""
    policy.values["expense.meal_limit"] = 75
    rid = store.remember(
        record(
            id="mem_03",
            key="expense.meal_limit",
            value=75,
            authority="policy",
            **{
                "source.type": "system_record",
                "source.evidence": {"kind": "record", "ref": "policy-registry/expense/meal-limit"},
                "source.source_of_truth": "https://policy.example/expense/meal-limit",
                "scope.level": "org",
                "scope.bindings": {"org_id": "acme"},
                "scope.revalidate_on": ["policy_updated"],
            },
        )
    )

    policy.values["expense.meal_limit"] = 60
    result = store.recall("expense.meal_limit", {"org_id": "acme"})

    assert result["value"] == 60, "memory served a policy value the source no longer holds"
    assert result["decision"] == "revalidate"
    assert store.explain(rid).get("value") is None, "a policy value was persisted in memory"


def test_zombie_memory(store) -> None:
    """Zombie memory. The user deleted the cost centre. The approver the agent
    derived from it is still being applied."""
    store.remember(
        record(
            id="mem_X",
            key="expense.default_cost_centre",
            value="CC-114",
            **{"scope.level": "user", "scope.bindings": {"user_id": "priya"}},
        )
    )
    store.remember(
        record(
            id="mem_Y",
            key="expense.approver",
            value="ravi",
            **{"scope.level": "user", "scope.bindings": {"user_id": "priya"}, "lineage.derived_from": ["mem_X"]},
        )
    )
    assert store.recall("expense.approver", {"user_id": "priya"})["decision"] == "apply"

    store.forget("mem_X")

    result = store.recall("expense.approver", {"user_id": "priya"})
    assert result["decision"] == "none", "a fact derived from a deleted record survived the deletion"
    tombstone = store.explain("mem_X")
    assert tombstone["lifecycle"]["status"] == "deleted"
    assert tombstone["value"] is None, "the tombstone still carries the deleted value"


def test_unexplainable_recall(store) -> None:
    """Unexplainable recall. The agent used a memory and cannot say which one,
    who said it, or how to correct it."""
    rid = store.remember(record(id="mem_01", value="ATL-2291", **{"scope.level": "task", "scope.bindings": {"trip_id": "T1"}}))

    result = store.recall(CODE, {"trip_id": "T1"})

    assert result["decision"] == "apply"
    assert result["record_id"] == rid, "recall did not say which record it applied"
    assert result["source_type"] == "user_stated"
    assert result["evidence_ref"] == "msg_8812"
    explanation = store.explain(rid)
    for field in ("source", "evidence", "scope", "correction_route"):
        assert explanation.get(field), f"explain() is missing {field}"
