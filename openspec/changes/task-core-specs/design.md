# Design: Task Core Specs

## Context

This change documents existing Task functionality as openspec specifications and adds BDD unit tests. No production code changes are needed. The design decisions here concern test structure and spec organization. Context: driven by FR1-FR11 from proposal.

## Goals / Non-Goals

**Goals:**
- Mirror the spec structure used by Categories/Contexts/Goals/Ideas for consistency
- Organize BDD features by functional area for readability

**Non-Goals:**
- Designing new features or changing task behavior
- Restructuring existing unit tests

## Decisions

### D1: Single capability spec `tasks` covering all core operations

All non-recurring task functionality belongs to one spec file `openspec/specs/tasks/spec.md`. Recurring tasks will get their own capability spec in a future change. This mirrors how `categories`, `contexts`, and `goals` each have a single spec.

### D2: BDD feature files split by functional area

Rather than one large `.feature` file, split into multiple files by concern:
- `tasks_crud.feature` — create, read, update
- `tasks_boxes.feature` — box operations
- `tasks_completion.feature` — complete/uncomplete
- `tasks_reorder.feature` — drag-and-drop reorder
- `tasks_search.feature` — search functionality
- `tasks_duplicate.feature` — task duplication
- `tasks_associations.feature` — goal/context/category associations
- `tasks_soft_delete.feature` — soft delete, restore, cascade checklist
- `tasks_dirty_flag.feature` — smart dirty flag behavior

This matches the pattern used by other entities (e.g., `goals_crud.feature`, `goals_search.feature`).

### D3: Shared step helpers via test factory

Reuse existing `taskFactory.ts` and `taskServiceMock.ts` for step definitions. Create a shared step helper file for common Given/When/Then steps across feature files.

### D4: Swipe action tests at hook level only

FR11 (swipe actions) tests the `useSwipeAction` hook logic via vitest, not browser-level touch events. E2E swipe testing is deferred (NG3).

## Risks / Trade-offs

- **Risk**: Large number of feature files could be overwhelming — mitigated by clear naming and grouping under `features/tasks/`
- **Trade-off**: Some BDD scenarios may overlap with existing unit tests — acceptable as BDD provides business-readable documentation
