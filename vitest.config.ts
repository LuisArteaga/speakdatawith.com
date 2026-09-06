import { getViteConfig } from 'astro/config';

// Astro's getViteConfig wires Astro's Vite plugins into Vitest, which is
// required to compile and render .astro component files in tests (Container
// API). Its types come from Astro's own vite instance, so vitest's `test`
// key needs a cast here; at runtime vitest reads the key normally.
const test = {
  environment: 'node',
  include: ['tests/**/*.test.ts'],
};

export default getViteConfig({ test } as Parameters<typeof getViteConfig>[0]);
