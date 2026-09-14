// Google Calendar, one direction only: this site writes, it never reads.
//
// WHY ONE DIRECTION. Availability comes from `booking_rules` in our own
// database. We do not ask Google what is free, and a free/busy query would make
// two systems the authority over one calendar. The cost of the choice has to be
// said plainly, because it will surprise someone: AN EVENT SUNIL ADDS TO HIS
// OWN GOOGLE CALENDAR DOES NOT CLOSE A SLOT HERE. To keep time for yourself,
// add a block in the console.
//
// WHAT GOOGLE IS FOR. Sending the invite. The site creates the event with the
// booker as an attendee and `sendUpdates=all`, so Google emails the invite to
// both of them, adds it to both calendars, and emails both again when the time
// changes or the call is cancelled. That is a whole transactional email system
// we do not have to build, run, or get past a spam filter.
//
// WHY NOT THE googleapis PACKAGE. Three REST calls and a token refresh. The
// package is tens of megabytes of generated clients for every Google product,
// on a serverless function with a cold start. fetch is enough.
//
// WHY OAUTH AND NOT A SERVICE ACCOUNT. A service account cannot invite
// attendees without domain-wide delegation, which needs Google Workspace. On a
// personal Google account the invite silently goes to nobody. A refresh token
// for the account that owns the calendar works on both.
//
// NOTHING HERE IS ALLOWED TO FAIL A BOOKING. Every function returns a result
// object and never throws. A booking that is saved but not synced is recorded
// with its error and shown in red in the console, which is recoverable. A
// booking lost because Google timed out is not.

import { env } from '../admin/env';
import { HOST_TIMEZONE } from '../../data/meetings';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/** Which calendar to write to. 'primary' is the account's own, and is almost always right. */
const calendarId = () => env('GOOGLE_CALENDAR_ID') || 'primary';

export const calendarConfigured = (): boolean =>
  Boolean(env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET') && env('GOOGLE_REFRESH_TOKEN'));

// Access tokens last an hour. Cached per warm instance, with a minute of slack
// so a token cannot expire between the check and the call it is used for.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  if (!calendarConfigured()) return null;

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env('GOOGLE_CLIENT_ID'),
        client_secret: env('GOOGLE_CLIENT_SECRET'),
        refresh_token: env('GOOGLE_REFRESH_TOKEN'),
        grant_type: 'refresh_token',
      }),
    });

    const body = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string; error?: string };
    if (!res.ok || !body.access_token) {
      // The message that matters most is `invalid_grant`. It means the refresh
      // token is dead, and the usual cause is an OAuth app left in "Testing",
      // where Google expires refresh tokens after seven days. Publishing the
      // app fixes it permanently. Worth naming here, because the symptom is
      // "bookings stopped sending invites a week after launch".
      console.error('Google token refresh failed:', body.error_description || body.error || res.status);
      return null;
    }

    cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
    return cachedToken.value;
  } catch (err) {
    console.error('Google token refresh threw:', err instanceof Error ? err.message : err);
    return null;
  }
}

export interface SyncResult {
  ok: boolean;
  eventId?: string;
  meetUrl?: string;
  /** Human-readable, and written to `bookings.google_error` for the console. */
  error?: string;
}

const notConfigured: SyncResult = {
  ok: false,
  error: 'Google Calendar is not connected, so no invite was sent.',
};

interface EventInput {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  attendeeEmail: string;
  attendeeName?: string | null;
}

/**
 * Create the event and let Google send the invites.
 *
 * `conferenceDataVersion=1` plus a createRequest is what makes Google attach a
 * Meet link. Without it the invite has a time and no way to join, and someone
 * has to send a link by hand on the morning of the call.
 */
export async function createEvent(input: EventInput): Promise<SyncResult> {
  const token = await accessToken();
  if (!token) return calendarConfigured() ? { ok: false, error: 'Could not authenticate with Google Calendar.' } : notConfigured;

  try {
    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events?sendUpdates=all&conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: input.summary,
          description: input.description,
          start: { dateTime: input.startIso, timeZone: HOST_TIMEZONE },
          end: { dateTime: input.endIso, timeZone: HOST_TIMEZONE },
          attendees: [{ email: input.attendeeEmail, displayName: input.attendeeName || undefined }],
          guestsCanInviteOthers: false,
          guestsCanModify: false,
          reminders: { useDefault: true },
          conferenceData: {
            createRequest: {
              // Must be unique per request. Google uses it to make a retry
              // idempotent rather than creating a second Meet room.
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      },
    );

    const body = (await res.json()) as {
      id?: string;
      hangoutLink?: string;
      error?: { message?: string };
    };
    if (!res.ok || !body.id) return { ok: false, error: body.error?.message || `Google returned ${res.status}.` };

    return { ok: true, eventId: body.id, meetUrl: body.hangoutLink };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Google Calendar did not respond.' };
  }
}

/**
 * Read one event back.
 *
 * The only read in this module, and it exists for a specific reason: the
 * reschedule link lives in the event description and nowhere else. We hold an
 * HMAC of the token, not the token, so the description cannot be rebuilt from
 * our own database — by design, since a stored link is a stored credential. To
 * add a line above it we have to fetch what is already there.
 */
export async function getEventDescription(eventId: string): Promise<string | null> {
  const token = await accessToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { description?: string };
    return body.description ?? '';
  } catch {
    return null;
  }
}

/** Move an existing event. Google emails both parties the update. */
export async function updateEvent(
  eventId: string,
  changes: { startIso?: string; endIso?: string; description?: string },
): Promise<SyncResult> {
  const token = await accessToken();
  if (!token) return calendarConfigured() ? { ok: false, error: 'Could not authenticate with Google Calendar.' } : notConfigured;

  const patch: Record<string, unknown> = {};
  if (changes.startIso) patch.start = { dateTime: changes.startIso, timeZone: HOST_TIMEZONE };
  if (changes.endIso) patch.end = { dateTime: changes.endIso, timeZone: HOST_TIMEZONE };
  if (changes.description !== undefined) patch.description = changes.description;

  try {
    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      },
    );

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      return { ok: false, error: body.error?.message || `Google returned ${res.status}.` };
    }
    return { ok: true, eventId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Google Calendar did not respond.' };
  }
}

/** Cancel the event. Google emails both parties the cancellation. */
export async function cancelEvent(eventId: string): Promise<SyncResult> {
  const token = await accessToken();
  if (!token) return calendarConfigured() ? { ok: false, error: 'Could not authenticate with Google Calendar.' } : notConfigured;

  try {
    const res = await fetch(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    );

    // 410 means it is already gone. That is the outcome we wanted, so it is a
    // success and not an error to show Sunil.
    if (!res.ok && res.status !== 410) {
      return { ok: false, error: `Google returned ${res.status}.` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Google Calendar did not respond.' };
  }
}
