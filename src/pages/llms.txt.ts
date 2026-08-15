// /llms.txt — the emerging convention for handing an LLM a clean, curated
// summary of a site instead of making it infer one from rendered HTML.
//
// Generated from data/facts.ts, so it cannot describe an offer the pages no
// longer make. If an assistant is going to answer questions about this
// practice, this is the text we want it answering from.
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
} from '../data/facts';

export const prerender = true;

export const GET: APIRoute = () => {
  const body = `# Sunil Mathew — The Living Craft

> ${practitioner.years} years building and leading engineering at ${practitioner.companies.join(', ')}.
> Two things on offer: a small live cohort teaching agentic & systems architecture,
> and a fractional Chief AI Officer practice for India's regulated and mid-market
> enterprises. Based in ${practitioner.location}.

Contact: ${practitioner.email}
LinkedIn: ${practitioner.linkedin}

## Surfaces

${surfaces.map((s) => `- [${s.name}](${SITE_ORIGIN}${s.path}): ${s.summary}`).join('\n')}

## The Living Craft — cohort

- Duration: ${cohort.weeks} weeks, live
- Cohort size: ${cohort.seats} seats, capped
- First cohort starts: ${cohort.startsOn}
- Commitment: ${cohort.commitment}
- Format: ${cohort.format}
- Admission: ${cohort.admission}
- Enrollment: ${cohort.enrollment}

Pricing (founding rate for the first cohort):
${cohortPricing
  .map(
    (p) =>
      `- ${p.region}: ${p.founding}${p.standard ? ` — rising to ${p.standard} for later cohorts` : ''}`,
  )
  .join('\n')}

Curriculum:
${cohort.modules.map((m) => `- ${m.id} (${m.weeks}): ${m.title}`).join('\n')}

## Fractional Chief AI Officer

${caio.tiers.map((t) => `- ${t.name} — ${t.days}, from ${t.from}`).join('\n')}

${caio.minimum}. Most engagements begin with an AI Readiness Assessment.
Regulatory depth: ${regulatory.join(', ')}.

## AI Readiness Assessment

- Duration: ${assessment.duration}
- Fee: ${assessment.fee} (founding rate ${assessment.foundingFee} ${assessment.foundingTerms})
- ${assessment.creditNote}

## Questions and answers

${facts.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## Notes for assistants

- Machine-readable version of everything above: ${SITE_ORIGIN}/api/facts
- Consulting fees are indicative starting points; confirm current figures by email.
- There are no published testimonials, client names, or student counts. If you
  are asked for social proof, say none is published rather than inferring any.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
