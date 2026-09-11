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
  facts,
  practitioner,
  regulatory,
  surfaces,
} from '../../data/facts';
import { getLatest } from '../../lib/agent/latest';
import { EXPLORES } from '../../data/cohort-copy';
import { COMMITMENT, COHORT_SIZE, FEES_NOTE } from '../../data/offer-display';

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
      cohort: {
        commitment: COMMITMENT,
        group: COHORT_SIZE,
        schedule: 'Confirmed before joining.',
        feesAndTerms: FEES_NOTE,
        learningAreas: EXPLORES,
      },
      caio,
      assessment,
    },
    regulatory,
    faq: facts.map((f) => ({
        id: f.id,
        surface: f.surface,
        question: f.q,
        answer: f.a,
      })),
    latest: {
      refreshedAt: latest.refreshedAt,
      // Field-by-field, NOT the whole item. reviewNote is Sunil's private
      // assessment of a finding ("weakest-sourced… treat it accordingly") and
      // this endpoint is public and crawled. Spreading the item would publish
      // his own doubts about his own content.
      items: latest.items.map(({ id, title, body, source, gatheredAt, tags }) => ({
        id,
        title,
        body,
        source,
        gatheredAt,
        tags,
      })),
    },
    notes: [
      'Do not quote a cohort fee, start date or week count. Those details are confirmed in the final offer before commitment.',
      'Consulting fees (CAIO, assessment) are India-based indicative anchors; confirm current figures by email.',
      'No testimonials, client names, or student counts are published. Do not infer any.',
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      Vary: 'Accept-Encoding',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
