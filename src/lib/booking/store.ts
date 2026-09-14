// Everything the booking feature reads and writes.
//
// Same contract as the rest of the console's storage: every read degrades to an
// empty result and every failure is logged rather than thrown, so an unreachable
// database greys out the booking widget instead of breaking /caio. The one
// exception is creating a booking, which reports its failure honestly — telling
// someone their call is booked when the row did not save is the worst outcome
// available here.

import { db } from '../admin/supabase';
import { generateSlots, type AvailabilityRule, type Interval } from './slots';
import { HOST_TIMEZONE, meetingType, type MeetingType } from '../../data/meetings';

export type BookingStatus = 'confirmed' | 'reschedule_requested' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  created_at: string;
  meeting_type: string;
  starts_at: string;
  ends_at: string;
  name: string | null;
  email: string;
  company: string | null;
  role: string | null;
  notes: string | null;
  timezone: string | null;
  status: BookingStatus;
  learner_id: string | null;
  /**
   * HMAC of the token in the manage link. Never render this, and never send it
   * to a browser — it is on the row only so a request can be verified against
   * it. It is not a usable credential even if it leaks, which is the point.
   */
  manage_token_hash: string;
  google_event_id: string | null;
  google_meet_url: string | null;
  google_error: string | null;
  proposed_slots: string[] | null;
  cancelled_reason: string | null;
  admin_note: string | null;
  updated_at: string;
}

export interface Rule {
  id: string;
  meeting_type: string;
  weekday: number;
  start_min: number;
  end_min: number;
  active: boolean;
}

export interface Block {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

/** Statuses that still occupy their time. Must match the database constraint. */
const HOLDS_TIME: BookingStatus[] = ['confirmed', 'reschedule_requested'];

const fail = (where: string, message: string) => {
  console.error(`booking store ${where}: ${message}`);
};

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export async function allRules(): Promise<Rule[]> {
  const client = db();
  if (!client) return [];

  const { data, error } = await client
    .from('booking_rules')
    .select('id, meeting_type, weekday, start_min, end_min, active')
    .order('weekday')
    .order('start_min');

  if (error) {
    fail('allRules', error.message);
    return [];
  }
  return (data ?? []) as Rule[];
}

export async function allBlocks(): Promise<Block[]> {
  const client = db();
  if (!client) return [];

  // Past blocks are dropped from the console view rather than deleted. They
  // stay in the table because a block is also a record of why a week had no
  // calls, and nothing here is large enough to need pruning.
  const { data, error } = await client
    .from('booking_blocks')
    .select('id, starts_at, ends_at, reason')
    .gte('ends_at', new Date().toISOString())
    .order('starts_at');

  if (error) {
    fail('allBlocks', error.message);
    return [];
  }
  return (data ?? []) as Block[];
}

/** Bookings that currently hold time in a window, across every meeting type. */
async function busyBetween(fromIso: string, toIso: string): Promise<(Interval & { id: string })[]> {
  const client = db();
  if (!client) return [];

  const { data, error } = await client
    .from('bookings')
    .select('id, starts_at, ends_at')
    .in('status', HOLDS_TIME)
    .gte('ends_at', fromIso)
    .lte('starts_at', toIso);

  if (error) {
    fail('busyBetween', error.message);
    // An empty busy list would offer slots that are already taken. The database
    // constraint still refuses the double booking, so the visitor gets a clear
    // "that time just went" rather than a duplicate — but the honest thing is
    // to log it loudly, because the symptom is otherwise "the widget is flaky".
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    start: Date.parse(row.starts_at as string),
    end: Date.parse(row.ends_at as string),
  }));
}

async function blocksBetween(fromIso: string, toIso: string): Promise<Interval[]> {
  const client = db();
  if (!client) return [];

  const { data, error } = await client
    .from('booking_blocks')
    .select('starts_at, ends_at')
    .gte('ends_at', fromIso)
    .lte('starts_at', toIso);

  if (error) {
    fail('blocksBetween', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    start: Date.parse(row.starts_at as string),
    end: Date.parse(row.ends_at as string),
  }));
}

/**
 * Bookable instants for one meeting type, soonest first.
 *
 * The window queried is the meeting's own horizon plus a day of slack either
 * side, so a booking that starts just outside the window but overlaps a slot
 * inside it still blocks that slot.
 *
 * `excludeBookingId` is for rescheduling, and it is not an optimisation. A
 * booking blocks its own neighbours through the buffer, so without this a
 * caller trying to move a 16:00 call to 16:30 is told 16:30 is unavailable —
 * by the very call they are trying to move.
 */
