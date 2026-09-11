// The three public routes into the practice, defined once.
//
// THIS FILE IS THE CONTRACT. The page renders from it, the API validates
// against it, and the console reads its labels back when it displays an
// answer. One definition, three consumers — the same argument as facts.ts,
// for the same reason: a field that is required in the browser and optional
// on the server is a validation bug nobody sees until a row arrives half
// empty, and a label that drifts between the form and the console means two
// people describe the same answer differently.
//
// The brief (§ Public forms and success states) fixes what each route asks
// for. What it leaves to us is the length limits, and it says so explicitly:
// "Set field-length limits in the implementation contract and test them."
// They are here, and the server enforces them — a browser is not a validator.
//
// WHAT IS DELIBERATELY ABSENT
//   * No confidential-document upload. The brief forbids requesting them and
//     the copy repeats it: "Do not share confidential company materials."
//   * No cohort ID. It is resolved from server configuration, never accepted
//     from a hidden input — see resolveCohort() in cohorts.ts.
//   * No marketing checkbox in `fields`. Consent is not a form field; it is a
//     record with its own wording and version (consent.ts), and folding it in
//     here would let a copy edit silently change what someone agreed to.

/** A route is what somebody wants, not which form they filled in. */
export type Route = 'application' | 'enquiry' | 'enterprise';

export type FieldKind = 'text' | 'email' | 'tel' | 'textarea' | 'choice' | 'number';

export interface Field {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  /** Maximum accepted length, enforced server-side. Characters, not bytes. */
  max: number;
  /** Rendered under the field. Never a placeholder — placeholders vanish on focus. */
  hint?: string;
  /** For kind: 'choice'. The stored value is the `value`, never the label. */
  options?: { value: string; label: string }[];
  /** Rows for a textarea. Affects nothing but the shape of the box. */
  rows?: number;
  /** HTML autocomplete token, so a browser can fill it. */
  autocomplete?: string;
}

export interface FormDefinition {
  route: Route;
  /** The heading above the form. */
  title: string;
  /** One sentence, above the fields. From the approved copy. */
  intro: string;
  /** The submit button. The brief: cohort = APPLY, never "Buy now". */
  action: string;
  fields: Field[];
  /**
   * Shown on success. Exact wording from the brief — these three sentences
   * were approved and the third one is load-bearing: "An application is not a
   * confirmed place." Do not reword without an approval round.
   */
  confirmation: string;
}

// ---------------------------------------------------------------------------
// Shared fields
// ---------------------------------------------------------------------------
// Name and email are required everywhere and personal addresses are accepted —
// the brief is explicit that a work address is not a condition of applying.

const name = (): Field => ({
  name: 'name',
  label: 'Your name',
  kind: 'text',
  required: true,
  max: 200,
  autocomplete: 'name',
});

const email = (): Field => ({
  name: 'email',
  label: 'Email',
  kind: 'email',
  required: true,
  max: 200,
  hint: 'A personal address is fine.',
  autocomplete: 'email',
});

const phone = (): Field => ({
  name: 'phone',
  label: 'Phone',
  kind: 'tel',
  required: false,
  max: 40,
  hint: 'Optional.',
  autocomplete: 'tel',
});

const organisation = (required: boolean): Field => ({
  name: 'organisation',
  label: 'Organisation',
  kind: 'text',
  required,
  max: 200,
  hint: required ? undefined : 'Optional.',
  autocomplete: 'organization',
});

const role = (required: boolean): Field => ({
  name: 'role',
  label: 'Your role',
  kind: 'text',
  required,
  max: 200,
  hint: required ? undefined : 'Optional.',
  autocomplete: 'organization-title',
});

/**
 * "How did you hear about us" — evidence, never an override.
 *
 * The operating guide is firm about this: a self-reported source sits BESIDE
 * the captured attribution and does not replace it. Someone can meet Sunil on
 * LinkedIn in March and type the URL directly in September; both facts are
 * true and neither is the other's correction.
 */
const discovery = (): Field => ({
  name: 'discovery',
  label: 'How did you come across the programme?',
  kind: 'text',
  required: false,
  max: 300,
  hint: 'Optional.',
});

// ---------------------------------------------------------------------------
// The three routes
// ---------------------------------------------------------------------------

