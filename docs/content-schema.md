# Content schema

Articles are files in `src/content/articles/`, organized in one directory
per language:

```text
src/content/articles/
├── en/        English source articles
├── de/        German translations
└── es/        Spanish translations
```

- `<slug>.md` for plain Markdown articles,
- `<slug>.mdx` when the article embeds Astro components such as `Figure`
  or `YouTubeFacade` (MDX is required for component embedding; plain `.md`
  renders components as literal text),
- optionally a colocated `<slug>/` folder for article-specific images.

The entry's slug (file name without extension) becomes the public URL:
`/<lang>/articles/<slug>/`. Slugs are independent per language. The
schema is defined in `src/schemas/article.ts` and composed in
`src/content.config.ts`; every frontmatter field is validated at build
time. Rules that span multiple files (translation integrity) are
enforced by `src/utils/articles.ts::validateArticleCollection()` and
fail the build. The multilingual publishing model is documented in
[`docs/multilingual-architecture.md`](multilingual-architecture.md).

## Frontmatter reference

Example of an English source article:

```yaml
contentId: "SDW-001-EN"
translationKey: "SDW-001"
language: "en"
translationOf: null
translationStatus: "source"
sourceRevision: 1
title: "Article title"
description: "Short description"
publishedAt: 2026-09-24
updatedAt: null
draft: true
pillar:
  - Govern
audience:
  - Analytics Engineers
tags:
  - dbt
repositoryUrl: null
releaseUrl: null
evidenceUrl: null
youtubeId: null
```

A German translation of the same article uses
`contentId: "SDW-001-DE"`, `translationKey: "SDW-001"`,
`language: "de"`, `translationOf: "SDW-001-EN"`,
`translationStatus: "reviewed"` (after review), and the
`sourceRevision` of the source it was translated from.

### Article identity and translation fields

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `contentId` | string | yes | Must match `SDW-<digits>-<LANG>` (e.g. `SDW-001-EN`); the language suffix must match the `language` field. Identifies one language version of an article. |
| `translationKey` | string | yes | Must match `SDW-<digits>` (e.g. `SDW-001`). The article's semantic identity, shared by all language versions. The pair (`translationKey`, `language`) must be unique across the collection. |
| `language` | string | yes | Article language, restricted to `en`, `de`, or `es`. Determines the URL prefix (`/en/articles/<slug>/` etc.). |
| `translationOf` | string \| null | yes | `contentId` of the English source version; `null` for English originals. Must name the English article with the same `translationKey`. |
| `translationStatus` | string | yes | One of `source`, `generated`, `reviewed`, `stale` (see below). |
| `sourceRevision` | number | yes | Positive integer. The version counter of the source article this version was translated from; bump it on the source when it is revised so derived staleness can be detected. |

### Content fields

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `title` | string | yes | Non-empty. Used as the page title and in lists, RSS, and metadata. |
| `description` | string | yes | Non-empty. Used in lists, RSS, and meta description. |
| `publishedAt` | date | yes | Publication date, e.g. `2026-09-24`. Drives the sort order (newest first). Articles with a `publishedAt` strictly in the future are not published (see below). |
| `updatedAt` | date \| null | no | Set when an article is meaningfully revised; otherwise `null`. Must not lie before `publishedAt` (equal timestamps are valid); violations fail schema validation. |
| `draft` | boolean | no (default `false`) | Drafts are excluded from all public output (see below). |
| `pillar` | enum list | yes (may be empty) | Values restricted to `Generate`, `Observe`, `Evaluate`, `Govern`. |
| `audience` | string list | yes | Must be non-empty. |
| `tags` | string list | yes (may be empty) | Free-form tags. |
| `repositoryUrl` | URL \| null | no | Must be a valid URL when set. |
| `releaseUrl` | URL \| null | no | Must be a valid URL when set. |
| `evidenceUrl` | URL \| null | no | Must be a valid URL when set. |
| `youtubeId` | string \| null | no | YouTube video ID (11 characters, e.g. `aBcD1234_-9`), not the full URL. Rendered via `YouTubeFacade.astro`. |

## Translation states

`translationStatus` values in publishing order:

- `source` — the English original; only valid with `language: "en"`.
- `generated` — machine-generated translation, not yet reviewed. Never
  published.
- `reviewed` — human-reviewed and current with the source revision
  (`sourceRevision` matches the source's current counter). Publishable
  when all other publication rules hold.
- `stale` — marked stale by an editor, e.g. after a source revision that
  has not been translated yet. Never published, even when the
  `sourceRevision` is bumped afterwards; re-translation flips the status
  back to `reviewed`.

A `reviewed` translation whose `sourceRevision` no longer matches the
source article's is treated as stale by derivation and is also not
published (`src/utils/articles.ts::isDerivedStale()`).

## Publication rules

An article version is published only when it is intentionally released.
It is excluded from all public output when **either** rule applies:

- `draft: true` — the article version is a draft,
- `publishedAt` lies strictly in the future relative to the build time
  (a `publishedAt` exactly at build time counts as published).

Additionally, an English original must carry
`translationStatus: "source"`, and a German or Spanish translation
publishes only when its English source article is itself published and
the translation is `reviewed` and not stale (see above).

Excluded articles

- do not appear in the article overview or on the homepage,
- do not get a public article page,
- do not appear in the RSS feed,
- do not appear in the sitemap,
- do not appear in `hreflang` clusters or the language switcher.

The filtering happens in `src/utils/articles.ts::getPublishedArticles()`;
this is the single publication filter, so no page is generated for an
excluded article and exclusion holds for every consumer of the built
site. Excluded articles are therefore safe to keep on a branch, but they
must never be pushed to a public branch (see
`docs/cloudflare-pages-setup.md`).

## Embedding components (MDX)

For component embedding, use `.mdx` and import the component at the top of
the body, after the frontmatter:

```mdx
import Figure from '../../../components/Figure.astro';

<Figure src={poster} alt="Diagram of the pipeline" caption="Pipeline overview" />
```

Use relative import paths from the article file (which now sits one
directory deeper, `src/content/articles/<lang>/`) to the component.

## Conventions and limitations

- Translation integrity (unique (`translationKey`, `language`) pairs,
  every translation referencing an existing English source, `translationOf`
  pointing at it) is enforced at build time by
  `validateArticleCollection()`, not by the per-file schema.
- Pillar and audience values are validated, but their editorial meaning is
  defined by the article intake process (see the content issue template).
- The collection may be empty; the build succeeds with an explicit
  empty state on the homepages and the article overviews. The build log's
  warning about an empty collection is expected until the first article
  exists.
