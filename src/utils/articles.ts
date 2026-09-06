import type { CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

/**
 * All published articles from `articles`, sorted by `publishedAt`
 * descending.
 *
 * Pure so the filtering/sorting contract is unit-testable; callers pass
 * the collection entries they already fetched via `getCollection`.
 *
 * Publication rules, applied explicitly and unconditionally so that
 * unlisted articles never reach the article overview, the homepage, the
 * RSS feed, or public article pages - independent of Astro's built-in
 * draft handling:
 *
 * - `draft: true` articles are excluded.
 * - Articles with a `publishedAt` strictly in the future (relative to
 *   `now`) are excluded; `publishedAt` equal to `now` counts as published.
 *
 * This is the single publication filter. Never copy draft or date logic
 * into individual pages or feeds.
 */
export function getPublishedArticles(
  articles: Article[],
  now: Date = new Date(),
): Article[] {
  const nowValue = now.valueOf();
  return articles
    .filter(
      (article) => !article.data.draft && article.data.publishedAt.valueOf() <= nowValue,
    )
    .sort(
      (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
    );
}
