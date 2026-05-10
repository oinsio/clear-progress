---
paths:
  - "openspec/changes/**/design.md"
---

# Rule: design.md — local technical decisions

`design.md` inside a change folder is for non-trivial technical decisions scoped to THIS change. Not every change needs one.

## When to create design.md

- There is a real architectural choice (e.g., "LWW vs CRDT for conflict resolution in this feature")
- Multiple implementation approaches exist and the reasoning should be recorded
- The decision has trade-offs worth documenting

## When NOT to create design.md

- The implementation is straightforward — no alternatives to consider
- The decision is global and not tied to this change — use `docs/adr/` instead

## Required sections

```markdown
# Design: <Change name>

## Context
What drove this decision. Reference FR/NFR from proposal.md.

## Decision
What exactly was decided. Be specific.

## Consequences
Positive:
- ...

Negative:
- ...

## Alternatives Considered
**<Alternative 1>**: why considered and why rejected
```

## Rules

- Always reference the FR/NFR/UX from proposal.md that drove the decision
- Keep it concise — this is not a research paper
- If the decision applies beyond this change, it belongs in `docs/adr/NNNN-*.md`
- Local decisions in design.md get archived with the change and are not meant to be updated later
