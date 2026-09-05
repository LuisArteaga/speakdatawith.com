# Quality Gates

This repository runs two quality gates from the
[quality-gates-toolkit](https://github.com/LuisArteaga/quality-gates-toolkit)
(pinned to release `v1.0.2`), configured in
[`.github/workflows/quality-gates.yml`](../.github/workflows/quality-gates.yml).
Both jobs run in parallel on every pull request targeting `main`.

| Gate | Toolkit workflow | What it does |
|---|---|---|
| `secret-scan` | `secret-scan.yml@v1.0.2` | Language-agnostic secret scanner (pure stdlib) over all tracked files. Runs on every PR, including fork PRs. |
| `llm-pr-review` | `llm-pr-review.yml@v1.0.2` | Diff-based LLM review by four judges; posts a review containing the versioned `llm-pr-review-verdicts` block (toolkit decision D-0002). |

The Python-specific toolkit workflows (`pr-checks`, `lint`, `test`,
`diff-coverage`, `security`) are not wired up: this is an Astro/npm project,
and those gates target the Python ecosystem.

## Judge configuration

`config/factory.json` holds the judge model and routing configuration. It is
consumer-owned (toolkit input `config-path`) and contains **no secrets**. It
is derived verbatim from the toolkit's `config/factory.example.json`:

| Judge | Model | Routing | Fallback model |
|---|---|---|---|
| `syntax_lint` | `z-ai/glm-5.3-flash` | auto-route (OpenRouter picks the provider per request, automatic failover) | `z-ai/glm-5.2` |
| `test_coverage` | `z-ai/glm-5.3-flash` | pinned wide-curated fp8 provider order | `z-ai/glm-5.2` |
| `architecture` | `z-ai/glm-5.3-flash` | pinned wide-curated fp8 provider order | `moonshotai/kimi-k3` |
| `security` | `moonshotai/kimi-k3` | pinned provider order, `reasoning.effort: high` | `z-ai/glm-5.2` |

Routing modes follow the toolkit README (`#routing-modes`): omitting `routing`
lets OpenRouter route per request with automatic failover; a pinned provider
list restricts routing to quality-curated endpoints and disables failover.

## Secrets

Both are repository secrets (GitHub → Settings → Secrets and variables →
Actions); nothing is stored in code:

| Secret | Required | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes, as soon as `llm-pr-review` is active | API key for the LLM judges. The workflow fail-fasts before any API spend when it is unset. |
| `JUDGE_GH_TOKEN` | No | GitHub token used to post the review. Falls back to the workflow's default token, so reviews are authored by `github-actions[bot]`. A PAT is only needed by consumers that verify review authorship (toolkit decision D-0005) — this repository does not. |

## Fork pull requests

The `llm-pr-review` job is guarded by
`github.event.pull_request.head.repo.full_name == github.repository` and is
skipped cleanly on fork PRs, because repository secrets are not available
there. The `secret-scan` job needs no secrets and runs on every PR.

## Relationship to the deterministic site checks

The deterministic validation for the Astro site (`validate-site.yml` with
`npm run check` and `npm run build`, issue #1) remains the deterministic gate
and runs unchanged alongside these supplementary toolkit gates.

## Upgrades

Both `uses:` references pin the exact toolkit release tag (`v1.0.2`); there is
no floating ref. Upgrades happen as a deliberate commit that bumps both pins
to the new tag (toolkit decision D-0007).
