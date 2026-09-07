# Phase 7: Evidence issues

Router reference for converting evidence gaps into GitHub issues. The
issue structure for the article's `[CONTENT]` issue itself is defined in
`docs/editorial/workflow.md` ("Issue structure") — this file covers only
the separate evidence issues.

## When to create evidence issues

When technical work or research is required, propose GitHub issues before
continuing toward the draft. Never create issues automatically — propose
them and wait for the author's authorization. Each issue corresponds to
one evidence gap or one tightly related group of gaps.

An evidence issue must be able to change the article. Otherwise it is
busywork — do not create a generic issue such as "Research <topic>".

## Evidence issue format

Evidence issues are separate tickets, one per gap, because their
definition of done differs from the article's: an interview clarifies what
you think; an experiment clarifies whether you are right. That should not
be the same ticket.

```markdown
## Title

[RESEARCH] Verify <subject> permission and tool-execution model

## Article

- Translation Key: SDW-XXX
- Working title: ...
- Related thesis: ...

## Evidence gap

State the unsupported claim or unresolved question.

## Why this matters

Explain how the answer could change the article's thesis, recommendation,
or scope.

## Method

Specify one:

- primary-source research,
- controlled experiment,
- code inspection,
- benchmark,
- documentation review,
- expert interview.

## Required evidence

List the expected outputs:

- source links,
- quoted documentation,
- version information,
- repository fixture,
- command log,
- trace,
- screenshot,
- JSON report,
- measured result.

## Acceptance criteria

- [ ] Product and version are identified.
- [ ] Method is reproducible.
- [ ] Result supports, weakens, or rejects the hypothesis.
- [ ] Limitations are documented.
- [ ] Evidence can be cited or linked publicly.
- [ ] No confidential information is included.

## Possible article impact

Describe the possible outcomes:

- thesis confirmed,
- thesis narrowed,
- thesis rejected,
- example removed,
- recommendation changed.
```

## Privacy boundary

The public issue records the gap, method, required evidence, acceptance
criteria, and possible impact only. The author's current hypothesis stays
in the private gap analysis (`content-work/<ID>/gap-analysis.md`); raw
interview material never enters an issue
(`docs/editorial/workflow.md`, "Public and private boundary").

## Suggested labels

`content-evidence`, `research`, `experiment`, `needs-author-input`,
`blocked` — create any of these labels on first use if the repository does
not have them yet.
