// Content for /resources/agent-memory-audit-kit.
//
// Same split as the other kit pages: the page is markup, this is the words and
// the tables. The schema and the example record are NOT written here. They are
// imported from kits/agent-memory-audit-kit/, the same files that go into the
// ZIP, so the schema a reader copies off the page is the schema the harness
// validates against. A second copy here would drift the first time a field
// moved.
//
// Three counts on this page are promises made in public before the page
// existed: twelve audit questions, seven failure tests, four decision outcomes.
// The arrays below are the source of those counts and the page asserts them at
// build time. If you need to add a question, the promise has to change first.

import schema from '../../kits/agent-memory-audit-kit/schema/memory-record.schema.json';
import exampleRecord from '../../kits/agent-memory-audit-kit/examples/01-explicit-trip-scoped.json';

/** Where the built files live. `npm run build:kit` writes all three. */
export const DOWNLOADS = {
  zip: '/downloads/agent-memory-audit-kit.zip',
  pdf: '/downloads/agent-memory-audit-kit.pdf',
  schema: '/downloads/memory-record.schema.json',
} as const;

/** The resource id, used by the beacon and the resources list. */
export const RESOURCE_ID = 'agent-memory-audit-kit';

// ── hero ───────────────────────────────────────────────────────────────────

export const TITLE = 'Agent Memory Audit Kit';
export const SUBTITLE =
  'Every fact your agent remembers needs three answers: where it came from, where it applies, and what happens when someone corrects it.';
export const META_LINE = 'Free · No sign-up · By Sunil Mathew, The Living Craft';

// ── why this exists ────────────────────────────────────────────────────────

export const WHY: string[] = [
  'An expense agent remembered a project code Priya typed once, for one trip, and reused it on the next trip. The team shipped a fix: learn from user corrections. Three weeks later, Priya corrected a code for a client dinner. That Friday, at the same restaurant, the agent put her own team’s dinner on the client’s bill.',
  'The stale memory never reached the client. The fix did. A correction is a memory too, and it needs the same discipline as any other memory.',
];
export const WHY_NOTE = 'Illustrative scenario. The failure pattern is real.';

// ── the three questions ────────────────────────────────────────────────────

export interface Question3 {
  name: string;
  ask: string;
  body: string;
}

export const THREE: Question3[] = [
  {
    name: 'Source',
    ask: 'Who said it?',
    body: '“Typed ATL-2291 for this trip” and “uses ATL-2291” are different facts. Store what the user stated, what a system record says, and what the agent inferred as different things.',
  },
  {
    name: 'Scope',
    ask: 'Where, and until when?',
    body: 'One request, one project, one quarter. A fact without a boundary quietly becomes a rule nobody wrote.',
  },
  {
    name: 'Correction',
    ask: 'What exactly changes?',
    body: 'This expense, this client, or every future dinner? A correction without a scope is the next wrong memory.',
  },
];

// ── 01 · the schema ────────────────────────────────────────────────────────

export const SCHEMA_INTRO =
  'Copy this into your memory layer’s design review. Every field exists because a real failure needed it.';

export interface Field {
  field: string;
  type: string;
  purpose: string;
  /** Which of the five promised things this field is. Shown as a tag. */
  answers?: 'Source' | 'Evidence' | 'Scope' | 'Expiry' | 'Correction route';
}

