# English source of truth with deterministic translation governance

The site publishes English articles as the editorial source of truth; German
and Spanish versions are derived translations that may only become public
after human review. The pipeline deliberately runs without an agent framework
(LangChain), without a translation management system, and without a content
hash: deterministic Node.js scripts parse the Markdown/MDX AST, extract
versioned translation segments, rebuild the translated document, and validate
structural invariants (code blocks, inline code, URLs, numbers). A versioned
skill file with translation instructions, a versioned glossary, and
per-language style guides govern the LLM translation step, which runs outside
CI under human control. CI enforces only deterministic checks (revision
alignment, structural invariants, publication rules). `sourceRevision` is the
sole staleness trigger: a translation may only be published while its revision
matches its source article's.

## Considered options

- **LangChain / agent framework** — rejected: no orchestration problem exists
  at this scale (one article in, one document out, fixed steps). Framework
  abstractions would hide exactly the control flow this design depends on.
- **Translation management system** — rejected: an external system for a
  single-author site; the in-repo glossary and style guides cover the need.
- **Content hash as staleness signal** — rejected for now: a raw-file hash is
  formatting-sensitive (constant false staleness); an AST-canonical hash is
  possible but buys little over revision discipline at this cost. Revisit in a
  later issue if forgotten revision bumps become a real problem.

## Consequences

- Stale translations fail CI; nothing is auto-fixed.
- A forgotten `sourceRevision` bump is not auto-detected (documented boundary).
- The translation report records the model and prompt version per run; CI
  never calls a model.

## Inspiration & References

- Project design principle (2026-09): "An LLM may translate prose; it must
  not decide which parts of a technical document are mutable or whether its
  translation is publishable."
- GitHub community discussion #182015, "Is LangChain becoming too
  complex/bloated for simple RAG applications?" — plain code with direct APIs
  is faster to build, easier to debug, and simpler to maintain for simple
  workflows: https://github.com/orgs/community/discussions/182015
- Hacker News, "Why we no longer use LangChain for building our AI agents" —
  most LLM applications need only string handling, API calls, and loops:
  https://news.ycombinator.com/item?id=40739982
- Designveloper, "Why Developers Say LangChain Is 'Bad': An Honest Look" —
  frameworks pay off for complex orchestration, not one-shot steps:
  https://www.designveloper.com/blog/is-langchain-bad
