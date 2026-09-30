// The role list every public form asks with a name and an email address.
//
// Sunil, 29 September 2026: "Wherever currently name and email are being asked
// for, ask for role there also", with these ten options and a way to type a
// role that is not on the list. One list, read by the application and enquiry
// forms (forms.ts), the download gate (resources.ts), the consulting enquiry
// forms and the booking widget, so the same person is described in the same
// words on every path into the practice.
//
// THE STORED VALUE IS THE LABEL. `people.role`, `leads.role` and `bookings.role`
// are plain text columns that held free text before this list existed, and the
// console prints them as they are. Storing a code here would make the same
// column hold two vocabularies. When somebody picks "Other" and types their own
// words, the typed words are what is stored (see RoleField.astro).

export const ROLE_OPTIONS = [
  'Founder / Business Owner',
  'Executive / Business Leader',
  'Product Manager / Product Leader',
  'Engineering / Technology Leader',
  'Software Engineer / Developer',
  'Data / AI / ML Professional',
  'Operations / Transformation',
  'Consultant / Agency',
  'Student / Researcher',
  'Other',
] as const;

/** The option that reveals the text box. */
export const ROLE_OTHER = 'Other';

/** The longest role a form accepts, listed or typed. */
export const ROLE_MAX = 200;
