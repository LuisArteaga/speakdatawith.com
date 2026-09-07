# Editorial Workflow

This document is the working contract for producing articles on this site.
It defines the lifecycle, the gates, the working artifacts, the public and
private boundary, the issue structure, and the handoff into the content
pipeline. The decision record for this workflow is
[ADR-0003](../adr/0003-editorial-workflow-with-private-working-artifacts.md);
detailed phase instructions live in the editorial skill's reference files.

## Core rule

Interview before producing. No thesis before the author's experience is
understood, no research before evidence gaps are classified, no draft before
the brief is approved. LLM-assisted sessions interview, structure, and draft;
the author decides at every gate.

## Lifecycle

```text
Topic
→ Experience Interview
→ Thesis Map
→ Gap Analysis
→ Evidence Backlog
→ Research / Experiments
→ Follow-up Interview
→ Article Brief
→ Outline
→ Draft
→ Humanity Interview
→ Human Pass
→ Final Evidence Check (Claims Audit)
```

Phases are never skipped without the author's explicit permission. At the end
of each phase:

1. summarize what has been established,
2. distinguish facts from interpretations,
3. list unresolved questions,
4. recommend the next step,
5. wait for confirmation before moving on.

## Gates

Every lifecycle transition is a human gate, mirrored by the checklist in the
article's `[CONTENT]` issue. Stop and ask the author before continuing when:

- the thesis is unclear,
- the author's opinion is contradictory,
- an experience lacks enough detail to describe accurately,
- a personal detail may be sensitive,
- research would materially influence the thesis,
- a claim requires an experiment,
- evidence contradicts the current recommendation,
- a translation or paraphrase changes the degree of certainty,
- the draft contains unresolved evidence gaps,
- the session cannot distinguish observation from inference.

Momentum is never rewarded over accuracy.

## Working artifacts

Working artifacts live in `content-work/<ID>/`, where `<ID>` is the article's
language-neutral editorial ID in the existing `translationKey` format
(`SDW-001`, `SDW-002`, …), allocated by `npm run editorial:new`. The
directory is gitignored; none of these files is committed.

| File | Purpose |
| --- | --- |
| `topic.md` | provisional problem, open ambiguities, intended reader |
| `interview-notes.md` | approved round summaries of the experience and humanity interviews |
| `author-language-bank.md` | the author's actual wording, recovered verbatim |
| `thesis-map.md` | decision, primary reader, trigger, current thesis, conventional assumption, failure mechanism, confidence |
| `gap-analysis.md` | every claim classified: observed, reproducible, externally verifiable, interpretive, unknown, or private |
| `research-ledger.md` | claim-level traceability: source, source type, version, access date, interpretation, limitation |
| `article-brief.md` | approved brief: reader's decision, opening material, problem and solution space, claims to avoid, CTA |
| `outline.md` | argument-first outline, approved before drafting |
| `draft.md` | the working draft |
| `humanity-interview.md` | emotional-reality pass over the draft |
| `claims-audit.md` | final evidence check: every claim backed, explicitly waived, or removed |

## Public and private boundary

- `content-work/` is gitignored entirely (only the `.gitkeep` directory
  marker is committed) — no working artifact inside it is ever committed.
- Publishable material enters the repository only by copying a curated
  snapshot into `docs/editorial/<ID>/` (for example the approved thesis map
  or the final claims audit, in a version worth keeping). The rule is
  mechanical: **everything under `docs/` is public** — check before copying.
- Raw interview notes and the author language bank are not published, even
  in curated form, without explicit approval.
- The issue tracker carries actionable content only (next section);
  hypotheses and verbatim interview material stay out of issues.

## Issue structure

One `[CONTENT]` issue per article (title: `[CONTENT] SDW-001 — Working
title`) holds:

- **Status** — the current lifecycle phase,
- **Topic** and **Primary reader**,
- **Experience source** — observed incident, reconstructed incident,
  synthetic failure scenario, or analytical essay without incident,
- **Current thesis** — or "not yet confirmed",
- **Interview rounds** — questions and *approved* summaries only, no
  verbatim transcript,
- **Evidence gaps** — checklist,
- **Linked evidence issues**,
- **Drafting gate** — the full gate checklist (interview complete, thesis
  confirmed, gaps classified, research and experiments complete, follow-up
  interview complete, brief approved, outline approved, draft authorized,
  humanity interview complete, claims audit complete).

The thesis map itself is referenced, not embedded.

Evidence issues are separate tickets, one per gap, because their definition
of done differs: an interview clarifies what you think; an experiment
clarifies whether you are right. Each evidence issue records:

- **Evidence gap** — what is missing,
- **Method** — how the gap is closed (research, experiment, interview),
- **Required evidence** — what result would close it,
- **Acceptance criteria** — the concrete definition of done,
- **Possible article impact** — what changes in the article either way.

The author's current hypothesis stays in the private gap analysis; the public
issue records method and required evidence only.

## Starting and resuming

- **New article:** `npm run editorial:new "<topic>"` allocates the next free
  ID (scanning both `content-work/` and `src/content/articles/`), scaffolds
  the artifact files with template headers, and prints the gate checklist
  seed for the `[CONTENT]` issue.
- **Every session** starts by reading `content-work/<ID>/` and reporting the
  current lifecycle phase, the confirmed gates, and the open questions.
  Article state lives in these files; no session history is authoritative.

## Handoff into the content pipeline

- Preconditions: every drafting-gate checkbox confirmed and the claims audit
  passed.
- The final editorial step creates the English source article at
  `src/content/articles/en/<slug>.md` from the approved draft, with full
  schema frontmatter per `docs/content-schema.md` — `contentId:
  SDW-001-EN`, `translationKey: SDW-001`, `language: en`, `draft: true`.
- The draft goes through the standard pull-request flow: the same
  deterministic gates and review as any other change.
- The `[CONTENT]` issue closes when the draft pull request merges.
- Publication is a separate, manual step: flipping `draft` to `false`.
  Nothing publishes automatically.
- German and Spanish versions are produced exclusively through the
  translation workflow (`docs/translation/workflow.md`); the editorial
  lifecycle does not produce them.
- The operational procedure, including the frontmatter template, is the
  editorial skill's `references/handoff.md`.

## Editorial voice (summary)

- Begin with tension, not a template, and explain why the mistaken
  assumption was reasonable.
- Separate Problem Space from Solution Space.
- Ground arguments in operational reality; name frameworks only when they
  earn their name.
- Quote the author only with wording actually provided; preserve uncertainty
  accurately; end with a decision.

The full voice guide and per-phase instructions live in the editorial
skill's reference files; the committed surface of the methodology is the
skill, its templates, and this contract.

## Related documents

- [ADR-0003](../adr/0003-editorial-workflow-with-private-working-artifacts.md)
  — decision record for this workflow
- [ADR-0001](../adr/0001-english-source-of-truth-with-deterministic-translation-governance.md)
  — English source of truth and translation governance
- [`docs/content-schema.md`](../content-schema.md) — article frontmatter
  schema
- [`docs/translation/workflow.md`](../translation/workflow.md) — German and Spanish
  pipeline
- Editorial skill: `.claude/skills/editorial/` (router, phase references,
  templates)
