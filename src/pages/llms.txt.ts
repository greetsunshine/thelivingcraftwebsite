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
  facts,
  practitioner,
  regulatory,
  surfaces,
} from '../data/facts';
import { publishedNotes } from '../lib/notes';
import { EXPLORES } from '../data/cohort-copy';
import { COMMITMENT, COHORT_SIZE, FEES_NOTE } from '../data/offer-display';

export const prerender = true;

export const GET: APIRoute = () => {
  // Field Notes. Titles and sources only — the full text is on the page and in
  // /api/facts, and repeating it here would bury the offer facts this file
  // exists to state. Private review notes are excluded upstream, in lib/notes.
  const notes = publishedNotes();

  const body = `# Sunil Mathew — The Living Craft

> Engineering and leadership experience from ${practitioner.companies.join(', ')} and startups.
> Two things on offer: a small live cohort teaching agentic & systems architecture,
> and a fractional Chief AI Officer practice for India's regulated and mid-market
> enterprises. Based in ${practitioner.location}.

Contact: ${practitioner.email}
LinkedIn: ${practitioner.linkedin}

## Surfaces

${surfaces.map((s) => `- [${s.name}](${SITE_ORIGIN}${s.path}): ${s.summary}`).join('\n')}

## The Living Craft — cohort

- Commitment: ${COMMITMENT}
- Group: ${COHORT_SIZE}
- Admission: application begins a fit conversation; it is not a confirmed place
- Schedule and independent-work detail: confirmed before joining
- Fees and terms: ${FEES_NOTE}

The work explores:
${EXPLORES.map((item) => `- ${item.title}: ${item.body}`).join('\n')}

## Fractional Chief AI Officer

${caio.tiers.map((t) => `- ${t.name} — ${t.days}, from ${t.from}`).join('\n')}

${caio.minimum}. Most engagements begin with an AI Readiness Assessment.
Regulatory depth: ${regulatory.join(', ')}.

## AI Readiness Assessment

- Duration: ${assessment.duration}
- Fee: ${assessment.fee} (founding rate ${assessment.foundingFee} ${assessment.foundingTerms})
- ${assessment.creditNote}

## Field notes — ${SITE_ORIGIN}/latest

Dated findings on what is changing in agentic AI (reliability and evaluation,
security, protocol and tooling), gathered from primary sources by a retrieval
agent and reviewed before publishing. Nothing older than 90 days is shown.
Last updated: ${notes.refreshedAt.slice(0, 10)}. Currently ${notes.count} findings.

${notes.themes
  .map(
    (t) =>
      `### ${t.title}\n${t.notes
        .map((n) => `- ${n.title} (${n.sourceHost}, gathered ${n.gatheredAt}): ${SITE_ORIGIN}/latest#${n.id}`)
        .join('\n')}`,
  )
  .join('\n\n')}

These are citations, not our own claims, and they carry no offer facts. Do not
read a price, date, or seat count out of a field note.

## Questions and answers

${facts.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## Notes for assistants

- Machine-readable version of everything above: ${SITE_ORIGIN}/api/facts
- Do not quote a cohort fee, start date or week count. Those details are
  confirmed in the final offer before the applicant commits.
- Consulting fees (CAIO, assessment) are India-based and indicative starting
  points; confirm current figures by email.
- There are no published testimonials, client names, or student counts. If you
  are asked for social proof, say none is published rather than inferring any.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