export const FIELDS: Field[] = [
  { field: 'id', type: 'string', purpose: 'Stable identifier. Never reused, even after deletion.' },
  { field: 'subject', type: '{ type: user | project | client | org, id }', purpose: 'Who or what the fact is about.' },
  { field: 'key', type: 'string, e.g. expense.project_code', purpose: 'What the fact is.' },
  { field: 'value', type: 'any, nullable', purpose: 'The remembered value. Null for policy pointers and tombstones.' },
  { field: 'authority', type: 'preference | fact | policy', purpose: 'How much weight it carries.' },
  { field: 'source.type', type: 'user_stated | system_record | agent_inferred | user_correction', purpose: 'Who said it.', answers: 'Source' },
  { field: 'source.evidence', type: '{ kind: message | record | trace, ref }', purpose: 'Where you can check it.', answers: 'Evidence' },
  { field: 'source.observations', type: 'integer ≥ 1', purpose: 'How many observations support it. The key number for inferred facts.' },
  { field: 'source.captured_at, source.captured_by', type: 'datetime, agent@version', purpose: 'Provenance. A bad batch of memories can be traced to the build that wrote it.' },
  { field: 'source.source_of_truth', type: 'URI, required when authority = policy', purpose: 'Where the real value lives.' },
  { field: 'scope.level', type: 'instance | task | session | project | client | user | org', purpose: 'How wide it applies.', answers: 'Scope' },
  { field: 'scope.bindings', type: 'object, e.g. { "trip_id": "TRIP-PUNE-0304" }', purpose: 'The concrete context it is bound to.' },
  { field: 'scope.valid_from, scope.valid_until', type: 'date, nullable', purpose: 'When it starts and stops being true.', answers: 'Expiry' },
  { field: 'scope.revalidate_on', type: 'array of event types, e.g. ["project_closed"]', purpose: 'Events that force a fresh check.', answers: 'Expiry' },
  { field: 'correction.route', type: 'string, required', purpose: 'How a human fixes it.', answers: 'Correction route' },
  { field: 'correction.supersedes, correction.superseded_by', type: 'ids', purpose: 'Correction history.' },
  { field: 'correction.broadened', type: 'boolean', purpose: 'True only if the user explicitly confirmed a wider scope.' },
  { field: 'lineage.derived_from', type: 'array of ids', purpose: 'What this fact was inferred from.' },
  { field: 'lifecycle.status', type: 'active | superseded | expired | deleted', purpose: 'Whether it can be served.' },
  { field: 'lifecycle.sensitivity', type: 'none | personal | sensitive', purpose: 'Retention rules.' },
  { field: 'lifecycle.retain_value_after_expiry', type: 'boolean, default false', purpose: 'Whether an expired record keeps its value.' },
  { field: 'usage.last_used_at, usage.use_count, usage.last_confirmed_at', type: 'datetime, integer, datetime', purpose: 'Staleness signals.' },
];

export interface Invariant {
  id: string;
  rule: string;
}

export const INVARIANTS: Invariant[] = [
  { id: 'I1', rule: 'An inferred record cannot have a scope wider than its evidence supports, unless the user confirmed it.' },
  { id: 'I2', rule: 'A policy record stores a pointer, never a value. Policy is fetched from its source of truth at use time.' },
  { id: 'I3', rule: 'Every record names a correction route.' },
  { id: 'I4', rule: 'A user correction defaults to the scope of the instance corrected. Broadening it needs broadened: true plus evidence that the user confirmed the wider scope.' },
  { id: 'I5', rule: 'Superseded, expired and deleted records are never served.' },
  { id: 'I6', rule: 'A sensitive record must have a valid_until date.' },
  { id: 'I7', rule: 'Deleting a record invalidates every record whose lineage.derived_from includes it. The tombstone keeps id, key, deletion time and reason. The value is removed.' },
];

export const INVARIANTS_NOTE =
  'I2, I3, I4, I6 and the tombstone shape are encoded in the JSON Schema with if/then. I1, I5 and the cascade in I7 are rules across records, so the schema cannot hold them; the reference store in the kit enforces them.';

/** The example record, from the file in the kit. Never edit it here. */
export const EXAMPLE_RECORD = JSON.stringify(exampleRecord, null, 2);
export const EXAMPLE_CAPTION =
  'A fact Priya stated, bound to one trip. It answers all three questions: msg_8812 is the evidence, trip TRIP-PUNE-0304 is the scope, and the override on the expense form is the correction route.';

/** The schema's own title and the number of top-level fields, for the caption under the link. */
export const SCHEMA_FIELD_COUNT = Object.keys(schema.properties).length;

// ── 02 · twelve audit questions ────────────────────────────────────────────

