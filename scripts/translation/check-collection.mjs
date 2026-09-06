#!/usr/bin/env node
/**
 * check:translations — deterministic integrity check for the whole article
 * collection (issue #16, ADR-0001). CI runs this against the repository's
 * `src/content/articles/` tree; it reads files only and never calls a model
 * or an external API.
 *
 * The script reuses the translation-workflow libraries
 * (`scripts/translation/lib/`) for frontmatter parsing, MDX-aware document
 * extraction, the frontmatter identity contract, and the structural
 * invariants — no parsing or comparison logic is duplicated here. On top of
 * the library checks it adds the collection-level rules:
 *
 * Errors (fail CI, exit 1):
 * - duplicate (translationKey, language) combination,
 * - a translation without an English original for its translationKey,
 * - per-file frontmatter rules that must match the zod schema
 *   (`src/schemas/article.ts`) — kept in sync by the parity test,
 * - the frontmatter identity contract between a source and a translation
 *   (translationKey, contentId derivation, translationOf, status values),
 * - a `sourceRevision` mismatch, including derived staleness (reported with
 *   source/translation article, languages, and expected/found revision),
 * - inconsistent technical references (repositoryUrl, releaseUrl,
 *   evidenceUrl must match the English source),
 * - a `generated` or `stale` translation that is publishable by date
 *   (`draft: false` and `publishedAt` not in the future) — the production
 *   build already excludes such translations via `getPublishedArticles()`;
 *   CI failing here is the editor's signal to resolve the status,
 * - document-level invariant violations (code blocks, inline code, URLs,
 *   component instances, numeric values) between a source and a translation.
 *
 * Warnings (never fail CI):
 * - a missing German or Spanish translation of a publishable English
 *   source (quality over coverage — a missing translation never blocks an
 *   English article),
 * - an untranslated optional Figure `alt` text (identical to the source),
 * - ambiguous numeric tokens (reported by the numeric invariant),
 * - a protected glossary term whose occurrence count differs between the
 *   source and the translation (glossary loaded from
 *   `docs/translation/glossary.yml` relative to the working directory;
 *   skipped when the file is absent).
 *
 * There is deliberately no source hash and no semantic quality judgment:
 * `sourceRevision` is the sole staleness trigger, and review quality is the
 * human gate (ADR-0001, docs/translation/workflow.md).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkTranslationFrontmatter, parseFrontmatter } from './lib/frontmatter.mjs';
import { extractTranslationModel, TARGET_LANGUAGES } from './lib/markdown.mjs';
import { compareTranslationModels } from './lib/invariants.mjs';

const DEFAULT_LANGUAGE = 'en';
const LOCALES = [DEFAULT_LANGUAGE, ...TARGET_LANGUAGES];
const ARTICLE_EXTENSION_PATTERN = /\.(md|mdx)$/;
const FRONTMATTER_BLOCK_PATTERN = /^---\n([\s\S]*?)\n---(?:\n|$)/;
const CONTENT_ID_PATTERN = /^SDW-\d{3,}-(EN|DE|ES)$/;
const TRANSLATION_KEY_PATTERN = /^SDW-\d{3,}$/;
const TRANSLATION_STATUSES = ['source', 'generated', 'reviewed', 'stale'];
const PILLAR_VALUES = ['Generate', 'Observe', 'Evaluate', 'Govern'];
/** The technical reference fields that must survive translation unchanged. */
const PROTECTED_REFERENCE_FIELDS = ['repositoryUrl', 'releaseUrl', 'evidenceUrl'];
/** Mirrors `isValidYouTubeVideoId` from src/utils/video.ts (11-char allowlist). */
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Per-file frontmatter rules, mirroring `articleSchema` from
 * `src/schemas/article.ts`. Every rule the zod schema enforces for a single
 * entry is enforced here with the same acceptance conditions, so a
 * frontmatter is schema-valid exactly when this returns no violations. The
 * parity test in tests/translation-collection.test.ts pins this agreement on
 * a shared fixture set. Cross-entry rules (uniqueness, translationOf target)
 * are collection-level and live in `checkCollection`.
 */
