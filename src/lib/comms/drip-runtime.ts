// The follow-ups wired to the real environment: the config from env, the
// date-aware cohort block from the offer facts, the Supabase store, the
// analytics, and the two entry points the rest of the site calls.
//
// drip.ts is pure and this file is everything it refuses to know.

import { env } from '../admin/env';
import { SITE_ORIGIN } from '../../data/facts';
import { APPLY_URL, applicationsOpen, COHORT_SENTENCE, EVERGREEN_SENTENCE } from '../../data/resource-cohort-copy';
import { commsEvent } from './analytics';
import { verifyConfirmToken } from './confirm';
import { confirmDrip, dripConfig, openResourceDrip, runDripPlanner, type ConfirmOutcome, type DripConfig, type OpenOutcome, type PlannerResult } from './drip';
import { supabaseDripStore } from './drip-store';
import { runDispatchSweep, type SweepResult } from './outbox';

export const dripConfigFromEnv = (): DripConfig => dripConfig(env);

/**
 * The cohort block for {{cohort_invitation}}, decided at queue time.
 *
 * The package: "Use a date-aware evergreen alternative after enrolment
 * closes. Do not keep an October application invitation active after
 * closure." `applicationsOpen()` reads facts.ts, which is the only place the
 * close date lives.
 */
export const cohortInvitationNow = (now: Date = new Date()): string =>
  applicationsOpen(now)
    ? `${COHORT_SENTENCE} Explore the cohort: ${APPLY_URL}`
    : `${EVERGREEN_SENTENCE} Explore the programme: ${SITE_ORIGIN}/`;

/**
 * Open a follow-up sequence for a freshly saved resource request. Called by
 * the request handler after the commit and after the delivery was queued;
 * never for a repeat under the same key.
 */
export async function startDripFromRequest(args: {
  personId: string;
  requestId: string;
  requestResourceId: string;
  consented: boolean;
  now?: Date;
}): Promise<OpenOutcome> {
  const store = supabaseDripStore();
  if (!store) return { opened: false, why: 'Supabase is not configured for this deployment, so no sequence was opened.' };
  const now = args.now ?? new Date();
  const outcome = await openResourceDrip(store, {
    personId: args.personId,
    requestId: args.requestId,
    requestResourceId: args.requestResourceId,
    consented: args.consented,
    now,
    config: dripConfigFromEnv(),
  });
  if (outcome.opened) {
    await commsEvent('drip_opened', `drip-opened:${outcome.sequenceId}`, {
      sequence_id: outcome.sequenceId,
      request_id: args.requestId,
      resource_id: outcome.resourceId,
    });
  }
  return outcome;
}

/**
 * The confirmation page's POST. Verifies the signed link, then confirms.
 *
 * 'gone' covers a bad token, an expired one, somebody else's, and a stopped
 * sequence alike. The page shows one sentence for all of them.
 */
export async function confirmFromToken(token: string | null, now: Date = new Date()): Promise<ConfirmOutcome> {
  const claim = await verifyConfirmToken(token, now.getTime());
  if (!claim) return 'gone';
  const store = supabaseDripStore();
  if (!store) return 'gone';
  const outcome = await confirmDrip(store, { ...claim, now, config: dripConfigFromEnv() });
  if (outcome === 'confirmed') {
    await commsEvent('drip_confirmed', `drip-confirmed:${claim.sequenceId}`, { sequence_id: claim.sequenceId });
  }
  return outcome;
}

export interface WorkerResult {
  ranAt: string;
  planner: PlannerResult | null;
  sweep: SweepResult;
  note: string;
}

/**
 * One worker tick: plan every due follow-up, then sweep the outbox. Safe to
 * run from several places at once; see the header of drip.ts.
 */
export async function runCommsWorker(now: Date = new Date()): Promise<WorkerResult> {
  const store = supabaseDripStore();
  let planner: PlannerResult | null = null;
  if (store) {
    planner = await runDripPlanner(store, {
      now,
      config: dripConfigFromEnv(),
      cohortInvitation: cohortInvitationNow(now),
      onEvent: async (e) => {
        if (e.type === 'planned') {
          await commsEvent('drip_planned', `drip-planned:${e.sequenceId}:${e.step}`, {
            sequence_id: e.sequenceId,
            resource_id: e.moduleId,
            step: e.step,
          });
        } else if (e.type === 'completed') {
          await commsEvent('drip_completed', `drip-completed:${e.sequenceId}`, { sequence_id: e.sequenceId });
        } else if (e.type === 'paused') {
          await commsEvent('drip_paused', `drip-paused:${e.sequenceId}:${now.toISOString()}`, { sequence_id: e.sequenceId });
        } else {
          await commsEvent('drip_stopped', `drip-stopped:${e.sequenceId}:${now.toISOString()}`, { sequence_id: e.sequenceId });
        }
      },
    });
  }
  const sweep = await runDispatchSweep({ now });

  // One structured line per tick. Counts and ids only.
  console.log(
    JSON.stringify({
      at: now.toISOString(),
      comms_worker: {
        planner: planner
          ? {
              considered: planner.considered,
              planned: planner.planned,
              completed: planner.completed,
              paused: planner.paused,
              skipped: planner.skipped,
              confirmations: planner.confirmationsQueued,
            }
          : 'no store',
        sweep: {
          due: sweep.dueConsidered,
          sent: sweep.sent,
          failed: sweep.failed,
          held: sweep.held,
          cancelled: sweep.cancelled,
          wouldSend: sweep.wouldSend,
          dispatch: sweep.dispatchReason,
        },
      },
    }),
  );

  return {
    ranAt: now.toISOString(),
    planner,
    sweep,
    note: store ? 'Planned, then swept.' : 'Supabase is not configured for this deployment; nothing was planned.',
  };
}
