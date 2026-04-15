/**
 * Netlify Scheduled Function — single entry point for all cron jobs.
 *
 * Netlify routes scheduled functions by name; we parse the schedule source
 * from the function config and dispatch to the right handler.
 *
 * Schedules (UTC, see netlify.toml):
 *   daily-brief      — Archivist daily digest (01:30 UTC = 07:00 IST)
 *   weekly-marketer  — Marketer next-best-lead + outreach (Monday 02:00 UTC)
 *   weekly-scribe    — Scribe trend scan (Monday 03:00 UTC)
 */

import type { Handler } from '@netlify/functions';
import { runDailyBrief } from './lib/daily-brief.js';
import { runMarketer } from './agents/marketer.js';
import { runScribeTrendScan, runScribeDraft, runScribeIntelligence } from './agents/scribe.js';
import { createAgentRun, finalizeAgentRun } from './lib/db-client.js';
import { withIdempotency } from './lib/orchestrator.js';
import { BudgetExceededError } from './lib/cost-tracker.js';

type CronJob =
  | 'daily-brief'
  | 'weekly-marketer'
  | 'weekly-scribe'
  | 'weekly-scribe-draft'
  | 'weekly-scribe-intelligence';

export const handler: Handler = async (event) => {
  const job = (event.queryStringParameters?.job ?? 'daily-brief') as CronJob;

  const hourKey = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const idemKey = `cron:${job}:${hourKey}`;

  const result = await withIdempotency(idemKey, async () => {
    const runId = await createAgentRun({
      trigger_type: 'cron',
      agents_invoked: [job],
      input_ref: idemKey,
    });
    const startedAt = Date.now();

    try {
      let summary = '';
      switch (job) {
        case 'daily-brief': {
          const r = await runDailyBrief();
          summary = `Emitted ${r.tasksEmitted} pipeline_review task(s)`;
          break;
        }
        case 'weekly-marketer': {
          const r = await runMarketer();
          summary = r.success ? r.output.slice(0, 300) : `FAILED: ${r.error}`;
          break;
        }
        case 'weekly-scribe': {
          const r = await runScribeTrendScan();
          summary = r.success ? r.output.slice(0, 300) : `FAILED: ${r.error}`;
          break;
        }
        case 'weekly-scribe-draft': {
          const r = await runScribeDraft();
          summary = r.success ? r.output.slice(0, 300) : `FAILED: ${r.error}`;
          break;
        }
        case 'weekly-scribe-intelligence': {
          const r = await runScribeIntelligence();
          summary = r.success ? r.output.slice(0, 300) : `FAILED: ${r.error}`;
          break;
        }
        default:
          throw new Error(`Unknown cron job: ${job}`);
      }

      await finalizeAgentRun(runId, 'success', {
        duration_ms: Date.now() - startedAt,
      });
      console.log(`[cron-dispatcher] ${job} ok — ${summary}`);
      return { statusCode: 200, body: JSON.stringify({ ok: true, job, summary }) };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const isBudget = err instanceof BudgetExceededError;
      console.error(`[cron-dispatcher] ${job} failed:`, error);
      await finalizeAgentRun(runId, 'failed', {
        duration_ms: Date.now() - startedAt,
        error_details: error,
      });
      return {
        statusCode: isBudget ? 200 : 500,
        body: JSON.stringify({ ok: false, job, error, budget_paused: isBudget }),
      };
    }
  });

  return result ?? { statusCode: 200, body: JSON.stringify({ ok: true, job, deduped: true }) };
};
