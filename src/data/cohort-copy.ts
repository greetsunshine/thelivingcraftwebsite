// The delivered cohort copy, shared by the visible page, structured data,
// public facts endpoint, /llms.txt and the visitor Q&A assistant. Keeping one
// array for every consumer prevents the programme description from drifting.
//
// This file must NOT import facts.ts. facts.ts imports EXPLORES from here, so
// the dependency runs one way only: copy is the lower layer, and facts.ts
// builds the structured offer on top of it. An import back would be a cycle,
// and an ESM cycle here fails at module-evaluation time with "cannot access
// before initialization" rather than at type-check time.

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

export interface Persona {
  k: string;
  title: string;
  body: string;
}

/**
 * "Who this is for" — three personas, restored from the pre-rebuild page
 * (git: 845ca99^:src/components/ProgramPage.astro). The wording already
 * matched the `cohort-who` fact in facts.ts before this was split into cards,
 * so nothing here is new copy — it is the same audience description, broken
 * into the three roles it always named.
 */
export const PERSONAS: Persona[] = [
  {
    k: '// 01',
    title: 'Tech Leads & Staff Engineers',
    body: 'You make the architectural calls your team builds on. You want them to still look right in two years.',
  },
  {
    k: '// 02',
    title: 'Senior Engineering Managers & Architects',
    body: 'You set technical direction for agentic and distributed systems, where the failure modes are subtle and expensive.',
  },
  {
    k: '// 03',
    title: 'Senior Engineering Leaders & Directors',
    body: 'You own outcomes across teams. Titles differ across companies. What you need is the depth to back the decisions that matter.',
  },
];

export interface Transformation {
  letter: string;
  title: string;
  body: string;
}

/**
 * "The transformation" — six outcome statements, restored from the same
 * pre-rebuild page. A–E already exist as `cohort.outcomes` in facts.ts, fed to
 * JSON-LD and the Q&A agent; F does not appear there, but it is not an
 * invented metric — it is previously-published, previously-approved copy
 * (a value statement, not a factual claim needing provenance), carried
 * verbatim rather than reworded. Kept separate from `cohort.outcomes` so this
 * page's copy and the machine-readable outcomes list can each change without
 * moving the other.
 */
export const TRANSFORMATION: Transformation[] = [
  {
    letter: 'A',
    title: 'Design agentic systems that hold up in production',
    body: 'Not demos. Architectures with bounded failure, observability, and a cost you can defend.',
  },
  {
    letter: 'B',
    title: "Prove your system works, instead of hoping it does",
    body: 'Build the evaluation harnesses, test sets, and quality gates that turn "it works" into a measurement. Catch regressions before they ship.',
  },
  {
    letter: 'C',
    title: "Engineer for a model that won't behave the same way twice",
    body: 'Guardrails, fallbacks, and a clear view of how much damage one failure can do. This is reliability for systems that are probabilistic by nature.',
  },
  {
    letter: 'D',
    title: 'Break your own system before someone else does',
    body: 'Threat-model it, red-team it for prompt injection and data exfiltration, and hold the line between instruction and data.',
  },
  {
    letter: 'E',
    title: 'Govern an AI-native team',
    body: 'Risk-tiered review depth, accountability for the code the AI wrote, and the judgment for where the human directs and where the human steps back.',
  },
  {
    letter: 'F',
    title: 'Make the irreversible calls with confidence',
    body: 'Read trade-offs, scale, and consistency the way a craftsperson reads the grain of wood. You know where it splits before you cut.',
  },
];

export interface ModuleDetail {
  id: string;
  weeks: string;
  title: string;
  body: string;
}

/**
 * "Inside the program" — the four modules, and THE ONLY DEFINITION OF THEM.
 *
 * `cohort.modules` in facts.ts is derived from this array, so the JSON-LD
 * Course node, /api/facts, /llms.txt and the visible page all read one list.
 * They were two lists until 16 September 2026: the same four ids, weeks and
 * titles typed out in both files, which typechecks perfectly while the page
 * goes stale the moment a title changes in facts.ts.
 *
 * The prose lives here and not in facts.ts on purpose. facts.ts is the
 * structured offer — the fields a crawler and the assistant read. A paragraph
 * of page copy is not one of those, which is why `cohortModules()` below hands
 * facts.ts the three structured fields and drops `body`.
 */
export const MODULES: ModuleDetail[] = [
  {
    id: 'M1',
    weeks: 'Week 1',
    title: 'Foundations of durable architecture',
    body: 'How agentic systems actually fail, and how to design so that the failure is bounded, visible, and boring. These are the mental models the rest of the program builds on.',
  },
  {
    id: 'M2',
    weeks: 'Weeks 2–4',
    title: "Agentic systems you'd put your name on",
    body: 'Multi-agent orchestration, RAG, and tool boundaries. Then the part most courses skip. Evaluation harnesses that prove it works. Reliability engineering for systems that do not behave the same way twice. And attacking your own system, to test it for prompt injection and data theft. Demos are easy. Systems you would run in production are not.',
  },
  {
    id: 'M3',
    weeks: 'Week 5',
    title: 'Scale, consistency & the irreversible trade-offs',
    body: 'Reading the CAP trade-off in real systems. Capacity and cost under load. And the architectural decisions you cannot take back, made with the judgment to know which way they will break.',
  },
  {
    id: 'M4',
    weeks: 'Week 6',
    title: 'Your system, reviewed in the room',
    body: 'You bring a real architecture. We pressure-test it together as a cohort. We cover the design, the failure modes, the evaluation strategy, and the governance around it. That governance means review depth matched to risk, and accountability for the code the AI wrote. This is a senior review the way it should feel.',
  },
];