export const FORMS: Record<Route, FormDefinition> = {
  /**
   * The open cohort application.
   *
   * The funding route is required because it changes who we talk to next, and
   * because the three answers are genuinely different journeys: self-funded is
   * one conversation, employer-funded needs the manager summary, and undecided
   * is the one most likely to go quiet without help. It is NOT a qualification
   * filter and must never be presented as one.
   */
  application: {
    route: 'application',
    title: 'Start with your experience and a question',
    intro:
      'Tell us about your system-design experience, your current responsibilities and what you want to develop. Let us know whether you are self-funded or exploring employer support.',
    action: 'Apply for the open cohort',
    fields: [
      name(),
      email(),
      role(true),
      {
        name: 'experience',
        label: 'Your system-design experience',
        kind: 'textarea',
        required: true,
        max: 4000,
        rows: 4,
        hint: 'Which systems have you worked with, and which decisions are you responsible for?',
      },
      {
        name: 'goal',
        label: 'What you want to develop',
        kind: 'textarea',
        required: true,
        max: 4000,
        rows: 4,
        hint: 'One question you would like to work on is enough. Please keep confidential company material out.',
      },
      {
        name: 'funding',
        label: 'Funding route',
        kind: 'choice',
        required: true,
        max: 20,
        options: [
          { value: 'self', label: 'Self-funded' },
          { value: 'employer', label: 'Employer support' },
          { value: 'undecided', label: 'Undecided' },
        ],
      },
      organisation(false),
      phone(),
      discovery(),
    ],
    confirmation:
      "Your application has been received. We'll review your experience and learning goal and contact you about the next step. An application is not a confirmed place.",
  },

  /**
   * A question about the cohort.
   *
   * Kept separate from the application on purpose. The brief: "no application
   * milestone inferred". Somebody asking whether the schedule works for them
   * has not applied, and counting them as an applicant overstates the pipeline
   * to the one person who most needs it to be accurate.
   */
  enquiry: {
    route: 'enquiry',
    title: 'Ask about the cohort',
    intro:
      'Ask anything about fit, the commitment, the schedule or employer funding. This is not an application.',
    action: 'Send your question',
    fields: [
      name(),
      email(),
      {
        name: 'question',
        label: 'Your question',
        kind: 'textarea',
        required: true,
        max: 4000,
        rows: 4,
        hint: 'Please avoid sending confidential company materials.',
      },
      role(false),
      organisation(false),
      phone(),
      discovery(),
    ],
    confirmation:
      "Your enquiry has been received. We'll contact you about your question.",
  },

  /**
   * A programme for a team.
   *
   * An organisation order is not eight or ten individual applications, and the
   * split starts here — this route creates an organisation opportunity, and
   * the person filling it in is frequently a sponsor who will never attend.
   * Group size is approximate and optional because a sponsor at the "should we
   * even do this" stage does not have a number yet, and demanding one loses
   * the conversation.
   */
  enterprise: {
    route: 'enterprise',
    title: 'Arrange learning for a team',
    intro:
      'Begin with your learning objective, participant experience and industry context. An enterprise programme is a separate purchase and scoping conversation.',
    action: 'Start the team conversation',
    fields: [
      name(),
      email(),
      organisation(true),
      role(true),
      {
        name: 'goal',
        label: 'What the team needs to learn',
        kind: 'textarea',
        required: true,
        max: 4000,
        rows: 4,
        hint: 'The engineering responsibility you want the group to take on, and where the participants are starting from.',
      },
      {
        name: 'group_size',
        label: 'Approximate group size',
        kind: 'number',
        required: false,
        max: 6,
        hint: 'Optional. Enterprise programmes normally bring 8–10 participants together.',
      },
      {
        name: 'industry',
        label: 'Industry',
        kind: 'text',
        required: false,
        max: 200,
        hint: 'Optional. Industry-specific examples are the default.',
      },
      phone(),
      discovery(),
    ],
    confirmation:
      "Your enquiry has been received. We'll contact you about your question.",
  },
};

export const ROUTES = Object.keys(FORMS) as Route[];

export const isRoute = (v: unknown): v is Route =>
  typeof v === 'string' && (ROUTES as string[]).includes(v);

