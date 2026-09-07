# Handoff into the content pipeline

Router reference for the transition from the editorial lifecycle into the
content pipeline: the approved draft becomes a `draft: true` English source
article through the standard pull-request flow. The binding contract is
`docs/editorial/workflow.md` ("Handoff into the content pipeline"); the
frontmatter template lives in `templates/article-frontmatter.md`. There is
no script for this step — the handoff is guided and reviewed like any other
repository change.

## Preconditions

Both must hold before the handoff starts — closing the drafting gate is
your decision, never the session's:

- every drafting-gate checkbox in the article's `[CONTENT]` issue is
  confirmed by you,
- the claims audit is complete and passed
  (`content-work/<ID>/claims-audit.md`).

The audit's privacy confirmations are what make the draft prose safe for a
repository branch: pull-request previews are built for every branch and are
publicly reachable (`docs/cloudflare-pages-setup.md`).

## Step 1 — Mint the Content ID

The editorial ID (`SDW-001`, the Translation Key) stays language-neutral.
At handoff, mint the per-language Content ID by appending the language
suffix:

- `translationKey: SDW-001` — the article's semantic identity, shared by
  every language version,
- `contentId: SDW-001-EN` — identifies the English language version; the
  suffix must match the `language` field (schema-validated).

Both values reuse the ID allocated by `npm run editorial:new`; no new
identifier is invented at handoff.

## Step 2 — Create the article file

Create `src/content/articles/en/<slug>.md` from the approved draft — or
`<slug>.mdx` when the article embeds components such as `Figure` or
`YouTubeFacade` (plain `.md` renders components as literal text):

- the slug is the file name without extension and becomes the public URL
  (`/en/articles/<slug>/`); slugs are independent per language,
- the article body is the approved draft's prose; nothing from
  `content-work/` is committed — the working artifacts stay private,
- fill the frontmatter from `templates/article-frontmatter.md`: every
  required field per `docs/content-schema.md`, with `draft: true` set
  explicitly (the schema default is `false`),
- leave the translation fields alone: `translationOf: null`,
  `translationStatus: "source"`, `sourceRevision: 1`. German and Spanish
  versions are produced exclusively through the translation workflow
  (`docs/translation/workflow.md`) — the editorial lifecycle does not
  create them.

## Step 3 — Open the draft pull request

- One feature branch, one pull request containing the article file.
- The pull-request description references the `[CONTENT]` issue with a
  closing keyword (`Closes #<n>`), so the issue closes when the pull
  request merges.
- No special treatment: the same deterministic gates and review run as for
  any other change.
- A `draft: true` article is excluded from all built output — no article
  page, no overview or homepage entry, no RSS item, no sitemap entry, no
  hreflang cluster. Review therefore focuses on frontmatter and prose,
  and the exclusion makes the draft safe to merge.

## After the merge

- The `[CONTENT]` issue closes with the merge; the editorial lifecycle for
  this article is complete.
- The article exists as an English source with `draft: true` and produces
  no public output.

## Publication — separate manual step

Publication is your explicit, later decision; nothing publishes
automatically:

- flip `draft: false` in its own small pull request,
- `publishedAt` may be adjusted to the actual publication date in the same
  change; a future date schedules the release (the article stays excluded
  from public output until then),
- `updatedAt` stays `null` — the flip is the publication act, not a
  content revision.
