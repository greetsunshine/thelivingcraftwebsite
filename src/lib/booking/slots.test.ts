/**
 * Tests for the slot generator, and for one rule in particular: a booked call
 * blocks that time on EVERY call type, not just its own.
 *
 * Run with `npm test`. Node's own test runner, no framework — the same choice
 * costCeiling.test.ts made, and this file is not a reason to add a dependency.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE IS WORTH HAVING
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Availability is stored per call type: `booking_rules.meeting_type` decides
 * which band belongs to a discovery call and which to a cohort call. Bookings
 * are not filtered that way, and must never be. `busyBetween()` in store.ts
 * reads every row in `bookings` regardless of type, because a discovery call
 * and a cohort call at 16:00 on Tuesday are the same one person in the same
 * half hour.
 *
 * That asymmetry is a comment in two files and nothing else. Adding
 * `.eq('meeting_type', …)` to `busyBetween()` looks like a tidy-up and would
 * pass every other check in the repo: the site would go on rendering times, the
 * build would stay green, and the failure would arrive as two people in one
 * meeting. This file is the thing that refuses that edit.
 *
 * The expected values come from the rule, not from running the code and
 * writing down what it printed. A 16:00–18:00 band at thirty minutes is four
 * slots a day; Monday to Friday between the notice window and the horizon is
 * nineteen days; nineteen times four is seventy-six.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { generateSlots, type AvailabilityRule, type Interval } from './slots.ts';
import { HOST_TIMEZONE, meetingType } from '../../data/meetings.ts';

/**
 * The rules the staging database holds, and the shape production uses for
 * discovery: Monday to Friday, 16:00 to 18:00 in the host's own zone.
 */
const RULES: AvailabilityRule[] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  start_min: 16 * 60,
  end_min: 18 * 60,
}));

/**
 * Monday 21 September 2026, 08:30 in Asia/Kolkata.
 *
 * Fixed rather than `new Date()`, because a test whose expected values depend
 * on the day it runs is a test that fails on a Saturday for no reason.
 */
const NOW = new Date('2026-09-21T03:00:00.000Z');

/**
 * What the band produces from NOW, worked out from the rule.
 *
 * The 24-hour notice window closes Monday the 21st, so the first offer is
 * Tuesday the 22nd. The 28-day horizon ends Monday 19 October at 08:30, which
 * is before that day's 16:00, so the last offer is Friday the 16th. Between
 * those two dates inclusive there are nineteen weekdays: four in September's
 * first part (22–25), then three full weeks of five.
 */
const DAYS = 19;
const PER_DAY = 4; // 16:00, 16:30, 17:00, 17:30
const TOTAL = DAYS * PER_DAY; // 76

/** 16:00 IST on Tuesday 22 September, as the instant a database column holds. */
const FIRST = '2026-09-22T10:30:00.000Z';
/** The half hour after it, which the buffer also takes out. */
const SECOND = '2026-09-22T11:00:00.000Z';
/** 17:30 IST on Friday 16 October, the last offer inside the horizon. */
const LAST = '2026-10-16T12:00:00.000Z';

const HALF_HOUR = 30 * 60_000;

const discovery = meetingType('discovery');
const cohortCall = meetingType('cohort-call');
const scope = meetingType('scope');

assert.ok(discovery && cohortCall && scope, 'the three public call types must exist in meetings.ts');

/** The generator, given the shared rules and whatever else the case needs. */
const slotsFor = (
  meeting: NonNullable<ReturnType<typeof meetingType>>,
  extra: { busy?: Interval[]; blocks?: Interval[] } = {},
): string[] =>
  generateSlots({
    meeting,
    timeZone: HOST_TIMEZONE,
    rules: RULES,
    blocks: extra.blocks ?? [],
    busy: extra.busy ?? [],
    now: NOW,
  });

/** A booking of the usual length, starting at an instant the generator offered. */
const bookingAt = (iso: string): Interval => ({
  start: Date.parse(iso),
  end: Date.parse(iso) + HALF_HOUR,
});

