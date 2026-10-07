// Copy and the worked example for /resources/citation-fit-check.
//
// The RULES are in src/lib/citationFit.ts. This file holds only words and the
// example's rows, so changing a sentence is not a change to a formula.
//
// Two readers: the page imports it, and tools/citation-fit-check/dump_content.ts
// prints it as JSON for the workbook builder. The page and the .xlsx therefore
// say the same thing in the same words. The example is also a test fixture:
// src/lib/citationFit.test.ts asserts the brief's expected outputs against it,
// and tools/citation-fit-check/verify_xlsx.py asserts the workbook agrees.
//
// Released 7 October 2026: a row in src/data/resources.ts (Agentic system
// design 09), which /resources, the sitemap and /llms.txt read. Not featured,
// so no row in resource-choices.ts.

import type { Answer, ConditionRow, SpotRow, TestCase } from '../lib/citationFit.ts'; // explicit .ts: node's type-stripping resolver will not guess it

export const RESOURCE_ID = 'citation-fit-check';
export const TITLE = 'Citation Fit Check';
export const TAGLINE =
  'A real citation can support the wrong answer. Check that the rule applies to the person asking.';

/** Released by Sunil on 7 October 2026. The resources.ts row carries the same date. */
export const PUBLISHED_AT: string | null = '2026-10-07';

/** The download gate hands the workbook out as this kind (src/pages/api/pipeline/download.ts). */
export const DOWNLOAD_KIND = 'xlsx';
export const FILENAME = 'citation-fit-check.xlsx';

// ── the opening: bring, do, leave with ───────────────────────────────────────

export const BRING =
  'One type of question your RAG assistant answers; the source documents it retrieves from; 10 real or sample questions of that type, each with the facts about the asker that decide the answer; and the retrieved passages and answers for those questions, from traces or by running them.';
export const DO =
  'Map the conditions that gate each rule, spot-check whether retrieval returns those conditions, score the twelve checks, and write test cases where the cited text is true but doesn’t apply.';
export const LEAVE =
  'A condition map for that answer type, a Pass / Partial / Fail result on twelve checks with a decision (Ready, Fix first or Hold), and a starter set of applicability test cases for your evals.';
export const HOW_TO_USE = 'Work left to right through tabs 1–4. The Worked Example tab shows a completed version.';
export const LEGEND = 'Shaded cells are yours to fill. Everything else calculates.';
export const LICENCE_LINE = 'Content CC BY 4.0';

// ── why this exists ──────────────────────────────────────────────────────────
// Sunil's wording, verbatim from the brief. Add nothing to it: no team size, no
// dates, no outcomes. CLAUDE.md, "Instructor".

export const WHY =
  'Sunil was part of the team responsible for People Tech modernization at Walmart. HR answers are where a confident mistake reaches someone’s health and money. RAG assistants add a quiet way to get them wrong: the answer quotes the right policy, the citation checks out, and a condition stated elsewhere in the document means it doesn’t apply to the person asking.';

// ── the framework ────────────────────────────────────────────────────────────

export const FAILURES = [
  {
    failure: 'Unsupported',
    looks: 'The answer says something the source doesn’t',
    caught: 'Yes',
  },
  {
    failure: 'Misapplied',
    looks: 'The answer quotes the source correctly, but a condition on that rule excludes the person asking',
    caught: 'No',
  },
] as const;

export interface Tab {
  n: string;
  name: string;
  /** The sheet's name in the workbook. */
  sheet: string;
  ask: string;
  /** The one mistake this tab catches. */
  catches: string;
}

export const TABS: Tab[] = [
  {
    n: '01',
    name: 'Condition Map',
    sheet: '1 · Condition Map',
    ask: 'Which conditions gate each rule, and where do they live?',
    catches:
      'Treating a rule as if it applies to everyone. The condition that narrows it often sits in another section, another document, or only in the HR system, where nobody reading the rule will see it.',
  },
  {
    n: '02',
    name: 'Spot Check',
    sheet: '2 · Spot Check',
    ask: 'Does retrieval bring back the conditions with the rule?',
    catches:
      'Counting a retrieval as a hit because the rule came back. A passage that holds the rule and not its condition looks like a hit and produces a wrong answer with a real citation.',
  },
  {
    n: '03',
    name: 'Checklist',
    sheet: '3 · Checklist',
    ask: 'Does the system check the asker’s facts before answering?',
    catches:
      'An assistant that answers yes when it does not know a fact about the asker, such as a start date or a plan. The twelve checks end in one decision and name the first thing to fix.',
  },
  {
    n: '04',
    name: 'Test Cases',
    sheet: '4 · Test Cases',
    ask: 'Would your evals catch a true citation that doesn’t apply?',
    catches:
      'An eval set that scores only groundedness. A misapplied answer is grounded, so it passes. These cases are scored on whether the answer is right for the asker.',
  },
];

