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
npm run validate
```

The full gate, in order: `astro check` (TypeScript strict mode plus Astro
diagnostics), the production build, and the automated `dist/` leak check.
`astro check` runs exactly once. CI runs the same command on every pull
request. The steps can also be run individually: `npm run check`,
`npm run build`, `npm run check:dist`.

## Test

```bash
npm test
```

Runs the Vitest unit tests in `tests/`. They cover the pure logic extracted
into `src/utils/` (draft filtering and sorting, YouTube video-ID validation,
title and Open Graph metadata construction) and the article frontmatter
schema in `src/schemas/article.ts`. CI runs them on every pull request as
part of the `validate-site` workflow.

## Production build

```bash
npm run build
```

Runs `astro build` (no type check — the full gate is `npm run validate`)
and writes the static output to `dist/`.
The build needs no secrets and no network access.

## Inspect `dist/`

```bash
npm run check:dist
```

Fails when `dist/` contains anything that must not be published: `.env`
files, `.git`/`.github`/`docs` directories, Markdown sources, or source
maps. The check runs as the last step of `npm run validate`, so nothing
leaky passes the gate silently. For a full file listing,
`find dist -type f | sort` still works: it must show only HTML pages, the
RSS feed, the sitemap, the favicon, `robots.txt`, and optimized images.

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
