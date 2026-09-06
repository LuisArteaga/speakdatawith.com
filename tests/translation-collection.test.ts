/**
 * Tests for scripts/translation/check-collection.mjs (issue #16): the
 * per-file frontmatter rules and their parity with the zod article schema,
 * the collection-level integrity rules, and the CLI gate. Document fixtures
 * live in throwaway workspaces, never inside the productive article
 * collection.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { stringify as stringifyYaml } from 'yaml';
import { articleSchema } from '../src/schemas/article';
import { LOCALES } from '../src/i18n/config';
import { TARGET_LANGUAGES } from '../scripts/translation/lib/markdown.mjs';
import {
  checkCollection,
  validateFrontmatterShape,
} from '../scripts/translation/check-collection.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_PATH = join(REPO_ROOT, 'scripts', 'translation', 'check-collection.mjs');
const NOW = new Date('2026-09-15T12:00:00Z');

// -- fixtures -----------------------------------------------------------------

function englishFrontmatter(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    contentId: 'SDW-001-EN',
    translationKey: 'SDW-001',
    language: 'en',
    translationOf: null,
    translationStatus: 'source',
    sourceRevision: 1,
    title: 'A green dbt check is not proof',
    description: 'What a successful workflow run proves about your data pipeline.',
    publishedAt: '2026-09-01',
    updatedAt: null,
    draft: false,
    pillar: ['Evaluate'],
    audience: ['Analytics Engineers'],
    tags: ['dbt'],
    repositoryUrl: 'https://github.com/example/quality-gates',
    releaseUrl: null,
    evidenceUrl: 'https://example.com/evidence/2026-09',
    youtubeId: null,
    ...overrides,
  };
}

function germanFrontmatter(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...englishFrontmatter(),
    contentId: 'SDW-001-DE',
    language: 'de',
    translationOf: 'SDW-001-EN',
    translationStatus: 'reviewed',
    title: 'Ein grüner dbt-Check ist kein Beweis',
    description: 'Was ein erfolgreicher Workflow-Run über die Datenpipeline beweist.',
    ...overrides,
  };
}

const EN_BODY = [
  '## A green dbt check is not proof',
  '',
  'A successful workflow run only proves that the process **completed**. Roughly 73% of all incidents were caused by schema drift, and 1,234 rows were affected in a single release.',
  '',
  'Read the [quality gate documentation](https://example.com/quality-gates) and compare the release notes for v1.0.2 before you merge the Pull Request.',
  '',
  '- Run `dbt build --select +customers` before every merge.',
  '- Check the freshness of the source tables in Snowflake.',
  '',
  '```sql',
  'select customer_id',
  'from orders',
  '```',
].join('\n');

const DE_BODY = [
  '## Ein grüner dbt-Check ist kein Beweis',
  '',
  'Ein erfolgreicher Workflow-Run beweist nur, dass der Prozess **abgeschlossen** wurde. Rund 73% aller Vorfälle wurden durch Schema-Drift verursacht, und 1.234 Zeilen waren von einem einzigen Release betroffen.',
  '',
  'Lies die [Quality-Gate-Dokumentation](https://example.com/quality-gates) und prüfe die Release Notes für v1.0.2, bevor du den Pull Request mergest.',
  '',
  '- Führe `dbt build --select +customers` vor jedem Merge aus.',
  '- Prüfe die Frische der Quelltabellen in Snowflake.',
  '',
  '```sql',
  'select customer_id',
  'from orders',
  '```',
].join('\n');

const ES_BODY = DE_BODY.replace('Ein grüner dbt-Check ist kein Beweis', 'Un check verde de dbt no es una prueba');

/** Serializes frontmatter + body into a full article document. */
function renderDocument(frontmatter: Record<string, unknown>, body: string): string {
  return `---\n${stringifyYaml(frontmatter, { lineWidth: 0 })}---\n\n${body}\n`;
}

function file(path: string, frontmatter: Record<string, unknown>, body = ''): {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
} {
  return { path, frontmatter, content: renderDocument(frontmatter, body) };
}

function errorMessages(result: { errors: { path: string; message: string }[] }): string[] {
  return result.errors.map((finding) => finding.message);
}

function warningMessages(result: { warnings: { path: string; message: string }[] }): string[] {
  return result.warnings.map((finding) => finding.message);
}

