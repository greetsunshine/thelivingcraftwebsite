"""A virtual clock.

Two of the behaviours in this kit are about time: honouring a provider's
Retry-After, and refusing to start another attempt once the task deadline has
passed. Testing those against the real clock means a test suite that sleeps,
and a suite that sleeps is one people stop running.

`Clock` advances only when something asks it to. `sleep()` moves the hands
forward and returns immediately, so a test can assert that the orchestrator
waited the 30 seconds the provider asked for without anybody waiting 30
seconds.
"""

from __future__ import annotations


class Clock:
    """A clock that only moves when told to.

    Time is a float in seconds from an arbitrary zero. Nothing here depends on
    a wall-clock date, so runs are reproducible.
    """

    def __init__(self, start: float = 0.0) -> None:
        self._now = float(start)
        #: Every sleep this clock has served, in order. The run log and a
        #: couple of tests read it to show what the orchestrator waited for.
        self.sleeps: list[float] = []

    def now(self) -> float:
        return self._now

    def sleep(self, seconds: float) -> None:
        if seconds < 0:
            raise ValueError("cannot sleep for a negative duration")
        self.sleeps.append(seconds)
        self._now += seconds

    def advance(self, seconds: float) -> None:
        """Move time forward without recording it as a sleep.

        Used by tests that need to push past a deadline without claiming the
        orchestrator waited.
        """
        self._now += seconds

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"Clock(now={self._now:.1f}s, sleeps={self.sleeps})"
