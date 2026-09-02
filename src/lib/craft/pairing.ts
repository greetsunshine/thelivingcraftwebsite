// The quiz/ADR pairing (spec §5.5).
//
// The quiz rehearses a decision in the abstract, the assignment forces it, the
// ADR records it. Then one comparison neither artefact gives alone:
//
//     Did the ADR decision match the quiz answer?
//
// Someone who picks the right trade-off on Tuesday and does the opposite on
// Friday has hit the exact gap the programme exists to close — knowing the
// principle, not yet reaching for it under pressure.
//
// COMPUTED BY CODE, NOT BY A MODEL. §4 is explicit: the model never grades an
// ADR. So the lean of an ADR is measured the same way the visitor agent's
// retrieval works — lexical overlap against each option's own words, using the
// same scorer. That is weak on purpose, and the weakness is handled honestly:
// when no option clearly wins, the verdict is 'unclear' and says so, rather
// than reporting a coin-flip as a finding. An 'unclear' row is not a failure of
// the check; it is the check refusing to invent a signal.

import { tokenize, stem, score } from '../agent/knowledge';
import { isCorrect, type QuizItemWithAnswer, type QuizResponse } from './quiz';
import type { Submission } from './submissions';

export type Verdict =
  | 'aligned-correct'   // right on both — the principle is reachable under pressure
  | 'aligned-wrong'     // wrong on both — a consistent belief, and the useful kind of wrong
  | 'knew-not-applied'  // right on the quiz, built the other thing. The gap.
  | 'applied-not-known' // wrong on the quiz, built the right thing anyway
  | 'unclear';          // the ADR does not lean far enough to say

export const VERDICT_LABEL: Record<Verdict, string> = {
  'aligned-correct': 'Held under pressure',
  'aligned-wrong': 'Consistently off',
  'knew-not-applied': 'Knew it, did not reach for it',
  'applied-not-known': 'Built it right, could not name it',
  unclear: 'Not enough signal',
};

export const VERDICT_NOTE: Record<Verdict, string> = {
  'aligned-correct': 'Picked the trade-off on the quiz and the record leans the same way.',
  'aligned-wrong': 'The quiz answer and the record agree with each other and not with the key — a belief to address, not a slip.',
  'knew-not-applied': 'The exact gap the programme exists to close: the principle is known and was not reached for.',
  'applied-not-known': 'The build is right and the vocabulary has not caught up. Usually the easier of the two to fix.',
  unclear: 'The record does not lean far enough toward any option to compare. No claim made.',
};

/**
 * The Decision and Alternatives sections carry the choice. Context and
 * Consequences describe the situation and the cost, and matching against them
 * pulls in whatever the brief happened to say.
 */
function decisionText(markdown: string): string {
  const grab = (heading: string) => {
    const m = markdown.match(new RegExp(`## ${heading}\\n+([\\s\\S]*?)(?=\\n##|$)`, 'i'));
    return m ? m[1].trim() : '';
  };
  return `${grab('Decision')}\n${grab('Alternatives')}`.trim();
}

/**
 * How far the record leans toward one option over the runner-up. Below this,
 * the answer is "no signal" — two options a point apart on prose overlap is
 * noise, and reporting it as a finding is the invented confidence §10 cuts.
 */
const MIN_MARGIN = 3;
const MIN_LEAN = 4;

export interface Pairing {
  item: QuizItemWithAnswer;
  response: QuizResponse;
  /** The option the record reads closest to, or null when nothing wins. */
  leansTo: string | null;
  leanScore: number;
  margin: number;
  quizCorrect: boolean | null;
  verdict: Verdict;
}

