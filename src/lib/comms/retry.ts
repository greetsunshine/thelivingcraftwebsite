// Bounded retry with exponential back-off. Pure, so the sweep's decision can
// be tested without an outbox.
//
// Attempt 1 fails -> try again in 2 minutes; then 4, 8, 16. Five attempts in
// all (MAX_ATTEMPTS), and a permanent refusal stops at once. A message that
// gives up is 'failed' and in the failure queue; one that has not is back in
// the queue with `next_attempt_at`, which the sweep honours.

export const MAX_ATTEMPTS = 5;

/** 2, 4, 8, 16 minutes. Capped, never unbounded. */
export const backoffMs = (attempt: number): number => Math.min(2 ** Math.max(1, attempt), 16) * 60_000;

export interface RetryPlan {
  giveUp: boolean;
  /** When to try again, or null when giving up. */
  nextAttemptAt: string | null;
}

/**
 * `attempts` is the number of attempts INCLUDING the one that just failed.
 */
export function retryPlan(attempts: number, permanent: boolean, now: Date): RetryPlan {
  const giveUp = permanent || attempts >= MAX_ATTEMPTS;
  return {
    giveUp,
    nextAttemptAt: giveUp ? null : new Date(now.getTime() + backoffMs(attempts)).toISOString(),
  };
}
