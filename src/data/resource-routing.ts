// The resource follow-up catalogue: which resource to recommend next, as data.
//
// SOURCE. The outreach readiness package of 28 September 2026, revised 29
// September: `resource-routing-matrix.html` (one row per module, its topic and
// its preferred follow-ups in order), `email-cta-placements.html` (the subject
// and the primary call to action per module) and `new-resource-register.html`
// (LC-T10 and LC-T11, both "sequence_enabled: false"). The preferred lists
// below are transcribed from the matrix in the matrix's order. Nothing in the
// order is ours.
//
// WHAT IS OURS, AND MARKED. The package has no role dimension. `roles` is a
// PROPOSED affinity per module, written from who each resource is evidently
// for, and it only ever re-orders candidates that the matrix has not already
// placed. Sunil can change any of them here without touching code. A module
// with an empty `roles` list is for everybody.
//
// HOW SELECTION READS THIS (src/lib/comms/drip.ts, `recommend()`):
//   0. the person's role priorities first (ROLE_PRIORITY, the brief's rule);
//   1. drop every module the person requested, and every module already sent;
//   2. drop inactive modules, and modules not yet released (RELEASES);
//   3. take the initial resource's `preferredFollowUps`, in order;
//   4. then the rest whose `roles` include the person's role, in catalogue order;
//   5. then the rest, in catalogue order.
// An empty result is "content exhausted", and the sequence completes.
//
// IDS. `id` is the register's code. `requestIds` are the ids a resource
// request is saved under (`resource_requests.resource_id`): a tool's page slug,
// a worksheet's register code in lower case, 'template-<slug>' for a template.
// A guide has no gate, so it has no request id and can only be recommended.
// `templateKey` names the marketing wording in drip-templates.ts.

import type { RoleCode } from './audience-roles';

export interface DripModule {
  /** The register's code. Stable. */
  id: string;
  /** What a resource request is saved as, when this module has a gate. */
  requestIds: string[];
  title: string;
  /** Absolute. The email carries it. */
  url: string;
  /** The matrix's topic word. */
  topic: string;
  /** The matrix's preferred follow-ups, in the matrix's order. */
  preferredFollowUps: string[];
  /** PROPOSED affinity. Empty means for everybody. */
  roles: RoleCode[];
  /** Catalogue order. Lower goes first among equals. */
  priority: number;
  /** False keeps a module out of every selection. LC-T10 and LC-T11 today. */
  active: boolean;
  /**
   * True only once Sunil has confirmed the released version (RELEASES below).
   * A module that is active but not released is never selected.
   */
  released: boolean;
  /** The marketing wording, in drip-templates.ts. */
  templateKey: string;
  /** The button label in the email. From the placement matrix. */
  cta: string;
}

const ORIGIN = 'https://learning.thelivingcraft.ai';

const m = (
  id: string,
  requestIds: string[],
  title: string,
  path: string,
  topic: string,
  preferredFollowUps: string[],
  roles: RoleCode[],
  cta: string,
  active = true,
): Omit<DripModule, 'priority' | 'templateKey' | 'released'> => ({
  id,
  requestIds,
  title,
  url: `${ORIGIN}${path}`,
  topic,
  preferredFollowUps,
  roles,
  active,
  cta,
});

