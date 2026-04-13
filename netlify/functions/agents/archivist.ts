import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { getAnthropicClient, MODELS } from '../lib/anthropic-client.js';
import { runAgentLoop } from '../lib/agent-loop.js';
import { ToolRegistry } from '../lib/tool-executor.js';
import { ARCHIVIST_SYSTEM_PROMPT } from '../lib/prompts/archivist.js';
import {
  getLeads,
  updateLeadStage,
  upsertLeadRecord,
} from '../lib/db-client.js';
import type { AgentResult, PipelineStage, ServiceIntent } from '../lib/types.js';

// ─── Tool definitions ────────────────────────────────────────────────────────

const ARCHIVIST_TOOLS: Tool[] = [
  {
    name: 'read_crm_records',
    description: 'Query lead records from the CRM. Returns an array of lead objects.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pipeline_stage: {
          type: 'string',
          description: 'Filter by pipeline stage (new_lead, contacted, qualified, proposal_sent, closed_won, closed_lost)',
        },
        service_intent: {
          type: 'string',
          description: 'Filter by service intent (training, mentoring, consulting, other)',
        },
        limit: {
          type: 'number',
          description: 'Maximum records to return (default 50)',
        },
      },
    },
  },
  {
    name: 'update_lead_stage',
    description: 'Update the pipeline_stage of an existing lead by ID.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'The lead UUID' },
        pipeline_stage: {
          type: 'string',
          description: 'New stage: new_lead | contacted | qualified | proposal_sent | closed_won | closed_lost',
        },
      },
      required: ['id', 'pipeline_stage'],
    },
  },
  {
    name: 'write_crm_record',
    description: 'Create or update a lead record. If email already exists, updates the record.',
    input_schema: {
      type: 'object' as const,
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
        role_title: { type: 'string' },
        company: { type: 'string' },
        service_intent: {
          type: 'string',
          description: 'training | mentoring | consulting | other',
        },
        message: { type: 'string' },
        seniority_score: { type: 'number', description: '1–5 integer' },
        urgency: { type: 'string', description: 'high | medium | low' },
        pipeline_stage: { type: 'string' },
        classification_confidence: { type: 'number', description: '0.0–1.0' },
      },
      required: ['email', 'name', 'service_intent', 'message', 'seniority_score', 'urgency', 'pipeline_stage', 'classification_confidence'],
    },
  },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

function buildRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register('read_crm_records', async (input) => {
    const leads = await getLeads({
      stage: input.pipeline_stage as PipelineStage | undefined,
      intent: input.service_intent as ServiceIntent | undefined,
      limit: (input.limit as number | undefined) ?? 50,
    });
    return { count: leads.length, leads };
  });

  registry.register('update_lead_stage', async (input) => {
    await updateLeadStage(input.id as string, input.pipeline_stage as PipelineStage);
    return { success: true, id: input.id, new_stage: input.pipeline_stage };
  });

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
      pipeline_stage: (input.pipeline_stage as PipelineStage) ?? 'new_lead',
      classification_confidence: input.classification_confidence as number,
    });
    return { success: true, lead_id: lead.id };
  });

  return registry;
}

// ─── Agent entry point ───────────────────────────────────────────────────────

export async function runArchivist(task: string): Promise<AgentResult> {
  const client = getAnthropicClient();
  const registry = buildRegistry();

  try {
    const result = await runAgentLoop({
      client,
      model: MODELS.haiku,
      system: ARCHIVIST_SYSTEM_PROMPT,
      tools: ARCHIVIST_TOOLS,
      initialMessages: [{ role: 'user', content: task }],
      executeToolCall: registry.execute,
      maxRounds: 8,
      maxTokens: 2048,
    });

    return { success: true, output: result.output };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Archivist] Error:', error);
    return { success: false, output: '', error };
  }
}
