// Where somebody came from — and the two answers that are not the same answer.
//
// ───────────────────────────────────────────────────────────────────────────
// FIRST TOUCH AND THIS VISIT ARE DIFFERENT FACTS. NEITHER CORRECTS THE OTHER.
// ───────────────────────────────────────────────────────────────────────────
//
// The operating guide's example is the whole design: somebody meets Sunil on
// LinkedIn in March and types the URL directly in September. First touch is
// LinkedIn. This visit is direct. Both are true. Collapsing them into one
// "source" column means picking which truth to destroy, and every attribution
// model that does it is picking on your behalf, silently, by a rule nobody in
// the room agreed.
//
// So there are two sets of five columns, and a third field — what the person
// said themselves — which is EVIDENCE, NEVER AN OVERRIDE. Three imperfect
// accounts of one thing, kept apart, is more useful to Sunil than one confident
// number that is wrong in a way nobody can see.
//
// ───────────────────────────────────────────────────────────────────────────
// FIRST TOUCH NEEDS MEMORY, AND THIS SITE DELIBERATELY HAS ALMOST NONE.
// ───────────────────────────────────────────────────────────────────────────
//
// CLAUDE.md: "No localStorage/sessionStorage." That rule is not incidental —
// it is stated as a hard rule and it has survived the console, the Ask widget
// and the analytics beacon. Remembering March in September requires persisting
// something across visits, which is exactly what the rule forbids.
//
// The narrow widening, and it is narrow:
//
//   * Two first-party cookies, not localStorage. Each holds five short tags,
//     a page path, a bare host and a date. No identifier, no hash of
//     anything, nothing that survives clearing site data.
//       lc_first  the first arrival. 400 days. Written once, never replaced.
//       lc_last   how this visit began. A session cookie: it goes when the
//                 browser closes, and each new arrival from outside replaces it.
//   * WRITTEN ONLY WITH ANALYTICS PERMISSION. Since 29 September 2026 the site
//     has a consent banner (src/lib/consent/). The browser writes both cookies
//     (touch-client.ts) on the page where somebody ARRIVED, and only once they
//     have said yes to analytics. The server reads them only when the
//     `lc_consent` cookie sent with the request still says yes. With no answer,
//     or a no, the row is what it was before the banner: this visit only, and
//     first touch unknown.
//
// WHY THE BROWSER WRITES THEM, AND ON ARRIVAL. Until 29 September the design
// was for the server to write lc_first when a form was submitted. But the
// submitting request is almost never the arrival. Somebody lands on a
// worksheet from a LinkedIn post, reads it, and applies on `/`. The request
// that applies has our own page as its referrer and no tags, so a first touch
// written then would say "direct" for every campaign visitor. Only the page
// they landed on knows where they came from.
//
// That still satisfies acceptance case E07 ("no invented person or hidden
// tracking linkage"). Nothing is written without permission, and nothing is
// joined across records to guess.
//
// UNKNOWN STAYS UNKNOWN. The brief says it twice. A visitor with no referrer
// and no campaign tags is `direct`; a visitor whose referrer we could not parse
// is `unknown`; neither is ever upgraded to a guess, and there is no
// last-non-direct rule anywhere in this file.
//
// ───────────────────────────────────────────────────────────────────────────
// RESOURCE → COHORT IS THE SAME RULE, NOT A NEW ONE (V4-E01)
// ───────────────────────────────────────────────────────────────────────────
//
// Somebody opens a worksheet from a post, reads it, clicks through to the
// cohort page and applies. The addendum: post ids and UTMs must "survive
// resource → cohort navigation without overwriting first source", and
// "Retain inbound attribution when moving from resource to cohort; do not
// overwrite it with self-referrals."
//
// Nothing was added for that case, because two rules already in this file are
// the whole of it, and the temptation is to weaken one of them to make the case
// LOOK like it passes:
//
//   * `referrerHost()` RETURNS NULL FOR OUR OWN HOST. The second page's
//     referrer is the worksheet, on our domain, so it never becomes a source.
//     Without that, an applicant who arrived from LinkedIn would be filed as
//     having come from us.
//   * FIRST TOUCH IS WRITTEN ONCE OR NEVER, and only with permission. Without
//     it, the honest record of that journey is TWO rows, each carrying the
//     request that produced it, and neither claims to be the other. With it,
//     the application's row carries the arrival's tags through lc_last,
//     because the worksheet and the application were one visit.
//
// COPYING THE RESOURCE REQUEST'S SOURCE ONTO A LATER APPLICATION WOULD BE THE
// FAILURE, not the fix. It requires joining the two by email address, which
// means reading a person's records to decide a measurement, and it would write
// a first touch that no permitted mechanism ever captured. The case passes when
// consent exists and the cookie is switched on; until then the truthful answer
// is that first touch is unknown and the two session sources are both recorded.