// -- per-file frontmatter shape ------------------------------------------------

describe('validateFrontmatterShape', () => {
  it('accepts the canonical English and German frontmatters', () => {
    expect(validateFrontmatterShape(englishFrontmatter())).toEqual([]);
    expect(validateFrontmatterShape(germanFrontmatter())).toEqual([]);
  });

  it('rejects malformed identity fields', () => {
    expect(validateFrontmatterShape(englishFrontmatter({ contentId: 'SDW-1-EN' }))).not.toEqual([]);
    expect(validateFrontmatterShape(englishFrontmatter({ translationKey: 'SDW-1' }))).not.toEqual([]);
    expect(validateFrontmatterShape(germanFrontmatter({ contentId: 'SDW-001-EN' }))).not.toEqual([]);
  });

  it('rejects invalid status combinations', () => {
    expect(validateFrontmatterShape(englishFrontmatter({ translationStatus: 'reviewed' }))).not.toEqual([]);
    expect(validateFrontmatterShape(germanFrontmatter({ translationStatus: 'source' }))).not.toEqual([]);
    expect(validateFrontmatterShape(germanFrontmatter({ translationOf: null }))).not.toEqual([]);
    expect(validateFrontmatterShape(germanFrontmatter({ translationStatus: 'approved' }))).not.toEqual([]);
  });

  it('rejects invalid dates, URLs, and ids', () => {
    expect(validateFrontmatterShape(englishFrontmatter({ publishedAt: 'not-a-date' }))).not.toEqual([]);
    expect(validateFrontmatterShape(englishFrontmatter({ updatedAt: '2026-08-31' }))).not.toEqual([]);
    expect(validateFrontmatterShape(englishFrontmatter({ repositoryUrl: 'not-a-url' }))).not.toEqual([]);
    expect(validateFrontmatterShape(englishFrontmatter({ youtubeId: 'short' }))).not.toEqual([]);
    expect(validateFrontmatterShape(englishFrontmatter({ youtubeId: 'dQw4w9WgXcQ' }))).toEqual([]);
  });

  it('rejects invalid taxonomy and revision', () => {
    expect(validateFrontmatterShape(englishFrontmatter({ pillar: ['Invalid'] }))).not.toEqual([]);
    expect(validateFrontmatterShape(englishFrontmatter({ audience: [] }))).not.toEqual([]);
    expect(validateFrontmatterShape(englishFrontmatter({ sourceRevision: 0 }))).not.toEqual([]);
    expect(validateFrontmatterShape(englishFrontmatter({ sourceRevision: 1.5 }))).not.toEqual([]);
  });
});

// -- zod parity -----------------------------------------------------------------

