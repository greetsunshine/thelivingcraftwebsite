// The Rule Placement Audit — every string, the status rule and the worked example.
//
// /resources/rule-placement-audit reads this twice: once in the page's
// frontmatter and once in its module script. Keeping the vocabulary, the
// status rule and the example rows here means the sheet, the tally bar, the
// rule map, the copied text and the CSV all read one rubric.
//
// THIS FILE MUST IMPORT NOTHING THAT TOUCHES A SERVER. It is bundled into the
// browser, and the whole point of the audit is that nothing typed into it
// leaves the browser. `../lib/admin/csv` is allowed because it imports nothing
// at all (it says so at its top).

import { csvDocument, type CsvColumn } from '../lib/admin/csv';

export const TOOL_NAME = 'The Rule Placement Audit';

/** The H1 and the line under it. Both fixed by the brief; do not reword. */
export const HEADLINE = 'Rule Placement Audit';
export const SUBTITLE = 'Where is each hard rule actually enforced?';

/** The three blocks at the top, in this order. Fixed by the brief; do not reword. */
export const BRING =
  "A list of the rules your agent must never break (for example user no-go lists, allergens, spending limits, regions you can't serve), and a rough sketch of how one request travels through your system, from the user's input to the answer they see.";
export const DO =
  'For each rule, mark where it is enforced: in code before the model sees the inputs, in the prompt, in code after the model answers, or nowhere. Flag every rule enforced only in the prompt or nowhere, and note the filter or check it needs.';
export const LEAVE =
  "A one-page map of your agent's hard rules and where each one is enforced, with the prompt-only and unenforced rules flagged as the first to move into code.";

/** The primary button. Fixed by the brief. */
export const CTA = 'Use the Rule Placement Audit';

/** Who set the rule. */
export const SETTERS = [
  { value: 'user', label: 'User', means: 'a preference or a limit the user gave you' },
  { value: 'business', label: 'Business', means: 'a policy the company set' },
  { value: 'legal', label: 'Legal or regulatory', means: 'a law, a licence or a regulator' },
] as const;
export type Setter = (typeof SETTERS)[number]['value'];

/**
 * How many agents can act on the rule. This is the multi-agent question. A
 * check inside one agent's loop does not cover a second agent that calls the
 * same tool, and a new agent added next quarter will not know the rule exists.
 */
export const REACH = [
  { value: 'one', label: 'One agent', means: 'only one agent can take an action this rule covers' },
  {
    value: 'several',
    label: 'More than one',
    means: 'two or more agents, or an agent and a scheduled job, can take that action',
  },
  { value: 'unknown', label: 'Not sure', means: 'nobody has listed which agents can act on it' },
] as const;
export type Reach = (typeof REACH)[number]['value'];

/**
 * Where a rule can be enforced. Any combination may be ticked. `code` says
 * whether the placement is deterministic: code either runs or it does not,
 * while a prompt and a critic are both something a model weighs.
 */
export const PLACEMENTS = [
  {
    key: 'before',
    label: 'In code, before the model',
    short: 'Code before',
    code: true,
    means: 'a filter removes what the model must never choose before the model sees the inputs',
  },
  {
    key: 'prompt',
    label: 'In the prompt',
    short: 'Prompt',
    code: false,
    means: 'the rule is written in the system prompt or the instructions; the model weighs it',
  },
  {
    key: 'critic',
    label: 'By another model',
    short: 'Critic',
    code: false,
    means: 'a critic, a judge, a guardrail model or a reviewer agent checks the step; also weighed',
  },
  {
    key: 'after',
    label: 'In code, after the model',
    short: 'Code after',
    code: true,
    means: 'a check tests the answer or the action against the rule before the user sees it or it runs',
  },
  {
    key: 'boundary',
    label: 'In code, at the tool or data boundary',
    short: 'Boundary',
    code: true,
    means: 'the tool, the API or the database refuses, whichever agent asked',
  },
] as const;
export type Placement = (typeof PLACEMENTS)[number]['key'];

/** The fix a flagged rule needs. */
export const FIXES = [
  { value: 'filter', label: 'Filter before the model', short: 'Filter before' },
  { value: 'check', label: 'Check after the model', short: 'Check after' },
  { value: 'both', label: 'Both', short: 'Both' },
  { value: 'boundary', label: 'Enforce at the tool or data boundary', short: 'Boundary' },
  { value: 'none', label: 'None needed', short: 'None needed' },
] as const;
export type Fix = (typeof FIXES)[number]['value'];

export const FIELD_MAX = { rule: 120, broken: 160, owner: 60 } as const;

