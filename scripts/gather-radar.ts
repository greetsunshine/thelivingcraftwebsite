// Radar agent (operator-facing) — market intelligence for Sunil, written to
// the radar_findings table and read only by /admin/radar.
//
//   npm run radar                       # sweep all six categories
//   npm run radar -- --category=skills  # sweep one
//   npm run radar -- --force            # override the cooldown
//
// This is the second retriever. It shares its machinery with gather-latest.ts
// (scripts/lib/research.ts) and shares none of its audience. See
// src/lib/agent/radar.ts for why the two files must not merge — the short
// version is that this one carries hiring numbers, investment figures, and
// claims about what is failing, and a chatbot repeating any of those to a
// prospect is a liability rather than a feature.
//
// The same absolute rule applies as to the visitor retriever: it may not write
// our own prices, dates, or seat counts. Those live in src/data/facts.ts.
//
// It also ACCUMULATES rather than replacing. A quarter of India hiring signal is
// worth more than this week's slice, so each run adds to what is already there,
// drops duplicates, and prunes past the retention window.
//
// It writes to Postgres rather than to a committed file, and therefore needs
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in its environment (GitHub Actions
// secrets for the scheduled run, .env.local for a local one). Deduping is the
// database's job now — a unique index on the normalised source URL — so two
// overlapping sweeps cannot race each other into two rows for one story.

import {
  RESEARCH_MODEL,
  TRANSCRIBE_MODEL,
  enforceBudget,
  enforceCooldownAt,
  reportFailure,
  requireApiKey,
  sweep,
} from './lib/research.ts';
import {
  CATEGORY_KEYS,
  RADAR_CATEGORIES,
  RADAR_MAX_AGE_DAYS,
} from '../src/data/radar-categories.ts';
import {
  finishRun,
  lastRadarRun,
  pruneFindings,
  saveFindings,
  startRun,
  type IncomingFinding,
} from '../src/lib/agent/radar.ts';

interface GatheredRadarItem {
  id: string;
  category: string;
  title: string;
  body: string;
  implication: string;
  reviewNote: string;
  source: string;
  sourceType: string;
  publishedAt: string;
  tags: string[];
}

const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description: 'Findings worth Sunil reading. Empty if nothing material.',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description:
              'Short kebab-case slug. Make it descriptive of the finding, not the week — the same story resurfacing should collide with its previous id rather than duplicating it.',
          },
          category: {
            type: 'string',
            enum: CATEGORY_KEYS,
            description: 'Which of the six watchlist categories this belongs to.',
          },
          title: { type: 'string', description: 'One line, plain and factual. No headline style.' },
          body: {
            type: 'string',
            description:
              'Two to four sentences. What was found, with the specific numbers, names and dates where the source gives them. Written for a director-level engineer who will decide whether to act on it. No marketing language and no hedging filler.',
          },
          implication: {
            type: 'string',
            description:
              'One sentence: what this means for a practice that teaches agentic architecture and sells a fractional CAIO retainer. Say "no clear implication" if there is none — do not manufacture one.',
          },
          reviewNote: {
            type: 'string',
            description:
              'What Sunil should know before repeating this: how solid the source is, what you could not confirm, whether a number is self-reported. Empty string only if there is genuinely nothing to flag.',
          },
          source: { type: 'string', description: 'The full URL this came from.' },
          sourceType: {
            type: 'string',
            enum: ['primary', 'press', 'vendor', 'secondhand'],
            description:
              'primary = the paper, filing, earnings call, official announcement or the data itself. press = established journalism reporting on it. vendor = a company describing its own product or results. secondhand = a blog or newsletter summarising something else.',
          },
          publishedAt: {
            type: 'string',
            description: 'Publication date of the source as YYYY-MM-DD, or an empty string if you could not establish one.',
          },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: [
          'id',
          'category',
          'title',
          'body',
          'implication',
          'reviewNote',
          'source',
          'sourceType',
          'publishedAt',
          'tags',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const;

const SYSTEM = `You are a research analyst for Sunil Mathew — a fractional Chief AI Officer with 26 years
of engineering leadership, who also teaches The Living Craft, a live cohort on agentic and
systems architecture.

You are writing for HIM, not for his clients. He is the only reader. That means you can be
blunt about weak evidence, and you should be: a finding he cannot defend in a board room is
worse than no finding, because he will only discover the weakness while being challenged
on it.

What makes something worth reporting: it would change a decision he makes about what to
teach, what to advise a client, or where the market is going. Not "it is interesting" and
certainly not "it is in the news".

Rules:
- Only report what you actually found and can cite with a working URL. Never infer,
  extrapolate, or reconstruct a number from memory.
- Return an empty list rather than padding. A quiet category is a real result and he will
  read it as one.
- Numbers must be quoted as the source states them, with the source's own framing. If a
  figure is self-reported, projected, or an analyst estimate rather than an actual, say so
  in reviewNote — an investment figure repeated without that context is how a credible
  practitioner gets caught out.
- Grade every source honestly in sourceType. An earnings call is primary; a vendor's blog
  about its own product is vendor no matter how technical it reads; a newsletter summarising
  a paper is secondhand even if the paper is primary.
- The "what is failing" category has the highest bar in this brief. Competitor sniping,
  contrarian opinion pieces, and "AI hype is over" thinkpieces are not evidence. Look for
  published negative results, retractions, rolled-back deployments, failed replications, and
  post-mortems from the team that actually did the work. If you only find opinion, report
  nothing for that category and say so.
- For India hiring, prefer named surveys, job-board data, GCC and IT-services headcount
  announcements, and government or industry-body reporting over generic trend articles.
  Salary figures in particular need a named methodology, or they are worthless.
- Never write about Sunil's own pricing, cohort dates, seat counts, or offers. Those come
  from a separate source of truth and are not yours to restate.
- No testimonials, client names, or metrics attributed to Sunil.`;

const researchPrompt = (topic: string, today: string, searches: number) =>
  `Research this one topic:

${topic}

Today is ${today}. Concentrate on the last 90 days. Older material is only worth reporting
if it is the primary source for something that became significant recently.

EVERY finding must carry the full URL you found it at, on its own line as \`Source: https://…\`,
plus a \`Published:\` line with the source's publication date if you can establish one. A
finding you cannot attach a URL to is not a finding — leave it out. Do not group several
findings under one shared source; if two come from one page, repeat the URL on both.

For each finding give: a short factual title; two to four sentences carrying the actual
numbers, names and dates; one sentence on what it implies for a practice that teaches
agentic architecture and sells fractional CAIO work; the Source and Published lines; and
separately, what Sunil should know before repeating it — how solid the source is, whether a
figure is self-reported or projected, what you could not confirm.

Also state plainly what kind of source it is: the primary artefact, established journalism,
a vendor talking about itself, or somebody's summary of another source.

You have ${searches} searches for this topic alone, so search properly before concluding it
is empty. If you run out mid-way, say the topic is under-searched rather than empty — that
distinction matters and a padded answer destroys it.`;

async function main() {
  requireApiKey();

  const argv = process.argv.slice(2);
  const force = argv.includes('--force');
  const only = argv.find((a) => a.startsWith('--category='))?.split('=')[1];
  const adHoc = argv.filter((a) => !a.startsWith('--'));

  if (only && !CATEGORY_KEYS.includes(only)) {
    console.error(`Unknown category "${only}". Known: ${CATEGORY_KEYS.join(', ')}`);
    process.exit(1);
  }

  // The cooldown used to read `refreshedAt` off the JSON file. With the store
  // in Postgres the equivalent is the last run record — deliberately the run
  // and not the newest finding, so a sweep that legitimately found nothing
  // still counts as having run.
  const previous = await lastRadarRun();
  enforceCooldownAt(previous?.startedAt ?? null, 6, force, 'radar');
  await enforceBudget(force);

  // An ad-hoc topic still has to land in a category, because the console groups
  // by category and an uncategorised item would simply not render.
  const selected = only
    ? RADAR_CATEGORIES.filter((c) => c.key === only)
    : RADAR_CATEGORIES;

  const topics = adHoc.length > 0 ? adHoc : selected.map((c) => c.topic);

  console.log(
    `Radar: sweeping ${topics.length} categor${topics.length === 1 ? 'y' : 'ies'} — ` +
      `research on ${RESEARCH_MODEL}, transcription on ${TRANSCRIBE_MODEL}.` +
      `${force ? ' (cooldown overridden)' : ''}`,
  );

  const found = await sweep<GatheredRadarItem>({
    topics,
    system: SYSTEM,
    researchPrompt,
    schema: ITEM_SCHEMA,
    // Six categories rather than five, each with a longer record. Running out
    // truncates the JSON mid-string and surfaces as an opaque parse error.
    maxTranscribeTokens: 24000,
    transcribeSystem:
      'Assign every record to exactly one of the six categories. If a finding genuinely spans ' +
      'two, put it in the one where Sunil would look for it and mention the overlap in the body. ' +
      'Grade sourceType from what the note says about the source, never from the domain name alone.',
  });

  // Record the sweep before writing findings, so a run that dies mid-flight
  // still leaves evidence it happened — otherwise a crashing agent looks
  // identical to one that was never triggered.
  const runId = await startRun(
    process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' ? 'manual' : 'schedule',
    selected.map((c) => c.key),
  );

  const incoming: IncomingFinding[] = found.map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title,
    body: item.body,
    implication: item.implication,
    reviewNote: item.reviewNote,
    source: item.source,
    sourceType: item.sourceType,
    publishedAt: item.publishedAt,
    tags: item.tags,
  }));

  let written;
  try {
    written = await saveFindings(incoming);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finishRun(runId, { error: message });
    throw err;
  }

  const pruned = await pruneFindings();
  await finishRun(runId, {
    found: written.inserted,
    duplicates: written.duplicates,
    pruned,
  });

  console.log(
    `Radar: ${written.inserted} new finding(s) saved ` +
      `(${written.duplicates} already on the radar, ${pruned} pruned past ${RADAR_MAX_AGE_DAYS} days).`,
  );

  const fresh = incoming;

  for (const key of CATEGORY_KEYS) {
    const n = fresh.filter((i) => i.category === key).length;
    if (n > 0) console.log(`  ${key}: ${n} gathered`);
  }
  if (written.inserted === 0) {
    console.log('  (nothing new this run — that is a valid result)');
  }
}

main().catch(reportFailure);
