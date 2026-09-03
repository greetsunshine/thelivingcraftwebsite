// Console edits, delivered as pull requests.
//
// The console never writes to src/data/*.json — it cannot, a Vercel function
// has no write access to its own deployment. But the constraint and the design
// agree here: what the visitor Q&A agent knows should only ever change through
// a diff a human approved. So "hide this" becomes a branch, a commit, and a PR
// on the same lane the weekly retriever already uses.
//
// The visible consequence is that the console does not change when you click.
// That is correct and the UI says so — the item disappears when the PR is
// merged and the site redeploys, not before.

import type { APIRoute } from 'astro';
import { ghConfigured, proposeChange, readRepoFile } from '../../../../lib/admin/github';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * The only file the console may propose changes to.
 *
 * The radar used to be here too. It lives in Postgres now and is edited
 * directly through /api/craft/admin/radar-item — a pull request to dismiss a stale
 * hiring article was ceremony with no reader. This flow remains for the visitor
 * retriever's findings, where a reviewable diff is the whole point: a chatbot
 * repeats them verbatim to prospects.
 */
const FILES = {
  latest: {
    path: 'src/data/latest.json',
    branch: 'console/latest-edits',
    label: "what the assistant tells visitors",
  },
} as const;

type FileKey = keyof typeof FILES;

interface Item {
  id: string;
  title?: string;
  body?: string;
  implication?: string;
  source?: string;
  [key: string]: unknown;
}

interface Store {
  refreshedAt: string;
  items: Item[];
}

/**
 * The only fields the console may rewrite.
 *
 * Not `source`, not `gatheredAt`, not `sourceType`, not `id` — those are the
 * agent's record of where a finding came from and when, and letting the console
 * edit them would turn provenance into something typed by hand. Fixing the
 * prose is editing; changing the citation is fabrication.
 */
const EDITABLE = ['title', 'body', 'implication'] as const;

const trim = (v: unknown, max: number): string => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const POST: APIRoute = async ({ request }) => {
  if (!ghConfigured()) {
    return json({ error: 'GitHub is not connected. Set GITHUB_TOKEN and GITHUB_REPO.' }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }

  const key = String(body.file ?? '') as FileKey;
  const target = FILES[key];
  if (!target) return json({ error: 'Unknown target file.' }, 400);

  const action = String(body.action ?? '');
  if (action !== 'hide' && action !== 'edit') return json({ error: 'Unsupported action.' }, 400);

  const id = String(body.id ?? '');
  if (!id) return json({ error: 'Missing item id.' }, 400);

  try {
    // Read from the edit branch if it exists, so two hides in a row compose
    // instead of the second silently reverting the first.
    let current: { text: string };
    try {
      current = await readRepoFile(target.path, target.branch);
    } catch {
      current = await readRepoFile(target.path);
    }

    const store = JSON.parse(current.text) as Store;
    const item = store.items.find((i) => i.id === id);

    if (!item) {
      return json(
        {
          error:
            'That item is not in the repository version of the file — it may already be queued for removal in an open pull request.',
        },
        409,
      );
    }

    let items: Item[];
    let commitMessage: string;
    let summary: string[];

    if (action === 'hide') {
      items = store.items.filter((i) => i.id !== id);
      commitMessage = `Console: hide "${item.title ?? id}"`;
      summary = [`Removes \`${id}\` from \`${target.path}\`.`, item.title ? `\n> ${item.title}` : ''];
    } else {
      const changed: string[] = [];

      const edited: Item = { ...item };
      for (const field of EDITABLE) {
        if (!(field in body)) continue;
        // Blank clears an optional field rather than writing an empty string —
        // except the two that are structurally required, where a blank is a
        // mistake rather than an intent.
        const value = trim(body[field], field === 'title' ? 300 : 2000);
        if (!value && (field === 'title' || field === 'body')) {
          return json({ error: `${field} cannot be empty.` }, 400);
        }
        if (value === (item[field] ?? '')) continue;
        if (value) edited[field] = value;
        else delete edited[field];
        changed.push(field);
      }

      if (changed.length === 0) return json({ error: 'Nothing changed.' }, 400);

      items = store.items.map((i) => (i.id === id ? edited : i));
      commitMessage = `Console: edit ${changed.join(', ')} on "${edited.title ?? id}"`;
      summary = [
        `Rewrites ${changed.map((c) => `\`${c}\``).join(', ')} on \`${id}\` in \`${target.path}\`.`,
        '',
        'The source URL, gathered date and source grading are untouched — the console cannot edit provenance.',
      ];
    }

    // refreshedAt is left alone deliberately. It records when the retriever
    // last ran, and a console edit rewriting it would make a hand-pruned file
    // look freshly gathered — including to the 90-day staleness filter.
    const next = `${JSON.stringify({ ...store, items }, null, 2)}\n`;

    const result = await proposeChange({
      path: target.path,
      text: next,
      branch: target.branch,
      commitMessage,
      title: `Console edits to ${target.label}`,
      body: [
        'Opened from the admin console.',
        '',
        ...summary,
        item.source && item.source !== 'operator' ? `\nSource: ${item.source}` : '',
        '',
        key === 'latest'
          ? 'This item is repeated to visitors by the Q&A agent, close to verbatim. Read the result as though you had said it yourself.'
          : 'Radar findings are operator-facing only; the visitor agent never reads this file.',
        '',
        'Further console edits land on this same branch as extra commits.',
      ].join('\n'),
    });

    return json({
      ok: true,
      url: result.url,
      message: result.updatedExisting ? 'Added to the open pull request.' : 'Pull request opened.',
    });
    // Note the console does NOT re-render from this. The item on screen is
    // still the deployed version, because that is still what visitors get
    // until the PR merges. Optimistically updating the page would be a lie
    // about the state of the live site.
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not open the pull request.';
    console.error('propose failed:', message);
    return json({ error: message }, 502);
  }
};
