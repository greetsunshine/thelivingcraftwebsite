// The fourth record type: somebody asked us to email them a worksheet.
//
// ───────────────────────────────────────────────────────────────────────────
// A DOWNLOAD IS AN EVENT. AN EMAIL REQUEST IS A PERSON. THEY ARE NOT THE SAME
// THING AND THIS MODULE IS THE LINE BETWEEN THEM.
// ───────────────────────────────────────────────────────────────────────────
//
// The V4 addendum (LC-STRATEGY-V4.0.0, 11 September 2026), verbatim:
//
//   "Anonymous resource views/downloads are events, not people. An optional
//    email request creates a resource request attached to an existing or new
//    person using the retained deduplication rules. Keep it distinct from
//    enquiry and application. Never infer marketing permission from
//    downloading."
//
// Everything below follows from those four sentences, and the shape of the code
// is chosen so that breaking one of them requires writing a line that is
// obviously wrong rather than forgetting one that was obviously right.
//
//   * NOTHING HERE READS A PAGE VIEW. There is no counter, no download hook and
//     no "if they got this far" inference. A person exists in this path only
//     because somebody typed an address into a form and pressed a button. The
//     open resource pages ask for nothing (`NO_GATE` in src/data/resources.ts),
//     so a reader who never uses this endpoint is measured by `events` and is
//     never a row in `people`. That is V4-E02.
//   * NOTHING HERE WRITES AN OPPORTUNITY, A STAGE, A TASK OR A CONSENT.
//     `resource_request_submit()` cannot: it has no arguments for any of them.
//     That is V4-E05, and it is worth keeping structural — a resource request
//     that quietly created an opportunity would show up as an applicant in the
//     one count Sunil most needs to be true.
//   * NOTHING HERE ASKS FOR MARKETING PERMISSION, and the omission is
//     deliberate rather than unfinished. See THE CONSENT BOX THAT IS NOT HERE.
//
// ───────────────────────────────────────────────────────────────────────────
// THE CONSENT BOX THAT IS NOT HERE
// ───────────────────────────────────────────────────────────────────────────
//
// A tick-box offering programme updates would be legal, ordinary, and wrong to
// add today, for two reasons that are both about not writing a record we cannot
// stand behind:
//
//   1. A CONSENT RECORD HAS TO SAY WHAT THE PERSON SAW, and the wording lives
//      in `consent.ts` with a version against it. There is exactly one approved
//      wording and it was written for the application form. Inventing a second
//      one here — a version string `consentVersion()` would not recognise —
//      produces records the console cannot explain, which is the failure that
//      whole file exists to prevent.
//   2. THE ADDENDUM SAYS THE SEQUENCE CANNOT START ANYWAY: "Reply ingestion
//      must work before nurture can activate", and "the existing cohort nurture
//      must not start from a resource request by default". Collecting a
//      permission nothing may act on is collecting a liability.
//
// So: a resource request creates no `consents` row, and `marketingConsent` in a
// posted body is IGNORED rather than honoured. When a wording is approved and
// added to `CONSENT_HISTORY`, this is where it goes — as a separate affirmative
// act with its own version, never as a side effect of asking for a worksheet.
//
// ───────────────────────────────────────────────────────────────────────────
// THE DELIVERY REUSES STAGE 4'S OUTBOX. IT IS NOT A SECOND MECHANISM.
// ───────────────────────────────────────────────────────────────────────────
//
// "Use a durable delivery job/outbox and expose email failures to staff." That
// is `comms_messages`, and every property it already has is one this path would
// otherwise have to reinvent badly: the eligibility check that runs at queue
// time AND again immediately before dispatch, the suppression list, the one-way
// state machine, bounded retries, the failure queue with its `alerted_at`, and
// a single switched-off `deliver()` seam so that nothing can send while
// decision D2 is open.
//
// What is NOT reused is `queueForSubmission()`, and that is a deliberate
// boundary rather than an oversight: it is written around a `submission_id`, a
// receipt-plus-three-nurture-steps shape and an opportunity, and a resource
// request has none of those. `queueResourceDelivery()` below writes one
// transactional row through the same table, the same idempotency key builder
// and the same `checkEligibility()` call, and opens no sequence. There is no
// second outbox, no second suppression list and no bypass of the dispatch
// switch — a resource delivery queues and holds exactly like everything else.

