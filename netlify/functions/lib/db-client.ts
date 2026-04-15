import { neon } from '@neondatabase/serverless';
import type {
  Lead,
  AgentRun,
  AgentRunStatus,
  ServiceIntent,
  Urgency,
  PipelineStage,
  TriggerType,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TaskCreator,
  TaskAssignee,
  OutreachDraft,
  TargetAccount,
} from './types.js';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL must be set');
  }
  return neon(url);
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function createLeadRecord(
  lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
): Promise<Lead> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO leads
      (email, name, role_title, company, service_intent, message,
       seniority_score, urgency, pipeline_stage, classification_confidence, enrichment_json)
    VALUES
      (${lead.email}, ${lead.name}, ${lead.role_title ?? null}, ${lead.company ?? null},
       ${lead.service_intent}, ${lead.message}, ${lead.seniority_score}, ${lead.urgency},
       ${lead.pipeline_stage}, ${lead.classification_confidence}, ${lead.enrichment_json ?? null})
    RETURNING *
  `;
  return rowToLead(rows[0]);
}

export async function upsertLeadRecord(
  lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
): Promise<Lead> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO leads
      (email, name, role_title, company, service_intent, message,
       seniority_score, urgency, pipeline_stage, classification_confidence)
    VALUES
      (${lead.email}, ${lead.name}, ${lead.role_title ?? null}, ${lead.company ?? null},
       ${lead.service_intent}, ${lead.message}, ${lead.seniority_score}, ${lead.urgency},
       ${lead.pipeline_stage}, ${lead.classification_confidence})
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role_title = EXCLUDED.role_title,
      company = EXCLUDED.company,
      service_intent = EXCLUDED.service_intent,
      seniority_score = EXCLUDED.seniority_score,
      urgency = EXCLUDED.urgency,
      pipeline_stage = EXCLUDED.pipeline_stage,
      classification_confidence = EXCLUDED.classification_confidence,
      updated_at = NOW()
    RETURNING *
  `;
  return rowToLead(rows[0]);
}