export function validateFrontmatterShape(frontmatter) {
  if (frontmatter === null || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    return ['frontmatter must be a YAML mapping'];
  }
  const violations = [];
  const fm = frontmatter;

  if (typeof fm.contentId !== 'string' || !CONTENT_ID_PATTERN.test(fm.contentId)) {
    violations.push('contentId must match SDW-<digits>-<LANG>, e.g. SDW-001-EN');
  }
  if (typeof fm.translationKey !== 'string' || !TRANSLATION_KEY_PATTERN.test(fm.translationKey)) {
    violations.push('translationKey must match SDW-<digits>, e.g. SDW-001');
  }
  const language = fm.language;
  if (!LOCALES.includes(language)) {
    violations.push('language must be one of en, de, es');
  }
  if (typeof fm.contentId === 'string' && LOCALES.includes(language)) {
    if (!fm.contentId.endsWith(`-${language.toUpperCase()}`)) {
      violations.push('the contentId language suffix must match the language field');
    }
  }

  if (!TRANSLATION_STATUSES.includes(fm.translationStatus)) {
    violations.push('translationStatus must be source, generated, reviewed, or stale');
  }
  if (language === DEFAULT_LANGUAGE) {
    if (fm.translationOf !== null && fm.translationOf !== undefined) {
      violations.push('an English source article must not reference a translationOf target');
    }
    if (fm.translationStatus !== undefined && fm.translationStatus !== 'source') {
      violations.push('an English source article must use translationStatus "source"');
    }
  } else if (LOCALES.includes(language)) {
    if (typeof fm.translationOf !== 'string' || fm.translationOf === '') {
      violations.push('a translation must reference the contentId of its English source');
    }
    if (fm.translationStatus === 'source') {
      violations.push('only English source articles may use translationStatus "source"');
    }
  }

  if (typeof fm.sourceRevision !== 'number' || !Number.isInteger(fm.sourceRevision) || fm.sourceRevision < 1) {
    violations.push('sourceRevision must be a positive integer');
  }
  if (typeof fm.title !== 'string' || fm.title.length < 1) {
    violations.push('title must be a non-empty string');
  }
  if (typeof fm.description !== 'string' || fm.description.length < 1) {
    violations.push('description must be a non-empty string');
  }

  const publishedAt = dateField(fm.publishedAt, 'publishedAt', violations);
  const updatedAt = nullableDateField(fm.updatedAt, 'updatedAt', violations);
  if (
    updatedAt !== undefined &&
    publishedAt !== undefined &&
    updatedAt.valueOf() < publishedAt.valueOf()
  ) {
    violations.push('updatedAt must not lie before publishedAt (equal timestamps are valid)');
  }
  nullableDateField(fm.translatedAt, 'translatedAt', violations);

  if (fm.draft !== undefined && fm.draft !== null && typeof fm.draft !== 'boolean') {
    violations.push('draft must be a boolean');
  }
  if (!Array.isArray(fm.pillar) || fm.pillar.some((value) => !PILLAR_VALUES.includes(value))) {
    violations.push('pillar must be an array of Generate, Observe, Evaluate, Govern');
  }
  if (
    !Array.isArray(fm.audience) ||
    fm.audience.length < 1 ||
    fm.audience.some((value) => typeof value !== 'string')
  ) {
    violations.push('audience must be a non-empty array of strings');
  }
  if (!Array.isArray(fm.tags) || fm.tags.some((value) => typeof value !== 'string')) {
    violations.push('tags must be an array of strings');
  }

  urlField(fm.repositoryUrl, 'repositoryUrl', violations);
  urlField(fm.releaseUrl, 'releaseUrl', violations);
  urlField(fm.evidenceUrl, 'evidenceUrl', violations);

  if (fm.youtubeId !== undefined && fm.youtubeId !== null && !YOUTUBE_ID_PATTERN.test(fm.youtubeId)) {
    violations.push('youtubeId must be an 11-character YouTube video ID');
  }
  nullableMinOneString(fm.translationModel, 'translationModel', violations);
  nullableMinOneString(fm.translationPromptVersion, 'translationPromptVersion', violations);

  return violations;
}

/** Required date field (z.coerce.date without nullable): a parseable date is mandatory. */
function dateField(value, label, violations) {
  const parsed = coerceDate(value, label, violations);
  if (parsed === undefined) {
    violations.push(`${label} is required`);
  }
  return parsed;
}

/** Nullable date field with zod default null: undefined and null are valid. */
function nullableDateField(value, label, violations) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return coerceDate(value, label, violations);
}

function coerceDate(value, label, violations) {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    violations.push(`${label} must be a date`);
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    violations.push(`${label} must be a parseable date, got ${JSON.stringify(value)}`);
    return undefined;
  }
  return parsed;
}

