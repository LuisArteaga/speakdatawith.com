import { defineConfig } from 'vitest/config';

// Plain Vitest: the unit tests import only pure TypeScript modules
// (src/utils/, src/schemas/article.ts — astro:content appears in
// type-only positions that are erased at runtime, and astro/zod is a
// plain package subpath). No Astro vite plugins are required.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