const CATALOGUE: Omit<DripModule, 'priority' | 'templateKey' | 'released'>[] = [
  m('LC-T01', ['poc-screen'], 'The POC Selection Tool', '/resources/poc-screen', 'readiness',
    ['LC-G01', 'LC-TPL01', 'LC-T02', 'LC-R02', 'LC-T09'],
    ['founder', 'executive', 'product', 'operations', 'consultant'], 'Use the POC Selection Tool'),
  m('LC-T02', ['agent-authority-review'], 'The Agent Authority Review', '/resources/agent-authority-review', 'authority',
    ['LC-G02', 'LC-T06', 'LC-T04', 'LC-TPL03', 'LC-R03'],
    ['engineering_leader', 'engineer', 'data_ai', 'product', 'architect'], 'Use the Agent Authority Review'),
  m('LC-T03', ['model-selection-tool'], 'The Model Selection Tool', '/resources/model-selection-tool', 'model',
    ['LC-G03', 'LC-R02', 'LC-T07', 'LC-T04', 'LC-TPL03'],
    ['engineer', 'data_ai', 'engineering_leader'], 'Use the Model Selection Tool'),
  m('LC-T04', ['agent-failure-triage-kit'], 'The Agent Failure Triage Kit', '/resources/agent-failure-triage-kit', 'reliability',
    ['LC-R03', 'LC-G03', 'LC-T02', 'LC-R02', 'LC-TPL02'],
    ['engineer', 'engineering_leader', 'data_ai', 'operations'], 'Get the failure-triage checklist'),
  m('LC-T05', ['agent-memory-audit-kit'], 'The Agent Memory Audit Kit', '/resources/agent-memory-audit-kit', 'memory',
    ['LC-G02', 'LC-T06', 'LC-G03', 'LC-R02', 'LC-TPL03'],
    ['engineer', 'data_ai', 'engineering_leader'], 'Get the memory-audit checklist'),
  m('LC-T06', ['rule-placement-audit'], 'The Rule Placement Audit', '/resources/rule-placement-audit', 'authority',
    ['LC-G02', 'LC-T02', 'LC-T04', 'LC-TPL03', 'LC-R03'],
    ['engineer', 'engineering_leader', 'product', 'operations', 'architect'], 'Use the Rule Placement Audit'),
  m('LC-T07', ['run-cost-model'], 'The Run-Cost Model Tool', '/resources/run-cost-model', 'cost',
    ['LC-R01', 'LC-T08', 'LC-G01', 'LC-T01', 'LC-TPL03'],
    ['founder', 'executive', 'product', 'operations', 'consultant'], 'Use the Run-Cost Model'),
  m('LC-T08', ['cost-ceiling-workbook'], 'The Cost-Ceiling Workbook', '/resources/cost-ceiling-workbook', 'cost',
    ['LC-R01', 'LC-T07', 'LC-G01', 'LC-T01', 'LC-TPL03'],
    ['founder', 'executive', 'product', 'operations', 'engineering_leader'], 'Use the Cost-Ceiling calculator'),
  m('LC-T09', ['agent-design-check'], 'The Agent Design Check', '/tools/agent-design-check', 'design',
    ['LC-TPL01', 'LC-G04', 'LC-TPL02', 'LC-T02', 'LC-R02'],
    ['engineering_leader', 'engineer', 'product', 'data_ai', 'architect'], 'Use the Agent Design Check'),
  m('LC-R01', ['lc-r01', 'cost-ceiling-worksheet'], 'The Cost-Ceiling Worksheet', '/resources/cost-ceiling-worksheet', 'cost',
    ['LC-T07', 'LC-T08', 'LC-G01', 'LC-T01', 'LC-TPL03'],
    ['product', 'operations', 'engineering_leader', 'founder'], 'Open the Cost-Ceiling Worksheet'),
  m('LC-R02', ['lc-r02', 'evaluation-gates-worksheet'], 'The Evaluation Gates Worksheet', '/resources/evaluation-gates-worksheet', 'evaluation',
    ['LC-G03', 'LC-T03', 'LC-T04', 'LC-TPL02'],
    ['engineering_leader', 'engineer', 'data_ai', 'product', 'architect'], 'Open the Evaluation Gates Worksheet'),
  m('LC-R03', ['lc-r03', 'deployment-checklist'], 'The Deployment Checklist', '/resources/deployment-checklist', 'reliability',
    ['LC-T04', 'LC-G03', 'LC-T02', 'LC-R02', 'LC-TPL02'],
    ['engineering_leader', 'engineer', 'operations'], 'Get the Deployment Checklist'),
  m('LC-TPL01', ['template-agent-design-canvas'], 'The agent design canvas', '/resources/templates/agent-design-canvas', 'design',
    ['LC-T09', 'LC-G04', 'LC-TPL02', 'LC-T02', 'LC-R02'],
    ['engineering_leader', 'engineer', 'product', 'architect'], 'Download the reusable design template'),
  m('LC-TPL02', ['template-design-review-agenda'], 'The design review agenda', '/resources/templates/design-review-agenda', 'team',
    ['LC-TPL03', 'LC-T09', 'LC-T02', 'LC-R02'],
    ['engineering_leader', 'product', 'executive'], 'Download the reusable review agenda'),
  m('LC-TPL03', ['template-decision-record'], 'The decision record', '/resources/templates/decision-record', 'team',
    ['LC-TPL02', 'LC-T09', 'LC-T02', 'LC-R02'],
    ['engineering_leader', 'engineer', 'product', 'architect'], 'Download the reusable decision record'),
  m('LC-TPL04', ['template-employer-funding-summary'], 'The employer funding summary', '/resources/templates/employer-funding-summary', 'sponsorship',
    ['LC-TPL01', 'LC-T09', 'LC-G04', 'LC-TPL02', 'LC-T01'],
    ['engineer', 'engineering_leader', 'data_ai', 'student'], 'Download the employer-funding template'),
  m('LC-G01', [], 'Workflow or Agent?', '/resources/guides/workflow-or-agent', 'readiness',
    ['LC-T01', 'LC-TPL01', 'LC-T02', 'LC-R02', 'LC-T09'],
    ['founder', 'executive', 'product', 'operations', 'consultant'], 'Read Workflow or Agent?'),
  m('LC-G02', [], 'The Tool Permissions guide', '/resources/guides/tool-permissions', 'authority',
    ['LC-T02', 'LC-T06', 'LC-T04', 'LC-TPL03', 'LC-R03'],
    ['engineer', 'engineering_leader', 'data_ai', 'architect'], 'Read the Tool Permissions guide'),
  m('LC-G03', [], 'The Uncertain Evidence guide', '/resources/guides/uncertain-evidence', 'evaluation',
    ['LC-R02', 'LC-T03', 'LC-T04', 'LC-TPL02'],
    ['engineer', 'engineering_leader', 'data_ai', 'product'], 'Read the Uncertain Evidence guide'),
  m('LC-G04', [], 'Designing agentic systems', '/resources/guides/agentic-system-design', 'design',
    ['LC-TPL01', 'LC-T09', 'LC-TPL02', 'LC-T02', 'LC-R02'],
    ['engineering_leader', 'engineer', 'product', 'data_ai', 'architect'], 'Read the Agentic System Design guide'),
  // The two new resources. "Neither new resource is enabled for sending by
  // this handoff" (05-email-and-resource-routing, 28 September 2026). They are
  // recommendable the day somebody flips `active` here and approves the wording.
  m('LC-T10', ['agent-failure-triage-quiz'], 'The Agent Failure Triage Quiz', '/resources/agent-failure-triage-quiz', 'recovery',
    ['LC-T04', 'LC-R03', 'LC-G03', 'LC-T02', 'LC-R02'],
    ['engineer', 'engineering_leader', 'data_ai'], 'Take the quiz', false),
  m('LC-T11', ['rework-cost-check'], 'The Rework Cost Check', '/resources/rework-cost-check', 'cost and rework',
    ['LC-T07', 'LC-R01', 'LC-T08', 'LC-TPL03', 'LC-T01'],
    ['product', 'engineering_leader', 'founder', 'operations'], 'Run the check', false),
];

