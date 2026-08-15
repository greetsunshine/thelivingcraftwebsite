// Retriever agent — gathers current, citable detail and writes it where the
// visitor Q&A agent can read it (src/data/latest.json).
//
//   npm run gather              # refresh from the default topics
//   npm run gather -- "topic"   # refresh one ad-hoc topic
//
// Run it on a schedule (GitHub Action, cron) and commit the diff. The Q&A agent
// picks it up on the next deploy.
//
// Ported from ~/agentic-observability-demo: same Anthropic tool-use loop, with
// Claude's server-side web_search standing in for the demo's fixed knowledge
// base, and a structured-output contract so the result lands as data rather
// than prose that then needs parsing.
//
// Guardrail worth naming: this agent may NOT restate our own offers. Prices,
// dates, and seat counts live in src/data/facts.ts and flow to the visitor
// agent directly. If a retriever could also write those, two sources could
// disagree and the visitor agent would have no way to know which is true.

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'src', 'data', 'latest.json');

const MODEL = 'claude-opus-5';

/** What the retriever sweeps when run with no arguments. */
const DEFAULT_TOPICS = [
  'Recent changes to India DPDP Act rules or enforcement affecting enterprise AI deployments',
  'Recent RBI, SEBI or IRDAI guidance on AI or model risk for regulated Indian firms',
  'Recent EU AI Act milestones or ISO 42001 / NIST AI RMF developments relevant to enterprise AI governance',
  'Notable recent developments in agentic AI evaluation, reliability engineering, or prompt-injection defence',
];

