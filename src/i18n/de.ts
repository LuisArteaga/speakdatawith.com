import type { UiKey } from './en';

/**
 * German UI strings. Annotated as `Record<UiKey, string>` so a missing or
 * extra key fails `astro check` at compile time; the Vitest parity test
 * (tests/ui-dictionaries.test.ts) enforces the same at runtime.
 */
const de: Record<UiKey, string> = {
  skipToContent: 'Zum Inhalt springen',
  mainNavLabel: 'Hauptnavigation',
  navHome: 'Startseite',
  navArticles: 'Artikel',
  navAbout: 'Über',
  languagesLabel: 'Verfügbare Sprachen',
  homeDescription: 'Artikel über den Aufbau beobachtbarer, steuerbarer Datenplattformen.',
  homeIntro:
    'SpeakDataWith veröffentlicht Artikel über Datenplattform-Engineering. Jede Aussage wird mit einem Repository demonstriert, das du selbst ausführen kannst.',
  homeBrowseAll: 'Alle Artikel ansehen',
  homeLatest: 'Neueste Artikel',
  homeEmpty: 'Es wurden noch keine Artikel veröffentlicht.',
  articlesHeading: 'Artikel',
  articlesDescription: 'Alle veröffentlichten Artikel, neueste zuerst.',
  articlesListHeading: 'Alle Artikel',
  readArticle: 'Artikel lesen',
  articlesEmpty: 'Es wurden noch keine Artikel veröffentlicht.',
  publishedLabel: 'Veröffentlicht',
  updatedLabel: 'Aktualisiert',
  viewRepository: 'Repository ansehen',
  viewRelease: 'Release ansehen',
  viewEvidenceReport: 'Evidence-Report ansehen',
  youtubeHint:
    'Durch Auswählen von „Play“ wird dieses Video von YouTube geladen. Bis dahin wird keine Verbindung zu YouTube hergestellt.',
  youtubeFallback: 'Dieses Video auf YouTube ansehen',
  footerArticles: 'Artikel',
  footerRss: 'RSS',
  footerImpressum: 'Impressum',
  footerDatenschutz: 'Datenschutz',
};

export default de;
