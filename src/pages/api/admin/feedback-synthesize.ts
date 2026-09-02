import type { APIRoute } from 'astro';
import { db } from '../../../lib/admin/supabase';
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
    .from('feedback')
    .select('landed, pacing, learners(name)')
    .eq('week', week);

  if (error || !data || data.length === 0) {
    return new Response(JSON.stringify({ error: 'No feedback found for this week' }), { status: 404 });
  }

  // @ts-ignore
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.ANTHROPIC_API_KEY : undefined) ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  
  const feedbackList = data.map(f => {
    const name = (f.learners as any)?.name ?? 'Anonymous';
    return `Learner: ${name}\nWhat landed well: ${f.landed}\nWhat was too fast/slow: ${f.pacing}`;
  }).join('\n\n---\n\n');

  const prompt = `You are helping an instructor synthesize post-session feedback from an advanced technical cohort.
Here is the feedback from ${data.length} learners for week ${week}:

${feedbackList}

Your task is to synthesize this feedback into a concise, actionable summary of "What to change before Thursday".
Do not invent or assume things not in the feedback.
Format your output as markdown. Focus on:
1. Where the room is confused.
2. What landed well and should be reinforced.
3. Specific pacing adjustments needed.`;

  try {
    const response = await anthropic.messages.create({
      model: SUMMARY_MODEL,
      max_tokens: 400,
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
    console.error('Feedback synthesis failed:', err);
    return new Response(JSON.stringify({ error: 'Synthesis failed' }), { status: 500 });
  }
};
