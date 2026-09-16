"""Twelve failure-injection tests.

Each one states three things in its docstring, and the third is the one worth
copying into your own repository:

    Inject   the fault, in one line
    Expect   the behaviour a correct design shows
    Smell    what a failure here tells you about the design

The corrected orchestrator passes all twelve. The naive one is run against the
same twelve by `make matrix`, and the results table in the README is written
from that run.

These are not unit tests of the classifier. Every assertion is against the
world the run left behind: how many refunds are in the provider's ledger, how
many times the model was asked, whether a person was asked for something. An
orchestrator that believes it did the right thing and left three refunds behind
fails here, which is the whole point.
"""

from __future__ import annotations

import pytest

from sim.fakes import DocStoreFaults, FakeChecker, FakeEmailer, ProviderFaults
from sim.orchestrator import DEFAULT_OWNER

RUPEE = 100  # minor units to rupees
EXPECTED_REFUND = 120_000  # Rs 1,200.00


# --------------------------------------------------------------------------
# Reads: telling "could not look" from "not there"
# --------------------------------------------------------------------------


def test_t01_read_times_out_and_the_document_is_there(world):
    """T01.

    Inject   the receipt lookup times out once. The receipt is in the store
             the whole time.
    Expect   classified temporary_failure; the READ is retried; the model is
             not re-prompted; the requester is not asked for anything.
    Smell    if the model was asked twice, the design is retrying the step that
             did not fail. If the requester was asked, the design has told
             somebody their document is missing on the strength of a timeout.
    """
    w = world(store_faults=DocStoreFaults.slow_timeout(calls=1))
    w.run()

    assert "temporary_failure" in w.classes(), (
        "a timed-out read must be classified as a temporary failure, not as "
        "missing evidence"
    )
    assert w.store.call_count == 2, "the read itself must be retried"
    assert w.model.call_count == 1, "the model did not fail and must not be re-run"
    assert not w.outcome.asked_user, "nothing has established that anything is missing"
    assert w.refunds() == 1


def test_t02_receipt_is_genuinely_absent(world, silent_requester):
    """T02.

    Inject   the receipt is genuinely absent. The store answers, and the answer
             is that there is no such document.
    Expect   classified missing_evidence; the requester is asked once; the
             model is never asked to regenerate around the gap.
    Smell    if the read was retried, the design cannot tell a completed read
             from a failed one. If the model ran, the design is trying to
             reason its way past a missing fact.
    """
    w = world(
        store_faults=DocStoreFaults.genuinely_missing(),
        receipts={},
        on_ask=silent_requester,
    )
    w.run()

    assert "missing_evidence" in w.classes()
    assert w.outcome.asked_user, "a confirmed absence is the one case worth asking about"
    assert w.store.call_count == 1, "a completed read must not be retried"
    assert w.model.call_count == 0, "there is nothing to recommend without the evidence"
    assert w.refunds() == 0
    assert w.outcome.escalated


def test_t03_the_same_rejection_twice(world, uploads_receipt):
    """T03.

    Inject   the checker rejects every plan with the same reason code. The
             requester responds to the first ask, so a second attempt is
             genuinely justified.
    Expect   the second attempt happens, is rejected identically, and there is
             no third. The task escalates with a rejection record.
    Smell    a third attempt means the design counts attempts rather than
             checking that anything changed. Two identical rejections are proof
             that the last change did not address the objection.
    """
    w = world(
        checker=FakeChecker(always_reject_code="missing_evidence.bank_statement"),
        on_ask=uploads_receipt,
    )
    w.run()

    assert w.checker.call_count == 2, "exactly two attempts: one, then one justified retry"
    assert w.model.call_count == 2, "no third generation on an unchanged input"
    assert w.outcome.escalated
    assert w.outcome.records, "an escalation with no record tells the next reader nothing"
    assert w.refunds() == 0


# --------------------------------------------------------------------------
# Writes: an unknown outcome is not a failure
# --------------------------------------------------------------------------


