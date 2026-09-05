import { describe, expect, it } from 'vitest';
import { getPublishedArticles, type Article } from '../src/utils/articles';

function makeArticle(id: string, publishedAt: string, draft = false): Article {
  return {
    id,
    collection: 'articles',
    data: {
      draft,
      publishedAt: new Date(publishedAt),
    },
  } as unknown as Article;
}

describe('getPublishedArticles', () => {
  it('excludes draft articles', () => {
    const articles = [
      makeArticle('published-1', '2026-01-01T00:00:00Z'),
      makeArticle('draft-1', '2026-02-01T00:00:00Z', true),
    ];

    const result = getPublishedArticles(articles);

    expect(result.map((article) => article.id)).toEqual(['published-1']);
  });

  it('sorts by publishedAt descending', () => {
    const articles = [
      makeArticle('oldest', '2026-01-01T00:00:00Z'),
      makeArticle('newest', '2026-03-01T00:00:00Z'),
      makeArticle('middle', '2026-02-01T00:00:00Z'),
    ];

    const result = getPublishedArticles(articles);

    expect(result.map((article) => article.id)).toEqual([
      'newest',
      'middle',
      'oldest',
    ]);
  });

  it('never lets a newer draft displace a published article', () => {
    const articles = [
      makeArticle('published', '2026-01-01T00:00:00Z'),
      makeArticle('draft-newer-than-everything', '2027-01-01T00:00:00Z', true),
    ];

    const result = getPublishedArticles(articles);

    expect(result.map((article) => article.id)).toEqual(['published']);
  });

  it('returns an empty list for an empty collection', () => {
    expect(getPublishedArticles([])).toEqual([]);
  });

  it('returns an empty list when every article is a draft', () => {
    const articles = [
      makeArticle('draft-1', '2026-01-01T00:00:00Z', true),
      makeArticle('draft-2', '2026-02-01T00:00:00Z', true),
    ];

    expect(getPublishedArticles(articles)).toEqual([]);
  });

  it('does not mutate the input array order', () => {
    const articles = [
      makeArticle('older', '2026-01-01T00:00:00Z'),
      makeArticle('newer', '2026-02-01T00:00:00Z'),
    ];
    const inputOrder = articles.map((article) => article.id);

    getPublishedArticles(articles);

    expect(articles.map((article) => article.id)).toEqual(inputOrder);
  });
});