export interface Row {
  id: string;
  rule: string;
  setter: Setter;
  reach: Reach;
  placements: Placement[];
  broken: string;
  fix: Fix;
  owner: string;
  /** True only on the worked example's rows. Carries a label and nothing else. */
  example?: boolean;
}

/**
 * The status, computed and never stored.
 *
 *   'none'    nothing ticked: the rule is enforced nowhere
 *   'prompt'  only the prompt: the model weighs it, nothing holds it
 *   'model'   a critic or guardrail model checks it, and no code does: a
 *             second opinion, still weighed
 *   'code'    at least one code placement is ticked
 */
export type Status = 'none' | 'prompt' | 'model' | 'code';

export const STATUSES: { key: Status; label: string; glyph: string; move: boolean; means: string }[] = [
  {
    key: 'none',
    label: 'Not enforced',
    glyph: '×',
    move: true,
    means: 'no placement is ticked. Nothing in the system stops this rule being broken.',
  },
  {
    key: 'prompt',
    label: 'Prompt only',
    glyph: '!',
    move: true,
    means: 'only "In the prompt" is ticked. The model weighs the rule against everything else in the context.',
  },
  {
    key: 'model',
    label: 'Model only',
    glyph: '!',
    move: true,
    means: 'a critic, judge or guardrail model checks it, and no code does. A second model weighing is still weighing.',
  },
  {
    key: 'code',
    label: 'Enforced in code',
    glyph: '✓',
    move: false,
    means: 'at least one code placement is ticked: a filter before, a check after, or the boundary refuses.',
  },
];

export const STATUS_LABEL: Record<Status, string> = Object.fromEntries(
  STATUSES.map((s) => [s.key, s.label]),
) as Record<Status, string>;

/** The order the rule map lists groups in. Worst first. */
export const STATUS_ORDER: Status[] = STATUSES.map((s) => s.key);

/** The line under every group that is not code. Fixed by the brief. */
export const MOVE_LINE = 'Move these into code first.';

export function statusOf(placements: readonly Placement[]): Status {
  if (placements.some((p) => PLACEMENTS.find((x) => x.key === p)?.code)) return 'code';
  if (placements.includes('critic')) return 'model';
  if (placements.includes('prompt')) return 'prompt';
  return 'none';
}

/**
 * What to look at before moving on, per row. Each flag names a gap the
 * status alone does not show. Multi-agent reach is the one people miss.
 */
export function flagsFor(row: Row): string[] {
  const out: string[] = [];
  const status = statusOf(row.placements);
  const boundary = row.placements.includes('boundary');
  if (status === 'none') out.push('Nothing enforces this rule. Start here.');
  if (status === 'prompt') {
    out.push('The prompt is something the model weighs. Add a filter before the model, a check after it, or both.');
  }
  if (status === 'model') {
    out.push('A critic or guardrail model is a second opinion, not a guarantee. Keep it, and add a check in code.');
  }
  if (row.reach === 'several' && !boundary) {
    out.push(
      'More than one agent can act on this rule and it is not enforced at the tool or data boundary. A check inside one agent does not cover the others.',
    );
  }
  if (row.reach === 'unknown') {
    out.push('List which agents can act on this rule. A rule enforced in one agent is not enforced in the ones you have not listed.');
  }
  if (row.fix === 'none' && status !== 'code') {
    out.push('Fix to add is "None needed", but nothing in code enforces this rule yet.');
  }
  return out;
}

/**
 * The worked example: a restaurant-picking product with three agents. The
 * first row is the one from the post, word for word. The others show the
 * other three statuses and the multi-agent flag.
 */
export const EXAMPLE_TITLE = 'A restaurant-picking app with three agents';
export const EXAMPLE_SETTING =
  'A planner agent reads the request, a recommender agent picks restaurants, and a booking agent reserves a table and pays a deposit. All three can call the same booking and payment tools.';

export const EXAMPLE_ROWS: Row[] = [
  {
    id: 'ex-1',
    rule: "User's no-go restaurant list",
    setter: 'user',
    reach: 'one',
    placements: ['prompt'],
    broken: 'Agent recommends a restaurant the user blocked',
    fix: 'both',
    owner: 'Recommendations team',
    example: true,
  },
  {
    id: 'ex-2',
    rule: 'Never suggest a dish containing a declared allergen',
    setter: 'user',
    reach: 'several',
    placements: ['prompt', 'critic'],
    broken: 'A user with a nut allergy is sent to a satay place; the critic model passed it',
    fix: 'both',
    owner: 'Recommendations team',
    example: true,
  },
  {
    id: 'ex-3',
    rule: 'Deposit per booking never above ₹2,000 without a human approval',
    setter: 'business',
    reach: 'several',
    placements: ['after'],
    broken: 'A ₹12,000 deposit goes out for a party of twenty; the planner agent called the payment tool directly',
    fix: 'boundary',
    owner: 'Payments team',
    example: true,
  },
  {
    id: 'ex-4',
    rule: 'No bookings for venues outside the licensed delivery region',
    setter: 'legal',
    reach: 'unknown',
    placements: [],
    broken: 'A reservation is made across the state line, where the product is not licensed',
    fix: 'boundary',
    owner: '',
    example: true,
  },
];

