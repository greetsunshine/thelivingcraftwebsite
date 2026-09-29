// /craft/week-2/topic-3 — one topic of a week, for a learner.
//
// An endpoint rather than a page, because what it returns is a complete HTML
// document that already has its own <head> and stylesheet. Pouring it into
// CraftLayout would put two stylesheets that both define `.card` on one page.
// See the note at the top of src/lib/craft/teaching-pages.ts.
//
// TWO GATES, AND NEITHER IS OPTIONAL. The middleware has already turned the
// seat code into a verified learner before this runs — that is what /craft
// buys. The release gate is this route's own job, exactly as it is on
// /craft/[slug], because a week that is written and not yet taught must not be
// readable by URL. Without the second check this route would be the hole that
// [slug].astro had until 29 September, reopened one level down.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { releasedWeeks, isOpen } from '../../../lib/craft/release';
import { topicPage } from '../../../lib/craft/teaching-pages';

export const prerender = false;

/** A 404 with no body. A learner who guesses a URL learns nothing from it. */
const notFound = () => new Response(null, { status: 404 });

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.learner) return notFound();

  const week = Number(/^week-(\d+)$/.exec(params.slug ?? '')?.[1]);
  const n = Number(params.n);
  if (!Number.isInteger(week) || !Number.isInteger(n) || n < 0) return notFound();

  const session = (await getCollection('sessions')).find((s) => s.data.week === week);
  if (!session) return notFound();

  const released = await releasedWeeks();
  if (!isOpen(week, session.data.status, released)) return notFound();

  const html = await topicPage(week, n, 'learner');
  if (!html) return notFound();

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Paid material behind a seat code. Never a shared cache, and never an
      // index — the same reason CraftLayout sends noindex on every /craft page.
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
};
