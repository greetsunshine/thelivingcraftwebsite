// Every write the communications screen can make.
//
// ───────────────────────────────────────────────────────────────────────────
// AUTHORISATION HAPPENS HERE, AND IT HAPPENS BEFORE THE DATABASE IS ASKED FOR.
// ───────────────────────────────────────────────────────────────────────────
//
// Copied deliberately from src/pages/api/craft/admin/pipeline.ts, including the
// ordering, because the reason that file gives for it applies exactly:
//
//   With the capability check second, a database outage turns every refusal
//   into a 503. Whether somebody is ALLOWED to do a thing has nothing to do
//   with whether the store is up, and a permission system that stops answering
//   when the database does is a permission system nobody can test.
//
// Today `supabase/schema.sql` has not been applied, so the store answers
// nothing at all — which makes this ordering the difference between a testable
// 403 and an untestable 503 on every action on this screen.
//
// THE THREE CAPABILITIES, AND WHY THEY ARE THREE.
//
//   approve.template  — Sunil alone. Approving a wording is putting the
//                       practice's words in front of somebody under his name,
//                       and the package reserves it: "exact-version approval".
//   manage.sequence   — the operator's day job: pause, resume, stop, cancel,
//                       reconcile, suppress. None of it puts new words out.
//   send.approved     — running the dispatch sweep. Operator and Sunil hold it;
//                       finance, programme and maintainer do not.
//
// WHAT THIS ENDPOINT WILL NOT DO
//   * Send anything. `deliver()` in lib/comms/outbox.ts is the only seam and it
//     is switched off — see `dispatchSwitch()` for the eight preconditions.
//   * Edit a wording. `message_templates` content columns are frozen by a
//     trigger; a new form of words is a new version row.
//   * Lift a suppression. `comms_suppressions` refuses UPDATE and DELETE, and
//     there is deliberately no action here that tries.
//   * Restart a stopped sequence. Resume matches on 'paused' and nothing else.
//   * Accept an actor name from the request. The actor is the session.

import type { APIRoute } from 'astro';
import { can, refusal, type Capability } from '../../../../lib/pipeline/roles';
import { db } from '../../../../lib/admin/supabase';
import type { Identity } from '../../../../lib/admin/staff';
import {
  actorOf,
  approveTemplate,
  cancelMessage,
  loadPackageTemplates,
  pauseSequence,
  reconcileMessage,
  recordSuppression,
  resumeSequence,
  revokeTemplate,
  runDispatchSweep,
  stopSequence,
} from '../../../../lib/comms/outbox';
import { PACKAGE_VERSION } from '../../../../lib/comms/templates';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/**
 * Which capability each action needs, in one table.
 *
 * An action missing from this table is refused as unknown — the correct
 * default. A new action added to the switch without an entry here cannot be
 * called at all, rather than being callable by anybody.
 */
const CAPABILITY_FOR_ACTION: Record<string, Capability> = {
  'templates.load': 'approve.template',
  'template.approve': 'approve.template',
  'template.revoke': 'approve.template',
  'sequence.pause': 'manage.sequence',
  'sequence.resume': 'manage.sequence',
  'sequence.stop': 'manage.sequence',
  'message.cancel': 'manage.sequence',
  'message.reconcile': 'manage.sequence',
  'suppression.add': 'manage.sequence',
  'dispatch.run': 'send.approved',
};

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  return t ? t.slice(0, max) : null;
};

