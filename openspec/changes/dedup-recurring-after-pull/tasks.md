# Tasks: dedup-recurring-after-pull

## Task 1: Add `RecurringTaskDeduplicator` service (TDD)

- [x] 1.1 Write BDD feature file `packages/client/src/test/features/repeating_tasks/dedup_after_pull.feature` with scenarios from delta spec (@dedup-recurring-after-pull @FR1 @FR2 @FR3)
- [x] 1.2 Write step definitions `dedup_after_pull.steps.ts`
- [x] 1.3 RED: Write unit tests for `RecurringTaskDeduplicator.deduplicate()`:
  - Two duplicates, same `next_date` — tiebreak by `min(id)` (FR2)
  - Two duplicates, different `next_date` — earlier wins (FR2)
  - No duplicates — no-op (FR1)
  - Completed/deleted copies excluded (FR1)
  - Cascade soft-delete checklist items of loser (FR3)
  - Multiple groups deduplicated independently
- [x] 1.4 GREEN: Implement `RecurringTaskDeduplicator` in `packages/client/src/services/RecurringTaskDeduplicator.ts`
  - Constructor: `TaskRepository`, `ChecklistRepository`, `Clock`
  - Method: `deduplicate(pulledTaskIds: string[]): Promise<void>`
  - Accepts list of `original_task_id` values from pull batch for FR5 optimization
- [x] 1.5 REFACTOR: Clean up, verify all tests green
- [ ] 1.6 MUTATE: Run Stryker on `RecurringTaskDeduplicator.ts`, target >= 95%

### Verification
```bash
cd packages/client && npx vitest run src/services/RecurringTaskDeduplicator.test.ts
cd packages/client && npx stryker run --mutate 'src/services/RecurringTaskDeduplicator.ts'
```

## Task 2: Add `TaskRepository` query for duplicates

- [x] 2.1 RED: Write test for `TaskRepository.findDuplicateRecurringGroups(originalTaskIds: string[])` — returns groups of non-completed, non-deleted tasks sharing `original_task_id`
- [x] 2.2 GREEN: Implement the method using Dexie `where("original_task_id").anyOf(ids)` with filter
- [x] 2.3 REFACTOR + tests green

### Verification
```bash
cd packages/client && npx vitest run src/db/repositories/TaskRepository.recurring.test.ts
```

## Task 3: Integrate dedup into SyncService._pull() (FR4, FR5)

- [x] 3.1 RED: Write test for `SyncService._pull()` — dedup called after batch, before `sync_complete`
- [x] 3.2 RED: Write test — dedup skipped when no tasks with `original_task_id` in batch (FR5)
- [x] 3.3 GREEN: Wire `RecurringTaskDeduplicator` into `SyncService`
  - Extract `original_task_id` values from normalized tasks in pull batch
  - Call `deduplicator.deduplicate(originalTaskIds)` after batch apply, before event dispatch
- [x] 3.4 REFACTOR + tests green

### Verification
```bash
cd packages/client && npx vitest run src/services/SyncService.pull.test.ts
```

## Task 4: Tighten integration test 5.13.3 (FR6)

- [x] 4.1 Change assertion in `packages/integration/src/tests/multi-device-recurring.spec.ts` test 5.13.3: `toBeGreaterThanOrEqual(1)` → `toHaveLength(1)`
- [ ] 4.2 Run integration test suite to verify

### Verification
```bash
cd packages/integration && npx playwright test multi-device-recurring.spec.ts
```

## Task 5: Build verification

- [ ] 5.1 Run `pnpm run build` — verify no type errors
- [ ] 5.2 Run `get_file_problems` via JetBrains MCP on changed files
