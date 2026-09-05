import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

/**
 * All published (non-draft) articles, sorted by `publishedAt` descending.
 *
 * Draft filtering is applied explicitly and unconditionally so that drafts
 * never reach the article overview, the homepage, the RSS feed, or public
 * article pages - independent of Astro's built-in draft handling.
 */
export async function getPublishedArticles(): Promise<Article[]> {
  const allArticles = await getCollection('articles');
  return allArticles
    .filter((article) => !article.data.draft)
    .sort(
      (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
    );
}