/** The five fields we are allowed to keep, and nothing else from the query. */
export interface Source {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
}

export interface Attribution {
  /**
   * Which resource this interaction was about, or null for everything else.
   *
   * The V4 addendum: "Add `resource_id` for the resource interaction." It is a
   * PERMITTED NON-PERSONAL DIMENSION and it is the only thing on this row that
   * says what somebody was looking at -- which is exactly why the sentence
   * before it in the addendum matters more than this one: "No personal details
   * in analytics URLs or payloads." A register code ('lc-r01') is a fact about
   * a document. An email address is a fact about a person. Only the first may
   * travel with a measurement.
   *
   * Null on every submission from the three forms. `pipeline_submit()` does not
   * read this key and `attributions` has no column for it; the resource request
   * stores it on its own row.
   */
  resource_id: string | null;
  first_source: string | null;
  first_medium: string | null;
  first_campaign: string | null;
  first_content: string | null;
  first_term: string | null;
  /** The page of the first arrival. Null unless lc_first was read with permission. */
  first_landing_path: string | null;
  /** The external host that sent the first arrival, or null for none. */
  first_referrer_host: string | null;
  session_source: string | null;
  session_medium: string | null;
  session_campaign: string | null;
  session_content: string | null;
  session_term: string | null;
  entry_path: string | null;
  referrer_host: string | null;
  /** The option chosen under "How did you first hear about The Living Craft?" (a code). */
  self_reported: string | null;
  /** The optional line under that question. Kept apart from the code. */
  self_reported_detail: string | null;
  tracking_permission: boolean;
  first_captured_at: string | null;
  session_captured_at: string;
}

/**
 * The only query parameters that reach the database.
 *
 * An allowlist, not a denylist. The brief: "Strip sensitive query values and
 * store only allowed UTM fields and sanitised paths." A denylist means every
 * marketing tool that invents a new parameter next quarter writes it into our
 * table, and some of those carry email addresses in plain text — `?email=`
 * appended by a mail provider's click tracker is not a hypothetical.
 */
const ALLOWED = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/** Long enough for a real campaign name, short enough to bound a hostile one. */
const MAX = 200;

const clip = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  if (!trimmed) return null;
  return trimmed.slice(0, MAX);
};

/**
 * Pull the five allowed fields out of a query string.
 *
 * Takes the RAW string from the browser and does its own parsing, because the
 * browser is not trusted to have filtered anything — and if it were, we would
 * have to trust it again the first time somebody posted to this endpoint by
 * hand.
 */
export function sourceFromQuery(search: string): Source {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  } catch {
    return emptySource();
  }

  const [source, medium, campaign, content, term] = ALLOWED.map((k) => clip(params.get(k)));
  // The one normalisation, and it only ever touches one of our own post ids.
  // See the V4 section below.
  return { source, medium, campaign, content: normalisePostId(content), term };
}

const emptySource = (): Source => ({
  source: null,
  medium: null,
  campaign: null,
  content: null,
  term: null,
});

/**
 * A referrer reduced to its bare host.
 *
 * The path and query go, both because they are none of our business and
 * because they leak: a referrer from a webmail client or an internal wiki can
 * carry a session token, a search phrase, or a document title in its URL.
 *
 * Returns null for a same-host referrer. The brief is specific about this —
 * "prevent internal referrers from replacing the external source" — and the
 * failure is quiet: somebody arrives from LinkedIn, clicks through to the FAQ
 * and back, and their source becomes our own domain.
 */
export function referrerHost(referrer: string, selfHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    const self = selfHost.toLowerCase().replace(/^www\./, '');
    if (!host || host === self) return null;
    return host.slice(0, MAX);
  } catch {
    return null;
  }
}

/**
 * A path with nothing but a path in it.
 *
 * Query and fragment are dropped, and the result is capped. An entry path is
 * for answering "which page did they land on" and needs no more than that.
 */
export function entryPath(path: string): string | null {
  if (!path) return null;
  const clean = path.split('?')[0].split('#')[0].trim();
  if (!clean.startsWith('/')) return null;
  return clean.slice(0, MAX);
}

/**
 * Derive `source` and `medium` when no campaign tags are present.
 *
 * Two rules and no third:
 *   * A known referrer host becomes the source, with medium 'referral'.
 *   * No referrer at all becomes 'direct'.
 *
 * There is deliberately no search-engine list, no social-network list, and no
 * classification of a host into 'organic' or 'social'. Those lists go stale,
 * they encode a judgement, and the operating guide asks for the captured facts
 * rather than a model built on them. A host is a host; Sunil can see it.
 */
