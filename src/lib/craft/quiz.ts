// The quiz bank, and the one place that decides what a learner may see.
//
// THE ANSWER-KEY SPLIT (spec §5.4). The bank in docs/teaching/ carries the stem,
// the options, the key and the distractor rationale together, because that is
// how the questions are authored and revised. Rendering those files to a learner
// would put the key on screen. So this module owns the split, and both surfaces
// read it:
//
//   getLearnerItems()  → stem and options only. Nothing else. Ever.
//   getQuizItems()     → everything, for the console and for grading.
//
// A SECOND READER WITH ITS OWN FILTERING IS HOW AN ANSWER KEY EVENTUALLY REACHES
// A LEARNER — the same failure class as reviewNote reaching a visitor, and it
// gets the same treatment: one module, one filter, no exceptions.
//
// Counting is code, per §4. The model never grades, never scores a `judge` item,
// and never produces a number that reaches a screen.

import { promises as fs } from 'fs';
import * as path from 'path';
import { db } from '../admin/supabase';

export type Difficulty = 'recall' | 'apply' | 'judge';

/** What a learner is allowed to receive. Deliberately has no `answer` field. */
export interface QuizItem {
  id: string;
  /**
   * The week this item belongs to, read from its file. Carried on the item
   * rather than derived through capability → session.topics, because that
   * derivation is ambiguous the moment two weeks share a capability — and they
   * will, since the thirteen capabilities are revisited across six weeks.
   */
  week: number;
  capability: string;
  difficulty: Difficulty;
  body: string;
  options?: { key: string; text: string }[];
}

/** The teaching-side view: the same item plus everything withheld above. */
export interface QuizItemWithAnswer extends QuizItem {
  answer: string;
  rationale?: string;
}

export interface QuizResponse {
  id: string;
  learner_id: string;
  item_id: string;
  answer: string;
  confidence: number;
  answered_at: string;
}

const QUIZ_DIR = path.join(process.cwd(), 'docs', 'teaching', 'quiz');

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
const WEEK_LINE = /^week:\s*(\d+)\s*$/m;
const ITEM_HEADING = /^##[ \t]+/m;
const META_LINE = /^([a-z_]+):\s*(.*)$/i;
const OPTION_LINE = /^([A-D])\)\s+(.*)$/i;
const WEEK_FILE = /^week-(\d+)\.md$/;

// Parsed by hand because gray-matter is not a dependency and the format is a
// handful of flat keys per item. One file per week; each `##` heading starts an
// item and its text is the id, metadata runs until the first blank line, and
// everything after that is the question.
function parseWeekFile(input: string, fallbackWeek: number): QuizItemWithAnswer[] {
  // Normalise line endings FIRST. This repo is developed on Windows with
  // git's autocrlf on, so the same file is LF in the repository and CRLF in a
  // checkout. Every per-line regex below ends in `$`, which in JavaScript
  // (without the m flag) matches only at end-of-string, never before a
  // trailing carriage return. Left unnormalised, a metadata line fails to
  // match, the parse bails, and the item is dropped WITHOUT ERROR: the bank
  // reads as empty and the quiz surface renders nothing.
  const raw = input.replace(new RegExp(String.fromCharCode(13), 'g'), '');

  const fm = raw.match(FRONTMATTER);
  const head = fm ? fm[1] : '';
  const rest = fm ? fm[2] : raw;

  const weekMatch = head.match(WEEK_LINE);
  const week = weekMatch ? Number(weekMatch[1]) : fallbackWeek;

  const items: QuizItemWithAnswer[] = [];

  for (const chunk of rest.split(ITEM_HEADING).slice(1)) {
    const lines = chunk.split('\n');
    const id = (lines.shift() ?? '').trim();
    if (!id) continue;

    const meta: Record<string, string> = {};
    while (lines.length > 0) {
      const line = lines[0];
      if (line.trim() === '') {
        lines.shift();
        break;
      }
      const kv = line.match(META_LINE);
      if (!kv) break;
      meta[kv[1].toLowerCase()] = kv[2].replace(/^['"]|['"]$/g, '').trim();
      lines.shift();
    }

    const capability = meta.capability;
    const answer = meta.answer;
    if (!capability || !answer) continue;

    const bodyLines: string[] = [];
    const options: { key: string; text: string }[] = [];

    for (const line of lines) {
      // An HTML comment in the bank is an author's note, never a learner's.
      if (/^\s*<!--/.test(line)) continue;
      const m = line.match(OPTION_LINE);
      if (m) options.push({ key: m[1].toLowerCase(), text: m[2].trim() });
      else bodyLines.push(line);
    }

    items.push({
      id,
      week,
      capability,
      difficulty: (meta.difficulty as Difficulty) || 'recall',
      answer,
      rationale: meta.rationale || undefined,
      body: bodyLines.join('\n').trim(),
      options: options.length > 0 ? options : undefined,
    });
  }

  return items;
}

/** Full items, key included. Console and grading only — never sent to a learner. */
export async function getQuizItems(): Promise<QuizItemWithAnswer[]> {
  try {
    const files = await fs.readdir(QUIZ_DIR);
    const weekFiles = files
      .map((f) => ({ file: f, match: f.match(WEEK_FILE) }))
      .filter((x): x is { file: string; match: RegExpMatchArray } => x.match !== null)
      .sort((a, b) => Number(a.match[1]) - Number(b.match[1]));

    const items: QuizItemWithAnswer[] = [];
    const seen = new Set<string>();

    for (const { file, match } of weekFiles) {
      const raw = await fs.readFile(path.join(QUIZ_DIR, file), 'utf-8');
      for (const item of parseWeekFile(raw, Number(match[1]))) {
        // Ids key stored responses, so a duplicate across two weeks would
        // silently merge two questions' answers. Complain, and keep the first.
        if (seen.has(item.id)) {
          console.error(`quiz bank: duplicate item id "${item.id}" in ${file} — skipped`);
          continue;
        }
        seen.add(item.id);
        items.push(item);
      }
    }
    return items;
  } catch (err) {
    console.error('getQuizItems failed:', err);
    return [];
  }
}

/**
 * Strip an item to what a learner may see. The one function that decides this.
 *
 * Written as an explicit field list rather than a delete or an omit, so a new
 * teaching-only field added to the bank tomorrow is withheld by default instead
 * of leaking until someone remembers to exclude it.
 */
export const toLearnerItem = (i: QuizItemWithAnswer): QuizItem => ({
  id: i.id,
  week: i.week,
  capability: i.capability,
  difficulty: i.difficulty,
  body: i.body,
  options: i.options,
});

/**
 * Items for the quiz surface.
 *
 * `judge` items are excluded: spec §5.4 routes them to the room or the ADR
 * prompt, never to a screen with a Submit button, because they have no model
 * answer and are scored on the defence.
 */
export async function getLearnerItems(): Promise<QuizItem[]> {
  const all = await getQuizItems();
  return all.filter((i) => i.difficulty !== 'judge').map(toLearnerItem);
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export async function getQuizResponses(learnerId: string): Promise<QuizResponse[]> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('quiz_responses')
      .select('*')
      .eq('learner_id', learnerId);

    if (error) throw error;
    return (data as QuizResponse[]) ?? [];
  } catch (err) {
    console.error('getQuizResponses failed:', err);
    return [];
  }
}

export async function listAllResponsesWithLearner(): Promise<
  (QuizResponse & { learner_name: string | null; learner_email: string })[]
> {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('quiz_responses')
      .select('*, learners(name, email)')
      .order('answered_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      ...row,
      learner_name: row.learners?.name ?? null,
      learner_email: row.learners?.email ?? '',
    }));
  } catch (err) {
    console.error('listAllResponsesWithLearner failed:', err);
    return [];
  }
}

