// Course sessions, as Markdown in the repo.
//
// WHY MARKDOWN AND NOT THE DATABASE. Session material is written once, read by
// eight people, and revised between cohorts. Putting it in Postgres would mean
// an editor to build and no history; as files it reviews as a diff, versions
// with the code that serves it, and can be drafted offline. Supabase holds the
// people, not the teaching.
//
// These files are served ONLY through /craft, which the middleware gates. They
// are not a content collection with public routes — nothing under src/content
// gets a URL unless a page renders it, and the only page that does is behind
// the learner session.

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const sessions = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/sessions' }),
  schema: z.object({
    /**
     * Programme week, 0-6. Also the sort order and the URL slug.
     *
     * Week 0 is the pre-work — environment setup and the intake — rather than a
     * taught session. It lives in this collection anyway because it is the same
     * kind of thing to maintain: long-lived prose, reviewed as a diff, rendered
     * by the same page. What it is NOT is a module, hence the optional below.
     */
    week: z.number().int().min(0).max(6),
    title: z.string(),
    /**
     * Module id from cohort.modules in src/data/facts.ts — M1..M4.
     * Absent on week 0, which belongs to no module.
     */
    module: z.enum(['M1', 'M2', 'M3', 'M4']).optional(),
    /** One line shown in the session list. */
    summary: z.string(),
    /**
     * 'draft' shows a "still being written" note to learners instead of the
     * placeholder body. Nothing half-written should reach someone who paid.
     */
    status: z.enum(['draft', 'ready']).default('draft'),
    /**
     * THE FIVE OUTCOMES. The rating instrument for this session, and the reason
     * `topics` is gone.
     *
     * `topics` used to hold capability ids (A1–A7, B1–B6) on the theory that one
     * vocabulary would serve every surface. Week 1, once written, does not work
     * that way: the room rates five statements written FOR THIS SESSION, in this
     * session's words, at 00:05 and again at 04:52 — "the same five statements,
     * in the same words, so that the two sets of numbers mean the same thing".
     * Nothing in the teaching material maps a session to A1–A3; that mapping was
     * invented to satisfy the schema, which is the wrong direction of travel.
     *
     * The thirteen capabilities are NOT retired. They keep the job they are good
     * at — the week-0 intake and the week-6 re-ask over all thirteen, which is
     * the cohort-level evidence behind the outcome claims (§5.6). What changed is
     * that the per-session instrument is the session's own five.
     *
     * Each carries a stable `id` so a reorder cannot silently remap ratings
     * already stored against it. Both askings read this one array, so the two
     * sets of numbers are guaranteed to be about the same words.
     */
    outcomes: z
      .array(
        z.object({
          /** Short slug, stable for the life of the session. */
          id: z.string(),
          /** Completes "Right now, I could…". Lower case, no trailing stop. */
          text: z.string(),
          /**
           * Sunil's prediction that this one moves most — week 1 says "expect
           * low numbers on 3 and 4". Optional, and worth capturing: it is a
           * claim the before/after delta can actually be checked against.
           */
          movesMost: z.boolean().default(false),
        }),
      )
      .default([]),
    /**
     * Which of the threads in docs/teaching/threads.md this week carries, and
     * how heavily. That file calls itself "the contract between the six
     * sessions" and holds the matrix; this is the machine-readable half of the
     * row for this week.
     *
     * Five are numbered threads; retrieval and multi-agent are two further axes
     * the same matrix tracks. Listed here exactly as the matrix has them rather
     * than tidied into five, because the matrix is the source.
     */
    threads: z
      .array(
        z.object({
          id: z.enum([
            'boundaries',
            'evidence',
            'retrieval',
            'multi-agent',
            'trace-and-bill',
            'untrusted-input',
            'state',
          ]),
          /** ● builds it · ◐ the week's second thread · ○ shown or named only. */
          weight: z.enum(['builds', 'second', 'named']),
        }),
      )
      .default([]),
    /**
     * The day, as the learner copy prints it. Offsets from the session start in
     * HH:MM, not wall-clock times — the timetable is `startsAt`, and a run of
     * show that restated it would be a second source for the same fact.
     *
     * This is also where the before-rating window gets its close: the first
     * `block` entry is when teaching begins. See teachingOffset() in schedule.ts.
     */
    runOfShow: z
      .array(
        z.object({
          /** Offset from 00:00, e.g. '02:20'. */
          at: z.string().regex(/^\d{2}:\d{2}$/),
          label: z.string(),
          detail: z.string().optional(),
          kind: z
            .enum(['opening', 'block', 'break', 'standup', 'quiz', 'close'])
            .default('block'),
        }),
      )
      .default([]),
    /**
     * One per block. Each is a short list of things a learner should now be able
     * to do, and on most of them the LAST item is the one that gets a number in
     * chat, 1 to 5.
     *
     * This is the highest-frequency signal in the session and the only one that
     * fires while there is still time to act on it: "the drill block is where it
     * is easiest to get quietly stuck and say nothing about it."
     */
    checkpoints: z
      .array(
        z.object({
          at: z.string().regex(/^\d{2}:\d{2}$/),
          items: z.array(z.string()),
          /** Whether the last item is rated 1–5. Week 1's 04:15 checkpoint is not. */
          rated: z.boolean().default(true),
        }),
      )
      .default([]),
    /**
     * The questions the room answers at the quiz block — item ids from that
     * week's bank in docs/teaching/quiz/, IN THE ORDER SUNIL WANTS THEM ASKED.
     *
     * He picks them, not code. Week 1's bank holds more than the room gets, and
     * the session's instruction is that they are "mixed across every topic of the
     * day rather than grouped by block — the mixing is the point", which is an
     * editorial judgement about this room on this day. He has already done it by
     * the time he writes the list.
     *
     * ONE ORDER FOR THE WHOLE ROOM. Not shuffled per learner: the block ends with
     * "we take up the ones that split the room", and that needs him to be able to
     * say "question three" and have eight people looking at the same thing.
     *
     * Empty means the check does not open, the same way an absent `endsAt` opens
     * nothing. Picking questions on Sunil's behalf would be inventing the lesson.
     */
    quiz: z.array(z.string()).default([]),
    /**
     * The two pair moments, as offsets — writing the record together, then
     * reading another pair's.
     *
     * NOT entries in `runOfShow`, deliberately. They happen INSIDE a block (week
     * 1's teardown runs 03:25 to 04:20 and contains both), and adding them to the
     * run of show would split that block in three everywhere the day is drawn.
     * The run of show lists what the room is doing; this lists when it is asked
     * for something.
     */
    pair: z
      .object({
        draftAt: z.string().regex(/^\d{2}:\d{2}$/),
        reviewAt: z.string().regex(/^\d{2}:\d{2}$/),
      })
      .optional(),
    /** What to do before arriving. Checkboxes in the learner copy. */
    prework: z
      .object({
        minutes: z.number().int().positive().optional(),
        items: z.array(z.string()).default([]),
      })
      .optional(),
    /**
     * Short title for the week's assignment — the decision the ADR is written
     * about. Kept as a plain string on purpose: assignments.ts owns the "is this
     * real and has it been given" test, and every surface that asks the question
     * goes through it. See `after` for the full homework list.
     */
    assignment: z.string().optional(),
    /** The homework list the session closes on, printed under "After". */
    after: z
      .object({
        hours: z.number().positive().optional(),
        items: z.array(z.string()).default([]),
        note: z.string().optional(),
      })
      .optional(),
    /**
     * Optional reading. Nothing here is required, and the links are allowed to
     * be site-relative — week 1 points at `/latest` for two of its four, which
     * is Field notes, the same weekly feed the public page serves.
     */
    reading: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
          note: z.string().optional(),
        }),
      )
      .default([]),
    /** Set once the session has been taught; unlocks the recording block. */
    taughtOn: z.string().optional(),
    /**
     * When the live session STARTS — its 00:00, and the origin every offset in
     * `runOfShow` and `checkpoints` is measured from.
     *
     * IT IS NOT WHEN THE BEFORE-RATING CLOSES, and it used to be. The rule was
     * "a rating taken after the teaching is not a baseline", which is right; the
     * boundary was in the wrong place by fifteen minutes. Week 1 opens at 00:00,
     * takes its first rating at 00:05, and starts teaching at 00:15 — so closing
     * the window at `startsAt` refuses the very rating it was built to protect.
     *
     * The close is now the first `block` in the run of show. See schedule.ts.
     *
     * Same format and same rule as `endsAt`: ISO 8601 with an offset, and absent
     * means the before-rating never opens rather than opening forever.
     */
    startsAt: z.string().datetime({ offset: true }).optional(),
    /**
     * When the live session ENDS — the moment the week's knowledge check opens
     * and the learner is prompted to take it.
     *
     * A full ISO 8601 timestamp WITH an offset, e.g. '2026-09-15T20:30:00+05:30'.
     * Not a date: "is the session over" is a question about an instant, and the
     * cohort sits in India, Dubai and Australia, so a bare date would open the
     * check on the wrong day for somebody. The offset is not optional for the
     * same reason.
     *
     * ABSENT MEANS NOTHING OPENS AND NOTHING POPS UP. There is no fallback to
     * `taughtOn` or to end-of-day, deliberately: guessing when a session ended
     * would be inventing a fact, and the failure mode is a modal interrupting
     * eight senior engineers at the wrong hour. Every session is unset today —
     * Sunil fills these in with the real timetable.
     */
    endsAt: z.string().datetime({ offset: true }).optional(),
    recordingUrl: z.string().url().optional(),
  }),
});

