# Spanish style guide

Neutral professional Spanish for a technical data & AI audience. These
rules govern the LLM translation step of the article workflow
(`docs/translation/workflow.md`); the glossary (`glossary.yml`) takes
precedence over this guide.

## Voice and register

- Neutral, international Spanish — no regionally marked idioms, no
  slang, no humor that depends on a specific locale.
- Do not localize automatically to Spain (`vosotros`, `ordenador`) or to
  Latin America; stay with forms that read naturally everywhere
  (`ustedes`, `computadora`/`equipo` only when the source demands a
  concrete noun — prefer the English product term instead).
- Keep established English product and engineering terms; do not force
  literal translations (the glossary lists the protected and established
  terms).
- Technical accuracy before stylistic flourish. Clear, direct sentences.

## Content integrity (hard rules)

- No new statements, no new examples, no summaries.
- Do not weaken or remove constraints, caveats, or trade-offs.
- Do not change numbers, code, URLs, file names, or configuration values.
- Do not add promotional or evaluative language that the source does not
  carry.

## Numbers, dates, and versions

- Numeric values must stay identical; only the written convention follows
  Spanish usage: `.` thousands separator, `,` decimal separator
  (`1,234` → `1.234`, `0.25` → `0,25`).
- Keep ISO dates (`2026-09-24`) and version-like tokens (`v1.0.2`,
  `1.0.2`) exactly as written — never convert their separators.
- Keep units attached to their values (`24 hours` → `24 horas`).

## Terminology

- Products, tools, and protocol names are protected terms: copy them
  verbatim, never translate them.
- The glossary's explicit translations (`terms`) are binding; use them
  consistently, including capitalization.
- If a term is missing from the glossary and has no obvious established
  Spanish form, keep the English term and record it as a glossary
  suggestion in the translation output — never invent a translation
  silently.
