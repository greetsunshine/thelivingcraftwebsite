/**
 * Neon DB client for Astro SSR pages (admin dashboard).
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL must be set');
  }
  return neon(url);
}

export type ServiceIntent = 'training' | 'mentoring' | 'consulting' | 'other';
export type Urgency = 'high' | 'medium' | 'low';
export type PipelineStage =
  | 'new_lead'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'closed_won'
  | 'closed_lost';

export interface Lead {
  id: string;
  email: string;
  name: string;
  role_title?: string;
  company?: string;
  service_intent: ServiceIntent;
  message: string;
  seniority_score: number;
  urgency: Urgency;
  pipeline_stage: PipelineStage;
  classification_confidence: number;
  enrichment_json?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  trigger_type: string;
  agents_invoked: string;
  status: 'running' | 'success' | 'failed';
  error_details?: string;
  duration_ms?: number;
  created_at: string;
}

export interface PipelineSummary {
  total: number;
  byStage: Record<string, number>;
  byIntent: Record<string, number>;
  highUrgency: number;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

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

export async function queryLeads(
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

export async function queryPipelineSummary(): Promise<PipelineSummary> {
  const sql = getSql();

  const [totalRows, stageRows, intentRows, urgencyRows] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM leads`,
    sql`SELECT pipeline_stage, COUNT(*)::int AS count FROM leads GROUP BY pipeline_stage`,
    sql`SELECT service_intent, COUNT(*)::int AS count FROM leads GROUP BY service_intent`,
    sql`SELECT COUNT(*)::int AS count FROM leads WHERE urgency = 'high'`,
  ]);

  const byStage: Record<string, number> = {};
  for (const row of stageRows) {
    byStage[row.pipeline_stage as string] = row.count as number;
  }

  const byIntent: Record<string, number> = {};
  for (const row of intentRows) {
    byIntent[row.service_intent as string] = row.count as number;
  }

  return {
    total: totalRows[0].count as number,
    byStage,
    byIntent,
    highUrgency: urgencyRows[0].count as number,
  };
}

export type TaskCategory =
  | 'lead_followup'
  | 'outreach'
  | 'content_review'
  | 'learning'
  | 'pipeline_review'
  | 'manual';

export interface TaskRow {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: number;
  created_by: string;
  related_lead_id?: string;
  related_url?: string;
  due_by?: string;
  status: string;
  created_at: string;
}

export async function queryOpenTasks(): Promise<TaskRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, title, description, category, priority, created_by,
           related_lead_id, related_url, due_by, status, created_at
    FROM tasks
    WHERE status IN ('open','in_progress')
       OR (status = 'snoozed' AND snoozed_until <= NOW())
    ORDER BY priority ASC, created_at ASC
    LIMIT 500
  `;
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? undefined,
    category: r.category as TaskCategory,
    priority: r.priority as number,
    created_by: r.created_by as string,
    related_lead_id: (r.related_lead_id as string | null) ?? undefined,
    related_url: (r.related_url as string | null) ?? undefined,
    due_by: r.due_by ? toIso(r.due_by) : undefined,
    status: r.status as string,
    created_at: toIso(r.created_at),
  }));
}

export async function queryRecentRuns(limit = 20): Promise<AgentRun[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id as string,
    trigger_type: row.trigger_type as string,
    agents_invoked: row.agents_invoked as string,
    status: row.status as 'running' | 'success' | 'failed',
    error_details: (row.error_details as string | null) ?? undefined,
    duration_ms: (row.duration_ms as number | null) ?? undefined,
    created_at: toIso(row.created_at),
  }));
}
