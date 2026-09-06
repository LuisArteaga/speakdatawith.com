import { describe, expect, it } from 'vitest';
import { slugifyFileName } from '../src/utils/slug';

describe('slugifyFileName', () => {
  it('keeps an already-slugified kebab-case file name', () => {
    expect(slugifyFileName('a-green-dbt-check-is-not-proof')).toBe('a-green-dbt-check-is-not-proof');
  });

  it('strips the file extension', () => {
    expect(slugifyFileName('a-green-dbt-check.md')).toBe('a-green-dbt-check');
    expect(slugifyFileName('a-green-dbt-check.mdx')).toBe('a-green-dbt-check');
  });

  it('lowercases and collapses whitespace and underscores to dashes', () => {
    expect(slugifyFileName('My Article Title')).toBe('my-article-title');
    expect(slugifyFileName('my_article_title')).toBe('my-article-title');
  });

  it('removes characters outside the slug alphabet', () => {
    expect(slugifyFileName('ein-grüner-check')).toBe('ein-grner-check');
  });

  it('trims leading and trailing dashes', () => {
    expect(slugifyFileName('-bordered-')).toBe('bordered');
  });
});
