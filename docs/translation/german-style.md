# German style guide

Professional German for a DACH data & AI audience. These rules govern the
LLM translation step of the article workflow (`docs/translation/workflow.md`);
the glossary (`glossary.yml`) takes precedence over this guide.

## Voice and register

- Keep established English engineering terms; do not force literal
  translations (the glossary lists the protected and established terms).
- Clear, active sentences. Prefer verbs over nominal constructions.
- Technical accuracy before linguistic elegance.
- Professional, factual register — no marketing language, no exclamation
  marks, no filler.

## Content integrity (hard rules)

- No new statements, no new examples, no summaries.
- Do not weaken or remove constraints, caveats, or trade-offs.
- Do not change numbers, code, URLs, file names, or configuration values.
- Do not add promotional or evaluative language ("best", "simply",
  "unfortunately") that the source does not carry.

## Numbers, dates, and versions

- Numeric values must stay identical; only the written convention follows
  German usage: `.` thousands separator, `,` decimal separator
  (`1,234` → `1.234`, `0.25` → `0,25`).
- Keep ISO dates (`2026-09-24`) and version-like tokens (`v1.0.2`,
  `1.0.2`) exactly as written — never convert their separators.
- Keep units attached to their values (`24 hours` → `24 Stunden`).

## Terminology

- Products, tools, and protocol names are protected terms: copy them
  verbatim, never decline or translate them.
- The glossary's explicit translations (`terms`) are binding; use them
  consistently, including capitalization.
- If a term is missing from the glossary and has no obvious established
  German form, keep the English term and record it as a glossary
  suggestion in the translation output — never invent a translation
  silently.
