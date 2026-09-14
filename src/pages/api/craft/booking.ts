// Office-hours booking, for people who hold a seat.
//
// Behind the seat gate by its path alone: middleware closes everything under
// /api/craft, so this file inherits the check and `context.locals.learner` is
// already the verified learner. That is why the learner flow lives here rather
// than as another branch inside /api/booking — reusing the gate is cheaper and
// safer than writing a second one that has to be kept in step.
//
// The learner never sends their own name or email. Those come from the row the
// middleware verified, so a participant cannot book as somebody else, and there
// is no form to fill in for details the course area already knows.

import type { APIRoute } from 'astro';
import { meetingType } from '../../../data/meetings';
import { bookSlot } from '../../../lib/booking/book';
import { availableSlots, bookingsForLearner } from '../../../lib/booking/store';
import { clean } from '../../../lib/admin/visitor';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/** Only learner-audience types are bookable here. */
const learnerMeeting = (key: string) => {
  const meeting = meetingType(key);
  return meeting && meeting.audience === 'learner' ? meeting : null;
};

export const GET: APIRoute = async ({ url, locals }) => {
  const learner = locals.learner;
  if (!learner) return json({ ok: false, error: 'Not signed in.' }, 401);

  const meeting = learnerMeeting(url.searchParams.get('type') ?? '');
  if (!meeting) return json({ ok: false, error: 'Unknown meeting type.' }, 404);

  return json({
    ok: true,
    meeting: { key: meeting.key, label: meeting.label, durationMin: meeting.durationMin, blurb: meeting.blurb },
    slots: await availableSlots(meeting),
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return json({ ok: false, error: 'Not signed in.' }, 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Expected JSON.' }, 400);
  }

  const meeting = learnerMeeting(String(body.type ?? ''));
  if (!meeting) return json({ ok: false, error: 'Unknown meeting type.' }, 404);

  // One open office-hours booking at a time. Eight people share these slots,
  // and without this the first person to find the page can take the week.
  const held = await bookingsForLearner(learner.id);
  if (held.some((b) => b.meeting_type === meeting.key)) {
    return json(
      {
        ok: false,
        error: 'You already have office hours booked. Move or cancel that one first, using the link in its invite.',
      },
      409,
    );
  }

  const outcome = await bookSlot({
    meeting,
    startIso: String(body.start ?? ''),
    name: learner.name ?? null,
    email: learner.email,
    company: null,
    role: null,
    notes: clean(body.notes, 4000),
    timezone: clean(body.timezone, 80),
    learnerId: learner.id,
  });

  if (!outcome.ok) {
    const status = outcome.reason === 'taken' ? 409 : outcome.reason === 'unavailable' ? 400 : 500;
    return json({ ok: false, error: outcome.message, retry: outcome.reason === 'taken' }, status);
  }

  // No lead row. A learner has already applied, paid, and been issued a seat —
  // writing them into the enquiry ledger would put a participant in the list of
  // people to follow up with.
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
