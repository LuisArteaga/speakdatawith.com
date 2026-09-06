import { describe, expect, it } from 'vitest';
import {
  getPublishedArticles,
  groupPublishedByTranslationKey,
  isDerivedStale,
  validateArticleCollection,
  type Article,
  type PublishedLanguageVersions,
} from '../src/utils/articles';

type ArticleOverrides = Partial<Pick<Article['data'], 'contentId' | 'translationKey' | 'language' | 'translationOf' | 'translationStatus' | 'sourceRevision' | 'draft' | 'publishedAt'>> & { id?: string };

const PAST = '2026-01-01T00:00:00Z';

/** An English source article (SDW-001, revision 1, published in the past). */
function makeSource(overrides: ArticleOverrides = {}): Article {
  return {
    id: overrides.id ?? 'a-green-dbt-check-is-not-proof',
    collection: 'articles',
    data: {
      contentId: 'SDW-001-EN',
      translationKey: 'SDW-001',
      language: 'en',
      translationOf: null,
      translationStatus: 'source',
      sourceRevision: 1,
      draft: false,
      publishedAt: new Date(PAST),
      ...overrides,
    },
  } as unknown as Article;
}

/** A German translation of the default source (reviewed, revision 1). */
function makeTranslation(overrides: ArticleOverrides = {}): Article {
  return makeSource({
    id: overrides.id ?? 'ein-gruener-dbt-check-ist-kein-beweis',
    contentId: 'SDW-001-DE',
    language: 'de',
    translationOf: 'SDW-001-EN',
    translationStatus: 'reviewed',
    ...overrides,
  });
}

describe('getPublishedArticles (English source articles)', () => {
  it('excludes draft articles', () => {
    const articles = [
      makeSource({ id: 'published-1' }),
      makeSource({ id: 'draft-1', translationKey: 'SDW-002', contentId: 'SDW-002-EN', draft: true }),
    ];

    const result = getPublishedArticles(articles, 'en');

    expect(result.map((article) => article.id)).toEqual(['published-1']);
  });

  it('sorts by publishedAt descending', () => {
    const articles = [
      makeSource({ id: 'oldest', translationKey: 'SDW-001', contentId: 'SDW-001-EN', publishedAt: new Date('2026-01-01T00:00:00Z') }),
      makeSource({ id: 'newest', translationKey: 'SDW-002', contentId: 'SDW-002-EN', publishedAt: new Date('2026-03-01T00:00:00Z') }),
      makeSource({ id: 'middle', translationKey: 'SDW-003', contentId: 'SDW-003-EN', publishedAt: new Date('2026-02-01T00:00:00Z') }),
    ];

    const result = getPublishedArticles(articles, 'en');

    expect(result.map((article) => article.id)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('never lets a newer draft displace a published article', () => {
    const articles = [
      makeSource({ id: 'published' }),
      makeSource({ id: 'draft-newer-than-everything', translationKey: 'SDW-002', contentId: 'SDW-002-EN', draft: true, publishedAt: new Date('2027-01-01T00:00:00Z') }),
    ];

    const result = getPublishedArticles(articles, 'en');

    expect(result.map((article) => article.id)).toEqual(['published']);
  });

  it('excludes a non-draft article with publishedAt strictly in the future', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const articles = [
      makeSource({ id: 'already-out', translationKey: 'SDW-003', contentId: 'SDW-003-EN', publishedAt: new Date('2026-06-14T00:00:00Z') }),
      makeSource({ id: 'future', publishedAt: new Date('2026-06-15T12:00:01Z') }),
    ];

    const result = getPublishedArticles(articles, 'en', now);

    expect(result.map((article) => article.id)).toEqual(['already-out']);
  });

  it('includes an article whose publishedAt equals now', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const articles = [makeSource({ id: 'exact', publishedAt: now })];

    const result = getPublishedArticles(articles, 'en', now);

    expect(result.map((article) => article.id)).toEqual(['exact']);
  });

  it('excludes a future-dated draft regardless of either rule', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const articles = [makeSource({ id: 'future-draft', draft: true, publishedAt: new Date('2027-01-01T00:00:00Z') })];

    expect(getPublishedArticles(articles, 'en', now)).toEqual([]);
  });

  it('applies the future-date rule with the default clock', () => {
    const articles = [
      makeSource({ id: 'long-past', publishedAt: new Date('2000-01-01T00:00:00Z') }),
      makeSource({ id: 'far-future', translationKey: 'SDW-002', contentId: 'SDW-002-EN', publishedAt: new Date('3000-01-01T00:00:00Z') }),
    ];

    expect(getPublishedArticles(articles, 'en').map((article) => article.id)).toEqual(['long-past']);
  });

  it('excludes an English article with a non-source translation status', () => {
    const articles = [
      makeSource({ id: 'flagged-source', translationStatus: 'stale' }),
      makeSource({ id: 'generated-source', translationKey: 'SDW-002', contentId: 'SDW-002-EN', translationStatus: 'generated' }),
    ];

    expect(getPublishedArticles(articles, 'en')).toEqual([]);
  });

  it('returns an empty list for an empty collection', () => {
    expect(getPublishedArticles([], 'en')).toEqual([]);
  });

  it('excludes English articles when asked for a translation language', () => {
    const articles = [makeSource({ id: 'english-only' })];

    expect(getPublishedArticles(articles, 'de')).toEqual([]);
  });
});

