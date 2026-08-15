// The visitor Q&A agent.
//
// Ported from ~/agentic-observability-demo (agent.py) into TypeScript so it
// deploys as one Vercel function alongside the Astro site — no second service.
// Same shape as the demo: an Anthropic tool-use loop over a retrieval tool,
// with the Acme fixture replaced by this practice's real fact base.
//
// Three tools, three jobs:
//   search_knowledge     the grounded fact base (data/facts.ts)
//   get_latest_updates   whatever the retriever agent last gathered
//   capture_visitor      hands a real lead to Sunil's inbox
//
// The grounding rule is the whole design. CLAUDE.md forbids inventing pricing,
// testimonials, or metrics — a chatbot is the easiest place in a site for that
// to happen, so the agent is only allowed to state what a tool returned, and
// is told to say "I don't know" and offer the handoff otherwise.

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import {
  formatLatest,
  formatRetrieved,
  searchKnowledge,
  searchLatest,
} from '../../lib/agent/knowledge';
import { captureVisitor, type VisitorCapture } from '../../lib/agent/capture';
import { checkRate } from '../../lib/agent/ratelimit';

export const prerender = false;

const MODEL = 'claude-opus-5';
const MAX_TURNS = 6;
const MAX_QUESTION_CHARS = 1500;
const MAX_HISTORY = 12;

