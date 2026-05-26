# Design: Deleted Entities Spec

## Context

The deleted-entities feature aggregates soft-deleted records from 5 entity types (tasks, goals, contexts, categories, checklist_items) using Dexie liveQuery subscriptions. Restore sets `is_deleted = false` via existing service methods and schedules a sync push. This is a spec-and-test-only change driven by FR1-FR8 from proposal.

## Decision

### Decision 1: BDD tests at hook level using fake-indexeddb

Test `useDeletedEntities` aggregation logic by seeding entities directly into the Dexie database (via fake-indexeddb) and verifying the hook returns correct filtered results. This matches the pattern used in other BDD tests (settings, tasks, goals).

For `useRestoreEntity`, test the restore flow by calling the underlying service methods directly (not the hook, which depends on React context). This avoids the complexity of mocking SyncProvider while still verifying the core behavior.

Alternative considered: Testing the hooks via renderHook with mocked SyncProvider — rejected because it adds React rendering complexity without testing additional business logic.

### Decision 2: Three feature files split by behavior aspect

Split into aggregation (FR1, FR3, FR4, FR5), restore (FR2, FR8), and checklist context (FR6). Each file stays under 400 lines and focuses on a single behavior aspect.

Alternative considered: Single feature file — rejected because it would exceed 400 lines and mix unrelated concerns.

## Consequences

Positive:
- Tests verify actual IndexedDB filtering logic, not mocked behavior
- Feature files are small and focused, easy to maintain

Negative:
- Restore tests use services directly instead of hooks — hook-level integration (schedulePush) is not tested in BDD
