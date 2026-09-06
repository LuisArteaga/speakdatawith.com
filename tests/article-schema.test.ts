import { describe, expect, it } from 'vitest';
import { articleSchema } from '../src/schemas/article';

const VALID_BASE = {
  contentId: 'SDW-001',
  title: 'A title',
  description: 'A description',
  publishedAt: '2026-01-01T00:00:00Z',
  language: 'en',
  pillar: ['Generate'],
  audience: ['data engineers'],
  tags: [],
};

describe('articleSchema', () => {
  it('accepts a valid minimal frontmatter object', () => {
    const result = articleSchema.safeParse(VALID_BASE);

    expect(result.success).toBe(true);
  });

  it('rejects a contentId without the SDW-<digits> shape', () => {
    for (const contentId of ['sdw-001', 'SDW-1', 'SDW', 'ART-001', 'SDW-001a']) {
      const result = articleSchema.safeParse({ ...VALID_BASE, contentId });
      expect(result.success).toBe(false);
    }
  });

  it('accepts contentId with four or more digits', () => {
    const result = articleSchema.safeParse({ ...VALID_BASE, contentId: 'SDW-1234' });

    expect(result.success).toBe(true);
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

  it('defaults updatedAt, draft, and optional URLs when absent', () => {
    const result = articleSchema.parse(VALID_BASE);

    expect(result.updatedAt).toBeNull();
    expect(result.draft).toBe(false);
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

  it('accepts en and de as language values', () => {
    for (const language of ['en', 'de']) {
      const result = articleSchema.safeParse({ ...VALID_BASE, language });
      expect(result.success).toBe(true);
    }
  });

  it('rejects a language outside en and de, listing the allowed values', () => {
    const result = articleSchema.safeParse({ ...VALID_BASE, language: 'fr' });

    expect(result.success).toBe(false);
    if (result.success) return;
    const message = result.error.issues[0]?.message ?? '';
    expect(message).toContain('en');
    expect(message).toContain('de');
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
