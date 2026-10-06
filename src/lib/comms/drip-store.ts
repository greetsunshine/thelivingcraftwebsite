// The DripStore over Supabase. Every method is one or two statements against
// the tables the schema's "RESOURCE FOLLOW-UPS" sections describe, and every
// failure degrades the way the rest of stage 4 does: a category to the log,
// never the error text, because every filter value here is a person id or an
// address.
//
// THE FAILURE DIRECTION IS ALWAYS "SEND LESS". A read that fails reports the
// answer that stops or holds: unknown consent, unknown pause signals, an
// unknown outbox state, "already had a sequence". None of them is ever read
// as permission.

import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../admin/supabase';
import { RESOURCE_MARKETING_CONSENT } from '../pipeline/consent';
import { CONFIRMATION_TEMPLATE } from './drip-templates';
import type { ConsentRead, DripMessage, DripPerson, DripSequence, DripStore, OpenRow, StepStatus } from './drip';

const code = (error: unknown): string => (error as { code?: string })?.code ?? 'unknown';

const log = (what: string, error: unknown) => console.error(`drip store ${what} failed:`, code(error));

const LIVE = ['awaiting_confirmation', 'active', 'paused'];

/** An opportunity in one of these stages is closed, and does not pause anything. */
const CLOSED_STAGES = ['unsuitable', 'withdrawn', 'closed'];

const iso = (v: unknown): string | null => (v ? new Date(String(v)).toISOString() : null);

const SEQ_COLUMNS = 'sequence_id, person_id, resource_id, request_id, state, next_send_at, steps_sent, anchor_at, confirmed_at, resumed_at';

const toSequence = (r: Record<string, unknown>): DripSequence => ({
  sequenceId: String(r.sequence_id),
  personId: String(r.person_id),
  resourceId: String(r.resource_id ?? ''),
  requestId: r.request_id ? String(r.request_id) : null,
  state: r.state as DripSequence['state'],
  nextSendAt: iso(r.next_send_at),
  stepsSent: Number(r.steps_sent ?? 0),
  anchorAt: iso(r.anchor_at) ?? new Date(0).toISOString(),
  confirmedAt: iso(r.confirmed_at),
  resumedAt: iso(r.resumed_at),
});

class SupabaseDripStore implements DripStore {
  constructor(private readonly client: SupabaseClient) {}

