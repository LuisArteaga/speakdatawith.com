import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  extractTranslationModel,
  SCHEMA_VERSION,
  TARGET_LANGUAGES,
} from '../scripts/translation/lib/markdown.mjs';
import {
  makeWorkspace,
  runScript,
  SOURCE_RELATIVE,
  workspacePath,
} from './helpers/translation-workspace';

const FIXTURES = (fixture: string) => join(process.cwd(), 'tests', 'fixtures', 'translation', fixture);

describe('extractTranslationModel', () => {
  const source = readFileSync(FIXTURES('sample-article.md'), 'utf8');

  it('is deterministic: two extractions produce identical segment sets', () => {
    const first = extractTranslationModel(source);
    const second = extractTranslationModel(source);

    expect(JSON.stringify(first.units)).toBe(JSON.stringify(second.units));
    expect(JSON.stringify(first.protectedContent)).toBe(JSON.stringify(second.protectedContent));
  });

  it('produces unique type-ordinal segment ids with frontmatter units first', () => {
    const model = extractTranslationModel(source);
    const ids = model.units.map((unit: { id: string }) => unit.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('frontmatter-title-001');
    expect(ids[1]).toBe('frontmatter-description-001');
    for (const id of ids) {
      expect(id).toMatch(/^[\w-]+-\d{3}$/);
    }
  });

  it('covers heading, paragraph, list-item, and table-cell units from the fixture', () => {
    const model = extractTranslationModel(source);
    const types = new Set(model.units.map((unit: { type: string }) => unit.type));

    expect(types.has('heading')).toBe(true);
    expect(types.has('paragraph')).toBe(true);
    expect(types.has('list-item')).toBe(true);
    expect(types.has('table-cell')).toBe(true);
  });

  it('never emits code blocks as segments but records their hashes', () => {
    const model = extractTranslationModel(source);
    const sqlBody = 'select\n  customer_id,\n  count(*) as order_count\nfrom orders\ngroup by 1';

    expect(model.units.some((unit: { text: string }) => unit.text.includes('order_count'))).toBe(false);
    expect(model.protectedContent.codeBlockHashes).toHaveLength(1);
    // sha256 of the fenced block body, so byte-identity is checkable later.
    expect(model.protectedContent.codeBlockHashes[0]).toBe(
      createHash('sha256').update(sqlBody, 'utf8').digest('hex'),
    );
  });

  it('harvests inline code values, URLs, and component names as protected content', () => {
    const model = extractTranslationModel(source);

    expect(model.protectedContent.inlineCodeValues).toContain('dbt build --select +customers');
    expect(model.protectedContent.urls).toContain('https://example.com/quality-gates');
    expect(model.protectedContent.urls).toContain('https://example.com/images/pipeline-overview.png');
  });

  it('aborts with a controlled error on unknown MDX components', () => {
    const mdx = readFileSync(FIXTURES('unknown-component.mdx'), 'utf8');

    expect(() => extractTranslationModel(mdx)).toThrow(/unsupported MDX component "SomeWidget"/);
  });

  it('aborts with a controlled error on raw HTML', () => {
    const md = readFileSync(FIXTURES('raw-html.md'), 'utf8');

    expect(() => extractTranslationModel(md)).toThrow(/unsupported/);
  });

  it('aborts on a non-English source article', () => {
    const german = source.replace('language: "en"', 'language: "de"');

    expect(() => extractTranslationModel(german)).toThrow(/language must be "en"/);
  });

  it('rejects translationStatus other than "source"', () => {
    const reviewed = source.replace('translationStatus: "source"', 'translationStatus: "reviewed"');

    expect(() => extractTranslationModel(reviewed)).toThrow(/translationStatus "source"/);
  });
});

describe('translation script contracts', () => {
  it('restricts extraction to the two target languages', () => {
    expect(TARGET_LANGUAGES).toEqual(['de', 'es']);
    expect(SCHEMA_VERSION).toBe('1.0');
  });

  it('extract CLI writes the segments file at the documented path', () => {
    const dir = makeWorkspace('sample-article.md');
    const result = runScript(
      'extract.mjs',
      ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'de'],
      dir,
    );

    expect(result.status).toBe(0);
    const segmentsPath = workspacePath(dir, 'translation-work', 'SDW-001.de.segments.json');
    expect(existsSync(segmentsPath)).toBe(true);
    const segments = JSON.parse(readFileSync(segmentsPath, 'utf8'));
    expect(segments.schemaVersion).toBe('1.0');
    expect(segments.translationKey).toBe('SDW-001');
    expect(segments.sourcePath).toBe(SOURCE_RELATIVE('sample-article.md'));
  });

  it('extract CLI rejects target languages outside de/es', () => {
    const dir = makeWorkspace('sample-article.md');
    const result = runScript(
      'extract.mjs',
      ['--source', SOURCE_RELATIVE('sample-article.md'), '--target', 'fr'],
      dir,
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--target must be one of de, es');
  });

  it('extract CLI rejects sources outside src/content/articles/en/', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sdw-translation-'));
    mkdirSync(join(dir, 'src', 'content', 'articles', 'de'), { recursive: true });
    writeFileSync(join(dir, 'src', 'content', 'articles', 'de', 'x.md'), 'no frontmatter');
    const result = runScript('extract.mjs', ['--source', 'src/content/articles/de/x.md', '--target', 'de'], dir);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('src/content/articles/en/');
  });
});