export async function getLeads(
  opts: {
    stage?: PipelineStage;
    intent?: ServiceIntent;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Lead[]> {
  const sql = getSql();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  // Neon's tagged template handles all four filter combinations cleanly
  let rows: Record<string, unknown>[];

  if (opts.stage && opts.intent) {
    rows = await sql`
      SELECT * FROM leads
      WHERE pipeline_stage = ${opts.stage} AND service_intent = ${opts.intent}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (opts.stage) {
    rows = await sql`
      SELECT * FROM leads WHERE pipeline_stage = ${opts.stage}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (opts.intent) {
    rows = await sql`
      SELECT * FROM leads WHERE service_intent = ${opts.intent}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    rows = await sql`
      SELECT * FROM leads
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return rows.map(rowToLead);
}

export async function updateLeadStage(id: string, stage: PipelineStage): Promise<void> {
  const sql = getSql();
  await sql`UPDATE leads SET pipeline_stage = ${stage}, updated_at = NOW() WHERE id = ${id}`;
}

export async function findLeadByEmail(email: string): Promise<Lead | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM leads WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
  return rows.length > 0 ? rowToLead(rows[0]) : null;
}

export async function setFirstContactBookedAt(id: string, when: Date): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE leads
    SET first_contact_booked_at = COALESCE(first_contact_booked_at, ${when.toISOString()}),
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled';

export interface BookingUpsert {
  lead_id: string | null;
  cal_booking_uid: string;
  event_type?: string;
  scheduled_for: Date;
  end_time?: Date;
  meeting_url?: string;
  attendee_email: string;
  attendee_name?: string;
  status: BookingStatus;
  notes?: string;
}

export async function upsertBooking(b: BookingUpsert): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO bookings
      (lead_id, cal_booking_uid, event_type, scheduled_for, end_time,
       meeting_url, attendee_email, attendee_name, status, notes)
    VALUES
      (${b.lead_id}, ${b.cal_booking_uid}, ${b.event_type ?? null},
       ${b.scheduled_for.toISOString()}, ${b.end_time?.toISOString() ?? null},
       ${b.meeting_url ?? null}, ${b.attendee_email.toLowerCase().trim()},
       ${b.attendee_name ?? null}, ${b.status}, ${b.notes ?? null})
    ON CONFLICT (cal_booking_uid) DO UPDATE SET
      scheduled_for = EXCLUDED.scheduled_for,
      end_time      = EXCLUDED.end_time,
      meeting_url   = EXCLUDED.meeting_url,
      status        = EXCLUDED.status,
      notes         = EXCLUDED.notes,
      updated_at    = NOW()
  `;
}

// ─── Agent Runs ──────────────────────────────────────────────────────────────

export async function createAgentRun(run: {
  trigger_type: TriggerType;
  agents_invoked: string[];
  input_ref?: string;
}): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO agent_runs (trigger_type, agents_invoked, status, input_ref)
    VALUES (${run.trigger_type}, ${run.agents_invoked.join(',')}, 'running', ${run.input_ref ?? null})
    RETURNING id
  `;
  return rows[0].id as string;
}

export async function finalizeAgentRun(
  id: string,
  status: AgentRunStatus,
  opts: { duration_ms?: number; error_details?: string } = {}
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE agent_runs
    SET status = ${status},
        duration_ms = ${opts.duration_ms ?? null},
        error_details = ${opts.error_details ?? null}
    WHERE id = ${id}
  `;
}

export async function getAgentRuns(limit = 50): Promise<AgentRun[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id as string,
    trigger_type: row.trigger_type as TriggerType,
    agents_invoked: row.agents_invoked as string,
    status: row.status as AgentRunStatus,
    error_details: (row.error_details as string | null) ?? undefined,
    duration_ms: (row.duration_ms as number | null) ?? undefined,
    input_ref: (row.input_ref as string | null) ?? undefined,
    created_at: toIso(row.created_at),
  }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role_title: (row.role_title as string | null) ?? undefined,
    company: (row.company as string | null) ?? undefined,
    service_intent: row.service_intent as ServiceIntent,
    message: row.message as string,
    seniority_score: row.seniority_score as number,
    urgency: row.urgency as Urgency,
    pipeline_stage: row.pipeline_stage as PipelineStage,
    classification_confidence: row.classification_confidence as number,
    enrichment_json: row.enrichment_json ? JSON.stringify(row.enrichment_json) : undefined,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return String(value);
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  created_by: TaskCreator;
  assignee?: TaskAssignee;
  related_lead_id?: string;
  related_url?: string;
  due_by?: Date;
  context?: Record<string, unknown>;
  dedup_key?: string;
}

export async function createTask(input: CreateTaskInput): Promise<Task | null> {
  const sql = getSql();
  // ON CONFLICT on dedup_key means duplicate creates are silently dropped
  const rows = await sql`
    INSERT INTO tasks (
      title, description, category, priority, assignee, created_by,
      related_lead_id, related_url, due_by, context_json, dedup_key
    ) VALUES (
      ${input.title}, ${input.description ?? null}, ${input.category},
      ${input.priority}, ${input.assignee ?? 'owner'}, ${input.created_by},
      ${input.related_lead_id ?? null}, ${input.related_url ?? null},
      ${input.due_by?.toISOString() ?? null},
      ${input.context ? JSON.stringify(input.context) : null},
      ${input.dedup_key ?? null}
    )
    ON CONFLICT (dedup_key) DO NOTHING
    RETURNING *
  `;
  if (rows.length === 0) return null;
  return rowToTask(rows[0]);
}

export async function getOpenTasks(
  opts: { category?: TaskCategory; limit?: number } = {}
): Promise<Task[]> {
  const sql = getSql();
  const limit = opts.limit ?? 200;
  const rows = opts.category
    ? await sql`
        SELECT * FROM tasks
        WHERE status = 'open' AND category = ${opts.category}
        ORDER BY priority ASC, created_at ASC LIMIT ${limit}
      `
    : await sql`
        SELECT * FROM tasks
        WHERE status IN ('open','in_progress')
           OR (status = 'snoozed' AND snoozed_until <= NOW())
        ORDER BY priority ASC, created_at ASC LIMIT ${limit}
      `;
  return rows.map(rowToTask);
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  opts: { snoozed_until?: Date } = {}
): Promise<void> {
  const sql = getSql();
  const completedAt = status === 'done' ? new Date().toISOString() : null;
  const snoozedUntil = opts.snoozed_until?.toISOString() ?? null;
  await sql`
    UPDATE tasks
    SET status        = ${status},
        completed_at  = COALESCE(${completedAt}, completed_at),
        snoozed_until = ${snoozedUntil},
        updated_at    = NOW()
    WHERE id = ${id}
  `;
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    category: row.category as TaskCategory,
    priority: row.priority as TaskPriority,
    assignee: row.assignee as TaskAssignee,
    created_by: row.created_by as TaskCreator,
    related_lead_id: (row.related_lead_id as string | null) ?? undefined,
    related_url: (row.related_url as string | null) ?? undefined,
    due_by: row.due_by ? toIso(row.due_by) : undefined,
    status: row.status as TaskStatus,
    snoozed_until: row.snoozed_until ? toIso(row.snoozed_until) : undefined,
    completed_at: row.completed_at ? toIso(row.completed_at) : undefined,
    context_json: (row.context_json as Record<string, unknown> | null) ?? undefined,
    dedup_key: (row.dedup_key as string | null) ?? undefined,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

// ─── Outreach drafts & Target accounts ───────────────────────────────────────

export async function createOutreachDraft(d: {
  lead_id?: string;
  target_account_id?: string;
  channel: 'email' | 'linkedin';
  signal_context?: string;
  draft_subject?: string;
  draft_body: string;
}): Promise<OutreachDraft> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO outreach_drafts
      (lead_id, target_account_id, channel, signal_context, draft_subject, draft_body)
    VALUES
      (${d.lead_id ?? null}, ${d.target_account_id ?? null}, ${d.channel},
       ${d.signal_context ?? null}, ${d.draft_subject ?? null}, ${d.draft_body})
    RETURNING *
  `;
  const r = rows[0];
  return {
    id: r.id as string,
    lead_id: (r.lead_id as string | null) ?? undefined,
    target_account_id: (r.target_account_id as string | null) ?? undefined,
    channel: r.channel as 'email' | 'linkedin',
    signal_context: (r.signal_context as string | null) ?? undefined,
    draft_subject: (r.draft_subject as string | null) ?? undefined,
    draft_body: r.draft_body as string,
    status: r.status as OutreachDraft['status'],
    created_at: toIso(r.created_at),
  };
}

export async function getTargetAccounts(limit = 100): Promise<TargetAccount[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM target_accounts ORDER BY tier ASC, last_checked_at ASC NULLS FIRST LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id as string,
    company: r.company as string,
    tier: r.tier as 'tier_1' | 'tier_2' | 'tier_3',
    why_on_list: (r.why_on_list as string | null) ?? undefined,
    signals_json: (r.signals_json as Record<string, unknown> | null) ?? undefined,
    last_checked_at: r.last_checked_at ? toIso(r.last_checked_at) : undefined,
  }));
}