// Public guides — the resource clusters at /resources/guides.
//
// SAME ARGUMENT AS `sessions`, DIFFERENT AUDIENCE. Long-lived prose, revised
// rather than replaced, reviewed as a diff. What is different is that these
// files ARE public: nothing gates them, a crawler reads them, and an assistant
// may quote them back to a prospect. So the rules here are about attribution
// and honesty rather than about draft material reaching a paying learner.
//
// The roadmap (docs/Website Rebuild 10-09-2026/Website_Growth_Roadmap.html,
// "Search and answer quality requirements") is the source for the fields below:
// author and reviewer identity, a meaningful revision date, one canonical page
// per question. Each of those is a field here because each is a thing somebody
// would otherwise be tempted to fake.
//
// THE FILENAME IS THE SLUG, and there is deliberately no `slug` field. The glob
// loader derives `id` from the filename, the route reads `id`, and the roadmap
// fixes the slug for every one of the sixteen planned pieces. A `slug` field
// would be a second source for a fact that already has one — the same mistake as
// a run of show that restates `startsAt`. Renaming the file renames the URL, on
// purpose, so a redirect is a visible decision rather than a silent divergence.
const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guides' }),
  schema: z.object({
    /** The visible <h1>. The body starts at `##`; the page owns the heading. */
    title: z.string(),
    /** One line, shown on the cluster index and used as the meta description. */
    summary: z.string(),
    /**
     * A pillar answers a cluster's broad question and links to all of its
     * supporting pieces; a supporting piece answers exactly one question from
     * the roadmap's twelve-question visibility sample.
     *
     * Not a free string: the roadmap publishes one pillar and three supporting
     * articles per cluster, and a third kind would be a change to that plan
     * rather than a change to this file.
     */
    kind: z.enum(['pillar', 'supporting']),
    /**
     * The pillar this piece sits under, by slug. Absent ON THE PILLAR ITSELF and
     * required in spirit on everything else — a supporting article with no
     * pillar is an orphan, and the roadmap's rule is that every published page
     * has at least one inbound internal link.
     *
     * Left optional rather than conditional because zod would express the
     * condition as a refinement whose error message is worse than the reader's
     * own judgement, and the index surfaces orphans anyway.
     */
    pillar: z.string().optional(),
    /**
     * The visibility-sample question this page answers, VERBATIM.
     *
     * The roadmap's instruction is "use the same wording at baseline and monthly
     * review" — the twelve questions are a measurement instrument, and a
     * paraphrase here breaks the join between a page and its own tracking row.
     * So this is copied, never rewritten to fit the headline.
     *
     * Unset where a page answers no question in the sample. That is the honest
     * state for a pillar, whose broad question is not one of the twelve, and it
     * must not be filled with an approximation to make the metadata look
     * complete. One canonical page per question, and no page claiming a question
     * it does not answer.
     */
    question: z.string().optional(),
    /** Who wrote it. Published on the page and in the Article JSON-LD. */
    author: z.string(),
    /**
     * Who checked it — a real person who actually read this version.
     *
     * OPTIONAL, AND THAT IS THE POINT. Review and completion are two different
     * marks and collapsing them is how an unreviewed page acquires a reviewer's
     * name. Same reasoning as the forum's split between "solved it" (the asker's
     * report) and "endorsed" (Sunil's verdict): one cannot be inferred from the
     * other. Unset renders as "not yet reviewed" rather than as a blank, because
     * a byline that quietly omits the reviewer reads as if there were one.
     *
     * Never populate this to satisfy an acceptance checklist. The checklist is
     * asking whether a person read it, not whether the field is filled.
     */
    reviewedBy: z.string().optional(),
    /**
     * The date this page's CONTENT was last reviewed — YYYY-MM-DD.
     *
     * A date, not an instant: unlike a session's `endsAt`, nothing here opens or
     * closes at a moment, and an offset would imply a precision the fact does
     * not have.
     *
     * NEVER BUMP THIS WITHOUT A CONTENT REVIEW. The roadmap says so in as many
     * words, and the reason is that a refreshed date is a claim to the reader
     * and to a crawler that somebody looked at the page again. Touching it to
     * look current is the same class of act as inventing a statistic.
     */
    revisedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /**
     * 'draft' means the writing is not finished. Drafts get NO ROUTE at all —
     * getStaticPaths skips them — rather than a published page with a note on
     * it, because this is a public surface and a half-written public page is
     * something a crawler indexes and an assistant quotes.
     *
     * Defaults to draft: a new file is unfinished until somebody says otherwise.
     *
     * This is NOT the review gate. `status: 'ready'` says the prose is complete;
     * `reviewedBy` says a human checked it. See the note there.
     */
    status: z.enum(['draft', 'ready']).default('draft'),
    /**
     * Neighbouring pieces, by slug — the "related links" the roadmap asks every
     * guide to carry. The pillar link is NOT restated here; it comes from
     * `pillar` above, so the two can never disagree about where a page sits.
     */
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { sessions, guides };
