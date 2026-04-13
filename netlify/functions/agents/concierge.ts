import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { getAnthropicClient, MODELS } from '../lib/anthropic-client.js';
import { runAgentLoop } from '../lib/agent-loop.js';
import { ToolRegistry } from '../lib/tool-executor.js';
import { CONCIERGE_SYSTEM_PROMPT } from '../lib/prompts/concierge.js';
import { upsertLeadRecord } from '../lib/db-client.js';
import type { AgentResult, FormSubmission, ServiceIntent, Lead } from '../lib/types.js';

// ─── Tool definitions ────────────────────────────────────────────────────────

const CONCIERGE_TOOLS: Tool[] = [
  {
    name: 'write_crm_record',
    description:
      'Create or update a lead record in the CRM with your classification results. ' +
      'Call this once you have analyzed the form submission and determined seniority, intent, and urgency.',
    input_schema: {
      type: 'object' as const,
      properties: {
        email: { type: 'string', description: "Lead's email address" },
        name: { type: 'string', description: "Lead's full name" },
        role_title: { type: 'string', description: "Lead's job title (if provided)" },
        company: { type: 'string', description: "Lead's company name (if provided)" },
        service_intent: {
          type: 'string',
          enum: ['training', 'mentoring', 'consulting', 'other'],
          description: 'Classified primary service interest',
        },
        message: { type: 'string', description: 'Original message verbatim from the form' },
        seniority_score: {
          type: 'number',
          description: '1–5 integer. 5=CTO/VP, 4=Director/Principal/Staff, 3=Senior EM/Architect, 2=EM/Senior IC, 1=IC/unknown',
        },
        urgency: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Buying urgency assessment',
        },
        pipeline_stage: {
          type: 'string',
          description: 'Always "new_lead" for first contact',
        },
        classification_confidence: {
          type: 'number',
          description: '0.0–1.0 confidence in the service_intent classification',
        },
      },
      required: [
        'email',
        'name',
        'service_intent',
        'message',
        'seniority_score',
        'urgency',
        'pipeline_stage',
        'classification_confidence',
      ],
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

interface SavedLeadHolder {
  lead: Lead | null;
}

function buildRegistry(holder: SavedLeadHolder): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register('write_crm_record', async (input) => {
    const lead = await upsertLeadRecord({
      email: input.email as string,
      name: input.name as string,
      role_title: input.role_title as string | undefined,
      company: input.company as string | undefined,
      service_intent: input.service_intent as ServiceIntent,
      message: input.message as string,
      seniority_score: input.seniority_score as number,
      urgency: input.urgency as 'high' | 'medium' | 'low',
      pipeline_stage: 'new_lead',
      classification_confidence: input.classification_confidence as number,
    });

    // Capture for downstream use
    holder.lead = lead;

    console.log(`[Concierge] Lead saved — id:${lead.id} intent:${lead.service_intent} seniority:${lead.seniority_score} urgency:${lead.urgency} confidence:${lead.classification_confidence}`);

    return {
      success: true,
      lead_id: lead.id,
      pipeline_stage: lead.pipeline_stage,
      confidence: lead.classification_confidence,
      requires_owner_review: lead.classification_confidence < 0.8,
    };
  });

  return registry;
}

// ─── Agent entry point ───────────────────────────────────────────────────────

export interface ConciergeResult extends AgentResult {
  leadId?: string;
  requiresOwnerReview?: boolean;
}

export async function runConcierge(submission: FormSubmission): Promise<ConciergeResult> {
  const holder: SavedLeadHolder = { lead: null };
  const client = getAnthropicClient();
  const registry = buildRegistry(holder);

  // Build the user message with all available form data
  const userMessage = buildSubmissionMessage(submission);

  try {
    const result = await runAgentLoop({
      client,
      model: MODELS.opus,          // Opus — output faces prospects, requires judgment
      system: CONCIERGE_SYSTEM_PROMPT,
      tools: CONCIERGE_TOOLS,
      initialMessages: [{ role: 'user', content: userMessage }],
      executeToolCall: registry.execute,
      maxRounds: 5,
      maxTokens: 1024,
    });

    const saved = holder.lead;
    return {
      success: true,
      output: result.output,
      leadId: saved?.id,
      requiresOwnerReview: saved ? saved.classification_confidence < 0.8 : true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Concierge] Error:', error);
    return { success: false, output: '', error };
  }
}

function buildSubmissionMessage(s: FormSubmission): string {
  const lines = [
    '## Inbound Contact Form Submission',
    '',
    `**Name:** ${s.name}`,
    `**Email:** ${s.email}`,
  ];
  if (s.role) lines.push(`**Role/Title:** ${s.role}`);
  if (s.company) lines.push(`**Company:** ${s.company}`);
  if (s.service_interest) lines.push(`**Service interest (self-reported):** ${s.service_interest}`);
  if (s.source) lines.push(`**CTA clicked:** ${s.source} (specific offering they engaged with — strong signal for service_intent classification)`);
  lines.push('', `**Message:**`, s.message);
  return lines.join('\n');
}
