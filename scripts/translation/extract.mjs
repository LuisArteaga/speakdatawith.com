#!/usr/bin/env node
/**
 * translate:extract — extracts the translatable segments of an English
 * source article into a versioned segments JSON file.
 *
 *   node scripts/translation/extract.mjs \
 *     --source src/content/articles/en/<slug>.md \
 *     --target de
 *
 * The output lands in translation-work/<translationKey>.<target>.segments.json
 * (gitignored). Extraction is deterministic: the same source always yields
 * the same segments and IDs. Unknown AST constructs abort with a controlled
 * error instead of silently altering content (ADR-0001).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import { extractTranslationModel, SCHEMA_VERSION, TARGET_LANGUAGES } from './lib/markdown.mjs';

function usage() {
  console.error(
    'usage: node scripts/translation/extract.mjs --source src/content/articles/en/<slug>.(md|mdx) --target <de|es>',
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

const args = parseArgs(process.argv.slice(2));
const sourcePath = args.source;
const targetLanguage = args.target;

if (!sourcePath || !targetLanguage) {
  usage();
  process.exit(1);
}
if (!/^(src\/content\/articles\/en\/)[^/]+\.(md|mdx)$/.test(sourcePath)) {
  console.error(
    `error: --source must be an English article (src/content/articles/en/<slug>.md or .mdx), got "${sourcePath}"`,
  );
  process.exit(1);
}
if (!TARGET_LANGUAGES.includes(targetLanguage)) {
  console.error(
    `error: --target must be one of ${TARGET_LANGUAGES.join(', ')}, got "${targetLanguage}"`,
  );
  process.exit(1);
}

let source;
try {
  source = readFileSync(sourcePath, 'utf8');
} catch (error) {
  console.error(`error: cannot read source article "${sourcePath}": ${error.message}`);
  process.exit(1);
}

let model;
try {
  model = extractTranslationModel(source, { expectedLanguage: 'en' });
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}

const segments = {
  schemaVersion: SCHEMA_VERSION,
  translationKey: model.frontmatter.translationKey,
  sourceLanguage: 'en',
  targetLanguage,
  sourceRevision: model.frontmatter.sourceRevision,
  sourcePath,
  segments: model.units.map((unit) => ({
    id: unit.id,
    type: unit.type,
    text: unit.text,
    ...(unit.component !== undefined ? { component: unit.component, attribute: unit.attribute } : {}),
  })),
  protectedContent: model.protectedContent,
};

const outputPath = `translation-work/${model.frontmatter.translationKey}.${targetLanguage}.segments.json`;
mkdirSync('translation-work', { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(segments, null, 2)}\n`, 'utf8');

console.log(
  `extracted ${segments.segments.length} segments from ${basename(sourcePath)} -> ${outputPath} (target: ${targetLanguage})`,
);
