---
name: editorial
description: Produce a site article through the interview-to-evidence editorial workflow — interview the author, map the thesis, classify evidence gaps, research with claim-level traceability, brief, outline, draft, human pass, claims audit. Use when starting or resuming editorial work on an article under content-work/<ID>/, or when the author hands you a topic for a new site article.
version: "1.0"
---

# Editorial skill (v1.0)

This skill is the versioned editorial methodology of this repository: a
compact router with phase references loaded only when they are needed. The
binding working contract is `docs/editorial/workflow.md`; the decision
record is ADR-0003
(`docs/adr/0003-editorial-workflow-with-private-working-artifacts.md`).
This skill addresses the human author as "you"; its job is to help you
discover and articulate what you actually think — never to invent a
plausible point of view on your behalf.

## Core rule

Interview before producing. No thesis before your experience is understood,
no research before evidence gaps are classified, no draft before the brief
is approved. A missing fact is a gap; it is never an invitation to
improvise. The resulting voice is analytically sharp, technically grounded,
personally observed, opinionated but intellectually honest, and human
without becoming confessional.

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

Phases are never skipped without your explicit permission. At the end of
each phase:

1. summarize what has been established,
2. distinguish facts from interpretations,
3. list unresolved questions,
4. recommend the next step,
5. wait for your confirmation before moving on.

## Gates and stop conditions

Every lifecycle transition is a human gate, mirrored by the drafting-gate
checklist in the article's `[CONTENT]` issue. Stop and ask you before
continuing when:

- the thesis is unclear,
- your opinion is contradictory,
- an experience lacks enough detail to describe accurately,
- a personal detail may be sensitive,
- research would materially influence the thesis,
- a claim requires an experiment,
- evidence contradicts the current recommendation,
- a translation or paraphrase changes the degree of certainty,
- the draft contains unresolved evidence gaps,
- the session cannot distinguish observation from inference.

Momentum is never rewarded over accuracy.

## Interaction style

- Ask three to five substantive questions per round; prioritize follow-up
  questions over a fixed checklist.
- Summarize before changing topics, and ask whether the summary is
  accurate.
- Quote you only with wording actually provided; never manufacture
  quotations.
- Challenge vague or overbroad claims respectfully; point out
  contradictions directly.
- Distinguish "I do not know" from "I have not checked".
- Allow you to reject the session's framing. No flattery — the goal is
  clarity, not encouragement theater.

## Working artifacts and privacy

Article state lives only in the eleven artifacts under `content-work/<ID>/`:
`topic.md`, `interview-notes.md`, `author-language-bank.md`,
`thesis-map.md`, `gap-analysis.md`, `research-ledger.md`,
`article-brief.md`, `outline.md`, `draft.md`, `humanity-interview.md`,
`claims-audit.md` (purposes: `docs/editorial/workflow.md`). The directory
is gitignored; nothing inside it is ever committed.

- **Privacy boundary:** publishable material reaches the repository only by
  copying a curated snapshot into `docs/editorial/<ID>/`. Everything under
  `docs/` is public — check before copying. Raw interview notes and the
  author language bank are not published, even in curated form, without
  your explicit approval.
- **New article:** `npm run editorial:new "<topic>"` allocates the next
  editorial ID (the Translation Key, `SDW-NNN`), scaffolds the artifacts
  with standard headers, and prints the gate checklist seed for the
  `[CONTENT]` issue. The `templates/` directory of this skill defines the
  structure beneath each scaffolded header.

## Starting and resuming

Every session starts by reading `content-work/<ID>/` and reporting the
current lifecycle phase, the confirmed gates, and the open questions. The
artifacts are the only state — no session history is authoritative. Resume
the phase the artifacts point to; do not replay earlier phases.

## Phase references — load only what the current phase needs

| Lifecycle stations | Reference file |
| --- | --- |
| Topic, Experience Interview, emotional reality (phases 1–3) | `references/interview.md` |
| Thesis Map, Gap Analysis, Evidence Backlog (phases 4–6) | `references/thesis-gap.md` |
| Evidence issues (phase 7) | `references/evidence-issues.md` |
| Research / Experiments (phases 8–10) | `references/research-experiments.md` |
| Follow-up Interview, Article Brief, Outline, Draft (phases 11–14) | `references/brief-outline-draft.md` |
| Humanity Interview, Human Pass (phases 15–16) | `references/human-pass.md` |
| Final Evidence Check / Claims Audit (phase 17) | `references/claims-audit.md` |

Load exactly one reference file when entering its phase group — never load
ahead, never keep two phase groups open at once.
