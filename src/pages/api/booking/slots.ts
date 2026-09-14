// Open times for one meeting type.
//
// Public, and deliberately thin: it returns instants, not formatted times, so
// the browser can render them in the visitor's own timezone. Nothing here
// depends on who is asking, and nothing it returns is private — an open slot is
// an advertisement.
//
// Learner meeting types are NOT served from here. They live behind the seat
// gate at /api/craft/booking, because middleware closes everything under
// /api/craft and reusing that gate is cheaper than writing a second one.

import type { APIRoute } from 'astro';
import { meetingType } from '../../../data/meetings';
import { availableSlots } from '../../../lib/booking/store';
import { capabilities } from '../../../lib/admin/env';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Slots go stale the moment someone books. A short cache absorbs a
      // double-render or a fast back-button without ever showing a time that
      // has been gone for a minute.
      'Cache-Control': 'no-store',
    },
  });

export const GET: APIRoute = async ({ url }) => {
  const meeting = meetingType(url.searchParams.get('type') ?? '');
  if (!meeting || meeting.audience !== 'public') {
    return json({ ok: false, error: 'Unknown meeting type.' }, 404);
  }

  // Without Supabase there is no rule table, so there is nothing to offer. Said
  // out loud rather than returned as an empty list, so the widget can show the
  // enquiry form instead of an empty calendar that looks fully booked.
  if (!capabilities().data) {
    return json({ ok: false, error: 'Booking is not configured.', unconfigured: true }, 503);
  }

  return json({
    ok: true,
    meeting: {
      key: meeting.key,
      label: meeting.label,
      durationMin: meeting.durationMin,
      blurb: meeting.blurb,
    },
    slots: await availableSlots(meeting),
  });
};
