import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { getAnthropicClient, MODELS } from '../lib/anthropic-client.js';
import { ToolRegistry } from '../lib/tool-executor.js';
import {
  SCRIBE_TREND_SCAN_PROMPT,
  SCRIBE_DRAFT_PROMPT,
  SCRIBE_INTELLIGENCE_PROMPT,
} from '../lib/prompts/scribe.js';
import {
  createProposedTopic,
  getApprovedTopicsToDraft,
  saveContentDraft,
  markCalendarDrafted,
  createReadingItem,
} from '../lib/db-client.js';
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

// ─── Phase 0 — Intelligence Scan (Sunday night) ──────────────────────────────

const SCRIBE_INTELLIGENCE_TOOLS: Tool[] = [
  {
    name: 'create_reading_item',
    description: 'Save a curated article to the reading list. De-dupes on URL — safe to call on duplicates.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:           { type: 'string' },
        url:             { type: 'string', description: 'Real URL from web_search — never fabricate' },
        source:          { type: 'string', description: 'Publisher / site name e.g. "Anthropic", "arXiv", "Gartner"' },
        author:          { type: 'string' },
        published_date:  { type: 'string', description: 'YYYY-MM-DD if known' },
        category:        { type: 'string', description: 'technical | business' },
        subcategory:     { type: 'string', description: 'See prompt for allowed values' },
        why_it_matters:  { type: 'string', description: '1-2 sentence "so what" for Sunil — this is the whole product' },
        relevance_score: { type: 'number', description: '0.0-1.0, how much Sunil should care' },
      },
      required: ['title', 'url', 'category', 'why_it_matters', 'relevance_score'],
    },
  },
  // Anthropic server-side web search
  {
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 10,
  } as unknown as Tool,
];

function buildIntelligenceRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register('create_reading_item', async (input) => {
    const id = await createReadingItem({
      title: input.title as string,
      url: input.url as string,
      source: input.source as string | undefined,
      author: input.author as string | undefined,
      published_date: input.published_date as string | undefined,
      category: input.category as 'technical' | 'business',
      subcategory: input.subcategory as string | undefined,
      why_it_matters: input.why_it_matters as string,
      relevance_score: input.relevance_score as number,
    });
    return { success: true, id, deduped: id === null };
  });

  return registry;
}

export async function runScribeIntelligence(): Promise<AgentResult> {
  const client = getAnthropicClient();
  const registry = buildIntelligenceRegistry();

  try {
    const result = await runAgentWithAccounting({
      client,
      agentName: 'scribe-intelligence',
      model: MODELS.sonnet,
      system: SCRIBE_INTELLIGENCE_PROMPT,
      tools: SCRIBE_INTELLIGENCE_TOOLS,
      initialMessages: [
        {
          role: 'user',
          content:
            'Run your Sunday-night intelligence scan. Find 5-8 technical frontier articles and 3-5 business context articles from the last 14 days. Use web_search across multiple subcategories. Save each via create_reading_item with a sharp why_it_matters.',
        },
      ],
      executeToolCall: registry.execute,
      maxRounds: 30,
      maxTokens: 4096,
    });
    return { success: true, output: result.output };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Scribe Intelligence] Error:', error);
    return { success: false, output: '', error };
  }
}

// ─── Phase 2 — Drafting ──────────────────────────────────────────────────────

const SCRIBE_DRAFT_TOOLS: Tool[] = [
  {
    name: 'get_approved_topics',
    description: 'Load owner-approved topics from content_calendar that are ready to draft (status=planned).',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'save_content_draft',
    description: 'Save a draft to content_drafts with status ready_for_review. Call once per format per topic.',
    input_schema: {
      type: 'object' as const,
      properties: {
        calendar_id: { type: 'string', description: 'content_calendar row id from get_approved_topics' },
        format: { type: 'string', description: 'blog | linkedin | newsletter' },
        topic: { type: 'string', description: 'Same topic text as in content_calendar' },
        body: { type: 'string', description: 'Full draft body — markdown for blog, plain text for linkedin' },
      },
      required: ['calendar_id', 'format', 'topic', 'body'],
    },
  },
  {
    name: 'mark_drafted',
    description: 'Mark a content_calendar entry as drafted and link it to a draft_id. Call once per topic after all its formats are saved.',
    input_schema: {
      type: 'object' as const,
      properties: {
        calendar_id: { type: 'string' },
        draft_id: { type: 'string', description: 'Any draft id from that topic (usually the blog draft id)' },
      },
      required: ['calendar_id', 'draft_id'],
    },
  },
  {
    name: 'create_task',
    description: 'Emit a task to the owner\'s shared queue. Use for the "review drafts" summary task at the end.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', description: 'content_review' },
        priority: { type: 'number', description: '1-5' },
        related_url: { type: 'string' },
      },
      required: ['title', 'category', 'priority'],
    },
  },
];

function buildDraftRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register('get_approved_topics', async () => {
    const topics = await getApprovedTopicsToDraft(5);
    return { count: topics.length, topics };
  });

  registry.register('save_content_draft', async (input) => {
    const id = await saveContentDraft({
      calendar_id: input.calendar_id as string,
      format: input.format as 'blog' | 'linkedin' | 'newsletter',
      topic: input.topic as string,
      body: input.body as string,
    });
    return { success: true, draft_id: id };
  });

  registry.register('mark_drafted', async (input) => {
    await markCalendarDrafted(input.calendar_id as string, input.draft_id as string);
    return { success: true };
  });

  registry.register('create_task', async (input) => {
    const task = await orchCreateTask({
      title: input.title as string,
      description: input.description as string | undefined,
      category: input.category as TaskCategory,
      priority: input.priority as TaskPriority,
      created_by: 'scribe',
      related_url: (input.related_url as string | undefined) ?? '/admin/workspace/#tasks',
    });
    return { success: true, task_id: task?.id ?? null };
  });

  return registry;
}

export async function runScribeDraft(): Promise<AgentResult> {
  const client = getAnthropicClient();
  const registry = buildDraftRegistry();

  // Short-circuit: if nothing is approved, skip the agent call entirely
  const topics = await getApprovedTopicsToDraft(5);
  if (topics.length === 0) {
    console.log('[Scribe Phase 2] No approved topics to draft — skipping');
    return { success: true, output: 'No approved topics ready for drafting.' };
  }

  try {
    const result = await runAgentWithAccounting({
      client,
      agentName: 'scribe-draft',
      model: MODELS.sonnet,
      system: SCRIBE_DRAFT_PROMPT,
      tools: SCRIBE_DRAFT_TOOLS,
      initialMessages: [
        {
          role: 'user',
          content: `Draft content for ${topics.length} approved topic(s). Load them via get_approved_topics, produce blog + linkedin for each, save via save_content_draft, mark_drafted when done, then emit the review task.`,
        },
      ],
      executeToolCall: registry.execute,
      maxRounds: 30,
      maxTokens: 8192,
    });
    return { success: true, output: result.output };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[Scribe Phase 2] Error:', error);
    return { success: false, output: '', error };
  }
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
