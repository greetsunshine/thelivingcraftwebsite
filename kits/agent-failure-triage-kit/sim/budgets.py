"""The per-task budget.

Retry amplification is what happens when two layers each retry three times and
neither knows about the other. The tool client tries three times, the
orchestrator sees one failure and tries three times, and nine calls reach the
provider. Nobody wrote "nine" anywhere.

The fix is not smaller numbers at each layer. It is one budget per task that
every layer draws from. An inner retry spends the same allowance as an outer
one, so the total is whatever the task said it was.

`TaskBudget` is deliberately a mutable object passed by reference. The tool
clients in `fakes.py` and the orchestrator hold the same instance. That sharing
IS the mechanism, and test T08 exists to prove it.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .clock import Clock


@dataclass(frozen=True)
class BudgetVerdict:
    """The answer to "may I spend another attempt?"."""

    ok: bool
    reason: str | None = None


@dataclass
class TaskBudget:
    """Attempts, wall-clock time and cost for one task, shared by every layer.

    Defaults here are starting points for the simulation, not universal
    numbers. `policies/retry_budgets.yaml` carries the tuned-per-tool-type
    version and says the same thing at more length.
    """

    #: Total attempts across every layer, not per layer.
    max_attempts: int = 6
    #: Wall-clock seconds from `started_at` before the task is out of time.
    deadline_seconds: float = 120.0
    #: An abstract unit. One model generation is expensive, one read is not.
    max_cost_units: int = 20

    started_at: float = 0.0
    attempts_used: int = 0
    cost_used: int = 0

    #: Every spend, for the run log: (label, attempts_after, cost_after).
    spend_log: list[tuple[str, int, int]] = field(default_factory=list)

    def start(self, clock: Clock) -> None:
        self.started_at = clock.now()

    # -- reading the budget ------------------------------------------------

    def attempts_left(self) -> int:
        return max(0, self.max_attempts - self.attempts_used)

    def time_left(self, clock: Clock) -> float:
        elapsed = clock.now() - self.started_at
        return max(0.0, self.deadline_seconds - elapsed)

    def cost_left(self) -> int:
        return max(0, self.max_cost_units - self.cost_used)

    def can_wait(self, seconds: float, clock: Clock) -> bool:
        """True when waiting `seconds` still leaves the task inside its deadline.

        This is what turns a provider's Retry-After into a decision rather than
        an instruction. A 30 second wait against 12 seconds of remaining budget
        is not a retry, it is an escalation.
        """
        return seconds <= self.time_left(clock)

    # -- spending it -------------------------------------------------------

    def consume(self, label: str, clock: Clock, cost: int = 1) -> BudgetVerdict:
        """Take one attempt from the shared budget, or explain the refusal.

        Checks time and cost as well as attempts, because a task can run out of
        any of the three and the rejection record should say which.
        """
        if self.attempts_used >= self.max_attempts:
            return BudgetVerdict(
                False,
                f"task attempt budget exhausted ({self.attempts_used}/{self.max_attempts})",
            )
        if self.time_left(clock) <= 0:
            return BudgetVerdict(
                False, f"task deadline of {self.deadline_seconds:.0f}s passed"
            )
        if self.cost_used + cost > self.max_cost_units:
            return BudgetVerdict(
                False,
                f"task cost budget exhausted ({self.cost_used}/{self.max_cost_units})",
            )

        self.attempts_used += 1
        self.cost_used += cost
        self.spend_log.append((label, self.attempts_used, self.cost_used))
        return BudgetVerdict(True)

    def snapshot(self, clock: Clock) -> dict:
        """The shape the rejection record's `retry` object wants."""
        return {
            "attempts_used": self.attempts_used,
            "max_attempts": self.max_attempts,
            "deadline_at": self.started_at + self.deadline_seconds,
            "seconds_remaining": round(self.time_left(clock), 1),
            "cost_used": self.cost_used,
            "max_cost_units": self.max_cost_units,
        }
