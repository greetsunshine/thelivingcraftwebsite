// The delivered cohort copy, shared by the visible page, structured data,
// public facts endpoint, /llms.txt and the visitor Q&A assistant. Keeping one
// array for every consumer prevents the programme description from drifting.

export interface Explores {
  title: string;
  body: string;
}

/**
 * "What the work explores" — module 4 of the brief's page table.
 *
 * Five areas, and deliberately NOT five modules with durations. The brief:
 * "Use validated learning areas; no invented module durations." The page this
 * replaces carried four modules with week ranges and a PT5H per section in its
 * JSON-LD; none of that is in the delivered copy, so none of it is here.
 */
export const EXPLORES: Explores[] = [
  {
    title: 'Purpose and constraints',
    body: 'Frame the task, the context and the choices the system needs to support.',
  },
  {
    title: 'Tools and authority',
    body: 'Examine what the system may do, the evidence it needs and where a person should decide.',
  },
  {
    title: 'Evaluation',
    body: 'Inspect behaviour and failures, and connect findings to a useful design change.',
  },
  {
    title: 'Reliability and cost',
    body: 'Consider uncertain results, retries, review effort and the trade-offs around the model.',
  },
  {
    title: 'Design review',
    body: 'Explain the architecture, listen to challenges and identify the next useful piece of work.',
  },
];

export interface Question {
  q: string;
  a: string;
}

/**
 * The six questions, verbatim.
 *
 * Note what the last two do NOT do: neither invents a figure, and the fees
 * answer is the delivered copy's own.
 */
export const QUESTIONS: Question[] = [
  {
    q: 'Do I need a company project?',
    a: 'No. Industry-specific cases are the default. Do not share confidential company materials in an application.',
  },
  {
    q: 'Can my employer fund my place?',
    a: 'Yes. Apply as an individual and ask for the employer-funding summary. An enterprise group programme is a separate purchase and scoping conversation.',
  },
  {
    q: 'Is there a certificate?',
    a: 'No. The focus is the capability you develop through practical work and continuous feedback.',
  },
  {
    q: 'How much independent work is involved?',
    a: 'Independent work is additional to the 30 live hours. Its amount and interval will be confirmed before joining.',
  },
  {
    q: 'What are the dates and fees?',
    a: 'Confirm the schedule, fees, payment, refund and access terms in the final offer before committing.',
  },
  {
    q: 'Can we arrange learning for a team?',
    a: 'An enterprise programme normally brings 8–10 participants together with a schedule agreed for the group. Begin with your learning objective, participant experience and industry context.',
  },
];

/** The page's own headline and standfirst, so the meta description matches it. */
export const HEADLINE = 'Design agentic systems. Guide your team.';

export const STANDFIRST =
  'Build a working agentic system with Sunil Mathew. Develop the ability to explain its design, examine its behaviour and guide the decisions behind it. 30 live hours plus independent work.';
