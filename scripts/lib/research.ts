// Shared retriever core.
//
// There are two retriever agents now and they differ only in what they look for
// and who reads the result:
//
//   gather-latest.ts -> src/data/latest.json  read by the visitor Q&A agent
//   gather-radar.ts  -> radar_findings table  read by Sunil, in /admin/radar
//
// Everything that makes them safe is identical, and all of it was learned the
// expensive way: one research call per topic (a shared budget starves the later
// topics), a cooldown (four runs in an hour emptied the account and took the
// live site agent down with it), two passes (web search attaches citations and
// structured outputs reject them, so one call cannot do both), and a source
// filter in code rather than in the prompt (asked politely, a run emitted 22
// items of which 16 had no source at all).
//
// Two later additions, both aimed at the same weakness — that a snippet is not
// a source. The research pass can now OPEN the pages it reports on
// (FETCHES_PER_TOPIC), and it runs the topics CONCURRENTLY (RESEARCH_CONCURRENCY)
// so paying for that extra reading does not turn a weekly sweep into a
// quarter-hour job. Concurrency is only safe because the budgets were already
// per topic; if that ever changes, this does too.
//
// That list is why this is a shared module rather than a copy-paste. A second
// agent with a hand-copied version of these guards is a second agent that will
// drift out of having them.

import { readFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Both passes on Opus 5, and the research pass is the reason. Moving research
 * to Sonnet to save money was tried and reverted: Opus returned 5–7 findings,
 * every one carrying a URL to a primary artefact; Sonnet returned 22, of which
 * 16 had an empty source and most survivors were content-marketing blogs.
 *
 * The job is not summarising. It is judging which of a hundred search results
 * is worth a senior engineer's attention, and saying "nothing this week" when
 * that is the truth. Cost is controlled with the levers that don't cost quality
 * — searches per topic, the cooldown, a weekly cadence, and the spend limit.
 */
export const RESEARCH_MODEL = 'claude-opus-5';
export const TRANSCRIBE_MODEL = 'claude-opus-5';

/** Searches per topic — per topic, never shared across the run. */
export const SEARCHES_PER_TOPIC = 6;

/**
 * Pages the research pass may actually open, per topic.
 *
 * Both agents are told to prefer the primary artefact over somebody's summary
 * of it, and the radar is asked to grade every source as primary, press, vendor
 * or secondhand. Until this existed they did both from a search snippet — which
 * is a title, a URL and two lines of context written by whoever wanted the
 * click. That is enough to guess a grading and not enough to earn one.
 *
 * Smaller than the search budget on purpose. Searching is how you find the
 * candidates; fetching is what you spend on the two or three you mean to
 * report, and an agent that opens everything it finds is an agent whose context
 * is full of pages it did not use.
 */
export const FETCHES_PER_TOPIC = 4;

/**
 * How many topics research at once.
 *
 * They were serial, which made a six-category radar sweep six web-searching
 * Opus calls end to end — about eleven minutes of a GitHub Action doing one
 * thing at a time, for calls that share nothing. The per-topic budgets are what
 * make this safe: no topic can spend another's searches, so running them
 * together cannot change what any one of them returns.
 *
 * Bounded rather than unlimited because the ceiling here is tokens per minute,
 * not politeness. Six concurrent Opus calls each pulling in fetched pages is a
 * rate-limit reply, and a 429 mid-sweep costs the research already paid for.
 */
export const RESEARCH_CONCURRENCY = 3;

/**
 * Run `work` over `items` with at most `limit` in flight, preserving order.
 *
 * Results are written back by index, so the notes reach the transcription pass
 * in the order the topics were listed no matter what order they finish in.
 */
async function mapWithLimit<A, B>(
  items: A[],
  limit: number,
  work: (item: A, index: number) => Promise<B>,
): Promise<B[]> {
  const out = new Array<B>(items.length);
  let next = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await work(items[i], i);
    }
  });

  await Promise.all(runners);
  return out;
}

/**
 * Appended to every per-topic prompt, because the tool it describes is granted
 * here rather than by the calling script. Keeping the two together is what stops
 * a future agent being handed the tool and never told to use it.
 */
