# SpeakDataWith

Static website for SpeakDataWith: articles on building observable,
governable data platforms. Every article demonstrates its claims with a
repository readers can run themselves.

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

The site is then available at `http://localhost:4321`.

## Validation

```bash
npm run check
```

Runs `astro check` (TypeScript and Astro diagnostics in strict mode).

## Production build

```bash
npm run build
```

Runs `astro check && astro build` and writes the static output to `dist/`.
The build requires no secrets and makes no network requests.

To inspect what would be published:

```bash
npm run build
find dist -type f | sort
```

Only the files listed by that command are published. If anything unexpected
appears in `dist/`, it must not be deployed.

## Preview

```bash
npm run preview
```

Serves the production build from `dist/` locally.

## Content

Articles live in `src/content/articles/` as Markdown (`.md`) or, when they
embed components, MDX (`.mdx`). The required frontmatter is documented in
[`docs/content-schema.md`](docs/content-schema.md).

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