export const EXAMPLE_TAG = 'Example — delete when you start';

/** A blank row. A fresh id each time so two rows never share one. */
export function blankRow(id: string): Row {
  return { id, rule: '', setter: 'user', reach: 'one', placements: [], broken: '', fix: 'none', owner: '' };
}

export const MAX_ROWS = 40;

/** Where the browser keeps the sheet. Bump the suffix if the row shape changes. */
export const STORAGE_KEY = 'tlc:rule-placement-audit:v2';

/**
 * Read stored JSON back into rows, dropping anything that is not the shape
 * above. A bad value in storage gives an empty sheet, never a crash.
 */
export function parseRows(json: string): Row[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const rows: Row[] = [];
  for (const item of data.slice(0, MAX_ROWS)) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const placements = Array.isArray(r.placements)
      ? (r.placements.filter((p): p is Placement => PLACEMENTS.some((x) => x.key === p)) as Placement[])
      : [];
    rows.push({
      id: typeof r.id === 'string' && r.id ? r.id : `r${rows.length}`,
      rule: typeof r.rule === 'string' ? r.rule.slice(0, FIELD_MAX.rule) : '',
      setter: SETTERS.some((s) => s.value === r.setter) ? (r.setter as Setter) : 'user',
      reach: REACH.some((s) => s.value === r.reach) ? (r.reach as Reach) : 'one',
      placements,
      broken: typeof r.broken === 'string' ? r.broken.slice(0, FIELD_MAX.broken) : '',
      fix: FIXES.some((f) => f.value === r.fix) ? (r.fix as Fix) : 'none',
      owner: typeof r.owner === 'string' ? r.owner.slice(0, FIELD_MAX.owner) : '',
      example: r.example === true ? true : undefined,
    });
  }
  return rows;
}

export const labelOfSetter = (v: Setter): string => SETTERS.find((s) => s.value === v)?.label ?? v;
export const labelOfReach = (v: Reach): string => REACH.find((s) => s.value === v)?.label ?? v;
export const labelOfFix = (v: Fix): string => FIXES.find((f) => f.value === v)?.label ?? v;
export const labelOfPlacement = (p: Placement): string =>
  PLACEMENTS.find((x) => x.key === p)?.label ?? p;

/** What the whole sheet says, for the tally bar and the result card. */
export function readSheet(rows: readonly Row[]): {
  total: number;
  counts: Record<Status, number>;
  toMove: number;
  band: 'none' | 'progress' | 'done';
  headline: string;
  note: string;
} {
  const counts: Record<Status, number> = { none: 0, prompt: 0, model: 0, code: 0 };
  for (const r of rows) counts[statusOf(r.placements)] += 1;
  const total = rows.length;
  const toMove = total - counts.code;
  if (total === 0) {
    return {
      total,
      counts,
      toMove,
      band: 'none',
      headline: 'Not started',
      note: 'Add a rule, or load the worked example.',
    };
  }
  if (toMove === 0) {
    return {
      total,
      counts,
      toMove,
      band: 'done',
      headline: 'Every rule is enforced in code',
      note: 'Read the flags below before you call it done.',
    };
  }
  return {
    total,
    counts,
    toMove,
    band: 'progress',
    headline: `${toMove} ${toMove === 1 ? 'rule' : 'rules'} to move into code`,
    note: `${counts.none} not enforced · ${counts.prompt} prompt only · ${counts.model} model only`,
  };
}

/** The rubric, printed on the page: how the ticks become a status. */
export const RUBRIC: { when: string; then: Status; may: string }[] = [
  {
    when: 'No placement ticked',
    then: 'none',
    may: 'The rule exists in a document or in somebody’s head. Nothing in the system reads it.',
  },
  {
    when: 'Only "In the prompt" ticked',
    then: 'prompt',
    may: 'The model reads the rule and usually follows it. Some of the time it does not, and nothing notices.',
  },
  {
    when: '"By another model" ticked, and no code placement',
    then: 'model',
    may: 'A second model reads the step and usually catches the break. It is graded on the same distribution as the first one, and the same inputs fool both.',
  },
  {
    when: 'Any of "In code, before", "In code, after" or "at the boundary" ticked',
    then: 'code',
    may: 'Code either runs or it does not. If the rule is broken, the check itself has a bug, which is a bug you can find.',
  },
];

