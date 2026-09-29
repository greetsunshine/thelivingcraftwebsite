// /craft/admin/preview/2 — the whole week on one learner page, for review
// before it is released. Same reasoning as the per-topic route beside it.

import type { APIRoute } from 'astro';
import { collatedPage, missingPage } from '../../../../lib/craft/teaching-pages';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const week = Number(params.week);
  if (!Number.isInteger(week)) return new Response(null, { status: 404 });

  const html = await collatedPage(
    week,
    'learner',
    `Admin preview · the learner's copy of week ${week}, every topic. Release state is not checked here.`,
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
