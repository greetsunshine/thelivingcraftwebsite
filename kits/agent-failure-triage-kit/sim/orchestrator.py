"""The corrected orchestrator.

It is not more cautious than the naive one. It is more specific. The same
failures happen; they are classified before anything is retried, and what gets
retried is chosen by the class.

Six behaviours, one per test group:

  1. Every rejection and every failure emits a rejection record.
  2. Retries are bounded by a budget, and something must change between
     attempts. An identical input is not a second attempt.
  3. One budget per task, shared by every layer, so retries cannot multiply.
  4. Any side-effecting action is reconciled before it is re-issued, and
     re-issued only under the same idempotency key.
  5. Unresolved work goes to an escalation queue with a named owner.
  6. A checker's approval is advisory. Real state is inspected before any
     external action, and state wins.

Run it with `make fixed`.
"""

from __future__ import annotations

import random

from .budgets import TaskBudget
from .clock import Clock
from .policy import Policy, default_policy
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
from .records import MissingItem, Outcome, SideEffect, build_record, timestamp_at
from .triage import (
    FailureClass,
    NextStep,
    Signal,
    Triage,
    classify,
    confirmed_executed,
    confirmed_not_executed,
)
from .tool_contracts import (
    Executed,
    Found,
    NotFound,
    OutcomeUnknown,
    Unavailable,
    describe,
)

#: Every number the orchestrator retries on comes from
#: policies/retry_budgets.yaml, through sim/policy.py. These module-level names
#: exist so tests and the run logs can refer to them; nothing is declared here.
POLICY = default_policy()
DEFAULT_OWNER = POLICY.owner
DEFAULT_QUEUE = POLICY.queue


class BudgetedToolClient:
    """A retrying client that spends the task's budget, not its own.

    This is the only difference between it and `NaiveToolClient`, and it is the
    whole of test T08. A client with a private `max_retries` multiplies against
    whatever the caller does. A client holding the task's budget cannot: the
    third inner attempt and the first outer attempt draw on the same counter.
    """

    def __init__(
        self, budget: TaskBudget, clock: Clock, rng: random.Random, policy: Policy
    ) -> None:
        self.budget = budget
        self.clock = clock
        self.rng = rng
        self.policy = policy
        self.calls = 0

    def attempt(self, label: str, fn, *args, cost: int = 1, **kwargs):
        """Make one budgeted call, or return the budget's refusal."""
        verdict = self.budget.consume(label, self.clock, cost=cost)
        if not verdict.ok:
            return None, verdict
        self.calls += 1
        return fn(*args, **kwargs), verdict

    def backoff(self, attempt_number: int, retry_after: float | None = None) -> float:
        """Exponential backoff with full jitter, or the provider's instruction.

        A provider that sends Retry-After has told you when it will answer.
        Guessing a shorter interval adds load to a service that is already
        asking for less. Jitter matters because without it every caller that
        failed at the same moment retries at the same moment.
        """
        if retry_after is not None and self.policy.honour_retry_after:
            return retry_after
        ceiling = min(
            self.policy.backoff_max,
            self.policy.backoff_base * (2 ** (attempt_number - 1)),
        )
        return self.rng.uniform(0, ceiling)


