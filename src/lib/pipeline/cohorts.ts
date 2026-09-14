// Which cohort an application belongs to, and whether it is taking any.
//
// ───────────────────────────────────────────────────────────────────────────
// THE COHORT ID IS RESOLVED HERE. IT IS NEVER ACCEPTED FROM THE REQUEST.
// ───────────────────────────────────────────────────────────────────────────
//
// The brief states this as a requirement rather than a suggestion: "The cohort
// ID is assigned from the server's active configuration, not accepted blindly
// from a hidden input." The attack it forecloses is dull and effective — a
// hidden field is visible to anybody with developer tools, and a posted id for
// a closed or historical cohort lands applications somewhere nobody is looking.
//
// The wider principle is the one worth keeping: **the form describes what the
// person wants; the server decides what that means.** A route ('application')
// is a statement of intent and is safe to accept. A cohort id is a fact about
// our own configuration and is not.
//
// ───────────────────────────────────────────────────────────────────────────
// CLOSING APPLICATIONS CLOSES ONE ROUTE, NOT THE PAGE.
// ───────────────────────────────────────────────────────────────────────────
//
// Acceptance case E18: "Application disabled truthfully; enquiries available;
// queued promotional invitations stopped." Three separate things, and the
// middle one is the one that gets forgotten. Somebody arriving the week after
// applications close still has a question worth answering, and a page that
// refuses every route teaches them to go away permanently rather than ask about
// the next cohort.
//
// So `application_open = false` refuses ONLY the application route, and it
// refuses it with wording that says what is true rather than implying the
// programme has ended.

import { db } from '../admin/supabase';
import type { Route } from './forms';

export interface Cohort {
  cohort_id: string;
  public_label: string;
  route: string;
  application_open: boolean;
  schedule_reference: string | null;
}

/**
 * What we know about the active cohort.
 *
 * THREE OUTCOMES, NOT TWO, AND THE THIRD IS THE POINT.
 *
 * A first version of this returned `Cohort | null`, and null meant both "there
 * is no cohort configured" and "the database did not answer". Those produced
 * the same refusal, which is the failure the brief names again and again in a
 * different costume: an unavailable source presented as a known state. A
 * visitor was told applications were unavailable when in fact nobody knew.
 *
 * They need different answers. A missing cohort is our configuration problem
 * and is stable — retrying in a minute changes nothing. An unreachable database
 * is transient, the retry is exactly right, and the person's request key means
 * it costs them nothing.
 */
export type CohortLookup =
  | { state: 'ok'; cohort: Cohort }
  | { state: 'none' }
  | { state: 'unavailable' };

/**
 * NOT CACHED, deliberately. This value decides whether a form is accepted, and
 * a sixty-second cache means a minute of applications accepted after Sunil
 * closes them. It is one indexed read on a table with a handful of rows, on a
 * path that already writes several.
 */
export async function resolveCohort(): Promise<CohortLookup> {
  const client = db();
  if (!client) return { state: 'unavailable' };

  try {
    const { data, error } = await client
      .from('cohorts')
      .select('cohort_id, public_label, route, application_open, schedule_reference')
      .eq('route', 'member')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // An error is the source failing. No error and no row is a real, observed
    // answer: the table is reachable and holds no member cohort.
    if (error) return { state: 'unavailable' };
    if (!data) return { state: 'none' };
    return { state: 'ok', cohort: data as Cohort };
  } catch {
    return { state: 'unavailable' };
  }
}

/**
 * May this route be submitted right now?
 *
 * The three refusal sentences are written to be read by the person who was
 * about to apply, and each one says what they can do instead. "Applications are
 * closed" on its own is a dead end; the versions below are not.
 */
export function routeIsOpen(
  route: Route,
  lookup: CohortLookup,
): { open: true } | { open: false; status: 409 | 503; reason: string } {
  // An enquiry never depends on a cohort, and that includes not depending on
  // one being READABLE. Somebody can ask about a programme that has not been
  // scheduled — the brief in terms: "Final schedule need not be published to
  // accept a fit enquiry." So a database that cannot answer about cohorts is
  // not a reason to refuse a question; the save will speak for itself.
  if (route === 'enquiry' || route === 'enterprise') return { open: true };

  if (lookup.state === 'unavailable') {
    // 503 and a retry, because we do not know that applications are shut. The
    // person's request key makes the retry free.
    return {
      open: false,
      status: 503,
      reason:
        'We could not open the application just now. Try again in a moment, or email apply@thelivingcraft.ai and we will pick it up directly.',
    };
  }

  if (lookup.state === 'none') {
    // Reachable, and genuinely holds no cohort. That is our problem, not a
    // transient one, so it does not invite a retry that cannot succeed.
    return {
      open: false,
      status: 409,
      reason:
        'The open cohort is not taking applications through this page at the moment. Ask about the cohort below, or email apply@thelivingcraft.ai.',
    };
  }

  if (!lookup.cohort.application_open) {
    // Acceptance case E18. Truthful, and it names the route that IS open —
    // "applications are closed" on its own teaches somebody to go away.
    return {
      open: false,
      status: 409,
      reason:
        'Applications for the open cohort are closed at the moment. Ask about the cohort below and we will tell you when the next one opens.',
    };
  }

  return { open: true };
}
