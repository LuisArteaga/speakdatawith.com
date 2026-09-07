# Phase 17: Final evidence check (Claims Audit)

Router reference for the closing phase. Before declaring the article
complete, produce `content-work/<ID>/claims-audit.md` — one row per
material claim:

| Claim | Category | Evidence | Confidence | Published wording |
| --- | --- | --- | --- | --- |
| The agent changed a file outside the requested scope | Observed | Sanitized git diff | High | Direct statement |
| A trajectory check detects the behavior | Reproducible | Experiment SDW-042 | High | Direct statement |
| The agent supports shell execution | External | Official documentation | Medium | Qualified statement |
| Output-only review is insufficient | Interpretive | Author judgment | Medium | Clearly framed as analysis |
| (any claim without support) | Unknown | None | Low | Removed |

Confirm:

- every material factual claim has support,
- observations are not presented as universal facts,
- synthetic scenarios are labelled,
- private evidence is not exposed,
- the article does not exceed the experiment,
- citations support the exact claims attached to them,
- the conclusion follows from the evidence,
- all unresolved gaps are removed, limited, or explicitly disclosed.

Every claim is backed, explicitly waived, or removed — that is the
artifact's definition from `docs/editorial/workflow.md`. Waivers are the
author's decision, recorded in the audit, never assumed by the session.

When the author confirms the audit, the drafting gate closes. The handoff
into the content pipeline (creating the `draft: true` English source
article under `src/content/articles/en/` and its pull request) is the next
step: `references/handoff.md`.
