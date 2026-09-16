"""The fake world the two orchestrators run against.

Every fault is explicit configuration. Nothing here is random, and nothing
calls a network or a model. A test states the fault it injects in one line, and
the same line is what makes the run reproducible.

Five fakes:

    FakeDocumentStore   the receipt lookup
    FakePaymentProvider the refund, with a ledger and an idempotency key
    FakeChecker         the second opinion that approves or rejects
    FakeModel           the recommendation, deterministic and increasingly
                        confident when asked the same thing twice
    FakeEmailer         the confirmation email, so T12 has a second side effect

The provider is the important one. It keeps a ledger of refunds that actually
happened, which is how a test can say "exactly one refund" and mean it rather
than meaning "the code thought it did one refund".
"""

from __future__ import annotations

from dataclasses import dataclass

from .tool_contracts import (
    ActionResult,
    Executed,
    Found,
    NotExecuted,
    NotFound,
    OutcomeUnknown,
    ReadResult,
    Unavailable,
)

# --------------------------------------------------------------------------
# The case under dispute
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class Case:
    """One refund request. The illustrative story's case."""

    case_id: str = "CASE-7731"
    customer: str = "customer-4102"
    #: Minor units. 120000 paise is Rs 1,200.
    amount_minor: int = 120_000
    currency: str = "INR"
    #: The receipt the customer says they uploaded.
    receipt_id: str = "RCPT-88214"


# --------------------------------------------------------------------------
# Document store
# --------------------------------------------------------------------------


@dataclass
class DocStoreFaults:
    """How the document store misbehaves.

    `unavailable_for_calls` is the count of leading calls that fail to
    complete. It is separate from `genuinely_absent` on purpose: those two are
    the situations the story confuses, and keeping them as different fields
    here is the same discipline the tool contract enforces at the boundary.
    """

    unavailable_for_calls: int = 0
    reason: str = "read timed out after 5.0s"
    retry_after: float | None = None
    genuinely_absent: bool = False

    @classmethod
    def none(cls) -> "DocStoreFaults":
        return cls()

    @classmethod
    def slow_timeout(cls, calls: int = 1) -> "DocStoreFaults":
        """The read times out. The document is there the whole time."""
        return cls(unavailable_for_calls=calls)

    @classmethod
    def genuinely_missing(cls) -> "DocStoreFaults":
        """The document really is not there. Nobody uploaded it."""
        return cls(genuinely_absent=True)

    @classmethod
    def down_for(cls, calls: int) -> "DocStoreFaults":
        """The store is refusing connections for the next `calls` attempts."""
        return cls(unavailable_for_calls=calls, reason="connection refused")


class FakeDocumentStore:
    def __init__(
        self,
        receipts: dict[str, str] | None = None,
        faults: DocStoreFaults | None = None,
    ) -> None:
        self._receipts = dict(receipts or {})
        self.faults = faults or DocStoreFaults.none()
        self.call_count = 0

    # -- the tool ----------------------------------------------------------

    def get_receipt(self, receipt_id: str) -> ReadResult:
        """Three outcomes. Never an empty value, never an exception."""
        self.call_count += 1

        if self.call_count <= self.faults.unavailable_for_calls:
            return Unavailable(self.faults.reason, self.faults.retry_after)

        if self.faults.genuinely_absent:
            return NotFound()

        if receipt_id in self._receipts:
            return Found(self._receipts[receipt_id])

        return NotFound()

    # -- things the world does to it --------------------------------------

    def upload(self, receipt_id: str, content: str) -> None:
        """The customer uploads the receipt after being asked. Used by T11."""
        self._receipts[receipt_id] = content
        self.faults.genuinely_absent = False

    def recovers(self) -> None:
        """The outage ends."""
        self.faults.unavailable_for_calls = 0


# --------------------------------------------------------------------------
# Payment provider
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class RefundEntry:
    ref: str
    case_id: str
    amount_minor: int
    idempotency_key: str | None


