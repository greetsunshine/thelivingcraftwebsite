// The guided walkthrough — the script, and the rule about when to offer it.
//
// Design: docs/learning-agent/guided-walkthrough/plan.md. Four things from that
// plan are load-bearing here and should not be undone casually.
//
// ---------------------------------------------------------------------------
// 1. NO TOUR EVER CROSSES A PAGE
// ---------------------------------------------------------------------------
// `route` is on the TOUR, not on the step. The original design walked a learner
// INTO six pages, which meant tour state had to survive a navigation — the
// hardest part of the whole feature and the source of most of its failure
// modes. A spine that stays on the dashboard, plus per-page tours that stay on
// their page, means every tour runs inside one route. Step state lives in a
// closure and dies with the tour: no `?tour=` step cursor, no resume-after-swap,
// no ClientRouter re-entry bug, no redirect-loop guard.
//
// A tour whose steps need two routes is not expressible in this model, and that
// is the point.
//
// ---------------------------------------------------------------------------
// 2. IT POINTS, IT NEVER PRESSES
// ---------------------------------------------------------------------------
// There is no `action` field and there must not be one. A tour that drives the
// UI can submit a real ADR, post a real thread, or answer a real quiz item on
// somebody's behalf. Every step is a spotlight and a sentence.
//
// ---------------------------------------------------------------------------
// 3. EVERY STEP READS CORRECTLY ON AN EMPTY PAGE
// ---------------------------------------------------------------------------
// The person this exists for has no threads, no submissions and no answers, and
// six of the seven surfaces are empty on their first morning. So copy says what
// a surface is FOR and what will appear on it. Never "here are your results".
//
// ---------------------------------------------------------------------------
// 4. TARGETS ARE `data-tour`, AND EVERY ONE IS A CONTRACT
// ---------------------------------------------------------------------------
// Never a class and never a DOM path: a class is a styling decision somebody
// renames in a redesign, silently breaking the tour with no error anywhere.
// `data-tour="quiz-confidence"` declares *this element is explained by the
// tour*. `npm run check:tour` fails when a target here matches nothing under
// src/, which is what turns a silent break into a review-time one.
//
// A missing target at runtime SKIPS ITS STEP and carries on. Never a spotlight
// at (0,0), never a dead Next.