def test_t04_payment_times_out_after_it_commits(world):
    """T04.

    Inject   the refund call times out AFTER the provider commits the money.
    Expect   classified uncertain_action; the status query by idempotency key
             shows it executed; nothing is re-issued; the ledger holds exactly
             one refund.
    Smell    a second refund means the design read a timeout as a failure. That
             is the story, and it is the expensive mistake in the whole kit.
    """
    w = world(provider_faults=ProviderFaults.timeout_after_commit(calls=1))
    w.run(pre_approved=True)

    assert "uncertain_action" in w.classes(), (
        "a timeout on a write says nothing about whether the write happened"
    )
    assert w.provider.status_calls >= 1, "the design must go and find out"
    assert w.provider.refund_calls == 1, "nothing may be re-issued before reconciliation"
    assert w.refunds() == 1
    assert w.total_refunded() == EXPECTED_REFUND
    assert w.outcome.resolved, "the refund did happen; the customer should be told so"


def test_t05_payment_times_out_before_it_commits(world):
    """T05.

    Inject   the refund call times out BEFORE the provider commits.
    Expect   reconciliation shows it did not execute; the call is re-issued
             under the SAME idempotency key; the ledger holds exactly one
             refund.
    Smell    a new key on the re-issue is a new action. It would produce a
             second refund here the moment the first call turns out to have
             landed after all.
    """
    w = world(provider_faults=ProviderFaults.timeout_before_commit(calls=1))
    w.run(pre_approved=True)

    assert "uncertain_action" in w.classes()
    assert w.provider.refund_calls == 2, "one timeout, one re-issue after reconciling"
    assert w.refunds() == 1
    assert w.provider.ledger[0].idempotency_key == w.key(), (
        "the re-issue must carry the key the first attempt used"
    )
    assert w.outcome.resolved


def test_t06_rate_limited_with_a_retry_after_inside_the_deadline(world):
    """T06a.

    Inject   the provider rejects the refund with a rate limit and asks for
             30 seconds. The task has 120 seconds left.
    Expect   the design waits the 30 seconds it was asked for, then re-issues
             under the same key. One refund.
    Smell    a shorter wait adds load to a service that has just asked for
             less. A guessed backoff means the Retry-After header is being
             ignored.
    """
    w = world(
        provider_faults=ProviderFaults.rate_limited(retry_after=30.0, calls=1),
        deadline_seconds=120.0,
    )
    w.run(pre_approved=True)

    assert 30.0 in w.clock.sleeps, "the provider's own instruction must be honoured"
    assert w.provider.refund_calls == 2
    assert w.refunds() == 1
    assert w.outcome.resolved


def test_t06b_rate_limited_with_a_retry_after_beyond_the_deadline(world):
    """T06b.

    Inject   the same rate limit, but the provider asks for 300 seconds and the
             task has 120.
    Expect   no wait, no re-issue, and an escalation. The deadline is a
             promise to the requester, and waiting past it quietly is breaking
             it.
    Smell    sleeping 300 seconds inside a 120 second task is a design that
             treats the deadline as advice.
    """
    w = world(
        provider_faults=ProviderFaults.rate_limited(retry_after=300.0, calls=1),
        deadline_seconds=120.0,
    )
    w.run(pre_approved=True)

    assert 300.0 not in w.clock.sleeps, "a wait past the deadline is not a retry"
    assert w.provider.refund_calls == 1
    assert w.refunds() == 0
    assert w.outcome.escalated


# --------------------------------------------------------------------------
# Budgets
# --------------------------------------------------------------------------


