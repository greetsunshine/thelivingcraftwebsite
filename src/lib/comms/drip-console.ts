// What the console shows about the follow-ups: the wordings and their
// approval, and every resource sequence with the person, the resource that
// opened it, what has been sent, the next send and any failure.
//
// Reads only. The writes the console can make (approve, revoke, pause, stop,
// resume, run) go through the same actions the rest of stage 4 uses, in
// /api/craft/admin/comms.

import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '../admin/supabase';
import type { Answer } from '../admin/pipeline-queries';
import type { Identity } from '../admin/staff';
import { can, refusal, type Capability } from '../pipeline/roles';
import { CONFIRMATION_TEMPLATE, DRIP_PACKAGE_VERSION, DRIP_TEMPLATES, UNSUBSCRIBE_CONFIRMATION_TEMPLATE } from './drip-templates';
import { dripView, type DripView } from './drip';
import { renderMessage, templateRow, verifyStored, type PackageTemplate, type StoredTemplate } from './templates';
import { moduleById } from '../../data/resource-routing';
import { roleLabelFor } from '../../data/audience-roles';

const ok = <T>(value: T): Answer<T> => ({ state: 'ok', value, at: new Date().toISOString() });
const unavailable = <T>(reason: string): Answer<T> => ({ state: 'unavailable', reason });
const denied = <T>(capability: Capability): Answer<T> => ({ state: 'denied', reason: refusal(capability) });

const gate = <T>(who: Identity | undefined, capability: Capability): Answer<T> | null =>
  who && can(who.roles, capability) ? null : denied<T>(capability);

const failed = (what: string, error: unknown): string => {
  console.error(`drip console ${what} failed:`, (error as { code?: string })?.code ?? 'unknown');
  return `${what} did not answer.`;
};

/** Every follow-up wording this build knows: the confirmation request, the modules and the unsubscribe confirmation. */
export const ALL_DRIP_TEMPLATES: readonly PackageTemplate[] = [CONFIRMATION_TEMPLATE, ...DRIP_TEMPLATES, UNSUBSCRIBE_CONFIRMATION_TEMPLATE];

export async function loadDripTemplates(): Promise<{ ok: boolean; inserted: number; detail: string }> {
  const client = db();
  if (!client) return { ok: false, inserted: 0, detail: 'Supabase is not configured for this deployment.' };

  const rows = await Promise.all(ALL_DRIP_TEMPLATES.map((t) => templateRow(t)));
  let inserted = 0;
  for (const row of rows) {
    const { error } = await client.from('message_templates').insert(row);
    if (!error) inserted += 1;
    else if ((error as { code?: string }).code !== '23505') return { ok: false, inserted, detail: failed('template store', error) };
  }
  return {
    ok: true,
    inserted,
    detail:
      inserted === 0
        ? `All ${rows.length} follow-up wordings for ${DRIP_PACKAGE_VERSION} were already stored. Nothing was changed.`
        : `${inserted} follow-up wording${inserted === 1 ? '' : 's'} stored for ${DRIP_PACKAGE_VERSION}, with no approval recorded. Approval is a separate, named act.`,
  };
}

export interface DripTemplateStatus {
  key: string;
  moduleId: string | null;
  title: string;
  active: boolean;
  /** Sunil has confirmed the released version (RELEASES in resource-routing.ts). Always true for a non-module wording. */
  released: boolean;
  subject: string;
  body: string;
  version: string;
  approved: boolean;
  stored: boolean;
  note: string;
}

export async function dripTemplateStatuses(who: Identity | undefined): Promise<Answer<DripTemplateStatus[]>> {
  const stop = gate<DripTemplateStatus[]>(who, 'read.dashboard');
  if (stop) return stop;
  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const { data, error } = await client.from('message_templates').select('*').eq('version', DRIP_PACKAGE_VERSION);
  if (error) return unavailable(failed('template store', error));
  const stored = new Map((data ?? []).map((r) => [String((r as StoredTemplate).template_key), r as StoredTemplate]));

  const out: DripTemplateStatus[] = [];
  for (const t of ALL_DRIP_TEMPLATES) {
    const row = stored.get(t.key) ?? null;
    const verdict = row ? await verifyStored(row) : null;
    const mod = moduleById(t.key.replace(/^recommend-/, ''));
    out.push({
      key: t.key,
      moduleId: mod?.id ?? null,
      title:
        mod?.title ??
        (t.key === UNSUBSCRIBE_CONFIRMATION_TEMPLATE.key
          ? 'Unsubscribe confirmation'
          : t.key === CONFIRMATION_TEMPLATE.key
            ? 'Confirmation request (double opt-in)'
            : t.key),
      active: mod ? mod.active : true,
      released: mod ? mod.released : true,
      subject: t.subject,
      body: renderMessage(t).body,
      version: t.version,
      stored: Boolean(row),
      approved: Boolean(row?.approved_at && !row?.revoked_at),
      note: verdict
        ? verdict.sendable
          ? 'Approved, and the stored words match this build.'
          : verdict.reason
        : 'Not loaded into the template store yet.',
    });
  }
  return ok(out);
}