/** Nullable URL field with zod default null: undefined and null are valid. */
function urlField(value, label, violations) {
  if (value === undefined || value === null) {
    return;
  }
  if (typeof value !== 'string') {
    violations.push(`${label} must be a URL string or null`);
    return;
  }
  try {
    new URL(value);
  } catch {
    violations.push(`${label} must be a valid URL, got ${JSON.stringify(value)}`);
  }
}

/** Nullable string field with zod .min(1): undefined and null are valid. */
function nullableMinOneString(value, label, violations) {
  if (value === undefined || value === null) {
    return;
  }
  if (typeof value !== 'string' || value.length < 1) {
    violations.push(`${label} must be a non-empty string or null`);
  }
}

/**
 * Collection-level integrity check. `files` is a list of
 * `{ path, frontmatter, content }` entries — `path` relative to the
 * collection root with forward slashes, `frontmatter` the parsed YAML
 * mapping, `content` the raw document text. Returns structured findings:
 * `{ errors, warnings }` with `{ path, message }` entries.
 *
 * `now` is the clock for the publishable-by-date rules (production build
 * semantics: `draft: false` and `publishedAt` not strictly in the future).
 * `glossaryProtectedTerms` drives the protected-term drift warning.
 */
export function checkCollection(files, { now = new Date(), glossaryProtectedTerms = [] } = {}) {
  const errors = [];
  const warnings = [];
  const error = (path, message) => errors.push({ path, message });
  const warn = (path, message) => warnings.push({ path, message });
  const nowValue = now.valueOf();

  // -- per-file shape validation (zod parity rules) -------------------------
  const shapeViolations = new Map();
  for (const file of files) {
    const violations = validateFrontmatterShape(file.frontmatter);
    for (const violation of violations) {
      error(file.path, violation);
    }
    shapeViolations.set(file, violations);
  }

  // -- grouping: identity map and per-key groups ----------------------------
  const byIdentity = new Map();
  const groups = new Map();
  for (const file of files) {
    const { translationKey, language } = file.frontmatter;
    if (typeof translationKey !== 'string' || !LOCALES.includes(language)) {
      continue; // precise shape violations were already reported
    }
    const identity = `${translationKey}|${language}`;
    if (byIdentity.has(identity)) {
      error(
        file.path,
        `duplicate article version: translationKey ${translationKey} already exists in language ${language} (first version: ${byIdentity.get(identity).path})`,
      );
      continue; // pair checks run on the first version only
    }
    byIdentity.set(identity, file);
    const group = groups.get(translationKey) ?? { source: null, translations: [] };
    if (language === DEFAULT_LANGUAGE) {
      group.source = file;
    } else {
      group.translations.push(file);
    }
    groups.set(translationKey, group);
  }

  // -- English source documents ---------------------------------------------
  const sourceModels = new Map();
  for (const group of groups.values()) {
    const source = group.source;
    if (!source || shapeViolations.get(source).length > 0) {
      continue; // missing-source is reported below; invalid shape was reported above
    }
    try {
      sourceModels.set(source, extractTranslationModel(source.content, { expectedLanguage: DEFAULT_LANGUAGE }));
    } catch (exception) {
      error(source.path, `English source document is invalid: ${exception.message}`);
    }
  }

  // -- missing-translation warnings (never blocking) -------------------------
  for (const [translationKey, group] of groups) {
    const source = group.source;
    if (!source || shapeViolations.get(source).length > 0 || !sourceModels.has(source)) {
      continue; // the source's own findings were already reported
    }
    if (!isPublishableByDate(source.frontmatter, nowValue)) {
      continue; // a draft or future-dated source is not waiting for translations
    }
    const present = new Set(group.translations.map((file) => file.frontmatter.language));
    for (const targetLanguage of TARGET_LANGUAGES) {
      if (!present.has(targetLanguage)) {
        warn(
          source.path,
          `missing ${targetLanguage} translation of ${translationKey} — translations are optional and never block the English article`,
        );
      }
    }
  }

  // -- translations ----------------------------------------------------------
  for (const [translationKey, group] of groups) {
    for (const translation of group.translations) {
      if (shapeViolations.get(translation).length > 0) {
        continue;
      }
      const targetLanguage = translation.frontmatter.language;

      // Publication-state rules: a generated or stale translation that is
      // publishable by date must be resolved by an editor. The build filter
      // excludes it from all public output; the CI error keeps the state
      // from being forgotten.
      if (
        (translation.frontmatter.translationStatus === 'generated' ||
          translation.frontmatter.translationStatus === 'stale') &&
        isPublishableByDate(translation.frontmatter, nowValue)
      ) {
        error(
          translation.path,
          `translation of ${translationKey} (${targetLanguage}) is publishable by date but translationStatus is "${translation.frontmatter.translationStatus}" — a translation becomes public only as "reviewed" with an aligned sourceRevision`,
        );
      }

      const source = group.source;
      if (!source) {
        error(
          translation.path,
          `translation of ${translationKey} (${targetLanguage}) has no English source article with that translationKey`,
        );
        continue;
      }
      if (shapeViolations.get(source).length > 0 || !sourceModels.has(source)) {
        continue; // the source's own violations were already reported
      }

      checkPair(
        { path: source.path, frontmatter: source.frontmatter, model: sourceModels.get(source) },
        translation,
        { targetLanguage, glossaryProtectedTerms, error, warn },
      );
    }
  }

  return { errors, warnings };
}

