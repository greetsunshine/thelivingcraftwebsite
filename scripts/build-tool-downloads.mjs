#!/usr/bin/env node
// Builds the blank tool downloads: `npm run tool-downloads`.
//
//   downloads/poc-selection-tool.xlsx
//   downloads/model-selection-tool.xlsx
//   downloads/agent-authority-review.xlsx
//   downloads/rule-placement-audit-worksheet.md
//   downloads/agent-design-check-questions.md
//
// The workbooks are two halves: scripts/tool-workbooks-data.ts prints the data
// modules as JSON, scripts/tool-workbooks.py writes the sheets. The two
// Markdown sheets come from scripts/tool-blank-sheets.ts. Commit the output.
//
// Portable on purpose: on Windows `python3` is often the Microsoft Store
// placeholder, which prints an advert and exits, so this finds a Python that
// actually runs (PYTHON, then python3, then python, then py).

import { execFileSync, spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32', ...opts });

function findPython() {
  for (const cmd of [process.env.PYTHON, 'python3', 'python', 'py'].filter(Boolean)) {
    // No shell: python is an executable, and cmd.exe would mangle the -c argument.
    const r = spawnSync(cmd, ['-c', 'import openpyxl, PIL; print("ok")'], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim() === 'ok') return cmd;
  }
  throw new Error('No Python with openpyxl and Pillow found. Install them (pip install openpyxl pillow) or set PYTHON.');
}

const json = run(npx, ['-y', 'tsx', 'scripts/tool-workbooks-data.ts'], { maxBuffer: 32 * 1024 * 1024 });
const python = findPython();
process.stdout.write(run(python, ['scripts/tool-workbooks.py', 'downloads'], { input: json, shell: false }));
process.stdout.write(run(npx, ['-y', 'tsx', 'scripts/tool-blank-sheets.ts', 'downloads']));
