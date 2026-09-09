// The decision record's sections — the ONE place the template is written down.
//
// ---------------------------------------------------------------------------
// WHY THIS FILE EXISTS
// ---------------------------------------------------------------------------
// The list used to appear three times inside adr.astro: once as regexes that
// parse a saved record back into a form, once as the form fields themselves, and
// once as the client-side code that reassembles the markdown on submit. Three
// copies of one list is how the `'TBD'` literal ended up in four files and three
// surfaces disagreed about how many assignments existed. Adding a section meant
// editing all three and the console besides, and the failure mode is silent: a
// section the parser does not know about is dropped on the next save, taking the
// learner's text with it.
//
// ---------------------------------------------------------------------------
// SEVEN SECTIONS, NOT FIVE
// ---------------------------------------------------------------------------
// The five were Context, Decision, Alternatives, Consequences, Unsure about.
// Week 1, written since, asks for seven and different ones — it is written "in
// the shape you would put in front of an architecture review", and it is peer
// reviewed in the room against four questions that only make sense against the
// seven. Two of the new ones carry rules the old form had nowhere to put:
//
//   Goals            must be TESTABLE. "Safer is not a goal. No dispute is
//                    credited twice is." Review question 3 checks exactly this.
//   What can go wrong one row per case — what arrives, what your rule does,
//                    what the customer sees. Review question 4 checks it.
//
// §5.5's rule is unchanged and is the reason this is a fixed list at all: the
// template must not vary by week, so week 6 can be read against week 1. What
// varies is the brief above it, which comes from the session.
//
// ALTERNATIVES IS STILL LOAD-BEARING. Anyone can state a decision; the rejected
// options are where judgement is visible, and it is the section a model writes
// worst — generated alternatives are plausible and generic, and it reads. Week 1
// puts it more bluntly: "'Use a better model' counts, and rejecting it well is
// most of today."

export interface AdrSection {
  /** Stable key. It is the form field name and the storage key — never renumber. */
  id: string;
  /** The markdown heading, and what the parser matches on. */
  heading: string;
  /** One line under the label, in the session's own framing where it has one. */
  hint: string;
  placeholder: string;
  rows: number;
  /** Required unless the section can honestly be empty. */
  required: boolean;
  /** Gets the extra note and the heavier treatment on the page. */
  loadBearing?: boolean;
}

export const ADR_SECTIONS: AdrSection[] = [
  {
    id: 'context',
    heading: 'Context',
    hint: 'What breaks today — cited against a run you watched, with the number.',
    placeholder:
      'Not background. The specific thing that failed, and what it cost when it did.',
    rows: 3,
    required: true,
  },
  {
    id: 'goals',
    heading: 'Goals',
    hint: 'Three at most, each one testable. "Safer" is not a goal. "No dispute is credited twice" is.',
    placeholder:
      'Could somebody write a check that passes or fails on this without a person judging it? If not, it is a wish.',
    rows: 3,
    required: true,
  },
  {
    id: 'nongoals',
    heading: 'Non-goals',
    hint: 'What you are not fixing, and why that is acceptable this quarter.',
    placeholder:
      'The thing a reviewer will ask about that you have decided, on purpose, to leave alone.',
    rows: 2,
    required: true,
  },
  {
    id: 'design',
    heading: 'The design',
    hint: 'The checks, in the order they run, and what each does when it fails: refuse, escalate, or ask a person. Say where the state lives.',
    placeholder:
      'Order matters, and so does where the state lives — if it lives in memory, a restart undoes it.',
    rows: 5,
    required: true,
  },
  {
    id: 'risks',
    heading: 'What can go wrong',
    hint: 'One row per case: what arrives, what your rule does, what the customer sees.',
    placeholder:
      'Include the case where your own guard is wrong. A rule that silently refuses a legitimate request has swapped one failure for another.',
    rows: 4,
    required: true,
  },
  {
    id: 'alternatives',
    heading: 'Alternatives',
    hint: 'One you rejected, and why it lost.',
    placeholder:
      'The option you seriously considered, and the specific reason it did not survive.',
    rows: 4,
    required: true,
    loadBearing: true,
  },
  {
    id: 'open',
    heading: 'Open questions',
    hint: 'What you could not settle. One line is enough.',
    placeholder: 'The part you would want a second opinion on.',
    rows: 2,
    required: false,
  },
];

/** Empty text for every section — the shape the form starts from. */
export const emptyAdr = (): Record<string, string> =>
  Object.fromEntries(ADR_SECTIONS.map((s) => [s.id, '']));

/**
 * Read a stored record back into its sections.
 *
 * Tolerant on purpose. A record written under the old five-section template
 * still parses — the headings it does have are matched, the rest come back
 * empty, and nothing is thrown away that this function did not put back. What it
 * must never do is drop text silently, so anything under a heading it does not
 * recognise is preserved by `unmatched` rather than lost on the next save.
 */
export function parseAdr(markdown: string): {
  sections: Record<string, string>;
  unmatched: string;
} {
  const sections = emptyAdr();
  if (!markdown) return { sections, unmatched: '' };

  const known = new Set(ADR_SECTIONS.map((s) => s.heading.toLowerCase()));
  const leftovers: string[] = [];

  // Split on level-2 headings, keeping each heading with its body.
  const blocks = markdown.split(/\n(?=## )/g);
  for (const block of blocks) {
    const m = /^##\s+(.+?)\s*\n([\s\S]*)$/.exec(block.trim());
    if (!m) continue;
    const heading = m[1].trim();
    const body = m[2].trim();
    const match = ADR_SECTIONS.find((s) => s.heading.toLowerCase() === heading.toLowerCase());
    if (match) sections[match.id] = body;
    else if (!known.has(heading.toLowerCase()) && body) {
      leftovers.push(`## ${heading}\n${body}`);
    }
  }

  return { sections, unmatched: leftovers.join('\n\n') };
}

/** Assemble the markdown that gets stored. One heading per section, in order. */
export function buildAdr(values: Record<string, string>): string {
  return ADR_SECTIONS.map((s) => `## ${s.heading}\n${(values[s.id] ?? '').trim()}`).join('\n\n');
}

// ---------------------------------------------------------------------------
// The peer review
// ---------------------------------------------------------------------------
// Not built as a surface yet — flagged as a decision in the 9 September
// alignment audit. Recorded here because the questions are part of the template
// and the room already uses them: at 04:05 pairs swap and score each other's
// record 0, 1 or 2 on each, and "the written comment matters more than the
// number".
//
// If this ever gets a surface, note what it is NOT. There is no assessment
// behind it and nothing aggregates the numbers — §10's cut of learner-facing
// levels, scores and ranks stands. It exists to make ten minutes of review
// structured enough to finish.

export const ADR_REVIEW_QUESTIONS: { id: string; question: string; hint: string }[] = [
  {
    id: 'would-it-have-stopped-it',
    question: 'Would it have stopped what we watched?',
    hint: 'Take the runs one at a time and trace each through their checks. Any run that still gets through is your finding.',
  },
  {
    id: 'survives-restart',
    question: 'Does it survive a restart?',
    hint: 'If the memory lives in a process, the second delivery still pays.',
  },
  {
    id: 'goals-testable',
    question: 'Is every goal testable?',
    hint: 'Could you write a check that passes or fails without a person judging it? If not, it is a wish rather than a goal.',
  },
  {
    id: 'blocked-customer',
    question: 'What does a blocked customer experience?',
    hint: 'A guard that silently refuses a legitimate request has swapped one failure for another.',
  },
];
