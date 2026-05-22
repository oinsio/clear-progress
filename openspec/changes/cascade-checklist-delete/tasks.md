## 1. Repository Layer (FR4)

- [ ] 1.1 TDD: Add `getByTaskId(taskId)` method to ChecklistRepository — returns all checklist_items (including soft-deleted) for a given task_id
- [ ] 1.2 Unit tests for `getByTaskId`: returns items, returns empty array for unknown task, includes soft-deleted items

## 2. Cascading Soft-Delete (FR1)

- [ ] 2.1 TDD: Add ChecklistRepository dependency to TaskService constructor (D4)
- [ ] 2.2 TDD: Extend `TaskService.softDelete()` to cascade `is_deleted = true` to all checklist_items of the task
- [ ] 2.3 Unit tests: cascade to items, cascade with no items, cascade with already-deleted items, cascade preserves recurring chain logic
- [ ] 2.4 Update existing TaskService tests to pass ChecklistRepository dependency

## 3. Cascading Restore (FR2)

- [ ] 3.1 TDD: Extend `TaskService.restore()` to cascade `is_deleted = false` to ALL checklist_items of the task
- [ ] 3.2 Unit tests: restore all items, restore with no items, restore includes previously manually deleted items

## 4. Self-Healing Before Push (FR3)

- [ ] 4.1 TDD: Add orphan detection logic in `SyncService._push()` — before `_createPushChunks`, check checklist_items whose task_id does not exist in IndexedDB
- [ ] 4.2 TDD: Hard-delete orphans from IndexedDB and exclude from push data with console.warn
- [ ] 4.3 Unit tests: orphan removed, valid items preserved, incremental push with non-dirty but existing task, batch lookup optimization (NFR-P1)

## 5. BDD Scenarios

- [ ] 5.1 Gherkin feature file for cascade soft-delete scenarios (@cascade-checklist-delete @FR1)
- [ ] 5.2 Gherkin feature file for cascade restore scenarios (@cascade-checklist-delete @FR2)
- [ ] 5.3 Gherkin feature file for self-healing orphan scenarios (@cascade-checklist-delete @FR3)
- [ ] 5.4 Step definitions for all BDD scenarios

## 6. Verification

- [ ] 6.1 Run full test suite (`npx vitest run`) — all tests pass
- [ ] 6.2 Run build (`pnpm run build`) — no errors
- [ ] 6.3 Mutation testing on changed files — target >= 95%
