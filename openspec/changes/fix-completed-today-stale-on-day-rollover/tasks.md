## 1. Reproduce the bug (RED integration test)

- [ ] 1.1 Add a failing integration test that mounts `ActiveTasksPage` with a task completed on the previous logical day, advances a `fakeClock` across the day boundary WITHOUT remount/rerender, drives the boundary timer, and asserts the task is gone from "completed today" (FR3, M1). Confirm it FAILS on current code.
- [ ] 1.2 Add a parallel RED case for a custom day boundary ("04:00") verifying rollover happens at 04:00, not midnight (UX3, FR3). Confirm it FAILS.

## 2. Extract shared boundary-timer helper (FR8)

- [ ] 2.1 RED: write unit tests for `scheduleNextBoundary(clock, dayBoundary, onFire)` covering next-boundary-today vs next-day and the boundary buffer, using `fakeClock` (FR8).
- [ ] 2.2 GREEN: extract the `nextBoundary`/`msUntilBoundary` math and `BOUNDARY_BUFFER_MS` from `useHiddenTasksReveal.ts` into the shared helper module (index-exported) (FR8).
- [ ] 2.3 Refactor `useHiddenTasksReveal` to call the helper; run `useHiddenTasksReveal.midnight.test.ts` to prove reveal behavior is unchanged (FR8).

## 3. Reactive logical-date store (FR1, FR2, NFR-P1)

- [ ] 3.1 RED: unit tests for `logicalTodayStore` — `getSnapshot` returns current logical date; `subscribe` triggers on boundary cross; emits only on actual date change; ref-counted timer/listener setup on first subscribe and teardown on last unsubscribe; recompute on `visibilitychange`/`pageshow`/`DAY_BOUNDARY_CHANGED_EVENT`; `_resetForTesting` + injectable `Clock` (FR1, FR2, NFR-P1).
- [ ] 3.2 GREEN: implement `src/stores/logicalTodayStore.ts` mirroring `menuOrderStore.ts`, using the extracted helper and `getLogicalDate(clock, getCachedDayBoundary())` (FR1, FR2, NFR-P1).
- [ ] 3.3 Implement `src/hooks/useLogicalToday.ts` via `useSyncExternalStore(subscribe, getSnapshot)`, mirroring `useMenuOrder.ts` (FR1).

## 4. Wire consumers to the reactive date

- [ ] 4.1 `ActiveTasksPage.tsx`: add `useLogicalToday()` to `todayCompleted` `useMemo` deps (FR3).
- [ ] 4.2 `CompletedPage.tsx`: add `useLogicalToday()` to the grouping `useMemo` deps (FR4).
- [ ] 4.3 `TaskItem.tsx`: subscribe via `useLogicalToday()` so the completed-at label re-renders on rollover (FR5).
- [ ] 4.4 `GoalItem.tsx`: subscribe via `useLogicalToday()` so the date label re-renders on rollover (FR6).
- [ ] 4.5 `TaskDetailsTab.tsx`: subscribe via `useLogicalToday()` so the next-date label re-renders on rollover (FR7).

## 5. Turn the bug tests GREEN

- [ ] 5.1 Run the section-1 integration tests; confirm they now PASS (M1, M2).
- [ ] 5.2 Add integration assertions for `CompletedPage` rebucketing and for a `TaskItem`/`GoalItem` label flip across the boundary while mounted (FR4, FR5, FR6).

## 6. BDD behavior spec

- [ ] 6.1 Author `features/day_boundary_rollover.feature` with `@fix-completed-today-stale-on-day-rollover` scenarios mirroring the spec (rollover clears completed-today, custom boundary, no-emit-when-unchanged) (FR3, FR2).
- [ ] 6.2 Implement step definitions using `fakeClock` (no `vi.useFakeTimers`) (FR3).

## 7. Verification

- [ ] 7.1 axe-core check on `ActiveTasksPage` and `CompletedPage` remains green after rollover (NFR-A1).
- [ ] 7.2 `get_file_problems` on all changed files; fix errors; run `pnpm run build`.
- [ ] 7.3 Mutation testing (scoped) on `logicalTodayStore.ts`, `useLogicalToday.ts`, and the extracted helper; add tests to kill survivors; target ≥95%, minimum ≥90% (M3). Full Stryker run is delegated to the user.
