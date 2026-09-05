import { describe, expect, it } from 'vitest';
import { articleSchema } from '../src/schemas/article';

const VALID_BASE = {
  contentId: 'SDW-001',
  title: 'A title',
  description: 'A description',
  publishedAt: '2026-01-01T00:00:00Z',
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
});
