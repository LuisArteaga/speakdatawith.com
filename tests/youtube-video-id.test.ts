import { describe, expect, it } from 'vitest';
import { articleSchema } from '../src/schemas/article';
import { isValidYouTubeVideoId } from '../src/utils/video';

const VALID_BASE = {
  contentId: 'SDW-001',
  title: 'A title',
  description: 'A description',
  publishedAt: '2026-01-01T00:00:00Z',
  pillar: ['Generate'],
  audience: ['data engineers'],
  tags: [],
};

describe('isValidYouTubeVideoId', () => {
  it('accepts an 11-character URL-safe ID', () => {
    expect(isValidYouTubeVideoId('dQw4w9WgXcQ')).toBe(true);
  });

  it('accepts IDs containing dash and underscore', () => {
    expect(isValidYouTubeVideoId('abc_-defghi')).toBe(true);
  });

  it('rejects IDs that are too short or too long', () => {
    expect(isValidYouTubeVideoId('abcdefghij')).toBe(false); // 10 chars
    expect(isValidYouTubeVideoId('abcdefghijk')).toBe(true); // 11 chars
    expect(isValidYouTubeVideoId('abcdefghijkl')).toBe(false); // 12 chars
  });

  it('rejects path separators, whitespace, and empty strings', () => {
    expect(isValidYouTubeVideoId('a/bcdefghij')).toBe(false);
    expect(isValidYouTubeVideoId('abc defghij')).toBe(false);
    expect(isValidYouTubeVideoId('')).toBe(false);
  });

  it('rejects non-ASCII characters', () => {
    expect(isValidYouTubeVideoId('äbcdefghijk')).toBe(false);
  });
});

describe('articleSchema youtubeId rule', () => {
  it('accepts a valid 11-character youtubeId', () => {
    const result = articleSchema.safeParse({
      ...VALID_BASE,
      youtubeId: 'dQw4w9WgXcQ',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a youtubeId that is not exactly 11 URL-safe characters', () => {
    for (const youtubeId of ['abcdefghij', 'abcdefghijkl', 'a/bcdefghij', '']) {
      const result = articleSchema.safeParse({ ...VALID_BASE, youtubeId });
      expect(result.success).toBe(false);
    }
  });

  it('allows youtubeId to stay absent (defaults to null)', () => {
    const result = articleSchema.parse(VALID_BASE);

    expect(result.youtubeId).toBeNull();
  });
});
