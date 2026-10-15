/**
 * The two pathways and six offers under /programmes/, from the 15 October 2026
 * landing-page package (docs/2026-10-15_living-craft-landing-pages/, a static
 * HTML mock-up kept outside the build).
 *
 * THIS IS THE ONE SOURCE FOR THESE OFFERS. The hub, the two pathway pages, the
 * six offer pages, the comparison tables and the enquiry form's options all
 * read from here. Same argument as facts.ts: a fee typed into a page is a fee
 * that drifts from the table two sections below it. Wherever the package's copy
 * repeats a number ("Allow 4–5 hours per week", "the one-hour session"), the
 * sentence is built from the offer's own field, not typed a second time.
 *
 * It is a separate module rather than part of facts.ts because it imports
 * `practitioner` from there, and facts.ts re-exporting it would be a cycle.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PRICING REVIEW: NOT CALIBRATED. Every fee below is the package's figure and
 * is in rupees. Nothing here is gated by region the way `/`'s fee is
 * (regions.ts → publicPrice). Sunil to confirm all six figures before merge.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHAT IS NOT HERE YET, ON PURPOSE
 *   * Nothing in /llms.txt, /api/facts or the Ask agent's knowledge reads this
 *     module. Until it does, the agent knows the 30-hour cohort at `/` and
 *     nothing about these offers. It will say it does not know, which is the
 *     honest failure. Wire them in once the fees are confirmed, and add an
 *     eval probe with them.
 *   * The Career Readiness Review has no fee. The package says the fee "is
 *     discussed before booking", so none is invented here.
 */
import { practitioner } from './facts';
import {
  CAREER_READINESS_REVIEW,
  HELP_ME_CHOOSE,
  OFFER_NAMES,
  PATHWAY_NAMES,
  type OfferSlug,
  type PathwayKey,
} from './programme-interests';

export type { PathwayKey } from './programme-interests';

