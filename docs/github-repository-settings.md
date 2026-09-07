# GitHub repository settings

These settings are configured manually in the GitHub UI. Nothing in this
repository applies them automatically, and no automation holds the
permissions to do so.

## Merge methods

Repository → Settings → General → Pull Requests:

| Setting | Value |
| --- | --- |
| Allow squash merging | enabled |
| Allow merge commits | disabled |
| Allow rebase merging | disabled |
| Automatically delete head branches | enabled |

## Ruleset for `main`

Repository → Settings → Rules → Rulesets → New branch ruleset:

| Rule | Value |
| --- | --- |
| Pull request required | enabled |
| Required status check | `validate-site` (job name from `.github/workflows/validate-site.yml`) |
| Direct pushes to `main` | blocked |
| Force pushes | blocked |
| Branch deletion | blocked |
| Linear history | required |
| Required approvals | optional decision for a solo repository |

For a solo repository, requiring a second approval can block the workflow
unnecessarily. Leaving "Required approvals" at 0 while keeping the pull
request requirement keeps the history and checks without inventing
reviewers.

## How the quality gates fit in

In addition to `validate-site`, four supplementary gates from the
[quality-gates-toolkit](https://github.com/LuisArteaga/quality-gates-toolkit)
run on every pull request (secret scan, LLM-based review, and the JavaScript
gates `js-typecheck`/`js-test`; see
`docs/quality-gates.md`). They are not required status checks; the only
required check is `validate-site`.

## Why squash merging, and what it does not do

- Squash merging collapses a pull request into one commit on `main`. This
  keeps the history of `main` clean and linear.
- It cleans only the history of `main`. Commits that were pushed to the
  feature branch were already public at that point — anyone could have
  observed them, and they remain retrievable in the pull request timeline.
- Therefore: finish and clean up work commits locally before the first
  push. Do not push intermediate states and rely on squash to hide them
  later.

## Commit email

Use the GitHub-provided noreply email address as the commit email
(GitHub → Settings → Emails → "Keep my email addresses private"), so
personal email addresses do not end up in public commit metadata.

## Supply-chain hardening (follow-up)

The workflows currently pin the official actions to their major versions
(`actions/checkout@v7`, `actions/setup-node@v7`). As a later hardening step,
pin them to full commit SHAs so that a compromised tag cannot redirect the
workflow. This applies to:

- `.github/workflows/validate-site.yml`
- the toolkit workflow references in `.github/workflows/quality-gates.yml`
  (pinned to the toolkit's immutable release tag `v1.3.0`)
