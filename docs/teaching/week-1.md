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
