/**
 * Type declarations for scripts/translation/lib/markdown.mjs (the script
 * itself is plain JavaScript by design; this file only makes the imports
 * from the Vitest tests type-check under `astro check`).
 */

export const SCHEMA_VERSION: string;

/** Translation target languages supported by the workflow. */
export const TARGET_LANGUAGES: string[];

/**
 * Component allowlist: translatable attribute values become segments,
 * protected values are never extracted, derived values (locale) are
 * rewritten by the apply step.
 */
export const ALLOWLISTED_COMPONENTS: Record<
  string,
  { translatable: string[]; protected: string[]; derived: string[] }
>;

/** A translatable segment extracted from a source article. */
export interface TranslationUnit {
  id: string;
  type: string;
  text: string;
  node: unknown;
  component?: string;
  attribute?: string;
}

/** The extraction model of one article document. */
export interface TranslationModel {
  frontmatter: Record<string, unknown>;
  units: TranslationUnit[];
  protectedContent: {
    codeBlockHashes: string[];
    inlineCodeValues: string[];
    urls: string[];
    componentNames: string[];
  };
  componentInstances: {
    name: string;
    protectedAttrs: Record<string, string>;
    locale: string | null;
  }[];
  structure: { blocks: string[] };
}

/** Parses an article source string into an mdast tree. */
export function parseDocument(source: string): unknown;

/** Serializes a full document tree (including the frontmatter yaml node). */
export function serializeDocument(tree: unknown): string;

/**
 * Parses a translated segment text back into inline AST children. Throws
 * unless the text is a single paragraph of inline content.
 */
export function parseInlineSegmentText(text: string, segmentId: string): unknown[];

/**
 * Rewrites the `locale` attribute of inline allowlisted component instances
 * after grafting (derived by the apply step, never translated).
 */
export function rewriteInlineComponentLocales(tree: unknown, targetLanguage: string): void;

/**
 * Builds the translation model of a document. `expectedLanguage: 'en'`
 * asserts the full English-source contract; pass `null` for generated
 * documents, where only structural extraction runs.
 */
export function extractTranslationModel(
  source: string,
  options?: { expectedLanguage?: 'en' | null },
): TranslationModel;

/** Frontmatter-derived units (title/description), shared by extraction and validation. */
export function frontmatterUnitsFrom(frontmatter: Record<string, unknown>): TranslationUnit[];

/**
 * Walks the document and invokes the visitor for every structural element
 * (frontmatter, unit, codeBlock, component); aborts on unsupported nodes.
 */
export function walkDocument(
  tree: unknown,
  visitor: {
    frontmatter?(node: { value: string }): void;
    unit?(unit: TranslationUnit): void;
    codeBlock?(node: unknown): void;
    component?(instance: unknown): void;
  },
): {
  inlineCodeValues: string[];
  urls: string[];
  componentNames: string[];
  componentInstances: unknown[];
};
