// Taking a booking: the one path both front doors go through.
//
// The public widget on /caio and /assessment and the learner widget inside
// /craft differ in who the person is and how we know it. Everything after that
// is identical, and it is the part with the race condition in it, so it is
// written once.
//
// THE ORDER OF THE TWO WRITES IS THE DESIGN. The row goes in first, and only
// then does Google hear about it. That way the slot is held by the database
// constraint before any network call that can hang, and a Google outage costs
// an invite rather than a booking. The reverse order loses a call and leaves an
// orphan event in a calendar nobody is reading.

import { SITE_ORIGIN } from '../../data/facts';
import { HOST_NAME, type MeetingType } from '../../data/meetings';
import { cancelEvent, createEvent, getEventDescription, updateEvent } from './google';
import {
  availableSlots,
  cancelBooking,
  insertBooking,
  moveBooking,
  proposeAlternatives,
  recordSync,
  type Booking,
} from './store';
import { hashManageToken, manageUrl, newManageToken } from './tokens';

export interface BookRequest {
  meeting: MeetingType;
  /** ISO instant. Re-checked against live availability; never trusted. */
  startIso: string;
  name: string | null;
  email: string;
  company: string | null;
  role: string | null;
  notes: string | null;
  timezone: string | null;
  learnerId: string | null;
}

export type BookOutcome =
  | {
      ok: true;
      booking: Booking;
      manageLink: string;
      /** False when Google could not be reached. The booking still stands. */
      inviteSent: boolean;
      inviteNote: string | null;
    }
  | { ok: false; reason: 'taken' | 'unavailable' | 'error'; message: string };

export async function bookSlot(request: BookRequest): Promise<BookOutcome> {
  const { meeting } = request;

  const start = Date.parse(request.startIso);
  if (!Number.isFinite(start)) {
    return { ok: false, reason: 'unavailable', message: 'That is not a time I recognise.' };
  }

  // THE SLOT IS RE-DERIVED SERVER-SIDE, ALWAYS. The browser sent a time it read
  // off a list this server produced, but a posted value is attacker-controlled
  // and the list is minutes old either way. Without this check a crafted
  // request books 3am on a Sunday, and the database constraint would not
  // object, because nothing else is booked at 3am on a Sunday.
  const open = await availableSlots(meeting);
  const startIso = new Date(start).toISOString();
  if (!open.includes(startIso)) {
    return {
      ok: false,
      reason: 'taken',
      message: 'That time is no longer open. Pick another, and it will be held straight away.',
    };
  }

  const endIso = new Date(start + meeting.durationMin * 60_000).toISOString();
  const token = newManageToken();

  const created = await insertBooking({
    meeting_type: meeting.key,
    starts_at: startIso,
    ends_at: endIso,
    name: request.name,
    email: request.email,
    company: request.company,
    role: request.role,
    notes: request.notes,
    timezone: request.timezone,
    learner_id: request.learnerId,
    manage_token_hash: await hashManageToken(token),
  });

  if (!created.ok) return created;

  const booking = created.booking;
  const link = manageUrl(SITE_ORIGIN, booking.id, token);

  const sync = await createEvent({
    summary: `${meeting.label} — ${request.name || request.email}`,
    description: eventDescription(request, link),
    startIso,
    endIso,
    attendeeEmail: request.email,
    attendeeName: request.name,
  });

  await recordSync(booking.id, { eventId: sync.eventId, meetUrl: sync.meetUrl, error: sync.ok ? undefined : sync.error });

  return {
    ok: true,
    booking: { ...booking, google_event_id: sync.eventId ?? null, google_meet_url: sync.meetUrl ?? null },
    manageLink: link,
    inviteSent: sync.ok,
    // Shown to the booker when Google failed, because "you are booked, no invite
    // is coming, here is the link" is far better than a confirmation that
    // quietly promises an email that will never arrive.
    inviteNote: sync.ok ? null : 'The calendar invite could not be sent. The time is held, and you will hear from me directly.',
  };
}

