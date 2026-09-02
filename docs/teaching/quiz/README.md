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

A week's file opens with frontmatter naming the week:

```yaml
---
week: 1
---
```

Then one `##` heading per item. The heading is the item's id — it must be unique
across the whole bank, because responses are stored against it. Metadata follows as
`key: value` lines, then a blank line, then the question.

```markdown
## item-01
capability: A1
difficulty: recall
answer: b
rationale: Why the key is the key, and what each distractor gets wrong.

The question, in as many paragraphs as it needs.

A) First option
B) Second option
C) Third option
D) Fourth option
```

| Key | Required | Notes |
|---|---|---|
| `capability` | yes | One of `A1`–`A7` or `B1`–`B6`, from the intake's thirteen. This is what ties an item to a session's `topics`, to reading, and to the doubts inbox. |
| `answer` | yes | The option letter (`b`), or a short literal for a free-text item. Case-insensitive. |
| `difficulty` | no | `recall`, `apply` or `judge`. Defaults to `recall`. |
| `rationale` | no | Shown to the learner *after* they answer, and to Sunil on `/admin/quiz`. |

Options are lines matching `A)`–`D)`. Omit them for a free-text item.

## The three difficulties decide where an item is used

| Difficulty | Where it goes | Scored by |
|---|---|---|
| `recall` | The quiz surface | Code, against the key |
| `apply` | The quiz surface | Code, against the key |
| `judge` | **The room, or the ADR prompt** | Nothing. Never auto-scored. |

`judge` items are filtered out of `getLearnerItems()` entirely. They have no model
answer and are scored on the defence, so a screen with a Submit button is the wrong
place for them.

## Writing the items

Per the spec's §11 mitigation: each session already contains all three artefacts.
§2 *The Problem* is the quiz item, §3 *The Drill* is the assignment, and the decision
the drill forces is the ADR prompt. These are extractions from a session you are
writing anyway, not three new things per week.

Every item carries a confidence rating when a learner answers it. **Confident and
wrong is the only dangerous state**, and it is what `/admin/quiz` sorts by — so
write distractors that a knowledgeable person might genuinely pick, not obviously
wrong ones. A distractor nobody chooses tells you nothing.