const FETCH_GUIDANCE = `

You can open pages, not only read search results. Use web_fetch on the artefact itself before you
report or grade it — the paper, the filing, the release notes, the post-mortem, the announcement.
A search snippet tells you a page exists and is written by whoever wanted the click; it does not
tell you whether the source says what the headline says, and a judgement about how solid a source
is has to be a judgement about the source.

You have ${FETCHES_PER_TOPIC} fetches for this topic. Spend them on the things you intend to
report, not on browsing. If you could not open something, say so rather than grading it as if you
had.`;

const SOURCE_URL = /^https?:\/\/\S+$/i;

/**
 * Refuses a sweep that would run past the monthly budget.
 *
 * Stricter than the check on /api/ask, deliberately. One visitor question is
 * cents; a sweep is five web-searching Opus calls plus transcription, so it can
 * cross a limit by itself. It stands down at 80% rather than 100% — better a
 * skipped week of findings than an exhausted balance that takes the visitor
 * agent down too, which is exactly what happened on 2026-08-15.
 *
 * Unknown budget means proceed: this is a guard, not a gate, and an unreadable
 * cost API must not stop the weekly job.
 */
export async function enforceBudget(force: boolean): Promise<void> {
  const { getBudget, formatUsd, WARN_FRACTION } = await import('../../src/lib/agent/budget.ts');
  const budget = await getBudget();

  if (!budget.known) return;
  if (budget.used < WARN_FRACTION) return;

  const state = budget.overBudget ? 'is over' : 'is close to';
  console.error(
    `Skipped: month-to-date spend ${formatUsd(budget.spentUsd)} ${state} the ` +
      `${formatUsd(budget.limitUsd)} budget (${Math.round(budget.used * 100)}%).\n`,
  );
  console.error('  A sweep is 5 web-searching Opus calls plus transcription — enough to');
  console.error('  finish the balance and take the site assistant down with it.\n');

  if (force) {
    console.error('  --force given: running anyway.\n');
    return;
  }

  console.error('  Raise AGENT_MONTHLY_BUDGET_USD, wait for the month to roll, or');
  console.error('  override deliberately with:  npm run gather -- --force');
  process.exit(0);
}

/** Exits the process with instructions rather than the SDK's opaque auth error. */
export function requireApiKey(): void {
  if (process.env.ANTHROPIC_API_KEY) return;

  console.error('ANTHROPIC_API_KEY is not set.\n');
  console.error('  Local run:  put it in .env.local —');
  console.error('    cp .env.example .env.local   # then paste your key after the =');
  console.error('  One-off:    ANTHROPIC_API_KEY=sk-ant-… npm run gather\n');
  console.error('  Key from:   https://console.anthropic.com/settings/keys');
  console.error('  (`vercel env pull` will NOT work — Vercel redacts encrypted values.)');
  process.exit(1);
}

/**
 * Refuses a run that follows too closely on the last one.
 *
 * This is not a substitute for the console spend limit, which is the real
 * ceiling. It is the part that lives in the repo, and it matches how the damage
 * actually happened: not a runaway loop, but a person iterating on a prompt.
 */
export function enforceCooldown(outPath: string, hours: number, force: boolean, label: string): void {
  if (force) return;

  try {
    const prev = JSON.parse(readFileSync(outPath, 'utf8')) as { refreshedAt?: string };
    enforceCooldownAt(prev.refreshedAt ?? null, hours, force, label);
  } catch {
    // No readable previous file — nothing to rate-limit against; proceed.
  }
}

/**
 * The same guard, given the timestamp directly.
 *
 * The radar's store moved from a JSON file to Postgres, so there is no
 * `refreshedAt` field to stat — its last-run time comes from a query. The rule
 * is identical and lives in one place; only the source of the timestamp
 * differs. A null timestamp means nothing to rate-limit against, so proceed.
 */
export function enforceCooldownAt(
  lastRunIso: string | null,
  hours: number,
  force: boolean,
  label: string,
): void {
  if (force || !lastRunIso) return;

  const last = Date.parse(lastRunIso);
  if (Number.isNaN(last)) return;

  const since = (Date.now() - last) / 3_600_000;
  if (since >= hours) return;

  console.error(`Skipped: last run was ${since.toFixed(1)}h ago (cooldown ${hours}h).\n`);
  console.error('  Each run is several web-searching Opus calls. Repeated runs are how the');
  console.error('  credit balance emptied and the live agent went down on 2026-08-15.\n');
  console.error(`  Wait ${(hours - since).toFixed(1)}h, or override with:  npm run ${label} -- --force`);
  console.error(`  Tuning topics? Try one at a time:  npm run ${label} -- "your topic"`);
  process.exit(0);
}