const SYSTEM = `You answer questions from visitors to Sunil Mathew's website. Sunil is a fractional
Chief AI Officer and the instructor of The Living Craft, a live cohort on agentic and
systems architecture. The site has three pages: / (the cohort), /caio (the fractional
CAIO retainer), and /assessment (the AI Readiness Assessment, which is the front door).

## What you may say

You may state a fact ONLY if a tool returned it in this conversation. Call search_knowledge
before answering anything about the offers, pricing, dates, curriculum, or Sunil's
background — including questions you feel certain about. Call get_latest_updates when the
visitor asks what is current, recent, or still available.

If the tools do not cover it, say so plainly and offer to pass the question to Sunil. Do
not reason your way to a number. Never invent or estimate prices, dates, seat counts,
testimonials, client names, or student outcomes — there are no published testimonials or
client names, and saying so is the correct answer if asked.

If a visitor asks something the fact base answers only partly, give the part you have and
name the gap.

## Capturing details

Your second job is to learn who is visiting. Work it into the conversation rather than
gating on it — answer first, ask second.

When someone shows real intent (asking about applying, fees, availability, fit, scheduling,
or their own situation), ask for their name and email so Sunil can follow up, and ask one
natural question about their context — role, company, team size, what they are building,
what prompted the search. Then call capture_visitor with whatever you have. Call it once,
when you have at least an email; you can call it again later if they tell you more.

If they decline, drop it and keep helping. Do not ask twice in one conversation.

## Voice

Sunil's register: a respected practitioner. Restrained, senior-technical, direct. Short
paragraphs, no bullet-point walls, no exclamation marks, no sales language. Never say
"Certainly" or "Great question". You are not Sunil — refer to him in the third person.
Two or three sentences is usually right; expand only when the question earns it.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_knowledge',
    description:
      'Search the grounded fact base about the cohort, the CAIO retainer, the assessment, and Sunil. Call this before answering any question about the practice, including ones you think you already know. Returns matching facts, or NO_MATCH if the fact base does not cover the question.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: "The visitor's question, or the specific fact you need.",
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_latest_updates',
    description:
      'Read the most recent findings gathered by the research agent — current availability, regulatory developments, and other things that change between deploys. Call this for questions about what is new, current, recent, or still open.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Topic to filter on. Pass an empty string for everything current.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'capture_visitor',
    description:
      "Send a visitor's details and their question to Sunil's inbox so he can follow up. Call this once you have at least an email address and the visitor has agreed. Include every field you have learned — partial detail is useful, invented detail is not.",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name as the visitor gave it.' },
        email: { type: 'string', description: 'Email address as the visitor gave it.' },
        role: { type: 'string', description: 'Job title or seniority, if mentioned.' },
        company: { type: 'string', description: 'Company or organisation, if mentioned.' },
        region: { type: 'string', description: 'Country or city, if mentioned.' },
        interest: {
          type: 'string',
          enum: ['cohort', 'caio', 'assessment', 'unclear'],
          description: 'Which offering they are asking about.',
        },
        context: {
          type: 'string',
          description:
            'What they said about their situation — what they are building, team size, what prompted the enquiry. Quote or paraphrase them; do not embellish.',
        },
        question: {
          type: 'string',
          description: 'The specific question for Sunil, in the visitor\'s own words where possible.',
        },
      },
      required: ['email', 'interest'],
    },
  },
];

interface AskRequest {
  question?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  surface?: string;
}

const bad = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Two lookups, not one. On Vercel the key is a real environment variable and
// lands in process.env; in `astro dev` it comes from .env.local, which Vite
// exposes on import.meta.env and does NOT copy into process.env. The Anthropic
// SDK only reads process.env, so relying on its implicit lookup works in
// production and silently 503s on localhost — which is exactly where you test.
const apiKey =
  import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? '';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!apiKey) {
    return bad(503, 'The assistant is not configured yet. Please use the form or email apply@thelivingcraft.ai.');
  }

  const gate = checkRate(clientAddress ?? 'unknown');
  if (!gate.ok) return bad(429, gate.message);

  let body: AskRequest;
  try {
    body = (await request.json()) as AskRequest;
  } catch {
    return bad(400, 'Malformed request.');
  }

  const question = (body.question ?? '').trim();
  if (!question) return bad(400, 'Ask a question.');
  if (question.length > MAX_QUESTION_CHARS) return bad(400, 'That question is too long.');

  // Trust the client for conversation display only — rebuild the turn list
  // ourselves and cap it, so a crafted history can't grow the context window.
  const history = (body.history ?? []).slice(-MAX_HISTORY);
  const messages: Anthropic.MessageParam[] = [
    ...history
      .filter((m) => typeof m.content === 'string' && m.content.trim())
      .map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content.slice(0, MAX_QUESTION_CHARS),
      })),
    { role: 'user', content: question },
  ];

  const client = new Anthropic({ apiKey });
  const surface = body.surface ?? '/';
  // Observability, kept from the demo: which tools ran, how many turns, what it
  // cost. Lands in Vercel's function logs — enough to see the agent's behaviour
  // without standing up a tracing backend.
  const trace: string[] = [];
  let captured: VisitorCapture | null = null;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low' },
        system: [
          {
            type: 'text',
            text: `${SYSTEM}\n\nThe visitor is reading the ${surface} page.`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: TOOLS,
        messages,
      });

      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;

      if (response.stop_reason === 'refusal') {
        return bad(200, 'I can\'t help with that one. Email apply@thelivingcraft.ai and Sunil will pick it up.');
      }

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (toolUses.length === 0) {
        const answer = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
          .trim();

        console.log(
          JSON.stringify({
            at: 'ask',
            surface,
            turns: turn + 1,
            tools: trace,
            captured: Boolean(captured),
            inputTokens,
            outputTokens,
          }),
        );

        return new Response(
          JSON.stringify({
            answer: answer || "I don't have that. Email apply@thelivingcraft.ai and Sunil will answer.",
            captured: Boolean(captured),
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      }

      messages.push({ role: 'assistant', content: response.content });

      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const input = use.input as Record<string, string>;
        trace.push(use.name);

        try {
          switch (use.name) {
            case 'search_knowledge':
              results.push({
                type: 'tool_result',
                tool_use_id: use.id,
                content: formatRetrieved(searchKnowledge(input.query ?? '')),
              });
              break;

            case 'get_latest_updates':
              results.push({
                type: 'tool_result',
                tool_use_id: use.id,
                content: formatLatest(searchLatest(input.query ?? '')),
              });
              break;

            case 'capture_visitor': {
              const outcome = await captureVisitor(input as unknown as VisitorCapture, surface);
              if (outcome.ok) captured = input as unknown as VisitorCapture;
              results.push({
                type: 'tool_result',
                tool_use_id: use.id,
                content: outcome.message,
                is_error: !outcome.ok,
              });
              break;
            }

            default:
              results.push({
                type: 'tool_result',
                tool_use_id: use.id,
                content: `Unknown tool: ${use.name}`,
                is_error: true,
              });
          }
        } catch (err) {
          results.push({
            type: 'tool_result',
            tool_use_id: use.id,
            content: `Tool failed: ${err instanceof Error ? err.message : 'unknown error'}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: 'user', content: results });
    }

    // Ran out of turns — the agent is looping on tools rather than answering.
    return new Response(
      JSON.stringify({
        answer:
          "I'm going in circles on that one. Email apply@thelivingcraft.ai and Sunil will answer it directly.",
        captured: Boolean(captured),
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return bad(429, 'Busy right now — try again in a moment, or email apply@thelivingcraft.ai.');
    }
    console.error('ask failed:', err);
    return bad(502, 'Something went wrong. Please email apply@thelivingcraft.ai.');
  }
};
