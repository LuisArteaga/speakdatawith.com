# Editorial Workflow

This document is the working contract for producing articles on this site.
It defines the lifecycle, the gates, the working artifacts, the public and
private boundary, the issue structure, and the handoff into the content
pipeline. The decision record for this workflow is
[ADR-0003](../adr/0003-editorial-workflow-with-private-working-artifacts.md);
detailed phase instructions live in the editorial skill's reference files.

## Working with this workflow

This section orients the author; the sections below are the binding
contract.

1. **You are the author and the only decision-maker.** The editorial skill
   (`.claude/skills/editorial/`) executes the methodology in a session — it
   interviews, structures, and drafts, and you confirm at every Editorial
   Gate. Article state lives exclusively in the Working Artifacts under
   `content-work/<ID>/`.
2. **Start a new article** with `npm run editorial:new "<topic>"`. The
   script allocates the article's Translation Key (scanning both
   `content-work/` and `src/content/articles/` for the next free ID),
   scaffolds the artifact files with template headers, and prints the gate
   checklist seed. Open the article's `[CONTENT]` issue from that seed.
3. **Drive the work in sessions.** Ask a session to start or resume
   editorial work on the article (for example, "start editorial work on
   SDW-001"). The skill loads exactly one phase reference at a time and
   ends every phase with a summary, the open questions, and the Editorial
   Gate question for you. Phase instructions live in the skill's reference
   files.
4. **Resume any time.** A fresh session reads `content-work/<ID>/status.md`
   first and reports the current lifecycle phase, the confirmed gates, and
   the open questions. The Working Artifacts are the only state; no session
   history is authoritative. Work packs as one phase group per session by
   default ("Phase checkpoints").
5. **Close evidence gaps between sessions.** Each Evidence Gap becomes an
   Evidence Issue with its method, required evidence, and acceptance
   criteria; research and experiments run outside the interview, and the
   research ledger records what closed each gap.
6. **Hand off and publish deliberately.** After the drafting gate and the
   claims audit, the handoff creates the English source article with
   `draft: true`; the pull request closes the `[CONTENT]` issue.
   Publication is the separate, manual `draft: false` flip. German and
   Spanish versions are produced exclusively through the translation
   workflow — the editorial lifecycle is English-only.

Each step is defined in full by the sections that follow.

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

Each confirmation is an Editorial Gate, and every confirmed gate triggers
the phase checkpoint (next section) before work continues.

## Phase checkpoints

An Editorial Gate confirmation is only complete when the session has
persisted everything a cold restart needs. At every Editorial Gate, as
part of the confirmation and before any further work, the session MUST:

1. **Write approved summaries to the Working Artifacts** — round summaries
   into `interview-notes.md`, decisions into their artifacts; nothing
   approved stays in conversation history only.
2. **Persist raw dictated material verbatim** into
   `interview-transcript-raw.md` — the author's dictation exactly as
   spoken, with repetitions and half sentences preserved as-is. This
   artifact is private and never published; it feeds drafting, the
   humanity pass, and the claims audit, which may quote only wording
   actually provided.
3. **Update `status.md`** — current phase, confirmed gates, open questions,
   next entry point. `status.md` is the source of truth for resuming; a
   fresh session reads it first.
4. **Mirror the gate checklist** in the article's `[CONTENT]` issue — tick
   the confirmed items. The issue is the public mirror; raw dictated
   material never enters it.
5. **Ask the author: continue in this session or end it here.** Ending at
   the gate loses nothing once steps 1–4 are done; that is the point.

### Session packing

The default is one phase group per session. A session that completes the
Research / Experiments group — or any phase group that loaded large
external material — ends at its Editorial Gate: context accumulated there
degrades everything after it. Continuing in-session is an explicit author
opt-in, never the default.

## Gates

Every lifecycle transition is an Editorial Gate, mirrored by the checklist
in the article's `[CONTENT]` issue. Stop and ask the author before
continuing when:

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

Working artifacts live in `content-work/<ID>/`, where `<ID>` is the
article's Translation Key (`SDW-001`, `SDW-002`, …), allocated by
`npm run editorial:new`. The directory is gitignored; none of these files
is committed.

| File | Purpose |
| --- | --- |
| `status.md` | machine-readable session-resume state: current phase, confirmed gates, open questions, next entry point |
| `topic.md` | provisional problem, open ambiguities, intended reader |
| `interview-notes.md` | approved round summaries of the experience and humanity interviews |
| `interview-transcript-raw.md` | verbatim dictated interview material; feeds drafting, the humanity pass, and the claims audit |
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
- Raw interview notes, the raw interview transcript, and the author
  language bank are not published, even in curated form, without explicit
  approval.
- The issue tracker carries actionable content only (next section);
  hypotheses and verbatim interview material stay out of issues.

## Issue structure

One `[CONTENT]` issue per article (title: `[CONTENT] SDW-001 — Working
title`) holds:

- **Status** — the current lifecycle phase, mirrored from the article's
  private `status.md`,
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
