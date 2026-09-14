// Scoped CSV export — which record sets may leave, and to whom.
//
// ───────────────────────────────────────────────────────────────────────────
// THE ESCAPING LIVES IN csv.ts. THIS FILE ONLY USES IT.
// ───────────────────────────────────────────────────────────────────────────
//
// `FORMULA_PREFIX`, `formulaSafe`, `csvCell` and `csvDocument` moved to
// [lib/admin/csv.ts] and are re-exported below so existing importers keep
// working. Read that file's header for the attack they defend against — a
// stranger's form answer beginning `=HYPERLINK(…)` becoming a live link built
// out of the names and addresses beside it when an operator opens the export.
//
// They had to move for two reasons, and the second forced it: the format has no
// business importing a database client, and `scripts/acceptance.ts` (case E13)
// cannot import a module that does, so the escaping it tested was a copy rather
// than the rule. DO NOT MOVE THEM BACK, and do not add an import to csv.ts.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT "SCOPED" MEANS HERE, AND IT MEANS THREE THINGS
// ───────────────────────────────────────────────────────────────────────────
//
//   1. SCOPED BY PERMISSION. `export.records` is held by the operator and by
//      Sunil, and NOT by finance, programme or the maintainer. Scopes carrying
//      contact details also require `read.people`, which the maintainer role
//      deliberately does not hold. Checked here AND in the endpoint, because
//      the brief says it twice: "Authorisation is enforced server-side on
//      reads, exports and writes", and an export is the single easiest way to
//      carry every other protection in the console out of the building.
//
//   2. SCOPED BY RECORD SET. Six scopes, each one table's worth of the tracker,
//      never one flattened everything-file. Plus a date window and a route
//      filter, so a client report is the rows that report is about.
//
//   3. SCOPED BY SIZE, and it REFUSES rather than truncating. A 10,000-row cap
//      that silently cut the tail off would hand somebody a file that looks
//      complete and is not — the same class of lie as unknown-rendered-as-zero.
//      Over the cap you get an explanation and a suggestion to narrow the
//      window, never a short file.
//
// COLUMN NAMES ARE THE DATA DICTIONARY'S, verbatim, "so client reporting
// remains compatible". The one place they are not is the submission answers:
// those columns carry the QUESTION LABEL the applicant actually saw, read out
// of forms.ts, because `goal` means nothing to somebody reading the sheet and
// "What you want to develop" does. When two routes give one field name two
// different labels, the column falls back to the field name rather than
// picking one form's wording and quietly applying it to the other's answers.
//
// NOTHING HERE STATES AN OFFER FACT. Prices, dates and seat counts are
// facts.ts's; an export is a record of what people sent us.

import { db } from './supabase';
import { can, type Capability } from '../pipeline/roles';
import type { Identity } from './staff';
import { sourceFailed, type Answer } from './pipeline-queries';
import { FORMS, ROUTES, type Route } from '../pipeline/forms';
import { csvDocument, type CsvColumn } from './csv';

// Re-exported, not redefined. One owner, and callers that already import them
// from here keep working.
export { FORMULA_PREFIX, formulaSafe, csvCell, csvDocument } from './csv';

const ok = <T>(value: T): Answer<T> => ({ state: 'ok', value, at: new Date().toISOString() });
const unavailable = <T>(reason: string): Answer<T> => ({ state: 'unavailable', reason });
const denied = <T>(reason: string): Answer<T> => ({ state: 'denied', reason });

/** The same gate as pipeline-queries', which is not exported from there. */
function gate<T>(who: Identity | undefined, capability: Capability): Answer<T> | null {
  if (!who) return denied('Not signed in.');
  if (!can(who.roles, capability)) return denied('Your roles do not include exporting records.');
  return null;
}

// ---------------------------------------------------------------------------
// The scopes
// ---------------------------------------------------------------------------

/**
 * A column: a key into the row object, and the header printed for it — the
 * data dictionary's name, or the question label the applicant actually saw.
 *
 * The same shape as csv.ts's `CsvColumn`, aliased rather than redeclared.
 */
