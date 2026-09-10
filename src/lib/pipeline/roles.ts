// Who may do what, and the one reason the console needed rebuilding.
//
// ───────────────────────────────────────────────────────────────────────────
// A SHARED PASSWORD CANNOT EXPRESS THIS, WHICH IS WHY NAMED ACCOUNTS ARRIVED.
// ───────────────────────────────────────────────────────────────────────────
//
// The console has one password. Everyone who holds it is the same person as
// far as the server is concerned. That was correct while the console showed
// traffic and a lead ledger, and it stops being correct the moment the brief
// says:
//
//   "Alchemy operator … Cannot approve technical fit/offers or confirm finance
//    evidence."
//   "Sunil … Finance confirmation reserved for finance."
//   "Programme owner … Cannot infer payment from attendance."
//
// Those are not preferences about who clicks which button. They are the reason
// an enrolment means something: a seat is confirmed only when two different
// people, who cannot act for each other, have each recorded their own fact.
// Sunil records an admission decision; finance records that money arrived.
// One account holding both powers turns that into one person's opinion.
//
// AND IT IS ENFORCED ON THE SERVER.
//
// The brief again, twice, because it expects this to be got wrong:
// "Authorisation is enforced server-side on reads, exports and writes." and
// "Admin pages and APIs require authentication; hiding a button is
// insufficient." So this module is imported by the API handlers and by the
// pages, and the pages use it ONLY to decide what to draw. A greyed-out button
// is a courtesy. The check that matters happens where the write does.
//
// WHAT THIS MODULE IS NOT
//
// It is not a permission system with inheritance, wildcards or a hierarchy.
// There are five roles and a fixed list of things that can be done, and the
// matrix below is small enough to read in one sitting — which is the point.
// A reader has to be able to answer "can an operator approve an offer?" by
// looking, not by resolving a tree.

/**
 * The five roles from the brief's permissions table, plus the one it calls
 * "Ein maintainer".
 *
 * `maintainer` is deliberately NOT a superuser. The brief scopes it to
 * "configuration and integration health; staging with synthetic data", and
 * "production personal-data access only when assigned for support". A
 * maintainer role that could read every lead would make the whole table
 * decorative, since whoever wrote the code holds it.
 */
export type Role = 'operator' | 'instructor' | 'finance' | 'programme' | 'maintainer';

export const ROLES: Role[] = ['operator', 'instructor', 'finance', 'programme', 'maintainer'];

export const ROLE_LABEL: Record<Role, string> = {
  operator: 'Alchemy operator',
  instructor: 'Sunil',
  finance: 'Finance',
  programme: 'Programme owner',
  maintainer: 'Maintainer',
};

/**
 * Everything the console can do that changes a record or reveals a person.
 *
 * Reads are capabilities too. `read.people` is what stands between a
 * maintainer debugging an integration and eight applicants' contact details,
 * and the brief asks for authorisation on reads by name.
 */
export type Capability =
  // reading
  | 'read.dashboard'
  | 'read.people'
  | 'read.finance'
  | 'read.audit'
  | 'export.records'
  // the pipeline
  | 'write.contact'
  | 'write.note'
  | 'write.task'
  | 'write.meeting'
  | 'write.stage'
  | 'write.qualification'
  // the two that must not sit in one pair of hands
  | 'approve.fit'
  | 'approve.offer'
  | 'approve.admission'
  | 'confirm.payment'
  // the programme
  | 'write.cohort'
  | 'confirm.attendance'
  // messages
  | 'send.approved'
  | 'approve.template'
  | 'manage.sequence'
  // the machine
  | 'admin.staff'
  | 'admin.integration'
  | 'admin.retention'
  | 'erase.person';

