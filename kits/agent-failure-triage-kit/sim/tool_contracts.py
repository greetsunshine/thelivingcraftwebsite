"""Typed tool results.

The root cause in the story this kit is built around is a tool contract that
could not tell "not found" from "could not look". Both came back as an empty
value, so the caller had one word for two situations that need opposite
responses: ask the user, or retry the tool.

The rule this module exists to enforce: a tool never returns an empty value to
report a failure. It returns a result that says which failure it was.

Reads have three outcomes:

    Found(value)        the thing is there, here it is
    NotFound()          the thing is genuinely absent
    Unavailable(reason) we could not look

Actions that change something outside the system have three outcomes, and the
third one is the one most systems are missing:

    Executed(ref)                     it happened, here is the reference
    NotExecuted(reason)               it definitely did not happen
    OutcomeUnknown(reason, key)       it may or may not have happened

`OutcomeUnknown` is what a timeout on a payment call actually is. Recording it
as a failure is a guess, and it is the guess that refunds a customer three
times.
"""

from __future__ import annotations

from dataclasses import dataclass

# --------------------------------------------------------------------------
# Reads
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class Found:
    """The read succeeded and the thing exists."""

    value: object


@dataclass(frozen=True)
class NotFound:
    """The read succeeded and the thing is genuinely absent.

    This is a fact about the world, not a fact about the network. It is the
    only read outcome that justifies asking a human for the missing thing.
    """


@dataclass(frozen=True)
class Unavailable:
    """The read did not complete. We learned nothing about whether it exists.

    `retry_after` carries the provider's own instruction when it sends one, in
    seconds. Honour it rather than guessing a backoff.
    """

    reason: str
    retry_after: float | None = None


ReadResult = Found | NotFound | Unavailable


# --------------------------------------------------------------------------
# Actions with side effects
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class Executed:
    """The action completed and the provider confirmed it."""

    ref: str


@dataclass(frozen=True)
class NotExecuted:
    """The action definitely did not happen.

    Only return this when the provider said so, or when the request never left
    the process. A timeout is not this.

    `retry_after` carries the provider's instruction when it rejected the call
    with one, such as a rate limit. A definite non-execution is the only write
    outcome that is safe to retry automatically, and only with the same key.
    """

    reason: str
    retry_after: float | None = None


@dataclass(frozen=True)
class OutcomeUnknown:
    """The action may or may not have happened.

    The idempotency key travels with the result because it is the only handle
    on the thing that might have executed. Without it there is nothing to
    reconcile against, and the caller's only options are to do nothing or to
    risk a duplicate.
    """

    reason: str
    idempotency_key: str


ActionResult = Executed | NotExecuted | OutcomeUnknown


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

#: Every result type in this module. Used by the contract test that asserts no
#: fake ever reports a failure as ``None``, ``[]`` or ``""``.
RESULT_TYPES = (
    Found,
    NotFound,
    Unavailable,
    Executed,
    NotExecuted,
    OutcomeUnknown,
)


def is_read_result(value: object) -> bool:
    """True when `value` is one of the three read outcomes."""
    return isinstance(value, (Found, NotFound, Unavailable))


def is_action_result(value: object) -> bool:
    """True when `value` is one of the three action outcomes."""
    return isinstance(value, (Executed, NotExecuted, OutcomeUnknown))


def describe(result: object) -> str:
    """A short label for a run log. Never raises on an unexpected value."""
    match result:
        case Found(value=v):
            return f"Found({v!r})"
        case NotFound():
            return "NotFound"
        case Unavailable(reason=r, retry_after=None):
            return f"Unavailable({r})"
        case Unavailable(reason=r, retry_after=ra):
            return f"Unavailable({r}, retry_after={ra}s)"
        case Executed(ref=ref):
            return f"Executed({ref})"
        case NotExecuted(reason=r, retry_after=None):
            return f"NotExecuted({r})"
        case NotExecuted(reason=r, retry_after=ra):
            return f"NotExecuted({r}, retry_after={ra}s)"
        case OutcomeUnknown(reason=r, idempotency_key=k):
            return f"OutcomeUnknown({r}, key={k})"
        case _:
            return repr(result)