export interface TourStep {
  id: string;
  /** A `[data-tour]` value. Omitted means a centred card with no spotlight. */
  target?: string;
  title: string;
  /** One or two sentences. Plain text — no markup, no links. */
  body: string;
  /** A hint the overlay may flip or clamp, not a promise. */
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export interface Tour {
  id: string;
  /** What the ⓘ calls it. */
  label: string;
  /** The exact path this tour runs on. */
  route: string;
  /**
   * A RegExp source matching routes this tour also runs on. Only the session
   * pages need it — /craft/week-0 … /craft/week-6 are one page with seven URLs.
   * Kept as a string so the whole script is still data.
   */
  pattern?: string;
  steps: TourStep[];
}

export const SPINE_ID = 'spine';

/**
 * The spine — the dashboard, and what every destination is for.
 *
 * This is what auto-starts on a first sign-in, and finishing or skipping it is
 * what "done" means. It is a map, not a walk: it names each surface without
 * going there, because teaching that arrives four minutes before it is needed
 * is teaching an audience of eight director-level engineers will close.
 *
 * Two steps here self-skip on an ordinary day. `live-banner` exists only while
 * a session is actually running, and `intake-card` disappears once the intake
 * is in. Both are correct as skips, and both are the reason the missing-target
 * rule had to be "skip and continue" rather than "stop".
 */
const SPINE: Tour = {
  id: SPINE_ID,
  label: 'Take the tour',
  route: '/craft',
  steps: [
    {
      id: 'welcome',
      title: 'This is your seat',
      body:
        'Ninety seconds on what is here and what each part is for. Escape leaves at any point, and the ⓘ at the bottom of the rail brings it back whenever you want it.',
    },
    {
      id: 'live',
      target: 'live-banner',
      title: 'A session is running right now',
      body:
        'This banner is the only route into session mode, and nothing redirects you there. Inside it you get one thing at a time — the rating, the checkpoint, the quiz, the pair draft — and nothing else on the screen.',
      placement: 'bottom',
    },
    {
      id: 'todo',
      target: 'todo',
      title: 'What is outstanding, when you want it',
      body:
        'A list you open yourself. You get one prompt at the moment something opens, and after that it waits here. Nothing chases you, and nothing counts how long you took.',
      placement: 'bottom',
    },
    {
      id: 'intake',
      target: 'intake-card',
      title: 'The one thing due before week 1',
      body:
        'Thirteen questions about where you are starting from. It is asked once now and once at week 6, in the same words, so the two sets of answers mean the same thing. Nobody is ranked against anybody.',
      placement: 'bottom',
    },
    {
      id: 'modules',
      target: 'nav-modules',
      title: 'The sessions',
      body:
        'One page a week, filling in as the cohort runs. Each carries its own day — what happens when, the checkpoints after each block, what to do before you arrive and what to do after.',
      placement: 'right',
    },
    {
      id: 'notes',
      target: 'nav-notes',
      title: 'Field notes',
      body:
        'What has actually moved in the agentic-AI space, gathered weekly and cited. It is the same feed the public site carries, not a summary of the sessions.',
      placement: 'right',
    },
    {
      id: 'discussion',
      target: 'nav-discussion',
      title: 'The room, and the one rule that makes it safe',
      body:
        'Ask anything. Dates and deadlines are answered from the syllabus by code. Anything about the material goes to the whole cohort and to Sunil, and only his reply carries the course’s position — a peer answer is never repeated back to somebody else as fact.',
      placement: 'right',
    },
    {
      id: 'quiz',
      target: 'nav-quiz',
      title: 'The weekly check is calibration',
      body:
        'Eight questions, one at a time, with a confidence rating beside each. Confidently wrong is the only dangerous state, so a low confidence costs you nothing and tells Sunil something true. Nobody is scored or ranked.',
      placement: 'right',
    },
    {
      id: 'adr',
      target: 'nav-adr',
      title: 'The decision record',
      body:
        'One a week, on the decision that week’s work forced. Seven sections, the same seven every week, so week 6 reads against week 1. This is the artefact of the cohort, not the code.',
      placement: 'right',
    },
    {
      id: 'feedback',
      target: 'nav-feedback',
      title: 'Four questions at the close',
      body:
        'Two about the session and two about you. What changed because of them is written back on the same page. That is the end of the tour — the ⓘ below reopens it, and every page has its own short one.',
      placement: 'right',
    },
  ],
};

/**
 * The page tours — pulled from the ⓘ, never pushed.
 *
 * Two to three steps each, on the page they describe, so the explanation
 * arrives when the thing is in front of you.
 */
const PAGE_TOURS: Tour[] = [
  {
    id: 'modules',
    label: 'What’s on this page?',
    route: '/craft/modules',
    steps: [
      {
        id: 'module-list',
        target: 'module-list',
        title: 'Four modules, six sessions',
        body:
          'Week 0 is the pre-work and belongs to no module. The other six sit inside one of these four, and each card lists the weeks it covers.',
      },
      {
        id: 'module-card',
        target: 'module-card',
        title: 'Ready, taught, or still being written',
        body:
          'Material is prepared close to the week it is taught, on purpose, so it reflects what is true in the field now rather than what was true when the page was built. Nothing here scores you — a module is a piece of the syllabus, not a progress bar.',
      },
    ],
  },
  {
    id: 'session',
    label: 'What’s on this page?',
    route: '/craft/week-1',
    pattern: '^/craft/week-\\d+$',
    steps: [
      {
        id: 'session-outcomes',
        target: 'session-outcomes',
        title: 'Five statements, rated twice',
        body:
          'You rate yourself against these in the opening, before anything is taught, and against the identical five at the close. Nobody sees the first number but you — the pair is the point, not the score.',
        placement: 'bottom',
      },
      {
        id: 'session-day',
        target: 'session-day',
        title: 'The day, and where the stops are',
        body:
          'Offsets from the start, not clock times. After most blocks there is a checkpoint: a short list of things you should now be able to do, and one number in chat on the last of them.',
        placement: 'top',
      },
      {
        id: 'session-checkpoint',
        target: 'session-checkpoint',
        title: 'A checkpoint is a slow-down signal',
        body:
          'It is not a test of you, and nothing adds it up. A 2 means go slower, said by somebody who would not say it out loud — which is the only way anyone finds out while the session can still change.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'discussion',
    label: 'What’s on this page?',
    route: '/craft/discussion',
    steps: [
      {
        id: 'thread-composer',
        target: 'thread-composer',
        title: 'Two kinds of question, one box',
        body:
          'Dates, deadlines and what is due are answered here and now, from the syllabus, by code. Anything about the material opens a thread the whole room can see and answer.',
        placement: 'bottom',
      },
      {
        id: 'thread-list',
        target: 'thread-list',
        title: 'Unanswered is an invitation',
        body:
          'The count on the dashboard is the room’s open questions, not yours. Answering one is the most useful thing you can do here in five minutes.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'quiz',
    label: 'What’s on this page?',
    route: '/craft/quiz',
    steps: [
      {
        id: 'quiz-card',
        target: 'quiz-card',
        title: 'One question at a time',
        body:
          'The eight are mixed across the whole session rather than grouped by block, deliberately — sorting them by topic lets you match on the heading instead of on the problem.',
        placement: 'bottom',
      },
      {
        id: 'quiz-confidence',
        target: 'quiz-confidence',
        title: 'The confidence rating is the point',
        body:
          'Wrong and unsure is a gap. Wrong and certain is the one worth finding, and it is the only thing here that cannot be found from the answers alone.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'adr',
    label: 'What’s on this page?',
    route: '/craft/adr',
    steps: [
      {
        id: 'adr-sections',
        target: 'adr-sections',
        title: 'Seven sections, every week',
        body:
          'Goals must be testable — "safer" is not a goal, "no dispute is credited twice" is. Alternatives is the load-bearing one: rejecting "use a better model" well is most of the argument.',
        placement: 'bottom',
      },
      {
        id: 'adr-actions',
        target: 'adr-actions',
        title: 'Draft freely, submit once',
        body:
          'A draft is yours to change as often as you like. Submitting freezes it, because a record you can quietly rewrite after the fact is not a record.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'feedback',
    label: 'What’s on this page?',
    route: '/craft/feedback',
    steps: [
      {
        id: 'feedback-form',
        target: 'feedback-form',
        title: 'Four questions, about sixty seconds',
        body:
          'Two about the session and two about you. The one that matters most is what you are still unsure about — it sets what the next session opens with.',
        placement: 'bottom',
      },
      {
        id: 'feedback-changes',
        target: 'feedback-changes',
        title: 'And what changed because of it',
        body:
          'Answers to the room are written back here. A feedback form nobody ever hears back from teaches people to stop filling it in.',
        placement: 'top',
      },
    ],
  },
];

export const TOURS: Tour[] = [SPINE, ...PAGE_TOURS];

const norm = (path: string) => path.replace(/\/+$/, '') || '/';

/** The tour for a route, or null. The spine is not returned by this. */
export function tourFor(path: string): Tour | null {
  const p = norm(path);
  return (
    PAGE_TOURS.find((t) => (t.pattern ? new RegExp(t.pattern).test(p) : norm(t.route) === p)) ?? null
  );
}

export function tourById(id: string): Tour | null {
  return TOURS.find((t) => t.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// When to offer it
// ---------------------------------------------------------------------------
// "At least the first week, if they don't complete the whole guided workflow,
// nudge them two or three times."
//
// Offered at most FOUR times, then never again: once as an auto-start on the
// first sign-in, then up to three dismissible cards on later days. The third
// card says it is the last one, which is both more honest and more effective
// than asking a fourth time.
//
// Two gates are worth explaining.
//
// `tour_offers < MAX_OFFERS` and one offer per CALENDAR DAY, so somebody who
// opens the dashboard six times on Tuesday is asked once.
//
// FOURTEEN DAYS FROM `created_at`, not from the cohort start, because there is
// no machine-readable cohort start date — `cohort.startsOn` in facts.ts is the
// display string 'September 2026'. Seats are issued on a rolling basis anyway,
// so "their first week" and "the cohort's first week" are different things, and
// the learner's own is the one that matters here.

export const MAX_OFFERS = 4;
const WINDOW_DAYS = 14;

export interface TourState {
  tour_completed_at: string | null;
  tour_offers: number;
  tour_offered_at: string | null;
  created_at: string;
}

export type OfferKind =
  /** First sign-in: the spine opens by itself. */
  | 'auto'
  /** A dismissible card at the top of the dashboard. Never an auto-start — */
  /** being grabbed by an overlay you already escaped is worse than being asked. */
  | 'nudge'
  /** The third and last card says so. */
  | 'last'
  | null;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * What, if anything, to put in front of this learner on the dashboard.
 *
 * Null for everybody who has finished it, skipped it, been asked four times, or
 * been asked already today — which after the first fortnight is everybody.
 */
export function offerKind(state: TourState | null, now: Date = new Date()): OfferKind {
  if (!state) return null;
  if (state.tour_completed_at) return null;
  if (state.tour_offers >= MAX_OFFERS) return null;

  const created = new Date(state.created_at);
  if (Number.isNaN(created.getTime())) return null;
  const days = (now.getTime() - created.getTime()) / 86_400_000;
  if (days > WINDOW_DAYS) return null;

  if (state.tour_offered_at) {
    const last = new Date(state.tour_offered_at);
    if (!Number.isNaN(last.getTime()) && sameDay(last, now)) return null;
  }

  if (state.tour_offers === 0) return 'auto';
  return state.tour_offers === MAX_OFFERS - 1 ? 'last' : 'nudge';
}
