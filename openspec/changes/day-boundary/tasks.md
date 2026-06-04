## 1. Foundation: Constants and Core Utility

- [ ] 1.1 Add constants: `DEFAULT_DAY_BOUNDARY`, `SETTING_KEYS.DAY_BOUNDARY`, `STORAGE_KEYS.DAY_BOUNDARY`, `DAY_BOUNDARY_CHANGED_EVENT` to `packages/client/src/constants/index.ts` — FR1
- [ ] 1.2 TDD: Write failing tests for `getLogicalDate` and `isValidDayBoundary` in `packages/client/src/utils/getLogicalDate.test.ts` — FR3, FR11
- [ ] 1.3 Implement `getLogicalDate(clock, dayBoundary)` and `isValidDayBoundary(value)` in `packages/client/src/utils/getLogicalDate.ts` — FR3, FR11
- [ ] 1.4 Verify tests green, run mutation testing on `getLogicalDate.ts` (target >=95%) — NFR-P1

## 2. BDD: Logical Date and Validation

- [ ] 2.1 Write feature file `packages/client/src/test/features/day_boundary/day_boundary_logical_date.feature` — scenarios from spec: midnight boundary, before/at/after boundary, timezone — FR3
- [ ] 2.2 Write steps `packages/client/src/test/features/day_boundary/steps/day_boundary_logical_date.steps.ts` — FR3
- [ ] 2.3 Write feature file `packages/client/src/test/features/day_boundary/day_boundary_validation.feature` — valid/invalid values, self-healing — FR11, FR12
- [ ] 2.4 Write steps `packages/client/src/test/features/day_boundary/steps/day_boundary_validation.steps.ts` — FR11, FR12

## 3. Settings Infrastructure

- [ ] 3.1 TDD: Write failing tests for `SettingsService.getDayBoundary()` including self-healing scenarios (invalid value → default + overwrite) — FR1, FR12
- [ ] 3.2 Implement `getDayBoundary()` with self-healing in `packages/client/src/services/SettingsService.ts`: validate stored value, return default on invalid, async overwrite with needsSync — FR1, FR12
- [ ] 3.3 Add `dayBoundary` state, `getCachedDayBoundary()`, `setDayBoundary()` with `DAY_BOUNDARY_CHANGED_EVENT` dispatch to `packages/client/src/hooks/useSettings.ts` — FR1, FR2, FR6
- [ ] 3.4 Write/update tests for `useSettings` dayBoundary read/write/cache/event — FR1, FR2

## 4. Hidden Tasks Reveal Logic

- [ ] 4.1 TDD: Write failing tests for `HiddenTaskService.revealHiddenTasks(logicalDate)` with explicit logicalDate parameter — FR4
- [ ] 4.2 Add optional `logicalDate` parameter to `revealHiddenTasks()` in `packages/client/src/services/HiddenTaskService.ts` — FR4
- [ ] 4.3 Modify `useHiddenTasksReveal`: read dayBoundary from localStorage, listen for `DAY_BOUNDARY_CHANGED_EVENT`, compute logical date, pass to service, schedule timer at boundary time — FR4, FR5, FR6
- [ ] 4.4 Update tests for `useHiddenTasksReveal`: timer at boundary, re-schedule on change, immediate reveal on change — FR5, FR6

## 5. BDD: Reveal with Day Boundary

- [ ] 5.1 Write feature file `packages/client/src/test/features/day_boundary/day_boundary_reveal.feature` — reveal by logical date, boundary change triggers reveal, backward compat — FR4, FR5, FR6
- [ ] 5.2 Write steps `packages/client/src/test/features/day_boundary/steps/day_boundary_reveal.steps.ts` — FR4, FR5, FR6

## 6. TaskService Recurring Logic

- [ ] 6.1 TDD: Write failing test for `TaskService.complete(id, logicalDate)` with non-midnight boundary — FR7
- [ ] 6.2 Add optional `logicalDate` parameter to `complete()` in `packages/client/src/services/TaskService.ts`, use for `shouldReveal` check — FR7
- [ ] 6.3 Update callers of `TaskService.complete()` to pass logical date — FR7

## 7. BDD: Recurring Copy Visibility with Day Boundary

- [ ] 7.1 Write feature file `packages/client/src/test/features/day_boundary/day_boundary_recurring.feature` — recurring copy hidden/visible by logical date, backward compat — FR7
- [ ] 7.2 Write steps `packages/client/src/test/features/day_boundary/steps/day_boundary_recurring.steps.ts` — FR7

## 8. Completed Tasks Grouping

- [ ] 8.1 TDD: Write failing tests for `groupCompletedTasks` with non-midnight dayBoundary — FR8
- [ ] 8.2 Add `dayBoundary` parameter to `groupCompletedTasks`, `getDayBoundaries`, `formatCompletedAt`, `formatShortDateTime` in `packages/client/src/shared/lib/utils.ts` — FR8, FR9
- [ ] 8.3 Update `CompletedPage.tsx` to pass `dayBoundary` from `useSettings()` to `groupCompletedTasks` — FR8
- [ ] 8.4 Update components using `formatCompletedAt`/`formatShortDateTime` to accept and pass `dayBoundary` — FR9
- [ ] 8.5 Update tests: `utils.groupCompletedTasks.test.ts`, `utils.formatCompletedAt.test.ts`, `utils.formatShortDateTime.test.ts` — FR8, FR9

## 9. BDD: Grouping with Day Boundary

- [ ] 9.1 Write feature file `packages/client/src/test/features/day_boundary/day_boundary_grouping.feature` — task before boundary grouped as previous day, default preserves behavior — FR8, FR9
- [ ] 9.2 Write steps `packages/client/src/test/features/day_boundary/steps/day_boundary_grouping.steps.ts` — FR8, FR9

## 10. UI: Settings Page

- [ ] 10.1 Add i18n keys (`settings.dayBoundary`, `settings.dayBoundaryDescription`) to `packages/client/src/locales/en.json` and `ru.json` — FR10
- [ ] 10.2 Create `packages/client/src/components/settings/DayBoundarySection.tsx` with `<input type="time">` and validation — FR10, FR11, NFR-A1, NFR-R1
- [ ] 10.3 Integrate `DayBoundarySection` into `SettingsPage.tsx` after "Default box" section — FR10, UX2
- [ ] 10.4 Write component test for `DayBoundarySection`: renders, validates, saves — FR10, FR11

## 11. Verification

- [ ] 11.1 Run `pnpm run lint:fix` — all should pass
- [ ] 11.2 Run `pnpm run preflight` — all should pass
- [ ] 11.3 Run `pnpm run build` — verify no type errors
- [ ] 11.4 Run JetBrains diagnostics on all changed files
- [ ] 11.5 Run mutation testing scoped to `getLogicalDate.ts`, `HiddenTaskService.ts` (target >=95%) — M2
- [ ] 11.6 Verify backward compatibility: all existing tests pass without modification — M1