export const AUDIT_INTRO = 'Run these against one remembered fact in your system. Any red flag is a design task.';

export interface AuditQuestion {
  n: number;
  ask: string;
  redFlag: string;
}

export interface AuditGroup {
  name: 'Source' | 'Scope' | 'Correction';
  questions: AuditQuestion[];
}

export const AUDIT: AuditGroup[] = [
  {
    name: 'Source',
    questions: [
      { n: 1, ask: 'Can you point to the exact evidence for this fact: a message, a record, or a trace?', redFlag: '“The agent just knows.”' },
      { n: 2, ask: 'Is it stored as user-stated, system record, or inferred, and does the agent behave differently for each?', redFlag: 'All three reach the prompt looking identical.' },
      { n: 3, ask: 'If inferred, how many observations support it, and would the user agree with the generalisation?', redFlag: 'One observation became a preference.' },
      { n: 4, ask: 'Is anything policy-like (limits, approvals, permissions) being served from memory instead of its source of truth?', redFlag: 'A cached policy value.' },
    ],
  },
  {
    name: 'Scope',
    questions: [
      { n: 5, ask: 'What is the narrowest context this fact is true for, and is that what you store?', redFlag: 'Everything is stored at user level.' },
      { n: 6, ask: 'When does it stop being true: a date, an event, or never?', redFlag: '“Never” for anything tied to a project, role, price or person.' },
      { n: 7, ask: 'Which event forces revalidation, and is that event actually wired to the memory store?', redFlag: 'Expiry exists only in a design doc.' },
      { n: 8, ask: 'Can the agent tell a user why it applied this memory here?', redFlag: 'No trace from output back to a memory record.' },
    ],
  },
  {
    name: 'Correction',
    questions: [
      { n: 9, ask: 'How does a user correct it, both in the moment and later?', redFlag: 'Only an engineer editing a database can.' },
      { n: 10, ask: 'When corrected, what exactly changes (this instance, this scope, future behaviour), and who decided?', redFlag: '“The agent learns from it.”' },
      { n: 11, ask: 'After deletion, does anything derived from it survive, such as summaries, embeddings or inferred preferences?', redFlag: 'Nobody knows.' },
      { n: 12, ask: 'What sensitive content does your correction history retain, and do you need it?', redFlag: 'Full values kept forever “for audit”.' },
    ],
  },
];

export const AUDIT_COUNT = AUDIT.reduce((n, g) => n + g.questions.length, 0);

// ── 03 · seven failure tests ───────────────────────────────────────────────

export const TESTS_INTRO =
  'Each test is one way memory hurts real users. Run them against the naive store and watch all seven fail, then against the reference store, then against your own.';

export interface FailureTest {
  n: number;
  title: string;
  /** The pytest function name, verbatim from tests/test_failure_modes.py. */
  test: string;
  given: string;
  when: string;
  then: string;
}

export const TESTS: FailureTest[] = [
  {
    n: 1,
    title: 'Scope bleed',
    test: 'test_scope_bleed',
    given: 'ATL-2291 remembered at task scope, bound to trip_id T1.',
    when: 'Recall expense.project_code for trip_id T2, a different client.',
    then: 'Decision is not apply.',
  },
  {
    n: 2,
    title: 'Stale fact',
    test: 'test_stale_fact',
    given: 'A project-scoped code with revalidate_on: ["project_closed"].',
    when: 'Emit project_closed, then recall in that project.',
    then: 'Decision is none. The record’s status is expired.',
  },
  {
    n: 3,
    title: 'Inferred as explicit',
    test: 'test_inferred_as_explicit',
    given: 'An agent_inferred fare class “economy” with observations: 1.',
    when: 'Recall.',
    then: 'Decision is ask. source_type is agent_inferred.',
  },
  {
    n: 4,
    title: 'Correction bleed',
    test: 'test_correction_bleed',
    given: 'The user corrects the code to MER-0417 on EXP-5521: merchant Olive Grove, client attendees.',
    when: 'Recall for EXP-5530: same merchant, internal attendees only.',
    then: 'MER-0417 is not applied to EXP-5530. Recall for EXP-5521 still returns MER-0417 with apply.',
  },
  {
    n: 5,
    title: 'Policy shadowing',
    test: 'test_policy_shadowing',
    given: 'Memory tries to hold the meal limit 75 as policy. The policy source now returns 60.',
    when: 'Recall the meal limit.',
    then: 'Value is 60. Decision is revalidate. No policy value was persisted.',
  },
  {
    n: 6,
    title: 'Zombie memory',
    test: 'test_zombie_memory',
    given: 'Record X (default cost centre) and record Y (approver) with derived_from: [X].',
    when: 'Forget X, then recall Y’s key.',
    then: 'Decision is none. X’s tombstone carries no value.',
  },
  {
    n: 7,
    title: 'Unexplainable recall',
    test: 'test_unexplainable_recall',
    given: 'Any active, user-stated record in scope.',
    when: 'Recall returns apply.',
    then: 'The result carries record_id, source_type and evidence_ref. explain() returns source, evidence, scope and correction route.',
  },
];

