import type { CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

/**
 * All published (non-draft) articles from `articles`, sorted by
 * `publishedAt` descending.
 *
 * Pure so the filtering/sorting contract is unit-testable; callers pass
 * the collection entries they already fetched via `getCollection`.
 *
 * Draft filtering is applied explicitly and unconditionally so that drafts
 * never reach the article overview, the homepage, the RSS feed, or public
 * article pages - independent of Astro's built-in draft handling.
 */
export function getPublishedArticles(articles: Article[]): Article[] {
  return articles
    .filter((article) => !article.data.draft)
    .sort(
      (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
    );
}