export const TEST_CASES_NOTE =
  'Groundedness evals will mark these answers as supported. Score them on whether the answer is right for the asker.';

/** Two greyed rows above the blank Test Cases table, for guidance. Not counted. */
export const GUIDANCE_CASES: TestCase[] = [
  {
    question: 'Can I add my spouse to my health cover?',
    askerProfile: 'Married 45 days ago',
    clause: 'Employees may add dependants to their cover.',
    correctAnswer: 'Not now. The window closed 30 days after the wedding.',
    whyMisleads: 'The 30-day window is in the next sentence, and retrieval returned only the first.',
    expected: 'Answer no',
  },
  {
    question: 'Does my plan cover outpatient physiotherapy?',
    askerProfile: 'Plan not known to the assistant',
    clause: 'Coverage includes outpatient care.',
    correctAnswer: 'Only on the extended plan. It depends on which plan you are enrolled in.',
    whyMisleads: 'The plan condition lives in the HR system, not in the policy text.',
    expected: 'Ask for the missing fact',
  },
];

// ── the worked example ───────────────────────────────────────────────────────

export const EXAMPLE_LABEL =
  'Illustrative example: an HR benefits assistant. Not a real system, employer or real figures.';

export const EXAMPLE_CONDITIONS: ConditionRow[] = [
  {
    rule: 'Pre-existing conditions are covered',
    source: 'Health benefits policy, 4.2 Covered conditions',
    condition: 'More than 18 months of service',
    conditionType: 'Tenure',
    lives: 'Same document, other section',
    askerFact: 'Start date',
    factSource: 'Not available',
  },
  {
    rule: 'Dependants can be added',
    source: 'Health benefits policy, 5.1 Dependants',
    condition: 'Within 30 days of a qualifying event',
    conditionType: 'Date or version',
    lives: 'Same passage',
    askerFact: 'Event date',
    factSource: 'Asks the user',
  },
  {
    rule: 'Coverage includes outpatient care',
    source: 'Health benefits policy, 4.5 Outpatient care',
    condition: 'Enrolled in the extended plan',
    conditionType: 'Plan or tier',
    lives: 'System of record only',
    askerFact: 'Plan enrolled',
    factSource: 'User profile or HR system',
  },
];

// Rule retrieved on all ten; condition retrieved on 1, 4, 7 and 9; cited on
// all ten; wrong for the asker on 2, 5 and 8. Rows 3, 6 and 10 are right by
// luck: the condition was not retrieved and happened to hold.
const spot = (question: string, askerFacts: string, condition: boolean, correct: boolean): SpotRow => ({
  question,
  askerFacts,
  ruleRetrieved: 'Yes',
  conditionRetrieved: condition ? 'Yes' : 'No',
  correctForAsker: correct ? 'Yes' : 'No',
  cited: 'Yes',
});

export const EXAMPLE_SPOT: SpotRow[] = [
  spot('Does our health insurance cover pre-existing conditions?', 'Joined 26 months ago', true, true),
  spot('I joined in February. Is my pre-existing condition covered?', 'Joined 8 months ago', false, false),
  spot('Can I add my newborn to my cover?', 'Baby born 12 days ago', false, true),
  spot('My wedding was 45 days ago. Can I add my spouse now?', 'Married 45 days ago', true, true),
  spot('Does my plan pay for outpatient physiotherapy?', 'Enrolled in the standard plan', false, false),
  spot('Is outpatient care covered for me?', 'Enrolled in the extended plan', false, true),
  spot('Will my diabetes treatment be covered? I have been here three years.', 'Joined 38 months ago', true, true),
  spot('I started in June. Is my asthma covered as a pre-existing condition?', 'Joined 4 months ago', false, false),
  spot('We adopted a child last week. Can I add her?', 'Adoption 7 days ago', true, true),
  spot('Are outpatient specialist visits covered?', 'Enrolled in the extended plan', false, true),
];

/** Answers to checks 1–12, in order. */
export const EXAMPLE_ANSWERS: Answer[] = ['Yes', 'Yes', 'No', 'No', 'Yes', 'Partial', 'No', 'No', 'No', 'Partial', 'No', 'Yes'];

export const EXAMPLE_TESTS: TestCase[] = [
  {
    question: 'I joined in February. Does our health insurance cover my pre-existing condition?',
    askerProfile: '8 months of service',
    clause: 'Pre-existing conditions are covered.',
    correctAnswer: 'Not yet. Coverage starts after 18 months of service.',
    whyMisleads: 'The tenure condition is in a different section.',
    expected: 'Answer no',
  },
];

// ── closing ──────────────────────────────────────────────────────────────────

export const CLOSING = 'A citation tells you the text exists. Check that it applies.';
