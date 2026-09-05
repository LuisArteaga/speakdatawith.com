# Local development

## Prerequisites

- Node.js 22 LTS — the exact line is pinned in `.nvmrc`. With
  [nvm](https://github.com/nvm-sh/nvm) installed, run:

  ```bash
  nvm use
  ```

- npm (ships with Node.js)

## Clone and install

```bash
git clone https://github.com/LuisArteaga/speakdatawith.com.git
cd speakdatawith.com
npm ci
```

## Development server

```bash
npm run dev
```

The site is served at `http://localhost:4321`. Draft articles are excluded
from all views, in dev as well as in production builds.

## Validate

```bash
npm run check
```

Runs `astro check` (TypeScript strict mode plus Astro diagnostics). CI runs
the same command on every pull request.

## Production build

```bash
npm run build
```

Runs `astro check && astro build` and writes the static output to `dist/`.
The build needs no secrets and no network access.

## Inspect `dist/`

```bash
find dist -type f | sort
```

Everything Cloudflare Pages will publish is in that list. Check it before
merging: it must contain only HTML pages, the RSS feed, the sitemap, the
favicon, `robots.txt`, and optimized images. No source maps, no working
files, no draft sources.

## Preview the production build

```bash
npm run preview
```

Serves `dist/` locally so you can check the built site, not the dev server.

## Troubleshooting

- **Build fails with a stale content reference** after articles were
  renamed or deleted: Astro's content layer keeps a persistent cache in
  `node_modules/.astro/`. Remove it and rebuild:

  ```bash
  rm -rf node_modules/.astro dist
  npm run build
  ```

- **Warning about an empty `articles` collection**: expected as long as no
  article exists. The homepage and the article overview render an explicit
  empty state.
