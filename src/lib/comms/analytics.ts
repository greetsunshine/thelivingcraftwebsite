// Privacy-conscious events for the follow-ups, into the same first-party
// `events` table the site's beacon writes.
//
// WHAT AN EVENT CARRIES: a type, opaque ids (sequence, message, request), a
// catalogue id, a step number and a deduplication key. WHAT IT NEVER CARRIES:
// a name, an address, a subject line, a body, a token or a provider payload.
// The console's traffic screens read this table and so does the CSV export,
// and neither may become a second place a person's details live.
//
// Best effort, like every other recording call: a failure here loses a count
// and never a send.

import { record } from '../admin/supabase';
import { environment } from '../analytics/context';

export type CommsEventType =
  | 'resource_delivery_sent'
  | 'drip_opened'
  | 'drip_confirmed'
  | 'drip_planned'
  | 'drip_paused'
  | 'drip_sent'
  | 'drip_delivered'
  | 'drip_email_opened'
  | 'drip_cta_clicked'
  | 'drip_unsubscribed'
  | 'drip_bounced'
  | 'drip_complained'
  | 'drip_completed'
  | 'drip_stopped';

export interface CommsEventMeta {
  sequence_id?: string | null;
  message_id?: string | null;
  request_id?: string | null;
  resource_id?: string | null;
  step?: number | null;
  reason?: string | null;
}

/**
 * Record one event. `eventId` is the deduplication key (the events table is
 * unique on it), so a webhook the provider retries counts once.
 */
export async function commsEvent(type: CommsEventType, eventId: string, meta: CommsEventMeta = {}): Promise<void> {
  await record('events', {
    type,
    path: '/',
    referrer_host: null,
    meta: {
      ...meta,
      event_id: eventId,
      env: environment(),
      source: 'comms',
    },
  });
}
