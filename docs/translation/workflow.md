# Translation workflow

Controlled translation of English articles into German (`de`) and Spanish
(`es`). English is the editorial source of truth; the LLM translation step
runs **outside CI under human control**, and a translation becomes public
only after human review (`translationStatus: "reviewed"`). The
architecture decisions are recorded in
[`docs/adr/0001-english-source-of-truth-with-deterministic-translation-governance.md`](../adr/0001-english-source-of-truth-with-deterministic-translation-governance.md):
no agent framework, no translation management system, deterministic
Node.js scripts control the document structure while the LLM translates
only the extracted text segments.

## Architecture

```text
docs/translation/
├── workflow.md            this document
├── glossary.yml           versioned glossary (protected + explicit terms)
├── german-style.md        style guide for de
└── spanish-style.md       style guide for es

scripts/translation/
├── extract.mjs            source article → segments JSON
├── apply.mjs              translated segments → target document + report
├── validate.mjs           source + translation → invariant check
├── check-collection.mjs   whole collection → CI integrity gate
└── lib/
    ├── markdown.mjs       MDX-aware remark pipeline, extraction, grafting
    ├── invariants.mjs     structural + numeric invariant comparison
    └── frontmatter.mjs    frontmatter parsing, target construction, checks

.claude/skills/translate-article/SKILL.md
                           versioned LLM instructions (v1.0) — the skill
                           path of this development environment; it is
                           committed to the repository so the versioned
                           prompt travels with the content it governs.
                           The skill version is the translationPromptVersion
                           recorded in generated frontmatter and reports.

translation-work/          gitignored working directory for segment and
                           report files (only .gitkeep is committed)
```

Both `.md` and `.mdx` sources are parsed with the same MDX-aware remark
pipeline (`unified` + `remark-parse` + `remark-gfm` + `remark-mdx` +
`remark-frontmatter`). Every AST node type outside the explicitly
supported set aborts the workflow with a controlled error — the workflow
never silently alters content it does not understand. Reconstruction
parses the translated segment texts back into the AST, replaces only the
translated spans and the derived frontmatter, and serializes the result
with remark-stringify; the English source file is never modified.

## Extraction format

`npm run translate:extract` writes
`translation-work/<translationKey>.<lang>.segments.json`:

```json
{
  "schemaVersion": "1.0",
  "translationKey": "SDW-001",
  "sourceLanguage": "en",
  "targetLanguage": "de",
  "sourceRevision": 1,
  "sourcePath": "src/content/articles/en/example.md",
  "segments": [
    { "id": "frontmatter-title-001", "type": "frontmatter-title", "text": "…" },
    { "id": "frontmatter-description-001", "type": "frontmatter-description", "text": "…" },
    { "id": "heading-001", "type": "heading", "text": "…" },
    { "id": "paragraph-001", "type": "paragraph", "text": "…" },
    { "id": "list-item-001", "type": "list-item", "text": "…" },
    { "id": "table-cell-001", "type": "table-cell", "text": "…" },
    { "id": "component-attribute-001", "type": "component-attribute", "text": "…",
      "component": "Figure", "attribute": "alt" }
  ],
  "protectedContent": {
    "codeBlockHashes": ["…sha256…"],
    "inlineCodeValues": ["dbt build --select +customers"],
    "urls": ["https://example.com/quality-gates"],
    "componentNames": ["Figure"]
  }
}
```

- Segment ids are `type-ordinal` (`paragraph-003`) and stable within one
  document; extraction is deterministic, so a changed source produces a
  new segment set.
- Segment text is the raw inline Markdown of one structural unit —
  inline formatting (emphasis, links, images, inline code) travels
  inside the segment and must survive translation.
- Code blocks, import/export statements (`mdxjsEsm`), and thematic
  breaks are protected: they never become segments.
- The optional source hash is deliberately omitted; staleness is
  triggered exclusively by `sourceRevision` (ADR-0001).

### Supported nodes

Blocks: headings, paragraphs, lists (including nesting), blockquotes,
tables, fenced/indented code, thematic breaks, YAML frontmatter, and the
allowlisted MDX components as flow elements. Inline: text, emphasis,
strong, inline code, links, images, hard breaks, GFM strikethrough, and
allowlisted MDX components inline inside prose (e.g. a `RepositoryCTA`
closing a paragraph).

