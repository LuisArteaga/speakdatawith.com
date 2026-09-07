/**
 * Type declarations for scripts/editorial/new-article.mjs (the script
 * itself is plain JavaScript by design; this file only makes the imports
 * from the Vitest tests type-check under `astro check`).
 */

export interface ArtifactSpec {
  file: string;
  title: string;
  purpose: string;
}

export interface ScaffoldFile {
  file: string;
  content: string;
}

/** The editorial ID pattern: the Translation Key pattern from ADR-0001. */
export const EDITORIAL_ID_PATTERN: RegExp;

/** The eleven working artifacts, in scaffold order (workflow.md table). */
export const ARTIFACT_FILES: readonly ArtifactSpec[];

/** The drafting-gate checklist items, verbatim from workflow.md. */
export const GATE_CHECKLIST_ITEMS: readonly string[];

/** Formats a number as an editorial ID: `SDW-` plus at least three digits. */
export function formatEditorialId(number: number): string;

/** Next free editorial number: maximum of the found numbers + 1, from 1. */
export function nextEditorialNumber(numbers: number[]): number;

/** Editorial IDs of the `content-work/SDW-*` directories (directories only). */
export function scanContentWorkIds(workDir: string): string[];

/**
 * `translationKey` frontmatter values of all articles under `articlesDir`;
 * broken frontmatter YAML throws with the file path.
 */
export function scanArticleTranslationKeys(articlesDir: string): string[];

/** Next free editorial ID across `content-work/` and the article collection. */
export function allocateEditorialId(options: { workDir: string; articlesDir: string }): string;

/** The scaffold contents for one article (pure; writes nothing). */
export function buildScaffoldFiles(id: string, topic: string): ScaffoldFile[];

/**
 * Creates `content-work/<ID>/` and writes the scaffold files; throws a
 * clear collision error when the target path already exists.
 */
export function scaffoldArticleWorkspace(options: { workDir: string; id: string; topic: string }): string[];

/** The gate checklist seed for the article's `[CONTENT]` issue. */
export function buildGateChecklistSeed(id: string, topic: string): string;
