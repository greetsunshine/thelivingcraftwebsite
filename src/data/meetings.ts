// The call types that can be booked, and the rules that govern every booking.
//
// These are offer facts — how long a discovery call is, how much notice it
// needs, how far ahead someone can book — so they live in code beside the page
// copy, the way facts.ts holds the price and the seat count. Availability is
// different: it changes every week and is edited from the console, so it lives
// in the database (`booking_rules`, `booking_blocks`).
//
// The split is worth stating plainly, because the next person to change
// something will have to pick one:
//   * "A discovery call is 30 minutes"        -> here.
//   * "I am free on Tuesday afternoons"       -> booking_rules, in the console.
//   * "I am away for the first week of March" -> booking_blocks, in the console.

/**
 * The practice's own timezone. Every availability rule is written in this zone,
 * and every slot is generated from it.
 *
 * Visitors never see it unless they ask: the widget shows times in the
 * visitor's own zone, which is what every booking site does and what stops a
 * Dubai prospect doing arithmetic in their head. This constant only decides
 * what "Tuesday 16:00" means when Sunil writes a rule.
 */
export const HOST_TIMEZONE = 'Asia/Kolkata';

/** Shown on the confirmation, so a booker knows who is expecting them. */
export const HOST_NAME = 'Sunil Mathew';

export type MeetingAudience = 'public' | 'learner';

export interface MeetingType {
  /** Stable key. Stored on every rule and every booking; never rename one in place. */
  key: string;
  /** Shown as the heading on the widget and as the calendar event title. */
  label: string;
  /** Minutes. Also the step the slot generator cuts an availability band into. */
  durationMin: number;
  /** One line under the heading. Plain English, no sales copy. */
  blurb: string;
  /**
   * Public types are bookable by anyone. Learner types require a seat, and the
   * name and email come from the signed-in learner rather than from a form.
   */
  audience: MeetingAudience;
  /** Hours of notice required. A slot closer than this is not offered. */
  noticeHours: number;
  /** How far ahead the calendar opens. Beyond this, nothing is bookable. */
  horizonDays: number;
  /**
   * Quiet minutes kept either side of a booked call.
   *
   * Enforced when slots are generated, NOT by the database constraint — that
   * one refuses genuine overlap only. So a buffer is a courtesy the site keeps
   * for itself, and two calls can still end up back to back if one of them is
   * moved by hand from the console. That is the right trade: the constraint
   * must never refuse a booking Sunil deliberately made.
   */
  bufferMin: number;
}

export const MEETING_TYPES: MeetingType[] = [
  {
    key: 'discovery',
    label: 'Discovery call',
    durationMin: 30,
    blurb:
      'Thirty minutes. We talk through where you are with AI, and I tell you plainly whether this is something I can help with.',
    audience: 'public',
    noticeHours: 24,
    horizonDays: 28,
    bufferMin: 15,
  },
  {
    /**
     * The cohort's "Talk with Sunil" route.
     *
     * A conversation, and deliberately NOT an application. forms.ts keeps the
     * two apart — "no application milestone inferred" — and the blurb says so
     * in as many words, because this replaced the written enquiry form and
     * inherits its one job: let somebody ask whether this fits before they
     * commit to anything.
     *
     * Same thirty minutes, notice and horizon as the two consulting calls.
     * Nothing here is a new offer fact: the cohort's own facts (fee, dates,
     * seats, admission) still come from facts.ts and are not restated.
     */
    key: 'cohort-call',
    label: 'Cohort call',
    durationMin: 30,
    blurb:
      'Thirty minutes. We talk through what you are trying to develop and whether this cohort is the right way to do it. This is a conversation, not an application.',
    audience: 'public',
    noticeHours: 24,
    horizonDays: 28,
    bufferMin: 15,
  },
  {
    key: 'scope',
    label: 'Scope call',
    durationMin: 30,
    blurb:
      'Thirty minutes. We walk through your systems at a high level, and I tell you what an AI Readiness Assessment would cover for you.',
    audience: 'public',
    noticeHours: 24,
    horizonDays: 28,
    bufferMin: 15,
  },
  {
    key: 'office-hours',
    label: 'Office hours',
    durationMin: 45,
    blurb:
      'Forty-five minutes, one to one. Bring the thing you are stuck on: a design you want argued with, an eval that will not stabilise, a decision you have to defend on Monday.',
    audience: 'learner',
    noticeHours: 12,
    horizonDays: 21,
    bufferMin: 10,
  },
];

export const meetingType = (key: string): MeetingType | null =>
  MEETING_TYPES.find((m) => m.key === key) ?? null;

/** Weekday names, indexed to match `booking_rules.weekday` and JS getDay(). */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
