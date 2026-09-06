/**
 * Type declarations for scripts/translation/lib/invariants.mjs (the script
 * itself is plain JavaScript by design; this file only makes the imports
 * from the Vitest tests type-check under `astro check`).
 */

/** Numeric tokens in a text (digit runs with optional separators, trailing punctuation trimmed). */
export function extractNumberTokens(text: string): string[];

/**
 * Parses one numeric token under a convention ('en' or 'de'/'es'):
 * `{ kind: 'value', value }`, `{ kind: 'version' }` (verbatim comparison),
 * or `{ kind: 'ambiguous' }`.
 */
export function parseNumberToken(
  token: string,
  convention: string,
): { kind: 'value'; value: number } | { kind: 'version' } | { kind: 'ambiguous' };

/** Compares the numeric token multisets of source and translation text. */
export function compareNumbers(
  sourceText: string,
  targetText: string,
  options: { targetLanguage: string; sourceLanguage?: string },
): { violations: string[]; ambiguous: { token: string; convention: string }[] };

/**
 * Full structural comparison between source and translation models:
 * structure, code blocks, inline code, URLs, component instances, numbers.
 */
export function compareTranslationModels(
  sourceModel: unknown,
  targetModel: unknown,
  options: { targetLanguage: string },
): {
  invariants: {
    structureUnchanged: boolean;
    codeBlocksUnchanged: boolean;
    inlineCodeUnchanged: boolean;
    urlsUnchanged: boolean;
    componentsUnchanged: boolean;
    numbersUnchanged: boolean;
  };
  violations: string[];
  ambiguousNumbers: { token: string; convention: string }[];
};
