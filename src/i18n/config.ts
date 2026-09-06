import de from './de';
import en from './en';
import es from './es';
import type { UiDictionary } from './en';

/**
 * Single source of truth for the site's languages. `astro.config.mjs`
 * imports `LOCALES` for its i18n configuration, and the article schema
 * derives its `language` enum from the same list, so the schema and the
 * routing configuration can never drift apart.
 */
export const LOCALES = ['en', 'de', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Explicit date-formatting locales per site language. The site languages
 * are deliberately generic (`en`, `de`, `es` — see ADR-0002); only date
 * formatting pins a concrete region.
 */
export const DATE_LOCALES: Record<Locale, string> = {
  en: 'en',
  de: 'de-DE',
  es: 'es',
};

/**
 * Native language names for the language switcher. They are identical in
 * every UI language (each version links to its target in the target's own
 * name), so they live here rather than in the UI dictionaries.
 */
export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
};

const UI_DICTIONARIES: Record<Locale, UiDictionary> = { en, de, es };

/** The complete UI dictionary for `locale`. */
export function getUiDictionary(locale: Locale): UiDictionary {
  return UI_DICTIONARIES[locale];
}
