// /craft/admin/preview/2/topic-3 — a LEARNER page, shown to the admin, for a
// week the room cannot open yet.
//
// ---------------------------------------------------------------------------
// WHY THIS IS A SEPARATE ROUTE AND NOT A FLAG ON THE LEARNER ONE
// ---------------------------------------------------------------------------
// The obvious version is `?preview=1` on /craft/week-2/topic-3, honoured when
// the console cookie is present. It is one line shorter and it is the wrong
// shape: it puts a bypass inside the route whose whole job is to refuse, so
// every future edit to that file has to be read with "could this branch be
// reached without the cookie" in mind.
//
// Here the bypass cannot be reached at all. This path starts with /craft/admin,
// middleware.ts checks the console cookie on that prefix BEFORE the learner gate
// ever sees the path, and the learner routes keep exactly one answer for an
// unreleased week. A seat code opens nothing here — that ordering is the same
// thing that stops a participant reading the leads ledger.
//
// NO RELEASE GATE, WHICH IS THE POINT. Reviewing a week before the room can see
// it is the reason this exists. The preview bar says so on the page, because a
// learner page with no mark on it is indistinguishable from the live thing and
// that is how somebody comes to believe a week is open when it is shut.

import type { APIRoute } from 'astro';
import { topicPage, missingPage } from '../../../../../lib/craft/teaching-pages';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const week = Number(params.week);
  const n = Number(params.n);
  if (!Number.isInteger(week) || !Number.isInteger(n) || n < 0) {
    return new Response(null, { status: 404 });
  }

  const html = await topicPage(
    week,
    n,
    'learner',
    `Admin preview · the learner's copy of week ${week}, topic ${n}. Release state is not checked here.`,
    // Keep the topic chips inside the preview. The live URL 404s for exactly
    // the unreleased week this route exists to show.
    `/craft/admin/preview/${week}`,
  );
  if (!html) {
    return new Response(missingPage(week, 'learner'), {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store' },
    });
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
};
