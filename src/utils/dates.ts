import { DATE_LOCALES, type Locale } from '../i18n/config';

/**
 * Human-readable date for the given site language, formatted with the
 * language's explicit formatting locale (`en`, `de-DE`, `es` — see
 * `DATE_LOCALES`). Stored dates stay language-independent; only the
 * rendering is localized. Rendered inside `<time datetime="<ISO>">` by the
 * callers, so the machine-readable value is unaffected.
 */
export function formatArticleDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(DATE_LOCALES[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
