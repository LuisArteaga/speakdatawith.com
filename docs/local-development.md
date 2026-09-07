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

The site is served at `http://localhost:4321`. Because `astro dev` does
not honor `public/_redirects` (a Cloudflare-specific file), the root `/`
returns a 404 locally — open `http://localhost:4321/en/` directly. Draft
articles are excluded from all views, in dev as well as in production
builds.

## Validate

```bash
npm run validate
```

The full gate, in order: `astro check` (TypeScript strict mode plus Astro
diagnostics), the translation integrity check over the whole article
collection, the production build, and the automated `dist/` leak check.
`astro check` runs exactly once. CI runs the same command on every pull
request. The steps can also be run individually: `npm run check`,
`npm run check:translations`, `npm run build`, `npm run check:dist`.

## Test

```bash
npm test
```

Runs the Vitest unit tests in `tests/`. They cover the pure logic
extracted into `src/utils/` (publication and translation rules, hreflang
and canonical URL construction, localized date formatting, file-name
slugification, YouTube video-ID validation and URL builders, title and
Open Graph metadata construction, navigation), the article frontmatter
schema in `src/schemas/article.ts`, and the UI dictionaries in
`src/i18n/`. CI runs them on every pull request as part of the
`validate-site` workflow.

## Pre-commit hooks

The repository ships a [pre-commit](https://pre-commit.com) configuration
(`.pre-commit-config.yaml`) with three hooks from the
[quality-gates-toolkit](https://github.com/LuisArteaga/quality-gates-toolkit),
pinned to release `v1.3.0`:

| Hook | What it does |
|---|---|
| `secret-scan` | Best-effort secret scan over the staged changes |
| `js-typecheck` | `npm run typecheck` (the full project) |
| `js-test` | `npm test` (the full project) |

The JS hooks invoke the project's npm scripts and run full-project — not
staged-scoped — so they require the dependencies to be installed
(`npm ci`) before the first commit. The `secret-scan` hook environment is
built with Python 3.12 (pinned via `default_language_version` in
`.pre-commit-config.yaml`, because the toolkit package requires Python
≥ 3.12). With [pre-commit](https://pre-commit.com) installed:

```bash
pre-commit install
```

After that, `git commit` runs the hooks on every commit. The full-project JS
hooks make a commit take a little while. To run everything on demand:

```bash
pre-commit run --all-files
```

The same gates run in CI on every pull request (see
[`docs/quality-gates.md`](quality-gates.md)).

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
per-language RSS feeds, the sitemap, the favicon, `robots.txt`, and
optimized images.

## Preview the production build

```bash
npm run preview
```

Serves `dist/` locally so you can check the built site, not the dev server.

## Translate an article

```bash
npm run translate:extract   # English source → segments JSON
npm run translate:apply     # translated segments → target document + report
npm run translate:validate  # invariant check for a source/translation pair
```

The LLM translation step is governed by the versioned skill
`.claude/skills/translate-article/SKILL.md`; the full contract is
documented in [`docs/translation/workflow.md`](translation/workflow.md).
The scripts are deterministic, need no model credentials, and never
publish anything.

## Troubleshooting

- **`/` returns a 404 in dev and preview**: `astro dev` and `astro
  preview` ignore `public/_redirects`, which only the Cloudflare edge
  honors. Open `http://localhost:4321/en/` directly; the root redirect
  works on Cloudflare Pages (see
  [`docs/multilingual-architecture.md`](multilingual-architecture.md)).

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
