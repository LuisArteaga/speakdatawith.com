import { DEFAULT_LOCALE, getUiDictionary, type Locale } from '../i18n/config';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavItem extends NavLink {
  /** True when `href` exactly equals the current pathname. */
  isCurrent: boolean;
}

export const NAV_ITEMS: ReadonlyArray<NavLink> = [
  { label: 'Home', href: '/' },
  { label: 'Articles', href: '/articles/' },
  { label: 'About', href: '/about/' },
];

/**
 * The header navigation items with `isCurrent` set on the item whose `href`
 * exactly equals `currentPathname`. Exact match only: article detail pages
 * mark nothing (no section-level highlighting), and unknown paths such as
 * the 404 page highlight nothing. `items` defaults to the root
 * `NAV_ITEMS`; the localized builders below pass their own lists.
 */
export function buildNavItems(
  currentPathname: string,
  items: ReadonlyArray<NavLink> = NAV_ITEMS,
): NavItem[] {
  return items.map((item) => ({
    ...item,
    isCurrent: item.href === currentPathname,
  }));
}

/**
 * The navigation on `/<lang>/…` pages: Home and Articles point into the
 * page's language tree, About stays on the shared English page; labels
 * come from the UI dictionaries.
 */
export function buildLocalizedNavItems(
  locale: Locale,
  currentPathname: string,
): NavItem[] {
  const dictionary = getUiDictionary(locale);
  return buildNavItems(currentPathname, [
    { label: dictionary.navHome, href: `/${locale}/` },
    { label: dictionary.navArticles, href: `/${locale}/articles/` },
    { label: dictionary.navAbout, href: '/about/' },
  ]);
}

/**
 * The reduced navigation for the root pages (about, impressum,
 * datenschutz): Home points to the language home (`/en/` — a stable URL
 * per ADR-0002, not the `/` redirect stub) and About to `/about/`. There
 * is deliberately no Articles link: the root `/articles/` route no longer
 * exists and only redirects at the Cloudflare edge. Labels come from the
 * UI dictionaries so the German legal pages get German labels.
 */
export function buildRootNavItems(locale: Locale, currentPathname: string): NavItem[] {
  const dictionary = getUiDictionary(locale);
  return buildNavItems(currentPathname, [
    { label: dictionary.navHome, href: `/${DEFAULT_LOCALE}/` },
    { label: dictionary.navAbout, href: '/about/' },
  ]);
}

/**
 * The single source of truth for the placeholder pages that search engines
 * must not index: `BaseLayout` renders `<meta name="robots"
 * content="noindex">` for exactly these pathnames (`isNoindexPagePath`),
 * and the `filter` option of `@astrojs/sitemap` in `astro.config.mjs` keeps
 * the same pages out of the sitemap (`isNoindexPageUrl`). When a
 * placeholder is replaced with real content, delete its entry here —
 * indexing and sitemap inclusion come back with that one change.
 */
export const NOINDEX_PAGE_PATHS: ReadonlyArray<string> = ['/impressum/', '/datenschutz/'];

/**
 * True when the site pathname is one of the noindex placeholder pages.
 * `pathname` is the site-internal pathname (e.g. `Astro.url.pathname`).
 */
export function isNoindexPagePath(pathname: string): boolean {
  return NOINDEX_PAGE_PATHS.includes(pathname);
}

/**
 * True when the full URL's pathname is one of the noindex placeholder
 * pages. Contract: `url` is an absolute URL (the shape `@astrojs/sitemap`
 * passes to its `filter`).
 */
export function isNoindexPageUrl(url: string): boolean {
  return isNoindexPagePath(new URL(url).pathname);
}