@dataclass
class ProviderFaults:
    """How the refund call misbehaves.

    `mode` applies to the first `for_calls` refund attempts and then clears, so
    a reconciliation followed by a re-issue can succeed.
    """

    mode: str = "none"
    for_calls: int = 1
    retry_after: float = 30.0
    #: The status query can fail on its own. T10 turns this on while the refund
    #: call is timing out, which is the worst real case: the action may have
    #: run and there is currently no way to find out.
    status_unavailable: bool = False

    @classmethod
    def none(cls) -> "ProviderFaults":
        return cls()

    @classmethod
    def timeout_before_commit(cls, calls: int = 1) -> "ProviderFaults":
        return cls(mode="timeout_before_commit", for_calls=calls)

    @classmethod
    def timeout_after_commit(cls, calls: int = 1) -> "ProviderFaults":
        return cls(mode="timeout_after_commit", for_calls=calls)

    @classmethod
    def rate_limited(cls, retry_after: float = 30.0, calls: int = 1) -> "ProviderFaults":
        return cls(mode="rate_limited", for_calls=calls, retry_after=retry_after)

    @classmethod
    def down(cls, calls: int = 99) -> "ProviderFaults":
        return cls(mode="down", for_calls=calls)


class FakePaymentProvider:
    """A refund API with an idempotency key, a ledger and a status query.

    The ledger is the point. It records refunds that actually happened, so a
    test asserts against reality rather than against what the orchestrator
    believed. In the story the orchestrator believed it had refunded nobody.
    """

    def __init__(self, faults: ProviderFaults | None = None) -> None:
        self.faults = faults or ProviderFaults.none()
        self.ledger: list[RefundEntry] = []
        self._by_key: dict[str, str] = {}
        self.refund_calls = 0
        self.status_calls = 0
        self._next_ref = 1

    # -- the write ---------------------------------------------------------

    def refund(
        self,
        case_id: str,
        amount_minor: int,
        idempotency_key: str | None = None,
    ) -> ActionResult:
        """Issue a refund.

        Passing the same `idempotency_key` twice returns the original result
        and writes nothing new. Passing `None` means every call is a new
        refund, which is what the naive orchestrator does and is the mechanism
        behind the triple charge.
        """
        self.refund_calls += 1
        faulting = self.refund_calls <= self.faults.for_calls

        # The key is checked before the fault, because a provider that has
        # already recorded this key has already done the work. Reissuing under
        # the same key during an outage is safe for exactly this reason.
        if idempotency_key is not None and idempotency_key in self._by_key:
            return Executed(self._by_key[idempotency_key])

        if faulting and self.faults.mode == "rate_limited":
            # A 429 from the gateway is rejected before the payment processor
            # sees it, so this really is a non-execution. Not every 429 is:
            # one emitted after partial processing is OutcomeUnknown, and the
            # provider's own documentation is what settles which you have.
            return NotExecuted(
                f"rate limited, retry after {self.faults.retry_after:.0f}s",
                retry_after=self.faults.retry_after,
            )

        if faulting and self.faults.mode == "down":
            # The connection was refused, so the request never left. This is
            # the one network failure on a write that is safe to call a
            # non-execution.
            return NotExecuted("connection refused, request never sent")

        if faulting and self.faults.mode == "timeout_before_commit":
            return OutcomeUnknown(
                "gateway timed out after 30.0s",
                idempotency_key or "no-idempotency-key",
            )

        if faulting and self.faults.mode == "timeout_after_commit":
            self._commit(case_id, amount_minor, idempotency_key)
            # The money moved. The response did not arrive. From the caller's
            # side this is indistinguishable from the case above, which is the
            # entire reason reconciliation exists.
            return OutcomeUnknown(
                "gateway timed out after 30.0s",
                idempotency_key or "no-idempotency-key",
            )

        return Executed(self._commit(case_id, amount_minor, idempotency_key))

    def _commit(
        self, case_id: str, amount_minor: int, idempotency_key: str | None
    ) -> str:
        ref = f"RF-{self._next_ref:04d}"
        self._next_ref += 1
        self.ledger.append(RefundEntry(ref, case_id, amount_minor, idempotency_key))
        if idempotency_key is not None:
            self._by_key[idempotency_key] = ref
        return ref

    # -- the read that makes reconciliation possible -----------------------

    def status(self, idempotency_key: str) -> ReadResult:
        """Did the action under this key execute?

        Three outcomes again. `Unavailable` here is the answer that keeps a
        task in `uncertain_action` rather than resolving it, and a system with
        no status query has only that answer, permanently.
        """
        self.status_calls += 1
        if self.faults.status_unavailable:
            return Unavailable("status endpoint unavailable")
        if idempotency_key in self._by_key:
            return Found(Executed(self._by_key[idempotency_key]))
        return NotFound()

    # -- what the world sees ----------------------------------------------

    def refunds_for(self, case_id: str) -> list[RefundEntry]:
        return [row for row in self.ledger if row.case_id == case_id]

    def total_refunded(self, case_id: str) -> int:
        return sum(row.amount_minor for row in self.refunds_for(case_id))

    def recovers(self) -> None:
        self.faults.for_calls = 0
        self.faults.status_unavailable = False


