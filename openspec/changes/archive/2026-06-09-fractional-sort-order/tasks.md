## 1. Setup and SortOrderService

- [x] 1.1 Install `fractional-indexing` npm package in `packages/client` (FR1)
- [x] 1.2 Create `SortOrderService` in `src/services/SortOrderService.ts` with methods: `generateTopKey`, `generateAppendKey`, `generateKeyBetween`, `rebalanceKeys`, `needsRebalancing` (FR1, FR6, FR9, D3)
- [x] 1.3 TDD: Unit tests for `SortOrderService` — key generation, ordering, rebalancing, threshold check (FR1, FR9)
- [x] 1.4 Add `SORT_ORDER_REBALANCE_THRESHOLD = 10` constant to `src/constants/` (FR9, D4)

## 2. Schema and Type Migration

- [x] 2.1 Change `sort_order` from `z.number()` to `z.string()` in `packages/contract/src/schemas/entities.ts` for all Wire schemas; update Supabase columns from `INTEGER` to `TEXT` in `001_create_tables.sql`, remove `::INTEGER` casts in `003_create_push_rpc.sql`, update serializers to `as string` (FR1, D6)
- [x] 2.2 Add Dexie version bump with `upgrade()` handler in DB schema: convert integer sort_order to fractional indexing strings — tasks in reverse order (DESC), non-task entities in natural order (ASC) (FR10, D5)
- [x] 2.3 TDD: Unit tests for migration — existing integer orders correctly converted to string keys preserving display order (FR10)

## 3. TaskService — Fractional Sort Order

- [x] 3.1 Change `sortBySortOrder` to sort by string comparison **descending** (FR2)
- [x] 3.2 TDD: Unit tests for descending sort order (FR2)
- [x] 3.3 Change `create()` to generate sort_order via `SortOrderService.generateTopKey` using global box maximum (FR3)
- [x] 3.4 TDD: Unit tests for task creation — new task at top of box, correct key from global max (FR3, UX1)
- [x] 3.5 Change `moveToBox()` to recalculate sort_order as top key in destination box (FR4)
- [x] 3.6 TDD: Unit tests for box transfer — task at top of new box, no-op for same box (FR4, UX2)
- [x] 3.7 Change `noncomplete()` to recalculate sort_order as top key in task's box (FR5)
- [x] 3.8 TDD: Unit tests for uncomplete — task at top of box (FR5, UX3)
- [x] 3.9 Change `reorderTasks()` to accept single task + new key instead of full array. Integrate rebalancing check (FR6, FR9)
- [x] 3.10 TDD: Unit tests for single-record reorder and lazy rebalancing (FR6, FR9, M1, M2)
- [x] 3.11 Update `getCompleted()` sort fallback from numeric to string comparison (FR2)

## 4. Non-Task Services — Fractional Sort Order

- [x] 4.1 Update `GoalService` — sort ascending by string, create with `generateAppendKey`, reorder with single-record update + rebalancing (FR8, FR6, FR9)
- [x] 4.2 TDD: Unit tests for GoalService sort, create, reorder (FR8)
- [x] 4.3 Update `IdeaService` — same pattern as GoalService (FR8, FR6, FR9)
- [x] 4.4 TDD: Unit tests for IdeaService (FR8)
- [x] 4.5 Update `CategoryService` — same pattern (FR8, FR6, FR9)
- [x] 4.6 TDD: Unit tests for CategoryService (FR8)
- [x] 4.7 Update `ContextService` — same pattern (FR8, FR6, FR9)
- [x] 4.8 TDD: Unit tests for ContextService (FR8)
- [x] 4.9 Update `ChecklistService` — same pattern (FR8, FR6, FR9)
- [x] 4.10 TDD: Unit tests for ChecklistService (FR8)

## 5. Hooks — Adapt to New Reorder API

- [x] 5.1 Update `useTasks` — change `reorderTasks` to accept single task + new sort_order key (FR6)
- [x] 5.2 Update `useGoalTasks` — adapt reorder to single-record API (FR6)
- [x] 5.3 Update `useFilteredTasks` — expose reorder method for category/context tasks (FR7)
- [x] 5.4 Update `useGoals`, `useIdeas`, `useCategories`, `useContexts`, `useChecklist` — adapt reorder to single-record API (FR6, FR8)

## 6. UI — Drag-and-Drop Changes

- [x] 6.1 Update `TaskList` `handleDragEnd` — calculate fractional key between neighbors instead of arrayMove, call reorder with single task (FR6, D3)
- [x] 6.2 Update `BoxSectionList` — pass reorder callback that accepts single task + key (FR6)
- [x] 6.3 Add drag-and-drop to `EntityDetailLayout` for Category and Context pages — pass onReorder from `useFilteredTasks` (FR7, UX6)
- [x] 6.4 Wire `CategoryDetailPage` and `ContextDetailPage` to pass reorder handler through to `EntityDetailLayout` (FR7, UX6)
- [x] 6.5 Update non-task sortable lists (GoalsPage, IdeasPage, CategoriesPage, ContextsPage, TaskChecklistTab) — single-record reorder via fractional key (FR8)

## 7. Sync Compatibility

- [x] 7.1 Add sort_order normalization in sync pull: convert incoming number to string if needed — safety net for legacy local IndexedDB data (D6)
- [x] 7.2 TDD: Unit test for sync normalization — number→string conversion (D6)

## 8. BDD Specs

- [x] 8.1 Update `tasks_reorder.feature` — scenarios for single-record update, descending sort (FR2, FR6)
- [x] 8.2 Update `tasks_create.feature` — scenario for task created at top of box (FR3)
- [x] 8.3 Add scenarios for box transfer and uncomplete positioning (FR4, FR5)
- [x] 8.4 Add scenarios for rebalancing trigger (FR9)

## 9. Verification

- [x] 9.1 Mutation testing on `SortOrderService` — 100% (M4) ✅
- [x] 9.2 Mutation testing on changed service files — TaskService 94.2%, non-task services 79-86% (survivors in rebalance sort comparisons) (M4)
- [x] 9.3 Build verification: `pnpm run build` passes ✅
- [x] 9.4 Verify M1: all reorder methods take (entityId, newSortOrder) — exactly 1 record per operation ✅
- [x] 9.5 Verify M3: existing sort orders preserved after migration (manual check with seeded data)
