"""The triage tree.

Four questions, asked in a fixed order. The order is the whole design.

    1. Could an action with side effects already have executed?
    2. Is required evidence genuinely absent?
    3. Is a dependency temporarily unavailable?
    4. Otherwise: can a named owner resolve it?

Side effects are asked about first because misclassifying an uncertain action
as a temporary failure is the expensive mistake. A temporary failure invites a
bounded retry, and retrying something that already ran is how one refund
becomes three. Getting the order wrong the other way is merely slow: treating a
temporary failure as uncertain sends work to a human who did not need to see
it.

Two vocabularies live here and they are different fields:

    failure_class   what happened
    next_step       what to do about it

`escalate` and `stop` are next steps, not classes. A task can be escalated
because evidence is missing and the customer is not answering, or because an
action's outcome cannot be established. The class says which, and the record
that reaches the human is more useful for it.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum

from .tool_contracts import (
    Executed,
    Found,
    NotExecuted,
    NotFound,
    OutcomeUnknown,
    Unavailable,
)


class FailureClass(StrEnum):
    """What happened. These five values are the schema's `failure_class` enum."""

    MISSING_EVIDENCE = "missing_evidence"
    TEMPORARY_FAILURE = "temporary_failure"
    UNCERTAIN_ACTION = "uncertain_action"
    #: State and verdict disagree. The checker approved an action the ledger
    #: says already happened, or policy forbids what the plan requires.
    POLICY_CONFLICT = "policy_conflict"
    #: No justified path remains, and no owner can create one.
    UNRECOVERABLE = "unrecoverable"


class NextStep(StrEnum):
    """What to do. These five values are the schema's `next_step` enum."""

    ASK_USER = "ask_user"
    RETRY_TOOL = "retry_tool"
    RECONCILE = "reconcile"
    ESCALATE = "escalate"
    STOP = "stop"


@dataclass
class Signal:
    """Everything triage is allowed to look at.

    Deliberately small. If a field is not here, triage cannot use it, which is
    what keeps the classifier from quietly growing a fourth question that
    nobody wrote down.
    """

    #: Where in the workflow this happened. Goes straight into the record.
    stage: str
    #: The typed result the tool returned, or None when the failure came from
    #: somewhere other than a tool, such as a checker rejection.
    tool_result: object = None
    #: True when the call that produced `tool_result` can change something
    #: outside this system.
    side_effecting: bool = False
    #: Set once reconciliation has run: "executed", "not_executed", or None
    #: while the outcome is still unknown.
    reconciled_state: str | None = None
    #: The checker's reason code, when a checker rejected the plan.
    checker_rejection: str | None = None
    #: Whether anything about the next attempt's input would differ from the
    #: last one. An identical input is not another attempt, it is the same
    #: attempt at extra cost.
    input_changed: bool = False
    #: True when the evidence this stage needs is required rather than
    #: optional. An absent optional document is not a failure.
    evidence_required: bool = True
    #: Who can resolve this if the machine cannot. `None` means nobody is
    #: accountable, which is the only honest reason to stop.
    owner: str | None = None
    #: What the budget allows right now.
    budget_exhausted: bool = False
    #: Names of the evidence items this stage could not obtain.
    missing: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class Triage:
    """The verdict, and the reason it was reached."""

    failure_class: FailureClass
    next_step: NextStep
    reason: str
    #: The question in the tree that decided it, 1 to 4.
    decided_at_question: int
    prohibited_actions: tuple[str, ...] = ()
    permitted_next_actions: tuple[str, ...] = ()


