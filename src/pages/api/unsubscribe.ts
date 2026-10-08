// The one unsubscribe action. Public, no login, and it tells nobody anything.
//
// ───────────────────────────────────────────────────────────────────────────
// EVERY REQUEST GETS THE SAME PAGE. THERE IS NO BRANCH TO OBSERVE.
// ───────────────────────────────────────────────────────────────────────────
//
// Valid token, expired token, forged token, missing token, unknown person,
// database down — one response, byte for byte, 200 every time.
//
// The brief asks for "generic confirmation for invalid/expired links with a
// contact route", and the reason is worth stating plainly: "that address is not
// subscribed" is a membership oracle. Anybody with a list of addresses could
// walk it against this endpoint and learn who applied to the cohort. The
// defence is not to word the two cases carefully — it is for there to be one
// case.
//
// So this file is written so that there is nothing to leak:
//   * `applyUnsubscribe()` returns whether the writes landed, and that value is
//     deliberately NOT rendered. It goes to the server log as a category.
//   * Nothing from the request is echoed into the page. No token, no address,
//     no error. The body is a constant.
//   * The status code is 200 in every branch, including the ones where we did
//     nothing at all.
//
// ───────────────────────────────────────────────────────────────────────────
// A GET ASKS. A POST ACTS. (Changed 6 October 2026.)
// ───────────────────────────────────────────────────────────────────────────
//
// Until 6 October a GET unsubscribed, on the argument that a scanner following
// the link only ever sends LESS mail. The resource brief
// (05-email-and-resource-routing) decided the other way, in its acceptance
// list: "Authenticated POST works without login; GET scanner does not
// unsubscribe." A scanner that unsubscribes somebody who wanted the emails
// is a person silently cut off, and every address behind a corporate scanner
// would be. So a GET now shows one button, and the button posts.
//
// POST is also RFC 8058 one-click unsubscribe: the control a mail client draws
// itself, which posts `List-Unsubscribe=One-Click` with the token in the URL
// and no Origin header. src/middleware.ts exempts this path from the
// cross-site form check for exactly that reason. One click in the mail client
// is still one action; the link in the footer is two.
//
// ───────────────────────────────────────────────────────────────────────────
// NOTE ON Referrer-Policy
// ───────────────────────────────────────────────────────────────────────────
//
// The token is in the query string, so without `no-referrer` a click on any
// link on this page would hand the whole URL — token included — to the next
// site in a `Referer` header. That is one header away from a working
// unsubscribe link for a specific person sitting in somebody else's access log.

import type { APIRoute } from 'astro';
import { applyUnsubscribe, verifyToken, CONFIRMATION } from '../../lib/comms/unsubscribe';

export const prerender = false;

/**
 * The page. A constant, assembled once at module load.
 *
 * Self-contained: no stylesheet, no font, no script, no image. A person acting
 * on an unsubscribe link may be doing it from a mail client's embedded browser
 * with everything blocked, and the one thing this page has to do is render.
 */
const lines = (): string => CONFIRMATION.lines.map((l) => `      <p>${l}</p>`).join('\n');