const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description: 'Findings worth surfacing to a prospective client. Empty if nothing material.',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Short kebab-case slug, unique and stable across runs where possible.',
          },
          title: { type: 'string', description: 'One line, plain and factual.' },
          body: {
            type: 'string',
            description:
              'Two to four sentences, written FOR A PROSPECTIVE CLIENT who will read it. What changed and why it matters to an engineering or business leader. No marketing language. Put NOTHING here that is addressed to Sunil or to a reviewer — no caveats about your own confidence, no "verify before quoting", no notes on source quality. Those belong in reviewNote.',
          },
          reviewNote: {
            type: 'string',
            description:
              'For Sunil only; never shown to anyone else. Anything he should know before trusting this: source quality, what you could not confirm, whether the claim is primary-sourced or secondhand. Empty string if there is nothing to flag.',
          },
          source: { type: 'string', description: 'The URL this came from.' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'title', 'body', 'reviewNote', 'source', 'tags'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const;

const SYSTEM = `You gather current, citable developments for the website of Sunil Mathew — a
fractional Chief AI Officer and instructor working with India's regulated and mid-market
enterprises. Your findings are read by a visitor-facing Q&A agent on that site.

Rules:
- Only report things you actually found and can cite with a URL. Never infer, extrapolate,
  or fill a gap with what is probably true.
- Return an empty list rather than padding with marginal items. Nothing is a valid answer.
- Never write about Sunil's own pricing, cohort dates, seat counts, or offers. Those come
  from a separate source of truth and are not yours to restate.
- No testimonials, client names, or metrics attributed to Sunil.
- Write for a CTO or engineering director: what changed, and what it means for them.
- Prefer primary sources (regulator, standards body, official announcement) over commentary.
  Sunil sells regulatory depth, so a legal or regulatory claim cited to a vendor blog or a
  trade-press summary is a liability. If you can only find a secondary source for such a
  claim, still report it, but say so plainly in reviewNote.
- The body is read aloud to prospective clients. Write it for them. Anything addressed to
  Sunil — doubts, verification steps, source-quality concerns — goes in reviewNote, never
  in the body.`;

/**
 * Two passes, because web search and structured outputs can't share a call.
 *
 * Web search attaches citations to the text it produces, and structured outputs
 * reject citations with a 400 — so asking one call to both search and emit
 * schema-valid JSON fails. Splitting also gives each call one job: research,
 * then transcribe. The second call sees only the first's notes, so it can't
 * introduce a finding that wasn't researched.
 */
/** Searches per topic. Shared across topics, the first one eats the budget. */
const SEARCHES_PER_TOPIC = 10;

async function gather(topics: string[]) {
  const client = new Anthropic();
  const today = new Date().toISOString().slice(0, 10);

  // Pass 1 — research, ONE CALL PER TOPIC.
  //
  // A single call covering all four topics starved the later ones: the first
  // run exhausted a shared 12-search budget on topic one and reported items for
  // the rest from whatever it already had, while the second run said so out
  // loud — "three of four topics are under-searched rather than genuinely
  // empty". Per-topic calls give each its own budget, so an empty topic means
  // nothing was found rather than nothing was looked for.
  const notes: string[] = [];
  for (const [i, topic] of topics.entries()) {
    console.log(`  [${i + 1}/${topics.length}] ${topic.slice(0, 68)}…`);

    const research = await client.messages.create({
      model: MODEL,
      max_tokens: 6000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      system: SYSTEM,
      tools: [
        { type: 'web_search_20260209', name: 'web_search', max_uses: SEARCHES_PER_TOPIC },
      ],
      messages: [
        {
          role: 'user',
          content: `Search for material developments in the last 90 days on this one topic:

${topic}

Today is ${today}. Discard anything older than 90 days or already common knowledge.

Write up only the findings worth surfacing to a prospective client. For each, give a short
title, two to four sentences for that client, the source URL, and — separately — anything
Sunil should know before trusting it. If nothing material turned up, say so plainly; an
empty topic is expected some weeks and is better than padding.

You have ${SEARCHES_PER_TOPIC} searches for this topic alone, so search properly before
concluding it is empty. If you run out, say the topic is under-searched rather than empty.`,
        },
      ],
    });

    if (research.stop_reason === 'refusal') {
      console.warn(`      refused: ${research.stop_details?.explanation ?? 'no explanation'} — skipping`);
      continue;
    }

    const text = research.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (text) notes.push(`## Topic: ${topic}\n\n${text}`);
  }

  if (notes.length === 0) return [];

  // Pass 2 — transcribe into the schema. No tools, so no citations, so the
  // structured-output constraint is satisfied.
  const structured = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema: ITEM_SCHEMA } },
    system:
      'You transcribe research notes into structured records. Use only what the notes contain — ' +
      'no additions, no inference, no rewriting of the substance. Drop any finding that lacks a ' +
      'usable source URL. If the notes report nothing material, return an empty list.',
    messages: [{ role: 'user', content: `Research notes from ${today}:\n\n${notes.join('\n\n---\n\n')}` }],
  });

  if (structured.stop_reason === 'refusal') {
    throw new Error(`Transcription pass refused: ${structured.stop_details?.explanation ?? 'no explanation'}`);
  }

  const raw = structured.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  let parsed: { items?: Omit<import('../src/lib/agent/latest').LatestItem, 'gatheredAt'>[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Could not parse the structured pass as JSON. Raw output:\n${raw.slice(0, 500)}`);
  }

  return parsed.items ?? [];
}

async function main() {
  // Preflight. The SDK's own failure here is "Could not resolve authentication
  // method. Expected one of apiKey, authToken, credentials, config, or
  // profile…", which says nothing about where to put the key.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set.\n');
    console.error('  Local run:  put it in .env.local —');
    console.error('    cp .env.example .env.local   # then paste your key after the =');
    console.error('  One-off:    ANTHROPIC_API_KEY=sk-ant-… npm run gather\n');
    console.error('  Key from:   https://console.anthropic.com/settings/keys');
    console.error('  (`vercel env pull` will NOT work — Vercel redacts encrypted values.)');
    process.exit(1);
  }

  const topics = process.argv.slice(2);
  const useTopics = topics.length > 0 ? topics : DEFAULT_TOPICS;

  console.log(`Retriever: sweeping ${useTopics.length} topic(s) on ${MODEL}…`);
  const found = await gather(useTopics);
  const today = new Date().toISOString().slice(0, 10);

  // Operator-authored items are hand-written and outrank anything the retriever
  // finds — keep them, replace only the machine-gathered set.
  const existing = JSON.parse(readFileSync(OUT, 'utf8')) as {
    items: import('../src/lib/agent/latest').LatestItem[];
  };
  const operator = existing.items.filter((i) => i.source === 'operator');

  const store = {
    refreshedAt: new Date().toISOString(),
    items: [...operator, ...found.map((i) => ({ ...i, gatheredAt: today }))],
  };

  writeFileSync(OUT, `${JSON.stringify(store, null, 2)}\n`);
  console.log(
    `Wrote ${store.items.length} item(s) to src/data/latest.json ` +
      `(${operator.length} operator, ${found.length} gathered).`,
  );
  for (const i of found) console.log(`  · ${i.title}`);
  if (found.length === 0) console.log('  (retriever found nothing material — that is a valid result)');
}

main().catch((err) => {
  console.error('Retriever failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
