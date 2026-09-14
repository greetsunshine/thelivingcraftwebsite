import type { APIRoute } from 'astro';
import { saveAdr, ADR_MAX_CHARS } from '../../../lib/craft/submissions';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Two actions on one route: save a draft, or submit. Submitting freezes the
// text — see the header comment in src/lib/craft/submissions.ts.
export const POST: APIRoute = async ({ request, locals }) => {
  const learner = locals.learner;
  if (!learner) return new Response(null, { status: 401 });

  try {
    const { week, adr_markdown, repo_url, submit } = await request.json();

    if (!Number.isInteger(week) || week < 1 || week > 6) {
      return json({ error: 'Invalid week' }, 400);
    }
    if (!adr_markdown || typeof adr_markdown !== 'string' || adr_markdown.trim() === '') {
      return json({ error: 'Fill in the record before saving.' }, 400);
    }

    const result = await saveAdr(learner.id, week, adr_markdown, repo_url, Boolean(submit));

    if (!result.ok) {
      if (result.reason === 'locked') {
        return json(
          { error: 'This one is already submitted. Ask Sunil if you need it reopened.' },
          409,
        );
      }
      if (result.reason === 'too-long') {
        return json(
          { error: `One page, please — that is ${ADR_MAX_CHARS} characters at most.` },
          400,
        );
      }
      return json({ error: 'Could not save that. Try again.' }, 500);
    }

    return json({ success: true, submitted: Boolean(submit) }, 200);
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
};
