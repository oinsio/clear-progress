## 1. Repository Layer (FR4)

- [x] 1.1 Rename existing `getByTaskId` to `getActiveByTaskId` (keeps `!is_deleted` filter) and add new `getAllByTaskId` (no filter, returns all including soft-deleted). Update all consumers: `TaskService.copyChecklistItems` and `ChecklistService` → use `getActiveByTaskId`
- [x] 1.2 Unit tests for `getAllByTaskId`: returns items, returns empty array for unknown task, includes soft-deleted items. Unit tests for `getActiveByTaskId`: returns only non-deleted items

## 2. Cascading Soft-Delete (FR1)

- [x] 2.1 ~~TDD: Add ChecklistRepository dependency to TaskService constructor (D4)~~ — already done, ChecklistRepository is already injected into TaskService constructor
- [x] 2.2 TDD: Extend `TaskService.softDelete()` to cascade `is_deleted = true` to all checklist_items of the task
- [x] 2.3 Unit tests: cascade to items, cascade with no items, cascade with already-deleted items, cascade preserves recurring chain logic
- [x] 2.4 Update mock factory `createMockChecklistRepository` to include `getAllByTaskId` and `getActiveByTaskId`, update existing TaskService tests if needed

## 3. Cascading Restore (FR2)

- [x] 3.1 TDD: Extend `TaskService.restore()` to cascade `is_deleted = false` to ALL checklist_items of the task
- [x] 3.2 Unit tests: restore all items, restore with no items, restore includes previously manually deleted items

## 4. Self-Healing Before Push (FR3)

- [x] 4.1 TDD: Add orphan detection logic in `SyncService._push()` — before `_createPushChunks`, check checklist_items whose task_id does not exist in IndexedDB
- [x] 4.2 TDD: Hard-delete orphans from IndexedDB and exclude from push data with console.warn
- [x] 4.3 Unit tests: orphan removed, valid items preserved, incremental push with non-dirty but existing task, batch lookup optimization (NFR-P1)

## 5. BDD Scenarios

- [x] 5.1 Gherkin feature file for cascade soft-delete scenarios (@cascade-checklist-delete @FR1)
- [x] 5.2 Gherkin feature file for cascade restore scenarios (@cascade-checklist-delete @FR2)
- [x] 5.3 Gherkin feature file for self-healing orphan scenarios (@cascade-checklist-delete @FR3)
- [x] 5.4 Step definitions for all BDD scenarios

## 6. Verification

- [x] 6.1 Run full test suite (`npx vitest run`) — all tests pass (10 pre-existing failures in useHiddenTasksReveal, unrelated)
- [x] 6.2 Run build (`pnpm run build`) — no errors
- [x] 6.3 Mutation testing on changed files — target >= 95%

## 7. Kill Survived Mutants — SyncService Self-Healing (FR3)

- [x] 7.1 Test "no checklist_items in push" — `bulkGet` is NOT called
- [x] 7.2 Test "all task_ids exist in DB" — `bulkDelete` is NOT called, all items remain in push
- [x] 7.3 Test "all task_ids already in push batch" — `bulkGet` is NOT called (uniqueTaskIds empty)
- [x] 7.4 Assert orphan items are excluded from push data (not only deleted from DB)
- [x] 7.5 Spy on `console.warn` — verify warning message per orphan

## 8. Kill Survived Mutants — ChecklistService

- [x] 8.1 Test `create()` asserts `needsSync === true` on returned item
- [x] 8.2 Test `reorderItems([])` — `bulkUpsert` is NOT called
- [x] 8.3 Test `reorderItems` with items already in correct order — `bulkUpsert` is NOT called
- [x] 8.4 Test `reorderItems` asserts `updated_at` changes ONLY for items whose `sort_order` actually changed

## 9. Kill Survived Mutants — TaskService

- [x] 9.1 Test `complete()` for task without `repeat_rule` — assert `recurring` is `null`, `parseRepeatRule` is NOT called
- [x] 9.2 Test `complete()` where `createRecurringCopy` throws — assert `complete()` still returns result (catch block)
- [x] 9.3 Test `softDelete()` error message contains task id (`toThrowError(/Task not found/)`)
- [x] 9.4 Test `copyChecklistItems` with empty checklist — `checklistRepository.create` is NOT called
- [x] 9.5 Test `softDelete()` without copies — `update` is NOT called for copy reassignment
- [x] 9.6 Test `reorderTasks([])` — `taskRepository` is NOT called

## 10. Kill Survived Mutants — SyncService Chunks & Push Results (legacy debt)

- [x] 10.1 Test chunk boundary: `totalCount === PUSH_CHUNK_SIZE` — returns 1 chunk
- [x] 10.2 Test chunk overflow: one entity type fills chunk entirely, next type goes to new chunk
- [x] 10.3 Test chunkSize tracking: checklist_items and settings count toward chunk size correctly
- [x] 10.4 Test `_applyPushResults` with `undefined` entity types in results (e.g. `results.goals = undefined`)
- [x] 10.5 Test `_applySettingsPushResults` with `results = undefined` and `results = []`
- [x] 10.6 Test `_applyEntityPushResults` with `results = undefined` and `results = []`
- [x] 10.7 Test fallback when `sentTimestamps` does not contain result id

## 11. Kill Survived Mutants — ChecklistRepository

- [x] 11.1 Test `create()` with invalid data — throws validation error
- [x] 11.2 Test `update()` with invalid data — throws validation error
- [x] 11.3 Test `bulkUpsert()` with invalid item in array — throws validation error
- [x] 11.4 Add coverage for uncovered methods: `getAll`, `getChangedSince`, `getNeedingSync`, `applyServerRecords`

## 12. Integration Test (FR1)

- [x] 12.1 Playwright integration test `cascade-checklist-delete.spec.ts`: create task with 2 checklist items → sync → close detail panel via Close button → delete task → sync → verify server returns task and both items with `is_deleted = true`
