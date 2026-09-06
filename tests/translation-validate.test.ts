import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compareNumbers, compareTranslationModels, extractNumberTokens, parseNumberToken } from '../scripts/translation/lib/invariants.mjs';
import { extractTranslationModel } from '../scripts/translation/lib/markdown.mjs';
import {
  fakeTranslate,
  makeWorkspace,
  runScript,
  SOURCE_RELATIVE,
  workspacePath,
} from './helpers/translation-workspace';

const FIXTURES = (fixture: string) => join(process.cwd(), 'tests', 'fixtures', 'translation', fixture);

/** Applies the Markdown fixture once and returns the workspace paths. */
function appliedPair() {
  const dir = makeWorkspace('sample-article.md');
  runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'de'], dir);
  fakeTranslate(dir, 'SDW-001', 'de');
  const result = runScript(
    'apply.mjs',
    [
      '--segments', 'translation-work/SDW-001.de.translated.json',
      '--slug', 'gruener-dbt-check',
      '--model', 'test/model',
      '--prompt-version', '1.0',
      '--translated-at', '2026-09-20',
    ],
    dir,
  );
  return {
    dir,
    result,
    source: workspacePath(dir, 'src/content/articles/en/sample-article.md'),
    translation: workspacePath(dir, 'src/content/articles/de/gruener-dbt-check.md'),
  };
}

function validatePair(dir: string) {
  return runScript(
    'validate.mjs',
    [
      '--source', SOURCE_RELATIVE('sample-article.md'),
      '--translation', 'src/content/articles/de/gruener-dbt-check.md',
    ],
    dir,
  );
}

describe('numeric conventions', () => {
  it('extracts numeric tokens and trims trailing punctuation', () => {
    expect(extractNumberTokens('Roughly 73% of incidents, and 1,234 rows.')).toEqual(['73', '1,234']);
    expect(extractNumberTokens('The release v1.0.2 shipped on 2026-09-01.')).toEqual(['1.0.2', '2026', '09', '01']);
  });

  it('parses source tokens with the English convention', () => {
    expect(parseNumberToken('1,234', 'en')).toEqual({ kind: 'value', value: 1234 });
    expect(parseNumberToken('0.25', 'en')).toEqual({ kind: 'value', value: 0.25 });
  });

  it('parses target tokens with the German convention', () => {
    expect(parseNumberToken('1.234', 'de')).toEqual({ kind: 'value', value: 1234 });
    expect(parseNumberToken('1,25', 'de')).toEqual({ kind: 'value', value: 1.25 });
  });

  it('parses multi-group thousands numbers under the de/es convention as values', () => {
    expect(parseNumberToken('12.345.678', 'de')).toEqual({ kind: 'value', value: 12345678 });
    expect(parseNumberToken('12.345.678', 'es')).toEqual({ kind: 'value', value: 12345678 });

    const converted = compareNumbers('12,345,678 rows', '12.345.678 rows', { targetLanguage: 'de' });
    expect(converted.violations).toEqual([]);
  });

  it('treats version-like tokens as verbatim and unclear tokens as ambiguous', () => {
    expect(parseNumberToken('1.0.2', 'de')).toEqual({ kind: 'version' });
    expect(parseNumberToken('1,23', 'en')).toEqual({ kind: 'ambiguous' });
  });

  it('accepts convention-converted values and flags truly changed values', () => {
    const converted = compareNumbers('1,234 rows and 0.25 times', '1.234 rows and 0,25 times', { targetLanguage: 'de' });
    expect(converted.violations).toEqual([]);

    const changed = compareNumbers('1,234 rows', '1.235 rows', { targetLanguage: 'de' });
    expect(changed.violations.length).toBeGreaterThan(0);
  });

  it('reports ambiguous target tokens without failing the invariant', () => {
    const ambiguous = compareNumbers('about 0.25 times', 'about 0.25 times', { targetLanguage: 'de' });

    expect(ambiguous.violations).toEqual([]);
    expect(ambiguous.ambiguous.length).toBeGreaterThan(0);
  });
});