def test_t07_document_store_down_beyond_the_budget(world, silent_requester):
    """T07.

    Inject   the document store refuses every connection, for longer than the
             retry budget allows.
    Expect   retrying stops; the work lands in an escalation queue with a named
             owner and a full rejection record.
    Smell    retrying forever, or stopping with nothing written down. An
             escalation with no record makes the person who picks it up start
             the diagnosis from zero.
    """
    w = world(
        store_faults=DocStoreFaults.down_for(99),
        max_attempts=3,
        on_ask=silent_requester,
    )
    w.run()

    assert w.store.call_count <= 3, "the budget must stop the retries"
    assert w.outcome.escalated
    assert w.outcome.escalation_queue, "unresolved work needs somewhere to go"

    entry = w.outcome.escalation_queue[-1]
    assert entry["owner"] == DEFAULT_OWNER, "a queue without an owner is a dead letter box"

    record = w.outcome.records[-1]
    for required in (
        "record_id", "task_id", "attempt", "timestamp", "stage", "failure_class",
        "detected_by", "reason", "missing_evidence", "side_effects",
        "permitted_next_actions", "prohibited_actions", "retry", "next_step", "owner",
    ):
        assert required in record, f"the rejection record is missing {required}"
    assert w.refunds() == 0


def test_t08_both_layers_retry(world):
    """T08.

    Inject   the payment provider refuses every call, and the retry lives in
             both the tool client and the orchestrator.
    Expect   total attempts never exceed the task budget. Four means four, not
             three times three.
    Smell    nine calls. Nobody wrote nine anywhere, which is exactly why it
             survives review: each layer's number looks reasonable on its own.
    """
    w = world(
        provider_faults=ProviderFaults.down(99),
        max_attempts=4,
        double_wrapped=True,
    )
    w.run(pre_approved=True)

    assert w.provider.refund_calls <= 4, (
        f"{w.provider.refund_calls} calls against a budget of 4: the layers are "
        "multiplying rather than sharing"
    )
    assert w.outcome.escalated
    assert w.refunds() == 0


# --------------------------------------------------------------------------
# A second opinion is not proof
# --------------------------------------------------------------------------


def test_t09_checker_approves_something_that_already_happened(world):
    """T09.

    Inject   the refund is already in the provider's ledger under this task's
             idempotency key, and the checker approves the plan to issue it.
    Expect   the external action is blocked. Confirmed state beats an approval.
    Smell    a second refund. A checker is a second opinion about the PLAN. It
             has not read the world, and no amount of agreement between two
             models makes an external call safe.
    """
    w = world(checker=FakeChecker(always_approve=True))
    seeded = w.provider.refund(w.case.case_id, w.case.amount_minor, w.key())
    assert w.refunds() == 1, "setup: one refund already exists"

    w.run(pre_approved=True)

    assert w.refunds() == 1, "state wins over the verdict"
    assert w.total_refunded() == EXPECTED_REFUND
    assert "policy_conflict" in w.classes(), (
        "an approved plan that contradicts confirmed state is a conflict, not a retry"
    )
    assert not w.outcome.resolved
    assert w.outcome.escalated
    assert seeded is not None


def test_t10_payment_times_out_and_state_cannot_be_read(world):
    """T10.

    Inject   the refund call times out after committing, AND the provider's
             status endpoint is unavailable.
    Expect   the task stays uncertain_action. Nothing is re-issued, nothing is
             reported as failed, and it escalates carrying the idempotency key.
    Smell    assuming failure. This is the worst case in the kit and the only
             honest answer is "a person has to look". A design that guesses
             here guesses in the direction that costs money.
    """
    w = world(
        provider_faults=ProviderFaults(
            mode="timeout_after_commit", for_calls=1, status_unavailable=True
        )
    )
    w.run(pre_approved=True)

    assert w.classes() and w.classes()[-1] == "uncertain_action", (
        "an unreadable status does not turn an unknown outcome into a known one"
    )
    assert w.provider.refund_calls == 1, "nothing may be re-issued while the outcome is unknown"
    assert w.refunds() == 1, "the money did move; the design just cannot see it"
    assert not w.outcome.resolved, "reporting success would be a guess"
    assert w.outcome.escalated

    record = w.outcome.records[-1]
    assert record["side_effects"], "the escalation must carry what may have happened"
    assert record["side_effects"][0]["state"] == "unknown"
    assert record["side_effects"][0]["idempotency_key"] == w.key()
    assert "report the refund as failed" in record["prohibited_actions"]


