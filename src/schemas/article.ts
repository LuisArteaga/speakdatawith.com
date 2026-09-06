import { z } from 'astro/zod';
import { isValidYouTubeVideoId } from '../utils/video';

/**
 * Frontmatter schema for the `articles` content collection.
 *
 * Extracted from `src/content.config.ts` so the validation rules are
 * unit-testable without Astro's virtual `astro:content` module; the
 * collection definition composes this schema unchanged.
 *
 * See docs/content-schema.md for the full field reference.
 */
export const articleSchema = z
  .object({
    contentId: z
      .string()
      .regex(/^SDW-\d{3,}$/, 'contentId must match SDW-<digits>, e.g. SDW-001'),
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable().default(null),
    language: z.enum(['en', 'de']),
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
    });
