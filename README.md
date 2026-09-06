# SpeakDataWith

Static website for SpeakDataWith: articles on building observable,
governable data platforms. Every article demonstrates its claims with a
repository readers can run themselves. Articles are published in English,
German, and Spanish, with English as the source of truth.

The site is built with [Astro](https://astro.build) and deployed on
Cloudflare Pages. It has no CMS, no database, and no server-side runtime.

## Architecture

- **Astro** (static output) with **TypeScript** in strict mode
- **Content Collections** for articles, with Markdown as the default format
  and MDX only for articles that embed components
- Local images processed and optimized by Astro's asset pipeline
- YouTube videos only via a privacy-conscious click-to-load facade
- No UI framework, no Tailwind, no client-side JavaScript libraries, no
  external fonts, no third-party analytics

Detailed documentation lives in [`docs/`](docs/):

| Document | Contents |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Architecture and technology decisions |
| [`docs/content-schema.md`](docs/content-schema.md) | Article frontmatter schema |
| [`docs/multilingual-architecture.md`](docs/multilingual-architecture.md) | Multilingual publishing model (EN/DE/ES) |
| [`docs/image-guidelines.md`](docs/image-guidelines.md) | Image formats, sizes, and handling |
| [`docs/local-development.md`](docs/local-development.md) | Local development guide |
| [`docs/github-repository-settings.md`](docs/github-repository-settings.md) | Manual GitHub repository settings |
| [`docs/cloudflare-pages-setup.md`](docs/cloudflare-pages-setup.md) | Manual Cloudflare Pages setup |

## Prerequisites

- Node.js 22 LTS (see `.nvmrc`; 22.19 or newer is recommended)
- npm (ships with Node.js)

## Local setup

```bash
npm ci
```

## Development server

```bash
npm run dev
```

The site is then available at `http://localhost:4321/en/` (the root `/`
redirects to it on Cloudflare Pages; `astro dev` and `astro preview` do
not honor `public/_redirects`).

## Validation

```bash
npm run validate
```

The full validation gate, in order: `astro check` (TypeScript and Astro
diagnostics in strict mode), the translation integrity check over the
whole article collection, the production build, and the automated
`dist/` leak check. CI runs these steps in that order on every pull
request.

Individual steps for targeted runs:

- `npm run check` — `astro check` only
- `npm run check:translations` — deterministic integrity check over the
  article collection (identity contract, staleness, structural
  invariants; see [`docs/translation/workflow.md`](docs/translation/workflow.md))
- `npm run build` — production build only (no type check)
- `npm run check:dist` — `dist/` leak check only

## Production build

```bash
npm run build
```

Runs `astro build` and writes the static output to `dist/`.
The build requires no secrets and makes no network requests.

The leak check verifies what would be published:

```bash
npm run check:dist
```

It fails when `dist/` contains anything that must not go public: `.env`
files, `.git`/`.github`/`docs` directories, Markdown sources (`.md`/`.mdx`),
or source maps (`.map`). For a full file listing you can still run
`find dist -type f | sort`.

## Preview

```bash
npm run preview
```

Serves the production build from `dist/` locally.

## Content

Articles live in `src/content/articles/` as Markdown (`.md`) or, when they
embed components, MDX (`.mdx`), in one directory per language
(`en/`, `de/`, `es/`). English is the source of truth; German and Spanish
translations publish only after their source and a human review. The
required frontmatter and the translation rules are documented in
[`docs/content-schema.md`](docs/content-schema.md) and
[`docs/multilingual-architecture.md`](docs/multilingual-architecture.md).

## Images

- `src/assets/brand/` for logo and brand material
- `src/assets/images/` and colocated `src/content/articles/<slug>/` folders
  for article images (optimized by Astro's asset pipeline)
- `public/` only for assets served verbatim under a stable URL

See [`docs/image-guidelines.md`](docs/image-guidelines.md).

## Deployment

The site is deployed on Cloudflare Pages; the manual one-time setup is
documented in
[`docs/cloudflare-pages-setup.md`](docs/cloudflare-pages-setup.md).

## License

Copyright © 2026 SpeakDataWith. All rights reserved. This repository is
publicly visible, but it is not open source; see [`LICENSE.md`](LICENSE.md)
and `package.json` (`"license": "UNLICENSED"`).
