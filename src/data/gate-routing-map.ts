// Copy and the worked example for /resources/gate-routing-map.
//
// The RULES are in src/lib/gateRouting.ts. This file holds only words and the
// example's rows, so changing a sentence is not a change to a formula.
//
// Two readers: the page imports it, and tools/gate-routing-map/dump_content.ts
// prints it as JSON for the workbook builder. The page and the .xlsx therefore
// say the same thing in the same words. The example is also a test fixture:
// src/lib/gateRouting.test.ts asserts the brief's expected outputs against it,
// and tools/gate-routing-map/verify_xlsx.py asserts the workbook agrees.
//
// Released 11 October 2026: a row in src/data/resources.ts (Agentic system
// design 10), which /resources, the sitemap and /llms.txt read. Not featured,
// so no row in resource-choices.ts.

import type { Answer, GateCase, Requirements, Route } from '../lib/gateRouting.ts'; // explicit .ts: node's type-stripping resolver will not guess it
import { EMPTY_REQUIREMENTS } from '../lib/gateRouting.ts';

export const RESOURCE_ID = 'gate-routing-map';
export const TITLE = 'Gate Routing Map';
export const TAGLINE = 'A gate that only says pass or fail is hiding a decision. Give every case a route.';
export const QUESTION = 'Which of my agent’s gate results should block, go to a human, or wait on a downstream system?';

/** Released on 11 October 2026. The resources.ts row carries the same date. */
export const PUBLISHED_AT = '2026-10-11';

/** The download gate hands the workbook out as this kind (src/pages/api/pipeline/download.ts). */
export const DOWNLOAD_KIND = 'xlsx';
export const FILENAME = 'gate-routing-map.xlsx';

// ── the opening: bring, do, leave with ───────────────────────────────────────

export const BRING =
  'One agent you release through automated gates; the list of gate cases or eval suites it runs; for each one, what it checks and how bad it would be if it shipped broken; and the names of any systems that act on the agent’s output, with the teams that own their pipelines.';
export const DO =
  'List your gate cases, give each one a route (Block, Human decides, Check downstream or Track), fill in what each route needs, and score the ten checks.';
export const LEAVE =
  'A routing map for every gate case, a list of the cases whose route isn’t ready, and a decision: Ready, Fix first or Hold.';
export const HOW_TO_USE = 'Work left to right through tabs 1–3. The Worked Example tab shows a completed version.';
export const LEGEND = 'Shaded cells are yours to fill. Everything else calculates.';
export const LICENCE_LINE = 'Content CC BY 4.0';

// ── why this exists ──────────────────────────────────────────────────────────
// Sunil's wording, verbatim from the brief. Add nothing to it, and never name
// the employer: CLAUDE.md, "Instructor".

export const WHY =
  'On an agentic system Sunil worked on at a hyperscaler, automated test cases served as the deployment stage gates. The results couldn’t all get the same treatment. Crucial cases went to a person whose call could stop the release. Others only meant something once a dependent system — a separate service with its own deployment pipeline — had acted on the agent’s output.';

/** Why a pass-or-fail gate is not enough, as four kinds of result. */
export const KINDS = [
  'some must hold on every run;',
  'some need a named person’s judgement;',
  'some only mean something once another system has acted on the agent’s output, and that system may ship from its own pipeline;',
  'some measure work still in progress and shouldn’t block anything.',
] as const;

// ── the framework ────────────────────────────────────────────────────────────

export interface RouteRow {
  route: Route;
  when: string;
  needs: string;
}

export const ROUTE_TABLE: RouteRow[] = [
  {
    route: 'Block',
    when: 'A regression case a check can decide on its own',
    needs:
      'Enough trials, and every trial must pass (pass^k). One green run of a non-deterministic agent overstates its reliability.',
  },
  {
    route: 'Human decides',
    when: 'A serious case that no check can decide unambiguously',
    needs:
      'A named owner, a backup owner, and halt criteria written down before the release. People watching releases get used to green and start reading small anomalies as noise.',
  },
  {
    route: 'Check downstream',
    when: 'Another system acts on the agent’s output and ships from its own pipeline',
    needs:
      'The system and its owning team named; an output contract; the downstream side verifies that contract before either side deploys; a way to switch the new behaviour on together; a named person who can halt.',
  },
  {
    route: 'Track',
    when: 'Capability cases, or low-severity cases',
    needs: 'An owner who reviews the trend. A drop is worth investigating, not a reason to block.',
  },
];

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
    name: 'Gate Inventory',
    sheet: '1 · Gate Inventory',
    ask: 'Which route does each gate case need?',
    catches:
      'Treating every failed case the same way. Purpose, severity, who acts on the output and whether a check can decide it suggest a route for each case. You can override the suggestion, and the sheet asks you to write down why.',
  },
  {
    n: '02',
    name: 'Route Requirements',
    sheet: '2 · Route Requirements',
    ask: 'Does each route have what it needs?',
    catches:
      'A route on paper with nothing behind it, such as a human gate with no halt criteria, or a Block case that passed one run of a non-deterministic agent. Each row names the first thing missing.',
  },
  {
    n: '03',
    name: 'Checklist',
    sheet: '3 · Checklist',
    ask: 'Is the gate ready to decide releases?',
    catches:
      'Letting a gate decide releases before its routes are ready. Ten checks, four of them critical, end in one decision and name the next thing to fix.',
  },
];