const PARITY_FIXTURES: { name: string; frontmatter: Record<string, unknown> }[] = [
  { name: 'valid English source', frontmatter: englishFrontmatter() },
  { name: 'valid German translation', frontmatter: germanFrontmatter() },
  {
    name: 'valid Spanish translation',
    frontmatter: germanFrontmatter({ contentId: 'SDW-001-ES', language: 'es' }),
  },
  {
    name: 'valid translation with all optional provenance fields',
    frontmatter: germanFrontmatter({
      translationModel: 'acme/model-1',
      translationPromptVersion: '1.0',
      translatedAt: '2026-09-05',
    }),
  },
  {
    name: 'valid source without optional fields (zod defaults)',
    frontmatter: (({ draft, updatedAt, youtubeId, ...rest }) => rest)(englishFrontmatter()),
  },
  { name: 'contentId suffix mismatch', frontmatter: germanFrontmatter({ contentId: 'SDW-001-EN' }) },
  { name: 'English with non-source status', frontmatter: englishFrontmatter({ translationStatus: 'reviewed' }) },
  { name: 'translation with source status', frontmatter: germanFrontmatter({ translationStatus: 'source' }) },
  { name: 'translation without translationOf', frontmatter: germanFrontmatter({ translationOf: null }) },
  { name: 'translationOf on English source', frontmatter: englishFrontmatter({ translationOf: 'SDW-001-EN' }) },
  { name: 'unknown language', frontmatter: germanFrontmatter({ language: 'fr', contentId: 'SDW-001-FR' }) },
  { name: 'short translationKey', frontmatter: englishFrontmatter({ translationKey: 'SDW-1' }) },
  { name: 'sourceRevision zero', frontmatter: englishFrontmatter({ sourceRevision: 0 }) },
  { name: 'sourceRevision fractional', frontmatter: englishFrontmatter({ sourceRevision: 1.5 }) },
  { name: 'unparseable publishedAt', frontmatter: englishFrontmatter({ publishedAt: 'not-a-date' }) },
  { name: 'updatedAt before publishedAt', frontmatter: englishFrontmatter({ updatedAt: '2026-08-31' }) },
  { name: 'unparseable translatedAt', frontmatter: germanFrontmatter({ translatedAt: 'soon' }) },
  { name: 'invalid repositoryUrl', frontmatter: englishFrontmatter({ repositoryUrl: 'not-a-url' }) },
  { name: 'invalid youtubeId', frontmatter: englishFrontmatter({ youtubeId: 'short' }) },
  { name: 'valid youtubeId', frontmatter: englishFrontmatter({ youtubeId: 'dQw4w9WgXcQ' }) },
  { name: 'invalid pillar value', frontmatter: englishFrontmatter({ pillar: ['Invalid'] }) },
  { name: 'empty audience', frontmatter: englishFrontmatter({ audience: [] }) },
  { name: 'missing title', frontmatter: englishFrontmatter({ title: '' }) },
  { name: 'non-boolean draft', frontmatter: englishFrontmatter({ draft: 'no' }) },
  { name: 'empty translationModel', frontmatter: germanFrontmatter({ translationModel: '' }) },
];

describe('frontmatter parity between the collection script and the zod schema', () => {
  it('agrees with articleSchema on every shared fixture', () => {
    const agreements = PARITY_FIXTURES.map(({ name, frontmatter }) => {
      const shapeValid = validateFrontmatterShape(frontmatter).length === 0;
      const schemaValid = articleSchema.safeParse(frontmatter).success;
      return { name, shapeValid, schemaValid };
    });

    const disagreements = agreements.filter((entry) => entry.shapeValid !== entry.schemaValid);
    expect(disagreements.map((entry) => entry.name)).toEqual([]);
  });

  it('covers both accepted and rejected fixtures', () => {
    const accepted = PARITY_FIXTURES.filter(
      ({ frontmatter }) => validateFrontmatterShape(frontmatter).length === 0,
    );
    const rejected = PARITY_FIXTURES.filter(
      ({ frontmatter }) => validateFrontmatterShape(frontmatter).length > 0,
    );

    expect(accepted.length).toBeGreaterThan(0);
    expect(rejected.length).toBeGreaterThan(0);
  });

  it('keeps the script languages aligned with the site locales', () => {
    expect(TARGET_LANGUAGES).toEqual(LOCALES.filter((locale) => locale !== 'en'));
  });
});

// -- collection-level checks ------------------------------------------------------