/** What both parties read inside the calendar invite. */
function eventDescription(request: BookRequest, link: string): string {
  const lines = [`${request.meeting.label} with ${HOST_NAME}.`, ''];

  if (request.company) lines.push(`Company: ${request.company}`);
  if (request.role) lines.push(`Role: ${request.role}`);
  if (request.notes) lines.push('', 'What they want to talk about:', request.notes);

  lines.push(
    '',
    'Need to move this call or cancel it? Use this link:',
    link,
    '',
    // Said here because the invite is the only thing the booker keeps, and it
    // is where they will look when something changes.
    'The link is personal to this booking. Please do not forward it.',
  );

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Changing a booking that already exists
// ---------------------------------------------------------------------------
// Used by two callers with the same needs: the booker, holding their link, and
// Sunil in the console. Both move a call the same way, and both must leave the
// database and the calendar agreeing with each other.

export type ChangeOutcome =
  | { ok: true; message: string; warning: string | null }
  | { ok: false; reason: 'taken' | 'error'; message: string };

/**
 * Move a booking to a new time.
 *
 * The database moves first, for the same reason it is written first when a
 * booking is made: the constraint is what stops two people holding one slot,
 * and a calendar that is briefly out of date is recoverable in a way a double
 * booking is not.
 */
export async function moveBookingTo(
  booking: Booking,
  meeting: MeetingType,
  startIso: string,
): Promise<ChangeOutcome> {
  const start = Date.parse(startIso);
  if (!Number.isFinite(start)) return { ok: false, reason: 'error', message: 'That is not a time I recognise.' };

  // Availability is recomputed with this booking taken out of the busy list —
  // see the note on availableSlots. Proposed times are checked the same way as
  // any other: an alternative offered last week may have been taken since.
  const open = await availableSlots(meeting, new Date(), booking.id);
  const wanted = new Date(start).toISOString();
  if (!open.includes(wanted)) {
    return { ok: false, reason: 'taken', message: 'That time is no longer open. Please pick another.' };
  }

  const endIso = new Date(start + meeting.durationMin * 60_000).toISOString();
  const moved = await moveBooking(booking.id, wanted, endIso);
  if (!moved.ok) return { ok: false, reason: moved.reason, message: moved.message };

  if (!booking.google_event_id) {
    return {
      ok: true,
      message: 'The call has been moved.',
      warning: 'No calendar invite exists for this booking, so no update was sent.',
    };
  }

  // Description untouched on purpose: it holds the reschedule link, and PATCH
  // replaces a field wholesale rather than merging it.
  const sync = await updateEvent(booking.google_event_id, { startIso: wanted, endIso });
  return {
    ok: true,
    message: 'The call has been moved.',
    warning: sync.ok ? null : `The calendar invite was not updated: ${sync.error}`,
  };
}

export async function cancelBookingEverywhere(booking: Booking, reason: string | null): Promise<ChangeOutcome> {
  const done = await cancelBooking(booking.id, reason);
  if (!done) return { ok: false, reason: 'error', message: 'The booking could not be cancelled.' };

  if (!booking.google_event_id) {
    return { ok: true, message: 'The call has been cancelled.', warning: null };
  }

  const sync = await cancelEvent(booking.google_event_id);
  return {
    ok: true,
    message: 'The call has been cancelled.',
    warning: sync.ok ? null : `The calendar event was not removed: ${sync.error}`,
  };
}

/**
 * Ask the other person to move, and offer them times.
 *
 * How they hear about it is the interesting part. There is no email service
 * here, so the calendar invite carries the message: the event description gains
 * a line at the top, and `sendUpdates=all` makes Google email the change to
 * both people. The reschedule link is already in that description, below the
 * new line, which is why the existing text is read back rather than replaced.
 *
 * The original time stays held until they answer. If they never do, the call
 * goes ahead as booked, which is the safer of the two failures.
 */
export async function requestReschedule(
  booking: Booking,
  slots: string[],
  note: string | null,
): Promise<ChangeOutcome> {
  const done = await proposeAlternatives(booking.id, slots);
  if (!done) return { ok: false, reason: 'error', message: 'Could not record the request.' };

  if (!booking.google_event_id) {
    return {
      ok: true,
      message: 'Reschedule requested.',
      warning: 'There is no calendar invite for this booking, so nothing was sent. Contact them directly.',
    };
  }

  const existing = await getEventDescription(booking.google_event_id);
  if (existing === null) {
    return {
      ok: true,
      message: 'Reschedule requested.',
      warning: 'The calendar invite could not be read, so no message was sent. Contact them directly.',
    };
  }

  const heading = [
    `${HOST_NAME} has asked to move this call.`,
    note ? `\n${note}` : '',
    '\nPlease pick a new time using the link further down. This time is still held until you do.',
    '\n---\n',
  ].join('');

  const sync = await updateEvent(booking.google_event_id, { description: heading + existing });
  return {
    ok: true,
    message: 'Reschedule requested, and they have been emailed.',
    warning: sync.ok ? null : `The calendar invite was not updated: ${sync.error}`,
  };
}
