import { describe, expect, it } from 'vitest';
import {
  DATE_LOCALES,
  DEFAULT_LOCALE,
  getUiDictionary,
  LANGUAGE_NAMES,
  LOCALES,
} from '../src/i18n/config';
import en from '../src/i18n/en';

describe('LOCALES', () => {
  it('declares exactly the three site languages with English first', () => {
    expect([...LOCALES]).toEqual(['en', 'de', 'es']);
  });

  it('uses English as the default locale', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });
});

describe('UI dictionaries', () => {
  it('exposes a dictionary for every locale', () => {
    for (const locale of LOCALES) {
      expect(getUiDictionary(locale)).toBeTypeOf('object');
    }
  });

  it('has exact key parity between every language and the English key set', () => {
    const englishKeys = Object.keys(en).sort();

    for (const locale of LOCALES) {
      const dictionary = getUiDictionary(locale);
      expect(Object.keys(dictionary).sort()).toEqual(englishKeys);
    }
  });

  it('contains only non-empty strings in every language', () => {
    for (const locale of LOCALES) {
      const dictionary = getUiDictionary(locale);
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value, `${locale}.${key}`).toBeTypeOf('string');
        expect((value as string).length, `${locale}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('differs from English in the localized languages (translations are real)', () => {
    const german = getUiDictionary('de');
    const spanish = getUiDictionary('es');
    const english = getUiDictionary('en');

    const differingDe = Object.keys(english).filter((key) => german[key as keyof typeof english] !== english[key as keyof typeof english]);
    const differingEs = Object.keys(english).filter((key) => spanish[key as keyof typeof english] !== english[key as keyof typeof english]);

    expect(differingDe.length).toBeGreaterThan(0);
    expect(differingEs.length).toBeGreaterThan(0);
  });
});

describe('locale metadata', () => {
  it('covers every locale in DATE_LOCALES and LANGUAGE_NAMES', () => {
    for (const locale of LOCALES) {
      expect(DATE_LOCALES[locale]).toBeTypeOf('string');
      expect(LANGUAGE_NAMES[locale]).toBeTypeOf('string');
    }
  });

  it('formats German dates with the de-DE convention', () => {
    expect(DATE_LOCALES.de).toBe('de-DE');
  });

  it('uses the native language names in the language switcher', () => {
    expect(LANGUAGE_NAMES.en).toBe('English');
    expect(LANGUAGE_NAMES.de).toBe('Deutsch');
    expect(LANGUAGE_NAMES.es).toBe('Español');
  });
});