### MDX component allowlist

| Component | translatable attributes | protected | derived |
| --- | --- | --- | --- |
| `Figure` | `alt`, `caption` | `src`, import statements | — |
| `YouTubeFacade` | `title` | `videoId`, `poster` | `locale` |
| `RepositoryCTA` | `label` | `url` | `locale` |

`locale` is derived, never translated: the apply step rewrites it to the
target language on flow and inline instances alike.

### Not supported (controlled abort)

Raw HTML nodes, bare MDX expressions (`{expr}`, inline or flow), JSX
spread attributes, expression values on translatable attributes, JSX
children on components, unknown components, reference-style
links/images, footnotes, and definitions all abort the workflow with an
explicit error instead of being passed through or silently dropped.

## Glossary usage

`docs/translation/glossary.yml` distinguishes `protected_terms` (copied
verbatim into every language — never declined, never translated) and
`terms` with explicit `de`/`es` translations (binding, including
capitalization). The skill loads the glossary before translating; on
conflict the glossary wins over the style guide and over the model's own
preferences. The workflow never changes the glossary automatically — new
terminology is recorded as `newGlossarySuggestions` in the translated
segments file, flows into the translation report, and a human promotes
suggestions into `glossary.yml` explicitly.

## Skill flow (LLM step)

The versioned skill `.claude/skills/translate-article/SKILL.md` (v1.0)
enforces, in order: validate the English source, check the target
language, extract segments, load glossary + style guide, translate
segment texts only, mark ambiguous passages instead of guessing, write
the translated segments file (with `model`, `ambiguousSegments`,
`newGlossarySuggestions`), propose a target slug, apply, validate, and
report. It explicitly forbids summaries, new examples, new claims,
weakened constraints, altered numbers/code/URLs, unrequested glossary
changes, and any form of automatic publication, commit, or push.

## Human review gate

`apply` always writes `translationStatus: "generated"` — neither the
scripts nor the skill can set `reviewed`. A human moves `generated` →
`reviewed` in the target frontmatter after reading the document and the
report; only then does the publication filter
(`getPublishedArticles()`) consider the translation. The report's
`result: "requires_review"` is a review artifact, never proof of
approval. Re-translation after a source revision resets the status to
`generated` and review starts from zero.

Review is per target language: approving the German version never
approves the Spanish one — each translation carries its own
`translationStatus` and is reviewed separately.

## Collection integrity check (CI)

`npm run check:translations`
(`scripts/translation/check-collection.mjs`) validates the complete
article collection deterministically and runs in CI inside
`validate-site`. It reuses the workflow libraries above (parsing,
identity contract, invariants) and adds collection-level rules. It reads
repository files only: no model calls, no external APIs, no secrets.

CI fails (errors) when:

- the `(translationKey, language)` combination appears twice,
- a translation has no English source for its `translationKey`,
- `translationOf` does not reference the source's `contentId`,
- the identity contract between source and translation is violated
  (different `translationKey`, wrong `contentId` derivation, invalid
  `translationStatus`, empty title/description),
- a translation's `sourceRevision` differs from its source's — stored
  stale and derived stale alike. The report names the source article,
  the translation article, both languages, and the expected and found
  revision,
- `repositoryUrl`, `releaseUrl`, or `evidenceUrl` differ from the
  English source (technical references must survive translation),
- a `generated` or `stale` translation is publishable by date
  (`draft: false`, `publishedAt` not in the future) — the production
  build already keeps such translations out of every public route, feed,
  sitemap entry, and hreflang cluster via `getPublishedArticles()`; the
  CI error makes the forgotten status visible instead of silently
  hiding the article,
- per-file frontmatter rules are violated. They mirror the zod schema
  (`src/schemas/article.ts`) rule by rule; a Vitest parity test runs the
  same fixture frontmatters through both validators so the rules cannot
  drift apart,
- protected content changed between a source and its translation: code
  blocks, inline code values, URLs, component instances, and numeric
  values (the structural invariants from `validate.mjs`, applied to the
  collection).

CI warns (never fails) when:

