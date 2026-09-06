// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { isNoindexPageUrl } from './src/utils/navigation';

// https://astro.build/config
export default defineConfig({
  site: 'https://speakdatawith.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    // noindex placeholder pages stay out of the sitemap (no contradictory
    // indexing signals); the sitemap integration already excludes 404/500.
    sitemap({ filter: (page) => !isNoindexPageUrl(page) }),
  ],
});