# --------------------------------------------------------------------------
# Checker
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class Verdict:
    approved: bool
    reason_code: str
    reason: str


class FakeChecker:
    """A second opinion. Deterministic, and wrong in the interesting way.

    It reads the evidence it is handed. When the receipt is absent from that
    evidence it rejects, and it cannot tell whether the receipt is absent
    because nobody uploaded one or because the lookup timed out. Neither can a
    real model checker. That is the point of page nine of the kit.
    """

    def __init__(
        self,
        always_approve: bool = False,
        always_reject_code: str | None = None,
    ) -> None:
        self.always_approve = always_approve
        #: Reject every plan with this reason code, whatever the evidence.
        #: Used by T03, where the interesting thing is the reason repeating
        #: rather than the reason itself.
        self.always_reject_code = always_reject_code
        self.call_count = 0
        self.verdicts: list[Verdict] = []

    def review(self, recommendation: "Recommendation", evidence: dict) -> Verdict:
        self.call_count += 1

        if self.always_reject_code:
            verdict = Verdict(
                False,
                self.always_reject_code,
                f"rejected: {self.always_reject_code}",
            )
        elif self.always_approve:
            verdict = Verdict(True, "approved", "approved by checker")
        elif not evidence.get("receipt"):
            verdict = Verdict(
                False,
                "missing_evidence.receipt",
                "no receipt on file for this case",
            )
        else:
            verdict = Verdict(True, "approved", "evidence supports the refund")

        self.verdicts.append(verdict)
        return verdict


# --------------------------------------------------------------------------
# Model
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class Recommendation:
    action: str
    amount_minor: int
    confidence: float
    rationale: str


class FakeModel:
    """A recommendation engine with no judgement and a rising opinion of itself.

    Asked the same question twice it gives the same answer, more confidently.
    That is not a caricature: re-prompting on rejection without changing the
    input is asking the same question, and confidence is not evidence.
    """

    #: Confidence on the first, second, third and later identical attempts.
    CONFIDENCE_LADDER = (0.72, 0.84, 0.93, 0.97)

    def __init__(self) -> None:
        self.call_count = 0
        self.fingerprints: list[str] = []

    def recommend(self, case: Case, evidence: dict) -> Recommendation:
        self.call_count += 1
        fingerprint = self._fingerprint(case, evidence)
        self.fingerprints.append(fingerprint)

        seen = self.fingerprints.count(fingerprint)
        confidence = self.CONFIDENCE_LADDER[
            min(seen - 1, len(self.CONFIDENCE_LADDER) - 1)
        ]

        if evidence.get("receipt"):
            rationale = "receipt matches the disputed charge"
        else:
            rationale = "customer account history supports the claim"

        return Recommendation("refund", case.amount_minor, confidence, rationale)

    @staticmethod
    def _fingerprint(case: Case, evidence: dict) -> str:
        """What the model was actually asked.

        Two attempts with the same fingerprint are the same question. The
        corrected orchestrator refuses to spend a second attempt on one.
        """
        has_receipt = "receipt" if evidence.get("receipt") else "no-receipt"
        note = evidence.get("instruction", "")
        return f"{case.case_id}|{has_receipt}|{note}"


# --------------------------------------------------------------------------
# Emailer
# --------------------------------------------------------------------------


class FakeEmailer:
    """The confirmation email. A second side effect, so T12 has two to keep apart."""

    def __init__(self, down_for_calls: int = 0) -> None:
        self.down_for_calls = down_for_calls
        self.call_count = 0
        self.sent: list[str] = []
        self._by_key: dict[str, str] = {}

    def send(self, to: str, subject: str, idempotency_key: str) -> ActionResult:
        self.call_count += 1
        if idempotency_key in self._by_key:
            return Executed(self._by_key[idempotency_key])
        if self.call_count <= self.down_for_calls:
            return NotExecuted("mail relay refused the connection")
        ref = f"MAIL-{self.call_count:04d}"
        self._by_key[idempotency_key] = ref
        self.sent.append(f"{to}: {subject}")
        return Executed(ref)
