// Take a booking from a public page.
//
// The notification path is different from every other lead on this site, and
// worth stating: there is no Web3Forms post here. Google Calendar emails the
// invite to both people, which is a better notification than an inbox copy —
// it lands in the calendar Sunil actually runs his day from. The `leads` row
// written below is the ledger entry, the same way it is for a form submission,
// so a booked call shows up next to every other enquiry in the console.

import type { APIRoute } from 'astro';
import { meetingType } from '../../../data/meetings';
import { bookSlot } from '../../../lib/booking/book';
import { record } from '../../../lib/admin/supabase';
import { clean, countryOf, deviceOf } from '../../../lib/admin/visitor';
import { checkRate } from '../../../lib/agent/ratelimit';

export const prerender = false;

const EMAIL = /^[^\s@,;]+@[^\s@,;.]+\.[^\s@,;]{2,}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Which page a meeting type is booked from, for the lead ledger's `surface`. */
const SURFACE: Record<string, string> = { discovery: '/caio', scope: '/assessment' };
const INTEREST: Record<string, string> = { discovery: 'caio', scope: 'assessment' };

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Unlike the analytics beacon, this one tells the visitor when it refuses.
  // Silently swallowing a booking would leave someone believing they have a
  // call in the diary.
  const gate = checkRate(`booking:${clientAddress ?? 'unknown'}`);
  if (!gate.ok) {
    return json({ ok: false, error: 'Too many attempts at once. Give it a minute and try again.' }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Expected JSON.' }, 400);
  }

  // Honeypot, same field name the forms use. A bot that fills it gets a
  // cheerful-looking rejection rather than a hint about what gave it away.
  if (body.botcheck) return json({ ok: false, error: 'That did not go through.' }, 400);
  if (deviceOf(request) === 'bot') return json({ ok: false, error: 'That did not go through.' }, 400);

  const meeting = meetingType(String(body.type ?? ''));
  if (!meeting || meeting.audience !== 'public') {
    return json({ ok: false, error: 'Unknown meeting type.' }, 404);
  }

  const email = (clean(body.email, 200) ?? '').toLowerCase();
  if (!EMAIL.test(email)) {
    return json({ ok: false, error: 'That email address does not look right.' }, 400);
  }

  const name = clean(body.name, 200);
  if (!name) return json({ ok: false, error: 'Please give a name, so I know who I am meeting.' }, 400);

  const outcome = await bookSlot({
    meeting,
    startIso: String(body.start ?? ''),
    name,
    email,
    company: clean(body.company, 200),
    role: clean(body.role, 200),
    notes: clean(body.notes, 4000),
    timezone: clean(body.timezone, 80),
    learnerId: null,
  });

  if (!outcome.ok) {
    // Three different failures, three different codes: 409 is a lost race and
    // the widget reloads the times, 400 is a malformed request, 500 is ours.
    const status = outcome.reason === 'taken' ? 409 : outcome.reason === 'unavailable' ? 400 : 500;
    return json({ ok: false, error: outcome.message, retry: outcome.reason === 'taken' }, status);
  }

  // Ledger, fire-and-forget. A failure here must never unwind a booking that
  // is already made and already in two calendars.
  await record('leads', {
    source: 'booking',
    surface: SURFACE[meeting.key] ?? '/',
    interest: INTEREST[meeting.key] ?? null,
    name,
    email,
    role: clean(body.role, 200),
    company: clean(body.company, 200),
    message: clean(body.notes, 4000),
    context: `${meeting.label} booked for ${outcome.booking.starts_at}`,
    country: countryOf(request),
    // True because the invite is the delivery, and it either went or it did
    // not. This is the same reconciliation `delivered` does for Web3Forms.
    delivered: outcome.inviteSent,
  });

  return json({
    ok: true,
    booking: {
      id: outcome.booking.id,
      start: outcome.booking.starts_at,
      end: outcome.booking.ends_at,
      meetUrl: outcome.booking.google_meet_url,
    },
    manageLink: outcome.manageLink,
    inviteSent: outcome.inviteSent,
    note: outcome.inviteNote,
  });
};