export async function updateLeadFitScore(id: string, score: number): Promise<void> {
  const sql = getSql();
  await sql`UPDATE leads SET fit_score = ${score}, updated_at = NOW() WHERE id = ${id}`;
}

// ─── Content calendar (Scribe Phase 1) ───────────────────────────────────────

export async function createProposedTopic(t: {
  scheduled_date: Date;
  format: 'blog' | 'linkedin' | 'newsletter';
  topic: string;
  angle?: string;
  heat_score?: number;
  enterprise_relevance_score?: number;
  sources?: unknown;
}): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO content_calendar
      (scheduled_date, format, topic, status, angle, heat_score,
       enterprise_relevance_score, sources_json)
    VALUES
      (${t.scheduled_date.toISOString().slice(0, 10)}, ${t.format}, ${t.topic}, 'proposed',
       ${t.angle ?? null}, ${t.heat_score ?? null},
       ${t.enterprise_relevance_score ?? null},
       ${t.sources ? JSON.stringify(t.sources) : null})
    RETURNING id
  `;
  return rows[0].id as string;
}

export interface ApprovedTopic {
  id: string;
  topic: string;
  angle: string | null;
  format: 'blog' | 'linkedin' | 'newsletter';
  scheduled_date: string;
  sources_json: unknown;
}

export async function getApprovedTopicsToDraft(limit = 5): Promise<ApprovedTopic[]> {
  const sql = getSql();
  // 'planned' = owner-approved, not yet drafted. Scribe Phase 2 picks these up.
  const rows = await sql`
    SELECT id, topic, angle, format, scheduled_date, sources_json
    FROM content_calendar
    WHERE status = 'planned'
    ORDER BY scheduled_date ASC LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id as string,
    topic: r.topic as string,
    angle: (r.angle as string | null),
    format: r.format as 'blog' | 'linkedin' | 'newsletter',
    scheduled_date: toIso(r.scheduled_date),
    sources_json: r.sources_json,
  }));
}

