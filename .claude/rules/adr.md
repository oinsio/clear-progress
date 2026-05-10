---
paths:
  - "docs/adr/**"
---

# Rule: Architecture Decision Records

Global ADRs capture long-lived architectural decisions NOT tied to a single change. For change-scoped decisions, use `openspec/changes/<change>/design.md` instead.

## When to create a global ADR

- Technology or stack choice (e.g., "use IndexedDB via Dexie")
- Cross-cutting architectural pattern (e.g., "hexagonal architecture")
- Authentication/authorization strategy
- Sync protocol design decisions
- Any decision that affects multiple features or the project as a whole

## File naming

`docs/adr/NNNN-kebab-case-title.md` — four-digit sequential number.

## Required format

```markdown
# ADR-NNNN: <short decision title>

## Status
Accepted (YYYY-MM-DD)
<!-- or: Proposed | Rejected | Deprecated | Superseded by ADR-YYYY -->

## Context
<What drove this decision. Not tied to one feature.>

## Decision
<What exactly was decided. Be specific.>

## Consequences
Positive:
- ...

Negative:
- ...

## Alternatives Considered
**<Alternative 1>**: <why considered and why rejected>

## Migration Path (optional)
```

## Rules

- Never edit an accepted ADR to change the decision — create a new one with `Superseded by ADR-YYYY`
- Reference related changes from `openspec/` if applicable
- Keep Context focused on WHY, not on implementation details