class Orchestrator:
    def __init__(
        self,
        store: FakeDocumentStore,
        provider: FakePaymentProvider,
        checker: FakeChecker,
        model: FakeModel,
        emailer: FakeEmailer | None = None,
        clock: Clock | None = None,
        budget: TaskBudget | None = None,
        *,
        owner: str | None = None,
        on_ask=None,
        seed: int = 7,
        policy: Policy | None = None,
    ) -> None:
        self.store = store
        self.provider = provider
        self.checker = checker
        self.model = model
        self.emailer = emailer or FakeEmailer()
        self.clock = clock or Clock()
        self.policy = policy or POLICY
        self.budget = budget or TaskBudget.from_policy(self.policy)
        self.owner = owner or self.policy.owner
        #: Called when the design decides to ask the requester for something.
        #: Returns True when new evidence arrived. In production this is a
        #: message and a wait; here it is a function so a test can say what the
        #: customer did.
        self.on_ask = on_ask
        self.rng = random.Random(seed)
        self.client = BudgetedToolClient(self.budget, self.clock, self.rng, self.policy)
        self._attempt = 0
        self._decision_attempt = 0
        self._asked = False
        self._checker_rejections: list[str] = []

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------

    def idempotency_key(self, case: Case, action: str = "refund") -> str:
        """Stable for the life of the task, which is what makes re-issue safe.

        A new key on every attempt is a new action. That is the single line of
        code behind the third refund in the story.
        """
        return f"task-{case.case_id}:{action}"

    def run(self, case: Case, pre_approved: bool = False) -> Outcome:
        outcome = Outcome(task_id=f"task-{case.case_id}")
        self.budget.start(self.clock)
        self._say(outcome, f"task {outcome.task_id} opened for {case.customer}")
        self._say(
            outcome,
            f"budget: {self.budget.max_attempts} attempts, "
            f"{self.budget.deadline_seconds:.0f}s, "
            f"{self.budget.max_cost_units} cost units, shared by every layer",
        )

        if not pre_approved:
            if not self._decide(case, outcome):
                return outcome
        else:
            self._say(outcome, "a human has already approved this refund")

        self._pay(case, outcome)
        return outcome

    # ------------------------------------------------------------------
    # Evidence, then a decision
    # ------------------------------------------------------------------

    def _decide(self, case: Case, outcome: Outcome) -> bool:
        evidence = self._gather(case, outcome)
        if evidence is None:
            return False

        input_changed = True
        while True:
            self._decision_attempt += 1
            verdict_ok, evidence, input_changed = self._propose(
                case, evidence, outcome, input_changed
            )
            if verdict_ok is True:
                return True
            if verdict_ok is False:
                return False
            # None means: something changed, go round once more.

    def _gather(self, case: Case, outcome: Outcome) -> dict | None:
        """Read the receipt, retrying only what a temporary failure justifies."""
        tool_attempt = 0

        while True:
            tool_attempt += 1
            self._attempt += 1
            result, budget_verdict = self.client.attempt(
                "receipt-read", self.store.get_receipt, case.receipt_id
            )
            if result is None:
                # The budget refused before the call was made.
                self._say(outcome, f"  read refused: {budget_verdict.reason}")
                self._reject(
                    outcome,
                    case,
                    stage="evidence.receipt",
                    signal=Signal(
                        stage="evidence.receipt",
                        tool_result=Unavailable(budget_verdict.reason or "budget spent"),
                        evidence_required=True,
                        owner=self.owner,
                        budget_exhausted=True,
                        missing=["receipt"],
                    ),
                    detected_by=("rule", "task-budget"),
                )
                return None

            self._say(outcome, f"  receipt lookup returned {describe(result)}")

            if isinstance(result, Found):
                return {"receipt": result.value}

            signal = Signal(
                stage="evidence.receipt",
                tool_result=result,
                side_effecting=False,
                evidence_required=True,
                owner=self.owner,
                budget_exhausted=self.budget.attempts_left() == 0,
                missing=["receipt"],
            )
            if tool_attempt >= self.policy.read_max_attempts:
                # The read's own cap, from the policy. The task budget may have
                # attempts left for other steps; this step has used its share.
                signal.budget_exhausted = True
            triage = classify(signal)
            self._say(
                outcome,
                f"  triage: {triage.failure_class} at question "
                f"{triage.decided_at_question} -> {triage.next_step}",
            )

            if triage.next_step is NextStep.RETRY_TOOL:
                wait = self.client.backoff(
                    tool_attempt, getattr(result, "retry_after", None)
                )
                if not self.budget.can_wait(wait, self.clock):
                    self._say(outcome, f"  a {wait:.1f}s wait exceeds the deadline")
                    signal.budget_exhausted = True
                    triage = classify(signal)
                else:
                    self._reject(
                        outcome,
                        case,
                        stage="evidence.receipt",
                        signal=signal,
                        triage=triage,
                        detected_by=("tool", "document-store"),
                        what_changes=(
                            f"the read is retried after {wait:.1f}s; the document "
                            "store may answer. Nothing else about the task changes."
                        ),
                    )
                    self._say(outcome, f"  retrying the read in {wait:.1f}s")
                    self.clock.sleep(wait)
                    continue

            if triage.next_step is NextStep.ASK_USER:
                if self._ask(case, outcome, triage, signal):
                    continue
                return None

            self._reject(
                outcome, case, stage="evidence.receipt", signal=signal, triage=triage,
                detected_by=("tool", "document-store"),
            )
            self._finish(outcome, triage)
            return None

    def _ask(self, case: Case, outcome: Outcome, triage, signal: Signal) -> bool:
        """Ask the requester once, and only for something confirmed absent."""
        if self._asked:
            self._say(outcome, "  already asked once; not asking again")
            escalated = dict(
                queue=self.policy.queue,
                reason="asked the requester once and the evidence did not arrive",
                respond_by_hours=self._hours(8),
            )
            self._reject(
                outcome, case, stage="evidence.receipt", signal=signal,
                detected_by=("rule", "evidence-policy"), escalation=escalated,
                triage=None,
            )
            self._finish(outcome, classify(signal))
            return False

        self._asked = True
        self._reject(
            outcome, case, stage="evidence.receipt", signal=signal, triage=triage,
            detected_by=("tool", "document-store"),
            missing=[
                MissingItem(
                    "receipt",
                    "refund.evidence-policy",
                    "ask the requester to upload the receipt for this charge",
                )
            ],
        )
        outcome.asked_user = True
        self._say(outcome, "  asking the requester to upload the receipt")

        if self.on_ask and self.on_ask(case, self.store):
            self._say(outcome, "  the requester supplied the receipt")
            return True

        self._say(outcome, "  the requester did not supply the receipt")
        self._escalate(
            outcome,
            "the requester was asked once and did not supply the receipt",
        )
        return False

    def _propose(self, case: Case, evidence: dict, outcome: Outcome, input_changed: bool):
        """One generate-and-check cycle. Returns (approved|None, evidence, changed)."""
        if self._decision_attempt > self.policy.model_max_attempts:
            # The policy's cap on model generations, on top of the shared
            # budget and on top of the "input must change" rule. Three guards
            # for one step is not redundancy: each one catches a different way
            # of asking the same question again.
            self._say(
                outcome,
                f"  model generation cap of {self.policy.model_max_attempts} reached",
            )
            self._escalate(outcome, "model generation cap reached with no approval")
            return False, evidence, False

        if not input_changed:
            # The guard that the naive version is missing. Asking the same
            # question again costs a model call and returns the same kind of
            # answer.
            self._say(outcome, "  input unchanged since the last attempt; not re-prompting")
            signal = Signal(
                stage="decision.recommend",
                checker_rejection=self._checker_rejections[-1],
                input_changed=False,
                owner=self.owner,
            )
            triage = classify(signal)
            self._reject(
                outcome, case, stage="decision.recommend", signal=signal, triage=triage,
                detected_by=("rule", "attempt-policy"),
            )
            self._finish(outcome, triage)
            return False, evidence, False

        result, budget_verdict = self.client.attempt(
            "model-generate", self.model.recommend, case, evidence,
            cost=self.policy.cost_model,
        )
        if result is None:
            self._say(outcome, f"  generation refused: {budget_verdict.reason}")
            self._escalate(outcome, budget_verdict.reason or "budget spent")
            return False, evidence, False

        self._say(
            outcome,
            f"  decision attempt {self._decision_attempt}: model recommends "
            f"{result.action} "
            f"at confidence {result.confidence:.2f}",
        )

        verdict = self.checker.review(result, evidence)
        if verdict.approved:
            self._say(outcome, "  checker approved (advisory)")
            return True, evidence, False

        self._say(outcome, f"  checker rejected: {verdict.reason}")
        repeated = verdict.reason_code in self._checker_rejections
        self._checker_rejections.append(verdict.reason_code)

        if repeated:
            # Two identical rejections mean the last change did not address the
            # objection. A third attempt is the same attempt.
            self._say(outcome, "  the same rejection twice; not attempting again")
            signal = Signal(
                stage="decision.check",
                checker_rejection=verdict.reason_code,
                input_changed=False,
                owner=self.owner,
            )
            triage = classify(signal)
            self._reject(
                outcome, case, stage="decision.check", signal=signal, triage=triage,
                detected_by=("model", "refund-checker"),
                escalation=dict(
                    queue=self.policy.queue,
                    reason=f"rejected twice for {verdict.reason_code} with no new evidence",
                    respond_by_hours=self._hours(8),
                ),
            )
            self._finish(outcome, triage)
            return False, evidence, False

        signal = Signal(
            stage="decision.check",
            checker_rejection=verdict.reason_code,
            input_changed=False,
            owner=self.owner,
            missing=(
                [verdict.reason_code.split(".", 1)[1]]
                if "." in verdict.reason_code
                else []
            ),
        )
        triage = classify(signal)
        self._say(
            outcome,
            f"  triage: {triage.failure_class} at question "
            f"{triage.decided_at_question} -> {triage.next_step}",
        )

        if triage.next_step is NextStep.ASK_USER or (
            triage.failure_class is FailureClass.MISSING_EVIDENCE and not self._asked
        ):
            ask_signal = Signal(
                stage="decision.check",
                tool_result=NotFound(),
                evidence_required=True,
                owner=self.owner,
                missing=["receipt"],
            )
            if self._ask(case, outcome, classify(ask_signal), ask_signal):
                fresh = self._gather(case, outcome)
                if fresh is None:
                    return False, evidence, False
                return None, fresh, True
            return False, evidence, False

        self._reject(
            outcome, case, stage="decision.check", signal=signal, triage=triage,
            detected_by=("model", "refund-checker"),
        )
        self._finish(outcome, triage)
        return False, evidence, False

    # ------------------------------------------------------------------
    # Payment: reconcile first, always
    # ------------------------------------------------------------------

    def _pay(self, case: Case, outcome: Outcome) -> None:
        key = self.idempotency_key(case)

        # Behaviour 6. The checker's approval is a second opinion about the
        # plan. It is not a reading of the world. Before an irreversible
        # external call, ask the world.
        prior = self.provider.status(key)
        self._say(outcome, f"  pre-flight state check returned {describe(prior)}")

        if confirmed_executed(prior):
            self._say(outcome, "  this refund has already been issued; blocking")
            signal = Signal(
                stage="action.refund",
                side_effecting=True,
                reconciled_state="executed",
                owner=self.owner,
            )
            triage = classify(signal)
            self._reject(
                outcome, case, stage="action.refund", signal=signal, triage=triage,
                detected_by=("tool", "payment-provider"),
                side_effects=[
                    SideEffect("refund", "payment-provider", key, "executed")
                ],
                escalation=dict(
                    queue=self.policy.queue,
                    reason="the approved refund is already present in provider state",
                    respond_by_hours=self._hours(4),
                ),
            )
            self._finish(outcome, triage)
            return

        attempt_number = 0
        while True:
            attempt_number += 1
            result, budget_verdict = self.client.attempt(
                "refund", self.provider.refund, case.case_id, case.amount_minor,
                idempotency_key=key,
            )
            if result is None:
                self._say(outcome, f"  refund refused: {budget_verdict.reason}")
                self._escalate(outcome, budget_verdict.reason or "budget spent", key=key)
                return

            self._say(outcome, f"  refund returned {describe(result)}")

            if isinstance(result, Executed):
                outcome.resolved = True
                outcome.refund_ref = result.ref
                self._say(outcome, f"  refund complete, reference {result.ref}")
                self._send_confirmation(case, outcome)
                return

            if isinstance(result, OutcomeUnknown):
                if not self._reconcile_and_continue(case, outcome, key, result):
                    return
                continue

            # NotExecuted. The one write outcome that is safe to re-issue, and
            # only under the same key.
            signal = Signal(
                stage="action.refund",
                tool_result=result,
                side_effecting=True,
                reconciled_state="not_executed",
                owner=self.owner,
                budget_exhausted=self.budget.attempts_left() == 0,
            )
            triage = classify(signal)
            self._say(
                outcome,
                f"  triage: {triage.failure_class} at question "
                f"{triage.decided_at_question} -> {triage.next_step}",
            )

            wait = self.client.backoff(attempt_number, result.retry_after)
            if triage.next_step is not NextStep.RETRY_TOOL or not self.budget.can_wait(
                wait, self.clock
            ):
                if triage.next_step is NextStep.RETRY_TOOL:
                    self._say(
                        outcome,
                        f"  waiting {wait:.0f}s would pass the task deadline "
                        f"({self.budget.time_left(self.clock):.0f}s left)",
                    )
                    signal.budget_exhausted = True
                    triage = classify(signal)
                self._reject(
                    outcome, case, stage="action.refund", signal=signal, triage=triage,
                    detected_by=("tool", "payment-provider"),
                    side_effects=[
                        SideEffect("refund", "payment-provider", key, "not_executed")
                    ],
                    escalation=dict(
                        queue=self.policy.queue,
                        reason=result.reason,
                        respond_by_hours=self._hours(4),
                    ),
                )
                self._finish(outcome, triage)
                return

            self._reject(
                outcome, case, stage="action.refund", signal=signal, triage=triage,
                detected_by=("tool", "payment-provider"),
                side_effects=[
                    SideEffect("refund", "payment-provider", key, "not_executed")
                ],
                what_changes=(
                    f"the provider asked for {wait:.0f}s; the call is re-issued "
                    "under the same idempotency key, so a duplicate is impossible"
                ),
            )
            self._say(outcome, f"  waiting {wait:.0f}s as instructed, then re-issuing")
            self.clock.sleep(wait)

    def _reconcile_and_continue(
        self, case: Case, outcome: Outcome, key: str, result: OutcomeUnknown
    ) -> bool:
        """Behaviour 4. Establish what happened before deciding anything.

        The status query is not charged to the attempt budget. Reconciliation
        is the step that makes a retry safe, and a design that makes it
        expensive is a design that discourages it.
        """
        signal = Signal(
            stage="action.refund",
            tool_result=result,
            side_effecting=True,
            reconciled_state=None,
            owner=self.owner,
        )
        triage = classify(signal)
        self._say(
            outcome,
            f"  triage: {triage.failure_class} at question "
            f"{triage.decided_at_question} -> {triage.next_step}",
        )
        self._reject(
            outcome, case, stage="action.refund", signal=signal, triage=triage,
            detected_by=("tool", "payment-provider"),
            side_effects=[SideEffect("refund", "payment-provider", key, "unknown")],
            what_changes=(
                "provider state is queried by idempotency key, so the next "
                "decision is made on a confirmed outcome rather than a guess"
            ),
        )

        status = self.provider.status(key)
        self._say(outcome, f"  reconciliation returned {describe(status)}")

        if confirmed_executed(status):
            ref = status.value.ref
            self._say(outcome, f"  the refund did execute, reference {ref}")
            outcome.resolved = True
            outcome.refund_ref = ref
            self._send_confirmation(case, outcome)
            return False

        if confirmed_not_executed(status):
            self._say(
                outcome,
                "  the refund did not execute; re-issuing under the same key",
            )
            return True

        # The status query itself failed. This does not decay into a temporary
        # failure. Nothing is known, so nothing may be re-issued.
        self._say(outcome, "  state could not be read; the outcome stays unknown")
        unresolved = Signal(
            stage="action.refund",
            tool_result=result,
            side_effecting=True,
            reconciled_state=None,
            owner=self.owner,
        )
        # Triage would send this back round to RECONCILE, which has just been
        # tried. The class does not change - the outcome really is unknown -
        # but the next step does, because there is nothing left to query.
        blocked = Triage(
            FailureClass.UNCERTAIN_ACTION,
            NextStep.ESCALATE if self.owner else NextStep.STOP,
            "the action may have executed and provider state cannot be read",
            decided_at_question=1,
            prohibited_actions=(
                "re-issue the action",
                "report the refund as failed",
                "report the refund as complete",
            ),
            permitted_next_actions=(
                "escalate with the idempotency key so a human can reconcile",
            ),
        )
        self._reject(
            outcome, case, stage="action.refund", signal=unresolved, triage=blocked,
            detected_by=("rule", "reconciliation"),
            side_effects=[SideEffect("refund", "payment-provider", key, "unknown")],
            escalation=dict(
                queue=self.policy.queue,
                reason=(
                    "refund outcome unknown and the provider status endpoint is "
                    "unavailable; reconcile by idempotency key before any re-issue"
                ),
                respond_by_hours=self._hours(1),
            ),
        )
        self._finish(outcome, blocked)
        return False

    def _send_confirmation(self, case: Case, outcome: Outcome) -> None:
        """Behaviour: a failed follow-up step is retried on its own.

        The refund is done. Nothing about a failing mail relay is a reason to
        touch the payment provider again, and test T12 is there because that is
        exactly what a shared retry wrapper would do.
        """
        key = self.idempotency_key(case, "confirmation-email")
        attempt_number = 0

        while True:
            attempt_number += 1
            result, budget_verdict = self.client.attempt(
                "confirmation-email", self.emailer.send, case.customer,
                "Your refund", key,
            )
            if result is None:
                self._say(outcome, f"  email refused: {budget_verdict.reason}")
                self._escalate(
                    outcome,
                    "the refund succeeded and the confirmation email did not",
                    key=key,
                )
                return

            self._say(outcome, f"  confirmation email returned {describe(result)}")
            if isinstance(result, Executed):
                return

            signal = Signal(
                stage="action.confirmation-email",
                tool_result=result,
                side_effecting=True,
                reconciled_state="not_executed",
                owner=self.owner,
                budget_exhausted=self.budget.attempts_left() == 0,
            )
            triage = classify(signal)
            wait = self.client.backoff(attempt_number, getattr(result, "retry_after", None))

            if triage.next_step is not NextStep.RETRY_TOOL or not self.budget.can_wait(
                wait, self.clock
            ):
                signal.budget_exhausted = True
                self._reject(
                    outcome, case, stage="action.confirmation-email", signal=signal,
                    triage=classify(signal),
                    detected_by=("tool", "mail-relay"),
                    side_effects=[
                        SideEffect("confirmation-email", "mail-relay", key, "not_executed")
                    ],
                    escalation=dict(
                        queue=self.policy.queue,
                        reason="refund issued; the customer has not been told",
                        respond_by_hours=self._hours(8),
                    ),
                )
                self._say(
                    outcome,
                    "  the email is escalated on its own; the refund is not touched",
                )
                outcome.escalated = True
                return

            self._reject(
                outcome, case, stage="action.confirmation-email", signal=signal,
                triage=triage, detected_by=("tool", "mail-relay"),
                side_effects=[
                    SideEffect("confirmation-email", "mail-relay", key, "not_executed")
                ],
                what_changes=(
                    "only the email is re-sent, under its own idempotency key. "
                    "The refund is complete and is not re-issued."
                ),
            )
            self.clock.sleep(wait)

    # ------------------------------------------------------------------
    # Bookkeeping
    # ------------------------------------------------------------------

    def _reject(
        self, outcome: Outcome, case: Case, *, stage: str, signal: Signal,
        detected_by: tuple[str, str], triage=None, what_changes: str | None = None,
        missing: list[MissingItem] | None = None,
        side_effects: list[SideEffect] | None = None,
        escalation: dict | None = None,
    ) -> None:
        triage = triage or classify(signal)

        # Two things the schema refuses a record without, filled in here so
        # no branch can forget them. An escalate with no queue is work sent
        # nowhere. A missing_evidence record that names nothing is a rejection
        # nobody can act on.
        if triage.next_step is NextStep.ESCALATE and escalation is None:
            escalation = self._escalation(
                triage.reason, self._hours(4, str(triage.failure_class))
            )
        if triage.failure_class is FailureClass.MISSING_EVIDENCE and not missing:
            missing = [self._missing_item(name) for name in signal.missing] or [
                self._missing_item("receipt")
            ]
        if escalation is not None and "respond_by" not in escalation:
            # The policy's per-class response time wins over whatever the
            # call site suggested, so the YAML is the one place to tune it.
            hours = self._hours(
                escalation.pop("respond_by_hours", 4), str(triage.failure_class)
            )
            escalation["respond_by"] = timestamp_at(self.clock.now() + hours * 3600)

        record = build_record(
            task_id=outcome.task_id,
            attempt=len(outcome.records) + 1,
            at_seconds=self.clock.now(),
            stage=stage,
            triage=triage,
            detected_by_type=detected_by[0],
            detected_by_name=detected_by[1],
            budget=self.budget.snapshot(self.clock),
            owner=self.owner,
            what_changes_next_attempt=what_changes,
            missing=missing,
            side_effects=side_effects,
            escalation=escalation,
        )
        outcome.records.append(record)

    def _escalation(self, reason: str, respond_by_hours: float | None = None) -> dict:
        """An escalation always names a queue and a time somebody must answer by."""
        hours = respond_by_hours if respond_by_hours is not None else self._hours(4)
        return {
            "queue": self.policy.queue,
            "reason": reason,
            "respond_by": timestamp_at(self.clock.now() + hours * 3600),
        }

    def _hours(self, fallback: float, failure_class: str | None = None) -> float:
        """Response time for an escalation, from the policy, by class."""
        if failure_class and failure_class in self.policy.respond_by_hours:
            return self.policy.respond_by_hours[failure_class]
        return fallback

    @staticmethod
    def _missing_item(name: str) -> MissingItem:
        return MissingItem(
            name,
            "refund.evidence-policy",
            f"ask the requester to supply the {name} for this charge",
        )

    def _finish(self, outcome: Outcome, triage) -> None:
        if triage.next_step is NextStep.ESCALATE:
            outcome.escalated = True
            outcome.escalation_queue.append(
                {
                    "queue": self.policy.queue,
                    "owner": self.owner,
                    "reason": triage.reason,
                    "failure_class": str(triage.failure_class),
                    "record": outcome.last_record(),
                }
            )
        elif triage.next_step is NextStep.STOP:
            outcome.stopped = True

    def _escalate(self, outcome: Outcome, reason: str, key: str | None = None) -> None:
        outcome.escalated = True
        outcome.escalation_queue.append(
            {
                "queue": self.policy.queue,
                "owner": self.owner,
                "reason": reason,
                "failure_class": str(FailureClass.TEMPORARY_FAILURE),
                "idempotency_key": key,
                "record": outcome.last_record(),
            }
        )

    def _say(self, outcome: Outcome, line: str) -> None:
        outcome.log.append(f"[{self.clock.now():6.1f}s] {line}")


