// Importing an existing tracker — parse, validate, preview, then commit.
//
// ───────────────────────────────────────────────────────────────────────────
// THE ONE RULE THIS MODULE EXISTS FOR: A CONFLICTING ID IS REFUSED, NEVER APPLIED.
// ───────────────────────────────────────────────────────────────────────────
//
// The brief: "Preserve supplied person/organisation IDs in imports and keep an
// import batch log. Validate, preview match/conflict counts, then commit.
// Reject conflicting IDs rather than silently replacing them."
//
// Preserving a supplied id is the useful half — a client's existing tracker
// has ids in it, their reports join on them, and an import that mints new ones
// hands back a file that no longer reconciles with anything they have.
//
// Refusing a conflicting one is the half that matters. If a row carries
// person_id P with email b@x and P already exists in this database with email
// a@x, there is no safe reading of that row. Applying it overwrites a@x's
// identity with b@x's: one person's record silently acquires another person's
// address, and every consent, submission and conversation attached to P now
// belongs to the wrong human. There is no undo and — worse — nothing visible
// to undo, because the row still looks like a perfectly ordinary person.
//
// So: ANY conflict stops the WHOLE import. Not "skip the bad rows and carry
// on" — a partial import of a file somebody believed went in is the same
// wrongness with a delay on it. The operator gets a report naming the line
// numbers, fixes the file, and runs it again.
//
// ───────────────────────────────────────────────────────────────────────────
// AN IMPORT NEVER MANUFACTURES PERMISSION TO EMAIL SOMEBODY
// ───────────────────────────────────────────────────────────────────────────
//
// The data dictionary, on consent: "Preserve changes; import provenance
// instead of treating old relationships as opt-in."
//
// The failure it is guarding against is the ordinary one: a spreadsheet of
// four hundred contacts from a previous list, imported, and now four hundred
// people are on a nurture sequence none of them agreed to. "They were in our
// CRM" is not consent, and a contact arriving through this module is
// subscribed to NOTHING by default.
//
// A consent row is written only when the file carries all three of a state, a
// source and a wording version whose words we can produce — and it is stored
// with `source` naming the import batch, so the provenance travels with it. A
// row claiming `consent_state=granted` and nothing else grants nothing, is
// counted as ignored, and the preview says so in a sentence. Do not add a
// default source or a default wording version here to make that count go down.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT A MATCH IS ALLOWED TO CHANGE: BLANKS, AND ONLY BLANKS
// ───────────────────────────────────────────────────────────────────────────
//
// A matched row FILLS IN empty columns and never overwrites a value already
// there. A phone number in the file and none in the database is new
// information; a different phone number in each is a disagreement, and an
// import is the wrong place to settle it — it has no author, no date and no
// reason attached. Those are reported as "left as they are", by line and
// field, for somebody to look at on the lead itself.
//
// ───────────────────────────────────────────────────────────────────────────
// ERRORS NAME THE LINE AND THE FIELD. NEVER THE VALUE.
// ───────────────────────────────────────────────────────────────────────────
//
// Every message in this file is safe to put on a screen, in a log and in a
// support ticket. "Line 41: email is not an address" — never the address
// itself, never the name, never what somebody wrote. The same rule the
// analytics contract puts on `form_error`, for the same reason: error text
// travels further than the data it came from.

import { db } from './supabase';
import { can, type Capability } from '../pipeline/roles';
import type { Identity } from './staff';
import { sourceFailed, type Answer } from './pipeline-queries';
import { EMAIL_RE, normaliseEmail, tidy } from '../pipeline/forms';
import { consentVersion, type ConsentState } from '../pipeline/consent';
// From csv.ts, which owns the format, and NOT from export.ts — the defusal and
// its inverse have to read the same regex, and there is now one copy of it.
import { FORMULA_PREFIX } from './csv';

const ok = <T>(value: T): Answer<T> => ({ state: 'ok', value, at: new Date().toISOString() });
const unavailable = <T>(reason: string): Answer<T> => ({ state: 'unavailable', reason });
const denied = <T>(reason: string): Answer<T> => ({ state: 'denied', reason });

function gate<T>(who: Identity | undefined, capability: Capability): Answer<T> | null {
  if (!who) return denied('Not signed in.');
  if (!can(who.roles, capability)) {
    return denied('Importing contacts belongs to the Alchemy operator. Your roles do not include it.');
  }
  return null;
}

/**
 * Importing writes contacts, so it needs the capability that owns them.
 *
 * Note this is NOT `export.records`: Sunil can export and cannot import, which
 * is correct — the brief gives contacts and qualification to the operator, and
 * bulk-writing four hundred people is the largest version of that job.
 */
export const IMPORT_CAPABILITY: Capability = 'write.contact';

// ---------------------------------------------------------------------------
// The CSV parser
// ---------------------------------------------------------------------------