def classify(signal: Signal) -> Triage:
    """Run the four questions in order and return the first answer that fits."""

    # ------------------------------------------------------------------
    # Question 1. Could an action with side effects already have executed?
    # ------------------------------------------------------------------
    #
    # Asked first, and asked before anything about the network. A timeout on a
    # write is not information about the write. It is the absence of
    # information, and the only safe reading is that the action may have run.
    #
    # It has two halves, and they end in different places. A CONFIRMED prior
    # execution is not uncertainty, it is a disagreement between the plan and
    # the world, and the world wins. An UNCONFIRMED one is uncertainty, and the
    # answer to uncertainty is to go and find out.
    if signal.side_effecting and signal.reconciled_state == "executed":
        return Triage(
            FailureClass.POLICY_CONFLICT,
            NextStep.ESCALATE if signal.owner else NextStep.STOP,
            "the action is confirmed to have executed already, and the plan "
            "asks for it again",
            decided_at_question=1,
            prohibited_actions=(
                "execute the action",
                "issue a second action for the same task",
            ),
            permitted_next_actions=(
                "escalate with the idempotency key and the confirmed state",
                "close the task against the existing reference",
            ),
        )

    if _may_have_executed(signal):
        return Triage(
            FailureClass.UNCERTAIN_ACTION,
            NextStep.RECONCILE,
            _uncertain_reason(signal),
            decided_at_question=1,
            prohibited_actions=(
                "re-issue the action",
                "retry the action with a new idempotency key",
                "report failure to the customer",
            ),
            permitted_next_actions=(
                "query provider state by idempotency key",
                "escalate with the idempotency key if state cannot be read",
            ),
        )

    # An action whose outcome reconciliation could not establish stays
    # uncertain. It does not decay into a temporary failure because the status
    # endpoint happened to be the thing that was down.
    if signal.side_effecting and signal.reconciled_state is None and _is_write_failure(
        signal
    ):
        return Triage(
            FailureClass.UNCERTAIN_ACTION,
            NextStep.ESCALATE if signal.owner else NextStep.STOP,
            "outcome could not be established and state could not be read",
            decided_at_question=1,
            prohibited_actions=("re-issue the action",),
            permitted_next_actions=("escalate with the idempotency key",),
        )

    # ------------------------------------------------------------------
    # Question 2. Is required evidence genuinely absent?
    # ------------------------------------------------------------------
    #
    # `NotFound` is a completed read. It is a fact about the world, and it is
    # the only read outcome that justifies asking a person for something.
    if isinstance(signal.tool_result, NotFound) and signal.evidence_required:
        return Triage(
            FailureClass.MISSING_EVIDENCE,
            NextStep.ASK_USER,
            f"required evidence is absent: {', '.join(signal.missing) or signal.stage}",
            decided_at_question=2,
            prohibited_actions=(
                "regenerate the recommendation with the same inputs",
                "retry the read",
            ),
            permitted_next_actions=("ask the requester for the missing item once",),
        )

    # A checker that rejected for missing evidence is reporting the same
    # situation from one step further along. The answer is still to obtain the
    # evidence, never to ask the model again.
    if signal.checker_rejection and signal.checker_rejection.startswith(
        "missing_evidence"
    ):
        if signal.input_changed:
            return Triage(
                FailureClass.MISSING_EVIDENCE,
                NextStep.RETRY_TOOL,
                "evidence has changed since the rejection, so the plan can be rebuilt",
                decided_at_question=2,
                permitted_next_actions=("rebuild the plan with the new evidence",),
            )
        return Triage(
            FailureClass.MISSING_EVIDENCE,
            NextStep.ESCALATE if signal.owner else NextStep.STOP,
            "checker rejected for missing evidence and nothing has changed",
            decided_at_question=2,
            prohibited_actions=("re-prompt the model with an unchanged input",),
            permitted_next_actions=("escalate to the named owner",),
        )

    # ------------------------------------------------------------------
    # Question 3. Is a dependency temporarily unavailable?
    # ------------------------------------------------------------------
    #
    # Reached only once questions 1 and 2 have said no. What is retried here is
    # the TOOL, never the model: the model did not fail, and asking it again
    # with the same input returns the same kind of answer at extra cost.
    if isinstance(signal.tool_result, Unavailable):
        if signal.budget_exhausted:
            return Triage(
                FailureClass.TEMPORARY_FAILURE,
                NextStep.ESCALATE if signal.owner else NextStep.STOP,
                f"dependency unavailable and the retry budget is spent: "
                f"{signal.tool_result.reason}",
                decided_at_question=3,
                prohibited_actions=("retry the tool again",),
                permitted_next_actions=("escalate to the named owner",),
            )
        return Triage(
            FailureClass.TEMPORARY_FAILURE,
            NextStep.RETRY_TOOL,
            f"dependency did not answer: {signal.tool_result.reason}",
            decided_at_question=3,
            prohibited_actions=(
                "record the read as empty",
                "ask the user for something we have not established is missing",
                "regenerate the recommendation",
            ),
            permitted_next_actions=("retry the same read within the task budget",),
        )

    # A definite non-execution with a Retry-After is the one write the system
    # may re-issue, and only under the same key.
    if isinstance(signal.tool_result, NotExecuted):
        if signal.budget_exhausted:
            return Triage(
                FailureClass.TEMPORARY_FAILURE,
                NextStep.ESCALATE if signal.owner else NextStep.STOP,
                f"provider refused the call and the budget is spent: "
                f"{signal.tool_result.reason}",
                decided_at_question=3,
                prohibited_actions=("retry the action again",),
                permitted_next_actions=("escalate to the named owner",),
            )
        return Triage(
            FailureClass.TEMPORARY_FAILURE,
            NextStep.RETRY_TOOL,
            f"provider refused the call and confirmed it did not run: "
            f"{signal.tool_result.reason}",
            decided_at_question=3,
            prohibited_actions=("re-issue under a new idempotency key",),
            permitted_next_actions=("re-issue under the same idempotency key",),
        )

    # ------------------------------------------------------------------
    # Question 4. Can a named owner resolve it?
    # ------------------------------------------------------------------
    #
    # Everything that reaches here is either a disagreement between the plan
    # and the real state, or a situation with no justified next move. The
    # difference between escalate and stop is one thing: whether a person is
    # accountable for the next step. "Stop" with no owner is honest. "Escalate"
    # to a queue nobody reads is not.
    if signal.checker_rejection == "state_conflict":
        return Triage(
            FailureClass.POLICY_CONFLICT,
            NextStep.ESCALATE if signal.owner else NextStep.STOP,
            "confirmed state contradicts the approved plan",
            decided_at_question=4,
            prohibited_actions=("execute the approved action",),
            permitted_next_actions=("escalate with both the verdict and the state",),
        )

    if signal.owner:
        return Triage(
            FailureClass.UNRECOVERABLE,
            NextStep.ESCALATE,
            "no automatic path remains and an owner is accountable",
            decided_at_question=4,
            permitted_next_actions=("escalate to the named owner",),
        )

    return Triage(
        FailureClass.UNRECOVERABLE,
        NextStep.STOP,
        "no automatic path remains and no owner is accountable",
        decided_at_question=4,
        prohibited_actions=("continue attempting",),
    )


