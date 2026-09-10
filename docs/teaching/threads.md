# The threads — the contract between the six sessions

**What this is.** Seven named ideas that run across the cohort. A session does not
own a thread; it *builds*, *carries* or merely *names* one, and the row below is how
a week declares which. Week 1 names untrusted input and hands it to week 5. Week 5
is entitled to assume week 1 named it.

**Why it exists at all.** Six sessions written independently drift into six
vocabularies, and the cost lands on the learner in week 6, when their own
architecture goes under review and they have no single language to argue in. The
matrix is the cheapest possible fix: one line per week, decided when the session is
written.

---

## The three vocabularies, and why this is only one of them

Spec §3 asked for *"one vocabulary, six surfaces"*. Week 1, once written in full,
does not work that way, and §0A of the spec amends it. There are three, each with a
job it is actually good at:

| | What it is | Where it is used |
|---|---|---|
| **13 capabilities** (A1–A7, B1–B6) | The self-assessment vocabulary | The week-0 intake and the week-6 re-ask. Cohort-level evidence. |
| **5 session outcomes** | This session's own words, written for this session | Rated twice inside the session, at the opening and at the close. |
| **7 threads** *(this file)* | The ideas that cross weeks | Declared per session in `threads:` frontmatter. The join between the six. |

**Do not merge them again.** The `topics: ['A1','A2','A3']` that used to sit on week 1
was invented to satisfy a schema — nothing in the teaching material ever mapped a week
to a capability id.

---

## The seven

Five are the numbered threads; retrieval and multi-agent are two further axes the
same matrix tracks. The machine-readable half of this list — ids, order and display
labels — is [`src/lib/craft/threads.ts`](../../src/lib/craft/threads.ts).

| id | Thread | What it is |
|---|---|---|
| `boundaries` | **Boundaries** | What a system may do without a person, written where code can enforce it. |
| `evidence` | **Evidence** | Writing the expected outcome down somewhere the model cannot reach. |
| `trace-and-bill` | **Trace and bill** | Seeing what a run did, which step spent what, and what the trace is not telling you. |
| `untrusted-input` | **Untrusted input** | The line between text that is data and text that is authority. |
| `state` | **State** | What the agent knows, how it was assembled, and how long each part stays true. |
| `retrieval` | **Retrieval** | What gets fetched into the context, and on whose say-so. |
| `multi-agent` | **Multi-agent** | What happens to the harness when one loop is no longer enough. |

---

## The matrix

`●` builds it · `◐` the week's second thread · `○` shown or named only.

| Thread | W1 | W2 | W3 | W4 | W5 | W6 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Boundaries | ○ | | | | | |
| Evidence | ○ | | | | | |
| Trace and bill | ● | | | | | |
| Untrusted input | ○ | | | | | |
| State | ○ | | | | | |
| Retrieval | | | | | | |
| Multi-agent | ○ | | | | | |

**Only week 1's row is filled in, and that is not an oversight.** Weeks 2–6 have not
been written yet. A row here is a commitment about what a session builds, and
guessing one would put a decision nobody made into the vocabulary the whole cohort
argues in — the same failure as the `topics` array this file replaces. Each row lands
with its session.

**Week 1's row, and what it is claiming.** It *builds* trace and bill: the whole
session is spent making a run say what it did, what it cost and what it is not telling
you. It *names* the other five without building them — untrusted input arrives as a
₹2,50,000 payout and is then explicitly left for week 5 ("the missing piece is a
boundary between text that is data and text that is authority… this is week 5's
material and it does not fit into a smaller space"); multi-agent appears once, as the
question of what happens to the harness when one loop is no longer enough. Retrieval
is not touched.

---

## The rules that keep this honest

- **A session file declares its own row.** `threads:` in the frontmatter, as
  `{ id, weight }`. This file is the prose; the frontmatter is what surfaces read.
- **A thread is `named` if a learner could not implement it from that session alone.**
  Week 1 shows you a prompt injection paying out ₹2,50,000 and deliberately does not
  fix it. That is `named`, not `builds`.
- **At most one `builds` per week.** If a session builds two, one of them is really
  the second thread. That is what `◐` is for.
- **The matrix is printed beside things, never used to file them.** `/craft/notes`
  shows this matrix next to the field notes and does not sort them by it: the themes
  in the notes feed predate the threads, and nothing has landed under trace and bill.
  Inventing that join would be a mapping nobody decided.