# --------------------------------------------------------------------------
# The same story, corrected
# --------------------------------------------------------------------------


def run_story() -> tuple[Outcome, Outcome, FakePaymentProvider]:
    case = Case()

    print("=" * 74)
    print("CORRECTED ORCHESTRATOR - the same faults, classified before retrying")
    print("=" * 74)
    print()
    print("Friday. The receipt lookup times out. The receipt is there.")
    print()

    store = FakeDocumentStore(
        receipts={case.receipt_id: "receipt-image-bytes"},
        faults=DocStoreFaults.slow_timeout(calls=1),
    )
    provider = FakePaymentProvider(ProviderFaults.timeout_after_commit(calls=1))
    checker = FakeChecker()
    model = FakeModel()
    emailer = FakeEmailer()
    clock = Clock()

    orch = Orchestrator(
        store, provider, checker, model, emailer, clock=clock,
        budget=TaskBudget(max_attempts=8, deadline_seconds=120.0, max_cost_units=30),
    )
    friday = orch.run(case)
    friday.print_log()

    print()
    print(f"  receipt lookups attempted : {store.call_count}")
    print(f"  model generations         : {model.call_count}")
    print(f"  refund calls              : {provider.refund_calls}")
    print(f"  refunds in the ledger     : {len(provider.ledger)}")
    print(f"  total refunded            : Rs {provider.total_refunded(case.case_id) / 100:,.2f}")
    print(f"  rejection records written : {len(friday.records)}")
    print()
    print("-" * 74)
    print()
    print("The same task, run again. The refund is already in provider state.")
    print()

    store2 = FakeDocumentStore(receipts={case.receipt_id: "receipt-image-bytes"})
    orch2 = Orchestrator(
        store2, provider, FakeChecker(always_approve=True), FakeModel(), FakeEmailer(),
        clock=Clock(start=600.0),
        budget=TaskBudget(max_attempts=8, deadline_seconds=120.0, max_cost_units=30),
    )
    repeat = orch2.run(case, pre_approved=True)
    repeat.print_log()

    print()
    print(f"  refunds in the ledger  : {len(provider.ledger)}")
    print(f"  total refunded         : Rs {provider.total_refunded(case.case_id) / 100:,.2f}")
    print()
    print("Same faults. Same fakes. One refund, and a record for every rejection.")
    print("=" * 74)

    return friday, repeat, provider


if __name__ == "__main__":  # pragma: no cover
    run_story()
