## Context

Goals, Ideas, Contexts, and Categories currently sort by `sort_order` ASC — new items go to the bottom of the list. Tasks already use DESC sorting. This inconsistency causes a UX issue: newly created items may not be visible without scrolling. Driven by FR1-FR7 from proposal.

The app uses fractional indexing (`fractional-indexing` library) for sort keys. `generateTopKey()` and `generateAppendKey()` are aliases — both generate a key above the current maximum. The difference in behavior comes from the sort direction in each service.

## Goals / Non-Goals

**Goals:**
- Align sort direction to DESC for Goals, Ideas, Contexts, Categories
- Keep drag-and-drop working correctly with the new sort direction

**Non-Goals:**
- No data migration (inversion of existing order is acceptable)
- No changes to ChecklistItems or Attachments
- No changes to `SortOrderService.ts` itself

## Decisions

### D1: Invert sort comparator in services

**Decision:** Change `compareSortKeys(A, B)` to `compareSortKeys(B, A)` in sort functions and rebalance methods.

**Rationale:** Minimal change, same pattern as `TaskService.ts`. The `generateTopKey()` call remains the same — it already produces the correct key. Only the sort direction determines where the item appears visually.

**Alternatives:** Could rename imports from `generateAppendKey` to `generateTopKey` for clarity. Not strictly necessary since they're aliases, but improves readability. Will rename.

### D2: Mirror TaskList handleDragEnd pattern for page components

**Decision:** In `GoalsPage`, `IdeasPage`, `ContextsPage`, `CategoriesPage` — change the `handleDragEnd` neighbor logic from ASC to DESC pattern (swap upper/lower assignment, matching `TaskList.tsx`).

**Rationale:** With DESC sort, index 0 has the highest key (not the lowest). The neighbor logic must reflect this. `TaskList.tsx` already implements the correct DESC pattern.

## Risks / Trade-offs

- [Risk] Existing visual order inverts for all entities → Acceptable for single-user app with minimal data. No mitigation needed.
- [Risk] BDD tests hardcode ASC expectations → Update test scenarios and step definitions to expect DESC order.
