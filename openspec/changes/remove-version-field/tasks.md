# Implementation Tasks: Remove Version Field

## 1. Contract Package — Remove version from schemas

- [x] 1.1 Remove `version` field from `WireTaskSchema` in `packages/contract/src/schemas/entities.ts` (FR1)
- [x] 1.2 Remove `version` field from `WireGoalSchema` in `packages/contract/src/schemas/entities.ts` (FR1)
- [x] 1.3 Remove `version` field from `WireIdeaSchema` in `packages/contract/src/schemas/entities.ts` (FR1)
- [x] 1.4 Remove `version` field from `WireContextSchema` in `packages/contract/src/schemas/entities.ts` (FR1)
- [x] 1.5 Remove `version` field from `WireCategorySchema` in `packages/contract/src/schemas/entities.ts` (FR1)
- [x] 1.6 Remove `version` field from `WireChecklistItemSchema` in `packages/contract/src/schemas/entities.ts` (FR1)

## 2. Client — Update IndexedDB schema

- [x] 2.1 Remove `version` from `DB_SCHEMA` in `packages/client/src/db/schema.ts` (FR1)
- [x] 2.2 Remove `version` from `DB_SCHEMA_V4` in `packages/client/src/db/schema.ts` (FR1)

## 3. Client — Update entity services

- [x] 3.1 Remove `version: 1` from `TaskService.create()` in `packages/client/src/services/TaskService.ts` (FR3)
- [x] 3.2 Remove `version: existingTask.version + 1` from `TaskService.update()` in `packages/client/src/services/TaskService.ts` (FR3)
- [x] 3.3 Remove `version: 1` from `GoalService.create()` in `packages/client/src/services/GoalService.ts` (FR3)
- [x] 3.4 Remove `version: existingGoal.version + 1` from `GoalService.update()` in `packages/client/src/services/GoalService.ts` (FR3)
- [x] 3.5 Remove `version: 1` from `IdeaService.create()` in `packages/client/src/services/IdeaService.ts` (FR3)
- [x] 3.6 Remove `version: existingIdea.version + 1` from `IdeaService.update()` in `packages/client/src/services/IdeaService.ts` (FR3)
- [x] 3.7 Remove `version: 1` from `ContextService.create()` in `packages/client/src/services/ContextService.ts` (FR3)
- [x] 3.8 Remove `version: existingContext.version + 1` from `ContextService.update()` in `packages/client/src/services/ContextService.ts` (FR3)
- [x] 3.9 Remove `version: 1` from `CategoryService.create()` in `packages/client/src/services/CategoryService.ts` (FR3)
- [x] 3.10 Remove `version: existingCategory.version + 1` from `CategoryService.update()` in `packages/client/src/services/CategoryService.ts` (FR3)
- [x] 3.11 Remove `version: 1` from `ChecklistService.create()` in `packages/client/src/services/ChecklistService.ts` (FR3)
- [x] 3.12 Remove `version: existingItem.version + 1` from `ChecklistService.update()` in `packages/client/src/services/ChecklistService.ts` (FR3)

## 4. Client — Update specialized services

- [x] 4.1 Remove `version: task.version + 1` from `HiddenTaskService.revealTasks()` in `packages/client/src/services/HiddenTaskService.ts` (FR3)
- [x] 4.2 Remove `version: goal.version + 1` from `CoverSyncService` in `packages/client/src/services/CoverSyncService.ts` (FR3)

## 5. Client — Update SyncService to use updated_at

- [x] 5.1 Replace `sentVersions` with `sentTimestamps` in `SyncService.push()` in `packages/client/src/services/SyncService.ts` (FR2)
- [x] 5.2 Change map to store `updated_at` instead of `version` for all entity types in `packages/client/src/services/SyncService.ts` (FR2)
- [x] 5.3 Update `_applyEntityPushResults()` to compare `updated_at` instead of `version` in `packages/client/src/services/SyncService.ts` (FR2)
- [x] 5.4 Update type constraint to remove `version: number` from generic `T` in `_applyEntityPushResults()` (FR2)

## 6. Client — Remove dead code

- [x] 6.1 Delete `getByMinVersion()` method from `TaskRepository` in `packages/client/src/db/repositories/TaskRepository.ts` (FR5)
- [x] 6.2 Delete `getByMinVersion()` tests from `TaskRepository.test.ts` (FR5)

