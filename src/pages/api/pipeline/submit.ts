// The one public write path into the pipeline.
//
// ───────────────────────────────────────────────────────────────────────────
// THIS ENDPOINT IS ALLOWED TO FAIL. IT IS NOT ALLOWED TO LIE.
// ───────────────────────────────────────────────────────────────────────────
//
// Every other write on this site is fire-and-forget: /api/track and /api/lead
// both return 204 whatever happens, because the visitor has already been told
// their lead went through by Web3Forms and there is nothing useful to say.
//
// This one is the opposite, and the difference is the whole point of the
// rebuild. Here the database IS the delivery. A 204 that swallowed a failure
// would be somebody reading "your application has been received" over a row
// that does not exist — and they would find out weeks later, having heard
// nothing, when the cohort was full. Acceptance case E03 in one sentence.
//
// So: success is returned only after a commit, failures carry a real status
// code and a sentence the browser shows verbatim, and the form keeps everything
// typed so the retry costs the person nothing.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT IS TRUSTED, AND WHAT IS NOT
// ───────────────────────────────────────────────────────────────────────────
//
//   route            trusted — a statement of what they want
//   requestKey       trusted as an opaque string, never as a claim
//   answers          validated against forms.ts, always, server-side
//   search/referrer  raw from the browser, sanitised here (attribution.ts)
//   cohort id        NOT ACCEPTED. Resolved from our own configuration.
//   consent          a boolean; the WORDS come from consent.ts, not the request
//
// The last two matter most. A hidden cohort field would let anyone file an
// application against a closed cohort; a posted consent string would let anyone
// write their own version of what they agreed to into our evidence.

import type { APIRoute } from 'astro';
import { buildAttribution, FIRST_TOUCH_COOKIE, FIRST_TOUCH_MAX_AGE, serialiseFirstTouch } from '../../../lib/pipeline/attribution';
import { resolveCohort, routeIsOpen } from '../../../lib/pipeline/cohorts';
import { isRoute, validate } from '../../../lib/pipeline/forms';
import { confirmationFor, saveSubmission } from '../../../lib/pipeline/submit';
import { checkRate } from '../../../lib/agent/ratelimit';
import { record } from '../../../lib/admin/supabase';
import { deviceOf } from '../../../lib/admin/visitor';
import { queueForSubmission } from '../../../lib/comms/outbox';

export const prerender = false;

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });

/**
 * The generic refusal.
 *
 * Deliberately vague about WHY for the bot cases — a honeypot that explains it
 * caught you is a honeypot that gets fixed. Real people never see this.
 */
const REFUSED = 'We could not accept that submission. Please email apply@thelivingcraft.ai.';

