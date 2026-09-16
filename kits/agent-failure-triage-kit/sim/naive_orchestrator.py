"""The orchestrator from the story. It has no bug.

Every line here is something a competent team ships. It reads a document, asks
a model, checks the answer, retries what failed, and gives up after three
tries. Read it looking for the defect and you will not find a broken function.

The defect is in the vocabulary. Three things are recorded as the same thing:

  * `_read_receipt` turns every non-success into `None`, so "the store said
    there is no receipt" and "the store did not answer" arrive at the caller
    identically.
  * the retry loop around the model treats a checker rejection as something
    another attempt might fix, when the input has not changed.
  * `_pay` treats `OutcomeUnknown` as a failure, so it retries a write whose
    outcome nobody established, with no idempotency key.

Run it with `make naive`.
"""

from __future__ import annotations

from .clock import Clock
from .fakes import (
    Case,
    DocStoreFaults,
    FakeChecker,
    FakeDocumentStore,
    FakeEmailer,
    FakeModel,
    FakePaymentProvider,
    ProviderFaults,
)
from .records import Outcome
from .tool_contracts import Executed, Found, describe


class NaiveToolClient:
    """A retrying HTTP client, of the kind every service has.

    It is not wrong on its own. It becomes wrong when the caller retries as
    well, because nothing connects the two counters. See `double_wrapped`
    below, and test T08.
    """

    def __init__(self, max_retries: int = 3, clock: Clock | None = None) -> None:
        self.max_retries = max_retries
        self.clock = clock or Clock()
        self.calls = 0
        #: Set by the orchestrator so each inner attempt shows up in the log.
        #: Without it the amplification is invisible, which is most of why it
        #: survives code review.
        self.on_attempt = None

    def call(self, fn, *args, **kwargs):
        last = None
        for attempt in range(1, self.max_retries + 1):
            self.calls += 1
            last = fn(*args, **kwargs)
            if self.on_attempt:
                self.on_attempt(attempt, last)
            if isinstance(last, (Found, Executed)):
                return last
            if attempt < self.max_retries:
                self.clock.sleep(2.0 * attempt)
        return last


class NaiveOrchestrator:
    """Three retries everywhere, and one word for every failure."""

    MAX_RETRIES = 3

    def __init__(
        self,
        store: FakeDocumentStore,
        provider: FakePaymentProvider,
        checker: FakeChecker,
        model: FakeModel,
        emailer: FakeEmailer | None = None,
        clock: Clock | None = None,
        *,
        double_wrapped: bool = False,
        budget=None,
        on_ask=None,
        owner: str | None = None,
        seed: int = 7,
    ) -> None:
        # `budget`, `on_ask`, `owner` and `seed` are accepted and ignored. The
        # naive design has no budget, never asks the requester for anything,
        # names nobody as accountable, and has no jitter to seed. Accepting
        # them lets the same twelve tests run against both orchestrators,
        # which is how the comparison table in the README is produced.
        self.store = store
        self.provider = provider
        self.checker = checker
        self.model = model
        self.emailer = emailer or FakeEmailer()
        self.clock = clock or Clock()
        #: When true, the payment step is retried by the orchestrator AND by
        #: the tool client underneath it. Nobody wrote "nine calls" anywhere.
        self.double_wrapped = double_wrapped
        self.client = NaiveToolClient(self.MAX_RETRIES, self.clock)

    # ------------------------------------------------------------------
    # The run
    # ------------------------------------------------------------------

    def idempotency_key(self, case: Case, action: str = "refund") -> str:
        """The key this design would use, if it used one.

        It exists so a test can seed the payment provider and ask both
        orchestrators the same question. Nothing in `_pay` sends it.
        """
        return f"task-{case.case_id}:{action}"

    def run(self, case: Case, pre_approved: bool = False) -> Outcome:
        outcome = Outcome(task_id=f"naive-{case.case_id}")
        self._say(outcome, f"task {outcome.task_id} opened for {case.customer}")

        if not pre_approved:
            approved = self._decide(case, outcome)
            if not approved:
                self._say(
                    outcome,
                    "escalated to the refunds queue after "
                    f"{self.MAX_RETRIES} rejected attempts",
                )
                outcome.escalated = True
                return outcome
        else:
            self._say(outcome, "a human has already approved this refund")

        self._pay(case, outcome)
        return outcome

    # ------------------------------------------------------------------
    # Defect one: an empty value stands in for two different situations
    # ------------------------------------------------------------------

    def _read_receipt(self, case: Case, outcome: Outcome) -> str | None:
        result = self.store.get_receipt(case.receipt_id)
        self._say(outcome, f"  receipt lookup returned {describe(result)}")
        if isinstance(result, Found):
            return str(result.value)
        # Here it is. Everything that is not a success becomes the same empty
        # value, and one line later the system says "no receipt" about a read
        # that never completed.
        self._say(outcome, "  recording: no receipt on file")
        return None

    # ------------------------------------------------------------------
    # Defect two: the model is retried when the checker says no
    # ------------------------------------------------------------------

    def _decide(self, case: Case, outcome: Outcome) -> bool:
        receipt = self._read_receipt(case, outcome)
        evidence = {"receipt": receipt}

        for attempt in range(1, self.MAX_RETRIES + 1):
            recommendation = self.model.recommend(case, evidence)
            self._say(
                outcome,
                f"  attempt {attempt}: model recommends {recommendation.action} "
                f"at confidence {recommendation.confidence:.2f}",
            )
            verdict = self.checker.review(recommendation, evidence)
            if verdict.approved:
                self._say(outcome, f"  attempt {attempt}: checker approved")
                return True
            self._say(
                outcome, f"  attempt {attempt}: checker rejected, {verdict.reason}"
            )
            # Nothing about the input changed. The next attempt asks the same
            # question and gets the same answer, more confidently.
            if attempt < self.MAX_RETRIES:
                self.clock.sleep(2.0 * attempt)

        return False

    # ------------------------------------------------------------------
    # Defect three: an unknown outcome is retried as though it were a failure
    # ------------------------------------------------------------------

    def _pay(self, case: Case, outcome: Outcome) -> None:
        rounds = self.MAX_RETRIES if self.double_wrapped else 1
        result = None

        self.client.on_attempt = lambda n, r: self._say(
            outcome, f"    client attempt {n}: provider returned {describe(r)}"
        )

        for outer in range(1, rounds + 1):
            self._say(outcome, f"  orchestrator payment round {outer} of {rounds}")
            result = self.client.call(
                self.provider.refund,
                case.case_id,
                case.amount_minor,
                # No idempotency key. Every call is a new refund as far as the
                # provider is concerned, and the provider is right.
                idempotency_key=None,
            )
            if isinstance(result, Executed):
                break

        if isinstance(result, Executed):
            outcome.resolved = True
            outcome.refund_ref = result.ref
            self._say(outcome, f"  refund complete, reference {result.ref}")
            send = self.emailer.send(case.customer, "Your refund", case.case_id)
            self._say(outcome, f"  confirmation email returned {describe(send)}")
            return

        # The orchestrator believes nothing happened. The provider's ledger
        # disagrees, and nothing in this design ever asks it.
        self._say(outcome, "  payment failed, reporting the refund as unsuccessful")
        outcome.escalated = True

    # ------------------------------------------------------------------

    def _say(self, outcome: Outcome, line: str) -> None:
        outcome.log.append(f"[{self.clock.now():6.1f}s] {line}")


