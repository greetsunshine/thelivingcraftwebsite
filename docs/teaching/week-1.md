# Week 1 — teaching notes

*Not learner-facing. The session itself is
[`src/content/sessions/week-1.md`](../../src/content/sessions/week-1.md).*

## Which brain runs when

Blocks 1 and 2 run on the **mock** brain (`make run`, `make weird-mock`).
Deterministic, no key, identical trace on eight screens. The session copy now
says so out loud and names `llm.py` — do not let the room discover the
if-statement on its own during block 3, it reads as a sleight of hand when
found rather than as the argument when offered.

The **bake-off** inside block 3 is the only beat that needs real keys, because
mock mode ignores `--model`. Pre-work now asks for a working key plus a second
model name, with pairing as the stated fallback.

**Open item:** `INSTRUCTOR.md` in the reference-agent repo plans recorded traces
for the bake-off models so a single key still demonstrates the point. They do
not exist yet. Until they do, pairing is the only fallback, and the session copy
promises nothing more than that. Record them from the models you actually
intend to compare, and check the JSON-that-does-not-parse case is among them —
that failure is the sharpest thing in the block and you cannot rely on getting
it live.

## The word "harness" — decided 2026-08-28

Week 1 §1 claims the **bare word** for the agent harness: the loop and its
stopping condition, the tool layer, the per-turn context assembly, the trace.
Four parts, four files in the reference agent, named on screen in the first
fifteen minutes.

Everywhere else it must be qualified. Week 3 and outcome 2 in `facts.ts` say
**evaluation harness** in full, always — a note to that effect sits in
`week-3.md` where the writing will happen. Two harnesses one week apart sharing
a name is a confusion a room does not recover from mid-session.

The reason for claiming it at all is week 5: you cannot go deeper on a harness
that was never named. Drill 1 in week 1 now ends with an explicit forward
promise — three files had to agree for one fact to escape, *and week 5 asks what
happens when one loop is no longer enough*. That promise is in a file learners
read, so week 5 has to keep it.

**Still open, and none of it is decided:**

- **What leaves week 5 to make room.** It cannot hold harness composition, five
  scale topics, and the governance outcome that currently has no week. The
  suggestion on the table was to cut caching (least judgment-heavy, most easily
  read up on) and send governance to week 6, where reviewing eight architectures
  raises "how does your team review AI-written code" on its own.
- **Composition, not internals.** Planner/executor splits, sub-agents,
  orchestration, where the boundaries between loops go — those fit week 5's
  irreversibility spine. Context assembly, memory and retries inside the loop are
  weeks 1–3 material and sit oddly next to it.
- **The reference agent needs a decomposable shape by week 5.** A single `run()`
  cannot be split into planner and executor in a 45-minute drill unless the repo
  has been heading that way since week 2. That is a change to the roadmap in
  `INSTRUCTOR.md`, not just to a session file.
- **Week 5's front-matter summary now reads "The harness at scale: …"**, so that
  the week 1 promise is not dangling. The session title and the M3 module title
  in `facts.ts` are untouched — change them or revert the summary, but the two
  should agree before week 5 is written.

## Block 4 — the five questions

The five questions are the teaching frame; **the answers stay in the room**.

If you would rather anchor any of them in something you have actually seen on
the enterprise engagement, anonymise it and swap it in — a lived example beats a
constructed one every time. Keep the constructed version labelled as
constructed either way, in the session copy as well as out loud.

## Block 5 — the Horizon

Deliberately not written out in the session file. The framing above it is
durable and stays; the specifics come from `/admin/radar` in the week you teach
it, under **Trends**, **Hiring — India** and **Durable skills**.

Quote the primary-sourced findings and say that they are primary. Skip the
vendor-graded ones, or name them as vendor claims. Nothing dated goes into the
session file, so it does not rot between cohorts — and no salary or hiring
figure gets committed to a repository where it will still be sitting, wrong,
next year.

## Clock

15 + 30 + 45 + 35 + 10 = 135 minutes, with the bake-off inside block 3 and the
leader's framing inside block 4. Block 3 is the tight one: drills 1 and 3 are
small, drill 2 (per-step cost) is the fiddly one and the copy already tells
learners it can finish in the After block. Block 4 gives each pair two of five
questions, so ~12 minutes in pairs and ~13 in the room.

## Status

`status: draft` in the front matter, so learners see a short "still being
written" note instead of the body. Nothing in the file is scaffolding any more —
flip it to `ready` when you are happy with the teaching, not before.
