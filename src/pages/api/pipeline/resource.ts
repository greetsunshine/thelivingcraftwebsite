// The optional "email me this worksheet" request.
//
// ───────────────────────────────────────────────────────────────────────────
// THE WORKSHEET IS NOT BEHIND THIS ENDPOINT, AND THAT CHANGES EVERYTHING.
// ───────────────────────────────────────────────────────────────────────────
//
// The V4 addendum: resources are OPEN. The HTML is the resource, the CSV
// downloads without asking anybody for anything, and this endpoint exists only
// for the person who would rather have a copy in their inbox.
//
// That is not a detail about the copy. It changes what this route is allowed
// to assume. A gated download can treat an address as the price of entry; an
// optional one cannot treat it as anything except a request for an email. So:
//
//   * A failure here costs the visitor NOTHING. They already have the
//     worksheet. The error message says so, because the honest reassurance is
//     better than an apology.
//   * An address given here is permission to send THIS, once. It is not
//     permission to send the cohort sequence, and the addendum says so twice.
//
// ───────────────────────────────────────────────────────────────────────────
// THE THREE THINGS THIS MUST NOT DO — V4-E02 AND V4-E05
// ───────────────────────────────────────────────────────────────────────────
//
// 1. **It must not create a person from a view or a download.** Those are
//    `events` rows written by the beacon and nothing else. Only a POST to this
//    endpoint, carrying an address somebody typed, creates anybody. The
//    addendum: "Anonymous resource views/downloads are events, not people."
//
//    The failure it prevents is quiet and expensive: a worksheet gets two
//    hundred downloads, and a dashboard that counted them as people reports two
//    hundred leads to the one person who most needs that number to be true.
//
// 2. **It must not become an application.** A resource request is its own
//    record type with its own table. It shares the `people` row — same
//    deduplication, same trimmed case-normalised email, plus-tags NOT stripped
//    — and nothing else. Somebody who wanted a worksheet has not applied.
//
// 3. **It must not start marketing.** Consent is a separate affirmative act
//    with its own wording and version (consent.ts). Wanting a PDF is not
//    agreeing to a nurture sequence, and inferring one from the other is the
//    thing the addendum, the release controls and the growth handling note all
//    forbid independently.
//
// ───────────────────────────────────────────────────────────────────────────
// AND IT MUST NOT LIE — V4-E03
// ───────────────────────────────────────────────────────────────────────────
//
// "Persist the request and idempotency key before displaying success." Same
// rule as /api/pipeline/submit, same shape, same reasons. Success is returned
// only after a commit; a database failure is a 503 with a sentence the browser
// shows verbatim; a repeat under the same key returns the first answer rather
// than making a second record.
//
// The delivery is queued through stage 4's outbox AFTER the commit, and
// dispatch is off (decision D2). So the honest answer today is "saved, and it
// will be sent when sending is switched on" — which is what `deliveryLine()`
// says, rather than an implied promise that mail is on its way.

import type { APIRoute } from 'astro';
import {
  buildAttribution,
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_MAX_AGE,
  serialiseFirstTouch,
} from '../../../lib/pipeline/attribution';
import {
  deliveryLine,
  queueResourceDelivery,
  recordDelivery,
  resolveResource,
  resourceIdOf,
  RESOURCE_SAVED,
  saveResourceRequest,
  validateResourceRequest,
} from '../../../lib/pipeline/resources';
import { checkRate } from '../../../lib/agent/ratelimit';
import { record } from '../../../lib/admin/supabase';
import { deviceOf } from '../../../lib/admin/visitor';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const REFUSED = 'We could not accept that request. The worksheet is on the page either way.';