export const POST: APIRoute = async ({ request, locals }) => {
  const who = locals.admin as Identity | undefined;
  if (!who) return json({ ok: false, error: 'Not signed in.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Could not read that request.' }, 400);
  }

  const action = String(body.action ?? '');

  // ── AUTHORISATION, BEFORE ANYTHING ELSE ──────────────────────────────────
  const required = CAPABILITY_FOR_ACTION[action];
  if (!required) return json({ ok: false, error: 'Unknown action.' }, 400);
  if (!can(who.roles, required)) return json({ ok: false, error: refusal(required) }, 403);

  const actor = actorOf(who);

  /**
   * Best-effort audit. Never fails the write it describes.
   *
   * `record_id` is a uuid column, so a template key goes in `new_value` rather
   * than being coerced into it. Nothing here ever writes a free-text reason
   * containing a recipient's address except the suppression action, where the
   * address IS the record and an audit that omitted it would be useless.
   */
  const audit = async (recordType: string, recordId: string | null, reason: string, value?: unknown) => {
    try {
      const client = db();
      if (!client) return;
      await client.from('audit_log').insert({
        record_type: recordType,
        record_id: recordId,
        actor,
        new_value: value ?? null,
        occurred_at: new Date().toISOString(),
        reason: reason.slice(0, 1000),
      });
    } catch (err) {
      console.error('comms audit write failed:', err instanceof Error ? err.name : 'unknown');
    }
  };

  try {
    switch (action) {
      // ---- the twelve wordings --------------------------------------------
      case 'templates.load': {
        const result = await loadPackageTemplates();
        if (result.ok && result.inserted > 0) {
          await audit('message_template', null, `Loaded ${result.inserted} package wordings, unapproved.`, {
            version: PACKAGE_VERSION,
            inserted: result.inserted,
          });
        }
        return json({ ok: result.ok, detail: result.detail, inserted: result.inserted }, result.ok ? 200 : 503);
      }

      case 'template.approve': {
        const key = clean(body.templateKey, 80);
        const version = clean(body.version, 80) ?? PACKAGE_VERSION;
        if (!key) return json({ ok: false, error: 'Which wording?' }, 400);

        const result = await approveTemplate(key, version, actor);
        if (result.ok) {
          await audit('message_template', null, `Approved ${key} at ${version}.`, { key, version });
        }
        return json({ ok: result.ok, detail: result.detail, error: result.ok ? undefined : result.detail }, result.ok ? 200 : 409);
      }

      case 'template.revoke': {
        const key = clean(body.templateKey, 80);
        const version = clean(body.version, 80) ?? PACKAGE_VERSION;
        const reason = clean(body.reason, 500);
        if (!key) return json({ ok: false, error: 'Which wording?' }, 400);
        if (!reason) {
          // Withdrawing an approval is a decision somebody will have to explain
          // later. An unexplained revocation reads as a mistake.
          return json({ ok: false, error: 'Withdrawing approval needs a reason.' }, 400);
        }

        const result = await revokeTemplate(key, version, actor, reason);
        if (result.ok) await audit('message_template', null, `Withdrew approval for ${key}: ${reason}`, { key, version });
        return json({ ok: result.ok, detail: result.detail, error: result.ok ? undefined : result.detail }, result.ok ? 200 : 503);
      }

      // ---- sequences -------------------------------------------------------
      case 'sequence.pause': {
        const id = clean(body.sequenceId, 60);
        const reason = clean(body.reason, 500);
        if (!id) return json({ ok: false, error: 'Which sequence?' }, 400);
        if (!reason) return json({ ok: false, error: 'A pause needs a reason — it is what the resume is reviewed against.' }, 400);

        const result = await pauseSequence(id, reason);
        if (result.ok) await audit('comms_sequence', id, `Paused: ${reason}`);
        return json({ ok: result.ok, detail: result.detail, error: result.ok ? undefined : result.detail }, result.ok ? 200 : 503);
      }

      case 'sequence.resume': {
        const id = clean(body.sequenceId, 60);
        if (!id) return json({ ok: false, error: 'Which sequence?' }, 400);

        // Resume re-runs the eligibility check and cancels everything whose
        // moment has passed. Both are in resumeSequence(); neither is optional
        // and neither is decided here.
        const result = await resumeSequence(id, actor);
        if (result.ok) {
          await audit('comms_sequence', id, `Resumed after review. ${result.cancelled ?? 0} missed message(s) cancelled rather than sent.`);
        }
        return json(
          { ok: result.ok, detail: result.detail, cancelled: result.cancelled, error: result.ok ? undefined : result.detail },
          result.ok ? 200 : 409,
        );
      }

      case 'sequence.stop': {
        const id = clean(body.sequenceId, 60);
        const reason = clean(body.reason, 500);
        if (!id) return json({ ok: false, error: 'Which sequence?' }, 400);
        if (!reason) return json({ ok: false, error: 'Stopping needs a reason. It is permanent.' }, 400);

        const result = await stopSequence(id, reason);
        if (result.ok) await audit('comms_sequence', id, `Stopped: ${reason}`);
        return json({ ok: result.ok, detail: result.detail, error: result.ok ? undefined : result.detail }, result.ok ? 200 : 503);
      }

      // ---- single messages -------------------------------------------------
      case 'message.cancel': {
        const id = clean(body.messageId, 60);
        const reason = clean(body.reason, 500) ?? 'cancelled by an operator';
        if (!id) return json({ ok: false, error: 'Which message?' }, 400);

        const result = await cancelMessage(id, reason);
        if (result.ok) await audit('comms_message', id, `Cancelled: ${reason}`);
        return json({ ok: result.ok, detail: result.detail, error: result.ok ? undefined : result.detail }, result.ok ? 200 : 409);
      }

      case 'message.reconcile': {
        const id = clean(body.messageId, 60);
        if (!id) return json({ ok: false, error: 'Which message?' }, 400);

        const result = await reconcileMessage(id, actor);
        await audit('comms_message', id, `Reconciliation attempted: ${result.detail}`);
        return json({ ok: result.ok, detail: result.detail, error: result.ok ? undefined : result.detail }, result.ok ? 200 : 409);
      }

      // ---- suppression -----------------------------------------------------
      case 'suppression.add': {
        const email = clean(body.email, 200)?.toLowerCase();
        const reason = clean(body.reason, 20);
        const scope = clean(body.scope, 20);
        const detail = clean(body.detail, 300);

        if (!email || !email.includes('@')) return json({ ok: false, error: 'That is not an address.' }, 400);
        if (reason !== 'unsubscribe' && reason !== 'hard_bounce' && reason !== 'complaint' && reason !== 'manual') {
          return json({ ok: false, error: 'A suppression is an unsubscribe, a hard bounce, a complaint or a manual entry.' }, 400);
        }
        if (scope !== 'marketing' && scope !== 'all') {
          return json({ ok: false, error: 'Scope is marketing or all.' }, 400);
        }

        const result = await recordSuppression({ email, reason, scope, source: actor, detail });
        if (result.ok) {
          // The address is the record here, so it belongs in the audit entry.
          // This is the one action on this endpoint where that is true.
          await audit('comms_suppression', null, `Suppressed at scope ${scope} (${reason}).`, { email, scope, reason });
        }
        return json({ ok: result.ok, detail: result.detail, error: result.ok ? undefined : result.detail }, result.ok ? 200 : 503);
      }

      // ---- the sweep -------------------------------------------------------
      case 'dispatch.run': {
        // With dispatch off this is a REHEARSAL that still does real work: it
        // runs the second eligibility check on everything due, cancels what is
        // no longer eligible, stops and pauses the sequences that ask for it,
        // and reports what would have gone. Nothing is handed to a provider.
        const result = await runDispatchSweep();
        await audit(
          'comms_message',
          null,
          `Dispatch sweep: ${result.dueConsidered} due, ${result.wouldSend} would send, ${result.cancelled} cancelled, ${result.held} held, ${result.sent} sent.`,
        );
        return json({ ok: result.ok, result }, result.ok ? 200 : 503);
      }

      default:
        return json({ ok: false, error: 'Unknown action.' }, 400);
    }
  } catch (err) {
    // Never echo the caught error: PostgREST puts filter values in the URL and
    // every filter in this module is a person id or an email address.
    console.error('comms write threw:', err instanceof Error ? err.name : 'unknown');
    return json({ ok: false, error: 'That did not complete. Nothing was changed.' }, 503);
  }
};
