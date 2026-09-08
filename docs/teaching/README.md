# Teaching notes

Notes to Sunil about how to *run* a session — never what a learner reads.

They live here rather than in `src/content/sessions/*.md` for one reason: that
directory is a content collection, every file in it is rendered to a signed-in
learner the moment its `status` flips to `ready`, and a note-to-self is the
worst possible thing to show someone who paid for the course. Same reasoning as
`reviewNote` on `/latest`.

Nothing in this directory is imported, rendered, or deployed.

    week-N.md          how to run session N — staging, open items, the clock
    week-N-script.md   the run of show: a cumulative clock, what to say, what to
                       type, and the running request cost. For following live in
                       the room, not for reading beforehand
    notes/<topic>.md   the material behind a paragraph the session states in four
                       sentences: the full argument, the code it points at, the
                       common wrong answers and what to do with them
    quiz/week-N.md     question bank, tagged by topic and difficulty, with the
                       rationale for every distractor

The files here are the source. The teaching surface built from them is a
published Artifact, where each problem carries its solution behind a click, so a
solution is never on screen while a room is meant to be producing it. Edit here,
then republish.

Week 1's four artifacts. **This is the only place they are recorded.** They spent
a while pasted at the top of `src/content/sessions/week-1.md`, which is a
learner page — the instructor notes, the design review and the design spec would
all have gone on screen for a paying participant the moment that file flipped to
`ready`. Links to working material belong on this side of the line, always.

    instructor notes  https://claude.ai/code/artifact/435ed083-117f-45d1-8827-ee939e7d1889
    learner notes     https://claude.ai/code/artifact/80c83cbc-7c49-472b-ab3c-e28cc48e014a
    design review     https://claude.ai/code/artifact/87abaa6e-d690-45ba-969b-d814cef7bf2a
    design spec       https://claude.ai/code/artifact/62d1288c-2560-4dc9-9098-0436259e48b4

The learner-notes artifact is the one to watch: it is a *second* surface saying
what `src/content/sessions/week-1.md` says, and two of those drift. The session
file is the one the site serves and therefore the source of truth; the artifact
is a handout built from it.

The quiz banks are teaching material, not an assessment product — there is no
quiz surface in `/craft` and none is planned. If one is ever built, these become
its source, which is the reason they carry answers and distractor rationale
rather than just questions.
