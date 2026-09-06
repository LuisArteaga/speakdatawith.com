// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { isNoindexPageUrl } from './src/utils/navigation';
import { LOCALES } from './src/i18n/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://speakdatawith.com',
  output: 'static',
  trailingSlash: 'always',
  // In static output this config changes no routing behavior and never
  // redirects automatically (see ADR-0002); it activates the astro:i18n
  // helpers used by the language switcher and hreflang rendering. The
  // locale list comes from the typed single source of truth.
  i18n: {
    locales: [...LOCALES],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true },
  },
  integrations: [
    mdx(),
    // noindex placeholder pages stay out of the sitemap (no contradictory
    // indexing signals); the sitemap integration already excludes 404/500.
    // Unpublished articles produce no pages at all, so they are excluded
    // from the sitemap automatically.
    sitemap({ filter: (page) => !isNoindexPageUrl(page) }),
  ],
});