export function derive(tagged: Source, host: string | null): Source {
  if (tagged.source || tagged.medium || tagged.campaign) return tagged;
  if (host) return { ...tagged, source: host, medium: 'referral' };
  return { ...tagged, source: 'direct', medium: 'none' };
}

// ---------------------------------------------------------------------------
// The V4 campaign, and the two identifiers it is counted by
// ---------------------------------------------------------------------------
//
// The addendum fixes three of the five UTM values for every V4 post: "Use
// campaign lc_v4_cohort, source linkedin, medium organic_social and lowercase
// post ID in utm_content."
//
// THESE CONSTANTS ARE NOT A FILTER AND NOTHING HERE REJECTS ANYTHING. A link
// somebody typed by hand with a mangled campaign tag still stores what it
// actually said -- the captured value is evidence about a visit, and correcting
// it on the way in would mean the table reads as if the link had been right.
// They exist so that reporting and the campaign brief cannot drift apart, and
// so that `isV4Post()` can answer "was this one of the thirty-two" without
// anybody re-typing the string.
//
// THE ONE NORMALISATION, AND WHY IT IS SAFE. `utm_content` carries the post id,
// and the addendum says lower case. LinkedIn's composer, a phone keyboard and a
// person retyping a link all produce LC-V4-D07 as readily as lc-v4-d07, and two
// spellings of one post is two rows in every count of it. So a value that
// matches OUR OWN post-id shape is lower-cased and everything else is stored
// byte for byte -- the narrowest rule that fixes the thing the addendum asks
// for, and one that cannot touch a campaign tag belonging to anybody else.

/** utm_campaign for the V4 cohort campaign. */
export const V4_CAMPAIGN = 'lc_v4_cohort';
/** utm_source. The campaign is posted from LinkedIn accounts. */
export const V4_SOURCE = 'linkedin';
/** utm_medium. Organic posts, never paid placement -- no spend is activated. */
export const V4_MEDIUM = 'organic_social';

/**
 * A Living Craft post id: LC-V4-D01 .. LC-V4-D32, and the retired LC-OCT ids.
 *
 * Both shapes match on purpose. The addendum says "Do not reuse LC-OCT IDs for
 * V4 attribution", and the way to see that it happened is for an LC-OCT id to
 * still be recognisable in the data rather than stored in a second spelling.
 */
export const POST_ID_RE = /^lc-[a-z0-9]{1,8}-d\d{1,3}$/i;

/** True when `content` is one of our post ids tagged against the V4 campaign. */
export const isV4Post = (source: Source): boolean =>
  source.campaign === V4_CAMPAIGN && !!source.content && POST_ID_RE.test(source.content);

/** Lower-cases one of our own post ids; leaves every other value untouched. */
export const normalisePostId = (value: string | null): string | null =>
  value && POST_ID_RE.test(value) ? value.toLowerCase() : value;

/**
 * A resource identifier reduced to the one form it is stored and counted in.
 *
 * The register writes LC-R01; the campaign writes its ids in lower case; a page
 * knows itself by a slug. All three reach this and leave as one lower-case
 * token, because a dimension with two spellings is two rows in every count.
 *
 * Anything that is not a plain identifier becomes NULL rather than being
 * cleaned up into one. This value is written into an analytics event, and the
 * addendum's rule for those has no exceptions: "No personal details in
 * analytics URLs or payloads." A null dimension is a measurement we did not
 * take; a salvaged one could be anything a caller put in the field.
 */
export const canonicalResourceId = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const id = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{1,39}$/.test(id) ? id : null;
};

// ---------------------------------------------------------------------------
// The first-touch cookie
// ---------------------------------------------------------------------------

export const FIRST_TOUCH_COOKIE = 'lc_first';

/** How this visit began. A session cookie; see the head of this file. */
export const SESSION_TOUCH_COOKIE = 'lc_last';

/** 400 days — the ceiling browsers cap a Set-Cookie max-age at anyway. */
export const FIRST_TOUCH_MAX_AGE = 400 * 24 * 60 * 60;

/** One arrival: its five tags, the page it landed on, the host that sent it, and when. */
export interface Touch extends Source {
  at: string;
  path: string | null;
  referrer: string | null;
}