export function pairOne(
  item: QuizItemWithAnswer,
  response: QuizResponse,
  submission: Submission,
): Pairing {
  const text = decisionText(submission.adr_markdown);
  const q = tokenize(text).map(stem);

  const ranked = (item.options ?? [])
    .map((o) => ({ key: o.key, n: score(q, o.text, 1) }))
    .sort((a, b) => b.n - a.n);

  const top = ranked[0];
  const runnerUp = ranked[1];
  const margin = top && runnerUp ? top.n - runnerUp.n : (top?.n ?? 0);

  const leansTo = top && top.n >= MIN_LEAN && margin >= MIN_MARGIN ? top.key : null;
  const quizCorrect = isCorrect(item, response.answer);

  let verdict: Verdict = 'unclear';
  if (leansTo !== null && quizCorrect !== null) {
    const adrRight = leansTo === item.answer.toLowerCase().trim();
    if (quizCorrect && adrRight) verdict = 'aligned-correct';
    else if (!quizCorrect && !adrRight) verdict = leansTo === response.answer.toLowerCase().trim() ? 'aligned-wrong' : 'unclear';
    else if (quizCorrect && !adrRight) verdict = 'knew-not-applied';
    else verdict = 'applied-not-known';
  }

  return {
    item,
    response,
    leansTo,
    leanScore: top?.n ?? 0,
    margin,
    quizCorrect,
    verdict,
  };
}

export interface LearnerPairing {
  learnerId: string;
  name: string | null;
  email: string;
  weeks: {
    week: number;
    submission: Submission | null;
    pairings: Pairing[];
  }[];
}

/**
 * Build the comparison for every learner, week by week.
 *
 * An item's week comes from the item itself now (its file in the bank), not
 * from reverse-mapping capability → session.topics. That mapping was ambiguous
 * as soon as two weeks shared a capability, and the thirteen capabilities are
 * revisited across six weeks by design.
 */
export function buildPairings(input: {
  items: QuizItemWithAnswer[];
  responses: (QuizResponse & { learner_name?: string | null; learner_email?: string })[];
  submissions: (Submission & { learner_name: string | null; learner_email: string })[];
}): LearnerPairing[] {
  const { items, responses, submissions } = input;

  const itemById = new Map(items.map((i) => [i.id, i]));

  const learners = new Map<string, LearnerPairing>();
  const ensure = (id: string, name: string | null, email: string) => {
    let l = learners.get(id);
    if (!l) {
      l = { learnerId: id, name, email, weeks: [] };
      learners.set(id, l);
    }
    return l;
  };

  for (const s of submissions) {
    const l = ensure(s.learner_id, s.learner_name, s.learner_email);
    if (!l.weeks.some((w) => w.week === s.week)) {
      l.weeks.push({ week: s.week, submission: s, pairings: [] });
    }
  }

  for (const r of responses) {
    const item = itemById.get(r.item_id);
    if (!item || item.difficulty === 'judge') continue;

    const l = learners.get(r.learner_id);
    if (!l) continue; // no submitted ADR at all — nothing to compare against

    const bucket = l.weeks.find((w) => w.week === item.week);
    if (!bucket?.submission) continue;

    bucket.pairings.push(pairOne(item, r, bucket.submission));
  }

  for (const l of learners.values()) {
    l.weeks.sort((a, b) => a.week - b.week);
  }

  return [...learners.values()].sort((a, b) =>
    (a.name ?? a.email).localeCompare(b.name ?? b.email),
  );
}

/** The room's tally. Ordered so the gap the programme targets reads first. */
export function verdictTally(learners: LearnerPairing[]): { verdict: Verdict; count: number }[] {
  const counts = new Map<Verdict, number>();
  for (const l of learners) {
    for (const w of l.weeks) {
      for (const p of w.pairings) counts.set(p.verdict, (counts.get(p.verdict) ?? 0) + 1);
    }
  }

  const order: Verdict[] = [
    'knew-not-applied',
    'aligned-wrong',
    'applied-not-known',
    'aligned-correct',
    'unclear',
  ];
  return order.filter((v) => counts.has(v)).map((v) => ({ verdict: v, count: counts.get(v)! }));
}