export type Column = CsvColumn;

export type ScopeId =
  | 'people'
  | 'organisations'
  | 'submissions'
  | 'opportunities'
  | 'attributions'
  | 'consents';

export interface ScopeDefinition {
  id: ScopeId;
  label: string;
  /** One sentence on the screen, saying what leaves the building. */
  description: string;
  /** Probed table, for the reason an empty answer might not be an empty table. */
  table: string;
  /** The column the date window applies to. */
  dateColumn: string;
  /** True when rows carry a name, an address or a phone number. */
  personal: boolean;
  /** Which extra filter this scope understands, if any. */
  filter?: 'type' | 'route';
}

export const SCOPES: readonly ScopeDefinition[] = [
  {
    id: 'people',
    label: 'People',
    description: 'One row per person: the id, both forms of their address, phone, role and their organisation link.',
    table: 'people',
    dateColumn: 'created_at',
    personal: true,
  },
  {
    id: 'organisations',
    label: 'Organisations',
    description: 'One row per organisation, including the ones flagged for review because a same-named row already existed.',
    table: 'organisations',
    dateColumn: 'created_at',
    personal: false,
  },
  {
    id: 'submissions',
    label: 'Submissions',
    description: 'What somebody actually sent, with each answer under the question they were asked. Test and spam rows are marked, not dropped.',
    table: 'form_submissions',
    dateColumn: 'submitted_at',
    personal: true,
    filter: 'type',
  },
  {
    id: 'opportunities',
    label: 'Pipeline',
    description: 'The conversation rather than the form: stage, owner, next action and when the stage was entered.',
    table: 'opportunities',
    dateColumn: 'created_at',
    personal: true,
    filter: 'route',
  },
  {
    id: 'attributions',
    label: 'Attribution',
    description: 'First touch and submission session, kept apart and never reconciled. Missing stays missing.',
    table: 'attributions',
    dateColumn: 'session_captured_at',
    personal: false,
  },
  {
    id: 'consents',
    label: 'Consent',
    description: 'Every grant and every withdrawal, with the exact wording and version the person saw.',
    table: 'consents',
    dateColumn: 'obtained_at',
    personal: true,
  },
];

export const isScope = (v: unknown): v is ScopeId =>
  typeof v === 'string' && SCOPES.some((s) => s.id === v);

export const scope = (id: ScopeId): ScopeDefinition => SCOPES.find((s) => s.id === id)!;

export interface ExportFilters {
  /** Days back from now. 0 means every row this scope holds. */
  days?: number;
  /** Submission type, for the submissions scope. */
  type?: Route;
  /** member | enterprise, for the pipeline scope. */
  route?: string;
}

export const DAY_WINDOWS = [7, 30, 90, 365, 0] as const;

/**
 * Refuse above this rather than truncate. See point 3 at the head of the file.
 * One row over and the caller gets a sentence, never a short file.
 */
export const ROW_CAP = 10_000;

export interface ExportFile {
  filename: string;
  csv: string;
  rows: number;
  /** What was actually applied, echoed back so the screen can say it. */
  scope: ScopeId;
}

// ---------------------------------------------------------------------------
// Answer columns, from the questions people were actually asked
// ---------------------------------------------------------------------------

/**
 * The answer columns for a set of routes.
 *
 * Union of the field names in route order, so a column appears once however
 * many forms ask for it. The header is the question label when every selected
 * route words it the same way, and the bare field name when they do not —
 * `goal` is "What you want to develop" on the application and "What the team
 * needs to learn" on the enterprise form, and printing either one over a mixed
 * column would attach a question to answers that were never given to it.
 */
export function answerColumns(routes: readonly Route[]): Column[] {
  const labels = new Map<string, Set<string>>();
  const order: string[] = [];

  for (const route of routes) {
    for (const field of FORMS[route].fields) {
      if (!labels.has(field.name)) {
        labels.set(field.name, new Set());
        order.push(field.name);
      }
      labels.get(field.name)!.add(field.label);
    }
  }

  return order.map((name) => {
    const seen = labels.get(name)!;
    return { key: `answer.${name}`, header: seen.size === 1 ? [...seen][0] : name };
  });
}

