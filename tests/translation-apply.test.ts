import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractTranslationModel } from '../scripts/translation/lib/markdown.mjs';
import { articleSchema } from '../src/schemas/article';
import {
  fakeTranslate,
  makeWorkspace,
  readFrontmatter,
  runScript,
  SOURCE_RELATIVE,
  workspacePath,
} from './helpers/translation-workspace';

/** Runs extract + fake-translate + apply for the Markdown fixture (de). */
function applyMarkdownFixture(slug = 'gruener-dbt-check') {
  const dir = makeWorkspace('sample-article.md');
  runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'de'], dir);
  const translatedPath = fakeTranslate(dir, 'SDW-001', 'de');
  const result = runScript(
    'apply.mjs',
    [
      '--segments', 'translation-work/SDW-001.de.translated.json',
      '--slug', slug,
      '--model', 'test/model',
      '--prompt-version', '1.0',
      '--translated-at', '2026-09-20',
    ],
    dir,
  );
  return { dir, translatedPath, result, targetPath: workspacePath(dir, 'src/content/articles/de', `${slug}.md`) };
}

describe('apply CLI', () => {
  it('writes the target document and a requires_review report', () => {
    const { dir, result, targetPath } = applyMarkdownFixture();

    expect(result.status).toBe(0);
    expect(existsSync(targetPath)).toBe(true);
    const report = JSON.parse(
      readFileSync(workspacePath(dir, 'translation-work', 'SDW-001.de.report.json'), 'utf8'),
    );
    expect(report.result).toBe('requires_review');
    expect(report.segmentsTranslated).toBe(16);
    expect(report.model).toBe('test/model');
    expect(report.promptVersion).toBe('1.0');
    expect(report.writtenPath).toBe('src/content/articles/de/gruener-dbt-check.md');
    expect(Object.values(report.invariants).every(Boolean)).toBe(true);
  });

  it('produces schema-valid frontmatter with the derived identity fields', () => {
    const { targetPath } = applyMarkdownFixture();
    const frontmatter = readFrontmatter(targetPath);

    expect(frontmatter.contentId).toBe('SDW-001-DE');
    expect(frontmatter.translationKey).toBe('SDW-001');
    expect(frontmatter.language).toBe('de');
    expect(frontmatter.translationOf).toBe('SDW-001-EN');
    expect(frontmatter.translationStatus).toBe('generated');
    expect(frontmatter.sourceRevision).toBe(1);
    expect(frontmatter.translationModel).toBe('test/model');
    expect(frontmatter.translationPromptVersion).toBe('1.0');
    expect(frontmatter.translatedAt).toBe('2026-09-20');

    const parsed = articleSchema.safeParse(frontmatter);
    expect(parsed.success).toBe(true);
  });

  it('keeps technical links and dates identical to the source', () => {
    const { targetPath } = applyMarkdownFixture();
    const frontmatter = readFrontmatter(targetPath);

    expect(frontmatter.repositoryUrl).toBe('https://github.com/example/quality-gates');
    expect(frontmatter.evidenceUrl).toBe('https://example.com/evidence/2026-09');
    expect(frontmatter.publishedAt).toBe('2026-09-01');
  });

  it('keeps code blocks byte-identical, inline code and URLs unchanged', () => {
    const { dir, targetPath } = applyMarkdownFixture();
    const sourceModel = extractTranslationModel(
      readFileSync(workspacePath(dir, 'src/content/articles/en/sample-article.md'), 'utf8'),
    );
    const targetModel = extractTranslationModel(readFileSync(targetPath, 'utf8'), { expectedLanguage: null });

    expect(targetModel.protectedContent.codeBlockHashes).toEqual(sourceModel.protectedContent.codeBlockHashes);
    expect(targetModel.protectedContent.inlineCodeValues).toEqual(sourceModel.protectedContent.inlineCodeValues);
    expect(targetModel.protectedContent.urls).toEqual(sourceModel.protectedContent.urls);
  });

  it('never modifies the English source file', () => {
    const { dir } = applyMarkdownFixture();
    const sourcePath = workspacePath(dir, 'src/content/articles/en/sample-article.md');

    expect(readFileSync(sourcePath, 'utf8')).toBe(readFileSync(join(process.cwd(), 'tests/fixtures/translation/sample-article.md'), 'utf8'));
  });

  it('accepts the convention-converted numbers (1,234 → 1.234, 0.25 → 0,25)', () => {
    const { dir, targetPath } = applyMarkdownFixture();
    const validation = runScript(
      'validate.mjs',
      [
        '--source', SOURCE_RELATIVE('sample-article.md'),
        '--translation', 'src/content/articles/de/gruener-dbt-check.md',
      ],
      dir,
    );

    expect(validation.status).toBe(0);
    expect(readFileSync(targetPath, 'utf8')).toContain('1.234 rows');
    expect(readFileSync(targetPath, 'utf8')).toContain('0,25 times');
  });

  it('fails when a translated number changes the numeric value', () => {
    const dir = makeWorkspace('sample-article.md');
    runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'de'], dir);
    const translatedPath = fakeTranslate(dir, 'SDW-001', 'de');
    const translated = JSON.parse(readFileSync(translatedPath, 'utf8'));
    translated.segments = translated.segments.map((segment: { id: string; text: string }) =>
      segment.id === 'paragraph-001' ? { ...segment, text: segment.text.replace('73%', '74%') } : segment,
    );
    writeFileSync(translatedPath, JSON.stringify(translated, null, 2));

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

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('numeric values differ');
    expect(existsSync(workspacePath(dir, 'src/content/articles/de/gruener-dbt-check.md'))).toBe(false);
  });

  it('fails when a URL is altered in a translated segment', () => {
    const dir = makeWorkspace('sample-article.md');
    runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'de'], dir);
    const translatedPath = fakeTranslate(dir, 'SDW-001', 'de');
    const translated = JSON.parse(readFileSync(translatedPath, 'utf8'));
    translated.segments = translated.segments.map((segment: { id: string; text: string }) =>
      segment.id === 'paragraph-002'
        ? { ...segment, text: segment.text.replace('https://example.com/quality-gates', 'https://example.com/other') }
        : segment,
    );
    writeFileSync(translatedPath, JSON.stringify(translated, null, 2));

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

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('URLs');
  });

  it('aborts when a translated segment contains block syntax', () => {
    const dir = makeWorkspace('sample-article.md');
    runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'de'], dir);
    const translatedPath = fakeTranslate(dir, 'SDW-001', 'de');
    const translated = JSON.parse(readFileSync(translatedPath, 'utf8'));
    translated.segments = translated.segments.map((segment: { id: string; text: string }) =>
      segment.id === 'paragraph-001' ? { ...segment, text: `${segment.text}\n\nSecond paragraph` } : segment,
    );
    writeFileSync(translatedPath, JSON.stringify(translated, null, 2));

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

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('single paragraph');
  });

  it('rejects target languages outside de/es', () => {
    const dir = makeWorkspace('sample-article.md');
    runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'de'], dir);
    const translatedPath = fakeTranslate(dir, 'SDW-001', 'de');
    const translated = JSON.parse(readFileSync(translatedPath, 'utf8'));
    translated.targetLanguage = 'fr';
    writeFileSync(translatedPath, JSON.stringify(translated, null, 2));

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

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('targetLanguage must be one of de, es');
  });

  it('rejects invalid slugs and detects sourceRevision drift', () => {
    const dir = makeWorkspace('sample-article.md');
    runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'de'], dir);
    fakeTranslate(dir, 'SDW-001', 'de');

    const badSlug = runScript(
      'apply.mjs',
      [
        '--segments', 'translation-work/SDW-001.de.translated.json',
        '--slug', 'Not A Slug',
        '--model', 'test/model',
        '--prompt-version', '1.0',
        '--translated-at', '2026-09-20',
      ],
      dir,
    );
    expect(badSlug.status).toBe(1);
    expect(badSlug.stderr).toContain('--slug');

    const drifted = JSON.parse(
      readFileSync(workspacePath(dir, 'translation-work', 'SDW-001.de.translated.json'), 'utf8'),
    );
    drifted.sourceRevision = 2;
    writeFileSync(workspacePath(dir, 'translation-work', 'SDW-001.de.translated.json'), JSON.stringify(drifted, null, 2));
    const driftResult = runScript(
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
    expect(driftResult.status).toBe(1);
    expect(driftResult.stderr).toContain('sourceRevision mismatch');
  });

  it('overwrites an existing translation of the same article and resets it to "generated"', () => {
    const { dir, targetPath } = applyMarkdownFixture();
    const edited = readFileSync(targetPath, 'utf8').replace('translationStatus: generated', 'translationStatus: reviewed');
    writeFileSync(targetPath, edited);

    const result = runScript(
      'apply.mjs',
      [
        '--segments', 'translation-work/SDW-001.de.translated.json',
        '--slug', 'gruener-dbt-check',
        '--model', 'test/model',
        '--prompt-version', '1.0',
        '--translated-at', '2026-09-21',
      ],
      dir,
    );

    expect(result.status).toBe(0);
    expect(readFrontmatter(targetPath).translationStatus).toBe('generated');
    expect(readFrontmatter(targetPath).translatedAt).toBe('2026-09-21');
  });

  it('refuses to overwrite a file belonging to a different article', () => {
    const { dir, targetPath } = applyMarkdownFixture();
    const foreign = readFileSync(targetPath, 'utf8')
      .replace('contentId: SDW-001-DE', 'contentId: SDW-999-DE')
      .replace('translationKey: SDW-001', 'translationKey: SDW-999');
    writeFileSync(targetPath, foreign);

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

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('is not a translation of SDW-001');
  });
});