export interface Img {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type Section =
  | { kind: 'prose'; id: string; heading: string; body: string[]; image?: Img; link?: { label: string; href: string } }
  | { kind: 'list'; id: string; heading: string; items: string[]; note?: string }
  | { kind: 'rows'; id: string; heading: string; rows: [string, string][]; note?: string }
  | { kind: 'steps'; id: string; heading: string; items: { title: string; body: string }[]; note?: string }
  | { kind: 'instructor'; id: string; heading: string; body: string[]; portrait?: boolean }
  | { kind: 'faq'; id: string; heading: string; items: { q: string; a: string }[] };

export interface Offer {
  slug: OfferSlug;
  pathway: PathwayKey;
  name: string;
  /** Live hours with Sunil. For a career package, the total one-to-one time. */
  hours: number;
  /** INR, as printed. See PRICING REVIEW at the top of this file. */
  fee: string;
  /** Build programmes only: the independent work, per week. */
  independentWork?: string;
  /** The comparison table's second column. */
  summary: string;
  /** The pathway page's card: who it suits, then two short paragraphs. */
  fit: string;
  card: string[];
  description: string;
  hero: { title: string[]; lede: string; cta: string; image?: Img; portrait?: boolean };
  sections: Section[];
  enquiry: { heading: string; intro: string };
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
/** "one-hour", "four-hour": the package writes small numbers as words. */
const hourWord = (n: number) => `${WORDS[n] ?? n}-hour`;
const hoursWord = (n: number) => `${WORDS[n] ?? n} ${n === 1 ? 'hour' : 'hours'}`;

/** "Google, Amazon and Walmart", from facts.ts. */
const companies = (() => {
  const c = practitioner.companies;
  return `${c.slice(0, -1).join(', ')} and ${c[c.length - 1]}`;
})();
/** "26 years of engineering experience, including roles at Google, Amazon and Walmart". */
export const EXPERIENCE = `${practitioner.yearsExperience} years of engineering experience, including roles at ${companies}`;

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export const PORTRAIT: Img = {
  src: '/programmes/sunil-bookshelf.webp',
  alt: 'Sunil Mathew seated in front of a bookshelf',
  width: 480,
  height: 600,
};

const img = (file: string, alt: string, width: number, height: number): Img => ({
  src: `/programmes/${file}`,
  alt,
  width,
  height,
});

// ---------------------------------------------------------------------------
// The figures. Everything else in this file is built from these.
// ---------------------------------------------------------------------------

const FIGURES = {
  'focused-agent-build': { hours: 10, fee: '₹40,000', independentWork: '4–5 hours per week' },
  'design-and-build-a-poc': { hours: 20, fee: '₹80,000', independentWork: '3–4 hours per week' },
  'design-to-deployment': { hours: 30, fee: '₹1,20,000', independentWork: '3–4 hours per week' },
  'focused-mock-interview': { hours: 1, fee: '₹15,000' },
  'interview-preparation-and-practice': { hours: 3, fee: '₹30,000' },
  'agentic-ai-career-transition-roadmap': { hours: 4, fee: '₹40,000' },
} as const;

const F = FIGURES;

// ---------------------------------------------------------------------------
// Build Agentic Systems
// ---------------------------------------------------------------------------

const focusedAgentBuild: Offer = {
  slug: 'focused-agent-build',
  pathway: 'agentic-systems',
  name: OFFER_NAMES['focused-agent-build'],
  ...F['focused-agent-build'],
  summary: 'A bounded agent and an understanding of its design decisions',
  fit: 'For a specific use case and a focused introduction to building.',
  card: [
    'Developers, product managers and programme managers can explore how a bounded agent workflow is designed, built and assessed. The hands-on scope is matched to your technical starting point.',
    'Work through the agent’s responsibilities, tools, context and limits. Identify where human review belongs and what requires further development before broader use.',
  ],
  description: `Build a bounded agent with ${practitioner.name} and examine its workflow, behaviour and limits. ${F['focused-agent-build'].hours} live hours, independent work and a fee of ${F['focused-agent-build'].fee} per participant.`,
  hero: {
    title: ['Build one focused agent.', 'Understand the decisions behind it.'],
    lede: `Work with ${practitioner.name} on a bounded agent use case. Build its core workflow, examine its behaviour and understand the design choices that shape what it can do.`,
    cta: 'Discuss Focused Agent Build',
    image: img('bounded-agent.webp', 'A woven agent sculpture sits within a clear circular boundary', 1464, 1074),
  },
  sections: [
    {
      kind: 'prose',
      id: 'start-with-a-use-case',
      heading: 'Start with a use case you can examine closely',
      body: [
        'An agent’s design connects several decisions: the task it is responsible for, the tools it may use, the context it receives and the point at which a person should intervene.',
        'This programme brings those decisions into one focused build. Working with a bounded scope gives you room to examine the workflow and identify the further development it needs.',
      ],
    },
    {
      kind: 'list',
      id: 'who-this-is-for',
      heading: 'Who this programme is for',
      items: [
        'Developers who want practical experience with an agent workflow.',
        'Product managers who want to understand the design and evaluation decisions behind an agentic feature.',
        'Programme managers who need a clearer understanding of agentic-system scope, dependencies and review.',
      ],
      note: 'Your starting capability and the work you want to undertake guide the fit discussion. The hands-on scope needs to suit that starting point.',
    },
    {
      kind: 'steps',
      id: 'what-you-work-through',
      heading: 'What you work through',
      items: [
        {
          title: 'Define the agent’s responsibility',
          body: 'Choose a focused use case. Establish what the agent should achieve, which actions are appropriate and where its responsibility ends.',
        },
        {
          title: 'Build the core workflow',
          body: 'Connect the task, tools and context into a working agent workflow. Examine the choices behind each part of the design.',
        },
        {
          title: 'Evaluate its behaviour',
          body: 'Review whether the workflow does what you intended. Examine where its behaviour is unclear, where it can fail and where human review belongs.',
        },
        {
          title: 'Explain the limits',
          body: 'Use feedback to identify changes and further development needs. Consider the authority, evaluation and failure-handling questions that broader enterprise use would raise.',
        },
      ],
    },
    {
      kind: 'prose',
      id: 'what-you-leave-with',
      heading: 'What you leave with',
      body: [
        'A focused agent build and a clearer explanation of its responsibilities, workflow, boundaries and limitations. You should be able to identify the work it needs before wider use.',
      ],
    },
    {
      kind: 'rows',
      id: 'your-time-commitment',
      heading: 'Your time commitment',
      rows: [
        ['Live cohort work', `${F['focused-agent-build'].hours} hours with Sunil.`],
        ['Independent work', `${F['focused-agent-build'].independentWork}.`],
        ['Schedule', 'Discussed and agreed before joining.'],
      ],
      note: 'Independent work is part of the build. Use that time to apply the session work, examine behaviour and prepare for the next discussion.',
    },
    {
      kind: 'instructor',
      id: 'learn-with-sunil',
      heading: `Learn with ${practitioner.name}`,
      body: [
        `Sunil brings ${EXPERIENCE}. His teaching connects a working system with the reasoning needed to explain its design.`,
        'The programme uses practice, evaluation and feedback to develop that reasoning.',
      ],
    },
    {
      kind: 'faq',
      id: 'questions',
      heading: 'Questions about this programme',
      items: [
        {
          q: 'Do I need to be a developer?',
          a: 'Developers, product managers and programme managers can discuss fit. Your technical starting point and intended hands-on work need to be assessed before the scope is agreed.',
        },
        {
          q: 'Can I use a problem from my workplace?',
          a: 'You can propose a use case. Its size, data and access requirements need to be reviewed so it fits a focused learning project.',
        },
        {
          q: 'Is the outcome an enterprise deployment?',
          a: 'The outcome is a bounded agent build with enterprise design considerations. Wider deployment requires further engineering and review appropriate to the environment.',
        },
        {
          q: `When should I choose the ${F['design-and-build-a-poc'].hours}-hour programme?`,
          a: 'Choose Design and Build a POC when you want to develop a broader proof of concept, evaluate it and examine the engineering needed before deployment.',
        },
      ],
    },
  ],
  enquiry: {
    heading: 'Discuss Focused Agent Build',
    intro:
      'Share your experience and the use case you want to explore. The team will discuss fit, project scope, schedule and payment terms before you decide.',
  },
};

const designAndBuildAPoc: Offer = {
  slug: 'design-and-build-a-poc',
  pathway: 'agentic-systems',
  name: OFFER_NAMES['design-and-build-a-poc'],
  ...F['design-and-build-a-poc'],
  summary: 'A working proof of concept and a review of what needs further work',
  fit: 'For engineers who want to turn a use case into a working proof of concept.',
  card: [
    'Design the architecture, build the workflow and evaluate its behaviour. Use the POC to understand what the approach can demonstrate and where its limits lie.',
    'The result is practical work you can explain, alongside a clearer view of the engineering required before deployment.',
  ],
  description: `Design, build and evaluate an agentic-AI proof of concept with ${practitioner.name}. ${F['design-and-build-a-poc'].hours} live hours, independent work and a fee of ${F['design-and-build-a-poc'].fee} per participant.`,
  hero: {
    title: ['Turn an agentic-AI use case into a working proof of concept.'],
    lede: `Design the architecture, build the workflow and evaluate its behaviour with ${practitioner.name}. Develop a proof of concept you can explain, with a clear view of its limits and next engineering steps.`,
    cta: 'Discuss your POC',
    image: img('pathways.webp', 'A woven architectural model gives a physical illustration of a developing system', 1513, 1040),
  },
  sections: [
    {
      kind: 'prose',
      id: 'what-your-idea-can-demonstrate',
      heading: 'Find out what your idea can demonstrate',
      body: [
        'A proof of concept, or POC, helps you examine an approach through working software. Its value comes from what you learn: which assumptions hold, which behaviours need attention and what remains before deployment.',
        'This programme connects architecture and implementation with that evaluation. You work on the POC and the reasoning behind its design.',
      ],
    },
    {
      kind: 'list',
      id: 'who-this-is-for',
      heading: 'Who this programme is for',
      items: [
        'Senior engineers exploring how to apply agentic systems to a defined use case.',
        'Developers who want to design and implement a working agentic workflow.',
        'Experienced technical professionals who need practical work to examine the approach and its limitations.',
      ],
      note: `Discuss your current capability and the proposed use case before joining. The project needs to fit a ${F['design-and-build-a-poc'].hours}-hour learning scope and the independent work you can commit to.`,
    },
    {
      kind: 'rows',
      id: 'your-time-commitment',
      heading: 'Your time commitment',
      rows: [
        ['Live cohort work', `${F['design-and-build-a-poc'].hours} hours with Sunil.`],
        ['Independent work', `${F['design-and-build-a-poc'].independentWork}.`],
        ['Schedule', 'Discussed and agreed before joining.'],
      ],
      note: 'Use the independent time to build, evaluate and revise the POC. The live discussions help you review those choices and decide what to examine next.',
    },
    {
      kind: 'steps',
      id: 'what-you-work-through',
      heading: 'What you work through',
      items: [
        {
          title: 'Define the use case and success criteria',
          body: 'Decide what the POC should demonstrate and what evidence would help you judge it. Bound the task so you can evaluate a clear approach.',
        },
        {
          title: 'Design the architecture',
          body: 'Connect the agent’s responsibilities, context, tools and review points. Explain why the approach fits the problem and which trade-offs it introduces.',
        },
        {
          title: 'Build a working POC',
          body: 'Implement the scoped workflow. Examine how the parts interact and whether the system behaves as the architecture intended.',
        },
        {
          title: 'Evaluate and revise',
          body: 'Review useful results alongside failures and uncertain behaviour. Use feedback to revise your design and identify the gaps that matter before deployment.',
        },
      ],
    },
    {
      kind: 'prose',
      id: 'what-you-leave-with',
      heading: 'What you leave with',
      body: [
        'A working proof of concept, an explained architecture and an evaluation of what the POC demonstrates. You also leave with a clearer view of the further work needed before deployment.',
      ],
    },
    {
      kind: 'instructor',
      id: 'learn-with-sunil',
      heading: `Learn with ${practitioner.name}`,
      body: [
        `Sunil brings ${EXPERIENCE}. The programme draws on that experience through architecture discussion, practical building and review.`,
        'You examine the decisions behind the software as well as the working result.',
      ],
    },
    {
      kind: 'faq',
      id: 'questions',
      heading: 'Questions about this programme',
      items: [
        {
          q: 'Is a POC the same as a deployed production system?',
          a: 'A POC demonstrates and examines a defined approach. Deployment in an organisation requires further work around its data, access, security, reliability and operating needs.',
        },
        {
          q: 'Can I bring an existing idea?',
          a: 'Yes. Discuss the problem and your current work during the fit conversation. Scope and data suitability need to be agreed before the project is selected.',
        },
        {
          q: 'Will I work on evaluation as well as implementation?',
          a: 'Yes. Evaluation helps you understand what the POC demonstrates, where it fails and which design choices need revision.',
        },
        {
          q: 'When should I choose Design to Deployment?',
          a: 'Choose Design to Deployment when you want a broader learning project taken through deployment, with deeper review of operating decisions.',
        },
      ],
    },
  ],
  enquiry: {
    heading: 'Discuss your POC',
    intro:
      'Share your experience and the use case you want to develop. The team will discuss programme fit, project scope, schedule and payment terms before you decide.',
  },
};

const designToDeployment: Offer = {
  slug: 'design-to-deployment',
  pathway: 'agentic-systems',
  name: OFFER_NAMES['design-to-deployment'],
  ...F['design-to-deployment'],
  summary: 'A scoped learning project taken through deployment',
  fit: 'For a broader project and deeper work on operating decisions.',
  card: [
    'Take a scoped learning project through architecture, implementation, evaluation and deployment in an agreed learning environment. Examine reliability, failure handling, authority and cost as part of that journey.',
    'This programme serves experienced engineers, architects and leaders who want to develop both their system and their engineering judgment.',
  ],
  description: `Take a scoped agentic-system learning project through design, evaluation and deployment with ${practitioner.name}. ${F['design-to-deployment'].hours} live hours; ${F['design-to-deployment'].fee} per participant.`,
  hero: {
    title: ['Take a scoped agentic system from design through deployment.'],
    lede: `Build a working learning project with ${practitioner.name}. Examine its architecture, implementation, evaluation and deployment, alongside the decisions needed to operate it responsibly.`,
    cta: 'Discuss Design to Deployment',
    image: img('bridge.webp', 'Fine woven gold and green structures bridge two architectural platforms', 1825, 862),
  },
  sections: [
    {
      kind: 'prose',
      id: 'build-the-system',
      heading: 'Build the system. Develop the judgment to guide it.',
      body: [
        'As an agent moves from a demonstration towards operation, the questions become more consequential. What is it authorised to do? How do you know a task completed? What should happen when an action fails or a retry would repeat completed work?',
        'This programme brings those questions into a scoped learning project. You work through the system, explain the design choices and revise through evaluation, review and continuous feedback.',
      ],
    },
    {
      kind: 'list',
      id: 'who-this-is-for',
      heading: 'Who this programme is for',
      items: [
        'Experienced engineers who want to work through a broader agentic-system project.',
        'Architects who want to examine decisions across the system’s operating path.',
        'Engineering managers and directors who want deeper technical judgment for guiding a team.',
      ],
      note: 'Fit depends on your starting capability, the project scope and the independent work you can commit to. Discuss those before joining.',
    },
    {
      kind: 'steps',
      id: 'what-you-work-through',
      heading: 'What you work through',
      items: [
        {
          title: 'Define the problem and operating boundaries',
          body: 'Establish the system’s purpose, the evidence of useful work and the actions it may take. Examine ownership and where human review belongs.',
        },
        {
          title: 'Design the architecture',
          body: 'Connect the agent, tools, context and workflow. Review the trade-offs and explain how the design supports the intended behaviour.',
        },
        {
          title: 'Build and evaluate the system',
          body: 'Implement a working learning project. Examine useful results, failures and uncertain outcomes so you can revise the design using evidence.',
        },
        {
          title: 'Take the project through deployment',
          body: 'Deploy the scoped project in an agreed learning environment. Review how the workflow completes, how failures are handled and what can be observed about its operation.',
        },
        {
          title: 'Review the operating decisions',
          body: 'Examine reliability, authority and cost alongside the working result. Identify the limits of the project and the further requirements an organisation would need to address.',
        },
      ],
    },
    {
      kind: 'prose',
      id: 'what-you-leave-with',
      heading: 'What you leave with',
      body: [
        'A working learning project taken through deployment, with clearer reasoning about its architecture and operating trade-offs. The project gives you practical work to review and explain; the discussions develop the judgment needed to guide similar decisions.',
      ],
    },
    {
      kind: 'rows',
      id: 'your-time-commitment',
      heading: 'Your time commitment',
      rows: [
        ['Live cohort work', `${F['design-to-deployment'].hours} hours with Sunil.`],
        ['Independent work', `${F['design-to-deployment'].independentWork}.`],
        ['Schedule', 'Discussed and agreed before joining.'],
      ],
      note: 'The independent work is additional to the live hours. Use it to build, evaluate and revise your project between discussions.',
    },
    {
      kind: 'instructor',
      id: 'learn-with-sunil',
      heading: `Learn with ${practitioner.name}`,
      body: [
        `Sunil brings ${EXPERIENCE}. His work with engineering teams informs how the programme examines architecture, evaluation and decisions with operating consequences.`,
        'The focus is practical capability: a working system and reasoning you can explain under review.',
      ],
    },
    {
      kind: 'faq',
      id: 'questions',
      heading: 'Questions about this programme',
      items: [
        {
          q: 'What does deployment mean here?',
          a: 'It means taking an agreed learning project through deployment in an agreed learning environment. Adoption in an employer’s production environment requires that organisation’s own engineering, security, access and operating review.',
        },
        {
          q: 'Can I bring a use case from my organisation?',
          a: 'You can discuss a use case during the fit conversation. Its scope, data and access requirements need to be suitable for the learning programme.',
        },
        {
          q: 'How is this different from the POC programme?',
          a: 'Design and Build a POC centres on developing and evaluating a proof of concept. This programme adds deployment of the learning project and deeper discussion of its operating decisions.',
        },
        {
          q: 'Can my organisation arrange a programme for a team?',
          a: 'Yes. Discuss a team programme so its capability needs, scope, group size, schedule and fee can be considered separately.',
        },
      ],
    },
  ],
  enquiry: {
    heading: 'Discuss Design to Deployment',
    intro:
      'Share your experience and the system you want to work on. The team will discuss programme fit, project scope, schedule and payment terms before you decide.',
  },
};

// ---------------------------------------------------------------------------
// Career Transition & Interview Preparation
// ---------------------------------------------------------------------------

const focusedMockInterview: Offer = {
  slug: 'focused-mock-interview',
  pathway: 'career-preparation',
  name: OFFER_NAMES['focused-mock-interview'],
  ...F['focused-mock-interview'],
  summary: 'One agreed interview round, feedback and practice priorities',
  fit: 'You know the round you want to practise.',
  card: [
    'Work through one agreed theme, such as system design, a project retrospective or engineering leadership. Review how you structure the discussion, explain trade-offs and demonstrate your experience.',
    `The ${hourWord(F['focused-mock-interview'].hours)} session includes the mock and feedback.`,
  ],
  description: `Practise one agreed interview round with ${practitioner.name} and receive specific feedback. A ${F['focused-mock-interview'].hours}-hour focused mock for experienced professionals, priced at ${F['focused-mock-interview'].fee}.`,
  hero: {
    title: ['Practise one interview round.', 'Get specific feedback.'],
    lede: `Prepare for an agreed interview theme with ${practitioner.name}. Work through the discussion, review your reasoning and leave with clear priorities for further practice.`,
    cta: 'Request a focused mock',
    portrait: true,
  },
  sections: [
    {
      kind: 'prose',
      id: 'make-your-experience-easier-to-assess',
      heading: 'Make your experience easier to assess',
      body: [
        'You may know your work deeply and still find it difficult to explain under interview conditions. A focused mock gives you a setting to practise how you frame the problem, discuss trade-offs and demonstrate your contribution.',
        'The session examines your approach through one agreed interview theme. Feedback helps you identify what to strengthen before your next round.',
      ],
    },
    {
      kind: 'list',
      id: 'who-this-is-for',
      heading: 'Who this session is for',
      items: [
        'Experienced engineers preparing for a system-design or project discussion.',
        'Engineering managers and leaders preparing to explain decisions, team work and technical judgment.',
        'Experienced candidates targeting MAANG or other product-company roles who know the round they want to practise.',
      ],
      note: 'The session is especially relevant to experienced service-company engineers preparing for a move. Experienced professionals from product companies and global capability centres can also discuss fit.',
    },
    {
      kind: 'steps',
      id: 'what-happens-in-the-session',
      heading: 'What happens in the session',
      items: [
        {
          title: 'Agree the interview theme',
          body: 'Share your target role and the round you want to practise. Supported themes can include system design, a project retrospective or engineering leadership, subject to fit.',
        },
        {
          title: 'Work through the mock',
          body: 'Practise responding to the problem and explaining the choices behind your answer. Use relevant examples from your experience and discuss the trade-offs.',
        },
        {
          title: 'Review your approach',
          body: 'Receive feedback on your reasoning, communication and relevant gaps. Identify the points to work on in your next practice session.',
        },
      ],
      note: `The mock and feedback are included within the ${hourWord(F['focused-mock-interview'].hours)} session.`,
    },
    {
      kind: 'prose',
      id: 'what-you-leave-with',
      heading: 'What you leave with',
      body: [
        'Specific feedback on one interview round and a clearer view of what to improve. The session helps you focus further practice on the gaps that appeared in the discussion.',
      ],
    },
    {
      kind: 'instructor',
      id: 'practise-with-sunil',
      heading: `Practise with ${practitioner.name}`,
      body: [
        `Sunil brings ${EXPERIENCE}. His background includes hiring, developing and assessing senior engineers, architects and engineering leaders.`,
        'The session uses that experience to examine how you explain your work and approach an engineering discussion.',
      ],
    },
    {
      kind: 'faq',
      id: 'questions',
      heading: 'Questions before booking',
      items: [
        {
          q: 'Can I request a mock directly?',
          a: 'Yes. Share the theme and role you are preparing for. A fit discussion confirms whether the session matches your needs. A Career Readiness Review is optional.',
        },
        {
          q: 'Does this include interview feedback?',
          a: `Yes. Both practice and feedback fit within the ${hourWord(F['focused-mock-interview'].hours)} session. The focus is on one agreed theme.`,
        },
        {
          q: 'What if I need a preparation plan and more practice?',
          a: `Interview Preparation and Practice includes one planning session and two mocks within ${hoursWord(F['interview-preparation-and-practice'].hours)} of one-to-one sessions.`,
        },
        {
          q: 'Who is eligible for this service?',
          a: 'The current service is for experienced engineers and engineering leaders. Freshers are outside its scope.',
        },
        {
          q: 'Which interview themes can I practise?',
          a: 'Discuss system design, a project retrospective or engineering leadership during the fit conversation. Coding-round coverage is outside the listed themes.',
        },
        {
          q: 'Are referrals or placement included?',
          a: 'The session covers interview practice and feedback. Job applications, referrals and placement are outside its scope.',
        },
      ],
    },
  ],
  enquiry: {
    heading: 'Request a focused mock',
    intro:
      'Share your target role and the round you want to practise. The team will discuss technical fit, availability and payment terms before booking.',
  },
};

const interviewPreparationAndPractice: Offer = {
  slug: 'interview-preparation-and-practice',
  pathway: 'career-preparation',
  name: OFFER_NAMES['interview-preparation-and-practice'],
  ...F['interview-preparation-and-practice'],
  summary: 'One planning session and two mocks, with feedback',
  fit: 'You know your target role and want a preparation plan with practice.',
  card: [
    'Use one planning session to identify your priorities. Practise through two mock interviews and use feedback to focus your further preparation.',
    `Planning, mocks and feedback fit within ${hoursWord(F['interview-preparation-and-practice'].hours)} of one-to-one sessions, delivered on a weekly cadence.`,
  ],
  description: `Prepare with ${practitioner.name} through one planning session and two mock interviews. ${hoursWord(F['interview-preparation-and-practice'].hours).replace(/^./, (c) => c.toUpperCase())} of personal guidance and practice, priced at ${F['interview-preparation-and-practice'].fee}.`,
  hero: {
    title: ['Plan your preparation.', 'Practise through two mock interviews.'],
    lede: `Work with ${practitioner.name} to identify your preparation priorities, practise two agreed interview themes and use feedback to decide what to strengthen next.`,
    cta: 'Discuss your interview preparation',
    image: img('career-folio.webp', 'An open planning folio beside paper steps and a fine gold thread', 1498, 1050),
  },
  sections: [
    {
      kind: 'prose',
      id: 'give-your-preparation-a-clear-focus',
      heading: 'Give your preparation a clear focus',
      body: [
        'An upcoming interview can leave you with several competing priorities: which technical topics to revisit, which project examples to use and how to explain your decisions clearly.',
        'Start with a planning session. Then use two mocks to examine your approach in practice and identify the gaps that deserve attention.',
      ],
    },
    {
      kind: 'list',
      id: 'who-this-is-for',
      heading: 'Who this package is for',
      items: [
        'Experienced engineers with a target role and an interview-preparation goal.',
        'Architects and engineering leaders who want to practise technical or leadership discussions.',
        'Experienced service-company engineers preparing for MAANG or other product-company roles.',
      ],
      note: 'Experienced professionals from product companies and global capability centres can also discuss fit. The current service excludes freshers; interview themes are agreed according to your target role and Sunil’s scope.',
    },
    {
      kind: 'steps',
      id: 'what-is-included',
      heading: 'What is included',
      items: [
        {
          title: 'One preparation-planning session',
          body: 'Review your target role, current preparation and the experience you want to demonstrate. Identify priorities and agree which interview themes to practise.',
        },
        {
          title: 'Two focused mock interviews',
          body: 'Work through agreed themes, which can include system design, a project retrospective or engineering leadership. Practise how you structure the discussion and explain your decisions.',
        },
        {
          title: 'Feedback and further practice priorities',
          body: 'Review the reasoning, communication and evidence in your responses. Use the feedback to focus the work you do between sessions and after the package.',
        },
      ],
    },
    {
      kind: 'prose',
      id: 'what-you-leave-with',
      heading: 'What you leave with',
      body: [
        'A focused preparation plan and feedback from two mock interviews. You have a clearer view of which gaps to work on and how to explain your experience in the agreed interview themes.',
      ],
    },
    {
      kind: 'prose',
      id: 'your-session-time',
      heading: 'Your session time',
      body: [
        `The package includes ${F['interview-preparation-and-practice'].hours} hours of one-to-one sessions on a weekly cadence. The planning session, both mocks and feedback fit within that total.`,
        'Your schedule is discussed before booking. Practice between sessions is useful; the listed time covers the live sessions.',
      ],
    },
    {
      kind: 'instructor',
      id: 'guidance',
      heading: 'Guidance from engineering and hiring experience',
      body: [
        `Sunil brings ${EXPERIENCE}. His background includes hiring, developing and assessing senior technical professionals.`,
        'The work centres on your experience and how you explain it: the problem you handled, the decisions you made and the contribution you can demonstrate.',
      ],
    },
    {
      kind: 'faq',
      id: 'questions',
      heading: 'Questions about this package',
      items: [
        {
          q: 'Can the mocks cover different themes?',
          a: 'Discuss the themes your target role requires. The planning session helps agree the focus for the two mocks within the supported scope.',
        },
        {
          q: `Is feedback additional to the ${hoursWord(F['interview-preparation-and-practice'].hours)}?`,
          a: `Feedback is included within the ${hourWord(F['interview-preparation-and-practice'].hours)} live-session total, alongside the planning session and mocks.`,
        },
        {
          q: 'What if I need only one mock?',
          a: 'Choose Focused Mock Interview when you know the round you want to practise and need one focused session.',
        },
        {
          q: 'What if I am still deciding which role to target?',
          a: 'Explore the Agentic AI Career Transition Roadmap if your question concerns a move towards agentic-AI work. You can also discuss a Career Readiness Review through the Career pathway.',
        },
        {
          q: 'Does this include placement or referrals?',
          a: 'The package covers preparation planning, interview practice and feedback. Job applications, referrals and placement are outside its scope.',
        },
      ],
    },
  ],
  enquiry: {
    heading: 'Discuss your interview preparation',
    intro:
      'Share your experience, target role and current preparation needs. The team will discuss fit, session themes, availability and payment terms before booking.',
  },
};

const careerTransitionRoadmap: Offer = {
  slug: 'agentic-ai-career-transition-roadmap',
  pathway: 'career-preparation',
  name: OFFER_NAMES['agentic-ai-career-transition-roadmap'],
  ...F['agentic-ai-career-transition-roadmap'],
  summary: 'Direction and gap assessment, a career roadmap and one mock',
  fit: 'You want to move towards agentic-AI roles or responsibilities.',
  card: [
    'Examine your current experience, the role you want and the capabilities you need to develop. Build a roadmap covering learning, project evidence and preparation, with one mock interview to review how you communicate your experience.',
    `The ${hourWord(F['agentic-ai-career-transition-roadmap'].hours)} package provides weekly personal guidance, a roadmap and practice. Technical capability development can be pursued through the Build pathway where it fits your needs.`,
  ],
  description: `Assess your gaps and plan a move towards agentic-AI work with ${practitioner.name}. A career-roadmap report and one mock within ${WORDS[F['agentic-ai-career-transition-roadmap'].hours]} hours, priced at ${F['agentic-ai-career-transition-roadmap'].fee}.`,
  hero: {
    title: ['Plan your move towards agentic-AI work.'],
    lede: `Review your experience, identify your capability gaps and build a practical career roadmap with ${practitioner.name}. One mock interview helps you examine how you explain your work and decisions.`,
    cta: 'Discuss your career transition',
    image: img('career-folio.webp', 'A gold thread connects a planning folio to a series of paper steps', 1498, 1050),
  },
  sections: [
    {
      kind: 'prose',
      id: 'connect-your-experience',
      heading: 'Connect your experience to the work you want to do',
      body: [
        'Moving towards agentic-AI roles or responsibilities starts with a clear assessment. Which parts of your engineering experience are relevant? Which capabilities need development? What practical work would help you demonstrate those capabilities?',
        'This package gives those questions a structure. Work through your direction and gaps, then use a roadmap to organise learning, project work and preparation.',
      ],
    },
    {
      kind: 'list',
      id: 'who-this-is-for',
      heading: 'Who this package is for',
      items: [
        'Experienced engineers considering agentic-AI roles or new responsibilities.',
        'Architects and engineering leaders who want to identify the capability needed for their next step.',
        'Experienced service-company engineers seeking a clearer direction towards product-company or agentic-AI work.',
      ],
      note: 'Experienced professionals from product companies and global capability centres can also discuss fit. This is a career-guidance package for experienced professionals; freshers are outside the current scope.',
    },
    {
      kind: 'steps',
      id: 'what-you-work-through',
      heading: 'What you work through',
      items: [
        {
          title: 'Clarify your direction',
          body: 'Discuss your experience and the role or responsibilities you want to pursue. Identify what the move means for your technical work and the contribution you want to demonstrate.',
        },
        {
          title: 'Assess the gaps',
          body: 'Compare your current capability and project evidence with your target direction. Identify learning, practical-work and preparation gaps that need attention.',
        },
        {
          title: 'Develop your career roadmap',
          body: 'Organise the priorities into a practical plan. Your career-roadmap report brings together the fit-gap analysis, learning needs, project-evidence priorities and preparation steps.',
        },
        {
          title: 'Practise through one mock interview',
          body: 'Use one agreed interview theme to examine how you explain your experience, approach a problem and defend your decisions. Apply the feedback to your preparation priorities.',
        },
      ],
    },
    {
      kind: 'prose',
      id: 'what-you-leave-with',
      heading: 'What you leave with',
      body: [
        'A career-roadmap report with a fit-gap analysis and practical next actions, plus feedback from one mock interview. You have a clearer direction and a plan for developing the capability and evidence your move requires.',
      ],
    },
    {
      kind: 'prose',
      id: 'your-session-time',
      heading: 'Your session time',
      body: [
        `The package includes ${F['agentic-ai-career-transition-roadmap'].hours} hours of one-to-one sessions on a weekly cadence. Personal guidance and the one mock interview fit within that total.`,
        'The schedule and session allocation are discussed before booking. The roadmap guides the learning and practice you undertake beyond the live sessions.',
      ],
    },
    {
      kind: 'instructor',
      id: 'work-with-sunil',
      heading: `Work with ${practitioner.name}`,
      portrait: true,
      body: [
        `Sunil brings ${EXPERIENCE}. His background includes leading engineering teams and hiring, developing and assessing senior technical professionals.`,
        'The discussion connects your career goal to the capability and evidence you need to build.',
      ],
    },
    {
      kind: 'faq',
      id: 'questions',
      heading: 'Questions about this package',
      items: [
        {
          q: `Will the ${WORDS[F['agentic-ai-career-transition-roadmap'].hours]} hours complete my technical transition?`,
          a: 'The package provides assessment, direction, a roadmap and one mock interview. Developing the technical capability involves the further learning and project work identified in that roadmap.',
        },
        {
          q: 'Does this include a hands-on agentic-systems programme?',
          a: 'Hands-on programmes are separate. Explore Build Agentic Systems if you need practical development through a focused agent, a POC or a deployment project.',
        },
        {
          q: `Is the mock included in the ${WORDS[F['agentic-ai-career-transition-roadmap'].hours]} hours?`,
          a: `Yes. The one mock and personal-guidance sessions fit within the ${hourWord(F['agentic-ai-career-transition-roadmap'].hours)} total.`,
        },
        {
          q: 'What if my immediate need is interview preparation?',
          a: 'Explore Interview Preparation and Practice when you already have a target role and want one preparation-planning session plus two mocks.',
        },
        {
          q: 'Are job applications, referrals or placement included?',
          a: 'The package covers guidance, planning and practice. Applications, referrals and placement are outside its scope.',
        },
      ],
    },
  ],
  enquiry: {
    heading: 'Discuss your career transition',
    intro:
      'Share your current experience, the direction you are considering and what feels unclear. The team will discuss fit, scope, availability and payment terms before booking.',
  },
};

export const OFFERS: Offer[] = [
  focusedAgentBuild,
  designAndBuildAPoc,
  designToDeployment,
  focusedMockInterview,
  interviewPreparationAndPractice,
  careerTransitionRoadmap,
];

export const offerFor = (pathway: string, slug: string): Offer | undefined =>
  OFFERS.find((o) => o.pathway === pathway && o.slug === slug);

export const offersIn = (pathway: PathwayKey): Offer[] => OFFERS.filter((o) => o.pathway === pathway);

/** The lowest fee in a pathway, for "Fees from …". Compared as numbers, printed as written. */
const lowestFee = (pathway: PathwayKey): string => {
  const rupees = (s: string) => Number(s.replace(/[^\d]/g, ''));
  return offersIn(pathway).reduce((a, b) => (rupees(b.fee) < rupees(a.fee) ? b : a)).fee;
};

/** "10, 20 or 30" */
const hoursList = (pathway: PathwayKey): string => {
  const h = offersIn(pathway).map((o) => String(o.hours));
  return `${h.slice(0, -1).join(', ')} or ${h[h.length - 1]}`;
};

/** The line under an offer's name: "10 live hours · ₹40,000 per participant". */
export const offerFacts = (o: Offer): string =>
  o.pathway === 'agentic-systems'
    ? `${o.hours} live hours · ${o.fee} per participant`
    : o.hours === 1
      ? `${o.hours} hour · ${o.fee}`
      : `${o.hours} hours of one-to-one sessions · ${o.fee}`;

// ---------------------------------------------------------------------------
// The two pathways
// ---------------------------------------------------------------------------

export interface Pathway {
  key: PathwayKey;
  /** The name on the hub and in the navigation. */
  name: string;
  /** The short name in the header row and the breadcrumbs. */
  short: string;
  /** The hub's card. */
  hubFit: string;
  hubBody: string;
  hubFacts: string;
  hubLink: string;
  description: string;
  hero: { title: string[]; lede: string; cta: string; image?: Img; portrait?: boolean };
  /** The comparison table's column heads, after the offer's name. */
  table: { summary: string; hours: string; fee: string; independent?: string };
  tableHeading: string;
  /** Sections before the comparison table. */
  intro: Section[];
  /** Sections after the offer cards and before the enquiry. */
  after: Section[];
  enquiry: { heading: string; intro: string };
  /** The other pathway's link at the foot. */
  crossLink: string;
}

export const PATHWAYS: Record<PathwayKey, Pathway> = {
  'agentic-systems': {
    key: 'agentic-systems',
    name: PATHWAY_NAMES['agentic-systems'],
    short: 'Build Agentic Systems',
    hubFit: 'You want to understand how an agentic system works, build one and make sound decisions about its behaviour.',
    hubBody:
      'Work on a focused agent, a proof of concept or a project taken through deployment. Build, evaluate and revise your work with guidance and feedback.',
    hubFacts: `Three live cohort programmes · ${hoursList('agentic-systems')} live hours · Fees from ${lowestFee('agentic-systems')} per participant`,
    hubLink: 'Compare agentic-systems programmes',
    description: `Compare ${hoursList('agentic-systems').replace(' or ', ' and ')}-hour programmes with ${practitioner.name}. Build a focused agent, develop a POC or take a scoped learning project through deployment.`,
    hero: {
      title: ['Build an agentic system and explain the decisions behind it.'],
      lede: `Live cohort programmes with ${practitioner.name} for experienced engineers, architects and engineering leaders. Choose the depth of work that matches your goal: a focused agent, a working proof of concept or a project taken through deployment.`,
      cta: 'Compare the three programmes',
      image: img('bridge.webp', 'A woven bridge connects an early framework to a completed architectural model', 1825, 862),
    },
    table: { summary: 'Main outcome', hours: 'Live hours', independent: 'Independent work', fee: 'Fee per participant' },
    tableHeading: 'Choose your programme',
    intro: [
      {
        kind: 'prose',
        id: 'from-an-idea-to-engineering-decisions',
        heading: 'Move from an idea to engineering decisions',
        body: [
          'An agent can produce a convincing answer and still take the wrong action. Building one means deciding what it may do, which context it needs, how its behaviour will be evaluated and what should happen when it fails.',
          'The Build pathway connects those decisions to practical work. You build a system, examine its behaviour, explain your choices and revise through review and feedback.',
        ],
      },
    ],
    after: [
      {
        kind: 'instructor',
        id: 'learn-with-sunil',
        heading: `Learn with ${practitioner.name}`,
        body: [
          `Sunil brings ${EXPERIENCE}. His teaching connects practical building with the reasoning needed to explain and defend a design.`,
          'The work includes evaluation, discussion and revision. You should be able to explain why a system behaves as it does and which decisions need further review.',
        ],
      },
      {
        kind: 'faq',
        id: 'questions',
        heading: 'Questions before choosing',
        items: [
          {
            q: 'Which programme should I choose?',
            a: 'Choose by the work you want to complete and your starting capability. A focused build suits a bounded use case; the POC programme develops a broader proof of concept; Design to Deployment adds deployment and operating review. Your job title alone does not decide fit.',
          },
          {
            q: 'What happens outside the live sessions?',
            a: `You work on assignments and your project. Allow ${F['focused-agent-build'].independentWork} for Focused Agent Build, or ${F['design-and-build-a-poc'].independentWork.replace(' per week', '')} for the other two programmes. That independent work is additional to the stated live hours.`,
          },
          {
            q: 'Can I bring a work-related use case?',
            a: 'You can discuss it during the fit conversation. Project scope, access and data suitability need to be agreed before it becomes part of the learning work.',
          },
          {
            q: 'Does deployment mean the project is ready for my employer’s production environment?',
            a: 'Design to Deployment covers a scoped learning project in an agreed environment. Adoption in your organisation requires its own review of security, data, access and operating requirements.',
          },
        ],
      },
    ],
    enquiry: {
      heading: 'Discuss your programme fit',
      intro: 'Tell us about your experience and what you want to build. Share which programme interests you, or ask for help choosing.',
    },
    crossLink: 'Explore career preparation',
  },

  'career-preparation': {
    key: 'career-preparation',
    name: PATHWAY_NAMES['career-preparation'],
    short: 'Career Preparation',
    hubFit: 'You want clarity about your next role, a plan for moving towards agentic-AI work, or practice before an interview.',
    hubBody:
      'Choose a focused mock interview, structured preparation with two mocks, or a career-transition roadmap with personal guidance.',
    hubFacts: `Three one-to-one packages · ${hoursList('career-preparation')} hours · Fees from ${lowestFee('career-preparation')}`,
    hubLink: 'Compare career-preparation packages',
    description: `Compare mock interviews, preparation planning and an agentic-AI career roadmap with ${practitioner.name}. Personal support for experienced engineering professionals.`,
    hero: {
      title: ['Prepare for your next role with a clearer plan and focused practice.'],
      lede: `One-to-one career guidance and mock interviews with ${practitioner.name} for experienced engineers and engineering leaders. Choose support for one interview round, a preparation plan with two mocks, or a roadmap towards agentic-AI work.`,
      cta: 'Compare the three packages',
      portrait: true,
    },
    table: { summary: 'What is included', hours: 'Total session time', fee: 'Fee' },
    tableHeading: 'Choose the support you need',
    intro: [
      {
        kind: 'prose',
        id: 'a-clear-starting-point',
        heading: 'Give your next move a clear starting point',
        body: [
          'You may have years of engineering experience and still be unsure which role to target, which gaps to address or how to explain your work in an interview.',
          'Start with the question you need to resolve. Assess your direction, organise your preparation or practise an agreed interview theme. Use specific feedback to decide what to work on next.',
          'This pathway is especially relevant to experienced service-company engineers targeting MAANG or other product-company roles. Experienced engineers from product companies and global capability centres can also discuss fit.',
        ],
      },
    ],
    after: [
      {
        kind: 'instructor',
        id: 'guidance',
        heading: 'Guidance grounded in engineering and hiring experience',
        body: [
          `Sunil Mathew brings ${EXPERIENCE}. His background includes hiring, developing and assessing senior engineers, architects and engineering leaders.`,
          'The focus is on your experience, your reasoning and the evidence you can use to explain your contribution.',
        ],
      },
      {
        kind: 'prose',
        id: 'career-readiness-review',
        heading: 'Need clarity before choosing a package?',
        image: img('career-folio.webp', 'An ivory planning folio connected to three small paper steps by a gold thread', 1498, 1050),
        body: [
          'The Career Readiness Review is a one-hour consultation focused on your experience, career goal and preparation gaps. Its outcome is a career-roadmap report covering your direction, gaps and next actions.',
          'The consultation fee, scope and arrangements are discussed before booking.',
        ],
        link: { label: 'Discuss a Career Readiness Review', href: '?interest=career-readiness-review#enquire' },
      },
      {
        kind: 'faq',
        id: 'questions',
        heading: 'Questions before you start',
        items: [
          {
            q: 'Who is this pathway for?',
            a: 'The current services are for experienced engineers, architects and engineering leaders. Freshers are outside the current service scope. Fit also depends on the target role and the interview theme you want to work on.',
          },
          {
            q: 'Do I need a readiness review before requesting a mock?',
            a: 'You can request a mock directly when you know the round you need to practise. A fit discussion confirms whether the theme is supported.',
          },
          {
            q: 'Does the transition roadmap teach me to build an agentic system?',
            a: 'It identifies the capability and evidence you need to develop and helps you plan that work. Hands-on system development is covered by the Build Agentic Systems programmes.',
          },
          {
            q: 'Are referrals or placement included?',
            a: 'These packages cover guidance, planning and practice. Job applications, referrals and placement are outside their scope.',
          },
          {
            q: 'Is practice between sessions useful?',
            a: 'Yes. Use your feedback and priorities to practise between sessions. The listed hours cover live one-to-one time.',
          },
        ],
      },
    ],
    enquiry: {
      heading: 'Discuss your next step',
      intro: 'Tell us about your experience, target role and the support you need. The team will discuss fit, scope and availability before booking.',
    },
    crossLink: 'Explore agentic-systems programmes',
  },
};

export const PATHWAY_KEYS = Object.keys(PATHWAYS) as PathwayKey[];

export const isPathway = (v: string | undefined): v is PathwayKey =>
  typeof v === 'string' && (PATHWAY_KEYS as string[]).includes(v);

// ---------------------------------------------------------------------------
// The enquiry form's "What you are interested in" options
// ---------------------------------------------------------------------------
// The options themselves are in programme-interests.ts (see why there). This
// narrows them to what belongs on each page.

/** The options a page offers, in the order the package lists them. */
export const interestsFor = (page: 'hub' | PathwayKey): string[] =>
  page === 'hub'
    ? [...PATHWAY_KEYS, HELP_ME_CHOOSE.value]
    : page === 'agentic-systems'
      ? [...offersIn(page).map((o) => o.slug), HELP_ME_CHOOSE.value]
      : [...offersIn(page).map((o) => o.slug), CAREER_READINESS_REVIEW.value, HELP_ME_CHOOSE.value];
