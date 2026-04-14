import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { getAnthropicClient, MODELS } from '../lib/anthropic-client.js';
import { ToolRegistry } from '../lib/tool-executor.js';
import { MARKETER_SYSTEM_PROMPT } from '../lib/prompts/marketer.js';
import {
  getLeads,
  getTargetAccounts,
  updateLeadFitScore,
  createOutreachDraft,
} from '../lib/db-client.js';
import { orchCreateTask, runAgentWithAccounting } from '../lib/orchestrator.js';
import type { AgentResult, TaskPriority, TaskCategory } from '../lib/types.js';

const MARKETER_TOOLS: Tool[] = [
  {
    name: 'read_crm_records',
    description: 'Query leads from the CRM. Returns an array of lead objects with seniority, urgency, and stage.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pipeline_stage: { type: 'string' },
        service_intent: { type: 'string' },
        limit: { type: 'number', description: 'Default 100' },
      },
    },
  },
  {
    name: 'update_lead_fit_score',
    description: 'Write a 0-100 fit score to a lead, reflecting their priority for personal follow-up this week.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' },
        score: { type: 'number', description: '0-100 integer' },
      },
      required: ['id', 'score'],
    },
  },
  {
    name: 'get_target_accounts',
    description: 'Read the owner\'s target account watchlist for signal-based outreach.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'create_outreach_draft',
    description: 'Save a drafted cold outreach note. ALWAYS status ready_for_review. Never sends.',
    input_schema: {
      type: 'object' as const,
      properties: {
        target_account_id: { type: 'string', description: 'Optional — link to target_accounts row' },
        lead_id: { type: 'string', description: 'Optional — link to an existing lead' },
        channel: { type: 'string', description: 'email | linkedin' },
        signal_context: { type: 'string', description: 'The trigger event this draft references' },
        draft_subject: { type: 'string' },
        draft_body: { type: 'string' },
      },
      required: ['channel', 'signal_context', 'draft_body'],
    },
  },
  {
    name: 'create_task',
    description: 'Emit a task to the owner\'s shared queue. Use for both warm follow-ups and cold outreach reviews.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', description: 'lead_followup | outreach' },
        priority: { type: 'number', description: '1-5 (see priority rubric in system prompt)' },
        related_lead_id: { type: 'string' },
        related_url: { type: 'string' },
      },
      required: ['title', 'category', 'priority'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for recent signals (news, announcements, LinkedIn posts, funding events).',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
];

function buildRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register('read_crm_records', async (input) => {
    const leads = await getLeads({ limit: (input.limit as number | undefined) ?? 100 });
    return { count: leads.length, leads };
  });

  registry.register('update_lead_fit_score', async (input) => {
    await updateLeadFitScore(input.id as string, input.score as number);
    return { success: true };
  });

  registry.register('get_target_accounts', async () => {
    const accounts = await getTargetAccounts(100);
    return { count: accounts.length, accounts };
  });

  registry.register('create_outreach_draft', async (input) => {
    const draft = await createOutreachDraft({
      lead_id: input.lead_id as string | undefined,
      target_account_id: input.target_account_id as string | undefined,
      channel: input.channel as 'email' | 'linkedin',
      signal_context: input.signal_context as string,
      draft_subject: input.draft_subject as string | undefined,
      draft_body: input.draft_body as string,
    });
    return { success: true, draft_id: draft.id };
  });

  registry.register('create_task', async (input) => {
    const task = await orchCreateTask({
      title: input.title as string,
      description: input.description as string | undefined,
      category: input.category as TaskCategory,
      priority: input.priority as TaskPriority,
      created_by: 'marketer',
      related_lead_id: input.related_lead_id as string | undefined,
      related_url: input.related_url as string | undefined,
    });
    return { success: true, task_id: task?.id ?? null };
  });

  registry.register('web_search', async (input) => {
    // Placeholder — Anthropic server-side web_search tool supersedes this.
    // Returning an empty result makes the agent rely on its own classification
    // of existing leads when web search isn't yet plumbed.
    return { query: input.query, results: [], note: 'Web search not yet plumbed in this run' };
  });

  return registry;
}

export async function runMarketer(task?: string): Promise<AgentResult> {
  const client = getAnthropicClient();
  const registry = buildRegistry();
  const prompt = task ?? 'Run your weekly review. Rank the top-5 warm leads and draft up to 5 signal-based outreach notes.';

  try {
    const result = await runAgentWithAccounting({
      client,
      agentName: 'marketer',
      model: MODELS.opus,
      system: MARKETER_SYSTEM_PROMPT,
      tools: MARKETER_TOOLS,
      initialMessages: [{ role: 'user', content: prompt }],
      executeToolCall: registry.execute,
      maxRounds: 20,
      maxTokens: 4096,
    });
    return { success: true, output: result.output };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Marketer] Error:', error);
    return { success: false, output: '', error };
  }
}