  async due(nowISO: string, limit: number): Promise<DripSequence[]> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .select(SEQ_COLUMNS)
      .eq('route', 'resource')
      .eq('state', 'active')
      .lte('next_send_at', nowISO)
      .order('next_send_at', { ascending: true })
      .limit(limit);
    if (error) {
      log('due read', error);
      return [];
    }
    return (data ?? []).map((r) => toSequence(r as Record<string, unknown>));
  }

  async lease(sequenceId: string, seenISO: string, untilISO: string): Promise<boolean> {
    // One conditional UPDATE. Postgres compares the two timestamptz values, so
    // the string form we read back and the one we send need not match byte
    // for byte, only instant for instant.
    const { data, error } = await this.client
      .from('comms_sequences')
      .update({ next_send_at: untilISO })
      .eq('sequence_id', sequenceId)
      .eq('state', 'active')
      .eq('next_send_at', seenISO)
      .select('sequence_id');
    if (error) {
      log('lease', error);
      return false;
    }
    return (data ?? []).length === 1;
  }

  async person(personId: string): Promise<DripPerson | null> {
    const { data, error } = await this.client
      .from('people')
      .select('name, normalised_email, role, role_code')
      .eq('person_id', personId)
      .maybeSingle();
    if (error) {
      log('person read', error);
      return null;
    }
    if (!data) return null;
    const first = String(data.name ?? '').trim().split(/\s+/)[0] ?? '';
    return {
      firstName: first || null,
      recipient: String(data.normalised_email),
      role: data.role ? String(data.role) : null,
      roleCode: data.role_code ? String(data.role_code) : null,
    };
  }

  async requestedIds(personId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('resource_requests')
      .select('resource_id')
      .eq('person_id', personId)
      .limit(200);
    if (error) {
      log('requests read', error);
      return [];
    }
    return (data ?? []).map((r) => String(r.resource_id));
  }

  async sentIds(sequenceId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('comms_drip_sends')
      .select('resource_id')
      .eq('sequence_id', sequenceId)
      .limit(200);
    if (error) {
      log('sends read', error);
      // Unknown is not "nothing sent". Report everything as sent so nothing
      // is repeated; the planner then completes the sequence rather than
      // guessing, and the console shows it.
      return ['*'];
    }
    return (data ?? []).map((r) => String(r.resource_id));
  }

  async stepStatus(sequenceId: string): Promise<StepStatus | null> {
    const { data, error } = await this.client
      .from('comms_messages')
      .select('state, sent_at')
      .eq('sequence_id', sequenceId)
      .eq('purpose', 'marketing')
      .limit(500);
    if (error) {
      log('step status read', error);
      return null;
    }
    const rows = data ?? [];
    const pending = rows.some((r) => r.state === 'queued' || r.state === 'sending' || r.state === 'unknown');
    const sent = rows.map((r) => iso(r.sent_at)).filter((x): x is string => Boolean(x)).sort();
    return { pending, lastSentAt: sent.at(-1) ?? null };
  }

  async pauseSignals(args: { personId: string; recipient: string; sinceISO: string; everResumed: boolean }): Promise<string[] | null> {
    const since = args.sinceISO;
    const [replies, mailboxReplies, repliedMessages, bookings, opportunities, payments] = await Promise.all([
      this.client
        .from('comms_events')
        .select('event_id, comms_messages!inner(person_id)')
        .eq('type', 'reply')
        .eq('comms_messages.person_id', args.personId)
        .gte('received_at', since)
        .limit(1),
      // A reply from the reply mailbox feed (inbound.ts), linked to the person.
      this.client
        .from('comms_events')
        .select('event_id')
        .eq('type', 'reply')
        .eq('person_id', args.personId)
        .gte('received_at', since)
        .limit(1),
      this.client
        .from('comms_messages')
        .select('message_id')
        .eq('person_id', args.personId)
        .eq('state', 'replied')
        .gte('updated_at', since)
        .limit(1),
      this.client
        .from('bookings')
        .select('id')
        // Bookings keep the address as typed; ilike compares it without case.
        .ilike('email', args.recipient)
        .in('status', ['confirmed', 'reschedule_requested'])
        .gte('created_at', since)
        .limit(1),
      // An open application or enquiry. Before any reviewed resume it counts
      // whenever it was opened: an applicant somebody is talking to is not a
      // person to nurture. After a resume, only one opened since.
      (() => {
        let q = this.client
          .from('opportunities')
          .select('opportunity_id')
          .eq('person_id', args.personId)
          .not('stage', 'in', `(${CLOSED_STAGES.join(',')})`);
        if (args.everResumed) q = q.gte('created_at', since);
        return q.limit(1);
      })(),
      this.client
        .from('payments')
        .select('payment_id')
        .eq('person_id', args.personId)
        .eq('type', 'receipt')
        .gte('created_at', since)
        .limit(1),
    ]);

    for (const [what, r] of [
      ['reply events', replies],
      ['mailbox replies', mailboxReplies],
      ['replied messages', repliedMessages],
      ['bookings', bookings],
      ['opportunities', opportunities],
      ['payments', payments],
    ] as const) {
      if (r.error) {
        log(`pause signals (${what})`, r.error);
        return null;
      }
    }

    const out: string[] = [];
    if (replies.data?.length || mailboxReplies.data?.length || repliedMessages.data?.length) out.push('the person replied');
    if (bookings.data?.length) out.push('the person booked a call');
    if (opportunities.data?.length) out.push('the person has an open application or enquiry');
    if (payments.data?.length) out.push('a payment was recorded');
    return out;
  }

  async queueMessage(m: DripMessage): Promise<{ messageId: string | null; duplicate: boolean }> {
    const { data, error } = await this.client
      .from('comms_messages')
      .insert({
        idempotency_key: m.idempotencyKey,
        sequence_id: m.sequenceId,
        person_id: m.personId,
        template_key: m.templateKey,
        template_version: m.templateVersion,
        purpose: m.purpose,
        sequence_step: m.step,
        recipient: m.recipient,
        subject: m.subject,
        body: m.body,
        state: 'queued',
        scheduled_for: m.scheduledFor,
      })
      .select('message_id')
      .maybeSingle();

    if (!error) return { messageId: data?.message_id ? String(data.message_id) : null, duplicate: false };
    if (code(error) === '23505') {
      const { data: existing } = await this.client
        .from('comms_messages')
        .select('message_id')
        .eq('idempotency_key', m.idempotencyKey)
        .maybeSingle();
      return { messageId: existing?.message_id ? String(existing.message_id) : null, duplicate: true };
    }
    log('queue', error);
    return { messageId: null, duplicate: false };
  }

  async recordSend(sequenceId: string, moduleId: string, step: number, messageId: string | null): Promise<void> {
    const { error } = await this.client
      .from('comms_drip_sends')
      .insert({ sequence_id: sequenceId, resource_id: moduleId, step, message_id: messageId });
    if (error && code(error) !== '23505') log('send record', error);
  }

  async schedule(sequenceId: string, nextSendAtISO: string, stepsSent: number): Promise<void> {
    const { error } = await this.client
      .from('comms_sequences')
      .update({ next_send_at: nextSendAtISO, steps_sent: stepsSent })
      .eq('sequence_id', sequenceId);
    if (error) log('schedule', error);
  }

  async complete(sequenceId: string, atISO: string): Promise<void> {
    const { error } = await this.client
      .from('comms_sequences')
      .update({ state: 'completed', completed_at: atISO, next_send_at: null })
      .eq('sequence_id', sequenceId)
      .eq('state', 'active');
    if (error) log('complete', error);
  }

  private async cancelQueued(sequenceId: string, reason: string, atISO: string): Promise<void> {
    const { error } = await this.client
      .from('comms_messages')
      .update({ state: 'cancelled', cancelled_at: atISO, cancel_reason: reason.slice(0, 500) })
      .eq('sequence_id', sequenceId)
      .eq('state', 'queued');
    if (error) log('cancel queued', error);
  }

  async stop(sequenceId: string, reason: string, atISO: string): Promise<void> {
    const { error } = await this.client
      .from('comms_sequences')
      .update({ state: 'stopped', stopped_at: atISO, stopped_reason: reason.slice(0, 200), next_send_at: null })
      .eq('sequence_id', sequenceId)
      .in('state', LIVE);
    if (error) log('stop', error);
    await this.cancelQueued(sequenceId, `sequence stopped: ${reason}`, atISO);
  }

  async pause(sequenceId: string, reason: string, atISO: string): Promise<void> {
    const { error } = await this.client
      .from('comms_sequences')
      .update({ state: 'paused', paused_at: atISO, paused_reason: reason.slice(0, 500), next_send_at: null })
      .eq('sequence_id', sequenceId)
      .eq('state', 'active');
    if (error) log('pause', error);
    await this.cancelQueued(sequenceId, `sequence paused: ${reason}`, atISO);
  }

  async liveSequenceFor(personId: string): Promise<{ sequenceId: string; route: string; state: string } | null> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .select('sequence_id, route, state')
      .eq('person_id', personId)
      .in('state', LIVE)
      .maybeSingle();
    if (error) {
      log('live read', error);
      // Unknown must not open a second sequence. Report one as present.
      return { sequenceId: '', route: 'unknown', state: 'unknown' };
    }
    return data ? { sequenceId: String(data.sequence_id), route: String(data.route), state: String(data.state) } : null;
  }

  async hadResourceSequence(personId: string): Promise<boolean | null> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .select('sequence_id')
      .eq('person_id', personId)
      .eq('route', 'resource')
      .limit(1);
    if (error) {
      log('history read', error);
      return null;
    }
    return (data ?? []).length > 0;
  }

  async sequence(sequenceId: string): Promise<DripSequence | null> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .select(SEQ_COLUMNS)
      .eq('sequence_id', sequenceId)
      .eq('route', 'resource')
      .maybeSingle();
    if (error) {
      log('sequence read', error);
      return null;
    }
    return data ? toSequence(data as Record<string, unknown>) : null;
  }

  async consentState(personId: string): Promise<ConsentRead> {
    const { data, error } = await this.client
      .from('consents')
      .select('state, confirmed_at')
      .eq('person_id', personId)
      .eq('purpose', 'marketing')
      .order('obtained_at', { ascending: false })
      .limit(50);
    if (error) {
      log('consent read', error);
      return 'unknown';
    }
    const rows = data ?? [];
    if (!rows.length) return 'none';
    if (rows[0].state !== 'granted') return 'withdrawn';
    // Newest first: a confirmation counts only if no withdrawal came after it.
    for (const r of rows) {
      if (r.state !== 'granted') break;
      if (r.confirmed_at) return 'confirmed';
    }
    return 'granted';
  }

  async grantConsent(personId: string, source: string, atISO: string): Promise<boolean> {
    const { error } = await this.client.from('consents').insert({
      person_id: personId,
      purpose: 'marketing',
      state: 'granted',
      wording: RESOURCE_MARKETING_CONSENT.wording,
      wording_version: RESOURCE_MARKETING_CONSENT.version,
      obtained_at: atISO,
      source,
    });
    if (error) {
      log('consent', error);
      return false;
    }
    return true;
  }

  async confirmConsent(personId: string, atISO: string): Promise<boolean> {
    // The confirming row repeats the words the person ticked. For somebody who
    // ticked before 6 October that is the older wording, and the record must
    // say so rather than claim they saw today's sentence.
    const { data: ticked } = await this.client
      .from('consents')
      .select('wording, wording_version')
      .eq('person_id', personId)
      .eq('purpose', 'marketing')
      .eq('state', 'granted')
      .order('obtained_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await this.client.from('consents').insert({
      person_id: personId,
      purpose: 'marketing',
      state: 'granted',
      wording: ticked?.wording ?? RESOURCE_MARKETING_CONSENT.wording,
      wording_version: ticked?.wording_version ?? RESOURCE_MARKETING_CONSENT.version,
      obtained_at: atISO,
      confirmed_at: atISO,
      source: 'resource-gate:confirmed',
    });
    if (error) {
      log('consent confirm', error);
      return false;
    }
    return true;
  }

  async open(row: OpenRow): Promise<{ sequenceId: string | null; duplicate: boolean }> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .insert({
        person_id: row.personId,
        request_id: row.requestId,
        resource_id: row.resourceId,
        route: 'resource',
        state: 'awaiting_confirmation',
        anchor_at: row.anchorAt,
        next_send_at: null,
      })
      .select('sequence_id')
      .maybeSingle();
    if (error) {
      if (code(error) === '23505') return { sequenceId: null, duplicate: true };
      log('open', error);
      return { sequenceId: null, duplicate: false };
    }
    return { sequenceId: data?.sequence_id ? String(data.sequence_id) : null, duplicate: false };
  }

  async activate(sequenceId: string, confirmedAtISO: string, nextSendAtISO: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .update({ state: 'active', confirmed_at: confirmedAtISO, next_send_at: nextSendAtISO })
      .eq('sequence_id', sequenceId)
      .eq('state', 'awaiting_confirmation')
      .select('sequence_id');
    if (error) {
      log('activate', error);
      return false;
    }
    return (data ?? []).length === 1;
  }

  async awaitingWithoutRequest(limit: number): Promise<{ sequenceId: string; personId: string }[]> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .select('sequence_id, person_id')
      .eq('route', 'resource')
      .eq('state', 'awaiting_confirmation')
      .order('started_at', { ascending: true })
      .limit(500);
    if (error) {
      log('awaiting read', error);
      return [];
    }
    const rows = data ?? [];
    if (!rows.length) return [];
    const { data: asked, error: askedErr } = await this.client
      .from('comms_messages')
      .select('sequence_id')
      .eq('template_key', CONFIRMATION_TEMPLATE.key)
      .in(
        'sequence_id',
        rows.map((r) => String(r.sequence_id)),
      );
    if (askedErr) {
      log('confirmation read', askedErr);
      return [];
    }
    const done = new Set((asked ?? []).map((r) => String(r.sequence_id)));
    return rows
      .filter((r) => !done.has(String(r.sequence_id)))
      .slice(0, limit)
      .map((r) => ({ sequenceId: String(r.sequence_id), personId: String(r.person_id) }));
  }
}

/** The store, or null when Supabase is not configured for this deployment. */
export function supabaseDripStore(): DripStore | null {
  const client = db();
  return client ? new SupabaseDripStore(client) : null;
}
