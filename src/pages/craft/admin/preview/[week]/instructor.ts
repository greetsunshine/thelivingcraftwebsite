// /craft/admin/preview/4/instructor — the whole week on one INSTRUCTOR page.
//
// The learner preview beside it (/craft/admin/preview/4) shows the learner's copy
// of every topic. The instructor's copy existed only one topic at a time, under
// /craft/admin/teaching/4/topic-N, so reading a week before teaching it meant
// opening five tabs. This serves the collated instructor page as stored.
//
// Under /craft/admin, so middleware.ts has already required the console cookie,
// and the admin check runs before the learner gate sees the path. A seat code
// cannot open it. That matters more here than anywhere: this page holds every
// answer key. No release gate, for the same reason as the topic route: the
// instructor reads a week before it is taught.

import type { APIRoute } from 'astro';
import { collatedPage, missingPage } from '../../../../../lib/craft/teaching-pages';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const week = Number(params.week);
  if (!Number.isInteger(week)) return new Response(null, { status: 404 });

  const html = await collatedPage(
    week,
    'instructor',
    `Admin preview · the instructor's copy of week ${week}, every topic, with the answer keys.`,
  );
  if (!html) {
    return new Response(missingPage(week, 'instructor'), {
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