/**
 * Pair checks between one English source and one translation: the
 * frontmatter identity contract (library), the detailed derived-staleness
 * report, the protected technical references, the structural invariants
 * (library), and the review warnings. Translation documents are extracted
 * with `expectedLanguage: null` — their contract is checked here, against
 * the source, instead of against the fixed English contract.
 */
function checkPair(source, translation, { targetLanguage, glossaryProtectedTerms, error, warn }) {
  const sourceFrontmatter = source.frontmatter;
  const translationFrontmatter = translation.frontmatter;

  // Derived staleness: the mandated report names the source article, the
  // translation article, both languages, and the expected/found revision.
  // The library reports the same mismatch generically; that line is
  // filtered below so the detailed report is the single finding.
  const revisionMismatch = translationFrontmatter.sourceRevision !== sourceFrontmatter.sourceRevision;
  if (revisionMismatch) {
    error(
      translation.path,
      `stale translation: source article ${source.path} (${sourceFrontmatter.language}, expected revision ${sourceFrontmatter.sourceRevision}), ` +
        `translation article ${translation.path} (${targetLanguage}, found revision ${translationFrontmatter.sourceRevision}) — ` +
        'the translation must not be published until sourceRevision is aligned and the status is "reviewed"',
    );
  }

  const contract = checkTranslationFrontmatter(sourceFrontmatter, translationFrontmatter, { targetLanguage });
  for (const violation of contract.violations) {
    if (revisionMismatch && violation.startsWith('sourceRevision must match the source')) {
      continue; // covered by the detailed staleness report above
    }
    error(translation.path, violation);
  }

  for (const field of PROTECTED_REFERENCE_FIELDS) {
    if ((sourceFrontmatter[field] ?? null) !== (translationFrontmatter[field] ?? null)) {
      error(
        translation.path,
        `inconsistent technical reference: ${field} must match the English source (${JSON.stringify(sourceFrontmatter[field] ?? null)} vs ${JSON.stringify(translationFrontmatter[field] ?? null)})`,
      );
    }
  }

  let targetModel;
  try {
    targetModel = extractTranslationModel(translation.content, { expectedLanguage: null });
  } catch (exception) {
    error(translation.path, `translation document is invalid: ${exception.message}`);
    return;
  }

  const comparison = compareTranslationModels(source.model, targetModel, { targetLanguage });
  for (const violation of comparison.violations) {
    error(translation.path, violation);
  }
  for (const ambiguous of comparison.ambiguousNumbers) {
    warn(
      translation.path,
      `ambiguous number ${JSON.stringify(ambiguous.token)} (${ambiguous.convention} convention) — review the numeric value instead of trusting the invariant`,
    );
  }

  warnUntranslatedFigureAlt(source.model, targetModel, translation.path, warn);
  warnProtectedTermDrift(
    unitsText(source.model),
    unitsText(targetModel),
    glossaryProtectedTerms,
    translation.path,
    warn,
  );
}

function isPublishableByDate(frontmatter, nowValue) {
  if (frontmatter.draft === true) {
    return false;
  }
  return new Date(frontmatter.publishedAt).valueOf() <= nowValue;
}

function unitsText(model) {
  return model.units.map((unit) => unit.text).join('\n');
}

/** Review warning for an optional Figure alt text that was not translated. */
function warnUntranslatedFigureAlt(sourceModel, targetModel, translationPath, warn) {
  const altUnits = (model) =>
    model.units.filter(
      (unit) => unit.type === 'component-attribute' && unit.component === 'Figure' && unit.attribute === 'alt',
    );
  const sourceUnits = altUnits(sourceModel);
  const targetUnits = altUnits(targetModel);
  const length = Math.min(sourceUnits.length, targetUnits.length);
  for (let index = 0; index < length; index += 1) {
    const sourceText = sourceUnits[index].text.trim();
    if (sourceText !== '' && sourceText === targetUnits[index].text.trim()) {
      warn(
        translationPath,
        `Figure alt text ${JSON.stringify(sourceText)} is unchanged from the source — translate the alt text or keep the change conscious`,
      );
    }
  }
}

