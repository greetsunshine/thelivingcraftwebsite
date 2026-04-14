/**
 * Orchestrator — shared utilities every agent imports.
 *
 * This is a MODULE, not an agent. No Claude calls happen here.
 * Responsibilities:
 *   - createTask(): unified task creation with dedup + routing of P1-2 to Slack
 *   - notifyOwner(): single path for Slack + email notifications
 *   - withCostGuard(): enforces monthly Anthropic budget before agent runs
 *   - withIdempotency(): cron reruns become no-ops via dedup keys
 *   - runAgentWithAccounting(): wraps runAgentLoop with cost recording
 */

import type Anthropic from '@anthropic-ai/sdk';
import type { Tool, MessageParam } from '@anthropic-ai/sdk/resources/messages.js';
import { runAgentLoop } from './agent-loop.js';
import { createTask, type CreateTaskInput } from './db-client.js';
import { slackNotify, emailNotify } from './notifiers.js';
import {
  assertWithinBudget,
  recordAgentCost,
  BudgetExceededError,
} from './cost-tracker.js';
import type { Task } from './types.js';

// ─── Tasks ───────────────────────────────────────────────────────────────────

/**
 * Create a task in the shared queue. P1 and P2 tasks also ping Slack.
 * If a dedup_key is supplied and already exists, returns null (no-op).
 */
export async function orchCreateTask(input: CreateTaskInput): Promise<Task | null> {
  const task = await createTask(input);
  if (!task) return null; // dedup hit

  if (task.priority <= 2) {
    const prefix = task.priority === 1 ? 'URGENT' : 'TODAY';
    await slackNotify(
      `${prefix}: ${task.title}${task.related_url ? ` — ${task.related_url}` : ''}`,
      task.priority
    );
  }
  return task;
}

// ─── Owner notifications ─────────────────────────────────────────────────────

export async function notifyOwner(opts: {
  channel: 'slack' | 'email' | 'both';
  priority?: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  htmlBody?: string;
}): Promise<void> {
  const priority = opts.priority ?? 3;
  const ownerEmail = process.env.OWNER_EMAIL ?? 'the-founder@thelivingcraft.ai';

  if (opts.channel === 'slack' || opts.channel === 'both') {
    await slackNotify(`*${opts.title}*\n${opts.body}`, priority);
  }
  if (opts.channel === 'email' || opts.channel === 'both') {
    await emailNotify({
      to: ownerEmail,
      subject: opts.title,
      html: opts.htmlBody ?? `<pre style="font-family:system-ui">${escapeHtml(opts.body)}</pre>`,
      text: opts.body,
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Idempotency wrapper ─────────────────────────────────────────────────────

/**
 * In-memory per-process idempotency cache. Good enough for Netlify functions
 * where a single invocation is short-lived; dedup_key on tasks provides the
 * cross-invocation guarantee that matters most.
 */
const recentKeys = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T | null> {
  const now = Date.now();
  for (const [k, ts] of recentKeys) {
    if (now - ts > IDEMPOTENCY_TTL_MS) recentKeys.delete(k);
  }
  if (recentKeys.has(key)) {
    console.log(`[withIdempotency] Skipped (recent): ${key}`);
    return null;
  }
  recentKeys.set(key, now);
  return fn();
}

// ─── Cost guard ──────────────────────────────────────────────────────────────

export async function withCostGuard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    await assertWithinBudget();
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      await slackNotify(
        `Monthly Anthropic budget hit: $${err.spent.toFixed(2)} / $${err.limit.toFixed(2)} — agent runs paused`,
        1
      );
    }
    throw err;
  }
  return fn();
}

// ─── Agent run wrapper with cost recording ───────────────────────────────────

export interface RunAgentWithAccountingOpts {
  client: Anthropic;
  agentName: string;
  model: string;
  system: string;
  tools: Tool[];
  initialMessages: MessageParam[];
  executeToolCall: (name: string, input: Record<string, unknown>) => Promise<unknown>;
  maxRounds?: number;
  maxTokens?: number;
  runId?: string;
}

/**
 * Wraps runAgentLoop with:
 *   1. Budget check up-front (throws BudgetExceededError if over ceiling).
 *   2. Token accounting afterward (writes to agent_costs table).
 *
 * Note: runAgentLoop doesn't yet return token usage — until that's plumbed
 * through, we approximate cost from response lengths. A follow-up PR should
 * surface usage from Anthropic response metadata.
 */
export async function runAgentWithAccounting(opts: RunAgentWithAccountingOpts) {
  await assertWithinBudget();

  const result = await runAgentLoop({
    client: opts.client,
    model: opts.model,
    system: opts.system,
    tools: opts.tools,
    initialMessages: opts.initialMessages,
    executeToolCall: opts.executeToolCall,
    maxRounds: opts.maxRounds,
    maxTokens: opts.maxTokens,
  });

  // Rough approximation: system prompt + each round of tool_use + output text.
  // Underestimates but keeps us honest until real usage plumbing lands.
  const approxInputTokens = Math.ceil(
    (opts.system.length + opts.initialMessages.map(m => JSON.stringify(m.content)).join('').length) / 4
  ) + result.rounds * 500;
  const approxOutputTokens = Math.ceil(result.output.length / 4) + result.rounds * 300;

  await recordAgentCost({
    agent: opts.agentName,
    model: opts.model,
    inputTokens: approxInputTokens,
    outputTokens: approxOutputTokens,
    runId: opts.runId,
  });

  return result;
}

// ─── Priority rubric (exported so agents can reference in prompts) ───────────

export const PRIORITY_RUBRIC = `
Priority levels (use these consistently when creating tasks):
1 — DROP EVERYTHING: high-urgency qualified lead, cancellation that needs a save
2 — TODAY: inbound from senior leader, discovery call tomorrow needing prep
3 — THIS WEEK: content topic approval, warm-lead follow-up
4 — NEXT WEEK: outreach drafts, learning articles
5 — WHENEVER: low-priority cleanup, exploratory reading
`.trim();