describe('getPublishedArticles (translations)', () => {
  it('publishes a reviewed translation with matching sourceRevision and published source', () => {
    const articles = [makeSource(), makeTranslation()];

    const result = getPublishedArticles(articles, 'de');

    expect(result.map((article) => article.id)).toEqual(['ein-gruener-dbt-check-ist-kein-beweis']);
  });

  it('excludes a translation that is still generated', () => {
    const articles = [makeSource(), makeTranslation({ translationStatus: 'generated' })];

    expect(getPublishedArticles(articles, 'de')).toEqual([]);
  });

  it('excludes a translation explicitly marked stale', () => {
    const articles = [makeSource(), makeTranslation({ translationStatus: 'stale' })];

    expect(getPublishedArticles(articles, 'de')).toEqual([]);
  });

  it('excludes a derived-stale translation: reviewed but sourceRevision behind the source', () => {
    const articles = [makeSource({ sourceRevision: 2 }), makeTranslation()];

    expect(getPublishedArticles(articles, 'de')).toEqual([]);
  });

  it('fails the build when a translation has no English source for its translationKey', () => {
    const articles = [makeTranslation()];

    expect(() => getPublishedArticles(articles, 'de')).toThrow(/no English source/);
  });

  it('excludes a translation whose English source is still a draft', () => {
    const articles = [makeSource({ draft: true }), makeTranslation()];

    expect(getPublishedArticles(articles, 'de')).toEqual([]);
  });

  it('excludes a translation whose English source is future-dated', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const articles = [
      makeSource({ publishedAt: new Date('2026-06-16T00:00:00Z') }),
      makeTranslation(),
    ];

    expect(getPublishedArticles(articles, 'de', now)).toEqual([]);
  });

  it('excludes a translation that is itself future-dated', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const articles = [
      makeSource(),
      makeTranslation({ publishedAt: new Date('2026-06-15T12:00:01Z') }),
    ];

    expect(getPublishedArticles(articles, 'de', now)).toEqual([]);
  });

  it('excludes a translation that is a draft even with a matching source', () => {
    const articles = [makeSource(), makeTranslation({ draft: true })];

    expect(getPublishedArticles(articles, 'de')).toEqual([]);
  });

  it('publishes a Spanish translation independently of the German one', () => {
    const articles = [
      makeSource(),
      makeTranslation(),
      makeTranslation({ id: 'un-check-verde-de-dbt-no-es-una-prueba', contentId: 'SDW-001-ES', language: 'es' }),
    ];

    const german = getPublishedArticles(articles, 'de');
    const spanish = getPublishedArticles(articles, 'es');

    expect(german.map((article) => article.id)).toEqual(['ein-gruener-dbt-check-ist-kein-beweis']);
    expect(spanish.map((article) => article.id)).toEqual(['un-check-verde-de-dbt-no-es-una-prueba']);
  });
});

