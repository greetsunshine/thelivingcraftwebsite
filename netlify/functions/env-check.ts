/**
 * Debug-only: reports which env vars the deployed functions can see.
 * Returns booleans (present / absent) — no secret values ever exposed.
 *
 * Hit: GET https://thelivingcraft.ai/.netlify/functions/env-check
 * Remove once diagnosis is done.
 */

import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const keys = [
    'ANTHROPIC_API_KEY',
    'DATABASE_URL',
    'RESEND_API_KEY',
    'SLACK_WEBHOOK_URL',
    'CAL_WEBHOOK_SECRET',
    'OWNER_EMAIL',
    'ANTHROPIC_MONTHLY_BUDGET_USD',
    'ADMIN_SECRET_TOKEN',
  ];

  const report: Record<string, { present: boolean; length: number; preview: string }> = {};
  for (const k of keys) {
    const v = process.env[k];
    report[k] = {
      present: Boolean(v),
      length: v?.length ?? 0,
      preview: v ? `${v.slice(0, 3)}…${v.slice(-2)}` : '',
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ env: report, node: process.version, timestamp: new Date().toISOString() }, null, 2),
  };
};