export interface SweepSpec {
  topics: string[];
  /** Shared framing for both passes — who reads this, and what counts as a finding. */
  system: string;
  /** Builds the per-topic research prompt. Receives today's date and the budget. */
  researchPrompt: (topic: string, today: string, searches: number) => string;
  /** JSON Schema the transcription pass must satisfy. */
  schema: Record<string, unknown>;
  /** Extra instruction for the transcription pass, appended to the shared rules. */
  transcribeSystem?: string;
  /** Raise for many topics — a truncated response surfaces as a parse error. */
  maxTranscribeTokens?: number;
}

/**
 * Research every topic, then transcribe the notes into schema-valid records.
 *
 * Returns only records carrying a real source URL. The dropped ones are logged
 * by id, and a drop rate over half is called out — that means the research pass
 * has stopped attaching URLs, which is a prompt problem rather than a quiet week.
 */
export async function sweep<T extends { id: string; source: string }>(spec: SweepSpec): Promise<T[]> {
  const client = new Anthropic();
  const today = new Date().toISOString().slice(0, 10);

  // Pass 1 — research, ONE CALL PER TOPIC. A single call covering every topic
  // spent a shared budget on the first one and reported the rest from whatever
  // it already had. Per-topic calls mean an empty topic is genuinely empty
  // rather than unsearched — and, because nothing is shared between them, mean
  // the topics can run concurrently without changing any one result.
  //
  // Progress lines therefore arrive out of order. Each carries its own index so
  // the log still reads.
  const failures: string[] = [];

  const perTopic = await mapWithLimit(spec.topics, RESEARCH_CONCURRENCY, async (topic, i) => {
    const label = `[${i + 1}/${spec.topics.length}] ${topic.slice(0, 58)}…`;
    console.log(`  ${label}  started`);

    try {
      // Streamed for the same reason the transcription pass is: the SDK refuses
      // a non-streaming request whose estimated duration passes ten minutes, and
      // a topic that searches six times and then opens four pages is no longer
      // obviously under that. finalMessage() returns the same Message the
      // non-streaming call did, so every check below is unchanged.
      const research = await client.messages
        .stream({
          model: RESEARCH_MODEL,
          max_tokens: 6000,
          thinking: { type: 'adaptive' },
          output_config: { effort: 'medium' },
          system: spec.system,
          tools: [
            { type: 'web_search_20260209', name: 'web_search', max_uses: SEARCHES_PER_TOPIC },
            {
              type: 'web_fetch_20260209',
              name: 'web_fetch',
              max_uses: FETCHES_PER_TOPIC,
              // A cap per page, so one long document cannot fill the context
              // that the other three fetches and the write-up still need.
              max_content_tokens: 12000,
            },
          ],
          messages: [
            { role: 'user', content: spec.researchPrompt(topic, today, SEARCHES_PER_TOPIC) + FETCH_GUIDANCE },
          ],
        })
        .finalMessage();

      if (research.stop_reason === 'refusal') {
        console.warn(`  ${label}  refused: ${research.stop_details?.explanation ?? 'no explanation'} — skipping`);
        return '';
      }

      const text = research.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      console.log(`  ${label}  ${text ? 'done' : 'nothing found'}`);
      return text ? `## Topic: ${topic}\n\n${text}` : '';
    } catch (err) {
      // One topic dying must not lose the five that already succeeded and were
      // already paid for. It is recorded and the sweep carries on with the rest.
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${topic.slice(0, 58)}: ${msg}`);
      console.warn(`  ${label}  FAILED: ${msg}`);
      return '';
    }
  });

  const notes = perTopic.filter((n) => n !== '');

  if (notes.length === 0) {
    // Nothing at all, with failures behind it, is an outage rather than a quiet
    // week — and returning [] here would file it as "found nothing", which is
    // exactly the confusion the run record exists to prevent.
    if (failures.length > 0) {
      throw new Error(
        `All ${spec.topics.length} research call(s) failed. First: ${failures[0]}`,
      );
    }
    return [];
  }

  if (failures.length > 0) {
    console.warn(`  ${failures.length} topic(s) failed and were skipped; transcribing the rest.`);
  }

  // Pass 2 — transcribe. No tools, so no citations, so structured output is
  // allowed. It sees only pass 1's notes and therefore cannot introduce a
  // finding that was never researched.
  //
  // STREAMED, and not for progress output — nothing reads the deltas. The SDK
  // refuses a non-streaming request whose estimated duration exceeds ten
  // minutes, and it estimates from max_tokens. The radar sweeps six categories
  // and needs 24000 to avoid truncating its JSON mid-string; that tipped it
  // over, and the whole run died AFTER all six research calls had been paid
  // for:
  //
  //   Streaming is required for operations that may take longer than 10 minutes
  //
  // The visitor retriever survived only because 16000 happened to sit under the
  // threshold — which is luck, not design, and would break the moment a topic
  // was added. Streaming removes the ceiling for both, and finalMessage() gives
  // back exactly the same Message the non-streaming call returned, so every
  // stop_reason check below is unchanged.
  const structured = await client.messages
    .stream({
      model: TRANSCRIBE_MODEL,
      max_tokens: spec.maxTranscribeTokens ?? 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low', format: { type: 'json_schema', schema: spec.schema } },
      system:
        'You transcribe research notes into structured records. Use only what the notes contain — ' +
        'no additions, no inference, no rewriting of the substance.\n\n' +
        'The source field must be the full http(s) URL the note carried. If a note has no URL, ' +
        'OMIT that finding entirely — do not emit it with an empty or placeholder source, and do ' +
        'not borrow a URL from a neighbouring finding. Fewer, sourced records beat more, unsourced ' +
        'ones. If the notes report nothing material, return an empty list.' +
        (spec.transcribeSystem ? `\n\n${spec.transcribeSystem}` : ''),
      messages: [{ role: 'user', content: `Research notes from ${today}:\n\n${notes.join('\n\n---\n\n')}` }],
    })
    .finalMessage();

  if (structured.stop_reason === 'refusal') {
    throw new Error(`Transcription pass refused: ${structured.stop_details?.explanation ?? 'no explanation'}`);
  }

  // Check this before JSON.parse. A truncated response reads as malformed JSON
  // and sends you hunting for a schema bug instead of a token budget.
  if (structured.stop_reason === 'max_tokens') {
    throw new Error(
      'Transcription pass hit max_tokens, so the JSON is cut off. Raise maxTranscribeTokens, ' +
        'or sweep fewer topics per run.',
    );
  }

  const raw = structured.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  let parsed: { items?: T[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Could not parse the structured pass as JSON. Raw output:\n${raw.slice(0, 500)}`);
  }

  // The source contract is enforced HERE, not in the prompt. A data contract
  // asked for politely is a suggestion, and the cost of that distinction is an
  // unsourced claim repeated to a prospect.
  const items = parsed.items ?? [];
  const sourced = items.filter((i) => SOURCE_URL.test(String(i.source ?? '')));
  const dropped = items.length - sourced.length;

  if (dropped > 0) {
    console.warn(`  dropped ${dropped}/${items.length} finding(s) with no usable source URL:`);
    for (const i of items) {
      if (!SOURCE_URL.test(String(i.source ?? ''))) console.warn(`    · ${i.id}`);
    }
    if (dropped / items.length > 0.5) {
      console.warn('  NOTE: over half were unsourced — check the research pass is emitting a URL per finding.');
    }
  }

  return sourced;
}

/** Shared top-level error handling: name credit exhaustion, which billing fixes. */
export function reportFailure(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);

  if (/credit balance/i.test(msg)) {
    console.error('Retriever stopped: the Anthropic account is out of credit.\n');
    console.error('  Top up:  https://console.anthropic.com/settings/billing');
    console.error('  Cap it:  https://console.anthropic.com/settings/limits\n');
    console.error('  Note this also takes the live site agent down — it shares the key.');
    process.exit(1);
  }

  console.error('Retriever failed:', msg);
  process.exit(1);
}
