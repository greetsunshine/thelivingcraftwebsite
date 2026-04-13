/**
 * Netlify Function — cal-webhook
 *
 * Receives Cal.com booking webhooks and:
 *   1. Verifies HMAC signature (X-Cal-Signature-256 header).
 *   2. Upserts a `bookings` row.
 *   3. If a matching lead exists (by attendee email), bumps pipeline_stage → 'contacted'
 *      and sets first_contact_booked_at.
 *   4. Logs an agent_runs entry for audit.
 *
 * Unknown bookers (no matching lead) are still recorded — lead_id stays NULL so
 * the admin dashboard can surface "orphan bookings" for manual triage later.
 *
 * Register in Cal.com → Settings → Webhooks → POST to
 *   https://thelivingcraft.ai/.netlify/functions/cal-webhook
 * on BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED.
 * Copy the signing secret into the CAL_WEBHOOK_SECRET Netlify env var.
 */

import type { Handler } from '@netlify/functions';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  findLeadByEmail,
  updateLeadStage,
  setFirstContactBookedAt,
  upsertBooking,
  createAgentRun,
  finalizeAgentRun,
  type BookingStatus,
} from './lib/db-client.js';

type CalTriggerEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_RESCHEDULED'
  | 'BOOKING_CANCELLED';

interface CalWebhookBody {
  triggerEvent: CalTriggerEvent;
  createdAt?: string;
  payload: {
    type?: string;
    title?: string;
    description?: string;
    additionalNotes?: string;
    startTime: string;
    endTime?: string;
    uid: string;
    attendees?: Array<{ email: string; name?: string; timeZone?: string }>;
    organizer?: { email?: string; name?: string };
    metadata?: { videoCallUrl?: string };
    location?: string;
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const rawBody = event.body ?? '';
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[cal-webhook] CAL_WEBHOOK_SECRET not set');
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  // Cal.com sends HMAC-SHA256 hex digest in X-Cal-Signature-256 (no "sha256=" prefix).
  const providedSig =
    event.headers['x-cal-signature-256'] ??
    event.headers['X-Cal-Signature-256'] ??
    '';
  const expectedSig = createHmac('sha256', secret).update(rawBody).digest('hex');

  if (!safeEqual(providedSig, expectedSig)) {
    console.warn('[cal-webhook] Invalid signature');
    return { statusCode: 401, body: 'Invalid signature' };
  }

  let body: CalWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.warn('[cal-webhook] Invalid JSON body:', rawBody.slice(0, 500));
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { triggerEvent, payload } = body;

  // Ping tests and unhandled events: ack so Cal.com marks the webhook healthy.
  // Only the three booking events carry the payload shape we care about.
  const handledEvents: CalTriggerEvent[] = [
    'BOOKING_CREATED',
    'BOOKING_RESCHEDULED',
    'BOOKING_CANCELLED',
  ];
  if (!handledEvents.includes(triggerEvent)) {
    console.log(`[cal-webhook] Acknowledging non-booking event: ${triggerEvent}`);
    return { statusCode: 200, body: JSON.stringify({ ok: true, ignored: triggerEvent }) };
  }

  if (!payload?.uid || !payload?.startTime) {
    console.warn(
      `[cal-webhook] ${triggerEvent} missing payload.uid or startTime. Raw body:`,
      rawBody.slice(0, 1000)
    );
    return { statusCode: 400, body: 'Missing payload fields' };
  }

  const primaryAttendee = payload.attendees?.[0];
  const attendeeEmail = primaryAttendee?.email?.toLowerCase().trim();
  if (!attendeeEmail) {
    console.warn(
      `[cal-webhook] ${triggerEvent} missing attendee email. uid:${payload.uid} Raw body:`,
      rawBody.slice(0, 1000)
    );
    return { statusCode: 400, body: 'Missing attendee email' };
  }

  const status: BookingStatus =
    triggerEvent === 'BOOKING_CANCELLED'
      ? 'cancelled'
      : triggerEvent === 'BOOKING_RESCHEDULED'
        ? 'rescheduled'
        : 'confirmed';

  const runId = await createAgentRun({
    trigger_type: 'form_submission', // reuse closest enum value until we add a 'webhook' variant
    agents_invoked: ['cal-webhook'],
    input_ref: payload.uid,
  });
  const startedAt = Date.now();

  try {
    // Try to match to an existing lead by email
    const lead = await findLeadByEmail(attendeeEmail);

    await upsertBooking({
      lead_id: lead?.id ?? null,
      cal_booking_uid: payload.uid,
      event_type: payload.type,
      scheduled_for: new Date(payload.startTime),
      end_time: payload.endTime ? new Date(payload.endTime) : undefined,
      meeting_url: payload.metadata?.videoCallUrl ?? payload.location,
      attendee_email: attendeeEmail,
      attendee_name: primaryAttendee?.name,
      status,
      notes: payload.additionalNotes,
    });

    // On first CREATE with a matching lead → bump stage + timestamp
    if (lead && triggerEvent === 'BOOKING_CREATED') {
      if (lead.pipeline_stage === 'new_lead') {
        await updateLeadStage(lead.id, 'contacted');
      }
      await setFirstContactBookedAt(lead.id, new Date());
      console.log(
        `[cal-webhook] Lead matched — id:${lead.id} stage:${lead.pipeline_stage}→contacted`
      );
    } else if (!lead) {
      console.log(
        `[cal-webhook] Orphan booking — no lead for ${attendeeEmail} uid:${payload.uid}`
      );
    }

    await finalizeAgentRun(runId, 'success', { duration_ms: Date.now() - startedAt });
    return { statusCode: 200, body: JSON.stringify({ ok: true, booking_uid: payload.uid }) };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[cal-webhook] Error:', error);
    await finalizeAgentRun(runId, 'failed', {
      duration_ms: Date.now() - startedAt,
      error_details: error,
    });
    return { statusCode: 500, body: 'Internal error' };
  }
};

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
