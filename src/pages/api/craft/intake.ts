// Save the intake questionnaire.
//
// Reachable only through the middleware's craft gate, so there is no auth check
// here and no learner id in the body: `locals.learner` is the verified seat,
// re-read from the database on this very request. A learner cannot post as
// somebody else because they cannot name somebody else.
//
// UNLIKE api/lead.ts, this endpoint tells the truth about failure. That one is
// fire-and-forget because Web3Forms already holds the lead and a lost row costs
// nothing the inbox does not still have. Here the row is the only copy, so a
// swallowed error would leave a learner believing they had submitted. Every
// failure path below returns a status the page can act on.

import type { APIRoute } from 'astro';
import { missingAnswers, parseAnswers, saveIntake } from '../../../lib/craft/intake';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
  });

export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  // Belt and braces. The gate guarantees this, but an endpoint that assumes a
  // populated local and gets undefined would write a row with a null learner.
  if (!learner) return json({ error: 'Not signed in.' }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Could not read that submission.' }, 400);
  }

  const submit = (body as Record<string, unknown>)?.submit === true;
  const answers = parseAnswers((body as Record<string, unknown>)?.answers);

  // Saving a draft is always allowed, however empty. Submitting is not: an
  // incomplete intake that reads as finished is worse than an obvious gap,
  // because Sunil tunes the room off these answers.
  const missing = missingAnswers(answers);
  if (submit && missing.length > 0) {
    return json(
      {
        error: `${missing.length} question${missing.length === 1 ? ' is' : 's are'} still unanswered.`,
        missing,
      },
      422,
    );
  }

  const result = await saveIntake({
    learner: {
      id: learner.id,
      email: learner.email,
      name: learner.name,
      cohort: learner.cohort,
    },
    answers,
    submit,
  });

  if (!result.ok) {
    return json(
      {
        error:
          'Your answers could not be saved. Nothing has been recorded — please try again, ' +
          'and email apply@thelivingcraft.ai if it keeps failing.',
      },
      503,
    );
  }

  return json({ ok: true, submitted: Boolean(result.submittedAt), submittedAt: result.submittedAt });
};
