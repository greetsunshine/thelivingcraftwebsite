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
  cohortPriceAnswer,
  facts,
  practitioner,
  regulatory,
  surfaces,
} from '../../data/facts';
import { getLatest } from '../../lib/agent/latest';

// On-demand: the response varies by ?region=, so it can't be baked at build.
export const prerender = false;

const REGION_KEYS = ['india', 'dubai', 'australia'] as const;

export const GET: APIRoute = ({ url }) => {
  const latest = getLatest();

  // Cohort pricing is regional and the rates aren't comparable across regions.
  // Publishing all three invites an Australian buyer to ask for the India rate,
  // so a figure is returned only when a region is named.
  const asked = (url.searchParams.get('region') ?? '').toLowerCase();
  const region = (REGION_KEYS as readonly string[]).includes(asked) ? asked : null;
  const pricing = region
    ? cohortPricing.filter((p) => p.region.toLowerCase() === region)
    : null;

  const body = {
    $schema: 'https://schema.org',
    generatedFrom: 'src/data/facts.ts',
    origin: SITE_ORIGIN,
    practitioner,
    surfaces,
    offers: {
      cohort: {
        ...cohort,
        pricingIsRegional: true,
        regionsServed: cohortPricing.map((p) => p.region),
        // Populated only when ?region= names one. Null means "ask which region".
        pricing,
        pricingNote: region
          ? `Rate for ${region}. Do not quote this to someone in another region.`
          : 'No region given, so no figure is returned. Add ?region=india|dubai|australia, or ask which region the person is in.',
      },
      caio,
      assessment,
    },
    regulatory,
    // Regional facts carry a placeholder answer; resolve it for the asked
    // region, or drop it entirely when no region is known.
    faq: facts
      .filter((f) => !f.regional || region)
      .map((f) => ({
        id: f.id,
        surface: f.surface,
        question: f.q,
        answer: f.regional ? cohortPriceAnswer(region as never) : f.a,
      })),
    latest: { refreshedAt: latest.refreshedAt, items: latest.items },
    notes: [
      'Cohort pricing is regional. Quote only the asker\'s own region, never a comparison, and never convert currencies.',
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
