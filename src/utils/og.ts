export const SITE_NAME = 'SpeakDataWith';

/**
 * The `<title>` text for a page: the bare site name on the homepage,
 * otherwise `Page Title · SpeakDataWith`.
 */
export function buildPageTitle(title: string): string {
  return title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
}

export interface OgMetadataInput {
  pageTitle: string;
  description: string;
  ogType: 'website' | 'article';
  /** Absolute canonical URL of the page. */
  canonicalUrl: string;
  publishedTime?: Date;
  modifiedTime?: Date;
}

/**
 * The Open Graph meta tags for a page. Optional timestamps become ISO
 * 8601 `article:*` tags; absent timestamps produce no tag at all (no
 * empty `content` attributes).
 */
export function buildOgMetadata(input: OgMetadataInput): Record<string, string> {
  const metadata: Record<string, string> = {
    'og:title': input.pageTitle,
    'og:description': input.description,
    'og:type': input.ogType,
    'og:url': input.canonicalUrl,
    'og:site_name': SITE_NAME,
  };

  if (input.publishedTime) {
    metadata['article:published_time'] = input.publishedTime.toISOString();
  }

  if (input.modifiedTime) {
    metadata['article:modified_time'] = input.modifiedTime.toISOString();
  }

  return metadata;
}
