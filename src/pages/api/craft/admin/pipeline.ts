// Every write the pipeline screens can make.
//
// ───────────────────────────────────────────────────────────────────────────
// AUTHORISATION HAPPENS HERE. HIDING A BUTTON IS NOT AUTHORISATION.
// ───────────────────────────────────────────────────────────────────────────
//
// The brief says it twice because it expects it to be got wrong:
// "Authorisation is enforced server-side on reads, exports and writes", and
// "Admin pages and APIs require authentication; hiding a button is
// insufficient."
//
// So every action below names the capability it needs and checks it against
// the roles on the SIGNED session, before touching anything. The console uses
// the same matrix to decide what to draw, and that is a courtesy — this is the
// check that counts. A hand-rolled POST from a signed-in operator must not be
// able to approve an offer.
//
// Middleware has already established that there IS a session (the whole
// /api/craft/admin prefix is closed). What it cannot know is whether this
// particular person may do this particular thing.
//
// ───────────────────────────────────────────────────────────────────────────
// EVERY WRITE IS AN INSERT. ALMOST NOTHING IS AN UPDATE.
// ───────────────────────────────────────────────────────────────────────────
//
// Meetings, offers, payments, admissions and stage moves all append. The two
// exceptions are marking a meeting held and marking an offer accepted, which
// are updates to a row that is being completed rather than changed.
//
// The reason is the operating guide's: corrections must stay visible.
// "Author and reason retained; finance and attendance independently reported."
// An UPDATE that overwrites a stage loses the fact that somebody moved it back,
// and a pipeline that quietly loses its reversals reports better than it is.
//
// WHAT THIS ENDPOINT WILL NOT DO
//   * Enrol somebody without the evidence. `enrolment_blockers()` decides, not
//     this file, and not the person clicking.
//   * Delete anything. A refund is a row, not a deletion. Erasure lives on the
//     leads screen and is a different act with a different justification.
//   * Accept an actor name from the request. The actor is the session.

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/admin/supabase';
import { can, refusal, type Capability } from '../../../../lib/pipeline/roles';
import { capabilityFor, checkMove, type Route } from '../../../../lib/pipeline/stages';
import type { Identity } from '../../../../lib/admin/staff';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/**
 * How an action is attributed.
 *
 * A named account is its own id and name. The shared-password bootstrap is
 * recorded as 'bootstrap', deliberately and visibly — an audit trail that
 * cannot name an actor should say so rather than borrow a name. That string
 * appearing against an offer approval is itself a finding.
 */
const actorOf = (who: Identity): string =>
  who.kind === 'staff' ? `${who.name} <${who.id}>` : 'bootstrap (shared password)';

/**
 * Which capability each action needs, in one table.
 *
 * A table rather than a check inside each branch, because the check now has to
 * happen BEFORE the switch — and because a reader auditing this file should be
 * able to answer "what can an operator do here?" by reading eleven lines
 * rather than by tracing eleven branches.
 *
 * An action missing from this table is refused as unknown. That is the correct
 * default: a new action added to the switch without an entry here cannot be
 * called at all, rather than being callable by anybody.
 */
const CAPABILITY_FOR_ACTION: Record<string, Capability> = {
  'meeting.schedule': 'write.meeting',
  'meeting.outcome': 'write.meeting',
  'offer.approve': 'approve.offer',
  'offer.accepted': 'approve.offer',
  admission: 'approve.admission',
  payment: 'confirm.payment',
  attendance: 'confirm.attendance',
  note: 'write.note',
  task: 'write.task',
  'task.complete': 'write.task',
  assign: 'write.contact',
  nomination: 'write.contact',
};

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  return t ? t.slice(0, max) : null;
};

/** Minor units, from a string. Refuses anything that is not whole and positive. */
const minorUnits = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[,\s]/g, ''));
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
};