describe('validate CLI', () => {
  it('passes for a freshly applied translation and prints a JSON verdict', () => {
    const { dir } = appliedPair();
    const validation = validatePair(dir);

    expect(validation.status).toBe(0);
    const verdict = JSON.parse(validation.stdout);
    expect(verdict.result).toBe('pass');
    expect(Object.values(verdict.invariants).every(Boolean)).toBe(true);
  });

  it('fails when a code block is modified in the translation', () => {
    const { dir, translation } = appliedPair();
    const edited = readFileSync(translation, 'utf8').replace('group by 1', 'group by 2');
    writeFileSync(translation, edited);

    const validation = validatePair(dir);
    const verdict = JSON.parse(validation.stdout);

    expect(validation.status).toBe(1);
    expect(verdict.invariants.codeBlocksUnchanged).toBe(false);
  });

  it('fails when a URL is modified in the translation', () => {
    const { dir, translation } = appliedPair();
    const edited = readFileSync(translation, 'utf8').replace(
      'https://example.com/quality-gates',
      'https://example.com/changed',
    );
    writeFileSync(translation, edited);

    const verdict = JSON.parse(validatePair(dir).stdout);

    expect(verdict.invariants.urlsUnchanged).toBe(false);
  });

  it('fails when the document structure changes', () => {
    const { dir, translation } = appliedPair();
    const edited = readFileSync(translation, 'utf8').replace(
      '## T: A green dbt check is not proof\n\n',
      '',
    );
    writeFileSync(translation, edited);

    const verdict = JSON.parse(validatePair(dir).stdout);

    expect(verdict.invariants.structureUnchanged).toBe(false);
  });

  it('fails when inline code is modified', () => {
    const { dir, translation } = appliedPair();
    const edited = readFileSync(translation, 'utf8').replace(
      'dbt build --select +customers',
      'dbt run --select customers',
    );
    writeFileSync(translation, edited);

    const verdict = JSON.parse(validatePair(dir).stdout);

    expect(verdict.invariants.inlineCodeUnchanged).toBe(false);
  });

  it('accepts a human-reviewed status (validate does not force "generated")', () => {
    const { dir, translation } = appliedPair();
    const edited = readFileSync(translation, 'utf8').replace(
      'translationStatus: generated',
      'translationStatus: reviewed',
    );
    writeFileSync(translation, edited);

    const verdict = JSON.parse(validatePair(dir).stdout);

    expect(verdict.result).toBe('pass');
  });

  it('fails on a frontmatter identity violation', () => {
    const { dir, translation } = appliedPair();
    const edited = readFileSync(translation, 'utf8').replace(
      'translationOf: SDW-001-EN',
      'translationOf: SDW-002-EN',
    );
    writeFileSync(translation, edited);

    const verdict = JSON.parse(validatePair(dir).stdout);

    expect(verdict.invariants.frontmatterIdentity).toBe(false);
    expect(verdict.result).toBe('fail');
  });

  it('aborts when the translation contains an unsupported construct', () => {
    const { dir, translation } = appliedPair();
    const edited = readFileSync(translation, 'utf8').replace(
      '## T: A green dbt check is not proof',
      '## T: A green dbt check is not proof\n\n<div>injected</div>',
    );
    writeFileSync(translation, edited);

    const validation = validatePair(dir);

    expect(validation.status).toBe(1);
    expect(validation.stderr).toContain('unsupported');
  });
});

describe('model comparison (lib level)', () => {
  it('enforces the derived component locale contract', () => {
    const source = readFileSync(FIXTURES('sample-components.mdx'), 'utf8');
    const sourceModel = extractTranslationModel(source);
    const esModel = extractTranslationModel(source.replace(/locale="en"/g, 'locale="es"'), {
      expectedLanguage: null,
    });

    // locale="es" in the Spanish translation is exactly the derived state
    // the apply step produces.
    const correct = compareTranslationModels(sourceModel, esModel, { targetLanguage: 'es' });
    expect(correct.invariants.componentsUnchanged).toBe(true);

    const deModel = extractTranslationModel(source.replace(/locale="en"/g, 'locale="de"'), {
      expectedLanguage: null,
    });
    const wrongLanguage = compareTranslationModels(sourceModel, deModel, { targetLanguage: 'es' });
    expect(wrongLanguage.invariants.componentsUnchanged).toBe(false);
    expect(wrongLanguage.violations.some((v) => v.includes('locale'))).toBe(true);
  });

  it('reports protected attribute changes on component instances', () => {
    const source = readFileSync(FIXTURES('sample-components.mdx'), 'utf8');
    const sourceModel = extractTranslationModel(source);
    const tamperedModel = extractTranslationModel(
      source.replace('videoId="aBcD1234_-9"', 'videoId="XXXXXXXXXXX"'),
      { expectedLanguage: null },
    );

    const comparison = compareTranslationModels(sourceModel, tamperedModel, { targetLanguage: 'de' });
    expect(comparison.invariants.componentsUnchanged).toBe(false);
  });
});
