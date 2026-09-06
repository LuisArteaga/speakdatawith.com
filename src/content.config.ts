import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { LOCALES } from './i18n/config';
import { slugifyFileName } from './utils/slug';
import { articleSchema } from './schemas/article';

/**
 * Article content collection — one language directory per site language:
 *
 * `src/content/articles/<lang>/<slug>.md` (or `<slug>.mdx` when the article
 * embeds Astro components such as Figure or YouTubeFacade).
 *
 * The entry `id` used in URLs is the slugified file name WITHOUT the
 * language directory (the default glob `generateId` would keep the
 * `en/`/`de/`/`es/` prefix and double it into the URL). Article-specific
 * images live in `src/assets/articles/<translationKey>/`.
 *
 * The frontmatter schema lives in `src/schemas/article.ts` (kept free of
 * virtual modules so it is unit-testable).
 *
 * See docs/content-schema.md for the full field reference.
 */
const articles = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/articles',
    generateId: ({ entry }) => {
      const [directory, ...rest] = entry.split('/');
      if (!(LOCALES as readonly string[]).includes(directory)) {
        throw new Error(
          `Article files must live in a language directory (${LOCALES.join('|')}): src/content/articles/${entry}`,
        );
      }
      return slugifyFileName(rest.join('/').replace(/\.(md|mdx)$/, ''));
    },
  }),
  schema: articleSchema,
});

export const collections = { articles };