describe('isDerivedStale', () => {
  it('is true for a reviewed translation with a mismatching sourceRevision', () => {
    const source = makeSource({ sourceRevision: 2 });
    const translation = makeTranslation();

    expect(isDerivedStale(translation, source)).toBe(true);
  });

  it('is false when the revisions match', () => {
    const source = makeSource();
    const translation = makeTranslation();

    expect(isDerivedStale(translation, source)).toBe(false);
  });

  it('is false for a stored non-reviewed status regardless of revisions', () => {
    const source = makeSource({ sourceRevision: 2 });
    const translation = makeTranslation({ translationStatus: 'generated' });

    expect(isDerivedStale(translation, source)).toBe(false);
  });
});

describe('validateArticleCollection', () => {
  it('accepts a valid source/translation set', () => {
    const articles = [makeSource(), makeTranslation()];

    expect(() => validateArticleCollection(articles)).not.toThrow();
  });

  it('throws when the same translationKey and language appear twice', () => {
    const articles = [makeSource(), makeTranslation(), makeTranslation({ id: 'duplicate-german' })];

    expect(() => validateArticleCollection(articles)).toThrow(/Duplicate article version/);
  });

  it('allows the same translationKey in different languages', () => {
    const articles = [
      makeSource(),
      makeTranslation(),
      makeTranslation({ id: 'spanish', contentId: 'SDW-001-ES', language: 'es' }),
    ];

    expect(() => validateArticleCollection(articles)).not.toThrow();
  });

  it('throws when a translation has no English source with its translationKey', () => {
    const articles = [makeTranslation({ translationKey: 'SDW-099' })];

    expect(() => validateArticleCollection(articles)).toThrow(/no English source/);
  });

  it('throws when translationOf does not match the English contentId', () => {
    const articles = [makeSource(), makeTranslation({ translationOf: 'SDW-999-EN' })];

    expect(() => validateArticleCollection(articles)).toThrow(/references translationOf/);
  });

  it('throws when translationOf points at a contentId of a different article', () => {
    const articles = [
      makeSource(),
      makeSource({ id: 'other', translationKey: 'SDW-002', contentId: 'SDW-002-EN' }),
      makeTranslation({ translationKey: 'SDW-001', translationOf: 'SDW-002-EN' }),
    ];

    expect(() => validateArticleCollection(articles)).toThrow(/references translationOf/);
  });
});

describe('groupPublishedByTranslationKey', () => {
  it('groups published versions by translationKey across languages', () => {
    const articles = [
      makeSource(),
      makeTranslation(),
      makeTranslation({ id: 'spanish', contentId: 'SDW-001-ES', language: 'es' }),
    ];

    const groups = groupPublishedByTranslationKey(articles);

    const versions: PublishedLanguageVersions | undefined = groups.get('SDW-001');
    expect(versions?.en?.id).toBe('a-green-dbt-check-is-not-proof');
    expect(versions?.de?.id).toBe('ein-gruener-dbt-check-ist-kein-beweis');
    expect(versions?.es?.id).toBe('spanish');
  });

  it('contains only published versions', () => {
    const articles = [
      makeSource(),
      makeTranslation({ translationStatus: 'generated' }),
    ];

    const groups = groupPublishedByTranslationKey(articles);

    const versions = groups.get('SDW-001');
    expect(versions?.en).toBeDefined();
    expect(versions?.de).toBeUndefined();
    expect(versions?.es).toBeUndefined();
  });

  it('excludes derived-stale translations from the groups', () => {
    const articles = [makeSource({ sourceRevision: 2 }), makeTranslation()];

    const versions = groupPublishedByTranslationKey(articles).get('SDW-001');

    expect(versions?.de).toBeUndefined();
  });

  it('returns an empty map for an empty collection', () => {
    expect(groupPublishedByTranslationKey([]).size).toBe(0);
  });
});
