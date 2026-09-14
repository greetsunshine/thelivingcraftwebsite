// Edit availability: the weekly rules, and the time taken out of them.
//
// This is the whole reason the site owns its own calendar. Nothing here reads
// Google, and Google never writes back — so if Sunil wants an afternoon kept
// clear, it has to be entered as a block here. An event in his own calendar
// does not close a slot. That is the cost of the design, and this endpoint is
// where it is paid.

import type { APIRoute } from 'astro';
import { HOST_TIMEZONE, meetingType } from '../../../../data/meetings';
import { zonedToInstant } from '../../../../lib/booking/slots';
import { createBlock, createRule, deleteBlock, deleteRule, setRuleActive } from '../../../../lib/booking/store';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** "16:30" -> 990. Returns null for anything that is not a real time of day. */
function minutesFrom(value: unknown): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? ''));
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) return null;
  return hours * 60 + mins;
}

/** "2026-09-22" plus "16:30" in the host's own zone -> an absolute instant. */
function instantFrom(date: unknown, time: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date ?? ''));
  const minutes = minutesFrom(time);
  if (!match || minutes === null) return null;
  return zonedToInstant(Number(match[1]), Number(match[2]), Number(match[3]), minutes, HOST_TIMEZONE).toISOString();
}

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Expected JSON.' }, 400);
  }

  const action = typeof payload.action === 'string' ? payload.action : '';

  if (action === 'rule-add') {
    const meeting = meetingType(String(payload.meeting_type ?? ''));
    if (!meeting) return json({ ok: false, error: 'Which kind of call?' }, 400);

    const weekday = Number(payload.weekday);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return json({ ok: false, error: 'Pick a day of the week.' }, 400);
    }

    const start = minutesFrom(payload.start);
    const end = minutesFrom(payload.end);
    if (start === null || end === null) return json({ ok: false, error: 'Times must look like 16:00.' }, 400);
    if (end <= start) return json({ ok: false, error: 'The finish has to be after the start.' }, 400);

    // Caught here so the message is useful. The database check constraint would
    // refuse it too, with a message about a constraint name.
    if (end - start < meeting.durationMin) {
      return json(
        { ok: false, error: `That band is shorter than one ${meeting.label.toLowerCase()} (${meeting.durationMin} minutes), so it would never offer a slot.` },
        400,
      );
    }

    const made = await createRule({ meeting_type: meeting.key, weekday, start_min: start, end_min: end });
    return made ? json({ ok: true, message: 'Added.' }) : json({ ok: false, error: 'Could not add that rule.' }, 500);
  }

  if (action === 'rule-toggle') {
    const id = String(payload.id ?? '');
    const done = await setRuleActive(id, Boolean(payload.active));
    return done ? json({ ok: true, message: 'Updated.' }) : json({ ok: false, error: 'Could not update it.' }, 500);
  }

  if (action === 'rule-delete') {
    const done = await deleteRule(String(payload.id ?? ''));
    return done ? json({ ok: true, message: 'Removed.' }) : json({ ok: false, error: 'Could not remove it.' }, 500);
  }

  if (action === 'block-add') {
    // A whole day is midnight to midnight the next morning, which is why the
    // end date defaults to the day after the one that was typed.
    const allDay = Boolean(payload.allDay);
    const from = instantFrom(payload.from, allDay ? '00:00' : String(payload.fromTime ?? ''));
    const to = allDay
      ? instantFrom(payload.to ?? payload.from, '00:00')
      : instantFrom(payload.to ?? payload.from, String(payload.toTime ?? ''));

    if (!from || !to) return json({ ok: false, error: 'Give a date, and times that look like 09:00.' }, 400);

    const end = allDay ? new Date(Date.parse(to) + 86_400_000).toISOString() : to;
    if (Date.parse(end) <= Date.parse(from)) {
      return json({ ok: false, error: 'The end has to be after the start.' }, 400);
    }

    const made = await createBlock(from, end, String(payload.reason ?? '').slice(0, 200) || null);
    return made ? json({ ok: true, message: 'Time blocked.' }) : json({ ok: false, error: 'Could not block that time.' }, 500);
  }

  if (action === 'block-delete') {
    const done = await deleteBlock(String(payload.id ?? ''));
    return done ? json({ ok: true, message: 'Removed.' }) : json({ ok: false, error: 'Could not remove it.' }, 500);
  }

  return json({ ok: false, error: `Unknown action "${action}".` }, 400);
};
