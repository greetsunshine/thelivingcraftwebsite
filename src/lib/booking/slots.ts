// Turning weekly availability into a list of bookable instants.
//
// Everything here is pure: rules and existing bookings in, an array of ISO
// instants out. No database, no clock beyond the `now` you pass it. That is on
// purpose — slot arithmetic across timezones is the part most likely to be
// subtly wrong, and a pure function is the part you can actually test.
//
// TIMEZONES, AND WHY THERE IS NO LIBRARY HERE.
// Rules are written in the practice's own zone ("Tuesdays, 16:00"). Slots have
// to come out as absolute instants, because that is what a database column and
// a calendar invite hold, and what the browser needs in order to show a Dubai
// visitor their own 14:30. Converting a wall-clock time in a named zone to an
// instant is the one direction the JavaScript Date API does not give you.
//
// The two-pass trick below does it with Intl, which ships with the runtime, and
// is correct across daylight-saving changes. India does not observe DST, so
// today this never bites; HOST_TIMEZONE is a constant someone can change, and a
// version that broke quietly on that change would be worse than no version.

import type { MeetingType } from '../../data/meetings';

export interface AvailabilityRule {
  weekday: number;
  start_min: number;
  end_min: number;
}

/** A half-open interval of epoch milliseconds. */
export interface Interval {
  start: number;
  end: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let found = formatters.get(timeZone);
  if (!found) {
    found = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, found);
  }
  return found;
}

interface ZoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** What the wall clock in `timeZone` reads at this instant. */
export function partsInZone(instant: Date, timeZone: string): ZoneParts {
  const parts = formatter(timeZone).formatToParts(instant);
  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

/**
 * The zone's offset from UTC at a given instant, in milliseconds.
 *
 * Derived rather than looked up: format the instant in the zone, read the
 * result back as though it were UTC, and the difference is the offset. Seconds
 * are floored on both sides because the formatter has no millisecond field, and
 * an unfloored subtraction leaves a sub-second error that rounds a slot onto
 * the wrong minute.
 */
export function zoneOffsetMs(instant: Date, timeZone: string): number {
  const p = partsInZone(instant, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The instant at which the clock in `timeZone` reads this date and minute.
 *
 * Two passes. The first guesses the offset from the wall-clock time read as
 * UTC; the second re-reads the offset at that corrected instant. The second
 * pass is what makes daylight-saving transitions come out right: the offset an
 * hour before a change is not the offset after it, and a single pass picks the
 * wrong one for times near the boundary.
 */
export function zonedToInstant(
  year: number,
  month: number,
  day: number,
  minutesFromMidnight: number,
  timeZone: string,
): Date {
  const wall = Date.UTC(year, month - 1, day, 0, minutesFromMidnight);
  const firstPass = wall - zoneOffsetMs(new Date(wall), timeZone);
  const secondPass = wall - zoneOffsetMs(new Date(firstPass), timeZone);
  return new Date(secondPass);
}

/** Day of week (0 = Sunday) as it reads in the given zone. */
export function weekdayInZone(instant: Date, timeZone: string): number {
  const p = partsInZone(instant, timeZone);
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && a.end > b.start;

export interface SlotRequest {
  meeting: MeetingType;
  timeZone: string;
  /** Active rules for this meeting type only. */
  rules: AvailabilityRule[];
  /** Time taken out of the rules entirely. */
  blocks: Interval[];
  /**
   * Every booking that currently holds time, across ALL meeting types.
   *
   * Across all types on purpose: a discovery call and a learner's office hours
   * are the same one person for the same half hour, and a generator that only
   * looked at its own type would cheerfully offer both.
   */
  busy: Interval[];
  now?: Date;
}

/**
 * Every instant someone could book, as ISO strings, soonest first.
 *
 * Returns instants and not formatted times, because the visitor's browser is
 * the only thing that knows the visitor's timezone. Formatting here would mean
 * either guessing from an IP or showing everyone Indian Standard Time.
 */
export function generateSlots(request: SlotRequest): string[] {
  const { meeting, timeZone, rules, blocks, busy } = request;
  const now = request.now ?? new Date();

  if (rules.length === 0) return [];

  const durationMs = meeting.durationMin * 60_000;
  const bufferMs = meeting.bufferMin * 60_000;
  const earliest = now.getTime() + meeting.noticeHours * 3_600_000;
  const latest = now.getTime() + meeting.horizonDays * 86_400_000;

  // Walk calendar dates in the host's zone. Starting from today's host-local
  // date rather than from `earliest` because a rule sits on a weekday, and the
  // weekday of an instant is a question only the zone can answer.
  const today = partsInZone(now, timeZone);
  const out: string[] = [];

  for (let dayOffset = 0; dayOffset <= meeting.horizonDays; dayOffset++) {
    // Date.UTC normalises an overflowing day, so this rolls across months and
    // years without any calendar arithmetic of our own.
    const civil = new Date(Date.UTC(today.year, today.month - 1, today.day + dayOffset));
    const year = civil.getUTCFullYear();
    const month = civil.getUTCMonth() + 1;
    const day = civil.getUTCDate();
    const weekday = civil.getUTCDay();

    for (const rule of rules) {
      if (rule.weekday !== weekday) continue;

      for (let minute = rule.start_min; minute + meeting.durationMin <= rule.end_min; minute += meeting.durationMin) {
        const start = zonedToInstant(year, month, day, minute, timeZone).getTime();
        const slot: Interval = { start, end: start + durationMs };

        if (slot.start < earliest || slot.start > latest) continue;
        if (blocks.some((b) => overlaps(slot, b))) continue;

        // The buffer is applied by growing the slot, not the booking: a booked
        // call keeps its true start and end everywhere else in the system.
        const padded: Interval = { start: slot.start - bufferMs, end: slot.end + bufferMs };
        if (busy.some((b) => overlaps(padded, b))) continue;

        out.push(new Date(slot.start).toISOString());
      }
    }
  }

  // A rule edited into overlapping itself would otherwise offer the same
  // instant twice, and the second one is unbookable by the database constraint.
  return [...new Set(out)].sort();
}