import { db } from '../admin/supabase';
import { sqlstate } from './errors';
import { checkEligibility, type Eligibility } from '../comms/eligibility';
import { idempotencyKey } from '../comms/outbox';
import { renderMessage, resourceTemplateFor } from '../comms/templates';
import { RESOURCES, type Resource } from '../../data/resources';
import type { Attribution } from './attribution';
import { canonicalResourceId } from './attribution';
import { EMAIL_RE, normaliseEmail, tidy, type Field, type FieldError } from './forms';


// ---------------------------------------------------------------------------
// Which resource, and is it real
// ---------------------------------------------------------------------------

/**
 * The register code, lower-cased: 'lc-r01'.
 *
 * ONE SPELLING, EVERYWHERE. The register writes LC-R01, the campaign writes its
 * own ids lower-case, and `/resources/cost-ceiling-worksheet` knows itself by a
 * slug. A dimension with three spellings is three rows in every count of it, so
 * everything that leaves this module — the stored `resource_id`, the analytics
 * payload, the template key — is built from this one function.
 */
export const resourceIdOf = (resource: Resource): string =>
  canonicalResourceId(resource.code) ?? resource.id;

export type ResourceLookup =
  | { state: 'ok'; resource: Resource }
  | { state: 'unknown' }
  | { state: 'unreleased'; resource: Resource };

/**
 * Resolve whatever the browser sent to one released resource.
 *
 * Accepts the register code or the page slug, in any case, because both are
 * visible to a reader and either is a reasonable thing for a form to post. It
 * does NOT accept a title: a title is copy, and copy is edited.
 *
 * 'unreleased' is separate from 'unknown' on purpose. A draft resource is a
 * real identifier for a page that does not exist yet, and the honest answer is
 * "not yet", not "no such thing" — the roadmap's own rule for the toolkit index
 * applies to the endpoint too: "do not display unavailable downloads as
 * available", and accepting a request for one is a stronger claim than
 * displaying it.
 */
export function resolveResource(value: unknown): ResourceLookup {
  const wanted = canonicalResourceId(typeof value === 'string' ? value : null);
  if (!wanted) return { state: 'unknown' };

  const resource = RESOURCES.find(
    (r) => resourceIdOf(r) === wanted || r.id.toLowerCase() === wanted,
  );
  if (!resource) return { state: 'unknown' };
  return resource.status === 'ready' ? { state: 'ok', resource } : { state: 'unreleased', resource };
}

// ---------------------------------------------------------------------------
// The two fields, and the validation that is not written twice
// ---------------------------------------------------------------------------
//
// Two fields and no more. The addendum calls this an "optional email request",
// and every extra box is a question somebody has to answer to read a worksheet
// that is already open on the screen in front of them. A role, an organisation
// or a funding route here would be qualification data collected under cover of
// a download, which is the sort of thing the brief's own copy tells applicants
// we do not do.
//
// A NAME IS REQUIRED because `people.name` is `not null` — there is one people
// table and a resource request must not be able to write a row the application
// path could not. It is not required because we intend to use it for anything.

export const RESOURCE_FIELDS: Field[] = [
  {
    name: 'name',
    label: 'Your name',
    kind: 'text',
    required: true,
    max: 200,
    autocomplete: 'name',
  },
  {
    name: 'email',
    label: 'Email',
    kind: 'email',
    required: true,
    max: 200,
    hint: 'A personal address is fine. We send the worksheet and nothing else.',
    autocomplete: 'email',
  },
];

/**
 * Validate a request. Same rules as the three forms, because they are the same
 * rules — `tidy()` and `EMAIL_RE` are imported, not restated.
 *
 * The one that matters is not here at all: deduplication is `normaliseEmail()`,
 * which trims and lower-cases and DOES NOT STRIP PLUS-TAGS. Writing a second
 * email rule for this path is how `a+worksheet@x.com` becomes one person on one
 * route and two on another.
 */
