---
paths:
  - "openspec/changes/**/proposal.md"
---

# Rule: proposal.md format

The proposal is the PRD of a change. It describes WHAT we build and WHY, never HOW (that goes into `design.md`).

## Required sections

Every proposal.md must contain:

1. **Why** — problem, audience, urgency
2. **What Changes** — ADDED / MODIFIED / REMOVED capabilities
3. **Goals** — G1, G2... (measurable)
4. **Non-Goals** — NG1, NG2... (explicitly out of scope)
5. **Users & Scenarios** — U1, U2...
6. **Requirements**
   - Functional: FR1, FR2...
   - Non-Functional Performance: NFR-P1...
   - Non-Functional Accessibility: NFR-A1...
   - Non-Functional Responsive: NFR-R1...
7. **UX Acceptance Criteria** — UX1, UX2...
8. **Success Metrics** — M1, M2... (concrete numbers, not "works well")
9. **Open Questions** — Q1, Q2...

## Conditional sections

- **UI States Matrix** — required for features with lists, data loading, or complex state. Columns: Network | Data | UI
- **Behavior** — reference to `packages/client/src/test/features/<name>/*.feature` with `@<change-name>` tags
- **Visual Reference** — Figma link. Design is a reference; design tokens are the source of truth
- **Affected IA** — "no changes" or "requires IA-XXXX update"

## Rules

- Every requirement MUST have an ID (FR1, NFR-P1, UX1, etc.)
- Success metrics must be concrete and measurable (not "feature works")
- Non-Goals are as important as Goals — they prevent scope creep
- No implementation details — "use Redux" or "add a table column" belong in design.md
- UX criteria describe subjective expectations that must be explicitly agreed upon
