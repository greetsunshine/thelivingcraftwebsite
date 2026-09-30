// The role list every public form asks with a name and an email address.
//
// Sunil, 29 September 2026: "Wherever currently name and email are being asked
// for, ask for role there also", with these ten options and a way to type a
// role that is not on the list. One list, read by the application and enquiry
// forms (forms.ts), the download gate (resources.ts), the consulting enquiry
// forms and the booking widget, so the same person is described in the same
// words on every path into the practice.
//
// TWO VALUES PER ROLE, AND EACH HAS A JOB.
//
//   * THE LABEL IS WHAT IS POSTED AND WHAT IS SHOWN. `people.role`, `leads.role`
//     and `bookings.role` are plain text columns that held free text before
//     this list existed; the console, the inbox copy and the calendar invite
//     print them as they are. When somebody picks "Other" and types their own
//     words, the typed words are what is stored there (RoleField.astro).
//   * THE CODE IS WHAT THE MACHINE READS. `people.role_code` (30 September
//     2026) holds it, and the resource follow-up selection routes on it
//     (resource-routing.ts). A code never changes when a label is reworded, so
//     a routing rule written against 'engineering_leader' survives the label
//     becoming "Engineering leader". It is derived from the label on the
//     server by `roleCodeFor()`, in one place, so no form has to post two
//     fields and no second copy of the mapping exists.

export interface AudienceRole {
  /** Stable. Never renamed, never reused for a different meaning. */
  code: string;
  /** What the person sees and what is stored as their readable role. */
  label: string;
}

export const ROLES = [
  { code: 'founder', label: 'Founder / Business Owner' },
  { code: 'executive', label: 'Executive / Business Leader' },
  { code: 'product', label: 'Product Manager / Product Leader' },
  { code: 'engineering_leader', label: 'Engineering / Technology Leader' },
  { code: 'engineer', label: 'Software Engineer / Developer' },
  { code: 'data_ai', label: 'Data / AI / ML Professional' },
  { code: 'operations', label: 'Operations / Transformation' },
  { code: 'consultant', label: 'Consultant / Agency' },
  { code: 'student', label: 'Student / Researcher' },
  { code: 'other', label: 'Other' },
] as const satisfies readonly AudienceRole[];

export type RoleCode = (typeof ROLES)[number]['code'];

export const ROLE_CODES: readonly RoleCode[] = ROLES.map((r) => r.code);

/** The labels, in the order the select shows them. */
export const ROLE_OPTIONS: readonly string[] = ROLES.map((r) => r.label);

/** The option that reveals the text box. */
export const ROLE_OTHER = 'Other';

/** The longest role a form accepts, listed or typed. */
export const ROLE_MAX = 200;

/** The question, the same words on every form (the brief, 30 September 2026). */
export const ROLE_QUESTION = 'Which best describes your role?';

/**
 * The code for a posted role.
 *
 * A listed label maps to its code, case-insensitively. Anything else that is
 * not blank is the typed "Other" case and maps to 'other'. Blank is null: an
 * optional field left empty is the absence of an answer, not "other".
 */
export const roleCodeFor = (value: string | null | undefined): RoleCode | null => {
  const t = (value ?? '').trim();
  if (!t) return null;
  const hit = ROLES.find((r) => r.label.toLowerCase() === t.toLowerCase());
  return hit ? hit.code : 'other';
};

/** The readable label for a code, for a screen that only has the code. */
export const roleLabelFor = (code: string | null | undefined): string | null =>
  ROLES.find((r) => r.code === code)?.label ?? null;

export const isRoleCode = (v: unknown): v is RoleCode =>
  typeof v === 'string' && (ROLE_CODES as readonly string[]).includes(v);