export interface DripSequenceView {
  sequenceId: string;
  startedAt: string;
  state: string;
  view: DripView;
  reason: string | null;
  personName: string | null;
  recipient: string | null;
  role: string | null;
  roleCode: string | null;
  resourceId: string;
  resourceTitle: string;
  stepsSent: number;
  nextSendAt: string | null;
  confirmedAt: string | null;
  sent: { step: number; moduleId: string; title: string }[];
  failures: { messageId: string; state: string; error: string | null; at: string }[];
}

interface SeqRow {
  sequence_id: string;
  person_id: string;
  started_at: string;
  state: string;
  stopped_reason: string | null;
  paused_reason: string | null;
  resource_id: string | null;
  steps_sent: number | null;
  next_send_at: string | null;
  confirmed_at: string | null;
  people: { name: string | null; normalised_email: string | null; role: string | null; role_code: string | null } | null;
}

export async function dripSequenceRows(who: Identity | undefined, limit = 200): Promise<Answer<DripSequenceView[]>> {
  const stop = gate<DripSequenceView[]>(who, 'read.people');
  if (stop) return stop;
  const client: SupabaseClient | null = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const { data, error } = await client
    .from('comms_sequences')
    .select('sequence_id, person_id, started_at, state, stopped_reason, paused_reason, resource_id, steps_sent, next_send_at, confirmed_at, people(name, normalised_email, role, role_code)')
    .eq('route', 'resource')
    .order('started_at', { ascending: false })
    .limit(Math.min(limit, 500));
  if (error) return unavailable(failed('sequence record', error));

  const rows = (data ?? []) as unknown as SeqRow[];
  const ids = rows.map((r) => r.sequence_id);
  if (!ids.length) return ok([]);

  const [sends, failures] = await Promise.all([
    client.from('comms_drip_sends').select('sequence_id, resource_id, step').in('sequence_id', ids),
    client
      .from('comms_messages')
      .select('message_id, sequence_id, state, last_error, updated_at')
      .in('sequence_id', ids)
      .in('state', ['unknown', 'failed', 'bounced', 'complained']),
  ]);
  if (sends.error) return unavailable(failed('send record', sends.error));
  if (failures.error) return unavailable(failed('outbox', failures.error));

  const sentBy = new Map<string, DripSequenceView['sent']>();
  for (const s of sends.data ?? []) {
    const list = sentBy.get(String(s.sequence_id)) ?? [];
    const mod = moduleById(String(s.resource_id));
    list.push({ step: Number(s.step), moduleId: String(s.resource_id), title: mod?.title ?? String(s.resource_id) });
    sentBy.set(String(s.sequence_id), list);
  }
  const failBy = new Map<string, DripSequenceView['failures']>();
  for (const f of failures.data ?? []) {
    const list = failBy.get(String(f.sequence_id)) ?? [];
    list.push({ messageId: String(f.message_id), state: String(f.state), error: f.last_error ? String(f.last_error) : null, at: String(f.updated_at) });
    failBy.set(String(f.sequence_id), list);
  }

  return ok(
    rows.map((r) => {
      const mod = r.resource_id ? moduleById(r.resource_id) : undefined;
      const roleCode = r.people?.role_code ?? null;
      return {
        sequenceId: r.sequence_id,
        startedAt: r.started_at,
        state: r.state,
        view: dripView(r.state, r.stopped_reason),
        reason: r.stopped_reason ?? r.paused_reason ?? null,
        personName: r.people?.name ?? null,
        recipient: r.people?.normalised_email ?? null,
        role: r.people?.role ?? roleLabelFor(roleCode),
        roleCode,
        resourceId: r.resource_id ?? '',
        resourceTitle: mod?.title ?? (r.resource_id ?? 'unknown'),
        stepsSent: Number(r.steps_sent ?? 0),
        nextSendAt: r.next_send_at,
        confirmedAt: r.confirmed_at,
        sent: (sentBy.get(r.sequence_id) ?? []).sort((a, b) => a.step - b.step),
        failures: failBy.get(r.sequence_id) ?? [],
      };
    }),
  );
}
