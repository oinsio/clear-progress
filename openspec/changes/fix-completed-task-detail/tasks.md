## 1. Fix useTaskSelection

- [ ] 1.1 Remove the `isFocusMode && foundTask.is_completed` check (lines 58-60) in `packages/client/src/hooks/useTaskSelection.ts`
- [ ] 1.2 Remove the `isFocusMode` parameter from `UseTaskSelectionOptions` interface and from `useEffect` dependencies
- [ ] 1.3 Remove `isFocusMode` from all `useTaskSelection` call sites on pages

## 2. Update tests

- [ ] 2.1 Remove test "should clear selection when completed task is selected in focus mode" (line 190) — verifies removed behavior
- [ ] 2.2 Remove test "should not clear selection for active task in focus mode" (line 209) — verifies removed behavior
- [ ] 2.3 Update test "should not clear selection for completed task when isFocusMode is not provided" (line 254) — remove isFocusMode mention, keep the assertion that completed task is selected
- [ ] 2.4 Add test: completed task is successfully selected and stays selected (FR1)

## 3. Verification

- [ ] 3.1 Run `useTaskSelection.test.ts` tests — all should pass
- [ ] 3.2 Run `pnpm run build` — build succeeds without errors
- [ ] 3.3 Run mutation testing on `useTaskSelection.ts` — score >=90%
