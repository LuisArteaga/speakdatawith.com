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
shares it.
_Avoid_: content ID, article ID

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
