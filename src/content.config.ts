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
     * Capability ids (A1–A7, B1–B6) this session covers. The mapping that
     * connects sessions to the intake's 13 capabilities, and through them to
     * quiz items, doubts, reading suggestions, and the week-6 re-ask.
     * Default [] so draft sessions don't break.
     */
    topics: z.array(z.string()).default([]),
    /**
     * Short title for the week's assignment / homework. Present on weeks 1–6,
     * absent on week 0 (pre-work). Used by the ADR submission page to label
     * what the learner is writing about.
     */
    assignment: z.string().optional(),
    /** Set once the session has been taught; unlocks the recording block. */
    taughtOn: z.string().optional(),
    recordingUrl: z.string().url().optional(),
  }),
});

export const collections = { sessions };