## 7. Client — Update test factories

- [x] 7.1 Remove `version` from `taskFactory` in `packages/client/src/test/factories/taskFactory.ts`
- [x] 7.2 Remove `version` from `goalFactory` in `packages/client/src/test/factories/goalFactory.ts`
- [x] 7.3 Remove `version` from `ideaFactory` in `packages/client/src/test/factories/ideaFactory.ts`
- [x] 7.4 Remove `version` from `contextFactory` in `packages/client/src/test/factories/contextFactory.ts`
- [x] 7.5 Remove `version` from `categoryFactory` in `packages/client/src/test/factories/categoryFactory.ts`
- [x] 7.6 Remove `version` from `checklistItemFactory` in `packages/client/src/test/factories/checklistItemFactory.ts`

## 8. Client — Update deepEqual utility

- [x] 8.1 Remove `"version"` from `excludeFields` array in `hasEntityChanged()` in `packages/client/src/utils/deepEqual.ts`

## 9. Adapter GAS — Update server push logic

- [x] 9.1 Remove `version` increment logic from `processEntityBatch()` in `packages/adapter-gas/src/server/actions/push.ts` (FR4)
- [x] 9.2 Remove `version: record.version` from CREATED status response in `packages/adapter-gas/src/server/actions/push.ts` (FR4)
- [x] 9.3 Remove `updatedVersion` calculation and usage from ACCEPTED status in `packages/adapter-gas/src/server/actions/push.ts` (FR4)

## 10. Adapter GAS — Update sheet adapters

- [x] 10.1 Remove `version` column from `TasksSheet` in `packages/adapter-gas/src/server/sheets/tasks.sheet.ts` (FR4)
- [x] 10.2 Remove `version` column from `GoalsSheet` in `packages/adapter-gas/src/server/sheets/goals.sheet.ts` (FR4)
- [x] 10.3 Remove `version` column from `IdeasSheet` in `packages/adapter-gas/src/server/sheets/ideas.sheet.ts` (FR4)
- [x] 10.4 Remove `version` column from `ContextsSheet` in `packages/adapter-gas/src/server/sheets/contexts.sheet.ts` (FR4)
- [x] 10.5 Remove `version` column from `CategoriesSheet` in `packages/adapter-gas/src/server/sheets/categories.sheet.ts` (FR4)
- [x] 10.6 Remove `version` column from `ChecklistsSheet` in `packages/adapter-gas/src/server/sheets/checklists.sheet.ts` (FR4)

## 11. Adapter GAS — Update column indices

- [x] 11.1 Update `COLUMN_INDICES` constants in all sheet files after removing `version` column (FR4)
- [x] 11.2 Update `HEADERS` arrays in all sheet files to remove "version" header (FR4)

## 12. Adapter In-Memory — Update in-memory adapter

- [x] 12.1 Remove `version` increment logic from `InMemorySyncAdapter.push()` in `packages/adapter-inmemory/src/in-memory-sync-adapter.ts` (FR4)

## 13. Verification — Run tests

- [x] 13.1 Run `pnpm test` in `packages/contract` and verify all tests pass (NFR-R1)
- [x] 13.2 Run `pnpm test` in `packages/client` and verify all tests pass (NFR-R1)
- [x] 13.3 Run `pnpm test` in `packages/adapter-gas` and verify all tests pass (NFR-R1)
- [x] 13.4 Run `pnpm test` in `packages/adapter-inmemory` and verify all tests pass (NFR-R1)

## 14. Verification — Mutation testing

- [ ] 14.1 Run `pnpm run test:mutation` on `SyncService.ts` and verify score ≥90% (NFR-R2)
- [x] 14.2 Run `pnpm run test:mutation` on `TaskService.ts` and verify score ≥90% (NFR-R2)
- [x] 14.3 Run `pnpm run test:mutation` on `GoalService.ts` and verify score ≥90% (NFR-R2)

## 15. Verification — Build and integration

- [x] 15.1 Run `pnpm run build` in root and verify no TypeScript errors (NFR-P2)
- [ ] 15.2 Manual test: Create task, sync, verify sync works correctly (UX2)
- [ ] 15.3 Manual test: Edit task while offline, go online, verify sync resolves correctly (UX2)
- [ ] 15.4 Manual test: Create conflicting edits on two devices, verify last-write-wins works (UX2)
