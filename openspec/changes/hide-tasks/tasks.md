## 1. i18n and Constants

- [x] 1.1 Add i18n keys for hide/unhide UI to `en.json` and `ru.json` (FR3, FR4)
- [x] 1.2 Add `HIDE` to `SELECTOR_TYPE` and `SELECTOR_TITLE_KEYS` in `taskEditShared.tsx` (FR4)

## 2. Service Logic

- [x] 2.1 BDD feature + steps: completing a manually hidden task clears hide state (FR6)
- [x] 2.2 Modify `TaskService.complete()` to clear `is_hidden`/`appear_date` for manually hidden non-recurring tasks (FR6)
- [x] 2.3 TDD: duplicate() always creates visible copy — write test, then fix `TaskService.duplicate()` to explicitly set `is_hidden: false, appear_date: ""` (FR10)
- [x] 2.4 Verify existing tests pass + mutation testing on `TaskService.ts`

## 3. DatePickerInput Component

- [x] 3.1 TDD: Write tests for `DatePickerInput` — renders, calls onChange, respects min date (NFR-A2, NFR-R1)
- [x] 3.2 Create `DatePickerInput.tsx` — native `<input type="date">` wrapper with `min` prop and Tailwind styling
- [x] 3.3 Mutation testing on `DatePickerInput.tsx`

## 4. HideTaskPanel Component

- [x] 4.1 TDD: Write tests for `HideTaskPanel` — date picker for non-hidden, unhide for hidden, disabled button without date (FR1, FR2)
- [x] 4.2 Create `HideTaskPanel.tsx` — shared panel with hide (date picker + confirm) and unhide modes
- [x] 4.3 Mutation testing on `HideTaskPanel.tsx`

## 5. TaskQuickActions Integration

- [x] 5.1 TDD: Write tests — EyeOff button for non-recurring, Eye for hidden, no button for recurring (FR3, FR5)
- [x] 5.2 Add `"hide"` to `QuickActionMode`, add hide/unhide button and `HideTaskPanel` rendering in `TaskQuickActions.tsx`
- [x] 5.3 Mutation testing on `TaskQuickActions.tsx` (scoped to new code)

## 6. TaskDetailPanel Integration

- [x] 6.1 TDD: Write tests — hide DrillDownRow for non-recurring, no row for recurring, hide selector panel (FR4, FR5)
- [x] 6.2 Add "Hide until" DrillDownRow and `SELECTOR_TYPE.HIDE` handling with `HideTaskPanel` in `TaskDetailPanel.tsx`
- [x] 6.3 Mutation testing on `TaskDetailPanel.tsx` (scoped to new code)

## 7. GoalDetailPage — Hidden Tasks Visibility

- [x] 7.1 Add `includeHidden` parameter to `TaskRepository.getByGoalId()` (FR9)
- [x] 7.2 Update `TaskService.getByGoalId()` to pass `includeHidden` (FR9)
- [x] 7.3 Update `useGoalTasks` hook to read `showHidden` from context and pass to service (FR9)
- [x] 7.4 TDD: write tests for hidden tasks appearing on GoalDetailPage with eye toggle on (FR9)

## 8. i18n Namespace Fix

- [x] 8.1 Move `repeat.appearDate` key to `task.appearDate` in `en.json` and `ru.json` (FR11)
- [x] 8.2 Update `TaskItem.tsx` to use `t("task.appearDate")` instead of `t("repeat.appearDate")` (FR11)

## 9. BDD Scenarios

- [x] 9.1 Write BDD feature `manual-task-hiding.feature` with scenarios: hide task, unhide task, recurring exclusion, date validation, complete clears hide, duplicate visible (FR1–FR6, FR10)
- [x] 9.2 Implement step definitions for all scenarios
- [x] 9.3 Verify all BDD scenarios pass

## 10. Final Verification

- [x] 10.1 Run `pnpm run lint:fix` — all should pass
- [x] 10.2 Run `pnpm run preflight` — all should pass
- [x] 10.3 Run `pnpm run build` — verify no type errors
- [x] 10.4 Run `getDiagnostics` on all changed files