/**
 * The matrix. Read a row as "this role may do exactly these things."
 *
 * THE SEPARATIONS THAT ARE LOAD-BEARING, and the failure each one prevents:
 *
 *   operator has no `approve.*` and no `confirm.payment`
 *      — so a busy week cannot end with someone marked enrolled because they
 *        sounded keen on a call. Enrolment needs Sunil and finance.
 *
 *   instructor has no `confirm.payment`
 *      — the person who wants the cohort full is not the person who confirms
 *        the money arrived. The operating guide: "Alchemy never marks someone
 *        paid from an email click, positive reply or historical enrolment
 *        count", and the same restraint has to bind Sunil or it is advice.
 *
 *   finance has no `write.stage` and no `confirm.attendance`
 *      — "Cannot silently alter offer scope or attendance." A refund is
 *        evidence plus a review task, not a quiet reversal of a record.
 *
 *   programme has no `confirm.payment`
 *      — "Cannot infer payment from attendance." Somebody turning up to a
 *        session is not somebody who paid for it, and the roster must never
 *        become a billing document.
 *
 *   maintainer has no `read.people` and no `read.finance`
 *      — configuration and health, on synthetic data. Production personal data
 *        is an assignment, granted deliberately, not a standing right that
 *        arrives with commit access.
 *
 * `erase.person` sits with the operator alone because a deletion request is an
 * operational obligation with a clock on it, and it is a hard delete that
 * cascades. It is not a privilege — it is a duty somebody has to be able to
 * discharge without waiting for Sunil to be free.
 */
const MATRIX: Record<Role, Capability[]> = {
  operator: [
    'read.dashboard',
    'read.people',
    'export.records',
    'write.contact',
    'write.note',
    'write.task',
    'write.meeting',
    'write.stage',
    'write.qualification',
    'send.approved',
    'manage.sequence',
    'erase.person',
  ],
  instructor: [
    'read.dashboard',
    'read.people',
    'read.finance',
    'read.audit',
    'export.records',
    'write.note',
    'write.task',
    'write.meeting',
    'write.stage',
    'write.qualification',
    'approve.fit',
    'approve.offer',
    'approve.admission',
    'approve.template',
    'send.approved',
    'manage.sequence',
    'write.cohort',
  ],
  finance: ['read.dashboard', 'read.people', 'read.finance', 'read.audit', 'confirm.payment'],
  programme: [
    'read.dashboard',
    'read.people',
    'write.note',
    'write.task',
    'write.cohort',
    'confirm.attendance',
  ],
  maintainer: ['read.dashboard', 'admin.integration', 'admin.retention', 'admin.staff'],
};

/** Frozen at module load so a caller cannot widen its own permissions. */
const FROZEN = Object.fromEntries(
  ROLES.map((r) => [r, new Set(MATRIX[r])] as const),
) as unknown as Record<Role, ReadonlySet<Capability>>;

/**
 * The only question this module answers.
 *
 * A staff member may hold more than one role — a small practice where Sunil is
 * also the programme owner is the ordinary case, not an edge one — so this
 * takes a list and grants the union. What it never does is grant something
 * because a role was not recognised: an unknown role contributes nothing.
 */
export function can(roles: readonly Role[] | undefined, capability: Capability): boolean {
  if (!roles?.length) return false;
  return roles.some((role) => FROZEN[role]?.has(capability) ?? false);
}

/**
 * The sentence a person sees when the server says no.
 *
 * It names the role that CAN do it rather than only refusing, because the
 * refusal is usually correct and the next step is to ask someone. "You cannot
 * approve an offer" leaves somebody stuck; "offers are approved by Sunil"
 * tells them what to do in the next thirty seconds.
 */
export function refusal(capability: Capability): string {
  const holders = ROLES.filter((r) => FROZEN[r].has(capability)).map((r) => ROLE_LABEL[r]);
  if (!holders.length) return 'That is not something the console can do.';
  return `Not yours to record. ${new Intl.ListFormat('en-GB', { type: 'disjunction' }).format(holders)} can.`;
}

/** Every capability a set of roles grants. Used to draw a staff page, never to decide. */
export function capabilitiesOf(roles: readonly Role[]): Capability[] {
  const out = new Set<Capability>();
  roles.forEach((r) => FROZEN[r]?.forEach((c) => out.add(c)));
  return [...out].sort();
}

export const isRole = (v: unknown): v is Role =>
  typeof v === 'string' && (ROLES as string[]).includes(v);
