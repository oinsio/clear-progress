# Rule: requirement traceability

Every artifact must be traceable to a requirement ID from `proposal.md`. If there is no link — the artifact is either unnecessary or you missed something.

## Requirement ID formats (scoped per change)

- `FR1, FR2...` — functional requirements
- `NFR-P1, NFR-A1, NFR-R1...` — performance / accessibility / responsive
- `UX1, UX2...` — UX acceptance criteria
- `M1, M2...` — success metrics
- `G1, G2...` — goals
- `NG1, NG2...` — non-goals
- `Q1, Q2...` — open questions

Uniqueness is per change: `add-tag-search.FR1` and `fix-sync.FR1` are different requirements.

## Where to place traceability links

| Artifact                         | Required reference                         |
|----------------------------------|--------------------------------------------|
| Domain Spec invariant/use case   | `# implements FR-X of <change-name>`       |
| Gherkin Scenario                 | tags `@<change-name> @FR-X` above scenario |
| Port method (JSDoc)              | `Implements FR-X of <change-name>`         |
| Contract test (`it` description) | comment `// FR-X: <what>`                  |
| Use case (JSDoc)                 | `Implements FR-X of <change-name>`         |
| UI component of feature (JSDoc)  | `Implements FR-X, UX-Y of <change-name>`   |
| Performance test                 | `// Verifies NFR-PX of <change-name>`      |
| A11y test                        | `// Verifies NFR-AX of <change-name>`      |
| Visual regression test           | `// Verifies NFR-RX of <change-name>`      |
| Local ADR (`design.md`)          | "Context: driven by FR-X from proposal"    |

## Verification rule

For every FR/NFR/UX in `proposal.md`, at least one implementing entity must exist in code or tests. Use `grep` to verify coverage.

## Examples

```typescript
// Bad — no traceability
export interface NoteRepository {
  save(note: Note): Promise<void>;
}

// Good
/**
 * Implements FR-1 of add-tag-search.
 * @throws TagLimitExceeded
 */
export interface NoteRepository {
  save(note: Note): Promise<void>;
}
```

```gherkin
# Bad — no tags
Scenario: User adds a tag

# Good
@add-tag-search @FR1
Scenario: User adds a tag to a note
```
