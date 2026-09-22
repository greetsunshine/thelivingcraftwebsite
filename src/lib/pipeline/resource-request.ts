// The optional "email me this" request, as one function two routes share.
//
// /api/pipeline/resource answers with JSON. /api/pipeline/resource-pdf answers
// with a built PDF. Both run exactly this sequence first: rate limit, honeypot,
// idempotency key, resolve the resource, validate the two fields, build the
// attribution, save, queue the delivery, record the event. Writing the sequence
// twice is how one route gets a check the other forgot. So it lives here, and
// each route is a thin translation of the outcome into its own response.
//
// ───────────────────────────────────────────────────────────────────────────
// THE RESOURCE IS NOT BEHIND THIS, AND THAT CHANGES EVERYTHING.
// ───────────────────────────────────────────────────────────────────────────
//
// The V4 addendum: resources are OPEN. The HTML is the resource, the CSV
// downloads without asking anybody for anything, and this path exists for the
// person who would rather have a copy in their inbox — or, for the POC
// Selection Tool, a PDF of their scored copy.
//
// That is not a detail about the copy. It changes what this path is allowed to
// assume. A gated download can treat an address as the price of entry; an
// optional one cannot treat it as anything except a request for an email. So:
//
//   * A failure here costs the visitor NOTHING they did not already have. The
//     page is still open. The error message says so, because the honest
//     reassurance is better than an apology.
//   * An address given here is permission to send THIS, once. It is not
//     permission to send the cohort sequence, and the addendum says so twice.
//
// ───────────────────────────────────────────────────────────────────────────
// THE THREE THINGS THIS MUST NOT DO — V4-E02 AND V4-E05
// ───────────────────────────────────────────────────────────────────────────
//
// 1. **It must not create a person from a view or a download.** Those are
//    `events` rows written by the beacon and nothing else. Only a POST carrying
//    an address somebody typed creates anybody. The addendum: "Anonymous
//    resource views/downloads are events, not people."
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
// rule as /api/pipeline/submit, same shape, same reasons. Success is reported
// only after a commit; a database failure is an `unsaved` outcome with a
// sentence the browser shows verbatim; a repeat under the same key returns the
// first answer rather than making a second record.
//
// The delivery is queued through stage 4's outbox AFTER the commit, and
// dispatch is off (decision D2). So the honest answer today is "saved, and it
// will be sent when sending is switched on" — which is what `deliveryLine()`
// says, rather than an implied promise that mail is on its way.

import type { APIContext } from 'astro';
import {
  buildAttribution,
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_MAX_AGE,
  serialiseFirstTouch,
} from './attribution';
import {
  deliveryLine,
  queueResourceDelivery,
  recordDelivery,
  resolveResource,
  resourceIdOf,
  RESOURCE_SAVED,
  saveResourceRequest,
  validateResourceRequest,
  type DeliveryState,
  type RequestableResource,
  type ResourceKind,
} from './resources';
import type { FieldError } from './forms';
import { checkRate } from '../agent/ratelimit';
import { record } from '../admin/supabase';
import { deviceOf } from '../admin/visitor';

const REFUSED = 'We could not accept that request. The page is the resource either way.';

export type ResourceRequestOutcome =
  /** Refused before anything was saved. `status` and `body` go back as they are. */
  | {
      kind: 'refused';
      status: 400 | 409 | 429;
      body: { ok: false; error: string } | { ok: false; errors: FieldError[] };
    }
  /** Valid, but the save did not commit. Nothing is recorded and nothing is queued. */
  | { kind: 'unsaved'; resource: RequestableResource; message: string }
  /** Committed. `delivery` is null for a repeat under the same key. */
  | {
      kind: 'saved';
      resource: RequestableResource;
      alreadyExisted: boolean;
      confirmation: string;
      delivery: string | null;
      deliveryState: DeliveryState | null;
    };

/**
 * Run the whole request. The caller has already parsed the JSON body; this
 * reads the fields it knows and ignores the rest, so a route can carry extra
 * fields of its own (the PDF route carries the scores) without this function
 * learning about them.
 */
