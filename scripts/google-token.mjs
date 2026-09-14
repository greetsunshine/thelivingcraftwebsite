// Mint the Google Calendar refresh token, once.
//
//   npm run google-token
//
// WHY THIS EXISTS RATHER THAN THE OAUTH PLAYGROUND. Google's playground works,
// but it needs its own redirect URI added to your client, a hidden "use your own
// credentials" checkbox, and it shows the refresh token on a web page you then
// copy by hand. This does the same exchange against a local server and writes
// the token straight into .env.local, so the one credential that matters never
// appears on a screen, in a terminal scrollback, or in a chat transcript.
//
// It is kept in the repo rather than thrown away because a refresh token is not
// forever: revoke the app, change the Google password, or leave the OAuth app in
// "Testing", and it dies. When that happens the fix is to run this again.
//
// WHAT THE TOKEN IS FOR. Writing events, and nothing else. The scope requested
// below is calendar.events — it cannot read your free/busy, list your other
// calendars, or touch anything but the events this site creates. That is the
// smallest scope that can send an invite, and availability deliberately does
// not come from Google at all (see src/lib/booking/google.ts).

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PORT = 5051;
const REDIRECT = `http://localhost:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const ENV_FILE = '.env.local';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(`
Missing credentials.

Put these two in ${ENV_FILE} first, from the OAuth client you created in
Google Cloud (APIs & Services -> Credentials):

  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...

The client must be of type "Web application", and must list this exact
redirect URI:

  ${REDIRECT}
`);
  process.exit(1);
}

/**
 * Write one key into .env.local without disturbing the rest of the file.
 *
 * Replaces the line if the key is already there, appends if not. The value is
 * never printed — the whole point of doing the exchange locally.
 */
function saveToEnv(key, value) {
  const existing = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  const next = pattern.test(existing)
    ? existing.replace(pattern, line)
    : `${existing.replace(/\n*$/, '')}\n\n# Written by scripts/google-token.mjs\n${line}\n`;

  writeFileSync(ENV_FILE, next, { mode: 0o600 });
}

// Guards against a stray request to localhost completing the flow with someone
// else's code. Overkill for a script run once on a laptop, and it costs a line.
const state = crypto.randomUUID();

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPE,
    // Both of these are required, and leaving either out is the single most
    // common way this goes wrong. Without access_type=offline Google issues no
    // refresh token at all; without prompt=consent it issues one only on the
    // FIRST authorisation ever, so a second run returns an access token and
    // nothing durable, which looks like the script silently failing.
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

console.log(`
Open this in the browser where you are signed in as the Google account that
owns the calendar:

${authUrl}

You will see an "unverified app" warning. That is expected for an app only you
use. Choose Advanced, then continue.

Waiting for the redirect…
`);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end('Not here.');
    return;
  }

  const finish = (status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }).end(message);
  };

  if (url.searchParams.get('error')) {
    finish(400, 'Refused. Back to the terminal.');
    console.error(`\nGoogle refused: ${url.searchParams.get('error')}`);
    server.close();
    process.exit(1);
  }

  if (url.searchParams.get('state') !== state) {
    finish(400, 'That request did not come from this script.');
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    finish(400, 'No code in the redirect.');
    return;
  }

  const token = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT,
      grant_type: 'authorization_code',
    }),
  });

  const body = await token.json();

  if (!body.refresh_token) {
    finish(400, 'No refresh token came back. Check the terminal.');
    console.error(`
Google returned an access token but no refresh token.

That happens when this Google account has already authorised this client and
prompt=consent was not honoured. Remove the app at
https://myaccount.google.com/permissions and run this again.

Google said: ${body.error_description || body.error || 'nothing useful'}
`);
    server.close();
    process.exit(1);
  }

  saveToEnv('GOOGLE_REFRESH_TOKEN', body.refresh_token);
  finish(200, 'Done. You can close this tab and go back to the terminal.');

  console.log(`
Refresh token written to ${ENV_FILE}. It was not printed anywhere.

Scope granted: ${body.scope}
Next: push all three GOOGLE_* values to Vercel, then redeploy.
`);

  server.close();
  process.exit(0);
});

server.listen(PORT);

// A consent screen left open forever should not leave a server listening.
setTimeout(() => {
  console.error('\nNothing came back within five minutes. Run it again when ready.');
  server.close();
  process.exit(1);
}, 5 * 60_000);