- a publishable English source has no German or Spanish translation —
  missing translations never block an English article (quality over
  coverage),
- an optional Figure `alt` text is identical to the source (probably
  untranslated),
- numeric tokens are ambiguous under the target convention (see the
  numeric convention rule below),
- a protected glossary term occurs a different number of times in the
  translation than in the source — a deterministic proxy for terminology
  drift that only asks a human to look.

### Review workflow around CI

```text
English source updated
→ sourceRevision incremented
→ translation check reports DE and ES as stale
→ translation workflow updates translations
→ generated translations reviewed by a human
→ translationStatus changed to reviewed
→ sourceRevision aligned
→ CI passes
→ merge
```

Each language moves through this loop independently; the check reports
every language version separately.

## Updating an existing translation

1. Bump `sourceRevision` in the English source (and update its content).
2. Re-run the whole flow: extract → translate → apply with the same
   slug. The apply step overwrites the existing target only when it
   carries the same `(translationKey, language)`; anything else is
   rejected.
3. The rewritten target is `generated` again; the derived-staleness rule
   (`src/utils/articles.ts`) stops publishing the outdated version until
   review completes.

## Ambiguous passages

The skill never guesses: it picks the most literal defensible reading
and records the segment id with a reason in `ambiguousSegments`, which
passes through to the report. Reviewers find every flagged passage in
one place. The `ambiguousNumbers` array in reports and validation output
lists numeric tokens that could not be interpreted under the target
convention (e.g. an unconverted `0.25` in German text, where the decimal
separator is `,`) — they are warnings, not invariant failures.

## Numeric convention rule

Source tokens follow the English convention (`,` thousands, `.`
decimal); target tokens follow the German/Spanish convention (`.`
thousands, `,` decimal). Values must be equal (`1,234` ≡ `1.234` ≡
`1234`), including multi-group numbers (`12,345,678` ≡ `12.345.678`).
Version-like tokens (e.g. `1.0.2`) and ISO dates must be copied
verbatim. Tokens that fit neither pattern are reported as ambiguous.

## CLI reference

```bash
# 1. Extract segments from the English source
npm run translate:extract -- \
  --source src/content/articles/en/my-post.md \
  --target de

# 2. (LLM step) translate the segments — see the skill
#    writes translation-work/SDW-001.de.translated.json

# 3. Rebuild the target document
npm run translate:apply -- \
  --segments translation-work/SDW-001.de.translated.json \
  --slug mein-beitrag \
  --model <provider/model identifier> \
  --prompt-version 1.0 \
  --translated-at 2026-09-20

# 4. Validate the pair (also usable standalone)
npm run translate:validate -- \
  --source src/content/articles/en/my-post.md \
  --translation src/content/articles/de/mein-beitrag.md

# 5. Check the whole collection (the CI gate)
npm run check:translations
```

No model credentials are needed: the scripts never call an LLM, and no
provider integration exists (by design — a later provider integration
plugs into the same segments contract).

## Known limits

- Target documents are serialized by remark-stringify: Markdown
  formatting is normalized (table column padding, emphasis markers,
  list bullets) — the AST and all protected content are preserved
  byte-exactly, but the target's raw Markdown text is not a byte-level
  copy of the source. Code blocks and inline code values are verbatim.
- Inline formatting structure (e.g. a dropped `**` pair) is not an
  invariant; human review catches it. Code, inline code, URLs, numbers,
  structure, and component instances are enforced deterministically.
- Protected attribute values of inline components with non-URL values
  (e.g. `videoId` inside a paragraph) are covered by the skill's
  prohibitions and human review, not by the URL invariant.
- Semantic glossary compliance (does the text USE the mandated term) is
  a skill instruction, not a deterministic check. The collection check
  adds one deterministic proxy — protected-term occurrence drift — but
  recognizing a NEW term that should enter the glossary stays a human
  task.
- Semantic translation quality, style-guide adherence, and prose
  correctness are human review gates; CI enforces only the structural
  and metadata contract described above.
- The wrapper `translate:prepare` from the issue sketch was not built —
  the skill orchestrates the three scripts, and a wrapper that can call
  a model would contradict the "no implicit model calls" rule.
