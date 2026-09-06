/**
 * Frontmatter handling for the article translation workflow: parsing the
 * source frontmatter, deriving the target-language frontmatter (identity
 * fields, provenance, status), and serializing it back to YAML.
 *
 * Dates are kept as plain strings (the `yaml` package's core schema does
 * not parse timestamps), so `publishedAt: 2026-09-24` round-trips exactly.
 * The target status is always "generated" — only a human may set
 * "reviewed" (ADR-0001 human-review gate).
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

/**
 * Parses raw frontmatter YAML into an object. Non-object documents are a
 * controlled error.
 */
export function parseFrontmatter(raw) {
  let parsed;
  try {
    parsed = parseYaml(raw);
  } catch (error) {
    throw new Error(`frontmatter is not valid YAML: ${error.message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('frontmatter must be a YAML mapping');
  }
  return parsed;
}

/**
 * Derives the frontmatter of a generated translation from the English
 * source frontmatter. Identity fields are rewritten per language, the
 * status is pinned to "generated", provenance fields are recorded, and all
 * technical links (repository, release, evidence, YouTube) plus the
 * taxonomy are copied unchanged from the source (ADR-0001).
 */
export function buildTargetFrontmatter(
  sourceFrontmatter,
  {
    targetLanguage,
    title,
    description,
    translationModel,
    translationPromptVersion,
    translatedAt,
  },
) {
  const missing = ['translationKey', 'contentId', 'sourceRevision', 'publishedAt'].filter(
    (key) => sourceFrontmatter[key] === undefined,
  );
  if (missing.length > 0) {
    throw new Error(`source frontmatter is missing required fields: ${missing.join(', ')}`);
  }
  return {
    contentId: `${sourceFrontmatter.translationKey}-${targetLanguage.toUpperCase()}`,
    translationKey: sourceFrontmatter.translationKey,
    language: targetLanguage,
    translationOf: sourceFrontmatter.contentId,
    translationStatus: 'generated',
    sourceRevision: sourceFrontmatter.sourceRevision,
    translationModel,
    translationPromptVersion,
    translatedAt,
    title,
    description,
    publishedAt: sourceFrontmatter.publishedAt,
    updatedAt: sourceFrontmatter.updatedAt ?? null,
    draft: sourceFrontmatter.draft ?? false,
    pillar: [...(sourceFrontmatter.pillar ?? [])],
    audience: [...(sourceFrontmatter.audience ?? [])],
    tags: [...(sourceFrontmatter.tags ?? [])],
    repositoryUrl: sourceFrontmatter.repositoryUrl ?? null,
    releaseUrl: sourceFrontmatter.releaseUrl ?? null,
    evidenceUrl: sourceFrontmatter.evidenceUrl ?? null,
    youtubeId: sourceFrontmatter.youtubeId ?? null,
  };
}

/**
 * Serializes frontmatter to the YAML body of a `---` fenced block (no
 * trailing newline; the document serializer adds the fences).
 */
export function serializeFrontmatter(frontmatter) {
  return stringifyYaml(frontmatter, { lineWidth: 0 }).replace(/\n+$/, '');
}

/**
 * Cross-document frontmatter contract between an English source and its
 * translation: identity alignment, revision alignment, and status rules.
 * Purely structural — the publication gate itself lives in
 * `src/utils/articles.ts::getPublishedArticles()` (issue #14).
 */
export function checkTranslationFrontmatter(
  sourceFrontmatter,
  targetFrontmatter,
  { targetLanguage },
) {
  const violations = [];
  const expect = (condition, message) => {
    if (!condition) {
      violations.push(message);
    }
  };

  expect(targetFrontmatter.language === targetLanguage, `translation language must be "${targetLanguage}"`);
  expect(
    targetFrontmatter.translationKey === sourceFrontmatter.translationKey,
    `translationKey must match the source (${sourceFrontmatter.translationKey})`,
  );
  expect(
    targetFrontmatter.contentId === `${sourceFrontmatter.translationKey}-${targetLanguage.toUpperCase()}`,
    `contentId must be "${sourceFrontmatter.translationKey}-${targetLanguage.toUpperCase()}"`,
  );
  expect(
    targetFrontmatter.translationOf === sourceFrontmatter.contentId,
    `translationOf must reference the source contentId (${sourceFrontmatter.contentId})`,
  );
  expect(
    targetFrontmatter.sourceRevision === sourceFrontmatter.sourceRevision,
    `sourceRevision must match the source (${sourceFrontmatter.sourceRevision})`,
  );
  expect(
    ['generated', 'reviewed', 'stale'].includes(targetFrontmatter.translationStatus),
    'translationStatus must be "generated", "reviewed", or "stale" — never "source"',
  );
  expect(
    typeof targetFrontmatter.title === 'string' && targetFrontmatter.title.trim() !== '',
    'translation title must be a non-empty string',
  );
  expect(
    typeof targetFrontmatter.description === 'string' && targetFrontmatter.description.trim() !== '',
    'translation description must be a non-empty string',
  );

  return { ok: violations.length === 0, violations };
}
