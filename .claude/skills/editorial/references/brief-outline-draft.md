# Phases 11–14: Follow-up interview, brief, outline, first draft

Router reference for the drafting phase group. No draft exists before the
brief and the outline are approved; the draft then follows the Editorial
Voice rules at the end of this file.

## Phase 11 — Return to the interview after evidence changes

Research and experiments often change the article. Do not silently update
the thesis — conduct a follow-up interview:

- Which result surprised you?
- Did any evidence contradict your original view?
- Which claim became stronger?
- Which claim now needs to be narrowed?
- Did the result change your recommendation?
- What remains unresolved?
- What do you now think practitioners should do differently?
- Which result matters most to you personally?
- Was any result disappointing, reassuring, annoying, or unexpectedly
  mundane?
- What would you say now that you would not have said before the test?

Update the Thesis Map and ask for confirmation again. Write the round's
approved summary to `content-work/<ID>/interview-notes.md`. The author
owns the conclusion; the evidence constrains it; the session does neither
alone.

## Phase 12 — Produce the article brief

Only after the Thesis Map and the Evidence Backlog are sufficiently
resolved, create `content-work/<ID>/article-brief.md`:

- **Working title** — a thesis-driven title.
- **Primary reader** — one primary technical role.
- **Secondary reader** — optional commercial or leadership role.
- **Reader's decision** — the concrete decision the article helps make.
- **Trigger** — why the reader needs this now.
- **Core thesis** — the author's confirmed thesis.
- **Opening material** — the specific scene, observation, result, or
  thesis used to begin.
- **Problem Space** — the failure, constraint, incentive, and consequence
  before discussing tools.
- **Solution Space** — the implementation and its trade-offs.
- **Evidence** — the experiment, sources, metrics, artifacts, and links.
- **Known limitations** — what the evidence does not prove.
- **Personal material** — approved observations, reactions, phrases, and
  details.
- **Claims to avoid** — unsupported, private, overbroad, or rejected
  claims.
- **Primary CTA** — one concrete next action.

Do not produce an outline until the author approves the brief.

## Phase 13 — Create an outline that follows the argument

Create `content-work/<ID>/outline.md`. Headings must advance claims rather
than label topics.

Good headings:

- The green check answered the easiest question
- The agent changed exactly what its permissions allowed
- Output quality concealed the risky execution path
- A trajectory test made the hidden behavior reviewable

Weak headings: Introduction · Architecture · Advantages · Limitations ·
Conclusion.

Do not force a fixed number of sections. Do not invent a named framework
unless it compresses a recurring decision into a reusable model. The
outline must connect:

```text
observed tension
→ reasonable assumption
→ failure mechanism
→ evidence
→ implementation
→ limitation
→ decision
```

Ask the author to approve or modify the outline.

## Phase 14 — Write the first draft

Write `content-work/<ID>/draft.md` based only on: approved interview
material, the approved Thesis Map, completed evidence work, traceable
research, the approved Article Brief, and the approved outline.

Do not add: invented anecdotes, invented emotions, invented customer
examples, unverified market claims, synthetic quotations, unsupported
certainty.

If a transition requires information that is still missing, insert
`[AUTHOR INPUT REQUIRED: ...]` or `[EVIDENCE GAP: ...]` — never disguise
the gap with generic prose.

## Editorial voice

The voice rules for the draft. They are elaborations of
`docs/editorial/workflow.md` ("Editorial voice (summary)") — the contract
summarizes; this section is the full guide.

### Begin with tension, not a template

Open with either a sharp, defensible thesis, or a concrete moment that
makes the thesis unavoidable. When using a scene, reach the central
tension within the first three paragraphs. Do not begin with generic
industry context, an agenda, or a definition the target reader already
knows.

### Explain why the mistaken assumption was reasonable

Do not merely declare that conventional wisdom is wrong. Explain: why it
appears reasonable, which hidden condition it depends on, where the
condition fails, and what the failure changes in practice. Criticize
mechanisms and incentives more often than people.

### Separate Problem Space from Solution Space

Establish the decision, constraint, failure mode, and consequence before
introducing the tool or architecture. Do not mistake a new technology for
a new problem.

### Use frameworks only when they earn their name

A framework must help the reader make the same class of decision
elsewhere. Do not invent labels merely to make an article appear
structured.

### Ground arguments in operational reality

Prefer details such as: a changed file, a command, a git diff, a workflow
run, a trace, permissions, review time, query history, cost, failure rate,
maintenance burden. One observed detail is worth more than five abstract
adjectives.

### Vary the rhythm

Mix developed paragraphs with occasional short observations. Use punchlines
sparingly: a short sentence must crystallize an argument, not simulate
confidence. Avoid repetitive rhetorical constructions such as "This is not
X. It is Y.", "The uncomfortable truth is...", "Ignore this at your
peril.", "Let that sink in.", and repeated sets of three short declarative
sentences.

### Preserve uncertainty accurately

Distinguish observation, inference, hypothesis, external fact, and
unresolved question. Take a clear position, but state the conditions that
would change it. Do not claim more than the evidence proves.

### End with a decision

Do not summarize the article mechanically. End with a recommended default,
a test the reader should run, a control to add, a deployment condition, or
an experiment to reproduce.
