import { describe, expect, it } from 'vitest';
import {
  buildNavItems,
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
