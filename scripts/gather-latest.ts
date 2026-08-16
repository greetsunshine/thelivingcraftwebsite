// Retriever agent (visitor-facing) — gathers current, citable detail and writes
// it where the visitor Q&A agent can read it (src/data/latest.json).
//
//   npm run gather              # refresh from the default topics
//   npm run gather -- "topic"   # refresh one ad-hoc topic
//
// Run it on a schedule (GitHub Action, cron) and commit the diff. The Q&A agent
// picks it up on the next deploy.
//
// The mechanics — per-topic search budgets, the two-pass split, the cooldown,
// the source filter — live in scripts/lib/research.ts and are shared with the
// radar agent. What is specific to this agent is here: WHO reads the output.
//
// Everything this script writes is read verbatim by a chatbot talking to
// prospects. That is why the topics map to what the cohort teaches, and why the
// guardrail below is absolute: this agent may NOT restate our own offers.
// Prices, dates, and seat counts live in src/data/facts.ts and flow to the
// visitor agent directly. If a retriever could also write those, two sources
// could disagree and the visitor agent would have no way to know which is true.
//
// For market intelligence — where big tech is investing, what is failing,
// hiring in India — see gather-radar.ts. That feed is for Sunil and is
// deliberately NOT wired into the visitor agent.

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  RESEARCH_MODEL,
  TRANSCRIBE_MODEL,
  enforceCooldown,
  reportFailure,
  requireApiKey,
  sweep,
} from './lib/research.ts';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'src', 'data', 'latest.json');

/**
 * What the retriever sweeps when run with no arguments.
 *
 * Deliberately mapped to what the cohort teaches, because the job these serve
 * is a prospect asking "is this material current, or am I paying for last
 * year's thinking?" Each topic corresponds to a module:
 *   M1 durable architecture · M2 agentic systems, evals, red-teaming
 *   M3 scale and trade-offs  · plus what teams are actually hiring for
 */
const DEFAULT_TOPICS = [
  'New or shifting architecture patterns in production agentic AI systems — orchestration, tool design, context management, agent memory',
  'Advances in evaluating and testing agentic AI — eval harnesses, benchmarks, and reliability engineering for non-deterministic systems',
  'Security and red-teaming developments for agentic AI — prompt injection, tool-use exploitation, data exfiltration, containment patterns',
  'Skills and competencies engineering leaders are hiring for, or building in their teams, to work on agentic AI',
  'Significant model, framework, or tooling releases that change how production agentic systems are built',
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

const SYSTEM = `You track what is genuinely moving in the agentic AI space — the trends, techniques,
and skills that a senior engineer or engineering leader should know about right now.

Your findings are read by a visitor-facing Q&A agent on Sunil Mathew's website. Sunil
teaches The Living Craft, a live cohort on agentic and systems architecture, and runs a
fractional Chief AI Officer practice. The visitors reading your findings are tech leads,
architects, and engineering directors deciding whether his material is current.

So the question behind every item is: does this change what a competent engineer should
know, build, or watch out for? Not "is this in the news".

Rules:
- Only report things you actually found and can cite with a URL. Never infer, extrapolate,
  or fill a gap with what is probably true.
- Return an empty list rather than padding. Nothing is a valid answer for a quiet week, and
  far better than dressing up a vendor announcement as a trend.
- Substance over launches. A new framework release matters only if it changes how systems
  get built; a benchmark matters only if it measures something people were guessing at.
  Skip funding rounds, company news, and marketing.
- Prefer the primary artefact — the paper, the release notes, the engineering write-up, the
  official announcement — over someone's summary of it. Where you only have a secondhand
  source, still report it, but say so in reviewNote.
- Be sceptical of hype. If a claim is a vendor's about their own product, or a single
  benchmark result with no independent replication, say so in reviewNote.
- Never write about Sunil's own pricing, cohort dates, seat counts, or offers. Those come
  from a separate source of truth and are not yours to restate.
- No testimonials, client names, or metrics attributed to Sunil.
- The body is read to prospective clients. Write it for them: what changed, and what a
  senior engineer should do or think differently as a result. Anything addressed to Sunil —
  doubts, verification steps, source-quality concerns — goes in reviewNote, never the body.`;

const researchPrompt = (topic: string, today: string, searches: number) =>
  `Search for material developments in the last 90 days on this one topic:

${topic}

Today is ${today}. Discard anything older than 90 days or already common knowledge.

Write up only what genuinely changes what a senior engineer should know, build, or watch
out for.

EVERY finding must carry the full URL you found it at, on its own line as \`Source: https://…\`.
A finding you cannot attach a URL to is not a finding — leave it out rather than writing it
up unsourced. Do not group several findings under one shared source; if two findings come
from one page, repeat the URL on both.

For each finding give a short title, two to four sentences written for that
engineer, the Source line, and — separately — anything Sunil should know before trusting it
(secondhand source, vendor claiming things about their own product, single unreplicated
result). If nothing material turned up, say so plainly; an empty topic is expected some
weeks and is better than padding.

You have ${searches} searches for this topic alone, so search properly before
concluding it is empty. If you run out, say the topic is under-searched rather than empty.`;

async function main() {
  requireApiKey();

  const argv = process.argv.slice(2);
  const force = argv.includes('--force');
  const topics = argv.filter((a) => a !== '--force');

  enforceCooldown(OUT, 6, force, 'gather');

  const useTopics = topics.length > 0 ? topics : DEFAULT_TOPICS;

  console.log(
    `Retriever: sweeping ${useTopics.length} topic(s) — research on ${RESEARCH_MODEL}, ` +
      `transcription on ${TRANSCRIBE_MODEL}.${force ? ' (cooldown overridden)' : ''}`,
  );

  const found = await sweep<Omit<import('../src/lib/agent/latest').LatestItem, 'gatheredAt'>>({
    topics: useTopics,
    system: SYSTEM,
    researchPrompt,
    schema: ITEM_SCHEMA,
  });

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

main().catch(reportFailure);