export async function handleResourceRequest(
  ctx: Pick<APIContext, 'request' | 'clientAddress' | 'cookies' | 'url'>,
  body: Record<string, unknown>,
  opts: {
    /**
     * A resource the route has already resolved from its own registry (the
     * download route knows templates the two registers do not). When given,
     * `body.resource` is not resolved again here.
     */
    resource?: RequestableResource;
    /**
     * What the route is handing over. The route decides this, not the body:
     * the email route hands over nothing and must say `'email'` whatever was
     * posted, otherwise a crafted POST records a `pdf` request in
     * `resource_requests` with no file behind it, and the marketing view
     * counts a download that never happened. The download route passes the
     * kind it has already validated against its own registry.
     */
    kind: ResourceKind;
  },
): Promise<ResourceRequestOutcome> {
  const { request, clientAddress, cookies, url } = ctx;

  const gate = checkRate(`resource:${clientAddress ?? 'unknown'}`);
  if (!gate.ok) {
    return {
      kind: 'refused',
      status: 429,
      body: { ok: false, error: 'Too many attempts from this connection. Wait a minute and try again.' },
    };
  }

  // Honeypot, same as the three cohort routes. A bot check that does not
  // obstruct keyboard users is what the brief asks for; a CAPTCHA on an
  // optional convenience would be absurd.
  if (typeof body.botcheck === 'string' && body.botcheck.trim() !== '') {
    return { kind: 'refused', status: 400, body: { ok: false, error: REFUSED } };
  }

  const requestKey = typeof body.requestKey === 'string' ? body.requestKey.trim() : '';
  if (!requestKey || requestKey.length > 100) {
    return { kind: 'refused', status: 400, body: { ok: false, error: REFUSED } };
  }

  // ---- which resource? ----------------------------------------------------
  //
  // Resolved from our own registers, never trusted as given. `unreleased` is
  // answered differently from `unknown` on purpose: a draft resource is a real
  // identifier for a page that does not exist yet, and accepting a request for
  // it would be a stronger claim than the toolkit is allowed to make by
  // displaying it.
  let resource: RequestableResource;
  if (opts.resource) {
    resource = opts.resource;
  } else {
    const lookup = resolveResource(body.resource);
    if (lookup.state === 'unknown') {
      return { kind: 'refused', status: 400, body: { ok: false, error: REFUSED } };
    }
    if (lookup.state === 'unreleased') {
      return {
        kind: 'refused',
        status: 409,
        body: {
          ok: false,
          error: 'That one is not published yet. Nothing has been saved and nothing will be sent.',
        },
      };
    }
    resource = lookup.resource;
  }

  // What is being handed over: the route's word, never the body's.
  const kind = opts.kind;

  // ---- validation, server-side and authoritative --------------------------
  const { values, errors } = validateResourceRequest(
    (body.answers ?? {}) as Record<string, unknown>,
  );
  if (errors.length) return { kind: 'refused', status: 400, body: { ok: false, errors } };

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
  const saved = await saveResourceRequest({ requestKey, resource, values, attribution, kind });

  if (!saved.ok) {
    return { kind: 'unsaved', resource, message: saved.message };
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
  let deliveryState: DeliveryState | null = null;
  if (!saved.alreadyExisted) {
    const outcome = await queueResourceDelivery({
      requestId: saved.requestId,
      personId: saved.personId,
      recipient: values.email,
      resource,
    });
    await recordDelivery(saved.requestId, outcome);
    deliveryState = outcome.state;

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

  return {
    kind: 'saved',
    resource,
    alreadyExisted: saved.alreadyExisted,
    confirmation: RESOURCE_SAVED,
    // Says what will actually happen, including "nothing yet, because sending
    // is off". An implied promise that mail is on its way would be the same
    // class of lie as a success over an uncommitted row.
    delivery: deliveryState ? deliveryLine(deliveryState) : null,
    deliveryState,
  };
}
