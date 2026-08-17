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
    /** Programme week, 1-6. Also the sort order and the URL slug. */
    week: z.number().int().min(1).max(6),
    title: z.string(),
    /** Module id from cohort.modules in src/data/facts.ts — M1..M4. */
    module: z.enum(['M1', 'M2', 'M3', 'M4']),
    /** One line shown in the session list. */
    summary: z.string(),
    /**
     * 'draft' shows a "still being written" note to learners instead of the
     * placeholder body. Nothing half-written should reach someone who paid.
     */
    status: z.enum(['draft', 'ready']).default('draft'),
    /** Set once the session has been taught; unlocks the recording block. */
    taughtOn: z.string().optional(),
    recordingUrl: z.string().url().optional(),
  }),
});

export const collections = { sessions };
