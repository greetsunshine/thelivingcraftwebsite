// The Rule Placement Audit — the worksheet's vocabulary and its one rule.
//
// /resources/rule-placement-audit reads this twice: once in the page's
// frontmatter and once in its module script. Keeping the option lists, the
// status rule and the example row here means the two cannot drift. The page
// renders the columns; the script computes the status and builds the CSV.
//
// THIS FILE MUST IMPORT NOTHING THAT TOUCHES A SERVER. It is bundled into the
// browser, and the whole point of the worksheet is that nothing typed into it
// leaves the browser. `../lib/admin/csv` is allowed because it imports nothing
// at all (it says so at its top).

import { csvDocument, type CsvColumn } from '../lib/admin/csv';

/** Who set the rule. The three sources a hard rule can come from. */
export const SETTERS = ['User', 'Business', 'Legal or regulatory'] as const;
export type Setter = (typeof SETTERS)[number];

/** The three places a rule can be enforced. Any combination may be ticked. */
export const PLACEMENTS = [
  { key: 'before', label: 'In code, before the model' },
  { key: 'prompt', label: 'In the prompt' },
  { key: 'after', label: 'In code, after the model' },
] as const;
export type Placement = (typeof PLACEMENTS)[number]['key'];

/** The fix a flagged rule needs. */
export const FIXES = [
  'Filter before the model',
  'Check after the model',
  'Both',
  'None needed',
] as const;
export type Fix = (typeof FIXES)[number];

export interface Row {
  id: string;
  rule: string;
  setter: Setter;
  placements: Placement[];
  broken: string;
  fix: Fix;
  owner: string;
  /** True only on the pre-filled example row. It carries a label and nothing else. */
  example?: boolean;
}

/**
 * The status, computed and never stored.
 *
 *   'none'    nothing ticked — the rule is enforced nowhere
 *   'prompt'  only "In the prompt" ticked — the model weighs it, nothing holds it
 *   'code'    at least one code box ticked
 */
export type Status = 'none' | 'prompt' | 'code';

export const STATUS_LABEL: Record<Status, string> = {
  none: 'Not enforced',
  prompt: 'Prompt only',
  code: 'Enforced in code',
};

/** The order the rule map lists groups in. Worst first. */
export const STATUS_ORDER: Status[] = ['none', 'prompt', 'code'];

export function statusOf(placements: readonly Placement[]): Status {
  if (placements.includes('before') || placements.includes('after')) return 'code';
  if (placements.includes('prompt')) return 'prompt';
  return 'none';
}

/** The worked example. One row, from the LinkedIn post's restaurant agent. */
export const EXAMPLE_ROW: Row = {
  id: 'example',
  rule: "User's no-go restaurant list",
  setter: 'User',
  placements: ['prompt'],
  broken: 'Agent recommends a restaurant the user blocked',
  fix: 'Both',
  owner: 'Recommendations team',
  example: true,
};

/** A blank row. A fresh id each time so two rows never share one. */
export function blankRow(id: string): Row {
  return { id, rule: '', setter: 'User', placements: [], broken: '', fix: 'None needed', owner: '' };
}

/** Where the browser keeps the sheet. Bump the suffix if the row shape changes. */
export const STORAGE_KEY = 'tlc:rule-placement-audit:v1';

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
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const placements = Array.isArray(r.placements)
      ? (r.placements.filter((p): p is Placement =>
          PLACEMENTS.some((x) => x.key === p),
        ) as Placement[])
      : [];
    rows.push({
      id: typeof r.id === 'string' && r.id ? r.id : `r${rows.length}`,
      rule: typeof r.rule === 'string' ? r.rule : '',
      setter: SETTERS.includes(r.setter as Setter) ? (r.setter as Setter) : 'User',
      placements,
      broken: typeof r.broken === 'string' ? r.broken : '',
      fix: FIXES.includes(r.fix as Fix) ? (r.fix as Fix) : 'None needed',
      owner: typeof r.owner === 'string' ? r.owner : '',
      example: r.example === true ? true : undefined,
    });
  }
  return rows;
}

/** CSV columns, in the worksheet's column order. Status is included because
 *  it is the one thing the reader cannot see in a spreadsheet otherwise. */
export const CSV_COLUMNS: CsvColumn[] = [
  { key: 'rule', header: 'Rule' },
  { key: 'setter', header: 'Who set it' },
  { key: 'before', header: 'In code, before the model' },
  { key: 'prompt', header: 'In the prompt' },
  { key: 'after', header: 'In code, after the model' },
  { key: 'status', header: 'Status' },
  { key: 'broken', header: 'What happens if it is broken' },
  { key: 'fix', header: 'Fix to add' },
  { key: 'owner', header: 'Owner' },
];

export function csvOf(rows: readonly Row[]): string {
  return csvDocument(
    CSV_COLUMNS,
    rows.map((r) => ({
      rule: r.rule,
      setter: r.setter,
      before: r.placements.includes('before') ? 'yes' : 'no',
      prompt: r.placements.includes('prompt') ? 'yes' : 'no',
      after: r.placements.includes('after') ? 'yes' : 'no',
      status: STATUS_LABEL[statusOf(r.placements)],
      broken: r.broken,
      fix: r.fix,
      owner: r.owner,
    })),
  );
}

export const CSV_FILENAME = 'rule-placement-audit.csv';
