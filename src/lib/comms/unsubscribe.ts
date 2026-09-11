// One signed, opaque action. No login, no address on the screen, no oracle.
//
// ───────────────────────────────────────────────────────────────────────────
// THE FOUR PROPERTIES, AND THE FAILURE EACH ONE PREVENTS
// ───────────────────────────────────────────────────────────────────────────
//
// The brief: "Unsubscribe is one action through a signed opaque link without
// login; it changes marketing preference and cancels queued messages without
// exposing contact information. Show generic confirmation for invalid/expired
// links with a contact route."
//
//   1. SIGNED. The payload is HMAC'd with `COMMS_LINK_SECRET`. Without that,
//      the link is `?person=<uuid>` and anybody who can guess or scrape a uuid
//      can unsubscribe somebody else. The signature is checked BEFORE the
//      payload is read, for the same reason it is in `lib/admin/auth.ts`:
//      deciding anything on unverified input is how attacker-chosen data gets
//      trusted.
//
//   2. OPAQUE. The token carries a person id and an expiry, and NOT an email
//      address, a name, a route or a sequence. A link forwarded to a colleague,
//      logged by a mail scanner, or sitting in a proxy's access log therefore
//      discloses nothing about who it belongs to.
//
//   3. NO LITERAL TOKEN IN THE OUTBOX. `comms_messages.body` keeps the action
//      PLACEHOLDER. The token is minted by the provider adapter at the moment
//      of dispatch, so rotating this secret invalidates outstanding links
//      without rewriting a single queued row, and a console reader cannot lift
//      a working unsubscribe link for somebody else out of the outbox.
//
//   4. NO MEMBERSHIP ORACLE. Every request to the endpoint gets the SAME page,
//      byte for byte — valid token, expired token, forged token, unknown
//      person, database down. "That address is not subscribed" and "we have
//      unsubscribed you" are the same sentence with different information in
//      it, and the second one tells a stranger that an address is on our list.
//      The page therefore never branches on anything it learned, and this
//      module never returns anything to the endpoint that would tempt it to.
//
// ───────────────────────────────────────────────────────────────────────────
// WHY UNSUBSCRIBE PROCESSING BEING UNAVAILABLE DISABLES NURTURE
// ───────────────────────────────────────────────────────────────────────────
//
// "If reply detection or unsubscribe processing is unavailable, disable
// nurture." Without `COMMS_LINK_SECRET` this module cannot sign a link, so a
// message carrying an unsubscribe action could not be honoured if somebody
// acted on it. Sending marketing that a person cannot opt out of is worse than
// sending none, so `available()` is a hard gate in eligibility.ts rather than a
// warning on a screen.

import { db } from '../admin/supabase';
import { env } from '../admin/env';
import { MARKETING_CONSENT } from '../pipeline/consent';

const enc = new TextEncoder();

/**
 * Four hundred days.
 *
 * Long, deliberately. A short expiry turns somebody's legitimate request into a
 * dead link, and the person who finds a fourteen-month-old message in their
 * archive and wants out is exactly the person whose request must not fail. The
 * expiry exists only to bound the life of a link that leaked, and it is backed
 * up by a secret that can be rotated — which invalidates every outstanding link
 * at once and costs nothing, because no token was ever stored.
 */
const TTL_MS = 400 * 24 * 60 * 60 * 1000;

const b64url = (bytes: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64url = (value: string): string => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return new TextDecoder().decode(
    Uint8Array.from(atob(padded + '='.repeat((4 - (padded.length % 4)) % 4)), (c) =>
      c.charCodeAt(0),
    ),
  );
};

const secret = (): string => env('COMMS_LINK_SECRET');

/**
 * Whether unsubscribe processing is in service at all.
 *
 * One of the launch dependencies the brief names by name, and one of the two
 * that switch nurture off when absent.
 */
export const available = (): boolean => Boolean(secret());

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

/** Content-constant comparison. Same argument as `safeEqual` in admin/auth.ts. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * What travels in the link. Field names are one character because this sits in
 * a URL that has to survive being wrapped by a mail client.
 *
 * `p` is the person. There is deliberately no email, no sequence id and no
 * route: an unsubscribe is a decision about a person's marketing permission,
 * and the queued messages to cancel are looked up server-side from `p`.
 */
interface TokenPayload {
  p: string;
  /** Version, so a future payload shape can be told apart rather than guessed. */
  v: 1;
}

/**
 * Mint a link token. Returns null when the secret is not configured — which is
 * the honest answer, and the caller must treat it as "this message cannot be
 * sent" rather than as "send it without a footer".
 */
export async function signToken(personId: string): Promise<string | null> {
  if (!available()) return null;
  const expires = String(Date.now() + TTL_MS);
  const payload = b64url(enc.encode(JSON.stringify({ p: personId, v: 1 } satisfies TokenPayload)));
  const body = `${expires}.${payload}`;
  return `${body}.${await sign(body)}`;
}

/**
 * The person this token names, or null.
 *
 * Every failure returns null and says nothing about which one it was. The
 * endpoint does not get a reason because there is no reason it could safely
 * put on the page, and a reason it holds is a reason that ends up in a log
 * beside a request id.
 */
export async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token || !available()) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [expires, payload, mac] = parts;

  if (!safeEqual(mac, await sign(`${expires}.${payload}`))) return null;

  const at = Number(expires);
  if (!Number.isFinite(at) || at <= Date.now()) return null;

  try {
    const parsed = JSON.parse(fromB64url(payload)) as Partial<TokenPayload>;
    return typeof parsed.p === 'string' && parsed.p.length > 0 && parsed.p.length <= 60
      ? parsed.p
      : null;
  } catch {
    return null;
  }
}

