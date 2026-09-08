# Editorial workflow with private working artifacts and gated publication

> **Status:** Amended 2026-09 while implementing the phase checkpoint
> protocol: LLM-assisted sessions have a practical context budget far below
> the advertised model context window, so multi-session operation is
> first-class, not an emergency measure. Two artifacts joined the private
> working set — `status.md` (machine-readable session-resume state, updated
> at every Editorial Gate checkpoint) and `interview-transcript-raw.md`
> (verbatim dictated interview material, never published). The decision and
> rationale below are unchanged.

Articles on this site are produced through an interview-to-evidence
methodology: every article starts from the author's first-hand experience, is
interviewed into a thesis map, has every claim classified into an evidence gap
table, and may only be drafted after each required piece of evidence exists or
is explicitly waived. The methodology is implemented **repo-locally** as a
versioned editorial skill (a compact router file with per-phase reference
files and templates), one deterministic bootstrap script (`npm run
editorial:new`) that allocates the article ID and scaffolds the working
artifacts, and a committed workflow contract (`docs/editorial/workflow.md`).
No separate planning tool, shared abstraction, or external system is created
for it at this stage.

Working artifacts are **private by default**: the full working set (interview
notes, author language bank, thesis map, gap analysis, research ledger,
drafts, audits) lives under the gitignored `content-work/<ID>/` and is never
committed. Publishable material enters the repository only through an
explicit copy-to-publish step into `docs/editorial/<ID>/` — the hard rule
being that everything under `docs/` is public. The public issue tracker
likewise carries actionable content only: one `[CONTENT]` issue per article
holding status, topic, reader, experience source, and the gate checklist, plus
one evidence issue per gap holding method, required evidence, and acceptance
criteria. Author hypotheses and raw interview material stay in the private
working set.

The editorial article ID reuses the existing `translationKey` scheme
(`SDW-001`, language-neutral); the per-language `contentId` (`SDW-001-EN`) is
minted only at handoff, when the approved draft becomes a `draft: true`
English source article through the standard pull-request flow with the same
deterministic gates as any other change. Publication is a separate, manual
`draft: false` flip. The editorial lifecycle is English-only; German and
Spanish versions are produced exclusively through the existing translation
workflow.

## Considered options

- **Extending the separate software-planning orchestrator** — rejected: its
  domain vocabulary (PRD, draft issues, planning judge) has no analogue in a
  deliberately human-gated editorial process, its autonomous batch refinement
  loop has no editorial counterpart, and hosting editorial state there would
  pollute both projects' glossaries.
- **A shared, centralized content toolkit** — rejected for now: there is no
  second content project yet; generalization happens by copying the pattern,
  and extraction is deferred until a real second consumer exists (the same
  precedent the quality gates followed).
- **One always-loaded methodology document (~1,400 lines)** — rejected:
  model performance degrades as input length grows and distractors
  accumulate, so a monolithic instruction set would bury the phase currently
  being executed. A compact router with per-phase reference files keeps each
  session's context minimal.
- **One independent skill per phase** — rejected: one article has one state
  and one voice; splitting the lifecycle across independently loaded
  instructions invites state and voice drift. One skill with progressive
  disclosure covers both.
- **Automated gate enforcement in v1** — rejected: gates are human
  confirmations, not machine-checkable facts; a checker would only validate
  that a human ticked a box. Revisit if checklist drift is actually observed.
- **Committing working artifacts via gitignore negation patterns or forced
  adds** — rejected: fiddly and error-prone in a public repository; the
  copy-to-publish step makes publication a deliberate, reviewable action.

## Consequences

- Raw interview notes, hypotheses, and drafts are never committed by default;
  a leak requires an explicit copy into `docs/`, which is visible in review.
- Article state lives in files, not sessions: any session resumes by reading
  `content-work/<ID>/` and reporting the current phase and open gates.
- Two artifact homes exist (private working set, committed snapshots); the
  workflow contract defines which content belongs where.
- The public tracker shows the editorial bracket without exposing the
  author's private reasoning; evidence issues close on their own definition
  of done, independent of the article's pull request.
- v1 accepts conversational gate enforcement; no tooling validates checkbox
  state until drift is observed.

## Inspiration & References

- Anthropic Engineering, "Effective context engineering for AI agents"
  (Sep 29, 2025) — context is a finite resource with an attention budget;
  performance degrades as context grows:
  https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Chroma Technical Report, "Context Rot: How Increasing Input Tokens Impacts
  LLM Performance" (Jul 14, 2025) — measured degradation with input length
  even on simple tasks, worsened by distractors:
  https://research.trychroma.com/context-rot
- Anthropic Engineering, "Equipping agents for the real world with Agent
  Skills" (Oct 16, 2025) — progressive disclosure in skill files; large
  skills are split into reference files loaded only when needed:
  https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Internal precedent: ADR-0001 (deterministic scripts govern structure, the
  LLM fills content) and the translation workflow's shape (versioned skill
  file + committed workflow contract + gitignored working directory).
