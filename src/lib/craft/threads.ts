// The five threads — the contract between the six sessions.
//
// The third of the three vocabularies (spec §0A). The thirteen capabilities are
// the week-0 intake and the week-6 re-ask; each session's five outcomes are its
// own per-session instrument; these are the join BETWEEN weeks — what week 1
// names and week 5 builds.
//
// The matrix and its prose live in docs/teaching/threads.md. This file is the
// machine-readable half: the ids, their order, and what to call them on screen.
// It exists because the labels were written out inside /craft/notes, which made
// that page the de facto source for a vocabulary two other surfaces also print.
//
// WHAT THIS IS NOT: a filing system. Nothing joins a field note or a discussion
// thread to a thread id automatically — see the note at the top of notes.astro.
// The matrix is shown beside things, never used to sort them, because the join
// would be a mapping nobody decided.

export type ThreadId =
  | 'boundaries'
  | 'evidence'
  | 'trace-and-bill'
  | 'untrusted-input'
  | 'state'
  | 'retrieval'
  | 'multi-agent';

/** Order matters: it is the order the matrix prints in, everywhere. */
export const THREADS: { id: ThreadId; label: string; blurb: string }[] = [
  {
    id: 'boundaries',
    label: 'Boundaries',
    blurb: 'What a system may do without a person, written where code can enforce it.',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    blurb: 'Writing the expected outcome down somewhere the model cannot reach.',
  },
  {
    id: 'trace-and-bill',
    label: 'Trace and bill',
    blurb: 'Seeing what a run did, which step spent what, and what the trace is not telling you.',
  },
  {
    id: 'untrusted-input',
    label: 'Untrusted input',
    blurb: 'The line between text that is data and text that is authority.',
  },
  {
    id: 'state',
    label: 'State',
    blurb: 'What the agent knows, how it was assembled, and how long each part stays true.',
  },
  {
    id: 'retrieval',
    label: 'Retrieval',
    blurb: 'What gets fetched into the context, and on whose say-so.',
  },
  {
    id: 'multi-agent',
    label: 'Multi-agent',
    blurb: 'What happens to the harness when one loop is no longer enough.',
  },
];

export type ThreadWeight = 'builds' | 'second' | 'named';

/** ● builds it · ◐ the week's second thread · ○ shown or named only. */
export const WEIGHT_MARK: Record<ThreadWeight, string> = {
  builds: '●',
  second: '◐',
  named: '○',
};

export const WEIGHT_LABEL: Record<ThreadWeight, string> = {
  builds: 'builds it',
  second: 'second thread',
  named: 'named only',
};

const BY_ID = new Map(THREADS.map((t) => [t.id, t]));

/** The display name, or the raw id when a session names one we do not know. */
export function threadLabel(id: string): string {
  return BY_ID.get(id as ThreadId)?.label ?? id;
}
