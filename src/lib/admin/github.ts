// GitHub write-back for the content console.
//
// The console never writes to src/data/*.json directly, and could not if it
// wanted to — a Vercel function cannot modify its own deployment. But even with
// a database in play now, editing what the agents know is deliberately kept in
// the repo, because that is where the property lives that makes this safe:
// every change to what the visitor Q&A agent will say to a prospect is a diff
// somebody approved.
//
// So "hide this finding" and "fix this sentence" become a branch, a commit, and
// a pull request — the same path the weekly retriever workflow already uses.
// The console is a faster way to author that PR, not a way around it.

import { env } from './env';

const API = 'https://api.github.com';

export const ghConfigured = () => Boolean(env('GITHUB_TOKEN') && env('GITHUB_REPO'));

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env('GITHUB_TOKEN')}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    // Name the two failures that are actually about setup rather than code —
    // a scope missing from the PAT reads identically to a bug otherwise.
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `GitHub refused the request (${res.status}). Check GITHUB_TOKEN is a fine-grained PAT ` +
          `for ${env('GITHUB_REPO')} with Contents and Pull requests set to read/write. ${detail.slice(0, 200)}`,
      );
    }
    if (res.status === 404) {
      throw new Error(
        `GitHub returned 404 for ${path}. Either GITHUB_REPO ("${env('GITHUB_REPO')}") is wrong or ` +
          `the token cannot see that repository.`,
      );
    }
    throw new Error(`GitHub ${res.status} on ${path}: ${detail.slice(0, 300)}`);
  }

  return res.status === 204 ? (null as T) : ((await res.json()) as T);
}

const repo = () => env('GITHUB_REPO');

/** The repo's own default branch, rather than assuming it is called main. */
async function baseBranch(): Promise<string> {
  const info = await gh<{ default_branch: string }>(`/repos/${repo()}`);
  return info.default_branch;
}

export interface RepoFile {
  text: string;
  sha: string;
}

export async function readRepoFile(path: string, ref?: string): Promise<RepoFile> {
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const file = await gh<{ content: string; encoding: string; sha: string }>(
    `/repos/${repo()}/contents/${path}${query}`,
  );

  if (file.encoding !== 'base64') throw new Error(`Unexpected encoding for ${path}: ${file.encoding}`);
  // atob gives latin-1; the findings contain em-dashes and quotes, so decode
  // through UTF-8 or every curly apostrophe comes back mangled.
  const bytes = Uint8Array.from(atob(file.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
  return { text: new TextDecoder().decode(bytes), sha: file.sha };
}

export interface ProposeInput {
  /** Repo-relative path, e.g. src/data/radar.json */
  path: string;
  /** Full new file contents. */
  text: string;
  branch: string;
  title: string;
  body: string;
  commitMessage: string;
}

export interface ProposeResult {
  url: string;
  number: number;
  /** True when an open PR already existed and this pushed another commit to it. */
  updatedExisting: boolean;
}

/**
 * Branch → commit → PR, reusing the branch if the console already opened one.
 *
 * Reuse matters: hiding three findings in a row should be three commits on one
 * reviewable PR, not three PRs to triage. The branch name is passed in by the
 * caller so each kind of edit gets its own lane.
 */
export async function proposeChange(input: ProposeInput): Promise<ProposeResult> {
  const base = await baseBranch();
  const head = await gh<{ object: { sha: string } }>(`/repos/${repo()}/git/ref/heads/${base}`);

  let branchExists = true;
  try {
    await gh(`/repos/${repo()}/git/ref/heads/${input.branch}`);
  } catch {
    branchExists = false;
  }

  if (!branchExists) {
    await gh(`/repos/${repo()}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${input.branch}`, sha: head.object.sha }),
    });
  }

  // The blob sha must come from the branch we are committing to, not from the
  // default branch. Taking it from base works right up until the second edit,
  // then fails with a 409 that reads like a race condition.
  const current = await readRepoFile(input.path, input.branch);

  const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(input.text)));

  await gh(`/repos/${repo()}/contents/${input.path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: input.commitMessage,
      content: encoded,
      sha: current.sha,
      branch: input.branch,
    }),
  });

  const open = await gh<{ number: number; html_url: string }[]>(
    `/repos/${repo()}/pulls?head=${repo().split('/')[0]}:${input.branch}&state=open`,
  );

  if (open.length > 0) {
    return { url: open[0].html_url, number: open[0].number, updatedExisting: true };
  }

  const pr = await gh<{ number: number; html_url: string }>(`/repos/${repo()}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title: input.title, body: input.body, head: input.branch, base }),
  });

  return { url: pr.html_url, number: pr.number, updatedExisting: false };
}

// ---------------------------------------------------------------------------
// Running the retriever agents on demand
// ---------------------------------------------------------------------------
// "Run now" dispatches the GitHub Action rather than doing the research inside
// a Vercel function. Two reasons, and both are hard limits rather than
// preferences: a sweep is minutes of Opus web-search calls and would blow the
// function timeout, and the output has to land as a commit, which a function
// cannot produce. The Action already knows how to do both.

export async function dispatchWorkflow(file: string, inputs: Record<string, string> = {}): Promise<void> {
  const base = await baseBranch();
  await gh(`/repos/${repo()}/actions/workflows/${file}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: base, inputs }),
  });
}

export interface RunSummary {
  status: string;
  conclusion: string | null;
  url: string;
  startedAt: string;
}

export async function latestRun(file: string): Promise<RunSummary | null> {
  const runs = await gh<{
    workflow_runs: { status: string; conclusion: string | null; html_url: string; created_at: string }[];
  }>(`/repos/${repo()}/actions/workflows/${file}/runs?per_page=1`);

  const run = runs.workflow_runs?.[0];
  return run
    ? { status: run.status, conclusion: run.conclusion, url: run.html_url, startedAt: run.created_at }
    : null;
}

export async function openPullRequests(): Promise<{ number: number; title: string; url: string; branch: string }[]> {
  const pulls = await gh<{ number: number; title: string; html_url: string; head: { ref: string } }[]>(
    `/repos/${repo()}/pulls?state=open&per_page=20`,
  );
  return pulls.map((p) => ({ number: p.number, title: p.title, url: p.html_url, branch: p.head.ref }));
}
