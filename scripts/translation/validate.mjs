#!/usr/bin/env node
/**
 * translate:validate — validates an existing translation against its
 * English source without rewriting anything.
 *
 *   node scripts/translation/validate.mjs \
 *     --source src/content/articles/en/<slug>.md \
 *     --translation src/content/articles/de/<slug>.md
 *
 * Checks the frontmatter identity contract and the structural invariants
 * (block structure, code blocks, inline code, URLs, component instances,
 * numeric values). Prints a JSON result; exits 0 on pass, 1 on violations.
 * This is the deterministic gate CI can call (see issue #16).
 */

import { readFileSync } from 'node:fs';
import { extractTranslationModel, TARGET_LANGUAGES } from './lib/markdown.mjs';
import { checkTranslationFrontmatter } from './lib/frontmatter.mjs';
import { compareTranslationModels } from './lib/invariants.mjs';

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

function readArticle(path, label) {
  if (!/^(src\/content\/articles\/)[^/]+\/[^/]+\.(md|mdx)$/.test(path)) {
    console.error(
      `error: --${label} must be an article path (src/content/articles/<lang>/<slug>.md|.mdx), got "${path}"`,
    );
    process.exit(1);
  }
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    console.error(`error: cannot read ${label} "${path}": ${error.message}`);
    process.exit(1);
  }
}

const args = (() => {
  try {
    return parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(1);
  }
})();

if (!args.source || !args.translation) {
  console.error(
    'usage: node scripts/translation/validate.mjs --source src/content/articles/en/<slug>.(md|mdx) --translation src/content/articles/<lang>/<slug>.(md|mdx)',
  );
  process.exit(1);
}

const sourceContent = readArticle(args.source, 'source');
const translationContent = readArticle(args.translation, 'translation');

let sourceModel;
let targetModel;
try {
  sourceModel = extractTranslationModel(sourceContent, { expectedLanguage: 'en' });
  targetModel = extractTranslationModel(translationContent, { expectedLanguage: null });
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}

const targetLanguage = targetModel.frontmatter.language;
if (!TARGET_LANGUAGES.includes(targetLanguage)) {
  console.error(
    `error: translation language must be one of ${TARGET_LANGUAGES.join(', ')}, got "${targetLanguage}"`,
  );
  process.exit(1);
}

const comparison = compareTranslationModels(sourceModel, targetModel, { targetLanguage });
const frontmatterCheck = checkTranslationFrontmatter(sourceModel.frontmatter, targetModel.frontmatter, {
  targetLanguage,
});
const invariants = {
  ...comparison.invariants,
  frontmatterIdentity: frontmatterCheck.ok,
};
const violations = [...comparison.violations, ...frontmatterCheck.violations];
const ok = Object.values(invariants).every(Boolean);

console.log(
  `${JSON.stringify(
    {
      result: ok ? 'pass' : 'fail',
      source: args.source,
      translation: args.translation,
      targetLanguage,
      invariants,
      violations,
      ambiguousNumbers: comparison.ambiguousNumbers,
    },
    null,
    2,
  )}`,
);

process.exit(ok ? 0 : 1);
