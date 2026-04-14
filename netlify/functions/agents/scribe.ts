import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { getAnthropicClient, MODELS } from '../lib/anthropic-client.js';
import { ToolRegistry } from '../lib/tool-executor.js';
import { SCRIBE_TREND_SCAN_PROMPT } from '../lib/prompts/scribe.js';
import { createProposedTopic } from '../lib/db-client.js';
import { orchCreateTask, runAgentWithAccounting } from '../lib/orchestrator.js';
import type { AgentResult, TaskPriority, TaskCategory } from '../lib/types.js';

const SCRIBE_TOOLS: Tool[] = [
  {
    name: 'create_proposed_topic',
    description: 'Save a ranked topic proposal to content_calendar with status "proposed".',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic:   { type: 'string' },
        angle:   { type: 'string' },
        format:  { type: 'string', description: 'blog | linkedin | newsletter' },
        scheduled_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        heat_score: { type: 'number', description: '0.0 - 1.0' },
        enterprise_relevance_score: { type: 'number', description: '0.0 - 1.0' },
        sources: {
          type: 'array',
          description: 'Array of {url, title, published_date}',
          items: { type: 'object' },
        },
      },
      required: ['topic', 'format', 'scheduled_date', 'heat_score', 'enterprise_relevance_score'],
    },
  },
  {
    name: 'create_task',
    description: 'Emit a task to the owner\'s shared queue. Use for the "approve topics" summary task.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:    { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', description: 'content_review | learning' },
        priority: { type: 'number', description: '1-5' },
        related_url: { type: 'string' },
      },
      required: ['title', 'category', 'priority'],
    },
  },
  // Anthropic server-side web search — executed by the API, results returned
  // inline as web_search_tool_result blocks. No local handler needed.
  {
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 5,
  } as unknown as Tool,
];

function buildRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register('create_proposed_topic', async (input) => {
    const id = await createProposedTopic({
      topic: input.topic as string,
      angle: input.angle as string | undefined,
      format: input.format as 'blog' | 'linkedin' | 'newsletter',
      scheduled_date: new Date(input.scheduled_date as string),
      heat_score: input.heat_score as number,
      enterprise_relevance_score: input.enterprise_relevance_score as number,
      sources: input.sources,
    });
    return { success: true, topic_id: id };
  });

  registry.register('create_task', async (input) => {
    const task = await orchCreateTask({
      title: input.title as string,
      description: input.description as string | undefined,
      category: input.category as TaskCategory,
      priority: input.priority as TaskPriority,
      created_by: 'scribe',
      related_url: (input.related_url as string | undefined) ?? '/admin/content/',
    });
    return { success: true, task_id: task?.id ?? null };
  });

  // web_search is handled server-side by Anthropic — no local handler.

  return registry;
}

export async function runScribeTrendScan(): Promise<AgentResult> {
  const client = getAnthropicClient();
  const registry = buildRegistry();

  try {
    const result = await runAgentWithAccounting({
      client,
      agentName: 'scribe',
      model: MODELS.sonnet,
      system: SCRIBE_TREND_SCAN_PROMPT,
      tools: SCRIBE_TOOLS,
      initialMessages: [
        {
          role: 'user',
          content:
            'Run your weekly trend scan. Identify 5-10 enterprise-relevant Agentic AI topics worth writing about this week. Prioritize enterprise relevance over arXiv novelty.',
        },
      ],
      executeToolCall: registry.execute,
      maxRounds: 20,
      maxTokens: 4096,
    });
    return { success: true, output: result.output };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Scribe] Error:', error);
    return { success: false, output: '', error };
  }
}
