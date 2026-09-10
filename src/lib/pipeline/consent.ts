// Marketing permission — the wording, and the version of the wording.
//
// ───────────────────────────────────────────────────────────────────────────
// A CONSENT RECORD HAS TO BE ABLE TO SAY WHAT THE PERSON ACTUALLY SAW.
// ───────────────────────────────────────────────────────────────────────────
//
// This is why the words live in a versioned constant rather than in the form
// markup. Somebody ticks a box in September; in March they ask why they are
// receiving something, or a regulator does. The answer cannot be "here is what
// the box says today" — the box may have been reworded twice since. It has to
// be "here is what it said when you ticked it", and that is only possible if
// the wording travels into the record alongside the tick.
//
// So: EDITING `wording` WITHOUT CHANGING `version` IS THE BUG THIS FILE EXISTS
// TO PREVENT. It silently rewrites what every past person agreed to. A new
// form of words is a new version, the old one stays in this file as history,
// and records written under it keep pointing at it.
//
// THREE RULES FROM THE BRIEF, AND THEY ARE NOT NEGOTIABLE
//
//   * Unticked. "Leave it unchecked." A pre-ticked box is not consent, and in
//     several of the jurisdictions this practice sells into it is not even
//     arguably consent.
//   * Separate. It is collected beside the application, never as a condition
//     of it. Refusing it must cost nothing — the application saves either way.
//   * A RECEIPT IS NOT MARKETING CONSENT. The transactional acknowledgement
//     goes to everybody who applies, because they asked us to do something and
//     we did it. Nurture goes only to the people below. Conflating the two is
//     the single most common way a practice like this ends up sending
//     marketing to somebody who never agreed to any.
//
// Withdrawal is a NEW ROW, never an update of the granting row. The data
// dictionary: "Preserve changes; import provenance instead of treating old
// relationships as opt-in." An UPDATE would destroy the evidence that
// permission was ever given, which is exactly the evidence you need when
// somebody asks why they used to receive something.

export interface ConsentDefinition {
  /** What the permission is for. One purpose per record. */
  purpose: 'marketing';
  /**
   * Stable identifier for this exact form of words. Date-stamped so a reader
   * can tell at a glance which came first. Never reused, never edited.
   */
  version: string;
  /** The words shown beside the tick, exactly as approved. */
  wording: string;
}

/**
 * The current wording, verbatim from the brief's § Public forms and success
 * states. Reproduced rather than paraphrased — this sentence is the thing the
 * record points at, so "tidying" it is rewriting history.
 */
export const MARKETING_CONSENT = {
  purpose: 'marketing',
  version: 'mkt-2026-09-10',
  wording:
    'Email me programme updates and practical resources from The Living Craft. I can unsubscribe at any time.',
} as const satisfies ConsentDefinition;

/**
 * Every wording that has ever been in use, newest first.
 *
 * Keep retired versions here forever. The console renders a consent record by
 * looking its version up in this list; a version it cannot find is a record it
 * cannot explain, which is worse than a slightly longer file.
 */
export const CONSENT_HISTORY: ConsentDefinition[] = [MARKETING_CONSENT];

export const consentVersion = (version: string): ConsentDefinition | undefined =>
  CONSENT_HISTORY.find((c) => c.version === version);

/**
 * The two states a permission can be in.
 *
 * There is deliberately no 'pending' or 'implied'. Somebody has said yes, or
 * they have not; and if they have not, nothing may be sent. An absent record
 * is the absence of permission, and it does not need a name.
 */
export type ConsentState = 'granted' | 'withdrawn';
