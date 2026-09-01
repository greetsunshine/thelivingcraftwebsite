# Teaching notes

Notes to Sunil about how to *run* a session — never what a learner reads.

They live here rather than in `src/content/sessions/*.md` for one reason: that
directory is a content collection, every file in it is rendered to a signed-in
learner the moment its `status` flips to `ready`, and a note-to-self is the
worst possible thing to show someone who paid for the course. Same reasoning as
`reviewNote` on `/latest`.

Nothing in this directory is imported, rendered, or deployed.

    week-N.md          how to run session N — staging, open items, the clock
    notes/<topic>.md   the material behind a paragraph the session states in four
                       sentences: the full argument, the code it points at, the
                       common wrong answers and what to do with them
    quiz/week-N.md     question bank, tagged by topic and difficulty, with the
                       rationale for every distractor

The files here are the source. The teaching surface built from them is a
published Artifact — week 1's is at
https://claude.ai/code/artifact/435ed083-117f-45d1-8827-ee939e7d1889 — where each
problem carries its solution behind a click, so a solution is never on screen
while a room is meant to be producing it. Edit here, then republish.

The quiz banks are teaching material, not an assessment product — there is no
quiz surface in `/craft` and none is planned. If one is ever built, these become
its source, which is the reason they carry answers and distractor rationale
rather than just questions.
