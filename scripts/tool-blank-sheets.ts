// Blank copies of the two tools whose own export is built in the browser.
//
// The Rule Placement Audit and the Agent Design Check promise that nothing a
// visitor types is sent anywhere: their CSV and their summary are made by the
// page itself (`local()` in src/pages/api/pipeline/download.ts). These two
// files are the other download, the tool itself, blank and reusable, and they
// are static: the same file for everyone, carrying nothing anybody typed.
//
//   downloads/rule-placement-audit-worksheet.md   the empty worksheet
//   downloads/agent-design-check-questions.md     the nineteen questions
//
// Every word comes from the page's data module. Markdown, because it is the
// site's format for blank templates and it opens anywhere.
//
//   npm run tool-downloads   (runs this with the three workbooks)

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as rpa from '../src/data/rule-placement-audit';
import * as adc from '../src/data/agent-design-check';
import { TOOL_CREDIT } from '../src/data/resources';
import { SITE_ORIGIN } from '../src/data/facts';
import { APPLY_URL, cohortInvitationFor } from '../src/data/resource-cohort-copy';

// The last line of each sheet: the page's cohort invitation and the full
// application address (outreach readiness handoff, 28 September 2026).
const cohortFooter = (path: string) => ['', '---', '', `${cohortInvitationFor(path)} Apply at ${APPLY_URL}`];

const outDir = process.argv[2] ?? 'downloads';
const cell = (s: string) => s.replace(/\|/g, '\\|');

// ── the Rule Placement Audit: the empty worksheet ───────────────────────────

const ROWS = 12;
const columns = rpa.CSV_COLUMNS.filter((c) => c.key !== 'flags').map((c) => c.header);
const audit = [
  `# ${rpa.HEADLINE}`,
  '',
  `**${rpa.SUBTITLE}**`,
  '',
  `${TOOL_CREDIT}. The same audit, with the status and the rule map worked out as you go: ${SITE_ORIGIN}/resources/rule-placement-audit`,
  '',
  '## What to bring',
  '',
  rpa.BRING,
  '',
  '## What you do',
  '',
  rpa.DO,
  '',
  '## What you leave with',
  '',
  rpa.LEAVE,
  '',
  '## How to run it with a team',
  '',
  ...rpa.RUN_IT.map((s, i) => `${i + 1}. **${s.lead}** ${s.rest}`),
  '',
  '## The columns',
  '',
  `- **Who set it:** ${rpa.SETTERS.map((s) => `${s.label} (${s.means})`).join('; ')}.`,
  `- **Agents that can act on it:** ${rpa.REACH.map((s) => `${s.label} (${s.means})`).join('; ')}.`,
  ...rpa.PLACEMENTS.map((p) => `- **${p.label}:** ${p.means}. Tick it only when someone can point at it.`),
  `- **Fix to add:** ${rpa.FIXES.map((f) => f.label).join('; ')}.`,
  '',
  '## Reading a row: the status',
  '',
  '| When | Status | What it means |',
  '|---|---|---|',
  ...rpa.RUBRIC.map((r) => `| ${cell(r.when)} | ${cell(rpa.STATUS_LABEL[r.then])} | ${cell(r.may)} |`),
  '',
  `${rpa.MOVE_LINE}`,
  '',
  '## The worksheet',
  '',
  `One row per rule. Mark each placement column with an x when it applies.`,
  '',
  `| # | ${columns.map(cell).join(' | ')} |`,
  `|---|${columns.map(() => '---').join('|')}|`,
  ...Array.from({ length: ROWS }, (_, i) => `| ${i + 1} |${columns.map(() => '  ').join('|')}|`),
  '',
  '## Why placement matters',
  '',
  ...rpa.WHY.flatMap((p) => [p, '']),
  ...cohortFooter('/resources/rule-placement-audit'),
].join('\n');

// ── the Agent Design Check: the question list ───────────────────────────────

const answers: adc.Answer[] = ['yes', 'no', 'not-yet-defined'];
const check = [
  `# The Agent Design Check`,
  '',
  `${TOOL_CREDIT}. The same check, with the next steps put in order for you: ${SITE_ORIGIN}/tools/agent-design-check`,
  '',
  `${adc.QUESTIONS.length} questions over ${adc.AREAS.length} areas. For each one, tick one answer. Each answer says what it leads to.`,
  '',
  '## How the answers are read',
  '',
  ...adc.RULES.map((r) => `- ${r}`),
  '',
  ...answers.map((a) => `- **${adc.STANDINGS[a].choice}.** ${adc.STANDINGS[a].meaning}`),
  '',
  ...adc.AREAS.flatMap((area) => [
    `## ${area.title}`,
    '',
    area.blurb,
    '',
    ...adc.QUESTIONS.filter((q) => q.area === area.id).flatMap((q) => {
      const n = adc.QUESTIONS.indexOf(q) + 1;
      return [
        `### ${n}. ${q.label}`,
        '',
        q.ask,
        '',
        `- [ ] ${adc.STANDINGS.yes.choice}. Next: ${q.onYes}`,
        `- [ ] ${adc.STANDINGS.no.choice}. Next: ${q.onGap}`,
        `- [ ] ${adc.STANDINGS['not-yet-defined'].choice}. Next: ${q.onUnwritten}`,
        '',
        `*Why it matters:* ${q.why}`,
        '',
        `*Example:* ${q.example}`,
        '',
      ];
    }),
  ]),
  ...cohortFooter('/tools/agent-design-check'),
].join('\n');

for (const [name, body] of [
  ['rule-placement-audit-worksheet.md', audit],
  ['agent-design-check-questions.md', check],
] as const) {
  writeFileSync(join(outDir, name), body.trimEnd() + '\n', 'utf8');
  console.log(`${join(outDir, name)}  ${Math.round(body.length / 1024)} KB`);
}
