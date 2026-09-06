import { describe, expect, it } from 'vitest';
import {
  buildLocalizedNavItems,
  buildNavItems,
  buildRootNavItems,
  isNoindexPagePath,
  isNoindexPageUrl,
  NAV_ITEMS,
  NOINDEX_PAGE_PATHS,
} from '../src/utils/navigation';

describe('buildNavItems', () => {
  it('returns the three nav items with label and href', () => {
    const items = buildNavItems('/');

    expect(items.map((item) => ({ label: item.label, href: item.href }))).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Articles', href: '/articles/' },
      { label: 'About', href: '/about/' },
    ]);
  });

  it('marks the item whose href exactly matches the pathname', () => {
    const items = buildNavItems('/about/');

    expect(items.filter((item) => item.isCurrent).map((item) => item.href)).toEqual(['/about/']);
  });

  it('marks Home on the root pathname', () => {
    const items = buildNavItems('/');

    expect(items.filter((item) => item.isCurrent).map((item) => item.href)).toEqual(['/']);
  });

  it('marks nothing on an article detail page (no section-level semantics)', () => {
    const items = buildNavItems('/articles/foo/');

    expect(items.every((item) => !item.isCurrent)).toBe(true);
  });

  it('marks nothing on an unknown pathname', () => {
    const items = buildNavItems('/404.html');

    expect(items.every((item) => !item.isCurrent)).toBe(true);
  });

  it('does not mark a prefix match as current', () => {
    const items = buildNavItems('/articles');

    expect(items.filter((item) => item.isCurrent)).toEqual([]);
  });

  it('exposes the nav items read-only from NAV_ITEMS', () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual(['/', '/articles/', '/about/']);
  });
});

describe('buildLocalizedNavItems', () => {
  it('points Home and Articles into the language tree and About at the shared page', () => {
    const items = buildLocalizedNavItems('de', '/de/');

    expect(items.map((item) => ({ label: item.label, href: item.href }))).toEqual([
      { label: 'Startseite', href: '/de/' },
      { label: 'Artikel', href: '/de/articles/' },
      { label: 'Über', href: '/about/' },
    ]);
  });

  it('localizes the labels for every language', () => {
    expect(buildLocalizedNavItems('en', '/en/').map((item) => item.label)).toEqual(['Home', 'Articles', 'About']);
    expect(buildLocalizedNavItems('es', '/es/').map((item) => item.label)).toEqual(['Inicio', 'Artículos', 'Acerca de']);
  });

  it('marks the language homepage as current', () => {
    const items = buildLocalizedNavItems('es', '/es/');

    expect(items.filter((item) => item.isCurrent).map((item) => item.href)).toEqual(['/es/']);
  });

  it('marks the language article overview as current', () => {
    const items = buildLocalizedNavItems('en', '/en/articles/');

    expect(items.filter((item) => item.isCurrent).map((item) => item.href)).toEqual(['/en/articles/']);
  });

  it('marks nothing on an article detail page', () => {
    const items = buildLocalizedNavItems('de', '/de/articles/foo/');

    expect(items.every((item) => !item.isCurrent)).toBe(true);
  });
});

describe('buildRootNavItems', () => {
  it('keeps only Home and About, without an Articles link', () => {
    const items = buildRootNavItems('en', '/about/');

    expect(items.map((item) => item.href)).toEqual(['/en/', '/about/']);
    expect(items.some((item) => item.href.includes('articles'))).toBe(false);
  });

  it('localizes the labels for the German legal pages', () => {
    const items = buildRootNavItems('de', '/impressum/');

    expect(items.map((item) => item.label)).toEqual(['Startseite', 'Über']);
  });

  it('points Home at the stable English home, not the redirect stub', () => {
    const items = buildRootNavItems('de', '/datenschutz/');

    expect(items[0]?.href).toBe('/en/');
  });

  it('marks About as current on the about page and nothing on the legal pages', () => {
    const onAbout = buildRootNavItems('en', '/about/');
    const onImpressum = buildRootNavItems('de', '/impressum/');

    expect(onAbout.filter((item) => item.isCurrent).map((item) => item.href)).toEqual(['/about/']);
    expect(onImpressum.every((item) => !item.isCurrent)).toBe(true);
  });
});

describe('isNoindexPagePath', () => {
  it('is true for the impressum and datenschutz placeholder pathnames', () => {
    expect(isNoindexPagePath('/impressum/')).toBe(true);
    expect(isNoindexPagePath('/datenschutz/')).toBe(true);
  });

  it('is false for regular pages and status pages', () => {
    expect(isNoindexPagePath('/')).toBe(false);
    expect(isNoindexPagePath('/about/')).toBe(false);
    expect(isNoindexPagePath('/articles/')).toBe(false);
    expect(isNoindexPagePath('/404.html')).toBe(false);
  });

  it('requires the exact registry path (no prefix or slash-less match)', () => {
    expect(isNoindexPagePath('/impressum')).toBe(false);
    expect(isNoindexPagePath('/impressum/extra/')).toBe(false);
  });
});

describe('isNoindexPageUrl', () => {
  it('is true for the impressum and datenschutz placeholder URLs', () => {
    expect(isNoindexPageUrl('https://speakdatawith.com/impressum/')).toBe(true);
    expect(isNoindexPageUrl('https://speakdatawith.com/datenschutz/')).toBe(true);
  });

  it('is false for regular pages and status pages', () => {
    expect(isNoindexPageUrl('https://speakdatawith.com/')).toBe(false);
    expect(isNoindexPageUrl('https://speakdatawith.com/about/')).toBe(false);
    expect(isNoindexPageUrl('https://speakdatawith.com/articles/')).toBe(false);
    expect(isNoindexPageUrl('https://speakdatawith.com/404.html')).toBe(false);
  });

  it('matches by pathname only, not by origin', () => {
    expect(isNoindexPageUrl('https://preview.example.pages.dev/datenschutz/')).toBe(true);
  });

  it('declares exactly the two placeholder paths', () => {
    expect(NOINDEX_PAGE_PATHS).toEqual(['/impressum/', '/datenschutz/']);
  });
});
