import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedArticles } from '../../utils/articles';
import { LOCALES, getUiDictionary, type Locale } from '../../i18n/config';

export function getStaticPaths() {
  return LOCALES.map((locale) => ({ params: { lang: locale } }));
}

export const GET: APIRoute = async (context) => {
  // The central publication filter decides membership: drafts, unreviewed
  // translations, stale translations (stored or derived), and future-dated
  // articles never reach the feed.
  const locale = context.params.lang as Locale;
  const articles = getPublishedArticles(await getCollection('articles'), locale);
  const dict = getUiDictionary(locale);

  return rss({
    title: 'SpeakDataWith',
    description: dict.homeDescription,
    site: context.site ?? 'https://speakdatawith.com',
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      link: `/${locale}/articles/${article.id}/`,
      pubDate: article.data.publishedAt,
      categories: article.data.pillar,
      // Stable per-language identity as guid (not the URL). Item-level
      // customData is merged after @astrojs/rss's default guid, replacing it.
      customData: `<guid isPermaLink="false">${article.data.contentId}</guid>`,
    })),
    customData: `<language>${locale}</language>`,
  });
};
