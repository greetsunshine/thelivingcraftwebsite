import type { APIRoute } from 'astro';
import { db } from '../../../../lib/admin/supabase';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

// Reads eight ADRs or eight feedback rows and summarises them — spec §4, one of
// the four things a model is allowed to do here. POST, not GET: this spends
// money per call, and a browser prefetch or a refresh must not bill.
const SUMMARY_MODEL = 'claude-haiku-4-5-20251001';

// Was 500, which is not enough for three headings over eight ADRs — the summary
// ran out mid-sentence, and because nothing checked stop_reason it was returned
// as though it were finished. A truncated synthesis is worse than none: the
// third heading is "what nobody mentioned", so the section most likely to be
// cut is the one carrying the blind spots this endpoint exists to surface.
//
// Haiku output is cheap enough that this ceiling should never be the binding
// constraint. If it is ever hit again, the check below says so out loud.
const MAX_SUMMARY_TOKENS = 2000;

export const POST: APIRoute = async ({ request }) => {
  let week: number;
  try {
    week = Number((await request.json()).week);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
  if (!Number.isInteger(week) || week < 1 || week > 6) {
    return new Response(JSON.stringify({ error: 'Invalid week' }), { status: 400 });
  }

  const client = db();
  if (!client) {
    return new Response(JSON.stringify({ error: 'DB connection failed' }), { status: 500 });
  }

  const { data, error } = await client
    .from('submissions')
    .select('adr_markdown, learners(name)')
    .eq('week', week);

  if (error || !data || data.length === 0) {
    return new Response(JSON.stringify({ error: 'No ADRs found for this week' }), { status: 404 });
  }

  // @ts-ignore
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.ANTHROPIC_API_KEY : undefined) ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  
  const adrList = data.map(s => {
    const name = (s.learners as any)?.name ?? 'Anonymous';
    return `Learner: ${name}\nADR:\n${s.adr_markdown}`;
  }).join('\n\n---\n\n');

  const prompt = `You are helping an instructor synthesize the architecture decision records (ADRs) submitted by an advanced technical cohort.
Here are the ADRs from ${data.length} learners for week ${week}:

${adrList}

Your task is to synthesize these ADRs into a concise room summary. 
Format your output as markdown. Focus on:
1. Where the room converged (patterns or decisions most people chose).
2. Where the room split (differing approaches or major disagreements).
3. What nobody mentioned (blind spots, missing considerations, or trade-offs that were ignored).

Do not evaluate or grade the learners.`;

  try {
    const response = await anthropic.messages.create({
      model: SUMMARY_MODEL,
      max_tokens: MAX_SUMMARY_TOKENS,
      messages: [{ role: 'user', content: prompt }]
    });

    if (response.stop_reason === 'refusal') {
      return new Response(JSON.stringify({ error: 'The model declined to summarise these.' }), { status: 502 });
    }

    // Take every text block, not just the first. One block is the usual shape
    // and not a guarantee, and reading content[0] alone silently drops the rest.
    const summary = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    if (!summary) {
      return new Response(JSON.stringify({ error: 'Failed to generate summary' }), { status: 500 });
    }

    // Truncation is not a summary that is merely short — it stops mid-sentence,
    // and it looks exactly like a finished one to whoever reads the panel. Say
    // so rather than presenting a cut-off room summary as the room's position.
    if (response.stop_reason === 'max_tokens') {
      console.error(
        `ADR synthesis for week ${week} hit max_tokens (${MAX_SUMMARY_TOKENS}) over ` +
          `${data.length} ADRs — the summary is cut off. Raise MAX_SUMMARY_TOKENS.`,
      );
      return new Response(
        JSON.stringify({
          summary,
          truncated: true,
          error: 'This summary was cut off before it finished. Re-run it, or read the ADRs directly.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('ADR synthesis failed:', err);
    return new Response(JSON.stringify({ error: 'Synthesis failed' }), { status: 500 });
  }
};
