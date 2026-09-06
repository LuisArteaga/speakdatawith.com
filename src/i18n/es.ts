import type { UiKey } from './en';

/**
 * Spanish UI strings (neutral professional Spanish). Annotated as
 * `Record<UiKey, string>` so a missing or extra key fails `astro check`
 * at compile time; the Vitest parity test (tests/ui-dictionaries.test.ts)
 * enforces the same at runtime.
 */
const es: Record<UiKey, string> = {
  skipToContent: 'Saltar al contenido',
  mainNavLabel: 'Navegación principal',
  navHome: 'Inicio',
  navArticles: 'Artículos',
  navAbout: 'Acerca de',
  languagesLabel: 'Idiomas disponibles',
  homeDescription: 'Artículos sobre cómo construir plataformas de datos observables y gobernables.',
  homeIntro:
    'SpeakDataWith publica artículos sobre ingeniería de plataformas de datos. Cada afirmación se demuestra con un repositorio que puedes ejecutar tú mismo.',
  homeBrowseAll: 'Ver todos los artículos',
  homeLatest: 'Últimos artículos',
  homeEmpty: 'Aún no se han publicado artículos.',
  articlesHeading: 'Artículos',
  articlesDescription: 'Todos los artículos publicados, del más reciente al más antiguo.',
  readArticle: 'Leer artículo',
  articlesEmpty: 'Aún no se han publicado artículos.',
  publishedLabel: 'Publicado',
  updatedLabel: 'Actualizado',
  viewRepository: 'Ver repositorio',
  viewRelease: 'Ver lanzamiento',
  viewEvidenceReport: 'Ver informe de evidencias',
  youtubeHint:
    'Al seleccionar reproducir, este video se carga desde YouTube. Hasta entonces, no se realiza ninguna conexión con YouTube.',
  youtubeFallback: 'Ver este video en YouTube',
  footerArticles: 'Artículos',
  footerRss: 'RSS',
  footerImpressum: 'Impressum',
  footerDatenschutz: 'Datenschutz',
};

export default es;