export function validateResourceRequest(input: Record<string, unknown>): {
  values: Record<string, string>;
  errors: FieldError[];
} {
  const values: Record<string, string> = {};
  const errors: FieldError[] = [];

  for (const field of RESOURCE_FIELDS) {
    const raw = input[field.name];
    const cleaned = tidy(typeof raw === 'string' ? raw : '');

    if (!cleaned) {
      if (field.required) {
        errors.push({ field: field.name, code: 'required', message: `${field.label} is needed.` });
      }
      continue;
    }
    if (cleaned.length > field.max) {
      errors.push({
        field: field.name,
        code: 'too_long',
        message: `${field.label} is limited to ${field.max} characters.`,
      });
      continue;
    }
    if (field.kind === 'email' && !EMAIL_RE.test(cleaned)) {
      errors.push({
        field: field.name,
        code: 'invalid_email',
        message:
          'That does not look like an email address. Check for a missing @ or a typo in the domain.',
      });
      continue;
    }
    values[field.name] = cleaned;
  }

  return { values, errors };
}

// ---------------------------------------------------------------------------
// The save
// ---------------------------------------------------------------------------

export interface ResourceRequestInput {
  requestKey: string;
  resource: Resource;
  values: Record<string, string>;
  attribution: Attribution;
  isTest?: boolean;
}

export type ResourceSaveResult =
  | { ok: true; requestId: string; personId: string; alreadyExisted: boolean }
  | { ok: false; kind: 'unconfigured' | 'unavailable'; message: string };

/**
 * What a visitor reads when the save fails.
 *
 * Same shape and the same reasoning as `UNAVAILABLE` in submit.ts: what
 * happened, that nothing was lost, and what to do. And the sentence that only
 * this path can honestly say — the worksheet is not behind the email, so a
 * failed request costs them nothing at all.
 */
const UNAVAILABLE =
  'We could not save that just now. Nothing about the worksheet is behind this — it is on the page in front of you — so try again in a moment if you would still like it by email.';

/** What a visitor reads when it worked. The delivery line is added beside it. */
export const RESOURCE_SAVED = 'Your request is saved.';

/**
 * Save the request, the person and the attribution in one transaction.
 *
 * NEVER REPORTS A SUCCESS IT DID NOT OBSERVE. Every path that does not end in a
 * committed row returns a failure the caller must surface — V4-E03 is a page
 * that does not say "saved" when the database is down, and with the schema
 * unapplied today that is the path this actually takes.
 *
 * NEVER LOGS WHAT WAS TYPED, AND `error.message` IS WHAT WAS TYPED. A Postgres
 * message quotes the offending literal — `invalid input syntax for type uuid:
 * "…"`, a RAISE that interpolates a value, a constraint message naming the row —
 * and every literal reaching this function is a name or an address. The same
 * rule as `failed()` in lib/comms/outbox.ts ("Never `error.message`") and
 * `sourceFailed()` in lib/admin/pipeline-queries.ts: the CODE goes to the log,
 * the message does not go anywhere.
 */
export async function saveResourceRequest(
  input: ResourceRequestInput,
): Promise<ResourceSaveResult> {
  const client = db();
  if (!client) return { ok: false, kind: 'unconfigured', message: UNAVAILABLE };

  const original = input.values.email ?? '';
  const resourceId = resourceIdOf(input.resource);

  try {
    const { data, error } = await client.rpc('resource_request_submit', {
      p_request_key: input.requestKey,
      p_resource_id: resourceId,
      p_name: input.values.name ?? null,
      p_normalised_email: normaliseEmail(original),
      p_original_email: original,
      p_resource_version: input.resource.revisedOn,
      p_attribution: input.attribution,
      p_is_test: input.isTest === true,
      p_actor: 'public_form',
    });

    if (error) {
      console.error(`resource_request_submit failed [${resourceId}]:`, sqlstate(error));
      return { ok: false, kind: 'unavailable', message: UNAVAILABLE };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.request_id || !row?.person_id) {
      // The call succeeded and returned nothing usable. Treating that as a save
      // is the false success the whole endpoint is shaped to avoid.
      console.error(`resource_request_submit returned no row [${resourceId}]`);
      return { ok: false, kind: 'unavailable', message: UNAVAILABLE };
    }

    return {
      ok: true,
      requestId: String(row.request_id),
      personId: String(row.person_id),
      alreadyExisted: row.already_existed === true,
    };
  } catch (err) {
    console.error(
      `resource_request_submit threw [${resourceId}]:`,
      err instanceof Error ? err.name : 'unknown',
    );
    return { ok: false, kind: 'unavailable', message: UNAVAILABLE };
  }
}