/**
 * Role first, from the resource brief: "Apply explicit interest/role first,
 * then topic relevance, then stable ID order", and specifically "prioritise
 * LC-TPL02/03 for a voluntarily supplied engineering-manager role, LC-T02/
 * TPL01 for an architect". Our engineering_leader is the brief's engineering
 * manager. Only a role the person chose on the form counts; a job title is
 * never read for this.
 *
 * The brief's third rule, LC-TPL04 for an explicit employer-funding goal, has
 * no entry: no form asks about that goal.
 */
export const ROLE_PRIORITY: Readonly<Partial<Record<RoleCode, readonly string[]>>> = {
  engineering_leader: ['LC-TPL02', 'LC-TPL03'],
  architect: ['LC-T02', 'LC-TPL01'],
};

/**
 * Which modules Sunil has confirmed for sending, and at which version.
 *
 * The resource brief (05-email-and-resource-routing, § Current catalogue and
 * release guard): "All begin disabled pending technical review and relevant
 * delivery tests." and "A URL returning 200 does not set released=true. Ein
 * must map these handoff IDs to the actual backend registry and Sunil must
 * confirm the released version before a module can be selected."
 *
 * So this starts EMPTY, and nothing is selected until it is not. To release a
 * module, add a line here in a reviewed pull request:
 *
 *   'LC-T02': { version: '<the version Sunil confirmed>', confirmedBy: 'Sunil Mathew', on: '2026-10-07' },
 *
 * While this is empty the planner HOLDS every due sequence rather than ending
 * it: "nothing is released yet" is a state of the catalogue, not a sign that
 * this person has seen everything. See runDripPlanner() in drip.ts.
 */
export const RELEASES: Readonly<Record<string, { version: string; confirmedBy: string; on: string }>> = {};

/** The catalogue in catalogue order, with the priority, the template key and the release filled in. */
export const DRIP_MODULES: readonly DripModule[] = CATALOGUE.map((x, i) => ({
  ...x,
  priority: i + 1,
  templateKey: `recommend-${x.id.toLowerCase()}`,
  released: Object.prototype.hasOwnProperty.call(RELEASES, x.id),
}));

export const moduleById = (id: string): DripModule | undefined =>
  DRIP_MODULES.find((x) => x.id.toLowerCase() === id.toLowerCase());

/** The module a resource request was saved under, or undefined for an id no module claims. */
export const moduleForRequestId = (requestId: string | null | undefined): DripModule | undefined => {
  const wanted = (requestId ?? '').trim().toLowerCase();
  if (!wanted) return undefined;
  return DRIP_MODULES.find((x) => x.requestIds.some((r) => r.toLowerCase() === wanted));
};