describe('apply CLI (MDX components)', () => {
  it('translates allowlisted component attributes and rewrites the derived locale', () => {
    const dir = makeWorkspace('sample-components.mdx');
    runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-components.mdx'), '--target', 'es'], dir);
    fakeTranslate(dir, 'SDW-002', 'es');
    const result = runScript(
      'apply.mjs',
      [
        '--segments', 'translation-work/SDW-002.es.translated.json',
        '--slug', 'componentes-traducidos',
        '--model', 'test/model',
        '--prompt-version', '1.0',
        '--translated-at', '2026-09-20',
      ],
      dir,
    );
    const targetPath = workspacePath(dir, 'src/content/articles/es/componentes-traducidos.mdx');

    expect(result.status).toBe(0);
    const output = readFileSync(targetPath, 'utf8');
    expect(output).toContain('<Figure src={pipelineImage} alt="T: Pipeline overview with three stages"');
    expect(output).toContain('videoId="aBcD1234_-9"');
    expect(output).toContain('locale="es"');
    expect(output).toContain('url="https://github.com/example/quality-gates"');
    expect(output).toContain('import Figure from');
  });

  it('fails when a protected component attribute changes', () => {
    const dir = makeWorkspace('sample-components.mdx');
    runScript('extract.mjs', ['--source', SOURCE_RELATIVE('sample-components.mdx'), '--target', 'es'], dir);
    const translatedPath = fakeTranslate(dir, 'SDW-002', 'es');
    const translated = JSON.parse(readFileSync(translatedPath, 'utf8'));
    translated.segments = translated.segments.map((segment: { id: string; type: string; text: string }) =>
      segment.type === 'paragraph'
        ? { ...segment, text: segment.text.replace('https://github.com/example/quality-gates', 'https://github.com/example/other') }
        : segment,
    );
    writeFileSync(translatedPath, JSON.stringify(translated, null, 2));

    const result = runScript(
      'apply.mjs',
      [
        '--segments', 'translation-work/SDW-002.es.translated.json',
        '--slug', 'componentes-traducidos',
        '--model', 'test/model',
        '--prompt-version', '1.0',
        '--translated-at', '2026-09-20',
      ],
      dir,
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('protected attributes');
  });
});