export async function saveContentDraft(d: {
  calendar_id: string;
  format: 'blog' | 'linkedin' | 'newsletter';
  topic: string;
  body: string;
}): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO content_drafts (format, topic, body, status, calendar_id)
    VALUES (${d.format}, ${d.topic}, ${d.body}, 'ready_for_review', ${d.calendar_id})
    RETURNING id
  `;
  return rows[0].id as string;
}

export async function markCalendarDrafted(id: string, draftId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE content_calendar
    SET status = 'drafted', draft_id = ${draftId}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

// ─── First-reply drafting (Concierge Phase 3) ────────────────────────────────

export async function saveFirstReplyDraft(
  leadId: string,
  subject: string,
  body: string
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE leads
    SET first_reply_subject = ${subject},
        first_reply_draft   = ${body},
        first_reply_status  = 'drafted',
        updated_at          = NOW()
    WHERE id = ${leadId}
  `;
}

// ─── Reading list (Scribe Intelligence) ──────────────────────────────────────

export interface ReadingItemInput {
  title: string;
  url: string;
  source?: string;
  author?: string;
  published_date?: string;  // YYYY-MM-DD
  category: 'technical' | 'business';
  subcategory?: string;
  why_it_matters: string;
  relevance_score: number;
}

export async function createReadingItem(item: ReadingItemInput): Promise<string | null> {
  const sql = getSql();
  // ON CONFLICT (url) DO NOTHING → silently skip duplicates from re-runs
  const rows = await sql`
    INSERT INTO reading_list
      (title, url, source, author, published_date, category, subcategory,
       why_it_matters, relevance_score)
    VALUES
      (${item.title}, ${item.url}, ${item.source ?? null}, ${item.author ?? null},
       ${item.published_date ?? null}, ${item.category}, ${item.subcategory ?? null},
       ${item.why_it_matters}, ${item.relevance_score})
    ON CONFLICT (url) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0 ? (rows[0].id as string) : null;
}

export interface ReadingItem {
  id: string;
  title: string;
  url: string;
  source?: string;
  author?: string;
  published_date?: string;
  category: 'technical' | 'business';
  subcategory?: string;
  why_it_matters: string;
  relevance_score: number;
  status: 'unread' | 'reading' | 'read' | 'archived' | 'dismissed';
  created_at: string;
}

export async function getReadingList(
  opts: { category?: 'technical' | 'business'; status?: string; limit?: number } = {}
): Promise<ReadingItem[]> {
  const sql = getSql();
  const limit = opts.limit ?? 200;
  const rows = opts.category && opts.status
    ? await sql`
        SELECT * FROM reading_list
        WHERE category = ${opts.category} AND status = ${opts.status}
        ORDER BY relevance_score DESC, created_at DESC LIMIT ${limit}
      `
    : opts.category
      ? await sql`
          SELECT * FROM reading_list WHERE category = ${opts.category}
          AND status NOT IN ('dismissed','archived')
          ORDER BY relevance_score DESC, created_at DESC LIMIT ${limit}
        `
      : opts.status
        ? await sql`
            SELECT * FROM reading_list WHERE status = ${opts.status}
            ORDER BY relevance_score DESC, created_at DESC LIMIT ${limit}
          `
        : await sql`
            SELECT * FROM reading_list
            WHERE status NOT IN ('dismissed','archived')
            ORDER BY relevance_score DESC, created_at DESC LIMIT ${limit}
          `;
  return rows.map(rowToReadingItem);
}

export async function updateReadingStatus(
  id: string,
  status: 'unread' | 'reading' | 'read' | 'archived' | 'dismissed'
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE reading_list SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

function rowToReadingItem(row: Record<string, unknown>): ReadingItem {
  return {
    id: row.id as string,
    title: row.title as string,
    url: row.url as string,
    source: (row.source as string | null) ?? undefined,
    author: (row.author as string | null) ?? undefined,
    published_date: row.published_date ? toIso(row.published_date).slice(0, 10) : undefined,
    category: row.category as 'technical' | 'business',
    subcategory: (row.subcategory as string | null) ?? undefined,
    why_it_matters: row.why_it_matters as string,
    relevance_score: row.relevance_score as number,
    status: row.status as ReadingItem['status'],
    created_at: toIso(row.created_at),
  };
}

export async function markFirstReplySent(leadId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE leads
    SET first_reply_status  = 'sent',
        first_reply_sent_at = NOW(),
        updated_at          = NOW()
    WHERE id = ${leadId}
  `;
}
