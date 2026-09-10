// What the cohort page is allowed to say about money and dates.
//
// ───────────────────────────────────────────────────────────────────────────
// THIS IS A FLAG AROUND AN UNANSWERED QUESTION, NOT A FEATURE TOGGLE.
// ───────────────────────────────────────────────────────────────────────────
//
// The copy Team Alchemy delivered on 10 September publishes no price, no
// dates and no week count. Its own FAQ answer is:
//
//   "Confirm the schedule, fees, payment, refund and access terms in the
//    final offer before committing."
//
// The page it replaces published all of it: six weeks, eight seats capped,
// September 2026, and three regional prices through the ?region= switch.
//
// Those are not the same offer described two ways. One says the number is
// settled and public; the other says the number is settled in a conversation.
// Choosing between them is Sunil's call about how he sells, not a copy edit,
// so it is referred to him as decision D1 (docs/cohort-pipeline/build-plan.md)
// and this flag holds the page at the truthful default until he answers.
//
// WHY IT IS NOT SIMPLY DELETED FROM THE PAGE
//
// The figures do not only live on the page. facts.ts feeds four consumers —
// JSON-LD, /llms.txt, /api/facts, and the visitor Q&A agent's grounding — and
// regions.ts feeds the price card. Deleting the block while leaving facts.ts
// alone produces the exact failure facts.ts exists to prevent, running
// backwards: **the assistant quotes a number the page deliberately withholds**,
// and possibly one the eventual offer does not match. A visitor asks the
// chatbot what it costs, gets ₹1,20,000, and hears something different in the
// fit conversation.
//
// So the flag governs BOTH ends, and the two must be moved together.
//
// WHEN D1 IS ANSWERED
//
//   A — publish as today.  Set PUBLISH_OFFER_FIGURES = true and reword the
//       "What are the dates and fees?" FAQ so the page does not contradict
//       itself. facts.ts and regions.ts are already correct for this.
//   B — withhold everywhere.  Leave this false AND strip weeks/seats/start/
//       prices from facts.ts and retire regions.ts. Re-run `npm run eval`;
//       the agent must answer "confirmed in the final offer" and a probe
//       should be added for it, because that is precisely the kind of silent
//       regression the eval exists to catch.
//   C — off the page, kept for the agent.  Leave this false and leave
//       facts.ts alone. Understand that you have chosen to let the assistant
//       say something the page will not. Write that decision down.
//
// Until then: the page carries a marked placeholder, regions.ts is untouched,
// and the /india, /dubai and /australia redirects keep working.

/**
 * False until D1 is answered. When false the page shows the approved
 * commitment wording and a placeholder where figures would go; it never
 * invents a number and never implies one is being withheld to create pressure.
 */
export const PUBLISH_OFFER_FIGURES = false;

/**
 * The commitment, in the approved words, with no number that has not been
 * agreed. "30 live hours plus independent work" is the whole of what the
 * delivered copy commits to, and the amount of independent work is explicitly
 * "confirmed before joining" — so it is not stated here either.
 */
export const COMMITMENT = '30 live hours plus independent work.';

/**
 * Seats. The delivered copy says "targets eight members", which is softer than
 * the "8 seats, capped" the old page ran and is deliberately not a scarcity
 * claim. Reproduced exactly rather than paraphrased.
 */
export const COHORT_SIZE = 'The open cohort targets eight members.';

/**
 * The same two facts as a table cell rather than a sentence.
 *
 * WHY THESE EXIST AT ALL. A comparison table wants a fragment, not a sentence
 * with a full stop — so the first page that needed one wrote "30, plus
 * independent work" straight into the markup, in a file whose own header says
 * "Never restate either inline". It was correct on the day, which is exactly
 * what makes it dangerous: if D1 resolves to withholding, somebody flips
 * PUBLISH_OFFER_FIGURES and those cells go on publishing a figure the module
 * has withdrawn, in a table nobody thought to check.
 *
 * A shorter form is a real need. The fix is to own the short form here too,
 * not to forbid the need. Both derive from the same facts as the sentences
 * above and move with them.
 */
export const COMMITMENT_CELL = '30 live hours, plus independent work';

export const COHORT_SIZE_CELL = 'Targets eight members';

/**
 * What the page says where a price would be. Shown only while
 * PUBLISH_OFFER_FIGURES is false.
 *
 * It answers the question honestly instead of dodging it. A page that goes
 * quiet about cost reads as evasive to exactly the senior audience this is
 * for; a page that says when the number arrives and what it will cover reads
 * as ordinary professional practice.
 */
export const FEES_NOTE =
  'Fees, schedule, payment, refund and access terms are confirmed in the final offer, before you commit to anything. Applying starts that conversation.';
