// Act on one booking, from the console.
//
// Behind the admin session — middleware closes everything under
// /api/craft/admin/ that is not on its allowlist. Every action here changes
// Google Calendar as well as the database, and Google is what actually tells
// the other person: there is no email service on this site, so an update to the
// invite is the message.

import type { APIRoute } from 'astro';
import { meetingType } from '../../../../data/meetings';
import { cancelBookingEverywhere, moveBookingTo, requestReschedule } from '../../../../lib/booking/book';
import { bookingById, eraseBooking, setAdminNote, setBookingStatus } from '../../../../lib/booking/store';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Expected JSON.' }, 400);
  }

  const id = typeof payload.id === 'string' ? payload.id : '';
  const action = typeof payload.action === 'string' ? payload.action : '';
  if (!id) return json({ ok: false, error: 'Which booking?' }, 400);

  const booking = await bookingById(id);
  if (!booking) return json({ ok: false, error: 'That booking no longer exists.' }, 404);

  if (action === 'note') {
    const saved = await setAdminNote(id, String(payload.note ?? '').slice(0, 4000));
    return saved ? json({ ok: true, message: 'Saved.' }) : json({ ok: false, error: 'Could not save the note.' }, 500);
  }

  if (action === 'complete') {
    // Frees the slot in the exclusion constraint, which is correct: a call that
    // has happened is not holding time any more.
    const done = await setBookingStatus(id, 'completed');
    return done ? json({ ok: true, message: 'Marked as done.' }) : json({ ok: false, error: 'Could not update it.' }, 500);
  }

  if (action === 'cancel') {
    const reason = String(payload.reason ?? '').slice(0, 500) || 'Cancelled by Sunil.';
    const done = await cancelBookingEverywhere(booking, reason);
    return done.ok
      ? json({ ok: true, message: done.message, warning: done.warning })
      : json({ ok: false, error: done.message }, 500);
  }

  if (action === 'propose') {
    const slots = Array.isArray(payload.slots) ? payload.slots.filter((s): s is string => typeof s === 'string') : [];
    if (slots.length === 0) return json({ ok: false, error: 'Pick at least one alternative time.' }, 400);
    // Three is about the limit of a choice someone can make from an email.
    if (slots.length > 5) return json({ ok: false, error: 'Offer five times at most.' }, 400);

    const note = String(payload.note ?? '').slice(0, 500) || null;
    const done = await requestReschedule(booking, slots, note);
    return done.ok
      ? json({ ok: true, message: done.message, warning: done.warning })
      : json({ ok: false, error: done.message }, 500);
  }

  if (action === 'move') {
    const meeting = meetingType(booking.meeting_type);
    if (!meeting) return json({ ok: false, error: 'That call type no longer exists.' }, 400);

    // Moving sets the status back to 'confirmed', so without this a cancelled
    // call could be quietly revived by picking a new time for it.
    if (booking.status === 'cancelled') {
      return json({ ok: false, error: 'That call is cancelled. Ask them to book again.' }, 400);
    }

    const done = await moveBookingTo(booking, meeting, String(payload.start ?? ''));
    return done.ok
      ? json({ ok: true, message: done.message, warning: done.warning })
      : json({ ok: false, error: done.message }, done.reason === 'taken' ? 409 : 500);
  }

  if (action === 'erase') {
    // Hard delete, same as the Erase button on leads and learners. A deletion
    // request is not answered by filing someone differently. The Google event
    // goes first: erasing the row loses the id, and an orphan event nobody can
    // find is worse than a failed delete you can retry.
    if (booking.google_event_id) await cancelBookingEverywhere(booking, 'Erased at the attendee’s request.');
    const gone = await eraseBooking(id);
    return gone
      ? json({ ok: true, message: 'Erased. Remember the calendar invite may still be in your own email.' })
      : json({ ok: false, error: 'Could not erase that booking.' }, 500);
  }

  return json({ ok: false, error: `Unknown action "${action}".` }, 400);
};
