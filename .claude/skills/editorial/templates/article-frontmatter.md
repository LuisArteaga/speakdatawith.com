<!-- Template for the frontmatter of src/content/articles/en/<slug>.md|.mdx —
the public article file created at handoff (references/handoff.md). This is
NOT a content-work artifact template: the file it produces is committed.
Field rules per docs/content-schema.md; every field is validated at build
time by src/schemas/article.ts. Remove the per-field comments when filling
the values. -->

```yaml
contentId: "SDW-001-EN"       # <translationKey>-EN — suffix must match language
translationKey: "SDW-001"     # the editorial ID from content-work/<ID>/
language: "en"
translationOf: null           # English originals never reference a source
translationStatus: "source"
sourceRevision: 1             # version counter of the English source
title: "<Working title>"      # non-empty; page title, lists, RSS, metadata
description: "<One or two sentences>"  # non-empty; lists, RSS, meta description
publishedAt: 2026-09-24       # intended publication date; adjustable at the draft:false flip
updatedAt: null
draft: true                   # mandatory at handoff — publication is the separate manual flip
pillar:
  - Generate                  # Generate | Observe | Evaluate | Govern (list may be empty)
audience:
  - Analytics Engineers       # non-empty; e.g. Analytics Engineers, Data Platform Engineers
tags: []                      # free-form; list may be empty
repositoryUrl: null
releaseUrl: null
evidenceUrl: null
youtubeId: null               # 11-character video ID, not the full URL
```

<!-- The machine-translation fields (translationModel, translationPromptVersion,
translatedAt) stay unset for English sources; only the translation workflow
sets them. -->