/** The short explanation under the rubric. Under 150 words, as the brief asks. */
export const WHY = [
  'A rule written in the prompt is one input among many. The model weighs it against the user’s message, the retrieved data and everything else in the context. Most of the time it complies. Some of the time it does not, and nothing in the system notices. A critic model checking the step is the same thing twice: a second weighing, with the same blind spots.',
  'Code does not weigh. There are two places to put a rule in code. A filter before the model removes what the model must never choose before it sees the inputs: if the blocked restaurants are not in the candidate list, the model cannot recommend one. A check after the model tests the answer or the action against the rule before it reaches the user or runs. When more than one agent can act, put the check at the tool or data boundary, so it holds whichever agent asked.',
];

/** How to run it with a team. No durations: the brief does not state them. */
export const RUN_IT = [
  {
    lead: 'List the rules before anyone opens the code.',
    rest: 'Ask each person to write down the rules the agent must never break. The union of the lists is the sheet. The rules only one person knew about are the ones to worry about.',
  },
  {
    lead: 'Trace one request, and tick what you can point at.',
    rest: 'For each rule, follow one request from input to answer and tick a placement only when someone can name the file, the prompt line or the tool setting that enforces it. A placement nobody can point at is not ticked.',
  },
  {
    lead: 'Fill "What happens if it is broken" in one sentence each.',
    rest: 'That sentence is what decides the order of the fixes. A rule with a refund in it goes before a rule with a tone in it.',
  },
  {
    lead: 'Give every flagged rule an owner and a fix, then print the map.',
    rest: 'The map is the artefact. The prompt-only and model-only rows at the top are the first pull requests.',
  },
];

/** CSV columns, in the sheet's order. Status is included because it is the
 *  one thing the reader cannot see in a spreadsheet otherwise. */
export const CSV_COLUMNS: CsvColumn[] = [
  { key: 'rule', header: 'Rule' },
  { key: 'setter', header: 'Who set it' },
  { key: 'reach', header: 'Agents that can act on it' },
  ...PLACEMENTS.map((p) => ({ key: p.key, header: p.label })),
  { key: 'status', header: 'Status' },
  { key: 'broken', header: 'What happens if it is broken' },
  { key: 'fix', header: 'Fix to add' },
  { key: 'owner', header: 'Owner' },
  { key: 'flags', header: 'Flags' },
];

export function csvOf(rows: readonly Row[]): string {
  return csvDocument(
    CSV_COLUMNS,
    rows.map((r) => ({
      rule: r.rule,
      setter: labelOfSetter(r.setter),
      reach: labelOfReach(r.reach),
      ...Object.fromEntries(PLACEMENTS.map((p) => [p.key, r.placements.includes(p.key) ? 'yes' : 'no'])),
      status: STATUS_LABEL[statusOf(r.placements)],
      broken: r.broken,
      fix: labelOfFix(r.fix),
      owner: r.owner,
      flags: flagsFor(r).join(' | '),
    })),
  );
}

export const CSV_FILENAME = 'rule-placement-audit.csv';

/** The map as plain text, for the copy button. One owner for the format. */
export function mapText(rows: readonly Row[]): string {
  const read = readSheet(rows);
  const lines: string[] = [HEADLINE, SUBTITLE, '', `${read.headline}. ${read.note}`, ''];
  for (const s of STATUSES) {
    const items = rows.filter((r) => statusOf(r.placements) === s.key);
    lines.push(`${s.label} (${items.length})`);
    if (s.move && items.length) lines.push(MOVE_LINE);
    items.forEach((r, i) => {
      const name = r.rule.trim() || '(no rule text yet)';
      lines.push(`  ${i + 1}. ${name}`);
      lines.push(
        `     Set by: ${labelOfSetter(r.setter)} · Agents: ${labelOfReach(r.reach)} · Fix: ${labelOfFix(r.fix)}${
          r.owner.trim() ? ` · Owner: ${r.owner.trim()}` : ''
        }`,
      );
      if (r.placements.length) lines.push(`     Enforced: ${r.placements.map(labelOfPlacement).join('; ')}`);
      if (r.broken.trim()) lines.push(`     If broken: ${r.broken.trim()}`);
      for (const f of flagsFor(r)) lines.push(`     ! ${f}`);
    });
    if (!items.length) lines.push('  None.');
    lines.push('');
  }
  return lines.join('\n');
}
