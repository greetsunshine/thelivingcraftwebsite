/**
 * Netlify Background Function — submission-created-background
 *
 * Automatically invoked by Netlify when a Form submission is received.
 * Naming convention: "<event>-background" = background function with 15-min timeout.
 * Returns 200 immediately; all agent work runs asynchronously in this handler.
 *
 * Flow:
 *   Netlify Form POST
 *     → this function (async, 15-min timeout)
 *     → Concierge: classify lead + write CRM record
 *     → Archivist: confirm record (dedup check, Phase 2 minimal)
 *     → Agent run logged to DB
 */

import type { BackgroundHandler } from '@netlify/functions';
import { runConcierge } from './agents/concierge.js';
import { createAgentRun, finalizeAgentRun } from './lib/db-client.js';
import type { FormSubmission } from './lib/types.js';

export const handler: BackgroundHandler = async (event) => {
  const startedAt = Date.now();

  // Netlify sends form payload as JSON in event.body
  let submission: FormSubmission;
  try {
    const payload = JSON.parse(event.body ?? '{}');
    const data = payload?.payload?.data ?? payload?.data ?? payload;

    submission = {
      name: data.name ?? data.Name ?? '',
      email: data.email ?? data.Email ?? '',
      role: data.role ?? data['role-title'] ?? data.Role ?? undefined,
      company: data.company ?? data.Company ?? undefined,
      service_interest: data.service_interest ?? data['service-interest'] ?? data.interest ?? undefined,
      message: data.message ?? data.Message ?? '',
    };
  } catch (err) {
    console.error('[submission-created-background] Failed to parse payload:', err);
    return;
  }

  if (!submission.email || !submission.name || !submission.message) {
    console.warn('[submission-created-background] Incomplete submission — skipping:', submission);
    return;
  }

  // Create an agent run record
  const runId = await createAgentRun({
    trigger_type: 'form_submission',
    agents_invoked: ['concierge'],
    // No PII in run log — use a hash of email as opaque ref
    input_ref: await hashRef(submission.email),
  });

  try {
    console.log(`[submission-created-background] runId:${runId} — invoking Concierge`);

    const result = await runConcierge(submission);

    if (result.success) {
      console.log(`[submission-created-background] runId:${runId} — Concierge succeeded leadId:${result.leadId} requiresReview:${result.requiresOwnerReview}`);
      await finalizeAgentRun(runId, 'success', { duration_ms: Date.now() - startedAt });
    } else {
      console.error(`[submission-created-background] runId:${runId} — Concierge failed:`, result.error);
      await finalizeAgentRun(runId, 'failed', {
        duration_ms: Date.now() - startedAt,
        error_details: result.error,
      });
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[submission-created-background] runId:${runId} — Unhandled error:`, error);
    await finalizeAgentRun(runId, 'failed', {
      duration_ms: Date.now() - startedAt,
      error_details: error,
    });
  }
};

// Create a short opaque reference from an email for run log (no PII stored)
async function hashRef(email: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 12);
}
