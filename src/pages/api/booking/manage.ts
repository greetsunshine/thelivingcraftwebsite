// Reschedule or cancel, from the link in the calendar invite.
//
// No session, no sign-in: the token in the link is the credential, and it is
// compared against an HMAC so the database never holds a working key (see
// lib/booking/tokens.ts). Every branch below verifies that token before it
// looks at what the request wants to do.
//
// A plain form POST and a redirect, rather than JSON and a fetch. This page is
// opened from an email client on a phone, sometimes a bad one, and the flow
// that survives that is the one the browser has always known how to do.

import type { APIRoute } from 'astro';
import { meetingType } from '../../../data/meetings';
import { cancelBookingEverywhere, moveBookingTo } from '../../../lib/booking/book';
import { bookingById } from '../../../lib/booking/store';
import { manageTokenMatches } from '../../../lib/booking/tokens';
import { checkRate } from '../../../lib/agent/ratelimit';

export const prerender = false;

/** Back to the page they came from, carrying the token and something to show. */
const back = (id: string, token: string, params: Record<string, string>) => {
  const query = new URLSearchParams({ t: token, ...params });
  return new Response(null, { status: 303, headers: { Location: `/book/${id}?${query}` } });
};

const plain = (message: string, status: number) =>
  new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // A booking link is a bearer token in a URL, so it is worth throttling: this
  // is the one endpoint where guessing at tokens would be the attack.
  const gate = checkRate(`manage:${clientAddress ?? 'unknown'}`);
  if (!gate.ok) return plain('Too many attempts at once. Give it a minute.', 429);

  const form = await request.formData().catch(() => null);
  if (!form) return plain('Expected a form submission.', 400);

  const id = String(form.get('id') ?? '');
  const token = String(form.get('t') ?? '');
  const action = String(form.get('action') ?? '');
  if (!id || !token) return plain('That link is incomplete.', 400);

  const booking = await bookingById(id);
  if (!booking) return plain('That booking could not be found.', 404);

  // Verified before anything is revealed or changed. The 404 is the same one an
  // unknown id gets, so a wrong token cannot be used to confirm a real booking.
  if (!(await manageTokenMatches(token, booking.manage_token_hash))) {
    return plain('That booking could not be found.', 404);
  }

  if (booking.status === 'cancelled') {
    return back(id, token, { e: 'This call has already been cancelled.' });
  }

  if (Date.parse(booking.starts_at) < Date.now()) {
    return back(id, token, { e: 'This call has already happened, so it cannot be changed here.' });
  }

  const meeting = meetingType(booking.meeting_type);
  if (!meeting) return back(id, token, { e: 'This booking is for a call type that no longer exists.' });

  if (action === 'cancel') {
    const done = await cancelBookingEverywhere(booking, 'Cancelled by the person who booked it.');
    if (!done.ok) return back(id, token, { e: done.message });
    return back(id, token, { m: 'cancelled' });
  }

  if (action === 'reschedule') {
    const start = String(form.get('start') ?? '');
    if (!start) return back(id, token, { e: 'Please choose one of the times.' });

    const done = await moveBookingTo(booking, meeting, start);
    if (!done.ok) return back(id, token, { e: done.message });
    return back(id, token, { m: 'moved' });
  }

  return back(id, token, { e: 'That is not something this page can do.' });
};