/**
 * RFC 4180, written out rather than pulled in.
 *
 * A regex split on commas corrupts exactly the rows this feature exists for —
 * the long free-text answers, which contain commas, quoted speech and
 * paragraph breaks. So this is a character-by-character state machine, and the
 * three things it has to get right are:
 *
 *   * A comma inside quotes is a character, not a separator.
 *   * A doubled quote inside quotes is one literal quote.
 *   * A newline inside quotes is part of the value, not the end of the row.
 *
 * It accepts CRLF, LF and a lone CR as row endings, because a file that has
 * been through Excel on Windows, a Mac and a Google Sheet may carry all three.
 * A BOM at the start is dropped. A trailing newline does not produce a phantom
 * empty row.
 */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        // "" inside a quoted field is one literal quote; a lone " ends it.
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }

    // A quote only OPENS a field at its start. Mid-field it is a literal, which
    // is what a hand-edited file usually means by it.
    if (c === '"' && field === '') {
      quoted = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      endField();
      i += 1;
      continue;
    }
    if (c === '\r') {
      endRow();
      i += text[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    if (c === '\n') {
      endRow();
      i += 1;
      continue;
    }

    field += c;
    i += 1;
  }

  // A file ending in a newline has already pushed its last row; anything left
  // in hand is a final row with no terminator.
  if (field !== '' || row.length) endRow();

  return rows;
}

/**
 * The exact inverse of `formulaSafe()` in export.ts.
 *
 * Our own export prefixes a cell beginning `=`, `+`, `-`, `@`, tab or CR with
 * an apostrophe so a spreadsheet cannot execute it. Re-importing that file
 * must give back the original string rather than one with an apostrophe glued
 * on, so the prefix comes off — but ONLY when what follows is one of those
 * trigger characters. `O'Brien` and `'quoted'` are untouched, because the
 * character after the apostrophe is a letter.
 *
 * This is also what a spreadsheet itself does: typing '=1+1 into Excel stores
 * the text =1+1, and the apostrophe is formatting rather than content.
 */
export const unprefixFormula = (value: string): string =>
  value.startsWith("'") && FORMULA_PREFIX.test(value.slice(1)) ? value.slice(1) : value;

// ---------------------------------------------------------------------------
// Column names
// ---------------------------------------------------------------------------

