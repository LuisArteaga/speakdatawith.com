import { z } from 'astro/zod';
import { isValidYouTubeVideoId } from '../utils/video';
import { LOCALES } from '../i18n/config';

/**
 * Frontmatter schema for the `articles` content collection.
 *
 * Extracted from `src/content.config.ts` so the validation rules are
 * unit-testable without Astro's virtual `astro:content` module; the
 * collection definition composes this schema unchanged.
 *
 * Per-file rules only: everything that needs to see more than one entry
 * (uniqueness of `(translationKey, language)`, integrity of
 * `translationOf` targets) is enforced by `validateArticleCollection()`
 * in `src/utils/articles.ts` and fails the build there.
 *
 * See docs/content-schema.md for the full field reference.
 */
export const articleSchema = z
  .object({
    /**
     * Identity of one language version: `SDW-<digits>-<LANG>` with the
     * uppercase language suffix matching the `language` field.
     */
    contentId: z
      .string()
      .regex(
        /^SDW-\d{3,}-(EN|DE|ES)$/,
        'contentId must match SDW-<digits>-<LANG>, e.g. SDW-001-EN',
      ),
    /** Stable identity of the article across all of its language versions. */
    translationKey: z
      .string()
      .regex(/^SDW-\d{3,}$/, 'translationKey must match SDW-<digits>, e.g. SDW-001'),
    language: z.enum(LOCALES),
    /** contentId of the English source article; `null` for English originals. */
    translationOf: z.string().nullable().default(null),
    translationStatus: z.enum(['source', 'generated', 'reviewed', 'stale']),
    /** Version counter of the source article this version was translated from. */
    sourceRevision: z.number().int().positive(),
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
    youtubeId: z
      .string()
      .refine(isValidYouTubeVideoId, {
        message: 'youtubeId must be an 11-character YouTube video ID',
      })
      .nullish()
      .default(null),
  })
  .superRefine((data, ctx) => {
    if (
      data.updatedAt !== null &&
      data.updatedAt.valueOf() < data.publishedAt.valueOf()
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['updatedAt'],
        message:
          'updatedAt must not lie before publishedAt (equal timestamps are valid)',
      });
    }

    if (!data.contentId.endsWith(`-${data.language.toUpperCase()}`)) {
      ctx.addIssue({
        code: 'custom',
        path: ['contentId'],
        message: 'the contentId language suffix must match the language field',
      });
    }

    if (data.language === 'en') {
      if (data.translationOf !== null) {
        ctx.addIssue({
          code: 'custom',
          path: ['translationOf'],
          message: 'an English source article must not reference a translationOf target',
        });
      }
      if (data.translationStatus !== 'source') {
        ctx.addIssue({
          code: 'custom',
          path: ['translationStatus'],
          message: 'an English source article must use translationStatus "source"',
        });
      }
    } else {
      if (data.translationOf === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['translationOf'],
          message: 'a translation must reference the contentId of its English source',
        });
      }
      if (data.translationStatus === 'source') {
        ctx.addIssue({
          code: 'custom',
          path: ['translationStatus'],
          message: 'only English source articles may use translationStatus "source"',
        });
      }
    }
  });
