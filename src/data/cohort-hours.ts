// The cohort's live contact hours, in a module of its own.
//
// facts.ts is where every offer fact is read from, and it re-exports this one
// as `cohort.liveHours`. It lives here only because cohort-copy.ts needs it
// too, and cohort-copy.ts cannot import facts.ts: facts.ts already imports
// cohort-copy.ts, and the circle would leave one of them undefined at load.
// Change the figure here and every surface moves with it.
export const LIVE_HOURS = 30;