# --------------------------------------------------------------------------
# Question 1, in full
# --------------------------------------------------------------------------


def _may_have_executed(signal: Signal) -> bool:
    """True when an action with side effects might already have run.

    Two ways to be here:

      * the tool said so, with `OutcomeUnknown`, and nothing has confirmed the
        outcome since
      * a side-effecting call ended without a confirmed outcome at all

    A confirmed prior execution is handled above this, because it is not
    uncertainty. If a call can change the world and nothing has established
    what it did, the honest class is uncertain.
    """
    if isinstance(signal.tool_result, OutcomeUnknown):
        return signal.reconciled_state is None

    return False


def _uncertain_reason(signal: Signal) -> str:
    result = signal.tool_result
    if isinstance(result, OutcomeUnknown):
        return f"the action may have executed: {result.reason}"
    return "the action may have executed and nothing has confirmed otherwise"


def _is_write_failure(signal: Signal) -> bool:
    """True when a side-effecting call ended without a confirmed outcome."""
    return isinstance(signal.tool_result, (OutcomeUnknown, Unavailable))


# --------------------------------------------------------------------------
# Convenience for the run logs
# --------------------------------------------------------------------------


def confirmed_executed(status: object) -> bool:
    """Read a provider status query into a yes.

    Only `Found(Executed(...))` counts. `Unavailable` is not a no, and treating
    it as one is what test T10 exists to catch.
    """
    return isinstance(status, Found) and isinstance(status.value, Executed)


def confirmed_not_executed(status: object) -> bool:
    """Read a provider status query into a no.

    Only a completed read that found nothing counts. This is the mirror of the
    rule above, and both matter: a system that cannot say "confirmed no" will
    never safely re-issue anything.
    """
    return isinstance(status, NotFound)
