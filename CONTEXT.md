# SpeakDataWith.com

Glossary for the speakdatawith.com content platform — a trilingual static
site for data engineering articles. English content is editorially
authoritative; German and Spanish versions are derived translations.

## Language

**Article**:
The semantic unit of editorial content, identified by its translation key.
It exists as one or more language versions.
_Avoid_: post, page

**Translation Key**:
The stable identifier of an article across all of its language versions
(`SDW-<digits>`, e.g. `SDW-001`). Every language version of the same article
shares it. An article carries it from the moment editorial work begins,
before any language version exists.
_Avoid_: content ID, article ID, editorial ID

**Content ID**:
The stable identifier of one language version of an article
(`SDW-<digits>-<LANG>` with `LANG` ∈ {EN, DE, ES}, e.g. `SDW-001-EN`).
Uniquely identifies the publishable artifact (page, RSS item, hreflang
target); never reused across languages.
_Avoid_: translation key

**Source Article**:
The English version of an article. Editorially authoritative; every other
language version derives from it and references it.
_Avoid_: original, master, parent

**Translation**:
A German or Spanish language version of a source article. Always derived,
never authoritative, and publishable only after human review.
_Avoid_: copy, locale

**Translation Status**:
The stored review lifecycle state of a language version: `source` (English
original), `generated` (machine-produced, not human-approved), `reviewed`
(human-approved), `stale` (explicitly flagged as outdated).
_Avoid_: publication state, approval state

**Stale**:
The outdated state of a translation, either stored explicitly or derived:
a `reviewed` translation whose source revision no longer matches its source
article's counts as stale regardless of its stored status, and is excluded
from publication and flagged by CI.
_Avoid_: outdated, deprecated

**Source Revision**:
The version counter (`sourceRevision`) of a source article, incremented on
every substantive English content change. A translation may only be
published when its revision matches its source article's.
_Avoid_: version, build number

**Styleguide Page**:
A local-only specimen page that exhibits every design-system element for
visual review during development. It exists outside the content model: it
is not an Article, has no language versions or translation status, and is
never published to the live site.
_Avoid_: test page, demo page, kitchen sink

## Editorial Workflow

**Working Artifact**:
A private file that carries one article's state through the editorial
lifecycle — interview summaries, the thesis map, the evidence
classification, drafts, and audits. Working artifacts are the article's
only authoritative state; nothing outside them records editorial progress.
They are never published directly; publishable material becomes public
only as a Curated Snapshot.
_Avoid_: scratch file, session notes

**Editorial Gate**:
A human confirmation point between two phases of the editorial lifecycle.
Every lifecycle transition is one: work never continues past an Editorial
Gate without the author's explicit confirmation. Distinct from quality
gates — the deterministic checks that run against repository changes.
_Avoid_: quality gate, CI gate

**Content Issue**:
The single public tracker ticket that accompanies one article through the
editorial lifecycle. It records the article's status, topic, primary
reader, experience source, and the Editorial Gate checklist — actionable
content only. Hypotheses and verbatim interview material stay in the
Working Artifacts.
_Avoid_: epic, umbrella issue

**Evidence Gap**:
A claim in the emerging article that lacks support, classified during gap
analysis as observed, reproducible, externally verifiable, interpretive,
unknown, or private. Every gap is either closed by evidence or explicitly
waived before drafting.
_Avoid_: open question, TODO

**Evidence Issue**:
A public tracker ticket that closes exactly one Evidence Gap. It records
the method (research, experiment, interview), the required evidence, and
the acceptance criteria — never the author's hypothesis. It closes on its
own definition of done, independently of the article's pull request.
_Avoid_: research ticket, backlog item

**Curated Snapshot**:
An explicitly approved copy of Working Artifact material placed into the
public documentation. It is the only path by which editorial material
becomes public, so the decision to snapshot is deliberate and reviewable.
Raw interview notes and the author language bank are never snapshotted
without explicit approval.
_Avoid_: copy, export
