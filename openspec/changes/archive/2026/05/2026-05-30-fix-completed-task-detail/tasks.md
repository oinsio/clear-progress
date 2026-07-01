## 1. Fix useTaskSelection

- [x] 1.1 Remove the `isFocusMode && foundTask.is_completed` check (lines 58-60) in `packages/client/src/hooks/useTaskSelection.ts`
- [x] 1.2 Remove the `isFocusMode` parameter from `UseTaskSelectionOptions` interface and from `useEffect` dependencies
- [x] 1.3 Remove `isFocusMode` from all `useTaskSelection` call sites on pages

## 2. Update tests

- [x] 2.1 Remove test "should clear selection when completed task is selected in focus mode" (line 190) — verifies removed behavior
- [x] 2.2 Remove test "should not clear selection for active task in focus mode" (line 209) — verifies removed behavior
- [x] 2.3 Update test "should not clear selection for completed task when isFocusMode is not provided" (line 254) — remove isFocusMode mention, keep the assertion that completed task is selected
- [x] 2.4 Add test: completed task is successfully selected and stays selected (FR1)

## 3. Verification

- [x] 3.1 Run `useTaskSelection.test.ts` tests — all should pass
- [x] 3.2 Run `pnpm run build` — build succeeds without errors
- [x] 3.3 Run `pnpm run lint:fix` — all should pass
- [x] 3.4 Run `pnpm run preflight` — all should pass
- [x] 3.5 Run mutation testing on `useTaskSelection.ts` — score >=90%