export async function availableSlots(
  meeting: MeetingType,
  now = new Date(),
  excludeBookingId?: string,
): Promise<string[]> {
  const from = new Date(now.getTime() - 86_400_000).toISOString();
  const to = new Date(now.getTime() + (meeting.horizonDays + 1) * 86_400_000).toISOString();

  const [rules, blocks, held] = await Promise.all([allRules(), blocksBetween(from, to), busyBetween(from, to)]);
  const busy = excludeBookingId ? held.filter((b) => b.id !== excludeBookingId) : held;

  const mine: AvailabilityRule[] = rules
    .filter((r) => r.active && r.meeting_type === meeting.key)
    .map((r) => ({ weekday: r.weekday, start_min: r.start_min, end_min: r.end_min }));

  return generateSlots({ meeting, timeZone: HOST_TIMEZONE, rules: mine, blocks, busy, now });
}

export async function createRule(input: Omit<Rule, 'id' | 'active'> & { active?: boolean }): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('booking_rules').insert({
    meeting_type: input.meeting_type,
    weekday: input.weekday,
    start_min: input.start_min,
    end_min: input.end_min,
    active: input.active ?? true,
  });

  if (error) {
    fail('createRule', error.message);
    return false;
  }
  return true;
}

export async function setRuleActive(id: string, active: boolean): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('booking_rules').update({ active }).eq('id', id);
  if (error) {
    fail('setRuleActive', error.message);
    return false;
  }
  return true;
}

export async function deleteRule(id: string): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('booking_rules').delete().eq('id', id);
  if (error) {
    fail('deleteRule', error.message);
    return false;
  }
  return true;
}

export async function createBlock(startsAt: string, endsAt: string, reason: string | null): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('booking_blocks').insert({ starts_at: startsAt, ends_at: endsAt, reason });
  if (error) {
    fail('createBlock', error.message);
    return false;
  }
  return true;
}

