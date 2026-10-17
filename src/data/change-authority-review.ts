// Copy and the worked example for /resources/change-authority-review.
//
// The RULES are in src/lib/changeAuthority.ts. This file holds only words and
// the example's rows, so changing a sentence is not a change to a formula.
//
// Two readers: the page imports it, and
// tools/change-authority-review/dump_content.ts prints it as JSON for the
// workbook builder. The page and the .xlsx therefore say the same thing in the
// same words. The example is also a test fixture:
// src/lib/changeAuthority.test.ts asserts the brief's expected outputs against
// it, and tools/change-authority-review/verify_xlsx.py asserts the workbook
// agrees.
//
// Released 17 October 2026: a row in src/data/resources.ts (Agentic system
// design 11), which /resources, the sitemap and /llms.txt read. Not featured,
// so no row in resource-choices.ts.

import type { Action, Answer, Authority, Requirements, Undo } from '../lib/changeAuthority.ts'; // explicit .ts: node's type-stripping resolver will not guess it
import { EMPTY_REQUIREMENTS } from '../lib/changeAuthority.ts';

export const RESOURCE_ID = 'change-authority-review';
export const TITLE = 'Change Authority Review';
export const TAGLINE = 'Your agent’s access says what it can do. Decide who gives it the authority to act.';
export const QUESTION = 'What may the agent do, and who gives it the authority to do it?';

/** Released on 17 October 2026. The resources.ts row carries the same date. */
export const PUBLISHED_AT = '2026-10-17';

/** The download gate hands the workbook out as this kind (src/pages/api/pipeline/download.ts). */
export const DOWNLOAD_KIND = 'xlsx';
export const FILENAME = 'change-authority-review.xlsx';

// ── the opening: bring, do, leave with ───────────────────────────────────────

export const BRING =
  'One agent and the artifact or system it changes; a list of every action it can take (edit, save a version, restore, delete, publish, send, notify, change permissions, call an external API); and a test environment where you can try undoing each action.';
export const DO =
  'List every action, try to undo each one and record what remains, give each action an authority level (Agent acts, Preview and consent or Not allowed), fill in what each level needs, and score the ten checks.';
export const LEAVE =
  'An authority map for that agent (each action, whether it can really be undone, who authorises it and what the preview must show), a list of actions whose authority isn’t ready, and a decision: Ready, Fix first or Hold.';
export const HOW_TO_USE = 'Work left to right through tabs 1–3. The Worked Example tab shows a completed version.';
export const LEGEND = 'Shaded cells are yours to fill. Everything else calculates.';
export const LICENCE_LINE = 'Content CC BY 4.0';

/** The note above the Action Inventory table, in the workbook. */
export const INVENTORY_NOTE =
  'Mark each action from a real undo attempt. Saving a version, restoring a version and renaming often feel reversible. Check what the history, notifications and other people’s screens show afterwards.';

// ── why this exists ──────────────────────────────────────────────────────────
// Sunil's wording, verbatim from the brief. Add nothing to it, and never name
// the employer: CLAUDE.md, "Instructor".

export const WHY =
  'On a project Sunil led at a MAANG company, agents previewed the changes they would make to an artifact as part of generating content. The design question was what access and authority the agent should have, who should authorise its changes, and how to manage versions and changes that can’t be undone. The approach: every non-reversible change needed the user’s consent. The agent showed the user the changes, got their consent, and then made them on the user’s behalf.';

/** Access is not authority: the brief's two sentences. */
export const ACCESS = 'Access is a permission granted once.';
export const AUTHORITY = 'Authority is a decision about each change.';

/** The finding the workbook encodes, said once on the page. */
export const FINDING =
  'Actions that feel safe because they can be “rolled back” are often not reversible. Saving a new version is the common case. Rolling back restores the earlier content, but the version the agent created stays in the history, and others may already have seen it. So the workbook classifies each action by what an undo actually leaves behind, not by whether an undo button exists.';

// ── the framework ────────────────────────────────────────────────────────────

export interface AuthorityRow {
  authority: Authority;
  when: string;
  needs: string;
}

export const AUTHORITY_TABLE: AuthorityRow[] = [
  {
    authority: 'Agent acts',
    when: 'The action can be fully undone, and nobody but the user sees the result before it can be undone',
    needs: 'An undo path that has been tested, not assumed',
  },
  {
    authority: 'Preview and consent',
    when: 'The action can’t be fully undone, or other people or systems see the result',
    needs:
      'A preview showing the full change and what can’t be undone; a named person who consents to each change; the agent acting as that person; a safe outcome if they say no',
  },
  {
    authority: 'Not allowed',
    when: 'The agent doesn’t need this action',
    needs: 'The access removed, not just unused',
  },
];

export interface UndoRow {
  answer: Undo;
  meaning: string;
  example: string;
}