export const MIN_TRIALS_LABEL = 'Minimum trials for non-deterministic Block cases';
export const MIN_TRIALS_NOTE =
  'Agents vary between runs. A Block case on non-deterministic behaviour should pass every one of several trials.';

// ── the worked example ───────────────────────────────────────────────────────

export const EXAMPLE_LABEL =
  'Illustrative example: an order-support agent whose refund recommendations are carried out by a separate payments service. Not a real system, company or real figures.';

export const EXAMPLE_MIN_TRIALS = 3;

const own = 'Another system with its own pipeline' as const;
const ours = 'Another system in our pipeline' as const;
const user = 'User directly' as const;

const gate = (
  name: string,
  checks: string,
  purpose: GateCase['purpose'],
  severity: GateCase['severity'],
  actor: GateCase['actor'],
  checkDecides: GateCase['checkDecides'],
  deterministic: GateCase['deterministic'],
  chosen: GateCase['chosen'] = '',
  reason = '',
): GateCase => ({ name, checks, purpose, severity, actor, checkDecides, deterministic, chosen, reason });

export const EXAMPLE_CASES: GateCase[] = [
  gate('Refund amount within policy cap', 'The recommended refund never exceeds the cap for the order type', 'Regression', 'Critical', own, 'Yes', 'Yes'),
  gate('Refund recommendation matches the agreed format', 'The recommendation parses against the format the payments service reads', 'Regression', 'High', own, 'Yes', 'Yes'),
  gate('Picks the right order from the conversation', 'The order the agent acts on is the one the customer meant', 'Regression', 'High', user, 'Yes', 'No'),
  gate('Declines refunds on accounts held for fraud review', 'No refund is recommended while an account is on hold', 'Regression', 'Critical', user, 'No', 'No'),
  gate('Tone of the customer reply', 'The reply is polite and plain', 'Regression', 'Low', user, 'No', 'No'),
  gate('Resolves complaints that span several orders', 'One reply settles a complaint about more than one order', 'Capability', 'High', user, 'Yes', 'No'),
  gate('Escalation note to the support team', 'The note carries the order, the issue and what the agent already tried', 'Regression', 'Medium', ours, 'Yes', 'No'),
  gate(
    'Cites the correct policy clause',
    'The reply quotes the clause that applies to this order',
    'Regression',
    'High',
    user,
    'No',
    'No',
    'Block',
    'Graded by a model judge calibrated against human reviewers',
  ),
];

const req = (r: Partial<Requirements>): Requirements => ({ ...EMPTY_REQUIREMENTS, ...r });

/** Tab 2, row for row with EXAMPLE_CASES. */
export const EXAMPLE_REQUIREMENTS: Requirements[] = [
  req({ system: 'Payments service', team: 'Payments', contract: 'Yes', verifies: 'No', switchTogether: 'Yes', halter: 'Release manager' }),
  req({ system: 'Payments service', team: 'Payments', contract: 'Yes', verifies: 'Yes', switchTogether: 'Yes', halter: 'Release manager' }),
  req({ trials: 5, mustPass: 5 }),
  req({ owner: 'Trust and safety lead', haltCriteria: 'No' }),
  req({ trackOwner: 'Support quality lead' }),
  req({}),
  req({ trials: 3, mustPass: 2 }),
  req({ trials: 1, mustPass: 1 }),
];

/** Answers to checks 1–10, in order. */
export const EXAMPLE_ANSWERS: Answer[] = ['Yes', 'Yes', 'No', 'Yes', 'No', 'No', 'Yes', 'Partial', 'Yes', 'Partial'];

// ── closing ──────────────────────────────────────────────────────────────────

export const CLOSING = 'The pass rate is still useful. It just can’t tell you who should decide.';
