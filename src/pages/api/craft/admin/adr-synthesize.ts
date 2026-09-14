// Where the room converged, split, and said nothing at all.
//
// POST, not GET: this spends money per call, and a browser prefetch or a
// refresh must not bill. Everything else — the model, the ceiling, the
// truncation check, and the fencing that keeps a learner's ADR from giving the
// model instructions — is in src/lib/admin/synthesis.ts, shared with the
// feedback endpoint next door.

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/admin/supabase';
import { synthesise } from '../../../../lib/admin/synthesis';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const TASK = [
  'Summarise these into a concise room summary, as markdown, under three headings:',
  '1. Where the room converged (patterns or decisions most people chose).',
  '2. Where the room split (differing approaches or major disagreements).',
  '3. What nobody mentioned (blind spots or trade-offs that were ignored).',
  '',
  'Do not evaluate or grade the learners. Do not invent anything that is not in the submissions.',
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
    .from('submissions')
    .select('adr_markdown, learners(name)')
    .eq('week', week);

  if (error || !data || data.length === 0) {
    return json({ error: 'No ADRs found for this week' }, 404);
  }

  const result = await synthesise(
    'decision records',
    week,
    data.map((s: any) => ({
      name: s.learners?.name ?? 'Anonymous',
      fields: { ADR: s.adr_markdown },
    })),
    TASK,
  );

  if (!result.ok) return json({ error: result.error }, result.status);

  return json(
    result.truncated
      ? {
          summary: result.summary,
          truncated: true,
          error: 'This summary was cut off before it finished. Re-run it, or read the ADRs directly.',
        }
      : { summary: result.summary },
    200,
  );
};
