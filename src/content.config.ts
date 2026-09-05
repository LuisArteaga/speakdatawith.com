import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { articleSchema } from './schemas/article';

/**
 * Article content collection.
 *
 * Every article lives at `src/content/articles/<slug>.md`, or `<slug>.mdx`
 * when it embeds Astro components such as Figure or YouTubeFacade
 * (optionally with a colocated `<slug>/` folder for article-specific
 * images). The entry `id` used in URLs is the slugified file name without
 * extension.
 *
 * The frontmatter schema lives in `src/schemas/article.ts` (kept free of
 * virtual modules so it is unit-testable).
 *
 * See docs/content-schema.md for the full field reference.
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: articleSchema,
});

export const collections = { articles };