const normaliseHeader = (h: string): string =>
  h
    .replace(/^﻿/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

/**
 * Canonical column, then the spellings a real tracker export uses.
 *
 * Kept short and explicit rather than clever. An unrecognised header is NOT
 * silently ignored — it is reported in the preview, because a column called
 * `mobile` quietly dropped is a phone number the operator believes they
 * imported.
 */
const PERSON_COLUMNS: Record<string, string[]> = {
  person_id: ['person_id', 'personid', 'id'],
  name: ['name', 'full_name', 'contact_name'],
  email: ['email', 'normalised_email', 'email_address'],
  original_email: ['original_email'],
  phone: ['phone', 'mobile', 'telephone'],
  role: ['role', 'job_title', 'title'],
  organisation_id: ['organisation_id', 'organization_id', 'org_id'],
  organisation_name: ['organisation_name', 'organization_name', 'organisation', 'organization', 'company'],
  consent_state: ['consent_state'],
  consent_purpose: ['consent_purpose'],
  consent_source: ['consent_source'],
  consent_wording_version: ['consent_wording_version'],
  consent_wording: ['consent_wording'],
  consent_obtained_at: ['consent_obtained_at'],
};

const ORGANISATION_COLUMNS: Record<string, string[]> = {
  organisation_id: ['organisation_id', 'organization_id', 'org_id', 'id'],
  name: ['name', 'organisation_name', 'organization_name', 'company'],
  domain: ['domain', 'website'],
  industry: ['industry', 'sector'],
};

export type ImportKind = 'people' | 'organisations';

export const IMPORT_KINDS: readonly { id: ImportKind; label: string; required: string[]; optional: string[] }[] = [
  {
    id: 'people',
    label: 'People',
    required: ['name', 'email'],
    optional: [
      'person_id',
      'original_email',
      'phone',
      'role',
      'organisation_id',
      'consent_state',
      'consent_source',
      'consent_wording_version',
      'consent_obtained_at',
    ],
  },
  {
    id: 'organisations',
    label: 'Organisations',
    required: ['name'],
    optional: ['organisation_id', 'domain', 'industry'],
  },
];

export const isImportKind = (v: unknown): v is ImportKind => v === 'people' || v === 'organisations';

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

/**
 * One thing wrong with one line.
 *
 * `line` is the line number IN THE FILE, header included, so it matches what a
 * spreadsheet shows in its row gutter. `field` is a column name. There is
 * deliberately no `value`.
 */
export interface RowIssue {
  line: number;
  field: string;
  code: string;
  message: string;
}

export interface ImportReport {
  kind: ImportKind;
  /** Data rows read, not counting the header. */
  rows: number;
  /** Rows that would create a record. */
  create: number;
  /** Rows that already exist and agree. */
  match: number;
  /**
   * Conflicts. NON-EMPTY MEANS NOTHING IS APPLIED — not these rows, not the
   * others. See the head of this file.
   */
  conflicts: RowIssue[];
  /** Malformed rows. Also blocking: a file we cannot read fully is not half-imported. */
  errors: RowIssue[];
  /** Values present in the file that differ from a value already stored. Never applied. */
  differences: RowIssue[];
  /** Blank columns a matched row would fill in. */
  fills: number;
  /** Consent rows that would be written, with their provenance. */
  consentsGranted: number;
  /** Rows claiming a permission the file cannot evidence. Nobody is subscribed by these. */
  consentsIgnored: RowIssue[];
  /** Headers in the file this import does not use. */
  unusedColumns: string[];
  /** Organisation names given without an id, which are NOT auto-linked or auto-merged. */
  unlinkedOrganisations: number;
  /** Set on a commit. Null on a preview, which changes nothing. */
  batchId: string | null;
  /** Set on a commit: what actually landed. */
  applied?: { created: number; updated: number; consents: number };
}

/** The most rows one import may carry. Beyond this, split the file. */
export const MAX_IMPORT_ROWS = 2000;

// ---------------------------------------------------------------------------
// Parsing a file into typed rows
// ---------------------------------------------------------------------------

interface ParsedRow {
  line: number;
  values: Record<string, string>;
}

interface ParsedFile {
  rows: ParsedRow[];
  unusedColumns: string[];
  /**
   * Structural problems with individual LINES, found while reading rather than
   * while validating. Pushed onto `report.errors` by the caller, so they block
   * exactly as a bad email does.
   */
  issues: RowIssue[];
  /** A structural problem with the file itself, not with one row. */
  fatal?: string;
}

function readFile(csv: string, kind: ImportKind): ParsedFile {
  const issues: RowIssue[] = [];
  const table = parseCsv(csv);
  if (!table.length) return { rows: [], unusedColumns: [], issues, fatal: 'That file has no rows in it.' };

  const schema = kind === 'people' ? PERSON_COLUMNS : ORGANISATION_COLUMNS;
  const header = table[0].map(normaliseHeader);

  // header index -> canonical column name
  const mapped = new Map<number, string>();
  const unused: string[] = [];

  header.forEach((h, index) => {
    const canonical = Object.entries(schema).find(([, aliases]) => aliases.includes(h))?.[0];
    if (canonical && ![...mapped.values()].includes(canonical)) mapped.set(index, canonical);
    // Bounded: this string is rendered on the console and written into the
    // permanent audit_log entry for the batch, and it is raw text out of a
    // file somebody uploaded. A header cell has no business being longer
    // than a column name.
    else if (h) unused.push(table[0][index].trim().slice(0, 80));
  });

  const required = IMPORT_KINDS.find((k) => k.id === kind)!.required;
  const missing = required.filter((r) => ![...mapped.values()].includes(r));
  if (missing.length) {
    return {
      rows: [],
      unusedColumns: unused,
      issues,
      fatal: `That file has no ${missing.join(' and no ')} column. Required: ${required.join(', ')}.`,
    };
  }

  const rows: ParsedRow[] = [];
  for (let r = 1; r < table.length; r += 1) {
    const raw = table[r];
    // A wholly empty line is a trailing blank, not a row somebody meant.
    if (raw.every((c) => c.trim() === '')) continue;

    // ── A ROW WITH MORE CELLS THAN THE HEADER IS A MISALIGNED ROW ────────
    //
    // The extra cells used to be dropped without a word, because only header
    // indices are read. But a row that is one cell too long is almost always a
    // row where an unquoted comma inside a free-text field has SHIFTED
    // everything to its right by one column — so `phone` now holds the address
    // and `role` holds the phone number. Nothing downstream catches that:
    // `name` and `email` are validated, and the columns after them are not.
    //
    // Which is this module's own nightmare in a quieter form — a record
    // quietly acquiring somebody else's details — so it is refused, by line,
    // with counts rather than contents. A trailing comma produces one EMPTY
    // extra cell and is not a misalignment, so only non-empty extras count.
    const extras = raw.slice(header.length).filter((c) => c.trim() !== '');
    if (extras.length) {
      issues.push({
        line: r + 1,
        field: 'row',
        code: 'too_many_columns',
        message: `Line ${r + 1}: ${raw.length} values for ${header.length} columns. Something to the left is probably an unquoted comma, which shifts every column after it.`,
      });
    }

    const values: Record<string, string> = {};
    mapped.forEach((canonical, index) => {
      values[canonical] = unprefixFormula(raw[index] ?? '').trim();
    });
    rows.push({ line: r + 1, values });
  }

  return { rows, unusedColumns: unused, issues };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LIMITS: Record<string, number> = {
  name: 200,
  phone: 40,
  role: 200,
  organisation_name: 200,
  domain: 200,
  industry: 200,
  consent_source: 200,
  consent_wording_version: 80,
  consent_wording: 2000,
};

/** A blank-or-value column, tidied the same way the public forms tidy theirs. */
const field = (row: ParsedRow, name: string): string => tidy(row.values[name] ?? '');

function validateCommon(row: ParsedRow, errors: RowIssue[]): void {
  for (const [name, max] of Object.entries(LIMITS)) {
    if (field(row, name).length > max) {
      errors.push({
        line: row.line,
        field: name,
        code: 'too_long',
        message: `Line ${row.line}: ${name} is longer than ${max} characters.`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

interface StoredPerson {
  person_id: string;
  name: string | null;
  normalised_email: string;
  original_email: string | null;
  phone: string | null;
  role: string | null;
  organisation_id: string | null;
}

interface PersonPlan {
  line: number;
  personId: string | null;
  name: string;
  email: string;
  originalEmail: string;
  phone: string;
  role: string;
  organisationId: string | null;
  existing: StoredPerson | null;
  consent: {
    purpose: string;
    state: ConsentState;
    wording: string;
    wordingVersion: string;
    source: string;
    obtainedAt: string;
  } | null;
}

/** Chunked `in` lookups — PostgREST puts the whole list in the URL. */
async function lookup<T>(
  client: NonNullable<ReturnType<typeof db>>,
  table: string,
  select: string,
  column: string,
  values: string[],
): Promise<T[] | { error: string }> {
  const out: T[] = [];
  for (let i = 0; i < values.length; i += 200) {
    const slice = values.slice(i, i + 200);
    if (!slice.length) continue;
    const { data, error } = await client.from(table).select(select).in(column, slice);
    // Never the raw message: PostgREST carries its filter values in the URL, and
    // this filter is a list of the addresses out of somebody's file.
    if (error) return { error: sourceFailed(`${table} table`, error) };
    out.push(...((data ?? []) as T[]));
  }
  return out;
}

async function planPeople(
  client: NonNullable<ReturnType<typeof db>>,
  parsed: ParsedFile,
  report: ImportReport,
): Promise<PersonPlan[] | { error: string }> {
  const plans: PersonPlan[] = [];

  const seenIds = new Map<string, number>();
  const seenEmails = new Map<string, number>();

  for (const row of parsed.rows) {
    validateCommon(row, report.errors);

    const name = field(row, 'name');
    const rawEmail = field(row, 'email');
    const email = normaliseEmail(rawEmail);
    const personId = field(row, 'person_id') || null;

    if (!name) {
      report.errors.push({ line: row.line, field: 'name', code: 'required', message: `Line ${row.line}: name is empty.` });
    }
    if (!rawEmail) {
      report.errors.push({ line: row.line, field: 'email', code: 'required', message: `Line ${row.line}: email is empty.` });
    } else if (!EMAIL_RE.test(email)) {
      report.errors.push({
        line: row.line,
        field: 'email',
        code: 'invalid_email',
        message: `Line ${row.line}: email is not an address.`,
      });
    }
    if (personId && !UUID_RE.test(personId)) {
      report.errors.push({
        line: row.line,
        field: 'person_id',
        code: 'not_an_id',
        message: `Line ${row.line}: person_id is not an id this database can hold.`,
      });
    }

    const organisationId = field(row, 'organisation_id') || null;
    if (organisationId && !UUID_RE.test(organisationId)) {
      report.errors.push({
        line: row.line,
        field: 'organisation_id',
        code: 'not_an_id',
        message: `Line ${row.line}: organisation_id is not an id this database can hold.`,
      });
    }
    if (!organisationId && field(row, 'organisation_name')) report.unlinkedOrganisations += 1;

    // A file that disagrees with itself is refused before it reaches the
    // database: two rows for one id, or one address twice, cannot both be
    // applied and choosing between them is guessing.
    if (personId) {
      const first = seenIds.get(personId.toLowerCase());
      if (first) {
        report.conflicts.push({
          line: row.line,
          field: 'person_id',
          code: 'duplicate_in_file',
          message: `Line ${row.line}: this person_id is also on line ${first}.`,
        });
      } else seenIds.set(personId.toLowerCase(), row.line);
    }
    if (email) {
      const first = seenEmails.get(email);
      if (first) {
        report.conflicts.push({
          line: row.line,
          field: 'email',
          code: 'duplicate_in_file',
          message: `Line ${row.line}: this address is also on line ${first}.`,
        });
      } else seenEmails.set(email, row.line);
    }

    plans.push({
      line: row.line,
      personId,
      name,
      email,
      // Whatever they typed is kept, exactly as people.original_email is set by
      // the public form. Only the normalised copy is the matching key.
      originalEmail: rawEmail || email,
      phone: field(row, 'phone'),
      role: field(row, 'role'),
      organisationId,
      existing: null,
      consent: null,
    });

    readConsent(row, plans[plans.length - 1], report);
  }

  if (report.errors.length) return plans;

  const SELECT = 'person_id, name, normalised_email, original_email, phone, role, organisation_id';

  const byId = new Map<string, StoredPerson>();
  const ids = plans.map((p) => p.personId).filter((v): v is string => Boolean(v));
  if (ids.length) {
    const found = await lookup<StoredPerson>(client, 'people', SELECT, 'person_id', ids);
    if ('error' in found) return found;
    found.forEach((p) => byId.set(p.person_id.toLowerCase(), p));
  }

  const byEmail = new Map<string, StoredPerson>();
  const emails = plans.map((p) => p.email).filter(Boolean);
  if (emails.length) {
    const found = await lookup<StoredPerson>(client, 'people', SELECT, 'normalised_email', emails);
    if ('error' in found) return found;
    found.forEach((p) => byEmail.set(p.normalised_email, p));
  }

  // Organisation links are checked rather than trusted. A link to an id that
  // is not there would be stored as null by the database, which is a
  // relationship silently dropped.
  const orgIds = plans.map((p) => p.organisationId).filter((v): v is string => Boolean(v));
  const knownOrgs = new Set<string>();
  if (orgIds.length) {
    const found = await lookup<{ organisation_id: string }>(
      client,
      'organisations',
      'organisation_id',
      'organisation_id',
      orgIds,
    );
    if ('error' in found) return found;
    found.forEach((o) => knownOrgs.add(o.organisation_id.toLowerCase()));
  }

  for (const plan of plans) {
    const onId = plan.personId ? (byId.get(plan.personId.toLowerCase()) ?? null) : null;
    const onEmail = plan.email ? (byEmail.get(plan.email) ?? null) : null;

    // ── THE CONFLICT THIS MODULE IS FOR ──────────────────────────────────
    // A supplied id that exists against a different address. Applying it
    // would move one person's identity onto another person's record.
    if (onId && onId.normalised_email !== plan.email) {
      report.conflicts.push({
        line: plan.line,
        field: 'person_id',
        code: 'id_holds_another_address',
        message: `Line ${plan.line}: that person_id already exists here against a different email address. Nothing has been changed.`,
      });
      continue;
    }
    // The same collision from the other side: the address is already somebody
    // else's id, and the file wants to file it under a new one.
    if (onEmail && plan.personId && onEmail.person_id.toLowerCase() !== plan.personId.toLowerCase()) {
      report.conflicts.push({
        line: plan.line,
        field: 'email',
        code: 'address_held_by_another_id',
        message: `Line ${plan.line}: that email address is already held under a different person_id here. Nothing has been changed.`,
      });
      continue;
    }
    if (plan.organisationId && !knownOrgs.has(plan.organisationId.toLowerCase())) {
      report.conflicts.push({
        line: plan.line,
        field: 'organisation_id',
        code: 'unknown_organisation',
        message: `Line ${plan.line}: that organisation_id is not in this database. Import the organisations first.`,
      });
      continue;
    }

    plan.existing = onId ?? onEmail;

    if (plan.existing) {
      report.match += 1;
      // Blanks are filled; anything already there is left alone and reported.
      const compare: [keyof StoredPerson, string][] = [
        ['name', plan.name],
        ['phone', plan.phone],
        ['role', plan.role],
        ['organisation_id', plan.organisationId ?? ''],
      ];
      for (const [column, incoming] of compare) {
        if (!incoming) continue;
        const stored = (plan.existing[column] ?? '') as string;
        if (!stored) report.fills += 1;
        else if (stored.trim().toLowerCase() !== incoming.trim().toLowerCase()) {
          report.differences.push({
            line: plan.line,
            field: String(column),
            code: 'differs',
            message: `Line ${plan.line}: ${String(column)} differs from what is stored. The stored value is kept.`,
          });
        }
      }
    } else {
      report.create += 1;
    }
  }

  return plans;
}

/**
 * Read a consent claim off a row — and refuse to infer one.
 *
 * All three of state, source and a wording we can produce are required. A row
 * with `consent_state=granted` and nothing else is counted as ignored and
 * subscribes nobody, which is the whole point: see the head of this file.
 */
function readConsent(row: ParsedRow, plan: PersonPlan, report: ImportReport): void {
  const state = field(row, 'consent_state').toLowerCase();
  if (!state) return;

  const say = (code: string, message: string) =>
    report.consentsIgnored.push({ line: row.line, field: 'consent_state', code, message });

  if (state !== 'granted' && state !== 'withdrawn') {
    say('not_a_state', `Line ${row.line}: consent_state is neither granted nor withdrawn. No permission recorded.`);
    return;
  }

  const source = field(row, 'consent_source');
  if (!source) {
    say(
      'no_provenance',
      `Line ${row.line}: consent_source is empty, so there is no evidence of where this permission came from. No permission recorded.`,
    );
    return;
  }

  const version = field(row, 'consent_wording_version');
  if (!version) {
    say(
      'no_wording_version',
      `Line ${row.line}: consent_wording_version is empty, so the record could not say what the person saw. No permission recorded.`,
    );
    return;
  }

  // The words themselves: from the file, or from our own history if the
  // version is one of ours. Never invented — a consent row whose wording we
  // made up claims somebody read a sentence that did not exist.
  const wording = field(row, 'consent_wording') || consentVersion(version)?.wording || '';
  if (!wording) {
    say(
      'unknown_wording',
      `Line ${row.line}: that consent_wording_version is not one of ours and the file gives no wording, so there is nothing to record. No permission recorded.`,
    );
    return;
  }

  const when = field(row, 'consent_obtained_at');
  const parsed = when ? Date.parse(when) : NaN;
  if (when && !Number.isFinite(parsed)) {
    say('not_a_date', `Line ${row.line}: consent_obtained_at is not a date. No permission recorded.`);
    return;
  }

  plan.consent = {
    purpose: field(row, 'consent_purpose').toLowerCase() || 'marketing',
    state: state as ConsentState,
    wording,
    wordingVersion: version,
    source,
    // No date in the file means the date it was imported, and the source says
    // it was an import — rather than a made-up historical timestamp that would
    // read as evidence of a moment nobody can point to.
    obtainedAt: Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString(),
  };
  report.consentsGranted += 1;
}

// ---------------------------------------------------------------------------
// Organisations
// ---------------------------------------------------------------------------

interface StoredOrg {
  organisation_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
}

interface OrgPlan {
  line: number;
  organisationId: string | null;
  name: string;
  domain: string;
  industry: string;
  existing: StoredOrg | null;
  /** Same name, no id — a review candidate, never an automatic merge. */
  reviewReason: string | null;
}

async function planOrganisations(
  client: NonNullable<ReturnType<typeof db>>,
  parsed: ParsedFile,
  report: ImportReport,
): Promise<OrgPlan[] | { error: string }> {
  const plans: OrgPlan[] = [];
  const seenIds = new Map<string, number>();

  for (const row of parsed.rows) {
    validateCommon(row, report.errors);

    const name = field(row, 'name');
    const organisationId = field(row, 'organisation_id') || null;

    if (!name) {
      report.errors.push({ line: row.line, field: 'name', code: 'required', message: `Line ${row.line}: name is empty.` });
    }
    if (organisationId && !UUID_RE.test(organisationId)) {
      report.errors.push({
        line: row.line,
        field: 'organisation_id',
        code: 'not_an_id',
        message: `Line ${row.line}: organisation_id is not an id this database can hold.`,
      });
    }
    if (organisationId) {
      const first = seenIds.get(organisationId.toLowerCase());
      if (first) {
        report.conflicts.push({
          line: row.line,
          field: 'organisation_id',
          code: 'duplicate_in_file',
          message: `Line ${row.line}: this organisation_id is also on line ${first}.`,
        });
      } else seenIds.set(organisationId.toLowerCase(), row.line);
    }

    plans.push({
      line: row.line,
      organisationId,
      name,
      domain: field(row, 'domain'),
      industry: field(row, 'industry'),
      existing: null,
      reviewReason: null,
    });
  }

  if (report.errors.length) return plans;

  const ids = plans.map((p) => p.organisationId).filter((v): v is string => Boolean(v));
  const byId = new Map<string, StoredOrg>();
  if (ids.length) {
    const found = await lookup<StoredOrg>(
      client,
      'organisations',
      'organisation_id, name, domain, industry',
      'organisation_id',
      ids,
    );
    if ('error' in found) return found;
    found.forEach((o) => byId.set(o.organisation_id.toLowerCase(), o));
  }

  // Every existing name, so a same-named row can be FLAGGED rather than merged.
  const existingNames = new Set<string>();
  {
    const { data, error } = await client.from('organisations').select('name').limit(5000);
    if (error) return { error: sourceFailed('organisations table', error) };
    (data ?? []).forEach((o: { name: string }) => existingNames.add(o.name.trim().toLowerCase()));
  }

  for (const plan of plans) {
    const onId = plan.organisationId ? (byId.get(plan.organisationId.toLowerCase()) ?? null) : null;

    // An id that exists under a different name. A rename is a legitimate thing
    // to want and this is the wrong instrument for it: an import has no author
    // and no reason attached, and applying it would rewrite the name every
    // report and every note refers to.
    if (onId && onId.name.trim().toLowerCase() !== plan.name.trim().toLowerCase()) {
      report.conflicts.push({
        line: plan.line,
        field: 'organisation_id',
        code: 'id_holds_another_name',
        message: `Line ${plan.line}: that organisation_id already exists here under a different name. Rename it on the record, not in an import.`,
      });
      continue;
    }

    plan.existing = onId;

    if (onId) {
      report.match += 1;
      if (plan.domain && !onId.domain) report.fills += 1;
      else if (plan.domain && onId.domain && plan.domain.toLowerCase() !== onId.domain.toLowerCase()) {
        report.differences.push({
          line: plan.line,
          field: 'domain',
          code: 'differs',
          message: `Line ${plan.line}: domain differs from what is stored. The stored value is kept.`,
        });
      }
      if (plan.industry && !onId.industry) report.fills += 1;
    } else {
      report.create += 1;
      // "Name-only matches are review candidates, not automatic merges." So a
      // second Acme becomes a second row, flagged, and a human decides.
      if (existingNames.has(plan.name.trim().toLowerCase())) {
        plan.reviewReason = 'An organisation with this name already existed when this row was imported.';
      }
    }
  }

  return plans;
}

// ---------------------------------------------------------------------------
// Preview and commit
// ---------------------------------------------------------------------------

const emptyReport = (kind: ImportKind): ImportReport => ({
  kind,
  rows: 0,
  create: 0,
  match: 0,
  conflicts: [],
  errors: [],
  differences: [],
  fills: 0,
  consentsGranted: 0,
  consentsIgnored: [],
  unusedColumns: [],
  unlinkedOrganisations: 0,
  batchId: null,
});

export const blocked = (report: ImportReport): boolean =>
  report.conflicts.length > 0 || report.errors.length > 0;

/**
 * Look at a file and say what it would do. CHANGES NOTHING.
 *
 * The brief asks for two phases and this is the first. It is not a formality:
 * the counts it returns are the only thing standing between an operator and a
 * bulk write they cannot inspect afterwards, and the conflict list is the
 * report the rejection is supposed to come with.
 */
export async function previewImport(
  who: Identity | undefined,
  kind: ImportKind,
  csv: string,
): Promise<Answer<ImportReport>> {
  const stop = gate<ImportReport>(who, IMPORT_CAPABILITY);
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const report = emptyReport(kind);
  const parsed = readFile(csv, kind);
  report.unusedColumns = parsed.unusedColumns;

  if (parsed.fatal) return unavailable(parsed.fatal);
  report.rows = parsed.rows.length;
  // Line-level structural problems block exactly as a bad email does — a file
  // we cannot read fully is not a file to half-import.
  report.errors.push(...parsed.issues);

  if (!parsed.rows.length) return ok(report);
  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    return unavailable(
      `That file has ${parsed.rows.length} rows and the limit is ${MAX_IMPORT_ROWS}. Split it — a bulk write nobody can read through is not one somebody approved.`,
    );
  }

  try {
    const planned =
      kind === 'people'
        ? await planPeople(client, parsed, report)
        : await planOrganisations(client, parsed, report);

    // An unreachable table is NOT "0 conflicts". Saying so would put the word
    // "safe" on a file nobody checked.
    if ('error' in planned) return unavailable(planned.error);

    return ok(report);
  } catch (err) {
    console.error('import preview failed:', err instanceof Error ? err.name : 'unknown');
    return unavailable('The check did not complete, so nothing about this file has been confirmed.');
  }
}

/**
 * Apply it, and write the batch log.
 *
 * The whole file is re-read and re-checked here. The preview's result is NOT
 * carried forward: it arrived from a browser, the database may have moved
 * underneath it, and a commit that trusts a client-supplied verdict is a
 * conflict check that can be skipped by editing a fetch call.
 *
 * ON ATOMICITY, HONESTLY: PostgREST has no multi-statement transaction, so the
 * creates go in as ONE insert (which is atomic) and the blank-filling updates
 * go one at a time (which is not). If the connection dies halfway, some blanks
 * are filled and some are not — no identity has changed, no consent has been
 * invented, and the batch log says what landed. `applied` is the count that
 * actually succeeded, never the count that was planned.
 */
export async function commitImport(
  who: Identity | undefined,
  kind: ImportKind,
  csv: string,
  actor: string,
): Promise<Answer<ImportReport>> {
  const stop = gate<ImportReport>(who, IMPORT_CAPABILITY);
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const report = emptyReport(kind);
  const parsed = readFile(csv, kind);
  report.unusedColumns = parsed.unusedColumns;

  if (parsed.fatal) return unavailable(parsed.fatal);
  report.rows = parsed.rows.length;
  // Line-level structural problems block exactly as a bad email does — a file
  // we cannot read fully is not a file to half-import.
  report.errors.push(...parsed.issues);

  if (!parsed.rows.length) return unavailable('That file has no rows to import.');
  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    return unavailable(`That file has ${parsed.rows.length} rows and the limit is ${MAX_IMPORT_ROWS}.`);
  }

  const batchId = crypto.randomUUID();
  const at = new Date().toISOString();

  try {
    const planned =
      kind === 'people'
        ? await planPeople(client, parsed, report)
        : await planOrganisations(client, parsed, report);
    if ('error' in planned) return unavailable(planned.error);

    // The refusal. Every row stops, not just the bad ones.
    if (blocked(report)) return ok(report);

    let created = 0;
    let updated = 0;
    let consents = 0;

    if (kind === 'people') {
      const plans = planned as PersonPlan[];

      const fresh = plans.filter((p) => !p.existing);
      if (fresh.length) {
        const { data, error } = await client
          .from('people')
          .insert(
            fresh.map((p) => ({
              // THE SUPPLIED ID IS KEPT. This is the brief's "preserve supplied
              // person/organisation IDs" — omitting it lets the default mint a
              // new one and the client's reports stop joining.
              ...(p.personId ? { person_id: p.personId } : {}),
              name: p.name,
              normalised_email: p.email,
              original_email: p.originalEmail,
              phone: p.phone || null,
              role: p.role || null,
              organisation_id: p.organisationId,
            })),
          )
          .select('person_id, normalised_email');
        // A failing INSERT quotes the offending literal — "invalid input syntax
        // for type uuid: …" IS the cell. The report's own rule applies here.
        if (error) return unavailable(sourceFailed('people table', error));
        created = data?.length ?? 0;
        // Resolve the ids the database chose for rows that supplied none, so a
        // consent row on the same line attaches to the right person.
        const minted = new Map((data ?? []).map((r: { person_id: string; normalised_email: string }) => [r.normalised_email, r.person_id]));
        fresh.forEach((p) => {
          if (!p.personId) p.personId = minted.get(p.email) ?? null;
        });
      }

      for (const plan of plans) {
        if (!plan.existing) continue;
        const patch: Record<string, unknown> = {};
        if (plan.name && !plan.existing.name) patch.name = plan.name;
        if (plan.phone && !plan.existing.phone) patch.phone = plan.phone;
        if (plan.role && !plan.existing.role) patch.role = plan.role;
        if (plan.organisationId && !plan.existing.organisation_id) patch.organisation_id = plan.organisationId;
        if (!Object.keys(patch).length) continue;

        const { error } = await client.from('people').update(patch).eq('person_id', plan.existing.person_id);
        if (!error) updated += 1;
        plan.personId = plan.existing.person_id;
      }

      const consentRows = plans
        .filter((p) => p.consent && p.personId)
        .map((p) => ({
          person_id: p.personId!,
          purpose: p.consent!.purpose,
          state: p.consent!.state,
          wording: p.consent!.wording,
          wording_version: p.consent!.wordingVersion,
          obtained_at: p.consent!.obtainedAt,
          // The provenance the data dictionary asks for, in the row itself:
          // which batch, and what the file said it came from.
          source: `import:${batchId}:${p.consent!.source}`.slice(0, 400),
          ...(p.consent!.state === 'withdrawn' ? { withdrawn_at: p.consent!.obtainedAt } : {}),
        }));

      if (consentRows.length) {
        const { data, error } = await client.from('consents').insert(consentRows).select('consent_id');
        // A failed consent insert does NOT fail the people that already landed
        // — but it must not be reported as a permission either. The count is
        // what went in.
        if (!error) consents = data?.length ?? 0;
        else console.error('import consent write failed:', (error as { code?: string }).code ?? 'unknown');
      }
    } else {
      const plans = planned as OrgPlan[];

      const fresh = plans.filter((p) => !p.existing);
      if (fresh.length) {
        const { data, error } = await client
          .from('organisations')
          .insert(
            fresh.map((p) => ({
              ...(p.organisationId ? { organisation_id: p.organisationId } : {}),
              name: p.name,
              domain: p.domain || null,
              industry: p.industry || null,
              needs_review: Boolean(p.reviewReason),
              review_reason: p.reviewReason,
            })),
          )
          .select('organisation_id');
        if (error) return unavailable(sourceFailed('organisations table', error));
        created = data?.length ?? 0;
      }

      for (const plan of plans) {
        if (!plan.existing) continue;
        const patch: Record<string, unknown> = {};
        if (plan.domain && !plan.existing.domain) patch.domain = plan.domain;
        if (plan.industry && !plan.existing.industry) patch.industry = plan.industry;
        if (!Object.keys(patch).length) continue;

        const { error } = await client
          .from('organisations')
          .update(patch)
          .eq('organisation_id', plan.existing.organisation_id);
        if (!error) updated += 1;
      }
    }

    report.batchId = batchId;
    report.applied = { created, updated, consents };

    await writeBatchLog(client, {
      batchId,
      at,
      actor,
      kind,
      report,
    });

    return ok(report);
  } catch (err) {
    console.error('import commit failed:', err instanceof Error ? err.name : 'unknown');
    return unavailable('That did not complete. Check the records before running it again.');
  }
}

/**
 * The import batch log.
 *
 * The brief asks for one, and the reason is the question somebody asks four
 * months later: "where did this row come from?". It lives in `audit_log`,
 * which already exists, is restricted, survives an erasure and — importantly —
 * holds NOTHING PERSONAL. So this writes counts, a batch id and an actor, and
 * not one name, address or cell value.
 *
 * Best-effort, deliberately: the records are already written, and losing the
 * log entry is a smaller harm than throwing after a successful import and
 * letting somebody run it twice.
 */
async function writeBatchLog(
  client: NonNullable<ReturnType<typeof db>>,
  entry: { batchId: string; at: string; actor: string; kind: ImportKind; report: ImportReport },
): Promise<void> {
  const { batchId, at, actor, kind, report } = entry;
  try {
    await client.from('audit_log').insert({
      record_type: 'import_batch',
      record_id: batchId,
      actor,
      previous_value: null,
      new_value: {
        kind,
        rows: report.rows,
        planned: { create: report.create, match: report.match, fills: report.fills },
        applied: report.applied,
        consents_ignored: report.consentsIgnored.length,
        differences_left_alone: report.differences.length,
        unused_columns: report.unusedColumns,
      },
      occurred_at: at,
      reason: `Import of ${kind}: ${report.applied?.created ?? 0} created, ${report.applied?.updated ?? 0} updated, ${report.applied?.consents ?? 0} consent records.`,
    });
  } catch (err) {
    console.error('import batch log failed:', err instanceof Error ? err.name : 'unknown');
  }
}

/** The last few batches, for the screen. Counts only — there is nothing personal in them. */
export interface BatchRow {
  batchId: string | null;
  actor: string;
  at: string;
  reason: string | null;
  detail: Record<string, unknown> | null;
}

export async function recentBatches(
  who: Identity | undefined,
  limit = 10,
): Promise<Answer<BatchRow[]>> {
  const stop = gate<BatchRow[]>(who, IMPORT_CAPABILITY);
  if (stop) return stop;

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  try {
    const { data, error } = await client
      .from('audit_log')
      .select('record_id, actor, occurred_at, reason, new_value')
      .eq('record_type', 'import_batch')
      .order('occurred_at', { ascending: false })
      .limit(limit);
    if (error) return unavailable(sourceFailed('import log', error));

    return ok(
      (data ?? []).map((r: Record<string, unknown>) => ({
        batchId: (r.record_id as string) ?? null,
        actor: (r.actor as string) ?? 'unknown',
        at: r.occurred_at as string,
        reason: (r.reason as string) ?? null,
        detail: (r.new_value as Record<string, unknown>) ?? null,
      })),
    );
  } catch (err) {
    console.error('import batch read failed:', err instanceof Error ? err.name : 'unknown');
    return unavailable('The import log did not answer.');
  }
}
