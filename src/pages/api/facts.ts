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
  publicCohortPricing,
  facts,
  practitioner,
  regulatory,
  surfaces,
} from '../../data/facts';
import { getLatest } from '../../lib/agent/latest';

const REGION_KEYS = ['india', 'dubai', 'australia'] as const;
import { EXPLORES } from '../../data/cohort-copy';

// NOT prerendered: the response depends on ?region=. PR7 set this to true when
// the endpoint withheld every figure and so had no per-request state. It reads
// the region again now, and a prerendered copy would answer "no region given"
// to every caller while looking like it worked.
export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const latest = getLatest();

  // Cohort pricing is regional and the rates aren't comparable across regions.
  // Publishing all three invites an Australian buyer to ask for the India rate,
  // so a figure is returned only when a region is named — and only for a region
  // whose rate is published at all (regions.ts -> publicPrice). Reading from
  // publicCohortPricing rather than cohortPricing is what stops an unpublished
  // figure reaching a crawler through the back door.
  const asked = (url.searchParams.get('region') ?? '').toLowerCase();
  const region = (REGION_KEYS as readonly string[]).includes(asked) ? asked : null;
  const pricing = region
    ? publicCohortPricing.filter((p) => p.region.toLowerCase() === region)
    : null;
  const withheld = !!region && pricing!.length === 0;

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
        pricingNote: withheld
          ? `The cohort runs in ${region}, but that rate is not published. Do not state, estimate, or convert one, and do not substitute another region's rate — they are not comparable. Pricing there is shared on application.`
          : region
            ? `Rate for ${region}. Do not quote this to someone in another region.`
            : 'No region given, so no figure is returned. Add ?region=india|dubai|australia, or ask which region the person is in.',
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
      'Cohort length, seat count and start date are published — quote them. The FEE is per region: quote it only for a region that has been named, and only from the pricing block above. Never convert between regions or offer one region\'s rate as a guide for another.',
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
