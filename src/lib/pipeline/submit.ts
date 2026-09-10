// The save. One call, one transaction, one answer.
//
// ───────────────────────────────────────────────────────────────────────────
// WHY THE WORK IS IN POSTGRES AND NOT HERE
// ───────────────────────────────────────────────────────────────────────────
//
// The brief: "validate, resolve the contact, create the enquiry/application and
// initial task, and queue acknowledgement/owner notification in one reliable
// transaction or equivalent durable workflow. Return success only after the
// record is committed."
//
// Done in TypeScript over supabase-js, that is six sequential HTTP calls with
// no transaction around them. Every gap between two of them is a state the
// database can be left in: a person with no submission, a submission with no
// opportunity, an opportunity nobody owns. Those are not theoretical — a
// serverless function can be killed between any two awaits, and the one that
// gets killed is the one during the traffic spike after a post goes out.
//
// So `pipeline_submit` in supabase/schema.sql does all of it in one statement,
// and this module's entire job is to prepare its arguments and interpret its
// answer. That also matches the repo's existing rule for rollups: the work goes
// where the data is.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT THIS MODULE REFUSES TO DO
// ───────────────────────────────────────────────────────────────────────────
//
//   * It never reports success it did not observe. Every path that does not end
//     in a committed row returns a failure the caller must surface. Acceptance
//     case E03 is a page that does not say thank you when the database is down.
//   * It never logs an answer, a name, an email or a phone number. Errors carry
//     the submission type and the failure class and nothing else — a stack
//     trace in a log aggregator is a copy of somebody's application in a system
//     that was never scoped to hold one.
//   * It never retries on its own. A retry here would be a second application
//     under the same request key, which the function is built to absorb — but
//     the honest answer to "we do not know whether that saved" is to say so and
//     let the person press the button again, which carries the same key.

import { db } from '../admin/supabase';
import type { Attribution } from './attribution';
import { MARKETING_CONSENT } from './consent';
import { FORMS, normaliseEmail, type Route } from './forms';
import { newReference } from './reference';
import type { Cohort } from './cohorts';

export interface SubmitInput {
  route: Route;
  requestKey: string;
  /** Already validated and cleaned by validate() in forms.ts. */
  values: Record<string, string>;
  attribution: Attribution;
  marketingConsent: boolean;
  cohort: Cohort | null;
}

export type SubmitResult =
  | { ok: true; reference: string; alreadyExisted: boolean; submissionId: string }
  | { ok: false; kind: 'unconfigured' | 'unavailable' | 'rejected'; message: string };

/**
 * The sentence a visitor reads when this fails.
 *
 * Written once, here, because the browser displays whatever comes back
 * verbatim. It says what happened, that their work is safe, and what to do —
 * in that order. It does not apologise, because an apology is not information,
 * and it does not blame "technical difficulties", because that tells somebody
 * who just typed four paragraphs precisely nothing.
 */
const UNAVAILABLE =
  'We could not save this just now. Your answers are still on this page — try again in a moment, or email apply@thelivingcraft.ai and we will take it from there.';

/**
 * The owning team for a new record.
 *
 * Every route starts with the operator, including the enterprise one. The
 * operating guide is explicit that Alchemy qualifies first and *then* co-ordinates
 * Sunil's technical-fit discussion — routing a team enquiry straight to him
 * skips the qualification that makes his time worth spending.
 */
const INITIAL_OWNER = 'operator';

/** One working day, in the ordinary case. Not a promise to anybody outside. */
const FIRST_TASK_HOURS = 24;

export async function saveSubmission(input: SubmitInput): Promise<SubmitResult> {
  const client = db();
  if (!client) {
    // Unconfigured is a deployment fault, not a visitor's. It reads the same to
    // them, and is distinguished here so the console can tell the two apart.
    return { ok: false, kind: 'unconfigured', message: UNAVAILABLE };
  }

  const { route, values } = input;
  const original = values.email ?? '';

  const dueAt = new Date(Date.now() + FIRST_TASK_HOURS * 3600 * 1000).toISOString();

  try {
    const { data, error } = await client.rpc('pipeline_submit', {
      p_request_key: input.requestKey,
      // A reference is generated for every attempt and used only if this attempt
      // is the one that inserts. A retry under the same key gets the reference
      // the first attempt issued, and this one is discarded — which is why the
      // caller must read the reference back out of the result rather than
      // assuming the one it sent.
      p_reference: newReference(),
      p_type: route,
      p_cohort_id: input.cohort?.cohort_id ?? null,
      p_name: values.name ?? null,
      p_normalised_email: normaliseEmail(original),
      p_original_email: original,
      p_phone: values.phone ?? null,
      p_role: values.role ?? null,
      p_organisation_name: values.organisation ?? null,
      p_industry: values.industry ?? null,
      // The answers, exactly as validated. Stored as one document rather than a
      // column each: the three routes ask different questions, the questions
      // will change, and a schema migration per copy edit is how a form ends up
      // frozen. forms.ts holds the labels that make this readable.
      p_answers: values,
      p_funding_route: values.funding ?? null,
      p_group_size: values.group_size ? Number(values.group_size) : null,
      p_privacy_notice_version: null,
      p_owner: INITIAL_OWNER,
      p_task_due_at: dueAt,
      p_attribution: input.attribution,
      // Absent, not false, when nobody ticked the box. The consents table is
      // append-only and holds what somebody agreed to; a row saying "did not
      // agree" is not a consent record, it is the absence of one.
      p_consent: input.marketingConsent
        ? {
            granted: true,
            purpose: MARKETING_CONSENT.purpose,
            wording: MARKETING_CONSENT.wording,
            wording_version: MARKETING_CONSENT.version,
            source: route,
          }
        : null,
      p_actor: 'public_form',
    });

    if (error) {
      console.error(`pipeline_submit failed [${route}]:`, error.message);
      return { ok: false, kind: 'unavailable', message: UNAVAILABLE };
    }

    // plpgsql `returns table` arrives as an array of one row.
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.submission_id || !row?.reference) {
      // The call succeeded and returned nothing usable. Treating that as a save
      // would be the exact false success E03 exists to catch.
      console.error(`pipeline_submit returned no row [${route}]`);
      return { ok: false, kind: 'unavailable', message: UNAVAILABLE };
    }

    return {
      ok: true,
      reference: String(row.reference),
      alreadyExisted: row.already_existed === true,
      submissionId: String(row.submission_id),
    };
  } catch (err) {
    // Network, timeout, or a client that threw. Note what is NOT logged: the
    // error object may carry the request body, and the request body is an
    // application.
    console.error(
      `pipeline_submit threw [${route}]:`,
      err instanceof Error ? err.name : 'unknown',
    );
    return { ok: false, kind: 'unavailable', message: UNAVAILABLE };
  }
}

/** The approved sentence shown after a save. Never assembled at the call site. */
export const confirmationFor = (route: Route): string => FORMS[route].confirmation;
