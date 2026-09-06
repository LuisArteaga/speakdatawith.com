import type { CollectionEntry } from 'astro:content';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n/config';

export type Article = CollectionEntry<'articles'>;

/** The published language versions of one article, keyed by language. */
export type PublishedLanguageVersions = Partial<Record<Locale, Article>>;

/**
 * Cross-entry validation for the whole `articles` collection. Enforces the
 * rules that cannot live in the per-file frontmatter schema:
 *
 * - the combination of `translationKey` and `language` is unique,
 * - every translation's `translationOf` names the `contentId` of the
 *   English article that carries the same `translationKey`,
 * - every `translationKey` has an English source article.
 *
 * Throws with a descriptive message on the first violation. Called by every
 * public entry point in this module, so an invalid collection fails the
 * build regardless of which page or feed is rendered first.
 */
export function validateArticleCollection(articles: Article[]): void {
  const seen = new Set<string>();
  const englishByTranslationKey = new Map<string, Article>();

  for (const article of articles) {
    const { translationKey, language } = article.data;
    const identity = `${translationKey}|${language}`;
    if (seen.has(identity)) {
      throw new Error(
        `Duplicate article version: translationKey ${translationKey} already exists in language ${language} (${article.id})`,
      );
    }
    seen.add(identity);
    if (language === DEFAULT_LOCALE) {
      englishByTranslationKey.set(translationKey, article);
    }
  }

  for (const article of articles) {
    if (article.data.language === DEFAULT_LOCALE) {
      continue;
    }
    const source = englishByTranslationKey.get(article.data.translationKey);
    if (!source) {
      throw new Error(
        `Translation ${article.id} (${article.data.translationKey}) has no English source article with that translationKey`,
      );
    }
    if (article.data.translationOf !== source.data.contentId) {
      throw new Error(
        `Translation ${article.id} references translationOf ${article.data.translationOf}, but its English source is ${source.data.contentId}`,
      );
    }
  }
}

/**
 * Whether a translation is stale by derivation: its stored status is
 * `reviewed`, but its `sourceRevision` no longer matches the source
 * article's. A derived-stale translation is excluded from publication
 * regardless of its stored status (and CI fails on it in a later issue).
 */
export function isDerivedStale(translation: Article, source: Article): boolean {
  return (
    translation.data.translationStatus === 'reviewed' &&
    translation.data.sourceRevision !== source.data.sourceRevision
  );
}

function isPublishedSourceArticle(article: Article, nowValue: number): boolean {
  return (
    article.data.language === DEFAULT_LOCALE &&
    !article.data.draft &&
    article.data.translationStatus === 'source' &&
    article.data.publishedAt.valueOf() <= nowValue
  );
}

function isPublishedTranslationArticle(
  article: Article,
  englishByTranslationKey: Map<string, Article>,
  nowValue: number,
): boolean {
  if (article.data.draft || article.data.publishedAt.valueOf() > nowValue) {
    return false;
  }
  if (article.data.translationStatus !== 'reviewed') {
    return false;
  }
  const source = englishByTranslationKey.get(article.data.translationKey);
  if (!source) {
    return false;
  }
  // The English source must itself be published before any of its
  // translations: a public translation without a public source would break
  // the reciprocal hreflang cluster and the language switcher.
  if (!isPublishedSourceArticle(source, nowValue)) {
    return false;
  }
  return !isDerivedStale(article, source);
}

function buildEnglishSourceIndex(articles: Article[]): Map<string, Article> {
  const index = new Map<string, Article>();
  for (const article of articles) {
    if (article.data.language === DEFAULT_LOCALE) {
      index.set(article.data.translationKey, article);
    }
  }
  return index;
}

/**
 * All published articles of `language` from `articles`, sorted by
 * `publishedAt` descending.
 *
 * Pure so the publication contract is unit-testable; callers pass the
 * collection entries they already fetched via `getCollection`. This is the
 * single publication filter — never copy draft, status, date, or revision
 * logic into individual pages or feeds.
 *
 * Publication rules, applied explicitly and unconditionally so that
 * unlisted articles never reach a language homepage, an article overview,
 * an RSS feed, a public article page, hreflang, or the language switcher:
 *
 * - English (source) articles: `draft: false`, `translationStatus:
 *   "source"`, `publishedAt` not strictly in the future (equal to `now`
 *   counts as published).
 * - German/Spanish translations: `draft: false`, `translationStatus:
 *   "reviewed"`, `publishedAt` not strictly in the future, and the English
 *   source article (found in the same collection via `translationKey`) is
 *   itself published with the same `sourceRevision`. Stored `stale`,
 *   `generated`, and derived-stale translations are never published.
 */
export function getPublishedArticles(
  articles: Article[],
  language: Locale = DEFAULT_LOCALE,
  now: Date = new Date(),
): Article[] {
  validateArticleCollection(articles);
  const nowValue = now.valueOf();
  const englishByTranslationKey = buildEnglishSourceIndex(articles);
  return articles
    .filter((article) => article.data.language === language)
    .filter((article) =>
      language === DEFAULT_LOCALE
        ? isPublishedSourceArticle(article, nowValue)
        : isPublishedTranslationArticle(article, englishByTranslationKey, nowValue),
    )
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

/**
 * The published language versions of every article, grouped by
 * `translationKey`. Feeds the hreflang clusters and the language switcher
 * on article pages: both render exactly the published versions, so they
 * can never contain a dead link. Unpublished versions are absent from the
 * groups by construction.
 */
export function groupPublishedByTranslationKey(
  articles: Article[],
  now: Date = new Date(),
): Map<string, PublishedLanguageVersions> {
  validateArticleCollection(articles);
  const groups = new Map<string, PublishedLanguageVersions>();
  for (const locale of LOCALES) {
    for (const article of getPublishedArticles(articles, locale, now)) {
      const versions = groups.get(article.data.translationKey) ?? {};
      versions[locale] = article;
      groups.set(article.data.translationKey, versions);
    }
  }
  return groups;
}
