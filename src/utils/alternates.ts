import { LOCALES, type Locale } from '../i18n/config';
import type { Article, PublishedLanguageVersions } from './articles';

/**
 * One language version a page can link to: the target locale plus the
 * path suffix that follows the locale prefix. The `.astro` layer turns
 * this into the final URL with `getRelativeLocaleUrl(locale, pathSuffix)`
 * (astro:i18n), which respects the configured `prefixDefaultLocale`
 * routing; this module stays pure and unit-testable by only deciding
 * WHICH locales and suffixes to link — publication-driven, so hreflang
 * clusters and the language switcher can never contain a dead link.
 */
export interface LocalePathSuffix {
  locale: Locale;
  pathSuffix: string;
}

/**
 * The path suffix of an article page: `articles/<slug>/` (the slug is
 * per-language, so article alternates cannot be derived by swapping the
 * locale prefix of the current pathname — they must come from the
 * published sibling's own entry).
 */
export function articlePathSuffix(article: Article): string {
  return `articles/${article.id}/`;
}

/**
 * hreflang/switcher targets for a language homepage or an article
 * overview: every site language gets the same page type, so the current
 * locale-prefixed pathname is reused for all locales. The cluster includes
 * the current page itself (reciprocal hreflang clusters list every member,
 * including self).
 *
 * Throws for pathnames that are not locale-prefixed — these helpers are
 * only valid on `/<lang>/…` pages.
 */
export function buildIndexAlternates(pathname: string): LocalePathSuffix[] {
  return LOCALES.map((locale) => ({ locale, pathSuffix: stripLocalePrefix(pathname) }));
}

function stripLocalePrefix(pathname: string): string {
  for (const locale of LOCALES) {
    const prefix = `/${locale}/`;
    if (pathname.startsWith(prefix)) {
      return pathname.slice(prefix.length);
    }
  }
  throw new Error(`Not a locale-prefixed pathname: ${pathname}`);
}

/**
 * hreflang/switcher targets for an article page: exactly the published
 * language versions of the article's translation key, each linked via its
 * own slug. `versions` is the article's entry from
 * `groupPublishedByTranslationKey()`; `undefined` degrades to the article
 * alone (its own published version).
 */
export function buildArticleAlternates(
  article: Article,
  versions?: PublishedLanguageVersions,
): LocalePathSuffix[] {
  const resolved: PublishedLanguageVersions = versions ?? {
    [article.data.language]: article,
  };
  return LOCALES.filter((locale) => resolved[locale] !== undefined).map((locale) => ({
    locale,
    pathSuffix: articlePathSuffix(resolved[locale]!),
  }));
}
