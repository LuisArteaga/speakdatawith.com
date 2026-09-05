import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Article content collection.
 *
 * Every article lives at `src/content/articles/<slug>.md`, or `<slug>.mdx`
 * when it embeds Astro components such as Figure or YouTubeFacade
 * (optionally with a colocated `<slug>/` folder for article-specific
 * images). The entry `id` used in URLs is the slugified file name without
 * extension.
 *
 * See docs/content-schema.md for the full field reference.
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    contentId: z.string().regex(/^SDW-\d{3,}$/, 'contentId must match SDW-<digits>, e.g. SDW-001'),
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable().default(null),
    draft: z.boolean().default(false),
    pillar: z.array(z.enum(['Generate', 'Observe', 'Evaluate', 'Govern'])),
    audience: z.array(z.string()).min(1),
    tags: z.array(z.string()),
    repositoryUrl: z.url().nullable().default(null),
    releaseUrl: z.url().nullable().default(null),
    evidenceUrl: z.url().nullable().default(null),
    youtubeId: z.string().nullish().default(null),
  }),
});

export const collections = { articles };
