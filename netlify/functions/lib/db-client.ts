import { neon } from '@neondatabase/serverless';
import type {
  Lead,
  AgentRun,
  AgentRunStatus,
  ServiceIntent,
  Urgency,
  PipelineStage,
  TriggerType,
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
