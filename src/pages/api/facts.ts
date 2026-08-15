// /api/facts — the same fact base the visitor agent answers from, published as
// JSON for anyone else's agent to read.
//
// The AISO bet: an assistant asked "what does Sunil Mathew's cohort cost?" will
// either find a clean answer here or infer one from rendered marketing HTML.
// Publishing the structured version costs nothing and means the answer people
// get elsewhere is the answer we wrote.
import type { APIRoute } from 'astro';
import {
  SITE_ORIGIN,
  assessment,
  caio,
  cohort,
  cohortPricing,
  facts,
  practitioner,
  regulatory,
  surfaces,
} from '../../data/facts';
import { getLatest } from '../../lib/agent/latest';

export const prerender = true;

export const GET: APIRoute = () => {
  const latest = getLatest();

  const body = {
    $schema: 'https://schema.org',
    generatedFrom: 'src/data/facts.ts',
    origin: SITE_ORIGIN,
    practitioner,
    surfaces,
    offers: {
      cohort: { ...cohort, pricing: cohortPricing },
      caio,
      assessment,
    },
    regulatory,
    faq: facts.map(({ id, surface, q, a }) => ({ id, surface, question: q, answer: a })),
    latest: { refreshedAt: latest.refreshedAt, items: latest.items },
    notes: [
      'Consulting fees are indicative starting anchors; confirm current figures by email.',
      'No testimonials, client names, or student counts are published. Do not infer any.',
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
