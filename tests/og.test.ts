import { describe, expect, it } from 'vitest';
import { buildOgMetadata, buildPageTitle } from '../src/utils/og';

describe('buildPageTitle', () => {
  it('appends the site name for regular pages', () => {
    expect(buildPageTitle('About')).toBe('About · SpeakDataWith');
  });

  it('keeps the bare site name as-is', () => {
    expect(buildPageTitle('SpeakDataWith')).toBe('SpeakDataWith');
  });
});

describe('buildOgMetadata', () => {
  const BASE_INPUT = {
    pageTitle: 'About · SpeakDataWith',
    description: 'About the site.',
    ogType: 'website' as const,
    canonicalUrl: 'https://speakdatawith.com/about/',
  };

  it('contains the five base Open Graph tags', () => {
    const metadata = buildOgMetadata(BASE_INPUT);

    expect(metadata).toEqual({
      'og:title': 'About · SpeakDataWith',
      'og:description': 'About the site.',
      'og:type': 'website',
      'og:url': 'https://speakdatawith.com/about/',
      'og:site_name': 'SpeakDataWith',
    });
  });

  it('adds an ISO 8601 published time when provided', () => {
    const metadata = buildOgMetadata({
      ...BASE_INPUT,
      ogType: 'article',
      publishedTime: new Date('2026-01-01T12:00:00Z'),
    });

    expect(metadata['article:published_time']).toBe('2026-01-01T12:00:00.000Z');
    expect(metadata).not.toHaveProperty('article:modified_time');
  });

  it('adds an ISO 8601 modified time when provided', () => {
    const metadata = buildOgMetadata({
      ...BASE_INPUT,
      ogType: 'article',
      modifiedTime: new Date('2026-02-01T12:00:00Z'),
    });

    expect(metadata['article:modified_time']).toBe('2026-02-01T12:00:00.000Z');
    expect(metadata).not.toHaveProperty('article:published_time');
  });

  it('omits timestamp tags entirely when no dates are provided', () => {
    const metadata = buildOgMetadata(BASE_INPUT);

    expect(metadata).not.toHaveProperty('article:published_time');
    expect(metadata).not.toHaveProperty('article:modified_time');
  });
});
