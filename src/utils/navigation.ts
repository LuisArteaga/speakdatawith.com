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
 * the 404 page highlight nothing.
 */
export function buildNavItems(currentPathname: string): NavItem[] {
  return NAV_ITEMS.map((item) => ({
    ...item,
    isCurrent: item.href === currentPathname,
  }));
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
