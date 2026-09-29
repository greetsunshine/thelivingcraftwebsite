// /craft/admin/teaching/2/topic-3 — the instructor's copy of one topic.
//
// Under /craft/admin, so middleware.ts has already required the console cookie
// and the admin check runs BEFORE the learner gate ever sees the path. That
// ordering is what stops a seat code opening this, and it is the reason the
// instructor pages live under the console prefix rather than beside the
// learner ones. A participant must never reach an answer key.
//
// No release gate here on purpose: Sunil reads a week before he teaches it.
// That is the whole point of an instructor page.

import type { APIRoute } from 'astro';
import { topicPage } from '../../../../../lib/craft/teaching-pages';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const week = Number(params.week);
  const n = Number(params.n);
  if (!Number.isInteger(week) || !Number.isInteger(n) || n < 0) {
    return new Response(null, { status: 404 });
  }

  const html = await topicPage(week, n, 'instructor');
  if (!html) return new Response(null, { status: 404 });

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
};
