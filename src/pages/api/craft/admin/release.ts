// Open or shut one week for the whole room.
//
// Under /api/craft/admin, so middleware.ts has already checked the console
// cookie — the admin prefix is tested before the learner gate, which is the
// load-bearing order described in CLAUDE.md. Nothing here re-checks auth, and
// nothing here should: a second check in one handler is how the two drift.
//
// The response says what the state IS afterwards rather than "ok", so the
// console can redraw one row from the reply instead of reloading the page and
// guessing.

import type { APIRoute } from 'astro';
import { release, unrelease, releasedWeeks } from '../../../../lib/craft/release';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Expected a JSON body.' }, 400);
  }

  const { week, open, note } = (body ?? {}) as { week?: unknown; open?: unknown; note?: unknown };

  // Week 0 is the pre-work and is never gated, so it is not releasable either.
  // Accepting it would write a row that nothing reads.
  if (typeof week !== 'number' || !Number.isInteger(week) || week < 1 || week > 6) {
    return json({ error: 'week must be a whole number from 1 to 6.' }, 400);
  }
  if (typeof open !== 'boolean') {
    return json({ error: 'open must be true or false.' }, 400);
  }

  const ok = open
    ? await release(week, typeof note === 'string' && note.trim() ? note.trim() : undefined)
    : await unrelease(week);

  if (!ok) {
    return json(
      { error: 'The session_releases table is not answering. Run supabase/schema.sql.' },
      503,
    );
  }

  const released = await releasedWeeks();
  return json({ week, open: released.has(week), released: [...released].sort((a, b) => a - b) });
};

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