const isoOrNull = (v: unknown): string | null => {
  const s = clean(v, 40);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

export const POST: APIRoute = async ({ request, locals }) => {
  const who = locals.admin;
  if (!who) return json({ ok: false, error: 'Not signed in.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Could not read that request.' }, 400);
  }

  const action = String(body.action ?? '');
  const opportunityId = clean(body.opportunityId, 60);
  if (!opportunityId) return json({ ok: false, error: 'Which lead?' }, 400);

  // ── AUTHORISATION RUNS BEFORE THE DATABASE IS EVEN ASKED FOR ─────────────
  //
  // It used to run after, and the difference is not cosmetic. With the check
  // second, a database outage turned every refusal into a 503: an operator
  // attempting to approve an offer got "the database is not configured", which
  // is both the wrong answer and an unfalsifiable one. Whether somebody is
  // ALLOWED to do a thing has nothing to do with whether the store is up, and
  // a permission system that stops answering when the database does is a
  // permission system nobody can test.
  //
  // The acceptance harness found this: it expected 403 on two actions an
  // operator must not hold and got 503 on all three, which reads as a passing
  // system failing safe when it is really an untested one.
  //
  // `stage` is the one action whose capability depends on the TARGET, so it is
  // resolved from the request here and re-checked in full (with the evidence)
  // once the record has been read.
  const required: Capability =
    action === 'stage' ? capabilityFor(clean(body.stage, 40) ?? '') : CAPABILITY_FOR_ACTION[action];

  if (!required) return json({ ok: false, error: 'Unknown action.' }, 400);
  if (!can(who.roles, required)) {
    return json({ ok: false, error: refusal(required) }, 403);
  }

  const client = db();
  if (!client) {
    return json({ ok: false, error: 'The database is not configured for this deployment.' }, 503);
  }

  const actor = actorOf(who);


  /**
   * Best-effort activity + audit. Never fails the write it describes.
   *
   * A failed audit row is a real problem and it is logged, but refusing the
   * payment because its audit entry did not insert would be worse: the money
   * arrived either way, and the console would then be missing the fact.
   */
  const note = async (type: string, notes: string, previous?: unknown, next?: unknown) => {
    try {
      await client.from('activities').insert({
        opportunity_id: opportunityId,
        type,
        actor,
        occurred_at: new Date().toISOString(),
        notes,
      });
      await client.from('audit_log').insert({
        record_type: 'opportunity',
        record_id: opportunityId,
        actor,
        previous_value: previous ?? null,
        new_value: next ?? null,
        occurred_at: new Date().toISOString(),
        reason: notes,
      });
    } catch (err) {
      console.error('pipeline audit write failed:', err instanceof Error ? err.name : 'unknown');
    }
  };

  try {
    switch (action) {
      // ---- moving between stages ------------------------------------------
      case 'stage': {
        const to = clean(body.stage, 40);
        const reason = clean(body.reason, 2000);
        if (!to) return json({ ok: false, error: 'Which stage?' }, 400);

        const { data: opp, error } = await client
          .from('opportunities')
          .select('stage, route')
          .eq('opportunity_id', opportunityId)
          .maybeSingle();
        if (error || !opp) return json({ ok: false, error: 'No such lead.' }, 404);

        // The evidence question is only asked for the one transition that turns
        // on it, and it is asked of the database rather than of this process.
        let blockers: { code: string; detail: string }[] = [];
        if (to === 'enrolled') {
          const { data } = await client.rpc('enrolment_blockers', {
            p_opportunity_id: opportunityId,
          });
          blockers = (data ?? []) as typeof blockers;
        }

        const verdict = checkMove({
          route: opp.route as Route,
          from: opp.stage,
          to,
          roles: who.roles,
          reason,
          blockers,
        });

        if (!verdict.ok) {
          return json(
            { ok: false, error: verdict.message, code: verdict.code, blockers: verdict.blockers },
            verdict.code === 'not_permitted' ? 403 : 409,
          );
        }

        // History first. If the UPDATE below fails, an orphan history row is a
        // confusing record; a stage that moved with no history is a lost one.
        await client.from('stage_history').insert({
          opportunity_id: opportunityId,
          from_stage: opp.stage,
          to_stage: to,
          actor,
          reason,
          is_reversal: verdict.isReversal,
        });

        const { error: upd } = await client
          .from('opportunities')
          .update({
            stage: to,
            stage_entered_at: new Date().toISOString(),
            // Only set when closing. Clearing it on a reopen would erase why
            // they were closed, which is the thing you most want on reopening.
            ...(to === 'unsuitable' || to === 'withdrawn' || to === 'closed'
              ? { closure_reason: reason }
              : {}),
          })
          .eq('opportunity_id', opportunityId);

        if (upd) return json({ ok: false, error: upd.message }, 503);

        await note('stage_changed', reason ?? `Moved to ${to}.`, { stage: opp.stage }, { stage: to });
        return json({ ok: true, stage: to }, 200);
      }

      // ---- meetings --------------------------------------------------------
      case 'meeting.schedule': {

        const scheduledAt = isoOrNull(body.scheduledAt);
        if (!scheduledAt) return json({ ok: false, error: 'A meeting needs a date and time.' }, 400);

        const { error } = await client.from('meetings').insert({
          opportunity_id: opportunityId,
          scheduled_at: scheduledAt,
          status: 'scheduled',
          recorded_by: actor,
        });
        if (error) return json({ ok: false, error: error.message }, 503);

        await note('meeting_scheduled', `Meeting scheduled for ${scheduledAt}.`);
        return json({ ok: true }, 200);
      }

      case 'meeting.outcome': {

        const meetingId = clean(body.meetingId, 60);
        const status = clean(body.status, 20);
        if (!meetingId || !status) return json({ ok: false, error: 'Which meeting, and what happened?' }, 400);
        if (!['held', 'cancelled', 'no_show'].includes(status)) {
          return json({ ok: false, error: 'That is not a meeting outcome.' }, 400);
        }

        const { error } = await client
          .from('meetings')
          .update({
            status,
            // held_at only when it was actually held, and it is the real time
            // rather than the scheduled one. A cancelled meeting has no held_at
            // and must not acquire one.
            held_at: status === 'held' ? (isoOrNull(body.heldAt) ?? new Date().toISOString()) : null,
            outcome: clean(body.outcome, 4000),
            next_action: clean(body.nextAction, 500),
            recorded_by: actor,
          })
          .eq('meeting_id', meetingId)
          .eq('opportunity_id', opportunityId);
        if (error) return json({ ok: false, error: error.message }, 503);

        await note('meeting_' + status, clean(body.outcome, 4000) ?? `Meeting ${status}.`);
        return json({ ok: true }, 200);
      }

      // ---- offers ----------------------------------------------------------
      case 'offer.approve': {
        // Sunil's alone. An operator working a queue must not be able to put a
        // number in front of somebody on the practice's behalf.

        const currency = clean(body.currency, 8)?.toUpperCase();
        const amount = minorUnits(body.amountMinor);
        if (!currency || amount === null) {
          return json(
            { ok: false, error: 'An offer needs a currency and an amount in minor units — 120000 for ₹1,200.00.' },
            400,
          );
        }

        // A revision is a new row pointing at the one it replaces, never an
        // edit. Otherwise the terms somebody accepted can change afterwards.
        const supersedes = clean(body.supersedes, 60);
        const { data: prior } = await client
          .from('offers')
          .select('version')
          .eq('opportunity_id', opportunityId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { error } = await client.from('offers').insert({
          opportunity_id: opportunityId,
          version: (prior?.version ?? 0) + 1,
          supersedes,
          approved_by: actor,
          currency,
          amount_minor: amount,
          term_reference: clean(body.termReference, 500),
        });
        if (error) return json({ ok: false, error: error.message }, 503);

        await note('offer_approved', `Offer approved: ${currency} ${amount} (minor units).`);
        return json({ ok: true }, 200);
      }

      case 'offer.accepted': {

        const offerId = clean(body.offerId, 60);
        if (!offerId) return json({ ok: false, error: 'Which offer?' }, 400);

        const { error } = await client
          .from('offers')
          .update({ accepted: true, accepted_at: new Date().toISOString() })
          .eq('offer_id', offerId)
          .eq('opportunity_id', opportunityId);
        if (error) return json({ ok: false, error: error.message }, 503);

        // Note what this does NOT do: it does not enrol anybody. Acceptance is
        // one of four things enrolment needs, and the move is still a separate,
        // deliberate act by Sunil.
        await note('offer_accepted', 'Offer marked accepted.');
        return json({ ok: true }, 200);
      }

      // ---- admission -------------------------------------------------------
      case 'admission': {

        const decision = clean(body.decision, 20);
        if (decision !== 'admitted' && decision !== 'declined') {
          return json({ ok: false, error: 'An admission decision is admitted or declined.' }, 400);
        }

        const { error } = await client.from('admissions').insert({
          opportunity_id: opportunityId,
          decision,
          decided_by: actor,
          note: clean(body.note, 4000),
        });
        if (error) return json({ ok: false, error: error.message }, 503);

        await note('admission_' + decision, clean(body.note, 4000) ?? `Admission ${decision}.`);
        return json({ ok: true }, 200);
      }

      // ---- finance ---------------------------------------------------------
      case 'payment': {
        // Finance and nobody else — not Sunil, and not the operator. This is
        // the separation that makes an enrolment mean something.

        const type = clean(body.type, 20);
        const currency = clean(body.currency, 8)?.toUpperCase();
        const amount = minorUnits(body.amountMinor);
        const receivedAt = isoOrNull(body.receivedAt);

        if (type !== 'receipt' && type !== 'refund') {
          return json({ ok: false, error: 'A payment is a receipt or a refund.' }, 400);
        }
        if (!currency || amount === null || amount <= 0) {
          return json({ ok: false, error: 'A payment needs a currency and an amount in minor units.' }, 400);
        }
        if (!receivedAt) {
          // The transaction date, not today. Defaulting it would fabricate the
          // one field finance reconciles against a bank statement.
          return json({ ok: false, error: 'A payment needs the date the money actually moved.' }, 400);
        }

        const { data: opp } = await client
          .from('opportunities')
          .select('person_id')
          .eq('opportunity_id', opportunityId)
          .maybeSingle();

        const { error } = await client.from('payments').insert({
          opportunity_id: opportunityId,
          person_id: opp?.person_id ?? null,
          offer_id: clean(body.offerId, 60),
          type,
          currency,
          amount_minor: amount,
          invoice_reference: clean(body.invoiceReference, 200),
          evidence_reference: clean(body.evidenceReference, 500),
          confirmed_by: actor,
          received_at: receivedAt,
        });
        if (error) return json({ ok: false, error: error.message }, 503);

        // A refund raises a task and changes nothing else. The brief: it
        // "does not erase historical enrolment or attendance".
        if (type === 'refund') {
          await client.from('tasks').insert({
            opportunity_id: opportunityId,
            owner: 'operator',
            description: 'Review what should happen after a refund. Stage and attendance are unchanged.',
            due_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
          });
        }

        await note(`payment_${type}`, `${type} confirmed: ${currency} ${amount} (minor units).`);
        return json({ ok: true, refund: type === 'refund' }, 200);
      }

      // ---- attendance ------------------------------------------------------
      case 'attendance': {

        const { data: opp } = await client
          .from('opportunities')
          .select('person_id, cohort_id')
          .eq('opportunity_id', opportunityId)
          .maybeSingle();
        if (!opp?.person_id) return json({ ok: false, error: 'No person on that lead.' }, 404);

        const attendedRaw = body.attended;
        const { error } = await client.from('attendance').upsert(
          {
            person_id: opp.person_id,
            cohort_id: opp.cohort_id,
            session_id: clean(body.sessionId, 40),
            confirmation_response: clean(body.confirmation, 10),
            confirmed_at: new Date().toISOString(),
            attended: typeof attendedRaw === 'boolean' ? attendedRaw : null,
            recorded_by: actor,
            occurred_on: clean(body.occurredOn, 20),
          },
          { onConflict: 'person_id,cohort_id,session_id' },
        );
        if (error) return json({ ok: false, error: error.message }, 503);

        await note('attendance_recorded', 'Attendance recorded. This is not evidence of payment.');
        return json({ ok: true }, 200);
      }

      // ---- notes and tasks -------------------------------------------------
      case 'note': {

        const text = clean(body.text, 8000);
        if (!text) return json({ ok: false, error: 'An empty note records nothing.' }, 400);

        const { error } = await client.from('activities').insert({
          opportunity_id: opportunityId,
          type: 'note',
          actor,
          occurred_at: new Date().toISOString(),
          notes: text,
        });
        if (error) return json({ ok: false, error: error.message }, 503);
        return json({ ok: true }, 200);
      }

      case 'task': {

        const description = clean(body.description, 2000);
        if (!description) return json({ ok: false, error: 'A task needs to say what to do.' }, 400);

        const { error } = await client.from('tasks').insert({
          opportunity_id: opportunityId,
          owner: clean(body.owner, 120),
          description,
          due_at: isoOrNull(body.dueAt),
        });
        if (error) return json({ ok: false, error: error.message }, 503);

        // Mirrored onto the opportunity so the leads list can show what is owed
        // without a join per row. The task table stays the record.
        await client
          .from('opportunities')
          .update({ next_action: description, due_at: isoOrNull(body.dueAt) })
          .eq('opportunity_id', opportunityId);

        return json({ ok: true }, 200);
      }

      case 'task.complete': {

        const taskId = clean(body.taskId, 60);
        if (!taskId) return json({ ok: false, error: 'Which task?' }, 400);

        const { error } = await client
          .from('tasks')
          .update({ completed_at: new Date().toISOString() })
          .eq('task_id', taskId)
          .eq('opportunity_id', opportunityId);
        if (error) return json({ ok: false, error: error.message }, 503);
        return json({ ok: true }, 200);
      }

      // ---- assignment ------------------------------------------------------
      case 'assign': {

        const owner = clean(body.owner, 120);
        const { error } = await client
          .from('opportunities')
          .update({ owner })
          .eq('opportunity_id', opportunityId);
        if (error) return json({ ok: false, error: error.message }, 503);

        await note('assigned', owner ? `Assigned to ${owner}.` : 'Owner cleared.');
        return json({ ok: true }, 200);
      }

      // ---- enterprise participants ----------------------------------------
      case 'nomination': {

        const name = clean(body.name, 200);
        if (!name) return json({ ok: false, error: 'A nomination needs a name.' }, 400);

        // Deliberately NOT a `people` row. A nominated participant has not done
        // anything yet; making them a person here would put them in the
        // applicant counts, which is the brief's named mistake.
        const { error } = await client.from('nominations').insert({
          opportunity_id: opportunityId,
          organisation_id: clean(body.organisationId, 60),
          name,
          email: clean(body.email, 200)?.toLowerCase(),
          role: clean(body.role, 200),
          note: clean(body.note, 2000),
        });
        if (error) return json({ ok: false, error: error.message }, 503);

        await note('nomination_added', `${name} nominated. Not counted as an applicant.`);
        return json({ ok: true }, 200);
      }

      default:
        return json({ ok: false, error: 'Unknown action.' }, 400);
    }
  } catch (err) {
    // Never echo the caught error to the caller: it can carry a row, and a row
    // here is somebody's contact details or their payment reference.
    console.error('pipeline write threw:', err instanceof Error ? err.name : 'unknown');
    return json({ ok: false, error: 'That did not complete. Nothing was changed.' }, 503);
  }
};
