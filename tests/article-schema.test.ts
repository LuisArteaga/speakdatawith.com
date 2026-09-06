import { describe, expect, it } from 'vitest';
import { articleSchema } from '../src/schemas/article';

/** A valid English source article. */
const VALID_BASE = {
  contentId: 'SDW-001-EN',
  translationKey: 'SDW-001',
  language: 'en',
  translationOf: null,
  translationStatus: 'source',
  sourceRevision: 1,
  title: 'A title',
  description: 'A description',
  publishedAt: '2026-01-01T00:00:00Z',
  pillar: ['Generate'],
  audience: ['data engineers'],
  tags: [],
};

/** A valid German translation of SDW-001. */
const VALID_TRANSLATION = {
  ...VALID_BASE,
  contentId: 'SDW-001-DE',
  language: 'de',
  translationOf: 'SDW-001-EN',
  translationStatus: 'reviewed',
};

describe('articleSchema', () => {
  it('accepts a valid minimal English source frontmatter object', () => {
    const result = articleSchema.safeParse(VALID_BASE);

    expect(result.success).toBe(true);
  });

  it('accepts a valid German translation frontmatter object', () => {
    const result = articleSchema.safeParse(VALID_TRANSLATION);

    expect(result.success).toBe(true);
  });

  it('accepts a Spanish translation (neutral es, not es-ES)', () => {
    const result = articleSchema.safeParse({
      ...VALID_TRANSLATION,
      contentId: 'SDW-001-ES',
      language: 'es',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a contentId without the per-language SDW-<digits>-<LANG> shape', () => {
    for (const contentId of ['SDW-001', 'sdw-001-en', 'SDW-1-EN', 'SDW', 'ART-001-EN', 'SDW-001-en']) {
      const result = articleSchema.safeParse({ ...VALID_BASE, contentId });
      expect(result.success).toBe(false);
    }
  });

  it('accepts a contentId with four or more digits', () => {
    const result = articleSchema.safeParse({ ...VALID_BASE, contentId: 'SDW-1234-EN' });

    expect(result.success).toBe(true);
  });

  it('rejects a contentId whose language suffix does not match the language field', () => {
    const result = articleSchema.safeParse({
      ...VALID_TRANSLATION,
      contentId: 'SDW-001-EN',
      language: 'de',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toContain('contentId');
  });

  it('rejects a translationKey without the SDW-<digits> shape', () => {
    for (const translationKey of ['SDW-001-EN', 'sdw-001', 'SDW-1', 'ART-001']) {
      const result = articleSchema.safeParse({ ...VALID_BASE, translationKey });
      expect(result.success).toBe(false);
    }
  });

  it('rejects a translationStatus outside the four-state lifecycle', () => {
    for (const translationStatus of ['draft', 'approved', 'SOURCE', '']) {
      const result = articleSchema.safeParse({ ...VALID_BASE, translationStatus });
      expect(result.success).toBe(false);
    }
  });

  it('requires translationStatus and sourceRevision', () => {
    const { translationStatus: _s, sourceRevision: _r, ...withoutLifecycle } = VALID_BASE;

    expect(articleSchema.safeParse(withoutLifecycle).success).toBe(false);
  });

  it('rejects a sourceRevision that is not a positive integer', () => {
    for (const sourceRevision of [0, -1, 1.5, '1']) {
      const result = articleSchema.safeParse({ ...VALID_BASE, sourceRevision });
      expect(result.success).toBe(false);
    }
  });

  it('requires translationOf to be null for English source articles', () => {
    const result = articleSchema.safeParse({
      ...VALID_BASE,
      translationOf: 'SDW-001-EN',
    });

    expect(result.success).toBe(false);
  });

  it('requires translationStatus "source" for English source articles', () => {
    const result = articleSchema.safeParse({
      ...VALID_BASE,
      translationStatus: 'reviewed',
    });

    expect(result.success).toBe(false);
  });

  it('requires translationOf to be set for translations', () => {
    const result = articleSchema.safeParse({
      ...VALID_TRANSLATION,
      translationOf: null,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toContain('translationOf');
  });

  it('rejects translationStatus "source" for translations', () => {
    const result = articleSchema.safeParse({
      ...VALID_TRANSLATION,
      translationStatus: 'source',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid pillar value', () => {
    const result = articleSchema.safeParse({
      ...VALID_BASE,
      pillar: ['Transmute'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty audience array', () => {
    const result = articleSchema.safeParse({ ...VALID_BASE, audience: [] });

    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    const result = articleSchema.safeParse({ ...VALID_BASE, title: '' });

    expect(result.success).toBe(false);
  });

  it('coerces publishedAt strings to Date', () => {
    const result = articleSchema.parse(VALID_BASE);

    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it('defaults updatedAt, draft, translationOf, and optional URLs when absent', () => {
    const result = articleSchema.parse(VALID_BASE);

    expect(result.updatedAt).toBeNull();
    expect(result.draft).toBe(false);
    expect(result.translationOf).toBeNull();
    expect(result.repositoryUrl).toBeNull();
    expect(result.releaseUrl).toBeNull();
    expect(result.evidenceUrl).toBeNull();
    expect(result.youtubeId).toBeNull();
  });

  it('rejects non-URL values for repositoryUrl', () => {
    const result = articleSchema.safeParse({
      ...VALID_BASE,
      repositoryUrl: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('requires the language field', () => {
    const { language: _omitted, ...withoutLanguage } = VALID_BASE;

    const result = articleSchema.safeParse(withoutLanguage);

    expect(result.success).toBe(false);
  });

  it('accepts en, de, and es as language values', () => {
    for (const [language, contentId] of [['en', 'SDW-001-EN'], ['de', 'SDW-001-DE'], ['es', 'SDW-001-ES']]) {
      const result = articleSchema.safeParse({
        ...VALID_BASE,
        language,
        contentId,
        ...(language === 'en' ? {} : { translationOf: 'SDW-001-EN', translationStatus: 'reviewed' }),
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects a language outside en, de, and es', () => {
    const result = articleSchema.safeParse({ ...VALID_BASE, language: 'fr' });

    expect(result.success).toBe(false);
  });

  it('accepts updatedAt equal to publishedAt', () => {
    const result = articleSchema.safeParse({
      ...VALID_BASE,
      updatedAt: '2026-01-01T00:00:00Z',
    });

    expect(result.success).toBe(true);
  });

  it('accepts updatedAt after publishedAt', () => {
    const result = articleSchema.safeParse({
      ...VALID_BASE,
      updatedAt: '2026-01-02T00:00:00Z',
    });

    expect(result.success).toBe(true);
  });

  it('accepts an explicit null updatedAt', () => {
    const result = articleSchema.safeParse({ ...VALID_BASE, updatedAt: null });

    expect(result.success).toBe(true);
  });

  it('rejects updatedAt before publishedAt even by one second', () => {
    const result = articleSchema.safeParse({
      ...VALID_BASE,
      publishedAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-01T23:59:59Z',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toContain('updatedAt');
  });
});
