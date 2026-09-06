# Multilingual architecture

The site is published in three languages: English, German, and Spanish.
English is the source of truth; German and Spanish translations derive
from it under deterministic rules. The design decisions are recorded in
[`docs/adr/0001-english-source-of-truth-with-deterministic-translation-governance.md`](adr/0001-english-source-of-truth-with-deterministic-translation-governance.md)
and [`docs/adr/0002-static-language-routing-with-stable-urls.md`](adr/0002-static-language-routing-with-stable-urls.md).

## URL structure

Every language lives under a URL prefix; the English default locale is
prefixed like the others (`routing: { prefixDefaultLocale: true }` in
`astro.config.mjs`):

| Page | English | German | Spanish |
| --- | --- | --- | --- |
| Homepage | `/en/` | `/de/` | `/es/` |
| Article overview | `/en/articles/` | `/de/articles/` | `/es/articles/` |
| Article page | `/en/articles/<slug>/` | `/de/articles/<slug>/` | `/es/articles/<slug>/` |
| RSS feed | `/en/rss.xml` | `/de/rss.xml` | `/es/rss.xml` |

Slugs are independent per language: `src/content/articles/en/my-post.md`
and `src/content/articles/de/mein-beitrag.md` produce
`/en/articles/my-post/` and `/de/articles/mein-beitrag/` and belong to
the same article (`translationKey: SDW-001` in both frontmatters).

The legacy root URLs redirect at the Cloudflare edge (301, via
`public/_redirects`):

- `/` → `/en/`
- `/articles/*` → `/en/articles/:splat`
- `/rss.xml` → `/en/rss.xml`

The root-adjacent pages keep their URLs: `/about/` (English) and the
legal placeholders `/impressum/` and `/datenschutz/` (German) are not
duplicated per language. They use a reduced navigation without the
Articles link (which would point to the English overview from a German
page) and are excluded from the localized navigation.

**Local development limitation:** `astro dev` and `astro preview` do not
honor `public/_redirects` (a Cloudflare-specific file), so `/` returns a
404 locally. Open `http://localhost:4321/en/` directly, or test the
redirects on a Cloudflare Pages preview deployment.

## Language routing

There is **no automatic language negotiation** (no `Accept-Language`
header or geo-IP redirects). Language routing is static and stable:
search engines pick the right version per user via `hreflang`, and every
URL serves the same language regardless of client. `hreflang` clusters
are emitted without `x-default` because there is no language-selector or
geolocation page that it would need to point to — `/` is a redirect stub.
The root redirect to `/en/` is a fixed default for direct visitors, not
language detection.

## Content collection layout

Articles are flat files per language directory:

```text
src/content/articles/
├── en/
│   ├── my-post.md
│   └── component-heavy-post.mdx
├── de/
│   └── mein-beitrag.md
└── es/
    └── mi-articulo.md
```

A custom `generateId` in `src/content.config.ts` strips the language
directory from the entry ID and rejects files outside the three locale
directories, so the language prefix can never leak into URLs and
unrecognized directories fail the build instead of producing stray
entries.

## Translation identity

An article is identified by two fields:

| Field | Format | Meaning |
| --- | --- | --- |
| `translationKey` | `SDW-<digits>`, e.g. `SDW-001` | The article's semantic identity, shared by all its language versions |
| `contentId` | `SDW-<digits>-<LANG>`, e.g. `SDW-001-EN` | The identity of one language version; the suffix must match the `language` field |

Additional translation fields:

| Field | Rules |
| --- | --- |
| `language` | `en`, `de`, or `es` |
| `translationOf` | `contentId` of the English source version; `null` for English originals |
| `translationStatus` | `source`, `generated`, `reviewed`, or `stale` (see below) |
| `sourceRevision` | Positive integer; the version counter of the source article this version was translated from |

Cross-entry integrity is enforced by
`src/utils/articles.ts::validateArticleCollection()`, which every public
entry point calls first, so an invalid collection fails the build no
matter which page or feed renders first:

- the pair (`translationKey`, `language`) is unique across the
  collection,
- every translation's `translationKey` has an English source article,
- every translation's `translationOf` names exactly that source's
  `contentId`.

## Translation states and publication

`translationStatus` has four values:

- `source` — the English original (only valid with `language: en`),
- `generated` — machine-generated, not yet reviewed,
- `reviewed` — human-reviewed and current with the source revision,
- `stale` — marked stale by an editor, e.g. after a source revision that
  was not yet translated.

The stored status `stale` is the editor's explicit flag. A translation
can also become stale **by derivation**: it is `reviewed` but its
`sourceRevision` no longer matches the source article's current
`sourceRevision` (`src/utils/articles.ts::isDerivedStale()`). Both kinds
are excluded from publication; the derived form resolves automatically
once `sourceRevision` is bumped after re-translation. CI enforcement of
the derived-stale state is planned in a follow-up issue.

An article version is published only when **all** of the following hold
(the single publication filter is
`src/utils/articles.ts::getPublishedArticles()`):

- **English originals:** `draft: false`, `translationStatus: "source"`,
  and `publishedAt` not strictly in the future.
- **German/Spanish translations:** `draft: false`,
  `translationStatus: "reviewed"` (neither `generated` nor `stale` nor
  derived-stale), `publishedAt` not strictly in the future, and the
  English source article is itself published under the same
  `sourceRevision`.

The rule that a translation publishes only after its source keeps every
`hreflang` cluster reciprocal and every language-switcher link live: a
translation can never be reachable while its source is not.

## Canonical URLs and hreflang

Every localized page emits a canonical link and an `hreflang` cluster
covering exactly the **published** versions of the article, including
self; the clusters are reciprocal by construction because they are built
from one grouping (`groupPublishedByTranslationKey()`). There is no
`x-default` entry (see above). Pure helpers in
`src/utils/alternates.ts` compute locales and path suffixes; final URLs
are joined with `getRelativeLocaleUrl()` from Astro's i18n helpers so the
URL structure has exactly one source of truth.

## Missing-translation behavior

A language version that is not published (draft, generated, stale,
future-dated, or simply absent) is not rendered anywhere: no article
page, no listing entry, no RSS item, no sitemap entry, no `hreflang`
alternate, no language-switcher link. Readers never hit a dead link to
an unpublished version; the language switcher simply offers fewer
languages.

## Localized chrome

- UI strings live in `src/i18n/`: `en.ts` defines the key set, `de.ts`
  and `es.ts` are typed `Record<UiKey, string>`, so a missing key fails
  `astro check` and a parity test in `tests/ui-dictionaries.test.ts`
  guards the dictionaries.
- Dates are formatted per locale via `src/utils/dates.ts`
  (`formatArticleDate`), e.g. `January 15, 2026` / `1. Februar 2026` /
  `15 de enero de 2026`.
- `YouTubeFacade` and `RepositoryCTA` render locale-aware strings;
  `Figure` needs no locale because its alt and caption text are article
  content.
- The language switcher renders only on localized pages (it is hidden on
  the root-adjacent pages, whose language is fixed).
- RSS feeds are per language (`/<lang>/rss.xml`) with the matching
  `<language>` tag; each localized page autodiscovers its own feed.
