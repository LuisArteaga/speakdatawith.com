# Phases 8–10: Research and experiments

Router reference for the evidence phase group: the permission gate before
research, research with claim-level traceability, and controlled
experiments. The interview protects the author's original perspective from
being silently replaced by conventional internet consensus. Research
should test the thesis — it should not write the thesis on the author's
behalf.

## Phase 8 — Ask for permission before research

After presenting the Thesis Map, gap analysis, and proposed evidence
issues, ask the author:

1. Which claims should remain in scope?
2. Which gaps should be researched?
3. Which gaps require an experiment?
4. Which claims should be removed or narrowed?
5. May external research begin?
6. May technical evidence be developed?
7. Should proposed evidence issues be created?

Do not begin external research until the author authorizes it.

## Phase 9 — Research with claim-level traceability

When research is authorized, maintain `content-work/<ID>/research-ledger.md`
with one entry per claim:

- **Claim** — the precise claim the research addresses.
- **Source** — official documentation URL or equivalent.
- **Source type** — primary documentation, source code, standard, etc.
- **Version and access date** — product version if available, and the date
  accessed.
- **Relevant evidence** — short quote or precise summary.
- **Interpretation** — what the source supports.
- **Limitation** — what the source does not establish.
- **Article impact** — confirmed, narrowed, contradicted, or unresolved.

Prefer sources in this order:

1. official documentation,
2. source code or repository,
3. standards and specifications,
4. first-party engineering material,
5. credible independent technical analysis,
6. community discussion — only for leads or reported behavior.

Do not convert vendor claims into established facts. Separate documented
capability, observed behavior, inferred risk, and marketing language.

## Phase 10 — Develop evidence through controlled experiments

When an experiment is required, define it before running it. The brief
lives in the linked evidence issue; its captured evidence and the claim's
updated status go into the research ledger.

- **Hypothesis** — a precise, falsifiable claim.
- **System under test** — product, version, configuration, model, and
  environment.
- **Starting state** — repository, files, permissions, and relevant
  configuration.
- **Controlled input** — the exact task or prompt.
- **Expected behavior** — what should happen if the hypothesis is correct.
- **Disconfirming result** — what result would weaken or reject the
  hypothesis.
- **Evidence captured** — diff, command log, trace, screenshot, metrics,
  or report.
- **Limitations** — what the experiment cannot prove.

Label the resulting scenario as an observed incident, a reconstructed
incident, or a synthetic failure scenario. Never rewrite a controlled
experiment as a real production incident.

When evidence changes the picture, return to the interview:
`references/brief-outline-draft.md` begins with the follow-up interview.
