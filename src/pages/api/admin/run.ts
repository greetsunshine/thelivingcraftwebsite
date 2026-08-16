// "Run the agent now" — dispatches a GitHub Action.
//
// The research does NOT happen here, and cannot. A sweep is minutes of
// web-searching Opus calls, well past a Vercel function's timeout, and its
// output has to land as a commit that a function has no way to produce. The
// workflows already do both, so this endpoint's whole job is to press their
// button and get out of the way.
//
// Worth being aware of what this button spends: several Opus calls with web
// search, against the same Anthropic key the live site assistant uses. Four
// rapid runs emptied the credit balance once and took the visitor agent down
// with it. The scripts carry a 6-hour cooldown that a manual dispatch
// deliberately overrides — because the button doing nothing silently is worse
// — so the console is the one place where the guard is a human decision.

import type { APIRoute } from 'astro';
import { dispatchWorkflow, ghConfigured } from '../../../lib/admin/github';
import { CATEGORY_KEYS } from '../../../data/radar-categories';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const WORKFLOWS = {
  latest: 'gather-latest.yml',
  radar: 'gather-radar.yml',
} as const;

export const POST: APIRoute = async ({ request }) => {
  if (!ghConfigured()) {
    return json({ error: 'GitHub is not connected. Set GITHUB_TOKEN and GITHUB_REPO.' }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }

  const agent = String(body.agent ?? '') as keyof typeof WORKFLOWS;
  const workflow = WORKFLOWS[agent];
  if (!workflow) return json({ error: 'Unknown agent.' }, 400);

  const inputs: Record<string, string> = {};

  // Only the radar takes a category, and only a known one — this string is
  // interpolated into a shell command inside the workflow.
  if (agent === 'radar') {
    const category = String(body.category ?? '');
    if (category) {
      if (!CATEGORY_KEYS.includes(category)) return json({ error: 'Unknown category.' }, 400);
      inputs.category = category;
    }
  }

  try {
    await dispatchWorkflow(workflow, inputs);
    return json({
      ok: true,
      url: `https://github.com/${(import.meta.env.GITHUB_REPO ?? process.env.GITHUB_REPO ?? '').trim()}/actions/workflows/${workflow}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start the workflow.';
    console.error('run dispatch failed:', message);
    return json({ error: message }, 502);
  }
};
