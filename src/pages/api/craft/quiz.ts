// Recording one answer, and only then revealing the key.
//
// THIS ROUTE RE-APPLIES EVERY GATE THE QUIZ PAGE APPLIES, because it is the
// third surface onto the same bank and the other two cannot protect it. The
// page decides what to render; this decides what may be answered, and a
// hand-rolled POST never goes through the page. Same reasoning as pulse.ts and
// checkpoint.ts, both of which rebuild their window here rather than trusting
// the form — see the header of either.
//
// Three gates, and each one closes a different hole:
//
//   the check is open     `?week=N` is refused by the page unless that week's
//                         check has opened. Without the same test here, week
//                         6's items can be answered in week 2 — which does not
//                         leak the key so much as spend the questions before
//                         the teaching that makes them a calibration.
//   not a `judge` item    getLearnerItems() excludes them and this used to
//                         read getQuizItems(), which does not. A judge item
//                         has an `answer` in the bank like any other, so the
//                         id alone was enough to read one back.
//   answered once         the reveal below is the whole point of the route,
//                         and an answer that can be rewritten afterwards is
//                         not a calibration signal. It is also the signal the
//                         console sorts the room on (`confidentlyWrong`), so a
//                         second attempt does not just flatter the learner, it
//                         removes the line a session is meant to open with.
//
// The third is enforced by the unique index on (learner_id, item_id) rather
// than by a SELECT first, for the same reason the booking constraint is in
// Postgres: two requests in flight both pass a check and only one can lose a
// race against an index.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getQuizItems, recordFirstAnswer, isCorrect } from '../../../lib/craft/quiz';
import { weeklyChecks } from '../../../lib/craft/checks';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const { item_id, answer, confidence } = payload;

  if (typeof item_id !== 'string' || !item_id) return json({ error: 'Missing fields' }, 400);
  if (typeof answer !== 'string' || answer.trim() === '') return json({ error: 'Missing fields' }, 400);
  if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) {
    return json({ error: 'Missing fields' }, 400);
  }

  const items = await getQuizItems();
  const item = items.find((i) => i.id === item_id);
  if (!item) return json({ error: 'Item not found' }, 404);

  // A judge item is scored on the defence, in the room or in an ADR. It has no
  // Submit button anywhere, so a request naming one is not a learner's mistake.
  // Answered with the same 404 as an unknown id, so the reply cannot be used to
  // work out which ids exist in the bank.
  if (item.difficulty === 'judge') return json({ error: 'Item not found' }, 404);

  const sessions = await getCollection('sessions');
  const checks = weeklyChecks(
    sessions.map((s) => ({
      week: s.data.week,
      title: s.data.title,
      quiz: s.data.quiz,
      runOfShow: s.data.runOfShow,
      startsAt: s.data.startsAt,
      endsAt: s.data.endsAt,
    })),
    items,
    [],
  );

  const check = checks.find((c) => c.week === item.week);
  if (!check?.isOpen) {
    return json({ error: "That check has not opened yet. It opens in the session it belongs to." }, 409);
  }

  const result = await recordFirstAnswer(learner.id, item_id, answer, confidence);

  if (result.reason === 'already-answered') {
    return json(
      { error: 'You have already answered this one. Ask Sunil if you need it reopened.' },
      409,
    );
  }
  if (!result.ok) return json({ error: 'Failed to record response' }, 500);

  // The key goes out only after the answer is committed AND frozen. Both halves
  // matter: committing alone still allows a second POST with what was revealed.
  return json(
    {
      success: true,
      correct: isCorrect(item, answer),
      correctAnswer: item.answer,
      rationale: item.rationale,
      difficulty: item.difficulty,
    },
    200,
  );
};
