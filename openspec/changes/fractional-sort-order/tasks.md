## 1. Setup and SortOrderService

- [ ] 1.1 Install `fractional-indexing` npm package in `packages/client` (FR1)
- [ ] 1.2 Create `SortOrderService` in `src/services/SortOrderService.ts` with methods: `generateTopKey`, `generateAppendKey`, `generateKeyBetween`, `rebalanceKeys`, `needsRebalancing` (FR1, FR6, FR9, D3)
- [ ] 1.3 TDD: Unit tests for `SortOrderService` — key generation, ordering, rebalancing, threshold check (FR1, FR9)
- [ ] 1.4 Add `SORT_ORDER_REBALANCE_THRESHOLD = 10` constant to `src/constants/` (FR9, D4)

## 2. Schema and Type Migration

- [ ] 2.1 Change `sort_order` from `z.number()` to `z.union([z.number(), z.string()])` in `packages/contract/src/schemas/entities.ts` for all Wire schemas (FR1, D6)
- [ ] 2.2 Add Dexie version bump with `upgrade()` handler in DB schema: convert integer sort_order to fractional indexing strings — tasks in reverse order (DESC), non-task entities in natural order (ASC) (FR10, D5)
- [ ] 2.3 TDD: Unit tests for migration — existing integer orders correctly converted to string keys preserving display order (FR10)

## 3. TaskService — Fractional Sort Order

- [ ] 3.1 Change `sortBySortOrder` to sort by string comparison **descending** (FR2)
- [ ] 3.2 TDD: Unit tests for descending sort order (FR2)
- [ ] 3.3 Change `create()` to generate sort_order via `SortOrderService.generateTopKey` using global box maximum (FR3)
- [ ] 3.4 TDD: Unit tests for task creation — new task at top of box, correct key from global max (FR3, UX1)
- [ ] 3.5 Change `moveToBox()` to recalculate sort_order as top key in destination box (FR4)
- [ ] 3.6 TDD: Unit tests for box transfer — task at top of new box, no-op for same box (FR4, UX2)
- [ ] 3.7 Change `noncomplete()` to recalculate sort_order as top key in task's box (FR5)
- [ ] 3.8 TDD: Unit tests for uncomplete — task at top of box (FR5, UX3)
- [ ] 3.9 Change `reorderTasks()` to accept single task + new key instead of full array. Integrate rebalancing check (FR6, FR9)
- [ ] 3.10 TDD: Unit tests for single-record reorder and lazy rebalancing (FR6, FR9, M1, M2)
- [ ] 3.11 Update `getCompleted()` sort fallback from numeric to string comparison (FR2)

## 4. Non-Task Services — Fractional Sort Order

- [ ] 4.1 Update `GoalService` — sort ascending by string, create with `generateAppendKey`, reorder with single-record update + rebalancing (FR8, FR6, FR9)
- [ ] 4.2 TDD: Unit tests for GoalService sort, create, reorder (FR8)
- [ ] 4.3 Update `IdeaService` — same pattern as GoalService (FR8, FR6, FR9)
- [ ] 4.4 TDD: Unit tests for IdeaService (FR8)
- [ ] 4.5 Update `CategoryService` — same pattern (FR8, FR6, FR9)
- [ ] 4.6 TDD: Unit tests for CategoryService (FR8)
- [ ] 4.7 Update `ContextService` — same pattern (FR8, FR6, FR9)
- [ ] 4.8 TDD: Unit tests for ContextService (FR8)
- [ ] 4.9 Update `ChecklistService` — same pattern (FR8, FR6, FR9)
- [ ] 4.10 TDD: Unit tests for ChecklistService (FR8)

## 5. Hooks — Adapt to New Reorder API

- [ ] 5.1 Update `useTasks` — change `reorderTasks` to accept single task + new sort_order key (FR6)
- [ ] 5.2 Update `useGoalTasks` — adapt reorder to single-record API (FR6)
- [ ] 5.3 Update `useFilteredTasks` — expose reorder method for category/context tasks (FR7)
- [ ] 5.4 Update `useGoals`, `useIdeas`, `useCategories`, `useContexts`, `useChecklist` — adapt reorder to single-record API (FR6, FR8)

## 6. UI — Drag-and-Drop Changes

- [ ] 6.1 Update `TaskList` `handleDragEnd` — calculate fractional key between neighbors instead of arrayMove, call reorder with single task (FR6, D3)
- [ ] 6.2 Update `BoxSectionList` — pass reorder callback that accepts single task + key (FR6)
- [ ] 6.3 Add drag-and-drop to `EntityDetailLayout` for Category and Context pages — pass onReorder from `useFilteredTasks` (FR7, UX6)
- [ ] 6.4 Wire `CategoryDetailPage` and `ContextDetailPage` to pass reorder handler through to `EntityDetailLayout` (FR7, UX6)
- [ ] 6.5 Update non-task sortable lists (GoalsPage, IdeasPage, CategoriesPage, ContextsPage, TaskChecklistTab) — single-record reorder via fractional key (FR8)

## 7. Sync Compatibility

- [ ] 7.1 Add sort_order normalization in sync pull: convert incoming number to string if needed (D6)
- [ ] 7.2 TDD: Unit test for sync normalization — number→string conversion (D6)

## 8. BDD Specs

- [ ] 8.1 Update `tasks_reorder.feature` — scenarios for single-record update, descending sort (FR2, FR6)
- [ ] 8.2 Update `tasks_create.feature` — scenario for task created at top of box (FR3)
- [ ] 8.3 Add scenarios for box transfer and uncomplete positioning (FR4, FR5)
- [ ] 8.4 Add scenarios for rebalancing trigger (FR9)

## 9. Verification

- [ ] 9.1 Mutation testing on `SortOrderService` — target >= 95% (M4)
- [ ] 9.2 Mutation testing on changed service files (TaskService, GoalService, etc.) — target >= 95% (M4)
- [ ] 9.3 Build verification: `pnpm run build` passes
- [ ] 9.4 Verify M1: reorder/insert/move operations update exactly 1 record
- [ ] 9.5 Verify M3: existing sort orders preserved after migration (manual check with seeded data)
