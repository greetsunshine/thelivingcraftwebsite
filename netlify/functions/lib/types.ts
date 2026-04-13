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
