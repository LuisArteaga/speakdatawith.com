#!/usr/bin/env node
/**
 * translate:apply — rebuilds a translated document from translated segments.
 *
 *   node scripts/translation/apply.mjs \
 *     --segments translation-work/<key>.<lang>.translated.json \
 *     --slug mein-beitrag \
 *     --model <provider/model> \
 *     --prompt-version 1.0 \
 *     --translated-at 2026-09-20
 *
 * The translated segments file is the extract output with every segment
 * `text` replaced by its translation (plus optional `model`,
 * `ambiguousSegments`, and `newGlossarySuggestions` metadata). The English
 * source is never modified; the target document is written only when all
 * structural invariants hold, and the target status is always "generated" —
 * only a human may set "reviewed" (ADR-0001). Overwriting an existing
 * target is allowed only for the same (translationKey, language) — that is
 * the documented re-translation flow after a source revision.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  extractTranslationModel,
  parseDocument,
  parseInlineSegmentText,
  rewriteInlineComponentLocales,
  serializeDocument,
  walkDocument,
  SCHEMA_VERSION,
  TARGET_LANGUAGES,
} from './lib/markdown.mjs';
import {
  buildTargetFrontmatter,
  checkTranslationFrontmatter,
  serializeFrontmatter,
} from './lib/frontmatter.mjs';
import { compareTranslationModels } from './lib/invariants.mjs';

function usage() {
  console.error(
    'usage: node scripts/translation/apply.mjs --segments <translated.json> --slug <slug> --model <provider/model> --prompt-version <version> --translated-at <YYYY-MM-DD>',
  );
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key.startsWith('--') || value === undefined) {
      throw new Error(`invalid argument "${key ?? ''}" — options are --key value pairs`);
    }
    args[key.slice(2)] = value;
  }
  return args;
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

const args = (() => {
  try {
    return parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(error.message);
  }
})();

const required = ['segments', 'slug', 'model', 'prompt-version', 'translated-at'];
const missing = required.filter((key) => !args[key]);
if (missing.length > 0) {
  usage();
  fail(`missing required options: ${missing.map((key) => `--${key}`).join(', ')}`);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(args.slug)) {
  fail(`--slug must be a lowercase ASCII slug (letters, digits, single dashes), got "${args.slug}"`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(args['translated-at'])) {
  fail(`--translated-at must be a YYYY-MM-DD date, got "${args['translated-at']}"`);
}

let translated;
try {
  translated = JSON.parse(readFileSync(args.segments, 'utf8'));
} catch (error) {
  fail(`cannot read translated segments "${args.segments}": ${error.message}`);
}

const sourcePath = translated?.sourcePath;
if (typeof sourcePath !== 'string' || !/^(src\/content\/articles\/en\/)[^/]+\.(md|mdx)$/.test(sourcePath)) {
  fail(
    `translated segments must reference an English source via "sourcePath" (src/content/articles/en/<slug>.md|.mdx), got "${sourcePath}"`,
  );
}

let source;
try {
  source = readFileSync(sourcePath, 'utf8');
} catch (error) {
  fail(`cannot read source article "${sourcePath}": ${error.message}`);
}

let model;
try {
  model = extractTranslationModel(source, { expectedLanguage: 'en' });
} catch (error) {
  fail(error.message);
}

const targetLanguage = translated.targetLanguage;
if (!TARGET_LANGUAGES.includes(targetLanguage)) {
  fail(`targetLanguage must be one of ${TARGET_LANGUAGES.join(', ')}, got "${targetLanguage}"`);
}
if (translated.schemaVersion !== SCHEMA_VERSION) {
  fail(`segments schemaVersion must be "${SCHEMA_VERSION}", got "${translated.schemaVersion}"`);
}
if (translated.translationKey !== model.frontmatter.translationKey) {
  fail(
    `translationKey mismatch: segments file carries "${translated.translationKey}", source article is "${model.frontmatter.translationKey}"`,
  );
}
if (translated.sourceRevision !== model.frontmatter.sourceRevision) {
  fail(
    `sourceRevision mismatch: segments file carries ${translated.sourceRevision}, source article is at ${model.frontmatter.sourceRevision} — re-extract after a source revision`,
  );
}
if (!Array.isArray(translated.segments)) {
  fail('translated segments file must carry a "segments" array');
}
if (translated.segments.length !== model.units.length) {
  fail(
    `segment count mismatch: ${translated.segments.length} translated vs ${model.units.length} extracted — re-extract and translate every segment`,
  );
}
const translationsById = new Map();
for (let index = 0; index < translated.segments.length; index += 1) {
  const segment = translated.segments[index];
  const expectedId = model.units[index].id;
  if (segment.id !== expectedId) {
    fail(
      `segment order mismatch at position ${index + 1}: expected "${expectedId}", got "${segment.id}" — re-extract and keep the extract order`,
    );
  }
  if (typeof segment.text !== 'string' || segment.text.trim() === '') {
    fail(`segment ${segment.id} has no translation`);
  }
  translationsById.set(segment.id, segment.text);
}

const ambiguousSegments = Array.isArray(translated.ambiguousSegments)
  ? translated.ambiguousSegments
  : [];
const newGlossarySuggestions = Array.isArray(translated.newGlossarySuggestions)
  ? translated.newGlossarySuggestions
  : [];

const targetFrontmatter = buildTargetFrontmatter(model.frontmatter, {
  targetLanguage,
  title: translationsById.get('frontmatter-title-001'),
  description: translationsById.get('frontmatter-description-001'),
  translationModel: args.model,
  translationPromptVersion: args['prompt-version'],
  translatedAt: args['translated-at'],
});

const tree = parseDocument(source);
walkDocument(tree, {
  frontmatter(node) {
    node.value = serializeFrontmatter(targetFrontmatter);
  },
  unit(unit) {
    const text = translationsById.get(unit.id);
    if (text === undefined) {
      return;
    }
    if (unit.type === 'component-attribute') {
      unit.node.value = text;
      return;
    }
    unit.node.children = parseInlineSegmentText(text, unit.id);
  },
  component(instance) {
    if (instance.localeAttr) {
      instance.localeAttr.value = targetLanguage;
    }
  },
});
rewriteInlineComponentLocales(tree, targetLanguage);
const translatedContent = serializeDocument(tree);

let targetModel;
let comparison;
let frontmatterCheck;
try {
  targetModel = extractTranslationModel(translatedContent, { expectedLanguage: null });
  comparison = compareTranslationModels(model, targetModel, { targetLanguage });
  frontmatterCheck = checkTranslationFrontmatter(model.frontmatter, targetModel.frontmatter, {
    targetLanguage,
  });
} catch (error) {
  fail(`translated document cannot be validated: ${error.message}`);
}

const invariants = {
  ...comparison.invariants,
  frontmatterIdentity: frontmatterCheck.ok,
};
const violations = [...comparison.violations, ...frontmatterCheck.violations];
const ok = Object.values(invariants).every(Boolean);

const extension = sourcePath.endsWith('.mdx') ? 'mdx' : 'md';
const writtenPath = `src/content/articles/${targetLanguage}/${args.slug}.${extension}`;
const reportPath = `translation-work/${model.frontmatter.translationKey}.${targetLanguage}.report.json`;
const report = {
  translationKey: model.frontmatter.translationKey,
  sourceLanguage: 'en',
  targetLanguage,
  sourceRevision: model.frontmatter.sourceRevision,
  model: args.model,
  promptVersion: args['prompt-version'],
  result: ok ? 'requires_review' : 'validation_failed',
  segmentsTranslated: translated.segments.length,
  ambiguousSegments,
  newGlossarySuggestions,
  invariants,
  violations,
  ambiguousNumbers: comparison.ambiguousNumbers,
  writtenPath: ok ? writtenPath : null,
};

mkdirSync(dirname(writtenPath), { recursive: true });
if (existsSync(writtenPath)) {
  let existingFrontmatter = null;
  try {
    existingFrontmatter = extractTranslationModel(readFileSync(writtenPath, 'utf8'), {
      expectedLanguage: null,
    }).frontmatter;
  } catch {
    existingFrontmatter = null;
  }
  const sameArticle =
    existingFrontmatter !== null &&
    existingFrontmatter.translationKey === model.frontmatter.translationKey &&
    existingFrontmatter.language === targetLanguage;
  if (!sameArticle) {
    fail(
      `${writtenPath} already exists and is not a translation of ${model.frontmatter.translationKey} into ${targetLanguage} — remove it or choose another slug`,
    );
  }
}

if (!ok) {
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fail(`translation validation failed — ${violations.join('; ')} (report: ${reportPath})`);
}

writeFileSync(writtenPath, translatedContent.endsWith('\n') ? translatedContent : `${translatedContent}\n`, 'utf8');
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`wrote ${writtenPath} (${report.segmentsTranslated} segments, status "generated")`);
console.log(`report written to ${reportPath} — human review required before publication`);
