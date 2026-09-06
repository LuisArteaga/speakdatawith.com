import { describe, expect, it } from 'vitest';
import {
  articlePathSuffix,
  buildArticleAlternates,
  buildIndexAlternates,
  type LocalePathSuffix,
} from '../src/utils/alternates';
import { groupPublishedByTranslationKey } from '../src/utils/articles';
import type { Article } from '../src/utils/articles';

function makeArticle(id: string, language: 'en' | 'de' | 'es', translationKey = 'SDW-001'): Article {
  const contentId = `SDW-001-${language.toUpperCase()}`;
  return {
    id,
    collection: 'articles',
    data: {
      contentId,
      translationKey,
      language,
      translationOf: language === 'en' ? null : `${translationKey}-EN`,
      translationStatus: language === 'en' ? 'source' : 'reviewed',
      sourceRevision: 1,
      draft: false,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    },
  } as unknown as Article;
}

const EN = makeArticle('a-green-dbt-check-is-not-proof', 'en');
const DE = makeArticle('ein-gruener-dbt-check-ist-kein-beweis', 'de');
const ES = makeArticle('un-check-verde-de-dbt-no-es-una-prueba', 'es');

function localesOf(links: LocalePathSuffix[]): string[] {
  return links.map((link) => link.locale);
}

describe('articlePathSuffix', () => {
  it('places the article below its language tree using its own slug', () => {
    expect(articlePathSuffix(DE)).toBe('articles/ein-gruener-dbt-check-ist-kein-beweis/');
  });
});

describe('buildIndexAlternates', () => {
  it('links all three language versions of a language homepage, including self', () => {
    const links = buildIndexAlternates('/en/');

    expect(localesOf(links)).toEqual(['en', 'de', 'es']);
    expect(links.every((link) => link.pathSuffix === '')).toBe(true);
  });

  it('keeps the deeper path of an article overview for every locale', () => {
    const links = buildIndexAlternates('/de/articles/');

    expect(localesOf(links)).toEqual(['en', 'de', 'es']);
    expect(links.every((link) => link.pathSuffix === 'articles/')).toBe(true);
  });

  it('throws for a pathname without a locale prefix', () => {
    expect(() => buildIndexAlternates('/about/')).toThrow(/locale-prefixed/);
  });
});

describe('buildArticleAlternates', () => {
  it('links exactly the published versions of the article, each with its own slug', () => {
    const links = buildArticleAlternates(EN, { en: EN, de: DE });

    expect(localesOf(links)).toEqual(['en', 'de']);
    expect(links[0]?.pathSuffix).toBe('articles/a-green-dbt-check-is-not-proof/');
    expect(links[1]?.pathSuffix).toBe('articles/ein-gruener-dbt-check-ist-kein-beweis/');
  });

  it('produces a reciprocal cluster over all three published versions', () => {
    const links = buildArticleAlternates(ES, { en: EN, de: DE, es: ES });

    expect(localesOf(links)).toEqual(['en', 'de', 'es']);
  });

  it('omits languages without a published version', () => {
    const links = buildArticleAlternates(DE, { de: DE });

    expect(localesOf(links)).toEqual(['de']);
  });

  it('degrades to the article alone when no versions object exists', () => {
    const links = buildArticleAlternates(EN, undefined);

    expect(localesOf(links)).toEqual(['en']);
    expect(links[0]?.pathSuffix).toBe('articles/a-green-dbt-check-is-not-proof/');
  });
});

describe('hreflang clusters against the publication logic', () => {
  const NOW = new Date('2026-09-15T00:00:00Z');

  function versionOf(language: 'en' | 'de' | 'es', overrides: Partial<Article['data']> = {}): Article {
    const article = makeArticle(`version-${language}`, language);
    Object.assign(article.data, overrides);
    return article;
  }

  function alternatesFor(articles: Article[]): string[] {
    const groups = groupPublishedByTranslationKey(articles, NOW);
    const group = groups.get('SDW-001') ?? {};
    const current = group.en ?? group.de ?? group.es;
    if (!current) {
      throw new Error('the fixture collection has no published version to render');
    }
    return localesOf(buildArticleAlternates(current, group));
  }

  it('links only published languages: a generated translation stays out', () => {
    const articles = [
      versionOf('en', { publishedAt: new Date('2026-01-01T00:00:00Z') }),
      versionOf('de', { translationStatus: 'generated' }),
    ];

    expect(alternatesFor(articles)).toEqual(['en']);
  });

  it('links only published languages: a stored-stale translation stays out', () => {
    const articles = [
      versionOf('en', { publishedAt: new Date('2026-01-01T00:00:00Z') }),
      versionOf('de', { translationStatus: 'stale' }),
    ];

    expect(alternatesFor(articles)).toEqual(['en']);
  });

  it('links only published languages: a derived-stale translation stays out', () => {
    const articles = [
      versionOf('en', { publishedAt: new Date('2026-01-01T00:00:00Z'), sourceRevision: 2 }),
      versionOf('de', { sourceRevision: 1 }),
    ];

    expect(alternatesFor(articles)).toEqual(['en']);
  });

  it('links only published languages: a future-dated translation stays out', () => {
    const articles = [
      versionOf('en', { publishedAt: new Date('2026-01-01T00:00:00Z') }),
      versionOf('de', { publishedAt: new Date('2026-10-01T00:00:00Z') }),
    ];

    expect(alternatesFor(articles)).toEqual(['en']);
  });

  it('links the reviewed, revision-aligned translation next to its published source', () => {
    const articles = [
      versionOf('en', { publishedAt: new Date('2026-01-01T00:00:00Z') }),
      versionOf('de', { publishedAt: new Date('2026-01-01T00:00:00Z') }),
    ];

    expect(alternatesFor(articles)).toEqual(['en', 'de']);
  });

  it('produces no cluster at all when no version is published', () => {
    const articles = [versionOf('en', { draft: true }), versionOf('de')];

    const groups = groupPublishedByTranslationKey(articles, NOW);
    expect(groups.has('SDW-001')).toBe(false);
  });
});
