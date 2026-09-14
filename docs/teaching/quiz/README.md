# The quiz bank

One file per week: `week-1.md`, `week-2.md`, and so on. Each file holds every item
for that week, with the answer and the distractor rationale inline.

## Why the files live here and not in `src/`

These are test items. Under `src/content/`, Astro would bundle them into the build
output and a learner could read the key from page source. Outside the Astro build
path, `src/lib/craft/quiz.ts` reads them at runtime on the server and they are
physically impossible to serve to a browser.

That is the first of two defences. The second is that **one module owns the split**
between what a learner may see and what is teaching-only — `getLearnerItems()`
returns the stem and options and nothing else, and it builds that object from an
explicit field list. A new teaching-only key added here tomorrow is withheld by
default rather than leaking until someone remembers to exclude it.

**Do not add a second reader of these files with its own filtering.** That is how an
answer key eventually reaches a learner.

## Format

Write the questions the way you already write them. The parser was changed to
read the authored shape rather than the other way round, because the half of a
bank that is worth having — why each distractor is attractive, what to push back
on, what a good answer notices — has nowhere to live in a `key: value` format,
and splitting it into a second file gives you two files that drift.

A file opens with a `#` title and whatever prose you want. Nothing above the
first `##` is parsed.

`##` is a topic. It becomes the item's `capability`, so it is the words that
appear beside a question on the console. A section called **Notes on running
these** is treated as facilitation prose and is not scanned for items.

`###` is one question, written `### Q9 · A short title`.

```markdown
## Durability

### Q9 · Which boundary saves the most money
`apply` · the anchor question

> One boundary, added before that night. Which one prevents the most loss?

- **A.** A 5-second timeout on the payments call
- **B.** An idempotency key on the refund ✅
- **C.** A named outcome on step-budget exhaustion
- **D.** A nightly spend cap of ₹300,000

**Why the others are attractive and wrong.** A is the popular answer and it is
the first boundary chronologically, but a fast failure still gets redelivered…
```

| Part | Required | What it does |
|---|---|---|
| `### Q<n> · <title>` | yes | `<n>` becomes the id, as `w<week>-q<n>`. Responses are stored against that, so it has to stay put once a cohort has answered. The title is shown above the stem. |
| `` `recall` ``/`` `apply` ``/`` `judge` `` | no | First line under the heading. Defaults to `recall`. Anything after the tag on that line is a note to you. |
| `> the stem` | yes* | The blockquote is the question, and the **only** thing a learner is shown besides the options. A fenced code block above it is part of the stem. |
| `- **A.** …` | no | Options. `✅` marks the key and is stripped before the option is stored. |
| everything else | no | Distractor analysis, model answer, follow-ups, what to push back on. Withheld from learners. Shown on the console. |

\* Unless the heading *is* the question, as in Q11 — an item with options and no
blockquote uses its title as the stem.

## What reaches the quiz surface, and what does not

An item is served on `/craft/quiz` only if it is **not `judge`** and **has a
ticked option**. Everything else stays in the bank and on the console, and is
used in the room or as an ADR prompt.

That second condition is most of the bank, by design. "Sort these six into four
buckets", "name both", "give three reasons this does not hold" have a model
answer written for a person to read, not a string a function can compare. Put one
behind a Submit button and you collect answers nothing can score, then show the
learner a "correct answer" that is three paragraphs of notes addressed to the
instructor.

Week 1: fifteen items, four of them self-servable (Q1, Q9, Q11, Q13). The
session's `quiz:` frontmatter names those four, in order.

**A session serves only the ids its `quiz:` list names.** Adding a question to a
bank does not put it in front of anybody until that list says so.

## Writing the items

Per the spec's §11 mitigation: each session already contains all three artefacts.
§2 *The Problem* is the quiz item, §3 *The Drill* is the assignment, and the decision
the drill forces is the ADR prompt. These are extractions from a session you are
writing anyway, not three new things per week.

Every item carries a confidence rating when a learner answers it. **Confident and
wrong is the only dangerous state**, and it is what `/craft/admin/work` sorts by — so
write distractors that a knowledgeable person might genuinely pick, not obviously
wrong ones. A distractor nobody chooses tells you nothing.
