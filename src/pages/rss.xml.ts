import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedArticles } from '../utils/articles';

export const GET: APIRoute = async (context) => {
  // Drafts are filtered out; the feed contains published articles only.
  const articles = getPublishedArticles(await getCollection('articles'));

  return rss({
    title: 'SpeakDataWith',
    description: 'Articles on building observable, governable data platforms.',
    site: context.site ?? 'https://speakdatawith.com',
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      link: `/articles/${article.id}/`,
      pubDate: article.data.publishedAt,
      categories: article.data.pillar,
    })),
    customData: '<language>en</language>',
  });
};
