// Shared types for The Living Craft agent crew

export interface FormSubmission {
  name: string;
  email: string;
  role?: string;
  company?: string;
  service_interest?: string;
  message: string;
  source?: string;
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
  seniority_score: number;       // 1–5
  urgency: Urgency;
  pipeline_stage: PipelineStage;
  classification_confidence: number; // 0.0–1.0
  enrichment_json?: string;
  created_at: string;            // ISO 8601
  updated_at: string;
}

export type AgentRunStatus = 'running' | 'success' | 'failed';
export type TriggerType = 'form_submission' | 'cron' | 'owner_trigger';

export interface AgentRun {
  id: string;
  trigger_type: TriggerType;
  agents_invoked: string;        // comma-separated
  status: AgentRunStatus;
  error_details?: string;
  duration_ms?: number;
  input_ref?: string;            // UUID ref — no PII
  created_at: string;
}

// Result returned by each agent
export interface AgentResult {
  success: boolean;
  output: string;
  data?: Record<string, unknown>;
  error?: string;
}

// ─── Tasks (shared crew queue) ────────────────────────────────────────────────

export type TaskCategory =
  | 'lead_followup'
  | 'outreach'
  | 'content_review'
  | 'learning'
  | 'pipeline_review'
  | 'manual';

export type TaskPriority = 1 | 2 | 3 | 4 | 5;
export type TaskStatus = 'open' | 'in_progress' | 'done' | 'dismissed' | 'snoozed';
export type TaskAssignee = 'owner' | 'agent';
export type TaskCreator = 'concierge' | 'scribe' | 'marketer' | 'archivist' | 'owner';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  assignee: TaskAssignee;
  created_by: TaskCreator;
  related_lead_id?: string;
  related_url?: string;
  due_by?: string;
  status: TaskStatus;
  snoozed_until?: string;
  completed_at?: string;
  context_json?: Record<string, unknown>;
  dedup_key?: string;
  created_at: string;
  updated_at: string;
}

export interface OutreachDraft {
  id: string;
  lead_id?: string;
  target_account_id?: string;
  channel: 'email' | 'linkedin';
  signal_context?: string;
  draft_subject?: string;
  draft_body: string;
  status: 'ready_for_review' | 'approved' | 'sent' | 'rejected';
  created_at: string;
}

export interface TargetAccount {
  id: string;
  company: string;
  tier: 'tier_1' | 'tier_2' | 'tier_3';
  why_on_list?: string;
  signals_json?: Record<string, unknown>;
  last_checked_at?: string;
}