/** Where a minted token goes. The endpoint is public; nothing under /craft is. */
export const unsubscribeUrl = (origin: string, token: string): string =>
  `${origin.replace(/\/+$/, '')}/api/unsubscribe?u=${encodeURIComponent(token)}`;

/**
 * Do the four things an unsubscribe means, in the order that matters most
 * first.
 *
 * The return value says only whether every part was recorded, and NOTHING about
 * whether the person existed or was subscribed. The endpoint does not render it
 * — see property 4 at the head of this file — it exists so the server log can
 * carry a category.
 *
 * WHY WITHDRAWAL IS A NEW ROW. `consents` has an UPDATE trigger that refuses,
 * and this module would write a new row regardless: the evidence that
 * permission was once given is exactly the evidence needed when somebody later
 * asks why they used to receive something.
 *
 * WHY THE SEQUENCE IS STOPPED AND NOT PAUSED. Unsubscribe is on the brief's
 * stop list, and stopped never restarts automatically. A paused sequence is one
 * an operator may resume after review; this one must not be resumable by
 * anybody, and `resumeSequence()` in outbox.ts only ever looks at 'paused'.
 */
export async function applyUnsubscribe(
  personId: string,
  source = 'unsubscribe-link',
): Promise<{ recorded: boolean }> {
  const client = db();
  if (!client) return { recorded: false };

  let recorded = true;
  const failed = (what: string, error: unknown) => {
    recorded = false;
    // Never the error text: PostgREST puts filter values in the URL and a
    // Postgres message quotes the offending literal. Here that literal is an
    // email address.
    console.error(
      `unsubscribe ${what} failed:`,
      (error as { code?: string })?.code ?? 'unknown',
    );
  };

  // One read, and only one: the suppression list is keyed on the address rather
  // than on the person, on purpose — see the schema comment. That is the only
  // reason this module ever touches `people`.
  const { data: person, error: readErr } = await client
    .from('people')
    .select('normalised_email')
    .eq('person_id', personId)
    .maybeSingle();

  if (readErr) failed('person read', readErr);

  const email = typeof person?.normalised_email === 'string' ? person.normalised_email : null;

  // 1. Suppression first. It is the thing that must be true even if everything
  //    below fails, because it is what stands between this person and the next
  //    dispatch sweep. Scope 'marketing': a receipt for something they asked us
  //    to do is still owed to them.
  if (email) {
    const { error } = await client.from('comms_suppressions').insert({
      normalised_email: email,
      person_id: personId,
      reason: 'unsubscribe',
      scope: 'marketing',
      source,
      detail: null,
    });
    // 23505 is "already suppressed", which is the correct end state and not a
    // failure. The table refuses UPDATE and DELETE, so a second unsubscribe is
    // a no-op by design rather than by luck.
    if (error && error.code !== '23505') failed('suppression insert', error);
  }

  // 2. The permission itself, as a new row pointing at the wording that was
  //    granted — not at today's wording, which may have been reworded twice
  //    since they ticked the box.
  const { data: granted } = await client
    .from('consents')
    .select('wording, wording_version')
    .eq('person_id', personId)
    .eq('purpose', 'marketing')
    .order('obtained_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: consentErr } = await client.from('consents').insert({
    person_id: personId,
    purpose: 'marketing',
    state: 'withdrawn',
    wording: granted?.wording ?? MARKETING_CONSENT.wording,
    wording_version: granted?.wording_version ?? MARKETING_CONSENT.version,
    source,
    withdrawn_at: new Date().toISOString(),
  });
  if (consentErr) failed('consent withdrawal', consentErr);

  // 3. Stop the sequence. Terminal, and nothing in this codebase moves it back.
  const { error: seqErr } = await client
    .from('comms_sequences')
    .update({
      state: 'stopped',
      stopped_at: new Date().toISOString(),
      stopped_reason: 'unsubscribe',
    })
    .eq('person_id', personId)
    .in('state', ['active', 'paused']);
  if (seqErr) failed('sequence stop', seqErr);

  // 4. Cancel what is already queued. Without this, the unsubscribe is honoured
  //    from tomorrow and the day-5 message still goes out tonight.
  const { error: msgErr } = await client
    .from('comms_messages')
    .update({
      state: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: 'unsubscribed before this was due',
    })
    .eq('person_id', personId)
    .eq('purpose', 'marketing')
    .eq('state', 'queued');
  if (msgErr) failed('queued cancel', msgErr);

  return { recorded };
}

/**
 * The page. One string, rendered for every caller, whatever happened.
 *
 * Read the four sentences as a contract rather than as copy:
 *   * It confirms an action without confirming a membership.
 *   * It gives a contact route, which is what an invalid or expired link needs
 *     and what a working one needs too.
 *   * It says nothing automated is being sent, because that is true today and
 *     because somebody arriving here from an old message deserves to know.
 *   * It separates unsubscribe from erasure, which the brief requires and which
 *     people conflate constantly.
 */
export const CONFIRMATION = {
  title: 'Your request has been recorded',
  lines: [
    'If this link belonged to a marketing message from The Living Craft, the permission it covers has been withdrawn and anything queued has been cancelled.',
    'No automated email is currently being sent by The Living Craft to anybody. If you receive anything you did not expect, or this link had expired, write one line to apply@thelivingcraft.ai and a person will make the change.',
    'This does not delete your details, and it does not stop a person replying to a question you asked us. Those are different requests — how your details are handled is on the privacy page.',
  ],
  contact: 'apply@thelivingcraft.ai',
} as const;
