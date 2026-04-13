import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tag: z.string(),
    tagColor: z.enum(['violet', 'pink', 'cyan', 'emerald', 'amber']),
    readTime: z.string(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    subtitle: z.string(),
    status: z.enum(['Live', 'In Progress', 'Planned']),
    statusColor: z.enum(['emerald', 'amber', 'gray']),
    tag: z.string(),
    tagColor: z.enum(['violet', 'cyan', 'pink', 'emerald', 'amber']),
    stack: z.array(z.string()),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
