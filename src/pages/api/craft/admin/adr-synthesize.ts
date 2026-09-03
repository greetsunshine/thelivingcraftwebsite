import type { APIRoute } from 'astro';
import { db } from '../../../../lib/admin/supabase';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

// Reads eight ADRs or eight feedback rows and summarises them — spec §4, one of
// the four things a model is allowed to do here. POST, not GET: this spends
// money per call, and a browser prefetch or a refresh must not bill.
const SUMMARY_MODEL = 'claude-haiku-4-5-20251001';

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
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const block = response.content[0];
    if (block && block.type === 'text') {
      return new Response(JSON.stringify({ summary: block.text }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to generate summary' }), { status: 500 });
  } catch (err) {
    console.error('ADR synthesis failed:', err);
    return new Response(JSON.stringify({ error: 'Synthesis failed' }), { status: 500 });
  }
};
