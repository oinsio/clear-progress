---
paths:
  - "packages/client/src/components/**"
  - "packages/client/src/pages/**"
---

# Rule: UI implementation requirements

## UI States Matrix

Every UI feature with data loading or complex state must handle ALL states, not just the happy path:

| State    | Must be implemented                       |
|----------|-------------------------------------------|
| Loading  | Skeleton or spinner while data loads      |
| Error    | Error message with recovery action        |
| Empty    | Meaningful empty state (not blank screen) |
| Offline  | Indication that data may be stale         |
| Syncing  | Subtle indicator during background sync   |
| Conflict | Resolution UI if applicable               |

If the proposal.md includes a UI States Matrix — implement every row.

## Design system

- Use components from the shared UI library — do not create duplicates without justification
- No inline styles or magic numbers — use design tokens
- Figma is a reference, not source of truth. Source of truth: design tokens for values, Gherkin for behavior, IA for structure

## Optimistic updates

Client-first architecture means UI updates immediately on user action. Server sync happens in the background. Implement optimistic updates for all CRUD operations.

## Accessibility from day one

- axe-core assertions in E2E tests from the first PR
- Keyboard navigation: Tab, Enter, Esc must work
- aria-labels on interactive elements
- WCAG 2.1 AA contrast ratios
- Do not defer a11y to "later" — retrofitting is far more expensive

## Storybook

Create stories for every state (loading, error, empty, offline, data present). Stories serve as both documentation and visual regression test targets.
