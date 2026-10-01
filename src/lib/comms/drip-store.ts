// The DripStore over Supabase. Every method is one or two statements against
// the tables the schema's "RESOURCE FOLLOW-UPS" section describes, and every
// failure degrades the way the rest of stage 4 does: a category to the log,
// never the error text, because every filter value here is a person id or an
// address.

import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../admin/supabase';
import { MARKETING_CONSENT } from '../pipeline/consent';
import type { DripMessage, DripPerson, DripSequence, DripStore, OpenRow } from './drip';

const code = (error: unknown): string => (error as { code?: string })?.code ?? 'unknown';

const log = (what: string, error: unknown) => console.error(`drip store ${what} failed:`, code(error));

class SupabaseDripStore implements DripStore {
  constructor(private readonly client: SupabaseClient) {}

  async due(nowISO: string, limit: number): Promise<DripSequence[]> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .select('sequence_id, person_id, resource_id, request_id, state, next_send_at, steps_sent, anchor_at')
      .eq('route', 'resource')
      .eq('state', 'active')
      .lte('next_send_at', nowISO)
      .order('next_send_at', { ascending: true })
      .limit(limit);
    if (error) {
      log('due read', error);
      return [];
    }
    return (data ?? []).map((r) => ({
      sequenceId: String(r.sequence_id),
      personId: String(r.person_id),
      resourceId: String(r.resource_id ?? ''),
      requestId: r.request_id ? String(r.request_id) : null,
      state: r.state as DripSequence['state'],
      nextSendAt: r.next_send_at ? new Date(String(r.next_send_at)).toISOString() : null,
      stepsSent: Number(r.steps_sent ?? 0),
      anchorAt: new Date(String(r.anchor_at)).toISOString(),
    }));
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

  async stop(sequenceId: string, reason: string, atISO: string): Promise<void> {
    const { error } = await this.client
      .from('comms_sequences')
      .update({ state: 'stopped', stopped_at: atISO, stopped_reason: reason.slice(0, 200), next_send_at: null })
      .eq('sequence_id', sequenceId)
      .in('state', ['active', 'paused']);
    if (error) log('stop', error);
    const { error: cancelErr } = await this.client
      .from('comms_messages')
      .update({ state: 'cancelled', cancelled_at: atISO, cancel_reason: `sequence stopped: ${reason}`.slice(0, 500) })
      .eq('sequence_id', sequenceId)
      .eq('state', 'queued');
    if (cancelErr) log('stop cancel', cancelErr);
  }

  async liveSequenceFor(personId: string): Promise<{ sequenceId: string; route: string; state: string } | null> {
    const { data, error } = await this.client
      .from('comms_sequences')
      .select('sequence_id, route, state')
      .eq('person_id', personId)
      .in('state', ['active', 'paused'])
      .maybeSingle();
    if (error) {
      log('live read', error);
      // Unknown must not open a second sequence. Report one as present.
      return { sequenceId: '', route: 'unknown', state: 'unknown' };
    }
    return data ? { sequenceId: String(data.sequence_id), route: String(data.route), state: String(data.state) } : null;
  }

  async consentState(personId: string): Promise<'granted' | 'withdrawn' | 'none' | 'unknown'> {
    const { data, error } = await this.client
      .from('consents')
      .select('state')
      .eq('person_id', personId)
      .eq('purpose', 'marketing')
      .order('obtained_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      log('consent read', error);
      return 'unknown';
    }
    if (!data) return 'none';
    return data.state === 'granted' ? 'granted' : 'withdrawn';
  }

  async grantConsent(personId: string, source: string, atISO: string): Promise<boolean> {
    const { error } = await this.client.from('consents').insert({
      person_id: personId,
      purpose: 'marketing',
      state: 'granted',
      wording: MARKETING_CONSENT.wording,
      wording_version: MARKETING_CONSENT.version,
      obtained_at: atISO,
      source,
    });
    if (error) {
      log('consent', error);
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
        state: 'active',
        anchor_at: row.anchorAt,
        next_send_at: row.nextSendAt,
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
}

/** The store, or null when Supabase is not configured for this deployment. */
export function supabaseDripStore(): DripStore | null {
  const client = db();
  return client ? new SupabaseDripStore(client) : null;
}