# --------------------------------------------------------------------------
# The story, end to end
# --------------------------------------------------------------------------


def run_story() -> tuple[Outcome, Outcome, FakePaymentProvider]:
    """Both acts. Friday's escalation, and Monday's triple refund."""
    case = Case()
    clock = Clock()

    print("=" * 74)
    print("NAIVE ORCHESTRATOR - the story, as told")
    print("=" * 74)
    print()
    print("Friday. The customer uploads a receipt and asks for a refund.")
    print("The receipt is in the document store the whole time.")
    print()

    store = FakeDocumentStore(
        receipts={case.receipt_id: "receipt-image-bytes"},
        faults=DocStoreFaults.slow_timeout(calls=99),
    )
    provider = FakePaymentProvider()
    checker = FakeChecker()
    model = FakeModel()

    friday = NaiveOrchestrator(store, provider, checker, model, clock=clock)
    act_one = friday.run(case)
    act_one.print_log()

    print()
    print(f"  receipt lookups attempted : {store.call_count}")
    print(f"  model generations         : {model.call_count}")
    print(f"  checker reviews           : {checker.call_count}")
    print(f"  refunds in the ledger     : {len(provider.ledger)}")
    print()
    print("-" * 74)
    print()
    print("Monday. A human opens the case, finds the receipt, and approves.")
    print("The payment gateway is timing out after the refund commits.")
    print()

    provider.faults = ProviderFaults.timeout_after_commit(calls=99)
    monday = NaiveOrchestrator(
        store, provider, checker, model, clock=Clock()
    )
    act_two = monday.run(case, pre_approved=True)
    act_two.print_log()

    print()
    print(f"  refund calls to the provider : {provider.refund_calls}")
    print(f"  refunds in the ledger        : {len(provider.ledger)}")
    total = provider.total_refunded(case.case_id)
    print(f"  total refunded               : Rs {total / 100:,.2f}")
    print("  the orchestrator believes    : the refund failed")
    print()
    print("No component had a bug. The model never hallucinated.")
    print('The system used one word, "error", for three different situations.')
    print("=" * 74)

    return act_one, act_two, provider


if __name__ == "__main__":  # pragma: no cover
    run_story()