/** The structured half of the module list, for `cohort.modules` in facts.ts. */
export const cohortModules = (): Array<Pick<ModuleDetail, 'id' | 'weeks' | 'title'>> =>
  MODULES.map(({ id, weeks, title }) => ({ id, weeks, title }));

export interface Takeaway {
  k: string;
  title: string;
  body: string;
}

/** "What you leave with" — artifacts, not just capability. Restored verbatim. */
export const LEAVE_WITH: Takeaway[] = [
  {
    k: '// your system',
    title: 'Your own architecture, pressure-tested',
    body: 'Reviewed with the cohort, with a concrete path to fix what we find.',
  },
  {
    k: '// toolkit',
    title: 'A reusable toolkit you keep',
    body: 'An evaluation rubric, a threat-model checklist, a reliability/SLO template, and a review-and-governance framework your team can adopt on Monday.',
  },
  {
    k: '// the room',
    title: 'A small circle of senior peers',
    body: 'And lifetime access to the cohort room, long after the six weeks are done.',
  },
];

export interface Experience {
  k: string;
  title: string;
  body: string;
}

/**
 * "Live experience" — restored, with one deliberate omission. The old band
 * also carried 100M+ users served, 150 engineers led, ~31 billion weekly
 * executions and 300+ products modernised; an 11 September QA finding removed
 * that class of claim from every public surface for lacking provenance in
 * this repository (docs/cohort-pipeline/RESUME.md), and it does not come back
 * here. The mentoring/coaching/training counts below are a different claim —
 * flagged in the same finding as awaiting a decision, not as unsourced, and
 * approved for republication on 15 September 2026. "Shipping now" reuses the
 * wording already approved in the Sunil section rather than restating it.
 */
export const LIVE_EXPERIENCE: Experience[] = [
  {
    k: '// mentored',
    title: '100+ senior engineers, architects & EMs',
    body: 'Mentored and grown across global organisations. These are the people who now run the systems.',
  },
  {
    k: '// coached',
    title: '100+ engineers coached',
    body: 'One-on-one and in groups, from strong individual contributors toward real technical leadership.',
  },
  {
    k: '// taught',
    title: '~100 senior leaders & directors trained',
    body: 'Ran classes on agentic systems and agentic architectures for senior engineering leaders and directors driving the shift to AI.',
  },
  {
    k: '// built',
    title: 'Hired & grew engineering teams',
    body: 'Built and scaled high-performing teams across the US, UK, China, and India.',
  },
  {
    k: '// shipping now',
    title: 'Building an agentic-AI system, as a startup',
    body: 'He is also building an agentic-AI product of his own, so what you learn is current practice rather than a memory of one.',
  },
  /*
   * NO founding-rate card here, removed 16 September 2026. Two reasons, and
   * the second is the one that matters.
   *
   *   1. This section is Sunil's track record. A rate is not track record.
   *   2. "That rate will not return" is a scarcity device, and the cohort
   *      page's own header note (CohortPage.astro, WHAT IS NOT ON THIS PAGE)
   *      says scarcity stays off. It also rendered for Dubai and Australia,
   *      whose publicPrice is off, so those visitors read a claim about a
   *      figure the same page refuses to show them.
   *
   * The price card already tells every region that the founding rate rises
   * for the cohorts that follow, with no "will not return" clause. Nothing
   * was lost by cutting this.
   */
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
  {
    q: 'Is this worth it over a recorded course?',
    a: "If you want the patterns, a book covers them — they are common knowledge now. This is for the judgment that sits on top of the patterns: live, on your real systems, from someone who has been accountable for the outcome at scale. You are not buying videos. You are buying direct attention and twenty-six years of hard-won judgment.",
  },
  {
    q: 'What does my team get out of it?',
    a: 'The frameworks come home with you: an evaluation rubric, a threat model, a reliability and review-and-governance template. You do not just leave more capable; your team inherits the discipline.',
  },
  {
    q: 'I’m strong but not "staff level." Should I apply?',
    a: "Apply. Seniority on paper matters less than whether you have shipped something you then had to live with. The application is how that gets read.",
  },
];

/**
 * The page's own headline and standfirst. HEADLINE is the hero h1 and the
 * meta title. STANDFIRST is the meta description and the Course node's
 * description in the JSON-LD: the V4/V5 package's wording, adopted on
 * Sunil's instruction of 19 September.
 */
export const HEADLINE = 'Design agentic systems. Guide your team.';

export const STANDFIRST =
  'Live learning with Sunil Mathew for experienced engineers and engineering teams. Explore the open cohort or start a team-learning conversation.';
