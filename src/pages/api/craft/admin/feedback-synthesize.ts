// What to change before Thursday.
//
// The sibling of adr-synthesize.ts, and everything they had in common now
// lives in src/lib/admin/synthesis.ts — including the fencing that stops a
// line typed into the feedback form from acting as an instruction to the model.

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/admin/supabase';
import { synthesise } from '../../../../lib/admin/synthesis';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const TASK = [
  'Summarise this into a concise, actionable answer to "what to change before Thursday",',
  'as markdown, under three headings:',
  '1. Where the room is confused.',
  '2. What landed well and should be reinforced.',
  '3. Specific pacing adjustments needed.',
  '',
  'Do not invent or assume anything that is not in the feedback.',
].join('\n');

export const POST: APIRoute = async ({ request }) => {
  let week: number;
  try {
    week = Number((await request.json()).week);
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  if (!Number.isInteger(week) || week < 1 || week > 6) {
    return json({ error: 'Invalid week' }, 400);
  }

  const client = db();
  if (!client) return json({ error: 'DB connection failed' }, 500);

  const { data, error } = await client
    .from('feedback')
    .select('landed, pacing, learners(name)')
    .eq('week', week);

  if (error || !data || data.length === 0) {
    return json({ error: 'No feedback found for this week' }, 404);
  }

  const result = await synthesise(
    'feedback responses',
    week,
    data.map((f: any) => ({
      name: f.learners?.name ?? 'Anonymous',
      fields: { 'What landed well': f.landed, 'What was too fast or too slow': f.pacing },
    })),
    TASK,
  );

  if (!result.ok) return json({ error: result.error }, result.status);

  return json(
    result.truncated
      ? {
          summary: result.summary,
          truncated: true,
          error: 'This summary was cut off before it finished. Re-run it, or read the feedback directly.',
        }
      : { summary: result.summary },
    200,
  );
};
