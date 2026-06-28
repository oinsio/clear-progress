## 1. TDD: softDelete — preserve promotion link (FR1)

- [x] 1.1 RED: Write test "softDelete records promoted copy ID in original_task_id of deleted task" in `TaskService.recurring-restore.test.ts`
- [x] 1.2 RED: Write test "softDelete without copies does not change original_task_id"
- [x] 1.3 GREEN: Modify `softDelete()` in `TaskService.ts` — add `original_task_id: newOriginal.id` to the final `update(id, { is_deleted: true, ... })`
- [x] 1.4 Verify existing tests in `TaskService.recurring-soft-delete.test.ts` still pass

## 2. TDD: restore — conditional logic for recurring tasks (FR2–FR5)

- [x] 2.1 RED: Test "restore with active promoted successor clears repeat_rule, next_date, appear_date"
- [x] 2.2 RED: Test "restore with deleted promoted successor restores as original (original_task_id: "")"
- [x] 2.3 RED: Test "restore with non-existent promoted successor restores as original"
- [x] 2.4 RED: Test "restore with hidden promoted successor clears repeat_rule"
- [x] 2.5 RED: Test "restore task without repeat_rule — behavior unchanged"
- [x] 2.6 RED: Test "restore copy (original_task_id set before deletion) — behavior unchanged"
- [x] 2.7 GREEN: Modify `restore()` in `TaskService.ts` — add check for original_task_id + repeat_rule and conditional clearing
- [x] 2.8 REFACTOR: Verify all tests pass, improve code if needed

## 3. Verification

- [x] 3.1 Verify all existing tests pass: `npx vitest run` (scoped to TaskService) — 145 tests, 18 files, all pass
- [x] 3.2 Verify build: `pnpm run build` — success
- [x] 3.3 Mutation testing on changed files (>=95%): `cd packages/client && npx stryker run --mutate 'src/services/TaskService.ts'` — 98.35% (239/243)
- [x] 3.4 Check JetBrains diagnostics on changed files — no errors
