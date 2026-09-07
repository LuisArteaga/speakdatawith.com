# Phases 1–3: Topic, Experience Interview, emotional reality

Router reference for the opening phase group. The lifecycle, gates, and
artifacts are governed by `docs/editorial/workflow.md`; this file only
elaborates how to conduct these phases. Do not research, outline, or draft
during any of them.

## Phase 1 — Receive the topic without solving it

When the author provides a topic, do not respond with an article outline.
Begin by restating the topic as a provisional problem, not as a settled
thesis — record it in `content-work/<ID>/topic.md` together with the open
ambiguities and the intended reader.

Identify the obvious ambiguities and carry them into the interview as
questions, not assumptions:

- Is this based on direct use or desk research?
- Is the article about the product, a broader category, or a specific
  engineering problem?
- Is the intended article explanatory, evaluative, comparative, or
  argumentative?
- Is the scenario observed, reconstructed, or synthetic?
- Who needs to make a decision after reading it?

### First-response shape for a new topic

1. **My current understanding** — briefly restate the topic and the
   experience without adding facts.
2. **What appears to be the underlying decision** — the provisional
   decision the article may help the reader make.
3. **What must not be assumed yet** — list missing or ambiguous
   information.
4. **Interview round 1** — no more than five questions, beginning with the
   concrete experience.

## Phase 2 — Conduct the experience interview

The first interview recovers the author's actual experience and point of
view before outside research influences it. Work in small rounds of three
to five substantive questions. After each round: summarize the answers,
identify emerging beliefs, note contradictions or ambiguity, ask whether
the summary is accurate, then continue. Follow interesting details instead
of marching a checklist. Prefer concrete events over general opinions.

The interview moves through four recoveries, in order: concrete
experience → prior assumptions → judgment → language.

### Start with the concrete experience

- What caused you to look at this topic now?
- What were you trying to accomplish?
- What did you expect to happen?
- What actually happened?
- Which specific output, file, command, trace, conversation, or result
  changed your interpretation?
- At what point did the situation become interesting or uncomfortable?
- What did you initially dismiss as unimportant?
- What did you check next?
- What decision changed afterward?

If the author says something like "the result was strange", probe: What
exactly was strange? What did you see? What had you expected instead? Why
did the difference matter? Do not replace missing detail with polished
prose.

### Recover the author's prior assumptions

- What did you believe before this experience?
- Why did that belief seem reasonable?
- Was it based on documentation, habit, another tool, or team practice?
- Which part of the assumption survived?
- Which part failed?
- What do you believe now?
- How confident are you?

The goal is not to manufacture a dramatic reversal. A useful article may
show a refinement rather than a conversion.

### Recover the author's judgment

- What is your current opinion?
- What do you think most practitioners get wrong?
- Which popular explanation feels incomplete?
- What advice would you reject?
- What default decision would you recommend today?
- Under which conditions would your recommendation change?
- What trade-off are you willing to accept?
- Which trade-off do others underestimate?
- What would make you change your mind?

Do not push the author toward contrarianism for its own sake. A thesis
must be genuinely held.

### Recover the author's language

Notice and retain: recurring phrases, preferred technical terminology,
spontaneous metaphors, dry remarks, sentence rhythm, expressions of doubt,
and distinctions the author considers important. Record them in
`content-work/<ID>/author-language-bank.md` under three headings —
**Preferred terms**, **Natural phrases** (verbatim quotations), **Avoid**
(words the author rejects). Only store language the author actually used
or explicitly approved; never manufacture quotations.

Write each round's approved summary to
`content-work/<ID>/interview-notes.md` — approved summaries only, never
raw transcripts.

## Phase 3 — Interview the emotional reality

Personal writing requires more than adding the word "I". Ask about emotion
where it affected attention, interpretation, or decision-making. This is
an editorial interview, not therapy.

- What did you feel when the result first appeared?
- Were you relieved, impressed, suspicious, annoyed, amused, embarrassed,
  or something else?
- What caused that reaction?
- Did your reaction change after inspecting the details?
- Was there a moment where you hesitated?
- Did you want the result to be correct?
- Were you surprised by the system, or by your own assumption?
- What made the experience memorable?
- Which detail still bothers you?
- Is there anything mildly absurd or funny about what happened?
- What would you be comfortable saying publicly?
- What should remain private?

Do not infer emotions solely from events; if emotional context is unclear,
ask. Do not exaggerate a mild concern into fear, frustration, or a crisis
— preserve the author's emotional intensity accurately.

### Emotion must have technical consequence

Include an emotional observation only when it explains why the author
initially trusted a result, why a problem was overlooked, why a detail
attracted attention, why an assumption changed, why a control was added,
or why a decision became difficult.

Good: "I wanted the run to count as a success. The diff was small, the
test was green, and I had already spent enough time on the setup. That
made the second changed file easier to rationalize than to investigate."

Weak: "I felt many emotions during this journey."

Personal does not mean sentimental; it means consequentially specific.

---

This skill does not generate the author's voice. It keeps asking good
questions until enough of the author's voice exists that nothing needs to
be invented.
