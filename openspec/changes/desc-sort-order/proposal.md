# desc-sort-order

## Why

When a user creates a new Goal, Idea, Context, or Category, the item appears at the bottom of the list (ASC sort). If the list is long enough to scroll, the new item is invisible, creating the impression that nothing happened. Tasks already use DESC sorting (newest on top), providing immediate visual feedback. Aligning all entity lists to DESC removes this UX inconsistency.

## What Changes

- **MODIFIED**: Sort direction for Goals, Ideas, Contexts, and Categories changes from ASC to DESC
- New items appear at the top of their respective lists (same as Tasks)
- Drag-and-drop neighbor logic in page components updated to match DESC semantics
- Existing `sort_order` values are not migrated; the visual order inverts for existing data (acceptable for single-user app with little data)
- ChecklistItems and Attachments remain ASC (unchanged)

## Goals

- **G1**: New Goals/Ideas/Contexts/Categories appear at the top of the list immediately after creation
- **G2**: Consistent sort behavior across all primary entity lists (Tasks, Goals, Ideas, Contexts, Categories)

## Non-Goals

- **NG1**: Changing sort order for ChecklistItems or Attachments
- **NG2**: Data migration to preserve existing visual order
- **NG3**: Adding user-configurable sort direction

## Users & Scenarios

- **U1**: User creates a new Goal — it appears at the top of the Goals list, immediately visible

## Requirements

### Functional

- **FR1**: Goals list sorted by `sort_order` DESC (highest key first)
- **FR2**: Ideas list sorted by `sort_order` DESC (highest key first)
- **FR3**: Contexts list sorted by `sort_order` DESC (highest key first)
- **FR4**: Categories list sorted by `sort_order` DESC (highest key first)
- **FR5**: New Goals/Ideas/Contexts/Categories receive a sort key above the current maximum via `generateTopKey()`
- **FR6**: Drag-and-drop reorder works correctly with DESC sort direction for all four entities
- **FR7**: Rebalancing works correctly with DESC sort direction for all four entities

### Non-Functional

#### Performance

- **NFR-P1**: No performance regression — sort is O(n log n), same as before

## UX Acceptance Criteria

- **UX1**: After creating a Goal/Idea/Context/Category, the new item is visible at the top of the list without scrolling

## Behavior

Referenced in existing BDD features:
- `goals_ordering.feature` — update scenarios for DESC
- `ideas_ordering.feature` — update scenarios for DESC
- `contexts_ordering.feature` — update scenarios for DESC
- `categories_ordering.feature` — update scenarios for DESC

## Affected IA

No changes.

## Success Metrics

- **M1**: All four entity lists sort DESC — verified by updated BDD tests passing
- **M2**: Drag-and-drop reorder works correctly — verified by existing reorder BDD tests passing with updated sort direction

## Open Questions

None.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goals`: Sort direction changes from ASC to DESC (FR1, FR5, FR6, FR7)
- `ideas`: Sort direction changes from ASC to DESC (FR2, FR5, FR6, FR7)
- `contexts`: Sort direction changes from ASC to DESC (FR3, FR5, FR6, FR7)
- `categories`: Sort direction changes from ASC to DESC (FR4, FR5, FR6, FR7)

## Impact

- `GoalService.ts` — sort direction, rebalance sort
- `IdeaService.ts` — sort direction, rebalance sort
- `ContextService.ts` — sort direction, rebalance sort
- `CategoryService.ts` — sort direction, rebalance sort
- `GoalsPage.tsx` — handleDragEnd neighbor logic
- `IdeasPage.tsx` — handleDragEnd neighbor logic
- `ContextsPage.tsx` — handleDragEnd neighbor logic
- `CategoriesPage.tsx` — handleDragEnd neighbor logic
- BDD feature files and step definitions for ordering
