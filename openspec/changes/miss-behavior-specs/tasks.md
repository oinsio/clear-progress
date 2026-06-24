## 1. CompletedPage BDD — date grouping (FR1, FR2)

- [x] 1.1 Create `completed_page_grouping.feature` with scenarios for 5 date groups and empty state (@miss-behavior-specs @FR1 @FR2)
- [x] 1.2 Create `completed_page_grouping.steps.ts` testing `groupCompletedTasks` utility with fakeClock
- [x] 1.3 Verify all scenarios pass with `npx vitest run`

## 2. CompletedPage BDD — operation routing (FR3)

- [x] 2.1 Create `completed_page_operations.feature` with scenarios for update/move/delete/duplicate routing (@miss-behavior-specs @FR3)
- [x] 2.2 Create `completed_page_operations.steps.ts` testing `useCompletedTaskHandlers` hook
- [x] 2.3 Verify all scenarios pass with `npx vitest run`

## 3. FocusMode dimming BDD (FR4, FR5, FR6)

- [x] 3.1 Create `focus_mode_dimming.feature` with scenarios for dimming activation/deactivation (@miss-behavior-specs @FR4 @FR5 @FR6)
- [x] 3.2 Create `focus_mode_dimming.steps.ts` testing TaskList dimming logic
- [x] 3.3 Verify all scenarios pass with `npx vitest run`

## 4. SyncProvider traceability fix (FR7)

- [x] 4.1 Update SyncProvider.tsx line 1 comment to reference sync-orchestration spec (T1-T7) and localstorage-refactor FR6, FR7

## 5. Verification

- [x] 5.1 Run full test suite to confirm no regressions: `npx vitest run`
- [x] 5.2 Run mutation testing on new step definition files (up to 5 files): `cd packages/client && npx stryker run --mutate '<step files>'`
- [x] 5.3 Verify mutation score >=90% on new step definitions