/**
 * Read either cookie, and refuse to be surprised by it.
 *
 * Everything in here arrives from the visitor's own browser and may have been
 * edited by hand. So each field is re-clipped on the way out. This is a value
 * we are about to write into our own table beside real evidence, and the fact
 * that a script of ours wrote it is not a reason to trust it now. The path goes
 * through `entryPath()` again, so a hand-edited cookie cannot carry a query.
 */
export function readTouch(raw: string | undefined): Touch | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<Record<keyof Touch, unknown>>;
    const text = (v: unknown) => (typeof v === 'string' ? clip(v) : null);
    const at = text(parsed.at);
    if (!at || Number.isNaN(Date.parse(at))) return null;
    const referrer = text(parsed.referrer);
    return {
      source: text(parsed.source),
      medium: text(parsed.medium),
      campaign: text(parsed.campaign),
      content: normalisePostId(text(parsed.content)),
      term: text(parsed.term),
      at,
      path: entryPath(text(parsed.path) ?? ''),
      referrer: referrer && /^[a-z0-9.-]+$/i.test(referrer) ? referrer.toLowerCase() : null,
    };
  } catch {
    return null;
  }
}

export const serialiseTouch = (touch: Touch): string => encodeURIComponent(JSON.stringify(touch));

/**
 * The arrival this page view represents, or null when it is not an arrival.
 *
 * A page reached from another page of ours, with no tags, is a step inside a
 * visit, not the start of one: its referrer is our own host. Everything else
 * is an arrival. That means tags in the address, another site's referrer, or
 * no referrer at all (a typed address, a bookmark, an app that strips it),
 * which is `direct`. The browser calls this on every page; see touch-client.ts.
 */
export function arrivalTouch(input: {
  search: string;
  referrer: string;
  path: string;
  selfHost: string;
  at: string;
}): Touch | null {
  const tagged = sourceFromQuery(input.search);
  const hasTags = Boolean(tagged.source || tagged.medium || tagged.campaign || tagged.content || tagged.term);
  const host = referrerHost(input.referrer, input.selfHost);
  // A referrer that is present but gave no host is our own site, or one we
  // could not read. Either way it is not somewhere this visit came from.
  if (!hasTags && input.referrer && !host) return null;
  return { ...derive(tagged, host), at: input.at, path: entryPath(input.path), referrer: host };
}

/**
 * Assemble the row.
 *
 * `permitted` is the visitor's analytics answer on the cookie banner, read from
 * the `lc_consent` cookie sent with this request. It gates the two stored
 * touches and nothing else. Without it, this visit's source is derived from the
 * request itself: a query string and a referrer header the browser sent
 * unprompted. Recording that stores nothing on the visitor's machine and
 * follows them nowhere. It is the persistence that needs permission, not the
 * observation.
 *
 * With permission, "this visit" is lc_last: the page the visit began on, not
 * the page the form happens to sit on. The request's own fields are the
 * fallback when that cookie is missing, for example when the visitor said yes
 * on a later page than the one they arrived on.
 *
 * The server never writes either cookie. First touch comes only from the
 * arrival the browser saw, so a submission can never invent one.
 */
export function buildAttribution(input: {
  search: string;
  referrer: string;
  path: string;
  selfHost: string;
  selfReported?: string | null;
  selfReportedDetail?: string | null;
  permitted: boolean;
  storedFirstTouch?: string;
  storedSessionTouch?: string;
  /** The register code of the resource this interaction is about. See `resource_id`. */
  resourceId?: string | null;
}): { row: Attribution } {
  const first = input.permitted ? readTouch(input.storedFirstTouch) : null;
  const visit = input.permitted ? readTouch(input.storedSessionTouch) : null;

  const host = referrerHost(input.referrer, input.selfHost);
  const session: Source = visit ?? derive(sourceFromQuery(input.search), host);

  return {
    row: {
      resource_id: canonicalResourceId(input.resourceId),
      first_source: first?.source ?? null,
      first_medium: first?.medium ?? null,
      first_campaign: first?.campaign ?? null,
      first_content: first?.content ?? null,
      first_term: first?.term ?? null,
      first_landing_path: first?.path ?? null,
      first_referrer_host: first?.referrer ?? null,
      session_source: session.source,
      session_medium: session.medium,
      session_campaign: session.campaign,
      session_content: session.content,
      session_term: session.term,
      entry_path: visit ? visit.path : entryPath(input.path),
      referrer_host: visit ? visit.referrer : host,
      self_reported: clip(input.selfReported),
      self_reported_detail: clip(input.selfReportedDetail),
      tracking_permission: input.permitted,
      first_captured_at: first?.at ?? null,
      session_captured_at: visit?.at ?? new Date().toISOString(),
    },
  };
}
