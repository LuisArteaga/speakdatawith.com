/**
 * Type declarations for scripts/translation/check-collection.mjs (the
 * script itself is plain JavaScript by design; this file only makes the
 * imports from the Vitest tests type-check under `astro check`).
 */

/** One article file in the collection check: relative path, parsed frontmatter, raw document text. */
export interface CollectionFile {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

/** One finding of the collection check: the primary article path plus a human-readable message. */
export interface CollectionFinding {
  path: string;
  message: string;
}

/**
 * Per-file frontmatter rules, mirroring `articleSchema` from
 * `src/schemas/article.ts`. A frontmatter is schema-valid exactly when
 * this returns no violations.
 */
export function validateFrontmatterShape(frontmatter: Record<string, unknown>): string[];

/**
 * Collection-level integrity check over the parsed article files.
 * `now` is the clock for the publishable-by-date rules; the protected
 * glossary terms drive the terminology-drift warning.
 */
export function checkCollection(
  files: CollectionFile[],
  options?: { now?: Date; glossaryProtectedTerms?: string[] },
): { errors: CollectionFinding[]; warnings: CollectionFinding[] };