export const PYTEST_COMMANDS = ['pip install -e .', 'pytest                  # reference store: 7 passed', 'pytest --store=naive    # naive store: 7 failed (on purpose)'].join('\n');

export const TESTS_NOTE =
  'The harness is Python 3.11 or newer, with pytest and jsonschema as its only dependencies. Its README, in the ZIP, shows how to write a six-method adapter for your own memory layer and run the same seven tests against it.';

// ── 04 · the decision table ────────────────────────────────────────────────

export type Outcome = 'Remember' | 'Revalidate' | 'Ask' | 'Forget';

export const OUTCOMES: { name: Outcome; means: string }[] = [
  { name: 'Remember', means: 'apply it, with a visible trace to the record' },
  { name: 'Revalidate', means: 'check the source of truth before using it' },
  { name: 'Ask', means: 'confirm with the user before using it' },
  { name: 'Forget', means: 'expire or delete it (tombstone only)' },
];

export const CONSEQUENTIAL =
  '“Consequential” means the action moves money, grants access, contacts someone outside the organisation, or is hard to undo.';

export interface DecisionRow {
  situation: string;
  outcome: Outcome;
  /** The condition on the outcome, if any. Shown after the outcome name. */
  note?: string;
}

export const DECISIONS: DecisionRow[] = [
  { situation: 'User-stated, in scope, not expired, low-stakes action', outcome: 'Remember' },
  { situation: 'User-stated, in scope, consequential action', outcome: 'Ask' },
  { situation: 'Came from a system record', outcome: 'Revalidate' },
  { situation: 'Policy, limit or permission', outcome: 'Revalidate', note: 'every time; never store the value' },
  { situation: 'Inferred from a single observation', outcome: 'Ask' },
  { situation: 'Inferred, repeated, and confirmed by the user', outcome: 'Remember', note: 'within the confirmed scope' },
  { situation: 'Any fact used outside its bound context (new trip, project, client)', outcome: 'Ask' },
  { situation: 'A user correction', outcome: 'Remember', note: 'at the corrected instance’s scope; Ask before broadening' },
  { situation: 'Past valid_until, or a revalidation event fired', outcome: 'Forget' },
  { situation: 'User asked to delete', outcome: 'Forget', note: 'including everything derived from it' },
  { situation: 'Sensitive and no longer needed for the task', outcome: 'Forget', note: 'the value; keep a minimal audit entry' },
];

// ── closing ────────────────────────────────────────────────────────────────

export const CLOSE_TITLE = 'Memory is a set of promises';
export const CLOSE_BODY =
  'Memory isn’t a feature you add to an agent. It is a set of promises about what the agent may believe, where, and for how long. This kit turns those promises into things you can review and test.';
export const CLOSE_CTA =
  'This is one episode of how we teach agentic system design to senior engineering leaders and architects at The Living Craft.';
export const LICENCE_LINE = 'Content CC BY 4.0 · Code MIT · © The Living Craft';