const PAGE = ((): string => {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>__TITLE__ · The Living Craft</title>
<style>
  /* Inline, and the values are literals rather than var() references, because
     this page is a Response built by hand — there is no layout, no global.css
     and no token file in scope. That makes it the one surface where the design
     system has to be COPIED, and therefore the one that silently goes stale.

     These are the live values from src/styles/ds/theme.css, not the warm-craft
     palette in CLAUDE.md's "Design tokens" section, which has not kept up with
     the code. This page had that stale palette, which is how it was caught.
     If the theme changes, change these too — and nothing will remind you. */
  :root { color-scheme: light; }
  body {
    margin: 0; padding: 48px 20px;
    background: #f1f3f5; color: #16212e;          /* --mist on --ink-1 */
    font: 17px/1.55 Figtree, "Avenir Next", "Helvetica Neue", -apple-system,
          BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  /* Elevation replaces rules in this system: a white card floating on the
     sunken ground, and never a border AND a shadow on the same element. */
  main {
    max-width: 34rem; margin: 0 auto;
    background: #ffffff; border-radius: 28px; padding: 40px 32px;
    box-shadow: 0 1px 2px rgba(22, 33, 46, 0.04), 0 10px 24px -14px rgba(22, 33, 46, 0.12);
  }
  h1 { font-size: 1.6rem; line-height: 1.25; margin: 0 0 20px; font-weight: 700; letter-spacing: -0.025em; }
  p { margin: 0 0 16px; color: #6d7885; }          /* --ink-2, 4.49:1 */
  a { color: #c4561c; }                            /* --accent-ink, 5.9:1 */
  a:focus-visible { outline: 2px solid #eb1450; outline-offset: 2px; }
  .foot { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e7eaef; font-size: 0.9rem; }
  .foot a { margin-right: 16px; }
  button {
    font: inherit; font-weight: 600; color: #F5F0E6; background: #183D32;
    border: 0; border-radius: 6px; padding: 12px 20px; min-height: 44px; cursor: pointer;
  }
  button:focus-visible { outline: 2px solid #765523; outline-offset: 2px; }
</style>
</head>
<body>
  <main>
__MAIN__
    <div class="foot">
      <a href="/communication-preferences">Changing what you receive</a>
      <a href="/privacy">How your details are handled</a>
      <a href="mailto:${CONFIRMATION.contact}">${CONFIRMATION.contact}</a>
    </div>
  </main>
</body>
</html>
`;
})();

const DONE = PAGE.replace('__TITLE__', CONFIRMATION.title).replace('__MAIN__', `    <h1>${CONFIRMATION.title}</h1>\n${lines()}`);

/**
 * The question, for a GET. It does not read the token, so it is the same page
 * for a valid link, a forged one and an expired one. The form posts back to
 * the same URL, token included.
 */
const ASK = PAGE.replace('__TITLE__', 'Unsubscribe').replace(
  '__MAIN__',
  `    <h1>Unsubscribe from The Living Craft emails?</h1>
      <p>Press the button to stop practical resources and cohort updates from The Living Craft. A reply to something you asked us still reaches you.</p>
      <form method="post"><button type="submit">Unsubscribe</button></form>`,
);

const page = (html: string = DONE): Response =>
  new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, private',
      // Keeps the token out of the next site's Referer header. See the header.
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

/**
 * Verify, act, and say nothing about either.
 *
 * The `recorded` flag is logged rather than rendered. Today it is false for
 * every request, because `supabase/schema.sql` has not been applied and the
 * comms tables do not exist — which is exactly the state this endpoint has to
 * survive without telling a visitor anything.
 */
async function handle(token: string | undefined): Promise<Response> {
  try {
    const personId = await verifyToken(token);
    if (personId) {
      const { recorded } = await applyUnsubscribe(personId, 'unsubscribe-link');
      if (!recorded) {
        // A real problem, and one that needs a person: somebody asked to be
        // unsubscribed and part of it did not save. It is deliberately not on
        // the page — the page already gives them a route to a human, and the
        // alternative tells a stranger that the token they guessed was valid.
        console.error('unsubscribe: not fully recorded');
      }
    }
  } catch (err) {
    // Never let a failure change the shape of the response. A 500 here is a
    // different observable outcome, and the difference is the oracle.
    console.error('unsubscribe threw:', err instanceof Error ? err.name : 'unknown');
  }
  return page();
}

// A GET never acts. See the header.
export const GET: APIRoute = async () => page(ASK);

export const POST: APIRoute = async ({ url, request }) => {
  // RFC 8058 puts the token in the URL and posts an empty body; some clients
  // post a form instead. Accept either, and never fail on an unreadable body —
  // an unreadable body is still somebody asking to be unsubscribed.
  let fromBody: string | undefined;
  try {
    const form = await request.formData();
    const v = form.get('u');
    if (typeof v === 'string') fromBody = v;
  } catch {
    /* no body, or not a form. The URL is the normal case. */
  }
  return handle(url.searchParams.get('u') ?? fromBody);
};
