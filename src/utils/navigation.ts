export interface NavItem {
  label: string;
  href: string;
  /** True when `href` exactly equals the current pathname. */
  isCurrent: boolean;
}

export interface NavLink {
  label: string;
  href: string;
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
 * Paths of the placeholder pages that carry `<meta name="robots"
 * content="noindex">` and must therefore also stay out of the sitemap (the
 * `filter` option of `@astrojs/sitemap` in `astro.config.mjs` consumes
 * `isNoindexPageUrl`). When a placeholder is replaced with real content,
 * remove its `noindex` prop and delete its entry here.
 */
export const NOINDEX_PAGE_PATHS: ReadonlyArray<string> = ['/impressum/', '/datenschutz/'];

/**
 * True when the full URL's pathname is one of the noindex placeholder
 * pages. Contract: `url` is an absolute URL (the shape `@astrojs/sitemap`
 * passes to its `filter`).
 */
export function isNoindexPageUrl(url: string): boolean {
  return NOINDEX_PAGE_PATHS.includes(new URL(url).pathname);
}
