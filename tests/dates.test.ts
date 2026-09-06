import { describe, expect, it } from 'vitest';
import { formatArticleDate } from '../src/utils/dates';

const DATE = new Date('2026-09-24T12:00:00Z');

describe('formatArticleDate', () => {
  it('formats English dates with the en convention', () => {
    expect(formatArticleDate(DATE, 'en')).toBe('September 24, 2026');
  });

  it('formats German dates with the de-DE convention', () => {
    expect(formatArticleDate(DATE, 'de')).toBe('24. September 2026');
  });

  it('formats Spanish dates with the es convention', () => {
    expect(formatArticleDate(DATE, 'es')).toBe('24 de septiembre de 2026');
  });
});