describe('checkCollection', () => {
  it('accepts a valid English source without translations with only warnings', () => {
    const result = checkCollection([file('en/post.md', englishFrontmatter(), EN_BODY)], { now: NOW });

    expect(result.errors).toEqual([]);
    expect(warningMessages(result)).toEqual([
      expect.stringContaining('missing de translation'),
      expect.stringContaining('missing es translation'),
    ]);
  });

  it('accepts a valid pair per target language without any findings', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter(), DE_BODY),
      file('es/un-check-verde.md', germanFrontmatter({ contentId: 'SDW-001-ES', language: 'es' }), ES_BODY),
    ], { now: NOW });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('fails on a duplicate translationKey and language combination', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/erstes.md', germanFrontmatter(), DE_BODY),
      file('de/zweites.md', germanFrontmatter(), DE_BODY),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('duplicate article version'))).toBe(true);
  });

  it('fails on a translation without an English original', () => {
    const result = checkCollection(
      [file('de/verwaist.md', germanFrontmatter(), DE_BODY)],
      { now: NOW },
    );

    expect(errorMessages(result).some((message) => message.includes('no English source article'))).toBe(true);
  });

  it('fails on an invalid translationOf reference', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter({ translationOf: 'SDW-002-EN' }), DE_BODY),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('translationOf must reference'))).toBe(true);
  });

  it('fails on a sourceRevision mismatch and reports the mandated fields', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter({ sourceRevision: 2 }), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter({ sourceRevision: 1 }), DE_BODY),
    ], { now: NOW });

    const stale = errorMessages(result).find((message) => message.includes('stale translation'));
    expect(stale).toBeDefined();
    expect(stale).toContain('source article en/post.md (en, expected revision 2)');
    expect(stale).toContain('translation article de/gruener-dbt-check.md (de, found revision 1)');
  });

  it('reports a stored-stale publishable translation as an error', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter({ translationStatus: 'stale' }), DE_BODY),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('publishable by date'))).toBe(true);
  });

  it('fails on a generated translation that is publishable by date', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter({ translationStatus: 'generated' }), DE_BODY),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('publishable by date'))).toBe(true);
  });

  it('accepts generated and stale states while the translation is not publishable', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/entwurf.md', germanFrontmatter({ translationStatus: 'generated', draft: true }), DE_BODY),
      file(
        'de/geparkt.md',
        germanFrontmatter({
          translationKey: 'SDW-002',
          contentId: 'SDW-002-DE',
          translationOf: 'SDW-002-EN',
          translationStatus: 'stale',
          publishedAt: '2027-01-01',
        }),
        DE_BODY,
      ),
    ], { now: NOW });

    // SDW-002 has no English source: only that error is expected, the parked
    // states themselves are fine. SDW-001 still warns about the missing es
    // translation.
    expect(errorMessages(result)).toEqual([
      expect.stringContaining('no English source article'),
    ]);
    expect(warningMessages(result)).toEqual([
      expect.stringContaining('missing es translation of SDW-001'),
    ]);
  });

  it('fails on inconsistent technical references', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter({ repositoryUrl: 'https://github.com/example/other' }), DE_BODY),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('inconsistent technical reference'))).toBe(true);
  });

  it('fails on a changed code block', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter(), DE_BODY.replace('from orders', 'FROM orders')),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('code blocks must remain byte-identical'))).toBe(true);
  });

  it('fails on a changed URL', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file(
        'de/gruener-dbt-check.md',
        germanFrontmatter(),
        DE_BODY.replace('https://example.com/quality-gates', 'https://example.com/quality-gates-v2'),
      ),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('URLs'))).toBe(true);
  });

  it('fails on a changed inline code value', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file(
        'de/gruener-dbt-check.md',
        germanFrontmatter(),
        DE_BODY.replace('dbt build --select +customers', 'dbt build --select +customers_v2'),
      ),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('inline code values must remain unchanged'))).toBe(true);
  });

  it('fails on a changed numeric value', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter(), DE_BODY.replace('73%', '74%')),
    ], { now: NOW });

    expect(errorMessages(result).some((message) => message.includes('numeric values differ'))).toBe(true);
  });

  it('warns about ambiguous numbers without failing', () => {
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter(), DE_BODY.replace('73%', '0.25%')),
    ], { now: NOW });

    // The en token `0.25` in German text is ambiguous; the value-change is
    // absorbed by the ambiguity (review material, not a failure).
    expect(warningMessages(result).some((message) => message.includes('ambiguous number'))).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('warns about an untranslated Figure alt text without failing', () => {
    const figureBody = [
      'Intro paragraph with context.',
      '',
      '<Figure src="https://example.com/images/pipeline.png" alt="Pipeline overview" caption="Overview" />',
    ].join('\n');
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), figureBody),
      file('de/gruener-dbt-check.md', germanFrontmatter(), figureBody),
    ], { now: NOW });

    expect(errorMessages(result)).toEqual([]);
    expect(warningMessages(result).some((message) => message.includes('Figure alt text'))).toBe(true);
  });

  it('warns about protected glossary terms that drift between source and translation', () => {
    const deWithoutSnowflake = DE_BODY.replace('in Snowflake.', 'im Warehouse.');
    const result = checkCollection([
      file('en/post.md', englishFrontmatter(), EN_BODY),
      file('de/gruener-dbt-check.md', germanFrontmatter(), deWithoutSnowflake),
    ], { now: NOW, glossaryProtectedTerms: ['Snowflake'] });

    expect(errorMessages(result)).toEqual([]);
    expect(
      warningMessages(result).some((message) => message.includes('protected glossary term "Snowflake"')),
    ).toBe(true);
  });

  it('reports per-file frontmatter rule violations once per file', () => {
    const result = checkCollection(
      [file('en/post.md', englishFrontmatter({ contentId: 'SDW-001-DE', sourceRevision: 0 }), EN_BODY)],
      { now: NOW },
    );

    const messages = errorMessages(result);
    expect(messages).toContain('the contentId language suffix must match the language field');
    expect(messages).toContain('sourceRevision must be a positive integer');
  });
});

