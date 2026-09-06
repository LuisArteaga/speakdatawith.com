/**
 * Type declarations for scripts/translation/lib/frontmatter.mjs (the script
 * itself is plain JavaScript by design; this file only makes the imports
 * from the Vitest tests type-check under `astro check`).
 */

/** Parses a raw YAML frontmatter string into an object. Throws on invalid YAML. */
export function parseFrontmatter(raw: string): Record<string, unknown>;

/**
 * Builds the target frontmatter of a translation in canonical key order:
 * identity fields are derived, translationStatus is always "generated",
 * technical links and dates are copied verbatim from the source.
 */
export function buildTargetFrontmatter(
  sourceFrontmatter: Record<string, unknown>,
  options: {
    targetLanguage: string;
    title: string;
    description: string;
    translationModel: string;
    translationPromptVersion: string;
    translatedAt: string;
  },
): Record<string, unknown>;

/** Serializes frontmatter to YAML without a trailing newline. */
export function serializeFrontmatter(frontmatter: Record<string, unknown>): string;

/**
 * Checks the identity contract between a source frontmatter and a
 * translation frontmatter (key, revision, translationOf, language,
 * contentId shape, translationStatus).
 */
export function checkTranslationFrontmatter(
  sourceFrontmatter: Record<string, unknown>,
  targetFrontmatter: Record<string, unknown>,
  options: { targetLanguage: string },
): { ok: boolean; violations: string[] };