export const POST: APIRoute = async ({ request, clientAddress, cookies, url }) => {
  const gate = checkRate(`resource:${clientAddress ?? 'unknown'}`);
  if (!gate.ok) {
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

  // Honeypot, same as the three cohort routes. A bot check that does not
  // obstruct keyboard users is what the brief asks for; a CAPTCHA on an
  // optional convenience would be absurd.
  if (typeof body.botcheck === 'string' && body.botcheck.trim() !== '') {
    return json({ ok: false, error: REFUSED }, 400);
  }

  const requestKey = typeof body.requestKey === 'string' ? body.requestKey.trim() : '';
  if (!requestKey || requestKey.length > 100) return json({ ok: false, error: REFUSED }, 400);

  // ---- which resource? ----------------------------------------------------
  //
  // Resolved from our own register, never trusted as given. `unreleased` is
  // answered differently from `unknown` on purpose: a draft resource is a real
  // identifier for a page that does not exist yet, and accepting a request for
  // it would be a stronger claim than the toolkit is allowed to make by
  // displaying it.
  const lookup = resolveResource(body.resource);
  if (lookup.state === 'unknown') {
    return json({ ok: false, error: REFUSED }, 400);
  }
  if (lookup.state === 'unreleased') {
    return json(
      {
        ok: false,
        error: 'That one is not published yet. Nothing has been saved and nothing will be sent.',
      },
      409,
    );
  }
  const resource = lookup.resource;

  // ---- validation, server-side and authoritative --------------------------
  const { values, errors } = validateResourceRequest(
    (body.answers ?? {}) as Record<string, unknown>,
  );
  if (errors.length) return json({ ok: false, errors }, 400);

  // ---- attribution --------------------------------------------------------
  //
  // `resourceId` is the V4 addendum's permitted non-personal dimension. Note
  // what is NOT sent anywhere: the address, the name, anything typed. The
  // addendum: "No personal details in analytics URLs or payloads."
  //
  // `permitted` is false because no consent control exists on this site, so
  // first touch stays unknown — see the head of attribution.ts. That is
  // deliberate and it is what V4-E01 depends on being honest about: an
  // internal referral from a worksheet to the cohort page must never overwrite
  // an external first source, and the safest way to guarantee that is to hold
  // no first source at all until somebody has agreed to it.
  const trackingPermitted = false;

  const { row: attribution, writeFirstTouch } = buildAttribution({
    search: typeof body.search === 'string' ? body.search : '',
    referrer: typeof body.referrer === 'string' ? body.referrer : '',
    path: typeof body.entryPath === 'string' ? body.entryPath : '/',
    selfHost: url.hostname,
    selfReported: null,
    permitted: trackingPermitted,
    storedFirstTouch: cookies.get(FIRST_TOUCH_COOKIE)?.value,
    resourceId: resourceIdOf(resource),
  });

  // ---- the save -----------------------------------------------------------
  const saved = await saveResourceRequest({
    requestKey,
    resource,
    values,
    attribution,
  });

  if (!saved.ok) {
    // 503 and a retry. The message already says the worksheet is not behind
    // this, which is the one reassurance only this route can honestly give.
    return json({ ok: false, error: saved.message }, 503);
  }

  // ---- after the commit ---------------------------------------------------

  if (writeFirstTouch) {
    cookies.set(
      FIRST_TOUCH_COOKIE,
      serialiseFirstTouch(writeFirstTouch, new Date().toISOString()),
      {
        path: '/',
        maxAge: FIRST_TOUCH_MAX_AGE,
        sameSite: 'lax',
        httpOnly: true,
        secure: url.protocol === 'https:',
      },
    );
  }

  // Queue the delivery only for a genuinely new request. A repeat under the
  // same key must not produce a second email — "repeated submit sends no
  // duplicate receipt" is half of V4-E02, and the outbox is not the place to
  // discover that: by the time a message exists, deduplicating it is guesswork.
  let delivery = null;
  if (!saved.alreadyExisted) {
    const outcome = await queueResourceDelivery({
      requestId: saved.requestId,
      personId: saved.personId,
      recipient: values.email,
      resource,
    });
    await recordDelivery(saved.requestId, outcome);
    delivery = outcome.state;

    // The authoritative saved event: server-side, after the commit, carrying an
    // opaque id and the resource code and nothing else. Backend totals survive
    // a visitor declining analytics, which is what the reporting controls
    // require of a "resource requests" figure.
    if (deviceOf(request) !== 'bot') {
      await record('events', {
        type: 'resource_requested',
        path: attribution.entry_path ?? '/',
        referrer_host: attribution.referrer_host,
        meta: { request_id: saved.requestId, resource_id: resourceIdOf(resource) },
      });
    }
  }

  return json(
    {
      ok: true,
      alreadyExisted: saved.alreadyExisted,
      confirmation: RESOURCE_SAVED,
      // Says what will actually happen, including "nothing yet, because
      // sending is off". An implied promise that mail is on its way would be
      // the same class of lie as a success over an uncommitted row.
      delivery: delivery ? deliveryLine(delivery) : null,
    },
    200,
  );
};

/**
 * Everything else is refused. robots.txt disallows /api/pipeline for the same
 * reason it disallows the other POST endpoints: nothing to index, and a
 * crawler hitting it rate-limits real people for no gain.
 */
export const ALL: APIRoute = () =>
  new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