/** Which fields does the console show as the free-text body of a submission? */
export const BODY_FIELDS = ['experience', 'goal', 'question'] as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
// Runs on the server, and the same rules run in the browser so a mistake is
// caught before a round trip. The server is the one that counts: a hand-rolled
// POST skips the browser entirely, which is the whole reason the limits live
// in a module rather than in an `maxlength` attribute.

/**
 * Deliberately permissive, and deliberately not a regex claiming to implement
 * RFC 5322. It rejects the things that are certainly not addresses — no @, no
 * dot in the domain, whitespace, a comma or semicolon suggesting somebody
 * pasted a list — and accepts everything else, because the only real test of
 * an address is whether mail to it arrives.
 *
 * Plus-tags are NOT stripped. `a+cohort@x.com` and `a@x.com` are two different
 * addresses and merging them is the brief's named failure.
 */
export const EMAIL_RE = /^[^\s@,;]+@[^\s@,;.]+\.[^\s@,;]{2,}$/;

export interface FieldError {
  field: string;
  /**
   * A category, not the rejected content. The analytics contract forbids
   * sending what somebody typed, so `form_error` carries this and the field
   * name and nothing else.
   */
  code: 'required' | 'too_long' | 'invalid_email' | 'not_an_option' | 'not_a_number';
  /** Shown beside the field. Says what is wrong and how to fix it. */
  message: string;
}

const messageFor = (field: Field, code: FieldError['code']): string => {
  switch (code) {
    case 'required':
      return `${field.label} is needed.`;
    case 'too_long':
      return `${field.label} is limited to ${field.max} characters.`;
    case 'invalid_email':
      return 'That does not look like an email address. Check for a missing @ or a typo in the domain.';
    case 'not_an_option':
      return `Choose one of the ${field.label.toLowerCase()} options.`;
    case 'not_a_number':
      return 'Enter a number, or leave it blank.';
  }
};

/**
 * Validates one submission against its route.
 *
 * Returns cleaned values alongside the errors: trimmed, with the browser's
 * stray whitespace and non-breaking spaces removed, and control characters
 * dropped. What comes out is what gets stored — there is no second cleaning
 * step later that could disagree with this one.
 */
export function validate(
  route: Route,
  input: Record<string, unknown>,
): { values: Record<string, string>; errors: FieldError[] } {
  const form = FORMS[route];
  const values: Record<string, string> = {};
  const errors: FieldError[] = [];

  for (const field of form.fields) {
    const raw = input[field.name];
    const value = typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '';
    const cleaned = tidy(value);

    if (!cleaned) {
      if (field.required) errors.push({ field: field.name, code: 'required', message: messageFor(field, 'required') });
      continue;
    }

    if (cleaned.length > field.max) {
      errors.push({ field: field.name, code: 'too_long', message: messageFor(field, 'too_long') });
      continue;
    }

    if (field.kind === 'email' && !EMAIL_RE.test(cleaned)) {
      errors.push({ field: field.name, code: 'invalid_email', message: messageFor(field, 'invalid_email') });
      continue;
    }

    if (field.kind === 'choice' && !field.options?.some((o) => o.value === cleaned)) {
      errors.push({ field: field.name, code: 'not_an_option', message: messageFor(field, 'not_an_option') });
      continue;
    }

    if (field.kind === 'number' && !/^\d{1,6}$/.test(cleaned)) {
      errors.push({ field: field.name, code: 'not_a_number', message: messageFor(field, 'not_a_number') });
      continue;
    }

    values[field.name] = cleaned;
  }

  return { values, errors };
}

/**
 * Collapse whitespace, drop control characters, trim.
 *
 * Newlines survive inside textareas — somebody writing four paragraphs about
 * their architecture should get four paragraphs back, and flattening them is
 * the kind of quiet damage nobody notices until Sunil reads it.
 */
export function tidy(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ --]/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * The matching key for a person: trimmed and case-normalised, nothing else.
 *
 * Two things this does NOT do, both named in the data dictionary as mistakes:
 * it does not strip plus-tags, and it does not touch the domain beyond casing.
 * `original_email` keeps whatever they actually typed, so a receipt goes to the
 * address they gave rather than one we tidied on their behalf.
 */
export const normaliseEmail = (value: string): string => value.trim().toLowerCase();