export async function submitQuizResponse(
  learnerId: string,
  itemId: string,
  answer: string,
  confidence: number,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client.from('quiz_responses').upsert(
      {
        learner_id: learnerId,
        item_id: itemId,
        answer: answer.trim(),
        confidence,
        answered_at: new Date().toISOString(),
      },
      { onConflict: 'learner_id, item_id' },
    );
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error('submitQuizResponse failed:', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Grading — code, always
// ---------------------------------------------------------------------------

/** Null for `judge` items, which are never auto-scored. */
export const isCorrect = (item: QuizItemWithAnswer, answer: string): boolean | null =>
  item.difficulty === 'judge'
    ? null
    : item.answer.toLowerCase().trim() === answer.toLowerCase().trim();

/**
 * Confident and wrong — the only dangerous state, and the characteristic failure
 * of experienced people meeting a new domain. Unsure-and-wrong is someone
 * learning normally, so it is deliberately not flagged.
 */
export const CONFIDENT = 4;
export const isConfidentlyWrong = (
  item: QuizItemWithAnswer,
  r: { answer: string; confidence: number },
): boolean => isCorrect(item, r.answer) === false && r.confidence >= CONFIDENT;

export interface OptionSpread {
  key: string;
  text: string;
  correct: boolean;
  count: number;
  /** Of the people who picked this, how many were sure. */
  confident: number;
  learners: string[];
}

export interface ItemDistribution {
  item: QuizItemWithAnswer;
  responses: number;
  correct: number;
  /** The names that open a session: who was sure and wrong. */
  confidentlyWrong: string[];
  spread: OptionSpread[];
}

/**
 * The room's answer to each question — "five picked the queue, three picked
 * direct calls" — rather than a percentage per learner, which does nothing.
 */
export function itemDistribution(
  items: QuizItemWithAnswer[],
  responses: (QuizResponse & { learner_name?: string | null; learner_email?: string })[],
): ItemDistribution[] {
  const byItem = new Map<string, typeof responses>();
  for (const r of responses) {
    const list = byItem.get(r.item_id) ?? [];
    list.push(r);
    byItem.set(r.item_id, list);
  }

  const named = (r: (typeof responses)[number]) => r.learner_name || r.learner_email || 'Unknown';

  return items
    .map((item) => {
      const rows = byItem.get(item.id) ?? [];

      const spread: OptionSpread[] = (item.options ?? []).map((o) => {
        const picked = rows.filter((r) => r.answer.toLowerCase().trim() === o.key);
        return {
          key: o.key,
          text: o.text,
          correct: item.answer.toLowerCase().trim() === o.key,
          count: picked.length,
          confident: picked.filter((r) => r.confidence >= CONFIDENT).length,
          learners: picked.map(named),
        };
      });

      return {
        item,
        responses: rows.length,
        correct: rows.filter((r) => isCorrect(item, r.answer) === true).length,
        confidentlyWrong: rows.filter((r) => isConfidentlyWrong(item, r)).map(named),
        spread,
      };
    })
    .filter((d) => d.responses > 0)
    // Most confidently wrong first — that is what needs saying out loud.
    .sort(
      (a, b) =>
        b.confidentlyWrong.length - a.confidentlyWrong.length ||
        a.item.week - b.item.week ||
        b.responses - a.responses,
    );
}
