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
  /** The heading's own words, after the `·`. Shown above the stem. */
  title?: string;
  /** The stem only. Never the distractor analysis — see parseWeekFile. */
  body: string;
  options?: { key: string; text: string }[];
}

/** The teaching-side view: the same item plus everything withheld above. */
export interface QuizItemWithAnswer extends QuizItem {
  /**
   * The key, when there is one to check against.
   *
   * OPTIONAL, and that is the format being honest rather than a gap. Most of
   * the bank is prose: "sort these six into four buckets", "name both", "give
   * three reasons". Those have a model answer a person reads, not a string a
   * function compares. Only an option marked with a tick produces an `answer`,
   * and only an item with one is ever auto-scored.
   */
  answer?: string;
  /**
   * Everything around the stem: why each distractor is attractive, what to push
   * back on, the model answer, the follow-up worth asking. `toLearnerItem` does
   * not copy this field, and that is the whole of the answer-key split.
   */
  teaching?: string;
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

const WEEK_FILE = /^week-(\d+)\.md$/;

/** `## Context and state` — the topic a run of items sits under. */
const SECTION = /^##[ \t]+(.+?)\s*$/;
/** `### Q9 · Which boundary saves the most money` — one item. */
const ITEM = /^###[ \t]+Q(\d+)[ \t]*(?:·[ \t]*(.*))?$/;
/** The line under a heading: `apply` · put src/llm.py on screen */
const DIFFICULTY = /^`(recall|apply|judge)`/;
/** `- **B.** Re-read the balance inside issue_credit ✅` */
const OPTION = /^-[ \t]+\*\*([A-Z])\.\*\*[ \t]+(.*)$/;
/** The tick that marks the key. Never reaches a learner. */
const KEY_MARK = '✅';
/** Sections that hold facilitation prose rather than items. */
const NOT_ITEMS = /^notes on running/i;

/**
 * Parse a week's bank.
 *
 * ---------------------------------------------------------------------------
 * THE FORMAT IS THE ONE THE QUESTIONS ARE WRITTEN IN
 * ---------------------------------------------------------------------------
 * This used to expect `## item-01` with `capability:` / `answer:` metadata
 * lines, which nothing in docs/teaching/quiz actually used. The real bank is
 * written as prose with a heading per question, a difficulty tag, the stem as a
 * blockquote, options as a bullet list, and the key marked with a tick — and
 * around each one, the part that makes the bank worth having: why every
 * distractor is attractive, what to push back on, what a good answer notices.
 *
 * A format that cannot hold that prose would push it into a second file, and
 * two files describing one question drift. So the parser reads the authored
 * shape rather than the other way round.
 *
 * ---------------------------------------------------------------------------
 * WHAT A LEARNER MAY SEE, AND WHERE THE LINE IS
 * ---------------------------------------------------------------------------
 * `body` gets the stem and nothing else: the blockquote, plus any fenced code
 * the question puts on screen. Every other paragraph — the distractor
 * analysis, the follow-up, the model answer — goes to `teaching`, which
 * `toLearnerItem` does not copy. The tick is stripped from the option it marks
 * before the option is stored, so the key cannot ride out inside the text a
 * learner is shown.
 *
 * Ids are `w<week>-q<n>`, not the bare `Q9` in the heading. Responses are keyed
 * on the id, and every week's file numbers from Q1.
 */
function parseWeekFile(input: string, week: number): QuizItemWithAnswer[] {
  // Normalise line endings FIRST. This repo is edited on Windows with git's
  // autocrlf on, so the same file is LF in the repository and CRLF in a
  // checkout, and every per-line regex below ends in `$`. Left unnormalised, a
  // heading fails to match, the item is dropped WITHOUT ERROR, and the bank
  // reads as empty.
  const lines = input.replace(/\r/g, '').split('\n');

  const items: QuizItemWithAnswer[] = [];
  let section = '';
  let current: QuizItemWithAnswer | null = null;

  // Buffers for the item being read.
  let stem: string[] = [];
  let teaching: string[] = [];
  let inFence = false;

  const flush = () => {
    if (!current) return;
    current.body = stem.join('\n').trim();
    current.teaching = teaching.join('\n').trim() || undefined;

    // Some questions ARE their heading: Q11 is "Which of these is not a
    // durability boundary" followed straight by four options, with no
    // blockquote at all. Dropping those for having no stem would silently lose
    // a recall item with a key — exactly the kind the quiz surface exists to
    // serve — so the title stands in as the stem.
    if (!current.body && current.options?.length && current.title) {
      current.body = current.title;
    }

    // What is left is a heading with nothing under it yet.
    if (current.body) items.push(current);
    current = null;
    stem = [];
    teaching = [];
  };

  for (const line of lines) {
    // A fence can contain anything, including something that looks like a
    // heading, so track it before any other test.
    if (/^```/.test(line)) {
      inFence = !inFence;
      if (current) stem.push(line);
      continue;
    }
    if (inFence) {
      if (current) stem.push(line);
      continue;
    }

    const item = line.match(ITEM);
    if (item) {
      flush();
      section = section || 'General';
      current = {
        id: `w${week}-q${item[1]}`,
        week,
        capability: section,
        title: (item[2] ?? '').trim() || undefined,
        difficulty: 'recall',
        body: '',
        options: undefined,
        answer: undefined,
      };
      continue;
    }

    const heading = line.match(SECTION);
    if (heading) {
      flush();
      section = heading[1].trim();
      // "Notes on running these" is facilitation prose, not a run of items.
      if (NOT_ITEMS.test(section)) section = '';
      continue;
    }

    if (!current) continue;
    if (line.trim() === '---') continue;

    const diff = line.match(DIFFICULTY);
    if (diff && !current.body && stem.length === 0 && !current.options) {
      current.difficulty = diff[1] as Difficulty;
      // The rest of that line is a facilitation note ("the one to spend time
      // on"), which is for the instructor.
      teaching.push(line);
      continue;
    }

    const opt = line.match(OPTION);
    if (opt) {
      const key = opt[1].toLowerCase();
      let text = opt[2];
      if (text.includes(KEY_MARK)) {
        current.answer = key;
        text = text.split(KEY_MARK).join('').trim();
      }
      (current.options ??= []).push({ key, text: text.trim() });
      continue;
    }

    // The stem is the blockquote. Everything else under the heading is the
    // teaching half and is withheld.
    if (/^>/.test(line)) {
      stem.push(line.replace(/^>[ \t]?/, ''));
      continue;
    }

    // A blank line inside the stem keeps its shape; a blank line once the
    // teaching prose has started belongs to that.
    if (line.trim() === '' && teaching.length === 0 && stem.length > 0) {
      stem.push('');
      continue;
    }

    teaching.push(line);
  }

  flush();
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
  title: i.title,
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
  return all.filter(isSelfServable).map(toLearnerItem);
}

/**
 * Can this item stand on a page with a Submit button and no instructor?
 *
 * Two conditions, and the second is new with the authored format:
 *
 *   not `judge`   no model answer, scored on the defence. §5.4 routes these to
 *                 the room or to an ADR prompt.
 *   has a key     an item with no ticked option has a model answer written as
 *                 prose for a person to read. Putting it behind a text box
 *                 would collect answers nothing can score and show the learner
 *                 a "correct answer" that is three paragraphs of facilitation
 *                 notes.
 *
 * Both kinds stay in the bank and stay on the console, which is where they are
 * used. This only decides what the quiz surface serves.
 */
export const isSelfServable = (i: QuizItemWithAnswer): boolean =>
  i.difficulty !== 'judge' && Boolean(i.answer) && Boolean(i.options?.length);

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

/**
 * Record an answer, once.
 *
 * AN INSERT, NOT AN UPSERT, and that is the whole design of this function.
 * The route hands back the correct answer and the rationale as soon as this
 * succeeds. An upsert on (learner_id, item_id) meant a learner could answer,
 * read the key, and send the right answer back over the top of the first
 * attempt — which does not merely flatter a score (there is no score) but
 * erases `confidentlyWrong`, the one reading the console sorts the room by and
 * the line a session is meant to open on.
 *
 * The refusal comes from the `quiz_learner_item` unique index rather than from
 * a SELECT first, for the same reason double booking is refused by a
 * constraint: two requests in flight can both pass a check, and only one of
 * them can win against an index. 23505 is Postgres's unique_violation.
 */
export async function recordFirstAnswer(
  learnerId: string,
  itemId: string,
  answer: string,
  confidence: number,
): Promise<{ ok: boolean; reason?: 'already-answered' }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    const { error } = await client.from('quiz_responses').insert({
      learner_id: learnerId,
      item_id: itemId,
      answer: answer.trim(),
      confidence,
      answered_at: new Date().toISOString(),
    });
    if (error) {
      if ((error as { code?: string }).code === '23505') {
        return { ok: false, reason: 'already-answered' };
      }
      throw error;
    }
    return { ok: true };
  } catch (err) {
    console.error('recordFirstAnswer failed:', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Grading — code, always
// ---------------------------------------------------------------------------

/**
 * Null when nothing can honestly be checked: a `judge` item, or any item whose
 * model answer is prose rather than a ticked option. Null is not "wrong" and
 * every caller has to treat it as a third state.
 */
export const isCorrect = (item: QuizItemWithAnswer, answer: string): boolean | null =>
  item.difficulty === 'judge' || !item.answer
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
          correct: item.answer?.toLowerCase().trim() === o.key,
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
