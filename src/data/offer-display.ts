// Approved public offer facts shared by every visitor-facing surface.
//
// This module existed to hold the 11 September V4 policy of publishing no fee,
// start date or week count. D1 reversed that on 14 September, so the values
// below now state the real figures. The module stays because the indirection is
// the useful part: /about, /programmes and the resource templates read one
// place, and the page, structured data, public API and Q&A assistant cannot
// drift apart.
//
// The figures themselves come from facts.ts. Do not retype one here.
import { cohort } from './facts';

/** The published time commitment. */
export const COMMITMENT = `${cohort.weeks} weeks, live, at ${cohort.commitment}.`;

/** The published cap. It is a cap, not a scarcity claim. */
export const COHORT_SIZE = `The cohort is capped at ${cohort.seats} seats.`;

/** Compact forms for comparison-table cells. */
export const COMMITMENT_CELL = `${cohort.weeks} weeks, ${cohort.commitment}`;
export const COHORT_SIZE_CELL = `${cohort.seats} seats, capped`;

/**
 * The public answer wherever a visitor asks about schedule or price WITHOUT a
 * region resolved. It deliberately does not name a figure: rates are per region
 * and only some are published, so the figure comes from cohortPriceAnswer() or
 * from the page, both of which know which region is asking.
 */
export const FEES_NOTE =
  `The cohort starts ${cohort.startsOn}. Fees are set per region and shown on the cohort page for your own region. Payment is due ${cohort.paymentDue}, and applying commits you to nothing.`;