test('the band produces four slots a day, every weekday inside the window', () => {
  const list = slotsFor(discovery!);

  assert.equal(list.length, TOTAL);
  assert.equal(list[0], FIRST);
  assert.equal(list[list.length - 1], LAST);
  assert.equal(list[1], SECOND);

  // Sorted, and no instant offered twice. A rule edited into overlapping
  // itself would otherwise produce a slot the database constraint refuses.
  assert.deepEqual(list, [...new Set(list)].sort());
});

test('identical rules give the three public call types identical times', () => {
  // The cohort page and /caio are supposed to offer the same times. They share
  // a duration, a notice window and a horizon, so nothing but the rules can
  // make the lists differ.
  assert.deepEqual(slotsFor(cohortCall!), slotsFor(discovery!));
  assert.deepEqual(slotsFor(scope!), slotsFor(discovery!));
});

test('a cohort call booked at 16:00 is gone from the discovery list too', () => {
  // THE RULE THIS FILE EXISTS FOR. `busy` is every booking, whatever its type,
  // because it is one person's diary. Filter it by meeting_type and this fails.
  const busy = [bookingAt(FIRST)];

  assert.ok(!slotsFor(discovery!, { busy }).includes(FIRST), 'discovery still offers a time that is booked');
  assert.ok(!slotsFor(cohortCall!, { busy }).includes(FIRST), 'cohort-call still offers a time that is booked');
  assert.ok(!slotsFor(scope!, { busy }).includes(FIRST), 'scope still offers a time that is booked');

  // And the two lists stay in step with each other afterwards.
  assert.deepEqual(slotsFor(cohortCall!, { busy }), slotsFor(discovery!, { busy }));
});

test('the buffer takes the neighbouring slot as well, so one booking costs two', () => {
  // Fifteen quiet minutes either side of a thirty-minute call reach into the
  // next half hour. This is deliberate and it is what a reader sees on the
  // page, so it is stated here rather than left as a surprise.
  const list = slotsFor(discovery!, { busy: [bookingAt(FIRST)] });

  assert.equal(list.length, TOTAL - 2);
  assert.ok(!list.includes(FIRST));
  assert.ok(!list.includes(SECOND));
  assert.equal(list[0], '2026-09-22T11:30:00.000Z'); // 17:00 IST, the first one clear of the buffer
});

test('time blocked out is offered by no call type', () => {
  // A whole day taken out: midnight to midnight in the host zone.
  const blocks: Interval[] = [
    { start: Date.parse('2026-09-21T18:30:00.000Z'), end: Date.parse('2026-09-22T18:30:00.000Z') },
  ];

  for (const meeting of [discovery!, cohortCall!, scope!]) {
    const list = slotsFor(meeting, { blocks });
    assert.equal(list.length, TOTAL - PER_DAY);
    assert.ok(!list.includes(FIRST));
    assert.equal(list[0], '2026-09-23T10:30:00.000Z'); // Wednesday 16:00 IST
  }
});

test('no rules means no times, rather than an open diary', () => {
  const list = generateSlots({
    meeting: discovery!,
    timeZone: HOST_TIMEZONE,
    rules: [],
    blocks: [],
    busy: [],
    now: NOW,
  });

  assert.deepEqual(list, []);
});

/**
 * The one thing this file cannot reach from a pure function.
 *
 * Everything above tests `generateSlots`, which is handed a `busy` list and
 * has no idea where it came from. The rule that actually matters lives one
 * layer up, in how that list is fetched: `busyBetween()` must select every
 * booking, and must not narrow by `meeting_type`. Testing it for real needs a
 * database, so this reads the source instead and refuses the one-line edit.
 */
test('busyBetween reads every booking, whatever its call type', () => {
  const source = readFileSync(new URL('./store.ts', import.meta.url), 'utf8');
  const start = source.indexOf('async function busyBetween');
  assert.ok(start > -1, 'busyBetween has been renamed; this guard needs updating');

  const body = source.slice(start, source.indexOf('async function', start + 1));
  assert.ok(body.includes("from('bookings')"), 'busyBetween no longer reads the bookings table');
  assert.ok(
    !body.includes('meeting_type'),
    'busyBetween filters by meeting_type. A booked call must block that time on every call ' +
      'type, because it is one person and one diary. See the header of this file.',
  );
});