// ---------------------------------------------------------------------------
// The delivery
// ---------------------------------------------------------------------------

export type DeliveryState = 'pending' | 'queued' | 'blocked' | 'failed';

export interface DeliveryOutcome {
  state: DeliveryState;
  /** One staff-facing sentence. Never an error object, never an address. */
  note: string;
  messageId: string | null;
  /** The gate-by-gate verdict, for the console. Absent when nothing was asked. */
  eligibility?: Eligibility;
}

export interface DeliveryRequest {
  requestId: string;
  personId: string;
  /** The address as it stands now. Snapshotted onto the message, like every other. */
  recipient: string;
  resource: Resource;
  isTest?: boolean;
}

/**
 * Queue the delivery email through stage 4's outbox, and record what happened.
 *
 * DISPATCH IS OFF AND THIS DOES NOT WORK AROUND IT. `dispatchSwitch()` in
 * eligibility.ts decides whether anything may be sent, decision D2 is open, and
 * the addendum agrees with the switch: "Reply ingestion must work before nurture
 * can activate." So this writes a queued row and the row waits. There is no
 * flag, no argument and no environment variable here that would let a resource
 * delivery leave ahead of everything else — a bypass for "just this one
 * transactional message" is how a system with a send switch sends anyway.
 *
 * THE ORDER IS CHECK, THEN WRITE, and it matches the outbox's own rule. A gate
 * that has decided permanently — a suppressed address, a withdrawn wording —
 * means no row is created at all; a gate that is merely unanswered or waiting
 * means the row is created and held, because the block is about us and it stops
 * applying the moment somebody fixes it.
 */