export const POST: APIRoute = async ({ request, clientAddress, cookies, url }) => {
  // ---- 1. cheap refusals, before anything touches the database -------------

  const gate = checkRate(`pipeline:${clientAddress ?? 'unknown'}`);
  if (!gate.ok) {
    // 429 with a sentence rather than a silent drop: a real person behind a
    // shared office IP can hit this, and they deserve to know to wait.
    return json(
      { ok: false, error: 'Too many attempts from this connection. Wait a minute and try again.' },
      429,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: REFUSED }, 400);
  }

  const route = body.route;
  if (!isRoute(route)) return json({ ok: false, error: REFUSED }, 400);

  // The honeypot. Answered = not a person. Returns 400 rather than a fake
  // success: there is no visitor to protect from disappointment here, and a
  // 200 would tell a scripted submitter that its fill-everything strategy
  // works.
  if (typeof body.botcheck === 'string' && body.botcheck.trim() !== '') {
    return json({ ok: false, error: REFUSED }, 400);
  }

  const requestKey = typeof body.requestKey === 'string' ? body.requestKey.trim() : '';
  if (!requestKey || requestKey.length > 100) {
    return json({ ok: false, error: REFUSED }, 400);
  }

  // ---- 2. validation, server-side and authoritative ------------------------

  const answers = (body.answers ?? {}) as Record<string, unknown>;
  const { values, errors } = validate(route, answers);

  if (errors.length) {
    // 400 with the field-level detail the form renders beside each input. The
    // codes are categories — 'too_long', 'invalid_email' — and carry none of
    // the rejected content, which is what the analytics contract requires of
    // the form_error event these become in the browser.
    return json({ ok: false, errors }, 400);
  }

  // ---- 3. is this route even open? ----------------------------------------

  const lookup = await resolveCohort();
  const gateState = routeIsOpen(route, lookup);
  if (!gateState.open) {
    // The status comes from cohorts.ts, because only that module knows whether
    // this is a state we OBSERVED (409, retrying will not help) or one we could
    // not read (503, retrying is exactly right). Collapsing them here would put
    // the two back together, which is the thing that was just taken apart.
    return json({ ok: false, error: gateState.reason }, gateState.status);
  }
  const cohort = lookup.state === 'ok' ? lookup.cohort : null;

  // ---- 4. attribution -----------------------------------------------------

  // There is no consent mechanism on this site yet, so this is false at every
  // request and first-touch stays unknown. That is the correct behaviour and
  // acceptance case E07 depends on it, not a placeholder to be flipped for
  // convenience — flipping it needs a consent control in front of a visitor
  // first. See the note at the head of attribution.ts.
  const trackingPermitted = false;

  const { row: attribution, writeFirstTouch } = buildAttribution({
    search: typeof body.search === 'string' ? body.search : '',
    referrer: typeof body.referrer === 'string' ? body.referrer : '',
    path: typeof body.entryPath === 'string' ? body.entryPath : '/',
    selfHost: url.hostname,
    selfReported: values.discovery ?? null,
    permitted: trackingPermitted,
    storedFirstTouch: cookies.get(FIRST_TOUCH_COOKIE)?.value,
  });

  // ---- 5. the save --------------------------------------------------------

  const result = await saveSubmission({
    route,
    requestKey,
    values,
    attribution,
    marketingConsent: body.marketingConsent === true,
    cohort,
  });

  if (!result.ok) {
    // 503, not 500: this is "come back in a moment", and the browser's retry
    // will carry the same request key, so a save that actually landed before
    // the connection dropped returns its original reference rather than a
    // second record.
    return json({ ok: false, error: result.message }, 503);
  }

  // ---- 6. after the commit ------------------------------------------------

  if (writeFirstTouch) {
    cookies.set(FIRST_TOUCH_COOKIE, serialiseFirstTouch(writeFirstTouch, new Date().toISOString()), {
      path: '/',
      maxAge: FIRST_TOUCH_MAX_AGE,
      sameSite: 'lax',
      httpOnly: true,
      secure: url.protocol === 'https:',
    });
  }

  // Queue the acknowledgement only after the application transaction commits.
  // Message keys are derived from the submission id, so sending the same
  // request key again repairs an interrupted queue attempt without creating a
  // duplicate receipt. Dispatch remains independently gated by the comms
  // service switch, approvals, suppression and consent rules.
  try {
    const queued = await queueForSubmission({
      submissionId: result.submissionId,
      personId: result.personId,
      opportunityId: result.opportunityId,
      cohortId: cohort?.cohort_id ?? null,
      route,
      recipient: values.email ?? '',
      anchorAt: new Date().toISOString(),
    });
    if (!queued.ok) {
      console.error(`queueForSubmission failed [${route}]: outcome_not_ok`);
    }
  } catch (err) {
    // The committed application remains the source of truth. A retry with the
    // same request key safely re-attempts this idempotent queue operation.
    console.error(
      `queueForSubmission threw [${route}]:`,
      err instanceof Error ? err.name : 'unknown',
    );
  }

  // The authoritative saved event. Two properties the brief asks for by name:
  // it is emitted by the SERVER after the commit, so backend totals survive a
  // visitor declining analytics; and it carries an opaque id and nothing else —
  // no name, no email, no answer text.
  //
  // Only on a genuinely new record. A retry must not count twice, which is the
  // reporting half of the same idempotency the reference guarantees the person.
  if (!result.alreadyExisted && deviceOf(request) !== 'bot') {
    await record('events', {
      type: route === 'application' ? 'application_saved' : 'enquiry_saved',
      path: attribution.entry_path ?? '/',
      referrer_host: attribution.referrer_host,
      meta: { submission_id: result.submissionId, route },
    });
  }

  return json(
    {
      ok: true,
      reference: result.reference,
      alreadyExisted: result.alreadyExisted,
      confirmation: confirmationFor(route),
    },
    200,
  );
};

/**
 * Everything else is refused explicitly.
 *
 * A GET on this path is either a crawler or somebody poking at it. robots.txt
 * disallows /api/pipeline for the same reason it disallows the other POST
 * endpoints: there is nothing to index and indexing it pollutes the data.
 */
export const ALL: APIRoute = () =>
  new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
