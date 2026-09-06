/**
 * UI strings for the English interface. This file defines the key set:
 * `de.ts` and `es.ts` are annotated as `Record<UiKey, string>`, so a
 * missing or extra key fails `astro check` at compile time. A Vitest
 * parity test additionally enforces key equality at runtime
 * (tests/ui-dictionaries.test.ts).
 */
const en = {
  skipToContent: 'Skip to content',
  mainNavLabel: 'Main navigation',
  navHome: 'Home',
  navArticles: 'Articles',
  navAbout: 'About',
  languagesLabel: 'Available languages',
  homeDescription: 'Articles on building observable, governable data platforms.',
  homeIntro:
    'SpeakDataWith publishes articles on data platform engineering. Every claim is demonstrated with a repository you can run yourself.',
  homeBrowseAll: 'Browse all articles',
  homeLatest: 'Latest articles',
  homeEmpty: 'No articles published yet.',
  articlesHeading: 'Articles',
  articlesDescription: 'All published articles, newest first.',
  readArticle: 'Read article',
  articlesEmpty: 'No articles published yet.',
  publishedLabel: 'Published',
  updatedLabel: 'Updated',
  viewRepository: 'View repository',
  viewRelease: 'View release',
  viewEvidenceReport: 'View evidence report',
  youtubeHint:
    'Selecting play loads this video from YouTube. Until then, no connection to YouTube is made.',
  youtubeFallback: 'Watch this video on YouTube',
  footerArticles: 'Articles',
  footerRss: 'RSS',
  footerImpressum: 'Impressum',
  footerDatenschutz: 'Datenschutz',
} as const;

export type UiKey = keyof typeof en;

/** A complete UI dictionary: exactly the keys of `en`, all strings. */
export type UiDictionary = Record<UiKey, string>;

const enDictionary: UiDictionary = en;

export default enDictionary;