// ---------------------------------------------------------------------------
// Building one file
// ---------------------------------------------------------------------------

const since = (days: number | undefined): string | null =>
  days && days > 0 ? new Date(Date.now() - days * 86_400_000).toISOString() : null;

const stamp = () => new Date().toISOString().slice(0, 10);

/** Flatten PostgREST's embedded rows, which arrive as an object or an array. */
const embedded = <T>(value: unknown): T | null => {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
};

/**
 * Build one export.
 *
 * Returns `Answer` for the same reason every pipeline read does: a table that
 * did not answer must not come back as an empty CSV. An empty file and an
 * unreachable database look identical once they are on somebody's disk, and
 * one of them is a report that says the practice has no applicants.
 */
export async function buildExport(
  who: Identity | undefined,
  scopeId: ScopeId,
  filters: ExportFilters = {},
): Promise<Answer<ExportFile>> {
  const stop = gate<ExportFile>(who, 'export.records');
  if (stop) return stop;

  const def = scope(scopeId);

  // A second gate, and it is not decoration: `read.people` is what stands
  // between a role that may pull aggregate records and eight applicants'
  // contact details. Today every holder of export.records also holds
  // read.people; the day that stops being true this line is the difference.
  if (def.personal) {
    const personal = gate<ExportFile>(who, 'read.people');
    if (personal) {
      return denied('Your roles allow exporting records but not reading contact details.');
    }
  }

  const client = db();
  if (!client) return unavailable('Supabase is not configured for this deployment.');

  const from = since(filters.days);
  // cap + 1, so "exactly at the cap" and "over the cap" are distinguishable in
  // one query rather than needing a count round trip.
  const limit = ROW_CAP + 1;

  try {
    let rows: Record<string, unknown>[] = [];
    let columns: Column[] = [];

    switch (scopeId) {
      case 'people': {
        let q = client
          .from('people')
          .select(
            'person_id, name, normalised_email, original_email, phone, role, organisation_id, created_at, updated_at, organisations(name)',
          )
          .order('created_at', { ascending: false })
          .limit(limit);
        if (from) q = q.gte('created_at', from);

        const { data, error } = await q;
        if (error) return unavailable(sourceFailed(`${def.table} table`, error));

        columns = [
          { key: 'person_id', header: 'person_id' },
          { key: 'name', header: 'name' },
          { key: 'normalised_email', header: 'normalised_email' },
          { key: 'original_email', header: 'original_email' },
          { key: 'phone', header: 'phone' },
          { key: 'role', header: 'role' },
          { key: 'organisation_id', header: 'organisation_id' },
          { key: 'organisation_name', header: 'organisation_name' },
          { key: 'created_at', header: 'created_at' },
          { key: 'updated_at', header: 'updated_at' },
        ];

        rows = (data ?? []).map((r) => ({
          ...r,
          organisation_name: embedded<{ name: string | null }>(r.organisations)?.name ?? '',
        }));
        break;
      }

      case 'organisations': {
        let q = client
          .from('organisations')
          .select('organisation_id, name, domain, industry, needs_review, review_reason, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (from) q = q.gte('created_at', from);

        const { data, error } = await q;
        if (error) return unavailable(sourceFailed(`${def.table} table`, error));

        columns = [
          { key: 'organisation_id', header: 'organisation_id' },
          { key: 'name', header: 'name' },
          { key: 'domain', header: 'domain' },
          { key: 'industry', header: 'industry' },
          { key: 'needs_review', header: 'needs_review' },
          { key: 'review_reason', header: 'review_reason' },
          { key: 'created_at', header: 'created_at' },
          { key: 'updated_at', header: 'updated_at' },
        ];
        rows = (data ?? []) as Record<string, unknown>[];
        break;
      }

      case 'submissions': {
        let q = client
          .from('form_submissions')
          .select(
            'submission_id, request_key, reference, type, person_id, organisation_id, cohort_id, opportunity_id, answers, funding_route, group_size, submitted_at, privacy_notice_version, is_test, is_spam, people(name, normalised_email), organisations(name)',
          )
          .order('submitted_at', { ascending: false })
          .limit(limit);
        if (from) q = q.gte('submitted_at', from);
        if (filters.type) q = q.eq('type', filters.type);

        const { data, error } = await q;
        if (error) return unavailable(sourceFailed(`${def.table} table`, error));

        const routes: Route[] = filters.type ? [filters.type] : [...ROUTES];

        columns = [
          { key: 'submission_id', header: 'submission_id' },
          { key: 'request_key', header: 'request_key' },
          { key: 'reference', header: 'reference' },
          { key: 'type', header: 'type' },
          { key: 'person_id', header: 'person_id' },
          { key: 'person_name', header: 'name' },
          { key: 'person_email', header: 'normalised_email' },
          { key: 'organisation_id', header: 'organisation_id' },
          { key: 'organisation_name', header: 'organisation_name' },
          { key: 'cohort_id', header: 'cohort_id' },
          { key: 'opportunity_id', header: 'opportunity_id' },
          { key: 'funding_route', header: 'funding_route' },
          { key: 'group_size', header: 'group_size' },
          { key: 'submitted_at', header: 'submitted_at' },
          { key: 'privacy_notice_version', header: 'privacy_notice_version' },
          { key: 'is_test', header: 'is_test' },
          { key: 'is_spam', header: 'is_spam' },
          ...answerColumns(routes),
        ];

        rows = (data ?? []).map((r) => {
          const answers = (r.answers ?? {}) as Record<string, unknown>;
          const flat: Record<string, unknown> = {
            ...r,
            person_name: embedded<{ name: string | null }>(r.people)?.name ?? '',
            person_email: embedded<{ normalised_email: string | null }>(r.people)?.normalised_email ?? '',
            organisation_name: embedded<{ name: string | null }>(r.organisations)?.name ?? '',
          };
          // Answers the current form definition no longer asks for are NOT
          // dropped silently — they land in `answers_not_in_the_current_form`
          // so a copy edit cannot make an old applicant's words disappear from
          // the export that is meant to be the record of them.
          const known = new Set<string>();
          for (const route of routes) FORMS[route].fields.forEach((f) => known.add(f.name));
          const leftover: string[] = [];
          for (const [k, v] of Object.entries(answers)) {
            if (known.has(k)) flat[`answer.${k}`] = v;
            else leftover.push(`${k}: ${String(v)}`);
          }
          if (leftover.length) flat['answers_other'] = leftover.join('\n');
          return flat;
        });

        if (rows.some((r) => r['answers_other'])) {
          columns.push({ key: 'answers_other', header: 'answers_not_in_the_current_form' });
        }
        break;
      }

      case 'opportunities': {
        let q = client
          .from('opportunities')
          .select(
            'opportunity_id, person_id, organisation_id, route, cohort_id, stage, owner, stage_entered_at, closure_reason, next_action, due_at, created_at, updated_at, people(name, normalised_email), organisations(name)',
          )
          .order('created_at', { ascending: false })
          .limit(limit);
        if (from) q = q.gte('created_at', from);
        if (filters.route) q = q.eq('route', filters.route);

        const { data, error } = await q;
        if (error) return unavailable(sourceFailed(`${def.table} table`, error));

        columns = [
          { key: 'opportunity_id', header: 'opportunity_id' },
          { key: 'person_id', header: 'person_id' },
          { key: 'person_name', header: 'name' },
          { key: 'person_email', header: 'normalised_email' },
          { key: 'organisation_id', header: 'organisation_id' },
          { key: 'organisation_name', header: 'organisation_name' },
          { key: 'route', header: 'route' },
          { key: 'cohort_id', header: 'cohort_id' },
          { key: 'stage', header: 'stage' },
          { key: 'owner', header: 'owner' },
          { key: 'stage_entered_at', header: 'stage_entered_at' },
          { key: 'closure_reason', header: 'closure_reason' },
          { key: 'next_action', header: 'next_action' },
          { key: 'due_at', header: 'due_at' },
          { key: 'created_at', header: 'created_at' },
          { key: 'updated_at', header: 'updated_at' },
        ];

        rows = (data ?? []).map((r) => ({
          ...r,
          person_name: embedded<{ name: string | null }>(r.people)?.name ?? '',
          person_email: embedded<{ normalised_email: string | null }>(r.people)?.normalised_email ?? '',
          organisation_name: embedded<{ name: string | null }>(r.organisations)?.name ?? '',
        }));
        break;
      }

      case 'attributions': {
        let q = client
          .from('attributions')
          .select(
            'submission_id, first_source, first_medium, first_campaign, first_content, first_term, session_source, session_medium, session_campaign, session_content, session_term, entry_path, referrer_host, self_reported, tracking_permission, first_captured_at, session_captured_at',
          )
          .order('session_captured_at', { ascending: false })
          .limit(limit);
        if (from) q = q.gte('session_captured_at', from);

        const { data, error } = await q;
        if (error) return unavailable(sourceFailed(`${def.table} table`, error));

        columns = [
          'submission_id',
          'first_source',
          'first_medium',
          'first_campaign',
          'first_content',
          'first_term',
          'session_source',
          'session_medium',
          'session_campaign',
          'session_content',
          'session_term',
          'entry_path',
          'referrer_host',
          'self_reported',
          'tracking_permission',
          'first_captured_at',
          'session_captured_at',
        ].map((k) => ({ key: k, header: k }));
        rows = (data ?? []) as Record<string, unknown>[];
        break;
      }

      case 'consents': {
        let q = client
          .from('consents')
          .select(
            'consent_id, person_id, purpose, state, wording, wording_version, obtained_at, source, withdrawn_at, people(normalised_email)',
          )
          .order('obtained_at', { ascending: false })
          .limit(limit);
        if (from) q = q.gte('obtained_at', from);

        const { data, error } = await q;
        if (error) return unavailable(sourceFailed(`${def.table} table`, error));

        columns = [
          { key: 'consent_id', header: 'consent_id' },
          { key: 'person_id', header: 'person_id' },
          { key: 'person_email', header: 'normalised_email' },
          { key: 'purpose', header: 'purpose' },
          { key: 'state', header: 'state' },
          { key: 'wording', header: 'wording' },
          { key: 'wording_version', header: 'wording_version' },
          { key: 'obtained_at', header: 'obtained_at' },
          { key: 'source', header: 'source' },
          { key: 'withdrawn_at', header: 'withdrawn_at' },
        ];

        rows = (data ?? []).map((r) => ({
          ...r,
          person_email: embedded<{ normalised_email: string | null }>(r.people)?.normalised_email ?? '',
        }));
        break;
      }
    }

    if (rows.length > ROW_CAP) {
      return unavailable(
        `That is more than ${ROW_CAP.toLocaleString('en-GB')} rows. Narrow the date window and export it in parts — ` +
          'a file cut off at the cap would look complete and would not be.',
      );
    }

    const suffix = filters.type ?? filters.route ?? '';
    const window = filters.days && filters.days > 0 ? `${filters.days}d` : 'all';
    const filename = ['livingcraft', scopeId, suffix, window, stamp()].filter(Boolean).join('-') + '.csv';

    return ok({ filename, csv: csvDocument(columns, rows), rows: rows.length, scope: scopeId });
  } catch (err) {
    // Never echo the caught error: a PostgREST failure can carry a row with
    // it, and a row here is somebody's name and address.
    console.error('export failed:', err instanceof Error ? err.name : 'unknown');
    return unavailable('The export query did not complete.');
  }
}
