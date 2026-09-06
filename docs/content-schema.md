# Content schema

Articles are files in `src/content/articles/`:

- `<slug>.md` for plain Markdown articles,
- `<slug>.mdx` when the article embeds Astro components such as `Figure`
  or `YouTubeFacade` (MDX is required for component embedding; plain `.md`
  renders components as literal text),
- optionally a colocated `<slug>/` folder for article-specific images.

The entry's slug (file name without extension) becomes the public URL:
`/articles/<slug>/`. The schema is defined in `src/content.config.ts`; every
frontmatter field is validated at build time.

## Frontmatter reference

```yaml
contentId: "SDW-001"
title: "Article title"
description: "Short description"
publishedAt: 2026-09-24
updatedAt: null
draft: true
language: "en"
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

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `contentId` | string | yes | Must match `SDW-` followed by digits, e.g. `SDW-001`. Identifies the article independently of its slug. |
| `title` | string | yes | Non-empty. Used as the page title and in lists, RSS, and metadata. |
| `description` | string | yes | Non-empty. Used in lists, RSS, and meta description. |
| `publishedAt` | date | yes | Publication date, e.g. `2026-09-24`. Drives the sort order (newest first). Articles with a `publishedAt` strictly in the future are not published (see below). |
| `updatedAt` | date \| null | no | Set when an article is meaningfully revised; otherwise `null`. Must not lie before `publishedAt` (equal timestamps are valid); violations fail schema validation. |
| `draft` | boolean | no (default `false`) | Drafts are excluded from all public output (see below). |
| `language` | string | yes | Article language, restricted to `en` or `de`. Metadata only — the RSS feed keeps its site-level `<language>en</language>` tag, and there is no i18n routing. |
| `pillar` | enum list | yes (may be empty) | Values restricted to `Generate`, `Observe`, `Evaluate`, `Govern`. |
| `audience` | string list | yes | Must be non-empty. |
| `tags` | string list | yes (may be empty) | Free-form tags. |
| `repositoryUrl` | URL \| null | no | Must be a valid URL when set. |
| `releaseUrl` | URL \| null | no | Must be a valid URL when set. |
| `evidenceUrl` | URL \| null | no | Must be a valid URL when set. |
| `youtubeId` | string \| null | no | YouTube video ID (11 characters, e.g. `aBcD1234_-9`), not the full URL. Rendered via `YouTubeFacade.astro`. |

## Publication rules

An article is published only when it is intentionally released. It is
excluded from all public output when **either** rule applies:

- `draft: true` — the article is a draft,
- `publishedAt` lies strictly in the future relative to the build time
  (a `publishedAt` exactly at build time counts as published).

Excluded articles

- do not appear in the article overview or on the homepage,
- do not get a public article page,
- do not appear in the RSS feed,
- do not appear in the sitemap.

The filtering happens in `src/utils/articles.ts::getPublishedArticles()`;
this is the single publication filter, so no page is generated for an
excluded article and exclusion holds for every consumer of the built site.
Excluded articles are therefore safe to keep on a branch, but they must
never be pushed to a public branch (see `docs/cloudflare-pages-setup.md`).

## Embedding components (MDX)

For component embedding, use `.mdx` and import the component at the top of
the body, after the frontmatter:

```mdx
import Figure from '../../components/Figure.astro';

<Figure src={poster} alt="Diagram of the pipeline" caption="Pipeline overview" />
```

Use relative import paths from the article file to the component.

## Conventions and limitations

- `contentId` uniqueness across articles is a convention enforced by
  authors, not by the schema; the schema validates the format only.
- Pillar and audience values are validated, but their editorial meaning is
  defined by the article intake process (see the content issue template).
- The collection may be empty; the build succeeds with an explicit
  empty state on the homepage and the article overview. The build log's
  warning about an empty collection is expected until the first article
  exists.
