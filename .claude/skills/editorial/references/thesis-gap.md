# Phases 4–6: Thesis Map, Gap Analysis, Evidence Backlog

Router reference for the structuring phase group. After the experience
interview, structure what exists — do not write the article yet. All
results go into the private working set under `content-work/<ID>/`.

## Phase 4 — Build the Thesis Map

Create `content-work/<ID>/thesis-map.md` with exactly these sections:

- **Topic** — the broad subject under discussion.
- **Decision** — the concrete decision the reader needs to make.
- **Primary reader** — role, context, and level of technical maturity.
- **Trigger** — the event or condition that makes the article relevant now.
- **Current thesis** — a clear statement of what the author currently
  believes.
- **Conventional assumption** — the common belief the thesis challenges or
  refines.
- **Why the conventional assumption appears reasonable** — the conditions
  under which it seems correct.
- **Failure mechanism** — the condition under which the assumption breaks
  down.
- **Direct observations** — claims based on the author's own experience.
- **Interpretations** — conclusions inferred from those observations.
- **External claims** — claims that require documentation, market data,
  standards, or other sources.
- **Proposed recommendation** — the decision the author currently expects
  to recommend.
- **Conditions that would change the recommendation** — explicit
  exceptions and boundaries.
- **Confidence** — high, medium, or low for each major claim.

Ask the author to correct the Thesis Map. Do not continue until the author
confirms that it reflects their current view.

## Phase 5 — Perform the gap analysis

The gap analysis determines whether a high-quality article can be written
from the available material. Classify every material claim in
`content-work/<ID>/gap-analysis.md` into one of these categories:

- **A. Directly observed** — the author personally observed the event or
  result. Support may include notes, screenshots, command output, a git
  diff, a trace, a query result, a workflow run, or memory clearly labelled
  as memory.
- **B. Reproducible** — the claim can be demonstrated through a controlled
  experiment. Support may include a repository fixture, test case,
  synthetic failure, benchmark, workflow, or evidence report.
- **C. Externally verifiable** — the claim depends on an external source.
  Support may include official documentation, source code, release notes,
  technical standards, vendor pricing, public benchmarks, or regulatory
  text.
- **D. Interpretive** — the author's analysis or judgment. It does not
  require proof in the same way as a factual claim, but its reasoning must
  be explicit.
- **E. Unknown** — the current material does not support the claim.
  Unknowns must not appear as facts in the article.
- **F. Private or unusable** — the claim depends on confidential
  information, private customer context, or evidence that cannot be
  published. Determine whether it can be anonymized, reconstructed,
  replaced with a synthetic scenario, expressed only as a limited
  observation, or omitted.

## Phase 6 — Produce the evidence gap table

Extend `gap-analysis.md` with one row per claim:

| Claim | Type | Current support | Confidence | Gap | Required action |
| --- | --- | --- | --- | --- | --- |
| The agent changed a file outside the requested scope | Direct observation | Local git diff | High | Diff not preserved | Reproduce and save sanitized diff |
| Output-only review is insufficient for agents | Interpretation | One observed run | Medium | Claim may be too broad | Define conditions and find counterexamples |
| The agent can execute shell commands | External fact | Product documentation needed | Unknown | No primary source | Research official documentation |
| A trajectory check would detect the behavior | Reproducible | Not tested | Low | No experiment | Build controlled test case |

For every gap, recommend exactly one of:

```text
RESEARCH
EXPERIMENT
AUTHOR INTERVIEW
SCOPE LIMITATION
REMOVE CLAIM
```

Use the right source for the right gap: do not use research to answer a
question about the author's own opinion, and do not ask the author to
remember something that can be measured. The classified claims and their
required actions form the Evidence Backlog; convertible gaps move on to
evidence issues (`references/evidence-issues.md`).
