## 1. Fix todayCompleted UTC bug (FR1)

- [ ] 1.1 Write failing test: todayCompleted filters by logical date, not UTC (RED) — `ActiveTasksPage.completed.test.tsx`
- [ ] 1.2 Replace `new Date().toISOString().slice(0,10)` with `getLogicalDate(clock, dayBoundary)` in `ActiveTasksPage.tsx` (GREEN)
- [ ] 1.3 Add `clock` and `dayBoundary` to `useMemo` dependencies
- [ ] 1.4 Verify existing tests pass, run `npx vitest run src/pages/ActiveTasksPage`

## 2. Fix weekly interval drift with multiple weekdays (FR2)

- [ ] 2.1 Write failing chain test: `weekdays=[1,3], interval=2` — 6 sequential completions produce correct dates (RED) — `repeatRule.test.ts`
- [ ] 2.2 Refactor `findNextWeekday()` and `calculateNextDateWeekly()`: check remaining weekdays in current ISO week first, jump only when exhausted (GREEN)
- [ ] 2.3 Verify single-weekday tests still pass (no regression)
- [ ] 2.4 Verify all `repeatRule*.test.ts` pass

## 3. Fix skip-logic for weekly multi-weekday (FR3)

- [ ] 3.1 Write failing test: skip-logic with `weekdays=[1,3], interval=2` and stale previousNextDate (RED)
- [ ] 3.2 Adapt skip-logic in `calculateNextDateWeekly` to use two-step weekday selection after skip-alignment (GREEN)
- [ ] 3.3 Verify all skip-logic tests pass

## 4. Fix test comments and add chain tests (FR4)

- [ ] 4.1 Fix comment on line 33: `2026-05-10` — change "Saturday" to "Sunday"
- [ ] 4.2 Fix comment on line 42: `2026-04-18` — change "Friday" to "Saturday"
- [ ] 4.3 Fix comment on line 66: `2026-04-07` — change "Monday" to "Tuesday"
- [ ] 4.4 Re-verify skip-logic test expectations against independently calculated dates; fix any incorrect asserts

## 5. Verification

- [ ] 5.1 Run full repeatRule test suite: `npx vitest run src/utils/repeatRule`
- [ ] 5.2 Run ActiveTasksPage test suite: `npx vitest run src/pages/ActiveTasksPage`
- [ ] 5.3 Run build: `pnpm run build`
- [ ] 5.4 Run mutation testing on changed files (up to 5): `cd packages/client && npx stryker run --mutate 'src/utils/repeatRule.ts,src/pages/ActiveTasksPage.tsx'` — target >= 95%
