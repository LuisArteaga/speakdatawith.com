---
name: translate-article
description: Translate an English source article of this repository into German or Spanish following the controlled translation workflow (extract → translate segments → apply → validate → report). Use when asked to translate an article, produce the German/Spanish version of a post, or run the translation workflow.
version: "1.0"
---

# Article translation skill (v1.0)

This skill is the versioned LLM translation step of the repository's
controlled translation workflow. The scripts control the document
structure; you translate ONLY the extracted text segments. The workflow
contract, segment format, and CLI reference live in
`docs/translation/workflow.md`. ADR-0001
(`docs/adr/0001-english-source-of-truth-with-deterministic-translation-governance.md`)
is binding: translations run outside CI, under human control, and are
never published automatically.

## Inputs you accept

- Exactly one English source article:
  `src/content/articles/en/<slug>.md` or `.mdx` (a published article or
  one prepared for publication).
- Exactly one target language: `de` or `es`. Nothing else.
- The glossary `docs/translation/glossary.yml` and the style guide
  `docs/translation/german-style.md` or `docs/translation/spanish-style.md`.

## Required flow (in order, no steps skipped)

1. **Validate the source article.** It must exist under
   `src/content/articles/en/`, carry `language: "en"`,
   `translationStatus: "source"`, a matching `contentId`
   (`<translationKey>-EN`), and a positive integer `sourceRevision`. If
   anything else appears, stop and report — do not fix the source.
2. **Check the target language.** Only `de` or `es`. Anything else is a
   hard stop.
3. **Extract segments** with the deterministic script:

   ```bash
   npm run translate:extract -- --source src/content/articles/en/<slug>.md --target de
   ```

   It writes `translation-work/<translationKey>.<lang>.segments.json`.
   Never edit that file's structure — you only replace segment `text`
   values in the next steps.

4. **Load the glossary and the target-language style guide.** The
   glossary wins over your own preferences and over the style guide.
   `protected_terms` must appear verbatim in your translation wherever
   they appear in the source (never declined, never translated).
5. **Translate the segment texts.** Work through
   `segments[].text` one by one and replace each `text` with its
   translation. Rules:

   - Translate only prose. Inline markup inside a segment
     (`**bold**`, `` `code` ``, `[links](url)`, `![images](url)`) must
     survive byte-for-byte except for the words you translate.
   - Never alter inline code values, code blocks, URLs, file paths,
     component names, or protected component attribute values
     (`src`, `videoId`, `poster`, `url`). The `protectedContent` arrays
     in the file list them — treat them as read-only.
   - Never alter numbers and version-like tokens (`v1.0.2`, ISO dates).
     Convert the numeric convention to the target language's written
     form (`1,234` → `1.234`, `0.25` → `0,25` for de/es); values stay
     identical.
   - MDX component attributes inside a segment (e.g. a `RepositoryCTA`
     at the end of a paragraph): translate only the translatable
     attribute (`label`); leave `url` and the element itself unchanged.
     Do not add or remove attributes.
   - Component attributes extracted as their own segments
     (`type: "component-attribute"`) receive plain text — no Markdown
     syntax.

6. **Do not guess ambiguous passages.** If a segment is ambiguous
   (multiple domain readings, unclear referent, untranslatable wordplay),
   choose the most literal reading you can defend and record the segment
   id plus a one-sentence reason in `ambiguousSegments`
   (`[{ "id": "...", "reason": "..." }]`). Never silently resolve an
   ambiguity by reinterpreting the source.
7. **Write the translated segments** to
   `translation-work/<translationKey>.<lang>.translated.json`: the same
   JSON with every `text` replaced (same ids, same order), plus
   `model` (the provider/model identifier you are running as, e.g.
   `z-ai/glm-5.3-flash`), your `ambiguousSegments`, and
   `newGlossarySuggestions` (a list of `source` terms you believe belong
   in the glossary, with a proposed de/es translation each — empty list
   if none).
8. **Propose a target slug.** Suggest a language-appropriate slug
   (lowercase ASCII letters, digits, single dashes — e.g.
   `gruener-dbt-check`). If you cannot propose one confidently, ask the
   operator instead of guessing.
9. **Apply** with the deterministic script (never edit the target file
   by hand):

   ```bash
   npm run translate:apply -- \
     --segments translation-work/<translationKey>.<lang>.translated.json \
     --slug <proposed-slug> \
     --model <provider/model identifier> \
     --prompt-version 1.0 \
     --translated-at <YYYY-MM-DD>
   ```

   The script rebuilds the document, rewrites the frontmatter identity
   fields, sets `translationStatus: "generated"`, validates all
   structural invariants, and writes the report. If validation fails,
   fix the translated segments (not the source, not the script) and
   re-run.

10. **Run the validation** explicitly for the final pair:

    ```bash
    npm run translate:validate -- \
      --source src/content/articles/en/<slug>.md \
      --translation src/content/articles/<lang>/<slug>.md
    ```

11. **Report.** Summarize: segments translated, ambiguous segments and
    why, glossary suggestions, validation result, and the report path
    (`translation-work/<translationKey>.<lang>.report.json`). The report
    is a review artifact — it never proves human approval.

## Hard prohibitions

- No summaries, no new examples, no new claims, no added opinions.
- No removal or weakening of constraints, caveats, or trade-offs.
- No altered numbers, code, URLs, versions, or configuration values.
- No unrequested glossary changes — suggestions only, in the report.
- Never set `translationStatus: "reviewed"` or touch the status of any
  file. Only a human may move `generated` to `reviewed`.
- No commits, no pushes, no pull requests — unless the operator
  explicitly instructs it in this session.
- No publication, no deployment, no CI invocation.
- Send only the selected article's segments (plus glossary and style
  guide content) to the model — never other repository files, secrets,
  environment variables, or unpublished research notes.

## Staleness and re-translation

If the source's `sourceRevision` is newer than an existing translation's,
the translation is stale. Re-translation repeats this whole flow; the
apply step overwrites the existing target only when it belongs to the
same `(translationKey, language)` and resets its status to `generated`.
Human review starts from zero after every re-translation.