/**
 * Review warning when a protected glossary term is used a different number
 * of times in the translation than in the source. Substring counting is
 * deliberately simple (e.g. "GitHub" also matches inside "GitHub
 * Actions") — the warning only asks a human to look, it never fails CI.
 */
function warnProtectedTermDrift(sourceText, targetText, glossaryProtectedTerms, translationPath, warn) {
  for (const term of glossaryProtectedTerms) {
    const sourceCount = sourceText.split(term).length - 1;
    const targetCount = targetText.split(term).length - 1;
    if (sourceCount > 0 && sourceCount !== targetCount) {
      warn(
        translationPath,
        `protected glossary term ${JSON.stringify(term)} appears ${sourceCount} time(s) in the source but ${targetCount} time(s) in the translation — verify the terminology survived translation`,
      );
    }
  }
}

// -- CLI ---------------------------------------------------------------------

function readFrontmatterBlock(raw) {
  const match = FRONTMATTER_BLOCK_PATTERN.exec(raw);
  return match ? match[1] : null;
}

/** Walks the collection directory and returns `{ relPath, content }` entries. */
function collectArticleFiles(collectionDir) {
  const files = [];
  const walk = (dir, relBase) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = relBase === '' ? entry.name : `${relBase}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), rel);
      } else if (ARTICLE_EXTENSION_PATTERN.test(entry.name)) {
        files.push({ relPath: rel, content: readFileSync(join(dir, entry.name), 'utf8') });
      }
    }
  };
  walk(collectionDir, '');
  return files;
}

function loadProtectedTerms(glossaryPath) {
  if (!existsSync(glossaryPath)) {
    return [];
  }
  try {
    const glossary = parseFrontmatter(readFileSync(glossaryPath, 'utf8'));
    if (!Array.isArray(glossary.protected_terms)) {
      return [];
    }
    return glossary.protected_terms.filter((term) => typeof term === 'string');
  } catch {
    return []; // the glossary only feeds a warning; a broken file never fails CI
  }
}

function compareFindings(left, right) {
  if (left.path !== right.path) {
    return left.path < right.path ? -1 : 1;
  }
  if (left.message !== right.message) {
    return left.message < right.message ? -1 : 1;
  }
  return 0;
}

function main() {
  const collectionDir = resolve('src', 'content', 'articles');
  if (!existsSync(collectionDir)) {
    console.log('[check-translations] no article collection found - nothing to check.');
    return 0;
  }

  const errors = [];
  const warnings = [];
  const files = [];

  for (const { relPath, content } of collectArticleFiles(collectionDir)) {
    const language = relPath.split('/')[0];
    if (!LOCALES.includes(language)) {
      errors.push({
        path: relPath,
        message: `article files must live in a language directory (${LOCALES.join(', ')}): ${relPath}`,
      });
      continue;
    }
    const block = readFrontmatterBlock(content);
    if (block === null) {
      errors.push({ path: relPath, message: 'article has no YAML frontmatter block' });
      continue;
    }
    try {
      files.push({ path: relPath, frontmatter: parseFrontmatter(block), content });
    } catch (exception) {
      errors.push({ path: relPath, message: exception.message });
    }
  }

  const result = checkCollection(files, {
    now: new Date(),
    glossaryProtectedTerms: loadProtectedTerms(resolve('docs', 'translation', 'glossary.yml')),
  });
  errors.push(...result.errors);
  warnings.push(...result.warnings);

  for (const warning of [...warnings].sort(compareFindings)) {
    console.log(`[check-translations] warning: ${warning.path}: ${warning.message}`);
  }
  for (const finding of [...errors].sort(compareFindings)) {
    console.error(`[check-translations] error: ${finding.path}: ${finding.message}`);
  }

  if (errors.length > 0) {
    console.error(`[check-translations] FAILED: ${errors.length} error(s), ${warnings.length} warning(s).`);
    return 1;
  }
  console.log(`[check-translations] OK: ${files.length} article(s) checked, ${warnings.length} warning(s).`);
  return 0;
}

// Run the CLI only on direct invocation ("node scripts/translation/check-collection.mjs"),
// never on import from the unit tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