export const UNDO_TABLE: UndoRow[] = [
  { answer: 'Yes', meaning: 'An undo leaves nothing anyone could act on', example: 'Discarding a draft in the editor preview' },
  {
    answer: 'Partly',
    meaning:
      'The content can be restored, but a trace remains: a history entry, a notification, a copy, a link someone saved',
    example: 'Saving a new version; restoring an earlier version',
  },
  { answer: 'No', meaning: 'It can’t be undone', example: 'Publishing; sending a message; notifying people' },
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
    name: 'Action Inventory',
    sheet: '1 · Action Inventory',
    ask: 'What can the agent do, and can each action really be undone?',
    catches:
      'Marking an action reversible because an undo button exists, such as treating “save a new version” as safe. Each action is marked from a real undo attempt, and the sheet suggests an authority from what the undo left behind.',
  },
  {
    n: '02',
    name: 'Authority Requirements',
    sheet: '2 · Authority Requirements',
    ask: 'Does each authority level have what it needs?',
    catches:
      'A consent step on paper that doesn’t work, such as a preview that hides what can’t be undone, or an “always allow” setting. Each row names the first thing missing.',
  },
  {
    n: '03',
    name: 'Checklist',
    sheet: '3 · Checklist',
    ask: 'Is the agent’s authority ready for real users?',
    catches:
      'Letting an agent act for real users before its authority is ready. Ten checks, four of them critical, end in one decision and name the next thing to fix.',
  },
];

// ── the worked example ───────────────────────────────────────────────────────

export const EXAMPLE_LABEL =
  'Illustrative example: an agent that drafts and edits a shared document for a user. Not a real system, company or real figures.';

const act = (
  name: string,
  changes: string,
  undo: Action['undo'],
  seenBy: Action['seenBy'],
  tested: Action['tested'],
  chosen: Action['chosen'] = '',
  reason = '',
): Action => ({ name, changes, undo, seenBy, tested, chosen, reason });

export const EXAMPLE_ACTIONS: Action[] = [
  act('Draft text in the editor preview', 'Text in the preview pane only', 'Yes', 'The user only', 'Yes'),
  act('Apply an edit to the user’s working draft', 'The user’s unsaved working draft', 'Yes', 'The user only', 'Yes'),
  act('Save a new version', 'Adds a version to the document’s history', 'Partly', 'Other people', 'Yes'),
  act('Restore an earlier version', 'Replaces the current text and adds a history entry', 'Partly', 'Other people', 'No'),
  act('Publish to the shared space', 'The copy everyone with access reads', 'No', 'Other people', 'No'),
  act('Notify collaborators', 'Sends a message to each collaborator', 'No', 'Other people', 'No'),
  act(
    'Delete a section',
    'Removes a section from the working draft',
    'Yes',
    'The user only',
    'No',
    'Preview and consent',
    'Users don’t expect a section to disappear without being asked',
  ),
  act('Rename the document', 'The title everyone sees in the shared space', 'Yes', 'Other people', 'Yes', 'Agent acts'),
  act(
    'Change sharing permissions',
    'Who can open and edit the document',
    'No',
    'Other people',
    'No',
    'Not allowed',
    'The agent doesn’t need this; sharing stays with the user',
  ),
];

const req = (r: Partial<Requirements>): Requirements => ({ ...EMPTY_REQUIREMENTS, ...r });
const owner = 'Document owner';

/** Tab 2, row for row with EXAMPLE_ACTIONS. */
export const EXAMPLE_REQUIREMENTS: Requirements[] = [
  req({ undoPath: 'Discard the preview' }),
  req({ undoPath: 'Undo in the editor' }),
  req({ fullChange: 'Yes', saysIrreversible: 'No', consenter: owner, perChange: 'Yes', actsAs: 'Yes', onRefusal: 'Changes nothing' }),
  req({ fullChange: 'Yes', saysIrreversible: 'Yes', consenter: owner, perChange: 'Yes', actsAs: 'Yes', onRefusal: 'Changes nothing' }),
  req({ fullChange: 'Partial', saysIrreversible: 'Yes', consenter: owner, perChange: 'No', actsAs: 'Yes', onRefusal: 'Changes nothing' }),
  req({ fullChange: 'Yes', saysIrreversible: 'Yes', consenter: '', perChange: 'Yes', actsAs: 'No', onRefusal: 'Not decided' }),
  req({ fullChange: 'Yes', saysIrreversible: 'Yes', consenter: owner, perChange: 'Yes', actsAs: 'Yes', onRefusal: 'Revises and asks again' }),
  req({ undoPath: 'Rename it back' }),
  req({ accessRemoved: 'No' }),
];

/** Answers to checks 1–10, in order. */
export const EXAMPLE_ANSWERS: Answer[] = ['Yes', 'Partial', 'No', 'No', 'Partial', 'Partial', 'Partial', 'No', 'Partial', 'Yes'];

/** The two rows the page points at by name: the version save, and the rename. */
export const EXAMPLE_VERSION_ROW = 2;
export const EXAMPLE_RENAME_ROW = 7;

// ── closing ──────────────────────────────────────────────────────────────────

export const CLOSING = 'Access is granted once. Authority is given one change at a time.';

/** The older tool with a similar name, and how this one differs. Printed once on the page. */
export const SIBLING = {
  title: 'The Agent Authority Review',
  url: '/resources/agent-authority-review',
  line: 'decides which steps of a workflow an agent may own at all. This review starts after that: the agent has write access, and each change it can make needs an authority.',
};