// -- CLI gate -----------------------------------------------------------------

interface CliResult {
  status: number;
  stdout: string;
  stderr: string;
}

describe('check-collection CLI', () => {
  let workspace = '';

  function makeWorkspace(): string {
    workspace = mkdtempSync(join(tmpdir(), 'sdw-check-collection-'));
    mkdirSync(join(workspace, 'src', 'content', 'articles', 'en'), { recursive: true });
    return workspace;
  }

  function writeArticle(language: string, name: string, frontmatter: Record<string, unknown>, body: string): void {
    const target = join(workspace, 'src', 'content', 'articles', language);
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, name), renderDocument(frontmatter, body));
  }

  function runCheck(): CliResult {
    const result = spawnSync(process.execPath, [SCRIPT_PATH], { cwd: workspace, encoding: 'utf8' });
    return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  }

  afterEach(() => {
    if (workspace !== '') {
      rmSync(workspace, { recursive: true, force: true });
      workspace = '';
    }
  });

  it('passes over the fixture pair for de and es', () => {
    makeWorkspace();
    writeArticle('en', 'post.md', englishFrontmatter({ publishedAt: '2020-01-01' }), EN_BODY);
    writeArticle('de', 'gruener-dbt-check.md', germanFrontmatter({ publishedAt: '2020-01-01' }), DE_BODY);
    writeArticle(
      'es',
      'un-check-verde.md',
      germanFrontmatter({ contentId: 'SDW-001-ES', language: 'es', publishedAt: '2020-01-01' }),
      ES_BODY,
    );

    const result = runCheck();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('OK: 3 article(s) checked');
  });

  it('warns about missing translations without failing', () => {
    makeWorkspace();
    writeArticle('en', 'post.md', englishFrontmatter({ publishedAt: '2020-01-01' }), EN_BODY);

    const result = runCheck();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('missing de translation');
    expect(result.stdout).toContain('missing es translation');
    expect(result.stderr).toBe('');
  });

  it('fails with the staleness report when the revision drifted', () => {
    makeWorkspace();
    writeArticle('en', 'post.md', englishFrontmatter({ publishedAt: '2020-01-01', sourceRevision: 2 }), EN_BODY);
    writeArticle('de', 'gruener-dbt-check.md', germanFrontmatter({ publishedAt: '2020-01-01' }), DE_BODY);

    const result = runCheck();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('expected revision 2');
    expect(result.stderr).toContain('found revision 1');
    expect(result.stderr).toContain('de/gruener-dbt-check.md');
  });

  it('fails when a document invariant is violated', () => {
    makeWorkspace();
    writeArticle('en', 'post.md', englishFrontmatter({ publishedAt: '2020-01-01' }), EN_BODY);
    writeArticle(
      'de',
      'gruener-dbt-check.md',
      germanFrontmatter({ publishedAt: '2020-01-01' }),
      DE_BODY.replace('from orders', 'from orders_v2'),
    );

    const result = runCheck();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('code blocks must remain byte-identical');
  });

  it('fails when a file has no frontmatter block', () => {
    makeWorkspace();
    writeFileSync(join(workspace, 'src', 'content', 'articles', 'en', 'broken.md'), 'just prose, no frontmatter');

    const result = runCheck();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('no YAML frontmatter block');
  });

  it('fails when a file lives outside the language directories', () => {
    makeWorkspace();
    mkdirSync(join(workspace, 'src', 'content', 'articles', 'fr'), { recursive: true });
    writeFileSync(join(workspace, 'src', 'content', 'articles', 'fr', 'post.md'), '---\ntitle: x\n---\n\ntext\n');

    const result = runCheck();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('language directory');
  });
});