export async function deleteBlock(id: string): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('booking_blocks').delete().eq('id', id);
  if (error) {
    fail('deleteBlock', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export interface NewBooking {
  meeting_type: string;
  starts_at: string;
  ends_at: string;
  name: string | null;
  email: string;
  company: string | null;
  role: string | null;
  notes: string | null;
  timezone: string | null;
  learner_id: string | null;
  manage_token_hash: string;
}

export type CreateResult =
  | { ok: true; booking: Booking }
  | { ok: false; reason: 'taken' | 'unavailable' | 'error'; message: string };

/**
 * Insert a booking, or say why not.
 *
 * `23P01` is an exclusion-constraint violation, which here means exactly one
 * thing: somebody else took that slot. It is reported as 'taken' so the widget
 * can refresh the times and ask the visitor to pick again, which is what every
 * booking site does and the only honest response to losing the race.
 */
export async function insertBooking(input: NewBooking): Promise<CreateResult> {
  const client = db();
  if (!client) {
    return { ok: false, reason: 'error', message: 'Booking storage is not configured.' };
  }

  const { data, error } = await client.from('bookings').insert(input).select().single();

  if (error) {
    if (error.code === '23P01') {
      return { ok: false, reason: 'taken', message: 'That time was booked a moment ago.' };
    }
    fail('insertBooking', error.message);
    return { ok: false, reason: 'error', message: 'The booking could not be saved.' };
  }

  return { ok: true, booking: data as Booking };
}

export async function bookingById(id: string): Promise<Booking | null> {
  const client = db();
  if (!client) return null;

  const { data, error } = await client.from('bookings').select('*').eq('id', id).maybeSingle();
  if (error) {
    fail('bookingById', error.message);
    return null;
  }
  return (data as Booking) ?? null;
}

/** The calendar sync result, recorded after the fact. Never blocks the booking. */
export async function recordSync(
  id: string,
  sync: { eventId?: string; meetUrl?: string; error?: string },
): Promise<void> {
  const client = db();
  if (!client) return;

  const { error } = await client
    .from('bookings')
    .update({
      google_event_id: sync.eventId ?? null,
      google_meet_url: sync.meetUrl ?? null,
      google_error: sync.error ?? null,
    })
    .eq('id', id);

  if (error) fail('recordSync', error.message);
}

export type MoveResult = { ok: true; booking: Booking } | { ok: false; reason: 'taken' | 'error'; message: string };

/**
 * Move a booking to a new time.
 *
 * Clears `proposed_slots` and returns the booking to 'confirmed': once the call
 * has moved, the alternatives Sunil offered are spent, and leaving them on the
 * row means the manage page keeps asking a question that has been answered.
 */
export async function moveBooking(id: string, startsAt: string, endsAt: string): Promise<MoveResult> {
  const client = db();
  if (!client) return { ok: false, reason: 'error', message: 'Booking storage is not configured.' };

  const { data, error } = await client
    .from('bookings')
    .update({
      starts_at: startsAt,
      ends_at: endsAt,
      status: 'confirmed',
      proposed_slots: null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23P01') {
      return { ok: false, reason: 'taken', message: 'That time was booked a moment ago.' };
    }
    fail('moveBooking', error.message);
    return { ok: false, reason: 'error', message: 'The booking could not be moved.' };
  }

  return { ok: true, booking: data as Booking };
}

export async function cancelBooking(id: string, reason: string | null): Promise<boolean> {
  const client = db();
  if (!client) return false;

  // Cancelled rather than deleted. A cancellation is a fact about the practice,
  // and the row also stops the slot looking like it was never booked. Deleting
  // a person's booking on request is a separate, deliberate erase.
  const { error } = await client
    .from('bookings')
    .update({ status: 'cancelled', cancelled_reason: reason, proposed_slots: null })
    .eq('id', id);

  if (error) {
    fail('cancelBooking', error.message);
    return false;
  }
  return true;
}

/**
 * Ask the other person to move, and offer them specific times.
 *
 * The original slot is deliberately still held: the status stays in the
 * time-holding set, so nobody else can take it while the answer is pending. If
 * they never reply, the call stands as booked, which is the safe default.
 */
export async function proposeAlternatives(id: string, slots: string[]): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client
    .from('bookings')
    .update({ status: 'reschedule_requested', proposed_slots: slots })
    .eq('id', id);

  if (error) {
    fail('proposeAlternatives', error.message);
    return false;
  }
  return true;
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('bookings').update({ status }).eq('id', id);
  if (error) {
    fail('setBookingStatus', error.message);
    return false;
  }
  return true;
}

export async function setAdminNote(id: string, note: string): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('bookings').update({ admin_note: note }).eq('id', id);
  if (error) {
    fail('setAdminNote', error.message);
    return false;
  }
  return true;
}

/** Hard delete, for a deletion request. Matches the Erase button on leads and learners. */
export async function eraseBooking(id: string): Promise<boolean> {
  const client = db();
  if (!client) return false;

  const { error } = await client.from('bookings').delete().eq('id', id);
  if (error) {
    fail('eraseBooking', error.message);
    return false;
  }
  return true;
}

export interface BookingList {
  upcoming: Booking[];
  past: Booking[];
}

/** Everything the console shows: what is coming, and the last sixty days behind. */
export async function listBookings(): Promise<BookingList> {
  const client = db();
  if (!client) return { upcoming: [], past: [] };

  const now = new Date().toISOString();
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();

  const [ahead, behind] = await Promise.all([
    client.from('bookings').select('*').gte('starts_at', now).order('starts_at', { ascending: true }).limit(200),
    client
      .from('bookings')
      .select('*')
      .lt('starts_at', now)
      .gte('starts_at', since)
      .order('starts_at', { ascending: false })
      .limit(100),
  ]);

  if (ahead.error) fail('listBookings upcoming', ahead.error.message);
  if (behind.error) fail('listBookings past', behind.error.message);

  return {
    upcoming: (ahead.data ?? []) as Booking[],
    past: (behind.data ?? []) as Booking[],
  };
}

/** The bookings one learner holds, for their own page inside /craft. */
export async function bookingsForLearner(learnerId: string): Promise<Booking[]> {
  const client = db();
  if (!client) return [];

  const { data, error } = await client
    .from('bookings')
    .select('*')
    .eq('learner_id', learnerId)
    .in('status', HOLDS_TIME)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at');

  if (error) {
    fail('bookingsForLearner', error.message);
    return [];
  }
  return (data ?? []) as Booking[];
}

/** Resolve a stored meeting_type to its definition, for display. */
export const meetingFor = (booking: Booking): MeetingType | null => meetingType(booking.meeting_type);
