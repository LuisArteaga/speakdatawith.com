import { describe, expect, it } from 'vitest';
import {
  buildYouTubeEmbedAttributes,
  buildYouTubeEmbedUrl,
  buildYouTubeWatchUrl,
} from '../src/utils/video';

const VALID_ID = 'dQw4w9WgXcQ';

const MALFORMED_IDS = [
  '',
  'abcdefghij', // 10 chars
  'abcdefghijkl', // 12 chars
  'a/bcdefghij', // path separator
  'abc defghij', // whitespace
  'äbcdefghijk', // non-ASCII
];

describe('buildYouTubeEmbedUrl', () => {
  it('builds the youtube-nocookie embed URL with autoplay and related videos off', () => {
    expect(buildYouTubeEmbedUrl(VALID_ID)).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0'
    );
  });

  it('rejects malformed video IDs', () => {
    for (const videoId of MALFORMED_IDS) {
      expect(() => buildYouTubeEmbedUrl(videoId)).toThrow();
    }
  });
});

describe('buildYouTubeWatchUrl', () => {
  it('builds the regular youtube.com watch URL for the fallback link', () => {
    expect(buildYouTubeWatchUrl(VALID_ID)).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
  });

  it('rejects malformed video IDs', () => {
    for (const videoId of MALFORMED_IDS) {
      expect(() => buildYouTubeWatchUrl(videoId)).toThrow();
    }
  });
});

describe('buildYouTubeEmbedAttributes', () => {
  it('returns the hardened iframe attribute set', () => {
    expect(buildYouTubeEmbedAttributes(VALID_ID, 'A talk about data')).toEqual({
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
      title: 'A talk about data',
      allow:
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      allowFullscreen: true,
      loading: 'lazy',
      referrerPolicy: 'strict-origin-when-cross-origin',
    });
  });

  it('rejects malformed video IDs before any URL is assembled', () => {
    for (const videoId of MALFORMED_IDS) {
      expect(() => buildYouTubeEmbedAttributes(videoId, 'A talk about data')).toThrow();
    }
  });
});