export async function queueResourceDelivery(req: DeliveryRequest): Promise<DeliveryOutcome> {
  const client = db();
  if (!client) {
    return {
      state: 'failed',
      note: 'Supabase is not configured for this deployment, so no delivery was queued.',
      messageId: null,
    };
  }

  const resourceId = resourceIdOf(req.resource);
  const template = resourceTemplateFor(resourceId);

  if (!template) {
    // A released resource with no reviewed wording. The request still stands;
    // somebody writes the wording. Falling back to another resource's email
    // would send this person the wrong worksheet, which is worse than waiting.
    return {
      state: 'blocked',
      note: `No resource-delivery wording exists for ${resourceId}. The request is saved; add the wording to src/lib/comms/templates.ts and have it approved before anything can be sent.`,
      messageId: null,
    };
  }

  const recipient = req.recipient.trim().toLowerCase();

  let verdict: Eligibility;
  try {
    verdict = await checkEligibility(
      client,
      {
        personId: req.personId,
        recipient,
        purpose: 'transactional',
        route: 'resource',
        templateKey: template.key,
        templateVersion: template.version,
        opportunityId: null,
        cohortId: null,
      },
      'queue',
    );
  } catch (err) {
    console.error('resource delivery eligibility threw:', err instanceof Error ? err.name : 'unknown');
    return {
      state: 'failed',
      note: 'The eligibility check could not be completed, so nothing was queued. The request is saved.',
      messageId: null,
    };
  }

  // The queue-time reduction: 'stop' and 'cancel' mean do not create the row;
  // 'hold' and an unanswered gate mean create it and let the dispatch check
  // decide. Same rule as `definiteRefusal()` in outbox.ts, expressed against the
  // verdict's own strongest effect because that helper is private to that file.
  if (verdict.effect === 'stop' || verdict.effect === 'cancel') {
    return {
      state: 'blocked',
      note: verdict.blocking.map((g) => `${g.label}: ${g.detail}`).join(' ').slice(0, 500),
      messageId: null,
      eligibility: verdict,
    };
  }

  const rendered = renderMessage(template);
  const key = idempotencyKey({
    scope: 'receipt',
    anchorId: req.requestId,
    templateKey: template.key,
    version: template.version,
  });

  try {
    const { data, error } = await client
      .from('comms_messages')
      .insert({
        idempotency_key: key,
        // No sequence, no opportunity, no submission. A resource request is
        // none of those things, and `resource_requests.delivery_message_id` is
        // the join back — see the schema note.
        sequence_id: null,
        person_id: req.personId,
        opportunity_id: null,
        submission_id: null,
        template_key: template.key,
        template_version: template.version,
        purpose: 'transactional',
        sequence_step: null,
        recipient,
        subject: rendered.subject,
        body: rendered.body,
        state: 'queued',
        scheduled_for: new Date().toISOString(),
        is_test: req.isTest === true,
      })
      .select('message_id')
      .maybeSingle();

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        // The idempotency key did its job: a retry under the same request key
        // resolves to the same request id and therefore the same message. This
        // is V4-E02's "repeated submit sends no duplicate receipt", proved by a
        // unique index rather than by a check somebody could race.
        return {
          state: 'queued',
          note: 'Already queued under the same idempotency key. One delivery, not two.',
          messageId: null,
          eligibility: verdict,
        };
      }
      console.error('resource delivery queue failed:', sqlstate(error));
      return {
        state: 'failed',
        note: 'The outbox did not accept the delivery. The request is saved; queue it by hand from the console.',
        messageId: null,
        eligibility: verdict,
      };
    }

    return {
      state: 'queued',
      note: verdict.sendable
        ? 'Queued. It is re-checked immediately before dispatch.'
        : `Queued and held — ${verdict.summary}`,
      messageId: data?.message_id ? String(data.message_id) : null,
      eligibility: verdict,
    };
  } catch (err) {
    console.error('resource delivery queue threw:', err instanceof Error ? err.name : 'unknown');
    return {
      state: 'failed',
      note: 'The outbox could not be reached. The request is saved; queue it by hand from the console.',
      messageId: null,
    };
  }
}

/**
 * Write the delivery outcome back onto the request row.
 *
 * BEST EFFORT, AND DELIBERATELY AFTER THE COMMIT. The request is already saved;
 * if this update fails the person has still made their request and the console
 * still shows it, merely with `delivery_state` left at 'pending'. Rolling the
 * request back because we could not annotate it would be losing the thing the
 * addendum says must be persisted first.
 */
export async function recordDelivery(requestId: string, outcome: DeliveryOutcome): Promise<void> {
  const client = db();
  if (!client) return;

  try {
    const { error } = await client
      .from('resource_requests')
      .update({
        delivery_state: outcome.state,
        delivery_note: outcome.note.slice(0, 500),
        delivery_message_id: outcome.messageId,
        delivery_at: new Date().toISOString(),
      })
      .eq('request_id', requestId);

    if (error) console.error('resource delivery writeback failed:', sqlstate(error));
  } catch (err) {
    console.error('resource delivery writeback threw:', err instanceof Error ? err.name : 'unknown');
  }
}

/**
 * The second sentence a visitor reads, derived from what actually happened.
 *
 * IT MUST NOT SAY "CHECK YOUR INBOX". Nothing can be sent while dispatch is off,
 * and a success page that describes an email nobody will receive is the same
 * class of lie as a page that says "received" over a row that does not exist.
 * The one thing this can always say truthfully is the thing that matters most
 * here: the worksheet is on the page, and it was never behind the email.
 */
export const deliveryLine = (state: DeliveryState): string => {
  switch (state) {
    case 'queued':
      return 'The delivery email is queued. Email sending is not switched on yet, so it has not gone out — the worksheet itself is on this page and was never behind it.';
    case 'blocked':
    case 'failed':
      return 'We could not queue the delivery email and somebody will see that. The worksheet itself is on this page and was never behind it.';
    case 'pending':
      return 'The worksheet itself is on this page and was never behind the email.';
  }
};
