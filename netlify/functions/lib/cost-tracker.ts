/**
 * Cost tracker — enforces the $20/month Anthropic spending ceiling.
 *
 * Prices in USD per million tokens (as of 2026 Q1 — update if they change).
 * Source: https://docs.anthropic.com/pricing
 */

import { neon } from '@neondatabase/serverless';

export const MONTHLY_BUDGET_USD = Number(process.env.ANTHROPIC_MONTHLY_BUDGET_USD ?? 20);

const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':          { input: 15,   output: 75 },
  'claude-sonnet-4-6':        { input: 3,    output: 15 },
  'claude-haiku-4-5-20251001':{ input: 0.80, output: 4  },
};

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL must be set');
  return neon(url);
}

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const p = PRICING[model] ?? PRICING['claude-sonnet-4-6'];
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

export async function recordAgentCost(opts: {
  agent: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  runId?: string;
}): Promise<number> {
  const sql = getSql();
  const cost = estimateCostUsd(opts.model, opts.inputTokens, opts.outputTokens);
  await sql`
    INSERT INTO agent_costs (agent_name, model, input_tokens, output_tokens, cost_usd, run_id)
    VALUES (${opts.agent}, ${opts.model}, ${opts.inputTokens}, ${opts.outputTokens},
            ${cost}, ${opts.runId ?? null})
  `;
  return cost;
}

export async function getMonthlySpendUsd(): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    SELECT COALESCE(SUM(cost_usd), 0)::float AS total
    FROM agent_costs
    WHERE created_at >= date_trunc('month', NOW())
  `;
  return rows[0].total as number;
}

/**
 * Throws BudgetExceededError if the current month's spend has reached the ceiling.
 * Call this before launching an agent loop.
 */
export class BudgetExceededError extends Error {
  constructor(public readonly spent: number, public readonly limit: number) {
    super(`Monthly Anthropic budget exceeded: $${spent.toFixed(2)} / $${limit.toFixed(2)}`);
    this.name = 'BudgetExceededError';
  }
}

export async function assertWithinBudget(): Promise<void> {
  const spent = await getMonthlySpendUsd();
  if (spent >= MONTHLY_BUDGET_USD) {
    throw new BudgetExceededError(spent, MONTHLY_BUDGET_USD);
  }
}
