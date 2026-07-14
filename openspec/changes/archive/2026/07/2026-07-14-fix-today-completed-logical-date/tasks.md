## 1. Regression tests (RED) — FR1, FR2, FR3

- [x] 1.1 Extend `activeTasksPage.testSetup.tsx` to allow faking clock/timezone for the page (module mock of `systemClock` per design D3) and mocking `getCachedDayBoundary` — no behavior change for existing tests
- [x] 1.2 Write failing test: task completed at 2026-06-09T21:00:00Z, timezone UTC+5, now local 02:30 June 10 → appears in "Completed today" (FR1, delta scenario "early-morning completion whose UTC date is yesterday")
- [x] 1.3 Write failing test: task completed at 2026-06-10T01:00:00Z, timezone UTC-4, now local 21:30 June 9 → appears in "Completed today" (FR1, delta scenario "evening completion whose UTC date is tomorrow")
- [x] 1.4 Fix test-harness bug (`settingsMocks.ts` duplicate `useSettings` mock overrides testSetup's `pageConfig.dayBoundary`); write failing test: day boundary "04:00", timezone UTC+5, now local 12:00 June 10, task completed local 04:30 June 10 (UTC 2026-06-09T23:30:00Z) → appears in "Completed today" (FR1, delta scenario "post-boundary completion whose UTC date is yesterday"); keep the original "respects custom day boundary" scenario as a green-only regression guard
- [x] 1.5 Run `npx vitest run src/pages/ActiveTasksPage.completed.test.tsx` — confirm the three RED tests (1.2, 1.3, 1.4) FAIL against current implementation, the green guard and existing tests pass; show output

## 2. Fix (GREEN) — FR1, FR2, FR3

- [x] 2.1 Replace the manual filter in `ActiveTasksPage.tsx` todayCompleted with `groupCompletedTasks(completedTasks, undefined, getCachedDayBoundary()).todayTasks` (design D1); remove now-unused `getLogicalDate`/`systemClock` imports if nothing else uses them
- [x] 2.2 Add JSDoc traceability on the memo: `Implements FR1, FR2 of fix-today-completed-logical-date`
- [x] 2.3 Run `npx vitest run src/pages/ActiveTasksPage.completed.test.tsx` — all tests green; show output

## 3. Verification

- [x] 3.1 Run `npx vitest run src/pages/ActiveTasksPage` — full page suite green (M2)
- [x] 3.2 Run `npx vitest run src/shared/lib` — groupCompletedTasks suite untouched and green (M2)
- [x] 3.3 Call `get_file_problems` for changed files via JetBrains MCP; run `pnpm run build`
- [x] 3.4 Scoped mutation run: `cd packages/client && npx stryker run --mutate 'src/pages/ActiveTasksPage.tsx'`; analyze report at `packages/client/reports/mutation/mutation-report.json` — filter-related mutants killed (M3); pre-existing JSX survivors out of scope