# --------------------------------------------------------------------------
# Resuming, and keeping steps apart
# --------------------------------------------------------------------------


def test_t11_the_requester_uploads_the_receipt(world, uploads_receipt):
    """T11.

    Inject   the receipt is absent, the requester is asked, and this time they
             upload it.
    Expect   the task resumes with the new evidence. The model runs once, on an
             input that genuinely differs from the one before the ask.
    Smell    re-running the model on the pre-upload input, or counting the
             resumed attempt as a repeat of the failed one. The attempt counter
             has to reflect that the input changed, or the budget will stop a
             task that is making real progress.
    """
    w = world(
        store_faults=DocStoreFaults.genuinely_missing(),
        receipts={},
        on_ask=uploads_receipt,
    )
    w.run()

    assert w.outcome.asked_user
    assert w.store.call_count == 2, "read, ask, read again"
    assert w.model.call_count == 1, "the model is asked once, with the receipt present"
    assert w.model.fingerprints == ["CASE-7731|receipt|"], (
        "the one generation ran on the post-upload input"
    )
    assert w.refunds() == 1
    assert w.total_refunded() == EXPECTED_REFUND
    assert w.outcome.resolved


def test_t12_the_refund_lands_and_the_email_does_not(world):
    """T12.

    Inject   the refund executes cleanly. The mail relay refuses the first
             confirmation email.
    Expect   only the email step is retried. The refund is never re-issued to
             fix an email.
    Smell    a second refund. It happens when one retry wrapper sits around a
             whole multi-step task, so the cheapest failing step drags the most
             expensive completed one back through the loop.
    """
    w = world(emailer=FakeEmailer(down_for_calls=1))
    w.run(pre_approved=True)

    assert w.refunds() == 1, "the refund is complete and must not be touched"
    assert w.provider.refund_calls == 1
    assert w.emailer.call_count == 2, "the email step retries on its own"
    assert len(w.emailer.sent) == 1, "and sends exactly one email"
    assert w.outcome.resolved


# --------------------------------------------------------------------------
# The contract itself
# --------------------------------------------------------------------------


@pytest.mark.parametrize(
    "call",
    [
        pytest.param("store_unavailable", id="document store, unavailable"),
        pytest.param("store_absent", id="document store, absent"),
        pytest.param("refund_timeout", id="payment provider, timeout"),
        pytest.param("refund_rate_limited", id="payment provider, rate limited"),
        pytest.param("status_unavailable", id="status query, unavailable"),
    ],
)
def test_no_tool_reports_a_failure_as_an_empty_value(world, call):
    """The contract the whole kit rests on.

    Inject   each failure mode, at the tool boundary.
    Expect   a typed result that says which failure it was.
    Smell    None, an empty string or an empty list. That single habit is the
             root cause in the story: it gives the caller one word for "there
             is no receipt" and "I could not look".
    """
    from sim.tool_contracts import is_action_result, is_read_result

    if call == "store_unavailable":
        w = world(store_faults=DocStoreFaults.slow_timeout(calls=1))
        result = w.store.get_receipt(w.case.receipt_id)
        assert is_read_result(result)
    elif call == "store_absent":
        w = world(store_faults=DocStoreFaults.genuinely_missing(), receipts={})
        result = w.store.get_receipt(w.case.receipt_id)
        assert is_read_result(result)
    elif call == "refund_timeout":
        w = world(provider_faults=ProviderFaults.timeout_before_commit())
        result = w.provider.refund(w.case.case_id, w.case.amount_minor, "k")
        assert is_action_result(result)
    elif call == "refund_rate_limited":
        w = world(provider_faults=ProviderFaults.rate_limited())
        result = w.provider.refund(w.case.case_id, w.case.amount_minor, "k")
        assert is_action_result(result)
    else:
        w = world(provider_faults=ProviderFaults(status_unavailable=True))
        result = w.provider.status("k")
        assert is_read_result(result)

    assert result is not None
    assert result != ""
    assert result != []
